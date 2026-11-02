import { apiClient } from "./apiClient";
import type { CartItem, Product } from "../types";
import { buildCartKey } from "../lib/productUtils";
import { authService } from "./authService";
import { authManager } from "./authAdapter";
import { productionCartReader } from "./productionCartReader";
import { resolveCustomerDataSource } from "./customerDataSourceResolver";
import { CANONICAL_CUSTOMER_ID_RE } from "./legacyCartAddressAdapter";
import { productService } from "./productService";

const GUEST_CART_KEY = "sri_amman_guest_cart_v1";
const GUEST_SESSION_KEY = "sass_guest_session_id";
const GUEST_MERGE_KEY_PREFIX = "sri_amman_guest_cart_merge_v1_";

interface GuestCartMergeState {
  guestSessionId: string;
  baseQuantities: Record<string, number>;
}

function readGuestCartSnapshot(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(GUEST_CART_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        item && typeof item.productId === "string" && typeof item.quantity === "number"
    );
  } catch {
    return [];
  }
}

function writeGuestCartSnapshot(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    if (items.length === 0) window.localStorage.removeItem(GUEST_CART_KEY);
    else window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch (error) {
    throw new Error("Your browser could not save this cart. Check available storage and try again.", {
      cause: error,
    });
  }
}

