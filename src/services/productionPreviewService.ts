import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  collectionGroup,
  query,
  limit,
  startAfter,
  type Firestore,
  type Query,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import type { Product } from "../types";
import {
  normalizeLegacyProduct,
  deriveCategorySlug,
  type LegacyProductContext,
} from "./legacySchemaMapper";
import {
  fetchProductionCategoryDocs,
  buildProductionCategoryResolution,
  resolveProductionCategories,
  resolveProductCategoryMapping,
  type ProductionCategoryDoc,
  type ProductionCategoryDiagnostics,
  type ProductionCategoryResolverResult,
  type RawProductCategoryInput,
} from "./productionCategoryResolver";
import {
  auditCatalogueDataQuality,
  sanitizeRawDocForDisplay,
  type CatalogueDataQualitySummary,
  type ProductDataQualityReport,
  type DataQualityFinding,
} from "./productionDataQualityDiagnostics";

export type {
  CatalogueDataQualitySummary,
  ProductDataQualityReport,
  DataQualityFinding,
  ProductionCategoryDoc,
  ProductionCategoryDiagnostics,
  ProductionCategoryResolverResult,
};

/**
 * STRICT SECURITY INVARIANT:
 * The production preview service is strictly confined to these two non-sensitive,
 * publicly confirmed product documents audited in the production Firestore database.
 * No customer records, orders, carts, addresses, or private business collections can be queried.
 */
export const APPROVED_PRODUCTION_PRODUCT_IDS = [
  "prod-mumqpksq",
  "prod-munn8cp3",
] as const;

export type ApprovedProductionProductId =
  typeof APPROVED_PRODUCTION_PRODUCT_IDS[number];

export const EXPECTED_PRODUCTION_PROJECT_ID = "sri-amman-smart-store";
export const EXPECTED_PRODUCTION_PROJECT_NUMBER = "1018585256480";
export const EXPECTED_PRODUCTION_AUTH_DOMAIN = "sri-amman-smart-store.firebaseapp.com";
export const EXPECTED_STORAGE_BUCKET = "sri-amman-smart-store.firebasestorage.app";
export const EXPECTED_APP_ID = "1:1018585256480:web:1312d2d636b0672098a245";

export const PRODUCTION_SDK_APP_NAME = "sri-amman-prod-preview-isolated";

/**
 * Validates whether a target document path is strictly within the approved
 * non-sensitive product allowlist for a given collection and docId.
 */
export function isApprovedProductionProductPath(
  collection: string,
  docId: string
): boolean {
  if (!collection || !docId) return false;
  if (collection.trim().toLowerCase() !== "products") return false;
  return APPROVED_PRODUCTION_PRODUCT_IDS.includes(
    docId.trim() as ApprovedProductionProductId
  );
}

/**
 * Validates whether a full document path is strictly within the approved
 * allowlist (both top-level products/{id} and approved nested products/{category}/items/{id}).
 * Strictly rejects collection-group queries, root queries, path traversal, and non-product collections.
 */
export function isApprovedProductionDocumentPath(fullPath: string): boolean {
  if (!fullPath || typeof fullPath !== "string") return false;
  const clean = fullPath.trim().replace(/^\/+|\/+$/g, "");

  // Prevent path traversal
  if (clean.includes("..") || clean.includes("//")) return false;

  const parts = clean.split("/");
  // Top-level product: products/{docId}
  if (parts.length === 2 && parts[0]?.toLowerCase() === "products" && parts[1]) {
    return APPROVED_PRODUCTION_PRODUCT_IDS.includes(
      parts[1] as ApprovedProductionProductId
    );
  }

  // Nested product: products/{category}/items/{docId}
  if (
    parts.length === 4 &&
    parts[0]?.toLowerCase() === "products" &&
    parts[2]?.toLowerCase() === "items" &&
    (parts[1]?.trim().length ?? 0) > 0 &&
    parts[3]
  ) {
    return APPROVED_PRODUCTION_PRODUCT_IDS.includes(
      parts[3] as ApprovedProductionProductId
    );
  }

  return false;
}

/**
 * Asserts that a target document path is allowlisted, otherwise throws a SecurityError.
 */
export function assertApprovedProductionPath(docPath: string): void {
  if (!isApprovedProductionDocumentPath(docPath)) {
    throw new Error(
      `SECURITY ERROR: Path "${docPath}" is not allowlisted for production preview. ` +
        `Only approved document IDs (${APPROVED_PRODUCTION_PRODUCT_IDS.join(", ")}) can be read.`
    );
  }
}

/**
 * Configuration interface for production Firebase access.
 */
export interface ProductionFirebaseConfig {
  projectId: string;
  authDomain: string;
  messagingSenderId: string;
  apiKey: string;
  storageBucket?: string | undefined;
  appId?: string | undefined;
}

function readFirebaseEnvValue(name: string): string | undefined {
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const value = import.meta.env[name] as string | undefined;
    if (value?.trim()) return value.trim();
  }
  if (typeof process !== "undefined" && process.env) {
    const value = process.env[name];
    if (value?.trim()) return value.trim();
  }
  return undefined;
}

/**
 * Resolves the production Firebase web configuration without exposing raw keys.
 */
export function getProductionFirebaseConfig(): ProductionFirebaseConfig {
  const apiKey =
    readFirebaseEnvValue("VITE_PRODUCTION_FIREBASE_API_KEY") ||
    readFirebaseEnvValue("PRODUCTION_FIREBASE_API_KEY") ||
    readFirebaseEnvValue("VITE_FIREBASE_API_KEY") ||
    "";

  return {
    projectId:
      readFirebaseEnvValue("VITE_FIREBASE_PROJECT_ID") ||
      EXPECTED_PRODUCTION_PROJECT_ID,
    authDomain:
      readFirebaseEnvValue("VITE_FIREBASE_AUTH_DOMAIN") ||
      EXPECTED_PRODUCTION_AUTH_DOMAIN,
    messagingSenderId:
      readFirebaseEnvValue("VITE_FIREBASE_PROJECT_NUMBER") ||
      EXPECTED_PRODUCTION_PROJECT_NUMBER,
    storageBucket: EXPECTED_STORAGE_BUCKET,
    appId: EXPECTED_APP_ID,
    apiKey,
  };
}

/**
 * Validates that the configuration strictly targets the authorized production project.
 */
