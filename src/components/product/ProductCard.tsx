import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { Product } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useLanguage } from "../../context/LanguageContext";
import { buildCartKey } from "../../lib/productUtils";
import { CART_ADD_ANIMATION_EVENT, type CartAddAnimationDetail } from "../../hooks/useCartFlyAnimation";
import { WishlistHeartButton } from "./WishlistHeartButton";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  className?: string;
  readOnly?: boolean;
}

export function ProductCard({
  product,
  className = "",
  readOnly = false,
}: ProductCardProps) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { addToCart, updateQty, getItemQuantity } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { t } = useLanguage();

  const [optIndex, setOptIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const currentOption = product.options[optIndex] || product.options[0];
  if (!currentOption) return null;

  const cartKey = buildCartKey(
    product.id,
    optIndex,
    currentOption.unit,
    currentOption.unitSize
  );

  const quantity = getItemQuantity(cartKey);
  const wishlisted = isWishlisted(product.id);

  const discountPercent =
    currentOption.mrp > currentOption.offerPrice
      ? Math.round(
          ((currentOption.mrp - currentOption.offerPrice) / currentOption.mrp) * 100
        )
      : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const productImageArea = e.currentTarget
      .closest<HTMLElement>("[data-product-card-root]")
      ?.querySelector<HTMLElement>("[data-product-image-container]");
    const imageRect = productImageArea?.getBoundingClientRect();
    try {
      await addToCart(product, optIndex, 1);
      if (imageRect && product.imageUrl) {
        const detail: CartAddAnimationDetail = {
          imageUrl: product.imageUrl,
          origin: { x: imageRect.left + imageRect.width / 2, y: imageRect.top + imageRect.height / 2 },
        };
        window.dispatchEvent(new CustomEvent(CART_ADD_ANIMATION_EVENT, { detail }));
      }
      toast.success(`Added ${product.name} to cart`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add to cart");
    }
  };

  const handleIncrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await updateQty(cartKey, quantity + 1);
    } catch (err: any) {
      toast.error(err.message || "Could not update quantity");
    }
  };

  const handleDecrement = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await updateQty(cartKey, quantity - 1);
    } catch (err: any) {
      toast.error(err.message || "Could not update quantity");
    }
  };

  const handleToggleWishlist = async () => {
    if (isAuthLoading) return false;
    if (!user) {
      setShowLoginPrompt(true);
      return false;
    }
    try {
      const added = await toggleWishlist(product, optIndex);
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

  const isVipCustomer = !!user?.isVIP;
  const showVipPrice =
    currentOption.specialPrice && currentOption.specialPrice < currentOption.offerPrice;

  const hasGenuineRating =
    typeof product.rating === "number" &&
    typeof product.reviewCount === "number" &&
    product.rating > 0 &&
    product.reviewCount > 0 &&
    !Number.isNaN(product.rating) &&
    !Number.isNaN(product.reviewCount);

  return (
    <div
      data-product-card-root
      className={`bg-surface-container-lowest rounded-2xl p-space-md flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative group border border-outline-variant/15 ${className}`}
    >
      <div>
        {/* Product Image & Badges */}
        <div data-product-image-container className="relative w-full aspect-square rounded-2xl overflow-hidden bg-surface-container-low mb-space-md flex items-center justify-center p-3 border border-outline-variant/10">
          {product.imageUrl && !imageError ? (
            readOnly ? (
              <div className="flex items-center justify-center w-full h-full cursor-default">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain select-none"
                  loading="lazy"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <Link to="/product" search={{ id: product.id } as any} className="flex items-center justify-center w-full h-full">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm select-none"
                  loading="lazy"
                  onError={() => setImageError(true)}
                />
              </Link>
            )
          ) : (
            <div
              data-testid="product-image-fallback"
              className="w-full h-full flex flex-col items-center justify-center text-outline gap-1.5 p-4 bg-surface-container select-none"
            >
              <span className="material-symbols-outlined text-[32px] text-outline-variant">
                inventory_2
              </span>
              <span className="max-w-full whitespace-normal break-words text-center text-[11px] font-semibold text-on-surface-variant">
                {product.name}
              </span>
            </div>
          )}

          {/* Read-Only Preview Badge */}
          {readOnly && (
            <span className="absolute top-2 left-2 bg-amber-600 text-white font-label-badge text-label-badge px-2 py-0.5 rounded-full font-bold shadow-sm text-[10px] tracking-wide uppercase">
              Preview
            </span>
          )}

          {/* Discount Badge */}
          {discountPercent > 0 && !readOnly && (
            <span className="absolute top-2 left-2 bg-tertiary text-on-tertiary font-label-badge text-label-badge px-2 py-0.5 rounded-full font-bold shadow-sm text-xs">
              {discountPercent}% OFF
            </span>
          )}

          {/* Quick Wishlist Heart (Omitted in Read-Only Preview) */}
          {!readOnly && (
            <WishlistHeartButton
              active={wishlisted}
              onToggle={handleToggleWishlist}
              className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-surface-container-lowest/90 text-on-surface-variant shadow-sm ${wishlisted ? "text-rose-600" : "hover:text-rose-600"}`}
              size="sm"
            />
          )}
        </div>

        {/* Rating (Hidden when genuine rating data is unavailable) */}
        {hasGenuineRating && (
          <div
            data-testid="product-rating-row"
            className="flex items-center gap-1 text-secondary text-body-sm font-semibold mb-1"
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="text-xs font-bold">{product.rating}</span>
            <span className="text-on-surface-variant text-[11px]">
              ({product.reviewCount})
            </span>
          </div>
        )}

        {/* Title */}
        <Link
          to="/product"
          search={{
            id: product.id,
            ...(readOnly ? { catalogMode: "production-readonly" } : {}),
          } as any}
          className="block"
        >
          <h3 className="font-headline-sm text-label-button whitespace-normal break-words font-bold text-on-surface group-hover:text-primary transition-colors text-sm">
            {t(product.name, product.tamilName)}
          </h3>
        </Link>
        <p className="font-body-sm text-xs text-on-surface-variant mb-space-sm line-clamp-1">
          {product.brand}
        </p>

        {/* Variant / Option Selector Pills (if product has multiple options) */}
        {product.options.length > 1 && (
          <div className="flex items-center gap-1 mb-space-sm overflow-x-auto scrollbar-none pb-0.5">
            {product.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setOptIndex(idx)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                  optIndex === idx
                    ? "bg-primary text-white"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                }`}
              >
                {opt.unitSize}
                {opt.unit}
              </button>
            ))}
          </div>
        )}

        {/* VIP Price Banner */}
        {showVipPrice && (
          <div className="bg-secondary-fixed/30 rounded-lg px-space-sm py-1 flex items-center justify-between mb-space-md">
            <span className="font-label-badge text-[10px] font-bold text-on-secondary-fixed flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-secondary">
                workspace_premium
              </span>
              VIP PRICE
            </span>
            <span className="font-headline-sm text-xs font-black text-secondary">
              ₹{currentOption.specialPrice}
            </span>
          </div>
        )}

        {/* Prices & Savings */}
        <div className="flex items-baseline gap-space-xs mb-space-md">
          <span className="font-price-card text-price-card text-on-surface font-black text-base">
            ₹
            {isVipCustomer && currentOption.specialPrice
              ? currentOption.specialPrice
              : currentOption.offerPrice}
          </span>
          {currentOption.mrp > currentOption.offerPrice && (
            <span className="font-price-mrp text-xs text-outline line-through">
              ₹{currentOption.mrp}
            </span>
          )}
          {currentOption.mrp > currentOption.offerPrice && (
            <span className="font-body-sm text-[11px] text-primary font-bold ml-auto">
              Save ₹{currentOption.mrp - currentOption.offerPrice}
            </span>
          )}
        </div>
      </div>

      {/* Cart Control: Add or Stepper */}
      <div className="w-full mt-2">
        {readOnly ? (
          <div className="w-full py-2.5 px-space-md bg-surface-container-high/60 text-on-surface-variant rounded-xl font-label-button text-xs font-semibold flex items-center justify-center gap-1.5 border border-outline-variant/30 select-none">
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>Read-Only Preview</span>
          </div>
        ) : currentOption.stock <= 0 ? (
          <button
            disabled
            className="w-full py-2 px-space-md bg-surface-container text-outline rounded-xl font-label-button text-xs font-bold flex items-center justify-center gap-1 cursor-not-allowed"
          >
            Out of Stock
          </button>
        ) : quantity === 0 ? (
          <button
            onClick={handleAddToCart}
            className="w-full py-2.5 px-space-md bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed rounded-xl font-label-button text-xs font-bold flex items-center justify-center gap-space-xs transition-colors shadow-sm cursor-pointer active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
            <span>Add to Cart</span>
          </button>
        ) : (
          <div className="w-full flex items-center justify-between bg-primary text-on-primary rounded-xl p-1 shadow-sm">
            <button
              onClick={handleDecrement}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              title="Decrease quantity"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <span className="font-headline-sm text-sm font-black text-white px-space-sm">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
              title="Increase quantity"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
            </button>
          </div>
        )}
      </div>

      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 px-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowLoginPrompt(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setShowLoginPrompt(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="wishlist-login-title"
            className="w-full max-w-sm rounded-2xl bg-surface-container-lowest p-6 text-center text-on-surface shadow-2xl"
          >
            <span className="material-symbols-outlined text-4xl text-primary">favorite</span>
            <h2 id="wishlist-login-title" className="mt-3 text-lg font-bold">
              Login to add your favourite products
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Sign in to save products to your wishlist.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowLoginPrompt(false)}
                className="rounded-xl border border-outline-variant/40 px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container-low"
              >
                Cancel
              </button>
              <Link
                to="/login"
                onClick={() => setShowLoginPrompt(false)}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:bg-primary/90"
              >
                Go to Login
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

