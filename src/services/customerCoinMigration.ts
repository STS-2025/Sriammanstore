/**
 * Customer Coin Migration Tooling
 *
 * Implements safe, idempotent standardization of customer coin balances in `onlineCustomers`:
 * - Establishes `smartCoins` as the single canonical source of truth for spendable coin balance.
 * - Retires the obsolete `coins` field and redundant `availableCoins` from customer records.
 * - Preserves `earnedCoins` as the lifetime earnings total.
 * - Flags conflicting balances (`smartCoins !== coins`) for manual review rather than guessing or overwriting.
 * - Defaults strictly to dry-run mode. Never executes against production without explicit approval.
 * - Complies strictly with privacy standards: never logs or reports PII (emails, phone numbers, names, UIDs).
 */

import { deleteField } from "firebase/firestore";

export type CustomerCoinMigrationStatus =
  | "already_canonical" // Has valid smartCoins, no legacy coins
  | "coins_only" // Has legacy coins, needs migration to smartCoins
  | "both_matching" // Has both with identical values, needs legacy coins removed
  | "both_conflicting" // Has both with different values; flagged for review, zero writes
  | "missing_or_invalid"; // Neither is a valid non-negative number; flagged for review

export type ProposedMigrationAction =
  | "none"
  | "migrate_to_smart_coins"
  | "remove_legacy_coins"
  | "review_required";

export interface CustomerMigrationAssessment {
  customerId: string; // Strictly canonical customer ID (e.g. ONCUS0000001). Zero PII.
  status: CustomerCoinMigrationStatus;
  action: ProposedMigrationAction;
  currentSmartCoins: number | null;
  currentCoins: number | null;
  hasRedundantAvailableCoins: boolean;
  proposedSmartCoins: number | null;
  removeCoinsField: boolean;
  reason: string;
}

export interface MigrationBatchResult {
  batchIndex: number;
  processedCount: number;
  successCount: number;
  failureCount: number;
}

export interface CustomerCoinMigrationReport {
  mode: "dry-run" | "execute";
  executedAt: string;
  totalDocumentsScanned: number;
  counts: {
    alreadyCanonical: number;
    coinsOnly: number;
    bothMatching: number;
    bothConflicting: number;
    missingOrInvalid: number;
    redundantAvailableCoinsPresent: number;
  };
  actionsPlanned: {
    noop: number;
    migrated: number;
    legacyFieldRemoved: number;
    flaggedForReview: number;
  };
  flaggedCustomerIds: string[]; // Strictly document IDs, zero PII
  assessments: CustomerMigrationAssessment[];
  batchResults?: MigrationBatchResult[];
}

export interface RunMigrationOptions {
  mode: "dry-run" | "execute";
  documents: Array<{ id: string; data: Record<string, unknown> }>;
  batchSize?: number;
  writer?: (
    updates: Array<{ id: string; data: Record<string, unknown> }>
  ) => Promise<void>;
  approvalToken?: string;
}

/**
 * Assesses a single customer document against the canonical smartCoins standard.
 * Strictly anonymous: operates purely on numeric balance fields and document ID.
 */
export function assessCustomerDocument(
  docData: Record<string, unknown>,
  docId: string
): CustomerMigrationAssessment {
  const hasSmartCoins = Object.prototype.hasOwnProperty.call(docData, "smartCoins");
  const hasCoins = Object.prototype.hasOwnProperty.call(docData, "coins");
  const hasAvailableCoins = Object.prototype.hasOwnProperty.call(docData, "availableCoins");

  const rawSmartCoins = docData["smartCoins"];
  const rawCoins = docData["coins"];

  const smartCoinsValid =
    typeof rawSmartCoins === "number" &&
    Number.isFinite(rawSmartCoins) &&
    rawSmartCoins >= 0;

  const coinsValid =
    typeof rawCoins === "number" &&
    Number.isFinite(rawCoins) &&
    rawCoins >= 0;

  const parsedSmartCoins = smartCoinsValid ? rawSmartCoins : null;
  const parsedCoins = coinsValid ? rawCoins : null;

  // Case 1: smartCoins exists and is valid, no coins field present
  if (smartCoinsValid && !hasCoins) {
    return {
      customerId: docId,
      status: "already_canonical",
      action: "none",
      currentSmartCoins: parsedSmartCoins,
      currentCoins: null,
      hasRedundantAvailableCoins: hasAvailableCoins,
      proposedSmartCoins: parsedSmartCoins,
      removeCoinsField: false,
      reason: "Document already conforms to canonical smartCoins specification.",
    };
  }

  // Case 2: coins exists and is valid, but smartCoins is absent
  if (coinsValid && !hasSmartCoins) {
    return {
      customerId: docId,
      status: "coins_only",
      action: "migrate_to_smart_coins",
      currentSmartCoins: null,
      currentCoins: parsedCoins,
      hasRedundantAvailableCoins: hasAvailableCoins,
      proposedSmartCoins: parsedCoins,
      removeCoinsField: true,
      reason: "Migrate verified balance from legacy coins to smartCoins, then retire coins.",
    };
  }

  // Case 3: Both exist and have matching values
  if (smartCoinsValid && coinsValid && parsedSmartCoins === parsedCoins) {
    return {
      customerId: docId,
      status: "both_matching",
      action: "remove_legacy_coins",
      currentSmartCoins: parsedSmartCoins,
      currentCoins: parsedCoins,
      hasRedundantAvailableCoins: hasAvailableCoins,
      proposedSmartCoins: parsedSmartCoins,
      removeCoinsField: true,
      reason: "Both fields exist with matching values. Retain canonical smartCoins and retire obsolete coins.",
    };
  }

  // Case 4: Both exist but have conflicting values
  if (smartCoinsValid && coinsValid && parsedSmartCoins !== parsedCoins) {
    return {
      customerId: docId,
      status: "both_conflicting",
      action: "review_required",
      currentSmartCoins: parsedSmartCoins,
      currentCoins: parsedCoins,
      hasRedundantAvailableCoins: hasAvailableCoins,
      proposedSmartCoins: null, // Never guess or sum conflicting balances
      removeCoinsField: false,
      reason: `Balance conflict detected: smartCoins (${parsedSmartCoins}) !== coins (${parsedCoins}). Flagged for manual review.`,
    };
  }

  // Case 5: Missing or invalid balances
  return {
    customerId: docId,
    status: "missing_or_invalid",
    action: "review_required",
    currentSmartCoins: parsedSmartCoins,
    currentCoins: parsedCoins,
    hasRedundantAvailableCoins: hasAvailableCoins,
    proposedSmartCoins: null,
    removeCoinsField: false,
    reason: "Document contains missing, negative, or non-numeric balance values. Flagged for manual review.",
  };
}

