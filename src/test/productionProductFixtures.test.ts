import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  APPROVED_PRODUCTION_FIXTURE_IDS,
  CHICKEN_MASALA_NEUTRAL_PLACEHOLDER,
  TURMERIC_POWDER_FIXTURE_IMAGE,
  productionTurmericRawFixture,
  productionChickenMasalaRawFixture,
  SANITIZED_PRODUCTION_PRODUCT_RAW_FIXTURES,
  normalizedProductionProductFixtures,
  getSanitizedProductionFixture,
  seedInMemoryProductionProductFixtures,
} from "../fixtures/productionProductFixtures";
import { normalizeLegacyProduct } from "../services/legacySchemaMapper";
import { InMemoryFirestoreDriver } from "../services/firestoreAdapter";
import { buildCartKey } from "../lib/productUtils";
import type { Product } from "../types";

describe("Phase B: Local Production-Compatible Product Fixtures", () => {
  let driver: InMemoryFirestoreDriver;

  beforeEach(() => {
    driver = new InMemoryFirestoreDriver();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // SUITE 1: Document ID Preservation & Catalog Schema Fidelity
  // ==========================================================================
  describe("1. Document ID Preservation & Identity", () => {
    it("preserves exact approved production document IDs in the fixtures", () => {
      expect(APPROVED_PRODUCTION_FIXTURE_IDS).toEqual([
        "prod-mumqpksq",
        "prod-munn8cp3",
      ]);

      expect(productionTurmericRawFixture["id"]).toBe("prod-mumqpksq");
      expect(productionTurmericRawFixture["productId"]).toBe("prod-mumqpksq");

      expect(productionChickenMasalaRawFixture["id"]).toBe("prod-munn8cp3");
      expect(productionChickenMasalaRawFixture["productId"]).toBe("prod-munn8cp3");
    });

    it("retrieves fixtures by production document ID via getSanitizedProductionFixture", () => {
      const turmeric = getSanitizedProductionFixture("prod-mumqpksq");
      expect(turmeric).not.toBeNull();
      expect(turmeric?.["name"]).toBe("Sakthi Turmeric Powder");

      const chicken = getSanitizedProductionFixture("prod-munn8cp3");
      expect(chicken).not.toBeNull();
      expect(chicken?.["name"]).toBe("Sakthi Chicken Masala");

      expect(getSanitizedProductionFixture("unknown-id")).toBeNull();
    });

    it("normalizes into strongly typed Product models with correct IDs and bilingual titles", () => {
      expect(normalizedProductionProductFixtures).toHaveLength(2);

      const turmeric = normalizedProductionProductFixtures.find(
        (p) => p.id === "prod-mumqpksq"
      );
      expect(turmeric).toBeDefined();
      expect(turmeric?.id).toBe("prod-mumqpksq");
      expect(turmeric?.name).toBe("Sakthi Turmeric Powder");
      expect(turmeric?.tamilName).toBe("மஞ்சள் தூள்");
      expect(turmeric?.brand).toBe("Sakthi Masala");

      const chicken = normalizedProductionProductFixtures.find(
        (p) => p.id === "prod-munn8cp3"
      );
      expect(chicken).toBeDefined();
      expect(chicken?.id).toBe("prod-munn8cp3");
      expect(chicken?.name).toBe("Sakthi Chicken Masala");
      expect(chicken?.tamilName).toBe("சிக்கன் மசாலா");
      expect(chicken?.brand).toBe("Sakthi Masala");
    });
  });

  // ==========================================================================
  // SUITE 2: Sanitization & Sensitive POS Data Exclusion
  // ==========================================================================
  describe("2. Sanitization & Sensitive Data Exclusion", () => {
    it("strictly excludes purchasePrice, credentials, and customer data from raw fixtures", () => {
      for (const fixture of SANITIZED_PRODUCTION_PRODUCT_RAW_FIXTURES) {
        expect(fixture).not.toHaveProperty("purchasePrice");
        expect(fixture).not.toHaveProperty("password");
        expect(fixture).not.toHaveProperty("secret");
        expect(fixture).not.toHaveProperty("apiKey");
        expect(fixture).not.toHaveProperty("userId");
        expect(fixture).not.toHaveProperty("customer");

        if (Array.isArray(fixture["variants"])) {
          for (const variant of fixture["variants"] as Record<string, unknown>[]) {
            expect(variant).not.toHaveProperty("purchasePrice");
          }
        }
      }
    });

    it("never exposes internal warehouse/POS metadata in customer-facing Product or ProductOption objects", () => {
      for (const product of normalizedProductionProductFixtures) {
        const rawProduct = product as unknown as Record<string, unknown>;
        expect(rawProduct).not.toHaveProperty("purchasePrice");
        expect(rawProduct).not.toHaveProperty("barcode");
        expect(rawProduct).not.toHaveProperty("sku");
        expect(rawProduct).not.toHaveProperty("batchNumber");
        expect(rawProduct).not.toHaveProperty("safetyStock");
        expect(rawProduct).not.toHaveProperty("expiryDate");

        for (const option of product.options) {
          const rawOption = option as unknown as Record<string, unknown>;
          expect(rawOption).not.toHaveProperty("purchasePrice");
          expect(rawOption).not.toHaveProperty("barcode");
          expect(rawOption).not.toHaveProperty("sku");
          expect(rawOption).not.toHaveProperty("batchNumber");
          expect(rawOption).not.toHaveProperty("safetyStock");
          expect(rawOption).not.toHaveProperty("expiryDate");
        }
      }
    });
  });

  // ==========================================================================
  // SUITE 3: Image Handling & Neutral Placeholder Invariant
  // ==========================================================================
  describe("3. Image Handling & Neutral Placeholder Invariant", () => {
    it("does NOT use the incorrect Puliyogare photo for Chicken Masala, using the neutral placeholder instead", () => {
      const chicken = normalizedProductionProductFixtures.find(
        (p) => p.id === "prod-munn8cp3"
      )!;

      // Must point to the neutral placeholder
      expect(chicken.imageUrl).toBe(CHICKEN_MASALA_NEUTRAL_PLACEHOLDER);
      expect(chicken.images).toContain(CHICKEN_MASALA_NEUTRAL_PLACEHOLDER);

      // Must NOT contain Puliyogare references
      expect(chicken.imageUrl.toLowerCase()).not.toContain("puliyogare");
      expect(chicken.imageUrl.toLowerCase()).not.toContain("puliogare");
      for (const img of chicken.images) {
        expect(img.toLowerCase()).not.toContain("puliyogare");
      }
    });

    it("uses the verified turmeric fixture image for Turmeric Powder", () => {
      const turmeric = normalizedProductionProductFixtures.find(
        (p) => p.id === "prod-mumqpksq"
      )!;

      expect(turmeric.imageUrl).toBe(TURMERIC_POWDER_FIXTURE_IMAGE);
      expect(turmeric.images).toContain(TURMERIC_POWDER_FIXTURE_IMAGE);
    });
  });

  // ==========================================================================
  // SUITE 4: Pack Options & Canonical Cart Key Invariants
  // ==========================================================================
  describe("4. Pack Options & Canonical Cart Keys", () => {
    it("correctly parses 20g Pack for Turmeric Powder without being confused by placeholder weights", () => {
      const turmeric = normalizedProductionProductFixtures.find(
        (p) => p.id === "prod-mumqpksq"
      )!;

      expect(turmeric.options).toHaveLength(1);
      const opt = turmeric.options[0]!;

      // Must be 20g (NOT 500g)
      expect(opt.unit).toBe("g");
      expect(opt.unitSize).toBe("20");
      expect(opt.mrp).toBe(12);
      expect(opt.offerPrice).toBe(10);
      expect(opt.stock).toBe(60);

      // Canonical cart variant key
      const cartKey = buildCartKey(turmeric.id, 0, opt.unit, opt.unitSize);
      expect(cartKey).toBe("prod-mumqpksq__opt0__g__20");
    });

    it("correctly parses 500g Pack for Chicken Masala", () => {
      const chicken = normalizedProductionProductFixtures.find(
        (p) => p.id === "prod-munn8cp3"
      )!;

      expect(chicken.options).toHaveLength(1);
      const opt = chicken.options[0]!;

      expect(opt.unit).toBe("g");
      expect(opt.unitSize).toBe("500");
      expect(opt.mrp).toBe(15);
      expect(opt.offerPrice).toBe(12);
      expect(opt.stock).toBe(40);

      // Canonical cart variant key
      const cartKey = buildCartKey(chicken.id, 0, opt.unit, opt.unitSize);
      expect(cartKey).toBe("prod-munn8cp3__opt0__g__500");
    });
  });

  // ==========================================================================
  // SUITE 5: Pricing, Stock, and Category Invariants
  // ==========================================================================
  describe("5. Pricing, Stock, and Category Mapping", () => {
    it("ensures MRP >= offerPrice and stock >= 0 across both fixtures", () => {
      for (const product of normalizedProductionProductFixtures) {
        for (const opt of product.options) {
          expect(opt.mrp).toBeGreaterThanOrEqual(opt.offerPrice);
          expect(opt.offerPrice).toBeGreaterThan(0);
          expect(opt.stock).toBeGreaterThanOrEqual(0);
          if (opt.specialPrice !== undefined) {
            expect(opt.specialPrice).toBeLessThan(opt.offerPrice);
          }
        }
      }
    });

    it("correctly derives category and categorySlug for both products", () => {
      const turmeric = normalizedProductionProductFixtures.find(
        (p) => p.id === "prod-mumqpksq"
      )!;
      expect(turmeric.category).toBe("Spices & Masala Powders");
      expect(turmeric.categorySlug).toBe("organic-spices");

      const chicken = normalizedProductionProductFixtures.find(
        (p) => p.id === "prod-munn8cp3"
      )!;
      // Refined from generic "Grocery" to subCategory "Masala & Spice Powders"
      expect(chicken.category).toBe("Masala & Spice Powders");
      expect(chicken.categorySlug).toBe("organic-spices");
    });

    it("maps verified customer-facing packaging metadata (GST, HSN, FSSAI, Ingredients)", () => {
      const turmeric = normalizedProductionProductFixtures.find(
        (p) => p.id === "prod-mumqpksq"
      )!;
      expect(turmeric.gstRate).toBe(5);
      expect(turmeric.hsnCode).toBe("09103030");
      expect(turmeric.fssaiNumber).toBe("12415003000524");
      expect(turmeric.ingredients).toBe("Turmeric");
      expect(turmeric.isBestSeller).toBe(true);
      // Unverified rating and reviews must be 0
      expect(turmeric.rating).toBe(0);
      expect(turmeric.reviewCount).toBe(0);

      const chicken = normalizedProductionProductFixtures.find(
        (p) => p.id === "prod-munn8cp3"
      )!;
      expect(chicken.gstRate).toBe(5);
      expect(chicken.hsnCode).toBe("09109100");
      expect(chicken.fssaiNumber).toBe("12415003000524");
      expect(chicken.ingredients).toContain("Coriander");
      expect(chicken.ingredients).toContain("Chilli");
      expect(chicken.isNew).toBe(true);
      expect(chicken.isBestSeller).toBe(true);
      // Unverified rating and reviews must be 0
      expect(chicken.rating).toBe(0);
      expect(chicken.reviewCount).toBe(0);
    });
  });

  // ==========================================================================
  // SUITE 6: In-Memory Firestore Seeding & Isolation
  // ==========================================================================
  describe("6. In-Memory Driver Seeding & Non-Destructive Isolation", () => {
    it("seeds production fixtures into in-memory driver and safely cleans up", async () => {
      // Pre-seed an unrelated mock product to verify non-destructive isolation
      await driver.setDoc("products", "prod_groundnut_oil", {
        id: "prod_groundnut_oil",
        name: "Groundnut Oil",
      });

      const { turmeric, chickenMasala, cleanup } =
        await seedInMemoryProductionProductFixtures(driver);

      expect(turmeric.id).toBe("prod-mumqpksq");
      expect(chickenMasala.id).toBe("prod-munn8cp3");

      // Verify documents are retrievable
      const fetchedTurmeric = await driver.getDoc("products", "prod-mumqpksq");
      expect(fetchedTurmeric).not.toBeNull();
      expect(fetchedTurmeric?.["name"]).toBe("Sakthi Turmeric Powder");

      const fetchedChicken = await driver.getDoc("products", "prod-munn8cp3");
      expect(fetchedChicken).not.toBeNull();
      expect(fetchedChicken?.["name"]).toBe("Sakthi Chicken Masala");

      // Verify pre-existing mock product is untouched
      const existingProduct = await driver.getDoc("products", "prod_groundnut_oil");
      expect(existingProduct).not.toBeNull();
      expect(existingProduct?.["name"]).toBe("Groundnut Oil");

      // Cleanup removes only the production fixture documents
      await cleanup();
      expect(await driver.getDoc("products", "prod-mumqpksq")).toBeNull();
      expect(await driver.getDoc("products", "prod-munn8cp3")).toBeNull();

      // Existing product still intact
      const stillExisting = await driver.getDoc("products", "prod_groundnut_oil");
      expect(stillExisting).not.toBeNull();
    });
  });

  // ==========================================================================
  // SUITE 7: Script Seeding Function & Idempotency
  // ==========================================================================
  describe("7. Script Seeding Function & Non-Destructive Idempotency", () => {
    it("seeds production fixtures into storageBackend idempotently without deleting unrelated items", async () => {
      const { seedProductionProductFixtures } = (await import(
        "../../scripts/seed-emulator.mjs"
      )) as any;

      // Pre-seed unrelated product and customer
      await driver.setDoc("products", "prod_ponni_rice", {
        id: "prod_ponni_rice",
        name: "Ponni Rice",
      });
      await driver.setDoc("users", "SASS9999901", {
        id: "SASS9999901",
        name: "Test Customer",
      });

      const mockBackend = {
        async getDoc(col: string, id: string) {
          return driver.getDoc(col, id);
        },
        async setDoc(col: string, id: string, data: Record<string, unknown>) {
          return driver.setDoc(col, id, data);
        },
      };

      // 1. First run: should import both fixtures
      const firstRun = await seedProductionProductFixtures({
        storageBackend: mockBackend,
        logger: null,
      });

      expect(firstRun).toHaveLength(2);
      expect(firstRun.every((r: any) => r.action === "imported")).toBe(true);

      // Verify both products now exist
      const turmeric = await driver.getDoc("products", "prod-mumqpksq");
      expect(turmeric?.["name"]).toBe("Sakthi Turmeric Powder");
      const chicken = await driver.getDoc("products", "prod-munn8cp3");
      expect(chicken?.["name"]).toBe("Sakthi Chicken Masala");

      // Verify unrelated product and customer are untouched
      expect(await driver.getDoc("products", "prod_ponni_rice")).not.toBeNull();
      expect(await driver.getDoc("users", "SASS9999901")).not.toBeNull();

      // 2. Second run: identical payloads should be skipped (idempotent)
      const secondRun = await seedProductionProductFixtures({
        storageBackend: mockBackend,
        logger: null,
      });

      expect(secondRun).toHaveLength(2);
      expect(secondRun.every((r: any) => r.action === "skipped")).toBe(true);

      // 3. Mutate one document slightly: should update only that document
      await driver.setDoc("products", "prod-mumqpksq", {
        ...turmeric,
        price: 999, // deliberate divergence
      });

      const thirdRun = await seedProductionProductFixtures({
        storageBackend: mockBackend,
        logger: null,
      });

      const turmericResult = thirdRun.find((r: any) => r.id === "prod-mumqpksq");
      const chickenResult = thirdRun.find((r: any) => r.id === "prod-munn8cp3");
      expect(turmericResult.action === "updated").toBe(true);
      expect(chickenResult.action === "skipped").toBe(true);
    });
  });
});

