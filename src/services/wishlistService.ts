import { apiClient } from "./apiClient";
import type { Product, Wishlist, WishlistProduct } from "../types";
import { customerIdentityService } from "./customerIdentityService";
import { cartService } from "./cartService";
import { productService } from "./productService";
import { resolveCustomerDataSource } from "./customerDataSourceResolver";

export interface CustomerWishlistEntry {
  productId: string;
  productName: string;
  brandName?: string;
  imageUrl?: string;
  sellingPrice: number;
  mrp?: number;
  variantName?: string;
  addedAt?: unknown;
  isActive: boolean;
  categoryId?: string;
  categoryName?: string;
  sku?: string;
}

function asEntry(raw: Record<string, unknown>): CustomerWishlistEntry {
  const productId = String(raw["productId"] ?? raw["id"] ?? "").trim();
  return {
    productId,
    productName: String(raw["productName"] ?? "Saved product"),
    ...(typeof raw["brandName"] === "string" ? { brandName: raw["brandName"] } : {}),
    ...(typeof raw["imageUrl"] === "string" ? { imageUrl: raw["imageUrl"] } : {}),
    sellingPrice: Number(raw["sellingPrice"] ?? 0),
    ...(typeof raw["mrp"] === "number" ? { mrp: raw["mrp"] } : {}),
    ...(typeof raw["variantName"] === "string" ? { variantName: raw["variantName"] } : {}),
    ...(raw["addedAt"] !== undefined ? { addedAt: raw["addedAt"] } : {}),
    isActive: raw["isActive"] === true,
    ...(typeof raw["categoryId"] === "string" ? { categoryId: raw["categoryId"] } : {}),
    ...(typeof raw["categoryName"] === "string" ? { categoryName: raw["categoryName"] } : {}),
    ...(typeof raw["sku"] === "string" ? { sku: raw["sku"] } : {}),
  };
}

function asUiItem(entry: CustomerWishlistEntry): WishlistProduct {
  const variantName = entry.variantName ?? "";
  const match = variantName.match(/^(.+?)\s+(g|kg|ml|L|pcs)$/i);
  return {
    id: entry.productId,
    wishlistId: "all",
    userId: "",
    productId: entry.productId,
    optionIndex: 0,
    unit: match?.[2] ?? "",
    unitSize: match?.[1] ?? variantName,
    name: entry.productName,
    price: entry.sellingPrice,
    mrp: entry.mrp ?? entry.sellingPrice,
    image: entry.imageUrl ?? "",
    isActive: entry.isActive,
    ...(entry.brandName ? { brandName: entry.brandName } : {}),
    ...(entry.variantName ? { variantName: entry.variantName } : {}),
    ...(entry.addedAt !== undefined ? { addedAt: entry.addedAt } : {}),
  };
}

function customerFacingStorageError(error: unknown): Error {
  const candidate = error as { code?: string; message?: string };
  const message = (candidate?.message || "").toLowerCase();
  if (candidate?.code === "permission-denied" || message.includes("permission") || message.includes("insufficient permissions")) {
    return new Error("Wishlist access is not available yet. Please try again later.");
  }
  if (candidate?.code === "unavailable" || message.includes("offline") || message.includes("network")) {
    return new Error("We couldn't connect to your wishlist. Check your connection and try again.");
  }
  return error instanceof Error ? error : new Error("Could not update your wishlist.");
}

async function resolveWishlistOwner(): Promise<{ customerId: string; adapter: ReturnType<typeof apiClient.getFirestoreAdapter> }> {
  const result = await customerIdentityService.resolveCurrentFirebaseUserProfile();
  if (result.status !== "resolved") {
    if (result.status === "unauthenticated") {
      throw new Error("Sign in with your Firebase customer account to use your wishlist.");
    }
    if (result.status === "unlinked") {
      throw new Error("This Firebase account is not linked to a store customer profile yet.");
    }
    if (result.status === "database_error") {
      throw new Error("We couldn't verify your customer profile with the store. Please try again.");
    }
    throw new Error("Your customer profile could not be verified. Please sign in again or contact support.");
  }
  if (result.mapping.collection !== "onlineCustomers") {
    throw new Error("This account is linked to a legacy customer profile. Wishlist access requires an online customer profile.");
  }
  if (
    !/^ONCUS\d{6,7}$/i.test(result.userDocId) ||
    result.mapping.userDocId !== result.userDocId ||
    result.profile.id !== result.userDocId
  ) {
    throw new Error("Your customer profile could not be verified. Please sign in again or contact support.");
  }
  return { customerId: result.userDocId, adapter: apiClient.getFirestoreAdapter() };
}

async function readEntries(): Promise<CustomerWishlistEntry[]> {
  const { customerId, adapter } = await resolveWishlistOwner();
  let rows: Record<string, unknown>[];
  try { rows = await adapter.getCustomerWishlistProducts(customerId); }
  catch (error) { throw customerFacingStorageError(error); }
  return rows.map(asEntry).filter((entry) => entry.productId);
}

