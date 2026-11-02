import { describe, it, expect } from "vitest";
import type { Product } from "../types";
import {
  getSimilarProducts,
  getComplementaryProducts,
  calculateSimilarityScore,
  calculateComplementaryScore,
  COMPLEMENTARY_CATEGORY_MAP,
  SPECIFIC_PRODUCT_COMPLEMENTS,
  hasAvailableStock,
} from "../lib/recommendationUtils";
import { productService } from "../services/productService";
import db from "../../db.json";

const mockProducts: Product[] = db.products as Product[];

describe("Product Recommendations Engine", () => {
  const groundnutOil = mockProducts.find((p) => p.id === "prod_groundnut_oil")!;
  const ponniRice = mockProducts.find((p) => p.id === "prod_ponni_rice")!;
  const filterCoffee = mockProducts.find((p) => p.id === "prod_filter_coffee")!;
  const ootyCarrots = mockProducts.find((p) => p.id === "prod_ooty_carrots")!;

  describe("1. Similar Products (Traditional Alternatives)", () => {
    it("never includes the target product in similar products (self-exclusion)", () => {
      for (const prod of mockProducts) {
        const similar = getSimilarProducts(prod, mockProducts);
        const containsSelf = similar.some((p) => p.id === prod.id);
        expect(containsSelf).toBe(false);
      }
    });

    it("ranks candidates by category, tags, and extraction method", () => {
      const similar = getSimilarProducts(groundnutOil, mockProducts);

      expect(similar.length).toBeGreaterThan(0);
      // All similar items to groundnut oil should be in cold-pressed-oils
      expect(similar.every((p) => p.categorySlug === "cold-pressed-oils")).toBe(true);
      // Both sesame oil and A2 ghee should be included
      const ids = similar.map((p) => p.id);
      expect(ids).toContain("prod_sesame_oil");
      expect(ids).toContain("prod_a2_ghee");
    });

    it("ranks similar products for Tanjore Ponni Rice within staples-grains", () => {
      const similar = getSimilarProducts(ponniRice, mockProducts);

      expect(similar.length).toBeGreaterThan(0);
      expect(similar.every((p) => p.categorySlug === "staples-grains")).toBe(true);
      const ids = similar.map((p) => p.id);
      expect(ids).toContain("prod_unpolished_toor_dal");
      expect(ids).toContain("prod_country_sugar");
    });

    it("does not recommend unrelated products merely to fill a row", () => {
      // Ooty carrots is the only item in fruits-veggies and has unrelated tags/extraction
      const similar = getSimilarProducts(ootyCarrots, mockProducts);
      // It should NOT include random oils or dal as 'similar' products
      expect(similar).toHaveLength(0);
    });

    it("excludes inactive products from recommendations", () => {
      const inactiveClone: Product = {
        ...mockProducts.find((p) => p.id === "prod_sesame_oil")!,
        id: "prod_inactive_sesame",
        isActive: false,
      };

      const testCatalog = [...mockProducts, inactiveClone];
      const similar = getSimilarProducts(groundnutOil, testCatalog);
      expect(similar.some((p) => p.id === "prod_inactive_sesame")).toBe(false);
    });

    it("prefers in-stock products over out-of-stock products", () => {
      const outOfStockCandidate: Product = {
        ...mockProducts.find((p) => p.id === "prod_sesame_oil")!,
        id: "prod_oos_sesame",
        options: [
          {
            unit: "L",
            unitSize: "1",
            mrp: 300,
            offerPrice: 250,
            stock: 0,
          },
        ],
      };

      const inStockCandidate: Product = {
        ...mockProducts.find((p) => p.id === "prod_sesame_oil")!,
        id: "prod_in_stock_sesame",
        options: [
          {
            unit: "L",
            unitSize: "1",
            mrp: 300,
            offerPrice: 250,
            stock: 25,
          },
        ],
      };

      const testCatalog = [outOfStockCandidate, inStockCandidate];
      const similar = getSimilarProducts(groundnutOil, testCatalog);
      expect(similar[0]?.id).toBe("prod_in_stock_sesame");
      expect(similar[1]?.id).toBe("prod_oos_sesame");
    });

    it("respects the specified limit", () => {
      const limited = getSimilarProducts(groundnutOil, mockProducts, { limit: 1 });
      expect(limited).toHaveLength(1);
    });
  });

  describe("2. Complementary Products (Complete Your Traditional Kitchen Basket)", () => {
    it("never includes the target product in complementary recommendations", () => {
      for (const prod of mockProducts) {
        const complements = getComplementaryProducts(prod, mockProducts);
        const containsSelf = complements.some((p) => p.id === prod.id);
        expect(containsSelf).toBe(false);
      }
    });

    it("recommends authentic traditional staples for Groundnut Oil", () => {
      const complements = getComplementaryProducts(groundnutOil, mockProducts);

      expect(complements.length).toBeGreaterThan(0);
      const ids = complements.map((p) => p.id);

      // Wood pressed oil pairs with spices (turmeric), dal (toor dal), ghee, and rice
      expect(ids).toContain("prod_organic_turmeric");
      expect(ids).toContain("prod_unpolished_toor_dal");
    });

    it("recommends Country Sugar and Murukku for Kumbakonam Filter Coffee", () => {
      const complements = getComplementaryProducts(filterCoffee, mockProducts);
      const ids = complements.map((p) => p.id);

      expect(ids).toContain("prod_country_sugar");
      expect(ids).toContain("prod_murukku");
    });

    it("excludes products that are already displayed in Similar Products", () => {
      const similar = getSimilarProducts(groundnutOil, mockProducts);
      const similarIds = similar.map((p) => p.id);

      const complements = getComplementaryProducts(groundnutOil, mockProducts, {
        excludeIds: similarIds,
      });

      // No intersection between similar and complementary sets
      for (const item of complements) {
        expect(similarIds).not.toContain(item.id);
      }
    });

    it("falls back to category-level pairing when no specific product pairing exists", () => {
      const customProduct: Product = {
        id: "prod_custom_tea",
        name: "Nilgiri Herbal Tea",
        category: "Beverages",
        categorySlug: "beverages",
        brand: "Nilgiri Organics",
        rating: 4.5,
        reviewCount: 30,
        description: "Fresh aromatic tea.",
        imageUrl: "https://example.com/tea.jpg",
        images: ["https://example.com/tea.jpg"],
        options: [{ unit: "g", unitSize: "250", mrp: 120, offerPrice: 100, stock: 15 }],
        tags: ["Organic", "Herbal"],
        isActive: true,
      };

      const complements = getComplementaryProducts(customProduct, mockProducts);
      expect(complements.length).toBeGreaterThan(0);

      // Complements should belong to categories mapped to beverages (e.g., staples-grains, snacks-sweets)
      const allowedCategories = COMPLEMENTARY_CATEGORY_MAP["beverages"] ?? [];
      const matchesCategory = complements.some((p) => allowedCategories.includes(p.categorySlug));
      expect(matchesCategory).toBe(true);
    });

    it("excludes inactive items from complementary recommendations", () => {
      const inactiveDal: Product = {
        ...mockProducts.find((p) => p.id === "prod_unpolished_toor_dal")!,
        id: "prod_inactive_dal",
        isActive: false,
      };

      const testCatalog = [...mockProducts, inactiveDal];
      const complements = getComplementaryProducts(groundnutOil, testCatalog);
      expect(complements.some((p) => p.id === "prod_inactive_dal")).toBe(false);
    });

    it("respects the specified limit", () => {
      const complements = getComplementaryProducts(groundnutOil, mockProducts, { limit: 2 });
      expect(complements.length).toBeLessThanOrEqual(2);
    });
  });

  describe("3. productService integration", () => {
    it("returns similar products via productService.getSimilarProducts", async () => {
      const similar = await productService.getSimilarProducts("prod_groundnut_oil");
      expect(Array.isArray(similar)).toBe(true);
      expect(similar.length).toBeGreaterThan(0);
      expect(similar.some((p) => p.id === "prod_groundnut_oil")).toBe(false);
    });

    it("returns complementary products via productService.getComplementaryProducts", async () => {
      const complements = await productService.getComplementaryProducts(
        "prod_groundnut_oil",
        4,
        ["prod_sesame_oil", "prod_a2_ghee"]
      );
      expect(Array.isArray(complements)).toBe(true);
      expect(complements.length).toBeGreaterThan(0);
      expect(complements.some((p) => p.id === "prod_sesame_oil")).toBe(false);
      expect(complements.some((p) => p.id === "prod_a2_ghee")).toBe(false);
    });

    it("returns empty arrays for non-existent product ID", async () => {
      const similar = await productService.getSimilarProducts("non_existent_id");
      expect(similar).toEqual([]);

      const complements = await productService.getComplementaryProducts("non_existent_id");
      expect(complements).toEqual([]);
    });
  });

  describe("4. Edge Cases & Helpers", () => {
    it("correctly identifies stock availability", () => {
      expect(hasAvailableStock(groundnutOil)).toBe(true);

      const oosProduct: Product = {
        ...groundnutOil,
        options: [{ unit: "L", unitSize: "1", mrp: 200, offerPrice: 150, stock: 0 }],
      };
      expect(hasAvailableStock(oosProduct)).toBe(false);

      const emptyOptProduct: Product = {
        ...groundnutOil,
        options: [],
      };
      expect(hasAvailableStock(emptyOptProduct)).toBe(false);
    });

    it("handles products with empty tags or extraction gracefully", () => {
      const { extraction: _ignoredExtraction, ...groundnutWithoutExtraction } = groundnutOil;
      const bareProduct: Product = {
        ...groundnutWithoutExtraction,
        id: "prod_bare",
        tags: [],
      };

      const score = calculateSimilarityScore(groundnutOil, bareProduct);
      expect(score).toBeGreaterThan(0); // Still matches category

      const compScore = calculateComplementaryScore(groundnutOil, bareProduct, new Set());
      expect(typeof compScore).toBe("number");
    });
  });
});

