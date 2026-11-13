import { useState, useEffect, useMemo, useCallback } from "react";
import { createFileRoute, useSearch } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { ProductCard } from "../components/product/ProductCard";
import { productService } from "../services/productService";
import type { Product, Category } from "../types";
import { useLanguage } from "../context/LanguageContext";
import {
  filterAndSortProducts,
  getCatalogPriceBounds,
  formatPackSize,
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

  // Category browsing, deals, search, and sorting state
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
  const [searchQuery, setSearchQuery] = useState<string>(searchParams.q || "");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPackSizes, setSelectedPackSizes] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [minDiscount, setMinDiscount] = useState(0);
  const [customPriceRange, setCustomPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

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
    } else {
      setSelectedSubcategories([]);
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

  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileFiltersOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileFiltersOpen]);

  const catalogPriceBounds = useMemo(() => getCatalogPriceBounds(allProducts), [allProducts]);
  const activePriceRange = customPriceRange || catalogPriceBounds;
  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of allProducts) {
      const brand = product.brand?.trim();
      if (brand) counts.set(brand, (counts.get(brand) || 0) + 1);
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [allProducts]);
  const packSizeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of allProducts) {
      const sizes = new Set(product.options.map((option) => formatPackSize(option.unitSize, option.unit)));
      for (const size of sizes) counts.set(size, (counts.get(size) || 0) + 1);
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));
  }, [allProducts]);
  const categoryProductCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of allProducts) {
      counts.set(product.categorySlug, (counts.get(product.categorySlug) || 0) + 1);
    }
    return counts;
  }, [allProducts]);
  const filterCount = selectedCategories.length + selectedSubcategories.length + selectedBrands.length +
    selectedPackSizes.length + (onlyDeals ? 1 : 0) + (inStockOnly ? 1 : 0) +
    (minRating ? 1 : 0) + (minDiscount ? 1 : 0) + (customPriceRange ? 1 : 0);

  // Subcategory navigation for the active category scope
  const railSubcategories = useMemo(() => {
    const scopedCategories = selectedCategories.length
      ? categories.filter((category) => selectedCategories.includes(category.slug))
      : categories;
    const scopedProducts = selectedCategories.length
      ? allProducts.filter((product) => selectedCategories.includes(product.categorySlug))
      : allProducts;
    const names = new Map<string, string>();
    for (const category of scopedCategories) {
      for (const name of category.subcategories || []) {
        const cleanName = name.trim();
        if (cleanName) names.set(cleanName.toLocaleLowerCase(), cleanName);
      }
    }
    for (const product of scopedProducts) {
      const cleanName = product.subCategory?.trim();
      if (cleanName) names.set(cleanName.toLocaleLowerCase(), cleanName);
    }

    return [...names.values()]
      .map((name) => {
        const matchingProducts = scopedProducts.filter(
          (product) => product.subCategory?.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
        );
        const categoryImage = scopedCategories.find((category) =>
          category.subcategories?.some(
            (subcategory) => subcategory.trim().toLocaleLowerCase() === name.toLocaleLowerCase(),
          ),
        )?.image;
        return {
          name,
          count: matchingProducts.length,
          image: matchingProducts.find((product) => product.imageUrl)?.imageUrl || categoryImage || "/placeholders/grocery.svg",
        };
      })
      .filter((subcategory) => subcategory.count > 0);
  }, [allProducts, categories, selectedCategories]);
  const categoryScopeProductCount = useMemo(
    () => selectedCategories.length
      ? allProducts.filter((product) => selectedCategories.includes(product.categorySlug)).length
      : allProducts.length,
    [allProducts, selectedCategories],
  );
  const currentFilterState = useMemo(() => ({
    categories: selectedCategories,
    subcategories: selectedSubcategories,
    sort: sortOption,
    search: searchQuery,
    onlyDeals,
    brands: selectedBrands,
    packSizes: selectedPackSizes,
    inStockOnly,
    minPrice: activePriceRange.min,
    maxPrice: activePriceRange.max,
    minRating,
    minDiscount,
  }), [
    selectedCategories,
    selectedSubcategories,
    sortOption,
    searchQuery,
    onlyDeals,
    selectedBrands,
    selectedPackSizes,
    inStockOnly,
    activePriceRange,
    minRating,
    minDiscount,
  ]);

  // Apply category, subcategory, search, and deal selection before sorting.
  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(allProducts, currentFilterState, catalogPriceBounds);
  }, [allProducts, currentFilterState, catalogPriceBounds]);

  // Reset browse/search state when the current selection has no products.
  const handleResetCatalog = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setOnlyDeals(false);
    setSearchQuery("");
    setSortOption("popular");
    setSelectedBrands([]);
    setSelectedPackSizes([]);
    setInStockOnly(false);
    setMinRating(0);
    setMinDiscount(0);
    setCustomPriceRange(null);
  };

  const toggleSelection = (items: string[], item: string, setter: (next: string[]) => void) => {
    setter(items.includes(item) ? items.filter((value) => value !== item) : [...items, item]);
  };

  const handleSelectRailSubcategory = (subcategory?: string) => {
    setSelectedSubcategories(subcategory ? [subcategory] : []);
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
    return "Explore All Aisles & Products";
  }, [selectedCategories, categories, t]);

  const renderFilterPanel = (mobile = false) => (
    <div className="bg-surface-container-lowest text-on-surface">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant/15 bg-surface-container-lowest px-4 py-3">
        <div>
          <h2 className="text-sm font-extrabold">Filters</h2>
          <p className="text-[11px] text-on-surface-variant">{filteredProducts.length} products</p>
        </div>
        <div className="flex items-center gap-3">
          {filterCount > 0 && (
            <button type="button" onClick={handleResetCatalog} className="text-xs font-bold text-primary hover:underline">
              Clear all
            </button>
          )}
          {mobile && (
            <button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-outline-variant/15 px-4">
        <details open className="py-3">
          <summary className="cursor-pointer list-none text-xs font-extrabold">Categories</summary>
          <div className="mt-3 space-y-2">
            {categories.map((category) => {
              const count = categoryProductCounts.get(category.slug) || 0;
              const checked = selectedCategories.includes(category.slug);
              return (
                <label key={category.slug} className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      toggleSelection(selectedCategories, category.slug, setSelectedCategories);
                      setSelectedSubcategories([]);
                    }}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  <span className="min-w-0 flex-1">{t(category.name, category.tamilName)}</span>
                  <span className="text-[10px] text-on-surface-variant">{count}</span>
                </label>
              );
            })}
          </div>
        </details>

        {railSubcategories.length > 0 && (
          <details open className="py-3">
            <summary className="cursor-pointer list-none text-xs font-extrabold">Aisle / subcategory</summary>
            <div className="mt-3 space-y-2">
              {railSubcategories.map((subcategory) => (
                <label key={subcategory.name} className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedSubcategories.some((value) => value.toLocaleLowerCase() === subcategory.name.toLocaleLowerCase())}
                    onChange={() => toggleSelection(selectedSubcategories, subcategory.name, setSelectedSubcategories)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  <span className="min-w-0 flex-1">{subcategory.name}</span>
                  <span className="text-[10px] text-on-surface-variant">{subcategory.count}</span>
                </label>
              ))}
            </div>
          </details>
        )}

        <details open className="py-3">
          <summary className="cursor-pointer list-none text-xs font-extrabold">Price range</summary>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-[10px] font-semibold text-on-surface-variant">
              Minimum
              <input
                type="number"
                min={catalogPriceBounds.min}
                max={activePriceRange.max}
                value={activePriceRange.min}
                onChange={(event) => setCustomPriceRange({
                  min: Math.min(Number(event.target.value) || catalogPriceBounds.min, activePriceRange.max),
                  max: activePriceRange.max,
                })}
                className="mt-1 w-full rounded-lg border border-outline-variant/25 bg-white px-2 py-1.5 text-xs text-on-surface"
              />
            </label>
            <label className="text-[10px] font-semibold text-on-surface-variant">
              Maximum
              <input
                type="number"
                min={activePriceRange.min}
                max={catalogPriceBounds.max}
                value={activePriceRange.max}
                onChange={(event) => setCustomPriceRange({
                  min: activePriceRange.min,
                  max: Math.max(Number(event.target.value) || catalogPriceBounds.max, activePriceRange.min),
                })}
                className="mt-1 w-full rounded-lg border border-outline-variant/25 bg-white px-2 py-1.5 text-xs text-on-surface"
              />
            </label>
          </div>
          <p className="mt-1 text-[10px] text-on-surface-variant">Prices shown in ₹</p>
        </details>

        {brandOptions.length > 0 && (
          <details open className="py-3">
            <summary className="cursor-pointer list-none text-xs font-extrabold">Brand</summary>
            <div className="mt-3 space-y-2">
              {brandOptions.map(([brand, count]) => (
                <label key={brand} className="flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleSelection(selectedBrands, brand, setSelectedBrands)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  <span className="min-w-0 flex-1">{brand}</span>
                  <span className="text-[10px] text-on-surface-variant">{count}</span>
                </label>
              ))}
            </div>
          </details>
        )}

        <details open className="py-3">
          <summary className="cursor-pointer list-none text-xs font-extrabold">Customer rating</summary>
          <div className="mt-3 space-y-2">
            {[4, 3].map((rating) => (
              <label key={rating} className="flex cursor-pointer items-center gap-2 text-xs">
                <input type="radio" name={mobile ? "mobile-rating" : "desktop-rating"} checked={minRating === rating} onChange={() => setMinRating(rating)} className="h-3.5 w-3.5 accent-primary" />
                <span>{rating}+ ★</span>
              </label>
            ))}
            <button type="button" onClick={() => setMinRating(0)} className={`text-[10px] font-semibold ${minRating === 0 ? "text-primary" : "text-on-surface-variant"}`}>Any rating</button>
          </div>
        </details>

        <details open className="py-3">
          <summary className="cursor-pointer list-none text-xs font-extrabold">Offers & availability</summary>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input type="checkbox" checked={onlyDeals} onChange={(event) => setOnlyDeals(event.target.checked)} className="h-3.5 w-3.5 accent-primary" />
              <span>Deals and special offers</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} className="h-3.5 w-3.5 accent-primary" />
              <span>In stock only</span>
            </label>
            <label className="flex items-center gap-2 text-xs">
              <span className="text-on-surface-variant">Minimum discount</span>
              <select value={minDiscount} onChange={(event) => setMinDiscount(Number(event.target.value))} className="ml-auto rounded-md border border-outline-variant/20 bg-white px-1.5 py-1 text-[11px]">
                <option value={0}>Any</option><option value={10}>10%+</option><option value={15}>15%+</option><option value={20}>20%+</option><option value={30}>30%+</option>
              </select>
            </label>
          </div>
        </details>

        {packSizeOptions.length > 0 && (
          <details className="py-3">
            <summary className="cursor-pointer list-none text-xs font-extrabold">Pack size</summary>
            <div className="mt-3 space-y-2">
              {packSizeOptions.map(([size, count]) => (
                <label key={size} className="flex cursor-pointer items-center gap-2 text-xs">
                  <input type="checkbox" checked={selectedPackSizes.includes(size)} onChange={() => toggleSelection(selectedPackSizes, size, setSelectedPackSizes)} className="h-3.5 w-3.5 accent-primary" />
                  <span className="min-w-0 flex-1">{size}</span><span className="text-[10px] text-on-surface-variant">{count}</span>
                </label>
              ))}
            </div>
          </details>
        )}

        <div className="py-3">
          <label htmlFor={mobile ? "mobile-sort" : "desktop-sort"} className="mb-2 block text-xs font-extrabold">Sort by</label>
          <select
            id={mobile ? "mobile-sort" : "desktop-sort"}
            value={sortOption}
            onChange={(event) => setSortOption(event.target.value as typeof sortOption)}
            className="w-full rounded-lg border border-outline-variant/25 bg-white px-2.5 py-2 text-xs font-semibold"
          >
            <option value="popular">Popularity</option>
            <option value="rating">Customer rating</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="discount">Discount</option>
          </select>
        </div>
      </div>
      {mobile && (
        <div className="sticky bottom-0 border-t border-outline-variant/15 bg-surface-container-lowest p-3">
          <button type="button" onClick={() => setMobileFiltersOpen(false)} className="w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-white">
            Show {filteredProducts.length} results
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]">
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

          {/* 2. Heading and advanced-filter access */}
          <header className="mb-4 flex min-h-10 items-center justify-between gap-3 sm:mb-6">
            <h1 className="min-w-0 font-headline-lg text-lg font-extrabold tracking-tight text-on-surface sm:text-xl md:text-2xl">
              {activeCategoryTitle}
            </h1>
            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden text-xs text-on-surface-variant sm:inline">{filteredProducts.length} products</span>
              <button type="button" onClick={() => setMobileFiltersOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-3 text-xs font-bold shadow-sm">
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span className="hidden sm:inline">Advanced filters</span>
                <span className="sm:hidden">Filters</span>
                {filterCount > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white">{filterCount}</span>}
              </button>
            </div>
          </header>

          {/* 3. Image subcategory sidebar and product results share a top edge */}
          <div className="grid grid-cols-[64px_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[76px_minmax(0,1fr)] sm:gap-3 md:grid-cols-[96px_minmax(0,1fr)] md:gap-4 lg:grid-cols-[112px_minmax(0,1fr)] lg:gap-5">
            <aside aria-label="Shop by subcategory" className="sticky top-[88px] flex max-h-[calc(100dvh-100px)] flex-col gap-1 overflow-y-auto overscroll-contain pb-2 pr-1 scrollbar-none md:top-[100px] md:max-h-[calc(100dvh-112px)] md:gap-2 md:pr-2">
              <button
                type="button"
                aria-pressed={selectedSubcategories.length === 0}
                onClick={() => handleSelectRailSubcategory()}
                className={`flex w-full flex-col items-center gap-1 rounded-xl p-1 text-center transition-colors md:gap-1.5 md:p-2 ${selectedSubcategories.length === 0 ? "bg-primary/10 text-primary ring-1 ring-primary/25" : "text-on-surface-variant hover:bg-surface-container-low"}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low text-primary md:h-14 md:w-14">
                  <span className="material-symbols-outlined text-[22px] md:text-[26px]">apps</span>
                </span>
                <span className="line-clamp-2 text-[9px] font-bold leading-tight md:text-[11px]">All items</span>
                <span className="text-[9px] text-on-surface-variant md:text-[10px]">{categoryScopeProductCount}</span>
              </button>
              {railSubcategories.map((subcategory) => {
                const isActive = selectedSubcategories.some((selected) => selected.toLocaleLowerCase() === subcategory.name.toLocaleLowerCase());
                return (
                  <button
                    key={subcategory.name}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleSelectRailSubcategory(subcategory.name)}
                    className={`flex w-full flex-col items-center gap-1 rounded-xl p-1 text-center transition-colors md:gap-1.5 md:p-2 ${isActive ? "bg-primary/10 text-primary ring-1 ring-primary/25" : "text-on-surface-variant hover:bg-surface-container-low"}`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-surface-container-low md:h-14 md:w-14">
                      <img
                        src={subcategory.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/placeholders/grocery.svg";
                        }}
                      />
                    </span>
                    <span className="line-clamp-2 text-[9px] font-semibold leading-tight md:text-[11px]">{subcategory.name}</span>
                    <span className="text-[9px] text-on-surface-variant md:text-[10px]">{subcategory.count}</span>
                  </button>
                );
              })}
            </aside>

            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Product filters">
                <button type="button" aria-label="Close filters" onClick={() => setMobileFiltersOpen(false)} className="absolute inset-0 h-full w-full bg-black/40" />
                <aside className="absolute inset-y-0 right-0 h-dvh w-[min(92vw,400px)] overflow-y-auto overscroll-contain bg-surface-container-lowest shadow-2xl">
                  {renderFilterPanel(true)}
                </aside>
              </div>
            )}

            <section className="flex min-w-0 flex-col gap-4">
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
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
                  We couldn't find products in this selection. Try another aisle or clear your search.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleResetCatalog}
                      className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer"
                    >
                      Clear selection
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        readOnly={false}
                        compactAddToCart
                      />
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
