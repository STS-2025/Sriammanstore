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

  const catalogPriceBounds = useMemo(() => getCatalogPriceBounds(allProducts), [allProducts]);

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
    () =>
      selectedCategories.length
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
  }), [
    selectedCategories,
    selectedSubcategories,
    sortOption,
    searchQuery,
    onlyDeals,
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
  };

  // Quick single category pill click
  const handleSelectQuickCategory = (slug: string) => {
    setSelectedSubcategories([]);
    if (slug === "all") {
      setSelectedCategories([]);
    } else {
      setSelectedCategories([slug]);
    }
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

          {/* 2. Category and sort controls */}
          <header className="mb-6 flex flex-col gap-4 bg-surface-container-lowest p-4 md:p-6 rounded-2xl shadow-sm border border-outline-variant/15">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mt-1">
                  {activeCategoryTitle}
                </h1>
              </div>

              {/* Sort control */}
              <div className="flex w-full items-center justify-end sm:w-auto">
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
          </header>

          {/* 3. Subcategory rail and responsive product grid */}
          <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-2 sm:grid-cols-[76px_minmax(0,1fr)] sm:gap-3 md:grid-cols-[96px_minmax(0,1fr)] md:gap-5 lg:grid-cols-[112px_minmax(0,1fr)]">
            <aside className="sticky top-[88px] flex max-h-[calc(100vh-100px)] flex-col gap-1 overflow-y-auto pb-2 pr-1 scrollbar-none md:top-[116px] md:max-h-[calc(100vh-132px)] md:gap-2 md:pr-2">
              <button
                type="button"
                aria-pressed={selectedSubcategories.length === 0}
                onClick={() => handleSelectRailSubcategory()}
                className={`flex w-full flex-col items-center gap-1 rounded-xl p-1 text-center transition-colors md:gap-1.5 md:p-2 ${
                  selectedSubcategories.length === 0
                    ? "bg-primary/10 text-primary ring-1 ring-primary/25"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low text-primary md:h-14 md:w-14">
                  <span className="material-symbols-outlined text-[22px] md:text-[26px]">apps</span>
                </span>
                <span className="line-clamp-2 text-[9px] font-bold leading-tight md:text-[11px]">All items</span>
                <span className="text-[9px] text-on-surface-variant md:text-[10px]">{categoryScopeProductCount}</span>
              </button>
              {railSubcategories.map((subcategory) => {
                const isActive = selectedSubcategories.some(
                  (selected) => selected.toLocaleLowerCase() === subcategory.name.toLocaleLowerCase(),
                );
                return (
                  <button
                    key={subcategory.name}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleSelectRailSubcategory(subcategory.name)}
                    className={`flex w-full flex-col items-center gap-1 rounded-xl p-1 text-center transition-colors md:gap-1.5 md:p-2 ${
                      isActive
                        ? "bg-primary/10 text-primary ring-1 ring-primary/25"
                        : "text-on-surface-variant hover:bg-surface-container-low"
                    }`}
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
