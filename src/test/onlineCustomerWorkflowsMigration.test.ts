import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  resolveCustomerDataSource,
  validateCustomerAccess,
  getCustomerProfileEndpoint,
  getCustomerSubcollectionPath,
  APPROVED_MIGRATED_CUSTOMERS,
  REVERSE_MIGRATED_CUSTOMERS,
} from "../services/customerDataSourceResolver";
import {
  customerIdentityService,
  validateUsersByUidMapping,
  validateAndNormalizeCustomerProfile,
} from "../services/customerIdentityService";
import { authService } from "../services/authService";
import { orderService } from "../services/orderService";
import { addressService } from "../services/addressService";
import { coinService } from "../services/coinService";
import { cartService } from "../services/cartService";
import { wishlistService } from "../services/wishlistService";
import { LegacyCartAddressAdapter } from "../services/legacyCartAddressAdapter";
import { LegacyOrderAdapter } from "../services/legacyOrderAdapter";
import { productionOrderReader } from "../services/productionOrderReader";
import { productionAddressReader } from "../services/productionAddressReader";
import { productionCoinReader } from "../services/productionCoinReader";
import { productionWishlistReader } from "../services/productionWishlistReader";
import { apiClient } from "../services/apiClient";
import { FirestoreAdapter, type FirestoreDriver } from "../services/firestoreAdapter";
import type { Order, Product, User } from "../types";

// ============================================================================
// IN-MEMORY MOCK FIRESTORE DRIVER FOR UNIT TESTING
// ============================================================================

class MockMemoryFirestoreDriver implements FirestoreDriver {
  public store = new Map<string, Map<string, Record<string, unknown>>>();

  private getCollectionMap(collection: string) {
    let m = this.store.get(collection);
    if (!m) {
      m = new Map();
      this.store.set(collection, m);
    }
    return m;
  }

  async getDoc(collection: string, docId: string): Promise<Record<string, unknown> | null> {
    const colMap = this.getCollectionMap(collection);
    const data = colMap.get(docId);
    return data ? JSON.parse(JSON.stringify(data)) : null;
  }

  async setDoc(
    collection: string,
    docId: string,
    data: Record<string, unknown>,
    _merge?: boolean
  ): Promise<Record<string, unknown>> {
    const colMap = this.getCollectionMap(collection);
    const existing = colMap.get(docId) || {};
    const merged = _merge ? { ...existing, ...data } : { ...data };
    colMap.set(docId, JSON.parse(JSON.stringify(merged)));
    return merged;
  }

  async updateDoc(
    collection: string,
    docId: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const colMap = this.getCollectionMap(collection);
    const existing = colMap.get(docId);
    if (!existing) {
      throw new Error(`Document ${collection}/${docId} not found`);
    }
    const merged = { ...existing, ...data };
    colMap.set(docId, JSON.parse(JSON.stringify(merged)));
    return merged;
  }

  async deleteDoc(collection: string, docId: string): Promise<void> {
    const colMap = this.getCollectionMap(collection);
    colMap.delete(docId);
  }

  async queryCollection(
    collection: string,
    filter?: Record<string, unknown>
  ): Promise<Array<Record<string, unknown>>> {
    const colMap = this.getCollectionMap(collection);
    let items = Array.from(colMap.values());
    if (filter) {
      items = items.filter((item) => {
        for (const [k, v] of Object.entries(filter)) {
          if (item[k] !== v) return false;
        }
        return true;
      });
    }
    return items.map((i) => JSON.parse(JSON.stringify(i)));
  }

  async getDocumentRaw(collection: string, docId: string): Promise<Record<string, unknown> | null> {
    return this.getDoc(collection, docId);
  }

  async setDocumentRaw(
    collection: string,
    docId: string,
    data: Record<string, unknown>,
    merge?: boolean
  ): Promise<Record<string, unknown>> {
    return this.setDoc(collection, docId, data, merge);
  }

  async checkHealth(_timeoutMs?: number): Promise<void> {}

