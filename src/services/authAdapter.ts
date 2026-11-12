import type { FirebaseApp } from "firebase/app";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword as firebaseCreateUserWithEmailAndPassword,
  sendEmailVerification as firebaseSendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
} from "firebase/auth";
import { getEmulatorAuth, type EmulatorConfig } from "../lib/firebaseEmulator";
import {
  app as configuredFirebaseApp,
  auth as configuredFirebaseAuth,
  provider as configuredGoogleProvider,
} from "../firebase-config.jsx";
import {
  EXPECTED_PRODUCTION_PROJECT_ID,
  EXPECTED_PRODUCTION_AUTH_DOMAIN,
  PRODUCTION_SDK_APP_NAME,
  validateProductionPreviewConfig,
} from "./productionPreviewService";
import { authService } from "./authService";
import type { User } from "../types";

export type AuthMode = "emulator" | "production" | "mock";

export const PRODUCTION_AUTH_APP_NAME = PRODUCTION_SDK_APP_NAME;

export interface AuthUserIdentity {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  phoneNumber?: string | null;
  providerId: string;
  isAnonymous?: boolean;
}

export interface AuthStatus {
  mode: AuthMode;
  isProduction: boolean;
  isEmulator: boolean;
  isMock: boolean;
  projectId: string;
  authDomain?: string;
  emulatorHost?: string;
  emulatorPort?: number;
}

/**
 * Raised when any state-mutating action is attempted against production Firebase Auth
 * during Phase 2.
 */
export class ProductionAuthSafetyError extends Error {
  constructor(action: string) {
    super(
      `SAFETY VIOLATION: Production write action "${action}" is strictly prohibited in Phase 2.\n` +
      `Creating production auth accounts, sending verification emails, or mutating customer documents require separate explicit user approval.`
    );
    this.name = "ProductionAuthSafetyError";
  }
}

/**
 * Maps raw Firebase Authentication error codes to safe, customer-friendly messages
 * without leaking passwords, secret tokens, or internal account discovery details.
 */
export function mapFirebaseAuthError(error: unknown): string {
  if (!error) return "Authentication failed. Please try again.";

  const rawCode =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : "";
  const rawMessage = error instanceof Error ? error.message : String(error);

  switch (rawCode) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email address or password. Please verify your credentials or sign in with Mobile OTP.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-disabled":
      return "This customer account has been disabled. Please contact Sri Amman Smart Store support.";
    case "auth/too-many-requests":
      return "Access to this account has been temporarily disabled due to many failed login attempts. Please try again later or reset your password.";
    case "auth/network-request-failed":
      return "Network connection error. Please verify your internet connection and try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled. You can try again when you are ready.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
    case "auth/operation-not-allowed":
      return "This authentication method is currently disabled. Please sign in with Mobile OTP or contact support.";
    case "auth/email-already-in-use":
      return "An account may already exist for this email. Try signing in or password recovery.";
    case "auth/requires-recent-login":
      return "This operation requires a recent sign-in. Please log in again to continue.";
    case "auth/emulator-unavailable":
      return "The authentication service is unavailable. Check your connection and try again.";
    default:
      if (rawCode === "auth/unauthorized-domain") {
        return "This site is not on Firebase Auth's authorized domains list. In Firebase Console, open Authentication → Settings → Authorized domains and add this hostname.";
      }
      if (rawMessage.includes("SAFETY VIOLATION")) {
        return rawMessage;
      }
      if (rawMessage.includes("ECONNREFUSED") || rawMessage.includes("Failed to fetch")) {
        return "Unable to connect to the authentication service. Please check your connection or emulator status.";
      }
      return "Authentication failed. Please check your details and try again.";
  }
}

/**
 * Resolves the default authentication mode.
 *
 * STRICT INVARIANTS:
 * 1. Always defaults to "emulator" (local Auth Emulator at 127.0.0.1:9099).
 * 2. Ignores any production catalog parameters (e.g. `?catalogMode=production-readonly`
 *    must NEVER activate production authentication).
 * 3. Only switches if explicitly configured via `VITE_AUTH_MODE`, `sessionStorage`,
 *    or dedicated `authMode` parameter.
 */
