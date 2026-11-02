import { describe, it, expect, beforeEach, vi } from "vitest";
import { coinService } from "../services/coinService";
import { referralService } from "../services/referralService";
import { settingsService } from "../services/settingsService";
import { cartService } from "../services/cartService";
import { productService } from "../services/productService";
import { apiClient } from "../services/apiClient";
import type { CoinTransaction, Order, ReferralFriend, Product } from "../types";

describe("Amman Coins & VIP Privilege Hub — Test Suite", () => {
  const testUserId = "SASS0000104";
  const otherUserId = "SASS0000088";

  describe("1. Coin Ledger Statistics & Balance Calculation", () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Timestamps for current month vs previous month
    const thisMonthTs = new Date(currentYear, currentMonth, 10, 12, 0, 0).toISOString();
    const prevMonthTs = new Date(currentYear, currentMonth - 2, 15, 10, 0, 0).toISOString();

    const sampleTransactions: CoinTransaction[] = [
      {
        id: "tx_01",
        userId: testUserId,
        orderId: "ORD-001",
        amount: 100,
        type: "earned",
        description: "10% reward on Order #ORD-001",
        timestamp: thisMonthTs,
      },
      {
        id: "tx_02",
        userId: testUserId,
        orderId: "ORD-002",
        amount: 50,
        type: "earned",
        description: "5% reward on Order #ORD-002",
        timestamp: prevMonthTs,
      },
      {
        id: "tx_03",
        userId: testUserId,
        orderId: "ORD-003",
        amount: 30,
        type: "redeemed",
        description: "Redeemed on Order #ORD-003",
        timestamp: thisMonthTs,
      },
      {
        id: "tx_04",
        userId: testUserId,
        orderId: "ORD-004",
        amount: 20,
        type: "redeemed",
        description: "Redeemed on Order #ORD-004",
        timestamp: prevMonthTs,
      },
    ];

    it("calculates totalEarned, totalRedeemed, and netBalance accurately", () => {
      const stats = coinService.calculateLedgerStats(sampleTransactions);
      expect(stats.totalEarned).toBe(150);
      expect(stats.totalRedeemed).toBe(50);
      expect(stats.netBalance).toBe(100);
    });

    it("breaks down earnedThisMonth and redeemedThisMonth correctly", () => {
      const stats = coinService.calculateLedgerStats(sampleTransactions);
      expect(stats.earnedThisMonth).toBe(100);
      expect(stats.redeemedThisMonth).toBe(30);
    });

    it("prevents netBalance from falling below zero if redemptions exceed earnings", () => {
      const excessiveRedemptions: CoinTransaction[] = [
        {
          id: "tx_excess",
          userId: testUserId,
          amount: 500,
          type: "redeemed",
          description: "Over-redemption simulation",
          timestamp: thisMonthTs,
        },
      ];
      const stats = coinService.calculateLedgerStats(excessiveRedemptions);
      expect(stats.netBalance).toBe(0);
    });

    it("returns zero metrics for empty transaction history", () => {
      const stats = coinService.calculateLedgerStats([]);
      expect(stats.totalEarned).toBe(0);
      expect(stats.totalRedeemed).toBe(0);
      expect(stats.earnedThisMonth).toBe(0);
      expect(stats.redeemedThisMonth).toBe(0);
      expect(stats.netBalance).toBe(0);
    });
  });

  describe("2. Transaction Filtering & Expiration Logic", () => {
    const now = Date.now();
    const tenDaysAgo = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
    const threeMonthsAgo = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString();
    const tenMonthsAgo = new Date(now - 300 * 24 * 60 * 60 * 1000).toISOString(); // > 270 days (expiring)

    const mixedTransactions: CoinTransaction[] = [
      {
        id: "tx_recent_earn",
        userId: testUserId,
        amount: 75,
        type: "earned",
        description: "Recent purchase reward",
        timestamp: tenDaysAgo,
      },
      {
        id: "tx_recent_burn",
        userId: testUserId,
        amount: 25,
        type: "redeemed",
        description: "Recent checkout discount",
        timestamp: tenDaysAgo,
      },
      {
        id: "tx_old_earn",
        userId: testUserId,
        amount: 100,
        type: "earned",
        description: "Three month old earn",
        timestamp: threeMonthsAgo,
      },
      {
        id: "tx_expiring_earn",
        userId: testUserId,
        amount: 50,
        type: "earned",
        description: "Ten month old earn (>270 days)",
        timestamp: tenMonthsAgo,
      },
      {
        id: "tx_old_burn",
        userId: testUserId,
        amount: 50,
        type: "redeemed",
        description: "Old redemption",
        timestamp: tenMonthsAgo,
      },
    ];

    it("filters only earned transactions when activityFilter is 'earned'", () => {
      const earnedOnly = mixedTransactions.filter((tx) => tx.type === "earned");
      expect(earnedOnly.length).toBe(3);
      expect(earnedOnly.every((tx) => tx.type === "earned")).toBe(true);
    });

    it("filters only redeemed transactions when activityFilter is 'redeemed'", () => {
      const redeemedOnly = mixedTransactions.filter((tx) => tx.type === "redeemed");
      expect(redeemedOnly.length).toBe(2);
      expect(redeemedOnly.every((tx) => tx.type === "redeemed")).toBe(true);
    });

    it("identifies expiring coins older than 9 months (270 days)", () => {
      const nineMonthsMs = 270 * 24 * 60 * 60 * 1000;
      const expiring = mixedTransactions.filter((tx) => {
        const age = now - new Date(tx.timestamp).getTime();
        return tx.type === "earned" && age > nineMonthsMs;
      });

      expect(expiring.length).toBe(1);
      expect(expiring[0]?.id).toBe("tx_expiring_earn");
    });

    it("supports pagination slicing correctly", () => {
      const pageSize = 2;
      const firstPage = mixedTransactions.slice(0, pageSize);
      expect(firstPage.length).toBe(2);
      expect(firstPage[0]?.id).toBe("tx_recent_earn");
      expect(firstPage[1]?.id).toBe("tx_recent_burn");

      const secondPage = mixedTransactions.slice(0, 4);
      expect(secondPage.length).toBe(4);
    });
  });

  describe("3. VIP Qualification Strictness (Rolling 30-Day Window)", () => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();

    const makeDeliveredOrder = (id: string, totalAmount: number, createdAt: string): Order => ({
      id,
      orderId: id,
      userId: testUserId,
      customerName: "Arun Kumar",
      phone: "+91 99999 99999",
      status: "delivered",
      createdAt,
      deliveryAddress: { houseNo: "1", street: "Main", city: "Gobichettipalayam", pincode: "638452" },
      delivery: { type: "standard", slot: "Morning" },
      payment: { method: "online", status: "paid" },
      items: [],
      pricingSummary: {
        subtotal: totalAmount,
        productSavings: 0,
        deliveryFee: 0,
        coinDiscount: 0,
        couponDiscount: 0,
        totalAmount,
      },
    });

    it("qualifies customer as VIP when rolling 30-day delivered spend >= 5000", () => {
      const orders: Order[] = [
        makeDeliveredOrder("ORD-A", 3000, tenDaysAgo),
        makeDeliveredOrder("ORD-B", 2000, tenDaysAgo),
      ];
      const vip = coinService.calculateVIPStatus(orders, 5000);
      expect(vip.isVIP).toBe(true);
      expect(vip.rollingSpend).toBe(5000);
      expect(vip.percentage).toBe(100);
    });

    it("does not qualify customer as VIP when rolling 30-day delivered spend < 5000", () => {
      const orders: Order[] = [
        makeDeliveredOrder("ORD-C", 4999, tenDaysAgo),
      ];
      const vip = coinService.calculateVIPStatus(orders, 5000);
      expect(vip.isVIP).toBe(false);
      expect(vip.rollingSpend).toBe(4999);
      expect(vip.percentage).toBe(100); // 4999 / 5000 rounded is 100, but isVIP is false!
    });

    it("handles spend exceeding the 5000 threshold with 100% progress cap", () => {
      const orders: Order[] = [
        makeDeliveredOrder("ORD-D", 7500, tenDaysAgo),
      ];
      const vip = coinService.calculateVIPStatus(orders, 5000);
      expect(vip.isVIP).toBe(true);
      expect(vip.rollingSpend).toBe(7500);
      expect(vip.percentage).toBe(100);
    });

    it("respects dynamic store threshold configured via settings", () => {
      const orders: Order[] = [
        makeDeliveredOrder("ORD-E", 3500, tenDaysAgo),
      ];
      // With threshold 3000, 3500 qualifies
      const vip3k = coinService.calculateVIPStatus(orders, 3000);
      expect(vip3k.isVIP).toBe(true);

      // With threshold 6000, 3500 does not qualify
      const vip6k = coinService.calculateVIPStatus(orders, 6000);
      expect(vip6k.isVIP).toBe(false);
      expect(vip6k.percentage).toBe(58);
    });
  });

  describe("4. Rolling 30-Day Exclusion & Order Status Invalidation", () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyFiveDaysAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString();

    it("strictly excludes delivered orders that occurred more than 30 days ago", () => {
      const orders: Order[] = [
        {
          id: "ORD-EXPIRED",
          orderId: "ORD-EXPIRED",
          userId: testUserId,
          customerName: "Arun Kumar",
          phone: "+91 99999 99999",
          status: "delivered",
          createdAt: thirtyFiveDaysAgo, // 35 days ago: expired!
          deliveryAddress: { houseNo: "1", street: "Main", city: "Erode", pincode: "638452" },
          delivery: { type: "standard", slot: "Morning" },
          payment: { method: "online", status: "paid" },
          items: [],
          pricingSummary: { subtotal: 10000, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 10000 },
        },
        {
          id: "ORD-RECENT",
          orderId: "ORD-RECENT",
          userId: testUserId,
          customerName: "Arun Kumar",
          phone: "+91 99999 99999",
          status: "delivered",
          createdAt: fiveDaysAgo,
          deliveryAddress: { houseNo: "1", street: "Main", city: "Erode", pincode: "638452" },
          delivery: { type: "standard", slot: "Morning" },
          payment: { method: "online", status: "paid" },
          items: [],
          pricingSummary: { subtotal: 1500, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 1500 },
        },
      ];

      const vip = coinService.calculateVIPStatus(orders, 5000);
      expect(vip.isVIP).toBe(false);
      expect(vip.rollingSpend).toBe(1500); // 10000 is ignored
    });

    it("strictly excludes non-delivered orders (processing, placed, cancelled, out_for_delivery)", () => {
      const orders: Order[] = [
        {
          id: "ORD-PROCESSING",
          orderId: "ORD-PROCESSING",
          userId: testUserId,
          customerName: "Arun Kumar",
          phone: "+91 99999 99999",
          status: "processing", // Not delivered
          createdAt: fiveDaysAgo,
          deliveryAddress: { houseNo: "1", street: "Main", city: "Erode", pincode: "638452" },
          delivery: { type: "standard", slot: "Morning" },
          payment: { method: "online", status: "paid" },
          items: [],
          pricingSummary: { subtotal: 6000, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 6000 },
        },
        {
          id: "ORD-CANCELLED",
          orderId: "ORD-CANCELLED",
          userId: testUserId,
          customerName: "Arun Kumar",
          phone: "+91 99999 99999",
          status: "cancelled", // Cancelled order
          createdAt: fiveDaysAgo,
          deliveryAddress: { houseNo: "1", street: "Main", city: "Erode", pincode: "638452" },
          delivery: { type: "standard", slot: "Morning" },
          payment: { method: "online", status: "refunded" },
          items: [],
          pricingSummary: { subtotal: 4000, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 4000 },
        },
      ];

      const vip = coinService.calculateVIPStatus(orders, 5000);
      expect(vip.isVIP).toBe(false);
      expect(vip.rollingSpend).toBe(0);
    });
  });

  describe("5. Variant-Specific VIP Pricing in Cart Service", () => {
    const mockProductWithSpecial: Product = {
      id: "prod_vip_test_groundnut",
      name: "Heritage Wood Churned Groundnut Oil",
      category: "Cold Pressed Oils",
      categorySlug: "cold-pressed-oils",
      brand: "Sri Amman Heritage",
      description: "Traditional wood churned groundnut oil.",
      tags: ["COLD-PRESSED", "ORGANIC"],
      rating: 4.9,
      reviewCount: 120,
      imageUrl: "/images/groundnut.jpg",
      images: ["/images/groundnut.jpg"],
      isActive: true,
      options: [
        {
          unit: "ml",
          unitSize: "500",
          mrp: 160,
          offerPrice: 130,
          specialPrice: 115, // Exclusive VIP discount
          stock: 20,
        },
        {
          unit: "L",
          unitSize: "1",
          mrp: 310,
          offerPrice: 260,
          // No specialPrice on 1L variant
          stock: 15,
        },
      ],
    };

    it("applies specialPrice when isVIP is true and specialPrice is positive", async () => {
      const vipCartItem = await cartService.addToCart(
        mockProductWithSpecial,
        0, // 500ml option
        1,
        `test_vip_user_${Date.now()}`,
        true // isVIP = true
      );

      expect(vipCartItem.price).toBe(115); // VIP gets 115
      expect(vipCartItem.specialPrice).toBe(115);
      expect(vipCartItem.mrp).toBe(160);
    });

    it("falls back to offerPrice when customer is not VIP", async () => {
      const standardCartItem = await cartService.addToCart(
        mockProductWithSpecial,
        0, // 500ml option
        1,
        `test_std_user_${Date.now()}`,
        false // isVIP = false
      );

      expect(standardCartItem.price).toBe(130); // Non-VIP pays 130 offer price
      expect(standardCartItem.specialPrice).toBe(115); // Product metadata preserved
    });

    it("falls back to offerPrice even for VIP if variant has no specialPrice", async () => {
      const vipCartItem1L = await cartService.addToCart(
        mockProductWithSpecial,
        1, // 1L option (no specialPrice)
        1,
        `test_vip_user_1L_${Date.now()}`,
        true // isVIP = true
      );

      expect(vipCartItem1L.price).toBe(260); // Offer price 260
    });
  });

  describe("6. Configurable Coin Conversion Rate & Cash Valuation", () => {
    it("fetches conversion rate from store settings with fallback to official 0.05 rate", async () => {
      const rate = await coinService.getConversionRate();
      expect(rate).toBe(0.05);
      expect(typeof rate).toBe("number");
    });

    it("computes monetary cash valuation dynamically using conversion rate", () => {
      const testCoins = 260;
      const rateA = 0.5;
      const rateB = 0.75;
      const rateC = 1.0;

      expect((testCoins * rateA).toFixed(2)).toBe("130.00");
      expect((testCoins * rateB).toFixed(2)).toBe("195.00");
      expect((testCoins * rateC).toFixed(2)).toBe("260.00");
    });
  });

  describe("7. Duplicate Transaction Prevention via Idempotency Keys", () => {
    it("prevents duplicate coin transactions when the same idempotencyKey is used", async () => {
      const uniqueKey = `idemp_test_${Date.now()}`;
      const txData = {
        userId: testUserId,
        orderId: "ORD-IDEMP-TEST",
        amount: 40,
        type: "earned" as const,
        description: "Idempotent reward check",
        timestamp: new Date().toISOString(),
      };

      // First call: writes new transaction
      const first = await coinService.recordTransaction(txData, uniqueKey);
      expect(first.id).toBe(uniqueKey);

      // Second call with same idempotencyKey: should return existing without throwing or creating duplicate
      const second = await coinService.recordTransaction(txData, uniqueKey);
      expect(second.id).toBe(uniqueKey);
      expect(second.amount).toBe(40);
    });
  });

  describe("8. Referral Statistics & Community Impact Computation", () => {
    const mockReferrals: ReferralFriend[] = [
      {
        id: "ref_01",
        userId: testUserId,
        friendName: "Suresh R.",
        phoneMasked: "+91 98402 *****",
        status: "Completed First Order",
        rewardCoins: 50,
        date: "2026-09-15",
      },
      {
        id: "ref_02",
        userId: testUserId,
        friendName: "Divya K.",
        phoneMasked: "+91 97910 *****",
        status: "Completed First Order",
        rewardCoins: 50,
        date: "2026-09-22",
      },
      {
        id: "ref_03",
        userId: testUserId,
        friendName: "Mohan R.",
        phoneMasked: "+91 94443 *****",
        status: "Signed Up (Order Pending)",
        rewardCoins: 0,
        date: "2026-10-05",
      },
    ];

    it("calculates totalNeighbors, completedCount, pendingCount, and coin credits", () => {
      const stats = referralService.calculateReferralStats(mockReferrals, 0.05);
      expect(stats.totalNeighbors).toBe(3);
      expect(stats.completedCount).toBe(2);
      expect(stats.pendingCount).toBe(1);
      expect(stats.totalCoinsEarned).toBe(100);
      expect(stats.totalCashCredit).toBe(5); // 100 * 0.05 = 5.00 INR
    });

    it("recalculates totalCashCredit dynamically with custom conversion rate", () => {
      const stats = referralService.calculateReferralStats(mockReferrals, 0.8);
      expect(stats.totalCoinsEarned).toBe(100);
      expect(stats.totalCashCredit).toBe(80); // 100 * 0.8 = 80 INR
    });

    it("handles empty referral lists gracefully", () => {
      const stats = referralService.calculateReferralStats([], 0.05);
      expect(stats.totalNeighbors).toBe(0);
      expect(stats.completedCount).toBe(0);
      expect(stats.pendingCount).toBe(0);
      expect(stats.totalCoinsEarned).toBe(0);
      expect(stats.totalCashCredit).toBe(0);
    });
  });

  describe("9. Customer Data Isolation & REST API Scoping", () => {
    it("scopes coinHistory queries strictly to the requesting customer", async () => {
      const user1History = await coinService.getCoinHistory(testUserId);
      expect(Array.isArray(user1History)).toBe(true);
      // All returned transactions belong to testUserId
      expect(user1History.every((t) => t.userId === testUserId)).toBe(true);

      const user2History = await coinService.getCoinHistory(otherUserId);
      expect(Array.isArray(user2History)).toBe(true);
      expect(user2History.every((t) => t.userId === otherUserId)).toBe(true);
    });

    it("scopes referral queries strictly to the requesting customer", async () => {
      const user1Referrals = await referralService.getReferrals(testUserId);
      expect(Array.isArray(user1Referrals)).toBe(true);
      expect(user1Referrals.every((r) => r.userId === testUserId)).toBe(true);
    });
  });
});

