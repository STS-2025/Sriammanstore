import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { WishlistHeartButton } from "../components/product/WishlistHeartButton";
import { CheckoutProgressBar } from "../components/checkout/CheckoutProgressBar";
import { OrderBillSummary } from "../components/checkout/OrderBillSummary";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import { addressService } from "../services/addressService";
import { productService } from "../services/productService";
import { authManager } from "../services/authAdapter";
import type { Address, Product } from "../types";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Review Cart — Sri Amman Smart Store" },
      { name: "description", content: "Review your farm fresh items before checkout." },
    ],
  }),
  component: CartPage,
});

export function CartPage() {
  const {
    items,
    isLoading,
    cartError,
    isGuestCartSyncing,
    guestCartSyncError,
    syncGuestCart,
    cartCount,
    cartSubtotal,
    cartTotalSavings,
    appliedCoupon,
    couponDiscount,
    deliverySettingsError,
    redeemCoins,
    coinsToRedeem,
    coinValueInRupees,
    deliverySpeed,
    isExpressDeliveryAvailable,
    standardDeliveryFee,
    expressDeliveryFee,
    applyCoupon,
    removeCoupon,
    setRedeemCoins,
    setDeliverySpeed,
    updateQty,
    removeFromCart,
    clearCart,
    addToCart,
    refreshCart,
  } = useCart();
  const { user } = useAuth();
  const { addToWishlist, isWishlisted } = useWishlist();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Coupon input state
  const [couponCode, setCouponCode] = useState("");
  const [isCouponChecking, setIsCouponChecking] = useState(false);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [quickAddProducts, setQuickAddProducts] = useState<Product[]>([]);

  // Load default delivery address and quick-add staples
  useEffect(() => {
    async function loadAddressAndStaples() {
      if (user) {
        try {
          const addrList = await addressService.getAddresses(user.id);
          const def = addrList?.find((a) => a.isDefault) || addrList?.[0] || null;
          setDefaultAddress(def);
        } catch {
          // Address fetch best effort
        }
      }
      try {
        const prods = await productService.getProducts();
        // Pick 2 staples for quick add (e.g. turmeric or staples)
        const staples = prods.filter(
          (p) =>
            !items.some((i) => i.productId === p.id) &&
            (p.categorySlug === "staples-grains" || p.categorySlug === "organic-spices")
        );
        setQuickAddProducts(staples.slice(0, 2));
      } catch {
        // Best effort
      }
    }
    loadAddressAndStaples();
  }, [user, items]);

  const userCoins = user?.smartCoins ?? user?.coins ?? 0;

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }
    setIsCouponChecking(true);
    try {
      const res = await applyCoupon(couponCode);
      if (res.success) {
        toast.success(res.message);
        setCouponCode("");
      } else {
        toast.error(res.message);
      }
    } finally {
      setIsCouponChecking(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode("");
    toast.info("Coupon removed");
  };

  const handleSaveToWishlist = async (item: (typeof items)[0]): Promise<boolean> => {
    try {
      // Find underlying product and save to wishlist
      const p = await productService.getProductById(item.productId);
      if (p) {
        const added = await addToWishlist(p, item.optionIndex || 0);
        if (added) toast.success(`Saved ${item.name} to your wishlist`);
        else toast.info(`Removed ${item.name} from your wishlist`);
        return added;
      }
      return false;
    } catch (err: any) {
      toast.error(err.message || "Could not update wishlist");
      return false;
    }
  };

  const handleClearCart = async () => {
    if (items.length === 0) return;
    if (window.confirm("Are you sure you want to remove all items from your cart?")) {
      await clearCart();
      toast.info("Cart cleared");
    }
  };

  const handleProceedToCheckout = async () => {
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!user) {
      toast.info("Sign in or create an account to continue checkout. Your cart is saved.");
      navigate({ to: "/login", search: { redirect: "/checkout" } as any } as any);
      return;
    }
    if (isGuestCartSyncing) {
      toast.info("Your saved cart is still syncing. Please wait a moment.");
      return;
    }
    if (guestCartSyncError && !(await syncGuestCart())) return;
    navigate({
      to: "/checkout",
      search: { step: 2 } as any,
    } as any);
  };

  const handleAddAddressFromCart = () => {
    if (!user) {
      toast.info("Please sign in to add a delivery address");
      navigate({ to: "/login", search: { redirect: "/checkout?step=2&newAddress=true" } as any } as any);
      return;
    }
    navigate({
      to: "/checkout",
      search: { step: 2, newAddress: true } as any,
    } as any);
  };

  if (isLoading) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1320px] mx-auto px-margin-desktop py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-surface-container-low rounded-2xl w-1/4"></div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-4">
                <div className="h-28 bg-surface-container-low rounded-3xl"></div>
                <div className="h-40 bg-surface-container-low rounded-3xl"></div>
              </div>
              <div className="lg:col-span-4 h-96 bg-surface-container-low rounded-3xl"></div>
            </div>
          </div>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]">
        <div className="max-w-[1320px] mx-auto px-margin-desktop py-space-xl">
          {deliverySettingsError && (
            <div role="status" className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900">
              Delivery settings could not be loaded. The legacy default charges are being shown. {deliverySettingsError}
            </div>
          )}
          {guestCartSyncError && (
            <div role="alert" className="mb-4 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-950 sm:flex-row sm:items-center sm:justify-between">
              <p>{guestCartSyncError} Your saved guest cart has not been deleted.</p>
              <button
                type="button"
                onClick={() => void syncGuestCart()}
                disabled={isGuestCartSyncing}
                className="shrink-0 rounded-xl bg-amber-700 px-4 py-2 font-bold text-white disabled:opacity-60"
              >
                {isGuestCartSyncing ? "Syncing cart…" : "Retry cart sync"}
              </button>
            </div>
          )}
          {/* Top Bar: Title & 3-Step Progress Indicator */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface">
                    Review Cart
                  </h1>
                  {cartCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
                      {cartCount} ITEMS
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Carefully packed from Gobichettipalayam Hub with temperature-controlled handling
                </p>
              </div>
            </div>

            {/* 3-Step Progress Bar (Step 1 Active) */}
            <div className="w-full md:w-auto">
              <CheckoutProgressBar
                currentStep={1}
                cartItemCount={cartCount}
                selectedAddressText={
                  defaultAddress
                    ? `${defaultAddress.city}, ${defaultAddress.pincode}`
                    : "No Address"
                }
                onStepClick={(step) => {
                  if (step > 1) void handleProceedToCheckout();
                }}
                canNavigateToStep={(step) =>
                  step === 1 || (items.length > 0 && !!user && !isGuestCartSyncing && !guestCartSyncError)
                }
              />
            </div>
          </div>

          {/* Distinct Cart Loading States: Failure vs Genuinely Empty vs Populated */}
          {cartError ? (
            /* Cart Read Failure View: Explicitly distinguishes errors from empty carts */
            <div
              data-testid="cart-error-banner"
              className="bg-surface-container-lowest border border-error/25 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm my-8"
            >
              <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center text-3xl mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">cloud_off</span>
              </div>
              <h2 className="font-headline-lg text-xl font-bold mb-2 text-on-surface">
                Unable to Load Your Cart
              </h2>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                {cartError}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => refreshCart()}
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Try Again</span>
                </button>
                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 bg-surface-container text-on-surface px-5 py-2.5 rounded-2xl font-headline-sm text-xs font-bold hover:bg-surface-container-high transition-all"
                >
                  <span>Browse Catalog</span>
                </Link>
              </div>
            </div>
          ) : items.length === 0 ? (
            /* Genuinely Empty Cart View */
            <div
              data-testid="empty-cart-view"
              className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm my-8"
            >
              <div className="w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center text-4xl mx-auto mb-4 text-primary">
                🛒
              </div>
              <h2 className="font-headline-lg text-xl font-bold mb-2">
                Your Shopping Cart is Empty
              </h2>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                Explore our pure wood-churned cold-pressed oils, single-origin heirloom
                grains, and traditional South Indian kitchen staples.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all"
              >
                <span>Browse Farm Catalog</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          ) : (
            /* Desktop Two-Column Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Address Banner, Delivery Speed, Cart Items, Quick Add */}
              <div className="lg:col-span-8 space-y-6">
                {/* 1. Delivery Address Banner */}
                {defaultAddress ? (
                  <div
                    data-testid="delivery-address-cart-banner"
                    className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">location_on</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-sm font-extrabold text-on-surface">
                            Delivering to {defaultAddress.tag || "Home"}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary">
                            DEFAULT
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                          {defaultAddress.name} — {defaultAddress.houseNo}, {defaultAddress.street}, {defaultAddress.city} {defaultAddress.pincode}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleProceedToCheckout}
                      className="font-headline-sm text-xs font-bold flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-xl transition-colors text-primary hover:text-primary-container hover:bg-primary/5 cursor-pointer"
                    >
                      <span>Change Address</span>
                      <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </button>
                  </div>
                ) : (
                  <div
                    data-testid="no-address-cart-banner"
                    className="bg-surface-container-lowest border border-dashed border-primary/30 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <span className="material-symbols-outlined text-[20px]">add_location_alt</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-sm font-extrabold text-on-surface">
                            No Delivery Address Found
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          No address saved for this account. Please add a delivery address.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddAddressFromCart}
                      className="font-headline-sm text-xs font-bold flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-xl transition-colors bg-primary text-white hover:bg-primary-container cursor-pointer shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      <span>Add Address</span>
                    </button>
                  </div>
                )}

                {/* 2. Choose Delivery Speed Card */}
                <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        local_shipping
                      </span>
                      <h3 className="font-headline-sm text-sm font-extrabold text-on-surface">
                        Choose Delivery Speed
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      {isExpressDeliveryAvailable ? "Express available now" : "Standard delivery available now"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Standard Delivery */}
                    <div
                      onClick={() => setDeliverySpeed("standard")}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        deliverySpeed === "standard"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/40"
                      }`}
                    >
                      <input
                        type="radio"
                        id="speed_standard"
                        name="delivery_speed"
                        checked={deliverySpeed === "standard"}
                        onChange={() => setDeliverySpeed("standard")}
                        className="mt-1 accent-primary cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="speed_standard"
                            className="font-headline-sm text-xs font-bold text-on-surface cursor-pointer"
                          >
                            Standard Delivery
                          </label>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary">
                            {standardDeliveryFee > 0 ? `₹${standardDeliveryFee}` : "FREE"}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-on-surface-variant mt-1">
                          Tomorrow Morning, 8:00 AM – 11:00 AM
                        </p>
                        <p className="text-[10px] text-outline mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">eco</span>
                          Low carbon consolidated route
                        </p>
                      </div>
                    </div>

                    {/* Express 60-Min */}
                    <div
                      onClick={() => isExpressDeliveryAvailable && setDeliverySpeed("express")}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                        deliverySpeed === "express"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/40"
                      }`}
                    >
                      <input
                        type="radio"
                        id="speed_express"
                        name="delivery_speed"
                        checked={deliverySpeed === "express"}
                        disabled={!isExpressDeliveryAvailable}
                        onChange={() => setDeliverySpeed("express")}
                        className="mt-1 accent-primary cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="speed_express"
                            className="font-headline-sm text-xs font-bold text-on-surface flex items-center gap-1 cursor-pointer"
                          >
                            <span>Express 60–Min</span>
                            <span className="text-secondary">⚡</span>
                          </label>
                          <span className="font-headline-sm text-xs font-extrabold text-on-surface">
                            {expressDeliveryFee > 0 ? `₹${expressDeliveryFee}` : "FREE"}</span>
                        </div>
                        <p className="text-[11px] font-semibold text-on-surface-variant mt-1">
                          Arriving in 45–60 mins
                        </p>
                        <p className="text-[10px] text-outline mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">bolt</span>
                          Dedicated Express rider
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Items in Your Cart Card */}
                <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-outline-variant/15">
                    <div>
                      <h2 className="font-headline-sm text-base font-extrabold text-on-surface">
                        Items in Your Cart ({cartCount})
                      </h2>
                      <p className="text-[11px] text-on-surface-variant">
                        Guaranteed fresh or immediate credit return
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearCart}
                      className="text-xs font-bold flex items-center gap-1 text-error hover:underline cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                      <span>Clear Cart</span>
                    </button>
                  </div>

                  {/* Cart Items List */}
                  <div className="divide-y divide-outline-variant/15">
                    {items.map((item) => {
                      const itemMrp = item.mrp || item.price;
                      const hasDiscount = itemMrp > item.price;
                      const discountPct = hasDiscount
                        ? Math.round(((itemMrp - item.price) / itemMrp) * 100)
                        : 0;

                      return (
                        <div
                          key={item.id}
                          data-testid={`cart-item-${item.id}`}
                          className="py-4 sm:py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
                        >
                          {/* Item Info */}
                          <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                            <Link
                              to="/product"
                              search={{ id: item.productId } as any}
                              className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-surface-container-low overflow-hidden shrink-0 flex items-center justify-center p-2 border border-outline-variant/15 group"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform drop-shadow-xs"
                                loading="lazy"
                              />
                            </Link>

                            <div className="min-w-0 flex-1">
                              <Link
                                to="/product"
                                search={{ id: item.productId } as any}
                                className="block whitespace-normal break-words font-headline-sm text-sm font-bold text-on-surface hover:text-primary transition-colors"
                              >
                                {item.name}
                              </Link>
                              <p className="text-xs text-on-surface-variant font-medium">
                                {item.unitSize} {item.unit} Pack
                              </p>

                              {/* Price Row */}
                              <div className="flex items-baseline gap-2 mt-1.5">
                                <span className="font-price-card text-base font-extrabold text-on-surface">
                                  ₹{item.price}
                                </span>
                                {hasDiscount && (
                                  <>
                                    <span className="font-price-mrp text-xs text-outline line-through">
                                      ₹{itemMrp}
                                    </span>
                                    <span className="text-[11px] font-bold text-secondary">
                                      {discountPct}% OFF
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Controls: Stepper, Line Total & Actions */}
                          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:flex-col sm:items-end sm:gap-3">
                            <div className="flex items-center gap-3">
                              {/* Quantity Stepper */}
                              <div className="flex shrink-0 items-center bg-surface-container-low rounded-xl p-1 border border-outline-variant/20">
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.id, item.quantity - 1)}
                                  className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors hover:bg-surface text-on-surface cursor-pointer"
                                  title="Decrease quantity"
                                >
                                  −
                                </button>
                                <span className="px-3 font-headline-sm text-xs font-black text-on-surface">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQty(item.id, item.quantity + 1)}
                                  className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors bg-primary text-white hover:bg-primary-container cursor-pointer shadow-sm"
                                  title="Increase quantity"
                                >
                                  +
                                </button>
                              </div>

                              {/* Line Total */}
                              <div className="font-price-card text-base font-black text-on-surface sm:text-right min-w-[70px]">
                                ₹{item.price * item.quantity}
                              </div>
                            </div>

                            {/* Secondary Actions: Save & Remove */}
                            <div className="flex items-center gap-1 sm:gap-3 text-xs font-semibold text-outline">
                              <WishlistHeartButton
                                active={isWishlisted(item.productId)}
                                onToggle={() => handleSaveToWishlist(item)}
                                size="sm"
                                label="Save"
                                activeLabel="Remove"
                                labelClassName="hidden sm:inline"
                                className="min-h-10 min-w-10 justify-center rounded-lg p-2 gap-1 text-xs font-semibold text-outline hover:text-primary transition-colors sm:min-h-0 sm:min-w-0 sm:rounded-none sm:p-0"
                              />
                              <span className="hidden sm:inline">•</span>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id)}
                                aria-label={`Remove ${item.name} from cart`}
                                title={`Remove ${item.name} from cart`}
                                className="min-h-10 min-w-10 rounded-lg p-2 flex items-center justify-center gap-0.5 hover:text-error transition-colors cursor-pointer sm:min-h-0 sm:min-w-0 sm:rounded-none sm:p-0 sm:justify-start"
                              >
                                <span className="material-symbols-outlined text-[18px] sm:text-[14px]">
                                  delete
                                </span>
                                <span className="hidden sm:inline">Remove</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Subtotal Banner inside Cart Card */}
                  <div className="mt-6 pt-4 border-t border-outline-variant/15 flex flex-col items-start justify-between gap-2 text-xs bg-surface-container-low/50 p-3.5 rounded-2xl sm:flex-row sm:items-center">
                    <span className="font-headline-sm font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[18px]">
                        shopping_bag
                      </span>
                      <span>Items Subtotal: ₹{(cartSubtotal ?? 0).toLocaleString("en-IN")}</span>
                    </span>
                    {(cartTotalSavings ?? 0) > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-black text-[11px]">
                        Catalog Savings: ₹{(cartTotalSavings ?? 0).toLocaleString("en-IN")} saved
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. Saved for Later & Quick Add */}
                {quickAddProducts.length > 0 && (
                  <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-headline-sm text-sm font-extrabold text-on-surface">
                          Saved for Later & Quick Add
                        </h3>
                        <p className="text-[11px] text-on-surface-variant">
                          Frequent staples you may need before finishing this order
                        </p>
                      </div>
                      <Link
                        to="/wishlist"
                        className="text-primary hover:underline text-xs font-bold flex items-center gap-0.5"
                      >
                        <span>View All Wishlist</span>
                        <span className="material-symbols-outlined text-[15px]">
                          arrow_forward
                        </span>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {quickAddProducts.map((p) => {
                        const opt = p.options[0];
                        if (!opt) return null;
                        return (
                          <div
                            key={p.id}
                            className="p-3.5 rounded-2xl bg-surface-container-low/40 border border-outline-variant/15 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl bg-surface-container-low shrink-0 flex items-center justify-center p-1 border border-outline-variant/15 overflow-hidden">
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="max-w-full max-h-full object-contain"
                                  loading="lazy"
                                />
                              </div>
                              <div>
                                <h4 className="whitespace-normal break-words font-headline-sm text-xs font-bold text-on-surface">
                                  {p.name}
                                </h4>
                                <span className="text-[11px] text-on-surface-variant">
                                  {opt.unitSize} {opt.unit} Pack
                                </span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-price-card text-xs font-extrabold text-on-surface">
                                    ₹{opt.offerPrice}
                                  </span>
                                  {opt.mrp > opt.offerPrice && (
                                    <span className="text-[10px] text-outline line-through">
                                      ₹{opt.mrp}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => addToCart(p, 0, 1)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-sm bg-primary text-white hover:bg-primary-container cursor-pointer"
                            >
                              + Move to Cart
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 5. Trust Guarantee Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-surface-container-low text-center">
                    <span className="material-symbols-outlined text-primary text-[22px] mb-1">
                      verified
                    </span>
                    <h5 className="font-headline-sm text-xs font-bold text-on-surface">
                      100% Genuine
                    </h5>
                    <p className="text-[10px] text-on-surface-variant">Hand-sorted fresh</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface-container-low text-center">
                    <span className="material-symbols-outlined text-primary text-[22px] mb-1">
                      bolt
                    </span>
                    <h5 className="font-headline-sm text-xs font-bold text-on-surface">
                      60-Min Express
                    </h5>
                    <p className="text-[10px] text-on-surface-variant">Local neighborhoods</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface-container-low text-center">
                    <span className="material-symbols-outlined text-primary text-[22px] mb-1">
                      replay
                    </span>
                    <h5 className="font-headline-sm text-xs font-bold text-on-surface">
                      Easy 24-hr Returns
                    </h5>
                    <p className="text-[10px] text-on-surface-variant">No questions asked</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-surface-container-low text-center">
                    <span className="material-symbols-outlined text-primary text-[22px] mb-1">
                      lock
                    </span>
                    <h5 className="font-headline-sm text-xs font-bold text-on-surface">
                      Secure UPI & Cards
                    </h5>
                    <p className="text-[10px] text-on-surface-variant">PCI-DSS encrypted</p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Coupon, Smart Coins, Bill Summary, Quality Promise */}
              <div className="lg:col-span-4 space-y-6">
                {/* 1. Apply Coupon Card */}
                <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[20px]">
                        sell
                      </span>
                      <h3 className="font-headline-sm text-sm font-extrabold text-on-surface">
                        Apply Coupon
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-secondary">Store promotions</span>
                  </div>

                  {/* Input Form */}
                  <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter a promo code"
                      className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-low text-xs font-bold text-on-surface uppercase placeholder:normal-case placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/15"
                    />
                    <button
                      type="submit"
                      disabled={isCouponChecking}
                      className="px-5 py-2.5 rounded-xl bg-primary text-white font-headline-sm text-xs font-bold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
                    >
                      Apply
                    </button>
                  </form>

                  {/* Applied Coupon Banner */}
                  {appliedCoupon && (
                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">
                          check_circle
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-headline-sm text-xs font-black text-primary">
                              {appliedCoupon.code}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-primary text-white">
                              APPLIED
                            </span>
                          </div>
                          <p className="text-[11px] text-primary/90 font-medium">Promo discount: ₹{couponDiscount}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-xs font-bold text-error hover:underline shrink-0 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                </div>

                {/* 2. Smart Coins Card */}
                <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">
                        monetization_on
                      </span>
                      <h3 className="font-headline-sm text-sm font-extrabold text-on-surface">
                        Smart Coins
                      </h3>
                    </div>
                    <span className="text-xs font-black text-secondary">
                      {userCoins} Available
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mb-4 leading-relaxed">
                    Use accumulated loyalty coins from your past fresh produce orders.
                  </p>

                  {/* Redeem Checkbox Card */}
                  <div
                    onClick={() => {
                      if (userCoins > 0) setRedeemCoins(!redeemCoins);
                      else toast.info("No Smart Coins available in your wallet");
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      redeemCoins
                        ? "border-secondary bg-secondary/10 shadow-sm"
                        : "border-outline-variant/20 hover:border-secondary/40 bg-surface-container-low/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={redeemCoins}
                        onChange={(e) => setRedeemCoins(e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        disabled={userCoins <= 0}
                        className="accent-secondary cursor-pointer"
                      />
                      <div>
                        <span className="font-headline-sm text-xs font-bold text-on-surface block">
                          Redeem {coinsToRedeem} Coins
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          Instant ₹{(coinsToRedeem * coinValueInRupees).toFixed(2).replace(/\.00$/, "")} direct checkout discount
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[20px]">
                      military_tech
                    </span>
                  </div>
                </div>

                {/* 3. Bill Summary Card */}
                <OrderBillSummary
                  mode="cart"
                  ctaText="Proceed to Checkout"
                  disabled={items.length === 0}
                  onCtaClick={handleProceedToCheckout}
                />

                {/* 4. Quality Promise Card */}
                <div className="p-4 rounded-3xl bg-surface-container-low/60 border border-outline-variant/15 flex items-start gap-3 text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                    verified_user
                  </span>
                  <div>
                    <h5 className="font-headline-sm text-xs font-bold text-on-surface mb-0.5">
                      Sri Amman Quality Promise
                    </h5>
                    <p className="text-[11px] leading-relaxed">
                      Cold pressed oils & farm-picked produce are double-checked for weight
                      and quality seal before dispatch.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
