"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createUpdateCustomerVerifiedPhoneHandler } = require("./phoneSyncHandler");

class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const UID = "customer-uid-1";
const CUSTOMER_ID = "ONCUS0000042";
const PHONE = "+919876543210";
const SERVER_TIME = { serverTimestamp: true };

function snap(path, data) {
  return {
    exists: Boolean(data),
    id: path.split("/").pop(),
    ref: { path },
    data: () => data,
    get: (key) => data && data[key],
  };
}

function makeDb(initial = {}, options = {}) {
  const docs = new Map(Object.entries(initial));
  let attempts = 0;
  const ref = (path) => ({ path, get: async () => snap(path, docs.get(path)) });
  const query = (collection, filters = []) => ({
    where(field, _op, value) {
      return query(collection, [...filters, [field, value]]);
    },
    async get() {
      const matches = [...docs.entries()]
        .filter(
          ([path, data]) =>
            path.startsWith(`${collection}/`) &&
            filters.every(([field, value]) => data[field] === value),
        )
        .map(([path, data]) => snap(path, data));
      return { docs: matches, empty: matches.length === 0 };
    },
  });
  const db = {
    collection(name) {
      return {
        doc: (id) => ref(`${name}/${id}`),
        where: (field, op, value) => query(name).where(field, op, value),
      };
    },
    async runTransaction(callback) {
      attempts++;
      const writes = [];
      const tx = {
        async get(target) {
          if (target.path) return snap(target.path, docs.get(target.path));
          return target.get();
        },
        set(target, data, options = {}) {
          writes.push(["set", target.path, data, options]);
        },
        delete(target) {
          writes.push(["delete", target.path]);
        },
      };
      const result = await callback(tx);
      if (options.failFirstTransaction && attempts === 1)
        throw new Error("transient transaction failure");
      if (options.retryOnce && attempts === 1) return callback(tx);
      for (const [kind, path, data, setOptions] of writes) {
        if (kind === "delete") docs.delete(path);
        else docs.set(path, setOptions.merge ? { ...docs.get(path), ...data } : data);
      }
      return result;
    },
  };
  return {
    db,
    docs,
    get attempts() {
      return attempts;
    },
  };
}

function initialDocs(overrides = {}) {
  return {
    [`usersByUid/${UID}`]: {
      uid: UID,
      userDocId: CUSTOMER_ID,
      collection: "onlineCustomers",
      accountType: "customer",
    },
    [`onlineCustomers/${CUSTOMER_ID}`]: {
      id: CUSTOMER_ID,
      userId: CUSTOMER_ID,
      uid: UID,
      linkedUids: [UID],
      accountType: "customer",
      phone: "+919811122233",
      number: "9811122233",
      countryCode: "+91",
      phoneVerified: false,
      smartCoins: 81,
      addresses: ["keep"],
    },
    ...overrides,
  };
}

function createHandler(fake, authOverrides = {}) {
  const auth = {
    getUser: async (uid) => ({ uid, phoneNumber: PHONE }),
    getUserByPhoneNumber: async () => ({ uid: UID, phoneNumber: PHONE }),
    ...authOverrides,
  };
  const handler = createUpdateCustomerVerifiedPhoneHandler({
    db: fake.db,
    auth,
    HttpsError,
    FieldValue: { serverTimestamp: () => SERVER_TIME },
  });
  return (request = { auth: { uid: UID }, data: { verifiedE164Phone: PHONE } }) => handler(request);
}

test("updates only the authenticated customer's profile and index", async () => {
  const fake = makeDb(initialDocs());
  const result = await createHandler(fake)();
  assert.deepEqual(result, { ok: true });
  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).phone, PHONE);
  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).phoneVerified, true);
  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).smartCoins, 81);
  assert.deepEqual(fake.docs.get(`customerPhoneIndex/${PHONE}`), {
    uid: UID,
    userDocId: CUSTOMER_ID,
    collection: "onlineCustomers",
    phone: PHONE,
    updatedAt: SERVER_TIME,
    createdAt: SERVER_TIME,
  });
});

test("rejects a missing or incorrect UID mapping", async () => {
  const missing = makeDb(initialDocs({ [`usersByUid/${UID}`]: undefined }));
  missing.docs.delete(`usersByUid/${UID}`);
  await assert.rejects(createHandler(missing)(), (error) => error.code === "failed-precondition");

  const incorrect = makeDb(
    initialDocs({
      [`usersByUid/${UID}`]: {
        uid: "other-uid",
        userDocId: CUSTOMER_ID,
        collection: "onlineCustomers",
        accountType: "customer",
      },
    }),
  );
  await assert.rejects(createHandler(incorrect)(), (error) => error.code === "failed-precondition");
});

test("rejects profile ownership mismatch", async () => {
  const fake = makeDb(
    initialDocs({
      [`onlineCustomers/${CUSTOMER_ID}`]: {
        id: CUSTOMER_ID,
        uid: "other-uid",
        accountType: "customer",
      },
    }),
  );
  await assert.rejects(createHandler(fake)(), (error) => error.code === "permission-denied");
});

