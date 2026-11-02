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
import { productService } from "./productService";
import type { Wishlist, WishlistProduct, Product } from "../types";

/**
 * Timeout bounding utility for production Firestore wishlist reads.
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
 * Normalizes an arbitrary legacy wishlist container document from production Firestore (`users/{SASS_ID}/wishlists/{docId}`)
 * into the standard frontend `Wishlist` type.
 */
export function normalizeLegacyWishlist(
  docId: string,
  docData: Record<string, unknown>,
  userId: string
): Wishlist {
  const resolvedId = String(docData["id"] || docId || "").trim();
  const title = String(docData["title"] || docData["name"] || resolvedId || "Wishlist").trim();
  const description = String(docData["description"] || "").trim();
  const createdAt = String(docData["createdAt"] || docData["addedAt"] || new Date().toISOString()).trim();

  return {
    id: resolvedId,
    userId,
    title,
    description,
    createdAt,
  };
}

/**
 * Normalizes an arbitrary legacy wishlist product document from production Firestore (`users/{SASS_ID}/wishlists/{wishlistId}/products/{docId}`)
 * into the standard frontend `WishlistProduct` type, reconciling against live catalogue products when available.
 */
export function normalizeLegacyWishlistProduct(
  docId: string,
  docData: Record<string, unknown>,
  userId: string,
  wishlistId: string,
  catalog?: Product[]
): WishlistProduct {
  // 1. Resolve canonical productId
  let rawProdId = String(docData["productId"] || "").trim();
  if (!rawProdId) {
    // If docId follows `${productId}_${unit}_${unitSize}` format from legacy getOptionKey:
    const parts = docId.split("_");
    rawProdId = parts[0] ? parts[0].trim() : docId;
  }
  const productId = rawProdId || docId;

  // 2. Unit and unitSize from saved Firestore data
  const rawUnit = String(docData["unit"] || "").trim();
  const rawUnitSize = String(docData["unitSize"] || "").trim();

  // 3. Find matching product in catalogue
  const catalogProd = catalog?.find((p) => p.id === productId);

  // 4. Resolve optionIndex
  let optionIndex = typeof docData["optionIndex"] === "number" ? docData["optionIndex"] : 0;
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

  // 5. Price reconciliation: prefer live catalog prices, falling back to saved doc snapshot
  const rawDocPrice =
    typeof docData["price"] === "number"
      ? docData["price"]
      : typeof docData["sellingPrice"] === "number"
      ? docData["sellingPrice"]
      : typeof docData["offerPrice"] === "number"
      ? docData["offerPrice"]
      : 0;

  const rawDocMrp =
    typeof docData["mrp"] === "number" ? docData["mrp"] : rawDocPrice;

  const rawDocSpecial =
    typeof docData["specialPrice"] === "number" ? docData["specialPrice"] : undefined;

  const price =
    matchedOption?.offerPrice ??
    (rawDocPrice > 0 ? rawDocPrice : rawDocMrp > 0 ? rawDocMrp : 0);

  const mrp = matchedOption?.mrp ?? (rawDocMrp > 0 ? rawDocMrp : price);
  const specialPrice = matchedOption?.specialPrice ?? rawDocSpecial;

  // 6. Name, unit, unitSize, and image
  const resolvedUnit = matchedOption?.unit ?? rawUnit;
  const resolvedUnitSize = matchedOption?.unitSize ? String(matchedOption.unitSize) : rawUnitSize;

  let name = String(docData["name"] || "").trim();
  if (catalogProd?.name) {
    name =
      resolvedUnitSize && resolvedUnit
        ? `${catalogProd.name} (${resolvedUnitSize}${resolvedUnit})`
        : catalogProd.name;
  } else if (!name) {
    name = `Product (${productId})`;
  }

  const image =
    catalogProd?.imageUrl ||
    String(docData["image"] || docData["imageUrl"] || "").trim();

  return {
    id: docId,
    wishlistId,
    userId,
    productId,
    optionIndex,
    unit: resolvedUnit,
    unitSize: resolvedUnitSize,
    name,
    price,
    mrp,
    ...(specialPrice !== undefined ? { specialPrice } : {}),
    image,
  };
}

