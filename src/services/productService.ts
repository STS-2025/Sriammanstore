import { apiClient } from "./apiClient";
import type { Product, Category, Banner, Announcement } from "../types";
import {
  catalogDataSource,
  type CatalogDataSourceMode,
  type CatalogDataSourceStatus,
  type ProductFilterParams,
} from "./catalogDataSource";
import { getHomepageCategories } from "./categoryService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase-config.jsx";

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
   * Retrieves product categories from the configured Firebase categories collection.
   */
  async getHomepageCategories(): Promise<Category[]> {
    return getHomepageCategories();
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
    const snapshot = await getDocs(collection(db, "banners"));
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return snapshot.docs
      .map((document) => {
        const data = document.data();
        const stringField = (key: string) =>
          typeof data[key] === "string" ? (data[key] as string).trim() : "";
        const numberField = (key: string) =>
          typeof data[key] === "number" && Number.isFinite(data[key]) ? (data[key] as number) : undefined;
        const booleanField = (key: string) =>
          typeof data[key] === "boolean" ? (data[key] as boolean) : undefined;
        const startDate = stringField("startDate");
        const endDate = stringField("endDate");
        return {
          id: document.id,
          title: stringField("title"),
          subtitle: stringField("subtitle"),
          subheading: stringField("subheading"),
          shortDescription: stringField("shortDescription"),
          tamilTitle: stringField("tamilTitle"),
          tamilSubheading: stringField("tamilSubheading"),
          tamilShortDescription: stringField("tamilShortDescription"),
          promoCode: stringField("promoCode"),
          promoDiscount: stringField("promoDiscount"),
          buttonText: stringField("buttonText"),
          imageUrl: stringField("desktopImageUrl") || stringField("imageUrl") || stringField("image"),
          desktopImageUrl: stringField("desktopImageUrl"),
          mobileImageUrl: stringField("mobileImageUrl"),
          videoUrl: stringField("videoUrl"),
          redirectUrl: stringField("redirectUrl"),
          placement: stringField("placement"),
          status: stringField("status"),
          startDate,
          endDate,
          priority: numberField("priority"),
          contentMaxWidth: numberField("contentMaxWidth"),
          textPosition: stringField("textPosition"),
          textAlignment: stringField("textAlignment"),
          verticalAlignment: stringField("verticalAlignment"),
          headingFontSize: numberField("headingFontSize"),
          subheadingFontSize: numberField("subheadingFontSize"),
          headingColor: stringField("headingColor"),
          subheadingColor: stringField("subheadingColor"),
          buttonTextColor: stringField("buttonTextColor"),
          buttonBackgroundColor: stringField("buttonBackgroundColor"),
          bannerBackgroundColor: stringField("bannerBackgroundColor"),
          overlayColor: stringField("overlayColor"),
          customOverlayColor: stringField("customOverlayColor"),
          overlayOpacity: numberField("overlayOpacity"),
          imageOverlayEnabled: booleanField("imageOverlayEnabled"),
          showTitle: booleanField("showTitle"),
          showSubheading: booleanField("showSubheading"),
          showDescription: booleanField("showDescription"),
          showButton: booleanField("showButton"),
          showPromoCode: booleanField("showPromoCode"),
          showPromoDiscount: booleanField("showPromoDiscount"),
          ...(stringField("categorySlug") ? { categorySlug: stringField("categorySlug") } : {}),
        };
      })
      .filter((banner) => {
        const activeStatus = !banner.status || ["active", "published", "scheduled"].includes(banner.status.toLowerCase());
        const homepagePlacement = !banner.placement || ["homepage_slider", "homepage", "home"].includes(banner.placement.toLowerCase());
        const started = !banner.startDate || banner.startDate <= todayKey;
        const notExpired = !banner.endDate || banner.endDate >= todayKey;
        return Boolean(banner.imageUrl) && activeStatus && homepagePlacement && started && notExpired;
      })
      .sort((left, right) => (left.priority ?? Number.MAX_SAFE_INTEGER) - (right.priority ?? Number.MAX_SAFE_INTEGER));
  },

  async getAnnouncements(): Promise<Announcement[]> {
    const snapshot = await getDocs(collection(db, "announcements"));
    return snapshot.docs
      .map((document) => {
        const data = document.data();
        const text = [data["text"], data["message"], data["title"], data["announcement"]]
          .find((value) => typeof value === "string" && value.trim()) as string | undefined;
        return {
          id: document.id,
          text: text?.trim() || "",
          ...(typeof data["bgColor"] === "string" && data["bgColor"].trim()
            ? { bgColor: data["bgColor"].trim() }
            : {}),
          ...(typeof data["textColor"] === "string" && data["textColor"].trim()
            ? { textColor: data["textColor"].trim() }
            : {}),
          ...(typeof data["displayOrder"] === "number" ? { displayOrder: data["displayOrder"] } : {}),
          isActive: data["isActive"] !== false && data["active"] !== false,
        };
      })
      .filter((announcement) => announcement.text && announcement.isActive)
      .sort((a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER));
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
