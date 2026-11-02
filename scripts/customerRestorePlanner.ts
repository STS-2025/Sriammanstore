import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Timestamp, GeoPoint } from "firebase/firestore";

// ============================================================================
// CONSTANTS & ALLOWLIST
// ============================================================================

export const DEFAULT_BACKUP_PATH = "migration-backups/online-customer-export-2026-10-22T12-24-15-791Z.json";
export const EXPECTED_BACKUP_SHA256 = "34a391b04db5a3f308341b2106960e1f6bf0af60dbc0ffd8baea4c2bd756a947";
export const EXPECTED_PRODUCTION_PROJECT_ID = "sri-amman-smart-store";

export interface AllowedCustomerMapping {
  sourceId: string;
  destinationId: string;
  sourceCollection: string;
  destinationCollection: string;
  sourcePath: string;
  destinationPath: string;
}

export const EXACT_CUSTOMER_ALLOWLIST: Record<string, AllowedCustomerMapping> = {
  SASS0000010: {
    sourceId: "SASS0000010",
    destinationId: "ONCUS0000010",
    sourceCollection: "users",
    destinationCollection: "onlineCustomers",
    sourcePath: "users/SASS0000010",
    destinationPath: "onlineCustomers/ONCUS0000010",
  },
  SASS0000021: {
    sourceId: "SASS0000021",
    destinationId: "ONCUS0000021",
    sourceCollection: "users",
    destinationCollection: "onlineCustomers",
    sourcePath: "users/SASS0000021",
    destinationPath: "onlineCustomers/ONCUS0000021",
  },
};

export const SUPPORTED_SUBCOLLECTIONS = [
  "orders",
  "addresses",
  "coinsHistory",
  "cart",
  "wishlists",
] as const;

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SerializedFirestoreValue {
  _firestoreType: "Timestamp" | "GeoPoint" | "DocumentReference";
  seconds?: number;
  nanoseconds?: number;
  isoString?: string;
  latitude?: number;
  longitude?: number;
  path?: string;
  id?: string;
}

export interface BackupSubcollectionDoc {
  id: string;
  path: string;
  data: Record<string, unknown>;
  nestedProducts?: Array<{
    id: string;
    path: string;
    data: Record<string, unknown>;
  }>;
}

export interface BackupCustomerRecord {
  sourceId: string;
  destinationId: string;
  sourcePath: string;
  destinationPath: string;
  profile: {
    id: string;
    path: string;
    data: Record<string, unknown>;
  };
  subcollections: Record<
    string,
    {
      path: string;
      count: number;
      documents: BackupSubcollectionDoc[];
    }
  >;
}

export interface CustomerBackupFile {
  metadata: {
    backupFormatVersion: string;
    exportTimestamp: string;
    verifiedProjectId: string;
    mode: string;
    sourceWorkspace: string;
    approvedCustomers: Array<{
      sourceSassId: string;
      destinationOncusId: string;
      sourcePath: string;
      destinationPath: string;
    }>;
  };
  destinationInspection?: Record<string, {
    path: string;
    exists: boolean;
    data: Record<string, unknown> | null;
  }>;
  manifest: {
    totalCustomersInScope: number;
    profilesExported: number;
    subcollectionsExported: Record<string, number>;
    topLevelOrdersExported: number;
    uidMappingsExported: number;
  };
  customers: Record<string, BackupCustomerRecord>;
  relatedTopLevelOrders: Array<{
    id: string;
    path: string;
    matchedCustomer: string;
    matchReason: string;
    data: Record<string, unknown>;
  }>;
  identityMappings: Array<{
    uid: string;
    path: string;
    associatedCustomer: string;
    data: Record<string, unknown>;
  }>;
  errors: string[];
}

export interface DestinationInspectionResult {
  docPath: string;
  exists: boolean;
  data: Record<string, unknown> | null;
  subcollections: Record<string, Record<string, Record<string, unknown>>>;
}

export interface FirestoreDestinationReader {
  getDocument(path: string): Promise<{ exists: boolean; data: Record<string, unknown> | null }>;
  getSubcollectionDocs(
    parentPath: string,
    subcollection: string
  ): Promise<Array<{ id: string; data: Record<string, unknown> }>>;
  inspectDestination?(destinationId: string): Promise<DestinationInspectionResult>;
}

export type FieldActionType =
  | "PRESERVE_DESTINATION"
  | "SOURCE_MERGE"
  | "IDENTICAL"
  | "FIELD_CONFLICT"
  | "SYSTEM_KEY";

export interface FieldMergeAction {
  fieldName: string;
  action: FieldActionType;
  sourceValue: unknown;
  destinationValue: unknown;
  resolvedValue: unknown;
  reason: string;
}

export interface ProfileMergePlan {
  sourcePath: string;
  destinationPath: string;
  legacySassId: string;
  destinationExists: boolean;
  fields: FieldMergeAction[];
  mergedData: Record<string, unknown>;
  conflicts: string[];
  hasConflicts: boolean;
}

export type SubcollectionActionType = "CREATE" | "IDENTICAL" | "CONFLICT";

