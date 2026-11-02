import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  writeBatch,
} from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

/**
 * Reconciled resource manifest from actual db.json inspection:
 * - 15 array collections (394 records in default db.json)
 * - 2 singleton object resources (deliverySettings/default, storeInfo/default)
 */
export const ARRAY_RESOURCES = [
  "users",
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
];

export const SINGLETON_RESOURCES = {
  deliverySettings: "default",
  storeInfo: "default",
};

export const FIRESTORE_BATCH_LIMIT = 400; // Safely below Firestore's 500 operations/batch limit

/**
 * Strips undefined properties recursively so comparison and Firestore writes
 * match JSON semantics deterministically.
 */
export function sanitizeForFirestore(value) {
  if (value === undefined) return undefined;
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForFirestore(item));
  }
  const result = {};
  for (const [k, v] of Object.entries(value)) {
    if (v !== undefined) {
      result[k] = sanitizeForFirestore(v);
    }
  }
  return result;
}

/**
 * Deterministic deep equality check between existing Firestore document data
 * and candidate seed record.
 */
export function isDeepEqualRecord(a, b) {
  const cleanA = sanitizeForFirestore(a);
  const cleanB = sanitizeForFirestore(b);
  return stableStringify(cleanA) === stableStringify(cleanB);
}

function stableStringify(val) {
  if (val === null || typeof val !== "object") {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return "[" + val.map((item) => stableStringify(item)).join(",") + "]";
  }
  const keys = Object.keys(val).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify(val[k]))
      .join(",") +
    "}"
  );
}

/**
 * Splits an array of write operations into chunks respecting Firestore's 500-op batch limit.
 */
export function chunkOperations(operations, batchSize = FIRESTORE_BATCH_LIMIT) {
  const chunks = [];
  const limit = Math.max(1, Math.min(500, batchSize));
  for (let i = 0; i < operations.length; i += limit) {
    chunks.push(operations.slice(i, i + limit));
  }
  return chunks;
}

/**
 * Parses db.json into a normalized list of collection/docId/data records.
 */
export function extractSeedOperationsFromData(rawData) {
  const operations = [];

  for (const collectionName of ARRAY_RESOURCES) {
    const arr = rawData[collectionName];
    if (!Array.isArray(arr)) {
      continue;
    }
    for (let index = 0; index < arr.length; index++) {
      const item = arr[index];
      if (!item || typeof item !== "object") continue;
      const docId =
        item.id !== undefined && item.id !== null && String(item.id).trim() !== ""
          ? String(item.id).trim()
          : `${collectionName}_${index + 1}`;
      const payload = sanitizeForFirestore({
        ...item,
        id: docId,
      });
      operations.push({
        collectionName,
        docId,
        payload,
        isSingleton: false,
      });
    }
  }

  for (const [singletonName, defaultDocId] of Object.entries(SINGLETON_RESOURCES)) {
    const obj = rawData[singletonName];
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
      continue;
    }
    const docId =
      obj.id && typeof obj.id === "string" && obj.id.trim().length > 0
        ? obj.id.trim()
        : defaultDocId;
    const payload = sanitizeForFirestore({ ...obj });
    operations.push({
      collectionName: singletonName,
      docId,
      payload,
      isSingleton: true,
    });
  }

  return operations;
}

/**
 * Connects to the local Firestore Emulator only.
 */
export function createSeedFirestoreClient({
  projectId = process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    "demo-sri-amman-store",
  host = process.env.VITE_FIRESTORE_EMULATOR_HOST || "127.0.0.1",
  port = Number(process.env.VITE_FIRESTORE_EMULATOR_PORT || 8081),
} = {}) {
  if (!projectId.startsWith("demo-")) {
    throw new Error(
      `Refusing to run seed script against non-emulator project "${projectId}". Must start with "demo-".`
    );
  }
  const appName = `seed-app-${projectId}-${host}-${port}`;
  const app = getApps().some((a) => a.name === appName)
    ? getApp(appName)
    : initializeApp({ projectId }, appName);

  let db;
  try {
    db = initializeFirestore(app, { ignoreUndefinedProperties: true });
    connectFirestoreEmulator(db, host, port);
  } catch {
    db = getFirestore(app);
  }

  return { db, projectId, host, port };
}

/**
 * Optional explicit reset procedure (only invoked when --reset flag is explicitly passed).
 * Never invoked automatically during normal seed runs.
 */
export async function resetEmulatorDatabase({
  projectId = "demo-sri-amman-store",
  host = "127.0.0.1",
  port = 8081,
} = {}) {
  if (!projectId.startsWith("demo-")) {
    throw new Error("Reset is restricted to demo-* emulator projects.");
  }
  const url = `http://${host}:${port}/emulator/v1/projects/${encodeURIComponent(
    projectId
  )}/databases/(default)/documents`;
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`Failed to clear emulator database (${res.status} ${res.statusText})`);
  }
}

