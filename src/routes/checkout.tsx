import { useState, useEffect, useMemo } from "react";
import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { CheckoutProgressBar } from "../components/checkout/CheckoutProgressBar";
import { OrderBillSummary } from "../components/checkout/OrderBillSummary";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { addressService } from "../services/addressService";
import {
  settingsService,
  DEFAULT_DELIVERY_SETTINGS,
  DEFAULT_PAYMENT_SETTINGS,
  isOrderCutoffPassed,
  type StoreDeliverySettings,
  type StorePaymentSettings,
} from "../services/settingsService";
import { orderService } from "../services/orderService";
import { apiClient } from "../services/apiClient";
import type { Address, DeliverySlot } from "../types";
import { toast } from "sonner";
import { PhoneVerificationModal } from "../components/auth/PhoneVerificationModal";
import { findDeliveryLocation, getDeliveryAreaSuggestions } from "../lib/deliveryLocations";

/**
 * Safely normalizes and humanizes checkout errors so that internal Firestore
 * security rule exceptions, CEL null errors, or missing error objects do not
 * crash the UI with secondary exceptions or confusing technical traces.
 */
export function formatCheckoutError(err: unknown): string {
  if (err === null || err === undefined) {
    return "Order placement could not be completed. Your cart and selected address have been preserved.";
  }

  const rawMessage =
    err instanceof Error
      ? err.message
      : typeof err === "object" && err && "message" in err
      ? String((err as { message: unknown }).message)
      : String(err);

  const rawCode =
    typeof err === "object" && err && "code" in err
      ? String((err as { code: unknown }).code)
      : "";

  const status =
    typeof err === "object" && err && "status" in err
      ? Number((err as { status: unknown }).status)
      : 0;

  // Check for Firestore permission-denied, 403, or CEL runtime errors
  const isPermissionOrRulesError =
    rawCode === "permission-denied" ||
    status === 403 ||
    rawMessage.includes("permission-denied") ||
    rawMessage.includes("Permission denied") ||
    rawMessage.includes("PERMISSION_DENIED") ||
    rawMessage.includes("Null value error") ||
    rawMessage.includes("evaluation error at L");

  if (isPermissionOrRulesError) {
    return "Order placement is currently disabled in read-only mode. Your cart and selected delivery details have been safely preserved.";
  }

  // Network and connectivity failures
  if (
    rawMessage.includes("Failed to fetch") ||
    rawMessage.includes("fetch failed") ||
    rawMessage.includes("ECONNREFUSED") ||
    rawMessage.includes("network")
  ) {
    return "Unable to connect to the store service. Please verify your connection. Your cart has been preserved.";
  }

  // Clean application-level validation messages
  if (
    rawMessage &&
    !rawMessage.includes("GrpcConnection") &&
    !rawMessage.includes("INTERNAL ASSERTION") &&
    !rawMessage.includes("@firebase") &&
    rawMessage.length < 200
  ) {
    return rawMessage;
  }

  return "Order placement failed. Your cart has been preserved.";
}

export const Route = createFileRoute("/checkout")({
  validateSearch: (
    search: Record<string, unknown>
  ): {
    step?: 2 | 3 | undefined;
    newAddress?: boolean | undefined;
  } => {
    const raw = search["step"];
    let step: 2 | 3 = 2;
    if (raw === 3 || raw === "3" || raw === "payment") {
      step = 3;
    }
    return {
      step,
      newAddress: search["newAddress"] === true || search["newAddress"] === "true",
    };
  },
  head: () => ({
    meta: [
      { title: "Checkout — Sri Amman Smart Store" },
      { name: "description", content: "Complete your farm grocery order safely." },
    ],
  }),
  component: CheckoutPage,
});

