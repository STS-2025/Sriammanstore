import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, doc, getDoc, runTransaction, setDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getProductionFirestoreInstance } from "./productionOrderReader";
import { apiClient } from "./apiClient";
import {
  classifyStorageError,
  type FirestoreAdapter,
  type StorageErrorCategory,
} from "./firestoreAdapter";
import { emailLinkAuthService, type FirebaseEmailLinkAuthUser } from "./emailLinkAuthService";
import { PRODUCTION_AUTH_APP_NAME, authManager, type AuthMode } from "./authAdapter";
import {
  getProductionFirebaseConfig,
  validateProductionPreviewConfig,
} from "./productionPreviewService";
import { normalizeLegacyUser } from "./legacyUserMapper";
import { resolveCustomerDataSource } from "./customerDataSourceResolver";
import type { User } from "../types";

/**
 * Safe, Read-Only Firebase Auth-to-Customer Profile Resolution Service
 *
 * ============================================================================
 * 1. LEGACY IDENTITY CONTRACT (`sri-amman-smart-store`)
 * ============================================================================
 * In the Sri Amman Smart Store Firebase schema, customer documents and all
 * customer-scoped subcollections (`cart`, `addresses`, `orders`, `coinsHistory`,
 * `refferals`, `wishlists`, `notifications`) are keyed by sequential SASS
 * customer IDs (`SASS0000001`), NOT by Firebase Authentication UIDs:
 *
 *   Firebase Auth UID (`uid`)
 *     → `usersByUid/{uid}` (`{ userDocId: "SASS0000104", uid: "<firebase-uid>" }`)
 *     → `users/{userDocId}` (`{ userId: "SASS0000104", uid: "<firebase-uid>", ... }`)
 *
 * ============================================================================
 * 2. SAFETY & ISOLATION GUARANTEES
 * ============================================================================
 * - Strictly Read-Only: This service performs ONLY document reads on
 *   `usersByUid/{uid}` and `users/{userDocId}`. It never creates, updates,
 *   overwrites, or deletes `usersByUid` mappings or `users` profiles.
 * - No UID Substitution: A Firebase Auth `uid` is never substituted for a
 *   missing `SASS...` customer ID, and a `SASS...` customer ID is never
 *   accepted as a Firebase Auth `uid`.
 * - No Email-Only Account Association: If `usersByUid/{uid}` does not exist,
 *   this service NEVER searches `users` by email address to link or return an
 *   existing customer profile. In the legacy schema, customer identity is
 *   anchored to verified phone numbers (`number` + `countryCode`) and explicit
 *   `usersByUid/{uid}` mappings; associating accounts by email alone is unsafe
 *   and prohibited.
 * - Mock Auth Preservation: This service does not read or mutate the mock
 *   authentication session in `localStorage` (`sass_customer_session`), and
 *   mock users without a Firebase Auth identity are rejected as unauthenticated
 *   if passed into Firebase identity resolution.
 *
 * ============================================================================
 * 3. REQUIREMENTS BEFORE NEW CUSTOMER REGISTRATION CAN BE IMPLEMENTED SAFELY
 * ============================================================================
 * When `resolveCustomerProfile` returns `status: "unlinked"` (`no usersByUid/{uid}`),
 * automatic profile creation is intentionally blocked. Before implementing new
 * customer registration or account linking in a future phase, the following
 * data and business rules must be satisfied:
 *   1. Verified Phone Onboarding (`UserDataPage.jsx` contract):
 *      Collect and verify the customer's 10-digit mobile number (`number` /
 *      `phone`) and `countryCode` (e.g. `"+91"`) via OTP (`phoneVerified: true`),
 *      along with required `fullName` (and optional `gender`, `dob`, `referredBy`).
 *   2. Phone-Based Account Deduplication & Linking:
 *      Query `users` by verified `(number, countryCode)` before allocating a new
 *      SASS ID. If an existing `users/{existingUserDocId}` record matches the
 *      verified phone number, prompt the user to confirm linking and bind
 *      `usersByUid/{uid}` -> `{ userDocId: existingUserDocId, uid }` (recording
 *      `linkedUids` on `users/{existingUserDocId}`) rather than creating a
 *      duplicate customer profile.
 *   3. Atomic Sequential SASS ID Allocation (`meta/userSequence`):
 *      Only when no existing customer matches the verified phone number, run a
 *      Firestore transaction on `meta/userSequence` (`{ current: number }`) to
 *      allocate `SASS${String(nextId).padStart(7, "0")}` and atomically create
 *      both `usersByUid/{uid}` (with precondition that it does not already exist)
 *      and `users/{userDocId}`.
 *   4. Initial Coin & Referral Attribution Policy:
 *      Align initial `availableCoins` / `earnedCoins` and `users/{referrerId}/refferals`
 *      attribution with the production ledger rules (`0` initial spendable coins
 *      in legacy Firestore vs. mock-mode signup bonus).
 *   5. Firestore Security Rules:
 *      Update `firestore.rules` to allow `usersByUid/{uid}` reads and guarded
 *      creates only when `request.auth != null && request.auth.uid == uid`.
 */

export const NEW_CUSTOMER_REGISTRATION_REQUIREMENTS = {
  requiredOnboardingFields: ["fullName", "countryCode", "number", "phoneVerified"] as const,
  optionalOnboardingFields: ["email", "gender", "dob", "referredBy"] as const,
  sequenceDocumentPath: "meta/onlineCustomerSequence",
  mappingCollection: "usersByUid",
  profileCollection: "onlineCustomers",
  accountType: "customer",
  deduplicationKey: ["countryCode", "number"] as const,
} as const;

