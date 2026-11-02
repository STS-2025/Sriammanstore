import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Timestamp, GeoPoint } from "firebase/firestore";
import {
  validateBackupFile,
  validateAllowlist,
  deserializeFirestoreValues,
  inspectDestination,
  planProfileMerge,
  planSubcollectionRestore,
  generateDryRunPlan,
  executeRestorePlan,
  DEFAULT_BACKUP_PATH,
  EXPECTED_BACKUP_SHA256,
  EXPECTED_PRODUCTION_PROJECT_ID,
  type FirestoreDestinationReader,
  type CustomerBackupFile,
  type DestinationInspectionResult,
} from "../../scripts/customerRestorePlanner";

describe("Phase 2: ONCUS Customer Restore Planner & Safety Guards", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // TEST 1: Backup Checksum Failure
  // ==========================================================================
  it("fails validation when backup checksum does not match expected SHA-256", () => {
    const tempDir = path.join(process.cwd(), "src/test/fixtures");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const tamperedPath = path.join(tempDir, "tampered-backup.json");
    fs.writeFileSync(tamperedPath, JSON.stringify({ tampered: true }), "utf8");

    try {
      const res = validateBackupFile(tamperedPath, EXPECTED_BACKUP_SHA256);
      expect(res.valid).toBe(false);
      expect(res.errors.some((e) => e.includes("checksum mismatch"))).toBe(true);
    } finally {
      if (fs.existsSync(tamperedPath)) fs.unlinkSync(tamperedPath);
    }
  });

  // ==========================================================================
  // TEST 2: Missing or Malformed Backup
  // ==========================================================================
  it("fails safely when backup file is missing or contains invalid JSON", () => {
    // Missing file
    const missingRes = validateBackupFile("non-existent-path.json");
    expect(missingRes.valid).toBe(false);
    expect(missingRes.errors.some((e) => e.includes("does not exist"))).toBe(true);

    // Malformed JSON
    const tempDir = path.join(process.cwd(), "src/test/fixtures");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const malformedPath = path.join(tempDir, "malformed-backup.json");
    const malformedContent = "{ invalidJson: true, ";
    fs.writeFileSync(malformedPath, malformedContent, "utf8");
    const checksum = crypto.createHash("sha256").update(malformedContent).digest("hex");

    try {
      const malformedRes = validateBackupFile(malformedPath, checksum);
      expect(malformedRes.valid).toBe(false);
      expect(malformedRes.errors.some((e) => e.includes("Malformed backup file JSON"))).toBe(true);
    } finally {
      if (fs.existsSync(malformedPath)) fs.unlinkSync(malformedPath);
    }
  });

  // ==========================================================================
  // TEST 3: Unknown Customer or Destination ID Rejection
  // ==========================================================================
  it("rejects unknown customers or destination IDs outside the strict allowlist", () => {
    const invalidBackup: CustomerBackupFile = {
      metadata: {
        backupFormatVersion: "1.0.0",
        exportTimestamp: "2026-10-22T00:00:00.000Z",
        verifiedProjectId: EXPECTED_PRODUCTION_PROJECT_ID,
        mode: "TEST",
        sourceWorkspace: "/test",
        approvedCustomers: [],
      },
      manifest: {
        totalCustomersInScope: 1,
        profilesExported: 1,
        subcollectionsExported: {},
        topLevelOrdersExported: 0,
        uidMappingsExported: 0,
      },
      customers: {
        SASS9999999: {
          sourceId: "SASS9999999",
          destinationId: "ONCUS9999999",
          sourcePath: "users/SASS9999999",
          destinationPath: "onlineCustomers/ONCUS9999999",
          profile: { id: "SASS9999999", path: "users/SASS9999999", data: {} },
          subcollections: {},
        },
      },
      relatedTopLevelOrders: [],
      identityMappings: [],
      errors: [],
    };

    const res = validateAllowlist(invalidBackup);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes("REJECTED UNKNOWN CUSTOMER"))).toBe(true);
  });

  // ==========================================================================
  // TEST 4: Correct SASS-to-ONCUS Path Mapping
  // ==========================================================================
  it("validates exact approved SASS0000010 and SASS0000021 mappings to ONCUS", () => {
    const validBackup: CustomerBackupFile = {
      metadata: {
        backupFormatVersion: "1.0.0",
        exportTimestamp: "2026-10-22T00:00:00.000Z",
        verifiedProjectId: EXPECTED_PRODUCTION_PROJECT_ID,
        mode: "TEST",
        sourceWorkspace: "/test",
        approvedCustomers: [],
      },
      manifest: {
        totalCustomersInScope: 2,
        profilesExported: 2,
        subcollectionsExported: {},
        topLevelOrdersExported: 0,
        uidMappingsExported: 0,
      },
      customers: {
        SASS0000010: {
          sourceId: "SASS0000010",
          destinationId: "ONCUS0000010",
          sourcePath: "users/SASS0000010",
          destinationPath: "onlineCustomers/ONCUS0000010",
          profile: { id: "SASS0000010", path: "users/SASS0000010", data: {} },
          subcollections: {},
        },
        SASS0000021: {
          sourceId: "SASS0000021",
          destinationId: "ONCUS0000021",
          sourcePath: "users/SASS0000021",
          destinationPath: "onlineCustomers/ONCUS0000021",
          profile: { id: "SASS0000021", path: "users/SASS0000021", data: {} },
          subcollections: {},
        },
      },
      relatedTopLevelOrders: [],
      identityMappings: [],
      errors: [],
    };

    const res = validateAllowlist(validBackup);
    expect(res.valid).toBe(true);
    expect(res.validatedCustomers).toHaveLength(2);
    expect(res.validatedCustomers[0]?.sourcePath).toBe("users/SASS0000010");
    expect(res.validatedCustomers[0]?.destinationPath).toBe("onlineCustomers/ONCUS0000010");
    expect(res.validatedCustomers[1]?.sourcePath).toBe("users/SASS0000021");
    expect(res.validatedCustomers[1]?.destinationPath).toBe("onlineCustomers/ONCUS0000021");
  });

  // ==========================================================================
  // TEST 5: Correct Firestore Special-Value Restoration
  // ==========================================================================
  it("faithfully deserializes Timestamp, GeoPoint, and DocumentReference representations", () => {
    const rawData = {
      orderId: "ORD-101",
      createdAt: {
        _firestoreType: "Timestamp",
        seconds: 1791282057,
        nanoseconds: 519000000,
        isoString: "2026-10-06T10:20:57.519Z",
      },
      location: {
        _firestoreType: "GeoPoint",
        latitude: 8.8174,
        longitude: 78.1314,
      },
      storeRef: {
        _firestoreType: "DocumentReference",
        path: "stores/main",
        id: "main",
      },
      items: [
        {
          price: 150,
          addedAt: {
            _firestoreType: "Timestamp",
            seconds: 1791280000,
            nanoseconds: 0,
          },
        },
      ],
    };

    const deserialized = deserializeFirestoreValues(rawData) as any;
    expect(deserialized.createdAt).toBeInstanceOf(Timestamp);
    expect(deserialized.createdAt.seconds).toBe(1791282057);
    expect(deserialized.createdAt.nanoseconds).toBe(519000000);
    expect(deserialized.createdAt.toDate().toISOString()).toBe("2026-10-06T10:20:57.519Z");

    expect(deserialized.location).toBeInstanceOf(GeoPoint);
    expect(deserialized.location.latitude).toBe(8.8174);
    expect(deserialized.location.longitude).toBe(78.1314);

    expect(deserialized.storeRef._refPath).toBe("stores/main");
    expect(deserialized.items[0].addedAt).toBeInstanceOf(Timestamp);
  });

  // ==========================================================================
  // TEST 6: Existing Destination Profile Merge Preserving Existing fullName
  // ==========================================================================
  it("preserves destination's pre-created fullName and sets legacySassId", () => {
    const sourceProfile = {
      fullName: "Source Name Differing",
      number: "8248544559",
      countryCode: "+91",
      earnedCoins: 170,
    };

    const destInspection: DestinationInspectionResult = {
      docPath: "onlineCustomers/ONCUS0000010",
      exists: true,
      data: {
        fullName: "Micro Soft", // Pre-created user name in destination
      },
      subcollections: {},
    };

    const plan = planProfileMerge(sourceProfile, destInspection, "SASS0000010", "ONCUS0000010");
    expect(plan.destinationPath).toBe("onlineCustomers/ONCUS0000010");
    expect(plan.legacySassId).toBe("SASS0000010");
    // Verify destination fullName was explicitly preserved over source
    expect(plan.mergedData["fullName"]).toBe("Micro Soft");
    expect(plan.mergedData["legacySassId"]).toBe("SASS0000010");
    expect(plan.mergedData["id"]).toBe("ONCUS0000010");
    expect(plan.mergedData["customerId"]).toBe("ONCUS0000010");
    expect(plan.mergedData["number"]).toBe("8248544559");
    expect(plan.mergedData["earnedCoins"]).toBe(170);

    const nameAction = plan.fields.find((f) => f.fieldName === "fullName");
    expect(nameAction?.action).toBe("PRESERVE_DESTINATION");
    expect(nameAction?.resolvedValue).toBe("Micro Soft");
  });

  // ==========================================================================
  // TEST 7: Identical Destination Documents Being Skipped
  // ==========================================================================
  it("classifies identical existing destination documents as IDENTICAL (skips write)", () => {
    const sourceSub = {
      count: 2,
      documents: [
        {
          id: "doc1",
          path: "users/SASS0000010/orders/doc1",
          data: { orderId: "ORD-1", status: "delivered", amount: 100 },
        },
        {
          id: "doc2",
          path: "users/SASS0000010/orders/doc2",
          data: { orderId: "ORD-2", status: "pending", amount: 200 },
        },
      ],
    };

    const destInspection: DestinationInspectionResult = {
      docPath: "onlineCustomers/ONCUS0000010",
      exists: true,
      data: { fullName: "Micro Soft" },
      subcollections: {
        orders: {
          doc1: { orderId: "ORD-1", status: "delivered", amount: 100 }, // Identical
        },
      },
    };

    const plans = planSubcollectionRestore(sourceSub, "orders", "ONCUS0000010", destInspection);
    expect(plans).toHaveLength(2);

    const doc1Plan = plans.find((p) => p.documentId === "doc1");
    expect(doc1Plan?.action).toBe("IDENTICAL");

    const doc2Plan = plans.find((p) => p.documentId === "doc2");
    expect(doc2Plan?.action).toBe("CREATE");
  });

  // ==========================================================================
  // TEST 8: Conflicting Destination Documents Blocking Writes
  // ==========================================================================
  it("classifies differing destination documents as CONFLICT and flags plan as blocked", () => {
    const sourceSub = {
      count: 1,
      documents: [
        {
          id: "addr1",
          path: "users/SASS0000010/addresses/addr1",
          data: { city: "Tuticorin", pincode: "628001" },
        },
      ],
    };

    const destInspection: DestinationInspectionResult = {
      docPath: "onlineCustomers/ONCUS0000010",
      exists: true,
      data: { fullName: "Micro Soft" },
      subcollections: {
        addresses: {
          addr1: { city: "Chennai", pincode: "600001" }, // Conflicting data
        },
      },
    };

    const plans = planSubcollectionRestore(sourceSub, "addresses", "ONCUS0000010", destInspection);
    expect(plans).toHaveLength(1);
    expect(plans[0]?.action).toBe("CONFLICT");
    expect(plans[0]?.diffs).toBeDefined();
    expect(plans[0]?.diffs?.length).toBeGreaterThan(0);
  });

  // ==========================================================================
  // TEST 9: No Writes to Top-Level Orders or usersByUid
  // ==========================================================================
  it("ensures related top-level orders and usersByUid mappings are never routed into write actions", async () => {
    const mockReader: FirestoreDestinationReader = {
      async getDocument(docPath: string) {
        if (docPath === "onlineCustomers/ONCUS0000010" || docPath === "onlineCustomers/ONCUS0000021") {
          return { exists: true, data: { fullName: "Test Name" } };
        }
        return { exists: false, data: null };
      },
      async getSubcollectionDocs() {
        return [];
      },
    };

    const plan = await generateDryRunPlan({
      backupFilePath: DEFAULT_BACKUP_PATH,
      expectedChecksum: EXPECTED_BACKUP_SHA256,
      destinationReader: mockReader,
    });

    // Verify all planned destinations are exclusively within onlineCustomers/
    for (const c of plan.customers) {
      expect(c.destinationPath).toMatch(/^onlineCustomers\/ONCUS/);
      expect(c.destinationPath.startsWith("orders/")).toBe(false);
      expect(c.destinationPath.startsWith("usersByUid/")).toBe(false);
      for (const [subName, subPlans] of Object.entries(c.subcollectionPlans)) {
        for (const p of subPlans) {
          expect(p.destinationPath).toMatch(/^onlineCustomers\/ONCUS/);
          expect(p.destinationPath.startsWith("orders/")).toBe(false);
          expect(p.destinationPath.startsWith("usersByUid/")).toBe(false);
          expect(p.subcollection).toBe(subName);
        }
      }
    }
  });

  // ==========================================================================
  // TEST 10: Dry-Run Being the Default & Write Executor Blocking
  // ==========================================================================
  it("defaults strictly to DRY_RUN mode and executor rejects production writes with safety violation", async () => {
    const mockReader: FirestoreDestinationReader = {
      async getDocument(docPath: string) {
        return { exists: true, data: { fullName: "Test" } };
      },
      async getSubcollectionDocs() {
        return [];
      },
    };

    const plan = await generateDryRunPlan({
      backupFilePath: DEFAULT_BACKUP_PATH,
      expectedChecksum: EXPECTED_BACKUP_SHA256,
      destinationReader: mockReader,
    });

    expect(plan.mode).toBe("DRY_RUN");

    // Attempting to execute the plan throws safety invariant violation
    await expect(
      executeRestorePlan(plan, { enableProductionWrites: true })
    ).rejects.toThrow(/CRITICAL SAFETY VIOLATION: Production writes are strictly disabled in this phase/i);
  });

  // ==========================================================================
  // TEST 11: Missing Destination Documents Cause Safe Stop
  // ==========================================================================
  it("halts safely when destination document does not exist, rather than assuming empty state", async () => {
    const mockReaderMissingDest: FirestoreDestinationReader = {
      async getDocument() {
        return { exists: false, data: null }; // Destination missing
      },
      async getSubcollectionDocs() {
        return [];
      },
    };

    await expect(
      generateDryRunPlan({
        backupFilePath: DEFAULT_BACKUP_PATH,
        expectedChecksum: EXPECTED_BACKUP_SHA256,
        destinationReader: mockReaderMissingDest,
      })
    ).rejects.toThrow(/SAFETY HALT: Destination document 'onlineCustomers\/ONCUS0000010' does not exist/i);
  });
});
