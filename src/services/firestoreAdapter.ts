import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  runTransaction,
  type QueryConstraint,
} from "firebase/firestore";
import { getEmulatorFirestore, type EmulatorConfig } from "../lib/firebaseEmulator";
import { getIsolatedProductionFirestore } from "./productionPreviewService";
import { deriveCategorySlug } from "./legacySchemaMapper";
import {
  LegacyCartAddressAdapter,
  isValidSassCustomerId,
  isValidCustomerId,
} from "./legacyCartAddressAdapter";
import { LegacyOrderAdapter } from "./legacyOrderAdapter";

export type StorageErrorCategory =
  | "connectivity"
  | "not_found"
  | "permission"
  | "validation"
  | "conflict"
  | "unknown";

export class StorageAdapterError extends Error {
  public status: number;
  public code: string;
  public category: StorageErrorCategory;
  public causeError?: unknown;

  constructor(
    message: string,
    options: {
      status: number;
      code: string;
      category: StorageErrorCategory;
      causeError?: unknown;
    }
  ) {
    super(message);
    this.name = "StorageAdapterError";
    this.status = options.status;
    this.code = options.code;
    this.category = options.category;
    this.causeError = options.causeError;
  }
}

export const KNOWN_ARRAY_COLLECTIONS = new Set([
  "users",
  "onlineCustomers",
  "products",
  "categories",
  "banners",
  "cart",
  "addresses",
  "wishlists",
  "wishlistProducts",
  "orders",
  "coinHistory",
  "referrals",
  "notifications",
  "reportedProblems",
  "productRequests",
  "deliverySlots",
]);

export const KNOWN_SINGLETON_COLLECTIONS = new Set([
  "deliverySettings",
  "storeInfo",
]);

export const KNOWN_READONLY_COLLECTIONS = new Set([
  "usersByUid",
  "Settings",
  "promoCodes",
  "promos",
]);

export const CUSTOMER_SCOPED_COLLECTIONS = new Set([
  "users",
  "onlineCustomers",
  "cart",
  "addresses",
  "wishlists",
  "wishlistProducts",
  "orders",
  "coinHistory",
  "referrals",
  "notifications",
  "reportedProblems",
  "productRequests",
]);

const VALID_ORDER_STATUSES = new Set([
  "pending",
  "processing",
  "packed",
  "in transit",
  "delivered",
  "cancelled",
  "returned",
]);

export function classifyStorageError(error: unknown): StorageErrorCategory {
  if (!error) return "unknown";

  if (error instanceof StorageAdapterError) {
    return error.category;
  }

  const err = error as {
    status?: number;
    code?: string;
    name?: string;
    message?: string;
  };
  const code = String(err.code || "").toLowerCase();
  const msg = String(err.message || "").toLowerCase();
  const status = err.status;

  if (
    status === 404 ||
    code === "not-found" ||
    code === "firestore/not-found" ||
    msg.includes("http error 404") ||
    msg.includes("document does not exist")
  ) {
    return "not_found";
  }

  if (
    status === 403 ||
    status === 401 ||
    code === "permission-denied" ||
    code === "firestore/permission-denied" ||
    code === "unauthenticated" ||
    code === "firestore/unauthenticated" ||
    msg.includes("permission_denied") ||
    msg.includes("permission-denied") ||
    msg.includes("missing or insufficient permissions") ||
    msg.includes("access denied")
  ) {
    return "permission";
  }

  if (
    status === 400 ||
    code === "invalid-argument" ||
    code === "firestore/invalid-argument" ||
    code === "failed-precondition" ||
    code === "firestore/failed-precondition" ||
    code === "out-of-range" ||
    msg.includes("invalid query") ||
    msg.includes("validation error") ||
    msg.includes("invalid argument")
  ) {
    return "validation";
  }

  if (
    status === 409 ||
    code === "already-exists" ||
    code === "firestore/already-exists" ||
    code === "aborted" ||
    code === "firestore/aborted"
  ) {
    return "conflict";
  }

  if (
    code === "unavailable" ||
    code === "firestore/unavailable" ||
    code === "deadline-exceeded" ||
    code === "firestore/deadline-exceeded" ||
    code === "econnrefused" ||
    code === "econnreset" ||
    code === "etimedout" ||
    code === "enotfound" ||
    msg.includes("unavailable") ||
    msg.includes("econnrefused") ||
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("fetch failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("firestore_connectivity_timeout") ||
    msg.includes("could not reach cloud firestore backend") ||
    msg.includes("client is offline")
  ) {
    return "connectivity";
  }

  return "unknown";
}

export function toStorageAdapterError(error: unknown): StorageAdapterError {
  if (error instanceof StorageAdapterError) return error;

  const category = classifyStorageError(error);
  const err = error as { status?: number; code?: string; message?: string };
  const message = err?.message || String(error);

  let status = err?.status || 500;
  let code = err?.code || "unknown";

  switch (category) {
    case "not_found":
      status = 404;
      code = "not-found";
      break;
    case "permission":
      status = 403;
      code = "permission-denied";
      break;
    case "validation":
      status = 400;
      code = "invalid-argument";
      break;
    case "conflict":
      status = 409;
      code = "conflict";
      break;
    case "connectivity":
      status = 503;
      code = "unavailable";
      break;
  }

  return new StorageAdapterError(message, {
    status,
    code,
    category,
    causeError: error,
  });
}

function withBoundedTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationLabel: string
): Promise<T> {
  if (timeoutMs <= 0) return promise;

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new StorageAdapterError(
          `FIRESTORE_CONNECTIVITY_TIMEOUT: Firestore timed out after ${timeoutMs}ms during ${operationLabel}`,
          {
            status: 503,
            code: "unavailable",
            category: "connectivity",
          }
        )
      );
    }, timeoutMs);

    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(toStorageAdapterError(err));
      });
  });
}

export interface ParsedEndpoint {
  resource: string;
  parentResource?: string | undefined;
  parentId?: string | undefined;
  docId?: string | undefined;
  nestedCategory?: string | undefined;
  isNestedProductItems?: boolean | undefined;
  isSingleton: boolean;
  embeddedParams: Record<string, string>;
}

const NESTED_PRODUCT_COLLECTION_RE = /^products\/([^/]+)\/items$/;
const NESTED_PRODUCT_DOC_PATH_RE = /^products\/([^/]+)\/items\/([^/]+)$/;

/**
 * Attaches parent category, document ID, and canonical path context to a nested
 * product document retrieved from `products/{category}/items/{productId}` so
 * downstream normalizers (`legacySchemaMapper`) and query filters have full context.
 */
export function attachNestedProductContext(
  data: Record<string, unknown>,
  parentCategory: string,
  docId: string
): Record<string, unknown> {
  const cleanCategory = parentCategory.trim();
  const cleanDocId = docId.trim();
  const resolvedId =
    (typeof data["id"] === "string" && data["id"].trim()) ||
    (typeof data["productId"] === "string" && data["productId"].trim()) ||
    (typeof data["sku"] === "string" && data["sku"].trim()) ||
    cleanDocId;

  const rawCategory =
    (typeof data["category"] === "string" && data["category"].trim()) ||
    (typeof data["categoryName"] === "string" && data["categoryName"].trim()) ||
    cleanCategory;

  const resolvedCategorySlug = deriveCategorySlug(
    rawCategory,
    data["categorySlug"]
  );

  const inferredFlashDeal =
    typeof data["isFlashDeal"] === "boolean"
      ? data["isFlashDeal"]
      : typeof data["offerZone"] === "boolean"
        ? data["offerZone"]
        : typeof data["showOfferBand"] === "boolean"
          ? data["showOfferBand"]
          : undefined;

  return {
    ...data,
    id: resolvedId,
    ...(typeof data["categorySlug"] === "string" && data["categorySlug"].trim()
      ? {}
      : { categorySlug: resolvedCategorySlug }),
    ...(inferredFlashDeal !== undefined && data["isFlashDeal"] === undefined
      ? { isFlashDeal: inferredFlashDeal }
      : {}),
    _docId: cleanDocId,
    _parentCategory: cleanCategory,
    _path: `products/${cleanCategory}/items/${cleanDocId}`,
  };
}

function extractLogicalProductKeys(record: Record<string, unknown>): string[] {
  const keys: string[] = [];
  for (const field of ["id", "productId", "sku", "_docId"] as const) {
    const val = record[field];
    if (typeof val === "string" && val.trim().length > 0) {
      const trimmed = val.trim();
      if (!keys.includes(trimmed)) {
        keys.push(trimmed);
      }
    }
  }
  return keys;
}

export function isBareCategoryContainerStub(
  record: Record<string, unknown>,
  nestedCategories?: ReadonlySet<string>
): boolean {
  const hasProductOptionsOrPricing =
    (Array.isArray(record["options"]) && record["options"].length > 0) ||
    (Array.isArray(record["variants"]) && record["variants"].length > 0) ||
    record["offerPrice"] !== undefined ||
    record["sellingPrice"] !== undefined ||
    record["price"] !== undefined;

  if (hasProductOptionsOrPricing) {
    return false;
  }

  if (record["items"] !== undefined) {
    return true;
  }

  const docId = typeof record["id"] === "string" ? record["id"].trim() : "";
  if (nestedCategories && docId && nestedCategories.has(docId)) {
    return true;
  }

  return false;
}

/**
 * Merges top-level `products/{productId}` and nested `products/{category}/items/{productId}`
 * documents using a deterministic precedence rule:
 * 1. Top-level product documents take precedence over nested `items` documents when both
 *    share any logical product identifier (`id`, `productId`, `sku`, or `_docId`).
 * 2. Bare category container stub documents at `products/{category}` (without product
 *    options/variants/pricing) are excluded so they do not pollute or shadow nested items.
 * 3. Nested documents are ordered deterministically by `(_parentCategory, _docId)` before
 *    deduplication.
 */
