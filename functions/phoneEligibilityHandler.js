"use strict";

const crypto = require("node:crypto");
const net = require("node:net");

const E164_RE = /^\+[1-9]\d{6,14}$/;
const COUNTRY_CODES = ["+971", "+61", "+44", "+91", "+1"];
const LOOKUP_LIMIT = 10;
const LOOKUP_WINDOW_MS = 60_000;
const PHONE_LOOKUP_LIMIT = 20;
const PHONE_LOOKUP_WINDOW_MS = 60 * 60_000;

function makeError(HttpsError, code, message) {
  return new HttpsError(code, message);
}

function normalizeE164(value, HttpsError) {
  if (typeof value !== "string") {
    throw makeError(HttpsError, "invalid-argument", "Enter a valid mobile number.");
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith("+")) {
    throw makeError(
      HttpsError,
      "invalid-argument",
      "Enter the mobile number in international format.",
    );
  }
  const phone = `+${trimmed.slice(1).replace(/[\s().-]/g, "")}`;
  if (!E164_RE.test(phone)) {
    throw makeError(HttpsError, "invalid-argument", "Enter a valid mobile number.");
  }
  const countryCode = COUNTRY_CODES.find((code) => phone.startsWith(code));
  if (!countryCode || phone.length <= countryCode.length) {
    throw makeError(
      HttpsError,
      "invalid-argument",
      "The mobile number country code is not supported.",
    );
  }
  return { phone, countryCode, number: phone.slice(countryCode.length) };
}

function getDocuments(snapshot) {
  return snapshot && Array.isArray(snapshot.docs) ? snapshot.docs : [];
}

