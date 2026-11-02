import { describe, it, expect, beforeEach } from "vitest";
import { apiClient } from "../services/apiClient";
import { productionCoinReader } from "../services/productionCoinReader";
import { orderService } from "../services/orderService";
import type { CartItem, DeliverySlot, Address, User } from "../types";

describe("Feature 3: Smart Coins History & Balance Standardization Integration", () => {
  const customerId = "ONCUS0000010";
  const initialCoins = 250;

  const mockUser: User = {
    id: customerId,
    userId: customerId,
    name: "Smart Coins Customer",
    phone: "+91 98400 33445",
    email: "coins.test@amman.com",
    smartCoins: initialCoins,
    phoneVerified: true,
    verifiedPhone: "+919840033445",
    isVIP: false,
    referralCode: "REFCOINS",
    createdAt: new Date().toISOString(),
  };

  const deliveryAddress: Address = {
    id: "addr_coins_test",
    userId: customerId,
    tag: "Home",
    name: "Smart Coins Customer",
    phone: "+91 98400 33445",
    houseNo: "55",
    street: "Temple Street",
    city: "Gobichettipalayam",
    pincode: "638454",
    lat: 11.459319,
    lng: 77.333565,
    isDefault: true,
  };

  const deliverySlot: DeliverySlot = {
    id: "slot_coins_std",
    type: "standard",
    title: "Morning Dispatch",
    subtitle: "08:00 - 11:00",
    charge: 0,
  };

  const mockItem: CartItem = {
    id: "prod_turmeric__opt0__g__250",
    cartKey: "prod_turmeric__opt0__g__250",
    userId: customerId,
    productId: "prod_turmeric",
    optionIndex: 0,
    name: "Organic Turmeric Powder",
    unit: "g",
    unitSize: "250",
    price: 150,
    mrp: 180,
    quantity: 2,
    image: "https://example.com/turmeric.jpg",
    stock: 50,
  };

  beforeEach(async () => {
    await apiClient.post("/onlineCustomers", mockUser);
  });

  it("writes transactions to onlineCustomers/{customerId}/coinHistory subcollection", async () => {
    const txId = `tx_${Date.now()}`;
    const txRecord = {
      id: txId,
      customerId,
      userId: customerId,
      type: "earned",
      amount: 15,
      description: "Earned 15 Smart Coins on Grocery Order",
      createdAt: new Date().toISOString(),
    };

    await apiClient.post(`/onlineCustomers/${customerId}/coinHistory`, txRecord);

    const history = await apiClient.get<any[]>(`/onlineCustomers/${customerId}/coinHistory`);
    expect(history).toBeDefined();
    expect(Array.isArray(history)).toBe(true);
    const foundTx = history.find((h) => h.id === txId || (h as any).amount === 15);
    expect(foundTx).toBeDefined();
  });

  it("updates smartCoins as the sole customer coin balance field", async () => {
    // Deduct 50 coins
    const newBalance = 200;
    const patchedUser = await apiClient.patch<User>(`/onlineCustomers/${customerId}`, {
      smartCoins: newBalance,
    });

    expect(patchedUser.smartCoins).toBe(200);

    // Fetch refreshed profile to verify persistence
    const refreshed = await apiClient.get<User>(`/onlineCustomers/${customerId}`);
    expect(refreshed.smartCoins).toBe(200);
  });

  it("correctly handles coin redemption during order creation", async () => {
    // Redeem 100 coins (worth ₹5 discount at official rate)
    const redeemAmount = 100;
    const coinDiscount = 5;

    const order = await orderService.createOrder({
      userId: customerId,
      customerName: "Smart Coins Customer",
      phone: "+91 98400 33445",
      address: deliveryAddress,
      deliverySlot: deliverySlot,
      paymentMethod: "cod",
      cartItems: [mockItem],
      subtotal: 300,
      productSavings: 60,
      deliveryFee: 0,
      coinDiscount,
      couponDiscount: 0,
      totalAmount: 295,
      coinsRedeemed: redeemAmount,
    });

    expect(order).toBeDefined();
    expect(order.pricingSummary.coinDiscount).toBe(5);
    expect(order.coinsRedeemed ?? order.pricingSummary.coinsRedeemed).toBe(100);
  });
});