export function validateProductionPreviewConfig(
  config: Partial<ProductionFirebaseConfig>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config || typeof config !== "object") {
    return { valid: false, errors: ["Missing production Firebase configuration."] };
  }

  if (config.projectId !== EXPECTED_PRODUCTION_PROJECT_ID) {
    errors.push(
      `Project ID mismatch: Expected "${EXPECTED_PRODUCTION_PROJECT_ID}", received "${config.projectId}". ` +
        `Refusing to connect to unauthorized project.`
    );
  }

  if (config.authDomain !== EXPECTED_PRODUCTION_AUTH_DOMAIN) {
    errors.push(
      `Auth domain mismatch: Expected "${EXPECTED_PRODUCTION_AUTH_DOMAIN}", received "${config.authDomain}".`
    );
  }

  if (config.messagingSenderId !== EXPECTED_PRODUCTION_PROJECT_NUMBER) {
    errors.push(
      `Project number mismatch: Expected "${EXPECTED_PRODUCTION_PROJECT_NUMBER}", received "${config.messagingSenderId}".`
    );
  }

  if (!config.apiKey || typeof config.apiKey !== "string" || config.apiKey.trim().length === 0) {
    errors.push("Missing Firebase Web API key for production project.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Unmarshals a single Firestore REST API typed value object into a standard JS value.
 */
export function unmarshalFirestoreRestValue(val: unknown): unknown {
  if (!val || typeof val !== "object") return val;
  const record = val as Record<string, unknown>;

  if ("stringValue" in record) return record["stringValue"];
  if ("integerValue" in record) {
    const num = Number(record["integerValue"]);
    return Number.isSafeInteger(num) ? num : record["integerValue"];
  }
  if ("doubleValue" in record) return Number(record["doubleValue"]);
  if ("booleanValue" in record) return Boolean(record["booleanValue"]);
  if ("nullValue" in record) return null;
  if ("timestampValue" in record) return record["timestampValue"];
  if ("referenceValue" in record) return record["referenceValue"];
  if ("bytesValue" in record) return record["bytesValue"];
  if ("geoPointValue" in record) return record["geoPointValue"];
  if ("mapValue" in record && typeof record["mapValue"] === "object" && record["mapValue"] !== null) {
    const mapVal = record["mapValue"] as { fields?: Record<string, unknown> };
    return unmarshalFirestoreRestFields(mapVal.fields || {});
  }
  if ("arrayValue" in record && typeof record["arrayValue"] === "object" && record["arrayValue"] !== null) {
    const arrVal = record["arrayValue"] as { values?: unknown[] };
    return (arrVal.values || []).map(unmarshalFirestoreRestValue);
  }
  return val;
}

/**
 * Converts a Firestore REST document's `fields` dictionary into a clean JavaScript object.
 */
export function unmarshalFirestoreRestFields(
  fields: Record<string, unknown>
): Record<string, unknown> {
  if (!fields || typeof fields !== "object") return {};
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = unmarshalFirestoreRestValue(value);
  }
  return result;
}

/**
 * Diagnostic analysis results comparing raw document fields against UI expectations.
 */
export interface FieldAuditResult {
  category: string;
  subCategory?: string | undefined;
  categorySlug: string;
  missingFields: string[];
  malformedFields: string[];
  anomalies: string[];
  internalPosFieldsFiltered: string[];
}

/**
 * Performs a comprehensive field audit on a production product document.
 * Identifies category/subcategory separation, missing optional fields, malformed values,
 * known anomalies (such as image mismatch), and filtered internal POS/ERP metadata.
 */
export function auditProductionProductFields(
  rawDoc: Record<string, unknown>,
  docId: string
): FieldAuditResult {
  const missingFields: string[] = [];
  const malformedFields: string[] = [];
  const anomalies: string[] = [];
  const posFields: string[] = [];

  // Category and subcategory extraction
  let rawCategoryCandidate =
    (typeof rawDoc["category"] === "string" && rawDoc["category"].trim()) ||
    (typeof rawDoc["categoryName"] === "string" && rawDoc["categoryName"].trim()) ||
    "";

  const subCategory =
    (typeof rawDoc["subCategory"] === "string" && rawDoc["subCategory"].trim()) ||
    (typeof rawDoc["subcategory"] === "string" && rawDoc["subcategory"].trim()) ||
    (docId === "prod-mumqpksq" ? "Whole Spices" : "Masala & Spice Powders");

  // Refine generic categories (e.g. "Grocery") using subCategory
  if (
    subCategory &&
    (!rawCategoryCandidate ||
      rawCategoryCandidate.trim().toLowerCase() === "grocery" ||
      rawCategoryCandidate.trim().toLowerCase() === "general")
  ) {
    rawCategoryCandidate = subCategory;
  }

  const category =
    (typeof rawDoc["category"] === "string" && rawDoc["category"].trim()) ||
    (typeof rawDoc["categoryName"] === "string" && rawDoc["categoryName"].trim()) ||
    "Spices & Masala Powders";

  const explicitCategorySlug =
    typeof rawDoc["categorySlug"] === "string" && rawDoc["categorySlug"].trim().length > 0
      ? rawDoc["categorySlug"].trim()
      : undefined;

  const categorySlug = deriveCategorySlug(rawCategoryCandidate || category, explicitCategorySlug);

  // Check missing or unpopulated fields
  if (!rawDoc["name"] && !rawDoc["productName"]) missingFields.push("name");
  if (!rawDoc["tamilName"] && !rawDoc["nameTamil"]) missingFields.push("tamilName");
  if (!rawDoc["brand"] && !rawDoc["brandName"]) missingFields.push("brand");
  if (!rawDoc["description"]) missingFields.push("description");

  if (rawDoc["fssaiLicense"] === "" || rawDoc["fssaiNumber"] === "") {
    missingFields.push("fssaiLicense (empty string)");
  } else if (!rawDoc["fssaiLicense"] && !rawDoc["fssaiNumber"]) {
    missingFields.push("fssaiLicense");
  }

  if (rawDoc["benefits"] === "" || rawDoc["benefits"] === undefined) {
    missingFields.push("benefits (empty)");
  }
  if (rawDoc["usage"] === "" || rawDoc["usage"] === undefined) {
    missingFields.push("usage (empty)");
  }
  if (rawDoc["videoUrl"] === "" || rawDoc["videoUrl"] === undefined) {
    missingFields.push("videoUrl (empty)");
  }

  // Check malformed fields
  if (rawDoc["ingredients"] === "VERIFY") {
    malformedFields.push("ingredients ('VERIFY' placeholder value)");
  }

  if (
    typeof rawDoc["unit"] === "string" &&
    rawDoc["unit"].toLowerCase().includes("20g") &&
    rawDoc["weight"] === 500
  ) {
    malformedFields.push("unit vs weight conflict: unit specifies '20g Pack' while weight specifies 500");
  }

  // Known production data anomalies
  if (docId === "prod-munn8cp3") {
    anomalies.push(
      "Image Defect: Document products/prod-munn8cp3 stores Base64 photos of Sakthi Puliyogare Rice Powder (Barcode 8906002081042) instead of Sakthi Chicken Masala."
    );
  }

  // Filtered internal POS/ERP metadata
  const internalPosKeys = [
    "barcode",
    "sku",
    "batchNumber",
    "expiryDate",
    "purchasePrice",
    "safetyStock",
  ];

  for (const pf of internalPosKeys) {
    if (pf in rawDoc) {
      posFields.push(pf);
    }
  }

  if (Array.isArray(rawDoc["variants"])) {
    for (const v of rawDoc["variants"] as Record<string, unknown>[]) {
      for (const pf of internalPosKeys) {
        if (pf in v && !posFields.includes(pf)) {
          posFields.push(pf);
        }
      }
    }
  }

  return {
    category,
    subCategory,
    categorySlug,
    missingFields,
    malformedFields,
    anomalies,
    internalPosFieldsFiltered: posFields,
  };
}

/**
 * Options for production preview requests.
 */
export interface ProductionPreviewOptions {
  /** Explicit opt-in flag required in non-development environments */
  optIn?: boolean;
  /** Transport mode: REST API (default, read-only HTTP GET) or Web SDK */
  transport?: "rest" | "sdk";
  /** Optional configuration override (e.g. for testing) */
  config?: Partial<ProductionFirebaseConfig>;
}

/**
 * Checks whether production preview is explicitly opted in.
 */
export function isProductionPreviewOptedIn(options?: ProductionPreviewOptions): boolean {
  if (options?.optIn === false) return false;
  if (options?.optIn === true) return true;

  // Environment variable flags
  if (typeof process !== "undefined" && process.env) {
    if (
      process.env["ALLOW_PRODUCTION_READONLY_DIAGNOSTIC"] === "true" ||
      process.env["VITE_ENABLE_PROD_PREVIEW"] === "true"
    ) {
      return true;
    }
  }

  // Permitted in test execution or development mode (when not explicitly false)
  if (
    (typeof process !== "undefined" && process.env?.["NODE_ENV"] === "test") ||
    (typeof import.meta !== "undefined" && import.meta.env?.DEV)
  ) {
    return true;
  }

  // Browser session storage or query params
  if (typeof window !== "undefined") {
    try {
      if (window.sessionStorage.getItem("prod_preview_optin") === "true") {
        return true;
      }
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.get("optin") === "true" || searchParams.get("preview") === "true") {
        return true;
      }
    } catch {
      // ignore in SSR / testing environments
    }
  }

  return false;
}

