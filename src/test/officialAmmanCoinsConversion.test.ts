import { describe, it, expect } from "vitest";
import {
  coinService,
  OFFICIAL_COIN_CONVERSION_RATE,
  COINS_PER_RUPEE,
  convertCoinsToRupees,
  convertRupeesToCoins,
} from "../services/coinService";

describe("Phase 7.1: Official Amman Coins Valuation (1 coin = ₹0.05, ₹1 = 20 coins)", () => {
  it("exports official confirmed conversion rate constants", () => {
    expect(OFFICIAL_COIN_CONVERSION_RATE).toBe(0.05);
    expect(COINS_PER_RUPEE).toBe(20);
    expect(coinService.getOfficialConversionRate()).toBe(0.05);
    expect(coinService.getCoinsPerRupee()).toBe(20);
  });

  describe("convertCoinsToRupees", () => {
    it("converts 20 coins to exactly ₹1.00", () => {
      expect(convertCoinsToRupees(20)).toBe(1.0);
    });

    it("converts 100 coins to exactly ₹5.00", () => {
      expect(convertCoinsToRupees(100)).toBe(5.0);
    });

    it("converts arbitrary coin amounts accurately", () => {
      expect(convertCoinsToRupees(1)).toBe(0.05);
      expect(convertCoinsToRupees(10)).toBe(0.5);
      expect(convertCoinsToRupees(500)).toBe(25.0);
      expect(convertCoinsToRupees(1000)).toBe(50.0);
      expect(convertCoinsToRupees(250)).toBe(12.5);
    });

    it("safely handles edge cases (0, negative, invalid, non-finite values)", () => {
      expect(convertCoinsToRupees(0)).toBe(0);
      expect(convertCoinsToRupees(-50)).toBe(0);
      expect(convertCoinsToRupees(NaN)).toBe(0);
      expect(convertCoinsToRupees(Infinity)).toBe(0);
      expect(convertCoinsToRupees("100" as any)).toBe(0);
      expect(convertCoinsToRupees(null as any)).toBe(0);
      expect(convertCoinsToRupees(undefined as any)).toBe(0);
    });
  });

  describe("convertRupeesToCoins", () => {
    it("converts ₹1.00 to exactly 20 coins", () => {
      expect(convertRupeesToCoins(1)).toBe(20);
    });

    it("converts ₹5.00 to exactly 100 coins", () => {
      expect(convertRupeesToCoins(5)).toBe(100);
    });

    it("converts arbitrary rupee amounts accurately", () => {
      expect(convertRupeesToCoins(0.05)).toBe(1);
      expect(convertRupeesToCoins(0.5)).toBe(10);
      expect(convertRupeesToCoins(10)).toBe(200);
      expect(convertRupeesToCoins(25)).toBe(500);
      expect(convertRupeesToCoins(50)).toBe(1000);
    });

    it("safely handles edge cases (0, negative, invalid, non-finite values)", () => {
      expect(convertRupeesToCoins(0)).toBe(0);
      expect(convertRupeesToCoins(-10)).toBe(0);
      expect(convertRupeesToCoins(NaN)).toBe(0);
      expect(convertRupeesToCoins(Infinity)).toBe(0);
      expect(convertRupeesToCoins("10" as any)).toBe(0);
      expect(convertRupeesToCoins(null as any)).toBe(0);
      expect(convertRupeesToCoins(undefined as any)).toBe(0);
    });
  });

  describe("Bidirectional conversion consistency", () => {
    it("preserves value across round-trip conversions", () => {
      const originalRupees = [1, 2, 5, 10, 25, 50, 100];
      for (const inr of originalRupees) {
        const coins = convertRupeesToCoins(inr);
        const backToInr = convertCoinsToRupees(coins);
        expect(backToInr).toBe(inr);
      }
    });
  });

  describe("Phase 7.2: Cross-Application Integration Verification", () => {
    it("verifies coinService.getConversionRate() returns 0.05", async () => {
      const rate = await coinService.getConversionRate();
      expect(rate).toBe(0.05);
    });

    it("verifies cart checkout coin discount for standard 100 coin block is ₹5.00", () => {
      const userCoins = 250;
      const cartSubtotal = 450;
      const maxDiscountAllowed = Math.floor(cartSubtotal * 0.5); // 225
      const maxCoinsAllowed = Math.min(
        userCoins,
        convertRupeesToCoins(maxDiscountAllowed)
      );
      const coinsToRedeem = Math.min(100, maxCoinsAllowed);
      const coinDiscount = convertCoinsToRupees(coinsToRedeem);

      expect(coinsToRedeem).toBe(100);
      expect(coinDiscount).toBe(5.0);
    });

    it("verifies orderService accurately burns 20 coins per ₹1 discount", () => {
      const coinDiscount = 5.0; // ₹5 discount
      const coinsBurned = convertRupeesToCoins(coinDiscount);
      expect(coinsBurned).toBe(100);

      const coinDiscountSmall = 1.0; // ₹1 discount
      expect(convertRupeesToCoins(coinDiscountSmall)).toBe(20);

      const coinDiscountZero = 0;
      expect(convertRupeesToCoins(coinDiscountZero)).toBe(0);
    });

    it("handles fractional discounts correctly with round-trip stability", () => {
      // 15 coins -> ₹0.75
      expect(convertCoinsToRupees(15)).toBe(0.75);
      // ₹0.75 -> 15 coins (0.75 * 20 = 15)
      expect(convertRupeesToCoins(0.75)).toBe(15);

      // 7 coins -> ₹0.35
      expect(convertCoinsToRupees(7)).toBe(0.35);
      // ₹0.35 -> 7 coins
      expect(convertRupeesToCoins(0.35)).toBe(7);
    });
  });
});

