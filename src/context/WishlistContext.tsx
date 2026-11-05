import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { wishlistService } from "../services/wishlistService";
import { useAuth } from "./AuthContext";
import type { Wishlist, WishlistProduct, Product } from "../types";

interface WishlistContextType {
  wishlistItems: WishlistProduct[];
  items: WishlistProduct[];
  wishlistCount: number;
  wishlists: Wishlist[];
  activeWishlistId: string;
  setActiveWishlistId: (id: string) => void;
  isLoading: boolean;
  error: string | null;
  toggleWishlist: (product: Product, optionIndex?: number, wishlistId?: string) => Promise<boolean>;
  addToWishlist: (product: Product, optionIndex?: number, wishlistId?: string) => Promise<boolean>;
  isWishlisted: (productId: string) => boolean;
  removeWishlistItem: (id: string) => Promise<void>;
  createCollection: (title: string, description?: string) => Promise<Wishlist>;
  renameCollection: (id: string, title: string, description?: string) => Promise<Wishlist>;
  deleteCollection: (id: string) => Promise<void>;
  moveItemToCollection: (id: string, targetWishlistId: string) => Promise<void>;
  moveAllInStockToCart: (wishlistId?: string, allProducts?: Product[]) => Promise<{ addedCount: number; skippedCount: number; unavailableNames: string[] }>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);
const unsupportedCollections = (): never => { throw new Error("Custom wishlist collections are not available."); };

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeWishlistId, setActiveWishlistId] = useState("all");
  const pendingIds = useRef(new Set<string>());
  const requestId = useRef(0);

  const refreshWishlist = useCallback(async () => {
    const request = ++requestId.current;
    if (!user) {
      setWishlistItems([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const items = await wishlistService.getWishlistProducts();
      if (request === requestId.current) setWishlistItems(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load your wishlist.";
      if (request === requestId.current) {
        setError(message);
        setWishlistItems([]);
      }
    } finally {
      if (request === requestId.current) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { void refreshWishlist(); }, [refreshWishlist]);

  const toggleWishlist = async (product: Product, optionIndex = 0): Promise<boolean> => {
    if (pendingIds.current.has(product.id)) throw new Error("Wishlist update is already in progress.");
    pendingIds.current.add(product.id);
    try {
      const result = await wishlistService.toggleWishlistProduct(product, optionIndex);
      setWishlistItems((items) => result.added
        ? [...items.filter((item) => item.productId !== product.id), result.item!]
        : items.filter((item) => item.productId !== product.id));
      setError(null);
      return result.added;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your wishlist.");
      throw err;
    } finally {
      pendingIds.current.delete(product.id);
    }
  };

  const removeWishlistItem = async (productId: string) => {
    if (pendingIds.current.has(productId)) return;
    pendingIds.current.add(productId);
    try {
      await wishlistService.removeWishlistProduct(productId);
      setWishlistItems((items) => items.filter((item) => item.productId !== productId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove this product.");
      throw err;
    } finally {
      pendingIds.current.delete(productId);
    }
  };

  const moveAllInStockToCart = (wishlistId?: string, allProducts?: Product[]) =>
    wishlistService.moveAllInStockToCart(wishlistId, allProducts, undefined, !!user?.isVIP);

  return (
    <WishlistContext.Provider value={{
      wishlistItems, items: wishlistItems, wishlistCount: wishlistItems.length,
      wishlists: [], activeWishlistId, setActiveWishlistId, isLoading, error,
      toggleWishlist, addToWishlist: toggleWishlist,
      isWishlisted: (productId) => wishlistItems.some((item) => item.productId === productId && item.isActive !== false),
      removeWishlistItem,
      createCollection: async () => unsupportedCollections(),
      renameCollection: async () => unsupportedCollections(),
      deleteCollection: async () => unsupportedCollections(),
      moveItemToCollection: async () => unsupportedCollections(),
      moveAllInStockToCart, refreshWishlist,
    }}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
