"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createRegisterCustomerHandler } = require("./registrationHandler");

class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
const SERVER_TIME = { serverTime: true };

function makeDb(initial = {}, retryOnce = false) {
  const docs = new Map(Object.entries(initial));
  let attempts = 0;
  const ref = (path) => ({ path, get: async () => snapshot(docs.get(path)), id: path.split("/").pop() });
  const query = (collection, filters = []) => ({
    where(field, _op, value) { return query(collection, [...filters, [field, value]]); },
    limit() { return this; },
    async get() {
      const found = [...docs.entries()].some(([path, data]) => path.startsWith(`${collection}/`) && filters.every(([field, value]) => data[field] === value));
      return { empty: !found };
    }
  });
  const db = {
    collection(name) {
      return { doc(id) { return ref(`${name}/${id}`); }, where: (field, op, value) => query(name).where(field, op, value) };
    },
    doc: ref,
    async runTransaction(callback) {
      for (;;) {
        attempts++;
        const writes = [];
        const tx = {
          get: async (documentRef) => snapshot(docs.get(documentRef.path)),
          create: (documentRef, value) => writes.push(["create", documentRef.path, value]),
          update: (documentRef, value) => writes.push(["update", documentRef.path, value])
        };
        const result = await callback(tx);
        if (retryOnce && attempts === 1) {
          docs.set("meta/onlineCustomerSequence", { current: docs.get("meta/onlineCustomerSequence").current + 1 });
          continue;
        }
        for (const [kind, path, value] of writes) {
          if (kind === "create" && docs.has(path)) throw new Error(`already exists: ${path}`);
          docs.set(path, kind === "update" ? { ...docs.get(path), ...value } : value);
        }
        return result;
      }
    }
  };
  return { db, docs, get attempts() { return attempts; } };
}
function snapshot(data) { return { exists: Boolean(data), get: (key) => data && data[key] }; }
function request(uid = "firebase-uid-1", phone = "+919876543210") {
  return { auth: { uid, token: { phone_number: phone, firebase: { sign_in_provider: "phone" }, email: "Test@Example.com" } }, data: { fullName: "Test Customer" } };
}
function handlerFor(fake) { return createRegisterCustomerHandler({ db: fake.db, FieldValue: { serverTimestamp: () => SERVER_TIME }, HttpsError }); }

test("allocates online customer profile, mapping, index, and increments the dedicated sequence", async () => {
  const fake = makeDb({ "meta/onlineCustomerSequence": { current: 40 } });
  const result = await handlerFor(fake)(request());
  assert.equal(result.customerId, "ONCUS0000041");
  assert.equal(fake.docs.get("onlineCustomers/ONCUS0000041").accountType, "customer");
  assert.equal(fake.docs.get("onlineCustomers/ONCUS0000041").smartCoins, 0);
  assert.equal(fake.docs.get("onlineCustomers/ONCUS0000041").coins, undefined);
  assert.equal(fake.docs.get("usersByUid/firebase-uid-1").collection, "onlineCustomers");
  assert.equal(fake.docs.get("usersByUid/firebase-uid-1").accountType, "customer");
  assert.equal(fake.docs.get("meta/onlineCustomerSequence").current, 41);
  assert.equal(fake.docs.has("users/ONCUS0000041"), false);
});

test("allocates the first canonical ID from a verified empty sequence of zero", async () => {
  const fake = makeDb({ "meta/onlineCustomerSequence": { current: 0 } });
  const result = await handlerFor(fake)(request());
  assert.equal(result.customerId, "ONCUS0000001");
  assert.equal(fake.docs.get("meta/onlineCustomerSequence").current, 1);
});

test("rejects a duplicate phone found in legacy or canonical customer profiles", async () => {
  for (const initial of [
    { "users/SASS0000001": { number: "9876543210", countryCode: "+91" } },
    { "onlineCustomers/ONCUS0000001": { phone: "+919876543210" } }
  ]) {
    const fake = makeDb({ "meta/onlineCustomerSequence": { current: 1 }, ...initial });
    await assert.rejects(handlerFor(fake)(request()), (error) => error.code === "already-exists");
  }
});

test("transaction retry allocates from the retried sequence snapshot", async () => {
  const fake = makeDb({ "meta/onlineCustomerSequence": { current: 40 } }, true);
  const result = await handlerFor(fake)(request());
  assert.equal(fake.attempts, 2);
  assert.equal(result.customerId, "ONCUS0000042");
  assert.equal(fake.docs.get("meta/onlineCustomerSequence").current, 42);
});

test("fails closed when the online customer sequence is absent", async () => {
  const fake = makeDb();
  await assert.rejects(handlerFor(fake)(request()), (error) => error.code === "failed-precondition");
});

test("candidate ID collision fails without advancing the sequence or creating mappings", async () => {
  const fake = makeDb({
    "meta/onlineCustomerSequence": { current: 40 },
    "onlineCustomers/ONCUS0000041": { id: "ONCUS0000041", accountType: "customer" }
  });
  await assert.rejects(handlerFor(fake)(request()), (error) => error.code === "failed-precondition");
  assert.equal(fake.docs.get("meta/onlineCustomerSequence").current, 40);
  assert.equal(fake.docs.has("usersByUid/firebase-uid-1"), false);
  assert.equal(fake.docs.has("customerPhoneIndex/+919876543210"), false);
});

test("supports email/password registration with dob, gender, and referral code without phone OTP", async () => {
  const fake = makeDb({ "meta/onlineCustomerSequence": { current: 50 } });
  const emailPasswordRequest = {
    auth: {
      uid: "email-auth-uid-101",
      token: {
        firebase: { sign_in_provider: "password" },
        email: "customer@sriamman.store",
      },
    },
    data: {
      fullName: "Arun Kumar",
      phone: "9876501234",
      countryCode: "+91",
      dob: "1994-08-15",
      gender: "male",
      referredBy: "SASS0000104",
    },
  };

  const result = await handlerFor(fake)(emailPasswordRequest);
  assert.equal(result.customerId, "ONCUS0000051");

  const createdProfile = fake.docs.get("onlineCustomers/ONCUS0000051");
  assert.equal(createdProfile.fullName, "Arun Kumar");
  assert.equal(createdProfile.email, "customer@sriamman.store");
  assert.equal(createdProfile.phone, "+919876501234");
  assert.equal(createdProfile.number, "9876501234");
  assert.equal(createdProfile.phoneVerified, false, "Must start with phoneVerified: false");
  assert.equal(fake.docs.has("customerPhoneIndex/+919876501234"), false, "Must NOT write unverified phone to customerPhoneIndex");
  assert.equal(createdProfile.dob, "1994-08-15");
  assert.equal(createdProfile.birthday, undefined, "Must NOT save birthday field");
  assert.equal(createdProfile.gender, "male");
  assert.equal(createdProfile.referredBy, "SASS0000104");

  const mapping = fake.docs.get("usersByUid/email-auth-uid-101");
  assert.equal(mapping.userDocId, "ONCUS0000051");
  assert.equal(mapping.collection, "onlineCustomers");
});