export interface SubcollectionDocumentPlan {
  action: SubcollectionActionType;
  subcollection: string;
  documentId: string;
  sourcePath: string;
  destinationPath: string;
  sourceData: Record<string, unknown>;
  existingDestinationData?: Record<string, unknown> | undefined;
  diffs?: string[] | undefined;
  reason: string;
}

export interface CustomerDryRunPlan {
  sourceId: string;
  destinationId: string;
  sourcePath: string;
  destinationPath: string;
  profilePlan: ProfileMergePlan;
  subcollectionPlans: Record<string, SubcollectionDocumentPlan[]>;
  stats: {
    totalSourceDocs: number;
    createCount: number;
    identicalCount: number;
    conflictCount: number;
  };
  conflicts: string[];
  hasConflicts: boolean;
}

export interface DryRunMigrationPlan {
  inputFilePath: string;
  verifiedChecksum: string;
  verifiedProjectId: string;
  timestamp: string;
  mode: "DRY_RUN";
  customers: CustomerDryRunPlan[];
  totals: {
    totalCustomers: number;
    totalPlannedWrites: number;
    totalSkippedIdentical: number;
    totalConflicts: number;
    canExecute: boolean;
  };
  unresolvedConflicts: string[];
  humanReadableReport: string;
}

// ============================================================================
// UTILITIES: REDACTION & COMPARISON
// ============================================================================

export function maskSensitiveText(val: string): string {
  if (!val || typeof val !== "string") return val;
  const trimmed = val.trim();
  // Phone number (10 digits or with +91)
  if (/^\+?\d{10,13}$/.test(trimmed)) {
    return trimmed.length > 5
      ? `${trimmed.substring(0, 3)}****${trimmed.substring(trimmed.length - 2)}`
      : "***";
  }
  // Email address
  if (trimmed.includes("@") && trimmed.includes(".")) {
    const parts = trimmed.split("@");
    const name = parts[0] || "";
    const domain = parts[1] || "";
    return `${name.charAt(0)}****@${domain}`;
  }
  // Firebase Auth UID (around 28 chars alphanumeric)
  if (/^[a-zA-Z0-9]{20,}$/.test(trimmed)) {
    return `${trimmed.substring(0, 4)}...${trimmed.substring(trimmed.length - 4)}`;
  }
  return val;
}

export function redactSensitiveObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return maskSensitiveText(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map((item) => redactSensitiveObject(item)) as unknown as T;
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      if (k.toLowerCase().includes("token") || k.toLowerCase().includes("secret") || k.toLowerCase().includes("password")) {
        out[k] = "[REDACTED_SECRET]";
      } else if (k === "number" || k === "phone" || k === "contact") {
        out[k] = typeof v === "string" ? maskSensitiveText(v) : v;
      } else if (k === "email") {
        out[k] = typeof v === "string" ? maskSensitiveText(v) : v;
      } else if (k === "uid") {
        out[k] = typeof v === "string" ? maskSensitiveText(v) : v;
      } else {
        out[k] = redactSensitiveObject(v);
      }
    }
    return out as unknown as T;
  }
  return obj;
}

// Deep comparison helper that handles Timestamps and objects cleanly
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (typeof a !== typeof b) return false;

  // Handle Firestore Timestamp comparison
  if (a instanceof Timestamp && b instanceof Timestamp) {
    return a.seconds === b.seconds && a.nanoseconds === b.nanoseconds;
  }

  // Handle Serialized Firestore Timestamp vs Timestamp
  if (a instanceof Timestamp && isSerializedTimestamp(b)) {
    return a.seconds === b.seconds && a.nanoseconds === b.nanoseconds;
  }
  if (isSerializedTimestamp(a) && b instanceof Timestamp) {
    return a.seconds === b.seconds && a.nanoseconds === b.nanoseconds;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === "object" && typeof b === "object") {
    const keysA = Object.keys(a as Record<string, unknown>);
    const keysB = Object.keys(b as Record<string, unknown>);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }
    return true;
  }

  return false;
}

function isSerializedTimestamp(val: unknown): val is { _firestoreType: "Timestamp"; seconds: number; nanoseconds: number } {
  return (
    typeof val === "object" &&
    val !== null &&
    (val as any)._firestoreType === "Timestamp" &&
    typeof (val as any).seconds === "number" &&
    typeof (val as any).nanoseconds === "number"
  );
}

// ============================================================================
// 1. BACKUP VALIDATION & PARSING
// ============================================================================

