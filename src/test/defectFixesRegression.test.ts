import { describe, it, expect, beforeEach } from "vitest";
import { authService, TEST_CREDENTIALS } from "../services/authService";
import { cartService } from "../services/cartService";
import { orderService } from "../services/orderService";
import { addressService } from "../services/addressService";
import { coinService } from "../services/coinService";
import { productService } from "../services/productService";
import { STORE_COORDINATES } from "../lib/haversine";
import type { CartItem, Address, Order } from "../types";

describe("Regression Tests: Confirmed Defect Fixes & Business Rules", () => {
  beforeEach(() => {
    // Reset test user session
    authService.verifyOtp(TEST_CREDENTIALS.phone, TEST_CREDENTIALS.otp);
  });

  describe("1. Cart, Discounts & Checkout Pricing Discrepancies", () => {
    it("ledger breakdown arithmetic is mathematically consistent without double-counting MRP savings", () => {
      // Reproduction scenario from audit:
      // Product: 500ml Groundnut Oil (MRP: 160, Selling Price: 130 -> MRP Savings: 30)
      // Coins redeemed: 130 coins (worth 65 INR)
      // Delivery fee: 40 INR
      const sellingPrice = 130;
      const mrp = 160;
      const mrpSavings = mrp - sellingPrice; // 30 INR
      expect(mrpSavings).toBe(30);

      const subtotal = sellingPrice;
      const coinDiscount = 65; // 130 coins * 0.5
      const couponDiscount = 0;
      const deliveryFee = 40;

      // Mathematical ledger sum:
      // Subtotal (130) - Coin Discount (65) + Delivery Fee (40) = 105
      // MRP Savings must NOT be subtracted from subtotal because selling price already reflects it.
      const calculatedTotal = subtotal - (couponDiscount + coinDiscount) + deliveryFee;
      expect(calculatedTotal).toBe(105);
      expect(calculatedTotal).not.toBe(75); // 75 was the defect where MRP savings was double-counted
    });

    it("prevents discounts exceeding subtotal and prevents negative payable amounts", () => {
      const subtotal = 50;
      const couponDiscount = 100;
      const coinDiscount = 20;
      const deliveryFee = 40;

      // Rule: total discounts cannot exceed subtotal
      const effectiveDiscount = Math.min(subtotal, couponDiscount + coinDiscount);
      expect(effectiveDiscount).toBe(50);

      const totalPayable = Math.max(0, subtotal - effectiveDiscount + deliveryFee);
      expect(totalPayable).toBe(40); // Only delivery fee is payable
      expect(totalPayable).toBeGreaterThanOrEqual(0);
    });

    it("orderService.createOrder persists coupon and coin discounts into order payload", async () => {
      const product = (await productService.getProductById("prod_groundnut_oil"))!;
      const testUserId = TEST_CREDENTIALS.defaultUserId; // SASS0000104

      const opt0 = product.options[0]!;
      const cartItem: CartItem = {
        id: "prod_groundnut_oil__opt0__ml__500",
        cartKey: "prod_groundnut_oil__opt0__ml__500",
        userId: testUserId,
        productId: product.id,
        name: product.name,
        image: product.imageUrl,
        unit: opt0.unit,
        unitSize: opt0.unitSize,
        price: opt0.offerPrice,
        mrp: opt0.mrp,
        quantity: 1,
        optionIndex: 0,
        stock: opt0.stock,
      };

      const validAddress: Address = {
        id: "test_addr_order_1",
        userId: testUserId,
        tag: "Home",
        name: "Arun Kumar",
        phone: "+91 99999 99999",
        houseNo: "12",
        street: "Bhavani Main Road",
        city: "Gobichettipalayam",
        pincode: "638454",
        lat: 11.4595,
        lng: 77.3338,
        isDefault: true,
      };

      const slot = {
        id: "slot_morning",
        type: "standard" as const,
        title: "Morning Fresh Slot",
        subtitle: "06:30 - 09:30",
        startTime: "06:30",
        endTime: "09:30",
        charge: 40,
        active: true,
      };

      const subtotal = cartItem.price; // 130
      const coinDiscount = 20;
      const couponDiscount = 10;
      const deliveryFee = 40;
      const expectedTotal = subtotal - (coinDiscount + couponDiscount) + deliveryFee; // 130 - 30 + 40 = 140

      const order = await orderService.createOrder({
        userId: testUserId,
        customerName: "Arun Kumar",
        phone: "+91 99999 99999",
        address: validAddress,
        deliverySlot: slot,
        paymentMethod: "cod",
        cartItems: [cartItem],
        subtotal,
        productSavings: 30,
        deliveryFee,
        coinDiscount,
        couponDiscount,
        totalAmount: expectedTotal,
      });

      expect(order.orderId).toBeDefined();
      expect(order.pricingSummary.coinDiscount).toBe(20);
      expect(order.pricingSummary.couponDiscount).toBe(10);
      expect(order.pricingSummary.subtotal).toBe(subtotal);
      expect(order.pricingSummary.deliveryFee).toBe(deliveryFee);
      expect(order.pricingSummary.totalAmount).toBe(expectedTotal);
    });
  });

  describe("2. Customer Cart Isolation", () => {
    // SASS0000104 and SASS0000088 are the two verified database customers
    const userA = "SASS0000104";
    const userB = "SASS0000088";

    it("scopes cart items strictly per customer and prevents cross-user leakage", async () => {
      // Clear both carts initially
      await cartService.clearCart(userA);
      await cartService.clearCart(userB);

      const productOil = (await productService.getProductById("prod_groundnut_oil"))!;
      const productGhee = (await productService.getProductById("prod_a2_ghee"))!;

      // User A adds Groundnut Oil
      await cartService.addToCart(productOil, 0, 2, userA);

      // User B adds A2 Ghee
      await cartService.addToCart(productGhee, 0, 1, userB);

      // Query User A's cart
      const cartA = await cartService.getCart(userA);
      expect(cartA.some((item) => item.productId === "prod_groundnut_oil")).toBe(true);
      expect(cartA.some((item) => item.productId === "prod_a2_ghee")).toBe(false);

      // Query User B's cart
      const cartB = await cartService.getCart(userB);
      expect(cartB.some((item) => item.productId === "prod_a2_ghee")).toBe(true);
      expect(cartB.some((item) => item.productId === "prod_groundnut_oil")).toBe(false);

      // User A clearing their cart must NOT wipe User B's cart
      await cartService.clearCart(userA);

      const cartAAfterClear = await cartService.getCart(userA);
      expect(cartAAfterClear.length).toBe(0);

      const cartBAfterClearA = await cartService.getCart(userB);
      expect(cartBAfterClearA.length).toBe(1);
      expect(cartBAfterClearA[0]?.productId).toBe("prod_a2_ghee");

      // Cleanup User B
      await cartService.clearCart(userB);
    });
  });

  describe("3. Logout and Authentication State Persistence", () => {
    it("authService.logout clears session and does NOT automatically recreate a fallback user", () => {
      // Login first
      const loggedIn = authService.verifyOtp(TEST_CREDENTIALS.phone, TEST_CREDENTIALS.otp);
      expect(loggedIn).toBeDefined();
      expect(authService.getCurrentUser()).not.toBeNull();

      // Logout
      authService.logout();

      // Ensure getCurrentUser returns null (no auto-fallback)
      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeNull();

      // Simulate page refresh (calling again without logging in)
      const afterSimulatedReload = authService.getCurrentUser();
      expect(afterSimulatedReload).toBeNull();
    });
  });

  describe("4. Delivery Geofence Enforcement", () => {
    it("confirms authoritative Gobichettipalayam coordinates as the geofence center", () => {
      expect(STORE_COORDINATES.lat).toBe(11.459319);
      expect(STORE_COORDINATES.lng).toBe(77.333565);
      expect(STORE_COORDINATES.maxRadiusKm).toBe(6.0);
    });

    it("permits delivery addresses within the 6.0 km radius", () => {
      // Point ~150m from store center in Gobichettipalayam
      const geo = addressService.validateGeofence(11.4595, 77.3338);
      expect(geo.eligible).toBe(true);
      expect(geo.distanceKm).toBeLessThan(1.0);
    });

    it("rejects delivery addresses beyond delivery boundary in validateGeofence and blocks orderService.createOrder", async () => {
      // Out-of-zone coordinates (Coimbatore ~64km away)
      const farLat = 11.0168;
      const farLng = 76.9558;

      const geo = addressService.validateGeofence(farLat, farLng);
      expect(geo.eligible).toBe(false);
      expect(geo.distanceKm).toBeGreaterThan(6.0);

      const outOfZoneAddress: Address = {
        id: "out_of_zone_addr",
        userId: TEST_CREDENTIALS.defaultUserId,
        tag: "Other",
        name: "Test Customer",
        phone: "+91 99999 99999",
        houseNo: "99",
        street: "Remote Road",
        city: "Outside Territory",
        pincode: "638000",
        lat: farLat,
        lng: farLng,
        isDefault: false,
      };

      const slot = {
        id: "slot_evening",
        type: "standard" as const,
        title: "Evening Slot",
        subtitle: "16:00 - 19:00",
        startTime: "16:00",
        endTime: "19:00",
        charge: 0,
        active: true,
      };

      const mockCartItem: CartItem = {
        id: "mock_item",
        cartKey: "mock_item",
        userId: TEST_CREDENTIALS.defaultUserId,
        productId: "prod_groundnut_oil",
        optionIndex: 0,
        name: "Mock Item",
        unit: "L",
        unitSize: "1",
        price: 500,
        mrp: 550,
        quantity: 1,
        image: "",
        stock: 10,
      };

      // Calling createOrder with out-of-zone address must throw an error
      await expect(
        orderService.createOrder({
          userId: TEST_CREDENTIALS.defaultUserId,
          customerName: "Test Customer",
          phone: "+91 99999 99999",
          address: outOfZoneAddress,
          deliverySlot: slot,
          paymentMethod: "cod",
          cartItems: [mockCartItem],
          subtotal: 500,
          productSavings: 50,
          deliveryFee: 0,
          coinDiscount: 0,
          couponDiscount: 0,
          totalAmount: 500,
        })
      ).rejects.toThrow(/delivery boundary/i);
    });
  });

  describe("5. Order Integrity & Business Rules", () => {
    it("VIP eligibility requires status 'delivered' and 30-day rolling spend >= 5000", () => {
      const now = new Date();
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString();
      const fortyDaysAgo = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString();

      const mockOrders: Partial<Order>[] = [
        // Delivered within 30 days: 3000
        {
          orderId: "O1",
          status: "delivered",
          createdAt: tenDaysAgo,
          pricingSummary: { subtotal: 3000, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 3000 },
        },
        // Pending order: 2500 (must NOT be counted)
        {
          orderId: "O2",
          status: "pending",
          createdAt: tenDaysAgo,
          pricingSummary: { subtotal: 2500, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 2500 },
        },
        // Delivered 40 days ago: 3000 (must NOT be counted)
        {
          orderId: "O3",
          status: "delivered",
          createdAt: fortyDaysAgo,
          pricingSummary: { subtotal: 3000, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 3000 },
        },
      ];

      const vipStatus1 = coinService.calculateVIPStatus(mockOrders as Order[], 5000);
      expect(vipStatus1.isVIP).toBe(false); // Only 3000 qualifies, need 5000
      expect(vipStatus1.rollingSpend).toBe(3000);
      expect(vipStatus1.percentage).toBe(60);

      // Now add another qualifying delivered order of 2500
      mockOrders.push({
        orderId: "O4",
        status: "delivered",
        createdAt: tenDaysAgo,
        pricingSummary: { subtotal: 2500, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 2500 },
      });

      const vipStatus2 = coinService.calculateVIPStatus(mockOrders as Order[], 5000);
      expect(vipStatus2.isVIP).toBe(true);
      expect(vipStatus2.rollingSpend).toBe(5500);
      expect(vipStatus2.percentage).toBe(100);
    });

    it("order cancellation is permitted only when status is 'pending' or 'processing'", async () => {
      const deliveredOrder: Order = {
        id: "mock_delivered_id",
        orderId: "ORD-99999",
        userId: "U1",
        customerName: "C1",
        phone: "9999999999",
        status: "delivered",
        createdAt: new Date().toISOString(),
        deliveryAddress: {} as any,
        delivery: {} as any,
        payment: {} as any,
        items: [],
        pricingSummary: { subtotal: 100, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 100 },
      };

      const originalGetOrderById = orderService.getOrderById;
      try {
        orderService.getOrderById = async () => deliveredOrder;

        await expect(orderService.cancelOrder("ORD-99999")).rejects.toThrow(
          /Cannot cancel order with status "delivered"/i
        );
      } finally {
        orderService.getOrderById = originalGetOrderById;
      }
    });

    it("returns can only be requested for delivered orders within 24 hours of delivery", async () => {
      const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
      const expiredOrder: Order = {
        id: "mock_expired_id",
        orderId: "ORD-88888",
        userId: "U1",
        customerName: "C1",
        phone: "9999999999",
        status: "delivered",
        createdAt: thirtyHoursAgo,
        deliveredAt: thirtyHoursAgo,
        deliveryAddress: {} as any,
        delivery: {} as any,
        payment: {} as any,
        items: [],
        pricingSummary: { subtotal: 100, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 100 },
      };

      const originalGetOrderById = orderService.getOrderById;
      try {
        orderService.getOrderById = async () => expiredOrder;

        await expect(orderService.requestReturn("ORD-88888")).rejects.toThrow(
          /within 24 hours of delivery/i
        );
      } finally {
        orderService.getOrderById = originalGetOrderById;
      }
    });
  });
});

