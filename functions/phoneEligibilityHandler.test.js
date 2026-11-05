"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { createPhoneEligibilityHandler } = require("./phoneEligibilityHandler");

class HttpsError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const UID = "customer-uid-eligible";
const CUSTOMER_ID = "ONCUS0000042";
const PHONE = "+919876543210";

function snap(path, data) {
  return {
    exists: Boolean(data),
    id: path.split("/").pop(),
    ref: { path, id: path.split("/").pop() },
    data: () => data,
  };
}

function makeDb(initial = {}) {
  const docs = new Map(Object.entries(initial));
  let transactionQueue = Promise.resolve();
  const ref = (path) => ({
    path,
    get: async () => snap(path, docs.get(path)),
  });
  const query = (name, filters = []) => ({
    where(field, _op, value) {
      return query(name, [...filters, [field, value]]);
    },
    async get() {
      const matches = [...docs.entries()]
        .filter(
          ([path, data]) =>
            path.startsWith(`${name}/`) && filters.every(([field, value]) => data[field] === value),
        )
        .map(([path, data]) => snap(path, data));
      return { docs: matches };
    },
  });
  return {
    docs,
    collection(name) {
      return {
        doc: (id) => ref(`${name}/${id}`),
        where: (field, op, value) => query(name).where(field, op, value),
      };
    },
    async runTransaction(callback) {
      let release;
      const previousTransaction = transactionQueue;
      transactionQueue = new Promise((resolve) => {
        release = resolve;
      });
      await previousTransaction;
      try {
        const writes = [];
        const result = await callback({
          get: async (target) => snap(target.path, docs.get(target.path)),
          set: (target, value, options = {}) => writes.push([target.path, value, options]),
        });
        for (const [documentPath, value, options] of writes) {
          docs.set(
            documentPath,
            options.merge ? { ...docs.get(documentPath), ...value } : value,
          );
        }
        return result;
      } finally {
        release();
      }
    },
  };
}

function eligibleDocs(overrides = {}) {
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
      accountType: "customer",
      phone: PHONE,
      number: "9876543210",
      countryCode: "+91",
      phoneVerified: true,
    },
    [`customerPhoneIndex/${PHONE}`]: {
      uid: UID,
      userDocId: CUSTOMER_ID,
      collection: "onlineCustomers",
      phone: PHONE,
    },
    ...overrides,
  };
}

function makeHandler(db, options = {}) {
  const auth = {
    getUserByPhoneNumber: async (phoneNumber) => ({ uid: UID, phoneNumber }),
    ...options.auth,
  };
  let currentTime = options.now ?? 1_800_000_000_000;
  return {
    invoke: createPhoneEligibilityHandler({
      db,
      auth,
      HttpsError,
      now: () => currentTime,
    }),
    advanceTime(ms) {
      currentTime += ms;
    },
  };
}

function request(phoneNumber = PHONE, socketIp = "203.0.113.20", forwardedFor = "") {
  return {
    data: { phoneNumber },
    rawRequest: {
      ip: "198.51.100.99",
      headers: { "x-forwarded-for": forwardedFor },
      socket: { remoteAddress: socketIp },
    },
  };
}

test("eligibility lookup returns no customer data beyond its boolean result", async () => {
  const fake = makeDb(eligibleDocs());
  const handler = makeHandler(fake);
  assert.deepEqual(await handler.invoke(request()), { eligible: true });
  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).phoneVerified, true);
});

test("returns only eligibility for an existing verified customer owned by Firebase Auth", async () => {
  const fake = makeDb(eligibleDocs());
  const handler = makeHandler(fake);
  assert.deepEqual(await handler.invoke(request("+91 98765-43210")), { eligible: true });
  assert.equal(fake.docs.get(`onlineCustomers/${CUSTOMER_ID}`).phoneVerified, true);
});

test("hashes the normalized E.164 phone consistently", async () => {
  const fake = makeDb(eligibleDocs());
  const handler = makeHandler(fake);
  assert.deepEqual(await handler.invoke(request(PHONE)), { eligible: true });
  assert.deepEqual(await handler.invoke(request("+91 98765-43210")), { eligible: true });

  const expectedPhoneId = crypto.createHash("sha256").update(PHONE).digest("hex");
  const phoneCounter = fake.docs.get(`phoneLookupRateLimits/v2_phone_${expectedPhoneId}`);
  assert.equal(phoneCounter.count, 2);
  assert.equal(
    [...fake.docs.keys()].some(
      (key) => key.startsWith("phoneLookupRateLimits/") && key.includes(PHONE),
    ),
    false,
  );
});