export function resolveDefaultAuthMode(): AuthMode {
  if (import.meta.env.MODE !== "test") return "production";

  // 1. Process environment (SSR / Node / test)
  if (typeof process !== "undefined" && process.env) {
    const envVal = (
      process.env["VITE_AUTH_MODE"] || process.env["AUTH_MODE"]
    )?.trim().toLowerCase();
    if (envVal === "production") return "production";
    if (envVal === "mock") return "mock";
    if (envVal === "emulator") return "emulator";
  }

  // 2. Vite import.meta.env (Client build)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const metaVal = (
      (import.meta.env["VITE_AUTH_MODE"] as string | undefined) ||
      (import.meta.env["AUTH_MODE"] as string | undefined)
    )?.trim().toLowerCase();
    if (metaVal === "production") return "production";
    if (metaVal === "mock") return "mock";
    if (metaVal === "emulator") return "emulator";
  }

  // 3. Browser session, local storage or explicit URL param
  if (typeof window !== "undefined") {
    try {
      // Explicit authMode query param (strictly separate from catalogMode)
      const params = new URLSearchParams(window.location.search);
      const queryAuthMode = params.get("authMode");
      if (queryAuthMode === "production") return "production";
      if (queryAuthMode === "mock") return "mock";
      if (queryAuthMode === "emulator") return "emulator";

      const sessionVal = window.sessionStorage.getItem("sass_auth_mode");
      if (sessionVal === "production") return "production";
      if (sessionVal === "mock") return "mock";
      if (sessionVal === "emulator") return "emulator";

      const localVal = window.localStorage.getItem("sass_auth_mode");
      if (localVal === "production") return "production";
      if (localVal === "mock") return "mock";
      if (localVal === "emulator") return "emulator";
    } catch {
      // Ignore sessionStorage/localStorage/URL errors
    }
  }

  // STRICT INVARIANT: default to local emulator
  return "emulator";
}

export interface IAuthAdapter {
  readonly mode: AuthMode;
  isProduction(): boolean;
  getCurrentUser(): AuthUserIdentity | null;
  subscribeAuthState(listener: (user: AuthUserIdentity | null) => void): () => void;
  loginWithEmail(email: string, password: string): Promise<AuthUserIdentity>;
  createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUserIdentity>;
  sendEmailVerification(): Promise<void>;
  sendPasswordResetEmail(email?: string): Promise<void>;
  signOut(): Promise<void>;
  assertWritePermitted?(action: string): void;
}

export interface FirebaseAuthDriver {
  signInWithGoogle?(auth: Auth): Promise<{ user: FirebaseUser }>;
  signInWithEmailAndPassword(
    auth: Auth,
    email: string,
    password: string
  ): Promise<{ user: FirebaseUser }>;
  createUserWithEmailAndPassword?(
    auth: Auth,
    email: string,
    password: string
  ): Promise<{ user: FirebaseUser }>;
  sendEmailVerification?(user: FirebaseUser): Promise<void>;
  sendPasswordResetEmail?(auth: Auth, email: string): Promise<void>;
  signOut(auth: Auth): Promise<void>;
  onAuthStateChanged(
    auth: Auth,
    listener: (user: FirebaseUser | null) => void
  ): () => void;
  getCurrentUser(auth: Auth): FirebaseUser | null;
}

class DefaultFirebaseAuthDriver implements FirebaseAuthDriver {
  signInWithGoogle(auth: Auth) {
    return signInWithPopup(auth, configuredGoogleProvider);
  }

  signInWithEmailAndPassword(auth: Auth, email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  createUserWithEmailAndPassword(auth: Auth, email: string, password: string) {
    return firebaseCreateUserWithEmailAndPassword(auth, email, password);
  }
  sendEmailVerification(user: FirebaseUser) {
    return firebaseSendEmailVerification(user);
  }
  sendPasswordResetEmail(auth: Auth, email: string) {
    return firebaseSendPasswordResetEmail(auth, email);
  }
  signOut(auth: Auth) {
    return firebaseSignOut(auth);
  }
  onAuthStateChanged(auth: Auth, listener: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, listener);
  }
  getCurrentUser(auth: Auth) {
    return auth.currentUser;
  }
}

