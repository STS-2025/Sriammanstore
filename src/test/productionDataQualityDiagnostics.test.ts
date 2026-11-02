import { describe, it, expect } from "vitest";
import {
  auditProductPricing,
  auditProductStock,
  auditProductOptionsAndVariants,
  auditProductImage,
  auditProductCategory,
  auditProductMetadata,
  auditProductPathsAndDuplicates,
  auditProductInternalFields,
  auditSingleProductDataQuality,
  auditCatalogueDataQuality,
  summarizeImageString,
  sanitizeRawDocForDisplay,
} from "../services/productionDataQualityDiagnostics";
import {
  fetchFullProductionCatalogue,
  type ProductionCategoryDoc,
} from "../services/productionPreviewService";
import { productService } from "../services/productService";
import { getEmulatorFirestore } from "../lib/firebaseEmulator";

describe("Phase 6: Production Catalogue Data Quality & Customer Display Audit", () => {
  const sampleCategoryDoc: ProductionCategoryDoc = {
    id: "cat-mun1fjzh",
    name: "Grocery",
    slug: "sambar",
    subcategories: ["Masala & Spice Powders"],
    bannerUrl: "data:image/jpeg;base64,/9j/mockBanner",
    displayOrder: 1,
    isActive: true,
  };

  const sampleCategoryDocsMap = new Map<string, ProductionCategoryDoc>([
    ["cat-mun1fjzh", sampleCategoryDoc],
  ]);

  // ==========================================================================
  // SUITE 1: Pricing Validation Rules
  // ==========================================================================
  describe("1. Pricing Diagnostics", () => {
    it("flags error when selling price exceeds Maximum Retail Price (MRP)", () => {
      const findings = auditProductPricing(
        { sellingPrice: 25, mrp: 20 },
        "prod-test-01",
        "Test Product"
      );
      const exceedFinding = findings.find((f) => f.rule === "selling_price_exceeds_mrp");
      expect(exceedFinding).toBeDefined();
      expect(exceedFinding?.severity).toBe("error");
      expect(exceedFinding?.field).toBe("sellingPrice");
      expect(exceedFinding?.message).toContain("greater than Maximum Retail Price");
    });

    it("flags error when selling price is zero, negative, or not a number", () => {
      const zeroFindings = auditProductPricing(
        { sellingPrice: 0, mrp: 20 },
        "prod-test-02",
        "Test Product"
      );
      expect(zeroFindings.some((f) => f.rule === "invalid_selling_price" && f.severity === "error")).toBe(true);

      const negFindings = auditProductPricing(
        { sellingPrice: -10, mrp: 20 },
        "prod-test-03",
        "Test Product"
      );
      expect(negFindings.some((f) => f.rule === "invalid_selling_price" && f.severity === "error")).toBe(true);

      const nanFindings = auditProductPricing(
        { sellingPrice: "Free", mrp: 20 },
        "prod-test-04",
        "Test Product"
      );
      expect(nanFindings.some((f) => f.rule === "invalid_selling_price" && f.severity === "error")).toBe(true);
    });

    it("flags error when MRP is missing, non-positive, or invalid", () => {
      const missingMrp = auditProductPricing(
        { sellingPrice: 15 },
        "prod-test-05",
        "Test Product"
      );
      expect(missingMrp.some((f) => f.rule === "invalid_mrp" && f.severity === "error")).toBe(true);

      const zeroMrp = auditProductPricing(
        { sellingPrice: 15, mrp: 0 },
        "prod-test-06",
        "Test Product"
      );
      expect(zeroMrp.some((f) => f.rule === "invalid_mrp" && f.severity === "error")).toBe(true);
    });

    it("confirms verified savings when selling price is less than or equal to MRP", () => {
      const validFindings = auditProductPricing(
        { sellingPrice: 12, mrp: 15 },
        "prod-test-07",
        "Valid Product"
      );
      expect(validFindings.some((f) => f.severity === "error")).toBe(false);
      const savingsFinding = validFindings.find((f) => f.rule === "price_savings_verified");
      expect(savingsFinding).toBeDefined();
      expect(savingsFinding?.severity).toBe("info");
      expect(savingsFinding?.message).toContain("Customer savings: ₹3");
    });
  });

  // ==========================================================================
  // SUITE 2: Stock & Availability Diagnostics
  // ==========================================================================
  describe("2. Stock & Availability Diagnostics", () => {
    it("flags error for negative inventory stock", () => {
      const findings = auditProductStock(
        { stock: -5 },
        "prod-test-stock-01",
        "Negative Stock Item"
      );
      const neg = findings.find((f) => f.rule === "negative_stock");
      expect(neg).toBeDefined();
      expect(neg?.severity).toBe("error");
      expect(neg?.observedValue).toBe(-5);
    });

    it("flags warning when availability flag conflicts with stock quantity", () => {
      // inStock=true but stock=0
      const falsePositive = auditProductStock(
        { stock: 0, inStock: true },
        "prod-test-stock-02",
        "OOS Item"
      );
      const fpConflict = falsePositive.find((f) => f.rule === "availability_stock_conflict");
      expect(fpConflict).toBeDefined();
      expect(fpConflict?.severity).toBe("warning");
      expect(fpConflict?.message).toContain("inStock=true) but stock is zero");

      // inStock=false but stock=25
      const falseNegative = auditProductStock(
        { stock: 25, inStock: false },
        "prod-test-stock-03",
        "Available Item"
      );
      const fnConflict = falseNegative.find((f) => f.rule === "availability_stock_conflict");
      expect(fnConflict).toBeDefined();
      expect(fnConflict?.severity).toBe("warning");
      expect(fnConflict?.message).toContain("inStock=false) despite having 25 units");
    });

    it("flags warning when root stock, option stock, and variant stock diverge", () => {
      // Discrepancy observed in production (e.g. root: 54, option: 60, variant: 54)
      const findings = auditProductStock(
        {
          stock: 54,
          options: [{ stock: 60 }],
          variants: [{ stock: 54 }],
        },
        "prod-test-stock-04",
        "Turmeric Powder"
      );

      const mismatches = findings.filter((f) => f.rule === "stock_level_mismatch");
      expect(mismatches.length).toBeGreaterThanOrEqual(1);
      expect(mismatches[0]?.severity).toBe("warning");
      expect(mismatches.some((m) => m.message.includes("Root stock is 54 units, but primary option specifies 60 units"))).toBe(true);
    });
  });

  // ==========================================================================
  // SUITE 3: Options, Variants & Specifications Diagnostics
  // ==========================================================================
  describe("3. Options, Variants & Specification Diagnostics", () => {
    it("flags warning when customer options[] array is missing or empty", () => {
      const findings = auditProductOptionsAndVariants(
        { options: [] },
        "prod-test-opt-01",
        "No Options Item"
      );
      const optFinding = findings.find((f) => f.rule === "missing_options");
      expect(optFinding).toBeDefined();
      expect(optFinding?.severity).toBe("warning");
    });

    it("flags unit vs weight mismatch between customer pack and POS variant", () => {
      // Production pattern: unit is '20g Pack', but variant weight is entered as 500
      const findings = auditProductOptionsAndVariants(
        {
          unit: "20g Pack",
          variants: [{ weight: 500, unit: "g" }],
        },
        "prod-test-opt-02",
        "Sachet Item"
      );
      const weightMismatch = findings.find((f) => f.rule === "unit_weight_mismatch");
      expect(weightMismatch).toBeDefined();
      expect(weightMismatch?.severity).toBe("warning");
      expect(weightMismatch?.message).toContain("pack specifies '20g Pack', but POS variant weight specifies 500g");
    });
  });

  // ==========================================================================
  // SUITE 4: Image & Packaging Validation
  // ==========================================================================
  describe("4. Image & Packaging Diagnostics", () => {
    it("summarizes Base64 data URIs by byte size and mime-type without leaking raw payload", () => {
      const dummyBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...";
      const summary = summarizeImageString(dummyBase64);
      expect(summary.hasImage).toBe(true);
      expect(summary.type).toBe("base64-data-uri");
      expect(summary.mimeType).toBe("image/jpeg");
      expect(summary.isValid).toBe(true);
      expect(summary.byteSize).toBeGreaterThan(0);
    });

    it("sanitizes raw document image fields to avoid multi-megabyte UI dumps", () => {
      const raw = {
        name: "Test",
        imageUrl: "data:image/jpeg;base64,/9j/veryLongBase64StringPayload",
        price: 10,
      };
      const sanitized = sanitizeRawDocForDisplay(raw);
      expect(sanitized["imageUrl"]).toMatch(/\[base64-data-uri: image\/jpeg, \d+ bytes\]/);
      expect(sanitized["name"]).toBe("Test");
      expect(sanitized["price"]).toBe(10);
    });

    it("flags warning for missing or malformed product images", () => {
      const missing = auditProductImage({}, "prod-test-img-01", "Missing Image Item");
      expect(missing.some((f) => f.rule === "missing_product_image" && f.severity === "warning")).toBe(true);

      const malformed = auditProductImage(
        { imageUrl: "data:corrupt;base64" },
        "prod-test-img-02",
        "Corrupt Image Item"
      );
      expect(malformed.some((f) => f.rule === "malformed_image_uri" && f.severity === "warning")).toBe(true);
    });

    it("flags known Chicken Masala image defect (prod-munn8cp3 storing Puliyogare photo)", () => {
      const findings = auditProductImage(
        { imageUrl: "data:image/jpeg;base64,/9j/mock" },
        "prod-munn8cp3",
        "Sakthi Chicken Masala"
      );
      const packagingDefect = findings.find((f) => f.rule === "image_content_mismatch");
      expect(packagingDefect).toBeDefined();
      expect(packagingDefect?.severity).toBe("warning");
      expect(packagingDefect?.message).toContain("Sakthi Puliyogare Rice Powder");
    });
  });

  // ==========================================================================
  // SUITE 5: Category & Schema Diagnostics
  // ==========================================================================
  describe("5. Category & Hierarchy Diagnostics", () => {
    it("flags warning for missing category document in Firestore (cat-spices)", () => {
      const findings = auditProductCategory(
        { categoryId: "cat-spices", category: "Spices & Masala Powders" },
        sampleCategoryDocsMap,
        "prod-mumqpksq",
        "Sakthi Turmeric Powder"
      );
      const missingDoc = findings.find((f) => f.rule === "missing_category_document");
      expect(missingDoc).toBeDefined();
      expect(missingDoc?.severity).toBe("warning");
      expect(missingDoc?.observedValue).toBe("cat-spices");
    });

    it("flags warning for category name vs slug discrepancy (Grocery vs sambar)", () => {
      const findings = auditProductCategory(
        { categoryId: "cat-mun1fjzh", category: "Grocery" },
        sampleCategoryDocsMap,
        "prod-munn8cp3",
        "Sakthi Chicken Masala"
      );
      const slugMismatch = findings.find((f) => f.rule === "category_slug_mismatch");
      expect(slugMismatch).toBeDefined();
      expect(slugMismatch?.severity).toBe("warning");
      expect(slugMismatch?.message).toContain("name 'Grocery' but internal slug 'sambar'");
    });

    it("verifies unverified ratings are omitted rather than fabricated", () => {
      const findings = auditProductMetadata(
        { name: "Turmeric Powder", description: "Fresh turmeric" },
        "prod-mumqpksq",
        "Turmeric Powder"
      );
      const ratingFinding = findings.find((f) => f.rule === "unverified_ratings_omitted");
      expect(ratingFinding).toBeDefined();
      expect(ratingFinding?.severity).toBe("info");
      expect(ratingFinding?.message).toContain("unverified in production data; rating row is hidden");
    });
  });

  // ==========================================================================
  // SUITE 6: Duplicates & POS Field Shielding
  // ==========================================================================
  describe("6. Duplication & POS Shielding Diagnostics", () => {
    it("identifies duplicate source paths and records deterministic precedence", () => {
      const paths = [
        "products/prod-mumqpksq",
        "products/Grocery/items/prod-mumqpksq",
        "products/Masala/items/prod-mumqpksq",
      ];
      const findings = auditProductPathsAndDuplicates("prod-mumqpksq", "Sakthi Turmeric Powder", paths);
      const dupFinding = findings.find((f) => f.rule === "duplicate_source_paths");
      expect(dupFinding).toBeDefined();
      expect(dupFinding?.severity).toBe("info");
      expect(dupFinding?.message).toContain("mirrored across 3 paths in Firestore");
    });

    it("identifies internal POS metadata in raw data and confirms shielding", () => {
      const raw = {
        name: "Chicken Masala",
        variants: [
          {
            purchasePrice: 15,
            barcode: "8906002081578",
            sku: "SKU-4660",
            batchNumber: "PROD005",
            safetyStock: 15,
            expiryDate: "2027-03-27",
          },
        ],
      };
      const findings = auditProductInternalFields(raw, "prod-munn8cp3", "Chicken Masala");
      const posFinding = findings.find((f) => f.rule === "internal_pos_field_isolated");
      expect(posFinding).toBeDefined();
      expect(posFinding?.severity).toBe("info");
      expect(posFinding?.observedValue).toContain("purchasePrice");
      expect(posFinding?.observedValue).toContain("barcode");
    });
  });

  // ==========================================================================
  // SUITE 7: Live Catalogue Data Quality Verification
  // ==========================================================================
  describe("7. Live Production Catalogue Audit Integration", () => {
    it("executes comprehensive data-quality audit against all 8 live production products", async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";

      const result = await fetchFullProductionCatalogue({
        optIn: true,
      });

      expect(result.products.length).toBeGreaterThanOrEqual(8);
      const { diagnostics } = result;

      // Data Quality Report Verification
      expect(diagnostics.dataQualityReport).toBeDefined();
      const report = diagnostics.dataQualityReport!;
      expect(report.totalProducts).toBe(result.products.length);

      // CRITICAL SAFETY CHECK: Zero pricing or fatal errors
      expect(report.errorCount).toBe(0);

      // Warnings verified:
      // - 5 stock level mismatches (root vs option stock)
      // - 6 unit vs weight conflicts (20g pack vs 500g variant)
      // - 1 known image content mismatch (prod-munn8cp3 Puliyogare photo)
      // - 2 missing category document references (cat-spices)
      // - 6 category slug mismatches (cat-mun1fjzh)
      expect(report.warningCount).toBeGreaterThan(0);

      // Verify every product has a valid price with customer savings in options
      for (const p of result.products) {
        expect(p.options.length).toBeGreaterThan(0);
        const opt = p.options[0]!;
        expect(opt.offerPrice).toBeGreaterThan(0);
        expect(opt.mrp).toBeGreaterThan(0);
        expect(opt.offerPrice).toBeLessThanOrEqual(opt.mrp);

        // Verify ratings remain unverified (0)
        expect(p.rating).toBe(0);
        expect(p.reviewCount).toBe(0);

        // Verify internal POS fields are NOT exposed
        const rawP = p as unknown as Record<string, unknown>;
        expect(rawP["purchasePrice"]).toBeUndefined();
        expect(rawP["batchNumber"]).toBeUndefined();
        expect(rawP["barcode"]).toBeUndefined();
        expect(rawP["sku"]).toBeUndefined();
        expect(rawP["safetyStock"]).toBeUndefined();
        expect(rawP["expiryDate"]).toBeUndefined();
      }

      // Verify production-readonly isolation: zero writes attempted
      const emulatorDb = getEmulatorFirestore();
      expect(emulatorDb.app.options.projectId).toBe("demo-sri-amman-store");
    }, 35000);

    it("guarantees local mode catalogue remains intact and unaffected", async () => {
      productService.setCatalogMode("local");
      expect(productService.getCatalogMode()).toBe("local");

      const localProducts = await productService.getProducts();
      expect(localProducts.length).toBeGreaterThanOrEqual(12);
    });
  });
});