export function mergeTopLevelAndNestedProducts(
  topLevelItems: Record<string, unknown>[],
  nestedItems: Record<string, unknown>[]
): Record<string, unknown>[] {
  const nestedCategories = new Set<string>();
  for (const nested of nestedItems) {
    const cat = nested["_parentCategory"];
    if (typeof cat === "string" && cat.trim().length > 0) {
      nestedCategories.add(cat.trim());
    }
  }

  const seenKeys = new Set<string>();
  const merged: Record<string, unknown>[] = [];

  for (const topDoc of topLevelItems) {
    if (isBareCategoryContainerStub(topDoc, nestedCategories)) {
      continue;
    }
    const keys = extractLogicalProductKeys(topDoc);
    if (keys.length > 0 && keys.some((k) => seenKeys.has(k))) {
      continue;
    }
    for (const k of keys) {
      seenKeys.add(k);
    }
    merged.push(topDoc);
  }

  const sortedNested = [...nestedItems].sort((a, b) => {
    const catA = String(a["_parentCategory"] ?? "");
    const catB = String(b["_parentCategory"] ?? "");
    if (catA !== catB) return catA.localeCompare(catB);
    const idA = String(a["_docId"] ?? a["id"] ?? "");
    const idB = String(b["_docId"] ?? b["id"] ?? "");
    return idA.localeCompare(idB);
  });

  for (const nestedDoc of sortedNested) {
    const keys = extractLogicalProductKeys(nestedDoc);
    if (keys.length > 0 && keys.some((k) => seenKeys.has(k))) {
      continue;
    }
    for (const k of keys) {
      seenKeys.add(k);
    }
    merged.push(nestedDoc);
  }

  return merged;
}

export function parseEndpoint(
  endpoint: string,
  params?: Record<string, string | number | boolean | undefined>
): ParsedEndpoint {
  const raw = (endpoint || "").trim();
  if (!raw) {
    throw new StorageAdapterError("Validation error: Endpoint cannot be empty", {
      status: 400,
      code: "invalid-argument",
      category: "validation",
    });
  }

  const parts = raw.split("?");
  const pathPart = parts[0] ?? "";
  const queryString = parts[1];
  const embeddedParams: Record<string, string> = {};

  if (queryString) {
    const searchParams = new URLSearchParams(queryString);
    searchParams.forEach((v, k) => {
      embeddedParams[k] = v;
    });
  }

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) {
        embeddedParams[k] = String(v);
      }
    }
  }

  const segments = pathPart
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    });

  const firstSegment = segments[0];
  if (!firstSegment) {
    throw new StorageAdapterError(`Validation error: Invalid endpoint "${endpoint}"`, {
      status: 400,
      code: "invalid-argument",
      category: "validation",
    });
  }

  // Support nested customer subcollections `/{users|onlineCustomers}/:userId/{orders|cart|addresses|coinHistory|notifications|referrals}[/:docId]`
  if (
    (firstSegment === "users" || firstSegment === "onlineCustomers") &&
    (segments[2] === "orders" ||
      segments[2] === "cart" ||
      segments[2] === "addresses" ||
      segments[2] === "coinHistory" ||
      segments[2] === "notifications" ||
      segments[2] === "referrals") &&
    (segments.length === 3 || segments.length === 4)
  ) {
    return {
      resource: segments[2],
      parentResource: firstSegment,
      parentId: segments[1] ?? "",
      docId: segments[3],
      isSingleton: false,
      embeddedParams: {
        ...embeddedParams,
        userId: segments[1] ?? "",
      },
    };
  }

  // Support legacy nested product paths `/products/:category/items` and `/products/:category/items/:productId`
  if (
    (segments.length === 3 || segments.length === 4) &&
    firstSegment === "products" &&
    segments[2] === "items"
  ) {
    const nestedCategory = segments[1] ?? "";
    if (!nestedCategory) {
      throw new StorageAdapterError(
        `Validation error: Invalid nested product category in "${endpoint}"`,
        {
          status: 400,
          code: "invalid-argument",
          category: "validation",
        }
      );
    }
    return {
      resource: "products",
      nestedCategory,
      docId: segments[3],
      isNestedProductItems: true,
      isSingleton: false,
      embeddedParams,
    };
  }

  if (segments.length > 2) {
    throw new StorageAdapterError(
      `Validation error: Unsupported nested endpoint path "${endpoint}"`,
      {
        status: 400,
        code: "invalid-argument",
        category: "validation",
      }
    );
  }

  const resource = firstSegment;

  if (KNOWN_SINGLETON_COLLECTIONS.has(resource)) {
    const docId = segments[1] || "default";
    return {
      resource,
      docId,
      isSingleton: true,
      embeddedParams,
    };
  }

  if (
    !KNOWN_ARRAY_COLLECTIONS.has(resource) &&
    !KNOWN_READONLY_COLLECTIONS.has(resource) &&
    resource !== "_metadata"
  ) {
    throw new StorageAdapterError(
      `Permission or validation error: Unknown collection "${resource}" is not permitted by Firestore rules.`,
      {
        status: 403,
        code: "permission-denied",
        category: "permission",
      }
    );
  }

  return {
    resource,
    docId: segments[1],
    isSingleton: false,
    embeddedParams,
  };
}

/**
 * Validates write payloads against domain schema and Firestore rule invariants
 * so invalid writes fail fast with a 400/403 error and never trigger a fallback.
 */
export function validateWritePayload(
  resource: string,
  method: "POST" | "PUT" | "PATCH",
  payload: unknown
): Record<string, unknown> {
  if (KNOWN_READONLY_COLLECTIONS.has(resource)) {
    throw new StorageAdapterError(
      `Permission denied: Collection "${resource}" is read-only and cannot be modified by the client.`,
      {
        status: 403,
        code: "permission-denied",
        category: "permission",
      }
    );
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new StorageAdapterError(
      `Validation error: Write payload for ${resource} must be a non-null object.`,
      {
        status: 400,
        code: "invalid-argument",
        category: "validation",
      }
    );
  }

  const data = payload as Record<string, unknown>;

  if (method === "POST" || method === "PUT") {
    if (CUSTOMER_SCOPED_COLLECTIONS.has(resource)) {
      const userId =
        typeof data["userId"] === "string" ? data["userId"].trim() : "";
      if (!userId) {
        throw new StorageAdapterError(
          `Permission denied: Collection "${resource}" requires a non-empty customer userId.`,
          {
            status: 403,
            code: "permission-denied",
            category: "permission",
          }
        );
      }
    }

    if (resource === "orders") {
      const status = String(data["status"] || "pending");
      if (!VALID_ORDER_STATUSES.has(status)) {
        throw new StorageAdapterError(
          `Validation error: Invalid order status "${status}".`,
          {
            status: 400,
            code: "invalid-argument",
            category: "validation",
          }
        );
      }
    }

    if (resource === "cart") {
      if (typeof data["quantity"] !== "number" || data["quantity"] <= 0) {
        throw new StorageAdapterError(
          `Validation error: Cart item quantity must be a positive number.`,
          {
            status: 400,
            code: "invalid-argument",
            category: "validation",
          }
        );
      }
    }

    if (resource === "coinHistory") {
      if (
        typeof data["amount"] !== "number" ||
        (data["type"] !== "earned" && data["type"] !== "redeemed")
      ) {
        throw new StorageAdapterError(
          `Validation error: CoinTransaction requires numeric amount and type in ['earned', 'redeemed'].`,
          {
            status: 400,
            code: "invalid-argument",
            category: "validation",
          }
        );
      }
    }
  }

  if (method === "PATCH") {
    if (resource === "orders" && data["status"] !== undefined) {
      const status = String(data["status"]);
      if (!VALID_ORDER_STATUSES.has(status)) {
        throw new StorageAdapterError(
          `Validation error: Invalid order status "${status}".`,
          {
            status: 400,
            code: "invalid-argument",
            category: "validation",
          }
        );
      }
    }
    if (
      CUSTOMER_SCOPED_COLLECTIONS.has(resource) &&
      "userId" in data &&
      typeof data["userId"] === "string" &&
      data["userId"].trim() === ""
    ) {
      throw new StorageAdapterError(
        `Permission denied: Cannot set an empty customer userId on "${resource}".`,
        {
          status: 403,
          code: "permission-denied",
          category: "permission",
        }
      );
    }
  }

  return data;
}

function stripUndefinedDeep<T>(input: T): T {
  if (input === null || input === undefined || typeof input !== "object") {
    return input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (v !== undefined) {
      out[k] = stripUndefinedDeep(v);
    }
  }
  return out as T;
}

export interface FirestoreDriver {
  checkHealth(timeoutMs?: number): Promise<void>;
  getDoc(
    collectionName: string,
    docId: string,
    timeoutMs?: number
  ): Promise<Record<string, unknown> | null>;
  queryCollection(
    collectionName: string,
    equalityFilters: Record<string, unknown>,
    timeoutMs?: number
  ): Promise<Record<string, unknown>[]>;
  getNestedProductDoc?(
    category: string,
    productId: string,
    timeoutMs?: number
  ): Promise<Record<string, unknown> | null>;
  queryNestedProducts?(
    category?: string,
    timeoutMs?: number
  ): Promise<Record<string, unknown>[]>;
  setDoc(
    collectionName: string,
    docId: string,
    data: Record<string, unknown>,
    merge?: boolean,
    timeoutMs?: number
  ): Promise<Record<string, unknown>>;
  updateDoc(
    collectionName: string,
    docId: string,
    patch: Record<string, unknown>,
    timeoutMs?: number
  ): Promise<Record<string, unknown>>;
  deleteDoc(
    collectionName: string,
    docId: string,
    timeoutMs?: number
  ): Promise<void>;
  runOrderCreationTransaction(
    orderPayload: Record<string, unknown>,
    timeoutMs?: number
  ): Promise<Record<string, unknown>>;
}

