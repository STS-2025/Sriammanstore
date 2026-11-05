import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { OrderProductImage } from "../components/product/OrderProductImage";
import { WishlistHeartButton } from "../components/product/WishlistHeartButton";
import { productService } from "../services/productService";
import type { Wishlist, WishlistProduct, Product } from "../types";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { calculateComplementaryScore, hasAvailableStock } from "../lib/recommendationUtils";
import { toast } from "sonner";
import { authManager } from "../services/authAdapter";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Wishlist & Curated Collections — Sri Amman Smart Store" },
      {
        name: "description",
        content:
          "Save your favorite farm-pressed staples and seasonal produce for frictionless replenishment and rapid 60-min delivery.",
      },
    ],
  }),
  component: WishlistPage,
});

type SortOption = "recent" | "price_asc" | "price_desc" | "savings" | "name";

function wishlistEntryTime(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    return value.toMillis();
  }
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export function WishlistPage() {
  const { user, isLoading: authLoading, isResolvingIdentity } = useAuth();
  const { addToCart } = useCart();
  const {
    wishlistItems,
    wishlists,
    activeWishlistId,
    setActiveWishlistId,
    isLoading,
    error: wishlistError,
    isWishlisted,
    toggleWishlist,
    removeWishlistItem,
    moveAllInStockToCart,
    createCollection,
    renameCollection,
    deleteCollection,
    moveItemToCollection,
    refreshWishlist,
  } = useWishlist();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDesc, setCreateDesc] = useState("");

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [renameDesc, setRenameDesc] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [movingItemId, setMovingItemId] = useState<string | null>(null);

  // Load catalog products for current stock status, variant options & recommendations
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const prods = await productService.getProducts();
        if (isMounted) {
          setAllProducts(prods || []);
        }
      } catch (err) {
        console.error("Failed to load catalog products:", err);
      } finally {
        if (isMounted) {
          setLoadingCatalog(false);
        }
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter items by active collection folder
  const currentFolderItems = useMemo(() => {
    if (activeWishlistId === "all") {
      return wishlistItems;
    }
    return wishlistItems.filter((i) => i.wishlistId === activeWishlistId);
  }, [wishlistItems, activeWishlistId]);

  // Collection counts mapping for badges
  const collectionCounts = useMemo(() => {
    const map: Record<string, number> = {
      all: wishlistItems.length,
    };
    for (const wl of wishlists) {
      map[wl.id] = wishlistItems.filter((i) => i.wishlistId === wl.id).length;
    }
    return map;
  }, [wishlists, wishlistItems]);

  // Compute live stock & catalog metadata for each saved item
  const enrichedItems = useMemo(() => {
    return currentFolderItems.map((item) => {
      const catalogProd = allProducts.find((p) => p.id === item.productId);
      const savedVariant = item.variantName?.trim().toLowerCase();
      const matchingIndex = catalogProd?.options?.findIndex((candidate) =>
        `${candidate.unitSize} ${candidate.unit}`.trim().toLowerCase() === savedVariant
      ) ?? -1;
      const optionIndex = matchingIndex >= 0 ? matchingIndex : 0;
      const opt = catalogProd?.options?.[optionIndex] || catalogProd?.options?.[0];
      const stock = opt?.stock ?? 0;
      const inStock = stock > 0 && catalogProd?.isActive !== false && item.isActive !== false;
      const mrp = opt?.mrp ?? item.mrp;
      const price = user?.isVIP && opt?.specialPrice && opt.specialPrice > 0
        ? opt.specialPrice
        : (opt?.offerPrice ?? item.price);
      const savings = Math.max(0, mrp - price);
      const discountPercent = mrp > 0 && savings > 0 ? Math.round((savings / mrp) * 100) : 0;
      const tag = catalogProd?.tags?.[0] || catalogProd?.category || "STAPLE";

      return {
        ...item,
        id: item.productId,
        optionIndex,
        name: catalogProd?.name || item.name,
        image: catalogProd?.imageUrl || item.image,
        unit: opt?.unit || item.unit,
        unitSize: opt?.unitSize || item.unitSize,
        catalogProd,
        stock,
        inStock,
        mrp,
        price,
        savings,
        discountPercent,
        tag,
      };
    });
  }, [currentFolderItems, allProducts, user?.isVIP]);

  // Filter by search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return enrichedItems;
    const q = searchQuery.toLowerCase().trim();
    return enrichedItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.unit.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q)
    );
  }, [enrichedItems, searchQuery]);

  // Sort items
  const sortedItems = useMemo(() => {
    const list = [...filteredItems];
    switch (sortBy) {
      case "price_asc":
        return list.sort((a, b) => a.price - b.price);
      case "price_desc":
        return list.sort((a, b) => b.price - a.price);
      case "savings":
        return list.sort((a, b) => b.savings - a.savings);
      case "name":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "recent":
      default:
        return list.sort((a, b) => wishlistEntryTime(b.addedAt) - wishlistEntryTime(a.addedAt));
    }
  }, [filteredItems, sortBy]);

  // Active in-stock count for the batch cart CTA
  const inStockCount = useMemo(() => {
    return enrichedItems.filter((i) => i.inStock).length;
  }, [enrichedItems]);

  // VIP Savings Calculation across all in-stock saved items
  const totalVipSavings = useMemo(() => {
    let total = 0;
    for (const item of enrichedItems) {
      if (item.inStock && item.catalogProd) {
        const opt = item.catalogProd.options?.[item.optionIndex] || item.catalogProd.options?.[0];
        if (opt?.specialPrice && opt.offerPrice && opt.specialPrice < opt.offerPrice) {
          total += (opt.offerPrice - opt.specialPrice);
        }
      }
    }
    return total;
  }, [enrichedItems]);

  // Curated Recommendations Based on Saved Items
  const recommendations = useMemo(() => {
    if (allProducts.length === 0 || wishlistItems.length === 0) return [];

    const savedProductIds = new Set(wishlistItems.map((i) => i.productId));
    const scoredMap = new Map<string, { product: Product; score: number }>();

    // Score all non-saved catalog products against each saved item
    for (const savedItem of wishlistItems) {
      const targetProd = allProducts.find((p) => p.id === savedItem.productId);
      if (!targetProd) continue;

      for (const candidate of allProducts) {
        if (savedProductIds.has(candidate.id) || candidate.isActive === false) continue;
        const score = calculateComplementaryScore(targetProd, candidate, savedProductIds);
        if (score > 0) {
          const current = scoredMap.get(candidate.id);
          if (!current || score > current.score) {
            scoredMap.set(candidate.id, { product: candidate, score });
          }
        }
      }
    }

    const sortedCandidates = Array.from(scoredMap.values())
      .filter((entry) => hasAvailableStock(entry.product))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map((entry) => entry.product);

    return sortedCandidates;
  }, [allProducts, wishlistItems]);

  // Handlers
  const handleAddToCart = async (item: (typeof enrichedItems)[0]) => {
    const prod = item.catalogProd || allProducts.find((p) => p.id === item.productId);
    if (!prod) {
      toast.error("Product details currently unavailable");
      return;
    }
    try {
      await addToCart(prod, item.optionIndex, 1);
      toast.success(`Added ${item.name} to cart`);
    } catch (err: any) {
      toast.error(err.message || "Could not add to cart");
    }
  };

  const handleMoveAllInStockToCart = async () => {
    if (inStockCount === 0) {
      toast.error("No in-stock items available to move");
      return;
    }
    try {
      const result = await moveAllInStockToCart(activeWishlistId, allProducts);
      if (result.addedCount > 0) {
        if (result.skippedCount > 0) {
          toast.success(
            `Added ${result.addedCount} items to cart. Skipped ${result.skippedCount} out-of-stock items.`
          );
        } else {
          toast.success(`Added all ${result.addedCount} in-stock items to your cart!`);
        }
      } else {
        toast.error("Could not add items. Products may be currently out of stock.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to batch move items to cart");
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) return;
    try {
      const created = await createCollection(createTitle.trim(), createDesc.trim());
      setActiveWishlistId(created.id);
      setShowCreateModal(false);
      setCreateTitle("");
      setCreateDesc("");
      toast.success(`Created collection "${created.title}"!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create collection");
    }
  };

  const handleRenameCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTargetId || !renameTitle.trim()) return;
    try {
      const updated = await renameCollection(renameTargetId, renameTitle.trim(), renameDesc.trim());
      setShowRenameModal(false);
      setRenameTargetId(null);
      setRenameTitle("");
      setRenameDesc("");
      toast.success(`Collection renamed to "${updated.title}"!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to rename collection");
    }
  };

  const handleDeleteCollection = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteCollection(deleteTargetId);
      setShowDeleteModal(false);
      setDeleteTargetId(null);
      toast.success("Collection deleted. Saved items moved to All Saved Items.");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete collection");
    }
  };

  const handleMoveProduct = async (itemId: string, targetId: string) => {
    try {
      await moveItemToCollection(itemId, targetId);
      setMovingItemId(null);
      const targetName =
        targetId === "wl_default"
          ? "All Saved Staples"
          : wishlists.find((w) => w.id === targetId)?.title || "Collection";
      toast.success(`Moved item to ${targetName}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to move item");
    }
  };

  const handleRemoveItem = async (id: string, name: string): Promise<boolean> => {
    try {
      await removeWishlistItem(id);
      toast.info(`Removed ${name} from saved staples`);
      return false;
    } catch (err: any) {
      toast.error(err.message || "Failed to remove item");
      return false;
    }
  };

  // Loading & Session Restoration View
  if ((authLoading || isResolvingIdentity) && !user) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1000px] mx-auto px-margin-desktop py-20 text-center">
          <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-on-surface-variant font-medium">
            Loading your wishlist...
          </p>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  // Unauthenticated Empty State
  if (!user) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1000px] mx-auto px-margin-desktop py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-4xl mx-auto mb-4">
            ❤️
          </div>
          <h2 className="font-headline-lg text-xl font-bold text-on-surface mb-2">
            Please Sign In to Access Your Wishlist
          </h2>
          <p className="text-xs text-on-surface-variant mb-6 max-w-md mx-auto">
            Sign in with your mobile number to view and manage your saved items, curated monthly staples, and synchronized pantry lists.
          </p>
          <Link
            to="/login"
            search={{ redirect: "/wishlist" } as any}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all"
          >
            <span>Sign In with Mobile OTP</span>
          </Link>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  const activeCollectionObj = wishlists.find((w) => w.id === activeWishlistId);

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]">
        <div className="max-w-[1320px] mx-auto px-margin-desktop py-space-xl">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-on-surface-variant mb-4">
            <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">home</span>
              <span>Home</span>
            </Link>
            <span className="text-outline-variant">›</span>
            <Link to="/account" className="hover:text-primary transition-colors">
              My Account
            </Link>
            <span className="text-outline-variant">›</span>
            <span className="text-on-surface font-semibold">My Wishlist</span>
          </nav>

          {/* Heading & VIP Callout Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  <span>💚</span>
                  <span>Personal Sourcing Vault</span>
                </div>
              </div>
              <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight">
                My Wishlist
              </h1>
              <p className="text-xs md:text-sm text-on-surface-variant mt-1 max-w-2xl">
                Save your favorite farm-pressed staples and seasonal produce for frictionless replenishment and rapid 60-min delivery.
              </p>
            </div>

            {/* VIP Member Savings Badge Card */}
            <div className="shrink-0 flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-2.5 shadow-sm">
              <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-700 text-lg font-bold">
                🪙
              </div>
              <div>
                <span className="font-headline-sm text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                  {user.isVIP ? "VIP Member Price" : "VIP Club Member"}
                </span>
                <span className="font-headline-sm text-xs font-extrabold text-emerald-800">
                  {user.isVIP
                    ? `Extra ₹${totalVipSavings > 0 ? totalVipSavings : 85} Savings Active`
                    : "Exclusive Club Savings Available"}
                </span>
              </div>
            </div>
          </div>

          {/* Customer wishlist has one saved-products list. */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-outline-variant/15">
            <div className="flex items-center gap-2 shrink-0">
              {/* All Saved Staples Tab */}
              <button
                type="button"
                onClick={() => setActiveWishlistId("all")}
                className={`px-4 py-2 rounded-full font-headline-sm text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeWishlistId === "all"
                    ? "bg-[#005f3f] text-white shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">bookmark</span>
                <span>All Saved Staples</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    activeWishlistId === "all"
                      ? "bg-white/20 text-white"
                      : "bg-surface-container text-on-surface"
                  }`}
                >
                  {collectionCounts["all"] ?? 0}
                </span>
              </button>

              {/* Dynamic User Collections */}
              {wishlists.map((wl) => (
                <button
                  key={wl.id}
                  type="button"
                  onClick={() => setActiveWishlistId(wl.id)}
                  className={`px-4 py-2 rounded-full font-headline-sm text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeWishlistId === wl.id
                      ? "bg-[#005f3f] text-white shadow-sm"
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {wl.title.toLowerCase().includes("pantry") || wl.title.toLowerCase().includes("monthly")
                      ? "event_note"
                      : "inventory_2"}
                  </span>
                  <span>{wl.title}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      activeWishlistId === wl.id
                        ? "bg-white/20 text-white"
                        : "bg-surface-container text-on-surface"
                    }`}
                  >
                    {collectionCounts[wl.id] ?? 0}
                  </span>
                </button>
              ))}
            </div>

          </div>

          {/* Active Custom Collection Controls (Rename / Delete) */}
          {activeCollectionObj && activeWishlistId !== "all" && activeWishlistId !== "wl_default" && (
            <div className="flex items-center justify-between bg-surface-container-low/60 rounded-2xl px-4 py-2.5 mb-5 text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">folder_open</span>
                <span className="font-bold text-on-surface">{activeCollectionObj.title}</span>
                {activeCollectionObj.description && (
                  <span className="text-outline hidden sm:inline">• {activeCollectionObj.description}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRenameTargetId(activeCollectionObj.id);
                    setRenameTitle(activeCollectionObj.title);
                    setRenameDesc(activeCollectionObj.description || "");
                    setShowRenameModal(true);
                  }}
                  className="hover:text-primary transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">edit</span>
                  <span>Rename</span>
                </button>
                <span className="text-outline-variant">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTargetId(activeCollectionObj.id);
                    setShowDeleteModal(true);
                  }}
                  className="text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[15px]">delete</span>
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* Search, Sort & Batch Action Control Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter saved staples by name or brand..."
                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Sort & Move All CTA */}
            <div className="flex items-center justify-between sm:justify-end gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className="shrink-0 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-bold text-on-surface focus:outline-none cursor-pointer shadow-xs"
                >
                  <option value="recent">Recently Added</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="savings">Biggest Savings</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>

              {/* Move All In-Stock to Cart Button */}
              <button
                type="button"
                onClick={handleMoveAllInStockToCart}
                disabled={inStockCount === 0}
                className={`px-5 py-2.5 rounded-full font-headline-sm text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  inStockCount > 0
                    ? "bg-[#005f3f] hover:bg-[#004e33] text-white shadow-sm"
                    : "bg-surface-container text-outline cursor-not-allowed"
                }`}
                title={inStockCount > 0 ? "Move all in-stock items to cart" : "No in-stock items to add"}
              >
                <span className="material-symbols-outlined text-[17px]">shopping_cart</span>
                <span>Move All In-Stock to Cart ({inStockCount} items)</span>
              </button>
            </div>
          </div>

          {/* Live Inventory Calibration Info Banner */}
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs text-amber-900 font-medium">
              <span className="material-symbols-outlined text-amber-700 text-[18px]">info</span>
              <span>
                Prices and inventory refresh automatically in real-time. Staples remain available until completed checkout.
              </span>
            </div>
            <span className="text-[10px] font-extrabold text-amber-800 tracking-wider uppercase bg-amber-500/20 px-2.5 py-1 rounded-lg shrink-0">
              ADYAR HUB: FAST STOCK
            </span>
          </div>

          {/* Saved Items Product Grid */}
          {isLoading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xs text-on-surface-variant">Loading your saved items...</p>
            </div>
          ) : wishlistError ? (
            <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto border border-red-200 my-12 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-3xl mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">cloud_off</span>
              </div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-2">
                Unable to Load Wishlist
              </h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                {wishlistError}
              </p>
              <button
                type="button"
                onClick={() => refreshWishlist()}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Retry</span>
              </button>
            </div>
          ) : sortedItems.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-3xl p-12 text-center max-w-md mx-auto border border-outline-variant/20 shadow-sm my-12">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-3xl mx-auto mb-4">
                ❤️
              </div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-2">
                {searchQuery ? "No Matching Saved Items" : "No Saved Items in this Collection"}
              </h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                {searchQuery
                  ? "Try clearing your search query or switching collections."
                  : "Tap the heart icon on any product in our farm-fresh catalog to save items for quick 60-min reordering."}
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all"
              >
                <span className="material-symbols-outlined text-[16px]">storefront</span>
                <span>Explore Catalog</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-16">
              {sortedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative"
                >
                  <div>
                    {/* Card Top: Image + Badges + Heart Button */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container-low mb-3 flex items-center justify-center p-3.5 border border-outline-variant/10">
                      <OrderProductImage
                        item={{
                          productId: item.productId,
                          name: item.name,
                          unit: item.unit,
                          unitSize: item.unitSize,
                          price: item.price,
                          quantity: 1,
                          image: item.catalogProd?.imageUrl || item.image,
                          ...(item.catalogProd?.images ? { imageCandidates: item.catalogProd.images } : {}),
                        }}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm select-none"
                      />

                      {/* Top Left Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                        {item.discountPercent > 0 && (
                          <span className="bg-rose-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-xs">
                            {item.discountPercent}% OFF
                          </span>
                        )}
                        <span className="bg-[#005f3f] text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                          <span>⚡</span>
                          <span>60M</span>
                        </span>
                        {item.tag && item.tag !== "STAPLE" && (
                          <span className="bg-surface-container-lowest/90 text-on-surface font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-md shadow-xs tracking-wider">
                            {item.tag}
                          </span>
                        )}
                      </div>

                      {/* Top Right Heart Wishlist Button */}
                      <WishlistHeartButton
                        active
                        onToggle={() => handleRemoveItem(item.id, item.name)}
                        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-surface-container-lowest/95 text-rose-600 shadow-md hover:scale-110 transition-transform"
                        size="sm"
                      />
                    </div>

                    {/* Product Metadata */}
                    <div className="mb-2">
                      <span className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-1">
                        {item.tag}
                      </span>
                      <h4 className="whitespace-normal break-words font-headline-sm text-sm font-bold text-on-surface leading-snug mb-1">
                        {item.name}
                      </h4>
                      {(item.catalogProd?.brand || item.brandName) && (
                        <span className="text-xs text-on-surface-variant block mb-1">
                          {item.catalogProd?.brand || item.brandName}
                        </span>
                      )}
                      <span className="text-xs text-on-surface-variant block">
                        Pack: {item.unitSize} {item.unit}
                      </span>
                    </div>

                    {/* Price & Savings Display */}
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="font-headline-sm text-base font-extrabold text-primary">
                        ₹{item.price}
                      </span>
                      {item.mrp > item.price && (
                        <span className="text-xs text-outline line-through">₹{item.mrp}</span>
                      )}
                      {item.savings > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Save ₹{item.savings}
                        </span>
                      )}
                    </div>

                    {/* Stock State Badge */}
                    <div className="flex items-center gap-1.5 text-[11px] mb-3">
                      {item.inStock ? (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          <span className="text-emerald-800 font-semibold">In Stock • Rapid Dispatch</span>
                        </>
                      ) : (
                        <>
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          <span className="text-rose-600 font-semibold">Temporarily Out of Stock</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Add to Cart + Move to Collection Dropdown */}
                  <div className="space-y-2 pt-2 border-t border-outline-variant/10">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      disabled={!item.inStock}
                      className={`w-full py-2.5 rounded-xl font-headline-sm text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        item.inStock
                          ? "bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed shadow-xs"
                          : "bg-surface-container text-outline cursor-not-allowed"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {item.inStock ? "add_shopping_cart" : "block"}
                      </span>
                      <span>{item.inStock ? "+ Add to Cart" : "Out of Stock"}</span>
                    </button>

                    {/* Move to another collection shortcut */}
                    {wishlists.length > 0 && (
                      <div className="relative">
                        {movingItemId === item.id ? (
                          <div className="bg-surface-container-low rounded-xl p-2 border border-outline-variant/20 space-y-1">
                            <span className="text-[10px] font-bold text-on-surface-variant block mb-1">
                              Move to Collection:
                            </span>
                            <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                              <button
                                type="button"
                                onClick={() => handleMoveProduct(item.id, "wl_default")}
                                className="text-left text-[11px] px-2 py-1 rounded hover:bg-surface-container font-medium text-on-surface"
                              >
                                All Saved Items
                              </button>
                              {wishlists.map((wl) => (
                                <button
                                  key={wl.id}
                                  type="button"
                                  onClick={() => handleMoveProduct(item.id, wl.id)}
                                  className="text-left text-[11px] px-2 py-1 rounded hover:bg-surface-container font-medium text-on-surface truncate"
                                >
                                  {wl.title}
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => setMovingItemId(null)}
                              className="text-[10px] text-outline hover:text-on-surface block w-full text-right pt-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setMovingItemId(item.id)}
                            className="w-full text-center text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors py-1 cursor-pointer"
                          >
                            Move to Collection ▾
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Section: Recommendations Based on Your Saved Items (Matching Screenshot 2) */}
          {recommendations.length > 0 && (
            <section className="mb-14">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6">
                <div>
                  <span className="font-headline-sm text-[11px] uppercase font-extrabold text-amber-700 tracking-wider block mb-1">
                    SUGGESTED FROM YOUR HABITS
                  </span>
                  <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface">
                    Recommendations Based on Your Saved Items
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Complementary staples frequently bought together with cold-pressed oils and organic grains.
                  </p>
                </div>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-container transition-colors shrink-0"
                >
                  <span>Explore All Essentials</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>

              {/* 4 Recommendations Product Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
                {recommendations.map((prod) => {
                  const opt = prod.options[0];
                  const wish = isWishlisted(prod.id);
                  const badgeText = prod.tags?.[0] || prod.category || "FRESH HARVEST";

                  return (
                    <div
                      key={prod.id}
                      className="bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Image + Wishlist Heart Toggle */}
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-surface-container-low mb-3 flex items-center justify-center p-3.5 border border-outline-variant/10">
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300 drop-shadow-sm select-none"
                            loading="lazy"
                          />
                          <WishlistHeartButton
                            active={wish}
                            onToggle={async () => {
                              try {
                                const added = await toggleWishlist(prod, 0);
                                if (added) toast.success("Saved to your wishlist");
                                else toast.info("Removed from wishlist");
                                return added;
                              } catch (err: any) {
                                toast.error(err.message || "Could not update wishlist");
                                return false;
                              }
                            }}
                            className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-surface-container-lowest/95 shadow-md hover:scale-110 transition-transform ${wish ? "text-rose-600" : "text-on-surface-variant hover:text-rose-600"}`}
                            size="sm"
                          />
                        </div>

                        {/* Attribute Badge */}
                        <span className="text-[10px] uppercase font-extrabold text-primary tracking-wider block mb-1">
                          {badgeText}
                        </span>

                        {/* Title */}
                        <h4 className="whitespace-normal break-words font-headline-sm text-sm font-bold text-on-surface mb-1">
                          {prod.name}
                        </h4>

                        {/* Pack size */}
                        <span className="text-xs text-on-surface-variant block mb-2">
                          {opt ? `${opt.unitSize} ${opt.unit} Regular Pack` : "Standard Pack"}
                        </span>

                        {/* Price Row */}
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="font-headline-sm text-base font-extrabold text-on-surface">
                            ₹{opt?.offerPrice || opt?.mrp}
                          </span>
                          {opt && opt.mrp > (opt.offerPrice || opt.mrp) && (
                            <span className="text-xs text-outline line-through">₹{opt.mrp}</span>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(prod, 0, 1);
                          toast.success(`Added ${prod.name} to cart`);
                        }}
                        className="w-full bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-xl font-headline-sm text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Add to Cart</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Bottom Trust & Feature Highlights (Matching Screenshot 2) */}
          <div className="bg-primary/5 rounded-3xl p-6 md:p-8 border border-primary/10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Feature 1 */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">sync</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-sm font-bold text-on-surface mb-1">
                  Live Stock Calibration
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Wishlist prices reflect active morning market harvests directly from our Adyar processing facility.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">sell</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-sm font-bold text-on-surface mb-1">
                  VIP Auto-Apply
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Exclusive club savings and coin multipliers are dynamically locked in as you move items to the cart.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">local_shipping</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-sm font-bold text-on-surface mb-1">
                  Instant Adyar Dispatch
                </h4>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  60-minute doorstep fulfillment for Adyar, Besant Nagar, Thiruvanmiyur, and surrounding corridors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal: Create New Collection */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-headline-lg text-base font-bold text-on-surface">
                Create New Collection
              </h4>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleCreateCollection} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface block mb-1">Collection Title</label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Monthly Pantry Must-Haves"
                  className="w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/25 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-on-surface block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                  placeholder="Notes about these recurring items..."
                  className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/25 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold bg-[#005f3f] text-white shadow-md hover:bg-[#004e33]"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rename Collection */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-headline-lg text-base font-bold text-on-surface">
                Rename Collection
              </h4>
              <button
                type="button"
                onClick={() => setShowRenameModal(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <form onSubmit={handleRenameCollection} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface block mb-1">Collection Title</label>
                <input
                  type="text"
                  required
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  className="w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/25 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="font-bold text-on-surface block mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={renameDesc}
                  onChange={(e) => setRenameDesc(e.target.value)}
                  className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/25 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold bg-[#005f3f] text-white shadow-md hover:bg-[#004e33]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Collection Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">delete</span>
            </div>
            <h4 className="font-headline-lg text-base font-bold text-on-surface mb-2">
              Delete Collection?
            </h4>
            <p className="text-xs text-on-surface-variant mb-5 leading-relaxed">
              Items in this collection will not be lost. They will be safely preserved in your &ldquo;All Saved Staples&rdquo; list.
            </p>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCollection}
                className="flex-1 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
