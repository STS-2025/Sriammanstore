import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { randomInt, randomUUID } from "node:crypto";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
} from "firebase/firestore";
import { getEmulatorAuth, getEmulatorFirestore } from "../lib/firebaseEmulator";
import { emailLinkAuthService } from "../services/emailLinkAuthService";

// ============================================================================
// CONSTANTS & FIXTURES FOR IN-SCOPE CUSTOMERS & STAFF
// ============================================================================

export const CUSTOMER_1_ONCUS_ID = "ONCUS0000010";
export const CUSTOMER_1_LEGACY_SASS_ID = "SASS0000010";
export const CUSTOMER_1_PRIMARY_UID = "uQXNJ5pMoVR9GG4E9NC9J122EFi2";
export const CUSTOMER_1_LINKED_UID = "xqaAMMgjMvSZwCNJ7bpMp6RC0XI2";
export const CUSTOMER_1_EMAIL = "microsoft44559@gmail.com";

export const CUSTOMER_2_ONCUS_ID = "ONCUS0000021";
export const CUSTOMER_2_LEGACY_SASS_ID = "SASS0000021";
export const CUSTOMER_2_PRIMARY_UID = "HBbNTuCtczLLbBCvsww58NEqXRz2";
export const CUSTOMER_2_EMAIL = "saravana21@sriamman.test";

export const STAFF_ACCOUNT_ID = "SASS0000018";
export const STAFF_ACCOUNT_UID = "cG4VWBpGV0T2UbuobG0XycEpiq03"; // Verified production store_manager UID
export const STAFF_ACCOUNT_ROLE = "store_manager";

// Subcollections in scope for hardened owner isolation
export const TARGET_SUBCOLLECTIONS = [
  "orders",
  "addresses",
  "coinsHistory",
  "cart",
  "wishlists",
] as const;

// ============================================================================
// FIRESTORE RULES LOGIC SIMULATOR (CEL SEMANTICS ENGINE)
// Models exact Common Expression Language behavior from firestore.rules.production-proposal
// ============================================================================

export interface AuthContext {
  uid: string | null;
  token?: Record<string, unknown>;
}

export interface MockDatabaseState {
  usersByUid: Record<string, Record<string, unknown>>;
  onlineCustomers: Record<string, Record<string, unknown>>;
  users: Record<string, Record<string, unknown>>;
  orders: Record<string, Record<string, unknown>>;
  subcollections: Record<string, Record<string, unknown>>; // path -> doc
}

export class FirestoreProductionRulesEvaluator {
  constructor(public state: MockDatabaseState) {}

  isBoundedString(val: unknown, maxLen: number): boolean {
    return typeof val === "string" && val.length <= maxLen;
  }

  isNonEmptyString(val: unknown, maxLen: number): boolean {
    return typeof val === "string" && val.length > 0 && val.length <= maxLen;
  }

  isValidCoordinateValue(val: unknown): boolean {
    return typeof val === "number" || (typeof val === "string" && val.length <= 64);
  }

  hasValidLatitude(data: Record<string, unknown>): boolean {
    return (
      ("lat" in data || "latitude" in data) &&
      (!("lat" in data) || this.isValidCoordinateValue(data["lat"])) &&
      (!("latitude" in data) || this.isValidCoordinateValue(data["latitude"]))
    );
  }

  hasValidLongitude(data: Record<string, unknown>): boolean {
    return (
      ("lng" in data || "longitude" in data) &&
      (!("lng" in data) || this.isValidCoordinateValue(data["lng"])) &&
      (!("longitude" in data) || this.isValidCoordinateValue(data["longitude"]))
    );
  }

  hasValidCityOrTown(data: Record<string, unknown>): boolean {
    return (
      ("city" in data || "town" in data) &&
      (!("city" in data) || this.isBoundedString(data["city"], 256)) &&
      (!("town" in data) || this.isBoundedString(data["town"], 256))
    );
  }

  hasValidCustomerScope(data: Record<string, unknown>): boolean {
    return this.isNonEmptyString(data["userId"], 128);
  }

  isValidCustomerCartItem(data: Record<string, unknown>): boolean {
    return (
      "productId" in data &&
      this.isBoundedString(data["productId"], 128) &&
      "quantity" in data &&
      typeof data["quantity"] === "number" &&
      data["quantity"] > 0 &&
      (!("userId" in data) || this.hasValidCustomerScope(data))
    );
  }

  isValidCustomerAddress(data: Record<string, unknown>): boolean {
    return (
      this.hasValidCityOrTown(data) &&
      this.hasValidLatitude(data) &&
      this.hasValidLongitude(data) &&
      (!("userId" in data) || this.hasValidCustomerScope(data))
    );
  }

  isValidWishlist(data: Record<string, unknown>): boolean {
    return (
      "title" in data &&
      this.isBoundedString(data["title"], 256) &&
      (!("userId" in data) || this.hasValidCustomerScope(data))
    );
  }

  isValidWishlistProduct(data: Record<string, unknown>): boolean {
    return (
      "productId" in data &&
      this.isBoundedString(data["productId"], 128) &&
      (!("wishlistId" in data) || this.isBoundedString(data["wishlistId"], 128)) &&
      (!("userId" in data) || this.hasValidCustomerScope(data))
    );
  }

