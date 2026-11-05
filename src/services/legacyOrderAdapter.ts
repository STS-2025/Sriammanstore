import type {
  Order,
  OrderItem,
  OrderStatus,
  OrderPricingSummary,
} from "../types";
import {
  StorageAdapterError,
  type FirestoreDriver,
} from "./firestoreAdapter";
import {
  isValidSassCustomerId,
  isValidCustomerId,
  CANONICAL_SASS_ID_RE,
  CANONICAL_CUSTOMER_ID_RE,
} from "./legacyCartAddressAdapter";
import { OFFICIAL_COIN_CONVERSION_RATE } from "./coinService";

/**
 * Validates whether an order belongs to POS/ERP/in-store operations rather
 * than retail customer e-commerce.
 */
export function isPosOrNonRetailOrder(doc: Record<string, unknown>): boolean {
  if (!doc || typeof doc !== "object") return false;

  const salesChannel = String(doc["salesChannel"] || "").toLowerCase();
  if (salesChannel === "pos") return true;

  const orderSource = String(doc["orderSource"] || "").toLowerCase();
  if (orderSource === "manual") return true;

  const customerId = String(doc["customerId"] || "");
  if (customerId.startsWith("CUS-")) return true;

  if (doc["posInvoiceNumber"] || doc["posTerminalId"]) return true;

  // In-store orders created by staff without customer buyerId/userId
  if (doc["createdByStaffId"] && !doc["buyerId"] && !doc["userId"]) {
    return true;
  }

  return false;
}

/**
 * Normalizes any legacy date representation (Firestore Timestamp, ISO string,
 * Unix millisecond/second integer, Date string) into an ISO-8601 string.
 * Falls back safely to fallbackIso if the date is missing, empty, or unparseable.
 */
export function parseLegacyDate(
  val: unknown,
  fallbackIso: string = "1970-01-01T00:00:00.000Z"
): string {
  if (val === null || val === undefined) return fallbackIso;

  // Firestore Timestamp object: { seconds, nanoseconds } or { _seconds, _nanoseconds }
  if (typeof val === "object" && val !== null) {
    const sec =
      typeof (val as any).seconds === "number"
        ? (val as any).seconds
        : typeof (val as any)._seconds === "number"
          ? (val as any)._seconds
          : undefined;
    if (typeof sec === "number" && !Number.isNaN(sec)) {
      return new Date(sec * 1000).toISOString();
    }
  }

  // Number: milliseconds (> 1e11) or seconds
  if (typeof val === "number" && !Number.isNaN(val) && Number.isFinite(val)) {
    if (val > 1e11) {
      return new Date(val).toISOString();
    }
    if (val > 0) {
      return new Date(val * 1000).toISOString();
    }
  }

  // String timestamp or ISO date
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return fallbackIso;
    const parsed = new Date(trimmed).getTime();
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }

  return fallbackIso;
}

/**
 * Normalizes legacy order status values across all known production fields:
 * `operationalStatus`, `deliveryStatus`, `dispatchStatus`, `orderStatus`,
 * `stage`, `currentStage`, `lifecycleStage`, `status`, `pickStatus`,
 * and nested `delivery.status` / `shipping.status`.
 *
 * Preserves the exact original status string in `rawStatus` so no useful legacy
 * information is discarded. Unknown statuses are flagged without silent conversion
 * into misleading states.
 */