/**
 * Firebase Web SDK driver. Normal runtime uses the configured Firebase project;
 * the emulator backend is selected only by the automated test environment.
 */
export class SdkFirestoreDriver implements FirestoreDriver {
  constructor(private configOverrides?: Partial<EmulatorConfig>) {}

  private getDb() {
    if (import.meta.env.MODE === "test") {
      return getEmulatorFirestore(this.configOverrides).db;
    }
    return getIsolatedProductionFirestore().db;
  }

  async checkHealth(timeoutMs = 1200): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, "storeInfo", "default");
    await withBoundedTimeout(getDoc(ref), timeoutMs, "healthCheck(storeInfo/default)");
  }

  async getDoc(
    collectionName: string,
    docId: string,
    timeoutMs = 2000
  ): Promise<Record<string, unknown> | null> {
    const nestedMatch = NESTED_PRODUCT_COLLECTION_RE.exec(collectionName);
    if (nestedMatch && nestedMatch[1]) {
      return this.getNestedProductDoc(nestedMatch[1], docId, timeoutMs);
    }

    const db = this.getDb();
    const ref = doc(db, collectionName, docId);
    const snap = await withBoundedTimeout(
      getDoc(ref),
      timeoutMs,
      `getDoc(${collectionName}/${docId})`
    );
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    if (collectionName === "storeInfo" && !("id" in data)) {
      return { ...data };
    }
    return { id: snap.id, ...data };
  }

  async getNestedProductDoc(
    category: string,
    productId: string,
    timeoutMs = 2000
  ): Promise<Record<string, unknown> | null> {
    const db = this.getDb();
    const ref = doc(db, "products", category, "items", productId);
    const snap = await withBoundedTimeout(
      getDoc(ref),
      timeoutMs,
      `getDoc(products/${category}/items/${productId})`
    );
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return attachNestedProductContext(data, category, snap.id);
  }

  async queryNestedProducts(
    category?: string,
    timeoutMs = 2500
  ): Promise<Record<string, unknown>[]> {
    const db = this.getDb();
    const results: Record<string, unknown>[] = [];

    if (category && category.trim().length > 0) {
      const cleanCategory = category.trim();
      const colRef = collection(db, "products", cleanCategory, "items");
      const snap = await withBoundedTimeout(
        getDocs(query(colRef)),
        timeoutMs,
        `queryCollection(products/${cleanCategory}/items)`
      );
      snap.forEach((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        results.push(
          attachNestedProductContext(data, cleanCategory, docSnap.id)
        );
      });
    } else {
      const groupRef = collectionGroup(db, "items");
      const snap = await withBoundedTimeout(
        getDocs(query(groupRef)),
        timeoutMs,
        "queryCollectionGroup(products/*/items)"
      );
      snap.forEach((docSnap) => {
        const refPath = docSnap.ref.path;
        const match = NESTED_PRODUCT_DOC_PATH_RE.exec(refPath);
        if (match && match[1]) {
          let parentCategory = match[1];
          try {
            parentCategory = decodeURIComponent(parentCategory);
          } catch {
            // keep raw segment
          }
          const data = docSnap.data() as Record<string, unknown>;
          results.push(
            attachNestedProductContext(data, parentCategory, docSnap.id)
          );
        }
      });
    }

    results.sort((a, b) =>
      String(a["_path"] ?? "").localeCompare(String(b["_path"] ?? ""))
    );
    return results;
  }

  async queryCollection(
    collectionName: string,
    equalityFilters: Record<string, unknown>,
    timeoutMs = 2500
  ): Promise<Record<string, unknown>[]> {
    const nestedMatch = NESTED_PRODUCT_COLLECTION_RE.exec(collectionName);
    if (nestedMatch && nestedMatch[1]) {
      return this.queryNestedProducts(nestedMatch[1], timeoutMs);
    }

    const db = this.getDb();
    const colRef = collection(db, collectionName);
    const constraints: QueryConstraint[] = [];

    for (const [field, value] of Object.entries(equalityFilters)) {
      if (value !== undefined) {
        constraints.push(where(field, "==", value));
      }
    }

    const q = constraints.length > 0 ? query(colRef, ...constraints) : query(colRef);
    const snap = await withBoundedTimeout(
      getDocs(q),
      timeoutMs,
      `queryCollection(${collectionName})`
    );

    const results: Record<string, unknown>[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      results.push({ id: docSnap.id, ...data });
    });
    return results;
  }

  async setDoc(
    collectionName: string,
    docId: string,
    data: Record<string, unknown>,
    merge = false,
    timeoutMs = 2500
  ): Promise<Record<string, unknown>> {
    const db = this.getDb();
    const ref = doc(db, collectionName, docId);
    const cleanData = stripUndefinedDeep({ ...data });
    if (collectionName !== "storeInfo" && !cleanData["id"]) {
      cleanData["id"] = docId;
    }

    await withBoundedTimeout(
      merge ? setDoc(ref, cleanData, { merge: true }) : setDoc(ref, cleanData),
      timeoutMs,
      `setDoc(${collectionName}/${docId})`
    );

    const snap = await withBoundedTimeout(
      getDoc(ref),
      timeoutMs,
      `verifySetDoc(${collectionName}/${docId})`
    );
    const stored = (snap.exists() ? snap.data() : cleanData) as Record<string, unknown>;
    if (collectionName === "storeInfo" && !("id" in data)) {
      const copy = { ...stored };
      delete copy["id"];
      return copy;
    }
    return { id: docId, ...stored };
  }

  async updateDoc(
    collectionName: string,
    docId: string,
    patch: Record<string, unknown>,
    timeoutMs = 2500
  ): Promise<Record<string, unknown>> {
    const db = this.getDb();
    const ref = doc(db, collectionName, docId);
    const existingSnap = await withBoundedTimeout(
      getDoc(ref),
      timeoutMs,
      `getDocBeforeUpdate(${collectionName}/${docId})`
    );

    if (!existingSnap.exists()) {
      throw new StorageAdapterError(
        `HTTP Error 404: Not Found (${collectionName}/${docId})`,
        {
          status: 404,
          code: "not-found",
          category: "not_found",
        }
      );
    }

    const existingData = existingSnap.data() as Record<string, unknown>;
    const merged = stripUndefinedDeep({
      ...existingData,
      ...patch,
    });
    if (collectionName !== "storeInfo") {
      merged["id"] = existingData["id"] || docId;
    }

    await withBoundedTimeout(
      setDoc(ref, merged),
      timeoutMs,
      `updateDoc(${collectionName}/${docId})`
    );

    if (collectionName === "storeInfo" && !("id" in existingData)) {
      const copy = { ...merged };
      delete copy["id"];
      return copy;
    }
    return merged;
  }

  async deleteDoc(
    collectionName: string,
    docId: string,
    timeoutMs = 2000
  ): Promise<void> {
    const db = this.getDb();
    const ref = doc(db, collectionName, docId);
    const existingSnap = await withBoundedTimeout(
      getDoc(ref),
      timeoutMs,
      `getDocBeforeDelete(${collectionName}/${docId})`
    );
    if (!existingSnap.exists()) {
      throw new StorageAdapterError(
        `HTTP Error 404: Not Found (${collectionName}/${docId})`,
        {
          status: 404,
          code: "not-found",
          category: "not_found",
        }
      );
    }

    await withBoundedTimeout(
      deleteDoc(ref),
      timeoutMs,
      `deleteDoc(${collectionName}/${docId})`
    );
  }

  async runOrderCreationTransaction(
    orderPayload: Record<string, unknown>,
    timeoutMs = 3000
  ): Promise<Record<string, unknown>> {
    const db = this.getDb();
    const cleanPayload = stripUndefinedDeep({ ...orderPayload });

    return withBoundedTimeout(
      runTransaction(db, async (tx) => {
        const counterRef = doc(db, "_metadata", "orderSequence");
        const counterSnap = await tx.get(counterRef);
        let currentSeq = 5510;
        if (counterSnap.exists()) {
          const snapData = counterSnap.data() as Record<string, unknown>;
          const val = Number(snapData["currentSeq"]);
          if (!Number.isNaN(val) && val >= 1000) {
            currentSeq = val;
          }
        }

        const requestedOrderId = String(
          cleanPayload["orderId"] || cleanPayload["id"] || ""
        ).trim();

        let finalOrderId = requestedOrderId;
        if (!finalOrderId || !/^ORD-\d{7}$/.test(finalOrderId)) {
          currentSeq = currentSeq >= 9999 ? 1001 : currentSeq + 1;
          finalOrderId = `ORD-${String(currentSeq).padStart(7, "0")}`;
        }

        let orderRef = doc(db, "orders", finalOrderId);
        let existingOrderSnap = await tx.get(orderRef);

        if (existingOrderSnap.exists()) {
          const existingOrder = existingOrderSnap.data() as Record<string, unknown>;
          if (
            existingOrder["userId"] === cleanPayload["userId"] &&
            (existingOrder["createdAt"] === cleanPayload["createdAt"] ||
              JSON.stringify(existingOrder["items"]) ===
                JSON.stringify(cleanPayload["items"]))
          ) {
            return {
              id: finalOrderId,
              ...existingOrder,
            };
          }

          currentSeq = currentSeq >= 9999 ? 1001 : currentSeq + 1;
          finalOrderId = `ORD-${String(currentSeq).padStart(7, "0")}`;
          orderRef = doc(db, "orders", finalOrderId);
          existingOrderSnap = await tx.get(orderRef);
        }

        const parsedSeq = Number(finalOrderId.replace(/^ORD-0*/, ""));
        const nextCounterVal =
          !Number.isNaN(parsedSeq) && parsedSeq > currentSeq
            ? parsedSeq
            : currentSeq + 1;

        tx.set(counterRef, {
          currentSeq: nextCounterVal,
          updatedAt: new Date().toISOString(),
        });

        const recordToSave: Record<string, unknown> = {
          ...cleanPayload,
          id: finalOrderId,
          orderId: finalOrderId,
        };

        // Atomically write order to main collection orders/{orderId}
        tx.set(orderRef, recordToSave);

        // Atomically write order to customer subcollection onlineCustomers/{customerId}/orders/{orderId}
        const rawCustomerId = String(
          cleanPayload["customerId"] || cleanPayload["userId"] || ""
        ).trim();
        const normalizedCustomerId = rawCustomerId.startsWith("SASS")
          ? `ONCUS${rawCustomerId.slice(4)}`
          : rawCustomerId;

        if (normalizedCustomerId && normalizedCustomerId.toUpperCase().startsWith("ONCUS")) {
          const customerOrderRef = doc(
            db,
            "onlineCustomers",
            normalizedCustomerId,
            "orders",
            finalOrderId
          );
          tx.set(customerOrderRef, recordToSave);
        }

        return recordToSave;
      }),
      timeoutMs,
      "runOrderCreationTransaction"
    );
  }
}

