import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  authManager,
  resolveDefaultAuthMode,
  FirebaseAuthAdapter,
  ProductionAuthSafetyError,
  type FirebaseAuthDriver,
  type AuthUserIdentity,
} from "../services/authAdapter";
import {
  customerIdentityService,
  type CustomerIdentityResolutionResult,
} from "../services/customerIdentityService";
import {
  EXPECTED_PRODUCTION_PROJECT_ID,
  EXPECTED_PRODUCTION_AUTH_DOMAIN,
} from "../services/productionPreviewService";
import type { User as FirebaseUser } from "firebase/auth";

describe("Phase 3A: Existing Customer Production Login & Authentication Verification", () => {
  const originalSessionStorage = globalThis.sessionStorage;
  const originalLocation = globalThis.location;

  beforeEach(() => {
    vi.restoreAllMocks();
    authManager.resetMode();
    customerIdentityService.setProductionReaderForTesting(null);
    customerIdentityService.setAdapterForTesting(null);
  });

  afterEach(() => {
    authManager.resetMode();
    customerIdentityService.setProductionReaderForTesting(null);
    customerIdentityService.setAdapterForTesting(null);
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem("sass_auth_mode");
      } catch {
        // Ignore
      }
    }
  });

  // ==========================================================================
  // SUITE 1: Auth Mode Resolution & Production Catalogue Decoupling
  // ==========================================================================
  describe("1. Mode Resolution & Catalogue Decoupling Invariants", () => {
    it("strictly defaults to 'emulator' mode (127.0.0.1:9099 / demo-sri-amman-store)", () => {
      const mode = resolveDefaultAuthMode();
      expect(mode).toBe("emulator");
      expect(authManager.getMode()).toBe("emulator");

      const status = authManager.getStatus();
      expect(status.isEmulator).toBe(true);
      expect(status.isProduction).toBe(false);
      expect(status.projectId).toBe("demo-sri-amman-store");
      expect(status.emulatorHost).toBe("127.0.0.1");
      expect(status.emulatorPort).toBe(9099);
    });

    it("does NOT switch auth mode to production when browsing production catalog readonly (?catalogMode=production-readonly)", () => {
      // Mock window.location with catalogMode
      const mockLocation = new URL("http://localhost:5173/shop?catalogMode=production-readonly");
      vi.stubGlobal("location", mockLocation);

      const mode = resolveDefaultAuthMode();
      expect(mode).toBe("emulator");
      expect(authManager.getMode()).toBe("emulator");
    });

    it("activates production auth mode only when explicitly requested via authMode=production", () => {
      const mockLocation = new URL("http://localhost:5173/login?authMode=production");
      vi.stubGlobal("location", mockLocation);

      const mode = resolveDefaultAuthMode();
      expect(mode).toBe("production");

      authManager.setMode("production");
      expect(authManager.getMode()).toBe("production");
      const status = authManager.getStatus();
      expect(status.isProduction).toBe(true);
      expect(status.isEmulator).toBe(false);
      expect(status.projectId).toBe(EXPECTED_PRODUCTION_PROJECT_ID);
      expect(status.authDomain).toBe(EXPECTED_PRODUCTION_AUTH_DOMAIN);
    });

    it("preserves explicit sessionStorage selection for production mode", () => {
      const mockStore: Record<string, string> = { sass_auth_mode: "production" };
      vi.stubGlobal("sessionStorage", {
        getItem: (k: string) => mockStore[k] ?? null,
        setItem: (k: string, v: string) => { mockStore[k] = v; },
        removeItem: (k: string) => { delete mockStore[k]; },
      });

      const mode = resolveDefaultAuthMode();
      expect(mode).toBe("production");
    });
  });

  // ==========================================================================
  // SUITE 2: FirebaseAuthAdapter Production Delegation & Safety Blockers
  // ==========================================================================
  describe("2. FirebaseAuthAdapter Production Delegation & Safety Blockers", () => {
    it("delegates login to driver in production mode and normalizes providerId as 'firebase-auth-production'", async () => {
      const adapter = new FirebaseAuthAdapter("production");
      expect(adapter.isProduction()).toBe(true);

      const fakeFirebaseUser = {
        uid: "prod_firebase_uid_104",
        email: "arun.kumar@example.com",
        emailVerified: true,
        phoneNumber: "+91 99999 99999",
        isAnonymous: false,
      } as FirebaseUser;

      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn().mockResolvedValue({
          user: fakeFirebaseUser,
        }),
        signOut: vi.fn().mockResolvedValue(undefined),
        onAuthStateChanged: vi.fn(),
        getCurrentUser: vi.fn().mockReturnValue(fakeFirebaseUser),
      };

      adapter.setDriverForTesting(mockDriver);

      const result = await adapter.loginWithEmail(
        "arun.kumar@example.com",
        "ValidPassword123"
      );

      expect(mockDriver.signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        "arun.kumar@example.com",
        "ValidPassword123"
      );
      expect(result.uid).toBe("prod_firebase_uid_104");
      expect(result.email).toBe("arun.kumar@example.com");
      expect(result.providerId).toBe("firebase-auth-production");
    });

    it("intercepts invalid credential errors and maps them to customer-safe messages without leaking internal paths", async () => {
      const adapter = new FirebaseAuthAdapter("production");

      const mockDriver: FirebaseAuthDriver = {
        signInWithEmailAndPassword: vi.fn().mockRejectedValue({
          code: "auth/invalid-credential",
          message: "Firebase: Error (auth/invalid-credential).",
        }),
        signOut: vi.fn(),
        onAuthStateChanged: vi.fn(),
        getCurrentUser: () => null,
      };

      adapter.setDriverForTesting(mockDriver);

      await expect(
        adapter.loginWithEmail("unknown@example.com", "wrongpass")
      ).rejects.toThrow(
        "Invalid email address or password. Please verify your credentials or sign in with Mobile OTP."
      );
    });

    it("strictly blocks state-mutating auth actions in production mode with ProductionAuthSafetyError", async () => {
      const adapter = new FirebaseAuthAdapter("production");

      await expect(adapter.createUserWithEmailAndPassword()).rejects.toThrow(
        ProductionAuthSafetyError
      );
      await expect(adapter.sendPasswordResetEmail()).rejects.toThrow(
        ProductionAuthSafetyError
      );
      await expect(adapter.sendEmailVerification()).rejects.toThrow(
        ProductionAuthSafetyError
      );
    });
  });

  // ==========================================================================
  // SUITE 3: Customer Identity Service Production Document Resolution
  // ==========================================================================
  describe("3. Production Customer Profile Resolution (usersByUid/{uid} -> users/{userDocId})", () => {
    it("successfully resolves an existing production customer profile without mutating documents", async () => {
      const prodUid = "prod_uid_selvam_104";
      const candidateUser: AuthUserIdentity = {
        uid: prodUid,
        email: "selvam.amman@example.com",
        emailVerified: true,
        providerId: "firebase-auth-production",
      };

      // Mock production reader that intercepts calls to usersByUid and users
      const readSpy = vi.fn(async (col: "usersByUid" | "users", docId: string) => {
        if (col === "usersByUid" && docId === prodUid) {
          return {
            uid: prodUid,
            userDocId: "SASS0000104",
          };
        }
        if (col === "users" && docId === "SASS0000104") {
          return {
            userId: "SASS0000104",
            fullName: "Selvam Ramanathan",
            phone: "+91 99999 99999",
            number: "9999999999",
            countryCode: "+91",
            email: "selvam.amman@example.com",
            coins: 254,
            earnedCoins: 300,
            membershipTier: "Gold",
            isVIP: true,
          };
        }
        return null;
      });

      customerIdentityService.setProductionReaderForTesting(readSpy);

      const resolution = await customerIdentityService.resolveCustomerProfile(
        candidateUser,
        { mode: "production" }
      );

      expect(readSpy).toHaveBeenCalledTimes(2);
      expect(readSpy).toHaveBeenNthCalledWith(1, "usersByUid", prodUid);
      expect(readSpy).toHaveBeenNthCalledWith(2, "users", "SASS0000104");

      expect(resolution.status).toBe("resolved");
      expect(resolution.ok).toBe(true);
      if (resolution.status === "resolved") {
        expect(resolution.uid).toBe(prodUid);
        expect(resolution.userDocId).toBe("SASS0000104");
        expect(resolution.profile.id).toBe("SASS0000104");
        expect(resolution.profile.name).toBe("Selvam Ramanathan");
        expect(resolution.profile.coins).toBe(254);
        expect(resolution.profile.isVIP).toBe(true);
        expect(resolution.profile.uid).toBe(prodUid);
      }
    });

    it("handles unlinked UID by returning status 'unlinked' with zero document creation", async () => {
      const prodUid = "prod_unlinked_customer_999";
      const candidateUser: AuthUserIdentity = {
        uid: prodUid,
        email: "new.shopper@example.com",
        emailVerified: true,
        providerId: "firebase-auth-production",
      };

      const readSpy = vi.fn(async () => null); // usersByUid does not exist
      customerIdentityService.setProductionReaderForTesting(readSpy);

      const resolution = await customerIdentityService.resolveCustomerProfile(
        candidateUser,
        { mode: "production" }
      );

      expect(readSpy).toHaveBeenCalledTimes(1);
      expect(readSpy).toHaveBeenCalledWith("usersByUid", prodUid);

      expect(resolution.status).toBe("unlinked");
      expect(resolution.ok).toBe(false);
      if (resolution.status === "unlinked") {
        expect(resolution.code).toBe("identity/unlinked-uid");
        expect(resolution.requiresRegistration).toBe(true);
        expect(resolution.profile).toBeNull();
        expect(resolution.userDocId).toBeNull();
      }
    });

    it("handles missing profile (usersByUid exists but users/{userDocId} is missing)", async () => {
      const prodUid = "prod_dangling_customer_555";
      const candidateUser: AuthUserIdentity = {
        uid: prodUid,
        email: "dangling@example.com",
        emailVerified: true,
        providerId: "firebase-auth-production",
      };

      const readSpy = vi.fn(async (col: "usersByUid" | "users", docId: string) => {
        if (col === "usersByUid" && docId === prodUid) {
          return {
            uid: prodUid,
            userDocId: "SASS0000555",
          };
        }
        return null; // users/SASS0000555 not found
      });

      customerIdentityService.setProductionReaderForTesting(readSpy);

      const resolution = await customerIdentityService.resolveCustomerProfile(
        candidateUser,
        { mode: "production" }
      );

      expect(resolution.status).toBe("missing_profile");
      expect(resolution.ok).toBe(false);
      if (resolution.status === "missing_profile") {
        expect(resolution.code).toBe("identity/missing-profile");
        expect(resolution.userDocId).toBe("SASS0000555");
        expect(resolution.profile).toBeNull();
      }
    });

    it("handles permission-denied errors gracefully with status 'database_error'", async () => {
      const prodUid = "prod_permission_error_uid";
      const candidateUser: AuthUserIdentity = {
        uid: prodUid,
        email: "user@example.com",
        emailVerified: true,
        providerId: "firebase-auth-production",
      };

      const readSpy = vi.fn(async () => {
        const err: any = new Error("Missing or insufficient permissions.");
        err.code = "permission-denied";
        throw err;
      });

      customerIdentityService.setProductionReaderForTesting(readSpy);

      const resolution = await customerIdentityService.resolveCustomerProfile(
        candidateUser,
        { mode: "production" }
      );

      expect(resolution.status).toBe("database_error");
      expect(resolution.ok).toBe(false);
      if (resolution.status === "database_error") {
        expect(resolution.code).toBe("identity/database-error");
        expect(resolution.isEmulatorUnavailable).toBe(false);
        expect(resolution.message).toContain("Firestore error");
        expect(resolution.profile).toBeNull();
      }
    });
  });

  // ==========================================================================
  // SUITE 4: Zero Writes Invariant
  // ==========================================================================
  describe("4. Zero Writes Invariant Verification", () => {
    it("never invokes any write method or document mutator during customer login", async () => {
      authManager.setMode("production");
      const prodAdapter = authManager.getProductionAdapter();

      expect(() => prodAdapter.assertWritePermitted("createUserWithEmailAndPassword")).toThrow(
        ProductionAuthSafetyError
      );
      expect(() => prodAdapter.assertWritePermitted("setDoc")).toThrow(
        ProductionAuthSafetyError
      );
      expect(() => prodAdapter.assertWritePermitted("updateDoc")).toThrow(
        ProductionAuthSafetyError
      );
      expect(() => prodAdapter.assertWritePermitted("deleteDoc")).toThrow(
        ProductionAuthSafetyError
      );
    });
  });
});

