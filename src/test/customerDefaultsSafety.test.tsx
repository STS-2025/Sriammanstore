import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import { orderService } from "../services/orderService";
import { addressService } from "../services/addressService";
import { coinService } from "../services/coinService";
import { apiClient } from "../services/apiClient";
import { authService } from "../services/authService";
import { authManager } from "../services/authAdapter";
import { customerIdentityService } from "../services/customerIdentityService";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AddressesPage } from "../routes/addresses";
import type { User, Address, Order, CoinTransaction } from "../types";
import fs from "fs";
import path from "path";

// Mock tanstack router & layout components
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

describe("Phase 4B-1: Customer Defaults & Profile Guard Safety Verification", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    authManager.resetMode();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    authManager.resetMode();
  });

  describe("1. Static Contract & Source Code Guard Inspection", () => {
    it("confirms orderService.ts does not contain hardcoded default customer IDs", () => {
      const filePath = path.resolve(__dirname, "../services/orderService.ts");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).not.toContain('userId: string = "SASS0000104"');
      expect(content).not.toContain("userId = 'SASS0000104'");
    });

    it("confirms addressService.ts does not contain hardcoded default customer IDs", () => {
      const filePath = path.resolve(__dirname, "../services/addressService.ts");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).not.toContain('userId: string = "SASS0000104"');
      expect(content).not.toContain("userId = 'SASS0000104'");
    });

    it("confirms coinService.ts does not contain hardcoded default customer IDs", () => {
      const filePath = path.resolve(__dirname, "../services/coinService.ts");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).not.toContain('userId: string = "SASS0000104"');
      expect(content).not.toContain("userId = 'SASS0000104'");
    });

    it("confirms addresses.tsx does not contain fabricated identity defaults (Arun Kumar / +91 99999 99999)", () => {
      const filePath = path.resolve(__dirname, "../routes/addresses.tsx");
      const content = fs.readFileSync(filePath, "utf-8");
      expect(content).not.toContain('"Arun Kumar"');
      expect(content).not.toContain('"+91 99999 99999"');
    });
  });

  describe("2. orderService Safety with Missing & Valid Customer IDs", () => {
    it("returns an empty array and NEVER calls apiClient.get when customer ID is missing or empty", async () => {
      const getSpy = vi.spyOn(apiClient, "get");

      // Undefined
      const resultUndefined = await orderService.getOrders();
      expect(resultUndefined).toEqual([]);
      expect(getSpy).not.toHaveBeenCalled();

      // Empty string
      const resultEmpty = await orderService.getOrders("");
      expect(resultEmpty).toEqual([]);
      expect(getSpy).not.toHaveBeenCalled();

      // Whitespace string
      const resultSpaces = await orderService.getOrders("   ");
      expect(resultSpaces).toEqual([]);
      expect(getSpy).not.toHaveBeenCalled();
    });

    it("queries apiClient.get with explicit customer ID when valid SASS ID is provided", async () => {
      const mockOrders: Order[] = [
        {
          id: "ORD-TEST-01",
          orderId: "ORD-TEST-01",
          userId: "SASS0000088",
          customerName: "Priya Sundaram",
          phone: "+91 94433 12345",
          status: "delivered",
          createdAt: new Date().toISOString(),
          deliveryAddress: { houseNo: "42", street: "Gandhi Nagar", city: "Gobichettipalayam", pincode: "638454" },
          delivery: { type: "standard", slot: "Morning" },
          payment: { method: "online", status: "paid" },
          items: [],
          pricingSummary: { subtotal: 1500, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 1500 },
        },
      ];

      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockOrders as any);

      const result = await orderService.getOrders("SASS0000088");
      expect(getSpy).toHaveBeenCalledWith("/orders", { userId: "SASS0000088" });
      expect(result.length).toBe(1);
      expect(result[0]!.orderId).toBe("ORD-TEST-01");
    });
  });

  describe("3. addressService Safety with Missing & Valid Customer IDs", () => {
    it("returns an empty array and NEVER calls apiClient.get when customer ID is missing or empty", async () => {
      const getSpy = vi.spyOn(apiClient, "get");

      const resultUndefined = await addressService.getAddresses();
      expect(resultUndefined).toEqual([]);
      expect(getSpy).not.toHaveBeenCalled();

      const resultEmpty = await addressService.getAddresses("");
      expect(resultEmpty).toEqual([]);
      expect(getSpy).not.toHaveBeenCalled();

      const resultSpaces = await addressService.getAddresses("   ");
      expect(resultSpaces).toEqual([]);
      expect(getSpy).not.toHaveBeenCalled();
    });

    it("queries apiClient.get with explicit customer ID when valid SASS ID is provided", async () => {
      const mockAddresses: Address[] = [
        {
          id: "addr_test_1",
          userId: "SASS0000088",
          tag: "Home",
          name: "Priya Sundaram",
          phone: "+91 94433 12345",
          houseNo: "42/1",
          street: "Gandhi Nagar",
          city: "Gobichettipalayam",
          pincode: "638454",
          lat: 11.4598,
          lng: 77.334,
          isDefault: true,
        },
      ];

      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockAddresses as any);

      const result = await addressService.getAddresses("SASS0000088");
      expect(getSpy).toHaveBeenCalledWith("/addresses", { userId: "SASS0000088" });
      expect(result.length).toBe(1);
      expect(result[0]!.id).toBe("addr_test_1");
    });

    it("prevents saving or setting default address when userId is missing or empty", async () => {
      const postSpy = vi.spyOn(apiClient, "post");
      const patchSpy = vi.spyOn(apiClient, "patch");

      // addAddress with empty userId
      await expect(
        addressService.addAddress({
          userId: "",
          tag: "Home",
          name: "Test",
          phone: "9999999999",
          houseNo: "1",
          street: "Street",
          city: "Gobi",
          pincode: "638454",
          lat: 11.45,
          lng: 77.33,
          isDefault: false,
        })
      ).rejects.toThrow("Cannot save an address without a valid customer userId");
      expect(postSpy).not.toHaveBeenCalled();

      // setDefaultAddress with empty userId
      await expect(addressService.setDefaultAddress("addr_1", "")).rejects.toThrow(
        "Cannot set default address without a valid customer userId"
      );
      expect(patchSpy).not.toHaveBeenCalled();
    });
  });

  describe("4. coinService Safety with Missing & Valid Customer IDs", () => {
    it("returns an empty array and NEVER calls apiClient.get when customer ID is missing or empty in getCoinHistory", async () => {
      const getSpy = vi.spyOn(apiClient, "get");

      const resultUndefined = await coinService.getCoinHistory();
      expect(resultUndefined).toEqual([]);
      expect(getSpy).not.toHaveBeenCalled();

      const resultEmpty = await coinService.getCoinHistory("");
      expect(resultEmpty).toEqual([]);
      expect(getSpy).not.toHaveBeenCalled();

      const resultSpaces = await coinService.getCoinHistory("   ");
      expect(resultSpaces).toEqual([]);
      expect(getSpy).not.toHaveBeenCalled();
    });

    it("returns 0 and NEVER calls apiClient.get when customer ID is missing or empty in getUserCoins", async () => {
      const getSpy = vi.spyOn(apiClient, "get");

      const coinsUndefined = await coinService.getUserCoins();
      expect(coinsUndefined).toBe(0);
      expect(getSpy).not.toHaveBeenCalled();

      const coinsEmpty = await coinService.getUserCoins("");
      expect(coinsEmpty).toBe(0);
      expect(getSpy).not.toHaveBeenCalled();
    });

    it("queries apiClient.get with explicit customer ID when valid SASS ID is provided", async () => {
      const mockHistory: CoinTransaction[] = [
        {
          id: "tx_1",
          userId: "SASS0000088",
          type: "earned",
          amount: 50,
          timestamp: new Date().toISOString(),
          description: "Order bonus",
        },
      ];

      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockHistory as any);

      const history = await coinService.getCoinHistory("SASS0000088");
      expect(getSpy).toHaveBeenCalledWith("/coinHistory", { userId: "SASS0000088" });
      expect(history.length).toBe(1);
      expect(history[0]!.amount).toBe(50);
    });
  });

  describe("5. Production Profile Update Guard (AuthContext.updateProfile)", () => {
    // Component to expose updateProfile for testing
    function TestProfileUpdater({ onAction }: { onAction: (ctx: any) => void }) {
      const ctx = useAuth();
      return (
        <div>
          <span data-testid="user-status">{ctx.isAuthenticated ? "authenticated" : "loading"}</span>
          <button
            type="button"
            data-testid="trigger-update"
            onClick={() => onAction(ctx)}
          >
            Update
          </button>
        </div>
      );
    }

    it("rejects updateProfile with a clear error and NEVER calls apiClient.patch in production mode", async () => {
      authManager.setMode("production");
      const patchSpy = vi.spyOn(apiClient, "patch");
      const authServiceSpy = vi.spyOn(authService, "updateProfile");

      const prodUser: User = {
        id: "SASS0000104",
        userId: "SASS0000104",
        name: "Verified Prod User",
        phone: "+91 98400 12345",
        email: "prod@example.com",
        coins: 254,
        isVIP: false,
        referralCode: "SASS0000104",
        createdAt: new Date().toISOString(),
      };

      const mockFbUser = { uid: "prod-uid-104", email: "prod@example.com" };
      vi.spyOn(authManager, "getCurrentUser").mockReturnValue(mockFbUser as any);
      vi.spyOn(authManager, "subscribeAuthState").mockImplementation((cb: any) => {
        cb(mockFbUser);
        return () => {};
      });
      vi.spyOn(customerIdentityService, "resolveCustomerProfile").mockResolvedValue({
        status: "resolved",
        ok: true,
        uid: "prod-uid-104",
        userDocId: "SASS0000104",
        mapping: {
          uid: "prod-uid-104",
          userDocId: "SASS0000104",
          collection: "users",
          accountType: "customer",
        },
        profile: prodUser,
      });

      let caughtError: any = null;

      render(
        <AuthProvider>
          <TestProfileUpdater
            onAction={async (ctx) => {
              try {
                await ctx.updateProfile({ name: "Hacked Name" });
              } catch (err) {
                caughtError = err;
              }
            }}
          />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-status")).toHaveTextContent("authenticated");
      });

      const triggerBtn = screen.getByTestId("trigger-update");
      await act(async () => {
        fireEvent.click(triggerBtn);
      });

      expect(caughtError).not.toBeNull();
      expect(caughtError.message).toContain(
        "Profile edits are currently disabled in live production mode to protect account data integrity."
      );
      // Ensure zero writes to mock or emulator
      expect(patchSpy).not.toHaveBeenCalled();
      expect(authServiceSpy).not.toHaveBeenCalled();
    });

    it("allows profile updates in mock mode and persists via authService", async () => {
      authManager.setMode("mock");

      const mockUser: User = {
        id: "SASS0000104",
        userId: "SASS0000104",
        name: "Original Name",
        phone: "+91 99999 99999",
        email: "arun@example.com",
        coins: 100,
        isVIP: false,
        referralCode: "SASS0000104",
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("sass_customer_session", JSON.stringify(mockUser));

      const authServiceSpy = vi
        .spyOn(authService, "updateProfile")
        .mockResolvedValue({ ...mockUser, name: "Updated Name" });

      let caughtError: any = null;

      render(
        <AuthProvider>
          <TestProfileUpdater
            onAction={async (ctx) => {
              try {
                await ctx.updateProfile({ name: "Updated Name" });
              } catch (err) {
                caughtError = err;
              }
            }}
          />
        </AuthProvider>
      );

      const triggerBtn = screen.getByTestId("trigger-update");
      await act(async () => {
        fireEvent.click(triggerBtn);
      });

      expect(caughtError).toBeNull();
      expect(authServiceSpy).toHaveBeenCalledWith("SASS0000104", { name: "Updated Name" });
    });
  });

  describe("6. Addresses Page Identity Fallbacks Verification", () => {
    it("initializes address form with authenticated user name and phone", async () => {
      const userWithData: User = {
        id: "SASS0000088",
        userId: "SASS0000088",
        name: "Sundar Pichai",
        phone: "+91 98765 43210",
        email: "sundar@example.com",
        coins: 100,
        isVIP: true,
        referralCode: "SASS0000088",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("sass_customer_session", JSON.stringify(userWithData));

      render(
        <AuthProvider>
          <AddressesPage />
        </AuthProvider>
      );

      const addBtn = screen.getByRole("button", { name: /Add New Address/i });
      await act(async () => {
        fireEvent.click(addBtn);
      });

      const nameInput = screen.getByPlaceholderText("Recipient full name") as HTMLInputElement;
      const phoneInput = screen.getByPlaceholderText("+91 98400 12345") as HTMLInputElement;

      expect(nameInput.value).toBe("Sundar Pichai");
      expect(phoneInput.value).toBe("+91 98765 43210");
      expect(nameInput.value).not.toBe("Arun Kumar");
      expect(phoneInput.value).not.toBe("+91 99999 99999");
    });

    it("initializes address form with empty string and neutral placeholders when user has no name or phone", async () => {
      const userWithoutDetails: User = {
        id: "SASS0000105",
        userId: "SASS0000105",
        name: "",
        phone: "",
        email: "",
        coins: 0,
        isVIP: false,
        referralCode: "SASS0000105",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("sass_customer_session", JSON.stringify(userWithoutDetails));

      render(
        <AuthProvider>
          <AddressesPage />
        </AuthProvider>
      );

      const addBtn = screen.getByRole("button", { name: /Add New Address/i });
      await act(async () => {
        fireEvent.click(addBtn);
      });

      const nameInput = screen.getByPlaceholderText("Recipient full name") as HTMLInputElement;
      const phoneInput = screen.getByPlaceholderText("+91 98400 12345") as HTMLInputElement;

      expect(nameInput.value).toBe("");
      expect(phoneInput.value).toBe("");
      expect(nameInput.value).not.toBe("Arun Kumar");
      expect(phoneInput.value).not.toBe("+91 99999 99999");
    });
  });
});
