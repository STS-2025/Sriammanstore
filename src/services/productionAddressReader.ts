import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
} from "firebase/firestore";
import { getProductionFirestoreInstance } from "./productionOrderReader";
import {
  parseAddressTag,
  parseSafeCoordinate,
  CANONICAL_CUSTOMER_ID_RE,
} from "./legacyCartAddressAdapter";
import {
  classifyStorageError,
  StorageAdapterError,
} from "./firestoreAdapter";
import type { Address } from "../types";

/**
 * Timeout bounding utility for production Firestore address reads.
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
 * Normalizes an arbitrary legacy address document from production Firestore (`users/{SASS_ID}/addresses/{docId}`)
 * into the standard frontend `Address` type, preserving existing valid fields, document IDs, and resolving default status.
 */
export function normalizeLegacyAddressDocument(
  docId: string,
  docData: Record<string, unknown>,
  userId: string,
  primaryAddressId?: string | null
): Address {
  const resolvedId = String(docData["id"] || docId || "").trim();
  const lat = parseSafeCoordinate(docData["lat"] ?? docData["latitude"], 11.4598);
  const lng = parseSafeCoordinate(docData["lng"] ?? docData["longitude"], 77.334);
  const landmarkVal = docData["landmark"] ? String(docData["landmark"]).trim() : undefined;

  const isDefault = Boolean(
    (primaryAddressId && (resolvedId === primaryAddressId || docId === primaryAddressId)) ||
      docData["isDefault"] === true
  );

  return {
    id: resolvedId,
    userId,
    tag: parseAddressTag(docData["tag"]),
    name: String(docData["name"] || docData["fullName"] || "").trim(),
    phone: String(docData["phone"] || docData["contact"] || "").trim(),
    houseNo: String(docData["houseNo"] || docData["door"] || "").trim(),
    street: String(docData["street"] || "").trim(),
    ...(landmarkVal ? { landmark: landmarkVal } : {}),
    city: String(docData["city"] || docData["town"] || "").trim(),
    pincode: String(docData["pincode"] || "").trim(),
    lat,
    lng,
    isDefault,
  };
}

export type ProductionAddressReaderOverride = {
  getCustomerAddresses?: (
    customerId: string,
    legacySassId?: string
  ) => Promise<Address[]>;
  getAddressById?: (
    addressId: string,
    customerId: string,
    legacySassId?: string
  ) => Promise<Address | null>;
};

let readerOverride: ProductionAddressReaderOverride | null = null;

/**
 * Test utility to override the production address reader with mock implementations.
 */
export function setProductionAddressReaderOverride(
  override: ProductionAddressReaderOverride | null
): void {
  readerOverride = override;
}