function getGuestSessionId(): string {
  if (typeof window === "undefined") return "guest_session";
  try {
    let guestId = window.localStorage.getItem(GUEST_SESSION_KEY);
    if (!guestId) {
      guestId = `guest_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
      window.localStorage.setItem(GUEST_SESSION_KEY, guestId);
    }
    return guestId;
  } catch {
    return "guest_session";
  }
}

function cartItemKey(item: CartItem): string {
  return item.cartKey || item.id;
}

function guestCartFingerprint(items: CartItem[]): string {
  return JSON.stringify(items.map((item) => [cartItemKey(item), item.quantity]).sort());
}

const inFlightGuestMerges = new Map<string, Promise<CartItem[]>>();

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

  async getGuestCart(isVIP = false): Promise<CartItem[]> {
    const snapshot = readGuestCartSnapshot();
    if (!snapshot.length) return [];

    const refreshed = await this.refreshCartItemDetails(snapshot, isVIP);
    writeGuestCartSnapshot(refreshed);
    return refreshed;
  },

  async refreshCartItemDetails(items: CartItem[], isVIP = false): Promise<CartItem[]> {
    const products = await Promise.all(
      items.map((item) => productService.getProductById(item.productId).catch(() => null))
    );
    return items.map((item, index) => {
      const product = products[index];
      if (!product || product.isActive === false) {
        return { ...item, stock: 0 };
      }

      const optionIndex = product.options.findIndex(
        (option) =>
          option.unit.toLowerCase() === item.unit.toLowerCase() &&
          String(option.unitSize) === String(item.unitSize)
      );
      const matchedIndex = optionIndex >= 0 ? optionIndex : item.optionIndex;
      const option = product.options[matchedIndex];
      if (!option) return { ...item, name: product.name, image: product.imageUrl, stock: 0 };

      const cartKey = buildCartKey(product.id, matchedIndex, option.unit, option.unitSize);
      return {
        ...item,
        id: cartKey,
        cartKey,
        productId: product.id,
        optionIndex: matchedIndex,
        unit: option.unit,
        unitSize: option.unitSize,
        name: `${product.name} (${option.unitSize}${option.unit})`,
        price:
          isVIP && option.specialPrice && option.specialPrice > 0
            ? option.specialPrice
            : option.offerPrice || option.mrp,
        mrp: option.mrp,
        ...(option.specialPrice !== undefined ? { specialPrice: option.specialPrice } : {}),
        image: product.imageUrl,
        stock: option.stock,
      };
    });
  },

  async getCart(userId?: string, legacySassId?: string): Promise<CartItem[]> {
    const isProd = authManager.getMode() === "production";
    // An explicit empty identity is used by production diagnostics to mean “no customer”.
    if (userId === "" && isProd) return [];
    const currentUserId = userId?.trim() || authService.getCurrentUser()?.id?.trim();
    if (!currentUserId || currentUserId.startsWith("guest_") || currentUserId === "guest_session") {
      return this.getGuestCart();
    }

    const effectiveUser = this.getEffectiveUserId(currentUserId);
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

  async mergeGuestCart(
    userId: string,
    legacySassId?: string,
    isVIP = false
  ): Promise<CartItem[]> {
    const cleanUserId = userId.trim();
    if (!cleanUserId) throw new Error("A verified customer identity is required to sync the cart.");

    const existingMerge = inFlightGuestMerges.get(cleanUserId);
    if (existingMerge) return existingMerge;

    const mergePromise = (async () => {
      const guestSessionId = getGuestSessionId();
      const rawGuestItems = readGuestCartSnapshot();
      if (!rawGuestItems.length) return [];

      const guestItems = await this.getGuestCart(isVIP);
      const unavailableItems = guestItems.filter((item) => item.stock <= 0);
      if (unavailableItems.length > 0) {
        throw new Error(
          `Some items are unavailable and were kept in your guest cart: ${unavailableItems.map((item) => item.name).join(", ")}. Remove them or try again after checking availability.`
        );
      }

      const effectiveUser = this.getEffectiveUserId(cleanUserId);
      const mergeStateKey = `${GUEST_MERGE_KEY_PREFIX}${effectiveUser}`;
      let mergeState: GuestCartMergeState | null = null;
      if (typeof window !== "undefined") {
        try {
          const parsed = JSON.parse(window.localStorage.getItem(mergeStateKey) || "null");
          if (parsed?.guestSessionId === guestSessionId && parsed?.baseQuantities) {
            mergeState = parsed as GuestCartMergeState;
          }
        } catch {
          mergeState = null;
        }
      }

      const customerItems = await this.getCart(cleanUserId, legacySassId);
      if (!mergeState) {
        mergeState = {
          guestSessionId,
          baseQuantities: Object.fromEntries(
            customerItems.map((item) => [cartItemKey(item), item.quantity])
          ),
        };
        try {
          window.localStorage.setItem(mergeStateKey, JSON.stringify(mergeState));
        } catch {
          throw new Error("Could not safely prepare your cart sync. Your guest cart is still saved.");
        }
      }

      const currentByKey = new Map(customerItems.map((item) => [cartItemKey(item), item]));
      for (const guestItem of guestItems) {
        const key = cartItemKey(guestItem);
        const baseQuantity = mergeState.baseQuantities[key] || 0;
        const desiredQuantity = Math.min(baseQuantity + guestItem.quantity, guestItem.stock);
        const currentItem = currentByKey.get(key);

        if (currentItem) {
          await this.updateQuantity(key, desiredQuantity, cleanUserId);
        } else {
          const storedDocId = `${effectiveUser}__${key}`;
          await apiClient.post<CartItem>("/cart", {
            ...guestItem,
            id: storedDocId,
            cartKey: key,
            userId: effectiveUser,
            quantity: desiredQuantity,
          });
        }
      }

      const mergedItems = await this.getCart(cleanUserId, legacySassId);
      const mergeComplete = guestItems.every((item) => {
        const key = cartItemKey(item);
        const expected = Math.min(
          (mergeState!.baseQuantities[key] || 0) + item.quantity,
          item.stock
        );
        return mergedItems.some(
          (merged) => cartItemKey(merged) === key && merged.quantity === expected
        );
      });
      if (!mergeComplete) {
        throw new Error("Your cart sync is still pending. Your guest cart has been kept; retry to finish.");
      }

      // Remove the local guest cart only after every authenticated item is confirmed persisted.
      if (guestCartFingerprint(readGuestCartSnapshot()) === guestCartFingerprint(rawGuestItems)) {
        writeGuestCartSnapshot([]);
      }
      try {
        window.localStorage.removeItem(mergeStateKey);
      } catch {
        // A completed merge is still safe if cleanup of its retry marker fails.
      }

      return guestItems;
    })();

    inFlightGuestMerges.set(cleanUserId, mergePromise);
    try {
      return await mergePromise;
    } finally {
      if (inFlightGuestMerges.get(cleanUserId) === mergePromise) {
        inFlightGuestMerges.delete(cleanUserId);
      }
    }
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
    if (effectiveUser.startsWith("guest_") || effectiveUser === "guest_session") {
      const items = readGuestCartSnapshot();
      const existing = items.find((item) => cartItemKey(item) === cartKey);
      if (existing) {
        const nextQuantity = existing.quantity + quantity;
        if (nextQuantity > option.stock) {
          throw new Error(`Only ${option.stock} units available in stock`);
        }
        existing.quantity = nextQuantity;
      } else {
        items.push({
          id: cartKey,
          cartKey,
          productId: product.id,
          optionIndex,
          unit: option.unit,
          unitSize: option.unitSize,
          name: `${product.name} (${option.unitSize}${option.unit})`,
          price: isVIP && option.specialPrice ? option.specialPrice : option.offerPrice || option.mrp,
          mrp: option.mrp,
          ...(option.specialPrice !== undefined ? { specialPrice: option.specialPrice } : {}),
          quantity,
          image: product.imageUrl,
          stock: option.stock,
        });
      }
      writeGuestCartSnapshot(items);
      return items.find((item) => cartItemKey(item) === cartKey)!;
    }
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
    if (effectiveUser.startsWith("guest_") || effectiveUser === "guest_session") {
      const items = readGuestCartSnapshot();
      const index = items.findIndex((item) => cartItemKey(item) === cartKey);
      if (index < 0) return null;
      if (quantity <= 0) {
        items.splice(index, 1);
        writeGuestCartSnapshot(items);
        return null;
      }
      const item = items[index]!;
      if (item.stock <= 0) throw new Error("This product is currently unavailable");
      item.quantity = Math.min(quantity, item.stock);
      writeGuestCartSnapshot(items);
      return item;
    }
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
    if (effectiveUser.startsWith("guest_") || effectiveUser === "guest_session") {
      const items = readGuestCartSnapshot().filter((item) => cartItemKey(item) !== cartKey);
      writeGuestCartSnapshot(items);
      return;
    }
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
    if (effectiveUser.startsWith("guest_") || effectiveUser === "guest_session") {
      writeGuestCartSnapshot([]);
      return;
    }
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