export function normalizeLegacyOrderStatus(docOrValue: unknown): {
  status: OrderStatus;
  rawStatus: string;
  isUnknown: boolean;
} {
  let rawCandidate = "";

  if (typeof docOrValue === "string") {
    rawCandidate = docOrValue.trim();
  } else if (typeof docOrValue === "object" && docOrValue !== null) {
    const doc = docOrValue as Record<string, unknown>;

    // Order of precedence for status fields observed in legacy audit:
    const candidates = [
      doc["operationalStatus"],
      doc["deliveryStatus"],
      doc["dispatchStatus"],
      doc["orderStatus"],
      doc["currentStage"],
      doc["stage"],
      doc["lifecycleStage"],
      doc["status"],
      doc["pickStatus"],
      (doc["delivery"] as any)?.status,
      (doc["shipping"] as any)?.status,
    ];

    for (const c of candidates) {
      if (typeof c === "string" && c.trim().length > 0) {
        rawCandidate = c.trim();
        break;
      }
    }

    // Fallback: check statusHistory or timeline array if candidates are empty
    if (!rawCandidate) {
      const history = doc["statusHistory"] || doc["timeline"];
      if (Array.isArray(history) && history.length > 0) {
        const lastEntry = history[history.length - 1];
        if (typeof lastEntry === "string" && lastEntry.trim()) {
          rawCandidate = lastEntry.trim();
        } else if (typeof lastEntry === "object" && lastEntry !== null) {
          const entryStatus = (lastEntry as any).status || (lastEntry as any).stage;
          if (typeof entryStatus === "string" && entryStatus.trim()) {
            rawCandidate = entryStatus.trim();
          }
        }
      }
    }
  }

  if (!rawCandidate) {
    return {
      status: "pending",
      rawStatus: "",
      isUnknown: false,
    };
  }

  const normalized = rawCandidate
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();

  // Mapping to frontend OrderStatus union:
  // "pending" | "processing" | "packed" | "in transit" | "delivered" | "cancelled" | "returned"

  if (
    normalized === "pending" ||
    normalized === "order confirmed" ||
    normalized === "order placed" ||
    normalized === "confirmed" ||
    normalized === "placed" ||
    normalized === "created"
  ) {
    return { status: "pending", rawStatus: rawCandidate, isUnknown: false };
  }

  if (
    normalized === "processing" ||
    normalized === "packing" ||
    normalized === "preparing" ||
    normalized === "in progress"
  ) {
    return { status: "processing", rawStatus: rawCandidate, isUnknown: false };
  }

  if (
    normalized === "packed" ||
    normalized === "ready for dispatch" ||
    normalized === "bagged" ||
    normalized === "quality checked"
  ) {
    return { status: "packed", rawStatus: rawCandidate, isUnknown: false };
  }

  if (
    normalized === "in transit" ||
    normalized === "out for delivery" ||
    normalized === "dispatched" ||
    normalized === "shipped" ||
    normalized === "on the way" ||
    normalized === "picked up"
  ) {
    return { status: "in transit", rawStatus: rawCandidate, isUnknown: false };
  }

  if (normalized === "delivered" || normalized === "completed") {
    return { status: "delivered", rawStatus: rawCandidate, isUnknown: false };
  }

  if (
    normalized === "cancelled" ||
    normalized === "canceled" ||
    normalized === "rejected" ||
    normalized === "failed"
  ) {
    return { status: "cancelled", rawStatus: rawCandidate, isUnknown: false };
  }

  if (
    normalized === "returned" ||
    normalized === "refunded" ||
    normalized === "return requested"
  ) {
    return { status: "returned", rawStatus: rawCandidate, isUnknown: false };
  }

  // Unknown or unmapped legacy status:
  // Do NOT silently convert to a misleading status. Keep safe active status "pending"
  // but explicitly flag as isUnknown and preserve rawStatus.
  return {
    status: "pending",
    rawStatus: rawCandidate,
    isUnknown: true,
  };
}

/**
 * Normalizes legacy item representations into the frontend OrderItem type.
 */
export function normalizeLegacyItems(rawItems: unknown): OrderItem[] {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .filter((item) => item && typeof item === "object")
    .map((item) => {
      const it = item as Record<string, unknown>;
      const productId = String(
        it["productId"] || it["id"] || it["itemCode"] || ""
      );
      const name = String(
        it["name"] || it["productName"] || it["title"] || "Item"
      );
      const unit = String(it["unit"] || "unit");
      const unitSize = String(it["unitSize"] ?? it["packSize"] ?? it["weight"] ?? "");
      const price = Number(it["price"] ?? it["sellingPrice"] ?? it["mrp"] ?? 0);
      const quantity = Math.max(1, Number(it["quantity"] ?? it["qty"] ?? 1));

      const imageCandidates = [
        it["image"],
        it["imageUrl"],
        it["frontImageUrl"],
        it["backImageUrl"],
        ...(Array.isArray(it["imageUrls"]) ? it["imageUrls"] : []),
        ...(Array.isArray(it["images"]) ? it["images"] : []),
      ].filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim())
        .filter((value, index, values) => values.indexOf(value) === index);
      const image = imageCandidates[0] || "";

      return {
        productId,
        name,
        unit,
        unitSize,
        price,
        quantity,
        image,
        imageCandidates,
      };
    });
}