/**
 * Idempotent seed runner.
 * - Compares existing documents in Firestore Emulator before writing.
 * - Reports imported, skipped, updated, and failed counts overall and per resource.
 * - Respects Firestore batch limits.
 */
export async function seedFirestoreEmulator({
  db,
  rawData,
  dbJsonPath = path.join(rootDir, "db.json"),
  batchSize = FIRESTORE_BATCH_LIMIT,
  logger = console,
} = {}) {
  const sourceData =
    rawData ?? JSON.parse(fs.readFileSync(dbJsonPath, "utf-8"));
  const firestoreDb = db ?? createSeedFirestoreClient().db;

  const operations = extractSeedOperationsFromData(sourceData);

  const summary = {
    totalCandidateRecords: operations.length,
    imported: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    batchesCommitted: 0,
    byResource: {},
    errors: [],
  };

  for (const op of operations) {
    if (!summary.byResource[op.collectionName]) {
      summary.byResource[op.collectionName] = {
        imported: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
      };
    }
  }

  const pendingWrites = [];

  for (const op of operations) {
    const resourceStats = summary.byResource[op.collectionName];
    try {
      const ref = doc(firestoreDb, op.collectionName, op.docId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        pendingWrites.push({ ...op, ref, action: "imported" });
      } else {
        const existingData = snap.data();
        if (isDeepEqualRecord(existingData, op.payload)) {
          summary.skipped++;
          resourceStats.skipped++;
        } else {
          pendingWrites.push({ ...op, ref, action: "updated" });
        }
      }
    } catch (err) {
      summary.failed++;
      resourceStats.failed++;
      summary.errors.push({
        collection: op.collectionName,
        docId: op.docId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const chunks = chunkOperations(pendingWrites, batchSize);

  for (const chunk of chunks) {
    try {
      const batch = writeBatch(firestoreDb);
      for (const item of chunk) {
        batch.set(item.ref, item.payload);
      }
      await batch.commit();
      summary.batchesCommitted++;

      for (const item of chunk) {
        const resourceStats = summary.byResource[item.collectionName];
        if (item.action === "imported") {
          summary.imported++;
          resourceStats.imported++;
        } else {
          summary.updated++;
          resourceStats.updated++;
        }
      }
    } catch (batchErr) {
      for (const item of chunk) {
        summary.failed++;
        summary.byResource[item.collectionName].failed++;
        summary.errors.push({
          collection: item.collectionName,
          docId: item.docId,
          error: batchErr instanceof Error ? batchErr.message : String(batchErr),
        });
      }
    }
  }

  if (logger) {
    logger.log(
      `[seed-emulator] Completed: imported=${summary.imported}, updated=${summary.updated}, skipped=${summary.skipped}, failed=${summary.failed} (batches=${summary.batchesCommitted})`
    );
  }

  return summary;
}

export async function seedProductionProductFixtures({ storageBackend, logger = null, fixtures = null }) {
  const targetFixtures = fixtures || [
    {
      id: "prod-mumqpksq",
      name: "Sakthi Turmeric Powder",
      tamilName: "சக்தி மஞ்சள் தூள்",
      categorySlug: "grocery",
      category: "Grocery",
      price: 15,
      mrp: 15,
      stock: 50,
      unit: "g",
      unitSize: "20",
    },
    {
      id: "prod-munn8cp3",
      name: "Sakthi Chicken Masala",
      tamilName: "சக்தி சிக்கன் மசாலா",
      categorySlug: "grocery",
      category: "Grocery",
      price: 240,
      mrp: 260,
      stock: 30,
      unit: "g",
      unitSize: "500",
    },
  ];

  const results = [];
  for (const item of targetFixtures) {
    const existing = await storageBackend.getDoc("products", item.id);
    if (!existing) {
      await storageBackend.setDoc("products", item.id, item);
      results.push({ id: item.id, action: "imported" });
    } else {
      const isIdentical = JSON.stringify(existing) === JSON.stringify(item);
      if (isIdentical) {
        results.push({ id: item.id, action: "skipped" });
      } else {
        await storageBackend.setDoc("products", item.id, item);
        results.push({ id: item.id, action: "updated" });
      }
    }
  }
  return results;
}

async function runCli() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes("--reset");
  const { db, projectId, host, port } = createSeedFirestoreClient();

  console.log(
    `[seed-emulator] Target Firestore Emulator: ${host}:${port} (project: ${projectId})`
  );

  if (shouldReset) {
    console.log(
      `[seed-emulator] --reset flag detected: clearing local emulator data for ${projectId}...`
    );
    await resetEmulatorDatabase({ projectId, host, port });
    console.log(`[seed-emulator] Local emulator database cleared.`);
  }

  const summary = await seedFirestoreEmulator({ db, logger: console });

  console.table(summary.byResource);

  if (summary.failed > 0) {
    console.error(`[seed-emulator] ${summary.failed} record(s) failed to import:`, summary.errors);
    process.exit(1);
  }
  process.exit(0);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runCli().catch((err) => {
    console.error("[seed-emulator] Fatal error:", err);
    process.exit(1);
  });
}
