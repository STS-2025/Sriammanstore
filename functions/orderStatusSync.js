"use strict";

const SUPPORTED_STATUSES = new Set([
  "pending",
  "processing",
  "packed",
  "in transit",
  "delivered",
  "cancelled",
  "returned",
]);

function normalizeCustomerId(value) {
  const customerId = String(value || "").trim();
  if (/^SASS/i.test(customerId)) {
    return `ONCUS${customerId.slice(4)}`;
  }
  return customerId;
}

function normalizeStatusSlug(status) {
  return status.trim().toLowerCase().replace(/\s+/g, "_");
}

function createOrderStatusSyncHandler({ db }) {
  return async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    const orderId = event.params?.orderId;
    if (!before || !after || !orderId) return;

    const previousStatus = String(before.status || "").trim().toLowerCase();
    const newStatus = String(after.status || "").trim().toLowerCase();
    if (!SUPPORTED_STATUSES.has(newStatus)) return;
    const statusChanged = previousStatus !== newStatus;
    const shouldNotify = statusChanged && SUPPORTED_STATUSES.has(previousStatus);

    const customerId = normalizeCustomerId(
      after.customerId || after.userId || after.buyerId
    );
    if (!/^ONCUS\d{6,7}$/i.test(customerId)) return;

    const canonicalOrderId = String(after.orderId || orderId);
    const statusSlug = normalizeStatusSlug(newStatus);
    const orderRef = db.doc(`onlineCustomers/${customerId}/orders/${orderId}`);
    const now = new Date().toISOString();
    const notificationId = `notif_order_status_${canonicalOrderId}_${statusSlug}`;
    const notificationRef = shouldNotify
      ? db.doc(`notifications/${notificationId}`)
      : null;
    const customerNotificationRef = shouldNotify
      ? db.doc(`onlineCustomers/${customerId}/notifications/${notificationId}`)
      : null;
    const notification = shouldNotify
      ? {
          id: notificationId,
          userId: customerId,
          category: "orders",
          type: "order_status_changed",
          eventKey: `order_status:${customerId}:${canonicalOrderId}:${statusSlug}`,
          orderId: canonicalOrderId,
          previousStatus,
          newStatus,
          badge: `ORDER UPDATE • #${canonicalOrderId}`,
          title: `Order #${canonicalOrderId} status updated`,
          message: `Your order status changed from ${previousStatus} to ${newStatus}.`,
          ctaText: "View Order Details →",
          actionUrl: `/orders?id=${canonicalOrderId}`,
          read: false,
          timestamp: now,
        }
      : null;

    await db.runTransaction(async (transaction) => {
      const existingNotification = notificationRef
        ? await transaction.get(notificationRef)
        : null;
      transaction.set(orderRef, {
        ...after,
        id: orderId,
        orderId: canonicalOrderId,
        updatedAt: after.updatedAt || now,
      }, { merge: true });

      if (notification && !existingNotification?.exists) {
        transaction.set(notificationRef, notification);
        transaction.set(customerNotificationRef, notification);
      }
    });
  };
}

module.exports = { createOrderStatusSyncHandler };
