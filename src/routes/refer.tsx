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
} from "../types";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/refer")({
  head: () => ({
    meta: [
      { title: "Refer & Earn — Sriman Smart Store" },
      {
        name: "description",
        content:
          "Invite friends to Sriman Smart Store with your personal referral code and earn Smart Coins on their first completed order.",
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
  const [verifiedCoinBalance, setVerifiedCoinBalance] = useState<number | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
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
      const [userReferrals, userCoinHistory, store, spendableCoins] = await Promise.all([
        referralService.getReferrals(user.id, user.legacySassId),
        coinService.getCoinHistory(user.id, user.legacySassId),
        settingsService.getStoreInfo(),
        coinService.getUserCoins(user.id, user.legacySassId),
      ]);

      setReferrals(userReferrals || []);
      setCoinHistory(userCoinHistory || []);
      setStoreInfo(store || null);
      setVerifiedCoinBalance(spendableCoins);
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
    if (verifiedCoinBalance !== null) return verifiedCoinBalance;
    if (coinHistory.length > 0) {
      return ledgerStats.netBalance;
    }
    return user?.smartCoins ?? user?.coins ?? 0;
  }, [verifiedCoinBalance, coinHistory.length, ledgerStats.netBalance, user?.smartCoins, user?.coins]);

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
          title: "Sriman Smart Store — Community Referral Invite",
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
        <main className="w-full pt-20 max-w-[1000px] mx-auto px-margin-desktop py-20 text-center">
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
        <main className="mx-auto w-full max-w-[1000px] px-margin-desktop py-8 pt-20 text-center sm:py-16">
          <div className="mx-auto max-w-lg rounded-2xl border border-outline-variant/20 bg-white p-5 shadow-xs sm:rounded-3xl sm:p-8 md:p-12">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e3f5ec] text-[#005F3F] sm:mb-4 sm:h-16 sm:w-16 sm:rounded-2xl">
              <span className="material-symbols-outlined text-2xl sm:text-3xl">
                redeem
              </span>
            </div>
            <h1 className="mb-2 font-headline-lg text-lg font-extrabold text-on-surface sm:text-xl md:text-2xl">
              Sign In to Access Refer & Earn
            </h1>
            <p className="mb-4 hidden text-xs leading-relaxed text-on-surface-variant sm:mb-6 sm:block sm:text-sm">
              Sign in with your mobile number to view your personal referral
              passcode, share invite links with neighbors, and track your
              credited Smart Coins.
            </p>
            <Link
              to="/login"
              search={{ redirect: "/refer" } as any}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#005F3F] px-4 py-2.5 font-headline-sm text-[10px] font-bold text-white shadow-sm transition-all hover:bg-[#004c32] sm:gap-2 sm:rounded-xl sm:px-6 sm:py-3 sm:text-xs"
            >
              <span className="material-symbols-outlined text-[15px] sm:text-[16px]">
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

      <main className="w-full pt-20 min-h-[calc(100vh-80px)] pb-16">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8">
          {/* Breadcrumb Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="hidden md:flex items-center gap-2 text-xs text-on-surface-variant mb-5"
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
          <div className="mb-5 flex flex-col justify-between gap-3 sm:mb-8 sm:gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-2 items-center gap-1 rounded-full border border-[#f0deaa] bg-[#fbf3dc] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#7a4f00] sm:mb-3 sm:gap-1.5 sm:px-3 sm:text-[10px] hidden min-[500px]">
                <span className="material-symbols-outlined text-[14px]">
                  workspace_premium
                </span>
                <span>Amman Community Rewards</span>
              </div>

              <h1 className="font-headline-lg text-2xl font-extrabold text-on-surface tracking-tight leading-tight sm:text-3xl md:text-4xl">
                <span className="sm:hidden">Refer & Earn</span>
                <span className="hidden sm:inline">Refer & Earn{" "}
                <span className="text-[#005F3F] relative inline-block">
                  Pure Savings
                  <span className="block h-1.5 w-full bg-[#005F3F]/25 rounded-full mt-0.5"></span>
                </span></span>
              </h1>

              <p className="hidden text-xs leading-relaxed text-on-surface-variant sm:mt-3 sm:block sm:text-sm">
                Invite your friends and neighbors to{" "}
                <strong className="text-on-surface font-semibold">
                  {storeInfo?.storeName || "Sriman Smart Store"}
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
            {/* <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-outline-variant/20 bg-white p-3 shadow-xs sm:gap-5 sm:rounded-2xl sm:p-4 sm:min-w-[330px]">
              <div className="flex items-center gap-2.5 sm:gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#f5dfa6] bg-[#fff3d6] text-[#9e6700] sm:h-12 sm:w-12 sm:rounded-2xl">
                  <span className="material-symbols-outlined text-[19px] sm:text-[24px]">
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
                      className="font-headline-lg text-xl font-black text-on-surface tracking-tight sm:text-2xl"
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
                className="shrink-0 rounded-lg bg-[#f1f3f9] px-3 py-2 font-headline-sm text-[10px] font-bold text-on-surface transition-colors hover:bg-[#e4e8f2] sm:rounded-xl sm:px-4 sm:py-2.5 sm:text-xs"
              >
                Redeem
              </Link>
            </div> */}
          </div>

          {/* Main Two-Column Referral Dashboard */}
          <div className="mb-8 grid grid-cols-1 gap-3 sm:mb-12 sm:gap-6 lg:mb-16 lg:grid-cols-12">
            {/* Left Column (7 Cols): Exclusive Referral Pass */}
            <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-outline-variant/20 bg-white p-4 shadow-xs sm:rounded-3xl sm:p-8 lg:col-span-7">
              {/* Subtle top-right decorative green circle */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#e8f5ef]/80 sm:h-48 sm:w-48"
              />

              <div className="relative z-10">
                {/* Top Pass Bar */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-5">
                  <span className="rounded-full bg-[#dff5ea] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#005F3F] sm:px-3 sm:text-[10px]">
                    Your Exclusive Referral Pass
                  </span>

                  {hasActiveCode && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#005F3F] sm:gap-1.5 sm:text-xs">
                      <span className="w-2 h-2 rounded-full bg-[#005F3F] animate-pulse"></span>
                      <span>Active & Ready</span>
                    </span>
                  )}
                </div>

                {/* Main Offer Heading */}
                <h2 className="mb-1.5 font-headline-lg text-lg font-extrabold tracking-tight text-on-surface sm:mb-2 sm:text-2xl lg:text-3xl">
                  Give Your Friends a Reason to Shop — Earn{" "}
                  {REFERRAL_REWARD_COINS} Coins
                </h2>
                <p className="mb-4 hidden max-w-xl text-xs leading-relaxed text-on-surface-variant sm:mb-6 sm:block sm:text-sm">
                  Valid across farm-fresh produce, wood-pressed Mara Chekku
                  oils, native heirloom staples, and artisanal spice blends in{" "}
                  {storeLocation}.
                </p>

                {/* Personal Referral Code Box */}
                <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-outline-variant/20 bg-[#f4f5fa] p-3 sm:mb-6 sm:gap-3 sm:rounded-2xl sm:p-4">
                  <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant/15 bg-white text-[#005F3F] shadow-2xs sm:h-10 sm:w-10 sm:rounded-xl">
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                        confirmation_number
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] font-medium text-on-surface-variant sm:text-[11px]">
                        Your Personal Code
                      </span>
                      <span
                        data-testid="personal-referral-code"
                        className="font-headline-lg text-sm font-black tracking-wider text-on-surface break-all sm:text-lg"
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
                    className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1 rounded-lg bg-[#005F3F] px-2.5 py-1.5 font-headline-sm text-[9px] font-bold text-white shadow-xs transition-all hover:bg-[#004c32] disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-5 sm:py-2.5 sm:text-xs"
                  >
                    <span className="material-symbols-outlined text-[14px] sm:text-[16px]">
                      {copiedCode ? "check" : "content_copy"}
                    </span>
                    <span className="sm:hidden">{copiedCode ? "Copied" : "Copy"}</span>
                    <span className="hidden sm:inline">{copiedCode ? "Copied!" : "Copy Code"}</span>
                  </button>
                </div>
              </div>

              {/* Share Channels */}
              <div className="relative z-10 pt-2">
                <span className="mb-2 block text-[10px] font-semibold text-on-surface-variant sm:mb-3 sm:text-xs">
                  Share directly via favorite channels:
                </span>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    disabled={!hasActiveCode}
                    data-testid="share-whatsapp-btn"
                    className="flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-[#005F3F] px-2 py-2.5 font-headline-sm text-[9px] font-bold text-white shadow-xs transition-all hover:bg-[#004c32] disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-5 sm:py-3.5 sm:text-xs"
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
                    className="flex cursor-pointer items-center justify-center gap-1 rounded-lg bg-[#eef0f8] px-2 py-2.5 font-headline-sm text-[9px] font-bold text-on-surface transition-all hover:bg-[#e2e5f2] disabled:opacity-50 sm:gap-2 sm:rounded-xl sm:px-5 sm:py-3.5 sm:text-xs"
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
            <div className="flex flex-col justify-between gap-3 sm:gap-4 lg:col-span-5">
              <div className="flex flex-1 flex-col justify-between rounded-2xl border border-outline-variant/20 bg-white p-4 shadow-xs sm:rounded-3xl sm:p-7">
                <div>
                  {/* Card Heading */}
                  <div className="mb-3 flex items-center justify-between sm:mb-5">
                    <h3 className="font-headline-lg text-sm font-extrabold text-on-surface sm:text-lg">
                      Your Impact Metrics
                    </h3>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      trending_up
                    </span>
                  </div>

                  {/* Top 2 Sub-Cards: Total Invites & Orders Placed */}
                  <div className="mb-3.5 grid grid-cols-2 gap-2 sm:gap-3.5">
                    <div className="rounded-xl border border-outline-variant/10 bg-[#f6f7fb] p-2.5 sm:rounded-2xl sm:p-4">
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

                    <div className="rounded-xl border border-[#cdebd9]/60 bg-[#eefaf3] p-2.5 sm:rounded-2xl sm:p-4">
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
                  Every referral strengthens shop-to-doorstep sourcing
                  across {storeLocation} neighborhoods!
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: How The Reward Cycle Works */}
          <section className="mb-8 sm:mb-14">
            <div className="mx-auto mb-4 max-w-xl text-center sm:mb-8">
              <span className="mb-1.5 hidden text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#005F3F] sm:block">
                Simplicity by Design
              </span>
              <h2 className="font-headline-lg text-lg font-extrabold tracking-tight text-on-surface sm:text-2xl md:text-3xl">
                How The Reward Cycle Works
              </h2>
              <p className="mt-1.5 hidden text-xs text-on-surface-variant sm:block sm:text-sm">
                Three straightforward steps to organic freshness and effortless
                grocery savings.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3">
              {/* Step 01 */}
              <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/20 bg-white p-4 shadow-xs sm:rounded-3xl sm:p-7">
                <div>
                  <div className="mb-3 flex items-center justify-between sm:mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e3f5ec] text-[#005F3F] sm:h-12 sm:w-12 sm:rounded-2xl">
                      <span className="material-symbols-outlined text-[19px] sm:text-[24px]">
                        extension
                      </span>
                    </div>
                    <span className="font-headline-lg text-3xl font-black text-[#e1e5f0]">
                      01
                    </span>
                  </div>
                  <h3 className="mb-1.5 font-headline-lg text-sm font-extrabold text-on-surface sm:mb-2 sm:text-base">
                    Share Your Code
                  </h3>
                  <p className="text-[11px] leading-relaxed text-on-surface-variant sm:text-xs">
                    Send your unique referral link or passcode{" "}
                    <strong className="text-on-surface font-bold">
                      {referralCode}
                    </strong>{" "}
                    to family, neighbors, or colleagues in {storeLocation}.
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#f4f5fa] px-3 py-2 text-[10px] font-semibold text-on-surface-variant sm:mt-6 sm:rounded-xl sm:px-3.5 sm:py-2.5 sm:text-[11px]">
                  <span className="material-symbols-outlined text-[15px] text-[#005F3F]">
                    qr_code_2
                  </span>
                  <span>Shareable via WhatsApp or direct invite link</span>
                </div>
              </div>

              {/* Step 02 */}
              <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/20 bg-white p-4 shadow-xs sm:rounded-3xl sm:p-7">
                <div>
                  <div className="mb-3 flex items-center justify-between sm:mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0d6] text-[#9e6700] sm:h-12 sm:w-12 sm:rounded-2xl">
                      <span className="material-symbols-outlined text-[19px] sm:text-[24px]">
                        shopping_cart_checkout
                      </span>
                    </div>
                    <span className="font-headline-lg text-3xl font-black text-[#e1e5f0]">
                      02
                    </span>
                  </div>
                  <h3 className="mb-1.5 font-headline-lg text-sm font-extrabold text-on-surface sm:mb-2 sm:text-base">
                    They Register & Shop
                  </h3>
                  <p className="text-[11px] leading-relaxed text-on-surface-variant sm:text-xs">
                    Your friend registers with your referral code during Mobile
                    OTP sign-in to receive{" "}
                    <strong className="text-[#9e6700] font-bold">
                      welcome bonus Smart Coins
                    </strong>{" "}
                    and places their first order.
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#f4f5fa] px-3 py-2 text-[10px] font-semibold text-on-surface-variant sm:mt-6 sm:rounded-xl sm:px-3.5 sm:py-2.5 sm:text-[11px]">
                  <span className="material-symbols-outlined text-[15px] text-[#9e6700]">
                    bolt
                  </span>
                  <span>
                    Serviceable within {storeInfo?.maxRadiusKm ?? 50} km of{" "}
                    {storeLocation}
                  </span>
                </div>
              </div>

              {/* Step 03 */}
              <div className="flex flex-col justify-between rounded-2xl border border-outline-variant/20 bg-white p-4 shadow-xs sm:rounded-3xl sm:p-7">
                <div>
                  <div className="mb-3 flex items-center justify-between sm:mb-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d6f7e5] text-[#005F3F] sm:h-12 sm:w-12 sm:rounded-2xl">
                      <span className="material-symbols-outlined text-[19px] sm:text-[24px]">
                        savings
                      </span>
                    </div>
                    <span className="font-headline-lg text-3xl font-black text-[#e1e5f0]">
                      03
                    </span>
                  </div>
                  <h3 className="mb-1.5 font-headline-lg text-sm font-extrabold text-on-surface sm:mb-2 sm:text-base">
                    Both Get Rewarded
                  </h3>
                  <p className="text-[11px] leading-relaxed text-on-surface-variant sm:text-xs">
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

                <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#f4f5fa] px-3 py-2 text-[10px] font-semibold text-on-surface-variant sm:mt-6 sm:rounded-xl sm:px-3.5 sm:py-2.5 sm:text-[11px]">
                  <span className="material-symbols-outlined text-[15px] text-[#005F3F]">
                    auto_awesome
                  </span>
                  <span>100% transparent tracking in your Activity Log</span>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Referral Progress Visualization */}
          <section className="mb-8 sm:mb-16">
            <div className="rounded-2xl border border-outline-variant/20 bg-gradient-to-r from-white via-white to-[#fffaf0] p-4 shadow-xs sm:rounded-3xl sm:p-8">
              <div className="mb-3 flex flex-col justify-between gap-3 sm:mb-4 sm:flex-row sm:items-end sm:gap-4">
                <div>
                  <div className="mb-1.5 inline-flex items-center gap-1.5 sm:mb-2 sm:gap-2">
                    <span className="rounded-full bg-[#ffecd1] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#855300] sm:px-2.5 sm:text-[10px] text-center">
                      Referral Conversion Overview
                    </span>
                  </div>
                  <h3 className="font-headline-lg text-base font-extrabold tracking-tight text-on-surface sm:text-xl md:text-2xl">
                    {referralStats.totalNeighbors === 0
                      ? "Invite Your First Neighbor to Start Earning Referral Rewards"
                      : referralStats.pendingCount > 0
                        ? `${referralStats.completedCount} of ${referralStats.totalNeighbors} Invited Friends Have Completed Their First Order`
                        : `All ${referralStats.completedCount} Invited Friends Have Completed Their First Order!`}
                  </h3>
                </div>

                <div className="flex items-baseline gap-1 sm:block sm:shrink-0 sm:text-right">
                  <span
                    data-testid="progress-fraction"
                    className="font-headline-lg text-xl font-black text-[#005F3F] sm:text-3xl"
                  >
                    {referralStats.completedCount}
                  </span>
                  <span className="text-[11px] font-bold text-on-surface-variant sm:text-sm">
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
                className="mb-3 h-2.5 w-full overflow-hidden rounded-full bg-[#eaedf5] sm:mb-5 sm:h-3.5"
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
              <div className="grid grid-cols-1 gap-2 sm:gap-3.5 md:grid-cols-3">
                <div className="flex items-center gap-2 rounded-xl bg-[#f4f5fa] p-3 sm:gap-3 sm:rounded-2xl sm:p-3.5">
                  <span className="material-symbols-outlined shrink-0 text-[17px] text-[#005F3F] sm:text-[20px]">
                    check_circle
                  </span>
                  <div className="text-[10px] leading-snug sm:text-[11px]">
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

                <div className="flex items-center gap-2 rounded-xl border border-[#c5ebd6] bg-[#eafaf1] p-3 sm:gap-3 sm:rounded-2xl sm:p-3.5">
                  <span className="material-symbols-outlined shrink-0 text-[17px] text-[#005F3F] sm:text-[20px]">
                    flag
                  </span>
                  <div className="text-[10px] leading-snug sm:text-[11px]">
                    <span className="font-bold text-[#004c32] block">
                      Pending First Orders: {referralStats.pendingCount}
                    </span>
                    <span className="text-[#005F3F]">
                      {referralStats.potentialPendingCoins} potential coins on
                      first order completion
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-[#f4f5fa] p-3 sm:gap-3 sm:rounded-2xl sm:p-3.5">
                  <span className="material-symbols-outlined shrink-0 text-[17px] text-on-surface-variant sm:text-[20px]">
                    verified_user
                  </span>
                  <div className="text-[10px] leading-snug sm:text-[11px]">
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
          <section className="mb-8 sm:mb-16">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:mb-6 sm:flex-row sm:items-end sm:gap-4">
              <div>
                <span className="mb-1 hidden text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#005F3F] sm:block">
                  Audit Log
                </span>
                <h2 className="font-headline-lg text-lg font-extrabold tracking-tight text-on-surface sm:text-2xl">
                  Referral Activity Log
                </h2>
                <p className="mt-0.5 hidden text-xs text-on-surface-variant sm:block">
                  Track referral registrations, first-order statuses, and coin
                  credits in real-time.
                </p>
              </div>

              {/* Filter Tabs */}
              <div
                role="tablist"
                aria-label="Filter referral activity"
                className="inline-flex flex-wrap items-center gap-0.5 self-start rounded-full border border-outline-variant/20 bg-white p-1 shadow-2xs sm:gap-1 sm:self-auto"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activityFilter === "all"}
                  data-testid="filter-tab-all"
                  onClick={() => handleFilterChange("all")}
                  className={`rounded-full px-2 py-1.5 text-[10px] font-bold transition-all cursor-pointer sm:px-4 sm:text-xs ${
                    activityFilter === "all"
                      ? "bg-[#005F3F] text-white shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="sm:hidden">All ({referrals.length})</span><span className="hidden sm:inline">All Referrals ({referrals.length})</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activityFilter === "completed"}
                  data-testid="filter-tab-completed"
                  onClick={() => handleFilterChange("completed")}
                  className={`rounded-full px-2 py-1.5 text-[10px] font-bold transition-all cursor-pointer sm:px-4 sm:text-xs ${
                    activityFilter === "completed"
                      ? "bg-[#005F3F] text-white shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="sm:hidden">Done ({referralStats.completedCount})</span><span className="hidden sm:inline">Completed & Credited ({referralStats.completedCount})</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activityFilter === "pending"}
                  data-testid="filter-tab-pending"
                  onClick={() => handleFilterChange("pending")}
                  className={`rounded-full px-2 py-1.5 text-[10px] font-bold transition-all cursor-pointer sm:px-4 sm:text-xs ${
                    activityFilter === "pending"
                      ? "bg-[#005F3F] text-white shadow-2xs"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="sm:hidden">Pending ({referralStats.pendingCount})</span><span className="hidden sm:inline">Pending First Order ({referralStats.pendingCount})</span>
                </button>
              </div>
            </div>

            {/* Activity Table Card */}
            <div className="overflow-hidden rounded-2xl border border-outline-variant/20 bg-white shadow-xs sm:rounded-3xl">
              {loading ? (
                <div className="px-4 py-8 text-center sm:px-6 sm:py-14">
                  <div className="w-10 h-10 rounded-full border-2 border-[#005F3F] border-t-transparent animate-spin mx-auto mb-3" />
                  <p className="text-xs font-semibold text-on-surface-variant">
                    Loading referral activity from server...
                  </p>
                </div>
              ) : filteredReferrals.length === 0 ? (
                <div
                  data-testid="empty-referrals-view"
                  className="mx-auto max-w-md px-4 py-8 text-center sm:px-6 sm:py-14"
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
                          className="flex flex-col gap-2 p-3 sm:gap-2.5 sm:p-4"
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
                  <div className="flex flex-col justify-between gap-2 border-t border-outline-variant/15 bg-[#f6f7fb] px-3 py-2.5 text-[10px] text-on-surface-variant sm:flex-row sm:items-center sm:gap-3 sm:px-6 sm:py-3.5 sm:text-[11px]">
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

                    <div className="hidden items-center gap-1.5 sm:inline-flex">
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
            <div className="rounded-2xl border border-outline-variant/20 bg-white p-4 shadow-xs sm:rounded-3xl sm:p-8">
              <div className="mb-3 flex items-center gap-2 sm:mb-6 sm:gap-2.5">
                <span className="material-symbols-outlined text-[19px] text-[#005F3F] sm:text-[22px]">
                  gavel
                </span>
                <h2 className="font-headline-lg text-sm font-extrabold text-on-surface sm:text-xl">
                  Referral Terms & Fair Use Guidelines
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:gap-4 md:grid-cols-3">
                {/* Guideline 1: New Customer Registration & Eligibility */}
                <div className="rounded-xl border border-outline-variant/10 bg-[#f6f7fb] p-3 sm:rounded-2xl sm:p-5">
                  <div className="flex items-center gap-2 text-[#005F3F] font-headline-sm text-xs font-extrabold mb-2">
                    <span className="material-symbols-outlined text-[18px]">
                      person_check
                    </span>
                    <span>New Customer Eligibility</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-on-surface-variant sm:text-xs">
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
                <div className="rounded-xl border border-outline-variant/10 bg-[#f6f7fb] p-3 sm:rounded-2xl sm:p-5">
                  <div className="flex items-center gap-2 text-[#005F3F] font-headline-sm text-xs font-extrabold mb-2">
                    <span className="material-symbols-outlined text-[18px]">
                      location_on
                    </span>
                    <span>{storeLocation} Service Zone</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-on-surface-variant sm:text-xs">
                    Orders placed by referred friends must be within our
                    configured{" "}
                    <strong className="text-on-surface font-semibold">
                      {storeInfo?.maxRadiusKm ?? 50} km delivery radius
                    </strong>{" "}
                    around {storeLocation}
                    {storeInfo?.minOrderForFreeDelivery
                      ? ` (free standard delivery on orders ₹${storeInfo.minOrderForFreeDelivery}+)`
                      : ""}
                    .
                  </p>
                </div>

                {/* Guideline 3: Reward Credit & Binary VIP Separation */}
                <div className="rounded-xl border border-outline-variant/10 bg-[#f6f7fb] p-3 sm:rounded-2xl sm:p-5">
                  <div className="flex items-center gap-2 text-[#005F3F] font-headline-sm text-xs font-extrabold mb-2">
                    <span className="material-symbols-outlined text-[18px]">
                      redeem
                    </span>
                    <span>Reward Credit & Redemption</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-on-surface-variant sm:text-xs">
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
