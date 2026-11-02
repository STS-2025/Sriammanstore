import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
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
  moveAllInStockToCart: (
    wishlistId?: string,
    allProducts?: Product[]
  ) => Promise<{ addedCount: number; skippedCount: number; unavailableNames: string[] }>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [activeWishlistId, setActiveWishlistId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshWishlist = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [items, folders] = await Promise.all([
        wishlistService.getWishlistProducts(undefined, user?.id),
        wishlistService.getWishlists(user?.id),
      ]);
      setWishlistItems(items || []);
      setWishlists(folders || []);
    } catch (err: unknown) {
      console.error("Failed to load wishlist:", err);
      const msg = err instanceof Error ? err.message : "Failed to load wishlist items.";
      setError(msg);
      setWishlistItems([]);
      setWishlists([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const toggleWishlist = async (
    product: Product,
    optionIndex: number = 0,
    wishlistId: string = "wl_default"
  ): Promise<boolean> => {
    const result = await wishlistService.toggleWishlistProduct(
      product,
      optionIndex,
      wishlistId,
      user?.id
    );
    await refreshWishlist();
    return result.added;
  };

  const isWishlisted = (productId: string): boolean => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  const removeWishlistItem = async (id: string) => {
    await wishlistService.removeWishlistProduct(id);
    await refreshWishlist();
  };

  const createCollection = async (title: string, description: string = ""): Promise<Wishlist> => {
    const created = await wishlistService.createWishlist(title, description, user?.id);
    await refreshWishlist();
    return created;
  };

  const renameCollection = async (
    id: string,
    title: string,
    description?: string
  ): Promise<Wishlist> => {
    const updated = await wishlistService.renameWishlist(id, title, description);
    await refreshWishlist();
    return updated;
  };

  const deleteCollection = async (id: string): Promise<void> => {
    await wishlistService.deleteWishlist(id, user?.id);
    if (activeWishlistId === id) {
      setActiveWishlistId("all");
    }
    await refreshWishlist();
  };

  const moveItemToCollection = async (id: string, targetWishlistId: string): Promise<void> => {
    await wishlistService.moveProductToCollection(id, targetWishlistId);
    await refreshWishlist();
  };

  const moveAllInStockToCart = async (
    wishlistId?: string,
    allProducts?: Product[]
  ): Promise<{ addedCount: number; skippedCount: number; unavailableNames: string[] }> => {
    const isVIP = !!user?.isVIP;
    return wishlistService.moveAllInStockToCart(
      wishlistId || activeWishlistId,
      allProducts,
      user?.id,
      isVIP
    );
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        items: wishlistItems,
        wishlistCount: wishlistItems.length,
        wishlists,
        activeWishlistId,
        setActiveWishlistId,
        isLoading,
        error,
        toggleWishlist,
        addToWishlist: toggleWishlist,
        isWishlisted,
        removeWishlistItem,
        createCollection,
        renameCollection,
        deleteCollection,
        moveItemToCollection,
        moveAllInStockToCart,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}


