const STORAGE_KEY = "sriman-referral-attribution";
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredReferralAttribution {
  code: string;
  capturedAt: number;
}

function normalizeCode(code: unknown): string {
  return typeof code === "string" ? code.trim().toUpperCase() : "";
}

export const referralAttribution = {
  capture(code: unknown): string | null {
    const cleanCode = normalizeCode(code);
    if (!cleanCode || typeof window === "undefined") return null;

    const existing = this.get();
    // Keep the first referral source while the visitor completes signup.
    if (existing) return existing;

    try {
      const value: StoredReferralAttribution = { code: cleanCode, capturedAt: Date.now() };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      return cleanCode;
    } catch {
      return null;
    }
  },

  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const value = JSON.parse(raw) as Partial<StoredReferralAttribution>;
      if (
        typeof value.code !== "string" ||
        typeof value.capturedAt !== "number" ||
        Date.now() - value.capturedAt > ATTRIBUTION_TTL_MS ||
        value.capturedAt > Date.now()
      ) {
        window.localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return normalizeCode(value.code) || null;
    } catch {
      return null;
    }
  },

  clear(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
  },
};