function normalizeCountryCode(value) {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function validCustomerProfile(document, phone, countryCode, number) {
  const profile = document.data();
  if (!profile || !matchesPhone(profile, phone, countryCode, number)) return false;
  if (profile.phoneVerified !== true || profile.merged === true) return false;
  if (
    [profile.accountType, profile.userType, profile.role].some(
      (value) => value && value !== "customer",
    )
  ) {
    return false;
  }
  const id = document.id || document.ref?.id;
  if (typeof id !== "string" || !/^ONCUS\d{6,7}$/i.test(id)) return false;
  if ([profile.id, profile.userId, profile.customerId].some((value) => value && value !== id))
    return false;
  return true;
}

function matchesPhone(profile, phone, countryCode, number) {
  if (!profile || typeof profile !== "object") return false;
  if (profile.countryCode && normalizeCountryCode(profile.countryCode) !== countryCode) return false;
  return (
    profile.phone === phone ||
    (profile.number === number && normalizeCountryCode(profile.countryCode) === countryCode)
  );
}

function matchesLegacyPhone(profile, phone, countryCode, number) {
  if (!profile || typeof profile !== "object") return false;
  if (profile.countryCode && normalizeCountryCode(profile.countryCode) !== countryCode) return false;
  if (profile.phone === phone) return true;
  // Legacy national numbers without a country code are ambiguous; include them
  // as a possible conflict and let the UID ownership check fail closed.
  return profile.number === number;
}

function trustedSocketIp(rawRequest) {
  const socketAddress = rawRequest && rawRequest.socket && rawRequest.socket.remoteAddress;
  if (typeof socketAddress !== "string") return null;
  const normalized = socketAddress.toLowerCase().startsWith("::ffff:")
    ? socketAddress.slice(7)
    : socketAddress;
  return net.isIP(normalized) ? normalized.toLowerCase() : null;
}

function rateLimitHash(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function phoneIndexMatches(index, uid, customerId, phone) {
  if (
    !index ||
    index.uid !== uid ||
    index.userDocId !== customerId ||
    index.collection !== "onlineCustomers" ||
    typeof index.phone !== "string"
  ) {
    return false;
  }
  try {
    return normalizeE164(index.phone, (code, message) => new Error(`${code}:${message}`)).phone === phone;
  } catch {
    return false;
  }
}

function profileOwnedByUid(profile, uid) {
  return Boolean(
    profile &&
      (profile.uid === uid || (Array.isArray(profile.linkedUids) && profile.linkedUids.includes(uid))),
  );
}

function isStaffOrAdmin(profile) {
  return [profile && profile.accountType, profile && profile.userType, profile && profile.role].some(
    (value) => value && value !== "customer",
  );
}

function createPhoneEligibilityHandler({
  db,
  auth,
  HttpsError,
  now = () => Date.now(),
}) {
  return async function checkCustomerPhoneEligibility(request) {
    const { phone, countryCode, number } = normalizeE164(
      request.data && request.data.phoneNumber,
      HttpsError,
    );
    const ip = trustedSocketIp(request.rawRequest);
    if (!ip) {
      throw makeError(
        HttpsError,
        "unavailable",
        "Mobile number eligibility cannot be checked right now.",
      );
    }

    const rateLimitId = rateLimitHash(ip);
    const phoneLimitId = rateLimitHash(phone);
    const rateLimitCollection = db.collection("phoneLookupRateLimits");
    const rateLimitRef = rateLimitCollection.doc(`v2_ip_${rateLimitId}`);
    const phoneLimitRef = rateLimitCollection.doc(`v2_phone_${phoneLimitId}`);
    const currentTime = now();
    try {
      await db.runTransaction(async (transaction) => {
        const [ipSnapshot, phoneSnapshot] = await Promise.all([
          transaction.get(rateLimitRef),
          transaction.get(phoneLimitRef),
        ]);
        const ipRecord = ipSnapshot.exists ? ipSnapshot.data() : {};
        const phoneRecord = phoneSnapshot.exists ? phoneSnapshot.data() : {};
        const ipInWindow =
          Number.isFinite(ipRecord.windowStartedAt) &&
          currentTime - ipRecord.windowStartedAt < LOOKUP_WINDOW_MS;
        const phoneInWindow =
          Number.isFinite(phoneRecord.windowStartedAt) &&
          currentTime - phoneRecord.windowStartedAt < PHONE_LOOKUP_WINDOW_MS;
        if ((ipInWindow ? ipRecord.count || 0 : 0) >= LOOKUP_LIMIT) {
          throw makeError(
            HttpsError,
            "resource-exhausted",
            "Too many mobile number checks. Wait a minute before trying again.",
          );
        }
        if ((phoneInWindow ? phoneRecord.count || 0 : 0) >= PHONE_LOOKUP_LIMIT) {
          throw makeError(
            HttpsError,
            "resource-exhausted",
            "Too many checks for this mobile number. Try again later.",
          );
        }
        transaction.set(
          rateLimitRef,
          {
            windowStartedAt: ipInWindow ? ipRecord.windowStartedAt : currentTime,
            count: (ipInWindow ? ipRecord.count || 0 : 0) + 1,
            expiresAt: new Date(currentTime + LOOKUP_WINDOW_MS * 2),
          },
          { merge: true },
        );
        transaction.set(
          phoneLimitRef,
          {
            windowStartedAt: phoneInWindow ? phoneRecord.windowStartedAt : currentTime,
            count: (phoneInWindow ? phoneRecord.count || 0 : 0) + 1,
            expiresAt: new Date(currentTime + PHONE_LOOKUP_WINDOW_MS * 2),
          },
          { merge: true },
        );
      });
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      throw makeError(
        HttpsError,
        "unavailable",
        "Mobile number eligibility cannot be checked right now.",
      );
    }

    let authOwner;
    try {
      authOwner = await auth.getUserByPhoneNumber(phone);
    } catch (error) {
      if (error && error.code === "auth/user-not-found") return { eligible: false };
      throw makeError(
        HttpsError,
        "unavailable",
        "Mobile number eligibility cannot be checked right now.",
      );
    }
    if (!authOwner || authOwner.phoneNumber !== phone) return { eligible: false };

    let indexSnapshot;
    let mappingSnapshot;
    let matchingProfiles;
    let matchingLegacyProfiles;
    try {
      const indexRef = db.collection("customerPhoneIndex").doc(phone);
      const mappingRef = db.collection("usersByUid").doc(authOwner.uid);
      const [
        indexResult,
        mappingResult,
        phoneQuery,
        numberQuery,
        legacyPhoneQuery,
        legacyNumberQuery,
      ] = await Promise.all([
        indexRef.get(),
        mappingRef.get(),
        db.collection("onlineCustomers").where("phone", "==", phone).get(),
        db.collection("onlineCustomers").where("number", "==", number).get(),
        db.collection("users").where("phone", "==", phone).get(),
        db.collection("users").where("number", "==", number).get(),
      ]);
      indexSnapshot = indexResult;
      mappingSnapshot = mappingResult;
      const byId = new Map();
      for (const profile of [...getDocuments(phoneQuery), ...getDocuments(numberQuery)]) {
        const profileData = profile.data();
        if (matchesPhone(profileData, phone, countryCode, number)) byId.set(profile.id, profile);
      }
      matchingProfiles = [...byId.values()];
      const legacyById = new Map();
      for (const legacyProfile of [
        ...getDocuments(legacyPhoneQuery),
        ...getDocuments(legacyNumberQuery),
      ]) {
        if (matchesLegacyPhone(legacyProfile.data(), phone, countryCode, number)) {
          legacyById.set(legacyProfile.id, legacyProfile);
        }
      }
      matchingLegacyProfiles = [...legacyById.values()];
    } catch {
      throw makeError(
        HttpsError,
        "unavailable",
        "Mobile number eligibility cannot be checked right now.",
      );
    }

    if (
      matchingProfiles.length !== 1 ||
      !mappingSnapshot.exists ||
      !validCustomerProfile(matchingProfiles[0], phone, countryCode, number)
    )
      return { eligible: false };
    const profileSnapshot = matchingProfiles[0];
    const customerId = profileSnapshot.id;
    const mapping = mappingSnapshot.data();
    const profile = profileSnapshot.data();
    if (
      (mapping.uid && mapping.uid !== authOwner.uid) ||
      (mapping.userDocId || mapping.customerId) !== customerId ||
      (mapping.collection && mapping.collection !== "onlineCustomers") ||
      (mapping.accountType && mapping.accountType !== "customer") ||
      (profile.uid !== authOwner.uid &&
        !(Array.isArray(profile.linkedUids) && profile.linkedUids.includes(authOwner.uid)))
    ) {
      return { eligible: false };
    }
    // A matching legacy record is acceptable only when it clearly belongs to
    // this same Firebase UID. Unknown ownership is ambiguous and fails closed.
    if (
      matchingLegacyProfiles.some(
        (legacyProfile) =>
          !profileOwnedByUid(legacyProfile.data(), authOwner.uid) ||
          isStaffOrAdmin(legacyProfile.data()),
      )
    ) {
      return { eligible: false };
    }
    if (!indexSnapshot.exists) return { eligible: false };
    const index = indexSnapshot.data();
    if (!phoneIndexMatches(index, authOwner.uid, customerId, phone)) return { eligible: false };
    return { eligible: true };
  };
}

module.exports = {
  createPhoneEligibilityHandler,
  normalizeE164,
  LOOKUP_LIMIT,
  LOOKUP_WINDOW_MS,
  PHONE_LOOKUP_LIMIT,
  PHONE_LOOKUP_WINDOW_MS,
  trustedSocketIp,
  rateLimitHash,
  phoneIndexMatches,
  matchesLegacyPhone,
};
