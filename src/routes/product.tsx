import { useState, useEffect } from "react";
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
  const [selectedOptIndex, setSelectedOptIndex] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "reviews">("specs");
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
        setSimilarProducts(similar);
        setComplementaryProducts(complementary);
      } else {
        setSimilarProducts([]);
        setComplementaryProducts([]);
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
              <span className="text-outline-variant font-bold">/</span>
              <span className="whitespace-normal break-words text-on-surface font-headline-sm font-semibold">
                {product.name}
              </span>
            </nav>
          </div>
        </div>

        {/* Product Showcase Section */}
        <section className="max-w-[1240px] w-full mx-auto px-margin-desktop py-space-xl">

          {/* Anomaly Notice for prod-munn8cp3 */}
          {isProductionMode && product.id === "prod-munn8cp3" && (
            <div
              data-testid="production-product-anomaly-banner"
              className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-sm mb-6"
            >
              <span className="material-symbols-outlined text-amber-600 text-[22px] shrink-0 mt-0.5">
                warning
              </span>
              <div className="leading-relaxed">
                <strong className="block mb-0.5 text-sm font-bold">Diagnostic Notice: Stored Packaging Discrepancy</strong>
                The stored photograph in production Firestore (<code>products/prod-munn8cp3</code>) shows a 20g packet of <strong>Sakthi Puliyogare Rice Powder</strong> (Barcode <code>8906002081042</code>) rather than Chicken Masala. This discrepancy originates strictly within the production database document and is faithfully displayed here for audit purposes.
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start">
            {/* Gallery Column */}
            <div className="lg:col-span-6 flex flex-col gap-space-md">
              <div className="relative bg-surface-container-lowest rounded-3xl shadow-sm overflow-hidden group border border-outline-variant/20">
                <WishlistHeartButton
                  active={wishlisted}
                  onToggle={handleToggleWishlist}
                  size="md"
                  ariaLabel="Add to wishlist"
                  activeAriaLabel="Remove from wishlist"
                  className="absolute right-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-lowest/95 text-on-surface shadow-md transition-colors hover:bg-surface-container-low sm:right-4 sm:top-4"
                />
                {/* Badges */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
                  {discountPercent > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary text-on-tertiary font-label-badge text-xs tracking-wider shadow-md font-bold uppercase">
                      {discountPercent}% OFF
                    </span>
                  )}
                  {product.tags?.[0] && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary font-label-badge text-xs tracking-wider shadow-sm uppercase font-bold">
                      <span className="material-symbols-outlined text-[14px]">spa</span>
                      {product.tags[0]}
                    </span>
                  )}
                </div>

                {/* Main Large Image */}
                <div className="relative w-full aspect-square flex items-center justify-center p-6 bg-surface-container-low transition-all overflow-hidden">
                  {activeImage && !imageError ? (
                    <img
                      src={activeImage}
                      alt={product.name}
                      className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out drop-shadow-md select-none"
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

              {/* Thumbnails Row */}
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-space-sm">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setActiveImageIndex(idx);
                        setImageError(false);
                      }}
                      className={`relative aspect-square rounded-2xl bg-surface-container-lowest p-2 shadow-sm transition-all overflow-hidden flex items-center justify-center cursor-pointer ${
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
            <div className="lg:col-span-6 flex flex-col gap-space-lg">
              {/* Brand & Title */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-headline-sm text-xs font-bold uppercase tracking-wider">
                    {product.brand}
                  </span>
                  {currentOption.stock > 0 ? (
                    <span className="text-xs font-semibold text-primary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                      In Stock ({currentOption.stock} available)
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-outline flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-outline"></span>
                      Out of Stock
                    </span>
                  )}
                </div>

                <h1 className="font-headline-lg text-xl md:text-2xl text-on-surface font-extrabold tracking-tight leading-tight">
                  {t(product.name, product.tamilName)}
                </h1>
                <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
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
              <div className="bg-surface-container-lowest p-space-lg rounded-3xl shadow-sm flex flex-col gap-3 border border-outline-variant/20">
                <div className="flex flex-wrap items-baseline gap-space-sm">
                  <span className="font-price-hero text-2xl font-extrabold text-on-surface tracking-tight">
                    ₹{currentPrice}
                  </span>
                  {currentOption.mrp > currentOption.offerPrice && (
                    <span className="font-price-mrp text-sm text-outline line-through">
                      MRP ₹{currentOption.mrp}
                    </span>
                  )}
                  {discountPercent > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-badge text-xs font-bold">
                      {discountPercent}% OFF (Save ₹{currentOption.mrp - currentPrice})
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-on-surface-variant font-medium">
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
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider">
                    Select Pack Size:
                  </label>
                  <span className="text-xs text-primary font-semibold">
                    {currentOption.unitSize}
                    {currentOption.unit} Selected
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-sm">
                  {product.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedOptIndex(idx)}
                      className={`text-left p-3 rounded-2xl transition-all flex flex-col justify-between shadow-sm cursor-pointer border ${
                        selectedOptIndex === idx
                          ? "bg-primary/10 border-primary ring-2 ring-primary"
                          : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container"
                      }`}
                    >
                      <span className="font-headline-sm text-sm font-bold text-on-surface">
                        {opt.unitSize} {opt.unit}
                      </span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-extrabold text-primary">
                          ₹{opt.offerPrice}
                        </span>
                        {opt.mrp > opt.offerPrice && (
                          <span className="text-[10px] text-outline line-through">
                            ₹{opt.mrp}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery ETA Pill */}
              <div className="p-3.5 rounded-2xl bg-primary-fixed/20 flex items-center justify-between gap-2 border border-primary/10">
                <div className="flex items-center gap-2 text-on-primary-fixed">
                  <span className="material-symbols-outlined text-primary text-[22px]">
                    electric_moped
                  </span>
                  <div>
                    <span className="font-headline-sm text-xs font-bold block">
                      Express Delivery in 60 Minutes
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      Gobichettipalayam & Kasipalayam local hub
                    </span>
                  </div>
                </div>
                <span className="font-label-badge text-xs bg-primary text-on-primary px-2.5 py-1 rounded-md font-bold shrink-0">
                  FREE on ₹499+
                </span>
              </div>

              {/* Quantity Stepper & Add to Cart Buttons */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex items-center gap-space-md">
                  {/* Stepper (only when in stock) */}
                  {currentOption.stock > 0 && (
                    <div className="flex items-center bg-surface-container-lowest rounded-2xl p-1 shadow-sm border border-outline-variant/20 shrink-0">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        className="w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-extrabold text-lg flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <span className="w-12 text-center font-headline-sm text-sm font-extrabold text-on-surface">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity((q) => Math.min(currentOption.stock, q + 1))
                        }
                        className="w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-extrabold text-lg flex items-center justify-center transition-colors cursor-pointer"
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
                      className="flex-1 bg-primary hover:bg-primary-container text-on-primary py-3.5 px-6 rounded-2xl font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        shopping_bag
                      </span>
                      <span>Add to Cart • ₹{currentPrice * quantity}</span>
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex-1 bg-surface-container text-outline py-3.5 px-6 rounded-2xl font-headline-sm text-sm font-bold flex items-center justify-center gap-2 border border-outline-variant/30 cursor-not-allowed select-none"
                    >
                      <span className="material-symbols-outlined text-[20px]">block</span>
                      <span>Currently Out of Stock</span>
                    </button>
                  )}
                </div>

                {currentOption.stock > 0 && (
                  <Link
                    to="/checkout"
                    className="w-full bg-on-surface hover:bg-inverse-surface text-on-primary py-3.5 px-6 rounded-2xl font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] text-center"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {similarProducts.map((p) => (
                <ProductCard key={p.id} product={p} readOnly={false} />
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
        <section className="w-full bg-surface-container-lowest py-4 border-t border-outline-variant/15 mt-2">
          <div className="max-w-[1320px] mx-auto px-margin-desktop">
            {/* Tab Pills */}
            <div className="flex items-center space-x-2 pb-4 overflow-x-auto whitespace-nowrap scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("specs")}
                className={`px-4 py-2 rounded-full font-headline-sm text-[11px] font-bold transition-all cursor-pointer ${
                  activeTab === "specs"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"
                }`}
              >
                Product Specifications & Nutrition
              </button>
              {typeof product.reviewCount === "number" &&
                product.reviewCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("reviews")}
                    className={`px-4 py-2 rounded-full font-headline-sm text-[11px] font-bold transition-all cursor-pointer ${
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
            {activeTab === "specs" && (
              <div className="space-y-4">
                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                  <div className="space-y-2 text-[11px]">
                    {product.subCategory && (
                      <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                        <span className="text-on-surface-variant">Subcategory</span>
                        <span className="font-bold text-on-surface text-right">{product.subCategory}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Extraction / Method</span>
                      <span className="font-bold text-on-surface text-right">
                        {product.extraction || "Traditional Cold Process"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Origin Basin</span>
                      <span className="font-bold text-on-surface text-right">
                        {product.origin || "Western Tamil Nadu Delta"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Shelf Life</span>
                      <span className="font-bold text-on-surface text-right">6 Months from Press Date</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="text-on-surface-variant">FSSAI Certified</span>
                      <span className="font-bold text-primary font-mono text-right">#12421008000412</span>
                    </div>
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Energy</span>
                      <span className="font-bold text-on-surface text-right">
                        {product.nutrition?.energy || "900 kcal"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">MUFA</span>
                      <span className="font-bold text-primary text-right">
                        {product.nutrition?.mufa || "48.2 g (Heart Healthy)"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-outline-variant/15">
                      <span className="text-on-surface-variant">Trans Fats & Cholesterol</span>
                      <span className="font-bold text-primary text-right">0.00 mg (Zero)</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-1.5">
                      <span className="text-on-surface-variant">Vitamin E</span>
                      <span className="font-bold text-on-surface text-right">
                        {product.nutrition?.vitaminE || "15.7 mg"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
        </section>

      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
