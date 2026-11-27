"use strict";

const crypto = require("node:crypto");
const net = require("node:net");

const CHALLENGE_TTL_MS = 10 * 60_000;
const IP_LIMIT = 10;
const IP_WINDOW_MS = 10 * 60_000;
const EMAIL_LIMIT = 5;
const EMAIL_WINDOW_MS = 60 * 60_000;
const E164_RE = /^\+[1-9]\d{6,14}$/;

function makeError(HttpsError, code, message) {
  return new HttpsError(code, message);
}

function sha256(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function clientIp(request) {
  const raw = request && request.rawRequest && request.rawRequest.socket && request.rawRequest.socket.remoteAddress;
  if (typeof raw !== "string") return null;
  const ip = raw.toLowerCase().startsWith("::ffff:") ? raw.slice(7) : raw;
  return net.isIP(ip) ? ip.toLowerCase() : null;
}

function cleanEmail(value) {
  if (typeof value !== "string") return "";
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "";
  return email;
}

function normalizedPhone(value) {
  if (typeof value !== "string") return "";
  const phone = `+${value.replace(/\D/g, "")}`;
  return E164_RE.test(phone) ? phone : "";
}

async function createSignInToken(auth, uid, authEmulatorHost) {
  if (!authEmulatorHost) return auth.createCustomToken(uid);
  // The Auth Emulator accepts unsigned custom JWTs and never accepts this path
  // in production. This keeps local email-to-phone OTP usable without a service
  // account key on developer machines.
  const projectId = auth.app && auth.app.options && auth.app.options.projectId
    ? auth.app.options.projectId
    : process.env.GCLOUD_PROJECT || "demo-sri-amman-store";
  const nowSeconds = Math.floor(Date.now() / 1000);
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "none", typ: "JWT" });
  const payload = encode({
    iss: `firebase-adminsdk@${projectId}.iam.gserviceaccount.com`,
    sub: `firebase-adminsdk@${projectId}.iam.gserviceaccount.com`,
    aud: "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit",
    iat: nowSeconds,
    exp: nowSeconds + 3600,
    uid,
  });
  return `${header}.${payload}.`;
}

function isCustomer(profile) {
  return profile &&
    profile.phoneVerified === true &&
    profile.merged !== true &&
    ![profile.accountType, profile.userType, profile.role].some((role) => role && role !== "customer");
}

