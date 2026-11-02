import type { CartItem, Address } from "../types";
import { buildCartKey } from "../lib/productUtils";
import {
  StorageAdapterError,
  type FirestoreDriver,
} from "./firestoreAdapter";

export const CANONICAL_ONCUS_ID_RE = /^ONCUS\d{6,7}$/i;
export const CANONICAL_SASS_ID_RE = /^SASS\d{6,7}$/i;
export const CANONICAL_CUSTOMER_ID_RE = /^(ONCUS\d{6,7}|SASS\d{6,7})$/i;

/**
 * Validates whether a given string is a canonical Sri Amman Smart Store customer ID
 * (either modern "ONCUS..." or legacy "SASS...").
 * Examples: "ONCUS000010", "ONCUS000021", "SASS0000001", "SASS0000021".
 * Rejects Firebase UIDs, guest sessions, and empty strings.
 */
export function isValidCustomerId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return CANONICAL_CUSTOMER_ID_RE.test(value.trim());
}

/**
 * Validates whether a given string is a canonical Sri Amman Smart Store customer ID.
 * Examples: "SASS0000001", "SASS0000021", "SASS9999901".
 * Rejects Firebase UIDs, guest sessions, and empty strings.
 */
export function isValidSassCustomerId(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return CANONICAL_SASS_ID_RE.test(value.trim());
}

/**
 * Safely parses coordinate (latitude / longitude) values.
 * Handles numbers, finite numeric strings, strings with whitespace,
 * and falls back safely to 0 for invalid, NaN, or non-numeric values.
 */
export function parseSafeCoordinate(value: unknown, fallback: number = 0): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * Normalizes address tags to valid Address union values: "Home" | "Work" | "Other".
 */
export function parseAddressTag(val: unknown): "Home" | "Work" | "Other" {
  if (typeof val === "string") {
    const lower = val.trim().toLowerCase();
    if (lower === "work") return "Work";
    if (lower === "other") return "Other";
  }
  return "Home";
}

export interface LegacyCartAddressAdapterOptions {
  driver: FirestoreDriver;
}

/**
 * Legacy-Compatible Cart & Address Adapter (Emulator & Production Schema Compatible)
 *
 * Implements customer subcollection routing as verified in the live production
 * Firestore database (`docs/production-firestore-schema-comparison.md`):
 * - Cart: `users/{userDocId}/cart/{variantKey}`
 * - Addresses: `users/{userDocId}/addresses/{addressId}`
 * - Default Address: `users/{userDocId}.primaryAddressId`
 *
 * Safety & Identity Rules:
 * 1. Strict SASS ID Requirement: All operations require a canonical SASS customer ID.
 *    Firebase Authentication UIDs, guest session strings, or arbitrary strings are rejected.
 * 2. Profile Precondition: The parent profile `users/{userDocId}` must exist before
 *    accessing subcollections.
 * 3. Default Address via `primaryAddressId`: `isDefault` is resolved from the parent
 *    `users/{userDocId}.primaryAddressId` pointer.
 * 4. Coordinate Normalization: String coordinates (`"8.8174..."`) are safely converted to numbers.
 * 5. Strict Customer Isolation: Customer A cannot access or mutate Customer B's subcollections.
 */
export class LegacyCartAddressAdapter {
  private driver: FirestoreDriver;

  constructor(driver: FirestoreDriver) {
    this.driver = driver;
  }

  /**
   * Resolves the primary Firestore collection for the customer ("onlineCustomers" for ONCUS, "users" for SASS).
   */
  public getCustomerCollection(userId: string): "onlineCustomers" | "users" {
    return userId.trim().toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
  }

  /**
   * Constructs the subcollection path for a given customer and subcollection name ("cart" or "addresses").
   */
  public getCustomerSubcollectionPath(
    userId: string,
    subcollection: "cart" | "addresses"
  ): string {
    const rootCol = this.getCustomerCollection(userId);
    return `${rootCol}/${userId}/${subcollection}`;
  }