/**
 * Normalizes legacy address objects (door, street, town, pincode) into
 * the frontend deliveryAddress structure.
 */
export function normalizeLegacyAddress(doc: Record<string, unknown>): {
  houseNo: string;
  street: string;
  landmark?: string;
  city: string;
  pincode: string;
} {
  const addr =
    (doc["deliveryAddress"] as Record<string, unknown>) ||
    (doc["address"] as Record<string, unknown>) ||
    doc;

  const houseNo = String(
    addr["houseNo"] || addr["door"] || addr["doorNo"] || ""
  );
  const street = String(
    addr["street"] || addr["addressLine1"] || ""
  );
  const city = String(
    addr["city"] || addr["town"] || addr["district"] || ""
  );
  const pincode = String(
    addr["pincode"] || addr["zip"] || addr["postalCode"] || ""
  );
  const landmark = addr["landmark"] ? String(addr["landmark"]) : undefined;

  return {
    houseNo,
    street,
    ...(landmark ? { landmark } : {}),
    city,
    pincode,
  };
}

/**
 * Normalizes delivery metadata into the frontend delivery object.
 */
export function normalizeLegacyDelivery(doc: Record<string, unknown>): {
  type: "standard" | "express";
  slot: string;
  estimatedTime?: string;
  driver?: {
    name: string;
    phone: string;
    vehicle: string;
  };
} {
  const del =
    (doc["delivery"] as Record<string, unknown>) ||
    doc;

  const typeStr = String(
    del["type"] || doc["deliveryType"] || ""
  ).toLowerCase();
  const type: "standard" | "express" = typeStr.includes("express")
    ? "express"
    : "standard";

  const slot = String(
    del["slot"] ||
      doc["deliverySlot"] ||
      doc["slot"] ||
      (type === "express"
        ? "Instant 60-Min Express Dispatch"
        : "Standard Scheduled Delivery")
  );

  const estimatedTime = del["estimatedTime"]
    ? String(del["estimatedTime"])
    : doc["estimatedTime"]
      ? String(doc["estimatedTime"])
      : type === "express"
        ? "Within 60-90 minutes"
        : "Next scheduled delivery window";

  let driver: { name: string; phone: string; vehicle: string } | undefined;
  const rawDriver = (del["driver"] || doc["driver"]) as Record<string, unknown>;
  if (rawDriver && typeof rawDriver === "object") {
    driver = {
      name: String(rawDriver["name"] || ""),
      phone: String(rawDriver["phone"] || ""),
      vehicle: String(rawDriver["vehicle"] || ""),
    };
  }

  return {
    type,
    slot,
    estimatedTime,
    ...(driver ? { driver } : {}),
  };
}

/**
 * Normalizes payment metadata into the frontend payment object.
 */
export function normalizeLegacyPayment(doc: Record<string, unknown>): {
  method: "online" | "cod";
  status: string;
  transactionId?: string;
} {
  const pay =
    (doc["payment"] as Record<string, unknown>) ||
    (doc["paymentDetails"] as Record<string, unknown>) ||
    doc;

  const methodStr = String(
    pay["method"] || doc["paymentMethod"] || ""
  ).toLowerCase();

  const method: "online" | "cod" =
    /online|razorpay|card|upi|netbanking|prepaid/i.test(methodStr)
      ? "online"
      : "cod";

  const status = String(
    pay["status"] || (method === "online" ? "paid" : "pending_cod")
  );

  const transactionId =
    pay["transactionId"] || doc["transactionId"]
      ? String(pay["transactionId"] || doc["transactionId"])
      : undefined;

  return {
    method,
    status,
    ...(transactionId ? { transactionId } : {}),
  };
}

/**
 * Normalizes pricing summary values safely, calculating missing totals
 * from item line-items and known discount/fee fields.
 */