test("rejects a phone index owned by another customer", async () => {
  const fake = makeDb(
    initialDocs({
      [`customerPhoneIndex/${PHONE}`]: { uid: "other-uid", userDocId: "ONCUS0000999" },
    }),
  );
  await assert.rejects(createHandler(fake)(), (error) => error.code === "already-exists");
});

test("rejects a duplicate phone in a legacy customer record owned by another UID", async () => {
  const fake = makeDb(
    initialDocs({
      "users/SASS0000018": { number: "9876543210", countryCode: "+91", uid: "other-uid" },
    }),
  );
  await assert.rejects(createHandler(fake)(), (error) => error.code === "already-exists");
});

test("rejects a phone currently linked to a different Firebase Auth UID", async () => {
  const fake = makeDb(initialDocs());
  const handler = createHandler(fake, {
    getUserByPhoneNumber: async () => ({ uid: "other-uid", phoneNumber: PHONE }),
  });
  await assert.rejects(handler(), (error) => error.code === "failed-precondition");
});

test("rejects missing authentication and invalid E.164 input", async () => {
  const fake = makeDb(initialDocs());
  const handler = createHandler(fake);
  await assert.rejects(
    handler({ data: { verifiedE164Phone: PHONE } }),
    (error) => error.code === "unauthenticated",
  );
  await assert.rejects(
    handler({ auth: { uid: UID }, data: { verifiedE164Phone: "9876543210" } }),
    (error) => error.code === "invalid-argument",
  );
});

test("a transaction failure commits neither profile nor index; a retry succeeds", async () => {
  const fake = makeDb(initialDocs(), { failFirstTransaction: true });
  const handler = createHandler(fake);
  await assert.rejects(handler(), (error) => error.code === "internal");
  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).phone, "+919811122233");
  assert.equal(fake.docs.has(`customerPhoneIndex/${PHONE}`), false);
  await handler();
  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).phone, PHONE);
  assert.equal(fake.docs.has(`customerPhoneIndex/${PHONE}`), true);
});

test("repeated synchronization is idempotent", async () => {
  const fake = makeDb(initialDocs());
  const handler = createHandler(fake);
  await handler();
  await handler();
  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).phone, PHONE);
  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).phoneVerified, true);
  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).smartCoins, 81);
});

test("replaces the old phone and deletes only its matching owned index atomically", async () => {
  const oldPhone = "+919811122233";
  const fake = makeDb(
    initialDocs({
      [`onlineCustomers/${CUSTOMER_ID}`]: {
        ...initialDocs()[`onlineCustomers/${CUSTOMER_ID}`],
        phone: oldPhone,
        number: "9811122233",
        countryCode: "+91",
      },
      [`customerPhoneIndex/${oldPhone}`]: {
        uid: UID,
        userDocId: CUSTOMER_ID,
        collection: "onlineCustomers",
        phone: oldPhone,
      },
    }),
  );

  await createHandler(fake)();

  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).phone, PHONE);
  assert.equal(fake.docs.has(`customerPhoneIndex/${oldPhone}`), false);
  assert.equal(fake.docs.get(`customerPhoneIndex/${PHONE}`).uid, UID);
});

test("preserves an old phone index that does not belong to this customer", async () => {
  const oldPhone = "+919811122233";
  const fake = makeDb(
    initialDocs({
      [`onlineCustomers/${CUSTOMER_ID}`]: {
        ...initialDocs()[`onlineCustomers/${CUSTOMER_ID}`],
        phone: oldPhone,
      },
      [`customerPhoneIndex/${oldPhone}`]: {
        uid: "another-uid",
        userDocId: "ONCUS0000999",
        collection: "onlineCustomers",
        phone: oldPhone,
      },
    }),
  );

  await createHandler(fake)();

  assert.equal(fake.docs.get(`customerPhoneIndex/${oldPhone}`).uid, "another-uid");
  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).phone, PHONE);
});

test("synchronizes when the prior Firestore phone differs from Firebase's confirmed phone", async () => {
  const oldPhone = "+919811122233";
  const fake = makeDb(
    initialDocs({
      [`onlineCustomers/${CUSTOMER_ID}`]: {
        ...initialDocs()[`onlineCustomers/${CUSTOMER_ID}`],
        phone: oldPhone,
      },
      [`customerPhoneIndex/${oldPhone}`]: {
        uid: UID,
        userDocId: CUSTOMER_ID,
        collection: "onlineCustomers",
        phone: oldPhone,
      },
    }),
  );

  await createHandler(fake)();

  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).phone, PHONE);
  assert.equal(fake.docs.has(`customerPhoneIndex/${oldPhone}`), false);
  assert.equal(fake.docs.get(`customerPhoneIndex/${PHONE}`).phone, PHONE);
});
