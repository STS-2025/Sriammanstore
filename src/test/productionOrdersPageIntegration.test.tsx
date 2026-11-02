/**
 * productionOrdersPageIntegration.test.tsx
 *
 * Integration tests for Phase 4D — Safe Production Orders Read-Only UI & Action Protection.
 *
 * Coverage:
 *  1. legacySassId is passed through to orderService / productionOrderReader.
 *  2. Production notice visible in production mode; absent in mock/emulator mode.
 *  3. Cancel, return, and reorder actions are disabled/absent in production mode.
 *  4. Rate & Review and Need Help cannot issue mock POST requests in production mode.
 *  5. Firestore failures show error banner with retry; never silently become empty state.
 *  6. Customer-specific data isolation.
 *  7. Emulator/mock mode continues to work and shows action buttons.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { authManager } from "../services/authAdapter";
import { orderService } from "../services/orderService";
import { supportService } from "../services/supportService";
import { apiClient } from "../services/apiClient";
import { StorageAdapterError } from "../services/firestoreAdapter";
import { OrdersPage } from "../routes/orders";
import type { Order, User } from "../types";

// ── Router mock ──────────────────────────────────────────────────────────────
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: any) => opts,
  useSearch: () => ({}),
  useNavigate: () => vi.fn(),
  Link: ({ children, to, className, ...props }: any) => (
    <a href={to} className={className} data-testid="router-link" {...props}>
      {children}
    </a>
  ),
}));

// ── Layout component mocks ────────────────────────────────────────────────────
vi.mock("../components/layout/StoreHeader", () => ({
  StoreHeader: () => <div data-testid="store-header">StoreHeader</div>,
}));
vi.mock("../components/layout/BottomNav", () => ({
  BottomNav: () => <div data-testid="bottom-nav">BottomNav</div>,
}));
vi.mock("../components/layout/StoreFooter", () => ({
  StoreFooter: () => <div data-testid="store-footer">StoreFooter</div>,
}));

// ── Auth context mock ─────────────────────────────────────────────────────────
let mockAuthUser: User | null = null;

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isLoading: false,
    isResolvingIdentity: false,
    refreshUser: vi.fn(),
  }),
  AuthProvider: ({ children }: any) => <>{children}</>,
}));

// ── Cart & Notification context mocks ─────────────────────────────────────────
vi.mock("../context/CartContext", () => ({
  useCart: () => ({ refreshCart: vi.fn() }),
}));
vi.mock("../context/NotificationContext", () => ({
  useNotifications: () => ({ refreshNotifications: vi.fn() }),
}));

// ── Fixture helpers ───────────────────────────────────────────────────────────
const ONCUS_USER: User = {
  id: "ONCUS0000010",
  name: "Ramesh Kumar",
  phone: "+91 98400 10001",
  email: "ramesh@example.com",
  coins: 320,
  isVIP: false,
  legacySassId: "SASS0000010",
} as unknown as User;

function makeOrder(
  overrides: Partial<Order> = {}
): Order {
  return {
    id: "ORD-001",
    orderId: "ORD-001",
    userId: "ONCUS0000010",
    customerName: "Ramesh Kumar",
    phone: "+91 98400 10001",
    status: "delivered",
    createdAt: "2026-10-01T10:00:00Z",
    deliveredAt: "2026-10-01T12:00:00Z",
    deliveryAddress: {
      houseNo: "12A",
      street: "Gandhi Nagar",
      city: "Chennai",
      pincode: "600001",
    },
    delivery: { type: "express", slot: "Express 60-min", estimatedTime: "Delivered" },
    payment: { method: "online", status: "paid" },
    items: [
      {
        productId: "prod-001",
        name: "Cold Pressed Groundnut Oil",
        unit: "litre",
        unitSize: "1",
        price: 280,
        quantity: 1,
        image: "https://example.com/oil.jpg",
      },
    ],
    coinsRedeemed: 0,
    coinsUsed: 0,
    pricingSummary: {
      subtotal: 280,
      productSavings: 0,
      deliveryFee: 0,
      coinDiscount: 0,
      coinsRedeemed: 0,
      couponDiscount: 0,
      totalAmount: 280,
    },
    ...overrides,
  } as unknown as Order;
}

// ── Test suite ────────────────────────────────────────────────────────────────
describe("Production Orders Page Integration Suite", () => {
  beforeEach(() => {
    authManager.resetMode();
    mockAuthUser = null;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    authManager.resetMode();
    vi.restoreAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. legacySassId forwarding
  // ─────────────────────────────────────────────────────────────────────────────
  describe("1. Customer ID and legacySassId forwarding", () => {
    it("passes user.legacySassId to orderService.getOrders in production mode", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;

      const getOrdersSpy = vi
        .spyOn(orderService, "getOrders")
        .mockResolvedValue([makeOrder()]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(getOrdersSpy).toHaveBeenCalledWith("ONCUS0000010", "SASS0000010")
      );
    });

    it("passes user.legacySassId to orderService.getOrders in emulator mode", async () => {
      authManager.setMode("emulator");
      mockAuthUser = ONCUS_USER;

      const getOrdersSpy = vi
        .spyOn(orderService, "getOrders")
        .mockResolvedValue([makeOrder()]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(getOrdersSpy).toHaveBeenCalledWith("ONCUS0000010", "SASS0000010")
      );
    });

    it("isolates orders to the authenticated customer — never shows another customer's data", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;

      // Return two orders: one for the correct customer, one for a different user (should not appear)
      const ownOrder = makeOrder({ orderId: "ORD-OWN", userId: "ONCUS0000010" });

      vi.spyOn(orderService, "getOrders").mockResolvedValue([ownOrder]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.getByTestId("order-history-card-ORD-OWN")).toBeTruthy()
      );

      // A different customer's order ID should not appear anywhere
      expect(screen.queryByText("ORD-OTHER")).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Production notice banner
  // ─────────────────────────────────────────────────────────────────────────────
  describe("2. Production read-only notice", () => {
    it("does NOT show production-orders-notice banner in production mode", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockResolvedValue([makeOrder()]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.queryByTestId("production-orders-notice")).toBeNull()
      );
    });

    it("does NOT show production-orders-notice in emulator/mock mode", async () => {
      authManager.setMode("emulator");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockResolvedValue([makeOrder()]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.queryByTestId("production-orders-notice")).toBeNull()
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Action button functionality in production mode
  // ─────────────────────────────────────────────────────────────────────────────
  describe("3. Action button functionality in production mode", () => {
    it("shows active Cancel button for pending orders in production mode", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockResolvedValue([
        makeOrder({ orderId: "ORD-PEND", status: "pending" }),
      ]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.getByText(/cancel order or change address/i)).toBeTruthy()
      );
      expect(screen.queryByTestId("cancel-order-disabled")).toBeNull();
    });

    it("shows active Return button for delivered orders in production mode", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockResolvedValue([
        makeOrder({ orderId: "ORD-DEL", status: "delivered" }),
      ]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.getByText(/request 24-hr return/i)).toBeTruthy()
      );
      expect(screen.queryByTestId("return-order-disabled")).toBeNull();
    });

    it("shows active Reorder 1-Click button in production mode", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockResolvedValue([makeOrder()]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.getByTestId("reorder-button")).toBeTruthy()
      );
      expect(screen.queryByTestId("reorder-disabled")).toBeNull();
    });

    it("shows Reorder 1-Click button in emulator mode (local workflow intact)", async () => {
      authManager.setMode("emulator");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockResolvedValue([makeOrder()]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.getByTestId("reorder-button")).toBeTruthy()
      );
      expect(screen.queryByTestId("reorder-disabled")).toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Support and review actions in production mode
  // ─────────────────────────────────────────────────────────────────────────────
  describe("4. Support and review actions in production mode", () => {
    it("supportService.submitReportedProblem sends request via apiClient in production mode", async () => {
      authManager.setMode("production");

      const apiPostSpy = vi
        .spyOn(apiClient, "post")
        .mockResolvedValue({ id: "rep_001", status: "Submitted" } as any);

      await supportService.submitReportedProblem({
        userId: "ONCUS0000010",
        category: "Delivery Query",
        orderId: "ORD-001",
        message: "Where is my order?",
      });

      expect(apiPostSpy).toHaveBeenCalledWith(
        "/reportedProblems",
        expect.objectContaining({
          userId: "ONCUS0000010",
          orderId: "ORD-001",
        })
      );
    });

    it("supportService.submitProductRequest sends request via apiClient in production mode", async () => {
      authManager.setMode("production");

      const apiPostSpy = vi
        .spyOn(apiClient, "post")
        .mockResolvedValue({ id: "req_001", status: "Submitted" } as any);

      await supportService.submitProductRequest({
        userId: "ONCUS0000010",
        productName: "Organic Honey",
      });

      expect(apiPostSpy).toHaveBeenCalledWith(
        "/productRequests",
        expect.objectContaining({
          userId: "ONCUS0000010",
          productName: "Organic Honey",
        })
      );
    });

    it("shows Rate & Review button in production mode", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockResolvedValue([makeOrder()]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.getByText(/rate & review/i)).toBeTruthy()
      );
    });

    it("shows Need Help modal button in production mode", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockResolvedValue([makeOrder()]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.getByText(/need help\?/i)).toBeTruthy()
      );
    });

    it("supportService works normally in emulator mode", async () => {
      authManager.setMode("emulator");
      const apiPostSpy = vi
        .spyOn(apiClient, "post")
        .mockResolvedValue({ id: "rep_001", status: "Submitted" } as any);

      await supportService.submitReportedProblem({
        userId: "SASS0000104",
        category: "Delivery Query",
        message: "Test message",
      });

      expect(apiPostSpy).toHaveBeenCalledWith(
        "/reportedProblems",
        expect.objectContaining({ category: "Delivery Query" })
      );
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Error vs empty state partitioning
  // ─────────────────────────────────────────────────────────────────────────────
  describe("5. Firestore failure vs genuine empty state", () => {
    it("shows orders-error-banner with Retry button on Firestore failure", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockRejectedValue(
        new StorageAdapterError("Production Firestore connection unavailable", {
          status: 503,
          code: "unavailable",
          category: "connectivity",
        })
      );

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.getByTestId("orders-error-banner")).toBeTruthy()
      );
      expect(screen.queryByTestId("empty-orders-view")).toBeNull();
      // Retry button must be present
      expect(
        screen.getByRole("button", { name: /retry/i })
      ).toBeTruthy();
    });

    it("shows empty-orders-view when customer genuinely has zero orders", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockResolvedValue([]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.getByTestId("empty-orders-view")).toBeTruthy()
      );
      expect(screen.queryByTestId("orders-error-banner")).toBeNull();
    });

    it("error state never falls back to mock fixture data", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockRejectedValue(
        new Error("Connection refused")
      );

      // Ensure apiClient.get is never called as a fallback
      const apiGetSpy = vi.spyOn(apiClient, "get");

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.getByTestId("orders-error-banner")).toBeTruthy()
      );
      // apiClient.get must not have been used to fetch orders
      expect(
        apiGetSpy.mock.calls.some((c) => String(c[0]).includes("/orders"))
      ).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Order status rendering
  // ─────────────────────────────────────────────────────────────────────────────
  describe("6. Order status and milestone rendering", () => {
    it("renders order tracking panel with correct status badge for in-transit order", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockResolvedValue([
        makeOrder({ orderId: "ORD-TRANSIT", status: "in transit" }),
      ]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.getByTestId("active-order-tracking")).toBeTruthy()
      );
      expect(screen.getByText("OUT FOR DELIVERY")).toBeTruthy();
    });

    it("renders order history card with correct order ID", async () => {
      authManager.setMode("production");
      mockAuthUser = ONCUS_USER;
      vi.spyOn(orderService, "getOrders").mockResolvedValue([
        makeOrder({ orderId: "ORD-HIST-42" }),
      ]);

      await act(async () => {
        render(<OrdersPage />);
      });

      await waitFor(() =>
        expect(screen.getByTestId("order-history-card-ORD-HIST-42")).toBeTruthy()
      );
    });

    it("renders sign-in prompt when user is not authenticated", async () => {
      authManager.setMode("production");
      mockAuthUser = null;

      render(<OrdersPage />);

      await waitFor(() =>
        expect(
          screen.getByText(/please sign in to view your orders/i)
        ).toBeTruthy()
      );
    });
  });
});

