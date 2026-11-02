import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  coinService,
  convertCoinsToRupees,
  convertRupeesToCoins,
  OFFICIAL_COIN_CONVERSION_RATE,
  COINS_PER_RUPEE,
} from "../services/coinService";
import { authManager } from "../services/authAdapter";
import {
  productionCoinReader,
  setProductionCoinReaderOverride,
  normalizeLegacyCoinTransaction,
} from "../services/productionCoinReader";
import { apiClient } from "../services/apiClient";
import { StorageAdapterError } from "../services/firestoreAdapter";
import type { CoinTransaction, User } from "../types";

describe("Phase 4B-3B: Production Read-Only Coin History and Balance Integration", () => {
  beforeEach(() => {
    authManager.resetMode();
    setProductionCoinReaderOverride(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    authManager.resetMode();
    setProductionCoinReaderOverride(null);
    vi.restoreAllMocks();
  });

  describe("1. Environment-Aware Service Routing", () => {
    it("routes getCoinHistory and getUserCoins to productionCoinReader in production auth mode", async () => {
      authManager.setMode("production");
      expect(authManager.getMode()).toBe("production");

      const mockHistory: CoinTransaction[] = [
        {
          id: "ord_prod_101",
          userId: "SASS0000104",
          orderId: "ord_prod_101",
          amount: 250,
          type: "earned",
          description: "Coins earned on Order #ord_prod_101",
          timestamp: "2026-10-18T10:00:00Z",
        },
      ];

      const historySpy = vi.fn().mockResolvedValue(mockHistory);
      const balanceSpy = vi.fn().mockResolvedValue(450);

      setProductionCoinReaderOverride({
        getCustomerCoinHistory: historySpy,
        getCustomerCoinBalance: balanceSpy,
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      const historyResult = await coinService.getCoinHistory("SASS0000104");
      const balanceResult = await coinService.getUserCoins("SASS0000104");

      expect(historySpy).toHaveBeenCalledTimes(1);
      expect(historySpy).toHaveBeenCalledWith("SASS0000104");
      expect(balanceSpy).toHaveBeenCalledTimes(1);
      expect(balanceSpy).toHaveBeenCalledWith("SASS0000104");
      expect(apiGetSpy).not.toHaveBeenCalled();

      expect(historyResult).toEqual(mockHistory);
      expect(balanceResult).toBe(450);
    });

    it("preserves local apiClient routing in emulator mode", async () => {
      authManager.setMode("emulator");
      expect(authManager.getMode()).toBe("emulator");

      const mockEmulatorHistory: CoinTransaction[] = [
        {
          id: "emu_tx_1",
          userId: "SASS0000104",
          amount: 100,
          type: "earned",
          description: "Emulator welcome reward",
          timestamp: "2026-10-01T12:00:00Z",
        },
      ];

      const mockEmulatorUser: Partial<User> = {
        id: "SASS0000104",
        coins: 100,
      };

      const apiGetSpy = vi.spyOn(apiClient, "get").mockImplementation((endpoint: string) => {
        if (endpoint === "/coinHistory") return Promise.resolve(mockEmulatorHistory);
        if (endpoint.startsWith("/users/")) return Promise.resolve(mockEmulatorUser);
        return Promise.resolve(null);
      });

      const prodHistorySpy = vi.fn();
      const prodBalanceSpy = vi.fn();
      setProductionCoinReaderOverride({
        getCustomerCoinHistory: prodHistorySpy,
        getCustomerCoinBalance: prodBalanceSpy,
      });

      const historyResult = await coinService.getCoinHistory("SASS0000104");
      const balanceResult = await coinService.getUserCoins("SASS0000104");

      expect(apiGetSpy).toHaveBeenCalledWith("/coinHistory", { userId: "SASS0000104" });
      expect(apiGetSpy).toHaveBeenCalledWith("/users/SASS0000104");
      expect(prodHistorySpy).not.toHaveBeenCalled();
      expect(prodBalanceSpy).not.toHaveBeenCalled();

      expect(historyResult).toEqual(mockEmulatorHistory);
      expect(balanceResult).toBe(100);
    });

    it("preserves local apiClient routing in mock mode", async () => {
      authManager.setMode("mock");
      expect(authManager.getMode()).toBe("mock");

      const mockHistory: CoinTransaction[] = [
        {
          id: "mock_tx_1",
          userId: "guest_session",
          amount: 50,
          type: "earned",
          description: "Mock bonus",
          timestamp: "2026-10-01T00:00:00Z",
        },
      ];

      const apiGetSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockHistory);
      const prodHistorySpy = vi.fn();
      setProductionCoinReaderOverride({ getCustomerCoinHistory: prodHistorySpy });

      const result = await coinService.getCoinHistory("guest_session");

      expect(apiGetSpy).toHaveBeenCalledWith("/coinHistory", { userId: "guest_session" });
      expect(prodHistorySpy).not.toHaveBeenCalled();
      expect(result).toEqual(mockHistory);
    });
  });

  describe("2. Customer ID Guard & Canonical SASS ID Validation", () => {
    it("returns empty history and zero balance for missing or blank customer ID without calling reader or API", async () => {
      authManager.setMode("production");

      const historySpy = vi.fn();
      const balanceSpy = vi.fn();
      setProductionCoinReaderOverride({
        getCustomerCoinHistory: historySpy,
        getCustomerCoinBalance: balanceSpy,
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      // Undefined ID
      expect(await coinService.getCoinHistory(undefined)).toEqual([]);
      expect(await coinService.getUserCoins(undefined)).toBe(0);

      // Empty string
      expect(await coinService.getCoinHistory("")).toEqual([]);
      expect(await coinService.getUserCoins("")).toBe(0);

      // Blank whitespace
      expect(await coinService.getCoinHistory("   ")).toEqual([]);
      expect(await coinService.getUserCoins("   ")).toBe(0);

      expect(historySpy).not.toHaveBeenCalled();
      expect(balanceSpy).not.toHaveBeenCalled();
      expect(apiGetSpy).not.toHaveBeenCalled();
    });

    it("rejects non-canonical customer identifiers in production reader with 400 StorageAdapterError", () => {
      expect(() => productionCoinReader.assertValidCustomer("guest_999")).toThrowError(
        StorageAdapterError
      );
      expect(() => productionCoinReader.assertValidCustomer("firebase-uid-abc")).toThrowError(
        /Production customer operations require a canonical SASS customer ID/
      );
      expect(() => productionCoinReader.assertValidCustomer("")).toThrowError(StorageAdapterError);

      // Valid SASS IDs succeed
      expect(productionCoinReader.assertValidCustomer("SASS0000104")).toBe("SASS0000104");
      expect(productionCoinReader.assertValidCustomer("SASS0000001")).toBe("SASS0000001");
    });
  });

  describe("3. Legacy Document Normalization & Deduplication", () => {
    it("normalizes legacy buyer self coins document into earned transaction", () => {
      const docData = {
        id: "ord_1001",
        orderId: "ord_1001",
        amount: 320,
        type: "self",
        status: "released",
        orderAmount: 320,
        createdAt: "2026-10-10T14:30:00Z",
      };

      const normalized = normalizeLegacyCoinTransaction("ord_1001", docData, "SASS0000104");

      expect(normalized).toEqual({
        id: "ord_1001",
        userId: "SASS0000104",
        orderId: "ord_1001",
        amount: 320,
        type: "earned",
        description: "Coins earned on Order #ord_1001",
        timestamp: "2026-10-10T14:30:00.000Z",
      });
    });

    it("normalizes legacy referral coins document with buyerName", () => {
      const docData = {
        id: "ord_1002_ref",
        orderId: "ord_1002",
        amount: 100,
        type: "referral",
        status: "released",
        buyerName: "Murugan Selvam",
        createdAt: "2026-10-12T09:15:00Z",
      };

      const normalized = normalizeLegacyCoinTransaction("ord_1002_ref", docData, "SASS0000104");

      expect(normalized.id).toBe("ord_1002_ref");
      expect(normalized.amount).toBe(100);
      expect(normalized.type).toBe("earned");
      expect(normalized.description).toBe("Referral reward from Murugan Selvam");
      expect(normalized.timestamp).toBe("2026-10-12T09:15:00.000Z");
    });

    it("normalizes legacy redeemed coins document into redeemed transaction", () => {
      const docData = {
        id: "ord_1003_redeem",
        orderId: "ord_1003",
        amount: 80,
        type: "redeemed",
        status: "redeemed",
        createdAt: "2026-10-14T18:00:00Z",
      };

      const normalized = normalizeLegacyCoinTransaction("ord_1003_redeem", docData, "SASS0000104");

      expect(normalized.id).toBe("ord_1003_redeem");
      expect(normalized.amount).toBe(80);
      expect(normalized.type).toBe("redeemed");
      expect(normalized.description).toBe("Redeemed on Order #ord_1003");
      expect(normalized.timestamp).toBe("2026-10-14T18:00:00.000Z");
    });

    it("normalizes pending transaction status by noting pending delivery in description", () => {
      const docData = {
        id: "ord_1004",
        orderId: "ord_1004",
        amount: 150,
        type: "self",
        status: "pending",
        createdAt: "2026-10-20T12:00:00Z",
      };

      const normalized = normalizeLegacyCoinTransaction("ord_1004", docData, "SASS0000104");

      expect(normalized.amount).toBe(150);
      expect(normalized.type).toBe("earned");
      expect(normalized.description).toContain("Pending delivery");
    });

    it("handles Firestore Timestamp objects with toDate() or seconds gracefully", () => {
      const timestampSeconds = 1792000000;
      const expectedIso = new Date(timestampSeconds * 1000).toISOString();

      const docDataWithSeconds = {
        amount: 75,
        type: "self",
        createdAt: { seconds: timestampSeconds },
      };

      const normalized = normalizeLegacyCoinTransaction("tx_time_1", docDataWithSeconds, "SASS0000104");
      expect(normalized.timestamp).toBe(expectedIso);
    });
  });

  describe("4. Balance and Calculation Correctness", () => {
    it("strictly preserves the confirmed conversion rate (1 coin = ₹0.05, 20 coins = ₹1)", () => {
      expect(coinService.getOfficialConversionRate()).toBe(OFFICIAL_COIN_CONVERSION_RATE);
      expect(OFFICIAL_COIN_CONVERSION_RATE).toBe(0.05);
      expect(coinService.getCoinsPerRupee()).toBe(COINS_PER_RUPEE);
      expect(COINS_PER_RUPEE).toBe(20);

      // Convert Coins to Rupees
      expect(convertCoinsToRupees(20)).toBe(1.0);
      expect(convertCoinsToRupees(100)).toBe(5.0);
      expect(convertCoinsToRupees(500)).toBe(25.0);
      expect(convertCoinsToRupees(0)).toBe(0);

      // Convert Rupees to Coins
      expect(convertRupeesToCoins(1.0)).toBe(20);
      expect(convertRupeesToCoins(5.0)).toBe(100);
      expect(convertRupeesToCoins(25.0)).toBe(500);
      expect(convertRupeesToCoins(0)).toBe(0);
    });

    it("correctly reconciles ledger stats without double counting", () => {
      const history: CoinTransaction[] = [
        {
          id: "tx_1",
          userId: "SASS0000104",
          amount: 200,
          type: "earned",
          description: "Order reward",
          timestamp: new Date().toISOString(),
        },
        {
          id: "tx_2",
          userId: "SASS0000104",
          amount: 50,
          type: "redeemed",
          description: "Checkout discount",
          timestamp: new Date().toISOString(),
        },
        {
          id: "tx_3",
          userId: "SASS0000104",
          amount: 100,
          type: "earned",
          description: "Referral reward",
          timestamp: new Date().toISOString(),
        },
      ];

      const stats = coinService.calculateLedgerStats(history);
      expect(stats.totalEarned).toBe(300);
      expect(stats.totalRedeemed).toBe(50);
      expect(stats.netBalance).toBe(250);
    });

    it("never produces negative netBalance when redemptions exceed earnings", () => {
      const excessiveRedemptions: CoinTransaction[] = [
        {
          id: "tx_red",
          userId: "SASS0000104",
          amount: 500,
          type: "redeemed",
          description: "Excessive debit",
          timestamp: new Date().toISOString(),
        },
      ];

      const stats = coinService.calculateLedgerStats(excessiveRedemptions);
      expect(stats.netBalance).toBe(0);
    });
  });

  describe("5. Active Production Mutations", () => {
    it("allows recordTransaction in production mode", async () => {
      authManager.setMode("production");

      const tx = await coinService.recordTransaction({
        userId: "SASS0000104",
        amount: 50,
        type: "earned",
        description: "Manual adjustment",
        timestamp: new Date().toISOString(),
      });
      expect(tx).toBeDefined();
      expect(tx.userId).toBe("SASS0000104");
      expect(tx.amount).toBe(50);
    });

    it("allows recordTransaction in mock mode", async () => {
      authManager.setMode("mock");

      const newTx: CoinTransaction = {
        id: "coin_mock_created",
        userId: "guest_session",
        amount: 25,
        type: "earned",
        description: "Welcome bonus",
        timestamp: new Date().toISOString(),
      };

      vi.spyOn(apiClient, "get").mockResolvedValue([]);
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(newTx);

      const created = await coinService.recordTransaction({
        userId: "guest_session",
        amount: 25,
        type: "earned",
        description: "Welcome bonus",
        timestamp: new Date().toISOString(),
      });

      expect(postSpy).toHaveBeenCalledWith("/coinHistory", expect.objectContaining({ amount: 25 }));
      expect(created.id).toBe("coin_mock_created");
    });
  });

  describe("6. Error Propagation (No Silent Fallback to Mock Data)", () => {
    it("propagates StorageAdapterError when production coin balance query fails", async () => {
      authManager.setMode("production");

      setProductionCoinReaderOverride({
        getCustomerCoinBalance: vi.fn().mockRejectedValue(
          new StorageAdapterError("Permission denied: insufficient Firestore security rules", {
            status: 403,
            code: "permission-denied",
            category: "permission",
          })
        ),
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      await expect(coinService.getUserCoins("SASS0000104")).rejects.toThrowError(
        /Permission denied/
      );

      // Verify that apiClient was NEVER called as a silent fallback
      expect(apiGetSpy).not.toHaveBeenCalled();
    });

    it("propagates StorageAdapterError when production coin history query fails", async () => {
      authManager.setMode("production");

      setProductionCoinReaderOverride({
        getCustomerCoinHistory: vi.fn().mockRejectedValue(
          new StorageAdapterError("Network unavailable", {
            status: 503,
            code: "unavailable",
            category: "connectivity",
          })
        ),
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      await expect(coinService.getCoinHistory("SASS0000104")).rejects.toThrowError(
        /Network unavailable/
      );

      expect(apiGetSpy).not.toHaveBeenCalled();
    });
  });
});
