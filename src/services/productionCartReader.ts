import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
} from "firebase/firestore";
import { getProductionFirestoreInstance } from "./productionOrderReader";
import { CANONICAL_CUSTOMER_ID_RE } from "./legacyCartAddressAdapter";
import {
  classifyStorageError,
  StorageAdapterError,
} from "./firestoreAdapter";
import type { CartItem, Product } from "../types";

/**
 * Timeout bounding utility for production Firestore cart reads.
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operation: string
): Promise<T> {
  if (timeoutMs <= 0) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new StorageAdapterError(
          `Production Firestore operation timed out after ${timeoutMs}ms during ${operation}`,
          {
            status: 503,
            code: "unavailable",
            category: "connectivity",
          }
        )
      );
    }, timeoutMs);

    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Normalizes an arbitrary legacy cart document from production Firestore (`users/{SASS_ID}/cart/{docId}`
 * or `onlineCustomers/{ONCUS_ID}/cart/{docId}`) into the standard frontend `CartItem` type.
 */
export function normalizeLegacyCartDocument(
  docId: string,
  docData: Record<string, unknown>,
  userId: string,
  catalog?: Product[]
): CartItem {
  // 1. Resolve canonical cartKey / variantKey
  const rawKey = String(
    docData["cartKey"] || docData["variantKey"] || docData["id"] || docId || ""
  ).trim();
  let canonicalKey = rawKey;
  if (userId && canonicalKey.startsWith(`${userId}__`)) {
    canonicalKey = canonicalKey.slice(userId.length + 2);
  }

  // 2. Resolve productId
  let productId = String(docData["productId"] || "").trim();
  if (!productId && canonicalKey.includes("__opt")) {
    productId = canonicalKey.split("__opt")[0] || "";
  }
  if (!productId) {
    productId = docId;
  }

  // 3. OptionIndex, unit, unitSize
  const rawUnit = String(docData["unit"] || "").trim();
  const rawUnitSize = String(docData["unitSize"] ?? "").trim();
  let optionIndex = typeof docData["optionIndex"] === "number" ? docData["optionIndex"] : 0;

  // 4. Reconcile with catalogue product if available
  const catalogProd = catalog?.find((p) => p.id === productId);
  let matchedOption = catalogProd?.options?.[optionIndex];

  if (catalogProd && catalogProd.options && catalogProd.options.length > 0) {
    if (rawUnit || rawUnitSize) {
      const foundIdx = catalogProd.options.findIndex(
        (opt) =>
          opt.unit.trim().toLowerCase() === rawUnit.toLowerCase() &&
          String(opt.unitSize).trim() === rawUnitSize
      );
      if (foundIdx >= 0) {
        optionIndex = foundIdx;
        matchedOption = catalogProd.options[foundIdx];
      }
    }
    if (!matchedOption) {
      matchedOption = catalogProd.options[0];
      optionIndex = 0;
    }
  }

  // 5. Pricing
  const rawPrice =
    typeof docData["price"] === "number"
      ? docData["price"]
      : typeof docData["sellingPrice"] === "number"
      ? docData["sellingPrice"]
      : typeof docData["offerPrice"] === "number"
      ? docData["offerPrice"]
      : 0;

  const rawMrp =
    typeof docData["mrp"] === "number" ? docData["mrp"] : rawPrice;

  const rawSpecial =
    typeof docData["specialPrice"] === "number" ? docData["specialPrice"] : undefined;

  const price = matchedOption?.offerPrice ?? (rawPrice > 0 ? rawPrice : rawMrp > 0 ? rawMrp : 0);
  const mrp = matchedOption?.mrp ?? (rawMrp > 0 ? rawMrp : price);
  const specialPrice = matchedOption?.specialPrice ?? rawSpecial;

  // 6. Name, image, quantity, stock
  const resolvedUnit = matchedOption?.unit ?? rawUnit;
  const resolvedUnitSize = matchedOption?.unitSize ? String(matchedOption.unitSize) : rawUnitSize;

  let name = String(docData["name"] || docData["productName"] || "").trim();
  if (catalogProd?.name) {
    name =
      resolvedUnitSize && resolvedUnit
        ? `${catalogProd.name} (${resolvedUnitSize}${resolvedUnit})`
        : catalogProd.name;
  } else if (!name) {
    name = `Item (${productId})`;
  }

  const image =
    catalogProd?.imageUrl ||
    String(docData["image"] || docData["imageUrl"] || docData["frontImageUrl"] || "").trim();

  const quantity = Math.max(1, typeof docData["quantity"] === "number" ? docData["quantity"] : 1);
  const stock =
    typeof docData["stock"] === "number"
      ? docData["stock"]
      : (matchedOption?.stock ?? 99);

  return {
    id: canonicalKey || docId,
    cartKey: canonicalKey || docId,
    userId,
    productId,
    optionIndex,
    unit: resolvedUnit,
    unitSize: resolvedUnitSize,
    name,
    price,
    mrp,
    ...(specialPrice !== undefined ? { specialPrice } : {}),
    quantity,
    image,
    stock,
  };
}