/**
 * In-memory Firestore driver implementing identical collection, singleton,
 * nested `products/{category}/items/{productId}`, security validation, and
 * atomic transaction semantics for deterministic testing.
 */
export class InMemoryFirestoreDriver implements FirestoreDriver {
  private store = new Map<string, Map<string, Record<string, unknown>>>();
  private nestedProductsStore = new Map<
    string,
    Map<string, Record<string, unknown>>
  >();
  private failureMode: StorageAdapterError | null = null;
  public transactionCallCount = 0;

  constructor(initialDbJson?: Record<string, unknown>) {
    if (initialDbJson) {
      this.seedFromDbJson(initialDbJson);
    }
  }

  public setFailureMode(error: StorageAdapterError | null): void {
    this.failureMode = error;
  }

  private getNestedCategoryMap(
    category: string
  ): Map<string, Record<string, unknown>> {
    const cleanCategory = category.trim();
    let catMap = this.nestedProductsStore.get(cleanCategory);
    if (!catMap) {
      catMap = new Map();
      this.nestedProductsStore.set(cleanCategory, catMap);
    }
    return catMap;
  }

  public async setNestedProductDoc(
    category: string,
    productId: string,
    data: Record<string, unknown>,
    merge = false
  ): Promise<Record<string, unknown>> {
    this.assertHealthy();
    const catMap = this.getNestedCategoryMap(category);
    const cleanId = productId.trim();
    const existing = catMap.get(cleanId);
    const clean = stripUndefinedDeep(
      JSON.parse(JSON.stringify(data)) as Record<string, unknown>
    );
    const next: Record<string, unknown> =
      merge && existing ? { ...existing, ...clean } : clean;
    catMap.set(cleanId, next);
    return attachNestedProductContext(
      JSON.parse(JSON.stringify(next)) as Record<string, unknown>,
      category,
      cleanId
    );
  }

  public async getNestedProductDoc(
    category: string,
    productId: string
  ): Promise<Record<string, unknown> | null> {
    this.assertHealthy();
    const catMap = this.nestedProductsStore.get(category.trim());
    if (!catMap) return null;
    const found = catMap.get(productId.trim());
    if (!found) return null;
    return attachNestedProductContext(
      JSON.parse(JSON.stringify(found)) as Record<string, unknown>,
      category.trim(),
      productId.trim()
    );
  }

  public async deleteNestedProductDoc(
    category: string,
    productId: string
  ): Promise<void> {
    this.assertHealthy();
    const catMap = this.nestedProductsStore.get(category.trim());
    if (!catMap || !catMap.has(productId.trim())) {
      throw new StorageAdapterError(
        `HTTP Error 404: Not Found (products/${category}/items/${productId})`,
        {
          status: 404,
          code: "not-found",
          category: "not_found",
        }
      );
    }
    catMap.delete(productId.trim());
  }

  public clearNestedProducts(): void {
    this.nestedProductsStore.clear();
  }

  public async queryNestedProducts(
    category?: string
  ): Promise<Record<string, unknown>[]> {
    this.assertHealthy();
    const results: Record<string, unknown>[] = [];
    const seenPaths = new Set<string>();

    const collectFromCategory = (
      catName: string,
      catMap: Map<string, Record<string, unknown>>
    ) => {
      const sortedDocIds = Array.from(catMap.keys()).sort();
      for (const docId of sortedDocIds) {
        const raw = catMap.get(docId);
        if (!raw) continue;
        const cloned = JSON.parse(JSON.stringify(raw)) as Record<
          string,
          unknown
        >;
        const withCtx = attachNestedProductContext(cloned, catName, docId);
        const pathKey = String(withCtx["_path"]);
        if (!seenPaths.has(pathKey)) {
          seenPaths.add(pathKey);
          results.push(withCtx);
        }
      }
    };

    if (category && category.trim().length > 0) {
      const cleanCategory = category.trim();
      const catMap = this.nestedProductsStore.get(cleanCategory);
      if (catMap) {
        collectFromCategory(cleanCategory, catMap);
      }
    } else {
      const sortedCategories = Array.from(
        this.nestedProductsStore.keys()
      ).sort();
      for (const catName of sortedCategories) {
        const catMap = this.nestedProductsStore.get(catName);
        if (catMap) {
          collectFromCategory(catName, catMap);
        }
      }
    }

    return results;
  }

  public seedFromDbJson(rawData: Record<string, unknown>): void {
    this.nestedProductsStore.clear();

    for (const colName of KNOWN_ARRAY_COLLECTIONS) {
      const arr = rawData[colName];
      const colMap = new Map<string, Record<string, unknown>>();
      if (Array.isArray(arr)) {
        for (const item of arr) {
          if (item && typeof item === "object") {
            const rec = stripUndefinedDeep({ ...(item as Record<string, unknown>) });
            const id = String(rec["id"]);
            if (colName === "products" && rec["items"] !== undefined) {
              const parentCat =
                (typeof rec["category"] === "string" && rec["category"].trim()) ||
                (typeof rec["categoryName"] === "string" &&
                  rec["categoryName"].trim()) ||
                id;
              this.seedNestedItemsForCategory(parentCat, rec["items"]);
            }
            colMap.set(id, rec);
          }
        }
      }
      this.store.set(colName, colMap);
    }

    // Support optional `nestedProducts` fixture structure: `{ [category]: { [productId]: doc } | doc[] }`
    const rawNested = rawData["nestedProducts"];
    if (rawNested && typeof rawNested === "object" && !Array.isArray(rawNested)) {
      for (const [catName, itemsOrMap] of Object.entries(
        rawNested as Record<string, unknown>
      )) {
        this.seedNestedItemsForCategory(catName, itemsOrMap);
      }
    }

    for (const singletonName of KNOWN_SINGLETON_COLLECTIONS) {
      const obj = rawData[singletonName];
      const colMap = new Map<string, Record<string, unknown>>();
      if (obj && typeof obj === "object" && !Array.isArray(obj)) {
        colMap.set(
          "default",
          stripUndefinedDeep({ ...(obj as Record<string, unknown>) })
        );
      }
      this.store.set(singletonName, colMap);
    }

    if (!this.store.has("_metadata")) {
      this.store.set("_metadata", new Map());
    }

    // Support optional `usersByUid` fixture structure (array or `{ [uid]: { userDocId, uid } }`)
    const usersByUidMap = new Map<string, Record<string, unknown>>();
    const rawUsersByUid = rawData["usersByUid"];
    if (Array.isArray(rawUsersByUid)) {
      for (const item of rawUsersByUid) {
        if (item && typeof item === "object" && !Array.isArray(item)) {
          const rec = stripUndefinedDeep({ ...(item as Record<string, unknown>) });
          const docKey = String(rec["id"] || rec["uid"] || "").trim();
          if (docKey) {
            usersByUidMap.set(docKey, rec);
          }
        }
      }
    } else if (rawUsersByUid && typeof rawUsersByUid === "object") {
      for (const [uidKey, val] of Object.entries(
        rawUsersByUid as Record<string, unknown>
      )) {
        if (val && typeof val === "object" && !Array.isArray(val)) {
          const rec = stripUndefinedDeep({ ...(val as Record<string, unknown>) });
          const cleanKey = uidKey.trim();
          if (cleanKey) {
            usersByUidMap.set(cleanKey, rec);
          }
        }
      }
    }
    this.store.set("usersByUid", usersByUidMap);
  }

