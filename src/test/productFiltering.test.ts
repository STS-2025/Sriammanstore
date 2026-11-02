import { describe, it, expect } from "vitest";
import { productService } from "../services/productService";
import {
  filterAndSortProducts,
  getCatalogPriceBounds,
  getCategoryCounts,
  getPackSizeOptions,
  getMethodQualityCounts,
  getRatingCounts,
  getDiscountCounts,
  getProductMinPrice,
  getProductMaxPrice,
  getProductMaxDiscount,
  formatPackSize,
} from "../lib/filterUtils";
import type { Product } from "../types";

// Mock products representing catalog structure
const mockProducts: Product[] = [
  {
    id: "prod_groundnut_oil",
    name: "Heritage Wood Churned Mara Chekku Groundnut Oil",
    category: "Cold Pressed Oils",
    categorySlug: "cold-pressed-oils",
    brand: "Sri Amman Organics",
    rating: 4.9,
    reviewCount: 1840,
    description: "Wood churned groundnut oil",
    imageUrl: "/test.jpg",
    images: ["/test.jpg"],
    tags: ["Wood Churned", "Pure Organic", "Bestseller"],
    extraction: "Vaagai Wood Mortar (38°C Cold Max)",
    isActive: true,
    options: [
      { unit: "ml", unitSize: "500", mrp: 160, offerPrice: 130, stock: 45 },
      { unit: "L", unitSize: "1", mrp: 299, offerPrice: 245, stock: 50 },
      { unit: "L", unitSize: "5", mrp: 1420, offerPrice: 1150, stock: 10 },
    ],
  },
  {
    id: "prod_a2_ghee",
    name: "A2 Desi Cow Bilona Ghee",
    category: "Cold Pressed Oils",
    categorySlug: "cold-pressed-oils",
    brand: "Sri Amman Farms",
    rating: 4.9,
    reviewCount: 920,
    description: "A2 Desi Cow Bilona Ghee",
    imageUrl: "/test.jpg",
    images: ["/test.jpg"],
    tags: ["Bilona Method", "A2 Desi Cow"],
    extraction: "Curd Churned Wooden Bilona",
    isActive: true,
    options: [
      { unit: "ml", unitSize: "250", mrp: 490, offerPrice: 410, stock: 35 },
      { unit: "ml", unitSize: "500", mrp: 950, offerPrice: 790, stock: 25 },
      { unit: "L", unitSize: "1", mrp: 1850, offerPrice: 1520, stock: 12 },
    ],
  },
  {
    id: "prod_ponni_rice",
    name: "Tanjore Royal Ponni Raw Rice",
    category: "Rice & Staples",
    categorySlug: "staples-grains",
    brand: "Sri Amman Harvest",
    rating: 4.8,
    reviewCount: 1120,
    description: "Unpolished Ponni Rice",
    imageUrl: "/test.jpg",
    images: ["/test.jpg"],
    tags: ["Heritage Grain", "Unpolished"],
    extraction: "Unpolished Traditional Milling",
    isActive: true,
    options: [
      { unit: "kg", unitSize: "1", mrp: 95, offerPrice: 82, stock: 100 },
      { unit: "kg", unitSize: "5", mrp: 460, offerPrice: 395, stock: 40 },
      { unit: "kg", unitSize: "25", mrp: 2150, offerPrice: 1820, stock: 15 },
    ],
  },
  {
    id: "prod_ooty_carrots",
    name: "Organic Ooty Hill Carrots",
    category: "Farm Fresh Veggies",
    categorySlug: "fruits-veggies",
    brand: "Sri Amman Fresh Farm",
    rating: 4.7,
    reviewCount: 420,
    description: "Hill grown organic carrots",
    imageUrl: "/test.jpg",
    images: ["/test.jpg"],
    tags: ["Hill Grown", "Morning Harvest", "Pure Organic"],
    extraction: "Organic Farm Plucked",
    isActive: true,
    options: [
      { unit: "g", unitSize: "500", mrp: 50, offerPrice: 38, stock: 60 },
      { unit: "kg", unitSize: "1", mrp: 95, offerPrice: 72, stock: 45 },
    ],
  },
  {
    id: "prod_out_of_stock_item",
    name: "Special Out of Stock Seasonal Harvest",
    category: "Farm Fresh Veggies",
    categorySlug: "fruits-veggies",
    brand: "Sri Amman Fresh Farm",
    rating: 4.5,
    reviewCount: 50,
    description: "Sold out item",
    imageUrl: "/test.jpg",
    images: ["/test.jpg"],
    tags: ["Seasonal"],
    extraction: "Organic Farm Plucked",
    isActive: true,
    options: [
      { unit: "kg", unitSize: "1", mrp: 120, offerPrice: 100, stock: 0 },
    ],
  },
];

