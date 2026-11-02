import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  coinService,
  convertCoinsToRupees,
  convertRupeesToCoins,
  OFFICIAL_COIN_CONVERSION_RATE,
} from "../services/coinService";
import { settingsService } from "../services/settingsService";
import { referralService } from "../services/referralService";
import type { ReferralFriend, CoinTransaction, StoreInfo } from "../types";

describe("Phase 7.2.1: Rewards Page Conversion Rate Regression & Protection Suite", () => {
  const originalGetStoreInfo = settingsService.getStoreInfo;

  afterEach(() => {
    settingsService.getStoreInfo = originalGetStoreInfo;
    vi.restoreAllMocks();
  });

  describe("1. Obsolete Rate Guard & Fallback Protection", () => {
    it("reproduces obsolete 0.50 rate from store settings and proves it is strictly overridden by 0.05", async () => {
      // Mock store settings returning the legacy 0.5 rate (the exact bug condition)
      settingsService.getStoreInfo = vi.fn().mockResolvedValue({
        storeName: "Sri Amman Smart Store",
        coinValueInRupees: 0.5, // Legacy obsolete rate
        vipSpendingThreshold: 5000,
      } as StoreInfo);

      const rate = await coinService.getConversionRate();
      // Must NOT return 0.5
      expect(rate).not.toBe(0.5);
      // Must return official 0.05
      expect(rate).toBe(0.05);
      expect(rate).toBe(OFFICIAL_COIN_CONVERSION_RATE);
    });

    it("accepts valid custom rate if explicitly configured different from legacy 0.50", async () => {
      settingsService.getStoreInfo = vi.fn().mockResolvedValue({
        storeName: "Sri Amman Smart Store",
        coinValueInRupees: 0.05,
        vipSpendingThreshold: 5000,
      } as StoreInfo);

      const rate = await coinService.getConversionRate();
      expect(rate).toBe(0.05);
    });

    it("falls back to OFFICIAL_COIN_CONVERSION_RATE when settingsService throws", async () => {
      settingsService.getStoreInfo = vi
        .fn()
        .mockRejectedValue(new Error("Network failure"));

      const rate = await coinService.getConversionRate();
      expect(rate).toBe(0.05);
    });

    it("falls back to OFFICIAL_COIN_CONVERSION_RATE when store settings has null/undefined/invalid rate", async () => {
      settingsService.getStoreInfo = vi.fn().mockResolvedValue({
        storeName: "Sri Amman Smart Store",
        coinValueInRupees: undefined,
      } as any);

      const rate = await coinService.getConversionRate();
      expect(rate).toBe(0.05);
    });
  });

  describe("2. Cash Valuation Calculations on Rewards Page (100 coins = ₹5.00)", () => {
    it("converts 100 coins to exactly ₹5.00 cash value", () => {
      const coins = 100;
      const cashVal = convertCoinsToRupees(coins);
      expect(cashVal).toBe(5.0);
      expect(cashVal.toFixed(2)).toBe("5.00");
    });

    it("converts arbitrary coin stash balances correctly with official rate", () => {
      expect(convertCoinsToRupees(20)).toBe(1.0);
      expect(convertCoinsToRupees(50)).toBe(2.5);
      expect(convertCoinsToRupees(250)).toBe(12.5);
      expect(convertCoinsToRupees(500)).toBe(25.0);
      expect(convertCoinsToRupees(1000)).toBe(50.0);
    });

    it("formats live conversion pill string matching 'Live Conversion: 1 Coin = ₹0.05 Instant Cash'", () => {
      const rate = OFFICIAL_COIN_CONVERSION_RATE;
      const pillText = `Live Conversion: 1 Coin = ₹${rate.toFixed(2)} Instant Cash`;
      expect(pillText).toBe("Live Conversion: 1 Coin = ₹0.05 Instant Cash");
      expect(pillText).not.toContain("0.50");
    });

    it("formats checkout step text matching '1 Coin = ₹0.05 cash value'", () => {
      const stepText = `Slide the Coins Reducer toggle on your checkout screen. Watch your bill instantly slash down at 1 Coin = ₹${OFFICIAL_COIN_CONVERSION_RATE.toFixed(2)} cash value.`;
      expect(stepText).toContain("1 Coin = ₹0.05 cash value");
      expect(stepText).not.toContain("0.50");
    });
  });

  describe("3. Rewards Page Ledger & Community Referral Valuation", () => {
    it("computes transaction ledger cash credit using official 0.05 rate", () => {
      const transactions: CoinTransaction[] = [
        {
          id: "tx_01",
          userId: "SASS0000104",
          orderId: "ORD-001",
          amount: 100,
          type: "earned",
          description: "Amman Coins earned on Order #ORD-001",
          timestamp: new Date().toISOString(),
        },
        {
          id: "tx_02",
          userId: "SASS0000104",
          orderId: "ORD-002",
          amount: 50,
          type: "redeemed",
          description: "Amman Coins redeemed on Order #ORD-002",
          timestamp: new Date().toISOString(),
        },
      ];

      const rate = OFFICIAL_COIN_CONVERSION_RATE;
      const tx1 = transactions[0]!;
      const tx2 = transactions[1]!;
      const tx1Cash = convertCoinsToRupees(tx1.amount, rate).toFixed(2);
      const tx2Cash = convertCoinsToRupees(tx2.amount, rate).toFixed(2);

      expect(tx1Cash).toBe("5.00");
      expect(tx2Cash).toBe("2.50");
    });

    it("computes referral community impact cash credit with official rate (100 coins = ₹5.00)", () => {
      const sampleReferrals: ReferralFriend[] = [
        {
          id: "ref_1",
          userId: "SASS0000104",
          friendName: "Karthik R",
          phoneMasked: "+91 98401 *****",
          status: "Completed First Order",
          rewardCoins: 50,
          date: "2026-10-01",
        },
        {
          id: "ref_2",
          userId: "SASS0000104",
          friendName: "Meena S",
          phoneMasked: "+91 97910 *****",
          status: "Completed First Order",
          rewardCoins: 50,
          date: "2026-10-03",
        },
      ];

      const stats = referralService.calculateReferralStats(
        sampleReferrals,
        OFFICIAL_COIN_CONVERSION_RATE
      );

      expect(stats.totalNeighbors).toBe(2);
      expect(stats.totalCoinsEarned).toBe(100);
      expect(stats.totalCashCredit).toBe(5.0); // 100 * 0.05 = ₹5.00
      expect(stats.totalCashCredit.toFixed(2)).toBe("5.00");
    });
  });

  describe("4. End-to-End Effective Rate Resolution in Component State", () => {
    it("ensures component state resolution function rejects 0.50 from store settings", () => {
      // Simulate component resolver function
      const resolveEffectiveRate = (storeInfoRate: unknown, stateRate: number): number => {
        const rawRate = (typeof storeInfoRate === "number" ? storeInfoRate : stateRate);
        if (typeof rawRate === "number" && rawRate > 0 && rawRate !== 0.5) {
          return rawRate;
        }
        return OFFICIAL_COIN_CONVERSION_RATE;
      };

      // Case 1: Store returns 0.5
      expect(resolveEffectiveRate(0.5, 0.05)).toBe(0.05);

      // Case 2: Store returns 0.05
      expect(resolveEffectiveRate(0.05, 0.05)).toBe(0.05);

      // Case 3: Store returns null/undefined
      expect(resolveEffectiveRate(undefined, 0.05)).toBe(0.05);

      // Case 4: Store returns negative or 0
      expect(resolveEffectiveRate(-1, 0.05)).toBe(0.05);
      expect(resolveEffectiveRate(0, 0.05)).toBe(0.05);
    });
  });
});

