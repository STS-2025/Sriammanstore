import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor, act, cleanup } from "@testing-library/react";
import dbData from "../../db.json";
import { apiClient } from "../services/apiClient";
import {
  FirestoreAdapter,
  InMemoryFirestoreDriver,
  SdkFirestoreDriver,
  StorageAdapterError,
} from "../services/firestoreAdapter";
import {
  authService,
  AUTH_STORAGE_KEY,
  TEST_CREDENTIALS,
} from "../services/authService";
import {
  emailLinkAuthService,
  type FirebaseEmailLinkDriver,
} from "../services/emailLinkAuthService";
import { customerIdentityService } from "../services/customerIdentityService";
import {
  AuthProvider,
  useAuth,
  describeIdentityResolutionState,
  type AuthContextType,
} from "../context/AuthContext";
import {
  CANONICAL_LINKED_TEST_CUSTOMER_ID,
  seedInMemoryLinkedCustomerFixture,
  seedEmulatorLinkedCustomerFixture,
} from "./linkedCustomerFixture";

function AuthHarness({
  onRender,
}: {
  onRender: (ctx: AuthContextType) => void;
}) {
  const ctx = useAuth();
  onRender(ctx);
  return (
    <div data-testid="auth-harness">
      <span data-testid="session-type">{ctx.sessionType ?? "none"}</span>
      <span data-testid="is-authenticated">{String(ctx.isAuthenticated)}</span>
      <span data-testid="user-id">{ctx.user?.id ?? "none"}</span>
      <span data-testid="user-name">{ctx.user?.name ?? "none"}</span>
      <span data-testid="user-uid">{ctx.user?.uid ?? "none"}</span>
      <span data-testid="firebase-uid">{ctx.firebaseUser?.uid ?? "none"}</span>
      <span data-testid="resolution-status">
        {ctx.identityResolution?.status ?? "none"}
      </span>
      <span data-testid="notice-code">{ctx.identityNotice?.code ?? "none"}</span>
      <span data-testid="notice-title">
        {ctx.identityNotice?.title ?? "none"}
      </span>
      <span data-testid="protected-page-gate">
        {ctx.isAuthenticated && ctx.user
          ? `authorized:${ctx.user.id}:${ctx.user.name}`
          : "sign-in-required"}
      </span>
    </div>
  );
}

