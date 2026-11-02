import { describe, it, expect, beforeEach } from "vitest";
import {
  notificationService,
  SUPPORTED_ORDER_STATUSES,
} from "../services/notificationService";
import { orderService } from "../services/orderService";
import { authService, TEST_CREDENTIALS } from "../services/authService";
import { apiClient } from "../services/apiClient";
import { STORE_COORDINATES } from "../lib/haversine";
import type {
  NotificationItem,
  NotificationCategory,
  Address,
  CartItem,
  DeliverySlot,
  OrderStatus,
} from "../types";

describe("Notifications & Order Lifecycle Notification Pipeline Verification", () => {
  const customerA = "SASS0000104";
  const customerB = "SASS0000088";

  const validAddressA: Address = {
    id: "addr_notif_test_a",
    userId: customerA,
    tag: "Home",
    name: "Arun Kumar",
    phone: "+91 99999 99999",
    houseNo: "42A",
    street: "Modachur Road",
    landmark: "Near Bus Stand",
    city: "Gobichettipalayam",
    pincode: "638452",
    lat: STORE_COORDINATES.lat + 0.005, // Within 6km
    lng: STORE_COORDINATES.lng + 0.005,
    isDefault: true,
  };

  const invalidFarAddress: Address = {
    ...validAddressA,
    id: "addr_notif_far",
    lat: STORE_COORDINATES.lat + 0.25, // > 25km away (outside 6km geofence)
    lng: STORE_COORDINATES.lng + 0.25,
  };

  const sampleCartItems: CartItem[] = [
    {
      id: "prod_groundnut_oil__opt0__L__1",
      cartKey: "prod_groundnut_oil__opt0__L__1",
      userId: customerA,
      productId: "prod_groundnut_oil",
      optionIndex: 0,
      unit: "L",
      unitSize: "1",
      name: "Heritage Wood Churned Mara Chekku Groundnut Oil (1L)",
      price: 320,
      mrp: 380,
      quantity: 2,
      image: "/images/groundnut.jpg",
      stock: 25,
    },
  ];

  const sampleSlot: DeliverySlot = {
    id: "slot_exp",
    type: "express",
    title: "Instant 60-90 Min Express Dispatch",
    subtitle: "Direct electric fleet delivery",
    charge: 60,
  };

  const sampleNotificationsA: NotificationItem[] = [
    {
      id: "n_01",
      userId: customerA,
      category: "orders",
      title: "Your order is out for delivery with Rider Murugan K.",
      message: "TVS iQube EV delivery runner is on the way. Security handover PIN: 4891.",
      badge: "LIVE DELIVERY • ORDER #ORD-0004690",
      orderId: "ORD-0004690",
      driverName: "Murugan K. (Vaccinated & Verified)",
      pin: "4891",
      ctaText: "Track Live Order →",
      actionUrl: "/orders?id=ORD-0004690",
      read: false,
      timestamp: new Date().toISOString(),
    },
    {
      id: "n_02",
      userId: customerA,
      category: "offers",
      title: "Fresh Cold-Pressed Mara Chekku Gingelly Oil Pressed Today",
      message: "Batch #TN-2026-886 pressed in Vaagai wood churners.",
      badge: "FRESH BATCH ALERT",
      ctaText: "Order Now (In Stock)",
      actionUrl: "/shop",
      read: false,
      timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
    {
      id: "n_03",
      userId: customerA,
      category: "rewards",
      title: "+100 Amman Coins Credited to Your Vault",
      message: "Thank you for reviewing 'Heritage Wood Churned Mara Chekku Groundnut Oil'.",
      badge: "COINS REWARD",
      coins: 100,
      ctaText: "View Coins Vault",
      actionUrl: "/rewards",
      read: true,
      timestamp: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: "n_04",
      userId: customerA,
      category: "orders",
      title: "Order #ORD-0004512 safely delivered to Home",
      message: "Delivered to Kasipalayam Road. 3 items received.",
      badge: "ORDER DELIVERED",
      orderId: "ORD-0004512",
      ctaText: "Download Invoice (PDF)",
      actionUrl: "/orders?id=ORD-0004512",
      read: true,
      timestamp: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    },
    {
      id: "n_05",
      userId: customerA,
      category: "account",
      title: "VIP Privilege Status Update",
      message: "Complete ₹5,000 in delivered orders to unlock VIP Free Delivery.",
      badge: "VIP PRIVILEGE",
      ctaText: "View VIP Privilege",
      actionUrl: "/rewards",
      read: true,
      timestamp: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    },
  ];

  const sampleNotificationsB: NotificationItem[] = [
    {
      id: "n_b1",
      userId: customerB,
      category: "rewards",
      title: "VIP Privilege Pass Active",
      message: "Welcome back Priya! You enjoy Free 60-Minute express delivery.",
      badge: "VIP PRIVILEGE",
      actionUrl: "/rewards",
      read: false,
      timestamp: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    notificationService.clearSessionState();
  });

  describe("1. Header Badge Count & Unread Calculation", () => {
    it("computes exact unread notifications count for header badge", () => {
      const unreadCount = sampleNotificationsA.filter((n) => !n.read).length;
      expect(unreadCount).toBe(2); // n_01 and n_02
    });

    it("verifies badge hides when all notifications are read (unread count = 0)", () => {
      const allRead = sampleNotificationsA.map((n) => ({ ...n, read: true }));
      const unreadCount = allRead.filter((n) => !n.read).length;
      expect(unreadCount).toBe(0);
    });
  });

  describe("2. Customer Notification Isolation & Ownership Enforcement", () => {
    it("scopes notifications strictly per customer and prevents cross-customer leakage", async () => {
      const originalGet = apiClient.get;
      apiClient.get = (async (_url: string, params?: any) => {
        if (params?.userId === customerA) return sampleNotificationsA;
        if (params?.userId === customerB) return sampleNotificationsB;
        return [];
      }) as any;

      try {
        const notifsA = await notificationService.getNotifications(customerA);
        expect(notifsA).toHaveLength(5);
        notifsA.forEach((n) => expect(n.userId).toBe(customerA));

        const notifsB = await notificationService.getNotifications(customerB);
        expect(notifsB).toHaveLength(1);
        notifsB.forEach((n) => expect(n.userId).toBe(customerB));
      } finally {
        apiClient.get = originalGet;
      }
    });

    it("prevents another customer from marking a foreign notification as read", async () => {
      const originalGet = apiClient.get;
      apiClient.get = (async (_url: string, params?: any) => {
        if (params?.userId === customerA) return sampleNotificationsA;
        if (params?.userId === customerB) return sampleNotificationsB;
        return [];
      }) as any;

      try {
        // Customer B attempts to mark Customer A's notification n_01 as read
        await expect(
          notificationService.markAsRead("n_01", customerB)
        ).rejects.toThrow("Access denied");
      } finally {
        apiClient.get = originalGet;
      }
    });

    it("bulk mark-all-as-read affects only the requesting customer", async () => {
      const originalGet = apiClient.get;
      const originalPatch = apiClient.patch;
      const patchedIds: string[] = [];

      apiClient.get = (async (_url: string, params?: any) => {
        if (params?.userId === customerA) return sampleNotificationsA;
        if (params?.userId === customerB) return sampleNotificationsB;
        return [];
      }) as any;

      apiClient.patch = (async (url: string) => {
        const id = url.split("/").pop();
        if (id) patchedIds.push(id);
        return {} as any;
      }) as any;

      try {
        await notificationService.markAllAsRead(customerA);
        expect(patchedIds).toContain("n_01");
        expect(patchedIds).toContain("n_02");
        expect(patchedIds).not.toContain("n_03"); // already read
        expect(patchedIds).not.toContain("n_b1"); // belongs to customerB
      } finally {
        apiClient.get = originalGet;
        apiClient.patch = originalPatch;
      }
    });
  });

  describe("3. Category Filtering & Count Derivations", () => {
    const isOrderCategory = (cat: NotificationCategory) => cat === "orders";
    const isRewardCategory = (cat: NotificationCategory) =>
      cat === "rewards" || cat === "account";
    const isHarvestCategory = (cat: NotificationCategory) =>
      cat === "offers" || cat === "harvest";

    it("filters notifications by Orders & Delivery category correctly", () => {
      const filtered = sampleNotificationsA.filter((n) =>
        isOrderCategory(n.category)
      );
      expect(filtered).toHaveLength(2);
      expect(filtered.map((n) => n.id)).toEqual(["n_01", "n_04"]);
    });

    it("filters notifications by Amman Coins & VIP category correctly", () => {
      const filtered = sampleNotificationsA.filter((n) =>
        isRewardCategory(n.category)
      );
      expect(filtered).toHaveLength(2);
      expect(filtered.map((n) => n.id)).toEqual(["n_03", "n_05"]);
    });

    it("filters notifications by Harvest & Stock Alerts category correctly", () => {
      const filtered = sampleNotificationsA.filter((n) =>
        isHarvestCategory(n.category)
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.id).toBe("n_02");
    });

    it("returns all notifications when tab is 'all'", () => {
      expect(sampleNotificationsA).toHaveLength(5);
    });
  });

  describe("4. Individual & Bulk Read Actions Persistence", () => {
    it("persists individual mark-as-read to backend via apiClient.patch", async () => {
      const originalPatch = apiClient.patch;
      let patchedPayload: any = null;
      let patchedUrl: string | null = null;

      apiClient.patch = (async (url: string, data: any) => {
        patchedUrl = url;
        patchedPayload = data;
        return { ...sampleNotificationsA[0], read: true };
      }) as any;

      try {
        const result = await notificationService.markAsRead("n_01");
        expect(patchedUrl).toBe("/notifications/n_01");
        expect(patchedPayload).toEqual({ read: true });
        expect(result.read).toBe(true);
      } finally {
        apiClient.patch = originalPatch;
      }
    });
  });

  describe("5. Related-Page Navigation & Action Destination Validity", () => {
    it("verifies all action URLs map to real supported routes", () => {
      const validRoutePrefixes = [
        "/orders",
        "/shop",
        "/product",
        "/rewards",
        "/account",
        "/cart",
      ];

      sampleNotificationsA.forEach((notif) => {
        if (notif.actionUrl) {
          const isValid = validRoutePrefixes.some((prefix) =>
            notif.actionUrl!.startsWith(prefix)
          );
          expect(isValid).toBe(true);
        }
      });
    });
  });

  describe("6. Alert Settings & Channel Preferences Persistence", () => {
    it("loads default alert preferences when none are saved", () => {
      const prefs = notificationService.getPreferences(customerA);
      expect(prefs.inAppAlerts).toBe(true);
      expect(prefs.orderUpdates).toBe(true);
      expect(prefs.harvestAlerts).toBe(true);
      expect(prefs.coinRewards).toBe(true);
      expect(prefs.quietHours).toBe(true);
    });

    it("persists updated preferences to localStorage and updates state", () => {
      const updated = notificationService.updatePreferences(customerA, {
        harvestAlerts: false,
        whatsappSmsMock: false,
      });

      expect(updated.harvestAlerts).toBe(false);
      expect(updated.whatsappSmsMock).toBe(false);
      expect(updated.inAppAlerts).toBe(true);

      const reloaded = notificationService.getPreferences(customerA);
      expect(reloaded.harvestAlerts).toBe(false);
      expect(reloaded.whatsappSmsMock).toBe(false);
    });
  });

  describe("7. Live REST API Order Placement & Lifecycle Notifications Pipeline", () => {
    let createdOrderId = "";

    it("(Case 1, 6, 8, 10, 11) creates exactly one persistent unread new-order notification on successful order placement and increments unread count", async () => {
      const unreadBefore = await notificationService.getUnreadCount(customerA);

      const createdOrder = await orderService.createOrder({
        userId: customerA,
        customerName: "Arun Kumar",
        phone: "+91 99999 99999",
        address: validAddressA,
        deliverySlot: sampleSlot,
        paymentMethod: "online",
        cartItems: sampleCartItems,
        subtotal: 640,
        productSavings: 120,
        deliveryFee: 0,
        coinDiscount: 0,
        couponDiscount: 0,
        totalAmount: 640,
      });

      createdOrderId = createdOrder.orderId;
      expect(createdOrderId).toMatch(/^ORD-000\d+$/);

      // Reload notifications from JSON Server REST API
      const notificationsAfter =
        await notificationService.getNotifications(customerA);
      const orderCreatedNotifs = notificationsAfter.filter(
        (n) => n.orderId === createdOrderId && n.type === "order_created"
      );

      expect(orderCreatedNotifs).toHaveLength(1);
      const createdNotif = orderCreatedNotifs[0]!;
      expect(createdNotif.id).toBe(`notif_order_created_${createdOrderId}`);
      expect(createdNotif.userId).toBe(customerA);
      expect(createdNotif.read).toBe(false);
      expect(createdNotif.title).toContain(createdOrderId);
      expect(createdNotif.actionUrl).toBe(`/orders?id=${createdOrderId}`);

      const unreadAfter = await notificationService.getUnreadCount(customerA);
      expect(unreadAfter).toBe(unreadBefore + 1);

      // Verify deduplication: calling createOrderPlacedNotification again for the same order does not duplicate
      const retryNotif =
        await notificationService.createOrderPlacedNotification(createdOrder);
      expect(retryNotif.id).toBe(createdNotif.id);
      const notificationsAfterRetry =
        await notificationService.getNotifications(customerA);
      expect(
        notificationsAfterRetry.filter(
          (n) => n.orderId === createdOrderId && n.type === "order_created"
        )
      ).toHaveLength(1);
    });

    it("(Case 2) creates no notification when order submission fails validation or API fails", async () => {
      const beforeCount = (
        await notificationService.getNotifications(customerA)
      ).length;

      // 1. Validation failure (empty cart)
      await expect(
        orderService.createOrder({
          userId: customerA,
          customerName: "Arun Kumar",
          phone: "+91 99999 99999",
          address: validAddressA,
          deliverySlot: sampleSlot,
          paymentMethod: "online",
          cartItems: [],
          subtotal: 0,
          productSavings: 0,
          deliveryFee: 0,
          coinDiscount: 0,
          couponDiscount: 0,
          totalAmount: 0,
        })
      ).rejects.toThrow("empty cart");

      // 2. Validation failure (outside 6km geofence)
      await expect(
        orderService.createOrder({
          userId: customerA,
          customerName: "Arun Kumar",
          phone: "+91 99999 99999",
          address: invalidFarAddress,
          deliverySlot: sampleSlot,
          paymentMethod: "online",
          cartItems: sampleCartItems,
          subtotal: 640,
          productSavings: 120,
          deliveryFee: 0,
          coinDiscount: 0,
          couponDiscount: 0,
          totalAmount: 640,
        })
      ).rejects.toThrow("outside the 6km delivery boundary");

      const afterCount = (
        await notificationService.getNotifications(customerA)
      ).length;
      expect(afterCount).toBe(beforeCount);
    });

    it("(Case 3 & 4) creates one lifecycle notification on genuine status transition and does not duplicate when repeating the same status", async () => {
      expect(createdOrderId).toBeTruthy();

      // Transition pending -> processing
      const updated = await orderService.updateOrderStatus(
        createdOrderId,
        "processing",
        customerA
      );
      expect(updated.status).toBe("processing");

      const notifsAfterFirst =
        await notificationService.getNotifications(customerA);
      const processingNotifs = notifsAfterFirst.filter(
        (n) =>
          n.orderId === createdOrderId &&
          n.type === "order_status_changed" &&
          n.newStatus === "processing"
      );
      expect(processingNotifs).toHaveLength(1);
      expect(processingNotifs[0]?.previousStatus).toBe("pending");
      expect(processingNotifs[0]?.newStatus).toBe("processing");
      expect(processingNotifs[0]?.actionUrl).toBe(`/orders?id=${createdOrderId}`);

      // Repeat the exact same status update: processing -> processing
      await orderService.updateOrderStatus(
        createdOrderId,
        "processing",
        customerA
      );
      const notifsAfterDuplicateCall =
        await notificationService.getNotifications(customerA);
      const processingNotifsAfter = notifsAfterDuplicateCall.filter(
        (n) =>
          n.orderId === createdOrderId &&
          n.type === "order_status_changed" &&
          n.newStatus === "processing"
      );
      expect(processingNotifsAfter).toHaveLength(1);
    });

    it("(Case 5) creates separate lifecycle notifications for subsequent status transitions (packed -> in transit -> delivered)", async () => {
      const transitions: OrderStatus[] = ["packed", "in transit", "delivered"];

      for (const nextStatus of transitions) {
        const res = await orderService.updateOrderStatus(
          createdOrderId,
          nextStatus,
          customerA
        );
        expect(res.status).toBe(nextStatus);
      }

      const allNotifs = await notificationService.getNotifications(customerA);
      const orderStatusNotifs = allNotifs.filter(
        (n) =>
          n.orderId === createdOrderId && n.type === "order_status_changed"
      );

      // Should have 4 status-change notifications: processing, packed, in transit, delivered
      expect(orderStatusNotifs).toHaveLength(4);
      const recordedStatuses = orderStatusNotifs.map((n) => n.newStatus);
      expect(recordedStatuses).toContain("processing");
      expect(recordedStatuses).toContain("packed");
      expect(recordedStatuses).toContain("in transit");
      expect(recordedStatuses).toContain("delivered");
    });

    it("(Case 7 & 9) enforces customer isolation against Customer B and persists mark-as-read across service reloads", async () => {
      // Customer B cannot see Customer A's order notifications
      const customerBNotifs =
        await notificationService.getNotifications(customerB);
      expect(
        customerBNotifs.some((n) => n.orderId === createdOrderId)
      ).toBe(false);

      // Customer B cannot mark Customer A's notification as read
      const targetNotifId = `notif_order_created_${createdOrderId}`;
      await expect(
        notificationService.markAsRead(targetNotifId, customerB)
      ).rejects.toThrow("Access denied");

      // Customer A marks the notification as read
      const unreadBefore = await notificationService.getUnreadCount(customerA);
      const marked = await notificationService.markAsRead(
        targetNotifId,
        customerA
      );
      expect(marked.read).toBe(true);

      // Reload notifications from server and confirm unread count decreased by 1
      const unreadAfter = await notificationService.getUnreadCount(customerA);
      expect(unreadAfter).toBe(unreadBefore - 1);
    });

    it("(Case 12) reconcileOrderStatuses detects external API status changes once and does not duplicate on repeated polling", async () => {
      // Simulate an external status update directly on JSON Server (delivered -> returned)
      await apiClient.patch(`/orders/${encodeURIComponent(createdOrderId)}`, {
        status: "returned",
      });

      // First reconciliation detects the transition from delivered -> returned
      const createdOnPoll1 =
        await notificationService.reconcileOrderStatuses(customerA);
      expect(
        createdOnPoll1.some(
          (n) => n.orderId === createdOrderId && n.newStatus === "returned"
        )
      ).toBe(true);

      // Second and third polling cycles must not create duplicate notifications
      const createdOnPoll2 =
        await notificationService.reconcileOrderStatuses(customerA);
      expect(createdOnPoll2).toHaveLength(0);

      const createdOnPoll3 =
        await notificationService.reconcileOrderStatuses(customerA);
      expect(createdOnPoll3).toHaveLength(0);

      const allNotifs = await notificationService.getNotifications(customerA);
      const returnedNotifs = allNotifs.filter(
        (n) =>
          n.orderId === createdOrderId &&
          n.type === "order_status_changed" &&
          n.newStatus === "returned"
      );
      expect(returnedNotifs).toHaveLength(1);
    });

    it("(Case 13) logging out and switching customers clears session state and never leaks notifications", async () => {
      // Login as Customer A
      await authService.verifyOtp(
        TEST_CREDENTIALS.phone,
        TEST_CREDENTIALS.otp
      );
      const activeNotifsA = await notificationService.getNotifications();
      expect(activeNotifsA.length).toBeGreaterThan(0);
      expect(activeNotifsA.every((n) => n.userId === customerA)).toBe(true);

      // Logout
      authService.logout();
      notificationService.clearSessionState(customerA);

      // Calling getNotifications() when logged out returns empty array (no demo user fallback)
      const loggedOutNotifs = await notificationService.getNotifications();
      expect(loggedOutNotifs).toEqual([]);

      // Switch to Customer B
      await authService.verifyOtp(
        TEST_CREDENTIALS.vipPhone,
        TEST_CREDENTIALS.otp
      );
      const activeNotifsB = await notificationService.getNotifications();
      expect(activeNotifsB.every((n) => n.userId === customerB)).toBe(true);
      expect(activeNotifsB.some((n) => n.userId === customerA)).toBe(false);

      // Restore Customer A session for subsequent tests
      await authService.verifyOtp(
        TEST_CREDENTIALS.phone,
        TEST_CREDENTIALS.otp
      );
    });

    it("supports all 7 canonical order statuses and rejects unsupported status values", async () => {
      expect(SUPPORTED_ORDER_STATUSES).toEqual([
        "pending",
        "processing",
        "packed",
        "in transit",
        "delivered",
        "cancelled",
        "returned",
      ]);

      await expect(
        orderService.updateOrderStatus(
          createdOrderId,
          "invalid_status" as OrderStatus,
          customerA
        )
      ).rejects.toThrow("Unsupported order status");
    });

    it("creates a cancelled lifecycle notification when a customer cancels a pending order via cancelOrder()", async () => {
      const cancelTestOrder = await orderService.createOrder({
        userId: customerA,
        customerName: "Arun Kumar",
        phone: "+91 99999 99999",
        address: validAddressA,
        deliverySlot: sampleSlot,
        paymentMethod: "cod",
        cartItems: sampleCartItems,
        subtotal: 640,
        productSavings: 120,
        deliveryFee: 0,
        coinDiscount: 0,
        couponDiscount: 0,
        totalAmount: 640,
      });

      const cancelledOrder = await orderService.cancelOrder(
        cancelTestOrder.orderId,
        customerA
      );
      expect(cancelledOrder.status).toBe("cancelled");

      const allNotifs = await notificationService.getNotifications(customerA);
      const cancelNotifs = allNotifs.filter(
        (n) =>
          n.orderId === cancelTestOrder.orderId &&
          n.type === "order_status_changed" &&
          n.newStatus === "cancelled"
      );
      expect(cancelNotifs).toHaveLength(1);
      expect(cancelNotifs[0]?.previousStatus).toBe("pending");
      expect(cancelNotifs[0]?.read).toBe(false);
    });
  });
});

