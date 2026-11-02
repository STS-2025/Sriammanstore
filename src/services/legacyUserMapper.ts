import type { User } from "../types";
import { normalizeDobString } from "../lib/dateUtils";

/**
 * Pure, Read-Only Legacy Customer Profile Mapper
 *
 * Translates legacy Sri Amman Smart Store Firestore user documents (`users/{userDocId}`)
 * into the frontend's canonical `User` customer profile model (`src/types/index.ts`).
 *
 * ============================================================================
 * IDENTITY & AUTHENTICATION BOUNDARY (FUTURE FIREBASE AUTH INTEGRATION NOTE)
 * ============================================================================
 * In the legacy Sri Amman Smart Store Firebase project (`sri-amman-smart-store`),
 * the customer identity relationship is two-step:
 *
 *   Firebase Auth UID (`auth.currentUser.uid`)
 *     → `usersByUid/{uid}` document (`{ userDocId: "SASS0000001", uid: "<firebase-uid>" }`)
 *     → `users/{userDocId}` document (`{ userId: "SASS0000001", uid: "<firebase-uid>", ... }`)
 *
 * Important architectural rules:
 * 1. The canonical SASS customer document ID (`SASS0000001`) is NOT the same as
 *    the Firebase Auth UID (`uid`). All customer-scoped subcollections (`cart`,
 *    `addresses`, `orders`, `coinsHistory`, `refferals`, `wishlists`,
 *    `notifications`) are keyed under `users/{userDocId}` using the `SASS...` ID.
 * 2. When authorized Firebase Authentication is integrated in a future phase, the
 *    auth/session service will first resolve `usersByUid/{auth.uid}.userDocId`,
 *    fetch `users/{userDocId}`, and pass that raw document (plus `{ docId: userDocId }`)
 *    into `normalizeLegacyUser(rawDoc, { docId: userDocId })`.
 * 3. This module is strictly a pure, synchronous, read-only document mapper:
 *    it performs NO Firebase SDK calls, NO `usersByUid` network lookups, NO UI
 *    or `localStorage` side effects, and NO writes.
 */

export interface LegacyUserContext {
  /** Document ID derived from Firestore snapshot (`doc.id`) if missing in `doc.data()` */
  docId?: string;
  /** Full or relative Firestore document path (e.g. `users/SASS0000001` or `onlineCustomers/ONCUS000010`) */
  documentPath?: string;
  /** Optional legacy SASS ID when mapping an ONCUS customer */
  legacySassId?: string;
}

const STRICT_NON_NEGATIVE_NUMERIC_RE = /^\d+(?:\.\d+)?$/;
export const CANONICAL_ONCUS_ID_RE = /^ONCUS\d{6,7}$/i;
export const CANONICAL_SASS_ID_RE = /^SASS\d{6,7}$/i;
export const CANONICAL_CUSTOMER_ID_RE = /^(ONCUS\d{6,7}|SASS\d{6,7})$/i;
const CUSTOMER_COLLECTION_PATH_RE = /^\/?(?:users|onlineCustomers)\/([^/]+)\/?$/;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickFirstString(
  record: Record<string, unknown>,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const candidate = getNonEmptyString(record[key]);
    if (candidate !== null) {
      return candidate;
    }
  }
  return null;
}

function pickFirstDobString(
  record: Record<string, unknown>,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const candidate = normalizeDobString(record[key]);
    if (candidate !== null) {
      return candidate;
    }
  }
  return null;
}

/**
 * Strictly parses a non-negative finite number from a `number` or an unambiguous
 * non-negative numeric string.
 *
 * Rejects negative numbers, `NaN`, `Infinity`, booleans, `null`, `undefined`,
 * arrays, objects, currency symbols, and malformed strings.
 */
export function parseStrictCoinValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!STRICT_NON_NEGATIVE_NUMERIC_RE.test(trimmed)) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  }
  return null;
}

/**
 * Preserves phone numbers as strings, maintaining formatting characters
 * (`+`, spaces, hyphens, parentheses) and leading zeros (e.g. `"09876543210"`,
 * `"044-22334455"`).
 *
 * Also safely converts finite non-negative numeric phone fields from malformed
 * legacy records without inventing missing digits.
 */