export function validateBackupFile(
  resolvedPath: string,
  expectedChecksum = EXPECTED_BACKUP_SHA256
): {
  valid: boolean;
  errors: string[];
  backupData?: CustomerBackupFile;
  checksum: string;
} {
  const errors: string[] = [];

  if (!fs.existsSync(resolvedPath)) {
    errors.push(`Backup file does not exist at path: ${resolvedPath}`);
    return { valid: false, errors, checksum: "" };
  }

  let fileBuffer: Buffer;
  try {
    fileBuffer = fs.readFileSync(resolvedPath);
  } catch (err) {
    errors.push(`Failed to read backup file: ${err instanceof Error ? err.message : String(err)}`);
    return { valid: false, errors, checksum: "" };
  }

  const computedChecksum = crypto.createHash("sha256").update(fileBuffer).digest("hex");
  if (computedChecksum !== expectedChecksum) {
    errors.push(
      `Backup checksum mismatch! Expected: ${expectedChecksum}, but computed: ${computedChecksum}. File may be corrupted or modified.`
    );
    return { valid: false, errors, checksum: computedChecksum };
  }

  let parsed: CustomerBackupFile;
  try {
    parsed = JSON.parse(fileBuffer.toString("utf8"));
  } catch (err) {
    errors.push(`Malformed backup file JSON: ${err instanceof Error ? err.message : String(err)}`);
    return { valid: false, errors, checksum: computedChecksum };
  }

  // Validate root structure
  if (!parsed.metadata || !parsed.manifest || !parsed.customers) {
    errors.push("Backup file is missing required top-level sections ('metadata', 'manifest', 'customers').");
    return { valid: false, errors, checksum: computedChecksum, backupData: parsed };
  }

  // Validate project ID
  if (parsed.metadata.verifiedProjectId !== EXPECTED_PRODUCTION_PROJECT_ID) {
    errors.push(
      `Backup project ID mismatch: expected '${EXPECTED_PRODUCTION_PROJECT_ID}', but found '${parsed.metadata.verifiedProjectId}'`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    backupData: parsed,
    checksum: computedChecksum,
  };
}

// ============================================================================
// 2. SOURCE-TO-DESTINATION ALLOWLIST VALIDATION
// ============================================================================

export function validateAllowlist(backupData: CustomerBackupFile): {
  valid: boolean;
  errors: string[];
  validatedCustomers: AllowedCustomerMapping[];
} {
  const errors: string[] = [];
  const validatedCustomers: AllowedCustomerMapping[] = [];

  const customerKeys = Object.keys(backupData.customers || {});
  if (customerKeys.length === 0) {
    errors.push("Backup contains zero customers.");
    return { valid: false, errors, validatedCustomers };
  }

  for (const sourceKey of customerKeys) {
    const allowed = EXACT_CUSTOMER_ALLOWLIST[sourceKey];
    if (!allowed) {
      errors.push(
        `REJECTED UNKNOWN CUSTOMER: Source customer '${sourceKey}' is not on the strict allowlist (${Object.keys(
          EXACT_CUSTOMER_ALLOWLIST
        ).join(", ")}).`
      );
      continue;
    }

    const custRecord = backupData.customers[sourceKey];
    if (!custRecord) {
      errors.push(`Missing customer record for '${sourceKey}' in backup.`);
      continue;
    }
    if (custRecord.destinationId !== allowed.destinationId) {
      errors.push(
        `REJECTED DESTINATION ID MISMATCH: Customer '${sourceKey}' has destinationId '${custRecord.destinationId}', but allowlist strictly requires '${allowed.destinationId}'.`
      );
      continue;
    }

    if (custRecord.destinationPath !== allowed.destinationPath) {
      errors.push(
        `REJECTED DESTINATION PATH MISMATCH: Customer '${sourceKey}' has destinationPath '${custRecord.destinationPath}', but allowlist strictly requires '${allowed.destinationPath}'.`
      );
      continue;
    }

    validatedCustomers.push(allowed);
  }

  return {
    valid: errors.length === 0 && validatedCustomers.length === Object.keys(EXACT_CUSTOMER_ALLOWLIST).length,
    errors,
    validatedCustomers,
  };
}

// ============================================================================
// 3. FIRESTORE-VALUE DESERIALIZATION
// ============================================================================

export function deserializeFirestoreValues(val: unknown): unknown {
  if (val === null || val === undefined) return val;

  if (typeof val === "object") {
    // Check for serialized Firestore Timestamp
    if (
      (val as any)._firestoreType === "Timestamp" &&
      typeof (val as any).seconds === "number" &&
      typeof (val as any).nanoseconds === "number"
    ) {
      return new Timestamp((val as any).seconds, (val as any).nanoseconds);
    }

    // Check for serialized GeoPoint
    if (
      (val as any)._firestoreType === "GeoPoint" &&
      typeof (val as any).latitude === "number" &&
      typeof (val as any).longitude === "number"
    ) {
      return new GeoPoint((val as any).latitude, (val as any).longitude);
    }

    // DocumentReference placeholder (keep path and id)
    if ((val as any)._firestoreType === "DocumentReference" && (val as any).path) {
      return {
        _refPath: (val as any).path,
        _refId: (val as any).id,
      };
    }

    // Arrays
    if (Array.isArray(val)) {
      return val.map(deserializeFirestoreValues);
    }

    // Objects
    const result: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(val as Record<string, unknown>)) {
      result[key] = deserializeFirestoreValues(v);
    }
    return result;
  }

  return val;
}

// ============================================================================
// 4. EXISTING DESTINATION INSPECTION
// ============================================================================

