import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  onAuthStateChanged,
  signOut,
  type ActionCodeSettings,
} from "firebase/auth";
import { getEmulatorAuth } from "../lib/firebaseEmulator";

/**
 * Passwordless Email-Link Authentication Service (Firebase Authentication Emulator)
 *
 * ============================================================================
 * LOCAL EMULATOR vs. PRODUCTION CONFIGURATION NOTES
 * ============================================================================
 * 1. Local Emulator Mode (`demo-sri-amman-store` on `127.0.0.1:9099`):
 *    - `getEmulatorAuth()` connects the Firebase Auth Web SDK strictly to
 *      `http://127.0.0.1:9099` and blocks non-`demo-*` project IDs or Google
 *      Cloud hosts.
 *    - The Firebase Authentication Emulator does NOT send real SMTP emails.
 *      Instead, when `sendSignInLinkToEmail` is called, the Auth Emulator prints
 *      the generated sign-in link in the terminal logs and exposes it at:
 *      `GET http://127.0.0.1:9099/emulator/v1/projects/demo-sri-amman-store/oobCodes`
 *
 * 2. Completion URL & Authorized Domains Assumptions:
 *    - Default local continuation URL: `http://localhost:5173/login`
 *      (configurable via `VITE_FIREBASE_AUTH_CONTINUE_URL`).
 *    - Before enabling real email delivery in the production Firebase project
 *      (`sri-amman-smart-store`), the following must be configured in
 *      Firebase Console -> Authentication:
 *      a) Sign-in method -> Email/Password -> Enable "Email link (passwordless sign-in)".
 *      b) Settings -> Authorized domains -> Add `localhost` (for dev) and the
 *         production customer domain (domain host only, without `http://` or port).
 *      c) Templates -> Email address verification / Sign-in ->Verify sender and
 *         action URL settings.
 *
 * 3. Identity Boundary:
 *    - Completing email-link sign-in authenticates a Firebase Auth user (`uid`,
 *      `email`, `emailVerified`).
 *    - A Firebase Auth `uid` is NOT a SASS customer document ID (`SASS0000104`).
 *    - This service does NOT create Firestore `users/{userDocId}` documents and
 *      does NOT alter the existing mock authentication session (`sass_customer_session`).
 */

export const EMAIL_LINK_PENDING_STORAGE_KEY = "sass_email_link_pending_email";

const EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface FirebaseEmailLinkAuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
  providerId:
    "firebase-email-link" | "firebase-email-password" | "firebase-google" | "firebase-phone";
}

export interface SendEmailLinkResult {
  success: boolean;
  continueUrl: string;
  deliveryMode: "emulator";
  message: string;
}

export interface EmailLinkUrlInspection {
  status: "valid_link" | "invalid_or_incomplete_link" | "none";
  message?: string;
}

export class EmailLinkAuthError extends Error {
  readonly code: string;
  readonly requiresEmailInput: boolean;

  constructor(
    message: string,
    code: string = "auth/email-link-error",
    requiresEmailInput: boolean = false,
  ) {
    super(message);
    this.name = "EmailLinkAuthError";
    this.code = code;
    this.requiresEmailInput = requiresEmailInput;
  }
}

export interface FirebaseEmailLinkDriver {
  sendSignInLinkToEmail(email: string, actionCodeSettings: ActionCodeSettings): Promise<void>;
  isSignInWithEmailLink(emailLink: string): boolean;
  signInWithEmailLink(
    email: string,
    emailLink: string,
  ): Promise<{
    uid: string;
    email: string | null;
    emailVerified: boolean;
  }>;
  getCurrentUser(): {
    uid: string;
    email: string | null;
    emailVerified: boolean;
    providerId?: string;
  } | null;
  signOut(): Promise<void>;
  onAuthStateChanged?(
    listener: (
      user: {
        uid: string;
        email: string | null;
        emailVerified: boolean;
        isAnonymous?: boolean;
        providerId?: string;
      } | null,
    ) => void,
  ): () => void;
}

