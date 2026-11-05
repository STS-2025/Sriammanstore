import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PhoneVerificationModal } from "../components/auth/PhoneVerificationModal";

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  initRecaptcha: vi.fn(),
  confirm: vi.fn(),
  persist: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "ONCUS0000042", userId: "ONCUS0000042", uid: "customer-uid-1" },
    refreshUser: mocks.refresh,
  }),
}));

vi.mock("../services/phoneVerificationService", () => ({
  phoneVerificationService: {
    clearRecaptcha: vi.fn(),
    initVisibleRecaptcha: mocks.initRecaptcha.mockImplementation(async (_container, callbacks) => {
      callbacks.onSolved();
      return {};
    }),
    getActiveVerifier: vi.fn(() => ({})),
    sendVerificationOtp: mocks.send,
    confirmVerificationOtp: mocks.confirm,
    persistVerifiedPhone: mocks.persist,
  },
  formatToE164: (countryCode: string, nationalNumber: string) =>
    `${countryCode}${nationalNumber.replace(/\D/g, "")}`,
  validatePhoneNumber: () => ({ valid: true }),
  mapPhoneAuthError: (error: Error) => error.message,
}));

vi.mock("../services/notificationService", () => ({
  notificationService: { createPhoneVerifiedNotification: vi.fn(async () => undefined) },
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe("PhoneVerificationModal synchronization retry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.send.mockResolvedValue({});
    mocks.confirm.mockResolvedValue({ success: true, phoneNumber: "+919876543210" });
    mocks.persist
      .mockRejectedValueOnce(new Error("temporary callable failure"))
      .mockResolvedValue({});
    mocks.refresh.mockResolvedValue(undefined);
  });

  it("reuses Firebase's confirmed E.164 number and retries without sending another OTP", async () => {
    render(<PhoneVerificationModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} />);
    await waitFor(() => expect(mocks.initRecaptcha).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText("Mobile Number"), { target: { value: "9876543210" } });
    fireEvent.click(screen.getByRole("button", { name: "Send OTP" }));
    await screen.findByLabelText("Enter 6-Digit OTP Code");

    fireEvent.change(screen.getByLabelText("Enter 6-Digit OTP Code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Verify OTP" }));
    await screen.findByRole("button", { name: "Retry Profile Synchronization" });

    fireEvent.click(screen.getByRole("button", { name: "Retry Profile Synchronization" }));

    await waitFor(() => expect(mocks.persist).toHaveBeenCalledTimes(2));
    expect(mocks.persist).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ verifiedPhone: "+919876543210" }),
    );
    expect(mocks.persist).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ verifiedPhone: "+919876543210" }),
    );
    expect(mocks.send).toHaveBeenCalledTimes(1);
    expect(mocks.confirm).toHaveBeenCalledTimes(1);
  });
});