export const CANONICAL_ONCUS_ID_RE = /^ONCUS\d{6,7}$/i;
export const CANONICAL_SASS_ID_RE = /^SASS\d{6,7}$/i;
export const CANONICAL_CUSTOMER_ID_RE = /^(ONCUS\d{6,7}|SASS\d{6,7})$/i;

export interface AuthenticatedFirebaseUserInput {
  uid: string;
  email?: string | null | undefined;
  emailVerified?: boolean | undefined;
  isAnonymous?: boolean | undefined;
  providerId?: string | undefined;
}

export interface UsersByUidMapping {
  uid: string;
  userDocId: string;
  collection: "onlineCustomers" | "users";
  accountType: "customer";
  legacySassId?: string;
}

export type CustomerIdentityResolutionStatus =
  | "resolved"
  | "unlinked"
  | "missing_profile"
  | "malformed_mapping"
  | "profile_id_mismatch"
  | "unauthenticated"
  | "database_error";

export type CustomerIdentityErrorCode =
  | "identity/unauthenticated"
  | "identity/unlinked-uid"
  | "identity/missing-profile"
  | "identity/malformed-mapping"
  | "identity/mapping-uid-mismatch"
  | "identity/non-customer-account"
  | "identity/profile-id-mismatch"
  | "identity/profile-uid-mismatch"
  | "identity/emulator-unavailable"
  | "identity/database-error";

export interface CustomerIdentityResolvedResult {
  status: "resolved";
  ok: true;
  uid: string;
  userDocId: string;
  mapping: UsersByUidMapping;
  profile: User;
}

export interface CustomerIdentityUnlinkedResult {
  status: "unlinked";
  ok: false;
  code: "identity/unlinked-uid";
  uid: string;
  email?: string;
  userDocId: null;
  profile: null;
  requiresRegistration: true;
  message: string;
}

export interface CustomerIdentityMissingProfileResult {
  status: "missing_profile";
  ok: false;
  code: "identity/missing-profile";
  uid: string;
  userDocId: string;
  profile: null;
  message: string;
}

export interface CustomerIdentityMalformedMappingResult {
  status: "malformed_mapping";
  ok: false;
  code:
    | "identity/malformed-mapping"
    | "identity/mapping-uid-mismatch"
    | "identity/non-customer-account";
  uid: string;
  userDocId: null;
  profile: null;
  message: string;
}

export interface CustomerIdentityProfileMismatchResult {
  status: "profile_id_mismatch";
  ok: false;
  code: "identity/profile-id-mismatch" | "identity/profile-uid-mismatch";
  uid: string;
  userDocId: string;
  actualProfileId?: string;
  profile: null;
  message: string;
}

export interface CustomerIdentityUnauthenticatedResult {
  status: "unauthenticated";
  ok: false;
  code: "identity/unauthenticated";
  uid: null;
  userDocId: null;
  profile: null;
  message: string;
}

export interface CustomerIdentityDatabaseErrorResult {
  status: "database_error";
  ok: false;
  code: "identity/emulator-unavailable" | "identity/database-error";
  uid: string;
  userDocId: string | null;
  profile: null;
  errorCategory: StorageErrorCategory;
  isEmulatorUnavailable: boolean;
  message: string;
  cause?: unknown;
}

export type CustomerIdentityResolutionResult =
  | CustomerIdentityResolvedResult
  | CustomerIdentityUnlinkedResult
  | CustomerIdentityMissingProfileResult
  | CustomerIdentityMalformedMappingResult
  | CustomerIdentityProfileMismatchResult
  | CustomerIdentityUnauthenticatedResult
  | CustomerIdentityDatabaseErrorResult;

export class CustomerIdentityResolutionError extends Error {
  readonly status: Exclude<CustomerIdentityResolutionStatus, "resolved">;
  readonly code: CustomerIdentityErrorCode;
  readonly result: Exclude<CustomerIdentityResolutionResult, CustomerIdentityResolvedResult>;

  constructor(result: Exclude<CustomerIdentityResolutionResult, CustomerIdentityResolvedResult>) {
    super(result.message);
    this.name = "CustomerIdentityResolutionError";
    this.status = result.status;
    this.code = result.code;
    this.result = result;
  }
}

