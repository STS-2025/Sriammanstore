import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  notificationService,
  type NotificationPreferences,
} from "../services/notificationService";
import { authManager } from "../services/authAdapter";
import { useAuth } from "./AuthContext";
import type { NotificationItem } from "../types";

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  preferences: NotificationPreferences;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const ORDER_STATUS_POLL_INTERVAL_MS = 10000;

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const customerId = (user?.userId || user?.id || "").trim();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    notificationService.getPreferences(customerId || "SASS0000104")
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeCustomerRef = useRef<string>(customerId);
  activeCustomerRef.current = customerId;

  const loadCustomerNotifications = useCallback(
    async (reconcileOrders = true) => {
      if (!customerId) {
        setNotifications([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        if (reconcileOrders) {
          await notificationService
            .reconcileOrderStatuses(customerId)
            .catch((reconcileErr) => {
              console.error(
                "Order status reconciliation warning:",
                reconcileErr
              );
            });
        }

        const list = await notificationService.getNotifications(
          customerId,
          user?.legacySassId
        );
        // Guard against stale response if customer switched or logged out mid-flight
        if (activeCustomerRef.current !== customerId) {
          return;
        }
        setNotifications(list || []);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load notifications:", err);
        if (activeCustomerRef.current === customerId) {
          setError(
            err?.message || "Unable to load notifications from the server."
          );
        }
      } finally {
        if (activeCustomerRef.current === customerId) {
          setIsLoading(false);
        }
      }
    },
    [customerId]
  );

  const refreshNotifications = useCallback(async () => {
    await loadCustomerNotifications(true);
  }, [loadCustomerNotifications]);

  // Initial load and session switch cleanup
  useEffect(() => {
    if (!customerId) {
      setNotifications([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setPreferences(notificationService.getPreferences(customerId));
    loadCustomerNotifications(true);
  }, [customerId, loadCustomerNotifications]);

  // Subscribe to in-process notification events (order creation, status transitions, read updates)
  useEffect(() => {
    if (!customerId) return;

    const unsubscribe = notificationService.subscribe(() => {
      loadCustomerNotifications(false);
    });

    return () => {
      unsubscribe();
    };
  }, [customerId, loadCustomerNotifications]);

  // Lifecycle-aware polling for external order status changes while page is visible
  useEffect(() => {
    if (!customerId || typeof window === "undefined") return;

    const pollIfVisible = () => {
      if (
        typeof document === "undefined" ||
        document.visibilityState === "visible"
      ) {
        loadCustomerNotifications(true);
      }
    };

    const intervalId = window.setInterval(
      pollIfVisible,
      ORDER_STATUS_POLL_INTERVAL_MS
    );

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadCustomerNotifications(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", pollIfVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", pollIfVisible);
    };
  }, [customerId, loadCustomerNotifications]);

  const markAsRead = async (id: string) => {
    if (!customerId) return;

    if (authManager.getMode() === "production") {
      console.warn("NotificationContext: markAsRead ignored in production read-only mode.");
      return;
    }

    // Optimistic local state update scoped to current customer
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id && n.userId === customerId ? { ...n, read: true } : n
      )
    );

    try {
      await notificationService.markAsRead(id, customerId);
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
      await loadCustomerNotifications(false);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    if (!customerId) return;

    if (authManager.getMode() === "production") {
      console.warn("NotificationContext: markAllAsRead ignored in production read-only mode.");
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.userId === customerId ? { ...n, read: true } : n))
    );

    try {
      await notificationService.markAllAsRead(customerId);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
      await loadCustomerNotifications(false);
      throw err;
    }
  };

  const handleUpdatePreferences = (prefs: Partial<NotificationPreferences>) => {
    if (!customerId) return;
    const updated = notificationService.updatePreferences(customerId, prefs);
    setPreferences(updated);
  };

  const unreadCount = notifications.filter(
    (n) => n.userId === customerId && !n.read
  ).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        preferences,
        markAsRead,
        markAllAsRead,
        updatePreferences: handleUpdatePreferences,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