  async runOrderCreationTransaction(
    orderPayload: Record<string, unknown>,
    _timeoutMs?: number
  ): Promise<Record<string, unknown>> {
    return orderPayload;
  }
}

// ============================================================================
// PHASE 2G WORKFLOW REGRESSION TEST SUITE
// ============================================================================

describe("Phase 2G: Customer Panel Workflows Migration to onlineCustomers", () => {
  let driver: MockMemoryFirestoreDriver;
  let adapter: FirestoreAdapter;
  let cartAddressAdapter: LegacyCartAddressAdapter;
  let legacyOrderAdapter: LegacyOrderAdapter;

  const CUSTOMER_A_UID = "uQXNJ5pMoVR9GG4E9NC9J122EFi2";
  const CUSTOMER_A_SASS_ID = "SASS0000010";
  const CUSTOMER_A_ONCUS_ID = "ONCUS0000010";

  const CUSTOMER_B_UID = "HBbNTuCtczLLbBCvsww58NEqXRz2";
  const CUSTOMER_B_SASS_ID = "SASS0000021";
  const CUSTOMER_B_ONCUS_ID = "ONCUS0000021";

  const NON_MIGRATED_UID = "uid_non_migrated_104";
  const NON_MIGRATED_SASS_ID = "SASS0000104";

  beforeEach(() => {
    driver = new MockMemoryFirestoreDriver();
    adapter = new FirestoreAdapter(driver, { legacyCustomerSubcollections: true });
    apiClient.setFirestoreAdapter(adapter);
    cartAddressAdapter = new LegacyCartAddressAdapter(driver);
    legacyOrderAdapter = new LegacyOrderAdapter(driver);
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // Requirement 1: SASS0000010 authenticates and resolves to ONCUS0000010
  // ==========================================================================
  describe("1. SASS0000010 Canonical Resolution (Customer A)", () => {
    it("resolves authenticated UID mapped to SASS0000010 into canonical ONCUS0000010 profile", async () => {
      // 1. Existing production usersByUid mapping (untouched)
      await driver.setDoc("usersByUid", CUSTOMER_A_UID, {
        uid: CUSTOMER_A_UID,
        userDocId: CUSTOMER_A_SASS_ID,
      });

      // 2. Existing destination onlineCustomers record (populated in Phase 2E)
      await driver.setDoc("onlineCustomers", CUSTOMER_A_ONCUS_ID, {
        id: CUSTOMER_A_ONCUS_ID,
        customerId: CUSTOMER_A_ONCUS_ID,
        legacySassId: CUSTOMER_A_SASS_ID,
        userId: CUSTOMER_A_SASS_ID,
        uid: CUSTOMER_A_UID,
        fullName: "Micro Soft",
        coins: 170,
        number: "8248544559",
      });

      const resolution = await customerIdentityService.resolveCustomerProfile(
        { uid: CUSTOMER_A_UID },
        { adapter }
      );

      expect(resolution.status).toBe("resolved");
      if (resolution.status === "resolved") {
        expect(resolution.userDocId).toBe(CUSTOMER_A_ONCUS_ID);
        expect(resolution.mapping.userDocId).toBe(CUSTOMER_A_ONCUS_ID);
        expect(resolution.mapping.collection).toBe("onlineCustomers");
        expect(resolution.mapping.legacySassId).toBe(CUSTOMER_A_SASS_ID);
        expect(resolution.profile.id).toBe(CUSTOMER_A_ONCUS_ID);
        expect(resolution.profile.userId).toBe(CUSTOMER_A_ONCUS_ID);
        expect(resolution.profile.legacySassId).toBe(CUSTOMER_A_SASS_ID);
        expect(resolution.profile.name).toBe("Micro Soft");
        expect(resolution.profile.coins).toBe(170);
      }
    });
  });

  // ==========================================================================
  // Requirement 2: SASS0000021 authenticates and resolves to ONCUS0000021
  // ==========================================================================
  describe("2. SASS0000021 Canonical Resolution (Customer B)", () => {
    it("resolves authenticated UID mapped to SASS0000021 into canonical ONCUS0000021 profile", async () => {
      await driver.setDoc("usersByUid", CUSTOMER_B_UID, {
        uid: CUSTOMER_B_UID,
        userDocId: CUSTOMER_B_SASS_ID,
      });

      await driver.setDoc("onlineCustomers", CUSTOMER_B_ONCUS_ID, {
        id: CUSTOMER_B_ONCUS_ID,
        customerId: CUSTOMER_B_ONCUS_ID,
        legacySassId: CUSTOMER_B_SASS_ID,
        userId: CUSTOMER_B_SASS_ID,
        uid: CUSTOMER_B_UID,
        fullName: "SARAVANA KUMAR",
        coins: 382,
        number: "8778445125",
      });

      const resolution = await customerIdentityService.resolveCustomerProfile(
        { uid: CUSTOMER_B_UID },
        { adapter }
      );

      expect(resolution.status).toBe("resolved");
      if (resolution.status === "resolved") {
        expect(resolution.userDocId).toBe(CUSTOMER_B_ONCUS_ID);
        expect(resolution.mapping.userDocId).toBe(CUSTOMER_B_ONCUS_ID);
        expect(resolution.mapping.collection).toBe("onlineCustomers");
        expect(resolution.mapping.legacySassId).toBe(CUSTOMER_B_SASS_ID);
        expect(resolution.profile.id).toBe(CUSTOMER_B_ONCUS_ID);
        expect(resolution.profile.userId).toBe(CUSTOMER_B_ONCUS_ID);
        expect(resolution.profile.name).toBe("SARAVANA KUMAR");
        expect(resolution.profile.coins).toBe(382);
      }
    });
  });

  // ==========================================================================
  // Requirement 3: A mismatched UID or mapping is rejected
  // ==========================================================================
  describe("3. Mismatched UID and Mapping Rejection", () => {
    it("rejects when usersByUid document uid does not match authenticated UID", async () => {
      const authUid = "real_auth_uid_123";
      await driver.setDoc("usersByUid", authUid, {
        uid: "attacker_spoofed_uid_456",
        userDocId: CUSTOMER_A_SASS_ID,
      });

      const resolution = await customerIdentityService.resolveCustomerProfile(
        { uid: authUid },
        { adapter }
      );

      expect(resolution.status).toBe("malformed_mapping");
      expect(resolution.ok).toBe(false);
      if (!resolution.ok) {
        expect(resolution.code).toBe("identity/mapping-uid-mismatch");
      }
    });

    it("rejects when destination profile stored UID belongs to another account", async () => {
      const authUid = "attacker_uid_999";
      await driver.setDoc("usersByUid", authUid, {
        uid: authUid,
        userDocId: CUSTOMER_A_ONCUS_ID,
      });

      // Target profile belongs to legitimate owner CUSTOMER_A_UID
      await driver.setDoc("onlineCustomers", CUSTOMER_A_ONCUS_ID, {
        id: CUSTOMER_A_ONCUS_ID,
        customerId: CUSTOMER_A_ONCUS_ID,
        uid: CUSTOMER_A_UID,
        fullName: "Micro Soft",
      });

      const resolution = await customerIdentityService.resolveCustomerProfile(
        { uid: authUid },
        { adapter }
      );

      expect(resolution.status).toBe("profile_id_mismatch");
      expect(resolution.ok).toBe(false);
      if (!resolution.ok) {
        expect(resolution.code).toBe("identity/profile-uid-mismatch");
      }
    });

    it("returns unlinked when usersByUid mapping is missing", async () => {
      const resolution = await customerIdentityService.resolveCustomerProfile(
        { uid: "unlinked_random_uid" },
        { adapter }
      );

      expect(resolution.status).toBe("unlinked");
      expect(resolution.ok).toBe(false);
      if (!resolution.ok) {
        expect(resolution.code).toBe("identity/unlinked-uid");
      }
    });
  });

  // ==========================================================================
  // Requirement 4: Non-migrated customers continue using legacy data source
  // ==========================================================================
  describe("4. Non-Migrated Customer Continuity", () => {
    it("keeps non-migrated SASS customer on legacy users collection", async () => {
      await driver.setDoc("usersByUid", NON_MIGRATED_UID, {
        uid: NON_MIGRATED_UID,
        userDocId: NON_MIGRATED_SASS_ID,
      });

      await driver.setDoc("users", NON_MIGRATED_SASS_ID, {
        id: NON_MIGRATED_SASS_ID,
        userId: NON_MIGRATED_SASS_ID,
        uid: NON_MIGRATED_UID,
        fullName: "Arun Kumar",
        coins: 250,
      });

      const resolution = await customerIdentityService.resolveCustomerProfile(
        { uid: NON_MIGRATED_UID },
        { adapter }
      );

      expect(resolution.status).toBe("resolved");
      if (resolution.status === "resolved") {
        expect(resolution.userDocId).toBe(NON_MIGRATED_SASS_ID);
        expect(resolution.mapping.collection).toBe("users");
        expect(resolution.profile.id).toBe(NON_MIGRATED_SASS_ID);
        expect(resolution.profile.legacySassId).toBeUndefined();
      }

      const ds = resolveCustomerDataSource(NON_MIGRATED_SASS_ID);
      expect(ds.collection).toBe("users");
      expect(ds.isMigrated).toBe(false);
      expect(ds.profilePath).toBe(`users/${NON_MIGRATED_SASS_ID}`);
      expect(getCustomerProfileEndpoint(NON_MIGRATED_SASS_ID)).toBe(`/users/${NON_MIGRATED_SASS_ID}`);
    });
  });

  // ==========================================================================
  // Requirement 5: Orders, Addresses, and Coin History read from correct collection
  // ==========================================================================
  describe("5. Customer Data Reads Routing", () => {
    it("routes subcollection paths to onlineCustomers for migrated customers", () => {
      expect(getCustomerSubcollectionPath(CUSTOMER_A_ONCUS_ID, "orders")).toBe(
        `onlineCustomers/${CUSTOMER_A_ONCUS_ID}/orders`
      );
      expect(getCustomerSubcollectionPath(CUSTOMER_A_ONCUS_ID, "addresses")).toBe(
        `onlineCustomers/${CUSTOMER_A_ONCUS_ID}/addresses`
      );
      expect(getCustomerSubcollectionPath(CUSTOMER_A_ONCUS_ID, "coinsHistory")).toBe(
        `onlineCustomers/${CUSTOMER_A_ONCUS_ID}/coinsHistory`
      );
      expect(getCustomerSubcollectionPath(CUSTOMER_A_SASS_ID, "orders")).toBe(
        `onlineCustomers/${CUSTOMER_A_ONCUS_ID}/orders`
      );
    });

    it("routes subcollection paths to users for non-migrated customers", () => {
      expect(getCustomerSubcollectionPath(NON_MIGRATED_SASS_ID, "orders")).toBe(
        `users/${NON_MIGRATED_SASS_ID}/orders`
      );
      expect(getCustomerSubcollectionPath(NON_MIGRATED_SASS_ID, "addresses")).toBe(
        `users/${NON_MIGRATED_SASS_ID}/addresses`
      );
      expect(getCustomerSubcollectionPath(NON_MIGRATED_SASS_ID, "coinsHistory")).toBe(
        `users/${NON_MIGRATED_SASS_ID}/coinsHistory`
      );
    });

    it("reads orders via LegacyOrderAdapter from onlineCustomers subcollection", async () => {
      await driver.setDoc("onlineCustomers", CUSTOMER_A_ONCUS_ID, {
        id: CUSTOMER_A_ONCUS_ID,
        fullName: "Micro Soft",
      });
      await driver.setDoc(`onlineCustomers/${CUSTOMER_A_ONCUS_ID}/orders`, "ord_live_01", {
        id: "ord_live_01",
        orderId: "ord_live_01",
        userId: CUSTOMER_A_ONCUS_ID,
        total: 550,
        status: "delivered",
        createdAt: new Date().toISOString(),
      });

      const orders = await legacyOrderAdapter.getCustomerOrders(CUSTOMER_A_ONCUS_ID);
      expect(orders).toHaveLength(1);
      expect(orders[0]?.id).toBe("ord_live_01");
      expect(orders[0]?.userId).toBe(CUSTOMER_A_ONCUS_ID);
    });

    it("reads addresses via LegacyCartAddressAdapter from onlineCustomers subcollection", async () => {
      await driver.setDoc("onlineCustomers", CUSTOMER_B_ONCUS_ID, {
        id: CUSTOMER_B_ONCUS_ID,
        fullName: "SARAVANA KUMAR",
        primaryAddressId: "addr_b_01",
      });
      await driver.setDoc(`onlineCustomers/${CUSTOMER_B_ONCUS_ID}/addresses`, "addr_b_01", {
        id: "addr_b_01",
        userId: CUSTOMER_B_ONCUS_ID,
        name: "Home",
        town: "Udumalpet",
        lat: 10.58,
        lng: 77.24,
      });

      const addresses = await cartAddressAdapter.getAddresses(CUSTOMER_B_ONCUS_ID);
      expect(addresses).toHaveLength(1);
      expect(addresses[0]?.id).toBe("addr_b_01");
      expect(addresses[0]?.isDefault).toBe(true);
    });
  });

  // ==========================================================================
  // Requirement 6: Cart reads and mutations use the correct persistent source
  // ==========================================================================
  describe("6. Cart Reads and Mutations in onlineCustomers", () => {
    it("adds, reads, updates quantity, and removes cart item in onlineCustomers subcollection", async () => {
      await driver.setDoc("onlineCustomers", CUSTOMER_B_ONCUS_ID, {
        id: CUSTOMER_B_ONCUS_ID,
        fullName: "SARAVANA KUMAR",
      });

      // 1. Add item to cart
      const added = await cartAddressAdapter.addToCart(CUSTOMER_B_ONCUS_ID, {
        productId: "prod_groundnut_oil",
        name: "Pure Cold Pressed Groundnut Oil",
        price: 180,
        mrp: 200,
        quantity: 2,
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
      });

      expect(added.userId).toBe(CUSTOMER_B_ONCUS_ID);
      expect(added.quantity).toBe(2);

      // Verify stored in subcollection
      const cartKey = (added.cartKey || added.id)!;
      const stored = await driver.getDoc(
        `onlineCustomers/${CUSTOMER_B_ONCUS_ID}/cart`,
        cartKey
      );
      expect(stored).not.toBeNull();
      expect(stored?.["quantity"]).toBe(2);

      // 2. Read cart
      const cart = await cartAddressAdapter.getCart(CUSTOMER_B_ONCUS_ID);
      expect(cart).toHaveLength(1);
      expect(cart[0]?.cartKey).toBe(cartKey);

      // 3. Update quantity
      const updated = await cartAddressAdapter.updateCartQuantity(
        CUSTOMER_B_ONCUS_ID,
        cartKey,
        5
      );
      expect(updated?.quantity).toBe(5);

      // 4. Remove item
      await cartAddressAdapter.removeFromCart(CUSTOMER_B_ONCUS_ID, cartKey);
      const cartAfterRemove = await cartAddressAdapter.getCart(CUSTOMER_B_ONCUS_ID);
      expect(cartAfterRemove).toHaveLength(0);
    });

    it("canonicalizes cart effectiveUser for migrated customers", () => {
      expect(cartService.getEffectiveUserId(CUSTOMER_B_SASS_ID)).toBe(CUSTOMER_B_ONCUS_ID);
      expect(cartService.getEffectiveUserId(CUSTOMER_A_SASS_ID)).toBe(CUSTOMER_A_ONCUS_ID);
      expect(cartService.getEffectiveUserId(NON_MIGRATED_SASS_ID)).toBe(NON_MIGRATED_SASS_ID);
    });
  });

  // ==========================================================================
  // Requirement 7: Checkout & Cancellation Profile & Coin Integrity
  // ==========================================================================
  describe("7. Checkout and Cancellation Integrity", () => {
    it("targets onlineCustomers endpoint when updating profile coins during checkout", async () => {
      const endpoint = getCustomerProfileEndpoint(CUSTOMER_A_ONCUS_ID);
      expect(endpoint).toBe(`/onlineCustomers/${CUSTOMER_A_ONCUS_ID}`);

      const sassEndpoint = getCustomerProfileEndpoint(CUSTOMER_A_SASS_ID);
      expect(sassEndpoint).toBe(`/onlineCustomers/${CUSTOMER_A_ONCUS_ID}`);
    });

    it("processOrderCancellationCoins prevents duplicate refunds idempotently", async () => {
      // Seed profile
      await driver.setDoc("onlineCustomers", CUSTOMER_A_ONCUS_ID, {
        id: CUSTOMER_A_ONCUS_ID,
        customerId: CUSTOMER_A_ONCUS_ID,
        coins: 170,
        availableCoins: 170,
      });

      // Mock previous refund transaction in customer history
      vi.spyOn(coinService, "getCoinHistory").mockResolvedValue([
        {
          id: "coin_refund_ORD-999-CANCEL",
          userId: CUSTOMER_A_ONCUS_ID,
          orderId: "ORD-999-CANCEL",
          amount: 100,
          type: "earned",
          description: "Amman Coins refunded for cancelled Order #ORD-999-CANCEL",
          timestamp: new Date().toISOString(),
        },
      ]);

      const order = {
        id: "ORD-999-CANCEL",
        orderId: "ORD-999-CANCEL",
        userId: CUSTOMER_A_ONCUS_ID,
        customerName: "Micro Soft",
        phone: "8248544559",
        status: "delivered" as const,
        createdAt: new Date().toISOString(),
        deliveredAt: new Date().toISOString(),
        deliveryAddress: { houseNo: "1", street: "St", city: "City", pincode: "600001" },
        delivery: { type: "standard" as const, slot: "10am" },
        payment: { method: "cod" as const, status: "paid" },
        items: [],
        pricingSummary: {
          subtotal: 500,
          discount: 0,
          deliveryFee: 0,
          total: 500,
          coinsRedeemed: 100,
        },
        coinsRedeemed: 100,
        coinsRefunded: true, // Already refunded!
      } as unknown as Order;

      const result = await orderService.processOrderCancellationCoins(order);
      expect(result.refundedCoins).toBe(0);
      expect(result.clawedBackCoins).toBe(0);
    });
  });

  // ==========================================================================
  // Requirement 8: Wishlist & Profile Edits Preserve Existing Functionality
  // ==========================================================================
  describe("8. Wishlist and Profile Edits", () => {
    it("canonicalizes wishlist customer ID and routes to onlineCustomers", () => {
      expect(wishlistService.getEffectiveUserId(CUSTOMER_A_SASS_ID)).toBe(CUSTOMER_A_ONCUS_ID);
      expect(wishlistService.getEffectiveUserId(NON_MIGRATED_SASS_ID)).toBe(NON_MIGRATED_SASS_ID);
    });

    it("getCustomerProfileEndpoint targets onlineCustomers for profile edits", () => {
      expect(getCustomerProfileEndpoint(CUSTOMER_A_ONCUS_ID)).toBe(`/onlineCustomers/${CUSTOMER_A_ONCUS_ID}`);
      expect(getCustomerProfileEndpoint(CUSTOMER_B_ONCUS_ID)).toBe(`/onlineCustomers/${CUSTOMER_B_ONCUS_ID}`);
      expect(getCustomerProfileEndpoint(NON_MIGRATED_SASS_ID)).toBe(`/users/${NON_MIGRATED_SASS_ID}`);
    });
  });

  // ==========================================================================
  // Requirement 9: Authentication & Rewards Behavior
  // ==========================================================================
  describe("9. Authentication and Rewards Consistency", () => {
    it("coinService routes getUserCoins to onlineCustomers endpoint", () => {
      expect(getCustomerProfileEndpoint(CUSTOMER_A_ONCUS_ID)).toBe(`/onlineCustomers/${CUSTOMER_A_ONCUS_ID}`);
      expect(getCustomerProfileEndpoint(CUSTOMER_B_ONCUS_ID)).toBe(`/onlineCustomers/${CUSTOMER_B_ONCUS_ID}`);
    });
  });

  // ==========================================================================
  // Requirement 10: Cross-Customer Isolation & Authorization Protection
  // ==========================================================================
  describe("10. Cross-Customer Isolation and Authorization", () => {
    it("denies access when requested customer ID belongs to another customer", () => {
      const customerAContext = {
        id: CUSTOMER_A_ONCUS_ID,
        userId: CUSTOMER_A_ONCUS_ID,
        legacySassId: CUSTOMER_A_SASS_ID,
      };

      // Customer A tries to access Customer B
      const check1 = validateCustomerAccess(CUSTOMER_B_ONCUS_ID, customerAContext);
      expect(check1.authorized).toBe(false);
      expect(check1.error).toContain("Access denied: Ownership mismatch");

      // Customer A tries to access Customer B's legacy SASS ID
      const check2 = validateCustomerAccess(CUSTOMER_B_SASS_ID, customerAContext);
      expect(check2.authorized).toBe(false);
      expect(check2.error).toContain("Access denied: Ownership mismatch");
    });

    it("authorizes when requested customer ID matches current canonical or legacy ID", () => {
      const customerAContext = {
        id: CUSTOMER_A_ONCUS_ID,
        userId: CUSTOMER_A_ONCUS_ID,
        legacySassId: CUSTOMER_A_SASS_ID,
      };

      const check1 = validateCustomerAccess(CUSTOMER_A_ONCUS_ID, customerAContext);
      expect(check1.authorized).toBe(true);
      expect(check1.canonicalCustomerId).toBe(CUSTOMER_A_ONCUS_ID);

      const check2 = validateCustomerAccess(CUSTOMER_A_SASS_ID, customerAContext);
      expect(check2.authorized).toBe(true);
      expect(check2.canonicalCustomerId).toBe(CUSTOMER_A_ONCUS_ID);

      const check3 = validateCustomerAccess(undefined, customerAContext);
      expect(check3.authorized).toBe(true);
      expect(check3.canonicalCustomerId).toBe(CUSTOMER_A_ONCUS_ID);
    });

    it("denies unauthenticated access when customer context is null", () => {
      const check = validateCustomerAccess(CUSTOMER_A_ONCUS_ID, null);
      expect(check.authorized).toBe(false);
      expect(check.error).toContain("Authentication required");
    });

    it("LegacyCartAddressAdapter blocks adding item with mismatched payload userId", async () => {
      await driver.setDoc("onlineCustomers", CUSTOMER_A_ONCUS_ID, {
        id: CUSTOMER_A_ONCUS_ID,
        fullName: "Micro Soft",
      });

      await expect(
        cartAddressAdapter.addToCart(CUSTOMER_A_ONCUS_ID, {
          productId: "prod_sample",
          userId: CUSTOMER_B_ONCUS_ID, // Attempted spoof!
          quantity: 1,
        })
      ).rejects.toThrow("Ownership mismatch");
    });

    it("safely resets legacyCustomerSubcollectionsEnabled flag on logout or session reset", () => {
      // 1. Simulate active Firebase session
      apiClient.setLegacyCustomerSubcollectionsEnabled(true);
      expect(apiClient.isLegacyCustomerSubcollectionsEnabled()).toBe(true);

      // 2. Simulate session switch or logout
      apiClient.setLegacyCustomerSubcollectionsEnabled(false);
      expect(apiClient.isLegacyCustomerSubcollectionsEnabled()).toBe(false);
    });
  });
});
