import { describe, it, expect } from "vitest";
import {
  buildProductionCategoryResolution,
  resolveProductCategoryMapping,
  fetchProductionCategoryDocs,
  type ProductionCategoryDoc,
} from "../services/productionCategoryResolver";
import { fetchFullProductionCatalogue } from "../services/productionPreviewService";

describe("Production Category Resolver & Diagnostics (Phase 5)", () => {
  const sampleFirestoreCategories: ProductionCategoryDoc[] = [
    {
      id: "cat-mun1fjzh",
      name: "Grocery",
      slug: "sambar",
      subcategories: ["Masala & Spice Powders"],
      bannerUrl: "data:image/jpeg;base64,/9j/mockCategoryBanner",
      displayOrder: 1,
      isActive: true,
      showOnHomepage: true,
      itemCount: 0,
    },
  ];

  const sampleProducts = [
    {
      id: "prod-munn8cp3",
      categoryId: "cat-mun1fjzh",
      categoryName: "Grocery",
      subCategory: "Masala & Spice Powders",
    },
    {
      id: "prod-munnbzf7",
      categoryId: "cat-mun1fjzh",
      categoryName: "Grocery",
      subCategory: "Masala & Spice Powders",
    },
    {
      id: "prod-mumqpksq",
      categoryId: "cat-spices",
      categoryName: "Spices & Masala Powders",
      subCategory: "Whole Spices",
    },
    {
      id: "prod-mumrbamt",
      categoryId: "cat-spices",
      category: "Spices & Masala Powders",
      subCategory: "Whole Spices",
    },
  ];

  describe("1. Category Document Resolution & Slug Conflict Diagnostics", () => {
    it("maps verified Firestore category documents into Category domain objects", () => {
      const result = buildProductionCategoryResolution(sampleFirestoreCategories, {
        products: sampleProducts,
      });

      expect(result.categories.length).toBe(2);

      const grocery = result.categories.find((c) => c.id === "cat-mun1fjzh");
      expect(grocery).toBeDefined();
      expect(grocery?.name).toBe("Grocery");
      expect(grocery?.slug).toBe("sambar"); // Document slug preserved for routing
      expect(grocery?.source).toBe("firestore-document");
      expect(grocery?.subcategories).toEqual(["Masala & Spice Powders"]);
      expect(grocery?.itemCount).toBe("2 Items");
    });

    it("detects and flags slug mismatches as conflict diagnostics", () => {
      const result = buildProductionCategoryResolution(sampleFirestoreCategories, {
        products: sampleProducts,
      });

      const conflicts = result.diagnostics.conflicts;
      expect(conflicts.length).toBeGreaterThan(0);

      const slugMismatch = conflicts.find((c) => c.issue === "slug_mismatch");
      expect(slugMismatch).toBeDefined();
      expect(slugMismatch?.categoryId).toBe("cat-mun1fjzh");
      expect(slugMismatch?.description).toContain("has name 'Grocery' but document slug 'sambar'");
    });
  });

  describe("2. Fallback Handling for Missing Category Documents", () => {
    it("creates documented fallback category for cat-spices missing from categories collection", () => {
      const result = buildProductionCategoryResolution(sampleFirestoreCategories, {
        products: sampleProducts,
      });

      const fallbackCat = result.categories.find((c) => c.id === "cat-spices");
      expect(fallbackCat).toBeDefined();
      expect(fallbackCat?.name).toBe("Spices & Masala Powders");
      expect(fallbackCat?.slug).toBe("spices-and-masala-powders");
      expect(fallbackCat?.source).toBe("product-fallback");
      expect(fallbackCat?.subcategories).toContain("Whole Spices");
      expect(fallbackCat?.itemCount).toBe("2 Items");

      // Diagnostics verification
      expect(result.diagnostics.missingDocCategoryIds).toContain("cat-spices");
      expect(result.diagnostics.fallbackCategoryCount).toBe(1);
      expect(result.diagnostics.resolvedFromFirestoreCount).toBe(1);
      expect(result.diagnostics.totalCategoryDocsRead).toBe(1);
    });

    it("aggregates subcategory counts correctly", () => {
      const result = buildProductionCategoryResolution(sampleFirestoreCategories, {
        products: sampleProducts,
      });

      expect(result.diagnostics.subcategoryCounts["Masala & Spice Powders"]).toBe(2);
      expect(result.diagnostics.subcategoryCounts["Whole Spices"]).toBe(2);
    });
  });

  describe("3. resolveProductCategoryMapping Helper", () => {
    const docsMap = new Map<string, ProductionCategoryDoc>();
    sampleFirestoreCategories.forEach((doc) => docsMap.set(doc.id, doc));

    it("resolves by categoryId when matching category document exists", () => {
      const mapping = resolveProductCategoryMapping(
        { categoryId: "cat-mun1fjzh", subCategory: "Masala & Spice Powders" },
        docsMap
      );
      expect(mapping.categoryId).toBe("cat-mun1fjzh");
      expect(mapping.category).toBe("Grocery");
      expect(mapping.categorySlug).toBe("sambar");
      expect(mapping.subCategory).toBe("Masala & Spice Powders");
      expect(mapping.isFallback).toBe(false);
    });

    it("resolves by categoryName when matching category document name matches", () => {
      const mapping = resolveProductCategoryMapping(
        { categoryName: "Grocery" },
        docsMap
      );
      expect(mapping.categoryId).toBe("cat-mun1fjzh");
      expect(mapping.category).toBe("Grocery");
      expect(mapping.categorySlug).toBe("sambar");
      expect(mapping.isFallback).toBe(false);
    });

    it("resolves as fallback when categoryId and name have no category document", () => {
      const mapping = resolveProductCategoryMapping(
        { categoryId: "cat-spices", category: "Spices & Masala Powders", subCategory: "Whole Spices" },
        docsMap
      );
      expect(mapping.categoryId).toBe("cat-spices");
      expect(mapping.category).toBe("Spices & Masala Powders");
      expect(mapping.categorySlug).toBe("spices-and-masala-powders");
      expect(mapping.subCategory).toBe("Whole Spices");
      expect(mapping.isFallback).toBe(true);
    });
  });

  describe("4. Security Guard on fetchProductionCategoryDocs", () => {
    it("throws descriptive error when optIn is explicitly false", async () => {
      await expect(fetchProductionCategoryDocs({ optIn: false })).rejects.toThrow(
        "SAFETY GUARD ACTIVE: Production category read access is strictly opt-in."
      );
    });
  });

  describe("5. Live Full Production Catalogue Category Resolution & Cursor Pagination", () => {
    it("resolves live production catalogue with category diagnostics and pagination completeness", async () => {
      process.env["VITE_ENABLE_PRODUCTION_PREVIEW"] = "true";

      const result = await fetchFullProductionCatalogue({
        optIn: true,
        pageSize: 10,
      });

      expect(result.products.length).toBeGreaterThanOrEqual(8);
      expect(result.diagnostics.uniqueProductCount).toBe(result.products.length);
      expect(result.diagnostics.totalRawDocuments).toBeGreaterThanOrEqual(10);
      expect(result.diagnostics.isComplete).toBe(true);
      expect(result.diagnostics.isPartial).toBe(false);

      // Pagination metadata
      expect(result.diagnostics.pagination).toBeDefined();
      expect(result.diagnostics.pagination?.topLevelPages).toBeGreaterThanOrEqual(1);
      expect(result.diagnostics.pagination?.nestedPages).toBeGreaterThanOrEqual(1);

      // Category Resolution diagnostics
      const catDiag = result.diagnostics.categoryResolution;
      expect(catDiag).toBeDefined();
      expect(catDiag?.totalCategoryDocsRead).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(catDiag?.missingDocCategoryIds)).toBe(true);
      expect(catDiag?.fallbackCategoryCount).toBeGreaterThanOrEqual(0);
      expect(catDiag?.resolvedFromFirestoreCount).toBeGreaterThanOrEqual(1);

      // Category breakdown
      expect(catDiag?.categoryDocCounts["cat-mun1fjzh"]).toBeGreaterThanOrEqual(6);

      // Subcategories
      expect(catDiag?.subcategoryCounts["Masala & Spice Powders"]).toBeGreaterThanOrEqual(6);
    }, 35000);
  });
});
