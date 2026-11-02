import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  EXPECTED_PRODUCTION_PROJECT_ID,
  EXPECTED_PRODUCTION_PROJECT_NUMBER,
  EXPECTED_PRODUCTION_AUTH_DOMAIN,
  APPROVED_PRODUCT_DOC_IDS,
  DEFAULT_PRODUCT_DOC_ID,
  maskSecret,
  isApprovedReadOnlyProductPath,
  validateProductionConfig,
  resolveProductionFirebaseConfig,
  runProductionConnectivityDiagnostic,
  readProductDocViaRest,
  readProductDocViaSdk,
  unmarshalFirestoreRestValue,
  unmarshalFirestoreRestFields,
  fetchAndNormalizeProductionProduct,
  type ProductionFirebaseConfig,
} from "../../scripts/verify-production-connectivity.mjs";

describe("Production Connectivity Diagnostic Guardrails & Verification", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ==========================================================================
  // SUITE 1: Opt-In Safety Guard
  // ==========================================================================
  describe("1. Opt-In Safety Guard", () => {
    it("fails safely when confirmProductionReadOnly flag is missing", async () => {
      delete process.env["ALLOW_PRODUCTION_READONLY_DIAGNOSTIC"];

      await expect(
        runProductionConnectivityDiagnostic({ confirmProductionReadOnly: false })
      ).rejects.toThrow(/SAFETY GUARD ACTIVE: Production connectivity diagnostic is strictly opt-in/i);
    });

    it("respects ALLOW_PRODUCTION_READONLY_DIAGNOSTIC=true environment variable", () => {
      process.env["ALLOW_PRODUCTION_READONLY_DIAGNOSTIC"] = "true";
      // Configuration validation will happen after opt-in check passes
      const config = resolveProductionFirebaseConfig();
      expect(config.projectId).toBe(EXPECTED_PRODUCTION_PROJECT_ID);
    });
  });

  // ==========================================================================
  // SUITE 2: Project ID & Configuration Validation
  // ==========================================================================
  describe("2. Project ID & Configuration Validation", () => {
    it("enforces that the target project ID must strictly be sri-amman-smart-store", () => {
      const validConfig: ProductionFirebaseConfig = {
        projectId: EXPECTED_PRODUCTION_PROJECT_ID,
        authDomain: EXPECTED_PRODUCTION_AUTH_DOMAIN,
        messagingSenderId: EXPECTED_PRODUCTION_PROJECT_NUMBER,
        storageBucket: "sri-amman-smart-store.firebasestorage.app",
        appId: "1:1018585256480:web:1312d2d636b0672098a245",
        apiKey: "AIzaSyFakeKeyForTesting1234567890",
      };

      const validResult = validateProductionConfig(validConfig);
      expect(validResult.valid).toBe(true);
      expect(validResult.errors).toHaveLength(0);

      // Rejects demo emulator project
      const demoResult = validateProductionConfig({
        ...validConfig,
        projectId: "demo-sri-amman-store",
      });
      expect(demoResult.valid).toBe(false);
      expect(demoResult.errors[0]).toMatch(/Project ID mismatch/i);

      // Rejects rogue or arbitrary project
      const rogueResult = validateProductionConfig({
        ...validConfig,
        projectId: "rogue-project-id",
      });
      expect(rogueResult.valid).toBe(false);
      expect(rogueResult.errors[0]).toMatch(/Project ID mismatch/i);
    });

    it("validates auth domain and project number invariants", () => {
      const validConfig: ProductionFirebaseConfig = {
        projectId: EXPECTED_PRODUCTION_PROJECT_ID,
        authDomain: EXPECTED_PRODUCTION_AUTH_DOMAIN,
        messagingSenderId: EXPECTED_PRODUCTION_PROJECT_NUMBER,
        storageBucket: "sri-amman-smart-store.firebasestorage.app",
        appId: "1:1018585256480:web:1312d2d636b0672098a245",
        apiKey: "AIzaSyFakeKeyForTesting1234567890",
      };

      const badDomain = validateProductionConfig({
        ...validConfig,
        authDomain: "malicious.domain.com",
      });
      expect(badDomain.valid).toBe(false);
      expect(badDomain.errors[0]).toMatch(/Auth domain mismatch/i);

      const badSender = validateProductionConfig({
        ...validConfig,
        messagingSenderId: "999999999999",
      });
      expect(badSender.valid).toBe(false);
      expect(badSender.errors[0]).toMatch(/Project number mismatch/i);
    });

    it("rejects empty or missing API keys", () => {
      const badKey = validateProductionConfig({
        projectId: EXPECTED_PRODUCTION_PROJECT_ID,
        authDomain: EXPECTED_PRODUCTION_AUTH_DOMAIN,
        messagingSenderId: EXPECTED_PRODUCTION_PROJECT_NUMBER,
        storageBucket: "sri-amman-smart-store.firebasestorage.app",
        appId: "1:1018585256480:web:1312d2d636b0672098a245",
        apiKey: "   ",
      });
      expect(badKey.valid).toBe(false);
      expect(badKey.errors[0]).toMatch(/Missing Firebase Web API key/i);
    });
  });

  // ==========================================================================
  // SUITE 3: Credential Masking Safety
  // ==========================================================================
  describe("3. Credential Masking Safety", () => {
    it("masks secrets and API keys so raw credentials never appear in logs", () => {
      const sampleKey = "AIzaSyDTzovF1RChmczvRXTNtY9-i-cOTI2JAuQ";
      const masked = maskSecret(sampleKey);

      expect(masked).toBe("AIzaSy...[REDACTED-39chars]");
      expect(masked).not.toContain(sampleKey);
      expect(masked).not.toContain("cOTI2JAuQ");
    });

    it("safely handles null, undefined, or empty values", () => {
      expect(maskSecret(null)).toBe("[NOT_SET]");
      expect(maskSecret(undefined)).toBe("[NOT_SET]");
      expect(maskSecret("")).toBe("[NOT_SET]");
      expect(maskSecret("short")).toBe("[REDACTED]");
    });
  });

  // ==========================================================================
  // SUITE 4: Narrowly Scoped Path Validation & Customer Data Isolation
  // ==========================================================================
  describe("4. Path Scope Guard & Customer Isolation", () => {
    it("allows only approved non-sensitive product documents", () => {
      for (const approvedDocId of APPROVED_PRODUCT_DOC_IDS) {
        expect(isApprovedReadOnlyProductPath("products", approvedDocId)).toBe(true);
      }
    });

    it("strictly denies customer, order, profile, and auth collections", () => {
      expect(isApprovedReadOnlyProductPath("users", "SASS0000001")).toBe(false);
      expect(isApprovedReadOnlyProductPath("usersByUid", "HBbNTuCtczLLbBCvsww58NEqXRz2")).toBe(false);
      expect(isApprovedReadOnlyProductPath("orders", "ORD-0000028")).toBe(false);
      expect(isApprovedReadOnlyProductPath("customers", "CUS-000001")).toBe(false);
      expect(isApprovedReadOnlyProductPath("customerLedger", "tx-001")).toBe(false);
      expect(isApprovedReadOnlyProductPath("cart", "item-001")).toBe(false);
      expect(isApprovedReadOnlyProductPath("addresses", "addr-001")).toBe(false);
      expect(isApprovedReadOnlyProductPath("meta", "userSequence")).toBe(false);
      expect(isApprovedReadOnlyProductPath("meta", "orderSequence")).toBe(false);
    });

    it("rejects non-approved product IDs in read methods", async () => {
      const config = resolveProductionFirebaseConfig();

      await expect(
        readProductDocViaRest(config, "unauthorized-product-id")
      ).rejects.toThrow(/SECURITY ERROR: Refusing to read path/i);

      await expect(
        readProductDocViaSdk(config, "unauthorized-product-id")
      ).rejects.toThrow(/SECURITY ERROR: Refusing to read path/i);
    });
  });

  // ==========================================================================
  // SUITE 5: Write Immunity Verification
  // ==========================================================================
  describe("5. Write Immunity Verification", () => {
    it("confirms that the diagnostic exposes zero write, delete, or update functions", async () => {
      const diagnosticModule = await import("../../scripts/verify-production-connectivity.mjs");
      const exportedKeys = Object.keys(diagnosticModule);

      const writeKeywords = ["write", "set", "update", "delete", "create", "remove", "patch", "put", "post"];
      const suspiciousKeys = exportedKeys.filter((key) => {
        const lower = key.toLowerCase();
        return writeKeywords.some((w) => lower.includes(w) && !lower.includes("validate"));
      });

      expect(suspiciousKeys).toHaveLength(0);
    });
  });

  // ==========================================================================
  // SUITE 6: Live Production Connectivity Verification
  // ==========================================================================
  describe("6. Live Production Connectivity Verification (Opt-In)", () => {
    it(
      "successfully connects to sri-amman-smart-store, verifies products/prod-mumqpksq, and performs zero writes",
      async () => {
        const result = await runProductionConnectivityDiagnostic({
          confirmProductionReadOnly: true,
          docId: DEFAULT_PRODUCT_DOC_ID,
        });

        // 1. Target project verification
        expect(result.targetProject.projectId).toBe(EXPECTED_PRODUCTION_PROJECT_ID);
        expect(result.targetProject.projectNumber).toBe(EXPECTED_PRODUCTION_PROJECT_NUMBER);
        expect(result.targetProject.authDomain).toBe(EXPECTED_PRODUCTION_AUTH_DOMAIN);
        expect(result.targetProject.apiKeyMasked).toContain("[REDACTED");

        // 2. Safety scope verification
        expect(result.safetyScope.readOnly).toBe(true);
        expect(result.safetyScope.writesPerformed).toBe(0);
        expect(result.safetyScope.customerRecordsAccessed).toBe(0);
        expect(result.safetyScope.authenticationAttempted).toBe(false);
        expect(result.safetyScope.rulesDeployed).toBe(false);

        // 3. Document read verification
        expect(result.checks.projectIdValidated).toBe(true);
        expect(result.checks.restApiConnectivity?.status).toBe("SUCCESS");
        expect(result.checks.sdkConnectivity?.status).toBe("SUCCESS");

        expect(result.documentRead).not.toBeNull();
        expect(["products/prod-mumqpksq", "products/Grocery/items/prod-mumqpksq"]).toContain(result.documentRead?.docPath);
        expect(result.documentRead?.exists).toBe(true);
        expect(result.documentRead?.productName).toBe("Sakthi Turmeric Powder");
        expect(result.documentRead?.fieldCount).toBeGreaterThanOrEqual(40);

        // 4. Insecure rules documentation warning
        expect(result.securityNotice).toMatch(/Production Firestore security rules are currently open/i);
      },
      30000
    );
  });

  // ==========================================================================
  // SUITE 7: Firestore REST Payload Unmarshaling
  // ==========================================================================
  describe("7. Firestore REST Payload Unmarshaling", () => {
    it("correctly unmarshals primitive Firestore REST field types", () => {
      expect(unmarshalFirestoreRestValue({ stringValue: "hello" })).toBe("hello");
      expect(unmarshalFirestoreRestValue({ integerValue: "42" })).toBe(42);
      expect(unmarshalFirestoreRestValue({ doubleValue: 19.99 })).toBe(19.99);
      expect(unmarshalFirestoreRestValue({ booleanValue: true })).toBe(true);
      expect(unmarshalFirestoreRestValue({ nullValue: null })).toBeNull();
      expect(unmarshalFirestoreRestValue({ timestampValue: "2026-10-16T00:00:00Z" })).toBe("2026-10-16T00:00:00Z");
    });

    it("correctly unmarshals nested maps and arrays", () => {
      const restMap = {
        mapValue: {
          fields: {
            title: { stringValue: "Turmeric" },
            price: { integerValue: "10" },
            tags: {
              arrayValue: {
                values: [{ stringValue: "spice" }, { stringValue: "yellow" }],
              },
            },
          },
        },
      };

      const result = unmarshalFirestoreRestValue(restMap);
      expect(result).toEqual({
        title: "Turmeric",
        price: 10,
        tags: ["spice", "yellow"],
      });
    });

    it("correctly unmarshals an entire document fields dictionary", () => {
      const fields = {
        name: { stringValue: "Sakthi Turmeric Powder" },
        mrp: { integerValue: "12" },
        options: {
          arrayValue: {
            values: [
              {
                mapValue: {
                  fields: {
                    unit: { stringValue: "20g Pack" },
                    stock: { integerValue: "60" },
                  },
                },
              },
            ],
          },
        },
      };

      const unmarshaled = unmarshalFirestoreRestFields(fields);
      expect(unmarshaled).toEqual({
        name: "Sakthi Turmeric Powder",
        mrp: 12,
        options: [
          {
            unit: "20g Pack",
            stock: 60,
          },
        ],
      });
    });
  });

  // ==========================================================================
  // SUITE 8: Production Product Schema Normalization & UI Compatibility (Opt-In)
  // ==========================================================================
  describe("8. Production Product Normalization & UI Schema Compatibility (Opt-In)", () => {
    it("safely enforces opt-in and path safety before fetching product", async () => {
      // Rejects unapproved ID
      await expect(
        fetchAndNormalizeProductionProduct("unapproved-id", { confirmProductionReadOnly: true })
      ).rejects.toThrow(/SECURITY ERROR: Refusing to read path/i);

      // Rejects without opt-in
      delete process.env["ALLOW_PRODUCTION_READONLY_DIAGNOSTIC"];
      await expect(
        fetchAndNormalizeProductionProduct("prod-mumqpksq", { confirmProductionReadOnly: false })
      ).rejects.toThrow(/SAFETY GUARD ACTIVE: Production read-only preview is strictly opt-in/i);
    });

    it(
      "fetches and normalizes prod-mumqpksq (Sakthi Turmeric Powder) into full UI Product schema",
      async () => {
        const preview = await fetchAndNormalizeProductionProduct("prod-mumqpksq", {
          confirmProductionReadOnly: true,
        });

        expect(preview.docId).toBe("prod-mumqpksq");
        expect(["products/prod-mumqpksq", "products/Grocery/items/prod-mumqpksq"]).toContain(preview.docPath);
        expect(preview.rawFieldCount).toBeGreaterThanOrEqual(40);
        expect(preview.raw).not.toBeNull();

        const product = preview.normalized;
        expect(product).not.toBeNull();
        if (!product) return;

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

        // Images and tags
        expect(product.images.length).toBeGreaterThanOrEqual(1);
        expect(product.imageUrl).toMatch(/^data:image\/jpeg;base64,/);
        expect(product.tags.length).toBeGreaterThan(0);
        expect(product.tags).toContain("Sakthi");
      },
      30000
    );

    it(
      "fetches and normalizes prod-munn8cp3 (Sakthi Chicken Masala) into full UI Product schema",
      async () => {
        const preview = await fetchAndNormalizeProductionProduct("prod-munn8cp3", {
          confirmProductionReadOnly: true,
        });

        expect(preview.docId).toBe("prod-munn8cp3");
        expect(preview.docPath).toBe("products/prod-munn8cp3");
        expect(preview.rawFieldCount).toBeGreaterThanOrEqual(40);
        expect(preview.raw).not.toBeNull();

        const product = preview.normalized;
        expect(product).not.toBeNull();
        if (!product) return;

        // UI Product Contract Verification
        expect(product.id).toBe("prod-munn8cp3");
        expect(product.name).toBe("Sakthi Chicken Masala");
        expect(product.tamilName).toBe("சிக்கன் மசாலா");
        expect(product.brand).toBe("Sakthi Masala");
        // Refined subCategory "Masala & Spice Powders" maps to "organic-spices"
        expect(product.categorySlug).toBe("organic-spices");
        expect(product.isActive).toBe(true);
        expect(product.rating).toBe(0);
        expect(product.reviewCount).toBe(0);

        // Options normalization (20g or 500g Pack updated by business admin in Phase 7.1)
        expect(product.options).toHaveLength(1);
        expect(product.options[0]?.unit).toBe("g");
        expect(product.options[0]?.mrp).toBe(15);
        expect(product.options[0]?.offerPrice).toBe(12);
        expect(typeof product.options[0]?.stock).toBe("number");
        expect(["20", "500"]).toContain(product.options[0]?.unitSize);

        // Images and tags
        expect(product.images.length).toBeGreaterThanOrEqual(1);
        expect(product.imageUrl).toMatch(/^data:image\/jpeg;base64,/);
        expect(product.tags.length).toBeGreaterThan(0);
        expect(product.tags).toContain("Sakthi");
      },
      30000
    );
  });
});
