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
import type { CoinTransaction } from "../types";

/**
 * Timeout bounding utility for production Firestore coin operations.
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
 * Normalizes an arbitrary legacy coinsHistory document (`users/{SASS_ID}/coinsHistory/{docId}`)
 * into the standard frontend `CoinTransaction` domain object.
 */
export function normalizeLegacyCoinTransaction(
  docId: string,
  docData: Record<string, unknown>,
  userId: string
): CoinTransaction {
  // 1. Transaction ID
  const id = String(docData["id"] || docId || "").trim();

  // 2. Amount: convert to positive number
  const rawAmount = Number(docData["amount"] ?? 0);
  const amount = Math.abs(Number.isFinite(rawAmount) ? rawAmount : 0);

  // 3. Transaction type: determine 'earned' vs 'redeemed'
  const rawType = String(docData["type"] || "").trim().toLowerCase();
  const rawStatus = String(docData["status"] || "").trim().toLowerCase();

  let type: "earned" | "redeemed" = "earned";
  if (
    rawType === "redeemed" ||
    rawType === "debit" ||
    rawType === "used" ||
    rawStatus === "redeemed" ||
    rawAmount < 0
  ) {
    type = "redeemed";
  }

  // 4. Order ID
  const orderIdVal = String(docData["orderId"] || "").trim();
  const orderId =
    orderIdVal ||
    (docId.startsWith("ord_") || docId.startsWith("order_")
      ? docId.replace(/_ref$/, "")
      : undefined);

  // 5. Description: honest description from legacy fields without fabricating false information
  let description = "";
  if (typeof docData["description"] === "string" && docData["description"].trim()) {
    description = docData["description"].trim();
  } else if (rawType === "referral") {
    const buyer =
      typeof docData["buyerName"] === "string" && docData["buyerName"].trim()
        ? docData["buyerName"].trim()
        : "";
    description = buyer ? `Referral reward from ${buyer}` : "Referral coin reward";
  } else if (type === "redeemed") {
    description = orderId ? `Redeemed on Order #${orderId}` : "Smart Coins redeemed";
  } else {
    description = orderId ? `Coins earned on Order #${orderId}` : "Smart Coins earned";
  }

  if (rawStatus === "pending") {
    description += " (Pending delivery)";
  } else if (rawStatus === "cancelled") {
    description += " (Order cancelled)";
  }

  // 6. Timestamp: handle Firestore Timestamp ({ toDate, seconds }) or ISO string
  let timestamp = new Date().toISOString();
  const rawCreatedAt = docData["createdAt"] ?? docData["timestamp"] ?? docData["releasedAt"];
  if (rawCreatedAt && typeof (rawCreatedAt as any).toDate === "function") {
    timestamp = (rawCreatedAt as any).toDate().toISOString();
  } else if (rawCreatedAt && typeof (rawCreatedAt as any).seconds === "number") {
    timestamp = new Date((rawCreatedAt as any).seconds * 1000).toISOString();
  } else if (typeof rawCreatedAt === "string" && rawCreatedAt.trim()) {
    const d = new Date(rawCreatedAt.trim());
    if (!Number.isNaN(d.getTime())) {
      timestamp = d.toISOString();
    }
  }

  const rawExpiry = docData["expiresAt"];
  let expiresAt: string | undefined;
  if (rawExpiry && typeof (rawExpiry as any).toDate === "function") {
    expiresAt = (rawExpiry as any).toDate().toISOString();
  } else if (rawExpiry && typeof (rawExpiry as any).seconds === "number") {
    expiresAt = new Date((rawExpiry as any).seconds * 1000).toISOString();
  } else if (typeof rawExpiry === "string" && !Number.isNaN(new Date(rawExpiry).getTime())) {
    expiresAt = new Date(rawExpiry).toISOString();
  }

  return {
    id,
    userId,
    ...(orderId ? { orderId } : {}),
    amount,
    type,
    description,
    timestamp,
    ...(expiresAt ? { expiresAt } : {}),
  };
}

export type ProductionCoinReaderOverride = {
  getCustomerCoinBalance?: (
    customerId: string,
    legacySassId?: string
  ) => Promise<number>;
  getCustomerCoinHistory?: (
    customerId: string,
    legacySassId?: string
  ) => Promise<CoinTransaction[]>;
};

let readerOverride: ProductionCoinReaderOverride | null = null;

/**
 * Test utility to override the production coin reader with mock implementations.
 */
export function setProductionCoinReaderOverride(
  override: ProductionCoinReaderOverride | null
): void {
  readerOverride = override;
}

