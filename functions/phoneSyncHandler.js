"use strict";

const E164_RE = /^\+[1-9]\d{6,14}$/;
const CUSTOMER_ID_RE = /^ONCUS\d{6,7}$/;
const COUNTRY_CODES = ["+971", "+61", "+44", "+91", "+1"];

function makeError(HttpsError, code, message) {
  return new HttpsError(code, message);
}

function getPhoneParts(phone, HttpsError) {
  if (typeof phone !== "string" || !E164_RE.test(phone)) {
    throw makeError(
      HttpsError,
      "invalid-argument",
      "A valid confirmed E.164 phone number is required.",
    );
  }
  const countryCode = COUNTRY_CODES.find((code) => phone.startsWith(code));
  if (!countryCode || phone.length <= countryCode.length) {
    throw makeError(
      HttpsError,
      "invalid-argument",
      "The phone number country code is not supported.",
    );
  }
  return { countryCode, number: phone.slice(countryCode.length) };
}

function profileBelongsToCustomer(data, uid) {
  if (!data || typeof data !== "object") return false;
  if (data.uid === uid || (Array.isArray(data.linkedUids) && data.linkedUids.includes(uid)))
    return true;
  return false;
}

function snapshotDocs(snapshot) {
  return snapshot && Array.isArray(snapshot.docs) ? snapshot.docs : [];
}