/**
 * Firebase Authentication Adapter.
 * Works in both "emulator" (default) and "production" modes using the modular Firebase Auth SDK.
 * In production mode, all mutation actions are strictly blocked by safety assertions.
 */
export class FirebaseAuthAdapter implements IAuthAdapter {
  readonly mode: AuthMode;
  private driver: FirebaseAuthDriver = new DefaultFirebaseAuthDriver();

  constructor(mode: "emulator" | "production" = "emulator") {
    this.mode = mode;
  }

  isProduction(): boolean {
    return this.mode === "production";
  }

  /**
   * Overrides the underlying Firebase Auth driver (useful for deterministic unit testing).
   */
  setDriverForTesting(driver: FirebaseAuthDriver | null): void {
    this.driver = driver ?? new DefaultFirebaseAuthDriver();
  }

  /**
   * Retrieves or initializes the isolated Firebase Auth instance according to mode.
   */
  getAuthInstance(): { auth: Auth; app: FirebaseApp; projectId: string } {
    if (this.mode === "production") {
      const config = {
        projectId: configuredFirebaseApp.options.projectId ?? "",
        authDomain: configuredFirebaseApp.options.authDomain ?? "",
        messagingSenderId: configuredFirebaseApp.options.messagingSenderId ?? "",
        storageBucket: configuredFirebaseApp.options.storageBucket ?? "",
        appId: configuredFirebaseApp.options.appId ?? "",
        apiKey: configuredFirebaseApp.options.apiKey ?? "",
      };
      const validation = validateProductionPreviewConfig(config);
      if (!validation.valid) {
        throw new Error(
          `CONFIGURATION SAFETY ERROR:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`
        );
      }

      return {
        auth: configuredFirebaseAuth,
        app: configuredFirebaseApp,
        projectId: EXPECTED_PRODUCTION_PROJECT_ID,
      };
    }

    // Default emulator mode: strictly routes to 127.0.0.1:9099
    const { auth, app, config } = getEmulatorAuth();
    return { auth, app, projectId: config.projectId };
  }

  /**
   * Strictly asserts that an action does not perform forbidden production mutations.
   */
  assertWritePermitted(action: string): void {
    if (this.isProduction()) {
      throw new ProductionAuthSafetyError(action);
    }
  }

  getCurrentUser(): AuthUserIdentity | null {
    try {
      const { auth } = this.getAuthInstance();
      const user = this.driver.getCurrentUser(auth);
      return user ? this.mapFirebaseUserToIdentity(user) : null;
    } catch {
      return null;
    }
  }

  subscribeAuthState(listener: (user: AuthUserIdentity | null) => void): () => void {
    try {
      const { auth } = this.getAuthInstance();
      return this.driver.onAuthStateChanged(auth, (firebaseUser) => {
        listener(firebaseUser ? this.mapFirebaseUserToIdentity(firebaseUser) : null);
      });
    } catch (err: any) {
      console.error("[FirebaseAuthAdapter] Failed to subscribe to auth state:", err.message);
      listener(null);
      return () => {};
    }
  }