function normalizePhoneString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
    return String(Math.trunc(value));
  }
  return null;
}

function pickFirstPhoneString(
  record: Record<string, unknown>,
  keys: readonly string[]
): string {
  for (const key of keys) {
    const phone = normalizePhoneString(record[key]);
    if (phone !== null) {
      return phone;
    }
  }
  return "";
}

/**
 * Converts a string or Firestore Timestamp-like object into an ISO/string
 * timestamp without fabricating a current date when missing or invalid.
 */
function normalizeTimestampString(value: unknown): string | null {
  const direct = getNonEmptyString(value);
  if (direct !== null) {
    return direct;
  }
  if (!isPlainRecord(value)) {
    return null;
  }

  // Handle Firestore Timestamp instance with `toDate()` method
  const toDateFn = value["toDate"];
  if (typeof toDateFn === "function") {
    try {
      const dateResult: unknown = toDateFn.call(value);
      if (dateResult instanceof Date && Number.isFinite(dateResult.getTime())) {
        return dateResult.toISOString();
      }
    } catch {
      return null;
    }
  }

  // Handle serialized Firestore Timestamp `{ seconds, nanoseconds }` or `{ _seconds, _nanoseconds }`
  const rawSeconds = value["seconds"] ?? value["_seconds"];
  const rawNanos = value["nanoseconds"] ?? value["_nanoseconds"] ?? 0;
  if (typeof rawSeconds === "number" && Number.isFinite(rawSeconds)) {
    const nanos =
      typeof rawNanos === "number" && Number.isFinite(rawNanos) ? rawNanos : 0;
    const ms = rawSeconds * 1000 + Math.floor(nanos / 1_000_000);
    const date = new Date(ms);
    if (Number.isFinite(date.getTime())) {
      return date.toISOString();
    }
  }

  return null;
}

function extractDocIdFromPath(documentPath: string | undefined): string | null {
  const cleanPath = getNonEmptyString(documentPath);
  if (!cleanPath) return null;
  const match = CUSTOMER_COLLECTION_PATH_RE.exec(cleanPath);
  return match && match[1] ? getNonEmptyString(match[1]) : null;
}

/**
 * Resolves the canonical customer document ID (`id` / `userId`), prioritizing ONCUS IDs, then SASS IDs.
 *
 * Precedence order:
 *   1. `rawDoc.userId`
 *   2. `rawDoc.id`
 *   3. `rawDoc._docId`
 *   4. `context.docId`
 *   5. `context.documentPath` (`onlineCustomers/{userDocId}` or `users/{userDocId}`)
 *
 * Conflict resolution rule:
 * - `rawDoc.uid` (Firebase Auth UID) is NEVER used as a fallback for `id` or `userId`.
 * - If multiple ID candidates exist, canonical `ONCUS...` identifiers take highest precedence,
 *   followed by canonical `SASS...` identifiers.
 * - If `rawDoc.uid` is present and a candidate (`id`) equals `rawDoc.uid` while another candidate
 *   (`userId` or `context.docId`) provides a distinct customer document ID, the distinct customer
 *   document ID is selected.
 */
function resolveCanonicalUserId(
  record: Record<string, unknown>,
  context?: LegacyUserContext
): string | null {
  const firebaseUid = getNonEmptyString(record["uid"]);
  const rawCandidates = [
    getNonEmptyString(record["userId"]),
    getNonEmptyString(record["id"]),
    getNonEmptyString(record["_docId"]),
    getNonEmptyString(context?.docId),
    extractDocIdFromPath(context?.documentPath),
  ];

  const validCandidates = rawCandidates.filter(
    (candidate): candidate is string => candidate !== null
  );

  if (validCandidates.length === 0) {
    return null;
  }

  // 1. Prefer the first candidate matching the primary ONCUS customer ID pattern
  for (const candidate of validCandidates) {
    if (CANONICAL_ONCUS_ID_RE.test(candidate)) {
      return candidate.toUpperCase();
    }
  }

  // 2. Next prefer the first candidate matching the canonical SASS customer ID pattern
  for (const candidate of validCandidates) {
    if (CANONICAL_SASS_ID_RE.test(candidate)) {
      return candidate.toUpperCase();
    }
  }

  // 3. Avoid selecting a candidate that merely duplicates `uid` if a distinct doc ID exists
  if (firebaseUid !== null) {
    const distinctFromUid = validCandidates.find(
      (candidate) => candidate !== firebaseUid
    );
    if (distinctFromUid !== undefined) {
      return distinctFromUid;
    }
  }

  // 4. Otherwise use the highest-precedence non-empty candidate (`userId` > `id` > `_docId` > `context.docId`)
  return validCandidates[0] ?? null;
}

