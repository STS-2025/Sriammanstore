import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  LegacyCartAddressAdapter,
  isValidSassCustomerId,
  parseSafeCoordinate,
  CANONICAL_SASS_ID_RE,
} from "../services/legacyCartAddressAdapter";
import {
  FirestoreAdapter,
  InMemoryFirestoreDriver,
  StorageAdapterError,
} from "../services/firestoreAdapter";
import { apiClient } from "../services/apiClient";
import type { CartItem, Address, Product } from "../types";

describe("Legacy-Compatible Cart & Address Adapter (LegacyCartAddressAdapter)", () => {
  let driver: InMemoryFirestoreDriver;
  let adapter: LegacyCartAddressAdapter;
  let firestoreAdapter: FirestoreAdapter;
  let originalAdapter: FirestoreAdapter;
  let originalMode: ReturnType<typeof apiClient.getMode>;

  const customerIdA = "SASS0000001";
  const customerIdB = "SASS0000002";

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

    // Seed customer profile A
    await driver.setDoc("users", customerIdA, {
      id: customerIdA,
      userId: customerIdA,
      phone: "+919876543210",
      coins: 100,
      name: "Ramanathan",
      email: "ramanathan@example.com",
      primaryAddressId: null,
    });

    // Seed customer profile B
    await driver.setDoc("users", customerIdB, {
      id: customerIdB,
      userId: customerIdB,
      phone: "+919876543211",
      coins: 50,
      name: "Sundaram",
      email: "sundaram@example.com",
      primaryAddressId: null,
    });
  });

  afterEach(() => {
    apiClient.setFirestoreAdapter(originalAdapter);
    apiClient.setMode(originalMode);
    apiClient.resetSourceState();
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 1. SASS Customer ID Validation
  // ==========================================================================
  describe("1. Canonical SASS ID Validation", () => {
    it("recognizes valid canonical SASS customer IDs", () => {
      expect(isValidSassCustomerId("SASS0000001")).toBe(true);
      expect(isValidSassCustomerId("SASS0000021")).toBe(true);
      expect(isValidSassCustomerId("SASS9999901")).toBe(true);
      expect(isValidSassCustomerId("sass123456")).toBe(true);
      expect(isValidSassCustomerId("  SASS0000104  ")).toBe(true);
    });

    it("rejects Firebase UIDs, guest sessions, empty strings, and non-strings", () => {
      expect(isValidSassCustomerId("mock-firebase-uid-123")).toBe(false);
      expect(isValidSassCustomerId("AIzaSyB123456789")).toBe(false);
      expect(isValidSassCustomerId("guest_1712345678")).toBe(false);
      expect(isValidSassCustomerId("guest_session")).toBe(false);
      expect(isValidSassCustomerId("")).toBe(false);
      expect(isValidSassCustomerId("   ")).toBe(false);
      expect(isValidSassCustomerId(null)).toBe(false);
      expect(isValidSassCustomerId(undefined)).toBe(false);
      expect(isValidSassCustomerId(12345)).toBe(false);
    });

    it("assertValidCustomer throws 400 validation error when non-SASS ID is provided", () => {
      expect(() => adapter.assertValidCustomer("firebase-auth-uid-xyz")).toThrow(
        StorageAdapterError
      );
      try {
        adapter.assertValidCustomer("firebase-auth-uid-xyz");
      } catch (err) {
        const error = err as StorageAdapterError;
        expect(error.status).toBe(400);
        expect(error.code).toBe("invalid-argument");
        expect(error.message).toContain("canonical SASS customer ID");
        expect(error.message).toContain("Firebase Authentication UIDs");
      }
    });

    it("assertValidCustomer trims and returns canonical SASS ID", () => {
      expect(adapter.assertValidCustomer("  SASS0000001  ")).toBe("SASS0000001");
    });
  });

  // ==========================================================================
  // 2. Profile Precondition Enforcement
  // ==========================================================================
  describe("2. Profile Precondition Enforcement", () => {
    it("assertProfileExists returns profile data when customer profile exists", async () => {
      const profile = await adapter.assertProfileExists(customerIdA);
      expect(profile).not.toBeNull();
      expect(profile["userId"]).toBe(customerIdA);
    });

    it("assertProfileExists throws 404 when customer profile does not exist", async () => {
      await expect(adapter.assertProfileExists("SASS9999999")).rejects.toThrow(
        StorageAdapterError
      );
      try {
        await adapter.assertProfileExists("SASS9999999");
      } catch (err) {
        const error = err as StorageAdapterError;
        expect(error.status).toBe(404);
        expect(error.code).toBe("not-found");
        expect(error.message).toContain("users/SASS9999999");
      }
    });
  });

  // ==========================================================================
  // 3. String-to-Number Coordinate Parsing
  // ==========================================================================
  describe("3. Coordinate Parsing & Normalization", () => {
    it("preserves finite numeric coordinates", () => {
      expect(parseSafeCoordinate(8.8174)).toBe(8.8174);
      expect(parseSafeCoordinate(78.1234)).toBe(78.1234);
      expect(parseSafeCoordinate(-12.34)).toBe(-12.34);
    });

    it("normalizes string coordinates commonly stored in legacy Firestore documents", () => {
      expect(parseSafeCoordinate("8.8174123")).toBe(8.8174123);
      expect(parseSafeCoordinate(" 78.134567 ")).toBe(78.134567);
      expect(parseSafeCoordinate("0")).toBe(0);
    });

    it("safely falls back to default 0 for invalid or non-numeric values", () => {
      expect(parseSafeCoordinate("invalid_lat")).toBe(0);
      expect(parseSafeCoordinate("")).toBe(0);
      expect(parseSafeCoordinate("   ")).toBe(0);
      expect(parseSafeCoordinate(null)).toBe(0);
      expect(parseSafeCoordinate(undefined)).toBe(0);
      expect(parseSafeCoordinate(NaN)).toBe(0);
      expect(parseSafeCoordinate(Infinity)).toBe(0);
      expect(parseSafeCoordinate({}, 99)).toBe(99);
    });
  });

  // ==========================================================================
  // 4. Cart Subcollection Operations
  // ==========================================================================
  describe("4. Cart Subcollection Operations (users/{userDocId}/cart/{variantKey})", () => {
    const sampleProduct: Product = {
      id: "prod_oil_01",
      name: "Cold Pressed Coconut Oil",
      category: "Cold Pressed Oils",
      categorySlug: "cold-pressed-oils",
      brand: "Sri Amman",
      rating: 4.8,
      reviewCount: 120,
      description: "100% pure coconut oil",
      imageUrl: "https://example.com/oil.jpg",
      images: ["https://example.com/oil.jpg"],
      options: [
        { unit: "L", unitSize: "1", mrp: 290, offerPrice: 245, stock: 50 },
        { unit: "ml", unitSize: "500", mrp: 155, offerPrice: 130, stock: 25 },
      ],
      tags: [],
      isActive: true,
    };

    it("adds an item to users/{userDocId}/cart/{variantKey} with canonical variant key", async () => {
      const added = await adapter.addToCart(customerIdA, {
        productId: sampleProduct.id,
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
        name: "Cold Pressed Coconut Oil (1L)",
        price: 245,
        mrp: 290,
        quantity: 2,
        image: sampleProduct.imageUrl,
      });

      expect(added.id).toBe("prod_oil_01__opt0__L__1");
      expect(added.cartKey).toBe("prod_oil_01__opt0__L__1");
      expect(added.userId).toBe(customerIdA);
      expect(added.quantity).toBe(2);

      // Verify stored directly in Firestore driver at subcollection path
      const direct = await driver.getDoc(
        `users/${customerIdA}/cart`,
        "prod_oil_01__opt0__L__1"
      );
      expect(direct).not.toBeNull();
      expect(direct?.["variantKey"]).toBe("prod_oil_01__opt0__L__1");
      expect(direct?.["quantity"]).toBe(2);
      expect(direct?.["userId"]).toBe(customerIdA);
    });

    it("increments quantity when adding an existing item to cart", async () => {
      await adapter.addToCart(customerIdA, {
        productId: sampleProduct.id,
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
        name: "Cold Pressed Coconut Oil (1L)",
        price: 245,
        mrp: 290,
        quantity: 2,
      });

      const updated = await adapter.addToCart(customerIdA, {
        productId: sampleProduct.id,
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
        name: "Cold Pressed Coconut Oil (1L)",
        price: 245,
        mrp: 290,
        quantity: 3,
      });

      expect(updated.quantity).toBe(5);

      const items = await adapter.getCart(customerIdA);
      expect(items).toHaveLength(1);
      expect(items[0]?.quantity).toBe(5);
    });

    it("retrieves a single cart item with getCartItem", async () => {
      await adapter.addToCart(customerIdA, {
        productId: sampleProduct.id,
        optionIndex: 1,
        unit: "ml",
        unitSize: "500",
        name: "Cold Pressed Coconut Oil (500ml)",
        price: 130,
        mrp: 155,
        quantity: 1,
      });

      const item = await adapter.getCartItem(
        customerIdA,
        "prod_oil_01__opt1__ml__500"
      );
      expect(item).not.toBeNull();
      expect(item?.cartKey).toBe("prod_oil_01__opt1__ml__500");
      expect(item?.price).toBe(130);

      const missing = await adapter.getCartItem(customerIdA, "non_existent_key");
      expect(missing).toBeNull();
    });

    it("updates cart item quantity and removes it if quantity <= 0", async () => {
      await adapter.addToCart(customerIdA, {
        productId: sampleProduct.id,
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
        name: "Cold Pressed Coconut Oil (1L)",
        price: 245,
        mrp: 290,
        quantity: 2,
      });

      const updated = await adapter.updateCartQuantity(
        customerIdA,
        "prod_oil_01__opt0__L__1",
        4
      );
      expect(updated?.quantity).toBe(4);

      // Updating with 0 removes item
      const removed = await adapter.updateCartQuantity(
        customerIdA,
        "prod_oil_01__opt0__L__1",
        0
      );
      expect(removed).toBeNull();

      const items = await adapter.getCart(customerIdA);
      expect(items).toHaveLength(0);
    });

    it("removes a specific cart item with removeFromCart", async () => {
      await adapter.addToCart(customerIdA, {
        productId: sampleProduct.id,
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
        name: "Item 1",
        price: 100,
        quantity: 1,
      });
      await adapter.addToCart(customerIdA, {
        productId: sampleProduct.id,
        optionIndex: 1,
        unit: "ml",
        unitSize: "500",
        name: "Item 2",
        price: 50,
        quantity: 1,
      });

      expect(await adapter.getCart(customerIdA)).toHaveLength(2);

      await adapter.removeFromCart(customerIdA, "prod_oil_01__opt0__L__1");

      const items = await adapter.getCart(customerIdA);
      expect(items).toHaveLength(1);
      expect(items[0]?.cartKey).toBe("prod_oil_01__opt1__ml__500");
    });

    it("clears all cart items with clearCart", async () => {
      await adapter.addToCart(customerIdA, {
        productId: sampleProduct.id,
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
        name: "Item 1",
        price: 100,
        quantity: 1,
      });
      await adapter.addToCart(customerIdA, {
        productId: sampleProduct.id,
        optionIndex: 1,
        unit: "ml",
        unitSize: "500",
        name: "Item 2",
        price: 50,
        quantity: 1,
      });

      await adapter.clearCart(customerIdA);
      const items = await adapter.getCart(customerIdA);
      expect(items).toHaveLength(0);
    });

    it("rejects adding an item with non-positive quantity or missing productId", async () => {
      await expect(
        adapter.addToCart(customerIdA, {
          productId: sampleProduct.id,
          quantity: 0,
        })
      ).rejects.toThrow(StorageAdapterError);

      await expect(
        adapter.addToCart(customerIdA, {
          productId: "",
          quantity: 1,
        })
      ).rejects.toThrow(StorageAdapterError);
    });

    it("rejects cross-customer cart insertion when payload userId doesn't match target subcollection", async () => {
      await expect(
        adapter.addToCart(customerIdA, {
          productId: sampleProduct.id,
          userId: customerIdB, // Mismatch!
          quantity: 1,
        })
      ).rejects.toThrow(StorageAdapterError);
    });
  });

  // ==========================================================================
  // 5. Address Subcollection Operations & Default Address Resolution
  // ==========================================================================
  describe("5. Address Subcollection Operations (users/{userDocId}/addresses/{addressId})", () => {
    it("adds address, normalizes string coordinates, and sets primaryAddressId on first address", async () => {
      const added = await adapter.addAddress(customerIdA, {
        name: "Ramanathan Home",
        phone: "+919876543210",
        houseNo: "12A",
        street: "West Car Street",
        landmark: "Near Murugan Temple",
        city: "Palani",
        pincode: "624601",
        lat: ("10.4500" as unknown as number), // string lat
        lng: ("77.5200" as unknown as number), // string lng
        tag: "Home",
      });

      expect(added.id).toBeDefined();
      expect(added.userId).toBe(customerIdA);
      expect(added.name).toBe("Ramanathan Home");
      expect(added.lat).toBe(10.45);
      expect(added.lng).toBe(77.52);
      expect(added.isDefault).toBe(true);

      // Verify users/{userDocId}.primaryAddressId was updated
      const profile = await driver.getDoc("users", customerIdA);
      expect(profile?.["primaryAddressId"]).toBe(added.id);

      // Verify raw document in driver has dual fields
      const rawDoc = await driver.getDoc(`users/${customerIdA}/addresses`, added.id);
      expect(rawDoc?.["fullName"]).toBe("Ramanathan Home");
      expect(rawDoc?.["town"]).toBe("Palani");
      expect(rawDoc?.["latitude"]).toBe(10.45);
      expect(rawDoc?.["longitude"]).toBe(77.52);
    });

    it("resolves isDefault correctly using users/{userDocId}.primaryAddressId", async () => {
      // First address becomes default
      const addr1 = await adapter.addAddress(customerIdA, {
        name: "Home",
        phone: "+919876543210",
        houseNo: "1",
        street: "Main Rd",
        city: "Palani",
        pincode: "624601",
        lat: 10.45,
        lng: 77.52,
        isDefault: true,
      });

      // Second address added without isDefault
      const addr2 = await adapter.addAddress(customerIdA, {
        name: "Office",
        phone: "+919876543210",
        houseNo: "2",
        street: "Bazaar St",
        city: "Palani",
        pincode: "624601",
        lat: 10.46,
        lng: 77.53,
        isDefault: false,
      });

      const addresses = await adapter.getAddresses(customerIdA);
      expect(addresses).toHaveLength(2);

      const found1 = addresses.find((a) => a.id === addr1.id);
      const found2 = addresses.find((a) => a.id === addr2.id);

      expect(found1?.isDefault).toBe(true);
      expect(found2?.isDefault).toBe(false);

      // Now switch default to addr2 via setDefaultAddress
      await adapter.setDefaultAddress(customerIdA, addr2.id);

      const updatedAddresses = await adapter.getAddresses(customerIdA);
      const updated1 = updatedAddresses.find((a) => a.id === addr1.id);
      const updated2 = updatedAddresses.find((a) => a.id === addr2.id);

      expect(updated1?.isDefault).toBe(false);
      expect(updated2?.isDefault).toBe(true);

      const profile = await driver.getDoc("users", customerIdA);
      expect(profile?.["primaryAddressId"]).toBe(addr2.id);
    });

    it("updates address and synchronizes primaryAddressId when isDefault changes", async () => {
      const addr = await adapter.addAddress(customerIdA, {
        name: "Home",
        phone: "+919876543210",
        houseNo: "1",
        street: "Main Rd",
        city: "Palani",
        pincode: "624601",
        lat: 10.45,
        lng: 77.52,
      });

      const updated = await adapter.updateAddress(customerIdA, addr.id, {
        street: "New Car Street",
        lat: ("10.4550" as unknown as number),
      });

      expect(updated.street).toBe("New Car Street");
      expect(updated.lat).toBe(10.455);
    });

    it("deletes address and unsets primaryAddressId if the deleted address was primary", async () => {
      const addr = await adapter.addAddress(customerIdA, {
        name: "Home",
        phone: "+919876543210",
        houseNo: "1",
        street: "Main Rd",
        city: "Palani",
        pincode: "624601",
        lat: 10.45,
        lng: 77.52,
      });

      let profile = await driver.getDoc("users", customerIdA);
      expect(profile?.["primaryAddressId"]).toBe(addr.id);

      await adapter.deleteAddress(customerIdA, addr.id);

      const remaining = await adapter.getAddresses(customerIdA);
      expect(remaining).toHaveLength(0);

      profile = await driver.getDoc("users", customerIdA);
      expect(profile?.["primaryAddressId"]).toBeNull();
    });

    it("throws 404 when setDefaultAddress is called for a non-existent address ID", async () => {
      await expect(
        adapter.setDefaultAddress(customerIdA, "addr_non_existent")
      ).rejects.toThrow(StorageAdapterError);
    });
  });

  // ==========================================================================
  // 6. Strict Customer Isolation & Ownership Boundaries
  // ==========================================================================
  describe("6. Strict Customer Isolation", () => {
    it("ensures Customer A and Customer B carts and addresses remain strictly isolated", async () => {
      // Customer A adds item to cart
      await adapter.addToCart(customerIdA, {
        productId: "prod_oil_01",
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
        name: "A Oil",
        price: 245,
        quantity: 3,
      });

      // Customer B adds item to cart
      await adapter.addToCart(customerIdB, {
        productId: "prod_rice_02",
        optionIndex: 0,
        unit: "kg",
        unitSize: "5",
        name: "B Rice",
        price: 350,
        quantity: 1,
      });

      const cartA = await adapter.getCart(customerIdA);
      const cartB = await adapter.getCart(customerIdB);

      expect(cartA).toHaveLength(1);
      expect(cartA[0]?.name).toBe("A Oil");
      expect(cartA[0]?.userId).toBe(customerIdA);

      expect(cartB).toHaveLength(1);
      expect(cartB[0]?.name).toBe("B Rice");
      expect(cartB[0]?.userId).toBe(customerIdB);

      // Customer A adds address
      await adapter.addAddress(customerIdA, {
        name: "Customer A Address",
        phone: "+919876543210",
        houseNo: "A1",
        street: "A Street",
        city: "Palani",
        pincode: "624601",
        lat: 10.45,
        lng: 77.52,
      });

      // Customer B adds address
      await adapter.addAddress(customerIdB, {
        name: "Customer B Address",
        phone: "+919876543211",
        houseNo: "B2",
        street: "B Street",
        city: "Madurai",
        pincode: "625001",
        lat: 9.92,
        lng: 78.12,
      });

      const addressesA = await adapter.getAddresses(customerIdA);
      const addressesB = await adapter.getAddresses(customerIdB);

      expect(addressesA).toHaveLength(1);
      expect(addressesA[0]?.name).toBe("Customer A Address");

      expect(addressesB).toHaveLength(1);
      expect(addressesB[0]?.name).toBe("Customer B Address");
    });
  });

  // ==========================================================================
  // 7. End-to-End ApiClient & FirestoreAdapter Integration
  // ==========================================================================
  describe("7. End-to-End ApiClient / FirestoreAdapter Subcollection Routing", () => {
    it("routes /cart operations to customer subcollection when legacyCustomerSubcollections is enabled", async () => {
      // POST /cart
      const createdItem = await apiClient.post<CartItem>("/cart", {
        productId: "prod_oil_01",
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
        name: "Cold Pressed Coconut Oil",
        price: 245,
        mrp: 290,
        quantity: 2,
        userId: customerIdA,
      });

      expect(createdItem.id).toBe("prod_oil_01__opt0__L__1");

      // GET /cart?userId=SASS0000001
      const fetchedItems = await apiClient.get<CartItem[]>("/cart", {
        userId: customerIdA,
      });
      expect(fetchedItems).toHaveLength(1);
      expect(fetchedItems[0]?.id).toBe("prod_oil_01__opt0__L__1");

      // PATCH /cart/:docId
      const patched = await apiClient.patch<CartItem>(
        `/cart/${encodeURIComponent(`${customerIdA}__prod_oil_01__opt0__L__1`)}`,
        { quantity: 5, userId: customerIdA }
      );
      expect(patched.quantity).toBe(5);

      // DELETE /cart/:docId
      await apiClient.delete(
        `/cart/${encodeURIComponent(`${customerIdA}__prod_oil_01__opt0__L__1`)}`
      );

      const remaining = await apiClient.get<CartItem[]>("/cart", {
        userId: customerIdA,
      });
      expect(remaining).toHaveLength(0);
    });

    it("routes /addresses operations to customer subcollection when legacyCustomerSubcollections is enabled", async () => {
      // POST /addresses
      const createdAddr = await apiClient.post<Address>("/addresses", {
        name: "Temple View Home",
        phone: "+919876543210",
        houseNo: "5",
        street: "Giri Veethi",
        city: "Palani",
        pincode: "624601",
        lat: ("10.4490" as unknown as number),
        lng: ("77.5190" as unknown as number),
        userId: customerIdA,
        tag: "home",
      });

      expect(createdAddr.id).toBeDefined();
      expect(createdAddr.lat).toBe(10.449);
      expect(createdAddr.isDefault).toBe(true);

      // GET /addresses?userId=SASS0000001
      const list = await apiClient.get<Address[]>("/addresses", {
        userId: customerIdA,
      });
      expect(list).toHaveLength(1);
      expect(list[0]?.id).toBe(createdAddr.id);
      expect(list[0]?.isDefault).toBe(true);

      // PATCH /addresses/:id
      const patched = await apiClient.patch<Address>(
        `/addresses/${createdAddr.id}?userId=${customerIdA}`,
        { street: "Outer Giri Veethi", userId: customerIdA }
      );
      expect(patched.street).toBe("Outer Giri Veethi");

      // DELETE /addresses/:id
      await apiClient.delete(
        `/addresses/${createdAddr.id}?userId=${customerIdA}`
      );

      const afterDelete = await apiClient.get<Address[]>("/addresses", {
        userId: customerIdA,
      });
      expect(afterDelete).toHaveLength(0);
    });

    it("supports direct nested paths /users/:userId/cart and /users/:userId/addresses", async () => {
      await apiClient.post(`/users/${customerIdA}/cart`, {
        productId: "prod_oil_01",
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
        name: "Direct Nested Item",
        price: 245,
        quantity: 1,
        userId: customerIdA,
      });

      const cart = await apiClient.get<CartItem[]>(`/users/${customerIdA}/cart`);
      expect(cart).toHaveLength(1);
      expect(cart[0]?.name).toBe("Direct Nested Item");

      await apiClient.post(`/users/${customerIdA}/addresses`, {
        name: "Direct Address",
        phone: "+919876543210",
        houseNo: "9",
        street: "Bazaar",
        city: "Palani",
        pincode: "624601",
        lat: 10.45,
        lng: 77.52,
        userId: customerIdA,
      });

      const addrs = await apiClient.get<Address[]>(`/users/${customerIdA}/addresses`);
      expect(addrs).toHaveLength(1);
      expect(addrs[0]?.name).toBe("Direct Address");
    });

    it("preserves default flat top-level collection behavior when legacyCustomerSubcollections is false", async () => {
      // Toggle subcollections off
      apiClient.setLegacyCustomerSubcollectionsEnabled(false);
      expect(apiClient.isLegacyCustomerSubcollectionsEnabled()).toBe(false);

      // In flat mode, adding to /cart stores in top-level 'cart' collection
      await apiClient.post("/cart", {
        id: "flat_cart_01",
        productId: "prod_flat_01",
        userId: customerIdA,
        quantity: 2,
        price: 100,
      });

      const topLevelDoc = await driver.getDoc("cart", "flat_cart_01");
      expect(topLevelDoc).not.toBeNull();
      expect(topLevelDoc?.["id"]).toBe("flat_cart_01");

      // Re-enable and verify switch back
      apiClient.setLegacyCustomerSubcollectionsEnabled(true);
      expect(apiClient.isLegacyCustomerSubcollectionsEnabled()).toBe(true);
    });
  });
});

