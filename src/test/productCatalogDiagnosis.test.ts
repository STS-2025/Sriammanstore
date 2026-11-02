import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiClient } from "../services/apiClient";
import { productService } from "../services/productService";
import {
  productionTurmericRawFixture,
  productionChickenMasalaRawFixture,
} from "../fixtures/productionProductFixtures";
import {
  filterAndSortProducts,
  INITIAL_FILTER_STATE,
  getCatalogPriceBounds,
} from "../lib/filterUtils";
import type { Product } from "../types";

describe("Diagnosis & Verification: Production Products Catalog Availability", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    apiClient.resetSourceState();
  });

  // ==========================================================================
  // SUITE 1: JSON Server Fallback Merging & Retrieval
  // ==========================================================================
  describe("1. JSON Server Fallback Merging of Production Products", () => {
    it("merges productionProductFixtures into /products response when in json-server mode", async () => {
      const mock12Products = [
        { id: "prod_groundnut_oil", name: "Groundnut Oil", categorySlug: "cold-pressed-oils", options: [{ unit: "L", unitSize: "1", mrp: 299, offerPrice: 245, stock: 50 }] },
        { id: "prod_a2_ghee", name: "A2 Desi Cow Bilona Ghee", categorySlug: "cold-pressed-oils", options: [{ unit: "ml", unitSize: "500", mrp: 750, offerPrice: 620, stock: 35 }] },
      ];

      const mockProdFixtures = [
        productionTurmericRawFixture,
        productionChickenMasalaRawFixture,
      ];

      // Mock global fetch to simulate JSON Server responses on port 3001
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("/products")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => mock12Products,
          });
        }
        if (url.includes("/productionProductFixtures")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => mockProdFixtures,
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ message: "Not found" }),
        });
      });

      apiClient.setMode("json-server");
      const products = await productService.getProducts();

      // Must include both base items and both production-compatible fixtures
      const ids = products.map((p) => p.id);
      expect(ids).toContain("prod_groundnut_oil");
      expect(ids).toContain("prod_a2_ghee");
      expect(ids).toContain("prod-mumqpksq");
      expect(ids).toContain("prod-munn8cp3");

      const turmeric = products.find((p) => p.id === "prod-mumqpksq");
      expect(turmeric?.name).toBe("Sakthi Turmeric Powder");
      expect(turmeric?.categorySlug).toBe("organic-spices");
      expect(turmeric?.rating).toBe(0);
      expect(turmeric?.reviewCount).toBe(0);

      const chicken = products.find((p) => p.id === "prod-munn8cp3");
      expect(chicken?.name).toBe("Sakthi Chicken Masala");
      expect(chicken?.categorySlug).toBe("organic-spices");
      expect(chicken?.rating).toBe(0);
      expect(chicken?.reviewCount).toBe(0);
    });

    it("resolves individual product document by ID through productionProductFixtures fallback on 404", async () => {
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.endsWith("/products/prod-mumqpksq")) {
          // JSON Server base /products table returns 404 for production fixture IDs
          return Promise.resolve({
            ok: false,
            status: 404,
            statusText: "Not Found",
            json: async () => ({ message: "Not found" }),
          });
        }
        if (url.endsWith("/productionProductFixtures/prod-mumqpksq")) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => productionTurmericRawFixture,
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ message: "Not found" }),
        });
      });

      apiClient.setMode("json-server");
      const product = await productService.getProductById("prod-mumqpksq");

      expect(product).not.toBeNull();
      expect(product?.id).toBe("prod-mumqpksq");
      expect(product?.name).toBe("Sakthi Turmeric Powder");
      expect(product?.brand).toBe("Sakthi Masala");
    });
  });

  // ==========================================================================
  // SUITE 2: Shop Route Filtering & Rendering Verification
  // ==========================================================================
  describe("2. Shop Route Filter Compatibility", () => {
    it("ensures default shop filters do not exclude the production products", () => {
      const catalog: Product[] = [
        {
          id: "prod_groundnut_oil",
          name: "Heritage Wood Churned Mara Chekku Groundnut Oil",
          category: "Cold Pressed Oils",
          categorySlug: "cold-pressed-oils",
          brand: "Sri Amman Organics",
          rating: 4.9,
          reviewCount: 1842,
          description: "Wood churned groundnut oil",
          imageUrl: "/placeholders/test.jpg",
          images: ["/placeholders/test.jpg"],
          tags: ["Wood Churned", "Pure Organic"],
          isActive: true,
          options: [{ unit: "L", unitSize: "1", mrp: 299, offerPrice: 245, stock: 50 }],
        },
        {
          id: "prod-mumqpksq",
          name: "Sakthi Turmeric Powder",
          tamilName: "மஞ்சள் தூள்",
          category: "Spices & Masala Powders",
          categorySlug: "organic-spices",
          brand: "Sakthi Masala",
          rating: 0,
          reviewCount: 0,
          description: "Pure turmeric powder",
          imageUrl: "/placeholders/turmeric-powder.svg",
          images: ["/placeholders/turmeric-powder.svg"],
          tags: ["Sakthi", "Turmeric"],
          isActive: true,
          options: [{ unit: "20g Pack", unitSize: "g", mrp: 12, offerPrice: 10, stock: 60 }],
        },
        {
          id: "prod-munn8cp3",
          name: "Sakthi Chicken Masala",
          tamilName: "சிக்கன் மசாலா",
          category: "Masala & Spice Powders",
          categorySlug: "organic-spices",
          brand: "Sakthi Masala",
          rating: 0,
          reviewCount: 0,
          description: "Authentic spice blend",
          imageUrl: "/placeholders/chicken-masala-placeholder.svg",
          images: ["/placeholders/chicken-masala-placeholder.svg"],
          tags: ["Sakthi", "Chicken Masala"],
          isActive: true,
          options: [{ unit: "500g Pack", unitSize: "g", mrp: 15, offerPrice: 12, stock: 40 }],
        },
      ];

      const bounds = getCatalogPriceBounds(catalog);
      expect(bounds.min).toBe(10); // Sakthi Turmeric Powder
      expect(bounds.max).toBe(245); // Groundnut Oil

      // Apply initial filter state as defined in ShopPage
      const filtered = filterAndSortProducts(catalog, INITIAL_FILTER_STATE, bounds);

      expect(filtered).toHaveLength(3);
      const filteredIds = filtered.map((p) => p.id);
      expect(filteredIds).toContain("prod-mumqpksq");
      expect(filteredIds).toContain("prod-munn8cp3");
      expect(filteredIds).toContain("prod_groundnut_oil");
    });

    it("filters production products correctly when Organic Spices category is selected", () => {
      const catalog: Product[] = [
        {
          id: "prod_groundnut_oil",
          name: "Groundnut Oil",
          category: "Cold Pressed Oils",
          categorySlug: "cold-pressed-oils",
          brand: "Sri Amman Organics",
          rating: 4.9,
          reviewCount: 1842,
          description: "Oil",
          imageUrl: "/test.jpg",
          images: ["/test.jpg"],
          tags: [],
          isActive: true,
          options: [{ unit: "L", unitSize: "1", mrp: 299, offerPrice: 245, stock: 50 }],
        },
        {
          id: "prod-mumqpksq",
          name: "Sakthi Turmeric Powder",
          category: "Spices & Masala Powders",
          categorySlug: "organic-spices",
          brand: "Sakthi Masala",
          rating: 0,
          reviewCount: 0,
          description: "Turmeric",
          imageUrl: "/test.jpg",
          images: ["/test.jpg"],
          tags: [],
          isActive: true,
          options: [{ unit: "20g Pack", unitSize: "g", mrp: 12, offerPrice: 10, stock: 60 }],
        },
        {
          id: "prod-munn8cp3",
          name: "Sakthi Chicken Masala",
          category: "Masala & Spice Powders",
          categorySlug: "organic-spices",
          brand: "Sakthi Masala",
          rating: 0,
          reviewCount: 0,
          description: "Chicken Masala",
          imageUrl: "/test.jpg",
          images: ["/test.jpg"],
          tags: [],
          isActive: true,
          options: [{ unit: "500g Pack", unitSize: "g", mrp: 15, offerPrice: 12, stock: 40 }],
        },
      ];

      const spicesOnly = filterAndSortProducts(catalog, {
        ...INITIAL_FILTER_STATE,
        categories: ["organic-spices"],
      });

      expect(spicesOnly).toHaveLength(2);
      expect(spicesOnly.map((p) => p.id)).toEqual([
        "prod-mumqpksq",
        "prod-munn8cp3",
      ]);
    });
  });
});

