import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  type ConfirmationResult,
  type ApplicationVerifier,
} from "firebase/auth";
import { auth as firebaseAuth } from "../firebase-config.jsx";
import { authManager } from "./authAdapter";
import { customerIdentityService } from "./customerIdentityService";
import { apiClient } from "./apiClient";
import { getCustomerProfileEndpoint } from "./customerDataSourceResolver";
import type { User } from "../types";

let activeRecaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Normalizes a country code and national number into standard E.164 format.
 * Example: ("+91", "98400 12345") -> "+919840012345"
 */
export function formatToE164(countryCode: string, nationalNumber: string): string {
  const input = (nationalNumber || "").trim();
  const codeDigits = (countryCode || "+91").replace(/\D/g, "");
  let digits = input.replace(/\D/g, "");
  if (input.startsWith("+")) return `+${digits}`;
  if (digits.startsWith(codeDigits) && digits.length > codeDigits.length + 5) digits = digits.slice(codeDigits.length);
  return `+${codeDigits}${digits}`;
}

/**
 * Validates a national phone number according to country code rules.
 */
export function validatePhoneNumber(
  nationalNumber: string,
  countryCode: string = "+91"
): { valid: boolean; error?: string } {
  const digits = nationalNumber.replace(/\D/g, "");
  if (!digits) {
    return { valid: false, error: "Please enter your mobile number." };
  }

  if (countryCode === "+91") {
    if (digits.length !== 10) {
      return { valid: false, error: "Please enter a valid 10-digit Indian mobile number." };
    }
    if (!/^[6-9]/.test(digits)) {
      return { valid: false, error: "Indian mobile numbers must start with 6, 7, 8, or 9." };
    }
  } else {
    if (digits.length < 6 || digits.length > 15) {
      return { valid: false, error: "Please enter a valid mobile number (6 to 15 digits)." };
    }
  }

  return { valid: true };
}

/**
 * Extracts a normalized Firebase Phone Authentication error code from various error shapes:
 * - FirebaseError instance (error.code, e.g. "auth/invalid-app-credential")
 * - Plain error with code (e.g. { code: "auth/invalid-app-credential" } or { code: "invalid-app-credential" })
 * - Direct backend JSON error (e.g. { error: { message: "INVALID_APP_CREDENTIAL" } })
 * - Error with string message containing Firebase code or backend string
 * - Raw string code
 */
export function extractPhoneAuthErrorCode(error: unknown): string {
  if (!error) return "";

  if (typeof error === "string") {
    const trimmed = error.trim();
    if (trimmed.startsWith("auth/")) return trimmed.toLowerCase();
    if (trimmed === "INVALID_APP_CREDENTIAL") return "auth/invalid-app-credential";
    if (trimmed === "TOO_MANY_ATTEMPTS_TRY_LATER") return "auth/too-many-requests";
    if (trimmed === "QUOTA_EXCEEDED") return "auth/quota-exceeded";
    if (trimmed === "CAPTCHA_CHECK_FAILED") return "auth/captcha-check-failed";
    const authMatch = trimmed.match(/auth\/[a-z0-9-]+/i);
    if (authMatch) return authMatch[0].toLowerCase();
    return trimmed;
  }

  const errObj = error as Record<string, unknown>;
  const rawCode = typeof errObj["code"] === "string" ? errObj["code"].trim() : "";
  if (rawCode) {
    if (rawCode.startsWith("auth/")) return rawCode.toLowerCase();
    return `auth/${rawCode.toLowerCase()}`;
  }

  // Nested backend error structures from Identity Toolkit: { error: { code: 400, message: "INVALID_APP_CREDENTIAL" } }
  const nestedError = errObj["error"] as Record<string, unknown> | undefined;
  const backendMsg =
    typeof nestedError?.["message"] === "string"
      ? nestedError["message"].trim()
      : typeof errObj["message"] === "string"
        ? errObj["message"].trim()
        : "";

  if (backendMsg === "INVALID_APP_CREDENTIAL") return "auth/invalid-app-credential";
  if (backendMsg === "TOO_MANY_ATTEMPTS_TRY_LATER") return "auth/too-many-requests";
  if (backendMsg === "QUOTA_EXCEEDED") return "auth/quota-exceeded";
  if (backendMsg === "CAPTCHA_CHECK_FAILED") return "auth/captcha-check-failed";

  const match = backendMsg.match(/auth\/[a-z0-9-]+/i);
  if (match) return match[0].toLowerCase();

  return "";
}

