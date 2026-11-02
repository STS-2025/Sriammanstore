import { describe, it, expect } from "vitest";
import { formatCheckoutError } from "../routes/checkout";
import { orderService } from "../services/orderService";
import { apiClient } from "../services/apiClient";
import type { CartItem, Address, DeliverySlot } from "../types";

describe("Checkout Error Handling & Read-Only Milestone Guard Verification", () => {
  const dummyAddress: Address = {
    id: "addr_test_01",
    userId: "SASS9999901",
    tag: "Home",
    name: "Test Customer",
    phone: "+91 99999 99999",
    houseNo: "1",
    street: "Main Road",
    city: "Gobichettipalayam",
    pincode: "638454",
    lat: 11.4598,
    lng: 77.334,
    isDefault: true,
  };

  const dummySlot: DeliverySlot = {
    id: "slot_std",
    type: "standard",
    title: "Standard Morning",
    subtitle: "7:00 AM - 10:00 AM",
    charge: 0,
  };

  const dummyItem: CartItem = {
    id: "prod_01__opt0__kg__1",
    productId: "prod_01",
    name: "Groundnut Oil",
    optionIndex: 0,
    unit: "L",
    unitSize: "1",
    price: 180,
    mrp: 200,
    quantity: 1,
    image: "/images/oil.jpg",
    stock: 50,
  };

  describe("1. formatCheckoutError Defensive Handling", () => {
    it("handles null error without throwing secondary exception", () => {
      const msg = formatCheckoutError(null);
      expect(msg).toContain("Order placement could not be completed");
      expect(msg).toContain("preserved");
    });

    it("handles undefined error without throwing secondary exception", () => {
      const msg = formatCheckoutError(undefined);
      expect(msg).toContain("Order placement could not be completed");
      expect(msg).toContain("preserved");
    });

    it("maps raw Firestore CEL runtime 'Null value error' to user-friendly permission notice", () => {
      const rawError = new Error(
        "evaluation error at L409:22 for 'get' @ L409, false for 'get' @ L465, Null value error. for 'get' @ L409, false for 'get' @ L465"
      );
      const msg = formatCheckoutError(rawError);
      expect(msg).not.toContain("Null value error");
      expect(msg).not.toContain("L409");
      expect(msg).not.toContain("L465");
      expect(msg).toContain("read-only mode");
      expect(msg).toContain("preserved");
    });

    it("maps Firestore permission-denied code to graceful user message", () => {
      const permissionError = {
        code: "permission-denied",
        message: "Missing or insufficient permissions.",
      };
      const msg = formatCheckoutError(permissionError);
      expect(msg).toContain("read-only mode");
      expect(msg).toContain("preserved");
    });

    it("maps HTTP 403 status objects to graceful user message", () => {
      const http403 = {
        status: 403,
        message: "Forbidden",
      };
      const msg = formatCheckoutError(http403);
      expect(msg).toContain("read-only mode");
      expect(msg).toContain("preserved");
    });

    it("handles network and fetch errors cleanly", () => {
      const networkErr = new Error("Failed to fetch");
      const msg = formatCheckoutError(networkErr);
      expect(msg).toContain("Unable to connect");
      expect(msg).toContain("preserved");
    });

    it("preserves standard user-facing domain validation messages", () => {
      const validationErr = new Error(
        "Delivery address is outside the 6km delivery boundary (12km away)."
      );
      const msg = formatCheckoutError(validationErr);
      expect(msg).toBe(
        "Delivery address is outside the 6km delivery boundary (12km away)."
      );
    });

    it("sanitizes raw GrpcConnection internal traces", () => {
      const grpcErr = new Error(
        "@firebase/firestore: Firestore: GrpcConnection RPC 'Write' stream error"
      );
      const msg = formatCheckoutError(grpcErr);
      expect(msg).not.toContain("GrpcConnection");
      expect(msg).toContain("preserved");
    });
  });

  describe("2. Active Order Creation", () => {
    it("orderService.createOrder does not throw read-only disabled error when legacy customer mode is active", async () => {
      apiClient.setLegacyCustomerSubcollectionsEnabled(true);
      try {
        const order = await orderService.createOrder({
          userId: "SASS9999901",
          customerName: "Test Customer",
          phone: "+91 99999 99999",
          address: dummyAddress,
          deliverySlot: dummySlot,
          paymentMethod: "online",
          cartItems: [dummyItem],
          subtotal: 180,
          productSavings: 20,
          deliveryFee: 0,
          coinDiscount: 0,
          couponDiscount: 0,
          totalAmount: 180,
        });
        expect(order).toBeDefined();
      } catch (err: any) {
        expect(err.message).not.toContain("disabled in read-only legacy mode");
      } finally {
        apiClient.setLegacyCustomerSubcollectionsEnabled(false);
      }
    });
  });
});
