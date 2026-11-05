import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useNotifications } from "../../context/NotificationContext";
import { useLanguage } from "../../context/LanguageContext";
import { productService } from "../../services/productService";
import { addressService } from "../../services/addressService";
import { useCartFlyAnimation } from "../../hooks/useCartFlyAnimation";
import type { Address, Category } from "../../types";
import { ChevronDown, MapPin, X } from "lucide-react";
import logo from "../../assests/logo.png"

export function StoreHeader() {
  const { user, isLoading } = useAuth();
  const { cartCount, cartSubtotal } = useCart();
  const { unreadCount } = useNotifications();
  const { language, toggleLanguage, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [isAddressPickerOpen, setIsAddressPickerOpen] = useState(false);
  const [addressSearch, setAddressSearch] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  const desktopCartTargetRef = useRef<HTMLDivElement>(null);
  const showHeaderCartAdded = useCartFlyAnimation(desktopCartTargetRef, "desktop");
  const navigate = useNavigate();

  const fetchCategories = useCallback(async (forceRefresh = false) => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const data = await productService.getCategories(forceRefresh);
      setCategories(data || []);
    } catch (err: any) {
      console.error("Failed to load categories from Firebase:", err);
      setCategoriesError(
        err?.message || "Failed to load categories from Firebase database."
      );
    } finally {
      setCategoriesLoading(false);
    }
  }, []);

  // Fetch categories once on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    let cancelled = false;
    setAddresses([]);
    setDefaultAddress(null);
    if (!user?.id) return;

    addressService
      .getAddresses(user.id, user.legacySassId)
      .then((addresses) => {
        if (!cancelled) {
          setAddresses(addresses);
          setDefaultAddress(addresses.find((address) => address.isDefault) || null);
        }
      })
      .catch((error) => console.error("Failed to load delivery addresses:", error));

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.legacySassId]);

  const filteredAddresses = addresses.filter((address) =>
    [address.name, address.houseNo, address.street, address.landmark, address.city, address.pincode]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(addressSearch.trim().toLowerCase()),
  );

  const chooseAddress = async (address: Address) => {
    if (!user?.id || isSavingAddress) return;
    setIsSavingAddress(true);
    try {
      await addressService.setDefaultAddress(address.id, user.id);
      setAddresses((current) => current.map((item) => ({ ...item, isDefault: item.id === address.id })));
      setDefaultAddress({ ...address, isDefault: true });
      setIsAddressPickerOpen(false);
      setAddressSearch("");
    } catch (error) {
      console.error("Failed to update default delivery address:", error);
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Click outside listener to dismiss category dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCategoriesOpen(false);
      }
    }
    if (isCategoriesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isCategoriesOpen]);

  const toggleCategoriesDropdown = () => {
    const nextState = !isCategoriesOpen;
    setIsCategoriesOpen(nextState);
    if (nextState && categories.length === 0 && !categoriesLoading && !categoriesError) {
      fetchCategories();
    }
  };

  const handleDropdownKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsCategoriesOpen(false);
      dropdownButtonRef.current?.focus();
    }
  };

  const handleSelectCategory = (slug: string) => {
    setIsCategoriesOpen(false);
    if (slug === "all") {
      navigate({ to: "/shop" } as any);
    } else {
      navigate({
        to: "/shop",
        search: { category: slug },
      } as any);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate({
      to: "/shop",
      search: { q: query, category: selectedCategory !== "all" ? selectedCategory : undefined },
    } as any);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_10px_25px_-5px_rgba(11,122,83,0.06),0_4px_6px_-2px_rgba(15,23,42,0.02)]">

      {/* Main Navigation Bar */}
      <div className="h-20 w-full px-2 sm:px-4 flex items-center justify-between gap-2 sm:gap-space-md">
        {/* Brand & Location */}
        <div className="flex items-center gap-space-lg shrink-0">
          <Link to="/" className="flex items-center gap-space-sm group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              <img src={logo} alt="Sri Amman Smart Store" className="h-full w-full rounded-xl object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="font-headline-md text-headline-md tracking-tight text-primary font-bold">
                Sri Amman
              </span>
              <span className="font-label-badge text-[10px] tracking-wider uppercase text-secondary font-semibold">
                Smart Store
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsAddressPickerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={isAddressPickerOpen}
            className="hidden xl:flex items-center gap-space-xs bg-surface-container-low hover:bg-surface-container px-space-md py-space-sm rounded-xl text-on-surface transition-all text-left"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <MapPin size={18} />
            </div>
            <div className="flex min-w-0 flex-col pr-space-xs">
              <span className="font-body-sm text-[12px] font-extrabold text-on-surface leading-tight">
                {defaultAddress ? "Deliver to" : "Add delivery address"}
              </span>
              <span className="font-body-sm text-[11px] font-medium text-on-surface-variant truncate max-w-[160px]">
                {defaultAddress
                  ? [defaultAddress.houseNo, defaultAddress.street, defaultAddress.city, defaultAddress.pincode]
                      .filter(Boolean)
                      .join(", ")
                  : "Choose a saved location"}
              </span>
            </div>
            <ChevronDown size={16} className="ml-1 shrink-0 text-on-surface-variant" />
          </button>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-2xl mx-3 hidden lg:block">
          <div className="flex items-center bg-surface-container-lowest rounded-full p-1 pl-space-md shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] ring-1 ring-outline-variant/30 focus-within:ring-2 focus-within:ring-primary transition-all">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 5,000+ groceries, organic produce & cold pressed oils..."
              className="w-full bg-transparent px-space-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
            />
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="bg-primary text-on-primary hover:bg-primary-container px-space-lg py-2.5 rounded-full flex items-center gap-space-xs font-label-button text-label-button transition-all shadow-[0_2px_6px_rgba(0,95,63,0.3)] ml-space-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Right Actions & Navigation */}
        <div className="flex items-center gap-0 sm:gap-space-md shrink-0">

          <form onSubmit={handleSearch} className="flex w-[clamp(6rem,34vw,14rem)] items-center gap-1 rounded-full bg-surface-container-low px-2 py-1 ring-1 ring-outline-variant/30 lg:hidden">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search..."
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-xs text-on-surface placeholder:text-outline focus:outline-none sm:text-sm"
            />
            <button
              type="submit"
              aria-label="Submit search"
              disabled={!searchQuery.trim()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
            </button>
          </form>

          {/* Notifications Bell */}
          <Link
            to="/notifications"
            className="relative p-1.5 sm:p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low"
            title="Notifications & Store Alerts"
          >
            <span className="material-symbols-outlined text-[24px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-600 text-white font-label-badge text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold ring-2 ring-surface-container-lowest">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            to="/cart"
            className="hidden md:flex items-center gap-1 sm:gap-space-sm bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim px-2 sm:px-space-md py-2 rounded-full transition-all shadow-[0_2px_6px_rgba(11,122,83,0.12)]"
          >
            <div ref={desktopCartTargetRef} className="relative flex items-center">
              <span className="material-symbols-outlined text-primary text-[22px]">
                shopping_bag
              </span>
              {showHeaderCartAdded && (
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 animate-fade-in text-xs font-black text-primary">
                  +1
                </span>
              )}
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary text-on-primary font-label-badge text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold ring-1 ring-surface-container-lowest">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="hidden sm:flex flex-col items-start leading-tight pr-0.5">
              <span className="font-label-badge text-[10px] font-bold uppercase opacity-80">
                Cart
              </span>
              <span className="font-headline-sm text-label-button font-extrabold">
                ₹{cartSubtotal}
              </span>
            </div>
          </Link>

          <div className="h-6 w-px bg-outline-variant/30 hidden sm:block"></div>

          {/* User Account */}
          <Link
            to={isLoading ? "/account" : user ? "/account" : "/login"}
            className="hidden md:flex items-center gap-space-sm pl-space-xs cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary transition-all">
              {isLoading ? "..." : user?.name ? user.name.charAt(0) : "👤"}
            </div>
            <div className="hidden 2xl:flex flex-col">
              <span className="font-body-sm text-[11px] text-on-surface-variant leading-none">
                Hello,
              </span>
              <span className="font-label-button text-label-button font-bold text-on-surface group-hover:text-primary transition-colors leading-tight truncate max-w-[100px]">
                {isLoading ? "Restoring..." : user?.name ? user.name.split(" ")[0] : "Sign In"}
              </span>
            </div>
          </Link>
        </div>
      </div>
      
      {isAddressPickerOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/45 px-4 pt-24 sm:pt-32"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsAddressPickerOpen(false);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setIsAddressPickerOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-picker-title"
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-surface-container-lowest text-on-surface shadow-2xl"
          >
            <div className="bg-surface-container-low px-5 py-4 sm:px-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="address-picker-title" className="text-lg font-bold">Change delivery location</h2>
                <button
                  type="button"
                  onClick={() => setIsAddressPickerOpen(false)}
                  aria-label="Close address picker"
                  className="rounded-full p-1.5 text-on-surface-variant hover:bg-surface-container-high"
                >
                  <X size={20} />
                </button>
              </div>
              <input
                autoFocus
                type="search"
                value={addressSearch}
                onChange={(event) => setAddressSearch(event.target.value)}
                placeholder="Search saved addresses"
                aria-label="Search saved addresses"
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="max-h-[55vh] overflow-y-auto">
              {filteredAddresses.length > 0 ? (
                filteredAddresses.map((address) => (
                  <button
                    key={address.id}
                    type="button"
                    onClick={() => void chooseAddress(address)}
                    disabled={isSavingAddress}
                    className="flex w-full items-start gap-3 border-b border-outline-variant/15 px-5 py-4 text-left transition hover:bg-surface-container-low disabled:opacity-60 sm:px-6"
                  >
                    <MapPin size={18} className="mt-0.5 shrink-0 text-on-surface-variant" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {address.tag} {address.name ? `· ${address.name}` : ""}
                        {address.isDefault && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                            Default
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-on-surface-variant">
                        {[address.houseNo, address.street, address.landmark, address.city, address.pincode]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </span>
                  </button>
                ))
              ) : (
                <p className="px-6 py-8 text-center text-sm text-on-surface-variant">
                  {addresses.length ? "No saved addresses match your search." : "You have no saved addresses yet."}
                </p>
              )}
            </div>

            <div className="border-t border-outline-variant/15 px-5 py-3 sm:px-6">
              <Link
                to={user ? "/addresses" : "/login"}
                onClick={() => setIsAddressPickerOpen(false)}
                className="text-sm font-bold text-primary hover:underline"
              >
                {addresses.length ? "Manage addresses" : "Sign in or add an address"}
              </Link>
            </div>
          </section>
        </div>
      )}
    </header>
  );
}

