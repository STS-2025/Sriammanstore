import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../services/apiClient";
import {
  calculateLegacyDeliveryCharge,
  isLegacyExpressAvailable,
  LEGACY_CHECKOUT_DEFAULTS,
  settingsService,
} from "../services/settingsService";
import { getMaxRedeemableCoins } from "../services/coinService";

describe("legacy checkout settings integration", () => {
  const originalGet = apiClient.get;

  afterEach(() => {
    apiClient.get = originalGet;
  });

  it("loads the old Settings documents and maps delivery policy fields", async () => {
    apiClient.get = vi.fn().mockImplementation(async (path: string) => {
      const documents: Record<string, Record<string, unknown>> = {
        "/Settings/DeliverySettings": {
          standardFreeThreshold: 600,
          standardCharge: 55,
          expressFreeThreshold: 1200,
          expressCharge: 110,
        },
        "/Settings/ExpressTimeSlots": { startHour: 7, endHour: 20 },
        "/Settings/ExpressAutoThreshold": { threshold: 4500 },
      };
      return documents[path];
    });

    await expect(settingsService.getLegacyCheckoutSettings()).resolves.toEqual({
      standardFreeThreshold: 600,
      standardCharge: 55,
      expressFreeThreshold: 1200,
      expressCharge: 110,
      expressStartHour: 7,
      expressEndHour: 20,
      expressAutoThreshold: 4500,
      coinValueInRupees: 0.05,
    });
    expect(apiClient.get).toHaveBeenCalledWith("/Settings/DeliverySettings");
    expect(apiClient.get).toHaveBeenCalledWith("/Settings/ExpressTimeSlots");
    expect(apiClient.get).toHaveBeenCalledWith("/Settings/ExpressAutoThreshold");
  });

  it("uses the observed legacy defaults only for missing settings documents", async () => {
    apiClient.get = vi.fn().mockRejectedValue({ status: 404 });
    await expect(settingsService.getLegacyCheckoutSettings()).resolves.toEqual(LEGACY_CHECKOUT_DEFAULTS);

    apiClient.get = vi.fn().mockRejectedValue(new Error("permission-denied"));
    await expect(settingsService.getLegacyCheckoutSettings()).rejects.toThrow("permission-denied");
  });

  it("preserves legacy threshold boundaries, express hours, and full-payable coin redemption", () => {
    expect(calculateLegacyDeliveryCharge(500, "standard", 1, LEGACY_CHECKOUT_DEFAULTS)).toBe(49);
    expect(calculateLegacyDeliveryCharge(501, "standard", 1, LEGACY_CHECKOUT_DEFAULTS)).toBe(0);
    expect(calculateLegacyDeliveryCharge(1000, "express", 1, LEGACY_CHECKOUT_DEFAULTS)).toBe(99);
    expect(calculateLegacyDeliveryCharge(0, "standard", 0, LEGACY_CHECKOUT_DEFAULTS)).toBe(0);
    expect(isLegacyExpressAvailable(6, LEGACY_CHECKOUT_DEFAULTS)).toBe(true);
    expect(isLegacyExpressAvailable(21, LEGACY_CHECKOUT_DEFAULTS)).toBe(false);
    expect(getMaxRedeemableCoins(1000, 12.4, 0.05)).toBe(248);
    expect(getMaxRedeemableCoins(100, 12.4, 0.05)).toBe(100);
  });
});
