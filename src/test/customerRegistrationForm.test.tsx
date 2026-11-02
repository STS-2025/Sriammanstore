import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CustomerRegistrationForm } from "../components/auth/CustomerRegistrationForm";
import { authManager } from "../services/authAdapter";
import { authService } from "../services/authService";
import { customerIdentityService } from "../services/customerIdentityService";

const authState = vi.hoisted(() => ({
  mode: "production" as "emulator" | "production" | "mock",
  resolveFirebaseSession: vi.fn(),
  logout: vi.fn(),
}));

const mockNavigate = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    authMode: authState.mode,
    resolveFirebaseSession: authState.resolveFirebaseSession,
    logout: authState.logout,
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
}));

describe("CustomerRegistrationForm Component", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    authState.mode = "production";
    authState.resolveFirebaseSession.mockResolvedValue({
      status: "resolved",
      ok: true,
      profile: {
        id: "ONCUS0000104",
        userId: "ONCUS0000104",
        name: "Arun Kumar",
        email: "arun@example.com",
        phone: "+91 9876543210",
      },
    });
    mockNavigate.mockReset();
  });

  it("renders the full registration form fields without requiring phone OTP", () => {
    render(<CustomerRegistrationForm />);

    expect(screen.getByLabelText(/^full name/i)).toBeTruthy();
    expect(screen.getByLabelText(/^email address/i)).toBeTruthy();
    expect(screen.getByLabelText(/^password/i)).toBeTruthy();
    expect(screen.getByLabelText(/^confirm password/i)).toBeTruthy();
    expect(screen.getByLabelText(/^mobile number/i)).toBeTruthy();
    expect(screen.getByLabelText(/^date of birth/i)).toBeTruthy();
    expect(screen.getByLabelText(/^gender/i)).toBeTruthy();
    expect(screen.getByLabelText(/^referral code/i)).toBeTruthy();
    expect(screen.getByLabelText(/terms and conditions/i)).toBeTruthy();

    expect(screen.getByRole("button", { name: "Create Account" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeTruthy();

    // Verify phone OTP verification controls are NOT present
    expect(screen.queryByRole("button", { name: /continue with phone otp/i })).toBeNull();
    expect(screen.queryByLabelText(/six-digit verification code/i)).toBeNull();
  });

  it("shows inline errors when required fields are missing", async () => {
    render(<CustomerRegistrationForm />);

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText(/full name must be at least 2 characters/i)).toBeTruthy();
    expect(screen.getByText(/enter a valid email address/i)).toBeTruthy();
    expect(screen.getByText(/password must be at least 6 characters/i)).toBeTruthy();
    expect(screen.getByText(/enter a valid 10-digit mobile number/i)).toBeTruthy();
    expect(screen.getByText(/you must accept the terms and conditions/i)).toBeTruthy();
  });

  it("shows error when password and confirm password do not match", async () => {
    render(<CustomerRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/^full name/i), { target: { value: "Arun Kumar" } });
    fireEvent.change(screen.getByLabelText(/^email address/i), { target: { value: "arun@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "securePassword1" } });
    fireEvent.change(screen.getByLabelText(/^confirm password/i), { target: { value: "mismatchedPass" } });
    fireEvent.change(screen.getByLabelText(/^mobile number/i), { target: { value: "9876543210" } });
    fireEvent.click(screen.getByLabelText(/terms and conditions/i));

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText(/passwords do not match/i)).toBeTruthy();
  });

  it("completes full registration with email/password, profile provisioning in onlineCustomers, and session resolution", async () => {
    const createUserSpy = vi.spyOn(authManager, "createUserWithEmailAndPassword").mockResolvedValue({
      uid: "firebase-uid-new-123",
      email: "arun@example.com",
      emailVerified: false,
      providerId: "firebase-email",
    });

    const provisionSpy = vi.spyOn(customerIdentityService, "provisionCustomerAccount").mockResolvedValue({
      userDocId: "ONCUS0000105",
      profile: {
        id: "ONCUS0000105",
        userId: "ONCUS0000105",
        uid: "firebase-uid-new-123",
        name: "Arun Kumar",
        email: "arun@example.com",
        phone: "+91 9876543210",
        smartCoins: 0,
        coins: 0,
        availableCoins: 0,
        earnedCoins: 0,
        isVIP: false,
        referralCode: "ONCUS0000105",
        createdAt: "2026-10-28T00:00:00.000Z",
        dob: "1994-08-15",
        gender: "male",
      },
    });

    render(<CustomerRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/^full name/i), { target: { value: "Arun Kumar" } });
    fireEvent.change(screen.getByLabelText(/^email address/i), { target: { value: "arun@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "securePassword123" } });
    fireEvent.change(screen.getByLabelText(/^confirm password/i), { target: { value: "securePassword123" } });
    fireEvent.change(screen.getByLabelText(/^mobile number/i), { target: { value: "9876543210" } });
    fireEvent.change(screen.getByLabelText(/^date of birth/i), { target: { value: "1994-08-15" } });
    fireEvent.change(screen.getByLabelText(/^gender/i), { target: { value: "male" } });
    fireEvent.change(screen.getByLabelText(/^referral code/i), { target: { value: "ONCUS0000010" } });
    fireEvent.click(screen.getByLabelText(/terms and conditions/i));

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    await waitFor(() => {
      expect(createUserSpy).toHaveBeenCalledWith("arun@example.com", "securePassword123");
    });

    await waitFor(() => {
      expect(provisionSpy).toHaveBeenCalledWith({
        uid: "firebase-uid-new-123",
        email: "arun@example.com",
        fullName: "Arun Kumar",
        number: "9876543210",
        countryCode: "+91",
        phoneVerified: false,
        dob: "1994-08-15",
        gender: "male",
        referredBy: "ONCUS0000010",
      });
    });

    // Verify dob was passed strictly as dob (never birthday)
    const callArgs = provisionSpy.mock.calls[0]?.[0];
    if (callArgs) {
      expect(callArgs.dob).toBe("1994-08-15");
      expect("birthday" in callArgs).toBe(false);
    }

    await waitFor(() => {
      expect(authState.resolveFirebaseSession).toHaveBeenCalledWith(
        {
          uid: "firebase-uid-new-123",
          email: "arun@example.com",
          emailVerified: false,
          phoneNumber: null,
          providerId: "firebase-email",
        },
        { force: true },
      );
    });

    expect(await screen.findByText(/Welcome, Arun Kumar! Your customer account is ready\./i)).toBeTruthy();
  });

  it("handles duplicate email error gracefully and offers login guidance", async () => {
    vi.spyOn(authManager, "createUserWithEmailAndPassword").mockRejectedValue(
      new Error("An account may already exist for this email. Try signing in or password recovery."),
    );

    render(<CustomerRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/^full name/i), { target: { value: "Arun Kumar" } });
    fireEvent.change(screen.getByLabelText(/^email address/i), { target: { value: "existing@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "securePass123" } });
    fireEvent.change(screen.getByLabelText(/^confirm password/i), { target: { value: "securePass123" } });
    fireEvent.change(screen.getByLabelText(/^mobile number/i), { target: { value: "9876543210" } });
    fireEvent.click(screen.getByLabelText(/terms and conditions/i));

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    expect(
      await screen.findByText(/an account may already exist for this email/i),
    ).toBeTruthy();
  });

  it("provides partial failure recovery when auth account succeeds but profile creation fails", async () => {
    vi.spyOn(authManager, "createUserWithEmailAndPassword").mockResolvedValue({
      uid: "firebase-uid-partial-999",
      email: "partial@example.com",
      emailVerified: false,
      providerId: "firebase-email",
    });

    const provisionSpy = vi
      .spyOn(customerIdentityService, "provisionCustomerAccount")
      .mockRejectedValueOnce(new Error("Missing or insufficient permissions."))
      .mockResolvedValueOnce({
        userDocId: "ONCUS0000106",
        profile: {
          id: "ONCUS0000106",
          userId: "ONCUS0000106",
          uid: "firebase-uid-partial-999",
          name: "Retry Customer",
          email: "partial@example.com",
          phone: "+91 9876543210",
          coins: 0,
          availableCoins: 0,
          earnedCoins: 0,
          isVIP: false,
          referralCode: "ONCUS0000106",
          createdAt: "2026-10-28T00:00:00.000Z",
        },
      });

    render(<CustomerRegistrationForm />);

    fireEvent.change(screen.getByLabelText(/^full name/i), { target: { value: "Retry Customer" } });
    fireEvent.change(screen.getByLabelText(/^email address/i), { target: { value: "partial@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "securePass123" } });
    fireEvent.change(screen.getByLabelText(/^confirm password/i), { target: { value: "securePass123" } });
    fireEvent.change(screen.getByLabelText(/^mobile number/i), { target: { value: "9876543210" } });
    fireEvent.click(screen.getByLabelText(/terms and conditions/i));

    fireEvent.click(screen.getByRole("button", { name: "Create Account" }));

    // Expect error banner and retry profile button
    expect(await screen.findByText(/missing or insufficient permissions/i)).toBeTruthy();
    const retryBtn = await screen.findByRole("button", { name: "Retry Profile Setup" });
    expect(retryBtn).toBeTruthy();

    // Now user clicks retry
    fireEvent.click(retryBtn);

    await waitFor(() => {
      // Second call to provisionCustomerAccount
      expect(provisionSpy).toHaveBeenCalledTimes(2);
    });

    expect(await screen.findByText(/Welcome, Retry Customer!/i)).toBeTruthy();
  });

  it("allows Google sign-in and provisions an unlinked profile in onlineCustomers", async () => {
    vi.spyOn(authManager, "signInWithGoogle").mockResolvedValue({
      uid: "google-uid-789",
      email: "googleuser@gmail.com",
      emailVerified: true,
      phoneNumber: null,
      providerId: "firebase-google",
    });

    authState.resolveFirebaseSession
      .mockResolvedValueOnce({
        status: "unlinked",
        ok: false,
        code: "identity/unlinked-uid",
        uid: "google-uid-789",
        userDocId: null,
        profile: null,
        requiresRegistration: true,
        message: "No mapping",
      })
      .mockResolvedValueOnce({
        status: "resolved",
        ok: true,
        profile: {
          id: "ONCUS0000107",
          userId: "ONCUS0000107",
          name: "googleuser",
          email: "googleuser@gmail.com",
          phone: "+91 99999 99999",
        },
      });

    const provisionSpy = vi.spyOn(customerIdentityService, "provisionCustomerAccount").mockResolvedValue({
      userDocId: "ONCUS0000107",
      profile: {
        id: "ONCUS0000107",
        userId: "ONCUS0000107",
        uid: "google-uid-789",
        name: "googleuser",
        email: "googleuser@gmail.com",
        phone: "+91 99999 99999",
        coins: 0,
        availableCoins: 0,
        earnedCoins: 0,
        isVIP: false,
        referralCode: "ONCUS0000107",
        createdAt: "2026-10-28T00:00:00.000Z",
      },
    });

    render(<CustomerRegistrationForm />);

    fireEvent.click(screen.getByRole("button", { name: /continue with google/i }));

    await waitFor(() => {
      expect(provisionSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: "google-uid-789",
          email: "googleuser@gmail.com",
          fullName: "googleuser",
        }),
      );
    });

    expect(await screen.findByText(/Welcome, googleuser!/i)).toBeTruthy();
  });

  it("validates referral code on blur", async () => {
    vi.spyOn(authService, "validateReferralCode").mockResolvedValue({
      valid: true,
      bonusCoins: 50,
      message: "Valid referral code! +50 bonus coins on first order.",
    });

    render(<CustomerRegistrationForm />);

    const refInput = screen.getByLabelText(/^referral code/i);
    fireEvent.change(refInput, { target: { value: "ONCUS0000010" } });
    fireEvent.blur(refInput);

    expect(await screen.findByText(/Valid code: \+50 bonus Smart Coins on first order!/i)).toBeTruthy();
  });
});
