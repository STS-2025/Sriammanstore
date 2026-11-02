import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { cartService } from "../services/cartService";
import { convertCoinsToRupees, getMaxRedeemableCoins } from "../services/coinService";
import { calculateLegacyPromoDiscount, fetchPromoByCode } from "../services/promoService";
import {
  calculateLegacyDeliveryCharge,
  isLegacyExpressAvailable,
  LEGACY_CHECKOUT_DEFAULTS,
  settingsService,
  type LegacyCheckoutSettings,
} from "../services/settingsService";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";
import type { CartItem, Product } from "../types";

function getStored<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function removeStored(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(key);
  } catch {}
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  cartError: string | null;
  isGuestCartSyncing: boolean;
  guestCartSyncError: string | null;
  syncGuestCart: () => Promise<boolean>;
  cartCount: number;
  cartTotalMrp: number;
  cartSubtotal: number;
  cartTotalSavings: number;
  totalSavings: number;
  totalSavingsPercent: number;
  appliedCoupon: { code: string; amount: number; type: string } | null;
  couponDiscount: number;
  redeemCoins: boolean;
  coinsRedeemed: number;
  coinsToRedeem: number;
  coinDiscount: number;
  coinValueInRupees: number;
  deliverySpeed: "standard" | "express";
  deliveryFee: number;
  standardDeliveryFee: number;
  expressDeliveryFee: number;
  deliverySettingsError: string | null;
  isExpressDeliveryAvailable: boolean;
  finalTotal: number;
  selectedAddressId: string;
  selectedSlotId: string;
  paymentMethod: "upi" | "card" | "netbanking" | "cod";
  selectedUpiId: string;
  setDeliverySpeed: (speed: "standard" | "express") => void;
  setSelectedAddressId: (id: string) => void;
  setSelectedSlotId: (id: string) => void;
  setPaymentMethod: (method: "upi" | "card" | "netbanking" | "cod") => void;
  setSelectedUpiId: (id: string) => void;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string; discount?: number }>;
  removeCoupon: () => void;
  setRedeemCoins: (redeem: boolean) => void;
  resetDiscounts: () => void;
  addToCart: (product: Product, optionIndex?: number, quantity?: number) => Promise<void>;
  updateQty: (cartKey: string, quantity: number) => Promise<void>;
  removeFromCart: (cartKey: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  revalidateCartItems: () => Promise<CartItem[]>;
  getItemQuantity: (cartKey: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cartError, setCartError] = useState<string | null>(null);
  const [isSyncingGuestCart, setIsSyncingGuestCart] = useState(false);
  const [cartSyncAttemptedCustomerId, setCartSyncAttemptedCustomerId] = useState<string | null>(null);
  const [guestCartSyncError, setGuestCartSyncError] = useState<string | null>(null);

  // Scoped storage keys based on user ID
  const storageUserKey = user?.id || "guest";
  const coinsKey = `sri_amman_cart_coins_${storageUserKey}`;
  const speedKey = `sri_amman_cart_speed_${storageUserKey}`;
  const addressKey = `sri_amman_cart_address_${storageUserKey}`;
  const slotKey = `sri_amman_cart_slot_${storageUserKey}`;
  const paymentKey = `sri_amman_cart_payment_${storageUserKey}`;
  const upiKey = `sri_amman_cart_upi_${storageUserKey}`;

  // Legacy promos were cart-page state; don't trust a cached promo without revalidation.
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    amount: number;
    type: string;
  } | null>(null);

  const [redeemCoins, setRedeemCoinsState] = useState<boolean>(() =>
    getStored(coinsKey, false)
  );

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRedeemCoinsState(getStored(coinsKey, false));
    }
  }, [coinsKey]);

  const [deliverySpeed, setDeliverySpeedState] = useState<"standard" | "express">(() => {
    const saved = getStored<string | null>(speedKey, null);
    const legacy = getStored<string>("deliveryOption", "standard");
    const value = (saved ?? legacy).toLowerCase();
    return value === "express" || value === "fast" ? "express" : "standard";
  });
  const [legacyCheckoutSettings, setLegacyCheckoutSettings] =
    useState<LegacyCheckoutSettings>(LEGACY_CHECKOUT_DEFAULTS);
  const [deliverySettingsError, setDeliverySettingsError] = useState<string | null>(null);
  const [checkoutSettingsLoaded, setCheckoutSettingsLoaded] = useState(false);
  const currentHour = new Date().getHours();
  const isExpressDeliveryAvailable = isLegacyExpressAvailable(currentHour, legacyCheckoutSettings);

  useEffect(() => {
    let active = true;
    settingsService
      .getLegacyCheckoutSettings()
      .then((settings) => {
        if (active) setLegacyCheckoutSettings(settings);
      })
      .catch((error: unknown) => {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Could not load delivery settings.";
        setDeliverySettingsError(message);
      })
      .finally(() => {
        if (active) setCheckoutSettingsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const [selectedAddressId, setSelectedAddressIdState] = useState<string>(() =>
    getStored(addressKey, "")
  );

  const [selectedSlotId, setSelectedSlotIdState] = useState<string>(() =>
    getStored(slotKey, "slot_exp")
  );

  const [paymentMethod, setPaymentMethodState] = useState<"upi" | "card" | "netbanking" | "cod">(() =>
    getStored(paymentKey, "upi")
  );

  const [selectedUpiId, setSelectedUpiIdState] = useState<string>(() =>
    getStored(upiKey, "")
  );

  // Sync state with storage
  const setRedeemCoins = useCallback(
    (redeem: boolean) => {
      setRedeemCoinsState(redeem);
      setStored(coinsKey, redeem);
    },
    [coinsKey]
  );

  const setDeliverySpeed = useCallback(
    (speed: "standard" | "express") => {
      if (speed === "express" && !isExpressDeliveryAvailable) return;
      setDeliverySpeedState(speed);
      setStored(speedKey, speed);
    },
    [speedKey, isExpressDeliveryAvailable]
  );

  const setSelectedAddressId = useCallback(
    (id: string) => {
      setSelectedAddressIdState(id);
      setStored(addressKey, id);
    },
    [addressKey]
  );

  const setSelectedSlotId = useCallback(
    (id: string) => {
      setSelectedSlotIdState(id);
      setStored(slotKey, id);
    },
    [slotKey]
  );

  const setPaymentMethod = useCallback(
    (method: "upi" | "card" | "netbanking" | "cod") => {
      setPaymentMethodState(method);
      setStored(paymentKey, method);
    },
    [paymentKey]
  );

  const setSelectedUpiId = useCallback(
    (id: string) => {
      setSelectedUpiIdState(id);
      setStored(upiKey, id);
    },
    [upiKey]
  );

  const refreshCart = useCallback(async () => {
    setIsLoading(true);
    setCartError(null);
    try {
      const cartItems = await cartService.getCart(user?.id, user?.legacySassId);
      setItems(cartItems || []);
    } catch (err: unknown) {
      console.error("Failed to load cart items:", err);
      const msg = err instanceof Error ? err.message : "Failed to load cart items";
      setCartError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.legacySassId]);

  const syncGuestCart = useCallback(async () => {
    if (!user?.id) {
      await refreshCart();
      return true;
    }

    setIsSyncingGuestCart(true);
    setGuestCartSyncError(null);
    try {
      const mergedGuestItems = await cartService.mergeGuestCart(user.id, user.legacySassId, !!user.isVIP);
      await refreshCart();
      if (mergedGuestItems.length > 0) {
        toast.success("Your saved cart has been synced with your account.");
      }
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Could not sync your saved cart.";
      setGuestCartSyncError(message);
      // Keep the guest cart visible and recoverable if the authenticated sync fails.
      try {
        const guestItems = await cartService.getGuestCart(!!user.isVIP);
        if (guestItems.length > 0) setItems(guestItems);
        else await refreshCart();
      } catch {
        setCartError("Your saved guest cart could not be loaded. Please retry the cart sync.");
      }
      return false;
    } finally {
      setCartSyncAttemptedCustomerId(user.id);
      setIsSyncingGuestCart(false);
    }
  }, [user?.id, user?.legacySassId, user?.isVIP, refreshCart]);

  const isGuestCartSyncing =
    isSyncingGuestCart || (!!user?.id && cartSyncAttemptedCustomerId !== user.id);

  useEffect(() => {
    if (user?.id) void syncGuestCart();
    else void refreshCart();
  }, [user?.id, refreshCart, syncGuestCart]);

  const addToCart = async (
    product: Product,
    optionIndex: number = 0,
    quantity: number = 1
  ) => {
    const isVIP = !!user?.isVIP;
    const cartOwnerId = guestCartSyncError ? "guest_session" : user?.id;
    await cartService.addToCart(product, optionIndex, quantity, cartOwnerId, isVIP);
    if (guestCartSyncError) setItems(await cartService.getGuestCart(isVIP));
    else await refreshCart();
  };

  const updateQty = async (cartKey: string, quantity: number) => {
    await cartService.updateQuantity(cartKey, quantity, guestCartSyncError ? "guest_session" : user?.id);
    if (guestCartSyncError) setItems(await cartService.getGuestCart(!!user?.isVIP));
    else await refreshCart();
  };

  const removeFromCart = async (cartKey: string) => {
    await cartService.removeFromCart(cartKey, guestCartSyncError ? "guest_session" : user?.id);
    if (guestCartSyncError) setItems(await cartService.getGuestCart(!!user?.isVIP));
    else await refreshCart();
  };

  const clearCart = async () => {
    await cartService.clearCart(guestCartSyncError ? "guest_session" : user?.id);
    setItems([]);
  };

  const revalidateCartItems = async () => {
    const refreshedItems = await cartService.refreshCartItemDetails(items, !!user?.isVIP);
    setItems(refreshedItems);
    return refreshedItems;
  };

  const getItemQuantity = (cartKey: string): number => {
    const item = items.find((i) => i.id === cartKey || i.cartKey === cartKey);
    return item ? item.quantity : 0;
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Total Item MRP
  const cartTotalMrp = items.reduce(
    (sum, item) => sum + (item.mrp || item.price) * item.quantity,
    0
  );

  // Net item selling subtotal
  const cartSubtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Product savings (MRP - selling price)
  const cartTotalSavings = items.reduce(
    (sum, item) => sum + Math.max(0, (item.mrp || item.price) - item.price) * item.quantity,
    0
  );

  // Delivery fee calculation
  const standardDeliveryFee = useMemo(() => {
    return calculateLegacyDeliveryCharge(cartSubtotal, "standard", items.length, legacyCheckoutSettings);
  }, [items.length, cartSubtotal, legacyCheckoutSettings]);
  const expressDeliveryFee = useMemo(() => {
    return calculateLegacyDeliveryCharge(cartSubtotal, "express", items.length, legacyCheckoutSettings);
  }, [items.length, cartSubtotal, legacyCheckoutSettings]);
  const deliveryFee = deliverySpeed === "express" ? expressDeliveryFee : standardDeliveryFee;

  useEffect(() => {
    if (!checkoutSettingsLoaded) return;
    const nextSpeed = !isExpressDeliveryAvailable
      ? "standard"
      : cartSubtotal >= legacyCheckoutSettings.expressAutoThreshold
        ? "express"
        : deliverySpeed;
    if (nextSpeed === deliverySpeed) return;
    setDeliverySpeedState(nextSpeed);
    setStored(speedKey, nextSpeed);
  }, [
    cartSubtotal,
    checkoutSettingsLoaded,
    deliverySpeed,
    isExpressDeliveryAvailable,
    legacyCheckoutSettings.expressAutoThreshold,
    speedKey,
  ]);

  // Coupon calculations
  const applyCoupon = useCallback(
    async (code: string): Promise<{ success: boolean; message: string; discount?: number }> => {
      try {
        const promo = await fetchPromoByCode(code);
        const discount = calculateLegacyPromoDiscount(promo, cartSubtotal);
        const val = { code: promo.code, amount: promo.amount, type: promo.type };
        setAppliedCoupon(val);
        return {
          success: true,
          message: `Coupon ${promo.code} applied! You save ₹${discount}`,
          discount,
        };
      } catch (error: unknown) {
        return {
          success: false,
          message: error instanceof Error ? error.message : "Could not validate this promo code.",
        };
      }
    },
    [cartSubtotal]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  const resetDiscounts = useCallback(() => {
    setAppliedCoupon(null);
    setRedeemCoinsState(false);
    removeStored(coinsKey);
  }, [coinsKey]);

  // Compute live coupon discount (adjusts dynamically if cart subtotal changes)
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return calculateLegacyPromoDiscount(appliedCoupon, cartSubtotal);
  }, [appliedCoupon, cartSubtotal]);

  // Smart Coins calculations (1 coin = ₹0.05 official rate)
  const userCoins =
    typeof user?.smartCoins === "number"
      ? user.smartCoins
      : typeof user?.coins === "number"
        ? user.coins
        : typeof user?.availableCoins === "number"
          ? user.availableCoins
          : 0;
  const amountBeforeCoins = Math.max(0, cartSubtotal - couponDiscount + deliveryFee);
  const coinsToRedeem = getMaxRedeemableCoins(
    userCoins,
    amountBeforeCoins,
    legacyCheckoutSettings.coinValueInRupees,
  );
  const coinsRedeemed = redeemCoins ? coinsToRedeem : 0;
  const coinDiscount = redeemCoins
    ? convertCoinsToRupees(coinsToRedeem, legacyCheckoutSettings.coinValueInRupees)
    : 0;

  // Effective combined discounts bounded by subtotal
  const totalDiscounts = couponDiscount + coinDiscount;
  const finalTotal = Math.max(0, cartSubtotal - totalDiscounts + deliveryFee);

  // Total savings across product discount, coupon, and coins
  const totalSavings = cartTotalSavings + totalDiscounts;
  const totalSavingsPercent =
    cartTotalMrp > 0 ? Math.round((totalSavings / cartTotalMrp) * 100) : 0;

  return (
    <CartContext.Provider
      value={{
        items,
        isLoading,
        cartError,
        isGuestCartSyncing,
        guestCartSyncError,
        syncGuestCart,
        cartCount,
        cartTotalMrp,
        cartSubtotal,
        cartTotalSavings,
        totalSavings,
        totalSavingsPercent,
        appliedCoupon,
        couponDiscount,
        redeemCoins,
        coinsRedeemed,
        coinsToRedeem,
        coinDiscount,
        coinValueInRupees: legacyCheckoutSettings.coinValueInRupees,
        deliverySpeed,
        deliveryFee,
        deliverySettingsError,
        isExpressDeliveryAvailable,
        standardDeliveryFee,
        expressDeliveryFee,
        finalTotal,
        selectedAddressId,
        selectedSlotId,
        paymentMethod,
        selectedUpiId,
        setDeliverySpeed,
        setSelectedAddressId,
        setSelectedSlotId,
        setPaymentMethod,
        setSelectedUpiId,
        applyCoupon,
        removeCoupon,
        setRedeemCoins,
        resetDiscounts,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        refreshCart,
        revalidateCartItems,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
