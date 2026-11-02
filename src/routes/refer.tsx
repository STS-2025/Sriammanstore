import { useState, useEffect, useMemo, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import {
  referralService,
  REFERRAL_REWARD_COINS,
  type ReferralActivityFilter,
} from "../services/referralService";
import { coinService, OFFICIAL_COIN_CONVERSION_RATE } from "../services/coinService";
import { settingsService } from "../services/settingsService";
import { authManager } from "../services/authAdapter";
import type {
  ReferralFriend,
  CoinTransaction,
  StoreInfo,
  DeliverySettings,
} from "../types";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/refer")({
  head: () => ({
    meta: [
      { title: "Refer & Earn — Sri Amman Smart Store" },
      {
        name: "description",
        content:
          "Invite friends to Sri Amman Smart Store with your personal referral code and earn Smart Coins on their first completed order.",
      },
    ],
  }),
  component: ReferPage,
});

const INITIAL_VISIBLE_COUNT = 6;

export function ReferPage() {
  const { user, isLoading: authLoading, isResolvingIdentity } = useAuth();

  const [referrals, setReferrals] = useState<ReferralFriend[]>([]);
  const [coinHistory, setCoinHistory] = useState<CoinTransaction[]>([]);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [deliverySettings, setDeliverySettings] =
    useState<DeliverySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interactive UI states
  const [activityFilter, setActivityFilter] =
    useState<ReferralActivityFilter>("all");
  const [visibleCount, setVisibleCount] = useState<number>(
    INITIAL_VISIBLE_COUNT
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadReferralDashboard = useCallback(async () => {
    if (!user) {
      if (!authLoading && !isResolvingIdentity) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [userReferrals, userCoinHistory, store, delivery] =
        await Promise.all([
          referralService.getReferrals(user.id, user.legacySassId),
          coinService.getCoinHistory(user.id, user.legacySassId),
          settingsService.getStoreInfo(),
          settingsService.getDeliverySettings(),
        ]);

      setReferrals(userReferrals || []);
      setCoinHistory(userCoinHistory || []);
      setStoreInfo(store || null);
      setDeliverySettings(delivery || null);
    } catch (err: any) {
      console.error("Failed to load referral dashboard data:", err);
      setError(
        err?.message ||
          "Unable to load your referral dashboard from the server. Please verify the API connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [user, authLoading, isResolvingIdentity]);

  useEffect(() => {
    loadReferralDashboard();
  }, [loadReferralDashboard]);

  // Configured conversion rate from storeInfo (strictly guarded against obsolete 0.50 rate)
  const conversionRate = useMemo(() => {
    const rate = storeInfo?.coinValueInRupees;
    if (typeof rate === "number" && rate > 0 && rate !== 0.5) {
      return rate;
    }
    return OFFICIAL_COIN_CONVERSION_RATE;
  }, [storeInfo]);

  const hasValidConversionRate = conversionRate > 0;

  // Compute available coin balance from ledger or user record
  const ledgerStats = useMemo(() => {
    return coinService.calculateLedgerStats(coinHistory);
  }, [coinHistory]);

  const availableCoins = useMemo(() => {
    if (coinHistory.length > 0) {
      return ledgerStats.netBalance;
    }
    return user?.smartCoins ?? user?.coins ?? 0;
  }, [coinHistory.length, ledgerStats.netBalance, user?.smartCoins, user?.coins]);

  // Compute referral statistics
  const referralStats = useMemo(() => {
    return referralService.calculateReferralStats(referrals, conversionRate);
  }, [referrals, conversionRate]);

  // Filter & paginate referral activity
  const filteredReferrals = useMemo(() => {
    return referralService.filterReferrals(referrals, activityFilter);
  }, [referrals, activityFilter]);

  const visibleReferrals = useMemo(() => {
    return filteredReferrals.slice(0, visibleCount);
  }, [filteredReferrals, visibleCount]);

  // Reset pagination when filter changes
  const handleFilterChange = (nextFilter: ReferralActivityFilter) => {
    setActivityFilter(nextFilter);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  // Customer referral code
  const referralCode = user?.referralCode || user?.id || "";
  const hasActiveCode = Boolean(referralCode.trim());
  const storeLocation =
    storeInfo?.locationName || "Gobichettipalayam, Erode";
  const rewardRupeeValue = hasValidConversionRate
    ? Math.round(REFERRAL_REWARD_COINS * conversionRate)
    : null;

  // Clipboard & Share Handlers
  const handleCopyCode = async () => {
    if (!hasActiveCode) {
      toast.error("No referral code is currently assigned to your account.");
      return;
    }
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopiedCode(true);
      toast.success(`Referral code "${referralCode}" copied to clipboard!`);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      toast.error("Could not access clipboard. Please copy the code manually.");
    }
  };

  const handleShareWhatsApp = () => {
    if (!hasActiveCode) {
      toast.error("Referral code unavailable for sharing.");
      return;
    }
    const whatsappUrl = referralService.buildWhatsAppShareUrl(referralCode);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  const handleShareLinkOrMore = async () => {
    if (!hasActiveCode) {
      toast.error("Referral link unavailable.");
      return;
    }
    const inviteLink = referralService.buildReferralLink(referralCode);
    const shareText = referralService.buildShareMessage(referralCode);

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Sri Amman Smart Store — Community Referral Invite",
          text: shareText,
          url: inviteLink,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      toast.success("Referral invite link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.error("Unable to copy referral link. Please try again.");
    }
  };

  // Loading & Session Restoration View
  if ((authLoading || isResolvingIdentity) && !user) {
    return (
      <div className="bg-[#f8f9fc] font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-[172px] max-w-[1000px] mx-auto px-margin-desktop py-20 text-center">
          <div className="w-9 h-9 border-3 border-[#005F3F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-on-surface-variant font-medium">
            Loading referral dashboard...
          </p>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  // Unauthenticated state
  if (!user) {
    return (
      <div className="bg-[#f8f9fc] font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-[172px] max-w-[1000px] mx-auto px-margin-desktop py-16 text-center">
          <div className="bg-white rounded-3xl border border-outline-variant/20 p-8 md:p-12 shadow-xs max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-[#e3f5ec] text-[#005F3F] flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-3xl">
                redeem
              </span>
            </div>
            <h1 className="font-headline-lg text-xl md:text-2xl font-extrabold text-on-surface mb-2">
              Sign In to Access Refer & Earn
            </h1>
            <p className="text-xs md:text-sm text-on-surface-variant mb-6 leading-relaxed">
              Sign in with your mobile number to view your personal referral
              passcode, share invite links with neighbors, and track your
              credited Smart Coins.
            </p>
            <Link
              to="/login"
              search={{ redirect: "/refer" } as any}
              className="inline-flex items-center gap-2 bg-[#005F3F] text-white px-6 py-3 rounded-xl font-headline-sm text-xs font-bold shadow-sm hover:bg-[#004c32] transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">
                login
              </span>
              <span>Sign In with Mobile OTP</span>
            </Link>
          </div>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="bg-[#f8f9fc] font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-[172px] min-h-[calc(100vh-172px)] pb-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-on-surface-variant mb-5"
          >
            <Link
              to="/"
              className="hover:text-[#005F3F] transition-colors inline-flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[15px]">
                home
              </span>
              <span>Home</span>
            </Link>
            <span className="text-outline-variant">›</span>
            <Link
              to="/account"
              className="hover:text-[#005F3F] transition-colors"
            >
              My Account
            </Link>
            <span className="text-outline-variant">›</span>
            <span className="text-[#005F3F] font-bold">Refer & Earn</span>
          </nav>

          {/* Error Alert Banner */}
          {error && (
            <div
              role="alert"
              data-testid="referrals-error-banner"
              className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-900"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-red-600">
                  error
                </span>
                <div>
                  <p className="text-xs font-bold">
                    Could not load referral data
                  </p>
                  <p className="text-[11px] text-red-700">{error}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={loadReferralDashboard}
                className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors self-start sm:self-auto cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Introductory Header & Compact Amman Vault Bar */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 bg-[#fbf3dc] border border-[#f0deaa] text-[#7a4f00] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                <span className="material-symbols-outlined text-[14px]">
                  workspace_premium
                </span>
                <span>Amman Community Rewards</span>
              </div>

              <h1 className="font-headline-lg text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
                Refer & Earn{" "}
                <span className="text-[#005F3F] relative inline-block">
                  Pure Savings
                  <span className="block h-1.5 w-full bg-[#005F3F]/25 rounded-full mt-0.5"></span>
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-on-surface-variant mt-3 leading-relaxed">
                Invite your friends and neighbors to{" "}
                <strong className="text-on-surface font-semibold">
                  {storeInfo?.storeName || "Sri Amman Smart Store"}
                </strong>
                . Friends who register with your referral code receive{" "}
                <strong className="text-on-surface font-semibold">
                  welcome bonus Smart Coins
                </strong>
                , and you receive{" "}
                <strong className="text-[#005F3F] font-bold">
                  {REFERRAL_REWARD_COINS} Smart Coins
                  {rewardRupeeValue !== null
                    ? ` (₹${rewardRupeeValue} value)`
                    : ""}
                </strong>{" "}
                credited to your rewards vault upon their first completed order.
              </p>
            </div>

            {/* Compact Amman Vault Summary Card */}
            <div className="bg-white border border-outline-variant/20 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-5 shrink-0 sm:min-w-[330px]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#fff3d6] border border-[#f5dfa6] text-[#9e6700] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">
                    monetization_on
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant block">
                    Your Amman Vault
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span
                      data-testid="vault-coin-balance"
                      className="font-headline-lg text-2xl font-black text-on-surface tracking-tight"
                    >
                      {loading ? "—" : availableCoins.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase">
                      Coins
                    </span>
                    {!loading && hasValidConversionRate && (
                      <span className="text-[11px] font-bold text-[#9e6700]">
                        (₹{(availableCoins * conversionRate).toFixed(0)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Link
                to="/cart"
                className="bg-[#f1f3f9] hover:bg-[#e4e8f2] text-on-surface font-headline-sm text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0"
              >
                Redeem
              </Link>
            </div>
          </div>

          {/* Main Two-Column Referral Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">
            {/* Left Column (7 Cols): Exclusive Referral Pass */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-outline-variant/20 p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col justify-between">
              {/* Subtle top-right decorative green circle */}
              <div
                aria-hidden="true"
                className="w-48 h-48 rounded-full bg-[#e8f5ef]/80 absolute -top-12 -right-12 pointer-events-none"
              />

              <div className="relative z-10">
                {/* Top Pass Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                  <span className="bg-[#dff5ea] text-[#005F3F] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full">
                    Your Exclusive Referral Pass
                  </span>

                  {hasActiveCode && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#005F3F]">
                      <span className="w-2 h-2 rounded-full bg-[#005F3F] animate-pulse"></span>
                      <span>Active & Ready</span>
                    </span>
                  )}
                </div>

                {/* Main Offer Heading */}
                <h2 className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mb-2">
                  Give Your Friends a Reason to Shop — Earn{" "}
                  {REFERRAL_REWARD_COINS} Coins
                </h2>
                <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6 max-w-xl">
                  Valid across farm-fresh produce, wood-pressed Mara Chekku
                  oils, native heirloom staples, and artisanal spice blends in{" "}
                  {storeLocation}.
                </p>

                {/* Personal Referral Code Box */}
                <div className="bg-[#f4f5fa] border border-outline-variant/20 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-outline-variant/15 flex items-center justify-center text-[#005F3F] shrink-0 shadow-2xs">
                      <span className="material-symbols-outlined text-[20px]">
                        confirmation_number
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-on-surface-variant font-medium block">
                        Your Personal Code
                      </span>
                      <span
                        data-testid="personal-referral-code"
                        className="font-headline-lg text-base sm:text-lg font-black text-on-surface tracking-wider break-all"
                      >
                        {referralCode || "UNASSIGNED"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    disabled={!hasActiveCode}
                    data-testid="copy-code-btn"
                    className="bg-[#005F3F] hover:bg-[#004c32] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-headline-sm text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {copiedCode ? "check" : "content_copy"}
                    </span>
                    <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>
              </div>

              {/* Share Channels */}
              <div className="relative z-10 pt-2">
                <span className="text-xs font-semibold text-on-surface-variant block mb-3">
                  Share directly via favorite channels:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    disabled={!hasActiveCode}
                    data-testid="share-whatsapp-btn"
                    className="bg-[#005F3F] hover:bg-[#004c32] disabled:opacity-50 text-white py-3.5 px-5 rounded-xl font-headline-sm text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      chat
                    </span>
                    <span>Share via WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShareLinkOrMore}
                    disabled={!hasActiveCode}
                    data-testid="share-link-btn"
                    className="bg-[#eef0f8] hover:bg-[#e2e5f2] disabled:opacity-50 text-on-surface py-3.5 px-5 rounded-xl font-headline-sm text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {copiedLink ? "check" : "share"}
                    </span>
                    <span>
                      {copiedLink ? "Invite Link Copied!" : "Share Link / More"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (5 Cols): Your Impact Metrics + Community Strip */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-4">
              <div className="bg-white rounded-3xl border border-outline-variant/20 p-6 sm:p-7 shadow-xs flex-1 flex flex-col justify-between">
                <div>
                  {/* Card Heading */}
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-headline-lg text-base sm:text-lg font-extrabold text-on-surface">
                      Your Impact Metrics
                    </h3>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      trending_up
                    </span>
                  </div>

                  {/* Top 2 Sub-Cards: Total Invites & Orders Placed */}
                  <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                    <div className="bg-[#f6f7fb] rounded-2xl p-4 border border-outline-variant/10">
                      <div className="flex items-center justify-between text-on-surface-variant mb-1">
                        <span className="text-[11px] font-semibold">
                          Total Invites
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-[#005F3F]">
                          group
                        </span>
                      </div>
                      <div
                        data-testid="metric-total-invites"
                        className="font-headline-lg text-2xl sm:text-3xl font-black text-on-surface my-0.5"
                      >
                        {loading ? "—" : referralStats.totalNeighbors}
                      </div>
                      <span className="text-[10px] text-on-surface-variant block">
                        Community invites sent
                      </span>
                    </div>

                    <div className="bg-[#eefaf3] rounded-2xl p-4 border border-[#cdebd9]/60">
                      <div className="flex items-center justify-between text-on-surface-variant mb-1">
                        <span className="text-[11px] font-semibold">
                          Orders Placed
                        </span>
                        <span className="material-symbols-outlined text-[16px] text-[#005F3F]">
                          check_circle
                        </span>
                      </div>
                      <div
                        data-testid="metric-completed-orders"
                        className="font-headline-lg text-2xl sm:text-3xl font-black text-[#005F3F] my-0.5"
                      >
                        {loading ? "—" : referralStats.completedCount}
                      </div>
                      <span className="text-[10px] text-on-surface-variant block">
                        {referralStats.totalNeighbors > 0
                          ? `${referralStats.conversionRatePercent}% conversion rate`
                          : "No invites yet"}
                      </span>
                    </div>
                  </div>

                  {/* Total Smart Coins Credited Card */}
                  <div className="bg-[#fff9ed] border border-[#f5e1b5] rounded-2xl p-4 mb-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-bold text-on-surface">
                        Total Smart Coins Credited
                      </span>
                      <span className="w-5 h-5 rounded-full bg-[#f5b82e] text-white flex items-center justify-center text-[11px] font-black">
                        ₹
                      </span>
                    </div>
                    <div className="flex flex-wrap items-baseline gap-1.5 my-0.5">
                      <span
                        data-testid="metric-coins-credited"
                        className="font-headline-lg text-2xl sm:text-3xl font-black text-on-surface"
                      >
                        {loading
                          ? "—"
                          : referralStats.totalCoinsEarned.toLocaleString(
                              "en-IN"
                            )}
                      </span>
                      {!loading && hasValidConversionRate && (
                        <span className="text-xs font-extrabold text-[#9e6700]">
                          (₹{referralStats.totalCashCredit.toFixed(0)} Instant
                          Savings)
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">
                      Applied seamlessly toward cold-pressed oils, produce &
                      grocery carts.
                    </p>
                  </div>
                </div>

                {/* Pending Friends Strip */}
                <div className="bg-[#f4f5fa] rounded-2xl p-3.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#ffefd4] text-[#9e6700] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[16px]">
                        pending
                      </span>
                    </div>
                    <div>
                      <span
                        data-testid="metric-pending-friends"
                        className="text-xs font-extrabold text-on-surface block"
                      >
                        {loading
                          ? "Loading pending status..."
                          : `${referralStats.pendingCount} ${
                              referralStats.pendingCount === 1
                                ? "Friend"
                                : "Friends"
                            } Pending`}
                      </span>
                      <span className="text-[10px] text-on-surface-variant block">
                        {referralStats.pendingCount > 0
                          ? `${referralStats.potentialPendingCoins} potential coins waiting upon their first order`
                          : "All invited friends have completed their first order"}
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                    notifications_none
                  </span>
                </div>
              </div>

              {/* Neighborhood Community Callout */}
              <div className="bg-[#eaf6f2] border border-[#cbeadd] rounded-2xl p-3.5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#005F3F]/10 text-[#005F3F] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">
                    volunteer_activism
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-[#004c32] leading-snug">
                  Every referral strengthens farm-to-doorstep harvest sourcing
                  across {storeLocation} neighborhoods!
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: How The Reward Cycle Works */}
          <section className="mb-14">
            <div className="text-center max-w-xl mx-auto mb-8">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#005F3F] block mb-1.5">
                Simplicity by Design
              </span>
              <h2 className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
                How The Reward Cycle Works
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5">
                Three straightforward steps to organic freshness and effortless
                grocery savings.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 01 */}
              <div className="bg-white rounded-3xl border border-outline-variant/20 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#e3f5ec] text-[#005F3F] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">
                        extension
                      </span>
                    </div>
                    <span className="font-headline-lg text-3xl font-black text-[#e1e5f0]">
                      01
                    </span>
                  </div>
                  <h3 className="font-headline-lg text-base font-extrabold text-on-surface mb-2">
                    Share Your Code
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Send your unique referral link or passcode{" "}
                    <strong className="text-on-surface font-bold">
                      {referralCode}
                    </strong>{" "}
                    to family, neighbors, or colleagues in {storeLocation}.
                  </p>
                </div>

                <div className="bg-[#f4f5fa] rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant mt-6">
                  <span className="material-symbols-outlined text-[15px] text-[#005F3F]">
                    qr_code_2
                  </span>
                  <span>Shareable via WhatsApp or direct invite link</span>
                </div>
              </div>

              {/* Step 02 */}
              <div className="bg-white rounded-3xl border border-outline-variant/20 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#fff0d6] text-[#9e6700] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">
                        shopping_cart_checkout
                      </span>
                    </div>
                    <span className="font-headline-lg text-3xl font-black text-[#e1e5f0]">
                      02
                    </span>
                  </div>
                  <h3 className="font-headline-lg text-base font-extrabold text-on-surface mb-2">
                    They Register & Shop Fresh
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Your friend registers with your referral code during Mobile
                    OTP sign-in to receive{" "}
                    <strong className="text-[#9e6700] font-bold">
                      welcome bonus Smart Coins
                    </strong>{" "}
                    and places their first farm-fresh order.
                  </p>
                </div>

                <div className="bg-[#f4f5fa] rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant mt-6">
                  <span className="material-symbols-outlined text-[15px] text-[#9e6700]">
                    bolt
                  </span>
                  <span>
                    Serviceable within {storeInfo?.maxRadiusKm ?? 6} km of{" "}
                    {storeLocation}
                  </span>
                </div>
              </div>

              {/* Step 03 */}
              <div className="bg-white rounded-3xl border border-outline-variant/20 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#d6f7e5] text-[#005F3F] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">
                        savings
                      </span>
                    </div>
                    <span className="font-headline-lg text-3xl font-black text-[#e1e5f0]">
                      03
                    </span>
                  </div>
                  <h3 className="font-headline-lg text-base font-extrabold text-on-surface mb-2">
                    Both Get Rewarded
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Once their first order is completed, you earn{" "}
                    <strong className="text-[#005F3F] font-bold">
                      {REFERRAL_REWARD_COINS} Smart Coins
                      {rewardRupeeValue !== null
                        ? ` (₹${rewardRupeeValue} value)`
                        : ""}
                    </strong>{" "}
                    credited to your referral rewards balance.
                  </p>
                </div>

                <div className="bg-[#f4f5fa] rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant mt-6">
                  <span className="material-symbols-outlined text-[15px] text-[#005F3F]">
                    auto_awesome
                  </span>
                  <span>100% transparent tracking in your Activity Log</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Referral Progress Visualization */}
          <section className="mb-16">
            <div className="bg-gradient-to-r from-white via-white to-[#fffaf0] rounded-3xl border border-outline-variant/20 p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
                <div>
                  <div className="inline-flex items-center gap-2 mb-2">
                    <span className="bg-[#ffecd1] text-[#855300] text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      Referral Conversion Overview
                    </span>
                    <span className="text-[11px] font-semibold text-on-surface-variant">
                      {REFERRAL_REWARD_COINS} Coins per Completed First Order
                    </span>
                  </div>
                  <h3 className="font-headline-lg text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                    {referralStats.totalNeighbors === 0
                      ? "Invite Your First Neighbor to Start Earning Referral Rewards"
                      : referralStats.pendingCount > 0
                        ? `${referralStats.completedCount} of ${referralStats.totalNeighbors} Invited Friends Have Completed Their First Order`
                        : `All ${referralStats.completedCount} Invited Friends Have Completed Their First Order!`}
                  </h3>
                </div>

                <div className="sm:text-right shrink-0">
                  <span
                    data-testid="progress-fraction"
                    className="font-headline-lg text-2xl sm:text-3xl font-black text-[#005F3F]"
                  >
                    {referralStats.completedCount}
                  </span>
                  <span className="text-sm font-bold text-on-surface-variant">
                    {" "}
                    / {referralStats.totalNeighbors} Completed
                  </span>
                </div>
              </div>

              {/* Horizontal Progress Bar */}
              <div
                role="progressbar"
                aria-label="Completed referrals progress"
                aria-valuenow={referralStats.conversionRatePercent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="w-full h-3.5 bg-[#eaedf5] rounded-full overflow-hidden mb-5"
              >
                <div
                  className="h-full bg-gradient-to-r from-[#005F3F] to-[#26a66c] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      referralStats.totalNeighbors > 0 ? 6 : 0,
                      referralStats.conversionRatePercent
                    )}%`,
                  }}
                />
              </div>

              {/* 3 Truthful Status Pills */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="bg-[#f4f5fa] rounded-2xl p-3.5 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#005F3F] text-[20px] shrink-0">
                    check_circle
                  </span>
                  <div className="text-[11px] leading-snug">
                    <span className="font-bold text-on-surface block">
                      Completed Referrals: {referralStats.completedCount}
                    </span>
                    <span className="text-on-surface-variant">
                      {referralStats.totalCoinsEarned} Smart Coins
                      {hasValidConversionRate
                        ? ` (₹${referralStats.totalCashCredit.toFixed(0)})`
                        : ""}{" "}
                      credited
                    </span>
                  </div>
                </div>

                <div className="bg-[#eafaf1] border border-[#c5ebd6] rounded-2xl p-3.5 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#005F3F] text-[20px] shrink-0">
                    flag
                  </span>
                  <div className="text-[11px] leading-snug">
                    <span className="font-bold text-[#004c32] block">
                      Pending First Orders: {referralStats.pendingCount}
                    </span>
                    <span className="text-[#005F3F]">
                      {referralStats.potentialPendingCoins} potential coins on
                      first order completion
                    </span>
                  </div>
                </div>

                <div className="bg-[#f4f5fa] rounded-2xl p-3.5 flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant text-[20px] shrink-0">
                    verified_user
                  </span>
                  <div className="text-[11px] leading-snug">
                    <span className="font-bold text-on-surface block">
                      Standard Per-Referral Reward
                    </span>
                    <span className="text-on-surface-variant">
                      No multi-tier lock-ins; VIP status is based separately on
                      ₹{storeInfo?.vipSpendingThreshold ?? 5000} 30-day spend
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Referral Activity Log */}
          <section className="mb-16">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#005F3F] block mb-1">
                  Audit Log
                </span>
                <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface tracking-tight">
                  Referral Activity Log
                </h2>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Track referral registrations, first-order statuses, and coin
                  credits in real-time.
                </p>
              </div>

              {/* Filter Tabs */}
              <div
                role="tablist"
                aria-label="Filter referral activity"
                className="bg-white border border-outline-variant/20 p-1 rounded-full inline-flex flex-wrap items-center gap-1 shadow-2xs self-start md:self-auto"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activityFilter === "all"}
                  data-testid="filter-tab-all"
                  onClick={() => handleFilterChange("all")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activityFilter === "all"
                      ? "bg-[#005F3F] text-white shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  All Referrals ({referrals.length})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activityFilter === "completed"}
                  data-testid="filter-tab-completed"
                  onClick={() => handleFilterChange("completed")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activityFilter === "completed"
                      ? "bg-[#005F3F] text-white shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Completed & Credited ({referralStats.completedCount})
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activityFilter === "pending"}
                  data-testid="filter-tab-pending"
                  onClick={() => handleFilterChange("pending")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    activityFilter === "pending"
                      ? "bg-[#005F3F] text-white shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Pending First Order ({referralStats.pendingCount})
                </button>
              </div>
            </div>

            {/* Activity Table Card */}
            <div className="bg-white rounded-3xl border border-outline-variant/20 shadow-xs overflow-hidden">
              {loading ? (
                <div className="py-14 px-6 text-center">
                  <div className="w-10 h-10 rounded-full border-2 border-[#005F3F] border-t-transparent animate-spin mx-auto mb-3" />
                  <p className="text-xs font-semibold text-on-surface-variant">
                    Loading referral activity from server...
                  </p>
                </div>
              ) : filteredReferrals.length === 0 ? (
                <div
                  data-testid="empty-referrals-view"
                  className="py-14 px-6 text-center max-w-md mx-auto"
                >
                  <div
                    data-testid="referral-empty-state"
                    className="w-12 h-12 rounded-2xl bg-[#f4f5fa] text-on-surface-variant flex items-center justify-center mx-auto mb-3"
                  >
                    <span className="material-symbols-outlined text-[24px]">
                      group_add
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-sm font-bold text-on-surface mb-1">
                    {referrals.length === 0
                      ? "No Referrals Recorded Yet"
                      : "No Referrals Match This Filter"}
                  </h3>
                  <p className="text-xs text-on-surface-variant mb-4">
                    {referrals.length === 0
                      ? "Share your personal referral code with friends and neighbors to earn 50 Smart Coins when they complete their first order."
                      : "Try switching to 'All Referrals' to view your complete invitation history."}
                  </p>
                  {referrals.length > 0 && activityFilter !== "all" ? (
                    <button
                      type="button"
                      onClick={() => handleFilterChange("all")}
                      className="bg-[#005F3F] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#004c32] transition-colors cursor-pointer"
                    >
                      Show All Referrals
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="bg-[#005F3F] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#004c32] transition-colors cursor-pointer"
                    >
                      Copy Personal Code
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop & Tablet Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#f6f7fb] border-b border-outline-variant/15 text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant">
                          <th className="py-3.5 px-6">Friend / Contact</th>
                          <th className="py-3.5 px-6">Activity Description</th>
                          <th className="py-3.5 px-6">Date</th>
                          <th className="py-3.5 px-6 text-right">
                            Reward Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/15 text-xs">
                        {visibleReferrals.map((friend) => {
                          const isCompleted =
                            referralService.isCompletedReferral(friend);
                          const initials = referralService.getInitials(
                            friend.friendName
                          );
                          return (
                            <tr
                              key={friend.id}
                              data-testid={`referral-row-${friend.id}`}
                              className="hover:bg-[#f9fafc] transition-colors"
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-headline-sm text-xs font-extrabold shrink-0 ${
                                      isCompleted
                                        ? "bg-[#e3f5ec] text-[#005F3F]"
                                        : "bg-[#fff3dc] text-[#855300]"
                                    }`}
                                  >
                                    {initials}
                                  </div>
                                  <div>
                                    <span className="font-headline-sm text-xs font-bold text-on-surface block">
                                      {friend.friendName}
                                    </span>
                                    <span className="text-[11px] text-on-surface-variant">
                                      {friend.phoneMasked}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-4 px-6">
                                <span className="font-semibold text-on-surface block">
                                  {friend.status}
                                </span>
                                <span
                                  className={`text-[11px] ${
                                    isCompleted
                                      ? "text-on-surface-variant"
                                      : "text-[#9e6700] font-medium"
                                  }`}
                                >
                                  {isCompleted
                                    ? `First order completed • +${friend.rewardCoins} Smart Coins${
                                        hasValidConversionRate
                                          ? ` (₹${(
                                              friend.rewardCoins *
                                              conversionRate
                                            ).toFixed(0)} value)`
                                          : ""
                                      }`
                                    : "Registered via referral code • Waiting for first order completion"}
                                </span>
                              </td>

                              <td className="py-4 px-6 text-on-surface-variant font-medium whitespace-nowrap">
                                {referralService.formatReferralDate(
                                  friend.date
                                )}
                              </td>

                              <td className="py-4 px-6 text-right whitespace-nowrap">
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-1.5 bg-[#bdf2d5] text-[#004d31] px-3 py-1 rounded-full text-[11px] font-extrabold">
                                    <span className="material-symbols-outlined text-[14px]">
                                      check_circle
                                    </span>
                                    <span>
                                      Rewarded +{friend.rewardCoins} Coins
                                    </span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 bg-[#fde6c4] text-[#7a4900] px-3 py-1 rounded-full text-[11px] font-extrabold">
                                    <span className="material-symbols-outlined text-[14px]">
                                      schedule
                                    </span>
                                    <span>Pending First Order</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Compact Stack View */}
                  <div className="md:hidden divide-y divide-outline-variant/15">
                    {visibleReferrals.map((friend) => {
                      const isCompleted =
                        referralService.isCompletedReferral(friend);
                      const initials = referralService.getInitials(
                        friend.friendName
                      );
                      return (
                        <div
                          key={friend.id}
                          className="p-4 flex flex-col gap-2.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-headline-sm text-xs font-extrabold shrink-0 ${
                                  isCompleted
                                    ? "bg-[#e3f5ec] text-[#005F3F]"
                                    : "bg-[#fff3dc] text-[#855300]"
                                }`}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <span className="font-headline-sm text-xs font-bold text-on-surface block truncate">
                                  {friend.friendName}
                                </span>
                                <span className="text-[11px] text-on-surface-variant block">
                                  {friend.phoneMasked}
                                </span>
                              </div>
                            </div>

                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 bg-[#bdf2d5] text-[#004d31] px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0">
                                <span>+{friend.rewardCoins} Coins</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-[#fde6c4] text-[#7a4900] px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0">
                                <span>Pending</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-on-surface-variant pl-11">
                            <span>{friend.status}</span>
                            <span>
                              {referralService.formatReferralDate(friend.date)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Table Footer & Pagination */}
                  <div className="bg-[#f6f7fb] border-t border-outline-variant/15 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-on-surface-variant">
                    <div className="flex items-center gap-3">
                      <span>
                        Showing {visibleReferrals.length} of{" "}
                        {filteredReferrals.length} records (
                        {referrals.length} total referrals)
                      </span>
                      {filteredReferrals.length > visibleCount && (
                        <button
                          type="button"
                          onClick={() =>
                            setVisibleCount(
                              (prev) => prev + INITIAL_VISIBLE_COUNT
                            )
                          }
                          className="text-[#005F3F] font-bold hover:underline cursor-pointer"
                        >
                          Load More
                        </button>
                      )}
                    </div>

                    <div className="inline-flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#005F3F]"></span>
                      <span>
                        Referral rewards credit upon verified first-order
                        completion.
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Section 7: Referral Terms & Fair Use Guidelines */}
          <section>
            <div className="bg-white rounded-3xl border border-outline-variant/20 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2.5 mb-6">
                <span className="material-symbols-outlined text-[#005F3F] text-[22px]">
                  gavel
                </span>
                <h2 className="font-headline-lg text-lg sm:text-xl font-extrabold text-on-surface">
                  Referral Terms & Fair Use Guidelines
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Guideline 1: New Customer Registration & Eligibility */}
                <div className="bg-[#f6f7fb] rounded-2xl p-5 border border-outline-variant/10">
                  <div className="flex items-center gap-2 text-[#005F3F] font-headline-sm text-xs font-extrabold mb-2">
                    <span className="material-symbols-outlined text-[18px]">
                      person_check
                    </span>
                    <span>New Customer Eligibility</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Referral codes (
                    <span className="font-mono font-semibold text-on-surface">
                      {referralCode}
                    </span>
                    ) apply when a new customer registers via Mobile OTP.
                    Self-referrals or duplicate accounts using the same mobile
                    number are prevented.
                  </p>
                </div>

                {/* Guideline 2: Configured Serviceability Zone */}
                <div className="bg-[#f6f7fb] rounded-2xl p-5 border border-outline-variant/10">
                  <div className="flex items-center gap-2 text-[#005F3F] font-headline-sm text-xs font-extrabold mb-2">
                    <span className="material-symbols-outlined text-[18px]">
                      location_on
                    </span>
                    <span>{storeLocation} Service Zone</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    Orders placed by referred friends must be within our
                    configured{" "}
                    <strong className="text-on-surface font-semibold">
                      {storeInfo?.maxRadiusKm ?? 6} km delivery radius
                    </strong>{" "}
                    around {storeLocation}
                    {deliverySettings?.minOrderForFreeDelivery
                      ? ` (free standard delivery on orders ₹${deliverySettings.minOrderForFreeDelivery}+)`
                      : ""}
                    .
                  </p>
                </div>

                {/* Guideline 3: Reward Credit & Binary VIP Separation */}
                <div className="bg-[#f6f7fb] rounded-2xl p-5 border border-outline-variant/10">
                  <div className="flex items-center gap-2 text-[#005F3F] font-headline-sm text-xs font-extrabold mb-2">
                    <span className="material-symbols-outlined text-[18px]">
                      redeem
                    </span>
                    <span>Reward Credit & Redemption</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    You earn{" "}
                    <strong className="text-on-surface font-semibold">
                      {REFERRAL_REWARD_COINS} Smart Coins
                    </strong>{" "}
                    per friend who completes their first order
                    {hasValidConversionRate
                      ? ` (1 Coin = ₹${conversionRate.toFixed(2)} at checkout)`
                      : ""}
                    . Referral counts do not alter VIP status, which requires ₹
                    {storeInfo?.vipSpendingThreshold ?? 5000} in delivered
                    orders over a rolling 30-day window.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
