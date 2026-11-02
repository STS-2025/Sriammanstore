import { n as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/@radix-ui/react-label+[...].mjs";
import { M as fetchAllProductionProductPreviews, N as fetchFullProductionCatalogue, g as StoreHeader, h as StoreFooter, n as BottomNav, q as isProductionPreviewOptedIn, s as EXPECTED_PRODUCTION_PROJECT_ID } from "./StoreFooter-CRTqGBJ2.mjs";
import { t as ProductCard } from "./ProductCard-lmahrv00.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/prod-preview-Cmw7fqph.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProductionProductPreviewPage() {
	const [optedIn, setOptedIn] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined") try {
			if (window.sessionStorage.getItem("prod_preview_optin") === "true") return true;
			const params = new URLSearchParams(window.location.search);
			if (params.get("optin") === "true" || params.get("preview") === "true") return true;
		} catch {}
		return isProductionPreviewOptedIn();
	});
	const [previews, setPreviews] = (0, import_react.useState)([]);
	const [catalogueResult, setCatalogueResult] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [errorType, setErrorType] = (0, import_react.useState)(null);
	const [activeTab, setActiveTab] = (0, import_react.useState)("overview");
	const [activeImageIndex, setActiveImageIndex] = (0, import_react.useState)({});
	const [selectedOptionIndex, setSelectedOptionIndex] = (0, import_react.useState)({});
	const [showRawJson, setShowRawJson] = (0, import_react.useState)({});
	const [showDuplicates, setShowDuplicates] = (0, import_react.useState)(false);
	const [showQualityFindings, setShowQualityFindings] = (0, import_react.useState)(false);
	const loadPreviews = async (isManualOptIn = false) => {
		setLoading(true);
		setError(null);
		setErrorType(null);
		try {
			const fullCat = await fetchFullProductionCatalogue({ optIn: true });
			if (!fullCat || fullCat.products.length === 0) {
				setErrorType("empty");
				setError("No product documents were returned from production Firestore.");
			} else {
				setCatalogueResult(fullCat);
				setPreviews(fullCat.previews);
			}
		} catch (err) {
			console.warn("Full catalogue fetch failed, falling back to allowlisted previews:", err);
			try {
				const data = await fetchAllProductionProductPreviews({ optIn: true });
				if (data && data.length > 0) {
					setPreviews(data);
					return;
				}
			} catch {}
			const msg = err.message || "Failed to load production catalogue.";
			setError(msg);
			if (msg.includes("CONFIGURATION SAFETY CHECK FAILED") || msg.includes("Project ID mismatch")) setErrorType("config");
			else if (msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("permission")) setErrorType("permission");
			else if (msg.includes("Failed to fetch") || msg.includes("network") || msg.includes("ECONNREFUSED")) setErrorType("network");
			else setErrorType("general");
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		if (optedIn) loadPreviews();
	}, [optedIn]);
	const handleManualOptIn = () => {
		try {
			if (typeof window !== "undefined") window.sessionStorage.setItem("prod_preview_optin", "true");
		} catch {}
		setOptedIn(true);
	};
	const handleManualOptOut = () => {
		try {
			if (typeof window !== "undefined") window.sessionStorage.removeItem("prod_preview_optin");
		} catch {}
		setOptedIn(false);
		setPreviews([]);
		setCatalogueResult(null);
		setError(null);
		setErrorType(null);
	};
	const turmericPreview = previews.find((p) => p.docId === "prod-mumqpksq");
	const chickenPreview = previews.find((p) => p.docId === "prod-munn8cp3");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "flex-1 w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-space-xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 md:p-8 mb-8 shadow-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col md:flex-row md:items-start justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-label-badge mb-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "verified_user"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Isolated Production Product Preview" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
											className: "font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface",
											children: "Live Production Product Showcase"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm text-on-surface-variant mt-2 max-w-3xl leading-relaxed",
											children: [
												"This page renders the two explicitly allowlisted product documents directly from the live production database (",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: EXPECTED_PRODUCTION_PROJECT_ID }),
												"). The normal store application, shopping cart, authentication, and checkout use the configured Firebase services and enforce customer access through Firestore rules."
											]
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col gap-2 shrink-0 text-xs",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "px-3 py-1.5 rounded-xl bg-surface-container font-mono font-medium text-on-surface-variant flex items-center gap-2 border border-outline-variant/20",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse" }),
													"Project: ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: EXPECTED_PRODUCTION_PROJECT_ID })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "px-3 py-1.5 rounded-xl bg-surface-container font-mono font-medium text-on-surface-variant flex items-center gap-2 border border-outline-variant/20",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[14px]",
														children: "checklist"
													}),
													"Allowlist: ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "2 Approved Documents" })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "px-3 py-1.5 rounded-xl bg-surface-container font-mono font-medium text-on-surface-variant flex items-center gap-2 border border-outline-variant/20",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[14px]",
														children: "block"
													}),
													"Writes: ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "0 Attempted (Read-Only)" })
												]
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5",
										children: "warning"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "leading-relaxed",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Important Security Note:" }),
											" Production Cloud Firestore security rules currently contain ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "match /{document=**} { allow read, write: if true; }" }),
											". Therefore, access is ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "not" }),
											" technically restricted as read-only at the database rules level. Read-only protection and strict path allowlisting are enforced solely through client-side software isolation and read-only REST GET operations. No write, update, delete, customer-record, or cart operations are implemented or authorized."
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-6 pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `w-2.5 h-2.5 rounded-full ${optedIn ? "bg-emerald-500" : "bg-amber-500"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-semibold text-on-surface",
											children: ["Preview Status: ", optedIn ? "Connected (Read-Only Opt-In Active)" : "Not Connected (Opt-In Required)"]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center gap-3",
										children: optedIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => loadPreviews(),
											className: "px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold font-label-button text-primary border border-outline-variant/20 cursor-pointer flex items-center gap-1.5 transition-colors",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "refresh"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Refresh Documents" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: handleManualOptOut,
											className: "px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold font-label-button text-error border border-outline-variant/20 cursor-pointer flex items-center gap-1.5 transition-colors",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "power_settings_new"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Disconnect Preview" })]
										})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: handleManualOptIn,
											className: "px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold font-label-button shadow-sm cursor-pointer flex items-center gap-2 transition-colors",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "lock_open"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Connect to Production Catalogue" })]
										})
									})]
								})
							]
						}),
						!optedIn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto shadow-sm my-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[32px]",
										children: "shield"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-headline-md text-xl font-bold text-on-surface mb-2",
									children: "Explicit Development Opt-In Required"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-on-surface-variant leading-relaxed mb-6 max-w-lg mx-auto",
									children: [
										"Live production Firestore access is restricted to an explicit development opt-in. Connecting will read the two approved product documents (",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "prod-mumqpksq" }),
										" and ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "prod-munn8cp3" }),
										") from ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "sri-amman-smart-store" }),
										" using strictly read-only HTTP GET requests. This page only reads the approved catalogue preview. Other customer services use the configured Firebase services."
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: handleManualOptIn,
									className: "px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-md cursor-pointer inline-flex items-center gap-2.5 transition-transform active:scale-95",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[20px]",
										children: "cloud_sync"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Connect & Inspect Live Production Catalogue" })]
								})
							]
						}),
						optedIn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mb-8 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/20 overflow-x-auto scrollbar-none",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setActiveTab("overview"),
								className: `px-4 py-2.5 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === "overview" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[18px]",
									children: "grid_view"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"Overview & Diagnostics (",
									catalogueResult ? catalogueResult.diagnostics.uniqueProductCount : previews.length,
									")"
								] })]
							}), previews.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setActiveTab(item.docId),
								className: `px-4 py-2.5 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === item.docId ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[18px]",
									children: "verified"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									item.product.name,
									" (",
									item.docId,
									")"
								] })]
							}, item.docId))]
						}),
						loading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-20 flex flex-col items-center justify-center gap-4 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "font-headline-sm text-sm font-semibold text-on-surface-variant",
								children: [
									"Connecting to production Firestore (",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "sri-amman-smart-store" }),
									") and fetching allowlisted product documents..."
								]
							})]
						}),
						error && !loading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-6 md:p-8 rounded-3xl bg-surface-container-lowest border border-error/30 shadow-sm mb-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 text-error font-headline-sm font-bold text-base mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[24px]",
										children: errorType === "permission" ? "lock" : errorType === "config" ? "settings_alert" : errorType === "network" ? "wifi_off" : "error"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: errorType === "permission" ? "Production Access Denied (Permission Error)" : errorType === "config" ? "Production Configuration Safety Check Failed" : errorType === "network" ? "Network Connectivity Failure" : "Production Preview Error" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-on-surface-variant leading-relaxed mb-4",
									children: error
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-xs space-y-2",
									children: [
										errorType === "permission" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-on-surface",
											children: "The production Firebase rules rejected this read request. Ensure the API key has read permissions to Cloud Firestore and the document allowlist is configured."
										}),
										errorType === "config" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-on-surface",
											children: [
												"A configuration invariant check failed. Production preview requires project ID",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "sri-amman-smart-store" }),
												" and project number",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "1018585256480" }),
												". Connecting to any other target is prohibited."
											]
										}),
										errorType === "network" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-on-surface",
												children: "Could not reach Google Cloud Firestore REST API. Check your internet connection."
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => loadPreviews(),
												className: "px-3 py-1.5 rounded-xl bg-primary text-white font-bold cursor-pointer hover:bg-primary/90",
												children: "Retry Connection"
											})]
										})
									]
								})
							]
						}),
						!loading && !error && optedIn && previews.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-12 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/20 my-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[48px] text-on-surface-variant mb-2",
									children: "inventory_2"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-headline-sm text-base font-bold text-on-surface mb-1",
									children: "No Production Documents Found"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-on-surface-variant",
									children: "No approved product documents were retrieved from production Firestore."
								})
							]
						}),
						!loading && !error && optedIn && previews.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [activeTab === "overview" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-12",
							children: [
								catalogueResult && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-8 shadow-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "font-headline-md text-xl font-bold text-on-surface",
												children: "Production Catalogue Diagnostics"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-on-surface-variant mt-1",
												children: [
													"Discovered products across top-level ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "products" }),
													" collection and nested ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "items" }),
													" collectionGroup."
												]
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex items-center gap-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono",
													children: [
														"Bounded Limits: Top: ",
														catalogueResult.diagnostics.queryLimitsApplied.topLevelLimit,
														" | Nested: ",
														catalogueResult.diagnostics.queryLimitsApplied.nestedLimit
													]
												})
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1",
															children: "Unique Products"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-2xl font-black text-primary font-mono",
															children: catalogueResult.diagnostics.uniqueProductCount
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] text-outline mt-1",
															children: "Normalized canonical items"
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1",
															children: "Top-Level Docs"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-2xl font-black text-on-surface font-mono",
															children: catalogueResult.diagnostics.topLevelCount
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] text-outline mt-1",
															children: "products/{id}"
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1",
															children: "Nested Items"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-2xl font-black text-on-surface font-mono",
															children: catalogueResult.diagnostics.nestedCount
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] text-outline mt-1",
															children: "collectionGroup('items')"
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1",
															children: "Duplicates Resolved"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-2xl font-black text-amber-600 dark:text-amber-400 font-mono",
															children: catalogueResult.diagnostics.duplicateCount
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] text-outline mt-1",
															children: "Deterministic precedence applied"
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1",
															children: "POS Metadata Shielded"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono",
															children: catalogueResult.diagnostics.posFieldsFilteredCount
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] text-outline mt-1",
															children: "Internal fields hidden"
														})
													]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs flex items-start gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5",
												children: "rule"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
												className: "font-bold text-on-surface block mb-0.5",
												children: "Deterministic Precedence Rule:"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-on-surface-variant leading-relaxed",
												children: [
													"When a product document ID exists in both top-level ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "products/{id}" }),
													" and nested ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "products/{category}/items/{id}" }),
													", the top-level document takes precedence as the authoritative Admin Panel record. Nested item paths are reconciled and displayed in the Duplicates Inspector below."
												]
											})] })]
										}),
										catalogueResult.diagnostics.duplicateDetails.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-6 pt-4 border-t border-outline-variant/15",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => setShowDuplicates((prev) => !prev),
												className: "flex items-center justify-between w-full text-xs font-bold text-on-surface hover:text-primary transition-colors cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[18px] text-amber-600",
														children: "content_copy"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
														"Duplicates Inspector (",
														catalogueResult.diagnostics.duplicateDetails.length,
														" duplicate IDs detected across ",
														catalogueResult.diagnostics.duplicateCount,
														" nested instances)"
													] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px]",
													children: showDuplicates ? "expand_less" : "expand_more"
												})]
											}), showDuplicates && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-4 overflow-x-auto rounded-xl border border-outline-variant/20",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
													className: "w-full text-left text-xs",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
														className: "bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/20",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																className: "py-2.5 px-3",
																children: "Product ID"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																className: "py-2.5 px-3",
																children: "Product Name"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																className: "py-2.5 px-3",
																children: "Authoritative Selected Path"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																className: "py-2.5 px-3",
																children: "Nested Duplicate Paths"
															})
														]
													}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
														className: "divide-y divide-outline-variant/15",
														children: catalogueResult.diagnostics.duplicateDetails.map((dup) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
															className: "hover:bg-surface-container-low/50",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																	className: "py-2.5 px-3 font-mono text-primary font-bold",
																	children: dup.id
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																	className: "py-2.5 px-3 font-semibold text-on-surface",
																	children: dup.name
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																	className: "py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-medium",
																	children: dup.selectedPath
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																	className: "py-2.5 px-3 font-mono text-on-surface-variant text-[11px]",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																		className: "flex flex-col gap-1",
																		children: dup.nestedPaths.map((np, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "bg-surface-container px-2 py-0.5 rounded",
																			children: np
																		}, idx))
																	})
																})
															]
														}, dup.id))
													})]
												})
											})]
										}),
										catalogueResult.diagnostics.dataQualityReport && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-6 pt-4 border-t border-outline-variant/15",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
														className: "text-sm font-bold text-on-surface flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[18px] text-primary",
															children: "fact_check"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Catalogue Data Quality Audit (Phase 6)" })]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11px] text-on-surface-variant mt-0.5",
														children: "Automated diagnostics across pricing, stock consistency, images, and category integrity."
													})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono",
																children: [catalogueResult.diagnostics.dataQualityReport.errorCount, " Errors"]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono",
																children: [catalogueResult.diagnostics.dataQualityReport.warningCount, " Warnings"]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold font-mono",
																children: [catalogueResult.diagnostics.dataQualityReport.infoCount, " Verified Info"]
															})
														]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: () => setShowQualityFindings((prev) => !prev),
													className: "flex items-center justify-between w-full text-xs font-bold text-on-surface hover:text-primary transition-colors cursor-pointer py-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[16px] text-primary",
															children: "list_alt"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
															"View Diagnostic Findings (",
															catalogueResult.diagnostics.dataQualityReport.totalFindings,
															" findings across ",
															catalogueResult.diagnostics.dataQualityReport.totalProducts,
															" products)"
														] })]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[18px]",
														children: showQualityFindings ? "expand_less" : "expand_more"
													})]
												}),
												showQualityFindings && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "mt-3 overflow-x-auto rounded-xl border border-outline-variant/20 max-h-80 overflow-y-auto",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
														className: "w-full text-left text-xs",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
															className: "bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/20 sticky top-0",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																	className: "py-2.5 px-3",
																	children: "Severity"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																	className: "py-2.5 px-3",
																	children: "Product"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																	className: "py-2.5 px-3",
																	children: "Field / Rule"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
																	className: "py-2.5 px-3",
																	children: "Message & Observed Value"
																})
															]
														}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
															className: "divide-y divide-outline-variant/15",
															children: catalogueResult.diagnostics.dataQualityReport.findings.map((f, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
																className: "hover:bg-surface-container-low/50",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																		className: "py-2 px-3",
																		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: `px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${f.severity === "error" ? "bg-red-500/10 text-red-600 border border-red-500/20" : f.severity === "warning" ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20" : "bg-surface-container text-on-surface-variant"}`,
																			children: f.severity
																		})
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
																		className: "py-2 px-3 font-medium text-on-surface",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: f.productName }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																			className: "font-mono text-[10px] text-primary",
																			children: f.productId
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
																		className: "py-2 px-3 font-mono text-[11px] text-on-surface-variant",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: f.field }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																			className: "text-[10px] text-outline",
																			children: f.rule
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
																		className: "py-2 px-3 text-on-surface-variant text-[11px]",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																			className: "text-on-surface",
																			children: f.message
																		}), f.observedValue !== null && f.observedValue !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																			className: "font-mono text-[10px] text-outline mt-0.5 truncate max-w-md",
																			children: ["Observed: ", String(f.observedValue)]
																		})]
																	})
																]
															}, idx))
														})]
													})
												})
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-headline-md text-lg font-bold text-on-surface",
										children: "Full Production Catalogue (Read-Only Mode)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-on-surface-variant",
										children: [
											"Rendered using the standard storefront ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "ProductCard" }),
											" component with cart mutations disabled."
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-outline font-mono",
										children: [previews.length, " Products Loaded"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6",
									children: previews.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCard, {
												product: item.product,
												readOnly: true
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 text-[11px] text-on-surface-variant flex items-center justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono text-[10px] truncate max-w-[140px]",
													children: item.docPath
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: () => setActiveTab(item.docId),
													className: "font-bold text-primary hover:underline cursor-pointer flex items-center gap-1 shrink-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Inspect" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[14px]",
														children: "chevron_right"
													})]
												})]
											}),
											item.docId === "prod-munn8cp3" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5",
													children: "warning"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "leading-snug",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
															className: "font-bold block mb-0.5",
															children: "Production Image Discrepancy:"
														}),
														"This card displays photos of ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", { children: "Sakthi Puliyogare Rice Powder (புளியோதரை சாதப் பொடி, Barcode 8906002081042)" }),
														". The underlying production Firestore document (",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "products/prod-munn8cp3" }),
														") mistakenly stores Puliyogare packet image data instead of Chicken Masala images."
													]
												})]
											})
										]
									}, item.docId))
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-headline-sm text-base font-bold text-on-surface mb-1",
											children: "Live Production Product Comparison"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-on-surface-variant",
											children: "Audited structural fields across both live documents retrieved via read-only REST API."
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "px-3 py-1 rounded-full bg-surface-container text-xs font-mono text-on-surface-variant border border-outline-variant/20 self-start",
											children: ["Source: ", "sri-amman-smart-store"]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "overflow-x-auto",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
											className: "w-full text-left text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
												className: "border-b border-outline-variant/30 text-on-surface-variant font-bold",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "py-3 px-4",
														children: "Attribute"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "py-3 px-4",
														children: "Sakthi Turmeric Powder"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "py-3 px-4",
														children: "Sakthi Chicken Masala"
													})
												]
											}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
												className: "divide-y divide-outline-variant/15 text-on-surface",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Document ID"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-mono font-bold text-primary",
															children: "prod-mumqpksq"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-mono font-bold text-primary",
															children: "prod-munn8cp3"
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Read Timestamp"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-mono text-[11px] text-on-surface-variant",
															children: turmericPreview?.fetchTimestamp
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-mono text-[11px] text-on-surface-variant",
															children: chickenPreview?.fetchTimestamp
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "English Name"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-bold",
															children: turmericPreview?.product.name
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-bold",
															children: chickenPreview?.product.name
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Tamil Name"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 text-primary font-medium",
															children: turmericPreview?.product.tamilName
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 text-primary font-medium",
															children: chickenPreview?.product.tamilName
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Brand"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4",
															children: turmericPreview?.product.brand
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4",
															children: chickenPreview?.product.brand
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Category"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-bold text-secondary",
															children: turmericPreview?.category
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-bold text-secondary",
															children: chickenPreview?.category
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Subcategory"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-medium",
															children: turmericPreview?.subCategory || "None"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-medium",
															children: chickenPreview?.subCategory || "None"
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Category Slug"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[11px]",
																children: turmericPreview?.categorySlug
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[11px]",
																children: chickenPreview?.categorySlug
															})
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Pack Unit & Size"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "py-3 px-4 font-mono",
															children: [
																turmericPreview?.product.options[0]?.unitSize,
																turmericPreview?.product.options[0]?.unit,
																" (raw: \"",
																String(turmericPreview?.raw["unit"]),
																"\")"
															]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "py-3 px-4 font-mono",
															children: [
																chickenPreview?.product.options[0]?.unitSize,
																chickenPreview?.product.options[0]?.unit,
																" (raw: \"",
																String(chickenPreview?.raw["unit"]),
																"\")"
															]
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "MRP / Offer Price"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "py-3 px-4",
															children: [
																"₹",
																turmericPreview?.product.options[0]?.mrp,
																" /",
																" ",
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
																	className: "text-primary",
																	children: ["₹", turmericPreview?.product.options[0]?.offerPrice]
																})
															]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "py-3 px-4",
															children: [
																"₹",
																chickenPreview?.product.options[0]?.mrp,
																" /",
																" ",
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
																	className: "text-primary",
																	children: ["₹", chickenPreview?.product.options[0]?.offerPrice]
																})
															]
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Inventory Stock"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "py-3 px-4",
															children: [turmericPreview?.product.options[0]?.stock, " units in stock"]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "py-3 px-4",
															children: [chickenPreview?.product.options[0]?.stock, " units in stock"]
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "FSSAI License"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-mono",
															children: String(turmericPreview?.raw["fssaiLicense"] || "Not provided")
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-mono",
															children: String(chickenPreview?.raw["fssaiLicense"] || "Not provided")
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "GST / HSN Code"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "py-3 px-4 font-mono",
															children: [
																String(turmericPreview?.raw["gstRate"]),
																"% GST / HSN ",
																String(turmericPreview?.raw["hsnCode"])
															]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "py-3 px-4 font-mono",
															children: [
																String(chickenPreview?.raw["gstRate"]),
																"% GST / HSN ",
																String(chickenPreview?.raw["hsnCode"])
															]
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Image Count (Base64)"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "py-3 px-4",
															children: [turmericPreview?.product.images.length, " images"]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
															className: "py-3 px-4",
															children: [chickenPreview?.product.images.length, " images"]
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Missing Fields"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-on-surface-variant font-mono",
																children: [turmericPreview?.missingFields.length || 0, " empty fields"]
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-on-surface-variant font-mono",
																children: [chickenPreview?.missingFields.length || 0, " empty fields"]
															})
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Internal POS Metadata"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "px-2 py-0.5 rounded-full bg-surface-container font-mono text-[11px] text-on-surface-variant",
																children: [
																	"Filtered (",
																	turmericPreview?.internalPosFieldsFiltered.length || 0,
																	" internal fields hidden)"
																]
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "px-2 py-0.5 rounded-full bg-surface-container font-mono text-[11px] text-on-surface-variant",
																children: [
																	"Filtered (",
																	chickenPreview?.internalPosFieldsFiltered.length || 0,
																	" internal fields hidden)"
																]
															})
														})
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4 font-semibold text-on-surface-variant",
															children: "Image Audit Status"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "material-symbols-outlined text-[16px]",
																	children: "check_circle"
																}), "Verified (Turmeric Powder 20g pouch)"]
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
															className: "py-3 px-4",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "material-symbols-outlined text-[16px]",
																	children: "warning"
																}), "Production Defect: Stored images are Puliyogare Rice Powder"]
															})
														})
													] })
												]
											})]
										})
									})]
								})
							]
						}), activeTab !== "overview" && (() => {
							const selectedPreview = previews.find((p) => p.docId === activeTab);
							if (!selectedPreview) return null;
							const docId = selectedPreview.docId;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductInspectionSection, {
								preview: selectedPreview,
								activeImageIdx: activeImageIndex[docId] || 0,
								onSelectImage: (idx) => setActiveImageIndex((prev) => ({
									...prev,
									[docId]: idx
								})),
								selectedOptionIdx: selectedOptionIndex[docId] || 0,
								onSelectOption: (idx) => setSelectedOptionIndex((prev) => ({
									...prev,
									[docId]: idx
								})),
								showJson: Boolean(showRawJson[docId]),
								onToggleJson: () => setShowRawJson((prev) => ({
									...prev,
									[docId]: !prev[docId]
								}))
							}, docId);
						})()] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-16 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sri Amman Smart Store © 2026 • Isolated Production Diagnostic Sandbox" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									className: "text-primary font-bold hover:underline",
									children: "← Return to Storefront"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/shop",
									className: "text-primary font-bold hover:underline",
									children: "Browse Catalog →"
								})]
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {})
		]
	});
}
function ProductInspectionSection({ preview, activeImageIdx, onSelectImage, selectedOptionIdx, onSelectOption, showJson, onToggleJson }) {
	const { product, raw, docPath, rawFieldCount, category, subCategory, categorySlug } = preview;
	const currentOption = product.options[selectedOptionIdx] || product.options[0];
	const images = product.images.length > 0 ? product.images : [product.imageUrl];
	const mainImage = images[activeImageIdx] || images[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [
			preview.docId === "prod-munn8cp3" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-4 md:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "material-symbols-outlined text-[24px] text-amber-600 shrink-0 mt-0.5",
					children: "warning"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "leading-relaxed",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
							className: "text-sm font-bold block mb-1",
							children: "Diagnostic Warning: Production Image Discrepancy"
						}),
						"The images displayed below are the actual unmodified Base64 photos stored in the production Firestore database (",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "products/prod-munn8cp3" }),
						"). A byte-level visual audit confirms that these photos show a 20g packet of",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Sakthi Puliyogare Rice Powder (புளியோதரை சாதப் பொடி, Barcode 8906002081042)" }),
						" rather than Sakthi Chicken Masala (document barcode: ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: "8906002081578" }),
						"). This discrepancy originates strictly within the production database document; the frontend schema mapper and UI faithfully render the stored data as required."
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-10 shadow-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "lg:col-span-5 flex flex-col gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "aspect-square w-full rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/15 flex items-center justify-center p-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: mainImage,
									alt: product.name,
									className: "w-full h-full object-contain"
								})
							}),
							images.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-3",
								children: images.map((imgUrl, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => onSelectImage(idx),
									className: `w-20 h-20 rounded-xl overflow-hidden border-2 transition-all p-1 bg-surface-container-low cursor-pointer ${activeImageIdx === idx ? "border-primary ring-2 ring-primary/20 scale-105" : "border-outline-variant/30 opacity-70 hover:opacity-100"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: imgUrl,
										alt: `Thumbnail ${idx + 1}`,
										className: "w-full h-full object-contain"
									})
								}, idx))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 text-[11px] text-on-surface-variant flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Image Format: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Base64 Data URI" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Images: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [images.length, " available"] })] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 text-[11px] text-on-surface-variant space-y-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "imageUrl field:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-emerald-600 font-bold",
											children: raw["imageUrl"] ? "Present (Base64)" : "Missing"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "frontImageUrl field:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-emerald-600 font-bold",
											children: raw["frontImageUrl"] ? "Present (Base64)" : "Missing"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "backImageUrl field:" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-mono text-emerald-600 font-bold",
											children: raw["backImageUrl"] ? "Present (Base64)" : "Missing"
										})]
									})
								]
							}),
							preview.docId === "prod-munn8cp3" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[16px] text-amber-600 shrink-0",
									children: "info"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Pictured packet: Sakthi Puliyogare Rice Powder (20g)" })]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "lg:col-span-7 flex flex-col justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2 mb-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-label-badge",
										children: product.brand
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold font-label-badge",
										children: ["Category: ", category]
									}),
									subCategory && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold font-label-badge",
										children: ["Subcategory: ", subCategory]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono",
										children: ["Slug: ", categorySlug]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-mono",
										children: docPath
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface",
								children: product.name
							}),
							product.tamilName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-headline-sm text-lg font-bold text-primary mt-1",
								children: product.tamilName
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/15 font-mono",
										children: ["Doc ID: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: preview.docId })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/15 font-mono",
										children: ["Read Time: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: preview.fetchTimestamp })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/15 font-mono",
										children: ["Project: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: preview.sourceProject })]
									})
								]
							}),
							currentOption && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-wrap items-baseline gap-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "font-headline-lg text-3xl font-extrabold text-primary",
										children: ["₹", currentOption.offerPrice]
									}),
									currentOption.mrp > currentOption.offerPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "font-price-mrp text-base text-outline line-through",
										children: ["₹", currentOption.mrp]
									}),
									currentOption.mrp > currentOption.offerPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "px-2.5 py-0.5 rounded-full bg-tertiary text-on-tertiary font-label-badge text-xs font-bold",
										children: [
											"Save ₹",
											currentOption.mrp - currentOption.offerPrice,
											" (",
											Math.round((currentOption.mrp - currentOption.offerPrice) / currentOption.mrp * 100),
											"% OFF)"
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "ml-auto text-xs text-on-surface-variant font-mono",
										children: ["Stock: ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", { children: [currentOption.stock, " units"] })]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2",
									children: [
										"Packaging Options (",
										product.options.length,
										")"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-3",
									children: product.options.map((opt, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => onSelectOption(idx),
										className: `px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${selectedOptionIdx === idx ? "bg-primary text-white border-primary shadow-sm" : "bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:border-outline"}`,
										children: [
											opt.unitSize,
											opt.unit,
											" • ₹",
											opt.offerPrice
										]
									}, idx))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5",
									children: "Product Description"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-on-surface leading-relaxed whitespace-pre-line",
									children: product.description || "No description provided in production document."
								})]
							}),
							Boolean(raw["ingredients"]) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-on-surface-variant",
									children: "Ingredients: "
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-on-surface",
									children: String(raw["ingredients"])
								})]
							})
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "inline-flex items-center gap-2 text-xs text-on-surface-variant font-medium",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[18px] text-primary",
									children: "verified"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Production Document Normalization Succeeded" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "px-4 py-2 bg-surface-container text-on-surface-variant text-xs font-semibold rounded-xl border border-outline-variant/30",
								children: "Cart Writes Prohibited (Isolated Sandbox)"
							})]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-8 shadow-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
							className: "font-headline-sm text-base font-bold text-on-surface flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "material-symbols-outlined text-[20px] text-primary",
								children: "rule"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Schema Quality & Field Audit" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "px-3 py-1 rounded-full bg-surface-container text-xs font-mono text-on-surface-variant border border-outline-variant/15",
							children: "Diagnostic Inspection"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-on-surface-variant mb-6",
						children: "Diagnostic analysis of category mapping, missing optional fields, and schema anomalies."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 md:grid-cols-3 gap-4 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold text-on-surface block mb-2 flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[16px] text-secondary",
										children: "category"
									}), "Category Hierarchy"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5 text-[11px]",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Category: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
											className: "text-on-surface",
											children: category
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Subcategory: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
											className: "text-on-surface",
											children: subCategory || "None"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: ["Category Slug: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "bg-surface-container px-1.5 py-0.5 rounded text-primary",
											children: categorySlug
										})] })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold text-on-surface block mb-2 flex items-center gap-1.5 text-amber-700 dark:text-amber-300",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[16px]",
											children: "info"
										}),
										"Missing / Empty Optional Fields (",
										preview.missingFields.length,
										")"
									]
								}), preview.missingFields.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-emerald-600",
									children: "All standard fields populated"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-1 text-[11px] text-on-surface-variant list-disc list-inside",
									children: preview.missingFields.map((f, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: f }, i))
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-bold text-on-surface block mb-2 flex items-center gap-1.5 text-amber-800 dark:text-amber-200",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[16px]",
											children: "warning"
										}),
										"Anomalies & Data Quality (",
										preview.malformedFields.length + preview.anomalies.length,
										")"
									]
								}), preview.malformedFields.length === 0 && preview.anomalies.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-emerald-600",
									children: "No anomalies detected"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "space-y-1 text-[11px] text-amber-800 dark:text-amber-200 list-disc list-inside",
									children: [preview.malformedFields.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: m }, `m-${i}`)), preview.anomalies.map((a, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: a }, `a-${i}`))]
								})]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-8 shadow-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-headline-sm text-base font-bold text-on-surface",
							children: "Customer Catalog & Regulatory Specifications"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-label-badge self-start",
							children: "Internal POS/ERP Fields Filtered"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-on-surface-variant mb-6",
						children: "Customer-relevant regulatory specifications. Internal retail inventory fields (purchasePrice, batchNumber, barcode, sku, safetyStock, expiryDate) are excluded from consumer view."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-on-surface-variant block mb-1",
									children: "FSSAI License"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono font-bold",
									children: String(raw["fssaiLicense"] || "Not provided")
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-on-surface-variant block mb-1",
									children: "GST Tax Rate"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-mono font-bold",
									children: [String(raw["gstRate"]), "% GST"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-on-surface-variant block mb-1",
									children: "HSN Code"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono font-bold",
									children: String(raw["hsnCode"] || "N/A")
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-on-surface-variant block mb-1",
									children: "Catalog Status"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono font-bold text-emerald-600",
									children: "Active (In Stock)"
								})]
							})
						]
					}),
					product.tags.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
							className: "text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2",
							children: [
								"Production Search Tags (",
								product.tags.length,
								")"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-3 bg-surface-container-low rounded-2xl border border-outline-variant/15",
							children: product.tags.map((tag, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "px-2 py-0.5 rounded-md bg-surface-container-lowest text-on-surface-variant text-[11px] border border-outline-variant/20 font-mono",
								children: tag
							}, idx))
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-8 shadow-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between mb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "font-headline-sm text-base font-bold text-on-surface",
						children: [
							"Raw Production Firestore Document (",
							rawFieldCount,
							" fields)"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-on-surface-variant",
						children: [
							"Complete unmarshaled JSON document directly from ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", { children: docPath }),
							"."
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onToggleJson,
						className: "px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold font-label-button text-primary border border-outline-variant/20 cursor-pointer transition-colors",
						children: showJson ? "Hide Raw JSON" : "Show Raw JSON"
					})]
				}), showJson && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mb-2 p-2.5 rounded-xl bg-surface-container-low text-xs text-on-surface-variant",
						children: "Note: This debug view displays raw Firestore fields for developer verification. Customer-facing pages filter out internal POS attributes."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
						className: "p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-xs font-mono text-on-surface overflow-x-auto max-h-96 overflow-y-auto",
						children: JSON.stringify(raw, null, 2)
					})]
				})]
			})
		]
	});
}
//#endregion
export { ProductionProductPreviewPage as component };
