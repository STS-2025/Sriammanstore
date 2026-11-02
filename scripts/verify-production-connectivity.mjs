import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getFirestore, doc, getDoc, terminate } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

export const EXPECTED_PRODUCTION_PROJECT_ID = "sri-amman-smart-store";
export const EXPECTED_PRODUCTION_PROJECT_NUMBER = "1018585256480";
export const EXPECTED_PRODUCTION_AUTH_DOMAIN = "sri-amman-smart-store.firebaseapp.com";
export const EXPECTED_STORAGE_BUCKET = "sri-amman-smart-store.firebasestorage.app";
export const EXPECTED_APP_ID = "1:1018585256480:web:1312d2d636b0672098a245";

/**
 * Known, non-sensitive product documents confirmed in the production Firestore
 * schema audit (docs/production-firestore-schema-comparison.md).
 */
export const APPROVED_PRODUCT_DOC_IDS = ["prod-mumqpksq", "prod-munn8cp3"];
export const DEFAULT_PRODUCT_DOC_ID = "prod-mumqpksq";

/**
 * Mask sensitive credentials and tokens so they are never printed in logs or reports.
 */
export function maskSecret(secret) {
  if (!secret || typeof secret !== "string") return "[NOT_SET]";
  const clean = secret.trim();
  if (clean.length <= 8) return "[REDACTED]";
  return `${clean.slice(0, 6)}...[REDACTED-${clean.length}chars]`;
}

/**
 * Validates whether a target document path is within the strictly approved,
 * non-sensitive product catalog documents and prohibits accessing any customer
 * or private business operational paths.
 */
export function isApprovedReadOnlyProductPath(collection, docId) {
  if (collection !== "products") return false;
  return APPROVED_PRODUCT_DOC_IDS.includes(docId);
}

/**
 * Resolves the production Firebase web configuration without exposing secrets.
 */
export function resolveProductionFirebaseConfig() {
  const envApiKey =
    process.env.PRODUCTION_FIREBASE_API_KEY ||
    process.env.VITE_PRODUCTION_FIREBASE_API_KEY ||
    process.env.VITE_FIREBASE_API_KEY;

  // Fallback to legacy client configuration if not supplied in env
  const legacyApiKey = "AIzaSyDTzovF1RChmczvRXTNtY9-i-cOTI2JAuQ";

  const apiKey = (envApiKey && envApiKey.trim()) || legacyApiKey;
  const projectId =
    process.env.PRODUCTION_FIREBASE_PROJECT_ID ||
    EXPECTED_PRODUCTION_PROJECT_ID;
  const authDomain =
    process.env.PRODUCTION_FIREBASE_AUTH_DOMAIN ||
    EXPECTED_PRODUCTION_AUTH_DOMAIN;
  const messagingSenderId =
    process.env.PRODUCTION_FIREBASE_PROJECT_NUMBER ||
    EXPECTED_PRODUCTION_PROJECT_NUMBER;
  const storageBucket = EXPECTED_STORAGE_BUCKET;
  const appId = EXPECTED_APP_ID;

  return {
    projectId,
    authDomain,
    messagingSenderId,
    storageBucket,
    appId,
    apiKey,
  };
}

/**
 * Validates the production Firebase configuration. Fails safely if project ID
 * is not strictly "sri-amman-smart-store".
 */
