import fs from "fs";
import path from "path";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  type Firestore,
} from "firebase/firestore";
import {
  generateDryRunPlan,
  DEFAULT_BACKUP_PATH,
  EXPECTED_BACKUP_SHA256,
  EXPECTED_PRODUCTION_PROJECT_ID,
  type FirestoreDestinationReader,
} from "../src/services/customerRestorePlanner";

const config = {
  projectId: "sri-amman-smart-store",
  authDomain: "sri-amman-smart-store.firebaseapp.com",
  messagingSenderId: "1018585256480",
  apiKey: "AIzaSyDTzovF1RChmczvRXTNtY9-i-cOTI2JAuQ",
  storageBucket: "sri-amman-smart-store.firebasestorage.app",
};

// 1. Verify production project ID invariant
if (config.projectId !== EXPECTED_PRODUCTION_PROJECT_ID) {
  console.error(`FATAL: Configured project ID '${config.projectId}' mismatch! Expected: ${EXPECTED_PRODUCTION_PROJECT_ID}`);
  process.exit(1);
}

const APP_NAME = "dry-run-oncus-reader-isolated";
const app: FirebaseApp = getApps().find((a) => a.name === APP_NAME) || initializeApp(config, APP_NAME);
const db: Firestore = getFirestore(app);

// 2. Production Read-Only Destination Reader
const productionDestinationReader: FirestoreDestinationReader = {
  async getDocument(docPath: string) {
    const segments = docPath.split("/").filter(Boolean);
    const snap = await getDoc(doc(db, segments[0]!, ...segments.slice(1)));
    return {
      exists: snap.exists(),
      data: snap.exists() ? (snap.data() as Record<string, unknown>) : null,
    };
  },

  async getSubcollectionDocs(parentPath: string, subcollectionName: string) {
    const parentSegments = parentPath.split("/").filter(Boolean);
    const colRef = collection(db, parentSegments[0]!, ...parentSegments.slice(1), subcollectionName);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => ({
      id: d.id,
      data: d.data() as Record<string, unknown>,
    }));
  },
};

async function main() {
  console.log("=== STARTING PHASE 2 DRY-RUN ONCUS CUSTOMER RESTORE ===");
  console.log(`Verified Production Project ID: ${config.projectId}`);
  console.log(`Target Input Backup: ${DEFAULT_BACKUP_PATH}`);
  console.log(`Expected SHA-256: ${EXPECTED_BACKUP_SHA256}`);
  console.log("Mode: STRICTLY READ-ONLY DRY-RUN (Zero Writes)\n");

  const plan = await generateDryRunPlan({
    backupFilePath: DEFAULT_BACKUP_PATH,
    expectedChecksum: EXPECTED_BACKUP_SHA256,
    destinationReader: productionDestinationReader,
  });

  // Save machine-readable plan
  const timestampSafe = plan.timestamp.replace(/[:.]/g, "-");
  const planFileName = `dry-run-plan-${timestampSafe}.json`;
  const planFilePath = path.join(process.cwd(), "migration-backups", planFileName);

  fs.writeFileSync(planFilePath, JSON.stringify(plan, null, 2), "utf8");
  console.log(`Machine-readable plan successfully saved to:\n  ${planFilePath}\n`);

  // Print human-readable report
  console.log(plan.humanReadableReport);

  console.log("\n=== DRY-RUN EXECUTION COMPLETE ===");
  console.log(`Execution Feasibility: ${plan.totals.canExecute ? "CAN EXECUTE (Pending Approval)" : "BLOCKED BY CONFLICTS"}`);
  console.log(`Total Planned Document Writes: ${plan.totals.totalPlannedWrites}`);
  console.log(`Total Skipped Identical Documents: ${plan.totals.totalSkippedIdentical}`);
  console.log(`Total Conflicts: ${plan.totals.totalConflicts}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Dry-run execution failed:", err);
  process.exit(1);
});
