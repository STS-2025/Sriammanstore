/**
 * Date and DOB utilities for Sri Amman Smart Store.
 *
 * Prevents timezone-related off-by-one day shifts when parsing, converting,
 * and displaying customer Date of Birth (DOB) values.
 */

/**
 * Normalizes a DOB input into a clean string without timezone shift.
 * - String inputs (e.g. "1990-05-14", "14 August") are trimmed and preserved as-is
 *   without converting to a JavaScript Date object, avoiding timezone offset shifts.
 * - Date objects or Firestore Timestamp objects are converted using UTC calendar parts
 *   so that a date stored at UTC midnight never shifts to the previous day in timezones
 *   behind UTC (e.g. UTC-5, UTC-8).
 */
export function normalizeDobString(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Check if ISO timestamp with time component (e.g. "1990-05-14T00:00:00.000Z")
    if (trimmed.includes("T")) {
      const parts = trimmed.split("T");
      const datePart = parts[0];
      if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
    }
    return trimmed;
  }

  // Handle Date instance safely using UTC getters
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Handle Firestore Timestamp { seconds, nanoseconds } or { _seconds, _nanoseconds }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const rawSeconds = record["seconds"] ?? record["_seconds"];
    if (typeof rawSeconds === "number" && Number.isFinite(rawSeconds)) {
      const date = new Date(rawSeconds * 1000);
      const y = date.getUTCFullYear();
      const m = String(date.getUTCMonth() + 1).padStart(2, "0");
      const d = String(date.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  return null;
}

/**
 * Formats a DOB string for customer display.
 * If the input is in ISO YYYY-MM-DD format, safely extracts the date components without
 * creating a Date object with local midnight interpretation, ensuring immune behavior to timezone offsets.
 */
export function formatDobForDisplay(dob?: string | null, fallback = "14 August"): string {
  if (!dob || !dob.trim()) return fallback;
  const trimmed = dob.trim();

  // If already a text string like "14 August" or "15 August", return it directly
  if (!/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed;
  }

  // If YYYY-MM-DD, extract components directly via string splitting
  // This guarantees NO timezone conversion (May 14 remains May 14 in every timezone)
  const datePart = trimmed.split("T")[0];
  if (!datePart) return trimmed;

  const parts = datePart.split("-");
  const year = parts[0];
  const monthStr = parts[1];
  const dayStr = parts[2];

  if (year && monthStr && dayStr) {
    const monthNum = parseInt(monthStr, 10);
    const dayNum = parseInt(dayStr, 10);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    if (monthNum >= 1 && monthNum <= 12 && !Number.isNaN(dayNum)) {
      return `${dayNum} ${monthNames[monthNum - 1]} ${year}`;
    }
  }

  return datePart;
}

