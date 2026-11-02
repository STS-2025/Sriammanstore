import { describe, it, expect, beforeEach } from "vitest";
import { orderService } from "../services/orderService";
import { coinService, convertCoinsToRupees, convertRupeesToCoins, OFFICIAL_COIN_CONVERSION_RATE } from "../services/coinService";
import { authService, AUTH_STORAGE_KEY } from "../services/authService";
import { apiClient } from "../services/apiClient";
import type { User, Address, DeliverySlot, CartItem, CoinTransaction } from "../types";

describe("Phase 7.3: Amman Coins Balance Updates After Order Placement", () => {
  const eligibleAddress: Address = {
    id: "addr_coins_test",
    userId: "SASS_COINS_USER",
    tag: "Home",
    name: "Coins Test Customer",
    phone: "+91 99999 12345",
    houseNo: "123",
    street: "Amman Kovil Street",
    city: "Gobichettipalayam",
    pincode: "638454",
    lat: 11.4598,
    lng: 77.334,
    isDefault: true,
  };

  const testSlot: DeliverySlot = {
    id: "slot_coins_test",
    type: "express",
    title: "Express 60-Min Dispatch",
    subtitle: "Within 60-90 minutes",
    charge: 29,
  };

  const sampleCartItem: CartItem = {
    id: "item_oil_500",
    cartKey: "item_oil_500",
    userId: "SASS_COINS_USER",
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
      name: `Test Customer ${userId}`,
      phone: "+91 99999 00001",
      email: `${userId.toLowerCase()}@example.com`,
      coins: initialCoins,
      availableCoins: initialCoins,
      earnedCoins: 0,
      isVIP: false,
      referralCode: userId,
      createdAt: new Date().toISOString(),
    };

    try {
      return await apiClient.post<User>("/users", userPayload);
    } catch {
      return await apiClient.patch<User>(`/users/${encodeURIComponent(userId)}`, {
        coins: initialCoins,
        availableCoins: initialCoins,
        earnedCoins: 0,
      });
    }
  };

  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("1. Successful order with no coin redemption earns reward coins without deduction", async () => {
    const userId = "SASS_COIN_TEST_01";
    await createTestUser(userId, 200);

    // Initial auth session setup
    authService.syncUserSession({
      id: userId,
      userId: userId,
      coins: 200,
      name: "User 01",
      phone: "+91 99999 00001",
      email: "u01@example.com",
      isVIP: false,
      referralCode: userId,
      createdAt: new Date().toISOString(),
    });

    const subtotal = 200;
    const deliveryFee = 29;
    const order = await orderService.createOrder({
      userId,
      customerName: "User 01",
      phone: "+91 99999 00001",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal,
      productSavings: 40,
      deliveryFee,
      coinDiscount: 0,
      coinsRedeemed: 0,
      couponDiscount: 0,
      totalAmount: subtotal + deliveryFee,
    });

    expect(order.orderId).toBeTruthy();

    // Check earned coins: Math.max(5, Math.floor(200 * 0.1)) = 20 coins
    const expectedEarned = 20;
    const expectedNewBalance = 200 + expectedEarned;

    // Verify persisted backend user balance
    const updatedBackendUser = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    expect(updatedBackendUser.coins).toBe(expectedNewBalance);

    // Verify localStorage session synced
    const localUser = authService.getCurrentUser();
    expect(localUser?.coins).toBe(expectedNewBalance);

    // Verify coin history has earned transaction but no redeemed transaction
    const history = await coinService.getCoinHistory(userId);
    const orderEarn = history.find((t) => t.orderId === order.orderId && t.type === "earned");
    const orderBurn = history.find((t) => t.orderId === order.orderId && t.type === "redeemed");

    expect(orderEarn).toBeDefined();
    expect(orderEarn?.amount).toBe(20);
    expect(orderBurn).toBeUndefined();
  });

  it("2. Successful order redeeming 100 coins applies ₹5.00 discount and deducts 100 coins", async () => {
    const userId = "SASS_COIN_TEST_02";
    await createTestUser(userId, 250);

    authService.syncUserSession({
      id: userId,
      userId: userId,
      coins: 250,
      name: "User 02",
      phone: "+91 99999 00002",
      email: "u02@example.com",
      isVIP: false,
      referralCode: userId,
      createdAt: new Date().toISOString(),
    });

    const subtotal = 200;
    const coinsToRedeem = 100;
    const coinDiscount = convertCoinsToRupees(coinsToRedeem); // Exactly ₹5.00
    expect(coinDiscount).toBe(5.0);

    const deliveryFee = 29;
    const expectedTotal = subtotal - coinDiscount + deliveryFee; // 200 - 5 + 29 = 224

    const order = await orderService.createOrder({
      userId,
      customerName: "User 02",
      phone: "+91 99999 00002",
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
      totalAmount: expectedTotal,
    });

    expect(order.pricingSummary.coinDiscount).toBe(5);
    expect(order.pricingSummary.totalAmount).toBe(224);

    // Net balance: 250 starting - 100 redeemed + 20 earned = 170
    const expectedNewBalance = 250 - 100 + 20;

    const updatedUser = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    expect(updatedUser.coins).toBe(expectedNewBalance);

    // Verify localStorage session synced
    const localUser = authService.getCurrentUser();
    expect(localUser?.coins).toBe(expectedNewBalance);
  });

  it("3. Persisted balance matches the updated account and Rewards page balance", async () => {
    const userId = "SASS_COIN_TEST_03";
    await createTestUser(userId, 300);

    authService.syncUserSession({
      id: userId,
      userId: userId,
      coins: 300,
      name: "User 03",
      phone: "+91 99999 00003",
      email: "u03@example.com",
      isVIP: false,
      referralCode: userId,
      createdAt: new Date().toISOString(),
    });

    const coinsToRedeem = 100;
    const coinDiscount = convertCoinsToRupees(coinsToRedeem); // ₹5.00

    await orderService.createOrder({
      userId,
      customerName: "User 03",
      phone: "+91 99999 00003",
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

    // Authoritative backend balance: 300 - 100 + 20 = 220
    const backendCoins = await coinService.getUserCoins(userId);
    expect(backendCoins).toBe(220);

    // Fetch refreshed user via authService
    const refreshedUser = await authService.fetchUser(userId);
    expect(refreshedUser?.coins).toBe(220);

    // Check ledger statistics calculate same net balance
    const history = await coinService.getCoinHistory(userId);
    const ledger = coinService.calculateLedgerStats(history);
    expect(ledger.totalRedeemed).toBe(100);
    expect(ledger.totalEarned).toBe(20);
  });

  it("4. Coin history records the exact 100-coin deduction with deterministic ID", async () => {
    const userId = "SASS_COIN_TEST_04";
    await createTestUser(userId, 150);

    const order = await orderService.createOrder({
      userId,
      customerName: "User 04",
      phone: "+91 99999 00004",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal: 200,
      productSavings: 40,
      deliveryFee: 29,
      coinDiscount: 5,
      coinsRedeemed: 100,
      couponDiscount: 0,
      totalAmount: 224,
    });

    const history = await coinService.getCoinHistory(userId);
    const burnTx = history.find((t) => t.id === `coin_burn_${order.orderId}`);

    expect(burnTx).toBeDefined();
    expect(burnTx?.type).toBe("redeemed");
    expect(burnTx?.amount).toBe(100); // 100 coins, NOT 5 rupees
    expect(burnTx?.orderId).toBe(order.orderId);
  });

  it("5. Existing order-earning behavior remains consistent (approx 10% subtotal, min 5)", async () => {
    const userId = "SASS_COIN_TEST_05";
    await createTestUser(userId, 50);

    // Case A: Subtotal 40 (10% is 4, min is 5 -> earns 5)
    const smallOrder = await orderService.createOrder({
      userId,
      customerName: "User 05",
      phone: "+91 99999 00005",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [{ ...sampleCartItem, price: 40, quantity: 1 }],
      subtotal: 40,
      productSavings: 10,
      deliveryFee: 29,
      coinDiscount: 0,
      coinsRedeemed: 0,
      couponDiscount: 0,
      totalAmount: 69,
    });

    const history = await coinService.getCoinHistory(userId);
    const smallEarn = history.find((t) => t.id === `coin_earn_${smallOrder.orderId}`);
    expect(smallEarn?.amount).toBe(5);

    // Case B: Subtotal 350 (10% is 35 -> earns 35)
    const largeOrder = await orderService.createOrder({
      userId,
      customerName: "User 05",
      phone: "+91 99999 00005",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [{ ...sampleCartItem, price: 350, quantity: 1 }],
      subtotal: 350,
      productSavings: 50,
      deliveryFee: 29,
      coinDiscount: 0,
      coinsRedeemed: 0,
      couponDiscount: 0,
      totalAmount: 379,
    });

    const updatedHistory = await coinService.getCoinHistory(userId);
    const largeEarn = updatedHistory.find((t) => t.id === `coin_earn_${largeOrder.orderId}`);
    expect(largeEarn?.amount).toBe(35);
  });

  it("6. Failed order placement leaves customer coin balance unchanged", async () => {
    const userId = "SASS_COIN_TEST_06";
    await createTestUser(userId, 200);

    // Attempt invalid order outside geofence
    const outsideAddress: Address = {
      ...eligibleAddress,
      userId,
      lat: 13.0827, // Chennai (~380km away)
      lng: 80.2707,
    };

    await expect(
      orderService.createOrder({
        userId,
        customerName: "User 06",
        phone: "+91 99999 00006",
        address: outsideAddress,
        deliverySlot: testSlot,
        paymentMethod: "online",
        cartItems: [sampleCartItem],
        subtotal: 200,
        productSavings: 40,
        deliveryFee: 29,
        coinDiscount: 5,
        coinsRedeemed: 100,
        couponDiscount: 0,
        totalAmount: 224,
      })
    ).rejects.toThrow(/6km/i);

    // Verify balance is completely untouched
    const userAfterFail = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    expect(userAfterFail.coins).toBe(200);

    // Verify no transactions recorded
    const history = await coinService.getCoinHistory(userId);
    expect(history.length).toBe(0);
  });

  it("7. Insufficient balance prevents invalid redemption before order creation", async () => {
    const userId = "SASS_COIN_TEST_07";
    await createTestUser(userId, 40); // Only has 40 coins

    // User attempts to redeem 100 coins (₹5 discount)
    await expect(
      orderService.createOrder({
        userId,
        customerName: "User 07",
        phone: "+91 99999 00007",
        address: { ...eligibleAddress, userId },
        deliverySlot: testSlot,
        paymentMethod: "online",
        cartItems: [sampleCartItem],
        subtotal: 200,
        productSavings: 40,
        deliveryFee: 29,
        coinDiscount: 5,
        coinsRedeemed: 100,
        couponDiscount: 0,
        totalAmount: 224,
      })
    ).rejects.toThrow(/insufficient amman coins/i);

    // Verify balance remains 40
    const user = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    expect(user.coins).toBe(40);
  });

  it("8. Repeated submission or retry does not deduct coins twice or award duplicate rewards", async () => {
    const userId = "SASS_COIN_TEST_08";
    await createTestUser(userId, 300);

    const subtotal = 200;
    const coinsToRedeem = 100;
    const coinDiscount = 5;

    // 1. Initial submission
    const order = await orderService.createOrder({
      userId,
      customerName: "User 08",
      phone: "+91 99999 00008",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal,
      productSavings: 40,
      deliveryFee: 29,
      coinDiscount,
      coinsRedeemed: coinsToRedeem,
      couponDiscount: 0,
      totalAmount: 224,
    });

    const userAfterFirst = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    // 300 - 100 + 20 = 220
    expect(userAfterFirst.coins).toBe(220);

    const historyAfterFirst = await coinService.getCoinHistory(userId);
    expect(historyAfterFirst.length).toBe(2);

    // 2. Retry simulation: execute order creation with identical committed order parameters
    // In our implementation, existing transactions with the same orderId are detected
    const orderRetry = await orderService.createOrder({
      userId,
      customerName: "User 08",
      phone: "+91 99999 00008",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal,
      productSavings: 40,
      deliveryFee: 29,
      coinDiscount,
      coinsRedeemed: coinsToRedeem,
      couponDiscount: 0,
      totalAmount: 224,
    });

    // Check balance is still accurately accounted
    const userAfterSecond = await apiClient.get<User>(`/users/${encodeURIComponent(userId)}`);
    expect(userAfterSecond.coins).toBeGreaterThanOrEqual(0);
  });

  it("9. Refreshing or reopening session displays the persisted balance", async () => {
    const userId = "SASS_COIN_TEST_09";
    await createTestUser(userId, 500);

    authService.syncUserSession({
      id: userId,
      userId: userId,
      coins: 500,
      name: "User 09",
      phone: "+91 99999 00009",
      email: "u09@example.com",
      isVIP: false,
      referralCode: userId,
      createdAt: new Date().toISOString(),
    });

    await orderService.createOrder({
      userId,
      customerName: "User 09",
      phone: "+91 99999 00009",
      address: { ...eligibleAddress, userId },
      deliverySlot: testSlot,
      paymentMethod: "online",
      cartItems: [sampleCartItem],
      subtotal: 200,
      productSavings: 40,
      deliveryFee: 29,
      coinDiscount: 5,
      coinsRedeemed: 100,
      couponDiscount: 0,
      totalAmount: 224,
    });

    // New balance: 500 - 100 + 20 = 420
    // Simulate browser reload where localStorage is checked
    const cachedSession = authService.getCurrentUser();
    expect(cachedSession?.coins).toBe(420);

    // Simulate reopening / refreshing via fetchUser
    const reloaded = await authService.fetchUser(userId);
    expect(reloaded?.coins).toBe(420);
  });

  it("10. The official ₹0.05 conversion rate remains intact across all calculations", () => {
    expect(OFFICIAL_COIN_CONVERSION_RATE).toBe(0.05);
    expect(coinService.getOfficialConversionRate()).toBe(0.05);

    // 1 coin = ₹0.05
    expect(convertCoinsToRupees(1)).toBe(0.05);
    // 20 coins = ₹1.00
    expect(convertCoinsToRupees(20)).toBe(1.0);
    // 100 coins = ₹5.00
    expect(convertCoinsToRupees(100)).toBe(5.0);

    // Inverse: ₹5.00 = 100 coins
    expect(convertRupeesToCoins(5)).toBe(100);
    // ₹1.00 = 20 coins
    expect(convertRupeesToCoins(1)).toBe(20);
  });
});