export const wishlistService = {
  async getWishlists(_userId?: string): Promise<Wishlist[]> { return []; },
  async createWishlist(_title: string, _description = "", _userId?: string): Promise<Wishlist> { throw new Error("Custom wishlist collections are not available."); },
  async renameWishlist(_id: string, _title: string, _description?: string): Promise<Wishlist> { throw new Error("Custom wishlist collections are not available."); },
  async deleteWishlist(_id: string, _userId?: string): Promise<void> { throw new Error("Custom wishlist collections are not available."); },
  async moveProductToCollection(_id: string, _targetWishlistId: string): Promise<WishlistProduct> { throw new Error("Custom wishlist collections are not available."); },
  getEffectiveUserId(userId?: string): string {
    if (!userId?.trim()) return "";
    try { return resolveCustomerDataSource(userId).canonicalCustomerId; }
    catch { return userId.trim(); }
  },
  async getWishlistProducts(_wishlistId?: string, _userId?: string): Promise<WishlistProduct[]> {
    return (await readEntries()).map(asUiItem);
  },

  async getCustomerWishlistEntries(): Promise<CustomerWishlistEntry[]> {
    return readEntries();
  },

  async toggleWishlistProduct(product: Product, optionIndex = 0, _wishlistId?: string, _userId?: string): Promise<{ added: boolean; item?: WishlistProduct }> {
    if (!product?.id || !product.name || product.isActive === false) throw new Error("This product is unavailable.");
    const { customerId, adapter } = await resolveWishlistOwner();
    const existing = (await adapter.getCustomerWishlistProducts(customerId))
      .map(asEntry)
      .find((entry) => entry.productId === product.id && entry.isActive);
    if (existing) {
      try { await adapter.deleteCustomerWishlistProduct(customerId, product.id); }
      catch (error) { throw customerFacingStorageError(error); }
      return { added: false };
    }
    const option = product.options?.[optionIndex] ?? product.options?.[0];
    if (!option) throw new Error("Product pricing is unavailable.");
    const entry: Record<string, unknown> = {
      productId: product.id,
      productName: product.name,
      ...(product.brand ? { brandName: product.brand } : {}),
      imageUrl: product.imageUrl || product.images?.[0] || "/placeholders/spices.svg",
      sellingPrice: option.offerPrice,
      ...(Number.isFinite(option.mrp) ? { mrp: option.mrp } : {}),
      variantName: `${option.unitSize} ${option.unit}`.trim(),
      isActive: true,
      ...(product.category ? { categoryName: product.category } : {}),
    };
    try { await adapter.saveCustomerWishlistProduct(customerId, product.id, entry); }
    catch (error) { throw customerFacingStorageError(error); }
    return { added: true, item: asUiItem(asEntry(entry)) };
  },

  async removeWishlistProduct(productId: string): Promise<void> {
    const { customerId, adapter } = await resolveWishlistOwner();
    try { await adapter.deleteCustomerWishlistProduct(customerId, productId); }
    catch (error) { throw customerFacingStorageError(error); }
  },

  async moveAllToCart(wishlistId?: string, allProducts?: Product[], userId?: string, isVIP = false): Promise<number> {
    return (await this.moveAllInStockToCart(wishlistId, allProducts, userId, isVIP)).addedCount;
  },

  async moveAllInStockToCart(
    _wishlistId?: string,
    allProducts?: Product[],
    _userId?: string,
    isVIP = false,
  ): Promise<{ addedCount: number; skippedCount: number; unavailableNames: string[] }> {
    const entries = await readEntries();
    const catalog = allProducts?.length ? allProducts : await productService.getProducts();
    const { customerId } = await resolveWishlistOwner();
    let addedCount = 0;
    let skippedCount = 0;
    const unavailableNames: string[] = [];
    for (const entry of entries) {
      const product = catalog.find((candidate) => candidate.id === entry.productId);
      const savedVariant = entry.variantName?.trim().toLowerCase();
      const matchedOptionIndex = product?.options?.findIndex((candidate) =>
        `${candidate.unitSize} ${candidate.unit}`.trim().toLowerCase() === savedVariant
      ) ?? -1;
      const optionIndex = matchedOptionIndex >= 0 ? matchedOptionIndex : 0;
      const option = product?.options?.[optionIndex];
      if (!product || product.isActive === false || !option || option.stock <= 0) {
        skippedCount++;
        unavailableNames.push(entry.productName);
        continue;
      }
      try {
        await cartService.addToCart(product, optionIndex, 1, customerId, isVIP);
        addedCount++;
      } catch {
        skippedCount++;
        unavailableNames.push(entry.productName);
      }
    }
    return { addedCount, skippedCount, unavailableNames };
  },
};
