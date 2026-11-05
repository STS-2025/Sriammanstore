import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { toast } from "sonner";
import { BottomNav } from "../components/layout/BottomNav";
import { OrderProductImage } from "../components/product/OrderProductImage";
import { StoreFooter } from "../components/layout/StoreFooter";
import { StoreHeader } from "../components/layout/StoreHeader";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationContext";
import { orderService } from "../services/orderService";
import { supportService } from "../services/supportService";
import type { Order, OrderStatus } from "../types";

type OrdersFilter = "all" | "active" | "delivered" | "cancelled";
type TimelineState = "completed" | "current" | "pending";

interface TimelineEntry {
  key: string;
  label: string;
  state: TimelineState;
  timestamp?: string;
}

const ORDER_STAGES = [
  { key: "placed", label: "Order Placed", fields: ["createdAt", "timestamp", "orderDate"] },
  { key: "confirmed", label: "Order Confirmed", fields: ["confirmedAt", "orderConfirmedAt"] },
  { key: "processing", label: "Processing / Packed", fields: ["processingAt", "packedAt", "preparedAt"] },
  { key: "dispatched", label: "Dispatched", fields: ["dispatchedAt", "dispatchAt", "shippedAt"] },
  { key: "out_for_delivery", label: "Out for Delivery", fields: ["outForDeliveryAt", "out_for_delivery_at"] },
  { key: "delivered", label: "Delivered", fields: ["deliveredAt", "deliveryTime"] },
] as const;

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "processing", "packed", "in transit"];

export const Route = createFileRoute("/orders")({
  validateSearch: (search: Record<string, unknown>) => ({
    placed: typeof search["placed"] === "string" ? search["placed"] : undefined,
    id: typeof search["id"] === "string" ? search["id"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "My Orders — Sri Amman Smart Store" },
      { name: "description", content: "View your orders, order details, and delivery progress." },
    ],
  }),
  component: OrdersPage,
});

function formatDate(value?: string, withTime = false): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (date.toISOString() === "1970-01-01T00:00:00.000Z") return null;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

function rawOrder(order: Order): Record<string, unknown> {
  return order.rawOrder && typeof order.rawOrder === "object" ? order.rawOrder : {};
}

function timestampValue(value: unknown): string | undefined {
  let date: Date;
  if (typeof value === "object" && value !== null) {
    const timestamp = value as { seconds?: unknown; _seconds?: unknown; toDate?: () => Date };
    if (typeof timestamp.toDate === "function") date = timestamp.toDate();
    else {
      const seconds = typeof timestamp.seconds === "number" ? timestamp.seconds : timestamp._seconds;
      if (typeof seconds !== "number") return undefined;
      date = new Date(seconds * 1000);
    }
  } else if (typeof value === "string" || typeof value === "number") {
    date = new Date(value);
  } else {
    return undefined;
  }
  if (Number.isNaN(date.getTime())) return undefined;
  const isoDate = date.toISOString();
  return isoDate === "1970-01-01T00:00:00.000Z" ? undefined : isoDate;
}

function readStageTimestamp(order: Order, stageIndex: number): string | undefined {
  const raw = rawOrder(order);
  if (stageIndex === 0) {
    const placedAt = timestampValue(order.createdAt) || timestampValue(raw["timestamp"] || raw["orderDate"] || raw["date"]);
    if (placedAt) return placedAt;
  }
  if (stageIndex === 5) {
    const deliveredAt = timestampValue(order.deliveredAt) || timestampValue(raw["deliveredAt"] || raw["deliveryTime"]);
    if (deliveredAt) return deliveredAt;
  }
  for (const field of ORDER_STAGES[stageIndex]?.fields || []) {
    const timestamp = timestampValue(raw[field]);
    if (timestamp) return timestamp;
  }

  const history = raw["statusHistory"] || raw["timeline"];
  if (Array.isArray(history)) {
    for (const entry of history) {
      if (!entry || typeof entry !== "object") continue;
      const item = entry as Record<string, unknown>;
      const status = String(item["status"] || item["stage"] || "").toLowerCase().replace(/[_-]+/g, " ");
      const mappedIndex = status.includes("confirm")
        ? 1
        : status.includes("process") || status.includes("pack") || status.includes("prepar")
          ? 2
          : status.includes("dispatch") || status.includes("ship")
            ? 3
            : status.includes("out for delivery")
              ? 4
              : status.includes("deliver") || status === "completed"
                ? 5
                : -1;
      if (mappedIndex === stageIndex) {
        const found = timestampValue(item["timestamp"] || item["createdAt"] || item["date"] || item["at"]);
        if (found) return found;
      }
    }
  }
  return undefined;
}

