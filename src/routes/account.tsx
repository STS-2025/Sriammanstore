import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { orderService } from "../services/orderService";
import { addressService } from "../services/addressService";
import { wishlistService } from "../services/wishlistService";
import { coinService, convertCoinsToRupees } from "../services/coinService";
import { notificationService } from "../services/notificationService";
import { settingsService } from "../services/settingsService";
import type { Address, Order, StoreInfo } from "../types";
import { toast } from "sonner";
import { PhoneVerificationModal } from "../components/auth/PhoneVerificationModal";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Profile & Account Overview — Sri Amman Smart Store" },
      { name: "description", content: "Manage your personal profile, addresses, Smart Coins, and orders." },
    ],
  }),
  component: AccountPage,
});

export function AccountPage() {
  const { user, isLoading: authLoading, isResolvingIdentity, logout, updateProfile, refreshUser } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [showPhoneVerificationModal, setShowPhoneVerificationModal] = useState(false);

  // Core Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [wishlistCount, setWishlistCount] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Personal Information Modal State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLanguage, setEditLanguage] = useState("Tamil / English (தமிழ் / English)");
  const [editBirthday, setEditBirthday] = useState("");
  const [editGroceryRhythm, setEditGroceryRhythm] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Address Modal State (Add & Edit)
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrTag, setAddrTag] = useState<"Home" | "Work" | "Other">("Home");
  const [addrName, setAddrName] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [addrHouseNo, setAddrHouseNo] = useState("");
  const [addrStreet, setAddrStreet] = useState("");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [addrCity, setAddrCity] = useState("Gobichettipalayam");
  const [addrPincode, setAddrPincode] = useState("638454");
  const [addrLat, setAddrLat] = useState(11.4598);
  const [addrLng, setAddrLng] = useState(77.334);
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Privacy & Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [promoOffers, setPromoOffers] = useState(true);
  const [coinsBalance, setCoinsBalance] = useState<number | null>(null);

  // Load Customer Account Data (Scoped strictly to authenticated user)
  const loadAccountData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [userOrders, userAddresses, userWishlist, userNotifications, store, userCoins] =
        await Promise.allSettled([
          orderService.getOrders(user.id, user.legacySassId),
          addressService.getAddresses(user.id, user.legacySassId),
          wishlistService.getWishlistProducts(undefined, user.id),
          notificationService.getNotifications(user.id, user.legacySassId),
          settingsService.getStoreInfo(),
          coinService.getUserCoins(user.id, user.legacySassId),
        ]);

      if (userOrders.status === "fulfilled") {
        setOrders(userOrders.value || []);
        setOrdersError(null);
      } else {
        const msg =
          userOrders.reason instanceof Error
            ? userOrders.reason.message
            : "Failed to load orders from store database";
        setOrdersError(msg);
        setOrders([]);
      }
      if (userAddresses.status === "fulfilled") setAddresses(userAddresses.value || []);
      if (userWishlist.status === "fulfilled") setWishlistCount(userWishlist.value?.length || 0);
      if (userNotifications.status === "fulfilled") {
        const unread = (userNotifications.value || []).filter((n) => !n.read).length;
        setUnreadNotificationsCount(unread);
      }
      if (store.status === "fulfilled") setStoreInfo(store.value);
      if (userCoins.status === "fulfilled" && typeof userCoins.value === "number") {
        setCoinsBalance(userCoins.value);
      }
    } catch (err) {
      console.error("Failed to load account data:", err);
      toast.error("Could not load full profile data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadAccountData();
    } else if (!authLoading && !isResolvingIdentity) {
      setLoading(false);
    }
  }, [user?.id, user?.legacySassId, authLoading, isResolvingIdentity]);

  // Derived Account Metrics
  const effectiveCoins = coinsBalance ?? user?.smartCoins ?? user?.coins ?? 0;

  const activeOrdersCount = useMemo(() => {
    return orders.filter((o) =>
      ["pending", "processing", "packed", "in transit"].includes(o.status)
    ).length;
  }, [orders]);

  const lifetimeSpend = useMemo(() => {
    return orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.pricingSummary?.totalAmount || 0), 0);
  }, [orders]);

  // VIP Status Calculation: strictly binary rule (>= ₹5,000 delivered orders in rolling 30 days)
  const vipStatus = useMemo(() => {
    return coinService.calculateVIPStatus(orders, 5000);
  }, [orders]);

  const isUserVip = useMemo(() => {
    return vipStatus.isVIP || user?.isVIP || false;
  }, [vipStatus, user]);

  // Authenticated Customer SASS ID (Primary: user.id, Fallback: user.userId, Neutral: Not available)
  const customerSassId = user?.id || user?.userId || "Not available";

  const memberSinceFormatted = useMemo(() => {
    if (!user?.createdAt) return "Jan 2024";
    try {
      const date = new Date(user.createdAt);
      return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    } catch {
      return "Jan 2024";
    }
  }, [user?.createdAt]);

  const addressesGeofenceVerified = useMemo(() => {
    if (addresses.length === 0) return true;
    return addresses.every((addr) => addressService.validateGeofence(addr.lat, addr.lng).eligible);
  }, [addresses]);

  const addressTagsSummary = useMemo(() => {
    if (addresses.length === 0) return "No locations configured";
    const tags = Array.from(new Set(addresses.map((a) => a.tag)));
    return tags.join(" & ") + " configured";
  }, [addresses]);

  // Logout Handler
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out of your account?")) {
      logout();
      toast.info("Logged out successfully");
      navigate({ to: "/login" as any });
    }
  };

  // Open Edit Profile Modal
  const handleOpenEditProfile = () => {
    if (!user) return;
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setEditLanguage(user.preferredLanguage || "Tamil / English (தமிழ் / English)");
    setEditBirthday(user.dob || user.birthday || "");
    setEditGroceryRhythm(user.groceryRhythm || "Every Saturday Morning (4 Members)");
    setShowEditProfileModal(true);
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!editName.trim() || editName.trim().length < 2) {
      toast.error("Please enter a valid full name (minimum 2 characters)");
      return;
    }

    if (editEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSavingProfile(true);
    try {
      const trimmedBirthday = editBirthday.trim();
      const trimmedGroceryRhythm = editGroceryRhythm.trim();
      await updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        preferredLanguage: editLanguage,
        ...(trimmedBirthday ? { dob: trimmedBirthday } : {}),
        ...(trimmedGroceryRhythm ? { groceryRhythm: trimmedGroceryRhythm } : {}),
      });
      setShowEditProfileModal(false);
      toast.success("Profile information updated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save profile changes");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Open Add Address Modal
  const handleOpenAddAddress = () => {
    if (!user) return;
    setEditingAddressId(null);
    setAddrTag("Home");
    setAddrName(user.name || "");
    setAddrPhone(user.phone || "");
    setAddrHouseNo("");
    setAddrStreet("");
    setAddrLandmark("");
    setAddrCity("Gobichettipalayam");
    setAddrPincode("638454");
    setAddrLat(11.4598);
    setAddrLng(77.334);
    setAddrIsDefault(addresses.length === 0);
    setShowAddressModal(true);
  };

  // Open Edit Address Modal
  const handleOpenEditAddress = (addr: Address) => {
    setEditingAddressId(addr.id);
    setAddrTag(addr.tag);
    setAddrName(addr.name);
    setAddrPhone(addr.phone);
    setAddrHouseNo(addr.houseNo);
    setAddrStreet(addr.street);
    setAddrLandmark(addr.landmark || "");
    setAddrCity(addr.city);
    setAddrPincode(addr.pincode);
    setAddrLat(addr.lat);
    setAddrLng(addr.lng);
    setAddrIsDefault(addr.isDefault);
    setShowAddressModal(true);
  };

  // Save Address Handler (Add or Update)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!addrName.trim()) {
      toast.error("Please enter recipient name");
      return;
    }
    if (!addrPhone.trim() || addrPhone.replace(/\D/g, "").length < 10) {
      toast.error("Please enter a valid 10-digit contact phone number");
      return;
    }
    if (!addrHouseNo.trim()) {
      toast.error("Please enter house, flat, or door number");
      return;
    }
    if (!addrStreet.trim()) {
      toast.error("Please enter street address or locality");
      return;
    }
    if (!addrPincode.trim() || addrPincode.trim().length !== 6) {
      toast.error("Please enter a valid 6-digit pincode");
      return;
    }

    setIsSavingAddress(true);
    try {
      const trimmedLandmark = addrLandmark.trim();
      if (editingAddressId) {
        await addressService.updateAddress(editingAddressId, {
          userId: user.id,
          tag: addrTag,
          name: addrName.trim(),
          phone: addrPhone.trim(),
          houseNo: addrHouseNo.trim(),
          street: addrStreet.trim(),
          ...(trimmedLandmark ? { landmark: trimmedLandmark } : {}),
          city: addrCity.trim(),
          pincode: addrPincode.trim(),
          lat: addrLat,
          lng: addrLng,
          isDefault: addrIsDefault,
        });
        toast.success("Delivery address updated successfully!");
      } else {
        await addressService.addAddress({
          userId: user.id,
          tag: addrTag,
          name: addrName.trim(),
          phone: addrPhone.trim(),
          houseNo: addrHouseNo.trim(),
          street: addrStreet.trim(),
          ...(trimmedLandmark ? { landmark: trimmedLandmark } : {}),
          city: addrCity.trim(),
          pincode: addrPincode.trim(),
          lat: addrLat,
          lng: addrLng,
          isDefault: addrIsDefault || addresses.length === 0,
        });
        toast.success("New delivery address added successfully!");
      }

      setShowAddressModal(false);
      await loadAccountData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save address");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Set Default Address Handler
  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user) return;
    try {
      await addressService.setDefaultAddress(addressId, user.id);
      toast.success("Default delivery address updated");
      await loadAccountData();
    } catch (err: any) {
      toast.error(err.message || "Failed to set default address");
    }
  };

  // Delete Address Handler
  const handleDeleteAddress = async (address: Address) => {
    if (!user) return;

    if (addresses.length <= 1) {
      toast.error("You must have at least one saved delivery address.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to remove address "${address.tag} (${address.houseNo}, ${address.street})"?`
      )
    ) {
      return;
    }

    try {
      await addressService.deleteAddress(address.id, user.id);
      // If the removed address was default, make the first remaining address default
      if (address.isDefault) {
        const remaining = addresses.filter((a) => a.id !== address.id);
        if (remaining.length > 0 && remaining[0]) {
          await addressService.setDefaultAddress(remaining[0].id, user.id);
        }
      }
      toast.info("Address removed");
      await loadAccountData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove address");
    }
  };

  // Simulate GPS coordinates mapping to Gobichettipalayam Hub
  const handleSimulateGPS = () => {
    setAddrLat(11.4598);
    setAddrLng(77.334);
    setAddrCity("Gobichettipalayam");
    setAddrPincode("638454");
    setAddrStreet("Kasipalayam High Road");
    toast.info("GPS coordinates mapped to Gobichettipalayam Hub (Distance ~150m)");
  };

  // Loading & Session Restoration View
  if ((authLoading || isResolvingIdentity) && !user) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-[172px] max-w-[800px] mx-auto px-4 py-20 text-center">
          <div className="w-10 h-10 border-4 border-[#005f3f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-on-surface-variant font-medium">
            Loading your customer account...
          </p>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  // Unauthenticated Fallback View
  if (!user && !loading && !authLoading && !isResolvingIdentity) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-[172px] max-w-[800px] mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center text-4xl mx-auto mb-5 shadow-inner">
            👤
          </div>
          <h2 className="font-headline-lg text-2xl font-extrabold text-on-surface mb-2">
            Please Sign In to View Your Account
          </h2>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto mb-8 leading-relaxed">
            Sign in with your registered phone number or email to view your orders, live deliveries,
            Smart Coins, and saved addresses.
          </p>
          <Link
            to="/login"
            search={{ redirect: "/account" } as any}
            className="inline-flex items-center gap-2 bg-[#005f3f] text-white px-7 py-3.5 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-[#004d32] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">lock_open</span>
            <span>Sign In with Phone OTP</span>
          </Link>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="bg-[#f8faf8] font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-[172px] min-h-[calc(100vh-172px)] pb-20">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumbs & Store Sync Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <nav className="flex items-center gap-2 text-xs text-on-surface-variant">
              <Link to="/" className="hover:text-primary transition-colors">
                Home
              </Link>
              <span className="text-outline-variant/60">›</span>
              <span className="text-on-surface-variant">Account Dashboard</span>
              <span className="text-outline-variant/60">›</span>
              <span className="font-bold text-on-surface">Profile Overview</span>
            </nav>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-bold text-emerald-800 self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>
                Synced with {storeInfo?.locationName?.split(",")[0] || "Gobichettipalayam"} Store Outlet
              </span>
            </div>
          </div>

          {/* Main Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ============================================================== */}
            {/* LEFT SIDEBAR                                                   */}
            {/* ============================================================== */}
            <div className="lg:col-span-4 xl:col-span-4 space-y-6">
              {/* Profile Card Summary */}
              <div className="bg-white rounded-3xl p-6 border border-outline-variant/20 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 font-black text-2xl flex items-center justify-center ring-4 ring-emerald-50 overflow-hidden shadow-inner">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      ) : user?.name ? (
                        user.name.charAt(0).toUpperCase()
                      ) : (
                        "👤"
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenEditProfile}
                      title="Edit Profile"
                      className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#005f3f] text-white flex items-center justify-center text-[12px] shadow-sm hover:scale-105 transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">photo_camera</span>
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-headline-lg text-lg font-black text-on-surface truncate">
                        {user?.name || "Customer"}
                      </h2>
                      {isUserVip && (
                        <span className="inline-flex items-center gap-1 bg-[#fea619] text-[#2a1700] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          👑 VIP MEMBER
                        </span>
                      )}
                    </div>
                    {/* Customer ID Badge */}
                    <div className="mt-1 mb-1">
                      <span
                        data-testid="sidebar-customer-id-badge"
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#005f3f] border border-emerald-200/70 font-mono text-[11px] font-bold tracking-wide"
                      >
                        Customer ID: {customerSassId}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-on-surface-variant font-medium truncate">
                        {user?.phone || "No phone linked"}
                      </span>
                      {user?.phoneVerified ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800">
                            Unverified
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowPhoneVerificationModal(true)}
                            className="text-[11px] font-bold text-[#005f3f] underline hover:text-[#004d32] cursor-pointer"
                          >
                            Verify
                          </button>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant/80 truncate">
                      {user?.email || "No email linked"}
                    </p>
                  </div>
                </div>

                {/* Smart Coin Balance & Passbook Shortcut */}
                <div className="mt-5 bg-gradient-to-r from-amber-50 to-[#fff8ea] border border-amber-200/60 p-3.5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🪙</span>
                    <div>
                      <div className="font-headline-sm text-xs font-black text-on-surface">
                        {effectiveCoins} Smart Coins
                      </div>
                      <div className="text-[10px] text-on-surface-variant font-semibold">
                        ₹{convertCoinsToRupees(effectiveCoins).toFixed(2)} redeemable value
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/rewards"
                    className="text-xs font-black text-[#005f3f] hover:underline px-3 py-1.5 rounded-xl bg-white/80 shadow-xs border border-amber-200/50"
                  >
                    Passbook
                  </Link>
                </div>
              </div>

              {/* Sidebar Navigation Links List */}
              <div className="bg-white rounded-3xl p-3 border border-outline-variant/20 shadow-sm space-y-1">
                {/* 1. Profile Information (Active) */}
                <div className="bg-[#005f3f] text-white px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                    <span className="font-headline-sm text-xs font-bold">Profile Information</span>
                  </div>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </div>

                {/* 2. My Orders & Tracking */}
                <Link
                  to="/orders"
                  className="px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]">
                      receipt_long
                    </span>
                    <span className="font-headline-sm text-xs font-bold">My Orders & Tracking</span>
                  </div>
                  {ordersError ? (
                    <span className="bg-red-50 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      <span>Sync Issue</span>
                    </span>
                  ) : activeOrdersCount > 0 ? (
                    <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {activeOrdersCount} Active
                    </span>
                  ) : (
                    <span className="text-xs text-on-surface-variant/70 font-medium">
                      {orders.length}
                    </span>
                  )}
                </Link>

                {/* 3. Saved Addresses */}
                <a
                  href="#saved-addresses"
                  className="px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]">
                      location_on
                    </span>
                    <span className="font-headline-sm text-xs font-bold">Saved Addresses</span>
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {addresses.length} Saved
                  </span>
                </a>

                {/* 4. Wishlist & Collections */}
                <Link
                  to="/wishlist"
                  className="px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]">
                      favorite_border
                    </span>
                    <span className="font-headline-sm text-xs font-bold">
                      Wishlist & Collections
                    </span>
                  </div>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {wishlistCount} Items
                  </span>
                </Link>

                {/* 5. Smart Coins & Rewards */}
                <Link
                  to="/rewards"
                  className="px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-amber-600 text-[20px]">
                      monetization_on
                    </span>
                    <span className="font-headline-sm text-xs font-bold">
                      Smart Coins & Rewards
                    </span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    {effectiveCoins} Avail
                  </span>
                </Link>

                {/* 6. VIP Privilege Pass */}
                <Link
                  to="/rewards"
                  className="px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#fea619] text-[20px]">
                      workspace_premium
                    </span>
                    <span className="font-headline-sm text-xs font-bold">VIP Privilege Pass</span>
                  </div>
                  <span className="text-xs font-bold text-amber-800">
                    {isUserVip ? "Active Pass" : "Spend ₹5k"}
                  </span>
                </Link>

                {/* 7. Refer & Earn */}
                <Link
                  to="/refer"
                  className="px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]">
                      share
                    </span>
                    <span className="font-headline-sm text-xs font-bold">Refer & Earn</span>
                  </div>
                  <span className="text-xs font-bold text-amber-700">Earn ₹100</span>
                </Link>

                {/* 8. Notifications */}
                <Link
                  to="/notifications"
                  className="px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]">
                      notifications
                    </span>
                    <span className="font-headline-sm text-xs font-bold">Notifications</span>
                  </div>
                  {unreadNotificationsCount > 0 ? (
                    <span className="bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {unreadNotificationsCount} Unread
                    </span>
                  ) : null}
                </Link>

                <div className="my-2 border-t border-outline-variant/15"></div>

                {/* 9. Account Settings & Privacy */}
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(true)}
                  className="w-full px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      shield
                    </span>
                    <span className="font-headline-sm text-xs font-bold">
                      Account Settings & Privacy
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-outline-variant">
                    chevron_right
                  </span>
                </button>

                {/* 10. Help, Support & FAQ */}
                <Link
                  to="/help"
                  className="px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]">
                      help_outline
                    </span>
                    <span className="font-headline-sm text-xs font-bold">Help, Support & FAQ</span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-outline-variant">
                    chevron_right
                  </span>
                </Link>

                {/* 11. Store Policies & Legal */}
                <Link
                  to="/policies"
                  className="px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]">
                      policy
                    </span>
                    <span className="font-headline-sm text-xs font-bold">
                      Store Policies & Legal
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-outline-variant">
                    chevron_right
                  </span>
                </Link>

                {/* 12. Log Out */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-2xl flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left mt-1"
                >
                  <span className="material-symbols-outlined text-[20px]">logout</span>
                  <span className="font-headline-sm text-xs font-bold">Log Out</span>
                </button>
              </div>

              {/* Support & Store Contact Card */}
              <div className="bg-emerald-50/70 border border-emerald-200/60 p-4 rounded-3xl flex items-start gap-3">
                <span className="material-symbols-outlined text-[#005f3f] text-[24px] shrink-0 mt-0.5">
                  verified_user
                </span>
                <div>
                  <div className="font-headline-sm text-xs font-black text-emerald-950">
                    Need instant billing help?
                  </div>
                  <p className="text-[11px] text-emerald-900 mt-0.5 leading-relaxed">
                    Call store directly at{" "}
                    <a
                      href={`tel:${storeInfo?.phone || "+919840012345"}`}
                      className="font-black text-[#005f3f] underline"
                    >
                      {storeInfo?.phone || "+91 98400 12345"}
                    </a>
                  </p>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* RIGHT MAIN CONTENT                                             */}
            {/* ============================================================== */}
            <div className="lg:col-span-8 xl:col-span-8 space-y-8">
              {/* Heading & Overview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/15 pb-4">
                <div>
                  <h1 className="font-headline-lg text-2xl sm:text-3xl font-black text-on-surface">
                    Profile & Account Overview
                  </h1>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Manage your personal information, address book, and shopping preferences
                  </p>
                </div>
                <div className="text-xs text-on-surface-variant font-medium">
                  Member since <span className="font-bold text-on-surface">{memberSinceFormatted}</span>
                </div>
              </div>

              {/* 4 Summary Metric Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Metric 1: Total Orders */}
                <div className="bg-white p-5 rounded-3xl border border-outline-variant/20 shadow-xs relative flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface-variant">Total Orders</span>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#005f3f] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-headline-lg text-2xl font-black text-on-surface">
                      {ordersError ? "—" : orders.length}
                    </div>
                    {ordersError ? (
                      <div className="text-[11px] text-red-600 font-medium mt-1 truncate" title={ordersError}>
                        Sync error
                      </div>
                    ) : (
                      <div className="text-[11px] text-on-surface-variant mt-1 font-medium">
                        Lifetime <span className="font-bold text-emerald-800">₹{lifetimeSpend.toLocaleString("en-IN")}</span> spent
                      </div>
                    )}
                  </div>
                  <div className="mt-3 w-full h-1 bg-emerald-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#005f3f] rounded-full w-2/3"></div>
                  </div>
                </div>

                {/* Metric 2: Smart Coins */}
                <div className="bg-white p-5 rounded-3xl border border-outline-variant/20 shadow-xs relative flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface-variant">Smart Coins</span>
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">monetization_on</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-headline-lg text-2xl font-black text-on-surface">
                      {effectiveCoins}
                    </div>
                    <div className="text-[11px] text-amber-800 font-bold mt-1">
                      ₹{convertCoinsToRupees(effectiveCoins).toFixed(2)} instant discount
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-on-surface-variant/80 font-medium">
                    1 Coin = ₹0.05 cash discount
                  </div>
                </div>

                {/* Metric 3: VIP Privilege */}
                <div className="bg-white p-5 rounded-3xl border border-outline-variant/20 shadow-xs relative flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface-variant">VIP Privilege</span>
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-[#fea619] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">stars</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-headline-lg text-lg font-black text-on-surface truncate">
                      {isUserVip ? "VIP Active" : "Standard Tier"}
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-1 font-medium">
                      ₹{vipStatus.rollingSpend.toLocaleString("en-IN")} / ₹5,000 spent
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] font-bold text-[#005f3f] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">bolt</span>
                    {isUserVip ? "Free 60m Delivery" : `${vipStatus.percentage}% completed`}
                  </div>
                </div>

                {/* Metric 4: Addresses */}
                <div className="bg-white p-5 rounded-3xl border border-outline-variant/20 shadow-xs relative flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-on-surface-variant">Addresses</span>
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#005f3f] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">location_on</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-headline-lg text-2xl font-black text-on-surface">
                      {addresses.length} Saved
                    </div>
                    <div className="text-[11px] text-on-surface-variant mt-1 font-medium truncate">
                      {addressTagsSummary}
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    {addressesGeofenceVerified ? "Inside delivery radius" : "Boundary checked"}
                  </div>
                </div>
              </div>

              {/* Section 1: Personal Information Card */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-headline-lg text-lg font-black text-on-surface">
                      Personal Information
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Manage your profile details and communication preferences
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid="open-edit-profile-btn"
                    onClick={handleOpenEditProfile}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-headline-sm text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>Edit Info</span>
                  </button>
                </div>

                {/* Personal Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Customer ID (SASS ID) */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                      Customer ID (SASS ID)
                    </label>
                    <div
                      data-testid="personal-info-customer-id"
                      className="bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface"
                    >
                      <span className="font-mono font-bold text-[#005f3f]">
                        {customerSassId}
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-outline-variant">
                        badge
                      </span>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                      Full Name
                    </label>
                    <div className="bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface">
                      <span>{user?.name || "Customer"}</span>
                      <span className="material-symbols-outlined text-[18px] text-outline-variant">
                        person
                      </span>
                    </div>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-on-surface-variant">
                        Mobile Number
                      </label>
                      {user?.phoneVerified ? (
                        <span className="text-[#15803d] text-[11px] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Verified
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setShowPhoneVerificationModal(true)}
                          className="text-amber-700 hover:text-amber-800 text-[11px] font-bold flex items-center gap-1 underline cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">warning</span>
                          Verify Now
                        </button>
                      )}
                    </div>
                    <div className="bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface">
                      <span>{user?.phone || "No phone linked"}</span>
                      <span className="material-symbols-outlined text-[18px] text-outline-variant">
                        smartphone
                      </span>
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-on-surface-variant">
                        Email Address
                      </label>
                      {user?.email ? (
                        <span className="text-[#15803d] text-[11px] font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Verified
                        </span>
                      ) : null}
                    </div>
                    <div className="bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface">
                      <span>{user?.email || "No email provided"}</span>
                      <span className="material-symbols-outlined text-[18px] text-outline-variant">
                        mail
                      </span>
                    </div>
                  </div>

                  {/* Preferred Store Language */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                      Preferred Store Language
                    </label>
                    <div className="bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface">
                      <span>
                        {user?.preferredLanguage ||
                          (language === "ta"
                            ? "தமிழ் / English (Tamil / English)"
                            : "Tamil / English (தமிழ் / English)")}
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-outline-variant">
                        translate
                      </span>
                    </div>
                  </div>

                  {/* Birthday */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-on-surface-variant">
                        Birthday
                      </label>
                      {isUserVip && (
                        <span className="text-amber-700 text-[11px] font-bold">
                          VIP Birthday Gift: 100 Smart Coins
                        </span>
                      )}
                    </div>
                    <div className="bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface">
                      <span data-testid="profile-dob-display">
                        {user?.dob || user?.birthday || "14 August"}
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-outline-variant">
                        cake
                      </span>
                    </div>
                  </div>

                  {/* Weekly Grocery Rhythm */}
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-1.5">
                      Weekly Grocery Rhythm
                    </label>
                    <div className="bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface">
                      <span>{user?.groceryRhythm || "Every Saturday Morning (4 Members)"}</span>
                      <span className="material-symbols-outlined text-[18px] text-outline-variant">
                        sync
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Saved Delivery Addresses */}
              <div
                id="saved-addresses"
                className="bg-white rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="font-headline-lg text-lg font-black text-on-surface">
                      Saved Delivery Addresses
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Default addresses used for 60-min express neighborhood delivery
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenAddAddress}
                    className="inline-flex items-center gap-1.5 bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#15803d] px-4 py-2.5 rounded-2xl font-headline-sm text-xs font-black shadow-xs transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Add New Address</span>
                  </button>
                </div>

                {/* Addresses Grid */}
                {addresses.length === 0 ? (
                  <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30">
                    <span className="material-symbols-outlined text-outline-variant text-[36px] block mb-2">
                      location_off
                    </span>
                    <p className="text-xs font-bold text-on-surface">No saved delivery addresses found.</p>
                    <p className="text-[11px] text-on-surface-variant mt-1">
                      Add your home or office address to enable instant doorstep delivery.
                    </p>
                    <button
                      type="button"
                      onClick={handleOpenAddAddress}
                      className="mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer"
                    >
                      Add First Address
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {addresses.map((addr) => {
                      const geo = addressService.validateGeofence(addr.lat, addr.lng);
                      return (
                        <div
                          key={addr.id}
                          className="rounded-3xl p-5 border border-outline-variant/25 bg-white hover:border-[#005f3f]/40 hover:shadow-sm transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                                    addr.tag === "Home"
                                      ? "bg-[#005f3f]"
                                      : addr.tag === "Work"
                                      ? "bg-amber-700"
                                      : "bg-slate-700"
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[16px]">
                                    {addr.tag === "Home"
                                      ? "home"
                                      : addr.tag === "Work"
                                      ? "business"
                                      : "place"}
                                  </span>
                                </div>
                                <span className="font-headline-sm text-xs font-extrabold text-on-surface">
                                  {addr.tag === "Work" ? "Office" : addr.tag}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {addr.isDefault && (
                                  <span className="bg-[#005f3f] text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider">
                                    DEFAULT
                                  </span>
                                )}
                                <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                  {addr.tag.toUpperCase()}
                                </span>
                              </div>
                            </div>

                            {/* Recipient & Street Info */}
                            <div className="text-xs font-bold text-on-surface mt-2">{addr.name}</div>
                            <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                              {addr.houseNo}, {addr.street}
                              {addr.landmark ? `, ${addr.landmark}` : ""}, {addr.city} - {addr.pincode}
                            </p>
                            <p className="text-xs text-on-surface-variant font-medium mt-2 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px]">call</span>
                              {addr.phone}
                            </p>

                            {/* Geofence Status Badge */}
                            <div className="mt-3">
                              {geo.eligible ? (
                                <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 rounded-xl px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                                  <span className="material-symbols-outlined text-[13px]">bolt</span>
                                  <span>
                                    Within {geo.distanceKm} km of Superstore • 35-min delivery
                                  </span>
                                </div>
                              ) : (
                                <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/60 rounded-xl px-2.5 py-1 text-[11px] font-bold text-amber-800">
                                  <span className="material-symbols-outlined text-[13px]">warning</span>
                                  <span>
                                    Outside 6km delivery zone ({geo.distanceKm} km away)
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Timing note */}
                            <p className="text-[11px] text-on-surface-variant/80 mt-2 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">schedule</span>
                              Deliver between 9:00 AM - 6:00 PM
                            </p>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="mt-5 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-xs">
                            <div>
                              {!addr.isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefaultAddress(addr.id)}
                                  className="font-bold text-[#005f3f] hover:underline cursor-pointer"
                                >
                                  Make Default
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => handleOpenEditAddress(addr)}
                                className="font-bold text-on-surface hover:text-[#005f3f] cursor-pointer"
                              >
                                Edit
                              </button>
                              <span className="text-outline-variant/50">•</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr)}
                                className="font-bold text-red-600 hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* EDIT PERSONAL INFORMATION MODAL                                */}
      {/* ============================================================== */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-headline-lg text-lg font-black text-on-surface">
                Edit Personal Information
              </h3>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-on-surface block mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g. Priya Sundaram"
                  className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">Email Address</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="e.g. priya.sundaram@example.com"
                  className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-on-surface">
                    Mobile Number
                  </label>
                  {user?.phoneVerified ? (
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      Verified
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditProfileModal(false);
                        setShowPhoneVerificationModal(true);
                      }}
                      className="text-[11px] font-bold text-[#005f3f] underline hover:text-[#004d32] cursor-pointer"
                    >
                      Verify Now
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled
                  value={user?.phone || ""}
                  placeholder="No phone linked"
                  className="w-full bg-surface-container/60 px-3.5 py-2.5 rounded-xl border border-outline-variant/20 text-on-surface-variant font-medium cursor-not-allowed"
                />
                <p className="text-[10px] text-on-surface-variant mt-1 flex items-center justify-between">
                  <span>🔒 Mobile number requires OTP verification before checkout.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditProfileModal(false);
                      setShowPhoneVerificationModal(true);
                    }}
                    className="text-[#005f3f] font-bold underline cursor-pointer"
                  >
                    {user?.phoneVerified ? "Change / Re-verify" : "Verify Phone"}
                  </button>
                </p>
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">
                  Preferred Store Language
                </label>
                <select
                  value={editLanguage}
                  onChange={(e) => setEditLanguage(e.target.value)}
                  className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
                >
                  <option value="Tamil / English (தமிழ் / English)">
                    Tamil / English (தமிழ் / English)
                  </option>
                  <option value="English Only">English Only</option>
                  <option value="தமிழ் மட்டும்">தமிழ் மட்டும்</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">Birthday</label>
                <input
                  type="text"
                  data-testid="edit-profile-birthday-input"
                  value={editBirthday}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  placeholder="e.g. 14 August"
                  className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">
                  Weekly Grocery Rhythm
                </label>
                <input
                  type="text"
                  value={editGroceryRhythm}
                  onChange={(e) => setEditGroceryRhythm(e.target.value)}
                  placeholder="e.g. Every Saturday Morning (4 Members)"
                  className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-[#005f3f] text-white shadow-md hover:bg-[#004d32] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingProfile ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ADD / EDIT ADDRESS MODAL                                       */}
      {/* ============================================================== */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-outline-variant/20 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-headline-lg text-lg font-black text-on-surface">
                {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs">
              {/* Tag Selection */}
              <div>
                <label className="font-bold text-on-surface block mb-1.5">Address Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Home", "Work", "Other"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddrTag(t)}
                      className={`py-2 rounded-xl font-bold text-center border cursor-pointer transition-all ${
                        addrTag === t
                          ? "bg-[#005f3f] text-white border-[#005f3f]"
                          : "bg-surface-container-low text-on-surface border-outline-variant/25"
                      }`}
                    >
                      {t === "Work" ? "Office" : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-on-surface block mb-1">
                    Contact Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addrName}
                    onChange={(e) => setAddrName(e.target.value)}
                    placeholder="Recipient name"
                    className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface block mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="+91 98400 12345"
                    className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* House No & Street */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-on-surface block mb-1">
                    House / Flat / Door No <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addrHouseNo}
                    onChange={(e) => setAddrHouseNo(e.target.value)}
                    placeholder="e.g. #42/1"
                    className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface block mb-1">
                    Street & Locality <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addrStreet}
                    onChange={(e) => setAddrStreet(e.target.value)}
                    placeholder="e.g. 2nd Main Road, Gandhi Nagar"
                    className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* Landmark, City & Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-on-surface block mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={addrLandmark}
                    onChange={(e) => setAddrLandmark(e.target.value)}
                    placeholder="Near Park"
                    className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface block mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface block mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addrPincode}
                    onChange={(e) => setAddrPincode(e.target.value)}
                    placeholder="638454"
                    className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
                  />
                </div>
              </div>

              {/* GPS Auto-Detect Button */}
              <div className="pt-1 flex items-center justify-between bg-surface-container-low/70 p-3 rounded-2xl border border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#005f3f] text-[18px]">my_location</span>
                  <span className="text-[11px] text-on-surface font-semibold">
                    GPS Coordinates: {addrLat.toFixed(4)}, {addrLng.toFixed(4)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateGPS}
                  className="px-3 py-1 bg-white hover:bg-surface-container text-[#005f3f] border border-outline-variant/30 rounded-lg text-[10px] font-bold shadow-xs cursor-pointer"
                >
                  Locate Near Hub
                </button>
              </div>

              {/* Default Address Checkbox */}
              <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={addrIsDefault}
                  onChange={(e) => setAddrIsDefault(e.target.checked)}
                  className="rounded text-[#005f3f] focus:ring-[#005f3f]"
                />
                <span className="text-xs font-bold text-on-surface">
                  Set as default delivery address
                </span>
              </label>

              {/* Submit Buttons */}
              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-[#005f3f] text-white shadow-md hover:bg-[#004d32] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingAddress
                    ? "Saving..."
                    : editingAddressId
                    ? "Save Address Changes"
                    : "Add Delivery Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ACCOUNT SETTINGS & PRIVACY MODAL                               */}
      {/* ============================================================== */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-headline-lg text-lg font-black text-on-surface">
                Account Settings & Privacy
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                <div>
                  <div className="font-bold text-on-surface">WhatsApp Delivery Updates</div>
                  <div className="text-[10px] text-on-surface-variant">
                    Receive live tracking links and driver arrival alerts
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={whatsappUpdates}
                  onChange={(e) => setWhatsappUpdates(e.target.checked)}
                  className="rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                <div>
                  <div className="font-bold text-on-surface">SMS Order Status Alerts</div>
                  <div className="text-[10px] text-on-surface-variant">
                    OTP login verification and dispatch SMS
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20">
                <div>
                  <div className="font-bold text-on-surface">Fresh Harvest & Seasonal Offers</div>
                  <div className="text-[10px] text-on-surface-variant">
                    Exclusive member promotions and wood-pressed oil batches
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={promoOffers}
                  onChange={(e) => setPromoOffers(e.target.checked)}
                  className="rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    toast.success("Preferences updated successfully");
                  }}
                  className="w-full py-2.5 rounded-xl font-bold bg-[#005f3f] text-white shadow-md hover:bg-[#004d32] cursor-pointer"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={showPhoneVerificationModal}
        onClose={() => setShowPhoneVerificationModal(false)}
        onSuccess={(verifiedPhone) => {
          toast.success(`Mobile number ${verifiedPhone} verified!`);
        }}
        initialPhone={user?.phone || ""}
      />

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
