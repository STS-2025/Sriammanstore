import { beforeEach, describe, expect, it, vi } from "vitest";
import { customerIdentityService } from "../services/customerIdentityService";
import type { User } from "../types";

// In-memory mock Firestore store to track all writes
const mockFirestoreStore = {
  onlineCustomers: new Map<string, Record<string, unknown>>(),
  users: new Map<string, Record<string, unknown>>(),
  usersByUid: new Map<string, Record<string, unknown>>(),
  meta: new Map<string, Record<string, unknown>>([
    ["onlineCustomerSequence", { current: 100 }],
    ["userSequence", { current: 500 }],
  ]),
};

// Track collections written to
const writesRecorded: { collection: string; id: string; data: Record<string, unknown> }[] = [];

vi.mock("firebase/firestore", () => {
  return {
    getFirestore: vi.fn(),
    doc: (_db: unknown, collectionName: string, id: string) => ({
      collectionName,
      id,
      path: `${collectionName}/${id}`,
    }),
    getDoc: async (docRef: { collectionName: string; id: string }) => {
      const col = docRef.collectionName as keyof typeof mockFirestoreStore;
      const data = mockFirestoreStore[col]?.get(docRef.id);
      return {
        exists: () => Boolean(data),
        data: () => data,
      };
    },
    setDoc: async (
      docRef: { collectionName: string; id: string },
      data: Record<string, unknown>,
      _options?: unknown,
    ) => {
      const col = docRef.collectionName as keyof typeof mockFirestoreStore;
      if (!mockFirestoreStore[col]) {
        (mockFirestoreStore as Record<string, Map<string, Record<string, unknown>>>)[col] = new Map();
      }
      mockFirestoreStore[col]?.set(docRef.id, data);
      writesRecorded.push({ collection: docRef.collectionName, id: docRef.id, data });
    },
    runTransaction: async (_db: unknown, callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        get: async (docRef: { collectionName: string; id: string }) => {
          const col = docRef.collectionName as keyof typeof mockFirestoreStore;
          const data = mockFirestoreStore[col]?.get(docRef.id);
          return {
            exists: () => Boolean(data),
            data: () => data,
          };
        },
        set: (
          docRef: { collectionName: string; id: string },
          data: Record<string, unknown>,
          _options?: unknown,
        ) => {
          const col = docRef.collectionName as keyof typeof mockFirestoreStore;
          mockFirestoreStore[col]?.set(docRef.id, data);
          writesRecorded.push({ collection: docRef.collectionName, id: docRef.id, data });
        },
      };
      return callback(tx);
    },
  };
});

vi.mock("../services/productionOrderReader", () => ({
  getProductionFirestoreInstance: () => ({}),
}));