export function normalizeLegacyPricing(
  doc: Record<string, unknown>,
  items: OrderItem[]
): OrderPricingSummary {
  const ps = doc["pricingSummary"] as Record<string, unknown> | undefined;

  if (ps && typeof ps === "object") {
    return {
      subtotal: Number(ps["subtotal"] ?? 0),
      productSavings: Number(ps["productSavings"] ?? 0),
      deliveryFee: Number(ps["deliveryFee"] ?? 0),
      coinDiscount: Number(ps["coinDiscount"] ?? 0),
      couponDiscount: Number(ps["couponDiscount"] ?? 0),
      totalAmount: Number(ps["totalAmount"] ?? 0),
    };
  }

  const itemsSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const subtotal = Number(doc["subtotal"] ?? itemsSubtotal);
  const productSavings = Number(doc["productSavings"] ?? doc["savings"] ?? 0);
  const deliveryFee = Number(
    doc["deliveryFee"] ?? doc["deliveryCost"] ?? doc["shippingFee"] ?? 0
  );

  let coinDiscount = Number(doc["coinDiscount"] ?? 0);
  if (coinDiscount === 0 && typeof doc["coinsUsed"] === "number") {
    const rate = Number(doc["coinValueRate"] ?? OFFICIAL_COIN_CONVERSION_RATE);
    coinDiscount = doc["coinsUsed"] * rate;
  }

  const couponDiscount = Number(
    doc["couponDiscount"] ?? doc["promoDiscount"] ?? doc["discount"] ?? 0
  );

  const totalAmount = Number(
    doc["totalAmount"] ??
      doc["total"] ??
      doc["amount"] ??
      Math.max(0, subtotal - coinDiscount - couponDiscount + deliveryFee)
  );

  return {
    subtotal,
    productSavings,
    deliveryFee,
    coinDiscount,
    couponDiscount,
    totalAmount,
  };
}

/**
 * Normalizes an arbitrary legacy order document (from top-level `orders`
 * or user subcollection `users/{userId}/orders`) into the standard frontend `Order` type.
 */
export function normalizeLegacyOrder(
  doc: Record<string, unknown>,
  userDocId?: string
): Order {
  const id = String(
    doc["id"] || doc["orderId"] || doc["orderNumber"] || ""
  );
  const orderId = String(
    doc["orderId"] || doc["orderNumber"] || doc["id"] || id
  );

  const userId = String(
    userDocId ||
      doc["userId"] ||
      doc["buyerId"] ||
      (doc["userProfile"] as any)?.userId ||
      ""
  );

  const customerName = String(
    doc["customerName"] ||
      doc["buyerName"] ||
      (doc["userProfile"] as any)?.fullName ||
      (doc["userProfile"] as any)?.name ||
      (doc["address"] as any)?.fullName ||
      "Customer"
  );

  const phone = String(
    doc["phone"] ||
      doc["customerPhone"] ||
      (doc["userProfile"] as any)?.number ||
      (doc["userProfile"] as any)?.phone ||
      (doc["address"] as any)?.contact ||
      (doc["address"] as any)?.phone ||
      ""
  );

  const { status, rawStatus } = normalizeLegacyOrderStatus(doc);

  const createdAt = parseLegacyDate(
    doc["createdAt"] ?? doc["timestamp"] ?? doc["orderDate"] ?? doc["date"]
  );

  let deliveredAt: string | undefined;
  if (status === "delivered" || doc["deliveredAt"] || doc["deliveryTime"]) {
    deliveredAt = parseLegacyDate(
      doc["deliveredAt"] ?? doc["deliveryTime"] ?? doc["updatedAt"]
    );
  }

  let cancelledAt: string | undefined;
  if (status === "cancelled" || doc["cancelledAt"] || doc["canceledAt"]) {
    cancelledAt = parseLegacyDate(
      doc["cancelledAt"] ?? doc["canceledAt"] ?? doc["updatedAt"]
    );
  }

  const items = normalizeLegacyItems(doc["items"]);
  const deliveryAddress = normalizeLegacyAddress(doc);
  const delivery = normalizeLegacyDelivery(doc);
  const payment = normalizeLegacyPayment(doc);
  const pricingSummary = normalizeLegacyPricing(doc, items);

  const orderNumber = doc["orderNumber"] ? String(doc["orderNumber"]) : undefined;
  const buyerUid = doc["buyerUid"] ? String(doc["buyerUid"]) : undefined;

  return {
    id,
    orderId,
    userId,
    customerName,
    phone,
    status,
    createdAt,
    ...(deliveredAt ? { deliveredAt } : {}),
    ...(cancelledAt ? { cancelledAt } : {}),
    deliveryAddress,
    delivery,
    payment,
    items,
    pricingSummary,
    ...(rawStatus ? { rawStatus, legacyStatus: rawStatus } : {}),
    ...(orderNumber ? { orderNumber } : {}),
    ...(buyerUid ? { buyerUid } : {}),
    rawOrder: doc,
  };
}