  private seedNestedItemsForCategory(
    category: string,
    itemsOrMap: unknown
  ): void {
    const catMap = this.getNestedCategoryMap(category);
    if (Array.isArray(itemsOrMap)) {
      for (let i = 0; i < itemsOrMap.length; i++) {
        const entry = itemsOrMap[i];
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const rec = stripUndefinedDeep({
            ...(entry as Record<string, unknown>),
          });
          const docId = String(
            rec["id"] || rec["productId"] || rec["sku"] || `item_${i + 1}`
          ).trim();
          catMap.set(docId, rec);
        }
      }
    } else if (itemsOrMap && typeof itemsOrMap === "object") {
      for (const [docId, entry] of Object.entries(
        itemsOrMap as Record<string, unknown>
      )) {
        if (entry && typeof entry === "object" && !Array.isArray(entry)) {
          const rec = stripUndefinedDeep({
            ...(entry as Record<string, unknown>),
          });
          catMap.set(docId.trim(), rec);
        }
      }
    }
  }

  private assertHealthy(): void {
    if (this.failureMode) {
      throw this.failureMode;
    }
  }

  private getColMap(collectionName: string): Map<string, Record<string, unknown>> {
    const nestedMatch = NESTED_PRODUCT_COLLECTION_RE.exec(collectionName);
    if (nestedMatch && nestedMatch[1]) {
      return this.getNestedCategoryMap(nestedMatch[1]);
    }

    let col = this.store.get(collectionName);
    if (!col) {
      col = new Map();
      this.store.set(collectionName, col);
    }
    return col;
  }

  async checkHealth(): Promise<void> {
    this.assertHealthy();
  }

  async getDoc(
    collectionName: string,
    docId: string
  ): Promise<Record<string, unknown> | null> {
    const nestedMatch = NESTED_PRODUCT_COLLECTION_RE.exec(collectionName);
    if (nestedMatch && nestedMatch[1]) {
      return this.getNestedProductDoc(nestedMatch[1], docId);
    }

    this.assertHealthy();
    const col = this.getColMap(collectionName);
    const found = col.get(docId);
    if (!found) return null;
    return JSON.parse(JSON.stringify(found));
  }

  async queryCollection(
    collectionName: string,
    equalityFilters: Record<string, unknown>
  ): Promise<Record<string, unknown>[]> {
    const nestedMatch = NESTED_PRODUCT_COLLECTION_RE.exec(collectionName);
    if (nestedMatch && nestedMatch[1]) {
      return this.queryNestedProducts(nestedMatch[1]);
    }

    this.assertHealthy();
    const col = this.getColMap(collectionName);
    const items = Array.from(col.values()).map(
      (x) => JSON.parse(JSON.stringify(x)) as Record<string, unknown>
    );

    return items.filter((item) => {
      for (const [k, v] of Object.entries(equalityFilters)) {
        if (v !== undefined && item[k] !== v) {
          return false;
        }
      }
      return true;
    });
  }

  async setDoc(
    collectionName: string,
    docId: string,
    data: Record<string, unknown>,
    merge = false
  ): Promise<Record<string, unknown>> {
    const nestedMatch = NESTED_PRODUCT_COLLECTION_RE.exec(collectionName);
    if (nestedMatch && nestedMatch[1]) {
      return this.setNestedProductDoc(nestedMatch[1], docId, data, merge);
    }

    this.assertHealthy();
    const col = this.getColMap(collectionName);
    const existing = col.get(docId);
    const clean = stripUndefinedDeep(
      JSON.parse(JSON.stringify(data)) as Record<string, unknown>
    );
    const next: Record<string, unknown> =
      merge && existing ? { ...existing, ...clean } : clean;
    if (collectionName !== "storeInfo" && !next["id"]) {
      next["id"] = docId;
    }
    col.set(docId, next);
    return JSON.parse(JSON.stringify(next));
  }

  async updateDoc(
    collectionName: string,
    docId: string,
    patch: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.assertHealthy();
    const col = this.getColMap(collectionName);
    const existing = col.get(docId);
    if (!existing) {
      throw new StorageAdapterError(
        `HTTP Error 404: Not Found (${collectionName}/${docId})`,
        {
          status: 404,
          code: "not-found",
          category: "not_found",
        }
      );
    }
    const updated: Record<string, unknown> = stripUndefinedDeep({
      ...existing,
      ...(JSON.parse(JSON.stringify(patch)) as Record<string, unknown>),
    });
    if (collectionName !== "storeInfo") {
      updated["id"] = existing["id"] || docId;
    }
    col.set(docId, updated);
    return JSON.parse(JSON.stringify(updated));
  }

  async deleteDoc(collectionName: string, docId: string): Promise<void> {
    const nestedMatch = NESTED_PRODUCT_COLLECTION_RE.exec(collectionName);
    if (nestedMatch && nestedMatch[1]) {
      return this.deleteNestedProductDoc(nestedMatch[1], docId);
    }

    this.assertHealthy();
    const col = this.getColMap(collectionName);
    if (!col.has(docId)) {
      throw new StorageAdapterError(
        `HTTP Error 404: Not Found (${collectionName}/${docId})`,
        {
          status: 404,
          code: "not-found",
          category: "not_found",
        }
      );
    }
    col.delete(docId);
  }

  async runOrderCreationTransaction(
    orderPayload: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    this.assertHealthy();
    this.transactionCallCount++;

    const metaCol = this.getColMap("_metadata");
    const ordersCol = this.getColMap("orders");

    const seqDoc = metaCol.get("orderSequence") || { currentSeq: 5510 };
    let currentSeq = Number(seqDoc["currentSeq"] || 5510);

    const requestedOrderId = String(
      orderPayload["orderId"] || orderPayload["id"] || ""
    ).trim();
    let finalOrderId = requestedOrderId;

    if (!finalOrderId || !/^ORD-\d{7}$/.test(finalOrderId)) {
      currentSeq = currentSeq >= 9999 ? 1001 : currentSeq + 1;
      finalOrderId = `ORD-${String(currentSeq).padStart(7, "0")}`;
    }

    const existing = ordersCol.get(finalOrderId);
    if (existing) {
      if (
        existing["userId"] === orderPayload["userId"] &&
        (existing["createdAt"] === orderPayload["createdAt"] ||
          JSON.stringify(existing["items"]) ===
            JSON.stringify(orderPayload["items"]))
      ) {
        return JSON.parse(JSON.stringify(existing));
      }
      while (ordersCol.has(finalOrderId)) {
        currentSeq = currentSeq >= 9999 ? 1001 : currentSeq + 1;
        finalOrderId = `ORD-${String(currentSeq).padStart(7, "0")}`;
      }
    }

    metaCol.set("orderSequence", {
      currentSeq: currentSeq + 1,
      updatedAt: new Date().toISOString(),
    });

    const record = stripUndefinedDeep({
      ...(JSON.parse(JSON.stringify(orderPayload)) as Record<string, unknown>),
      id: finalOrderId,
      orderId: finalOrderId,
    });
    ordersCol.set(finalOrderId, record);

    // Atomically write order to customer subcollection in memory
    const rawCustomerId = String(
      orderPayload["customerId"] || orderPayload["userId"] || ""
    ).trim();
    const normalizedCustomerId = rawCustomerId.startsWith("SASS")
      ? `ONCUS${rawCustomerId.slice(4)}`
      : rawCustomerId;

    if (normalizedCustomerId && normalizedCustomerId.toUpperCase().startsWith("ONCUS")) {
      const customerOrdersKey = `onlineCustomers/${normalizedCustomerId}/orders`;
      const custOrdersCol = this.getColMap(customerOrdersKey);
      custOrdersCol.set(finalOrderId, record);
    }

    return JSON.parse(JSON.stringify(record));
  }
}

/**
 * Applies JSON Server compatible filtering, searching, sorting, and pagination
 * on top of collection documents retrieved from Firestore.
 */
export function applyResourceQueryAndSort(
  resource: string,
  items: Record<string, unknown>[],
  params: Record<string, string>
): Record<string, unknown>[] {
  let result = [...items];

  const sortField = params["_sort"];
  const sortOrder = (params["_order"] || "asc").toLowerCase();
  const limitParam =
    params["_limit"] !== undefined ? Number(params["_limit"]) : undefined;
  const pageParam =
    params["_page"] !== undefined ? Number(params["_page"]) : undefined;
  const fullTextQuery = params["q"] ? params["q"].trim().toLowerCase() : undefined;

  if (limitParam !== undefined && (Number.isNaN(limitParam) || limitParam < 0)) {
    throw new StorageAdapterError("Validation error: _limit must be a non-negative number", {
      status: 400,
      code: "invalid-argument",
      category: "validation",
    });
  }

  for (const [rawKey, rawVal] of Object.entries(params)) {
    if (rawKey.startsWith("_") || rawKey === "q") continue;

    if (rawKey.endsWith("_like")) {
      const field = rawKey.slice(0, -5);
      const pattern = new RegExp(rawVal, "i");
      result = result.filter((item) => pattern.test(String(item[field] ?? "")));
      continue;
    }

    if (rawKey.endsWith("_ne")) {
      const field = rawKey.slice(0, -3);
      result = result.filter((item) => !matchesScalarValue(item[field], rawVal));
      continue;
    }

    if (rawKey.endsWith("_gte")) {
      const field = rawKey.slice(0, -4);
      const numVal = Number(rawVal);
      result = result.filter((item) => Number(item[field]) >= numVal);
      continue;
    }

    if (rawKey.endsWith("_lte")) {
      const field = rawKey.slice(0, -4);
      const numVal = Number(rawVal);
      result = result.filter((item) => Number(item[field]) <= numVal);
      continue;
    }

    result = result.filter((item) => matchesScalarValue(item[rawKey], rawVal));
  }

  if (fullTextQuery) {
    result = result.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(fullTextQuery)
    );
  }

  if (sortField) {
    result.sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (va === vb) return 0;
      if (va === undefined || va === null) return 1;
      if (vb === undefined || vb === null) return -1;
      const cmp = va < vb ? -1 : 1;
      return sortOrder === "desc" ? -cmp : cmp;
    });
  } else {
    if (resource === "orders") {
      result.sort(
        (a, b) =>
          new Date(String(b["createdAt"] || 0)).getTime() -
          new Date(String(a["createdAt"] || 0)).getTime()
      );
    } else if (resource === "notifications" || resource === "coinHistory") {
      result.sort(
        (a, b) =>
          new Date(String(b["timestamp"] || 0)).getTime() -
          new Date(String(a["timestamp"] || 0)).getTime()
      );
    } else if (resource === "referrals") {
      result.sort(
        (a, b) =>
          new Date(String(b["date"] || 0)).getTime() -
          new Date(String(a["date"] || 0)).getTime()
      );
    }
  }

  if (limitParam !== undefined) {
    const start = pageParam && pageParam > 1 ? (pageParam - 1) * limitParam : 0;
    result = result.slice(start, start + limitParam);
  }

  return result;
}