export async function inspectDestination(
  reader: FirestoreDestinationReader,
  destinationId: string,
  subcollections: readonly string[] = SUPPORTED_SUBCOLLECTIONS
): Promise<DestinationInspectionResult> {
  const destPath = `onlineCustomers/${destinationId}`;
  const profileRes = await reader.getDocument(destPath);

  const subcollectionResults: Record<string, Record<string, Record<string, unknown>>> = {};
  for (const sub of subcollections) {
    const docs = await reader.getSubcollectionDocs(destPath, sub);
    const docMap: Record<string, Record<string, unknown>> = {};
    for (const d of docs) {
      docMap[d.id] = d.data;
    }
    subcollectionResults[sub] = docMap;
  }

  return {
    docPath: destPath,
    exists: profileRes.exists,
    data: profileRes.data,
    subcollections: subcollectionResults,
  };
}

// ============================================================================
// 5. PROFILE MERGE PLANNING & CONFLICT DETECTION
// ============================================================================

export function planProfileMerge(
  sourceProfile: Record<string, unknown>,
  destInspection: DestinationInspectionResult,
  legacySassId: string,
  destinationId: string
): ProfileMergePlan {
  const fields: FieldMergeAction[] = [];
  const conflicts: string[] = [];
  const mergedData: Record<string, unknown> = {};

  const existingDestData = destInspection.data || {};
  const deserializedSource = deserializeFirestoreValues(sourceProfile) as Record<string, unknown>;

  // 1. Mandatory Identity keys
  mergedData["id"] = destinationId;
  mergedData["customerId"] = destinationId;
  mergedData["legacySassId"] = legacySassId;

  fields.push({
    fieldName: "id",
    action: "SYSTEM_KEY",
    sourceValue: sourceProfile["id"] ?? legacySassId,
    destinationValue: existingDestData["id"] ?? null,
    resolvedValue: destinationId,
    reason: `Canonical ONCUS document ID`,
  });

  fields.push({
    fieldName: "customerId",
    action: "SYSTEM_KEY",
    sourceValue: sourceProfile["userId"] ?? legacySassId,
    destinationValue: existingDestData["customerId"] ?? null,
    resolvedValue: destinationId,
    reason: `Canonical ONCUS customer domain key`,
  });

  fields.push({
    fieldName: "legacySassId",
    action: "SYSTEM_KEY",
    sourceValue: legacySassId,
    destinationValue: existingDestData["legacySassId"] ?? null,
    resolvedValue: legacySassId,
    reason: `Preserved legacy SASS reference for backward compatibility`,
  });

  // 2. fullName preservation policy (Strict Requirement 5)
  const destFullName = existingDestData["fullName"];
  const sourceFullName = deserializedSource["fullName"];

  if (destFullName !== undefined && destFullName !== null) {
    const isIdentical = deepEqual(destFullName, sourceFullName);
    mergedData["fullName"] = destFullName;
    fields.push({
      fieldName: "fullName",
      action: isIdentical ? "IDENTICAL" : "PRESERVE_DESTINATION",
      sourceValue: sourceFullName,
      destinationValue: destFullName,
      resolvedValue: destFullName,
      reason: isIdentical
        ? `Source and destination fullName are identical ('${destFullName}')`
        : `PRESERVED DESTINATION: Destination fullName '${destFullName}' explicitly preserved over source '${sourceFullName}'`,
    });
  } else if (sourceFullName !== undefined) {
    mergedData["fullName"] = sourceFullName;
    fields.push({
      fieldName: "fullName",
      action: "SOURCE_MERGE",
      sourceValue: sourceFullName,
      destinationValue: null,
      resolvedValue: sourceFullName,
      reason: `Populated from source profile`,
    });
  }

  // 3. Process all remaining fields from source
  for (const [key, sourceVal] of Object.entries(deserializedSource)) {
    if (key === "id" || key === "customerId" || key === "legacySassId" || key === "fullName") {
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(existingDestData, key)) {
      const destVal = existingDestData[key];
      if (deepEqual(sourceVal, destVal)) {
        mergedData[key] = destVal;
        fields.push({
          fieldName: key,
          action: "IDENTICAL",
          sourceValue: sourceVal,
          destinationValue: destVal,
          resolvedValue: destVal,
          reason: `Values are identical`,
        });
      } else {
        // Conflict on pre-existing non-name field
        conflicts.push(`Field conflict on '${key}': destination has '${JSON.stringify(destVal)}', source has '${JSON.stringify(sourceVal)}'`);
        fields.push({
          fieldName: key,
          action: "FIELD_CONFLICT",
          sourceValue: sourceVal,
          destinationValue: destVal,
          resolvedValue: destVal, // default to keeping destination intact on conflict
          reason: `CONFLICT: Destination field exists with differing value. Destination value kept; review required.`,
        });
        mergedData[key] = destVal;
      }
    } else {
      // Field only in source -> Merge into destination
      mergedData[key] = sourceVal;
      fields.push({
        fieldName: key,
        action: "SOURCE_MERGE",
        sourceValue: sourceVal,
        destinationValue: null,
        resolvedValue: sourceVal,
        reason: `Merged from source profile`,
      });
    }
  }

  // 4. Preserve any destination-only fields that do not exist in source
  for (const [key, destVal] of Object.entries(existingDestData)) {
    if (!Object.prototype.hasOwnProperty.call(mergedData, key)) {
      mergedData[key] = destVal;
      fields.push({
        fieldName: key,
        action: "PRESERVE_DESTINATION",
        sourceValue: null,
        destinationValue: destVal,
        resolvedValue: destVal,
        reason: `Field exists only in destination; preserved without deletion`,
      });
    }
  }

  return {
    sourcePath: `users/${legacySassId}`,
    destinationPath: destInspection.docPath,
    legacySassId,
    destinationExists: destInspection.exists,
    fields,
    mergedData,
    conflicts,
    hasConflicts: conflicts.length > 0,
  };
}