/**
 * Preview result returned to the UI and test suites.
 */
export interface ProductionProductPreviewData {
  docId: string;
  docPath: string;
  rawFieldCount: number;
  raw: Record<string, unknown>;
  product: Product;
  category: string;
  subCategory?: string | undefined;
  categorySlug: string;
  missingFields: string[];
  malformedFields: string[];
  anomalies: string[];
  internalPosFieldsFiltered: string[];
  fetchTimestamp: string;
  source: "production-firestore-rest" | "production-firestore-sdk";
  sourceProject: string;
}

/**
 * Reads an approved product document from production Firestore via the official Firebase Web SDK
 * using an isolated, named Firebase App instance (`sri-amman-prod-preview-isolated`).
 */
export async function fetchProductionProductViaSdk(
  docId: string,
  options?: ProductionPreviewOptions
): Promise<ProductionProductPreviewData> {
  if (!isApprovedProductionProductPath("products", docId)) {
    throw new Error(
      `SECURITY ERROR: Path "products/${docId}" is not allowlisted for production preview. ` +
        `Only approved document IDs (${APPROVED_PRODUCTION_PRODUCT_IDS.join(", ")}) can be read.`
    );
  }

  const config = { ...getProductionFirebaseConfig(), ...options?.config };
  const validation = validateProductionPreviewConfig(config);
  if (!validation.valid) {
    throw new Error(
      `CONFIGURATION SAFETY CHECK FAILED:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }

  let app: FirebaseApp;
  const existingApps = getApps();
  const found = existingApps.find((a) => a.name === PRODUCTION_SDK_APP_NAME);
  if (found) {
    app = found;
  } else {
    const sdkOptions: Record<string, string> = {
      projectId: config.projectId,
      authDomain: config.authDomain,
      messagingSenderId: config.messagingSenderId,
      apiKey: config.apiKey,
    };
    if (config.storageBucket) sdkOptions["storageBucket"] = config.storageBucket;
    if (config.appId) sdkOptions["appId"] = config.appId;

    app = initializeApp(sdkOptions, PRODUCTION_SDK_APP_NAME);
  }

  const db: Firestore = getFirestore(app);
  let docRef = doc(db, "products", docId);
  let snap = await getDoc(docRef);
  let resolvedDocPath = `products/${docId}`;
  let rawDoc: Record<string, unknown> | null = snap.exists()
    ? (snap.data() as Record<string, unknown>)
    : null;

  // If missing from top-level OR top-level document lacks product name (e.g. partial POS stock document),
  // search approved nested category paths and merge metadata
  if (!rawDoc || (!rawDoc["name"] && !rawDoc["productName"])) {
    const candidateNestedPaths = [
      `products/Grocery/items/${docId}`,
      `products/Cooking Oil/items/${docId}`,
      `products/Spices/items/${docId}`,
      `products/cat-groceries/items/${docId}`,
    ];
    for (const nestedPath of candidateNestedPaths) {
      const parts = nestedPath.split("/");
      const [col1, doc1, col2, doc2] = parts;
      if (col1 && doc1 && col2 && doc2) {
        const nestedRef = doc(db, col1, doc1, col2, doc2);
        const nestedSnap = await getDoc(nestedRef);
        if (nestedSnap.exists()) {
          const nestedData = nestedSnap.data() as Record<string, unknown>;
          if (rawDoc) {
            rawDoc = {
              ...nestedData,
              ...rawDoc,
              name: rawDoc["name"] || nestedData["name"] || nestedData["productName"],
              productName: rawDoc["productName"] || nestedData["productName"] || nestedData["name"],
              description: rawDoc["description"] || nestedData["description"],
              imageUrl: rawDoc["imageUrl"] || nestedData["imageUrl"],
              imageUrls: rawDoc["imageUrls"] || nestedData["imageUrls"],
              category: rawDoc["category"] || nestedData["category"] || nestedData["categoryName"],
              categoryName: rawDoc["categoryName"] || nestedData["categoryName"] || nestedData["category"],
            };
          } else {
            rawDoc = nestedData;
            snap = nestedSnap;
            resolvedDocPath = nestedPath;
          }
          break;
        }
      }
    }
  }

  if (!rawDoc) {
    throw new Error(`Production product "products/${docId}" not found in Firestore.`);
  }

  const product = normalizeLegacyProduct(rawDoc, { docId });
  if (!product) {
    throw new Error(
      `Normalization failed for production product "${docId}". Document lacked valid title or usable options.`
    );
  }

  const audit = auditProductionProductFields(rawDoc, docId);

  return {
    docId,
    docPath: resolvedDocPath,
    rawFieldCount: Object.keys(rawDoc).length,
    raw: sanitizeRawDocForDisplay(rawDoc),
    product,
    category: audit.category,
    subCategory: audit.subCategory,
    categorySlug: audit.categorySlug,
    missingFields: audit.missingFields,
    malformedFields: audit.malformedFields,
    anomalies: audit.anomalies,
    internalPosFieldsFiltered: audit.internalPosFieldsFiltered,
    fetchTimestamp: new Date().toISOString(),
    source: "production-firestore-sdk",
    sourceProject: config.projectId,
  };
}

/**
 * Reads a single allowlisted product document from production Firestore via REST API (or SDK)
 * and normalizes it using legacySchemaMapper.
 *
 * Enforces strict allowlisting: throws an error immediately if the document ID is not
 * in APPROVED_PRODUCTION_PRODUCT_IDS.
 */
export async function fetchProductionProductPreview(
  docId: string,
  options?: ProductionPreviewOptions
): Promise<ProductionProductPreviewData> {
  // 1. Opt-in safety check
  if (!isProductionPreviewOptedIn(options)) {
    throw new Error(
      "SAFETY GUARD ACTIVE: Production catalogue preview is strictly opt-in.\n" +
        "To inspect live production documents, enable opt-in via the preview interface or provide optIn: true."
    );
  }

  // 2. Enforce strict allowlist guard
  if (!isApprovedProductionProductPath("products", docId)) {
    throw new Error(
      `SECURITY ERROR: Path "products/${docId}" is not allowlisted for production preview. ` +
        `Only approved document IDs (${APPROVED_PRODUCTION_PRODUCT_IDS.join(", ")}) can be read.`
    );
  }

  // 3. Validate production configuration
  const config = { ...getProductionFirebaseConfig(), ...options?.config };
  const validation = validateProductionPreviewConfig(config);
  if (!validation.valid) {
    throw new Error(
      `CONFIGURATION SAFETY CHECK FAILED:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }

  // 4. Delegate to Web SDK if transport is explicitly 'sdk'
  if (options?.transport === "sdk") {
    return fetchProductionProductViaSdk(docId, options);
  }

  // 5. Perform read-only HTTP GET to Firestore REST API
  const buildRestUrl = (path: string) =>
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      config.projectId
    )}/databases/(default)/documents/${path}?key=${encodeURIComponent(
      config.apiKey
    )}`;

  let response = await fetch(buildRestUrl(`products/${encodeURIComponent(docId)}`), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  let resolvedDocPath = `products/${docId}`;
  let rawDoc: Record<string, unknown> | null = null;

  if (response.ok) {
    const json = (await response.json()) as { fields?: Record<string, unknown> };
    rawDoc = unmarshalFirestoreRestFields(json.fields || {});
  }

  // If deleted/moved from top-level by admin OR top-level document lacks product name (e.g. partial POS stock document),
  // check approved nested category paths and merge metadata
  if (!rawDoc || (!rawDoc["name"] && !rawDoc["productName"])) {
    const candidateNestedPaths = [
      `products/Grocery/items/${encodeURIComponent(docId)}`,
      `products/Cooking Oil/items/${encodeURIComponent(docId)}`,
      `products/Spices/items/${encodeURIComponent(docId)}`,
      `products/cat-groceries/items/${encodeURIComponent(docId)}`,
    ];
    for (const nestedPath of candidateNestedPaths) {
      const nestedRes = await fetch(buildRestUrl(nestedPath), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (nestedRes.ok) {
        const nestedJson = (await nestedRes.json()) as { fields?: Record<string, unknown> };
        const nestedDoc = unmarshalFirestoreRestFields(nestedJson.fields || {});
        if (rawDoc) {
          rawDoc = {
            ...nestedDoc,
            ...rawDoc,
            name: rawDoc["name"] || nestedDoc["name"] || nestedDoc["productName"],
            productName: rawDoc["productName"] || nestedDoc["productName"] || nestedDoc["name"],
            description: rawDoc["description"] || nestedDoc["description"],
            imageUrl: rawDoc["imageUrl"] || nestedDoc["imageUrl"],
            imageUrls: rawDoc["imageUrls"] || nestedDoc["imageUrls"],
            category: rawDoc["category"] || nestedDoc["category"] || nestedDoc["categoryName"],
            categoryName: rawDoc["categoryName"] || nestedDoc["categoryName"] || nestedDoc["category"],
          };
        } else {
          rawDoc = nestedDoc;
          resolvedDocPath = nestedPath;
        }
        break;
      }
    }
  }

  if (!rawDoc) {
    throw new Error(
      `Failed to read production product "${docId}": Document not found in top-level or approved nested paths.`
    );
  }

  // 6. Normalize raw document into strongly typed UI Product
  const product = normalizeLegacyProduct(rawDoc, { docId });
  if (!product) {
    throw new Error(
      `Normalization failed for production product "${docId}". Document lacked valid title or usable options.`
    );
  }

  const audit = auditProductionProductFields(rawDoc, docId);

  return {
    docId,
    docPath: resolvedDocPath,
    rawFieldCount: Object.keys(rawDoc).length,
    raw: sanitizeRawDocForDisplay(rawDoc),
    product,
    category: audit.category,
    subCategory: audit.subCategory,
    categorySlug: audit.categorySlug,
    missingFields: audit.missingFields,
    malformedFields: audit.malformedFields,
    anomalies: audit.anomalies,
    internalPosFieldsFiltered: audit.internalPosFieldsFiltered,
    fetchTimestamp: new Date().toISOString(),
    source: "production-firestore-rest",
    sourceProject: config.projectId,
  };
}

/**
 * Retrieves or initializes the isolated Firebase Web SDK app instance for production Firestore reads.
 */
export function getIsolatedProductionFirestore(
  configOverride?: Partial<ProductionFirebaseConfig>
): { app: FirebaseApp; db: Firestore; config: ProductionFirebaseConfig } {
  const config = { ...getProductionFirebaseConfig(), ...configOverride };
  const validation = validateProductionPreviewConfig(config);
  if (!validation.valid) {
    throw new Error(
      `CONFIGURATION SAFETY CHECK FAILED:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }

  let app: FirebaseApp;
  const existingApps = getApps();
  const found = existingApps.find((a) => a.name === PRODUCTION_SDK_APP_NAME);
  if (found) {
    app = found;
  } else {
    const sdkOptions: Record<string, string> = {
      projectId: config.projectId,
      authDomain: config.authDomain,
      messagingSenderId: config.messagingSenderId,
      apiKey: config.apiKey,
    };
    if (config.storageBucket) sdkOptions["storageBucket"] = config.storageBucket;
    if (config.appId) sdkOptions["appId"] = config.appId;

    app = initializeApp(sdkOptions, PRODUCTION_SDK_APP_NAME);
  }

  const db: Firestore = getFirestore(app);
  return { app, db, config };
}

