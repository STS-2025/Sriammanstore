import { useId, useState } from "react";
import { Mail, MessageCircle } from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Product } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useLanguage } from "../../context/LanguageContext";
import { buildCartKey } from "../../lib/productUtils";
import { CART_ADD_ANIMATION_EVENT, type CartAddAnimationDetail } from "../../hooks/useCartFlyAnimation";
import { WishlistHeartButton } from "./WishlistHeartButton";
import { ProductNameSlider } from "./ProductNameSlider";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
  className?: string;
  readOnly?: boolean;
  compact?: boolean;
  compactAddToCart?: boolean;
}

function ShareOptionIcon({ name }: { name: string }) {
  if (name === "WhatsApp") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2a9.94 9.94 0 0 0-8.52 15.06L2.2 22l5.08-1.29A10 10 0 1 0 12.04 2Zm0 18.18a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.02.77.8-2.94-.2-.31a8.17 8.17 0 1 1 6.85 3.79Zm4.48-6.12c-.25-.12-1.48-.73-1.71-.81-.23-.08-.4-.12-.57.12-.17.25-.65.81-.8.98-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.48-1.38-1.73-.15-.25-.02-.39.1-.51.1-.1.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.57-1.37-.78-1.88-.2-.49-.41-.42-.57-.43h-.49c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.08s.89 2.41 1.01 2.58c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.12.16 1.55.1.47-.07 1.48-.61 1.69-1.2.21-.59.21-1.1.15-1.2-.06-.1-.23-.16-.48-.29Z" />
        </svg>
      </span>
    );
  }

  if (name === "Telegram") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#229ED9] text-white">
        <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="currentColor" aria-hidden="true">
          <path d="m21.7 4.35-3.27 15.42c-.25 1.09-.89 1.36-1.81.85l-5-3.69-2.41 2.32c-.27.27-.5.5-1.02.5l.36-5.09 9.26-8.37c.4-.36-.09-.56-.62-.2L5.74 13.31.8 11.77c-1.07-.34-1.09-1.07.22-1.59L20.34 2.8c.9-.33 1.68.21 1.36 1.55Z" />
        </svg>
      </span>
    );
  }

  if (name === "Facebook") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-end justify-center overflow-hidden rounded-full bg-[#0866FF] text-white">
        <span className="translate-y-0.5 text-[25px] font-black leading-none" aria-hidden="true">f</span>
      </span>
    );
  }

  if (name === "X") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
          <path d="M18.9 2H22l-6.78 7.75L23.2 22h-6.25l-4.9-7.56L5.44 22H2.3l7.25-8.28L1.8 2h6.4l4.43 6.96L18.9 2Zm-1.1 18h1.73L7.26 3.89H5.4L17.8 20Z" />
        </svg>
      </span>
    );
  }

  const Icon = name === "Email" ? Mail : MessageCircle;
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
      <Icon size={17} strokeWidth={2} aria-hidden="true" />
    </span>
  );
}