describe("Product Filtering Engine (filterUtils)", () => {
  it("computes accurate min price, max price, and discount for a product", () => {
    const groundnut = mockProducts[0]!;
    expect(getProductMinPrice(groundnut)).toBe(130);
    expect(getProductMaxPrice(groundnut)).toBe(1150);
    // 500ml: (160 - 130) / 160 = 18.75% -> 19%
    expect(getProductMaxDiscount(groundnut)).toBe(19);
  });

  it("calculates catalog price bounds dynamically", () => {
    const bounds = getCatalogPriceBounds(mockProducts);
    expect(bounds.min).toBe(38); // Ooty carrot 500g
    expect(bounds.max).toBe(1820); // Ponni rice 25kg
  });

  it("aggregates category product counts correctly", () => {
    const counts = getCategoryCounts(mockProducts);
    expect(counts["cold-pressed-oils"]).toBe(2);
    expect(counts["staples-grains"]).toBe(1);
    expect(counts["fruits-veggies"]).toBe(2);
  });

  it("aggregates pack size options with counts", () => {
    const options = getPackSizeOptions(mockProducts);
    const oneLitre = options.find((o) => o.label === "1 L");
    expect(oneLitre).toBeDefined();
    expect(oneLitre?.count).toBe(2); // Groundnut oil and A2 Ghee have 1 L

    const fiveHundredMl = options.find((o) => o.label === "500 ml");
    expect(fiveHundredMl).toBeDefined();
    expect(fiveHundredMl?.count).toBe(2); // Groundnut oil and A2 Ghee
  });

  it("aggregates rating thresholds counts accurately", () => {
    const ratings = getRatingCounts(mockProducts);
    const rating48 = ratings.find((r) => r.rating === 4.8);
    // 4.9 (groundnut), 4.9 (a2 ghee), 4.8 (ponni rice) => 3 products
    expect(rating48?.count).toBe(3);
  });

  it("aggregates discount thresholds counts accurately", () => {
    const discounts = getDiscountCounts(mockProducts);
    const discount15 = discounts.find((d) => d.discount === 15);
    // Groundnut (19%), A2 Ghee (18%), Ooty Carrots (24%), Out of stock item ((120-100)/120 = 17%) => 4 products
    expect(discount15?.count).toBeGreaterThanOrEqual(3);
  });

  it("aggregates method and quality counts based on structured tags and extraction", () => {
    const methodCounts = getMethodQualityCounts(mockProducts);
    expect(methodCounts["wood_churned"]).toBe(1); // Groundnut oil
    expect(methodCounts["bilona"]).toBe(1); // A2 Ghee
    expect(methodCounts["chemical_free"]).toBe(1); // Ponni Rice (Unpolished)
    expect(methodCounts["organic"]).toBe(3); // Groundnut oil, Ooty carrots, and out of stock item
  });

  describe("Multi-Select Filtering Dimensions", () => {
    it("filters products by single category", () => {
      const result = filterAndSortProducts(mockProducts, {
        categories: ["cold-pressed-oils"],
      });
      expect(result.length).toBe(2);
      expect(result.every((p) => p.categorySlug === "cold-pressed-oils")).toBe(true);
    });

    it("filters products by multiple categories (union)", () => {
      const result = filterAndSortProducts(mockProducts, {
        categories: ["cold-pressed-oils", "staples-grains"],
      });
      expect(result.length).toBe(3);
      const slugs = result.map((p) => p.categorySlug);
      expect(slugs).toContain("cold-pressed-oils");
      expect(slugs).toContain("staples-grains");
      expect(slugs).not.toContain("fruits-veggies");
    });

    it("filters out out-of-stock products when inStockOnly is true", () => {
      const inStockResult = filterAndSortProducts(mockProducts, {
        inStockOnly: true,
      });
      expect(inStockResult.map((p) => p.id)).not.toContain("prod_out_of_stock_item");
      expect(inStockResult.length).toBe(4);
    });

    it("filters products within specific price range", () => {
      // Products with at least one option between 30 and 100
      const lowPriceResult = filterAndSortProducts(mockProducts, {
        minPrice: 30,
        maxPrice: 100,
      });
      // Ooty carrots (38, 72) and Ponni rice (82) match
      const ids = lowPriceResult.map((p) => p.id);
      expect(ids).toContain("prod_ooty_carrots");
      expect(ids).toContain("prod_ponni_rice");
      expect(ids).not.toContain("prod_a2_ghee"); // Lowest option is 410
    });

    it("filters products by minimum rating", () => {
      const highRated = filterAndSortProducts(mockProducts, {
        minRating: 4.8,
      });
      expect(highRated.every((p) => p.rating >= 4.8)).toBe(true);
      expect(highRated.map((p) => p.id)).not.toContain("prod_ooty_carrots"); // 4.7
    });

    it("filters products by minimum discount percentage", () => {
      // 20% discount or above
      const bigDiscounts = filterAndSortProducts(mockProducts, {
        minDiscount: 20,
      });
      expect(bigDiscounts.length).toBe(1);
      expect(bigDiscounts[0]?.id).toBe("prod_ooty_carrots"); // 24% discount
    });

    it("filters products by pack size / volume option", () => {
      const oneLitreProducts = filterAndSortProducts(mockProducts, {
        packSizes: ["1 L"],
      });
      expect(oneLitreProducts.length).toBe(2);
      expect(oneLitreProducts.map((p) => p.id)).toEqual([
        "prod_groundnut_oil",
        "prod_a2_ghee",
      ]);
    });

    it("filters products by method and quality attribute", () => {
      const bilonaMethod = filterAndSortProducts(mockProducts, {
        methods: ["bilona"],
      });
      expect(bilonaMethod.length).toBe(1);
      expect(bilonaMethod[0]?.id).toBe("prod_a2_ghee");
    });

    it("handles full multi-criteria combination correctly", () => {
      const complexFiltered = filterAndSortProducts(mockProducts, {
        categories: ["cold-pressed-oils"],
        inStockOnly: true,
        minPrice: 100,
        maxPrice: 500,
        minRating: 4.8,
        packSizes: ["500 ml"],
        methods: ["wood_churned"],
      });
      expect(complexFiltered.length).toBe(1);
      expect(complexFiltered[0]?.id).toBe("prod_groundnut_oil");
    });

    it("returns empty array when filter combination has no matches", () => {
      const noMatch = filterAndSortProducts(mockProducts, {
        categories: ["staples-grains"],
        methods: ["bilona"],
      });
      expect(noMatch.length).toBe(0);
    });
  });

  describe("Sorting Behaviors", () => {
    it("sorts by popularity (review count descending) by default", () => {
      const sorted = filterAndSortProducts(mockProducts, { sort: "popular" });
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i]!.reviewCount).toBeGreaterThanOrEqual(sorted[i + 1]!.reviewCount);
      }
    });

    it("sorts by price: low to high", () => {
      const sorted = filterAndSortProducts(mockProducts, { sort: "price_asc" });
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(getProductMinPrice(sorted[i]!)).toBeLessThanOrEqual(
          getProductMinPrice(sorted[i + 1]!)
        );
      }
    });

    it("sorts by price: high to low", () => {
      const sorted = filterAndSortProducts(mockProducts, { sort: "price_desc" });
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(getProductMinPrice(sorted[i]!)).toBeGreaterThanOrEqual(
          getProductMinPrice(sorted[i + 1]!)
        );
      }
    });

    it("sorts by customer rating descending", () => {
      const sorted = filterAndSortProducts(mockProducts, { sort: "rating" });
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i]!.rating).toBeGreaterThanOrEqual(sorted[i + 1]!.rating);
      }
    });

    it("sorts by discount percentage descending", () => {
      const sorted = filterAndSortProducts(mockProducts, { sort: "discount" });
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(getProductMaxDiscount(sorted[i]!)).toBeGreaterThanOrEqual(
          getProductMaxDiscount(sorted[i + 1]!)
        );
      }
      expect(sorted[0]?.id).toBe("prod_ooty_carrots"); // 24% discount is highest
    });
  });
});

