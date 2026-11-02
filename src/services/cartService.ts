import { apiClient } from "./apiClient";
import type { CartItem, Product } from "../types";
import { buildCartKey } from "../lib/productUtils";
import { authService } from "./authService";
import { authManager } from "./authAdapter";
import { productionCartReader } from "./productionCartReader";
import { resolveCustomerDataSource } from "./customerDataSourceResolver";
import { CANONICAL_CUSTOMER_ID_RE } from "./legacyCartAddressAdapter";

export const cartService = {
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
    if (typeof window !== "undefined") {
      let guestId = localStorage.getItem("sass_guest_session_id");
      if (!guestId) {
        guestId = `guest_${Date.now()}`;
        localStorage.setItem("sass_guest_session_id", guestId);
      }
      return guestId;
    }
    return "guest_session";
  },

  async getCart(userId?: string, legacySassId?: string): Promise<CartItem[]> {
    const isProd = authManager.getMode() === "production";
    const effectiveUser = this.getEffectiveUserId(userId);
    if (isProd) {
      if (!effectiveUser || !CANONICAL_CUSTOMER_ID_RE.test(effectiveUser)) return [];
      const currentUser = authService.getCurrentUser();
      let resolvedLegacySassId = legacySassId || currentUser?.legacySassId;
      if (!resolvedLegacySassId) {
        try {
          resolvedLegacySassId = resolveCustomerDataSource(effectiveUser).legacySassId;
        } catch {
          // ignore
        }
      }
      if (resolvedLegacySassId) {
        return productionCartReader.getCustomerCart(
          effectiveUser,
          undefined,
          resolvedLegacySassId
        );
      }
      return productionCartReader.getCustomerCart(effectiveUser);
    }

    const items = await apiClient.get<CartItem[]>("/cart", { userId: effectiveUser });
    return (items || [])
      .filter((item) => !item.userId || item.userId === effectiveUser)
      .map((item) => {
        const canonicalKey =
          item.cartKey ||
          (item.id.includes("__opt")
            ? item.id.replace(new RegExp(`^${effectiveUser}__`), "")
            : item.id);
        return {
          ...item,
          id: canonicalKey,
          cartKey: canonicalKey,
          userId: item.userId || effectiveUser,
        };
      });
  },

  async addToCart(
    product: Product,
    optionIndex: number = 0,
    quantity: number = 1,
    userId?: string,
    isVIP: boolean = false
  ): Promise<CartItem> {
    const option = product.options[optionIndex] || product.options[0];
    if (!option) throw new Error("Product option not found");

    if (option.stock <= 0) {
      throw new Error("This product is currently out of stock");
    }

    const effectiveUser = this.getEffectiveUserId(userId);
    const cartKey = buildCartKey(product.id, optionIndex, option.unit, option.unitSize);
    const storedDocId = `${effectiveUser}__${cartKey}`;

    // Check if the item already exists in this customer's cart
    const existingItems = await this.getCart(effectiveUser);
    const existing = existingItems.find(
      (item) => item.id === cartKey || item.cartKey === cartKey
    );

    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > option.stock) {
        throw new Error(`Only ${option.stock} units available in stock`);
      }
      await apiClient.patch<CartItem>(`/cart/${encodeURIComponent(storedDocId)}`, {
        quantity: newQty,
      });
      return {
        ...existing,
        id: cartKey,
        cartKey,
        userId: effectiveUser,
        quantity: newQty,
      };
    }

    const price =
      isVIP && option.specialPrice && option.specialPrice > 0
        ? option.specialPrice
        : option.offerPrice || option.mrp;

    const newItem: CartItem = {
      id: storedDocId,
      cartKey,
      userId: effectiveUser,
      productId: product.id,
      optionIndex,
      unit: option.unit,
      unitSize: option.unitSize,
      name: `${product.name} (${option.unitSize}${option.unit})`,
      price,
      mrp: option.mrp,
      ...(option.specialPrice !== undefined ? { specialPrice: option.specialPrice } : {}),
      quantity,
      image: product.imageUrl,
      stock: option.stock,
    };

    const created = await apiClient.post<CartItem>("/cart", newItem);
    return {
      ...created,
      id: cartKey,
      cartKey,
      userId: effectiveUser,
    };
  },

  async updateQuantity(
    cartKey: string,
    quantity: number,
    userId?: string
  ): Promise<CartItem | null> {
    const effectiveUser = this.getEffectiveUserId(userId);
    if (quantity <= 0) {
      await this.removeFromCart(cartKey, effectiveUser);
      return null;
    }
    const storedDocId = cartKey.startsWith(`${effectiveUser}__`)
      ? cartKey
      : `${effectiveUser}__${cartKey}`;
    const updated = await apiClient.patch<CartItem>(
      `/cart/${encodeURIComponent(storedDocId)}?userId=${encodeURIComponent(effectiveUser)}`,
      { quantity, userId: effectiveUser }
    );
    const canonicalKey = cartKey.replace(new RegExp(`^${effectiveUser}__`), "");
    return {
      ...updated,
      id: canonicalKey,
      cartKey: canonicalKey,
      userId: effectiveUser,
    };
  },

  async removeFromCart(cartKey: string, userId?: string): Promise<void> {
    const effectiveUser = this.getEffectiveUserId(userId);
    const storedDocId = cartKey.startsWith(`${effectiveUser}__`)
      ? cartKey
      : `${effectiveUser}__${cartKey}`;
    try {
      await apiClient.delete(
        `/cart/${encodeURIComponent(storedDocId)}?userId=${encodeURIComponent(effectiveUser)}`
      );
    } catch {
      await apiClient
        .delete(
          `/cart/${encodeURIComponent(cartKey)}?userId=${encodeURIComponent(effectiveUser)}`
        )
        .catch(() => {});
    }
  },

  async clearCart(userId?: string): Promise<void> {
    const effectiveUser = this.getEffectiveUserId(userId);
    if (apiClient.isLegacyCustomerSubcollectionsEnabled() || authManager.getMode() === "production") {
      try {
        await apiClient.delete(`/cart?userId=${encodeURIComponent(effectiveUser)}`);
        return;
      } catch {
        // Fall back to item-by-item deletion
      }
    }

    const items = await this.getCart(effectiveUser);
    for (const item of items) {
      if (item.userId && item.userId !== effectiveUser) continue;
      const canonical = item.cartKey || item.id;
      const storedDocId = `${effectiveUser}__${canonical}`;
      try {
        await apiClient.delete(
          `/cart/${encodeURIComponent(storedDocId)}?userId=${encodeURIComponent(effectiveUser)}`
        );
      } catch {
        if (item.userId === effectiveUser) {
          await apiClient
            .delete(
              `/cart/${encodeURIComponent(item.id)}?userId=${encodeURIComponent(effectiveUser)}`
            )
            .catch(() => {});
        }
      }
    }
  },
};
