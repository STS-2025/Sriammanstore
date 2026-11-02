import React, { useState } from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act, cleanup, fireEvent } from "@testing-library/react";
import {
  authManager,
  resolveDefaultAuthMode,
  FirebaseAuthAdapter,
  PRODUCTION_AUTH_APP_NAME,
  type AuthUserIdentity,
  type FirebaseAuthDriver,
} from "../services/authAdapter";
import { customerIdentityService } from "../services/customerIdentityService";
import { apiClient } from "../services/apiClient";
import { authService, AUTH_STORAGE_KEY } from "../services/authService";
import { emailLinkAuthService } from "../services/emailLinkAuthService";
import {
  AuthProvider,
  useAuth,
  type AuthContextType,
} from "../context/AuthContext";
import { AccountPage } from "../routes/account";
import { OrdersPage } from "../routes/orders";
import { AddressesPage } from "../routes/addresses";
import { CheckoutPage } from "../routes/checkout";
import { RewardsPage } from "../routes/rewards";
import { WishlistPage } from "../routes/wishlist";
import { NotificationsPage } from "../routes/notifications";
import { ReferPage } from "../routes/refer";
import type { User } from "../types";
import type { Auth, User as FirebaseUser } from "firebase/auth";

// Mock tanstack router navigation and hooks
const mockNavigate = vi.fn();
let mockSearchParams: Record<string, any> = {};

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className, ...props }: any) => (
    <a href={typeof to === "string" ? to : "/"} className={className} {...props}>
      {children}
    </a>
  ),
  useSearch: () => mockSearchParams,
  useNavigate: () => mockNavigate,
  createFileRoute: () => (config: any) => config,
}));

// Mock layout subcomponents to isolate route testing
vi.mock("../components/layout/StoreHeader", () => ({
  StoreHeader: () => <header data-testid="mock-store-header" />,
}));
vi.mock("../components/layout/StoreFooter", () => ({
  StoreFooter: () => <footer data-testid="mock-store-footer" />,
}));
vi.mock("../components/layout/BottomNav", () => ({
  BottomNav: () => <nav data-testid="mock-bottom-nav" />,
}));
vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    setLanguage: vi.fn(),
    t: (k: string) => k,
  }),
}));
vi.mock("../context/CartContext", () => ({
  useCart: () => ({
    items: [],
    cartCount: 0,
    cartSubtotal: 0,
    cartTotalSavings: 0,
    appliedCoupon: null,
    couponDiscount: 0,
    redeemCoins: false,
    coinsRedeemed: 0,
    coinDiscount: 0,
    deliverySpeed: "Standard",
    deliveryFee: 0,
    finalTotal: 0,
    selectedAddressId: "",
    selectedSlotId: "",
    paymentMethod: "cod",
    selectedUpiId: "",
    setDeliverySpeed: vi.fn(),
    setSelectedAddressId: vi.fn(),
    setSelectedSlotId: vi.fn(),
    setPaymentMethod: vi.fn(),
    setSelectedUpiId: vi.fn(),
    clearCart: vi.fn(),
    resetDiscounts: vi.fn(),
    refreshCart: vi.fn(),
    addToCart: vi.fn(),
  }),
}));
vi.mock("../context/NotificationContext", () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    refreshNotifications: vi.fn(),
  }),
}));
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

function AuthStateHarness({ onRender }: { onRender: (ctx: AuthContextType) => void }) {
  const ctx = useAuth();
  onRender(ctx);
  return (
    <div data-testid="auth-state-harness">
      <span data-testid="is-loading">{String(ctx.isLoading)}</span>
      <span data-testid="is-authenticated">{String(ctx.isAuthenticated)}</span>
      <span data-testid="session-type">{ctx.sessionType ?? "none"}</span>
      <span data-testid="user-id">{ctx.user?.id ?? "none"}</span>
      <span data-testid="user-name">{ctx.user?.name ?? "none"}</span>
      <span data-testid="firebase-uid">{ctx.firebaseUser?.uid ?? "none"}</span>
      <span data-testid="resolution-status">{ctx.identityResolution?.status ?? "none"}</span>
      <span data-testid="notice-code">{ctx.identityNotice?.code ?? "none"}</span>
      <span data-testid="notice-retryable">{String(ctx.identityNotice?.isRetryable ?? false)}</span>
      <button data-testid="logout-btn" onClick={() => void ctx.logout()}>
        Logout
      </button>
    </div>
  );
}

