import { describe, it, expect, beforeEach } from "vitest";
import { orderService } from "../services/orderService";
import {
  coinService,
  convertCoinsToRupees,
  convertRupeesToCoins,
  OFFICIAL_COIN_CONVERSION_RATE,
} from "../services/coinService";
import { authService, AUTH_STORAGE_KEY } from "../services/authService";
import { apiClient } from "../services/apiClient";
import type { User, Address, DeliverySlot, CartItem, Order, CoinTransaction } from "../types";

describe("Phase 7.4: Amman Coin Deduction & Cancellation Refund End-to-End Regression", () => {
  const eligibleAddress: Address = {
    id: "addr_coins_refund_test",
    userId: "SASS_REFUND_USER",
    tag: "Home",
    name: "Coins Refund Customer",
    phone: "+91 99999 55555",
    houseNo: "45",
    street: "Nethaji Road",
    city: "Gobichettipalayam",
    pincode: "638454",
    lat: 11.4598,
    lng: 77.334,
    isDefault: true,
  };

  const testSlot: DeliverySlot = {
    id: "slot_coins_refund_test",
    type: "express",
    title: "Express 60-Min Dispatch",
    subtitle: "Within 60-90 minutes",
    charge: 29,
  };

  const sampleCartItem: CartItem = {
    id: "item_oil_500",
    cartKey: "item_oil_500",
    userId: "SASS_REFUND_USER",
    productId: "prod_groundnut_oil",
    name: "Mara Chekku Groundnut Oil",
    image: "/images/oil.jpg",
    unit: "ml",
    unitSize: "500",
    price: 200,
    mrp: 240,
    quantity: 1,
    optionIndex: 0,
    stock: 25,
  };

  const createTestUser = async (userId: string, initialCoins: number): Promise<User> => {
    const userPayload: User = {
      id: userId,
      userId: userId,
      name: `Customer ${userId}`,
      phone: "+91 99999 55555",
      email: `${userId.toLowerCase()}@example.com`,
      coins: initialCoins,
      availableCoins: initialCoins,
      earnedCoins: 0,
      isVIP: false,
      referralCode: userId,
      createdAt: new Date().toISOString(),
    };

    let createdUser: User;
    try {
      createdUser = await apiClient.post<User>("/users", userPayload);
    } catch {
      createdUser = await apiClient.patch<User>(`/users/${encodeURIComponent(userId)}`, {
        coins: initialCoins,
        availableCoins: initialCoins,
        earnedCoins: 0,
      });
    }

    if (initialCoins > 0) {
      try {
        await apiClient.post("/coinHistory", {
          id: `coin_init_${userId}`,
          userId,
          amount: initialCoins,
          type: "earned",
          description: "Initial balance / welcome credit",
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Initial history best effort
      }
    }

    return createdUser;
  };

  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("1. Starting with 254 coins, redeeming 100 coins produces a ₹5 discount and leaves 154 coins before separate rewards", async () => {
    const userId = "SASS_REFUND_SCENARIO_01";
    const startingBalance = 254;
    await createTestUser(userId, startingBalance);

    authService.syncUserSession({
      id: userId,
      userId: userId,
      coins: startingBalance,
      availableCoins: startingBalance,
      name: "Customer 01",
      phone: "+91 99999 55555",
      email: `${userId.toLowerCase()}@example.com`,
      isVIP: false,
      referralCode: userId,
      createdAt: new Date().toISOString(),
    });

    const subtotal = 200;
    const coinsToRedeem = 100;
    const coinDiscount = convertCoinsToRupees(coinsToRedeem);
    expect(coinDiscount).toBe(5.0); // Exact ₹5.00 discount at 1 coin = ₹0.05
    expect(OFFICIAL_COIN_CONVERSION_RATE).toBe(0.05);

    const deliveryFee = 29;
    const expectedPayable = subtotal - coinDiscount + deliveryFee; // 200 - 5 + 29 = 224

    const order = await orderService.createOrder({
      userId,
      customerName: "Customer 01",
      phone: "+91 99999 55555",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal,
      productSavings: 40,
      deliveryFee,
      coinDiscount,
      coinsRedeemed: coinsToRedeem,
      couponDiscount: 0,
      totalAmount: expectedPayable,
    });

    expect(order.orderId).toBeTruthy();
    expect(order.pricingSummary.coinDiscount).toBe(5.0);
    expect(order.pricingSummary.totalAmount).toBe(224);

    // Verify balance after deduction: 254 - 100 = 154 before separate rewards
    const expectedDeductedBalance = startingBalance - coinsToRedeem;
    expect(expectedDeductedBalance).toBe(154);

    // With purchase rewards (10% of 200 = 20 coins), total net balance is 154 + 20 = 174
    const expectedEarnedCoins = Math.max(5, Math.floor(subtotal * 0.1));
    expect(expectedEarnedCoins).toBe(20);

    const updatedUser = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    expect(updatedUser.coins).toBe(expectedDeductedBalance + expectedEarnedCoins);

    const sessionUser = authService.getCurrentUser();
    expect(sessionUser?.coins).toBe(expectedDeductedBalance + expectedEarnedCoins);
  });

  it("2. The order records the actual redemption amount (100 coins), not 1 coin or ₹5", async () => {
    const userId = "SASS_REFUND_SCENARIO_02";
    await createTestUser(userId, 254);

    const coinsToRedeem = 100;
    const coinDiscount = 5.0;

    const order = await orderService.createOrder({
      userId,
      customerName: "Customer 02",
      phone: "+91 99999 55555",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal: 200,
      productSavings: 40,
      deliveryFee: 29,
      coinDiscount,
      coinsRedeemed: coinsToRedeem,
      couponDiscount: 0,
      totalAmount: 224,
    });

    // Check in-memory returned order
    expect(order.coinsRedeemed).toBe(100);
    expect(order.coinsUsed).toBe(100);
    expect(order.pricingSummary.coinsRedeemed).toBe(100);
    expect(order.pricingSummary.coinDiscount).toBe(5.0);

    // Ensure it is NOT recorded as 1 coin or ₹5 discount value
    expect(order.coinsRedeemed).not.toBe(1);
    expect(order.coinsRedeemed).not.toBe(5);

    // Verify persisted record in storage
    const fetchedOrder = await orderService.getOrderById(order.orderId, userId);
    expect(fetchedOrder).not.toBeNull();
    expect(fetchedOrder?.coinsRedeemed).toBe(100);
    expect(fetchedOrder?.coinsUsed).toBe(100);
    expect(fetchedOrder?.pricingSummary.coinsRedeemed).toBe(100);
    expect(fetchedOrder?.pricingSummary.coinDiscount).toBe(5.0);
  });

  it("3. Cancelling the order restores the 100 redeemed coins, resulting in 254 coins before any separate rewards", async () => {
    const userId = "SASS_REFUND_SCENARIO_03";
    const startingBalance = 254;
    await createTestUser(userId, startingBalance);

    authService.syncUserSession({
      id: userId,
      userId: userId,
      coins: startingBalance,
      availableCoins: startingBalance,
      name: "Customer 03",
      phone: "+91 99999 55555",
      email: `${userId.toLowerCase()}@example.com`,
      isVIP: false,
      referralCode: userId,
      createdAt: new Date().toISOString(),
    });

    const order = await orderService.createOrder({
      userId,
      customerName: "Customer 03",
      phone: "+91 99999 55555",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal: 200,
      productSavings: 40,
      deliveryFee: 29,
      coinDiscount: 5.0,
      coinsRedeemed: 100,
      couponDiscount: 0,
      totalAmount: 224,
    });

    // Now customer cancels the pending order
    const cancelledOrder = await orderService.cancelOrder(order.orderId, userId);
    expect(cancelledOrder.status).toBe("cancelled");
    expect(cancelledOrder.coinsRefunded).toBe(true);

    // Verify persisted backend user balance is fully restored to 254
    const restoredUser = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    expect(restoredUser.coins).toBe(startingBalance);
    expect(restoredUser.availableCoins).toBe(startingBalance);

    // Verify active session is restored to 254
    const localUser = authService.getCurrentUser();
    expect(localUser?.coins).toBe(startingBalance);

    // Verify coin history includes the refund record
    const history = await coinService.getCoinHistory(userId);
    const refundTx = history.find((t) => t.id === `coin_refund_${order.orderId}`);
    expect(refundTx).toBeDefined();
    expect(refundTx?.amount).toBe(100);
    expect(refundTx?.type).toBe("earned");
    expect(refundTx?.description).toContain(`Amman Coins refund for cancelled Order #${order.orderId}`);

    // Verify clawback of the unearned purchase reward coins (20)
    const clawbackTx = history.find((t) => t.id === `coin_clawback_${order.orderId}`);
    expect(clawbackTx).toBeDefined();
    expect(clawbackTx?.amount).toBe(20);
    expect(clawbackTx?.type).toBe("redeemed");
  });

  it("4. Refreshing the page or reopening the Rewards page preserves the correct balance", async () => {
    const userId = "SASS_REFUND_SCENARIO_04";
    const startingBalance = 254;
    await createTestUser(userId, startingBalance);

    const order = await orderService.createOrder({
      userId,
      customerName: "Customer 04",
      phone: "+91 99999 55555",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal: 200,
      productSavings: 40,
      deliveryFee: 29,
      coinDiscount: 5.0,
      coinsRedeemed: 100,
      couponDiscount: 0,
      totalAmount: 224,
    });

    await orderService.cancelOrder(order.orderId, userId);

    // Simulate page refresh / new session: clear in-memory and re-fetch from backend
    const authoritativeUser = await authService.fetchUser(userId);
    expect(authoritativeUser?.coins).toBe(startingBalance);

    // Reopen Rewards page: authoritative getUserCoins returns 254
    const rewardsBalance = await coinService.getUserCoins(userId);
    expect(rewardsBalance).toBe(startingBalance);

    // Calculate total net balance across full ledger history
    const history = await coinService.getCoinHistory(userId);
    const ledgerStats = coinService.calculateLedgerStats(history);
    expect(ledgerStats.netBalance).toBe(startingBalance);
  });

  it("5. Repeated cancellation does not issue a second refund (Idempotency)", async () => {
    const userId = "SASS_REFUND_SCENARIO_05";
    const startingBalance = 254;
    await createTestUser(userId, startingBalance);

    const order = await orderService.createOrder({
      userId,
      customerName: "Customer 05",
      phone: "+91 99999 55555",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal: 200,
      productSavings: 40,
      deliveryFee: 29,
      coinDiscount: 5.0,
      coinsRedeemed: 100,
      couponDiscount: 0,
      totalAmount: 224,
    });

    // First cancellation
    await orderService.cancelOrder(order.orderId, userId);

    const userAfterFirstCancel = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    expect(userAfterFirstCancel.coins).toBe(startingBalance);

    // Second cancellation call (retry/duplicate click)
    const retryResult = await orderService.processOrderCancellationCoins(order);
    expect(retryResult.refundedCoins).toBe(0); // No second refund issued
    expect(retryResult.clawedBackCoins).toBe(0);
    expect(retryResult.newBalance).toBe(startingBalance);

    // Verify balance remains exactly 254
    const userAfterSecondCancel = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    expect(userAfterSecondCancel.coins).toBe(startingBalance);

    // Verify coin history has exactly ONE refund transaction
    const history = await coinService.getCoinHistory(userId);
    const refundTransactions = history.filter((t) => t.id === `coin_refund_${order.orderId}`);
    expect(refundTransactions.length).toBe(1);
  });

  it("6. Orders using zero coins do not deduct or refund coins", async () => {
    const userId = "SASS_REFUND_SCENARIO_06";
    const startingBalance = 254;
    await createTestUser(userId, startingBalance);

    const order = await orderService.createOrder({
      userId,
      customerName: "Customer 06",
      phone: "+91 99999 55555",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal: 200,
      productSavings: 40,
      deliveryFee: 29,
      coinDiscount: 0,
      coinsRedeemed: 0,
      couponDiscount: 0,
      totalAmount: 229,
    });

    // Zero coins redeemed
    expect(order.coinsRedeemed).toBe(0);

    const historyAfterPlace = await coinService.getCoinHistory(userId);
    const burnTx = historyAfterPlace.find((t) => t.id === `coin_burn_${order.orderId}`);
    expect(burnTx).toBeUndefined(); // No burn transaction

    // Cancel order
    await orderService.cancelOrder(order.orderId, userId);

    const historyAfterCancel = await coinService.getCoinHistory(userId);
    const refundTx = historyAfterCancel.find((t) => t.id === `coin_refund_${order.orderId}`);
    expect(refundTx).toBeUndefined(); // No refund transaction for 0-coin order

    // Balance returns to pre-order starting balance
    const userAfterCancel = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    expect(userAfterCancel.coins).toBe(startingBalance);
  });

  it("7. Failed order placement does not deduct coins", async () => {
    const userId = "SASS_REFUND_SCENARIO_07";
    const startingBalance = 254;
    await createTestUser(userId, startingBalance);

    // Attempt to redeem 300 coins when balance is only 254
    await expect(
      orderService.createOrder({
        userId,
        customerName: "Customer 07",
        phone: "+91 99999 55555",
        address: { ...eligibleAddress, userId },
        deliverySlot: testSlot,
        paymentMethod: "online",
        cartItems: [sampleCartItem],
        subtotal: 200,
        productSavings: 40,
        deliveryFee: 29,
        coinDiscount: 15.0,
        coinsRedeemed: 300,
        couponDiscount: 0,
        totalAmount: 214,
      })
    ).rejects.toThrow(/Insufficient Amman Coins/);

    // Balance remains untouched at 254
    const userAfterFailedOrder = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    expect(userAfterFailedOrder.coins).toBe(startingBalance);

    const history = await coinService.getCoinHistory(userId);
    const orderTransactions = history.filter(
      (t) => t.id.startsWith("coin_burn_") || t.id.startsWith("coin_earn_")
    );
    expect(orderTransactions.length).toBe(0);
  });

  it("8. Failed cancellation does not silently lose the redeemed coins", async () => {
    const userId = "SASS_REFUND_SCENARIO_08";
    const startingBalance = 254;
    await createTestUser(userId, startingBalance);

    const order = await orderService.createOrder({
      userId,
      customerName: "Customer 08",
      phone: "+91 99999 55555",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal: 200,
      productSavings: 40,
      deliveryFee: 29,
      coinDiscount: 5.0,
      coinsRedeemed: 100,
      couponDiscount: 0,
      totalAmount: 224,
    });

    // Advance order to "in transit" so cancellation is rejected by business policy
    await orderService.updateOrderStatus(order.orderId, "in transit", userId);

    // Attempting to cancel an in-transit order must throw
    await expect(orderService.cancelOrder(order.orderId, userId)).rejects.toThrow(
      /Cannot cancel order with status "in transit"/
    );

    // Check that order status was not changed to cancelled
    const activeOrder = await orderService.getOrderById(order.orderId, userId);
    expect(activeOrder?.status).toBe("in transit");

    // Check that coin refund was NOT issued for the rejected cancellation
    const history = await coinService.getCoinHistory(userId);
    const refundTx = history.find((t) => t.id === `coin_refund_${order.orderId}`);
    expect(refundTx).toBeUndefined();
  });

  it("9. Coin history and displayed balance agree across calculations", async () => {
    const userId = "SASS_REFUND_SCENARIO_09";
    const startingBalance = 254;
    await createTestUser(userId, startingBalance);

    // Create and cancel order
    const order = await orderService.createOrder({
      userId,
      customerName: "Customer 09",
      phone: "+91 99999 55555",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal: 200,
      productSavings: 40,
      deliveryFee: 29,
      coinDiscount: 5.0,
      coinsRedeemed: 100,
      couponDiscount: 0,
      totalAmount: 224,
    });

    await orderService.cancelOrder(order.orderId, userId);

    const history = await coinService.getCoinHistory(userId);
    const stats = coinService.calculateLedgerStats(history);
    const backendCoins = await coinService.getUserCoins(userId);
    const localCoins = authService.getCurrentUser()?.coins;

    // Both displayed session balance and ledger stats netBalance agree with backend user record
    expect(backendCoins).toBe(startingBalance);
    expect(localCoins).toBe(startingBalance);
    expect(stats.netBalance).toBe(startingBalance);
  });

  it("10. Existing earning rules still work and are not duplicated", async () => {
    const userId = "SASS_REFUND_SCENARIO_10";
    await createTestUser(userId, 100);

    const subtotal = 350;
    const expectedEarned = Math.max(5, Math.floor(subtotal * 0.1)); // 35 coins
    expect(expectedEarned).toBe(35);

    const order = await orderService.createOrder({
      userId,
      customerName: "Customer 10",
      phone: "+91 99999 55555",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal,
      productSavings: 40,
      deliveryFee: 29,
      coinDiscount: 0,
      coinsRedeemed: 0,
      couponDiscount: 0,
      totalAmount: subtotal + 29,
    });

    // Check earned transaction
    const history = await coinService.getCoinHistory(userId);
    const earnTransactions = history.filter((t) => t.id === `coin_earn_${order.orderId}`);
    expect(earnTransactions.length).toBe(1);
    expect(earnTransactions[0]?.amount).toBe(35);

    // Verify balance = 100 + 35 = 135
    const user = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    expect(user.coins).toBe(135);
  });
});
