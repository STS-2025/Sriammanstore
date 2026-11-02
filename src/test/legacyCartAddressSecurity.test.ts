import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  LegacyCartAddressAdapter,
  isValidSassCustomerId,
  parseSafeCoordinate,
  parseAddressTag,
} from "../services/legacyCartAddressAdapter";
import {
  FirestoreAdapter,
  InMemoryFirestoreDriver,
  SdkFirestoreDriver,
  StorageAdapterError,
} from "../services/firestoreAdapter";
import { apiClient } from "../services/apiClient";
import { addressService } from "../services/addressService";
import { cartService } from "../services/cartService";
import { authService } from "../services/authService";
import { emailLinkAuthService } from "../services/emailLinkAuthService";
import { getEmulatorFirestore } from "../lib/firebaseEmulator";
import { seedEmulatorLinkedCustomerFixture } from "./linkedCustomerFixture";
import type { CartItem, Address } from "../types";

const AUTH_OOB_URL =
  "http://127.0.0.1:9099/emulator/v1/projects/demo-sri-amman-store/oobCodes";

interface EmulatorOobCodesPayload {
  oobCodes?: Array<{
    email?: string;
    oobCode?: string;
    oobLink?: string;
  }>;
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

async function signInLiveEmailLinkUser(email: string) {
  await emailLinkAuthService.sendSignInLink(email, {
    continueUrl: "http://localhost:5173/login",
  });

  const oobRes = await fetch(AUTH_OOB_URL);
  expect(oobRes.ok).toBe(true);
  const payload = (await oobRes.json()) as EmulatorOobCodesPayload;
  const matchingCodes = (payload.oobCodes ?? []).filter(
    (entry) => entry.email?.toLowerCase() === email.toLowerCase()
  );
  expect(matchingCodes.length).toBeGreaterThan(0);

  const latestOob = matchingCodes[matchingCodes.length - 1]!;
  expect(latestOob.oobLink).toBeTruthy();

  return emailLinkAuthService.completeSignInWithEmailLink(latestOob.oobLink!);
}

describe("Legacy Cart & Address Security Review & Verification", () => {
  let driver: InMemoryFirestoreDriver;
  let adapter: LegacyCartAddressAdapter;
  let firestoreAdapter: FirestoreAdapter;
  let originalAdapter: FirestoreAdapter;
  let originalMode: ReturnType<typeof apiClient.getMode>;

  const customerA = "SASS0000001";
  const customerB = "SASS0000002";

  beforeEach(async () => {
    driver = new InMemoryFirestoreDriver();
    adapter = new LegacyCartAddressAdapter(driver);
    firestoreAdapter = new FirestoreAdapter(driver, {
      legacyCustomerSubcollections: true,
    });

    originalAdapter = apiClient.getFirestoreAdapter();
    originalMode = apiClient.getMode();

    apiClient.setFirestoreAdapter(firestoreAdapter);
    apiClient.setMode("emulator");
    apiClient.resetSourceState();

    // Seed customer A profile
    await driver.setDoc("users", customerA, {
      id: customerA,
      userId: customerA,
      phone: "+919876543210",
      coins: 100,
      name: "Customer A",
      email: "cust.a@sriamman.test",
      primaryAddressId: null,
    });

    // Seed customer B profile
    await driver.setDoc("users", customerB, {
      id: customerB,
      userId: customerB,
      phone: "+919876543211",
      coins: 50,
      name: "Customer B",
      email: "cust.b@sriamman.test",
      primaryAddressId: null,
    });
  });

  afterEach(() => {
    apiClient.setFirestoreAdapter(originalAdapter);
    apiClient.setMode(originalMode);
    apiClient.resetSourceState();
    authService.logout();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. Authenticated Ownership & Isolation
  // ==========================================================================
  describe("1. Authenticated Ownership & Cross-Customer Isolation", () => {
    it("Customer A can only access users/{customerA}/cart and users/{customerA}/addresses", async () => {
      // Add cart item for Customer A
      const cartItemA = await adapter.addToCart(customerA, {
        productId: "prod_rice_01",
        optionIndex: 0,
        unit: "kg",
        unitSize: "5",
        name: "Ponni Boiled Rice (5kg)",
        price: 320,
        quantity: 1,
      });

      // Add address for Customer A
      const addrA = await adapter.addAddress(customerA, {
        name: "Customer A Home",
        phone: "+919876543210",
        houseNo: "12",
        street: "Kutchery Street",
        city: "Gobichettipalayam",
        pincode: "638452",
        lat: 11.45,
        lng: 77.44,
        isDefault: true,
      });

      // Customer A's subcollections contain their data
      const cartListA = await adapter.getCart(customerA);
      expect(cartListA).toHaveLength(1);
      expect(cartListA[0]?.id).toBe(cartItemA.id);

      const addrListA = await adapter.getAddresses(customerA);
      expect(addrListA).toHaveLength(1);
      expect(addrListA[0]?.id).toBe(addrA.id);

      // Customer B's subcollections are completely isolated and empty
      const cartListB = await adapter.getCart(customerB);
      expect(cartListB).toHaveLength(0);

      const addrListB = await adapter.getAddresses(customerB);
      expect(addrListB).toHaveLength(0);
    });

    it("Customer A cannot read or write Customer B's subcollections via adapter", async () => {
      // Seed an item in Customer B's cart
      await adapter.addToCart(customerB, {
        productId: "prod_dal_01",
        optionIndex: 0,
        unit: "kg",
        unitSize: "1",
        name: "Toor Dal (1kg)",
        price: 180,
        quantity: 2,
      });

      // Attempting to add an item to Customer B's cart claiming Customer A's ID in payload throws 403
      await expect(
        adapter.addToCart(customerB, {
          productId: "prod_ghee_01",
          optionIndex: 0,
          unit: "ml",
          unitSize: "500",
          name: "Pure Cow Ghee",
          price: 380,
          quantity: 1,
          userId: customerA,
        })
      ).rejects.toThrow(StorageAdapterError);

      try {
        await adapter.addToCart(customerB, {
          productId: "prod_ghee_01",
          optionIndex: 0,
          unit: "ml",
          unitSize: "500",
          name: "Pure Cow Ghee",
          price: 380,
          quantity: 1,
          userId: customerA,
        });
      } catch (err) {
        const error = err as StorageAdapterError;
        expect(error.status).toBe(403);
        expect(error.code).toBe("permission-denied");
        expect(error.message).toMatch(/ownership mismatch/i);
      }

      // Customer A attempting to update Customer B's address with Customer A's payload throws 403
      const addrB = await adapter.addAddress(customerB, {
        name: "Customer B Residence",
        phone: "+919876543211",
        houseNo: "5",
        street: "Bazaar Street",
        city: "Erode",
        lat: 11.34,
        lng: 77.72,
      });

      await expect(
        adapter.updateAddress(customerB, addrB.id, {
          street: "Tampered Street",
          userId: customerA,
        })
      ).rejects.toThrow(StorageAdapterError);
    });

    it("a valid-looking SASS ID alone does not grant authorization without verified caller identity", async () => {
      // 1. Bare cart docId with no customer prefix and no userId fails closed
      await expect(
        apiClient.get(`/cart/prod_dal_01__opt0__kg__1`)
      ).rejects.toThrow(StorageAdapterError);

      try {
        await apiClient.get(`/cart/prod_dal_01__opt0__kg__1`);
      } catch (err) {
        const error = err as StorageAdapterError;
        expect(error.status).toBe(403);
        expect(error.code).toBe("permission-denied");
        expect(error.message).toMatch(/explicit, verified customer identity/i);
      }

      // 2. Supplying Customer A's identity to access a key prefixed with Customer B throws ownership mismatch (403)
      await expect(
        apiClient.get(
          `/cart/${customerB}__prod_dal_01__opt0__kg__1?userId=${customerA}`
        )
      ).rejects.toThrow(StorageAdapterError);

      try {
        await apiClient.get(
          `/cart/${customerB}__prod_dal_01__opt0__kg__1?userId=${customerA}`
        );
      } catch (err) {
        const error = err as StorageAdapterError;
        expect(error.status).toBe(403);
        expect(error.code).toBe("permission-denied");
        expect(error.message).toMatch(/ownership mismatch/i);
      }
    });

    it("fails closed when accessing an address docId without a verified customer identity", async () => {
      await expect(
        apiClient.get("/addresses/addr_some_random_id")
      ).rejects.toThrow(StorageAdapterError);

      try {
        await apiClient.get("/addresses/addr_some_random_id");
      } catch (err) {
        const error = err as StorageAdapterError;
        expect(error.status).toBe(403);
        expect(error.code).toBe("permission-denied");
        expect(error.message).toMatch(/requires an explicit, verified customer identity/i);
      }
    });
  });

  // ==========================================================================
  // 2. Default-Address Integrity
  // ==========================================================================
  describe("2. Default-Address Integrity", () => {
    it("setting a default address verifies that the address belongs to that customer", async () => {
      // Create address for Customer A
      const addrA = await adapter.addAddress(customerA, {
        name: "Addr A",
        phone: "+919876543210",
        houseNo: "1",
        city: "Gobichettipalayam",
        lat: 11.45,
        lng: 77.44,
      });

      // Create address for Customer B
      const addrB = await adapter.addAddress(customerB, {
        name: "Addr B",
        phone: "+919876543211",
        houseNo: "2",
        city: "Erode",
        lat: 11.34,
        lng: 77.72,
      });

      // Customer A successfully sets their own address as default
      await adapter.setDefaultAddress(customerA, addrA.id);
      const profileA = await driver.getDoc("users", customerA);
      expect(profileA?.["primaryAddressId"]).toBe(addrA.id);

      // Customer A attempts to set Customer B's address as their default -> throws 404
      await expect(
        adapter.setDefaultAddress(customerA, addrB.id)
      ).rejects.toThrow(StorageAdapterError);

      try {
        await adapter.setDefaultAddress(customerA, addrB.id);
      } catch (err) {
        const error = err as StorageAdapterError;
        expect(error.status).toBe(404);
        expect(error.message).toContain(`users/${customerA}/addresses`);
      }

      // Customer A's primaryAddressId remains intact and uncorrupted
      const profileAAfter = await driver.getDoc("users", customerA);
      expect(profileAAfter?.["primaryAddressId"]).toBe(addrA.id);
    });

    it("deleting the default address safely clears primaryAddressId", async () => {
      const addrA = await adapter.addAddress(customerA, {
        name: "Default Addr",
        phone: "+919876543210",
        houseNo: "100",
        city: "Gobi",
        lat: 11.45,
        lng: 77.44,
        isDefault: true,
      });

      const profileBefore = await driver.getDoc("users", customerA);
      expect(profileBefore?.["primaryAddressId"]).toBe(addrA.id);

      await adapter.deleteAddress(customerA, addrA.id);

      const profileAfter = await driver.getDoc("users", customerA);
      expect(profileAfter?.["primaryAddressId"]).toBeNull();
    });

    it("safely handles concurrent or stale deletion without clobbering a newer primaryAddressId", async () => {
      const addr1 = await adapter.addAddress(customerA, {
        name: "First Addr",
        phone: "+919876543210",
        houseNo: "1",
        city: "Gobi",
        lat: 11.45,
        lng: 77.44,
        isDefault: true,
      });

      const addr2 = await adapter.addAddress(customerA, {
        name: "Second Addr",
        phone: "+919876543210",
        houseNo: "2",
        city: "Gobi",
        lat: 11.45,
        lng: 77.44,
        isDefault: false,
      });

      // Simulate a concurrent action where customer switched default to addr2
      await adapter.setDefaultAddress(customerA, addr2.id);

      // Now a stale delete request arrives to delete the old (non-default) addr1
      await adapter.deleteAddress(customerA, addr1.id);

      // addr2 is STILL the primaryAddressId and was NOT clobbered by addr1's deletion
      const currentProfile = await driver.getDoc("users", customerA);
      expect(currentProfile?.["primaryAddressId"]).toBe(addr2.id);
    });
  });

  // ==========================================================================
  // 3. Adapter Routing & Endpoint Ownership
  // ==========================================================================
  describe("3. Adapter Routing & Endpoint Ownership", () => {
    it("preserves flat mock storage when legacyCustomerSubcollections is disabled", async () => {
      apiClient.setLegacyCustomerSubcollectionsEnabled(false);
      expect(apiClient.isLegacyCustomerSubcollectionsEnabled()).toBe(false);

      await apiClient.post("/cart", {
        id: "cart_mock_flat_01",
        productId: "prod_oil_01",
        userId: customerA,
        quantity: 2,
        price: 245,
      });

      const flatDoc = await driver.getDoc("cart", "cart_mock_flat_01");
      expect(flatDoc).not.toBeNull();
      expect(flatDoc?.["id"]).toBe("cart_mock_flat_01");

      // Verify subcollection was NOT touched
      const subDoc = await driver.getDoc(
        `users/${customerA}/cart`,
        "cart_mock_flat_01"
      );
      expect(subDoc).toBeNull();
    });

    it("routes to subcollections when legacyCustomerSubcollections is enabled", async () => {
      apiClient.setLegacyCustomerSubcollectionsEnabled(true);
      expect(apiClient.isLegacyCustomerSubcollectionsEnabled()).toBe(true);

      const item = await apiClient.post<CartItem>("/cart", {
        productId: "prod_oil_01",
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
        name: "Cold Pressed Coconut Oil",
        userId: customerA,
        quantity: 1,
        price: 245,
      });

      expect(item.id).toBeDefined();

      // Flat collection is empty
      const flatItems = await driver.queryCollection("cart", {});
      expect(flatItems).toHaveLength(0);

      // Subcollection contains the document
      const subItems = await driver.queryCollection(`users/${customerA}/cart`, {});
      expect(subItems).toHaveLength(1);
    });

    it("nested endpoint parsing rejects cross-customer ID mismatch", async () => {
      // POST /users/SASS0000001/cart with userId = SASS0000002
      await expect(
        apiClient.post(`/users/${customerA}/cart`, {
          productId: "prod_rice_01",
          quantity: 1,
          userId: customerB,
        })
      ).rejects.toThrow(StorageAdapterError);

      try {
        await apiClient.post(`/users/${customerA}/cart`, {
          productId: "prod_rice_01",
          quantity: 1,
          userId: customerB,
        });
      } catch (err) {
        const error = err as StorageAdapterError;
        expect(error.status).toBe(403);
        expect(error.code).toBe("permission-denied");
        expect(error.message).toMatch(/ownership mismatch/i);
      }

      // POST /users/SASS0000001/addresses with userId = SASS0000002
      await expect(
        apiClient.post(`/users/${customerA}/addresses`, {
          name: "Mismatch Address",
          city: "Gobi",
          userId: customerB,
        })
      ).rejects.toThrow(StorageAdapterError);
    });

    it("missing customer identity fails closed on GET and DELETE operations", async () => {
      // GET /cart without userId
      await expect(apiClient.get("/cart")).rejects.toThrow(StorageAdapterError);

      // GET /addresses without userId
      await expect(apiClient.get("/addresses")).rejects.toThrow(StorageAdapterError);

      // DELETE /cart without userId and without docId
      await expect(apiClient.delete("/cart")).rejects.toThrow(StorageAdapterError);
    });
  });

  // ==========================================================================
  // 4. Data Validation
  // ==========================================================================
  describe("4. Data Validation & Boundary Hardening", () => {
    it("safely normalizes coordinates and handles malformed string values", () => {
      expect(parseSafeCoordinate("11.459821")).toBe(11.459821);
      expect(parseSafeCoordinate(77.334005)).toBe(77.334005);
      expect(parseSafeCoordinate("  11.4598  ")).toBe(11.4598);
      expect(parseSafeCoordinate("not-a-number")).toBe(0);
      expect(parseSafeCoordinate(null)).toBe(0);
      expect(parseSafeCoordinate(undefined)).toBe(0);
      expect(parseSafeCoordinate("", 10.5)).toBe(10.5);
    });

    it("safely normalizes address tags", () => {
      expect(parseAddressTag("home")).toBe("Home");
      expect(parseAddressTag("WORK")).toBe("Work");
      expect(parseAddressTag("other")).toBe("Other");
      expect(parseAddressTag("custom")).toBe("Home");
      expect(parseAddressTag(null)).toBe("Home");
    });

    it("rejects invalid quantities <= 0 and non-numbers", async () => {
      await expect(
        adapter.addToCart(customerA, {
          productId: "prod_oil_01",
          quantity: 0,
        })
      ).rejects.toThrow(StorageAdapterError);

      await expect(
        adapter.addToCart(customerA, {
          productId: "prod_oil_01",
          quantity: -3,
        })
      ).rejects.toThrow(StorageAdapterError);

      await expect(
        adapter.addToCart(customerA, {
          productId: "prod_oil_01",
          quantity: ("invalid" as unknown as number),
        })
      ).rejects.toThrow(StorageAdapterError);
    });

    it("rejects cart item with missing productId", async () => {
      await expect(
        adapter.addToCart(customerA, {
          quantity: 1,
        })
      ).rejects.toThrow(StorageAdapterError);
    });

    it("rejects address with missing name or city", async () => {
      await expect(
        adapter.addAddress(customerA, {
          city: "Gobi",
        })
      ).rejects.toThrow(StorageAdapterError);

      await expect(
        adapter.addAddress(customerA, {
          name: "Lakshmi",
        })
      ).rejects.toThrow(StorageAdapterError);
    });

    it("preserves canonical cart variant key across legacy field names", async () => {
      const added = await adapter.addToCart(customerA, {
        productId: "prod_rice_99",
        optionIndex: 1,
        unit: "kg",
        unitSize: "10",
        name: "Special Rice",
        price: 650,
        quantity: 1,
      });

      expect(added.id).toBe("prod_rice_99__opt1__kg__10");
      expect(added.cartKey).toBe("prod_rice_99__opt1__kg__10");

      const fetched = await adapter.getCartItem(
        customerA,
        "prod_rice_99__opt1__kg__10"
      );
      expect(fetched).not.toBeNull();
      expect(fetched?.productId).toBe("prod_rice_99");
      expect(fetched?.unitSize).toBe("10");
    });
  });

  // ==========================================================================
  // 5. Live Firebase Emulator Security Rules Verification
  // ==========================================================================
  describe("5. Live Firestore & Auth Emulator Security Rules Verification", () => {
    it(
      "enforces authenticated customer ownership, cross-customer denial, and default-address protection against live emulators (ports 9099 & 8081)",
      async () => {
        const reachable = await areLiveEmulatorsReachable();
        if (!reachable) {
          console.warn(
            "Live emulators not reachable on 127.0.0.1:9099/8081. Skipping live SDK rules verification."
          );
          return;
        }

        const { db } = getEmulatorFirestore();
        const runSuffix = `${Date.now()}`;
        const ownerEmail = `sec.owner.${runSuffix}@sriamman.test`;
        const otherEmail = `sec.other.${runSuffix}@sriamman.test`;

        let cleanupFixture: (() => Promise<void>) | null = null;

        try {
          // 1. Authenticate Customer A (owner) via live Auth Emulator (port 9099)
          const ownerSignIn = await signInLiveEmailLinkUser(ownerEmail);
          const ownerUid = ownerSignIn.uid;
          expect(ownerUid).toBeTruthy();

          // 2. Seed canonical linked customer fixture: usersByUid/{ownerUid} -> SASS9999901 & users/SASS9999901
          const seeded = await seedEmulatorLinkedCustomerFixture(ownerUid);
          cleanupFixture = seeded.cleanup;
          const sassId = seeded.fixture.userDocId; // "SASS9999901"

          // 3. Customer A CAN write and read their own cart subcollection
          const cartDocRef = doc(
            db,
            "users",
            sassId,
            "cart",
            "prod_test_01__opt0__kg__1"
          );
          await setDoc(cartDocRef, {
            productId: "prod_test_01",
            quantity: 2,
            userId: sassId,
          });

          const ownCartSnap = await getDoc(cartDocRef);
          expect(ownCartSnap.exists()).toBe(true);
          expect(ownCartSnap.data()?.["quantity"]).toBe(2);

          // 4. Customer A CAN write and read their own addresses subcollection
          const addrDocRef = doc(db, "users", sassId, "addresses", "addr_live_01");
          await setDoc(addrDocRef, {
            city: "Gobichettipalayam",
            lat: 11.4598,
            lng: 77.334,
            userId: sassId,
          });

          const ownAddrSnap = await getDoc(addrDocRef);
          expect(ownAddrSnap.exists()).toBe(true);
          expect(ownAddrSnap.data()?.["city"]).toBe("Gobichettipalayam");

          // 5. Customer A CAN update their own primaryAddressId
          const userDocRef = doc(db, "users", sassId);
          await updateDoc(userDocRef, {
            primaryAddressId: "addr_live_01",
          });
          const userSnap = await getDoc(userDocRef);
          expect(userSnap.data()?.["primaryAddressId"]).toBe("addr_live_01");

          // 6. Authenticate Customer B (other user) via live Auth Emulator
          const otherSignIn = await signInLiveEmailLinkUser(otherEmail);
          const otherUid = otherSignIn.uid;
          expect(otherUid).not.toBe(ownerUid);

          // 7. Customer B CANNOT read Customer A's cart subcollection
          await expect(getDoc(cartDocRef)).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 8. Customer B CANNOT write to Customer A's cart subcollection
          await expect(
            setDoc(
              doc(db, "users", sassId, "cart", "prod_hacked__opt0__kg__1"),
              {
                productId: "prod_hacked",
                quantity: 10,
                userId: sassId,
              }
            )
          ).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 9. Customer B CANNOT read Customer A's addresses subcollection
          await expect(getDoc(addrDocRef)).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 10. Customer B CANNOT write to Customer A's addresses subcollection
          await expect(
            setDoc(doc(db, "users", sassId, "addresses", "addr_hacked"), {
              city: "Malicious City",
              lat: 10.0,
              lng: 70.0,
              userId: sassId,
            })
          ).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 11. Customer B CANNOT update Customer A's primaryAddressId
          await expect(
            updateDoc(userDocRef, {
              primaryAddressId: "addr_hacked",
            })
          ).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 12. Sign out (unauthenticated request)
          await emailLinkAuthService.signOutFirebaseAuth();

          // 13. Unauthenticated request CANNOT read Customer A's cart subcollection
          await expect(getDoc(cartDocRef)).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 14. Unauthenticated request CANNOT write to Customer A's cart subcollection
          await expect(
            setDoc(
              doc(db, "users", sassId, "cart", "prod_unauth__opt0__kg__1"),
              {
                productId: "prod_unauth",
                quantity: 1,
                userId: sassId,
              }
            )
          ).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 15. Unauthenticated request CANNOT read Customer A's addresses subcollection
          await expect(getDoc(addrDocRef)).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 16. Unauthenticated request CANNOT write to Customer A's addresses subcollection
          await expect(
            setDoc(doc(db, "users", sassId, "addresses", "addr_unauth"), {
              city: "Unauth City",
              lat: 10.0,
              lng: 70.0,
              userId: sassId,
            })
          ).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 17. Unauthenticated request CANNOT update Customer A's primaryAddressId
          await expect(
            updateDoc(userDocRef, {
              primaryAddressId: "addr_unauth_forged",
            })
          ).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 18. Cleanup created test docs
          // Re-authenticate Customer A with fresh email link to delete test subcollection documents
          await signInLiveEmailLinkUser(ownerEmail);
          await deleteDoc(cartDocRef).catch(() => {});
          await deleteDoc(addrDocRef).catch(() => {});
        } finally {
          if (cleanupFixture) {
            await cleanupFixture();
          }
          await emailLinkAuthService.signOutFirebaseAuth().catch(() => {});
        }
      },
      30000
    );
  });
});
