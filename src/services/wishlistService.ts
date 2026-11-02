import { apiClient } from "./apiClient";
import type { Wishlist, WishlistProduct, Product } from "../types";
import { cartService } from "./cartService";
import { authService } from "./authService";
import { productService } from "./productService";
import { authManager } from "./authAdapter";
import { productionWishlistReader } from "./productionWishlistReader";
import { resolveCustomerDataSource } from "./customerDataSourceResolver";

export const wishlistService = {
  getEffectiveUserId(userId?: string): string {
    if (userId && typeof userId === "string" && userId.trim()) {
      try {
        return resolveCustomerDataSource(userId).canonicalCustomerId;
      } catch {
        return userId.trim();
      }
    }
    const currentUser = authService.getCurrentUser();
    if (currentUser?.id && typeof currentUser.id === "string" && currentUser.id.trim()) {
      return currentUser.id.trim();
    }
    if (authManager.getMode() === "production") {
      return "";
    }
    if (typeof window !== "undefined") {
      let guestId = localStorage.getItem("sass_guest_session_id");
      if (!guestId) {
        guestId = `guest_${Date.now()}`;
        localStorage.setItem("sass_guest_session_id", guestId);
      }
      return guestId;
    }
    return "";
  },

  async getWishlists(userId?: string): Promise<Wishlist[]> {
    const isProd = authManager.getMode() === "production";
    const effectiveUser = this.getEffectiveUserId(userId);
    if (isProd) {
      if (!effectiveUser) return [];
      const currentUser = authService.getCurrentUser();
      if (currentUser?.legacySassId) {
        return productionWishlistReader.getCustomerWishlists(effectiveUser, undefined, currentUser.legacySassId);
      }
      return productionWishlistReader.getCustomerWishlists(effectiveUser);
    }
    const list = await apiClient.get<Wishlist[]>("/wishlists", { userId: effectiveUser });
    return list || [];
  },

  async createWishlist(
    title: string,
    description: string = "",
    userId?: string
  ): Promise<Wishlist> {
    const effectiveUser = this.getEffectiveUserId(userId);
    const newWl: Wishlist = {
      id: `wl_${Date.now()}`,
      userId: effectiveUser,
      title: title.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
    };
    return apiClient.post<Wishlist>("/wishlists", newWl);
  },

  async renameWishlist(
    id: string,
    title: string,
    description?: string
  ): Promise<Wishlist> {
    const updateData: Partial<Wishlist> = { title: title.trim() };
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    return apiClient.patch<Wishlist>(`/wishlists/${encodeURIComponent(id)}`, updateData);
  },

  async deleteWishlist(id: string, userId?: string): Promise<void> {
    const effectiveUser = this.getEffectiveUserId(userId);
    // Delete the collection document
    try {
      await apiClient.delete(`/wishlists/${encodeURIComponent(id)}`);
    } catch (err: any) {
      if (!err.message?.includes("404") && err.status !== 404) {
        throw err;
      }
    }

    // Reassign items in this collection to default or delete them
    try {
      const items = await this.getWishlistProducts(id, effectiveUser);
      for (const item of items) {
        // Move remaining items to default collection so customer does not lose saved items
        await apiClient.patch(`/wishlistProducts/${encodeURIComponent(item.id)}`, {
          wishlistId: "wl_default",
        }).catch(() => {});
      }
    } catch {
      // Best-effort cleanup
    }
  },

  async getWishlistProducts(
    wishlistId?: string,
    userId?: string
  ): Promise<WishlistProduct[]> {
    const isProd = authManager.getMode() === "production";
    const effectiveUser = this.getEffectiveUserId(userId);
    if (isProd) {
      if (!effectiveUser) return [];
      const currentUser = authService.getCurrentUser();
      if (currentUser?.legacySassId) {
        return productionWishlistReader.getCustomerWishlistProducts(effectiveUser, wishlistId, undefined, undefined, currentUser.legacySassId);
      }
      return productionWishlistReader.getCustomerWishlistProducts(effectiveUser, wishlistId);
    }
    const params: Record<string, string | undefined> = { userId: effectiveUser };
    if (wishlistId && wishlistId !== "all") {
      params["wishlistId"] = wishlistId;
    }
    const list = await apiClient.get<WishlistProduct[]>("/wishlistProducts", params);
    return list || [];
  },

  async toggleWishlistProduct(
    product: Product,
    optionIndex: number = 0,
    wishlistId: string = "wl_default",
    userId?: string
  ): Promise<{ added: boolean; item?: WishlistProduct }> {
    const effectiveUser = this.getEffectiveUserId(userId);
    const items = await this.getWishlistProducts(undefined, effectiveUser);
    const existing = items.find((item) => item.productId === product.id);

    if (existing) {
      await apiClient.delete(`/wishlistProducts/${encodeURIComponent(existing.id)}`);
      return { added: false };
    }

    const option = product.options[optionIndex] || product.options[0];
    if (!option) throw new Error("Product option not found");
    const newWlp: WishlistProduct = {
      id: `wlp_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
      wishlistId: wishlistId || "wl_default",
      userId: effectiveUser,
      productId: product.id,
      optionIndex,
      unit: option.unit,
      unitSize: option.unitSize,
      name: `${product.name} (${option.unitSize}${option.unit})`,
      price: option.offerPrice || option.mrp,
      mrp: option.mrp,
      ...(option.specialPrice !== undefined ? { specialPrice: option.specialPrice } : {}),
      image: product.imageUrl,
    };

    const created = await apiClient.post<WishlistProduct>("/wishlistProducts", newWlp);
    return { added: true, item: created };
  },

  async removeWishlistProduct(id: string): Promise<void> {
    try {
      await apiClient.delete(`/wishlistProducts/${encodeURIComponent(id)}`);
    } catch (err: any) {
      if (err.message?.includes("404") || err.status === 404) {
        return;
      }
      throw err;
    }
  },

  async moveProductToCollection(
    id: string,
    targetWishlistId: string
  ): Promise<WishlistProduct> {
    return apiClient.patch<WishlistProduct>(`/wishlistProducts/${encodeURIComponent(id)}`, {
      wishlistId: targetWishlistId,
    });
  },

  async moveAllInStockToCart(
    wishlistId?: string,
    allProducts?: Product[],
    userId?: string,
    isVIP: boolean = false
  ): Promise<{ addedCount: number; skippedCount: number; unavailableNames: string[] }> {
    const effectiveUser = this.getEffectiveUserId(userId);
    const wishlistItems = await this.getWishlistProducts(wishlistId, effectiveUser);
    const catalog = allProducts && allProducts.length > 0
      ? allProducts
      : await productService.getProducts();

    let addedCount = 0;
    let skippedCount = 0;
    const unavailableNames: string[] = [];

    for (const item of wishlistItems) {
      const prod = catalog.find((p) => p.id === item.productId);
      if (!prod || prod.isActive === false) {
        skippedCount++;
        unavailableNames.push(item.name);
        continue;
      }

      const opt = prod.options[item.optionIndex] || prod.options[0];
      if (!opt || opt.stock <= 0) {
        skippedCount++;
        unavailableNames.push(item.name);
        continue;
      }

      try {
        await cartService.addToCart(prod, item.optionIndex, 1, effectiveUser, isVIP);
        addedCount++;
      } catch {
        skippedCount++;
        unavailableNames.push(item.name);
      }
    }

    return { addedCount, skippedCount, unavailableNames };
  },

  async moveAllToCart(
    wishlistId?: string,
    allProducts?: Product[],
    userId?: string,
    isVIP: boolean = false
  ): Promise<number> {
    const result = await this.moveAllInStockToCart(wishlistId, allProducts, userId, isVIP);
    return result.addedCount;
  },
};