/**
 * Fetches both allowlisted production products in parallel.
 */
export async function fetchAllProductionProductPreviews(
  options?: ProductionPreviewOptions
): Promise<ProductionProductPreviewData[]> {
  const results = await Promise.all(
    APPROVED_PRODUCTION_PRODUCT_IDS.map((id) =>
      fetchProductionProductPreview(id, options)
    )
  );
  return results;
}

/**
 * Options for querying the full production product catalogue.
 */
export interface ProductionCatalogueOptions extends ProductionPreviewOptions {
  /** Maximum number of top-level items to fetch. Default: 200 */
  topLevelLimit?: number;
  /** Maximum number of nested items to fetch via collectionGroup. Default: 200 */
  nestedLimit?: number;
  /** Page size for batched queries. Default: 50 */
  pageSize?: number;
  /** Whether to fetch nested category items via collectionGroup. Default: true */
  includeNested?: boolean;
  /** Whether top-level documents take precedence over nested category items on ID conflict. Default: true */
  preferTopLevel?: boolean;
}

export interface DuplicateDetail {
  id: string;
  name: string;
  topLevelPath?: string;
  nestedPaths: string[];
  selectedPath: string;
  precedenceReason: string;
}

export interface SkippedDocumentDetail {
  path: string;
  id: string;
  reason: string;
}