function matchesScalarValue(fieldVal: unknown, paramStr: string): boolean {
  if (fieldVal === paramStr) return true;
  if (typeof fieldVal === "boolean") {
    if (paramStr.toLowerCase() === "true") return fieldVal === true;
    if (paramStr.toLowerCase() === "false") return fieldVal === false;
  }
  if (typeof fieldVal === "number" && paramStr.trim() !== "") {
    const parsed = Number(paramStr);
    if (!Number.isNaN(parsed)) return fieldVal === parsed;
  }
  return String(fieldVal ?? "") === paramStr;
}

/**
 * Extracts direct Firestore equality filters (`where(field, "==", val)`)
 * for indexed fields to minimize reads before applying full resource post-filtering.
 */
function buildFirestoreEqualityFilters(
  resource: string,
  params: Record<string, string>
): Record<string, unknown> {
  const filters: Record<string, unknown> = {};

  if (params["userId"] !== undefined) {
    filters["userId"] = params["userId"];
  }
  if (resource === "orders" && params["orderId"] !== undefined) {
    filters["orderId"] = params["orderId"];
  }
  if (resource === "wishlistProducts" && params["wishlistId"] !== undefined) {
    filters["wishlistId"] = params["wishlistId"];
  }
  if ((resource === "promoCodes" || resource === "promos") && params["code"] !== undefined) {
    filters["code"] = params["code"];
  }
  if (resource === "products") {
    if (params["categorySlug"] !== undefined) {
      filters["categorySlug"] = params["categorySlug"];
    }
    if (params["isFlashDeal"] !== undefined) {
      if (params["isFlashDeal"] === "true") filters["isFlashDeal"] = true;
      else if (params["isFlashDeal"] === "false") filters["isFlashDeal"] = false;
    }
  }

  return filters;
}

export interface FirestoreAdapterOptions {
  legacyCustomerSubcollections?: boolean;
}

export class FirestoreAdapter {
  private driver: FirestoreDriver;
  private legacyCustomerSubcollectionsEnabled = false;
  private legacyCartAddressAdapter: LegacyCartAddressAdapter | null = null;
  private legacyOrderAdapter: LegacyOrderAdapter | null = null;

  constructor(driver?: FirestoreDriver, options?: FirestoreAdapterOptions) {
    this.driver = driver ?? new SdkFirestoreDriver();
    this.legacyCustomerSubcollectionsEnabled = Boolean(
      options?.legacyCustomerSubcollections
    );
    if (this.legacyCustomerSubcollectionsEnabled) {
      this.legacyCartAddressAdapter = new LegacyCartAddressAdapter(this.driver);
      this.legacyOrderAdapter = new LegacyOrderAdapter(this.driver);
    }
  }

  public setLegacyCustomerSubcollectionsEnabled(enabled: boolean): void {
    this.legacyCustomerSubcollectionsEnabled = enabled;
    if (enabled && !this.legacyCartAddressAdapter) {
      this.legacyCartAddressAdapter = new LegacyCartAddressAdapter(this.driver);
    }
    if (enabled && !this.legacyOrderAdapter) {
      this.legacyOrderAdapter = new LegacyOrderAdapter(this.driver);
    }
  }

  public isLegacyCustomerSubcollectionsEnabled(): boolean {
    return this.legacyCustomerSubcollectionsEnabled;
  }

  public getLegacyCartAddressAdapter(): LegacyCartAddressAdapter {
    if (!this.legacyCartAddressAdapter) {
      this.legacyCartAddressAdapter = new LegacyCartAddressAdapter(this.driver);
    }
    return this.legacyCartAddressAdapter;
  }

  public getLegacyOrderAdapter(): LegacyOrderAdapter {
    if (!this.legacyOrderAdapter) {
      this.legacyOrderAdapter = new LegacyOrderAdapter(this.driver);
    }
    return this.legacyOrderAdapter;
  }

  public setDriver(driver: FirestoreDriver): void {
    this.driver = driver;
    if (this.legacyCartAddressAdapter) {
      this.legacyCartAddressAdapter = new LegacyCartAddressAdapter(driver);
    }
    if (this.legacyOrderAdapter) {
      this.legacyOrderAdapter = new LegacyOrderAdapter(driver);
    }
  }

  public getDriver(): FirestoreDriver {
    return this.driver;
  }

  private async resolveUserIdForAddressId(
    addressId: string,
    candidateUserId?: string
  ): Promise<string> {
    if (candidateUserId && candidateUserId.trim().length > 0) {
      const clean = candidateUserId.trim();
      if (!isValidCustomerId(clean)) {
        throw new StorageAdapterError(
          `Validation error: Invalid customer identifier "${candidateUserId}". Operations require a canonical SASS customer ID or ONCUS customer ID.`,
          {
            status: 400,
            code: "invalid-argument",
            category: "validation",
          }
        );
      }
      return clean;
    }
    const cleanAddressId = (addressId || "").trim();
    throw new StorageAdapterError(
      `Permission denied: Accessing customer address "${cleanAddressId}" requires an explicit, verified customer identity. Missing customer identity fails closed.`,
      {
        status: 403,
        code: "permission-denied",
        category: "permission",
      }
    );
  }

  private async resolveUserIdForCartDocId(
    cartDocId: string,
    candidateUserId?: string
  ): Promise<string> {
    const cleanCartId = (cartDocId || "").trim();
    if (candidateUserId && candidateUserId.trim().length > 0) {
      const cleanUser = candidateUserId.trim();
      if (!isValidCustomerId(cleanUser)) {
        throw new StorageAdapterError(
          `Validation error: Invalid customer identifier "${candidateUserId}". Operations require a canonical SASS customer ID or ONCUS customer ID.`,
          {
            status: 400,
            code: "invalid-argument",
            category: "validation",
          }
        );
      }
      if (cleanCartId.includes("__")) {
        const prefix = cleanCartId.split("__")[0];
        if (isValidCustomerId(prefix) && prefix !== cleanUser) {
          throw new StorageAdapterError(
            `Permission denied: Ownership mismatch. Cannot access cart item belonging to customer "${prefix}" using identity "${cleanUser}".`,
            {
              status: 403,
              code: "permission-denied",
              category: "permission",
            }
          );
        }
      }
      return cleanUser;
    }

    if (cleanCartId.includes("__")) {
      const prefix = cleanCartId.split("__")[0];
      if (isValidCustomerId(prefix)) {
        return prefix;
      }
    }

    throw new StorageAdapterError(
      `Permission denied: Accessing customer cart item "${cleanCartId}" requires an explicit, verified customer identity. Missing customer identity fails closed.`,
      {
        status: 403,
        code: "permission-denied",
        category: "permission",
      }
    );
  }

  public async checkConnectivity(timeoutMs = 1200): Promise<void> {
    try {
      await this.driver.checkHealth(timeoutMs);
    } catch (err) {
      throw toStorageAdapterError(err);
    }
  }

  public async getDocumentRaw(
    resource: string,
    docId: string
  ): Promise<Record<string, unknown> | null> {
    const targetDocId = KNOWN_SINGLETON_COLLECTIONS.has(resource)
      ? "default"
      : docId;
    return this.driver.getDoc(resource, targetDocId);
  }

  public async setDocumentRaw(
    resource: string,
    docId: string,
    payload: Record<string, unknown>,
    merge = false
  ): Promise<Record<string, unknown>> {
    const targetDocId = KNOWN_SINGLETON_COLLECTIONS.has(resource)
      ? "default"
      : docId;
    return this.driver.setDoc(resource, targetDocId, payload, merge);
  }

  public async deleteDocumentRaw(resource: string, docId: string): Promise<void> {
    return this.driver.deleteDoc(resource, docId);
  }

  private async queryNestedProductsFromDriver(
    category?: string
  ): Promise<Record<string, unknown>[]> {
    if (typeof this.driver.queryNestedProducts === "function") {
      return this.driver.queryNestedProducts(category);
    }
    if (category) {
      return this.driver.queryCollection(`products/${category}/items`, {});
    }
    return [];
  }

  private async getNestedProductDocFromDriver(
    category: string,
    productId: string
  ): Promise<Record<string, unknown> | null> {
    if (typeof this.driver.getNestedProductDoc === "function") {
      return this.driver.getNestedProductDoc(category, productId);
    }
    return this.driver.getDoc(`products/${category}/items`, productId);
  }

  private async findNestedProductById(
    targetId: string
  ): Promise<Record<string, unknown> | null> {
    const cleanTarget = targetId.trim();
    if (!cleanTarget) return null;
    const nestedItems = await this.queryNestedProductsFromDriver();
    for (const item of nestedItems) {
      const keys = extractLogicalProductKeys(item);
      if (keys.includes(cleanTarget)) {
        return item;
      }
    }
    return null;
  }

  public async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    const parsed = parseEndpoint(endpoint, params);

