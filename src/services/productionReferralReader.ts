import {
  collection,
  getDocs,
  query,
} from "firebase/firestore";
import { getProductionFirestoreInstance } from "./productionOrderReader";
import { CANONICAL_CUSTOMER_ID_RE } from "./legacyCartAddressAdapter";
import {
  classifyStorageError,
  StorageAdapterError,
} from "./firestoreAdapter";
import type { ReferralFriend } from "../types";

/**
 * Timeout bounding utility for production Firestore referral reads.
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
 * Normalizes an arbitrary legacy referral document from production Firestore
 * (`users/{SASS_ID}/refferals/{docId}` or `refer and earn/{docId}`)
 * into the standard frontend `ReferralFriend` domain model.
 */
export function normalizeLegacyReferralDocument(
  docId: string,
  docData: Record<string, unknown>,
  userId: string
): ReferralFriend {
  const id = String(docData["id"] || docId || "").trim();

  // Friend name resolution
  let friendName = "";
  if (typeof docData["friendName"] === "string" && docData["friendName"].trim()) {
    friendName = docData["friendName"].trim();
  } else if (typeof docData["name"] === "string" && docData["name"].trim()) {
    friendName = docData["name"].trim();
  } else if (typeof docData["buyerName"] === "string" && docData["buyerName"].trim()) {
    friendName = docData["buyerName"].trim();
  } else if (
    typeof docData["userId"] === "string" &&
    docData["userId"].trim() &&
    docData["userId"].trim() !== userId
  ) {
    friendName = `Customer (${docData["userId"].trim()})`;
  } else if (
    docId &&
    docId !== userId &&
    (docId.startsWith("SASS") || docId.startsWith("ONCUS"))
  ) {
    friendName = `Customer (${docId})`;
  } else {
    friendName = "Referred Friend";
  }

  // Masked phone resolution
  let phoneMasked = "—";
  const rawPhone = String(
    docData["phoneMasked"] || docData["phone"] || docData["number"] || ""
  ).trim();
  if (rawPhone) {
    if (rawPhone.includes("*")) {
      phoneMasked = rawPhone;
    } else {
      const cleanDigits = rawPhone.replace(/\D/g, "");
      if (cleanDigits.length >= 10) {
        phoneMasked = `+91 ${cleanDigits.slice(0, 2)}*****`;
      } else {
        phoneMasked = rawPhone;
      }
    }
  }

  // Reward coins & Status
  const rawCoins = Number(
    docData["rewardCoins"] ?? docData["amount"] ?? docData["coins"] ?? 0
  );
  const rewardCoins = Math.max(0, Number.isFinite(rawCoins) ? rawCoins : 0);

  let status = "Signed Up (Order Pending)";
  if (typeof docData["status"] === "string" && docData["status"].trim()) {
    status = docData["status"].trim();
  } else if (rewardCoins > 0) {
    status = "Completed First Order";
  }

  // Date
  let date = new Date().toISOString().split("T")[0]!;
  const rawDate =
    docData["date"] ??
    docData["referredAt"] ??
    docData["createdAt"] ??
    docData["timestamp"];
  if (rawDate && typeof (rawDate as any).toDate === "function") {
    date = (rawDate as any).toDate().toISOString().split("T")[0]!;
  } else if (rawDate && typeof (rawDate as any).seconds === "number") {
    date = new Date((rawDate as any).seconds * 1000).toISOString().split("T")[0]!;
  } else if (typeof rawDate === "string" && rawDate.trim()) {
    const parsed = new Date(rawDate.trim());
    if (!Number.isNaN(parsed.getTime())) {
      date = parsed.toISOString().split("T")[0]!;
    } else {
      date = rawDate.trim();
    }
  }

  return {
    id,
    userId,
    friendName,
    phoneMasked,
    status,
    rewardCoins,
    date,
  };
}

