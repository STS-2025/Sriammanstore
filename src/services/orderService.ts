import { apiClient } from "./apiClient";
import type { Order, OrderStatus, CartItem, Address, DeliverySlot, User } from "../types";
import { cartService } from "./cartService";
import { addressService } from "./addressService";
import { settingsService } from "./settingsService";
import { notificationService, SUPPORTED_ORDER_STATUSES } from "./notificationService";
import { convertRupeesToCoins, coinService } from "./coinService";
import { authService } from "./authService";
import { authManager } from "./authAdapter";
import { productionOrderReader } from "./productionOrderReader";
import { getCustomerProfileEndpoint, resolveCustomerDataSource } from "./customerDataSourceResolver";

export const orderService = {
  async getOrders(userId?: string, legacySassId?: string): Promise<Order[]> {
    const cleanUserId = (userId || "").trim();
    if (!cleanUserId) return [];

    let resolvedUserId = cleanUserId;
    let resolvedLegacySassId = legacySassId;
    try {
      const ds = resolveCustomerDataSource(cleanUserId);
      resolvedUserId = ds.canonicalCustomerId;
      resolvedLegacySassId = legacySassId || ds.legacySassId;
    } catch {
      // fallback
    }

    if (authManager.getMode() === "production") {
      const activeAdapter = authManager.getActiveAdapter();
      const authUser = activeAdapter.getCurrentUser();
      const currentUser = authService.getCurrentUser();
      const finalLegacySassId = resolvedLegacySassId || currentUser?.legacySassId;
      if (finalLegacySassId) {
        return productionOrderReader.getCustomerOrders(resolvedUserId, authUser?.uid, undefined, finalLegacySassId);
      }
      return productionOrderReader.getCustomerOrders(resolvedUserId, authUser?.uid);
    }

    const orders = await apiClient.get<Order[]>("/orders", { userId: resolvedUserId });
    return (orders || [])
      .filter((o) => o && o.userId === resolvedUserId)
      .sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  },

  async getOrderById(orderId: string, userId?: string, legacySassId?: string): Promise<Order | null> {
    try {
      const cleanOrderId = (orderId || "").trim();
      const cleanUserId = (userId || "").trim();
      if (!cleanOrderId) return null;

      let resolvedUserId = cleanUserId;
      let resolvedLegacySassId = legacySassId;
      if (cleanUserId) {
        try {
          const ds = resolveCustomerDataSource(cleanUserId);
          resolvedUserId = ds.canonicalCustomerId;
          resolvedLegacySassId = legacySassId || ds.legacySassId;
        } catch {
          // fallback
        }
      }

      if (authManager.getMode() === "production") {
        if (!resolvedUserId) {
          return null;
        }
        const activeAdapter = authManager.getActiveAdapter();
        const authUser = activeAdapter.getCurrentUser();
        const currentUser = authService.getCurrentUser();
        const finalLegacySassId = resolvedLegacySassId || currentUser?.legacySassId;
        if (finalLegacySassId) {
          return await productionOrderReader.getOrderById(cleanOrderId, resolvedUserId, authUser?.uid, undefined, finalLegacySassId);
        }
        return await productionOrderReader.getOrderById(cleanOrderId, resolvedUserId, authUser?.uid);
      }

      const queryParams: Record<string, string> = { orderId: cleanOrderId };
      if (cleanUserId) {
        queryParams["userId"] = cleanUserId;
      }

      const orders = await apiClient.get<Order[]>("/orders", queryParams);
      const order =
        orders && orders.length > 0
          ? orders[0]
          : await apiClient.get<Order>(
              `/orders/${encodeURIComponent(cleanOrderId)}${cleanUserId ? `?userId=${encodeURIComponent(cleanUserId)}` : ""}`
            );
      if (order && cleanUserId && order.userId !== cleanUserId) {
        throw new Error("Access denied: You cannot view another customer's order.");
      }
      return order ?? null;
    } catch (err: any) {
      if (err.message?.includes("Access denied")) throw err;
      if (err.message?.includes("404") || err.status === 404) return null;
      throw err;
    }
  },

  async createOrder(params: {
    userId: string;
    customerName: string;
    phone: string;
    address: Address;
    deliverySlot: DeliverySlot;
    paymentMethod: "online" | "cod" | "upi";
    cartItems: CartItem[];
    subtotal: number;
    productSavings: number;
    deliveryFee: number;
    coinDiscount: number;
    coinsRedeemed?: number;
    couponDiscount: number;
    totalAmount: number;
    paymentDetails?: Record<string, any>;
  }): Promise<Order> {
    const cleanUserId = (params.userId || "").trim();
    if (!cleanUserId) {
      throw new Error("Cannot place an order without a valid customer userId");
    }
    if (cleanUserId === "guest_session" || cleanUserId.startsWith("guest_")) {
      throw new Error("Authentication required: guest carts cannot place orders.");
    }

    if (
      params.paymentMethod === "online" &&
      !params.paymentDetails?.["paymentId"] &&
      !params.paymentDetails?.["transactionId"]
    ) {
      throw new Error(
        "Online order cannot be created until payment provider confirms the transaction."
      );
    }

    if (!params.cartItems || params.cartItems.length === 0) {
      throw new Error("Cannot place an order with an empty cart");
    }

    // Enforce dynamic delivery geofence validation (Settings/delivery radius)
    if (params.address) {
      const deliveryConfig = await settingsService.getDeliveryConfiguration();
      const serviceability = addressService.validateDeliveryServiceability(
        params.address,
        deliveryConfig
      );
      if (!serviceability.eligible) {
        const radius = deliveryConfig.deliveryRadiusKm;
        throw new Error(
          `Delivery address is outside the ${radius}km delivery boundary (${serviceability.distanceKm}km away).`
        );
      }
    }

    // Verify discount boundaries and exact total calculation
    const coinDisc = Math.max(0, params.coinDiscount || 0);
    const couponDisc = Math.max(0, params.couponDiscount || 0);
    const totalDiscounts = Math.min(params.subtotal, coinDisc + couponDisc);
    const expectedTotal = Math.max(0, params.subtotal - totalDiscounts + params.deliveryFee);

    // Resolve authoritative customer record and verify phone verification state
    const profileEndpoint = getCustomerProfileEndpoint(cleanUserId);
    let customerRecord: User | null = null;
    try {
      customerRecord = await apiClient.get<User>(profileEndpoint);
    } catch {
      try {
        customerRecord = await apiClient.get<User>(
          `/users/${encodeURIComponent(cleanUserId)}`
        );
      } catch {
        // null
      }
    }

    // Enforce Authoritative Customer Phone Verification Boundary Check
    if (!customerRecord || customerRecord.phoneVerified !== true) {
      throw new Error(
        "Phone verification required: Please verify your mobile number before placing an order."
      );
    }

    // Confirm verified canonical phone number
    const verifiedCanonicalPhone = customerRecord.phone || params.phone;
    if (!verifiedCanonicalPhone) {
      throw new Error(
        "Phone verification required: Customer profile does not have a verified contact number."
      );
    }

    const availableCoins =
      customerRecord && typeof customerRecord.smartCoins === "number"
        ? customerRecord.smartCoins
        : customerRecord && typeof customerRecord.coins === "number"
        ? customerRecord.coins
        : customerRecord?.availableCoins ?? 0;

    let coinsToDeduct = 0;
    if (typeof params.coinsRedeemed === "number" && params.coinsRedeemed > 0) {
      if (params.coinsRedeemed > availableCoins) {
        throw new Error(
          `Insufficient Smart Coins: requested redemption of ${params.coinsRedeemed} coins exceeds available balance of ${availableCoins} coins.`
        );
      }
      coinsToDeduct = params.coinsRedeemed;
    } else if (coinDisc > 0) {
      const calculatedCoins = convertRupeesToCoins(coinDisc);
      // Cap at available balance when coinsRedeemed was not explicitly supplied
      coinsToDeduct = Math.min(availableCoins, calculatedCoins);
    }

    // Generate atomic sequence test order ID: ORD-000xxxx with collision prevention
    let randSeq = Math.floor(1000 + Math.random() * 8999);
    let orderId = `ORD-000${randSeq}`;
    try {
      const existing = await apiClient.get<Order[]>("/orders", { userId: cleanUserId });
      const existingIds = new Set(existing.map((o) => o.orderId || o.id));
      while (existingIds.has(orderId)) {
        randSeq = Math.floor(1000 + Math.random() * 8999);
        orderId = `ORD-000${randSeq}`;
      }
    } catch {
      // Best effort check
    }

    const newOrder: Order = {
      id: orderId,
      orderId,
      userId: cleanUserId,
      customerName: params.customerName,
      phone: verifiedCanonicalPhone,
      status: "pending",
      createdAt: new Date().toISOString(),
      deliveryAddress: {
        houseNo: params.address.houseNo,
        street: params.address.street,
        ...(params.address.landmark !== undefined
          ? { landmark: params.address.landmark }
          : {}),
        city: params.address.city,
        pincode: params.address.pincode,
      },
      delivery: {
        type: params.deliverySlot.type,
        slot: params.deliverySlot.title,
        estimatedTime:
          params.deliverySlot.type === "express"
            ? "Within 60-90 minutes"
            : "Next scheduled delivery window",
      },
      payment: {
        method: params.paymentMethod,
        status:
          params.paymentMethod === "online"
            ? "paid"
            : params.paymentMethod === "upi"
            ? "awaiting_verification"
            : "pending_cod",
      },
      items: params.cartItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        unit: item.unit,
        unitSize: item.unitSize,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      coinsRedeemed: coinsToDeduct,
      coinsUsed: coinsToDeduct,
      pricingSummary: {
        subtotal: params.subtotal,
        productSavings: params.productSavings,
        deliveryFee: params.deliveryFee,
        coinDiscount: coinDisc,
        coinsRedeemed: coinsToDeduct,
        couponDiscount: couponDisc,
        totalAmount: expectedTotal,
      },
    };

    // Save order first — notification is only created after order persistence succeeds
    const createdOrder = await apiClient.post<Order>("/orders", newOrder);
    const committedOrderId = createdOrder?.orderId || createdOrder?.id || orderId;

    // Create persistent new-order notification (isolated from failing the order itself)
    try {
      await notificationService.createOrderPlacedNotification(createdOrder);
    } catch (notifErr) {
      console.error(
        `Order ${committedOrderId} was created, but failed to persist new-order notification:`,
        notifErr
      );
    }

    // Check existing coin history to prevent duplicate deductions or awards on retry
    let alreadyBurned = false;
    let alreadyEarned = false;
    try {
      const existingHistory = await coinService.getCoinHistory(cleanUserId);
      alreadyBurned = existingHistory.some(
        (tx) =>
          tx.id === `coin_burn_${committedOrderId}` ||
          (tx.orderId === committedOrderId && tx.type === "redeemed")
      );
      alreadyEarned = existingHistory.some(
        (tx) =>
          tx.id === `coin_earn_${committedOrderId}` ||
          (tx.orderId === committedOrderId && tx.type === "earned")
      );
    } catch {
      // History check best effort
    }

    // Record coin history if coins redeemed (deterministic ID per orderId prevents duplicates)
    if (coinsToDeduct > 0 && !alreadyBurned) {
      try {
        await apiClient.post("/coinHistory", {
          id: `coin_burn_${committedOrderId}`,
          userId: cleanUserId,
          orderId: committedOrderId,
          amount: coinsToDeduct, // Deduct the exact number of coins redeemed (e.g. 100 coins)
          type: "redeemed",
          description: `Smart Coins redeemed on Order #${committedOrderId}`,
          timestamp: createdOrder?.createdAt || new Date().toISOString(),
        });

        // Trigger coin redemption notification
        try {
          await notificationService.createCoinNotification({
            userId: cleanUserId,
            amount: coinsToDeduct,
            type: "redeemed",
            orderId: committedOrderId,
          });
        } catch {}
      } catch (coinBurnErr) {
        console.error("Failed to record coin redemption history:", coinBurnErr);
      }
    }

    // Award coins for purchase (approx 10% of subtotal as reward coins)
    const earnedCoins = Math.max(5, Math.floor(params.subtotal * 0.1));
    if (earnedCoins > 0 && !alreadyEarned) {
      try {
        await apiClient.post("/coinHistory", {
          id: `coin_earn_${committedOrderId}`,
          userId: cleanUserId,
          orderId: committedOrderId,
          amount: earnedCoins,
          type: "earned",
          description: `Smart Coins earned on Order #${committedOrderId}`,
          timestamp: createdOrder?.createdAt || new Date().toISOString(),
        });

        // Trigger coin earned notification
        try {
          await notificationService.createCoinNotification({
            userId: cleanUserId,
            amount: earnedCoins,
            type: "earned",
            orderId: committedOrderId,
          });
        } catch {}
      } catch (coinEarnErr) {
        console.error("Failed to record earned coin history:", coinEarnErr);
      }
    }

    // Update customer's coin balance in persistent storage with retry deduplication
    const effectiveDeduction = !alreadyBurned && coinsToDeduct > 0 ? coinsToDeduct : 0;
    const effectiveAward = !alreadyEarned && earnedCoins > 0 ? earnedCoins : 0;

    if (effectiveDeduction > 0 || effectiveAward > 0) {
      try {
        const userEndpoint = getCustomerProfileEndpoint(cleanUserId);
        const latestUser = await apiClient.get<User>(userEndpoint);
        if (latestUser) {
          const startingBalance =
            typeof latestUser.smartCoins === "number"
              ? latestUser.smartCoins
              : typeof latestUser.coins === "number"
              ? latestUser.coins
              : latestUser.availableCoins ?? 0;
          const updatedCoins = Math.max(
            0,
            startingBalance - effectiveDeduction + effectiveAward
          );

          const patchPayload: Record<string, unknown> = {
            smartCoins: updatedCoins,
          };
          if (
            effectiveAward > 0 &&
            ("earnedCoins" in latestUser || latestUser.earnedCoins !== undefined)
          ) {
            patchPayload["earnedCoins"] =
              (latestUser.earnedCoins || 0) + effectiveAward;
          }

          const patchedUser = await apiClient.patch<User>(
            userEndpoint,
            patchPayload
          );

          // Synchronize updated balance to local session storage immediately
          authService.syncUserSession({
            ...latestUser,
            ...patchedUser,
            smartCoins: updatedCoins,
          });
        }
      } catch (userCoinErr) {
        console.error("Failed to update user coin balance:", userCoinErr);
      }
    }

    // Clear only this customer's cart in backend
    await cartService.clearCart(cleanUserId);

    return createdOrder;
  },

  /**
   * Shared order status transition point.
   * - Validates the target status against SUPPORTED_ORDER_STATUSES.
   * - Enforces customer ownership when userId is provided.
   * - No-ops when the status has not changed (preventing duplicate notifications).
   * - Persists the status update and creates exactly one lifecycle notification per genuine transition.
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    userId?: string
  ): Promise<Order> {
    if (!SUPPORTED_ORDER_STATUSES.includes(newStatus)) {
      throw new Error(
        `Unsupported order status "${newStatus}". Allowed statuses: ${SUPPORTED_ORDER_STATUSES.join(", ")}`
      );
    }

    const order = await this.getOrderById(orderId, userId);
    if (!order) {
      throw new Error("Order not found");
    }

    if (userId && order.userId !== userId) {
      throw new Error("Access denied: You cannot modify another customer's order.");
    }

    const previousStatus = order.status;
    if (previousStatus === newStatus) {
      // Status unchanged — do not patch or generate duplicate notification
      notificationService.recordObservedOrderStatus(
        order.userId,
        order.orderId || order.id,
        newStatus
      );
      return order;
    }

    const nowIso = new Date().toISOString();
    const patchPayload: Partial<Order> = {
      status: newStatus,
      updatedAt: nowIso,
    };

    if (newStatus === "delivered") {
      patchPayload.deliveredAt = nowIso;
    } else if (newStatus === "cancelled") {
      patchPayload.cancelledAt = nowIso;
      patchPayload.coinsRefunded = true;
      try {
        await this.processOrderCancellationCoins(order);
      } catch (refundErr) {
        console.error(
          `Order ${order.orderId} cancellation coin processing failed:`,
          refundErr
        );
        throw refundErr;
      }
    }

    const updatedOrder = await apiClient.patch<Order>(
      `/orders/${encodeURIComponent(order.id)}`,
      patchPayload
    );

    try {
      await notificationService.createOrderStatusNotification(
        updatedOrder,
        previousStatus,
        newStatus,
        nowIso
      );
    } catch (notifErr) {
      console.error(
        `Order ${order.orderId} status updated to "${newStatus}", but failed to create lifecycle notification:`,
        notifErr
      );
    }

    return updatedOrder;
  },

  /**
   * Authoritative, idempotent refund of redeemed Smart Coins and reversal of unearned
   * reward coins upon order cancellation.
   * - Restores exact coins redeemed on this order.
   * - No-ops if 0 coins were redeemed (or if no coins were charged).
   * - Prevents duplicate refunds or clawbacks if cancellation is retried.
   * - Writes auditable transactions to /coinHistory with verified schema types.
   * - Updates /users/:userId and synchronizes auth session.
   */
  async processOrderCancellationCoins(order: Order): Promise<{
    refundedCoins: number;
    clawedBackCoins: number;
    newBalance: number;
  }> {
    const cleanUserId = (order.userId || "").trim();
    const orderId = order.orderId || order.id;
    if (!cleanUserId || !orderId) {
      return { refundedCoins: 0, clawedBackCoins: 0, newBalance: 0 };
    }

    // 1. Fetch user's coin history to inspect charged and awarded amounts
    let history: any[] = [];
    try {
      history = await coinService.getCoinHistory(cleanUserId);
    } catch {
      // Best effort history fetch
    }

    // 2. Multi-layer resolution of exact coins redeemed on this order
    const burnTx = history.find(
      (tx) =>
        tx.id === `coin_burn_${orderId}` ||
        (tx.orderId === orderId &&
          tx.type === "redeemed" &&
          !String(tx.id || "").startsWith("coin_clawback_"))
    );

    let redeemedCoins = 0;
    if (typeof order.coinsRedeemed === "number" && order.coinsRedeemed > 0) {
      redeemedCoins = order.coinsRedeemed;
    } else if (typeof order.coinsUsed === "number" && order.coinsUsed > 0) {
      redeemedCoins = order.coinsUsed;
    } else if (
      typeof order.pricingSummary?.coinsRedeemed === "number" &&
      order.pricingSummary.coinsRedeemed > 0
    ) {
      redeemedCoins = order.pricingSummary.coinsRedeemed;
    } else if (burnTx && typeof burnTx.amount === "number" && burnTx.amount > 0) {
      redeemedCoins = burnTx.amount;
    } else if (order.pricingSummary?.coinDiscount && order.pricingSummary.coinDiscount > 0) {
      redeemedCoins = convertRupeesToCoins(order.pricingSummary.coinDiscount);
    }

    // 3. Idempotency guard: check if redemption was already refunded
    const alreadyRefunded = history.some(
      (tx) =>
        tx.id === `coin_refund_${orderId}` ||
        (tx.orderId === orderId &&
          String(tx.description || "").toLowerCase().includes("refund"))
    );

    // 4. Determine earned reward coins awarded for this order
    let earnedCoins = 0;
    const earnTx = history.find(
      (tx) =>
        (tx.id === `coin_earn_${orderId}` ||
          (tx.orderId === orderId &&
            tx.type === "earned" &&
            !String(tx.id || "").startsWith("coin_refund_"))) &&
        !String(tx.description || "").toLowerCase().includes("refund")
    );
    if (earnTx && typeof earnTx.amount === "number" && earnTx.amount > 0) {
      earnedCoins = earnTx.amount;
    }

    // 5. Idempotency guard: check if earned reward coins were already clawed back
    const alreadyClawedBack = history.some(
      (tx) =>
        tx.id === `coin_clawback_${orderId}` ||
        (tx.orderId === orderId &&
          String(tx.description || "").toLowerCase().includes("reversed"))
    );

    const effectiveRefund = !alreadyRefunded && redeemedCoins > 0 ? redeemedCoins : 0;
    const effectiveClawback = !alreadyClawedBack && earnedCoins > 0 ? earnedCoins : 0;

    if (effectiveRefund === 0 && effectiveClawback === 0) {
      const currentCoins = await coinService.getUserCoins(cleanUserId);
      return { refundedCoins: 0, clawedBackCoins: 0, newBalance: currentCoins };
    }

    const nowIso = new Date().toISOString();

    // 6. Post refund transaction to coinHistory if coins were redeemed
    if (effectiveRefund > 0) {
      try {
        await apiClient.post("/coinHistory", {
          id: `coin_refund_${orderId}`,
          userId: cleanUserId,
          orderId: orderId,
          amount: effectiveRefund,
          type: "earned", // Conforms to firestoreAdapter validation ['earned', 'redeemed']
          description: `Smart Coins refund for cancelled Order #${orderId}`,
          timestamp: nowIso,
        });
      } catch (refundErr) {
        console.error(`Failed to record coin refund for order #${orderId}:`, refundErr);
        throw new Error(`Failed to record coin refund for cancelled order #${orderId}`);
      }
    }

    // 7. Post clawback transaction to coinHistory if unearned reward coins need reversal
    if (effectiveClawback > 0) {
      try {
        await apiClient.post("/coinHistory", {
          id: `coin_clawback_${orderId}`,
          userId: cleanUserId,
          orderId: orderId,
          amount: effectiveClawback,
          type: "redeemed", // Conforms to firestoreAdapter validation ['earned', 'redeemed']
          description: `Smart Coins reversed for cancelled Order #${orderId}`,
          timestamp: nowIso,
        });
      } catch (clawErr) {
        console.error(`Failed to record coin clawback for order #${orderId}:`, clawErr);
      }
    }

    // 8. Authoritative user balance update in persistent storage
    let newBalance = 0;
    try {
      const userEndpoint = getCustomerProfileEndpoint(cleanUserId);
      const latestUser = await apiClient.get<User>(userEndpoint);
      if (latestUser) {
        const startingBalance =
          typeof latestUser.smartCoins === "number"
            ? latestUser.smartCoins
            : typeof latestUser.coins === "number"
            ? latestUser.coins
            : latestUser.availableCoins ?? 0;

        newBalance = Math.max(0, startingBalance + effectiveRefund - effectiveClawback);

        const patchPayload: Record<string, unknown> = {
          smartCoins: newBalance,
        };
        if (
          effectiveClawback > 0 &&
          ("earnedCoins" in latestUser || latestUser.earnedCoins !== undefined)
        ) {
          patchPayload["earnedCoins"] = Math.max(
            0,
            (latestUser.earnedCoins || 0) - effectiveClawback
          );
        }

        const patchedUser = await apiClient.patch<User>(
          userEndpoint,
          patchPayload
        );

        // 9. Synchronize session storage immediately
        authService.syncUserSession({
          ...latestUser,
          ...patchedUser,
          smartCoins: newBalance,
          coins: newBalance,
        });
      }
    } catch (balanceErr) {
      console.error(
        `Failed to update customer balance during cancellation of order #${orderId}:`,
        balanceErr
      );
      throw balanceErr;
    }

    return {
      refundedCoins: effectiveRefund,
      clawedBackCoins: effectiveClawback,
      newBalance,
    };
  },

  async cancelOrder(orderId: string, userId?: string): Promise<Order> {
    const order = await this.getOrderById(orderId, userId);
    if (!order) throw new Error("Order not found");

    if (userId && order.userId !== userId) {
      throw new Error("Access denied: You cannot cancel another customer's order.");
    }

    // Enforce verified business rule: Cancellation allowed ONLY if pending or processing
    if (order.status !== "pending" && order.status !== "processing") {
      throw new Error(
        `Cannot cancel order with status "${order.status}". Cancellation is only permitted while pending or processing.`
      );
    }

    return this.updateOrderStatus(orderId, "cancelled", userId);
  },

  async requestReturn(orderId: string, userId?: string): Promise<Order> {
    const order = await this.getOrderById(orderId, userId);
    if (!order) throw new Error("Order not found");

    if (userId && order.userId !== userId) {
      throw new Error("Access denied: You cannot request return for another customer's order.");
    }

    // Enforce verified business rule: Return allowed ONLY if delivered
    if (order.status !== "delivered") {
      throw new Error("Returns can only be requested for delivered orders.");
    }

    // Enforce verified business rule: Return restricted to 24-hour window after delivery
    const deliveredTimestamp = order.deliveredAt || order.createdAt;
    if (deliveredTimestamp) {
      const deliveredTime = new Date(deliveredTimestamp).getTime();
      const now = Date.now();
      const twentyFourHoursMs = 24 * 60 * 60 * 1000;
      if (now - deliveredTime > twentyFourHoursMs) {
        throw new Error("Returns can only be requested within 24 hours of delivery.");
      }
    }

    return this.updateOrderStatus(orderId, "returned", userId);
  },

  async reorder(
    order: Order,
    userId: string
  ): Promise<{ addedCount: number; unavailableCount: number; unavailableNames: string[] }> {
    let addedCount = 0;
    let unavailableCount = 0;
    const unavailableNames: string[] = [];

    for (const item of order.items) {
      try {
        const product = await apiClient.get<any>(`/products/${item.productId}`);
        if (!product || product.isActive === false) {
          unavailableCount++;
          unavailableNames.push(item.name);
          continue;
        }

        // Match exact variant option or pick first in-stock option
        let optIndex = product.options.findIndex(
          (o: any) => o.unit === item.unit && o.unitSize === item.unitSize && o.stock > 0
        );
        if (optIndex === -1) {
          optIndex = product.options.findIndex((o: any) => o.stock > 0);
        }

        if (optIndex !== -1) {
          await cartService.addToCart(product, optIndex, item.quantity, userId);
          addedCount++;
        } else {
          unavailableCount++;
          unavailableNames.push(item.name);
        }
      } catch {
        unavailableCount++;
        unavailableNames.push(item.name);
      }
    }

    return { addedCount, unavailableCount, unavailableNames };
  },
};
