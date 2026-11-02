import { apiClient } from "./apiClient";

export interface LegacyPromo {
  id: string;
  code: string;
  amount: number;
  type: string;
  createdAt: unknown;
  raw: Record<string, unknown>;
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 404
  );
}

/** Reads and validates a promo using the legacy `promoCodes` then `promos` schema. */
export async function fetchPromoByCode(code: string): Promise<LegacyPromo> {
  const normalizedCode = code.trim().toUpperCase();
  if (!normalizedCode) throw new Error("Please enter a promo code");

  let document: Record<string, unknown> | undefined;
  let documentId = "";

  for (const collectionName of ["promoCodes", "promos"] as const) {
    try {
      const matches = await apiClient.get<Record<string, unknown>[]>(
        `/${collectionName}`,
        { code: normalizedCode },
      );
      const match = matches.find(
        (candidate) => String(candidate["code"] || "").trim().toUpperCase() === normalizedCode,
      );
      if (match) {
        document = match;
        documentId = String(match["id"] || "");
        break;
      }
    } catch (error) {
      // A missing legacy collection can be skipped; service/permission errors stay visible.
      if (!isNotFound(error)) throw error;
    }
  }

  if (!document) throw new Error("Invalid promo code");
  if (
    document["status"] === "paused" ||
    document["status"] === "expired" ||
    document["isExpired"] === true
  ) {
    throw new Error("This promo code has expired or is inactive");
  }

  const amount = Number(
    document["value"] ?? document["amount"] ?? document["discountAmount"] ?? 0,
  );
  return {
    id: documentId,
    code: String(document["code"] || normalizedCode),
    amount: Number.isFinite(amount) ? amount : 0,
    type: String(document["type"] || (document["value"] ? "percentage" : "fixed")),
    createdAt: document["createdAt"] ?? null,
    raw: document,
  };
}

/** Mirrors the legacy CartPage's percentage rounding and fixed-discount cap. */
export function calculateLegacyPromoDiscount(
  promo: Pick<LegacyPromo, "amount" | "type">,
  subtotal: number,
): number {
  const amount = Number.isFinite(promo.amount) ? Math.max(0, promo.amount) : 0;
  const discount = ["percentage", "percent"].includes(promo.type.trim().toLowerCase())
    ? Math.round((subtotal * amount) / 100)
    : amount;
  return Math.min(Math.max(0, subtotal), discount);
}