function isFailedOrder(order: Order): boolean {
  const status = `${order.rawStatus || ""} ${String(rawOrder(order)["status"] || "")}`.toLowerCase();
  return status.includes("fail") || status.includes("reject");
}

function isRefundedOrder(order: Order): boolean {
  const status = `${order.rawStatus || ""} ${String(rawOrder(order)["status"] || "")} ${order.payment?.status || ""}`.toLowerCase();
  return status.includes("refund");
}

function getOrderStatusMessage(order: Order): string {
  if (isRefundedOrder(order)) {
    const paymentStatus = order.payment?.status?.trim();
    return paymentStatus && paymentStatus.toLowerCase().includes("refund")
      ? `Refund status: ${paymentStatus}.`
      : "This order has been marked as refunded.";
  }
  if (isFailedOrder(order)) return "This order could not be completed.";
  if (order.status === "pending") {
    const status = `${order.rawStatus || ""} ${String(rawOrder(order)["status"] || "")}`.toLowerCase();
    return status.includes("confirm") ? "Your order has been confirmed." : "Your order has been placed and is awaiting confirmation.";
  }
  if (order.status === "processing") return "Your order is being prepared.";
  if (order.status === "packed") return "Your order has been packed and is awaiting dispatch.";
  if (order.status === "in transit") {
    const status = `${order.rawStatus || ""} ${String(rawOrder(order)["status"] || "")}`.toLowerCase();
    if (status.includes("out for delivery")) return "Your order is on its way for delivery.";
    if (status.includes("dispatch") || status.includes("ship")) return "Your order has been dispatched.";
    return "Your order is in transit.";
  }
  if (order.status === "delivered") return "Your order was delivered successfully.";
  if (order.status === "cancelled") return "This order has been cancelled.";
  if (order.status === "returned") return "This order has been returned.";
  return "Order status updated.";
}

function getDisplayStatus(order: Order): string {
  if (isFailedOrder(order)) return "Failed";
  if (isRefundedOrder(order)) return "Refunded";
  if (order.status === "in transit" && order.rawStatus?.toLowerCase().includes("out for delivery")) {
    return "Out for Delivery";
  }
  return order.status.replace(/\b\w/g, (character) => character.toUpperCase());
}

export function buildOrderTimeline(order: Order): TimelineEntry[] {
  const rawStatus = String(order.rawStatus || rawOrder(order)["status"] || "").toLowerCase().replace(/[_-]+/g, " ");
  const failed = isFailedOrder(order);
  const refunded = isRefundedOrder(order);
  const exceptional = failed || order.status === "cancelled" || order.status === "returned";
  let currentIndex = 0;

  if (order.status === "pending") currentIndex = rawStatus.includes("confirm") ? 1 : 0;
  if (order.status === "processing") currentIndex = 2;
  if (order.status === "packed") currentIndex = 2;
  if (order.status === "in transit") currentIndex = rawStatus.includes("out for delivery") ? 4 : 3;
  if (order.status === "delivered") currentIndex = 5;
  if (order.status === "returned" && !refunded) currentIndex = 5;

  const history = rawOrder(order)["statusHistory"] || rawOrder(order)["timeline"];
  if (exceptional && Array.isArray(history)) {
    for (const entry of history) {
      if (!entry || typeof entry !== "object") continue;
      const status = String((entry as Record<string, unknown>)["status"] || (entry as Record<string, unknown>)["stage"] || "").toLowerCase().replace(/[_-]+/g, " ");
      const reached = status.includes("confirm")
        ? 1
        : status.includes("process") || status.includes("pack")
          ? 2
          : status.includes("dispatch") || status.includes("ship")
            ? 3
            : status.includes("out for delivery")
              ? 4
              : status.includes("deliver")
                ? 5
                : -1;
      currentIndex = Math.max(currentIndex, reached);
    }
  }

  const entries: TimelineEntry[] = ORDER_STAGES.map((stage, index) => {
    let state: TimelineState;
    if (exceptional) {
      state = index === 0 || index <= currentIndex ? "completed" : "pending";
    } else if (order.status === "delivered") {
      state = "completed";
    } else if (index < currentIndex) {
      state = "completed";
    } else if (index === currentIndex) {
      state = "current";
    } else {
      state = "pending";
    }
    return {
      key: stage.key,
      label: stage.label,
      state,
      ...(readStageTimestamp(order, index) ? { timestamp: readStageTimestamp(order, index)! } : {}),
    };
  });

  if (exceptional) {
    const terminalLabel = failed ? "Failed" : refunded ? "Refunded" : order.status === "returned" ? "Returned" : "Cancelled";
    const raw = rawOrder(order);
    const terminalTimestamp = timestampValue(
      raw[failed ? "failedAt" : refunded ? "refundedAt" : order.status === "returned" ? "returnedAt" : "cancelledAt"]
    ) || timestampValue(order.cancelledAt);
    entries.push({
      key: "terminal",
      label: terminalLabel,
      state: "current",
      ...(terminalTimestamp ? { timestamp: terminalTimestamp } : {}),
    });
  }
  return entries;
}

