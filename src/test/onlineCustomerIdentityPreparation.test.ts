import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  isValidCustomerId,
  isValidSassCustomerId,
  CANONICAL_ONCUS_ID_RE,
  CANONICAL_SASS_ID_RE,
  CANONICAL_CUSTOMER_ID_RE,
  LegacyCartAddressAdapter,
} from "../services/legacyCartAddressAdapter";
import {
  normalizeLegacyUser,
} from "../services/legacyUserMapper";
import {
  customerIdentityService,
  validateAuthenticatedFirebaseUser,
  validateUsersByUidMapping,
  validateAndNormalizeCustomerProfile,
  type UsersByUidMapping,
} from "../services/customerIdentityService";
import { productionOrderReader } from "../services/productionOrderReader";
import { productionAddressReader } from "../services/productionAddressReader";
import { productionCoinReader } from "../services/productionCoinReader";
import { productionWishlistReader } from "../services/productionWishlistReader";
import { reconcileCustomerOrders } from "../services/legacyOrderAdapter";
import { KNOWN_ARRAY_COLLECTIONS, CUSTOMER_SCOPED_COLLECTIONS } from "../services/firestoreAdapter";
import type { User } from "../types";

describe("Phase 2: onlineCustomers and ONCUS Identity Code Preparation", () => {
  describe("1. Customer ID Regex and Helpers", () => {
    it("validates ONCUS customer IDs strictly with six or seven digits", () => {
      expect(CANONICAL_ONCUS_ID_RE.test("ONCUS000010")).toBe(true);
      expect(CANONICAL_ONCUS_ID_RE.test("ONCUS000021")).toBe(true);
      expect(CANONICAL_ONCUS_ID_RE.test("oncus000010")).toBe(true);
      expect(CANONICAL_ONCUS_ID_RE.test("ONCUS123456")).toBe(true);

      // Accepts approved 7-digit production IDs as well
      expect(CANONICAL_ONCUS_ID_RE.test("ONCUS0000010")).toBe(true);
      expect(CANONICAL_ONCUS_ID_RE.test("ONCUS0000021")).toBe(true);

      // Rejects non-6/7-digit suffixes
      expect(CANONICAL_ONCUS_ID_RE.test("ONCUS12345678")).toBe(false); // 8 digits rejected
      expect(CANONICAL_ONCUS_ID_RE.test("ONCUS12")).toBe(false); // 2 digits rejected
      expect(CANONICAL_ONCUS_ID_RE.test("ONCUS00000010")).toBe(false); // 8 digits rejected

      expect(CANONICAL_ONCUS_ID_RE.test("SASS0000010")).toBe(false);
      expect(CANONICAL_ONCUS_ID_RE.test("firebase-auth-uid-12345")).toBe(false);
      expect(CANONICAL_ONCUS_ID_RE.test("ONCUS")).toBe(false);
      expect(CANONICAL_ONCUS_ID_RE.test("ONCUS_ABC")).toBe(false);
    });

    it("validates SASS customer IDs strictly (backward compatibility)", () => {
      expect(CANONICAL_SASS_ID_RE.test("SASS0000010")).toBe(true);
      expect(CANONICAL_SASS_ID_RE.test("SASS0000021")).toBe(true);
      expect(CANONICAL_SASS_ID_RE.test("sass0000104")).toBe(true);

      expect(CANONICAL_SASS_ID_RE.test("ONCUS000010")).toBe(false);
      expect(CANONICAL_SASS_ID_RE.test("firebase-auth-uid")).toBe(false);
    });

    it("isValidCustomerId accepts both ONCUS and SASS and rejects non-customer IDs", () => {
      expect(isValidCustomerId("ONCUS000010")).toBe(true);
      expect(isValidCustomerId("ONCUS000021")).toBe(true);
      expect(isValidCustomerId("ONCUS0000010")).toBe(true);
      expect(isValidCustomerId("ONCUS0000021")).toBe(true);
      expect(isValidCustomerId("SASS0000010")).toBe(true);
      expect(isValidCustomerId("SASS0000021")).toBe(true);

      expect(isValidCustomerId("ONCUS12345678")).toBe(false); // 8 digits rejected
      expect(isValidCustomerId("ONCUS12")).toBe(false); // 2 digits rejected
      expect(isValidCustomerId("14rK8u3Qf4g9tK182jKl")).toBe(false);
      expect(isValidCustomerId("guest_123456")).toBe(false);
      expect(isValidCustomerId("")).toBe(false);
      expect(isValidCustomerId(null)).toBe(false);
      expect(isValidCustomerId(undefined)).toBe(false);
      expect(isValidCustomerId(12345)).toBe(false);
    });

    it("isValidSassCustomerId strictly accepts SASS and rejects ONCUS for backwards compatibility", () => {
      expect(isValidSassCustomerId("SASS0000010")).toBe(true);
      expect(isValidSassCustomerId("ONCUS000010")).toBe(false);
      expect(isValidSassCustomerId("")).toBe(false);
    });
  });

  describe("2. LegacyCartAddressAdapter with ONCUS and onlineCustomers Routing", () => {
    let mockDriver: any;
    let adapter: LegacyCartAddressAdapter;

    beforeEach(() => {
      mockDriver = {
        getDoc: vi.fn(),
        setDoc: vi.fn(),
        updateDoc: vi.fn(),
        deleteDoc: vi.fn(),
        queryCollection: vi.fn().mockResolvedValue([]),
      };
      adapter = new LegacyCartAddressAdapter(mockDriver);
    });

    it("resolves primary collection 'onlineCustomers' for ONCUS and 'users' for SASS", () => {
      expect(adapter.getCustomerCollection("ONCUS000010")).toBe("onlineCustomers");
      expect(adapter.getCustomerCollection("oncus000021")).toBe("onlineCustomers");
      expect(adapter.getCustomerCollection("SASS0000010")).toBe("users");
      expect(adapter.getCustomerCollection("SASS0000104")).toBe("users");
    });

    it("builds correct subcollection paths for both collections", () => {
      expect(adapter.getCustomerSubcollectionPath("ONCUS000010", "cart")).toBe(
        "onlineCustomers/ONCUS000010/cart"
      );
      expect(adapter.getCustomerSubcollectionPath("ONCUS000010", "addresses")).toBe(
        "onlineCustomers/ONCUS000010/addresses"
      );
      expect(adapter.getCustomerSubcollectionPath("SASS0000010", "cart")).toBe(
        "users/SASS0000010/cart"
      );
      expect(adapter.getCustomerSubcollectionPath("SASS0000010", "addresses")).toBe(
        "users/SASS0000010/addresses"
      );
    });

    it("assertProfileExists checks onlineCustomers and falls back to users for ONCUS", async () => {
      // Case A: Exists directly in onlineCustomers
      mockDriver.getDoc.mockResolvedValueOnce({ id: "ONCUS000010", name: "Murugan" });
      const profile1 = await adapter.assertProfileExists("ONCUS000010");
      expect(profile1["name"]).toBe("Murugan");
      expect(mockDriver.getDoc).toHaveBeenCalledWith("onlineCustomers", "ONCUS000010");

      // Case B: Not yet migrated to onlineCustomers, falls back to users
      mockDriver.getDoc.mockReset();
      mockDriver.getDoc
        .mockResolvedValueOnce(null) // onlineCustomers: not found
        .mockResolvedValueOnce({ id: "ONCUS000010", name: "Murugan Fallback" }); // users: found

      const profile2 = await adapter.assertProfileExists("ONCUS000010");
      expect(profile2["name"]).toBe("Murugan Fallback");
      expect(mockDriver.getDoc).toHaveBeenNthCalledWith(1, "onlineCustomers", "ONCUS000010");
      expect(mockDriver.getDoc).toHaveBeenNthCalledWith(2, "users", "ONCUS000010");
    });

    it("assertProfileExists rejects invalid identifiers", async () => {
      await expect(adapter.assertProfileExists("invalid-uid")).rejects.toThrow("Invalid customer identifier");
    });

    it("routes cart items to onlineCustomers/{id}/cart for ONCUS customers", async () => {
      mockDriver.getDoc.mockResolvedValueOnce({ id: "ONCUS000010" });
      mockDriver.queryCollection.mockResolvedValueOnce([
        {
          id: "prod-1__opt0__kg__1",
          name: "Ponni Boiled Rice",
          price: 60,
          quantity: 2,
        },
      ]);

      const cart = await adapter.getCart("ONCUS000010");
      expect(cart).toHaveLength(1);
      expect(cart[0]!.name).toBe("Ponni Boiled Rice");
      expect(cart[0]!.userId).toBe("ONCUS000010");
      expect(mockDriver.queryCollection).toHaveBeenCalledWith(
        "onlineCustomers/ONCUS000010/cart",
        {}
      );
    });

    it("routes address operations to onlineCustomers for ONCUS customers", async () => {
      mockDriver.getDoc.mockResolvedValueOnce({ id: "ONCUS000010" });
      mockDriver.queryCollection.mockResolvedValueOnce([
        {
          id: "addr_1",
          door: "12",
          street: "Amman Street",
          city: "Erode",
          pincode: "638001",
        },
      ]);

      const addresses = await adapter.getAddresses("ONCUS000010");
      expect(addresses).toHaveLength(1);
      expect(addresses[0]!.city).toBe("Erode");
      expect(mockDriver.queryCollection).toHaveBeenCalledWith(
        "onlineCustomers/ONCUS000010/addresses",
        {}
      );
    });
  });

  describe("3. legacyUserMapper with ONCUS Priority and legacySassId Mapping", () => {
    it("prioritizes ONCUS ID over SASS ID or Firebase UID in candidate resolution", () => {
      const rawDoc = {
        id: "firebase-auth-uid-12345",
        userId: "ONCUS000010",
        sassId: "SASS0000010",
        name: "Murugan",
        phone: "9876543210",
      };

      const normalized = normalizeLegacyUser(rawDoc);
      expect(normalized).not.toBeNull();
      expect(normalized!.id).toBe("ONCUS000010");
      expect(normalized!.userId).toBe("ONCUS000010");
      expect(normalized!.legacySassId).toBe("SASS0000010");
    });

    it("resolves context legacySassId when provided", () => {
      const rawDoc = {
        id: "ONCUS000021",
        name: "Test Customer 21",
        phone: "9842712345",
      };

      const normalized = normalizeLegacyUser(rawDoc, {
        legacySassId: "SASS0000021",
      });
      expect(normalized).not.toBeNull();
      expect(normalized!.id).toBe("ONCUS000021");
      expect(normalized!.legacySassId).toBe("SASS0000021");
    });

    it("preserves backward compatibility for legacy SASS customers without ONCUS ID", () => {
      const rawDoc = {
        userId: "SASS0000010",
        name: "Original SASS Customer",
        phone: "9876543210",
        coins: 150,
      };

      const normalized = normalizeLegacyUser(rawDoc);
      expect(normalized).not.toBeNull();
      expect(normalized!.id).toBe("SASS0000010");
      expect(normalized!.userId).toBe("SASS0000010");
      expect(normalized!.legacySassId).toBeUndefined();
      expect(normalized!.coins).toBe(150);
    });

    it("extracts document path correctly for both onlineCustomers and users", () => {
      const rawDocWithOnlinePath = {
        name: "Customer",
        phone: "9999999999",
      };
      const normalizedOnline = normalizeLegacyUser(rawDocWithOnlinePath, {
        documentPath: "onlineCustomers/ONCUS000010",
      });
      expect(normalizedOnline).not.toBeNull();
      expect(normalizedOnline!.id).toBe("ONCUS000010");

      const normalizedLegacy = normalizeLegacyUser(rawDocWithOnlinePath, {
        documentPath: "users/SASS0000010",
      });
      expect(normalizedLegacy).not.toBeNull();
      expect(normalizedLegacy!.id).toBe("SASS0000010");
    });
  });

  describe("4. customerIdentityService Dual-Path Resolution & Security Validation", () => {
    it("rejects both SASS and ONCUS customer IDs if submitted as a Firebase Auth UID", () => {
      const res1 = validateAuthenticatedFirebaseUser({ uid: "ONCUS000010" });
      expect(res1.ok).toBe(false);
      expect((res1 as any).message).toMatch(/customer IDs cannot be used as Firebase Auth UIDs/i);

      const res2 = validateAuthenticatedFirebaseUser({ uid: "SASS0000010" });
      expect(res2.ok).toBe(false);
      expect((res2 as any).message).toMatch(/customer IDs cannot be used as Firebase Auth UIDs/i);
    });

    it("validateUsersByUidMapping parses ONCUS userDocId, collection, and legacySassId", () => {
      const validUid = "firebase-auth-real-uid-99";
      const mappingPayload = {
        uid: validUid,
        userDocId: "ONCUS000010",
        collection: "onlineCustomers",
        legacySassId: "SASS0000010",
      };

      const result = validateUsersByUidMapping(mappingPayload, validUid);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.mapping.userDocId).toBe("ONCUS000010");
        expect(result.mapping.collection).toBe("onlineCustomers");
        expect(result.mapping.legacySassId).toBe("SASS0000010");
      }
    });

    it("validateUsersByUidMapping supports customerId alias for userDocId", () => {
      const validUid = "firebase-auth-real-uid-alias";
      const mappingPayload = {
        uid: validUid,
        customerId: "ONCUS000010",
        collection: "onlineCustomers",
        legacySassId: "SASS0000010",
      };

      const result = validateUsersByUidMapping(mappingPayload, validUid);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.mapping.userDocId).toBe("ONCUS000010");
        expect(result.mapping.collection).toBe("onlineCustomers");
        expect(result.mapping.legacySassId).toBe("SASS0000010");
      }
    });

    it("validateUsersByUidMapping preserves backward compatibility for legacy SASS mappings", () => {
      const validUid = "firebase-auth-real-uid-10";
      const mappingPayload = {
        uid: validUid,
        userDocId: "SASS0000010",
      };

      const result = validateUsersByUidMapping(mappingPayload, validUid);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.mapping.userDocId).toBe("SASS0000010");
        expect(result.mapping.collection).toBe("users");
        expect(result.mapping.accountType).toBe("customer");
        expect(result.mapping.legacySassId).toBeUndefined();
      }
    });

    it("validateAndNormalizeCustomerProfile validates profile when fallback to users was used", () => {
      const authUid = "firebase-auth-uid-10";
      const resolvedUserDocId = "ONCUS000010";
      // Raw legacy doc still has SASS0000010
      const rawLegacyDoc = {
        id: "SASS0000010",
        userId: "SASS0000010",
        uid: authUid,
        name: "Murugan",
        phone: "9876543210",
        coins: 100,
      };

      const result = validateAndNormalizeCustomerProfile(
        rawLegacyDoc,
        resolvedUserDocId,
        authUid,
        {
          legacySassId: "SASS0000010",
          collection: "users",
        }
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.profile.id).toBe("ONCUS000010");
        expect(result.profile.userId).toBe("ONCUS000010");
        expect(result.profile.legacySassId).toBe("SASS0000010");
        expect(result.profile.coins).toBe(100);
      }
    });

    it("resolveCustomerProfile executes dual-path resolution with fallback", async () => {
      const testUid = "auth_uid_dual_path_test";
      const mockAdapter: any = {
        getDocumentRaw: vi.fn(),
      };

      // 1. Mapping indicates ONCUS000010, collection: onlineCustomers, legacySassId: SASS0000010
      mockAdapter.getDocumentRaw.mockImplementation(async (col: string, docId: string) => {
        if (col === "usersByUid" && docId === testUid) {
          return {
            uid: testUid,
            userDocId: "ONCUS000010",
            collection: "onlineCustomers",
            legacySassId: "SASS0000010",
          };
        }
        if (col === "onlineCustomers" && docId === "ONCUS000010") {
          // Document does not exist yet in onlineCustomers!
          return null;
        }
        if (col === "users" && docId === "SASS0000010") {
          // Document found in legacy users!
          return {
            id: "SASS0000010",
            userId: "SASS0000010",
            uid: testUid,
            name: "Murugan",
            phone: "9876543210",
            coins: 100,
          };
        }
        return null;
      });

      const res = await customerIdentityService.resolveCustomerProfile(
        { uid: testUid },
        { adapter: mockAdapter }
      );

      expect(res.status).toBe("resolved");
      if (res.status === "resolved") {
        expect(res.userDocId).toBe("ONCUS000010");
        expect(res.profile.id).toBe("ONCUS000010");
        expect(res.profile.legacySassId).toBe("SASS0000010");
        expect(res.profile.coins).toBe(100);
      }
    });
  });

  describe("5. Order Reconciliation with legacySassId Support", () => {
    it("reconciles top-level orders with legacy SASS buyerId for an ONCUS customer", () => {
      const reconciled = reconcileCustomerOrders({
        nestedOrders: [
          {
            id: "ord_101",
            orderId: "101",
            userId: "ONCUS000010",
            status: "delivered",
            totalAmount: 450,
          },
        ],
        topLevelOrders: [
          // Order in top-level has buyerId: SASS0000010
          {
            id: "ord_102",
            orderId: "102",
            buyerId: "SASS0000010",
            status: "delivered",
            totalAmount: 320,
          },
          // Belongs to another customer
          {
            id: "ord_999",
            orderId: "999",
            buyerId: "SASS9999999",
            status: "delivered",
            totalAmount: 1000,
          },
        ],
        userId: "ONCUS000010",
        legacySassId: "SASS0000010",
      });

      expect(reconciled).toHaveLength(2);
      const orderIds = reconciled.map((o) => o.id);
      expect(orderIds).toContain("ord_101");
      expect(orderIds).toContain("ord_102");
      expect(orderIds).not.toContain("ord_999");
    });
  });

  describe("6. Reader Overrides and Validators", () => {
    it("productionOrderReader validates both ONCUS (6 or 7 digits) and SASS and rejects invalid formats and UIDs", () => {
      expect(productionOrderReader.assertValidCustomer("ONCUS000010")).toBe("ONCUS000010");
      expect(productionOrderReader.assertValidCustomer("ONCUS0000010")).toBe("ONCUS0000010");
      expect(productionOrderReader.assertValidCustomer("SASS0000010")).toBe("SASS0000010");
      expect(() => productionOrderReader.assertValidCustomer("ONCUS12345678")).toThrow(
        "Invalid customer identifier"
      );
      expect(() => productionOrderReader.assertValidCustomer("uQXNJ5pMoVR9GG4E9NC9J122EFi2")).toThrow(
        "Invalid customer identifier"
      );
      expect(() => productionOrderReader.assertValidCustomer("random-string")).toThrow(
        "Invalid customer identifier"
      );
    });

    it("productionAddressReader validates both ONCUS (6 or 7 digits) and SASS and rejects non-6/7-digit ONCUS and UIDs", () => {
      expect(productionAddressReader.assertValidCustomer("ONCUS000021")).toBe("ONCUS000021");
      expect(productionAddressReader.assertValidCustomer("ONCUS0000021")).toBe("ONCUS0000021");
      expect(productionAddressReader.assertValidCustomer("SASS0000021")).toBe("SASS0000021");
      expect(() => productionAddressReader.assertValidCustomer("ONCUS12345678")).toThrow();
      expect(() => productionAddressReader.assertValidCustomer("HBbNTuCtczLLbBCvsww58NEqXRz2")).toThrow();
    });

    it("productionCoinReader validates both ONCUS (6 or 7 digits) and SASS and rejects invalid formats", () => {
      expect(productionCoinReader.assertValidCustomer("ONCUS000010")).toBe("ONCUS000010");
      expect(productionCoinReader.assertValidCustomer("ONCUS0000010")).toBe("ONCUS0000010");
      expect(productionCoinReader.assertValidCustomer("SASS0000010")).toBe("SASS0000010");
      expect(() => productionCoinReader.assertValidCustomer("ONCUS12345678")).toThrow();
      expect(() => productionCoinReader.assertValidCustomer("uQXNJ5pMoVR9GG4E9NC9J122EFi2")).toThrow();
    });

    it("productionWishlistReader validates both ONCUS (6 or 7 digits) and SASS and rejects invalid formats", () => {
      expect(productionWishlistReader.assertValidCustomer("ONCUS000021")).toBe("ONCUS000021");
      expect(productionWishlistReader.assertValidCustomer("ONCUS0000021")).toBe("ONCUS0000021");
      expect(productionWishlistReader.assertValidCustomer("SASS0000021")).toBe("SASS0000021");
      expect(() => productionWishlistReader.assertValidCustomer("ONCUS12345678")).toThrow();
      expect(() => productionWishlistReader.assertValidCustomer("HBbNTuCtczLLbBCvsww58NEqXRz2")).toThrow();
    });
  });

  describe("7. Firestore Adapter Collections Registration", () => {
    it("includes onlineCustomers in KNOWN_ARRAY_COLLECTIONS and CUSTOMER_SCOPED_COLLECTIONS", () => {
      expect(KNOWN_ARRAY_COLLECTIONS.has("onlineCustomers")).toBe(true);
      expect(CUSTOMER_SCOPED_COLLECTIONS.has("onlineCustomers")).toBe(true);
      expect(KNOWN_ARRAY_COLLECTIONS.has("users")).toBe(true);
      expect(CUSTOMER_SCOPED_COLLECTIONS.has("users")).toBe(true);
    });
  });
});