export const productionCoinReader = {
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
   * Reads the authoritative Smart Coins balance for an authenticated customer directly from
   * production Firestore (`onlineCustomers/{ID}` or `users/{ID}`).
   * If customer has an ONCUS ID and legacy SASS ID, falls back to legacy balance if online profile does not exist.
   */
  async getCustomerCoinBalance(
    customerId?: string,
    timeoutMs = 8000,
    legacySassId?: string
  ): Promise<number> {
    if (readerOverride?.getCustomerCoinBalance) {
      if (legacySassId) {
        return readerOverride.getCustomerCoinBalance(customerId || "", legacySassId);
      }
      return readerOverride.getCustomerCoinBalance(customerId || "");
    }

    const cleanCustomerId = (customerId || "").trim();
    if (!cleanCustomerId) return 0;

    const validCustomerId = this.assertValidCustomer(cleanCustomerId);
    const cleanLegacySassId =
      typeof legacySassId === "string" && legacySassId.trim()
        ? legacySassId.trim()
        : undefined;

    const db = getProductionFirestoreInstance();
    const primaryCol = validCustomerId.toUpperCase().startsWith("ONCUS")
      ? "onlineCustomers"
      : "users";

    try {
      let snap = await withTimeout(
        getDoc(doc(db, primaryCol, validCustomerId)),
        timeoutMs,
        `getDoc(${primaryCol}/${validCustomerId})`
      );

      // Dual-path fallback: if not in onlineCustomers and legacySassId is available
      if (!snap.exists() && primaryCol === "onlineCustomers" && cleanLegacySassId) {
        try {
          snap = await withTimeout(
            getDoc(doc(db, "users", cleanLegacySassId)),
            timeoutMs,
            `getDoc(users/${cleanLegacySassId})`
          );
        } catch (err) {
          console.warn(
            `[ProductionCoinReader] Warning reading fallback users/${cleanLegacySassId} balance:`,
            err
          );
        }
      }

      if (snap.exists()) {
        const data = snap.data() as Record<string, unknown>;
        const directSmartCoins = Number(data["smartCoins"]);
        if (Number.isFinite(directSmartCoins)) return Math.max(0, directSmartCoins);

        const directCoins = Number(data["coins"]);
        if (Number.isFinite(directCoins)) return Math.max(0, directCoins);

        const availableCoins = Number(data["availableCoins"] ?? data["availableCoins32"]);
        if (Number.isFinite(availableCoins)) return Math.max(0, availableCoins);
      }
      return 0;
    } catch (err: unknown) {
      console.error(
        `[ProductionCoinReader] Error querying balance for ${primaryCol}/${validCustomerId}:`,
        err
      );
      const category = classifyStorageError(err);
      const msg = err instanceof Error ? err.message : String(err);
      throw new StorageAdapterError(
        `Failed to retrieve coin balance for customer ${validCustomerId}: ${msg}`,
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
   * Reads all coin transactions for an authenticated customer from production Firestore
   * (`onlineCustomers/{ID}/coinsHistory` or `users/{ID}/coinsHistory`).
   * Deduplicates by document ID and sorts descending by timestamp.
   * If customer has an ONCUS ID and legacy SASS ID, falls back to legacy coin history if online history is empty.
   */
  async getCustomerCoinHistory(
    customerId?: string,
    timeoutMs = 8000,
    legacySassId?: string
  ): Promise<CoinTransaction[]> {
    if (readerOverride?.getCustomerCoinHistory) {
      if (legacySassId) {
        return readerOverride.getCustomerCoinHistory(customerId || "", legacySassId);
      }
      return readerOverride.getCustomerCoinHistory(customerId || "");
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

    try {
      // 1. Primary subcollection query: onlineCustomers/{ID}/coinHistory (singular)
      let snap = await withTimeout(
        getDocs(query(collection(db, primaryCol, validCustomerId, "coinHistory"))),
        timeoutMs,
        `getDocs(${primaryCol}/${validCustomerId}/coinHistory)`
      );

      // Fallback 1: if empty in onlineCustomers, check legacy coinsHistory (plural)
      if (snap.empty) {
        try {
          const pluralSnap = await withTimeout(
            getDocs(query(collection(db, primaryCol, validCustomerId, "coinsHistory"))),
            timeoutMs,
            `getDocs(${primaryCol}/${validCustomerId}/coinsHistory)`
          );
          if (!pluralSnap.empty) {
            snap = pluralSnap;
          }
        } catch {
          // ignore
        }
      }

      // Fallback 2: if empty in onlineCustomers and legacySassId is available
      if (snap.empty && primaryCol === "onlineCustomers" && cleanLegacySassId) {
        try {
          const fallbackSnap = await withTimeout(
            getDocs(query(collection(db, "users", cleanLegacySassId, "coinsHistory"))),
            timeoutMs,
            `getDocs(users/${cleanLegacySassId}/coinsHistory)`
          );
          if (!fallbackSnap.empty) {
            snap = fallbackSnap;
          }
        } catch (err) {
          console.warn(
            `[ProductionCoinReader] Warning reading fallback users/${cleanLegacySassId}/coinsHistory:`,
            err
          );
        }
      }

      const list: CoinTransaction[] = [];
      const seenIds = new Set<string>();

      for (const docSnap of snap.docs) {
        if (seenIds.has(docSnap.id)) continue;
        seenIds.add(docSnap.id);

        const data = docSnap.data() as Record<string, unknown>;
        const normalized = normalizeLegacyCoinTransaction(
          docSnap.id,
          data,
          validCustomerId
        );
        list.push(normalized);
      }

      // Sort newest first by timestamp
      return list.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (err: unknown) {
      console.error(
        `[ProductionCoinReader] Error querying history for ${primaryCol}/${validCustomerId}:`,
        err
      );
      const category = classifyStorageError(err);
      const msg = err instanceof Error ? err.message : String(err);
      throw new StorageAdapterError(
        `Failed to retrieve coin history for customer ${validCustomerId}: ${msg}`,
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

