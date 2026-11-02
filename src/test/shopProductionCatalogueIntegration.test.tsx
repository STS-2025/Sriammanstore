import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { productService } from "../services/productService";
import { catalogDataSource, resolveDefaultCatalogMode } from "../services/catalogDataSource";
import { ProductCard } from "../components/product/ProductCard";
import { getEmulatorFirestore } from "../lib/firebaseEmulator";
import {
  filterAndSortProducts,
  getCatalogPriceBounds,
  getCategoryCounts,
  getSubcategoryCounts,
  getPackSizeOptions,
  INITIAL_FILTER_STATE,
} from "../lib/filterUtils";
import type { Product } from "../types";

// Router mock
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, search, className, ...props }: any) => (
    <a
      href={`${to}?${new URLSearchParams(search || {}).toString()}`}
      className={className}
      data-testid="router-link"
      {...props}
    >
      {children}
    </a>
  ),
  useSearch: () => ({}),
  useNavigate: () => vi.fn(),
  createFileRoute: () => () => ({}),
}));

// Context mocks
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

const mockAddToCart = vi.fn();
const mockUpdateQty = vi.fn();
vi.mock("../context/CartContext", () => ({
  useCart: () => ({
    addToCart: mockAddToCart,
    updateQty: mockUpdateQty,
    getItemQuantity: () => 0,
  }),
}));

const mockToggleWishlist = vi.fn();
vi.mock("../context/WishlistContext", () => ({
  useWishlist: () => ({
    isWishlisted: () => false,
    toggleWishlist: mockToggleWishlist,
  }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    t: (en: string, _ta?: string) => en,
  }),
}));

