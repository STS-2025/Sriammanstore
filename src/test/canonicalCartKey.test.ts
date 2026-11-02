import { describe, it, expect } from "vitest";
import { buildCartKey, parseCartKey } from "../lib/productUtils";

describe("Canonical Cart Key Format", () => {
  it("formats key strictly as productId__optIndex__unit__unitSize", () => {
    const key = buildCartKey("prod_groundnut_oil", 1, "L", "1");
    expect(key).toBe("prod_groundnut_oil__opt1__L__1");
  });

  it("parses canonical cart key back into individual components", () => {
    const parsed = parseCartKey("prod_groundnut_oil__opt1__L__1");
    expect(parsed).toEqual({
      productId: "prod_groundnut_oil",
      optionIndex: 1,
      unit: "L",
      unitSize: "1",
    });
  });

  it("handles complex units like ml and pcs", () => {
    const keyMl = buildCartKey("prod_a2_ghee", 0, "ml", "250");
    expect(keyMl).toBe("prod_a2_ghee__opt0__ml__250");

    const keyPcs = buildCartKey("prod_country_eggs", 1, "pcs", "12");
    expect(keyPcs).toBe("prod_country_eggs__opt1__pcs__12");
  });
});

