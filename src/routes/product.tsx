import { useState, useEffect, useRef } from "react";
import { createFileRoute, useSearch, Link } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { WishlistHeartButton } from "../components/product/WishlistHeartButton";
import { StoreFooter } from "../components/layout/StoreFooter";
import { productService } from "../services/productService";
import type { Product } from "../types";
import { ProductCard } from "../components/product/ProductCard";
import { getSimilarProducts, getComplementaryProducts } from "../lib/recommendationUtils";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import { toast } from "sonner";

export const Route = createFileRoute("/product")({
  validateSearch: (
    search: Record<string, unknown>
  ): {
    id?: string | undefined;
  } => ({
    id: (search["id"] as string) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Product Details — Sri Amman Smart Store" },
      { name: "description", content: "Farm-fresh groceries and wood-pressed oils." },
    ],
  }),
  component: ProductDetailsPage,
});

function ProductDetailsPage() {
  const searchParams = useSearch({ from: "/product" });
  const productId = searchParams.id || "prod_groundnut_oil";

  const { user } = useAuth();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { t } = useLanguage();

  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [complementaryProducts, setComplementaryProducts] = useState<Product[]>([]);
  const [otherProducts, setOtherProducts] = useState<Product[]>([]);
  const [selectedOptIndex, setSelectedOptIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const pinchDistanceRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const imageSwipeRef = useRef(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "reviews">("specs");
  const [isSpecsOpen, setIsSpecsOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync catalog mode
  const isProductionMode = productService.getCatalogMode() === "production-readonly";

  const loadProduct = async () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setLoading(true);
    setError(null);
    setImageError(false);
    try {
      const item = await productService.getProductById(productId);
      setProduct(item);
      setSelectedOptIndex(0);
      setActiveImageIndex(0);
      setQuantity(1);

      if (item) {
        const all = await productService.getProducts();
        const similar = getSimilarProducts(item, all, { limit: 6 });
        const similarIds = similar.map((p) => p.id);
        const complementary = getComplementaryProducts(item, all, {
          limit: 4,
          excludeIds: similarIds,
        });
        const excludedIds = new Set([item.id, ...similarIds, ...complementary.map((p) => p.id)]);
        setSimilarProducts(similar);
        setComplementaryProducts(complementary);
        setOtherProducts(all.filter((candidate) => !excludedIds.has(candidate.id)).slice(0, 12));
      } else {
        setSimilarProducts([]);
        setComplementaryProducts([]);
        setOtherProducts([]);
      }
    } catch (err: any) {
      console.error("Failed to load product details:", err);
      setError(err?.message || "Failed to load product details. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  useEffect(() => {
    if (!isImageZoomOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsImageZoomOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isImageZoomOpen]);

  if (loading) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1320px] mx-auto px-margin-desktop py-12">
          <div className="animate-pulse flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2 aspect-square bg-surface-container-low rounded-3xl"></div>
            <div className="md:w-1/2 space-y-4">
              <div className="h-8 bg-surface-container-low rounded w-3/4"></div>
              <div className="h-4 bg-surface-container-low rounded w-1/2"></div>
              <div className="h-12 bg-surface-container-low rounded w-1/3"></div>
            </div>
          </div>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1320px] mx-auto px-margin-desktop py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center text-3xl mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px]">error</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Error Loading Product</h2>
          <p className="text-on-surface-variant mb-6 text-sm">{error}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={loadProduct}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-sm font-bold shadow-md cursor-pointer"
            >
              Retry
            </button>
            <Link
              to="/shop"
              className="bg-surface-container text-on-surface px-6 py-2.5 rounded-xl font-headline-sm text-sm font-bold shadow-sm"
            >
              Back to Catalog
            </Link>
          </div>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1320px] mx-auto px-margin-desktop py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <p className="text-on-surface-variant mb-6 text-sm">
            We couldn't locate the requested product in our harvest database.
          </p>
          <Link
            to="/shop"
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-sm font-bold shadow-md"
          >
            Back to Catalog
          </Link>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  const currentOption = product.options[selectedOptIndex] || product.options[0];
  if (!currentOption) return null;
  const images = product.images?.length > 0 ? product.images : [product.imageUrl];
  const activeImage = images[activeImageIndex] || product.imageUrl;
  const wishlisted = isWishlisted(product.id);
  const isVip = !!user?.isVIP;

  const currentPrice =
    isVip && currentOption.specialPrice ? currentOption.specialPrice : currentOption.offerPrice;

  const discountPercent =
    currentOption.mrp > currentOption.offerPrice
      ? Math.round(
          ((currentOption.mrp - currentOption.offerPrice) / currentOption.mrp) * 100
        )
      : 0;

  const handleAddToCart = async () => {
    try {
      await addToCart(product, selectedOptIndex, quantity);
      toast.success(
        `Added ${quantity}x ${product.name} (${currentOption.unitSize}${currentOption.unit}) to cart`
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to add to cart");
    }
  };

  const handleToggleWishlist = async () => {
    try {
      const added = await toggleWishlist(product, selectedOptIndex);
      if (added) {
        toast.success("Saved to your wishlist");
      } else {
        toast.info("Removed from wishlist");
      }
      return added;
    } catch (err: any) {
      toast.error(err.message || "Could not update wishlist");
      return false;
    }
  };

  const openImageZoom = () => {
    setImageZoom(1);
    setIsImageZoomOpen(true);
  };

  const adjustImageZoom = (amount: number) => {
    setImageZoom((current) => Math.min(4, Math.max(1, current + amount)));
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]">
        {/* Breadcrumb Bar */}
        <div className="w-full bg-surface-container-low border-b border-outline-variant/15">
          <div className="max-w-[1320px] mx-auto px-margin-desktop py-space-sm flex flex-wrap items-center justify-between gap-space-sm text-xs">
            <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-on-surface-variant">
              <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">home</span>
                <span>Home</span>
              </Link>
              <span className="text-outline-variant font-bold">/</span>
              <Link
                to="/shop"
                search={{
                  category: product.categorySlug,
                } as any}
                className="hover:text-primary transition-colors"
              >
                {product.category}
              </Link>
              {product.subCategory && product.subCategory !== product.category && (
                <>
                  <span className="text-outline-variant font-bold">/</span>
                  <span className="text-on-surface-variant font-medium">
                    {product.subCategory}
                  </span>
                </>
              )}
            </nav>
          </div>
        </div>

        {/* Product Showcase Section */}
        <section className="max-w-[1240px] w-full mx-auto px-margin-desktop py-4 sm:py-6">
          <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-5 items-start">
            {/* Gallery Column */}
            <div className="lg:col-span-6 flex flex-col lg:flex-row items-stretch lg:items-start gap-2 sm:gap-3">
              <div className="order-1 lg:order-2 relative min-w-0 w-full lg:flex-1 bg-surface-container-lowest rounded-3xl shadow-sm overflow-hidden group border border-outline-variant/20">
                <WishlistHeartButton
                  active={wishlisted}
                  onToggle={handleToggleWishlist}
                  size="md"
                  ariaLabel="Add to wishlist"
                  activeAriaLabel="Remove from wishlist"
                  className="absolute right-2 top-2 z-20 flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest/95 text-on-surface shadow-md transition-colors hover:bg-surface-container-low sm:right-4 sm:top-4"
                />

                {/* Main Large Image */}
                <div
                  className="relative w-full aspect-square flex items-center justify-center p-1.5 sm:p-6 bg-surface-container-low transition-all overflow-hidden cursor-zoom-in [touch-action:pan-y]"
                  role="button"
                  tabIndex={0}
                  aria-label={`Open ${product.name} image zoom`}
                  onClick={() => {
                    if (imageSwipeRef.current) {
                      imageSwipeRef.current = false;
                      return;
                    }
                    openImageZoom();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openImageZoom();
                    }
                  }}
                  onTouchStart={(event) => {
                    imageSwipeRef.current = false;
                    const touch = event.changedTouches[0];
                    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
                  }}
                  onTouchEnd={(event) => {
                    const start = touchStartRef.current;
                    const touch = event.changedTouches[0];
                    touchStartRef.current = null;
                    if (!start || images.length < 2) return;

                    const deltaX = touch.clientX - start.x;
                    const deltaY = touch.clientY - start.y;
                    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

                    imageSwipeRef.current = true;
                    setActiveImageIndex((currentIndex) =>
                      (currentIndex + (deltaX < 0 ? 1 : -1) + images.length) % images.length
                    );
                    setImageError(false);
                  }}
                >
                  {activeImage && !imageError ? (
                    <img
                      src={activeImage}
                      alt={product.name}
                      className="w-[96%] h-[96%] object-contain transition-transform duration-300 ease-out drop-shadow-md select-none pointer-events-none"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-outline gap-2 p-6 select-none">
                      <span className="material-symbols-outlined text-[64px] text-outline-variant">
                        inventory_2
                      </span>
                      <span className="text-xs font-semibold text-on-surface-variant font-mono">
                        {product.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Front/back and alternate image switcher */}
              {images.length > 1 && (
                <div className="order-2 lg:order-1 w-full lg:w-16 shrink-0 flex flex-row lg:flex-col gap-2 sm:gap-3 overflow-x-auto lg:overflow-visible scrollbar-none">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveImageIndex(idx);
                        setImageError(false);
                      }}
                      aria-label={`Show product image ${idx + 1}${idx === 0 ? " (front)" : idx === 1 ? " (back)" : ""}`}
                      aria-pressed={activeImageIndex === idx}
                      className={`relative aspect-square w-12 sm:w-14 lg:w-full shrink-0 rounded-xl sm:rounded-2xl bg-surface-container-lowest p-1 sm:p-2 shadow-sm transition-all overflow-hidden flex items-center justify-center cursor-pointer border border-outline-variant/20 ${
                        activeImageIndex === idx
                          ? "ring-2 ring-primary bg-primary/5"
                          : "hover:bg-surface-container opacity-70"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`View ${idx + 1}`}
                        className="max-w-full max-h-full object-contain select-none"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Meta Column */}
            <div className="contents sm:flex sm:flex-col sm:gap-3 min-w-0 lg:col-span-6">
              {/* Brand & Title */}
              <div className="col-start-2 row-start-1 flex flex-col gap-1.5 sm:col-auto sm:row-auto">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 rounded-full bg-primary/10 text-primary font-headline-sm text-[9px] sm:text-xs font-bold uppercase tracking-wider">
                    {product.brand}
                  </span>
                  {currentOption.stock > 0 ? (
                    <span className="text-[9px] sm:text-xs font-semibold text-primary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      In Stock ({currentOption.stock} available)
                    </span>
                  ) : (
                    <span className="text-[9px] sm:text-xs font-semibold text-outline flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-outline"></span>
                      Out of Stock
                    </span>
                  )}
                </div>

                <h1 className="font-headline-lg text-sm sm:text-xl md:text-2xl text-on-surface font-extrabold tracking-tight leading-tight">
                  {t(product.name, product.tamilName)}
                </h1>
                <p className="font-body-md text-[10px] sm:text-sm text-on-surface-variant leading-relaxed">
                  {product.description}
                </p>

                {/* Rating Badge (Hidden when unverified) */}
                {typeof product.rating === "number" &&
                  typeof product.reviewCount === "number" &&
                  product.rating > 0 &&
                  product.reviewCount > 0 &&
                  !Number.isNaN(product.rating) &&
                  !Number.isNaN(product.reviewCount) && (
                  <div data-testid="product-details-rating" className="flex items-center gap-3 pt-1">
                    <div className="inline-flex items-center gap-1 bg-primary text-on-primary px-2.5 py-1 rounded-lg font-headline-sm text-xs font-bold shadow-sm">
                      <span>{product.rating}</span>
                      <span
                        className="material-symbols-outlined text-[14px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant font-medium">
                      <strong className="text-on-surface font-semibold">
                        {product.reviewCount}
                      </strong>{" "}
                      Verified Ratings
                    </span>
                  </div>
                )}
              </div>

              {/* Price Card */}
              <div className="col-span-2 row-start-2 bg-surface-container-lowest p-3 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm flex flex-col gap-1.5 border border-outline-variant/20 sm:col-auto sm:row-auto">
                <div className="flex flex-wrap items-baseline gap-space-sm">
                  {currentOption.mrp > currentOption.offerPrice && (
                    <span className="font-price-mrp text-[16px] sm:text-sm text-outline line-through">
                      MRP ₹{currentOption.mrp}
                    </span>
                  )}
                  <span className="font-price-hero text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                    ₹{currentPrice}
                  </span>
                  {discountPercent > 0 && (
                    <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-badge text-[10px] sm:text-xs font-bold">
                      {discountPercent}% OFF (Save ₹{currentOption.mrp - currentPrice})
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] text-on-surface-variant font-medium">
                  Inclusive of all taxes
                </p>

                {/* VIP Price Highlight Box */}
                {currentOption.specialPrice && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary-fixed/30 text-on-secondary-fixed border border-secondary-fixed/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[18px]">
                          workspace_premium
                        </span>
                      </div>
                      <div>
                        <div className="font-headline-sm text-xs font-bold leading-tight">
                          Sri Amman VIP Price: ₹{currentOption.specialPrice}
                        </div>
                        <div className="text-[11px] text-on-secondary-fixed-variant">
                          {isVip
                            ? "Active VIP discount applied to your account"
                            : "Unlock extra savings + 2X Smart Coins"}
                        </div>
                      </div>
                    </div>
                    {!isVip && (
                      <Link
                        to="/rewards"
                        className="px-3 py-1 bg-secondary text-on-secondary rounded-lg font-headline-sm text-[11px] font-bold"
                      >
                        Join VIP
                      </Link>
                    )}
                  </div>
                )}
              </div>

              {/* Pack Size / Variant Selector */}
              <div className="col-span-2 row-start-3 flex flex-col gap-2 sm:col-auto sm:row-auto">
                <div className="flex items-center justify-between">
                  <label className="font-headline-sm text-[10px] sm:text-xs font-bold text-on-surface uppercase tracking-wider">
                    Select Pack Size:
                  </label>
                  <span className="text-[10px] sm:text-xs text-primary font-semibold text-right">
                    {currentOption.unitSize}
                    {currentOption.unit} Selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedOptIndex(idx)}
                      className={`w-[58px] sm:w-[124px] min-h-[42px] sm:min-h-[58px] text-center p-2 sm:p-2.5 rounded-xl transition-all flex flex-col justify-center shadow-sm cursor-pointer border ${
                        selectedOptIndex === idx
                          ? "bg-primary/10 border-primary ring-2 ring-primary"
                          : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container"
                      }`}
                    >
                      <span className="font-headline-sm text-xs sm:text-sm font-bold text-on-surface">
                        {opt.unitSize} {opt.unit}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery ETA Pill */}
              <div className="hidden sm:flex col-span-2 row-start-4 p-2.5 sm:p-3 rounded-2xl bg-primary-fixed/20 items-center justify-between gap-2 border border-primary/10 sm:col-auto sm:row-auto">
                <div className="flex items-center gap-2 text-on-primary-fixed">
                  <span className="material-symbols-outlined text-primary text-[20px] sm:text-[22px]">
                    electric_moped
                  </span>
                  <div>
                    <span className="font-headline-sm text-[10px] sm:text-xs font-bold block">
                      Express Delivery in 60 Minutes
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-on-surface-variant">
                      Gobichettipalayam & Kasipalayam local hub
                    </span>
                  </div>
                </div>
                <span className="font-label-badge text-[10px] sm:text-xs bg-primary text-on-primary px-2 sm:px-2.5 py-1 rounded-md font-bold shrink-0">
                  FREE on ₹499+
                </span>
              </div>

              {/* Quantity Stepper & Add to Cart Buttons */}
              <div className="col-span-2 row-start-4 flex flex-col gap-2 pt-0.5 sm:col-auto sm:row-auto">
                <div className="flex items-center gap-2">
                  {/* Stepper (only when in stock) */}
                  {currentOption.stock > 0 && (
                    <div className="flex items-center bg-surface-container-lowest rounded-2xl p-1 shadow-sm border border-outline-variant/20 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-extrabold text-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <span className="w-9 text-center font-headline-sm text-sm font-extrabold text-on-surface">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) => Math.min(currentOption.stock, q + 1))
                        }
                        className="w-9 h-9 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-extrabold text-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                  )}

                  {/* Primary Add to Cart Button */}
                  {currentOption.stock > 0 ? (
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-2.5 px-2 sm:px-4 rounded-xl sm:rounded-2xl font-headline-sm text-[10px] sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[18px] sm:text-[20px]">
                        shopping_bag
                      </span>
                      <span>Add to Cart • ₹{currentPrice * quantity}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 bg-surface-container text-outline py-2.5 px-2 sm:px-4 rounded-xl sm:rounded-2xl font-headline-sm text-[10px] sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 border border-outline-variant/30 cursor-not-allowed select-none whitespace-nowrap"
                    >
                      <span className="material-symbols-outlined text-[20px]">block</span>
                      <span>Currently Out of Stock</span>
                    </button>
                  )}
                </div>

                {currentOption.stock > 0 && (
                  <Link
                    to="/checkout"
                    className="w-full bg-on-surface hover:bg-inverse-surface text-on-primary py-2.5 px-4 rounded-xl sm:rounded-2xl font-headline-sm text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] text-center"
                  >
                    <span className="material-symbols-outlined text-[20px]">bolt</span>
                    <span>Instant Express Checkout</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 1: Similar Products (Traditional Alternatives) */}
        {similarProducts.length > 0 && (
          <section className="max-w-[1320px] w-full mx-auto px-margin-desktop py-4 mt-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm mb-4">
              <div className="flex flex-col">
                <h3 className="font-headline-lg text-2xl font-extrabold text-on-surface tracking-tight">
                  Similar Products
                </h3>
              </div>
              <Link
                to="/shop"
                search={{ category: product.categorySlug } as any}
                className="font-label-button text-primary hover:underline font-bold flex items-center gap-1 text-sm"
              >
                <span>View all {product.category}</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
            <div
              className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 scrollbar-none"
              style={{ overscrollBehaviorX: "contain" }}
            >
              {similarProducts.map((p) => (
                <div
                  key={p.id}
                  data-product-card
                  className="w-[min(44vw,190px)] shrink-0 snap-start sm:w-[190px] lg:w-[204px]"
                >
                  <ProductCard product={p} className="h-full" readOnly={false} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Frequently Bundled / Complete Your Traditional Kitchen Basket */}
        {complementaryProducts.length > 0 && (
          <section className="max-w-[1320px] w-full mx-auto px-margin-desktop py-space-2xl border-t border-outline-variant/15">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm mb-space-lg">
              <div className="flex flex-col">
                <span className="font-label-badge uppercase tracking-wider text-secondary font-bold text-xs">
                  Frequently Bundled
                </span>
                <h3 className="font-headline-lg text-2xl font-extrabold text-on-surface tracking-tight">
                  Complete Your Kitchen Basket
                </h3>
              </div>
              <Link
                to="/shop"
                className="font-label-button text-primary hover:underline font-bold flex items-center gap-1 text-sm"
              >
                <span>View all Staples</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {complementaryProducts.map((p) => (
                <ProductCard key={p.id} product={p} readOnly={false} />
              ))}
            </div>
          </section>
        )}

        {/* Deep Details Tabs (Specs, Reviews) */}
        <section className="w-full py-8 sm:py-10 border-t border-outline-variant/15 mt-2">
          <div className="max-w-[1320px] mx-auto px-margin-desktop">
            <div className="rounded-3xl bg-primary-fixed/20 border border-primary/15 p-4 sm:p-6 lg:p-8 shadow-sm">
            {/* Specifications dropdown and reviews tab */}
            <div className="flex flex-col items-stretch gap-2 pb-5">
              <button
                type="button"
                aria-expanded={activeTab === "specs" && isSpecsOpen}
                aria-controls="product-specifications-panel"
                onClick={() => {
                  if (activeTab !== "specs") {
                    setActiveTab("specs");
                    setIsSpecsOpen(true);
                  } else {
                    setIsSpecsOpen((open) => !open);
                  }
                }}
                className="w-full flex items-center justify-between gap-3 rounded-2xl bg-surface-container-lowest px-4 py-3 text-left font-headline-sm text-sm sm:text-base font-bold text-on-surface shadow-sm border border-primary/20 transition-colors hover:bg-surface-container-low cursor-pointer"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="material-symbols-outlined shrink-0 text-primary text-[20px]">inventory_2</span>
                  <span>Product Specifications & Nutrition</span>
                </span>
                <span className="material-symbols-outlined shrink-0 text-primary transition-transform duration-200">
                  {activeTab === "specs" && isSpecsOpen ? "expand_less" : "expand_more"}
                </span>
              </button>
              {typeof product.reviewCount === "number" &&
                product.reviewCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("reviews")}
                    className={`self-start max-w-full px-4 py-2 rounded-full font-headline-sm text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      activeTab === "reviews"
                        ? "bg-primary text-white shadow-sm"
                        : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    Verified Customer Reviews ({product.reviewCount})
                  </button>
                )}
            </div>

            {/* Specifications & Nutrition Content */}
            <div
              id="product-specifications-panel"
              aria-hidden={activeTab !== "specs" || !isSpecsOpen}
              className={
                activeTab === "specs" && isSpecsOpen
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "hidden"
              }
            >
                <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-primary/15 shadow-sm">
                  <h3 className="flex items-center gap-2 mb-3 font-headline-sm text-sm sm:text-base font-bold text-on-surface">
                    <span className="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
                    Product Details
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    {product.subCategory && (
                      <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                        <span className="text-on-surface-variant">Subcategory</span>
                      <span className="max-w-[60%] break-words font-bold text-on-surface text-right">{product.subCategory}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Extraction / Method</span>
                      <span className="max-w-[60%] break-words font-bold text-on-surface text-right">
                        {product.extraction || "Traditional Cold Process"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Origin Basin</span>
                      <span className="max-w-[60%] break-words font-bold text-on-surface text-right">
                        {product.origin || "Western Tamil Nadu Delta"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Shelf Life</span>
                      <span className="max-w-[60%] break-words font-bold text-on-surface text-right">6 Months from Press Date</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="text-on-surface-variant">FSSAI Certified</span>
                      <span className="max-w-[60%] break-words font-bold text-primary font-mono text-right">#12421008000412</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-lowest p-4 sm:p-5 rounded-2xl border border-primary/15 shadow-sm">
                  <h3 className="flex items-center gap-2 mb-3 font-headline-sm text-sm sm:text-base font-bold text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[20px]">nutrition</span>
                    Nutrition Facts
                  </h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Energy</span>
                      <span className="max-w-[60%] break-words font-bold text-on-surface text-right">
                        {product.nutrition?.energy || "900 kcal"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">MUFA</span>
                      <span className="max-w-[60%] break-words font-bold text-primary text-right">
                        {product.nutrition?.mufa || "48.2 g (Heart Healthy)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Trans Fats & Cholesterol</span>
                      <span className="max-w-[60%] break-words font-bold text-primary text-right">0.00 mg (Zero)</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="text-on-surface-variant">Vitamin E</span>
                      <span className="max-w-[60%] break-words font-bold text-on-surface text-right">
                        {product.nutrition?.vitaminE || "15.7 mg"}
                      </span>
                    </div>
                  </div>
                </div>
            </div>

            {/* Tab 3: Reviews */}
            {activeTab === "reviews" &&
              typeof product.reviewCount === "number" &&
              product.reviewCount > 0 && (
                <div className="space-y-4 max-w-3xl">
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs">
                          SK
                        </div>
                        <div>
                          <span className="font-headline-sm text-xs font-bold block">
                            S. Kalyanasundaram
                          </span>
                          <span className="text-[11px] text-primary flex items-center gap-1 font-semibold">
                            <span className="material-symbols-outlined text-[13px]">verified</span>
                            Verified Buyer • Gobichettipalayam
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] text-on-surface-variant">2 days ago</span>
                    </div>
                    <div className="flex text-[#fea619] mb-2">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className="material-symbols-outlined text-[16px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          star
                        </span>
                      ))}
                    </div>
                    <h5 className="font-headline-sm text-sm font-bold text-on-surface mb-1">
                      Unbeatable natural aroma for dosas & sambar!
                    </h5>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Been ordering regularly from Sri Amman Smart Store. When you temper mustard seeds, the entire kitchen fills with the nostalgic aroma of old village cooking. Authentic unrefined taste with pure sedimentation at the bottom.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {otherProducts.length > 0 && (
          <section className="max-w-[1320px] w-full mx-auto px-margin-desktop py-6 sm:py-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="min-w-0 text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                Other Products
              </h2>
              <Link
                to="/shop"
                className="shrink-0 text-xs sm:text-sm font-bold text-primary hover:underline"
              >
                Browse all
              </Link>
            </div>
            <div
              className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 scrollbar-none"
              style={{ overscrollBehaviorX: "contain" }}
            >
              {otherProducts.map((otherProduct) => (
                <div
                  key={otherProduct.id}
                  className="w-[min(44vw,190px)] shrink-0 snap-start sm:w-[190px] lg:w-[204px]"
                >
                  <ProductCard
                    product={otherProduct}
                    className="h-full"
                    readOnly={false}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {isImageZoomOpen && activeImage && !imageError && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} image viewer`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsImageZoomOpen(false);
          }}
          onWheel={(event) => {
            event.preventDefault();
            adjustImageZoom(event.deltaY < 0 ? 0.2 : -0.2);
          }}
          onTouchStart={(event) => {
            if (event.touches.length === 2) {
              const [first, second] = Array.from(event.touches);
              pinchDistanceRef.current = Math.hypot(
                second.clientX - first.clientX,
                second.clientY - first.clientY
              );
            }
          }}
          onTouchMove={(event) => {
            if (event.touches.length !== 2 || pinchDistanceRef.current === null) return;
            event.preventDefault();
            const [first, second] = Array.from(event.touches);
            const distance = Math.hypot(
              second.clientX - first.clientX,
              second.clientY - first.clientY
            );
            const change = distance - pinchDistanceRef.current;
            if (Math.abs(change) > 8) {
              adjustImageZoom(change > 0 ? 0.1 : -0.1);
              pinchDistanceRef.current = distance;
            }
          }}
          onTouchEnd={() => {
            pinchDistanceRef.current = null;
          }}
          style={{ touchAction: "none" }}
        >
          <button
            type="button"
            onClick={() => setIsImageZoomOpen(false)}
            aria-label="Close image viewer"
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/15 p-2 text-white backdrop-blur-sm">
            <button
              type="button"
              onClick={() => adjustImageZoom(-0.25)}
              disabled={imageZoom <= 1}
              aria-label="Zoom out"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-40"
            >
              <span className="material-symbols-outlined">remove</span>
            </button>
            <span className="min-w-12 text-center text-sm font-semibold">{Math.round(imageZoom * 100)}%</span>
            <button
              type="button"
              onClick={() => adjustImageZoom(0.25)}
              disabled={imageZoom >= 4}
              aria-label="Zoom in"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15 disabled:opacity-40"
            >
              <span className="material-symbols-outlined">add</span>
            </button>
            <button
              type="button"
              onClick={() => setImageZoom(1)}
              className="rounded-full px-3 py-2 text-xs font-semibold hover:bg-white/15"
            >
              Reset
            </button>
          </div>
          <img
            src={activeImage}
            alt={product.name}
            draggable={false}
            className="max-h-full max-w-full select-none object-contain transition-transform duration-100"
            style={{ transform: `scale(${imageZoom})` }}
          />
        </div>
      )}

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
