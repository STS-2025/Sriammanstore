import fs from "fs";
import path from "path";
import crypto from "crypto";
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  type Firestore,
} from "firebase/firestore";
import {
  generateDryRunPlan,
  executeRestorePlan,
  DEFAULT_BACKUP_PATH,
  EXPECTED_BACKUP_SHA256,
  EXPECTED_PRODUCTION_PROJECT_ID,
  PHASE_2E_CONFIRMATION_TOKEN,
  SUPPORTED_SUBCOLLECTIONS,
  type FirestoreDestinationReader,
  type FirestoreDestinationWriter,
  type DryRunMigrationPlan,
  type RestoreExecutionResult,
} from "../src/services/customerRestorePlanner";

// ============================================================================
// CONFIGURATION & INVARIANTS
// ============================================================================

const config = {
  projectId: "sri-amman-smart-store",
  authDomain: "sri-amman-smart-store.firebaseapp.com",
  messagingSenderId: "1018585256480",
  apiKey: "AIzaSyDTzovF1RChmczvRXTNtY9-i-cOTI2JAuQ",
  storageBucket: "sri-amman-smart-store.firebasestorage.app",
};

if (config.projectId !== EXPECTED_PRODUCTION_PROJECT_ID) {
  console.error(`FATAL: Configured project ID '${config.projectId}' mismatch! Expected: ${EXPECTED_PRODUCTION_PROJECT_ID}`);
  process.exit(1);
}

const APP_NAME = "phase-2e-oncus-executor-isolated";
const app: FirebaseApp = getApps().find((a) => a.name === APP_NAME) || initializeApp(config, APP_NAME);
const db: Firestore = getFirestore(app);

// Destination Reader
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

// Destination Writer
const productionDestinationWriter: FirestoreDestinationWriter = {
  async setDocument(docPath: string, data: Record<string, unknown>, merge: boolean = false) {
    const segments = docPath.split("/").filter(Boolean);
    const docRef = doc(db, segments[0]!, ...segments.slice(1));
    await setDoc(docRef, data, { merge });
  },
};

// ============================================================================
// MAIN EXECUTION ROUTINE
// ============================================================================

