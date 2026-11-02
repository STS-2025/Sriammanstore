import type { Product } from "../types";

export interface MethodQualityOption {
  id: string;
  label: string;
  matcher: (p: Product) => boolean;
}

export const METHOD_QUALITY_OPTIONS: MethodQualityOption[] = [
  {
    id: "wood_churned",
    label: "Wood Churned / Mara Chekku",
    matcher: (p: Product) =>
      p.tags.some((t) => /wood churned|traditional churn/i.test(t)) ||
      (p.extraction ? /mara chekku|vaagai wood|wood mortar/i.test(p.extraction) : false),
  },
  {
    id: "organic",
    label: "Pure Organic / Farm Plucked",
    matcher: (p: Product) =>
      p.tags.some((t) => /pure organic|hill grown|morning harvest/i.test(t)) ||
      (p.extraction ? /organic/i.test(p.extraction) : false),
  },
  {
    id: "bilona",
    label: "Bilona Method (A2 Desi Cow)",
    matcher: (p: Product) =>
      p.tags.some((t) => /bilona method|a2 desi cow/i.test(t)) ||
      (p.extraction ? /bilona/i.test(p.extraction) : false),
  },
  {
    id: "chemical_free",
    label: "Chemical Free / Unpolished",
    matcher: (p: Product) =>
      p.tags.some((t) => /chemical free|unpolished/i.test(t)) ||
      (p.extraction ? /unpolished/i.test(p.extraction) : false),
  },
  {
    id: "stone_ground",
    label: "Stone Ground / Pulverized",
    matcher: (p: Product) =>
      p.tags.some((t) => /stone ground/i.test(t)) ||
      (p.extraction ? /stone/i.test(p.extraction) : false),
  },
];

export interface ProductFilterState {
  categories: string[];
  subcategories?: string[];
  inStockOnly: boolean;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  minDiscount: number;
  packSizes: string[];
  methods: string[];
  sort: "popular" | "rating" | "price_asc" | "price_desc" | "discount";
  search: string;
  onlyDeals?: boolean;
}

export const INITIAL_PRICE_BOUNDS = {
  min: 0,
  max: 2000,
};

export const INITIAL_FILTER_STATE: ProductFilterState = {
  categories: [],
  subcategories: [],
  inStockOnly: false,
  minPrice: INITIAL_PRICE_BOUNDS.min,
  maxPrice: INITIAL_PRICE_BOUNDS.max,
  minRating: 0,
  minDiscount: 0,
  packSizes: [],
  methods: [],
  sort: "popular",
  search: "",
  onlyDeals: false,
};

/**
 * Format variant pack size label canonically, e.g. "500 ml", "1 L", "6 pcs"
 */
export function formatPackSize(unitSize: string, unit: string): string {
  const cleanSize = unitSize.trim();
  const cleanUnit = unit.trim();
  return `${cleanSize} ${cleanUnit}`;
}

/**
 * Calculate max discount percentage across a product's variant options
 */
export function getProductMaxDiscount(product: Product): number {
  if (!product.options || product.options.length === 0) return 0;
  return Math.max(
    ...product.options.map((opt) =>
      opt.mrp > opt.offerPrice
        ? Math.round(((opt.mrp - opt.offerPrice) / opt.mrp) * 100)
        : 0
    )
  );
}

/**
 * Returns lowest offer price among options
 */
export function getProductMinPrice(product: Product): number {
  if (!product.options || product.options.length === 0) return 0;
  return Math.min(...product.options.map((o) => o.offerPrice));
}

/**
 * Returns highest offer price among options
 */
export function getProductMaxPrice(product: Product): number {
  if (!product.options || product.options.length === 0) return 0;
  return Math.max(...product.options.map((o) => o.offerPrice));
}

/**
 * Derives dynamic catalog price bounds
 */
export function getCatalogPriceBounds(products: Product[]): { min: number; max: number } {
  if (products.length === 0) return { min: 0, max: 2000 };
  let min = Infinity;
  let max = -Infinity;
  for (const p of products) {
    for (const opt of p.options) {
      if (opt.offerPrice < min) min = opt.offerPrice;
      if (opt.offerPrice > max) max = opt.offerPrice;
    }
  }
  return {
    min: Math.floor(min),
    max: Math.ceil(max),
  };
}

/**
 * Aggregates count of products per category slug and category display name
 */
export function getCategoryCounts(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of products) {
    if (p.categorySlug) {
      counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
    }
    if (p.category) {
      counts[p.category] = (counts[p.category] || 0) + 1;
      const normalizedNameSlug = p.category
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (normalizedNameSlug && normalizedNameSlug !== p.categorySlug) {
        counts[normalizedNameSlug] = (counts[normalizedNameSlug] || 0) + 1;
      }
    }
  }
  return counts;
}

/**
 * Aggregates count of products per subcategory name
 */