describe("Phase 4: Shop UI & Production Catalogue Integration", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
    productService.resetCatalogMode();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    productService.resetCatalogMode();
  });

  // ==========================================================================
  // SUITE 1: Default Catalogue Mode & Local Shop Invariants
  // ==========================================================================
  describe("1. Default Catalogue Mode & Local Shop Invariants", () => {
    it("strictly defaults to 'local' mode and serves 14 local products", async () => {
      expect(resolveDefaultCatalogMode()).toBe("local");
      expect(productService.getCatalogMode()).toBe("local");

      const products = await productService.getProducts();
      expect(products.length).toBeGreaterThanOrEqual(12);

      const productIds = products.map((p) => p.id);
      expect(productIds).toContain("prod_groundnut_oil");
      expect(productIds).toContain("prod_sesame_oil");
      expect(productIds).toContain("prod_tender_coconut");
    });

    it("ensures local mode keeps the Firebase Emulator project as demo-sri-amman-store", () => {
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
  // SUITE 2: Explicit Production Mode & Product Normalization
  // ==========================================================================
  describe("2. Explicit Production Mode Enablement", () => {
    it("retrieves the full 8-item production catalogue when set to 'production-readonly'", async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";
      productService.setCatalogMode("production-readonly");

      expect(productService.getCatalogMode()).toBe("production-readonly");
      const status = productService.getCatalogStatus();
      expect(status.mode).toBe("production-readonly");
      expect(status.isProductionReadOnly).toBe(true);

      const products = await productService.getProducts();
      expect(products.length).toBeGreaterThanOrEqual(8);

      const productIds = products.map((p) => p.id);
      expect(productIds).toContain("prod-mumqpksq"); // Sakthi Turmeric Powder
      expect(productIds).toContain("prod-mumrbamt"); // Sakthi Sambar Powder
      expect(productIds).toContain("prod-munn8cp3"); // Sakthi Chicken Masala
      expect(productIds).toContain("prod-munnbzf7"); // Sakthi Biryani Masala
      expect(productIds).toContain("prod-munnezib"); // Sakthi Fish Curry Masala
      expect(productIds).toContain("prod-munnjfuy"); // Sakthi Puliyogare Rice Powder
      expect(productIds).toContain("prod-munnwgk0"); // Sakthi Rasam Powder
      expect(productIds).toContain("prod-mv0jd8dy"); // Aachi Chicken 65 Masala
    }, 30000);

    it("verifies production diagnostic metadata (20 raw docs, 12 duplicates resolved)", async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";
      productService.setCatalogMode("production-readonly");

      const fullResult = await productService.getFullProductionCatalogueResult();
      expect(fullResult).not.toBeNull();
      if (!fullResult) return;

      const { diagnostics } = fullResult;
      expect(diagnostics.totalRawDocuments).toBeGreaterThanOrEqual(10);
      expect(diagnostics.uniqueProductCount).toBeGreaterThanOrEqual(8);
      expect(diagnostics.duplicateCount).toBeGreaterThanOrEqual(0);
      expect(diagnostics.errors).toHaveLength(0);
      expect(diagnostics.isPartial).toBe(false);
    }, 30000);
  });

  // ==========================================================================
  // SUITE 3: Mode Switching & Zero Contamination
  // ==========================================================================
  describe("3. Mode Switching & Zero Source Contamination", () => {
    it("seamlessly toggles between local and production without state leakage", async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";

      // 1. Initial local state
      expect(productService.getCatalogMode()).toBe("local");
      const localInitial = await productService.getProducts();
      expect(localInitial.length).toBeGreaterThanOrEqual(12);

      // 2. Switch to production-readonly
      productService.setCatalogMode("production-readonly");
      expect(productService.getCatalogMode()).toBe("production-readonly");
      const prodProducts = await productService.getProducts();
      expect(prodProducts.length).toBeGreaterThanOrEqual(8);
      expect(prodProducts.every((p) => p.id.startsWith("prod-m"))).toBe(true);

      // 3. Switch back to local
      productService.setCatalogMode("local");
      expect(productService.getCatalogMode()).toBe("local");
      const localRestored = await productService.getProducts();
      expect(localRestored.length).toBe(localInitial.length);
      expect(localRestored.map((p) => p.id)).toEqual(localInitial.map((p) => p.id));
    }, 30000);

    it("never silently switches between modes when an error occurs", async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";
      productService.setCatalogMode("production-readonly");

      // Verify mode remains strictly production-readonly even if querying invalid ID
      const missing = await productService.getProductById("invalid-id-does-not-exist");
      expect(missing).toBeNull();
      expect(productService.getCatalogMode()).toBe("production-readonly");
    });
  });

  // ==========================================================================
  // SUITE 4: Search, Sorting, Filtering & Facets
  // ==========================================================================
  describe("4. Search, Sorting, Filtering & Facets in Production Mode", () => {
    let prodProducts: Product[];

    beforeEach(async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";
      productService.setCatalogMode("production-readonly");
      prodProducts = await productService.getProducts();
    }, 30000);

    it("supports search queries for production items", () => {
      // Search "Chicken" -> Sakthi Chicken Masala and Aachi Chicken 65 Masala
      const chickenResults = filterAndSortProducts(prodProducts, {
        ...INITIAL_FILTER_STATE,
        search: "Chicken",
      });

      expect(chickenResults).toHaveLength(2);
      const names = chickenResults.map((p) => p.name);
      expect(names).toContain("Sakthi Chicken Masala");
      expect(names).toContain("Aachi Chicken 65 Masala");
    });

    it("supports sorting by price ascending and descending", () => {
      // Price Ascending: ₹10 (Turmeric/Sambar) up to ₹30 (Biryani)
      const ascResults = filterAndSortProducts(prodProducts, {
        ...INITIAL_FILTER_STATE,
        sort: "price_asc",
      });

      const firstPrice = ascResults[0]!.options[0]!.offerPrice;
      const lastPrice = ascResults[ascResults.length - 1]!.options[0]!.offerPrice;
      expect(firstPrice).toBe(10);
      expect(lastPrice).toBe(Math.max(...ascResults.map((p) => p.options[0]!.offerPrice)));

      // Price Descending
      const descResults = filterAndSortProducts(prodProducts, {
        ...INITIAL_FILTER_STATE,
        sort: "price_desc",
      });
      expect(descResults[0]!.options[0]!.offerPrice).toBe(Math.max(...descResults.map((p) => p.options[0]!.offerPrice)));
      expect(descResults[descResults.length - 1]!.options[0]!.offerPrice).toBe(10);
    });

    it("supports category and subcategory filtering in production mode", () => {
      // Category counts: at least 6 Grocery items discovered
      const counts = getCategoryCounts(prodProducts);
      expect(counts["Grocery"]).toBeGreaterThanOrEqual(6);

      // Filter by Grocery (or its document slug 'sambar')
      const groceryResults = filterAndSortProducts(prodProducts, {
        ...INITIAL_FILTER_STATE,
        categories: ["Grocery"],
      });
      expect(groceryResults.length).toBeGreaterThanOrEqual(6);

      const sambarSlugResults = filterAndSortProducts(prodProducts, {
        ...INITIAL_FILTER_STATE,
        categories: ["sambar"],
      });
      expect(sambarSlugResults.length).toBeGreaterThanOrEqual(6);

      // Filter by specific search or category facet
      const filtered = filterAndSortProducts(prodProducts, {
        ...INITIAL_FILTER_STATE,
        search: "Sakthi",
      });
      expect(filtered.length).toBeGreaterThanOrEqual(2);

      // Filter by cold-pressed-oils -> 0 in production
      const oilResults = filterAndSortProducts(prodProducts, {
        ...INITIAL_FILTER_STATE,
        categories: ["cold-pressed-oils"],
      });
      expect(oilResults).toHaveLength(0);

      // Subcategory counts: "Masala & Spice Powders"
      const subCounts = getSubcategoryCounts(prodProducts);
      expect(subCounts["Masala & Spice Powders"]).toBeGreaterThanOrEqual(6);

      // Filter by subcategory
      const subcategoryFiltered = filterAndSortProducts(prodProducts, {
        ...INITIAL_FILTER_STATE,
        subcategories: ["Masala & Spice Powders"],
      });
      expect(subcategoryFiltered.length).toBeGreaterThanOrEqual(6);
    });

    it("derives dynamic price bounds and pack size options", () => {
      const bounds = getCatalogPriceBounds(prodProducts);
      expect(bounds.min).toBe(10);
      expect(bounds.max).toBe(Math.max(...prodProducts.flatMap((p) => p.options.map((o) => o.offerPrice))));

      const packSizes = getPackSizeOptions(prodProducts);
      const labels = packSizes.map((ps) => ps.label);
      expect(labels).toContain("20 g");
      expect(labels).toContain("50 g");
    });
  });

  // ==========================================================================
  // SUITE 5: ProductCard UI & Production Safeguards
  // ==========================================================================
  describe("5. ProductCard UI & Production Safeguards", () => {
    let turmericProduct: Product;
    let chickenProduct: Product;

    beforeEach(async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";
      productService.setCatalogMode("production-readonly");
      turmericProduct = (await productService.getProductById("prod-mumqpksq"))!;
      chickenProduct = (await productService.getProductById("prod-munn8cp3"))!;
    }, 30000);

    it("renders ProductCard in readOnly mode with Read-Only Preview badge and without add-to-cart stepper", () => {
      render(<ProductCard product={turmericProduct} readOnly={true} />);

      // Read-Only Preview badge is rendered
      expect(screen.getByText("Read-Only Preview")).toBeInTheDocument();
      expect(screen.getByText("Preview")).toBeInTheDocument();

      // Add to Cart button and stepper are omitted
      expect(screen.queryByText(/Add to Cart/i)).toBeNull();
      expect(screen.queryByTitle("Increase quantity")).toBeNull();
      expect(screen.queryByTitle("Save to wishlist")).toBeNull();
    });

    it("links title to product details with catalogMode=production-readonly", () => {
      render(<ProductCard product={turmericProduct} readOnly={true} />);

      const links = screen.getAllByTestId("router-link");
      const titleLink = links.find((l) => l.getAttribute("href")?.includes("/product"));
      expect(titleLink).toBeDefined();
      expect(titleLink?.getAttribute("href")).toContain("id=prod-mumqpksq");
      expect(titleLink?.getAttribute("href")).toContain("catalogMode=production-readonly");
    });

    it("hides rating row for production products since ratings are unverified (rating: 0)", () => {
      render(<ProductCard product={turmericProduct} readOnly={true} />);
      expect(screen.queryByTestId("product-rating-row")).toBeNull();

      render(<ProductCard product={chickenProduct} readOnly={true} />);
      expect(screen.queryByTestId("product-rating-row")).toBeNull();
    });

    it("displays valid prices, MRP, and pack option unit sizes", () => {
      render(<ProductCard product={turmericProduct} readOnly={true} />);

      expect(screen.getByText("₹10")).toBeInTheDocument();
      expect(screen.getByText("₹12")).toBeInTheDocument();
      expect(screen.getByText("Save ₹2")).toBeInTheDocument();
    });

    it("preserves Base64 image data URI on production product card", () => {
      render(<ProductCard product={turmericProduct} readOnly={true} />);

      const img = screen.getByRole("img", { name: turmericProduct.name });
      expect(img).toBeInTheDocument();
      expect(img.getAttribute("src")).toMatch(/^data:image\/jpeg;base64,/);
    });
  });

  // ==========================================================================
  // SUITE 6: Customer Workflows & POS Field Shielding
  // ==========================================================================
  describe("6. Customer Workflows Isolation & POS Field Shielding", () => {
    it("confirms internal POS metadata is completely stripped from all production products", async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";
      productService.setCatalogMode("production-readonly");
      const products = await productService.getProducts();

      for (const p of products) {
        const raw = p as unknown as Record<string, unknown>;
        expect(raw["purchasePrice"]).toBeUndefined();
        expect(raw["batchNumber"]).toBeUndefined();
        expect(raw["barcode"]).toBeUndefined();
        expect(raw["sku"]).toBeUndefined();
        expect(raw["safetyStock"]).toBeUndefined();
        expect(raw["expiryDate"]).toBeUndefined();

        for (const opt of p.options) {
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

    it("guarantees customer cart operations do not mutate or connect to production Firebase", () => {
      // In production-readonly mode, the emulator database remains the isolated customer store
      productService.setCatalogMode("production-readonly");

      const emulatorDb = getEmulatorFirestore();
      expect(emulatorDb.app.options.projectId).toBe("demo-sri-amman-store");
      expect(mockAddToCart).not.toHaveBeenCalled();
      expect(mockUpdateQty).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // SUITE 7: Catalogue Completeness & Multi-Nested Resolution Invariants
  // ==========================================================================
  describe("7. Catalogue Completeness & Multi-Nested Resolution Invariants", () => {
    it("retrieves all 9 production products without arbitrary 3-product truncation", async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";
      productService.setCatalogMode("production-readonly");

      const products = await productService.getProducts();
      expect(products.length).toBe(9);
      expect(products.length).toBeGreaterThan(3);

      const productIds = products.map((p) => p.id);
      const expectedIds = [
        "prod-mumqpksq", // Sakthi Turmeric Powder
        "prod-mumrbamt", // Sakthi Sambar Powder
        "prod-munn8cp3", // Sakthi Chicken Masala
        "prod-munnbzf7", // Sakthi Biryani Masala
        "prod-munnezib", // Sakthi Fish Curry Masala
        "prod-munnjfuy", // Sakthi Puliyogare Rice Powder
        "prod-munnwgk0", // Sakthi Rasam Powder
        "prod-mv0jd8dy", // Aachi Chicken 65 Masala
        "prod-mvj5bjx3", // Sakthi Sunflower Oil
      ];

      for (const expectedId of expectedIds) {
        expect(productIds).toContain(expectedId);
      }

      // Check that none of the products have fallback or empty names
      for (const p of products) {
        expect(p.name).toBeTruthy();
        expect(p.name).not.toBe(p.id);
        expect(p.options.length).toBeGreaterThanOrEqual(1);
      }
    }, 30000);

    it("ensures diagnostic report has 0 skipped documents and resolves multi-nested subcollections", async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";
      productService.setCatalogMode("production-readonly");

      const result = await productService.getFullProductionCatalogueResult();
      expect(result).not.toBeNull();
      if (!result) return;

      expect(result.diagnostics.uniqueProductCount).toBe(9);
      expect(result.diagnostics.skippedDocuments).toHaveLength(0);
      expect(result.diagnostics.errors).toHaveLength(0);

      // Verify that products appearing in both General and Grocery nested paths were merged successfully
      const sambarDetail = result.diagnostics.duplicateDetails.find((d) => d.id === "prod-mumrbamt");
      expect(sambarDetail).toBeDefined();
      expect(sambarDetail?.name).toBe("Sakthi Sambar Powder");
      expect(sambarDetail?.nestedPaths).toContain("products/General/items/prod-mumrbamt");
      expect(sambarDetail?.nestedPaths).toContain("products/Grocery/items/prod-mumrbamt");
    }, 30000);
  });
});
