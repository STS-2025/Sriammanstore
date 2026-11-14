/* eslint-disable prettier/prettier */
import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import type { NotificationItem, NotificationCategory } from "../types";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications & Store Updates — Sri Amman Smart Store" },
      {
        name: "description",
        content:
          "Live alerts for your harvest deliveries, exclusive seasonal stock arrivals, and coin credits.",
      },
    ],
  }),
  component: NotificationsPage,
});

type FilterTab = "all" | "orders" | "rewards" | "harvest";

export function NotificationsPage() {
  const { user, isLoading: authLoading, isResolvingIdentity } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    preferences,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    refreshNotifications,
  } = useNotifications();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [displayLimit, setDisplayLimit] = useState<number>(5);
  const [showMobileActionsSidebar, setShowMobileActionsSidebar] = useState(false);
  const [expandedMobileNotifId, setExpandedMobileNotifId] = useState<string | null>(null);
  const [showAlertSettingsModal, setShowAlertSettingsModal] = useState(false);
  // Alert Settings form state
  const [inAppAlerts, setInAppAlerts] = useState(preferences.inAppAlerts);
  const [orderUpdates, setOrderUpdates] = useState(preferences.orderUpdates);
  const [harvestAlerts, setHarvestAlerts] = useState(preferences.harvestAlerts);
  const [coinRewards, setCoinRewards] = useState(preferences.coinRewards);
  const [whatsappSmsMock, setWhatsappSmsMock] = useState(preferences.whatsappSmsMock);

  // Filter categorization logic
  const isOrderCategory = (cat: NotificationCategory) => cat === "orders";
  const isRewardCategory = (cat: NotificationCategory) => cat === "rewards" || cat === "account";
  const isHarvestCategory = (cat: NotificationCategory) => cat === "offers" || cat === "harvest";

  // Category counts
  const ordersCount = useMemo(
    () => notifications.filter((n) => isOrderCategory(n.category)).length,
    [notifications],
  );
  const rewardsCount = useMemo(
    () => notifications.filter((n) => isRewardCategory(n.category)).length,
    [notifications],
  );
  const harvestCount = useMemo(
    () => notifications.filter((n) => isHarvestCategory(n.category)).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "orders") return isOrderCategory(n.category);
      if (activeTab === "rewards") return isRewardCategory(n.category);
      if (activeTab === "harvest") return isHarvestCategory(n.category);
      return true;
    });
  }, [notifications, activeTab]);

  const visibleNotifications = useMemo(() => {
    return filteredNotifications.slice(0, displayLimit);
  }, [filteredNotifications, displayLimit]);

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (diffMins < 60) return `${Math.max(1, diffMins)} mins ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays === 1) {
        return `Yesterday, ${date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })}`;
      }
      return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "Recently";
    }
  };

  const navigateToNotificationTarget = (targetUrl?: string, orderId?: string) => {
    if (!targetUrl && orderId) {
      navigate({ to: "/orders", search: { id: orderId } as any });
      return;
    }
    if (!targetUrl) return;

    const [pathname, queryString] = targetUrl.split("?");
    if (queryString) {
      const params = new URLSearchParams(queryString);
      const searchObj: Record<string, string> = {};
      params.forEach((value, key) => {
        searchObj[key] = value;
      });
      navigate({ to: pathname as any, search: searchObj as any });
    } else if (pathname === "/orders" && orderId) {
      navigate({ to: "/orders", search: { id: orderId } as any });
    } else {
      navigate({ to: pathname as any });
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    if (!notif.read) {
      try {
        await markAsRead(notif.id);
      } catch {
        // Continue navigation even if markAsRead fails
      }
    }
    navigateToNotificationTarget(notif.actionUrl, notif.orderId);
  };

  const handleActionClick = async (e: React.MouseEvent, notif: NotificationItem, url?: string) => {
    e.stopPropagation();
    if (!notif.read) {
      try {
        await markAsRead(notif.id);
      } catch {
        // Continue navigation
      }
    }
    navigateToNotificationTarget(url || notif.actionUrl, notif.orderId);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return;
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleSaveAlertSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePreferences({
      inAppAlerts,
      orderUpdates,
      harvestAlerts,
      coinRewards,
      whatsappSmsMock,
    });
    setShowAlertSettingsModal(false);
    toast.success("Alert preferences saved successfully");
  };

  if ((authLoading || isResolvingIdentity) && !user) {
    return (
      <div className="bg-[#f8faf8] font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[800px] mx-auto px-4 py-20 text-center">
          <div className="w-9 h-9 border-3 border-[#005f3f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-on-surface-variant font-medium">
            Loading notifications...
          </p>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (!user && !isLoading && !authLoading && !isResolvingIdentity) {
    return (
      <div className="bg-[#f8faf8] font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[800px] mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center text-4xl mx-auto mb-5 shadow-inner">
            🔔
          </div>
          <h2 className="font-headline-lg text-2xl font-black text-on-surface mb-2">
            Please Sign In to Access Notifications
          </h2>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-8 leading-relaxed">
            Sign in with your mobile number to view real-time delivery dispatches, fresh oil batch
            harvest alerts, and Amman reward coin credits.
          </p>
          <Link
            to="/login"
            search={{ redirect: "/notifications" } as any}
            className="inline-flex items-center gap-2 bg-[#005f3f] text-white px-7 py-3.5 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-[#004d32] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            <span>Sign In with Phone OTP</span>
          </Link>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="bg-[#f8faf8] font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-20 min-h-[calc(100vh-80px)] pb-24">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Breadcrumbs */}
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-on-surface-variant mb-4">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span className="text-outline-variant/60">/</span>
            <Link to="/account" className="hover:text-primary transition-colors">
              My Account
            </Link>
            <span className="text-outline-variant/60">/</span>
            <span className="font-bold text-on-surface">Notifications Center</span>
          </nav>

          {/* Heading Row & Header Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h1 className="font-headline-lg text-xl sm:text-3xl font-black text-on-surface">
                  Notifications & Updates
                </h1>
                {unreadCount > 0 && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </span>
                )}
              </div>
            </div>

            <div className="hidden w-full flex-wrap items-center gap-2 shrink-0 sm:w-auto sm:gap-3 md:flex">
              <button
                type="button"
                data-testid="mark-all-read-btn"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
                className="inline-flex flex-1 items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-outline-variant/25 text-[11px] sm:text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs sm:flex-none sm:px-3.5"
              >
                <span className="material-symbols-outlined text-[16px] text-emerald-700">done_all</span>
                <span>Mark All as Read</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAlertSettingsModal(true)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-white border border-outline-variant/25 text-[11px] sm:text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer shadow-xs sm:flex-none sm:px-3.5"
              >
                <span className="material-symbols-outlined text-[16px]">tune</span>
                <span>Alert Settings</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowMobileActionsSidebar(true)}
            className="mb-4 inline-flex w-full items-center justify-between rounded-2xl border border-outline-variant/25 bg-white px-4 py-3 text-xs font-bold text-on-surface shadow-xs md:hidden"
            aria-label="Open notification filters and actions"
          >
            <span className="inline-flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">tune</span>
              Filters & actions
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-on-surface-variant">
              {activeTab === "all" ? "All Notifications" : activeTab}
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </span>
          </button>

          {/* Category Filter Chips */}
          <div className="hidden items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-4 sm:mb-6 md:flex">
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setDisplayLimit(5);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "all"
                  ? "bg-[#005f3f] text-white shadow-xs"
                  : "bg-white border border-outline-variant/25 text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <span>All Notifications</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === "all" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {notifications.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("orders");
                setDisplayLimit(5);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "orders"
                  ? "bg-[#005f3f] text-white shadow-xs"
                  : "bg-white border border-outline-variant/25 text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">local_shipping</span>
              <span>Orders & Delivery</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === "orders" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {ordersCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("rewards");
                setDisplayLimit(5);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "rewards"
                  ? "bg-[#005f3f] text-white shadow-xs"
                  : "bg-white border border-outline-variant/25 text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
              <span>Smart Coins & VIP</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === "rewards" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {rewardsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("harvest");
                setDisplayLimit(5);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "harvest"
                  ? "bg-[#005f3f] text-white shadow-xs"
                  : "bg-white border border-outline-variant/25 text-on-surface hover:bg-surface-container-low"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">spa</span>
              <span>New Stock Updates</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === "harvest" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {harvestCount}
              </span>
            </button>
          </div>

          {/* Notification List */}
          <div className="grid grid-cols-1 items-start">
            {/* ============================================================== */}
            {/* LEFT COLUMN: NOTIFICATION CARDS LIST                           */}
            {/* ============================================================== */}
            <div className="space-y-3 sm:space-y-4">
              {error && (
                <div
                  role="alert"
                  data-testid="notifications-error-banner"
                  className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-900"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-red-600">error</span>
                    <div>
                      <p className="text-xs font-bold">Failed to load notifications</p>
                      <p className="text-[11px] text-red-700">{error}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => refreshNotifications()}
                    className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {isLoading ? (
                <div className="py-20 text-center bg-white rounded-3xl border border-outline-variant/20">
                  <div className="w-8 h-8 border-3 border-[#005f3f] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-on-surface-variant font-medium">Loading notifications...</p>
                </div>
              ) : visibleNotifications.length === 0 ? (
                <div
                  data-testid="empty-notifications-view"
                  className="p-12 text-center bg-white rounded-3xl border border-outline-variant/20 shadow-xs"
                >
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#005f3f] flex items-center justify-center text-3xl mx-auto mb-3">
                    🔔
                  </div>
                  <h3 className="font-headline-lg text-base font-black text-on-surface mb-1">
                    No Notifications in this Category
                  </h3>
                  <p className="text-xs text-on-surface-variant max-w-sm mx-auto mb-4 leading-relaxed">
                    You have caught up with all updates for {activeTab === "all" ? "your account" : activeTab}.
                  </p>
                  {activeTab !== "all" && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("all")}
                      className="px-4 py-2 rounded-xl bg-[#005f3f] text-white text-xs font-bold shadow-xs hover:bg-[#004d32] transition-colors cursor-pointer"
                    >
                      View All Notifications
                    </button>
                  )}
                </div>
              ) : (
                visibleNotifications.map((notif) => {
                  const isOrder = isOrderCategory(notif.category);
                  const isReward = isRewardCategory(notif.category);
                  const isHarvest = isHarvestCategory(notif.category);

                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`relative bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border transition-all cursor-pointer hover:shadow-sm ${
                        notif.read
                          ? "border-outline-variant/20 opacity-90"
                          : "border-[#005f3f]/30 shadow-xs ring-1 ring-[#005f3f]/10"
                      }`}
                    >
                      {/* Left Accent indicator dot for unread */}
                      {!notif.read && (
                        <div className="absolute left-1 top-1 w-2 h-2 rounded-full bg-emerald-500 animate-pulse sm:left-3 sm:top-6"></div>
                      )}

                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Icon Circle */}
                        <div
                          className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                            isOrder
                              ? "bg-emerald-50 text-[#005f3f]"
                              : isHarvest
                              ? "bg-teal-50 text-teal-800"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px] sm:text-[22px]">
                            {isOrder
                              ? notif.badge?.includes("DELIVERED")
                                ? "check_circle"
                                : "electric_moped"
                              : isHarvest
                              ? "spa"
                              : notif.badge?.includes("VIP")
                              ? "workspace_premium"
                              : "monetization_on"}
                          </span>
                        </div>

                        {/* Card Content Area */}
                        <div className="flex-1 min-w-0">
                          {/* Top Badge & Timestamp Row */}
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                                isOrder
                                  ? notif.badge?.includes("DELIVERED")
                                    ? "bg-blue-50 text-blue-800 border border-blue-200/60"
                                    : "bg-emerald-50 text-[#005f3f] border border-emerald-200/60"
                                  : isHarvest
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                                  : "bg-amber-50 text-amber-900 border border-amber-200/60"
                              }`}
                            >
                              • {notif.badge || (isOrder ? "ORDER UPDATE" : isHarvest ? "HARVEST ALERT" : "REWARD UPDATE")}
                            </span>

                            <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-medium">
                              <span className="material-symbols-outlined text-[13px]">schedule</span>
                              <span>{formatTimestamp(notif.timestamp)}</span>
                            </div>
                          </div>

                          {/* Title */}
                          <h3 className="font-headline-sm text-sm font-black text-on-surface leading-snug">
                            {notif.title}
                          </h3>

                          {/* Description */}
                          <p className={`text-xs text-on-surface-variant mt-1 leading-relaxed ${
                            expandedMobileNotifId === notif.id ? "" : "line-clamp-2 sm:line-clamp-none"
                          }`}>
                            {notif.message}
                          </p>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setExpandedMobileNotifId((current) => current === notif.id ? null : notif.id);
                            }}
                            aria-expanded={expandedMobileNotifId === notif.id}
                            className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-[#005f3f] sm:hidden"
                          >
                            {expandedMobileNotifId === notif.id ? "Show less" : "More details"}
                            <span className="material-symbols-outlined text-[14px]">
                              {expandedMobileNotifId === notif.id ? "expand_less" : "expand_more"}
                            </span>
                          </button>

                          {/* Extra Contextual Strips & Snippets */}
                          <div className={expandedMobileNotifId === notif.id ? "mt-3 space-y-2" : "hidden sm:block mt-3 space-y-2"}>
                          {/* 1. Live Driver Context Strip */}
                          {notif.driverName && (
                            <div className="mt-3 p-3 bg-surface-container-low/70 border border-outline-variant/15 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#005f3f] text-white text-xs font-black flex items-center justify-center shrink-0">
                                  MK
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-black text-on-surface truncate">
                                    {notif.driverName}
                                  </div>
                                  <div className="text-[10px] text-on-surface-variant">
                                    Vehicle: {notif.driverVehicle || "TVS iQube EV"} • Speed: 24 km/h
                                  </div>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={(e) => handleActionClick(e, notif, notif.actionUrl)}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#005f3f] hover:bg-[#004d32] text-white text-xs font-black shadow-xs transition-all self-start sm:self-auto cursor-pointer"
                              >
                                <span>Track Live Order</span>
                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                              </button>
                            </div>
                          )}

                          {/* 2. Highlight Note (e.g. Lab Tested for Fresh Batches) */}
                          {notif.highlightNote && (
                            <div className="mt-2.5 flex items-center gap-3 text-[11px] text-on-surface-variant flex-wrap">
                              <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                                {notif.highlightNote}
                              </span>
                            </div>
                          )}

                          {/* Action Buttons Row (when not in driver strip) */}
                          {!notif.driverName && (notif.ctaText || notif.actionUrl) && (
                            <div className="mt-3 flex items-center gap-3 flex-wrap">
                              {notif.ctaText && (
                                <button
                                  type="button"
                                  onClick={(e) => handleActionClick(e, notif, notif.actionUrl)}
                                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${
                                    isOrder
                                      ? "bg-[#005f3f] text-white hover:bg-[#004d32]"
                                      : isHarvest
                                      ? "bg-[#8b4513] text-white hover:bg-[#6d340c]"
                                      : "bg-white border border-amber-300 text-amber-900 hover:bg-amber-50"
                                  }`}
                                >
                                  <span>{notif.ctaText}</span>
                                  <span className="material-symbols-outlined text-[14px]">
                                    {isOrder ? "receipt" : "arrow_forward"}
                                  </span>
                                </button>
                              )}

                              {notif.secondaryCtaText && (
                                <button
                                  type="button"
                                  onClick={(e) =>
                                    handleActionClick(e, notif, notif.secondaryActionUrl || notif.actionUrl)
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer"
                                >
                                  <span>{notif.secondaryCtaText}</span>
                                </button>
                              )}
                            </div>
                          )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Pagination / Load More Footer */}
              {filteredNotifications.length > 0 && (
                <div className="pt-4 pb-2 text-center">
                  <p className="text-xs text-on-surface-variant mb-2 font-medium">
                    Showing <span className="font-bold text-on-surface">{visibleNotifications.length}</span> of{" "}
                    <span className="font-bold text-on-surface">{filteredNotifications.length}</span> notifications
                  </p>
                  {displayLimit < filteredNotifications.length && (
                    <button
                      type="button"
                      onClick={() => setDisplayLimit((prev) => prev + 5)}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-white border border-outline-variant/25 text-xs font-black text-[#005f3f] hover:bg-emerald-50 transition-colors shadow-xs cursor-pointer"
                    >
                      <span>Load More Notifications</span>
                      <span className="material-symbols-outlined text-[16px]">expand_more</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ============================================================== */}

          </div>
        </div>
      </main>

      {showMobileActionsSidebar && (
        <div
          className="fixed inset-0 z-[60] bg-black/45 md:hidden"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowMobileActionsSidebar(false);
          }}
        >
          <aside
            className="flex h-full w-[min(20rem,86vw)] flex-col overflow-y-auto bg-white p-4 pt-[max(1rem,env(safe-area-inset-top))] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Notification filters and actions"
          >
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
              <div>
                <h2 className="text-base font-black text-on-surface">Notifications</h2>
                <p className="mt-0.5 text-[11px] text-on-surface-variant">
                  {unreadCount} unread updates
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileActionsSidebar(false)}
                aria-label="Close filters and actions"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-2 border-b border-outline-variant/20 pb-5">
              <button
                type="button"
                onClick={() => {
                  setShowMobileActionsSidebar(false);
                  handleMarkAllRead();
                }}
                disabled={unreadCount === 0}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-outline-variant/20 px-3 text-left text-xs font-bold text-on-surface disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">done_all</span>
                Mark all as read
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMobileActionsSidebar(false);
                  setShowAlertSettingsModal(true);
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-outline-variant/20 px-3 text-left text-xs font-bold text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">settings</span>
                Alert settings
              </button>
            </div>

            <div className="pt-5">
              <h3 className="mb-2 px-1 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                Filter notifications
              </h3>
              <div className="space-y-1">
                {([
                  { id: "all", label: "All Notifications", count: notifications.length, icon: "notifications" },
                  { id: "orders", label: "Orders & Delivery", count: ordersCount, icon: "local_shipping" },
                  { id: "rewards", label: "Smart Coins & VIP", count: rewardsCount, icon: "workspace_premium" },
                  { id: "harvest", label: "New Stock Updates", count: harvestCount, icon: "spa" },
                ] as const).map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(filter.id);
                      setDisplayLimit(5);
                      setShowMobileActionsSidebar(false);
                    }}
                    aria-pressed={activeTab === filter.id}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-xs font-bold transition-colors ${
                      activeTab === filter.id
                        ? "bg-emerald-50 text-[#005f3f]"
                        : "text-on-surface hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{filter.icon}</span>
                    <span className="flex-1">{filter.label}</span>
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px]">
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ============================================================== */}
      {/* ALERT SETTINGS MODAL                                           */}
      {/* ============================================================== */}
      {showAlertSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-md w-full shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#005f3f] text-[22px]">tune</span>
                <h3 className="font-headline-lg text-lg font-black text-on-surface">
                  Notification Alert Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAlertSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
              Configure which store alerts and delivery notifications appear in your personal vault.
            </p>

            <form onSubmit={handleSaveAlertSettings} className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
                <div>
                  <div className="font-bold text-on-surface">In-App Vault Notifications</div>
                  <div className="text-[10px] text-on-surface-variant">Live dispatches, pins, and credits</div>
                </div>
                <input
                  type="checkbox"
                  checked={inAppAlerts}
                  onChange={(e) => setInAppAlerts(e.target.checked)}
                  className="rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
                <div>
                  <div className="font-bold text-on-surface">Order & Dispatch Updates</div>
                  <div className="text-[10px] text-on-surface-variant">Real-time milestones from farm hub</div>
                </div>
                <input
                  type="checkbox"
                  checked={orderUpdates}
                  onChange={(e) => setOrderUpdates(e.target.checked)}
                  className="rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15">
                <div>
                  <div className="font-bold text-on-surface">Smart Coins & VIP Perks</div>
                  <div className="text-[10px] text-on-surface-variant">Passbook credits and reward multipliers</div>
                </div>
                <input
                  type="checkbox"
                  checked={coinRewards}
                  onChange={(e) => setCoinRewards(e.target.checked)}
                  className="rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
                />
              </div>

              <div className="border-t border-outline-variant/20 pt-3">
                <h4 className="mb-2 text-[10px] font-black uppercase tracking-wider text-on-surface-variant">
                  Alert Channels
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-3">
                    <div className="min-w-0">
                      <div className="font-bold text-on-surface">New Stock Influx</div>
                      <div className="text-[10px] text-on-surface-variant">Alerts when new products and items arrive.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={harvestAlerts}
                      onChange={(e) => setHarvestAlerts(e.target.checked)}
                      className="shrink-0 rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-3">
                    <div className="min-w-0">
                      <div className="font-bold text-on-surface">Instant WhatsApp & SMS</div>
                      <div className="text-[10px] text-on-surface-variant">
                        Driver GPS links and OTP alerts to {user?.phone || "+91 98400 12345"}.
                      </div>
                      <span className="mt-1 inline-block rounded border border-amber-200/50 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-800">
                        Simulated channel
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={whatsappSmsMock}
                      onChange={(e) => setWhatsappSmsMock(e.target.checked)}
                      className="shrink-0 rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
                    />
                  </div>

                  <div className="rounded-2xl border border-emerald-200/50 bg-emerald-50/60 p-3">
                    <div className="mb-1 flex items-center gap-1.5 font-bold text-emerald-950">
                      <span className="material-symbols-outlined text-[15px] text-emerald-800">bedtime</span>
                      Delivery Quiet Hours
                    </div>
                    <p className="text-[10px] leading-relaxed text-emerald-900">
                      No promotional sounds or calls from 10:00 PM to 6:30 AM. This store policy is always enforced.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAlertSettingsModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold bg-[#005f3f] text-white shadow-md hover:bg-[#004d32] transition-colors cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