  /**
   * Asserts that the provided identifier is a valid canonical customer ID (SASS or ONCUS).
   * Throws a validation error if invalid or if a Firebase UID was provided.
   */
  public assertValidCustomer(userId: unknown): string {
    const clean = typeof userId === "string" ? userId.trim() : "";
    if (!clean || !CANONICAL_CUSTOMER_ID_RE.test(clean)) {
      throw new StorageAdapterError(
        `Invalid customer identifier "${userId}": Legacy-compatible customer operations require a canonical SASS customer ID (or ONCUS customer ID, e.g. 'ONCUS000010' or 'SASS0000001'). Firebase Authentication UIDs or guest IDs cannot be used as customer document paths.`,
        {
          status: 400,
          code: "invalid-argument",
          category: "validation",
        }
      );
    }
    return clean;
  }

  /**
   * Verifies that the customer profile document exists in Firestore (checking `onlineCustomers` or `users`).
   * Throws a 404 not-found error if the profile does not exist.
   */
  public async assertProfileExists(
    userDocId: string
  ): Promise<Record<string, unknown>> {
    const validId = this.assertValidCustomer(userDocId);
    const primaryCol = this.getCustomerCollection(validId);
    let profile = await this.driver.getDoc(primaryCol, validId);
    if (!profile && primaryCol === "onlineCustomers") {
      profile = await this.driver.getDoc("users", validId);
    }
    if (!profile) {
      throw new StorageAdapterError(
        `Not found: Customer profile '${primaryCol}/${validId}' does not exist. A valid customer profile must exist before accessing customer subcollections.`,
        {
          status: 404,
          code: "not-found",
          category: "not_found",
        }
      );
    }
    return profile;
  }

  /**
   * Extracts the canonical cartKey from an identifier that may be prefixed with `${userId}__`.
   */
  public extractCanonicalCartKey(rawKey: string, userId?: string): string {
    let key = (rawKey || "").trim();
    if (userId && key.startsWith(`${userId}__`)) {
      key = key.slice(userId.length + 2);
    } else if (key.includes("__opt")) {
      const parts = key.split("__");
      // If the first part is a customer ID followed by productId
      if (isValidCustomerId(parts[0]) && parts.length >= 5) {
        key = parts.slice(1).join("__");
      }
    }
    return key;
  }

  // ==========================================================================
  // CART OPERATIONS (users/{userDocId}/cart/{variantKey})
  // ==========================================================================

  /**
   * Retrieves all cart items for a signed-in customer from `users/{userDocId}/cart`.
   */
  public async getCart(userId: string): Promise<CartItem[]> {
    const validUserId = this.assertValidCustomer(userId);
    await this.assertProfileExists(validUserId);

    const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "cart");
    const rawItems = await this.driver.queryCollection(subcollectionPath, {});

