import { apiClient } from "./apiClient";
import { authService } from "./authService";
import { authManager } from "./authAdapter";
import { productionNotificationReader } from "./productionNotificationReader";
import { resolveCustomerDataSource } from "./customerDataSourceResolver";
import type {
  NotificationItem,
  Order,
  OrderStatus,
} from "../types";

export interface NotificationPreferences {
  inAppAlerts: boolean;
  orderUpdates: boolean;
  harvestAlerts: boolean;
  coinRewards: boolean;
  quietHours: boolean;
  whatsappSmsMock: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  inAppAlerts: true,
  orderUpdates: true,
  harvestAlerts: true,
  coinRewards: true,
  quietHours: true,
  whatsappSmsMock: true,
};

export const SUPPORTED_ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "packed",
  "in transit",
  "delivered",
  "cancelled",
  "returned",
];

type NotificationListener = () => void;

const listeners = new Set<NotificationListener>();
const inFlightCreations = new Map<string, Promise<NotificationItem>>();
const inMemoryObservedStatuses = new Map<string, Record<string, OrderStatus>>();

function normalizeStatusSlug(status: OrderStatus): string {
  return status.trim().toLowerCase().replace(/\s+/g, "_");
}

function getObservedStorageKey(userId: string): string {
  return `sass_observed_order_statuses_${userId}`;
}

function loadObservedStatusMap(userId: string): Record<string, OrderStatus> {
  const mem = inMemoryObservedStatuses.get(userId) || {};
  if (typeof window === "undefined") {
    return { ...mem };
  }
  try {
    const raw = localStorage.getItem(getObservedStorageKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, OrderStatus>;
      const merged = { ...parsed, ...mem };
      inMemoryObservedStatuses.set(userId, merged);
      return merged;
    }
  } catch {
    // Ignore storage read errors
  }
  return { ...mem };
}

function saveObservedStatusMap(
  userId: string,
  map: Record<string, OrderStatus>
): void {
  inMemoryObservedStatuses.set(userId, { ...map });
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getObservedStorageKey(userId), JSON.stringify(map));
    } catch {
      // Best-effort storage write
    }
  }
}

function buildStatusNotificationCopy(
  order: Order,
  previousStatus: OrderStatus,
  newStatus: OrderStatus
): {
  badge: string;
  title: string;
  message: string;
  ctaText: string;
} {
  const orderId = order.orderId || order.id;
  const city = order.deliveryAddress?.city || "your delivery address";
  const totalAmount = order.pricingSummary?.totalAmount ?? 0;
  const itemCount = (order.items || []).reduce(
    (sum, item) => sum + (item.quantity || 1),
    0
  );

  switch (newStatus) {
    case "processing":
      return {
        badge: `ORDER PROCESSING • #${orderId}`,
        title: `Order #${orderId} is Being Prepared`,
        message: `Your order status changed from ${previousStatus} to processing. Our team is freshly preparing your ${itemCount} item${itemCount === 1 ? "" : "s"}.`,
        ctaText: "Track Order →",
      };
    case "packed":
      return {
        badge: `ORDER PACKED • #${orderId}`,
        title: `Order #${orderId} Has Been Packed`,
        message: `Your order status changed from ${previousStatus} to packed. Your harvest basket is quality-checked and ready for dispatch.`,
        ctaText: "Track Order →",
      };
    case "in transit":
      return {
        badge: `LIVE DELIVERY • ORDER #${orderId}`,
        title: `Order #${orderId} is Out for Delivery`,
        message: `Your order status changed from ${previousStatus} to in transit. Our delivery partner is on the way to ${city}.`,
        ctaText: "Track Live Order →",
      };
    case "delivered":
      return {
        badge: `ORDER DELIVERED • #${orderId}`,
        title: `Order #${orderId} Safely Delivered`,
        message: `Your order status changed from ${previousStatus} to delivered. Order #${orderId} (₹${totalAmount}) has been delivered to ${city}.`,
        ctaText: "View Order & Invoice →",
      };
    case "cancelled":
      return {
        badge: `ORDER CANCELLED • #${orderId}`,
        title: `Order #${orderId} Has Been Cancelled`,
        message: `Your order status changed from ${previousStatus} to cancelled. Order #${orderId} (₹${totalAmount}) is now cancelled.`,
        ctaText: "View Order Details →",
      };
    case "returned":
      return {
        badge: `RETURN INITIATED • #${orderId}`,
        title: `Return Requested for Order #${orderId}`,
        message: `Your order status changed from ${previousStatus} to returned. Return request for Order #${orderId} is being processed.`,
        ctaText: "View Return Details →",
      };
    case "pending":
    default:
      return {
        badge: `ORDER UPDATE • #${orderId}`,
        title: `Order #${orderId} Status Updated to ${newStatus}`,
        message: `Order #${orderId} status updated from ${previousStatus} to ${newStatus}.`,
        ctaText: "View Order Details →",
      };
  }
}

