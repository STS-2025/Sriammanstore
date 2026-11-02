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
import type {
  NotificationItem,
  NotificationCategory,
  NotificationEventType,
  OrderStatus,
} from "../types";

/**
 * Timeout bounding utility for production Firestore notification reads.
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
 * Normalizes an arbitrary legacy notification document from production Firestore
 * (`users/{SASS_ID}/notifications/{docId}` or `onlineCustomers/{ONCUS_ID}/notifications/{docId}`)
 * into the standard frontend `NotificationItem` domain model.
 */
export function normalizeLegacyNotificationDocument(
  docId: string,
  docData: Record<string, unknown>,
  userId: string
): NotificationItem | null {
  // 1. Skip deleted notifications (soft delete in legacy Firestore)
  if (docData["deleted"] === true || docData["isDeleted"] === true) {
    return null;
  }

  // 2. Resolve ID
  const id = String(docData["id"] || docId || "").trim();
  if (!id) return null;

  // 3. Resolve Title and Message (handle title vs subject vs heading, message vs body vs content)
  const title = String(
    docData["title"] || docData["subject"] || docData["heading"] || "Store Update"
  ).trim();
  const message = String(
    docData["message"] ||
      docData["body"] ||
      docData["content"] ||
      docData["text"] ||
      ""
  ).trim();

  // 4. Resolve Read status
  const read = Boolean(docData["read"] ?? docData["isRead"] ?? false);

  // 5. Resolve Optional fields: orderId, badge, actionUrl, status transitions
  const orderId =
    typeof docData["orderId"] === "string" && docData["orderId"].trim()
      ? docData["orderId"].trim()
      : undefined;

  let actionUrl =
    typeof docData["actionUrl"] === "string" && docData["actionUrl"].trim()
      ? docData["actionUrl"].trim()
      : undefined;
  if (!actionUrl && orderId) {
    actionUrl = `/orders?id=${orderId}`;
  }

  const badge =
    typeof docData["badge"] === "string" && docData["badge"].trim()
      ? docData["badge"].trim()
      : undefined;

  const ctaText =
    typeof docData["ctaText"] === "string" && docData["ctaText"].trim()
      ? docData["ctaText"].trim()
      : actionUrl
      ? "View Details →"
      : undefined;

  const previousStatus =
    typeof docData["previousStatus"] === "string"
      ? (docData["previousStatus"] as OrderStatus)
      : undefined;

  const newStatus =
    typeof docData["newStatus"] === "string"
      ? (docData["newStatus"] as OrderStatus)
      : undefined;

  const driverName =
    typeof docData["driverName"] === "string" ? docData["driverName"] : undefined;
  const driverVehicle =
    typeof docData["driverVehicle"] === "string" ? docData["driverVehicle"] : undefined;

  // 6. Category and Type resolution
  const rawType = String(docData["type"] || "").trim().toLowerCase();
  const rawCategory = String(docData["category"] || "").trim().toLowerCase();

  let category: NotificationCategory = "account";
  if (
    rawCategory === "orders" ||
    rawCategory === "offers" ||
    rawCategory === "account" ||
    rawCategory === "rewards" ||
    rawCategory === "harvest"
  ) {
    category = rawCategory as NotificationCategory;
  } else if (orderId || rawType.startsWith("order")) {
    category = "orders";
  } else if (
    rawType.includes("reward") ||
    rawType.includes("coin") ||
    rawType.includes("vip")
  ) {
    category = "rewards";
  } else if (
    rawType.includes("harvest") ||
    rawType.includes("stock") ||
    rawType.includes("offer")
  ) {
    category = "harvest";
  }

  let type: NotificationEventType = "system";
  if (
    rawType === "order_created" ||
    rawType === "order_status_changed" ||
    rawType === "reward_credited" ||
    rawType === "harvest_alert" ||
    rawType === "system"
  ) {
    type = rawType as NotificationEventType;
  } else if (category === "orders") {
    type = newStatus ? "order_status_changed" : "order_created";
  } else if (category === "rewards") {
    type = "reward_credited";
  } else if (category === "harvest") {
    type = "harvest_alert";
  }

  // 7. EventKey (for deduplication)
  const eventKey =
    typeof docData["eventKey"] === "string" && docData["eventKey"].trim()
      ? docData["eventKey"].trim()
      : `notif_${id}`;

  // 8. Timestamp
  let timestamp = new Date().toISOString();
  const rawTimestamp =
    docData["timestamp"] ?? docData["createdAt"] ?? docData["date"];
  if (rawTimestamp && typeof (rawTimestamp as any).toDate === "function") {
    timestamp = (rawTimestamp as any).toDate().toISOString();
  } else if (
    rawTimestamp &&
    typeof (rawTimestamp as any).seconds === "number"
  ) {
    timestamp = new Date((rawTimestamp as any).seconds * 1000).toISOString();
  } else if (typeof rawTimestamp === "string" && rawTimestamp.trim()) {
    const parsed = new Date(rawTimestamp.trim());
    if (!Number.isNaN(parsed.getTime())) {
      timestamp = parsed.toISOString();
    }
  }

  return {
    id,
    userId,
    category,
    type,
    eventKey,
    title,
    message,
    timestamp,
    read,
    ...(actionUrl ? { actionUrl } : {}),
    ...(badge ? { badge } : {}),
    ...(orderId ? { orderId } : {}),
    ...(previousStatus ? { previousStatus } : {}),
    ...(newStatus ? { newStatus } : {}),
    ...(driverName ? { driverName } : {}),
    ...(driverVehicle ? { driverVehicle } : {}),
    ...(ctaText ? { ctaText } : {}),
  };
}