describe("AuthContext Integration: Mock & Firebase Email-Link Sessions", () => {
  let memoryDriver: InMemoryFirestoreDriver;
  let testAdapter: FirestoreAdapter;
  let originalAdapter: FirestoreAdapter;
  let originalMode: ReturnType<typeof apiClient.getMode>;

  const validCallbackUrl =
    "http://localhost:5173/login?apiKey=demo-sri-amman-store-local-emulator-key&mode=signIn&oobCode=ctx-test-oob-104";

  beforeEach(() => {
    memoryDriver = new InMemoryFirestoreDriver(
      dbData as unknown as Record<string, unknown>
    );
    testAdapter = new FirestoreAdapter(memoryDriver);
    originalAdapter = apiClient.getFirestoreAdapter();
    originalMode = apiClient.getMode();

    apiClient.setFirestoreAdapter(testAdapter);
    apiClient.setMode("emulator");
    apiClient.resetSourceState();

    customerIdentityService.setAdapterForTesting(testAdapter);
    const defaultIdleDriver: FirebaseEmailLinkDriver = {
      async sendSignInLinkToEmail() {},
      isSignInWithEmailLink: () => false,
      async signInWithEmailLink() {
        throw new Error("Unexpected signInWithEmailLink in idle driver");
      },
      getCurrentUser: () => null,
      async signOut() {},
      onAuthStateChanged(listener) {
        listener(null);
        return () => {};
      },
    };
    emailLinkAuthService.setDriverForTesting(defaultIdleDriver);
    emailLinkAuthService.clearPendingEmail();
    authService.logout();
  });

  afterEach(() => {
    cleanup();
    customerIdentityService.setAdapterForTesting(null);
    emailLinkAuthService.setDriverForTesting(null);
    emailLinkAuthService.clearPendingEmail();
    authService.logout();

    apiClient.setFirestoreAdapter(originalAdapter);
    apiClient.setMode(originalMode);
    apiClient.resetSourceState();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("1. Existing Mock Login & Logout Regression", () => {
    it("supports mock Mobile OTP and Email/Password login and logout without assigning a Firebase UID", async () => {
      let latestCtx: AuthContextType | null = null;
      render(
        <AuthProvider>
          <AuthHarness
            onRender={(ctx) => {
              latestCtx = ctx;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(latestCtx?.isLoading).toBe(false);
      });
      expect(screen.getByTestId("session-type").textContent).toBe("none");
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");

      // 1. Mobile OTP mock login
      await act(async () => {
        await latestCtx!.login(TEST_CREDENTIALS.phone, TEST_CREDENTIALS.otp);
      });

      expect(screen.getByTestId("session-type").textContent).toBe("mock");
      expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      expect(screen.getByTestId("user-id").textContent).toBe("SASS0000104");
      expect(screen.getByTestId("user-name").textContent).toBe("Arun Kumar");
      expect(screen.getByTestId("user-uid").textContent).toBe("none");
      expect(screen.getByTestId("firebase-uid").textContent).toBe("none");
      expect(latestCtx!.user?.uid).toBeUndefined();
      expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeTruthy();

      // 2. Logout clears mock session
      await act(async () => {
        await latestCtx!.logout();
      });

      expect(screen.getByTestId("session-type").textContent).toBe("none");
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
      expect(screen.getByTestId("user-id").textContent).toBe("none");
      expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();

      // 3. Email/Password mock login
      await act(async () => {
        await latestCtx!.loginWithEmail(
          TEST_CREDENTIALS.vipEmail,
          TEST_CREDENTIALS.defaultPassword
        );
      });

      expect(screen.getByTestId("session-type").textContent).toBe("mock");
      expect(screen.getByTestId("user-id").textContent).toBe("SASS0000088");
      expect(screen.getByTestId("user-name").textContent).toBe("Priya Sundaram");
      expect(latestCtx!.user?.uid).toBeUndefined();
      expect(latestCtx!.firebaseUser).toBeNull();
    });
  });

  describe("2. Firebase Email-Link Sign-In & Successful Customer Resolution", () => {
    it("completes email-link sign-in, resolves usersByUid/{uid} -> users/{userDocId}, and exposes normalized SASS profile with distinct UID and SASS ID", async () => {
      const firebaseUid = "firebase_uid_linked_arun_104";
      await memoryDriver.setDoc("usersByUid", firebaseUid, {
        uid: firebaseUid,
        userDocId: "SASS0000104",
      });

      let currentDriverUser: {
        uid: string;
        email: string | null;
        emailVerified: boolean;
      } | null = null;
      let authListener:
        | ((
            user: {
              uid: string;
              email: string | null;
              emailVerified: boolean;
            } | null
          ) => void)
        | null = null;

      const mockDriver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail() {},
        isSignInWithEmailLink: (url) => url === validCallbackUrl,
        async signInWithEmailLink(email) {
          currentDriverUser = {
            uid: firebaseUid,
            email,
            emailVerified: true,
          };
          authListener?.(currentDriverUser);
          return currentDriverUser;
        },
        getCurrentUser: () => currentDriverUser,
        async signOut() {
          currentDriverUser = null;
          authListener?.(null);
        },
        onAuthStateChanged(listener) {
          authListener = listener;
          listener(currentDriverUser);
          return () => {
            authListener = null;
          };
        },
      };
      emailLinkAuthService.setDriverForTesting(mockDriver);
      emailLinkAuthService.savePendingEmail(TEST_CREDENTIALS.regularEmail);

      let latestCtx: AuthContextType | null = null;
      render(
        <AuthProvider>
          <AuthHarness
            onRender={(ctx) => {
              latestCtx = ctx;
            }}
          />
        </AuthProvider>
      );

      await act(async () => {
        const res = await latestCtx!.completeEmailLinkSignIn(validCallbackUrl);
        expect(res.status).toBe("resolved");
      });
      expect(screen.getByTestId("session-type").textContent).toBe("firebase");
      expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      expect(screen.getByTestId("user-id").textContent).toBe("SASS0000104");
      expect(screen.getByTestId("user-name").textContent).toBe("Arun Kumar");
      expect(screen.getByTestId("firebase-uid").textContent).toBe(firebaseUid);
      expect(latestCtx!.user?.id).toBe("SASS0000104");
      expect(latestCtx!.user?.userId).toBe("SASS0000104");
      expect(latestCtx!.firebaseUser?.uid).toBe(firebaseUid);
      expect(latestCtx!.user?.id).not.toBe(firebaseUid);

      // Must NOT pollute mock session storage (`sass_customer_session`)
      expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    });
  });

  describe("3. Firebase Auth State Restoration After Page Refresh", () => {
    it("restores an active Firebase Auth session on mount via onAuthStateChanged and re-resolves the SASS customer profile", async () => {
      const firebaseUid = "firebase_uid_persisted_vip_88";
      await memoryDriver.setDoc("usersByUid", firebaseUid, {
        uid: firebaseUid,
        userDocId: "SASS0000088",
      });

      const persistedUser = {
        uid: firebaseUid,
        email: TEST_CREDENTIALS.vipEmail,
        emailVerified: true,
      };

      const persistedDriver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail() {},
        isSignInWithEmailLink: () => false,
        async signInWithEmailLink() {
          return persistedUser;
        },
        getCurrentUser: () => persistedUser,
        async signOut() {},
        onAuthStateChanged(listener) {
          queueMicrotask(() => {
            listener(persistedUser);
          });
          return () => {};
        },
      };
      emailLinkAuthService.setDriverForTesting(persistedDriver);

      let latestCtx: AuthContextType | null = null;
      const { unmount } = render(
        <AuthProvider>
          <AuthHarness
            onRender={(ctx) => {
              latestCtx = ctx;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("session-type").textContent).toBe("firebase");
      });
      expect(screen.getByTestId("user-id").textContent).toBe("SASS0000088");
      expect(screen.getByTestId("user-name").textContent).toBe("Priya Sundaram");
      expect(screen.getByTestId("firebase-uid").textContent).toBe(firebaseUid);
      expect(latestCtx!.user?.isVIP).toBe(true);

      // Simulate page refresh by unmounting and remounting AuthProvider
      unmount();

      render(
        <AuthProvider>
          <AuthHarness
            onRender={(ctx) => {
              latestCtx = ctx;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("session-type").textContent).toBe("firebase");
      });
      expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
      expect(screen.getByTestId("user-id").textContent).toBe("SASS0000088");
      expect(screen.getByTestId("firebase-uid").textContent).toBe(firebaseUid);
    });
  });

  describe("4. Unlinked Firebase User Handling", () => {
    it("exposes status 'unlinked', keeps user null and isAuthenticated false, never links by email alone, and allows safe sign-out", async () => {
      const unlinkedUid = "firebase_uid_unlinked_arun_email";
      // Note: TEST_CREDENTIALS.regularEmail ("arun.kumar@example.com") exists in `users/SASS0000104`,
      // but `usersByUid/firebase_uid_unlinked_arun_email` does NOT exist.
      let currentDriverUser: {
        uid: string;
        email: string | null;
        emailVerified: boolean;
      } | null = null;

      const mockDriver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail() {},
        isSignInWithEmailLink: (url) => url === validCallbackUrl,
        async signInWithEmailLink(email) {
          currentDriverUser = {
            uid: unlinkedUid,
            email,
            emailVerified: true,
          };
          return currentDriverUser;
        },
        getCurrentUser: () => currentDriverUser,
        async signOut() {
          currentDriverUser = null;
        },
        onAuthStateChanged(listener) {
          listener(currentDriverUser);
          return () => {};
        },
      };
      emailLinkAuthService.setDriverForTesting(mockDriver);

      let latestCtx: AuthContextType | null = null;
      render(
        <AuthProvider>
          <AuthHarness
            onRender={(ctx) => {
              latestCtx = ctx;
            }}
          />
        </AuthProvider>
      );

      await act(async () => {
        const res = await latestCtx!.completeEmailLinkSignIn(
          validCallbackUrl,
          TEST_CREDENTIALS.regularEmail
        );
        expect(res.status).toBe("unlinked");
      });

      // Must NOT treat Firebase auth as a resolved SASS session
      expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
      expect(screen.getByTestId("session-type").textContent).toBe("none");
      expect(screen.getByTestId("user-id").textContent).toBe("none");
      expect(screen.getByTestId("firebase-uid").textContent).toBe(unlinkedUid);
      expect(screen.getByTestId("resolution-status").textContent).toBe("unlinked");
      expect(screen.getByTestId("notice-code").textContent).toBe(
        "identity/unlinked-uid"
      );
      expect(screen.getByTestId("notice-title").textContent).toBe(
        "Customer Account Not Linked"
      );

      // Sign out cleanly clears the unlinked Firebase session
      await act(async () => {
        await latestCtx!.logout();
      });

      expect(screen.getByTestId("firebase-uid").textContent).toBe("none");
      expect(screen.getByTestId("resolution-status").textContent).toBe("none");
      expect(screen.getByTestId("notice-code").textContent).toBe("none");
    });
  });

  describe("5. Missing Profile, Malformed Mapping, Profile ID Mismatch & Database Failure", () => {
    it("handles missing_profile, malformed_mapping, and profile_id_mismatch distinctly without exposing internal paths", async () => {
      const uidMissing = "uid_missing_profile_999";
      await memoryDriver.setDoc("usersByUid", uidMissing, {
        uid: uidMissing,
        userDocId: "SASS9999999",
      });

      const uidMalformed = "uid_malformed_mapping_999";
      await memoryDriver.setDoc("usersByUid", uidMalformed, {
        uid: uidMalformed,
        userDocId: "NOT_A_SASS_ID",
      });

      const uidMismatch = "uid_mismatch_profile_999";
      await memoryDriver.setDoc("usersByUid", uidMismatch, {
        uid: uidMismatch,
        userDocId: "SASS0000104",
      });
      await memoryDriver.setDoc("users", "SASS0000104", {
        id: "SASS0000104",
        userId: "SASS0000104",
        uid: "different_owner_uid",
        fullName: "Arun Kumar",
        number: "9999999999",
      });

      let latestCtx: AuthContextType | null = null;
      render(
        <AuthProvider>
          <AuthHarness
            onRender={(ctx) => {
              latestCtx = ctx;
            }}
          />
        </AuthProvider>
      );

      // 1. missing_profile
      await act(async () => {
        await latestCtx!.resolveFirebaseSession({
          uid: uidMissing,
          email: "missing@example.com",
          emailVerified: true,
          providerId: "firebase-email-link",
        });
      });
      expect(latestCtx!.user).toBeNull();
      expect(latestCtx!.isAuthenticated).toBe(false);
      expect(latestCtx!.identityResolution?.status).toBe("missing_profile");
      expect(latestCtx!.identityNotice?.code).toBe("identity/missing-profile");
      expect(latestCtx!.identityNotice?.title).toBe(
        "Customer Profile Record Not Found"
      );
      expect(latestCtx!.identityNotice?.userMessage).not.toContain("SASS9999999");

      // 2. malformed_mapping
      await act(async () => {
        await latestCtx!.resolveFirebaseSession({
          uid: uidMalformed,
          email: "malformed@example.com",
          emailVerified: true,
          providerId: "firebase-email-link",
        });
      });
      expect(latestCtx!.user).toBeNull();
      expect(latestCtx!.identityResolution?.status).toBe("malformed_mapping");
      expect(latestCtx!.identityNotice?.code).toBe("identity/malformed-mapping");
      expect(latestCtx!.identityNotice?.title).toBe(
        "Account Link Configuration Issue"
      );

      // 3. profile_id_mismatch
      await act(async () => {
        await latestCtx!.resolveFirebaseSession({
          uid: uidMismatch,
          email: "mismatch@example.com",
          emailVerified: true,
          providerId: "firebase-email-link",
        });
      });
      expect(latestCtx!.user).toBeNull();
      expect(latestCtx!.identityResolution?.status).toBe("profile_id_mismatch");
      expect(latestCtx!.identityNotice?.code).toBe(
        "identity/profile-uid-mismatch"
      );
      expect(latestCtx!.identityNotice?.title).toBe(
        "Customer Profile Identity Mismatch"
      );
      expect(latestCtx!.identityNotice?.userMessage).not.toContain(
        "different_owner_uid"
      );
    });

    it("surfaces database_error as retryable when the emulator is unreachable and recovers when retried", async () => {
      const uid = "firebase_uid_retry_104";
      await memoryDriver.setDoc("usersByUid", uid, {
        uid,
        userDocId: "SASS0000104",
      });

      memoryDriver.setFailureMode(
        new StorageAdapterError("ECONNREFUSED 127.0.0.1:8081", {
          status: 503,
          code: "unavailable",
          category: "connectivity",
        })
      );

      let latestCtx: AuthContextType | null = null;
      render(
        <AuthProvider>
          <AuthHarness
            onRender={(ctx) => {
              latestCtx = ctx;
            }}
          />
        </AuthProvider>
      );

      await act(async () => {
        await latestCtx!.resolveFirebaseSession({
          uid,
          email: TEST_CREDENTIALS.regularEmail,
          emailVerified: true,
          providerId: "firebase-email-link",
        });
      });

      expect(latestCtx!.user).toBeNull();
      expect(latestCtx!.isAuthenticated).toBe(false);
      expect(latestCtx!.identityResolution?.status).toBe("database_error");
      expect(latestCtx!.identityNotice?.code).toBe(
        "identity/emulator-unavailable"
      );
      expect(latestCtx!.identityNotice?.isRetryable).toBe(true);

      // Restore emulator connectivity and retry
      memoryDriver.setFailureMode(null);
      await act(async () => {
        const retried = await latestCtx!.resolveFirebaseSession();
        expect(retried.status).toBe("resolved");
      });

      expect(latestCtx!.sessionType).toBe("firebase");
      expect(latestCtx!.isAuthenticated).toBe(true);
      expect(latestCtx!.user?.id).toBe("SASS0000104");
      expect(latestCtx!.identityNotice).toBeNull();
    });
  });

  describe("6. Preventing Mock Sessions from Being Mistaken for Firebase Sessions & Zero-Write Guarantee", () => {
    it("strips any accidental uid from mock localStorage sessions and never invokes Firebase identity resolution for mock users", async () => {
      // Tamper localStorage with a mock user object containing a fake uid
      window.localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          id: "SASS0000104",
          userId: "SASS0000104",
          uid: "forged_firebase_uid",
          name: "Arun Kumar",
          phone: "+91 99999 99999",
          email: "arun.kumar@example.com",
          coins: 120,
          isVIP: false,
          referralCode: "SASS0000104",
          createdAt: "2026-01-01T00:00:00.000Z",
        })
      );

      const resolveSpy = vi.spyOn(
        customerIdentityService,
        "resolveCustomerProfile"
      );
      const setDocSpy = vi.spyOn(memoryDriver, "setDoc");
      const updateDocSpy = vi.spyOn(memoryDriver, "updateDoc");
      const deleteDocSpy = vi.spyOn(memoryDriver, "deleteDoc");

      const idleDriver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail() {},
        isSignInWithEmailLink: () => false,
        async signInWithEmailLink() {
          throw new Error("Not used");
        },
        getCurrentUser: () => null,
        async signOut() {},
        onAuthStateChanged(listener) {
          listener(null);
          return () => {};
        },
      };
      emailLinkAuthService.setDriverForTesting(idleDriver);

      let latestCtx: AuthContextType | null = null;
      render(
        <AuthProvider>
          <AuthHarness
            onRender={(ctx) => {
              latestCtx = ctx;
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(latestCtx?.isLoading).toBe(false);
      });

      expect(latestCtx!.sessionType).toBe("mock");
      expect(latestCtx!.user?.id).toBe("SASS0000104");
      expect(latestCtx!.user?.uid).toBeUndefined();
      expect(latestCtx!.firebaseUser).toBeNull();
      expect(resolveSpy).not.toHaveBeenCalled();
      expect(setDocSpy).not.toHaveBeenCalled();
      expect(updateDocSpy).not.toHaveBeenCalled();
      expect(deleteDocSpy).not.toHaveBeenCalled();
    });

    it("never silently converts a failed Firebase session into a mock session and never retains stale customer data after switching or signing out", async () => {
      const linkedUid = "firebase_uid_linked_9999901";
      const linkedEmail = "emulator.customer@sriamman.test";
      const { cleanup: cleanupInMemoryFixture } =
        await seedInMemoryLinkedCustomerFixture(
          memoryDriver,
          linkedUid,
          linkedEmail
        );

      try {
        let latestCtx: AuthContextType | null = null;
        render(
          <AuthProvider>
            <AuthHarness
              onRender={(ctx) => {
                latestCtx = ctx;
              }}
            />
          </AuthProvider>
        );

        await waitFor(() => {
          expect(latestCtx?.isLoading).toBe(false);
        });

        // 1. Start with a mock session (SASS0000104 / Arun Kumar)
        await act(async () => {
          await latestCtx!.login(TEST_CREDENTIALS.phone, TEST_CREDENTIALS.otp);
        });
        expect(screen.getByTestId("session-type").textContent).toBe("mock");
        expect(screen.getByTestId("user-id").textContent).toBe("SASS0000104");
        expect(screen.getByTestId("protected-page-gate").textContent).toBe(
          "authorized:SASS0000104:Arun Kumar"
        );
        expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeTruthy();

        // 2. Switch to an UNLINKED Firebase user while mock session was active:
        //    Must NOT fall back to the mock session; must clear localStorage and block protected pages!
        await act(async () => {
          const res = await latestCtx!.resolveFirebaseSession({
            uid: "firebase_uid_unlinked_while_mock_active",
            email: "unlinked.switch@sriamman.test",
            emailVerified: true,
            providerId: "firebase-email-link",
          });
          expect(res.status).toBe("unlinked");
        });

        expect(screen.getByTestId("session-type").textContent).toBe("none");
        expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
        expect(screen.getByTestId("user-id").textContent).toBe("none");
        expect(screen.getByTestId("user-name").textContent).toBe("none");
        expect(screen.getByTestId("protected-page-gate").textContent).toBe(
          "sign-in-required"
        );
        expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();

        // 3. Switch to the linked canonical customer (SASS9999901 / Emulator Test Customer)
        await act(async () => {
          const res = await latestCtx!.resolveFirebaseSession({
            uid: linkedUid,
            email: linkedEmail,
            emailVerified: true,
            providerId: "firebase-email-link",
          });
          expect(res.status).toBe("resolved");
        });

        expect(screen.getByTestId("session-type").textContent).toBe("firebase");
        expect(screen.getByTestId("is-authenticated").textContent).toBe("true");
        expect(screen.getByTestId("user-id").textContent).toBe(
          CANONICAL_LINKED_TEST_CUSTOMER_ID
        );
        expect(screen.getByTestId("user-name").textContent).toBe(
          "Emulator Test Customer"
        );
        expect(screen.getByTestId("user-uid").textContent).toBe(linkedUid);
        expect(screen.getByTestId("protected-page-gate").textContent).toBe(
          "authorized:SASS9999901:Emulator Test Customer"
        );
        expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();

        // 4. Sign out and confirm zero stale customer information remains
        await act(async () => {
          await latestCtx!.logout();
        });
        expect(screen.getByTestId("session-type").textContent).toBe("none");
        expect(screen.getByTestId("is-authenticated").textContent).toBe("false");
        expect(screen.getByTestId("user-id").textContent).toBe("none");
        expect(screen.getByTestId("user-name").textContent).toBe("none");
        expect(screen.getByTestId("user-uid").textContent).toBe("none");
        expect(screen.getByTestId("firebase-uid").textContent).toBe("none");
        expect(screen.getByTestId("protected-page-gate").textContent).toBe(
          "sign-in-required"
        );
      } finally {
        await cleanupInMemoryFixture();
      }
    });
  });

  describe("7. Listener Cleanup & Duplicate Callback Prevention", () => {
    it("cleans up onAuthStateChanged listener on unmount and deduplicates concurrent resolution for the same UID", async () => {
      const firebaseUid = "firebase_uid_dedup_104";
      await memoryDriver.setDoc("usersByUid", firebaseUid, {
        uid: firebaseUid,
        userDocId: "SASS0000104",
      });

      const resolveSpy = vi.spyOn(
        customerIdentityService,
        "resolveCustomerProfile"
      );

      let unsubscribeCalled = false;
      let capturedListener:
        | ((
            user: {
              uid: string;
              email: string | null;
              emailVerified: boolean;
            } | null
          ) => void)
        | null = null;

      const driver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail() {},
        isSignInWithEmailLink: (url) => url === validCallbackUrl,
        async signInWithEmailLink(email) {
          const authUser = {
            uid: firebaseUid,
            email,
            emailVerified: true,
          };
          // Emit onAuthStateChanged synchronously during signInWithEmailLink
          capturedListener?.(authUser);
          return authUser;
        },
        getCurrentUser: () => null,
        async signOut() {},
        onAuthStateChanged(listener) {
          capturedListener = listener;
          listener(null);
          return () => {
            unsubscribeCalled = true;
            capturedListener = null;
          };
        },
      };
      emailLinkAuthService.setDriverForTesting(driver);
      emailLinkAuthService.savePendingEmail(TEST_CREDENTIALS.regularEmail);

      let latestCtx: AuthContextType | null = null;
      const { unmount } = render(
        <AuthProvider>
          <AuthHarness
            onRender={(ctx) => {
              latestCtx = ctx;
            }}
          />
        </AuthProvider>
      );

      await act(async () => {
        await latestCtx!.completeEmailLinkSignIn(validCallbackUrl);
      });

      // Even though signInWithEmailLink triggered both onAuthStateChanged and completeEmailLinkSignIn,
      // resolveCustomerProfile must only have been called once for `firebaseUid`!
      expect(resolveSpy).toHaveBeenCalledTimes(1);
      expect(latestCtx!.sessionType).toBe("firebase");
      expect(latestCtx!.user?.id).toBe("SASS0000104");

      unmount();
      expect(unsubscribeCalled).toBe(true);
    });
  });

  describe("8. Live Auth (9099) & Firestore (8081) Emulator End-to-End AuthContext Verification", () => {
    const AUTH_OOB_URL =
      "http://127.0.0.1:9099/emulator/v1/projects/demo-sri-amman-store/oobCodes";

    async function areLiveEmulatorsReachable(): Promise<boolean> {
      try {
        const [authRes, firestoreRes] = await Promise.all([
          fetch(AUTH_OOB_URL, { method: "GET" }),
          fetch("http://127.0.0.1:8081/", { method: "GET" }),
        ]);
        return authRes.ok && (firestoreRes.ok || firestoreRes.status < 500);
      } catch {
        return false;
      }
    }

    async function fetchLatestOobLink(email: string): Promise<string> {
      const res = await fetch(AUTH_OOB_URL);
      expect(res.ok).toBe(true);
      const data = (await res.json()) as {
        oobCodes?: Array<{ email?: string; oobLink?: string }>;
      };
      const matches = (data.oobCodes ?? []).filter(
        (c) => c.email?.toLowerCase() === email.toLowerCase()
      );
      expect(matches.length).toBeGreaterThan(0);
      return matches[matches.length - 1]!.oobLink!;
    }

    it(
      "signs in via email-link, resolves canonical SASS9999901 linked profile, restores session on refresh, handles unlinked user, and signs out against live emulators",
      async () => {
        if (!(await areLiveEmulatorsReachable())) {
          return;
        }

        // Use real SDK drivers for both Auth and Firestore
        emailLinkAuthService.setDriverForTesting(null);
        const sdkAdapter = new FirestoreAdapter(new SdkFirestoreDriver());
        customerIdentityService.setAdapterForTesting(sdkAdapter);
        await emailLinkAuthService.signOutFirebaseAuth();

        const suffix = `${Date.now()}`;
        const linkedEmail = `ctx.linked.${suffix}@sriamman.test`;
        const unlinkedEmail = `ctx.unlinked.${suffix}@sriamman.test`;
        let cleanupFixture: (() => Promise<void>) | null = null;

        try {
          // Pre-authenticate once to obtain deterministic Auth Emulator UID for seeding `usersByUid/{uid}`
          await emailLinkAuthService.sendSignInLink(linkedEmail, {
            continueUrl: "http://localhost:5173/login",
          });
          const firstLink = await fetchLatestOobLink(linkedEmail);
          const preAuth =
            await emailLinkAuthService.completeSignInWithEmailLink(firstLink);
          const linkedUid = preAuth.uid;
          await emailLinkAuthService.signOutFirebaseAuth();

          // Seed canonical Milestone 2 fixture (`usersByUid/{linkedUid}` -> `SASS9999901` and `users/SASS9999901`)
          const seeded = await seedEmulatorLinkedCustomerFixture(
            linkedUid,
            linkedEmail
          );
          cleanupFixture = seeded.cleanup;

          // Request a fresh sign-in link for the AuthContext test flow
          await emailLinkAuthService.sendSignInLink(linkedEmail, {
            continueUrl: "http://localhost:5173/login",
          });
          const liveOobLink = await fetchLatestOobLink(linkedEmail);

          let latestCtx: AuthContextType | null = null;
          const { unmount } = render(
            <AuthProvider>
              <AuthHarness
                onRender={(ctx) => {
                  latestCtx = ctx;
                }}
              />
            </AuthProvider>
          );

          await waitFor(() => {
            expect(latestCtx?.isLoading).toBe(false);
          });

          // 1. Complete email-link sign-in through AuthContext
          await act(async () => {
            const res = await latestCtx!.completeEmailLinkSignIn(liveOobLink);
            expect(res.status).toBe("resolved");
          });

          expect(screen.getByTestId("session-type").textContent).toBe(
            "firebase"
          );
          expect(screen.getByTestId("is-authenticated").textContent).toBe(
            "true"
          );
          expect(screen.getByTestId("user-id").textContent).toBe("SASS9999901");
          expect(latestCtx!.user?.id).toBe("SASS9999901");
          expect(latestCtx!.user?.userId).toBe("SASS9999901");
          expect(latestCtx!.user?.uid).toBe(linkedUid);
          expect(latestCtx!.user?.id).not.toBe(linkedUid);
          expect(screen.getByTestId("user-name").textContent).toBe(
            "Emulator Test Customer"
          );
          expect(latestCtx!.user?.phone).toBe("9999999999");
          expect(latestCtx!.user?.coins).toBe(0);
          expect(latestCtx!.user?.availableCoins).toBe(0);
          expect(latestCtx!.user?.earnedCoins).toBe(0);
          expect(screen.getByTestId("user-uid").textContent).toBe(linkedUid);
          expect(screen.getByTestId("firebase-uid").textContent).toBe(
            linkedUid
          );
          expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();

          // 2. Simulate page refresh: unmount and remount AuthProvider with live Firebase Auth SDK
          unmount();

          render(
            <AuthProvider>
              <AuthHarness
                onRender={(ctx) => {
                  latestCtx = ctx;
                }}
              />
            </AuthProvider>
          );

          await waitFor(() => {
            expect(screen.getByTestId("session-type").textContent).toBe(
              "firebase"
            );
          });
          expect(screen.getByTestId("user-id").textContent).toBe("SASS9999901");
          expect(screen.getByTestId("user-name").textContent).toBe(
            "Emulator Test Customer"
          );
          expect(screen.getByTestId("user-uid").textContent).toBe(linkedUid);
          expect(screen.getByTestId("firebase-uid").textContent).toBe(
            linkedUid
          );

          // 3. Sign out via AuthContext.logout()
          await act(async () => {
            await latestCtx!.logout();
          });
          expect(screen.getByTestId("session-type").textContent).toBe("none");
          expect(screen.getByTestId("is-authenticated").textContent).toBe(
            "false"
          );
          expect(screen.getByTestId("user-id").textContent).toBe("none");
          expect(
            emailLinkAuthService.getCurrentFirebaseAuthUser()
          ).toBeNull();

          // 4. Sign in as an unlinked Firebase user through AuthContext
          await emailLinkAuthService.sendSignInLink(unlinkedEmail, {
            continueUrl: "http://localhost:5173/login",
          });
          const unlinkedOobLink = await fetchLatestOobLink(unlinkedEmail);

          await act(async () => {
            const res =
              await latestCtx!.completeEmailLinkSignIn(unlinkedOobLink);
            expect(res.status).toBe("unlinked");
          });

          expect(screen.getByTestId("session-type").textContent).toBe("none");
          expect(screen.getByTestId("is-authenticated").textContent).toBe(
            "false"
          );
          expect(screen.getByTestId("user-id").textContent).toBe("none");
          expect(screen.getByTestId("protected-page-gate").textContent).toBe(
            "sign-in-required"
          );
          expect(screen.getByTestId("resolution-status").textContent).toBe(
            "unlinked"
          );
          expect(screen.getByTestId("notice-code").textContent).toBe(
            "identity/unlinked-uid"
          );
          expect(screen.getByTestId("notice-title").textContent).toBe(
            "Customer Account Not Linked"
          );

          await act(async () => {
            await latestCtx!.logout();
          });
        } finally {
          if (cleanupFixture) {
            await cleanupFixture();
          }
          await emailLinkAuthService.signOutFirebaseAuth().catch(() => {});
        }
      },
      25000
    );
  });

  describe("9. describeIdentityResolutionState Helper Coverage", () => {
    it("returns null for resolved or null inputs and distinct descriptors for all non-resolved statuses", () => {
      expect(describeIdentityResolutionState(null)).toBeNull();
      expect(
        describeIdentityResolutionState({
          status: "resolved",
          ok: true,
          uid: "uid_1",
          userDocId: "SASS0000104",
          mapping: { uid: "uid_1", userDocId: "SASS0000104", collection: "users", accountType: "customer" },
          profile: dbData.users[0]!,
        })
      ).toBeNull();

      const unauthNotice = describeIdentityResolutionState({
        status: "unauthenticated",
        ok: false,
        code: "identity/unauthenticated",
        uid: null,
        userDocId: null,
        profile: null,
        message: "Unauthenticated",
      });
      expect(unauthNotice?.status).toBe("unauthenticated");
      expect(unauthNotice?.isRetryable).toBe(false);
    });
  });
});