export function validateProductionConfig(config) {
  const errors = [];

  if (!config || typeof config !== "object") {
    return { valid: false, errors: ["Missing production Firebase configuration."] };
  }

  if (config.projectId !== EXPECTED_PRODUCTION_PROJECT_ID) {
    errors.push(
      `Project ID mismatch: Expected "${EXPECTED_PRODUCTION_PROJECT_ID}", received "${config.projectId}". ` +
        `Refusing to connect to unexpected project.`
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
 * Unmarshals a single Firestore REST value object into a standard JS value.
 */
export function unmarshalFirestoreRestValue(val) {
  if (!val || typeof val !== "object") return val;
  if ("stringValue" in val) return val.stringValue;
  if ("integerValue" in val) {
    const num = Number(val.integerValue);
    return Number.isSafeInteger(num) ? num : val.integerValue;
  }
  if ("doubleValue" in val) return Number(val.doubleValue);
  if ("booleanValue" in val) return Boolean(val.booleanValue);
  if ("nullValue" in val) return null;
  if ("timestampValue" in val) return val.timestampValue;
  if ("referenceValue" in val) return val.referenceValue;
  if ("bytesValue" in val) return val.bytesValue;
  if ("geoPointValue" in val) return val.geoPointValue;
  if ("mapValue" in val) {
    return unmarshalFirestoreRestFields(val.mapValue.fields || {});
  }
  if ("arrayValue" in val) {
    return (val.arrayValue.values || []).map(unmarshalFirestoreRestValue);
  }
  return val;
}

/**
 * Converts a Firestore REST document's `fields` object into a standard JS record.
 */
export function unmarshalFirestoreRestFields(fields) {
  if (!fields || typeof fields !== "object") return {};
  const result = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = unmarshalFirestoreRestValue(value);
  }
  return result;
}

/**
 * Performs a strictly read-only single document read via Firestore REST API.
 */
export async function readProductDocViaRest(config, docId = DEFAULT_PRODUCT_DOC_ID) {
  if (!isApprovedReadOnlyProductPath("products", docId)) {
    throw new Error(
      `SECURITY ERROR: Refusing to read path "products/${docId}". ` +
        `Only approved non-sensitive product IDs (${APPROVED_PRODUCT_DOC_IDS.join(", ")}) are permitted.`
    );
  }

  const buildUrl = (p) =>
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
      config.projectId
    )}/databases/(default)/documents/${p}?key=${encodeURIComponent(config.apiKey)}`;

  let response = await fetch(buildUrl(`products/${encodeURIComponent(docId)}`), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  let resolvedDocPath = `products/${docId}`;
  if (!response.ok && response.status === 404) {
    const candidatePaths = [
      `products/Grocery/items/${encodeURIComponent(docId)}`,
      `products/Spices/items/${encodeURIComponent(docId)}`,
    ];
    for (const cp of candidatePaths) {
      const resCandidate = await fetch(buildUrl(cp), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (resCandidate.ok) {
        response = resCandidate;
        resolvedDocPath = cp;
        break;
      }
    }
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Firestore REST read failed (${response.status} ${response.statusText}): ${text}`);
  }

  const data = await response.json();
  const fields = data.fields || {};
  const unmarshaled = unmarshalFirestoreRestFields(fields);

  return {
    docPath: resolvedDocPath,
    exists: true,
    name: data.name,
    productName: fields.name?.stringValue || fields.productName?.stringValue || "Unknown",
    mrp: fields.mrp?.integerValue || fields.mrp?.doubleValue || fields.mrp?.stringValue || null,
    price: fields.price?.integerValue || fields.price?.doubleValue || fields.price?.stringValue || null,
    fieldCount: Object.keys(fields).length,
    createTime: data.createTime,
    updateTime: data.updateTime,
    raw: unmarshaled,
    data: unmarshaled,
  };
}

/**
 * Performs a strictly read-only single document read via official Firebase Web SDK.
 */
