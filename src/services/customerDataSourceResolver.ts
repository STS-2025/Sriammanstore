/**
 * Sri Amman Smart Store — Centralized Customer Data Source Resolver
 *
 * Provides authoritative, testable routing and identity resolution between
 * migrated `onlineCustomers` documents and legacy `users` records.
 *
 * Migration Scope:
 *   - SASS0000010 <-> ONCUS0000010 (Customer A: "Micro Soft")
 *   - SASS0000021 <-> ONCUS0000021 (Customer B: "SARAVANA KUMAR")
 *
 * Strict Rules:
 *   1. Preserves Firebase Authentication as the login mechanism.
 *   2. Validates that authenticated UID matches usersByUid mapping and stored profile UID.
 *   3. Resolves canonical ONCUS customer IDs for approved migrated accounts.
 *   4. Keeps legacy users/SASS... path for non-migrated customers without global breakage.
 *   5. Never trusts customer IDs from URLs, localStorage, or client parameters without
 *      validating them against authenticated identity.
 */

import { CANONICAL_ONCUS_ID_RE, CANONICAL_SASS_ID_RE } from "./legacyUserMapper";

export interface CustomerDataSourceResolution {
  /** Canonical customer ID (e.g. "ONCUS0000010" or "SASS0000104") */
  canonicalCustomerId: string;
  /** Primary Firestore collection ("onlineCustomers" or "users") */
  collection: "onlineCustomers" | "users";
  /** Full Firestore document path to profile (e.g. "onlineCustomers/ONCUS0000010") */
  profilePath: string;
  /** Base document path for customer subcollections (e.g. "onlineCustomers/ONCUS0000010") */
  subcollectionBasePath: string;
  /** Preserved legacy SASS ID for migrated customers (e.g. "SASS0000010") */
  legacySassId?: string;
  /** Whether this customer record has been migrated to onlineCustomers */
  isMigrated: boolean;
}

export interface CustomerValidationContext {
  id?: string | null;
  userId?: string | null;
  legacySassId?: string | null;
  uid?: string | null;
}

/**
 * Registry of approved customers migrated to the `onlineCustomers` collection.
 * Maps legacy SASS ID -> canonical ONCUS ID.
 */
export const APPROVED_MIGRATED_CUSTOMERS: Readonly<Record<string, string>> = Object.freeze({
  SASS0000010: "ONCUS0000010",
  SASS0000021: "ONCUS0000021",
});

/** Reverse lookup: canonical ONCUS ID -> legacy SASS ID */
export const REVERSE_MIGRATED_CUSTOMERS: Readonly<Record<string, string>> = Object.freeze({
  ONCUS0000010: "SASS0000010",
  ONCUS0000021: "SASS0000021",
});

/** Supported customer-owned subcollections */
export type CustomerSubcollectionName =
  | "orders"
  | "addresses"
  | "coinsHistory"
  | "cart"
  | "wishlists"
  | "notifications"
  | "referrals"
  | "refferals";

/**
 * Resolves the canonical data source and collection for a given raw customer ID.
 *
 * Rules:
 *   1. If `rawCustomerId` is an approved migrated SASS ID (SASS0000010, SASS0000021),
 *      resolves to collection "onlineCustomers" and canonical ID "ONCUS0000010" / "ONCUS0000021".
 *   2. If `rawCustomerId` is already an ONCUS ID (or mapping collection is "onlineCustomers"),
 *      resolves to collection "onlineCustomers" and looks up legacySassId.
 *   3. All other SASS IDs (e.g. SASS0000104, SASS9999901) remain on collection "users"
 *      with isMigrated = false.
 */