/**
 * Maps Firebase Phone Authentication errors to clear, customer-friendly messages.
 */
export function mapPhoneAuthError(error: unknown): string {
  const errCode = extractPhoneAuthErrorCode(error);
  const rawMessage = error instanceof Error ? error.message : String(error);

  switch (errCode) {
    case "auth/invalid-app-credential":
      return "Security verification failed (invalid app credential). Please complete the reCAPTCHA challenge below and try again.";
    case "auth/missing-app-credential":
      return "Security verification token is missing. Please complete the reCAPTCHA challenge below and try again.";
    case "auth/captcha-check-failed":
      return "Security verification (reCAPTCHA) failed. Please check 'I'm not a robot' below and try again.";
    case "auth/invalid-phone-number":
      return "The phone number entered is invalid. Please check the digits and try again.";
    case "auth/missing-phone-number":
      return "Please enter your mobile number before requesting an OTP.";
    case "auth/quota-exceeded":
      return "SMS quota exceeded for today. Please try again later or contact customer support.";
    case "auth/too-many-requests":
      return "Too many OTP requests from this device. Please wait a few moments before trying again.";
    case "auth/invalid-verification-code":
      return "Invalid verification code. Please enter the correct 6-digit OTP sent to your phone.";
    case "auth/code-expired":
      return "The verification code has expired. Please request a new OTP.";
    case "auth/credential-already-in-use":
      return "This mobile number is already associated with an account. Sign in to the account that owns it or contact support for safe account recovery.";
    case "auth/provider-already-linked":
      return "A mobile number is already linked to this account.";
    case "auth/requires-recent-login":
      return "For your security, please sign in again before linking a new mobile number.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized for SMS verification. Please access the application via http://localhost:5173.";
    case "auth/network-request-failed":
      return "Network connection error. Please verify your internet connection and try again.";
    default:
      if (rawMessage.toLowerCase().includes("recaptcha")) {
        return "reCAPTCHA verification failed. Please complete the challenge below and try again.";
      }
      return rawMessage || "Failed to process phone verification. Please try again.";
  }
}

