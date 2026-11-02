import { describe, it, expect, beforeEach } from "vitest";
import { apiClient } from "../services/apiClient";
import { notificationService } from "../services/notificationService";
import type { NotificationItem, User } from "../types";

describe("Feature 5: Notifications Integration under onlineCustomers", () => {
  const customerId = "ONCUS0000010";

  const mockUser: User = {
    id: customerId,
    userId: customerId,
    name: "Notifications Customer",
    phone: "+91 98400 55667",
    email: "notif.test@amman.com",
    smartCoins: 100,
    phoneVerified: true,
    verifiedPhone: "+919840055667",
    isVIP: false,
    referralCode: "REFNOTIF",
    createdAt: new Date().toISOString(),
  };

  beforeEach(async () => {
    await apiClient.post("/onlineCustomers", mockUser);
  });

  it("creates a coin notification when Smart Coins are earned or redeemed", async () => {
    const notif = await notificationService.createCoinNotification({
      userId: customerId,
      amount: 25,
      type: "earned",
      orderId: "ORD-0005555",
    });

    expect(notif).toBeDefined();
    expect(notif.userId).toBe(customerId);
    expect(notif.category).toBe("rewards");
    expect(notif.type).toBe("coins_credited");
    expect(notif.title).toContain("Smart Coins Earned");
    expect(notif.message).toContain("25 Smart Coins");
    expect(notif.orderId).toBe("ORD-0005555");
    expect(notif.read).toBe(false);

    // Verify subcollection retrieval
    const retrieved = await apiClient.get<NotificationItem>(
      `/onlineCustomers/${customerId}/notifications/${notif.id}`
    );
    expect(retrieved).toBeDefined();
    expect(retrieved.id).toBe(notif.id);
  });

  it("creates a phone verified notification upon successful OTP verification", async () => {
    const notif = await notificationService.createPhoneVerifiedNotification({
      userId: customerId,
      phone: "+91 98400 55667",
    });

    expect(notif).toBeDefined();
    expect(notif.userId).toBe(customerId);
    expect(notif.category).toBe("account");
    expect(notif.title).toContain("Mobile Number Verified");
    expect(notif.message).toContain("+91 98400 55667");
    expect(notif.read).toBe(false);

    const retrieved = await apiClient.get<NotificationItem>(
      `/onlineCustomers/${customerId}/notifications/${notif.id}`
    );
    expect(retrieved).toBeDefined();
    expect(retrieved.title).toContain("Mobile Number Verified");
  });

  it("supports marking a notification as read", async () => {
    const notif = await notificationService.createCoinNotification({
      userId: customerId,
      amount: 10,
      type: "redeemed",
      orderId: "ORD-0006666",
    });

    expect(notif.read).toBe(false);

    const marked = await notificationService.markAsRead(notif.id, customerId);
    expect(marked).toBeDefined();
    expect(marked.read).toBe(true);

    const updated = await apiClient.get<NotificationItem>(
      `/onlineCustomers/${customerId}/notifications/${notif.id}`
    );
    expect(updated.read).toBe(true);
  });
});
