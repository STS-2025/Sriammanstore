import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import {
  PRODUCTION_AUTH_APP_NAME,
} from "./authAdapter";
import {
  getProductionFirebaseConfig,
  validateProductionPreviewConfig,
} from "./productionPreviewService";
import {
  reconcileCustomerOrders,
  normalizeLegacyOrder,
  isPosOrNonRetailOrder,
} from "./legacyOrderAdapter";
import { CANONICAL_CUSTOMER_ID_RE } from "./legacyCartAddressAdapter";
import {
  classifyStorageError,
  StorageAdapterError,
} from "./firestoreAdapter";
import type { Order } from "../types";

/**
 * Timeout bounding utility for production Firestore reads.
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
 * Retrieves or initializes the isolated production Firebase App instance (`sri-amman-prod-auth-isolated`).
 */
export function getProductionFirestoreInstance(): Firestore {
  const existingApps = getApps();
  let app: FirebaseApp | undefined = existingApps.find(
    (a) => a.name === PRODUCTION_AUTH_APP_NAME
  );

  if (!app) {
    const config = getProductionFirebaseConfig();
    const validation = validateProductionPreviewConfig(config);
    if (!validation.valid) {
      throw new Error(
        `CONFIGURATION SAFETY ERROR:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`
      );
    }
    const sdkOptions: Record<string, string> = {
      projectId: config.projectId,
      authDomain: config.authDomain,
      messagingSenderId: config.messagingSenderId,
      apiKey: config.apiKey,
    };
    if (config.storageBucket) sdkOptions["storageBucket"] = config.storageBucket;
    if (config.appId) sdkOptions["appId"] = config.appId;

    app = initializeApp(sdkOptions, PRODUCTION_AUTH_APP_NAME);
  }

  return getFirestore(app);
}

export type ProductionOrderReaderOverride = {
  getCustomerOrders?: (
    customerId: string,
    authUserUid?: string,
    legacySassId?: string
  ) => Promise<Order[]>;
  getOrderById?: (
    orderId: string,
    customerId: string,
    authUserUid?: string,
    legacySassId?: string
  ) => Promise<Order | null>;
};

let readerOverride: ProductionOrderReaderOverride | null = null;

/**
 * Test utility to override the production order reader with mock implementations.
 */
export function setProductionOrderReaderOverride(
  override: ProductionOrderReaderOverride | null
): void {
  readerOverride = override;
}