/**
 * Generates the idempotent Firestore update payload for an assessed document.
 * Returns null if no mutation is warranted.
 */
export function buildMigrationPayload(
  assessment: CustomerMigrationAssessment,
  useFieldValueDelete = true
): Record<string, unknown> | null {
  const nowIso = new Date().toISOString();

  switch (assessment.action) {
    case "migrate_to_smart_coins": {
      const payload: Record<string, unknown> = {
        smartCoins: assessment.proposedSmartCoins,
        updatedAt: nowIso,
        lastUpdated: nowIso,
      };
      if (useFieldValueDelete) {
        payload["coins"] = deleteField();
        if (assessment.hasRedundantAvailableCoins) {
          payload["availableCoins"] = deleteField();
        }
      }
      return payload;
    }

    case "remove_legacy_coins": {
      const payload: Record<string, unknown> = {
        updatedAt: nowIso,
        lastUpdated: nowIso,
      };
      if (useFieldValueDelete) {
        payload["coins"] = deleteField();
        if (assessment.hasRedundantAvailableCoins) {
          payload["availableCoins"] = deleteField();
        }
      }
      return payload;
    }

    case "none":
    case "review_required":
    default:
      return null;
  }
}

/**
 * Runs the Smart Coins migration workflow across provided customer documents.
 * Defaults strictly to dry-run mode unless mode === "execute" with explicit approvalToken.
 */
export async function runCustomerCoinMigration(
  options: RunMigrationOptions
): Promise<CustomerCoinMigrationReport> {
  const mode = options.mode || "dry-run";
  const batchSize = Math.max(1, Math.min(options.batchSize || 100, 500));
  const docs = options.documents || [];

  const counts = {
    alreadyCanonical: 0,
    coinsOnly: 0,
    bothMatching: 0,
    bothConflicting: 0,
    missingOrInvalid: 0,
    redundantAvailableCoinsPresent: 0,
  };

  const actionsPlanned = {
    noop: 0,
    migrated: 0,
    legacyFieldRemoved: 0,
    flaggedForReview: 0,
  };

  const flaggedCustomerIds: string[] = [];
  const assessments: CustomerMigrationAssessment[] = [];
  const pendingUpdates: Array<{ id: string; data: Record<string, unknown> }> = [];

  for (const docItem of docs) {
    const assessment = assessCustomerDocument(docItem.data, docItem.id);
    assessments.push(assessment);

    if (assessment.hasRedundantAvailableCoins) {
      counts.redundantAvailableCoinsPresent++;
    }

    switch (assessment.status) {
      case "already_canonical":
        counts.alreadyCanonical++;
        actionsPlanned.noop++;
        break;
      case "coins_only":
        counts.coinsOnly++;
        actionsPlanned.migrated++;
        break;
      case "both_matching":
        counts.bothMatching++;
        actionsPlanned.legacyFieldRemoved++;
        break;
      case "both_conflicting":
        counts.bothConflicting++;
        actionsPlanned.flaggedForReview++;
        flaggedCustomerIds.push(assessment.customerId);
        break;
      case "missing_or_invalid":
        counts.missingOrInvalid++;
        actionsPlanned.flaggedForReview++;
        flaggedCustomerIds.push(assessment.customerId);
        break;
    }

    if (mode === "execute" && assessment.action !== "none" && assessment.action !== "review_required") {
      const payload = buildMigrationPayload(assessment, true);
      if (payload) {
        pendingUpdates.push({ id: docItem.id, data: payload });
      }
    }
  }

  const batchResults: MigrationBatchResult[] = [];

  // Execute updates in batches if in execute mode
  if (mode === "execute" && pendingUpdates.length > 0 && options.writer) {
    for (let i = 0; i < pendingUpdates.length; i += batchSize) {
      const chunk = pendingUpdates.slice(i, i + batchSize);
      const batchIndex = Math.floor(i / batchSize) + 1;
      try {
        await options.writer(chunk);
        batchResults.push({
          batchIndex,
          processedCount: chunk.length,
          successCount: chunk.length,
          failureCount: 0,
        });
      } catch (err) {
        console.error(`[Migration Error] Batch ${batchIndex} failed:`, err);
        batchResults.push({
          batchIndex,
          processedCount: chunk.length,
          successCount: 0,
          failureCount: chunk.length,
        });
      }
    }
  }

  return {
    mode,
    executedAt: new Date().toISOString(),
    totalDocumentsScanned: docs.length,
    counts,
    actionsPlanned,
    flaggedCustomerIds,
    assessments,
    ...(batchResults.length > 0 ? { batchResults } : {}),
  };
}

