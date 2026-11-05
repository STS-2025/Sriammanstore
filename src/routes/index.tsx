import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { ProductCard } from "../components/product/ProductCard";
import { productService } from "../services/productService";
import type { Announcement, Banner, Product, Category } from "../types";
import { useLanguage } from "../context/LanguageContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sri Amman Smart Store" },
      {
        name: "description",
        content:
          "Shop South Indian groceries, heritage grains, and everyday essentials from Sri Amman Smart Store.",
      },
    ],
  }),
  component: HomePage,
});

const INITIAL_CATEGORY_COUNT = 10;
const BANNER_INTERVAL_MS = 6000;
const BANNER_DATA_REFRESH_MS = 15_000;

function HomePage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const categoryScroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadHomeData() {
      try {
        const [categoryResult, productResult, announcementResult] = await Promise.all([
          productService.getHomepageCategories(),
          productService.getProducts({ sort: "popular" }),
          productService.getAnnouncements().catch(() => [] as Announcement[]),
        ]);
        if (cancelled) return;
        setCategories(categoryResult || []);
        setProducts(
          (productResult || []).filter((product) => product.isActive && product.options.length > 0),
        );
        setAnnouncements(announcementResult || []);
      } catch (loadError) {
        console.error("Failed to load home page data:", loadError);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void loadHomeData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const refreshBanners = async () => {
      try {
        const latestBanners = await productService.getBanners();
        if (!cancelled) {
          setBanners((latestBanners || []).filter((banner) => Boolean(banner.imageUrl)));
        }
      } catch (refreshError) {
        console.error("Failed to refresh homepage banners:", refreshError);
      } finally {
        if (!cancelled) setBannersLoading(false);
      }
    };

    void refreshBanners();
    const timer = window.setInterval(() => void refreshBanners(), BANNER_DATA_REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const productsByCategory = useMemo(() => {
    const bySlug = new Map<string, Product[]>();
    for (const product of products) {
      const group = bySlug.get(product.categorySlug) || [];
      if (!group.some((item) => item.id === product.id)) group.push(product);
      bySlug.set(product.categorySlug, group);
    }
    return bySlug;
  }, [products]);

  const visibleCategories = showAllCategories
    ? categories
    : categories.slice(0, INITIAL_CATEGORY_COUNT);

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      <StoreHeader />
      <main className="min-h-[calc(100vh-80px)] w-full overflow-hidden bg-surface pt-20">
        <div className="w-full pb-24 md:pb-10">
          <OffersScroller announcements={announcements} />
          <PromotionalBannerCarousel banners={banners} loading={bannersLoading} />
          <div className="mx-auto mt-7 flex w-full max-w-[1440px] flex-col gap-7 px-4 sm:px-6 lg:mt-9 lg:gap-9 lg:px-8">
            <section
              aria-label="Store benefits"
              className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3"
            >
              <Benefit
                icon="local_shipping"
                title="Free Delivery on ₹499+"
                detail="Zero packaging or surge fees"
              />
              <Benefit
                icon="timer"
                title="60 Min Express Window"
                detail="Quick dispatch from our hub"
              />
              <Benefit
                icon="verified_user"
                title="Quality Assured"
                detail="Doorstep inspection support"
              />
              <Benefit
                icon="monetization_on"
                title="Earn Smart Coins"
                detail="Redeem against your basket"
              />
            </section>

            {/* Category Section */}
            <section aria-labelledby="shop-categories-heading">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    Curated Aisles
                  </p>
                  <h2
                    id="shop-categories-heading"
                    className="mt-1 text-xl font-extrabold text-on-surface sm:text-2xl"
                  >
                    Shop by Category
                  </h2>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {categories.length > INITIAL_CATEGORY_COUNT && (
                    <button
                      type="button"
                      onClick={() => setShowAllCategories((value) => !value)}
                      className="shrink-0 text-sm font-bold text-primary hover:underline"
                    >
                      {showAllCategories ? "Show less" : "See all"}
                    </button>
                  )}
                  {/* {categories.length > 4 && (
                <button
                  type="button"
                  onClick={() => categoryScroller.current?.scrollBy({ left: 240, behavior: "smooth" })}
                  aria-label="Scroll categories right"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:border-primary/40 hover:text-primary"
                >
                  <ChevronRight size={18} />
                </button>
              )} */}
                </div>
              </div>
              {loading ? (
                <div className="flex gap-4 overflow-hidden">
                  {Array.from({ length: 10 }, (_, index) => (
                    <div
                      key={index}
                      className="h-20 w-20 shrink-0 animate-pulse rounded-full bg-surface-container"
                    />
                  ))}
                </div>
              ) : categories.length === 0 ? (
                <p className="py-6 text-sm text-on-surface-variant">
                  {error
                    ? "Categories are temporarily unavailable."
                    : "No categories are available right now."}
                </p>
              ) : (
                <div
                  ref={categoryScroller}
                  aria-label="Browse product categories"
                  className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 scrollbar-none sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
                  style={{ overscrollBehaviorX: "contain" }}
                >
                  {visibleCategories.map((category) => (
                    <CategoryTile
                      key={category.id || category.slug}
                      category={category}
                      label={t(category.name, category.tamilName)}
                    />
                  ))}
                </div>
              )}
            </section>

            <section
              aria-label="Shop products by category"
              className="flex flex-col gap-8 lg:gap-10"
            >
              {loading ? (
                <div className="space-y-3">
                  <div className="h-7 w-56 animate-pulse rounded bg-surface-container" />
                  <div className="flex gap-3 overflow-hidden">
                    {Array.from({ length: 5 }, (_, index) => (
                      <div
                        key={index}
                        className="h-72 w-44 shrink-0 animate-pulse rounded-2xl bg-surface-container"
                      />
                    ))}
                  </div>
                </div>
              ) : error ? (
                <p role="status" className="py-8 text-center text-sm text-on-surface-variant">
                  Products are temporarily unavailable. Please try again shortly.
                </p>
              ) : (
                categories.map((category) => {
                  const categoryProducts = productsByCategory.get(category.slug) || [];
                  if (!categoryProducts.length) return null;
                  return (
                    <ProductCategorySection
                      key={category.id || category.slug}
                      category={category}
                      products={categoryProducts}
                      title={t(category.name, category.tamilName)}
                    />
                  );
                })
              )}
            </section>

            <section className="rounded-3xl bg-gradient-to-r from-[#2a1700] via-[#452700] to-[#1a0f00] p-6 text-[#ffddb8] shadow-xl sm:p-10">
              <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
                <div className="max-w-2xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#fea619]/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#fea619]">
                    <span className="material-symbols-outlined text-base">workspace_premium</span>
                    Sri Amman VIP Prestige Club
                  </div>
                  <h2 className="mb-2 text-xl font-extrabold text-white sm:text-3xl">
                    Unlock Exclusive Member Pricing on Every Order
                  </h2>
                  <p className="text-sm leading-relaxed opacity-90">
                    Spend ₹5,000 within 30 rolling calendar days on delivered orders to maintain
                    active VIP status. Enjoy exclusive lower pricing, 2X Smart Coins, and priority
                    express packing.
                  </p>
                </div>
                <Link
                  to="/rewards"
                  className="flex shrink-0 items-center gap-2 rounded-2xl bg-[#fea619] px-5 py-3 font-bold text-[#2a1700] shadow-lg transition hover:bg-[#ffb95f]"
                >
                  Explore VIP Benefits{" "}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <StoreFooter />
      <BottomNav />
    </div>
  );
}

function OffersScroller({ announcements }: { announcements: Announcement[] }) {
  if (announcements.length === 0) return null;
  const items = [...announcements, ...announcements];
  const primaryAnnouncement = announcements[0]!;
  return (
    <section
      aria-label="Store announcements"
      className="overflow-hidden bg-primary py-1.5 text-white"
      style={{
        backgroundColor: primaryAnnouncement.bgColor || undefined,
        color: primaryAnnouncement.textColor || undefined,
      }}
    >
      <Link to="/shop">
        <div className="announcement-track flex w-max items-center gap-8 px-3">
          {items.map((announcement, index) => (
            <span
              key={`${announcement.id}-${index}`}
              className="flex shrink-0 items-center gap-1.5 px-1 text-xs font-semibold sm:text-sm"
              style={{
                backgroundColor: announcement.bgColor || "transparent",
                color: announcement.textColor || "inherit",
              }}
            >
              <span
                className="material-symbols-outlined text-sm"
                style={{ color: announcement.textColor || "inherit" }}
              >
                sell
              </span>
              {announcement.text}
            </span>
          ))}
        </div>
      </Link>
    </section>
  );
}

function PromotionalBannerCarousel({ banners, loading }: { banners: Banner[]; loading: boolean }) {
  const { language } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(
      () => setActiveIndex((current) => (current + 1) % banners.length),
      BANNER_INTERVAL_MS,
    );
    return () => window.clearInterval(timer);
  }, [banners.length]);
  const banner = banners[activeIndex];
  const mobileImage = banner?.mobileImageUrl;
  const categorySlug = banner?.categorySlug;
  const title = banner?.title
    ? language === "ta" && banner.tamilTitle
      ? banner.tamilTitle
      : banner.title
    : "";
  const subheading = banner
    ? language === "ta" && banner.tamilSubheading
      ? banner.tamilSubheading
      : banner.subheading || banner.subtitle
    : "";
  const description = banner
    ? language === "ta" && banner.tamilShortDescription
      ? banner.tamilShortDescription
      : banner.shortDescription
    : "";
  const textPosition = banner?.textPosition?.toLowerCase();
  const verticalAlignment = banner?.verticalAlignment?.toLowerCase();
  const textAlignment = banner?.textAlignment?.toLowerCase();
  const horizontalAlignment =
    textPosition === "right" ? "flex-end" : textPosition === "center" ? "center" : "flex-start";
  const verticalJustification =
    verticalAlignment === "top"
      ? "flex-start"
      : verticalAlignment === "bottom"
        ? "flex-end"
        : "center";
  const alignment =
    textAlignment === "right" || textAlignment === "center" ? textAlignment : "left";
  const imageSrc = banner?.desktopImageUrl || banner?.imageUrl || "";
  const buttonText = banner?.buttonText || "Shop Now";
  const configuredRedirect = banner?.redirectUrl?.trim();
  const bannerHref =
    configuredRedirect === "/products"
      ? "/shop"
      : configuredRedirect ||
        (categorySlug ? `/shop?category=${encodeURIComponent(categorySlug)}` : "/shop");

  if (!banner) {
    if (!loading) return null;
    return (
      <section
        aria-label="Promotions loading"
        aria-busy="true"
        role="status"
        className="flex aspect-[1.7/1] min-h-[180px] max-h-[440px] w-full items-center justify-center bg-surface-container-low sm:aspect-[3.1/1]"
      >
        <span className="flex items-center gap-3 text-sm font-semibold text-on-surface-variant">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
          Loading banners…
        </span>
      </section>
    );
  }

  return (
    <section
      aria-label="Promotions"
      className="relative w-full overflow-hidden bg-surface-container-lowest shadow-sm"
    >
      <a
        href={bannerHref}
        aria-label={banner ? `View promotion: ${title}` : "Shop Sri Amman groceries"}
        className="relative block aspect-[1.7/1] max-h-[440px] min-h-[180px] w-full overflow-hidden sm:aspect-[3.1/1]"
        style={{ backgroundColor: banner?.bannerBackgroundColor || "#f4f4f5" }}
      >
        {banner?.videoUrl ? (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={banner.videoUrl}
            poster={imageSrc}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <picture>
            <source media="(max-width: 640px)" srcSet={mobileImage || imageSrc} />
            <img
              src={imageSrc}
              alt={title || "Sri Amman Smart Store grocery collection"}
              className="h-full w-full object-cover"
              fetchPriority="high"
            />
          </picture>
        )}
        {banner?.imageOverlayEnabled && (
          <span
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              backgroundColor: banner.customOverlayColor || banner.overlayColor || "#000000",
              opacity: Math.min(100, Math.max(0, banner.overlayOpacity ?? 40)) / 100,
            }}
          />
        )}
        {banner && (
          <span
            className="absolute inset-0 flex p-4 sm:p-10"
            style={{ alignItems: horizontalAlignment, justifyContent: verticalJustification }}
          >
            <span
              className="flex max-h-full max-w-[92%] flex-col overflow-y-auto sm:max-w-[80%]"
              style={{
                maxWidth: banner.contentMaxWidth
                  ? `${Math.max(160, Math.min(1200, banner.contentMaxWidth))}px`
                  : undefined,
                textAlign: alignment,
                color: banner.headingColor || "#ffffff",
                backgroundColor: banner.imageOverlayEnabled ? undefined : "rgba(0, 0, 0, 0.48)",
                padding: banner.imageOverlayEnabled ? undefined : "clamp(12px, 2vw, 24px)",
                borderRadius: banner.imageOverlayEnabled ? undefined : "16px",
                textShadow: "0 1px 4px rgba(0, 0, 0, 0.65)",
              }}
            >
              {title && banner.showTitle !== false && (
                <span
                  className="font-extrabold leading-tight tracking-tight drop-shadow"
                  style={{
                    color: banner.headingColor || "#ffffff",
                    fontSize: `clamp(20px, ${Math.min(8, Math.max(2.5, (banner.headingFontSize || 38) / 10))}vw, ${Math.min(96, Math.max(18, banner.headingFontSize || 38))}px)`,
                  }}
                >
                  {title}
                </span>
              )}
              {subheading && banner.showSubheading !== false && (
                <span
                  className="mt-2 font-medium leading-relaxed drop-shadow"
                  style={{
                    color: banner.subheadingColor || "#ffffff",
                    fontSize: `clamp(13px, ${Math.min(5, Math.max(1.5, (banner.subheadingFontSize || 20) / 10))}vw, ${Math.min(56, Math.max(12, banner.subheadingFontSize || 20))}px)`,
                  }}
                >
                  {subheading}
                </span>
              )}
              {description && description !== subheading && banner.showDescription !== false && (
                <span className="mt-2 text-sm leading-relaxed drop-shadow sm:text-base">
                  {description}
                </span>
              )}
              {banner.promoDiscount && banner.showPromoDiscount !== false && (
                <span className="mt-3 inline-flex w-fit rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white sm:text-sm">
                  {banner.promoDiscount}
                </span>
              )}
              {banner.promoCode && banner.showPromoCode && (
                <span className="mt-2 text-sm font-bold drop-shadow">Code: {banner.promoCode}</span>
              )}
              {banner.showButton !== false && (
                <span
                  className="mt-4 inline-flex w-fit items-center rounded-full px-5 py-2.5 text-sm font-bold shadow-md sm:text-base"
                  style={{
                    backgroundColor: banner.buttonBackgroundColor || "#ffffff",
                    color: banner.buttonTextColor || "#005f3f",
                    alignSelf:
                      alignment === "center"
                        ? "center"
                        : alignment === "right"
                          ? "flex-end"
                          : "flex-start",
                  }}
                >
                  {buttonText}
                </span>
              )}
            </span>
          </span>
        )}
      </a>
      {banners.length > 1 && (
        <div
          className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2"
          aria-label="Choose promotion"
        >
          {banners.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show promotion ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-6 bg-primary" : "w-2 bg-white/80"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryTile({ category, label }: { category: Category; label: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const rawImage = category.image?.trim();
  const hasValidCustomImage = Boolean(
    rawImage && !rawImage.includes("/placeholders/") && !rawImage.endsWith("grocery.svg"),
  );

  return (
    <Link
      to="/shop"
      search={{ category: category.slug }}
      className="group flex w-[82px] shrink-0 snap-start flex-col items-center text-center sm:w-[92px]"
      aria-label={`Shop ${label}`}
    >
      <span className="relative flex shrink-0 items-center justify-center transition-all duration-300 ease-out group-hover:scale-[1.03] group-hover:shadow-[0_10px_26px_rgba(24,92,54,0.18)] motion-reduce:transform-none motion-reduce:transition-none">
        <span className="block h-[72px] w-[72px] overflow-hidden rounded-full border border-primary/20 bg-surface-container-lowest shadow-sm transition-all duration-300 ease-out group-hover:border-primary group-hover:shadow-[0_10px_22px_rgba(24,92,54,0.18)] sm:h-[82px] sm:w-[82px] md:h-[88px] md:w-[88px] lg:h-[96px] lg:w-[96px] motion-reduce:transition-none">
          {!imageFailed ? (
            <img
              src={hasValidCustomImage ? rawImage : "/placeholders/grocery.svg"}
              alt=""
              className="h-full w-full rounded-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.08] motion-reduce:transform-none motion-reduce:transition-none"
              loading="lazy"
              onError={(event) => {
                event.currentTarget.onerror = null;
                if (hasValidCustomImage) {
                  event.currentTarget.onerror = () => setImageFailed(true);
                  event.currentTarget.src = "/placeholders/grocery.svg";
                } else {
                  setImageFailed(true);
                }
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary">
              <span className="material-symbols-outlined text-[32px] text-primary/80">
                shopping_basket
              </span>
            </div>
          )}
        </span>
      </span>
      <span className="mt-2 w-full max-w-[82px] whitespace-normal break-words text-[10px] font-bold leading-tight text-on-surface opacity-100 transition-all duration-300 ease-out sm:max-w-[92px] sm:text-[11px] group-hover:opacity-100 group-hover:text-primary motion-reduce:opacity-100 motion-reduce:transition-none sm:group-hover:translate-y-0 sm:opacity-0 sm:group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100">
        {label}
      </span>
    </Link>
  );
}

function ProductCategorySection({
  category,
  products,
  title,
}: {
  category: Category;
  products: Product[];
  title: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const updateArrows = useCallback(() => {
    const element = scroller.current;
    if (!element) return;
    setCanScrollLeft(element.scrollLeft > 2);
    setCanScrollRight(element.scrollLeft + element.clientWidth < element.scrollWidth - 2);
  }, []);

  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    updateArrows();
    const observer = new ResizeObserver(updateArrows);
    observer.observe(element);
    return () => observer.disconnect();
  }, [products.length, updateArrows]);

  const scroll = (direction: number) => {
    const element = scroller.current;
    if (!element) return;
    const card = element.querySelector<HTMLElement>("[data-product-card]");
    const distance = card ? (card.offsetWidth + 12) * 3 : element.clientWidth * 0.8;
    element.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate text-lg font-extrabold text-on-surface sm:text-xl">
          {title}
        </h2>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/shop"
            search={{ category: category.slug }}
            className="text-xs font-bold text-primary hover:underline sm:text-sm"
          >
            See all
          </Link>
        </div>
      </div>
      <div
        ref={scroller}
        onScroll={updateArrows}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-3 scrollbar-none"
        style={{ overscrollBehaviorX: "contain" }}
      >
        {products.map((product) => (
          <div
            data-product-card
            key={product.id}
            className="w-[min(44vw,190px)] shrink-0 snap-start sm:w-[190px] lg:w-[204px]"
          >
            <ProductCard product={product} className="h-full p-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Benefit({ icon, title, detail }: { icon: string; title: string; detail: string }) {
  return (
    <div className="group flex min-w-0 items-start gap-2 rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-2.5 shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:border-primary/65 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none sm:items-center sm:gap-3 sm:p-3">
      <span className="material-symbols-outlined mt-0.5 shrink-0 text-xl text-primary transition-transform duration-200 group-hover:scale-110 sm:mt-0 sm:text-2xl motion-reduce:transform-none motion-reduce:transition-none">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block whitespace-normal break-words text-[10px] font-bold leading-snug text-on-surface sm:text-xs">
          {title}
        </span>
        <span className="mt-1 block whitespace-normal break-words text-[8px] leading-snug text-on-surface-variant sm:text-[11px]">
          {detail}
        </span>
      </span>
    </div>
  );
}