/**
 * Reconciles duplicate order representations between top-level `orders/{docId}`
 * and nested customer subcollection `users/{userId}/orders/{docId}`.
 *
 * Precedence & Merge Rules:
 * 1. Retail Customer Scope: Excludes POS/ERP orders (`salesChannel: "pos"`, `customerId: "CUS-..."`).
 * 2. Authenticated Customer Scope: Discards any top-level order whose `buyerId` / `userId`
 *    does not match the requested `userId`.
 * 3. Stable Identity: Groups orders by canonical order number (`orderId` || `orderNumber` || `id`).
 * 4. Precedence on Conflict:
 *    - Base document: subcollection record (establishing customer ownership).
 *    - Overlay fields: top-level record's operational stages (`operationalStatus`, `deliveryStatus`,
 *      dispatch, driver), UNLESS the subcollection contains a customer cancellation (`status: "cancelled"`),
 *      which takes precedence over stale un-synced operational stages.
 * 5. Deterministic Sort: Orders are sorted by `createdAt` descending (most recent first).
 *    Ties are broken by `orderId` descending for stable ordering.
 */
export function reconcileCustomerOrders(params: {
  nestedOrders: Record<string, unknown>[];
  topLevelOrders: Record<string, unknown>[];
  userId: string;
  legacySassId?: string;
}): Order[] {
  const { nestedOrders, topLevelOrders, userId, legacySassId } = params;

  // Map keyed by canonical order identifier
  const orderMap = new Map<string, { nested?: Record<string, unknown>; top?: Record<string, unknown> }>();

  function getCanonicalKey(doc: Record<string, unknown>): string {
    return String(doc["orderId"] || doc["orderNumber"] || doc["id"] || "").trim();
  }

  // 1. Ingest customer subcollection orders
  for (const doc of nestedOrders) {
    if (!doc || typeof doc !== "object") continue;
    if (isPosOrNonRetailOrder(doc)) continue;
    const key = getCanonicalKey(doc);
    if (!key) continue;
    const existing = orderMap.get(key) || {};
    existing.nested = doc;
    orderMap.set(key, existing);
  }

  // 2. Ingest top-level orders (validating customer ownership and non-POS status)
  for (const doc of topLevelOrders) {
    if (!doc || typeof doc !== "object") continue;
    if (isPosOrNonRetailOrder(doc)) continue;

    // Strict ownership verification:
    const docUserId = String(
      doc["userId"] ||
        doc["buyerId"] ||
        (doc["userProfile"] as any)?.userId ||
        ""
    ).trim();

    const matchesDirect = docUserId === userId;
    const matchesLegacy = Boolean(legacySassId && docUserId === legacySassId);

    if (docUserId && !matchesDirect && !matchesLegacy) {
      // Belongs to another customer — DO NOT INGEST
      continue;
    }

    const key = getCanonicalKey(doc);
    if (!key) continue;
    const existing = orderMap.get(key) || {};
    existing.top = doc;
    orderMap.set(key, existing);
  }

  // 3. Merge representations according to precedence
  const result: Order[] = [];

  for (const [, pair] of orderMap) {
    let mergedRaw: Record<string, unknown>;

    if (pair.nested && pair.top) {
      // Both exist: base is nested, overlay is top (for newer operational status)
      const nestedStatus = normalizeLegacyOrderStatus(pair.nested);

      if (nestedStatus.status === "cancelled" || nestedStatus.status === "returned") {
        // Customer cancellation/return on subcollection takes precedence
        const resolvedTerminalStatus = String(pair.nested["status"] || nestedStatus.rawStatus);
        mergedRaw = {
          ...pair.top,
          ...pair.nested,
          // Clear stale operational status fields from top so they don't override cancellation/return
          operationalStatus: resolvedTerminalStatus,
          deliveryStatus: resolvedTerminalStatus,
          dispatchStatus: resolvedTerminalStatus,
          orderStatus: resolvedTerminalStatus,
          stage: resolvedTerminalStatus,
          currentStage: resolvedTerminalStatus,
          lifecycleStage: resolvedTerminalStatus,
          // Preserve any driver / logistics info from top
          delivery: {
            ...((pair.top["delivery"] as any) || {}),
            ...((pair.nested["delivery"] as any) || {}),
          },
          status: resolvedTerminalStatus,
        };
      } else {
        // Top-level may have newer operational status from Admin
        mergedRaw = {
          ...pair.nested,
          ...pair.top,
          delivery: {
            ...((pair.nested["delivery"] as any) || {}),
            ...((pair.top["delivery"] as any) || {}),
          },
        };
      }
    } else if (pair.nested) {
      mergedRaw = pair.nested;
    } else if (pair.top) {
      mergedRaw = pair.top;
    } else {
      continue;
    }

    const normalized = normalizeLegacyOrder(mergedRaw, userId);
    result.push(normalized);
  }

  // 4. Deterministic sort: Date descending (fallback epoch 0 at end), ID tiebreaker
  result.sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    if (timeA !== timeB) {
      return timeB - timeA;
    }
    return b.orderId.localeCompare(a.orderId);
  });

  return result;
}

