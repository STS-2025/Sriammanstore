import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { authManager } from "../services/authAdapter";
import { authService } from "../services/authService";
import { notificationService } from "../services/notificationService";
import {
  productionNotificationReader,
  setProductionNotificationReaderOverride,
  normalizeLegacyNotificationDocument,
} from "../services/productionNotificationReader";
import { apiClient } from "../services/apiClient";
import { StorageAdapterError } from "../services/firestoreAdapter";
import { NotificationsPage } from "../routes/notifications";
import { NotificationProvider } from "../context/NotificationContext";
import { AuthProvider } from "../context/AuthContext";
import type { NotificationItem, User } from "../types";

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

describe("Production Notifications Integration Suite", () => {
  beforeEach(() => {
    authManager.resetMode();
    setProductionNotificationReaderOverride(null);
    mockAuthUser = null;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    authManager.resetMode();
    setProductionNotificationReaderOverride(null);
    vi.restoreAllMocks();
  });

  describe("1. Environment-Aware Service Routing", () => {
    it("routes getNotifications to productionNotificationReader in production auth mode", async () => {
      authManager.setMode("production");
      expect(authManager.getMode()).toBe("production");

      const mockNotifications: NotificationItem[] = [
        {
          id: "notif_prod_001",
          userId: "SASS0000104",
          category: "orders",
          type: "order_created",
          eventKey: "order_created:SASS0000104:ORD-001",
          orderId: "ORD-001",
          title: "Order #ORD-001 Placed",
          message: "Your organic cold-pressed oil order has been confirmed.",
          timestamp: "2026-10-23T10:00:00Z",
          read: false,
        },
      ];

      const prodSpy = vi.fn().mockResolvedValue(mockNotifications);
      setProductionNotificationReaderOverride({
        getCustomerNotifications: prodSpy,
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      const result = await notificationService.getNotifications("SASS0000104");

      expect(prodSpy).toHaveBeenCalledTimes(1);
      expect(prodSpy).toHaveBeenCalledWith("SASS0000104");
      expect(apiGetSpy).not.toHaveBeenCalled();
      expect(result).toEqual(mockNotifications);
    });

    it("resolves canonical ONCUS customer ID and passes legacySassId for approved migrated accounts", async () => {
      authManager.setMode("production");

      const prodSpy = vi.fn().mockResolvedValue([]);
      setProductionNotificationReaderOverride({
        getCustomerNotifications: prodSpy,
      });

      await notificationService.getNotifications("SASS0000010");

      expect(prodSpy).toHaveBeenCalledWith(
        "ONCUS0000010",
        "SASS0000010"
      );
    });

    it("preserves local apiClient routing in emulator mode", async () => {
      authManager.setMode("emulator");

      const mockEmulatorNotifications: NotificationItem[] = [
        {
          id: "emu_notif_1",
          userId: "SASS0000104",
          category: "account",
          title: "Welcome to Sri Amman Store",
          message: "Thank you for creating an account with us.",
          timestamp: "2026-10-01T12:00:00Z",
          read: true,
        },
      ];

      const apiGetSpy = vi
        .spyOn(apiClient, "get")
        .mockResolvedValue(mockEmulatorNotifications);

      const prodSpy = vi.fn();
      setProductionNotificationReaderOverride({
        getCustomerNotifications: prodSpy,
      });

      const result = await notificationService.getNotifications("SASS0000104");

      expect(prodSpy).not.toHaveBeenCalled();
      expect(apiGetSpy).toHaveBeenCalledWith("/notifications", {
        userId: "SASS0000104",
      });
      expect(result).toEqual(mockEmulatorNotifications);
    });
  });

  describe("2. Customer ID Validation & Isolation", () => {
    it("validates canonical customer IDs and rejects malformed IDs in production reader", () => {
      expect(productionNotificationReader.assertValidCustomer("SASS0000104")).toBe(
        "SASS0000104"
      );
      expect(productionNotificationReader.assertValidCustomer("ONCUS0000010")).toBe(
        "ONCUS0000010"
      );
      expect(productionNotificationReader.assertValidCustomer("SASS000010")).toBe(
        "SASS000010"
      );
      expect(productionNotificationReader.assertValidCustomer("ONCUS000010")).toBe(
        "ONCUS000010"
      );

      expect(() =>
        productionNotificationReader.assertValidCustomer("invalid_id")
      ).toThrow(StorageAdapterError);
      expect(() =>
        productionNotificationReader.assertValidCustomer("guest_session")
      ).toThrow(StorageAdapterError);
      expect(() =>
        productionNotificationReader.assertValidCustomer("")
      ).toThrow(StorageAdapterError);
    });

    it("returns empty array for empty or unauthenticated customer ID", async () => {
      authManager.setMode("production");
      const result = await notificationService.getNotifications("");
      expect(result).toEqual([]);
    });
  });

  describe("3. Document Normalization & Legacy Schema Mapping", () => {
    it("normalizes a complete legacy order notification document", () => {
      const rawDoc = {
        title: "Order #ORD-101 Packed",
        body: "Your order has been freshly packed and verified.",
        orderId: "ORD-101",
        read: false,
        type: "order_status_changed",
        previousStatus: "processing",
        newStatus: "packed",
        badge: "ORDER PACKED",
        createdAt: "2026-10-23T08:00:00Z",
      };

      const normalized = normalizeLegacyNotificationDocument(
        "notif_pack_101",
        rawDoc,
        "SASS0000104"
      );

      expect(normalized).not.toBeNull();
      expect(normalized?.id).toBe("notif_pack_101");
      expect(normalized?.userId).toBe("SASS0000104");
      expect(normalized?.title).toBe("Order #ORD-101 Packed");
      expect(normalized?.message).toBe(
        "Your order has been freshly packed and verified."
      );
      expect(normalized?.read).toBe(false);
      expect(normalized?.category).toBe("orders");
      expect(normalized?.type).toBe("order_status_changed");
      expect(normalized?.actionUrl).toBe("/orders?id=ORD-101");
      expect(normalized?.orderId).toBe("ORD-101");
      expect(normalized?.previousStatus).toBe("processing");
      expect(normalized?.newStatus).toBe("packed");
      expect(normalized?.badge).toBe("ORDER PACKED");
    });

    it("filters out soft-deleted notifications with deleted: true", () => {
      const rawDoc = {
        title: "Old announcement",
        body: "This notification has been soft-deleted.",
        deleted: true,
      };

      const normalized = normalizeLegacyNotificationDocument(
        "notif_del_1",
        rawDoc,
        "SASS0000104"
      );
      expect(normalized).toBeNull();
    });

    it("handles Firestore Timestamp objects with toDate()", () => {
      const mockDate = new Date("2026-10-20T14:30:00Z");
      const rawDoc = {
        title: "Coins Credited",
        message: "You received 50 Amman Coins.",
        category: "rewards",
        createdAt: {
          toDate: () => mockDate,
        },
      };

      const normalized = normalizeLegacyNotificationDocument(
        "notif_coins_1",
        rawDoc,
        "SASS0000104"
      );
      expect(normalized).not.toBeNull();
      expect(normalized?.timestamp).toBe("2026-10-20T14:30:00.000Z");
    });
  });

  describe("4. Mutation Safety Invariants in Production Mode", () => {
    it("allows createNotification in production mode", async () => {
      authManager.setMode("production");

      const notif = await notificationService.createNotification({
        userId: "SASS0000104",
        category: "account",
        title: "Test",
        message: "Active in prod",
      });
      expect(notif).toBeDefined();
      expect(notif.userId).toBe("SASS0000104");
    });

    it("allows markAsRead in production mode", async () => {
      authManager.setMode("production");
      const notif = await notificationService.createNotification({
        userId: "SASS0000104",
        category: "account",
        title: "Test",
        message: "Active in prod",
      });

      setProductionNotificationReaderOverride({
        getCustomerNotifications: vi.fn().mockResolvedValue([notif]),
        markAsRead: vi.fn().mockResolvedValue({ ...notif, read: true }),
      });

      await expect(
        notificationService.markAsRead(notif.id, "SASS0000104")
      ).resolves.not.toThrow();
    });

    it("allows markAllAsRead in production mode", async () => {
      authManager.setMode("production");

      await expect(
        notificationService.markAllAsRead("SASS0000104")
      ).resolves.not.toThrow();
    });

    it("performs safe in-memory observation in reconcileOrderStatuses without writing to Firestore in production mode", async () => {
      authManager.setMode("production");

      const createSpy = vi.spyOn(
        notificationService,
        "createOrderStatusNotification"
      );

      const orders: any[] = [
        {
          orderId: "ORD-999",
          userId: "SASS0000104",
          status: "in transit",
        },
      ];

      const result = await notificationService.reconcileOrderStatuses(
        "SASS0000104",
        orders
      );

      expect(createSpy).not.toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(
        notificationService.getObservedOrderStatus("SASS0000104", "ORD-999")
      ).toBe("in transit");
    });
  });

  describe("5. Read Failure vs Genuine Empty Separation", () => {
    it("returns genuinely empty list without error when no notifications exist", async () => {
      authManager.setMode("production");

      setProductionNotificationReaderOverride({
        getCustomerNotifications: vi.fn().mockResolvedValue([]),
      });

      const result = await notificationService.getNotifications("SASS0000104");
      expect(result).toEqual([]);
    });

    it("throws StorageAdapterError on Firestore permission-denied without silent fallback", async () => {
      authManager.setMode("production");

      const permissionError = new StorageAdapterError(
        "Permission denied for users/SASS0000104/notifications",
        {
          status: 403,
          code: "permission-denied",
          category: "permission",
        }
      );

      setProductionNotificationReaderOverride({
        getCustomerNotifications: vi.fn().mockRejectedValue(permissionError),
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      await expect(
        notificationService.getNotifications("SASS0000104")
      ).rejects.toThrow(/Permission denied/);

      expect(apiGetSpy).not.toHaveBeenCalled();
    });
  });

  describe("6. Notifications UI Integration", () => {
    const mockUser: User = {
      id: "SASS0000104",
      userId: "SASS0000104",
      name: "Velmurugan Test",
      email: "vel@sriammanstore.com",
      phone: "+91 98402 12345",
      coins: 120,
      isVIP: false,
      referralCode: "SASS0000104",
      createdAt: "2026-01-01T00:00:00Z",
    };

    it("enables mark-all-read-btn and does not display production notice banner in production mode", async () => {
      authManager.setMode("production");
      mockAuthUser = mockUser;
      vi.spyOn(authService, "getCurrentUser").mockReturnValue(mockUser);

      setProductionNotificationReaderOverride({
        getCustomerNotifications: vi.fn().mockResolvedValue([
          {
            id: "notif_prod_01",
            userId: "SASS0000104",
            category: "orders",
            title: "Live Order Out for Delivery",
            message: "Your oil order is on the delivery truck.",
            timestamp: "2026-10-23T11:00:00Z",
            read: false,
          },
        ]),
      });

      render(
        <AuthProvider>
          <NotificationProvider>
            <NotificationsPage />
          </NotificationProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(
          screen.queryByTestId("production-notifications-notice")
        ).not.toBeInTheDocument();
      });

      const markAllBtn = screen.getByTestId("mark-all-read-btn");
      expect(markAllBtn).not.toBeDisabled();
    });

    it("marks an unread notification as read when its card is clicked in production mode", async () => {
      authManager.setMode("production");
      mockAuthUser = mockUser;
      vi.spyOn(authService, "getCurrentUser").mockReturnValue(mockUser);
      let markedRead = false;
      const markRead = vi.fn(async () => {
        markedRead = true;
        return {
          id: "notif_prod_click",
          userId: "SASS0000104",
          category: "orders" as const,
          title: "Order update",
          message: "Your order is being prepared.",
          timestamp: "2026-10-23T11:00:00Z",
          read: true,
        };
      });

      setProductionNotificationReaderOverride({
        getCustomerNotifications: vi.fn().mockImplementation(async () => [
          {
            id: "notif_prod_click",
            userId: "SASS0000104",
            category: "orders",
            title: "Order update",
            message: "Your order is being prepared.",
            timestamp: "2026-10-23T11:00:00Z",
            read: markedRead,
          },
        ]),
        markAsRead: markRead,
      });

      render(
        <AuthProvider>
          <NotificationProvider>
            <NotificationsPage />
          </NotificationProvider>
        </AuthProvider>
      );

      const card = await screen.findByText("Order update");
      fireEvent.click(card);

      await waitFor(() => {
        expect(markRead).toHaveBeenCalledWith(
          "SASS0000104",
          "notif_prod_click",
          undefined
        );
        expect(screen.queryByText("1 Unread")).not.toBeInTheDocument();
      });
    });

    it("displays empty-notifications-view when notification list is genuinely empty", async () => {
      authManager.setMode("production");
      mockAuthUser = mockUser;
      vi.spyOn(authService, "getCurrentUser").mockReturnValue(mockUser);

      setProductionNotificationReaderOverride({
        getCustomerNotifications: vi.fn().mockResolvedValue([]),
      });

      render(
        <AuthProvider>
          <NotificationProvider>
            <NotificationsPage />
          </NotificationProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("empty-notifications-view")
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/No Notifications in this Category/i)
      ).toBeInTheDocument();
    });

    it("displays notifications-error-banner with Retry button when reading fails", async () => {
      authManager.setMode("production");
      mockAuthUser = mockUser;
      vi.spyOn(authService, "getCurrentUser").mockReturnValue(mockUser);

      setProductionNotificationReaderOverride({
        getCustomerNotifications: vi
          .fn()
          .mockRejectedValue(
            new Error("Production Firestore connection unavailable")
          ),
      });

      render(
        <AuthProvider>
          <NotificationProvider>
            <NotificationsPage />
          </NotificationProvider>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId("notifications-error-banner")
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Production Firestore connection unavailable/i)
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
    });
  });
});