export function getSubcategoryCounts(products: Product[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const p of products) {
    if (p.subCategory && p.subCategory.trim()) {
      const clean = p.subCategory.trim();
      counts[clean] = (counts[clean] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Aggregates all unique pack sizes available in current catalog with counts
 */
export function getPackSizeOptions(
  products: Product[]
): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of products) {
    const productSizes = new Set<string>();
    for (const opt of p.options) {
      productSizes.add(formatPackSize(opt.unitSize, opt.unit));
    }
    for (const size of productSizes) {
      map.set(size, (map.get(size) || 0) + 1);
    }
  }

  // Predefined preferred ordering
  const preferredOrder = [
    "500 ml",
    "1 L",
    "2 L",
    "5 L",
    "250 ml",
    "250 g",
    "500 g",
    "1 kg",
    "5 kg",
    "25 kg",
    "200 g",
    "400 g",
    "6 pcs",
    "12 pcs",
    "1 pcs",
  ];

  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => {
      const idxA = preferredOrder.indexOf(a.label);
      const idxB = preferredOrder.indexOf(b.label);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.label.localeCompare(b.label);
    });
}

/**
 * Counts matching products for each structured extraction / method quality option
 */
export function getMethodQualityCounts(
  products: Product[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const opt of METHOD_QUALITY_OPTIONS) {
    counts[opt.id] = products.filter(opt.matcher).length;
  }
  return counts;
}

/**
 * Counts products meeting rating thresholds
 */
export function getRatingCounts(
  products: Product[]
): { rating: number; count: number }[] {
  const thresholds = [4.8, 4.5, 4.0];
  return thresholds.map((threshold) => ({
    rating: threshold,
    count: products.filter((p) => p.rating >= threshold).length,
  }));
}

/**
 * Counts products meeting discount thresholds
 */
export function getDiscountCounts(
  products: Product[]
): { discount: number; count: number }[] {
  const thresholds = [10, 15, 20];
  return thresholds.map((threshold) => ({
    discount: threshold,
    count: products.filter((p) => getProductMaxDiscount(p) >= threshold).length,
  }));
}

/**
 * Pure filter and sort engine applied to product list
 */
export function filterAndSortProducts(
  products: Product[],
  filter: Partial<ProductFilterState>,
  priceBounds = INITIAL_PRICE_BOUNDS
): Product[] {
  const filtered = products.filter((p) => {
    // 1. Text Search
    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        (p.tamilName && p.tamilName.includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(q)) ||
        p.brand.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        (p.extraction && p.extraction.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }

    // 2. Flash Deals / Deals
    if (filter.onlyDeals) {
      const isDeal = p.isFlashDeal || getProductMaxDiscount(p) >= 15;
      if (!isDeal) return false;
    }

    // 3. Category Multi-select (if empty or contains 'all', passes)
    if (
      filter.categories &&
      filter.categories.length > 0 &&
      !filter.categories.includes("all")
    ) {
      const matchesCategory = filter.categories.some((cat) => {
        const cleanCat = cat.trim().toLowerCase();
        const pSlug = (p.categorySlug || "").toLowerCase();
        const pCat = (p.category || "").toLowerCase();
        const pNormalized = pCat.replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-");
        return (
          pSlug === cleanCat ||
          pCat === cleanCat ||
          pNormalized === cleanCat
        );
      });
      if (!matchesCategory) {
        return false;
      }
    }

    // 3b. Subcategory Multi-select
    if (filter.subcategories && filter.subcategories.length > 0) {
      if (!p.subCategory) return false;
      const cleanProdSub = p.subCategory.trim().toLowerCase();
      const matchesSubcategory = filter.subcategories.some(
        (sub) => sub.trim().toLowerCase() === cleanProdSub
      );
      if (!matchesSubcategory) {
        return false;
      }
    }

    // 4. Variant-level Candidate Selection (scoped to packSizes if selected)
    let candidateOptions = p.options;
    if (filter.packSizes && filter.packSizes.length > 0) {
      candidateOptions = candidateOptions.filter((opt) =>
        filter.packSizes!.includes(formatPackSize(opt.unitSize, opt.unit))
      );
      if (candidateOptions.length === 0) return false;
    }

    // 5. In Stock Only (at least one candidate variant option has stock > 0)
    if (filter.inStockOnly) {
      const hasStock = candidateOptions.some((o) => o.stock > 0);
      if (!hasStock) return false;
    }

    // 6. Price Range (at least one candidate variant option falls within min and max)
    const minP = filter.minPrice !== undefined ? filter.minPrice : priceBounds.min;
    const maxP = filter.maxPrice !== undefined ? filter.maxPrice : priceBounds.max;
    const inPriceRange = candidateOptions.some(
      (o) => o.offerPrice >= minP && o.offerPrice <= maxP
    );
    if (!inPriceRange) return false;

    // 7. Minimum Rating
    if (filter.minRating && filter.minRating > 0) {
      if (p.rating < filter.minRating) return false;
    }

    // 8. Minimum Discount %
    if (filter.minDiscount && filter.minDiscount > 0) {
      const maxCandidateDiscount = Math.max(
        ...candidateOptions.map((opt) =>
          opt.mrp > opt.offerPrice
            ? Math.round(((opt.mrp - opt.offerPrice) / opt.mrp) * 100)
            : 0
        )
      );
      if (maxCandidateDiscount < filter.minDiscount) return false;
    }

    // 9. Method & Quality
    if (filter.methods && filter.methods.length > 0) {
      const matchesAnySelectedMethod = filter.methods.some((methodId) => {
        const option = METHOD_QUALITY_OPTIONS.find((m) => m.id === methodId);
        return option ? option.matcher(p) : false;
      });
      if (!matchesAnySelectedMethod) return false;
    }

    return true;
  });

  // Sorting
  const sort = filter.sort || "popular";
  const sorted = [...filtered];

  if (sort === "price_asc") {
    sorted.sort((a, b) => getProductMinPrice(a) - getProductMinPrice(b));
  } else if (sort === "price_desc") {
    sorted.sort((a, b) => getProductMinPrice(b) - getProductMinPrice(a));
  } else if (sort === "rating") {
    sorted.sort((a, b) => b.rating - a.rating);
  } else if (sort === "discount") {
    sorted.sort((a, b) => getProductMaxDiscount(b) - getProductMaxDiscount(a));
  } else {
    // default: "popular"
    sorted.sort((a, b) => b.reviewCount - a.reviewCount);
  }

  return sorted;
}
