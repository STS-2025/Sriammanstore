import { n as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/@radix-ui/react-label+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { g as StoreHeader, h as StoreFooter, n as BottomNav, nt as useAuth } from "./StoreFooter-CRTqGBJ2.mjs";
import { t as supportService } from "./supportService-BKKKN-sO.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/help-BRwRVKN2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FAQS = [
	{
		q: "How does the 60-minute express delivery work?",
		a: "Orders placed within our 6km store geofence in Gobichettipalayam and Kasipalayam are packed within 12 minutes and dispatched via our dedicated electric delivery fleet."
	},
	{
		q: "What is your return & replacement policy?",
		a: "If produce or cold pressed oils do not match our farm-purity standards, you can request a replacement or full refund within 24 hours of doorstep delivery."
	},
	{
		q: "How do I become an Amman VIP Prestige Member?",
		a: "VIP standing is automatically activated once your cumulative spend on delivered orders reaches ₹5,000 within any rolling 30-calendar-day window."
	},
	{
		q: "Are the wood-pressed oils really 100% pure?",
		a: "Yes. All our groundnut, sesame, and coconut oils are cold-churned in traditional heirloom Vaagai timber mortars below 38°C with zero chemical solvents."
	}
];
function HelpPage() {
	const { user } = useAuth();
	const [activeTab, setActiveTab] = (0, import_react.useState)("faqs");
	const [repCategory, setRepCategory] = (0, import_react.useState)("Damaged Item");
	const [repOrderId, setRepOrderId] = (0, import_react.useState)("");
	const [repMessage, setRepMessage] = (0, import_react.useState)("");
	const [myTickets, setMyTickets] = (0, import_react.useState)([]);
	const [reqName, setReqName] = (0, import_react.useState)("");
	const [reqBrand, setReqBrand] = (0, import_react.useState)("");
	const [reqNotes, setReqNotes] = (0, import_react.useState)("");
	const [myRequests, setMyRequests] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		async function loadData() {
			if (!user) {
				setMyTickets([]);
				setMyRequests([]);
				return;
			}
			try {
				const [tickets, requests] = await Promise.all([supportService.getReportedProblems(user.id), supportService.getProductRequests(user.id)]);
				setMyTickets(tickets || []);
				setMyRequests(requests || []);
			} catch (err) {
				console.error("Failed to load support records:", err);
			}
		}
		loadData();
	}, [user]);
	const handleSubmitProblem = async (e) => {
		e.preventDefault();
		if (!user) {
			toast.error("Please sign in to submit a support ticket");
			return;
		}
		if (!repMessage.trim()) return;
		try {
			const trimmedOrderId = repOrderId.trim();
			const ticket = await supportService.submitReportedProblem({
				userId: user.id,
				category: repCategory,
				...trimmedOrderId ? { orderId: trimmedOrderId } : {},
				message: repMessage.trim()
			});
			setMyTickets((prev) => [ticket, ...prev]);
			setRepMessage("");
			setRepOrderId("");
			toast.success("Support ticket logged! Our team will contact you shortly.");
		} catch (err) {
			toast.error(err.message || "Failed to submit ticket");
		}
	};
	const handleSubmitRequest = async (e) => {
		e.preventDefault();
		if (!user) {
			toast.error("Please sign in to request a product");
			return;
		}
		if (!reqName.trim()) return;
		try {
			const req = await supportService.submitProductRequest({
				userId: user.id,
				productName: reqName.trim(),
				brand: reqBrand.trim(),
				notes: reqNotes.trim()
			});
			setMyRequests((prev) => [req, ...prev]);
			setReqName("");
			setReqBrand("");
			setReqNotes("");
			toast.success("Product request recorded! Our sourcing team has been notified.");
		} catch (err) {
			toast.error(err.message || "Failed to submit product request");
		}
	};
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
								children: "Customer Support & Care Center"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-on-surface-variant mt-1",
								children: "Have questions, need an order issue resolved, or want us to source a native grocery item?"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: "https://api.whatsapp.com/send?text=Hi%20Sri%20Amman%20Support",
									target: "_blank",
									rel: "noreferrer",
									className: "p-4 rounded-3xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center gap-3 transition-colors text-on-surface",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[20px]",
											children: "chat"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-headline-sm text-xs font-bold block",
										children: "WhatsApp Chat"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] text-on-surface-variant",
										children: "Instant response"
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: "tel:+919840012345",
									className: "p-4 rounded-3xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 flex items-center gap-3 transition-colors text-on-surface",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[20px]",
											children: "call"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-headline-sm text-xs font-bold block",
										children: "+91 98400 12345"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] text-on-surface-variant",
										children: "Daily 7:00 AM - 10:00 PM"
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: "mailto:support@sriammanstore.com",
									className: "p-4 rounded-3xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 flex items-center gap-3 transition-colors text-on-surface",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-10 h-10 rounded-2xl bg-secondary text-white flex items-center justify-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[20px]",
											children: "email"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-headline-sm text-xs font-bold block",
										children: "Email Care"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] text-on-surface-variant",
										children: "support@sriammanstore.com"
									})] })]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mb-8 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/20 overflow-x-auto scrollbar-none",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setActiveTab("faqs"),
									className: `px-4 py-2 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer ${activeTab === "faqs" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
									children: "Frequently Asked Questions"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setActiveTab("report"),
									className: `px-4 py-2 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer ${activeTab === "report" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
									children: [
										"Report a Problem (",
										myTickets.length,
										")"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setActiveTab("request"),
									className: `px-4 py-2 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer ${activeTab === "request" ? "bg-primary text-white shadow-sm" : "text-on-surface-variant hover:text-on-surface"}`,
									children: [
										"Request a Product (",
										myRequests.length,
										")"
									]
								})
							]
						}),
						activeTab === "faqs" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "font-headline-lg text-lg font-bold text-on-surface mb-4",
								children: "Frequently Asked Questions"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-4",
								children: FAQS.map((faq, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "font-headline-sm text-sm font-bold text-on-surface mb-2",
										children: faq.q
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-on-surface-variant leading-relaxed",
										children: faq.a
									})]
								}, i))
							})]
						}),
						activeTab === "report" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-headline-lg text-lg font-bold text-on-surface mb-4",
									children: "Log a Customer Grievance Ticket"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
									onSubmit: handleSubmitProblem,
									className: "space-y-4 text-xs",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "font-bold text-on-surface block mb-1",
											children: "Issue Category"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: repCategory,
											onChange: (e) => setRepCategory(e.target.value),
											className: "w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/20 font-bold",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Damaged Item" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Delivery Delay" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Payment / Refund Issue" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Quality Not As Expected" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Other Grievance" })
											]
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "font-bold text-on-surface block mb-1",
											children: "Related Order ID (Optional)"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											value: repOrderId,
											onChange: (e) => setRepOrderId(e.target.value),
											placeholder: "e.g. ORD-0004512",
											className: "w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/20"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "font-bold text-on-surface block mb-1",
											children: "Explain the Issue"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
											rows: 4,
											required: true,
											value: repMessage,
											onChange: (e) => setRepMessage(e.target.value),
											placeholder: "Describe the issue with your grocery delivery...",
											className: "w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/20"
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "submit",
											className: "bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md cursor-pointer",
											children: "Submit Support Ticket"
										})
									]
								})]
							}), myTickets.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "font-headline-lg text-sm font-bold text-on-surface mb-3",
									children: "Your Previous Tickets"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-3",
									children: myTickets.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15 text-xs flex justify-between items-start",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 mb-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-bold text-on-surface",
													children: t.category
												}), t.orderId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-[11px] font-mono text-primary font-bold",
													children: ["#", t.orderId]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-on-surface-variant",
												children: t.message
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[10px] text-outline mt-1 block",
												children: ["Logged on ", new Date(t.createdAt).toLocaleDateString()]
											})
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-label-badge text-[10px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold",
											children: t.status
										})]
									}, t.id))
								})]
							})]
						}),
						activeTab === "request" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-headline-lg text-lg font-bold text-on-surface mb-4",
										children: "Request a Native or Organic Item"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-on-surface-variant mb-4 leading-relaxed",
										children: "Looking for a rare heritage grain (e.g. Karuppu Kavuni, Mapillai Samba), authentic spice, or traditional snack not currently listed in our store? Tell us and our farm procurement team will source it."
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
										onSubmit: handleSubmitRequest,
										className: "space-y-4 text-xs",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "font-bold text-on-surface block mb-1",
												children: "Product Name"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "text",
												required: true,
												value: reqName,
												onChange: (e) => setReqName(e.target.value),
												placeholder: "e.g. Pure Karuppu Kavuni Black Rice",
												className: "w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/20"
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "font-bold text-on-surface block mb-1",
												children: "Preferred Brand / Origin (Optional)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "text",
												value: reqBrand,
												onChange: (e) => setReqBrand(e.target.value),
												placeholder: "e.g. Thanjavur Single Farm",
												className: "w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/20"
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "font-bold text-on-surface block mb-1",
												children: "Additional Notes (Optional)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
												rows: 3,
												value: reqNotes,
												onChange: (e) => setReqNotes(e.target.value),
												placeholder: "Specify preferred pack size or requirements...",
												className: "w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/20"
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "submit",
												className: "bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md cursor-pointer",
												children: "Submit Sourcing Request"
											})
										]
									})
								]
							}), myRequests.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "font-headline-lg text-sm font-bold text-on-surface mb-3",
									children: "Your Sourcing Requests"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-3",
									children: myRequests.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15 text-xs flex justify-between items-start",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-bold text-on-surface block",
												children: r.productName
											}),
											r.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-on-surface-variant mt-0.5",
												children: r.notes
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[10px] text-outline mt-1 block",
												children: ["Requested on ", new Date(r.createdAt).toLocaleDateString()]
											})
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-label-badge text-[10px] px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold",
											children: r.status
										})]
									}, r.id))
								})]
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
export { HelpPage as component };
