import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { ProductCard } from "../components/product/ProductCard";
import { productService } from "../services/productService";
import type { Product, Category, Banner } from "../types";
import { useLanguage } from "../context/LanguageContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sri Amman Smart Store — Farm Fresh Groceries in 60 Mins" },
      {
        name: "description",
        content:
          "Wood-pressed oils, heritage grains, and farm-fresh produce delivered in 60 minutes with single-store purity.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { t } = useLanguage();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [flashDeals, setFlashDeals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);

  // Client-side visual countdown for flash deals
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 32, seconds: 15 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 4, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [bannersData, categoriesData, productsData] = await Promise.all([
          productService.getBanners(),
          productService.getCategories(),
          productService.getProducts(),
        ]);
        setBanners(bannersData || []);
        setCategories(categoriesData || []);
        setFlashDeals(productsData.filter((p) => p.isFlashDeal) || []);
        setBestSellers(productsData || []);
      } catch (err) {
        console.error("Failed to load home page data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadHomeData();
  }, []);

  const heroBanner = banners[0];

  const filteredBestSellers =
    activeTab === "all"
      ? bestSellers
      : bestSellers.filter((p) => p.categorySlug === activeTab);

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]">
        <div className="flex flex-col w-full">
          {/* Hero Section */}
          <section className="max-w-[1320px] mx-auto px-margin-desktop w-full py-space-md">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-md items-stretch">
              {/* Main Hero Card */}
              <div className="lg:col-span-8 bg-surface-container-low rounded-3xl relative overflow-hidden flex flex-col justify-between p-space-xl md:p-space-2xl min-h-[440px] shadow-sm">
                <div
                  className="absolute inset-0 z-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${
                      heroBanner?.imageUrl ||
                      "https://lh3.googleusercontent.com/aida-public/AB6AXuCbMy1ghExJ7-a2yVEjsclWptdjYZIjvFHcy_NCGtWIQKXA8U6idZNaYmAApJuGPk_vYIetXbusIf6a0m30H-tD1o0NWK2ntUzznyvlJFaMyS4c1zRFgWxajT879uU1Gg7HxNxU139AOpCLCWZ1NvWRmQjEQd0wreLX1o7v1dFpQ3SXNGKwX06McDeI45kfTlc2ljGyIJ1DPi1xatizCypjaQmE0zxeOgeQ_R__MeC5"
                    }')`,
                  }}
                ></div>
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-surface-container-low via-surface-container-low/95 to-surface-container-low/30 backdrop-blur-[1px]"></div>

                <div className="relative z-10 max-w-xl flex flex-col items-start gap-space-md">
                  <div className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-badge text-xs uppercase tracking-wider shadow-sm font-bold">
                    <span
                      className="material-symbols-outlined text-[15px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      eco
                    </span>
                    <span>Harvest Fresh Guaranteed</span>
                  </div>
                  <h1 className="font-display-hero text-3xl md:text-5xl text-on-surface font-extrabold tracking-tight leading-tight">
                    Direct from Heritage Farms to Kitchen in{" "}
                    <span className="text-primary underline decoration-secondary decoration-wavy decoration-2">
                      60 Mins
                    </span>
                    .
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant line-clamp-2">
                    South India's most authentic unpolished grains, artisanal wood-pressed oils,
                    and farm-plucked morning greens delivered with single-store purity.
                  </p>

                  <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
                    <div className="flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-2.5 rounded-xl shadow-sm border border-outline-variant/20">
                      <span className="text-secondary font-black font-headline-sm text-sm">
                        FLAT 20% OFF
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                      <span className="font-body-sm text-xs text-on-surface-variant">Code:</span>
                      <span className="font-headline-sm text-xs text-primary bg-primary/10 px-2 py-0.5 rounded tracking-wide font-bold">
                        SMART20
                      </span>
                    </div>
                    <Link
                      to="/shop"
                      className="bg-primary hover:bg-primary-container text-on-primary font-label-button text-sm font-bold px-space-lg py-3 rounded-xl flex items-center gap-space-xs transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <span>Order Harvest Today</span>
                      <span className="material-symbols-outlined text-[18px]">
                        arrow_forward
                      </span>
                    </Link>
                  </div>
                </div>

                <div className="relative z-10 pt-space-xl flex items-center gap-space-lg text-on-surface-variant font-body-sm text-xs">
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      verified
                    </span>
                    <span>Zero Preservatives</span>
                  </div>
                  <div className="flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      speed
                    </span>
                    <span>Avg 38m Express Delivery</span>
                  </div>
                  <div className="hidden sm:flex items-center gap-space-xs">
                    <span className="material-symbols-outlined text-secondary text-[18px]">
                      stars
                    </span>
                    <span>4.9/5 Store Rating</span>
                  </div>
                </div>
              </div>

              {/* 4 Feature Highlights */}
              <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-space-md">
                <div className="bg-surface-container-lowest rounded-2xl p-space-md flex items-center gap-space-md shadow-sm transition-all hover:bg-surface-container-low border border-outline-variant/15 group">
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed/60 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[26px]">local_shipping</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline-sm text-sm font-bold text-on-surface">
                      Free Delivery on ₹499+
                    </span>
                    <span className="font-body-sm text-xs text-on-surface-variant truncate">
                      Zero packaging or surge fees
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-space-md flex items-center gap-space-md shadow-sm transition-all hover:bg-surface-container-low border border-outline-variant/15 group">
                  <div className="w-12 h-12 rounded-xl bg-secondary-fixed/70 text-secondary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[26px]">timer</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline-sm text-sm font-bold text-on-surface">
                      60 Min Express Window
                    </span>
                    <span className="font-body-sm text-xs text-on-surface-variant truncate">
                      Direct electric fleet dispatch from hub
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-space-md flex items-center gap-space-md shadow-sm transition-all hover:bg-surface-container-low border border-outline-variant/15 group">
                  <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[26px]">verified_user</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline-sm text-sm font-bold text-on-surface">
                      100% Quality Assured
                    </span>
                    <span className="font-body-sm text-xs text-on-surface-variant truncate">
                      Doorstep inspection & immediate replacement
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-space-md flex items-center gap-space-md shadow-sm transition-all hover:bg-surface-container-low border border-outline-variant/15 group">
                  <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[26px]">monetization_on</span>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-headline-sm text-sm font-bold text-on-surface">
                      Earn Smart Coins
                    </span>
                    <span className="font-body-sm text-xs text-on-surface-variant truncate">
                      Redeem directly against every basket
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Curated Aisles Categories */}
          <section className="max-w-[1320px] mx-auto px-margin-desktop w-full py-space-xl">
            <div className="flex items-center justify-between mb-space-lg">
              <div className="flex flex-col">
                <span className="font-label-badge text-xs uppercase tracking-wider text-primary font-bold">
                  Curated Aisles
                </span>
                <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface">
                  Shop by Categories
                </h2>
              </div>
              <Link
                to="/shop"
                className="font-headline-sm text-sm font-bold text-primary hover:underline flex items-center gap-1"
              >
                <span>View All Aisles</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-space-md overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to="/shop"
                  search={{ category: cat.slug } as any}
                  className="group flex flex-col items-center bg-surface-container-lowest p-space-md rounded-2xl shadow-sm transition-all hover:bg-surface-container-low text-center border border-outline-variant/15"
                >
                  <div className="w-20 h-20 rounded-full bg-surface-container-low overflow-hidden mb-space-sm p-1 shadow-inner group-hover:scale-105 transition-transform">
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-cover rounded-full"
                      loading="lazy"
                    />
                  </div>
                  <span className="font-headline-sm text-xs font-bold text-on-surface leading-snug">
                    {t(cat.name, cat.tamilName)}
                  </span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant mt-0.5">
                    {cat.itemCount}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          
          {/* VIP Club Prestige Banner */}
          <section className="max-w-[1320px] mx-auto px-margin-desktop w-full py-space-md">
            <div className="bg-gradient-to-r from-[#2a1700] via-[#452700] to-[#1a0f00] text-[#ffddb8] rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="relative z-10 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fea619]/20 text-[#fea619] font-headline-sm text-xs font-bold uppercase tracking-wider mb-3">
                  <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                  <span>Sri Amman VIP Prestige Club</span>
                </div>
                <h3 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-white mb-2">
                  Unlock Exclusive Member Pricing on Every Order
                </h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  Spend ₹5,000 within 30 rolling calendar days on delivered orders to maintain active VIP status. Enjoy exclusive lower pricing, 2X Smart Coins, and priority express packing.
                </p>
              </div>
              <div className="relative z-10 shrink-0">
                <Link
                  to="/rewards"
                  className="bg-[#fea619] hover:bg-[#ffb95f] text-[#2a1700] px-6 py-3.5 rounded-2xl font-headline-sm text-sm font-extrabold flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                >
                  <span>Explore VIP Benefits</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Best Sellers & Staples Tabbed Grid */}
          <section className="max-w-[1320px] mx-auto px-margin-desktop w-full py-space-xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
              <div>
                <span className="font-label-badge text-xs uppercase tracking-wider text-primary font-bold">
                  Trusted Pantry
                </span>
                <h2 className="font-headline-lg text-2xl md:text-3xl text-on-surface font-extrabold">
                  Smart Store Best Sellers & Staples
                </h2>
              </div>

              <div className="flex items-center gap-space-xs bg-surface-container-low p-1.5 rounded-full overflow-x-auto scrollbar-none border border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={`px-space-md py-1.5 rounded-full font-label-button text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "all"
                      ? "bg-primary text-white shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  All Items
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("cold-pressed-oils")}
                  className={`px-space-md py-1.5 rounded-full font-label-button text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "cold-pressed-oils"
                      ? "bg-primary text-white shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Cold Pressed Oils
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("staples-grains")}
                  className={`px-space-md py-1.5 rounded-full font-label-button text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "staples-grains"
                      ? "bg-primary text-white shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Heritage Rice
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("fruits-veggies")}
                  className={`px-space-md py-1.5 rounded-full font-label-button text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "fruits-veggies"
                      ? "bg-primary text-white shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  Farm Fresh Veggies
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">
              {filteredBestSellers.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
