import { describe, it, expect, beforeEach } from "vitest";
import { apiClient } from "../services/apiClient";
import { firestoreAdapter } from "../services/firestoreAdapter";
import { orderService } from "../services/orderService";
import type { CartItem, DeliverySlot, Address, User, Order } from "../types";

describe("Feature 2: Customer Orders under onlineCustomers Integration", () => {
  const customerId = "ONCUS0000099";
  const mockUser: User = {
    id: customerId,
    userId: customerId,
    name: "Orders Test Customer",
    phone: "+91 98400 11223",
    email: "customer.orders@test.com",
    smartCoins: 100,
    phoneVerified: true,
    verifiedPhone: "+919840011223",
    isVIP: false,
    referralCode: "REFORDERS",
    createdAt: new Date().toISOString(),
  };

  const deliveryAddress: Address = {
    id: "addr_test_orders",
    userId: customerId,
    tag: "Home",
    name: "Orders Test Customer",
    phone: "+91 98400 11223",
    houseNo: "123",
    street: "Main Bazaar Road",
    city: "Gobichettipalayam",
    pincode: "638454",
    lat: 11.459319,
    lng: 77.333565,
    isDefault: true,
  };

  const deliverySlot: DeliverySlot = {
    id: "slot_test_std",
    type: "standard",
    title: "Standard Slot",
    subtitle: "10:00 - 13:00",
    charge: 0,
  };

  const mockCartItem: CartItem = {
    id: "prod_oil__opt0__L__1",
    cartKey: "prod_oil__opt0__L__1",
    userId: customerId,
    productId: "prod_groundnut_oil",
    optionIndex: 0,
    name: "Groundnut Oil 1L",
    unit: "L",
    unitSize: "1",
    price: 200,
    mrp: 240,
    quantity: 1,
    image: "https://example.com/oil.jpg",
    stock: 25,
  };

  beforeEach(async () => {
    await apiClient.post("/onlineCustomers", mockUser);
  });

  it("creates an order and stores it in both main orders and onlineCustomers/{customerId}/orders with identical orderId", async () => {
    const createdOrder = await orderService.createOrder({
      userId: customerId,
      customerName: "Orders Test Customer",
      phone: "+91 98400 11223",
      address: deliveryAddress,
      deliverySlot: deliverySlot,
      paymentMethod: "cod",
      cartItems: [mockCartItem],
      subtotal: 200,
      productSavings: 40,
      deliveryFee: 0,
      coinDiscount: 0,
      couponDiscount: 0,
      totalAmount: 200,
    });

    expect(createdOrder).toBeDefined();
    expect(createdOrder.orderId).toBeTruthy();
    const orderId = createdOrder.orderId;

    // Verify presence in main orders collection
    const mainOrder = await apiClient.get<Order>(`/orders/${orderId}`);
    expect(mainOrder).toBeDefined();
    expect(mainOrder.id).toBe(orderId);
    expect(mainOrder.userId).toBe(customerId);

    // Verify presence in customer subcollection: onlineCustomers/{customerId}/orders/{orderId}
    const customerSubOrder = await apiClient.get<Order>(
      `/onlineCustomers/${customerId}/orders/${orderId}`
    );
    expect(customerSubOrder).toBeDefined();
    expect(customerSubOrder.id).toBe(orderId);
    expect(customerSubOrder.userId).toBe(customerId);
    expect(customerSubOrder.pricingSummary?.totalAmount).toBe(200);
  });

  it("never writes customer orders to the legacy users collection", async () => {
    const createdOrder = await orderService.createOrder({
      userId: customerId,
      customerName: "Orders Test Customer",
      phone: "+91 98400 11223",
      address: deliveryAddress,
      deliverySlot: deliverySlot,
      paymentMethod: "cod",
      cartItems: [mockCartItem],
      subtotal: 200,
      productSavings: 40,
      deliveryFee: 0,
      coinDiscount: 0,
      couponDiscount: 0,
      totalAmount: 200,
    });

    const orderId = createdOrder.orderId;

    // Assert that the underlying driver never wrote to users/{customerId}/orders subcollection
    const rawDriver = (firestoreAdapter as any).driver;
    if (rawDriver && typeof rawDriver.getColMap === "function") {
      const legacyOrdersCol = rawDriver.store?.get(`users/${customerId}/orders`);
      expect(legacyOrdersCol?.has(orderId) ?? false).toBe(false);
    }

    // Also assert that the canonical customer subcollection has the order
    const canonicalOrder = await apiClient.get<Order>(
      `/onlineCustomers/${customerId}/orders/${orderId}`
    );
    expect(canonicalOrder).toBeDefined();
    expect(canonicalOrder.id).toBe(orderId);
  });
});