class SdkFirebaseEmailLinkDriver implements FirebaseEmailLinkDriver {
  async sendSignInLinkToEmail(
    email: string,
    actionCodeSettings: ActionCodeSettings,
  ): Promise<void> {
    const { auth } = getEmulatorAuth();
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  }

  isSignInWithEmailLink(emailLink: string): boolean {
    if (!emailLink || typeof emailLink !== "string") {
      return false;
    }
    const { auth } = getEmulatorAuth();
    return isSignInWithEmailLink(auth, emailLink);
  }

  async signInWithEmailLink(
    email: string,
    emailLink: string,
  ): Promise<{
    uid: string;
    email: string | null;
    emailVerified: boolean;
  }> {
    const { auth } = getEmulatorAuth();
    const credential = await signInWithEmailLink(auth, email, emailLink);
    return {
      uid: credential.user.uid,
      email: credential.user.email,
      emailVerified: credential.user.emailVerified,
    };
  }

  getCurrentUser(): {
    uid: string;
    email: string | null;
    emailVerified: boolean;
    providerId?: string;
  } | null {
    const { auth } = getEmulatorAuth();
    if (!auth.currentUser) return null;
    return {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email,
      emailVerified: auth.currentUser.emailVerified,
      providerId: auth.currentUser.providerData.some((provider) => provider.providerId === "phone")
        ? "phone"
        : auth.currentUser.providerData.some((provider) => provider.providerId === "google.com")
          ? "google.com"
          : "password",
    };
  }

  async signOut(): Promise<void> {
    const { auth } = getEmulatorAuth();
    await signOut(auth);
  }

  onAuthStateChanged(
    listener: (
      user: {
        uid: string;
        email: string | null;
        emailVerified: boolean;
        isAnonymous?: boolean;
        providerId?: string;
        providerData?: Array<{ providerId: string }>;
      } | null,
    ) => void,
  ): () => void {
    const { auth } = getEmulatorAuth();
    return onAuthStateChanged(auth, (sdkUser) => {
      if (!sdkUser) {
        listener(null);
        return;
      }
      listener({
        uid: sdkUser.uid,
        email: sdkUser.email,
        emailVerified: sdkUser.emailVerified,
        isAnonymous: sdkUser.isAnonymous,
        providerId: sdkUser.providerData.some((provider) => provider.providerId === "phone")
          ? "phone"
          : sdkUser.providerData.some((provider) => provider.providerId === "google.com")
            ? "google.com"
            : "password",
      });
    });
  }
}

let activeDriver: FirebaseEmailLinkDriver = new SdkFirebaseEmailLinkDriver();
let sendInFlight = false;
let completeInFlight = false;
let currentVerifiedUser: FirebaseEmailLinkAuthUser | null = null;
let inMemoryPendingEmail: string | null = null;
const authStateListeners = new Set<(user: FirebaseEmailLinkAuthUser | null) => void>();

function notifyAuthStateListeners(user: FirebaseEmailLinkAuthUser | null): void {
  for (const listener of Array.from(authStateListeners)) {
    try {
      listener(user);
    } catch {
      // Ignore individual listener errors
    }
  }
}

function readEnvVar(key: string): string | undefined {
  if (typeof process !== "undefined" && process.env && process.env[key] !== undefined) {
    return process.env[key];
  }
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[key] !== undefined) {
    return String(import.meta.env[key]);
  }
  return undefined;
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.sessionStorage) {
      return window.sessionStorage;
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
  return null;
}

export function validateEmailForLinkSignIn(rawEmail: string): string {
  const cleaned = (typeof rawEmail === "string" ? rawEmail : "").trim().toLowerCase();
  if (!cleaned || !EMAIL_FORMAT_RE.test(cleaned)) {
    throw new EmailLinkAuthError("Please enter a valid email address.", "auth/invalid-email");
  }
  return cleaned;
}

export function isSafeInternalRedirectPath(pathValue?: string): boolean {
  if (!pathValue || typeof pathValue !== "string") return false;
  const trimmed = pathValue.trim();
  return trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("://");
}

