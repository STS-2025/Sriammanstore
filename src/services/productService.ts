import { apiClient } from "./apiClient";
import type { Product, Category, Banner } from "../types";
import {
  catalogDataSource,
  type CatalogDataSourceMode,
  type CatalogDataSourceStatus,
  type ProductFilterParams,
} from "./catalogDataSource";

export type { ProductFilterParams };

export const productService = {
  /**
   * Retrieves products using the configured catalog data source ("local" by default).
   */
  async getProducts(params?: ProductFilterParams): Promise<Product[]> {
    return catalogDataSource.getProducts(params);
  },

  /**
   * Retrieves a single product by identifier.
   */
  async getProductById(id: string): Promise<Product | null> {
    return catalogDataSource.getProductById(id);
  },

  /**
   * Retrieves product categories.
   */
  async getCategories(forceRefresh?: boolean): Promise<Category[]> {
    return catalogDataSource.getCategories(forceRefresh);
  },

  /**
   * Retrieves promotional banners.
   */
  async getBanners(): Promise<Banner[]> {
    return catalogDataSource.getBanners();
  },

  /**
   * Retrieves similar product recommendations.
   */
  async getSimilarProducts(productId: string, limit = 4): Promise<Product[]> {
    return catalogDataSource.getSimilarProducts(productId, limit);
  },

  /**
   * Retrieves complementary product recommendations.
   */
  async getComplementaryProducts(
    productId: string,
    limit = 4,
    excludeIds: string[] = []
  ): Promise<Product[]> {
    return catalogDataSource.getComplementaryProducts(productId, limit, excludeIds);
  },

  /**
   * Gets the active catalog mode ("local" | "production-preview").
   */
  getCatalogMode(): CatalogDataSourceMode {
    return catalogDataSource.getMode();
  },

  /**
   * Sets the active catalog mode explicitly.
   */
  setCatalogMode(mode: CatalogDataSourceMode): void {
    catalogDataSource.setMode(mode);
  },

  /**
   * Resets the catalog mode back to the default ("local").
   */
  resetCatalogMode(): void {
    catalogDataSource.resetMode();
  },

  /**
   * Gets catalog status diagnostic snapshot.
   */
  getCatalogStatus(): CatalogDataSourceStatus {
    return catalogDataSource.getStatus();
  },

  /**
   * Fetches full production catalogue diagnostic result when in production mode.
   */
  async getFullProductionCatalogueResult() {
    return catalogDataSource.getFullProductionCatalogueResult();
  },
};