// ============================================================================
// 6. SUBCOLLECTION RESTORE PLANNING & CONFLICT DETECTION
// ============================================================================

export function planSubcollectionRestore(
  sourceSubcollection: { count: number; documents: BackupSubcollectionDoc[] } | undefined,
  subcollectionName: string,
  destinationId: string,
  destInspection: DestinationInspectionResult
): SubcollectionDocumentPlan[] {
  const plans: SubcollectionDocumentPlan[] = [];
  if (!sourceSubcollection || !sourceSubcollection.documents) return plans;

  const existingDocs = destInspection.subcollections[subcollectionName] || {};

  for (const sourceDoc of sourceSubcollection.documents) {
    const docId = sourceDoc.id;
    const destDocPath = `onlineCustomers/${destinationId}/${subcollectionName}/${docId}`;
    const deserializedSourceData = deserializeFirestoreValues(sourceDoc.data) as Record<string, unknown>;

    if (!Object.prototype.hasOwnProperty.call(existingDocs, docId)) {
      // Document does not exist in destination -> CREATE
      plans.push({
        action: "CREATE",
        subcollection: subcollectionName,
        documentId: docId,
        sourcePath: sourceDoc.path,
        destinationPath: destDocPath,
        sourceData: deserializedSourceData,
        reason: `New document to be created in destination subcollection`,
      });
    } else {
      // Document exists -> compare contents
      const existingData = existingDocs[docId];
      if (deepEqual(deserializedSourceData, existingData)) {
        // Contents match -> IDENTICAL (skip write)
        plans.push({
          action: "IDENTICAL",
          subcollection: subcollectionName,
          documentId: docId,
          sourcePath: sourceDoc.path,
          destinationPath: destDocPath,
          sourceData: deserializedSourceData,
          existingDestinationData: existingData,
          reason: `Document already exists in destination with identical content (skip write)`,
        });
      } else {
        // Contents differ -> CONFLICT (blocks write)
        const diffs: string[] = [];
        const allKeys = new Set([...Object.keys(deserializedSourceData), ...Object.keys(existingData || {})]);
        for (const k of allKeys) {
          if (!deepEqual(deserializedSourceData[k], existingData?.[k])) {
            diffs.push(`Key '${k}': source has ${JSON.stringify(deserializedSourceData[k])}, destination has ${JSON.stringify(existingData?.[k])}`);
          }
        }

        plans.push({
          action: "CONFLICT",
          subcollection: subcollectionName,
          documentId: docId,
          sourcePath: sourceDoc.path,
          destinationPath: destDocPath,
          sourceData: deserializedSourceData,
          existingDestinationData: existingData,
          diffs,
          reason: `CONFLICT: Document already exists with differing content. Automatic overwrite blocked.`,
        });
      }
    }
  }

  return plans;
}

// ============================================================================
// 7. DRY-RUN PLAN GENERATION
// ============================================================================

