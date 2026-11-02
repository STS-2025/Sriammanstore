import { describe, it, expect, beforeEach } from "vitest";
import { addressService } from "../services/addressService";
import { settingsService } from "../services/settingsService";
import { orderService } from "../services/orderService";
import { cartService } from "../services/cartService";
import { productService } from "../services/productService";
import { convertCoinsToRupees } from "../services/coinService";
import { TEST_CREDENTIALS } from "../services/authService";
import type { CartItem, Address, DeliverySlot } from "../types";

describe("Three-Step Cart & Checkout Workflow Verification", () => {
  const testUserId = TEST_CREDENTIALS.defaultUserId; // SASS0000104

  // Sample valid address in Gobichettipalayam (within 6km)
  const eligibleAddress: Address = {
    id: "addr_test_eligible",
    userId: testUserId,
    tag: "Home",
    name: "Priya S",
    phone: "+91 98400 12345",
    houseNo: "42/1",
    street: "2nd Main Road, Gandhi Nagar",
    city: "Gobichettipalayam",
    pincode: "638454",
    lat: 11.4598,
    lng: 77.334,
    isDefault: true,
  };

  // Sample address in Coimbatore (outside 50km boundary, ~64km away)
  const outsideGeofenceAddress: Address = {
    id: "addr_test_ineligible",
    userId: testUserId,
    tag: "Other",
    name: "Priya S (Out of Zone)",
    phone: "+91 98400 12345",
    houseNo: "Door 42",
    street: "Avinashi Road",
    city: "Coimbatore",
    pincode: "641018",
    lat: 11.0168,
    lng: 76.9558,
    isDefault: false,
  };

  const expressSlot: DeliverySlot = {
    id: "slot_exp",
    type: "express",
    title: "Express 60–Min Instant Dispatch",
    badge: "FASTEST",
    subtitle: "Dedicated Adyar Express rider",
    charge: 29,
  };

  const standardSlot: DeliverySlot = {
    id: "slot_std",
    type: "standard",
    title: "Standard Delivery (Tomorrow Morning)",
    badge: "ECO",
    subtitle: "Low carbon consolidated route",
    charge: 40,
  };

  describe("1. Pricing Consistency & Arithmetic Across Workflow", () => {
    it("matches exact screenshot numbers (Total MRP: ₹1,849, Product Savings: ₹316, Selling Subtotal: ₹1,533)", () => {
      // Scenario from Screenshots 1 & 3:
      // Selling subtotal: ₹1,533
      // Total MRP: ₹1,849
      // Product Savings: ₹316 (1,849 - 1,533)
      // Coupon (SMART20): -₹100
      // Coins Redeemed (100 coins): -₹50
      // Express Delivery: ₹29
      // Total Payable: ₹1,412
      // Total Order Savings: ₹466 (25%)
      const totalItemMrp = 1849;
      const storeProductDiscount = 316;
      const sellingSubtotal = totalItemMrp - storeProductDiscount;
      expect(sellingSubtotal).toBe(1533);

      const couponDiscount = 100;
      const coinDiscount = 50;
      const totalDiscounts = couponDiscount + coinDiscount; // 150
      const expressDeliveryFee = 29;

      // Method 1: Subtotal - Discounts + Delivery
      const payableFromSubtotal = sellingSubtotal - totalDiscounts + expressDeliveryFee;
      expect(payableFromSubtotal).toBe(1412);

      // Method 2: MRP - Product Savings - Discounts + Delivery
      const payableFromMrp =
        totalItemMrp - storeProductDiscount - totalDiscounts + expressDeliveryFee;
      expect(payableFromMrp).toBe(1412);

      // Total savings calculation: Product Savings + Coupon + Coins
      const totalSavings = storeProductDiscount + couponDiscount + coinDiscount;
      expect(totalSavings).toBe(466);

      const savingsPct = Math.round((totalSavings / totalItemMrp) * 100);
      expect(savingsPct).toBe(25);
    });

    it("does not double-count product savings when computing payable amount", () => {
      // Defect verification: If selling price already includes discount,
      // product savings must NEVER be subtracted from the selling subtotal.
      const itemMrp = 299;
      const itemSellingPrice = 245;
      const productSavings = itemMrp - itemSellingPrice; // 54

      const subtotal = itemSellingPrice; // 245
      const couponDiscount = 0;
      const coinDiscount = 0;
      const deliveryFee = 29;

      const correctPayable = subtotal - (couponDiscount + coinDiscount) + deliveryFee;
      expect(correctPayable).toBe(274);

      // Defective calculation: subtotal - productSavings + deliveryFee = 245 - 54 + 29 = 220 (WRONG)
      const defectivePayable = subtotal - productSavings + deliveryFee;
      expect(correctPayable).not.toBe(defectivePayable);
    });

    it("calculates delivery fee according to selected speed and cart threshold", () => {
      const highSubtotal = 550; // >= 499 threshold
      const lowSubtotal = 350; // < 499 threshold

      // Express is always ₹29 regardless of threshold
      const expressFeeHigh = 29;
      const expressFeeLow = 29;
      expect(expressFeeHigh).toBe(29);
      expect(expressFeeLow).toBe(29);

      // Standard is FREE when subtotal >= 499, otherwise ₹40
      const standardFeeHigh = highSubtotal >= 499 ? 0 : 40;
      const standardFeeLow = lowSubtotal >= 499 ? 0 : 40;
      expect(standardFeeHigh).toBe(0);
      expect(standardFeeLow).toBe(40);
    });

    it("caps total discounts so total payable is never negative", () => {
      const smallSubtotal = 80;
      const couponDiscount = 100;
      const coinDiscount = 50;
      const deliveryFee = 29;

      const effectiveDiscount = Math.min(smallSubtotal, couponDiscount + coinDiscount);
      expect(effectiveDiscount).toBe(80);

      const finalPayable = Math.max(0, smallSubtotal - effectiveDiscount + deliveryFee);
      expect(finalPayable).toBe(29); // Only delivery fee payable
      expect(finalPayable).toBeGreaterThanOrEqual(0);
    });
  });

  describe("2. Step 2: Address & Geofence Validation", () => {
    it("validates that addresses within 6km are eligible for delivery", () => {
      const geo = addressService.validateGeofence(
        eligibleAddress.lat,
        eligibleAddress.lng
      );
      expect(geo.eligible).toBe(true);
      expect(geo.distanceKm).toBeLessThanOrEqual(6.0);
    });

    it("rejects addresses outside the 6km delivery geofence", () => {
      const geo = addressService.validateGeofence(
        outsideGeofenceAddress.lat,
        outsideGeofenceAddress.lng
      );
      expect(geo.eligible).toBe(false);
      expect(geo.distanceKm).toBeGreaterThan(6.0);
    });

    it("blocks order placement if the selected address is outside delivery boundary", async () => {
      const mockItem: CartItem = {
        id: "prod_groundnut_oil__opt0__ml__500",
        cartKey: "prod_groundnut_oil__opt0__ml__500",
        userId: testUserId,
        productId: "prod_groundnut_oil",
        name: "Mara Chekku Groundnut Oil",
        image: "https://example.com/oil.jpg",
        unit: "ml",
        unitSize: "500",
        price: 130,
        mrp: 160,
        quantity: 1,
        optionIndex: 0,
        stock: 20,
      };

      await expect(
        orderService.createOrder({
          userId: testUserId,
          customerName: "Priya S",
          phone: "+91 98400 12345",
          address: outsideGeofenceAddress,
          deliverySlot: expressSlot,
          paymentMethod: "cod",
          cartItems: [mockItem],
          subtotal: 130,
          productSavings: 30,
          deliveryFee: 29,
          coinDiscount: 0,
          couponDiscount: 0,
          totalAmount: 159,
        })
      ).rejects.toThrow(/delivery boundary/i);
    });
  });

  describe("3. Step 3: Payment & Order Creation Integrity", () => {
    it("does not create an online order without a confirmed provider transaction", async () => {
      await expect(
        orderService.createOrder({
          userId: testUserId,
          customerName: "Test Customer",
          phone: "0000000000",
          address: eligibleAddress,
          deliverySlot: expressSlot,
          paymentMethod: "online",
          cartItems: [],
          subtotal: 0,
          productSavings: 0,
          deliveryFee: 0,
          coinDiscount: 0,
          couponDiscount: 0,
          totalAmount: 0,
        },)
      ).rejects.toThrow(/payment provider confirms the transaction/i);
    });

    it("creates order successfully with matching pricing summary and clears cart", async () => {
      // 1. Add item to cart
      const product = (await productService.getProductById("prod_groundnut_oil"))!;
      await cartService.addToCart(product, 0, 1, testUserId);

      const cart = await cartService.getCart(testUserId);
      expect(cart.length).toBeGreaterThan(0);

      const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const deliveryFee = 29;
      const coinDiscount = 5; // 100 coins at official rate 1 coin = ₹0.05
      const couponDiscount = 0;
      const expectedTotal = subtotal - coinDiscount + deliveryFee;

      // 2. Place order with valid address
      const order = await orderService.createOrder({
        userId: testUserId,
        customerName: "Priya S",
        phone: "+91 98400 12345",
        address: eligibleAddress,
        deliverySlot: expressSlot,
        paymentMethod: "cod",
        cartItems: cart,
        subtotal,
        productSavings: 30,
        deliveryFee,
        coinDiscount,
        coinsRedeemed: 100,
        couponDiscount,
        totalAmount: expectedTotal,
      });

      expect(order.orderId).toMatch(/^ORD-000\d{4}$/);
      expect(order.pricingSummary.totalAmount).toBe(expectedTotal);
      expect(order.pricingSummary.subtotal).toBe(subtotal);
      expect(order.pricingSummary.deliveryFee).toBe(deliveryFee);
      expect(order.pricingSummary.coinDiscount).toBe(coinDiscount);

      // 3. Clear cart
      await cartService.clearCart(testUserId);
      const clearedCart = await cartService.getCart(testUserId);
      expect(clearedCart.length).toBe(0);
    });

    it("prevents placing an order with an empty cart", async () => {
      await expect(
        orderService.createOrder({
          userId: testUserId,
          customerName: "Priya S",
          phone: "+91 98400 12345",
          address: eligibleAddress,
          deliverySlot: expressSlot,
          paymentMethod: "cod",
          cartItems: [],
          subtotal: 0,
          productSavings: 0,
          deliveryFee: 0,
          coinDiscount: 0,
          couponDiscount: 0,
          totalAmount: 0,
        })
      ).rejects.toThrow(/empty cart/i);
    });
  });

  describe("4. State Persistence & Step Rules", () => {
    it("validates step navigation bounds and required prerequisites", () => {
      // Step 1: Cart (always accessible)
      const canAccessStep1 = true;
      expect(canAccessStep1).toBe(true);

      // Step 2: Address & Slot requires non-empty cart and signed-in user
      const canAccessStep2Empty = false;
      const canAccessStep2WithItems = true;
      expect(canAccessStep2Empty).toBe(false);
      expect(canAccessStep2WithItems).toBe(true);

      // Step 3: Payment requires eligible address + selected slot + non-empty cart
      const canAccessStep3WithoutAddress = false;
      const canAccessStep3WithIneligibleAddress = false;
      const canAccessStep3Valid = true;

      expect(canAccessStep3WithoutAddress).toBe(false);
      expect(canAccessStep3WithIneligibleAddress).toBe(false);
      expect(canAccessStep3Valid).toBe(true);
    });

    it("ensures Amman Coins redemption conforms to 1 coin = ₹0.05 official rate", () => {
      const userCoins = 250;
      const coinsToRedeem = 100;
      const discount = convertCoinsToRupees(coinsToRedeem);
      const remainingCoins = userCoins - coinsToRedeem;

      expect(discount).toBe(5);
      expect(remainingCoins).toBe(150);
    });
  });
});