test("unknown, unverified, staff, mismapped, and duplicate customers are ineligible", async () => {
  const unknown = makeDb();
  assert.deepEqual(
    await makeHandler(unknown, {
      auth: {
        getUserByPhoneNumber: async () => {
          throw { code: "auth/user-not-found" };
        },
      },
    }).invoke(request()),
    { eligible: false },
  );

  const unverified = makeDb(
    eligibleDocs({
      [`onlineCustomers/${CUSTOMER_ID}`]: {
        ...eligibleDocs()[`onlineCustomers/${CUSTOMER_ID}`],
        phoneVerified: false,
      },
    }),
  );
  assert.deepEqual(await makeHandler(unverified).invoke(request()), { eligible: false });

  const staff = makeDb(
    eligibleDocs({
      [`onlineCustomers/${CUSTOMER_ID}`]: {
        ...eligibleDocs()[`onlineCustomers/${CUSTOMER_ID}`],
        role: "staff",
      },
    }),
  );
  assert.deepEqual(await makeHandler(staff).invoke(request()), { eligible: false });

  const wrongMapping = makeDb(
    eligibleDocs({
      [`usersByUid/${UID}`]: {
        uid: UID,
        userDocId: "ONCUS0000999",
        collection: "onlineCustomers",
        accountType: "customer",
      },
    }),
  );
  assert.deepEqual(await makeHandler(wrongMapping).invoke(request()), { eligible: false });

  const duplicate = makeDb(
    eligibleDocs({
      "onlineCustomers/ONCUS0000043": {
        ...eligibleDocs()[`onlineCustomers/${CUSTOMER_ID}`],
        id: "ONCUS0000043",
        userId: "ONCUS0000043",
      },
    }),
  );
  assert.deepEqual(await makeHandler(duplicate).invoke(request()), { eligible: false });

  const unverifiedDuplicate = makeDb(
    eligibleDocs({
      "onlineCustomers/ONCUS0000043": {
        ...eligibleDocs()[`onlineCustomers/${CUSTOMER_ID}`],
        id: "ONCUS0000043",
        userId: "ONCUS0000043",
        uid: "another-customer-uid",
        phoneVerified: false,
      },
    }),
  );
  assert.deepEqual(await makeHandler(unverifiedDuplicate).invoke(request()), { eligible: false });
});

test("rejects malformed numbers and phone ownership mapped to a different UID", async () => {
  const fake = makeDb(eligibleDocs());
  const handler = makeHandler(fake);
  await assert.rejects(
    handler.invoke(request("9876543210")),
    (error) => error.code === "invalid-argument",
  );

  const wrongAuth = makeHandler(fake, {
    auth: { getUserByPhoneNumber: async (phoneNumber) => ({ uid: "another-uid", phoneNumber }) },
  });
  assert.deepEqual(await wrongAuth.invoke(request()), { eligible: false });
});

test("uses the socket peer and ignores untrusted forwarded IP values", async () => {
  const fake = makeDb();
  const handler = makeHandler(fake, {
    auth: {
      getUserByPhoneNumber: async () => {
        throw { code: "auth/user-not-found" };
      },
    },
  });
  for (let i = 0; i < 10; i++) {
    const uniquePhone = `+9198765432${String(i).padStart(2, "0")}`;
    assert.deepEqual(
      await handler.invoke(request(uniquePhone, "203.0.113.40", `198.51.100.${i + 1}`)),
      { eligible: false },
    );
  }
  await assert.rejects(
    handler.invoke(request("+919876543299", "203.0.113.40", "192.0.2.200")),
    (error) => error.code === "resource-exhausted",
  );
  const ipCounter = [...fake.docs.entries()].find(([key]) =>
    key.startsWith("phoneLookupRateLimits/v2_ip_"),
  );
  assert.ok(ipCounter);
  const expectedId = crypto.createHash("sha256").update("203.0.113.40").digest("hex");
  assert.equal(ipCounter[0], `phoneLookupRateLimits/v2_ip_${expectedId}`);
  assert.equal(ipCounter[0].includes("203.0.113.40"), false);
  assert.equal(ipCounter[0].includes("+91"), false);
  const lastPhoneHash = crypto.createHash("sha256").update("+919876543209").digest("hex");
  const phoneCounterId = `phoneLookupRateLimits/v2_phone_${lastPhoneHash}`;
  assert.equal(fake.docs.has(phoneCounterId), true);
  assert.equal(phoneCounterId.includes(PHONE), false);

  handler.advanceTime(60_001);
  assert.deepEqual(await handler.invoke(request("+919876543298", "203.0.113.40")), {
    eligible: false,
  });
  assert.equal(
    [...fake.docs.keys()].some((path) => path.startsWith("users/")),
    false,
  );
});