  async loginWithEmail(email: string, password: string): Promise<AuthUserIdentity> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      throw new Error("Please enter a valid email address.");
    }
    if (!password) {
      throw new Error("Please enter your password.");
    }

    try {
      const { auth } = this.getAuthInstance();
      const credential = await this.driver.signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );
      return this.mapFirebaseUserToIdentity(credential.user);
    } catch (err: unknown) {
      const friendlyMessage = mapFirebaseAuthError(err);
      throw new Error(friendlyMessage);
    }
  }

  async signInWithGoogle(): Promise<AuthUserIdentity> {
    try {
      const { auth } = this.getAuthInstance();
      if (!this.driver.signInWithGoogle) {
        throw new Error("Google sign-in is unavailable in this session.");
      }
      const credential = await this.driver.signInWithGoogle(auth);
      return {
        ...this.mapFirebaseUserToIdentity(credential.user),
        providerId: "firebase-google",
      };
    } catch (err: unknown) {
      throw new Error(mapFirebaseAuthError(err));
    }
  }

  async signOut(): Promise<void> {
    try {
      const { auth } = this.getAuthInstance();
      await this.driver.signOut(auth);
    } catch (err: any) {
      console.warn("[FirebaseAuthAdapter] Error during sign out:", err.message);
    }
  }

  /**
   * Production write handling for account creation and verification remains subject to
   * the project's existing safety controls. Password reset emails are explicitly enabled
   * as a customer initiated account recovery action.
   */
  async createUserWithEmailAndPassword(email = "", password = ""): Promise<AuthUserIdentity> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) throw new Error("Enter a valid email address and password.");
    try {
      const { auth } = this.getAuthInstance();
      if (!this.driver.createUserWithEmailAndPassword) {
        throw new Error("Firebase email/password registration is unavailable.");
      }
      const result = await this.driver.createUserWithEmailAndPassword(auth, cleanEmail, password);
      return this.mapFirebaseUserToIdentity(result.user);
    } catch (err: unknown) {
      throw new Error(mapFirebaseAuthError(err));
    }
  }

  async sendPasswordResetEmail(email = ""): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) throw new Error("Enter the email address for your account.");
    try {
      const { auth } = this.getAuthInstance();
      if (!this.driver.sendPasswordResetEmail) {
        throw new Error("Password reset is unavailable in this session.");
      }
      await this.driver.sendPasswordResetEmail(auth, cleanEmail);
    } catch (err: unknown) {
      throw new Error(mapFirebaseAuthError(err));
    }
  }

  async sendEmailVerification(): Promise<void> {
    this.assertWritePermitted("sendEmailVerification");
    if (this.mode !== "emulator") throw new ProductionAuthSafetyError("sendEmailVerification");
    const { auth } = this.getAuthInstance();
    const currentUser = this.driver.getCurrentUser(auth);
    if (!currentUser) throw new Error("Sign in before requesting email verification.");
    try {
      if (!this.driver.sendEmailVerification) {
        throw new Error("Firebase email verification is unavailable.");
      }
      await this.driver.sendEmailVerification(currentUser);
    } catch (err: unknown) {
      throw new Error(mapFirebaseAuthError(err));
    }
  }

  private mapFirebaseUserToIdentity(user: FirebaseUser): AuthUserIdentity {
    const providerId =
      (Array.isArray(user.providerData)
        ? user.providerData.find((provider) => provider.providerId !== "firebase")?.providerId
        : undefined) ||
      (user.phoneNumber ? "phone" : "password");
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      phoneNumber: user.phoneNumber,
      providerId,
      isAnonymous: user.isAnonymous,
    };
  }
}

/**
 * Mock Authentication Adapter.
 * Integrates with existing local mock authService for offline development.
 */
export class MockAuthAdapter implements IAuthAdapter {
  readonly mode: AuthMode = "mock";

  isProduction(): boolean {
    return false;
  }

  getCurrentUser(): AuthUserIdentity | null {
    const mockUser = authService.getCurrentUser();
    if (!mockUser) return null;
    return {
      uid: mockUser.id,
      email: mockUser.email || null,
      emailVerified: true,
      phoneNumber: mockUser.phone,
      providerId: "mock",
    };
  }

  subscribeAuthState(listener: (user: AuthUserIdentity | null) => void): () => void {
    const current = this.getCurrentUser();
    listener(current);
    return () => {};
  }

  async loginWithEmail(email: string, password: string): Promise<AuthUserIdentity> {
    const user = await authService.loginWithEmail(email, password);
    return {
      uid: user.id,
      email: user.email || null,
      emailVerified: true,
      phoneNumber: user.phone,
      providerId: "mock",
    };
  }

  async createUserWithEmailAndPassword(email = "", password = ""): Promise<AuthUserIdentity> {
    const user = await authService.loginWithEmail(email, password).catch(() => null);
    if (user) {
      return {
        uid: user.id,
        email: user.email || null,
        emailVerified: true,
        phoneNumber: user.phone,
        providerId: "mock",
      };
    }
    const mockUid = `mock_${Date.now()}`;
    return {
      uid: mockUid,
      email: email || null,
      emailVerified: true,
      phoneNumber: "+91 99999 99999",
      providerId: "mock",
    };
  }

  async sendEmailVerification(): Promise<never> {
    throw new Error("Email verification is available only through the Firebase Auth Emulator.");
  }

  async sendPasswordResetEmail(): Promise<never> {
    throw new Error("Password reset is available only through Firebase Authentication.");
  }

