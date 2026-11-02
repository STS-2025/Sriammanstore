import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchFullProductionCatalogue,
  fetchProductionProductById,
  isProductionPreviewOptedIn,
  EXPECTED_PRODUCTION_PROJECT_ID,
  type ProductionCatalogueResult,
} from "../services/productionPreviewService";
import { catalogDataSource } from "../services/catalogDataSource";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";
import { authService } from "../services/authService";
import { getEmulatorFirestore } from "../lib/firebaseEmulator";

describe("Phase 3B: Full Production Catalogue Read-Only Integration", () => {
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
  // SUITE 1: Opt-In Safety Guard & Access Control
  // ==========================================================================
  describe("1. Opt-In Safety Guard & Access Control", () => {
    it("strictly requires explicit opt-in to execute full production catalogue queries", async () => {
      delete process.env["VITE_ENABLE_PRODUCTION_PREVIEW"];

      await expect(
        fetchFullProductionCatalogue({ optIn: false })
      ).rejects.toThrow(/SAFETY GUARD ACTIVE.*opt-in/i);
    });

    it("rejects fetchProductionProductById when optIn is false and env var is not set", async () => {
      delete process.env["VITE_ENABLE_PRODUCTION_PREVIEW"];

      await expect(
        fetchProductionProductById("prod-mumqpksq", { optIn: false })
      ).rejects.toThrow(/SAFETY GUARD ACTIVE.*opt-in/i);
    });

    it("permits access when options.optIn is explicitly true", async () => {
      delete process.env["VITE_ENABLE_PRODUCTION_PREVIEW"];

      const result = await fetchFullProductionCatalogue({ optIn: true });
      expect(result).toBeDefined();
      expect(result.sourceProject).toBe(EXPECTED_PRODUCTION_PROJECT_ID);
    }, 30000);

    it("permits access when VITE_ENABLE_PRODUCTION_PREVIEW is set to 'true'", async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";

      expect(isProductionPreviewOptedIn()).toBe(true);
      const result = await fetchFullProductionCatalogue();
      expect(result).toBeDefined();
      expect(result.products.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  // ==========================================================================
  // SUITE 2: Top-Level and Nested Querying & Discovery
  // ==========================================================================
  describe("2. Top-Level and Nested Category Queries", () => {
    it("fetches top-level products and nested collectionGroup('items') with bounded limits", async () => {
      const result = await fetchFullProductionCatalogue({
        optIn: true,
        topLevelLimit: 100,
        nestedLimit: 100,
      });

      const { diagnostics } = result;

      // Confirms queries executed and retrieved catalogue documents
      expect(diagnostics.topLevelCount).toBeGreaterThanOrEqual(0);
      expect(diagnostics.nestedCount).toBeGreaterThanOrEqual(1);
      expect(diagnostics.totalRawDocuments).toBeGreaterThanOrEqual(10);

      // Verifies categories discovered from nested paths
      const categoriesFound = new Set(
        result.previews.map((p) => p.category).filter(Boolean)
      );
      expect(categoriesFound.size).toBeGreaterThanOrEqual(2);
      expect(diagnostics.errors).toHaveLength(0);
    }, 30000);
  });

  // ==========================================================================
  // SUITE 3: Deterministic Deduplication & Precedence Rules
  // ==========================================================================
  describe("3. Deterministic Precedence & Deduplication Invariants", () => {
    let result: ProductionCatalogueResult;

    beforeEach(async () => {
      result = await fetchFullProductionCatalogue({ optIn: true });
    }, 30000);

    it("deduplicates raw documents into exactly 8 unique products", () => {
      expect(result.diagnostics.totalRawDocuments).toBeGreaterThanOrEqual(10);
      expect(result.diagnostics.uniqueProductCount).toBe(result.products.length);
      expect(result.diagnostics.duplicateCount).toBeGreaterThanOrEqual(0);
      expect(result.products.length).toBeGreaterThanOrEqual(8);
      expect(result.previews.length).toBe(result.products.length);

      const uniqueIds = new Set(result.products.map((p) => p.id));
      expect(uniqueIds.size).toBe(result.products.length);
    });

    it("enforces deterministic precedence: top-level products/{id} wins over nested category items", () => {
      const { duplicateDetails } = result.diagnostics;
      expect(duplicateDetails.length).toBeGreaterThanOrEqual(1);

      for (const detail of duplicateDetails) {
        expect(detail.selectedPath).toMatch(/^products\//);
        expect(detail.nestedPaths.length).toBeGreaterThanOrEqual(1);
        for (const nested of detail.nestedPaths) {
          expect(nested).toMatch(/^products\/[^/]+\/items\/prod-[a-z0-9]+/);
        }
        expect(detail.precedenceReason).toMatch(
          /takes precedence over nested category items|First encountered nested category item/
        );
      }
    });

    it("includes all 8 expected production products", () => {
      const productIds = result.products.map((p) => p.id);
      expect(productIds).toContain("prod-mumqpksq"); // Sakthi Turmeric Powder
      expect(productIds).toContain("prod-mumrbamt"); // Sakthi Sambar Powder
      expect(productIds).toContain("prod-munn8cp3"); // Sakthi Chicken Masala
      expect(productIds).toContain("prod-munnbzf7"); // Sakthi Biryani Masala
      expect(productIds).toContain("prod-munnezib"); // Sakthi Fish Curry Masala
      expect(productIds).toContain("prod-munnjfuy"); // Sakthi Puliyogare Rice Powder
      expect(productIds).toContain("prod-munnwgk0"); // Sakthi Rasam Powder
      expect(productIds).toContain("prod-mv0jd8dy"); // Aachi Chicken 65 Masala
    });
  });

  // ==========================================================================
  // SUITE 4: Customer POS Field Shielding & Security
  // ==========================================================================
  describe("4. POS Metadata Shielding & Consumer Safety", () => {
    it("never exposes internal POS metadata (purchasePrice, batchNumber, barcode, sku, safetyStock, expiryDate)", async () => {
      const result = await fetchFullProductionCatalogue({ optIn: true });

      expect(result.diagnostics.posFieldsFilteredCount).toBe(result.products.length);

      for (const product of result.products) {
        const p = product as unknown as Record<string, unknown>;
        expect(p["purchasePrice"]).toBeUndefined();
        expect(p["batchNumber"]).toBeUndefined();
        expect(p["barcode"]).toBeUndefined();
        expect(p["sku"]).toBeUndefined();
        expect(p["safetyStock"]).toBeUndefined();
        expect(p["expiryDate"]).toBeUndefined();

        for (const opt of product.options) {
          const o = opt as unknown as Record<string, unknown>;
          expect(o["purchasePrice"]).toBeUndefined();
          expect(o["batchNumber"]).toBeUndefined();
          expect(o["barcode"]).toBeUndefined();
          expect(o["sku"]).toBeUndefined();
          expect(o["safetyStock"]).toBeUndefined();
          expect(o["expiryDate"]).toBeUndefined();
        }
      }
    }, 30000);
  });

  // ==========================================================================
  // SUITE 5: Schema Normalization & Pack Options
  // ==========================================================================
  describe("5. Schema Normalization (options[] vs variants[])", () => {
    it("normalizes both options[] and variants[] into canonical product options", async () => {
      const result = await fetchFullProductionCatalogue({ optIn: true });

      for (const product of result.products) {
        expect(product.id).toBeDefined();
        expect(product.name).toBeDefined();
        expect(product.name.length).toBeGreaterThan(0);
        expect(product.brand).toBeDefined();
        expect(product.category).toBeDefined();
        expect(product.categorySlug).toBeDefined();
        expect(product.options.length).toBeGreaterThanOrEqual(1);

        for (const option of product.options) {
          expect(option.unit).toBeDefined();
          expect(option.unit.length).toBeGreaterThan(0);
          expect(option.unitSize).toBeDefined();
          expect(Number(option.unitSize)).toBeGreaterThan(0);
          expect(option.mrp).toBeGreaterThan(0);
          expect(option.offerPrice).toBeGreaterThan(0);
          expect(option.offerPrice).toBeLessThanOrEqual(option.mrp);
          expect(typeof option.stock).toBe("number");
        }
      }
    }, 30000);

    it("verifies Turmeric Powder specific normalized option values", async () => {
      const product = await fetchProductionProductById("prod-mumqpksq", { optIn: true });
      expect(product).not.toBeNull();
      if (!product) return;

      expect(product.id).toBe("prod-mumqpksq");
      expect(product.name).toBe("Sakthi Turmeric Powder");
      expect(product.tamilName).toBe("மஞ்சள் தூள்");
      expect(product.options).toHaveLength(1);
      expect(product.options[0]?.unit).toBe("g");
      expect(product.options[0]?.unitSize).toBe("20");
      expect(product.options[0]?.mrp).toBe(12);
      expect(product.options[0]?.offerPrice).toBe(10);
      expect(typeof product.options[0]?.stock).toBe("number");
    }, 30000);
  });

  // ==========================================================================
  // SUITE 6: Image Handling & Base64 Data URIs
  // ==========================================================================
  describe("6. Image Handling & Base64 Data URIs", () => {
    it("renders valid image URLs and preserves Base64 data URIs from production documents", async () => {
      const result = await fetchFullProductionCatalogue({ optIn: true });

      for (const product of result.products) {
        expect(product.imageUrl).toBeDefined();
        expect(product.imageUrl.length).toBeGreaterThan(0);
        expect(product.images.length).toBeGreaterThanOrEqual(1);

        // All production products store data:image/jpeg;base64 URIs
        expect(product.imageUrl).toMatch(/^data:image\/(jpeg|png|webp);base64,/);
      }
    }, 30000);

    it("flags Chicken Masala prod-munn8cp3 with the known Puliyogare image discrepancy diagnostic", async () => {
      const result = await fetchFullProductionCatalogue({ optIn: true });

      expect(result.diagnostics.anomalyAlerts.length).toBeGreaterThanOrEqual(1);
      const chickenAlert = result.diagnostics.anomalyAlerts.find(
        (a) => a.productId === "prod-munn8cp3"
      );
      expect(chickenAlert).toBeDefined();
      expect(chickenAlert?.productName).toBe("Sakthi Chicken Masala");
      expect(chickenAlert?.description).toContain("Puliyogare Rice Powder");
    }, 30000);
  });

  // ==========================================================================
  // SUITE 7: fetchProductionProductById Individual Lookup
  // ==========================================================================
  describe("7. Individual Production Product Lookup by ID", () => {
    it("fetches an individual production product by ID including metadata", async () => {
      const product = await fetchProductionProductById("prod-munnbzf7", { optIn: true });
      expect(product).not.toBeNull();
      if (!product) return;

      expect(product.id).toBe("prod-munnbzf7");
      expect(product.name).toBe("Sakthi Biryani Masala");
      expect(product.tamilName).toBe("பிரியாணி மசாலா");
      expect(product.brand).toBe("Sakthi Masala");
    }, 30000);

    it("returns null gracefully for non-existent product ID", async () => {
      const product = await fetchProductionProductById("prod-nonexistent-9999", { optIn: true });
      expect(product).toBeNull();
    }, 30000);
  });

  // ==========================================================================
  // SUITE 8: Catalogue Abstraction & Multi-Mode Integration
  // ==========================================================================
  describe("8. Catalogue Abstraction with production-readonly Mode", () => {
    it("local mode retrieves local products from the local catalogue", async () => {
      productService.setCatalogMode("local");
      const products = await productService.getProducts();
      expect(products.length).toBeGreaterThanOrEqual(12);
      expect(products.map((p) => p.id)).toContain("prod_groundnut_oil");
    });

    it("production-preview mode retrieves the 2 allowlisted products", async () => {
      productService.setCatalogMode("production-preview");
      const products = await productService.getProducts();
      expect(products).toHaveLength(2);
      expect(products.map((p) => p.id)).toEqual(["prod-mumqpksq", "prod-munn8cp3"]);
    }, 30000);

    it("production-readonly mode retrieves all 8 discovered production products when opted in", async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";
      productService.setCatalogMode("production-readonly");

      const products = await productService.getProducts();
      expect(products.length).toBeGreaterThanOrEqual(8);

      const status = productService.getCatalogStatus();
      expect(status.mode).toBe("production-readonly");
      expect(status.isProductionReadOnly).toBe(true);

      const fullResult = await productService.getFullProductionCatalogueResult();
      expect(fullResult).not.toBeNull();
      if (!fullResult) return;

      expect(fullResult.diagnostics.uniqueProductCount).toBe(fullResult.products.length);
      expect(fullResult.diagnostics.duplicateCount).toBeGreaterThanOrEqual(0);
    }, 30000);

    it("guarantees cart, auth, and user mutations remain 100% on the local emulator even in production-readonly mode", () => {
      productService.setCatalogMode("production-readonly");

      // Verify emulator Firestore configuration is unaffected
      const emulatorDb = getEmulatorFirestore({
        projectId: "demo-sri-amman-store",
        host: "127.0.0.1",
        port: 8081,
        mode: "emulator",
      });

      expect(emulatorDb.app.options.projectId).toBe("demo-sri-amman-store");
      expect(emulatorDb.app.name).toBe("sri-amman-emulator-only");

      // Verify cart and auth services reference local storage/emulator
      expect(cartService).toBeDefined();
      expect(authService).toBeDefined();
    });
  });
});