    if (this.legacyCustomerSubcollectionsEnabled) {
      if (parsed.resource === "cart") {
        const legacyAdapter = this.getLegacyCartAddressAdapter();
        if (parsed.docId) {
          const userId = await this.resolveUserIdForCartDocId(
            parsed.docId,
            parsed.embeddedParams["userId"]
          );
          const item = await legacyAdapter.getCartItem(userId, parsed.docId);
          if (!item) {
            throw new StorageAdapterError(
              `HTTP Error 404: Not Found (cart/${parsed.docId})`,
              {
                status: 404,
                code: "not-found",
                category: "not_found",
              }
            );
          }
          return item as unknown as T;
        }

        const userId = parsed.embeddedParams["userId"];
        if (!userId) {
          throw new StorageAdapterError(
            `Validation error: Querying cart in legacy subcollection mode requires a valid customer userId.`,
            {
              status: 400,
              code: "invalid-argument",
              category: "validation",
            }
          );
        }
        const items = await legacyAdapter.getCart(userId);
        return items as unknown as T;
      }

      if (parsed.resource === "addresses") {
        const legacyAdapter = this.getLegacyCartAddressAdapter();
        if (parsed.docId) {
          const userId = await this.resolveUserIdForAddressId(
            parsed.docId,
            parsed.embeddedParams["userId"]
          );
          const address = await legacyAdapter.getAddress(userId, parsed.docId);
          if (!address) {
            throw new StorageAdapterError(
              `HTTP Error 404: Not Found (addresses/${parsed.docId})`,
              {
                status: 404,
                code: "not-found",
                category: "not_found",
              }
            );
          }
          return address as unknown as T;
        }

        const userId = parsed.embeddedParams["userId"];
        if (!userId) {
          throw new StorageAdapterError(
            `Validation error: Querying addresses in legacy subcollection mode requires a valid customer userId.`,
            {
              status: 400,
              code: "invalid-argument",
              category: "validation",
            }
          );
        }
        const addresses = await legacyAdapter.getAddresses(userId);
        return addresses as unknown as T;
      }

      if (parsed.resource === "orders") {
        const legacyAdapter = this.getLegacyOrderAdapter();
        const candidateUser = (
          parsed.embeddedParams["userId"] ||
          (typeof params?.["userId"] === "string" ? params["userId"] : undefined) ||
          ""
        ).trim();

        if (parsed.docId) {
          if (!candidateUser) {
            throw new StorageAdapterError(
              `Missing customer identity: Retrieving order '${parsed.docId}' in legacy customer mode requires an authenticated customer context.`,
              {
                status: 403,
                code: "permission-denied",
                category: "permission",
              }
            );
          }
          const order = await legacyAdapter.getOrderById(parsed.docId, candidateUser);
          if (!order) {
            throw new StorageAdapterError(
              `HTTP Error 404: Not Found (orders/${parsed.docId})`,
              {
                status: 404,
                code: "not-found",
                category: "not_found",
              }
            );
          }
          return order as unknown as T;
        }

        if (!candidateUser) {
          throw new StorageAdapterError(
            `Missing customer identity: Querying customer orders in legacy mode requires a valid customer userId.`,
            {
              status: 403,
              code: "permission-denied",
              category: "permission",
            }
          );
        }

        const targetOrderId = typeof params?.["orderId"] === "string" ? params["orderId"].trim() : "";
        if (targetOrderId) {
          const order = await legacyAdapter.getOrderById(targetOrderId, candidateUser);
          return (order ? [order] : []) as unknown as T;
        }

        const orders = await legacyAdapter.getCustomerOrders(candidateUser);
        return orders as unknown as T;
      }
    }

    if (parsed.isNestedProductItems && parsed.nestedCategory) {
      if (parsed.docId) {
        const nestedDoc = await this.getNestedProductDocFromDriver(
          parsed.nestedCategory,
          parsed.docId
        );
        if (!nestedDoc) {
          throw new StorageAdapterError(
            `HTTP Error 404: Not Found (products/${parsed.nestedCategory}/items/${parsed.docId})`,
            {
              status: 404,
              code: "not-found",
              category: "not_found",
            }
          );
        }
        return nestedDoc as unknown as T;
      }

      const nestedItems = await this.queryNestedProductsFromDriver(
        parsed.nestedCategory
      );
      const filteredNested = applyResourceQueryAndSort(
        "products",
        nestedItems,
        parsed.embeddedParams
      );
      return filteredNested as unknown as T;
    }

    if (parsed.isSingleton) {
      const docData = await this.driver.getDoc(
        parsed.resource,
        parsed.docId || "default"
      );
      if (!docData) {
        throw new StorageAdapterError(
          `HTTP Error 404: Not Found (${parsed.resource})`,
          {
            status: 404,
            code: "not-found",
            category: "not_found",
          }
        );
      }
      return docData as unknown as T;
    }

    if (parsed.docId) {
      let docData = await this.driver.getDoc(parsed.resource, parsed.docId);
      if (!docData && parsed.resource === "orders") {
        const byOrderId = await this.driver.queryCollection("orders", {
          orderId: parsed.docId,
        });
        if (byOrderId.length > 0 && byOrderId[0]) {
          docData = byOrderId[0];
        }
      }

      if (parsed.resource === "products") {
        if (!docData || isBareCategoryContainerStub(docData)) {
          const nestedMatch = await this.findNestedProductById(parsed.docId);
          if (nestedMatch) {
            docData = nestedMatch;
          } else if (docData && isBareCategoryContainerStub(docData)) {
            docData = null;
          }
        }
      }

      if (!docData) {
        throw new StorageAdapterError(
          `HTTP Error 404: Not Found (${parsed.resource}/${parsed.docId})`,
          {
            status: 404,
            code: "not-found",
            category: "not_found",
          }
        );
      }
      return docData as unknown as T;
    }

    const eqFilters = buildFirestoreEqualityFilters(
      parsed.resource,
      parsed.embeddedParams
    );
    let rawItems = await this.driver.queryCollection(
      parsed.resource,
      eqFilters
    );

    if (parsed.resource === "products") {
      const nestedItems = await this.queryNestedProductsFromDriver();
      rawItems = mergeTopLevelAndNestedProducts(rawItems, nestedItems);
    }