/**
 * Resolves canonical spendable coin balance (`smartCoins`), legacy alias (`coins`),
 * and historical coin fields (`earnedCoins`, `availableCoins`).
 *
 * Precedence for canonical spendable `smartCoins`:
 *   1. `rawDoc.smartCoins` (canonical current balance)
 *   2. `rawDoc.coins` (legacy fallback for unmigrated documents)
 *   3. `rawDoc.availableCoins` (legacy spendable field)
 *   4. `rawDoc.availableCoins32` (legacy 32-bit field)
 *   5. `0` (default fallback)
 */
function resolveCoinBalances(record: Record<string, unknown>): {
  smartCoins: number;
  coins: number;
  availableCoins: number | null;
  earnedCoins: number | null;
} {
  const directSmartCoins = parseStrictCoinValue(record["smartCoins"]);
  const directCoins = parseStrictCoinValue(record["coins"]);
  const legacyAvailableCoins =
    parseStrictCoinValue(record["availableCoins"]) ??
    parseStrictCoinValue(record["availableCoins32"]);
  const legacyEarnedCoins = parseStrictCoinValue(record["earnedCoins"]);

  const smartCoins = directSmartCoins ?? directCoins ?? legacyAvailableCoins ?? 0;

  return {
    smartCoins,
    coins: smartCoins,
    availableCoins: legacyAvailableCoins,
    earnedCoins: legacyEarnedCoins,
  };
}

/**
 * Pure, read-only mapper that converts a legacy Firestore `users/{userDocId}` document
 * (or an already-normalized frontend `User` object) into the canonical frontend `User` shape.
 *
 * Returns `null` if the input is not a plain object or lacks a resolvable customer ID.
 */