export interface ResolveCustomerIdentityOptions {
  adapter?: FirestoreAdapter;
  mode?: AuthMode;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Validates that the caller has supplied a genuinely authenticated Firebase user
 * rather than `null`, an anonymous user, an unverified email-link user, or a
 * mock `localStorage` customer object.
 */
export function validateAuthenticatedFirebaseUser(firebaseUser: unknown):
  | {
      status: "authenticated";
      ok: true;
      uid: string;
      email?: string;
    }
  | CustomerIdentityUnauthenticatedResult {
  if (!isPlainRecord(firebaseUser)) {
    return {
      status: "unauthenticated",
      ok: false,
      code: "identity/unauthenticated",
      uid: null,
      userDocId: null,
      profile: null,
      message: "Cannot resolve customer profile: no authenticated Firebase user was provided.",
    };
  }

  if (firebaseUser["isAnonymous"] === true) {
    return {
      status: "unauthenticated",
      ok: false,
      code: "identity/unauthenticated",
      uid: null,
      userDocId: null,
      profile: null,
      message: "Cannot resolve customer profile: anonymous Firebase sessions are not permitted.",
    };
  }

  const providerId = firebaseUser["providerId"];
  const requiresVerifiedEmail =
    providerId === "firebase-email-link" ||
    providerId === "firebase-email-password" ||
    providerId === "firebase-google" ||
    providerId === "firebase-auth-emulator" ||
    providerId === "firebase-auth-production";
  if (requiresVerifiedEmail && firebaseUser["emailVerified"] !== true) {
    return {
      status: "unauthenticated",
      ok: false,
      code: "identity/unauthenticated",
      uid: null,
      userDocId: null,
      profile: null,
      message:
        "Cannot resolve customer profile: this email-based sign-in has not completed email verification.",
    };
  }

  const rawUid = getNonEmptyString(firebaseUser["uid"]);
  if (!rawUid) {
    return {
      status: "unauthenticated",
      ok: false,
      code: "identity/unauthenticated",
      uid: null,
      userDocId: null,
      profile: null,
      message:
        "Cannot resolve customer profile: authenticated Firebase user is missing a valid UID.",
    };
  }

  // Never allow a customer document ID (SASS or ONCUS) to be passed in as a Firebase Auth UID
  if (CANONICAL_CUSTOMER_ID_RE.test(rawUid.toUpperCase())) {
    const isSass = CANONICAL_SASS_ID_RE.test(rawUid.toUpperCase());
    return {
      status: "unauthenticated",
      ok: false,
      code: "identity/unauthenticated",
      uid: null,
      userDocId: null,
      profile: null,
      message: `Invalid Firebase Auth UID "${rawUid}": ${isSass ? "SASS" : "ONCUS"} customer IDs cannot be used as Firebase Auth UIDs.`,
    };
  }

  const cleanEmail = getNonEmptyString(firebaseUser["email"])?.toLowerCase();

  return {
    status: "authenticated",
    ok: true,
    uid: rawUid,
    ...(cleanEmail ? { email: cleanEmail } : {}),
  };
}

/**
 * Validates the `usersByUid/{uid}` document payload. Newly created mappings must
 * identify both the online collection and customer account type. Older SASS and
 * ONCUS mappings remain compatible when they use their historical collection.
 *
 * Rules enforced:
 * 1. `rawMapping` must be a plain object.
 * 2. `userDocId` must be a non-empty string.
 * 3. `userDocId` must NEVER equal the Firebase Auth `uid`.
 * 4. `userDocId` must match the canonical `SASS\d+` customer ID format.
 * 5. If `rawMapping.uid` is present, it must match the requested `expectedUid`.
 * 6. Explicit mapping account types must be `customer`; staff/admin mappings
 *    are never accepted by the customer identity resolver.
 */
export function validateUsersByUidMapping(
  rawMapping: unknown,
  expectedUid: string,
):
  | {
      ok: true;
      mapping: UsersByUidMapping;
    }
  | CustomerIdentityMalformedMappingResult {
  if (!isPlainRecord(rawMapping)) {
    return {
      status: "malformed_mapping",
      ok: false,
      code: "identity/malformed-mapping",
      uid: expectedUid,
      userDocId: null,
      profile: null,
      message: `Malformed usersByUid/${expectedUid} document: expected an object payload.`,
    };
  }

  const hasAccountType = Object.prototype.hasOwnProperty.call(rawMapping, "accountType");
  const docUid = getNonEmptyString(rawMapping["uid"]);
  if ((hasAccountType && docUid !== expectedUid) || (docUid !== null && docUid !== expectedUid)) {
    return {
      status: "malformed_mapping",
      ok: false,
      code: "identity/mapping-uid-mismatch",
      uid: expectedUid,
      userDocId: null,
      profile: null,
      message: `Identity mapping mismatch in usersByUid/${expectedUid}: document uid "${docUid}" does not match authenticated UID "${expectedUid}".`,
    };
  }

  const rawUserDocId =
    getNonEmptyString(rawMapping["userDocId"]) ?? getNonEmptyString(rawMapping["customerId"]);
  if (!rawUserDocId) {
    return {
      status: "malformed_mapping",
      ok: false,
      code: "identity/malformed-mapping",
      uid: expectedUid,
      userDocId: null,
      profile: null,
      message: `Malformed usersByUid/${expectedUid} document: missing or empty "userDocId".`,
    };
  }

  if (rawUserDocId === expectedUid) {
    return {
      status: "malformed_mapping",
      ok: false,
      code: "identity/malformed-mapping",
      uid: expectedUid,
      userDocId: null,
      profile: null,
      message: `Malformed usersByUid/${expectedUid} document: "userDocId" cannot be the Firebase Auth UID ("${expectedUid}"). Expected a canonical SASS customer ID.`,
    };
  }

  if (!CANONICAL_CUSTOMER_ID_RE.test(rawUserDocId)) {
    return {
      status: "malformed_mapping",
      ok: false,
      code: "identity/malformed-mapping",
      uid: expectedUid,
      userDocId: null,
      profile: null,
      message: `Malformed usersByUid/${expectedUid} document: "userDocId" ("${rawUserDocId}") is not a valid canonical customer ID.`,
    };
  }

  const rawCollection = getNonEmptyString(rawMapping["collection"]);
  if (rawCollection && rawCollection !== "users" && rawCollection !== "onlineCustomers") {
    return {
      status: "malformed_mapping",
      ok: false,
      code: "identity/malformed-mapping",
      uid: expectedUid,
      userDocId: null,
      profile: null,
      message: `Malformed usersByUid/${expectedUid} document: unsupported collection value.`,
    };
  }

  const rawAccountType = rawMapping["accountType"];
  if (hasAccountType && rawAccountType !== "customer") {
    const isStaffOrAdmin = rawAccountType === "staff" || rawAccountType === "admin";
    return {
      status: "malformed_mapping",
      ok: false,
      code: isStaffOrAdmin ? "identity/non-customer-account" : "identity/malformed-mapping",
      uid: expectedUid,
      userDocId: null,
      profile: null,
      message: isStaffOrAdmin
        ? "This Firebase account is not a customer account."
        : `Malformed usersByUid/${expectedUid} document: accountType must be customer, staff, or admin.`,
    };
  }

  const isOncus = rawUserDocId.toUpperCase().startsWith("ONCUS");
  const isSass = rawUserDocId.toUpperCase().startsWith("SASS");
  const targetCollection = (rawCollection ?? (isOncus ? "onlineCustomers" : "users")) as
    "onlineCustomers" | "users";
  if (
    (isOncus && targetCollection !== "onlineCustomers") ||
    (!isOncus && targetCollection === "users" && !isSass)
  ) {
    return {
      status: "malformed_mapping",
      ok: false,
      code: "identity/malformed-mapping",
      uid: expectedUid,
      userDocId: null,
      profile: null,
      message: `Malformed usersByUid/${expectedUid} document: collection does not match the customer ID.`,
    };
  }

  // Historical mappings omit accountType. Accept only the established ID/path
  // combinations; all new mappings are written with explicit fields.
  if (
    !hasAccountType &&
    !(
      (isOncus && targetCollection === "onlineCustomers") ||
      (isSass && targetCollection === "users")
    )
  ) {
    return {
      status: "malformed_mapping",
      ok: false,
      code: "identity/malformed-mapping",
      uid: expectedUid,
      userDocId: null,
      profile: null,
      message: `Malformed usersByUid/${expectedUid} document: missing accountType for this collection and customer ID.`,
    };
  }

  const rawLegacySassId = getNonEmptyString(rawMapping["legacySassId"]);
  const legacySassId =
    rawLegacySassId && CANONICAL_SASS_ID_RE.test(rawLegacySassId)
      ? rawLegacySassId.toUpperCase()
      : undefined;

  return {
    ok: true,
    mapping: {
      uid: expectedUid,
      userDocId: rawUserDocId,
      collection: targetCollection,
      accountType: "customer",
      ...(legacySassId ? { legacySassId } : {}),
    },
  };
}

/**
 * Validates a raw customer profile document (`onlineCustomers/{userDocId}` or legacy `users/{userDocId}`)
 * for identity consistency with `(authenticatedUid, resolvedUserDocId)` and normalizes it via `normalizeLegacyUser`.
 */
export function validateAndNormalizeCustomerProfile(
  rawProfileDoc: unknown,
  resolvedUserDocId: string,
  authenticatedUid: string,
  context?: {
    legacySassId?: string | undefined;
    collection?: ("onlineCustomers" | "users") | undefined;
  },
):
  | {
      ok: true;
      profile: User;
    }
  | CustomerIdentityProfileMismatchResult {
  const targetCol =
    context?.collection ??
    (resolvedUserDocId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users");

  if (!isPlainRecord(rawProfileDoc)) {
    return {
      status: "profile_id_mismatch",
      ok: false,
      code: "identity/profile-id-mismatch",
      uid: authenticatedUid,
      userDocId: resolvedUserDocId,
      profile: null,
      message: `Invalid customer profile at ${targetCol}/${resolvedUserDocId}: expected a document object.`,
    };
  }

  // Historical profiles may omit accountType. An explicit non-customer marker
  // is authoritative and must never be normalized into a customer session.
  const explicitProfileType = [
    rawProfileDoc["accountType"],
    rawProfileDoc["userType"],
    rawProfileDoc["role"],
  ]
    .map((value) => getNonEmptyString(value)?.toLowerCase())
    .find((value) => value !== undefined);
  if (explicitProfileType && explicitProfileType !== "customer") {
    return {
      status: "profile_id_mismatch",
      ok: false,
      code: "identity/profile-id-mismatch",
      uid: authenticatedUid,
      userDocId: resolvedUserDocId,
      profile: null,
      message: `Profile ${targetCol}/${resolvedUserDocId} is marked as ${explicitProfileType} and cannot be used as a customer account.`,
    };
  }

  // Reject deprecated merged duplicate profiles (`{ merged: true, mergedInto: "SASS..." }`)
  if (rawProfileDoc["merged"] === true) {
    const mergedInto = getNonEmptyString(rawProfileDoc["mergedInto"]);
    return {
      status: "profile_id_mismatch",
      ok: false,
      code: "identity/profile-id-mismatch",
      uid: authenticatedUid,
      userDocId: resolvedUserDocId,
      ...(mergedInto ? { actualProfileId: mergedInto } : {}),
      profile: null,
      message: `Customer profile ${targetCol}/${resolvedUserDocId} is marked as merged${
        mergedInto ? ` into ${mergedInto}` : ""
      } and cannot be used as an active profile.`,
    };
  }

  // 1. Validate explicit `userId` field if present on the raw document
  if (rawProfileDoc["userId"] !== undefined && rawProfileDoc["userId"] !== null) {
    const explicitUserId = getNonEmptyString(rawProfileDoc["userId"]);
    const matchesResolved = explicitUserId === resolvedUserDocId;
    const matchesLegacy = Boolean(context?.legacySassId && explicitUserId === context.legacySassId);
    if (!explicitUserId || (!matchesResolved && !matchesLegacy)) {
      return {
        status: "profile_id_mismatch",
        ok: false,
        code: "identity/profile-id-mismatch",
        uid: authenticatedUid,
        userDocId: resolvedUserDocId,
        ...(explicitUserId ? { actualProfileId: explicitUserId } : {}),
        profile: null,
        message: `Profile customer ID mismatch in ${targetCol}/${resolvedUserDocId}: document userId "${
          explicitUserId ?? String(rawProfileDoc["userId"])
        }" does not match mapped userDocId "${resolvedUserDocId}".`,
      };
    }
  }

  // 2. Validate explicit `id` field if present on the raw document
  if (rawProfileDoc["id"] !== undefined && rawProfileDoc["id"] !== null) {
    const explicitId = getNonEmptyString(rawProfileDoc["id"]);
    const explicitUserId = getNonEmptyString(rawProfileDoc["userId"]);
    const matchesResolved = explicitId === resolvedUserDocId;
    const matchesLegacy = Boolean(context?.legacySassId && explicitId === context.legacySassId);
    const isLegacyUidShadowedByValidUserId =
      explicitId === authenticatedUid &&
      (explicitUserId === resolvedUserDocId ||
        Boolean(context?.legacySassId && explicitUserId === context.legacySassId));

    if (!explicitId || (!matchesResolved && !matchesLegacy && !isLegacyUidShadowedByValidUserId)) {
      return {
        status: "profile_id_mismatch",
        ok: false,
        code: "identity/profile-id-mismatch",
        uid: authenticatedUid,
        userDocId: resolvedUserDocId,
        ...(explicitId ? { actualProfileId: explicitId } : {}),
        profile: null,
        message: `Profile ID mismatch in ${targetCol}/${resolvedUserDocId}: document id "${
          explicitId ?? String(rawProfileDoc["id"])
        }" does not match mapped userDocId "${resolvedUserDocId}".`,
      };
    }
  }

  // 3. Validate `uid` / `linkedUids` ownership on the profile document when present
  const profileUid = getNonEmptyString(rawProfileDoc["uid"]);
  if (profileUid !== null && profileUid !== authenticatedUid) {
    const linkedUids = Array.isArray(rawProfileDoc["linkedUids"])
      ? rawProfileDoc["linkedUids"]
          .map((item) => getNonEmptyString(item))
          .filter((item): item is string => item !== null)
      : [];

    if (!linkedUids.includes(authenticatedUid)) {
      return {
        status: "profile_id_mismatch",
        ok: false,
        code: "identity/profile-uid-mismatch",
        uid: authenticatedUid,
        userDocId: resolvedUserDocId,
        profile: null,
        message: `Profile UID mismatch in ${targetCol}/${resolvedUserDocId}: profile belongs to UID "${profileUid}", not authenticated UID "${authenticatedUid}".`,
      };
    }
  }

  // 4. Normalize using the existing pure legacy user mapper
  const normalized = normalizeLegacyUser(rawProfileDoc, {
    docId: resolvedUserDocId,
    documentPath: `${targetCol}/${resolvedUserDocId}`,
    ...(context?.legacySassId ? { legacySassId: context.legacySassId } : {}),
  });

  if (
    !normalized ||
    normalized.id !== resolvedUserDocId ||
    normalized.userId !== resolvedUserDocId ||
    normalized.id === authenticatedUid ||
    !CANONICAL_CUSTOMER_ID_RE.test(normalized.id)
  ) {
    return {
      status: "profile_id_mismatch",
      ok: false,
      code: "identity/profile-id-mismatch",
      uid: authenticatedUid,
      userDocId: resolvedUserDocId,
      ...(normalized?.id ? { actualProfileId: normalized.id } : {}),
      profile: null,
      message: `Normalized profile ID "${
        normalized?.id ?? "null"
      }" is inconsistent with resolved document ID "${resolvedUserDocId}".`,
    };
  }

  return {
    ok: true,
    profile: {
      ...normalized,
      uid: authenticatedUid,
    },
  };
}

function buildDatabaseErrorResult(
  err: unknown,
  uid: string,
  userDocId: string | null,
  operationDescription: string,
  isProduction = false,
): CustomerIdentityDatabaseErrorResult {
  const category = classifyStorageError(err);
  const isEmulatorUnavailable = !isProduction && category === "connectivity";
  const rawMessage =
    err instanceof Error && err.message
      ? err.message
      : `Database error during ${operationDescription}`;

  return {
    status: "database_error",
    ok: false,
    code: isEmulatorUnavailable ? "identity/emulator-unavailable" : "identity/database-error",
    uid,
    userDocId,
    profile: null,
    errorCategory: category,
    isEmulatorUnavailable,
    message: isEmulatorUnavailable
      ? `Firestore Emulator is unavailable while ${operationDescription}: ${rawMessage}`
      : `Firestore error while ${operationDescription}: ${rawMessage}`,
    cause: err,
  };
}

export type ProductionCustomerDocumentReader =
  | ((
      collectionName: "usersByUid" | "users" | "onlineCustomers",
      docId: string,
    ) => Promise<Record<string, unknown> | null>)
  | ((
      collectionName: "usersByUid" | "users",
      docId: string,
    ) => Promise<Record<string, unknown> | null>);

let customProductionReaderOverride: ProductionCustomerDocumentReader | null = null;

async function readProductionDocument(
  collectionName: "usersByUid" | "users" | "onlineCustomers",
  docId: string,
): Promise<Record<string, unknown> | null> {
  if (customProductionReaderOverride) {
    const reader = customProductionReaderOverride as unknown as (
      targetCollection: "usersByUid" | "users" | "onlineCustomers",
      targetDocId: string,
    ) => Promise<Record<string, unknown> | null>;
    return reader(collectionName, docId);
  }

  const existingApps = getApps();
  let app: FirebaseApp | undefined = existingApps.find((a) => a.name === PRODUCTION_AUTH_APP_NAME);

  if (!app) {
    const config = getProductionFirebaseConfig();
    const validation = validateProductionPreviewConfig(config);
    if (!validation.valid) {
      throw new Error(
        `CONFIGURATION SAFETY ERROR:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`,
      );
    }
    const sdkOptions: Record<string, string> = {
      projectId: config.projectId,
      authDomain: config.authDomain,
      messagingSenderId: config.messagingSenderId,
      apiKey: config.apiKey,
    };
    if (config.storageBucket) sdkOptions["storageBucket"] = config.storageBucket;
    if (config.appId) sdkOptions["appId"] = config.appId;

    app = initializeApp(sdkOptions, PRODUCTION_AUTH_APP_NAME);
  }

  const db = getFirestore(app);
  const docRef = doc(db, collectionName, docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    return null;
  }
  return snap.data() as Record<string, unknown>;
}

let customAdapterOverride: FirestoreAdapter | null = null;

function resolveActiveAdapter(options?: ResolveCustomerIdentityOptions): FirestoreAdapter {
  if (options?.adapter) {
    return options.adapter;
  }
  if (customAdapterOverride) {
    return customAdapterOverride;
  }
  return apiClient.getFirestoreAdapter();
}

export const customerIdentityService = {
  /**
   * Overrides the FirestoreAdapter instance for isolated unit tests.
   */
  setAdapterForTesting(adapter: FirestoreAdapter | null): void {
    customAdapterOverride = adapter;
  },

  /**
   * Overrides the production document reader for isolated unit tests.
   */
  setProductionReaderForTesting(reader: ProductionCustomerDocumentReader | null): void {
    customProductionReaderOverride = reader;
  },

  /**
   * Returns true if the supplied user object is a mock-auth session user
   * (i.e. lacks a verified Firebase Auth UID). Mock users must never be
   * treated as having Firebase Authentication identities.
   */
  isMockSessionUser(user: User | null | undefined): boolean {
    if (!user) return false;
    const uid = getNonEmptyString(user.uid);
    return uid === null;
  },

  /**
   * Safely resolves a verified Firebase Auth user to their canonical Sri Amman
   * Smart Store `User` profile via the read-only two-step lookup:
   *   `Firebase Auth UID -> usersByUid/{uid} -> { userDocId, uid } -> users/{userDocId}`
   *
   * Never creates or modifies `usersByUid` or `users` documents, never allocates
   * SASS IDs, and never associates accounts by matching email addresses.
   */
  async resolveCustomerProfile(
    firebaseUser: AuthenticatedFirebaseUserInput | FirebaseEmailLinkAuthUser | null | undefined,
    options?: ResolveCustomerIdentityOptions,
  ): Promise<CustomerIdentityResolutionResult> {
    const authValidation = validateAuthenticatedFirebaseUser(firebaseUser);
    if (!authValidation.ok) {
      return authValidation;
    }

    const { uid, email } = authValidation;
    const isProduction =
      customProductionReaderOverride !== null ||
      options?.mode === "production" ||
      (!options?.mode && firebaseUser?.providerId === "firebase-auth-production") ||
      (!options?.mode && !firebaseUser?.providerId && authManager.getMode() === "production");

    // Step 1: Look up `usersByUid/{uid}` by its real Firestore document path
    let rawMappingDoc: Record<string, unknown> | null = null;
    try {
      if (isProduction && !options?.adapter) {
        rawMappingDoc = await readProductionDocument("usersByUid", uid);
      } else {
        const adapter = resolveActiveAdapter(options);
        rawMappingDoc = await adapter.getDocumentRaw("usersByUid", uid);
      }
    } catch (err: unknown) {
      const category = classifyStorageError(err);
      if (category === "not_found") {
        rawMappingDoc = null;
      } else {
        return buildDatabaseErrorResult(
          err,
          uid,
          null,
          `looking up usersByUid/${uid}`,
          isProduction,
        );
      }
    }

    // Step 2: Handle unlinked Firebase UID (no `usersByUid/{uid}` document)
    // Never fall back to querying `/users` by email, and never auto-create a profile.
    if (rawMappingDoc === null) {
      return {
        status: "unlinked",
        ok: false,
        code: "identity/unlinked-uid",
        uid,
        ...(email ? { email } : {}),
        userDocId: null,
        profile: null,
        requiresRegistration: true,
        message: `No linked Sri Amman Smart Store customer profile found for Firebase UID "${uid}". New customer registration or phone-verified account linking is required.`,
      };
    }

    // Step 3: Validate `usersByUid/{uid}` mapping payload
    const mappingValidation = validateUsersByUidMapping(rawMappingDoc, uid);
    if (!mappingValidation.ok) {
      return mappingValidation;
    }

    const {
      userDocId: rawUserDocId,
      collection: targetCol,
      legacySassId: mappingLegacySassId,
    } = mappingValidation.mapping;
    const ds = resolveCustomerDataSource(rawUserDocId, targetCol);
    const resolvedUserDocId = ds.canonicalCustomerId;
    const primaryCol: "onlineCustomers" | "users" = ds.collection;
    const legacySassId = ds.legacySassId ?? mappingLegacySassId;

    // Step 4: Fetch customer profile from primary collection (with fallback to users if legacySassId exists)
    let rawProfileDoc: Record<string, unknown> | null = null;
    let actualCollectionUsed: "onlineCustomers" | "users" = primaryCol;
    try {
      if (isProduction && !options?.adapter) {
        rawProfileDoc = await readProductionDocument(primaryCol, resolvedUserDocId);
      } else {
        const adapter = resolveActiveAdapter(options);
        rawProfileDoc = await adapter.getDocumentRaw(primaryCol, resolvedUserDocId);
      }
    } catch (err: unknown) {
      const category = classifyStorageError(err);
      if (category === "not_found") {
        rawProfileDoc = null;
      } else {
        return buildDatabaseErrorResult(
          err,
          uid,
          resolvedUserDocId,
          `fetching ${primaryCol}/${resolvedUserDocId}`,
          isProduction,
        );
      }
    }

    // Dual-path fallback: If not found in onlineCustomers and legacySassId is provided, try users/{legacySassId}
    if (rawProfileDoc === null && primaryCol === "onlineCustomers" && legacySassId) {
      try {
        if (isProduction && !options?.adapter) {
          rawProfileDoc = await readProductionDocument("users", legacySassId);
        } else {
          const adapter = resolveActiveAdapter(options);
          rawProfileDoc = await adapter.getDocumentRaw("users", legacySassId);
        }
        if (rawProfileDoc !== null) {
          actualCollectionUsed = "users";
        }
      } catch (err: unknown) {
        const category = classifyStorageError(err);
        if (category !== "not_found") {
          return buildDatabaseErrorResult(
            err,
            uid,
            legacySassId,
            `fetching fallback users/${legacySassId}`,
            isProduction,
          );
        }
      }
    }

    if (rawProfileDoc === null) {
      return {
        status: "missing_profile",
        ok: false,
        code: "identity/missing-profile",
        uid,
        userDocId: resolvedUserDocId,
        profile: null,
        message: `Identity mapping usersByUid/${uid} references customer "${resolvedUserDocId}", but document ${primaryCol}/${resolvedUserDocId} does not exist.`,
      };
    }

    // Step 5 & 6: Normalize with `legacyUserMapper` and validate customer ID consistency
    const profileValidation = validateAndNormalizeCustomerProfile(
      rawProfileDoc,
      resolvedUserDocId,
      uid,
      {
        legacySassId,
        collection: actualCollectionUsed,
      },
    );
    if (!profileValidation.ok) {
      return profileValidation;
    }

    return {
      status: "resolved",
      ok: true,
      uid,
      userDocId: resolvedUserDocId,
      mapping: {
        ...mappingValidation.mapping,
        userDocId: resolvedUserDocId,
        collection: primaryCol,
        ...(legacySassId ? { legacySassId } : {}),
      },
      profile: profileValidation.profile,
    };
  },

  /**
   * Resolves the customer profile for the currently signed-in Firebase Auth user
   * from `emailLinkAuthService.getCurrentFirebaseAuthUser()`.
   */
  async resolveCurrentFirebaseUserProfile(
    options?: ResolveCustomerIdentityOptions,
  ): Promise<CustomerIdentityResolutionResult> {
    // Production uses authManager's isolated named Firebase Auth instance. The
    // email-link service owns the auxiliary/emulator Auth instance and is empty
    // for production sessions, so always read from the active auth provider.
    const currentFirebaseUser = authManager.getMode() === "production"
      ? authManager.getCurrentUser()
      : emailLinkAuthService.getCurrentFirebaseAuthUser();
    return this.resolveCustomerProfile(currentFirebaseUser, options);
  },

  /**
   * Resolves the customer profile and returns the normalized `User` on success,
   * or throws a typed `CustomerIdentityResolutionError` on any non-resolved state.
   */
  async resolveCustomerProfileOrThrow(
    firebaseUser: AuthenticatedFirebaseUserInput | FirebaseEmailLinkAuthUser | null | undefined,
    options?: ResolveCustomerIdentityOptions,
  ): Promise<User> {
    const result = await this.resolveCustomerProfile(firebaseUser, options);
    if (result.status !== "resolved") {
      throw new CustomerIdentityResolutionError(result);
    }
    return result.profile;
  },

  /**
   * Allocates the next sequential customer ID for `onlineCustomers` using an atomic transaction
   * on `meta/onlineCustomerSequence`. Follows the canonical ONCUSxxxxxxx schema.
   */
  async allocateNextOnlineCustomerSequenceId(): Promise<string> {
    const db = getProductionFirestoreInstance();
    const seqRef = doc(db, "meta", "onlineCustomerSequence");
    const nextId = await runTransaction(db, async (tx) => {
      const snap = await tx.get(seqRef);
      const data = snap.data();
      const curr = snap.exists() && data ? Number(data["current"]) || 0 : 0;
      const updated = curr + 1;
      tx.set(seqRef, { current: updated }, { merge: true });
      return updated;
    });
    return `ONCUS${String(nextId).padStart(7, "0")}`;
  },

  /**
   * Backwards-compatible alias directing ID allocation to the online customer sequence.
   */
  async allocateNextUserSequenceId(): Promise<string> {
    return this.allocateNextOnlineCustomerSequenceId();
  },

  /**
   * Provisions a new customer profile strictly in the `onlineCustomers` Firestore collection
   * and binds the `usersByUid/{uid}` mapping.
   *
   * STRICT GUARANTEES:
   * 1. Stores customer profiles ONLY in `onlineCustomers/{ONCUSxxxxxxx}`.
   * 2. NEVER writes or creates documents in the legacy `users` collection.
   * 3. Sets `collection: "onlineCustomers"` in `usersByUid/{uid}`.
   * 4. Allocates sequence numbers strictly from `meta/onlineCustomerSequence`.
   */
  async provisionCustomerAccount(params: {
    uid: string;
    email?: string | null;
    fullName?: string | null;
    number?: string | null;
    countryCode?: string | null;
    phoneVerified?: boolean;
    gender?: string | null;
    dob?: string | null;
    referredBy?: string | null;
  }): Promise<{ userDocId: string; profile: User }> {
    const { uid, email, fullName, number, countryCode, phoneVerified, gender, dob, referredBy } =
      params;
    const db = getProductionFirestoreInstance();
    const mapRef = doc(db, "usersByUid", uid);
    const mapSnap = await getDoc(mapRef);

    const mapData = mapSnap.data();
    let userDocId = mapSnap.exists() && mapData ? (mapData["userDocId"] as string) : "";
    if (!userDocId) {
      userDocId = await this.allocateNextOnlineCustomerSequenceId();
    }

    const cleanEmail = email ? email.trim().toLowerCase() : "";
    const fallbackName = cleanEmail ? (cleanEmail.split("@")[0] || "Customer") : "Customer";
    const cleanName = fullName ? fullName.trim() : fallbackName;
    const cleanNumber = number ? number.replace(/\D/g, "") : "";
    const cleanCountryCode = countryCode || "+91";

    const customerDocRef = doc(db, "onlineCustomers", userDocId);
    const nowIso = new Date().toISOString();
    const customerPayload: Record<string, unknown> = {
      id: userDocId,
      userId: userDocId,
      customerId: userDocId,
      uid,
      linkedUids: [uid],
      fullName: cleanName,
      name: cleanName,
      email: cleanEmail,
      number: cleanNumber,
      phone: cleanNumber ? `${cleanCountryCode} ${cleanNumber}` : "",
      countryCode: cleanCountryCode,
      phoneVerified: phoneVerified ?? false,
      gender: gender || "",
      dob: dob || "",
      accountType: "customer",
      role: "customer",
      smartCoins: 0,
      earnedCoins: 0,
      isVIP: false,
      referralCode: userDocId,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastUpdated: nowIso,
    };

    if (referredBy) {
      customerPayload["referredBy"] = referredBy.trim().toUpperCase();
      customerPayload["referredAt"] = nowIso;
    }

    // Persist exclusively to onlineCustomers. Never write to legacy users collection.
    await setDoc(customerDocRef, customerPayload, { merge: true });
    await setDoc(
      mapRef,
      {
        userDocId,
        uid,
        collection: "onlineCustomers",
        accountType: "customer",
        createdAt: nowIso,
      },
      { merge: true },
    );

    const profile: User = {
      id: userDocId,
      userId: userDocId,
      customerId: userDocId,
      uid,
      name: cleanName,
      email: cleanEmail,
      phone: cleanNumber ? `${cleanCountryCode} ${cleanNumber}` : "",
      countryCode: cleanCountryCode,
      phoneVerified: phoneVerified ?? false,
      smartCoins: 0,
      coins: 0,
      earnedCoins: 0,
      isVIP: false,
      referralCode: userDocId,
      createdAt: nowIso,
      updatedAt: nowIso,
      lastUpdated: nowIso,
      ...(gender ? { gender } : {}),
      ...(dob ? { dob } : {}),
      ...(referredBy ? { referredBy: referredBy.trim().toUpperCase() } : {}),
    };

    return { userDocId, profile };
  },

  /**
   * Updates an existing customer profile with a verified phone number.
   *
   * STRICT SAFETY GUARANTEES:
   * 1. Validates that the customer profile belongs to the authenticated UID.
   * 2. Sets `phoneVerified: true` strictly after trusted phone verification.
   * 3. Normalizes and updates `phone`, `number`, and `countryCode` consistently.
   * 4. Updates `onlineCustomers/{customerId}` (or legacy `users/{customerId}`).
   */
  async updateVerifiedPhoneNumber(params: {
    uid: string;
    customerId: string;
    verifiedE164Phone: string;
  }): Promise<User> {
    const { uid, customerId, verifiedE164Phone } = params;
    const cleanPhone = (verifiedE164Phone || "").trim();
    if (!cleanPhone || !/^\+[1-9]\d{6,14}$/.test(cleanPhone)) {
      throw new Error("Invalid verified phone number format. Must be E.164 (e.g. +919840012345).");
    }

    const activeUid = authManager.getProductionAdapter().getCurrentUser()?.uid;
    if (!activeUid || activeUid !== uid) {
      throw new Error("The authenticated customer identity changed. Sign in again, then retry without requesting another OTP.");
    }

    const db = getProductionFirestoreInstance();
    const mapRef = doc(db, "usersByUid", uid);
    let mapSnap;
    try {
      mapSnap = await getDoc(mapRef);
    } catch {
      throw new Error("Customer identity could not be verified. Retry synchronization without requesting another OTP.");
    }

    if (!mapSnap.exists()) {
      throw new Error("Customer account link is missing. Contact support to recover the account before updating its phone.");
    }
    const mapData = mapSnap.data();
    if (
      (mapData?.["uid"] && mapData["uid"] !== uid) ||
      (mapData?.["collection"] && mapData["collection"] !== "onlineCustomers") ||
      (mapData?.["accountType"] && mapData["accountType"] !== "customer") ||
      (mapData?.["userDocId"] ?? mapData?.["customerId"]) !== customerId
    ) {
      throw new Error("Access denied: Authenticated UID does not match customer profile.");
    }

    const docRef = doc(db, "onlineCustomers", customerId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error(`Customer profile "${customerId}" not found in onlineCustomers.`);
    }

    const existingData = docSnap.data();
    // Verify ownership
    const profileUid = existingData["uid"];
    const linkedUids = Array.isArray(existingData["linkedUids"]) ? existingData["linkedUids"] : [];
    if (profileUid !== uid && !linkedUids.includes(uid)) {
      throw new Error("Access denied: You cannot modify another customer's phone number.");
    }

    const functions = getFunctions(authManager.getProductionAdapter().getAuthInstance().app);
    const updatePhone = httpsCallable<
      { verifiedE164Phone: string },
      { ok: true }
    >(functions, "updateCustomerVerifiedPhone");
    const result = await updatePhone({ verifiedE164Phone: cleanPhone });
    if (result.data?.ok !== true) {
      throw new Error("Phone verification succeeded, but the customer profile could not be synchronized. Retry without requesting another OTP.");
    }

    const updatedSnapshot = await getDoc(docRef);
    if (!updatedSnapshot.exists()) {
      throw new Error("Phone verification succeeded, but the customer profile could not be reloaded. Retry synchronization without requesting another OTP.");
    }
    const mergedRaw = updatedSnapshot.data();
    const normalized = normalizeLegacyUser(mergedRaw);
    if (!normalized) {
      throw new Error("Failed to normalize updated customer profile.");
    }
    return normalized;
  },
};
