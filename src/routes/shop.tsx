import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
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
    focusSearch?: boolean | undefined;
    deals?: boolean | undefined;
    sort?: "popular" | "rating" | "price_asc" | "price_desc" | "discount" | "newest" | "oldest" | undefined;
  } => ({
    category: (search["category"] as string) || undefined,
    subCategory: (search["subCategory"] as string) || undefined,
    q: (search["q"] as string) || undefined,
    focusSearch: search["focusSearch"] === true || search["focusSearch"] === "true" || undefined,
    deals: Boolean(search["deals"]) || undefined,
    sort: (search["sort"] as "popular" | "rating" | "price_asc" | "price_desc" | "discount" | "newest" | "oldest") || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Groceries & Wood Pressed Oils — Sriman Smart Store" },
      { name: "description", content: "Explore South Indian staples, grains, and oils." },
    ],
  }),
  component: ShopPage,
});

function ShopPage() {
  const searchParams = useSearch({ from: "/shop" });
  const navigate = useNavigate();
  const { t } = useLanguage();
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    "popular" | "rating" | "price_asc" | "price_desc" | "discount" | "newest" | "oldest"
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
  const mobileFiltersHistoryRef = useRef(false);
  const [isMobileRailCollapsed, setIsMobileRailCollapsed] = useState(false);
  const [activeRailItem, setActiveRailItem] = useState("all");
  const [isAllItemsView, setIsAllItemsView] = useState(true);
  const [isOfferZoneSelected, setIsOfferZoneSelected] = useState(false);
  const productListRef = useRef<HTMLElement>(null);

  const closeMobileFilters = useCallback(() => {
    if (mobileFiltersHistoryRef.current) {
      mobileFiltersHistoryRef.current = false;
      window.history.back();
    }
    setMobileFiltersOpen(false);
  }, []);

  useEffect(() => {
    if (!searchParams.focusSearch) return;
    const focusTimer = window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      searchInputRef.current?.focus({ preventScroll: true });
      void navigate({
        to: "/shop",
        search: (previous) => ({ ...previous, focusSearch: undefined }),
        replace: true,
      });
    }, 100);
    return () => window.clearTimeout(focusTimer);
  }, [searchParams.focusSearch, navigate]);

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
      if (event.key === "Escape") closeMobileFilters();
    };
    const closeOnBack = () => {
      mobileFiltersHistoryRef.current = false;
      setMobileFiltersOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    window.addEventListener("popstate", closeOnBack);
    window.history.pushState(window.history.state, "", window.location.href);
    mobileFiltersHistoryRef.current = true;
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("popstate", closeOnBack);
    };
  }, [mobileFiltersOpen, closeMobileFilters]);

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
  const railCategories = useMemo(() => {
    const items = categories
      .map((category) => ({
        slug: category.slug,
        name: category.name,
        tamilName: category.tamilName,
        image: category.image,
        count: categoryProductCounts.get(category.slug) || 0,
      }))
      .filter((category) => category.count > 0);
    const knownSlugs = new Set(items.map((category) => category.slug));
    for (const product of allProducts) {
      if (knownSlugs.has(product.categorySlug)) continue;
      knownSlugs.add(product.categorySlug);
      items.push({
        slug: product.categorySlug,
        name: product.category,
        tamilName: product.tamilName,
        image: product.imageUrl || "/placeholders/grocery.svg",
        count: categoryProductCounts.get(product.categorySlug) || 0,
      });
    }
    return items;
  }, [allProducts, categories, categoryProductCounts]);
  const offerProductCount = useMemo(
    () => allProducts.filter((product) => product.isOffer === true).length,
    [allProducts],
  );
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
  const offerZoneProducts = useMemo(
    () => filteredProducts.filter((product) => product.isOffer === true),
    [filteredProducts],
  );
  const visibleRailProducts = isOfferZoneSelected ? offerZoneProducts : filteredProducts;
  const productSections = useMemo(() => {
    if (isOfferZoneSelected) {
      return visibleRailProducts.length > 0
        ? [{ slug: "offers", name: "Offer Zone", tamilName: undefined, products: visibleRailProducts }]
        : [];
    }

    return railCategories
      .map((category) => ({
        slug: category.slug,
        name: category.name,
        tamilName: category.tamilName,
        products: visibleRailProducts.filter((product) => product.categorySlug === category.slug),
      }))
      .filter((section) => section.products.length > 0);
  }, [isOfferZoneSelected, railCategories, visibleRailProducts]);
  const mixedAllItemsProducts = useMemo(() => {
    if (sortOption !== "popular") return filteredProducts;

    const productsByCategory = railCategories
      .map((category) => filteredProducts.filter((product) => product.categorySlug === category.slug))
      .filter((products) => products.length > 0);
    const mixedProducts: Product[] = [];
    const longestCategory = Math.max(0, ...productsByCategory.map((products) => products.length));
    for (let productIndex = 0; productIndex < longestCategory; productIndex += 1) {
      for (const products of productsByCategory) {
        const product = products[productIndex];
        if (product) mixedProducts.push(product);
      }
    }
    return mixedProducts;
  }, [filteredProducts, railCategories, sortOption]);
  const categoryScopeProductCount = useMemo(
    () => selectedCategories.length
      ? allProducts.filter((product) => selectedCategories.includes(product.categorySlug)).length
      : allProducts.length,
    [allProducts, selectedCategories],
  );

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
    setIsOfferZoneSelected(false);
    setActiveRailItem("all");
    setIsAllItemsView(true);
    setIsMobileRailCollapsed(false);
  };

  const toggleSelection = (items: string[], item: string, setter: (next: string[]) => void) => {
    setter(items.includes(item) ? items.filter((value) => value !== item) : [...items, item]);
  };

  const handleSelectRailSubcategory = (subcategory?: string) => {
    setSelectedSubcategories(subcategory ? [subcategory] : []);
  };

  const scrollProductListTo = (sectionSlug?: string) => {
    const productList = productListRef.current;
    if (!productList) return;
    if (!sectionSlug) {
      productList.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const section = document.getElementById(`shop-category-${sectionSlug}`);
    if (!section) return;
    const targetTop = section.getBoundingClientRect().top - productList.getBoundingClientRect().top + productList.scrollTop;
    productList.scrollTo({ top: targetTop, behavior: "smooth" });
  };

  const handleSelectRailCategory = (categorySlug: string) => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setIsOfferZoneSelected(false);
    setIsAllItemsView(false);
    setActiveRailItem(categorySlug);
    window.requestAnimationFrame(() => scrollProductListTo(categorySlug));
  };

  const handleSelectOfferZone = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setOnlyDeals(false);
    setIsOfferZoneSelected(true);
    setIsAllItemsView(false);
    setActiveRailItem("offers");
    scrollProductListTo();
  };

  const handleSelectAllItems = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setIsOfferZoneSelected(false);
    setIsAllItemsView(true);
    setActiveRailItem("all");
    setIsMobileRailCollapsed(true);
    scrollProductListTo();
  };

  const handleProductListScroll = () => {
    if (isOfferZoneSelected) return;
    const productList = productListRef.current;
    if (!productList) return;

    const listTop = productList.getBoundingClientRect().top + 24;
    const sections = Array.from(productList.querySelectorAll<HTMLElement>("[data-shop-category-section]"));
    let activeSlug = sections[0]?.dataset["shopCategorySection"];
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= listTop) {
        activeSlug = section.dataset["shopCategorySection"];
      } else {
        break;
      }
    }
    if (activeSlug) setActiveRailItem(activeSlug);
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
          <h2 className={`${mobile ? "text-base" : "text-sm"} font-extrabold`}>Filters</h2>
          <p className={`${mobile ? "text-xs" : "text-[11px]"} text-on-surface-variant`}>{filteredProducts.length} products</p>
        </div>
        <div className="flex items-center gap-3">
          {!mobile && filterCount > 0 && (
            <button type="button" onClick={handleResetCatalog} className={`${mobile ? "text-sm" : "text-xs"} font-bold text-primary hover:underline`}>
              Clear all
            </button>
          )}
          {mobile && (
            <button type="button" onClick={closeMobileFilters} aria-label="Close filters" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-outline-variant/15 px-4">
        <details open className="py-3">
          <summary className={`cursor-pointer list-none ${mobile ? "text-sm" : "text-xs"} font-extrabold`}>Categories</summary>
          <div className="mt-3 space-y-2">
            {categories.map((category) => {
              const count = categoryProductCounts.get(category.slug) || 0;
              const checked = selectedCategories.includes(category.slug);
              return (
                <label key={category.slug} className={`flex cursor-pointer items-center gap-2 ${mobile ? "text-sm" : "text-xs"}`}>
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
                  <span className={`${mobile ? "text-xs" : "text-[10px]"} text-on-surface-variant`}>{count}</span>
                </label>
              );
            })}
          </div>
        </details>

        {railSubcategories.length > 0 && (
          <details open className="py-3">
            <summary className={`cursor-pointer list-none ${mobile ? "text-sm" : "text-xs"} font-extrabold`}>Subcategory</summary>
            <div className="mt-3 space-y-2">
              {railSubcategories.map((subcategory) => (
                <label key={subcategory.name} className={`flex cursor-pointer items-center gap-2 ${mobile ? "text-sm" : "text-xs"}`}>
                  <input
                    type="checkbox"
                    checked={selectedSubcategories.some((value) => value.toLocaleLowerCase() === subcategory.name.toLocaleLowerCase())}
                    onChange={() => toggleSelection(selectedSubcategories, subcategory.name, setSelectedSubcategories)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  <span className="min-w-0 flex-1">{subcategory.name}</span>
                  <span className={`${mobile ? "text-xs" : "text-[10px]"} text-on-surface-variant`}>{subcategory.count}</span>
                </label>
              ))}
            </div>
          </details>
        )}

        <details open className="py-3">
          <summary className={`cursor-pointer list-none ${mobile ? "text-sm" : "text-xs"} font-extrabold`}>Price range</summary>
          <div className="mt-3 space-y-3">
            <p className={`${mobile ? "text-sm" : "text-xs"} font-semibold text-on-surface`}>
              ₹{activePriceRange.min} – ₹{activePriceRange.max}
            </p>
            <label className={`block ${mobile ? "text-xs" : "text-[10px]"} font-semibold text-on-surface-variant`}>
              Minimum price
              <input
                type="range"
                min={catalogPriceBounds.min}
                max={catalogPriceBounds.max}
                step="1"
                value={activePriceRange.min}
                aria-label="Minimum price"
                onChange={(event) => setCustomPriceRange({
                  min: Math.min(Number(event.target.value), activePriceRange.max),
                  max: activePriceRange.max,
                })}
                className="mt-1 block h-5 w-full cursor-pointer accent-primary"
              />
            </label>
            <label className={`block ${mobile ? "text-xs" : "text-[10px]"} font-semibold text-on-surface-variant`}>
              Maximum price
              <input
                type="range"
                min={catalogPriceBounds.min}
                max={catalogPriceBounds.max}
                step="1"
                value={activePriceRange.max}
                aria-label="Maximum price"
                onChange={(event) => setCustomPriceRange({
                  min: activePriceRange.min,
                  max: Math.max(Number(event.target.value), activePriceRange.min),
                })}
                className="mt-1 block h-5 w-full cursor-pointer accent-primary"
              />
            </label>
          </div>
          <p className="mt-1 text-[10px] text-on-surface-variant">Prices shown in ₹</p>
        </details>

        {brandOptions.length > 0 && (
          <details open className="py-3">
            <summary className={`cursor-pointer list-none ${mobile ? "text-sm" : "text-xs"} font-extrabold`}>Brand</summary>
            <div className="mt-3 space-y-2">
              {brandOptions.map(([brand, count]) => (
                <label key={brand} className={`flex cursor-pointer items-center gap-2 ${mobile ? "text-sm" : "text-xs"}`}>
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleSelection(selectedBrands, brand, setSelectedBrands)}
                    className="h-3.5 w-3.5 accent-primary"
                  />
                  <span className="min-w-0 flex-1">{brand}</span>
                  <span className={`${mobile ? "text-xs" : "text-[10px]"} text-on-surface-variant`}>{count}</span>
                </label>
              ))}
            </div>
          </details>
        )}

        <details open className="py-3">
          <summary className={`cursor-pointer list-none ${mobile ? "text-sm" : "text-xs"} font-extrabold`}>Customer rating</summary>
          <div className="mt-3 space-y-1">
            <p className={`${mobile ? "text-sm" : "text-xs"} font-semibold text-on-surface`}>
              {minRating === 0 ? "Any rating" : `${minRating}+ stars`}
            </p>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={minRating}
              aria-label="Minimum customer rating"
              onChange={(event) => setMinRating(Number(event.target.value))}
              className="block h-5 w-full cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-[10px] text-on-surface-variant">
              <span>Any</span>
              <span>3+</span>
              <span>5 stars</span>
            </div>
          </div>
          <div className="hidden">
            {[4, 3].map((rating) => (
              <label key={rating} className={`flex cursor-pointer items-center gap-2 ${mobile ? "text-sm" : "text-xs"}`}>
                <input type="radio" name={mobile ? "mobile-rating" : "desktop-rating"} checked={minRating === rating} onChange={() => setMinRating(rating)} className="h-3.5 w-3.5 accent-primary" />
                <span>{rating}+ ★</span>
              </label>
            ))}
            <button type="button" onClick={() => setMinRating(0)} className={`${mobile ? "text-xs" : "text-[10px]"} font-semibold ${minRating === 0 ? "text-primary" : "text-on-surface-variant"}`}>Any rating</button>
          </div>
        </details>

        <details open className="py-3">
          <summary className={`cursor-pointer list-none ${mobile ? "text-sm" : "text-xs"} font-extrabold`}>Offers & availability</summary>
          <div className="mt-3 space-y-2">
            <label className={`flex cursor-pointer items-center gap-2 ${mobile ? "text-sm" : "text-xs"}`}>
              <input type="checkbox" checked={onlyDeals} onChange={(event) => setOnlyDeals(event.target.checked)} className="h-3.5 w-3.5 accent-primary" />
              <span>Deals and special offers</span>
            </label>
            <label className={`flex cursor-pointer items-center gap-2 ${mobile ? "text-sm" : "text-xs"}`}>
              <input type="checkbox" checked={inStockOnly} onChange={(event) => setInStockOnly(event.target.checked)} className="h-3.5 w-3.5 accent-primary" />
              <span>In stock only</span>
            </label>
            <label className={`flex items-center gap-2 ${mobile ? "text-sm" : "text-xs"}`}>
              <span className="text-on-surface-variant">Minimum discount</span>
              <select value={minDiscount} onChange={(event) => setMinDiscount(Number(event.target.value))} className={`ml-auto rounded-md border border-outline-variant/20 bg-white px-1.5 py-1 ${mobile ? "text-xs" : "text-[11px]"}`}>
                <option value={0}>Any</option><option value={10}>10%+</option><option value={15}>15%+</option><option value={20}>20%+</option><option value={30}>30%+</option>
              </select>
            </label>
          </div>
        </details>

        {packSizeOptions.length > 0 && (
          <details className="py-3">
            <summary className={`cursor-pointer list-none ${mobile ? "text-sm" : "text-xs"} font-extrabold`}>Pack size</summary>
            <div className="mt-3 space-y-2">
              {packSizeOptions.map(([size, count]) => (
                <label key={size} className={`flex cursor-pointer items-center gap-2 ${mobile ? "text-sm" : "text-xs"}`}>
                  <input type="checkbox" checked={selectedPackSizes.includes(size)} onChange={() => toggleSelection(selectedPackSizes, size, setSelectedPackSizes)} className="h-3.5 w-3.5 accent-primary" />
                  <span className="min-w-0 flex-1">{size}</span><span className="text-[10px] text-on-surface-variant">{count}</span>
                </label>
              ))}
            </div>
          </details>
        )}
        
      </div>
      {mobile && (
        <div className="sticky bottom-0 flex items-center gap-2 border-t border-outline-variant/15 bg-surface-container-lowest p-3">
          {filterCount > 0 && (
            <button type="button" onClick={handleResetCatalog} className="shrink-0 rounded-xl border border-outline-variant/25 px-3 py-2.5 text-sm font-bold text-primary">
              Clear
            </button>
          )}
          <button type="button" onClick={closeMobileFilters} className="min-w-0 flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white">
            Show {filteredProducts.length} results
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-20 pb-28 bg-surface min-h-[calc(100vh-80px)] md:pb-0">
        <div className="max-w-[1320px] mx-auto px-margin-desktop py-space-md">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void navigate({
                to: "/shop",
                search: (previous) => ({ ...previous, q: searchQuery.trim() || undefined }),
              });
            }}
            className="mb-4 flex items-center gap-1 rounded-full bg-surface-container-low px-2 py-1 ring-1 ring-outline-variant/30 md:hidden"
          >
            <input
              id="shop-product-search-input"
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-sm text-on-surface placeholder:text-outline focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search the shop"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>
          </form>

          {/* 1. Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="mb-3 hidden items-center gap-2 text-xs text-on-surface-variant md:flex"
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
          <header className="mb-4 hidden min-h-10 items-center justify-between gap-3 sm:mb-6 md:flex">
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

          {/* Category navigation and products scroll independently on mobile. */}
          <div className={`grid h-[calc(100dvh-280px)] min-h-[280px] items-stretch gap-2 overflow-hidden md:h-auto md:min-h-0 md:overflow-visible md:gap-4 lg:gap-5 ${isMobileRailCollapsed ? "grid-cols-[24px_minmax(0,1fr)] sm:grid-cols-[24px_minmax(0,1fr)] md:grid-cols-[96px_minmax(0,1fr)] lg:grid-cols-[112px_minmax(0,1fr)]" : "grid-cols-[64px_minmax(0,1fr)] sm:grid-cols-[76px_minmax(0,1fr)] md:grid-cols-[96px_minmax(0,1fr)] lg:grid-cols-[112px_minmax(0,1fr)]"}`}>
            {isMobileRailCollapsed && (
              <button
                type="button"
                aria-label="Open category menu"
                onClick={() => setIsMobileRailCollapsed(false)}
                className="sticky top-3 flex h-20 w-6 self-start items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest text-primary shadow-sm md:hidden"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            )}
            <aside aria-label="Shop by category" className={`${isMobileRailCollapsed ? "hidden" : "flex"} h-full min-h-0 flex-col gap-1 overflow-y-auto overscroll-contain pb-2 pr-1 scrollbar-none md:hidden`}>
              <button
                type="button"
                aria-pressed={activeRailItem === "offers"}
                onClick={handleSelectOfferZone}
                className={`flex w-full flex-col items-center gap-1 rounded-xl p-1 text-center transition-colors md:gap-1.5 md:p-2 ${activeRailItem === "offers" ? "bg-primary/10 text-primary ring-1 ring-primary/25" : "text-on-surface-variant hover:bg-surface-container-low"}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary-container text-on-tertiary-container md:h-14 md:w-14">
                  <span className="material-symbols-outlined text-[22px] md:text-[26px]">local_offer</span>
                </span>
                <span className="line-clamp-2 text-[9px] font-bold leading-tight md:text-[11px]">Offer Zone</span>
                <span className="text-[9px] text-on-surface-variant md:text-[10px]">{offerProductCount}</span>
              </button>
              <button
                type="button"
                aria-pressed={activeRailItem === "all"}
                onClick={handleSelectAllItems}
                className={`flex w-full flex-col items-center gap-1 rounded-xl p-1 text-center transition-colors md:gap-1.5 md:p-2 ${activeRailItem === "all" ? "bg-primary/10 text-primary ring-1 ring-primary/25" : "text-on-surface-variant hover:bg-surface-container-low"}`}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container-low text-primary md:h-14 md:w-14">
                  <span className="material-symbols-outlined text-[22px] md:text-[26px]">apps</span>
                </span>
                <span className="line-clamp-2 text-[9px] font-bold leading-tight md:text-[11px]">All items</span>
                <span className="text-[9px] text-on-surface-variant md:text-[10px]">{allProducts.length}</span>
              </button>
              {railCategories.map((category) => {
                const isActive = activeRailItem === category.slug;
                return (
                  <button
                    key={category.slug}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleSelectRailCategory(category.slug)}
                    className={`flex w-full flex-col items-center gap-1 rounded-xl p-1 text-center transition-colors md:gap-1.5 md:p-2 ${isActive ? "bg-primary/10 text-primary ring-1 ring-primary/25" : "text-on-surface-variant hover:bg-surface-container-low"}`}
                  >
                    <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-surface-container-low md:h-14 md:w-14">
                      <img
                        src={category.image}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/placeholders/grocery.svg";
                        }}
                      />
                    </span>
                    <span className="line-clamp-2 text-[9px] font-semibold leading-tight md:text-[11px]">{t(category.name, category.tamilName)}</span>
                    <span className="text-[9px] text-on-surface-variant md:text-[10px]">{category.count}</span>
                  </button>
                );
              })}
            </aside>

            <aside aria-label="Shop by subcategory" className="hidden max-h-[calc(100dvh-112px)] flex-col gap-2 overflow-y-auto overscroll-contain pb-2 pr-2 scrollbar-none md:sticky md:top-[100px] md:flex">
              <button
                type="button"
                aria-pressed={selectedSubcategories.length === 0}
                onClick={() => handleSelectRailSubcategory()}
                className={`flex w-full flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-colors ${selectedSubcategories.length === 0 ? "bg-primary/10 text-primary ring-1 ring-primary/25" : "text-on-surface-variant hover:bg-surface-container-low"}`}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-container-low text-primary">
                  <span className="material-symbols-outlined text-[26px]">apps</span>
                </span>
                <span className="line-clamp-2 text-[11px] font-bold leading-tight">All items</span>
                <span className="text-[10px] text-on-surface-variant">{categoryScopeProductCount}</span>
              </button>
              {railSubcategories.map((subcategory) => {
                const isActive = selectedSubcategories.some((selected) => selected.toLocaleLowerCase() === subcategory.name.toLocaleLowerCase());
                return (
                  <button
                    key={subcategory.name}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => handleSelectRailSubcategory(subcategory.name)}
                    className={`flex w-full flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-colors ${isActive ? "bg-primary/10 text-primary ring-1 ring-primary/25" : "text-on-surface-variant hover:bg-surface-container-low"}`}
                  >
                    <span className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-surface-container-low">
                      <img src={subcategory.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </span>
                    <span className="line-clamp-2 text-[11px] font-semibold leading-tight">{subcategory.name}</span>
                    <span className="text-[10px] text-on-surface-variant">{subcategory.count}</span>
                  </button>
                );
              })}
            </aside>

            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Product filters">
                <button type="button" aria-label="Close filters" onClick={closeMobileFilters} className="absolute inset-0 h-full w-full bg-black/40" />
                <aside className="absolute right-0 top-0 bottom-[calc(1rem+env(safe-area-inset-bottom))] h-auto w-[min(60vw,320px)] overflow-y-auto overscroll-contain bg-surface-container-lowest shadow-2xl">
                  {renderFilterPanel(true)}
                </aside>
              </div>
            )}

            <section ref={productListRef} onScroll={handleProductListScroll} className="h-full min-h-0 min-w-0 overflow-y-auto overscroll-contain md:h-auto md:overflow-visible">
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
              ) : visibleRailProducts.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-3xl p-12 text-center max-w-lg mx-auto border border-outline-variant/20 my-8 shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-3xl mx-auto mb-4">
                    🌾
                  </div>
                  <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-2">
                    {isOfferZoneSelected ? "No Offers Available" : "No Harvest Items Found"}
                  </h3>
                  <p className="font-body-sm text-xs text-on-surface-variant mb-6">
                    {isOfferZoneSelected
                      ? "There are no offer zone products in this selection. Try another category or clear your filters."
                      : "We couldn't find products in this selection. Try another aisle or clear your search."}
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
                <div className="space-y-5 pb-3 md:hidden">
                  {isAllItemsView ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {mixedAllItemsProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          readOnly={false}
                          compactAddToCart
                        />
                      ))}
                    </div>
                  ) : (
                    productSections.map((section) => (
                      <div
                        key={section.slug}
                        id={`shop-category-${section.slug}`}
                        data-shop-category-section={section.slug}
                        className="scroll-mt-2"
                      >
                        <h2 className="mb-2 text-sm font-extrabold text-on-surface sm:text-base">
                          {t(section.name, section.tamilName)}
                        </h2>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {section.products.map((product) => (
                            <ProductCard
                              key={product.id}
                              product={product}
                              readOnly={false}
                              compactAddToCart
                            />
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="hidden grid-cols-3 gap-3 md:grid lg:grid-cols-4 xl:grid-cols-6">
                  {visibleRailProducts.map((product) => (
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

        <div className="fixed bottom-[calc(3.25rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex h-14 items-center gap-3 border-t border-outline-variant/20 bg-surface-container-lowest px-4 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] md:hidden">
          <label className="flex min-w-0 flex-1 items-center gap-2">
            <span className="text-xs font-bold text-on-surface">Sort</span>
            <select
              aria-label="Sort products"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value as typeof sortOption)}
              className="h-10 min-w-0 flex-1 rounded-xl border border-outline-variant/25 bg-surface-container-lowest px-2 text-xs font-semibold text-on-surface"
            >
              <option value="popular">Popularity</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="rating">Top rated</option>
              <option value="discount">Discount</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-bold text-white"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            Filter
            {filterCount > 0 && (
              <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{filterCount}</span>
            )}
          </button>
        </div>
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