function statusClasses(order: Order): string {
  if (order.status === "delivered") return "bg-emerald-100 text-emerald-800";
  if (order.status === "cancelled" || order.status === "returned") return "bg-rose-100 text-rose-800";
  if (order.status === "in transit") return "bg-blue-100 text-blue-800";
  return "bg-amber-100 text-amber-900";
}

function canRequestReturn(order: Order): boolean {
  if (order.status !== "delivered" || !order.deliveredAt) return false;
  const deliveredAt = new Date(order.deliveredAt).getTime();
  const elapsed = Date.now() - deliveredAt;
  return !Number.isNaN(deliveredAt) && elapsed >= 0 && elapsed <= 24 * 60 * 60 * 1000;
}

function money(value: number | undefined): string {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export function OrdersPage() {
  const search = useSearch({ from: "/orders" });
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isResolvingIdentity, refreshUser } = useAuth();
  const { refreshCart } = useCart();
  const { refreshNotifications } = useNotifications();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<OrdersFilter>("all");
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpCategory, setHelpCategory] = useState("Delivery Query");
  const [helpMessage, setHelpMessage] = useState("");
  const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setOrdersError(null);
    try {
      const loadedOrders = await orderService.getOrders(user.id, user.legacySassId);
      setOrders(loadedOrders || []);
    } catch (error) {
      console.error("Failed to load orders:", error);
      setOrdersError(error instanceof Error ? error.message : "Failed to load orders. Please retry.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) void loadOrders();
    else if (!authLoading && !isResolvingIdentity) setLoading(false);
  }, [user, authLoading, isResolvingIdentity, loadOrders]);

  const activeOrdersCount = useMemo(() => orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length, [orders]);
  const deliveredOrdersCount = useMemo(() => orders.filter((order) => order.status === "delivered").length, [orders]);
  const cancelledOrdersCount = useMemo(() => orders.filter((order) => order.status === "cancelled" || order.status === "returned").length, [orders]);
  const selectedOrderId = search.id || "";
  const selectedOrder = useMemo(
    () => selectedOrderId ? orders.find((order) => order.orderId === selectedOrderId) || null : null,
    [orders, selectedOrderId]
  );
  const filteredOrders = useMemo(() => orders.filter((order) => {
    if (activeFilter === "active") return ACTIVE_STATUSES.includes(order.status);
    if (activeFilter === "delivered") return order.status === "delivered";
    if (activeFilter === "cancelled") return order.status === "cancelled" || order.status === "returned";
    return true;
  }), [orders, activeFilter]);

  const openOrder = (orderId: string) => {
    void navigate({ to: "/orders", search: { id: orderId } as any });
  };
  const backToOrders = () => {
    void navigate({ to: "/orders", search: {} as any });
  };

  const handleCancelOrder = async (order: Order) => {
    if (!window.confirm(`Cancel order #${order.orderId}?`)) return;
    try {
      await orderService.cancelOrder(order.orderId, user?.id);
      await refreshUser();
      await refreshNotifications();
      toast.success(`Order #${order.orderId} cancelled`);
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel this order");
    }
  };

  const handleReturnRequest = async (order: Order) => {
    try {
      await orderService.requestReturn(order.orderId, user?.id);
      toast.success(`Return request for order #${order.orderId} submitted`);
      await loadOrders();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not request a return");
    }
  };

  const handleReorder = async (order: Order) => {
    if (!user) return;
    setIsReordering(true);
    try {
      const result = await orderService.reorder(order, user.id);
      await refreshCart();
      if (result.addedCount > 0) {
        toast.success(`Added ${result.addedCount} item${result.addedCount === 1 ? "" : "s"} to your cart${result.unavailableCount ? `; ${result.unavailableCount} unavailable` : ""}.`);
        void navigate({ to: "/cart" });
      } else {
        toast.error("None of the products in this order are currently available.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not reorder this order");
    } finally {
      setIsReordering(false);
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Allow pop-ups to print or save this invoice.");
      return;
    }
    const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character));
    printWindow.document.write(`<!doctype html><html><head><title>Order ${escapeHtml(order.orderId)} invoice</title><style>body{font:14px Arial,sans-serif;max-width:800px;margin:32px auto;color:#17211c}h1{color:#005f3f}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}.right{text-align:right}.muted{color:#68736d}.total{font-size:18px;font-weight:bold;color:#005f3f}</style></head><body><h1>Sri Amman Smart Store</h1><h2>Order invoice — ${escapeHtml(order.orderId)}</h2><p class="muted">${escapeHtml(formatDate(order.createdAt, true) || "")}</p><p>${escapeHtml(order.customerName)} · ${escapeHtml(order.phone)}</p><p>${escapeHtml(order.deliveryAddress.houseNo)} ${escapeHtml(order.deliveryAddress.street)}, ${escapeHtml(order.deliveryAddress.city)} ${escapeHtml(order.deliveryAddress.pincode)}</p><p>Payment: ${escapeHtml(order.payment.method)} (${escapeHtml(order.payment.status)})</p><table><thead><tr><th>Item</th><th>Variant</th><th>Qty</th><th class="right">Unit</th><th class="right">Subtotal</th></tr></thead><tbody>${order.items.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(`${item.unitSize} ${item.unit}`.trim())}</td><td>${item.quantity}</td><td class="right">${money(item.price)}</td><td class="right">${money(item.price * item.quantity)}</td></tr>`).join("")}</tbody></table><p>Item subtotal: ${money(order.pricingSummary.subtotal)}</p>${order.pricingSummary.productSavings ? `<p>Product savings: −${money(order.pricingSummary.productSavings)}</p>` : ""}${order.pricingSummary.couponDiscount ? `<p>Coupon discount: −${money(order.pricingSummary.couponDiscount)}</p>` : ""}${order.pricingSummary.coinDiscount ? `<p>Coin discount: −${money(order.pricingSummary.coinDiscount)}</p>` : ""}<p>Delivery fee: ${money(order.pricingSummary.deliveryFee)}</p><p class="total">Order total: ${money(order.pricingSummary.totalAmount)}</p><script>window.onload=()=>window.print()</script></body></html>`);
    printWindow.document.close();
  };

  const handleSubmitHelp = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !selectedOrder || !helpMessage.trim()) return;
    setIsSubmittingHelp(true);
    try {
      await supportService.submitReportedProblem({
        userId: user.id,
        category: helpCategory,
        orderId: selectedOrder.orderId,
        message: helpMessage.trim(),
      });
      toast.success(`Support request for order #${selectedOrder.orderId} submitted`);
      setHelpMessage("");
      setShowHelpModal(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your request");
    } finally {
      setIsSubmittingHelp(false);
    }
  };

  const handleSubmitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !reviewOrder) return;
    setIsSubmittingReview(true);
    try {
      await supportService.submitReportedProblem({
        userId: user.id,
        category: "Order Review",
        orderId: reviewOrder.orderId,
        message: `Customer Rating: ${reviewRating} Stars. Feedback: ${reviewComment.trim() || "No written feedback."}`,
      });
      toast.success("Thank you for your order feedback.");
      setReviewComment("");
      setReviewOrder(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if ((authLoading || isResolvingIdentity) && !user) {
    return <PageShell><LoadingState label="Restoring your session…" /></PageShell>;
  }
  if (!user) {
    return <PageShell><main className="mx-auto max-w-3xl px-4 py-20 pt-20 text-center"><h1 className="text-2xl font-black text-on-surface">Please sign in to view your orders</h1><p className="mx-auto mt-3 max-w-lg text-sm text-on-surface-variant">Sign in to view order details and delivery progress.</p><Link to="/login" search={{ redirect: "/orders" } as any} className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Sign In</Link></main></PageShell>;
  }

  return (
    <PageShell>
      <main className="min-h-[calc(100vh-80px)] bg-surface pb-24 pt-20">
        <div className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
            <Link to="/" className="hover:text-primary">Home</Link><span>/</span><Link to="/account" className="hover:text-primary">My Account</Link><span>/</span><span className="font-bold text-on-surface">My Orders</span>
          </nav>

          {loading ? <LoadingState label="Loading your orders…" /> : ordersError ? (
            <div data-testid="orders-error-banner" role="alert" className="mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center">
              <h1 className="text-xl font-black text-on-surface">Unable to load your orders</h1><p className="mt-2 text-sm text-on-surface-variant">{ordersError}</p>
              <button type="button" onClick={() => void loadOrders()} className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">Retry</button>
            </div>
          ) : selectedOrderId && !selectedOrder ? (
            <section data-testid="order-not-found" className="mx-auto max-w-xl rounded-3xl border border-outline-variant/20 bg-white p-8 text-center shadow-sm">
              <h1 className="text-2xl font-black text-on-surface">Order not found</h1><p className="mt-2 text-sm text-on-surface-variant">This order may not exist or may not belong to your account.</p>
              <button type="button" onClick={backToOrders} className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white">Back to Orders</button>
            </section>
          ) : selectedOrder ? (
            <OrderDetails
              order={selectedOrder}
              onBack={backToOrders}
              onInvoice={() => handleDownloadInvoice(selectedOrder)}
              onHelp={() => setShowHelpModal(true)}
              onCancel={() => void handleCancelOrder(selectedOrder)}
              onReturn={() => void handleReturnRequest(selectedOrder)}
              onReorder={() => void handleReorder(selectedOrder)}
              onReview={() => setReviewOrder(selectedOrder)}
              isReordering={isReordering}
            />
          ) : orders.length === 0 ? (
            <section data-testid="empty-orders-view" className="mx-auto max-w-xl rounded-3xl border border-outline-variant/20 bg-white p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><span className="material-symbols-outlined text-3xl">shopping_bag</span></div>
              <h1 className="mt-4 text-2xl font-black text-on-surface">My Orders</h1><p className="mt-2 text-sm text-on-surface-variant">You have not placed an order yet.</p>
              <Link to="/shop" className="mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white">Browse Products</Link>
            </section>
          ) : (
            <section data-testid="orders-list-view">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div><h1 className="text-3xl font-black text-on-surface">My Orders</h1><p className="mt-1 text-sm text-on-surface-variant">Review your purchases and open an order for its details.</p></div>
                <p className="text-sm font-semibold text-on-surface-variant">{orders.length} order{orders.length === 1 ? "" : "s"}</p>
              </div>
              <div className="mb-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filter orders">
                <FilterButton active={activeFilter === "all"} onClick={() => setActiveFilter("all")}>All Orders ({orders.length})</FilterButton>
                <FilterButton active={activeFilter === "active"} onClick={() => setActiveFilter("active")}>Active / In Transit ({activeOrdersCount})</FilterButton>
                <FilterButton active={activeFilter === "delivered"} onClick={() => setActiveFilter("delivered")}>Delivered ({deliveredOrdersCount})</FilterButton>
                <FilterButton active={activeFilter === "cancelled"} onClick={() => setActiveFilter("cancelled")}>Cancelled ({cancelledOrdersCount})</FilterButton>
              </div>
              {filteredOrders.length === 0 ? <div className="rounded-2xl border border-outline-variant/20 bg-white p-8 text-center text-sm text-on-surface-variant">No orders match this filter.</div> : (
                <div className="space-y-3" data-testid="orders-list">
                  {filteredOrders.map((order) => <OrderCard key={order.orderId} order={order} onOpen={() => openOrder(order.orderId)} onReorder={() => void handleReorder(order)} isReordering={isReordering} />)}
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {showHelpModal && selectedOrder && <Dialog title={`Need help with #${selectedOrder.orderId}`} onClose={() => setShowHelpModal(false)}>
        <form onSubmit={handleSubmitHelp} className="space-y-4">
          <label className="block text-sm font-semibold">Issue type<select value={helpCategory} onChange={(event) => setHelpCategory(event.target.value)} className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-white px-3 py-2.5"><option>Delivery Query</option><option>Damaged / Missing Item</option><option>Address Change</option><option>Payment Query</option><option>Quality Concern</option></select></label>
          <label className="block text-sm font-semibold">How can we help?<textarea required rows={4} value={helpMessage} onChange={(event) => setHelpMessage(event.target.value)} className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-white px-3 py-2.5" /></label>
          <DialogActions onClose={() => setShowHelpModal(false)} busy={isSubmittingHelp} submitLabel="Submit Request" />
        </form>
      </Dialog>}

      {reviewOrder && <Dialog title={`Review order #${reviewOrder.orderId}`} onClose={() => setReviewOrder(null)}>
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div><p className="mb-2 text-sm font-semibold">Your rating</p><div className="flex gap-2">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" aria-label={`${star} stars`} onClick={() => setReviewRating(star)} className={`text-3xl ${reviewRating >= star ? "text-amber-500" : "text-slate-300"}`}>★</button>)}</div></div>
          <label className="block text-sm font-semibold">Feedback<textarea rows={3} value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} className="mt-1 w-full rounded-xl border border-outline-variant/30 bg-white px-3 py-2.5" /></label>
          <DialogActions onClose={() => setReviewOrder(null)} busy={isSubmittingReview} submitLabel="Submit Review" />
        </form>
      </Dialog>}
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased"><StoreHeader />{children}<StoreFooter /><BottomNav /></div>;
}

function LoadingState({ label }: { label: string }) {
  return <div className="px-4 py-20 pt-20 text-center"><div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" /><p className="text-sm text-on-surface-variant">{label}</p></div>;
}

function FilterButton({ active, children, onClick }: { active: boolean; children: ReactNode; onClick: () => void }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition-colors ${active ? "bg-primary text-white" : "border border-outline-variant/20 bg-white text-on-surface-variant hover:text-primary"}`}>{children}</button>;
}

function OrderCard({ order, onOpen, onReorder, isReordering }: { order: Order; onOpen: () => void; onReorder: () => void; isReordering: boolean }) {
  const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);
  const placedAt = formatDate(order.createdAt, true);
  const productsToShow = order.items.slice(0, 2);
  const imageLimit = order.items.length === 1 ? 1 : 4;
  const moreImages = Math.max(order.items.length - imageLimit, 0);
  return <article data-testid={`order-history-card-${order.orderId}`} tabIndex={0} onClick={onOpen} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onOpen(); } }} className="cursor-pointer overflow-hidden rounded-2xl border border-outline-variant/20 bg-white shadow-sm transition-colors hover:border-primary/40 hover:shadow-md">
    <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-outline-variant/15 bg-surface-container-lowest px-4 py-3 sm:px-5">
      <div className="flex min-w-0 flex-wrap items-center gap-2"><h2 className="text-sm font-extrabold text-on-surface">Order #{order.orderId}</h2><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusClasses(order)}`}>{getDisplayStatus(order)}</span></div>
      <time className="text-xs text-on-surface-variant">{placedAt || "Date unavailable"}</time>
    </header>
    <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_210px] lg:items-center">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
        <div className={`flex shrink-0 items-center gap-2 ${order.items.length === 1 ? "" : "flex-wrap"}`} aria-label={`${order.items.length} products in this order`}>
          {order.items.slice(0, imageLimit).map((item, index) => {
            return <div key={`${item.productId}-${item.unitSize}-${index}`} className={`${order.items.length === 1 ? "h-28 w-28" : "h-[68px] w-[68px]"} flex items-center justify-center overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-low p-1.5`}>
              <OrderProductImage item={item} className="h-full w-full object-contain" />
            </div>;
          })}
          {moreImages > 0 && <span className="flex h-[68px] min-w-[68px] items-center justify-center rounded-xl border border-outline-variant/15 bg-surface-container-low px-2 text-xs font-extrabold text-on-surface-variant">+{moreImages} more</span>}
        </div>
        <div className="min-w-0 flex-1">
          <ul className="space-y-2">
            {productsToShow.map((item, index) => <li key={`${item.productId}-${item.unitSize}-${index}`} className="min-w-0">
              <p className="whitespace-normal break-words text-sm font-bold text-on-surface">{item.name}</p>
              <p className="mt-0.5 text-xs text-on-surface-variant">{[item.unitSize, item.unit].filter(Boolean).join(" ") || "Variant unavailable"} · Qty {item.quantity} · {money(item.price)} each</p>
            </li>)}
          </ul>
          {order.items.length > productsToShow.length && <p className="mt-2 text-xs font-semibold text-primary">+{order.items.length - productsToShow.length} more product{order.items.length - productsToShow.length === 1 ? "" : "s"} in this order</p>}
          <p className="mt-3 text-xs text-on-surface-variant">{getOrderStatusMessage(order)}</p>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">{order.payment.method.toUpperCase()} · {order.payment.status}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-outline-variant/15 pt-3 sm:justify-end lg:flex-col lg:items-stretch lg:border-t-0 lg:border-l lg:pl-5 lg:pt-0">
        <div className="lg:text-right"><p className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">{itemCount} item{itemCount === 1 ? "" : "s"}</p><p className="mt-0.5 text-lg font-black text-on-surface">{money(order.pricingSummary.totalAmount)}</p></div>
        <div className="flex gap-2">
          <button type="button" disabled={isReordering} onClick={(event) => { event.stopPropagation(); onReorder(); }} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-primary/30 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/5 disabled:opacity-60">Reorder</button>
          <button type="button" onClick={(event) => { event.stopPropagation(); onOpen(); }} className="inline-flex min-h-10 items-center justify-center gap-1 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary-container" aria-label={`View details for order ${order.orderId}`}>
            View Details<span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  </article>;
}

function OrderDetails({ order, onBack, onInvoice, onHelp, onCancel, onReturn, onReorder, onReview, isReordering }: {
  order: Order;
  onBack: () => void;
  onInvoice: () => void;
  onHelp: () => void;
  onCancel: () => void;
  onReturn: () => void;
  onReorder: () => void;
  onReview: () => void;
  isReordering: boolean;
}) {
  const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);
  const address = [order.deliveryAddress.houseNo, order.deliveryAddress.street, order.deliveryAddress.landmark, order.deliveryAddress.city, order.deliveryAddress.pincode].filter(Boolean).join(", ");
  const canCancel = order.status === "pending" || order.status === "processing";
  const canReturn = canRequestReturn(order);
  const timeline = buildOrderTimeline(order);

  return <section data-testid="order-details-view" className="space-y-5">
    <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-outline-variant/25 bg-white px-4 py-2.5 text-sm font-bold text-on-surface hover:border-primary/50"><span className="material-symbols-outlined text-base">arrow_back</span>Back to Orders</button>
    <header className="flex flex-col gap-4 rounded-3xl border border-outline-variant/20 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6">
      <div><p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Order Details</p><h1 className="mt-1 break-all text-2xl font-black text-on-surface">#{order.orderId}</h1><div className="mt-3 flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-black uppercase ${statusClasses(order)}`}>{getDisplayStatus(order)}</span><span className="text-xs text-on-surface-variant">Placed {formatDate(order.createdAt, true) || "date unavailable"}</span></div></div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={onInvoice} className="rounded-xl border border-outline-variant/25 px-3.5 py-2.5 text-xs font-bold hover:border-primary/50"><span className="material-symbols-outlined mr-1 align-middle text-base">print</span>Print Invoice</button><button type="button" onClick={onHelp} className="rounded-xl bg-primary px-3.5 py-2.5 text-xs font-bold text-white hover:bg-primary-container">Need Help?</button></div>
    </header>

    <div className="grid gap-5 lg:grid-cols-5">
      <div className="space-y-5 lg:col-span-3">
        <section data-testid="order-progress-timeline" className="rounded-3xl border border-outline-variant/20 bg-white p-5 sm:p-6">
          <h2 className="text-lg font-extrabold text-on-surface">Order Progress</h2><p className="mt-1 text-xs text-on-surface-variant">Status milestones and dates available for this order.</p>
          <ol className="mt-5 space-y-0">
            {timeline.map((entry, index) => <li key={entry.key} className="relative flex gap-4 pb-6 last:pb-0">
              {index < timeline.length - 1 && <span className={`absolute bottom-0 left-[11px] top-6 w-0.5 ${entry.state === "completed" ? "bg-emerald-300" : "bg-outline-variant/30"}`} />}
              <span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${entry.state === "completed" ? "bg-emerald-600 text-white" : entry.state === "current" ? "bg-primary text-white ring-4 ring-primary/10" : "border border-outline-variant/50 bg-white text-outline"}`}>{entry.state === "completed" ? "✓" : index + 1}</span>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1"><p className={`text-sm font-bold ${entry.state === "pending" ? "text-on-surface-variant" : "text-on-surface"}`}>{entry.label}</p>{entry.timestamp && <time dateTime={entry.timestamp} className="text-xs text-on-surface-variant">{formatDate(entry.timestamp, true)}</time>}</div>{entry.state === "current" && <p className="mt-1 text-xs font-semibold text-primary">Current status</p>}</div>
            </li>)}
          </ol>
        </section>

        <section className="rounded-3xl border border-outline-variant/20 bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-lg font-extrabold text-on-surface">Items ({itemCount})</h2><span className="text-sm font-bold text-on-surface">{money(order.pricingSummary.totalAmount)} total</span></div>
          <ul className="mt-4 divide-y divide-outline-variant/15">
            {order.items.map((item, index) => <li key={`${item.productId}-${item.unitSize}-${index}`} className="flex gap-3 py-4 first:pt-0 last:pb-0">
              <OrderProductImage item={item} alt={`${item.name} product image`} className="h-16 w-16 shrink-0 rounded-xl bg-surface-container object-contain p-1" />
              <div className="min-w-0 flex-1"><p className="font-bold text-on-surface">{item.name}</p><p className="mt-0.5 text-xs text-on-surface-variant">{[item.unitSize, item.unit].filter(Boolean).join(" ")} · Qty {item.quantity}</p><p className="mt-1 text-xs text-on-surface-variant">{money(item.price)} each</p></div>
              <p className="shrink-0 text-sm font-bold text-on-surface">{money(item.price * item.quantity)}</p>
            </li>)}
          </ul>
        </section>
      </div>

      <aside className="space-y-5 lg:col-span-2">
        <section className="rounded-3xl border border-outline-variant/20 bg-white p-5 sm:p-6"><h2 className="text-base font-extrabold text-on-surface">Order Information</h2>
          <dl className="mt-4 space-y-3 text-sm"><InfoRow label="Payment method" value={order.payment.method.toUpperCase()} /><InfoRow label="Payment status" value={order.payment.status} /><InfoRow label="Delivery" value={order.delivery.slot || order.delivery.type} /><InfoRow label="Customer" value={order.customerName} /><InfoRow label="Contact" value={order.phone || "Not provided"} /></dl>
          <div className="mt-4 border-t border-outline-variant/15 pt-4"><p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">Delivery Address</p><p className="mt-1 text-sm leading-relaxed text-on-surface">{address || "Address unavailable"}</p></div>
        </section>
        <section className="rounded-3xl border border-outline-variant/20 bg-white p-5 sm:p-6"><h2 className="text-base font-extrabold text-on-surface">Payment Summary</h2><div className="mt-4 space-y-2.5 text-sm">
          <InfoRow label="Items subtotal" value={money(order.pricingSummary.subtotal)} />
          {order.pricingSummary.productSavings > 0 && <InfoRow label="Product savings" value={`−${money(order.pricingSummary.productSavings)}`} />}
          {order.pricingSummary.couponDiscount > 0 && <InfoRow label="Coupon discount" value={`−${money(order.pricingSummary.couponDiscount)}`} />}
          {order.pricingSummary.coinDiscount > 0 && <InfoRow label="Coin discount" value={`−${money(order.pricingSummary.coinDiscount)}`} />}
          <InfoRow label="Delivery charge" value={order.pricingSummary.deliveryFee === 0 ? "Free" : money(order.pricingSummary.deliveryFee)} />
          <div className="border-t border-outline-variant/20 pt-3"><InfoRow label="Order total" value={money(order.pricingSummary.totalAmount)} strong /></div>
        </div></section>
        <section className="rounded-3xl border border-outline-variant/20 bg-white p-5 sm:p-6"><h2 className="text-base font-extrabold text-on-surface">Order Actions</h2><div className="mt-4 flex flex-col gap-2">
          {canCancel && <button data-testid="cancel-order-button" type="button" onClick={onCancel} className="rounded-xl border border-rose-200 px-4 py-2.5 text-left text-sm font-bold text-rose-700 hover:bg-rose-50">Cancel Order</button>}
          {canReturn && <button type="button" onClick={onReturn} className="rounded-xl border border-amber-200 px-4 py-2.5 text-left text-sm font-bold text-amber-800 hover:bg-amber-50">Request Return</button>}
          {order.status === "delivered" && <button type="button" onClick={onReview} className="rounded-xl border border-outline-variant/25 px-4 py-2.5 text-left text-sm font-bold text-on-surface hover:border-primary/50">Rate & Review</button>}
          <button data-testid="reorder-button" type="button" disabled={isReordering} onClick={onReorder} className="rounded-xl bg-primary px-4 py-2.5 text-left text-sm font-bold text-white hover:bg-primary-container disabled:opacity-60">{isReordering ? "Adding items…" : "Reorder"}</button>
        </div></section>
      </aside>
    </div>
  </section>;
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className="flex items-start justify-between gap-3"><dt className="text-on-surface-variant">{label}</dt><dd className={`text-right ${strong ? "font-black text-on-surface" : "font-semibold text-on-surface"}`}>{value}</dd></div>;
}

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><section role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6"><header className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-extrabold text-on-surface">{title}</h2><button type="button" onClick={onClose} aria-label="Close" className="rounded-lg px-2 py-1 text-xl text-on-surface-variant hover:bg-surface-container">×</button></header>{children}</section></div>;
}

function DialogActions({ onClose, busy, submitLabel }: { onClose: () => void; busy: boolean; submitLabel: string }) {
  return <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={onClose} className="rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-bold">Close</button><button type="submit" disabled={busy} className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">{busy ? "Submitting…" : submitLabel}</button></div>;
}
