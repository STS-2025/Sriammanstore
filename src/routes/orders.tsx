import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useSearch, Link, useNavigate } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { orderService } from "../services/orderService";
import { supportService } from "../services/supportService";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNotifications } from "../context/NotificationContext";
import { authManager } from "../services/authAdapter";
import type { Order, OrderStatus } from "../types";
import { toast } from "sonner";

/** Phone / WhatsApp concierge numbers for production support */
const CONCIERGE_PHONE = "+919384619998";
const CONCIERGE_WHATSAPP = "https://wa.me/919384619998";

export const Route = createFileRoute("/orders")({
  validateSearch: (
    search: Record<string, unknown>
  ): {
    placed?: string | undefined;
    id?: string | undefined;
  } => ({
    placed: (search["placed"] as string) || undefined,
    id: (search["id"] as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "My Orders & Delivery Tracking — Sri Amman Smart Store" },
      { name: "description", content: "Track your live grocery orders and view invoices." },
    ],
  }),
  component: OrdersPage,
});

export function OrdersPage() {
  const searchParams = useSearch({ from: "/orders" });
  const { user, isLoading: authLoading, isResolvingIdentity, refreshUser } = useAuth();
  const { refreshCart } = useCart();
  const { refreshNotifications } = useNotifications();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "delivered" | "cancelled">(
    "all"
  );
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpCategory, setHelpCategory] = useState("Delivery Query");
  const [helpMessage, setHelpMessage] = useState("");
  const [isSubmittingHelp, setIsSubmittingHelp] = useState(false);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [isReordering, setIsReordering] = useState(false);

  const loadOrders = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setOrdersError(null);
      const data = await orderService.getOrders(user.id, user.legacySassId);
      setOrders(data || []);

      if (searchParams.placed) {
        setSelectedOrderId(searchParams.placed);
      } else if (searchParams.id) {
        setSelectedOrderId(searchParams.id);
      } else if (data && data.length > 0 && data[0]) {
        // Default to first active order if exists, otherwise first order
        const active = data.find((o) =>
          ["pending", "processing", "packed", "in transit"].includes(o.status)
        );
        setSelectedOrderId(active ? active.orderId : data[0].orderId);
      }
      await refreshNotifications();
    } catch (err: any) {
      console.error("Failed to load orders:", err);
      const msg =
        err?.message ||
        "Failed to load orders from store database. Please check your connection.";
      setOrdersError(msg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    } else if (!authLoading && !isResolvingIdentity) {
      setLoading(false);
    }
  }, [user, searchParams.placed, searchParams.id, authLoading, isResolvingIdentity]);

  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) =>
      ["pending", "processing", "packed", "in transit"].includes(o.status)
    ).length;
  }, [orders]);

  const deliveredOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "delivered").length;
  }, [orders]);

  const cancelledOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "cancelled" || o.status === "returned").length;
  }, [orders]);

  const selectedOrder = useMemo(() => {
    return orders.find((o) => o.orderId === selectedOrderId) || orders[0] || null;
  }, [orders, selectedOrderId]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (activeFilter === "active") {
        return ["pending", "processing", "packed", "in transit"].includes(o.status);
      }
      if (activeFilter === "delivered") return o.status === "delivered";
      if (activeFilter === "cancelled") return o.status === "cancelled" || o.status === "returned";
      return true;
    });
  }, [orders, activeFilter]);

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}?`)) return;
    try {
      await orderService.cancelOrder(orderId, user?.id);
      await refreshUser();
      await refreshNotifications();
      toast.success(`Order #${orderId} has been cancelled`);
      await loadOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order");
    }
  };

  const handleRequestReturn = async (orderId: string) => {
    try {
      await orderService.requestReturn(orderId, user?.id);
      toast.success(`Return request for Order #${orderId} submitted for review`);
      await loadOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit return request");
    }
  };

  const handleReorder = async (order: Order) => {
    if (!user) return;
    setIsReordering(true);
    try {
      const res = await orderService.reorder(order, user.id);
      await refreshCart();
      if (res.addedCount > 0) {
        if (res.unavailableCount > 0) {
          toast.success(
            `Added ${res.addedCount} items to your cart. (${res.unavailableCount} item currently out of stock)`
          );
        } else {
          toast.success(`All ${res.addedCount} items re-added to your cart!`);
        }
        navigate({ to: "/cart" });
      } else {
        toast.error("None of the items in this order are currently available in stock.");
      }
    } catch (err: any) {
      toast.error(err.message || "Could not reorder items");
    } finally {
      setIsReordering(false);
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.info("Invoice preview generated");
      return;
    }
    const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Sri Amman Smart Store - Tax Invoice #${order.orderId}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #131b2e; max-width: 800px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #005f3f; padding-bottom: 16px; margin-bottom: 24px; }
            .brand { color: #005f3f; font-size: 24px; font-weight: 800; }
            .meta { font-size: 12px; color: #555; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
            th, td { border: 1px solid #e0e0e0; padding: 10px; text-align: left; }
            th { background-color: #f4fbf7; color: #005f3f; font-weight: bold; }
            .total-row { text-align: right; }
            .grand-total { font-size: 18px; font-weight: bold; color: #005f3f; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; background: #e8f5e9; color: #2e7d32; font-weight: bold; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">Sri Amman Smart Store</div>
              <div class="meta">Farm Fresh Groceries & Wood Churned Oils</div>
              <div class="meta">GSTIN: 33AAAAA0000A1Z5 | FSSAI: #12421008000412</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #005f3f;">TAX INVOICE</h2>
              <div class="meta">#${order.orderId}</div>
              <div class="meta">${orderDate}</div>
            </div>
          </div>

          <div class="section" style="display: flex; justify-content: space-between;">
            <div>
              <strong>Billed & Delivered To:</strong><br />
              ${order.customerName}<br />
              ${order.deliveryAddress.houseNo}, ${order.deliveryAddress.street}<br />
              ${order.deliveryAddress.city} - ${order.deliveryAddress.pincode}<br />
              Phone: ${order.phone}
            </div>
            <div style="text-align: right;">
              <strong>Payment Status:</strong> <span class="badge">${order.payment.status.toUpperCase()}</span><br />
              <strong>Payment Mode:</strong> ${order.payment.method.toUpperCase()}<br />
              <strong>Delivery Mode:</strong> ${order.delivery.slot}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Pack Size</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${order.items
                .map(
                  (i) => `
                <tr>
                  <td><strong>${i.name}</strong></td>
                  <td>${i.unitSize} ${i.unit}</td>
                  <td style="text-align: center;">${i.quantity}</td>
                  <td style="text-align: right;">₹${i.price}</td>
                  <td style="text-align: right;">₹${i.price * i.quantity}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div style="margin-left: auto; width: 300px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>Item Subtotal:</span>
              <span>₹${order.pricingSummary.subtotal}</span>
            </div>
            ${
              order.pricingSummary.productSavings
                ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #2e7d32;">
              <span>Product Savings:</span>
              <span>-₹${order.pricingSummary.productSavings}</span>
            </div>`
                : ""
            }
            ${
              order.pricingSummary.couponDiscount
                ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #2e7d32;">
              <span>Coupon Discount:</span>
              <span>-₹${order.pricingSummary.couponDiscount}</span>
            </div>`
                : ""
            }
            ${
              order.pricingSummary.coinDiscount
                ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #2e7d32;">
              <span>Smart Coins Redeemed:</span>
              <span>-₹${order.pricingSummary.coinDiscount}</span>
            </div>`
                : ""
            }
            <div style="display: flex; justify-content: space-between; padding: 4px 0;">
              <span>Delivery Fee:</span>
              <span>${order.pricingSummary.deliveryFee === 0 ? "FREE" : `₹${order.pricingSummary.deliveryFee}`}</span>
            </div>
            <hr style="border: none; border-top: 1px solid #ccc; margin: 8px 0;" />
            <div style="display: flex; justify-content: space-between; padding: 4px 0;" class="grand-total">
              <span>Total Paid:</span>
              <span>₹${order.pricingSummary.totalAmount}</span>
            </div>
          </div>

          <div style="margin-top: 40px; font-size: 11px; color: #777; border-top: 1px solid #eee; padding-top: 12px; text-align: center;">
            This is a computer-generated tax invoice for purchases from Sri Amman Smart Store. Thank you for supporting organic local farms!
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSubmitHelp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedOrder) return;
    if (!helpMessage.trim()) {
      toast.error("Please enter a message describing your query");
      return;
    }
    setIsSubmittingHelp(true);
    try {
      await supportService.submitReportedProblem({
        userId: user.id,
        category: helpCategory,
        orderId: selectedOrder.orderId,
        message: helpMessage.trim(),
      });
      toast.success(
        `Support ticket for Order #${selectedOrder.orderId} submitted. Our support team will contact you shortly.`
      );
      setHelpMessage("");
      setShowHelpModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit support request");
    } finally {
      setIsSubmittingHelp(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewOrder) return;
    setIsSubmittingReview(true);
    try {
      await supportService.submitReportedProblem({
        userId: user.id,
        category: "Order Review",
        orderId: reviewOrder.orderId,
        message: `Customer Rating: ${reviewRating} Stars. Feedback: ${reviewComment.trim() || "Great quality fresh products!"}`,
      });
      toast.success(`Thank you! Your ${reviewRating}-star review has been recorded.`);
      setReviewComment("");
      setShowReviewModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if ((authLoading || isResolvingIdentity) && !user) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-[172px] max-w-[1000px] mx-auto px-margin-desktop py-20 text-center">
          <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-on-surface-variant font-medium">
            Restoring your session...
          </p>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-[172px] max-w-[1000px] mx-auto px-margin-desktop py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-4xl mx-auto mb-4">
            📦
          </div>
          <h2 className="font-headline-lg text-xl font-bold text-on-surface mb-2">
            Please Sign In to View Your Orders
          </h2>
          <p className="text-xs text-on-surface-variant mb-6">
            Sign in with your mobile number to view past orders, live delivery tracking, and
            tax invoices.
          </p>
          <Link
            to="/login"
            search={{ redirect: "/orders" } as any}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all"
          >
            <span>Sign In with Phone OTP</span>
          </Link>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]">
        <div className="max-w-[1320px] mx-auto px-margin-desktop py-space-xl">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-3 flex-wrap">            <Link to="/" className="hover:text-primary transition-colors">              Home
            </Link>
            <span>›</span>
            <Link to="/account" className="hover:text-primary transition-colors">
              My Account
            </Link>
            <span>›</span>
            <Link to="/orders" className="hover:text-primary transition-colors">
              Orders
            </Link>
            {selectedOrder && (
              <>
                <span>›</span>
                <span className="text-primary font-bold">#{selectedOrder.orderId}</span>
              </>
            )}
          </nav>

          {/* Heading & Header Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface">
                My Orders & Real-Time Tracking
              </h1>
              {activeOrdersCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-secondary/15 text-secondary font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
                  <span>
                    {activeOrdersCount} ACTIVE ORDER{activeOrdersCount !== 1 ? "S" : ""}
                  </span>
                </span>
              )}
            </div>

            {/* Actions: Download Invoice & Need Help */}
            <div className="flex items-center gap-3">
              {selectedOrder && (
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="px-4 py-2.5 rounded-2xl bg-surface-container-lowest hover:bg-surface-container border border-outline-variant/20 text-xs font-bold text-on-surface flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  title="Download Tax Invoice (PDF)"
                >
                  <span className="material-symbols-outlined text-[16px] text-primary">
                    download
                  </span>
                  <span>Download Invoice (PDF)</span>
                </button>
              )}

                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="px-4 py-2.5 rounded-2xl bg-primary hover:bg-primary-container text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">headset_mic</span>
                  <span>Need Help?</span>
                </button>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-none pb-1">
            <button
              type="button"
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "all"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant/15"
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("active")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === "active"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant/15"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeFilter === "active" ? "bg-white" : "bg-primary"
                }`}
              />
              Active / In Transit ({activeOrdersCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("delivered")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "delivered"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant/15"
              }`}
            >
              Delivered ({deliveredOrdersCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter("cancelled")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeFilter === "cancelled"
                  ? "bg-primary text-white shadow-sm"
                  : "bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant/15"
              }`}
            >
              Cancelled ({cancelledOrdersCount})
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-xs text-on-surface-variant font-medium">
                Loading your harvest orders...
              </p>
            </div>
          ) : ordersError ? (
            <div
              data-testid="orders-error-banner"
              className="bg-surface-container-lowest rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto border border-red-200 my-12 shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-3xl mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">cloud_off</span>
              </div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-2">
                Unable to Load Orders
              </h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                {ordersError}
              </p>
              <button
                type="button"
                onClick={() => loadOrders()}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Retry</span>
              </button>
            </div>
          ) : orders.length === 0 ? (
            <div
              data-testid="empty-orders-view"
              className="bg-surface-container-lowest rounded-3xl p-12 text-center max-w-md mx-auto border border-outline-variant/20 my-12 shadow-sm"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-3xl mx-auto mb-4">
                📦
              </div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-2">
                No Orders Placed Yet
              </h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                Experience authentic wood-pressed oils and farm staples delivered right to
                your doorstep.
              </p>
              <Link
                to="/shop"
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all"
              >
                Browse Farm Pantry
              </Link>
            </div>
          ) : (
            <>
              {/* SECTION 1: ACTIVE ORDER REAL-TIME TRACKING (Screenshots 1 & 2) */}
              {selectedOrder && (
                <div
                  data-testid="active-order-tracking"
                  className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 sm:p-7 shadow-sm mb-12"
                >
                  {/* Active Order Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/15">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[26px]">
                          electric_moped
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-headline-lg text-lg sm:text-xl font-extrabold text-on-surface">
                            Order #{selectedOrder.orderId}
                          </h2>
                          <span
                            className={`font-label-badge text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                              selectedOrder.status === "in transit"
                                ? "bg-primary text-white shadow-xs"
                                : selectedOrder.status === "delivered"
                                  ? "bg-primary/15 text-primary"
                                  : selectedOrder.status === "cancelled" ||
                                      selectedOrder.status === "returned"
                                    ? "bg-error/15 text-error"
                                    : "bg-secondary/15 text-secondary"
                            }`}
                          >
                            {selectedOrder.status === "in transit"
                              ? "OUT FOR DELIVERY"
                              : selectedOrder.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Placed on{" "}
                          {new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          • Paid via {selectedOrder.payment.method.toUpperCase()} (
                          {selectedOrder.payment.status})
                        </p>
                      </div>
                    </div>

                    {/* Estimated Arrival Box on top right */}
                    <div className="bg-surface-container-low/70 border border-outline-variant/15 rounded-2xl p-3 sm:px-4 flex items-center gap-3 shrink-0">
                      <div>
                        <span className="text-[10px] font-black text-outline uppercase tracking-wider block">
                          ESTIMATED ARRIVAL
                        </span>
                        <span className="font-headline-sm text-sm sm:text-base font-black text-primary">
                          {selectedOrder.status === "delivered"
                            ? "Delivered Successfully"
                            : selectedOrder.delivery.estimatedTime || "Arriving in ~22 mins"}
                        </span>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[18px]">bolt</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Grid: Left Column (Map & Timeline) vs Right Column (Rider, Destination, Items) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6 items-start">
                    {/* LEFT COLUMN: Map & Timeline */}
                    <div className="lg:col-span-7 space-y-6">
                      {/* Illustrative Route Demonstration Box */}
                      <div className="relative rounded-2xl overflow-hidden border border-outline-variant/15 bg-surface-container-low aspect-[16/9] flex flex-col justify-between">
                        {/* Static SVG Map Graphic */}
                        <div className="absolute inset-0 bg-[#e8ece9] opacity-80">
                          <svg
                            viewBox="0 0 400 225"
                            className="w-full h-full opacity-60"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            {/* Grid / Roads */}
                            <path
                              d="M 20 60 Q 150 70 240 40 T 380 90"
                              stroke="#c5d1c9"
                              strokeWidth="8"
                              fill="none"
                            />
                            <path
                              d="M 60 20 L 90 200"
                              stroke="#c5d1c9"
                              strokeWidth="6"
                              fill="none"
                            />
                            <path
                              d="M 180 10 L 220 220"
                              stroke="#c5d1c9"
                              strokeWidth="6"
                              fill="none"
                            />
                            <path
                              d="M 310 30 L 330 210"
                              stroke="#c5d1c9"
                              strokeWidth="7"
                              fill="none"
                            />
                            {/* Active Delivery Route line */}
                            <path
                              d="M 90 120 C 140 130, 200 90, 270 140"
                              stroke="#005f3f"
                              strokeWidth="4"
                              strokeDasharray="6,4"
                              fill="none"
                            />
                            {/* Store Hub Marker */}
                            <circle cx="90" cy="120" r="7" fill="#005f3f" />
                            {/* Destination Marker */}
                            <circle cx="270" cy="140" r="7" fill="#fea619" />
                          </svg>
                        </div>

                        {/* Map Header Floating Overlay */}
                        <div className="relative z-10 p-3 flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-xl bg-surface/90 text-on-surface font-bold text-[11px] shadow-sm flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            Store Hub: {selectedOrder.deliveryAddress.city} Superstore
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-surface/90 text-outline text-[10px] font-black uppercase tracking-wider shadow-sm">
                            Demonstration Route
                          </span>
                        </div>

                        {/* Bottom Route Status Banner */}
                        <div className="relative z-10 p-3 bg-surface/95 backdrop-blur-xs border-t border-outline-variant/15 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">
                              navigation
                            </span>
                            <span className="font-headline-sm text-xs font-bold text-on-surface">
                              {selectedOrder.delivery?.driver
                                ? `Rider ${selectedOrder.delivery.driver.name} is on ${selectedOrder.deliveryAddress.city} Express Route`
                                : `Express Dispatch Route to ${selectedOrder.deliveryAddress.city}`}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-black text-[10px] uppercase">
                            Route Preview
                          </span>
                        </div>
                      </div>

                      {/* Order Progress Milestone Timeline */}
                      <div className="bg-surface-container-low/40 rounded-2xl p-5 border border-outline-variant/15">
                        <h3 className="font-headline-sm text-xs font-black uppercase tracking-wider text-on-surface mb-5">
                          Order Progress Timeline
                        </h3>

                        {/* Vertical connected milestones */}
                        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30">
                          {/* Stage 1: Order Placed */}
                          <div className="relative">
                            <span className="absolute -left-[23px] top-0 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-xs">
                              ✓
                            </span>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-headline-sm font-extrabold text-on-surface">
                                Order Placed
                              </span>
                              <span className="text-[11px] text-outline font-semibold">
                                {new Date(selectedOrder.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              Order confirmed & verified via Express checkout
                            </p>
                          </div>

                          {/* Stage 2: Confirmed & Packed */}
                          <div className="relative">
                            <span
                              className={`absolute -left-[23px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                                ["processing", "packed", "in transit", "delivered"].includes(
                                  selectedOrder.status
                                )
                                  ? "bg-primary text-white"
                                  : "bg-surface-container text-outline"
                              }`}
                            >
                              {["processing", "packed", "in transit", "delivered"].includes(
                                selectedOrder.status
                              )
                                ? "✓"
                                : "2"}
                            </span>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-headline-sm font-extrabold text-on-surface">
                                Confirmed & Packed at Hub
                              </span>
                              <span className="text-[11px] text-outline font-semibold">
                                Batch #412
                              </span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              Items carefully bagged in eco-friendly tamper-proof tote
                            </p>
                          </div>

                          {/* Stage 3: Quality Checked */}
                          <div className="relative">
                            <span
                              className={`absolute -left-[23px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                                ["packed", "in transit", "delivered"].includes(
                                  selectedOrder.status
                                )
                                  ? "bg-primary text-white"
                                  : "bg-surface-container text-outline"
                              }`}
                            >
                              {["packed", "in transit", "delivered"].includes(
                                selectedOrder.status
                              )
                                ? "✓"
                                : "3"}
                            </span>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-headline-sm font-extrabold text-on-surface">
                                Traditional Wood Press Quality Checked
                              </span>
                              <span className="text-[11px] text-primary font-bold">
                                Certified
                              </span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              Batch density & cold-press aroma certified by in-house lab
                            </p>
                          </div>

                          {/* Stage 4: Out for Delivery */}
                          <div className="relative">
                            <span
                              className={`absolute -left-[23px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                                ["in transit", "delivered"].includes(selectedOrder.status)
                                  ? "bg-primary text-white ring-4 ring-primary/20"
                                  : "bg-surface-container text-outline"
                              }`}
                            >
                              {selectedOrder.status === "delivered" ? (
                                "✓"
                              ) : (
                                <span className="material-symbols-outlined text-[14px]">
                                  local_shipping
                                </span>
                              )}
                            </span>
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-headline-sm font-extrabold text-on-surface">
                                  Out for Delivery
                                </span>
                                {selectedOrder.status === "in transit" && (
                                  <span className="px-2 py-0.2 rounded text-[9px] font-black uppercase bg-primary text-white animate-pulse">
                                    IN MOTION
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              Rider is en route along local express road towards destination
                            </p>
                          </div>

                          {/* Stage 5: Delivery Completed */}
                          <div className="relative">
                            <span
                              className={`absolute -left-[23px] top-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-xs ${
                                selectedOrder.status === "delivered"
                                  ? "bg-primary text-white"
                                  : "bg-surface-container text-outline"
                              }`}
                            >
                              {selectedOrder.status === "delivered" ? "✓" : "5"}
                            </span>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-headline-sm font-extrabold text-on-surface">
                                Delivery Completed
                              </span>
                              <span className="text-[11px] text-outline font-semibold">
                                {selectedOrder.status === "delivered"
                                  ? "Delivered"
                                  : "Doorstep Handoff"}
                              </span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                              Contactless handoff at your doorstep
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Rider, Destination, Items, Breakdown */}
                    <div className="lg:col-span-5 space-y-5">
                      {/* 1. Assigned Delivery Partner Card */}
                      <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/15 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-[10px] uppercase text-outline tracking-wider">
                            ASSIGNED DELIVERY PARTNER
                          </span>
                          <span className="text-secondary font-bold text-[11px] flex items-center gap-0.5">
                            ★ 4.9 (420+ trips)
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-base shrink-0">
                              {selectedOrder.delivery?.driver?.name?.[0] || "M"}
                            </div>
                            <div>
                              <h4 className="font-headline-sm text-xs font-extrabold text-on-surface">
                                {selectedOrder.delivery?.driver?.name || "Murugan K."}
                              </h4>
                              <p className="text-[11px] text-on-surface-variant font-medium">
                                {selectedOrder.delivery?.driver?.vehicle ||
                                  "Sri Amman Express Carrier • TVS iQube EV"}
                              </p>
                            </div>
                          </div>

                          <a
                            href={
                              selectedOrder.delivery?.driver?.phone
                                ? `tel:${selectedOrder.delivery.driver.phone}`
                                : "tel:+919840012345"
                            }
                            className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-container transition-colors shadow-xs cursor-pointer"
                            title="Call Delivery Partner"
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              call
                            </span>
                          </a>
                        </div>

                        {/* Delivery Security PIN */}
                        <div className="p-2.5 rounded-xl bg-surface border border-outline-variant/15 flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] font-black text-outline uppercase block">
                              DELIVERY SECURITY PIN
                            </span>
                            <span className="text-[11px] text-on-surface-variant">
                              Share with rider at handover
                            </span>
                          </div>
                          <span className="px-3 py-1 rounded-lg bg-primary/10 text-primary font-mono font-black text-sm tracking-widest border border-primary/20">
                            {selectedOrder.orderId.replace(/\D/g, "").slice(-4) || "4891"}
                          </span>
                        </div>
                      </div>

                      {/* 2. Delivering To Card */}
                      <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/15">
                        <div className="flex items-center gap-1.5 text-primary text-xs font-bold mb-1">
                          <span className="material-symbols-outlined text-[16px]">
                            location_on
                          </span>
                          <span className="font-black text-[10px] uppercase tracking-wider">
                            DELIVERING TO
                          </span>
                        </div>
                        <h4 className="font-headline-sm text-xs font-extrabold text-on-surface">
                          {selectedOrder.customerName}
                        </h4>
                        <p className="text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                          #{selectedOrder.deliveryAddress.houseNo},{" "}
                          {selectedOrder.deliveryAddress.street},{" "}
                          {selectedOrder.deliveryAddress.city} -{" "}
                          {selectedOrder.deliveryAddress.pincode}
                        </p>
                        <p className="text-[11px] text-outline font-medium mt-1">
                          Contact: {selectedOrder.phone}
                        </p>
                      </div>

                      {/* 3. Items in this Order Card */}
                      <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/15">
                        <div className="flex items-center justify-between mb-3 text-xs">
                          <h4 className="font-headline-sm font-extrabold text-on-surface">
                            Items in this Order ({selectedOrder.items.length})
                          </h4>
                          <span className="font-price-card font-black text-primary">
                            Total: ₹{selectedOrder.pricingSummary.totalAmount}
                          </span>
                        </div>

                        {/* Items List */}
                        <div className="divide-y divide-outline-variant/15 max-h-56 overflow-y-auto pr-1">
                          {selectedOrder.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-surface-container-low shrink-0 flex items-center justify-center p-1 border border-outline-variant/15 overflow-hidden">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="max-w-full max-h-full object-contain"
                                    loading="lazy"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-bold text-on-surface line-clamp-1">
                                    {item.name}
                                  </h5>
                                  <span className="text-[11px] text-on-surface-variant">
                                    {item.unitSize} {item.unit} × {item.quantity}
                                  </span>
                                </div>
                              </div>
                              <span className="font-price-card font-extrabold text-on-surface shrink-0">
                                ₹{item.price * item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Price Breakdown */}
                        <div className="mt-3 pt-3 border-t border-outline-variant/15 space-y-1.5 text-xs">
                          <div className="flex justify-between text-on-surface-variant">
                            <span>Items Subtotal</span>
                            <span>₹{selectedOrder.pricingSummary.subtotal}</span>
                          </div>

                          {selectedOrder.pricingSummary.productSavings > 0 && (
                            <div className="flex justify-between text-primary font-medium">
                              <span>Product Savings</span>
                              <span>−₹{selectedOrder.pricingSummary.productSavings}</span>
                            </div>
                          )}

                          {Boolean(selectedOrder.pricingSummary.couponDiscount) && (
                            <div className="flex justify-between text-primary font-medium">
                              <span>Coupon Discount</span>
                              <span>−₹{selectedOrder.pricingSummary.couponDiscount}</span>
                            </div>
                          )}

                          {Boolean(selectedOrder.pricingSummary.coinDiscount) && (
                            <div className="flex justify-between text-secondary font-medium">
                              <span>Smart Coins Redeemed</span>
                              <span>−₹{selectedOrder.pricingSummary.coinDiscount}</span>
                            </div>
                          )}

                          <div className="flex justify-between text-on-surface-variant">
                            <span>60-Min Express Delivery</span>
                            <span>
                              {selectedOrder.pricingSummary.deliveryFee === 0
                                ? "FREE"
                                : `₹${selectedOrder.pricingSummary.deliveryFee}`}
                            </span>
                          </div>

                          <div className="flex justify-between text-on-surface-variant">
                            <span>Handling & Packaging</span>
                            <span>₹0</span>
                          </div>

                          <div className="border-t border-outline-variant/15 pt-2 flex justify-between font-bold text-sm text-on-surface">
                            <span>Total Amount Paid</span>
                            <span className="font-price-card text-base font-black text-primary">
                              ₹{selectedOrder.pricingSummary.totalAmount}
                            </span>
                          </div>
                        </div>

                        {/* Eligible Actions (Cancel or Return) */}
                        <div className="pt-3 text-center">
                          {(selectedOrder.status === "pending" ||
                            selectedOrder.status === "processing") && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(selectedOrder.orderId)}
                              className="text-xs font-bold text-error hover:underline cursor-pointer"
                            >
                              Cancel Order or Change Address
                            </button>
                          )}
                          {selectedOrder.status === "delivered" && (
                            <button
                              type="button"
                              onClick={() => handleRequestReturn(selectedOrder.orderId)}
                              className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                            >
                              Request 24-hr Return & Refund
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: PAST ORDER HISTORY (Screenshot 2) */}
              <div data-testid="past-order-history" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-headline-lg text-xl sm:text-2xl font-extrabold text-on-surface">
                      Past Order History
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Easily reorder staples or leave authentic feedback.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-outline">
                    Showing {filteredOrders.length} Order
                    {filteredOrders.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="p-8 rounded-2xl bg-surface-container-low/40 border border-outline-variant/15 text-center text-xs text-on-surface-variant">
                    No orders found matching the selected filter.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredOrders.map((order) => {
                      const isCurrentlyActive = selectedOrder?.orderId === order.orderId;
                      const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                      const itemsSummary = order.items.map((i) => i.name).join(", ");

                      return (
                        <div
                          key={order.id}
                          data-testid={`order-history-card-${order.orderId}`}
                          className={`p-5 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            isCurrentlyActive
                              ? "bg-primary/5 border-primary shadow-xs"
                              : "bg-surface-container-lowest border-outline-variant/15 hover:border-primary/40 shadow-xs"
                          }`}
                        >
                          {/* Order Info Left */}
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary shrink-0 border border-outline-variant/15">
                              <span className="material-symbols-outlined text-[20px]">
                                shopping_bag
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h3 className="font-headline-sm text-sm font-extrabold text-on-surface">
                                  #{order.orderId}
                                </h3>
                                <span
                                  className={`font-label-badge text-[10px] font-black uppercase px-2 py-0.2 rounded-full ${
                                    order.status === "delivered"
                                      ? "bg-primary/15 text-primary"
                                      : order.status === "in transit"
                                        ? "bg-primary text-white"
                                        : order.status === "cancelled" ||
                                            order.status === "returned"
                                          ? "bg-error/15 text-error"
                                          : "bg-secondary/15 text-secondary"
                                  }`}
                                >
                                  {order.status.toUpperCase()}
                                </span>
                              </div>

                              <p className="text-xs text-on-surface-variant font-medium">
                                Delivered on {orderDate} • {order.items.length} item
                                {order.items.length !== 1 ? "s" : ""} • Total ₹
                                {order.pricingSummary.totalAmount}
                              </p>

                              <p className="text-[11px] text-outline line-clamp-1 mt-0.5">
                                {itemsSummary}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons Right */}
                          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedOrderId(order.orderId);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="px-3.5 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-bold transition-colors cursor-pointer"
                            >
                              View Details
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setReviewOrder(order);
                                setShowReviewModal(true);
                              }}
                              className="px-3.5 py-2 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-primary text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                rate_review
                              </span>
                              <span>Rate & Review</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReorder(order)}
                              disabled={isReordering}
                              data-testid="reorder-button"
                              className="px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                replay
                              </span>
                              <span>Reorder 1-Click</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal: Need Help */}
        {showHelpModal && selectedOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/15">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    headset_mic
                  </span>
                  <h3 className="font-headline-sm text-base font-extrabold text-on-surface">
                    Support for Order #{selectedOrder.orderId}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitHelp} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-on-surface block mb-1">
                    Select Issue Category
                  </label>
                  <select
                    value={helpCategory}
                    onChange={(e) => setHelpCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary font-bold text-on-surface"
                  >
                    <option value="Delivery Query">Delivery Timing & Status Query</option>
                    <option value="Damaged / Missing Item">Damaged or Missing Items</option>
                    <option value="Address Change">Delivery Address Correction</option>
                    <option value="Payment Query">Payment or Refund Inquiries</option>
                    <option value="Quality Concern">Product Quality Feedback</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-on-surface block mb-1">
                    Describe your issue
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={helpMessage}
                    onChange={(e) => setHelpMessage(e.target.value)}
                    placeholder="Provide details about your delivery or items..."
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowHelpModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 font-bold text-outline hover:bg-surface-container cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingHelp}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-container shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingHelp ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Rate & Review */}
        {showReviewModal && reviewOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/15">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    star
                  </span>
                  <h3 className="font-headline-sm text-base font-extrabold text-on-surface">
                    Rate Order #{reviewOrder.orderId}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                <div className="text-center py-2">
                  <span className="text-xs text-on-surface-variant font-medium block mb-2">
                    How was your farm grocery experience?
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl transition-transform hover:scale-110 cursor-pointer ${
                          reviewRating >= star ? "text-[#fea619]" : "text-outline-variant"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="font-bold text-xs text-secondary mt-1 block">
                    {reviewRating} out of 5 Stars
                  </span>
                </div>

                <div>
                  <label className="font-bold text-on-surface block mb-1">
                    Your Feedback (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share what you liked about freshness, packaging, or speed..."
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 font-bold text-outline hover:bg-surface-container cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-primary-container shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