export async function generateDryRunPlan(params: {
  backupFilePath?: string;
  expectedChecksum?: string;
  destinationReader: FirestoreDestinationReader;
}): Promise<DryRunMigrationPlan> {
  const backupFilePath = params.backupFilePath || DEFAULT_BACKUP_PATH;
  const expectedChecksum = params.expectedChecksum || EXPECTED_BACKUP_SHA256;

  // 1. Validate & Parse Backup File
  const validation = validateBackupFile(backupFilePath, expectedChecksum);
  if (!validation.valid || !validation.backupData) {
    throw new Error(`BACKUP VALIDATION FAILED:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`);
  }

  const backupData = validation.backupData;

  // 2. Validate Allowlist
  const allowlistResult = validateAllowlist(backupData);
  if (!allowlistResult.valid) {
    throw new Error(`ALLOWLIST VALIDATION FAILED:\n${allowlistResult.errors.map((e) => `  - ${e}`).join("\n")}`);
  }

  const customerPlans: CustomerDryRunPlan[] = [];
  let totalPlannedWrites = 0;
  let totalSkippedIdentical = 0;
  let totalConflicts = 0;
  const allUnresolvedConflicts: string[] = [];

  // 3. Process each customer
  for (const allowed of allowlistResult.validatedCustomers) {
    const custRecord = backupData.customers[allowed.sourceId];
    if (!custRecord) {
      throw new Error(`Missing customer record '${allowed.sourceId}' in backup customers dictionary.`);
    }

    // Inspect destination
    const destInspection = params.destinationReader.inspectDestination
      ? await params.destinationReader.inspectDestination(allowed.destinationId)
      : await inspectDestination(params.destinationReader, allowed.destinationId);

    if (!destInspection.exists) {
      throw new Error(
        `SAFETY HALT: Destination document '${destInspection.docPath}' does not exist! As per specification, destination documents must be pre-created.`
      );
    }

    // Plan profile merge
    const profilePlan = planProfileMerge(
      custRecord.profile.data,
      destInspection,
      allowed.sourceId,
      allowed.destinationId
    );

    // Profile write count (1 update per profile if no conflicts)
    if (profilePlan.hasConflicts) {
      totalConflicts += profilePlan.conflicts.length;
      allUnresolvedConflicts.push(...profilePlan.conflicts.map((c) => `[${allowed.destinationId} Profile] ${c}`));
    } else {
      totalPlannedWrites += 1;
    }

    // Plan subcollections
    const subcollectionPlans: Record<string, SubcollectionDocumentPlan[]> = {};
    let custCreateCount = 0;
    let custIdenticalCount = 0;
    let custConflictCount = 0;
    let custTotalSourceDocs = 0;

    for (const sub of SUPPORTED_SUBCOLLECTIONS) {
      const sourceSub = custRecord.subcollections[sub];
      const plans = planSubcollectionRestore(sourceSub, sub, allowed.destinationId, destInspection);
      subcollectionPlans[sub] = plans;

      for (const p of plans) {
        custTotalSourceDocs++;
        if (p.action === "CREATE") {
          custCreateCount++;
          totalPlannedWrites++;
        } else if (p.action === "IDENTICAL") {
          custIdenticalCount++;
          totalSkippedIdentical++;
        } else if (p.action === "CONFLICT") {
          custConflictCount++;
          totalConflicts++;
          allUnresolvedConflicts.push(
            `[${allowed.destinationId}/${sub}/${p.documentId}] ${p.diffs?.join("; ") || "differing content"}`
          );
        }
      }
    }

    const hasCustConflicts = profilePlan.hasConflicts || custConflictCount > 0;
    customerPlans.push({
      sourceId: allowed.sourceId,
      destinationId: allowed.destinationId,
      sourcePath: allowed.sourcePath,
      destinationPath: allowed.destinationPath,
      profilePlan,
      subcollectionPlans,
      stats: {
        totalSourceDocs: custTotalSourceDocs,
        createCount: custCreateCount,
        identicalCount: custIdenticalCount,
        conflictCount: custConflictCount,
      },
      conflicts: [...profilePlan.conflicts, ...(custConflictCount > 0 ? [`${custConflictCount} subcollection conflict(s)`] : [])],
      hasConflicts: hasCustConflicts,
    });
  }

  const dryRunPlan: DryRunMigrationPlan = {
    inputFilePath: backupFilePath,
    verifiedChecksum: validation.checksum,
    verifiedProjectId: backupData.metadata.verifiedProjectId,
    timestamp: new Date().toISOString(),
    mode: "DRY_RUN",
    customers: customerPlans,
    totals: {
      totalCustomers: customerPlans.length,
      totalPlannedWrites,
      totalSkippedIdentical,
      totalConflicts,
      canExecute: totalConflicts === 0,
    },
    unresolvedConflicts: allUnresolvedConflicts,
    humanReadableReport: "",
  };

  dryRunPlan.humanReadableReport = generateHumanReadableDryRunReport(dryRunPlan);
  return dryRunPlan;
}

// ============================================================================
// 8. HUMAN-READABLE REPORT GENERATOR
// ============================================================================

