import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { orderService } from "../services/orderService";
import { authManager } from "../services/authAdapter";
import {
  productionOrderReader,
  setProductionOrderReaderOverride,
} from "../services/productionOrderReader";
import { reconcileCustomerOrders } from "../services/legacyOrderAdapter";
import { apiClient } from "../services/apiClient";
import { coinService } from "../services/coinService";
import { StorageAdapterError } from "../services/firestoreAdapter";
import type { Order } from "../types";

describe("Phase 4B-2A: Production Read-Only Orders Integration", () => {
  beforeEach(() => {
    authManager.resetMode();
    setProductionOrderReaderOverride(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    authManager.resetMode();
    setProductionOrderReaderOverride(null);
    vi.restoreAllMocks();
  });

  describe("1. Environment-Aware Service Routing", () => {
    it("routes getOrders to production reader when in production auth mode", async () => {
      authManager.setMode("production");
      expect(authManager.getMode()).toBe("production");

      const mockProdOrders: Order[] = [
        {
          id: "ORD-PROD-001",
          orderId: "ORD-PROD-001",
          userId: "SASS0000104",
          customerName: "Senthil Kumar",
          phone: "9876543210",
          status: "in transit",
          createdAt: "2026-10-20T10:00:00.000Z",
          deliveryAddress: {
            houseNo: "12",
            street: "Perundurai Road",
            city: "Gobichettipalayam",
            pincode: "638452",
          },
          delivery: { type: "standard", slot: "Morning 7AM - 9AM" },
          payment: { method: "online", status: "paid" },
          items: [
            {
              productId: "prod-wood-cold-oil",
              name: "Wood Pressed Groundnut Oil",
              quantity: 2,
              price: 320,
              unit: "L",
              unitSize: "1",
              image: "/images/products/groundnut-oil.jpg",
            },
          ],
          pricingSummary: {
            subtotal: 640,
            productSavings: 60,
            deliveryFee: 0,
            coinDiscount: 0,
            couponDiscount: 0,
            totalAmount: 640,
          },
        },
      ];

      const readerSpy = vi.fn().mockResolvedValue(mockProdOrders);
      setProductionOrderReaderOverride({
        getCustomerOrders: readerSpy,
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      const result = await orderService.getOrders("SASS0000104");

      expect(readerSpy).toHaveBeenCalledTimes(1);
      expect(readerSpy).toHaveBeenCalledWith("SASS0000104", undefined);
      expect(apiGetSpy).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]?.orderId).toBe("ORD-PROD-001");
      expect(result[0]?.status).toBe("in transit");
    });

    it("preserves local apiClient routing in emulator mode", async () => {
      authManager.setMode("emulator");
      expect(authManager.getMode()).toBe("emulator");

      const mockEmulatorOrders: Order[] = [
        {
          id: "ORD-EMU-123",
          orderId: "ORD-EMU-123",
          userId: "SASS0000104",
          customerName: "Emulator Customer",
          phone: "9999999999",
          status: "delivered",
          createdAt: "2026-10-18T10:00:00.000Z",
          deliveryAddress: {
            houseNo: "1",
            street: "Main St",
            city: "Gobichettipalayam",
            pincode: "638452",
          },
          delivery: { type: "standard", slot: "Morning" },
          payment: { method: "cod", status: "paid" },
          items: [],
          pricingSummary: {
            subtotal: 300,
            productSavings: 0,
            deliveryFee: 0,
            coinDiscount: 0,
            couponDiscount: 0,
            totalAmount: 300,
          },
        },
      ];

      const apiGetSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockEmulatorOrders);
      const prodSpy = vi.fn();
      setProductionOrderReaderOverride({ getCustomerOrders: prodSpy });

      const result = await orderService.getOrders("SASS0000104");

      expect(apiGetSpy).toHaveBeenCalledWith("/orders", { userId: "SASS0000104" });
      expect(prodSpy).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]?.orderId).toBe("ORD-EMU-123");
    });

    it("preserves local apiClient routing in mock mode", async () => {
      authManager.setMode("mock");
      expect(authManager.getMode()).toBe("mock");

      const apiGetSpy = vi.spyOn(apiClient, "get").mockResolvedValue([]);
      const prodSpy = vi.fn();
      setProductionOrderReaderOverride({ getCustomerOrders: prodSpy });

      const result = await orderService.getOrders("SASS0000104");

      expect(apiGetSpy).toHaveBeenCalledWith("/orders", { userId: "SASS0000104" });
      expect(prodSpy).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("2. Safety Guards: Missing Identity & Zero-Read Guarantees", () => {
    it("returns empty array immediately without issuing any query when userId is undefined", async () => {
      authManager.setMode("production");
      const prodSpy = vi.fn();
      setProductionOrderReaderOverride({ getCustomerOrders: prodSpy });
      const apiSpy = vi.spyOn(apiClient, "get");

      const result = await orderService.getOrders(undefined);

      expect(result).toEqual([]);
      expect(prodSpy).not.toHaveBeenCalled();
      expect(apiSpy).not.toHaveBeenCalled();
    });

    it("returns empty array immediately when userId is empty or whitespace", async () => {
      authManager.setMode("production");
      const prodSpy = vi.fn();
      setProductionOrderReaderOverride({ getCustomerOrders: prodSpy });
      const apiSpy = vi.spyOn(apiClient, "get");

      const result = await orderService.getOrders("   ");

      expect(result).toEqual([]);
      expect(prodSpy).not.toHaveBeenCalled();
      expect(apiSpy).not.toHaveBeenCalled();
    });

    it("returns null immediately from getOrderById when orderId is empty", async () => {
      authManager.setMode("production");
      const prodSpy = vi.fn();
      setProductionOrderReaderOverride({ getOrderById: prodSpy });

      const result = await orderService.getOrderById("", "SASS0000104");

      expect(result).toBeNull();
      expect(prodSpy).not.toHaveBeenCalled();
    });

    it("returns null immediately from getOrderById in production mode when userId is missing", async () => {
      authManager.setMode("production");
      const prodSpy = vi.fn();
      setProductionOrderReaderOverride({ getOrderById: prodSpy });

      const result = await orderService.getOrderById("ORD-123", undefined);

      expect(result).toBeNull();
      expect(prodSpy).not.toHaveBeenCalled();
    });

    it("assertValidCustomer in productionOrderReader rejects non-SASS identifiers", () => {
      expect(() => {
        productionOrderReader.assertValidCustomer("some-firebase-uid-123");
      }).toThrow(/Invalid customer identifier/);

      expect(() => {
        productionOrderReader.assertValidCustomer("");
      }).toThrow(/Invalid customer identifier/);
    });
  });

  describe("3. Production Read Error Propagation (Never Falls Back to Mock)", () => {
    it("rethrows production Firestore errors and never falls back to mock order data in getOrders", async () => {
      authManager.setMode("production");

      const prodError = new StorageAdapterError(
        "Firestore permission denied reading users/SASS0000104/orders",
        {
          status: 403,
          code: "permission-denied",
          category: "permission",
        }
      );

      setProductionOrderReaderOverride({
        getCustomerOrders: vi.fn().mockRejectedValue(prodError),
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      await expect(orderService.getOrders("SASS0000104")).rejects.toThrow(
        /permission denied/
      );

      // Verify that mock/apiClient fallback NEVER occurred
      expect(apiGetSpy).not.toHaveBeenCalled();
    });

    it("rethrows production Firestore errors in getOrderById", async () => {
      authManager.setMode("production");

      const prodError = new StorageAdapterError(
        "Connectivity timeout reaching production Firestore",
        {
          status: 503,
          code: "unavailable",
          category: "connectivity",
        }
      );

      setProductionOrderReaderOverride({
        getOrderById: vi.fn().mockRejectedValue(prodError),
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      await expect(
        orderService.getOrderById("ORD-123", "SASS0000104")
      ).rejects.toThrow(/Connectivity timeout/);

      expect(apiGetSpy).not.toHaveBeenCalled();
    });
  });

  describe("4. Duplicate Reconciliation & Operational Status Precedence", () => {
    it("reconciles top-level operational status update over nested order base data", () => {
      const nestedOrders: Record<string, unknown>[] = [
        {
          id: "ORD-991",
          orderId: "ORD-991",
          userId: "SASS0000104",
          customerName: "Senthil Kumar",
          phone: "9876543210",
          status: "pending",
          createdAt: "2026-10-20T08:00:00.000Z",
          items: [
            {
              productId: "oil-1",
              name: "Wood Pressed Sesame Oil",
              quantity: 1,
              price: 450,
              unit: "L",
              unitSize: 1,
            },
          ],
          pricingSummary: {
            subtotal: 450,
            productSavings: 0,
            deliveryFee: 0,
            coinDiscount: 0,
            couponDiscount: 0,
            totalAmount: 450,
          },
        },
      ];

      // Top-level document updated by Admin with operational status "out for delivery"
      const topLevelOrders: Record<string, unknown>[] = [
        {
          id: "ORD-991",
          orderId: "ORD-991",
          userId: "SASS0000104",
          operationalStatus: "out for delivery",
          delivery: {
            slot: "Express",
            driver: {
              name: "Murugan",
              phone: "9842100000",
            },
          },
        },
      ];

      const reconciled = (productionOrderReader as any).assertValidCustomer("SASS0000104");
      expect(reconciled).toBe("SASS0000104");

      // Verify legacyOrderAdapter's reconcileCustomerOrders behavior
      const orders = reconcileCustomerOrders({
        nestedOrders,
        topLevelOrders,
        userId: "SASS0000104",
      });

      expect(orders).toHaveLength(1);
      expect(orders[0]?.orderId).toBe("ORD-991");
      // Operational status from top takes precedence: "out for delivery" maps to "in transit"
      expect(orders[0]?.status).toBe("in transit");
      expect(orders[0]?.delivery?.driver?.name).toBe("Murugan");
      expect(orders[0]?.items).toHaveLength(1);
      expect(orders[0]?.pricingSummary.totalAmount).toBe(450);
    });

    it("ensures subcollection customer cancellation takes precedence over stale operational status", () => {
      const nestedOrders: Record<string, unknown>[] = [
        {
          id: "ORD-992",
          orderId: "ORD-992",
          userId: "SASS0000104",
          status: "cancelled",
          cancelledAt: "2026-10-20T09:30:00.000Z",
          createdAt: "2026-10-20T08:00:00.000Z",
          items: [],
          pricingSummary: { subtotal: 200, totalAmount: 200 },
        },
      ];

      // Stale top-level still says "processing"
      const topLevelOrders: Record<string, unknown>[] = [
        {
          id: "ORD-992",
          orderId: "ORD-992",
          userId: "SASS0000104",
          operationalStatus: "processing",
        },
      ];

      const orders = reconcileCustomerOrders({
        nestedOrders,
        topLevelOrders,
        userId: "SASS0000104",
      });

      expect(orders).toHaveLength(1);
      expect(orders[0]?.status).toBe("cancelled");
      expect(orders[0]?.cancelledAt).toBe("2026-10-20T09:30:00.000Z");
    });

    it("strictly discards orders belonging to Customer B when Customer A queries", () => {
      const nestedOrders: Record<string, unknown>[] = [];
      const topLevelOrders: Record<string, unknown>[] = [
        {
          id: "ORD-CUST-B",
          orderId: "ORD-CUST-B",
          userId: "SASS0000200", // Belongs to Customer B
          status: "delivered",
        },
        {
          id: "ORD-CUST-A",
          orderId: "ORD-CUST-A",
          userId: "SASS0000104", // Belongs to Customer A
          status: "delivered",
          createdAt: "2026-10-19T10:00:00.000Z",
          items: [],
          pricingSummary: { subtotal: 500, totalAmount: 500 },
        },
      ];

      const orders = reconcileCustomerOrders({
        nestedOrders,
        topLevelOrders,
        userId: "SASS0000104",
      });

      expect(orders).toHaveLength(1);
      expect(orders[0]?.orderId).toBe("ORD-CUST-A");
      expect(orders.some((o: Order) => o.orderId === "ORD-CUST-B")).toBe(false);
    });
  });

  describe("5. Account Dashboard Metrics with Production Orders", () => {
    it("accurately calculates lifetime spend, active orders, and VIP progress from production order data", async () => {
      const prodOrders: Order[] = [
        {
          id: "ORD-001",
          orderId: "ORD-001",
          userId: "SASS0000104",
          customerName: "Senthil Kumar",
          phone: "9876543210",
          status: "delivered",
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          deliveryAddress: {} as any,
          delivery: {} as any,
          payment: { method: "online", status: "paid" },
          items: [],
          pricingSummary: {
            subtotal: 3500,
            productSavings: 200,
            deliveryFee: 0,
            coinDiscount: 0,
            couponDiscount: 0,
            totalAmount: 3500,
          },
        },
        {
          id: "ORD-002",
          orderId: "ORD-002",
          userId: "SASS0000104",
          customerName: "Senthil Kumar",
          phone: "9876543210",
          status: "in transit", // Active order
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          deliveryAddress: {} as any,
          delivery: {} as any,
          payment: { method: "online", status: "paid" },
          items: [],
          pricingSummary: {
            subtotal: 2000,
            productSavings: 100,
            deliveryFee: 0,
            coinDiscount: 0,
            couponDiscount: 0,
            totalAmount: 2000,
          },
        },
        {
          id: "ORD-003",
          orderId: "ORD-003",
          userId: "SASS0000104",
          customerName: "Senthil Kumar",
          phone: "9876543210",
          status: "cancelled", // Cancelled order: excluded from lifetime spend
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          deliveryAddress: {} as any,
          delivery: {} as any,
          payment: { method: "cod", status: "cancelled" },
          items: [],
          pricingSummary: {
            subtotal: 1000,
            productSavings: 0,
            deliveryFee: 0,
            coinDiscount: 0,
            couponDiscount: 0,
            totalAmount: 1000,
          },
        },
      ];

      authManager.setMode("production");
      setProductionOrderReaderOverride({
        getCustomerOrders: vi.fn().mockResolvedValue(prodOrders),
      });

      const orders = await orderService.getOrders("SASS0000104");
      expect(orders).toHaveLength(3);

      // 1. Total order count
      expect(orders.length).toBe(3);

      // 2. Active orders count
      const activeCount = orders.filter((o) =>
        ["pending", "processing", "packed", "in transit"].includes(o.status)
      ).length;
      expect(activeCount).toBe(1);

      // 3. Lifetime spend calculation (excluding cancelled)
      const lifetimeSpend = orders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (o.pricingSummary?.totalAmount || 0), 0);
      expect(lifetimeSpend).toBe(3500 + 2000); // 5500

      // 4. VIP status calculation (>= ₹5,000 delivered orders in rolling 30 days)
      const vipStatus = coinService.calculateVIPStatus(orders, 5000);
      expect(vipStatus.rollingSpend).toBe(3500); // Delivered spend
      expect(vipStatus.threshold).toBe(5000);
      expect(vipStatus.percentage).toBe(70);
      expect(vipStatus.isVIP).toBe(false);
    });
  });

  describe("6. Active Production Order Operations", () => {
    it("does not throw read-only disabled error in createOrder in production mode", async () => {
      authManager.setMode("production");

      try {
        await orderService.createOrder({
          userId: "SASS0000104",
          customerName: "Senthil Kumar",
          phone: "9876543210",
          address: { latitude: 11.45, longitude: 77.43 } as any,
          deliverySlot: {} as any,
          paymentMethod: "cod",
          cartItems: [{ productId: "p1", quantity: 1, price: 100 } as any],
          subtotal: 100,
          productSavings: 0,
          deliveryFee: 0,
          coinDiscount: 0,
          couponDiscount: 0,
          totalAmount: 100,
        });
      } catch (err: any) {
        expect(err.message).not.toContain("Order placement is disabled in production read-only mode");
      }
    });

    it("does not throw read-only disabled error in cancelOrder in production mode", async () => {
      authManager.setMode("production");

      try {
        await orderService.cancelOrder("ORD-001", "SASS0000104");
      } catch (err: any) {
        expect(err.message).not.toContain("Order cancellation is disabled in production read-only mode");
      }
    });

    it("does not throw read-only disabled error in requestReturn in production mode", async () => {
      authManager.setMode("production");

      try {
        await orderService.requestReturn("ORD-001", "SASS0000104");
      } catch (err: any) {
        expect(err.message).not.toContain("Order return requests are disabled in production read-only mode");
      }
    });

    it("does not throw read-only disabled error in updateOrderStatus in production mode", async () => {
      authManager.setMode("production");

      try {
        await orderService.updateOrderStatus("ORD-001", "delivered", "SASS0000104");
      } catch (err: any) {
        expect(err.message).not.toContain("Order status updates are disabled in production read-only mode");
      }
    });
  });
});