export function buildEmailLinkActionCodeSettings(options?: {
  continueUrl?: string;
  redirect?: string;
}): ActionCodeSettings {
  const configuredContinueUrl =
    options?.continueUrl?.trim() ||
    readEnvVar("VITE_FIREBASE_AUTH_CONTINUE_URL")?.trim() ||
    (typeof window !== "undefined" && window.location?.origin
      ? `${window.location.origin}/login`
      : "http://localhost:5173/login");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(configuredContinueUrl);
  } catch {
    throw new EmailLinkAuthError(
      "Invalid email-link continuation URL configuration.",
      "auth/invalid-continue-uri",
    );
  }

  const hostname = parsedUrl.hostname.toLowerCase();
  if (hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "::1") {
    throw new EmailLinkAuthError(
      `Continuation URL host "${parsedUrl.hostname}" is not permitted in local emulator mode. Use localhost or 127.0.0.1.`,
      "auth/unauthorized-continue-uri",
    );
  }

  if (options?.redirect && isSafeInternalRedirectPath(options.redirect)) {
    parsedUrl.searchParams.set("redirect", options.redirect.trim());
  }

  return {
    url: parsedUrl.toString(),
    handleCodeInApp: true,
  };
}

function mapFirebaseAuthError(err: unknown, fallbackMessage: string): EmailLinkAuthError {
  if (err instanceof EmailLinkAuthError) {
    return err;
  }

  const rawCode =
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    typeof (err as { code: unknown }).code === "string"
      ? (err as { code: string }).code
      : "auth/email-link-error";

  switch (rawCode) {
    case "auth/expired-action-code":
      return new EmailLinkAuthError(
        "This sign-in link has expired. Please request a new email sign-in link.",
        rawCode,
      );
    case "auth/invalid-action-code":
      return new EmailLinkAuthError(
        "This sign-in link is invalid or has already been used. Please request a new email sign-in link.",
        rawCode,
      );
    case "auth/invalid-email":
      return new EmailLinkAuthError(
        "The email address provided is invalid or does not match the sign-in link.",
        rawCode,
      );
    case "auth/missing-email":
      return new EmailLinkAuthError(
        "Please enter the email address where you requested the sign-in link.",
        rawCode,
        true,
      );
    case "auth/user-disabled":
      return new EmailLinkAuthError(
        "This account has been disabled. Please contact support.",
        rawCode,
      );
    case "auth/network-request-failed":
      return new EmailLinkAuthError(
        "Could not reach the local Firebase Authentication Emulator (127.0.0.1:9099). Make sure the emulator is running.",
        rawCode,
      );
    default: {
      const msg = err instanceof Error && err.message ? err.message : fallbackMessage;
      return new EmailLinkAuthError(msg, rawCode);
    }
  }
}