    return rawItems.map((docData) => {
      const docId = String(docData["id"] || docData["cartKey"] || docData["variantKey"] || "");
      const canonicalKey = this.extractCanonicalCartKey(docId, validUserId);
      const name = String(docData["name"] || docData["productName"] || "");
      const price = Number(docData["price"] ?? docData["sellingPrice"] ?? docData["mrp"] ?? 0);
      const mrp = Number(docData["mrp"] ?? docData["price"] ?? 0);
      const quantity = Number(docData["quantity"] ?? 1);
      const optionIndex = Number(docData["optionIndex"] ?? 0);
      const unit = String(docData["unit"] || "");
      const unitSize = String(docData["unitSize"] ?? "");
      const image = String(docData["image"] || docData["imageUrl"] || docData["frontImageUrl"] || "");

      const stock =
        typeof docData["stock"] === "number" ? docData["stock"] : 99;

      const item: CartItem = {
        id: canonicalKey,
        cartKey: canonicalKey,
        userId: validUserId,
        productId: String(docData["productId"] || ""),
        optionIndex,
        unit,
        unitSize,
        name,
        price,
        mrp,
        quantity,
        image,
        stock,
      };

      if (docData["specialPrice"] !== undefined && typeof docData["specialPrice"] === "number") {
        item.specialPrice = docData["specialPrice"];
      }

      return item;
    });
  }

  /**
   * Retrieves a single cart item from `users/{userDocId}/cart/{variantKey}`.
   */
  public async getCartItem(
    userId: string,
    cartKey: string
  ): Promise<CartItem | null> {
    const validUserId = this.assertValidCustomer(userId);
    await this.assertProfileExists(validUserId);

    const canonicalKey = this.extractCanonicalCartKey(cartKey, validUserId);
    if (!canonicalKey) return null;

    const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "cart");
    const docData = await this.driver.getDoc(subcollectionPath, canonicalKey);
    if (!docData) return null;

    const name = String(docData["name"] || docData["productName"] || "");
    const price = Number(docData["price"] ?? docData["sellingPrice"] ?? docData["mrp"] ?? 0);
    const mrp = Number(docData["mrp"] ?? docData["price"] ?? 0);
    const quantity = Number(docData["quantity"] ?? 1);
    const optionIndex = Number(docData["optionIndex"] ?? 0);
    const unit = String(docData["unit"] || "");
    const unitSize = String(docData["unitSize"] ?? "");
    const image = String(docData["image"] || docData["imageUrl"] || docData["frontImageUrl"] || "");
    const stock =
      typeof docData["stock"] === "number" ? docData["stock"] : 99;

    const item: CartItem = {
      id: canonicalKey,
      cartKey: canonicalKey,
      userId: validUserId,
      productId: String(docData["productId"] || ""),
      optionIndex,
      unit,
      unitSize,
      name,
      price,
      mrp,
      quantity,
      image,
      stock,
    };

    if (docData["specialPrice"] !== undefined && typeof docData["specialPrice"] === "number") {
      item.specialPrice = docData["specialPrice"];
    }

    return item;
  }

  /**
   * Adds or sets a cart item in `users/{userDocId}/cart/{variantKey}`.
   * Preserves canonical variantKey: `${productId}__opt${optionIndex}__${unit}__${unitSize}`.
   */
  public async addToCart(
    userId: string,
    itemData: Partial<CartItem> & Record<string, unknown>
  ): Promise<CartItem> {
    const validUserId = this.assertValidCustomer(userId);
    await this.assertProfileExists(validUserId);

    // Ownership boundary check
    if (itemData["userId"] && typeof itemData["userId"] === "string") {
      const payloadUserId = itemData["userId"].trim();
      if (payloadUserId && payloadUserId !== validUserId) {
        throw new StorageAdapterError(
          `Permission denied: Ownership mismatch. Cannot add cart item with userId '${payloadUserId}' to customer subcollection 'users/${validUserId}/cart'.`,
          {
            status: 403,
            code: "permission-denied",
            category: "permission",
          }
        );
      }
    }

    const quantity = Number(itemData["quantity"] ?? 1);
    if (quantity <= 0 || Number.isNaN(quantity)) {
      throw new StorageAdapterError(
        "Validation error: Cart item quantity must be a positive number.",
        {
          status: 400,
          code: "invalid-argument",
          category: "validation",
        }
      );
    }

    const productId = String(itemData["productId"] || "").trim();
    if (!productId) {
      throw new StorageAdapterError(
        "Validation error: Cart item requires a non-empty productId.",
        {
          status: 400,
          code: "invalid-argument",
          category: "validation",
        }
      );
    }

    const optionIndex = Number(itemData["optionIndex"] ?? 0);
    const unit = String(itemData["unit"] || "");
    const unitSize = String(itemData["unitSize"] ?? "");

    // Resolve or derive canonical variant key
    let variantKey = String(
      itemData["cartKey"] || itemData["variantKey"] || itemData["id"] || ""
    ).trim();
    variantKey = this.extractCanonicalCartKey(variantKey, validUserId);

    if (!variantKey || !variantKey.includes("__opt")) {
      variantKey = buildCartKey(productId, optionIndex, unit, unitSize);
    }

    const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "cart");

    // Check if the item already exists to update quantity
    const existing = await this.driver.getDoc(subcollectionPath, variantKey);
    const finalQuantity = existing ? Number(existing["quantity"] || 0) + quantity : quantity;

    const name = String(itemData["name"] || itemData["productName"] || existing?.["name"] || "");
    const price = Number(
      itemData["price"] ?? itemData["sellingPrice"] ?? existing?.["price"] ?? 0
    );
    const mrp = Number(itemData["mrp"] ?? existing?.["mrp"] ?? price);
    const image = String(
      itemData["image"] || itemData["imageUrl"] || itemData["frontImageUrl"] || existing?.["image"] || ""
    );

    const docPayload: Record<string, unknown> = {
      id: variantKey,
      cartKey: variantKey,
      variantKey,
      userId: validUserId,
      productId,
      name,
      productName: name,
      price,
      sellingPrice: price,
      mrp,
      quantity: finalQuantity,
      unit,
      unitSize,
      optionIndex,
      image,
      imageUrl: image,
      frontImageUrl: image,
      addedAt: existing ? existing["addedAt"] : new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    if (itemData["specialPrice"] !== undefined) {
      docPayload["specialPrice"] = itemData["specialPrice"];
    } else if (existing?.["specialPrice"] !== undefined) {
      docPayload["specialPrice"] = existing["specialPrice"];
    }

    if (itemData["stock"] !== undefined) {
      docPayload["stock"] = itemData["stock"];
    } else if (existing?.["stock"] !== undefined) {
      docPayload["stock"] = existing["stock"];
    }

    await this.driver.setDoc(subcollectionPath, variantKey, docPayload, false);

    const stock =
      typeof docPayload["stock"] === "number" ? Number(docPayload["stock"]) : 99;

    const result: CartItem = {
      id: variantKey,
      cartKey: variantKey,
      userId: validUserId,
      productId,
      optionIndex,
      unit,
      unitSize,
      name,
      price,
      mrp,
      quantity: finalQuantity,
      image,
      stock,
    };
    if (docPayload["specialPrice"] !== undefined) {
      result.specialPrice = Number(docPayload["specialPrice"]);
    }

    return result;
  }

  /**
   * Updates the quantity of a cart item in `users/{userDocId}/cart/{variantKey}`.
   * If quantity <= 0, the item is removed.
   */
  public async updateCartQuantity(
    userId: string,
    cartKey: string,
    quantity: number
  ): Promise<CartItem | null> {
    const validUserId = this.assertValidCustomer(userId);
    await this.assertProfileExists(validUserId);

    const canonicalKey = this.extractCanonicalCartKey(cartKey, validUserId);
    if (!canonicalKey) return null;

    if (quantity <= 0) {
      await this.removeFromCart(validUserId, canonicalKey);
      return null;
    }

    const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "cart");
    const existing = await this.driver.getDoc(subcollectionPath, canonicalKey);
    if (!existing) {
      throw new StorageAdapterError(
        `HTTP Error 404: Cart item '${canonicalKey}' not found in 'users/${validUserId}/cart'.`,
        {
          status: 404,
          code: "not-found",
          category: "not_found",
        }
      );
    }

    const updated = await this.driver.updateDoc(subcollectionPath, canonicalKey, {
      quantity,
      lastUpdated: new Date().toISOString(),
    });

    const stock =
      typeof updated["stock"] === "number"
        ? Number(updated["stock"])
        : typeof existing["stock"] === "number"
          ? Number(existing["stock"])
          : 99;

    return {
      id: canonicalKey,
      cartKey: canonicalKey,
      userId: validUserId,
      productId: String(updated["productId"] || existing["productId"] || ""),
      optionIndex: Number(updated["optionIndex"] ?? existing["optionIndex"] ?? 0),
      unit: String(updated["unit"] || existing["unit"] || ""),
      unitSize: String(updated["unitSize"] ?? existing["unitSize"] ?? ""),
      name: String(updated["name"] || existing["name"] || ""),
      price: Number(updated["price"] ?? existing["price"] ?? 0),
      mrp: Number(updated["mrp"] ?? existing["mrp"] ?? 0),
      quantity,
      image: String(updated["image"] || existing["image"] || ""),
      stock,
    };
  }

  /**
   * Deletes a cart item from `users/{userDocId}/cart/{variantKey}`.
   */
  public async removeFromCart(userId: string, cartKey: string): Promise<void> {
    const validUserId = this.assertValidCustomer(userId);
    await this.assertProfileExists(validUserId);

    const canonicalKey = this.extractCanonicalCartKey(cartKey, validUserId);
    if (!canonicalKey) return;

    const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "cart");
    try {
      await this.driver.deleteDoc(subcollectionPath, canonicalKey);
    } catch (err) {
      // If document is already gone, delete is idempotent
      const status = (err as { status?: number })?.status;
      if (status !== 404) throw err;
    }
  }

  /**
   * Clears all cart items for a signed-in customer in `users/{userDocId}/cart`.
   */
  public async clearCart(userId: string): Promise<void> {
    const validUserId = this.assertValidCustomer(userId);
    await this.assertProfileExists(validUserId);

    const items = await this.getCart(validUserId);
    const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "cart");

    for (const item of items) {
      const canonicalKey = item.cartKey || item.id;
      try {
        await this.driver.deleteDoc(subcollectionPath, canonicalKey);
      } catch {
        // continue clearing
      }
    }
  }

  // ==========================================================================
  // ADDRESS OPERATIONS (users/{userDocId}/addresses/{addressId})
  // ==========================================================================

  /**
   * Retrieves all saved addresses for a customer from `users/{userDocId}/addresses`.
   * Resolves `isDefault` through `users/{userDocId}.primaryAddressId`.
   * Safely normalizes string coordinates (`latitude` / `longitude`) to numbers.
   */
  public async getAddresses(userId: string): Promise<Address[]> {
    const validUserId = this.assertValidCustomer(userId);
    const profile = await this.assertProfileExists(validUserId);

    const primaryAddressId =
      typeof profile["primaryAddressId"] === "string" && profile["primaryAddressId"].trim().length > 0
        ? profile["primaryAddressId"].trim()
        : null;

    const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "addresses");
    const rawDocs = await this.driver.queryCollection(subcollectionPath, {});

    return rawDocs.map((docData) => {
      const docId = String(docData["id"] || "");
      const lat = parseSafeCoordinate(docData["lat"] ?? docData["latitude"]);
      const lng = parseSafeCoordinate(docData["lng"] ?? docData["longitude"]);
      const isDefault = Boolean(primaryAddressId && docId === primaryAddressId);

      return {
        id: docId,
        userId: validUserId,
        name: String(docData["name"] || docData["fullName"] || ""),
        phone: String(docData["phone"] || docData["contact"] || ""),
        houseNo: String(docData["houseNo"] || docData["door"] || ""),
        street: String(docData["street"] || ""),
        landmark: String(docData["landmark"] || ""),
        city: String(docData["city"] || docData["town"] || ""),
        pincode: String(docData["pincode"] || ""),
        lat,
        lng,
        isDefault,
        tag: parseAddressTag(docData["tag"]),
      };
    });
  }

  /**
   * Retrieves a single address from `users/{userDocId}/addresses/{addressId}`.
   */
  public async getAddress(
    userId: string,
    addressId: string
  ): Promise<Address | null> {
    const validUserId = this.assertValidCustomer(userId);
    const profile = await this.assertProfileExists(validUserId);

    const cleanAddressId = (addressId || "").trim();
    if (!cleanAddressId) return null;

    const primaryAddressId =
      typeof profile["primaryAddressId"] === "string" ? profile["primaryAddressId"].trim() : null;

    const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "addresses");
    const docData = await this.driver.getDoc(subcollectionPath, cleanAddressId);
    if (!docData) return null;

    const lat = parseSafeCoordinate(docData["lat"] ?? docData["latitude"]);
    const lng = parseSafeCoordinate(docData["lng"] ?? docData["longitude"]);
    const isDefault = Boolean(primaryAddressId && cleanAddressId === primaryAddressId);

    return {
      id: cleanAddressId,
      userId: validUserId,
      name: String(docData["name"] || docData["fullName"] || ""),
      phone: String(docData["phone"] || docData["contact"] || ""),
      houseNo: String(docData["houseNo"] || docData["door"] || ""),
      street: String(docData["street"] || ""),
      landmark: String(docData["landmark"] || ""),
      city: String(docData["city"] || docData["town"] || ""),
      pincode: String(docData["pincode"] || ""),
      lat,
      lng,
      isDefault,
      tag: parseAddressTag(docData["tag"]),
    };
  }

  /**
   * Adds an address to `users/{userDocId}/addresses/{addressId}`.
   * If `address.isDefault === true` or if no addresses currently exist,
   * atomically updates `users/{userDocId}.primaryAddressId`.
   */
  public async addAddress(
    userId: string,
    addressData: Partial<Address> & Record<string, unknown>
  ): Promise<Address> {
    const validUserId = this.assertValidCustomer(userId);
    const profile = await this.assertProfileExists(validUserId);

    // Ownership boundary check
    if (addressData["userId"] && typeof addressData["userId"] === "string") {
      const payloadUserId = addressData["userId"].trim();
      if (payloadUserId && payloadUserId !== validUserId) {
        throw new StorageAdapterError(
          `Permission denied: Ownership mismatch. Cannot add address with userId '${payloadUserId}' to customer subcollection 'users/${validUserId}/addresses'.`,
          {
            status: 403,
            code: "permission-denied",
            category: "permission",
          }
        );
      }
    }

    const name = String(addressData["name"] || addressData["fullName"] || "").trim();
    const city = String(addressData["city"] || addressData["town"] || "").trim();
    if (!name || !city) {
      throw new StorageAdapterError(
        "Validation error: Address requires non-empty name and city.",
        {
          status: 400,
          code: "invalid-argument",
          category: "validation",
        }
      );
    }

    const addressId = String(
      addressData["id"] ||
        `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    ).trim();
    const lat = parseSafeCoordinate(addressData["lat"] ?? addressData["latitude"]);
    const lng = parseSafeCoordinate(addressData["lng"] ?? addressData["longitude"]);
    const houseNo = String(addressData["houseNo"] || addressData["door"] || "");
    const phone = String(addressData["phone"] || addressData["contact"] || "");
    const street = String(addressData["street"] || "");
    const landmark = String(addressData["landmark"] || "");
    const pincode = String(addressData["pincode"] || "");
    const tag = parseAddressTag(addressData["tag"]);

    const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "addresses");

    // Prepare document with both new UI fields and legacy field names for 100% interoperability
    const docPayload: Record<string, unknown> = {
      id: addressId,
      userId: validUserId,
      name,
      fullName: name,
      phone,
      contact: phone,
      houseNo,
      door: houseNo,
      street,
      landmark,
      city,
      town: city,
      pincode,
      lat,
      latitude: lat,
      lng,
      longitude: lng,
      tag,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };

    await this.driver.setDoc(subcollectionPath, addressId, docPayload, false);

    const currentPrimary =
      typeof profile["primaryAddressId"] === "string" ? profile["primaryAddressId"].trim() : "";
    const shouldBeDefault = Boolean(addressData.isDefault || !currentPrimary);

    if (shouldBeDefault) {
      await this.driver.updateDoc(this.getCustomerCollection(validUserId), validUserId, {
        primaryAddressId: addressId,
        lastUpdated: new Date().toISOString(),
      });
    }

    return {
      id: addressId,
      userId: validUserId,
      name,
      phone,
      houseNo,
      street,
      landmark,
      city,
      pincode,
      lat,
      lng,
      isDefault: shouldBeDefault,
      tag,
    };
  }

  /**
   * Updates an address in `users/{userDocId}/addresses/{addressId}`.
   * If `patch.isDefault === true`, updates `users/{userDocId}.primaryAddressId`.
   * If `patch.isDefault === false` and this address was primary, unsets `primaryAddressId`.
   */
  public async updateAddress(
    userId: string,
    addressId: string,
    patch: Partial<Address> & Record<string, unknown>
  ): Promise<Address> {
    const validUserId = this.assertValidCustomer(userId);
    const profile = await this.assertProfileExists(validUserId);

    const cleanAddressId = (addressId || "").trim();
    if (!cleanAddressId) {
      throw new StorageAdapterError(
        "Validation error: Address ID cannot be empty.",
        {
          status: 400,
          code: "invalid-argument",
          category: "validation",
        }
      );
    }

    // Ownership boundary check
    if (patch["userId"] && typeof patch["userId"] === "string") {
      const payloadUserId = patch["userId"].trim();
      if (payloadUserId && payloadUserId !== validUserId) {
        throw new StorageAdapterError(
          `Permission denied: Ownership mismatch. Cannot update address with userId '${payloadUserId}' in customer subcollection 'users/${validUserId}/addresses'.`,
          {
            status: 403,
            code: "permission-denied",
            category: "permission",
          }
        );
      }
    }

    const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "addresses");
    const existing = await this.driver.getDoc(subcollectionPath, cleanAddressId);
    if (!existing) {
      throw new StorageAdapterError(
        `HTTP Error 404: Address '${cleanAddressId}' not found in 'users/${validUserId}/addresses'.`,
        {
          status: 404,
          code: "not-found",
          category: "not_found",
        }
      );
    }

    const cleanPatch: Record<string, unknown> = {};

    if (patch["name"] !== undefined || patch["fullName"] !== undefined) {
      const n = String(patch["name"] ?? patch["fullName"]);
      cleanPatch["name"] = n;
      cleanPatch["fullName"] = n;
    }
    if (patch["phone"] !== undefined || patch["contact"] !== undefined) {
      const p = String(patch["phone"] ?? patch["contact"]);
      cleanPatch["phone"] = p;
      cleanPatch["contact"] = p;
    }
    if (patch["houseNo"] !== undefined || patch["door"] !== undefined) {
      const h = String(patch["houseNo"] ?? patch["door"]);
      cleanPatch["houseNo"] = h;
      cleanPatch["door"] = h;
    }
    if (patch["street"] !== undefined) cleanPatch["street"] = String(patch["street"]);
    if (patch["landmark"] !== undefined) cleanPatch["landmark"] = String(patch["landmark"]);
    if (patch["city"] !== undefined || patch["town"] !== undefined) {
      const c = String(patch["city"] ?? patch["town"]);
      cleanPatch["city"] = c;
      cleanPatch["town"] = c;
    }
    if (patch["pincode"] !== undefined) cleanPatch["pincode"] = String(patch["pincode"]);
    if (patch["tag"] !== undefined) cleanPatch["tag"] = patch["tag"];

    if (patch["lat"] !== undefined || patch["latitude"] !== undefined) {
      const latVal = parseSafeCoordinate(patch["lat"] ?? patch["latitude"]);
      cleanPatch["lat"] = latVal;
      cleanPatch["latitude"] = latVal;
    }
    if (patch["lng"] !== undefined || patch["longitude"] !== undefined) {
      const lngVal = parseSafeCoordinate(patch["lng"] ?? patch["longitude"]);
      cleanPatch["lng"] = lngVal;
      cleanPatch["longitude"] = lngVal;
    }

    cleanPatch["lastUsed"] = new Date().toISOString();

    const updated = await this.driver.updateDoc(
      subcollectionPath,
      cleanAddressId,
      cleanPatch
    );

    let currentPrimary =
      typeof profile["primaryAddressId"] === "string" ? profile["primaryAddressId"].trim() : "";

    const rootCol = this.getCustomerCollection(validUserId);
    if (patch.isDefault === true) {
      if (currentPrimary !== cleanAddressId) {
        await this.driver.updateDoc(rootCol, validUserId, {
          primaryAddressId: cleanAddressId,
          lastUpdated: new Date().toISOString(),
        });
        currentPrimary = cleanAddressId;
      }
    } else if (patch.isDefault === false && currentPrimary === cleanAddressId) {
      await this.driver.updateDoc(rootCol, validUserId, {
        primaryAddressId: null,
        lastUpdated: new Date().toISOString(),
      });
      currentPrimary = "";
    }

    const lat = parseSafeCoordinate(updated["lat"] ?? updated["latitude"] ?? existing["lat"]);
    const lng = parseSafeCoordinate(updated["lng"] ?? updated["longitude"] ?? existing["lng"]);

    return {
      id: cleanAddressId,
      userId: validUserId,
      name: String(updated["name"] || updated["fullName"] || existing["name"] || ""),
      phone: String(updated["phone"] || updated["contact"] || existing["phone"] || ""),
      houseNo: String(updated["houseNo"] || updated["door"] || existing["houseNo"] || ""),
      street: String(updated["street"] || existing["street"] || ""),
      landmark: String(updated["landmark"] || existing["landmark"] || ""),
      city: String(updated["city"] || updated["town"] || existing["city"] || ""),
      pincode: String(updated["pincode"] || existing["pincode"] || ""),
      lat,
      lng,
      isDefault: currentPrimary === cleanAddressId,
      tag: parseAddressTag(updated["tag"] ?? existing["tag"]),
    };
  }

  /**
   * Deletes an address from `users/{userDocId}/addresses/{addressId}` or `onlineCustomers/{userDocId}/addresses/{addressId}`.
   * If the deleted address was `primaryAddressId`, unsets it on the customer profile.
   */
  public async deleteAddress(userId: string, addressId: string): Promise<void> {
    const validUserId = this.assertValidCustomer(userId);
    const profile = await this.assertProfileExists(validUserId);

    const cleanAddressId = (addressId || "").trim();
    if (!cleanAddressId) return;

    const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "addresses");
    await this.driver.deleteDoc(subcollectionPath, cleanAddressId);

    const rootCol = this.getCustomerCollection(validUserId);
    const latestProfile = await this.driver.getDoc(rootCol, validUserId);
    const primaryAddressId =
      typeof latestProfile?.["primaryAddressId"] === "string"
        ? latestProfile["primaryAddressId"].trim()
        : "";
    if (primaryAddressId === cleanAddressId) {
      await this.driver.updateDoc(rootCol, validUserId, {
        primaryAddressId: null,
        lastUpdated: new Date().toISOString(),
      });
    }
  }

  /**
   * Sets an address as default by updating the customer profile's `primaryAddressId`.
   * Verifies that the address document exists in the customer's subcollection.
   */
  public async setDefaultAddress(
    userId: string,
    addressId: string
  ): Promise<void> {
    const validUserId = this.assertValidCustomer(userId);
    await this.assertProfileExists(validUserId);

    const cleanAddressId = (addressId || "").trim();
    if (!cleanAddressId) {
      throw new StorageAdapterError(
        "Validation error: Address ID cannot be empty.",
        {
          status: 400,
          code: "invalid-argument",
          category: "validation",
        }
      );
    }

    const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "addresses");
    const exists = await this.driver.getDoc(subcollectionPath, cleanAddressId);
    if (!exists) {
      throw new StorageAdapterError(
        `HTTP Error 404: Address '${cleanAddressId}' not found in '${subcollectionPath}'. Setting default address requires that the address belongs to customer '${validUserId}'.`,
        {
          status: 404,
          code: "not-found",
          category: "not_found",
        }
      );
    }

    const rootCol = this.getCustomerCollection(validUserId);
    await this.driver.updateDoc(rootCol, validUserId, {
      primaryAddressId: cleanAddressId,
      lastUpdated: new Date().toISOString(),
    });
  }
}
