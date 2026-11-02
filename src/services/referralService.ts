import { apiClient } from "./apiClient";
import { OFFICIAL_COIN_CONVERSION_RATE } from "./coinService";
import { authManager } from "./authAdapter";
import { authService } from "./authService";
import { productionReferralReader } from "./productionReferralReader";
import { resolveCustomerDataSource } from "./customerDataSourceResolver";
import type { ReferralFriend } from "../types";

export type ReferralActivityFilter = "all" | "completed" | "pending";

export const REFERRAL_REWARD_COINS = 50;

export const referralService = {
  async getReferrals(
    userId?: string,
    legacySassId?: string
  ): Promise<ReferralFriend[]> {
    const isProd = authManager.getMode() === "production";
    const currentUser = authService.getCurrentUser();
    const rawId = (userId || currentUser?.id || currentUser?.userId || "").trim();

    if (isProd) {
      if (!rawId) return [];
      let resolvedId = rawId;
      let resolvedLegacySassId = legacySassId || currentUser?.legacySassId;
      try {
        const ds = resolveCustomerDataSource(rawId);
        resolvedId = ds.canonicalCustomerId;
        resolvedLegacySassId = resolvedLegacySassId || ds.legacySassId;
      } catch {
        // fallback
      }
      if (resolvedLegacySassId) {
        return productionReferralReader.getCustomerReferrals(
          resolvedId,
          undefined,
          resolvedLegacySassId
        );
      }
      return productionReferralReader.getCustomerReferrals(resolvedId);
    }

    const effectiveUserId = rawId || "SASS0000104";
    const list = await apiClient.get<ReferralFriend[]>("/referrals", {
      userId: effectiveUserId,
    });
    return (list || [])
      .filter((r) => !r.userId || r.userId === effectiveUserId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  isCompletedReferral(referral: ReferralFriend): boolean {
    return (
      referral.status.toLowerCase().includes("completed") ||
      (referral.rewardCoins || 0) > 0
    );
  },

  filterReferrals(
    referrals: ReferralFriend[],
    filter: ReferralActivityFilter
  ): ReferralFriend[] {
    if (filter === "completed") {
      return referrals.filter((r) => this.isCompletedReferral(r));
    }
    if (filter === "pending") {
      return referrals.filter((r) => !this.isCompletedReferral(r));
    }
    return referrals;
  },

  calculateReferralStats(
    referrals: ReferralFriend[],
    coinValueInRupees = OFFICIAL_COIN_CONVERSION_RATE
  ): {
    totalNeighbors: number;
    completedCount: number;
    pendingCount: number;
    totalCoinsEarned: number;
    totalCashCredit: number;
    conversionRatePercent: number;
    potentialPendingCoins: number;
  } {
    const totalNeighbors = referrals.length;
    const completedCount = referrals.filter((r) =>
      this.isCompletedReferral(r)
    ).length;
    const pendingCount = totalNeighbors - completedCount;
    const totalCoinsEarned = referrals.reduce(
      (sum, r) => sum + (r.rewardCoins || 0),
      0
    );
    const validRate =
      typeof coinValueInRupees === "number" && coinValueInRupees > 0
        ? coinValueInRupees
        : 0;
    const totalCashCredit = totalCoinsEarned * validRate;
    const conversionRatePercent =
      totalNeighbors > 0
        ? Math.round((completedCount / totalNeighbors) * 100)
        : 0;
    const potentialPendingCoins = pendingCount * REFERRAL_REWARD_COINS;

    return {
      totalNeighbors,
      completedCount,
      pendingCount,
      totalCoinsEarned,
      totalCashCredit,
      conversionRatePercent,
      potentialPendingCoins,
    };
  },

  buildReferralLink(referralCode: string, origin?: string): string {
    const baseOrigin =
      origin ||
      (typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost:8080");
    const cleanOrigin = baseOrigin.replace(/\/+$/, "");
    const cleanCode = (referralCode || "").trim();
    return `${cleanOrigin}/login?ref=${encodeURIComponent(cleanCode)}`;
  },

  buildShareMessage(referralCode: string, origin?: string): string {
    const link = this.buildReferralLink(referralCode, origin);
    const cleanCode = (referralCode || "").trim();
    return `Shop wood-pressed Mara Chekku oils, organic staples, and farm-fresh groceries at Sri Amman Smart Store! Register with my referral code ${cleanCode} to claim your welcome bonus Smart Coins: ${link}`;
  },

  buildWhatsAppShareUrl(referralCode: string, origin?: string): string {
    const message = this.buildShareMessage(referralCode, origin);
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  },

  formatReferralDate(dateStr: string): string {
    if (!dateStr) return "—";
    const parsed = new Date(dateStr);
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  },

  getInitials(name: string): string {
    if (!name || !name.trim()) return "FR";
    const parts = name.trim().split(/\s+/);
    const first = parts[0];
    if (!first) return "FR";
    if (parts.length === 1) {
      return first.slice(0, 2).toUpperCase();
    }
    const last = parts[parts.length - 1] || first;
    return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
  },
};