test("throttles checks for the same phone across different caller IPs", async () => {
  const fake = makeDb();
  const handler = makeHandler(fake, {
    auth: {
      getUserByPhoneNumber: async () => {
        throw { code: "auth/user-not-found" };
      },
    },
  });
  for (let i = 0; i < 20; i++) {
    assert.deepEqual(await handler.invoke(request(PHONE, `203.0.113.${i + 1}`)), {
      eligible: false,
    });
  }
  await assert.rejects(
    handler.invoke(request(PHONE, "203.0.114.21")),
    (error) => error.code === "resource-exhausted",
  );
});

test("serializes concurrent requests and atomically enforces the phone limit", async () => {
  const fake = makeDb();
  const handler = makeHandler(fake, {
    auth: {
      getUserByPhoneNumber: async () => {
        throw { code: "auth/user-not-found" };
      },
    },
  });
  const results = await Promise.allSettled(
    Array.from({ length: 25 }, (_, index) =>
      handler.invoke(request(PHONE, `203.0.113.${index + 1}`)),
    ),
  );
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 20);
  assert.equal(
    results.filter(
      (result) => result.status === "rejected" && result.reason.code === "resource-exhausted",
    ).length,
    5,
  );
});

test("expires the phone counter after its configured window", async () => {
  const fake = makeDb();
  const handler = makeHandler(fake, {
    auth: {
      getUserByPhoneNumber: async () => {
        throw { code: "auth/user-not-found" };
      },
    },
  });
  for (let i = 0; i < 20; i++) {
    assert.deepEqual(await handler.invoke(request(PHONE, `203.0.113.${i + 1}`)), {
      eligible: false,
    });
  }
  await assert.rejects(
    handler.invoke(request(PHONE, "203.0.114.21")),
    (error) => error.code === "resource-exhausted",
  );
  handler.advanceTime(60 * 60_000 + 1);
  assert.deepEqual(await handler.invoke(request(PHONE, "203.0.114.21")), { eligible: false });
});

test("fails closed for legacy records with conflicting or ambiguous ownership", async () => {
  const otherOwner = makeDb({
    ...eligibleDocs(),
    "users/SASS0000104": {
      userId: "SASS0000104",
      uid: "different-uid",
      phone: PHONE,
      number: "9876543210",
      countryCode: "+91",
    },
  });
  assert.deepEqual(await makeHandler(otherOwner).invoke(request()), { eligible: false });

  const ambiguousOwner = makeDb({
    ...eligibleDocs(),
    "users/SASS0000104": {
      userId: "SASS0000104",
      number: "9876543210",
    },
  });
  assert.deepEqual(await makeHandler(ambiguousOwner).invoke(request()), { eligible: false });
});

test("rejects phone indexes with a wrong collection, phone, or missing required field", async () => {
  const validIndex = eligibleDocs()[`customerPhoneIndex/${PHONE}`];
  const indexes = [
    { ...validIndex, collection: "users" },
    { ...validIndex, phone: "+919999999999" },
    { uid: UID, userDocId: CUSTOMER_ID, collection: "onlineCustomers" },
  ];
  for (const index of indexes) {
    const fake = makeDb({ ...eligibleDocs(), [`customerPhoneIndex/${PHONE}`]: index });
    assert.deepEqual(await makeHandler(fake).invoke(request()), { eligible: false });
  }
});

test("fails safely when socket IP is unavailable or invalid", async () => {
  const handler = makeHandler(makeDb(eligibleDocs()));
  const missing = request();
  delete missing.rawRequest.socket;
  await assert.rejects(handler.invoke(missing), (error) => error.code === "unavailable");

  const invalid = request();
  invalid.rawRequest.socket.remoteAddress = "attacker-controlled-forwarded-value";
  await assert.rejects(handler.invoke(invalid), (error) => error.code === "unavailable");
});