export const productionAddressReader = {
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
   * Reads all saved addresses for an authenticated customer from production Firestore (`sri-amman-smart-store`).
   * Queries the customer subcollection (`onlineCustomers/{ID}/addresses` or `users/{ID}/addresses`) and resolves the primary address.
   * If customer has an ONCUS ID and legacy SASS ID, falls back to legacy addresses if online addresses are empty.
   */
  async getCustomerAddresses(
    customerId?: string,
    timeoutMs = 8000,
    legacySassId?: string
  ): Promise<Address[]> {
    if (readerOverride?.getCustomerAddresses) {
      if (legacySassId) {
        return readerOverride.getCustomerAddresses(customerId || "", legacySassId);
      }
      return readerOverride.getCustomerAddresses(customerId || "");
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

    const userRef = doc(db, primaryCol, validCustomerId);
    const addressesColRef = collection(db, primaryCol, validCustomerId, "addresses");

    // Fetch parent profile (for primaryAddressId) and addresses subcollection in parallel
    const [userRes, addrsRes] = await Promise.allSettled([
      withTimeout(getDoc(userRef), timeoutMs, `getDoc(${primaryCol}/${validCustomerId})`),
      withTimeout(
        getDocs(query(addressesColRef)),
        timeoutMs,
        `getDocs(${primaryCol}/${validCustomerId}/addresses)`
      ),
    ]);

    let docs = addrsRes.status === "fulfilled" ? addrsRes.value.docs : [];
    let primaryAddressId: string | null = null;
    if (userRes.status === "fulfilled" && userRes.value.exists()) {
      const uData = userRes.value.data();
      if (typeof uData?.["primaryAddressId"] === "string" && uData["primaryAddressId"].trim()) {
        primaryAddressId = uData["primaryAddressId"].trim();
      }
    }

    // Dual-path fallback: if onlineCustomers had 0 addresses and cleanLegacySassId exists
    if (docs.length === 0 && primaryCol === "onlineCustomers" && cleanLegacySassId) {
      try {
        const legacyUserRef = doc(db, "users", cleanLegacySassId);
        const legacyAddrsColRef = collection(db, "users", cleanLegacySassId, "addresses");
        const [legacyUserRes, legacyAddrsRes] = await Promise.allSettled([
          withTimeout(getDoc(legacyUserRef), timeoutMs, `getDoc(users/${cleanLegacySassId})`),
          withTimeout(
            getDocs(query(legacyAddrsColRef)),
            timeoutMs,
            `getDocs(users/${cleanLegacySassId}/addresses)`
          ),
        ]);
        if (legacyAddrsRes.status === "fulfilled" && legacyAddrsRes.value.docs.length > 0) {
          docs = legacyAddrsRes.value.docs;
          if (legacyUserRes.status === "fulfilled" && legacyUserRes.value.exists()) {
            const uData = legacyUserRes.value.data();
            if (typeof uData?.["primaryAddressId"] === "string" && uData["primaryAddressId"].trim()) {
              primaryAddressId = uData["primaryAddressId"].trim();
            }
          }
        }
      } catch (err) {
        console.warn(
          `[ProductionAddressReader] Warning querying fallback users/${cleanLegacySassId}/addresses:`,
          err
        );
      }
    }

    // If addresses subcollection fetch failed in primary and no fallback docs
    if (addrsRes.status === "rejected" && docs.length === 0) {
      const err = addrsRes.reason;
      console.error(
        `[ProductionAddressReader] Error querying ${primaryCol}/${validCustomerId}/addresses:`,
        err
      );
      const category = classifyStorageError(err);
      const msg = err instanceof Error ? err.message : String(err);
      throw new StorageAdapterError(
        `Failed to retrieve saved addresses for customer ${validCustomerId}: ${msg}`,
        {
          status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
          code: category === "permission" ? "permission-denied" : "unavailable",
          category,
          causeError: err,
        }
      );
    }

    const addressList: Address[] = [];
    docs.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const normalized = normalizeLegacyAddressDocument(
        docSnap.id,
        data,
        validCustomerId,
        primaryAddressId
      );
      addressList.push(normalized);
    });

    // Sort addresses: primary address first, then remaining addresses deterministically
    addressList.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return a.id.localeCompare(b.id);
    });

    return addressList;
  },

  /**
   * Retrieves a single address by ID for a customer from production Firestore.
   */
  async getAddressById(
    addressId: string,
    customerId: string,
    timeoutMs = 8000,
    legacySassId?: string
  ): Promise<Address | null> {
    if (readerOverride?.getAddressById) {
      if (legacySassId) {
        return readerOverride.getAddressById(addressId, customerId, legacySassId);
      }
      return readerOverride.getAddressById(addressId, customerId);
    }

    const cleanCustomerId = (customerId || "").trim();
    const cleanAddressId = (addressId || "").trim();
    if (!cleanCustomerId || !cleanAddressId) return null;

    const validCustomerId = this.assertValidCustomer(cleanCustomerId);
    const cleanLegacySassId =
      typeof legacySassId === "string" && legacySassId.trim()
        ? legacySassId.trim()
        : undefined;

    const db = getProductionFirestoreInstance();
    const primaryCol = validCustomerId.toUpperCase().startsWith("ONCUS")
      ? "onlineCustomers"
      : "users";

    const userRef = doc(db, primaryCol, validCustomerId);
    const addressRef = doc(db, primaryCol, validCustomerId, "addresses", cleanAddressId);

    const [userRes, addrRes] = await Promise.allSettled([
      withTimeout(getDoc(userRef), timeoutMs, `getDoc(${primaryCol}/${validCustomerId})`),
      withTimeout(
        getDoc(addressRef),
        timeoutMs,
        `getDoc(${primaryCol}/${validCustomerId}/addresses/${cleanAddressId})`
      ),
    ]);

    let targetSnap = addrRes.status === "fulfilled" && addrRes.value.exists() ? addrRes.value : null;
    let primaryAddressId: string | null = null;
    if (userRes.status === "fulfilled" && userRes.value.exists()) {
      const uData = userRes.value.data();
      if (typeof uData?.["primaryAddressId"] === "string" && uData["primaryAddressId"].trim()) {
        primaryAddressId = uData["primaryAddressId"].trim();
      }
    }

    // Dual-path fallback: if not found in primary and cleanLegacySassId exists
    if (!targetSnap && primaryCol === "onlineCustomers" && cleanLegacySassId) {
      try {
        const legacyUserRef = doc(db, "users", cleanLegacySassId);
        const legacyAddrRef = doc(db, "users", cleanLegacySassId, "addresses", cleanAddressId);
        const [legacyUserRes, legacyAddrRes] = await Promise.allSettled([
          withTimeout(getDoc(legacyUserRef), timeoutMs, `getDoc(users/${cleanLegacySassId})`),
          withTimeout(
            getDoc(legacyAddrRef),
            timeoutMs,
            `getDoc(users/${cleanLegacySassId}/addresses/${cleanAddressId})`
          ),
        ]);
        if (legacyAddrRes.status === "fulfilled" && legacyAddrRes.value.exists()) {
          targetSnap = legacyAddrRes.value;
          if (legacyUserRes.status === "fulfilled" && legacyUserRes.value.exists()) {
            const uData = legacyUserRes.value.data();
            if (typeof uData?.["primaryAddressId"] === "string" && uData["primaryAddressId"].trim()) {
              primaryAddressId = uData["primaryAddressId"].trim();
            }
          }
        }
      } catch (err) {
        console.warn(
          `[ProductionAddressReader] Warning querying fallback users/${cleanLegacySassId}/addresses/${cleanAddressId}:`,
          err
        );
      }
    }

    if (!targetSnap) {
      if (addrRes.status === "rejected") {
        const err = addrRes.reason;
        const category = classifyStorageError(err);
        const msg = err instanceof Error ? err.message : String(err);
        throw new StorageAdapterError(
          `Failed to retrieve address ${cleanAddressId} for customer ${validCustomerId}: ${msg}`,
          {
            status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
            code: category === "permission" ? "permission-denied" : "unavailable",
            category,
            causeError: err,
          }
        );
      }
      return null;
    }

    return normalizeLegacyAddressDocument(
      targetSnap.id,
      targetSnap.data() as Record<string, unknown>,
      validCustomerId,
      primaryAddressId
    );
  },
};

