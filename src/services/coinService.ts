import { apiClient } from "./apiClient";
import { settingsService } from "./settingsService";
import { authManager } from "./authAdapter";
import { authService } from "./authService";
import { productionCoinReader } from "./productionCoinReader";
import { resolveCustomerDataSource, getCustomerProfileEndpoint } from "./customerDataSourceResolver";
import type { CoinTransaction, Order, User } from "../types";

/** Fallback conversion values; active checkout rates come from admin businessSettings. */
export const OFFICIAL_COIN_CONVERSION_RATE = 1;
export const COINS_PER_RUPEE = 1;

/** Converts Smart Coins to rupees using the supplied configured value. */
export function convertCoinsToRupees(
  coins: number,
  rate: number = OFFICIAL_COIN_CONVERSION_RATE
): number {
  if (typeof coins !== "number" || !Number.isFinite(coins) || coins <= 0) return 0;
  return Number((coins * rate).toFixed(2));
}

/** Converts rupees to Smart Coins using the supplied coins-per-rupee rate. */
export function convertRupeesToCoins(
  rupees: number,
  coinsPerRupee: number = COINS_PER_RUPEE
): number {
  if (typeof rupees !== "number" || !Number.isFinite(rupees) || rupees <= 0) return 0;
  return Math.round(rupees * coinsPerRupee);
}

/** Applies the cart value cap once the customer's balance reaches the redemption threshold. */
export function getMaxRedeemableCoins(
  availableCoins: number,
  subtotal: number,
  coinValueInRupees: number = OFFICIAL_COIN_CONVERSION_RATE,
  maxRedemptionPercent = 100,
  minimumCoins = 0,
): number {
  if (
    !Number.isFinite(availableCoins) ||
    !Number.isFinite(subtotal) ||
    !Number.isFinite(coinValueInRupees) ||
    !Number.isFinite(maxRedemptionPercent) ||
    !Number.isFinite(minimumCoins) ||
    availableCoins <= 0 ||
    subtotal <= 0 ||
    coinValueInRupees <= 0
  ) {
    return 0;
  }
  const redemptionCap = (subtotal * Math.max(0, maxRedemptionPercent)) / 100;
  if (availableCoins < minimumCoins) return 0;

  return Math.min(
    Math.floor(availableCoins),
    Math.floor(redemptionCap / coinValueInRupees),
  );
}

function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + Math.max(0, months));
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

export function getCoinExpiryDate(earnedAt: Date, validityMonths: number): string {
  return addCalendarMonths(earnedAt, validityMonths).toISOString();
}

/** Rebuilds spendable balance from the ledger, expiring earned lots by age. */
export function calculateSpendableCoinBalance(
  history: CoinTransaction[],
  validityMonths: number,
  now = new Date(),
): number {
  type CoinLot = { amount: number; expiresAt: number };
  const lots: CoinLot[] = [];
  const transactions = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const expireLots = (at: number) => {
    for (let i = lots.length - 1; i >= 0; i--) {
      if (lots[i].expiresAt <= at || lots[i].amount <= 0) lots.splice(i, 1);
    }
  };

  for (const tx of transactions) {
    const txTime = new Date(tx.timestamp).getTime();
    if (!Number.isFinite(txTime) || !Number.isFinite(tx.amount) || tx.amount <= 0) continue;
    expireLots(txTime);

    if (tx.type === "earned") {
      const explicitExpiry = tx.expiresAt ? new Date(tx.expiresAt).getTime() : NaN;
      const expiry = Number.isFinite(explicitExpiry)
        ? explicitExpiry
        : addCalendarMonths(new Date(txTime), validityMonths).getTime();
      if (expiry > txTime) lots.push({ amount: tx.amount, expiresAt: expiry });
      continue;
    }

    // Spend oldest-expiring eligible coins first so later credits retain their full validity.
    lots.sort((a, b) => a.expiresAt - b.expiresAt);
    let remaining = tx.amount;
    for (const lot of lots) {
      const used = Math.min(lot.amount, remaining);
      lot.amount -= used;
      remaining -= used;
      if (remaining <= 0) break;
    }
    expireLots(txTime);
  }

  expireLots(now.getTime());
  return Math.max(0, Math.floor(lots.reduce((sum, lot) => sum + lot.amount, 0)));
}