export const productionOrderReader = {
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
   * Reads all orders for an authenticated customer from production Firestore (`sri-amman-smart-store`).
   * Queries both the customer subcollection (`onlineCustomers/{ID}/orders` or `users/{ID}/orders`) and top-level `orders`
   * scoped strictly to the customer's identity. Supports legacy SASS ID fallback queries. Reconciles duplicates.
   */
  async getCustomerOrders(
    customerId: string,
    authUserUid?: string,
    timeoutMs = 8000,
    legacySassId?: string
  ): Promise<Order[]> {
    if (readerOverride?.getCustomerOrders) {
      if (legacySassId) {
        return readerOverride.getCustomerOrders(customerId, authUserUid, legacySassId);
      }
      return readerOverride.getCustomerOrders(customerId, authUserUid);
    }

    const cleanCustomerId = this.assertValidCustomer(customerId);
    const cleanAuthUid = typeof authUserUid === "string" ? authUserUid.trim() : "";
    const cleanLegacySassId =
      typeof legacySassId === "string" && legacySassId.trim()
        ? legacySassId.trim()
        : undefined;

    const db = getProductionFirestoreInstance();
    const primaryCol = cleanCustomerId.toUpperCase().startsWith("ONCUS")
      ? "onlineCustomers"
      : "users";

    // 1. Fetch from customer subcollection
    let nestedOrders: Record<string, unknown>[] = [];
    let subcollectionError: unknown = null;

    try {
      const subColRef = collection(db, primaryCol, cleanCustomerId, "orders");
      const subSnap = await withTimeout(
        getDocs(query(subColRef)),
        timeoutMs,
        `getDocs(${primaryCol}/${cleanCustomerId}/orders)`
      );
      nestedOrders = subSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
    } catch (err) {
      subcollectionError = err;
      console.error(
        `[ProductionOrderReader] Error querying ${primaryCol}/${cleanCustomerId}/orders:`,
        err
      );
    }

    // Dual-path fallback: if onlineCustomers had no orders and legacySassId is available
    if (nestedOrders.length === 0 && primaryCol === "onlineCustomers" && cleanLegacySassId) {
      try {
        const legacySubColRef = collection(db, "users", cleanLegacySassId, "orders");
        const legacySubSnap = await withTimeout(
          getDocs(query(legacySubColRef)),
          timeoutMs,
          `getDocs(users/${cleanLegacySassId}/orders)`
        );
        nestedOrders = legacySubSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
      } catch (err) {
        console.warn(
          `[ProductionOrderReader] Warning querying fallback users/${cleanLegacySassId}/orders:`,
          err
        );
      }
    }

    // 2. Fetch from top-level orders scoped strictly to this customer
    const topColRef = collection(db, "orders");
    const topLevelQueries = [
      withTimeout(
        getDocs(query(topColRef, where("userId", "==", cleanCustomerId))),
        timeoutMs,
        "query(orders where userId == customerId)"
      ),
      withTimeout(
        getDocs(query(topColRef, where("buyerId", "==", cleanCustomerId))),
        timeoutMs,
        "query(orders where buyerId == customerId)"
      ),
    ];

    if (cleanLegacySassId) {
      topLevelQueries.push(
        withTimeout(
          getDocs(query(topColRef, where("userId", "==", cleanLegacySassId))),
          timeoutMs,
          "query(orders where userId == legacySassId)"
        )
      );
      topLevelQueries.push(
        withTimeout(
          getDocs(query(topColRef, where("buyerId", "==", cleanLegacySassId))),
          timeoutMs,
          "query(orders where buyerId == legacySassId)"
        )
      );
    }

    if (cleanAuthUid) {
      topLevelQueries.push(
        withTimeout(
          getDocs(query(topColRef, where("userProfile.uid", "==", cleanAuthUid))),
          timeoutMs,
          "query(orders where userProfile.uid == uid)"
        )
      );
      topLevelQueries.push(
        withTimeout(
          getDocs(query(topColRef, where("buyerUid", "==", cleanAuthUid))),
          timeoutMs,
          "query(orders where buyerUid == uid)"
        )
      );
    }

    const topResults = await Promise.allSettled(topLevelQueries);
    const topLevelOrders: Record<string, unknown>[] = [];
    const seenTopDocIds = new Set<string>();
    let topQueryFailureCount = 0;

    for (const res of topResults) {
      if (res.status === "fulfilled") {
        res.value.docs.forEach((d) => {
          if (!seenTopDocIds.has(d.id)) {
            seenTopDocIds.add(d.id);
            topLevelOrders.push({
              id: d.id,
              ...d.data(),
            });
          }
        });
      } else {
        topQueryFailureCount++;
        console.warn(
          "[ProductionOrderReader] Top-level orders query warning:",
          res.reason?.message || res.reason
        );
      }
    }

    // If both subcollection and all top-level queries failed, rethrow classified error
    if (subcollectionError && topLevelOrders.length === 0 && topQueryFailureCount === topLevelQueries.length) {
      const category = classifyStorageError(subcollectionError);
      const msg =
        subcollectionError instanceof Error
          ? subcollectionError.message
          : "Failed to read customer orders from production Firestore";
      throw new StorageAdapterError(
        `Failed to retrieve customer orders for ${cleanCustomerId}: ${msg}`,
        {
          status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
          code: category === "permission" ? "permission-denied" : "unavailable",
          category,
          causeError: subcollectionError,
        }
      );
    }

    // 3. Reconcile customer orders according to verified business rules
    return reconcileCustomerOrders({
      nestedOrders,
      topLevelOrders,
      userId: cleanCustomerId,
      ...(cleanLegacySassId ? { legacySassId: cleanLegacySassId } : {}),
    });
  },

  /**
   * Retrieves a single order by ID from production Firestore after strictly verifying customer ownership.
   */
  async getOrderById(
    orderId: string,
    customerId: string,
    authUserUid?: string,
    timeoutMs = 8000,
    legacySassId?: string
  ): Promise<Order | null> {
    if (readerOverride?.getOrderById) {
      if (legacySassId) {
        return readerOverride.getOrderById(orderId, customerId, authUserUid, legacySassId);
      }
      return readerOverride.getOrderById(orderId, customerId, authUserUid);
    }

    const cleanCustomerId = this.assertValidCustomer(customerId);
    const cleanLegacySassId =
      typeof legacySassId === "string" && legacySassId.trim()
        ? legacySassId.trim()
        : undefined;
    const cleanOrderId = (orderId || "").trim();
    if (!cleanOrderId) return null;

    const cleanAuthUid = typeof authUserUid === "string" ? authUserUid.trim() : "";
    const db = getProductionFirestoreInstance();
    const primaryCol = cleanCustomerId.toUpperCase().startsWith("ONCUS")
      ? "onlineCustomers"
      : "users";

    // 1. Direct doc lookup in customer subcollection
    let nestedDoc: Record<string, unknown> | null = null;
    try {
      const nestedRef = doc(db, primaryCol, cleanCustomerId, "orders", cleanOrderId);
      const snap = await withTimeout(
        getDoc(nestedRef),
        timeoutMs,
        `getDoc(${primaryCol}/${cleanCustomerId}/orders/${cleanOrderId})`
      );
      if (snap.exists()) {
        nestedDoc = { id: snap.id, ...snap.data() };
      }
    } catch {
      nestedDoc = null;
    }

    // If not found by doc ID in subcollection, query by orderId field
    if (!nestedDoc) {
      try {
        const subColRef = collection(db, primaryCol, cleanCustomerId, "orders");
        const querySnap = await withTimeout(
          getDocs(query(subColRef, where("orderId", "==", cleanOrderId))),
          timeoutMs,
          `query(${primaryCol}/${cleanCustomerId}/orders orderId == ${cleanOrderId})`
        );
        if (!querySnap.empty && querySnap.docs[0]) {
          nestedDoc = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() };
        }
      } catch {
        nestedDoc = null;
      }
    }

    // Dual-path fallback: check users/{legacySassId}/orders if not found
    if (!nestedDoc && primaryCol === "onlineCustomers" && cleanLegacySassId) {
      try {
        const legacyNestedRef = doc(db, "users", cleanLegacySassId, "orders", cleanOrderId);
        const snap = await withTimeout(
          getDoc(legacyNestedRef),
          timeoutMs,
          `getDoc(users/${cleanLegacySassId}/orders/${cleanOrderId})`
        );
        if (snap.exists()) {
          nestedDoc = { id: snap.id, ...snap.data() };
        }
      } catch {
        nestedDoc = null;
      }
      if (!nestedDoc) {
        try {
          const legacySubColRef = collection(db, "users", cleanLegacySassId, "orders");
          const querySnap = await withTimeout(
            getDocs(query(legacySubColRef, where("orderId", "==", cleanOrderId))),
            timeoutMs,
            `query(users/${cleanLegacySassId}/orders orderId == ${cleanOrderId})`
          );
          if (!querySnap.empty && querySnap.docs[0]) {
            nestedDoc = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() };
          }
        } catch {
          nestedDoc = null;
        }
      }
    }

    // 2. Direct doc lookup in top-level orders
    let topDoc: Record<string, unknown> | null = null;
    try {
      const topRef = doc(db, "orders", cleanOrderId);
      const snap = await withTimeout(
        getDoc(topRef),
        timeoutMs,
        `getDoc(orders/${cleanOrderId})`
      );
      if (snap.exists()) {
        topDoc = { id: snap.id, ...snap.data() };
      }
    } catch {
      topDoc = null;
    }

    // If not found by doc ID in top-level, query by orderId field
    if (!topDoc) {
      try {
        const topColRef = collection(db, "orders");
        const querySnap = await withTimeout(
          getDocs(query(topColRef, where("orderId", "==", cleanOrderId))),
          timeoutMs,
          `query(orders orderId == ${cleanOrderId})`
        );
        if (!querySnap.empty && querySnap.docs[0]) {
          topDoc = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() };
        }
      } catch {
        topDoc = null;
      }
    }

    // Strictly verify customer ownership for top-level document
    if (topDoc) {
      if (isPosOrNonRetailOrder(topDoc)) {
        return null;
      }

      const topOwner = String(
        topDoc["userId"] ||
          topDoc["buyerId"] ||
          (topDoc["userProfile"] as any)?.userId ||
          ""
      ).trim();

      const topUid = String(
        topDoc["buyerUid"] ||
          (topDoc["userProfile"] as any)?.uid ||
          ""
      ).trim();

      const isAuthorized =
        (topOwner && (topOwner === cleanCustomerId || Boolean(cleanLegacySassId && topOwner === cleanLegacySassId))) ||
        (cleanAuthUid && topUid && topUid === cleanAuthUid);

      if (!isAuthorized && (topOwner || topUid)) {
        throw new StorageAdapterError(
          "Access denied: You cannot view another customer's order.",
          {
            status: 403,
            code: "permission-denied",
            category: "permission",
          }
        );
      }
    }

    if (!nestedDoc && !topDoc) {
      return null;
    }

    const reconciled = reconcileCustomerOrders({
      nestedOrders: nestedDoc ? [nestedDoc] : [],
      topLevelOrders: topDoc ? [topDoc] : [],
      userId: cleanCustomerId,
      ...(cleanLegacySassId ? { legacySassId: cleanLegacySassId } : {}),
    });

    const firstOrder = reconciled[0];
    return firstOrder ?? null;
  },
};

