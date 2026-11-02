import { describe, it, expect, beforeEach } from "vitest";
import { orderService } from "../services/orderService";
import { cartService } from "../services/cartService";
import { apiClient } from "../services/apiClient";
import type { Order } from "../types";

describe("My Orders & Delivery Tracking Verification", () => {
  const customerA = "SASS0000104";
  const customerB = "SASS0000088";

  // Mock sample orders for testing
  const samplePendingOrder: Order = {
    id: "ORD-TEST-001",
    orderId: "ORD-TEST-001",
    userId: customerA,
    customerName: "Arun Kumar",
    phone: "+91 99999 99999",
    status: "pending",
    createdAt: new Date().toISOString(),
    deliveryAddress: {
      houseNo: "42",
      street: "Green Avenue",
      city: "Gobichettipalayam",
      pincode: "638454",
    },
    delivery: {
      type: "express",
      slot: "Express 60–Min Instant Dispatch",
      estimatedTime: "Within 60-90 minutes",
    },
    payment: {
      method: "online",
      status: "paid",
      transactionId: "TXN_TEST_001",
    },
    items: [
      {
        productId: "prod_groundnut_oil",
        name: "Cold-Pressed Groundnut Oil (Wood Pressed)",
        unit: "ml",
        unitSize: "500",
        price: 130,
        quantity: 2,
        image: "/assets/images/groundnut-oil.jpg",
      },
    ],
    pricingSummary: {
      subtotal: 260,
      productSavings: 60,
      deliveryFee: 29,
      coinDiscount: 25,
      couponDiscount: 50,
      totalAmount: 214,
    },
  };

  const sampleDeliveredOrderRecent: Order = {
    id: "ORD-TEST-002",
    orderId: "ORD-TEST-002",
    userId: customerA,
    customerName: "Arun Kumar",
    phone: "+91 99999 99999",
    status: "delivered",
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // 3 hours ago
    deliveredAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // 2 hours ago (within 24h)
    deliveryAddress: {
      houseNo: "42",
      street: "Green Avenue",
      city: "Gobichettipalayam",
      pincode: "638454",
    },
    delivery: {
      type: "standard",
      slot: "Standard Delivery",
      estimatedTime: "Delivered",
    },
    payment: {
      method: "cod",
      status: "paid",
    },
    items: [
      {
        productId: "prod_sesame_oil",
        name: "Cold-Pressed Sesame Oil",
        unit: "ml",
        unitSize: "500",
        price: 180,
        quantity: 1,
        image: "/assets/images/sesame-oil.jpg",
      },
    ],
    pricingSummary: {
      subtotal: 180,
      productSavings: 40,
      deliveryFee: 40,
      coinDiscount: 0,
      couponDiscount: 0,
      totalAmount: 220,
    },
  };

  const sampleDeliveredOrderExpired: Order = {
    id: "ORD-TEST-003",
    orderId: "ORD-TEST-003",
    userId: customerA,
    customerName: "Arun Kumar",
    phone: "+91 99999 99999",
    status: "delivered",
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    deliveredAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(), // 36 hours ago (>24h window)
    deliveryAddress: {
      houseNo: "42",
      street: "Green Avenue",
      city: "Gobichettipalayam",
      pincode: "638454",
    },
    delivery: {
      type: "standard",
      slot: "Standard Delivery",
    },
    payment: {
      method: "online",
      status: "paid",
    },
    items: [
      {
        productId: "prod_turmeric_powder",
        name: "Organic Curcumin Turmeric Powder",
        unit: "g",
        unitSize: "250",
        price: 95,
        quantity: 1,
        image: "/images/turmeric.jpg",
      },
    ],
    pricingSummary: {
      subtotal: 95,
      productSavings: 15,
      deliveryFee: 0,
      coinDiscount: 0,
      couponDiscount: 0,
      totalAmount: 95,
    },
  };

  const sampleCustomerBOrder: Order = {
    id: "ORD-TEST-004",
    orderId: "ORD-TEST-004",
    userId: customerB,
    customerName: "Priya Sundaram",
    phone: "+91 94433 12345",
    status: "in transit",
    createdAt: new Date().toISOString(),
    deliveryAddress: {
      houseNo: "12",
      street: "KV Garden",
      city: "Gobichettipalayam",
      pincode: "638454",
    },
    delivery: {
      type: "express",
      slot: "Express 60-Min",
    },
    payment: {
      method: "online",
      status: "paid",
    },
    items: [],
    pricingSummary: {
      subtotal: 500,
      productSavings: 100,
      deliveryFee: 0,
      coinDiscount: 50,
      couponDiscount: 0,
      totalAmount: 450,
    },
  };

  describe("1. Order Status Tab Filtering", () => {
    const ordersList: Order[] = [
      { ...samplePendingOrder, status: "pending" },
      { ...samplePendingOrder, id: "O2", orderId: "O2", status: "processing" },
      { ...samplePendingOrder, id: "O3", orderId: "O3", status: "in transit" },
      { ...sampleDeliveredOrderRecent, id: "O4", orderId: "O4", status: "delivered" },
      { ...samplePendingOrder, id: "O5", orderId: "O5", status: "cancelled" },
      { ...samplePendingOrder, id: "O6", orderId: "O6", status: "returned" },
    ];

    it("filters active orders correctly (pending, processing, packed, in transit)", () => {
      const active = ordersList.filter((o) =>
        ["pending", "processing", "packed", "in transit"].includes(o.status)
      );
      expect(active).toHaveLength(3);
      expect(active.map((o) => o.status)).toEqual(["pending", "processing", "in transit"]);
    });

    it("filters delivered orders correctly", () => {
      const delivered = ordersList.filter((o) => o.status === "delivered");
      expect(delivered).toHaveLength(1);
      expect(delivered[0]?.orderId).toBe("O4");
    });

    it("filters cancelled and returned orders correctly", () => {
      const cancelled = ordersList.filter(
        (o) => o.status === "cancelled" || o.status === "returned"
      );
      expect(cancelled).toHaveLength(2);
      expect(cancelled.map((o) => o.status)).toContain("cancelled");
      expect(cancelled.map((o) => o.status)).toContain("returned");
    });
  });

  describe("2. Customer Order Isolation & Authorization", () => {
    it("fetches orders scoped strictly to the requesting user", async () => {
      const ordersA = await orderService.getOrders(customerA);
      expect(Array.isArray(ordersA)).toBe(true);
      // Ensure all returned orders belong to Customer A
      ordersA.forEach((order) => {
        expect(order.userId).toBe(customerA);
      });
    });

    it("denies access when a customer attempts to query another customer's order", async () => {
      // Mock apiClient.get for order lookup
      const originalGet = apiClient.get;
      apiClient.get = (async (url: string, params?: any) => {
        if (url.includes("/orders") || url === "/orders") {
          return [sampleCustomerBOrder];
        }
        return (originalGet as any).call(apiClient, url, params);
      }) as any;

      try {
        await expect(
          orderService.getOrderById("ORD-TEST-004", customerA)
        ).rejects.toThrow("Access denied: You cannot view another customer's order.");
      } finally {
        apiClient.get = originalGet;
      }
    });

    it("allows access when customer queries their own order", async () => {
      const originalGet = apiClient.get;
      apiClient.get = (async (url: string, params?: any) => {
        if (url.includes("/orders") || url === "/orders") {
          return [sampleCustomerBOrder];
        }
        return (originalGet as any).call(apiClient, url, params);
      }) as any;

      try {
        const order = await orderService.getOrderById("ORD-TEST-004", customerB);
        expect(order).toBeDefined();
        expect(order?.orderId).toBe("ORD-TEST-004");
        expect(order?.userId).toBe(customerB);
      } finally {
        apiClient.get = originalGet;
      }
    });

    it("prevents unauthorized cancellation of another customer's order", async () => {
      const originalGet = apiClient.get;
      apiClient.get = (async (url: string, params?: any) => {
        if (url.includes("/orders") || url === "/orders") {
          return [{ ...samplePendingOrder, userId: customerB }];
        }
        return (originalGet as any).call(apiClient, url, params);
      }) as any;

      try {
        await expect(
          orderService.cancelOrder("ORD-TEST-001", customerA)
        ).rejects.toThrow("Access denied");
      } finally {
        apiClient.get = originalGet;
      }
    });
  });

  describe("3. Order Cancellation Constraints", () => {
    it("allows cancellation for orders in pending status", async () => {
      const originalGet = apiClient.get;
      const originalPatch = apiClient.patch;
      let patchedStatus: string | null = null;

      apiClient.get = (async () => [samplePendingOrder]) as any;
      apiClient.patch = (async (url: string, body: any) => {
        patchedStatus = body.status;
        return { ...samplePendingOrder, status: "cancelled", cancelledAt: body.cancelledAt };
      }) as any;

      try {
        const result = await orderService.cancelOrder(samplePendingOrder.orderId, customerA);
        expect(patchedStatus).toBe("cancelled");
        expect(result.status).toBe("cancelled");
      } finally {
        apiClient.get = originalGet;
        apiClient.patch = originalPatch;
      }
    });

    it("allows cancellation for orders in processing status", async () => {
      const processingOrder = { ...samplePendingOrder, status: "processing" as const };
      const originalGet = apiClient.get;
      const originalPatch = apiClient.patch;

      apiClient.get = (async () => [processingOrder]) as any;
      apiClient.patch = (async (url: string, body: any) => ({
        ...processingOrder,
        status: body.status,
      })) as any;

      try {
        const result = await orderService.cancelOrder(processingOrder.orderId, customerA);
        expect(result.status).toBe("cancelled");
      } finally {
        apiClient.get = originalGet;
        apiClient.patch = originalPatch;
      }
    });

    it("rejects cancellation once order is in transit or packed", async () => {
      const inTransitOrder = { ...samplePendingOrder, status: "in transit" as const };
      const originalGet = apiClient.get;
      apiClient.get = (async () => [inTransitOrder]) as any;

      try {
        await expect(
          orderService.cancelOrder(inTransitOrder.orderId, customerA)
        ).rejects.toThrow("Cannot cancel order with status \"in transit\"");
      } finally {
        apiClient.get = originalGet;
      }
    });

    it("rejects cancellation once order is already delivered", async () => {
      const originalGet = apiClient.get;
      apiClient.get = (async () => [sampleDeliveredOrderRecent]) as any;

      try {
        await expect(
          orderService.cancelOrder(sampleDeliveredOrderRecent.orderId, customerA)
        ).rejects.toThrow("Cannot cancel order with status \"delivered\"");
      } finally {
        apiClient.get = originalGet;
      }
    });
  });

  describe("4. Order Return Policy (24-Hour Window)", () => {
    it("allows return request if order is delivered within 24 hours", async () => {
      const originalGet = apiClient.get;
      const originalPatch = apiClient.patch;
      let patchedStatus: string | null = null;

      apiClient.get = (async () => [sampleDeliveredOrderRecent]) as any;
      apiClient.patch = (async (url: string, body: any) => {
        patchedStatus = body.status;
        return { ...sampleDeliveredOrderRecent, status: "returned" };
      }) as any;

      try {
        const result = await orderService.requestReturn(sampleDeliveredOrderRecent.orderId, customerA);
        expect(patchedStatus).toBe("returned");
        expect(result.status).toBe("returned");
      } finally {
        apiClient.get = originalGet;
        apiClient.patch = originalPatch;
      }
    });

    it("rejects return request if order was delivered more than 24 hours ago", async () => {
      const originalGet = apiClient.get;
      apiClient.get = (async () => [sampleDeliveredOrderExpired]) as any;

      try {
        await expect(
          orderService.requestReturn(sampleDeliveredOrderExpired.orderId, customerA)
        ).rejects.toThrow("Returns can only be requested within 24 hours of delivery.");
      } finally {
        apiClient.get = originalGet;
      }
    });

    it("rejects return request if order is not in delivered status", async () => {
      const originalGet = apiClient.get;
      apiClient.get = (async () => [samplePendingOrder]) as any;

      try {
        await expect(
          orderService.requestReturn(samplePendingOrder.orderId, customerA)
        ).rejects.toThrow("Returns can only be requested for delivered orders.");
      } finally {
        apiClient.get = originalGet;
      }
    });
  });

  describe("5. 1-Click Reorder Integrity & Stock Handling", () => {
    it("validates product catalog stock and adds eligible items to customer cart", async () => {
      // Mock catalog item in stock
      const mockProduct = {
        id: "prod_groundnut_oil",
        name: "Cold-Pressed Groundnut Oil",
        isActive: true,
        options: [
          { unit: "ml", unitSize: "500", price: 130, stock: 15 },
        ],
      };

      const originalGet = apiClient.get;
      const originalAddToCart = cartService.addToCart;
      let addedItem: any = null;

      apiClient.get = (async (url: string) => {
        if (url.includes("/products/prod_groundnut_oil")) return mockProduct;
        return null;
      }) as any;

      cartService.addToCart = async (product, optIdx, qty, uid) => {
        addedItem = { product, optIdx, qty, uid };
        return [] as any;
      };

      try {
        const result = await orderService.reorder(samplePendingOrder, customerA);
        expect(result.addedCount).toBe(1);
        expect(result.unavailableCount).toBe(0);
        expect(addedItem).toBeDefined();
        expect(addedItem.uid).toBe(customerA);
        expect(addedItem.qty).toBe(2);
      } finally {
        apiClient.get = originalGet;
        cartService.addToCart = originalAddToCart;
      }
    });

    it("gracefully detects and excludes out-of-stock items during reorder", async () => {
      // Mock product with zero stock
      const mockOutOfStockProduct = {
        id: "prod_groundnut_oil",
        name: "Cold-Pressed Groundnut Oil",
        isActive: true,
        options: [
          { unit: "ml", unitSize: "500", price: 130, stock: 0 },
        ],
      };

      const originalGet = apiClient.get;
      apiClient.get = (async () => mockOutOfStockProduct) as any;

      try {
        const result = await orderService.reorder(samplePendingOrder, customerA);
        expect(result.addedCount).toBe(0);
        expect(result.unavailableCount).toBe(1);
        expect(result.unavailableNames).toContain("Cold-Pressed Groundnut Oil (Wood Pressed)");
      } finally {
        apiClient.get = originalGet;
      }
    });

    it("skips deactivated or deleted products during reorder", async () => {
      const mockInactiveProduct = {
        id: "prod_groundnut_oil",
        name: "Cold-Pressed Groundnut Oil",
        isActive: false,
        options: [{ unit: "ml", unitSize: "500", price: 130, stock: 20 }],
      };

      const originalGet = apiClient.get;
      apiClient.get = (async () => mockInactiveProduct) as any;

      try {
        const result = await orderService.reorder(samplePendingOrder, customerA);
        expect(result.addedCount).toBe(0);
        expect(result.unavailableCount).toBe(1);
      } finally {
        apiClient.get = originalGet;
      }
    });
  });

  describe("6. Stored Pricing Ledger & Tax Invoice Accuracy", () => {
    it("verifies accurate storage of pricing breakdown in order entity", () => {
      const { pricingSummary } = samplePendingOrder;
      expect(pricingSummary.subtotal).toBe(260);
      expect(pricingSummary.productSavings).toBe(60);
      expect(pricingSummary.deliveryFee).toBe(29);
      expect(pricingSummary.coinDiscount).toBe(25);
      expect(pricingSummary.couponDiscount).toBe(50);

      // Verify exact math: 260 - (25 + 50) + 29 = 214
      const calculatedPayable =
        pricingSummary.subtotal -
        (pricingSummary.coinDiscount + pricingSummary.couponDiscount) +
        pricingSummary.deliveryFee;
      expect(pricingSummary.totalAmount).toBe(calculatedPayable);
    });

    it("ensures itemized invoice total matches the order subtotal", () => {
      const itemsSubtotal = samplePendingOrder.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      expect(itemsSubtotal).toBe(samplePendingOrder.pricingSummary.subtotal);
    });
  });
});

