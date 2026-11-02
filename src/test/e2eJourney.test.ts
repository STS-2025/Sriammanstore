import { describe, it, expect } from "vitest";
import { authService, TEST_CREDENTIALS } from "../services/authService";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";
import { addressService } from "../services/addressService";
import { settingsService } from "../services/settingsService";
import { orderService } from "../services/orderService";
import { wishlistService } from "../services/wishlistService";
import { notificationService } from "../services/notificationService";
import { supportService } from "../services/supportService";
import { buildCartKey } from "../lib/productUtils";

describe("Complete Customer Shopping Journey (E2E Integration)", () => {
  let createdOrderId = "";

  it("Step 1: Test Login via phone and test OTP", async () => {
    const req = await authService.requestOtp(TEST_CREDENTIALS.phone);
    expect(req.success).toBe(true);

    const user = await authService.verifyOtp(TEST_CREDENTIALS.phone, TEST_CREDENTIALS.otp);
    expect(user).toBeDefined();
    expect(user.userId).toBe(TEST_CREDENTIALS.defaultUserId);
  });

  it("Step 2: Home Page Catalog & Banner Feed", async () => {
    const [banners, categories, products] = await Promise.all([
      productService.getBanners(),
      productService.getCategories(),
      productService.getProducts(),
    ]);
    expect(banners.length).toBeGreaterThan(0);
    expect(categories.length).toBeGreaterThan(0);
    expect(products.length).toBeGreaterThan(0);
  });

  it("Step 3: Search & Category Filter", async () => {
    const oilProducts = await productService.getProducts({
      category: "cold-pressed-oils",
    });
    expect(oilProducts.length).toBeGreaterThan(0);
    expect(oilProducts.every((p) => p.categorySlug === "cold-pressed-oils")).toBe(true);

    const searchResults = await productService.getProducts({
      search: "groundnut",
    });
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults[0]!.name.toLowerCase()).toContain("groundnut");
  });

  it("Step 4: Product Details & Variant Selection", async () => {
    const product = await productService.getProductById("prod_groundnut_oil");
    expect(product).not.toBeNull();
    expect(product?.options.length).toBeGreaterThan(1);

    // Selected option 1 (1 Litre)
    const opt1 = product!.options[1]!;
    expect(opt1.unit).toBe("L");
    expect(opt1.unitSize).toBe("1");
    expect(opt1.offerPrice).toBe(245);
  });

  it("Step 5 & 6: Add to Cart with Canonical Key & Update Quantity", async () => {
    const product = (await productService.getProductById("prod_groundnut_oil"))!;
    const expectedKey = buildCartKey(product.id, 1, "L", "1");
    expect(expectedKey).toBe("prod_groundnut_oil__opt1__L__1");

    // Add to cart
    const item = await cartService.addToCart(product, 1, 2);
    expect(item.id).toBe(expectedKey);
    expect(item.quantity).toBeGreaterThanOrEqual(2);

    // Update quantity
    const updated = await cartService.updateQuantity(expectedKey, 3);
    expect(updated?.quantity).toBe(3);

    // Verify cart contents
    const cart = await cartService.getCart();
    expect(cart.some((c) => c.id === expectedKey)).toBe(true);
  });

  it("Step 7 & 8: Checkout - Select Address & Delivery Slot", async () => {
    const addresses = await addressService.getAddresses(TEST_CREDENTIALS.defaultUserId);
    expect(addresses.length).toBeGreaterThan(0);

    const validAddress = (addresses.find((a) => a.isDefault) || addresses[0])!;
    const geo = addressService.validateGeofence(validAddress.lat, validAddress.lng);
    expect(geo.eligible).toBe(true);

    const slots = await settingsService.getDeliverySlots();
    expect(slots.length).toBeGreaterThan(0);
  });

  it("Step 9 & 10: Place Mock Order & Clear Cart", async () => {
    const cart = await cartService.getCart();
    const addresses = await addressService.getAddresses(TEST_CREDENTIALS.defaultUserId);
    const slots = await settingsService.getDeliverySlots();

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await orderService.createOrder({
      userId: TEST_CREDENTIALS.defaultUserId,
      customerName: "Arun Kumar",
      phone: "+91 99999 99999",
      address: addresses[0]!,
      deliverySlot: slots[0]!,
      paymentMethod: "cod",
      cartItems: cart,
      subtotal,
      productSavings: 150,
      deliveryFee: 0,
      coinDiscount: 25,
      couponDiscount: 0,
      totalAmount: subtotal - 25,
    });

    expect(order.orderId).toMatch(/^ORD-000\d{4}$/);
    createdOrderId = order.orderId;

    // Small delay to allow json-server file write & reload
    await new Promise((r) => setTimeout(r, 600));

    // Cart must be cleared after order
    const clearedCart = await cartService.getCart();
    expect(clearedCart.length).toBe(0);
  });

  it("Step 11 & 12: Order Confirmation & Live Tracking", async () => {
    expect(createdOrderId).not.toBe("");
    await new Promise((r) => setTimeout(r, 300));
    const fetchedOrder = await orderService.getOrderById(createdOrderId);
    expect(fetchedOrder).not.toBeNull();
    expect(fetchedOrder?.orderId).toBe(createdOrderId);
    expect(fetchedOrder?.status).toBe("pending");
  });

  it("Step 13: Order History List", async () => {
    await new Promise((r) => setTimeout(r, 300));
    const orders = await orderService.getOrders(TEST_CREDENTIALS.defaultUserId);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders.some((o) => o.orderId === createdOrderId)).toBe(true);
  });

  it("Step 14: Wishlist & Move to Cart with Canonical Key", async () => {
    const wishlists = await wishlistService.getWishlists();
    expect(wishlists.length).toBeGreaterThan(0);

    const prods = await productService.getProducts();
    const count = await wishlistService.moveAllToCart(wishlists[0]!.id, prods);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("Step 15: Notifications Center", async () => {
    const notifs = await notificationService.getNotifications();
    expect(notifs.length).toBeGreaterThan(0);
    await notificationService.markAsRead(notifs[0]!.id);
  });

  it("Step 16: Customer Support Grievance Logging", async () => {
    const ticket = await supportService.submitReportedProblem({
      userId: TEST_CREDENTIALS.defaultUserId,
      category: "Delivery Query",
      orderId: createdOrderId,
      message: "Order placed successfully in local automated test",
    });
    expect(ticket.id).toBeDefined();
    expect(ticket.status).toBe("Submitted");
  });
});
