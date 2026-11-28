import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import {
  coinService,
  convertCoinsToRupees,
  getCoinExpiryDate,
  OFFICIAL_COIN_CONVERSION_RATE,
} from "../services/coinService";
import { orderService } from "../services/orderService";
import { referralService } from "../services/referralService";
import {
  LEGACY_CHECKOUT_DEFAULTS,
  settingsService,
  type LegacyCheckoutSettings,
} from "../services/settingsService";
import type { CoinTransaction, Order, ReferralFriend, StoreInfo } from "../types";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { authManager } from "../services/authAdapter";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Smart Coins & VIP Privilege Hub — Sriman Smart Store" },
      {
        name: "description",
        content:
          "Check your loyalty coin balance, view transaction ledger, share referral codes, and track 30-day VIP Privilege progress.",
      },
    ],
  }),
  component: RewardsPage,
});

type ActivityFilter = "all" | "earned" | "redeemed" | "expiring";

export function RewardsPage() {
  const { user, isLoading: authLoading, isResolvingIdentity, refreshUser } = useAuth();

  const [coinHistory, setCoinHistory] = useState<CoinTransaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [referrals, setReferrals] = useState<ReferralFriend[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [conversionRate, setConversionRate] = useState<number>(OFFICIAL_COIN_CONVERSION_RATE);
  const [coinPolicy, setCoinPolicy] = useState<LegacyCheckoutSettings>(LEGACY_CHECKOUT_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [rewardsError, setRewardsError] = useState<string | null>(null);
  const [verifiedBalance, setVerifiedBalance] = useState<number | null>(null);

  // Activity filter & pagination
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [displayCount, setDisplayCount] = useState<number>(5);

  const activeRequestRef = useRef<number>(0);

  // Keep auth readiness separate so settling auth does not refetch for the same user.
  useEffect(() => {
    if (!user && !authLoading && !isResolvingIdentity) setLoading(false);
  }, [user, authLoading, isResolvingIdentity]);

  const loadRewardsData = useCallback(async () => {
    if (!user) return;
    const requestId = ++activeRequestRef.current;
    setLoading(true);
    setRewardsError(null);

    try {
      const [historyResult, ordersResult, referralsResult, storeResult, balanceResult, coinPolicyResult] =
        await Promise.allSettled([
          coinService.getCoinHistory(user.id, user.legacySassId),
          orderService.getOrders(user.id, user.legacySassId),
          referralService.getReferrals(user.id, user.legacySassId),
          settingsService.getStoreInfo(),
          coinService.getUserCoins(user.id, user.legacySassId),
          settingsService.getLegacyCheckoutSettings(),
        ]);

      // If a newer request was dispatched while this was in flight, discard this result
      if (requestId !== activeRequestRef.current) {
        return;
      }

      if (historyResult.status === "fulfilled") {
        setCoinHistory(historyResult.value || []);
      } else {
        console.error("Failed to load coin history:", historyResult.reason);
        setCoinHistory([]);
      }

      if (ordersResult.status === "fulfilled") {
        setOrders(ordersResult.value || []);
      } else {
        console.error("Failed to load user orders for VIP calculation:", ordersResult.reason);
        setOrders([]);
      }

      if (referralsResult.status === "fulfilled") {
        setReferrals(referralsResult.value || []);
      } else {
        console.error("Failed to load referrals:", referralsResult.reason);
        setReferrals([]);
      }

      let storeCandidateRate: number | undefined;
      if (storeResult.status === "fulfilled" && storeResult.value) {
        setStoreInfo(storeResult.value);
        storeCandidateRate = storeResult.value.coinValueInRupees;
      } else {
        setStoreInfo(null);
      }

      if (balanceResult.status === "fulfilled" && typeof balanceResult.value === "number") {
        setVerifiedBalance(balanceResult.value);
      }
      if (coinPolicyResult.status === "fulfilled") setCoinPolicy(coinPolicyResult.value);

      // Terminal error state: if both coin history and balance failed, display actionable error
      if (historyResult.status === "rejected" && balanceResult.status === "rejected") {
        const errorReason = historyResult.reason ?? balanceResult.reason;
        const msg =
          errorReason instanceof Error
            ? errorReason.message
            : "Failed to load rewards data from store.";
        setRewardsError(msg);
      }

      // Strict guard: reject obsolete legacy ₹0.50 rate or invalid non-positive rate
      if (
        typeof storeCandidateRate === "number" &&
        storeCandidateRate > 0 &&
        storeCandidateRate !== 0.5
      ) {
        setConversionRate(storeCandidateRate);
      } else {
        setConversionRate(OFFICIAL_COIN_CONVERSION_RATE);
      }
    } catch (err: unknown) {
      if (requestId !== activeRequestRef.current) return;
      console.error("Failed to load rewards data:", err);
      const msg =
        err instanceof Error ? err.message : "Failed to load rewards data from store.";
      setRewardsError(msg);
      setCoinHistory([]);
      setConversionRate(OFFICIAL_COIN_CONVERSION_RATE);
    } finally {
      if (requestId === activeRequestRef.current) {
        setLoading(false);
      }
    }
  }, [user?.id, user?.legacySassId]);

  useEffect(() => {
    loadRewardsData();
  }, [loadRewardsData]);

  // Derived ledger statistics
  const ledgerStats = useMemo(() => {
    return coinService.calculateLedgerStats(coinHistory);
  }, [coinHistory]);

  // Guaranteed official conversion rate: guarantees that the obsolete 0.50 rate cannot be used
  const effectiveConversionRate = useMemo(() => {
    const rawRate = storeInfo?.coinValueInRupees ?? conversionRate;
    if (typeof rawRate === "number" && rawRate > 0 && rawRate !== 0.5) {
      return rawRate;
    }
    return OFFICIAL_COIN_CONVERSION_RATE;
  }, [storeInfo, conversionRate]);

  // Verified binary VIP calculation: rolling 30-day delivered orders >= 5000
  const vipStats = useMemo(() => {
    const threshold = storeInfo?.vipSpendingThreshold || 5000;
    return coinService.calculateVIPStatus(orders, threshold);
  }, [orders, storeInfo]);

  // Derived referral statistics
  const referralStats = useMemo(() => {
    return referralService.calculateReferralStats(referrals, effectiveConversionRate);
  }, [referrals, effectiveConversionRate]);

  // Filtered coin transactions
  const filteredActivities = useMemo(() => {
    const now = Date.now();
    const expiringWindowMs = 30 * 24 * 60 * 60 * 1000;

    return coinHistory.filter((tx) => {
      if (activityFilter === "earned") return tx.type === "earned";
      if (activityFilter === "redeemed") return tx.type === "redeemed";
      if (activityFilter === "expiring") {
        if (tx.type !== "earned") return false;
        const earnedAt = new Date(tx.timestamp);
        const expiry = tx.expiresAt
          ? new Date(tx.expiresAt).getTime()
          : new Date(getCoinExpiryDate(earnedAt, coinPolicy.coinValidityMonths)).getTime();
        return expiry > now && expiry <= now + expiringWindowMs;
      }
      return true;
    });
  }, [coinHistory, activityFilter, coinPolicy.coinValidityMonths]);

  const visibleActivities = useMemo(() => {
    return filteredActivities.slice(0, displayCount);
  }, [filteredActivities, displayCount]);

  // Balance display: prefers authoritative balance from storage, fallback to user.smartCoins or ledger net balance
  const coinBalance = verifiedBalance ?? user?.smartCoins ?? user?.coins ?? ledgerStats.netBalance;
  const cashEquivalent = convertCoinsToRupees(coinBalance, effectiveConversionRate).toFixed(2);

  // Referral copy handler
  const handleCopyReferral = () => {
    const code = user?.referralCode || user?.id || "";
    if (!code) {
      toast.error("Referral code not available");
      return;
    }
    navigator.clipboard.writeText(code);
    toast.success(`Referral code "${code}" copied to clipboard!`);
  };

  // WhatsApp share handler
  const handleShareWhatsApp = () => {
    const code = user?.referralCode || user?.id || "";
    if (!code) {
      toast.error("Referral code not available");
      return;
    }
    const text = encodeURIComponent(
      `Hey! Order authentic cold-pressed oils, organic grains & heirloom spices from Sriman Smart Store. Use my code ${code} to get ₹100 off your first cart! https://sriammanstore.com/shop?ref=${code}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  if ((authLoading || isResolvingIdentity) && !user) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[1000px] flex-col items-center justify-center px-margin-desktop pb-16 pt-20 text-center">
          <div className="w-9 h-9 border-3 border-[#005f3f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-on-surface-variant font-medium">
            Loading Amman rewards & coins...
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
        <main className="w-full pt-20 max-w-[1000px] mx-auto px-margin-desktop py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-4xl mx-auto mb-4">
            🪙
          </div>
          <h2 className="font-headline-lg text-xl font-bold text-on-surface mb-2">
            Please Sign In to Access Amman Rewards & VIP Hub
          </h2>
          <p className="text-xs text-on-surface-variant mb-6 max-w-md mx-auto">
            Sign in with your mobile number to view your Smart Coins balance, transaction ledger, and VIP tier benefits.
          </p>
          <Link
            to="/login"
            search={{ redirect: "/rewards" } as any}
            className="inline-flex items-center gap-2 bg-[#005f3f] text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-[#004e33] transition-all"
          >
            <span>Sign In with Mobile OTP</span>
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

      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]">
        <div className="max-w-[1320px] mx-auto px-margin-desktop py-4 sm:py-space-xl">
          {/* Breadcrumb Navigation */}
          <nav className="hidden md:flex items-center gap-2 text-xs text-on-surface-variant mb-4">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">home</span>
              <span>Home</span>
            </Link>
            <span className="text-outline-variant">›</span>
            <Link to="/account" className="hover:text-primary transition-colors">
              My Account
            </Link>
            <span className="text-outline-variant">›</span>
            <span className="text-on-surface font-semibold">Smart Coins & VIP Hub</span>
          </nav>

          {/* Heading Bar with Live Conversion Pill */}
          <div className="mb-5 flex flex-col justify-between gap-2 sm:mb-8 sm:gap-4 lg:flex-row lg:items-center">
            <div>
              <h1 className="font-headline-lg text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl md:text-3xl">
                <span className="sm:hidden">Rewards</span>
                <span className="hidden sm:inline">Smart Coins & VIP Privilege Hub</span>
              </h1>
            </div>

            {/* Live Conversion Rate Pill */}
            <div className="flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1.5 shadow-xs sm:gap-2 sm:px-4 sm:py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="text-[10px] font-extrabold text-emerald-900 sm:text-xs">
                Live Conversion: 1 Coin = ₹{effectiveConversionRate.toFixed(2)} Instant Cash
              </span>
            </div>
          </div>

          {/* Main Content Area: Loading / Error / Normal Dashboard */}
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xs text-on-surface-variant font-medium">
                Loading your rewards and coin balance...
              </p>
            </div>
          ) : rewardsError ? (
            <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto border border-red-200 my-12 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-3xl mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">cloud_off</span>
              </div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-2">
                Unable to Load Rewards Data
              </h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                {rewardsError}
              </p>
              <button
                type="button"
                onClick={() => loadRewardsData()}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <>
              {/* Top Two-Card Grid: Coins Vault & VIP Privilege Card */}
              <div className="mb-8 grid grid-cols-1 gap-3 sm:gap-6 lg:mb-12 lg:grid-cols-12">
            {/* Card 1: Available Balance / Smart Coins Vault (7 Cols) */}
            <div className="flex flex-col justify-between rounded-2xl border border-amber-200/70 bg-gradient-to-br from-[#fffdf5] via-[#fffbf0] to-[#fbf7eb] p-4 shadow-sm sm:rounded-3xl sm:p-6 md:p-8 lg:col-span-7">
              <div>
                {/* Header */}
                <div className="mb-3 flex items-center justify-between sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-lg shadow-xs sm:h-10 sm:w-10 sm:rounded-2xl sm:text-xl">
                      🪙
                    </div>
                    <div>
                      <span className="font-headline-sm text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                        AVAILABLE BALANCE
                      </span>
                      <h3 className="font-headline-lg text-base font-bold text-on-surface sm:text-lg">
                        Smart Coins Vault
                      </h3>
                    </div>
                  </div>
                  <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-100/80 px-2 py-1 text-[9px] font-extrabold text-emerald-900 shadow-xs sm:px-3 sm:text-[11px]">
                    <span>✔</span>
                    <span className="sm:hidden">Ready</span>
                    <span className="hidden sm:inline">Verified & Ready</span>
                  </span>
                </div>

                {/* Big Balance & Cash Valuation */}
                <div className="mb-2 flex flex-wrap items-baseline gap-2 sm:mb-3 sm:gap-3">
                  <span className="font-headline-lg text-3xl font-black tracking-tight text-on-surface sm:text-4xl md:text-5xl">
                    {coinBalance}
                  </span>
                  <span className="font-headline-sm text-sm font-bold text-on-surface-variant sm:text-lg">
                    Smart Coins
                  </span>
                  <span className="flex items-center gap-1 rounded-xl border border-cyan-200 bg-cyan-50 px-2 py-1 text-[10px] font-extrabold text-cyan-800 shadow-xs sm:px-3 sm:text-xs">
                    <span className="material-symbols-outlined text-[15px]">sell</span>
                    <span>Valued at ₹{cashEquivalent} Cart Discount</span>
                  </span>
                </div>

                <p className="mb-4 hidden text-xs leading-relaxed text-on-surface-variant sm:mb-6 sm:block">
                  Apply seamlessly on your cart summary during checkout with no minimum order constraints. Valid across Mara Chekku Oils, Heirloom Rice, & Farm Fresh Greens.
                </p>

                {/* Monthly Ledger Stats Pills */}
                <div className="mb-4 grid grid-cols-2 gap-2 sm:mb-6 sm:gap-3">
                  <div className="flex items-center gap-2 rounded-xl border border-amber-200/40 bg-white/80 p-2.5 shadow-xs sm:gap-3 sm:rounded-2xl sm:p-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 sm:h-8 sm:w-8">
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px]">trending_up</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold uppercase text-on-surface-variant sm:text-[10px]">
                        Earned this month
                      </span>
                      <span className="font-headline-sm text-xs font-extrabold text-emerald-800 sm:text-sm">
                        +{ledgerStats.earnedThisMonth} Coins
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-xl border border-amber-200/40 bg-white/80 p-2.5 shadow-xs sm:gap-3 sm:rounded-2xl sm:p-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-800 sm:h-8 sm:w-8">
                      <span className="material-symbols-outlined text-[16px] sm:text-[18px]">shopping_bag</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold uppercase text-on-surface-variant sm:text-[10px]">
                        Redeemed this month
                      </span>
                      <span className="font-headline-sm text-xs font-extrabold text-rose-700 sm:text-sm">
                        -{ledgerStats.redeemedThisMonth} Coins
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-2 pt-1 sm:gap-3 sm:pt-2">
                <Link
                  to="/cart"
                  className="flex items-center gap-1.5 rounded-xl bg-[#005f3f] px-3.5 py-2.5 font-headline-sm text-[10px] font-bold text-white shadow-md transition-all hover:bg-[#004e33] active:scale-95 sm:gap-2 sm:rounded-2xl sm:px-6 sm:py-3 sm:text-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                  <span className="sm:hidden">Redeem</span>
                  <span className="hidden sm:inline">Redeem on Next Order</span>
                </Link>

                <a
                  href="#how-coins-work"
                  className="flex items-center gap-1 rounded-xl bg-surface-container px-3 py-2.5 font-headline-sm text-[10px] font-bold text-on-surface transition-all hover:bg-surface-container-high sm:gap-1.5 sm:rounded-2xl sm:px-5 sm:py-3 sm:text-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">help</span>
                  <span className="sm:hidden">How it works</span>
                  <span className="hidden sm:inline">How to Earn More</span>
                </a>
              </div>
            </div>

            {/* Card 2: VIP Privilege Card (5 Cols) */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#1b3826] bg-[#102217] p-4 text-white shadow-lg sm:rounded-3xl sm:p-6 md:p-8 lg:col-span-5">
              <div className="relative z-10">
                {/* Header */}
                <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-lg text-amber-400 shadow-xs sm:h-10 sm:w-10 sm:rounded-2xl sm:text-xl">
                      👑
                    </div>
                    <div>
                      <span className="font-headline-sm text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                        PRIVILEGE STATUS
                      </span>
                      <h3 className="flex items-center gap-1.5 font-headline-lg text-sm font-bold text-white sm:text-lg">
                        <span>{vipStats.isVIP ? "VIP Privilege Member" : "Standard Customer"}</span>
                        {vipStats.isVIP && <span className="text-amber-400">★</span>}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-[9px] font-extrabold uppercase text-white/60 sm:text-[10px]">
                      MEMBERSHIP
                    </span>
                    <span className="text-[10px] font-bold text-amber-300 sm:text-xs">
                      {vipStats.isVIP ? "Active (30-Day Window)" : "Rolling Evaluation"}
                    </span>
                  </div>
                </div>

                {/* Progress Bar (Binary ₹5,000 Rolling 30-Day Rule) */}
                <div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:mb-5 sm:rounded-2xl sm:p-4">
                  <div className="mb-2 flex justify-between text-[10px] font-bold sm:text-xs">
                    <span className="text-white/90">
                      Spent ₹{vipStats.rollingSpend.toLocaleString("en-IN")} of ₹5,000 threshold
                    </span>
                    <span className="text-amber-400 font-extrabold">
                      {vipStats.percentage}% to VIP
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-700"
                      style={{ width: `${vipStats.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-[10px] leading-relaxed text-white/70 sm:text-[11px]">
                    {vipStats.isVIP ? (
                      <span className="text-emerald-400 font-semibold">
                        ✔ ₹5,000 threshold achieved! You enjoy VIP wholesale prices and free express delivery.
                      </span>
                    ) : (
                      <span>
                        Current 30-day delivered spend: ₹{vipStats.rollingSpend}. Spend ₹{Math.max(0, 5000 - vipStats.rollingSpend).toLocaleString("en-IN")} more within 30 days to qualify.
                      </span>
                    )}
                  </p>
                </div>

                {/* Active VIP Perks */}
                <div className="mb-4 space-y-2 text-[11px] sm:mb-5 sm:space-y-2.5 sm:text-xs">
                  <div className="flex items-center gap-2 text-white/90 sm:gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-400 sm:text-[18px]">bolt</span>
                    <span className="font-medium"><span className="sm:hidden">Free express delivery</span><span className="hidden sm:inline">Unlimited Free 60-Min Express Deliveries</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 sm:gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-400 sm:text-[18px]">percent</span>
                    <span className="font-medium"><span className="sm:hidden">VIP prices</span><span className="hidden sm:inline">Guaranteed VIP Special Price Discounts</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-white/90 sm:gap-2.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-400 sm:text-[18px]">toll</span>
                    <span className="font-medium"><span className="sm:hidden">2× Smart Coins</span><span className="hidden sm:inline">2X Smart Coin Accrual on Delivered Orders</span></span>
                  </div>
                </div>
              </div>

              {/* Bottom Support Link */}
              <div className="relative z-10 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[10px] text-white/80 sm:pt-3 sm:text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span>✔</span>
                  <span>Evaluated in Real-Time</span>
                </span>
                <Link
                  to="/help"
                  className="text-amber-300 hover:text-amber-200 font-bold transition-colors flex items-center gap-1"
                >
                  <span className="sm:hidden">VIP Help</span>
                  <span className="hidden sm:inline">VIP Guidelines & Support</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Middle Two Columns: Ledger & Referral */}
          <div className="mb-8 grid grid-cols-1 gap-4 lg:mb-16 lg:grid-cols-12 lg:gap-8">
            {/* Left Column: Coins Ledger & Activity (7 Cols) */}
            <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm sm:rounded-3xl sm:p-6 md:p-8 lg:col-span-7">
              <div className="mb-3 flex items-center justify-between sm:mb-4">
                <div>
                  <h3 className="font-headline-lg text-base font-bold text-on-surface sm:text-lg">
                    Coins Ledger & Activity
                  </h3>
                  <p className="mt-0.5 hidden text-xs text-on-surface-variant sm:block">
                    Real-time trace of order rewards, campaign bonuses, and cart redemptions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success("Ledger statement downloaded.")}
                  className="text-xs font-bold text-primary hover:text-primary-container flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span className="hidden sm:inline">Statement</span>
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="mb-4 grid grid-cols-2 gap-1.5 border-b border-outline-variant/15 pb-3 sm:mb-5 sm:flex sm:gap-2 sm:overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActivityFilter("all")}
                  className={`min-w-0 rounded-full px-2 py-1.5 font-headline-sm text-[10px] font-bold transition-all cursor-pointer sm:px-3.5 sm:text-xs ${
                    activityFilter === "all"
                      ? "bg-[#005f3f] text-white shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="sm:hidden">All</span><span className="hidden sm:inline">All Activities</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter("earned")}
                  className={`min-w-0 rounded-full px-2 py-1.5 font-headline-sm text-[10px] font-bold transition-all cursor-pointer sm:px-3.5 sm:text-xs ${
                    activityFilter === "earned"
                      ? "bg-[#005f3f] text-white shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="sm:hidden">Earned</span><span className="hidden sm:inline">Coins Earned</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter("redeemed")}
                  className={`min-w-0 rounded-full px-2 py-1.5 font-headline-sm text-[10px] font-bold transition-all cursor-pointer sm:px-3.5 sm:text-xs ${
                    activityFilter === "redeemed"
                      ? "bg-[#005f3f] text-white shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="sm:hidden">Redeemed</span><span className="hidden sm:inline">Coins Redeemed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter("expiring")}
                  className={`min-w-0 rounded-full px-2 py-1.5 font-headline-sm text-[10px] font-bold transition-all cursor-pointer sm:px-3.5 sm:text-xs ${
                    activityFilter === "expiring"
                      ? "bg-[#005f3f] text-white shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  <span className="sm:hidden">Expiring</span><span className="hidden sm:inline">Expiring Soon</span>
                </button>
              </div>

              {/* Transaction List */}
              {visibleActivities.length === 0 ? (
                <div className="py-8 text-center text-[11px] text-on-surface-variant sm:py-12 sm:text-xs">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-2xl mx-auto mb-2">
                    📋
                  </div>
                  <p className="font-bold text-on-surface">No coin activities found</p>
                  <p className="mt-1">Transactions will appear as you place orders and redeem coins.</p>
                </div>
              ) : (
                <div className="mb-4 space-y-2 sm:mb-5 sm:space-y-3">
                  {visibleActivities.map((tx) => {
                    const isEarned = tx.type === "earned";
                    const isOrder = tx.description.toLowerCase().includes("order");
                    const isReferral = tx.description.toLowerCase().includes("referral");
                    const isReview = tx.description.toLowerCase().includes("review");
                    const cashVal = convertCoinsToRupees(tx.amount, effectiveConversionRate).toFixed(2);

                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between gap-2 rounded-xl border border-outline-variant/15 bg-surface-container-low/60 p-3 transition-colors hover:bg-surface-container-low sm:gap-3 sm:rounded-2xl sm:p-4"
                      >
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 sm:rounded-2xl ${
                              isEarned
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[17px] sm:text-[20px]">
                              {isOrder
                                ? isEarned
                                  ? "local_shipping"
                                  : "shopping_cart"
                                : isReferral
                                ? "group_add"
                                : isReview
                                ? "rate_review"
                                : "toll"}
                            </span>
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-headline-sm text-[11px] font-bold text-on-surface sm:text-xs">
                                {tx.description}
                              </span>
                              <span
                                className={`hidden rounded px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide sm:inline-flex ${
                                  isEarned
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {isOrder ? (isEarned ? "ORDER REWARD" : "CART DEDUCTION") : "COMMUNITY CREDIT"}
                              </span>
                            </div>
                            <span className="mt-0.5 block text-[10px] text-on-surface-variant sm:text-[11px]">
                              {new Date(tx.timestamp).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {" • Valid for 12 months"}
                            </span>
                          </div>
                        </div>

                        {/* Amount & Cash Valuation */}
                        <div className="text-right shrink-0">
                          <span
                            className={`font-headline-sm block text-xs font-extrabold sm:text-sm ${
                              isEarned ? "text-emerald-700" : "text-rose-600"
                            }`}
                          >
                            {isEarned ? `+${tx.amount}` : `-${tx.amount}`} Coins
                          </span>
                          <span className="hidden text-[10px] font-medium text-on-surface-variant sm:block">
                            {isEarned ? `(+₹${cashVal} value)` : `(-₹${cashVal} applied)`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer Note & Load More */}
              <div className="flex flex-col items-center justify-between gap-2 border-t border-outline-variant/15 pt-3 text-[10px] text-on-surface-variant sm:flex-row sm:gap-3 sm:text-xs">
                <span className="hidden items-center gap-1 sm:flex">
                  <span className="material-symbols-outlined text-[15px]">info</span>
                  <span>Coins remain valid for a rolling 365 days from issue date.</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold">
                    SHOWING {visibleActivities.length} OF {filteredActivities.length} RECORDS
                  </span>
                  {filteredActivities.length > displayCount && (
                    <button
                      type="button"
                      onClick={() => setDisplayCount((prev) => prev + 5)}
                      className="bg-primary/10 hover:bg-primary/20 text-primary font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      Load More
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Referral Card (5 Cols) */}
            <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm sm:rounded-3xl sm:p-6 md:p-8 lg:col-span-5">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                  <span>🤝</span>
                  <span>SHARE THE PURITY</span>
                </div>
                <h3 className="mb-1.5 font-headline-lg text-lg font-extrabold text-on-surface sm:mb-2 sm:text-xl">
                  Give ₹100, Earn 100 Coins
                </h3>
                <p className="mb-4 hidden text-xs leading-relaxed text-on-surface-variant sm:mb-6 sm:block">
                  Introduce your neighborhood to Tamil Nadu groceries. Friends get ₹100 off their first cart, and you receive 100 Smart Coins instantly upon delivery.
                </p>

                {/* Personal Referral Code Box */}
                <div className="mb-3 rounded-xl border border-outline-variant/25 bg-surface-container-low/70 p-3 sm:mb-4 sm:rounded-2xl sm:p-4">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 tracking-wider">
                    YOUR PERSONAL INVITATION CODE
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-base font-black tracking-wider text-[#005f3f] sm:text-lg">
                      {user.referralCode || user.id}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyReferral}
                      className="bg-[#005f3f] hover:bg-[#004e33] text-white px-3.5 py-1.5 rounded-xl font-headline-sm text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">content_copy</span>
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                {/* Share via WhatsApp CTA */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#25d366] py-2.5 font-headline-sm text-[11px] font-extrabold text-white shadow-sm transition-all hover:bg-[#20ba59] active:scale-95 sm:mb-6 sm:rounded-2xl sm:py-3 sm:text-xs"
                >
                  <span className="text-base">💬</span>
                  <span>Share via WhatsApp</span>
                </button>

                {/* Community Impact Statistics */}
                <div className="mb-3 rounded-xl border border-outline-variant/15 bg-surface-container-low/40 p-3 sm:mb-4 sm:rounded-2xl sm:p-4">
                  <div className="mb-2 flex items-center justify-between gap-2 text-[10px] sm:text-xs">
                    <span className="font-semibold text-on-surface">Community Impact:</span>
                    <span className="font-bold text-on-surface">
                      {referralStats.totalNeighbors} Neighbors Joined
                    </span>
                  </div>
                  <div className="mb-2 flex items-center justify-between gap-2 text-[10px] sm:mb-3 sm:text-xs">
                    <span className="font-semibold text-on-surface">Total Harvest Credit Earned:</span>
                    <span className="font-extrabold text-emerald-800">
                      ₹{referralStats.totalCashCredit.toFixed(2)}
                    </span>
                  </div>

                  {/* Neighbor avatar status pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-outline-variant/10 text-[10px]">
                    {referrals.map((r) => (
                      <span
                        key={r.id}
                        className="bg-surface-container px-2 py-0.5 rounded-md font-bold text-on-surface"
                      >
                        {r.friendName.split(" ")[0]} ({r.status.includes("Completed") ? "✔ Done" : "⏳ Pending"})
                      </span>
                    ))}
                    {referrals.length === 0 && (
                      <span className="text-on-surface-variant italic">
                        Share your link to invite your first neighbor!
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Fair Use Terms Link */}
              <Link
                to="/policies"
                className="text-center text-[11px] text-primary hover:underline font-bold block pt-2"
              >
                View Referral Rules & Fair Use Terms
              </Link>
            </div>
          </div>

          {/* Section: "How Smart Coins Work" (Matching Screenshot 3) */}
          <section id="how-coins-work" className="mb-8 scroll-mt-32 sm:mb-14">
            <div className="mx-auto mb-5 max-w-2xl text-center sm:mb-8">
              <span className="mb-1 hidden font-headline-sm text-[11px] font-extrabold uppercase tracking-wider text-[#005f3f] sm:block">
                TRANSPARENT PURITY REWARDS
              </span>
              <h2 className="font-headline-lg text-xl font-extrabold text-on-surface sm:text-2xl md:text-3xl">
                How Smart Coins Work
              </h2>
              <p className="mt-1.5 hidden text-xs text-on-surface-variant sm:block">
                Every staple, vegetable, and cold-pressed oil bottle ordered brings tangible savings back to your kitchen table.
              </p>
            </div>

            {/* 3 Step Cards Grid */}
            <div className="mb-5 grid grid-cols-1 gap-3 sm:mb-8 sm:gap-6 md:grid-cols-3">
              {/* Step 1 */}
              <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:rounded-3xl sm:p-6">
                <div>
                  <div className="mb-3 flex items-center justify-between sm:mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 sm:h-10 sm:w-10 sm:rounded-2xl">
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">shopping_bag</span>
                    </div>
                    <span className="font-headline-sm text-xs font-black text-outline">01</span>
                  </div>
                  <h4 className="mb-1.5 font-headline-sm text-sm font-bold text-on-surface sm:mb-2 sm:text-base">
                    1. Shop Farm Fresh & Staples
                  </h4>
                  <p className="mb-3 text-[11px] leading-relaxed text-on-surface-variant sm:mb-4 sm:text-xs">
                    Earn 1 Smart Coin for every ₹1 spent on items, excluding delivery fees.
                  </p>
                </div>
                <span className="inline-block w-fit rounded-full border border-emerald-200/60 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-800 sm:px-3 sm:text-[10px]">
                  Earn rate: 1 coin per ₹1 of item purchases
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:rounded-3xl sm:p-6">
                <div>
                  <div className="mb-3 flex items-center justify-between sm:mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800 sm:h-10 sm:w-10 sm:rounded-2xl">
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">savings</span>
                    </div>
                    <span className="font-headline-sm text-xs font-black text-outline">02</span>
                  </div>
                  <h4 className="mb-1.5 font-headline-sm text-sm font-bold text-on-surface sm:mb-2 sm:text-base">
                    2. Collect Automatically
                  </h4>
                  <p className="mb-3 text-[11px] leading-relaxed text-on-surface-variant sm:mb-4 sm:text-xs">
                    Coins are credited when your order is placed and expire after {coinPolicy.coinValidityMonths} months.
                  </p>
                </div>
                <span className="inline-block w-fit rounded-full border border-amber-200/60 bg-amber-50 px-2.5 py-1 text-[9px] font-bold text-amber-800 sm:px-3 sm:text-[10px]">
                  Valid for {coinPolicy.coinValidityMonths} months
                </span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:rounded-3xl sm:p-6">
                <div>
                  <div className="mb-3 flex items-center justify-between sm:mb-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800 sm:h-10 sm:w-10 sm:rounded-2xl">
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">point_of_sale</span>
                    </div>
                    <span className="font-headline-sm text-xs font-black text-outline">03</span>
                  </div>
                  <h4 className="mb-1.5 font-headline-sm text-sm font-bold text-on-surface sm:mb-2 sm:text-base">
                    3. Apply at Checkout
                  </h4>
                  <p className="mb-3 text-[11px] leading-relaxed text-on-surface-variant sm:mb-4 sm:text-xs">
                    Redeem at ₹{coinPolicy.coinValueInRupees} per coin once your balance reaches {coinPolicy.minCoinsToRedeem} coins, up to {coinPolicy.maxCoinRedemptionPercent}% of your item subtotal.
                  </p>
                </div>
                <span className="inline-block w-fit rounded-full border border-cyan-200/60 bg-cyan-50 px-2.5 py-1 text-[9px] font-bold text-cyan-800 sm:px-3 sm:text-[10px]">
                  Minimum balance to redeem: {coinPolicy.minCoinsToRedeem} coins
                </span>
              </div>
            </div>

            {/* Support Callout Banner */}
            <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-4 sm:rounded-3xl sm:p-6 md:flex-row md:items-center md:gap-4">
              <div className="flex items-center gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary sm:h-10 sm:w-10 sm:rounded-2xl">
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]">support_agent</span>
                </div>
                <div>
                  <h4 className="font-headline-sm text-xs font-bold text-on-surface sm:text-sm">
                    Have questions about Smart Coins or VIP Perks?
                  </h4>
                  <p className="hidden text-xs text-on-surface-variant sm:block">
                    Our neighborhood Adyar concierge team is available daily from 6:30 AM to 10:00 PM.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href="tel:+919840012345"
                  className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest px-3 py-2 font-headline-sm text-[10px] font-bold text-on-surface transition-colors hover:bg-surface-container sm:px-4 sm:text-xs"
                >
                  Call Support
                </a>
                <a
                  href="https://api.whatsapp.com/send?phone=919840012345"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl bg-[#005f3f] px-4 py-2 font-headline-sm text-[10px] font-bold text-white shadow-sm transition-all hover:bg-[#004e33] sm:px-5 sm:text-xs"
                >
                  <span>WhatsApp Us</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </a>
              </div>
            </div>
          </section>

          {/* Section: Sriman VIP Privilege Framework (Preserves strict binary ₹5,000 rule) */}
          <div className="mb-8 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 shadow-sm sm:mb-12 sm:rounded-3xl sm:p-6 md:p-8">
            <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
              <div>
                <h3 className="font-headline-lg text-sm font-bold text-on-surface sm:text-lg">
                  Sriman VIP Privilege Framework
                </h3>
                <p className="mt-0.5 hidden text-xs text-on-surface-variant sm:block">
                  Transparent qualification standards based strictly on verified delivered grocery orders.
                </p>
              </div>
              <span className="rounded-full border border-amber-300 bg-amber-100/70 px-2 py-1 text-[9px] font-extrabold text-amber-900 sm:px-3 sm:text-[11px] text-center">
                {vipStats.isVIP ? <><span className="sm:hidden">VIP Qualified</span><span className="hidden sm:inline">You are currently VIP Privilege Qualified</span></> : "Standard Tier"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1 sm:gap-6 sm:pt-2 md:grid-cols-2">
              <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/60 p-3 sm:rounded-2xl sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[18px] text-primary sm:text-[20px]">calendar_month</span>
                  <h4 className="font-headline-sm text-xs font-bold text-on-surface sm:text-sm">
                    Rolling 30-Day Evaluation
                  </h4>
                </div>
                <p className="hidden text-[11px] leading-relaxed text-on-surface-variant sm:block sm:text-xs">
                  Qualification is recalculated dynamically every morning based on delivered orders placed within the last 30 calendar days. Achieving the ₹5,000 delivered spend threshold activates VIP status immediately.
                </p>
              </div>

              <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low/60 p-3 sm:rounded-2xl sm:p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[18px] text-primary sm:text-[20px]">verified</span>
                  <h4 className="font-headline-sm text-xs font-bold text-on-surface sm:text-sm">
                    Guaranteed VIP Benefits
                  </h4>
                </div>
                <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-on-surface-variant sm:text-xs">
                  <li><span className="sm:hidden">Free express delivery</span><span className="hidden sm:inline">Zero express surge fees and free doorstep delivery on all orders.</span></li>
                  <li><span className="sm:hidden">Wholesale prices</span><span className="hidden sm:inline">Exclusive wholesale special prices on cold-pressed oils, ghee, and staples.</span></li>
                  <li><span className="sm:hidden">2× Smart Coins</span><span className="hidden sm:inline">2X coin accrual multipliers on every delivered grocery basket.</span></li>
                </ul>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