export type ProductionReferralReaderOverride = {
  getCustomerReferrals?: (
    customerId: string,
    legacySassId?: string
  ) => Promise<ReferralFriend[]>;
};

let readerOverride: ProductionReferralReaderOverride | null = null;

export function setProductionReferralReaderOverride(
  override: ProductionReferralReaderOverride | null
): void {
  readerOverride = override;
}

export const productionReferralReader = {
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
   * Reads all referrals for an authenticated customer directly from production Firestore
   * (`onlineCustomers/{ID}/refferals` or `users/{ID}/refferals`).
   * Deduplicates by referral ID and sorts descending by date.
   * If customer has an ONCUS ID and legacy SASS ID, falls back to legacy referrals if online subcollection is empty.
   */
  async getCustomerReferrals(
    customerId?: string,
    timeoutMs = 8000,
    legacySassId?: string
  ): Promise<ReferralFriend[]> {
    if (readerOverride?.getCustomerReferrals) {
      if (legacySassId) {
        return readerOverride.getCustomerReferrals(
          customerId || "",
          legacySassId
        );
      }
      return readerOverride.getCustomerReferrals(customerId || "");
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
      // 1. Query primary subcollection `refferals` (spelled with two 'f's as in legacy schema)
      let snap = await withTimeout(
        getDocs(query(collection(db, primaryCol, validCustomerId, "refferals"))),
        timeoutMs,
        `getDocs(${primaryCol}/${validCustomerId}/refferals)`
      );

      // 2. If empty in `refferals`, also check `referrals` (correct spelling)
      if (snap.empty) {
        try {
          const altSnap = await withTimeout(
            getDocs(query(collection(db, primaryCol, validCustomerId, "referrals"))),
            timeoutMs,
            `getDocs(${primaryCol}/${validCustomerId}/referrals)`
          );
          if (!altSnap.empty) {
            snap = altSnap;
          }
        } catch {
          // Keep primary snap result if alt collection query fails
        }
      }

      // 3. Fallback for migrated customers to legacy SASS doc:
      if (snap.empty && primaryCol === "onlineCustomers" && cleanLegacySassId) {
        try {
          const fallbackSnap = await withTimeout(
            getDocs(query(collection(db, "users", cleanLegacySassId, "refferals"))),
            timeoutMs,
            `getDocs(users/${cleanLegacySassId}/refferals)`
          );
          if (!fallbackSnap.empty) {
            snap = fallbackSnap;
          } else {
            const fallbackAlt = await withTimeout(
              getDocs(query(collection(db, "users", cleanLegacySassId, "referrals"))),
              timeoutMs,
              `getDocs(users/${cleanLegacySassId}/referrals)`
            );
            if (!fallbackAlt.empty) {
              snap = fallbackAlt;
            }
          }
        } catch (err) {
          console.warn(
            `[ProductionReferralReader] Warning querying fallback referrals for ${cleanLegacySassId}:`,
            err
          );
        }
      }

      const list: ReferralFriend[] = [];
      const seenIds = new Set<string>();

      for (const docSnap of snap.docs) {
        const item = normalizeLegacyReferralDocument(
          docSnap.id,
          docSnap.data() as Record<string, unknown>,
          validCustomerId
        );
        if (seenIds.has(item.id)) continue;
        seenIds.add(item.id);
        list.push(item);
      }

      // Sort descending by date
      list.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return list;
    } catch (err: unknown) {
      console.error(
        `[ProductionReferralReader] Error querying referrals for ${validCustomerId}:`,
        err
      );
      const category = classifyStorageError(err);
      const msg = err instanceof Error ? err.message : String(err);
      throw new StorageAdapterError(
        `Failed to retrieve referrals for customer ${validCustomerId}: ${msg}`,
        {
          status:
            category === "permission"
              ? 403
              : category === "connectivity"
              ? 503
              : 500,
          code: category === "permission" ? "permission-denied" : "unavailable",
          category,
          causeError: err,
        }
      );
    }
  },
};

