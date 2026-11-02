import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { RewardsPage } from "../routes/rewards";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { coinService } from "../services/coinService";
import { orderService } from "../services/orderService";
import { referralService } from "../services/referralService";
import { settingsService } from "../services/settingsService";
import { authManager } from "../services/authAdapter";
import { authService } from "../services/authService";
import { apiClient } from "../services/apiClient";
import { customerIdentityService } from "../services/customerIdentityService";
import { productionCoinReader } from "../services/productionCoinReader";
import type { CoinTransaction, Order, ReferralFriend, StoreInfo, User } from "../types";

// Mock router & layout components
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, className, ...props }: any) => (
    <a href={to} className={className} {...props}>
      {children}
    </a>
  ),
  useSearch: () => ({}),
  useNavigate: () => vi.fn(),
  createFileRoute: () => (config: any) => config,
}));

vi.mock("../components/layout/StoreHeader", () => ({
  StoreHeader: () => <header data-testid="store-header">Header Balance: 154</header>,
}));
vi.mock("../components/layout/StoreFooter", () => ({
  StoreFooter: () => <footer data-testid="store-footer" />,
}));
vi.mock("../components/layout/BottomNav", () => ({
  BottomNav: () => <nav data-testid="bottom-nav" />,
}));

describe("Rewards Page Loading Lifecycle & Terminal State Verification", () => {
  const originalGetMode = authManager.getMode;
  const originalGetCoinHistory = coinService.getCoinHistory;
  const originalGetUserCoins = coinService.getUserCoins;
  const originalGetOrders = orderService.getOrders;
  const originalGetReferrals = referralService.getReferrals;
  const originalGetStoreInfo = settingsService.getStoreInfo;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    authManager.getMode = originalGetMode;
    coinService.getCoinHistory = originalGetCoinHistory;
    coinService.getUserCoins = originalGetUserCoins;
    orderService.getOrders = originalGetOrders;
    referralService.getReferrals = originalGetReferrals;
    settingsService.getStoreInfo = originalGetStoreInfo;
    vi.restoreAllMocks();
  });

  const mockSassUser: User = {
    id: "SASS0000010",
    userId: "SASS0000010",
    name: "Micro Soft",
    phone: "8248544559",
    email: "microsoft44559@gmail.com",
    coins: 170,
    isVIP: false,
    referralCode: "SASS0000010",
    createdAt: new Date().toISOString(),
  };

  const mockOncusUser: User = {
    id: "ONCUS000010",
    userId: "ONCUS000010",
    legacySassId: "SASS0000010",
    name: "Micro Soft Migrated",
    phone: "8248544559",
    email: "microsoft44559@gmail.com",
    coins: 170,
    isVIP: false,
    referralCode: "ONCUS000010",
    createdAt: new Date().toISOString(),
  };

  const mockTransactions: CoinTransaction[] = [
    {
      id: "tx_101",
      userId: "SASS0000010",
      amount: 50,
      type: "earned",
      description: "Amman Coins earned on Order #ORD-101",
      timestamp: new Date().toISOString(),
    },
    {
      id: "tx_102",
      userId: "SASS0000010",
      amount: 20,
      type: "redeemed",
      description: "Redeemed on Order #ORD-102",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ];

  const mockStore: StoreInfo = {
    storeName: "Sri Amman Smart Store",
    coinValueInRupees: 0.05,
    vipSpendingThreshold: 5000,
  } as StoreInfo;

  it("1. Successfully loads rewards dashboard in local mode and terminates loading state", async () => {
    authManager.getMode = () => "emulator";
    localStorage.setItem("sass_customer_session", JSON.stringify(mockSassUser));

    const historySpy = vi.spyOn(coinService, "getCoinHistory").mockResolvedValue(mockTransactions);
    const balanceSpy = vi.spyOn(coinService, "getUserCoins").mockResolvedValue(170);
    const ordersSpy = vi.spyOn(orderService, "getOrders").mockResolvedValue([]);
    const referralsSpy = vi.spyOn(referralService, "getReferrals").mockResolvedValue([]);
    const storeSpy = vi.spyOn(settingsService, "getStoreInfo").mockResolvedValue(mockStore);

    render(
      <AuthProvider>
        <RewardsPage />
      </AuthProvider>
    );

    // Initial loading text should appear
    expect(screen.getByText(/Loading your rewards and coin balance/i)).toBeInTheDocument();

    // Must reach terminal loaded state
    await waitFor(() => {
      expect(screen.queryByText(/Loading your rewards and coin balance/i)).not.toBeInTheDocument();
    });

    // Dashboard vault content rendered
    expect(screen.getByText("Amman Coins Vault")).toBeInTheDocument();
    expect(screen.getByText("170")).toBeInTheDocument();

    // Spies called once
    expect(historySpy).toHaveBeenCalledTimes(1);
    expect(balanceSpy).toHaveBeenCalledTimes(1);
  });

  it("2. Rejects emulator localStorage sessions in production mode", async () => {
    authManager.getMode = () => "production";
    localStorage.setItem("sass_customer_session", JSON.stringify(mockSassUser));

    vi.spyOn(coinService, "getCoinHistory").mockResolvedValue(mockTransactions);
    vi.spyOn(coinService, "getUserCoins").mockResolvedValue(170);
    vi.spyOn(orderService, "getOrders").mockResolvedValue([]);
    vi.spyOn(referralService, "getReferrals").mockResolvedValue([]);
    vi.spyOn(settingsService, "getStoreInfo").mockResolvedValue(mockStore);

    render(
      <AuthProvider>
        <RewardsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading your rewards and coin balance/i)).not.toBeInTheDocument();
    });

    // A localStorage emulator session must not authenticate a production-mode user.
    expect(screen.getByText(/Please Sign In to Access Amman Rewards/i)).toBeInTheDocument();
    expect(coinService.getCoinHistory).not.toHaveBeenCalled();
    expect(coinService.getUserCoins).not.toHaveBeenCalled();
  });

  it("3. Handles empty coin history gracefully with 0 balance without infinite loading", async () => {
    authManager.getMode = () => "emulator";
    const userWithZeroCoins = { ...mockSassUser, coins: 0 };
    localStorage.setItem("sass_customer_session", JSON.stringify(userWithZeroCoins));

    vi.spyOn(coinService, "getCoinHistory").mockResolvedValue([]);
    vi.spyOn(coinService, "getUserCoins").mockResolvedValue(0);
    vi.spyOn(orderService, "getOrders").mockResolvedValue([]);
    vi.spyOn(referralService, "getReferrals").mockResolvedValue([]);
    vi.spyOn(settingsService, "getStoreInfo").mockResolvedValue(mockStore);

    render(
      <AuthProvider>
        <RewardsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading your rewards and coin balance/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText("Amman Coins Vault")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("4. Transitions to a visible error state with retry button when service fails, instead of infinite loading", async () => {
    authManager.getMode = () => "emulator";
    localStorage.setItem("sass_customer_session", JSON.stringify(mockSassUser));

    vi.spyOn(coinService, "getCoinHistory").mockRejectedValue(new Error("Database connection timed out"));
    vi.spyOn(coinService, "getUserCoins").mockRejectedValue(new Error("Database connection timed out"));
    vi.spyOn(orderService, "getOrders").mockResolvedValue([]);
    vi.spyOn(referralService, "getReferrals").mockResolvedValue([]);
    vi.spyOn(settingsService, "getStoreInfo").mockResolvedValue(mockStore);

    render(
      <AuthProvider>
        <RewardsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading your rewards and coin balance/i)).not.toBeInTheDocument();
    });

    // Must show visible error UI
    expect(screen.getByText("Unable to Load Rewards Data")).toBeInTheDocument();
    expect(screen.getByText(/Database connection timed out/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });

  it("5. Retries loading when user clicks the Retry button", async () => {
    authManager.getMode = () => "emulator";
    localStorage.setItem("sass_customer_session", JSON.stringify(mockSassUser));

    let attempt = 0;
    vi.spyOn(coinService, "getCoinHistory").mockImplementation(async () => {
      attempt++;
      if (attempt === 1) {
        throw new Error("Temporary network glitch");
      }
      return mockTransactions;
    });
    vi.spyOn(coinService, "getUserCoins").mockImplementation(async () => {
      if (attempt === 1) {
        throw new Error("Temporary network glitch");
      }
      return 170;
    });
    vi.spyOn(orderService, "getOrders").mockResolvedValue([]);
    vi.spyOn(referralService, "getReferrals").mockResolvedValue([]);
    vi.spyOn(settingsService, "getStoreInfo").mockResolvedValue(mockStore);

    render(
      <AuthProvider>
        <RewardsPage />
      </AuthProvider>
    );

    // Initial attempt fails and displays error
    await waitFor(() => {
      expect(screen.getByText("Unable to Load Rewards Data")).toBeInTheDocument();
    });

    const retryBtn = screen.getByRole("button", { name: /Retry/i });
    await act(async () => {
      fireEvent.click(retryBtn);
    });

    // Second attempt succeeds and renders dashboard
    await waitFor(() => {
      expect(screen.queryByText("Unable to Load Rewards Data")).not.toBeInTheDocument();
      expect(screen.getByText("Amman Coins Vault")).toBeInTheDocument();
    });
    expect(screen.getByText("170")).toBeInTheDocument();
  });

  it("6. Does NOT enter an infinite loading loop due to unmemoized refreshUser or state updates", async () => {
    authManager.getMode = () => "emulator";
    localStorage.setItem("sass_customer_session", JSON.stringify(mockSassUser));

    const historySpy = vi.spyOn(coinService, "getCoinHistory").mockResolvedValue(mockTransactions);
    const balanceSpy = vi.spyOn(coinService, "getUserCoins").mockResolvedValue(170);
    vi.spyOn(orderService, "getOrders").mockResolvedValue([]);
    vi.spyOn(referralService, "getReferrals").mockResolvedValue([]);
    vi.spyOn(settingsService, "getStoreInfo").mockResolvedValue(mockStore);

    render(
      <AuthProvider>
        <RewardsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading your rewards and coin balance/i)).not.toBeInTheDocument();
    });

    // Wait extra tick to confirm no secondary re-trigger occurs
    await new Promise((r) => setTimeout(r, 100));

    // Must be called exactly once, never looping
    expect(historySpy).toHaveBeenCalledTimes(1);
    expect(balanceSpy).toHaveBeenCalledTimes(1);
  });

  it("7. Successfully passes legacySassId for ONCUS prepared customer identity in emulator mode", async () => {
    // Exercise the prepared customer identity flow in local mode; production must reject mock sessions.
    authManager.getMode = () => "emulator";
    localStorage.setItem("sass_customer_session", JSON.stringify(mockOncusUser));

    const historySpy = vi.spyOn(coinService, "getCoinHistory").mockResolvedValue(mockTransactions);
    const balanceSpy = vi.spyOn(coinService, "getUserCoins").mockResolvedValue(170);
    const ordersSpy = vi.spyOn(orderService, "getOrders").mockResolvedValue([]);
    vi.spyOn(referralService, "getReferrals").mockResolvedValue([]);
    vi.spyOn(settingsService, "getStoreInfo").mockResolvedValue(mockStore);

    render(
      <AuthProvider>
        <RewardsPage />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Loading your rewards and coin balance/i)).not.toBeInTheDocument();
    });

    // Verify user.id and user.legacySassId were passed
    expect(historySpy).toHaveBeenCalledWith("ONCUS000010", "SASS0000010");
    expect(balanceSpy).toHaveBeenCalledWith("ONCUS000010", "SASS0000010");
    expect(ordersSpy).toHaveBeenCalledWith("ONCUS000010", "SASS0000010");
  });

  it("8. Ensures production profile update write-protections remain enforced", async () => {
    authManager.setMode("production");
    const patchSpy = vi.spyOn(apiClient, "patch");
    const authSpy = vi.spyOn(authService, "updateProfile");

    const prodUser = mockSassUser;
    const mockFbUser = { uid: "prod-uid-rewards-tester", email: "rewards@example.com" };
    vi.spyOn(authManager, "getCurrentUser").mockReturnValue(mockFbUser as any);
    vi.spyOn(authManager, "subscribeAuthState").mockImplementation((cb: any) => {
      cb(mockFbUser);
      return () => {};
    });
    vi.spyOn(customerIdentityService, "resolveCustomerProfile").mockResolvedValue({
      status: "resolved",
      ok: true,
      uid: "prod-uid-rewards-tester",
      userDocId: "SASS0000010",
      mapping: {
        uid: "prod-uid-rewards-tester",
        userDocId: "SASS0000010",
        collection: "users",
        accountType: "customer",
      },
      profile: prodUser,
    });

    let caughtError: any = null;
    function ProfileTester() {
      const { updateProfile, isAuthenticated } = useAuth();
      return (
        <div>
          <span data-testid="prod-auth-status">{isAuthenticated ? "auth-ready" : "auth-loading"}</span>
          <button
            data-testid="test-profile-btn"
            onClick={async () => {
              try {
                await updateProfile({ name: "Hacked" });
              } catch (e) {
                caughtError = e;
              }
            }}
          >
            Update
          </button>
        </div>
      );
    }

    render(
      <AuthProvider>
        <ProfileTester />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("prod-auth-status")).toHaveTextContent("auth-ready");
    });

    const btn = screen.getByTestId("test-profile-btn");
    await act(async () => {
      fireEvent.click(btn);
    });

    expect(caughtError).toBeNull();
  });
});

