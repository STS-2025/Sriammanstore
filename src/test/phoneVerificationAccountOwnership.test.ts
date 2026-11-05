import { afterEach, describe, expect, it, vi } from "vitest";
import type { Auth } from "firebase/auth";
import type { FirebaseApp } from "firebase/app";
import { authManager } from "../services/authAdapter";
import { phoneVerificationService } from "../services/phoneVerificationService";

const authMock = vi.hoisted(() => ({
  pendingPhone: "",
  user: {
    uid: "signed-in-customer-uid",
    phoneNumber: "+919811122233" as string | null,
    email: "customer@example.test",
    emailVerified: true,
    isAnonymous: false,
    providerData: [{ providerId: "phone" }],
  },
  auth: { currentUser: null as unknown },
  linkWithPhoneNumber: vi.fn(),
  updatePhoneNumber: vi.fn(),
}));
authMock.auth.currentUser = authMock.user;

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  class MockPhoneAuthProvider {
    constructor(_auth: unknown) {}
    async verifyPhoneNumber(phone: string) {
      authMock.pendingPhone = phone;
      return "verification-id";
    }
    static credential(_verificationId: string, code: string) {
      return { phoneNumber: authMock.pendingPhone, code };
    }
  }
  return {
    ...actual,
    getAuth: () => authMock.auth,
    PhoneAuthProvider: MockPhoneAuthProvider,
    linkWithPhoneNumber: authMock.linkWithPhoneNumber,
    updatePhoneNumber: authMock.updatePhoneNumber,
  };
});

describe("authenticated phone number replacement", () => {
  function useMockProductionAuth() {
    vi.spyOn(authManager.getProductionAdapter(), "getAuthInstance").mockReturnValue({
      auth: authMock.auth as unknown as Auth,
      app: {} as FirebaseApp,
      projectId: "sri-amman-smart-store",
    });
  }

  afterEach(() => {
    vi.restoreAllMocks();
    authManager.resetMode();
    authMock.user.phoneNumber = "+919811122233";
    authMock.user.providerData = [{ providerId: "phone" }];
    authMock.auth.currentUser = authMock.user;
    authMock.pendingPhone = "";
    authMock.linkWithPhoneNumber.mockReset();
    authMock.updatePhoneNumber.mockReset();
  });

  it("updates the current Firebase UID with a different verified number", async () => {
    authManager.setMode("production");
    useMockProductionAuth();
    authMock.updatePhoneNumber.mockImplementation(
      async (user: typeof authMock.user, credential: { phoneNumber: string }) => {
        user.phoneNumber = credential.phoneNumber;
      },
    );

    const session = await phoneVerificationService.sendVerificationOtp(
      "+919876543210",
      {} as never,
    );
    expect(session.kind).toBe("update");
    expect(authMock.linkWithPhoneNumber).not.toHaveBeenCalled();
    const result = await phoneVerificationService.confirmVerificationOtp(session, "123456");

    expect(result).toEqual({ success: true, phoneNumber: "+919876543210" });
    expect(authMock.auth.currentUser).toBe(authMock.user);
    expect(authMock.user.uid).toBe("signed-in-customer-uid");
    expect(authMock.user.phoneNumber).toBe("+919876543210");
  });

  it("rejects a phone already owned by another Firebase Auth account without switching users", async () => {
    authManager.setMode("production");
    useMockProductionAuth();
    authMock.updatePhoneNumber.mockRejectedValue({ code: "auth/credential-already-in-use" });
    const session = await phoneVerificationService.sendVerificationOtp(
      "+919876543210",
      {} as never,
    );

    await expect(
      phoneVerificationService.confirmVerificationOtp(session, "123456"),
    ).rejects.toMatchObject({ code: "auth/credential-already-in-use" });
    expect(authMock.auth.currentUser).toBe(authMock.user);
    expect(authMock.user.uid).toBe("signed-in-customer-uid");
    expect(authMock.user.phoneNumber).toBe("+919811122233");
  });

  it("leaves the existing phone unchanged when OTP verification fails", async () => {
    authManager.setMode("production");
    useMockProductionAuth();
    authMock.updatePhoneNumber.mockRejectedValue({ code: "auth/invalid-verification-code" });
    const session = await phoneVerificationService.sendVerificationOtp(
      "+919876543210",
      {} as never,
    );

    await expect(
      phoneVerificationService.confirmVerificationOtp(session, "000000"),
    ).rejects.toMatchObject({ code: "auth/invalid-verification-code" });
    expect(authMock.user.phoneNumber).toBe("+919811122233");
  });

  it("links a phone credential when the current account has no phone provider", async () => {
    authManager.setMode("production");
    useMockProductionAuth();
    authMock.user.phoneNumber = null;
    authMock.user.providerData = [];
    const confirmation = {
      confirm: vi.fn(async () => {
        authMock.user.phoneNumber = "+919876543210";
        return { user: authMock.user };
      }),
    };
    authMock.linkWithPhoneNumber.mockResolvedValue(confirmation);

    const session = await phoneVerificationService.sendVerificationOtp(
      "+919876543210",
      {} as never,
    );
    expect(session.kind).toBe("link");
    expect(authMock.updatePhoneNumber).not.toHaveBeenCalled();
    const result = await phoneVerificationService.confirmVerificationOtp(session, "123456");

    expect(result).toEqual({ success: true, phoneNumber: "+919876543210" });
    expect(authMock.auth.currentUser).toBe(authMock.user);
  });

  it("rejects a phone already linked to another Auth account without signing into it", async () => {
    authManager.setMode("production");
    useMockProductionAuth();
    authMock.user.phoneNumber = null;
    authMock.user.providerData = [];
    authMock.linkWithPhoneNumber.mockRejectedValue({
      code: "auth/credential-already-in-use",
    });

    await expect(
      phoneVerificationService.sendVerificationOtp("+919876543210", {} as never),
    ).rejects.toMatchObject({ code: "auth/credential-already-in-use" });
    expect(authMock.auth.currentUser).toBe(authMock.user);
    expect(authMock.user.uid).toBe("signed-in-customer-uid");
  });

  it("rejects if the active UID changes while the linking OTP is being confirmed", async () => {
    authManager.setMode("production");
    useMockProductionAuth();
    authMock.user.phoneNumber = null;
    authMock.user.providerData = [];
    const otherUser = { ...authMock.user, uid: "different-uid", phoneNumber: "+919876543210" };
    authMock.linkWithPhoneNumber.mockResolvedValue({
      confirm: vi.fn(async () => {
        authMock.auth.currentUser = otherUser;
        return { user: authMock.user };
      }),
    });

    const session = await phoneVerificationService.sendVerificationOtp(
      "+919876543210",
      {} as never,
    );
    await expect(
      phoneVerificationService.confirmVerificationOtp(session, "123456"),
    ).rejects.toThrow(/different account/);
    expect(authMock.auth.currentUser).toBe(otherUser);
  });
});
