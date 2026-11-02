import { describe, it, expect, vi } from "vitest";
import {
  assessCustomerDocument,
  buildMigrationPayload,
  runCustomerCoinMigration,
  type CustomerMigrationAssessment,
} from "../services/customerCoinMigration";
import { normalizeLegacyUser } from "../services/legacyUserMapper";
import { coinService } from "../services/coinService";
import { orderService } from "../services/orderService";
import { apiClient } from "../services/apiClient";
import type { User } from "../types";

describe("Customer Schema Standardization & Smart Coins Migration Test Suite", () => {
  // ==========================================================================
  // 1. Migration Assessment Logic
  // ==========================================================================
  describe("Migration Assessment & Field Precedence", () => {
    it("identifies documents already using canonical smartCoins (smartCoins only)", () => {
      const doc = {
        id: "ONCUS0000001",
        userId: "ONCUS0000001",
        smartCoins: 150,
        earnedCoins: 300,
        fullName: "Kavitha Rajan",
      };

      const assessment = assessCustomerDocument(doc, "ONCUS0000001");
      expect(assessment.status).toBe("already_canonical");
      expect(assessment.action).toBe("none");
      expect(assessment.proposedSmartCoins).toBe(150);
      expect(assessment.removeCoinsField).toBe(false);
      expect(assessment.hasRedundantAvailableCoins).toBe(false);

      const payload = buildMigrationPayload(assessment);
      expect(payload).toBeNull();
    });

    it("identifies documents with legacy coins only and proposes safe migration", () => {
      const doc = {
        id: "ONCUS0000021",
        userId: "ONCUS0000021",
        coins: 200,
        availableCoins: 200,
        earnedCoins: 450,
        fullName: "S. Ramanathan",
      };

      const assessment = assessCustomerDocument(doc, "ONCUS0000021");
      expect(assessment.status).toBe("coins_only");
      expect(assessment.action).toBe("migrate_to_smart_coins");
      expect(assessment.proposedSmartCoins).toBe(200);
      expect(assessment.removeCoinsField).toBe(true);
      expect(assessment.hasRedundantAvailableCoins).toBe(true);

      const payload = buildMigrationPayload(assessment, false);
      expect(payload).toBeDefined();
      expect(payload?.["smartCoins"]).toBe(200);
    });

    it("identifies documents with both smartCoins and coins matching, proposing coins removal", () => {
      const doc = {
        id: "ONCUS0000030",
        userId: "ONCUS0000030",
        smartCoins: 350,
        coins: 350,
        earnedCoins: 500,
      };

      const assessment = assessCustomerDocument(doc, "ONCUS0000030");
      expect(assessment.status).toBe("both_matching");
      expect(assessment.action).toBe("remove_legacy_coins");
      expect(assessment.proposedSmartCoins).toBe(350);
      expect(assessment.removeCoinsField).toBe(true);
    });

    it("flags conflicting coin balances for review without guessing, overwriting, or summing", () => {
      const doc = {
        id: "ONCUS0000045",
        userId: "ONCUS0000045",
        smartCoins: 120,
        coins: 250, // Conflict!
        earnedCoins: 400,
      };

      const assessment = assessCustomerDocument(doc, "ONCUS0000045");
      expect(assessment.status).toBe("both_conflicting");
      expect(assessment.action).toBe("review_required");
      expect(assessment.proposedSmartCoins).toBeNull();
      expect(assessment.removeCoinsField).toBe(false);
      expect(assessment.reason).toContain("Balance conflict detected");

      const payload = buildMigrationPayload(assessment);
      expect(payload).toBeNull(); // Must not mutate
    });

    it("flags missing or invalid balances without overwriting with arbitrary defaults", () => {
      const doc = {
        id: "ONCUS0000099",
        userId: "ONCUS0000099",
        coins: -50, // Invalid negative
        fullName: "Faulty Document",
      };

      const assessment = assessCustomerDocument(doc, "ONCUS0000099");
      expect(assessment.status).toBe("missing_or_invalid");
      expect(assessment.action).toBe("review_required");
      expect(assessment.proposedSmartCoins).toBeNull();

      const payload = buildMigrationPayload(assessment);
      expect(payload).toBeNull();
    });
  });

  // ==========================================================================
  // 2. Dry-Run & Execute Migration Engine
  // ==========================================================================
  describe("Migration Engine (Dry-Run vs. Execution)", () => {
    const testDocs = [
      { id: "ONCUS0000001", data: { id: "ONCUS0000001", smartCoins: 100 } },
      { id: "ONCUS0000002", data: { id: "ONCUS0000002", coins: 250, availableCoins: 250 } },
      { id: "ONCUS0000003", data: { id: "ONCUS0000003", smartCoins: 300, coins: 300 } },
      { id: "ONCUS0000004", data: { id: "ONCUS0000004", smartCoins: 50, coins: 500 } }, // Conflict
      { id: "ONCUS0000005", data: { id: "ONCUS0000005", coins: "invalid" } }, // Invalid
    ];

    it("executes dry-run without writing any changes and reports statistics anonymously", async () => {
      const mockWriter = vi.fn();

      const report = await runCustomerCoinMigration({
        mode: "dry-run",
        documents: testDocs,
        writer: mockWriter,
      });

      expect(report.mode).toBe("dry-run");
      expect(report.totalDocumentsScanned).toBe(5);
      expect(report.counts.alreadyCanonical).toBe(1);
      expect(report.counts.coinsOnly).toBe(1);
      expect(report.counts.bothMatching).toBe(1);
      expect(report.counts.bothConflicting).toBe(1);
      expect(report.counts.missingOrInvalid).toBe(1);
      expect(report.counts.redundantAvailableCoinsPresent).toBe(1);

      expect(report.actionsPlanned.migrated).toBe(1);
      expect(report.actionsPlanned.legacyFieldRemoved).toBe(1);
      expect(report.actionsPlanned.flaggedForReview).toBe(2);

      // Verify zero writes occurred during dry-run
      expect(mockWriter).not.toHaveBeenCalled();

      // Verify privacy: flagged list contains only IDs, zero PII
      expect(report.flaggedCustomerIds).toEqual(["ONCUS0000004", "ONCUS0000005"]);
      expect(JSON.stringify(report)).not.toMatch(/@|\+91/);
    });

    it("executes migration in batches and is idempotent upon retry", async () => {
      const writtenBatches: Array<{ id: string; data: Record<string, unknown> }[]> = [];
      const mockWriter = vi.fn().mockImplementation(async (updates) => {
        writtenBatches.push(updates);
      });

      const report = await runCustomerCoinMigration({
        mode: "execute",
        documents: testDocs,
        batchSize: 2,
        writer: mockWriter,
      });

      expect(report.mode).toBe("execute");
      expect(mockWriter).toHaveBeenCalled();

      // Flatten updates
      const allUpdates = writtenBatches.flat();
      expect(allUpdates.length).toBe(2); // Only ONCUS0000002 (coins_only) and ONCUS0000003 (both_matching)
      expect(allUpdates.some((u) => u.id === "ONCUS0000002")).toBe(true);
      expect(allUpdates.some((u) => u.id === "ONCUS0000003")).toBe(true);

      // Verify ONCUS0000004 (conflict) and ONCUS0000005 (invalid) were NOT written
      expect(allUpdates.some((u) => u.id === "ONCUS0000004")).toBe(false);
      expect(allUpdates.some((u) => u.id === "ONCUS0000005")).toBe(false);

      // Retry idempotency test: after ONCUS0000002 is migrated, a second run produces no action
      const migratedDocs = [
        { id: "ONCUS0000002", data: { id: "ONCUS0000002", smartCoins: 250 } }, // Now canonical
      ];

      const retryReport = await runCustomerCoinMigration({
        mode: "dry-run",
        documents: migratedDocs,
      });

      expect(retryReport.counts.alreadyCanonical).toBe(1);
      expect(retryReport.actionsPlanned.noop).toBe(1);
      expect(retryReport.actionsPlanned.migrated).toBe(0);
    });
  });

  // ==========================================================================
  // 3. Normalization Layer Precedence & Backward Compatibility
  // ==========================================================================
  describe("Customer Normalization & Balance Precedence", () => {
    it("normalizes customer with smartCoins as canonical balance", () => {
      const raw = {
        id: "ONCUS0000001",
        userId: "ONCUS0000001",
        fullName: "Priya Sundaram",
        email: "priya@example.com",
        smartCoins: 350,
        earnedCoins: 600,
        dob: "1990-05-12",
      };

      const user = normalizeLegacyUser(raw);
      expect(user).not.toBeNull();
      expect(user!.smartCoins).toBe(350);
      expect(user!.coins).toBe(350); // Backward compat alias
      expect(user!.earnedCoins).toBe(600);
      expect(user!.dob).toBe("1990-05-12");
      expect(user!.customerId).toBe("ONCUS0000001");
    });

    it("falls back to legacy coins for unmigrated documents", () => {
      const raw = {
        id: "ONCUS0000021",
        userId: "ONCUS0000021",
        coins: 180,
        availableCoins: 180,
      };

      const user = normalizeLegacyUser(raw);
      expect(user).not.toBeNull();
      expect(user!.smartCoins).toBe(180);
      expect(user!.coins).toBe(180);
    });

    it("prefers smartCoins over coins if both are present in document", () => {
      const raw = {
        id: "ONCUS0000050",
        userId: "ONCUS0000050",
        smartCoins: 500,
        coins: 100, // Stale legacy field
      };

      const user = normalizeLegacyUser(raw);
      expect(user).not.toBeNull();
      expect(user!.smartCoins).toBe(500);
    });
  });

  // ==========================================================================
  // 4. Order Service Coin Deductions & Balance Updates
  // ==========================================================================
  describe("Order Balance Writes Use smartCoins Strictly", () => {
    it("patches customer balance using smartCoins and never writes coins", async () => {
      const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValue({
        id: "ONCUS0000010",
        userId: "ONCUS0000010",
        name: "Test Customer",
        phone: "+91 99999 99999",
        email: "test@example.com",
        smartCoins: 150,
        coins: 150,
        isVIP: false,
        referralCode: "ONCUS0000010",
        createdAt: "2026-10-29T00:00:00.000Z",
      } as User);

      vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
        if (url.includes("/cart")) return [] as any;
        return {
          id: "ONCUS0000010",
          userId: "ONCUS0000010",
          smartCoins: 200,
          earnedCoins: 500,
        };
      });

      vi.spyOn(apiClient, "post").mockResolvedValue({ id: "ORD-0001" });

      // Create an order redeeming 50 coins
      await orderService.createOrder({
        userId: "ONCUS0000010",
        customerName: "Test User",
        phone: "+91 99999 99999",
        address: {
          id: "ADDR-1",
          userId: "ONCUS0000010",
          name: "Test User",
          phone: "+91 99999 99999",
          houseNo: "123",
          street: "Main St",
          city: "Gobichettipalayam",
          pincode: "638452",
          lat: 11.4598,
          lng: 77.334,
          isDefault: true,
          tag: "Home",
        },
        deliverySlot: {
          id: "slot-1",
          type: "express",
          title: "Express",
          subtitle: "60 mins",
          charge: 0,
        },
        cartItems: [
          {
            id: "ci-1",
            cartKey: "ci-1",
            userId: "ONCUS0000010",
            productId: "p-1",
            name: "Wood Pressed Sesame Oil",
            image: "/oil.jpg",
            unit: "L",
            unitSize: "1",
            price: 500,
            mrp: 550,
            quantity: 1,
            optionIndex: 0,
            stock: 10,
          },
        ],
        subtotal: 500,
        productSavings: 50,
        coinsRedeemed: 50,
        coinDiscount: 2.5,
        couponDiscount: 0,
        deliveryFee: 0,
        totalAmount: 497.5,
        paymentMethod: "cod",
      });

      expect(patchSpy).toHaveBeenCalled();
      const patchPayload = patchSpy.mock.calls[0]?.[1] as Record<string, unknown>;
      expect(patchPayload).toBeDefined();

      // CRITICAL REQUIREMENT: smartCoins must be updated, coins must NEVER be in patch payload
      expect(patchPayload["smartCoins"]).toBeDefined();
      expect("coins" in patchPayload).toBe(false);
      expect("availableCoins" in patchPayload).toBe(false);
    });
  });
});
