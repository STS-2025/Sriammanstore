import { n as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/@radix-ui/react-label+[...].mjs";
import { Q as productService, g as StoreHeader, h as StoreFooter, it as useLanguage, n as BottomNav } from "./StoreFooter-CRTqGBJ2.mjs";
import { t as ProductCard } from "./ProductCard-lmahrv00.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CKqlelED.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HomePage() {
	const { t } = useLanguage();
	const [banners, setBanners] = (0, import_react.useState)([]);
	const [categories, setCategories] = (0, import_react.useState)([]);
	const [flashDeals, setFlashDeals] = (0, import_react.useState)([]);
	const [bestSellers, setBestSellers] = (0, import_react.useState)([]);
	const [activeTab, setActiveTab] = (0, import_react.useState)("all");
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [timeLeft, setTimeLeft] = (0, import_react.useState)({
		hours: 4,
		minutes: 32,
		seconds: 15
	});
	(0, import_react.useEffect)(() => {
		const timer = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev.seconds > 0) return {
					...prev,
					seconds: prev.seconds - 1
				};
				if (prev.minutes > 0) return {
					...prev,
					minutes: 59,
					seconds: 59
				};
				if (prev.hours > 0) return {
					hours: prev.hours - 1,
					minutes: 59,
					seconds: 59
				};
				return {
					hours: 4,
					minutes: 0,
					seconds: 0
				};
			});
		}, 1e3);
		return () => clearInterval(timer);
	}, []);
	(0, import_react.useEffect)(() => {
		async function loadHomeData() {
			try {
				const [bannersData, categoriesData, productsData] = await Promise.all([
					productService.getBanners(),
					productService.getCategories(),
					productService.getProducts()
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
	const filteredBestSellers = activeTab === "all" ? bestSellers : bestSellers.filter((p) => p.categorySlug === activeTab);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col w-full",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
							className: "max-w-[1320px] mx-auto px-margin-desktop w-full py-space-md",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 lg:grid-cols-12 gap-space-md items-stretch",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "lg:col-span-8 bg-surface-container-low rounded-3xl relative overflow-hidden flex flex-col justify-between p-space-xl md:p-space-2xl min-h-[440px] shadow-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute inset-0 z-0 bg-cover bg-center",
											style: { backgroundImage: `url('${heroBanner?.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuCbMy1ghExJ7-a2yVEjsclWptdjYZIjvFHcy_NCGtWIQKXA8U6idZNaYmAApJuGPk_vYIetXbusIf6a0m30H-tD1o0NWK2ntUzznyvlJFaMyS4c1zRFgWxajT879uU1Gg7HxNxU139AOpCLCWZ1NvWRmQjEQd0wreLX1o7v1dFpQ3SXNGKwX06McDeI45kfTlc2ljGyIJ1DPi1xatizCypjaQmE0zxeOgeQ_R__MeC5"}')` }
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 z-0 bg-gradient-to-r from-surface-container-low via-surface-container-low/95 to-surface-container-low/30 backdrop-blur-[1px]" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative z-10 max-w-xl flex flex-col items-start gap-space-md",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-primary-fixed text-on-primary-fixed font-label-badge text-xs uppercase tracking-wider shadow-sm font-bold",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[15px]",
														style: { fontVariationSettings: "'FILL' 1" },
														children: "eco"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Harvest Fresh Guaranteed" })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
													className: "font-display-hero text-3xl md:text-5xl text-on-surface font-extrabold tracking-tight leading-tight",
													children: [
														"Direct from Heritage Farms to Kitchen in",
														" ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-primary underline decoration-secondary decoration-wavy decoration-2",
															children: "60 Mins"
														}),
														"."
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-body-lg text-body-lg text-on-surface-variant line-clamp-2",
													children: "South India's most authentic unpolished grains, artisanal wood-pressed oils, and farm-plucked morning greens delivered with single-store purity."
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-wrap items-center gap-space-sm pt-space-xs",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-space-sm bg-surface-container-lowest px-space-md py-2.5 rounded-xl shadow-sm border border-outline-variant/20",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-secondary font-black font-headline-sm text-sm",
																children: "FLAT 20% OFF"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-outline-variant" }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-body-sm text-xs text-on-surface-variant",
																children: "Code:"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-headline-sm text-xs text-primary bg-primary/10 px-2 py-0.5 rounded tracking-wide font-bold",
																children: "SMART20"
															})
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
														to: "/shop",
														className: "bg-primary hover:bg-primary-container text-on-primary font-label-button text-sm font-bold px-space-lg py-3 rounded-xl flex items-center gap-space-xs transition-all shadow-md active:scale-95 cursor-pointer",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Order Harvest Today" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[18px]",
															children: "arrow_forward"
														})]
													})]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative z-10 pt-space-xl flex items-center gap-space-lg text-on-surface-variant font-body-sm text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-space-xs",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-primary text-[18px]",
														children: "verified"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Zero Preservatives" })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-space-xs",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-primary text-[18px]",
														children: "speed"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Avg 38m Express Delivery" })]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "hidden sm:flex items-center gap-space-xs",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-secondary text-[18px]",
														children: "stars"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "4.9/5 Store Rating" })]
												})
											]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-space-md",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-lowest rounded-2xl p-space-md flex items-center gap-space-md shadow-sm transition-all hover:bg-surface-container-low border border-outline-variant/15 group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-12 h-12 rounded-xl bg-primary-fixed/60 text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[26px]",
													children: "local_shipping"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-sm font-bold text-on-surface",
													children: "Free Delivery on ₹499+"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-body-sm text-xs text-on-surface-variant truncate",
													children: "Zero packaging or surge fees"
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-lowest rounded-2xl p-space-md flex items-center gap-space-md shadow-sm transition-all hover:bg-surface-container-low border border-outline-variant/15 group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-12 h-12 rounded-xl bg-secondary-fixed/70 text-secondary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[26px]",
													children: "timer"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-sm font-bold text-on-surface",
													children: "60 Min Express Window"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-body-sm text-xs text-on-surface-variant truncate",
													children: "Direct electric fleet dispatch from hub"
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-lowest rounded-2xl p-space-md flex items-center gap-space-md shadow-sm transition-all hover:bg-surface-container-low border border-outline-variant/15 group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[26px]",
													children: "verified_user"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-sm font-bold text-on-surface",
													children: "100% Quality Assured"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-body-sm text-xs text-on-surface-variant truncate",
													children: "Doorstep inspection & immediate replacement"
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-lowest rounded-2xl p-space-md flex items-center gap-space-md shadow-sm transition-all hover:bg-surface-container-low border border-outline-variant/15 group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-12 h-12 rounded-xl bg-secondary-container text-on-secondary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[26px]",
													children: "monetization_on"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col min-w-0",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-sm font-bold text-on-surface",
													children: "Earn Smart Coins"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-body-sm text-xs text-on-surface-variant truncate",
													children: "Redeem directly against every basket"
												})]
											})]
										})
									]
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "max-w-[1320px] mx-auto px-margin-desktop w-full py-space-xl",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between mb-space-lg",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-label-badge text-xs uppercase tracking-wider text-primary font-bold",
										children: "Curated Aisles"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface",
										children: "Shop by Categories"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/shop",
									className: "font-headline-sm text-sm font-bold text-primary hover:underline flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "View All Aisles" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[18px]",
										children: "arrow_forward"
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-space-md overflow-x-auto pb-2 scrollbar-none",
								children: categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/shop",
									search: { category: cat.slug },
									className: "group flex flex-col items-center bg-surface-container-lowest p-space-md rounded-2xl shadow-sm transition-all hover:bg-surface-container-low text-center border border-outline-variant/15",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-20 h-20 rounded-full bg-surface-container-low overflow-hidden mb-space-sm p-1 shadow-inner group-hover:scale-105 transition-transform",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: cat.image,
												alt: cat.name,
												className: "w-full h-full object-cover rounded-full",
												loading: "lazy"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-headline-sm text-xs font-bold text-on-surface leading-snug",
											children: t(cat.name, cat.tamilName)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-body-sm text-[11px] text-on-surface-variant mt-0.5",
											children: cat.itemCount
										})
									]
								}, cat.id))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
							className: "max-w-[1320px] mx-auto px-margin-desktop w-full py-space-md",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-gradient-to-r from-[#2a1700] via-[#452700] to-[#1a0f00] text-[#ffddb8] rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative z-10 max-w-xl",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fea619]/20 text-[#fea619] font-headline-sm text-xs font-bold uppercase tracking-wider mb-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "workspace_premium"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sri Amman VIP Prestige Club" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-headline-lg text-2xl md:text-3xl font-extrabold text-white mb-2",
											children: "Unlock Exclusive Member Pricing on Every Order"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm opacity-90 leading-relaxed",
											children: "Spend ₹5,000 within 30 rolling calendar days on delivered orders to maintain active VIP status. Enjoy exclusive lower pricing, 2X Smart Coins, and priority express packing."
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "relative z-10 shrink-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/rewards",
										className: "bg-[#fea619] hover:bg-[#ffb95f] text-[#2a1700] px-6 py-3.5 rounded-2xl font-headline-sm text-sm font-extrabold flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Explore VIP Benefits" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[18px]",
											children: "arrow_forward"
										})]
									})
								})]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "max-w-[1320px] mx-auto px-margin-desktop w-full py-space-xl",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-label-badge text-xs uppercase tracking-wider text-primary font-bold",
									children: "Trusted Pantry"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-headline-lg text-2xl md:text-3xl text-on-surface font-extrabold",
									children: "Smart Store Best Sellers & Staples"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-space-xs bg-surface-container-low p-1.5 rounded-full overflow-x-auto scrollbar-none border border-outline-variant/20",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setActiveTab("all"),
											className: `px-space-md py-1.5 rounded-full font-label-button text-xs font-bold transition-all cursor-pointer ${activeTab === "all" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
											children: "All Items"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setActiveTab("cold-pressed-oils"),
											className: `px-space-md py-1.5 rounded-full font-label-button text-xs font-bold transition-all cursor-pointer ${activeTab === "cold-pressed-oils" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
											children: "Cold Pressed Oils"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setActiveTab("staples-grains"),
											className: `px-space-md py-1.5 rounded-full font-label-button text-xs font-bold transition-all cursor-pointer ${activeTab === "staples-grains" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
											children: "Heritage Rice"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setActiveTab("fruits-veggies"),
											className: `px-space-md py-1.5 rounded-full font-label-button text-xs font-bold transition-all cursor-pointer ${activeTab === "fruits-veggies" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
											children: "Farm Fresh Veggies"
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md",
								children: filteredBestSellers.slice(0, 8).map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, { product }, product.id))
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
//#endregion
export { HomePage as component };
