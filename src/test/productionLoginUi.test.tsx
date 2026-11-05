import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LoginPage } from "../routes/login";
import { AuthProvider } from "../context/AuthContext";
import { authManager } from "../services/authAdapter";

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

describe("Login UI: restored app-shell layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