    const filtered = applyResourceQueryAndSort(
      parsed.resource,
      rawItems,
      parsed.embeddedParams
    );
    return filtered as unknown as T;
  }

  public async post<T>(endpoint: string, data: unknown): Promise<T> {
    const parsed = parseEndpoint(endpoint);
    const validData = validateWritePayload(parsed.resource, "POST", data);

    if (this.legacyCustomerSubcollectionsEnabled) {
      if (parsed.resource === "cart") {
        const legacyAdapter = this.getLegacyCartAddressAdapter();
        const epUser = parsed.embeddedParams["userId"]?.trim();
        const bodyUser = (typeof validData["userId"] === "string" ? validData["userId"] : "")?.trim();
        if (epUser && bodyUser && epUser !== bodyUser) {
          throw new StorageAdapterError(
            `Permission denied: Ownership mismatch. Endpoint customer ID "${epUser}" does not match payload customer ID "${bodyUser}".`,
            {
              status: 403,
              code: "permission-denied",
              category: "permission",
            }
          );
        }
        const userId = epUser || bodyUser || "";
        if (!userId) {
          throw new StorageAdapterError(
            `Permission denied: Cart mutation requires an explicit customer identity. Missing customer identity fails closed.`,
            {
              status: 403,
              code: "permission-denied",
              category: "permission",
            }
          );
        }
        const created = await legacyAdapter.addToCart(userId, validData as any);
        return created as unknown as T;
      }

      if (parsed.resource === "addresses") {
        const legacyAdapter = this.getLegacyCartAddressAdapter();
        const epUser = parsed.embeddedParams["userId"]?.trim();
        const bodyUser = (typeof validData["userId"] === "string" ? validData["userId"] : "")?.trim();
        if (epUser && bodyUser && epUser !== bodyUser) {
          throw new StorageAdapterError(
            `Permission denied: Ownership mismatch. Endpoint customer ID "${epUser}" does not match payload customer ID "${bodyUser}".`,
            {
              status: 403,
              code: "permission-denied",
              category: "permission",
            }
          );
        }
        const userId = epUser || bodyUser || "";
        if (!userId) {
          throw new StorageAdapterError(
            `Permission denied: Address mutation requires an explicit customer identity. Missing customer identity fails closed.`,
            {
              status: 403,
              code: "permission-denied",
              category: "permission",
            }
          );
        }
        const created = await legacyAdapter.addAddress(userId, validData as any);
        return created as unknown as T;
      }
    }

    if (parsed.isSingleton) {
      const saved = await this.driver.setDoc(
        parsed.resource,
        parsed.docId || "default",
        validData,
        false
      );
      return saved as unknown as T;
    }

    if (parsed.resource === "orders") {
      const createdOrder = await this.driver.runOrderCreationTransaction(
        validData
      );
      return createdOrder as unknown as T;
    }

    if (parsed.resource === "notifications") {
      const notifId = String(
        validData["id"] || `notif_${Date.now()}`
      ).trim();
      const existingById = await this.driver.getDoc("notifications", notifId);
      if (existingById) {
        return existingById as unknown as T;
      }
      if (validData["eventKey"] && validData["userId"]) {
        const userNotifs = await this.driver.queryCollection("notifications", {
          userId: String(validData["userId"]),
        });
        const dup = userNotifs.find(
          (n) => n["eventKey"] === validData["eventKey"]
        );
        if (dup) {
          return dup as unknown as T;
        }
      }
      const saved = await this.driver.setDoc(
        "notifications",
        notifId,
        { ...validData, id: notifId },
        false
      );

      // Also persist to customer subcollection onlineCustomers/{customerId}/notifications
      const rawUser = String(validData["userId"] || parsed.parentId || "").trim();
      const normalizedCustomerId = rawUser.startsWith("SASS")
        ? `ONCUS${rawUser.slice(4)}`
        : rawUser;
      if (normalizedCustomerId && normalizedCustomerId.toUpperCase().startsWith("ONCUS")) {
        try {
          await this.driver.setDoc(
            `onlineCustomers/${normalizedCustomerId}/notifications`,
            notifId,
            { ...validData, id: notifId },
            false
          );
        } catch (err) {
          console.warn("[FirestoreAdapter] subcollection notification write:", err);
        }
      }

      return saved as unknown as T;
    }

    if (parsed.resource === "coinHistory") {
      const txId = String(
        validData["id"] ||
          (validData["orderId"] && validData["type"]
            ? `coin_${String(validData["type"])}_${String(validData["orderId"])}`
            : `coin_${Date.now()}`)
      ).trim();
      const existingById = await this.driver.getDoc("coinHistory", txId);
      if (existingById) {
        return existingById as unknown as T;
      }
      const saved = await this.driver.setDoc(
        "coinHistory",
        txId,
        { ...validData, id: txId },
        false
      );

      // Also persist to customer subcollection onlineCustomers/{customerId}/coinHistory
      const rawUser = String(validData["userId"] || parsed.parentId || "").trim();
      const normalizedCustomerId = rawUser.startsWith("SASS")
        ? `ONCUS${rawUser.slice(4)}`
        : rawUser;
      if (normalizedCustomerId && normalizedCustomerId.toUpperCase().startsWith("ONCUS")) {
        try {
          await this.driver.setDoc(
            `onlineCustomers/${normalizedCustomerId}/coinHistory`,
            txId,
            { ...validData, id: txId },
            false
          );
        } catch (err) {
          console.warn("[FirestoreAdapter] subcollection coinHistory write:", err);
        }
      }

      return saved as unknown as T;
    }

    if (parsed.resource === "referrals") {
      const refId = String(validData["id"] || `ref_${Date.now()}`).trim();
      const existingById = await this.driver.getDoc("referrals", refId);
      if (existingById) {
        return existingById as unknown as T;
      }
      if (validData["userId"] && validData["phoneMasked"]) {
        const userRefs = await this.driver.queryCollection("referrals", {
          userId: String(validData["userId"]),
        });
        const dup = userRefs.find(
          (r) => r["phoneMasked"] === validData["phoneMasked"]
        );
        if (dup) {
          return dup as unknown as T;
        }
      }
      const saved = await this.driver.setDoc(
        "referrals",
        refId,
        { ...validData, id: refId },
        false
      );
      return saved as unknown as T;
    }

    const docId = String(
      parsed.docId ||
        validData["id"] ||
        validData["userId"] ||
        `${parsed.resource}_${Date.now()}`
    ).trim();

    const saved = await this.driver.setDoc(
      parsed.resource,
      docId,
      { ...validData, id: docId },
      false
    );
    return saved as unknown as T;
  }

  public async put<T>(endpoint: string, data: unknown): Promise<T> {
    const parsed = parseEndpoint(endpoint);
    const validData = validateWritePayload(parsed.resource, "PUT", data);
    const docId = parsed.isSingleton
      ? parsed.docId || "default"
      : String(parsed.docId || validData["id"] || "").trim();

    if (!docId) {
      throw new StorageAdapterError(
        `Validation error: PUT ${endpoint} requires a target document ID.`,
        {
          status: 400,
          code: "invalid-argument",
          category: "validation",
        }
      );
    }

    if (this.legacyCustomerSubcollectionsEnabled) {
      if (parsed.resource === "cart") {
        const legacyAdapter = this.getLegacyCartAddressAdapter();
        const epUser = parsed.embeddedParams["userId"]?.trim();
        const bodyUser = (typeof validData["userId"] === "string" ? validData["userId"] : "")?.trim();
        if (epUser && bodyUser && epUser !== bodyUser) {
          throw new StorageAdapterError(
            `Permission denied: Ownership mismatch. Endpoint customer ID "${epUser}" does not match payload customer ID "${bodyUser}".`,
            {
              status: 403,
              code: "permission-denied",
              category: "permission",
            }
          );
        }
        const candidateUser = epUser || bodyUser;
        const userId = await this.resolveUserIdForCartDocId(docId, candidateUser);
        const saved = await legacyAdapter.addToCart(userId, { ...validData, id: docId } as any);
        return saved as unknown as T;
      }

      if (parsed.resource === "addresses") {
        const legacyAdapter = this.getLegacyCartAddressAdapter();
        const epUser = parsed.embeddedParams["userId"]?.trim();
        const bodyUser = (typeof validData["userId"] === "string" ? validData["userId"] : "")?.trim();
        if (epUser && bodyUser && epUser !== bodyUser) {
          throw new StorageAdapterError(
            `Permission denied: Ownership mismatch. Endpoint customer ID "${epUser}" does not match payload customer ID "${bodyUser}".`,
            {
              status: 403,
              code: "permission-denied",
              category: "permission",
            }
          );
        }
        const candidateUser = epUser || bodyUser;
        const userId = await this.resolveUserIdForAddressId(docId, candidateUser);
        const saved = await legacyAdapter.updateAddress(userId, docId, validData as any);
        return saved as unknown as T;
      }
    }

    const saved = await this.driver.setDoc(
      parsed.resource,
      docId,
      parsed.isSingleton ? validData : { ...validData, id: docId },
      false
    );
    return saved as unknown as T;
  }

  public async patch<T>(endpoint: string, data: unknown): Promise<T> {
    const parsed = parseEndpoint(endpoint);
    const validPatch = validateWritePayload(parsed.resource, "PATCH", data);
    const docId = parsed.isSingleton
      ? parsed.docId || "default"
      : String(parsed.docId || "").trim();

    if (!docId) {
      throw new StorageAdapterError(
        `Validation error: PATCH ${endpoint} requires a target document ID.`,
        {
          status: 400,
          code: "invalid-argument",
          category: "validation",
        }
      );
    }

    if (this.legacyCustomerSubcollectionsEnabled) {
      if (parsed.resource === "cart") {
        const legacyAdapter = this.getLegacyCartAddressAdapter();
        const epUser = parsed.embeddedParams["userId"]?.trim();
        const bodyUser = (typeof validPatch["userId"] === "string" ? validPatch["userId"] : undefined)?.trim();
        if (epUser && bodyUser && epUser !== bodyUser) {
          throw new StorageAdapterError(
            `Permission denied: Ownership mismatch. Endpoint customer ID "${epUser}" does not match payload customer ID "${bodyUser}".`,
            {
              status: 403,
              code: "permission-denied",
              category: "permission",
            }
          );
        }
        const candidateUser = epUser || bodyUser;
        const userId = await this.resolveUserIdForCartDocId(docId, candidateUser);
        const quantity =
          typeof validPatch["quantity"] === "number" ? validPatch["quantity"] : 1;
        const updated = await legacyAdapter.updateCartQuantity(userId, docId, quantity);
        return (updated ?? {}) as unknown as T;
      }

      if (parsed.resource === "addresses") {
        const legacyAdapter = this.getLegacyCartAddressAdapter();
        const epUser = parsed.embeddedParams["userId"]?.trim();
        const bodyUser = (typeof validPatch["userId"] === "string" ? validPatch["userId"] : undefined)?.trim();
        if (epUser && bodyUser && epUser !== bodyUser) {
          throw new StorageAdapterError(
            `Permission denied: Ownership mismatch. Endpoint customer ID "${epUser}" does not match payload customer ID "${bodyUser}".`,
            {
              status: 403,
              code: "permission-denied",
              category: "permission",
            }
          );
        }
        const candidateUser = epUser || bodyUser;
        const userId = await this.resolveUserIdForAddressId(docId, candidateUser);
        const updated = await legacyAdapter.updateAddress(userId, docId, validPatch as any);
        return updated as unknown as T;
      }
    }

    const updated = await this.driver.updateDoc(
      parsed.resource,
      docId,
      validPatch
    );
    return updated as unknown as T;
  }

  public async delete<T>(endpoint: string): Promise<T> {
    const parsed = parseEndpoint(endpoint);
    if (KNOWN_READONLY_COLLECTIONS.has(parsed.resource)) {
      throw new StorageAdapterError(
        `Permission denied: Collection "${parsed.resource}" is read-only and cannot be deleted by the client.`,
        {
          status: 403,
          code: "permission-denied",
          category: "permission",
        }
      );
    }
    const docId = parsed.isSingleton
      ? parsed.docId || "default"
      : String(parsed.docId || "").trim();

    if (this.legacyCustomerSubcollectionsEnabled) {
      if (parsed.resource === "cart") {
        const legacyAdapter = this.getLegacyCartAddressAdapter();
        if (!docId) {
          if (parsed.embeddedParams["userId"]) {
            await legacyAdapter.clearCart(parsed.embeddedParams["userId"]);
            return {} as unknown as T;
          }
          throw new StorageAdapterError(
            `Validation error: DELETE ${endpoint} requires a target document ID or userId.`,
            {
              status: 400,
              code: "invalid-argument",
              category: "validation",
            }
          );
        }
        const userId = await this.resolveUserIdForCartDocId(
          docId,
          parsed.embeddedParams["userId"]
        );
        await legacyAdapter.removeFromCart(userId, docId);
        return {} as unknown as T;
      }

      if (parsed.resource === "addresses") {
        const legacyAdapter = this.getLegacyCartAddressAdapter();
        if (!docId) {
          throw new StorageAdapterError(
            `Validation error: DELETE ${endpoint} requires a target document ID.`,
            {
              status: 400,
              code: "invalid-argument",
              category: "validation",
            }
          );
        }
        const userId = await this.resolveUserIdForAddressId(
          docId,
          parsed.embeddedParams["userId"]
        );
        await legacyAdapter.deleteAddress(userId, docId);
        return {} as unknown as T;
      }
    }

    if (!docId) {
      throw new StorageAdapterError(
        `Validation error: DELETE ${endpoint} requires a target document ID.`,
        {
          status: 400,
          code: "invalid-argument",
          category: "validation",
        }
      );
    }

    await this.driver.deleteDoc(parsed.resource, docId);
    return {} as unknown as T;
  }
}

export const firestoreAdapter = new FirestoreAdapter();
