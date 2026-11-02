"use strict";

const MAX_NAME_LENGTH = 120;
const SEQUENCE_PATH = "meta/onlineCustomerSequence";
const PHONE_INDEX_COLLECTION = "customerPhoneIndex";
const CUSTOMER_ID_RE = /^ONCUS\d{7}$/;

function cleanString(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}
function normalizePhone(value) {
  return typeof value === "string" ? value.replace(/[\s()-]/g, "") : "";
}
function safeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
}

function createRegisterCustomerHandler({ db, FieldValue, HttpsError }) {
  return async function registerCustomer(request) {
    if (!request.auth || !request.auth.uid) {
      throw new HttpsError("unauthenticated", "Authentication required to register.");
    }

    const uid = request.auth.uid;
    const claims = request.auth.token || {};
    const verifiedPhone = normalizePhone(claims.phone_number);
    const provider = claims.firebase && claims.firebase.sign_in_provider;

    const fullName = cleanString(request.data && request.data.fullName, MAX_NAME_LENGTH);
    if (fullName.length < 2) throw new HttpsError("invalid-argument", "Enter a valid customer name.");

    // Support both phone auth and email/password registration
    let phoneToUse = verifiedPhone;
    if (!phoneToUse && request.data && (request.data.phone || request.data.number)) {
      phoneToUse = normalizePhone(request.data.phone || request.data.number);
    }

    const detectedCountryCode = ["+971", "+61", "+44", "+91", "+1"].find((code) => phoneToUse.startsWith(code));
    const countryCode = detectedCountryCode || (request.data && request.data.countryCode) || "+91";

    let nationalNumber = "";
    if (phoneToUse.startsWith(countryCode)) {
      nationalNumber = phoneToUse.slice(countryCode.length);
    } else {
      nationalNumber = phoneToUse.replace(/\D/g, "");
      phoneToUse = `${countryCode}${nationalNumber}`;
    }

    if (provider === "phone") {
      if (!detectedCountryCode || verifiedPhone.length <= detectedCountryCode.length) {
        throw new HttpsError("failed-precondition", "The verified phone number uses an unsupported country code or invalid E.164 format.");
      }
    }

    const email = safeEmail(claims.email || (request.data && request.data.email));
    const dob = (request.data && typeof request.data.dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(request.data.dob)) ? request.data.dob : null;
    const gender = (request.data && typeof request.data.gender === "string") ? cleanString(request.data.gender, 20) : null;
    const referredBy = (request.data && typeof request.data.referredBy === "string") ? cleanString(request.data.referredBy, 30).toUpperCase() : null;

    const mappingRef = db.collection("usersByUid").doc(uid);
    const phoneIndexRef = phoneToUse ? db.collection(PHONE_INDEX_COLLECTION).doc(phoneToUse) : null;
    const sequenceRef = db.doc(SEQUENCE_PATH);

    const existingMapping = await mappingRef.get();
    if (existingMapping.exists) {
      const mappedId = existingMapping.get("userDocId");
      const collection = existingMapping.get("collection");
      const accountType = existingMapping.get("accountType");
      const storedUid = existingMapping.get("uid");
      if ((storedUid && storedUid !== uid) || (accountType !== undefined && accountType !== "customer")) {
        throw new HttpsError("failed-precondition", "This account mapping is inconsistent or not a customer account.");
      }
      const profileCollection = collection || (typeof mappedId === "string" && mappedId.startsWith("ONCUS") ? "onlineCustomers" : "users");
      if (!((profileCollection === "onlineCustomers" && typeof mappedId === "string" && /^ONCUS\d{6,7}$/.test(mappedId)) ||
            (profileCollection === "users" && typeof mappedId === "string" && /^SASS\d{6,7}$/.test(mappedId)))) {
        throw new HttpsError("failed-precondition", "An existing customer mapping needs support review.");
      }
      const existingProfile = await db.collection(profileCollection).doc(mappedId).get();
      if (!existingProfile.exists || (existingProfile.get("uid") !== uid && !(existingProfile.get("linkedUids") || []).includes(uid)) ||
          [existingProfile.get("accountType"), existingProfile.get("userType"), existingProfile.get("role")].some((type) => type && type !== "customer")) {
        throw new HttpsError("failed-precondition", "The existing customer profile is inconsistent.");
      }
      return { ok: true, customerId: mappedId, alreadyRegistered: true };
    }

    if (nationalNumber && countryCode) {
      const legacyMatches = await db.collection("users")
        .where("number", "==", nationalNumber).where("countryCode", "==", countryCode).limit(1).get();
      const onlineMatches = phoneToUse
        ? await db.collection("onlineCustomers").where("phone", "==", phoneToUse).limit(1).get()
        : { empty: true };
      const onlineNumberMatches = await db.collection("onlineCustomers")
        .where("number", "==", nationalNumber).where("countryCode", "==", countryCode).limit(1).get();
      if (!legacyMatches.empty || !onlineMatches.empty || !onlineNumberMatches.empty) {
        throw new HttpsError("already-exists", "This mobile number is already associated with a customer. Please contact support to link the account.");
      }
    }

    return db.runTransaction(async (tx) => {
      const [mappingSnap, phoneIndexSnap, sequenceSnap] = await Promise.all([
        tx.get(mappingRef),
        phoneIndexRef ? tx.get(phoneIndexRef) : Promise.resolve({ exists: false }),
        tx.get(sequenceRef)
      ]);
      if (mappingSnap.exists) throw new HttpsError("already-exists", "This account is already linked.");
      if (phoneIndexSnap.exists) throw new HttpsError("already-exists", "This mobile number is already associated with a customer.");
      const current = sequenceSnap.get("current");
      if (!sequenceSnap.exists || !Number.isSafeInteger(current) || current < 0) {
        throw new HttpsError("failed-precondition", "Customer ID sequence is not initialized. Set meta/onlineCustomerSequence.current to the highest existing online customer number (0 only when inventory confirms there are no online customers).");
      }
      const next = current + 1;
      if (next > 9_999_999) throw new HttpsError("failed-precondition", "Online customer ID sequence is exhausted.");
      const customerId = `ONCUS${String(next).padStart(7, "0")}`;
      const profileRef = db.collection("onlineCustomers").doc(customerId);
      if ((await tx.get(profileRef)).exists) throw new HttpsError("failed-precondition", "The next online customer ID is already in use. Reconcile the sequence before registration.");

      const now = FieldValue.serverTimestamp();
      const profileData = {
        id: customerId,
        userId: customerId,
        customerId,
        uid,
        linkedUids: [uid],
        accountType: "customer",
        role: "customer",
        fullName,
        name: fullName,
        number: nationalNumber,
        phone: phoneToUse,
        countryCode,
        phoneVerified: provider === "phone",
        email: email || null,
        smartCoins: 0,
        earnedCoins: 0,
        isVIP: false,
        createdAt: now,
        updatedAt: now,
        lastUpdated: now,
        ...(dob ? { dob } : {}),
        ...(gender ? { gender } : {}),
        ...(referredBy ? { referredBy, referredAt: now } : {}),
      };

      tx.create(profileRef, profileData);
      tx.create(mappingRef, { uid, userDocId: customerId, collection: "onlineCustomers", accountType: "customer", createdAt: now });
      // Only write to customerPhoneIndex when the phone has been verified via phone authentication
      if (phoneIndexRef && provider === "phone") {
        tx.create(phoneIndexRef, { uid, userDocId: customerId, collection: "onlineCustomers", phone: phoneToUse, createdAt: now });
      }
      tx.update(sequenceRef, { current: next, updatedAt: now });
      return { ok: true, customerId, alreadyRegistered: false };
    });
  };
}

module.exports = { createRegisterCustomerHandler, CUSTOMER_ID_RE, SEQUENCE_PATH };
