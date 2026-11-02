import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useWishlist } from "../../context/WishlistContext";
import { useNotifications } from "../../context/NotificationContext";
import { useLanguage } from "../../context/LanguageContext";
import { productService } from "../../services/productService";
import type { Category } from "../../types";
import logo from "../../assests/logo.png"

export function StoreHeader() {
  const { user, isLoading } = useAuth();
  const { cartCount, cartSubtotal } = useCart();
  const { wishlistCount } = useWishlist();
  const { unreadCount } = useNotifications();
  const { language, toggleLanguage, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
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
    if (searchQuery.trim()) {
      navigate({
        to: "/shop",
        search: { q: searchQuery.trim(), category: selectedCategory !== "all" ? selectedCategory : undefined },
      } as any);
    } else {
      navigate({ to: "/shop" } as any);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_10px_25px_-5px_rgba(11,122,83,0.06),0_4px_6px_-2px_rgba(15,23,42,0.02)]">
      {/* Top Announcement Bar */}
      <div className="bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm">
        <div className="max-w-[1320px] mx-auto px-margin-desktop h-9 flex items-center justify-between">
          <div className="flex items-center gap-space-lg">
            <div className="flex items-center gap-space-xs text-primary font-headline-sm text-label-button">
              <span className="material-symbols-outlined text-[16px]">local_shipping</span>
              <span>Free Express Delivery above ₹499</span>
            </div>
            <span className="h-3 w-px bg-outline-variant/40 hidden sm:inline-block"></span>
            <div className="hidden sm:flex items-center gap-space-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px]">schedule</span>
              <span>Open today till 10:00 PM</span>
            </div>
          </div>
          <div className="flex items-center gap-space-lg">
            {/* Bilingual Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container font-headline-sm text-[11px] font-bold text-primary hover:bg-surface-container-high transition-colors"
              title="Switch Language"
            >
              <span className="material-symbols-outlined text-[14px]">translate</span>
              <span>{language === "en" ? "தமிழ்" : "English"}</span>
            </button>
            <span className="h-3 w-px bg-outline-variant/40"></span>
            <a
              className="flex items-center gap-space-xs hover:text-primary transition-colors text-[12px]"
              href="tel:+919840012345"
            >
              <span className="material-symbols-outlined text-[15px]">support_agent</span>
              <span className="hidden md:inline">+91 98400 12345</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="h-20 max-w-[1320px] mx-auto px-margin-desktop flex items-center justify-between gap-space-md">
        {/* Brand & Location */}
        <div className="flex items-center gap-space-lg shrink-0">
          <Link to="/" className="flex items-center gap-space-sm group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              <img src={logo}/>
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

          <Link
            to="/addresses"
            className="hidden sm:flex items-center gap-space-xs bg-surface-container-low hover:bg-surface-container px-space-md py-space-sm rounded-full text-on-surface transition-all text-left shadow-[0_1px_4px_rgba(15,23,42,0.04)]"
          >
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[18px]">location_on</span>
            </div>
            <div className="flex flex-col pr-space-xs">
              <span className="font-body-sm text-[10px] uppercase font-bold text-on-surface-variant leading-none">
                Deliver to
              </span>
              <span className="font-label-button text-label-button font-semibold text-on-surface truncate max-w-[140px]">
                Gobichettipalayam (638454)
              </span>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              expand_more
            </span>
          </Link>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-space-md hidden md:block">
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
              className="bg-primary text-on-primary hover:bg-primary-container px-space-lg py-2.5 rounded-full flex items-center gap-space-xs font-label-button text-label-button transition-all shadow-[0_2px_6px_rgba(0,95,63,0.3)] ml-space-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>Search</span>
            </button>
          </div>
        </form>

        {/* Right Actions & Navigation */}
        <div className="flex items-center gap-space-md shrink-0">

          {/* Notifications Bell */}
          <Link
            to="/notifications"
            className="relative p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low"
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
            className="flex items-center gap-space-sm bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim px-space-md py-2 rounded-full transition-all shadow-[0_2px_6px_rgba(11,122,83,0.12)]"
          >
            <div className="relative flex items-center">
              <span className="material-symbols-outlined text-primary text-[22px]">
                shopping_bag
              </span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-primary text-on-primary font-label-badge text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold ring-1 ring-surface-container-lowest">
                  {cartCount}
                </span>
              )}
            </div>
            <div className="flex flex-col items-start leading-tight pr-0.5">
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
            className="flex items-center gap-space-sm pl-space-xs cursor-pointer group"
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

      {/* Category Aisles Navigation Bar */}
      <div className="bg-surface-container-lowest shadow-[0_1px_6px_rgba(15,23,42,0.03)] border-t border-outline-variant/10">
        <div className="max-w-[1320px] mx-auto px-margin-desktop">
          <nav className="flex items-center gap-space-sm h-12 relative" aria-label="Category Navigation">
            {/* 1. All Categories Dropdown Trigger & Panel */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                ref={dropdownButtonRef}
                onClick={toggleCategoriesDropdown}
                onKeyDown={handleDropdownKeyDown}
                aria-expanded={isCategoriesOpen}
                aria-haspopup="menu"
                aria-controls="navbar-all-categories-menu"
                aria-label="All Categories"
                data-testid="navbar-all-categories-button"
                className="flex items-center gap-space-xs bg-primary text-on-primary hover:bg-primary-container px-space-md py-1.5 rounded-full font-label-button text-label-button shadow-[0_2px_4px_rgba(0,95,63,0.2)] cursor-pointer transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">menu</span>
                <span>{t("All Categories", "அனைத்து பிரிவுகள்")}</span>
                <span
                  className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                    isCategoriesOpen ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>

              {/* Dropdown Panel */}
              {isCategoriesOpen && (
                <div
                  id="navbar-all-categories-menu"
                  role="menu"
                  aria-label="Product Categories"
                  data-testid="navbar-categories-dropdown"
                  className="absolute top-full left-0 mt-2 w-72 sm:w-80 md:w-96 max-w-[calc(100vw-2rem)] bg-surface-container-lowest rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.14)] border border-outline-variant/20 p-2 z-50 max-h-[70vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  {/* Loading State */}
                  {categoriesLoading && (
                    <div
                      data-testid="categories-loading-state"
                      className="p-6 flex flex-col items-center justify-center text-center gap-2"
                    >
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="font-body-sm text-xs text-on-surface-variant font-medium">
                        {t("Loading live categories...", "பிரிவுகள் ஏற்றப்படுகின்றன...")}
                      </span>
                    </div>
                  )}

                  {/* Error State */}
                  {!categoriesLoading && categoriesError && (
                    <div
                      data-testid="categories-error-state"
                      className="p-4 flex flex-col items-center justify-center text-center gap-2"
                    >
                      <span className="material-symbols-outlined text-error text-[26px]">
                        error
                      </span>
                      <p className="font-body-sm text-xs text-error font-medium">
                        {categoriesError}
                      </p>
                      <button
                        type="button"
                        onClick={() => fetchCategories(true)}
                        className="mt-1 px-3 py-1 bg-surface-container-low hover:bg-surface-container text-primary font-headline-sm text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        {t("Retry", "மீண்டும் முயற்சி")}
                      </button>
                    </div>
                  )}

                  {/* Empty State */}
                  {!categoriesLoading && !categoriesError && categories.length === 0 && (
                    <div
                      data-testid="categories-empty-state"
                      className="p-6 flex flex-col items-center justify-center text-center gap-2 text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-[32px] text-outline-variant">
                        category
                      </span>
                      <p className="font-body-sm text-xs font-medium">
                        {t(
                          "No categories found in Firebase database.",
                          "பிரிவுகள் எதுவும் காணப்படவில்லை."
                        )}
                      </p>
                    </div>
                  )}

                  {/* Populated Category Options */}
                  {!categoriesLoading && !categoriesError && categories.length > 0 && (
                    <div className="py-1">
                      {/* All Products header option */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleSelectCategory("all")}
                        data-testid="category-option-all"
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-surface-container-low transition-colors group cursor-pointer border-b border-outline-variant/10 mb-1"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                            <span className="material-symbols-outlined text-[18px]">storefront</span>
                          </div>
                          <div>
                            <span className="font-headline-sm text-xs font-bold text-on-surface block group-hover:text-primary transition-colors">
                              {t("All Products", "அனைத்து பொருட்கள்")}
                            </span>
                            <span className="font-body-sm text-[10px] text-on-surface-variant block">
                              {t("View full harvest catalogue", "முழு பட்டியல் காண்க")}
                            </span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[16px] text-outline-variant group-hover:text-primary transition-colors">
                          chevron_right
                        </span>
                      </button>

                      {/* Live Firebase Categories */}
                      <div className="space-y-0.5">
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            role="menuitem"
                            data-testid={`category-option-${cat.slug}`}
                            onClick={() => handleSelectCategory(cat.slug)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-surface-container-low transition-colors group cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {cat.image && (cat.image.startsWith("http") || cat.image.startsWith("data:")) ? (
                                <img
                                  src={cat.image}
                                  alt={cat.name}
                                  className="w-8 h-8 rounded-lg object-contain bg-surface-container-low p-0.5 shrink-0 border border-outline-variant/15"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center shrink-0 border border-outline-variant/15">
                                  <span className="material-symbols-outlined text-[18px]">
                                    category
                                  </span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <span className="font-headline-sm text-xs font-bold text-on-surface block truncate group-hover:text-primary transition-colors">
                                  {t(cat.name, cat.tamilName)}
                                </span>
                                {cat.subcategories && cat.subcategories.length > 0 && (
                                  <span className="font-body-sm text-[10px] text-on-surface-variant block truncate">
                                    {cat.subcategories.slice(0, 2).join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>
                            {cat.itemCount && (
                              <span className="font-body-sm text-[10px] text-on-surface-variant font-medium bg-surface-container-low px-2 py-0.5 rounded-full shrink-0 ml-2">
                                {cat.itemCount}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Smart Deals Button */}
            <Link
              to="/shop"
              search={{ deals: true } as any}
              className="px-space-md py-1.5 font-label-button text-label-button text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors shrink-0 flex items-center gap-1"
              data-testid="navbar-smart-deals-button"
            >
              <span className="text-tertiary font-bold">%</span>
              <span>Smart Deals</span>
            </Link>

            {/* 3. VIP Club Button */}
            <Link
              to="/rewards"
              className="px-space-md py-1.5 font-label-button text-label-button text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors shrink-0 flex items-center gap-1.5"
              data-testid="navbar-vip-club-button"
            >
              <span className="material-symbols-outlined text-[16px] text-secondary">
                workspace_premium
              </span>
              <span>VIP Club</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