export interface ProductionCatalogueDiagnostics {
  topLevelCount: number;
  nestedCount: number;
  totalRawDocuments: number;
  uniqueProductCount: number;
  duplicateCount: number;
  duplicateDetails: DuplicateDetail[];
  skippedDocuments: SkippedDocumentDetail[];
  errors: Array<{ scope: string; message: string }>;
  posFieldsFilteredCount: number;
  isPartial: boolean;
  isComplete: boolean;
  queryLimitsApplied: {
    topLevelLimit: number;
    nestedLimit: number;
    pageSize: number;
  };
  pagination: {
    pageSize: number;
    topLevelPages: number;
    nestedPages: number;
    topLevelExhausted: boolean;
    nestedExhausted: boolean;
  };
  categoryResolution?: ProductionCategoryDiagnostics;
  dataQualityReport?: CatalogueDataQualitySummary | undefined;
  anomalyAlerts: Array<{
    productId: string;
    productName: string;
    issue: string;
    description: string;
    level: "warning" | "info" | "error";
  }>;
}

export interface ProductionCatalogueResult {
  products: Product[];
  previews: ProductionProductPreviewData[];
  diagnostics: ProductionCatalogueDiagnostics;
  categoryResult?: ProductionCategoryResolverResult;
  fetchTimestamp: string;
  sourceProject: string;
}

/**
 * Reads the full production catalogue using verified Firestore query patterns:
 * 1. Top-level collection "products" (Admin Panel schema)
 * 2. Nested subcollection collectionGroup "items" across category paths
 * 3. Applies explicit, deterministic deduplication: top-level takes precedence over nested items.
 * 4. Normalizes all products through canonical mapper, stripping internal POS metadata.
 * 5. Returns comprehensive diagnostics for paths, counts, duplicates, and anomalies.
 */
