import { describe, it, expect, vi } from "vitest";
import {
  phoneVerificationService,
  formatToE164,
  validatePhoneNumber,
  mapPhoneAuthError,
  extractPhoneAuthErrorCode,
} from "../services/phoneVerificationService";
import { orderService } from "../services/orderService";
import { apiClient } from "../services/apiClient";
import type { CartItem, Address, DeliverySlot, User } from "../types";

describe("Phone Verification & Checkout Enforcement Test Suite", () => {
  describe("1. Phone Number Normalization and Validation", () => {
    it("normalizes phone numbers to standard E.164 format", () => {
      expect(formatToE164("+91", "98400 12345")).toBe("+919840012345");
      expect(formatToE164("91", "98400-12345")).toBe("+919840012345");
      expect(formatToE164("+1", "(555) 234-5678")).toBe("+15552345678");
      expect(formatToE164("+971", "50 123 4567")).toBe("+971501234567");
      expect(formatToE164("+91", "+91 98400 12345")).toBe("+919840012345");
    });

    it("validates Indian 10-digit mobile numbers with correct prefixes", () => {
      // Valid cases
      expect(validatePhoneNumber("9840012345", "+91")).toEqual({ valid: true });
      expect(validatePhoneNumber("8840012345", "+91")).toEqual({ valid: true });
      expect(validatePhoneNumber("7840012345", "+91")).toEqual({ valid: true });
      expect(validatePhoneNumber("6840012345", "+91")).toEqual({ valid: true });

      // Invalid lengths
      expect(validatePhoneNumber("984001234", "+91").valid).toBe(false);
      expect(validatePhoneNumber("98400123456", "+91").valid).toBe(false);

      // Invalid start digit
      expect(validatePhoneNumber("5840012345", "+91").valid).toBe(false);
      expect(validatePhoneNumber("1840012345", "+91").error).toMatch(/must start with 6, 7, 8, or 9/i);

      // Empty input
      expect(validatePhoneNumber("", "+91").valid).toBe(false);
      expect(validatePhoneNumber("", "+91").error).toMatch(/enter your mobile number/i);
    });

    it("validates international phone numbers", () => {
      expect(validatePhoneNumber("5552345678", "+1")).toEqual({ valid: true });
      expect(validatePhoneNumber("123", "+1").valid).toBe(false);
    });
  });

  describe("2. Firebase Auth Error Mapping", () => {
    it("maps known Firebase Phone Auth errors to customer-friendly messages", () => {
      expect(mapPhoneAuthError({ code: "auth/invalid-phone-number" })).toMatch(
        /phone number entered is invalid/i
      );
      expect(mapPhoneAuthError({ code: "auth/invalid-verification-code" })).toMatch(
        /invalid verification code/i
      );
      expect(mapPhoneAuthError({ code: "auth/code-expired" })).toMatch(
        /verification code has expired/i
      );
      expect(mapPhoneAuthError({ code: "auth/quota-exceeded" })).toMatch(
        /SMS quota exceeded/i
      );
      expect(mapPhoneAuthError({ code: "auth/too-many-requests" })).toMatch(
        /too many OTP requests/i
      );
      expect(mapPhoneAuthError({ code: "auth/credential-already-in-use" })).toMatch(
        /already associated with an account/i
      );
      expect(mapPhoneAuthError({ code: "auth/credential-already-in-use" })).toMatch(
        /sign in to the account that owns it|contact support/i
      );
    });

    it("maps reCAPTCHA and app credential errors to actionable challenge guidance", () => {
      expect(mapPhoneAuthError({ code: "auth/invalid-app-credential" })).toMatch(
        /Security verification failed \(invalid app credential\)\. Please complete the reCAPTCHA challenge below and try again\./i
      );
      expect(mapPhoneAuthError({ code: "auth/missing-app-credential" })).toMatch(
        /Security verification token is missing\. Please complete the reCAPTCHA challenge below and try again\./i
      );
      expect(mapPhoneAuthError({ code: "auth/captcha-check-failed" })).toMatch(
        /Security verification \(reCAPTCHA\) failed\. Please check 'I'm not a robot' below and try again\./i
      );
      expect(mapPhoneAuthError({ code: "auth/unauthorized-domain" })).toMatch(
        /This domain is not authorized for SMS verification\. Please access the application via http:\/\/localhost:5173\./i
      );
      expect(mapPhoneAuthError(new Error("reCAPTCHA connection refused"))).toMatch(
        /reCAPTCHA verification failed\. Please complete the challenge below and try again\./i
      );
    });

    it("strictly differentiates the 4 critical phone auth errors across all payload shapes", () => {
      const invalidAppCredMsg =
        "Security verification failed (invalid app credential). Please complete the reCAPTCHA challenge below and try again.";
      const tooManyRequestsMsg =
        "Too many OTP requests from this device. Please wait a few moments before trying again.";
      const quotaExceededMsg =
        "SMS quota exceeded for today. Please try again later or contact customer support.";
      const captchaFailedMsg =
        "Security verification (reCAPTCHA) failed. Please check 'I'm not a robot' below and try again.";

      // 1. All 4 messages must be mutually distinct
      const messages = [invalidAppCredMsg, tooManyRequestsMsg, quotaExceededMsg, captchaFailedMsg];
      expect(new Set(messages).size).toBe(4);

      // 2. Standard FirebaseError code objects
      expect(mapPhoneAuthError({ code: "auth/invalid-app-credential" })).toBe(invalidAppCredMsg);
      expect(mapPhoneAuthError({ code: "auth/too-many-requests" })).toBe(tooManyRequestsMsg);
      expect(mapPhoneAuthError({ code: "auth/quota-exceeded" })).toBe(quotaExceededMsg);
      expect(mapPhoneAuthError({ code: "auth/captcha-check-failed" })).toBe(captchaFailedMsg);

      // 3. Raw Identity Toolkit backend JSON payloads ({ error: { code: 400, message: "..." } })
      expect(
        mapPhoneAuthError({
          error: { code: 400, message: "INVALID_APP_CREDENTIAL" },
        })
      ).toBe(invalidAppCredMsg);
      expect(
        mapPhoneAuthError({
          error: { code: 400, message: "TOO_MANY_ATTEMPTS_TRY_LATER" },
        })
      ).toBe(tooManyRequestsMsg);
      expect(
        mapPhoneAuthError({
          error: { code: 400, message: "QUOTA_EXCEEDED" },
        })
      ).toBe(quotaExceededMsg);
      expect(
        mapPhoneAuthError({
          error: { code: 400, message: "CAPTCHA_CHECK_FAILED" },
        })
      ).toBe(captchaFailedMsg);

      // 4. Raw string codes and Error instances
      expect(mapPhoneAuthError("INVALID_APP_CREDENTIAL")).toBe(invalidAppCredMsg);
      expect(mapPhoneAuthError("TOO_MANY_ATTEMPTS_TRY_LATER")).toBe(tooManyRequestsMsg);
      expect(
        mapPhoneAuthError(new Error("Firebase: Error (auth/invalid-app-credential)."))
      ).toBe(invalidAppCredMsg);
      expect(
        mapPhoneAuthError(new Error("Firebase: Error (auth/too-many-requests)."))
      ).toBe(tooManyRequestsMsg);
    });
  });

  describe("3. Authoritative Order Placement Boundary Enforcement", () => {
    const mockAddress: Address = {
      id: "addr_test_1",
      userId: "CUS_UNVERIFIED",
      tag: "Home",
      name: "Unverified Customer",
      phone: "+91 98400 12345",
      houseNo: "12",
      street: "Main Road",
      city: "Gobichettipalayam",
      pincode: "638454",
      lat: 11.4598,
      lng: 77.334,
      isDefault: true,
    };

    const mockSlot: DeliverySlot = {
      id: "slot_std",
      type: "standard",
      title: "Standard Delivery",
      badge: "ECO",
      subtitle: "Low carbon consolidated route",
      charge: 0,
    };

    const mockCartItem: CartItem = {
      id: "cart_1",
      productId: "prod_turmeric",
      optionIndex: 0,
      name: "Erode Turmeric Powder",
      image: "https://example.com/turmeric.jpg",
      unit: "g",
      unitSize: "500",
      price: 120,
      mrp: 140,
      stock: 50,
      quantity: 1,
    };

    it("rejects order placement if the customer's phone is not verified in Firestore", async () => {
      // Mock apiClient.get for profile to return unverified customer
      const getSpy = vi.spyOn(apiClient, "get").mockImplementation(async (path: string) => {
        if (path.includes("CUS_UNVERIFIED")) {
          return {
            id: "CUS_UNVERIFIED",
            name: "Unverified Customer",
            phone: "+91 98400 12345",
            phoneVerified: false,
            smartCoins: 100,
            isVIP: false,
          } as unknown as any;
        }
        return [] as any;
      });

      await expect(
        orderService.createOrder({
          userId: "CUS_UNVERIFIED",
          customerName: "Unverified Customer",
          phone: "+91 98400 12345",
          address: mockAddress,
          deliverySlot: mockSlot,
          paymentMethod: "cod",
          cartItems: [mockCartItem],
          subtotal: 120,
          productSavings: 0,
          deliveryFee: 0,
          coinDiscount: 0,
          couponDiscount: 0,
          totalAmount: 120,
        })
      ).rejects.toThrow(/Phone verification required: Please verify your mobile number before placing an order/i);

      getSpy.mockRestore();
    });

    it("rejects order placement if the customer record is not found", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockImplementation(async (path: string) => {
        if (path.includes("CUS_NONEXISTENT")) {
          throw new Error("Customer not found");
        }
        return [] as any;
      });

      await expect(
        orderService.createOrder({
          userId: "CUS_NONEXISTENT",
          customerName: "Missing Customer",
          phone: "+91 98400 12345",
          address: mockAddress,
          deliverySlot: mockSlot,
          paymentMethod: "cod",
          cartItems: [mockCartItem],
          subtotal: 120,
          productSavings: 0,
          deliveryFee: 0,
          coinDiscount: 0,
          couponDiscount: 0,
          totalAmount: 120,
        })
      ).rejects.toThrow(/Phone verification required/i);

      getSpy.mockRestore();
    });

    it("allows order placement when customer phone is verified", async () => {
      const mockVerifiedUser: User = {
        id: "SASS0000104",
        userId: "SASS0000104",
        name: "Arun Kumar",
        phone: "+91 99999 99999",
        phoneVerified: true,
        smartCoins: 215,
        isVIP: false,
        email: "arun.kumar@example.com",
        createdAt: "2024-01-15T09:30:00.000Z",
        referralCode: "SASS0000104",
      };

      const getSpy = vi.spyOn(apiClient, "get").mockImplementation(async (path: string) => {
        if (path.includes("SASS0000104") && !path.includes("orders")) {
          return mockVerifiedUser as any;
        }
        if (path.includes("/orders")) {
          return [] as any;
        }
        return [] as any;
      });

      const postSpy = vi.spyOn(apiClient, "post").mockImplementation(async (_path: string, body: any) => {
        return body;
      });

      const patchSpy = vi.spyOn(apiClient, "patch").mockImplementation(async (_path: string, body: any) => {
        return { ...mockVerifiedUser, ...body };
      });

      const order = await orderService.createOrder({
        userId: "SASS0000104",
        customerName: "Arun Kumar",
        phone: "+91 99999 99999",
        address: { ...mockAddress, userId: "SASS0000104" },
        deliverySlot: mockSlot,
        paymentMethod: "cod",
        cartItems: [mockCartItem],
        subtotal: 120,
        productSavings: 0,
        deliveryFee: 0,
        coinDiscount: 0,
        couponDiscount: 0,
        totalAmount: 120,
      });

      expect(order).toBeDefined();
      expect(order.orderId).toMatch(/^ORD-000\d{4}$/);
      expect(order.phone).toBe("+91 99999 99999");

      getSpy.mockRestore();
      postSpy.mockRestore();
      patchSpy.mockRestore();
    });
  });

  describe("4. RecaptchaVerifier Lifecycle & DOM Management", () => {
    it("safely clears and resets active verifier on clearRecaptcha", () => {
      expect(phoneVerificationService.getActiveVerifier()).toBeNull();
      // clearRecaptcha should be safe and idempotent even with no active verifier
      expect(() => phoneVerificationService.clearRecaptcha()).not.toThrow();
      expect(phoneVerificationService.getActiveVerifier()).toBeNull();
    });

    it("throws a descriptive error in initVisibleRecaptcha if the container is missing from the DOM", async () => {
      await expect(
        phoneVerificationService.initVisibleRecaptcha("non-existent-recaptcha-container")
      ).rejects.toThrow(/reCAPTCHA target container "non-existent-recaptcha-container" was not found in the DOM/i);
    });
  });
});
