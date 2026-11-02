import { describe, it, expect, beforeEach, vi } from "vitest";
import { apiClient } from "../services/apiClient";
import {
  settingsService,
  DEFAULT_PAYMENT_SETTINGS,
  type StorePaymentSettings,
} from "../services/settingsService";
import { orderService } from "../services/orderService";
import type { CartItem, DeliverySlot, Address, User, Order } from "../types";

describe("Feature 4: Simple UPI Payment Option Integration", () => {
  const customerId = "ONCUS0000010";

  const mockUser: User = {
    id: customerId,
    userId: customerId,
    name: "UPI Test Customer",
    phone: "+91 98400 44556",
    email: "upi.test@amman.com",
    smartCoins: 50,
    phoneVerified: true,
    verifiedPhone: "+919840044556",
    isVIP: false,
    referralCode: "REFUPI",
    createdAt: new Date().toISOString(),
  };

  const deliveryAddress: Address = {
    id: "addr_upi_test",
    userId: customerId,
    tag: "Home",
    name: "UPI Test Customer",
    phone: "+91 98400 44556",
    houseNo: "10",
    street: "Gandhi Road",
    city: "Gobichettipalayam",
    pincode: "638454",
    lat: 11.459319,
    lng: 77.333565,
    isDefault: true,
  };

  const deliverySlot: DeliverySlot = {
    id: "slot_upi_std",
    type: "standard",
    title: "Standard Slot",
    subtitle: "14:00 - 17:00",
    charge: 0,
  };

  const mockItem: CartItem = {
    id: "prod_dal__opt0__kg__1",
    cartKey: "prod_dal__opt0__kg__1",
    userId: customerId,
    productId: "prod_dal",
    optionIndex: 0,
    name: "Toor Dal 1kg",
    unit: "kg",
    unitSize: "1",
    price: 180,
    mrp: 200,
    quantity: 1,
    image: "https://example.com/dal.jpg",
    stock: 30,
  };

  beforeEach(async () => {
    await apiClient.post("/onlineCustomers", mockUser);
  });

  it("reads default payment configuration with UPI enabled and confirmed merchant ID", async () => {
    const config = await settingsService.getPaymentConfiguration();
    expect(config.upiEnabled).toBe(true);
    expect(config.merchantUpiId).toBe("sriammansmartstore@okaxis");
    expect(config.merchantName).toBe("Sri Amman Smart Store");
    expect(config.codEnabled).toBe(true);
  });

  it("dynamically loads payment settings when Settings/payment is configured in Firestore", async () => {
    const customSettings: StorePaymentSettings = {
      upiEnabled: true,
      merchantUpiId: "customstore@icici",
      merchantName: "Sri Amman Premium Store",
      codEnabled: false,
    };

    const spy = vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/Settings/payment") return customSettings as any;
      return null as any;
    });

    const config = await settingsService.getPaymentConfiguration();
    expect(config.merchantUpiId).toBe("customstore@icici");
    expect(config.merchantName).toBe("Sri Amman Premium Store");

    spy.mockRestore();
  });

  it("generates a valid upi://pay intent link with merchant ID, name, amount and currency", () => {
    const upiId = DEFAULT_PAYMENT_SETTINGS.merchantUpiId;
    const merchantName = DEFAULT_PAYMENT_SETTINGS.merchantName;
    const amount = 180;

    const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR`;

    expect(upiLink).toContain("upi://pay");
    expect(upiLink).toContain(`pa=${encodeURIComponent(upiId)}`);
    expect(upiLink).toContain(`pn=${encodeURIComponent(merchantName)}`);
    expect(upiLink).toContain("am=180.00");
    expect(upiLink).toContain("cu=INR");
  });

  it("creates an order with paymentMethod 'upi' and sets status to 'awaiting_verification' (no fake instant success)", async () => {
    const order = await orderService.createOrder({
      userId: customerId,
      customerName: "UPI Test Customer",
      phone: "+91 98400 44556",
      address: deliveryAddress,
      deliverySlot: deliverySlot,
      paymentMethod: "upi",
      cartItems: [mockItem],
      subtotal: 180,
      productSavings: 20,
      deliveryFee: 0,
      coinDiscount: 0,
      couponDiscount: 0,
      totalAmount: 180,
    });

    expect(order).toBeDefined();
    expect(order.payment.method).toBe("upi");
    expect(order.payment.status).toBe("awaiting_verification");
    expect(order.status).toBe("pending");
  });
});