export function normalizeLegacyUser(
  rawDoc: unknown,
  context?: LegacyUserContext
): User | null {
  if (!isPlainRecord(rawDoc)) {
    return null;
  }

  const resolvedUserId = resolveCanonicalUserId(rawDoc, context);
  if (!resolvedUserId) {
    return null;
  }

  // Name precedence: `name` -> `fullName` -> `displayName` -> `""` (never fabricate a name)
  const name =
    pickFirstString(rawDoc, ["name", "fullName", "displayName"]) ?? "";

  // Phone precedence: `phone` -> `number` -> `phoneNumber` -> `contact` -> `""`
  // Preserves formatting characters and leading zeros as strings.
  const phone = pickFirstPhoneString(rawDoc, [
    "phone",
    "number",
    "phoneNumber",
    "contact",
  ]);

  // Email precedence: `email` -> `userEmail` -> `""` (handles legacy `email: null` safely)
  const email = pickFirstString(rawDoc, ["email", "userEmail"]) ?? "";

  // Spendable & legacy coin balances
  const { smartCoins, coins, availableCoins, earnedCoins } = resolveCoinBalances(rawDoc);

  // VIP status: strictly boolean from document (`false` when missing or non-boolean)
  const isVIP = typeof rawDoc["isVIP"] === "boolean" ? rawDoc["isVIP"] : false;

  // Referral code: preserve only when present in document (`""` when missing; never fabricated)
  const referralCode = getNonEmptyString(rawDoc["referralCode"]) ?? "";

  // Created timestamp precedence: `createdAt` -> `lastUpdated` -> `""` (never fabricated)
  const createdAt =
    normalizeTimestampString(rawDoc["createdAt"]) ??
    normalizeTimestampString(rawDoc["lastUpdated"]) ??
    "";

  // Optional fields (included only when valid and non-empty to satisfy `exactOptionalPropertyTypes`)
  const primaryAddressId = getNonEmptyString(rawDoc["primaryAddressId"]);
  const referredBy = getNonEmptyString(rawDoc["referredBy"]);
  const preferredLanguage = pickFirstString(rawDoc, [
    "preferredLanguage",
    "language",
  ]);
  const dob = pickFirstDobString(rawDoc, [
    "dob",
    "dateOfBirth",
    "birthday",
  ]);
  const groceryRhythm = getNonEmptyString(rawDoc["groceryRhythm"]);
  const avatarUrl = pickFirstString(rawDoc, [
    "avatarUrl",
    "photoURL",
    "profileImage",
  ]);
  const uid = getNonEmptyString(rawDoc["uid"]);
  const countryCode = getNonEmptyString(rawDoc["countryCode"]);
  const gender = getNonEmptyString(rawDoc["gender"]);
  const phoneVerified =
    typeof rawDoc["phoneVerified"] === "boolean"
      ? rawDoc["phoneVerified"]
      : null;

  const rawLegacySassId =
    getNonEmptyString(rawDoc["legacySassId"]) ??
    getNonEmptyString(rawDoc["sassId"]) ??
    (context?.legacySassId ? getNonEmptyString(context.legacySassId) : null);
  const legacySassId =
    rawLegacySassId && CANONICAL_SASS_ID_RE.test(rawLegacySassId)
      ? rawLegacySassId.toUpperCase()
      : null;

  const customerId = getNonEmptyString(rawDoc["customerId"]) ?? resolvedUserId;
  const accountType = getNonEmptyString(rawDoc["accountType"]);
  const role = getNonEmptyString(rawDoc["role"]);
  const updatedAt =
    normalizeTimestampString(rawDoc["updatedAt"]) ??
    normalizeTimestampString(rawDoc["lastUpdated"]);
  const lastUpdated =
    normalizeTimestampString(rawDoc["lastUpdated"]) ??
    normalizeTimestampString(rawDoc["updatedAt"]);

  const normalized: User = {
    id: resolvedUserId,
    userId: resolvedUserId,
    customerId,
    ...(legacySassId !== null ? { legacySassId } : {}),
    name,
    phone,
    email,
    smartCoins,
    coins: smartCoins,
    ...(availableCoins !== null ? { availableCoins } : {}),
    ...(earnedCoins !== null ? { earnedCoins } : {}),
    ...(primaryAddressId !== null ? { primaryAddressId } : {}),
    ...(uid !== null ? { uid } : {}),
    ...(countryCode !== null ? { countryCode } : {}),
    ...(gender !== null ? { gender } : {}),
    ...(phoneVerified !== null ? { phoneVerified } : {}),
    ...(accountType !== null ? { accountType } : {}),
    ...(role !== null ? { role } : {}),
    isVIP,
    referralCode,
    ...(referredBy !== null ? { referredBy } : {}),
    createdAt,
    ...(updatedAt !== null ? { updatedAt } : {}),
    ...(lastUpdated !== null ? { lastUpdated } : {}),
    ...(preferredLanguage !== null ? { preferredLanguage } : {}),
    ...(dob !== null ? { dob, birthday: dob } : {}),
    ...(groceryRhythm !== null ? { groceryRhythm } : {}),
    ...(avatarUrl !== null ? { avatarUrl } : {}),
  };

  return normalized;
}

/**
 * Alias for `normalizeLegacyUser` for callers referencing `normalizeLegacyUserProfile`.
 */
export const normalizeLegacyUserProfile = normalizeLegacyUser;

/**
 * Normalizes an array of raw legacy or frontend user documents, filtering out
 * `null` or unrecoverable entries while deduplicating by canonical `id`.
 */
export function normalizeLegacyUserList(
  rawDocs: unknown,
  defaultContext?: LegacyUserContext
): User[] {
  if (!Array.isArray(rawDocs)) {
    return [];
  }

  const results: User[] = [];
  const seenIds = new Set<string>();

  for (const item of rawDocs) {
    const normalized = normalizeLegacyUser(item, defaultContext);
    if (!normalized) continue;
    if (seenIds.has(normalized.id)) continue;
    seenIds.add(normalized.id);
    results.push(normalized);
  }

  return results;
}