export const emailLinkAuthService = {
  /**
   * Overrides the underlying Firebase Auth driver for unit testing.
   */
  setDriverForTesting(driver: FirebaseEmailLinkDriver | null): void {
    activeDriver = driver ?? new SdkFirebaseEmailLinkDriver();
    sendInFlight = false;
    completeInFlight = false;
    currentVerifiedUser = null;
    authStateListeners.clear();
    this.clearPendingEmail();
  },

  isSendingLink(): boolean {
    return sendInFlight;
  },

  isCompletingSignIn(): boolean {
    return completeInFlight;
  },

  /**
   * Stores the pending email in tab-scoped `sessionStorage` (never persistent `localStorage`)
   * so same-tab completion works seamlessly while avoiding unnecessary persistent storage.
   */
  savePendingEmail(email: string): void {
    const clean = validateEmailForLinkSignIn(email);
    inMemoryPendingEmail = clean;
    const storage = getSessionStorage();
    if (storage) {
      storage.setItem(EMAIL_LINK_PENDING_STORAGE_KEY, clean);
    }
  },

  getPendingEmail(): string | null {
    const storage = getSessionStorage();
    if (storage) {
      const val = storage.getItem(EMAIL_LINK_PENDING_STORAGE_KEY);
      if (val && val.trim().length > 0) {
        return val.trim().toLowerCase();
      }
    }
    return inMemoryPendingEmail;
  },

  clearPendingEmail(): void {
    inMemoryPendingEmail = null;
    const storage = getSessionStorage();
    if (storage) {
      storage.removeItem(EMAIL_LINK_PENDING_STORAGE_KEY);
    }
  },

  /**
   * Inspects a URL to determine whether it is a valid Firebase Email Sign-In link,
   * an incomplete/malformed email-link callback attempt, or a normal route visit.
   *
   * Never marks a user authenticated merely because they visited the completion URL.
   */
  inspectCallbackUrl(linkUrl: string): EmailLinkUrlInspection {
    if (!linkUrl || typeof linkUrl !== "string") {
      return { status: "none" };
    }

    try {
      if (activeDriver.isSignInWithEmailLink(linkUrl)) {
        return { status: "valid_link" };
      }
    } catch {
      // Fall through to query parameter inspection
    }

    try {
      const parsed = new URL(linkUrl, "http://localhost:5173");
      const mode = parsed.searchParams.get("mode");
      const oobCode = parsed.searchParams.get("oobCode");
      const emailLinkFlag = parsed.searchParams.get("emailLink");

      if (
        mode === "signIn" ||
        oobCode !== null ||
        emailLinkFlag === "1" ||
        emailLinkFlag === "true"
      ) {
        return {
          status: "invalid_or_incomplete_link",
          message:
            "This sign-in link is invalid, expired, or incomplete. Please request a new email sign-in link.",
        };
      }
    } catch {
      return { status: "none" };
    }

    return { status: "none" };
  },

  /**
   * Requests a passwordless sign-in link from the local Firebase Authentication Emulator.
   */
  async sendSignInLink(
    email: string,
    options?: { continueUrl?: string; redirect?: string },
  ): Promise<SendEmailLinkResult> {
    if (sendInFlight) {
      throw new EmailLinkAuthError(
        "A sign-in link request is already in progress. Please wait.",
        "auth/duplicate-request",
      );
    }

    const cleanEmail = validateEmailForLinkSignIn(email);
    const actionCodeSettings = buildEmailLinkActionCodeSettings(options);

    sendInFlight = true;
    try {
      await activeDriver.sendSignInLinkToEmail(cleanEmail, actionCodeSettings);
      this.savePendingEmail(cleanEmail);

      return {
        success: true,
        continueUrl: actionCodeSettings.url,
        deliveryMode: "emulator",
        message:
          "Sign-in link generated in the local Firebase Authentication Emulator. Open the link from the emulator logs (or load it below in local dev) to finish signing in.",
      };
    } catch (err: unknown) {
      throw mapFirebaseAuthError(
        err,
        "Failed to send email sign-in link. Ensure the Firebase Auth Emulator is running on port 9099.",
      );
    } finally {
      sendInFlight = false;
    }
  },

  /**
   * Completes passwordless email-link authentication using Firebase's
   * `isSignInWithEmailLink` and `signInWithEmailLink`.
   *
   * Supports both same-browser completion (using tab-scoped `sessionStorage`)
   * and cross-browser / new-tab completion (using `providedEmail`).
   */
  async completeSignInWithEmailLink(
    linkUrl: string,
    providedEmail?: string,
  ): Promise<FirebaseEmailLinkAuthUser> {
    if (completeInFlight) {
      throw new EmailLinkAuthError(
        "Sign-in verification is already in progress. Please wait.",
        "auth/duplicate-request",
      );
    }

    if (!linkUrl || !activeDriver.isSignInWithEmailLink(linkUrl)) {
      throw new EmailLinkAuthError(
        "This sign-in link is invalid, expired, or incomplete. Please request a new email sign-in link.",
        "auth/invalid-email-link",
      );
    }

    const candidateEmail =
      providedEmail !== undefined && providedEmail.trim().length > 0
        ? providedEmail
        : this.getPendingEmail();

    if (!candidateEmail) {
      throw new EmailLinkAuthError(
        "Please enter the email address where you requested the sign-in link to confirm your identity.",
        "auth/missing-email",
        true,
      );
    }

    const cleanEmail = validateEmailForLinkSignIn(candidateEmail);

    completeInFlight = true;
    try {
      const verified = await activeDriver.signInWithEmailLink(cleanEmail, linkUrl);
      this.clearPendingEmail();

      const authUser: FirebaseEmailLinkAuthUser = {
        uid: verified.uid,
        email: verified.email || cleanEmail,
        emailVerified: verified.emailVerified,
        providerId: "firebase-email-link",
      };
      currentVerifiedUser = authUser;
      notifyAuthStateListeners(authUser);
      return authUser;
    } catch (err: unknown) {
      const mapped = mapFirebaseAuthError(
        err,
        "Could not complete email-link sign-in. The link may have expired or already been used.",
      );
      if (
        mapped.code === "auth/expired-action-code" ||
        mapped.code === "auth/invalid-action-code"
      ) {
        this.clearPendingEmail();
      }
      throw mapped;
    } finally {
      completeInFlight = false;
    }
  },

  getCurrentFirebaseAuthUser(): FirebaseEmailLinkAuthUser | null {
    if (currentVerifiedUser) {
      return currentVerifiedUser;
    }
    try {
      const sdkUser = activeDriver.getCurrentUser();
      if (sdkUser && sdkUser.uid) {
        const providerId = sdkUser.providerId;
        return {
          uid: sdkUser.uid,
          email: sdkUser.email || "",
          emailVerified: sdkUser.emailVerified,
          providerId:
            providerId === "phone"
              ? "firebase-phone"
              : providerId === "google.com"
                ? "firebase-google"
                : "firebase-email-password",
        };
      }
    } catch {
      // Ignore if Auth Emulator not yet initialized
    }
    return null;
  },

  /**
   * Subscribes to Firebase Authentication state changes via the active driver's
   * `onAuthStateChanged` listener (backed by the Firebase Auth SDK in browser/emulator
   * mode, with a deterministic fallback for unit test drivers).
   *
   * Returns an unsubscribe function that must be called on unmount.
   */
  subscribeToAuthStateChanges(
    listener: (user: FirebaseEmailLinkAuthUser | null) => void,
  ): () => void {
    let isUnsubscribed = false;
    const wrappedListener = (user: FirebaseEmailLinkAuthUser | null) => {
      if (!isUnsubscribed) {
        listener(user);
      }
    };

    authStateListeners.add(wrappedListener);

    let driverUnsubscribe: (() => void) | null = null;
    if (typeof activeDriver.onAuthStateChanged === "function") {
      try {
        driverUnsubscribe = activeDriver.onAuthStateChanged((rawUser) => {
          if (isUnsubscribed) return;
          if (!rawUser || !rawUser.uid || rawUser.isAnonymous === true) {
            currentVerifiedUser = null;
            wrappedListener(null);
            return;
          }
          const mapped: FirebaseEmailLinkAuthUser = {
            uid: rawUser.uid,
            email: rawUser.email || currentVerifiedUser?.email || "",
            emailVerified: rawUser.emailVerified,
            providerId:
              rawUser.providerId === "phone"
                ? "firebase-phone"
                : rawUser.providerId === "google.com"
                  ? "firebase-google"
                  : rawUser.providerId === "password"
                    ? "firebase-email-password"
                    : "firebase-email-link",
          };
          currentVerifiedUser = mapped;
          wrappedListener(mapped);
        });
      } catch {
        queueMicrotask(() => {
          wrappedListener(this.getCurrentFirebaseAuthUser());
        });
      }
    } else {
      queueMicrotask(() => {
        wrappedListener(this.getCurrentFirebaseAuthUser());
      });
    }

    return () => {
      isUnsubscribed = true;
      authStateListeners.delete(wrappedListener);
      if (driverUnsubscribe) {
        try {
          driverUnsubscribe();
        } catch {
          // Ignore cleanup errors
        }
        driverUnsubscribe = null;
      }
    };
  },

  async signOutFirebaseAuth(): Promise<void> {
    currentVerifiedUser = null;
    this.clearPendingEmail();
    try {
      await activeDriver.signOut();
    } catch {
      // Ignore signOut errors when emulator is offline
    } finally {
      notifyAuthStateListeners(null);
    }
  },
};