export function ProductCard({
  product,
  className = "",
  readOnly = false,
  compact = false,
  compactAddToCart = false,
}: ProductCardProps) {
  const shareDialogTitleId = useId();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { addToCart, updateQty, getItemQuantity } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { t } = useLanguage();

  const [optIndex, setOptIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
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
      if (added === undefined) return false;
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

  const handleShare = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const url = new URL("/product", window.location.origin);
    url.searchParams.set("id", product.id);
    setShareUrl(url.toString());
    setShowShareDialog(true);
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Product link copied");
      setShowShareDialog(false);
    } catch (err: any) {
      toast.error(err?.message || "Could not copy the product link");
    }
  };

  const shareMessage = `Check out ${product.name}: ${shareUrl}`;
  const shareOptions = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(shareMessage)}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${product.name}`)}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}` },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${product.name}`)}&url=${encodeURIComponent(shareUrl)}` },
    { name: "Email", href: `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(shareMessage)}` },
    { name: "SMS", href: `sms:?body=${encodeURIComponent(shareMessage)}` },
  ];

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
      className={`rounded-2xl ${compact ? "p-1.5 sm:p-space-md" : "p-2 sm:p-space-md"} flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative group border border-outline-variant/15 ${className}`}
    >
      {!readOnly && (
        <div className="pointer-events-none absolute inset-x-1 top-1 z-20 flex items-center justify-between">
          <WishlistHeartButton
            active={wishlisted}
            onToggle={handleToggleWishlist}
            className={`pointer-events-auto h-8 w-8 rounded-full bg-surface-container-lowest/90 text-on-surface-variant shadow-sm ${wishlisted ? "text-rose-600" : "hover:text-rose-600"}`}
            size="sm"
          />
          <button
            type="button"
            onClick={handleShare}
            aria-label={`Share ${product.name}`}
            title="Share product"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-lowest/90 text-on-surface-variant shadow-sm transition-colors hover:text-primary"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              share
            </span>
          </button>
        </div>
      )}
      <div>
        {/* Product Image & Badges */}
        <div data-product-image-container className={`relative ${compact ? "mx-auto w-[88%] sm:mx-0 sm:w-full" : "w-full"} aspect-square rounded-2xl overflow-hidden mb-2 sm:mb-space-md flex items-center justify-center border border-outline-variant/10`}>
          {product.imageUrl && !imageError ? (
            readOnly ? (
              <div className="absolute inset-0 flex items-center justify-center cursor-default sm:inset-3">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain object-center select-none"
                  loading="lazy"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <Link to="/product" search={{ id: product.id } as any} className="absolute inset-0 flex items-center justify-center sm:inset-3">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-full w-full object-contain object-center transition-transform duration-300 drop-shadow-sm select-none sm:group-hover:scale-[1.02]"
                  loading="lazy"
                  onError={() => setImageError(true)}
                />
              </Link>
            )
          ) : (
            <div
              data-testid="product-image-fallback"
              className="w-full h-full flex flex-col items-center justify-center text-outline gap-1.5 p-4 select-none"
            >
              <span className="material-symbols-outlined text-[32px] text-outline-variant">
                inventory_2
              </span>
              <span className="max-w-full whitespace-normal break-words text-center text-[11px] font-semibold text-on-surface-variant">
                {product.name}
              </span>
            </div>
          )}

          {product.isOffer === true && (
            <span
              aria-label="Offer"
              className="absolute -left-5 top-2 z-10 w-20 -rotate-45 bg-emerald-700 py-0.5 text-center text-[8px] font-black uppercase tracking-wide text-white shadow-md sm:-left-7 sm:top-3 sm:w-28 sm:py-1 sm:text-[10px]"
            >
              Offer
            </span>
          )}

        </div>

        {(readOnly || product.isNew === true || product.isBestSeller === true || product.isFeatured === true) && (
          <div className="mb-2 flex flex-wrap gap-1">
            {readOnly && (
              <span className="whitespace-nowrap rounded-full bg-amber-600 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white shadow-sm sm:px-2 sm:text-[10px]">
                Preview
              </span>
            )}
            {product.isNew === true && (
              <span className="whitespace-nowrap rounded-full bg-sky-600 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white shadow-sm sm:px-2 sm:text-[10px]">
                New
              </span>
            )}
            {product.isBestSeller === true && (
              <span className="whitespace-nowrap rounded-full bg-amber-500 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white shadow-sm sm:px-2 sm:text-[10px]">
                Best Seller
              </span>
            )}
            {product.isFeatured === true && (
              <span className="whitespace-nowrap rounded-full bg-violet-600 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white shadow-sm sm:px-2 sm:text-[10px]">
                Featured
              </span>
            )}
          </div>
        )}

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
          className="block min-w-0 overflow-hidden"
        >
          <h3 className="font-headline-sm text-label-button min-w-0 font-bold text-on-surface group-hover:text-primary transition-colors text-xs sm:text-sm">
            <ProductNameSlider name={t(product.name, product.tamilName)} />
          </h3>
        </Link>
        <p className="font-body-sm text-[10px] sm:text-xs text-on-surface-variant mb-1 sm:mb-space-sm line-clamp-1">
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
        <div className="flex flex-wrap items-baseline gap-x-space-xs gap-y-1 mb-2 sm:mb-space-md">
          <span className="font-price-card text-price-card text-on-surface font-black text-sm sm:text-base">
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
      <div className="w-full mt-1 sm:mt-2">
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
            className={`w-full py-1.5 sm:py-2.5 ${compactAddToCart ? "px-1 whitespace-nowrap sm:whitespace-normal text-[10px] gap-0.5 sm:px-space-md sm:text-xs sm:gap-space-xs" : "px-space-md text-[11px] gap-1 sm:text-xs sm:gap-space-xs"} bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed rounded-xl font-label-button font-bold flex items-center justify-center transition-colors shadow-sm cursor-pointer active:scale-95`}
          >
            <span className={`material-symbols-outlined shrink-0 ${compactAddToCart ? "text-[14px] sm:text-[18px]" : "text-[16px] sm:text-[18px]"}`}>add_shopping_cart</span>
            <span>Add to Cart</span>
          </button>
        ) : (
          <div className="w-full flex items-center justify-between bg-primary text-on-primary rounded-xl p-1 shadow-sm">
            <button
              onClick={handleDecrement}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer sm:h-8 sm:w-8"
              title="Decrease quantity"
            >
              <span className="material-symbols-outlined text-[18px]">remove</span>
            </button>
            <span className="font-headline-sm text-sm font-black text-white px-space-sm">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer sm:h-8 sm:w-8"
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

      {showShareDialog && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/45 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowShareDialog(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setShowShareDialog(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={shareDialogTitleId}
            className="w-full max-w-sm rounded-3xl bg-surface-container-lowest p-5 text-on-surface shadow-2xl sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id={shareDialogTitleId} className="text-lg font-bold">
                  Share product
                </h2>
                <p className="mt-1 truncate text-sm text-on-surface-variant">{product.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowShareDialog(false)}
                aria-label="Close share options"
                className="-mr-1 -mt-1 rounded-full p-2 text-on-surface-variant hover:bg-surface-container-low"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {shareOptions.map((option) => (
                <a
                  key={option.name}
                  href={option.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShowShareDialog(false);
                  }}
                  className="flex min-h-12 items-center gap-2.5 rounded-xl border border-outline-variant/25 px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-container-low"
                >
                  <ShareOptionIcon name={option.name} />
                  {option.name}
                </a>
              ))}
            </div>

            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                void handleCopyShareLink();
              }}
              className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary transition-colors hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">content_copy</span>
              Copy link
            </button>
          </section>
        </div>
      )}
    </div>
  );
}