/**
 * Legacy-Compatible Read-Only Customer Order Adapter
 *
 * Implements secure read-only customer order retrieval matching the production
 * Firestore topology:
 * - Customer Subcollection: `users/{userDocId}/orders/{docId}`
 * - Top-Level Orders: `orders/{docId}` (reconciled without duplicates)
 *
 * Safety & Identity Rules:
 * 1. Strictly Read-Only: No mutations, creation, status updates, or sequence touches.
 * 2. Strict Customer Validation: Requires a canonical SASS customer ID.
 * 3. Profile Precondition: `users/{userDocId}` must exist.
 * 4. Cross-Customer Protection: Never exposes Customer B's orders to Customer A.
 * 5. POS Order Exclusion: Excludes in-store/POS orders from customer history.
 * 6. Graceful Fallbacks: Empty histories, missing dates, malformed documents handled safely.
 */
export class LegacyOrderAdapter {
  private driver: FirestoreDriver;

  constructor(driver: FirestoreDriver) {
    this.driver = driver;
  }

  /**
   * Resolves the primary customer collection ("onlineCustomers" for ONCUS, "users" for SASS).
   */
  public getCustomerCollection(userId: string): "onlineCustomers" | "users" {
    return userId.trim().toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
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
        `Not found: Customer profile '${primaryCol}/${validId}' does not exist. A valid customer profile must exist before accessing customer orders.`,
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
   * Retrieves all orders for an authenticated customer, querying both
   * the customer's subcollection (`onlineCustomers/{id}/orders` or `users/{id}/orders`)
   * and top-level `orders`, reconciling duplicates according to documented precedence.
   */
  public async getCustomerOrders(userId: string, legacySassId?: string): Promise<Order[]> {
    const validUserId = this.assertValidCustomer(userId);
    await this.assertProfileExists(validUserId);

    const primaryCol = this.getCustomerCollection(validUserId);
    const subcollectionPath = `${primaryCol}/${validUserId}/orders`;

    // 1. Fetch subcollection orders
    let nestedOrders: Record<string, unknown>[] = [];
    try {
      nestedOrders = await this.driver.queryCollection(subcollectionPath, {});
    } catch {
      nestedOrders = [];
    }

    if (nestedOrders.length === 0 && primaryCol === "onlineCustomers" && legacySassId) {
      try {
        nestedOrders = await this.driver.queryCollection(`users/${legacySassId}/orders`, {});
      } catch {
        nestedOrders = [];
      }
    }

    // 2. Fetch top-level orders scoped to this customer
    let topLevelOrders: Record<string, unknown>[] = [];
    try {
      const queries = [
        this.driver.queryCollection("orders", { buyerId: validUserId }).catch(() => []),
        this.driver.queryCollection("orders", { userId: validUserId }).catch(() => []),
      ];
      if (legacySassId) {
        queries.push(this.driver.queryCollection("orders", { buyerId: legacySassId }).catch(() => []));
        queries.push(this.driver.queryCollection("orders", { userId: legacySassId }).catch(() => []));
      }

      const results = await Promise.all(queries);
      const seenTop = new Set<string>();
      for (const list of results) {
        for (const item of list) {
          const docId = String(item["id"] || item["orderId"] || item["orderNumber"] || "");
          if (docId && !seenTop.has(docId)) {
            seenTop.add(docId);
            topLevelOrders.push(item);
          }
        }
      }
    } catch {
      topLevelOrders = [];
    }

    return reconcileCustomerOrders({
      nestedOrders,
      topLevelOrders,
      userId: validUserId,
      ...(legacySassId ? { legacySassId } : {}),
    });
  }

  /**
   * Retrieves a specific order's details by ID after strictly verifying customer ownership.
   * If the order belongs to another customer, throws HTTP 403 permission error.
   */
  public async getOrderById(
    orderId: string,
    userId: string,
    legacySassId?: string
  ): Promise<Order | null> {
    const validUserId = this.assertValidCustomer(userId);
    await this.assertProfileExists(validUserId);

    const cleanOrderId = (orderId || "").trim();
    if (!cleanOrderId) return null;

    const primaryCol = this.getCustomerCollection(validUserId);
    const subcollectionPath = `${primaryCol}/${validUserId}/orders`;

    // 1. Check nested subcollection by doc ID
    let nestedDoc: Record<string, unknown> | null = null;
    try {
      nestedDoc = await this.driver.getDoc(subcollectionPath, cleanOrderId);
    } catch {
      nestedDoc = null;
    }

    // If not found by direct doc ID in subcollection, check by orderId query in subcollection
    if (!nestedDoc) {
      try {
        const queryResults = await this.driver.queryCollection(subcollectionPath, {
          orderId: cleanOrderId,
        });
        if (queryResults.length > 0 && queryResults[0]) {
          nestedDoc = queryResults[0];
        }
      } catch {
        nestedDoc = null;
      }
    }

    // If still not found and fallback legacySassId is available
    if (!nestedDoc && primaryCol === "onlineCustomers" && legacySassId) {
      try {
        nestedDoc = await this.driver.getDoc(`users/${legacySassId}/orders`, cleanOrderId);
      } catch {
        nestedDoc = null;
      }
      if (!nestedDoc) {
        try {
          const queryResults = await this.driver.queryCollection(`users/${legacySassId}/orders`, {
            orderId: cleanOrderId,
          });
          if (queryResults.length > 0 && queryResults[0]) {
            nestedDoc = queryResults[0];
          }
        } catch {
          nestedDoc = null;
        }
      }
    }

    // 2. Check top-level orders
    let topDoc: Record<string, unknown> | null = null;
    try {
      topDoc = await this.driver.getDoc("orders", cleanOrderId);
    } catch {
      topDoc = null;
    }

    if (!topDoc) {
      try {
        const topQuery = await this.driver.queryCollection("orders", {
          orderId: cleanOrderId,
        });
        if (topQuery.length > 0 && topQuery[0]) {
          topDoc = topQuery[0];
        }
      } catch {
        topDoc = null;
      }
    }

    // If found in top-level, strictly verify ownership:
    if (topDoc) {
      if (isPosOrNonRetailOrder(topDoc)) {
        // POS orders are not retail customer orders
        return null;
      }

      const topOwnerId = String(
        topDoc["userId"] ||
          topDoc["buyerId"] ||
          (topDoc["userProfile"] as any)?.userId ||
          ""
      ).trim();

      const isAuthorized =
        topOwnerId === validUserId ||
        Boolean(legacySassId && topOwnerId === legacySassId);

      if (topOwnerId && !isAuthorized) {
        throw new StorageAdapterError(
          `Access denied: You cannot view another customer's order.`,
          {
            status: 403,
            code: "permission-denied",
            category: "permission",
          }
        );
      }
    }

    // If neither exists, order not found
    if (!nestedDoc && !topDoc) {
      return null;
    }

    const reconciled = reconcileCustomerOrders({
      nestedOrders: nestedDoc ? [nestedDoc] : [],
      topLevelOrders: topDoc ? [topDoc] : [],
      userId: validUserId,
      ...(legacySassId ? { legacySassId } : {}),
    });

    return reconciled.length > 0 && reconciled[0] ? reconciled[0] : null;
  }
}

