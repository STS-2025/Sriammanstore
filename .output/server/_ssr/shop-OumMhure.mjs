import { n as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as useSearch } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/@radix-ui/react-label+[...].mjs";
import { B as getMethodQualityCounts, F as getCatalogPriceBounds, G as getSubcategoryCounts, I as getCategoryCounts, P as filterAndSortProducts, Q as productService, U as getRatingCounts, V as getPackSizeOptions, g as StoreHeader, h as StoreFooter, it as useLanguage, n as BottomNav, u as METHOD_QUALITY_OPTIONS, z as getDiscountCounts } from "./StoreFooter-x22fBy-k.mjs";
import { t as ProductCard } from "./ProductCard-DNwJl7IP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/shop-OumMhure.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ShopPage() {
	const searchParams = useSearch({ from: "/shop" });
	const { t } = useLanguage();
	const [allProducts, setAllProducts] = (0, import_react.useState)([]);
	const [categories, setCategories] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const catalogMode = "production-readonly";
	const [productionDiagnostics, setProductionDiagnostics] = (0, import_react.useState)(null);
	const [selectedCategories, setSelectedCategories] = (0, import_react.useState)(searchParams.category && searchParams.category !== "all" ? [searchParams.category] : []);
	const [selectedSubcategories, setSelectedSubcategories] = (0, import_react.useState)(searchParams.subCategory && searchParams.subCategory !== "all" ? [searchParams.subCategory] : []);
	const [sortOption, setSortOption] = (0, import_react.useState)(searchParams.sort || "popular");
	const [onlyDeals, setOnlyDeals] = (0, import_react.useState)(!!searchParams.deals);
	const [inStockOnly, setInStockOnly] = (0, import_react.useState)(false);
	const [searchQuery, setSearchQuery] = (0, import_react.useState)(searchParams.q || "");
	const [priceRange, setPriceRange] = (0, import_react.useState)([0, 2e3]);
	const [minRating, setMinRating] = (0, import_react.useState)(0);
	const [minDiscount, setMinDiscount] = (0, import_react.useState)(0);
	const [selectedPackSizes, setSelectedPackSizes] = (0, import_react.useState)([]);
	const [selectedMethods, setSelectedMethods] = (0, import_react.useState)([]);
	const [isMobileFilterOpen, setIsMobileFilterOpen] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (searchParams.category) if (searchParams.category === "all") setSelectedCategories([]);
		else setSelectedCategories([searchParams.category]);
		if (searchParams.subCategory) if (searchParams.subCategory === "all") setSelectedSubcategories([]);
		else setSelectedSubcategories([searchParams.subCategory]);
		if (searchParams.q !== void 0) setSearchQuery(searchParams.q || "");
		if (searchParams.deals !== void 0) setOnlyDeals(Boolean(searchParams.deals));
		if (searchParams.sort) setSortOption(searchParams.sort);
	}, [
		searchParams.category,
		searchParams.subCategory,
		searchParams.q,
		searchParams.deals,
		searchParams.sort
	]);
	const loadCatalog = (0, import_react.useCallback)(async () => {
		setLoading(true);
		setError(null);
		const targetMode = catalogMode;
		try {
			productService.setCatalogMode(targetMode);
			const [categoriesData, productsData] = await Promise.all([productService.getCategories(), productService.getProducts()]);
			setCategories(categoriesData || []);
			setAllProducts(productsData || []);
			{
				const fullResult = await productService.getFullProductionCatalogueResult();
				if (fullResult?.diagnostics) setProductionDiagnostics({
					uniqueProductCount: fullResult.diagnostics.uniqueProductCount,
					totalRawDocuments: fullResult.diagnostics.totalRawDocuments,
					duplicateCount: fullResult.diagnostics.duplicateCount,
					posFieldsFilteredCount: fullResult.diagnostics.posFieldsFilteredCount,
					isPartial: fullResult.diagnostics.isPartial,
					isComplete: fullResult.diagnostics.isComplete,
					totalCategoryDocsRead: fullResult.diagnostics.categoryResolution?.totalCategoryDocsRead,
					fallbackCategoryCount: fullResult.diagnostics.categoryResolution?.fallbackCategoryCount,
					missingDocCategoryIds: fullResult.diagnostics.categoryResolution?.missingDocCategoryIds,
					conflictsCount: fullResult.diagnostics.categoryResolution?.conflicts.length,
					dataQualityErrors: fullResult.diagnostics.dataQualityReport?.errorCount,
					dataQualityWarnings: fullResult.diagnostics.dataQualityReport?.warningCount
				});
			}
			if (productsData && productsData.length > 0) {
				const bounds = getCatalogPriceBounds(productsData);
				setPriceRange([bounds.min, bounds.max]);
			}
		} catch (err) {
			console.error("Failed to load catalog:", err);
			setError(err?.message || "Failed to load product catalog. Please verify your connection or service status.");
		} finally {
			setLoading(false);
		}
	}, [catalogMode]);
	(0, import_react.useEffect)(() => {
		loadCatalog();
	}, [loadCatalog]);
	(0, import_react.useEffect)(() => {
		if (!isMobileFilterOpen) {
			document.body.style.overflow = "";
			return;
		}
		document.body.style.overflow = "hidden";
		const handleKeyDown = (e) => {
			if (e.key === "Escape") setIsMobileFilterOpen(false);
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			document.body.style.overflow = "";
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isMobileFilterOpen]);
	const catalogPriceBounds = (0, import_react.useMemo)(() => {
		return getCatalogPriceBounds(allProducts);
	}, [allProducts]);
	const categoryCounts = (0, import_react.useMemo)(() => getCategoryCounts(allProducts), [allProducts]);
	const subcategoryCounts = (0, import_react.useMemo)(() => getSubcategoryCounts(allProducts), [allProducts]);
	const packSizeOptions = (0, import_react.useMemo)(() => getPackSizeOptions(allProducts), [allProducts]);
	const methodQualityCounts = (0, import_react.useMemo)(() => getMethodQualityCounts(allProducts), [allProducts]);
	const ratingCounts = (0, import_react.useMemo)(() => getRatingCounts(allProducts), [allProducts]);
	const discountCounts = (0, import_react.useMemo)(() => getDiscountCounts(allProducts), [allProducts]);
	const currentFilterState = (0, import_react.useMemo)(() => ({
		categories: selectedCategories,
		subcategories: selectedSubcategories,
		inStockOnly,
		minPrice: priceRange[0],
		maxPrice: priceRange[1],
		minRating,
		minDiscount,
		packSizes: selectedPackSizes,
		methods: selectedMethods,
		sort: sortOption,
		search: searchQuery,
		onlyDeals
	}), [
		selectedCategories,
		selectedSubcategories,
		inStockOnly,
		priceRange,
		minRating,
		minDiscount,
		selectedPackSizes,
		selectedMethods,
		sortOption,
		searchQuery,
		onlyDeals
	]);
	const filteredProducts = (0, import_react.useMemo)(() => {
		return filterAndSortProducts(allProducts, currentFilterState, catalogPriceBounds);
	}, [
		allProducts,
		currentFilterState,
		catalogPriceBounds
	]);
	const activeFilterCount = (0, import_react.useMemo)(() => {
		let count = 0;
		if (selectedCategories.length > 0) count += selectedCategories.length;
		if (selectedSubcategories.length > 0) count += selectedSubcategories.length;
		if (inStockOnly) count++;
		if (priceRange[0] > catalogPriceBounds.min || priceRange[1] < catalogPriceBounds.max) count++;
		if (minRating > 0) count++;
		if (minDiscount > 0) count++;
		if (selectedPackSizes.length > 0) count += selectedPackSizes.length;
		if (selectedMethods.length > 0) count += selectedMethods.length;
		if (onlyDeals) count++;
		if (searchQuery.trim().length > 0) count++;
		return count;
	}, [
		selectedCategories,
		selectedSubcategories,
		inStockOnly,
		priceRange,
		catalogPriceBounds,
		minRating,
		minDiscount,
		selectedPackSizes,
		selectedMethods,
		onlyDeals,
		searchQuery
	]);
	const handleResetFilters = () => {
		setSelectedCategories([]);
		setSelectedSubcategories([]);
		setInStockOnly(false);
		setPriceRange([catalogPriceBounds.min, catalogPriceBounds.max]);
		setMinRating(0);
		setMinDiscount(0);
		setSelectedPackSizes([]);
		setSelectedMethods([]);
		setOnlyDeals(false);
		setSearchQuery("");
		setSortOption("popular");
	};
	const handleToggleCategory = (slug) => {
		setSelectedCategories((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
	};
	const handleToggleSubcategory = (sub) => {
		setSelectedSubcategories((prev) => prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]);
	};
	const handleSelectQuickCategory = (slug) => {
		if (slug === "all") setSelectedCategories([]);
		else setSelectedCategories([slug]);
	};
	const handleTogglePackSize = (sizeLabel) => {
		setSelectedPackSizes((prev) => prev.includes(sizeLabel) ? prev.filter((s) => s !== sizeLabel) : [...prev, sizeLabel]);
	};
	const handleToggleMethod = (methodId) => {
		setSelectedMethods((prev) => prev.includes(methodId) ? prev.filter((m) => m !== methodId) : [...prev, methodId]);
	};
	const handleMinPriceChange = (value) => {
		const safeVal = Math.max(catalogPriceBounds.min, Math.min(value, priceRange[1]));
		setPriceRange([safeVal, priceRange[1]]);
	};
	const handleMaxPriceChange = (value) => {
		const safeVal = Math.min(catalogPriceBounds.max, Math.max(value, priceRange[0]));
		setPriceRange([priceRange[0], safeVal]);
	};
	const activeCategoryTitle = (0, import_react.useMemo)(() => {
		if (selectedCategories.length === 1) {
			const match = categories.find((c) => c.slug === selectedCategories[0]);
			return match ? t(match.name, match.tamilName) : "Shop Catalog";
		}
		if (selectedCategories.length > 1) return `Filtered Catalog (${selectedCategories.length} Categories)`;
		return "Explore All Aisles & Produce";
	}, [
		selectedCategories,
		categories,
		t
	]);
	const renderFilterSections = () => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-space-lg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between p-3 bg-surface-container-low rounded-xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-headline-sm text-xs md:text-sm font-bold text-on-surface",
						children: "Available in Store"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-body-sm text-[11px] text-on-surface-variant",
						children: "Exclude out of stock items"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "relative inline-flex items-center cursor-pointer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: inStockOnly,
						onChange: (e) => setInStockOnly(e.target.checked),
						className: "sr-only peer",
						"aria-label": "Toggle in stock only"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-11 h-6 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-headline-sm text-xs font-bold text-on-surface tracking-wide uppercase",
						children: "Categories"
					}), selectedCategories.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setSelectedCategories([]),
						className: "text-[11px] text-tertiary font-bold hover:underline cursor-pointer",
						children: "Clear"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-1 text-xs",
					children: categories.map((cat) => {
						const isChecked = selectedCategories.includes(cat.slug);
						const count = categoryCounts[cat.slug] || 0;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer group transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: isChecked,
										onChange: () => handleToggleCategory(cat.slug),
										className: "w-4 h-4 rounded text-primary accent-primary focus:ring-0 cursor-pointer"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `transition-colors ${isChecked ? "font-bold text-primary" : "font-medium text-on-surface group-hover:text-primary"}`,
										children: t(cat.name, cat.tamilName)
									}),
									cat.source === "product-fallback" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300",
										children: "Fallback"
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full",
								children: count
							})]
						}, cat.id);
					})
				})]
			}),
			Object.keys(subcategoryCounts).length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-headline-sm text-xs font-bold text-on-surface tracking-wide uppercase",
						children: "Subcategories"
					}), selectedSubcategories.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setSelectedSubcategories([]),
						className: "text-[11px] text-tertiary font-bold hover:underline cursor-pointer",
						children: "Clear"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-1 text-xs",
					children: Object.entries(subcategoryCounts).map(([subName, count]) => {
						const isChecked = selectedSubcategories.includes(subName);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer group transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: isChecked,
									onChange: () => handleToggleSubcategory(subName),
									className: "w-4 h-4 rounded text-primary accent-primary focus:ring-0 cursor-pointer"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `transition-colors ${isChecked ? "font-bold text-primary" : "font-medium text-on-surface group-hover:text-primary"}`,
									children: subName
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full",
								children: count
							})]
						}, subName);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wide",
							children: "Price Range"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-headline-sm text-xs font-bold text-primary",
							children: [
								"₹",
								priceRange[0],
								" – ₹",
								priceRange[1]
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-full relative py-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: catalogPriceBounds.min,
							max: catalogPriceBounds.max,
							step: 10,
							value: priceRange[1],
							onChange: (e) => handleMaxPriceChange(Number(e.target.value)),
							className: "w-full accent-primary cursor-pointer",
							"aria-label": "Filter maximum price slider"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 bg-surface-container-low px-2 py-1.5 rounded-lg flex items-center border border-outline-variant/30 focus-within:border-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-on-surface-variant pr-1 font-bold",
									children: "₹"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: catalogPriceBounds.min,
									max: priceRange[1],
									value: priceRange[0],
									onChange: (e) => handleMinPriceChange(Number(e.target.value)),
									className: "w-full bg-transparent font-headline-sm text-xs font-bold text-on-surface focus:outline-none",
									"aria-label": "Minimum price"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-on-surface-variant text-xs font-bold",
								children: "to"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 bg-surface-container-low px-2 py-1.5 rounded-lg flex items-center border border-outline-variant/30 focus-within:border-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-on-surface-variant pr-1 font-bold",
									children: "₹"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: priceRange[0],
									max: catalogPriceBounds.max,
									value: priceRange[1],
									onChange: (e) => handleMaxPriceChange(Number(e.target.value)),
									className: "w-full bg-transparent font-headline-sm text-xs font-bold text-on-surface focus:outline-none",
									"aria-label": "Maximum price"
								})]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wide",
						children: "Customer Rating"
					}), minRating > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setMinRating(0),
						className: "text-[11px] text-tertiary font-bold hover:underline cursor-pointer",
						children: "Reset"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "radio",
								name: "rating_filter",
								checked: minRating === 0,
								onChange: () => setMinRating(0),
								className: "text-primary accent-primary cursor-pointer"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-on-surface",
								children: "Any Rating"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-bold text-on-surface-variant",
							children: allProducts.length
						})]
					}), ratingCounts.map(({ rating, count }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "radio",
									name: "rating_filter",
									checked: minRating === rating,
									onChange: () => setMinRating(rating),
									className: "text-primary accent-primary cursor-pointer"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-0.5 text-secondary",
									children: [...Array(5)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[15px]",
										style: i < Math.floor(rating) ? { fontVariationSettings: "'FILL' 1" } : {},
										children: "star"
									}, i))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-semibold text-on-surface",
									children: [rating, "★ & above"]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full",
							children: count
						})]
					}, rating))]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wide",
						children: "Discount"
					}), minDiscount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setMinDiscount(0),
						className: "text-[11px] text-tertiary font-bold hover:underline cursor-pointer",
						children: "Reset"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-1 text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "radio",
								name: "discount_filter",
								checked: minDiscount === 0,
								onChange: () => setMinDiscount(0),
								className: "text-primary accent-primary cursor-pointer"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-on-surface",
								children: "All Discounts"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-bold text-on-surface-variant",
							children: allProducts.length
						})]
					}), discountCounts.map(({ discount, count }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "radio",
								name: "discount_filter",
								checked: minDiscount === discount,
								onChange: () => setMinDiscount(discount),
								className: "text-primary accent-primary cursor-pointer"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-semibold text-on-surface",
								children: [discount, "% and above"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full",
							children: count
						})]
					}, discount))]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wide",
						children: "Pack Size / Volume"
					}), selectedPackSizes.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setSelectedPackSizes([]),
						className: "text-[11px] text-tertiary font-bold hover:underline cursor-pointer",
						children: "Clear"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1.5",
					children: packSizeOptions.map(({ label, count }) => {
						const isSelected = selectedPackSizes.includes(label);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => handleTogglePackSize(label),
							className: `px-2.5 py-1 text-[11px] font-headline-sm rounded-lg transition-all cursor-pointer flex items-center gap-1 ${isSelected ? "bg-primary text-white font-bold shadow-sm" : "bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: `text-[9px] ${isSelected ? "text-white/80" : "text-on-surface-variant"}`,
								children: [
									"(",
									count,
									")"
								]
							})]
						}, label);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wide",
						children: "Method & Quality"
					}), selectedMethods.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setSelectedMethods([]),
						className: "text-[11px] text-tertiary font-bold hover:underline cursor-pointer",
						children: "Clear"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-1 text-xs",
					children: METHOD_QUALITY_OPTIONS.map((opt) => {
						const isChecked = selectedMethods.includes(opt.id);
						const count = methodQualityCounts[opt.id] || 0;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low cursor-pointer group",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: isChecked,
									onChange: () => handleToggleMethod(opt.id),
									className: "w-4 h-4 rounded text-primary accent-primary focus:ring-0 cursor-pointer"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `transition-colors ${isChecked ? "font-bold text-primary" : "font-medium text-on-surface group-hover:text-primary"}`,
									children: opt.label
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full",
								children: count
							})]
						}, opt.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-3 bg-secondary-fixed/30 rounded-xl flex items-start gap-2.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "material-symbols-outlined text-secondary text-[22px] shrink-0",
					children: "workspace_premium"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-headline-sm text-xs font-bold text-on-secondary-fixed",
						children: "Amman Smart VIP"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-body-sm text-[11px] text-on-secondary-fixed-variant leading-tight mt-0.5",
						children: "Save an extra 5% to 8% automatically on all authentic cold-pressed & artisanal staples."
					})]
				})]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "w-full bg-surface-container-high py-2 px-margin-desktop text-on-surface border-b border-outline-variant/15",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-[1320px] mx-auto flex flex-wrap items-center justify-between text-xs gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-primary animate-pulse" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-headline-sm text-xs font-bold text-primary",
									children: "Express Dispatch Active:"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-on-surface-variant",
									children: "Same-day batch delivery for cold-pressed extractions across local neighborhoods."
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-headline-sm text-[10px] bg-surface-container-lowest px-2 py-0.5 rounded text-primary font-bold shadow-sm",
								children: "100% MARA CHEKKU VERIFIED"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-on-surface-variant hidden sm:inline",
								children: "Lab Purity Reports Included"
							})]
						})]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-[1320px] mx-auto px-margin-desktop py-space-md",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							"aria-label": "Breadcrumb",
							className: "mb-3 flex items-center gap-2 text-xs text-on-surface-variant",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "hover:text-primary transition-colors flex items-center gap-1 cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[15px]",
										children: "home"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Home" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[13px] text-outline-variant",
									children: "chevron_right"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hover:text-primary transition-colors cursor-pointer",
									children: "Catalog"
								}),
								selectedCategories.length === 1 && selectedCategories[0] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[13px] text-outline-variant",
									children: "chevron_right"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-on-surface capitalize",
									children: selectedCategories[0].replace("-", " ")
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
							className: "mb-6 flex flex-col gap-4 bg-surface-container-lowest p-4 md:p-6 rounded-2xl shadow-sm border border-outline-variant/15",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-end justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex items-center gap-2",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-on-surface-variant",
												children: loading ? "Loading..." : "Verified Quality"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
											className: "font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight mt-1",
											children: activeCategoryTitle
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "font-body-sm text-xs text-on-surface-variant mt-0.5",
											children: [
												"Showing",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
													className: "text-on-surface font-bold",
													children: [
														filteredProducts.length,
														" ",
														"production",
														" items"
													]
												}),
												" ",
												"from the live production Firestore catalogue (sri-amman-smart-store)."
											]
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setIsMobileFilterOpen(true),
											className: "lg:hidden flex items-center gap-1.5 bg-primary-fixed text-on-primary-fixed px-3.5 py-2 rounded-xl font-headline-sm text-xs font-bold shadow-sm transition-all cursor-pointer active:scale-95",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px]",
													children: "tune"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Filters" }),
												activeFilterCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "bg-primary text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black",
													children: activeFilterCount
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-xl",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px] text-on-surface-variant",
													children: "sort"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													htmlFor: "sortDropdown",
													className: "text-xs font-medium text-on-surface-variant whitespace-nowrap",
													children: "Sort:"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
													id: "sortDropdown",
													value: sortOption,
													onChange: (e) => setSortOption(e.target.value),
													className: "bg-transparent text-xs font-headline-sm font-bold text-primary focus:outline-none cursor-pointer",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "popular",
															children: "Most Popular"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "rating",
															children: "Customer Rating (Highest)"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "price_asc",
															children: "Price: Low to High"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "price_desc",
															children: "Price: High to Low"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
															value: "discount",
															children: "Biggest Discount (%)"
														})
													]
												})
											]
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-t border-outline-variant/15 pt-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => handleSelectQuickCategory("all"),
											className: `px-3 py-1.5 rounded-full font-headline-sm text-xs font-bold shrink-0 transition-all cursor-pointer ${selectedCategories.length === 0 ? "bg-primary text-white shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`,
											children: [
												"All Aisles (",
												allProducts.length,
												")"
											]
										}),
										categories.map((cat) => {
											const isActive = selectedCategories.length === 1 && selectedCategories[0] === cat.slug;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => handleSelectQuickCategory(cat.slug),
												className: `px-3 py-1.5 rounded-full font-headline-sm text-xs font-bold shrink-0 transition-all cursor-pointer ${isActive ? "bg-primary text-white shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`,
												children: t(cat.name, cat.tamilName)
											}, cat.id);
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-4 w-px bg-outline-variant/30 shrink-0 mx-1" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setOnlyDeals((prev) => !prev),
											className: `px-3 py-1.5 rounded-full font-headline-sm text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${onlyDeals ? "bg-tertiary text-white shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "%" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Flash Deals" })]
										})
									]
								}),
								activeFilterCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2 pt-2 bg-surface-container-low/60 p-2.5 rounded-xl border border-outline-variant/15",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs font-headline-sm font-bold text-on-surface-variant flex items-center gap-1 pl-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "tune"
											}), "Active:"]
										}),
										searchQuery && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"Search: \"",
												searchQuery,
												"\""
											] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setSearchQuery(""),
												className: "hover:text-error cursor-pointer flex items-center",
												title: "Clear search",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[14px]",
													children: "close"
												})
											})]
										}),
										onlyDeals && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-tertiary font-headline-sm text-xs font-bold rounded-full shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Flash Deals Only" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setOnlyDeals(false),
												className: "hover:text-error cursor-pointer flex items-center",
												title: "Clear deals filter",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[14px]",
													children: "close"
												})
											})]
										}),
										selectedCategories.map((slug) => {
											const cat = categories.find((c) => c.slug === slug);
											const label = cat ? t(cat.name, cat.tamilName) : slug;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => handleToggleCategory(slug),
													className: "hover:text-error cursor-pointer flex items-center",
													title: `Remove ${label}`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[14px]",
														children: "close"
													})
												})]
											}, slug);
										}),
										inStockOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "In Stock Only" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setInStockOnly(false),
												className: "hover:text-error cursor-pointer flex items-center",
												title: "Remove stock filter",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[14px]",
													children: "close"
												})
											})]
										}),
										(priceRange[0] > catalogPriceBounds.min || priceRange[1] < catalogPriceBounds.max) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"₹",
												priceRange[0],
												" – ₹",
												priceRange[1]
											] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setPriceRange([catalogPriceBounds.min, catalogPriceBounds.max]),
												className: "hover:text-error cursor-pointer flex items-center",
												title: "Reset price range",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[14px]",
													children: "close"
												})
											})]
										}),
										minRating > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"Rating ",
												minRating,
												"★+"
											] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setMinRating(0),
												className: "hover:text-error cursor-pointer flex items-center",
												title: "Clear rating filter",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[14px]",
													children: "close"
												})
											})]
										}),
										minDiscount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [minDiscount, "%+ OFF"] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setMinDiscount(0),
												className: "hover:text-error cursor-pointer flex items-center",
												title: "Clear discount filter",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[14px]",
													children: "close"
												})
											})]
										}),
										selectedPackSizes.map((size) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: size }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => handleTogglePackSize(size),
												className: "hover:text-error cursor-pointer flex items-center",
												title: `Remove pack size ${size}`,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[14px]",
													children: "close"
												})
											})]
										}, size)),
										selectedMethods.map((methodId) => {
											const opt = METHOD_QUALITY_OPTIONS.find((m) => m.id === methodId);
											const label = opt ? opt.label : methodId;
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "inline-flex items-center gap-1 px-2.5 py-1 bg-surface-container-lowest text-primary font-headline-sm text-xs font-bold rounded-full shadow-sm",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => handleToggleMethod(methodId),
													className: "hover:text-error cursor-pointer flex items-center",
													title: `Remove ${label}`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[14px]",
														children: "close"
													})
												})]
											}, methodId);
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: handleResetFilters,
											className: "font-headline-sm text-xs font-bold text-tertiary hover:underline px-2 py-1 ml-auto cursor-pointer",
											children: "Reset All Filters"
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
								className: "hidden lg:flex lg:col-span-3 bg-surface-container-lowest p-space-lg rounded-2xl shadow-sm border border-outline-variant/15 flex-col gap-space-lg sticky top-[190px] max-h-[calc(100vh-210px)] overflow-y-auto scrollbar-none",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between pb-2 border-b border-outline-variant/15",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
										className: "font-headline-sm text-sm font-bold text-on-surface flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-primary text-[20px]",
											children: "filter_list"
										}), "Refine Catalog"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[10px] font-headline-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full font-bold",
											children: [filteredProducts.length, " Items"]
										}), activeFilterCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: handleResetFilters,
											className: "text-[11px] font-bold text-tertiary hover:underline cursor-pointer",
											children: "Reset"
										})]
									})]
								}), renderFilterSections()]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
								className: "lg:col-span-9 flex flex-col gap-space-lg",
								children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-space-md py-4",
									children: [...Array(6)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "bg-surface-container-low rounded-2xl aspect-[4/5] animate-pulse" }, i))
								}) : error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-surface-container-lowest rounded-3xl p-12 text-center max-w-lg mx-auto border border-error/30 my-8 shadow-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center text-3xl mx-auto mb-4",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[32px]",
												children: "error"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-headline-lg text-lg font-bold text-on-surface mb-2",
											children: "Failed to Load Catalog"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-body-sm text-xs text-on-surface-variant mb-6",
											children: error
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex flex-wrap items-center justify-center gap-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => loadCatalog(),
												className: "bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer",
												children: "Retry Loading"
											})
										})
									]
								}) : filteredProducts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-surface-container-lowest rounded-3xl p-12 text-center max-w-lg mx-auto border border-outline-variant/20 my-8 shadow-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-3xl mx-auto mb-4",
											children: "🌾"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-headline-lg text-lg font-bold text-on-surface mb-2",
											children: "No Harvest Items Found"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-body-sm text-xs text-on-surface-variant mb-6",
											children: "We couldn't find items matching your active category or filter combination. Try broadening your price range or clearing selected filters."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex flex-wrap items-center justify-center gap-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: handleResetFilters,
												className: "bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer",
												children: "Reset All Filters"
											})
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-space-md",
										children: filteredProducts.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, {
											product,
											readOnly: false
										}, product.id))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/15 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-on-surface-variant",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											"Showing",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
												className: "text-on-surface font-semibold",
												children: ["1 – ", filteredProducts.length]
											}),
											" ",
											"of",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
												className: "text-on-surface font-semibold",
												children: allProducts.length
											}),
											" ",
											"production",
											" items",
											productionDiagnostics && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[11px] text-on-surface-variant block mt-0.5",
												children: [
													"(Resolved from ",
													productionDiagnostics.totalRawDocuments,
													" raw Firestore docs • ",
													productionDiagnostics.duplicateCount,
													" duplicates merged via deterministic precedence)"
												]
											})
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1 text-primary font-semibold",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "verified"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "100% Quality Guaranteed" })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
										className: "bg-surface-container p-space-lg rounded-xl grid grid-cols-1 md:grid-cols-3 gap-space-md mt-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-primary text-[28px]",
													children: "thermostat"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
													className: "font-headline-sm text-xs font-bold text-on-surface",
													children: "Cold Extracted (<38°C)"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-body-sm text-[11px] text-on-surface-variant mt-0.5",
													children: "Wood-churned at strictly controlled ambient temperatures to preserve polyphenols & micronutrients."
												})] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-primary text-[28px]",
													children: "no_drinks"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
													className: "font-headline-sm text-xs font-bold text-on-surface",
													children: "Zero Chemical Refining"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-body-sm text-[11px] text-on-surface-variant mt-0.5",
													children: "No bleaching, zero trans fats, and absolutely free from artificial solvents or preservatives."
												})] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-secondary text-[28px]",
													children: "stars"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
													className: "font-headline-sm text-xs font-bold text-on-surface",
													children: "FSSAI Certified Freshness"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-body-sm text-[11px] text-on-surface-variant mt-0.5",
													children: "Batch testing certificates available upon scan of the QR code on every bottle label."
												})] })]
											})
										]
									})
								] })
							})]
						})
					]
				})]
			}),
			isMobileFilterOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "dialog",
				"aria-modal": "true",
				"aria-label": "Filter catalog",
				className: "fixed inset-0 z-50 flex justify-end",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					onClick: () => setIsMobileFilterOpen(false),
					className: "fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-md bg-surface-container-lowest h-full z-10 shadow-2xl flex flex-col",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between p-4 border-b border-outline-variant/20 bg-surface-container-lowest",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-primary text-[22px]",
										children: "tune"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-headline-sm text-base font-bold text-on-surface",
										children: "Refine Catalog"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full",
										children: [filteredProducts.length, " Results"]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setIsMobileFilterOpen(false),
								className: "w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer",
								title: "Close filters",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[20px]",
									children: "close"
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 overflow-y-auto p-4 scrollbar-none",
							children: renderFilterSections()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 border-t border-outline-variant/20 bg-surface-container-lowest flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: handleResetFilters,
								className: "flex-1 py-2.5 px-4 rounded-xl font-headline-sm text-xs font-bold bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer text-center",
								children: "Clear All"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setIsMobileFilterOpen(false),
								className: "flex-1 py-2.5 px-4 rounded-xl font-headline-sm text-xs font-bold bg-primary text-white hover:bg-primary-container transition-colors shadow-md cursor-pointer text-center",
								children: [
									"Apply (",
									filteredProducts.length,
									")"
								]
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
//#endregion
export { ShopPage as component };
