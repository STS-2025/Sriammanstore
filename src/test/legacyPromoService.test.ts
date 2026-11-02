import { afterEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../services/apiClient";
import {
  calculateLegacyPromoDiscount,
  fetchPromoByCode,
} from "../services/promoService";

describe("legacy promo integration", () => {
  const originalGet = apiClient.get;

  afterEach(() => {
    apiClient.get = originalGet;
  });

  it("reads a normalized promo from the legacy promoCodes collection", async () => {
    apiClient.get = vi.fn().mockResolvedValue([
      { id: "promo_1", code: "SAVE10", value: 10 },
    ]);

    const promo = await fetchPromoByCode(" save10 ");

    expect(apiClient.get).toHaveBeenCalledWith("/promoCodes", { code: "SAVE10" });
    expect(promo).toMatchObject({ id: "promo_1", code: "SAVE10", amount: 10, type: "percentage" });
    expect(calculateLegacyPromoDiscount(promo, 250)).toBe(25);
  });

  it("uses the legacy promos collection when promoCodes has no matching record", async () => {
    apiClient.get = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "promo_2", code: "SAVE75", amount: 75, type: "fixed" }]);

    const promo = await fetchPromoByCode("SAVE75");

    expect(apiClient.get).toHaveBeenNthCalledWith(2, "/promos", { code: "SAVE75" });
    expect(calculateLegacyPromoDiscount(promo, 50)).toBe(50);
  });

  it("rejects inactive promotions and keeps service failures visible", async () => {
    apiClient.get = vi.fn().mockResolvedValue([{ id: "promo_3", code: "OLD", status: "expired" }]);
    await expect(fetchPromoByCode("OLD")).rejects.toThrow("expired or is inactive");

    apiClient.get = vi.fn().mockRejectedValue(new Error("permission-denied"));
    await expect(fetchPromoByCode("SAVE10")).rejects.toThrow("permission-denied");
    expect(apiClient.get).toHaveBeenCalledTimes(1);
  });
});