describe("onlineCustomers Registration & Identity Persistence", () => {
  beforeEach(() => {
    mockFirestoreStore.onlineCustomers.clear();
    mockFirestoreStore.users.clear();
    mockFirestoreStore.usersByUid.clear();
    mockFirestoreStore.meta.set("onlineCustomerSequence", { current: 100 });
    mockFirestoreStore.meta.set("userSequence", { current: 500 });
    writesRecorded.length = 0;
  });

  it("provisions customer profile strictly in onlineCustomers and increments onlineCustomerSequence", async () => {
    const result = await customerIdentityService.provisionCustomerAccount({
      uid: "firebase-auth-uid-001",
      email: "newcustomer@sriamman.test",
      fullName: "Deepa Devi",
      number: "9876500001",
      countryCode: "+91",
      dob: "1992-11-25",
      gender: "female",
      referredBy: "ONCUS0000010",
    });

    // Verify allocated customer ID is canonical ONCUS (100 + 1 = 101)
    expect(result.userDocId).toBe("ONCUS0000101");
    expect(result.profile.id).toBe("ONCUS0000101");
    expect(result.profile.userId).toBe("ONCUS0000101");
    expect(result.profile.dob).toBe("1992-11-25");

    // 1. Verify profile was written to onlineCustomers
    const onlineDoc = mockFirestoreStore.onlineCustomers.get("ONCUS0000101");
    expect(onlineDoc).toBeDefined();
    expect(onlineDoc?.["id"]).toBe("ONCUS0000101");
    expect(onlineDoc?.["userId"]).toBe("ONCUS0000101");
    expect(onlineDoc?.["uid"]).toBe("firebase-auth-uid-001");
    expect(onlineDoc?.["accountType"]).toBe("customer");
    expect(onlineDoc?.["fullName"]).toBe("Deepa Devi");
    expect(onlineDoc?.["email"]).toBe("newcustomer@sriamman.test");
    expect(onlineDoc?.["dob"]).toBe("1992-11-25");
    expect(onlineDoc?.["birthday"]).toBeUndefined(); // Canonical dob only
    expect(onlineDoc?.["smartCoins"]).toBe(0); // Canonical Smart Coins
    expect(onlineDoc?.["coins"]).toBeUndefined(); // Obsolete coins field must not be written
    expect(onlineDoc?.["availableCoins"]).toBeUndefined(); // Redundant balance must not be written
    expect(result.profile.smartCoins).toBe(0);

    // 2. Verify mapping was written to usersByUid pointing to onlineCustomers
    const mappingDoc = mockFirestoreStore.usersByUid.get("firebase-auth-uid-001");
    expect(mappingDoc).toBeDefined();
    expect(mappingDoc?.["userDocId"]).toBe("ONCUS0000101");
    expect(mappingDoc?.["collection"]).toBe("onlineCustomers");
    expect(mappingDoc?.["accountType"]).toBe("customer");

    // 3. Verify onlineCustomerSequence was updated to 101
    expect(mockFirestoreStore.meta.get("onlineCustomerSequence")?.["current"]).toBe(101);

    // 4. CRITICAL: Verify NO document was written to users collection
    expect(mockFirestoreStore.users.size).toBe(0);
    expect(writesRecorded.some((w) => w.collection === "users")).toBe(false);

    // 5. CRITICAL: Verify userSequence was untouched (remains 500)
    expect(mockFirestoreStore.meta.get("userSequence")?.["current"]).toBe(500);
  });

  it("resolves the newly registered onlineCustomers profile through customerIdentityService", async () => {
    // Provision the customer
    await customerIdentityService.provisionCustomerAccount({
      uid: "firebase-auth-uid-002",
      email: "mohan@sriamman.test",
      fullName: "Mohan Raj",
      number: "9876500002",
      countryCode: "+91",
    });

    // Mock the reader in customerIdentityService to read from mock store
    customerIdentityService.setProductionReaderForTesting(async (col: string, docId: string) => {
      const storeCol = col as keyof typeof mockFirestoreStore;
      return (mockFirestoreStore[storeCol]?.get(docId) as Record<string, unknown>) ?? null;
    });

    // Resolve the session identity
    const resolution = await customerIdentityService.resolveCustomerProfile(
      {
        uid: "firebase-auth-uid-002",
        email: "mohan@sriamman.test",
        emailVerified: false,
      },
      { mode: "production" }
    );

    expect(resolution.status).toBe("resolved");
    if (resolution.status === "resolved") {
      expect(resolution.profile.id).toBe("ONCUS0000101");
      expect(resolution.profile.name).toBe("Mohan Raj");
      expect(resolution.profile.email).toBe("mohan@sriamman.test");
      expect(resolution.userDocId).toBe("ONCUS0000101");
    }

    // Reset reader override
    customerIdentityService.setProductionReaderForTesting(null);
  });

  it("handles registration retry idempotently without allocating a duplicate ONCUS ID", async () => {
    // First registration attempt
    const firstResult = await customerIdentityService.provisionCustomerAccount({
      uid: "firebase-auth-uid-003",
      email: "retry@sriamman.test",
      fullName: "Retry User",
      number: "9876500003",
    });
    expect(firstResult.userDocId).toBe("ONCUS0000101");

    // Retry with same UID
    const secondResult = await customerIdentityService.provisionCustomerAccount({
      uid: "firebase-auth-uid-003",
      email: "retry@sriamman.test",
      fullName: "Retry User",
      number: "9876500003",
    });

    // Must reuse the exact same ONCUS ID and not advance the sequence again
    expect(secondResult.userDocId).toBe("ONCUS0000101");
    expect(mockFirestoreStore.meta.get("onlineCustomerSequence")?.["current"]).toBe(101);
    expect(mockFirestoreStore.onlineCustomers.size).toBe(1);
    expect(mockFirestoreStore.users.size).toBe(0);
  });
});
