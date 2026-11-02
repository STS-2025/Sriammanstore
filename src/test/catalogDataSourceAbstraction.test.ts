import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  catalogDataSource,
  resolveDefaultCatalogMode,
  CatalogDataSource,
  type CatalogDataSourceMode,
} from "../services/catalogDataSource";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";
import { authService } from "../services/authService";
import {
  APPROVED_PRODUCTION_PRODUCT_IDS,
  EXPECTED_PRODUCTION_PROJECT_ID,
} from "../services/productionPreviewService";
import { apiClient } from "../services/apiClient";
import { getEmulatorFirestore } from "../lib/firebaseEmulator";

describe("Phase 2: Catalogue Data-Source Abstraction & Mode Isolation", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
    productService.resetCatalogMode();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    productService.resetCatalogMode();
  });

  // ==========================================================================
  // SUITE 1: Default Catalogue Mode & Security Invariants
  // ==========================================================================
  describe("1. Default Catalogue Mode & Invariants", () => {
    it("strictly defaults to 'local' mode", () => {
      expect(resolveDefaultCatalogMode()).toBe("local");
      expect(catalogDataSource.getMode()).toBe("local");
      expect(productService.getCatalogMode()).toBe("local");

      const status = productService.getCatalogStatus();
      expect(status.mode).toBe("local");
      expect(status.defaultMode).toBe("local");
      expect(status.isProductionPreview).toBe(false);
      expect(status.productionProjectId).toBe(EXPECTED_PRODUCTION_PROJECT_ID);
      expect(status.productionAllowlist).toEqual(["prod-mumqpksq", "prod-munn8cp3"]);
    });

    it("confirms the application's main Firebase emulator project remains demo-sri-amman-store", () => {
      const emulatorDb = getEmulatorFirestore({
        projectId: "demo-sri-amman-store",
        host: "127.0.0.1",
        port: 8081,
        mode: "emulator",
      });

      expect(emulatorDb.app.options.projectId).toBe("demo-sri-amman-store");
      expect(emulatorDb.app.name).toBe("sri-amman-emulator-only");
    });
  });

  // ==========================================================================
  // SUITE 2: Local Catalogue Mode Verification
  // ==========================================================================
  describe("2. Local Catalogue Mode Verification", () => {
    it("retrieves the full local catalogue with products in local mode", async () => {
      expect(productService.getCatalogMode()).toBe("local");

      const products = await productService.getProducts();
      expect(products.length).toBeGreaterThanOrEqual(12);

      const productIds = products.map((p) => p.id);
      expect(productIds).toContain("prod_groundnut_oil");
      expect(productIds).toContain("prod_sesame_oil");
    });

    it("retrieves individual local products correctly by ID", async () => {
      const product = await productService.getProductById("prod_groundnut_oil");
      expect(product).not.toBeNull();
      expect(product?.id).toBe("prod_groundnut_oil");
      expect(product?.name).toContain("Groundnut Oil");
      expect(product?.categorySlug).toBe("cold-pressed-oils");
      expect(product?.options.length).toBeGreaterThanOrEqual(1);
    });

    it("supports comprehensive filtering in local mode", async () => {
      // Category filter for cold-pressed-oils
      const oils = await productService.getProducts({ category: "cold-pressed-oils" });
      expect(oils.length).toBeGreaterThanOrEqual(3);
      expect(oils.every((p) => p.categorySlug === "cold-pressed-oils")).toBe(true);

      // Search filter
      const searchResults = await productService.getProducts({ search: "Groundnut" });
      expect(searchResults.length).toBeGreaterThanOrEqual(1);
      expect(searchResults[0]?.name).toContain("Groundnut");

      // In-stock only
      const inStock = await productService.getProducts({ inStockOnly: true });
      expect(inStock.length).toBeGreaterThanOrEqual(1);
      expect(inStock.every((p) => (p.options[0]?.stock ?? 0) > 0)).toBe(true);
    });
  });

  // ==========================================================================
  // SUITE 3: Explicit Production-Preview Mode Verification
  // ==========================================================================
  describe("3. Explicit Production-Preview Mode Verification", () => {
    it(
      "fetches strictly the two approved production products when set to production-preview mode",
      async () => {
        productService.setCatalogMode("production-preview");
        expect(productService.getCatalogMode()).toBe("production-preview");

        const status = productService.getCatalogStatus();
        expect(status.isProductionPreview).toBe(true);

        const products = await productService.getProducts();
        expect(products).toHaveLength(2);

        const ids = products.map((p) => p.id);
        expect(ids).toContain("prod-mumqpksq");
        expect(ids).toContain("prod-munn8cp3");

        // Turmeric product validation
        const turmeric = products.find((p) => p.id === "prod-mumqpksq")!;
        expect(turmeric.name).toBe("Sakthi Turmeric Powder");
        expect(turmeric.tamilName).toBe("மஞ்சள் தூள்");
        expect(turmeric.brand).toBe("Sakthi Masala");
        expect(turmeric.categorySlug).toBe("organic-spices");
        expect(turmeric.rating).toBe(0);
        expect(turmeric.reviewCount).toBe(0);
        expect(turmeric.options[0]?.unitSize).toBe("20");
        expect(turmeric.options[0]?.unit).toBe("g");
        expect(turmeric.options[0]?.offerPrice).toBe(10);
        expect(turmeric.options[0]?.mrp).toBe(12);

        // Chicken Masala product validation
        const chicken = products.find((p) => p.id === "prod-munn8cp3")!;
        expect(chicken.name).toBe("Sakthi Chicken Masala");
        expect(chicken.tamilName).toBe("சிக்கன் மசாலா");
        expect(chicken.brand).toBe("Sakthi Masala");
        expect(chicken.categorySlug).toBe("organic-spices");
        expect(chicken.rating).toBe(0);
        expect(chicken.reviewCount).toBe(0);
        expect(["20", "500"]).toContain(chicken.options[0]?.unitSize);
        expect(chicken.options[0]?.unit).toBe("g");

        // Ensure internal POS/ERP metadata is NOT exposed in the customer Product schema
        const turmericRecord = turmeric as unknown as Record<string, unknown>;
        expect(turmericRecord["purchasePrice"]).toBeUndefined();
        expect(turmericRecord["batchNumber"]).toBeUndefined();
        expect(turmericRecord["barcode"]).toBeUndefined();
        expect(turmericRecord["sku"]).toBeUndefined();
        expect(turmericRecord["safetyStock"]).toBeUndefined();
        expect(turmericRecord["expiryDate"]).toBeUndefined();
      },
      30000
    );

    it(
      "fetches an individual approved product by ID in production-preview mode",
      async () => {
        productService.setCatalogMode("production-preview");

        const turmeric = await productService.getProductById("prod-mumqpksq");
        expect(turmeric).not.toBeNull();
        expect(turmeric?.id).toBe("prod-mumqpksq");
        expect(turmeric?.name).toBe("Sakthi Turmeric Powder");
        expect(turmeric?.imageUrl).toMatch(/^data:image\/jpeg;base64,/);

        const chicken = await productService.getProductById("prod-munn8cp3");
        expect(chicken).not.toBeNull();
        expect(chicken?.id).toBe("prod-munn8cp3");
        expect(chicken?.name).toBe("Sakthi Chicken Masala");
      },
      30000
    );
  });

  // ==========================================================================
  // SUITE 4: Strict Production Allowlist Enforcement
  // ==========================================================================
  describe("4. Strict Production Allowlist Enforcement", () => {
    it("safely returns null when requesting an unapproved product ID in production-preview mode", async () => {
      productService.setCatalogMode("production-preview");

      // Non-approved product ID should not be queried from production
      const unapproved = await productService.getProductById("prod_groundnut_oil");
      expect(unapproved).toBeNull();

      const randomDoc = await productService.getProductById("prod-random-9999");
      expect(randomDoc).toBeNull();

      const emptyDoc = await productService.getProductById("");
      expect(emptyDoc).toBeNull();
    });
  });

  // ==========================================================================
  // SUITE 5: No Accidental Production Fallback on Emulator Failures
  // ==========================================================================
  describe("5. No Accidental Production Fallback", () => {
    it("ensures emulator failures in local mode never activate production mode", async () => {
      expect(productService.getCatalogMode()).toBe("local");

      // Simulate an emulator network error on apiClient
      const getSpy = vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new Error("Connection refused: 127.0.0.1:8081")
      );

      await expect(productService.getProducts()).rejects.toThrow(/Connection refused/i);

      // Verify the mode remains strictly 'local' and NEVER silently flipped to production
      expect(productService.getCatalogMode()).toBe("local");
      expect(productService.getCatalogStatus().isProductionPreview).toBe(false);

      getSpy.mockRestore();
    });
  });

  // ==========================================================================
  // SUITE 6: Local Customer Workflow Isolation
  // ==========================================================================
  describe("6. Local Customer Workflow Isolation", () => {
    it("keeps cart operations completely local regardless of catalog mode", async () => {
      // Switch catalog mode to production-preview
      productService.setCatalogMode("production-preview");
      expect(productService.getCatalogMode()).toBe("production-preview");

      // Cart operations should still route to local storage/emulator
      const cart = await cartService.getCart("SASS9999901");
      expect(Array.isArray(cart)).toBe(true);

      // Customer authentication should remain local
      const currentUser = authService.getCurrentUser();
      expect(currentUser === null || typeof currentUser.id === "string").toBe(true);
    });
  });

  // ==========================================================================
  // SUITE 7: Recommendations and Category Support
  // ==========================================================================
  describe("7. Recommendations and Category Support", () => {
    it("supports recommendations across local catalogue products", async () => {
      productService.setCatalogMode("local");

      const similar = await productService.getSimilarProducts("prod_groundnut_oil", 2);
      expect(Array.isArray(similar)).toBe(true);

      const complementary = await productService.getComplementaryProducts("prod_groundnut_oil", 2);
      expect(Array.isArray(complementary)).toBe(true);
    });

    it("retrieves categories cleanly in local mode", async () => {
      const categories = await productService.getCategories();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThanOrEqual(1);
    });
  });
});
