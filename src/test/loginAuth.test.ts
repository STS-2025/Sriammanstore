import { describe, it, expect, beforeEach } from "vitest";
import { authService, TEST_CREDENTIALS } from "../services/authService";

describe("Login & Authentication Service (Mock Mode)", () => {
  beforeEach(() => {
    authService.logout();
  });

  describe("Mobile OTP Authentication Flow", () => {
    it("successfully requests OTP for a valid 10-digit number", async () => {
      const res = await authService.requestOtp("+91 99999 99999");
      expect(res.success).toBe(true);
      expect(res.message).toContain("OTP sent");
    });

    it("rejects OTP request for invalid phone numbers", async () => {
      await expect(authService.requestOtp("12345")).rejects.toThrow(
        "Please enter a valid 10-digit mobile number."
      );
    });

    it("rejects invalid OTP during verification", async () => {
      await expect(
        authService.verifyOtp("+91 99999 99999", "999999")
      ).rejects.toThrow("Invalid OTP");
    });

    it("successfully verifies valid OTP for registered user (Arun Kumar)", async () => {
      const user = await authService.verifyOtp(
        TEST_CREDENTIALS.phone,
        TEST_CREDENTIALS.otp
      );
      expect(user).toBeDefined();
      expect(user.id).toBe("SASS0000104");
      expect(user.name).toBe("Arun Kumar");
      expect(authService.getCurrentUser()?.id).toBe("SASS0000104");
    });

    it("successfully verifies VIP user (Priya Sundaram)", async () => {
      const user = await authService.verifyOtp(
        TEST_CREDENTIALS.vipPhone,
        TEST_CREDENTIALS.otp
      );
      expect(user).toBeDefined();
      expect(user.id).toBe("SASS0000088");
      expect(user.name).toBe("Priya Sundaram");
      expect(user.isVIP).toBe(true);
      expect(user.coins).toBeGreaterThanOrEqual(620);
    });

    it("rejects an unregistered phone without creating a customer record", async () => {
      const newPhone = "9876543210";
      await expect(authService.verifyOtp(newPhone, TEST_CREDENTIALS.otp)).rejects.toThrow(
        "No account registered with this mobile number",
      );
    });

    it("does not request a mock OTP for an unregistered phone", async () => {
      const newPhone = "9123456789";
      await expect(authService.requestOtp(newPhone)).rejects.toThrow(
        "No account registered with this mobile number",
      );
    });
  });

  describe("Email & Password Authentication Flow", () => {
    it("validates email format and rejects malformed email", async () => {
      await expect(
        authService.loginWithEmail("invalid-email", "password123")
      ).rejects.toThrow("Please enter a valid email address.");
    });

    it("validates password length and rejects short password", async () => {
      await expect(
        authService.loginWithEmail("arun.kumar@example.com", "123")
      ).rejects.toThrow("Password must be at least 6 characters long.");
    });

    it("rejects login for unregistered email addresses", async () => {
      await expect(
        authService.loginWithEmail("nonexistent@example.com", "password123")
      ).rejects.toThrow("No account found with this email");
    });

    it("successfully logs in with valid registered email (Arun Kumar)", async () => {
      const user = await authService.loginWithEmail(
        TEST_CREDENTIALS.regularEmail,
        TEST_CREDENTIALS.defaultPassword
      );
      expect(user).toBeDefined();
      expect(user.id).toBe("SASS0000104");
      expect(user.email).toBe(TEST_CREDENTIALS.regularEmail);
      expect(authService.getCurrentUser()?.id).toBe("SASS0000104");
    });

    it("successfully logs in with VIP customer email (Priya Sundaram)", async () => {
      const user = await authService.loginWithEmail(
        TEST_CREDENTIALS.vipEmail,
        TEST_CREDENTIALS.defaultPassword
      );
      expect(user).toBeDefined();
      expect(user.id).toBe("SASS0000088");
      expect(user.isVIP).toBe(true);
      expect(authService.getCurrentUser()?.id).toBe("SASS0000088");
    });
  });

  describe("Referral Code Validation", () => {
    it("validates standard system codes (AMMAN50, AMMAN100)", async () => {
      const res50 = await authService.validateReferralCode("AMMAN50");
      expect(res50.valid).toBe(true);
      expect(res50.bonusCoins).toBe(50);

      const res100 = await authService.validateReferralCode("AMMAN100");
      expect(res100.valid).toBe(true);
      expect(res100.bonusCoins).toBe(100);
    });

    it("validates customer referral code format (SASS...)", async () => {
      const res = await authService.validateReferralCode("SASS0000088");
      expect(res.valid).toBe(true);
      expect(res.bonusCoins).toBe(50);
    });

    it("rejects invalid or blank referral codes", async () => {
      const emptyRes = await authService.validateReferralCode("");
      expect(emptyRes.valid).toBe(false);

      const invalidRes = await authService.validateReferralCode("INVALID999");
      expect(invalidRes.valid).toBe(false);
    });
  });

  describe("Session Persistence & Isolation", () => {
    it("persists active session in localStorage and clears upon logout", async () => {
      const user = await authService.loginWithEmail(
        TEST_CREDENTIALS.regularEmail,
        TEST_CREDENTIALS.defaultPassword
      );
      expect(authService.getCurrentUser()?.id).toBe(user.id);

      authService.logout();
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe("OTP Input Layout & Paste/Navigation Regression Verification", () => {
    it("enforces responsive grid sizing (w-full, min-w-0, max-w-full, box-border, size={1}) and paste handler on OTP inputs in login.tsx", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const loginSource = fs.readFileSync(
        path.resolve(__dirname, "../routes/login.tsx"),
        "utf-8"
      );

      // Container must use w-full max-w-md grid grid-cols-6 box-border
      expect(loginSource).toContain('id="otp-container"');
      expect(loginSource).toMatch(/id="otp-container"[^>]*className="[^"]*grid-cols-6|className="[^"]*w-full max-w-md mx-auto grid grid-cols-6[^"]*box-border"[^>]*id="otp-container"/);

      // Each OTP input must specify size={1}, maxLength={1}, onPaste, and w-full min-w-0 max-w-full box-border px-0 py-0 text-center
      expect(loginSource).toContain("size={1}");
      expect(loginSource).toContain("maxLength={1}");
      expect(loginSource).toContain("onPaste={(e) => handleDigitPaste(idx, e)}");
      expect(loginSource).toContain("w-full min-w-0 max-w-full");
      expect(loginSource).toContain("box-border px-0 py-0");
      expect(loginSource).not.toMatch(/aspect-square[^>]*aria-label=\{`OTP Digit/);
    });
  });
});