export async function readProductDocViaSdk(config, docId = DEFAULT_PRODUCT_DOC_ID) {
  if (!isApprovedReadOnlyProductPath("products", docId)) {
    throw new Error(
      `SECURITY ERROR: Refusing to read path "products/${docId}". ` +
        `Only approved non-sensitive product IDs (${APPROVED_PRODUCT_DOC_IDS.join(", ")}) are permitted.`
    );
  }

  const appName = `prod-diagnostic-${Date.now()}`;
  let app = null;

  try {
    app = initializeApp(
      {
        projectId: config.projectId,
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      },
      appName
    );

    const db = getFirestore(app);
    let docRef = doc(db, "products", docId);
    let snap = await getDoc(docRef);
    let resolvedDocPath = `products/${docId}`;

    if (!snap.exists()) {
      const candidatePaths = [
        `products/Grocery/items/${docId}`,
        `products/Spices/items/${docId}`,
      ];
      for (const cp of candidatePaths) {
        const parts = cp.split("/");
        const nestedRef = doc(db, parts[0], parts[1], parts[2], parts[3]);
        const nestedSnap = await getDoc(nestedRef);
        if (nestedSnap.exists()) {
          snap = nestedSnap;
          resolvedDocPath = cp;
          break;
        }
      }
    }

    if (!snap.exists()) {
      return {
        docPath: resolvedDocPath,
        exists: false,
      };
    }

    const data = snap.data();
    return {
      docPath: resolvedDocPath,
      exists: true,
      productName: data["name"] || data["productName"] || "Unknown",
      mrp: data["mrp"] ?? null,
      price: data["price"] ?? null,
      stock: data["stock"] ?? null,
      fieldCount: Object.keys(data).length,
      raw: data,
      data: data,
    };
  } finally {
    if (app) {
      try {
        const db = getFirestore(app);
        await terminate(db).catch(() => {});
        await deleteApp(app).catch(() => {});
      } catch {
        // cleanup ignore
      }
    }
  }
}

/**
 * Fetches an approved product from production Firestore and normalizes it
 * using the legacySchemaMapper for UI rendering preview.
 */
