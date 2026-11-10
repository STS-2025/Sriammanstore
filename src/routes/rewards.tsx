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
      { title: "Smart Coins & VIP Privilege Hub — Sri Amman Smart Store" },
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
      `Hey! Order authentic cold-pressed oils, organic grains & heirloom spices from Sri Amman Smart Store. Use my code ${code} to get ₹100 off your first cart! https://sriammanstore.com/shop?ref=${code}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  if ((authLoading || isResolvingIdentity) && !user) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1000px] mx-auto px-margin-desktop py-20 text-center">
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
        <div className="max-w-[1320px] mx-auto px-margin-desktop py-space-xl">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
                Smart Coins & VIP Privilege Hub
              </h1>
              <p className="text-xs md:text-sm text-on-surface-variant mt-1 max-w-2xl">
                Earn direct rewards on every grocery order, redeem instant cash discounts, and unlock VIP free express slots.
              </p>
            </div>

            {/* Live Conversion Rate Pill */}
            <div className="shrink-0 flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-full px-4 py-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              <span className="text-xs font-extrabold text-emerald-900">
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
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
            {/* Card 1: Available Balance / Smart Coins Vault (7 Cols) */}
            <div className="lg:col-span-7 bg-gradient-to-br from-[#fffdf5] via-[#fffbf0] to-[#fbf7eb] border border-amber-200/70 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-xl shadow-xs">
                      🪙
                    </div>
                    <div>
                      <span className="font-headline-sm text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                        AVAILABLE BALANCE
                      </span>
                      <h3 className="font-headline-lg text-lg font-bold text-on-surface">
                        Smart Coins Vault
                      </h3>
                    </div>
                  </div>
                  <span className="bg-emerald-100/80 text-emerald-900 border border-emerald-200 text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                    <span>✔</span>
                    <span>Verified & Ready</span>
                  </span>
                </div>

                {/* Big Balance & Cash Valuation */}
                <div className="flex flex-wrap items-baseline gap-3 mb-3">
                  <span className="font-headline-lg text-4xl md:text-5xl font-black text-on-surface tracking-tight">
                    {coinBalance}
                  </span>
                  <span className="font-headline-sm text-lg font-bold text-on-surface-variant">
                    Smart Coins
                  </span>
                  <span className="bg-cyan-50 text-cyan-800 border border-cyan-200 font-extrabold text-xs px-3 py-1 rounded-xl flex items-center gap-1 shadow-xs">
                    <span className="material-symbols-outlined text-[15px]">sell</span>
                    <span>Valued at ₹{cashEquivalent} Cart Discount</span>
                  </span>
                </div>

                <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                  Apply seamlessly on your cart summary during checkout with no minimum order constraints. Valid across Mara Chekku Oils, Heirloom Rice, & Farm Fresh Greens.
                </p>

                {/* Monthly Ledger Stats Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div className="bg-white/80 rounded-2xl p-3.5 border border-amber-200/40 flex items-center gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">trending_up</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
                        Earned this month
                      </span>
                      <span className="font-headline-sm text-sm font-extrabold text-emerald-800">
                        +{ledgerStats.earnedThisMonth} Coins
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/80 rounded-2xl p-3.5 border border-amber-200/40 flex items-center gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-on-surface-variant block">
                        Redeemed this month
                      </span>
                      <span className="font-headline-sm text-sm font-extrabold text-rose-700">
                        -{ledgerStats.redeemedThisMonth} Coins
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/cart"
                  className="bg-[#005f3f] hover:bg-[#004e33] text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                  <span>Redeem on Next Order</span>
                </Link>

                <a
                  href="#how-coins-work"
                  className="bg-surface-container hover:bg-surface-container-high text-on-surface px-5 py-3 rounded-2xl font-headline-sm text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">help</span>
                  <span>How to Earn More</span>
                </a>
              </div>
            </div>

            {/* Card 2: VIP Privilege Card (5 Cols) */}
            <div className="lg:col-span-5 bg-[#102217] text-white rounded-3xl p-6 md:p-8 shadow-lg border border-[#1b3826] flex flex-col justify-between relative overflow-hidden">
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl shadow-xs">
                      👑
                    </div>
                    <div>
                      <span className="font-headline-sm text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
                        PRIVILEGE STATUS
                      </span>
                      <h3 className="font-headline-lg text-lg font-bold text-white flex items-center gap-1.5">
                        <span>{vipStats.isVIP ? "VIP Privilege Member" : "Standard Customer"}</span>
                        {vipStats.isVIP && <span className="text-amber-400">★</span>}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-extrabold text-white/60 block">
                      MEMBERSHIP
                    </span>
                    <span className="text-xs font-bold text-amber-300">
                      {vipStats.isVIP ? "Active (30-Day Window)" : "Rolling Evaluation"}
                    </span>
                  </div>
                </div>

                {/* Progress Bar (Binary ₹5,000 Rolling 30-Day Rule) */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-5">
                  <div className="flex justify-between text-xs font-bold mb-2">
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
                  <p className="text-[11px] text-white/70 leading-relaxed">
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
                <div className="space-y-2.5 mb-5 text-xs">
                  <div className="flex items-center gap-2.5 text-white/90">
                    <span className="material-symbols-outlined text-amber-400 text-[18px]">bolt</span>
                    <span className="font-medium">Unlimited Free 60-Min Express Deliveries</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-white/90">
                    <span className="material-symbols-outlined text-amber-400 text-[18px]">percent</span>
                    <span className="font-medium">Guaranteed VIP Special Price Discounts</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-white/90">
                    <span className="material-symbols-outlined text-amber-400 text-[18px]">toll</span>
                    <span className="font-medium">2X Smart Coin Accrual on Delivered Orders</span>
                  </div>
                </div>
              </div>

              {/* Bottom Support Link */}
              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/80">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span>✔</span>
                  <span>Evaluated in Real-Time</span>
                </span>
                <Link
                  to="/help"
                  className="text-amber-300 hover:text-amber-200 font-bold transition-colors flex items-center gap-1"
                >
                  <span>VIP Guidelines & Support</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Middle Two Columns: Ledger & Referral */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
            {/* Left Column: Coins Ledger & Activity (7 Cols) */}
            <div className="lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-headline-lg text-lg font-bold text-on-surface">
                    Coins Ledger & Activity
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Real-time trace of order rewards, campaign bonuses, and cart redemptions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success("Ledger statement downloaded.")}
                  className="text-xs font-bold text-primary hover:text-primary-container flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span>Statement</span>
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5 border-b border-outline-variant/15 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActivityFilter("all")}
                  className={`px-3.5 py-1.5 rounded-full font-headline-sm text-xs font-bold transition-all cursor-pointer ${
                    activityFilter === "all"
                      ? "bg-[#005f3f] text-white shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  All Activities
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter("earned")}
                  className={`px-3.5 py-1.5 rounded-full font-headline-sm text-xs font-bold transition-all cursor-pointer ${
                    activityFilter === "earned"
                      ? "bg-[#005f3f] text-white shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  Coins Earned
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter("redeemed")}
                  className={`px-3.5 py-1.5 rounded-full font-headline-sm text-xs font-bold transition-all cursor-pointer ${
                    activityFilter === "redeemed"
                      ? "bg-[#005f3f] text-white shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  Coins Redeemed
                </button>
                <button
                  type="button"
                  onClick={() => setActivityFilter("expiring")}
                  className={`px-3.5 py-1.5 rounded-full font-headline-sm text-xs font-bold transition-all cursor-pointer ${
                    activityFilter === "expiring"
                      ? "bg-[#005f3f] text-white shadow-xs"
                      : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  }`}
                >
                  Expiring Soon
                </button>
              </div>

              {/* Transaction List */}
              {visibleActivities.length === 0 ? (
                <div className="py-12 text-center text-xs text-on-surface-variant">
                  <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-2xl mx-auto mb-2">
                    📋
                  </div>
                  <p className="font-bold text-on-surface">No coin activities found</p>
                  <p className="mt-1">Transactions will appear as you place orders and redeem coins.</p>
                </div>
              ) : (
                <div className="space-y-3 mb-5">
                  {visibleActivities.map((tx) => {
                    const isEarned = tx.type === "earned";
                    const isOrder = tx.description.toLowerCase().includes("order");
                    const isReferral = tx.description.toLowerCase().includes("referral");
                    const isReview = tx.description.toLowerCase().includes("review");
                    const cashVal = convertCoinsToRupees(tx.amount, effectiveConversionRate).toFixed(2);

                    return (
                      <div
                        key={tx.id}
                        className="bg-surface-container-low/60 hover:bg-surface-container-low rounded-2xl p-4 border border-outline-variant/15 flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                              isEarned
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[20px]">
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
                              <span className="font-headline-sm text-xs font-bold text-on-surface">
                                {tx.description}
                              </span>
                              <span
                                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${
                                  isEarned
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border border-rose-200"
                                }`}
                              >
                                {isOrder ? (isEarned ? "ORDER REWARD" : "CART DEDUCTION") : "COMMUNITY CREDIT"}
                              </span>
                            </div>
                            <span className="text-[11px] text-on-surface-variant block mt-0.5">
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
                            className={`font-headline-sm text-sm font-extrabold block ${
                              isEarned ? "text-emerald-700" : "text-rose-600"
                            }`}
                          >
                            {isEarned ? `+${tx.amount}` : `-${tx.amount}`} Coins
                          </span>
                          <span className="text-[10px] text-on-surface-variant font-medium">
                            {isEarned ? `(+₹${cashVal} value)` : `(-₹${cashVal} applied)`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Footer Note & Load More */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-outline-variant/15 text-xs text-on-surface-variant">
                <span className="flex items-center gap-1">
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
            <div className="lg:col-span-5 bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                  <span>🤝</span>
                  <span>SHARE THE PURITY</span>
                </div>
                <h3 className="font-headline-lg text-xl font-extrabold text-on-surface mb-2">
                  Give ₹100, Earn 100 Coins
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                  Introduce your neighborhood to Tamil Nadu groceries. Friends get ₹100 off their first cart, and you receive 100 Smart Coins instantly upon delivery.
                </p>

                {/* Personal Referral Code Box */}
                <div className="bg-surface-container-low/70 border border-outline-variant/25 rounded-2xl p-4 mb-4">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant block mb-1 tracking-wider">
                    YOUR PERSONAL INVITATION CODE
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-lg font-black text-[#005f3f] tracking-wider">
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
                  className="w-full bg-[#25d366] hover:bg-[#20ba59] text-white py-3 rounded-2xl font-headline-sm text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 mb-6 cursor-pointer"
                >
                  <span className="text-base">💬</span>
                  <span>Share via WhatsApp</span>
                </button>

                {/* Community Impact Statistics */}
                <div className="bg-surface-container-low/40 rounded-2xl p-4 border border-outline-variant/15 mb-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-on-surface">Community Impact:</span>
                    <span className="font-bold text-on-surface">
                      {referralStats.totalNeighbors} Neighbors Joined
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mb-3">
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
          <section id="how-coins-work" className="mb-14 scroll-mt-32">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="font-headline-sm text-[11px] uppercase font-extrabold text-[#005f3f] tracking-wider block mb-1">
                TRANSPARENT PURITY REWARDS
              </span>
              <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface">
                How Smart Coins Work
              </h2>
              <p className="text-xs text-on-surface-variant mt-1.5">
                Every staple, vegetable, and cold-pressed oil bottle ordered brings tangible savings back to your kitchen table.
              </p>
            </div>

            {/* 3 Step Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Step 1 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/15 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                    </div>
                    <span className="font-headline-sm text-xs font-black text-outline">01</span>
                  </div>
                  <h4 className="font-headline-sm text-base font-bold text-on-surface mb-2">
                    1. Shop Farm Fresh & Staples
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                    Earn {coinPolicy.smartCoinEarnRate} Smart Coins for every eligible order.
                  </p>
                </div>
                <span className="bg-emerald-50 text-emerald-800 font-bold text-[10px] px-3 py-1 rounded-full border border-emerald-200/60 inline-block w-fit">
                  Earn rate: {coinPolicy.smartCoinEarnRate} coins per order
                </span>
              </div>

              {/* Step 2 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/15 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">savings</span>
                    </div>
                    <span className="font-headline-sm text-xs font-black text-outline">02</span>
                  </div>
                  <h4 className="font-headline-sm text-base font-bold text-on-surface mb-2">
                    2. Collect Automatically
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                    Coins are credited when your order is placed and expire after {coinPolicy.coinValidityMonths} months.
                  </p>
                </div>
                <span className="bg-amber-50 text-amber-800 font-bold text-[10px] px-3 py-1 rounded-full border border-amber-200/60 inline-block w-fit">
                  Valid for {coinPolicy.coinValidityMonths} months
                </span>
              </div>

              {/* Step 3 */}
              <div className="bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/15 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">point_of_sale</span>
                    </div>
                    <span className="font-headline-sm text-xs font-black text-outline">03</span>
                  </div>
                  <h4 className="font-headline-sm text-base font-bold text-on-surface mb-2">
                    3. Apply at Checkout
                  </h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
                    Redeem at ₹{coinPolicy.coinValueInRupees} per coin once your balance reaches {coinPolicy.minCoinsToRedeem} coins, up to {coinPolicy.maxCoinRedemptionPercent}% of your item subtotal.
                  </p>
                </div>
                <span className="bg-cyan-50 text-cyan-800 font-bold text-[10px] px-3 py-1 rounded-full border border-cyan-200/60 inline-block w-fit">
                  Minimum balance to redeem: {coinPolicy.minCoinsToRedeem} coins
                </span>
              </div>
            </div>

            {/* Support Callout Banner */}
            <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">support_agent</span>
                </div>
                <div>
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                    Have questions about Smart Coins or VIP Perks?
                  </h4>
                  <p className="text-xs text-on-surface-variant">
                    Our neighborhood Adyar concierge team is available daily from 6:30 AM to 10:00 PM.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <a
                  href="tel:+919840012345"
                  className="bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-4 py-2 rounded-xl font-headline-sm text-xs font-bold hover:bg-surface-container transition-colors"
                >
                  Call Support
                </a>
                <a
                  href="https://api.whatsapp.com/send?phone=919840012345"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#005f3f] hover:bg-[#004e33] text-white px-5 py-2 rounded-xl font-headline-sm text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <span>WhatsApp Us</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </a>
              </div>
            </div>
          </section>

          {/* Section: Sri Amman VIP Privilege Framework (Preserves strict binary ₹5,000 rule) */}
          <div className="bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm mb-12">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-headline-lg text-lg font-bold text-on-surface">
                  Sri Amman VIP Privilege Framework
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Transparent qualification standards based strictly on verified delivered grocery orders.
                </p>
              </div>
              <span className="bg-amber-100/70 text-amber-900 border border-amber-300 font-extrabold text-[11px] px-3 py-1 rounded-full">
                {vipStats.isVIP ? "You are currently VIP Privilege Qualified" : "Standard Customer Tier"}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-surface-container-low/60 rounded-2xl p-5 border border-outline-variant/15">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                    Rolling 30-Day Evaluation
                  </h4>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Qualification is recalculated dynamically every morning based on delivered orders placed within the last 30 calendar days. Achieving the ₹5,000 delivered spend threshold activates VIP status immediately.
                </p>
              </div>

              <div className="bg-surface-container-low/60 rounded-2xl p-5 border border-outline-variant/15">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
                  <h4 className="font-headline-sm text-sm font-bold text-on-surface">
                    Guaranteed VIP Benefits
                  </h4>
                </div>
                <ul className="text-xs text-on-surface-variant space-y-1 list-disc pl-4 leading-relaxed">
                  <li>Zero express surge fees and free doorstep delivery on all orders.</li>
                  <li>Exclusive wholesale special prices on cold-pressed oils, ghee, and staples.</li>
                  <li>2X coin accrual multipliers on every delivered grocery basket.</li>
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