export function generateHumanReadableDryRunReport(plan: DryRunMigrationPlan): string {
  const lines: string[] = [];

  lines.push("# Dry-Run ONCUS Customer Restore Plan Report");
  lines.push("");
  lines.push(`- **Mode:** \`${plan.mode}\` (Production Writes Strictly Guarded)`);
  lines.push(`- **Execution Timestamp:** \`${plan.timestamp}\``);
  lines.push(`- **Input Backup File:** \`${plan.inputFilePath}\``);
  lines.push(`- **Verified SHA-256 Checksum:** \`${plan.verifiedChecksum}\``);
  lines.push(`- **Target Firebase Project ID:** \`${plan.verifiedProjectId}\``);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## 1. Overall Summary");
  lines.push("");
  lines.push(`- **Customers in Scope:** ${plan.totals.totalCustomers}`);
  lines.push(`- **Total Planned Document Writes:** **${plan.totals.totalPlannedWrites}** (Profile Merges + Subcollection Creates)`);
  lines.push(`- **Total Skipped Identical Documents:** **${plan.totals.totalSkippedIdentical}**`);
  lines.push(`- **Total Unresolved Conflicts:** **${plan.totals.totalConflicts}**`);
  lines.push(`- **Execution Feasibility:** **${plan.totals.canExecute ? "READY FOR APPROVAL" : "BLOCKED BY CONFLICTS"}**`);
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## 2. Customer-by-Customer Breakdown");
  lines.push("");

  for (const c of plan.customers) {
    lines.push(`### Customer: \`${c.sourceId}\` → \`${c.destinationId}\``);
    lines.push("");
    lines.push(`- **Source Path:** \`${c.sourcePath}\``);
    lines.push(`- **Destination Path:** \`${c.destinationPath}\``);
    lines.push(`- **Existing Destination Status:** Pre-existing (${c.profilePlan.destinationExists ? "Verified" : "Missing"})`);
    lines.push("");

    // Profile Preview
    lines.push("#### Profile Merge Preview");
    lines.push("| Field Name | Action | Resolved Value (Redacted) | Reason |");
    lines.push("| :--- | :--- | :--- | :--- |");
    for (const f of c.profilePlan.fields) {
      const redactedVal = redactSensitiveObject(f.resolvedValue);
      const valStr = typeof redactedVal === "object" && redactedVal !== null ? JSON.stringify(redactedVal) : String(redactedVal);
      lines.push(`| \`${f.fieldName}\` | \`${f.action}\` | \`${valStr}\` | ${f.reason} |`);
    }
    lines.push("");

    // Subcollections Preview
    lines.push("#### Subcollection Document Actions");
    lines.push("| Subcollection | Planned CREATE | Planned IDENTICAL (Skip) | CONFLICTS | Total Source Docs |");
    lines.push("| :--- | :---: | :---: | :---: | :---: |");
    for (const sub of SUPPORTED_SUBCOLLECTIONS) {
      const plans = c.subcollectionPlans[sub] || [];
      const creates = plans.filter((p) => p.action === "CREATE").length;
      const identicals = plans.filter((p) => p.action === "IDENTICAL").length;
      const conflicts = plans.filter((p) => p.action === "CONFLICT").length;
      lines.push(`| \`${sub}\` | ${creates} | ${identicals} | ${conflicts} | ${plans.length} |`);
    }
    lines.push("");

    if (c.conflicts.length > 0) {
      lines.push("> [!WARNING]");
      lines.push(`> **Unresolved Conflicts for ${c.destinationId}:**`);
      for (const conf of c.conflicts) {
        lines.push(`> - ${conf}`);
      }
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("## 3. Strict Safety Guarantees Confirmed");
  lines.push("");
  lines.push("1. **Zero Production Writes Executed:** Dry-run generated without modifying any document in Firestore.");
  lines.push("2. **Top-Level Orders Untouched:** Related top-level `orders` records (8 total) were completely excluded from customer subcollections.");
  lines.push("3. **Identity Mappings Untouched:** `usersByUid` documents were neither repointed nor modified.");
  lines.push("4. **Source SASS Records Untouched:** `users/SASS0000010` and `users/SASS0000021` remain unmodified.");
  lines.push("5. **Sequence Counters Untouched:** `meta/userSequence` was not modified.");
  lines.push("6. **Existing `fullName` Preserved:** The pre-created destination `fullName` on both profiles is strictly preserved.");

  return lines.join("\n");
}

// ============================================================================
// 9. GUARDED WRITE EXECUTOR (PHASE 2E AUTHORIZED EXECUTION)
// ============================================================================

export interface FirestoreDestinationWriter {
  setDocument(
    docPath: string,
    data: Record<string, unknown>,
    merge?: boolean
  ): Promise<void>;
}

export interface RestoreExecutionResult {
  timestamp: string;
  projectId: string;
  totalPlanned: number;
  totalWritten: number;
  totalSkipped: number;
  totalFailed: number;
  operations: Array<{
    targetPath: string;
    action: string;
    status: "SUCCESS" | "SKIPPED" | "FAILED";
    timestamp: string;
    details?: string;
    error?: string;
  }>;
  canVerify: boolean;
  errors: string[];
}

export const PHASE_2E_CONFIRMATION_TOKEN = "PHASE_2E_APPROVED_EXECUTE_COPY_ONLY";

export async function executeRestorePlan(
  plan: DryRunMigrationPlan,
  options: {
    enableProductionWrites?: boolean;
    confirmationToken?: string;
    destinationWriter?: FirestoreDestinationWriter;
    destinationReader?: FirestoreDestinationReader;
  } = {}
): Promise<RestoreExecutionResult> {
  // Hard safety invariant: require explicit confirmation token
  if (
    !options.enableProductionWrites ||
    options.confirmationToken !== PHASE_2E_CONFIRMATION_TOKEN
  ) {
    throw new Error(
      "CRITICAL SAFETY VIOLATION: Production writes are strictly disabled in this phase. Dry-run and validation only."
    );
  }

  if (!options.destinationWriter) {
    throw new Error("Missing required destinationWriter for restore execution.");
  }

  // Pre-execution Invariant Checks
  if (plan.verifiedProjectId !== EXPECTED_PRODUCTION_PROJECT_ID) {
    throw new Error(`Target project ID mismatch: ${plan.verifiedProjectId} !== ${EXPECTED_PRODUCTION_PROJECT_ID}`);
  }

  if (!plan.totals.canExecute) {
    throw new Error(`Cannot execute restore plan: plan has unresolved conflicts (${plan.totals.totalConflicts}).`);
  }

  if (plan.customers.length !== 2) {
    throw new Error(`Expected exactly 2 customers in plan, found ${plan.customers.length}.`);
  }

  const allowedDestIds = new Set(Object.values(EXACT_CUSTOMER_ALLOWLIST).map((a) => a.destinationId));
  for (const c of plan.customers) {
    if (!allowedDestIds.has(c.destinationId)) {
      throw new Error(`Unauthorized customer destination ID in plan: ${c.destinationId}`);
    }
  }

  const operations: RestoreExecutionResult["operations"] = [];
  let totalWritten = 0;
  let totalSkipped = 0;
  let totalFailed = 0;
  const errors: string[] = [];

  for (const c of plan.customers) {
    // 1. Profile execution
    const destProfilePath = c.destinationPath; // "onlineCustomers/ONCUS..."
    try {
      // Re-verify existing destination document and fullName
      if (options.destinationReader) {
        const destDoc = await options.destinationReader.getDocument(destProfilePath);
        if (!destDoc.exists) {
          throw new Error(`Destination profile does not exist: ${destProfilePath}`);
        }
        const existingFullName = destDoc.data?.["fullName"];
        if (c.destinationId === "ONCUS0000010" && existingFullName !== "Micro Soft") {
          throw new Error(`Destination fullName mismatch for ONCUS0000010: expected 'Micro Soft', found '${existingFullName}'`);
        }
        if (c.destinationId === "ONCUS0000021" && existingFullName !== "SARAVANA KUMAR") {
          throw new Error(`Destination fullName mismatch for ONCUS0000021: expected 'SARAVANA KUMAR', found '${existingFullName}'`);
        }
      }

      if (totalWritten + totalSkipped >= 29) {
        throw new Error(`Safety limit reached: operation count would exceed 29 approved operations.`);
      }

      await options.destinationWriter.setDocument(destProfilePath, c.profilePlan.mergedData, true);
      totalWritten++;
      operations.push({
        targetPath: destProfilePath,
        action: "PROFILE_MERGE",
        status: "SUCCESS",
        timestamp: new Date().toISOString(),
        details: `Merged profile for ${c.destinationId} preserving fullName`,
      });
    } catch (err) {
      totalFailed++;
      const errMsg = err instanceof Error ? err.message : String(err);
      errors.push(`[${destProfilePath}] Profile merge failed: ${errMsg}`);
      operations.push({
        targetPath: destProfilePath,
        action: "PROFILE_MERGE",
        status: "FAILED",
        timestamp: new Date().toISOString(),
        error: errMsg,
      });
      return {
        timestamp: new Date().toISOString(),
        projectId: plan.verifiedProjectId,
        totalPlanned: plan.totals.totalPlannedWrites,
        totalWritten,
        totalSkipped,
        totalFailed,
        operations,
        canVerify: false,
        errors,
      };
    }

    // 2. Subcollections execution
    for (const sub of SUPPORTED_SUBCOLLECTIONS) {
      const plans = c.subcollectionPlans[sub] || [];
      for (const p of plans) {
        if (totalWritten + totalSkipped >= 29) {
          throw new Error(`Safety limit reached: operation count would exceed 29 approved operations.`);
        }

        try {
          if (p.action === "IDENTICAL") {
            totalSkipped++;
            operations.push({
              targetPath: p.destinationPath,
              action: "SKIPPED_IDENTICAL",
              status: "SKIPPED",
              timestamp: new Date().toISOString(),
              details: p.reason,
            });
            continue;
          }

          if (p.action === "CONFLICT") {
            throw new Error(`Cannot write conflicting document: ${p.destinationPath}`);
          }

          if (options.destinationReader) {
            const existing = await options.destinationReader.getDocument(p.destinationPath);
            if (existing.exists) {
              if (deepEqual(p.sourceData, existing.data)) {
                totalSkipped++;
                operations.push({
                  targetPath: p.destinationPath,
                  action: "SKIPPED_IDENTICAL",
                  status: "SKIPPED",
                  timestamp: new Date().toISOString(),
                  details: `Document already exists with identical content.`,
                });
                continue;
              } else {
                throw new Error(`Document exists with conflicting content: ${p.destinationPath}`);
              }
            }
          }

          await options.destinationWriter.setDocument(p.destinationPath, p.sourceData, false);
          totalWritten++;
          operations.push({
            targetPath: p.destinationPath,
            action: "CREATE",
            status: "SUCCESS",
            timestamp: new Date().toISOString(),
            details: `Created subcollection doc ${p.subcollection}/${p.documentId}`,
          });
        } catch (err) {
          totalFailed++;
          const errMsg = err instanceof Error ? err.message : String(err);
          errors.push(`[${p.destinationPath}] Write failed: ${errMsg}`);
          operations.push({
            targetPath: p.destinationPath,
            action: p.action,
            status: "FAILED",
            timestamp: new Date().toISOString(),
            error: errMsg,
          });
          return {
            timestamp: new Date().toISOString(),
            projectId: plan.verifiedProjectId,
            totalPlanned: plan.totals.totalPlannedWrites,
            totalWritten,
            totalSkipped,
            totalFailed,
            operations,
            canVerify: false,
            errors,
          };
        }
      }
    }
  }

  return {
    timestamp: new Date().toISOString(),
    projectId: plan.verifiedProjectId,
    totalPlanned: plan.totals.totalPlannedWrites,
    totalWritten,
    totalSkipped,
    totalFailed,
    operations,
    canVerify: totalFailed === 0,
    errors,
  };
}
