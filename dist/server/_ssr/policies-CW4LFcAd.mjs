import { n as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/@radix-ui/react-label+[...].mjs";
import { g as StoreHeader, h as StoreFooter, n as BottomNav } from "./StoreFooter-CRTqGBJ2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/policies-CW4LFcAd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PoliciesPage() {
	const [activeTab, setActiveTab] = (0, import_react.useState)("privacy");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-[1000px] mx-auto px-margin-desktop py-space-xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface",
								children: "Legal Disclosures & Policies"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-on-surface-variant mt-1",
								children: "Sri Amman Smart Store compliance, delivery terms, and customer rights"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mb-8 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/20 overflow-x-auto scrollbar-none",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setActiveTab("privacy"),
									className: `px-4 py-2 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer ${activeTab === "privacy" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
									children: "Privacy Policy"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setActiveTab("terms"),
									className: `px-4 py-2 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer ${activeTab === "terms" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
									children: "Terms & Conditions"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setActiveTab("shipping"),
									className: `px-4 py-2 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer ${activeTab === "shipping" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
									children: "Shipping & Geofence"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setActiveTab("refund"),
									className: `px-4 py-2 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer ${activeTab === "refund" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
									children: "Cancellation & Refund SLA"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-surface-container-lowest p-8 md:p-12 rounded-3xl border border-outline-variant/20 shadow-sm leading-relaxed text-xs md:text-sm text-on-surface-variant space-y-6",
							children: [
								activeTab === "privacy" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-headline-lg text-xl font-extrabold text-on-surface",
										children: "Customer Privacy Policy"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "At Sri Amman Smart Store, we respect your personal privacy. We collect your mobile number, delivery address, and order transaction details solely to fulfill grocery orders, deliver 60-minute express groceries, and track your Amman loyalty coins." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-headline-sm text-base font-bold text-on-surface",
										children: "Data Security & Sharing"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Your payment data is securely tokenized through RBI-authorized payment gateways. We never store credit/debit card credentials or UPI PINs on our servers. Your address information is shared strictly with our dedicated local fleet delivery drivers for transit purposes." })
								] }),
								activeTab === "terms" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-headline-lg text-xl font-extrabold text-on-surface",
										children: "Terms of Service"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "By accessing the Sri Amman Smart Store customer application, you agree to comply with our community terms. All items sold are subject to harvest availability. We reserve the right to refuse orders placed with fraudulent details or outside our permissible delivery boundaries." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-headline-sm text-base font-bold text-on-surface",
										children: "Pricing & FSSAI Compliance"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "All retail prices (MRP) and offer prices are inclusive of applicable GST taxes. Wood-pressed oils, unpolished rice grains, and traditional spices are packed in accordance with FSSAI hygiene standards under license registration #12421008000412." })
								] }),
								activeTab === "shipping" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-headline-lg text-xl font-extrabold text-on-surface",
										children: "Shipping & Geofence Policy"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										"Sri Amman operates with strict single-store farm purity. To ensure morning vegetables, dairy, and cold-pressed oils arrive farm-fresh within 60 minutes, our deliveries are restricted to a maximum radius of ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "6.0 kilometers" }),
										" from our store hub at Gobichettipalayam, Erode district (Coordinates: 11.459319, 77.333565)."
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-headline-sm text-base font-bold text-on-surface",
										children: "Delivery Slots & Free Shipping Threshold"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
										className: "list-disc pl-5 space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Free Delivery:" }),
												" All orders with a basket subtotal of ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "₹499 or higher" }),
												" receive complimentary express delivery."
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Express Dispatch:" }), " Orders below ₹499 incur a standard fee of ₹40 or an express fee of ₹60."] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Delivery Windows:" }), " Morning delivery (7:00 AM – 10:00 AM), Evening delivery (4:00 PM – 7:00 PM), and 60-90 Minute Instant Dispatch."] })
										]
									})
								] }),
								activeTab === "refund" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-headline-lg text-xl font-extrabold text-on-surface",
										children: "Cancellation & Refund SLA"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "We strive for 100% customer satisfaction with every doorstep delivery." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-headline-sm text-base font-bold text-on-surface",
										children: "Order Cancellation Rules"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										"You may self-cancel an order directly from your \"My Orders\" tab as long as the status remains in ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Pending" }),
										" or ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Processing" }),
										". Once an order is marked as ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Packed" }),
										" or ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "In Transit" }),
										" with our dispatch fleet, cancellations cannot be processed."
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-headline-sm text-base font-bold text-on-surface",
										children: "Return & Replacement Window"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
										"Damaged packages, leakage in oil containers, or sub-standard fresh produce must be reported within ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "24 hours of delivery" }),
										". Once verified, replacements are dispatched immediately or a full refund is credited to your source payment method within 3-5 business days."
									] })
								] })
							]
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
export { PoliciesPage as component };
