import { describe, it, expect } from "vitest";
import { coinService } from "../services/coinService";
import type { Order } from "../types";

describe("VIP 30-Day Rolling Window Calculation", () => {
  const now = new Date();
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();

  it("calculates VIP as true when recent delivered orders >= ₹5,000", () => {
    const orders: Order[] = [
      {
        id: "ORD-01",
        orderId: "ORD-01",
        userId: "USER1",
        customerName: "Test",
        phone: "9999999999",
        status: "delivered",
        createdAt: fiveDaysAgo,
        deliveryAddress: { houseNo: "1", street: "S", city: "C", pincode: "600000" },
        delivery: { type: "standard", slot: "Morning" },
        payment: { method: "online", status: "paid" },
        items: [],
        pricingSummary: { subtotal: 3000, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 3000 },
      },
      {
        id: "ORD-02",
        orderId: "ORD-02",
        userId: "USER1",
        customerName: "Test",
        phone: "9999999999",
        status: "delivered",
        createdAt: fiveDaysAgo,
        deliveryAddress: { houseNo: "1", street: "S", city: "C", pincode: "600000" },
        delivery: { type: "standard", slot: "Morning" },
        payment: { method: "online", status: "paid" },
        items: [],
        pricingSummary: { subtotal: 2500, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 2500 },
      },
    ];

    const result = coinService.calculateVIPStatus(orders, 5000);
    expect(result.isVIP).toBe(true);
    expect(result.rollingSpend).toBe(5500);
    expect(result.percentage).toBe(100);
  });

  it("ignores delivered orders that occurred older than 30 rolling calendar days", () => {
    const orders: Order[] = [
      {
        id: "ORD-03",
        orderId: "ORD-03",
        userId: "USER1",
        customerName: "Test",
        phone: "9999999999",
        status: "delivered",
        createdAt: fortyDaysAgo, // Expired beyond 30 days
        deliveryAddress: { houseNo: "1", street: "S", city: "C", pincode: "600000" },
        delivery: { type: "standard", slot: "Morning" },
        payment: { method: "online", status: "paid" },
        items: [],
        pricingSummary: { subtotal: 6000, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 6000 },
      },
      {
        id: "ORD-04",
        orderId: "ORD-04",
        userId: "USER1",
        customerName: "Test",
        phone: "9999999999",
        status: "delivered",
        createdAt: fiveDaysAgo,
        deliveryAddress: { houseNo: "1", street: "S", city: "C", pincode: "600000" },
        delivery: { type: "standard", slot: "Morning" },
        payment: { method: "online", status: "paid" },
        items: [],
        pricingSummary: { subtotal: 2000, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 2000 },
      },
    ];

    const result = coinService.calculateVIPStatus(orders, 5000);
    expect(result.isVIP).toBe(false);
    expect(result.rollingSpend).toBe(2000);
    expect(result.percentage).toBe(40);
  });

  it("strictly ignores pending, processing, or cancelled orders from spend tally", () => {
    const orders: Order[] = [
      {
        id: "ORD-05",
        orderId: "ORD-05",
        userId: "USER1",
        customerName: "Test",
        phone: "9999999999",
        status: "processing", // Not delivered yet!
        createdAt: fiveDaysAgo,
        deliveryAddress: { houseNo: "1", street: "S", city: "C", pincode: "600000" },
        delivery: { type: "standard", slot: "Morning" },
        payment: { method: "online", status: "paid" },
        items: [],
        pricingSummary: { subtotal: 5000, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 5000 },
      },
    ];

    const result = coinService.calculateVIPStatus(orders, 5000);
    expect(result.isVIP).toBe(false);
    expect(result.rollingSpend).toBe(0);
  });
});