export const coinService = {
  async getOfficialConversionRate(): Promise<number> {
    return settingsService.getLegacyCoinValue();
  },

  getCoinsPerRupee(): number {
    return COINS_PER_RUPEE;
  },

  async getCoinHistory(userId?: string, legacySassId?: string): Promise<CoinTransaction[]> {
    const cleanId = (userId || "").trim();
    if (!cleanId) return [];

    let resolvedId = cleanId;
    let resolvedLegacySassId = legacySassId;
    try {
      const ds = resolveCustomerDataSource(cleanId);
      resolvedId = ds.canonicalCustomerId;
      resolvedLegacySassId = legacySassId || ds.legacySassId;
    } catch {
      // fallback
    }

    if (authManager.getMode() === "production") {
      const currentUser = authService.getCurrentUser();
      const finalLegacySassId = resolvedLegacySassId || currentUser?.legacySassId;
      if (finalLegacySassId) {
        return productionCoinReader.getCustomerCoinHistory(resolvedId, undefined, finalLegacySassId);
      }
      return productionCoinReader.getCustomerCoinHistory(resolvedId);
    }
    const history = await apiClient.get<CoinTransaction[]>("/coinHistory", { userId: resolvedId });
    return (history || []).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  /**
   * Retrieves the authoritative available Smart Coins balance for a customer directly
   * from storage (/onlineCustomers/:userId or /users/:userId in production Firestore or mock backend).
   */
  async getUserCoins(userId?: string, legacySassId?: string): Promise<number> {
    const cleanId = (userId || "").trim();
    if (!cleanId) return 0;

    let resolvedId = cleanId;
    let resolvedLegacySassId = legacySassId;
    try {
      const ds = resolveCustomerDataSource(cleanId);
      resolvedId = ds.canonicalCustomerId;
      resolvedLegacySassId = legacySassId || ds.legacySassId;
    } catch {
      // fallback
    }

    let storedBalance = 0;
    if (authManager.getMode() === "production") {
      const currentUser = authService.getCurrentUser();
      const finalLegacySassId = resolvedLegacySassId || currentUser?.legacySassId;
      if (finalLegacySassId) {
        storedBalance = await productionCoinReader.getCustomerCoinBalance(resolvedId, undefined, finalLegacySassId);
      } else {
        storedBalance = await productionCoinReader.getCustomerCoinBalance(resolvedId);
      }
    } else {
      try {
        const endpoint = getCustomerProfileEndpoint(resolvedId);
        const user = await apiClient.get<User>(endpoint);
        if (user && typeof user.smartCoins === "number" && Number.isFinite(user.smartCoins)) {
          storedBalance = Math.max(0, user.smartCoins);
        } else if (user && typeof user.coins === "number" && Number.isFinite(user.coins)) {
          storedBalance = Math.max(0, user.coins);
        } else if (user && typeof user.availableCoins === "number" && Number.isFinite(user.availableCoins)) {
          storedBalance = Math.max(0, user.availableCoins);
        }
      } catch {
        return 0;
      }
    }

    try {
      const [history, settings] = await Promise.all([
        this.getCoinHistory(resolvedId, resolvedLegacySassId),
        settingsService.getLegacyCheckoutSettings(),
      ]);
      if (!history.length) return storedBalance;
      return Math.min(
        storedBalance,
        calculateSpendableCoinBalance(history, settings.coinValidityMonths),
      );
    } catch {
      return storedBalance;
    }
  },

  async getConversionRate(): Promise<number> {
    return settingsService.getLegacyCoinValue();
  },

  calculateLedgerStats(history: CoinTransaction[]): {
    totalEarned: number;
    totalRedeemed: number;
    earnedThisMonth: number;
    redeemedThisMonth: number;
    netBalance: number;
  } {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    let totalEarned = 0;
    let totalRedeemed = 0;
    let earnedThisMonth = 0;
    let redeemedThisMonth = 0;

    for (const tx of history) {
      const txDate = new Date(tx.timestamp);
      const isThisMonth =
        txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;

      if (tx.type === "earned") {
        totalEarned += tx.amount;
        if (isThisMonth) earnedThisMonth += tx.amount;
      } else if (tx.type === "redeemed") {
        totalRedeemed += tx.amount;
        if (isThisMonth) redeemedThisMonth += tx.amount;
      }
    }

    return {
      totalEarned,
      totalRedeemed,
      earnedThisMonth,
      redeemedThisMonth,
      netBalance: Math.max(0, totalEarned - totalRedeemed),
    };
  },

  calculateVIPStatus(
    orders: Order[],
    threshold: number = 5000
  ): {
    isVIP: boolean;
    rollingSpend: number;
    threshold: number;
    percentage: number;
    daysRemaining: number;
  } {
    const now = new Date().getTime();
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

    // Filter only delivered orders within the last 30 days
    const recentDelivered = orders.filter((o) => {
      if (o.status !== "delivered") return false;
      const orderTime = new Date(o.createdAt).getTime();
      return now - orderTime <= thirtyDaysMs;
    });

    const rollingSpend = recentDelivered.reduce(
      (sum, o) => sum + (o.pricingSummary?.totalAmount || 0),
      0
    );

    const isVIP = rollingSpend >= threshold;
    const percentage = Math.min(100, Math.round((rollingSpend / threshold) * 100));

    return {
      isVIP,
      rollingSpend,
      threshold,
      percentage,
      daysRemaining: 30,
    };
  },

  async recordTransaction(
    tx: Omit<CoinTransaction, "id">,
    idempotencyKey?: string
  ): Promise<CoinTransaction> {
    const txId = idempotencyKey || `coin_${tx.type}_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    let resolvedUserId = tx.userId;
    try {
      resolvedUserId = resolveCustomerDataSource(tx.userId).canonicalCustomerId;
    } catch {
      // fallback
    }

    if (idempotencyKey) {
      const existing = await this.getCoinHistory(resolvedUserId);
      const duplicate = existing.find((t) => t.id === idempotencyKey);
      if (duplicate) return duplicate;
    }

    const newTx: CoinTransaction = {
      ...tx,
      userId: resolvedUserId,
      id: txId,
    };

    return apiClient.post<CoinTransaction>("/coinHistory", newTx);
  },
};


