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
  toggleWishlist: (product: Product, optionIndex?: number, wishlistId?: string) => Promise<boolean | undefined>;
  addToWishlist: (product: Product, optionIndex?: number, wishlistId?: string) => Promise<boolean | undefined>;
  isWishlisted: (productId: string) => boolean;
  removeWishlistItem: (id: string, wishlistId?: string) => Promise<void>;
  createCollection: (title: string, description?: string) => Promise<Wishlist>;
  renameCollection: (id: string, title: string, description?: string) => Promise<Wishlist>;
  deleteCollection: (id: string) => Promise<void>;
  moveItemToCollection: (id: string, targetWishlistId: string, sourceWishlistId?: string) => Promise<void>;
  moveAllInStockToCart: (wishlistId?: string, allProducts?: Product[]) => Promise<{ addedCount: number; skippedCount: number; unavailableNames: string[] }>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlistItems, setWishlistItems] = useState<WishlistProduct[]>([]);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingWishlistSave, setPendingWishlistSave] = useState<{
    product: Product;
    optionIndex: number;
    resolve: (added: boolean | undefined) => void;
  } | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [newFolderTitle, setNewFolderTitle] = useState("");
  const [pickerError, setPickerError] = useState("");
  const [isSavingSelection, setIsSavingSelection] = useState(false);
  const [activeWishlistId, setActiveWishlistId] = useState("all");
  const pendingIds = useRef(new Set<string>());
  const requestId = useRef(0);

  const refreshWishlist = useCallback(async () => {
    const request = ++requestId.current;
    if (!user) {
      setWishlistItems([]);
      setWishlists([]);
      setError(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [items, collections] = await Promise.all([
        wishlistService.getWishlistProducts(),
        wishlistService.getWishlists(),
      ]);
      if (request === requestId.current) {
        setWishlistItems(items);
        setWishlists(collections);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load your wishlist.";
      if (request === requestId.current) {
        setError(message);
        setWishlistItems([]);
        setWishlists([]);
      }
    } finally {
      if (request === requestId.current) setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { void refreshWishlist(); }, [refreshWishlist]);

  const toggleWishlist = async (product: Product, optionIndex = 0): Promise<boolean | undefined> => {
    if (pendingIds.current.has(product.id)) throw new Error("Wishlist update is already in progress.");
    const existingItem = wishlistItems.find((item) => item.productId === product.id && item.isActive !== false);
    if (!existingItem) {
      setPickerError("");
      setNewFolderTitle("");
      setSelectedFolderId(wishlists[0]?.id || "");
      return new Promise((resolve) => {
        pendingIds.current.add(product.id);
        setPendingWishlistSave({ product, optionIndex, resolve });
      }).finally(() => pendingIds.current.delete(product.id));
    }
    pendingIds.current.add(product.id);
    try {
      await wishlistService.removeWishlistProduct(product.id, existingItem.wishlistId);
      setWishlistItems((items) => items.filter((item) =>
        item.productId !== product.id || item.wishlistId !== existingItem.wishlistId
      ));
      setError(null);
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your wishlist.");
      throw err;
    } finally {
      pendingIds.current.delete(product.id);
    }
  };

  const removeWishlistItem = async (productId: string, wishlistId = "all") => {
    if (pendingIds.current.has(productId)) return;
    pendingIds.current.add(productId);
    try {
      await wishlistService.removeWishlistProduct(productId, wishlistId);
      setWishlistItems((items) => items.filter((item) =>
        item.productId !== productId || item.wishlistId !== wishlistId
      ));
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

  const createCollection = async (title: string, description = "") => {
    const created = await wishlistService.createWishlist(title, description);
    await refreshWishlist();
    return created;
  };

  const finishWishlistSelection = (added: boolean | undefined) => {
    pendingWishlistSave?.resolve(added);
    setPendingWishlistSave(null);
    setPickerError("");
    setIsSavingSelection(false);
  };

  const saveToSelectedFolder = async (folderId: string) => {
    if (!pendingWishlistSave || !folderId || isSavingSelection) return;
    setIsSavingSelection(true);
    setPickerError("");
    try {
      await wishlistService.saveProductToWishlistFolder(
        pendingWishlistSave.product,
        pendingWishlistSave.optionIndex,
        folderId,
      );
      await refreshWishlist();
      finishWishlistSelection(true);
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "Could not save this product.");
      setIsSavingSelection(false);
    }
  };

  const createFolderAndSave = async () => {
    if (!newFolderTitle.trim() || !pendingWishlistSave || isSavingSelection) return;
    setIsSavingSelection(true);
    setPickerError("");
    try {
      const created = await createCollection(newFolderTitle.trim());
      setSelectedFolderId(created.id);
      setNewFolderTitle("");
      await wishlistService.saveProductToWishlistFolder(
        pendingWishlistSave.product,
        pendingWishlistSave.optionIndex,
        created.id,
      );
      await refreshWishlist();
      finishWishlistSelection(true);
    } catch (err) {
      setPickerError(err instanceof Error ? err.message : "Could not create the folder.");
      setIsSavingSelection(false);
    }
  };

  const renameCollection = async (id: string, title: string, description = "") => {
    const updated = await wishlistService.renameWishlist(id, title, description);
    setWishlists((items) => items.map((item) => item.id === id ? updated : item));
    return updated;
  };

  const deleteCollection = async (id: string) => {
    await wishlistService.deleteWishlist(id);
    setWishlists((items) => items.filter((item) => item.id !== id));
    setWishlistItems((items) => items.filter((item) => item.wishlistId !== id));
    setActiveWishlistId((activeId) => activeId === id ? "all" : activeId);
  };

  const moveItemToCollection = async (id: string, targetWishlistId: string, sourceWishlistId = activeWishlistId) => {
    await wishlistService.moveProductToCollection(id, targetWishlistId, sourceWishlistId);
    await refreshWishlist();
  };

  return (
    <WishlistContext.Provider value={{
      wishlistItems, items: wishlistItems, wishlistCount: wishlistItems.filter((item) => item.wishlistId === "all").length,
      wishlists, activeWishlistId, setActiveWishlistId, isLoading, error,
      toggleWishlist, addToWishlist: toggleWishlist,
      isWishlisted: (productId) => wishlistItems.some((item) => item.productId === productId && item.isActive !== false),
      removeWishlistItem,
      createCollection,
      renameCollection,
      deleteCollection,
      moveItemToCollection,
      moveAllInStockToCart, refreshWishlist,
    }}>
      {children}
      {pendingWishlistSave && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishlist-folder-picker-title"
            className="w-full max-w-sm rounded-3xl border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="wishlist-folder-picker-title" className="text-lg font-bold text-on-surface">Save to a wishlist folder</h2>
                <p className="mt-1 text-sm text-on-surface-variant">Choose where to save {pendingWishlistSave.product.name}.</p>
              </div>
              <button type="button" aria-label="Close" disabled={isSavingSelection} onClick={() => finishWishlistSelection(undefined)} className="text-outline hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {wishlists.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="wishlist-folder-select" className="block text-sm font-semibold text-on-surface">Your folders</label>
                <select
                  id="wishlist-folder-select"
                  value={selectedFolderId}
                  onChange={(event) => setSelectedFolderId(event.target.value)}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-3 text-sm text-on-surface"
                >
                  {wishlists.map((folder) => <option key={folder.id} value={folder.id}>{folder.title}</option>)}
                </select>
                <button type="button" disabled={!selectedFolderId || isSavingSelection} onClick={() => void saveToSelectedFolder(selectedFolderId)} className="w-full rounded-xl bg-primary px-4 py-3 font-bold text-white disabled:opacity-50">
                  {isSavingSelection ? "Saving..." : "Save to folder"}
                </button>
              </div>
            )}
            <div className={`${wishlists.length ? "mt-5 border-t border-outline-variant/30 pt-4" : ""} space-y-2`}>
              <label htmlFor="wishlist-new-folder" className="block text-sm font-semibold text-on-surface">Create a new wish folder</label>
              <input
                id="wishlist-new-folder"
                value={newFolderTitle}
                maxLength={256}
                onChange={(event) => setNewFolderTitle(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void createFolderAndSave(); } }}
                placeholder="Folder name"
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-low px-3 py-3 text-sm text-on-surface"
              />
              <button type="button" disabled={!newFolderTitle.trim() || isSavingSelection} onClick={() => void createFolderAndSave()} className="w-full rounded-xl border border-primary px-4 py-3 font-bold text-primary disabled:opacity-50">
                {isSavingSelection ? "Creating..." : "Create folder and save"}
              </button>
            </div>
            {pickerError && <p role="alert" className="mt-3 text-sm text-red-600">{pickerError}</p>}
            <button type="button" disabled={isSavingSelection} onClick={() => finishWishlistSelection(undefined)} className="mt-3 w-full py-2 text-sm font-semibold text-on-surface-variant">Cancel</button>
          </section>
        </div>
      )}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
}