export type ProductionCartReaderOverride = {
  getCustomerCart?: (
    customerId: string,
    legacySassId?: string,
    catalog?: Product[]
  ) => Promise<CartItem[]>;
};

let readerOverride: ProductionCartReaderOverride | null = null;

/**
 * Test utility to override the production cart reader with mock implementations.
 */
export function setProductionCartReaderOverride(
  override: ProductionCartReaderOverride | null
): void {
  readerOverride = override;
}

export const productionCartReader = {
  /**
   * Asserts that the provided identifier is a valid canonical customer ID (SASS or ONCUS).
   */
  assertValidCustomer(customerId: unknown): string {
    const clean = typeof customerId === "string" ? customerId.trim() : "";
    if (!clean || !CANONICAL_CUSTOMER_ID_RE.test(clean)) {
      throw new StorageAdapterError(
        `Invalid customer identifier "${customerId}": Production customer operations require a canonical SASS customer ID (or ONCUS customer ID, e.g. 'ONCUS000010' or 'SASS0000001').`,
        {
          status: 400,
          code: "invalid-argument",
          category: "validation",
        }
      );
    }
    return clean;
  },

  /**
   * Reads all cart items for an authenticated customer directly from production Firestore (`sri-amman-smart-store`).
   * Queries `onlineCustomers/{ID}/cart` or `users/{ID}/cart`.
   * If customer has an ONCUS ID and legacy SASS ID, falls back to legacy cart items if online cart is empty.
   */
  async getCustomerCart(
    customerId?: string,
    timeoutMs = 8000,
    legacySassId?: string,
    catalog?: Product[]
  ): Promise<CartItem[]> {
    if (readerOverride?.getCustomerCart) {
      if (legacySassId) {
        return catalog
          ? readerOverride.getCustomerCart(customerId || "", legacySassId, catalog)
          : readerOverride.getCustomerCart(customerId || "", legacySassId);
      }
      return catalog
        ? readerOverride.getCustomerCart(customerId || "", undefined, catalog)
        : readerOverride.getCustomerCart(customerId || "");
    }

    const cleanCustomerId = (customerId || "").trim();
    if (!cleanCustomerId) return [];

    const validCustomerId = this.assertValidCustomer(cleanCustomerId);
    const cleanLegacySassId =
      typeof legacySassId === "string" && legacySassId.trim()
        ? legacySassId.trim()
        : undefined;

    const db = getProductionFirestoreInstance();
    const primaryCol = validCustomerId.toUpperCase().startsWith("ONCUS")
      ? "onlineCustomers"
      : "users";

    const cartColRef = collection(db, primaryCol, validCustomerId, "cart");

    try {
      const snap = await withTimeout(
        getDocs(query(cartColRef)),
        timeoutMs,
        `getDocs(${primaryCol}/${validCustomerId}/cart)`
      );

      // Note on Online-to-Legacy Fallback Safety:
      // Unlike immutable historical orders or static addresses, shopping carts are active,
      // mutable working state. In Phase 2E, all customer subcollections (including cart)
      // were copied and verified in onlineCustomers.
      // An empty cart in onlineCustomers represents the customer's live, current cart state.
      // We must NEVER fall back to users/{legacySassId}/cart when an online cart is empty,
      // as doing so would resurrect stale legacy cart items that were checked out or cleared.
      // For non-migrated customers (SASS), primaryCol is 'users', querying users/{id}/cart directly.

      const list: CartItem[] = [];
      const seenKeys = new Set<string>();

      for (const docSnap of snap.docs) {
        const item = normalizeLegacyCartDocument(
          docSnap.id,
          docSnap.data() as Record<string, unknown>,
          validCustomerId,
          catalog
        );
        const dedupeKey = item.cartKey || item.id;
        if (!seenKeys.has(dedupeKey)) {
          seenKeys.add(dedupeKey);
          list.push(item);
        }
      }

      return list;
    } catch (err: unknown) {
      console.error(
        `[ProductionCartReader] Error querying ${primaryCol}/${validCustomerId}/cart:`,
        err
      );
      const category = classifyStorageError(err);
      const msg = err instanceof Error ? err.message : String(err);
      throw new StorageAdapterError(
        `Failed to retrieve cart items for customer ${validCustomerId}: ${msg}`,
        {
          status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
          code: category === "permission" ? "permission-denied" : "unavailable",
          category,
          causeError: err,
        }
      );
    }
  },
};
