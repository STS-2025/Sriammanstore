import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { authManager } from "../services/authAdapter";
import { authService } from "../services/authService";
import {
  referralService,
  REFERRAL_REWARD_COINS,
} from "../services/referralService";
import {
  productionReferralReader,
  setProductionReferralReaderOverride,
  normalizeLegacyReferralDocument,
} from "../services/productionReferralReader";
import { apiClient } from "../services/apiClient";
import { StorageAdapterError } from "../services/firestoreAdapter";
import { ReferPage } from "../routes/refer";
import { AuthProvider } from "../context/AuthContext";
import type { ReferralFriend, User } from "../types";

// Mock router navigation
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: any) => opts,
  useNavigate: () => mockNavigate,
  Link: ({ children, to, className, ...props }: any) => (
    <a href={to} className={className} data-testid="router-link" {...props}>
      {children}
    </a>
  ),
}));

// Mock layout components
vi.mock("../components/layout/StoreHeader", () => ({
  StoreHeader: () => <div data-testid="store-header">StoreHeader</div>,
}));
vi.mock("../components/layout/BottomNav", () => ({
  BottomNav: () => <div data-testid="bottom-nav">BottomNav</div>,
}));
vi.mock("../components/layout/StoreFooter", () => ({
  StoreFooter: () => <div data-testid="store-footer">StoreFooter</div>,
}));

let mockAuthUser: User | null = null;

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isLoading: false,
    isResolvingIdentity: false,
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

