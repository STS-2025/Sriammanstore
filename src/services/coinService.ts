import { apiClient } from "./apiClient";
import { settingsService } from "./settingsService";
import { authManager } from "./authAdapter";
import { authService } from "./authService";
import { productionCoinReader } from "./productionCoinReader";
import { resolveCustomerDataSource, getCustomerProfileEndpoint } from "./customerDataSourceResolver";
import type { CoinTransaction, Order, User } from "../types";

/**
 * Official Smart Coins conversion rate confirmed by business decision (Phase 7.1):
 * - 1 coin = ₹0.05
 * - ₹1.00 = 20 coins
 */
export const OFFICIAL_COIN_CONVERSION_RATE = 0.05;
export const COINS_PER_RUPEE = 20;

/**
 * Converts Smart Coins to INR value using the confirmed official rate (1 coin = ₹0.05).
 * Example: 20 coins = ₹1.00, 100 coins = ₹5.00.
 */
export function convertCoinsToRupees(
  coins: number,
  rate: number = OFFICIAL_COIN_CONVERSION_RATE
): number {
  if (typeof coins !== "number" || !Number.isFinite(coins) || coins <= 0) return 0;
  return Number((coins * rate).toFixed(2));
}

/**
 * Converts INR value to Smart Coins using the confirmed official rate (₹1.00 = 20 coins).
 * Example: ₹1.00 = 20 coins, ₹5.00 = 100 coins.
 */
export function convertRupeesToCoins(
  rupees: number,
  coinsPerRupee: number = COINS_PER_RUPEE
): number {
  if (typeof rupees !== "number" || !Number.isFinite(rupees) || rupees <= 0) return 0;
  return Math.round(rupees * coinsPerRupee);
}

/** Legacy checkout allowed coins up to the full payable amount after discounts and delivery. */
export function getMaxRedeemableCoins(
  availableCoins: number,
  payableAmount: number,
  coinValueInRupees: number = OFFICIAL_COIN_CONVERSION_RATE,
): number {
  if (
    !Number.isFinite(availableCoins) ||
    !Number.isFinite(payableAmount) ||
    !Number.isFinite(coinValueInRupees) ||
    availableCoins <= 0 ||
    payableAmount <= 0 ||
    coinValueInRupees <= 0
  ) {
    return 0;
  }
  return Math.min(Math.floor(availableCoins), Math.floor(payableAmount / coinValueInRupees));
}

export const coinService = {
  getOfficialConversionRate(): number {
    return OFFICIAL_COIN_CONVERSION_RATE;
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

    if (authManager.getMode() === "production") {
      const currentUser = authService.getCurrentUser();
      const finalLegacySassId = resolvedLegacySassId || currentUser?.legacySassId;
      if (finalLegacySassId) {
        return productionCoinReader.getCustomerCoinBalance(resolvedId, undefined, finalLegacySassId);
      }
      return productionCoinReader.getCustomerCoinBalance(resolvedId);
    }
    try {
      const endpoint = getCustomerProfileEndpoint(resolvedId);
      const user = await apiClient.get<User>(endpoint);
      if (user && typeof user.smartCoins === "number" && Number.isFinite(user.smartCoins)) {
        return Math.max(0, user.smartCoins);
      }
      if (user && typeof user.coins === "number" && Number.isFinite(user.coins)) {
        return Math.max(0, user.coins);
      }
      if (user && typeof user.availableCoins === "number" && Number.isFinite(user.availableCoins)) {
        return Math.max(0, user.availableCoins);
      }
      return 0;
    } catch {
      return 0;
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