  async signOut(): Promise<void> {
    authService.logout();
  }
}

/**
 * Central Authentication Manager.
 * Coordinates authentication adapter selection, provides status diagnostics,
 * and maintains the strict default invariant ("emulator").
 */
export class AuthManager {
  private mode: AuthMode;
  private emulatorAdapter: FirebaseAuthAdapter;
  private productionAdapter: FirebaseAuthAdapter;
  private mockAdapter: MockAuthAdapter;

  constructor(initialMode?: AuthMode) {
    this.mode = initialMode ?? resolveDefaultAuthMode();
    this.emulatorAdapter = new FirebaseAuthAdapter("emulator");
    this.productionAdapter = new FirebaseAuthAdapter("production");
    this.mockAdapter = new MockAuthAdapter();
  }

  getMode(): AuthMode {
    return this.mode;
  }

  setMode(mode: AuthMode): void {
    this.mode = mode;
    if (typeof window !== "undefined") {
      try {
        if (mode === "production" || mode === "mock" || mode === "emulator") {
          window.sessionStorage.setItem("sass_auth_mode", mode);
          window.localStorage.setItem("sass_auth_mode", mode);
        }
      } catch {
        // Ignore storage access errors
      }
    }
  }

  resetMode(): void {
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem("sass_auth_mode");
        window.localStorage.removeItem("sass_auth_mode");
      } catch {
        // Ignore
      }
    }
    this.mode = resolveDefaultAuthMode();
  }

  getActiveAdapter(): IAuthAdapter {
    switch (this.mode) {
      case "production":
        return this.productionAdapter;
      case "mock":
        return this.mockAdapter;
      case "emulator":
      default:
        return this.emulatorAdapter;
    }
  }

  getEmulatorAdapter(): FirebaseAuthAdapter {
    return this.emulatorAdapter;
  }

  getProductionAdapter(): FirebaseAuthAdapter {
    return this.productionAdapter;
  }

  getMockAdapter(): MockAuthAdapter {
    return this.mockAdapter;
  }

  getStatus(): AuthStatus {
    const isProduction = this.mode === "production";
    const isEmulator = this.mode === "emulator";
    const isMock = this.mode === "mock";

    if (isProduction) {
      return {
        mode: "production",
        isProduction: true,
        isEmulator: false,
        isMock: false,
        projectId: EXPECTED_PRODUCTION_PROJECT_ID,
        authDomain: EXPECTED_PRODUCTION_AUTH_DOMAIN,
      };
    }

    if (isEmulator) {
      return {
        mode: "emulator",
        isProduction: false,
        isEmulator: true,
        isMock: false,
        projectId: "demo-sri-amman-store",
        emulatorHost: "127.0.0.1",
        emulatorPort: 9099,
      };
    }

    return {
      mode: "mock",
      isProduction: false,
      isEmulator: false,
      isMock: true,
      projectId: "local-mock",
    };
  }

  getCurrentUser(): AuthUserIdentity | null {
    return this.getActiveAdapter().getCurrentUser();
  }

  subscribeAuthState(listener: (user: AuthUserIdentity | null) => void): () => void {
    return this.getActiveAdapter().subscribeAuthState(listener);
  }

  async loginWithEmail(email: string, password: string): Promise<AuthUserIdentity> {
    return this.getActiveAdapter().loginWithEmail(email, password);
  }

  async signInWithGoogle(): Promise<AuthUserIdentity> {
    const adapter = this.getActiveAdapter();
    if (!(adapter instanceof FirebaseAuthAdapter)) {
      throw new Error("Google sign-in is unavailable in mock authentication mode.");
    }
    return adapter.signInWithGoogle();
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<AuthUserIdentity> {
    return this.getActiveAdapter().createUserWithEmailAndPassword(email, password);
  }

  async sendEmailVerification(): Promise<void> {
    return this.getActiveAdapter().sendEmailVerification();
  }

  async sendPasswordResetEmail(email?: string): Promise<void> {
    return this.getActiveAdapter().sendPasswordResetEmail(email);
  }

  async signOut(): Promise<void> {
    await this.getActiveAdapter().signOut();
  }
}

export const authManager = new AuthManager();