async function findVerifiedCustomerByEmail({ db, auth, email }) {
  const [online, legacy] = await Promise.all([
    db.collection("onlineCustomers").where("email", "==", email).limit(2).get(),
    db.collection("users").where("email", "==", email).limit(2).get(),
  ]);
  const candidates = [
    ...online.docs.map((doc) => ({ collection: "onlineCustomers", doc })),
    ...legacy.docs.map((doc) => ({ collection: "users", doc })),
  ];
  if (candidates.length !== 1) return null;

  const { collection, doc } = candidates[0];
  const profile = doc.data();
  const phone = normalizedPhone(profile.phone);
  if (!isCustomer(profile) || !phone || cleanEmail(profile.email) !== email) return null;

  let uid = typeof profile.uid === "string" ? profile.uid : "";
  if (!uid) {
    const mappings = await db.collection("usersByUid").where("userDocId", "==", doc.id).limit(2).get();
    if (mappings.size !== 1) return null;
    uid = mappings.docs[0].id;
  }

  const [mappingSnapshot, authUser, phoneOwner] = await Promise.all([
    db.collection("usersByUid").doc(uid).get(),
    auth.getUser(uid),
    auth.getUserByPhoneNumber(phone),
  ]);
  if (!mappingSnapshot.exists) return null;
  const mapping = mappingSnapshot.data();
  const mappedId = mapping.userDocId || mapping.customerId;
  const mappedCollection = mapping.collection || (String(mappedId || "").toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users");
  if (
    (mapping.uid && mapping.uid !== uid) ||
    mappedId !== doc.id ||
    mappedCollection !== collection ||
    (mapping.accountType && mapping.accountType !== "customer") ||
    authUser.uid !== uid ||
    cleanEmail(authUser.email) !== email ||
    authUser.emailVerified !== true ||
    authUser.phoneNumber !== phone ||
    phoneOwner.uid !== uid
  ) return null;

  if (collection === "onlineCustomers") {
    const phoneIndex = await db.collection("customerPhoneIndex").doc(phone).get();
    if (!phoneIndex.exists) return null;
    const index = phoneIndex.data();
    if (index.uid !== uid || index.userDocId !== doc.id || index.collection !== collection || index.phone !== phone) {
      return null;
    }
  }

  return { uid, phone };
}

async function enforceRequestLimits({ db, HttpsError, emailHash, ipHash, now }) {
  const ipRef = db.collection("emailOtpRateLimits").doc(`ip_${ipHash}`);
  const emailRef = db.collection("emailOtpRateLimits").doc(`email_${emailHash}`);
  await db.runTransaction(async (tx) => {
    const [ipSnapshot, emailSnapshot] = await Promise.all([tx.get(ipRef), tx.get(emailRef)]);
    const ipRecord = ipSnapshot.exists ? ipSnapshot.data() : {};
    const emailRecord = emailSnapshot.exists ? emailSnapshot.data() : {};
    const ipActive = Number.isFinite(ipRecord.windowStartedAt) && now - ipRecord.windowStartedAt < IP_WINDOW_MS;
    const emailActive = Number.isFinite(emailRecord.windowStartedAt) && now - emailRecord.windowStartedAt < EMAIL_WINDOW_MS;
    if ((ipActive ? ipRecord.count || 0 : 0) >= IP_LIMIT || (emailActive ? emailRecord.count || 0 : 0) >= EMAIL_LIMIT) {
      throw makeError(HttpsError, "resource-exhausted", "Too many code requests. Please wait before trying again.");
    }
    tx.set(ipRef, {
      windowStartedAt: ipActive ? ipRecord.windowStartedAt : now,
      count: (ipActive ? ipRecord.count || 0 : 0) + 1,
      expiresAt: new Date(now + IP_WINDOW_MS * 2),
    }, { merge: true });
    tx.set(emailRef, {
      windowStartedAt: emailActive ? emailRecord.windowStartedAt : now,
      count: (emailActive ? emailRecord.count || 0 : 0) + 1,
      expiresAt: new Date(now + EMAIL_WINDOW_MS * 2),
    }, { merge: true });
  });
}

function createEmailPhoneOtpHandlers({
  db,
  auth,
  HttpsError,
  fetchFn = fetch,
  now = () => Date.now(),
  authEmulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST || "",
  webApiKey = process.env.IDENTITY_TOOLKIT_WEB_API_KEY || "",
}) {
  function getWebApiKey() {
    return typeof webApiKey === "function" ? webApiKey() : webApiKey;
  }

  function identityToolkitUrl(method, apiKey) {
    const host = authEmulatorHost.replace(/^https?:\/\//i, "").replace(/\/$/, "");
    const base = host
      ? `http://${host}/identitytoolkit.googleapis.com/v1/${method}`
      : `https://identitytoolkit.googleapis.com/v1/${method}`;
    return `${base}?key=${encodeURIComponent(apiKey)}`;
  }

  async function requestEmailPhoneOtp(request) {
    const email = cleanEmail(request.data && request.data.email);
    const apiKey = getWebApiKey();
    const recaptchaToken = typeof (request.data && request.data.recaptchaToken) === "string"
      ? request.data.recaptchaToken.trim()
      : "";
    const ip = clientIp(request);
    if (!email || !apiKey || apiKey.length > 256 || !recaptchaToken || recaptchaToken.length > 10_000 || !ip) {
      throw makeError(HttpsError, "invalid-argument", "Enter a valid email and complete app verification.");
    }

    const emailHash = sha256(email);
    await enforceRequestLimits({ db, HttpsError, emailHash, ipHash: sha256(ip), now: now() });

    let customer = null;
    try {
      customer = await findVerifiedCustomerByEmail({ db, auth, email });
    } catch {
      // Do not disclose customer lookup or account state to the caller.
    }

    const challengeId = crypto.randomUUID();
    const challenge = {
      emailHash,
      eligible: false,
      attempts: 0,
      expiresAt: new Date(now() + CHALLENGE_TTL_MS),
      createdAt: new Date(now()),
    };

    if (customer) {
      try {
        const response = await fetchFn(
          identityToolkitUrl("accounts:sendVerificationCode", apiKey),
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ phoneNumber: customer.phone, recaptchaToken }),
          },
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok || typeof result.sessionInfo !== "string") {
          throw new Error("Firebase did not create an SMS verification session.");
        }
        Object.assign(challenge, {
          eligible: true,
          uid: customer.uid,
          phoneHash: sha256(customer.phone),
          sessionInfo: result.sessionInfo,
        });
      } catch {
        // Keep the response generic so account lookup failures are not exposed.
      }
    }

    await db.collection("emailPhoneOtpChallenges").doc(challengeId).set(challenge);
    return { challengeId, message: "If this email is eligible, a code has been sent to its registered phone." };
  }

  async function verifyEmailPhoneOtp(request) {
    const challengeId = typeof (request.data && request.data.challengeId) === "string"
      ? request.data.challengeId.trim()
      : "";
    const code = typeof (request.data && request.data.code) === "string"
      ? request.data.code.trim()
      : "";
    if (!/^[0-9a-f-]{36}$/i.test(challengeId) || !/^\d{6}$/.test(code)) {
      throw makeError(HttpsError, "invalid-argument", "The code is invalid or expired.");
    }

    const challengeRef = db.collection("emailPhoneOtpChallenges").doc(challengeId);
    let challenge;
    try {
      await db.runTransaction(async (tx) => {
        const snapshot = await tx.get(challengeRef);
        if (!snapshot.exists) return;
        const value = snapshot.data();
        const attempts = value.attempts || 0;
        if (attempts < 5) tx.update(challengeRef, { attempts: attempts + 1 });
        challenge = { ...value, attempts: attempts + 1 };
        const expiresAt = value.expiresAt && typeof value.expiresAt.toMillis === "function"
          ? value.expiresAt.toMillis()
          : new Date(value.expiresAt).getTime();
        challenge.expired = expiresAt <= now();
      });
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      throw makeError(HttpsError, "unavailable", "Could not verify the code. Please try again.");
    }
    if (!challenge || !challenge.eligible || !challenge.sessionInfo || challenge.expired || challenge.attempts > 5) {
      throw makeError(HttpsError, "invalid-argument", "The code is invalid or expired.");
    }

    const apiKey = getWebApiKey();
    if (!apiKey || apiKey.length > 256) throw makeError(HttpsError, "failed-precondition", "Phone OTP is not configured on the server.");

    try {
      const response = await fetchFn(
        identityToolkitUrl("accounts:signInWithPhoneNumber", apiKey),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionInfo: challenge.sessionInfo, code }),
        },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.localId !== challenge.uid) {
        throw makeError(HttpsError, "invalid-argument", "The code is invalid or expired.");
      }
      const user = await auth.getUser(result.localId);
      if (!user.phoneNumber || sha256(user.phoneNumber) !== challenge.phoneHash) {
        throw makeError(HttpsError, "permission-denied", "The account could not be verified.");
      }
      const customToken = await createSignInToken(auth, user.uid, authEmulatorHost);
      await challengeRef.delete();
      return { customToken };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      throw makeError(HttpsError, "invalid-argument", "The code is invalid or expired.");
    }
  }

  return { requestEmailPhoneOtp, verifyEmailPhoneOtp };
}

module.exports = { createEmailPhoneOtpHandlers, cleanEmail, normalizedPhone, findVerifiedCustomerByEmail, createSignInToken };