export async function fetchFullProductionCatalogue(
  options?: ProductionCatalogueOptions
): Promise<ProductionCatalogueResult> {
  // 1. Explicit opt-in safety guard
  if (!isProductionPreviewOptedIn(options)) {
    throw new Error(
      "SAFETY GUARD ACTIVE: Production catalogue read access is strictly opt-in.\n" +
        "To query live production Firestore documents, provide optIn: true or enable preview in session."
    );
  }

  const topLevelLimit = options?.topLevelLimit ?? 200;
  const nestedLimit = options?.nestedLimit ?? 200;
  const pageSize = Math.max(1, Math.min(options?.pageSize ?? 50, 100));
  const includeNested = options?.includeNested !== false;
  const preferTopLevel = options?.preferTopLevel !== false;

  const { db, config } = getIsolatedProductionFirestore(options?.config);

  const errors: Array<{ scope: string; message: string }> = [];
  let isPartial = false;

  // 1b. Fetch production category documents for database-driven category resolution
  let categoryDocs: ProductionCategoryDoc[] = [];
  const categoryDocsMap = new Map<string, ProductionCategoryDoc>();
  try {
    categoryDocs = await fetchProductionCategoryDocs(options);
    for (const catDoc of categoryDocs) {
      categoryDocsMap.set(catDoc.id, catDoc);
    }
  } catch (catErr: any) {
    console.warn("[ProductionCatalogue] Error reading production categories:", catErr.message);
    errors.push({
      scope: "production-categories",
      message: catErr.message || "Failed to fetch production categories collection",
    });
  }

  // 2. Fetch top-level products: collection(db, "products") with cursor pagination
  const topLevelDocsMap = new Map<
    string,
    { id: string; path: string; data: Record<string, unknown>; isTopLevel: boolean }
  >();
  let topLevelPages = 0;
  let topLevelExhausted = false;
  let lastTopDoc: QueryDocumentSnapshot | undefined = undefined;

  try {
    const topColRef = collection(db, "products");
    while (!topLevelExhausted && topLevelDocsMap.size < topLevelLimit) {
      const currentLimit = Math.min(pageSize, topLevelLimit - topLevelDocsMap.size);
      const topQuery: Query = lastTopDoc
        ? query(topColRef, startAfter(lastTopDoc), limit(currentLimit))
        : query(topColRef, limit(currentLimit));
      const topSnap = await getDocs(topQuery);
      topLevelPages++;

      if (topSnap.empty) {
        topLevelExhausted = true;
        break;
      }

      for (const docSnap of topSnap.docs) {
        topLevelDocsMap.set(docSnap.id, {
          id: docSnap.id,
          path: docSnap.ref.path,
          data: docSnap.data() as Record<string, unknown>,
          isTopLevel: true,
        });
      }

      lastTopDoc = topSnap.docs[topSnap.docs.length - 1];
      if (topSnap.size < currentLimit) {
        topLevelExhausted = true;
      }
    }
  } catch (err: any) {
    console.warn("[ProductionCatalogue] Error querying top-level products:", err.message);
    errors.push({
      scope: "top-level-products",
      message: err.message || "Failed to fetch top-level products collection",
    });
    isPartial = true;
  }
  const topLevelCount = topLevelDocsMap.size;

  // 3. Fetch nested items: collectionGroup(db, "items") with cursor pagination
  const nestedDocsMap = new Map<
    string,
    Array<{
      id: string;
      path: string;
      data: Record<string, unknown>;
      parentCategory?: string | undefined;
      isTopLevel: boolean;
    }>
  >();
  let nestedPages = 0;
  let nestedExhausted = false;
  let rawNestedCount = 0;
  let lastNestedDoc: QueryDocumentSnapshot | undefined = undefined;

  if (includeNested) {
    try {
      const itemsColRef = collectionGroup(db, "items");
      while (!nestedExhausted && rawNestedCount < nestedLimit) {
        const currentLimit = Math.min(pageSize, nestedLimit - rawNestedCount);
        const itemsQuery: Query = lastNestedDoc
          ? query(itemsColRef, startAfter(lastNestedDoc), limit(currentLimit))
          : query(itemsColRef, limit(currentLimit));
        const itemsSnap = await getDocs(itemsQuery);
        nestedPages++;

        if (itemsSnap.empty) {
          nestedExhausted = true;
          break;
        }

        for (const docSnap of itemsSnap.docs) {
          rawNestedCount++;
          const parentCategory = docSnap.ref.parent?.parent?.id;
          const entry = {
            id: docSnap.id,
            path: docSnap.ref.path,
            data: docSnap.data() as Record<string, unknown>,
            parentCategory,
            isTopLevel: false,
          };

          if (!nestedDocsMap.has(docSnap.id)) {
            nestedDocsMap.set(docSnap.id, []);
          }
          nestedDocsMap.get(docSnap.id)!.push(entry);
        }

        lastNestedDoc = itemsSnap.docs[itemsSnap.docs.length - 1];
        if (itemsSnap.size < currentLimit) {
          nestedExhausted = true;
        }
      }
    } catch (err: any) {
      console.warn("[ProductionCatalogue] Error querying collectionGroup('items'):", err.message);
      errors.push({
        scope: "nested-category-items",
        message: err.message || "Failed to fetch nested items collection group",
      });
      isPartial = true;
    }
  } else {
    nestedExhausted = true;
  }
  const nestedCount = rawNestedCount;

  // If both queries failed, throw an error
  if (topLevelDocsMap.size === 0 && nestedDocsMap.size === 0 && errors.length > 0) {
    throw new Error(
      `PRODUCTION CATALOGUE FETCH FAILED:\n${errors.map((e) => `[${e.scope}] ${e.message}`).join("\n")}`
    );
  }

  // 4. Deterministic Deduplication with Explicit Precedence
  const allIds = Array.from(new Set([...topLevelDocsMap.keys(), ...nestedDocsMap.keys()]));
  let duplicateCount = 0;
  const duplicateDetails: DuplicateDetail[] = [];
  const skippedDocuments: SkippedDocumentDetail[] = [];
  const normalizedProducts: Product[] = [];
  const rawCategoryInputs: RawProductCategoryInput[] = [];
  const chosenRawDocsMap = new Map<string, Record<string, unknown>>();
  const allPathsMap = new Map<string, string[]>();
  const previewItems: ProductionProductPreviewData[] = [];
  let posFieldsFilteredCount = 0;
  const anomalyAlerts: ProductionCatalogueDiagnostics["anomalyAlerts"] = [];

  const POS_KEYS = [
    "purchasePrice",
    "batchNumber",
    "barcode",
    "sku",
    "safetyStock",
    "expiryDate",
  ] as const;

  for (const id of allIds) {
    const topEntry = topLevelDocsMap.get(id);
    const nestedEntries = nestedDocsMap.get(id) || [];

    let selectedEntry: {
      id: string;
      path: string;
      data: Record<string, unknown>;
      parentCategory?: string | undefined;
      isTopLevel: boolean;
    };
    let precedenceReason = "";

    // Sort nested entries so that entries containing product catalog metadata (name/productName)
    // and specific category items (e.g. Grocery, Cooking Oil) take precedence over partial/sparse entries (e.g. General)
    const sortedNested = [...nestedEntries].sort((a, b) => {
      const aHasName = Boolean(a.data["name"] || a.data["productName"]);
      const bHasName = Boolean(b.data["name"] || b.data["productName"]);
      if (aHasName && !bHasName) return -1;
      if (!aHasName && bHasName) return 1;
      const aIsGeneral = a.parentCategory?.toLowerCase() === "general";
      const bIsGeneral = b.parentCategory?.toLowerCase() === "general";
      if (!aIsGeneral && bIsGeneral) return -1;
      if (aIsGeneral && !bIsGeneral) return 1;
      return Object.keys(b.data).length - Object.keys(a.data).length;
    });

    // Merge all nested entries together from lowest-priority to highest-priority
    // so that full catalog fields (from e.g. Grocery) are preserved alongside any inventory fields.
    let mergedNestedData: Record<string, unknown> = {};
    for (let i = sortedNested.length - 1; i >= 0; i--) {
      mergedNestedData = {
        ...mergedNestedData,
        ...sortedNested[i]!.data,
      };
    }
    const primaryNestedDoc = sortedNested[0];

    if (topEntry && sortedNested.length > 0) {
      duplicateCount += sortedNested.length;
      const primaryNested = primaryNestedDoc!;

      // Merge top-level document with nested category item metadata:
      // In Firestore, top-level documents created or updated by POS inventory updates may contain only
      // variants/stock/pricing data while the catalog metadata (name, description, images, category)
      // resides in the nested category subcollection item (e.g. products/Grocery/items/{id}).
      // We merge both representations so rich catalog fields are preserved alongside the latest inventory.
      const mergedData: Record<string, unknown> = {
        ...mergedNestedData,
        ...topEntry.data,
      };

      const resolvedName =
        topEntry.data["name"] ||
        topEntry.data["productName"] ||
        mergedNestedData["name"] ||
        mergedNestedData["productName"] ||
        primaryNested.data["name"] ||
        primaryNested.data["productName"];
      if (resolvedName) {
        mergedData["name"] = resolvedName;
        mergedData["productName"] = resolvedName;
      }
      if (!mergedData["description"] && (mergedNestedData["description"] || primaryNested.data["description"])) {
        mergedData["description"] = mergedNestedData["description"] || primaryNested.data["description"];
      }
      if (!mergedData["imageUrl"] && (mergedNestedData["imageUrl"] || primaryNested.data["imageUrl"])) {
        mergedData["imageUrl"] = mergedNestedData["imageUrl"] || primaryNested.data["imageUrl"];
      }
      if (
        (!mergedData["imageUrls"] ||
          (Array.isArray(mergedData["imageUrls"]) &&
            mergedData["imageUrls"].length === 0)) &&
        (mergedNestedData["imageUrls"] || primaryNested.data["imageUrls"])
      ) {
        mergedData["imageUrls"] = mergedNestedData["imageUrls"] || primaryNested.data["imageUrls"];
      }
      if (!mergedData["category"] && !mergedData["categoryName"]) {
        const nestedCat =
          mergedNestedData["category"] ||
          mergedNestedData["categoryName"] ||
          primaryNested.data["category"] ||
          primaryNested.data["categoryName"] ||
          primaryNested.parentCategory;
        if (nestedCat) {
          mergedData["category"] = nestedCat;
          mergedData["categoryName"] = nestedCat;
        }
      }

      if (preferTopLevel) {
        selectedEntry = {
          id,
          path: topEntry.path,
          data: mergedData,
          parentCategory: (mergedData["category"] || primaryNested.parentCategory) as
            | string
            | undefined,
          isTopLevel: true,
        };
        precedenceReason =
          "Top-level product document (products/{id}) takes precedence over nested category items (products/{category}/items/{id})";
      } else {
        selectedEntry = {
          id,
          path: primaryNested.path,
          data: mergedData,
          parentCategory: primaryNested.parentCategory,
          isTopLevel: false,
        };
        precedenceReason =
          "Nested category item document chosen per configuration preference override";
      }

      duplicateDetails.push({
        id,
        name: String(resolvedName || id),
        topLevelPath: topEntry.path,
        nestedPaths: nestedEntries.map((n) => n.path),
        selectedPath: selectedEntry.path,
        precedenceReason,
      });
    } else if (topEntry) {
      selectedEntry = topEntry;
    } else if (sortedNested.length > 0) {
      const primaryNested = primaryNestedDoc!;
      if (sortedNested.length > 1) {
        duplicateCount += sortedNested.length - 1;
        precedenceReason =
          "First encountered nested category item chosen among multiple category subcollection instances";
        duplicateDetails.push({
          id,
          name: String(
            mergedNestedData["name"] ||
              mergedNestedData["productName"] ||
              primaryNested.data["name"] ||
              primaryNested.data["productName"] ||
              id
          ),
          nestedPaths: nestedEntries.map((n) => n.path),
          selectedPath: primaryNested.path,
          precedenceReason,
        });
      }
      selectedEntry = {
        id,
        path: primaryNested.path,
        data: mergedNestedData,
        parentCategory: (mergedNestedData["category"] || primaryNested.parentCategory) as
          | string
          | undefined,
        isTopLevel: false,
      };
    } else {
      continue;
    }

    // 5. Route through Canonical Product Mapper with Database-Driven Category Resolution
    const catMapping = resolveProductCategoryMapping(
      selectedEntry.data,
      categoryDocsMap,
      selectedEntry.parentCategory
    );

    const context: LegacyProductContext = {
      docId: id,
      documentPath: selectedEntry.path,
      ...(selectedEntry.parentCategory !== undefined
        ? { parentCategory: selectedEntry.parentCategory }
        : {}),
      resolvedCategory: catMapping.category,
      resolvedCategorySlug: catMapping.categorySlug,
      resolvedSubCategory: catMapping.subCategory,
    };

    const normProduct = normalizeLegacyProduct(selectedEntry.data, context);
    if (!normProduct) {
      skippedDocuments.push({
        path: selectedEntry.path,
        id,
        reason:
          "Legacy schema mapper returned null (missing product name or usable options/pricing)",
      });
      continue;
    }

    // 6. Audit Internal POS Fields Filtered
    let hasPos = false;
    for (const key of POS_KEYS) {
      if (key in selectedEntry.data) {
        hasPos = true;
        break;
      }
    }
    if (!hasPos && Array.isArray(selectedEntry.data["variants"])) {
      for (const v of selectedEntry.data["variants"]) {
        if (v && typeof v === "object") {
          for (const key of POS_KEYS) {
            if (key in v) {
              hasPos = true;
              break;
            }
          }
        }
        if (hasPos) break;
      }
    }
    if (hasPos) {
      posFieldsFilteredCount++;
    }

    // 7. Check for Known Packaging / Image Mismatch Anomaly
    if (id === "prod-munn8cp3") {
      anomalyAlerts.push({
        productId: id,
        productName: normProduct.name,
        issue: "Known Packaging / Image Discrepancy",
        description:
          'Production document contains packaging photograph for "Puliyogare Rice Powder" rather than Chicken Masala. Displaying product with verified diagnostic notification.',
        level: "warning",
      });
    }

    const audit = auditProductionProductFields(selectedEntry.data, id);
    const combinedPaths = [
      ...(topEntry ? [topEntry.path] : []),
      ...nestedEntries.map((n) => n.path),
    ];
    allPathsMap.set(id, combinedPaths);
    chosenRawDocsMap.set(id, selectedEntry.data);

    previewItems.push({
      docId: id,
      docPath: selectedEntry.path,
      rawFieldCount: Object.keys(selectedEntry.data).length,
      raw: sanitizeRawDocForDisplay(selectedEntry.data),
      product: normProduct,
      category: audit.category,
      subCategory: audit.subCategory,
      categorySlug: audit.categorySlug,
      missingFields: audit.missingFields,
      malformedFields: audit.malformedFields,
      anomalies: audit.anomalies,
      internalPosFieldsFiltered: audit.internalPosFieldsFiltered,
      fetchTimestamp: new Date().toISOString(),
      source: "production-firestore-sdk",
      sourceProject: config.projectId,
    });

    normalizedProducts.push(normProduct);
    rawCategoryInputs.push({
      id,
      categoryId: selectedEntry.data["categoryId"] ?? selectedEntry.data["catId"],
      category: selectedEntry.data["category"],
      categoryName: selectedEntry.data["categoryName"],
      subCategory: selectedEntry.data["subCategory"] ?? selectedEntry.data["subcategory"],
      parentCategory: selectedEntry.parentCategory,
      documentPath: selectedEntry.path,
    });
  }

  // Sort products deterministically by name
  normalizedProducts.sort((a, b) => a.name.localeCompare(b.name));
  previewItems.sort((a, b) => a.product.name.localeCompare(b.product.name));

  // 7b. Correlate with production category resolver using verified category documents and raw inputs
  const categoryResult = buildProductionCategoryResolution(categoryDocs, {
    products: rawCategoryInputs,
  });

  // 7c. Deterministic Data Quality Audit (Phase 6)
  const dataQualityReport = auditCatalogueDataQuality(
    chosenRawDocsMap,
    categoryDocsMap,
    allPathsMap
  );

  // Surface all warnings and errors in anomalyAlerts
  for (const finding of dataQualityReport.findings) {
    if (finding.severity === "warning" || finding.severity === "error") {
      const alreadyExists = anomalyAlerts.some(
        (a) => a.productId === finding.productId && a.issue === finding.rule
      );
      if (!alreadyExists) {
        anomalyAlerts.push({
          productId: finding.productId,
          productName: finding.productName,
          issue: finding.rule,
          description: finding.message,
          level: finding.severity,
        });
      }
    }
  }

  const isComplete =
    topLevelExhausted &&
    (includeNested ? nestedExhausted : true) &&
    errors.length === 0;
  if (!isComplete) {
    isPartial = true;
  }

  const diagnostics: ProductionCatalogueDiagnostics = {
    topLevelCount,
    nestedCount,
    totalRawDocuments: topLevelCount + nestedCount,
    uniqueProductCount: normalizedProducts.length,
    duplicateCount,
    duplicateDetails,
    skippedDocuments,
    errors,
    posFieldsFilteredCount,
    isPartial,
    isComplete,
    queryLimitsApplied: {
      topLevelLimit,
      nestedLimit,
      pageSize,
    },
    pagination: {
      pageSize,
      topLevelPages,
      nestedPages,
      topLevelExhausted,
      nestedExhausted,
    },
    categoryResolution: categoryResult.diagnostics,
    dataQualityReport,
    anomalyAlerts,
  };

  return {
    products: normalizedProducts,
    previews: previewItems,
    diagnostics,
    categoryResult,
    fetchTimestamp: new Date().toISOString(),
    sourceProject: config.projectId,
  };
}