describe("ProductService Integration with Live Mock Catalog", () => {
  it("fetches all products when no filters are supplied", async () => {
    const products = await productService.getProducts();
    expect(products.length).toBe(12);
  });

  it("filters live products by single category slug", async () => {
    const oils = await productService.getProducts({ category: "cold-pressed-oils" });
    expect(oils.length).toBe(3);
    expect(oils.every((p) => p.categorySlug === "cold-pressed-oils")).toBe(true);
  });

  it("filters live products across multiple categories", async () => {
    const multi = await productService.getProducts({
      categories: ["cold-pressed-oils", "staples-grains"],
    });
    expect(multi.length).toBe(6); // 3 oils + 3 staples
  });

  it("filters live products by inStockOnly flag", async () => {
    const inStock = await productService.getProducts({ inStockOnly: true });
    expect(inStock.length).toBe(12); // All 12 current mock products have active stock
  });

  it("filters live products by price range", async () => {
    const budgetItems = await productService.getProducts({
      minPrice: 30,
      maxPrice: 60,
    });
    // Ooty carrots (38), Tender coconut (48)
    expect(budgetItems.length).toBeGreaterThanOrEqual(2);
    const ids = budgetItems.map((p) => p.id);
    expect(ids).toContain("prod_ooty_carrots");
    expect(ids).toContain("prod_tender_coconut");
  });

  it("filters live products by pack size", async () => {
    const fiveLitreItems = await productService.getProducts({
      packSizes: ["5 L"],
    });
    expect(fiveLitreItems.length).toBe(1);
    expect(fiveLitreItems[0]?.id).toBe("prod_groundnut_oil");
  });

  it("filters live products by structured method & quality tags", async () => {
    const woodChurned = await productService.getProducts({
      methods: ["wood_churned"],
    });
    // Mara Chekku Groundnut Oil and Pure Cold Pressed Gingelly Sesame Oil
    expect(woodChurned.length).toBe(2);
    expect(woodChurned.map((p) => p.id)).toContain("prod_groundnut_oil");
    expect(woodChurned.map((p) => p.id)).toContain("prod_sesame_oil");
  });

  it("sorts live products by biggest discount", async () => {
    const discounted = await productService.getProducts({ sort: "discount" });
    expect(discounted.length).toBe(12);
    const topDiscount = getProductMaxDiscount(discounted[0]!);
    expect(topDiscount).toBe(24); // Ooty carrots
  });
});
