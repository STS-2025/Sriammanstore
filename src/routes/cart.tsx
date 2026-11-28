import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { WishlistHeartButton } from "../components/product/WishlistHeartButton";
import { ProductNameSlider } from "../components/product/ProductNameSlider";
import { CheckoutProgressBar } from "../components/checkout/CheckoutProgressBar";
import { OrderBillSummary } from "../components/checkout/OrderBillSummary";
import { CartDiscountControls } from "../components/checkout/CartDiscountControls";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useLanguage } from "../context/LanguageContext";
import { productService } from "../services/productService";
import { authManager } from "../services/authAdapter";
import { settingsService, DEFAULT_DELIVERY_SETTINGS, type StoreDeliverySettings } from "../services/settingsService";
import { getBookableDeliverySlots } from "../lib/deliverySlots";
import type { DeliverySlot, Product } from "../types";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Review Cart — Sriman Smart Store" },
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
    deliverySpeed,
    standardDeliveryFee,
    expressDeliveryFee,
    isExpressDeliveryAvailable,
    checkoutSettings,
    selectedSlotId,
    setDeliverySpeed,
    setSelectedSlotId,
    updateQty,
    removeFromCart,
    clearCart,
    addToCart,
    refreshCart,
  } = useCart();
  const {
    user,
    firebaseUser,
    identityNotice,
    isLoading: authLoading,
    isResolvingIdentity,
    refreshUser,
  } = useAuth();
  const { addToWishlist, isWishlisted } = useWishlist();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [quickAddProducts, setQuickAddProducts] = useState<Product[]>([]);
  const [configuredDeliverySlots, setConfiguredDeliverySlots] = useState<DeliverySlot[]>([]);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [deliveryConfig, setDeliveryConfig] = useState<StoreDeliverySettings>(DEFAULT_DELIVERY_SETTINGS);
  const deliverySlots = useMemo(
    () => getBookableDeliverySlots(configuredDeliverySlots, currentTime),
    [configuredDeliverySlots, currentTime],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      settingsService.getDeliverySlots(),
      settingsService.getDeliveryConfiguration(),
    ]).then(([slots, config]) => {
      if (!active) return;
      setConfiguredDeliverySlots(slots || []);
      if (config) setDeliveryConfig(config);
    }).catch((error) => {
      console.error("Failed to load delivery slot options:", error);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (deliverySlots.length > 0 && !deliverySlots.some((slot) => slot.id === selectedSlotId)) {
      setSelectedSlotId(deliverySlots[0].id);
    }
  }, [deliverySlots, selectedSlotId, setSelectedSlotId]);

  // Load quick-add staples
  useEffect(() => {
    async function loadQuickAddStaples() {
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
    loadQuickAddStaples();
  }, [items]);

  const handleSaveToWishlist = async (item: (typeof items)[0]): Promise<boolean> => {
    try {
      // Find underlying product and save to wishlist
      const p = await productService.getProductById(item.productId);
      if (p) {
        const added = await addToWishlist(p, item.optionIndex || 0);
        if (added === undefined) return false;
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

  if (isLoading || ((!user) && (authLoading || isResolvingIdentity))) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="mx-auto flex min-h-[calc(100dvh-5rem)] w-full max-w-[1320px] flex-col justify-center px-margin-desktop pb-16 pt-20">
          {(authLoading || isResolvingIdentity) && (
            <p className="mb-4 text-center text-sm font-semibold text-on-surface-variant">
              Checking your saved session…
            </p>
          )}
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

  if (!user && firebaseUser && identityNotice) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="mx-auto w-full max-w-2xl px-4 py-24 text-center">
          <div role="alert" className="rounded-3xl border border-amber-500/30 bg-surface-container-lowest p-6 shadow-sm sm:p-8">
            <h1 className="text-xl font-extrabold">{identityNotice.title}</h1>
            <p className="mt-2 text-sm text-on-surface-variant">{identityNotice.userMessage}</p>
            {identityNotice.isRetryable && (
              <button
                type="button"
                onClick={() => void refreshUser()}
                disabled={isResolvingIdentity}
                className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {isResolvingIdentity ? "Restoring account…" : "Try again"}
              </button>
            )}
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
        <div className="max-w-[1320px] mx-auto px-margin-desktop pt-4 pb-space-xl sm:py-space-xl">
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
          {/* Top Bar: Cart Title & Checkout Progress */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[24px]">shopping_bag</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="min-w-0 font-headline-lg text-lg font-extrabold tracking-tight text-on-surface sm:text-xl md:text-2xl">
                    Your Cart
                  </h1>
                  {cartCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider">
                      {cartCount} ITEMS
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant hidden min-[500px]:block mt-0.5">
                  Carefully packed from Gobichettipalayam Hub
                </p>
              </div>
            </div>

            {/* Checkout Progress Bar (Cart Step) */}
            <div className="hidden md:block w-full md:w-auto">
              <CheckoutProgressBar
                currentStep={1}
                cartItemCount={cartCount}
                selectedAddressText="Choose delivery details in step 2"
                onStepClick={(step) => {
                  if (step === 2) void handleProceedToCheckout();
                }}
                canNavigateToStep={(step) =>
                  step === 1 ||
                  (step === 2 && items.length > 0 && !!user && !isGuestCartSyncing && !guestCartSyncError)
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
                Explore our wide range of daily essentials, kitchen staples, and favorite household items.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all"
              >
                <span>Browse Catalog</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          ) : (
            /* Desktop Two-Column Layout */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Cart Items and Quick Add */}
              <div className="contents lg:block lg:col-span-8 lg:space-y-6">
                {/* Step 1: Cart Items */}
                <div className="order-1 bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-4 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-5 pb-3 border-b border-outline-variant/15">
                    <div>
                      <h2 className="font-headline-sm text-base font-extrabold text-on-surface hidden text-[500px]">
                        Items in Your Cart ({cartCount})
                      </h2>
                      <p className="text-[11px] text-on-surface-variant hidden min-[500px]:block">
                        Guaranteed immediate credit return
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
                              className="h-20 w-20 sm:h-20 sm:w-20 rounded-2xl bg-white overflow-hidden shrink-0 flex items-center justify-center p-0.5 sm:p-2 border border-outline-variant/15 group"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-contain group-hover:scale-105 transition-transform drop-shadow-xs"
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
                                    <span className="font-price-mrp text-base text-outline line-through">
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
                                  className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors bg-primary-container hover:bg-surface text-white cursor-pointer"
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
                                  className="h-9 w-9 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors bg-primary-container text-white hover:bg-primary-container cursor-pointer shadow-sm"
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
                  {/* <div className="mt-6 pt-4 border-t border-outline-variant/15 flex flex-col items-start justify-between gap-2 text-xs bg-surface-container-low/50 p-3.5 rounded-2xl sm:flex-row sm:items-center">
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
                  </div> */}
                </div>

                {/* 4. Saved for Later & Quick Add */}
                {quickAddProducts.length > 0 && (
                  <div className="hidden lg:block order-7 bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm">
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
                            className="p-3.5 rounded-2xl border border-outline-variant/15 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-14 w-14 rounded-xl shrink-0 flex items-center justify-center p-0.5 border border-outline-variant/15 overflow-hidden">
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="max-w-full max-h-full scale-105 object-contain"
                                  loading="lazy"
                                />
                              </div>
                              <div className="min-w-0">
                                <h4 className="overflow-hidden font-headline-sm text-xs font-bold text-on-surface">
                                  <ProductNameSlider name={p.name} />
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
              </div>

              {/* RIGHT COLUMN: Coupon, Smart Coins, Bill Summary, Quality Promise */}
              <div className="contents lg:block lg:col-span-4 lg:space-y-6">
                <CartDiscountControls className="hidden lg:block order-5" />
                {/* Delivery selection sits immediately before the bill summary. */}
                <section id="cart-delivery-slot" className="order-3 rounded-3xl border border-outline-variant/15 bg-surface-container-lowest p-4 shadow-sm sm:p-6">
                  <div className="mb-3 flex items-center gap-2 sm:mb-4">
                    <span className="material-symbols-outlined text-[20px] text-secondary">bolt</span>
                    <h2 className="font-headline-sm text-[15px] font-extrabold text-on-surface sm:text-base">
                      Delivery Speed &amp; Slot
                    </h2>
                  </div>
                  <p className="mb-3 hidden text-[11px] font-semibold text-on-surface-variant sm:block">
                    Orders for today must be placed by {checkoutSettings.orderCutoffTime}.
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                    <label className={`flex cursor-pointer items-start gap-2 rounded-2xl border p-3 transition-colors ${deliverySpeed === "express" ? "border-primary bg-primary/5" : "border-outline-variant/20 bg-surface-container-low/40"} ${!isExpressDeliveryAvailable ? "cursor-not-allowed opacity-50" : ""}`}>
                      <input
                        type="radio"
                        name="cart_delivery_speed"
                        checked={deliverySpeed === "express"}
                        disabled={!isExpressDeliveryAvailable}
                        onChange={() => setDeliverySpeed("express")}
                        className="mt-1 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 text-xs font-bold text-on-surface">
                          <span>Express 60-Min</span>
                          <span>{expressDeliveryFee > 0 ? `₹${expressDeliveryFee}` : "FREE"}</span>
                        </span>
                        <span className="mt-1 block text-[11px] text-on-surface-variant">
                          Arrives in 45–60 min
                          {!isExpressDeliveryAvailable && (
                            <> · Available daily from {checkoutSettings.expressStartHour}:00 to {checkoutSettings.expressEndHour}:00</>
                          )}
                        </span>
                      </span>
                    </label>

                    <label className={`flex cursor-pointer items-start gap-2 rounded-2xl border p-3 transition-colors ${deliverySpeed === "standard" ? "border-primary bg-primary/5" : "border-outline-variant/20 bg-surface-container-low/40"}`}>
                      <input
                        type="radio"
                        name="cart_delivery_speed"
                        checked={deliverySpeed === "standard"}
                        onChange={() => setDeliverySpeed("standard")}
                        className="mt-1 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 text-xs font-bold text-on-surface">
                          <span>Standard Delivery</span>
                          <span>{standardDeliveryFee > 0 ? `₹${standardDeliveryFee}` : "FREE"}</span>
                        </span>
                        <span className="mt-1 block text-[11px] text-on-surface-variant">Configured delivery window</span>
                        {deliverySlots.length > 0 && (
                          <select
                            aria-label="Delivery time"
                            value={deliverySlots.some((slot) => slot.id === selectedSlotId) ? selectedSlotId : deliverySlots[0].id}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) => setSelectedSlotId(event.target.value)}
                            className="mt-2 w-full rounded-lg border border-outline-variant/30 bg-white px-2 py-2 text-xs font-semibold text-on-surface"
                          >
                            {deliverySlots.map((slot) => <option key={slot.id} value={slot.id}>{slot.title}</option>)}
                          </select>
                        )}
                      </span>
                    </label>
                  </div>
                  <p className="mt-3 font-semibold text-on-surface-variant hidden text-[500px]">
                    Fulfilled by {deliveryConfig.storeName}
                  </p>
                </section>
                {/* Bill Summary Card */}
                <OrderBillSummary
                  className="order-4"
                  mode="cart"
                  ctaText="Proceed to Checkout"
                  disabled={items.length === 0}
                  onCtaClick={handleProceedToCheckout}
                />

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
