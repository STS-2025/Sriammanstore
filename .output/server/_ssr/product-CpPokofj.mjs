import { n as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { S as useSearch, b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/@radix-ui/react-label+[...].mjs";
import { L as getComplementaryProducts, Q as productService, W as getSimilarProducts, g as StoreHeader, h as StoreFooter, it as useLanguage, n as BottomNav, nt as useAuth, ot as useWishlist, rt as useCart } from "./StoreFooter-x22fBy-k.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as ProductCard } from "./ProductCard-DNwJl7IP.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/product-CpPokofj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProductDetailsPage() {
	const productId = useSearch({ from: "/product" }).id || "prod_groundnut_oil";
	const { user } = useAuth();
	const { addToCart } = useCart();
	const { isWishlisted, toggleWishlist } = useWishlist();
	const { t } = useLanguage();
	const [product, setProduct] = (0, import_react.useState)(null);
	const [similarProducts, setSimilarProducts] = (0, import_react.useState)([]);
	const [complementaryProducts, setComplementaryProducts] = (0, import_react.useState)([]);
	const [selectedOptIndex, setSelectedOptIndex] = (0, import_react.useState)(0);
	const [activeImageIndex, setActiveImageIndex] = (0, import_react.useState)(0);
	const [imageError, setImageError] = (0, import_react.useState)(false);
	const [quantity, setQuantity] = (0, import_react.useState)(1);
	const [activeTab, setActiveTab] = (0, import_react.useState)("specs");
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const isProductionMode = productService.getCatalogMode() === "production-readonly";
	const loadProduct = async () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth"
		});
		setLoading(true);
		setError(null);
		setImageError(false);
		try {
			const item = await productService.getProductById(productId);
			setProduct(item);
			setSelectedOptIndex(0);
			setActiveImageIndex(0);
			setQuantity(1);
			if (item) {
				const all = await productService.getProducts();
				const similar = getSimilarProducts(item, all, { limit: 4 });
				const similarIds = similar.map((p) => p.id);
				const complementary = getComplementaryProducts(item, all, {
					limit: 4,
					excludeIds: similarIds
				});
				setSimilarProducts(similar);
				setComplementaryProducts(complementary);
			} else {
				setSimilarProducts([]);
				setComplementaryProducts([]);
			}
		} catch (err) {
			console.error("Failed to load product details:", err);
			setError(err?.message || "Failed to load product details. Please check your connection.");
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		loadProduct();
	}, [productId]);
	if (loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] max-w-[1320px] mx-auto px-margin-desktop py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "animate-pulse flex flex-col md:flex-row gap-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "md:w-1/2 aspect-square bg-surface-container-low rounded-3xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "md:w-1/2 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 bg-surface-container-low rounded w-3/4" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-4 bg-surface-container-low rounded w-1/2" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-12 bg-surface-container-low rounded w-1/3" })
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	if (error) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1320px] mx-auto px-margin-desktop py-16 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center text-3xl mx-auto mb-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined text-[32px]",
							children: "error"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-2xl font-bold mb-2",
						children: "Error Loading Product"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-on-surface-variant mb-6 text-sm",
						children: error
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: loadProduct,
							className: "bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-sm font-bold shadow-md cursor-pointer",
							children: "Retry"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/shop",
							className: "bg-surface-container text-on-surface px-6 py-2.5 rounded-xl font-headline-sm text-sm font-bold shadow-sm",
							children: "Back to Catalog"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	if (!product) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1320px] mx-auto px-margin-desktop py-16 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-2xl font-bold mb-4",
						children: "Product Not Found"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-on-surface-variant mb-6 text-sm",
						children: "We couldn't locate the requested product in our harvest database."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/shop",
						className: "bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-sm font-bold shadow-md",
						children: "Back to Catalog"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	const currentOption = product.options[selectedOptIndex] || product.options[0];
	if (!currentOption) return null;
	const images = product.images?.length > 0 ? product.images : [product.imageUrl];
	const activeImage = images[activeImageIndex] || product.imageUrl;
	const wishlisted = isWishlisted(product.id);
	const isVip = !!user?.isVIP;
	const currentPrice = isVip && currentOption.specialPrice ? currentOption.specialPrice : currentOption.offerPrice;
	const discountPercent = currentOption.mrp > currentOption.offerPrice ? Math.round((currentOption.mrp - currentOption.offerPrice) / currentOption.mrp * 100) : 0;
	const handleAddToCart = async () => {
		try {
			await addToCart(product, selectedOptIndex, quantity);
			toast.success(`Added ${quantity}x ${product.name} (${currentOption.unitSize}${currentOption.unit}) to cart`);
		} catch (err) {
			toast.error(err.message || "Failed to add to cart");
		}
	};
	const handleToggleWishlist = async () => {
		try {
			if (await toggleWishlist(product, selectedOptIndex)) toast.success("Saved to your wishlist");
			else toast.info("Removed from wishlist");
		} catch (err) {
			toast.error(err.message || "Could not update wishlist");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-full bg-surface-container-low border-b border-outline-variant/15",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-[1320px] mx-auto px-margin-desktop py-space-sm flex flex-wrap items-center justify-between gap-space-sm text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
								className: "flex items-center space-x-2 text-on-surface-variant",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/",
										className: "hover:text-primary transition-colors flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[16px]",
											children: "home"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Home" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-outline-variant font-bold",
										children: "/"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/shop",
										search: { category: product.categorySlug },
										className: "hover:text-primary transition-colors",
										children: product.category
									}),
									product.subCategory && product.subCategory !== product.category && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-outline-variant font-bold",
										children: "/"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-on-surface-variant font-medium",
										children: product.subCategory
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-outline-variant font-bold",
										children: "/"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-on-surface font-headline-sm font-semibold truncate max-w-[240px] md:max-w-none",
										children: product.name
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden sm:flex items-center gap-2 text-secondary font-headline-sm text-xs font-semibold bg-secondary-fixed/40 px-3 py-1 rounded-full",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[16px]",
									children: "verified"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "100% Single-Store Authenticity • Pressed Locally" })]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "max-w-[1320px] w-full mx-auto px-margin-desktop py-space-xl",
						children: [isProductionMode && product.id === "prod-munn8cp3" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"data-testid": "production-product-anomaly-banner",
							className: "p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-sm mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "material-symbols-outlined text-amber-600 text-[22px] shrink-0 mt-0.5",
								children: "warning"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "leading-relaxed",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
										className: "block mb-0.5 text-sm font-bold",
										children: "Diagnostic Notice: Stored Packaging Discrepancy"
									}),
									"The stored photograph in production Firestore (",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "products/prod-munn8cp3" }),
									") shows a 20g packet of ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Sakthi Puliyogare Rice Powder" }),
									" (Barcode ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "8906002081042" }),
									") rather than Chicken Masala. This discrepancy originates strictly within the production database document and is faithfully displayed here for audit purposes."
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-6 flex flex-col gap-space-md",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative bg-surface-container-lowest rounded-3xl shadow-sm overflow-hidden group border border-outline-variant/20",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none",
												children: [discountPercent > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary text-on-tertiary font-label-badge text-xs tracking-wider shadow-md font-bold uppercase",
													children: [discountPercent, "% OFF"]
												}), product.tags?.[0] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-on-primary font-label-badge text-xs tracking-wider shadow-sm uppercase font-bold",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[14px]",
														children: "spa"
													}), product.tags[0]]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "relative w-full aspect-square flex items-center justify-center p-6 bg-surface-container-low transition-all overflow-hidden",
												children: activeImage && !imageError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: activeImage,
													alt: product.name,
													className: "max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 ease-out drop-shadow-md select-none",
													onError: () => setImageError(true)
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-col items-center justify-center text-outline gap-2 p-6 select-none",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[64px] text-outline-variant",
														children: "inventory_2"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs font-semibold text-on-surface-variant font-mono",
														children: product.name
													})]
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-surface-container px-space-md py-2.5 flex items-center justify-between text-on-surface-variant text-xs",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-center gap-1.5 text-primary font-semibold",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[18px]",
														children: "verified_user"
													}), "Single-Store Authenticity Guarantee"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "bg-surface-container-lowest px-2 py-0.5 rounded text-on-surface font-mono",
													children: "Batch #TN-2026"
												})]
											})
										]
									}),
									images.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-4 gap-space-sm",
										children: images.map((img, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												setActiveImageIndex(idx);
												setImageError(false);
											},
											className: `relative aspect-square rounded-2xl bg-surface-container-lowest p-2 shadow-sm transition-all overflow-hidden flex items-center justify-center cursor-pointer ${activeImageIndex === idx ? "ring-2 ring-primary bg-primary/5" : "hover:bg-surface-container opacity-70"}`,
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: img,
												alt: `View ${idx + 1}`,
												className: "max-w-full max-h-full object-contain select-none"
											})
										}, idx))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between pt-space-xs gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: handleToggleWishlist,
											className: `flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl shadow-sm transition-all cursor-pointer border border-outline-variant/20 ${wishlisted ? "bg-tertiary-fixed text-on-tertiary-fixed font-bold" : "bg-surface-container-lowest hover:bg-surface-container-high text-on-surface"}`,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[20px] text-tertiary",
												style: wishlisted ? { fontVariationSettings: "'FILL' 1" } : {},
												children: "favorite"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-headline-sm text-xs font-bold",
												children: wishlisted ? "Saved in Wishlist" : "Save to Wishlist"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
											href: `https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out ${product.name} at Sri Amman Smart Store: https://sriammanstore.com/product?id=${product.id}`)}`,
											target: "_blank",
											rel: "noreferrer",
											className: "w-12 h-12 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] flex items-center justify-center transition-all shadow-sm shrink-0",
											title: "Share on WhatsApp",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[22px]",
												children: "chat"
											})
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-6 flex flex-col gap-space-lg",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary font-headline-sm text-xs font-bold uppercase tracking-wider",
													children: product.brand
												}), currentOption.stock > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-xs font-semibold text-primary flex items-center gap-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-primary animate-pulse" }),
														"In Stock (",
														currentOption.stock,
														" available)"
													]
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-xs font-semibold text-outline flex items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-outline" }), "Out of Stock"]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
												className: "font-headline-lg text-2xl md:text-3xl text-on-surface font-extrabold tracking-tight leading-tight",
												children: t(product.name, product.tamilName)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-body-md text-sm text-on-surface-variant leading-relaxed",
												children: product.description
											}),
											typeof product.rating === "number" && typeof product.reviewCount === "number" && product.rating > 0 && product.reviewCount > 0 && !Number.isNaN(product.rating) && !Number.isNaN(product.reviewCount) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												"data-testid": "product-details-rating",
												className: "flex items-center gap-3 pt-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "inline-flex items-center gap-1 bg-primary text-on-primary px-2.5 py-1 rounded-lg font-headline-sm text-xs font-bold shadow-sm",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: product.rating }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[14px]",
														style: { fontVariationSettings: "'FILL' 1" },
														children: "star"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-xs text-on-surface-variant font-medium",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "text-on-surface font-semibold",
															children: product.reviewCount
														}),
														" ",
														"Verified Ratings"
													]
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-surface-container-lowest p-space-lg rounded-3xl shadow-sm flex flex-col gap-3 border border-outline-variant/20",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-baseline gap-space-sm",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "font-price-hero text-3xl font-extrabold text-on-surface tracking-tight",
														children: ["₹", currentPrice]
													}),
													currentOption.mrp > currentOption.offerPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "font-price-mrp text-sm text-outline line-through",
														children: ["MRP ₹", currentOption.mrp]
													}),
													discountPercent > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "inline-flex items-center px-2.5 py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container font-label-badge text-xs font-bold",
														children: [
															discountPercent,
															"% OFF (Save ₹",
															currentOption.mrp - currentPrice,
															")"
														]
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-on-surface-variant font-medium",
												children: "Inclusive of all taxes • Harvested directly from native farms"
											}),
											currentOption.specialPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between p-3 rounded-2xl bg-secondary-fixed/30 text-on-secondary-fixed border border-secondary-fixed/50",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[18px]",
															children: "workspace_premium"
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "font-headline-sm text-xs font-bold leading-tight",
														children: ["Sri Amman VIP Price: ₹", currentOption.specialPrice]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-[11px] text-on-secondary-fixed-variant",
														children: isVip ? "Active VIP discount applied to your account" : "Unlock extra savings + 2X Smart Coins"
													})] })]
												}), !isVip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
													to: "/rewards",
													className: "px-3 py-1 bg-secondary text-on-secondary rounded-lg font-headline-sm text-[11px] font-bold",
													children: "Join VIP"
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col gap-2.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "font-headline-sm text-xs font-bold text-on-surface uppercase tracking-wider",
												children: "Select Pack Size:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-primary font-semibold",
												children: [
													currentOption.unitSize,
													currentOption.unit,
													" Selected"
												]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid grid-cols-2 sm:grid-cols-4 gap-space-sm",
											children: product.options.map((opt, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => setSelectedOptIndex(idx),
												className: `text-left p-3 rounded-2xl transition-all flex flex-col justify-between shadow-sm cursor-pointer border ${selectedOptIndex === idx ? "bg-primary/10 border-primary ring-2 ring-primary" : "bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-headline-sm text-sm font-bold text-on-surface",
													children: [
														opt.unitSize,
														" ",
														opt.unit
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between mt-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-xs font-extrabold text-primary",
														children: ["₹", opt.offerPrice]
													}), opt.mrp > opt.offerPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-[10px] text-outline line-through",
														children: ["₹", opt.mrp]
													})]
												})]
											}, idx))
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3.5 rounded-2xl bg-primary-fixed/20 flex items-center justify-between gap-2 border border-primary/10",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-on-primary-fixed",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-primary text-[22px]",
												children: "electric_moped"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-headline-sm text-xs font-bold block",
												children: "Express Delivery in 60 Minutes"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] text-on-surface-variant",
												children: "Gobichettipalayam & Kasipalayam local hub"
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-label-badge text-xs bg-primary text-on-primary px-2.5 py-1 rounded-md font-bold shrink-0",
											children: "FREE on ₹499+"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col gap-3 pt-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-space-md",
											children: [currentOption.stock > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center bg-surface-container-lowest rounded-2xl p-1 shadow-sm border border-outline-variant/20 shrink-0",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => setQuantity((q) => Math.max(1, q - 1)),
														className: "w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-extrabold text-lg flex items-center justify-center transition-colors cursor-pointer",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[18px]",
															children: "remove"
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "w-12 text-center font-headline-sm text-sm font-extrabold text-on-surface",
														children: quantity
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => setQuantity((q) => Math.min(currentOption.stock, q + 1)),
														className: "w-10 h-10 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-extrabold text-lg flex items-center justify-center transition-colors cursor-pointer",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[18px]",
															children: "add"
														})
													})
												]
											}), currentOption.stock > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: handleAddToCart,
												className: "flex-1 bg-primary hover:bg-primary-container text-on-primary py-3.5 px-6 rounded-2xl font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[20px]",
													children: "shopping_bag"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Add to Cart • ₹", currentPrice * quantity] })]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												disabled: true,
												className: "flex-1 bg-surface-container text-outline py-3.5 px-6 rounded-2xl font-headline-sm text-sm font-bold flex items-center justify-center gap-2 border border-outline-variant/30 cursor-not-allowed select-none",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[20px]",
													children: "block"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Currently Out of Stock" })]
											})]
										}), currentOption.stock > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/checkout",
											className: "w-full bg-on-surface hover:bg-inverse-surface text-on-primary py-3.5 px-6 rounded-2xl font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] text-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[20px]",
												children: "bolt"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Instant Express Checkout" })]
										})]
									})
								]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "w-full bg-surface-container-lowest py-16 border-t border-outline-variant/15 mt-12",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-[1320px] mx-auto px-margin-desktop",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center space-x-2 pb-8 overflow-x-auto whitespace-nowrap scrollbar-none",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setActiveTab("specs"),
										className: `px-5 py-2.5 rounded-full font-headline-sm text-xs font-bold transition-all cursor-pointer ${activeTab === "specs" ? "bg-primary text-white shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"}`,
										children: "Product Specifications & Nutrition"
									}), typeof product.reviewCount === "number" && product.reviewCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setActiveTab("reviews"),
										className: `px-5 py-2.5 rounded-full font-headline-sm text-xs font-bold transition-all cursor-pointer ${activeTab === "reviews" ? "bg-primary text-white shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:text-on-surface"}`,
										children: [
											"Verified Customer Reviews (",
											product.reviewCount,
											")"
										]
									})]
								}),
								activeTab === "specs" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 md:grid-cols-2 gap-8",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-surface-container-low p-6 rounded-3xl border border-outline-variant/20",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
											className: "font-headline-sm text-sm font-bold text-on-surface mb-4",
											children: "Item Specifications"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-3 text-xs",
											children: [
												product.subCategory && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between py-2 border-b border-outline-variant/20",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-on-surface-variant",
														children: "Subcategory"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-on-surface",
														children: product.subCategory
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between py-2 border-b border-outline-variant/20",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-on-surface-variant",
														children: "Extraction / Method"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-on-surface",
														children: product.extraction || "Traditional Cold Process"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between py-2 border-b border-outline-variant/20",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-on-surface-variant",
														children: "Origin Basin"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-on-surface",
														children: product.origin || "Western Tamil Nadu Delta"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between py-2 border-b border-outline-variant/20",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-on-surface-variant",
														children: "Shelf Life"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-on-surface",
														children: "6 Months from Press Date"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between py-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-on-surface-variant",
														children: "FSSAI Certified"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-primary font-mono",
														children: "#12421008000412"
													})]
												})
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-surface-container-low p-6 rounded-3xl border border-outline-variant/20",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
											className: "font-headline-sm text-sm font-bold text-on-surface mb-4",
											children: "Nutritional Facts (Per 100g)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-3 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between py-2 border-b border-outline-variant/20",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-on-surface-variant",
														children: "Energy"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-on-surface",
														children: product.nutrition?.energy || "900 kcal"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between py-2 border-b border-outline-variant/20",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-on-surface-variant",
														children: "Monounsaturated Fats (MUFA)"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-primary",
														children: product.nutrition?.mufa || "48.2 g (Heart Healthy)"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between py-2 border-b border-outline-variant/20",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-on-surface-variant",
														children: "Trans Fats & Cholesterol"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-primary",
														children: "0.00 mg (Zero)"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex justify-between py-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-on-surface-variant",
														children: "Natural Vitamin E"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-on-surface",
														children: product.nutrition?.vitaminE || "15.7 mg"
													})]
												})
											]
										})]
									})]
								}),
								activeTab === "reviews" && typeof product.reviewCount === "number" && product.reviewCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-4 max-w-3xl",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-6 rounded-3xl bg-surface-container-low border border-outline-variant/20",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-xs",
														children: "SK"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-headline-sm text-xs font-bold block",
														children: "S. Kalyanasundaram"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-[11px] text-primary flex items-center gap-1 font-semibold",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[13px]",
															children: "verified"
														}), "Verified Buyer • Gobichettipalayam"]
													})] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[11px] text-on-surface-variant",
													children: "2 days ago"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex text-[#fea619] mb-2",
												children: [...Array(5)].map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[16px]",
													style: { fontVariationSettings: "'FILL' 1" },
													children: "star"
												}, i))
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
												className: "font-headline-sm text-sm font-bold text-on-surface mb-1",
												children: "Unbeatable natural aroma for dosas & sambar!"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-on-surface-variant leading-relaxed",
												children: "Been ordering regularly from Sri Amman Smart Store. When you temper mustard seeds, the entire kitchen fills with the nostalgic aroma of old village cooking. Authentic unrefined taste with pure sedimentation at the bottom."
											})
										]
									})
								})
							]
						})
					}),
					similarProducts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "max-w-[1320px] w-full mx-auto px-margin-desktop py-space-2xl border-t border-outline-variant/15",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm mb-space-lg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-label-badge uppercase tracking-wider text-secondary font-bold text-xs",
									children: "Traditional Alternatives"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-headline-lg text-2xl font-extrabold text-on-surface tracking-tight",
									children: "Similar Products"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/shop",
								search: { category: product.categorySlug },
								className: "font-label-button text-primary hover:underline font-bold flex items-center gap-1 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["View all ", product.category] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[16px]",
									children: "arrow_forward"
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md",
							children: similarProducts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, {
								product: p,
								readOnly: false
							}, p.id))
						})]
					}),
					complementaryProducts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "max-w-[1320px] w-full mx-auto px-margin-desktop py-space-2xl border-t border-outline-variant/15",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm mb-space-lg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-label-badge uppercase tracking-wider text-secondary font-bold text-xs",
									children: "Frequently Bundled"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-headline-lg text-2xl font-extrabold text-on-surface tracking-tight",
									children: "Complete Your Traditional Kitchen Basket"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/shop",
								className: "font-label-button text-primary hover:underline font-bold flex items-center gap-1 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "View all Organic Staples" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[16px]",
									children: "arrow_forward"
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md",
							children: complementaryProducts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, {
								product: p,
								readOnly: false
							}, p.id))
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
//#endregion
export { ProductDetailsPage as component };