export async function fetchAndNormalizeProductionProduct(
  docId = DEFAULT_PRODUCT_DOC_ID,
  options = {}
) {
  const isOptedIn =
    Boolean(options.confirmProductionReadOnly) ||
    process.argv.includes("--confirm-production-read-only") ||
    process.env.ALLOW_PRODUCTION_READONLY_DIAGNOSTIC === "true";

  if (!isOptedIn) {
    throw new Error(
      "SAFETY GUARD ACTIVE: Production read-only preview is strictly opt-in.\n" +
        "To run this against live Google Cloud Firestore, you must supply --confirm-production-read-only " +
        "or set ALLOW_PRODUCTION_READONLY_DIAGNOSTIC=true."
    );
  }

  if (!isApprovedReadOnlyProductPath("products", docId)) {
    throw new Error(
      `SECURITY ERROR: Refusing to read path "products/${docId}". ` +
        `Only approved non-sensitive product IDs (${APPROVED_PRODUCT_DOC_IDS.join(", ")}) are permitted.`
    );
  }

  const config = options.config || resolveProductionFirebaseConfig();
  const validation = validateProductionConfig(config);
  if (!validation.valid) {
    throw new Error(
      `CONFIGURATION SAFETY CHECK FAILED:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }

  // Enforce clean environment (no emulator redirect)
  const priorFirestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  const priorAuthHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

  let rawDoc = null;
  try {
    const sdkRes = await readProductDocViaSdk(config, docId);
    rawDoc = sdkRes.raw;
  } catch {
    const restRes = await readProductDocViaRest(config, docId);
    rawDoc = restRes.raw;
  } finally {
    if (priorFirestoreHost !== undefined) {
      process.env.FIRESTORE_EMULATOR_HOST = priorFirestoreHost;
    }
    if (priorAuthHost !== undefined) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = priorAuthHost;
    }
  }

  const { normalizeLegacyProduct } = await import("../src/services/legacySchemaMapper.ts");
  const normalized = normalizeLegacyProduct(rawDoc);

  return {
    docId,
    docPath: `products/${docId}`,
    rawFieldCount: rawDoc ? Object.keys(rawDoc).length : 0,
    raw: rawDoc,
    normalized,
  };
}

/**
 * Main diagnostic execution function.
 */
export async function runProductionConnectivityDiagnostic(options = {}) {
  const isOptedIn =
    Boolean(options.confirmProductionReadOnly) ||
    process.argv.includes("--confirm-production-read-only") ||
    process.env.ALLOW_PRODUCTION_READONLY_DIAGNOSTIC === "true";

  if (!isOptedIn) {
    throw new Error(
      "SAFETY GUARD ACTIVE: Production connectivity diagnostic is strictly opt-in.\n" +
        "To run this diagnostic against live Google Cloud Firestore, you must supply --confirm-production-read-only " +
        "or set ALLOW_PRODUCTION_READONLY_DIAGNOSTIC=true."
    );
  }

  const config = options.config || resolveProductionFirebaseConfig();
  const validation = validateProductionConfig(config);

  if (!validation.valid) {
    throw new Error(
      `CONFIGURATION SAFETY CHECK FAILED:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`
    );
  }

  const docId = options.docId || DEFAULT_PRODUCT_DOC_ID;
  const targetDocPath = `products/${docId}`;

  // Enforce clean environment for this diagnostic run
  const priorFirestoreHost = process.env.FIRESTORE_EMULATOR_HOST;
  const priorAuthHost = process.env.FIREBASE_AUTH_EMULATOR_HOST;
  delete process.env.FIRESTORE_EMULATOR_HOST;
  delete process.env.FIREBASE_AUTH_EMULATOR_HOST;

  const result = {
    timestamp: new Date().toISOString(),
    safetyScope: {
      readOnly: true,
      writesPerformed: 0,
      customerRecordsAccessed: 0,
      authenticationAttempted: false,
      rulesDeployed: false,
    },
    targetProject: {
      projectId: config.projectId,
      projectNumber: config.messagingSenderId,
      authDomain: config.authDomain,
      apiKeyMasked: maskSecret(config.apiKey),
    },
    checks: {
      projectIdValidated: true,
      restApiConnectivity: null,
      sdkConnectivity: null,
    },
    documentRead: null,
    securityNotice:
      "WARNING: Production Firestore security rules are currently open (match /{document=**} { allow read, write: if true; }). " +
      "This diagnostic confirms network connectivity and schema compatibility only. It DOES NOT authorize running production " +
      "customer workflows or switching the main frontend to production until strict security rules are deployed.",
  };

  try {
    // 1. REST read verification
    const restResult = await readProductDocViaRest(config, docId);
    result.checks.restApiConnectivity = {
      status: "SUCCESS",
      docPath: restResult.docPath,
      exists: restResult.exists,
      fieldCount: restResult.fieldCount,
    };

    // 2. Web SDK read verification
    const sdkResult = await readProductDocViaSdk(config, docId);
    result.checks.sdkConnectivity = {
      status: "SUCCESS",
      docPath: sdkResult.docPath,
      exists: sdkResult.exists,
      fieldCount: sdkResult.fieldCount,
    };

    result.documentRead = {
      docPath: targetDocPath,
      exists: sdkResult.exists,
      productName: sdkResult.productName,
      mrp: sdkResult.mrp,
      price: sdkResult.price,
      fieldCount: sdkResult.fieldCount,
    };

    return result;
  } finally {
    // Restore previous environment if any
    if (priorFirestoreHost !== undefined) {
      process.env.FIRESTORE_EMULATOR_HOST = priorFirestoreHost;
    }
    if (priorAuthHost !== undefined) {
      process.env.FIREBASE_AUTH_EMULATOR_HOST = priorAuthHost;
    }
  }
}

// CLI execution handler
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const isJson = process.argv.includes("--json");
  const isPreview = process.argv.includes("--preview");

  const docIdArg = process.argv.find((a) => a.startsWith("--docId="));
  const requestedDocId = docIdArg ? docIdArg.split("=")[1] : null;

  if (isPreview) {
    const targetDocIds = requestedDocId ? [requestedDocId] : APPROVED_PRODUCT_DOC_IDS;

    (async () => {
      console.log(
        "\n================================================================================"
      );
      console.log(" SRI AMMAN SMART STORE — PRODUCTION PRODUCT PREVIEW (Strictly Read-Only)");
      console.log(
        "================================================================================"
      );
      console.log(" Safety Notice: Zero writes performed. Isolated read of approved product documents.\n");

      for (const targetId of targetDocIds) {
        const previewResult = await fetchAndNormalizeProductionProduct(targetId, {
          confirmProductionReadOnly: true,
        });
        const p = previewResult.normalized;

        if (!p) {
          console.log(`[!] Failed to normalize product: ${targetId}`);
          continue;
        }

        console.log(`--------------------------------------------------------------------------------`);
        console.log(` Document ID:      ${previewResult.docId} (${previewResult.docPath})`);
        console.log(` Raw Field Count:  ${previewResult.rawFieldCount} fields in Firestore`);
        console.log(` Product Name:     ${p.name}`);
        console.log(` Tamil Name:       ${p.tamilName || "[None]"}`);
        console.log(` Brand:            ${p.brand}`);
        console.log(` Category:         ${p.category} -> [slug: ${p.categorySlug}]`);
        console.log(` Status:           isActive=${p.isActive}`);
        console.log(` Rating / Reviews: ${p.rating} ★ (${p.reviewCount} reviews)`);
        console.log(` Images:           ${p.images.length} images (primary: ${p.imageUrl.startsWith("data:") ? "Inline Base64 Data URI" : p.imageUrl})`);
        console.log(` Options Count:    ${p.options.length} normalized options:`);
        p.options.forEach((opt, idx) => {
          console.log(`   [Option ${idx}]:   ${opt.unitSize}${opt.unit} | MRP: ₹${opt.mrp} | Offer: ₹${opt.offerPrice} | Stock: ${opt.stock}`);
        });
        console.log(` Search Tags:      ${p.tags.length} tags`);
        console.log(` Badges:           ${p.isFlashDeal ? `Flash Deal (${p.flashDiscount})` : "Standard"}`);
      }
      console.log(
        "================================================================================\n"
      );
    })()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error("\n[verify-prod-connectivity] PREVIEW FAILED:");
        console.error(err.message);
        process.exit(1);
      });
  } else {
    runProductionConnectivityDiagnostic()
      .then((result) => {
        if (isJson) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(
            "\n================================================================================"
          );
          console.log(" SRI AMMAN SMART STORE — PRODUCTION CONNECTIVITY DIAGNOSTIC");
          console.log(
            "================================================================================"
          );
          console.log(` Status:           CONNECTED (Strictly Read-Only)`);
          console.log(` Timestamp:        ${result.timestamp}`);
          console.log(` Target Project:   ${result.targetProject.projectId}`);
          console.log(` Project Number:   ${result.targetProject.projectNumber}`);
          console.log(` Auth Domain:      ${result.targetProject.authDomain}`);
          console.log(` API Key:          ${result.targetProject.apiKeyMasked}`);
          console.log("--------------------------------------------------------------------------------");
          console.log(` Read Path:        ${result.documentRead?.docPath}`);
          console.log(` Document Exists:  ${result.documentRead?.exists}`);
          console.log(` Product Name:     ${result.documentRead?.productName}`);
          console.log(` MRP / Price:      ₹${result.documentRead?.mrp} / ₹${result.documentRead?.price}`);
          console.log(` Fields Count:     ${result.documentRead?.fieldCount}`);
          console.log(` REST Read RPC:    ${result.checks.restApiConnectivity?.status}`);
          console.log(` SDK Read RPC:     ${result.checks.sdkConnectivity?.status}`);
          console.log("--------------------------------------------------------------------------------");
          console.log(` Writes Attempted: ${result.safetyScope.writesPerformed}`);
          console.log(` Customer Records: ${result.safetyScope.customerRecordsAccessed}`);
          console.log(` Rules Deployed:   ${result.safetyScope.rulesDeployed}`);
          console.log("--------------------------------------------------------------------------------");
          console.log(` SECURITY WARNING:\n ${result.securityNotice}`);
          console.log(
            "================================================================================\n"
          );
        }
        process.exit(0);
      })
      .catch((err) => {
        console.error("\n[verify-prod-connectivity] DIAGNOSTIC ABORTED:");
        console.error(err.message);
        console.error("");
        process.exit(1);
      });
  }
}