export function CheckoutPage() {
  const searchParams = useSearch({ from: "/checkout" });
  const navigate = useNavigate();

  const {
    items,
    cartCount,
    cartSubtotal,
    cartTotalSavings,
    appliedCoupon,
    couponDiscount,
    redeemCoins,
    coinsRedeemed,
    coinsAvailable,
    coinDiscount,
    deliverySpeed,
    deliveryFee,
    deliverySettingsError,
    checkoutSettings,
    isExpressDeliveryAvailable,
    standardDeliveryFee,
    expressDeliveryFee,
    finalTotal,
    selectedAddressId,
    selectedSlotId,
    paymentMethod,
    selectedUpiId,
    isGuestCartSyncing,
    guestCartSyncError,
    syncGuestCart,
    setDeliverySpeed,
    setSelectedAddressId,
    setSelectedSlotId,
    setPaymentMethod,
    setSelectedUpiId,
    clearCart,
    resetDiscounts,
    revalidateCartItems,
  } = useCart();
  const { user, isLoading: authLoading, isResolvingIdentity, refreshUser } = useAuth();
  const { refreshNotifications } = useNotifications();

  const currentStep: 2 | 3 = searchParams.step === 3 ? 3 : 2;

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [deliverySlots, setDeliverySlots] = useState<DeliverySlot[]>([]);
  const [deliveryConfig, setDeliveryConfig] = useState<StoreDeliverySettings>(DEFAULT_DELIVERY_SETTINGS);
  const [paymentConfig, setPaymentConfig] = useState<StorePaymentSettings>(DEFAULT_PAYMENT_SETTINGS);
  const codAmountLimit = paymentConfig.maxCodAmount ?? DEFAULT_PAYMENT_SETTINGS.maxCodAmount;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Accordion and UI states for Step 3
  const [isItemsExpanded, setIsItemsExpanded] = useState(true);
  const [includeGstin, setIncludeGstin] = useState(false);
  const [gstinNumber, setGstinNumber] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiVerified, setUpiVerified] = useState(true);

  // New Address Modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showPhoneVerificationModal, setShowPhoneVerificationModal] = useState(false);
  const isPhoneVerified = Boolean(user?.phoneVerified);
  const [newTag, setNewTag] = useState<"Home" | "Work" | "Other">("Home");
  const [newName, setNewName] = useState(user?.name || "");
  const [newPhone, setNewPhone] = useState(user?.phone || "");
  const [newHouseNo, setNewHouseNo] = useState("");
  const [newStreet, setNewStreet] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newPincode, setNewPincode] = useState("");

  useEffect(() => {
    async function loadCheckoutData() {
      if (!user) {
        if (!authLoading && !isResolvingIdentity) {
          setLoading(false);
        }
        return;
      }
      try {
        const [addrList, slots, dConfig, pConfig] = await Promise.all([
          addressService.getAddresses(user.id),
          settingsService.getDeliverySlots(),
          settingsService.getDeliveryConfiguration(),
          settingsService.getPaymentConfiguration(),
        ]);
        setAddresses(addrList || []);
        if (dConfig) {
          setDeliveryConfig(dConfig);
          setNewCity(dConfig.serviceAreaDistrict);
        }
        if (pConfig) setPaymentConfig(pConfig);

        // Restore or initialize selected address
        if (selectedAddressId && addrList?.some((a) => a.id === selectedAddressId)) {
          // Keep current selected address
        } else {
          const defaultAddr = addrList?.find((a) => a.isDefault) || addrList?.[0];
          if (defaultAddr) setSelectedAddressId(defaultAddr.id);
        }

        setDeliverySlots(slots || []);
        if (
          slots?.length > 0 &&
          slots[0] &&
          !slots.some((slot) => slot.id === selectedSlotId)
        ) {
          setSelectedSlotId(slots[0].id);
        }
      } catch (err) {
        console.error("Failed to load checkout data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCheckoutData();
  }, [user, authLoading, isResolvingIdentity, selectedAddressId, selectedSlotId, setSelectedAddressId, setSelectedSlotId]);

  useEffect(() => {
    if (
      paymentMethod === "cod" &&
      (!paymentConfig.codEnabled || finalTotal > codAmountLimit)
    ) {
      setPaymentMethod("upi");
    }
  }, [paymentMethod, paymentConfig.codEnabled, codAmountLimit, finalTotal, setPaymentMethod]);

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId) || addresses[0] || null;
  }, [addresses, selectedAddressId]);

  const selectedSlot = useMemo(() => {
    if (deliverySpeed === "express") {
      return {
        id: "slot_exp",
        type: "express" as const,
        title: "Express 60-Min Instant Dispatch",
        subtitle: "Express delivery",
        charge: deliveryFee,
      };
    }
    return (
      deliverySlots.find((s) => s.id === selectedSlotId) ||
      deliverySlots[0] || {
        id: "slot_std_morning",
        type: "standard" as const,
        title: "Standard Morning (8:00 AM - 11:00 AM)",
        charge: deliveryFee,
      }
    );
  }, [deliverySlots, selectedSlotId, deliverySpeed, deliveryFee]);

  // Dynamic geofence and serviceability check using store configuration (50km)
  const geofenceStatus = useMemo(() => {
    if (!selectedAddress) {
      return {
        eligible: false,
        distanceKm: 0,
        maxRadiusKm: deliveryConfig.deliveryRadiusKm,
        storeName: deliveryConfig.storeName,
        storeAddress: deliveryConfig.storeAddress,
      };
    }
    return addressService.validateDeliveryServiceability(selectedAddress, deliveryConfig);
  }, [selectedAddress, deliveryConfig]);

  // Guard for navigating to Step 3
  const canGoToPayment = useMemo(() => {
    return selectedAddress !== null && geofenceStatus.eligible && items.length > 0 && isPhoneVerified;
  }, [selectedAddress, geofenceStatus.eligible, items.length, isPhoneVerified]);

  const handleOpenNewAddressModal = () => {
    if (!newName && user?.name) setNewName(user.name);
    if (!newPhone && user?.phone) setNewPhone(user.phone);
    if (!newCity) setNewCity(deliveryConfig.serviceAreaDistrict);
    setShowAddressModal(true);
  };

  const handleNewStreetChange = (value: string) => {
    setNewStreet(value);
    const location = findDeliveryLocation(value, deliveryConfig.deliveryZones);
    if (location) {
      setNewCity(location.city);
      setNewPincode(location.pincode);
    }
  };

  useEffect(() => {
    if (searchParams.newAddress) {
      handleOpenNewAddressModal();
    }
  }, [searchParams.newAddress, user]);

  const handleStepNavigation = (targetStep: 1 | 2 | 3) => {
    if (targetStep === 1) {
      navigate({ to: "/cart" });
      return;
    }

    if (targetStep === 2) {
      navigate({ to: "/checkout", search: { step: 2 } as any });
      return;
    }

    if (targetStep === 3) {
      if (!selectedAddress || addresses.length === 0) {
        handleOpenNewAddressModal();
        toast.info("Please add a delivery address to proceed.");
        return;
      }
      if (!geofenceStatus.eligible) {
        toast.error(
          geofenceStatus.reason ||
          `Selected address is outside our ${deliveryConfig.deliveryRadiusKm}km delivery zone (${geofenceStatus.distanceKm}km away)`
        );
        return;
      }
      if (!isPhoneVerified) {
        toast.info("Verify your mobile number to continue with checkout.");
        setShowPhoneVerificationModal(true);
        return;
      }
      navigate({ to: "/checkout", search: { step: 3 } as any });
    }
  };

  const handleContinueToPayment = () => {
    if (!selectedAddress || addresses.length === 0) {
      handleOpenNewAddressModal();
      toast.info("Please add a delivery address to proceed.");
      return;
    }
    if (cartSubtotal < checkoutSettings.minimumOrderAmount) {
      toast.error(
        `The minimum order amount is ₹${checkoutSettings.minimumOrderAmount}.`
      );
      return;
    }
    if (cartCount > checkoutSettings.maxItemsPerOrder) {
      toast.error(
        `An order can contain up to ${checkoutSettings.maxItemsPerOrder} items.`
      );
      return;
    }
    if (!geofenceStatus.eligible) {
      toast.error(
        geofenceStatus.reason ||
        `Selected address is ${geofenceStatus.distanceKm}km away. Deliveries are restricted within ${deliveryConfig.deliveryRadiusKm}km of our store.`
      );
      return;
    }
    if (!isPhoneVerified) {
      toast.info("Verify your mobile number to continue with checkout.");
      setShowPhoneVerificationModal(true);
      return;
    }
    navigate({ to: "/checkout", search: { step: 3 } as any });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseNo.trim() || !newStreet.trim()) {
      toast.error("Please fill in house number and street name");
      return;
    }
    try {
      const added = await addressService.addAddress({
        userId: user!.id,
        tag: newTag,
        name: newName.trim() || user!.name || "Customer",
        phone: newPhone.trim() || user!.phone || "",
        houseNo: newHouseNo.trim(),
        street: newStreet.trim(),
        landmark: newLandmark.trim(),
        city: newCity.trim(),
        pincode: newPincode.trim(),
        lat: 0,
        lng: 0,
        isDefault: true,
      });
      setAddresses((prev) => [added, ...prev]);
      setSelectedAddressId(added.id);
      setShowAddressModal(false);
      setNewHouseNo("");
      setNewStreet("");
      setNewLandmark("");
      toast.success("New delivery address saved!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save address");
    }
  };

  const handlePlaceOrder = async () => {
    if (isSubmitting) return;

    if (!user || authLoading || isResolvingIdentity) {
      toast.info("Sign in or create an account to continue checkout. Your cart is saved.");
      navigate({ to: "/login", search: { redirect: "/checkout" } as any });
      return;
    }

    if (isGuestCartSyncing || guestCartSyncError) {
      toast.error("Your cart must finish syncing before an order can be placed.");
      return;
    }

    if (!isPhoneVerified) {
      toast.info("Verify your mobile number to continue with checkout.");
      setShowPhoneVerificationModal(true);
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      navigate({ to: "/checkout", search: { step: 2 } as any });
      return;
    }

    if (!geofenceStatus.eligible) {
      toast.error(
        geofenceStatus.reason ||
        `Selected address is outside our ${deliveryConfig.deliveryRadiusKm}km delivery boundary (${geofenceStatus.distanceKm}km away).`
      );
      navigate({ to: "/checkout", search: { step: 2 } as any });
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      navigate({ to: "/shop" });
      return;
    }

    if (cartSubtotal < checkoutSettings.minimumOrderAmount) {
      toast.error(
        `The minimum order amount is ₹${checkoutSettings.minimumOrderAmount}.`
      );
      return;
    }
    if (cartCount > checkoutSettings.maxItemsPerOrder) {
      toast.error(
        `An order can contain up to ${checkoutSettings.maxItemsPerOrder} items.`
      );
      return;
    }
    if (isOrderCutoffPassed(checkoutSettings.orderCutoffTime)) {
      toast.error(
        `Today's order cutoff time (${checkoutSettings.orderCutoffTime}) has passed.`
      );
      return;
    }
    if (paymentMethod === "cod" && !paymentConfig.codEnabled) {
      toast.error("Cash on delivery is currently unavailable.");
      return;
    }
    if (paymentMethod === "cod" && finalTotal > codAmountLimit) {
      toast.error(
        `Cash on delivery is available for orders up to ₹${codAmountLimit}.`
      );
      return;
    }

    const placeOrderInternal = async (
      isPaidOnline = false,
      overrideMethod?: "online" | "cod" | "upi"
    ) => {
      const chosenMethod =
        overrideMethod ||
        (isPaidOnline
          ? "online"
          : paymentMethod === "cod"
          ? "cod"
          : paymentMethod === "upi"
          ? "upi"
          : "online");

      const order = await orderService.createOrder({
        userId: user!.id,
        customerName: selectedAddress.name || user!.name || "Customer",
        phone: user!.phone || selectedAddress.phone || "",
        address: selectedAddress,
        deliverySlot: selectedSlot as DeliverySlot,
        paymentMethod: chosenMethod,
        cartItems: items,
        subtotal: cartSubtotal,
        productSavings: cartTotalSavings,
        deliveryFee: deliveryFee,
        coinDiscount: coinDiscount,
        coinsRedeemed: coinsRedeemed,
        couponDiscount: couponDiscount,
        totalAmount: finalTotal,
      });

      if (!order || !order.orderId) {
        throw new Error("Order creation did not return a valid order identifier.");
      }

      // Clear customer's cart only after confirmed successful order creation
      await clearCart();
      resetDiscounts();
      await refreshNotifications();
      await refreshUser();
      toast.success(
        chosenMethod === "upi"
          ? `Order #${order.orderId} placed (Awaiting UPI Verification)!`
          : `Order #${order.orderId} placed successfully!`
      );
      navigate({
        to: "/orders",
        search: { placed: order.orderId } as any,
      });
    };

    setIsSubmitting(true);
    try {
      const latestItems = await revalidateCartItems();
      const unavailableItems = latestItems.filter(
        (item) => item.stock <= 0 || item.quantity > item.stock
      );
      if (unavailableItems.length > 0) {
        throw new Error(
          `Review unavailable or low-stock items before placing your order: ${unavailableItems.map((item) => item.name).join(", ")}.`
        );
      }
      const pricesChanged = latestItems.some((item, index) =>
        item.price !== items[index]?.price || item.mrp !== items[index]?.mrp
      );
      if (pricesChanged) {
        toast.info("Product prices changed. Your cart has been updated; review the new total and place your order again.");
        return;
      }

      if (paymentMethod === "cod") {
        await placeOrderInternal(false, "cod");
      } else if (paymentMethod === "upi") {
        await placeOrderInternal(false, "upi");
      } else {
        // Online Payment via Razorpay
        const razorpayKey = (import.meta.env["VITE_RAZORPAY_KEY_ID"] as string) || "";
        if (typeof window !== "undefined" && !(window as any).Razorpay && razorpayKey) {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.async = true;
          document.body.appendChild(script);
          await new Promise((res) => {
            script.onload = res;
            setTimeout(res, 2000);
          });
        }

        if (typeof window !== "undefined" && (window as any).Razorpay && razorpayKey) {
          const options = {
            key: razorpayKey,
            amount: Math.round(finalTotal * 100),
            currency: "INR",
            name: "Sri Amman Smart Store",
            description: `Order Payment (${items.length} items)`,
            handler: async function () {
              try {
                setIsSubmitting(true);
                await placeOrderInternal(true);
              } catch (err: unknown) {
                toast.error(formatCheckoutError(err));
              } finally {
                setIsSubmitting(false);
              }
            },
            prefill: {
              name: selectedAddress.name || user?.name || "",
              email: user?.email || "",
              contact: selectedAddress.phone || user?.phone || "",
            },
            theme: { color: "#005f3f" },
            modal: {
              ondismiss: function () {
                setIsSubmitting(false);
                toast.info("Payment cancelled.");
              },
            },
          };
          const rzp = new (window as any).Razorpay(options);
          rzp.on("payment.failed", function (response: any) {
            toast.error(response?.error?.description || "Payment failed. Please try again.");
            setIsSubmitting(false);
          });
          rzp.open();
          return;
        }

        // Direct placement fallback if Razorpay SDK not loaded in test/development
        await placeOrderInternal(true);
      }
    } catch (err: unknown) {
      const userMessage = formatCheckoutError(err);
      toast.error(userMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if ((authLoading || isResolvingIdentity) && !user) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1320px] mx-auto px-margin-desktop py-20 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-on-surface-variant font-medium">Preparing checkout...</p>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (user && isGuestCartSyncing) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1320px] mx-auto px-margin-desktop py-20 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-on-surface-variant font-medium">Syncing your saved cart with your account…</p>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (user && guestCartSyncError) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[800px] mx-auto px-margin-desktop py-16 text-center">
          <div role="alert" className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8">
            <span className="material-symbols-outlined mb-3 text-4xl text-amber-700">sync_problem</span>
            <h2 className="mb-2 text-xl font-bold">Your cart needs attention</h2>
            <p className="mb-6 text-sm text-on-surface-variant">{guestCartSyncError} Your guest cart is still saved on this device. Checkout will continue after the cart sync completes.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => void syncGuestCart()}
                disabled={isGuestCartSyncing}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {isGuestCartSyncing ? "Syncing cart…" : "Retry cart sync"}
              </button>
              <Link to="/cart" className="rounded-xl border border-outline-variant/30 bg-white px-5 py-2.5 text-sm font-bold text-on-surface">
                Review cart
              </Link>
            </div>
          </div>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (!user && !loading && !authLoading && !isResolvingIdentity) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1320px] mx-auto px-margin-desktop py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-3xl mx-auto mb-4">
            🔒
          </div>
          <h2 className="text-xl font-bold mb-2">Please Sign In to Complete Checkout</h2>
          <p className="text-xs text-on-surface-variant mb-6">
            Sign in or create an account to choose a delivery address and place your order. Your selected items will stay in your cart.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              search={{ redirect: "/checkout" } as any}
              className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container"
            >
              Sign In
            </Link>
            <Link
              to="/sign-up"
              search={{ redirect: "/checkout" } as any}
              className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-2.5 font-headline-sm text-xs font-bold text-primary"
            >
              Create Account
            </Link>
          </div>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (items.length === 0 && !loading) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1320px] mx-auto px-margin-desktop py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-3xl mx-auto mb-4">
            🛒
          </div>
          <h2 className="text-xl font-bold mb-2">No Items in Cart to Checkout</h2>
          <p className="text-xs text-on-surface-variant mb-6">
            Please add items to your cart before proceeding to checkout.
          </p>
          <Link
            to="/shop"
            className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md"
          >
            Go to Shop Catalog
          </Link>
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
          {/* Top 3-Step Checkout Progress Bar */}
          <div className="mb-8">
            <CheckoutProgressBar
              currentStep={currentStep}
              cartItemCount={cartCount}
              selectedAddressText={
                selectedAddress
                  ? `${selectedAddress.city}, ${selectedAddress.pincode}`
                  : "No address selected"
              }
              onStepClick={handleStepNavigation}
              canNavigateToStep={(s) => (s === 3 ? canGoToPayment : true)}
            />
          </div>

          {/* Desktop Two-Column Checkout Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Step 2 (Address & Slot) OR Step 3 (Payment & Order Review) */}
            <div className="lg:col-span-8 space-y-6">
              {currentStep === 2 ? (
                /* ================= STEP 2: ADDRESS & SLOT ================= */
                <>
                  {/* Mandatory Phone Verification Banner */}
                  {!isPhoneVerified && (
                    <div
                      data-testid="checkout-phone-verification-banner"
                      className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">verified_user</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-headline-sm text-sm font-extrabold text-amber-950">
                              Verify your mobile number to continue with checkout.
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-900">
                              REQUIRED
                            </span>
                          </div>
                          <p className="text-xs text-amber-900/80 mt-0.5">
                            Order updates, live doorstep dispatch, and delivery security require a verified contact number.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPhoneVerificationModal(true)}
                        className="font-headline-sm text-xs font-bold px-4 py-2 rounded-xl bg-[#005f3f] text-white hover:bg-[#004d32] transition-colors shrink-0 shadow-sm cursor-pointer"
                      >
                        Verify Mobile Number
                      </button>
                    </div>
                  )}

                  {/* Delivery Address Section */}
                  <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[22px]">
                          location_on
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="font-headline-sm text-base font-extrabold text-on-surface">
                              Delivery Address
                            </h2>
                            {selectedAddress && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary">
                                {selectedAddress.tag || "HOME"}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-on-surface-variant">
                            {selectedAddress ? (
                              <>
                                {deliveryConfig.deliveryZones.length > 0
                                  ? `${deliveryConfig.storeName} · ${geofenceStatus.eligible ? "inside service area" : "outside service area"}`
                                  : `Delivering from ${deliveryConfig.storeName} (${geofenceStatus.distanceKm} km)`}
                              </>
                            ) : (
                              deliveryConfig.deliveryZones.length > 0
                                ? `Service zones: ${deliveryConfig.deliveryZones.join(", ")}`
                                : `${deliveryConfig.storeName} · Service Radius: ${deliveryConfig.deliveryRadiusKm} KM`
                            )}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleOpenNewAddressModal}
                        className="text-primary hover:text-primary-container font-headline-sm text-xs font-bold flex items-center gap-1 cursor-pointer hover:underline"
                      >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        <span>Change / Add New</span>
                      </button>
                    </div>

                    {/* Address Cards List */}
                    <div className="space-y-3">
                      {addresses.length === 0 ? (
                        <div
                          data-testid="no-address-empty-state"
                          className="p-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 text-center flex flex-col items-center justify-center gap-3"
                        >
                          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-[24px]">
                              add_location_alt
                            </span>
                          </div>
                          <div>
                            <h3 className="font-headline-sm text-sm font-bold text-on-surface">
                              No Delivery Address Found
                            </h3>
                            <p className="text-xs text-on-surface-variant mt-1">
                              Please add your delivery address to proceed to payment.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                            <button
                              type="button"
                              onClick={handleOpenNewAddressModal}
                              className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[16px]">add</span>
                              <span>Add New Address</span>
                            </button>
                            <Link
                              to="/addresses"
                              search={{ redirect: "/checkout?step=2", action: "new" } as any}
                              className="bg-surface-container-low text-on-surface border border-outline-variant/30 hover:bg-surface-container px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                              <span>Saved Addresses Page</span>
                              <span className="material-symbols-outlined text-[14px]">
                                open_in_new
                              </span>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        addresses.map((addr) => {
                        const geo = addressService.validateDeliveryServiceability(addr, deliveryConfig);
                        const isSelected = selectedAddress?.id === addr.id;

                        return (
                          <div
                            key={addr.id}
                            data-testid={`address-card-${addr.id}`}
                            onClick={() => setSelectedAddressId(addr.id)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                              isSelected
                                ? "border-primary bg-primary/5 shadow-sm"
                                : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/40"
                            }`}
                          >
                            <input
                              type="radio"
                              name="selected_address"
                              checked={isSelected}
                              onChange={() => setSelectedAddressId(addr.id)}
                              className="mt-1 accent-primary cursor-pointer"
                            />

                            <div className="flex-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-headline-sm text-xs font-bold text-on-surface">
                                    {addr.name}
                                  </span>
                                  <span className="text-xs text-on-surface-variant font-medium">
                                    {addr.phone}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {addr.isDefault && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary">
                                      • Selected Default
                                    </span>
                                  )}
                                  {geo.eligible ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[12px]">
                                        check_circle
                                      </span>
                                      Within {deliveryConfig.deliveryRadiusKm} km zone
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/10 text-error flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[12px]">
                                        warning
                                      </span>
                                      Outside {deliveryConfig.deliveryRadiusKm} km ({geo.distanceKm} km)
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-xs text-on-surface-variant leading-relaxed">
                                #{addr.houseNo}, {addr.street}
                                {addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city} -{" "}
                                {addr.pincode}
                              </p>

                              <div className="flex items-center gap-4 mt-2 text-[10px] text-outline font-semibold">
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px] text-primary">
                                    verified
                                  </span>
                                  Standard Access Verified
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[13px] text-primary">
                                    elevator
                                  </span>
                                  Elevator Available
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }))}

                      {/* Clear Out-of-Zone Explanation Banner */}
                      {!geofenceStatus.eligible && selectedAddress && (
                        <div
                          data-testid="not-deliverable-banner"
                          className="p-4 rounded-2xl bg-error/10 border border-error/30 text-error flex items-start gap-3 mt-3 shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
                          <div>
                            <h4 className="font-headline-sm text-xs font-bold">Address Not Deliverable</h4>
                            <p className="text-[11px] mt-0.5 leading-relaxed text-error/90">
                              {geofenceStatus.reason ||
                                (deliveryConfig.deliveryZones.length > 0
                                  ? `Delivery is available in ${deliveryConfig.deliveryZones.join(", ")}. Please include your neighborhood in the address.`
                                  : `Delivery is unavailable outside ${deliveryConfig.deliveryRadiusKm} km of ${deliveryConfig.storeAddress}.`)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Delivery Speed & Slot Section */}
                  <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-[22px]">
                          bolt
                        </span>
                        <h3 className="font-headline-sm text-sm font-extrabold text-on-surface">
                          Delivery Speed & Slot
                        </h3>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-black uppercase tracking-wider">
                        {deliveryConfig.storeName}
                      </span>
                    </div>

                    <p className="mb-3 text-[11px] font-semibold text-on-surface-variant">
                      Orders for today's delivery must be placed by {checkoutSettings.orderCutoffTime}.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Express 60-Min */}
                      <div
                        onClick={() => {
                          if (!isExpressDeliveryAvailable) return;
                          setDeliverySpeed("express");
                          setSelectedSlotId("slot_exp");
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          deliverySpeed === "express"
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/40"
                        }`}
                      >
                        <input
                          type="radio"
                          id="slot_opt_express"
                          name="slot_selection"
                          checked={deliverySpeed === "express"}
                          disabled={!isExpressDeliveryAvailable}
                          onChange={() => {
                            setDeliverySpeed("express");
                            setSelectedSlotId("slot_exp");
                          }}
                          className="mt-1 accent-primary cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor="slot_opt_express"
                              className="font-headline-sm text-xs font-bold text-on-surface flex items-center gap-1 cursor-pointer"
                            >
                              <span>Express 60–Min</span>
                              <span className="text-secondary">⚡</span>
                            </label>
                            <span className="font-headline-sm text-xs font-extrabold text-on-surface">
                              {expressDeliveryFee > 0 ? `₹${expressDeliveryFee}` : "FREE"}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-on-surface-variant mt-1">
                            Arrival in 45–60 mins (Today)
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-outline-variant/15 text-[10px] text-outline">
                            <span>Rider Assigned from Store Hub</span>
                            <span className="px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                              Fastest
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Standard Delivery */}
                      <div
                        onClick={() => {
                          setDeliverySpeed("standard");
                          setSelectedSlotId(deliverySlots[0]?.id || "slot_std_morning");
                        }}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          deliverySpeed === "standard"
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/40"
                        }`}
                      >
                        <input
                          type="radio"
                          id="slot_opt_standard"
                          name="slot_selection"
                          checked={deliverySpeed === "standard"}
                          onChange={() => {
                            setDeliverySpeed("standard");
                            setSelectedSlotId(deliverySlots[0]?.id || "slot_std_morning");
                          }}
                          className="mt-1 accent-primary cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <label
                              htmlFor="slot_opt_standard"
                              className="font-headline-sm text-xs font-bold text-on-surface cursor-pointer"
                            >
                              Standard Delivery
                            </label>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary">
                              {standardDeliveryFee > 0 ? `₹${standardDeliveryFee}` : "FREE"}
                            </span>
                          </div>
                          <p className="text-[11px] font-semibold text-on-surface-variant mt-1">
                            Configured delivery window
                          </p>
                          {deliverySlots.length > 1 && (
                            <label className="mt-3 block text-[10px] font-bold text-on-surface-variant">
                              Delivery time
                              <select
                                value={
                                  deliverySlots.some((slot) => slot.id === selectedSlotId)
                                    ? selectedSlotId
                                    : deliverySlots[0]?.id
                                }
                                onClick={(event) => event.stopPropagation()}
                                onChange={(event) => setSelectedSlotId(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-outline-variant/30 bg-white px-2.5 py-2 text-xs font-semibold text-on-surface"
                              >
                                {deliverySlots.map((slot) => (
                                  <option key={slot.id} value={slot.id}>
                                    {slot.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                          {deliverySlots.length > 0 && (
                            <p className="mt-2 text-[10px] font-semibold text-primary">
                              Selected window: {selectedSlot.title}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2 pt-1 border-t border-outline-variant/15 text-[10px] text-outline">
                            <span>Direct Batch Farm Fulfillment</span>
                            <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant font-bold">
                              Eco Route
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 2 Bottom Navigation Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <Link
                      to="/cart"
                      className="px-5 py-2.5 rounded-2xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                      <span>Back to Cart</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleContinueToPayment}
                      className="px-6 py-3 rounded-2xl bg-primary text-white font-headline-sm text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-2 shadow-md cursor-pointer"
                    >
                      <span>Continue to Payment</span>
                      <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </button>
                  </div>
                </>
              ) : (
                /* ================= STEP 3: PAYMENT ================= */
                <>
                  {/* Mandatory Phone Verification Banner */}
                  {!isPhoneVerified && (
                    <div
                      data-testid="checkout-phone-verification-banner"
                      className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[22px]">verified_user</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-headline-sm text-sm font-extrabold text-amber-950">
                              Verify your mobile number to continue with checkout.
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-900">
                              REQUIRED
                            </span>
                          </div>
                          <p className="text-xs text-amber-900/80 mt-0.5">
                            Order updates, live doorstep dispatch, and delivery security require a verified contact number.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPhoneVerificationModal(true)}
                        className="font-headline-sm text-xs font-bold px-4 py-2 rounded-xl bg-[#005f3f] text-white hover:bg-[#004d32] transition-colors shrink-0 shadow-sm cursor-pointer"
                      >
                        Verify Mobile Number
                      </button>
                    </div>
                  )}

                  {/* Selected Address & Slot Review Banner */}
                  <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Address Review */}
                    <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/15">
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                          location_on
                        </span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-headline-sm text-xs font-bold text-on-surface">
                              Delivery Address
                            </span>
                            {selectedAddress && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-primary/10 text-primary">
                                {selectedAddress.tag || "HOME"}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-on-surface-variant mt-0.5 line-clamp-1">
                            {selectedAddress
                              ? `${selectedAddress.name} — #${selectedAddress.houseNo}, ${selectedAddress.street}, ${selectedAddress.city}`
                              : "No address selected. Please add or select an address."}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStepNavigation(2)}
                        className="text-primary hover:underline text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    {/* Slot Review */}
                    <div className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/15">
                      <div className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                          local_shipping
                        </span>
                        <div>
                          <span className="font-headline-sm text-xs font-bold text-on-surface block">
                            {selectedSlot.title}
                          </span>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">
                            {deliveryFee > 0 ? `Delivery Fee: ₹${deliveryFee}` : "Free Delivery"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStepNavigation(2)}
                        className="text-primary hover:underline text-[11px] font-bold shrink-0 cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                  </div>

                  {/* Payment Method Section (Screenshot 4) */}
                  <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[22px]">
                          account_balance_wallet
                        </span>
                        <h2 className="font-headline-sm text-base font-extrabold text-on-surface">
                          Payment Method
                        </h2>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        PCI DSS Validated
                      </span>
                    </div>

                    {/* 1. UPI Option */}
                    <div
                      onClick={() => setPaymentMethod("upi")}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        paymentMethod === "upi"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="payment_method_group"
                            checked={paymentMethod === "upi"}
                            onChange={() => setPaymentMethod("upi")}
                            className="accent-primary cursor-pointer"
                          />
                          <span className="font-headline-sm text-xs font-bold text-on-surface">
                            UPI (Instant 0% Fee)
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-secondary/15 text-secondary">
                            Recommended
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-bold text-outline">
                          <span>GPay</span>
                          <span>•</span>
                          <span>PhonePe</span>
                          <span>•</span>
                          <span>Paytm</span>
                        </div>
                      </div>

                      {paymentMethod === "upi" && (
                        <div className="mt-4 pt-3 border-t border-outline-variant/15 space-y-3.5">
                          <div className="p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-[10px] uppercase tracking-wider font-extrabold text-on-surface-variant block">
                                  Store Payee
                                </span>
                                <span className="font-headline-sm text-xs font-extrabold text-on-surface">
                                  {paymentConfig.merchantName}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] uppercase tracking-wider font-extrabold text-on-surface-variant block">
                                  Exact Amount
                                </span>
                                <span className="font-headline-sm text-sm font-extrabold text-primary">
                                  ₹{finalTotal.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>

                            {/* Merchant UPI ID & Copy Button */}
                            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-outline-variant/25">
                              <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-primary text-[20px]">
                                  qr_code_2
                                </span>
                                <div>
                                  <span className="text-[10px] text-outline font-bold block">
                                    Merchant UPI ID
                                  </span>
                                  <span className="font-mono text-xs font-black text-on-surface select-all">
                                    {paymentConfig.merchantUpiId}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (navigator?.clipboard?.writeText) {
                                    navigator.clipboard.writeText(paymentConfig.merchantUpiId);
                                    toast.success("Merchant UPI ID copied!");
                                  }
                                }}
                                className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                <span>Copy</span>
                              </button>
                            </div>

                            {/* Direct App Launch URI */}
                            <div className="flex items-center justify-between gap-2 pt-1">
                              <span className="text-[11px] text-on-surface-variant font-medium">
                                Pay using any installed UPI application
                              </span>
                              <a
                                href={`upi://pay?pa=${paymentConfig.merchantUpiId}&pn=${encodeURIComponent(paymentConfig.merchantName)}&am=${finalTotal}&cu=INR&tn=${encodeURIComponent(`Order by ${user?.name || "Customer"}`)}`}
                                className="px-3 py-1.5 rounded-lg bg-secondary/15 text-secondary font-bold text-xs hover:bg-secondary/25 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                                <span>Open UPI App</span>
                              </a>
                            </div>

                            {/* Verification status note */}
                            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-primary/5 text-primary text-[11px] leading-relaxed">
                              <span className="material-symbols-outlined text-[16px] shrink-0 mt-0.5">info</span>
                              <span>
                                Pay to the merchant UPI ID above, then click <strong>Place Order</strong> below. Your order will be placed with payment <strong>awaiting verification</strong>.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. Credit / Debit Cards Option */}
                    <div
                      onClick={() => setPaymentMethod("card")}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        paymentMethod === "card"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="payment_method_group"
                            checked={paymentMethod === "card"}
                            onChange={() => setPaymentMethod("card")}
                            className="accent-primary cursor-pointer"
                          />
                          <span className="font-headline-sm text-xs font-bold text-on-surface">
                            Credit / Debit Cards
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-outline">
                          Visa, Mastercard, RuPay
                        </span>
                      </div>

                      {paymentMethod === "card" && (
                        <div className="mt-4 pt-3 border-t border-outline-variant/15 space-y-3">
                          <div className="p-3.5 rounded-xl bg-surface border border-outline-variant/20 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 rounded bg-[#1a1f71] text-white font-black text-[10px] tracking-widest">
                                VISA
                              </span>
                              <div>
                                <span className="font-headline-sm text-xs font-bold text-on-surface block">
                                  Axis Bank Privilege •••• 4289
                                </span>
                                <span className="text-[10px] text-on-surface-variant font-medium">
                                  Expires 09/28 • {user?.name || "Cardholder"}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="password"
                                maxLength={3}
                                placeholder="CVV"
                                value={cardCvv}
                                onChange={(e) => setCardCvv(e.target.value)}
                                className="w-14 px-2.5 py-1.5 rounded-lg bg-surface-container text-xs font-bold text-center border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <span
                                className="material-symbols-outlined text-[15px] text-outline cursor-help"
                                title="3-digit security code on card back"
                              >
                                help
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toast.info("Add new card drawer will open")}
                            className="text-primary font-bold text-xs flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <span className="material-symbols-outlined text-[15px]">add</span>
                            <span>Add New Card</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* 3. Net Banking Option */}
                    <div
                      onClick={() => setPaymentMethod("netbanking")}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        paymentMethod === "netbanking"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="payment_method_group"
                            checked={paymentMethod === "netbanking"}
                            onChange={() => setPaymentMethod("netbanking")}
                            className="accent-primary cursor-pointer"
                          />
                          <span className="font-headline-sm text-xs font-bold text-on-surface">
                            Net Banking
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-outline">
                          HDFC • ICICI • SBI • Axis
                        </span>
                      </div>
                    </div>

                    {/* Smart Coins Redemption Applied Banner (Screenshot 4) */}
                    {coinDiscount > 0 && (
                      <div className="p-4 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-secondary text-[22px]">
                            monetization_on
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-headline-sm text-xs font-extrabold text-on-surface">
                                Smart Coins Redemption
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-secondary text-white">
                                APPLIED
                              </span>
                            </div>
                            <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">
                              {coinsRedeemed} Smart Coins redeemed for ₹{coinDiscount} instant
                              checkout saving • {coinsAvailable - coinsRedeemed} Smart Coins
                              Remaining
                            </p>
                          </div>
                        </div>
                        <span className="font-headline-sm text-sm font-extrabold text-secondary">
                          −₹{coinDiscount}
                        </span>
                      </div>
                    )}

                    {/* 4. Cash / Pay on Delivery Option */}
                    <div
                      onClick={() => {
                        if (!paymentConfig.codEnabled) {
                          toast.error("Cash on delivery is currently unavailable.");
                          return;
                        }
                        if (finalTotal > codAmountLimit) {
                          toast.error(
                            `Cash on delivery is available for orders up to ₹${codAmountLimit}.`
                          );
                          return;
                        }
                        setPaymentMethod("cod");
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                        paymentMethod === "cod"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="payment_method_group"
                            checked={paymentMethod === "cod"}
                            onChange={() => {
                              if (
                                paymentConfig.codEnabled &&
                                finalTotal <= codAmountLimit
                              ) {
                                setPaymentMethod("cod");
                              }
                            }}
                            className="accent-primary cursor-pointer"
                          />
                          <div>
                            <span className="font-headline-sm text-xs font-bold text-on-surface block">
                              Cash / Pay on Delivery (UPI at doorstep)
                            </span>
                            <span className="text-[10px] text-on-surface-variant">
                              Nominal ₹15 courier handling charge applies
                            </span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary">
                          {!paymentConfig.codEnabled
                            ? "Unavailable"
                            : `Up to ₹${codAmountLimit}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items Review Accordion (Screenshot 4 & 5) */}
                  <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm">
                    <div
                      onClick={() => setIsItemsExpanded(!isItemsExpanded)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-primary text-[22px]">
                          shopping_bag
                        </span>
                        <div>
                          <h3 className="font-headline-sm text-sm font-extrabold text-on-surface">
                            Order Items ({cartCount} Fresh Items)
                          </h3>
                          <p className="text-[11px] text-on-surface-variant">
                            Verified and reserved in store stock
                          </p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-outline transition-transform duration-200">
                        {isItemsExpanded ? "expand_less" : "expand_more"}
                      </span>
                    </div>

                    {/* Expanded Items Grid (Screenshot 5) */}
                    {isItemsExpanded && (
                      <div className="mt-4 pt-4 border-t border-outline-variant/15 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-2xl border border-outline-variant/15 flex items-center gap-3"
                          >
                            <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center p-1 border border-outline-variant/15 overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="max-w-full max-h-full object-contain"
                                loading="lazy"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="whitespace-normal break-words font-headline-sm text-xs font-bold text-on-surface">
                                {item.name}
                              </h4>
                              <p className="text-[10px] text-on-surface-variant">
                                {item.unitSize} {item.unit} • Qty: {item.quantity}
                              </p>
                              <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="font-price-card text-xs font-extrabold text-on-surface">
                                  ₹{item.price * item.quantity}
                                </span>
                                {item.mrp > item.price && (
                                  <span className="text-[10px] text-outline line-through">
                                    ₹{item.mrp * item.quantity}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* GSTIN Business Purchase Checkbox (Screenshot 5) */}
                  <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-4 shadow-sm flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="gstin_check"
                        checked={includeGstin}
                        onChange={(e) => setIncludeGstin(e.target.checked)}
                        className="mt-0.5 accent-primary cursor-pointer"
                      />
                      <div>
                        <label
                          htmlFor="gstin_check"
                          className="font-headline-sm text-xs font-bold text-on-surface cursor-pointer"
                        >
                          Include GSTIN for Business Purchase
                        </label>
                        <p className="text-[10px] text-on-surface-variant">
                          Claim input tax credit on corporate entity bills
                        </p>
                        {includeGstin && (
                          <div className="mt-2.5">
                            <input
                              type="text"
                              value={gstinNumber}
                              onChange={(e) => setGstinNumber(e.target.value.toUpperCase())}
                              placeholder="Enter 15-digit GSTIN (e.g. 33AAAAA0000A1Z5)"
                              className="px-3 py-1.5 rounded-xl bg-surface text-xs font-bold border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary uppercase w-full max-w-sm"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-outline text-[20px]">
                      receipt_long
                    </span>
                  </div>

                  {/* Step 3 Bottom Navigation Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => handleStepNavigation(2)}
                      className="px-5 py-2.5 rounded-2xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                      <span>Back to Address & Slot</span>
                    </button>

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      disabled={isSubmitting}
                      className="px-7 py-3.5 rounded-2xl bg-primary text-white font-headline-sm text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95"
                    >
                      {isSubmitting ? (
                        <span>Processing Order...</span>
                      ) : (
                        <>
                          <span>
                            {paymentMethod === "upi"
                              ? `Place Order (Awaiting UPI ₹${finalTotal.toLocaleString("en-IN")})`
                              : paymentMethod === "cod"
                              ? "Place Order (Cash on Delivery)"
                              : `Pay ₹${finalTotal.toLocaleString("en-IN")} & Place Order`}
                          </span>
                          <span className="material-symbols-outlined text-[16px]">
                            arrow_forward
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT COLUMN: Order Summary / Bill Summary */}
            <div className="lg:col-span-4 sticky top-[190px]">
              {cartSubtotal < checkoutSettings.minimumOrderAmount && (
                <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                  Minimum order: ₹{checkoutSettings.minimumOrderAmount}.
                  Add ₹{Math.ceil(checkoutSettings.minimumOrderAmount - cartSubtotal)} more to continue.
                </p>
              )}
              {cartCount > checkoutSettings.maxItemsPerOrder && (
                <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                  Orders are limited to {checkoutSettings.maxItemsPerOrder} items. Remove some items to continue.
                </p>
              )}
              {isOrderCutoffPassed(checkoutSettings.orderCutoffTime) && (
                <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
                  Today's order cutoff ({checkoutSettings.orderCutoffTime}) has passed.
                </p>
              )}
              <OrderBillSummary
                mode="checkout"
                ctaText={
                  currentStep === 2
                    ? "Continue to Payment"
                    : `Pay ₹${finalTotal.toLocaleString("en-IN")} & Place Order`
                }
                onCtaClick={
                  currentStep === 2 ? handleContinueToPayment : handlePlaceOrder
                }
                isSubmitting={isSubmitting}
                disabled={
                  currentStep === 2
                    ? items.length === 0 || isSubmitting
                    : !canGoToPayment ||
                      isSubmitting ||
                      cartSubtotal < checkoutSettings.minimumOrderAmount ||
                      cartCount > checkoutSettings.maxItemsPerOrder ||
                      isOrderCutoffPassed(checkoutSettings.orderCutoffTime)
                }
              />
            </div>
          </div>
        </div>

        {/* Modal: Add New Address */}
        {showAddressModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/15">
                <h3 className="font-headline-sm text-base font-extrabold text-on-surface">
                  Add New Delivery Address
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddNewAddress} className="space-y-4">
                {/* Quick Auto-Detect / Simulation helper for local store hub */}
                <div className="p-2.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <span className="material-symbols-outlined text-[18px]">my_location</span>
                    <span>Store Delivery Zone</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNewHouseNo((prev) => prev || "42/B");
                      const firstZone = deliveryConfig.deliveryZones[0];
                      setNewStreet((prev) => prev || firstZone || "");
                      setNewLandmark((prev) => prev || "");
                      const location = firstZone
                        ? findDeliveryLocation(firstZone, deliveryConfig.deliveryZones)
                        : undefined;
                      setNewCity(location?.city || deliveryConfig.serviceAreaDistrict);
                      setNewPincode(location?.pincode || "");
                      toast.info(
                        firstZone
                          ? `Auto-filled inside the ${firstZone} delivery zone.`
                          : "Enter an address inside the service area."
                      );
                    }}
                    className="px-2.5 py-1 bg-primary text-white font-bold rounded-lg text-[11px] hover:bg-primary-container transition-colors cursor-pointer"
                  >
                    Fill Service Zone
                  </button>
                </div>

                {/* Tag Selection */}
                <div className="flex gap-2">
                  {(["Home", "Work", "Other"] as const).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewTag(tag)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        newTag === tag
                          ? "bg-primary text-white border-primary"
                          : "bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:border-primary"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                      Recipient Name
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="+91..."
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                    House / Flat / Door No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={newHouseNo}
                    onChange={(e) => setNewHouseNo(e.target.value)}
                    placeholder="e.g. Plot 14, Door 2B"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                    Street & Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => handleNewStreetChange(e.target.value)}
                    list="checkout-delivery-areas"
                    placeholder="Type or choose a nearby area"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <datalist id="checkout-delivery-areas">
                    {getDeliveryAreaSuggestions(deliveryConfig.deliveryZones).map((area) => (
                      <option key={area} value={area} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={newLandmark}
                    onChange={(e) => setNewLandmark(e.target.value)}
                    placeholder="e.g. Near Amman Kovil"
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      placeholder={deliveryConfig.serviceAreaDistrict}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-on-surface-variant block mb-1">
                      PIN Code
                    </label>
                    <input
                      type="text"
                      value={newPincode}
                      onChange={(e) => setNewPincode(e.target.value)}
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Suggested from area"
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-outline hover:bg-surface-container transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-primary text-white font-headline-sm text-xs font-bold hover:bg-primary-container transition-colors shadow-md cursor-pointer"
                  >
                    Save Address
                  </button>
                </div>

                <div className="text-center pt-1 border-t border-outline-variant/10">
                  <Link
                    to="/addresses"
                    search={{ redirect: "/checkout?step=2", action: "new" } as any}
                    className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>Manage all saved addresses in Address Book</span>
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </Link>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Reusable Phone Verification Modal */}
        <PhoneVerificationModal
          isOpen={showPhoneVerificationModal}
          onClose={() => setShowPhoneVerificationModal(false)}
          onSuccess={(verifiedPhone) => {
            toast.success(`Mobile number ${verifiedPhone} verified! You can now proceed.`);
          }}
          initialPhone={user?.phone || selectedAddress?.phone || ""}
        />
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