export function resolveCustomerDataSource(
  rawCustomerId: string,
  mappingCollection?: string
): CustomerDataSourceResolution {
  const trimmed = (rawCustomerId || "").trim();
  const cleanId = trimmed.toUpperCase();

  if (!trimmed) {
    throw new Error("Customer data source resolution requires a non-empty customer ID");
  }

  // 1. Direct ONCUS ID pattern
  if (CANONICAL_ONCUS_ID_RE.test(cleanId) || mappingCollection === "onlineCustomers") {
    const legacySass = REVERSE_MIGRATED_CUSTOMERS[cleanId];
    return {
      canonicalCustomerId: cleanId,
      collection: "onlineCustomers",
      profilePath: `onlineCustomers/${cleanId}`,
      subcollectionBasePath: `onlineCustomers/${cleanId}`,
      ...(legacySass ? { legacySassId: legacySass } : {}),
      isMigrated: true,
    };
  }

  // 2. Approved migrated SASS ID mapped to ONCUS
  const migratedOncusId = APPROVED_MIGRATED_CUSTOMERS[cleanId];
  if (migratedOncusId) {
    return {
      canonicalCustomerId: migratedOncusId,
      collection: "onlineCustomers",
      profilePath: `onlineCustomers/${migratedOncusId}`,
      subcollectionBasePath: `onlineCustomers/${migratedOncusId}`,
      legacySassId: cleanId,
      isMigrated: true,
    };
  }

  // 3. Non-migrated SASS customer or other ID (e.g. guest_session)
  const resolvedNonMigratedId = cleanId.startsWith("SASS") ? cleanId : trimmed;
  return {
    canonicalCustomerId: resolvedNonMigratedId,
    collection: "users",
    profilePath: `users/${resolvedNonMigratedId}`,
    subcollectionBasePath: `users/${resolvedNonMigratedId}`,
    isMigrated: false,
  };
}

/**
 * Returns the REST/API endpoint for fetching or updating a customer profile.
 * E.g. "/onlineCustomers/ONCUS0000010" or "/users/SASS0000104"
 */
export function getCustomerProfileEndpoint(customerId: string): string {
  const ds = resolveCustomerDataSource(customerId);
  return `/${ds.collection}/${encodeURIComponent(ds.canonicalCustomerId)}`;
}

/**
 * Returns the full Firestore document path for a customer subcollection.
 * E.g. "onlineCustomers/ONCUS0000010/orders" or "users/SASS0000104/orders"
 */
export function getCustomerSubcollectionPath(
  customerId: string,
  subcollection: CustomerSubcollectionName
): string {
  const ds = resolveCustomerDataSource(customerId);
  return `${ds.subcollectionBasePath}/${subcollection}`;
}

/**
 * Validates that an unverified customer ID (from URL, request parameter, local storage,
 * or UI component) matches the authenticated customer's authorized identity.
 *
 * Prevents cross-customer data leakage and unauthorized customer ID spoofing.
 */
export function validateCustomerAccess(
  requestedCustomerId: string | undefined | null,
  currentUser: CustomerValidationContext | null
): {
  authorized: boolean;
  canonicalCustomerId?: string;
  collection?: "onlineCustomers" | "users";
  legacySassId?: string;
  error?: string;
} {
  if (!currentUser) {
    return {
      authorized: false,
      error: "Authentication required: No active customer session.",
    };
  }

  const cleanRequested = (requestedCustomerId || "").trim().toUpperCase();
  const currentCanonical = (currentUser.id || currentUser.userId || "").trim().toUpperCase();
  const currentLegacy = (currentUser.legacySassId || "").trim().toUpperCase();

  // If no specific customer ID was requested, default to authenticated customer's canonical ID
  if (!cleanRequested) {
    if (!currentCanonical) {
      return {
        authorized: false,
        error: "Authenticated customer has no valid canonical ID.",
      };
    }
    const ds = resolveCustomerDataSource(currentCanonical);
    return {
      authorized: true,
      canonicalCustomerId: ds.canonicalCustomerId,
      collection: ds.collection,
      ...(ds.legacySassId ? { legacySassId: ds.legacySassId } : {}),
    };
  }

  // Resolve requested ID through data source resolver
  const requestedDs = resolveCustomerDataSource(cleanRequested);

  // Validate match against authenticated customer:
  // Must match either current canonical ID, legacy SASS ID, or resolve to the same canonical ONCUS ID
  const matchesCanonical =
    cleanRequested === currentCanonical ||
    requestedDs.canonicalCustomerId === currentCanonical;

  const matchesLegacy =
    Boolean(currentLegacy && (cleanRequested === currentLegacy || requestedDs.legacySassId === currentLegacy));

  if (!matchesCanonical && !matchesLegacy) {
    return {
      authorized: false,
      error: `Access denied: Ownership mismatch. Requested customer ID "${cleanRequested}" does not match authenticated customer "${currentCanonical}".`,
    };
  }

  return {
    authorized: true,
    canonicalCustomerId: currentCanonical || requestedDs.canonicalCustomerId,
    collection: requestedDs.collection,
    ...(currentLegacy || requestedDs.legacySassId
      ? { legacySassId: currentLegacy || requestedDs.legacySassId }
      : {}),
  };
}