export const notificationService = {
  /**
   * Resolves the canonical customer document ID (SASS...).
   * Never falls back to a demo customer when unauthenticated or when an empty ID is passed.
   */
  resolveCustomerId(userId?: string): string {
    if (userId !== undefined) {
      return userId.trim();
    }
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      return (currentUser.userId || currentUser.id || "").trim();
    }
    return "";
  },

  subscribe(listener: NotificationListener): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  notifyListeners(): void {
    for (const listener of listeners) {
      try {
        listener();
      } catch (err) {
        console.error("Notification listener error:", err);
      }
    }
  },

  clearSessionState(userId?: string): void {
    if (userId) {
      inMemoryObservedStatuses.delete(userId);
    } else {
      inMemoryObservedStatuses.clear();
    }
    this.notifyListeners();
  },

  recordObservedOrderStatus(
    userId: string,
    orderId: string,
    status: OrderStatus
  ): void {
    if (!userId || !orderId || !SUPPORTED_ORDER_STATUSES.includes(status)) {
      return;
    }
    const map = loadObservedStatusMap(userId);
    map[orderId] = status;
    saveObservedStatusMap(userId, map);
  },

  getObservedOrderStatus(
    userId: string,
    orderId: string
  ): OrderStatus | undefined {
    if (!userId || !orderId) return undefined;
    const map = loadObservedStatusMap(userId);
    return map[orderId];
  },

  async getNotifications(
    userId?: string,
    legacySassId?: string
  ): Promise<NotificationItem[]> {
    const isProd = authManager.getMode() === "production";
    const effectiveUserId = this.resolveCustomerId(userId);
    if (!effectiveUserId) {
      return [];
    }

    if (isProd) {
      const currentUser = authService.getCurrentUser();
      let resolvedId = effectiveUserId;
      let resolvedLegacySassId = legacySassId || currentUser?.legacySassId;
      try {
        const ds = resolveCustomerDataSource(effectiveUserId);
        resolvedId = ds.canonicalCustomerId;
        resolvedLegacySassId = resolvedLegacySassId || ds.legacySassId;
      } catch {
        // fallback
      }
      if (resolvedLegacySassId) {
        return productionNotificationReader.getCustomerNotifications(
          resolvedId,
          undefined,
          resolvedLegacySassId
        );
      }
      return productionNotificationReader.getCustomerNotifications(resolvedId);
    }

    const list = await apiClient.get<NotificationItem[]>("/notifications", {
      userId: effectiveUserId,
    });

    // Strict customer isolation & deduplication by eventKey / id
    const seenKeys = new Set<string>();
    const scoped: NotificationItem[] = [];

    const sorted = (list || [])
      .filter((n) => n && n.userId === effectiveUserId)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

    for (const item of sorted) {
      const dedupeKey = item.eventKey || item.id;
      if (dedupeKey && seenKeys.has(dedupeKey)) {
        continue;
      }
      if (dedupeKey) {
        seenKeys.add(dedupeKey);
      }
      scoped.push(item);
    }

    return scoped;
  },

  async getUnreadCount(
    userId?: string,
    legacySassId?: string
  ): Promise<number> {
    const list = await this.getNotifications(userId, legacySassId);
    return list.filter((n) => !n.read).length;
  },

  async createNotification(
    item: Omit<NotificationItem, "id" | "read" | "timestamp"> & {
      id?: string;
      read?: boolean;
      timestamp?: string;
    }
  ): Promise<NotificationItem> {
    const cleanUserId = (item.userId || "").trim();
    if (!cleanUserId) {
      throw new Error("Cannot create notification without a valid customer userId.");
    }

    const notifId =
      item.id ||
      `notif_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const dedupeKey = item.eventKey || notifId;

    const existingInFlight = inFlightCreations.get(dedupeKey);
    if (existingInFlight) {
      return existingInFlight;
    }

    const creationPromise = (async () => {
      try {
        const existingList = await this.getNotifications(cleanUserId);
        const duplicate = existingList.find(
          (n) =>
            n.id === notifId ||
            (item.eventKey && n.eventKey === item.eventKey)
        );
        if (duplicate) {
          return duplicate;
        }

        const payload: NotificationItem = {
          ...item,
          id: notifId,
          userId: cleanUserId,
          read: item.read ?? false,
          timestamp: item.timestamp || new Date().toISOString(),
        };

        try {
          const created = await apiClient.post<NotificationItem>(
            "/notifications",
            payload
          );
          this.notifyListeners();
          return created;
        } catch (postErr: any) {
          // Handle race condition if JSON Server rejected a duplicate ID
          const retryList = await this.getNotifications(cleanUserId).catch(
            () => []
          );
          const existingAfterRace = retryList.find(
            (n) =>
              n.id === notifId ||
              (item.eventKey && n.eventKey === item.eventKey)
          );
          if (existingAfterRace) {
            return existingAfterRace;
          }
          throw postErr;
        }
      } finally {
        inFlightCreations.delete(dedupeKey);
      }
    })();

    inFlightCreations.set(dedupeKey, creationPromise);
    return creationPromise;
  },

  async createOrderPlacedNotification(order: Order): Promise<NotificationItem> {
    if (!order || !order.orderId || !order.userId) {
      throw new Error("Invalid order object provided for notification creation.");
    }

    const orderId = order.orderId;
    const userId = order.userId;

    // Record baseline observed status so subsequent status transitions are detected
    this.recordObservedOrderStatus(userId, orderId, order.status || "pending");

    const itemCount = (order.items || []).reduce(
      (sum, item) => sum + (item.quantity || 1),
      0
    );
    const totalAmount = order.pricingSummary?.totalAmount ?? 0;
    const city = order.deliveryAddress?.city || "your address";
    const slotTitle = order.delivery?.slot || "Scheduled delivery slot";

    return this.createNotification({
      id: `notif_order_created_${orderId}`,
      userId,
      category: "orders",
      type: "order_created",
      eventKey: `order_created:${userId}:${orderId}`,
      orderId,
      newStatus: order.status || "pending",
      badge: `ORDER CONFIRMED • #${orderId}`,
      title: `Order #${orderId} Confirmed & Received`,
      message: `Your order of ${itemCount} item${itemCount === 1 ? "" : "s"} (₹${totalAmount}) for ${city} has been placed successfully. Delivery slot: ${slotTitle}.`,
      ctaText: "View Order Details →",
      actionUrl: `/orders?id=${orderId}`,
      read: false,
      timestamp: order.createdAt || new Date().toISOString(),
    });
  },

  async createCoinNotification(params: {
    userId: string;
    amount: number;
    type: "earned" | "redeemed" | "refunded";
    orderId?: string;
  }): Promise<NotificationItem> {
    const { userId, amount, type, orderId } = params;
    const cleanUserId = this.resolveCustomerId(userId);
    const notifId = `notif_coin_${type}_${orderId || Date.now()}`;
    const title =
      type === "earned"
        ? `Smart Coins Earned!`
        : type === "redeemed"
        ? `Smart Coins Redeemed!`
        : `Smart Coins Refunded!`;
    const message =
      type === "earned"
        ? `You earned ${amount} Smart Coins${orderId ? ` on Order #${orderId}` : ""}. Enjoy your rewards on your next harvest delivery!`
        : type === "redeemed"
        ? `You redeemed ${amount} Smart Coins${orderId ? ` on Order #${orderId}` : ""}.`
        : `${amount} Smart Coins have been refunded to your account balance.`;

    return this.createNotification({
      id: notifId,
      userId: cleanUserId,
      category: "rewards",
      type: "coins_credited",
      eventKey: `coin_${type}:${cleanUserId}:${orderId || Date.now()}`,
      ...(orderId ? { orderId } : {}),
      badge: type === "earned" ? "COINS EARNED" : "COINS REDEEMED",
      title,
      message,
      ctaText: "View Smart Coins Balance →",
      actionUrl: "/rewards",
      read: false,
      timestamp: new Date().toISOString(),
    });
  },

  async createPhoneVerifiedNotification(params: {
    userId: string;
    phone: string;
  }): Promise<NotificationItem> {
    const { userId, phone } = params;
    const cleanUserId = this.resolveCustomerId(userId);
    const notifId = `notif_phone_verified_${cleanUserId}`;

    return this.createNotification({
      id: notifId,
      userId: cleanUserId,
      category: "account",
      type: "account",
      eventKey: `phone_verified:${cleanUserId}`,
      badge: "SECURITY VERIFIED",
      title: "Mobile Number Verified Successfully",
      message: `Your contact number ${phone} has been verified with SMS OTP. Your orders and delivery rider dispatch updates are now secured.`,
      ctaText: "View Account Details →",
      actionUrl: "/account",
      read: false,
      timestamp: new Date().toISOString(),
    });
  },

  async createOrderStatusNotification(
    order: Order,
    previousStatus: OrderStatus,
    newStatus: OrderStatus,
    changeTimestamp?: string
  ): Promise<NotificationItem | null> {
    if (authManager.getMode() === "production") {
      return null;
    }

    if (!order || !order.orderId || !order.userId) {
      throw new Error("Invalid order provided for status notification.");
    }

    if (!SUPPORTED_ORDER_STATUSES.includes(newStatus)) {
      throw new Error(`Unsupported order status: "${newStatus}".`);
    }

    // Do not create a notification when the status has not changed
    if (previousStatus === newStatus) {
      return null;
    }

    const orderId = order.orderId;
    const userId = order.userId;
    const statusSlug = normalizeStatusSlug(newStatus);

    this.recordObservedOrderStatus(userId, orderId, newStatus);

    const copy = buildStatusNotificationCopy(order, previousStatus, newStatus);
    const driverName = order.delivery?.driver?.name;
    const driverVehicle = order.delivery?.driver?.vehicle;

    return this.createNotification({
      id: `notif_order_status_${orderId}_${statusSlug}`,
      userId,
      category: "orders",
      type: "order_status_changed",
      eventKey: `order_status:${userId}:${orderId}:${statusSlug}`,
      orderId,
      previousStatus,
      newStatus,
      badge: copy.badge,
      title: copy.title,
      message: copy.message,
      ...(driverName !== undefined ? { driverName } : {}),
      ...(driverVehicle !== undefined ? { driverVehicle } : {}),
      ctaText: copy.ctaText,
      actionUrl: `/orders?id=${orderId}`,
      read: false,
      timestamp: changeTimestamp || new Date().toISOString(),
    });
  },

  /**
   * Checks current orders for a customer against previously observed statuses.
   * - In production mode, updates local observation tracking without triggering Firestore mutations.
   * - On first observation of an order, records its status as baseline without generating historical notifications.
   * - When a previously observed order changes to a new supported status, creates a single idempotent notification.
   */
  async reconcileOrderStatuses(
    userId: string,
    providedOrders?: Order[]
  ): Promise<NotificationItem[]> {
    const cleanUserId = this.resolveCustomerId(userId);
    if (!cleanUserId) return [];

    if (authManager.getMode() === "production") {
      const orders =
        providedOrders ??
        (await apiClient.get<Order[]>("/orders", { userId: cleanUserId }).catch(() => []));
      const customerOrders = (orders || []).filter(
        (o) => o && o.userId === cleanUserId
      );
      const observedMap = loadObservedStatusMap(cleanUserId);
      let mapChanged = false;
      for (const order of customerOrders) {
        const orderId = order.orderId || order.id;
        const currentStatus = order.status;
        if (orderId && SUPPORTED_ORDER_STATUSES.includes(currentStatus)) {
          if (observedMap[orderId] !== currentStatus) {
            observedMap[orderId] = currentStatus;
            mapChanged = true;
          }
        }
      }
      if (mapChanged) {
        saveObservedStatusMap(cleanUserId, observedMap);
      }
      return [];
    }

    const orders =
      providedOrders ??
      (await apiClient.get<Order[]>("/orders", { userId: cleanUserId }));
    const customerOrders = (orders || []).filter(
      (o) => o && o.userId === cleanUserId
    );

    const observedMap = loadObservedStatusMap(cleanUserId);
    let existingNotifications: NotificationItem[] | null = null;
    const createdNotifications: NotificationItem[] = [];
    let mapChanged = false;

    for (const order of customerOrders) {
      const orderId = order.orderId || order.id;
      const currentStatus = order.status;
      if (!orderId || !SUPPORTED_ORDER_STATUSES.includes(currentStatus)) {
        continue;
      }

      let previousObserved = observedMap[orderId];

      // If local observed state was cleared or not yet hydrated, check persisted server notifications for this order
      if (previousObserved === undefined) {
        if (existingNotifications === null) {
          existingNotifications = await this.getNotifications(cleanUserId).catch(
            () => []
          );
        }
        const latestOrderNotif = existingNotifications.find(
          (n) =>
            n.orderId === orderId &&
            n.newStatus &&
            SUPPORTED_ORDER_STATUSES.includes(n.newStatus)
        );
        if (latestOrderNotif?.newStatus) {
          previousObserved = latestOrderNotif.newStatus;
          observedMap[orderId] = previousObserved;
          mapChanged = true;
        }
      }

      if (previousObserved === undefined) {
        // First time observing this pre-existing order: record baseline without fabricating old notifications
        observedMap[orderId] = currentStatus;
        mapChanged = true;
      } else if (previousObserved !== currentStatus) {
        observedMap[orderId] = currentStatus;
        mapChanged = true;
        try {
          const notif = await this.createOrderStatusNotification(
            order,
            previousObserved,
            currentStatus
          );
          if (notif) {
            createdNotifications.push(notif);
          }
        } catch (err) {
          console.error(
            `Failed to create status notification for order ${orderId}:`,
            err
          );
        }
      }
    }

    if (mapChanged) {
      saveObservedStatusMap(cleanUserId, observedMap);
    }

    return createdNotifications;
  },

  async markAsRead(id: string, userId?: string): Promise<NotificationItem> {
    if (!id || !id.trim()) {
      throw new Error("Notification ID is required.");
    }

    if (userId !== undefined) {
      const cleanUserId = userId.trim();
      if (!cleanUserId) {
        throw new Error("Access denied: Missing customer userId.");
      }
      const customerNotifications = await this.getNotifications(cleanUserId);
      const belongsToCustomer = customerNotifications.some((n) => n.id === id);
      if (!belongsToCustomer) {
        try {
          const directItem = await apiClient.get<NotificationItem>(
            `/notifications/${encodeURIComponent(id)}`
          );
          if (directItem && directItem.userId && directItem.userId !== cleanUserId) {
            throw new Error(
              "Access denied: Cannot mark another customer's notification as read."
            );
          }
        } catch (err: any) {
          if (err.message?.includes("Access denied")) throw err;
          if (customerNotifications.length > 0) {
            throw new Error(
              "Access denied: Cannot mark another customer's notification as read."
            );
          }
        }
      }
    }

    const updated = await apiClient.patch<NotificationItem>(
      `/notifications/${encodeURIComponent(id)}`,
      { read: true }
    );
    this.notifyListeners();
    return updated;
  },

  async markAllAsRead(userId?: string): Promise<void> {
    const effectiveUserId = this.resolveCustomerId(userId);
    if (!effectiveUserId) return;

    const unread = (await this.getNotifications(effectiveUserId)).filter(
      (n) => !n.read && n.userId === effectiveUserId
    );
    await Promise.all(
      unread.map((n) =>
        apiClient.patch(`/notifications/${encodeURIComponent(n.id)}`, {
          read: true,
        })
      )
    );
    this.notifyListeners();
  },

  getPreferences(userId: string = "SASS0000104"): NotificationPreferences {
    if (typeof window === "undefined") return DEFAULT_PREFERENCES;
    try {
      const stored = localStorage.getItem(`sass_notif_prefs_${userId}`);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_PREFERENCES;
  },

  updatePreferences(
    userId: string = "SASS0000104",
    prefs: Partial<NotificationPreferences>
  ): NotificationPreferences {
    const current = this.getPreferences(userId);
    const updated = { ...current, ...prefs };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `sass_notif_prefs_${userId}`,
          JSON.stringify(updated)
        );
      } catch {
        // Best effort
      }
    }
    return updated;
  },
};