describe("Production Referrals Integration Suite", () => {
  beforeEach(() => {
    authManager.resetMode();
    setProductionReferralReaderOverride(null);
    mockAuthUser = null;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    authManager.resetMode();
    setProductionReferralReaderOverride(null);
    vi.restoreAllMocks();
  });

  describe("1. Environment-Aware Service Routing", () => {
    it("routes getReferrals to productionReferralReader in production auth mode", async () => {
      authManager.setMode("production");
      expect(authManager.getMode()).toBe("production");

      const mockReferrals: ReferralFriend[] = [
        {
          id: "ref_prod_001",
          userId: "SASS0000104",
          friendName: "Murugan Selvan",
          phoneMasked: "+91 94443 *****",
          status: "Completed First Order",
          rewardCoins: 50,
          date: "2026-10-15",
        },
      ];

      const prodSpy = vi.fn().mockResolvedValue(mockReferrals);
      setProductionReferralReaderOverride({
        getCustomerReferrals: prodSpy,
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      const result = await referralService.getReferrals("SASS0000104");

      expect(prodSpy).toHaveBeenCalledTimes(1);
      expect(prodSpy).toHaveBeenCalledWith("SASS0000104");
      expect(apiGetSpy).not.toHaveBeenCalled();
      expect(result).toEqual(mockReferrals);
    });

    it("resolves canonical ONCUS customer ID and passes legacySassId for approved migrated accounts", async () => {
      authManager.setMode("production");

      const prodSpy = vi.fn().mockResolvedValue([]);
      setProductionReferralReaderOverride({
        getCustomerReferrals: prodSpy,
      });

      await referralService.getReferrals("SASS0000021");

      expect(prodSpy).toHaveBeenCalledWith(
        "ONCUS0000021",
        "SASS0000021"
      );
    });

    it("preserves local apiClient routing in emulator mode", async () => {
      authManager.setMode("emulator");

      const mockEmulatorReferrals: ReferralFriend[] = [
        {
          id: "emu_ref_1",
          userId: "SASS0000104",
          friendName: "Dev Friend",
          phoneMasked: "+91 98400 *****",
          status: "Signed Up",
          rewardCoins: 0,
          date: "2026-10-01",
        },
      ];

      const apiGetSpy = vi
        .spyOn(apiClient, "get")
        .mockResolvedValue(mockEmulatorReferrals);

      const prodSpy = vi.fn();
      setProductionReferralReaderOverride({
        getCustomerReferrals: prodSpy,
      });

      const result = await referralService.getReferrals("SASS0000104");

      expect(prodSpy).not.toHaveBeenCalled();
      expect(apiGetSpy).toHaveBeenCalledWith("/referrals", {
        userId: "SASS0000104",
      });
      expect(result).toEqual(mockEmulatorReferrals);
    });
  });

  describe("2. Customer ID Validation & Isolation", () => {
    it("validates canonical customer IDs and rejects malformed IDs in production referral reader", () => {
      expect(productionReferralReader.assertValidCustomer("SASS0000104")).toBe(
        "SASS0000104"
      );
      expect(productionReferralReader.assertValidCustomer("ONCUS0000021")).toBe(
        "ONCUS0000021"
      );
      expect(productionReferralReader.assertValidCustomer("SASS000021")).toBe(
        "SASS000021"
      );
      expect(productionReferralReader.assertValidCustomer("ONCUS000021")).toBe(
        "ONCUS000021"
      );

      expect(() =>
        productionReferralReader.assertValidCustomer("invalid_user")
      ).toThrow(StorageAdapterError);
      expect(() =>
        productionReferralReader.assertValidCustomer("guest_session")
      ).toThrow(StorageAdapterError);
      expect(() => productionReferralReader.assertValidCustomer("")).toThrow(
        StorageAdapterError
      );
    });

    it("returns empty array for empty customer ID in production mode", async () => {
      authManager.setMode("production");
      const result = await referralService.getReferrals("");
      expect(result).toEqual([]);
    });
  });

  describe("3. Legacy Referral Normalization & Mapping", () => {
    it("normalizes a legacy referral document with buyerName, amount, and timestamp", () => {
      const rawDoc = {
        buyerName: "Karthik Raja",
        number: "9840298765",
        amount: 50,
        status: "Completed First Order",
        createdAt: "2026-10-10T12:00:00Z",
      };

      const normalized = normalizeLegacyReferralDocument(
        "ref_karthik_101",
        rawDoc,
        "SASS0000104"
      );

      expect(normalized.id).toBe("ref_karthik_101");
      expect(normalized.userId).toBe("SASS0000104");
      expect(normalized.friendName).toBe("Karthik Raja");
      expect(normalized.phoneMasked).toBe("+91 98*****");
      expect(normalized.rewardCoins).toBe(50);
      expect(normalized.status).toBe("Completed First Order");
      expect(normalized.date).toBe("2026-10-10");
    });

    it("handles Firestore Timestamp object in date resolution", () => {
      const mockDate = new Date("2026-09-25T15:30:00Z");
      const rawDoc = {
        name: "Divya Krishnan",
        phoneMasked: "+91 97910 *****",
        rewardCoins: 50,
        referredAt: {
          toDate: () => mockDate,
        },
      };

      const normalized = normalizeLegacyReferralDocument(
        "ref_divya_102",
        rawDoc,
        "SASS0000104"
      );

      expect(normalized.friendName).toBe("Divya Krishnan");
      expect(normalized.phoneMasked).toBe("+91 97910 *****");
      expect(normalized.date).toBe("2026-09-25");
      expect(normalized.rewardCoins).toBe(50);
      expect(normalized.status).toBe("Completed First Order");
    });

    it("defaults to 'Signed Up (Order Pending)' when reward coins are zero and status is unspecified", () => {
      const rawDoc = {
        userId: "SASS0000088",
        rewardCoins: 0,
      };

      const normalized = normalizeLegacyReferralDocument(
        "SASS0000088",
        rawDoc,
        "SASS0000104"
      );

      expect(normalized.friendName).toBe("Customer (SASS0000088)");
      expect(normalized.status).toBe("Signed Up (Order Pending)");
      expect(normalized.rewardCoins).toBe(0);
    });
  });

  describe("4. Storage Error vs Genuine Empty Separation", () => {
    it("returns genuinely empty list without error when customer has no referrals", async () => {
      authManager.setMode("production");

      setProductionReferralReaderOverride({
        getCustomerReferrals: vi.fn().mockResolvedValue([]),
      });

      const result = await referralService.getReferrals("SASS0000104");
      expect(result).toEqual([]);
    });

    it("throws StorageAdapterError on Firestore permission denied without silent mock fallback", async () => {
      authManager.setMode("production");

      const permissionError = new StorageAdapterError(
        "Permission denied for users/SASS0000104/refferals",
        {
          status: 403,
          code: "permission-denied",
          category: "permission",
        }
      );

      setProductionReferralReaderOverride({
        getCustomerReferrals: vi.fn().mockRejectedValue(permissionError),
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      await expect(referralService.getReferrals("SASS0000104")).rejects.toThrow(
        /Permission denied/
      );

      expect(apiGetSpy).not.toHaveBeenCalled();
    });
  });

  describe("5. ReferPage UI Integration", () => {
    const mockUser: User = {
      id: "SASS0000104",
      userId: "SASS0000104",
      name: "Velmurugan Customer",
      email: "vel@sriammanstore.com",
      phone: "+91 98402 12345",
      coins: 200,
      isVIP: false,
      referralCode: "VELMURU104",
      createdAt: "2026-01-01T00:00:00Z",
    };

    it("does not display production read-only notice in production mode", async () => {
      authManager.setMode("production");
      mockAuthUser = mockUser;
      vi.spyOn(authService, "getCurrentUser").mockReturnValue(mockUser);

      setProductionReferralReaderOverride({
        getCustomerReferrals: vi.fn().mockResolvedValue([
          {
            id: "ref_01",
            userId: "SASS0000104",
            friendName: "Suresh Raina",
            phoneMasked: "+91 98402 *****",
            status: "Completed First Order",
            rewardCoins: 50,
            date: "2026-09-15",
          },
        ]),
      });

      render(
        <AuthProvider>
          <ReferPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId("production-referrals-notice")
        ).not.toBeInTheDocument();
      });
    });

    it("renders empty-referrals-view when customer has zero referrals", async () => {
      authManager.setMode("production");
      mockAuthUser = mockUser;
      vi.spyOn(authService, "getCurrentUser").mockReturnValue(mockUser);

      setProductionReferralReaderOverride({
        getCustomerReferrals: vi.fn().mockResolvedValue([]),
      });

      render(
        <AuthProvider>
          <ReferPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("empty-referrals-view")
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/No Referrals Recorded Yet/i)
      ).toBeInTheDocument();
    });

    it("renders referrals-error-banner with Retry button when reading fails", async () => {
      authManager.setMode("production");
      mockAuthUser = mockUser;
      vi.spyOn(authService, "getCurrentUser").mockReturnValue(mockUser);

      setProductionReferralReaderOverride({
        getCustomerReferrals: vi
          .fn()
          .mockRejectedValue(
            new Error("Production Firestore referral query timed out")
          ),
      });

      render(
        <AuthProvider>
          <ReferPage />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("referrals-error-banner")
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Production Firestore referral query timed out/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /retry/i })
      ).toBeInTheDocument();
    });
  });
});
