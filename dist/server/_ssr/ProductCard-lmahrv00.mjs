import { n as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/@radix-ui/react-label+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { S as buildCartKey, it as useLanguage, nt as useAuth, ot as useWishlist, rt as useCart } from "./StoreFooter-CRTqGBJ2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ProductCard-lmahrv00.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProductCard({ product, className = "", readOnly = false }) {
	const { user } = useAuth();
	const { addToCart, updateQty, getItemQuantity } = useCart();
	const { isWishlisted, toggleWishlist } = useWishlist();
	const { t } = useLanguage();
	const [optIndex, setOptIndex] = (0, import_react.useState)(0);
	const [imageError, setImageError] = (0, import_react.useState)(false);
	const currentOption = product.options[optIndex] || product.options[0];
	if (!currentOption) return null;
	const cartKey = buildCartKey(product.id, optIndex, currentOption.unit, currentOption.unitSize);
	const quantity = getItemQuantity(cartKey);
	const wishlisted = isWishlisted(product.id);
	const discountPercent = currentOption.mrp > currentOption.offerPrice ? Math.round((currentOption.mrp - currentOption.offerPrice) / currentOption.mrp * 100) : 0;
	const handleAddToCart = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			await addToCart(product, optIndex, 1);
			toast.success(`Added ${product.name} to cart`);
		} catch (err) {
			toast.error(err.message || "Failed to add to cart");
		}
	};
	const handleIncrement = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			await updateQty(cartKey, quantity + 1);
		} catch (err) {
			toast.error(err.message || "Could not update quantity");
		}
	};
	const handleDecrement = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			await updateQty(cartKey, quantity - 1);
		} catch (err) {
			toast.error(err.message || "Could not update quantity");
		}
	};
	const handleToggleWishlist = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		try {
			if (await toggleWishlist(product, optIndex)) toast.success("Saved to your wishlist");
			else toast.info("Removed from wishlist");
		} catch (err) {
			toast.error(err.message || "Could not update wishlist");
		}
	};
	const isVipCustomer = !!user?.isVIP;
	const showVipPrice = currentOption.specialPrice && currentOption.specialPrice < currentOption.offerPrice;
	const hasGenuineRating = typeof product.rating === "number" && typeof product.reviewCount === "number" && product.rating > 0 && product.reviewCount > 0 && !Number.isNaN(product.rating) && !Number.isNaN(product.reviewCount);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `bg-surface-container-lowest rounded-2xl p-space-md flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow relative group border border-outline-variant/15 ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative w-full aspect-square rounded-2xl overflow-hidden bg-surface-container-low mb-space-md flex items-center justify-center p-3 border border-outline-variant/10",
				children: [
					product.imageUrl && !imageError ? readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-center w-full h-full cursor-default",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: product.imageUrl,
							alt: product.name,
							className: "max-w-full max-h-full object-contain select-none",
							loading: "lazy",
							onError: () => setImageError(true)
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/product",
						search: { id: product.id },
						className: "flex items-center justify-center w-full h-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: product.imageUrl,
							alt: product.name,
							className: "max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm select-none",
							loading: "lazy",
							onError: () => setImageError(true)
						})
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						"data-testid": "product-image-fallback",
						className: "w-full h-full flex flex-col items-center justify-center text-outline gap-1.5 p-4 bg-surface-container select-none",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined text-[32px] text-outline-variant",
							children: "inventory_2"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] font-semibold text-on-surface-variant truncate max-w-[140px]",
							children: product.name
						})]
					}),
					readOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute top-2 left-2 bg-amber-600 text-white font-label-badge text-label-badge px-2 py-0.5 rounded-full font-bold shadow-sm text-[10px] tracking-wide uppercase",
						children: "Preview"
					}),
					discountPercent > 0 && !readOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "absolute top-2 left-2 bg-tertiary text-on-tertiary font-label-badge text-label-badge px-2 py-0.5 rounded-full font-bold shadow-sm text-xs",
						children: [discountPercent, "% OFF"]
					}),
					!readOnly && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleToggleWishlist,
						className: `absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-lowest/90 flex items-center justify-center transition-all shadow-sm cursor-pointer ${wishlisted ? "text-tertiary scale-110" : "text-on-surface-variant hover:text-tertiary"}`,
						title: wishlisted ? "Remove from wishlist" : "Save to wishlist",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined text-[18px]",
							style: wishlisted ? { fontVariationSettings: "'FILL' 1" } : {},
							children: "favorite"
						})
					})
				]
			}),
			hasGenuineRating && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-testid": "product-rating-row",
				className: "flex items-center gap-1 text-secondary text-body-sm font-semibold mb-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "material-symbols-outlined text-[16px]",
						style: { fontVariationSettings: "'FILL' 1" },
						children: "star"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-bold",
						children: product.rating
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-on-surface-variant text-[11px]",
						children: [
							"(",
							product.reviewCount,
							")"
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/product",
				search: {
					id: product.id,
					...readOnly ? { catalogMode: "production-readonly" } : {}
				},
				className: "block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-headline-sm text-label-button font-bold text-on-surface line-clamp-1 group-hover:text-primary transition-colors text-sm",
					children: t(product.name, product.tamilName)
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-body-sm text-xs text-on-surface-variant mb-space-sm line-clamp-1",
				children: product.brand
			}),
			product.options.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-1 mb-space-sm overflow-x-auto scrollbar-none pb-0.5",
				children: product.options.map((opt, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setOptIndex(idx),
					className: `px-2 py-0.5 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer ${optIndex === idx ? "bg-primary text-white" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`,
					children: [opt.unitSize, opt.unit]
				}, idx))
			}),
			showVipPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-secondary-fixed/30 rounded-lg px-space-sm py-1 flex items-center justify-between mb-space-md",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-label-badge text-[10px] font-bold text-on-secondary-fixed flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "material-symbols-outlined text-[13px] text-secondary",
						children: "workspace_premium"
					}), "VIP PRICE"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "font-headline-sm text-xs font-black text-secondary",
					children: ["₹", currentOption.specialPrice]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline gap-space-xs mb-space-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-price-card text-price-card text-on-surface font-black text-base",
						children: ["₹", isVipCustomer && currentOption.specialPrice ? currentOption.specialPrice : currentOption.offerPrice]
					}),
					currentOption.mrp > currentOption.offerPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-price-mrp text-xs text-outline line-through",
						children: ["₹", currentOption.mrp]
					}),
					currentOption.mrp > currentOption.offerPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-body-sm text-[11px] text-primary font-bold ml-auto",
						children: ["Save ₹", currentOption.mrp - currentOption.offerPrice]
					})
				]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "w-full mt-2",
			children: readOnly ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full py-2.5 px-space-md bg-surface-container-high/60 text-on-surface-variant rounded-xl font-label-button text-xs font-semibold flex items-center justify-center gap-1.5 border border-outline-variant/30 select-none",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "material-symbols-outlined text-[16px]",
					children: "visibility"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Read-Only Preview" })]
			}) : currentOption.stock <= 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				disabled: true,
				className: "w-full py-2 px-space-md bg-surface-container text-outline rounded-xl font-label-button text-xs font-bold flex items-center justify-center gap-1 cursor-not-allowed",
				children: "Out of Stock"
			}) : quantity === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: handleAddToCart,
				className: "w-full py-2.5 px-space-md bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed rounded-xl font-label-button text-xs font-bold flex items-center justify-center gap-space-xs transition-colors shadow-sm cursor-pointer active:scale-95",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "material-symbols-outlined text-[18px]",
					children: "add_shopping_cart"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Add to Cart" })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full flex items-center justify-between bg-primary text-on-primary rounded-xl p-1 shadow-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleDecrement,
						className: "w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer",
						title: "Decrease quantity",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined text-[18px]",
							children: "remove"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-headline-sm text-sm font-black text-white px-space-sm",
						children: quantity
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleIncrement,
						className: "w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all cursor-pointer",
						title: "Increase quantity",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined text-[18px]",
							children: "add"
						})
					})
				]
			})
		})]
	});
}
//#endregion
export { ProductCard as t };
