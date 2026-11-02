import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  APPROVED_PRODUCTION_PRODUCT_IDS,
  EXPECTED_PRODUCTION_PROJECT_ID,
  EXPECTED_PRODUCTION_PROJECT_NUMBER,
  EXPECTED_PRODUCTION_AUTH_DOMAIN,
  PRODUCTION_SDK_APP_NAME,
  isApprovedProductionProductPath,
  isApprovedProductionDocumentPath,
  assertApprovedProductionPath,
  getProductionFirebaseConfig,
  validateProductionPreviewConfig,
  unmarshalFirestoreRestValue,
  unmarshalFirestoreRestFields,
  auditProductionProductFields,
  isProductionPreviewOptedIn,
  fetchProductionProductPreview,
  fetchAllProductionProductPreviews,
  type ProductionFirebaseConfig,
} from "../services/productionPreviewService";
import { getEmulatorFirestore } from "../lib/firebaseEmulator";

describe("Isolated Production Product Visual Preview & Path Security", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ==========================================================================
  // SUITE 1: Approved Document Path Allowlist Enforcement
  // ==========================================================================
  describe("1. Strict Path Allowlist Invariants", () => {
    it("permits only the two explicitly allowlisted product document paths", () => {
      expect(APPROVED_PRODUCTION_PRODUCT_IDS).toHaveLength(2);
      expect(APPROVED_PRODUCTION_PRODUCT_IDS).toEqual(["prod-mumqpksq", "prod-munn8cp3"]);

      expect(isApprovedProductionProductPath("products", "prod-mumqpksq")).toBe(true);
      expect(isApprovedProductionProductPath("products", "prod-munn8cp3")).toBe(true);
    });

    it("strictly denies non-approved product IDs in the products collection", () => {
      expect(isApprovedProductionProductPath("products", "prod_groundnut_oil")).toBe(false);
      expect(isApprovedProductionProductPath("products", "prod_gingelly_oil")).toBe(false);
      expect(isApprovedProductionProductPath("products", "prod-random-999")).toBe(false);
      expect(isApprovedProductionProductPath("products", "")).toBe(false);
      expect(isApprovedProductionProductPath("products", "   ")).toBe(false);
      expect(isApprovedProductionProductPath("products", "null")).toBe(false);
      expect(isApprovedProductionProductPath("products", "undefined")).toBe(false);
    });

    it("strictly denies all non-product collections (customer, orders, cart, auth, private business)", () => {
      // Customer profile collections
      expect(isApprovedProductionProductPath("users", "SASS9999901")).toBe(false);
      expect(isApprovedProductionProductPath("users", "SASS0000001")).toBe(false);
      expect(isApprovedProductionProductPath("customers", "CUS-001")).toBe(false);

      // Auth linking collection
      expect(isApprovedProductionProductPath("usersByUid", "HBbNTuCtczLLbBCvsww58NEqXRz2")).toBe(false);

      // Orders and financial records
      expect(isApprovedProductionProductPath("orders", "ORD-0000028")).toBe(false);
      expect(isApprovedProductionProductPath("coinHistory", "tx-001")).toBe(false);
      expect(isApprovedProductionProductPath("customerLedger", "ledger-001")).toBe(false);

      // Cart and addresses
      expect(isApprovedProductionProductPath("cart", "cart-item-1")).toBe(false);
      expect(isApprovedProductionProductPath("addresses", "addr-001")).toBe(false);

      // Admin metadata and sequences
      expect(isApprovedProductionProductPath("meta", "orderSequence")).toBe(false);
      expect(isApprovedProductionProductPath("settings", "delivery")).toBe(false);
      expect(isApprovedProductionProductPath("categories", "organic-spices")).toBe(false);
    });

    it("prevents path traversal and malformed inputs", () => {
      expect(isApprovedProductionProductPath("products", "../users/SASS001")).toBe(false);
      expect(isApprovedProductionProductPath("products", "../../orders/ORD-001")).toBe(false);
      expect(isApprovedProductionProductPath("", "prod-mumqpksq")).toBe(false);
      expect(isApprovedProductionProductPath("products/items", "prod-mumqpksq")).toBe(false);
    });
  });

  // ==========================================================================
  // SUITE 2: Execution-Level Security Rejection
  // ==========================================================================
  describe("2. Execution-Level Path Security Guard", () => {
    it("immediately throws a SECURITY ERROR when attempting to read an unapproved product ID", async () => {
      await expect(
        fetchProductionProductPreview("unapproved-product-id")
      ).rejects.toThrow(/SECURITY ERROR: Path "products\/unapproved-product-id" is not allowlisted/i);
    });

    it("immediately throws a SECURITY ERROR when attempting path traversal", async () => {
      await expect(
        fetchProductionProductPreview("../users/SASS9999901")
      ).rejects.toThrow(/SECURITY ERROR: Path "products\/..\/users\/SASS9999901" is not allowlisted/i);
    });

    it("immediately throws a SECURITY ERROR on empty document ID", async () => {
      await expect(fetchProductionProductPreview("")).rejects.toThrow(
        /SECURITY ERROR: Path "products\/" is not allowlisted/i
      );
    });
  });

  // ==========================================================================
  // SUITE 3: Target Project Invariant Validation
  // ==========================================================================
  describe("3. Target Project Invariant Validation", () => {
    it("validates the production Firebase configuration against expected invariants", () => {
      const config = getProductionFirebaseConfig();
      expect(config.projectId).toBe(EXPECTED_PRODUCTION_PROJECT_ID);
      expect(config.authDomain).toBe(EXPECTED_PRODUCTION_AUTH_DOMAIN);
      expect(config.messagingSenderId).toBe(EXPECTED_PRODUCTION_PROJECT_NUMBER);

      const validation = validateProductionPreviewConfig(config);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("rejects connecting to the local emulator project ID (demo-sri-amman-store)", () => {
      const badConfig: ProductionFirebaseConfig = {
        projectId: "demo-sri-amman-store",
        authDomain: EXPECTED_PRODUCTION_AUTH_DOMAIN,
        messagingSenderId: EXPECTED_PRODUCTION_PROJECT_NUMBER,
        apiKey: "fake-key-1234567890",
      };

      const result = validateProductionPreviewConfig(badConfig);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Project ID mismatch/i);
    });

    it("rejects unauthorized rogue project IDs", () => {
      const badConfig: ProductionFirebaseConfig = {
        projectId: "rogue-malicious-project",
        authDomain: EXPECTED_PRODUCTION_AUTH_DOMAIN,
        messagingSenderId: EXPECTED_PRODUCTION_PROJECT_NUMBER,
        apiKey: "fake-key-1234567890",
      };

      const result = validateProductionPreviewConfig(badConfig);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toMatch(/Project ID mismatch/i);
    });
  });

  // ==========================================================================
  // SUITE 4: Write Immunity & Zero Mutation Methods
  // ==========================================================================
  describe("4. Write Immunity Verification", () => {
    it("confirms that productionPreviewService exports zero write, update, delete, or create methods", async () => {
      const previewModule = await import("../services/productionPreviewService");
      const exportedKeys = Object.keys(previewModule);

      const writeKeywords = [
        "write",
        "set",
        "update",
        "delete",
        "create",
        "remove",
        "patch",
        "put",
        "post",
        "mutate",
      ];

      const suspiciousKeys = exportedKeys.filter((key) => {
        const lower = key.toLowerCase();
        return writeKeywords.some((w) => lower.includes(w) && !lower.includes("validate"));
      });

      expect(suspiciousKeys).toHaveLength(0);
    });
  });

  // ==========================================================================
  // SUITE 5: Live Production Product Retrieval & UI Schema Normalization
  // ==========================================================================
  describe("5. Live Approved Product Retrieval & Normalization", () => {
    it(
      "fetches and normalizes prod-mumqpksq (Sakthi Turmeric Powder) into full UI Product schema",
      async () => {
        const preview = await fetchProductionProductPreview("prod-mumqpksq");

        expect(preview.docId).toBe("prod-mumqpksq");
        expect(["products/prod-mumqpksq", "products/Grocery/items/prod-mumqpksq"]).toContain(preview.docPath);
        expect(preview.rawFieldCount).toBeGreaterThanOrEqual(40);
        expect(preview.source).toBe("production-firestore-rest");

        const { product, raw } = preview;

        // UI Product Contract Verification
        expect(product.id).toBe("prod-mumqpksq");
        expect(product.name).toBe("Sakthi Turmeric Powder");
        expect(product.tamilName).toBe("மஞ்சள் தூள்");
        expect(product.brand).toBe("Sakthi Masala");
        expect(["Spices & Masala Powders", "Masala & Spice Powders"]).toContain(product.category);
        expect(product.categorySlug).toBe("organic-spices");
        expect(product.isActive).toBe(true);
        expect(product.rating).toBe(0);
        expect(product.reviewCount).toBe(0);

        // Options normalization (20g Pack -> unit: "g", unitSize: "20")
        expect(product.options).toHaveLength(1);
        expect(product.options[0]?.unit).toBe("g");
        expect(product.options[0]?.unitSize).toBe("20");
        expect(product.options[0]?.mrp).toBe(12);
        expect(product.options[0]?.offerPrice).toBe(10);
        expect(typeof product.options[0]?.stock).toBe("number");

        // Real image verification
        expect(product.images.length).toBe(2);
        expect(product.imageUrl).toMatch(/^data:image\/jpeg;base64,/);

        // Raw document preservation
        expect(typeof raw["gstRate"]).toBe("number");
        expect(raw["hsnCode"]).toBe("09103030");
      },
      30000
    );

    it(
      "fetches and normalizes prod-munn8cp3 (Sakthi Chicken Masala) into full UI Product schema",
      async () => {
        const preview = await fetchProductionProductPreview("prod-munn8cp3");

        expect(preview.docId).toBe("prod-munn8cp3");
        expect(["products/prod-munn8cp3", "products/Grocery/items/prod-munn8cp3"]).toContain(preview.docPath);
        expect(preview.rawFieldCount).toBeGreaterThanOrEqual(40);
        expect(preview.source).toBe("production-firestore-rest");

        const { product, raw } = preview;

        // UI Product Contract Verification
        expect(product.id).toBe("prod-munn8cp3");
        expect(product.name).toBe("Sakthi Chicken Masala");
        expect(product.tamilName).toBe("சிக்கன் மசாலா");
        expect(product.brand).toBe("Sakthi Masala");
        expect(product.category).toBe("Masala & Spice Powders");
        expect(product.categorySlug).toBe("organic-spices");
        expect(product.isActive).toBe(true);

        // Options normalization (20g or 500g Pack updated by business admin in Phase 7.1)
        expect(product.options).toHaveLength(1);
        expect(product.options[0]?.unit).toBe("g");
        expect(product.options[0]?.mrp).toBe(15);
        expect(product.options[0]?.offerPrice).toBe(12);
        expect(typeof product.options[0]?.stock).toBe("number");
        expect(["20", "500"]).toContain(product.options[0]?.unitSize);

        // Real image verification
        expect(product.images.length).toBe(2);
        expect(product.imageUrl).toMatch(/^data:image\/jpeg;base64,/);

        // Raw document preservation
        expect(raw["fssaiLicense"]).toBe("10012042000871");
        expect(raw["ingredients"]).toContain("Coriander");
      },
      30000
    );

    it(
      "fetchAllProductionProductPreviews fetches exactly both approved products",
      async () => {
        const allPreviews = await fetchAllProductionProductPreviews();

        expect(allPreviews).toHaveLength(2);
        const docIds = allPreviews.map((p) => p.docId);
        expect(docIds).toContain("prod-mumqpksq");
        expect(docIds).toContain("prod-munn8cp3");
      },
      30000
    );
  });

  // ==========================================================================
  // SUITE 6: Normal App Runtime Isolation Verification
  // ==========================================================================
  describe("6. Normal App Runtime Isolation Verification", () => {
    it("confirms that the normal app emulator firestore remains pointed to demo-sri-amman-store", () => {
      // The normal app uses getEmulatorFirestore()
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
  // SUITE 7: Nested Document Path Allowlist & Query Invariants
  // ==========================================================================
  describe("7. Nested Document Path Allowlist & Query Invariants", () => {
    it("permits approved top-level and nested product document paths", () => {
      // Top-level
      expect(isApprovedProductionDocumentPath("products/prod-mumqpksq")).toBe(true);
      expect(isApprovedProductionDocumentPath("products/prod-munn8cp3")).toBe(true);

      // Nested items under category
      expect(
        isApprovedProductionDocumentPath("products/organic-spices/items/prod-mumqpksq")
      ).toBe(true);
      expect(
        isApprovedProductionDocumentPath("products/Spices & Masala Powders/items/prod-munn8cp3")
      ).toBe(true);
    });

    it("rejects unapproved nested product IDs", () => {
      expect(
        isApprovedProductionDocumentPath("products/organic-spices/items/prod-unapproved")
      ).toBe(false);
      expect(
        isApprovedProductionDocumentPath("products/grocery/items/prod-999")
      ).toBe(false);
    });

    it("strictly rejects path traversal, root collections, and collection-group queries", () => {
      expect(
        isApprovedProductionDocumentPath("products/organic-spices/items/../../users/SASS001")
      ).toBe(false);
      expect(isApprovedProductionDocumentPath("items")).toBe(false);
      expect(isApprovedProductionDocumentPath("items/prod-mumqpksq")).toBe(false);
      expect(isApprovedProductionDocumentPath("users/SASS001/orders/ORD001")).toBe(false);
      expect(isApprovedProductionDocumentPath("users/SASS001/cart/cart1")).toBe(false);
    });

    it("assertApprovedProductionPath throws security error on unapproved path", () => {
      expect(() =>
        assertApprovedProductionPath("products/unapproved-id")
      ).toThrow(/SECURITY ERROR: Path "products\/unapproved-id" is not allowlisted/i);
    });
  });

  // ==========================================================================
  // SUITE 8: Explicit Opt-In Guard Verification
  // ==========================================================================
  describe("8. Explicit Opt-In Guard Verification", () => {
    it("permits preview when explicitly opted in via option", () => {
      expect(isProductionPreviewOptedIn({ optIn: true })).toBe(true);
    });

    it("rejects preview when opt-in is false in non-development environment", async () => {
      const savedNodeEnv = process.env["NODE_ENV"];
      try {
        process.env["NODE_ENV"] = "production";
        delete process.env["ALLOW_PRODUCTION_READONLY_DIAGNOSTIC"];
        delete process.env["VITE_ENABLE_PROD_PREVIEW"];

        expect(isProductionPreviewOptedIn({ optIn: false })).toBe(false);

        await expect(
          fetchProductionProductPreview("prod-mumqpksq", { optIn: false })
        ).rejects.toThrow(/SAFETY GUARD ACTIVE: Production catalogue preview is strictly opt-in/i);
      } finally {
        process.env["NODE_ENV"] = savedNodeEnv;
      }
    });
  });

  // ==========================================================================
  // SUITE 9: Diagnostic Field Audit & Internal POS Metadata Filtering
  // ==========================================================================
  describe("9. Diagnostic Field Audit & Internal POS Metadata Filtering", () => {
    it("audits category separation and detects missing fields on Turmeric Powder", () => {
      const mockRawDoc: Record<string, unknown> = {
        name: "Sakthi Turmeric Powder",
        tamilName: "மஞ்சள் தூள்",
        brandName: "Sakthi Masala",
        category: "Spices & Masala Powders",
        subCategory: "Whole Spices",
        description: "Pure turmeric",
        fssaiLicense: "",
        benefits: "",
        usage: "",
        videoUrl: "",
        ingredients: "VERIFY",
        unit: "20g Pack",
        weight: 500,
        barcode: "8906002080106",
        sku: "SKU-4908",
        batchNumber: "PROD001",
        expiryDate: "2026-10-01",
        purchasePrice: 10,
        safetyStock: 15,
      };

      const audit = auditProductionProductFields(mockRawDoc, "prod-mumqpksq");

      // Category and subcategory separated
      expect(audit.category).toBe("Spices & Masala Powders");
      expect(audit.subCategory).toBe("Whole Spices");
      expect(audit.categorySlug).toBe("organic-spices");

      // Missing fields detected
      expect(audit.missingFields).toContain("fssaiLicense (empty string)");
      expect(audit.missingFields).toContain("benefits (empty)");
      expect(audit.missingFields).toContain("usage (empty)");
      expect(audit.missingFields).toContain("videoUrl (empty)");

      // Malformed fields detected
      expect(audit.malformedFields).toContain("ingredients ('VERIFY' placeholder value)");
      expect(audit.malformedFields).toContain(
        "unit vs weight conflict: unit specifies '20g Pack' while weight specifies 500"
      );

      // Internal POS metadata filtered
      expect(audit.internalPosFieldsFiltered).toEqual(
        expect.arrayContaining([
          "barcode",
          "sku",
          "batchNumber",
          "expiryDate",
          "purchasePrice",
          "safetyStock",
        ])
      );
    });

    it("audits Chicken Masala and flags the Puliyogare photo anomaly", () => {
      const mockRawDoc: Record<string, unknown> = {
        name: "Sakthi Chicken Masala",
        tamilName: "சிக்கன் மசாலா",
        brandName: "Sakthi Masala",
        categoryName: "Grocery",
        subCategory: "Masala & Spice Powders",
        description: "Chicken masala",
        fssaiLicense: "10012042000871",
        ingredients: "Coriander, Chilli",
      };

      const audit = auditProductionProductFields(mockRawDoc, "prod-munn8cp3");

      expect(audit.category).toBe("Grocery");
      expect(audit.subCategory).toBe("Masala & Spice Powders");
      expect(audit.categorySlug).toBe("organic-spices");

      // Flags Puliyogare image anomaly
      expect(audit.anomalies).toHaveLength(1);
      expect(audit.anomalies[0]).toMatch(/Sakthi Puliyogare Rice Powder/i);
    });
  });

  // ==========================================================================
  // SUITE 10: Isolated Firebase SDK App Instance Verification
  // ==========================================================================
  describe("10. Isolated Firebase SDK App Instance Verification", () => {
    it("confirms the SDK preview app uses a dedicated isolated app name distinct from the emulator", () => {
      expect(PRODUCTION_SDK_APP_NAME).toBe("sri-amman-prod-preview-isolated");
      expect(PRODUCTION_SDK_APP_NAME).not.toBe("sri-amman-emulator-only");
      expect(PRODUCTION_SDK_APP_NAME).not.toBe("[DEFAULT]");
    });
  });
});


