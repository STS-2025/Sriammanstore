import { apiClient } from "./apiClient";
import type { Product, Category, Banner } from "../types";
import { normalizeLegacyProduct, normalizeLegacyProductList } from "./legacySchemaMapper";
import {
  APPROVED_PRODUCTION_PRODUCT_IDS,
  EXPECTED_PRODUCTION_PROJECT_ID,
  fetchAllProductionProductPreviews,
  fetchProductionProductPreview,
  fetchFullProductionCatalogue,
  fetchProductionProductById,
  type ApprovedProductionProductId,
  type ProductionCatalogueResult,
} from "./productionPreviewService";
import {
  resolveProductionCategories,
  type ProductionCategoryResolverResult,
} from "./productionCategoryResolver";
import { filterAndSortProducts, type ProductFilterState } from "../lib/filterUtils";
import { getSimilarProducts, getComplementaryProducts } from "../lib/recommendationUtils";

export type CatalogDataSourceMode = "local" | "production-preview" | "production-readonly";

export interface CatalogDataSourceStatus {
  mode: CatalogDataSourceMode;
  isProductionPreview: boolean;
  isProductionReadOnly: boolean;
  defaultMode: CatalogDataSourceMode;
  productionAllowlist: readonly string[];
  productionProjectId: string;
}

export interface ProductFilterParams {
  category?: string | undefined;
  categories?: string[] | undefined;
  subcategory?: string | undefined;
  subcategories?: string[] | undefined;
  search?: string | undefined;
  isFlashDeal?: boolean | undefined;
  onlyDeals?: boolean | undefined;
  inStockOnly?: boolean | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  minRating?: number | undefined;
  minDiscount?: number | undefined;
  packSizes?: string[] | undefined;
  methods?: string[] | undefined;
  sort?: ("price_asc" | "price_desc" | "rating" | "popular" | "discount") | undefined;
}

/**
 * The customer application uses the existing production Firebase catalogue.
 * Emulator and fixture modes are not selected by normal application startup.
 */
export function resolveDefaultCatalogMode(): CatalogDataSourceMode {
  return import.meta.env.MODE === "test" ? "local" : "production-readonly";
}

/**
 * Catalogue Data Source Abstraction.
 * Separates catalogue retrieval from customer profile/cart/order data sources.
 *
 * Supports three distinct modes:
 * - "local": reads from local Firestore Emulator (or JSON Server fallback). Default mode.
 * - "production-preview": reads strictly allowlisted documents from production Firestore.
 * - "production-readonly": reads the full production catalogue using verified Firestore query patterns.
 */
export class CatalogDataSource {
  private mode: CatalogDataSourceMode;
  private cachedCategories: Category[] | null = null;
  private pendingCategoriesPromise: Promise<Category[]> | null = null;
  private cachedProductionCataloguePromise: Promise<ProductionCatalogueResult> | null = null;

  constructor(initialMode?: CatalogDataSourceMode) {
    this.mode = initialMode ?? resolveDefaultCatalogMode();
  }

  public getMode(): CatalogDataSourceMode {
    return this.mode;
  }

  public setMode(mode: CatalogDataSourceMode): void {
    // The normal customer runtime is pinned to the configured Firebase catalogue.
    // Local fixtures remain available to source-level tests only.
    this.mode = import.meta.env.MODE === "test" ? mode : "production-readonly";
    this.cachedCategories = null;
    this.pendingCategoriesPromise = null;
    this.cachedProductionCataloguePromise = null;
  }

  public resetMode(): void {
    this.mode = resolveDefaultCatalogMode();
    this.cachedCategories = null;
    this.pendingCategoriesPromise = null;
    this.cachedProductionCataloguePromise = null;
  }

  public clearCategoryCache(): void {
    this.cachedCategories = null;
    this.pendingCategoriesPromise = null;
    this.cachedProductionCataloguePromise = null;
  }

  public getStatus(): CatalogDataSourceStatus {
    return {
      mode: this.mode,
      isProductionPreview: this.mode === "production-preview",
      isProductionReadOnly: this.mode === "production-readonly",
      defaultMode: resolveDefaultCatalogMode(),
      productionAllowlist: APPROVED_PRODUCTION_PRODUCT_IDS,
      productionProjectId: EXPECTED_PRODUCTION_PROJECT_ID,
    };
  }