export type ProductionNotificationReaderOverride = {
  getCustomerNotifications?: (
    customerId: string,
    legacySassId?: string
  ) => Promise<NotificationItem[]>;
};

let readerOverride: ProductionNotificationReaderOverride | null = null;

export function setProductionNotificationReaderOverride(
  override: ProductionNotificationReaderOverride | null
): void {
  readerOverride = override;
}

export const productionNotificationReader = {
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
   * Reads all notifications for an authenticated customer directly from production Firestore
   * (`onlineCustomers/{ID}/notifications` or `users/{ID}/notifications`).
   * Deduplicates by eventKey / ID and sorts descending by timestamp.
   * If customer has an ONCUS ID and legacy SASS ID, falls back to legacy notifications if online subcollection is empty.
   */
  async getCustomerNotifications(
    customerId?: string,
    timeoutMs = 8000,
    legacySassId?: string
  ): Promise<NotificationItem[]> {
    if (readerOverride?.getCustomerNotifications) {
      if (legacySassId) {
        return readerOverride.getCustomerNotifications(
          customerId || "",
          legacySassId
        );
      }
      return readerOverride.getCustomerNotifications(customerId || "");
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

    const notifsColRef = collection(db, primaryCol, validCustomerId, "notifications");

    try {
      let snap = await withTimeout(
        getDocs(query(notifsColRef)),
        timeoutMs,
        `getDocs(${primaryCol}/${validCustomerId}/notifications)`
      );

      // Dual-path fallback: if empty in onlineCustomers and legacySassId is available
      if (snap.empty && primaryCol === "onlineCustomers" && cleanLegacySassId) {
        try {
          const fallbackSnap = await withTimeout(
            getDocs(
              query(collection(db, "users", cleanLegacySassId, "notifications"))
            ),
            timeoutMs,
            `getDocs(users/${cleanLegacySassId}/notifications)`
          );
          if (!fallbackSnap.empty) {
            snap = fallbackSnap;
          }
        } catch (err) {
          console.warn(
            `[ProductionNotificationReader] Warning querying fallback notifications for ${cleanLegacySassId}:`,
            err
          );
        }
      }

      const list: NotificationItem[] = [];
      const seenKeys = new Set<string>();

      for (const docSnap of snap.docs) {
        const item = normalizeLegacyNotificationDocument(
          docSnap.id,
          docSnap.data() as Record<string, unknown>,
          validCustomerId
        );
        if (!item) continue;

        const dedupeKey = item.eventKey || item.id;
        if (seenKeys.has(dedupeKey)) continue;
        seenKeys.add(dedupeKey);
        list.push(item);
      }

      // Sort descending by timestamp
      list.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return list;
    } catch (err: unknown) {
      console.error(
        `[ProductionNotificationReader] Error querying ${primaryCol}/${validCustomerId}/notifications:`,
        err
      );
      const category = classifyStorageError(err);
      const msg = err instanceof Error ? err.message : String(err);
      throw new StorageAdapterError(
        `Failed to retrieve notifications for customer ${validCustomerId}: ${msg}`,
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