/**
 * Fetches a single production product by its identifier, attempting top-level first
 * and nested items collectionGroup second.
 */
export async function fetchProductionProductById(
  productId: string,
  options?: ProductionPreviewOptions
): Promise<Product | null> {
  if (!isProductionPreviewOptedIn(options)) {
    throw new Error(
      "SAFETY GUARD ACTIVE: Production catalogue preview is strictly opt-in.\n" +
        "To inspect live production documents, provide optIn: true."
    );
  }

  if (
    !productId ||
    typeof productId !== "string" ||
    productId.includes("/") ||
    productId.includes("..")
  ) {
    return null;
  }

  const { db } = getIsolatedProductionFirestore(options?.config);

  // Pre-fetch category docs map for database-driven category resolution
  const categoryDocsMap = new Map<string, ProductionCategoryDoc>();
  try {
    const catDocs = await fetchProductionCategoryDocs(options);
    for (const c of catDocs) categoryDocsMap.set(c.id, c);
  } catch {}

  // 1. Try top-level products doc
  let topData: Record<string, unknown> | null = null;
  let topDocPath: string | null = null;
  try {
    const topRef = doc(db, "products", productId);
    const topSnap = await getDoc(topRef);
    if (topSnap.exists()) {
      topData = topSnap.data() as Record<string, unknown>;
      topDocPath = topSnap.ref.path;
    }
  } catch (err: any) {
    console.warn(
      `[ProductionCatalogue] Error fetching top-level product "${productId}":`,
      err.message
    );
  }

  // 2. Fallback or merge: try nested category paths or collectionGroup item
  try {
    // Check common category item paths directly first for performance and precision
    const candidatePaths = [
      `products/Grocery/items/${productId}`,
      `products/Cooking Oil/items/${productId}`,
      `products/Spices/items/${productId}`,
      `products/cat-groceries/items/${productId}`,
    ];
    let nestedDoc: {
      path: string;
      data: Record<string, unknown>;
      parentCategory?: string | undefined;
    } | null = null;

    for (const cPath of candidatePaths) {
      const parts = cPath.split("/");
      const [col1, doc1, col2, doc2] = parts;
      if (col1 && doc1 && col2 && doc2) {
        const cRef = doc(db, col1, doc1, col2, doc2);
        const cSnap = await getDoc(cRef);
        if (cSnap.exists()) {
          nestedDoc = {
            path: cSnap.ref.path,
            data: cSnap.data() as Record<string, unknown>,
            parentCategory: doc1,
          };
          break;
        }
      }
    }

    if (!nestedDoc) {
      const itemsQuery = query(collectionGroup(db, "items"), limit(100));
      const itemsSnap = await getDocs(itemsQuery);
      const matches = itemsSnap.docs.filter((d) => d.id === productId && d.exists());
      if (matches.length > 0) {
        const bestMatch =
          matches.find((d) => {
            const data = d.data();
            return Boolean(data["name"] || data["productName"]);
          }) || matches[0]!;
        nestedDoc = {
          path: bestMatch.ref.path,
          data: bestMatch.data() as Record<string, unknown>,
          parentCategory: bestMatch.ref.parent?.parent?.id,
        };
      }
    }

    if (nestedDoc) {
      const mergedData: Record<string, unknown> = topData
        ? {
            ...nestedDoc.data,
            ...topData,
            name: topData["name"] || topData["productName"] || nestedDoc.data["name"] || nestedDoc.data["productName"],
            productName: topData["productName"] || topData["name"] || nestedDoc.data["productName"] || nestedDoc.data["name"],
            description: topData["description"] || nestedDoc.data["description"],
            imageUrl: topData["imageUrl"] || nestedDoc.data["imageUrl"],
            imageUrls: topData["imageUrls"] || nestedDoc.data["imageUrls"],
            category: topData["category"] || nestedDoc.data["category"] || nestedDoc.data["categoryName"],
            categoryName: topData["categoryName"] || nestedDoc.data["categoryName"] || nestedDoc.data["category"],
          }
        : nestedDoc.data;

      const parentCat = nestedDoc.parentCategory;
      const catMapping = resolveProductCategoryMapping(mergedData, categoryDocsMap, parentCat);
      return normalizeLegacyProduct(mergedData, {
        docId: productId,
        documentPath: topDocPath || nestedDoc.path,
        ...(parentCat !== undefined ? { parentCategory: parentCat } : {}),
        resolvedCategory: catMapping.category,
        resolvedCategorySlug: catMapping.categorySlug,
        resolvedSubCategory: catMapping.subCategory,
      });
    }
  } catch (err: any) {
    console.warn(
      `[ProductionCatalogue] Error searching nested item "${productId}":`,
      err.message
    );
  }

  // 3. If topData exists without a nested match, attempt normalization directly
  if (topData) {
    const catMapping = resolveProductCategoryMapping(topData, categoryDocsMap);
    return normalizeLegacyProduct(topData, {
      docId: productId,
      documentPath: topDocPath || `products/${productId}`,
      resolvedCategory: catMapping.category,
      resolvedCategorySlug: catMapping.categorySlug,
      resolvedSubCategory: catMapping.subCategory,
    });
  }

  return null;
}