  /**
   * Retrieves products based on the active catalogue mode and applies
   * the common filtering and sorting engine.
   */
  public async getProducts(
    params?: ProductFilterParams & { fullCatalogue?: boolean },
  ): Promise<Product[]> {
    let items: Product[] = [];

    if (
      this.mode === "production-readonly" ||
      (this.mode === "production-preview" && params?.fullCatalogue)
    ) {
      // Full production catalogue read-only query
      const result = await this.loadProductionCatalogue();
      items = result.products;
    } else if (this.mode === "production-preview") {
      // Strictly read from allowlisted production product documents
      const previews = await fetchAllProductionProductPreviews({ optIn: true });
      items = previews.map((p) => p.product);
    } else {
      // Test-only local catalogue. Normal runtime defaults to production-readonly above.
      const rawItems = await apiClient.get<unknown[]>("/products");
      items = normalizeLegacyProductList(rawItems);
    }

    // Normalize category parameter into categories array
    const filterCategories: string[] = [];
    if (params?.categories && params.categories.length > 0) {
      filterCategories.push(...params.categories);
    } else if (params?.category && params.category !== "all") {
      filterCategories.push(params.category);
    }

    const filterSubcategories: string[] = [];
    if (params?.subcategories && params.subcategories.length > 0) {
      filterSubcategories.push(...params.subcategories);
    } else if (params?.subcategory && params.subcategory !== "all") {
      filterSubcategories.push(params.subcategory);
    }

    // Apply comprehensive filtering and sorting engine
    const filterState: Partial<ProductFilterState> = {
      categories: filterCategories,
      ...(filterSubcategories.length > 0 ? { subcategories: filterSubcategories } : {}),
      ...(params?.search !== undefined ? { search: params.search } : {}),
      ...(params?.isFlashDeal || params?.onlyDeals ? { onlyDeals: true } : {}),
      ...(params?.inStockOnly !== undefined ? { inStockOnly: params.inStockOnly } : {}),
      ...(params?.minPrice !== undefined ? { minPrice: params.minPrice } : {}),
      ...(params?.maxPrice !== undefined ? { maxPrice: params.maxPrice } : {}),
      ...(params?.minRating !== undefined ? { minRating: params.minRating } : {}),
      ...(params?.minDiscount !== undefined ? { minDiscount: params.minDiscount } : {}),
      ...(params?.packSizes !== undefined ? { packSizes: params.packSizes } : {}),
      ...(params?.methods !== undefined ? { methods: params.methods } : {}),
      ...(params?.sort !== undefined ? { sort: params.sort } : {}),
    };

    return filterAndSortProducts(items, filterState);
  }

  /**
   * Retrieves a single product by identifier.
   */
  public async getProductById(id: string): Promise<Product | null> {
    if (this.mode === "production-readonly") {
      try {
        const product = await fetchProductionProductById(id, { optIn: true });
        return product;
      } catch (err: any) {
        if (err.message?.includes("404") || err.message?.includes("not found")) {
          return null;
        }
        throw err;
      }
    }

    if (this.mode === "production-preview") {
      // Enforce production allowlist: only approved products can be fetched
      if (!APPROVED_PRODUCTION_PRODUCT_IDS.includes(id as ApprovedProductionProductId)) {
        return null;
      }

      try {
        const preview = await fetchProductionProductPreview(id, {
          optIn: true,
        });
        return preview.product;
      } catch (err: any) {
        if (err.message?.includes("404") || err.message?.includes("not found")) {
          return null;
        }
        throw err;
      }
    }

    // Local mode: fetch from apiClient (Firestore Emulator / JSON Server)
    try {
      const rawProduct = await apiClient.get<unknown>(`/products/${id}`);
      return normalizeLegacyProduct(rawProduct, { docId: id });
    } catch (err: any) {
      if (err.message?.includes("404") || err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  /**
   * Retrieves full production catalogue diagnostic result when in production mode.
   */
  public async getFullProductionCatalogueResult(): Promise<ProductionCatalogueResult | null> {
    if (this.mode !== "production-readonly" && this.mode !== "production-preview") {
      return null;
    }
    return this.loadProductionCatalogue();
  }

  private loadProductionCatalogue(): Promise<ProductionCatalogueResult> {
    if (!this.cachedProductionCataloguePromise) {
      this.cachedProductionCataloguePromise = fetchFullProductionCatalogue({ optIn: true }).catch(
        (error) => {
          this.cachedProductionCataloguePromise = null;
          throw error;
        },
      );
    }
    return this.cachedProductionCataloguePromise;
  }

  /**
   * Retrieves product categories.
   * In "production-readonly" mode, derives database-driven categories from live production Firestore.
   * In "local" mode, strictly queries the local apiClient without touching production.
   * Supports in-memory caching to avoid duplicate queries across components.
   */
  public async getCategories(forceRefresh = false): Promise<Category[]> {
    if (!forceRefresh && this.cachedCategories) {
      return this.cachedCategories;
    }
    if (!forceRefresh && this.pendingCategoriesPromise) {
      return this.pendingCategoriesPromise;
    }

    this.pendingCategoriesPromise = (async () => {
      try {
        let categories: Category[] = [];
        if (this.mode === "production-readonly") {
          const fullResult = await this.getFullProductionCatalogueResult();
          if (
            fullResult?.categoryResult?.categories &&
            fullResult.categoryResult.categories.length > 0
          ) {
            categories = fullResult.categoryResult.categories;
          } else {
            const resolverResult = await resolveProductionCategories({ optIn: true });
            categories = resolverResult.categories;
          }
        } else {
          categories = await apiClient.get<Category[]>("/categories");
        }
        this.cachedCategories = categories;
        return categories;
      } finally {
        this.pendingCategoriesPromise = null;
      }
    })();

    return this.pendingCategoriesPromise;
  }

  /**
   * Retrieves promotional banners.
   */
  public async getBanners(): Promise<Banner[]> {
    return apiClient.get<Banner[]>("/banners");
  }

  /**
   * Retrieves similar product recommendations.
   */
  public async getSimilarProducts(productId: string, limit = 4): Promise<Product[]> {
    const allProducts = await this.getProducts();
    const currentProduct = allProducts.find((p) => p.id === productId);
    if (!currentProduct) return [];
    return getSimilarProducts(currentProduct, allProducts, { limit });
  }

  /**
   * Retrieves complementary product recommendations.
   */
  public async getComplementaryProducts(
    productId: string,
    limit = 4,
    excludeIds: string[] = [],
  ): Promise<Product[]> {
    const allProducts = await this.getProducts();
    const currentProduct = allProducts.find((p) => p.id === productId);
    if (!currentProduct) return [];
    return getComplementaryProducts(currentProduct, allProducts, {
      limit,
      excludeIds,
    });
  }
}

export const catalogDataSource = new CatalogDataSource();
