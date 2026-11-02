import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  referralService,
  REFERRAL_REWARD_COINS,
} from "../services/referralService";
import { authService } from "../services/authService";
import { coinService } from "../services/coinService";
import { settingsService } from "../services/settingsService";
import { apiClient } from "../services/apiClient";
import type { ReferralFriend } from "../types";

describe("Refer & Earn Page & Referral Service Verification", () => {
  const customerA = "SASS0000104";
  const customerB = "SASS0000088";

  const sampleReferrals: ReferralFriend[] = [
    {
      id: "ref_01",
      userId: customerA,
      friendName: "Suresh Raina",
      phoneMasked: "+91 98402 *****",
      status: "Completed First Order",
      rewardCoins: 50,
      date: "2026-09-15",
    },
    {
      id: "ref_02",
      userId: customerA,
      friendName: "Divya Krishnan",
      phoneMasked: "+91 97910 *****",
      status: "Completed First Order",
      rewardCoins: 50,
      date: "2026-09-22",
    },
    {
      id: "ref_03",
      userId: customerA,
      friendName: "Mohan Raj",
      phoneMasked: "+91 94443 *****",
      status: "Signed Up (Order Pending)",
      rewardCoins: 0,
      date: "2026-10-05",
    },
  ];

  describe("1. Referral Impact Metrics & Conversion Rate Calculation", () => {
    it("computes total invites, completed orders, pending count, coins earned, and conversion rate", () => {
      const stats = referralService.calculateReferralStats(
        sampleReferrals,
        0.05
      );

      expect(stats.totalNeighbors).toBe(3);
      expect(stats.completedCount).toBe(2);
      expect(stats.pendingCount).toBe(1);
      expect(stats.totalCoinsEarned).toBe(100);
      expect(stats.totalCashCredit).toBe(5);
      expect(stats.conversionRatePercent).toBe(67);
      expect(stats.potentialPendingCoins).toBe(1 * REFERRAL_REWARD_COINS);
    });

    it("does not calculate positive rupee value when conversion rate is zero or invalid", () => {
      const statsZeroRate = referralService.calculateReferralStats(
        sampleReferrals,
        0
      );
      expect(statsZeroRate.totalCoinsEarned).toBe(100);
      expect(statsZeroRate.totalCashCredit).toBe(0);

      const statsNegativeRate = referralService.calculateReferralStats(
        sampleReferrals,
        -1
      );
      expect(statsNegativeRate.totalCashCredit).toBe(0);
    });

    it("returns zeroed metrics for customers with no referrals", () => {
      const emptyStats = referralService.calculateReferralStats([], 0.05);
      expect(emptyStats.totalNeighbors).toBe(0);
      expect(emptyStats.completedCount).toBe(0);
      expect(emptyStats.pendingCount).toBe(0);
      expect(emptyStats.totalCoinsEarned).toBe(0);
      expect(emptyStats.totalCashCredit).toBe(0);
      expect(emptyStats.conversionRatePercent).toBe(0);
      expect(emptyStats.potentialPendingCoins).toBe(0);
    });
  });

  describe("2. Referral Activity Log Filtering", () => {
    it("returns all referrals when filter is 'all'", () => {
      const result = referralService.filterReferrals(sampleReferrals, "all");
      expect(result).toHaveLength(3);
    });

    it("returns only completed and rewarded referrals when filter is 'completed'", () => {
      const result = referralService.filterReferrals(
        sampleReferrals,
        "completed"
      );
      expect(result).toHaveLength(2);
      expect(
        result.every((r) => referralService.isCompletedReferral(r))
      ).toBe(true);
    });

    it("returns only pending first-order referrals when filter is 'pending'", () => {
      const result = referralService.filterReferrals(
        sampleReferrals,
        "pending"
      );
      expect(result).toHaveLength(1);
      expect(result[0]?.friendName).toBe("Mohan Raj");
      expect(result[0]?.rewardCoins).toBe(0);
    });
  });

  describe("3. Referral Share Links & Origin Resolution", () => {
    it("builds referral link using actual origin and referral code without inventing a domain", () => {
      const link = referralService.buildReferralLink(
        "SASS0000104",
        "http://localhost:8080/"
      );
      expect(link).toBe("http://localhost:8080/login?ref=SASS0000104");
      expect(link).not.toContain("sriammanstore.com");
    });

    it("builds valid WhatsApp share URL containing the customer referral code and link", () => {
      const waUrl = referralService.buildWhatsAppShareUrl(
        "SASS0000104",
        "http://localhost:8080"
      );
      expect(waUrl.startsWith("https://api.whatsapp.com/send?text=")).toBe(
        true
      );
      const decoded = decodeURIComponent(
        waUrl.replace("https://api.whatsapp.com/send?text=", "")
      );
      expect(decoded).toContain("SASS0000104");
      expect(decoded).toContain("http://localhost:8080/login?ref=SASS0000104");
    });
  });

  describe("4. Date Formatting & Privacy-Safe Initials", () => {
    it("formats ISO and YYYY-MM-DD dates consistently", () => {
      const formatted = referralService.formatReferralDate("2026-09-15");
      expect(formatted).toContain("2026");
      expect(formatted).toMatch(/15\s+Sept?\s+2026/i);
      expect(referralService.formatReferralDate("")).toBe("—");
    });

    it("generates two-letter initials from friend names", () => {
      expect(referralService.getInitials("Suresh Raina")).toBe("SR");
      expect(referralService.getInitials("Divya Krishnan")).toBe("DK");
      expect(referralService.getInitials("Mohan")).toBe("MO");
      expect(referralService.getInitials("")).toBe("FR");
    });
  });

  describe("5. Live REST API Integration, Customer Isolation & Error Handling", () => {
    let originalGet: typeof apiClient.get;

    beforeEach(() => {
      originalGet = apiClient.get;
    });

    afterEach(() => {
      apiClient.get = originalGet;
    });

    it("fetches referrals from /referrals endpoint scoped strictly to the authenticated customer", async () => {
      const listA = await referralService.getReferrals(customerA);
      expect(Array.isArray(listA)).toBe(true);
      expect(listA.length).toBeGreaterThanOrEqual(3);
      expect(listA.every((r) => r.userId === customerA)).toBe(true);

      const listB = await referralService.getReferrals(customerB);
      expect(Array.isArray(listB)).toBe(true);
      expect(listB.every((r) => r.userId === customerB)).toBe(true);
    });

    it("propagates API errors transparently when JSON Server is unreachable", async () => {
      apiClient.get = vi
        .fn()
        .mockRejectedValue(new Error("JSON Server REST API is unavailable"));

      await expect(referralService.getReferrals(customerA)).rejects.toThrow(
        "unavailable"
      );
    });

    it("integrates with storeInfo and coinService for vault balance and conversion rate", async () => {
      const [storeInfo, history] = await Promise.all([
        settingsService.getStoreInfo(),
        coinService.getCoinHistory(customerA),
      ]);

      expect(storeInfo.coinValueInRupees).toBeGreaterThan(0);
      expect(storeInfo.vipSpendingThreshold).toBe(5000);
      const ledgerStats = coinService.calculateLedgerStats(history);
      expect(ledgerStats.netBalance).toBeGreaterThanOrEqual(0);
    });

    it("validates customer SASS referral codes through authService", async () => {
      const validation = await authService.validateReferralCode(customerA);
      expect(validation.valid).toBe(true);
      expect(validation.bonusCoins).toBe(50);
    });
  });
});