export const phoneVerificationService = {
  /**
   * Initializes a visible RecaptchaVerifier instance on the specified container and renders it.
   * If an active verifier already exists, clears it first using the Firebase SDK clear() lifecycle.
   */
  async initVisibleRecaptcha(
    container: HTMLElement | string,
    options: {
      onSolved?: (token: string) => void;
      onExpired?: () => void;
      onError?: (error?: unknown) => void;
    } = {}
  ): Promise<RecaptchaVerifier> {
    if (typeof window === "undefined") {
      throw new Error("RecaptchaVerifier requires a browser window environment.");
    }

    this.clearRecaptcha();

    const targetEl =
      typeof container === "string" ? document.getElementById(container) : container;

    if (!targetEl) {
      throw new Error(
        `reCAPTCHA target container "${typeof container === "string" ? container : "element"}" was not found in the DOM.`
      );
    }

    const authInstance = firebaseAuth;
    const verifier = new RecaptchaVerifier(authInstance, targetEl, {
      size: "normal",
      callback: (token: string) => {
        if (options.onSolved) options.onSolved(token);
      },
      "expired-callback": () => {
        if (options.onExpired) options.onExpired();
      },
      "error-callback": (err: unknown) => {
        if (options.onError) options.onError(err);
      },
    });

    try {
      await verifier.render();
    } catch (renderErr) {
      console.warn("[PhoneVerificationService] Recaptcha render error:", renderErr);
    }

    activeRecaptchaVerifier = verifier;
    return verifier;
  },

  /**
   * Returns the currently active RecaptchaVerifier if already initialized and not destroyed.
   */
  getActiveVerifier(): RecaptchaVerifier | null {
    if (activeRecaptchaVerifier && !(activeRecaptchaVerifier as any).destroyed) {
      return activeRecaptchaVerifier;
    }
    return null;
  },

  /**
   * Cleans up the active RecaptchaVerifier using the official SDK clear() method.
   * Clears the Firebase verifier through its SDK lifecycle without directly manipulating the widget.
   */
  clearRecaptcha(): void {
    if (activeRecaptchaVerifier) {
      try {
        if (!(activeRecaptchaVerifier as any).destroyed) {
          activeRecaptchaVerifier.clear();
        }
      } catch {
        // Safe clear
      }
      activeRecaptchaVerifier = null;
    }
  },

  /**
   * Sends a real SMS OTP via Firebase Phone Authentication.
   * Uses linkWithPhoneNumber if the user is already authenticated with email/Google,
   * An authenticated user must link to their current account. Conflicts never switch sessions.
   */
  async sendVerificationOtp(
    e164PhoneNumber: string,
    appVerifier: ApplicationVerifier
  ): Promise<ConfirmationResult> {
    if (!/^\+[1-9]\d{6,14}$/.test(e164PhoneNumber)) {
      throw new Error("Invalid phone number format. Must be E.164 (e.g. +919840012345).");
    }

    const authInstance = firebaseAuth;
    const currentUser = authInstance.currentUser;

    if (currentUser && !currentUser.phoneNumber) return await linkWithPhoneNumber(currentUser, e164PhoneNumber, appVerifier);
    if (currentUser?.phoneNumber) throw new Error("Your account already has a verified mobile number. Contact support to change it safely.");

    return await signInWithPhoneNumber(authInstance, e164PhoneNumber, appVerifier);
  },

  /**
   * Verifies the 6-digit OTP code against the Firebase ConfirmationResult.
   */
  async confirmVerificationOtp(
    confirmationResult: ConfirmationResult,
    otpCode: string
  ): Promise<{ success: boolean; phoneNumber: string }> {
    const cleanCode = (otpCode || "").trim().replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      throw new Error("Please enter a valid 6-digit verification code.");
    }

    const authInstance = firebaseAuth;
    const intendedUid = authInstance.currentUser?.uid ?? null;
    const credentialResult = await confirmationResult.confirm(cleanCode);
    const currentUser = authInstance.currentUser;
    if (intendedUid && credentialResult.user.uid !== intendedUid) throw new Error("Phone verification resolved to a different account. The signed-in account was not changed; sign in to the account that owns this number.");
    if (intendedUid && currentUser?.uid !== intendedUid) throw new Error("Your signed-in account changed during phone verification. Please sign in again.");
    const verifiedPhone = credentialResult.user.phoneNumber || "";
    if (!verifiedPhone) throw new Error("Firebase did not return a verified phone number.");

    return {
      success: true,
      phoneNumber: verifiedPhone,
    };
  },

  /**
   * Persists the verified phone number to the customer's canonical profile.
   * Updates `phoneVerified: true` and the E.164 phone number.
   */
  async persistVerifiedPhone(params: {
    userId: string;
    verifiedPhone: string;
    uid?: string | undefined;
  }): Promise<User> {
    const { userId, verifiedPhone, uid } = params;
    const cleanPhone = (verifiedPhone || "").trim();
    if (!cleanPhone || !/^\+\d{7,15}$/.test(cleanPhone)) {
      throw new Error("Invalid verified phone number format.");
    }

    const detectedCountryCode =
      ["+971", "+61", "+44", "+91", "+1"].find((code) => cleanPhone.startsWith(code)) || "+91";
    const nationalNumber = cleanPhone.slice(detectedCountryCode.length).replace(/\D/g, "");

    const mode = authManager.getMode();
    const activeUid = uid || firebaseAuth.currentUser?.uid;

    if (mode === "production") {
      if (!activeUid) {
        throw new Error("The authenticated customer identity is unavailable. Sign in again, then retry synchronization without requesting another OTP.");
      }
      // In production mode, persist through customerIdentityService to onlineCustomers
      return await customerIdentityService.updateVerifiedPhoneNumber({
        uid: activeUid,
        customerId: userId,
        verifiedE164Phone: cleanPhone,
      });
    }

    // In emulator or mock mode, update profile via apiClient / users endpoint
    const endpoint = getCustomerProfileEndpoint(userId);
    const payload = {
      phoneVerified: true,
      phone: cleanPhone,
      number: nationalNumber,
      countryCode: detectedCountryCode,
      updatedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    try {
      const patched = await apiClient.patch<User>(endpoint, payload);
      if (patched) return patched;
    } catch {
      // Fallback
    }

    return {
      id: userId,
      userId: userId,
      name: "Customer",
      phone: cleanPhone,
      countryCode: detectedCountryCode,
      phoneVerified: true,
      email: "",
      isVIP: false,
      referralCode: userId,
      createdAt: new Date().toISOString(),
    };
  },
};