describe("Live Production Firebase Session Persistence & Refresh Restoration", () => {
  const originalEnv = { ...process.env };
  const prodUid = "live_prod_uid_oncus_10";
  const oncusCustomer: User = {
    id: "ONCUS0000010",
    userId: "ONCUS0000010",
    legacySassId: "SASS0000010",
    name: "Muthusamy Gounder",
    phone: "+91 94433 12345",
    email: "muthusamy@sriammanstore.com",
    coins: 450,
    isVIP: true,
    referralCode: "ONCUS0000010",
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = {};
    authManager.resetMode();
    authService.logout();
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    cleanup();
    process.env = { ...originalEnv };
    authManager.resetMode();
    authService.logout();
    customerIdentityService.setProductionReaderForTesting(null);
    authManager.getProductionAdapter().setDriverForTesting(null);
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      window.localStorage.clear();
    }
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // ==========================================================================
  // SUITE 1: Auth Persistence Configuration & Singleton Invariants
  // ==========================================================================
  describe("1. Firebase Auth Persistence & Singleton Invariants", () => {
    it("caches the isolated production Firebase Auth instance without duplicate initializations", () => {
      const adapter = authManager.getProductionAdapter();
      const firstInstance = adapter.getAuthInstance();
      const secondInstance = adapter.getAuthInstance();

      expect(firstInstance.app.name).toBe(PRODUCTION_AUTH_APP_NAME);
      expect(firstInstance.auth).toBe(secondInstance.auth);
      expect(firstInstance.app).toBe(secondInstance.app);
    });

    it("preserves explicit authMode selection across sessionStorage and localStorage", () => {
      authManager.setMode("production");
      expect(authManager.getMode()).toBe("production");
      expect(window.sessionStorage.getItem("sass_auth_mode")).toBe("production");
      expect(window.localStorage.getItem("sass_auth_mode")).toBe("production");

      // Verify that resolveDefaultAuthMode() reads and preserves the selection
      expect(resolveDefaultAuthMode()).toBe("production");

      // Reset mode cleanly clears the storage
      authManager.resetMode();
      expect(authManager.getMode()).toBe("emulator");
      expect(window.sessionStorage.getItem("sass_auth_mode")).toBeNull();
      expect(window.localStorage.getItem("sass_auth_mode")).toBeNull();
    });
  });

  // ==========================================================================
  // SUITE 2: Production Session Restoration on Page Refresh
  // ==========================================================================
  describe("2. Live Production Session Restoration on Page Refresh", () => {
    it("restores the production user session, stays in loading state until resolved, and resolves ONCUS identity", async () => {
      // 1. Simulate environment after refresh: auth mode is set to 'production'
      window.localStorage.setItem("sass_auth_mode", "production");
      window.sessionStorage.setItem("sass_auth_mode", "production");
      authManager.setMode("production");

      // 2. Mock production document reader for usersByUid and onlineCustomers
      const readerSpy = vi.fn(async (col: "usersByUid" | "onlineCustomers" | "users", docId: string) => {
        if (col === "usersByUid" && docId === prodUid) {
          return {
            uid: prodUid,
            userDocId: "ONCUS0000010",
            collection: "onlineCustomers",
            legacySassId: "SASS0000010",
          };
        }
        if (col === "onlineCustomers" && docId === "ONCUS0000010") {
          return {
            userId: "ONCUS0000010",
            fullName: "Muthusamy Gounder",
            phone: "+91 94433 12345",
            email: "muthusamy@sriammanstore.com",
            coins: 450,
            isVIP: true,
            legacySassId: "SASS0000010",
          };
        }
        return null;
      });
      customerIdentityService.setProductionReaderForTesting(readerSpy);

      // 3. Mock FirebaseAuthDriver that simulates deferred auth restoration from local persistence
      let triggerAuthState: ((user: FirebaseUser | null) => void) | null = null;
      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn().mockResolvedValue(undefined),
        onAuthStateChanged: (_auth, listener) => {
          triggerAuthState = listener;
          return () => {
            triggerAuthState = null;
          };
        },
        getCurrentUser: () => null,
      };
      authManager.getProductionAdapter().setDriverForTesting(mockDriver);

      let latestCtx: AuthContextType | null = null;
      render(
        <AuthProvider>
          <AuthStateHarness onRender={(ctx) => { latestCtx = ctx; }} />
        </AuthProvider>
      );

      // 4. Verify initial state: UI is in loading state, not authenticated yet
      expect(screen.getByTestId("is-loading").textContent).toBe("true");
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
      expect(screen.getByTestId("session-type").textContent).toBe("none");
      expect(mockNavigate).not.toHaveBeenCalled();

      // 5. Firebase Auth emits restored user from persistence
      const mockRestoredFirebaseUser = {
        uid: prodUid,
        email: "muthusamy@sriammanstore.com",
        emailVerified: true,
        phoneNumber: "+91 94433 12345",
        isAnonymous: false,
      } as unknown as FirebaseUser;

      await act(async () => {
        triggerAuthState!(mockRestoredFirebaseUser);
      });

      // 6. Verify session restored to full authenticated state
      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      expect(screen.getByTestId("session-type").textContent).toBe("firebase");
      expect(screen.getByTestId("user-id").textContent).toBe("ONCUS0000010");
      expect(screen.getByTestId("user-name").textContent).toBe("Muthusamy Gounder");
      expect(screen.getByTestId("firebase-uid").textContent).toBe(prodUid);
      expect(screen.getByTestId("resolution-status").textContent).toBe("resolved");

      // Verify that apiClient customer subcollections are enabled for ONCUS
      expect(apiClient.isLegacyCustomerSubcollectionsEnabled()).toBe(true);
      expect(mockDriver.signOut).not.toHaveBeenCalled();
    });

    it("never calls signOut() when customer profile resolution encounters a database or network error", async () => {
      window.localStorage.setItem("sass_auth_mode", "production");
      authManager.setMode("production");

      // Mock reader throwing a simulated connectivity / Firestore error
      customerIdentityService.setProductionReaderForTesting(async () => {
        const error = new Error("Failed to fetch: Connection timeout to Firestore");
        (error as any).code = "unavailable";
        throw error;
      });

      let triggerAuthState: ((user: FirebaseUser | null) => void) | null = null;
      const signOutSpy = vi.fn().mockResolvedValue(undefined);
      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn(),
        signOut: signOutSpy,
        onAuthStateChanged: (_auth, listener) => {
          triggerAuthState = listener;
          return () => {};
        },
        getCurrentUser: () => null,
      };
      authManager.getProductionAdapter().setDriverForTesting(mockDriver);

      render(
        <AuthProvider>
          <AuthStateHarness onRender={() => {}} />
        </AuthProvider>
      );

      const mockRestoredFirebaseUser = {
        uid: prodUid,
        email: "muthusamy@sriammanstore.com",
        emailVerified: true,
      } as unknown as FirebaseUser;

      await act(async () => {
        triggerAuthState!(mockRestoredFirebaseUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // INVARIANT: Firebase Auth signOut() MUST NOT be called!
      expect(signOutSpy).not.toHaveBeenCalled();

      // Firebase Auth user identity MUST be preserved
      expect(screen.getByTestId("firebase-uid").textContent).toBe(prodUid);
      expect(screen.getByTestId("resolution-status").textContent).toBe("database_error");
      expect(screen.getByTestId("notice-retryable").textContent).toBe("true");
    });

    it("handles revoked/null Firebase sessions cleanly without infinite loading", async () => {
      window.localStorage.setItem("sass_auth_mode", "production");
      authManager.setMode("production");

      let triggerAuthState: ((user: FirebaseUser | null) => void) | null = null;
      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChanged: (_auth, listener) => {
          triggerAuthState = listener;
          return () => {};
        },
        getCurrentUser: () => null,
      };
      authManager.getProductionAdapter().setDriverForTesting(mockDriver);

      render(
        <AuthProvider>
          <AuthStateHarness onRender={() => {}} />
        </AuthProvider>
      );

      expect(screen.getByTestId("is-loading").textContent).toBe("true");

      // Firebase Auth emits null (revoked or logged out session)
      await act(async () => {
        triggerAuthState!(null);
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
      expect(screen.getByTestId("session-type").textContent).toBe("none");
      expect(screen.getByTestId("user-id").textContent).toBe("none");
    });
  });

  // ==========================================================================
  // SUITE 3: Protected Customer Route Refreshes Show Restoration State
  // ==========================================================================
  describe("3. Protected Customer Route Refreshes Show Restoration State Without Flashing Signed-Out", () => {
    it("renders restoration view on /account while session is restoring and avoids premature redirect", async () => {
      window.localStorage.setItem("sass_auth_mode", "production");
      authManager.setMode("production");

      let triggerAuthState: ((user: FirebaseUser | null) => void) | null = null;
      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChanged: (_auth, listener) => {
          triggerAuthState = listener;
          return () => {};
        },
        getCurrentUser: () => null,
      };
      authManager.getProductionAdapter().setDriverForTesting(mockDriver);

      render(
        <AuthProvider>
          <AccountPage />
        </AuthProvider>
      );

      // During restoration: Loading view must be visible, "Please Sign In" MUST NOT be rendered
      expect(screen.getByText("Loading your customer account...")).toBeDefined();
      expect(screen.queryByText("Please Sign In to View Your Account")).toBeNull();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("renders restoration view on /orders while session is restoring", async () => {
      window.localStorage.setItem("sass_auth_mode", "production");
      authManager.setMode("production");

      let triggerAuthState: ((user: FirebaseUser | null) => void) | null = null;
      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChanged: (_auth, listener) => {
          triggerAuthState = listener;
          return () => {};
        },
        getCurrentUser: () => null,
      };
      authManager.getProductionAdapter().setDriverForTesting(mockDriver);

      render(
        <AuthProvider>
          <OrdersPage />
        </AuthProvider>
      );

      // During restoration: Restoration view is shown
      expect(screen.getByText("Restoring your session...")).toBeDefined();
      expect(screen.queryByText("Please Sign In to View Your Orders")).toBeNull();
    });

    it("renders restoration view on /checkout while session is restoring", async () => {
      window.localStorage.setItem("sass_auth_mode", "production");
      authManager.setMode("production");

      let triggerAuthState: ((user: FirebaseUser | null) => void) | null = null;
      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChanged: (_auth, listener) => {
          triggerAuthState = listener;
          return () => {};
        },
        getCurrentUser: () => null,
      };
      authManager.getProductionAdapter().setDriverForTesting(mockDriver);

      render(
        <AuthProvider>
          <CheckoutPage />
        </AuthProvider>
      );

      expect(screen.getByText("Preparing checkout...")).toBeDefined();
      expect(screen.queryByText("Please Sign In to Complete Checkout")).toBeNull();
    });

    it("renders restoration view on /rewards while session is restoring", async () => {
      window.localStorage.setItem("sass_auth_mode", "production");
      authManager.setMode("production");

      let triggerAuthState: ((user: FirebaseUser | null) => void) | null = null;
      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChanged: (_auth, listener) => {
          triggerAuthState = listener;
          return () => {};
        },
        getCurrentUser: () => null,
      };
      authManager.getProductionAdapter().setDriverForTesting(mockDriver);

      render(
        <AuthProvider>
          <RewardsPage />
        </AuthProvider>
      );

      expect(screen.getByText("Loading Amman rewards & coins...")).toBeDefined();
      expect(screen.queryByText("Please Sign In to Access Amman Rewards & VIP Hub")).toBeNull();
    });
  });

  // ==========================================================================
  // SUITE 4: Mock Authentication Isolation & Logout Verification
  // ==========================================================================
  describe("4. Mock Authentication Isolation & Explicit Logout", () => {
    it("ensures leftover mock storage credentials do not contaminate a production Firebase session", async () => {
      // Seed leftover mock credentials into localStorage
      const mockUser: User = {
        id: "SASS0000104",
        userId: "SASS0000104",
        name: "Mock Impostor",
        phone: "+91 98400 12345",
        email: "mock@example.com",
        coins: 100,
        isVIP: false,
        referralCode: "SASS0000104",
        createdAt: new Date().toISOString(),
      };
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));

      // Production mode is active
      window.localStorage.setItem("sass_auth_mode", "production");
      authManager.setMode("production");

      const readerSpy = vi.fn(async (col: string, docId: string) => {
        if (col === "usersByUid") return { uid: prodUid, userDocId: "ONCUS0000010" };
        if (col === "onlineCustomers") return { userId: "ONCUS0000010", fullName: "Muthusamy Gounder" };
        return null;
      });
      customerIdentityService.setProductionReaderForTesting(readerSpy);

      let triggerAuthState: ((user: FirebaseUser | null) => void) | null = null;
      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChanged: (_auth, listener) => {
          triggerAuthState = listener;
          return () => {};
        },
        getCurrentUser: () => null,
      };
      authManager.getProductionAdapter().setDriverForTesting(mockDriver);

      render(
        <AuthProvider>
          <AuthStateHarness onRender={() => {}} />
        </AuthProvider>
      );

      // Emit production Firebase user
      await act(async () => {
        triggerAuthState!({
          uid: prodUid,
          email: "muthusamy@sriammanstore.com",
          emailVerified: true,
        } as unknown as FirebaseUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-loading").textContent).toBe("false");
      });

      // The authenticated user MUST be the resolved ONCUS customer, NOT the mock impostor
      expect(screen.getByTestId("user-id").textContent).toBe("ONCUS0000010");
      expect(screen.getByTestId("user-name").textContent).toBe("Muthusamy Gounder");
      expect(screen.getByTestId("session-type").textContent).toBe("firebase");

      // Mock session storage key MUST have been purged
      expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    });

    it("explicit logout clears session, signs out of production auth, and resets subcollections flag", async () => {
      window.localStorage.setItem("sass_auth_mode", "production");
      authManager.setMode("production");

      const signOutSpy = vi.fn().mockResolvedValue(undefined);
      let triggerAuthState: ((user: FirebaseUser | null) => void) | null = null;
      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn(),
        signOut: signOutSpy,
        onAuthStateChanged: (_auth, listener) => {
          triggerAuthState = listener;
          return () => {};
        },
        getCurrentUser: () => null,
      };
      authManager.getProductionAdapter().setDriverForTesting(mockDriver);

      customerIdentityService.setProductionReaderForTesting(async (col: "usersByUid" | "onlineCustomers" | "users", _docId: string) => {
        if (col === "usersByUid") return { uid: prodUid, userDocId: "ONCUS0000010" };
        if (col === "onlineCustomers") return { userId: "ONCUS0000010", fullName: "Muthusamy Gounder" };
        return null;
      });

      render(
        <AuthProvider>
          <AuthStateHarness onRender={() => {}} />
        </AuthProvider>
      );

      await act(async () => {
        triggerAuthState!({ uid: prodUid, email: "muthusamy@sriammanstore.com", emailVerified: true } as unknown as FirebaseUser);
      });

      await waitFor(() => {
        expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      });

      // Explicitly trigger logout
      const logoutBtn = screen.getByTestId("logout-btn");
      await act(async () => {
        fireEvent.click(logoutBtn);
      });

      expect(signOutSpy).toHaveBeenCalled();
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
      expect(screen.getByTestId("session-type").textContent).toBe("none");
      expect(screen.getByTestId("user-id").textContent).toBe("none");
      expect(apiClient.isLegacyCustomerSubcollectionsEnabled()).toBe(false);
    });
  });
});