  /**
   * Evaluates isAuthorizedOnlineCustomer(customerId) according to CEL definition
   */
  isAuthorizedOnlineCustomer(auth: AuthContext, customerId: string): boolean {
    if (!auth.uid) return false;

    // Condition 1: usersByUid mapping match
    const uidDoc = this.state.usersByUid[auth.uid];
    if (uidDoc) {
      if (uidDoc["userDocId"] === customerId) return true;
      if (uidDoc["customerId"] === customerId) return true;
    }

    // Condition 2: onlineCustomers document verification
    const custDoc = this.state.onlineCustomers[customerId];
    if (custDoc) {
      if (custDoc["uid"] === auth.uid) return true;
      if (
        Array.isArray(custDoc["linkedUids"]) &&
        custDoc["linkedUids"].includes(auth.uid)
      ) {
        return true;
      }
      // Migration bridge: usersByUid has legacySassId matching customer's legacySassId
      if (
        uidDoc &&
        custDoc["legacySassId"] &&
        (uidDoc["userDocId"] === custDoc["legacySassId"] ||
         uidDoc["legacySassId"] === custDoc["legacySassId"])
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Evaluates unified isAuthorizedCustomer(userId)
   */
  isAuthorizedCustomer(auth: AuthContext, userId: string): boolean {
    if (!auth.uid) return false;
    if (auth.uid === userId) return true;
    if (this.isAuthorizedOnlineCustomer(auth, userId)) return true;

    const uidDoc = this.state.usersByUid[auth.uid];
    if (uidDoc) {
      if (uidDoc["userDocId"] === userId) return true;
      if (uidDoc["legacySassId"] === userId) return true;
    }

    const legacyUser = this.state.users[userId];
    if (legacyUser) {
      if (legacyUser["uid"] === auth.uid) return true;
      if (
        Array.isArray(legacyUser["linkedUids"]) &&
        legacyUser["linkedUids"].includes(auth.uid)
      ) {
        return true;
      }
    }

    return false;
  }

  // --- Collection Rule Evaluations ---

  evaluateOnlineCustomerRead(auth: AuthContext, customerId: string): boolean {
    return this.isAuthorizedOnlineCustomer(auth, customerId);
  }

  evaluateOnlineCustomerWrite(_auth: AuthContext, _customerId: string): boolean {
    // allow write: if false;
    return false;
  }

  evaluateSubcollectionRead(
    auth: AuthContext,
    customerId: string,
    _subcollection: string,
    _docId: string
  ): boolean {
    return this.isAuthorizedOnlineCustomer(auth, customerId);
  }

  evaluateOrdersWrite(_auth: AuthContext, _customerId: string): boolean {
    return false;
  }

  evaluateCoinsHistoryWrite(_auth: AuthContext, _customerId: string): boolean {
    return false;
  }

  evaluateCartCreateOrUpdate(
    auth: AuthContext,
    customerId: string,
    data: Record<string, unknown>,
    existingDoc?: Record<string, unknown>
  ): boolean {
    if (!this.isAuthorizedOnlineCustomer(auth, customerId)) return false;
    if (!this.isValidCustomerCartItem(data)) return false;
    if (!("userId" in data)) return true;
    if (data["userId"] === customerId) return true;
    if (existingDoc && existingDoc["legacySassId"] && data["userId"] === existingDoc["legacySassId"]) {
      return true;
    }
    const custDoc = this.state.onlineCustomers[customerId];
    if (custDoc && custDoc["legacySassId"] && data["userId"] === custDoc["legacySassId"]) {
      return true;
    }
    return false;
  }

  evaluateCartDelete(auth: AuthContext, customerId: string): boolean {
    return this.isAuthorizedOnlineCustomer(auth, customerId);
  }

  evaluateAddressCreateOrUpdate(
    auth: AuthContext,
    customerId: string,
    data: Record<string, unknown>,
    existingDoc?: Record<string, unknown>
  ): boolean {
    if (!this.isAuthorizedOnlineCustomer(auth, customerId)) return false;
    if (!this.isValidCustomerAddress(data)) return false;
    if (!("userId" in data)) return true;
    if (data["userId"] === customerId) return true;
    if (existingDoc && existingDoc["legacySassId"] && data["userId"] === existingDoc["legacySassId"]) {
      return true;
    }
    const custDoc = this.state.onlineCustomers[customerId];
    if (custDoc && custDoc["legacySassId"] && data["userId"] === custDoc["legacySassId"]) {
      return true;
    }
    return false;
  }

  evaluateAddressDelete(auth: AuthContext, customerId: string): boolean {
    return this.isAuthorizedOnlineCustomer(auth, customerId);
  }

  evaluateWishlistCreateOrUpdate(
    auth: AuthContext,
    customerId: string,
    data: Record<string, unknown>
  ): boolean {
    if (!this.isAuthorizedOnlineCustomer(auth, customerId)) return false;
    return this.isValidWishlist(data);
  }

  evaluateWishlistDelete(auth: AuthContext, customerId: string): boolean {
    return this.isAuthorizedOnlineCustomer(auth, customerId);
  }

  evaluateWishlistProductCreateOrUpdate(
    auth: AuthContext,
    customerId: string,
    data: Record<string, unknown>
  ): boolean {
    if (!this.isAuthorizedOnlineCustomer(auth, customerId)) return false;
    return this.isValidWishlistProduct(data);
  }

  evaluateWishlistProductDelete(auth: AuthContext, customerId: string): boolean {
    return this.isAuthorizedOnlineCustomer(auth, customerId);
  }

  evaluateSubcollectionWrite(
    auth: AuthContext,
    customerId: string,
    subcollection: string,
    _docId: string,
    data?: Record<string, unknown>
  ): boolean {
    if (subcollection === "orders" || subcollection === "coinsHistory") {
      return false;
    }
    if (subcollection === "cart") {
      return this.evaluateCartCreateOrUpdate(auth, customerId, data || { productId: "p1", quantity: 1 });
    }
    if (subcollection === "addresses") {
      return this.evaluateAddressCreateOrUpdate(auth, customerId, data || { city: "Erode", lat: 11.0, lng: 77.0 });
    }
    if (subcollection === "wishlists") {
      return this.evaluateWishlistCreateOrUpdate(auth, customerId, data || { title: "Favorites" });
    }
    return false;
  }

  evaluateUsersByUidGet(auth: AuthContext, targetUid: string): boolean {
    return auth.uid !== null && auth.uid === targetUid;
  }

  evaluateUsersByUidWrite(_auth: AuthContext, _targetUid: string): boolean {
    return false;
  }
}

// ============================================================================
// LIVE EMULATOR HELPER
// ============================================================================

const AUTH_OOB_URL =
  "http://127.0.0.1:9099/emulator/v1/projects/demo-sri-amman-store/oobCodes";
const EMULATOR_REST_DOCS_URL =
  "http://127.0.0.1:8081/v1/projects/demo-sri-amman-store/databases/(default)/documents";

async function createEmulatorDocument(
  documentPath: string,
  fields: Record<string, unknown>,
  createdDocumentPaths: Set<string>
): Promise<void> {
  const separator = documentPath.lastIndexOf("/");
  const collectionPath = documentPath.slice(0, separator);
  const documentId = documentPath.slice(separator + 1);
  const response = await fetch(
    `${EMULATOR_REST_DOCS_URL}/${collectionPath}?documentId=${encodeURIComponent(documentId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer owner",
      },
      body: JSON.stringify({ fields }),
    }
  );
  if (!response.ok) {
    throw new Error(
      `Could not create test-owned emulator document (${response.status}); existing data was left unchanged.`
    );
  }
  createdDocumentPaths.add(documentPath);
}

async function deleteTestAuthAccount(idToken: string | null): Promise<Response | null> {
  if (!idToken) return null;
  return fetch(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:delete?key=emulator-api-key",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );
}

async function areLiveEmulatorsReachable(): Promise<boolean> {
  try {
    const [authRes, firestoreRes] = await Promise.all([
      fetch(AUTH_OOB_URL, { method: "GET" }),
      fetch("http://127.0.0.1:8081/", { method: "GET" }),
    ]);
    return authRes.ok && (firestoreRes.ok || firestoreRes.status < 500);
  } catch {
    return false;
  }
}

// ============================================================================
// TEST SUITE
// ============================================================================

describe("Production Firestore Security Rules Proposal (onlineCustomers Migration)", () => {
  let dbState: MockDatabaseState;
  let evaluator: FirestoreProductionRulesEvaluator;

  beforeEach(() => {
    // Seed canonical state representing Sri Amman Smart Store production migration
    dbState = {
      usersByUid: {
        [CUSTOMER_1_PRIMARY_UID]: {
          uid: CUSTOMER_1_PRIMARY_UID,
          userDocId: CUSTOMER_1_LEGACY_SASS_ID, // Transition pointer to legacy SASS
        },
        [CUSTOMER_1_LINKED_UID]: {
          uid: CUSTOMER_1_LINKED_UID,
          userDocId: CUSTOMER_1_LEGACY_SASS_ID,
        },
        [CUSTOMER_2_PRIMARY_UID]: {
          uid: CUSTOMER_2_PRIMARY_UID,
          userDocId: CUSTOMER_2_LEGACY_SASS_ID,
        },
        [STAFF_ACCOUNT_UID]: {
          uid: STAFF_ACCOUNT_UID,
          userDocId: STAFF_ACCOUNT_ID,
        },
      },
      onlineCustomers: {
        [CUSTOMER_1_ONCUS_ID]: {
          id: CUSTOMER_1_ONCUS_ID,
          customerId: CUSTOMER_1_ONCUS_ID,
          legacySassId: CUSTOMER_1_LEGACY_SASS_ID,
          uid: CUSTOMER_1_PRIMARY_UID,
          linkedUids: [CUSTOMER_1_PRIMARY_UID, CUSTOMER_1_LINKED_UID],
          fullName: "Micro Soft",
          phone: "8248544559",
          coins: 170,
        },
        [CUSTOMER_2_ONCUS_ID]: {
          id: CUSTOMER_2_ONCUS_ID,
          customerId: CUSTOMER_2_ONCUS_ID,
          legacySassId: CUSTOMER_2_LEGACY_SASS_ID,
          uid: CUSTOMER_2_PRIMARY_UID,
          linkedUids: [CUSTOMER_2_PRIMARY_UID],
          fullName: "SARAVANA KUMAR",
          phone: "8778401325",
          coins: 50,
        },
      },
      users: {
        [STAFF_ACCOUNT_ID]: {
          id: STAFF_ACCOUNT_ID,
          userId: STAFF_ACCOUNT_ID,
          name: "Operations Manager",
          role: STAFF_ACCOUNT_ROLE,
          phone: "9876543218",
        },
      },
      orders: {},
      subcollections: {},
    };

    evaluator = new FirestoreProductionRulesEvaluator(dbState);
  });

  // ==========================================================================
  // 1. Authorized Owner Access to Profile & Subcollections
  // ==========================================================================
  describe("1. Authorized Owner Access to Profile and Subcollections", () => {
    it("allows Customer 1 (primary UID) to read onlineCustomers/ONCUS0000010 profile", () => {
      const auth = { uid: CUSTOMER_1_PRIMARY_UID };
      const canRead = evaluator.evaluateOnlineCustomerRead(
        auth,
        CUSTOMER_1_ONCUS_ID
      );
      expect(canRead).toBe(true);
    });

    it("allows Customer 1 (linked UID) to read onlineCustomers/ONCUS0000010 via linkedUids and legacySassId bridge", () => {
      const auth = { uid: CUSTOMER_1_LINKED_UID };
      const canRead = evaluator.evaluateOnlineCustomerRead(
        auth,
        CUSTOMER_1_ONCUS_ID
      );
      expect(canRead).toBe(true);
    });

    it("allows Customer 2 to read onlineCustomers/ONCUS0000021 profile", () => {
      const auth = { uid: CUSTOMER_2_PRIMARY_UID };
      const canRead = evaluator.evaluateOnlineCustomerRead(
        auth,
        CUSTOMER_2_ONCUS_ID
      );
      expect(canRead).toBe(true);
    });

    it("allows Customer 1 to read all own subcollections (orders, addresses, coinsHistory, cart, wishlists)", () => {
      const auth = { uid: CUSTOMER_1_PRIMARY_UID };

      for (const sub of TARGET_SUBCOLLECTIONS) {
        const canRead = evaluator.evaluateSubcollectionRead(
          auth,
          CUSTOMER_1_ONCUS_ID,
          sub,
          `doc_${sub}_1`
        );
        expect(canRead).toBe(true);
      }
    });

    it("allows Customer 2 to read all own subcollections", () => {
      const auth = { uid: CUSTOMER_2_PRIMARY_UID };

      for (const sub of TARGET_SUBCOLLECTIONS) {
        const canRead = evaluator.evaluateSubcollectionRead(
          auth,
          CUSTOMER_2_ONCUS_ID,
          sub,
          `doc_${sub}_2`
        );
        expect(canRead).toBe(true);
      }
    });

    it("supports direct usersByUid customerId / userDocId mapping once repointed to ONCUS", () => {
      // Simulate post-migration state where usersByUid points directly to ONCUS
      dbState.usersByUid[CUSTOMER_1_PRIMARY_UID] = {
        uid: CUSTOMER_1_PRIMARY_UID,
        userDocId: CUSTOMER_1_ONCUS_ID,
        customerId: CUSTOMER_1_ONCUS_ID,
      };

      const auth = { uid: CUSTOMER_1_PRIMARY_UID };
      expect(
        evaluator.evaluateOnlineCustomerRead(auth, CUSTOMER_1_ONCUS_ID)
      ).toBe(true);
    });
  });

  // ==========================================================================
  // 2. Unauthenticated Denial (403 / permission-denied)
  // ==========================================================================
  describe("2. Unauthenticated Access Denial", () => {
    const unauth: AuthContext = { uid: null };

    it("denies unauthenticated read to onlineCustomers/ONCUS0000010", () => {
      expect(
        evaluator.evaluateOnlineCustomerRead(unauth, CUSTOMER_1_ONCUS_ID)
      ).toBe(false);
    });

    it("denies unauthenticated read to onlineCustomers/ONCUS0000021", () => {
      expect(
        evaluator.evaluateOnlineCustomerRead(unauth, CUSTOMER_2_ONCUS_ID)
      ).toBe(false);
    });

    it("denies unauthenticated read across all customer subcollections", () => {
      for (const sub of TARGET_SUBCOLLECTIONS) {
        expect(
          evaluator.evaluateSubcollectionRead(
            unauth,
            CUSTOMER_1_ONCUS_ID,
            sub,
            "test_doc"
          )
        ).toBe(false);
      }
    });

    it("denies unauthenticated writes across all customer collections", () => {
      expect(
        evaluator.evaluateOnlineCustomerWrite(unauth, CUSTOMER_1_ONCUS_ID)
      ).toBe(false);
      expect(
        evaluator.evaluateSubcollectionWrite(
          unauth,
          CUSTOMER_1_ONCUS_ID,
          "orders",
          "test_order"
        )
      ).toBe(false);
    });
  });

  // ==========================================================================
  // 3. Cross-Customer Access Denial (Customer B cannot read Customer A)
  // ==========================================================================
  describe("3. Cross-Customer Access Denial", () => {
    it("denies Customer 2 (HBbN...XRz2) from reading Customer 1 (ONCUS0000010) profile", () => {
      const authCustomer2 = { uid: CUSTOMER_2_PRIMARY_UID };
      const canRead = evaluator.evaluateOnlineCustomerRead(
        authCustomer2,
        CUSTOMER_1_ONCUS_ID
      );
      expect(canRead).toBe(false);
    });

    it("denies Customer 1 (uQXN...EFi2) from reading Customer 2 (ONCUS0000021) profile", () => {
      const authCustomer1 = { uid: CUSTOMER_1_PRIMARY_UID };
      const canRead = evaluator.evaluateOnlineCustomerRead(
        authCustomer1,
        CUSTOMER_2_ONCUS_ID
      );
      expect(canRead).toBe(false);
    });

    it("denies Customer 2 from reading Customer 1's orders subcollection", () => {
      const authCustomer2 = { uid: CUSTOMER_2_PRIMARY_UID };
      const canRead = evaluator.evaluateSubcollectionRead(
        authCustomer2,
        CUSTOMER_1_ONCUS_ID,
        "orders",
        "5sai5RQfkrMxxHMK16w5"
      );
      expect(canRead).toBe(false);
    });

    it("denies Customer 2 from reading Customer 1's addresses subcollection", () => {
      const authCustomer2 = { uid: CUSTOMER_2_PRIMARY_UID };
      const canRead = evaluator.evaluateSubcollectionRead(
        authCustomer2,
        CUSTOMER_1_ONCUS_ID,
        "addresses",
        "FLt4kmBxCEATgSRPD6nK"
      );
      expect(canRead).toBe(false);
    });

    it("denies Customer 2 from reading Customer 1's coinsHistory subcollection", () => {
      const authCustomer2 = { uid: CUSTOMER_2_PRIMARY_UID };
      const canRead = evaluator.evaluateSubcollectionRead(
        authCustomer2,
        CUSTOMER_1_ONCUS_ID,
        "coinsHistory",
        "ORD-0000023"
      );
      expect(canRead).toBe(false);
    });

    it("denies Customer 2 from reading Customer 1's cart or wishlists subcollections", () => {
      const authCustomer2 = { uid: CUSTOMER_2_PRIMARY_UID };
      expect(
        evaluator.evaluateSubcollectionRead(
          authCustomer2,
          CUSTOMER_1_ONCUS_ID,
          "cart",
          "cart_item_01"
        )
      ).toBe(false);
      expect(
        evaluator.evaluateSubcollectionRead(
          authCustomer2,
          CUSTOMER_1_ONCUS_ID,
          "wishlists",
          "wl_01"
        )
      ).toBe(false);
    });
  });

  // ==========================================================================
  // 4. Secure Customer Mutation Rules (Cart, Addresses, Wishlists Allowed; Profile, Coins, Orders Denied)
  // ==========================================================================
  describe("4. Secure Customer Mutation Rules (Cart, Addresses, Wishlists Allowed; Profile, Coins, Orders Denied)", () => {
    it("allows owner to write to own cart (create, update, delete)", () => {
      const ownerAuth = { uid: CUSTOMER_1_PRIMARY_UID };
      const validCartItem = {
        productId: "prod_rice_01",
        quantity: 2,
        userId: CUSTOMER_1_ONCUS_ID,
      };

      // Create
      expect(
        evaluator.evaluateCartCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          validCartItem
        )
      ).toBe(true);

      // Update
      expect(
        evaluator.evaluateCartCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          { ...validCartItem, quantity: 5 }
        )
      ).toBe(true);

      // Delete
      expect(
        evaluator.evaluateCartDelete(ownerAuth, CUSTOMER_1_ONCUS_ID)
      ).toBe(true);
    });

    it("allows owner to write cart item using legacy SASS ID migration bridge", () => {
      const ownerAuth = { uid: CUSTOMER_1_PRIMARY_UID };
      const cartItemWithLegacyId = {
        productId: "prod_dal_01",
        quantity: 1,
        userId: CUSTOMER_1_LEGACY_SASS_ID,
      };
      expect(
        evaluator.evaluateCartCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          cartItemWithLegacyId
        )
      ).toBe(true);
    });

    it("allows owner to write to own addresses (create, update, delete)", () => {
      const ownerAuth = { uid: CUSTOMER_1_PRIMARY_UID };
      const validAddress = {
        city: "Erode",
        lat: 11.341,
        lng: 77.717,
        userId: CUSTOMER_1_ONCUS_ID,
      };

      // Create
      expect(
        evaluator.evaluateAddressCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          validAddress
        )
      ).toBe(true);

      // Update
      expect(
        evaluator.evaluateAddressCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          { ...validAddress, city: "Perundurai" }
        )
      ).toBe(true);

      // Delete
      expect(
        evaluator.evaluateAddressDelete(ownerAuth, CUSTOMER_1_ONCUS_ID)
      ).toBe(true);
    });

    it("allows owner to write to own wishlists and wishlist products (create, update, delete)", () => {
      const ownerAuth = { uid: CUSTOMER_1_PRIMARY_UID };
      const validWishlist = {
        title: "Festival Favorites",
        userId: CUSTOMER_1_ONCUS_ID,
      };
      const validProduct = {
        productId: "prod_sweet_01",
        wishlistId: "wl_01",
        userId: CUSTOMER_1_ONCUS_ID,
      };

      // Wishlist create, update, delete
      expect(
        evaluator.evaluateWishlistCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          validWishlist
        )
      ).toBe(true);
      expect(
        evaluator.evaluateWishlistDelete(ownerAuth, CUSTOMER_1_ONCUS_ID)
      ).toBe(true);

      // Wishlist product create, update, delete
      expect(
        evaluator.evaluateWishlistProductCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          validProduct
        )
      ).toBe(true);
      expect(
        evaluator.evaluateWishlistProductDelete(ownerAuth, CUSTOMER_1_ONCUS_ID)
      ).toBe(true);
    });

    it("fails validation when invalid cart item is provided (negative quantity, missing productId)", () => {
      const ownerAuth = { uid: CUSTOMER_1_PRIMARY_UID };

      // Negative quantity
      expect(
        evaluator.evaluateCartCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          { productId: "prod_01", quantity: -1 }
        )
      ).toBe(false);

      // Zero quantity
      expect(
        evaluator.evaluateCartCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          { productId: "prod_01", quantity: 0 }
        )
      ).toBe(false);

      // Missing productId
      expect(
        evaluator.evaluateCartCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          { quantity: 2 }
        )
      ).toBe(false);
    });

    it("fails validation when invalid address is provided (missing city/town or invalid lat/lng)", () => {
      const ownerAuth = { uid: CUSTOMER_1_PRIMARY_UID };

      // Missing city or town
      expect(
        evaluator.evaluateAddressCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          { lat: 11.34, lng: 77.72 }
        )
      ).toBe(false);

      // Missing latitude
      expect(
        evaluator.evaluateAddressCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          { city: "Erode", lng: 77.72 }
        )
      ).toBe(false);

      // Missing longitude
      expect(
        evaluator.evaluateAddressCreateOrUpdate(
          ownerAuth,
          CUSTOMER_1_ONCUS_ID,
          { city: "Erode", lat: 11.34 }
        )
      ).toBe(false);
    });

    it("denies owner from writing to profile, coinsHistory, or orders (strictly server/Cloud Functions managed)", () => {
      const ownerAuth = { uid: CUSTOMER_1_PRIMARY_UID };

      // Profile write denied
      expect(
        evaluator.evaluateOnlineCustomerWrite(ownerAuth, CUSTOMER_1_ONCUS_ID)
      ).toBe(false);

      // Orders write denied
      expect(
        evaluator.evaluateOrdersWrite(ownerAuth, CUSTOMER_1_ONCUS_ID)
      ).toBe(false);

      // CoinsHistory write denied
      expect(
        evaluator.evaluateCoinsHistoryWrite(ownerAuth, CUSTOMER_1_ONCUS_ID)
      ).toBe(false);
    });

    it("denies foreign customer from reading or writing to any customer collections", () => {
      const foreignAuth = { uid: CUSTOMER_2_PRIMARY_UID };

      // Deny reads
      expect(
        evaluator.evaluateOnlineCustomerRead(foreignAuth, CUSTOMER_1_ONCUS_ID)
      ).toBe(false);
      expect(
        evaluator.evaluateSubcollectionRead(
          foreignAuth,
          CUSTOMER_1_ONCUS_ID,
          "cart",
          "item_01"
        )
      ).toBe(false);
      expect(
        evaluator.evaluateSubcollectionRead(
          foreignAuth,
          CUSTOMER_1_ONCUS_ID,
          "addresses",
          "addr_01"
        )
      ).toBe(false);
      expect(
        evaluator.evaluateSubcollectionRead(
          foreignAuth,
          CUSTOMER_1_ONCUS_ID,
          "wishlists",
          "wl_01"
        )
      ).toBe(false);

      // Deny writes
      expect(
        evaluator.evaluateCartCreateOrUpdate(
          foreignAuth,
          CUSTOMER_1_ONCUS_ID,
          { productId: "prod_01", quantity: 1 }
        )
      ).toBe(false);
      expect(
        evaluator.evaluateCartDelete(foreignAuth, CUSTOMER_1_ONCUS_ID)
      ).toBe(false);
      expect(
        evaluator.evaluateAddressCreateOrUpdate(
          foreignAuth,
          CUSTOMER_1_ONCUS_ID,
          { city: "Erode", lat: 11.0, lng: 77.0 }
        )
      ).toBe(false);
      expect(
        evaluator.evaluateWishlistCreateOrUpdate(
          foreignAuth,
          CUSTOMER_1_ONCUS_ID,
          { title: "Foreign Wishlist" }
        )
      ).toBe(false);
    });

    it("denies unauthenticated client from reading or writing to any customer collections", () => {
      const unauth: AuthContext = { uid: null };

      expect(
        evaluator.evaluateOnlineCustomerRead(unauth, CUSTOMER_1_ONCUS_ID)
      ).toBe(false);
      expect(
        evaluator.evaluateCartCreateOrUpdate(
          unauth,
          CUSTOMER_1_ONCUS_ID,
          { productId: "prod_01", quantity: 1 }
        )
      ).toBe(false);
      expect(
        evaluator.evaluateCartDelete(unauth, CUSTOMER_1_ONCUS_ID)
      ).toBe(false);
      expect(
        evaluator.evaluateAddressCreateOrUpdate(
          unauth,
          CUSTOMER_1_ONCUS_ID,
          { city: "Erode", lat: 11.0, lng: 77.0 }
        )
      ).toBe(false);
      expect(
        evaluator.evaluateWishlistCreateOrUpdate(
          unauth,
          CUSTOMER_1_ONCUS_ID,
          { title: "Wishlist" }
        )
      ).toBe(false);
    });
  });

  // ==========================================================================
  // 5. Operational Staff Account Isolation
  // ==========================================================================
  describe("5. Operational Staff Account Isolation", () => {
    it("strictly isolates store_manager mapped to users/SASS0000018 from reading onlineCustomers/ONCUS0000010", () => {
      const staffAuth = { uid: STAFF_ACCOUNT_UID };
      const canRead = evaluator.evaluateOnlineCustomerRead(
        staffAuth,
        CUSTOMER_1_ONCUS_ID
      );
      expect(canRead).toBe(false);
    });

    it("strictly isolates store_manager from reading onlineCustomers/ONCUS0000021", () => {
      const staffAuth = { uid: STAFF_ACCOUNT_UID };
      const canRead = evaluator.evaluateOnlineCustomerRead(
        staffAuth,
        CUSTOMER_2_ONCUS_ID
      );
      expect(canRead).toBe(false);
    });

    it("strictly isolates store_manager from reading customer subcollections", () => {
      const staffAuth = { uid: STAFF_ACCOUNT_UID };
      for (const sub of TARGET_SUBCOLLECTIONS) {
        expect(
          evaluator.evaluateSubcollectionRead(
            staffAuth,
            CUSTOMER_1_ONCUS_ID,
            sub,
            "doc_1"
          )
        ).toBe(false);
      }
    });

    it("staff account cannot write to onlineCustomers or subcollections", () => {
      const staffAuth = { uid: STAFF_ACCOUNT_UID };
      expect(
        evaluator.evaluateOnlineCustomerWrite(staffAuth, CUSTOMER_1_ONCUS_ID)
      ).toBe(false);
      expect(
        evaluator.evaluateSubcollectionWrite(
          staffAuth,
          CUSTOMER_1_ONCUS_ID,
          "orders",
          "order_staff_write"
        )
      ).toBe(false);
    });
  });

  // ==========================================================================
  // 6. usersByUid Identity Protection
  // ==========================================================================
  describe("6. usersByUid Identity Protection", () => {
    it("allows users to get their own usersByUid document", () => {
      const auth = { uid: CUSTOMER_1_PRIMARY_UID };
      expect(
        evaluator.evaluateUsersByUidGet(auth, CUSTOMER_1_PRIMARY_UID)
      ).toBe(true);
    });

    it("denies users from getting another user's usersByUid document", () => {
      const auth = { uid: CUSTOMER_1_PRIMARY_UID };
      expect(
        evaluator.evaluateUsersByUidGet(auth, CUSTOMER_2_PRIMARY_UID)
      ).toBe(false);
    });

    it("denies client writes to usersByUid (must be Admin SDK managed)", () => {
      const auth = { uid: CUSTOMER_1_PRIMARY_UID };
      expect(
        evaluator.evaluateUsersByUidWrite(auth, CUSTOMER_1_PRIMARY_UID)
      ).toBe(false);
    });
  });

  // ==========================================================================
  // 7. Live Firebase Emulator Verification (When 127.0.0.1:9099/8081 reachable)
  // ==========================================================================
  describe("7. Live Firestore & Auth Emulator Security Rules Integration", () => {
    it("verifies live rules against local emulator when running", async () => {
      const reachable = await areLiveEmulatorsReachable();
      if (!reachable) {
        console.warn(
          "[test] Local Firebase emulators not running on 127.0.0.1:9099/8081. Skipping live SDK rules execution."
        );
        return;
      }

      const { db } = getEmulatorFirestore();
      const runSuffix = randomUUID();
      const ownerEmail = `sec.oncus.owner.${runSuffix}@sriamman.test`;
      const otherEmail = `sec.oncus.other.${runSuffix}@sriamman.test`;

      const testOncusId = `ONCUS${randomInt(1_000_000, 10_000_000)}`;
      const createdDocumentPaths = new Set<string>();
      let ownerIdToken: string | null = null;
      let otherIdToken: string | null = null;

      try {
        // 1. Authenticate Owner
        await emailLinkAuthService.sendSignInLink(ownerEmail, {
          continueUrl: "http://localhost:5173/login",
        });
        const oobRes = await fetch(AUTH_OOB_URL);
        const oobData = (await oobRes.json()) as {
          oobCodes?: Array<{ email?: string; oobLink?: string }>;
        };
        const codes = (oobData.oobCodes ?? []).filter(
          (e) => e.email?.toLowerCase() === ownerEmail.toLowerCase()
        );
        const ownerSignIn =
          await emailLinkAuthService.completeSignInWithEmailLink(
            codes[codes.length - 1]!.oobLink!
          );
        const ownerUid = ownerSignIn.uid;
        ownerIdToken = await getEmulatorAuth().auth.currentUser?.getIdToken() ?? null;

        // 2. Administratively seed usersByUid and onlineCustomers via REST
        await createEmulatorDocument(
          `usersByUid/${ownerUid}`,
          {
            uid: { stringValue: ownerUid },
            userDocId: { stringValue: testOncusId },
          },
          createdDocumentPaths
        );

        await createEmulatorDocument(
          `onlineCustomers/${testOncusId}`,
          {
            id: { stringValue: testOncusId },
            customerId: { stringValue: testOncusId },
            uid: { stringValue: ownerUid },
            fullName: { stringValue: "Live Test Customer" },
            coins: { integerValue: "100" },
          },
          createdDocumentPaths
        );

        await createEmulatorDocument(
          `onlineCustomers/${testOncusId}/orders/ord_live_01`,
          {
            id: { stringValue: "ord_live_01" },
            orderId: { stringValue: "ord_live_01" },
            userId: { stringValue: testOncusId },
            totalAmount: { integerValue: "500" },
          },
          createdDocumentPaths
        );

        // 3. Owner CAN read onlineCustomers/{testOncusId}
        const profileRef = doc(db, "onlineCustomers", testOncusId);
        const snap = await getDoc(profileRef);
        expect(snap.exists()).toBe(true);

        // 4. Owner CAN read owner's order subcollection
        const orderRef = doc(db, "onlineCustomers", testOncusId, "orders", "ord_live_01");
        const orderSnap = await getDoc(orderRef);
        expect(orderSnap.exists()).toBe(true);

        // 5. Owner CANNOT write to onlineCustomers/{testOncusId} (profile writes denied)
        await expect(
          updateDoc(profileRef, { fullName: "Tampered Name" })
        ).rejects.toMatchObject({
          code: "permission-denied",
        });
        await expect(
          updateDoc(profileRef, { coins: 99999 })
        ).rejects.toMatchObject({
          code: "permission-denied",
        });

        // 6. Owner CANNOT write to orders subcollection (write denied)
        await expect(
          setDoc(orderRef, { orderId: "ord_tampered", userId: testOncusId })
        ).rejects.toMatchObject({
          code: "permission-denied",
        });

        // 7. Owner CANNOT write to coinsHistory subcollection (write denied)
        const coinRef = doc(db, "onlineCustomers", testOncusId, "coinsHistory", "tx_mint_coins");
        await expect(
          setDoc(coinRef, { amount: 1000, type: "earned", userId: testOncusId })
        ).rejects.toMatchObject({
          code: "permission-denied",
        });

        // 8. Owner CAN write to cart subcollection (create, update, delete)
        const cartRef = doc(db, "onlineCustomers", testOncusId, "cart", "item_01");
        await runTransaction(db, async (transaction) => {
          if ((await transaction.get(cartRef)).exists()) {
            throw new Error("Refusing to overwrite an existing test cart document.");
          }
          transaction.set(cartRef, { productId: "prod_01", quantity: 2, userId: testOncusId });
        });
        createdDocumentPaths.add(`onlineCustomers/${testOncusId}/cart/item_01`);
        const cartSnap = await getDoc(cartRef);
        expect(cartSnap.exists()).toBe(true);
        expect(cartSnap.data()?.["quantity"]).toBe(2);

        await updateDoc(cartRef, { quantity: 5 });
        const cartUpdated = await getDoc(cartRef);
        expect(cartUpdated.data()?.["quantity"]).toBe(5);

        await deleteDoc(cartRef);
        const cartDeleted = await getDoc(cartRef);
        expect(cartDeleted.exists()).toBe(false);

        // 9. Invalid cart item write is REJECTED by validator
        await expect(
          setDoc(cartRef, { productId: "prod_01", quantity: -1, userId: testOncusId })
        ).rejects.toMatchObject({
          code: "permission-denied",
        });
        await expect(
          setDoc(cartRef, { quantity: 1, userId: testOncusId })
        ).rejects.toMatchObject({
          code: "permission-denied",
        });

        // 10. Owner CAN write to addresses subcollection (create, update, delete)
        const addressRef = doc(db, "onlineCustomers", testOncusId, "addresses", "addr_01");
        await runTransaction(db, async (transaction) => {
          if ((await transaction.get(addressRef)).exists()) {
            throw new Error("Refusing to overwrite an existing test address document.");
          }
          transaction.set(addressRef, {
            city: "Erode",
            lat: 11.341,
            lng: 77.717,
            userId: testOncusId,
          });
        });
        createdDocumentPaths.add(`onlineCustomers/${testOncusId}/addresses/addr_01`);
        const addrSnap = await getDoc(addressRef);
        expect(addrSnap.exists()).toBe(true);
        expect(addrSnap.data()?.["city"]).toBe("Erode");

        await updateDoc(addressRef, { city: "Perundurai" });
        const addrUpdated = await getDoc(addressRef);
        expect(addrUpdated.data()?.["city"]).toBe("Perundurai");

        await deleteDoc(addressRef);
        const addrDeleted = await getDoc(addressRef);
        expect(addrDeleted.exists()).toBe(false);

        // 11. Invalid address write is REJECTED by validator
        await expect(
          setDoc(addressRef, { userId: testOncusId })
        ).rejects.toMatchObject({
          code: "permission-denied",
        });

        // 12. Owner CAN write to wishlists & wishlist products (create, delete)
        const wishlistRef = doc(db, "onlineCustomers", testOncusId, "wishlists", "wl_01");
        await runTransaction(db, async (transaction) => {
          if ((await transaction.get(wishlistRef)).exists()) {
            throw new Error("Refusing to overwrite an existing test wishlist document.");
          }
          transaction.set(wishlistRef, {
            title: "My Favorites",
            userId: testOncusId,
          });
        });
        createdDocumentPaths.add(`onlineCustomers/${testOncusId}/wishlists/wl_01`);
        const wlSnap = await getDoc(wishlistRef);
        expect(wlSnap.exists()).toBe(true);

        const wlProductRef = doc(
          db,
          "onlineCustomers",
          testOncusId,
          "wishlists",
          "wl_01",
          "products",
          "prod_sweet_01"
        );
        await runTransaction(db, async (transaction) => {
          if ((await transaction.get(wlProductRef)).exists()) {
            throw new Error("Refusing to overwrite an existing test wishlist product.");
          }
          transaction.set(wlProductRef, {
            productId: "prod_sweet_01",
            wishlistId: "wl_01",
            userId: testOncusId,
          });
        });
        createdDocumentPaths.add(
          `onlineCustomers/${testOncusId}/wishlists/wl_01/products/prod_sweet_01`
        );
        const wlProdSnap = await getDoc(wlProductRef);
        expect(wlProdSnap.exists()).toBe(true);

        await deleteDoc(wlProductRef);
        await deleteDoc(wishlistRef);

        // 13. Owner CAN query top-level orders cleanly without query evaluation error
        const ordersCol = collection(db, "orders");
        const ordersQuery = query(ordersCol, where("buyerUid", "==", ownerUid));
        const ordersSnap = await getDocs(ordersQuery);
        expect(Array.isArray(ordersSnap.docs)).toBe(true);

        // 14. Authenticate Other Customer
        await emailLinkAuthService.sendSignInLink(otherEmail, {
          continueUrl: "http://localhost:5173/login",
        });
        const otherOobRes = await fetch(AUTH_OOB_URL);
        const otherOobData = (await otherOobRes.json()) as {
          oobCodes?: Array<{ email?: string; oobLink?: string }>;
        };
        const otherCodes = (otherOobData.oobCodes ?? []).filter(
          (e) => e.email?.toLowerCase() === otherEmail.toLowerCase()
        );
        await emailLinkAuthService.completeSignInWithEmailLink(
          otherCodes[otherCodes.length - 1]!.oobLink!
        );
        otherIdToken = await getEmulatorAuth().auth.currentUser?.getIdToken() ?? null;

        // 15. Other customer CANNOT read Customer 1's profile
        await expect(getDoc(profileRef)).rejects.toMatchObject({
          code: "permission-denied",
        });

        // 16. Other customer CANNOT read Customer 1's orders
        await expect(getDoc(orderRef)).rejects.toMatchObject({
          code: "permission-denied",
        });

        // 17. Other customer CANNOT write to Customer 1's cart or addresses
        await expect(
          setDoc(cartRef, { productId: "prod_01", quantity: 1, userId: testOncusId })
        ).rejects.toMatchObject({
          code: "permission-denied",
        });
        await expect(
          setDoc(addressRef, { city: "Erode", lat: 11.0, lng: 77.0, userId: testOncusId })
        ).rejects.toMatchObject({
          code: "permission-denied",
        });

        // 18. Sign out (unauthenticated)
        await emailLinkAuthService.signOutFirebaseAuth();

        // 19. Unauthenticated CANNOT read Customer 1's profile
        await expect(getDoc(profileRef)).rejects.toMatchObject({
          code: "permission-denied",
        });

        // 20. Unauthenticated CANNOT read Customer 1's orders
        await expect(getDoc(orderRef)).rejects.toMatchObject({
          code: "permission-denied",
        });

        // 21. Unauthenticated CANNOT write to Customer 1's cart or addresses
        await expect(
          setDoc(cartRef, { productId: "prod_01", quantity: 1, userId: testOncusId })
        ).rejects.toMatchObject({
          code: "permission-denied",
        });
        await expect(
          setDoc(addressRef, { city: "Erode", lat: 11.0, lng: 77.0, userId: testOncusId })
        ).rejects.toMatchObject({
          code: "permission-denied",
        });
      } finally {
        const cleanupFailures: number[] = [];
        // Delete only documents whose create operation succeeded in this run.
        for (const documentPath of [...createdDocumentPaths].reverse()) {
          try {
            const response = await fetch(`${EMULATOR_REST_DOCS_URL}/${documentPath}`, {
              method: "DELETE",
              headers: { Authorization: "Bearer owner" },
            });
            if (!response.ok && response.status !== 404) cleanupFailures.push(response.status);
          } catch {
            cleanupFailures.push(0);
          }
        }
        for (const idToken of [otherIdToken, ownerIdToken]) {
          try {
            const response = await deleteTestAuthAccount(idToken);
            if (response && !response.ok && response.status !== 404) cleanupFailures.push(response.status);
          } catch {
            cleanupFailures.push(0);
          }
        }
        try {
          await emailLinkAuthService.signOutFirebaseAuth();
        } catch {
          cleanupFailures.push(0);
        }
        if (cleanupFailures.length > 0) {
          throw new Error(
            `Emulator fixture cleanup had ${cleanupFailures.length} failure(s); HTTP status values: ${cleanupFailures.join(", ")}.`
          );
        }
      }
    }, 30000);
  });
});