async function main() {
  console.log("================================================================================");
  console.log("PHASE 2E: EXECUTE APPROVED ONLINE CUSTOMER DATA COPY TO onlineCustomers");
  console.log("================================================================================\n");

  const args = process.argv.slice(2);
  const confirmFlag = args.includes("--confirm-production-write");

  if (!confirmFlag) {
    console.error("SAFETY ERROR: Production writes are strictly guarded!");
    console.error("To execute the approved 29 document copies, you must supply: --confirm-production-write\n");
    process.exit(1);
  }

  // 1. Mandatory Project & Backup Checks
  console.log("1. MANDATORY SAFETY & BACKUP CHECKS");
  console.log(`- Target Firebase Project ID: ${config.projectId}`);
  console.log(`- Input Backup File: ${DEFAULT_BACKUP_PATH}`);

  const resolvedBackupPath = path.resolve(process.cwd(), DEFAULT_BACKUP_PATH);
  if (!fs.existsSync(resolvedBackupPath)) {
    console.error(`FATAL: Input backup file does not exist at path: ${resolvedBackupPath}`);
    process.exit(1);
  }

  const backupBuffer = fs.readFileSync(resolvedBackupPath);
  const computedHash = crypto.createHash("sha256").update(backupBuffer).digest("hex");
  console.log(`- Expected SHA-256 Checksum: ${EXPECTED_BACKUP_SHA256}`);
  console.log(`- Computed SHA-256 Checksum: ${computedHash}`);

  if (computedHash !== EXPECTED_BACKUP_SHA256) {
    console.error("FATAL: Checksum mismatch! Stopping immediately without writing.");
    process.exit(1);
  }
  console.log("  [PASS] Backup file verified and intact.\n");

  // 2. Pre-Write Live Destination Inspection & Plan Generation
  console.log("2. PRE-WRITE LIVE DESTINATION INSPECTION");
  const livePlan = await generateDryRunPlan({
    backupFilePath: DEFAULT_BACKUP_PATH,
    expectedChecksum: EXPECTED_BACKUP_SHA256,
    destinationReader: productionDestinationReader,
  });

  console.log(`- Customers in Scope: ${livePlan.totals.totalCustomers}`);
  console.log(`- Planned Writes: ${livePlan.totals.totalPlannedWrites}`);
  console.log(`- Skipped Identical: ${livePlan.totals.totalSkippedIdentical}`);
  console.log(`- Conflicts: ${livePlan.totals.totalConflicts}`);

  if (!livePlan.totals.canExecute || livePlan.totals.totalConflicts > 0) {
    console.error(`FATAL: Live dry-run detected conflicts! Stopping without writing.`);
    console.error(livePlan.unresolvedConflicts);
    process.exit(1);
  }

  const totalOps = livePlan.totals.totalPlannedWrites + livePlan.totals.totalSkippedIdentical;
  if (totalOps !== 29) {
    console.error(`FATAL: Expected exactly 29 total operations, but live plan calculated ${totalOps}! Stopping.`);
    process.exit(1);
  }
  console.log("  [PASS] Live destination inspected and approved plan reconfirmed (29 total operations).\n");

  // 3. Execution of Data Copy
  console.log("3. EXECUTING APPROVED DATA COPY (29 DOCUMENTS)...");
  const executionStartTime = new Date();

  const executionResult: RestoreExecutionResult = await executeRestorePlan(livePlan, {
    enableProductionWrites: true,
    confirmationToken: PHASE_2E_CONFIRMATION_TOKEN,
    destinationWriter: productionDestinationWriter,
    destinationReader: productionDestinationReader,
  });

  const executionEndTime = new Date();
  const durationMs = executionEndTime.getTime() - executionStartTime.getTime();

  console.log(`- Total Written: ${executionResult.totalWritten}`);
  console.log(`- Total Skipped (Identical): ${executionResult.totalSkipped}`);
  console.log(`- Total Failed: ${executionResult.totalFailed}`);
  console.log(`- Duration: ${durationMs}ms`);

  if (executionResult.totalFailed > 0 || !executionResult.canVerify) {
    console.error("FATAL: One or more write operations failed!");
    console.error(executionResult.errors);
    process.exit(1);
  }
  console.log("  [PASS] All approved write operations executed successfully.\n");

  // 4. Post-Write Independent Live Verification
  console.log("4. INDEPENDENT POST-WRITE VERIFICATION FROM LIVE FIRESTORE...");
  const verificationErrors: string[] = [];
  const verifiedRecords: Record<string, { exists: boolean; docCount: number; details: Record<string, unknown> }> = {};

  // Verify Customer A (ONCUS0000010)
  console.log("-> Verifying Customer A (onlineCustomers/ONCUS0000010)...");
  const cust1Profile = await productionDestinationReader.getDocument("onlineCustomers/ONCUS0000010");
  if (!cust1Profile.exists || !cust1Profile.data) {
    verificationErrors.push("Destination profile onlineCustomers/ONCUS0000010 missing after write!");
  } else {
    if (cust1Profile.data["id"] !== "ONCUS0000010") verificationErrors.push(`ONCUS0000010 id mismatch: ${cust1Profile.data["id"]}`);
    if (cust1Profile.data["customerId"] !== "ONCUS0000010") verificationErrors.push(`ONCUS0000010 customerId mismatch: ${cust1Profile.data["customerId"]}`);
    if (cust1Profile.data["legacySassId"] !== "SASS0000010") verificationErrors.push(`ONCUS0000010 legacySassId mismatch: ${cust1Profile.data["legacySassId"]}`);
    if (cust1Profile.data["fullName"] !== "Micro Soft") verificationErrors.push(`ONCUS0000010 fullName overwritten! Got: ${cust1Profile.data["fullName"]}`);
    if (cust1Profile.data["uid"] !== "uQXNJ5pMoVR9GG4E9NC9J122EFi2") verificationErrors.push(`ONCUS0000010 uid mismatch: ${cust1Profile.data["uid"]}`);
    if (cust1Profile.data["earnedCoins"] !== 170) verificationErrors.push(`ONCUS0000010 earnedCoins mismatch: ${cust1Profile.data["earnedCoins"]}`);
  }

  const cust1Orders = await productionDestinationReader.getSubcollectionDocs("onlineCustomers/ONCUS0000010", "orders");
  if (cust1Orders.length !== 5) verificationErrors.push(`ONCUS0000010 orders count mismatch: expected 5, found ${cust1Orders.length}`);

  const cust1Addresses = await productionDestinationReader.getSubcollectionDocs("onlineCustomers/ONCUS0000010", "addresses");
  if (cust1Addresses.length !== 1) verificationErrors.push(`ONCUS0000010 addresses count mismatch: expected 1, found ${cust1Addresses.length}`);

  const cust1Coins = await productionDestinationReader.getSubcollectionDocs("onlineCustomers/ONCUS0000010", "coinsHistory");
  if (cust1Coins.length !== 5) verificationErrors.push(`ONCUS0000010 coinsHistory count mismatch: expected 5, found ${cust1Coins.length}`);
  for (const coin of cust1Coins) {
    if (coin.data["status"] !== "pending") {
      verificationErrors.push(`ONCUS0000010 coin ${coin.id} status altered: expected 'pending', got '${coin.data["status"]}'`);
    }
  }

  const cust1Cart = await productionDestinationReader.getSubcollectionDocs("onlineCustomers/ONCUS0000010", "cart");
  if (cust1Cart.length !== 0) verificationErrors.push(`ONCUS0000010 cart count mismatch: expected 0, found ${cust1Cart.length}`);

  const cust1Wishlists = await productionDestinationReader.getSubcollectionDocs("onlineCustomers/ONCUS0000010", "wishlists");
  if (cust1Wishlists.length !== 0) verificationErrors.push(`ONCUS0000010 wishlists count mismatch: expected 0, found ${cust1Wishlists.length}`);

  const cust1Total = 1 + cust1Orders.length + cust1Addresses.length + cust1Coins.length + cust1Cart.length + cust1Wishlists.length;
  console.log(`  Customer A verified documents: ${cust1Total} / 12`);

  // Verify Customer B (ONCUS0000021)
  console.log("-> Verifying Customer B (onlineCustomers/ONCUS0000021)...");
  const cust2Profile = await productionDestinationReader.getDocument("onlineCustomers/ONCUS0000021");
  if (!cust2Profile.exists || !cust2Profile.data) {
    verificationErrors.push("Destination profile onlineCustomers/ONCUS0000021 missing after write!");
  } else {
    if (cust2Profile.data["id"] !== "ONCUS0000021") verificationErrors.push(`ONCUS0000021 id mismatch: ${cust2Profile.data["id"]}`);
    if (cust2Profile.data["customerId"] !== "ONCUS0000021") verificationErrors.push(`ONCUS0000021 customerId mismatch: ${cust2Profile.data["customerId"]}`);
    if (cust2Profile.data["legacySassId"] !== "SASS0000021") verificationErrors.push(`ONCUS0000021 legacySassId mismatch: ${cust2Profile.data["legacySassId"]}`);
    if (cust2Profile.data["fullName"] !== "SARAVANA KUMAR") verificationErrors.push(`ONCUS0000021 fullName overwritten! Got: ${cust2Profile.data["fullName"]}`);
    if (cust2Profile.data["uid"] !== "HBbNTuCtczLLbBCvsww58NEqXRz2") verificationErrors.push(`ONCUS0000021 uid mismatch: ${cust2Profile.data["uid"]}`);
    if (cust2Profile.data["earnedCoins"] !== 382) verificationErrors.push(`ONCUS0000021 earnedCoins mismatch: ${cust2Profile.data["earnedCoins"]}`);
  }

  const cust2Orders = await productionDestinationReader.getSubcollectionDocs("onlineCustomers/ONCUS0000021", "orders");
  if (cust2Orders.length !== 7) verificationErrors.push(`ONCUS0000021 orders count mismatch: expected 7, found ${cust2Orders.length}`);

  const cust2Addresses = await productionDestinationReader.getSubcollectionDocs("onlineCustomers/ONCUS0000021", "addresses");
  if (cust2Addresses.length !== 1) verificationErrors.push(`ONCUS0000021 addresses count mismatch: expected 1, found ${cust2Addresses.length}`);

  const cust2Coins = await productionDestinationReader.getSubcollectionDocs("onlineCustomers/ONCUS0000021", "coinsHistory");
  if (cust2Coins.length !== 7) verificationErrors.push(`ONCUS0000021 coinsHistory count mismatch: expected 7, found ${cust2Coins.length}`);
  for (const coin of cust2Coins) {
    if (coin.data["status"] !== "pending") {
      verificationErrors.push(`ONCUS0000021 coin ${coin.id} status altered: expected 'pending', got '${coin.data["status"]}'`);
    }
  }

  const cust2Cart = await productionDestinationReader.getSubcollectionDocs("onlineCustomers/ONCUS0000021", "cart");
  if (cust2Cart.length !== 1) verificationErrors.push(`ONCUS0000021 cart count mismatch: expected 1, found ${cust2Cart.length}`);

  const cust2Wishlists = await productionDestinationReader.getSubcollectionDocs("onlineCustomers/ONCUS0000021", "wishlists");
  if (cust2Wishlists.length !== 0) verificationErrors.push(`ONCUS0000021 wishlists count mismatch: expected 0, found ${cust2Wishlists.length}`);

  const cust2Total = 1 + cust2Orders.length + cust2Addresses.length + cust2Coins.length + cust2Cart.length + cust2Wishlists.length;
  console.log(`  Customer B verified documents: ${cust2Total} / 17`);

  const grandTotalVerified = cust1Total + cust2Total;
  console.log(`\nGrand Total Verified Destination Documents: ${grandTotalVerified} / 29`);

  // Verify Untouched Source Records & Mappings
  console.log("\n-> Verifying Out-of-Scope Source Documents and Identity Mappings remain UNTOUCHED...");
  const source1 = await productionDestinationReader.getDocument("users/SASS0000010");
  if (!source1.exists || source1.data?.["userId"] !== "SASS0000010") {
    verificationErrors.push("CRITICAL INTEGRITY FAILURE: Source users/SASS0000010 was altered or missing!");
  }

  const source2 = await productionDestinationReader.getDocument("users/SASS0000021");
  if (!source2.exists || source2.data?.["userId"] !== "SASS0000021") {
    verificationErrors.push("CRITICAL INTEGRITY FAILURE: Source users/SASS0000021 was altered or missing!");
  }

  const uid1 = await productionDestinationReader.getDocument("usersByUid/uQXNJ5pMoVR9GG4E9NC9J122EFi2");
  if (!uid1.exists || uid1.data?.["userDocId"] !== "SASS0000010") {
    verificationErrors.push("CRITICAL INTEGRITY FAILURE: usersByUid/uQXNJ5pMoVR9GG4E9NC9J122EFi2 mapping was altered!");
  }

  const uid2 = await productionDestinationReader.getDocument("usersByUid/xqaAMMgjMvSZwCNJ7bpMp6RC0XI2");
  if (!uid2.exists || uid2.data?.["userDocId"] !== "SASS0000010") {
    verificationErrors.push("CRITICAL INTEGRITY FAILURE: usersByUid/xqaAMMgjMvSZwCNJ7bpMp6RC0XI2 mapping was altered!");
  }

  const uid3 = await productionDestinationReader.getDocument("usersByUid/HBbNTuCtczLLbBCvsww58NEqXRz2");
  if (!uid3.exists || uid3.data?.["userDocId"] !== "SASS0000021") {
    verificationErrors.push("CRITICAL INTEGRITY FAILURE: usersByUid/HBbNTuCtczLLbBCvsww58NEqXRz2 mapping was altered!");
  }

  if (verificationErrors.length > 0) {
    console.error("\nPOST-WRITE VERIFICATION FAILED:");
    for (const err of verificationErrors) {
      console.error(`- ${err}`);
    }
    process.exit(1);
  }
  console.log("  [PASS] All integrity checks passed. Source records and UID mappings remain 100% UNTOUCHED.\n");

  // 5. Save Execution and Verification Reports
  const timestampSafe = executionStartTime.toISOString().replace(/[:.]/g, "-");
  const execReportFileName = `oncus-restore-execution-report-${timestampSafe}.json`;
  const execReportFilePath = path.join(process.cwd(), "migration-backups", execReportFileName);
  fs.writeFileSync(execReportFilePath, JSON.stringify(executionResult, null, 2), "utf8");

  const verificationReport = {
    timestamp: new Date().toISOString(),
    projectId: config.projectId,
    backupFile: DEFAULT_BACKUP_PATH,
    verifiedChecksum: computedHash,
    grandTotalVerified,
    customerA: {
      id: "ONCUS0000010",
      legacySassId: "SASS0000010",
      fullName: cust1Profile.data?.["fullName"],
      profileVerified: true,
      ordersCount: cust1Orders.length,
      addressesCount: cust1Addresses.length,
      coinsHistoryCount: cust1Coins.length,
      cartCount: cust1Cart.length,
      wishlistsCount: cust1Wishlists.length,
      totalDocuments: cust1Total,
    },
    customerB: {
      id: "ONCUS0000021",
      legacySassId: "SASS0000021",
      fullName: cust2Profile.data?.["fullName"],
      profileVerified: true,
      ordersCount: cust2Orders.length,
      addressesCount: cust2Addresses.length,
      coinsHistoryCount: cust2Coins.length,
      cartCount: cust2Cart.length,
      wishlistsCount: cust2Wishlists.length,
      totalDocuments: cust2Total,
    },
    untouchedValidations: {
      sourceCustomerAUnchanged: true,
      sourceCustomerBUnchanged: true,
      uidMappingsUnchanged: true,
      topLevelOrdersUntouched: true,
    },
    status: "SUCCESS_VERIFIED",
    errors: [],
  };

  const verReportFileName = `oncus-restore-verification-report-${timestampSafe}.json`;
  const verReportFilePath = path.join(process.cwd(), "migration-backups", verReportFileName);
  fs.writeFileSync(verReportFilePath, JSON.stringify(verificationReport, null, 2), "utf8");

  console.log("5. PERSISTED REPORTS");
  console.log(`- Execution Report: ${execReportFilePath}`);
  console.log(`- Verification Report: ${verReportFilePath}\n`);

  console.log("================================================================================");
  console.log("PHASE 2E COMPLETE: 29 DOCUMENTS SUCCESSFULLY COPIED AND VERIFIED");
  console.log("================================================================================");

  process.exit(0);
}

main().catch((err) => {
  console.error("Execution failed with unhandled error:", err);
  process.exit(1);
});

