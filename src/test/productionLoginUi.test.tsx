import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LoginPage } from "../routes/login";
import { AuthProvider } from "../context/AuthContext";
import { authManager } from "../services/authAdapter";

const otpMocks = vi.hoisted(() => ({
  checkEligibility: vi.fn(),
  signInWithPhoneNumber: vi.fn(),
}));

// Mock tanstack router
let mockSearchParams: Record<string, any> = {};
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className, ...props }: any) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
  useSearch: () => mockSearchParams,
  useNavigate: () => mockNavigate,
  createFileRoute: () => (config: any) => config,
}));

// Mock layout components to isolate LoginPage testing
vi.mock("../components/layout/StoreHeader", () => ({
  StoreHeader: () => <header data-testid="store-header" />,
}));
vi.mock("../components/layout/StoreFooter", () => ({
  StoreFooter: () => <footer data-testid="store-footer" />,
}));
vi.mock("../components/layout/BottomNav", () => ({
  BottomNav: () => <nav data-testid="bottom-nav" />,
}));
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("../services/phoneEligibilityService", () => ({
  checkCustomerPhoneEligibility: otpMocks.checkEligibility,
  mapPhoneEligibilityError: () =>
    "Unable to check this mobile number right now / number is not registered. Please try again shortly.",
}));

vi.mock("firebase/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("firebase/auth")>();
  return {
    ...actual,
    signInWithPhoneNumber: otpMocks.signInWithPhoneNumber,
    RecaptchaVerifier: class {
      constructor() {}
      clear() {}
    },
  };
});

describe("Login UI: restored app-shell layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    otpMocks.checkEligibility.mockReset();
    otpMocks.signInWithPhoneNumber.mockReset();
    mockSearchParams = {};
    authManager.resetMode();
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem("sass_auth_mode");
      } catch {
        // ignore
      }
    }
  });

  afterEach(() => {
    authManager.resetMode();
  });

  it("renders a unified sign-in card with both Mobile OTP and Email/Password simultaneously without tabs", async () => {
    await act(async () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>,
      );
    });

    expect(screen.getByText("Sign in to Sri Amman")).toBeDefined();
    expect(screen.getByText("Choose your preferred sign-in method.")).toBeDefined();
    // Tabs must be completely removed
    expect(screen.queryByRole("tab")).toBeNull();
    // Both methods must be visible simultaneously
    expect(screen.getByRole("button", { name: /Get OTP Passcode/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Sign in with email/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Continue with Google/i })).toBeDefined();
    expect(screen.queryByText(/Existing Customer Production Login/i)).toBeNull();
    expect(screen.queryByText(/SMS OTP Disabled in Production Mode/i)).toBeNull();
    expect(screen.queryByText(/Safe Read-Only Verification/i)).toBeNull();
  });

  it("keeps production mode available with unified layout without showing old production notices", async () => {
    mockSearchParams = { authMode: "production" };

    await act(async () => {
      render(
        <AuthProvider>
          <LoginPage />
        </AuthProvider>,
      );
    });

    expect(screen.getByText("Sign in to Sri Amman")).toBeDefined();
    expect(screen.queryByText(/Existing Customer Production Login/i)).toBeNull();
    expect(screen.queryByText(/Safe Read-Only Verification/i)).toBeNull();
    // Both authentication buttons visible simultaneously without switching tabs
    expect(screen.getByRole("button", { name: /Get OTP Passcode/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Sign in with email/i })).toBeDefined();
  });

  it("shows the exact unknown-account message without requesting a Firebase OTP", async () => {
    authManager.setMode("production");
    mockSearchParams = { authMode: "production" };
    otpMocks.checkEligibility.mockResolvedValue(false);

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );
    fireEvent.change(screen.getByLabelText(/Mobile number/), { target: { value: "9876543210" } });
    fireEvent.click(screen.getByRole("button", { name: /Get OTP Passcode/i }));

    expect(await screen.findByText("No account registered with this mobile number")).toBeDefined();
    expect(otpMocks.checkEligibility).toHaveBeenCalledWith("+919876543210");
    expect(otpMocks.signInWithPhoneNumber).not.toHaveBeenCalled();
  });

  it("prevents duplicate eligibility and OTP requests from repeated clicks", async () => {
    authManager.setMode("production");
    mockSearchParams = { authMode: "production" };
    let finishEligibility!: (eligible: boolean) => void;
    let finishOtp!: (result: unknown) => void;
    otpMocks.checkEligibility.mockReturnValue(
      new Promise<boolean>((resolve) => {
        finishEligibility = resolve;
      }),
    );
    otpMocks.signInWithPhoneNumber.mockReturnValue(
      new Promise((resolve) => {
        finishOtp = resolve;
      }),
    );

    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
    );
    fireEvent.change(screen.getByLabelText(/Mobile number/), { target: { value: "9876543210" } });
    const sendButton = screen.getByRole("button", { name: /Get OTP Passcode/i });
    fireEvent.click(sendButton);
    fireEvent.click(sendButton);
    await vi.waitFor(() => expect(otpMocks.checkEligibility).toHaveBeenCalledTimes(1));
    finishEligibility(true);
    await vi.waitFor(() => expect(otpMocks.signInWithPhoneNumber).toHaveBeenCalledTimes(1));
    finishOtp({ confirm: vi.fn() });
    await screen.findByText("Enter 6-digit OTP");
    expect(otpMocks.signInWithPhoneNumber).toHaveBeenCalledTimes(1);
  });
});
