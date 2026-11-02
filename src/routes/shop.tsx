import { useState, useEffect, useMemo, useCallback } from "react";
import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { ProductCard } from "../components/product/ProductCard";
import { productService } from "../services/productService";
import type { Product, Category } from "../types";
import { useLanguage } from "../context/LanguageContext";
import {
  filterAndSortProducts,
  getCategoryCounts,
  getSubcategoryCounts,
  getCatalogPriceBounds,
  getPackSizeOptions,
  getMethodQualityCounts,
  getRatingCounts,
  getDiscountCounts,
  METHOD_QUALITY_OPTIONS,
  INITIAL_FILTER_STATE,
  type ProductFilterState,
} from "../lib/filterUtils";

export const Route = createFileRoute("/shop")({
  validateSearch: (
    search: Record<string, unknown>
  ): {
    category?: string | undefined;
    subCategory?: string | undefined;
    q?: string | undefined;
    deals?: boolean | undefined;
    sort?: "popular" | "rating" | "price_asc" | "price_desc" | "discount" | undefined;
  } => ({
    category: (search["category"] as string) || undefined,
    subCategory: (search["subCategory"] as string) || undefined,
    q: (search["q"] as string) || undefined,
    deals: Boolean(search["deals"]) || undefined,
    sort: (search["sort"] as "popular" | "rating" | "price_asc" | "price_desc" | "discount") || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Groceries & Wood Pressed Oils — Sri Amman Smart Store" },
      { name: "description", content: "Explore South Indian organic staples, grains, and oils." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const searchParams = useSearch({ from: "/shop" });
  const { t } = useLanguage();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The customer runtime uses the configured Firebase catalogue. Fixture mode is test-only.
  const catalogMode = "production-readonly" as const;
  const [productionDiagnostics, setProductionDiagnostics] = useState<{
    uniqueProductCount: number;
    totalRawDocuments: number;
    duplicateCount: number;
    posFieldsFilteredCount: number;
    isPartial: boolean;
    isComplete: boolean;
    totalCategoryDocsRead?: number | undefined;
    fallbackCategoryCount?: number | undefined;
    missingDocCategoryIds?: string[] | undefined;
    conflictsCount?: number | undefined;
    dataQualityErrors?: number | undefined;
    dataQualityWarnings?: number | undefined;
  } | null>(null);

  // Filter & Sorting state
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.category && searchParams.category !== "all"
      ? [searchParams.category]
      : []
  );
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    searchParams.subCategory && searchParams.subCategory !== "all"
      ? [searchParams.subCategory]
      : []
  );
  const [sortOption, setSortOption] = useState<
    "popular" | "rating" | "price_asc" | "price_desc" | "discount"
  >(searchParams.sort || "popular");
  const [onlyDeals, setOnlyDeals] = useState<boolean>(!!searchParams.deals);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.q || "");

  // Numerical & Facet Filters
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [selectedPackSizes, setSelectedPackSizes] = useState<string[]>([]);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  // Mobile Drawer State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);

  // Sync initial query params from TanStack router
  useEffect(() => {
    if (searchParams.category) {
      if (searchParams.category === "all") {
        setSelectedCategories([]);
      } else {
        setSelectedCategories([searchParams.category]);
      }
    }
    if (searchParams.subCategory) {
      if (searchParams.subCategory === "all") {
        setSelectedSubcategories([]);
      } else {
        setSelectedSubcategories([searchParams.subCategory]);
      }
    }
    if (searchParams.q !== undefined) {
      setSearchQuery(searchParams.q || "");
    }
    if (searchParams.deals !== undefined) {
      setOnlyDeals(Boolean(searchParams.deals));
    }
    if (searchParams.sort) {
      setSortOption(searchParams.sort);
    }
  }, [searchParams.category, searchParams.subCategory, searchParams.q, searchParams.deals, searchParams.sort]);

  // Load products & categories from active data source
  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    const targetMode = catalogMode;
    try {
      productService.setCatalogMode(targetMode);
      const [categoriesData, productsData] = await Promise.all([
        productService.getCategories(),
        productService.getProducts(),
      ]);
      setCategories(categoriesData || []);
      setAllProducts(productsData || []);

      if (targetMode === "production-readonly") {
        const fullResult = await productService.getFullProductionCatalogueResult();
        if (fullResult?.diagnostics) {
          setProductionDiagnostics({
            uniqueProductCount: fullResult.diagnostics.uniqueProductCount,
            totalRawDocuments: fullResult.diagnostics.totalRawDocuments,
            duplicateCount: fullResult.diagnostics.duplicateCount,
            posFieldsFilteredCount: fullResult.diagnostics.posFieldsFilteredCount,
            isPartial: fullResult.diagnostics.isPartial,
            isComplete: fullResult.diagnostics.isComplete,
            totalCategoryDocsRead: fullResult.diagnostics.categoryResolution?.totalCategoryDocsRead,
            fallbackCategoryCount: fullResult.diagnostics.categoryResolution?.fallbackCategoryCount,
            missingDocCategoryIds: fullResult.diagnostics.categoryResolution?.missingDocCategoryIds,
            conflictsCount: fullResult.diagnostics.categoryResolution?.conflicts.length,
            dataQualityErrors: fullResult.diagnostics.dataQualityReport?.errorCount,
            dataQualityWarnings: fullResult.diagnostics.dataQualityReport?.warningCount,
          });
        }
      } else {
        setProductionDiagnostics(null);
      }

      if (productsData && productsData.length > 0) {
        const bounds = getCatalogPriceBounds(productsData);
        setPriceRange([bounds.min, bounds.max]);
      }
    } catch (err: any) {
      console.error("Failed to load catalog:", err);
      // NEVER silently switch modes on error. Retain active mode and surface failure clearly.
      setError(
        err?.message ||
          "Failed to load product catalog. Please verify your connection or service status."
      );
    } finally {
      setLoading(false);
    }
  }, [catalogMode]);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  // Lock body scroll when mobile filter drawer is open & handle Escape key
  useEffect(() => {
    if (!isMobileFilterOpen) {
      document.body.style.overflow = "";
      return;
    }
    document.body.style.overflow = "hidden";
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileFilterOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileFilterOpen]);

  // Dynamic price bounds derived from loaded catalog
  const catalogPriceBounds = useMemo(() => {
    return getCatalogPriceBounds(allProducts);
  }, [allProducts]);

  // Dynamic facet counts
  const categoryCounts = useMemo(() => getCategoryCounts(allProducts), [allProducts]);
  const subcategoryCounts = useMemo(() => getSubcategoryCounts(allProducts), [allProducts]);
  const packSizeOptions = useMemo(() => getPackSizeOptions(allProducts), [allProducts]);
  const methodQualityCounts = useMemo(() => getMethodQualityCounts(allProducts), [allProducts]);
  const ratingCounts = useMemo(() => getRatingCounts(allProducts), [allProducts]);
  const discountCounts = useMemo(() => getDiscountCounts(allProducts), [allProducts]);

  // Active filter state snapshot
  const currentFilterState: ProductFilterState = useMemo(() => ({
    categories: selectedCategories,
    subcategories: selectedSubcategories,
    inStockOnly,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    minRating,
    minDiscount,
    packSizes: selectedPackSizes,
    methods: selectedMethods,
    sort: sortOption,
    search: searchQuery,
    onlyDeals,
  }), [
    selectedCategories,
    selectedSubcategories,
    inStockOnly,
    priceRange,
    minRating,
    minDiscount,
    selectedPackSizes,
    selectedMethods,
    sortOption,
    searchQuery,
    onlyDeals,
  ]);

  // Apply pure filtering & sorting
  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(allProducts, currentFilterState, catalogPriceBounds);
  }, [allProducts, currentFilterState, catalogPriceBounds]);

  // Calculate active filter count for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedSubcategories.length > 0) count += selectedSubcategories.length;
    if (inStockOnly) count++;
    if (
      priceRange[0] > catalogPriceBounds.min ||
      priceRange[1] < catalogPriceBounds.max
    ) {
      count++;
    }
    if (minRating > 0) count++;
    if (minDiscount > 0) count++;
    if (selectedPackSizes.length > 0) count += selectedPackSizes.length;
    if (selectedMethods.length > 0) count += selectedMethods.length;
    if (onlyDeals) count++;
    if (searchQuery.trim().length > 0) count++;
    return count;
  }, [
    selectedCategories,
    selectedSubcategories,
    inStockOnly,
    priceRange,
    catalogPriceBounds,
    minRating,
    minDiscount,
    selectedPackSizes,
    selectedMethods,
    onlyDeals,
    searchQuery,
  ]);

  // Reset all filters to initial defaults
  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setInStockOnly(false);
    setPriceRange([catalogPriceBounds.min, catalogPriceBounds.max]);
    setMinRating(0);
    setMinDiscount(0);
    setSelectedPackSizes([]);
    setSelectedMethods([]);
    setOnlyDeals(false);
    setSearchQuery("");
    setSortOption("popular");
  };

  // Toggle single category checkbox
  const handleToggleCategory = (slug: string) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  // Toggle subcategory checkbox
  const handleToggleSubcategory = (sub: string) => {
    setSelectedSubcategories((prev) =>
      prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]
    );
  };

  // Quick single category pill click
  const handleSelectQuickCategory = (slug: string) => {
    if (slug === "all") {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([slug]);
    }
  };

  // Toggle pack size selection
  const handleTogglePackSize = (sizeLabel: string) => {
    setSelectedPackSizes((prev) =>
      prev.includes(sizeLabel)
        ? prev.filter((s) => s !== sizeLabel)
        : [...prev, sizeLabel]
    );
  };

  // Toggle method & quality selection
  const handleToggleMethod = (methodId: string) => {
    setSelectedMethods((prev) =>
      prev.includes(methodId)
        ? prev.filter((m) => m !== methodId)
        : [...prev, methodId]
    );
  };

  // Safe handler for price range inputs
  const handleMinPriceChange = (value: number) => {
    const safeVal = Math.max(catalogPriceBounds.min, Math.min(value, priceRange[1]));
    setPriceRange([safeVal, priceRange[1]]);
  };

  const handleMaxPriceChange = (value: number) => {
    const safeVal = Math.min(catalogPriceBounds.max, Math.max(value, priceRange[0]));
    setPriceRange([priceRange[0], safeVal]);
  };

  // Active category display title
  const activeCategoryTitle = useMemo(() => {
    if (selectedCategories.length === 1) {
      const match = categories.find((c) => c.slug === selectedCategories[0]);
      return match ? t(match.name, match.tamilName) : "Shop Catalog";
    }
    if (selectedCategories.length > 1) {
      return `Filtered Catalog (${selectedCategories.length} Categories)`;
    }
    return "Explore All Aisles & Produce";
  }, [selectedCategories, categories, t]);

  // Reusable Sidebar Filter Content (used by desktop sidebar and mobile drawer)
  const renderFilterSections = () => (
    <div className="flex flex-col gap-space-lg">
      {/* Filter 1: In Stock Toggle */}
      <div className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
        <div className="flex flex-col">
          <span className="font-headline-sm text-xs md:text-sm font-bold text-on-surface">
            Available in Store
          </span>
          <span className="font-body-sm text-[11px] text-on-surface-variant">
            Exclude out of stock items
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="sr-only peer"
            aria-label="Toggle in stock only"
          />
          <div className="w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* Filter 2: Categories Multi-select */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-xs font-bold text-on-surface tracking-wide uppercase">
            Categories
          </h3>
          {selectedCategories.length > 0 && (
            <button
              onClick={() => setSelectedCategories([])}
              className="text-[11px] text-tertiary font-bold hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1 text-xs">
          {categories.map((cat) => {
            const isChecked = selectedCategories.includes(cat.slug);
            const count = categoryCounts[cat.slug] || 0;
            return (
              <label
                key={cat.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer group transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleCategory(cat.slug)}
                    className="w-4 h-4 rounded text-primary accent-primary focus:ring-0 cursor-pointer"
                  />
                  <span
                    className={`transition-colors ${
                      isChecked
                        ? "font-bold text-primary"
                        : "font-medium text-on-surface group-hover:text-primary"
                    }`}
                  >
                    {t(cat.name, cat.tamilName)}
                  </span>
                  {cat.source === "product-fallback" && (
                    <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
                      Fallback
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Filter 2b: Subcategories Multi-select */}
      {Object.keys(subcategoryCounts).length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-sm text-xs font-bold text-on-surface tracking-wide uppercase">
              Subcategories
            </h3>
            {selectedSubcategories.length > 0 && (
              <button
                onClick={() => setSelectedSubcategories([])}
                className="text-[11px] text-tertiary font-bold hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1 text-xs">
            {Object.entries(subcategoryCounts).map(([subName, count]) => {
              const isChecked = selectedSubcategories.includes(subName);
              return (
                <label
                  key={subName}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleSubcategory(subName)}
                      className="w-4 h-4 rounded text-primary accent-primary focus:ring-0 cursor-pointer"
                    />
                    <span
                      className={`transition-colors ${
                        isChecked
                          ? "font-bold text-primary"
                          : "font-medium text-on-surface group-hover:text-primary"
                      }`}
                    >
                      {subName}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter 3: Price Range Slider & Inputs */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wide">
            Price Range
          </h3>
          <span className="font-headline-sm text-xs font-bold text-primary">
            ₹{priceRange[0]} – ₹{priceRange[1]}
          </span>
        </div>

        {/* Range Slider for Max Price */}
        <div className="w-full relative py-1">
          <input
            type="range"
            min={catalogPriceBounds.min}
            max={catalogPriceBounds.max}
            step={10}
            value={priceRange[1]}
            onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer"
            aria-label="Filter maximum price slider"
          />
        </div>

        {/* Numeric inputs */}
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-surface-container-low px-2 py-1.5 rounded-lg flex items-center border border-outline-variant/30 focus-within:border-primary">
            <span className="text-xs text-on-surface-variant pr-1 font-bold">₹</span>
            <input
              type="number"
              min={catalogPriceBounds.min}
              max={priceRange[1]}
              value={priceRange[0]}
              onChange={(e) => handleMinPriceChange(Number(e.target.value))}
              className="w-full bg-transparent font-headline-sm text-xs font-bold text-on-surface focus:outline-none"
              aria-label="Minimum price"
            />
          </div>
          <span className="text-on-surface-variant text-xs font-bold">to</span>
          <div className="flex-1 bg-surface-container-low px-2 py-1.5 rounded-lg flex items-center border border-outline-variant/30 focus-within:border-primary">
            <span className="text-xs text-on-surface-variant pr-1 font-bold">₹</span>
            <input
              type="number"
              min={priceRange[0]}
              max={catalogPriceBounds.max}
              value={priceRange[1]}
              onChange={(e) => handleMaxPriceChange(Number(e.target.value))}
              className="w-full bg-transparent font-headline-sm text-xs font-bold text-on-surface focus:outline-none"
              aria-label="Maximum price"
            />
          </div>
        </div>
      </div>

      {/* Filter 4: Customer Ratings */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wide">
            Customer Rating
          </h3>
          {minRating > 0 && (
            <button
              onClick={() => setMinRating(0)}
              className="text-[11px] text-tertiary font-bold hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <label className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="rating_filter"
                checked={minRating === 0}
                onChange={() => setMinRating(0)}
                className="text-primary accent-primary cursor-pointer"
              />
              <span className="font-medium text-on-surface">Any Rating</span>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant">
              {allProducts.length}
            </span>
          </label>
          {ratingCounts.map(({ rating, count }) => (
            <label
              key={rating}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="rating_filter"
                  checked={minRating === rating}
                  onChange={() => setMinRating(rating)}
                  className="text-primary accent-primary cursor-pointer"
                />
                <div className="flex items-center gap-0.5 text-secondary">
                  {[...Array(5)].map((_, i) => (
                    <span
                      key={i}
                      className="material-symbols-outlined text-[15px]"
                      style={
                        i < Math.floor(rating)
                          ? { fontVariationSettings: "'FILL' 1" }
                          : {}
                      }
                    >
                      star
                    </span>
                  ))}
                </div>
                <span className="font-semibold text-on-surface">{rating}★ & above</span>
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                {count}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Filter 5: Discount Percentage */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wide">
            Discount
          </h3>
          {minDiscount > 0 && (
            <button
              onClick={() => setMinDiscount(0)}
              className="text-[11px] text-tertiary font-bold hover:underline cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <label className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer">
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="discount_filter"
                checked={minDiscount === 0}
                onChange={() => setMinDiscount(0)}
                className="text-primary accent-primary cursor-pointer"
              />
              <span className="font-medium text-on-surface">All Discounts</span>
            </div>
            <span className="text-[10px] font-bold text-on-surface-variant">
              {allProducts.length}
            </span>
          </label>
          {discountCounts.map(({ discount, count }) => (
            <label
              key={discount}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="discount_filter"
                  checked={minDiscount === discount}
                  onChange={() => setMinDiscount(discount)}
                  className="text-primary accent-primary cursor-pointer"
                />
                <span className="font-semibold text-on-surface">
                  {discount}% and above
                </span>
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                {count}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Filter 6: Pack Size / Volume Pills */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wide">
            Pack Size / Volume
          </h3>
          {selectedPackSizes.length > 0 && (
            <button
              onClick={() => setSelectedPackSizes([])}
              className="text-[11px] text-tertiary font-bold hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {packSizeOptions.map(({ label, count }) => {
            const isSelected = selectedPackSizes.includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleTogglePackSize(label)}
                className={`px-2.5 py-1 text-[11px] font-headline-sm rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? "bg-primary text-white font-bold shadow-sm"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold"
                }`}
              >
                <span>{label}</span>
                <span className={`text-[9px] ${isSelected ? "text-white/80" : "text-on-surface-variant"}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter 7: Method & Quality (Structured Attributes) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wide">
            Method & Quality
          </h3>
          {selectedMethods.length > 0 && (
            <button
              onClick={() => setSelectedMethods([])}
              className="text-[11px] text-tertiary font-bold hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1 text-xs">
          {METHOD_QUALITY_OPTIONS.map((opt) => {
            const isChecked = selectedMethods.includes(opt.id);
            const count = methodQualityCounts[opt.id] || 0;
            return (
              <label
                key={opt.id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleMethod(opt.id)}
                    className="w-4 h-4 rounded text-primary accent-primary focus:ring-0 cursor-pointer"
                  />
                  <span
                    className={`transition-colors ${
                      isChecked
                        ? "font-bold text-primary"
                        : "font-medium text-on-surface group-hover:text-primary"
                    }`}
                  >
                    {opt.label}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* VIP Membership Promotion Callout */}
      <div className="p-3 bg-secondary-fixed/30 rounded-xl flex items-start gap-2.5">
        <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">
          workspace_premium
        </span>
        <div className="flex flex-col">
          <span className="font-headline-sm text-xs font-bold text-on-secondary-fixed">
            Amman Smart VIP
          </span>
          <span className="font-body-sm text-[11px] text-on-secondary-fixed-variant leading-tight mt-0.5">
            Save an extra 5% to 8% automatically on all authentic cold-pressed & artisanal staples.
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]">
        {/* Express Dispatch Quality Callout Bar */}
        <section className="w-full bg-surface-container-high py-2 px-margin-desktop text-on-surface border-b border-outline-variant/15">
          <div className="max-w-[1320px] mx-auto flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-headline-sm text-xs font-bold text-primary">
                Express Dispatch Active:
              </span>
              <span className="text-on-surface-variant">
                Same-day batch delivery for cold-pressed extractions across local neighborhoods.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-[10px] bg-surface-container-lowest px-2 py-0.5 rounded text-primary font-bold shadow-sm">
                100% MARA CHEKKU VERIFIED
              </span>
              <span className="text-on-surface-variant hidden sm:inline">
                Lab Purity Reports Included
              </span>
            </div>
          </div>
        </section>

        <div className="max-w-[1320px] mx-auto px-margin-desktop py-space-md">
          {/* 1. Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="mb-3 flex items-center gap-2 text-xs text-on-surface-variant"
          >
            <span className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer">
              <span className="material-symbols-outlined text-[15px]">home</span>
              <span>Home</span>
            </span>
            <span className="material-symbols-outlined text-[13px] text-outline-variant">
              chevron_right
            </span>
            <span className="hover:text-primary transition-colors cursor-pointer">
              Catalog
            </span>
            {selectedCategories.length === 1 && selectedCategories[0] && (
              <>
                <span className="material-symbols-outlined text-[13px] text-outline-variant">
                  chevron_right
                </span>
                <span className="font-bold text-on-surface capitalize">
                  {selectedCategories[0].replace("-", " ")}
                </span>
              </>
            )}
          </nav>

          {/* 2. Top Header & Action Bar */}
          <header className="mb-6 flex flex-col gap-4 bg-surface-container-lowest p-4 md:p-6 rounded-2xl shadow-sm border border-outline-variant/15">
            
            
            
            {/* Live Production Active Notice Banner
            {catalogMode === "production-readonly" && (
              <div
                data-testid="production-mode-active-banner"
                className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[22px] text-amber-600 shrink-0 mt-0.5">
                    verified_user
                  </span>
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm flex items-center gap-2">
                      <span>Live Production Catalogue</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 rounded font-mono text-[10px]">
                        sri-amman-smart-store
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                      Showing real products from production Firestore (8 unique products from 20 raw documents, 12 duplicates resolved).
                      {productionDiagnostics?.isComplete && " Bounded cursor pagination verified complete."}
                      {productionDiagnostics?.totalCategoryDocsRead !== undefined && ` Live Categories: ${productionDiagnostics.totalCategoryDocsRead} verified document (Grocery), ${productionDiagnostics.fallbackCategoryCount ?? 1} product fallback (Spices & Masala Powders).`}
                      {productionDiagnostics?.dataQualityErrors !== undefined && ` Data Quality: ${productionDiagnostics.dataQualityErrors} Critical Errors, ${productionDiagnostics.dataQualityWarnings ?? 0} Warnings.`}
                      {" Live customer cart, addresses, checkout, and orders are active."}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to="/prod-preview"
                    className="px-3 py-1.5 rounded-xl bg-surface-container-lowest text-on-surface font-bold text-xs border border-outline-variant/30 hover:bg-surface-container transition-all"
                  >
                    Inspect Raw &rarr;
                  </Link>
                </div>
              </div>
            )} */}




            {/* Developer Catalogue Source Switcher */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">



                  {/* <span className="text-[10px] font-headline-sm uppercase tracking-wider text-secondary font-bold bg-secondary-fixed/40 px-2 py-0.5 rounded-full">
                    {catalogMode === "production-readonly" ? "Live Production" : "Artisanal Fresh"}
                  </span> */}




                  <span className="text-xs text-on-surface-variant">
                    {loading ? "Loading..." : "Verified Quality"}
                  </span>
                </div>
                <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
                  {activeCategoryTitle}
                </h1>
                <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">
                  Showing{" "}
                  <strong className="text-on-surface font-bold">
                    {filteredProducts.length} {catalogMode === "production-readonly" ? "production" : "authenticated"} items
                  </strong>{" "}
                  {catalogMode === "production-readonly"
                    ? "from the live production Firestore catalogue (sri-amman-smart-store)."
                    : "sourced directly from regional South Indian heritage producers."}
                </p>
              </div>

              {/* Sorting & Mobile Filter Trigger */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                {/* Mobile Filter Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed px-3.5 py-2 rounded-xl font-headline-sm text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                    sort
                  </span>
                  <label
                    htmlFor="sortDropdown"
                    className="text-xs font-medium text-on-surface-variant whitespace-nowrap"
                  >
                    Sort:
                  </label>
                  <select
                    id="sortDropdown"
                    value={sortOption}
                    onChange={(e) =>
                      setSortOption(
                        e.target.value as
                          | "popular"
                          | "rating"
                          | "price_asc"
                          | "price_desc"
                          | "discount"
                      )
                    }
                    className="bg-transparent text-xs font-headline-sm font-bold text-primary focus:outline-none cursor-pointer"
                  >
                    <option value="popular">Most Popular</option>
                    <option value="rating">Customer Rating (Highest)</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="discount">Biggest Discount (%)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Category Navigation Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-outline-variant/15 pt-3">
              <button
                type="button"
                onClick={() => handleSelectQuickCategory("all")}
                className={`px-3 py-1.5 rounded-full font-headline-sm text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedCategories.length === 0
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                All Aisles ({allProducts.length})
              </button>
              {categories.map((cat) => {
                const isActive =
                  selectedCategories.length === 1 &&
                  selectedCategories[0] === cat.slug;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectQuickCategory(cat.slug)}
                    className={`px-3 py-1.5 rounded-full font-headline-sm text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {t(cat.name, cat.tamilName)}
                  </button>
                );
              })}

              <span className="h-4 w-px bg-outline-variant/30 shrink-0 mx-1"></span>

              <button
                type="button"
                onClick={() => setOnlyDeals((prev) => !prev)}
                className={`px-3 py-1.5 rounded-full font-headline-sm text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                  onlyDeals
                    ? "bg-tertiary text-white shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span>%</span>
                <span>Flash Deals</span>
              </button>
            </div>

            {/* Active Filters Bar / Chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 bg-surface-container-low/60 p-2.5 rounded-xl border border-outline-variant/15">
                <span className="text-xs font-headline-sm font-bold text-on-surface-variant flex items-center gap-1 pl-1">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Active:
                </span>

                {/* Search chip */}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm">
                    <span>Search: "{searchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="hover:text-error cursor-pointer flex items-center"
                      title="Clear search"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}

                {/* Only Deals chip */}
                {onlyDeals && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-tertiary font-headline-sm text-xs font-bold rounded-full shadow-sm">
                    <span>Flash Deals Only</span>
                    <button
                      type="button"
                      onClick={() => setOnlyDeals(false)}
                      className="hover:text-error cursor-pointer flex items-center"
                      title="Clear deals filter"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}

                {/* Category chips */}
                {selectedCategories.map((slug) => {
                  const cat = categories.find((c) => c.slug === slug);
                  const label = cat ? t(cat.name, cat.tamilName) : slug;
                  return (
                    <span
                      key={slug}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm"
                    >
                      <span>{label}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleCategory(slug)}
                        className="hover:text-error cursor-pointer flex items-center"
                        title={`Remove ${label}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  );
                })}

                {/* In stock chip */}
                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm">
                    <span>In Stock Only</span>
                    <button
                      type="button"
                      onClick={() => setInStockOnly(false)}
                      className="hover:text-error cursor-pointer flex items-center"
                      title="Remove stock filter"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}

                {/* Price Range chip */}
                {(priceRange[0] > catalogPriceBounds.min ||
                  priceRange[1] < catalogPriceBounds.max) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm">
                    <span>₹{priceRange[0]} – ₹{priceRange[1]}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setPriceRange([catalogPriceBounds.min, catalogPriceBounds.max])
                      }
                      className="hover:text-error cursor-pointer flex items-center"
                      title="Reset price range"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}

                {/* Rating chip */}
                {minRating > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm">
                    <span>Rating {minRating}★+</span>
                    <button
                      type="button"
                      onClick={() => setMinRating(0)}
                      className="hover:text-error cursor-pointer flex items-center"
                      title="Clear rating filter"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}

                {/* Discount chip */}
                {minDiscount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm">
                    <span>{minDiscount}%+ OFF</span>
                    <button
                      type="button"
                      onClick={() => setMinDiscount(0)}
                      className="hover:text-error cursor-pointer flex items-center"
                      title="Clear discount filter"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                )}

                {/* Pack Size chips */}
                {selectedPackSizes.map((size) => (
                  <span
                    key={size}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm"
                  >
                    <span>{size}</span>
                    <button
                      type="button"
                      onClick={() => handleTogglePackSize(size)}
                      className="hover:text-error cursor-pointer flex items-center"
                      title={`Remove pack size ${size}`}
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </span>
                ))}

                {/* Method & Quality chips */}
                {selectedMethods.map((methodId) => {
                  const opt = METHOD_QUALITY_OPTIONS.find((m) => m.id === methodId);
                  const label = opt ? opt.label : methodId;
                  return (
                    <span
                      key={methodId}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm"
                    >
                      <span>{label}</span>
                      <button
                        type="button"
                        onClick={() => handleToggleMethod(methodId)}
                        className="hover:text-error cursor-pointer flex items-center"
                        title={`Remove ${label}`}
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  );
                })}

                {/* Reset all button */}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="font-headline-sm text-xs font-bold text-tertiary hover:underline px-2 py-1 ml-auto cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </header>

          {/* 3. Two-Column Layout (Sidebar + Main Grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            {/* Desktop Left Sidebar (lg:col-span-3, sticky) */}
            <aside className="hidden lg:flex lg:col-span-3 bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-outline-variant/15 flex-col gap-space-lg sticky top-[190px] max-h-[calc(100vh-210px)] overflow-y-auto scrollbar-none">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/15">
                <h2 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    filter_list
                  </span>
                  Refine Catalog
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-headline-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-bold">
                    {filteredProducts.length} Items
                  </span>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-[11px] font-bold text-tertiary hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {renderFilterSections()}
            </aside>

            {/* Right Main Product Grid Area (lg:col-span-9) */}
            <section className="lg:col-span-9 flex flex-col gap-space-lg">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-space-md py-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-surface-container-low rounded-2xl aspect-[4/5] animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-surface-container-lowest rounded-3xl p-12 text-center max-w-lg mx-auto border border-error/30 my-8 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center text-3xl mx-auto mb-4">
                    <span className="material-symbols-outlined text-[32px]">error</span>
                  </div>
                  <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-2">
                    Failed to Load Catalog
                  </h3>
                  <p className="font-body-sm text-xs text-on-surface-variant mb-6">
                    {error}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => loadCatalog()}
                      className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer"
                    >
                      Retry Loading
                    </button>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-3xl p-12 text-center max-w-lg mx-auto border border-outline-variant/20 my-8 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-3xl mx-auto mb-4">
                    🌾
                  </div>
                  <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-2">
                    No Harvest Items Found
                  </h3>
                  <p className="font-body-sm text-xs text-on-surface-variant mb-6">
                    We couldn't find items matching your active category or filter combination.
                    Try broadening your price range or clearing selected filters.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer"
                    >
                      Reset All Filters
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-space-md">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        readOnly={false}
                      />
                    ))}
                  </div>

                  {/* Results Count & Quality Assurance Blocks */}
                  <div className="p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/15 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-on-surface-variant">
                    <div>
                      Showing{" "}
                      <strong className="text-on-surface font-semibold">
                        1 – {filteredProducts.length}
                      </strong>{" "}
                      of{" "}
                      <strong className="text-on-surface font-semibold">
                        {allProducts.length}
                      </strong>{" "}
                      {catalogMode === "production-readonly" ? "production" : "curated"} items
                      {catalogMode === "production-readonly" && productionDiagnostics && (
                        <span className="text-[11px] text-on-surface-variant block mt-0.5">
                          (Resolved from {productionDiagnostics.totalRawDocuments} raw Firestore docs &bull; {productionDiagnostics.duplicateCount} duplicates merged via deterministic precedence)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-primary font-semibold">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      <span>100% Quality Guaranteed</span>
                    </div>
                  </div>

                  {/* Informational Quality Assurance Block from Stitch */}
                  <section className="bg-surface-container p-space-lg rounded-xl grid grid-cols-1 md:grid-cols-3 gap-space-md mt-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-[28px]">
                        thermostat
                      </span>
                      <div>
                        <h4 className="font-headline-sm text-xs font-bold text-on-surface">
                          Cold Extracted (&lt;38°C)
                        </h4>
                        <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                          Wood-churned at strictly controlled ambient temperatures to preserve polyphenols & micronutrients.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-primary text-[28px]">
                        no_drinks
                      </span>
                      <div>
                        <h4 className="font-headline-sm text-xs font-bold text-on-surface">
                          Zero Chemical Refining
                        </h4>
                        <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                          No bleaching, zero trans fats, and absolutely free from artificial solvents or preservatives.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-secondary text-[28px]">
                        stars
                      </span>
                      <div>
                        <h4 className="font-headline-sm text-xs font-bold text-on-surface">
                          FSSAI Certified Freshness
                        </h4>
                        <p className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                          Batch testing certificates available upon scan of the QR code on every bottle label.
                        </p>
                      </div>
                    </div>
                  </section>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* Mobile Filter Drawer / Bottom Sheet */}
      {isMobileFilterOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Filter catalog"
          className="fixed inset-0 z-50 flex justify-end"
        >
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileFilterOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer content panel */}
          <div className="relative w-full max-w-md bg-surface-container-lowest h-full z-10 shadow-2xl flex flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-outline-variant/20 bg-surface-container-lowest">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  tune
                </span>
                <h2 className="font-headline-sm text-base font-bold text-on-surface">
                  Refine Catalog
                </h2>
                <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                  {filteredProducts.length} Results
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                title="Close filters"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Scrollable Filter Sections */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-none">
              {renderFilterSections()}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2.5 px-4 rounded-xl font-headline-sm text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer text-center"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl font-headline-sm text-xs font-bold bg-primary text-white hover:bg-primary-container transition-colors shadow-md cursor-pointer text-center"
              >
                Apply ({filteredProducts.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
