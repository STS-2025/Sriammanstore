import { describe, it, expect } from "vitest";
import {
  normalizeLegacyProduct,
  normalizeLegacyProductList,
  normalizeLegacyProductOption,
  deriveCategorySlug,
  parseStrictNumber,
} from "../services/legacySchemaMapper";
import {
  filterAndSortProducts,
  getCatalogPriceBounds,
  getCategoryCounts,
  getPackSizeOptions,
  formatPackSize,
  getProductMinPrice,
  getProductMaxPrice,
  getProductMaxDiscount,
} from "../lib/filterUtils";
import { buildCartKey } from "../lib/productUtils";
import { cartService } from "../services/cartService";
import type { Product } from "../types";

describe("Customer Product Catalog Audit & Production Schema Validation", () => {
  // Realistic production document fixture representing Sakthi Turmeric Powder (prod-mumqpksq)
  const turmericProductionDoc = {
    _id: "prod-mumqpksq",
    id: "prod-mumqpksq",
    productName: "Sakthi Turmeric Powder",
    tamilName: "சக்தி மஞ்சள் தூள்",
    categoryName: "Organic Spices",
    subCategory: "Masala & Spice Powders",
    brandName: "Sakthi Masala",
    desc: "Finest quality pure Erode turmeric ground to perfection with natural golden curcumin.",
    imageUrl: "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJ", // raw Base64 JPEG without prefix
    imageUrls: [
      "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJ",
      "https://storage.googleapis.com/sri-amman/turmeric_back.jpg",
    ],
    rating: 4.8,
    ratingCount: 156,
    active: true,
    options: [
      {
        unit: "g",
        unitSize: "100",
        mrp: 38,
        offerPrice: 34,
        specialPrice: 30,
        stock: 50,
      },
      {
        unit: "g",
        unitSize: "250",
        mrp: 85,
        offerPrice: 76,
        specialPrice: 70,
        stock: 35,
      },
      {
        unit: "g",
        unitSize: "500",
        mrp: 165,
        offerPrice: 148,
        specialPrice: 138,
        stock: 20,
      },
    ],
    tags: ["Turmeric", "Haldi", "Curcumin", "Pure", "Sakthi"],
  };

  // Realistic production document fixture representing Sakthi Chicken Masala (prod-munn8cp3)
  const chickenMasalaProductionDoc = {
    _id: "prod-munn8cp3",
    id: "prod-munn8cp3",
    productName: "Sakthi Chicken Masala",
    tamilName: "சக்தி சிக்கன் மசாலா",
    categoryName: "Organic Spices",
    subCategory: "Non-Veg Masalas",
    brandName: "Sakthi Masala",
    desc: "Aromatic blend of traditional South Indian spices for authentic Chettinad chicken gravies.",
    imageUrl: "iVBORw0KGgoAAAANSUhEUgAA", // raw Base64 PNG without prefix
    rating: 4.9,
    ratingCount: 320,
    isActive: true,
    options: [
      {
        unit: "g",
        unitSize: "50",
        mrp: 22,
        offerPrice: 20,
        specialPrice: 18,
        stock: 100,
      },
      {
        unit: "g",
        unitSize: "100",
        mrp: 42,
        offerPrice: 38,
        specialPrice: 34,
        stock: 75,
      },
    ],
    tags: ["Masala", "Chicken", "Chettinad", "Authentic"],
  };

  // Legacy document that relies on variants[] cross-referencing for options[] missing stock/mrp
  const hybridOptionVariantDoc = {
    id: "prod-hybrid-spices",
    productName: "Erode Pure Sambar Powder",
    categoryName: "Organic Spices",
    subCategory: "Spice Powders",
    brandName: "Sri Amman Farms",
    options: [
      {
        unit: "g",
        unitSize: "200",
        // mrp and stock omitted from option
        offerPrice: 65,
      },
      {
        unit: "g",
        unitSize: "500",
        // mrp and stock omitted from option
        offerPrice: 150,
      },
    ],
    variants: [
      {
        mrp: 80,
        stock: 42,
      },
      {
        mrp: 180,
        stock: 18,
      },
    ],
  };

  // Out of stock product document
  const outOfStockDoc = {
    id: "prod-out-of-stock-ghee",
    productName: "Heritage Buffalo Ghee",
    categoryName: "Dairy & Breakfast",
    brandName: "Amman Dairy",
    options: [
      {
        unit: "ml",
        unitSize: "500",
        mrp: 450,
        offerPrice: 399,
        stock: 0, // Out of stock
      },
    ],
  };

  // Legacy document without ratings or stock
  const minimalDocWithoutRatingsOrStock = {
    id: "prod-minimal-01",
    productName: "Cold Pressed Gingelly Oil",
    categoryName: "Cold Pressed Oils",
    variants: [
      {
        weight: "1",
        unit: "L",
        sellingPrice: 320,
        mrp: 380,
      },
    ],
  };

  describe("1. Scope: Production Schema Normalization & Pack/Variant Selection", () => {
    it("normalizes real production turmeric doc with options[] as primary source", () => {
      const product = normalizeLegacyProduct(turmericProductionDoc);
      expect(product).not.toBeNull();
      expect(product?.id).toBe("prod-mumqpksq");
      expect(product?.name).toBe("Sakthi Turmeric Powder");
      expect(product?.tamilName).toBe("சக்தி மஞ்சள் தூள்");
      expect(product?.brand).toBe("Sakthi Masala");
      expect(product?.category).toBe("Organic Spices");
      expect(product?.categorySlug).toBe("organic-spices");
      expect(product?.subCategory).toBe("Masala & Spice Powders");
      expect(product?.rating).toBe(4.8);
      expect(product?.reviewCount).toBe(156);
      expect(product?.options).toHaveLength(3);

      expect(product?.options[0]).toEqual({
        unit: "g",
        unitSize: "100",
        mrp: 38,
        offerPrice: 34,
        specialPrice: 30,
        stock: 50,
      });

      expect(product?.options[1]).toEqual({
        unit: "g",
        unitSize: "250",
        mrp: 85,
        offerPrice: 76,
        specialPrice: 70,
        stock: 35,
      });
    });

    it("cross-references variants[index] when options[index] is missing stock or MRP", () => {
      const product = normalizeLegacyProduct(hybridOptionVariantDoc);
      expect(product).not.toBeNull();
      expect(product?.options).toHaveLength(2);

      // Option 0 gets mrp: 80, stock: 42 from variants[0]
      expect(product?.options[0]?.mrp).toBe(80);
      expect(product?.options[0]?.offerPrice).toBe(65);
      expect(product?.options[0]?.stock).toBe(42);

      // Option 1 gets mrp: 180, stock: 18 from variants[1]
      expect(product?.options[1]?.mrp).toBe(180);
      expect(product?.options[1]?.offerPrice).toBe(150);
      expect(product?.options[1]?.stock).toBe(18);
    });

    it("falls back to variants[] when options[] is omitted", () => {
      const product = normalizeLegacyProduct(minimalDocWithoutRatingsOrStock);
      expect(product).not.toBeNull();
      expect(product?.options).toHaveLength(1);
      expect(product?.options[0]?.unit).toBe("L");
      expect(product?.options[0]?.unitSize).toBe("1");
      expect(product?.options[0]?.offerPrice).toBe(320);
      expect(product?.options[0]?.mrp).toBe(380);
      expect(product?.options[0]?.stock).toBe(0); // Unlisted stock strictly resolves to 0
    });
  });

  describe("2. Scope: Product Detail Images & Raw Base64 Sanitization", () => {
    it("prepends data:image/jpeg;base64 to raw Base64 JPEG strings starting with /9j/", () => {
      const product = normalizeLegacyProduct(turmericProductionDoc);
      expect(product?.imageUrl).toMatch(/^data:image\/jpeg;base64,\/9j\//);
      expect(product?.images[0]).toMatch(/^data:image\/jpeg;base64,\/9j\//);
      expect(product?.images[1]).toBe("https://storage.googleapis.com/sri-amman/turmeric_back.jpg");
    });

    it("prepends data:image/png;base64 to raw Base64 PNG strings starting with iVBORw0KGgo", () => {
      const product = normalizeLegacyProduct(chickenMasalaProductionDoc);
      expect(product?.imageUrl).toMatch(/^data:image\/png;base64,iVBORw0KGgo/);
      expect(product?.images[0]).toMatch(/^data:image\/png;base64,iVBORw0KGgo/);
    });

    it("safely handles products with empty or missing image fields", () => {
      const noImageDoc = {
        id: "prod-no-img",
        productName: "Local Mustard Seeds",
        categoryName: "Organic Spices",
        options: [{ unit: "g", unitSize: "100", offerPrice: 20, mrp: 25 }],
      };
      const product = normalizeLegacyProduct(noImageDoc);
      expect(product?.imageUrl).toBe("");
      expect(product?.images).toEqual([]);
    });
  });

  describe("3. Scope: Stock Invariants & Zero Stock Handling", () => {
    it("strictly preserves 0 stock for out-of-stock items and never invents positive stock", () => {
      const product = normalizeLegacyProduct(outOfStockDoc);
      expect(product?.options[0]?.stock).toBe(0);
    });

    it("blocks adding out-of-stock items to cart in cartService", async () => {
      const product = normalizeLegacyProduct(outOfStockDoc)!;
      await expect(cartService.addToCart(product, 0, 1)).rejects.toThrow(
        /out of stock/i
      );
    });

    it("preserves canonical cart variant key: ${productId}__opt${optionIndex}__${unit}__${unitSize}", () => {
      const product = normalizeLegacyProduct(turmericProductionDoc)!;
      const key0 = buildCartKey(product.id, 0, product.options[0]!.unit, product.options[0]!.unitSize);
      const key1 = buildCartKey(product.id, 1, product.options[1]!.unit, product.options[1]!.unitSize);

      expect(key0).toBe("prod-mumqpksq__opt0__g__100");
      expect(key1).toBe("prod-mumqpksq__opt1__g__250");
    });
  });

  describe("4. Scope: Pricing, Discounts, and Ratings Invariants", () => {
    it("never invents ratings or reviews when absent from production document", () => {
      const product = normalizeLegacyProduct(minimalDocWithoutRatingsOrStock);
      expect(product?.rating).toBe(0);
      expect(product?.reviewCount).toBe(0);
    });

    it("computes accurate min price, max price, and discount bounds", () => {
      const product = normalizeLegacyProduct(turmericProductionDoc)!;
      expect(getProductMinPrice(product)).toBe(34);
      expect(getProductMaxPrice(product)).toBe(148);
      // 100g: (38 - 34) / 38 = 10.5% -> 11%
      // 250g: (85 - 76) / 85 = 10.58% -> 11%
      // 500g: (165 - 148) / 165 = 10.3% -> 10%
      expect(getProductMaxDiscount(product)).toBe(11);
    });
  });

  describe("5. Scope: Category & Subcategory Mapping", () => {
    it("maps categoryName to canonical slug and preserves raw subCategory", () => {
      const product = normalizeLegacyProduct(turmericProductionDoc);
      expect(product?.category).toBe("Organic Spices");
      expect(product?.categorySlug).toBe("organic-spices");
      expect(product?.subCategory).toBe("Masala & Spice Powders");
    });

    it("refines generic 'Grocery' category to subCategory value when present", () => {
      const genericDoc = {
        id: "prod-generic-01",
        productName: "Idli Rice",
        categoryName: "Grocery",
        subCategory: "Staples & Grains",
        options: [{ unit: "kg", unitSize: "5", offerPrice: 280, mrp: 320, stock: 15 }],
      };
      const product = normalizeLegacyProduct(genericDoc);
      expect(product?.category).toBe("Staples & Grains");
      expect(product?.categorySlug).toBe("staples-grains");
      expect(product?.subCategory).toBe("Staples & Grains");
    });
  });

  describe("6. Scope: Product Catalog Search & Multi-facet Filtering", () => {
    const catalog: Product[] = [
      normalizeLegacyProduct(turmericProductionDoc)!,
      normalizeLegacyProduct(chickenMasalaProductionDoc)!,
      normalizeLegacyProduct(hybridOptionVariantDoc)!,
      normalizeLegacyProduct(outOfStockDoc)!,
    ];

    it("filters products by text search matching subCategory", () => {
      const results = filterAndSortProducts(catalog, {
        search: "Non-Veg Masalas",
      });
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe("prod-munn8cp3");
    });

    it("filters products by text search matching Tamil name", () => {
      const results = filterAndSortProducts(catalog, {
        search: "மஞ்சள்",
      });
      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe("prod-mumqpksq");
    });

    it("filters products by text search matching brand name", () => {
      const results = filterAndSortProducts(catalog, {
        search: "Sakthi",
      });
      expect(results).toHaveLength(2);
      // Sorted by popular (reviewCount: 320 vs 156)
      expect(results.map((p) => p.id)).toEqual([
        "prod-munn8cp3",
        "prod-mumqpksq",
      ]);
    });

    it("filters products by category slug", () => {
      const results = filterAndSortProducts(catalog, {
        categories: ["organic-spices"],
      });
      expect(results).toHaveLength(3); // turmeric, chicken masala, sambar powder
    });

    it("filters products by inStockOnly flag, excluding out of stock items", () => {
      const results = filterAndSortProducts(catalog, {
        inStockOnly: true,
      });
      expect(results).toHaveLength(3);
      expect(results.find((p) => p.id === "prod-out-of-stock-ghee")).toBeUndefined();
    });

    it("filters products by pack size", () => {
      const results = filterAndSortProducts(catalog, {
        packSizes: ["100 g"],
      });
      // Turmeric and Chicken Masala both have 100g option, sorted by popular
      expect(results).toHaveLength(2);
      expect(results.map((p) => p.id)).toEqual([
        "prod-munn8cp3",
        "prod-mumqpksq",
      ]);
    });

    it("calculates accurate category counts across normalized catalog", () => {
      const counts = getCategoryCounts(catalog);
      expect(counts["organic-spices"]).toBe(3);
      expect(counts["dairy-breakfast"]).toBe(1);
    });

    it("calculates dynamic price bounds across normalized catalog", () => {
      const bounds = getCatalogPriceBounds(catalog);
      // Min price is Chicken Masala 50g (₹20), Max price is Buffalo Ghee 500ml (₹399)
      expect(bounds.min).toBe(20);
      expect(bounds.max).toBe(399);
    });
  });
});