function normalizeCountryCode(value) {
  if (typeof value !== "string") return "";
  const digits = value.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function createUpdateCustomerVerifiedPhoneHandler({ db, auth, HttpsError, FieldValue }) {
  return async function updateCustomerVerifiedPhone(request) {
    if (!request.auth || typeof request.auth.uid !== "string" || !request.auth.uid) {
      throw makeError(HttpsError, "unauthenticated", "Authentication is required.");
    }
    const uid = request.auth.uid;
    const phone = request.data && request.data.verifiedE164Phone;
    const { countryCode, number } = getPhoneParts(phone, HttpsError);

    let authUser;
    let phoneOwner;
    try {
      [authUser, phoneOwner] = await Promise.all([
        auth.getUser(uid),
        auth.getUserByPhoneNumber(phone),
      ]);
    } catch (error) {
      if (error && error.code === "auth/user-not-found") {
        throw makeError(
          HttpsError,
          "failed-precondition",
          "Firebase Auth does not confirm this phone for the signed-in account.",
        );
      }
      throw makeError(HttpsError, "internal", "Phone ownership could not be verified.");
    }
    if (!authUser || authUser.phoneNumber !== phone || !phoneOwner || phoneOwner.uid !== uid) {
      throw makeError(
        HttpsError,
        "failed-precondition",
        "Firebase Auth does not confirm this phone for the signed-in account.",
      );
    }

    const mappingRef = db.collection("usersByUid").doc(uid);
    let mappingSnapshot;
    try {
      mappingSnapshot = await mappingRef.get();
    } catch {
      throw makeError(HttpsError, "internal", "Customer identity could not be verified.");
    }
    if (!mappingSnapshot.exists) {
      throw makeError(
        HttpsError,
        "failed-precondition",
        "The customer identity mapping is missing.",
      );
    }
    const mapping = mappingSnapshot.data();
    const customerId = mapping.userDocId || mapping.customerId;
    if (
      (mapping.uid && mapping.uid !== uid) ||
      (mapping.collection && mapping.collection !== "onlineCustomers") ||
      (mapping.accountType && mapping.accountType !== "customer") ||
      typeof customerId !== "string" ||
      !CUSTOMER_ID_RE.test(customerId)
    ) {
      throw makeError(
        HttpsError,
        "failed-precondition",
        "The customer identity mapping is invalid.",
      );
    }

    const profileRef = db.collection("onlineCustomers").doc(customerId);
    const indexRef = db.collection("customerPhoneIndex").doc(phone);
    const now = FieldValue.serverTimestamp();

    try {
      return await db.runTransaction(async (transaction) => {
        const [
          transactionMappingSnapshot,
          profileSnapshot,
          indexSnapshot,
          legacyNumberQuery,
          legacyPhoneQuery,
          onlinePhoneQuery,
          onlineNumberQuery,
        ] = await Promise.all([
          transaction.get(mappingRef),
          transaction.get(profileRef),
          transaction.get(indexRef),
          transaction.get(db.collection("users").where("number", "==", number)),
          transaction.get(db.collection("users").where("phone", "==", phone)),
          transaction.get(db.collection("onlineCustomers").where("phone", "==", phone)),
          transaction.get(db.collection("onlineCustomers").where("number", "==", number)),
        ]);

        if (!transactionMappingSnapshot.exists) {
          throw makeError(
            HttpsError,
            "failed-precondition",
            "The customer identity mapping is missing.",
          );
        }
        const transactionMapping = transactionMappingSnapshot.data();
        if (
          (transactionMapping.uid && transactionMapping.uid !== uid) ||
          (transactionMapping.userDocId || transactionMapping.customerId) !== customerId ||
          (transactionMapping.collection && transactionMapping.collection !== "onlineCustomers") ||
          (transactionMapping.accountType && transactionMapping.accountType !== "customer")
        ) {
          throw makeError(
            HttpsError,
            "failed-precondition",
            "The customer identity mapping changed during synchronization.",
          );
        }

        if (!profileSnapshot.exists) {
          throw makeError(
            HttpsError,
            "failed-precondition",
            "The mapped customer profile is missing.",
          );
        }
        const profile = profileSnapshot.data();
        if (!profileBelongsToCustomer(profile, uid)) {
          throw makeError(
            HttpsError,
            "permission-denied",
            "The customer profile is not owned by this account.",
          );
        }
        if (
          [profile.accountType, profile.userType, profile.role].some(
            (value) => value && value !== "customer",
          ) ||
          profile.merged === true
        ) {
          throw makeError(
            HttpsError,
            "failed-precondition",
            "The mapped profile is not an active customer profile.",
          );
        }

        if (indexSnapshot.exists) {
          const index = indexSnapshot.data();
          if (index.uid !== uid || index.userDocId !== customerId) {
            throw makeError(
              HttpsError,
              "already-exists",
              "This phone number is associated with another customer.",
            );
          }
        }

        const matchingRecords = [
          ...snapshotDocs(legacyPhoneQuery),
          ...snapshotDocs(legacyNumberQuery).filter(
            (record) =>
              !record.data().countryCode ||
              normalizeCountryCode(record.data().countryCode) === countryCode,
          ),
          ...snapshotDocs(onlinePhoneQuery),
          ...snapshotDocs(onlineNumberQuery).filter(
            (record) =>
              !record.data().countryCode ||
              normalizeCountryCode(record.data().countryCode) === countryCode,
          ),
        ];
        for (const record of matchingRecords) {
          const sameOnlineProfile =
            record.ref && record.ref.path === `onlineCustomers/${customerId}`;
          if (!sameOnlineProfile && !profileBelongsToCustomer(record.data(), uid)) {
            throw makeError(
              HttpsError,
              "already-exists",
              "This phone number is associated with another customer.",
            );
          }
        }

        const previousPhone =
          typeof profile.phone === "string" && E164_RE.test(profile.phone) ? profile.phone : null;
        let previousIndexSnapshot = null;
        let previousIndexRef = null;
        if (previousPhone && previousPhone !== phone) {
          previousIndexRef = db.collection("customerPhoneIndex").doc(previousPhone);
          previousIndexSnapshot = await transaction.get(previousIndexRef);
        }

        const update = {
          phone,
          number,
          countryCode,
          phoneVerified: true,
          updatedAt: now,
          lastUpdated: now,
        };
        transaction.set(profileRef, update, { merge: true });
        transaction.set(
          indexRef,
          {
            uid,
            userDocId: customerId,
            collection: "onlineCustomers",
            phone,
            updatedAt: now,
            ...(indexSnapshot.exists ? {} : { createdAt: now }),
          },
          { merge: true },
        );

        if (previousIndexSnapshot && previousIndexSnapshot.exists) {
          const previousIndex = previousIndexSnapshot.data();
          if (previousIndex.uid === uid && previousIndex.userDocId === customerId) {
            transaction.delete(previousIndexRef);
          }
        }
        return { ok: true };
      });
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      throw makeError(
        HttpsError,
        "internal",
        "Phone synchronization could not be completed. Retry without requesting another OTP.",
      );
    }
  };
}

module.exports = { createUpdateCustomerVerifiedPhoneHandler, E164_RE, CUSTOMER_ID_RE };