export type ProductionWishlistReaderOverride = {
  getCustomerWishlists?: (
    customerId: string,
    legacySassId?: string
  ) => Promise<Wishlist[]>;
  getCustomerWishlistProducts?: (
    customerId: string,
    wishlistId?: string,
    catalog?: Product[],
    legacySassId?: string
  ) => Promise<WishlistProduct[]>;
};

let readerOverride: ProductionWishlistReaderOverride | null = null;

/**
 * Test utility to override the production wishlist reader with mock implementations.
 */
export function setProductionWishlistReaderOverride(
  override: ProductionWishlistReaderOverride | null
): void {
  readerOverride = override;
}

export const productionWishlistReader = {
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
   * Reads all custom wishlist containers for an authenticated customer from production Firestore (`sri-amman-smart-store`).
   * Queries `onlineCustomers/{ID}/wishlists` or `users/{ID}/wishlists`.
   */
  async getCustomerWishlists(
    customerId?: string,
    timeoutMs = 8000,
    legacySassId?: string
  ): Promise<Wishlist[]> {
    if (readerOverride?.getCustomerWishlists) {
      if (legacySassId) {
        return readerOverride.getCustomerWishlists(customerId || "", legacySassId);
      }
      return readerOverride.getCustomerWishlists(customerId || "");
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

    const wishlistsColRef = collection(db, primaryCol, validCustomerId, "wishlists");

    try {
      let snap = await withTimeout(
        getDocs(query(wishlistsColRef)),
        timeoutMs,
        `getDocs(${primaryCol}/${validCustomerId}/wishlists)`
      );

      if (snap.empty && primaryCol === "onlineCustomers" && cleanLegacySassId) {
        try {
          const fallbackSnap = await withTimeout(
            getDocs(query(collection(db, "users", cleanLegacySassId, "wishlists"))),
            timeoutMs,
            `getDocs(users/${cleanLegacySassId}/wishlists)`
          );
          if (!fallbackSnap.empty) {
            snap = fallbackSnap;
          }
        } catch (err) {
          console.warn(`[ProductionWishlistReader] Warning querying fallback wishlists:`, err);
        }
      }

      const list: Wishlist[] = snap.docs.map((docSnap) =>
        normalizeLegacyWishlist(
          docSnap.id,
          docSnap.data() as Record<string, unknown>,
          validCustomerId
        )
      );

      return list;
    } catch (err: unknown) {
      console.error(
        `[ProductionWishlistReader] Error querying ${primaryCol}/${validCustomerId}/wishlists:`,
        err
      );
      const category = classifyStorageError(err);
      const msg = err instanceof Error ? err.message : String(err);
      throw new StorageAdapterError(
        `Failed to retrieve wishlists for customer ${validCustomerId}: ${msg}`,
        {
          status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
          code: category === "permission" ? "permission-denied" : "unavailable",
          category,
          causeError: err,
        }
      );
    }
  },

  /**
   * Reads all wishlist products for an authenticated customer from production Firestore (`sri-amman-smart-store`).
   * Queries `onlineCustomers/{ID}/wishlists/{wishlistId}/products` or `users/{ID}/wishlists/{wishlistId}/products`.
   * Reconciles saved items with the live catalogue.
   */
  async getCustomerWishlistProducts(
    customerId?: string,
    wishlistId?: string,
    catalog?: Product[],
    timeoutMs = 8000,
    legacySassId?: string
  ): Promise<WishlistProduct[]> {
    if (readerOverride?.getCustomerWishlistProducts) {
      if (legacySassId) {
        return readerOverride.getCustomerWishlistProducts(customerId || "", wishlistId, catalog, legacySassId);
      }
      if (catalog !== undefined) {
        return readerOverride.getCustomerWishlistProducts(customerId || "", wishlistId, catalog);
      }
      return readerOverride.getCustomerWishlistProducts(customerId || "", wishlistId);
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

    // 1. Fetch live catalogue products for reconciliation if not passed
    let liveCatalog = catalog;
    if (!liveCatalog) {
      try {
        liveCatalog = await productService.getProducts();
      } catch {
        liveCatalog = [];
      }
    }

    // 2. Determine container IDs to query
    const targetWishlistIds: string[] = [];

    if (wishlistId && wishlistId !== "all") {
      targetWishlistIds.push(wishlistId);
      // If client requests "wl_default", also check "default" as an alias in case legacy stored it there
      if (wishlistId === "wl_default") {
        targetWishlistIds.push("default");
      }
    } else {
      // Query across all custom containers and default containers
      try {
        const customContainers = await this.getCustomerWishlists(validCustomerId, timeoutMs, cleanLegacySassId);
        for (const w of customContainers) {
          if (!targetWishlistIds.includes(w.id)) {
            targetWishlistIds.push(w.id);
          }
        }
      } catch (err: unknown) {
        // If retrieving container index fails with a security or network error, propagate it
        if (err instanceof StorageAdapterError) {
          throw err;
        }
        const category = classifyStorageError(err);
        throw new StorageAdapterError(
          `Failed to retrieve wishlist containers for customer ${validCustomerId}: ${err instanceof Error ? err.message : String(err)}`,
          {
            status: category === "permission" ? 403 : 500,
            code: category === "permission" ? "permission-denied" : "unavailable",
            category,
            causeError: err,
          }
        );
      }

      // Always include standard default container IDs to capture items saved without a custom folder
      if (!targetWishlistIds.includes("wl_default")) targetWishlistIds.push("wl_default");
      if (!targetWishlistIds.includes("default")) targetWishlistIds.push("default");
    }

    // 3. Query subcollections in parallel
    const subcollectionPromises = targetWishlistIds.map(async (wId) => {
      const colRef = collection(db, primaryCol, validCustomerId, "wishlists", wId, "products");
      let snap = await withTimeout(
        getDocs(query(colRef)),
        timeoutMs,
        `getDocs(${primaryCol}/${validCustomerId}/wishlists/${wId}/products)`
      ).catch(() => null);

      if ((!snap || snap.empty) && primaryCol === "onlineCustomers" && cleanLegacySassId) {
        const fallbackColRef = collection(db, "users", cleanLegacySassId, "wishlists", wId, "products");
        const fallbackSnap = await withTimeout(
          getDocs(query(fallbackColRef)),
          timeoutMs,
          `getDocs(users/${cleanLegacySassId}/wishlists/${wId}/products)`
        ).catch(() => null);
        if (fallbackSnap && !fallbackSnap.empty) {
          snap = fallbackSnap;
        }
      }

      return {
        wishlistId: wId,
        docs: snap ? snap.docs : [],
      };
    });

    const results = await Promise.all(subcollectionPromises);

    // 4. Normalize and deduplicate items
    const itemsMap = new Map<string, WishlistProduct>();

    for (const res of results) {
      const { wishlistId: currentWId, docs } = res;
      // Map "default" container back to frontend "wl_default"
      const normalizedWId = currentWId === "default" ? "wl_default" : currentWId;

      for (const docSnap of docs) {
        const data = docSnap.data() as Record<string, unknown>;
        const normalized = normalizeLegacyWishlistProduct(
          docSnap.id,
          data,
          validCustomerId,
          normalizedWId,
          liveCatalog
        );

        // Deduplicate: if an item with the same doc.id was already fetched, keep it
        const uniqueKey = `${normalized.id}_${normalized.wishlistId}`;
        if (!itemsMap.has(uniqueKey)) {
          itemsMap.set(uniqueKey, normalized);
        }
      }
    }

    return Array.from(itemsMap.values());
  },
};

