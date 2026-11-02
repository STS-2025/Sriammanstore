import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  authManager,
  resolveDefaultAuthMode,
  FirebaseAuthAdapter,
  MockAuthAdapter,
  ProductionAuthSafetyError,
  mapFirebaseAuthError,
  type AuthMode,
  type AuthUserIdentity,
  type FirebaseAuthDriver,
  PRODUCTION_AUTH_APP_NAME,
} from "../services/authAdapter";
import {
  customerIdentityService,
  CustomerIdentityResolutionError,
} from "../services/customerIdentityService";
import {
  FirestoreAdapter,
  InMemoryFirestoreDriver,
} from "../services/firestoreAdapter";
import { authService, AUTH_STORAGE_KEY, TEST_CREDENTIALS } from "../services/authService";
import {
  EXPECTED_PRODUCTION_PROJECT_ID,
  EXPECTED_PRODUCTION_AUTH_DOMAIN,
} from "../services/productionPreviewService";
import type { Auth, User as FirebaseUser } from "firebase/auth";

describe("Phase 2: Authentication Architecture, Provider Selection & Identity Foundations", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    authManager.resetMode();
    authService.logout();
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    authManager.resetMode();
    authService.logout();
    if (typeof window !== "undefined") {
      window.sessionStorage.clear();
      window.localStorage.clear();
    }
  });

  // ==========================================================================
  // SUITE 1: Auth Mode Resolution & Strict Default Invariant
  // ==========================================================================
  describe("1. Auth Mode Resolution & Strict Local Default", () => {
    it("strictly defaults to 'emulator' mode when no explicit environment override is present", () => {
      delete process.env["VITE_AUTH_MODE"];
      delete process.env["AUTH_MODE"];
      expect(resolveDefaultAuthMode()).toBe("emulator");
      expect(authManager.getMode()).toBe("emulator");

      const status = authManager.getStatus();
      expect(status.mode).toBe("emulator");
      expect(status.isEmulator).toBe(true);
      expect(status.isProduction).toBe(false);
      expect(status.projectId).toBe("demo-sri-amman-store");
      expect(status.emulatorHost).toBe("127.0.0.1");
      expect(status.emulatorPort).toBe(9099);
    });

    it("ensures production catalogue parameters (e.g. ?catalogMode=production-readonly) NEVER switch auth mode", () => {
      // Simulate production catalog mode being active
      process.env["VITE_CATALOG_MODE"] = "production-readonly";
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("sass_catalog_mode", "production-readonly");
      }

      // Auth mode MUST remain strictly 'emulator'
      expect(resolveDefaultAuthMode()).toBe("emulator");
      expect(authManager.getMode()).toBe("emulator");
      expect(authManager.getStatus().isProduction).toBe(false);
    });

    it("permits explicit auth mode switching between emulator, production, and mock", () => {
      // 1. Switch to production
      authManager.setMode("production");
      expect(authManager.getMode()).toBe("production");
      const prodStatus = authManager.getStatus();
      expect(prodStatus.isProduction).toBe(true);
      expect(prodStatus.projectId).toBe(EXPECTED_PRODUCTION_PROJECT_ID);
      expect(prodStatus.authDomain).toBe(EXPECTED_PRODUCTION_AUTH_DOMAIN);

      // 2. Switch to mock
      authManager.setMode("mock");
      expect(authManager.getMode()).toBe("mock");
      const mockStatus = authManager.getStatus();
      expect(mockStatus.isMock).toBe(true);
      expect(mockStatus.isProduction).toBe(false);

      // 3. Reset back to default invariant
      authManager.resetMode();
      expect(authManager.getMode()).toBe("emulator");
      expect(authManager.getStatus().isEmulator).toBe(true);
    });
  });

  // ==========================================================================
  // SUITE 2: Firebase Auth Adapter & Emulator Routing
  // ==========================================================================
  describe("2. Firebase Auth Adapter & Emulator vs. Production Routing", () => {
    it("initializes the emulator adapter with strict local routing (demo-sri-amman-store, 127.0.0.1:9099)", () => {
      const emulatorAdapter = new FirebaseAuthAdapter("emulator");
      expect(emulatorAdapter.isProduction()).toBe(false);

      const { auth, app, projectId } = emulatorAdapter.getAuthInstance();
      expect(projectId).toBe("demo-sri-amman-store");
      expect(app.name).toContain("sri-amman-emulator-only");
      expect(auth).toBeDefined();
    });

    it("initializes the production adapter with isolated named app instance (sri-amman-smart-store)", () => {
      const prodAdapter = new FirebaseAuthAdapter("production");
      expect(prodAdapter.isProduction()).toBe(true);

      const { auth, app, projectId } = prodAdapter.getAuthInstance();
      expect(projectId).toBe(EXPECTED_PRODUCTION_PROJECT_ID);
      expect(app.name).toBe(PRODUCTION_AUTH_APP_NAME);
      expect(auth).toBeDefined();
    });
  });

  // ==========================================================================
  // SUITE 3: Strict Production Mutation & Safety Blockers
  // ==========================================================================
  describe("3. Strict Production Mutation & Safety Blockers", () => {
    it("blocks user creation in production mode and throws ProductionAuthSafetyError", async () => {
      const prodAdapter = new FirebaseAuthAdapter("production");
      await expect(prodAdapter.createUserWithEmailAndPassword()).rejects.toThrow(
        ProductionAuthSafetyError
      );
      await expect(prodAdapter.createUserWithEmailAndPassword()).rejects.toThrow(
        /SAFETY VIOLATION.*createUserWithEmailAndPassword.*strictly prohibited/i
      );
    });

    it("blocks live password reset email dispatch in production mode", async () => {
      const prodAdapter = new FirebaseAuthAdapter("production");
      await expect(prodAdapter.sendPasswordResetEmail()).rejects.toThrow(
        ProductionAuthSafetyError
      );
      await expect(prodAdapter.sendPasswordResetEmail()).rejects.toThrow(
        /SAFETY VIOLATION.*sendPasswordResetEmail.*strictly prohibited/i
      );
    });

    it("blocks live email verification dispatch in production mode", async () => {
      const prodAdapter = new FirebaseAuthAdapter("production");
      await expect(prodAdapter.sendEmailVerification()).rejects.toThrow(
        ProductionAuthSafetyError
      );
      await expect(prodAdapter.sendEmailVerification()).rejects.toThrow(
        /SAFETY VIOLATION.*sendEmailVerification.*strictly prohibited/i
      );
    });
  });

  // ==========================================================================
  // SUITE 4: Auth State Subscription & Cleanup
  // ==========================================================================
  describe("4. Auth State Subscription & Listener Cleanup", () => {
    it("subscribes to auth state changes, normalizes identity, and cleans up cleanly upon unsubscribe", () => {
      let activeListener: ((user: FirebaseUser | null) => void) | null = null;
      let unsubscribeCalled = false;

      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn(),
        signOut: vi.fn(),
        onAuthStateChanged: (_auth, listener) => {
          activeListener = listener;
          return () => {
            unsubscribeCalled = true;
            activeListener = null;
          };
        },
        getCurrentUser: () => null,
      };

      const adapter = new FirebaseAuthAdapter("emulator");
      adapter.setDriverForTesting(mockDriver);

      let observedUser: AuthUserIdentity | null = null;
      const unsubscribe = adapter.subscribeAuthState((user) => {
        observedUser = user;
      });

      expect(activeListener).toBeDefined();
      expect(unsubscribeCalled).toBe(false);

      // Simulate Firebase Auth state emission
      const mockFirebaseUser = {
        uid: "test_fb_uid_123",
        email: "customer@example.com",
        emailVerified: true,
        phoneNumber: "+919876543210",
        isAnonymous: false,
      } as FirebaseUser;

      activeListener!(mockFirebaseUser);

      expect(observedUser).not.toBeNull();
      const nonNullUser = (observedUser as unknown) as AuthUserIdentity;
      expect(nonNullUser.uid).toBe("test_fb_uid_123");
      expect(nonNullUser.email).toBe("customer@example.com");
      expect(nonNullUser.emailVerified).toBe(true);
      expect(nonNullUser.providerId).toBe("firebase-auth-emulator");

      // Verify clean unsubscribe
      unsubscribe();
      expect(unsubscribeCalled).toBe(true);
      expect(activeListener).toBeNull();
    });
  });

  // ==========================================================================
  // SUITE 5: Login & Error Mapping Without Secret Leakage
  // ==========================================================================
  describe("5. Login & Safe Error Mapping", () => {
    it("validates email and password inputs before dispatch", async () => {
      const adapter = new FirebaseAuthAdapter("emulator");
      await expect(adapter.loginWithEmail("", "pass123")).rejects.toThrow(
        "Please enter a valid email address."
      );
      await expect(adapter.loginWithEmail("test@example.com", "")).rejects.toThrow(
        "Please enter your password."
      );
    });

    it("maps authentication error codes to customer-friendly messages without leaking credentials", () => {
      const invalidCredErr = { code: "auth/invalid-credential", message: "Firebase: Error (auth/invalid-credential)." };
      expect(mapFirebaseAuthError(invalidCredErr)).toContain(
        "Invalid email address or password"
      );

      const userNotFoundErr = { code: "auth/user-not-found", message: "User not found" };
      expect(mapFirebaseAuthError(userNotFoundErr)).toContain(
        "Invalid email address or password"
      );

      const tooManyRequestsErr = { code: "auth/too-many-requests", message: "Too many attempts" };
      expect(mapFirebaseAuthError(tooManyRequestsErr)).toContain(
        "temporarily disabled due to many failed login attempts"
      );

      const networkErr = { code: "auth/network-request-failed", message: "Network error" };
      expect(mapFirebaseAuthError(networkErr)).toContain(
        "Network connection error"
      );

      const disabledErr = { code: "auth/user-disabled", message: "User is disabled" };
      expect(mapFirebaseAuthError(disabledErr)).toContain(
        "This customer account has been disabled"
      );

      const duplicateEmailErr = { code: "auth/email-already-in-use", message: "Email exists" };
      expect(mapFirebaseAuthError(duplicateEmailErr)).toContain(
        "Try signing in or password recovery"
      );
    });

    it("authenticates via driver and returns clean AuthUserIdentity", async () => {
      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn().mockResolvedValue({
          user: {
            uid: "auth_uid_valid_456",
            email: "verified@sriamman.test",
            emailVerified: true,
            phoneNumber: null,
            isAnonymous: false,
          } as FirebaseUser,
        }),
        signOut: vi.fn(),
        onAuthStateChanged: vi.fn().mockReturnValue(() => {}),
        getCurrentUser: () => null,
      };

      const adapter = new FirebaseAuthAdapter("emulator");
      adapter.setDriverForTesting(mockDriver);

      const identity = await adapter.loginWithEmail("verified@sriamman.test", "securePass123");
      expect(identity).toBeDefined();
      expect(identity.uid).toBe("auth_uid_valid_456");
      expect(identity.email).toBe("verified@sriamman.test");
      expect(identity.emailVerified).toBe(true);
      expect(identity.providerId).toBe("firebase-auth-emulator");
      expect(mockDriver.signInWithEmailAndPassword).toHaveBeenCalledTimes(1);
    });
  });

  // ==========================================================================
  // SUITE 6: Customer Profile Mapping & Missing Profile Handling
  // ==========================================================================
  describe("6. Customer Profile Mapping & Missing Profile Handling", () => {
    let memoryDriver: InMemoryFirestoreDriver;
    let testAdapter: FirestoreAdapter;

    beforeEach(() => {
      memoryDriver = new InMemoryFirestoreDriver({});
      testAdapter = new FirestoreAdapter(memoryDriver);
      customerIdentityService.setAdapterForTesting(testAdapter);
    });

    afterEach(() => {
      customerIdentityService.setAdapterForTesting(null);
    });

    it("handles an unlinked Firebase Auth user safely (status: 'unlinked', zero documents created)", async () => {
      const unlinkedUser: AuthUserIdentity = {
        uid: "new_fb_user_unlinked_999",
        email: "unlinked@sriamman.test",
        emailVerified: true,
        providerId: "firebase-auth-emulator",
      };

      const resolution = await customerIdentityService.resolveCustomerProfile(unlinkedUser);
      expect(resolution.status).toBe("unlinked");
      expect(resolution.ok).toBe(false);
      expect(resolution.profile).toBeNull();
      expect(resolution.userDocId).toBeNull();

      // Verify that no document was written to usersByUid or users
      expect(await memoryDriver.getDoc("usersByUid", "new_fb_user_unlinked_999")).toBeNull();
      expect(await memoryDriver.getDoc("users", "new_fb_user_unlinked_999")).toBeNull();
    });

    it("handles a missing profile when usersByUid exists but users/{userDocId} is missing (status: 'missing_profile')", async () => {
      const fbUid = "fb_uid_dangling_mapping";
      await memoryDriver.setDoc("usersByUid", fbUid, {
        uid: fbUid,
        userDocId: "SASS9999999",
      });

      const candidateUser: AuthUserIdentity = {
        uid: fbUid,
        email: "dangling@sriamman.test",
        emailVerified: true,
        providerId: "firebase-auth-emulator",
      };

      const resolution = await customerIdentityService.resolveCustomerProfile(candidateUser);
      expect(resolution.status).toBe("missing_profile");
      expect(resolution.ok).toBe(false);
      expect(resolution.profile).toBeNull();
      if (resolution.status === "missing_profile") {
        expect(resolution.code).toBe("identity/missing-profile");
      }
    });

    it("successfully maps a linked Firebase Auth user -> usersByUid/{uid} -> users/{userDocId} -> normalized User", async () => {
      const fbUid = "fb_uid_linked_priya_88";
      await memoryDriver.setDoc("usersByUid", fbUid, {
        uid: fbUid,
        userDocId: "SASS0000088",
      });
      await memoryDriver.setDoc("users", "SASS0000088", {
        userId: "SASS0000088",
        fullName: "Priya Sundaram",
        phone: "+91 94433 12345",
        number: "9443312345",
        countryCode: "+91",
        email: "priya.sundaram@example.com",
        availableCoins: 620,
        earnedCoins: 850,
        isVIP: true,
      });

      const candidateUser: AuthUserIdentity = {
        uid: fbUid,
        email: "priya.sundaram@example.com",
        emailVerified: true,
        providerId: "firebase-auth-emulator",
      };

      const resolution = await customerIdentityService.resolveCustomerProfile(candidateUser);
      expect(resolution.status).toBe("resolved");
      expect(resolution.ok).toBe(true);
      if (resolution.status === "resolved") {
        expect(resolution.userDocId).toBe("SASS0000088");
        expect(resolution.profile.id).toBe("SASS0000088");
        expect(resolution.profile.name).toBe("Priya Sundaram");
        expect(resolution.profile.coins).toBe(620);
        expect(resolution.profile.isVIP).toBe(true);
        expect(resolution.profile.uid).toBe(fbUid);
      }
    });
  });

  // ==========================================================================
  // SUITE 7: Session Preservation & Synchronization
  // ==========================================================================
  describe("7. Session Preservation & Synchronization", () => {
    it("preserves mock customer session in localStorage across reloads without corruption", () => {
      const mockCustomer = {
        id: "SASS0000104",
        userId: "SASS0000104",
        name: "Arun Kumar",
        phone: "+91 99999 99999",
        coins: 100,
        isVIP: false,
      };

      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockCustomer));

      const restored = authService.getCurrentUser();
      expect(restored).not.toBeNull();
      expect(restored?.id).toBe("SASS0000104");
      expect(restored?.name).toBe("Arun Kumar");
      expect(restored?.coins).toBe(100);
    });

    it("synchronizes user session updates (e.g. coin balance changes) only when targeting current user", () => {
      const current = {
        id: "SASS0000104",
        userId: "SASS0000104",
        name: "Arun Kumar",
        coins: 100,
        phone: "+91 99999 99999",
        isVIP: false,
      };
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(current));

      // Update current user
      const synced = authService.syncUserSession({ id: "SASS0000104", coins: 85 });
      expect(synced).not.toBeNull();
      expect(synced?.coins).toBe(85);
      expect(authService.getCurrentUser()?.coins).toBe(85);

      // Attempt update for different user -> rejected
      const foreignUpdate = authService.syncUserSession({ id: "SASS0000088", coins: 999 });
      expect(foreignUpdate).toBeNull();
      expect(authService.getCurrentUser()?.coins).toBe(85);
    });
  });
});
