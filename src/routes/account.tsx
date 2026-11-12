import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { useAuth } from "../context/AuthContext";
import { orderService } from "../services/orderService";
import { addressService } from "../services/addressService";
import { wishlistService } from "../services/wishlistService";
import { coinService } from "../services/coinService";
import { notificationService } from "../services/notificationService";
import { toast } from "sonner";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account | Sri Amman Smart Store" },
      { name: "description", content: "Choose an account page to manage your orders, profile, addresses, and preferences." },
    ],
  }),
  component: AccountPage,
});

interface AccountSummary {
  totalOrders: number;
  activeOrders: number;
  savedAddresses: number;
  wishlistItems: number;
  smartCoins: number;
  unreadNotifications: number;
  isVip: boolean;
}

const EMPTY_SUMMARY: AccountSummary = {
  totalOrders: 0,
  activeOrders: 0,
  savedAddresses: 0,
  wishlistItems: 0,
  smartCoins: 0,
  unreadNotifications: 0,
  isVip: false,
};

function AccountPage() {
  const { user, isLoading: authLoading, isResolvingIdentity, logout } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<AccountSummary>(EMPTY_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setSummary(EMPTY_SUMMARY);
      setSummaryLoading(false);
      return;
    }

    let cancelled = false;
    setSummaryLoading(true);
    const loadSummary = async () => {
      const [ordersResult, addressesResult, wishlistResult, notificationsResult, coinsResult] =
        await Promise.allSettled([
          orderService.getOrders(user.id, user.legacySassId),
          addressService.getAddresses(user.id, user.legacySassId),
          wishlistService.getWishlistProducts(undefined, user.id),
          notificationService.getNotifications(user.id, user.legacySassId),
          coinService.getUserCoins(user.id, user.legacySassId),
        ]);

      if (cancelled) return;
      const orders = ordersResult.status === "fulfilled" ? ordersResult.value || [] : [];
      const addresses = addressesResult.status === "fulfilled" ? addressesResult.value || [] : [];
      const wishlist = wishlistResult.status === "fulfilled" ? wishlistResult.value || [] : [];
      const notifications = notificationsResult.status === "fulfilled" ? notificationsResult.value || [] : [];
      const calculatedVip = coinService.calculateVIPStatus(orders, 5000).isVIP;

      setSummary({
        totalOrders: orders.length,
        activeOrders: orders.filter((order) =>
          ["pending", "processing", "packed", "in transit"].includes(order.status),
        ).length,
        savedAddresses: addresses.length,
        wishlistItems: wishlist.length,
        smartCoins:
          coinsResult.status === "fulfilled" && typeof coinsResult.value === "number"
            ? coinsResult.value
            : user.smartCoins ?? user.coins ?? 0,
        unreadNotifications: notifications.filter((notification) => !notification.read).length,
        isVip: calculatedVip || Boolean(user.isVIP),
      });
      setSummaryLoading(false);
    };

    void loadSummary().catch((error) => {
      console.warn("Could not load account menu counts:", error);
      if (!cancelled) setSummaryLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.legacySassId, user?.smartCoins, user?.coins, user?.isVIP]);

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to log out of your account?")) return;
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate({ to: "/login" as any });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not log out");
    }
  };

  if (authLoading || isResolvingIdentity) {
    return (
      <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
        <StoreHeader />
        <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-on-surface-variant">Loading your account…</p>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
        <StoreHeader />
        <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center">
          <h1 className="mb-2 text-2xl font-extrabold">Sign in to open your account</h1>
          <p className="mb-6 text-sm text-on-surface-variant">
            Sign in to view your orders, saved addresses, rewards, and account settings.
          </p>
          <Link
            to="/login"
            search={{ redirect: "/account" } as any}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-white"
          >
            Sign In
          </Link>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  const options = [
    {
      label: "Profile Information",
      detail: "Name, mobile number, and email",
      icon: "person",
      to: "/profile",
    },
    {
      label: "My Orders",
      detail: "Track, return, or review orders",
      icon: "receipt_long",
      to: "/orders",
      badge: summary.activeOrders > 0 ? `${summary.activeOrders} Active` : undefined,
    },
    {
      label: "Saved Addresses",
      detail: "Manage your delivery locations",
      icon: "location_on",
      to: "/addresses",
      badge: `${summary.savedAddresses} Saved`,
    },
    {
      label: "Wishlist & Collections",
      detail: "Products you have saved",
      icon: "favorite_border",
      to: "/wishlist",
      badge: `${summary.wishlistItems} Items`,
    },
    {
      label: "Smart Coins & Rewards",
      detail: "Balance and reward history",
      icon: "monetization_on",
      to: "/rewards",
      badge: `${summary.smartCoins} Available`,
    },
    {
      label: "VIP Privilege Pass",
      detail: "Membership status and benefits",
      icon: "workspace_premium",
      to: "/rewards",
      badge: summary.isVip ? "Active Pass" : "View Benefits",
    },
    {
      label: "Refer & Earn",
      detail: "Invite friends and earn rewards",
      icon: "share",
      to: "/refer",
      badge: "Earn ₹100",
    },
    {
      label: "Notifications",
      detail: "Order updates and messages",
      icon: "notifications",
      to: "/notifications",
      badge: summary.unreadNotifications > 0 ? `${summary.unreadNotifications} Unread` : undefined,
    },
    {
      label: "Account Settings & Privacy",
      detail: "Manage communication preferences",
      icon: "shield",
      to: "/settings",
    },
    {
      label: "Reset Password",
      detail: "Get a password reset link by email",
      icon: "lock_reset",
      to: "/reset-password",
    },
    {
      label: "Help, Support & FAQ",
      detail: "Get help with your account or order",
      icon: "help_outline",
      to: "/help",
    },
    {
      label: "Store Policies & Legal",
      detail: "Privacy, shipping, and returns",
      icon: "policy",
      to: "/policies",
    },
  ];

  const dashboardItems = [
    { label: "Total Orders", value: summary.totalOrders, icon: "shopping_bag", to: "/orders" },
    { label: "Wishlist Products", value: summary.wishlistItems, icon: "favorite_border", to: "/wishlist" },
    { label: "Smart Coins", value: summary.smartCoins, icon: "monetization_on", to: "/rewards" },
    { label: "Saved Addresses", value: summary.savedAddresses, icon: "location_on", to: "/addresses" },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf8] font-body-md text-on-surface antialiased">
      <StoreHeader />
      <main className="min-h-[calc(100vh-80px)] px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-5">
            <h1 className="text-2xl font-extrabold text-on-surface sm:text-3xl">My Account</h1>
            <p className="mt-1 text-sm text-on-surface-variant">Choose a section to manage your account.</p>
          </div>

          <section aria-label="Account summary" className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {dashboardItems.map((item) => (
              <Link
                key={item.label}
                to={item.to as any}
                className="rounded-2xl border border-outline-variant/20 bg-white p-3 shadow-sm transition-colors hover:bg-surface-container-low sm:p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-on-surface-variant sm:text-xs">{item.label}</span>
                  <span className="material-symbols-outlined shrink-0 text-[17px] text-primary sm:text-[20px]">{item.icon}</span>
                </div>
                <span className="block truncate text-xl font-black text-on-surface sm:text-2xl">
                  {summaryLoading ? "--" : item.value.toLocaleString("en-IN")}
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-primary">
                  View details
                  <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                </span>
              </Link>
            ))}
          </section>

          <nav aria-label="Account options" className="overflow-hidden rounded-3xl border border-outline-variant/20 bg-white shadow-sm">
            <div className="divide-y divide-outline-variant/15">
              {options.map((option) => (
                <Link
                  key={option.label}
                  to={option.to as any}
                  className="group flex min-h-[68px] items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-container-low sm:gap-4 sm:px-5"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-low text-primary group-hover:bg-primary/10">
                    <span className="material-symbols-outlined text-[21px]">{option.icon}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-on-surface">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-on-surface-variant">{option.detail}</span>
                  </span>
                  {option.badge && (
                    <span className="inline-flex max-w-24 shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[9px] font-bold text-primary sm:max-w-none sm:px-2.5 sm:text-[10px]">
                      {option.badge}
                    </span>
                  )}
                  <span className="material-symbols-outlined shrink-0 text-[20px] text-outline-variant transition-transform group-hover:translate-x-0.5 group-hover:text-primary">
                    chevron_right
                  </span>
                </Link>
              ))}
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="group flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-red-50 sm:gap-4 sm:px-5"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                  <span className="material-symbols-outlined text-[21px]">logout</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-red-700">Log Out</span>
                  <span className="mt-0.5 block text-xs text-on-surface-variant">Sign out of this account</span>
                </span>
              </button>
            </div>
          </nav>
        </div>
      </main>
      <StoreFooter />
      <BottomNav />
    </div>
  );
}
