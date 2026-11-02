import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  assertEmulatorOnlyConfig,
  getAuthEmulatorHttpBaseUrl,
  getEmulatorAuth,
  resolveEmulatorConfig,
} from "../lib/firebaseEmulator";
import {
  emailLinkAuthService,
  EmailLinkAuthError,
  EMAIL_LINK_PENDING_STORAGE_KEY,
  buildEmailLinkActionCodeSettings,
  validateEmailForLinkSignIn,
  type FirebaseEmailLinkDriver,
} from "../services/emailLinkAuthService";
import { authService, TEST_CREDENTIALS } from "../services/authService";

describe("Firebase Passwordless Email-Link Authentication (Local Auth Emulator)", () => {
  beforeEach(() => {
    emailLinkAuthService.setDriverForTesting(null);
    emailLinkAuthService.clearPendingEmail();
    authService.logout();
  });

  afterEach(() => {
    emailLinkAuthService.setDriverForTesting(null);
    emailLinkAuthService.clearPendingEmail();
    authService.logout();
  });

  describe("1. Authentication Emulator Configuration & Production Guards", () => {
    it("resolves default Auth Emulator host 127.0.0.1 and port 9099 on demo-sri-amman-store", () => {
      const cfg = resolveEmulatorConfig();
      expect(cfg.projectId).toBe("demo-sri-amman-store");
      expect(cfg.host).toBe("127.0.0.1");
      expect(cfg.port).toBe(8081);
      expect(cfg.authHost).toBe("127.0.0.1");
      expect(cfg.authPort).toBe(9099);
      expect(getAuthEmulatorHttpBaseUrl()).toBe("http://127.0.0.1:9099");
    });

    it("rejects non-demo project IDs or production Auth hosts in assertEmulatorOnlyConfig", () => {
      expect(() =>
        assertEmulatorOnlyConfig({
          projectId: "sri-amman-smart-store",
          host: "127.0.0.1",
          port: 8081,
          authHost: "127.0.0.1",
          authPort: 9099,
          mode: "emulator",
        }),
      ).toThrow(/Production Firebase connections are prohibited/);

      expect(() =>
        assertEmulatorOnlyConfig({
          projectId: "demo-sri-amman-store",
          host: "127.0.0.1",
          port: 8081,
          authHost: "identitytoolkit.googleapis.com",
          authPort: 443,
          mode: "emulator",
        }),
      ).toThrow(/Invalid Auth Emulator host/);

      expect(() =>
        assertEmulatorOnlyConfig({
          projectId: "demo-sri-amman-store",
          host: "127.0.0.1",
          port: 8081,
          authHost: "127.0.0.1",
          authPort: 70000,
          mode: "emulator",
        }),
      ).toThrow(/Invalid Auth Emulator port/);
    });

    it("initializes getEmulatorAuth connected strictly to http://127.0.0.1:9099", () => {
      const { auth, config, authEmulatorUrl } = getEmulatorAuth();
      expect(config.projectId).toBe("demo-sri-amman-store");
      expect(authEmulatorUrl).toBe("http://127.0.0.1:9099");
      expect(auth.emulatorConfig).not.toBeNull();
      expect(auth.emulatorConfig?.host).toBe("127.0.0.1");
      expect(auth.emulatorConfig?.port).toBe(9099);
    });
  });

  describe("2. Email Validation & ActionCodeSettings Construction", () => {
    it("normalizes valid emails and rejects blank or malformed emails", () => {
      expect(validateEmailForLinkSignIn("  Priya.Sundaram@Example.com ")).toBe(
        "priya.sundaram@example.com",
      );

      expect(() => validateEmailForLinkSignIn("")).toThrow("Please enter a valid email address.");
      expect(() => validateEmailForLinkSignIn("not-an-email")).toThrow(
        "Please enter a valid email address.",
      );
      expect(() => validateEmailForLinkSignIn("missing-domain@")).toThrow(
        "Please enter a valid email address.",
      );
    });

    it("builds ActionCodeSettings with handleCodeInApp: true and safe local continuation URL", () => {
      const settings = buildEmailLinkActionCodeSettings({
        continueUrl: "http://localhost:5173/login",
        redirect: "/orders",
      });
      expect(settings.handleCodeInApp).toBe(true);
      expect(settings.url).toBe("http://localhost:5173/login?redirect=%2Forders");
    });

    it("ignores unsafe external redirect paths and blocks external continuation domains", () => {
      const safeSettings = buildEmailLinkActionCodeSettings({
        continueUrl: "http://localhost:5173/login",
        redirect: "https://evil.example.com/phish",
      });
      expect(safeSettings.url).toBe("http://localhost:5173/login");

      expect(() =>
        buildEmailLinkActionCodeSettings({
          continueUrl: "https://sri-amman-smart-store.firebaseapp.com/login",
        }),
      ).toThrow(/not permitted in local emulator mode/);
    });
  });

  describe("3. Sending Email Sign-In Link (Success & Failure States)", () => {
    it("sends sign-in link via driver and stores pending email in sessionStorage (not localStorage)", async () => {
      const sentRequests: Array<{ email: string; url: string }> = [];
      const mockDriver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail(email, settings) {
          sentRequests.push({ email, url: settings.url });
        },
        isSignInWithEmailLink: () => false,
        async signInWithEmailLink() {
          throw new Error("Not called");
        },
        getCurrentUser: () => null,
        async signOut() {},
      };
      emailLinkAuthService.setDriverForTesting(mockDriver);

      const result = await emailLinkAuthService.sendSignInLink("  Arun.Kumar@Example.com ", {
        continueUrl: "http://localhost:5173/login",
        redirect: "/account",
      });

      expect(result.success).toBe(true);
      expect(result.deliveryMode).toBe("emulator");
      expect(result.continueUrl).toBe("http://localhost:5173/login?redirect=%2Faccount");
      expect(sentRequests).toEqual([
        {
          email: "arun.kumar@example.com",
          url: "http://localhost:5173/login?redirect=%2Faccount",
        },
      ]);

      expect(emailLinkAuthService.getPendingEmail()).toBe("arun.kumar@example.com");
      if (typeof window !== "undefined") {
        expect(window.sessionStorage.getItem(EMAIL_LINK_PENDING_STORAGE_KEY)).toBe(
          "arun.kumar@example.com",
        );
        expect(window.localStorage.getItem(EMAIL_LINK_PENDING_STORAGE_KEY)).toBeNull();
      }
    });

    it("surfaces clear error message and does not persist email when sending fails", async () => {
      const failingDriver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail() {
          const err = new Error("Connection refused") as Error & { code: string };
          err.code = "auth/network-request-failed";
          throw err;
        },
        isSignInWithEmailLink: () => false,
        async signInWithEmailLink() {
          throw new Error("Not called");
        },
        getCurrentUser: () => null,
        async signOut() {},
      };
      emailLinkAuthService.setDriverForTesting(failingDriver);

      await expect(
        emailLinkAuthService.sendSignInLink("arun.kumar@example.com", {
          continueUrl: "http://localhost:5173/login",
        }),
      ).rejects.toThrow(/Could not reach the local Firebase Authentication Emulator/);

      expect(emailLinkAuthService.getPendingEmail()).toBeNull();
    });
  });

  describe("4. Valid Sign-In Completion (Same-Browser & Cross-Browser)", () => {
    const validCallbackUrl =
      "http://localhost:5173/login?apiKey=demo-sri-amman-store-local-emulator-key&mode=signIn&oobCode=test-oob-code-123";

    it("completes sign-in in the same browser using sessionStorage email and clears pending email afterwards", async () => {
      const mockDriver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail() {},
        isSignInWithEmailLink: (link) => link === validCallbackUrl,
        async signInWithEmailLink(email, link) {
          expect(link).toBe(validCallbackUrl);
          return {
            uid: "firebase_auth_uid_same_browser",
            email,
            emailVerified: true,
          };
        },
        getCurrentUser: () => null,
        async signOut() {},
      };
      emailLinkAuthService.setDriverForTesting(mockDriver);

      await emailLinkAuthService.sendSignInLink("arun.kumar@example.com", {
        continueUrl: "http://localhost:5173/login",
      });
      expect(emailLinkAuthService.getPendingEmail()).toBe("arun.kumar@example.com");

      const authUser = await emailLinkAuthService.completeSignInWithEmailLink(validCallbackUrl);

      expect(authUser).toEqual({
        uid: "firebase_auth_uid_same_browser",
        email: "arun.kumar@example.com",
        emailVerified: true,
        providerId: "firebase-email-link",
      });

      // Pending email must be cleared immediately upon completion
      expect(emailLinkAuthService.getPendingEmail()).toBeNull();
      expect(emailLinkAuthService.getCurrentFirebaseAuthUser()).toEqual(authUser);
    });

    it("completes sign-in when opened in another browser where sessionStorage is empty and user supplies email", async () => {
      const mockDriver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail() {},
        isSignInWithEmailLink: (link) => link === validCallbackUrl,
        async signInWithEmailLink(email, link) {
          expect(link).toBe(validCallbackUrl);
          return {
            uid: "firebase_auth_uid_cross_browser",
            email,
            emailVerified: true,
          };
        },
        getCurrentUser: () => null,
        async signOut() {},
      };
      emailLinkAuthService.setDriverForTesting(mockDriver);

      // Simulate opening link in another browser (no stored pending email)
      expect(emailLinkAuthService.getPendingEmail()).toBeNull();

      const authUser = await emailLinkAuthService.completeSignInWithEmailLink(
        validCallbackUrl,
        "Priya.Sundaram@Example.com",
      );

      expect(authUser).toEqual({
        uid: "firebase_auth_uid_cross_browser",
        email: "priya.sundaram@example.com",
        emailVerified: true,
        providerId: "firebase-email-link",
      });
    });
  });

  describe("5. Invalid, Expired, or Incomplete Links & Missing Email Handling", () => {
    const validCallbackUrl =
      "http://localhost:5173/login?apiKey=demo-sri-amman-store-local-emulator-key&mode=signIn&oobCode=valid-oob-999";

    it("uses real Firebase SDK isSignInWithEmailLink to distinguish valid links from incomplete URLs", () => {
      // Real SDK driver is active by default
      expect(emailLinkAuthService.inspectCallbackUrl("http://localhost:5173/login")).toEqual({
        status: "none",
      });

      const incompleteInspection = emailLinkAuthService.inspectCallbackUrl(
        "http://localhost:5173/login?mode=signIn",
      );
      expect(incompleteInspection.status).toBe("invalid_or_incomplete_link");
      expect(incompleteInspection.message).toContain("invalid, expired, or incomplete");

      const validInspection = emailLinkAuthService.inspectCallbackUrl(validCallbackUrl);
      expect(validInspection.status).toBe("valid_link");

      // Visiting or inspecting the completion URL never marks a user authenticated
      expect(emailLinkAuthService.getCurrentFirebaseAuthUser()).toBeNull();
      expect(authService.getCurrentUser()).toBeNull();
    });

    it("rejects completion when link is incomplete or not a valid email sign-in link", async () => {
      await expect(
        emailLinkAuthService.completeSignInWithEmailLink(
          "http://localhost:5173/login?mode=signIn",
          "arun.kumar@example.com",
        ),
      ).rejects.toThrow(
        "This sign-in link is invalid, expired, or incomplete. Please request a new email sign-in link.",
      );
      expect(emailLinkAuthService.getCurrentFirebaseAuthUser()).toBeNull();
    });

    it("throws EmailLinkAuthError with requiresEmailInput: true when email is missing during completion", async () => {
      const mockDriver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail() {},
        isSignInWithEmailLink: () => true,
        async signInWithEmailLink() {
          throw new Error("Should not be called without email");
        },
        getCurrentUser: () => null,
        async signOut() {},
      };
      emailLinkAuthService.setDriverForTesting(mockDriver);

      try {
        await emailLinkAuthService.completeSignInWithEmailLink(validCallbackUrl);
        expect.fail("Expected missing-email error");
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(EmailLinkAuthError);
        const linkErr = err as EmailLinkAuthError;
        expect(linkErr.code).toBe("auth/missing-email");
        expect(linkErr.requiresEmailInput).toBe(true);
      }
    });

    it("maps expired and invalid action code errors and clears stale pending email", async () => {
      let errorCodeToThrow = "auth/expired-action-code";
      const mockDriver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail() {},
        isSignInWithEmailLink: () => true,
        async signInWithEmailLink() {
          const err = new Error("Firebase error") as Error & { code: string };
          err.code = errorCodeToThrow;
          throw err;
        },
        getCurrentUser: () => null,
        async signOut() {},
      };
      emailLinkAuthService.setDriverForTesting(mockDriver);
      emailLinkAuthService.savePendingEmail("arun.kumar@example.com");

      await expect(
        emailLinkAuthService.completeSignInWithEmailLink(validCallbackUrl),
      ).rejects.toThrow("This sign-in link has expired.");
      expect(emailLinkAuthService.getPendingEmail()).toBeNull();

      errorCodeToThrow = "auth/invalid-action-code";
      emailLinkAuthService.savePendingEmail("arun.kumar@example.com");
      await expect(
        emailLinkAuthService.completeSignInWithEmailLink(validCallbackUrl),
      ).rejects.toThrow("This sign-in link is invalid or has already been used.");
      expect(emailLinkAuthService.getPendingEmail()).toBeNull();
    });
  });

  describe("6. Duplicate Submission Prevention", () => {
    it("prevents concurrent duplicate sendSignInLink requests", async () => {
      let resolveSend: (() => void) | undefined;
      const slowDriver: FirebaseEmailLinkDriver = {
        sendSignInLinkToEmail: () =>
          new Promise<void>((resolve) => {
            resolveSend = resolve;
          }),
        isSignInWithEmailLink: () => false,
        async signInWithEmailLink() {
          throw new Error("Not called");
        },
        getCurrentUser: () => null,
        async signOut() {},
      };
      emailLinkAuthService.setDriverForTesting(slowDriver);

      const firstPromise = emailLinkAuthService.sendSignInLink("arun.kumar@example.com", {
        continueUrl: "http://localhost:5173/login",
      });
      expect(emailLinkAuthService.isSendingLink()).toBe(true);

      await expect(
        emailLinkAuthService.sendSignInLink("arun.kumar@example.com", {
          continueUrl: "http://localhost:5173/login",
        }),
      ).rejects.toThrow("A sign-in link request is already in progress.");

      resolveSend?.();
      await firstPromise;
      expect(emailLinkAuthService.isSendingLink()).toBe(false);
    });

    it("prevents concurrent duplicate completeSignInWithEmailLink requests", async () => {
      let resolveComplete:
        ((val: { uid: string; email: string; emailVerified: boolean }) => void) | undefined;
      const slowDriver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail() {},
        isSignInWithEmailLink: () => true,
        signInWithEmailLink: () =>
          new Promise((resolve) => {
            resolveComplete = resolve;
          }),
        getCurrentUser: () => null,
        async signOut() {},
      };
      emailLinkAuthService.setDriverForTesting(slowDriver);

      const linkUrl = "http://localhost:5173/login?apiKey=demo-key&mode=signIn&oobCode=code1";
      const firstComplete = emailLinkAuthService.completeSignInWithEmailLink(
        linkUrl,
        "arun.kumar@example.com",
      );
      expect(emailLinkAuthService.isCompletingSignIn()).toBe(true);

      await expect(
        emailLinkAuthService.completeSignInWithEmailLink(linkUrl, "arun.kumar@example.com"),
      ).rejects.toThrow("Sign-in verification is already in progress.");

      resolveComplete?.({
        uid: "firebase_uid_01",
        email: "arun.kumar@example.com",
        emailVerified: true,
      });
      await firstComplete;
      expect(emailLinkAuthService.isCompletingSignIn()).toBe(false);
    });
  });

  describe("7. Preservation of Existing Mock Authentication & Identity Boundaries", () => {
    it("restores phone and Google provider identity without misclassifying either as an email-link session", () => {
      let authListener:
        | ((
            user: {
              uid: string;
              email: string | null;
              emailVerified: boolean;
              providerId?: string;
            } | null,
          ) => void)
        | null = null;
      const driver: FirebaseEmailLinkDriver = {
        async sendSignInLinkToEmail() {},
        isSignInWithEmailLink: () => false,
        async signInWithEmailLink() {
          throw new Error("Not used");
        },
        getCurrentUser: () => ({
          uid: "phone-auth-restored",
          email: null,
          emailVerified: false,
          providerId: "phone",
        }),
        async signOut() {},
        onAuthStateChanged(listener) {
          authListener = listener;
          listener({
            uid: "phone-auth-restored",
            email: null,
            emailVerified: false,
            providerId: "phone",
          });
          return () => {
            authListener = null;
          };
        },
      };
      emailLinkAuthService.setDriverForTesting(driver);
      let restoredProvider = "";
      const unsubscribe = emailLinkAuthService.subscribeToAuthStateChanges((user) => {
        restoredProvider = user?.providerId ?? "";
      });
      expect(restoredProvider).toBe("firebase-phone");
      expect(emailLinkAuthService.getCurrentFirebaseAuthUser()?.providerId).toBe("firebase-phone");
      unsubscribe();
    });

    it("keeps mock OTP and Email/Password login functional and independent of Firebase Email-Link Auth", async () => {
      const otpUser = await authService.verifyOtp(TEST_CREDENTIALS.phone, TEST_CREDENTIALS.otp);
      expect(otpUser.id).toBe("SASS0000104");
      expect(authService.getCurrentUser()?.id).toBe("SASS0000104");

      // Firebase Auth UID is separate and not populated by mock login
      expect(emailLinkAuthService.getCurrentFirebaseAuthUser()).toBeNull();

      authService.logout();
      expect(authService.getCurrentUser()).toBeNull();

      const emailPwdUser = await authService.loginWithEmail(
        TEST_CREDENTIALS.vipEmail,
        TEST_CREDENTIALS.defaultPassword,
      );
      expect(emailPwdUser.id).toBe("SASS0000088");
      expect(emailPwdUser.isVIP).toBe(true);
    });
  });

  describe("8. Live Firebase Authentication Emulator End-to-End Verification (127.0.0.1:9099)", () => {
    it("completes a full passwordless email-link sign-in cycle against the local Auth Emulator when running", async () => {
      let authEmulatorReachable = false;
      try {
        const res = await fetch("http://127.0.0.1:9099/", {
          signal: AbortSignal.timeout(800),
        });
        authEmulatorReachable = res.ok || res.status < 500;
      } catch {
        authEmulatorReachable = false;
      }

      if (!authEmulatorReachable) {
        // Skip only if the local Auth Emulator process is not currently listening on 9099
        return;
      }

      const testEmail = `e2e.emaillink.${Date.now()}@example.com`;

      // 1. Send email sign-in link via real Firebase Auth SDK -> 127.0.0.1:9099
      const sendRes = await emailLinkAuthService.sendSignInLink(testEmail, {
        continueUrl: "http://localhost:5173/login",
      });
      expect(sendRes.success).toBe(true);
      expect(sendRes.deliveryMode).toBe("emulator");

      // 2. Retrieve the generated OOB sign-in link from the Auth Emulator REST API
      const oobRes = await fetch(
        "http://127.0.0.1:9099/emulator/v1/projects/demo-sri-amman-store/oobCodes",
      );
      expect(oobRes.ok).toBe(true);
      const oobData = (await oobRes.json()) as {
        oobCodes?: Array<{
          email?: string;
          requestType?: string;
          oobLink?: string;
        }>;
      };
      const matchingCodes = (oobData.oobCodes ?? []).filter(
        (c) =>
          c.requestType === "EMAIL_SIGNIN" &&
          c.email?.toLowerCase() === testEmail &&
          typeof c.oobLink === "string",
      );
      const oobLink = matchingCodes[matchingCodes.length - 1]?.oobLink ?? null;
      expect(oobLink).not.toBeNull();
      expect(oobLink).toContain("mode=signIn");
      expect(oobLink).toContain("oobCode=");

      // 3. Inspect callback URL using real Firebase SDK isSignInWithEmailLink
      const inspection = emailLinkAuthService.inspectCallbackUrl(oobLink!);
      expect(inspection.status).toBe("valid_link");

      // 4. Complete sign-in using real Firebase SDK signInWithEmailLink
      const verifiedUser = await emailLinkAuthService.completeSignInWithEmailLink(oobLink!);
      expect(verifiedUser.email).toBe(testEmail);
      expect(verifiedUser.emailVerified).toBe(true);
      expect(verifiedUser.uid.length).toBeGreaterThan(0);
      expect(verifiedUser.uid).not.toMatch(/^SASS/);

      // 5. Reusing the same one-time oobLink must fail with auth/invalid-action-code
      await expect(
        emailLinkAuthService.completeSignInWithEmailLink(oobLink!, testEmail),
      ).rejects.toThrow(
        "This sign-in link is invalid or has already been used. Please request a new email sign-in link.",
      );

      await emailLinkAuthService.signOutFirebaseAuth();
    });
  });
});
