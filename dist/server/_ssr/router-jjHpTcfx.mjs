import { n as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { C as useRouter, S as useSearch, _ as lazyRouteComponent, b as Link, d as Scripts, f as HeadContent, g as Outlet, h as createRouter, v as createFileRoute, x as useNavigate, y as createRootRouteWithContext } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as require_jsx_runtime, n as Slot, t as Label$1 } from "../_libs/@radix-ui/react-label+[...].mjs";
import { a as query, d as collection, m as doc, n as getDoc, r as getDocs } from "../_libs/@firebase/firestore+[...].mjs";
import "../_libs/firebase.mjs";
import { _ as signInWithPhoneNumber, b as updatePhoneNumber, d as linkWithPhoneNumber, n as PhoneAuthProvider, r as RecaptchaVerifier } from "../_libs/firebase__auth.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { $ as productionOrderReader, A as describeIdentityResolutionState, C as calculateComplementaryScore, D as convertCoinsToRupees, E as coinService, H as getProductionFirestoreInstance, J as isWithinDeliveryGeofence, K as hasAvailableStock, O as convertRupeesToCoins, Q as productService, R as getCustomerProfileEndpoint, T as classifyStorageError, X as parseAddressTag, Y as notificationService, Z as parseSafeCoordinate, _ as WishlistProvider, a as DEFAULT_DELIVERY_SETTINGS, at as useNotifications, b as authManager, c as EmailLinkAuthError, ct as wishlistService, d as NotificationProvider, et as resolveCustomerDataSource, f as OFFICIAL_COIN_CONVERSION_RATE, g as StoreHeader, h as StoreFooter, i as CartProvider, it as useLanguage, j as emailLinkAuthService, k as customerIdentityService, l as LanguageProvider, m as StorageAdapterError, n as BottomNav, nt as useAuth, o as DEFAULT_PAYMENT_SETTINGS, ot as useWishlist, p as SUPPORTED_ORDER_STATUSES, r as CANONICAL_CUSTOMER_ID_RE$1, rt as useCart, st as validateDeliveryServiceability, t as AuthProvider, tt as settingsService, v as apiClient, w as cartService, x as authService, y as auth } from "./StoreFooter-CRTqGBJ2.mjs";
import { t as supportService } from "./supportService-BKKKN-sO.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { a as Eye, c as CircleAlert, i as LoaderCircle, l as ArrowLeft, n as ShieldCheck, o as EyeOff, r as RefreshCw, s as CircleCheck, t as X } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { i as stringType, n as literalType, r as objectType, t as enumType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-jjHpTcfx.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-D4rYtW6g.css";
var favicon_default = "data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAYAAADhAJiYAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH6QgYEg0OFfbwDwAABzlJREFUWMPtl2lsVNcVx//n3vvevLHH9nhsbLzgUAoGmgZCRNOEmrDYQEIWlIRARBFVIyq1UkX7oUR0STcVKVLVqggqRVUWpFalZUnTtK6aQoCSoFSIRQlLElZjIDY4MwZ7lvdm7r2nH8ZjgwmMU9p+4kgjzUh37vmd//nfc98DbsftuLWgW/nzI5sWwQJeWGJ6SAgRku5+bXX6t09u+/8CtWx8FL0ZTfXl7h1hpVpdgQZPMhRwUQlsr/bKzyRzAW94dNP/Fqhx/YMYUxZGRiNa6WGuIjExY3W9J7MLqz2ImKvegFWdDJwQSu40Jhev8qqwdt7L/12gxnVtqCgthza6XAlnWnNUjzuXouoL6ez8apdn1JaIRI1nOeaZUaM8+Q7pUHsusJf7HHG6hOTBtAmuNITr8eyc3xTNJYotqNvwCFJWiP4s7o44cuXXJ5956PcL93zJCyejvjVtDLEvoioWRlT4QUfQG5b0nGaZqfh+7/F75+t4q4R+plQ50xUlxdqdS4oCqRtK94uHwb3diGunLup6c+fGrkz4yZ3vNjfVftwK5SRDUvwJBGjiQ691HDm8+p5RYIg3QVhEbFXI+LMXZjsq7ivp2t4umiKnNU2UJHe99NbKj+I6hWfnbBoZ0De2rsErF47CMipDtWO/0BZOTV9Z3T1xXt2FKY5KTUGOBKxIAkSDTaf8L+arNrIAjK2N2f5ly8oOHznhVRw4mB7TdNE3B0odHFj/9mPx46f3Yf2K7pu3bEf/JWRWvQ4h1OM/9C7N31L+wdKFXtdyR1MDOLoBSh0DWDDn0/MAFfMwILBgqCMs3F9J5GomhTtXPP3ZvUtn3fHBAiZe/NCk1bToi2uKe4jBoJ+3CVdK5ymZ+IzUPIVteA9j1DIbrX8OxIn8KmuH+jt8GxqgpN4cPvdjOGopSOwRyE0dHzs/ngSr97raBcMWB7JsUcjFgATIB1WuRSq9AzZhASYw4yqFGET5BhY+VxfIOcsVwR72xFoQBcQQDGu19WFsZiSmpkLFnJcLTIwswwWQMSB5GoRUWiMoUAMEHoYxVKEBcwhEmcsgecxAdTEs52yAnPVHAgSACAweqJ8ZNsvkG1hIH1S1Cl7AR+Luck+YAaLh44wLWrGQku2lCZBjP3oPMjt/f/fYCmbbBth8N0YENMwLTH41N6RHi5QvWVkQkn5BEwGKPNbYVNfZa7mhPB0FMxMX6qKQlN0N5PZkkNKAo1lRRgKVuNFM/gQgzitUOD6wYRLJDRRkMigJADaEQJyaXBX860TCZYJZkjSZVs+x8DUqIm5BMrYQwTTS/f8gk7HgHABDd9d27Dr8ceO+a0/kTYDylhAAmDXJHgh5jkFMIHeAdDSYbFjiAAAGQRDgUL5DEgA0UQ5CngMZlxhiYEMPbGsE7NGb3Vc3uDosCKCNNOaXcCMtrMpmsYg+AFW5AIoOgSGIAAIEs9wcC5XODMvSlrBD6wRYJDzvIqjsaVaRB1iWzQJXtbAXWgWigAYL55EB0aBCwAUrAli/j7Q8zzHuMGFxFgx/cCUBBnxla+fZzprI5XNENg4AlmARJNNsKEGivIObus6x1N0DfgCISJKEFKo4UCEZA/xdOvNtaP13Mubz1Cnzp5mGwV975omJUOUHtQjZP5AJ1umc5yHrgoZGARFAggTEJxj7OkRJAhASzAyXTSMsTwVzlLQGyF41/AZdD+bBQQoAcJhdWJ4My+XGSCmNABQN5CpM1OGX3w2A8uYUYBARyADsQfrf43JhQM4hXDV4mId04sGxlXf6wDqGUISknEGcXQOXPRBbMEEKB0KEirfMWAu4IWusNdtMrMNIdQQwrYTMZtmffA6MSgxcQkTXVFKw1ZBrCZWue+oHlOMtMGhlGzp8MtF4Eizs5JqZlkgWB/ranW2I6Cxcwms/C2r2rkg2b9wVVL+qQQlY/zvI2bsAskTFHjbJEOm7SOvVVjtXTmfqt247e//G3Z0T9zrCfXXnyZfZ8vVA17VszX3LAQBVG56ME5s/t6fL6v8ZTOxZ4I8+9tOSw5MaqGcu6LrLq6DK0BcCAbKn15Zs/1tqzPEzyehZR7hv1pVEzvdlA141czOAvxQHKkT8m9sAgCe88MQFAf7d7isV0x4/eH//V8d3dj5zz5kqbaEHAbgAk7cXkzCB8N7aGRp16R2OxWHU23Xh6P609s1X7n3xprpKFInEX9/H5Kemc8akuwB5dH88Znafb0xcTLlO1iBSosTxnmTfzpl1pSCWU10S1b0m9O6eUOzD953IhyEVej0e9J2sLanjb7W8WCzdp3sNGvfrOWgqr0E6Z2JlLrcRqBlEh3Z8eUv7j3Y8gbhvWyxjNpE45TjujmTg91SHXTw/b/OIc/xHL4oPb1oChiIgGKcIsx3Bva4wHJKiJqzUrjFlNSf6sml+fv4rn3rvW3qVXrxlMZipxBF2hiuFLHO9vb7OJl9a9Mdb2fZ23I5bin8D0MVMrg7wSeAAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjUtMDgtMjRUMTg6MTM6MDgrMDA6MDCQ40hIAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDI1LTA4LTI0VDE4OjEzOjA4KzAwOjAw4b7w9AAAACB0RVh0c29mdHdhcmUAaHR0cHM6Ly9pbWFnZW1hZ2ljay5vcme8zx2dAAAAGHRFWHRUaHVtYjo6RG9jdW1lbnQ6OlBhZ2VzADGn/7svAAAAGHRFWHRUaHVtYjo6SW1hZ2U6OkhlaWdodAAxOTJAXXFVAAAAF3RFWHRUaHVtYjo6SW1hZ2U6OldpZHRoADE5MtOsIQgAAAAZdEVYdFRodW1iOjpNaW1ldHlwZQBpbWFnZS9wbmc/slZOAAAAF3RFWHRUaHVtYjo6TVRpbWUAMTc1NjA1OTE4OExs+IkAAAAPdEVYdFRodW1iOjpTaXplADBCQpSiPuwAAABWdEVYdFRodW1iOjpVUkkAZmlsZTovLy9tbnRsb2cvZmF2aWNvbnMvMjAyNS0wOC0yNC9iYjk4YTM4MGJhNjkzNGZmMDQzMzRkZmZlNDQ1ZWMxMi5pY28ucG5nb04Y6wAAAABJRU5ErkJggg==";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
	const stack = error instanceof Error ? error.stack : void 0;
	window.__lovableReportRuntimeError?.({
		message: describeThrown(error),
		...stack !== void 0 && { stack },
		filename: window.location.pathname
	});
}
var MAX_SERIALIZED_LENGTH = 2e3;
function describeThrown(error) {
	if (error instanceof Response) return `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`;
	if (error instanceof Error) return error.message;
	if (typeof error === "string") return error;
	const { message } = error ?? {};
	if (typeof message === "string" && message.length > 0) return message;
	try {
		return JSON.stringify(error)?.slice(0, MAX_SERIALIZED_LENGTH) ?? String(error);
	} catch {
		return String(error);
	}
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$17 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Sri Amman Smart Store" },
			{
				name: "description",
				content: "Farm-fresh groceries and wood-pressed oils delivered in 60 minutes."
			},
			{
				property: "og:title",
				content: "Sri Amman Smart Store"
			},
			{
				property: "og:description",
				content: "Farm-fresh groceries delivered in 60 minutes."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
			},
			{
				rel: "icon",
				href: favicon_default,
				type: "image/png"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$17.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WishlistProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(LanguageProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
			position: "top-center",
			richColors: true
		})] }) }) }) }) })
	});
}
var $$splitComponentImporter$5 = () => import("./routes-CKqlelED.mjs");
var Route$16 = createFileRoute("/")({
	head: () => ({ meta: [{ title: "Sri Amman Smart Store — Farm Fresh Groceries in 60 Mins" }, {
		name: "description",
		content: "Wood-pressed oils, heritage grains, and farm-fresh produce delivered in 60 minutes with single-store purity."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
/**
* Timeout bounding utility for production Firestore address reads.
*/
function withTimeout$1(promise, timeoutMs, operation) {
	if (timeoutMs <= 0) return promise;
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new StorageAdapterError(`Production Firestore operation timed out after ${timeoutMs}ms during ${operation}`, {
				status: 503,
				code: "unavailable",
				category: "connectivity"
			}));
		}, timeoutMs);
		promise.then((res) => {
			clearTimeout(timer);
			resolve(res);
		}).catch((err) => {
			clearTimeout(timer);
			reject(err);
		});
	});
}
/**
* Normalizes an arbitrary legacy address document from production Firestore (`users/{SASS_ID}/addresses/{docId}`)
* into the standard frontend `Address` type, preserving existing valid fields, document IDs, and resolving default status.
*/
function normalizeLegacyAddressDocument(docId, docData, userId, primaryAddressId) {
	const resolvedId = String(docData["id"] || docId || "").trim();
	const lat = parseSafeCoordinate(docData["lat"] ?? docData["latitude"], 11.4598);
	const lng = parseSafeCoordinate(docData["lng"] ?? docData["longitude"], 77.334);
	const landmarkVal = docData["landmark"] ? String(docData["landmark"]).trim() : void 0;
	const isDefault = Boolean(primaryAddressId && (resolvedId === primaryAddressId || docId === primaryAddressId) || docData["isDefault"] === true);
	return {
		id: resolvedId,
		userId,
		tag: parseAddressTag(docData["tag"]),
		name: String(docData["name"] || docData["fullName"] || "").trim(),
		phone: String(docData["phone"] || docData["contact"] || "").trim(),
		houseNo: String(docData["houseNo"] || docData["door"] || "").trim(),
		street: String(docData["street"] || "").trim(),
		...landmarkVal ? { landmark: landmarkVal } : {},
		city: String(docData["city"] || docData["town"] || "").trim(),
		pincode: String(docData["pincode"] || "").trim(),
		lat,
		lng,
		isDefault
	};
}
var readerOverride$1 = null;
var productionAddressReader = {
	/**
	* Asserts that the provided identifier is a valid canonical customer ID (SASS or ONCUS).
	*/
	assertValidCustomer(customerId) {
		const clean = typeof customerId === "string" ? customerId.trim() : "";
		if (!clean || !CANONICAL_CUSTOMER_ID_RE$1.test(clean)) throw new StorageAdapterError(`Invalid customer identifier "${customerId}": Production customer operations require a canonical SASS customer ID (or ONCUS customer ID, e.g. 'ONCUS000010' or 'SASS0000001').`, {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		return clean;
	},
	/**
	* Reads all saved addresses for an authenticated customer from production Firestore (`sri-amman-smart-store`).
	* Queries the customer subcollection (`onlineCustomers/{ID}/addresses` or `users/{ID}/addresses`) and resolves the primary address.
	* If customer has an ONCUS ID and legacy SASS ID, falls back to legacy addresses if online addresses are empty.
	*/
	async getCustomerAddresses(customerId, timeoutMs = 8e3, legacySassId) {
		if (readerOverride$1?.getCustomerAddresses) {
			if (legacySassId) return readerOverride$1.getCustomerAddresses(customerId || "", legacySassId);
			return readerOverride$1.getCustomerAddresses(customerId || "");
		}
		const cleanCustomerId = (customerId || "").trim();
		if (!cleanCustomerId) return [];
		const validCustomerId = this.assertValidCustomer(cleanCustomerId);
		const cleanLegacySassId = typeof legacySassId === "string" && legacySassId.trim() ? legacySassId.trim() : void 0;
		const db = getProductionFirestoreInstance();
		const primaryCol = validCustomerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
		const userRef = doc(db, primaryCol, validCustomerId);
		const addressesColRef = collection(db, primaryCol, validCustomerId, "addresses");
		const [userRes, addrsRes] = await Promise.allSettled([withTimeout$1(getDoc(userRef), timeoutMs, `getDoc(${primaryCol}/${validCustomerId})`), withTimeout$1(getDocs(query(addressesColRef)), timeoutMs, `getDocs(${primaryCol}/${validCustomerId}/addresses)`)]);
		let docs = addrsRes.status === "fulfilled" ? addrsRes.value.docs : [];
		let primaryAddressId = null;
		if (userRes.status === "fulfilled" && userRes.value.exists()) {
			const uData = userRes.value.data();
			if (typeof uData?.["primaryAddressId"] === "string" && uData["primaryAddressId"].trim()) primaryAddressId = uData["primaryAddressId"].trim();
		}
		if (docs.length === 0 && primaryCol === "onlineCustomers" && cleanLegacySassId) try {
			const legacyUserRef = doc(db, "users", cleanLegacySassId);
			const legacyAddrsColRef = collection(db, "users", cleanLegacySassId, "addresses");
			const [legacyUserRes, legacyAddrsRes] = await Promise.allSettled([withTimeout$1(getDoc(legacyUserRef), timeoutMs, `getDoc(users/${cleanLegacySassId})`), withTimeout$1(getDocs(query(legacyAddrsColRef)), timeoutMs, `getDocs(users/${cleanLegacySassId}/addresses)`)]);
			if (legacyAddrsRes.status === "fulfilled" && legacyAddrsRes.value.docs.length > 0) {
				docs = legacyAddrsRes.value.docs;
				if (legacyUserRes.status === "fulfilled" && legacyUserRes.value.exists()) {
					const uData = legacyUserRes.value.data();
					if (typeof uData?.["primaryAddressId"] === "string" && uData["primaryAddressId"].trim()) primaryAddressId = uData["primaryAddressId"].trim();
				}
			}
		} catch (err) {
			console.warn(`[ProductionAddressReader] Warning querying fallback users/${cleanLegacySassId}/addresses:`, err);
		}
		if (addrsRes.status === "rejected" && docs.length === 0) {
			const err = addrsRes.reason;
			console.error(`[ProductionAddressReader] Error querying ${primaryCol}/${validCustomerId}/addresses:`, err);
			const category = classifyStorageError(err);
			const msg = err instanceof Error ? err.message : String(err);
			throw new StorageAdapterError(`Failed to retrieve saved addresses for customer ${validCustomerId}: ${msg}`, {
				status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
				code: category === "permission" ? "permission-denied" : "unavailable",
				category,
				causeError: err
			});
		}
		const addressList = [];
		docs.forEach((docSnap) => {
			const data = docSnap.data();
			const normalized = normalizeLegacyAddressDocument(docSnap.id, data, validCustomerId, primaryAddressId);
			addressList.push(normalized);
		});
		addressList.sort((a, b) => {
			if (a.isDefault && !b.isDefault) return -1;
			if (!a.isDefault && b.isDefault) return 1;
			return a.id.localeCompare(b.id);
		});
		return addressList;
	},
	/**
	* Retrieves a single address by ID for a customer from production Firestore.
	*/
	async getAddressById(addressId, customerId, timeoutMs = 8e3, legacySassId) {
		if (readerOverride$1?.getAddressById) {
			if (legacySassId) return readerOverride$1.getAddressById(addressId, customerId, legacySassId);
			return readerOverride$1.getAddressById(addressId, customerId);
		}
		const cleanCustomerId = (customerId || "").trim();
		const cleanAddressId = (addressId || "").trim();
		if (!cleanCustomerId || !cleanAddressId) return null;
		const validCustomerId = this.assertValidCustomer(cleanCustomerId);
		const cleanLegacySassId = typeof legacySassId === "string" && legacySassId.trim() ? legacySassId.trim() : void 0;
		const db = getProductionFirestoreInstance();
		const primaryCol = validCustomerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
		const userRef = doc(db, primaryCol, validCustomerId);
		const addressRef = doc(db, primaryCol, validCustomerId, "addresses", cleanAddressId);
		const [userRes, addrRes] = await Promise.allSettled([withTimeout$1(getDoc(userRef), timeoutMs, `getDoc(${primaryCol}/${validCustomerId})`), withTimeout$1(getDoc(addressRef), timeoutMs, `getDoc(${primaryCol}/${validCustomerId}/addresses/${cleanAddressId})`)]);
		let targetSnap = addrRes.status === "fulfilled" && addrRes.value.exists() ? addrRes.value : null;
		let primaryAddressId = null;
		if (userRes.status === "fulfilled" && userRes.value.exists()) {
			const uData = userRes.value.data();
			if (typeof uData?.["primaryAddressId"] === "string" && uData["primaryAddressId"].trim()) primaryAddressId = uData["primaryAddressId"].trim();
		}
		if (!targetSnap && primaryCol === "onlineCustomers" && cleanLegacySassId) try {
			const legacyUserRef = doc(db, "users", cleanLegacySassId);
			const legacyAddrRef = doc(db, "users", cleanLegacySassId, "addresses", cleanAddressId);
			const [legacyUserRes, legacyAddrRes] = await Promise.allSettled([withTimeout$1(getDoc(legacyUserRef), timeoutMs, `getDoc(users/${cleanLegacySassId})`), withTimeout$1(getDoc(legacyAddrRef), timeoutMs, `getDoc(users/${cleanLegacySassId}/addresses/${cleanAddressId})`)]);
			if (legacyAddrRes.status === "fulfilled" && legacyAddrRes.value.exists()) {
				targetSnap = legacyAddrRes.value;
				if (legacyUserRes.status === "fulfilled" && legacyUserRes.value.exists()) {
					const uData = legacyUserRes.value.data();
					if (typeof uData?.["primaryAddressId"] === "string" && uData["primaryAddressId"].trim()) primaryAddressId = uData["primaryAddressId"].trim();
				}
			}
		} catch (err) {
			console.warn(`[ProductionAddressReader] Warning querying fallback users/${cleanLegacySassId}/addresses/${cleanAddressId}:`, err);
		}
		if (!targetSnap) {
			if (addrRes.status === "rejected") {
				const err = addrRes.reason;
				const category = classifyStorageError(err);
				const msg = err instanceof Error ? err.message : String(err);
				throw new StorageAdapterError(`Failed to retrieve address ${cleanAddressId} for customer ${validCustomerId}: ${msg}`, {
					status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
					code: category === "permission" ? "permission-denied" : "unavailable",
					category,
					causeError: err
				});
			}
			return null;
		}
		return normalizeLegacyAddressDocument(targetSnap.id, targetSnap.data(), validCustomerId, primaryAddressId);
	}
};
var addressService = {
	async getAddresses(userId, legacySassId) {
		const cleanUserId = (userId || "").trim();
		if (!cleanUserId) return [];
		let resolvedUserId = cleanUserId;
		let resolvedLegacySassId = legacySassId;
		try {
			const ds = resolveCustomerDataSource(cleanUserId);
			resolvedUserId = ds.canonicalCustomerId;
			resolvedLegacySassId = legacySassId || ds.legacySassId;
		} catch {}
		if (authManager.getMode() === "production") {
			if (resolvedLegacySassId) return productionAddressReader.getCustomerAddresses(resolvedUserId, void 0, resolvedLegacySassId);
			return productionAddressReader.getCustomerAddresses(resolvedUserId);
		}
		return await apiClient.get("/addresses", { userId: resolvedUserId }) || [];
	},
	async addAddress(address) {
		const cleanUserId = (address.userId || "").trim();
		if (!cleanUserId) throw new Error("Cannot save an address without a valid customer userId");
		const newId = `addr_${Date.now()}`;
		const newAddress = {
			...address,
			userId: cleanUserId,
			id: newId
		};
		if (newAddress.isDefault) await this.clearOtherDefaults(cleanUserId);
		return apiClient.post("/addresses", newAddress);
	},
	async updateAddress(id, data) {
		if (data.isDefault && data.userId) await this.clearOtherDefaults(data.userId, id);
		const query = data.userId ? `?userId=${encodeURIComponent(data.userId)}` : "";
		return apiClient.patch(`/addresses/${encodeURIComponent(id)}${query}`, data);
	},
	async deleteAddress(id, userId) {
		const cleanUserId = (userId || "").trim();
		const query = cleanUserId ? `?userId=${encodeURIComponent(cleanUserId)}` : "";
		await apiClient.delete(`/addresses/${encodeURIComponent(id)}${query}`);
	},
	async setDefaultAddress(id, userId) {
		const cleanUserId = (userId || "").trim();
		if (!cleanUserId) throw new Error("Cannot set default address without a valid customer userId");
		await this.clearOtherDefaults(cleanUserId, id);
		await apiClient.patch(`/addresses/${encodeURIComponent(id)}`, {
			isDefault: true,
			userId: cleanUserId
		});
	},
	async clearOtherDefaults(userId, currentId) {
		const defaults = (await this.getAddresses(userId)).filter((a) => a.isDefault && a.id !== currentId);
		await Promise.all(defaults.map((a) => apiClient.patch(`/addresses/${encodeURIComponent(a.id)}`, {
			isDefault: false,
			userId
		})));
	},
	validateGeofence(lat, lng, maxRadiusKm) {
		return isWithinDeliveryGeofence(lat, lng, maxRadiusKm);
	},
	/**
	* Validates address deliverability against dynamic store configuration (50 km radius, Erode, Tamil Nadu).
	*/
	validateDeliveryServiceability(address, config) {
		const options = {};
		if (config?.deliveryRadiusKm !== void 0) options.maxRadiusKm = config.deliveryRadiusKm;
		if (config?.storeCoordinates?.lat !== void 0) options.storeLat = config.storeCoordinates.lat;
		if (config?.storeCoordinates?.lng !== void 0) options.storeLng = config.storeCoordinates.lng;
		if (config?.storeName !== void 0) options.storeName = config.storeName;
		if (config?.storeAddress !== void 0) options.storeAddress = config.storeAddress;
		if (config?.serviceAreaDistrict !== void 0) options.serviceAreaDistrict = config.serviceAreaDistrict;
		if (config?.serviceAreaState !== void 0) options.serviceAreaState = config.serviceAreaState;
		return validateDeliveryServiceability(address, options);
	}
};
var orderService = {
	async getOrders(userId, legacySassId) {
		const cleanUserId = (userId || "").trim();
		if (!cleanUserId) return [];
		let resolvedUserId = cleanUserId;
		let resolvedLegacySassId = legacySassId;
		try {
			const ds = resolveCustomerDataSource(cleanUserId);
			resolvedUserId = ds.canonicalCustomerId;
			resolvedLegacySassId = legacySassId || ds.legacySassId;
		} catch {}
		if (authManager.getMode() === "production") {
			const authUser = authManager.getActiveAdapter().getCurrentUser();
			const currentUser = authService.getCurrentUser();
			const finalLegacySassId = resolvedLegacySassId || currentUser?.legacySassId;
			if (finalLegacySassId) return productionOrderReader.getCustomerOrders(resolvedUserId, authUser?.uid, void 0, finalLegacySassId);
			return productionOrderReader.getCustomerOrders(resolvedUserId, authUser?.uid);
		}
		return (await apiClient.get("/orders", { userId: resolvedUserId }) || []).filter((o) => o && o.userId === resolvedUserId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
	},
	async getOrderById(orderId, userId, legacySassId) {
		try {
			const cleanOrderId = (orderId || "").trim();
			const cleanUserId = (userId || "").trim();
			if (!cleanOrderId) return null;
			let resolvedUserId = cleanUserId;
			let resolvedLegacySassId = legacySassId;
			if (cleanUserId) try {
				const ds = resolveCustomerDataSource(cleanUserId);
				resolvedUserId = ds.canonicalCustomerId;
				resolvedLegacySassId = legacySassId || ds.legacySassId;
			} catch {}
			if (authManager.getMode() === "production") {
				if (!resolvedUserId) return null;
				const authUser = authManager.getActiveAdapter().getCurrentUser();
				const currentUser = authService.getCurrentUser();
				const finalLegacySassId = resolvedLegacySassId || currentUser?.legacySassId;
				if (finalLegacySassId) return await productionOrderReader.getOrderById(cleanOrderId, resolvedUserId, authUser?.uid, void 0, finalLegacySassId);
				return await productionOrderReader.getOrderById(cleanOrderId, resolvedUserId, authUser?.uid);
			}
			const queryParams = { orderId: cleanOrderId };
			if (cleanUserId) queryParams["userId"] = cleanUserId;
			const orders = await apiClient.get("/orders", queryParams);
			const order = orders && orders.length > 0 ? orders[0] : await apiClient.get(`/orders/${encodeURIComponent(cleanOrderId)}${cleanUserId ? `?userId=${encodeURIComponent(cleanUserId)}` : ""}`);
			if (order && cleanUserId && order.userId !== cleanUserId) throw new Error("Access denied: You cannot view another customer's order.");
			return order ?? null;
		} catch (err) {
			if (err.message?.includes("Access denied")) throw err;
			if (err.message?.includes("404") || err.status === 404) return null;
			throw err;
		}
	},
	async createOrder(params) {
		const cleanUserId = (params.userId || "").trim();
		if (!cleanUserId) throw new Error("Cannot place an order without a valid customer userId");
		if (cleanUserId === "guest_session" || cleanUserId.startsWith("guest_")) throw new Error("Authentication required: guest carts cannot place orders.");
		if (params.paymentMethod === "online" && !params.paymentDetails?.["paymentId"] && !params.paymentDetails?.["transactionId"]) throw new Error("Online order cannot be created until payment provider confirms the transaction.");
		if (!params.cartItems || params.cartItems.length === 0) throw new Error("Cannot place an order with an empty cart");
		if (params.address) {
			const deliveryConfig = await settingsService.getDeliveryConfiguration();
			const serviceability = addressService.validateDeliveryServiceability(params.address, deliveryConfig);
			if (!serviceability.eligible) {
				const radius = deliveryConfig.deliveryRadiusKm;
				throw new Error(`Delivery address is outside the ${radius}km delivery boundary (${serviceability.distanceKm}km away).`);
			}
		}
		const coinDisc = Math.max(0, params.coinDiscount || 0);
		const couponDisc = Math.max(0, params.couponDiscount || 0);
		const totalDiscounts = Math.min(params.subtotal, coinDisc + couponDisc);
		const expectedTotal = Math.max(0, params.subtotal - totalDiscounts + params.deliveryFee);
		const profileEndpoint = getCustomerProfileEndpoint(cleanUserId);
		let customerRecord = null;
		try {
			customerRecord = await apiClient.get(profileEndpoint);
		} catch {
			try {
				customerRecord = await apiClient.get(`/users/${encodeURIComponent(cleanUserId)}`);
			} catch {}
		}
		if (!customerRecord || customerRecord.phoneVerified !== true) throw new Error("Phone verification required: Please verify your mobile number before placing an order.");
		const verifiedCanonicalPhone = customerRecord.phone || params.phone;
		if (!verifiedCanonicalPhone) throw new Error("Phone verification required: Customer profile does not have a verified contact number.");
		const availableCoins = customerRecord && typeof customerRecord.smartCoins === "number" ? customerRecord.smartCoins : customerRecord && typeof customerRecord.coins === "number" ? customerRecord.coins : customerRecord?.availableCoins ?? 0;
		let coinsToDeduct = 0;
		if (typeof params.coinsRedeemed === "number" && params.coinsRedeemed > 0) {
			if (params.coinsRedeemed > availableCoins) throw new Error(`Insufficient Smart Coins: requested redemption of ${params.coinsRedeemed} coins exceeds available balance of ${availableCoins} coins.`);
			coinsToDeduct = params.coinsRedeemed;
		} else if (coinDisc > 0) {
			const calculatedCoins = convertRupeesToCoins(coinDisc);
			coinsToDeduct = Math.min(availableCoins, calculatedCoins);
		}
		let randSeq = Math.floor(1e3 + Math.random() * 8999);
		let orderId = `ORD-000${randSeq}`;
		try {
			const existing = await apiClient.get("/orders", { userId: cleanUserId });
			const existingIds = new Set(existing.map((o) => o.orderId || o.id));
			while (existingIds.has(orderId)) {
				randSeq = Math.floor(1e3 + Math.random() * 8999);
				orderId = `ORD-000${randSeq}`;
			}
		} catch {}
		const newOrder = {
			id: orderId,
			orderId,
			userId: cleanUserId,
			customerName: params.customerName,
			phone: verifiedCanonicalPhone,
			status: "pending",
			createdAt: (/* @__PURE__ */ new Date()).toISOString(),
			deliveryAddress: {
				houseNo: params.address.houseNo,
				street: params.address.street,
				...params.address.landmark !== void 0 ? { landmark: params.address.landmark } : {},
				city: params.address.city,
				pincode: params.address.pincode
			},
			delivery: {
				type: params.deliverySlot.type,
				slot: params.deliverySlot.title,
				estimatedTime: params.deliverySlot.type === "express" ? "Within 60-90 minutes" : "Next scheduled delivery window"
			},
			payment: {
				method: params.paymentMethod,
				status: params.paymentMethod === "online" ? "paid" : params.paymentMethod === "upi" ? "awaiting_verification" : "pending_cod"
			},
			items: params.cartItems.map((item) => ({
				productId: item.productId,
				name: item.name,
				unit: item.unit,
				unitSize: item.unitSize,
				price: item.price,
				quantity: item.quantity,
				image: item.image
			})),
			coinsRedeemed: coinsToDeduct,
			coinsUsed: coinsToDeduct,
			pricingSummary: {
				subtotal: params.subtotal,
				productSavings: params.productSavings,
				deliveryFee: params.deliveryFee,
				coinDiscount: coinDisc,
				coinsRedeemed: coinsToDeduct,
				couponDiscount: couponDisc,
				totalAmount: expectedTotal
			}
		};
		const createdOrder = await apiClient.post("/orders", newOrder);
		const committedOrderId = createdOrder?.orderId || createdOrder?.id || orderId;
		try {
			await notificationService.createOrderPlacedNotification(createdOrder);
		} catch (notifErr) {
			console.error(`Order ${committedOrderId} was created, but failed to persist new-order notification:`, notifErr);
		}
		let alreadyBurned = false;
		let alreadyEarned = false;
		try {
			const existingHistory = await coinService.getCoinHistory(cleanUserId);
			alreadyBurned = existingHistory.some((tx) => tx.id === `coin_burn_${committedOrderId}` || tx.orderId === committedOrderId && tx.type === "redeemed");
			alreadyEarned = existingHistory.some((tx) => tx.id === `coin_earn_${committedOrderId}` || tx.orderId === committedOrderId && tx.type === "earned");
		} catch {}
		if (coinsToDeduct > 0 && !alreadyBurned) try {
			await apiClient.post("/coinHistory", {
				id: `coin_burn_${committedOrderId}`,
				userId: cleanUserId,
				orderId: committedOrderId,
				amount: coinsToDeduct,
				type: "redeemed",
				description: `Smart Coins redeemed on Order #${committedOrderId}`,
				timestamp: createdOrder?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
			});
			try {
				await notificationService.createCoinNotification({
					userId: cleanUserId,
					amount: coinsToDeduct,
					type: "redeemed",
					orderId: committedOrderId
				});
			} catch {}
		} catch (coinBurnErr) {
			console.error("Failed to record coin redemption history:", coinBurnErr);
		}
		const earnedCoins = Math.max(5, Math.floor(params.subtotal * .1));
		if (earnedCoins > 0 && !alreadyEarned) try {
			await apiClient.post("/coinHistory", {
				id: `coin_earn_${committedOrderId}`,
				userId: cleanUserId,
				orderId: committedOrderId,
				amount: earnedCoins,
				type: "earned",
				description: `Smart Coins earned on Order #${committedOrderId}`,
				timestamp: createdOrder?.createdAt || (/* @__PURE__ */ new Date()).toISOString()
			});
			try {
				await notificationService.createCoinNotification({
					userId: cleanUserId,
					amount: earnedCoins,
					type: "earned",
					orderId: committedOrderId
				});
			} catch {}
		} catch (coinEarnErr) {
			console.error("Failed to record earned coin history:", coinEarnErr);
		}
		const effectiveDeduction = !alreadyBurned && coinsToDeduct > 0 ? coinsToDeduct : 0;
		const effectiveAward = !alreadyEarned && earnedCoins > 0 ? earnedCoins : 0;
		if (effectiveDeduction > 0 || effectiveAward > 0) try {
			const userEndpoint = getCustomerProfileEndpoint(cleanUserId);
			const latestUser = await apiClient.get(userEndpoint);
			if (latestUser) {
				const startingBalance = typeof latestUser.smartCoins === "number" ? latestUser.smartCoins : typeof latestUser.coins === "number" ? latestUser.coins : latestUser.availableCoins ?? 0;
				const updatedCoins = Math.max(0, startingBalance - effectiveDeduction + effectiveAward);
				const patchPayload = { smartCoins: updatedCoins };
				if (effectiveAward > 0 && ("earnedCoins" in latestUser || latestUser.earnedCoins !== void 0)) patchPayload["earnedCoins"] = (latestUser.earnedCoins || 0) + effectiveAward;
				const patchedUser = await apiClient.patch(userEndpoint, patchPayload);
				authService.syncUserSession({
					...latestUser,
					...patchedUser,
					smartCoins: updatedCoins
				});
			}
		} catch (userCoinErr) {
			console.error("Failed to update user coin balance:", userCoinErr);
		}
		await cartService.clearCart(cleanUserId);
		return createdOrder;
	},
	/**
	* Shared order status transition point.
	* - Validates the target status against SUPPORTED_ORDER_STATUSES.
	* - Enforces customer ownership when userId is provided.
	* - No-ops when the status has not changed (preventing duplicate notifications).
	* - Persists the status update and creates exactly one lifecycle notification per genuine transition.
	*/
	async updateOrderStatus(orderId, newStatus, userId) {
		if (!SUPPORTED_ORDER_STATUSES.includes(newStatus)) throw new Error(`Unsupported order status "${newStatus}". Allowed statuses: ${SUPPORTED_ORDER_STATUSES.join(", ")}`);
		const order = await this.getOrderById(orderId, userId);
		if (!order) throw new Error("Order not found");
		if (userId && order.userId !== userId) throw new Error("Access denied: You cannot modify another customer's order.");
		const previousStatus = order.status;
		if (previousStatus === newStatus) {
			notificationService.recordObservedOrderStatus(order.userId, order.orderId || order.id, newStatus);
			return order;
		}
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const patchPayload = { status: newStatus };
		if (newStatus === "delivered") patchPayload.deliveredAt = nowIso;
		else if (newStatus === "cancelled") {
			patchPayload.cancelledAt = nowIso;
			patchPayload.coinsRefunded = true;
			try {
				await this.processOrderCancellationCoins(order);
			} catch (refundErr) {
				console.error(`Order ${order.orderId} cancellation coin processing failed:`, refundErr);
				throw refundErr;
			}
		}
		const updatedOrder = await apiClient.patch(`/orders/${encodeURIComponent(order.id)}`, patchPayload);
		try {
			await notificationService.createOrderStatusNotification(updatedOrder, previousStatus, newStatus, nowIso);
		} catch (notifErr) {
			console.error(`Order ${order.orderId} status updated to "${newStatus}", but failed to create lifecycle notification:`, notifErr);
		}
		return updatedOrder;
	},
	/**
	* Authoritative, idempotent refund of redeemed Smart Coins and reversal of unearned
	* reward coins upon order cancellation.
	* - Restores exact coins redeemed on this order.
	* - No-ops if 0 coins were redeemed (or if no coins were charged).
	* - Prevents duplicate refunds or clawbacks if cancellation is retried.
	* - Writes auditable transactions to /coinHistory with verified schema types.
	* - Updates /users/:userId and synchronizes auth session.
	*/
	async processOrderCancellationCoins(order) {
		const cleanUserId = (order.userId || "").trim();
		const orderId = order.orderId || order.id;
		if (!cleanUserId || !orderId) return {
			refundedCoins: 0,
			clawedBackCoins: 0,
			newBalance: 0
		};
		let history = [];
		try {
			history = await coinService.getCoinHistory(cleanUserId);
		} catch {}
		const burnTx = history.find((tx) => tx.id === `coin_burn_${orderId}` || tx.orderId === orderId && tx.type === "redeemed" && !String(tx.id || "").startsWith("coin_clawback_"));
		let redeemedCoins = 0;
		if (typeof order.coinsRedeemed === "number" && order.coinsRedeemed > 0) redeemedCoins = order.coinsRedeemed;
		else if (typeof order.coinsUsed === "number" && order.coinsUsed > 0) redeemedCoins = order.coinsUsed;
		else if (typeof order.pricingSummary?.coinsRedeemed === "number" && order.pricingSummary.coinsRedeemed > 0) redeemedCoins = order.pricingSummary.coinsRedeemed;
		else if (burnTx && typeof burnTx.amount === "number" && burnTx.amount > 0) redeemedCoins = burnTx.amount;
		else if (order.pricingSummary?.coinDiscount && order.pricingSummary.coinDiscount > 0) redeemedCoins = convertRupeesToCoins(order.pricingSummary.coinDiscount);
		const alreadyRefunded = history.some((tx) => tx.id === `coin_refund_${orderId}` || tx.orderId === orderId && String(tx.description || "").toLowerCase().includes("refund"));
		let earnedCoins = 0;
		const earnTx = history.find((tx) => (tx.id === `coin_earn_${orderId}` || tx.orderId === orderId && tx.type === "earned" && !String(tx.id || "").startsWith("coin_refund_")) && !String(tx.description || "").toLowerCase().includes("refund"));
		if (earnTx && typeof earnTx.amount === "number" && earnTx.amount > 0) earnedCoins = earnTx.amount;
		const alreadyClawedBack = history.some((tx) => tx.id === `coin_clawback_${orderId}` || tx.orderId === orderId && String(tx.description || "").toLowerCase().includes("reversed"));
		const effectiveRefund = !alreadyRefunded && redeemedCoins > 0 ? redeemedCoins : 0;
		const effectiveClawback = !alreadyClawedBack && earnedCoins > 0 ? earnedCoins : 0;
		if (effectiveRefund === 0 && effectiveClawback === 0) return {
			refundedCoins: 0,
			clawedBackCoins: 0,
			newBalance: await coinService.getUserCoins(cleanUserId)
		};
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		if (effectiveRefund > 0) try {
			await apiClient.post("/coinHistory", {
				id: `coin_refund_${orderId}`,
				userId: cleanUserId,
				orderId,
				amount: effectiveRefund,
				type: "earned",
				description: `Smart Coins refund for cancelled Order #${orderId}`,
				timestamp: nowIso
			});
		} catch (refundErr) {
			console.error(`Failed to record coin refund for order #${orderId}:`, refundErr);
			throw new Error(`Failed to record coin refund for cancelled order #${orderId}`);
		}
		if (effectiveClawback > 0) try {
			await apiClient.post("/coinHistory", {
				id: `coin_clawback_${orderId}`,
				userId: cleanUserId,
				orderId,
				amount: effectiveClawback,
				type: "redeemed",
				description: `Smart Coins reversed for cancelled Order #${orderId}`,
				timestamp: nowIso
			});
		} catch (clawErr) {
			console.error(`Failed to record coin clawback for order #${orderId}:`, clawErr);
		}
		let newBalance = 0;
		try {
			const userEndpoint = getCustomerProfileEndpoint(cleanUserId);
			const latestUser = await apiClient.get(userEndpoint);
			if (latestUser) {
				const startingBalance = typeof latestUser.smartCoins === "number" ? latestUser.smartCoins : typeof latestUser.coins === "number" ? latestUser.coins : latestUser.availableCoins ?? 0;
				newBalance = Math.max(0, startingBalance + effectiveRefund - effectiveClawback);
				const patchPayload = { smartCoins: newBalance };
				if (effectiveClawback > 0 && ("earnedCoins" in latestUser || latestUser.earnedCoins !== void 0)) patchPayload["earnedCoins"] = Math.max(0, (latestUser.earnedCoins || 0) - effectiveClawback);
				const patchedUser = await apiClient.patch(userEndpoint, patchPayload);
				authService.syncUserSession({
					...latestUser,
					...patchedUser,
					smartCoins: newBalance,
					coins: newBalance
				});
			}
		} catch (balanceErr) {
			console.error(`Failed to update customer balance during cancellation of order #${orderId}:`, balanceErr);
			throw balanceErr;
		}
		return {
			refundedCoins: effectiveRefund,
			clawedBackCoins: effectiveClawback,
			newBalance
		};
	},
	async cancelOrder(orderId, userId) {
		const order = await this.getOrderById(orderId, userId);
		if (!order) throw new Error("Order not found");
		if (userId && order.userId !== userId) throw new Error("Access denied: You cannot cancel another customer's order.");
		if (order.status !== "pending" && order.status !== "processing") throw new Error(`Cannot cancel order with status "${order.status}". Cancellation is only permitted while pending or processing.`);
		return this.updateOrderStatus(orderId, "cancelled", userId);
	},
	async requestReturn(orderId, userId) {
		const order = await this.getOrderById(orderId, userId);
		if (!order) throw new Error("Order not found");
		if (userId && order.userId !== userId) throw new Error("Access denied: You cannot request return for another customer's order.");
		if (order.status !== "delivered") throw new Error("Returns can only be requested for delivered orders.");
		const deliveredTimestamp = order.deliveredAt || order.createdAt;
		if (deliveredTimestamp) {
			const deliveredTime = new Date(deliveredTimestamp).getTime();
			if (Date.now() - deliveredTime > 864e5) throw new Error("Returns can only be requested within 24 hours of delivery.");
		}
		return this.updateOrderStatus(orderId, "returned", userId);
	},
	async reorder(order, userId) {
		let addedCount = 0;
		let unavailableCount = 0;
		const unavailableNames = [];
		for (const item of order.items) try {
			const product = await apiClient.get(`/products/${item.productId}`);
			if (!product || product.isActive === false) {
				unavailableCount++;
				unavailableNames.push(item.name);
				continue;
			}
			let optIndex = product.options.findIndex((o) => o.unit === item.unit && o.unitSize === item.unitSize && o.stock > 0);
			if (optIndex === -1) optIndex = product.options.findIndex((o) => o.stock > 0);
			if (optIndex !== -1) {
				await cartService.addToCart(product, optIndex, item.quantity, userId);
				addedCount++;
			} else {
				unavailableCount++;
				unavailableNames.push(item.name);
			}
		} catch {
			unavailableCount++;
			unavailableNames.push(item.name);
		}
		return {
			addedCount,
			unavailableCount,
			unavailableNames
		};
	}
};
var activeRecaptchaVerifier = null;
/**
* Normalizes a country code and national number into standard E.164 format.
* Example: ("+91", "98400 12345") -> "+919840012345"
*/
function formatToE164(countryCode, nationalNumber) {
	const cleanCode = (countryCode || "+91").trim();
	const digits = nationalNumber.replace(/\D/g, "");
	return `${cleanCode.startsWith("+") ? cleanCode : `+${cleanCode}`}${digits}`;
}
/**
* Validates a national phone number according to country code rules.
*/
function validatePhoneNumber(nationalNumber, countryCode = "+91") {
	const digits = nationalNumber.replace(/\D/g, "");
	if (!digits) return {
		valid: false,
		error: "Please enter your mobile number."
	};
	if (countryCode === "+91") {
		if (digits.length !== 10) return {
			valid: false,
			error: "Please enter a valid 10-digit Indian mobile number."
		};
		if (!/^[6-9]/.test(digits)) return {
			valid: false,
			error: "Indian mobile numbers must start with 6, 7, 8, or 9."
		};
	} else if (digits.length < 6 || digits.length > 15) return {
		valid: false,
		error: "Please enter a valid mobile number (6 to 15 digits)."
	};
	return { valid: true };
}
/**
* Extracts a normalized Firebase Phone Authentication error code from various error shapes:
* - FirebaseError instance (error.code, e.g. "auth/invalid-app-credential")
* - Plain error with code (e.g. { code: "auth/invalid-app-credential" } or { code: "invalid-app-credential" })
* - Direct backend JSON error (e.g. { error: { message: "INVALID_APP_CREDENTIAL" } })
* - Error with string message containing Firebase code or backend string
* - Raw string code
*/
function extractPhoneAuthErrorCode(error) {
	if (!error) return "";
	if (typeof error === "string") {
		const trimmed = error.trim();
		if (trimmed.startsWith("auth/")) return trimmed.toLowerCase();
		if (trimmed === "INVALID_APP_CREDENTIAL") return "auth/invalid-app-credential";
		if (trimmed === "TOO_MANY_ATTEMPTS_TRY_LATER") return "auth/too-many-requests";
		if (trimmed === "QUOTA_EXCEEDED") return "auth/quota-exceeded";
		if (trimmed === "CAPTCHA_CHECK_FAILED") return "auth/captcha-check-failed";
		const authMatch = trimmed.match(/auth\/[a-z0-9-]+/i);
		if (authMatch) return authMatch[0].toLowerCase();
		return trimmed;
	}
	const errObj = error;
	const rawCode = typeof errObj["code"] === "string" ? errObj["code"].trim() : "";
	if (rawCode) {
		if (rawCode.startsWith("auth/")) return rawCode.toLowerCase();
		return `auth/${rawCode.toLowerCase()}`;
	}
	const nestedError = errObj["error"];
	const backendMsg = typeof nestedError?.["message"] === "string" ? nestedError["message"].trim() : typeof errObj["message"] === "string" ? errObj["message"].trim() : "";
	if (backendMsg === "INVALID_APP_CREDENTIAL") return "auth/invalid-app-credential";
	if (backendMsg === "TOO_MANY_ATTEMPTS_TRY_LATER") return "auth/too-many-requests";
	if (backendMsg === "QUOTA_EXCEEDED") return "auth/quota-exceeded";
	if (backendMsg === "CAPTCHA_CHECK_FAILED") return "auth/captcha-check-failed";
	const match = backendMsg.match(/auth\/[a-z0-9-]+/i);
	if (match) return match[0].toLowerCase();
	return "";
}
/**
* Maps Firebase Phone Authentication errors to clear, customer-friendly messages.
*/
function mapPhoneAuthError(error) {
	const errCode = extractPhoneAuthErrorCode(error);
	const rawMessage = error instanceof Error ? error.message : String(error);
	switch (errCode) {
		case "auth/invalid-app-credential": return "Security verification failed (invalid app credential). Please complete the reCAPTCHA challenge below and try again.";
		case "auth/missing-app-credential": return "Security verification token is missing. Please complete the reCAPTCHA challenge below and try again.";
		case "auth/captcha-check-failed": return "Security verification (reCAPTCHA) failed. Please check 'I'm not a robot' below and try again.";
		case "auth/invalid-phone-number": return "The phone number entered is invalid. Please check the digits and try again.";
		case "auth/missing-phone-number": return "Please enter your mobile number before requesting an OTP.";
		case "auth/quota-exceeded": return "SMS quota exceeded for today. Please try again later or contact customer support.";
		case "auth/too-many-requests": return "Too many OTP requests from this device. Please wait a few moments before trying again.";
		case "auth/invalid-verification-code": return "Invalid verification code. Please enter the correct 6-digit OTP sent to your phone.";
		case "auth/code-expired": return "The verification code has expired. Please request a new OTP.";
		case "auth/credential-already-in-use": return "This mobile number is already linked to another Sri Amman account. Please use your registered account or contact support.";
		case "auth/provider-already-linked": return "A mobile number is already linked to this account.";
		case "auth/requires-recent-login": return "For your security, please sign in again before linking a new mobile number.";
		case "auth/unauthorized-domain": return "This domain is not authorized for SMS verification. Please access the application via http://localhost:5173.";
		case "auth/network-request-failed": return "Network connection error. Please verify your internet connection and try again.";
		default:
			if (rawMessage.toLowerCase().includes("recaptcha")) return "reCAPTCHA verification failed. Please complete the challenge below and try again.";
			return rawMessage || "Failed to process phone verification. Please try again.";
	}
}
var phoneVerificationService = {
	/**
	* Initializes a visible RecaptchaVerifier instance on the specified container and renders it.
	* If an active verifier already exists, clears it first using the Firebase SDK clear() lifecycle.
	*/
	async initVisibleRecaptcha(container, options = {}) {
		if (typeof window === "undefined") throw new Error("RecaptchaVerifier requires a browser window environment.");
		this.clearRecaptcha();
		const targetEl = typeof container === "string" ? document.getElementById(container) : container;
		if (!targetEl) throw new Error(`reCAPTCHA target container "${typeof container === "string" ? container : "element"}" was not found in the DOM.`);
		const verifier = new RecaptchaVerifier(auth, targetEl, {
			size: "normal",
			callback: (token) => {
				if (options.onSolved) options.onSolved(token);
			},
			"expired-callback": () => {
				if (options.onExpired) options.onExpired();
			},
			"error-callback": (err) => {
				if (options.onError) options.onError(err);
			}
		});
		try {
			await verifier.render();
		} catch (renderErr) {
			console.warn("[PhoneVerificationService] Recaptcha render error:", renderErr);
		}
		activeRecaptchaVerifier = verifier;
		return verifier;
	},
	/**
	* Returns the currently active RecaptchaVerifier if already initialized and not destroyed.
	*/
	getActiveVerifier() {
		if (activeRecaptchaVerifier && !activeRecaptchaVerifier.destroyed) return activeRecaptchaVerifier;
		return null;
	},
	/**
	* Cleans up the active RecaptchaVerifier using the official SDK clear() method.
	* Clears the Firebase verifier through its SDK lifecycle without directly manipulating the widget.
	*/
	clearRecaptcha() {
		if (activeRecaptchaVerifier) {
			try {
				if (!activeRecaptchaVerifier.destroyed) activeRecaptchaVerifier.clear();
			} catch {}
			activeRecaptchaVerifier = null;
		}
	},
	/**
	* Sends a real SMS OTP via Firebase Phone Authentication.
	* Uses linkWithPhoneNumber if the user is already authenticated with email/Google,
	* falling back to signInWithPhoneNumber if already linked or unauthenticated.
	*/
	async sendVerificationOtp(e164PhoneNumber, appVerifier) {
		if (!/^\+[1-9]\d{6,14}$/.test(e164PhoneNumber)) throw new Error("Invalid phone number format. Must be E.164 (e.g. +919840012345).");
		const authInstance = auth;
		const currentUser = authInstance.currentUser;
		if (currentUser && !currentUser.phoneNumber) try {
			return await linkWithPhoneNumber(currentUser, e164PhoneNumber, appVerifier);
		} catch (linkError) {
			const code = linkError?.code;
			if (code === "auth/provider-already-linked" || code === "auth/credential-already-in-use" || code === "auth/email-already-in-use") return await signInWithPhoneNumber(authInstance, e164PhoneNumber, appVerifier);
			throw linkError;
		}
		return await signInWithPhoneNumber(authInstance, e164PhoneNumber, appVerifier);
	},
	/**
	* Verifies the 6-digit OTP code against the Firebase ConfirmationResult.
	*/
	async confirmVerificationOtp(confirmationResult, otpCode) {
		const cleanCode = (otpCode || "").trim().replace(/\D/g, "");
		if (cleanCode.length !== 6) throw new Error("Please enter a valid 6-digit verification code.");
		const credentialResult = await confirmationResult.confirm(cleanCode);
		const currentUser = auth.currentUser;
		if (currentUser && credentialResult.user.uid !== currentUser.uid && credentialResult.user.phoneNumber) try {
			const phoneAuthCred = PhoneAuthProvider.credential(confirmationResult.verificationId, cleanCode);
			await updatePhoneNumber(currentUser, phoneAuthCred);
		} catch (updateErr) {
			console.warn("[PhoneVerification] updatePhoneNumber warning:", updateErr?.message);
		}
		return {
			success: true,
			phoneNumber: currentUser?.phoneNumber || credentialResult.user.phoneNumber || ""
		};
	},
	/**
	* Persists the verified phone number to the customer's canonical profile.
	* Updates `phoneVerified: true` and the E.164 phone number.
	*/
	async persistVerifiedPhone(params) {
		const { userId, verifiedPhone, uid } = params;
		const cleanPhone = (verifiedPhone || "").trim();
		if (!cleanPhone || !/^\+\d{7,15}$/.test(cleanPhone)) throw new Error("Invalid verified phone number format.");
		const detectedCountryCode = [
			"+971",
			"+61",
			"+44",
			"+91",
			"+1"
		].find((code) => cleanPhone.startsWith(code)) || "+91";
		const nationalNumber = cleanPhone.slice(detectedCountryCode.length).replace(/\D/g, "");
		const mode = authManager.getMode();
		const activeUid = uid || auth.currentUser?.uid;
		if (mode === "production" && activeUid) return await customerIdentityService.updateVerifiedPhoneNumber({
			uid: activeUid,
			customerId: userId,
			verifiedE164Phone: cleanPhone
		});
		const endpoint = getCustomerProfileEndpoint(userId);
		const payload = {
			phoneVerified: true,
			phone: cleanPhone,
			number: nationalNumber,
			countryCode: detectedCountryCode,
			updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
			lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
		};
		try {
			const patched = await apiClient.patch(endpoint, payload);
			if (patched) return patched;
		} catch {}
		return {
			id: userId,
			userId,
			name: "Customer",
			phone: cleanPhone,
			countryCode: detectedCountryCode,
			phoneVerified: true,
			email: "",
			isVIP: false,
			referralCode: userId,
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		};
	}
};
var COUNTRY_CODES$2 = [
	{
		code: "+91",
		label: "India (+91)",
		digits: 10
	},
	{
		code: "+1",
		label: "USA/Canada (+1)",
		digits: 10
	},
	{
		code: "+44",
		label: "UK (+44)",
		digits: 10
	},
	{
		code: "+61",
		label: "Australia (+61)",
		digits: 9
	},
	{
		code: "+971",
		label: "UAE (+971)",
		digits: 9
	}
];
function PhoneVerificationModal({ isOpen, onClose, onSuccess, initialPhone = "", initialCountryCode = "+91", title = "Verify Mobile Number", subtitle = "Verify your mobile number with OTP to continue with checkout and receive delivery rider updates." }) {
	const { user, refreshUser } = useAuth();
	const defaultDigits = (initialPhone || user?.phone || "").replace(/^\+\d{1,4}\s*/, "").replace(/\D/g, "").slice(-10);
	const [countryCode, setCountryCode] = (0, import_react.useState)(initialCountryCode);
	const [nationalNumber, setNationalNumber] = (0, import_react.useState)(defaultDigits);
	const [otpCode, setOtpCode] = (0, import_react.useState)("");
	const [step, setStep] = (0, import_react.useState)("phone_input");
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	const [errorMessage, setErrorMessage] = (0, import_react.useState)("");
	const [resendCooldown, setResendCooldown] = (0, import_react.useState)(0);
	const [confirmationResult, setConfirmationResult] = (0, import_react.useState)(null);
	const [verifiedE164Phone, setVerifiedE164Phone] = (0, import_react.useState)("");
	const [isRecaptchaSolved, setIsRecaptchaSolved] = (0, import_react.useState)(false);
	const recaptchaContainerRef = (0, import_react.useRef)(null);
	const timerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (resendCooldown > 0) timerRef.current = setTimeout(() => {
			setResendCooldown((prev) => prev - 1);
		}, 1e3);
		return () => {
			if (timerRef.current) clearTimeout(timerRef.current);
		};
	}, [resendCooldown]);
	(0, import_react.useEffect)(() => {
		return () => {
			phoneVerificationService.clearRecaptcha();
		};
	}, []);
	(0, import_react.useEffect)(() => {
		let isMounted = true;
		if (isOpen && step === "phone_input") {
			setIsRecaptchaSolved(false);
			const initTimer = setTimeout(() => {
				const container = recaptchaContainerRef.current;
				if (!container || !isMounted) return;
				phoneVerificationService.initVisibleRecaptcha(container, {
					onSolved: () => {
						if (isMounted) {
							setIsRecaptchaSolved(true);
							setErrorMessage("");
						}
					},
					onExpired: () => {
						if (isMounted) {
							setIsRecaptchaSolved(false);
							setErrorMessage("Security verification expired. Please check the box again.");
						}
					},
					onError: (err) => {
						if (isMounted) console.warn("[PhoneVerificationModal] reCAPTCHA widget error:", err);
					}
				}).catch((err) => {
					if (isMounted) console.warn("[PhoneVerificationModal] initVisibleRecaptcha error:", err);
				});
			}, 50);
			return () => {
				clearTimeout(initTimer);
				isMounted = false;
				phoneVerificationService.clearRecaptcha();
			};
		}
		return () => {
			isMounted = false;
			phoneVerificationService.clearRecaptcha();
		};
	}, [isOpen, step]);
	(0, import_react.useEffect)(() => {
		if (!isOpen) {
			setErrorMessage("");
			setOtpCode("");
			setStep("phone_input");
			setIsRecaptchaSolved(false);
			phoneVerificationService.clearRecaptcha();
		}
	}, [isOpen]);
	if (!isOpen) return null;
	const handleSendOtp = async (e) => {
		if (e) e.preventDefault();
		setErrorMessage("");
		const validation = validatePhoneNumber(nationalNumber, countryCode);
		if (!validation.valid) {
			setErrorMessage(validation.error || "Please enter a valid mobile number.");
			return;
		}
		const verifier = phoneVerificationService.getActiveVerifier();
		if (!verifier) {
			setErrorMessage("Security verification is loading. Please wait a moment and try again.");
			return;
		}
		if (!isRecaptchaSolved) {
			setErrorMessage("Please check the 'I'm not a robot' box below before requesting an OTP.");
			return;
		}
		const e164 = formatToE164(countryCode, nationalNumber);
		setIsLoading(true);
		try {
			const confirmation = await phoneVerificationService.sendVerificationOtp(e164, verifier);
			setConfirmationResult(confirmation);
			setVerifiedE164Phone(e164);
			setStep("otp_input");
			setResendCooldown(30);
			toast.success(`Verification OTP sent to ${countryCode} ${nationalNumber}`);
		} catch (err) {
			const rawCode = extractPhoneAuthErrorCode(err);
			const maskedPhone = nationalNumber ? `${countryCode}******${nationalNumber.slice(-4)}` : "";
			console.warn("[PhoneVerificationModal] sendOtp error:", {
				code: rawCode,
				phone: maskedPhone,
				rawError: err
			});
			const friendlyError = mapPhoneAuthError(err);
			setErrorMessage(friendlyError);
			setIsRecaptchaSolved(false);
			const container = recaptchaContainerRef.current;
			if (container) phoneVerificationService.initVisibleRecaptcha(container, {
				onSolved: () => {
					setIsRecaptchaSolved(true);
					setErrorMessage("");
				},
				onExpired: () => {
					setIsRecaptchaSolved(false);
				}
			}).catch(() => {});
		} finally {
			setIsLoading(false);
		}
	};
	const handleVerifyOtp = async (e) => {
		if (e) e.preventDefault();
		if (!confirmationResult) {
			setErrorMessage("Missing verification session. Please request a new OTP.");
			setStep("phone_input");
			return;
		}
		const cleanCode = otpCode.trim().replace(/\D/g, "");
		if (cleanCode.length !== 6) {
			setErrorMessage("Please enter the complete 6-digit OTP code.");
			return;
		}
		setIsLoading(true);
		setErrorMessage("");
		let confirmedPhone = verifiedE164Phone;
		try {
			const result = await phoneVerificationService.confirmVerificationOtp(confirmationResult, cleanCode);
			if (result.phoneNumber) confirmedPhone = result.phoneNumber;
		} catch (err) {
			console.error("[PhoneVerificationModal] confirmOtp error:", err);
			setIsLoading(false);
			setErrorMessage(mapPhoneAuthError(err));
			return;
		}
		try {
			const activeCustomerId = user?.id || user?.userId || "";
			if (activeCustomerId) await phoneVerificationService.persistVerifiedPhone({
				userId: activeCustomerId,
				verifiedPhone: confirmedPhone,
				...user?.uid ? { uid: user.uid } : {}
			});
			await refreshUser();
			try {
				if (activeCustomerId) await notificationService.createPhoneVerifiedNotification({
					userId: activeCustomerId,
					phone: confirmedPhone
				});
			} catch (notifErr) {
				console.warn("[PhoneVerificationModal] Failed to trigger phone verified notification:", notifErr);
			}
			setStep("success");
			toast.success("Mobile number verified successfully!");
			setTimeout(() => {
				onSuccess(confirmedPhone);
				onClose();
			}, 1e3);
		} catch (syncErr) {
			console.error("[PhoneVerificationModal] Firestore sync error:", syncErr);
			setStep("sync_error");
			setErrorMessage(syncErr instanceof Error ? syncErr.message : "Your phone was verified with Firebase, but we could not update your store profile. Please click Retry to sync.");
		} finally {
			setIsLoading(false);
		}
	};
	const handleRetrySync = async () => {
		setIsLoading(true);
		setErrorMessage("");
		try {
			const activeCustomerId = user?.id || user?.userId || "";
			await phoneVerificationService.persistVerifiedPhone({
				userId: activeCustomerId,
				verifiedPhone: verifiedE164Phone,
				...user?.uid ? { uid: user.uid } : {}
			});
			await refreshUser();
			setStep("success");
			toast.success("Profile synchronized and mobile number verified!");
			setTimeout(() => {
				onSuccess(verifiedE164Phone);
				onClose();
			}, 1e3);
		} catch (err) {
			setErrorMessage(err.message || "Failed to synchronize profile. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "phone-verification-title",
		className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-surface-container-lowest rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-outline-variant/15 animate-in zoom-in-95 duration-200 relative",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					"aria-label": "Close phone verification",
					className: "absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 mb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-6 h-6" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						id: "phone-verification-title",
						className: "font-headline-sm text-base font-extrabold text-on-surface",
						children: title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-on-surface-variant mt-0.5 leading-snug",
						children: subtitle
					})] })]
				}),
				errorMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "alert",
					className: "mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2 animate-in fade-in duration-150",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "w-4 h-4 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "leading-relaxed flex-1",
						children: errorMessage
					})]
				}),
				step === "phone_input" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSendOtp,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "pv-phone-input",
								className: "block text-xs font-bold text-on-surface mb-1.5",
								children: "Mobile Number"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									value: countryCode,
									onChange: (e) => setCountryCode(e.target.value),
									disabled: isLoading,
									className: "bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/25 text-xs font-bold text-on-surface focus:border-primary focus:outline-none",
									children: COUNTRY_CODES$2.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: c.code,
										children: c.label
									}, c.code))
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "relative flex-1",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "pv-phone-input",
										type: "tel",
										inputMode: "numeric",
										required: true,
										disabled: isLoading,
										value: nationalNumber,
										onChange: (e) => setNationalNumber(e.target.value.replace(/\D/g, "").slice(0, 10)),
										placeholder: "98400 12345",
										className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 text-xs font-bold text-on-surface tracking-wide focus:border-primary focus:outline-none"
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[10px] text-on-surface-variant mt-1.5 flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[13px] text-primary",
									children: "verified_user"
								}), "A 6-digit SMS verification code will be sent to this number."]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex justify-center my-2 min-h-[78px]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								id: "recaptcha-phone-verification",
								ref: recaptchaContainerRef
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3 pt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: onClose,
								disabled: isLoading,
								className: "flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface font-headline-sm text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: isLoading || !nationalNumber.trim(),
								className: "flex-1 py-2.5 rounded-xl bg-primary text-white font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50",
								children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sending OTP..." })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Send OTP" })
							})]
						})
					]
				}),
				step === "otp_input" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleVerifyOtp,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-3 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-on-surface-variant uppercase font-bold block",
								children: "Verifying Number"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs font-extrabold text-primary",
								children: [
									countryCode,
									" ",
									nationalNumber
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									setStep("phone_input");
									setOtpCode("");
									setErrorMessage("");
								},
								disabled: isLoading,
								className: "text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Change" })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							htmlFor: "pv-otp-input",
							className: "block text-xs font-bold text-on-surface mb-1.5",
							children: "Enter 6-Digit OTP Code"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							id: "pv-otp-input",
							type: "text",
							inputMode: "numeric",
							maxLength: 6,
							required: true,
							autoFocus: true,
							disabled: isLoading,
							value: otpCode,
							onChange: (e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6)),
							placeholder: "• • • • • •",
							className: "w-full text-center tracking-[0.5em] text-lg font-black bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/25 text-on-surface focus:border-primary focus:outline-none"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-xs pt-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] text-on-surface-variant",
								children: "Didn't receive code?"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => handleSendOtp(),
								disabled: isLoading || resendCooldown > 0,
								className: "font-bold text-primary hover:underline disabled:text-outline disabled:no-underline cursor-pointer flex items-center gap-1",
								children: resendCooldown > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"Resend in ",
									resendCooldown,
									"s"
								] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-3 h-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Resend OTP" })] })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3 pt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setStep("phone_input"),
								disabled: isLoading,
								className: "flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface font-headline-sm text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer",
								children: "Back"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: isLoading || otpCode.trim().length !== 6,
								className: "flex-1 py-2.5 rounded-xl bg-primary text-white font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50",
								children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Verifying..." })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Verify OTP" })
							})]
						})
					]
				}),
				step === "sync_error" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-4 text-center py-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-6 h-6 animate-spin" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "font-headline-sm text-sm font-extrabold text-on-surface",
							children: "Phone Verified in Firebase"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-on-surface-variant mt-1 leading-relaxed",
							children: "Your phone was verified via SMS, but our store profile update was interrupted. Click below to retry saving your verified number without requesting another OTP."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: handleRetrySync,
							disabled: isLoading,
							className: "w-full py-2.5 rounded-xl bg-primary text-white font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50",
							children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Synchronizing..." })] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Retry Profile Synchronization" })] })
						})
					]
				}),
				step === "success" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center py-4 space-y-2 animate-in zoom-in-95 duration-200",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-7 h-7" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "font-headline-sm text-sm font-extrabold text-emerald-900",
							children: "Mobile Number Verified!"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-on-surface-variant",
							children: "Your canonical phone number has been updated. Resuming checkout..."
						})
					]
				})
			]
		})
	});
}
var Route$15 = createFileRoute("/account")({
	head: () => ({ meta: [{ title: "Profile & Account Overview — Sri Amman Smart Store" }, {
		name: "description",
		content: "Manage your personal profile, addresses, Smart Coins, and orders."
	}] }),
	component: AccountPage
});
function AccountPage() {
	const { user, isLoading: authLoading, isResolvingIdentity, logout, updateProfile, refreshUser } = useAuth();
	const { language } = useLanguage();
	const navigate = useNavigate();
	const [showPhoneVerificationModal, setShowPhoneVerificationModal] = (0, import_react.useState)(false);
	const [orders, setOrders] = (0, import_react.useState)([]);
	const [ordersError, setOrdersError] = (0, import_react.useState)(null);
	const [addresses, setAddresses] = (0, import_react.useState)([]);
	const [wishlistCount, setWishlistCount] = (0, import_react.useState)(0);
	const [unreadNotificationsCount, setUnreadNotificationsCount] = (0, import_react.useState)(0);
	const [storeInfo, setStoreInfo] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [showEditProfileModal, setShowEditProfileModal] = (0, import_react.useState)(false);
	const [editName, setEditName] = (0, import_react.useState)("");
	const [editEmail, setEditEmail] = (0, import_react.useState)("");
	const [editLanguage, setEditLanguage] = (0, import_react.useState)("Tamil / English (தமிழ் / English)");
	const [editBirthday, setEditBirthday] = (0, import_react.useState)("");
	const [editGroceryRhythm, setEditGroceryRhythm] = (0, import_react.useState)("");
	const [isSavingProfile, setIsSavingProfile] = (0, import_react.useState)(false);
	const [showAddressModal, setShowAddressModal] = (0, import_react.useState)(false);
	const [editingAddressId, setEditingAddressId] = (0, import_react.useState)(null);
	const [addrTag, setAddrTag] = (0, import_react.useState)("Home");
	const [addrName, setAddrName] = (0, import_react.useState)("");
	const [addrPhone, setAddrPhone] = (0, import_react.useState)("");
	const [addrHouseNo, setAddrHouseNo] = (0, import_react.useState)("");
	const [addrStreet, setAddrStreet] = (0, import_react.useState)("");
	const [addrLandmark, setAddrLandmark] = (0, import_react.useState)("");
	const [addrCity, setAddrCity] = (0, import_react.useState)("Gobichettipalayam");
	const [addrPincode, setAddrPincode] = (0, import_react.useState)("638454");
	const [addrLat, setAddrLat] = (0, import_react.useState)(11.4598);
	const [addrLng, setAddrLng] = (0, import_react.useState)(77.334);
	const [addrIsDefault, setAddrIsDefault] = (0, import_react.useState)(false);
	const [isSavingAddress, setIsSavingAddress] = (0, import_react.useState)(false);
	const [showSettingsModal, setShowSettingsModal] = (0, import_react.useState)(false);
	const [whatsappUpdates, setWhatsappUpdates] = (0, import_react.useState)(true);
	const [smsAlerts, setSmsAlerts] = (0, import_react.useState)(true);
	const [promoOffers, setPromoOffers] = (0, import_react.useState)(true);
	const [coinsBalance, setCoinsBalance] = (0, import_react.useState)(null);
	const loadAccountData = async () => {
		if (!user) {
			setLoading(false);
			return;
		}
		try {
			setLoading(true);
			const [userOrders, userAddresses, userWishlist, userNotifications, store, userCoins] = await Promise.allSettled([
				orderService.getOrders(user.id, user.legacySassId),
				addressService.getAddresses(user.id, user.legacySassId),
				wishlistService.getWishlistProducts(void 0, user.id),
				notificationService.getNotifications(user.id, user.legacySassId),
				settingsService.getStoreInfo(),
				coinService.getUserCoins(user.id, user.legacySassId)
			]);
			if (userOrders.status === "fulfilled") {
				setOrders(userOrders.value || []);
				setOrdersError(null);
			} else {
				const msg = userOrders.reason instanceof Error ? userOrders.reason.message : "Failed to load orders from store database";
				setOrdersError(msg);
				setOrders([]);
			}
			if (userAddresses.status === "fulfilled") setAddresses(userAddresses.value || []);
			if (userWishlist.status === "fulfilled") setWishlistCount(userWishlist.value?.length || 0);
			if (userNotifications.status === "fulfilled") {
				const unread = (userNotifications.value || []).filter((n) => !n.read).length;
				setUnreadNotificationsCount(unread);
			}
			if (store.status === "fulfilled") setStoreInfo(store.value);
			if (userCoins.status === "fulfilled" && typeof userCoins.value === "number") setCoinsBalance(userCoins.value);
		} catch (err) {
			console.error("Failed to load account data:", err);
			toast.error("Could not load full profile data. Please refresh.");
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		if (user?.id) loadAccountData();
		else if (!authLoading && !isResolvingIdentity) setLoading(false);
	}, [
		user?.id,
		user?.legacySassId,
		authLoading,
		isResolvingIdentity
	]);
	const effectiveCoins = coinsBalance ?? user?.smartCoins ?? user?.coins ?? 0;
	const activeOrdersCount = (0, import_react.useMemo)(() => {
		return orders.filter((o) => [
			"pending",
			"processing",
			"packed",
			"in transit"
		].includes(o.status)).length;
	}, [orders]);
	const lifetimeSpend = (0, import_react.useMemo)(() => {
		return orders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + (o.pricingSummary?.totalAmount || 0), 0);
	}, [orders]);
	const vipStatus = (0, import_react.useMemo)(() => {
		return coinService.calculateVIPStatus(orders, 5e3);
	}, [orders]);
	const isUserVip = (0, import_react.useMemo)(() => {
		return vipStatus.isVIP || user?.isVIP || false;
	}, [vipStatus, user]);
	const customerSassId = user?.id || user?.userId || "Not available";
	const memberSinceFormatted = (0, import_react.useMemo)(() => {
		if (!user?.createdAt) return "Jan 2024";
		try {
			return new Date(user.createdAt).toLocaleDateString("en-IN", {
				month: "short",
				year: "numeric"
			});
		} catch {
			return "Jan 2024";
		}
	}, [user?.createdAt]);
	const addressesGeofenceVerified = (0, import_react.useMemo)(() => {
		if (addresses.length === 0) return true;
		return addresses.every((addr) => addressService.validateGeofence(addr.lat, addr.lng).eligible);
	}, [addresses]);
	const addressTagsSummary = (0, import_react.useMemo)(() => {
		if (addresses.length === 0) return "No locations configured";
		return Array.from(new Set(addresses.map((a) => a.tag))).join(" & ") + " configured";
	}, [addresses]);
	const handleLogout = () => {
		if (window.confirm("Are you sure you want to log out of your account?")) {
			logout();
			toast.info("Logged out successfully");
			navigate({ to: "/login" });
		}
	};
	const handleOpenEditProfile = () => {
		if (!user) return;
		setEditName(user.name || "");
		setEditEmail(user.email || "");
		setEditLanguage(user.preferredLanguage || "Tamil / English (தமிழ் / English)");
		setEditBirthday(user.dob || user.birthday || "");
		setEditGroceryRhythm(user.groceryRhythm || "Every Saturday Morning (4 Members)");
		setShowEditProfileModal(true);
	};
	const handleSaveProfile = async (e) => {
		e.preventDefault();
		if (!user) return;
		if (!editName.trim() || editName.trim().length < 2) {
			toast.error("Please enter a valid full name (minimum 2 characters)");
			return;
		}
		if (editEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail.trim())) {
			toast.error("Please enter a valid email address");
			return;
		}
		setIsSavingProfile(true);
		try {
			const trimmedBirthday = editBirthday.trim();
			const trimmedGroceryRhythm = editGroceryRhythm.trim();
			await updateProfile({
				name: editName.trim(),
				email: editEmail.trim(),
				preferredLanguage: editLanguage,
				...trimmedBirthday ? { dob: trimmedBirthday } : {},
				...trimmedGroceryRhythm ? { groceryRhythm: trimmedGroceryRhythm } : {}
			});
			setShowEditProfileModal(false);
			toast.success("Profile information updated successfully!");
		} catch (err) {
			toast.error(err.message || "Failed to save profile changes");
		} finally {
			setIsSavingProfile(false);
		}
	};
	const handleOpenAddAddress = () => {
		if (!user) return;
		setEditingAddressId(null);
		setAddrTag("Home");
		setAddrName(user.name || "");
		setAddrPhone(user.phone || "");
		setAddrHouseNo("");
		setAddrStreet("");
		setAddrLandmark("");
		setAddrCity("Gobichettipalayam");
		setAddrPincode("638454");
		setAddrLat(11.4598);
		setAddrLng(77.334);
		setAddrIsDefault(addresses.length === 0);
		setShowAddressModal(true);
	};
	const handleOpenEditAddress = (addr) => {
		setEditingAddressId(addr.id);
		setAddrTag(addr.tag);
		setAddrName(addr.name);
		setAddrPhone(addr.phone);
		setAddrHouseNo(addr.houseNo);
		setAddrStreet(addr.street);
		setAddrLandmark(addr.landmark || "");
		setAddrCity(addr.city);
		setAddrPincode(addr.pincode);
		setAddrLat(addr.lat);
		setAddrLng(addr.lng);
		setAddrIsDefault(addr.isDefault);
		setShowAddressModal(true);
	};
	const handleSaveAddress = async (e) => {
		e.preventDefault();
		if (!user) return;
		if (!addrName.trim()) {
			toast.error("Please enter recipient name");
			return;
		}
		if (!addrPhone.trim() || addrPhone.replace(/\D/g, "").length < 10) {
			toast.error("Please enter a valid 10-digit contact phone number");
			return;
		}
		if (!addrHouseNo.trim()) {
			toast.error("Please enter house, flat, or door number");
			return;
		}
		if (!addrStreet.trim()) {
			toast.error("Please enter street address or locality");
			return;
		}
		if (!addrPincode.trim() || addrPincode.trim().length !== 6) {
			toast.error("Please enter a valid 6-digit pincode");
			return;
		}
		setIsSavingAddress(true);
		try {
			const trimmedLandmark = addrLandmark.trim();
			if (editingAddressId) {
				await addressService.updateAddress(editingAddressId, {
					userId: user.id,
					tag: addrTag,
					name: addrName.trim(),
					phone: addrPhone.trim(),
					houseNo: addrHouseNo.trim(),
					street: addrStreet.trim(),
					...trimmedLandmark ? { landmark: trimmedLandmark } : {},
					city: addrCity.trim(),
					pincode: addrPincode.trim(),
					lat: addrLat,
					lng: addrLng,
					isDefault: addrIsDefault
				});
				toast.success("Delivery address updated successfully!");
			} else {
				await addressService.addAddress({
					userId: user.id,
					tag: addrTag,
					name: addrName.trim(),
					phone: addrPhone.trim(),
					houseNo: addrHouseNo.trim(),
					street: addrStreet.trim(),
					...trimmedLandmark ? { landmark: trimmedLandmark } : {},
					city: addrCity.trim(),
					pincode: addrPincode.trim(),
					lat: addrLat,
					lng: addrLng,
					isDefault: addrIsDefault || addresses.length === 0
				});
				toast.success("New delivery address added successfully!");
			}
			setShowAddressModal(false);
			await loadAccountData();
		} catch (err) {
			toast.error(err.message || "Failed to save address");
		} finally {
			setIsSavingAddress(false);
		}
	};
	const handleSetDefaultAddress = async (addressId) => {
		if (!user) return;
		try {
			await addressService.setDefaultAddress(addressId, user.id);
			toast.success("Default delivery address updated");
			await loadAccountData();
		} catch (err) {
			toast.error(err.message || "Failed to set default address");
		}
	};
	const handleDeleteAddress = async (address) => {
		if (!user) return;
		if (addresses.length <= 1) {
			toast.error("You must have at least one saved delivery address.");
			return;
		}
		if (!window.confirm(`Are you sure you want to remove address "${address.tag} (${address.houseNo}, ${address.street})"?`)) return;
		try {
			await addressService.deleteAddress(address.id, user.id);
			if (address.isDefault) {
				const remaining = addresses.filter((a) => a.id !== address.id);
				if (remaining.length > 0 && remaining[0]) await addressService.setDefaultAddress(remaining[0].id, user.id);
			}
			toast.info("Address removed");
			await loadAccountData();
		} catch (err) {
			toast.error(err.message || "Failed to remove address");
		}
	};
	const handleSimulateGPS = () => {
		setAddrLat(11.4598);
		setAddrLng(77.334);
		setAddrCity("Gobichettipalayam");
		setAddrPincode("638454");
		setAddrStreet("Kasipalayam High Road");
		toast.info("GPS coordinates mapped to Gobichettipalayam Hub (Distance ~150m)");
	};
	if ((authLoading || isResolvingIdentity) && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[800px] mx-auto px-4 py-20 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10 h-10 border-4 border-[#005f3f] border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-on-surface-variant font-medium",
					children: "Loading your customer account..."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	if (!user && !loading && !authLoading && !isResolvingIdentity) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[800px] mx-auto px-4 py-20 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center text-4xl mx-auto mb-5 shadow-inner",
						children: "👤"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-headline-lg text-2xl font-extrabold text-on-surface mb-2",
						children: "Please Sign In to View Your Account"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-on-surface-variant max-w-md mx-auto mb-8 leading-relaxed",
						children: "Sign in with your registered phone number or email to view your orders, live deliveries, Smart Coins, and saved addresses."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/login",
						search: { redirect: "/account" },
						className: "inline-flex items-center gap-2 bg-[#005f3f] text-white px-7 py-3.5 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-[#004d32] transition-all cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined text-[18px]",
							children: "lock_open"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sign In with Phone OTP" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-[#f8faf8] font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] min-h-[calc(100vh-172px)] pb-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "flex items-center gap-2 text-xs text-on-surface-variant",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									className: "hover:text-primary transition-colors",
									children: "Home"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-outline-variant/60",
									children: "›"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-on-surface-variant",
									children: "Account Dashboard"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-outline-variant/60",
									children: "›"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-on-surface",
									children: "Profile Overview"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-bold text-emerald-800 self-start sm:self-auto",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								"Synced with ",
								storeInfo?.locationName?.split(",")[0] || "Gobichettipalayam",
								" Store Outlet"
							] })]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:col-span-4 xl:col-span-4 space-y-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-white rounded-3xl p-6 border border-outline-variant/20 shadow-sm relative overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 font-black text-2xl flex items-center justify-center ring-4 ring-emerald-50 overflow-hidden shadow-inner",
												children: user?.avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: user.avatarUrl,
													alt: user.name,
													className: "w-full h-full object-cover"
												}) : user?.name ? user.name.charAt(0).toUpperCase() : "👤"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: handleOpenEditProfile,
												title: "Edit Profile",
												className: "absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#005f3f] text-white flex items-center justify-center text-[12px] shadow-sm hover:scale-105 transition-all cursor-pointer",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[13px]",
													children: "photo_camera"
												})
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 flex-wrap",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
														className: "font-headline-lg text-lg font-black text-on-surface truncate",
														children: user?.name || "Customer"
													}), isUserVip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-flex items-center gap-1 bg-[#fea619] text-[#2a1700] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs",
														children: "👑 VIP MEMBER"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "mt-1 mb-1",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														"data-testid": "sidebar-customer-id-badge",
														className: "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#005f3f] border border-emerald-200/70 font-mono text-[11px] font-bold tracking-wide",
														children: ["Customer ID: ", customerSassId]
													})
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 mt-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs text-on-surface-variant font-medium truncate",
														children: user?.phone || "No phone linked"
													}), user?.phoneVerified ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[12px]",
															children: "verified"
														}), "Verified"]
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "inline-flex items-center gap-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-800",
															children: "Unverified"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: () => setShowPhoneVerificationModal(true),
															className: "text-[11px] font-bold text-[#005f3f] underline hover:text-[#004d32] cursor-pointer",
															children: "Verify"
														})]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-on-surface-variant/80 truncate",
													children: user?.email || "No email linked"
												})
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-5 bg-gradient-to-r from-amber-50 to-[#fff8ea] border border-amber-200/60 p-3.5 rounded-2xl flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-2xl",
												children: "🪙"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "font-headline-sm text-xs font-black text-on-surface",
												children: [effectiveCoins, " Smart Coins"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-[10px] text-on-surface-variant font-semibold",
												children: [
													"₹",
													convertCoinsToRupees(effectiveCoins).toFixed(2),
													" redeemable value"
												]
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/rewards",
											className: "text-xs font-black text-[#005f3f] hover:underline px-3 py-1.5 rounded-xl bg-white/80 shadow-xs border border-amber-200/50",
											children: "Passbook"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-white rounded-3xl p-3 border border-outline-variant/20 shadow-sm space-y-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-[#005f3f] text-white px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[20px]",
													children: "person"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-xs font-bold",
													children: "Profile Information"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[18px]",
												children: "chevron_right"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/orders",
											search: {},
											className: "px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]",
													children: "receipt_long"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-xs font-bold",
													children: "My Orders"
												})]
											}), ordersError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "bg-red-50 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[12px]",
													children: "warning"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sync Issue" })]
											}) : activeOrdersCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full",
												children: [activeOrdersCount, " Active"]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-on-surface-variant/70 font-medium",
												children: orders.length
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: "#saved-addresses",
											className: "px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]",
													children: "location_on"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-xs font-bold",
													children: "Saved Addresses"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-on-surface-variant font-medium",
												children: [addresses.length, " Saved"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/wishlist",
											className: "px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]",
													children: "favorite_border"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-xs font-bold",
													children: "Wishlist & Collections"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-on-surface-variant font-medium",
												children: [wishlistCount, " Items"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/rewards",
											className: "px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-amber-600 text-[20px]",
													children: "monetization_on"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-xs font-bold",
													children: "Smart Coins & Rewards"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full",
												children: [effectiveCoins, " Avail"]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/rewards",
											className: "px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[#fea619] text-[20px]",
													children: "workspace_premium"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-xs font-bold",
													children: "VIP Privilege Pass"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs font-bold text-amber-800",
												children: isUserVip ? "Active Pass" : "Spend ₹5k"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/refer",
											className: "px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]",
													children: "share"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-xs font-bold",
													children: "Refer & Earn"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs font-bold text-amber-700",
												children: "Earn ₹100"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/notifications",
											className: "px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]",
													children: "notifications"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-xs font-bold",
													children: "Notifications"
												})]
											}), unreadNotificationsCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "bg-rose-100 text-rose-800 text-[11px] font-bold px-2 py-0.5 rounded-full",
												children: [unreadNotificationsCount, " Unread"]
											}) : null]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-2 border-t border-outline-variant/15" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setShowSettingsModal(true),
											className: "w-full px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer text-left",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-on-surface-variant text-[20px]",
													children: "shield"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-xs font-bold",
													children: "Account Settings & Privacy"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[18px] text-outline-variant",
												children: "chevron_right"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/help",
											className: "px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]",
													children: "help_outline"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-xs font-bold",
													children: "Help, Support & FAQ"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[18px] text-outline-variant",
												children: "chevron_right"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/policies",
											className: "px-4 py-3 rounded-2xl flex items-center justify-between text-on-surface hover:bg-surface-container-low transition-colors group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-on-surface-variant group-hover:text-primary text-[20px]",
													children: "policy"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-xs font-bold",
													children: "Store Policies & Legal"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[18px] text-outline-variant",
												children: "chevron_right"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: handleLogout,
											className: "w-full px-4 py-3 rounded-2xl flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left mt-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[20px]",
												children: "logout"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-headline-sm text-xs font-bold",
												children: "Log Out"
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-emerald-50/70 border border-emerald-200/60 p-4 rounded-3xl flex items-start gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[#005f3f] text-[24px] shrink-0 mt-0.5",
										children: "verified_user"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-headline-sm text-xs font-black text-emerald-950",
										children: "Need instant billing help?"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[11px] text-emerald-900 mt-0.5 leading-relaxed",
										children: [
											"Call store directly at",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												href: `tel:${storeInfo?.phone || "+919840012345"}`,
												className: "font-black text-[#005f3f] underline",
												children: storeInfo?.phone || "+91 98400 12345"
											})
										]
									})] })]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:col-span-8 xl:col-span-8 space-y-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/15 pb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "font-headline-lg text-2xl sm:text-3xl font-black text-on-surface",
										children: "Profile & Account Overview"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-on-surface-variant mt-1",
										children: "Manage your personal information, address book, and shopping preferences"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-xs text-on-surface-variant font-medium",
										children: ["Member since ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-bold text-on-surface",
											children: memberSinceFormatted
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 md:grid-cols-4 gap-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-white p-5 rounded-3xl border border-outline-variant/20 shadow-xs relative flex flex-col justify-between",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between mb-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs font-bold text-on-surface-variant",
														children: "Total Orders"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-8 h-8 rounded-full bg-emerald-50 text-[#005f3f] flex items-center justify-center",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[18px]",
															children: "shopping_bag"
														})
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "font-headline-lg text-2xl font-black text-on-surface",
													children: ordersError ? "—" : orders.length
												}), ordersError ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-[11px] text-red-600 font-medium mt-1 truncate",
													title: ordersError,
													children: "Sync error"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-[11px] text-on-surface-variant mt-1 font-medium",
													children: [
														"Lifetime ",
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "font-bold text-emerald-800",
															children: ["₹", lifetimeSpend.toLocaleString("en-IN")]
														}),
														" spent"
													]
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "mt-3 w-full h-1 bg-emerald-100 rounded-full overflow-hidden",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full bg-[#005f3f] rounded-full w-2/3" })
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-white p-5 rounded-3xl border border-outline-variant/20 shadow-xs relative flex flex-col justify-between",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between mb-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs font-bold text-on-surface-variant",
														children: "Smart Coins"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-8 h-8 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[18px]",
															children: "monetization_on"
														})
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "font-headline-lg text-2xl font-black text-on-surface",
													children: effectiveCoins
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-[11px] text-amber-800 font-bold mt-1",
													children: [
														"₹",
														convertCoinsToRupees(effectiveCoins).toFixed(2),
														" instant discount"
													]
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "mt-3 text-[10px] text-on-surface-variant/80 font-medium",
													children: "1 Coin = ₹0.05 cash discount"
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-white p-5 rounded-3xl border border-outline-variant/20 shadow-xs relative flex flex-col justify-between",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between mb-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs font-bold text-on-surface-variant",
														children: "VIP Privilege"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-8 h-8 rounded-full bg-amber-50 text-[#fea619] flex items-center justify-center",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[18px]",
															children: "stars"
														})
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "font-headline-lg text-lg font-black text-on-surface truncate",
													children: isUserVip ? "VIP Active" : "Standard Tier"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-[11px] text-on-surface-variant mt-1 font-medium",
													children: [
														"₹",
														vipStatus.rollingSpend.toLocaleString("en-IN"),
														" / ₹5,000 spent"
													]
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-3 text-[10px] font-bold text-[#005f3f] flex items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[12px]",
														children: "bolt"
													}), isUserVip ? "Free 60m Delivery" : `${vipStatus.percentage}% completed`]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-white p-5 rounded-3xl border border-outline-variant/20 shadow-xs relative flex flex-col justify-between",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between mb-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs font-bold text-on-surface-variant",
														children: "Addresses"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-8 h-8 rounded-full bg-emerald-50 text-[#005f3f] flex items-center justify-center",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[18px]",
															children: "location_on"
														})
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "font-headline-lg text-2xl font-black text-on-surface",
													children: [addresses.length, " Saved"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-[11px] text-on-surface-variant mt-1 font-medium truncate",
													children: addressTagsSummary
												})] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-3 text-[10px] font-bold text-emerald-800 flex items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-600" }), addressesGeofenceVerified ? "Inside delivery radius" : "Boundary checked"]
												})
											]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-white rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "font-headline-lg text-lg font-black text-on-surface",
											children: "Personal Information"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-on-surface-variant mt-0.5",
											children: "Manage your profile details and communication preferences"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											"data-testid": "open-edit-profile-btn",
											onClick: handleOpenEditProfile,
											className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-headline-sm text-xs font-bold transition-all self-start sm:self-auto cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "edit"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Edit Info" })]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 md:grid-cols-2 gap-5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block text-xs font-bold text-on-surface-variant mb-1.5",
												children: "Customer ID (SASS ID)"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												"data-testid": "personal-info-customer-id",
												className: "bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono font-bold text-[#005f3f]",
													children: customerSassId
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px] text-outline-variant",
													children: "badge"
												})]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block text-xs font-bold text-on-surface-variant mb-1.5",
												children: "Full Name"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: user?.name || "Customer" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px] text-outline-variant",
													children: "person"
												})]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "block text-xs font-bold text-on-surface-variant",
													children: "Mobile Number"
												}), user?.phoneVerified ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-[#15803d] text-[11px] font-bold flex items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[14px]",
														children: "check_circle"
													}), "Verified"]
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: () => setShowPhoneVerificationModal(true),
													className: "text-amber-700 hover:text-amber-800 text-[11px] font-bold flex items-center gap-1 underline cursor-pointer",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[14px]",
														children: "warning"
													}), "Verify Now"]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: user?.phone || "No phone linked" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px] text-outline-variant",
													children: "smartphone"
												})]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "block text-xs font-bold text-on-surface-variant",
													children: "Email Address"
												}), user?.email ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-[#15803d] text-[11px] font-bold flex items-center gap-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[14px]",
														children: "check_circle"
													}), "Verified"]
												}) : null]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: user?.email || "No email provided" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px] text-outline-variant",
													children: "mail"
												})]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block text-xs font-bold text-on-surface-variant mb-1.5",
												children: "Preferred Store Language"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: user?.preferredLanguage || (language === "ta" ? "தமிழ் / English (Tamil / English)" : "Tamil / English (தமிழ் / English)") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px] text-outline-variant",
													children: "translate"
												})]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "block text-xs font-bold text-on-surface-variant",
													children: "Birthday"
												}), isUserVip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-amber-700 text-[11px] font-bold",
													children: "VIP Birthday Gift: 100 Smart Coins"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													"data-testid": "profile-dob-display",
													children: user?.dob || user?.birthday || "14 August"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px] text-outline-variant",
													children: "cake"
												})]
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "block text-xs font-bold text-on-surface-variant mb-1.5",
												children: "Weekly Grocery Rhythm"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-surface-container-low/70 border border-outline-variant/20 rounded-2xl px-4 py-3 flex items-center justify-between text-xs font-semibold text-on-surface",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: user?.groceryRhythm || "Every Saturday Morning (4 Members)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px] text-outline-variant",
													children: "sync"
												})]
											})] })
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									id: "saved-addresses",
									className: "bg-white rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "font-headline-lg text-lg font-black text-on-surface",
											children: "Saved Delivery Addresses"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-on-surface-variant mt-0.5",
											children: "Default addresses used for 60-min express neighborhood delivery"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: handleOpenAddAddress,
											className: "inline-flex items-center gap-1.5 bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#15803d] px-4 py-2.5 rounded-2xl font-headline-sm text-xs font-black shadow-xs transition-all self-start sm:self-auto cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[18px]",
												children: "add"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Add New Address" })]
										})]
									}), addresses.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-8 text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/30",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-outline-variant text-[36px] block mb-2",
												children: "location_off"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-bold text-on-surface",
												children: "No saved delivery addresses found."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-on-surface-variant mt-1",
												children: "Add your home or office address to enable instant doorstep delivery."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: handleOpenAddAddress,
												className: "mt-4 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold cursor-pointer",
												children: "Add First Address"
											})
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-1 md:grid-cols-2 gap-5",
										children: addresses.map((addr) => {
											const geo = addressService.validateGeofence(addr.lat, addr.lng);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "rounded-3xl p-5 border border-outline-variant/25 bg-white hover:border-[#005f3f]/40 hover:shadow-sm transition-all flex flex-col justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between mb-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: `w-8 h-8 rounded-full flex items-center justify-center text-white ${addr.tag === "Home" ? "bg-[#005f3f]" : addr.tag === "Work" ? "bg-amber-700" : "bg-slate-700"}`,
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "material-symbols-outlined text-[16px]",
																	children: addr.tag === "Home" ? "home" : addr.tag === "Work" ? "business" : "place"
																})
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-headline-sm text-xs font-extrabold text-on-surface",
																children: addr.tag === "Work" ? "Office" : addr.tag
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-1.5",
															children: [addr.isDefault && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "bg-[#005f3f] text-white text-[10px] font-black px-2.5 py-0.5 rounded uppercase tracking-wider",
																children: "DEFAULT"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase",
																children: addr.tag.toUpperCase()
															})]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-xs font-bold text-on-surface mt-2",
														children: addr.name
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs text-on-surface-variant mt-1 leading-relaxed",
														children: [
															addr.houseNo,
															", ",
															addr.street,
															addr.landmark ? `, ${addr.landmark}` : "",
															", ",
															addr.city,
															" - ",
															addr.pincode
														]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-xs text-on-surface-variant font-medium mt-2 flex items-center gap-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[14px]",
															children: "call"
														}), addr.phone]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "mt-3",
														children: geo.eligible ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/60 rounded-xl px-2.5 py-1 text-[11px] font-bold text-emerald-800",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "material-symbols-outlined text-[13px]",
																children: "bolt"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
																"Within ",
																geo.distanceKm,
																" km of Superstore • 35-min delivery"
															] })]
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/60 rounded-xl px-2.5 py-1 text-[11px] font-bold text-amber-800",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "material-symbols-outlined text-[13px]",
																children: "warning"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
																"Outside 6km delivery zone (",
																geo.distanceKm,
																" km away)"
															] })]
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-[11px] text-on-surface-variant/80 mt-2 flex items-center gap-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[13px]",
															children: "schedule"
														}), "Deliver between 9:00 AM - 6:00 PM"]
													})
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-5 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-xs",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: !addr.isDefault && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => handleSetDefaultAddress(addr.id),
														className: "font-bold text-[#005f3f] hover:underline cursor-pointer",
														children: "Make Default"
													}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-3",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																type: "button",
																onClick: () => handleOpenEditAddress(addr),
																className: "font-bold text-on-surface hover:text-[#005f3f] cursor-pointer",
																children: "Edit"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-outline-variant/50",
																children: "•"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																type: "button",
																onClick: () => handleDeleteAddress(addr),
																className: "font-bold text-red-600 hover:underline cursor-pointer",
																children: "Remove"
															})
														]
													})]
												})]
											}, addr.id);
										})
									})]
								})
							]
						})]
					})]
				})
			}),
			showEditProfileModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-150",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-headline-lg text-lg font-black text-on-surface",
							children: "Edit Personal Information"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setShowEditProfileModal(false),
							className: "w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer",
							children: "✕"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSaveProfile,
						className: "space-y-4 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "font-bold text-on-surface block mb-1",
								children: ["Full Name ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-red-500",
									children: "*"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								required: true,
								value: editName,
								onChange: (e) => setEditName(e.target.value),
								placeholder: "e.g. Priya Sundaram",
								className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-on-surface block mb-1",
								children: "Email Address"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "email",
								value: editEmail,
								onChange: (e) => setEditEmail(e.target.value),
								placeholder: "e.g. priya.sundaram@example.com",
								className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "font-bold text-on-surface",
										children: "Mobile Number"
									}), user?.phoneVerified ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[11px] font-bold text-emerald-700 flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[13px]",
											children: "verified"
										}), "Verified"]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											setShowEditProfileModal(false);
											setShowPhoneVerificationModal(true);
										},
										className: "text-[11px] font-bold text-[#005f3f] underline hover:text-[#004d32] cursor-pointer",
										children: "Verify Now"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									disabled: true,
									value: user?.phone || "",
									placeholder: "No phone linked",
									className: "w-full bg-surface-container/60 px-3.5 py-2.5 rounded-xl border border-outline-variant/20 text-on-surface-variant font-medium cursor-not-allowed"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[10px] text-on-surface-variant mt-1 flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🔒 Mobile number requires OTP verification before checkout." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											setShowEditProfileModal(false);
											setShowPhoneVerificationModal(true);
										},
										className: "text-[#005f3f] font-bold underline cursor-pointer",
										children: user?.phoneVerified ? "Change / Re-verify" : "Verify Phone"
									})]
								})
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-on-surface block mb-1",
								children: "Preferred Store Language"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: editLanguage,
								onChange: (e) => setEditLanguage(e.target.value),
								className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "Tamil / English (தமிழ் / English)",
										children: "Tamil / English (தமிழ் / English)"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "English Only",
										children: "English Only"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "தமிழ் மட்டும்",
										children: "தமிழ் மட்டும்"
									})
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-on-surface block mb-1",
								children: "Birthday"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								"data-testid": "edit-profile-birthday-input",
								value: editBirthday,
								onChange: (e) => setEditBirthday(e.target.value),
								placeholder: "e.g. 14 August",
								className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-on-surface block mb-1",
								children: "Weekly Grocery Rhythm"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: editGroceryRhythm,
								onChange: (e) => setEditGroceryRhythm(e.target.value),
								placeholder: "e.g. Every Saturday Morning (4 Members)",
								className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-3 flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setShowEditProfileModal(false),
									className: "flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface cursor-pointer",
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									disabled: isSavingProfile,
									className: "flex-1 py-2.5 rounded-xl font-bold bg-[#005f3f] text-white shadow-md hover:bg-[#004d32] transition-all cursor-pointer disabled:opacity-50",
									children: isSavingProfile ? "Saving..." : "Save Changes"
								})]
							})
						]
					})]
				})
			}),
			showAddressModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-outline-variant/20 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-headline-lg text-lg font-black text-on-surface",
							children: editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setShowAddressModal(false),
							className: "w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer",
							children: "✕"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSaveAddress,
						className: "space-y-4 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-on-surface block mb-1.5",
								children: "Address Type"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-3 gap-2",
								children: [
									"Home",
									"Work",
									"Other"
								].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setAddrTag(t),
									className: `py-2 rounded-xl font-bold text-center border cursor-pointer transition-all ${addrTag === t ? "bg-[#005f3f] text-white border-[#005f3f]" : "bg-surface-container-low text-on-surface border-outline-variant/25"}`,
									children: t === "Work" ? "Office" : t
								}, t))
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "font-bold text-on-surface block mb-1",
									children: ["Contact Name ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-red-500",
										children: "*"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									required: true,
									value: addrName,
									onChange: (e) => setAddrName(e.target.value),
									placeholder: "Recipient name",
									className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "font-bold text-on-surface block mb-1",
									children: ["Phone Number ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-red-500",
										children: "*"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									required: true,
									value: addrPhone,
									onChange: (e) => setAddrPhone(e.target.value),
									placeholder: "+91 98400 12345",
									className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "font-bold text-on-surface block mb-1",
									children: ["House / Flat / Door No ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-red-500",
										children: "*"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									required: true,
									value: addrHouseNo,
									onChange: (e) => setAddrHouseNo(e.target.value),
									placeholder: "e.g. #42/1",
									className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "font-bold text-on-surface block mb-1",
									children: ["Street & Locality ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-red-500",
										children: "*"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									required: true,
									value: addrStreet,
									onChange: (e) => setAddrStreet(e.target.value),
									placeholder: "e.g. 2nd Main Road, Gandhi Nagar",
									className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-3 gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "font-bold text-on-surface block mb-1",
										children: "Landmark (Optional)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: addrLandmark,
										onChange: (e) => setAddrLandmark(e.target.value),
										placeholder: "Near Park",
										className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "font-bold text-on-surface block mb-1",
										children: ["City ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-red-500",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										required: true,
										value: addrCity,
										onChange: (e) => setAddrCity(e.target.value),
										className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "font-bold text-on-surface block mb-1",
										children: ["Pincode ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-red-500",
											children: "*"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										required: true,
										maxLength: 6,
										value: addrPincode,
										onChange: (e) => setAddrPincode(e.target.value),
										placeholder: "638454",
										className: "w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 focus:border-[#005f3f] focus:outline-hidden font-medium"
									})] })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-1 flex items-center justify-between bg-surface-container-low/70 p-3 rounded-2xl border border-outline-variant/20",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[#005f3f] text-[18px]",
										children: "my_location"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[11px] text-on-surface font-semibold",
										children: [
											"GPS Coordinates: ",
											addrLat.toFixed(4),
											", ",
											addrLng.toFixed(4)
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: handleSimulateGPS,
									className: "px-3 py-1 bg-white hover:bg-surface-container text-[#005f3f] border border-outline-variant/30 rounded-lg text-[10px] font-bold shadow-xs cursor-pointer",
									children: "Locate Near Hub"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2.5 cursor-pointer pt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: addrIsDefault,
									onChange: (e) => setAddrIsDefault(e.target.checked),
									className: "rounded text-[#005f3f] focus:ring-[#005f3f]"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-bold text-on-surface",
									children: "Set as default delivery address"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-3 flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setShowAddressModal(false),
									className: "flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface cursor-pointer",
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									disabled: isSavingAddress,
									className: "flex-1 py-2.5 rounded-xl font-bold bg-[#005f3f] text-white shadow-md hover:bg-[#004d32] transition-all cursor-pointer disabled:opacity-50",
									children: isSavingAddress ? "Saving..." : editingAddressId ? "Save Address Changes" : "Add Delivery Address"
								})]
							})
						]
					})]
				})
			}),
			showSettingsModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-150",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "font-headline-lg text-lg font-black text-on-surface",
							children: "Account Settings & Privacy"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setShowSettingsModal(false),
							className: "w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer",
							children: "✕"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-4 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-bold text-on-surface",
									children: "WhatsApp Delivery Updates"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] text-on-surface-variant",
									children: "Receive live tracking links and driver arrival alerts"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: whatsappUpdates,
									onChange: (e) => setWhatsappUpdates(e.target.checked),
									className: "rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-bold text-on-surface",
									children: "SMS Order Status Alerts"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] text-on-surface-variant",
									children: "OTP login verification and dispatch SMS"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: smsAlerts,
									onChange: (e) => setSmsAlerts(e.target.checked),
									className: "rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-bold text-on-surface",
									children: "Fresh Harvest & Seasonal Offers"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] text-on-surface-variant",
									children: "Exclusive member promotions and wood-pressed oil batches"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: promoOffers,
									onChange: (e) => setPromoOffers(e.target.checked),
									className: "rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pt-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										setShowSettingsModal(false);
										toast.success("Preferences updated successfully");
									},
									className: "w-full py-2.5 rounded-xl font-bold bg-[#005f3f] text-white shadow-md hover:bg-[#004d32] cursor-pointer",
									children: "Save Preferences"
								})
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneVerificationModal, {
				isOpen: showPhoneVerificationModal,
				onClose: () => setShowPhoneVerificationModal(false),
				onSuccess: (verifiedPhone) => {
					toast.success(`Mobile number ${verifiedPhone} verified!`);
				},
				initialPhone: user?.phone || ""
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
var Route$14 = createFileRoute("/addresses")({
	validateSearch: (search) => ({
		redirect: typeof search["redirect"] === "string" ? search["redirect"] : void 0,
		action: typeof search["action"] === "string" ? search["action"] : void 0
	}),
	head: () => ({ meta: [{ title: "Saved Addresses — Sri Amman Smart Store" }, {
		name: "description",
		content: "Manage delivery addresses and check geofence coverage."
	}] }),
	component: AddressesPage
});
function AddressesPage() {
	const searchParams = useSearch({ from: "/addresses" });
	const navigate = useNavigate();
	const { user, isLoading: authLoading, isResolvingIdentity } = useAuth();
	const [addresses, setAddresses] = (0, import_react.useState)([]);
	const [addressesError, setAddressesError] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [showModal, setShowModal] = (0, import_react.useState)(false);
	const [tag, setTag] = (0, import_react.useState)("Home");
	const [name, setName] = (0, import_react.useState)(user?.name || "");
	const [phone, setPhone] = (0, import_react.useState)(user?.phone || "");
	const [houseNo, setHouseNo] = (0, import_react.useState)("");
	const [street, setStreet] = (0, import_react.useState)("");
	const [landmark, setLandmark] = (0, import_react.useState)("");
	const [city, setCity] = (0, import_react.useState)("Gobichettipalayam");
	const [pincode, setPincode] = (0, import_react.useState)("638454");
	const [lat, setLat] = (0, import_react.useState)(11.4595);
	const [lng, setLng] = (0, import_react.useState)(77.3338);
	const handleOpenAddModal = () => {
		setName(user?.name || "");
		setPhone(user?.phone || "");
		setHouseNo("");
		setStreet("");
		setLandmark("");
		setTag("Home");
		setShowModal(true);
	};
	(0, import_react.useEffect)(() => {
		if (searchParams.action === "add" || searchParams.action === "new") handleOpenAddModal();
	}, [searchParams.action]);
	const loadAddresses = async () => {
		if (!user) {
			setLoading(false);
			return;
		}
		try {
			setLoading(true);
			setAddressesError(null);
			const list = await addressService.getAddresses(user.id);
			setAddresses(list || []);
		} catch (err) {
			console.error("Failed to load addresses:", err);
			const msg = err?.message || "Failed to load saved addresses from store database. Please check your connection.";
			setAddressesError(msg);
			setAddresses([]);
		} finally {
			setLoading(false);
		}
	};
	(0, import_react.useEffect)(() => {
		if (user) loadAddresses();
		else if (!authLoading && !isResolvingIdentity) setLoading(false);
	}, [
		user,
		authLoading,
		isResolvingIdentity
	]);
	const handleSetDefault = async (id) => {
		if (!user) return;
		try {
			await addressService.setDefaultAddress(id, user.id);
			toast.success("Default delivery address updated");
			await loadAddresses();
		} catch (err) {
			toast.error(err.message || "Failed to set default address");
		}
	};
	const handleDelete = async (id) => {
		if (!confirm("Are you sure you want to delete this address?")) return;
		try {
			await addressService.deleteAddress(id, user?.id);
			toast.info("Address deleted");
			await loadAddresses();
		} catch (err) {
			toast.error(err.message || "Failed to delete address");
		}
	};
	const handleSimulateGPS = () => {
		setLat(11.4598);
		setLng(77.334);
		setCity("Gobichettipalayam");
		setPincode("638454");
		setStreet("Kasipalayam High Road");
		toast.info("GPS coordinates mapped to Gobichettipalayam Hub (Distance ~150m)");
	};
	const handleSave = async (e) => {
		e.preventDefault();
		if (!user) return;
		if (!houseNo.trim() || !street.trim()) {
			toast.error("Please enter house number and street");
			return;
		}
		try {
			await addressService.addAddress({
				userId: user.id,
				tag,
				name,
				phone,
				houseNo,
				street,
				landmark,
				city,
				pincode,
				lat,
				lng,
				isDefault: addresses.length === 0
			});
			setShowModal(false);
			setHouseNo("");
			setStreet("");
			setLandmark("");
			toast.success("Address added successfully!");
			if (searchParams.redirect) {
				navigate({ to: searchParams.redirect });
				return;
			}
			await loadAddresses();
		} catch (err) {
			toast.error(err.message || "Failed to add address");
		}
	};
	if ((authLoading || isResolvingIdentity) && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1000px] mx-auto px-margin-desktop py-20 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-on-surface-variant font-medium",
					children: "Loading saved addresses..."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	if (!user && !loading && !authLoading && !isResolvingIdentity) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1000px] mx-auto px-margin-desktop py-16 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-4xl mx-auto mb-4",
						children: "📍"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-headline-lg text-xl font-bold text-on-surface mb-2",
						children: "Please Sign In to Manage Saved Addresses"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-on-surface-variant mb-6",
						children: "Sign in with your mobile number to view and save home and work delivery locations."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						search: { redirect: "/addresses" },
						className: "inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sign In with Phone OTP" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-[1000px] mx-auto px-margin-desktop py-space-xl",
					children: [
						searchParams.redirect && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: searchParams.redirect,
								className: "inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/20 cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[16px]",
									children: "arrow_back"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Return to Checkout" })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface",
								children: "Saved Delivery Addresses"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-3 mt-1 flex-wrap",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-on-surface-variant",
									children: "Store Hub: Gobichettipalayam • Service Radius: 6.0 KM"
								})
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: handleOpenAddModal,
								className: "bg-primary hover:bg-primary-container text-white px-5 py-2.5 rounded-2xl font-headline-sm text-xs font-bold flex items-center gap-2 shadow-md transition-all self-start sm:self-auto cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[18px]",
									children: "add_location_alt"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Add New Address" })]
							})]
						}),
						loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-16 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-on-surface-variant",
								children: "Loading saved addresses..."
							})]
						}) : addressesError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-surface-container-lowest rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto border border-red-200 my-12 shadow-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-3xl mx-auto mb-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[32px]",
										children: "cloud_off"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-headline-lg text-lg font-bold text-on-surface mb-2",
									children: "Unable to Load Saved Addresses"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-on-surface-variant mb-6 leading-relaxed",
									children: addressesError
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => loadAddresses(),
									className: "bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer inline-flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[16px]",
										children: "refresh"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Retry" })]
								})
							]
						}) : addresses.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-surface-container-lowest rounded-3xl p-12 text-center max-w-md mx-auto border border-outline-variant/20 shadow-sm my-12",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-3xl mx-auto mb-4",
									children: "📍"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-headline-lg text-lg font-bold text-on-surface mb-2",
									children: "No Addresses Saved"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-on-surface-variant mb-6",
									children: "Add your home or work address to unlock 60-minute express doorstep delivery."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: handleOpenAddModal,
									className: "bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md cursor-pointer hover:bg-primary-container transition-all",
									children: "Add First Address"
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 md:grid-cols-2 gap-6",
							children: addresses.map((addr) => {
								const geo = addressService.validateGeofence(addr.lat, addr.lng);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mb-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-headline-sm text-xs font-bold bg-surface-container px-2.5 py-1 rounded-lg text-on-surface",
												children: addr.tag
											}), addr.isDefault ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-label-badge text-[10px] uppercase font-bold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded",
												children: "Primary Address"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => handleSetDefault(addr.id),
												className: "text-xs text-primary font-bold hover:underline cursor-pointer",
												children: "Set as Default"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
											className: "font-headline-sm text-base font-bold text-on-surface",
											children: addr.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-on-surface-variant font-medium mt-0.5",
											children: addr.phone
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-on-surface-variant mt-2 leading-relaxed",
											children: [
												addr.houseNo,
												", ",
												addr.street,
												", ",
												addr.landmark && `${addr.landmark}, `,
												addr.city,
												" - ",
												addr.pincode
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-xs",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: `font-semibold flex items-center gap-1 text-[11px] ${geo.eligible ? "text-primary" : "text-tertiary"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[16px]",
													children: geo.eligible ? "verified" : "error"
												}), geo.eligible ? "Eligible (Within 6km)" : "Ineligible (Exceeds 6km)"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-on-surface-variant font-mono text-[11px]",
												children: [geo.distanceKm, " km"]
											})]
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-6 pt-3 border-t border-outline-variant/15 flex justify-end",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => handleDelete(addr.id),
											className: "text-xs text-tertiary font-bold hover:underline flex items-center gap-1 cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "delete"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delete" })]
										})
									})]
								}, addr.id);
							})
						})
					]
				})
			}),
			showModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-surface-container-lowest rounded-3xl p-6 max-w-md w-full shadow-2xl border border-outline-variant/20",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "font-headline-lg text-base font-bold text-on-surface",
								children: "Add New Delivery Location"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setShowModal(false),
								className: "w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[18px]",
									children: "close"
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-4 p-3 rounded-2xl bg-primary-fixed/20 flex items-center justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-on-primary-fixed",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-primary text-[20px]",
									children: "my_location"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Use Current GPS Location" })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: handleSimulateGPS,
								className: "px-3 py-1 bg-primary text-white font-bold rounded-lg text-xs",
								children: "Auto Detect"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleSave,
							className: "space-y-3 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "font-bold text-on-surface block mb-1",
									children: "Tag"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex gap-2",
									children: [
										"Home",
										"Work",
										"Other"
									].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setTag(t),
										className: `flex-1 py-1.5 rounded-xl font-bold cursor-pointer ${tag === t ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"}`,
										children: t
									}, t))
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "font-bold text-on-surface block mb-1",
									children: "Recipient Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									required: true,
									value: name,
									onChange: (e) => setName(e.target.value),
									placeholder: "Recipient full name",
									className: "w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "font-bold text-on-surface block mb-1",
									children: "Contact Phone"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									required: true,
									value: phone,
									onChange: (e) => setPhone(e.target.value),
									placeholder: "+91 98400 12345",
									className: "w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "font-bold text-on-surface block mb-1",
									children: "House / Flat / Door No"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									required: true,
									value: houseNo,
									onChange: (e) => setHouseNo(e.target.value),
									placeholder: "e.g. 14/2, Amman Kovil Street",
									className: "w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "font-bold text-on-surface block mb-1",
									children: "Street / Area"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									required: true,
									value: street,
									onChange: (e) => setStreet(e.target.value),
									placeholder: "e.g. Kasipalayam",
									className: "w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "font-bold text-on-surface block mb-1",
									children: "Landmark (Optional)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: landmark,
									onChange: (e) => setLandmark(e.target.value),
									placeholder: "e.g. Near Water Tank",
									className: "w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "font-bold text-on-surface block mb-1",
										children: "City"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										required: true,
										value: city,
										onChange: (e) => setCity(e.target.value),
										className: "w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "font-bold text-on-surface block mb-1",
										children: "Pincode"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										required: true,
										value: pincode,
										onChange: (e) => setPincode(e.target.value),
										className: "w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-3 flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setShowModal(false),
										className: "flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface cursor-pointer",
										children: "Cancel"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										className: "flex-1 py-2.5 rounded-xl font-bold bg-primary text-white shadow-md hover:bg-primary-container cursor-pointer",
										children: "Save Location"
									})]
								})
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
function CheckoutProgressBar({ currentStep, onStepClick, canNavigateToStep, cartItemCount = 0, selectedAddressText = "", className = "" }) {
	const steps = [
		{
			id: 1,
			title: "1. Cart",
			subtitle: cartItemCount > 0 ? `${cartItemCount} Fresh Items` : "Review Items",
			icon: "shopping_bag"
		},
		{
			id: 2,
			title: "2. Address & Slot",
			subtitle: selectedAddressText || "Delivery & Slot",
			icon: "local_shipping"
		},
		{
			id: 3,
			title: "3. Payment",
			subtitle: "Instant UPI & Cards",
			icon: "credit_card"
		}
	];
	const handleStepClick = (stepId) => {
		if (stepId === currentStep) return;
		if (stepId < currentStep) {
			onStepClick?.(stepId);
			return;
		}
		if (canNavigateToStep && canNavigateToStep(stepId)) onStepClick?.(stepId);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"data-testid": "checkout-progress-bar",
		className: `bg-surface-container-lowest border border-outline-variant/15 rounded-2xl p-4 sm:p-5 shadow-sm ${className}`,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-between relative max-w-2xl mx-auto",
			children: steps.map((step, idx) => {
				const isCompleted = step.id < currentStep;
				const isCurrent = step.id === currentStep;
				step.id;
				const isClickable = isCompleted || (canNavigateToStep ? canNavigateToStep(step.id) : false);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Fragment, { children: [idx > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					"data-testid": `progress-connector-${step.id}`,
					className: `flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-colors duration-300 ${currentStep >= step.id ? "bg-primary" : "bg-outline-variant/20"}`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-testid": `progress-step-${step.id}`,
					onClick: () => handleStepClick(step.id),
					className: `flex items-center gap-2.5 sm:gap-3 transition-all select-none ${isClickable ? "cursor-pointer group hover:opacity-90" : isCurrent ? "cursor-default" : "cursor-not-allowed opacity-60"}`,
					title: isClickable ? `Go to ${step.title}` : isCurrent ? `Current Step: ${step.title}` : `Complete earlier steps to access ${step.title}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shrink-0 transition-transform ${isCompleted ? "bg-primary text-white shadow-sm group-hover:scale-105" : isCurrent ? "bg-primary text-white ring-4 ring-primary/20 shadow-md scale-105" : "bg-surface-container-high text-on-surface-variant/80 border border-outline-variant/30"}`,
						children: isCompleted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined text-[18px] sm:text-[20px] font-bold",
							children: "check"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined text-[18px] sm:text-[20px]",
							style: isCurrent ? { fontVariationSettings: "'FILL' 1" } : {},
							children: step.icon
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hidden xs:block sm:block text-left",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: `font-headline-sm text-xs sm:text-sm font-extrabold leading-tight ${isCurrent ? "text-primary" : isCompleted ? "text-on-surface" : "text-on-surface-variant/70"}`,
							children: step.title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] sm:text-[11px] text-on-surface-variant font-medium line-clamp-1 max-w-[120px] sm:max-w-none",
							children: step.subtitle
						})]
					})]
				})] }, step.id);
			})
		})
	});
}
function OrderBillSummary({ title, ctaText = "Proceed to Checkout", onCtaClick, isSubmitting = false, disabled = false, mode = "cart", className = "" }) {
	const { items, cartCount, cartTotalMrp, cartTotalSavings, appliedCoupon, couponDiscount, coinsRedeemed, coinDiscount, deliverySpeed, deliveryFee, finalTotal, totalSavings, totalSavingsPercent } = useCart();
	const isCheckout = mode === "checkout";
	const displayTitle = title || (isCheckout ? `Order Summary (${cartCount} ITEMS)` : "Bill Summary");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"data-testid": "order-bill-summary",
		className: `bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-headline-sm text-lg font-extrabold text-on-surface mb-5",
				children: displayTitle
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3.5 text-xs",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center text-on-surface-variant",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total Item MRP" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-bold text-on-surface text-sm",
							children: ["₹", cartTotalMrp.toLocaleString("en-IN")]
						})]
					}),
					cartTotalSavings > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center text-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 font-medium",
							children: ["Store Product Discount", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "material-symbols-outlined text-[14px] text-outline cursor-help",
								title: "Savings calculated from item MRP difference",
								children: "info"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-extrabold text-sm",
							children: ["−₹", cartTotalSavings.toLocaleString("en-IN")]
						})]
					}),
					couponDiscount > 0 && appliedCoupon && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center text-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1.5 font-medium",
							children: [
								"Coupon (",
								appliedCoupon.code,
								")",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "bg-primary/10 text-primary text-[10px] font-black px-1.5 py-0.5 rounded uppercase",
									children: "PROMO"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-extrabold text-sm",
							children: ["−₹", couponDiscount.toLocaleString("en-IN")]
						})]
					}),
					coinDiscount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center text-secondary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1.5 font-medium",
							children: [
								"Coins Redeemed (",
								coinsRedeemed,
								" Smart Coins)"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-extrabold text-sm",
							children: ["−₹", coinDiscount.toLocaleString("en-IN")]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center text-on-surface-variant",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1 font-medium",
							children: [deliverySpeed === "express" ? "Express Delivery Fee" : "Delivery Fee", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "material-symbols-outlined text-[14px] text-outline cursor-help",
								title: deliverySpeed === "express" ? "Express 60-min delivery charge" : "Standard consolidated delivery",
								children: "info"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `font-bold text-sm ${deliveryFee === 0 ? "text-primary" : "text-on-surface"}`,
							children: deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between items-center text-on-surface-variant",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: "Taxes & GST"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-on-surface text-xs",
							children: "Included (₹0)"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-outline-variant/20 my-4" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-between items-baseline mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-headline-sm text-sm font-extrabold text-on-surface block",
					children: isCheckout ? "Total Payable" : "Total Amount"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[11px] text-on-surface-variant",
					children: isCheckout ? "Includes all municipal surcharges" : "Inclusive of all local cess & packing"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					"data-testid": "summary-final-total",
					className: "font-price-card text-2xl font-black text-primary tracking-tight",
					children: ["₹", finalTotal.toLocaleString("en-IN")]
				})]
			}),
			totalSavings > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				"data-testid": "summary-savings-banner",
				className: "bg-primary/10 border border-primary/20 rounded-2xl p-3 mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-primary font-bold text-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-base",
						children: "🎉"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"You are saving ₹",
						totalSavings.toLocaleString("en-IN"),
						" (",
						totalSavingsPercent,
						"%) on this order!"
					] })]
				}), isCheckout && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] text-primary/80 mt-0.5 ml-6",
					children: "Smart Store member guaranteed lowest price match"
				})]
			})
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onCtaClick,
			disabled: disabled || isSubmitting || items.length === 0,
			className: `w-full py-3.5 px-6 rounded-2xl font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${disabled || isSubmitting || items.length === 0 ? "bg-surface-container-high text-outline cursor-not-allowed shadow-none" : "bg-primary text-white hover:bg-primary-container hover:shadow-lg cursor-pointer"}`,
			children: isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Processing Order..." })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ctaText }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "material-symbols-outlined text-[18px]",
				children: "arrow_forward"
			})] })
		}), isCheckout ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-1.5 mt-4 pt-2 text-[11px] text-on-surface-variant font-medium",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "material-symbols-outlined text-[15px] text-primary",
						children: "lock"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "256-bit Bank Grade SSL Encryption" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "material-symbols-outlined text-[15px] text-primary",
						children: "verified"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "100% Secure UPI / Card Processing" })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "material-symbols-outlined text-[15px] text-primary",
						children: "storefront"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sri Amman Local Store Fulfillment Guarantee" })]
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-center gap-4 mt-4 pt-1 text-[11px] text-on-surface-variant font-medium",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "material-symbols-outlined text-[14px] text-primary",
						children: "lock"
					}), "100% Safe Payments"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "material-symbols-outlined text-[14px] text-primary",
						children: "replay"
					}), "Easy 24h Returns"]
				})
			]
		})] })]
	});
}
var Route$13 = createFileRoute("/cart")({
	head: () => ({ meta: [{ title: "Review Cart — Sri Amman Smart Store" }, {
		name: "description",
		content: "Review your farm fresh items before checkout."
	}] }),
	component: CartPage
});
function CartPage() {
	const { items, isLoading, cartError, isGuestCartSyncing, guestCartSyncError, syncGuestCart, cartCount, cartSubtotal, cartTotalSavings, appliedCoupon, couponDiscount, deliverySettingsError, redeemCoins, coinsToRedeem, coinValueInRupees, deliverySpeed, isExpressDeliveryAvailable, standardDeliveryFee, expressDeliveryFee, applyCoupon, removeCoupon, setRedeemCoins, setDeliverySpeed, updateQty, removeFromCart, clearCart, addToCart, refreshCart } = useCart();
	const { user } = useAuth();
	const { items: wishlistItems, addToWishlist } = useWishlist();
	const { t } = useLanguage();
	const navigate = useNavigate();
	const [couponCode, setCouponCode] = (0, import_react.useState)("");
	const [isCouponChecking, setIsCouponChecking] = (0, import_react.useState)(false);
	const [defaultAddress, setDefaultAddress] = (0, import_react.useState)(null);
	const [quickAddProducts, setQuickAddProducts] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		async function loadAddressAndStaples() {
			if (user) try {
				const addrList = await addressService.getAddresses(user.id);
				const def = addrList?.find((a) => a.isDefault) || addrList?.[0] || null;
				setDefaultAddress(def);
			} catch {}
			try {
				const staples = (await productService.getProducts()).filter((p) => !items.some((i) => i.productId === p.id) && (p.categorySlug === "staples-grains" || p.categorySlug === "organic-spices"));
				setQuickAddProducts(staples.slice(0, 2));
			} catch {}
		}
		loadAddressAndStaples();
	}, [user, items]);
	const userCoins = user?.smartCoins ?? user?.coins ?? 0;
	const handleApplyCoupon = async (e) => {
		e.preventDefault();
		if (!couponCode.trim()) {
			toast.error("Please enter a coupon code");
			return;
		}
		setIsCouponChecking(true);
		try {
			const res = await applyCoupon(couponCode);
			if (res.success) {
				toast.success(res.message);
				setCouponCode("");
			} else toast.error(res.message);
		} finally {
			setIsCouponChecking(false);
		}
	};
	const handleRemoveCoupon = () => {
		removeCoupon();
		setCouponCode("");
		toast.info("Coupon removed");
	};
	const handleSaveToWishlist = async (item) => {
		try {
			const p = await productService.getProductById(item.productId);
			if (p) {
				await addToWishlist(p, item.optionIndex || 0);
				toast.success(`Saved ${item.name} to your wishlist`);
			}
		} catch {
			toast.info("Saved item for later");
		}
	};
	const handleClearCart = async () => {
		if (items.length === 0) return;
		if (window.confirm("Are you sure you want to remove all items from your cart?")) {
			await clearCart();
			toast.info("Cart cleared");
		}
	};
	const handleProceedToCheckout = async () => {
		if (items.length === 0) {
			toast.error("Your cart is empty");
			return;
		}
		if (!user) {
			toast.info("Sign in or create an account to continue checkout. Your cart is saved.");
			navigate({
				to: "/login",
				search: { redirect: "/checkout" }
			});
			return;
		}
		if (isGuestCartSyncing) {
			toast.info("Your saved cart is still syncing. Please wait a moment.");
			return;
		}
		if (guestCartSyncError && !await syncGuestCart()) return;
		navigate({
			to: "/checkout",
			search: { step: 2 }
		});
	};
	const handleAddAddressFromCart = () => {
		if (!user) {
			toast.info("Please sign in to add a delivery address");
			navigate({
				to: "/login",
				search: { redirect: "/checkout?step=2&newAddress=true" }
			});
			return;
		}
		navigate({
			to: "/checkout",
			search: {
				step: 2,
				newAddress: true
			}
		});
	};
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] max-w-[1320px] mx-auto px-margin-desktop py-12",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "animate-pulse space-y-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-10 bg-surface-container-low rounded-2xl w-1/4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 lg:grid-cols-12 gap-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:col-span-8 space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-28 bg-surface-container-low rounded-3xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-40 bg-surface-container-low rounded-3xl" })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "lg:col-span-4 h-96 bg-surface-container-low rounded-3xl" })]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-[1320px] mx-auto px-margin-desktop py-space-xl",
					children: [
						deliverySettingsError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							role: "status",
							className: "mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900",
							children: ["Delivery settings could not be loaded. The legacy default charges are being shown. ", deliverySettingsError]
						}),
						guestCartSyncError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							role: "alert",
							className: "mb-4 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-950 sm:flex-row sm:items-center sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [guestCartSyncError, " Your saved guest cart has not been deleted."] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => void syncGuestCart(),
								disabled: isGuestCartSyncing,
								className: "shrink-0 rounded-xl bg-amber-700 px-4 py-2 font-bold text-white disabled:opacity-60",
								children: isGuestCartSyncing ? "Syncing cart…" : "Retry cart sync"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[24px]",
										children: "shopping_bag"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 flex-wrap",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface",
										children: "Review Cart"
									}), cartCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider",
										children: [cartCount, " ITEMS"]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-on-surface-variant mt-0.5",
									children: "Carefully packed from Gobichettipalayam Hub with temperature-controlled handling"
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-full md:w-auto",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckoutProgressBar, {
									currentStep: 1,
									cartItemCount: cartCount,
									selectedAddressText: defaultAddress ? `${defaultAddress.city}, ${defaultAddress.pincode}` : "No Address",
									onStepClick: (step) => {
										if (step > 1) handleProceedToCheckout();
									},
									canNavigateToStep: (step) => step === 1 || items.length > 0 && !!user && !isGuestCartSyncing && !guestCartSyncError
								})
							})]
						}),
						cartError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"data-testid": "cart-error-banner",
							className: "bg-surface-container-lowest border border-error/25 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm my-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center text-3xl mx-auto mb-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[32px]",
										children: "cloud_off"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-headline-lg text-xl font-bold mb-2 text-on-surface",
									children: "Unable to Load Your Cart"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-on-surface-variant mb-6 leading-relaxed",
									children: cartError
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => refreshCart(),
										className: "inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[16px]",
											children: "refresh"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Try Again" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/shop",
										className: "inline-flex items-center gap-2 bg-surface-container text-on-surface px-5 py-2.5 rounded-2xl font-headline-sm text-xs font-bold hover:bg-surface-container-high transition-all",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Browse Catalog" })
									})]
								})
							]
						}) : items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"data-testid": "empty-cart-view",
							className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm my-8",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-20 h-20 rounded-full bg-surface-container-low flex items-center justify-center text-4xl mx-auto mb-4 text-primary",
									children: "🛒"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-headline-lg text-xl font-bold mb-2",
									children: "Your Shopping Cart is Empty"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-on-surface-variant mb-6 leading-relaxed",
									children: "Explore our pure wood-churned cold-pressed oils, single-origin heirloom grains, and traditional South Indian kitchen staples."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/shop",
									className: "inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Browse Farm Catalog" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[16px]",
										children: "arrow_forward"
									})]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-8 space-y-6",
								children: [
									defaultAddress ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										"data-testid": "delivery-address-cart-banner",
										className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[20px]",
													children: "location_on"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-headline-sm text-sm font-extrabold text-on-surface",
													children: ["Delivering to ", defaultAddress.tag || "Home"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary",
													children: "DEFAULT"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-on-surface-variant mt-0.5 line-clamp-1",
												children: [
													defaultAddress.name,
													" — ",
													defaultAddress.houseNo,
													", ",
													defaultAddress.street,
													", ",
													defaultAddress.city,
													" ",
													defaultAddress.pincode
												]
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: handleProceedToCheckout,
											className: "font-headline-sm text-xs font-bold flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-xl transition-colors text-primary hover:text-primary-container hover:bg-primary/5 cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Change Address" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "chevron_right"
											})]
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										"data-testid": "no-address-cart-banner",
										className: "bg-surface-container-lowest border border-dashed border-primary/30 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[20px]",
													children: "add_location_alt"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "flex items-center gap-2",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-sm font-extrabold text-on-surface",
													children: "No Delivery Address Found"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-on-surface-variant mt-0.5",
												children: "No address saved for this account. Please add a delivery address."
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: handleAddAddressFromCart,
											className: "font-headline-sm text-xs font-bold flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-xl transition-colors bg-primary text-white hover:bg-primary-container cursor-pointer shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "add"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Add Address" })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-5 shadow-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mb-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-primary text-[20px]",
													children: "local_shipping"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "font-headline-sm text-sm font-extrabold text-on-surface",
													children: "Choose Delivery Speed"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[11px] font-bold text-primary flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-primary animate-pulse" }), isExpressDeliveryAvailable ? "Express available now" : "Standard delivery available now"]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												onClick: () => setDeliverySpeed("standard"),
												className: `p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${deliverySpeed === "standard" ? "border-primary bg-primary/5 shadow-sm" : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/40"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "radio",
													id: "speed_standard",
													name: "delivery_speed",
													checked: deliverySpeed === "standard",
													onChange: () => setDeliverySpeed("standard"),
													className: "mt-1 accent-primary cursor-pointer"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center justify-between",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																htmlFor: "speed_standard",
																className: "font-headline-sm text-xs font-bold text-on-surface cursor-pointer",
																children: "Standard Delivery"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary",
																children: standardDeliveryFee > 0 ? `₹${standardDeliveryFee}` : "FREE"
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[11px] font-semibold text-on-surface-variant mt-1",
															children: "Tomorrow Morning, 8:00 AM – 11:00 AM"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-[10px] text-outline mt-0.5 flex items-center gap-1",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "material-symbols-outlined text-[13px]",
																children: "eco"
															}), "Low carbon consolidated route"]
														})
													]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												onClick: () => isExpressDeliveryAvailable && setDeliverySpeed("express"),
												className: `p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${deliverySpeed === "express" ? "border-primary bg-primary/5 shadow-sm" : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/40"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "radio",
													id: "speed_express",
													name: "delivery_speed",
													checked: deliverySpeed === "express",
													disabled: !isExpressDeliveryAvailable,
													onChange: () => setDeliverySpeed("express"),
													className: "mt-1 accent-primary cursor-pointer"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center justify-between",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
																htmlFor: "speed_express",
																className: "font-headline-sm text-xs font-bold text-on-surface flex items-center gap-1 cursor-pointer",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Express 60–Min" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-secondary",
																	children: "⚡"
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-headline-sm text-xs font-extrabold text-on-surface",
																children: expressDeliveryFee > 0 ? `₹${expressDeliveryFee}` : "FREE"
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-[11px] font-semibold text-on-surface-variant mt-1",
															children: "Arriving in 45–60 mins"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-[10px] text-outline mt-0.5 flex items-center gap-1",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "material-symbols-outlined text-[13px]",
																children: "bolt"
															}), "Dedicated Express rider"]
														})
													]
												})]
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-5 pb-3 border-b border-outline-variant/15",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
													className: "font-headline-sm text-base font-extrabold text-on-surface",
													children: [
														"Items in Your Cart (",
														cartCount,
														")"
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[11px] text-on-surface-variant",
													children: "Guaranteed fresh or immediate credit return"
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: handleClearCart,
													className: "text-xs font-bold flex items-center gap-1 text-error hover:underline cursor-pointer",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[16px]",
														children: "delete_sweep"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Clear Cart" })]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "divide-y divide-outline-variant/15",
												children: items.map((item) => {
													const itemMrp = item.mrp || item.price;
													const hasDiscount = itemMrp > item.price;
													const discountPct = hasDiscount ? Math.round((itemMrp - item.price) / itemMrp * 100) : 0;
													return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														"data-testid": `cart-item-${item.id}`,
														className: "py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-start gap-4 flex-1",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
																to: "/product",
																search: { id: item.productId },
																className: "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-surface-container-low overflow-hidden shrink-0 flex items-center justify-center p-2 border border-outline-variant/15 group",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																	src: item.image,
																	alt: item.name,
																	className: "max-w-full max-h-full object-contain group-hover:scale-105 transition-transform drop-shadow-xs",
																	loading: "lazy"
																})
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex-1",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "flex items-center gap-2 mb-1 flex-wrap",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary",
																			children: "ORGANIC HARVEST"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "text-[11px] text-outline font-semibold",
																			children: "Sri Amman Naturals"
																		})]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
																		to: "/product",
																		search: { id: item.productId },
																		className: "font-headline-sm text-sm font-bold text-on-surface hover:text-primary transition-colors block line-clamp-1",
																		children: item.name
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																		className: "text-xs text-on-surface-variant font-medium",
																		children: [
																			item.unitSize,
																			" ",
																			item.unit,
																			" Pack"
																		]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "flex items-baseline gap-2 mt-1.5",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "font-price-card text-base font-extrabold text-on-surface",
																			children: ["₹", item.price]
																		}), hasDiscount && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "font-price-mrp text-xs text-outline line-through",
																			children: ["₹", itemMrp]
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "text-[11px] font-bold text-secondary",
																			children: [discountPct, "% OFF"]
																		})] })]
																	})
																]
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-3",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center bg-surface-container-low rounded-xl p-1 border border-outline-variant/20",
																	children: [
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																			type: "button",
																			onClick: () => updateQty(item.id, item.quantity - 1),
																			className: "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors hover:bg-surface text-on-surface cursor-pointer",
																			title: "Decrease quantity",
																			children: "−"
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "px-3 font-headline-sm text-xs font-black text-on-surface",
																			children: item.quantity
																		}),
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																			type: "button",
																			onClick: () => updateQty(item.id, item.quantity + 1),
																			className: "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors bg-primary text-white hover:bg-primary-container cursor-pointer shadow-sm",
																			title: "Increase quantity",
																			children: "+"
																		})
																	]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "font-price-card text-base font-black text-on-surface sm:text-right min-w-[70px]",
																	children: ["₹", item.price * item.quantity]
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-3 text-xs font-semibold text-outline",
																children: [
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																		type: "button",
																		onClick: () => handleSaveToWishlist(item),
																		className: "flex items-center gap-0.5 hover:text-primary transition-colors cursor-pointer",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "material-symbols-outlined text-[14px]",
																			children: "bookmark"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Save" })]
																	}),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
																	/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																		type: "button",
																		onClick: () => removeFromCart(item.id),
																		className: "flex items-center gap-0.5 hover:text-error transition-colors cursor-pointer",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "material-symbols-outlined text-[14px]",
																			children: "delete"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Remove" })]
																	})
																]
															})]
														})]
													}, item.id);
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-6 pt-4 border-t border-outline-variant/15 flex items-center justify-between text-xs bg-surface-container-low/50 p-3.5 rounded-2xl",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-headline-sm font-bold text-on-surface flex items-center gap-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-primary text-[18px]",
														children: "shopping_bag"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Items Subtotal: ₹", (cartSubtotal ?? 0).toLocaleString("en-IN")] })]
												}), (cartTotalSavings ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "px-2.5 py-1 rounded-full bg-primary/10 text-primary font-black text-[11px]",
													children: [
														"Catalog Savings: ₹",
														(cartTotalSavings ?? 0).toLocaleString("en-IN"),
														" saved"
													]
												})]
											})
										]
									}),
									quickAddProducts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mb-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-headline-sm text-sm font-extrabold text-on-surface",
												children: "Saved for Later & Quick Add"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-on-surface-variant",
												children: "Frequent staples you may need before finishing this order"
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
												to: "/wishlist",
												className: "text-primary hover:underline text-xs font-bold flex items-center gap-0.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "View All Wishlist" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[15px]",
													children: "arrow_forward"
												})]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
											children: quickAddProducts.map((p) => {
												const opt = p.options[0];
												if (!opt) return null;
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-3.5 rounded-2xl bg-surface-container-low/40 border border-outline-variant/15 flex items-center justify-between gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-12 h-12 rounded-xl bg-surface-container-low shrink-0 flex items-center justify-center p-1 border border-outline-variant/15 overflow-hidden",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																src: p.imageUrl,
																alt: p.name,
																className: "max-w-full max-h-full object-contain",
																loading: "lazy"
															})
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																className: "font-headline-sm text-xs font-bold text-on-surface line-clamp-1",
																children: p.name
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-[11px] text-on-surface-variant",
																children: [
																	opt.unitSize,
																	" ",
																	opt.unit,
																	" Pack"
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-1.5 mt-0.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "font-price-card text-xs font-extrabold text-on-surface",
																	children: ["₹", opt.offerPrice]
																}), opt.mrp > opt.offerPrice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "text-[10px] text-outline line-through",
																	children: ["₹", opt.mrp]
																})]
															})
														] })]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => addToCart(p, 0, 1),
														className: "px-3 py-1.5 rounded-xl text-xs font-bold transition-colors shrink-0 shadow-sm bg-primary text-white hover:bg-primary-container cursor-pointer",
														children: "+ Move to Cart"
													})]
												}, p.id);
											})
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3 rounded-2xl bg-surface-container-low text-center",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-primary text-[22px] mb-1",
														children: "verified"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
														className: "font-headline-sm text-xs font-bold text-on-surface",
														children: "100% Genuine"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10px] text-on-surface-variant",
														children: "Hand-sorted fresh"
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3 rounded-2xl bg-surface-container-low text-center",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-primary text-[22px] mb-1",
														children: "bolt"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
														className: "font-headline-sm text-xs font-bold text-on-surface",
														children: "60-Min Express"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10px] text-on-surface-variant",
														children: "Local neighborhoods"
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3 rounded-2xl bg-surface-container-low text-center",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-primary text-[22px] mb-1",
														children: "replay"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
														className: "font-headline-sm text-xs font-bold text-on-surface",
														children: "Easy 24-hr Returns"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10px] text-on-surface-variant",
														children: "No questions asked"
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3 rounded-2xl bg-surface-container-low text-center",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-primary text-[22px] mb-1",
														children: "lock"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
														className: "font-headline-sm text-xs font-bold text-on-surface",
														children: "Secure UPI & Cards"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10px] text-on-surface-variant",
														children: "PCI-DSS encrypted"
													})
												]
											})
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-4 space-y-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-primary text-[20px]",
														children: "sell"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
														className: "font-headline-sm text-sm font-extrabold text-on-surface",
														children: "Apply Coupon"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[11px] font-bold text-secondary",
													children: "Store promotions"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
												onSubmit: handleApplyCoupon,
												className: "flex gap-2 mb-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "text",
													value: couponCode,
													onChange: (e) => setCouponCode(e.target.value),
													placeholder: "Enter a promo code",
													className: "flex-1 px-4 py-2.5 rounded-xl bg-surface-container-low text-xs font-bold text-on-surface uppercase placeholder:normal-case placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/15"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "submit",
													disabled: isCouponChecking,
													className: "px-5 py-2.5 rounded-xl bg-primary text-white font-headline-sm text-xs font-bold hover:bg-primary-container transition-colors shadow-sm cursor-pointer",
													children: "Apply"
												})]
											}),
											appliedCoupon && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-primary/10 border border-primary/20 rounded-2xl p-3 flex items-center justify-between gap-2 mb-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-primary text-[18px]",
														children: "check_circle"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-headline-sm text-xs font-black text-primary",
															children: appliedCoupon.code
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-primary text-white",
															children: "APPLIED"
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
														className: "text-[11px] text-primary/90 font-medium",
														children: ["Promo discount: ₹", couponDiscount]
													})] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: handleRemoveCoupon,
													className: "text-xs font-bold text-error hover:underline shrink-0 cursor-pointer",
													children: "Remove"
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-secondary text-[20px]",
														children: "monetization_on"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
														className: "font-headline-sm text-sm font-extrabold text-on-surface",
														children: "Smart Coins"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-xs font-black text-secondary",
													children: [userCoins, " Available"]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-on-surface-variant mb-4 leading-relaxed",
												children: "Use accumulated loyalty coins from your past fresh produce orders."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												onClick: () => {
													if (userCoins > 0) setRedeemCoins(!redeemCoins);
													else toast.info("No Smart Coins available in your wallet");
												},
												className: `p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${redeemCoins ? "border-secondary bg-secondary/10 shadow-sm" : "border-outline-variant/20 hover:border-secondary/40 bg-surface-container-low/40"}`,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "checkbox",
														checked: redeemCoins,
														onChange: (e) => setRedeemCoins(e.target.checked),
														onClick: (e) => e.stopPropagation(),
														disabled: userCoins <= 0,
														className: "accent-secondary cursor-pointer"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "font-headline-sm text-xs font-bold text-on-surface block",
														children: [
															"Redeem ",
															coinsToRedeem,
															" Coins"
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-[10px] text-on-surface-variant font-medium",
														children: [
															"Instant ₹",
															(coinsToRedeem * coinValueInRupees).toFixed(2).replace(/\.00$/, ""),
															" direct checkout discount"
														]
													})] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-secondary text-[20px]",
													children: "military_tech"
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderBillSummary, {
										mode: "cart",
										ctaText: "Proceed to Checkout",
										disabled: items.length === 0,
										onCtaClick: handleProceedToCheckout
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 rounded-3xl bg-surface-container-low/60 border border-outline-variant/15 flex items-start gap-3 text-xs text-on-surface-variant",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5",
											children: "verified_user"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
											className: "font-headline-sm text-xs font-bold text-on-surface mb-0.5",
											children: "Sri Amman Quality Promise"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] leading-relaxed",
											children: "Cold pressed oils & farm-picked produce are double-checked for weight and quality seal before dispatch."
										})] })]
									})
								]
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
/**
* Safely normalizes and humanizes checkout errors so that internal Firestore
* security rule exceptions, CEL null errors, or missing error objects do not
* crash the UI with secondary exceptions or confusing technical traces.
*/
function formatCheckoutError(err) {
	if (err === null || err === void 0) return "Order placement could not be completed. Your cart and selected address have been preserved.";
	const rawMessage = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String(err.message) : String(err);
	const rawCode = typeof err === "object" && err && "code" in err ? String(err.code) : "";
	const status = typeof err === "object" && err && "status" in err ? Number(err.status) : 0;
	if (rawCode === "permission-denied" || status === 403 || rawMessage.includes("permission-denied") || rawMessage.includes("Permission denied") || rawMessage.includes("PERMISSION_DENIED") || rawMessage.includes("Null value error") || rawMessage.includes("evaluation error at L")) return "Order placement is currently disabled in read-only mode. Your cart and selected delivery details have been safely preserved.";
	if (rawMessage.includes("Failed to fetch") || rawMessage.includes("fetch failed") || rawMessage.includes("ECONNREFUSED") || rawMessage.includes("network")) return "Unable to connect to the store service. Please verify your connection. Your cart has been preserved.";
	if (rawMessage && !rawMessage.includes("GrpcConnection") && !rawMessage.includes("INTERNAL ASSERTION") && !rawMessage.includes("@firebase") && rawMessage.length < 200) return rawMessage;
	return "Order placement failed. Your cart has been preserved.";
}
var Route$12 = createFileRoute("/checkout")({
	validateSearch: (search) => {
		const raw = search["step"];
		let step = 2;
		if (raw === 3 || raw === "3" || raw === "payment") step = 3;
		return {
			step,
			newAddress: search["newAddress"] === true || search["newAddress"] === "true"
		};
	},
	head: () => ({ meta: [{ title: "Checkout — Sri Amman Smart Store" }, {
		name: "description",
		content: "Complete your farm grocery order safely."
	}] }),
	component: CheckoutPage
});
function CheckoutPage() {
	const searchParams = useSearch({ from: "/checkout" });
	const navigate = useNavigate();
	const { items, cartCount, cartSubtotal, cartTotalSavings, appliedCoupon, couponDiscount, redeemCoins, coinsRedeemed, coinDiscount, deliverySpeed, deliveryFee, deliverySettingsError, isExpressDeliveryAvailable, standardDeliveryFee, expressDeliveryFee, finalTotal, selectedAddressId, selectedSlotId, paymentMethod, selectedUpiId, isGuestCartSyncing, guestCartSyncError, syncGuestCart, setDeliverySpeed, setSelectedAddressId, setSelectedSlotId, setPaymentMethod, setSelectedUpiId, clearCart, resetDiscounts, revalidateCartItems } = useCart();
	const { user, isLoading: authLoading, isResolvingIdentity, refreshUser } = useAuth();
	const { refreshNotifications } = useNotifications();
	const currentStep = searchParams.step === 3 ? 3 : 2;
	const [addresses, setAddresses] = (0, import_react.useState)([]);
	const [deliverySlots, setDeliverySlots] = (0, import_react.useState)([]);
	const [deliveryConfig, setDeliveryConfig] = (0, import_react.useState)(DEFAULT_DELIVERY_SETTINGS);
	const [paymentConfig, setPaymentConfig] = (0, import_react.useState)(DEFAULT_PAYMENT_SETTINGS);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [isItemsExpanded, setIsItemsExpanded] = (0, import_react.useState)(true);
	const [includeGstin, setIncludeGstin] = (0, import_react.useState)(false);
	const [gstinNumber, setGstinNumber] = (0, import_react.useState)("");
	const [cardCvv, setCardCvv] = (0, import_react.useState)("");
	const [upiVerified, setUpiVerified] = (0, import_react.useState)(true);
	const [showAddressModal, setShowAddressModal] = (0, import_react.useState)(false);
	const [showPhoneVerificationModal, setShowPhoneVerificationModal] = (0, import_react.useState)(false);
	const isPhoneVerified = Boolean(user?.phoneVerified);
	const [newTag, setNewTag] = (0, import_react.useState)("Home");
	const [newName, setNewName] = (0, import_react.useState)(user?.name || "");
	const [newPhone, setNewPhone] = (0, import_react.useState)(user?.phone || "");
	const [newHouseNo, setNewHouseNo] = (0, import_react.useState)("");
	const [newStreet, setNewStreet] = (0, import_react.useState)("");
	const [newLandmark, setNewLandmark] = (0, import_react.useState)("");
	const [newCity, setNewCity] = (0, import_react.useState)("Gobichettipalayam");
	const [newPincode, setNewPincode] = (0, import_react.useState)("638454");
	(0, import_react.useEffect)(() => {
		async function loadCheckoutData() {
			if (!user) {
				if (!authLoading && !isResolvingIdentity) setLoading(false);
				return;
			}
			try {
				const [addrList, slots, dConfig, pConfig] = await Promise.all([
					addressService.getAddresses(user.id),
					settingsService.getDeliverySlots(),
					settingsService.getDeliveryConfiguration(),
					settingsService.getPaymentConfiguration()
				]);
				setAddresses(addrList || []);
				if (dConfig) setDeliveryConfig(dConfig);
				if (pConfig) setPaymentConfig(pConfig);
				if (selectedAddressId && addrList?.some((a) => a.id === selectedAddressId)) {} else {
					const defaultAddr = addrList?.find((a) => a.isDefault) || addrList?.[0];
					if (defaultAddr) setSelectedAddressId(defaultAddr.id);
				}
				setDeliverySlots(slots || []);
				if (!selectedSlotId && slots && slots.length > 0 && slots[0]) setSelectedSlotId(slots[0].id);
			} catch (err) {
				console.error("Failed to load checkout data:", err);
			} finally {
				setLoading(false);
			}
		}
		loadCheckoutData();
	}, [
		user,
		authLoading,
		isResolvingIdentity,
		selectedAddressId,
		selectedSlotId,
		setSelectedAddressId,
		setSelectedSlotId
	]);
	const selectedAddress = (0, import_react.useMemo)(() => {
		return addresses.find((a) => a.id === selectedAddressId) || addresses[0] || null;
	}, [addresses, selectedAddressId]);
	const selectedSlot = (0, import_react.useMemo)(() => {
		return deliverySlots.find((s) => s.id === selectedSlotId) || deliverySlots[0] || {
			id: "slot_exp",
			type: deliverySpeed === "express" ? "express" : "standard",
			title: deliverySpeed === "express" ? "Express 60-Min Instant Dispatch" : "Standard Morning (8:00 AM - 11:00 AM)",
			charge: deliveryFee
		};
	}, [
		deliverySlots,
		selectedSlotId,
		deliverySpeed,
		deliveryFee
	]);
	const geofenceStatus = (0, import_react.useMemo)(() => {
		if (!selectedAddress) return {
			eligible: false,
			distanceKm: 0,
			maxRadiusKm: deliveryConfig.deliveryRadiusKm,
			storeName: deliveryConfig.storeName,
			storeAddress: deliveryConfig.storeAddress
		};
		return addressService.validateDeliveryServiceability(selectedAddress, deliveryConfig);
	}, [selectedAddress, deliveryConfig]);
	const canGoToPayment = (0, import_react.useMemo)(() => {
		return selectedAddress !== null && geofenceStatus.eligible && items.length > 0 && isPhoneVerified;
	}, [
		selectedAddress,
		geofenceStatus.eligible,
		items.length,
		isPhoneVerified
	]);
	const handleOpenNewAddressModal = () => {
		if (!newName && user?.name) setNewName(user.name);
		if (!newPhone && user?.phone) setNewPhone(user.phone);
		setShowAddressModal(true);
	};
	(0, import_react.useEffect)(() => {
		if (searchParams.newAddress) handleOpenNewAddressModal();
	}, [searchParams.newAddress, user]);
	const handleStepNavigation = (targetStep) => {
		if (targetStep === 1) {
			navigate({ to: "/cart" });
			return;
		}
		if (targetStep === 2) {
			navigate({
				to: "/checkout",
				search: { step: 2 }
			});
			return;
		}
		if (targetStep === 3) {
			if (!selectedAddress || addresses.length === 0) {
				handleOpenNewAddressModal();
				toast.info("Please add a delivery address to proceed.");
				return;
			}
			if (!geofenceStatus.eligible) {
				toast.error(geofenceStatus.reason || `Selected address is outside our ${deliveryConfig.deliveryRadiusKm}km delivery zone (${geofenceStatus.distanceKm}km away)`);
				return;
			}
			if (!isPhoneVerified) {
				toast.info("Verify your mobile number to continue with checkout.");
				setShowPhoneVerificationModal(true);
				return;
			}
			navigate({
				to: "/checkout",
				search: { step: 3 }
			});
		}
	};
	const handleContinueToPayment = () => {
		if (!selectedAddress || addresses.length === 0) {
			handleOpenNewAddressModal();
			toast.info("Please add a delivery address to proceed.");
			return;
		}
		if (!geofenceStatus.eligible) {
			toast.error(geofenceStatus.reason || `Selected address is ${geofenceStatus.distanceKm}km away. Deliveries are restricted within ${deliveryConfig.deliveryRadiusKm}km of our store.`);
			return;
		}
		if (!isPhoneVerified) {
			toast.info("Verify your mobile number to continue with checkout.");
			setShowPhoneVerificationModal(true);
			return;
		}
		navigate({
			to: "/checkout",
			search: { step: 3 }
		});
		window.scrollTo({
			top: 0,
			behavior: "smooth"
		});
	};
	const handleAddNewAddress = async (e) => {
		e.preventDefault();
		if (!newHouseNo.trim() || !newStreet.trim()) {
			toast.error("Please fill in house number and street name");
			return;
		}
		try {
			const added = await addressService.addAddress({
				userId: user.id,
				tag: newTag,
				name: newName.trim() || user.name || "Customer",
				phone: newPhone.trim() || user.phone || "",
				houseNo: newHouseNo.trim(),
				street: newStreet.trim(),
				landmark: newLandmark.trim(),
				city: newCity.trim(),
				pincode: newPincode.trim(),
				lat: 11.4595,
				lng: 77.3338,
				isDefault: true
			});
			setAddresses((prev) => [added, ...prev]);
			setSelectedAddressId(added.id);
			setShowAddressModal(false);
			setNewHouseNo("");
			setNewStreet("");
			setNewLandmark("");
			toast.success("New delivery address saved!");
		} catch (err) {
			toast.error(err.message || "Failed to save address");
		}
	};
	const handlePlaceOrder = async () => {
		if (isSubmitting) return;
		if (!user || authLoading || isResolvingIdentity) {
			toast.info("Sign in or create an account to continue checkout. Your cart is saved.");
			navigate({
				to: "/login",
				search: { redirect: "/checkout" }
			});
			return;
		}
		if (isGuestCartSyncing || guestCartSyncError) {
			toast.error("Your cart must finish syncing before an order can be placed.");
			return;
		}
		if (!isPhoneVerified) {
			toast.info("Verify your mobile number to continue with checkout.");
			setShowPhoneVerificationModal(true);
			return;
		}
		if (!selectedAddress) {
			toast.error("Please select a delivery address");
			navigate({
				to: "/checkout",
				search: { step: 2 }
			});
			return;
		}
		if (!geofenceStatus.eligible) {
			toast.error(geofenceStatus.reason || `Selected address is outside our ${deliveryConfig.deliveryRadiusKm}km delivery boundary (${geofenceStatus.distanceKm}km away).`);
			navigate({
				to: "/checkout",
				search: { step: 2 }
			});
			return;
		}
		if (items.length === 0) {
			toast.error("Your cart is empty");
			navigate({ to: "/shop" });
			return;
		}
		const placeOrderInternal = async (isPaidOnline = false, overrideMethod) => {
			const chosenMethod = overrideMethod || (isPaidOnline ? "online" : paymentMethod === "cod" ? "cod" : paymentMethod === "upi" ? "upi" : "online");
			const order = await orderService.createOrder({
				userId: user.id,
				customerName: selectedAddress.name || user.name || "Customer",
				phone: user.phone || selectedAddress.phone || "",
				address: selectedAddress,
				deliverySlot: selectedSlot,
				paymentMethod: chosenMethod,
				cartItems: items,
				subtotal: cartSubtotal,
				productSavings: cartTotalSavings,
				deliveryFee,
				coinDiscount,
				coinsRedeemed,
				couponDiscount,
				totalAmount: finalTotal
			});
			if (!order || !order.orderId) throw new Error("Order creation did not return a valid order identifier.");
			await clearCart();
			resetDiscounts();
			await refreshNotifications();
			await refreshUser();
			toast.success(chosenMethod === "upi" ? `Order #${order.orderId} placed (Awaiting UPI Verification)!` : `Order #${order.orderId} placed successfully!`);
			navigate({
				to: "/orders",
				search: { placed: order.orderId }
			});
		};
		setIsSubmitting(true);
		try {
			const latestItems = await revalidateCartItems();
			const unavailableItems = latestItems.filter((item) => item.stock <= 0 || item.quantity > item.stock);
			if (unavailableItems.length > 0) throw new Error(`Review unavailable or low-stock items before placing your order: ${unavailableItems.map((item) => item.name).join(", ")}.`);
			if (latestItems.some((item, index) => item.price !== items[index]?.price || item.mrp !== items[index]?.mrp)) {
				toast.info("Product prices changed. Your cart has been updated; review the new total and place your order again.");
				return;
			}
			if (paymentMethod === "cod") await placeOrderInternal(false, "cod");
			else if (paymentMethod === "upi") await placeOrderInternal(false, "upi");
			else {
				const razorpayKey = {
					"BASE_URL": "/",
					"DEV": false,
					"MODE": "production",
					"PROD": true,
					"SSR": true,
					"TSS_DEV_SERVER": "false",
					"TSS_DEV_SSR_STYLES_BASEPATH": "/",
					"TSS_DEV_SSR_STYLES_ENABLED": "true",
					"TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": "false",
					"TSS_INLINE_CSS_ENABLED": "false",
					"TSS_ROUTER_BASEPATH": "",
					"TSS_SERVER_FN_BASE": "/_serverFn/",
					"VITE_FIREBASE_API_KEY": "AIzaSyDTzovF1RChmczvRXTNtY9-i-cOTI2JAuQ",
					"VITE_FIREBASE_AUTH_DOMAIN": "sri-amman-smart-store.firebaseapp.com",
					"VITE_FIREBASE_PROJECT_ID": "sri-amman-smart-store",
					"VITE_FIREBASE_PROJECT_NUMBER": "1018585256480",
					"VITE_GOOGLE_MAPS_API_KEY": "AIzaSyDfyH7PbjPul498tw0qXw017nFjRIuKn5w",
					"VITE_RAZORPAY_KEY_ID": "rzp_live_R.............."
				}["VITE_RAZORPAY_KEY_ID"] || "";
				if (typeof window !== "undefined" && !window.Razorpay && razorpayKey) {
					const script = document.createElement("script");
					script.src = "https://checkout.razorpay.com/v1/checkout.js";
					script.async = true;
					document.body.appendChild(script);
					await new Promise((res) => {
						script.onload = res;
						setTimeout(res, 2e3);
					});
				}
				if (typeof window !== "undefined" && window.Razorpay && razorpayKey) {
					const options = {
						key: razorpayKey,
						amount: Math.round(finalTotal * 100),
						currency: "INR",
						name: "Sri Amman Smart Store",
						description: `Order Payment (${items.length} items)`,
						handler: async function() {
							try {
								setIsSubmitting(true);
								await placeOrderInternal(true);
							} catch (err) {
								toast.error(formatCheckoutError(err));
							} finally {
								setIsSubmitting(false);
							}
						},
						prefill: {
							name: selectedAddress.name || user?.name || "",
							email: user?.email || "",
							contact: selectedAddress.phone || user?.phone || ""
						},
						theme: { color: "#005f3f" },
						modal: { ondismiss: function() {
							setIsSubmitting(false);
							toast.info("Payment cancelled.");
						} }
					};
					const rzp = new window.Razorpay(options);
					rzp.on("payment.failed", function(response) {
						toast.error(response?.error?.description || "Payment failed. Please try again.");
						setIsSubmitting(false);
					});
					rzp.open();
					return;
				}
				await placeOrderInternal(true);
			}
		} catch (err) {
			const userMessage = formatCheckoutError(err);
			toast.error(userMessage);
		} finally {
			setIsSubmitting(false);
		}
	};
	if ((authLoading || isResolvingIdentity) && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1320px] mx-auto px-margin-desktop py-20 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-on-surface-variant font-medium",
					children: "Preparing checkout..."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	if (user && isGuestCartSyncing) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1320px] mx-auto px-margin-desktop py-20 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-on-surface-variant font-medium",
					children: "Syncing your saved cart with your account…"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	if (user && guestCartSyncError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] max-w-[800px] mx-auto px-margin-desktop py-16 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "alert",
					className: "rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined mb-3 text-4xl text-amber-700",
							children: "sync_problem"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "mb-2 text-xl font-bold",
							children: "Your cart needs attention"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mb-6 text-sm text-on-surface-variant",
							children: [guestCartSyncError, " Your guest cart is still saved on this device. Checkout will continue after the cart sync completes."]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap justify-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => void syncGuestCart(),
								disabled: isGuestCartSyncing,
								className: "rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60",
								children: isGuestCartSyncing ? "Syncing cart…" : "Retry cart sync"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/cart",
								className: "rounded-xl border border-outline-variant/30 bg-white px-5 py-2.5 text-sm font-bold text-on-surface",
								children: "Review cart"
							})]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	if (!user && !loading && !authLoading && !isResolvingIdentity) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1320px] mx-auto px-margin-desktop py-16 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-3xl mx-auto mb-4",
						children: "🔒"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold mb-2",
						children: "Please Sign In to Complete Checkout"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-on-surface-variant mb-6",
						children: "Sign in or create an account to choose a delivery address and place your order. Your selected items will stay in your cart."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap justify-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/login",
							search: { redirect: "/checkout" },
							className: "bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container",
							children: "Sign In"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/sign-up",
							search: { redirect: "/checkout" },
							className: "rounded-xl border border-primary/20 bg-primary/5 px-6 py-2.5 font-headline-sm text-xs font-bold text-primary",
							children: "Create Account"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	if (items.length === 0 && !loading) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1320px] mx-auto px-margin-desktop py-16 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-3xl mx-auto mb-4",
						children: "🛒"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-bold mb-2",
						children: "No Items in Cart to Checkout"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-on-surface-variant mb-6",
						children: "Please add items to your cart before proceeding to checkout."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/shop",
						className: "bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md",
						children: "Go to Shop Catalog"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-[1320px] mx-auto px-margin-desktop py-space-xl",
						children: [
							deliverySettingsError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								role: "status",
								className: "mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900",
								children: ["Delivery settings could not be loaded. The legacy default charges are being shown. ", deliverySettingsError]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mb-8",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CheckoutProgressBar, {
									currentStep,
									cartItemCount: cartCount,
									selectedAddressText: selectedAddress ? `${selectedAddress.city}, ${selectedAddress.pincode}` : "No address selected",
									onStepClick: handleStepNavigation,
									canNavigateToStep: (s) => s === 3 ? canGoToPayment : true
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "lg:col-span-8 space-y-6",
									children: currentStep === 2 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										!isPhoneVerified && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											"data-testid": "checkout-phone-verification-banner",
											className: "bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[22px]",
														children: "verified_user"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
														className: "font-headline-sm text-sm font-extrabold text-amber-950",
														children: "Verify your mobile number to continue with checkout."
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-900",
														children: "REQUIRED"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-amber-900/80 mt-0.5",
													children: "Order updates, live doorstep dispatch, and delivery security require a verified contact number."
												})] })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setShowPhoneVerificationModal(true),
												className: "font-headline-sm text-xs font-bold px-4 py-2 rounded-xl bg-[#005f3f] text-white hover:bg-[#004d32] transition-colors shrink-0 shadow-sm cursor-pointer",
												children: "Verify Mobile Number"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-primary text-[22px]",
														children: "location_on"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
															className: "font-headline-sm text-base font-extrabold text-on-surface",
															children: "Delivery Address"
														}), selectedAddress && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary",
															children: selectedAddress.tag || "HOME"
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11px] text-on-surface-variant",
														children: selectedAddress ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
															"Delivering from Gobichettipalayam Store Hub (",
															geofenceStatus.distanceKm > 0 ? `${geofenceStatus.distanceKm} km` : "0.8 km",
															")"
														] }) : "Store Hub: Gobichettipalayam • Service Radius: 6.0 KM"
													})] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: handleOpenNewAddressModal,
													className: "text-primary hover:text-primary-container font-headline-sm text-xs font-bold flex items-center gap-1 cursor-pointer hover:underline",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[16px]",
														children: "add"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Change / Add New" })]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-3",
												children: [addresses.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													"data-testid": "no-address-empty-state",
													className: "p-6 rounded-2xl border border-dashed border-primary/30 bg-primary/5 text-center flex flex-col items-center justify-center gap-3",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "material-symbols-outlined text-[24px]",
																children: "add_location_alt"
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
															className: "font-headline-sm text-sm font-bold text-on-surface",
															children: "No Delivery Address Found"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-on-surface-variant mt-1",
															children: "Please add your delivery address to proceed to payment."
														})] }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2 mt-1 flex-wrap justify-center",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																type: "button",
																onClick: handleOpenNewAddressModal,
																className: "bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "material-symbols-outlined text-[16px]",
																	children: "add"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Add New Address" })]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
																to: "/addresses",
																search: {
																	redirect: "/checkout?step=2",
																	action: "new"
																},
																className: "bg-surface-container-low text-on-surface border border-outline-variant/30 hover:bg-surface-container px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Saved Addresses Page" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "material-symbols-outlined text-[14px]",
																	children: "open_in_new"
																})]
															})]
														})
													]
												}) : addresses.map((addr) => {
													const geo = addressService.validateDeliveryServiceability(addr, deliveryConfig);
													const isSelected = selectedAddress?.id === addr.id;
													return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														"data-testid": `address-card-${addr.id}`,
														onClick: () => setSelectedAddressId(addr.id),
														className: `p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/40"}`,
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															type: "radio",
															name: "selected_address",
															checked: isSelected,
															onChange: () => setSelectedAddressId(addr.id),
															className: "mt-1 accent-primary cursor-pointer"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex-1",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center justify-between gap-2 flex-wrap mb-1",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "flex items-center gap-2",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "font-headline-sm text-xs font-bold text-on-surface",
																			children: addr.name
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "text-xs text-on-surface-variant font-medium",
																			children: addr.phone
																		})]
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "flex items-center gap-2",
																		children: [addr.isDefault && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "px-2 py-0.5 rounded-full text-[10px] font-black bg-primary/10 text-primary",
																			children: "• Selected Default"
																		}), geo.eligible ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary flex items-center gap-0.5",
																			children: [
																				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																					className: "material-symbols-outlined text-[12px]",
																					children: "check_circle"
																				}),
																				"Within ",
																				deliveryConfig.deliveryRadiusKm,
																				" km zone"
																			]
																		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "px-2 py-0.5 rounded-full text-[10px] font-bold bg-error/10 text-error flex items-center gap-0.5",
																			children: [
																				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																					className: "material-symbols-outlined text-[12px]",
																					children: "warning"
																				}),
																				"Outside ",
																				deliveryConfig.deliveryRadiusKm,
																				" km (",
																				geo.distanceKm,
																				" km)"
																			]
																		})]
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																	className: "text-xs text-on-surface-variant leading-relaxed",
																	children: [
																		"#",
																		addr.houseNo,
																		", ",
																		addr.street,
																		addr.landmark ? `, ${addr.landmark}` : "",
																		", ",
																		addr.city,
																		" -",
																		" ",
																		addr.pincode
																	]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center gap-4 mt-2 text-[10px] text-outline font-semibold",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "flex items-center gap-1",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "material-symbols-outlined text-[13px] text-primary",
																			children: "verified"
																		}), "Standard Access Verified"]
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "flex items-center gap-1",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "material-symbols-outlined text-[13px] text-primary",
																			children: "elevator"
																		}), "Elevator Available"]
																	})]
																})
															]
														})]
													}, addr.id);
												}), !geofenceStatus.eligible && selectedAddress && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													"data-testid": "not-deliverable-banner",
													className: "p-4 rounded-2xl bg-error/10 border border-error/30 text-error flex items-start gap-3 mt-3 shadow-xs",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[20px] shrink-0 mt-0.5",
														children: "error"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
														className: "font-headline-sm text-xs font-bold",
														children: "Address Not Deliverable"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11px] mt-0.5 leading-relaxed text-error/90",
														children: geofenceStatus.reason || `Delivery is not available for this address. We deliver up to ${deliveryConfig.deliveryRadiusKm} km from our store in Gobichettipalayam, Erode. (Your location is approximately ${geofenceStatus.distanceKm} km away).`
													})] })]
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-secondary text-[22px]",
														children: "bolt"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
														className: "font-headline-sm text-sm font-extrabold text-on-surface",
														children: "Delivery Speed & Slot"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "px-2.5 py-0.5 rounded-full bg-secondary/15 text-secondary text-[10px] font-black uppercase tracking-wider",
													children: "Chennai Express Hub"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													onClick: () => {
														if (!isExpressDeliveryAvailable) return;
														setDeliverySpeed("express");
														setSelectedSlotId("slot_exp");
													},
													className: `p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${deliverySpeed === "express" ? "border-primary bg-primary/5 shadow-sm" : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/40"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "radio",
														id: "slot_opt_express",
														name: "slot_selection",
														checked: deliverySpeed === "express",
														disabled: !isExpressDeliveryAvailable,
														onChange: () => {
															setDeliverySpeed("express");
															setSelectedSlotId("slot_exp");
														},
														className: "mt-1 accent-primary cursor-pointer"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex-1",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center justify-between",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
																	htmlFor: "slot_opt_express",
																	className: "font-headline-sm text-xs font-bold text-on-surface flex items-center gap-1 cursor-pointer",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Express 60–Min" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "text-secondary",
																		children: "⚡"
																	})]
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "font-headline-sm text-xs font-extrabold text-on-surface",
																	children: expressDeliveryFee > 0 ? `₹${expressDeliveryFee}` : "FREE"
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-[11px] font-semibold text-on-surface-variant mt-1",
																children: "Arrival in 45–60 mins (Today)"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center justify-between mt-2 pt-1 border-t border-outline-variant/15 text-[10px] text-outline",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Rider Assigned from Store Hub" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold",
																	children: "Fastest"
																})]
															})
														]
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													onClick: () => {
														setDeliverySpeed("standard");
														setSelectedSlotId("slot_std_morning");
													},
													className: `p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${deliverySpeed === "standard" ? "border-primary bg-primary/5 shadow-sm" : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/40"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
														type: "radio",
														id: "slot_opt_standard",
														name: "slot_selection",
														checked: deliverySpeed === "standard",
														onChange: () => {
															setDeliverySpeed("standard");
															setSelectedSlotId("slot_std_morning");
														},
														className: "mt-1 accent-primary cursor-pointer"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex-1",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center justify-between",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																	htmlFor: "slot_opt_standard",
																	className: "font-headline-sm text-xs font-bold text-on-surface cursor-pointer",
																	children: "Standard Delivery"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary",
																	children: standardDeliveryFee > 0 ? `₹${standardDeliveryFee}` : "FREE"
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
																className: "text-[11px] font-semibold text-on-surface-variant mt-1",
																children: "Tomorrow Morning (8:00 AM – 11:00 AM)"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center justify-between mt-2 pt-1 border-t border-outline-variant/15 text-[10px] text-outline",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Direct Batch Farm Fulfillment" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant font-bold",
																	children: "Eco Route"
																})]
															})
														]
													})]
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between pt-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
												to: "/cart",
												className: "px-5 py-2.5 rounded-2xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[16px]",
													children: "arrow_back"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Back to Cart" })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: handleContinueToPayment,
												className: "px-6 py-3 rounded-2xl bg-primary text-white font-headline-sm text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-2 shadow-md cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Continue to Payment" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[16px]",
													children: "arrow_forward"
												})]
											})]
										})
									] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
										!isPhoneVerified && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											"data-testid": "checkout-phone-verification-banner",
											className: "bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-900 flex items-center justify-center shrink-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[22px]",
														children: "verified_user"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
														className: "font-headline-sm text-sm font-extrabold text-amber-950",
														children: "Verify your mobile number to continue with checkout."
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-900",
														children: "REQUIRED"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-amber-900/80 mt-0.5",
													children: "Order updates, live doorstep dispatch, and delivery security require a verified contact number."
												})] })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setShowPhoneVerificationModal(true),
												className: "font-headline-sm text-xs font-bold px-4 py-2 rounded-xl bg-[#005f3f] text-white hover:bg-[#004d32] transition-colors shrink-0 shadow-sm cursor-pointer",
												children: "Verify Mobile Number"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/15",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start gap-2.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5",
														children: "location_on"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-headline-sm text-xs font-bold text-on-surface",
															children: "Delivery Address"
														}), selectedAddress && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-primary/10 text-primary",
															children: selectedAddress.tag || "HOME"
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11px] text-on-surface-variant mt-0.5 line-clamp-1",
														children: selectedAddress ? `${selectedAddress.name} — #${selectedAddress.houseNo}, ${selectedAddress.street}, ${selectedAddress.city}` : "No address selected. Please add or select an address."
													})] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => handleStepNavigation(2),
													className: "text-primary hover:underline text-[11px] font-bold shrink-0 cursor-pointer",
													children: "Change"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-surface-container-low/50 border border-outline-variant/15",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start gap-2.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5",
														children: "local_shipping"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-headline-sm text-xs font-bold text-on-surface block",
														children: deliverySpeed === "express" ? "Express 60–Min (Today)" : "Standard Morning (Tomorrow)"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11px] text-on-surface-variant mt-0.5",
														children: deliveryFee > 0 ? `Delivery Fee: ₹${deliveryFee}` : "Free Delivery"
													})] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => handleStepNavigation(2),
													className: "text-primary hover:underline text-[11px] font-bold shrink-0 cursor-pointer",
													children: "Change"
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm space-y-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between mb-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-primary text-[22px]",
															children: "account_balance_wallet"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
															className: "font-headline-sm text-base font-extrabold text-on-surface",
															children: "Payment Method"
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider flex items-center gap-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[13px]",
															children: "verified"
														}), "PCI DSS Validated"]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													onClick: () => setPaymentMethod("upi"),
													className: `p-4 rounded-2xl border transition-all cursor-pointer ${paymentMethod === "upi" ? "border-primary bg-primary/5 shadow-sm" : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/30"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2.5",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																	type: "radio",
																	name: "payment_method_group",
																	checked: paymentMethod === "upi",
																	onChange: () => setPaymentMethod("upi"),
																	className: "accent-primary cursor-pointer"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "font-headline-sm text-xs font-bold text-on-surface",
																	children: "UPI (Instant 0% Fee)"
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "px-2 py-0.5 rounded text-[10px] font-black uppercase bg-secondary/15 text-secondary",
																	children: "Recommended"
																})
															]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2 text-[11px] font-bold text-outline",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "GPay" }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "PhonePe" }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Paytm" })
															]
														})]
													}), paymentMethod === "upi" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "mt-4 pt-3 border-t border-outline-variant/15 space-y-3.5",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "p-4 rounded-2xl bg-surface-container-low/60 border border-outline-variant/20 space-y-3",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center justify-between",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "text-[10px] uppercase tracking-wider font-extrabold text-on-surface-variant block",
																		children: "Store Payee"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "font-headline-sm text-xs font-extrabold text-on-surface",
																		children: paymentConfig.merchantName
																	})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "text-right",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "text-[10px] uppercase tracking-wider font-extrabold text-on-surface-variant block",
																			children: "Exact Amount"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																			className: "font-headline-sm text-sm font-extrabold text-primary",
																			children: ["₹", finalTotal.toLocaleString("en-IN")]
																		})]
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center justify-between gap-3 p-3 rounded-xl bg-surface border border-outline-variant/25",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "flex items-center gap-2.5",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "material-symbols-outlined text-primary text-[20px]",
																			children: "qr_code_2"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "text-[10px] text-outline font-bold block",
																			children: "Merchant UPI ID"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "font-mono text-xs font-black text-on-surface select-all",
																			children: paymentConfig.merchantUpiId
																		})] })]
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																		type: "button",
																		onClick: () => {
																			if (navigator?.clipboard?.writeText) {
																				navigator.clipboard.writeText(paymentConfig.merchantUpiId);
																				toast.success("Merchant UPI ID copied!");
																			}
																		},
																		className: "px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "material-symbols-outlined text-[14px]",
																			children: "content_copy"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Copy" })]
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center justify-between gap-2 pt-1",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "text-[11px] text-on-surface-variant font-medium",
																		children: "Pay using any installed UPI application"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
																		href: `upi://pay?pa=${paymentConfig.merchantUpiId}&pn=${encodeURIComponent(paymentConfig.merchantName)}&am=${finalTotal}&cu=INR&tn=${encodeURIComponent(`Order by ${user?.name || "Customer"}`)}`,
																		className: "px-3 py-1.5 rounded-lg bg-secondary/15 text-secondary font-bold text-xs hover:bg-secondary/25 transition-colors flex items-center gap-1 cursor-pointer",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																			className: "material-symbols-outlined text-[14px]",
																			children: "open_in_new"
																		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Open UPI App" })]
																	})]
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-start gap-2 p-2.5 rounded-xl bg-primary/5 text-primary text-[11px] leading-relaxed",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "material-symbols-outlined text-[16px] shrink-0 mt-0.5",
																		children: "info"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
																		"Pay to the merchant UPI ID above, then click ",
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Place Order" }),
																		" below. Your order will be placed with payment ",
																		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "awaiting verification" }),
																		"."
																	] })]
																})
															]
														})
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													onClick: () => setPaymentMethod("card"),
													className: `p-4 rounded-2xl border transition-all cursor-pointer ${paymentMethod === "card" ? "border-primary bg-primary/5 shadow-sm" : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/30"}`,
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																type: "radio",
																name: "payment_method_group",
																checked: paymentMethod === "card",
																onChange: () => setPaymentMethod("card"),
																className: "accent-primary cursor-pointer"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-headline-sm text-xs font-bold text-on-surface",
																children: "Credit / Debit Cards"
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] font-bold text-outline",
															children: "Visa, Mastercard, RuPay"
														})]
													}), paymentMethod === "card" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "mt-4 pt-3 border-t border-outline-variant/15 space-y-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "p-3.5 rounded-xl bg-surface border border-outline-variant/20 flex items-center justify-between gap-3",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-3",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "px-2 py-1 rounded bg-[#1a1f71] text-white font-black text-[10px] tracking-widest",
																	children: "VISA"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "font-headline-sm text-xs font-bold text-on-surface block",
																	children: "Axis Bank Privilege •••• 4289"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "text-[10px] text-on-surface-variant font-medium",
																	children: ["Expires 09/28 • ", user?.name || "Cardholder"]
																})] })]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																	type: "password",
																	maxLength: 3,
																	placeholder: "CVV",
																	value: cardCvv,
																	onChange: (e) => setCardCvv(e.target.value),
																	className: "w-14 px-2.5 py-1.5 rounded-lg bg-surface-container text-xs font-bold text-center border border-outline-variant/30 focus:outline-none focus:ring-1 focus:ring-primary"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "material-symbols-outlined text-[15px] text-outline cursor-help",
																	title: "3-digit security code on card back",
																	children: "help"
																})]
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
															type: "button",
															onClick: () => toast.info("Add new card drawer will open"),
															className: "text-primary font-bold text-xs flex items-center gap-1 cursor-pointer hover:underline",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "material-symbols-outlined text-[15px]",
																children: "add"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Add New Card" })]
														})]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													onClick: () => setPaymentMethod("netbanking"),
													className: `p-4 rounded-2xl border transition-all cursor-pointer ${paymentMethod === "netbanking" ? "border-primary bg-primary/5 shadow-sm" : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/30"}`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																type: "radio",
																name: "payment_method_group",
																checked: paymentMethod === "netbanking",
																onChange: () => setPaymentMethod("netbanking"),
																className: "accent-primary cursor-pointer"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-headline-sm text-xs font-bold text-on-surface",
																children: "Net Banking"
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] font-bold text-outline",
															children: "HDFC • ICICI • SBI • Axis"
														})]
													})
												}),
												coinDiscount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-4 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-between gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-secondary text-[22px]",
															children: "monetization_on"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-headline-sm text-xs font-extrabold text-on-surface",
																children: "Smart Coins Redemption"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-secondary text-white",
																children: "APPLIED"
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "text-[11px] text-on-surface-variant font-medium mt-0.5",
															children: [
																coinsRedeemed,
																" Smart Coins redeemed for ₹",
																coinDiscount,
																" instant checkout saving • ",
																((user?.smartCoins ?? user?.coins) || 0) - coinsRedeemed,
																" Smart Coins Remaining"
															]
														})] })]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "font-headline-sm text-sm font-extrabold text-secondary",
														children: ["−₹", coinDiscount]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													onClick: () => setPaymentMethod("cod"),
													className: `p-4 rounded-2xl border transition-all cursor-pointer ${paymentMethod === "cod" ? "border-primary bg-primary/5 shadow-sm" : "border-outline-variant/20 hover:border-primary/40 bg-surface-container-low/30"}`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																type: "radio",
																name: "payment_method_group",
																checked: paymentMethod === "cod",
																onChange: () => setPaymentMethod("cod"),
																className: "accent-primary cursor-pointer"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-headline-sm text-xs font-bold text-on-surface block",
																children: "Cash / Pay on Delivery (UPI at doorstep)"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-[10px] text-on-surface-variant",
																children: "Nominal ₹15 courier handling charge applies"
															})] })]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "px-2 py-0.5 rounded text-[10px] font-black uppercase bg-primary/10 text-primary",
															children: "Available"
														})]
													})
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												onClick: () => setIsItemsExpanded(!isItemsExpanded),
												className: "flex items-center justify-between cursor-pointer select-none",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-primary text-[22px]",
														children: "shopping_bag"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
														className: "font-headline-sm text-sm font-extrabold text-on-surface",
														children: [
															"Order Items (",
															cartCount,
															" Fresh Items)"
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11px] text-on-surface-variant",
														children: "Verified and reserved in store stock"
													})] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-outline transition-transform duration-200",
													children: isItemsExpanded ? "expand_less" : "expand_more"
												})]
											}), isItemsExpanded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-4 pt-4 border-t border-outline-variant/15 grid grid-cols-1 sm:grid-cols-2 gap-3.5",
												children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "p-3 rounded-2xl bg-surface-container-low/50 border border-outline-variant/15 flex items-center gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-12 h-12 rounded-xl bg-surface-container-low shrink-0 flex items-center justify-center p-1 border border-outline-variant/15 overflow-hidden",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: item.image,
															alt: item.name,
															className: "max-w-full max-h-full object-contain",
															loading: "lazy"
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex-1 min-w-0",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
																className: "font-headline-sm text-xs font-bold text-on-surface line-clamp-1",
																children: item.name
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-[10px] text-on-surface-variant",
																children: [
																	item.unitSize,
																	" ",
																	item.unit,
																	" • Qty: ",
																	item.quantity
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-baseline gap-1.5 mt-0.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "font-price-card text-xs font-extrabold text-on-surface",
																	children: ["₹", item.price * item.quantity]
																}), item.mrp > item.price && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "text-[10px] text-outline line-through",
																	children: ["₹", item.mrp * item.quantity]
																})]
															})
														]
													})]
												}, item.id))
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-4 shadow-sm flex items-start justify-between gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-2.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													id: "gstin_check",
													checked: includeGstin,
													onChange: (e) => setIncludeGstin(e.target.checked),
													className: "mt-0.5 accent-primary cursor-pointer"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														htmlFor: "gstin_check",
														className: "font-headline-sm text-xs font-bold text-on-surface cursor-pointer",
														children: "Include GSTIN for Business Purchase"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[10px] text-on-surface-variant",
														children: "Claim input tax credit on corporate entity bills"
													}),
													includeGstin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "mt-2.5",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															type: "text",
															value: gstinNumber,
															onChange: (e) => setGstinNumber(e.target.value.toUpperCase()),
															placeholder: "Enter 15-digit GSTIN (e.g. 33AAAAA0000A1Z5)",
															className: "px-3 py-1.5 rounded-xl bg-surface text-xs font-bold border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary uppercase w-full max-w-sm"
														})
													})
												] })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-outline text-[20px]",
												children: "receipt_long"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between pt-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => handleStepNavigation(2),
												className: "px-5 py-2.5 rounded-2xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container transition-colors flex items-center gap-1.5 cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[16px]",
													children: "arrow_back"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Back to Address & Slot" })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: handlePlaceOrder,
												disabled: isSubmitting,
												className: "px-7 py-3.5 rounded-2xl bg-primary text-white font-headline-sm text-xs font-bold hover:bg-primary-container transition-all flex items-center gap-2 shadow-md cursor-pointer active:scale-95",
												children: isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Processing Order..." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: paymentMethod === "upi" ? `Place Order (Awaiting UPI ₹${finalTotal.toLocaleString("en-IN")})` : paymentMethod === "cod" ? "Place Order (Cash on Delivery)" : `Pay ₹${finalTotal.toLocaleString("en-IN")} & Place Order` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[16px]",
													children: "arrow_forward"
												})] })
											})]
										})
									] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "lg:col-span-4 sticky top-[190px]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderBillSummary, {
										mode: "checkout",
										ctaText: currentStep === 2 ? "Continue to Payment" : `Pay ₹${finalTotal.toLocaleString("en-IN")} & Place Order`,
										onCtaClick: currentStep === 2 ? handleContinueToPayment : handlePlaceOrder,
										isSubmitting,
										disabled: currentStep === 2 ? items.length === 0 || isSubmitting : !canGoToPayment || isSubmitting
									})
								})]
							})
						]
					}),
					showAddressModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-surface-container-lowest rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between mb-4 pb-2 border-b border-outline-variant/15",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-headline-sm text-base font-extrabold text-on-surface",
									children: "Add New Delivery Address"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setShowAddressModal(false),
									className: "w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer",
									children: "✕"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: handleAddNewAddress,
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-2.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-primary font-medium",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[18px]",
												children: "my_location"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Store Delivery Zone" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												setNewHouseNo((prev) => prev || "42/B");
												setNewStreet((prev) => prev || "Kasipalayam High Road");
												setNewLandmark((prev) => prev || "Near Amman Temple");
												setNewCity("Gobichettipalayam");
												setNewPincode("638454");
												toast.info("Auto-filled within 6km delivery zone");
											},
											className: "px-2.5 py-1 bg-primary text-white font-bold rounded-lg text-[11px] hover:bg-primary-container transition-colors cursor-pointer",
											children: "Auto Fill (6km Zone)"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex gap-2",
										children: [
											"Home",
											"Work",
											"Other"
										].map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setNewTag(tag),
											className: `flex-1 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${newTag === tag ? "bg-primary text-white border-primary" : "bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:border-primary"}`,
											children: tag
										}, tag))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[11px] font-bold text-on-surface-variant block mb-1",
											children: "Recipient Name"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											value: newName,
											onChange: (e) => setNewName(e.target.value),
											placeholder: "Full Name",
											className: "w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[11px] font-bold text-on-surface-variant block mb-1",
											children: "Phone Number"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											value: newPhone,
											onChange: (e) => setNewPhone(e.target.value),
											placeholder: "+91...",
											className: "w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-bold text-on-surface-variant block mb-1",
										children: "House / Flat / Door No. *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										required: true,
										value: newHouseNo,
										onChange: (e) => setNewHouseNo(e.target.value),
										placeholder: "e.g. Plot 14, Door 2B",
										className: "w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-bold text-on-surface-variant block mb-1",
										children: "Street & Area *"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										required: true,
										value: newStreet,
										onChange: (e) => setNewStreet(e.target.value),
										placeholder: "e.g. Kasipalayam Road",
										className: "w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[11px] font-bold text-on-surface-variant block mb-1",
										children: "Landmark (Optional)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: newLandmark,
										onChange: (e) => setNewLandmark(e.target.value),
										placeholder: "e.g. Near Amman Kovil",
										className: "w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[11px] font-bold text-on-surface-variant block mb-1",
											children: "City"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											value: newCity,
											onChange: (e) => setNewCity(e.target.value),
											className: "w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[11px] font-bold text-on-surface-variant block mb-1",
											children: "PIN Code"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											value: newPincode,
											onChange: (e) => setNewPincode(e.target.value),
											className: "w-full px-3 py-2 rounded-xl bg-surface-container-low text-xs border border-outline-variant/20 focus:outline-none focus:ring-1 focus:ring-primary"
										})] })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pt-2 flex gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setShowAddressModal(false),
											className: "flex-1 py-2.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-outline hover:bg-surface-container transition-colors cursor-pointer",
											children: "Cancel"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "submit",
											className: "flex-1 py-2.5 rounded-xl bg-primary text-white font-headline-sm text-xs font-bold hover:bg-primary-container transition-colors shadow-md cursor-pointer",
											children: "Save Address"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-center pt-1 border-t border-outline-variant/10",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/addresses",
											search: {
												redirect: "/checkout?step=2",
												action: "new"
											},
											className: "text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Manage all saved addresses in Address Book" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[13px]",
												children: "open_in_new"
											})]
										})
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneVerificationModal, {
						isOpen: showPhoneVerificationModal,
						onClose: () => setShowPhoneVerificationModal(false),
						onSuccess: (verifiedPhone) => {
							toast.success(`Mobile number ${verifiedPhone} verified! You can now proceed.`);
						},
						initialPhone: user?.phone || selectedAddress?.phone || ""
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
var $$splitComponentImporter$4 = () => import("./help-BRwRVKN2.mjs");
var Route$11 = createFileRoute("/help")({
	head: () => ({ meta: [{ title: "Help & Customer Support — Sri Amman Smart Store" }, {
		name: "description",
		content: "Report issues, request products, or reach our customer care."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var Route$10 = createFileRoute("/login")({
	validateSearch: (search) => {
		const rawAuthMode = search["authMode"]?.toLowerCase();
		const validAuthMode = rawAuthMode === "production" || rawAuthMode === "emulator" || rawAuthMode === "mock" ? rawAuthMode : void 0;
		return {
			redirect: search["redirect"] || void 0,
			ref: search["ref"] || void 0,
			mode: search["mode"] || void 0,
			oobCode: search["oobCode"] || void 0,
			apiKey: search["apiKey"] || void 0,
			emailLink: search["emailLink"] || void 0,
			authMode: validAuthMode
		};
	},
	head: () => ({ meta: [{ title: "Sign In & OTP Verification — Sri Amman Smart Store" }, {
		name: "description",
		content: "Sign in with your mobile number or email to access your account and rewards."
	}] }),
	component: LoginPage
});
var COUNTRY_CODES$1 = [
	{
		code: "+91",
		label: "India",
		flag: "🇮🇳"
	},
	{
		code: "+1",
		label: "USA",
		flag: "🇺🇸"
	},
	{
		code: "+44",
		label: "UK",
		flag: "🇬🇧"
	},
	{
		code: "+61",
		label: "Australia",
		flag: "🇦🇺"
	},
	{
		code: "+971",
		label: "UAE",
		flag: "🇦🇪"
	}
];
function getErrorMessage(error, fallback) {
	return error instanceof Error ? error.message : fallback;
}
function LoginPage() {
	const { user, sessionType, authMode, setAuthMode, authStatus, firebaseUser, identityResolution, identityNotice, isResolvingIdentity, login, loginWithEmail, completeEmailLinkSignIn, resolveFirebaseSession, validateReferralCode, logout } = useAuth();
	const navigate = useNavigate();
	const searchParams = useSearch({ from: "/login" });
	const [activeTab, setActiveTab] = (0, import_react.useState)("otp");
	const [countryCode, setCountryCode] = (0, import_react.useState)("+91");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [otpSent, setOtpSent] = (0, import_react.useState)(false);
	const [otpDigits, setOtpDigits] = (0, import_react.useState)([
		"",
		"",
		"",
		"",
		"",
		""
	]);
	const [resendTimer, setResendTimer] = (0, import_react.useState)(30);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [otpError, setOtpError] = (0, import_react.useState)("");
	const phoneConfirmationRef = (0, import_react.useRef)(null);
	const recaptchaVerifierRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		return () => {
			if (recaptchaVerifierRef.current) {
				recaptchaVerifierRef.current.clear();
				recaptchaVerifierRef.current = null;
			}
		};
	}, []);
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [emailError, setEmailError] = (0, import_react.useState)("");
	const [isEmailSubmitting, setIsEmailSubmitting] = (0, import_react.useState)(false);
	const [emailLinkAddress, setEmailLinkAddress] = (0, import_react.useState)("");
	const [emailLinkSentMessage, setEmailLinkSentMessage] = (0, import_react.useState)("");
	const [emailLinkContinueUrl, setEmailLinkContinueUrl] = (0, import_react.useState)("");
	const [emailLinkError, setEmailLinkError] = (0, import_react.useState)("");
	const [isSendingEmailLink, setIsSendingEmailLink] = (0, import_react.useState)(false);
	const [isCompletingEmailLink, setIsCompletingEmailLink] = (0, import_react.useState)(false);
	const [isEmailLinkCallback, setIsEmailLinkCallback] = (0, import_react.useState)(false);
	const [emailLinkCallbackUrl, setEmailLinkCallbackUrl] = (0, import_react.useState)("");
	const [emailLinkNeedsConfirmation, setEmailLinkNeedsConfirmation] = (0, import_react.useState)(false);
	const [confirmationEmailInput, setConfirmationEmailInput] = (0, import_react.useState)("");
	const [emulatorGeneratedLink, setEmulatorGeneratedLink] = (0, import_react.useState)("");
	const hasAttemptedAutoCallbackRef = (0, import_react.useRef)(false);
	const [isReferralOpen, setIsReferralOpen] = (0, import_react.useState)(Boolean(searchParams.ref));
	const [referralCode, setReferralCode] = (0, import_react.useState)(searchParams.ref || "");
	const [referralMessage, setReferralMessage] = (0, import_react.useState)("");
	const [referralApplied, setReferralApplied] = (0, import_react.useState)(false);
	const inputRefs = (0, import_react.useRef)([]);
	const cleanPhoneDigits = phone.replace(/\D/g, "");
	const isPhoneValid = cleanPhoneDigits.length === 10;
	(0, import_react.useEffect)(() => {
		let timer;
		if (otpSent && resendTimer > 0) timer = setInterval(() => {
			setResendTimer((prev) => prev - 1);
		}, 1e3);
		return () => clearInterval(timer);
	}, [otpSent, resendTimer]);
	const navigatePostLogin = () => {
		if (searchParams.redirect) navigate({ to: searchParams.redirect });
		else navigate({ to: "/account" });
	};
	(0, import_react.useEffect)(() => {
		const targetMode = searchParams.authMode;
		if (targetMode === "production" || targetMode === "emulator" || targetMode === "mock") setAuthMode(targetMode);
	}, [searchParams.authMode, setAuthMode]);
	const handleSendOtp = async (e) => {
		if (e) e.preventDefault();
		if (!isPhoneValid) {
			setOtpError("Please enter a valid 10-digit mobile number.");
			return;
		}
		setOtpError("");
		setIsSubmitting(true);
		try {
			const { auth } = authManager.getProductionAdapter().getAuthInstance();
			if (!recaptchaVerifierRef.current) recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "login-recaptcha-container", { size: "invisible" });
			phoneConfirmationRef.current = await signInWithPhoneNumber(auth, `${countryCode}${cleanPhoneDigits}`, recaptchaVerifierRef.current);
			toast.success("Verification code requested from Firebase Auth.");
			setOtpSent(true);
			setResendTimer(30);
			setOtpDigits([
				"",
				"",
				"",
				"",
				"",
				""
			]);
			setTimeout(() => {
				inputRefs.current[0]?.focus();
			}, 100);
		} catch (err) {
			const message = getErrorMessage(err, "Failed to send OTP");
			setOtpError(message);
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleResendOtp = async () => {
		if (resendTimer > 0) return;
		setOtpError("");
		try {
			const { auth } = authManager.getProductionAdapter().getAuthInstance();
			if (recaptchaVerifierRef.current) {
				recaptchaVerifierRef.current.clear();
				recaptchaVerifierRef.current = null;
			}
			recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "login-recaptcha-container", { size: "invisible" });
			phoneConfirmationRef.current = await signInWithPhoneNumber(auth, `${countryCode}${cleanPhoneDigits}`, recaptchaVerifierRef.current);
			toast.success("A new Firebase verification code was requested.");
			setResendTimer(30);
			setOtpDigits([
				"",
				"",
				"",
				"",
				"",
				""
			]);
			inputRefs.current[0]?.focus();
		} catch (err) {
			toast.error(getErrorMessage(err, "Failed to resend OTP"));
		}
	};
	const handleVerifyOtp = async (e) => {
		if (e) e.preventDefault();
		const fullOtp = otpDigits.join("");
		if (fullOtp.length < 6) {
			setOtpError("Please enter the complete 6-digit OTP.");
			return;
		}
		setOtpError("");
		setIsSubmitting(true);
		try {
			if (!phoneConfirmationRef.current) throw new Error("Request a fresh verification code first.");
			const credential = await phoneConfirmationRef.current.confirm(fullOtp);
			if (!credential.user.phoneNumber) throw new Error("Firebase did not return a verified phone number. Sign-in was stopped.");
			const result = await resolveFirebaseSession({
				uid: credential.user.uid,
				email: credential.user.email,
				emailVerified: credential.user.emailVerified,
				phoneNumber: credential.user.phoneNumber,
				providerId: "phone"
			});
			if (result.status === "resolved") {
				toast.success(`Welcome back, ${result.profile.name}!`);
				navigatePostLogin();
			} else setOtpError("Firebase verified your phone, but no linked customer profile was found. No SASS or ONCUS profile was created. Contact support or continue only after the approved registration flow is available.");
		} catch (err) {
			const message = getErrorMessage(err, "Invalid OTP code");
			setOtpError(message);
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleGoogleLogin = async () => {
		setOtpError("");
		setIsSubmitting(true);
		try {
			const identity = await authManager.signInWithGoogle();
			const result = await resolveFirebaseSession(identity);
			if (result.status === "resolved") {
				toast.success(`Welcome back, ${result.profile.name}!`);
				navigatePostLogin();
			} else setOtpError(describeIdentityResolutionState(result)?.userMessage ?? "Google sign-in succeeded, but customer registration could not be completed. No customer profile or identity mapping was created.");
		} catch (err) {
			const message = getErrorMessage(err, "Google sign-in failed.");
			setOtpError(message);
			if (!message.toLowerCase().includes("was cancelled")) toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleEmailLogin = async (e) => {
		e.preventDefault();
		setEmailError("");
		setIsEmailSubmitting(true);
		try {
			const loggedIn = await loginWithEmail(email, password);
			toast.success(`Welcome back, ${loggedIn.name}!`);
			navigatePostLogin();
		} catch (err) {
			const message = getErrorMessage(err, "Invalid email or password");
			setEmailError(message);
			toast.error(message || "Authentication failed");
		} finally {
			setIsEmailSubmitting(false);
		}
	};
	const clearConsumedEmailLinkSearchParams = () => {
		if (typeof window === "undefined" || !window.history?.replaceState) return;
		try {
			const url = new URL(window.location.href);
			const authParams = [
				"mode",
				"oobCode",
				"apiKey",
				"continueUrl",
				"lang",
				"emailLink"
			];
			let modified = false;
			for (const param of authParams) if (url.searchParams.has(param)) {
				url.searchParams.delete(param);
				modified = true;
			}
			if (modified) window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
		} catch {}
	};
	const handleCompleteEmailLink = async (targetLinkUrl, emailOverride) => {
		if (isCompletingEmailLink || isResolvingIdentity || emailLinkAuthService.isCompletingSignIn()) return;
		setEmailLinkError("");
		setIsCompletingEmailLink(true);
		try {
			const resolution = await completeEmailLinkSignIn(targetLinkUrl, emailOverride);
			setEmailLinkNeedsConfirmation(false);
			setIsEmailLinkCallback(false);
			clearConsumedEmailLinkSearchParams();
			if (resolution.status === "resolved") {
				toast.success(`Welcome back, ${resolution.profile.name}!`);
				navigatePostLogin();
			} else if (resolution.status === "unlinked") toast.warning("Email verified, but no linked Sri Amman Smart Store customer account was found.");
			else {
				const notice = describeIdentityResolutionState(resolution);
				toast.error(notice?.title || "Could not load your Sri Amman Smart Store customer profile.");
			}
		} catch (err) {
			if (err instanceof EmailLinkAuthError && err.requiresEmailInput) {
				setEmailLinkNeedsConfirmation(true);
				setEmailLinkError(err.message);
			} else {
				const msg = err instanceof Error ? err.message : "Could not complete email-link sign-in.";
				setEmailLinkError(msg);
				toast.error(msg);
			}
		} finally {
			setIsCompletingEmailLink(false);
		}
	};
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined" || authMode === "production") return;
		const existingAuthUser = emailLinkAuthService.getCurrentFirebaseAuthUser();
		if (existingAuthUser) setActiveTab("email-link");
		const currentHref = window.location.href;
		const inspection = emailLinkAuthService.inspectCallbackUrl(currentHref);
		if (inspection.status === "valid_link") {
			setActiveTab("email-link");
			if (existingAuthUser) {
				clearConsumedEmailLinkSearchParams();
				return;
			}
			setIsEmailLinkCallback(true);
			setEmailLinkCallbackUrl(currentHref);
			const storedPendingEmail = emailLinkAuthService.getPendingEmail();
			if (storedPendingEmail) {
				setConfirmationEmailInput(storedPendingEmail);
				if (!hasAttemptedAutoCallbackRef.current) {
					hasAttemptedAutoCallbackRef.current = true;
					handleCompleteEmailLink(currentHref, storedPendingEmail);
				}
			} else setEmailLinkNeedsConfirmation(true);
		} else if (inspection.status === "invalid_or_incomplete_link") {
			setActiveTab("email-link");
			setIsEmailLinkCallback(false);
			setEmailLinkError(inspection.message || "This sign-in link is invalid, expired, or incomplete. Please request a new email sign-in link.");
		}
	}, [authMode]);
	const handleSendEmailLink = async (e) => {
		e.preventDefault();
		if (isSendingEmailLink || emailLinkAuthService.isSendingLink()) return;
		setEmailLinkError("");
		setEmailLinkSentMessage("");
		setEmulatorGeneratedLink("");
		setIsSendingEmailLink(true);
		try {
			const res = await emailLinkAuthService.sendSignInLink(emailLinkAddress, { ...searchParams.redirect ? { redirect: searchParams.redirect } : {} });
			setEmailLinkSentMessage(res.message);
			setEmailLinkContinueUrl(res.continueUrl);
			toast.success("Sign-in link generated in the local Firebase Auth Emulator.");
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Failed to send email sign-in link.";
			setEmailLinkError(msg);
			toast.error(msg);
		} finally {
			setIsSendingEmailLink(false);
		}
	};
	const handleConfirmEmailForLink = async (e) => {
		e.preventDefault();
		const targetUrl = emailLinkCallbackUrl || emulatorGeneratedLink || (typeof window !== "undefined" ? window.location.href : "");
		await handleCompleteEmailLink(targetUrl, confirmationEmailInput);
	};
	const handleDigitChange = (index, val) => {
		if (val.length > 1) {
			const numeric = val.replace(/\D/g, "").slice(0, 6);
			if (!numeric) return;
			const newArr = [...otpDigits];
			const startIdx = numeric.length === 6 ? 0 : index;
			for (let i = 0; i < numeric.length && startIdx + i < 6; i++) newArr[startIdx + i] = numeric[i] ?? "";
			setOtpDigits(newArr);
			const nextFocus = Math.min(startIdx + numeric.length, 5);
			inputRefs.current[nextFocus]?.focus();
			return;
		}
		const single = val.replace(/\D/g, "");
		const newArr = [...otpDigits];
		newArr[index] = single;
		setOtpDigits(newArr);
		if (single && index < 5) inputRefs.current[index + 1]?.focus();
	};
	const handleDigitPaste = (index, e) => {
		const numeric = (e.clipboardData?.getData("text") ?? "").replace(/\D/g, "").slice(0, 6);
		if (!numeric) {
			e.preventDefault();
			return;
		}
		e.preventDefault();
		const newArr = [...otpDigits];
		const startIdx = numeric.length === 6 ? 0 : index;
		for (let i = 0; i < numeric.length && startIdx + i < 6; i++) newArr[startIdx + i] = numeric[i] ?? "";
		setOtpDigits(newArr);
		const nextFocus = Math.min(startIdx + numeric.length, 5);
		inputRefs.current[nextFocus]?.focus();
	};
	const handleDigitKeyDown = (index, e) => {
		if (e.key === "Backspace") {
			if (otpDigits[index]) {
				e.preventDefault();
				const newArr = [...otpDigits];
				newArr[index] = "";
				setOtpDigits(newArr);
			} else if (index > 0) {
				e.preventDefault();
				const newArr = [...otpDigits];
				newArr[index - 1] = "";
				setOtpDigits(newArr);
				inputRefs.current[index - 1]?.focus();
			}
		} else if (e.key === "ArrowLeft" && index > 0) {
			e.preventDefault();
			inputRefs.current[index - 1]?.focus();
		} else if (e.key === "ArrowRight" && index < 5) {
			e.preventDefault();
			inputRefs.current[index + 1]?.focus();
		} else if (/^\d$/.test(e.key) && otpDigits[index]) {
			e.preventDefault();
			const newArr = [...otpDigits];
			newArr[index] = e.key;
			setOtpDigits(newArr);
			if (index < 5) inputRefs.current[index + 1]?.focus();
		}
	};
	const handleApplyReferral = async (e) => {
		if (e) e.preventDefault();
		if (!referralCode.trim()) return;
		const res = await validateReferralCode(referralCode);
		if (res.valid) {
			setReferralApplied(true);
			setReferralMessage(res.message);
			toast.success(res.message);
		} else {
			setReferralApplied(false);
			setReferralMessage(res.message);
			toast.error(res.message);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-surface text-on-surface antialiased",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-xl rounded-[28px] border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-[0_24px_60px_rgba(17,24,39,0.08)] sm:p-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-7 flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] font-bold uppercase tracking-[0.22em] text-primary",
							children: "Welcome back"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-2 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl",
							children: "Sign in to Sri Amman"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/sign-up",
							search: searchParams.redirect ? { redirect: searchParams.redirect } : void 0,
							className: "whitespace-nowrap rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10",
							children: "Create account"
						})]
					}),
					searchParams.redirect?.startsWith("/checkout") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						role: "status",
						className: "mb-5 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-on-surface-variant",
						children: "Sign in or create an account to continue checkout. The items in your cart are saved and will be ready when you return."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 flex items-center rounded-xl bg-surface-container-low p-1",
						role: "tablist",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							id: "tab-mobile-otp",
							"aria-selected": activeTab === "otp",
							onClick: () => setActiveTab("otp"),
							className: `flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${activeTab === "otp" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"}`,
							children: "Mobile OTP"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							role: "tab",
							id: "tab-email-pwd",
							"aria-selected": activeTab === "email",
							onClick: () => setActiveTab("email"),
							className: `flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${activeTab === "email" ? "bg-surface-container-lowest text-primary shadow-sm" : "text-on-surface-variant"}`,
							children: "Email & Password"
						})]
					}),
					activeTab === "otp" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5",
						children: [
							!otpSent && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									id: "login-recaptcha-container",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "text-xs font-bold text-on-surface",
											htmlFor: "phone-input",
											children: ["Mobile number ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-primary",
												children: "*"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[11px] font-bold text-primary",
											children: "Instant OTP"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-2 py-2 focus-within:ring-2 focus-within:ring-primary",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
											value: countryCode,
											onChange: (e) => setCountryCode(e.target.value),
											className: "bg-transparent pr-2 text-xs font-bold text-on-surface focus:outline-none",
											"aria-label": "Select country code",
											children: COUNTRY_CODES$1.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
												value: c.code,
												children: [
													c.flag,
													" ",
													c.code
												]
											}, c.code))
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "phone-input",
											type: "tel",
											maxLength: 10,
											value: phone,
											onChange: (e) => setPhone(e.target.value),
											placeholder: "Enter 10-digit number",
											className: "w-full bg-transparent px-2 py-1 text-sm font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none"
										})]
									})]
								})]
							}),
							otpError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-xl border border-error/20 bg-error/10 p-3 text-xs font-semibold text-error",
								children: otpError
							}),
							otpSent && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mb-3 flex items-center justify-between text-xs text-on-surface-variant",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Enter 6-digit OTP" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												setOtpSent(false);
												setOtpDigits([
													"",
													"",
													"",
													"",
													"",
													""
												]);
											},
											className: "font-bold text-primary",
											children: "Change number"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-6 gap-2",
										children: otpDigits.map((digit, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											ref: (el) => {
												inputRefs.current[idx] = el;
											},
											type: "text",
											inputMode: "numeric",
											pattern: "[0-9]*",
											autoComplete: idx === 0 ? "one-time-code" : "off",
											maxLength: 1,
											value: digit,
											onChange: (e) => handleDigitChange(idx, e.target.value),
											onKeyDown: (e) => handleDigitKeyDown(idx, e),
											onPaste: (e) => handleDigitPaste(idx, e),
											"aria-label": `OTP Digit ${idx + 1}`,
											className: "h-11 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-center text-lg font-black text-primary focus:outline-none focus:ring-2 focus:ring-primary"
										}, idx))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-3 flex items-center justify-between text-[11px] text-on-surface-variant",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Resend in ", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
											className: "text-primary",
											children: [
												"00:",
												resendTimer < 10 ? `0${resendTimer}` : resendTimer,
												"s"
											]
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: handleResendOtp,
											disabled: resendTimer > 0,
											className: `font-bold ${resendTimer > 0 ? "cursor-not-allowed text-on-surface-variant/60" : "text-primary"}`,
											children: "Resend code"
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-xl border border-outline-variant/15 bg-surface-container-low p-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => void handleGoogleLogin(),
									disabled: isSubmitting,
									className: "w-full rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-3 text-sm font-bold text-on-surface transition-opacity hover:bg-[#619faa] hover:text-[#ffffff]",
									children: "Continue with Google"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-outline-variant/15 bg-surface-container-low p-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setIsReferralOpen((prev) => !prev),
										className: "flex w-full items-center justify-between text-left text-xs font-bold text-on-surface",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Have a referral code?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-primary",
											children: isReferralOpen ? "Hide" : "Add"
										})]
									}),
									isReferralOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
										onSubmit: handleApplyReferral,
										className: "mt-3 flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											value: referralCode,
											onChange: (e) => setReferralCode(e.target.value.toUpperCase()),
											placeholder: "Enter referral code",
											className: "flex-1 rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-xs font-bold uppercase text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "submit",
											className: "rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-on-secondary",
											children: "Apply"
										})]
									}),
									referralMessage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: `mt-2 text-[11px] ${referralApplied ? "text-primary" : "text-error"}`,
										children: referralMessage
									})
								]
							}),
							!otpSent ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: handleSendOtp,
								disabled: isSubmitting || !isPhoneValid,
								className: "w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:bg-primary-container disabled:opacity-50",
								children: isSubmitting ? "Sending OTP..." : "Get OTP Passcode"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: handleVerifyOtp,
								disabled: isSubmitting || otpDigits.join("").length < 6,
								className: "w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:bg-primary-container disabled:opacity-50",
								children: isSubmitting ? "Verifying..." : "Verify & Continue"
							})
						]
					}),
					activeTab === "email" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleEmailLogin,
						className: "space-y-5",
						children: [
							firebaseUser && identityResolution?.status === "unlinked" && identityNotice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-secondary/30 bg-secondary-fixed/25 p-4 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold text-secondary",
									children: identityNotice.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-on-surface",
									children: identityNotice.userMessage
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-xs font-bold text-on-surface",
									htmlFor: "email-input",
									children: ["Email address ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-primary",
										children: "*"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									id: "email-input",
									type: "email",
									required: true,
									value: email,
									onChange: (e) => setEmail(e.target.value),
									placeholder: "Enter your email",
									className: "w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5 text-sm font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-xs font-bold text-on-surface",
									htmlFor: "pwd-input",
									children: ["Password ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-primary",
										children: "*"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "pwd-input",
										type: showPassword ? "text" : "password",
										required: true,
										value: password,
										onChange: (e) => setPassword(e.target.value),
										placeholder: "Enter your password",
										className: "w-full bg-transparent text-sm font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setShowPassword((p) => !p),
										className: "ml-2 text-on-surface-variant",
										children: showPassword ? "Hide" : "Show"
									})]
								})]
							}),
							emailError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-xl border border-error/20 bg-error/10 p-3 text-xs font-semibold text-error",
								children: emailError
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								disabled: isEmailSubmitting || !email || password.length < 6,
								className: "w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:bg-primary-container disabled:opacity-50",
								children: isEmailSubmitting ? "Signing in..." : "Sign in with email"
							})
						]
					}),
					activeTab === "email-link" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-5",
						children: [
							authMode === "production" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm text-on-surface-variant",
								children: "Passwordless email sign-in is currently unavailable in production mode. Please use the email & password tab."
							}),
							!firebaseUser && authMode !== "production" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: handleSendEmailLink,
								className: "space-y-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "text-xs font-bold text-on-surface",
											htmlFor: "email-link-input",
											children: ["Email address ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-primary",
												children: "*"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											id: "email-link-input",
											type: "email",
											required: true,
											value: emailLinkAddress,
											onChange: (e) => setEmailLinkAddress(e.target.value),
											placeholder: "Enter your email",
											className: "w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5 text-sm font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
										})]
									}),
									emailLinkError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "rounded-xl border border-error/20 bg-error/10 p-3 text-xs font-semibold text-error",
										children: emailLinkError
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										disabled: isSendingEmailLink || !emailLinkAddress.trim(),
										className: "w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:bg-primary-container disabled:opacity-50",
										children: isSendingEmailLink ? "Sending sign-in link..." : "Send email sign-in link"
									})
								]
							}),
							(isEmailLinkCallback || emailLinkNeedsConfirmation) && !firebaseUser && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: handleConfirmEmailForLink,
								className: "space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-bold uppercase tracking-[0.18em] text-primary",
										children: "Complete sign-in"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-[11px] text-on-surface-variant",
										children: "Confirm the email used to request this sign-in link."
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "email",
										required: true,
										value: confirmationEmailInput,
										onChange: (e) => setConfirmationEmailInput(e.target.value),
										placeholder: "Enter your email",
										className: "w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5 text-sm font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										disabled: isCompletingEmailLink || !confirmationEmailInput.trim(),
										className: "w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-opacity hover:bg-primary-container disabled:opacity-50",
										children: isCompletingEmailLink ? "Verifying sign-in link..." : "Complete email-link sign-in"
									})
								]
							}),
							emailLinkSentMessage && !firebaseUser && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl border border-secondary/30 bg-secondary-fixed/25 p-4 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-bold text-secondary",
									children: "Link ready"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-on-surface",
									children: emailLinkSentMessage
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-6 text-center text-[11px] text-on-surface-variant",
						children: [
							"By continuing, you agree to the Sri Amman Smart Store",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/policies",
								className: "font-bold text-primary underline-offset-4 hover:underline",
								children: "Terms of Service"
							}),
							" ",
							"&",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/policies",
								className: "font-bold text-primary underline-offset-4 hover:underline",
								children: "Privacy Policy"
							}),
							"."
						]
					})
				]
			})
		})
	});
}
var Route$9 = createFileRoute("/notifications")({
	head: () => ({ meta: [{ title: "Notifications & Store Updates — Sri Amman Smart Store" }, {
		name: "description",
		content: "Live alerts for your harvest deliveries, exclusive seasonal stock arrivals, and coin credits."
	}] }),
	component: NotificationsPage
});
function NotificationsPage() {
	const { user, isLoading: authLoading, isResolvingIdentity } = useAuth();
	const { notifications, unreadCount, isLoading, error, preferences, markAsRead, markAllAsRead, updatePreferences, refreshNotifications } = useNotifications();
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = (0, import_react.useState)("all");
	const [displayLimit, setDisplayLimit] = (0, import_react.useState)(5);
	const [showAlertSettingsModal, setShowAlertSettingsModal] = (0, import_react.useState)(false);
	const [inAppAlerts, setInAppAlerts] = (0, import_react.useState)(preferences.inAppAlerts);
	const [orderUpdates, setOrderUpdates] = (0, import_react.useState)(preferences.orderUpdates);
	const [harvestAlerts, setHarvestAlerts] = (0, import_react.useState)(preferences.harvestAlerts);
	const [coinRewards, setCoinRewards] = (0, import_react.useState)(preferences.coinRewards);
	const [whatsappSmsMock, setWhatsappSmsMock] = (0, import_react.useState)(preferences.whatsappSmsMock);
	const isOrderCategory = (cat) => cat === "orders";
	const isRewardCategory = (cat) => cat === "rewards" || cat === "account";
	const isHarvestCategory = (cat) => cat === "offers" || cat === "harvest";
	const ordersCount = (0, import_react.useMemo)(() => notifications.filter((n) => isOrderCategory(n.category)).length, [notifications]);
	const rewardsCount = (0, import_react.useMemo)(() => notifications.filter((n) => isRewardCategory(n.category)).length, [notifications]);
	const harvestCount = (0, import_react.useMemo)(() => notifications.filter((n) => isHarvestCategory(n.category)).length, [notifications]);
	const filteredNotifications = (0, import_react.useMemo)(() => {
		return notifications.filter((n) => {
			if (activeTab === "orders") return isOrderCategory(n.category);
			if (activeTab === "rewards") return isRewardCategory(n.category);
			if (activeTab === "harvest") return isHarvestCategory(n.category);
			return true;
		});
	}, [notifications, activeTab]);
	const visibleNotifications = (0, import_react.useMemo)(() => {
		return filteredNotifications.slice(0, displayLimit);
	}, [filteredNotifications, displayLimit]);
	const formatTimestamp = (isoString) => {
		try {
			const date = new Date(isoString);
			const diffMs = (/* @__PURE__ */ new Date()).getTime() - date.getTime();
			const diffMins = Math.floor(diffMs / 6e4);
			const diffHours = Math.floor(diffMs / 36e5);
			const diffDays = Math.floor(diffMs / 864e5);
			if (diffMins < 60) return `${Math.max(1, diffMins)} mins ago`;
			if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
			if (diffDays === 1) return `Yesterday, ${date.toLocaleTimeString("en-IN", {
				hour: "numeric",
				minute: "2-digit",
				hour12: true
			})}`;
			return date.toLocaleDateString("en-IN", {
				day: "numeric",
				month: "short",
				year: "numeric"
			});
		} catch {
			return "Recently";
		}
	};
	const navigateToNotificationTarget = (targetUrl, orderId) => {
		if (!targetUrl && orderId) {
			navigate({
				to: "/orders",
				search: { id: orderId }
			});
			return;
		}
		if (!targetUrl) return;
		const [pathname, queryString] = targetUrl.split("?");
		if (queryString) {
			const params = new URLSearchParams(queryString);
			const searchObj = {};
			params.forEach((value, key) => {
				searchObj[key] = value;
			});
			navigate({
				to: pathname,
				search: searchObj
			});
		} else if (pathname === "/orders" && orderId) navigate({
			to: "/orders",
			search: { id: orderId }
		});
		else navigate({ to: pathname });
	};
	const handleNotificationClick = async (notif) => {
		if (!notif.read) try {
			await markAsRead(notif.id);
		} catch {}
		navigateToNotificationTarget(notif.actionUrl, notif.orderId);
	};
	const handleActionClick = async (e, notif, url) => {
		e.stopPropagation();
		if (!notif.read) try {
			await markAsRead(notif.id);
		} catch {}
		navigateToNotificationTarget(url || notif.actionUrl, notif.orderId);
	};
	const handleMarkAllRead = async () => {
		if (unreadCount === 0) return;
		try {
			await markAllAsRead();
			toast.success("All notifications marked as read");
		} catch {
			toast.error("Failed to mark all notifications as read");
		}
	};
	const handleSaveAlertSettings = (e) => {
		e.preventDefault();
		updatePreferences({
			inAppAlerts,
			orderUpdates,
			harvestAlerts,
			coinRewards,
			whatsappSmsMock
		});
		setShowAlertSettingsModal(false);
		toast.success("Alert preferences saved successfully");
	};
	if ((authLoading || isResolvingIdentity) && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-[#f8faf8] font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[800px] mx-auto px-4 py-20 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-9 h-9 border-3 border-[#005f3f] border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-on-surface-variant font-medium",
					children: "Loading notifications..."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	if (!user && !isLoading && !authLoading && !isResolvingIdentity) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-[#f8faf8] font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[800px] mx-auto px-4 py-20 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-20 h-20 rounded-3xl bg-surface-container flex items-center justify-center text-4xl mx-auto mb-5 shadow-inner",
						children: "🔔"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-headline-lg text-2xl font-black text-on-surface mb-2",
						children: "Please Sign In to Access Notifications"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-on-surface-variant max-w-md mx-auto mb-8 leading-relaxed",
						children: "Sign in with your mobile number to view real-time delivery dispatches, fresh oil batch harvest alerts, and Amman reward coin credits."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/login",
						search: { redirect: "/notifications" },
						className: "inline-flex items-center gap-2 bg-[#005f3f] text-white px-7 py-3.5 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-[#004d32] transition-all cursor-pointer",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined text-[18px]",
							children: "lock_open"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sign In with Phone OTP" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-[#f8faf8] font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] min-h-[calc(100vh-172px)] pb-24",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "flex items-center gap-2 text-xs text-on-surface-variant mb-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									className: "hover:text-primary transition-colors",
									children: "Home"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-outline-variant/60",
									children: "/"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/account",
									className: "hover:text-primary transition-colors",
									children: "My Account"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-outline-variant/60",
									children: "/"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-on-surface",
									children: "Notifications Center"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-bold text-emerald-800 mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "material-symbols-outlined text-[13px]",
								children: "shield"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "PERSONAL UPDATES VAULT" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-headline-lg text-2xl sm:text-3xl font-black text-on-surface",
									children: "Notifications & Store Updates"
								}), unreadCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "bg-rose-100 text-rose-800 text-xs font-black px-2.5 py-0.5 rounded-full",
									children: [unreadCount, " Unread"]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-on-surface-variant mt-1",
								children: "Live alerts for your harvest deliveries, exclusive seasonal stock arrivals, and coin credits."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									"data-testid": "mark-all-read-btn",
									onClick: handleMarkAllRead,
									disabled: unreadCount === 0,
									className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-outline-variant/25 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[16px] text-emerald-700",
										children: "done_all"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Mark All as Read" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setShowAlertSettingsModal(true),
									className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-outline-variant/25 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer shadow-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[16px]",
										children: "tune"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Alert Settings" })]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mb-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										setActiveTab("all");
										setDisplayLimit(5);
									},
									className: `inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${activeTab === "all" ? "bg-[#005f3f] text-white shadow-xs" : "bg-white border border-outline-variant/25 text-on-surface hover:bg-surface-container-low"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "All Notifications" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `text-[11px] px-1.5 py-0.2 rounded-full font-black ${activeTab === "all" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"}`,
										children: notifications.length
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										setActiveTab("orders");
										setDisplayLimit(5);
									},
									className: `inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${activeTab === "orders" ? "bg-[#005f3f] text-white shadow-xs" : "bg-white border border-outline-variant/25 text-on-surface hover:bg-surface-container-low"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[16px]",
											children: "local_shipping"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Orders & Delivery" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-[11px] px-1.5 py-0.2 rounded-full font-black ${activeTab === "orders" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"}`,
											children: ordersCount
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										setActiveTab("rewards");
										setDisplayLimit(5);
									},
									className: `inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${activeTab === "rewards" ? "bg-[#005f3f] text-white shadow-xs" : "bg-white border border-outline-variant/25 text-on-surface hover:bg-surface-container-low"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[16px]",
											children: "workspace_premium"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Smart Coins & VIP" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-[11px] px-1.5 py-0.2 rounded-full font-black ${activeTab === "rewards" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"}`,
											children: rewardsCount
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										setActiveTab("harvest");
										setDisplayLimit(5);
									},
									className: `inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${activeTab === "harvest" ? "bg-[#005f3f] text-white shadow-xs" : "bg-white border border-outline-variant/25 text-on-surface hover:bg-surface-container-low"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[16px]",
											children: "spa"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Harvest & Stock Alerts" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-[11px] px-1.5 py-0.2 rounded-full font-black ${activeTab === "harvest" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface-variant"}`,
											children: harvestCount
										})
									]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 lg:grid-cols-12 gap-8 items-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-8 space-y-4",
								children: [
									error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										role: "alert",
										"data-testid": "notifications-error-banner",
										className: "bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-900",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-red-600",
												children: "error"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-bold",
												children: "Failed to load notifications"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-red-700",
												children: error
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => refreshNotifications(),
											className: "bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors self-start sm:self-auto cursor-pointer",
											children: "Retry"
										})]
									}),
									isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "py-20 text-center bg-white rounded-3xl border border-outline-variant/20",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-8 h-8 border-3 border-[#005f3f] border-t-transparent rounded-full animate-spin mx-auto mb-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-on-surface-variant font-medium",
											children: "Loading notifications..."
										})]
									}) : visibleNotifications.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										"data-testid": "empty-notifications-view",
										className: "p-12 text-center bg-white rounded-3xl border border-outline-variant/20 shadow-xs",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-16 h-16 rounded-full bg-emerald-50 text-[#005f3f] flex items-center justify-center text-3xl mx-auto mb-3",
												children: "🔔"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-headline-lg text-base font-black text-on-surface mb-1",
												children: "No Notifications in this Category"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-on-surface-variant max-w-sm mx-auto mb-4 leading-relaxed",
												children: [
													"You have caught up with all updates for ",
													activeTab === "all" ? "your account" : activeTab,
													"."
												]
											}),
											activeTab !== "all" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setActiveTab("all"),
												className: "px-4 py-2 rounded-xl bg-[#005f3f] text-white text-xs font-bold shadow-xs hover:bg-[#004d32] transition-colors cursor-pointer",
												children: "View All Notifications"
											})
										]
									}) : visibleNotifications.map((notif) => {
										const isOrder = isOrderCategory(notif.category);
										notif.category;
										const isHarvest = isHarvestCategory(notif.category);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											onClick: () => handleNotificationClick(notif),
											className: `relative bg-white rounded-3xl p-5 sm:p-6 border transition-all cursor-pointer hover:shadow-sm ${notif.read ? "border-outline-variant/20 opacity-90" : "border-[#005f3f]/30 shadow-xs ring-1 ring-[#005f3f]/10"}`,
											children: [!notif.read && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-6 left-3 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: `w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${isOrder ? "bg-emerald-50 text-[#005f3f]" : isHarvest ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-800"}`,
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[22px]",
														children: isOrder ? notif.badge?.includes("DELIVERED") ? "check_circle" : "electric_moped" : isHarvest ? "spa" : notif.badge?.includes("VIP") ? "workspace_premium" : "monetization_on"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex-1 min-w-0",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center justify-between gap-2 flex-wrap mb-1.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: `text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${isOrder ? notif.badge?.includes("DELIVERED") ? "bg-blue-50 text-blue-800 border border-blue-200/60" : "bg-emerald-50 text-[#005f3f] border border-emerald-200/60" : isHarvest ? "bg-emerald-50 text-emerald-800 border border-emerald-200/60" : "bg-amber-50 text-amber-900 border border-amber-200/60"}`,
																children: ["• ", notif.badge || (isOrder ? "ORDER UPDATE" : isHarvest ? "HARVEST ALERT" : "REWARD UPDATE")]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-1 text-[11px] text-on-surface-variant font-medium",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "material-symbols-outlined text-[13px]",
																	children: "schedule"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatTimestamp(notif.timestamp) })]
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
															className: "font-headline-sm text-sm font-black text-on-surface leading-snug",
															children: notif.title
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-on-surface-variant mt-1 leading-relaxed",
															children: notif.message
														}),
														notif.driverName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "mt-3 p-3 bg-surface-container-low/70 border border-outline-variant/15 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-2.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																	className: "w-8 h-8 rounded-full bg-[#005f3f] text-white text-xs font-black flex items-center justify-center shrink-0",
																	children: "MK"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "min-w-0",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																		className: "text-xs font-black text-on-surface truncate",
																		children: notif.driverName
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																		className: "text-[10px] text-on-surface-variant",
																		children: [
																			"Vehicle: ",
																			notif.driverVehicle || "TVS iQube EV",
																			" • Speed: 24 km/h"
																		]
																	})]
																})]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																type: "button",
																onClick: (e) => handleActionClick(e, notif, notif.actionUrl),
																className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#005f3f] hover:bg-[#004d32] text-white text-xs font-black shadow-xs transition-all self-start sm:self-auto cursor-pointer",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Track Live Order" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "material-symbols-outlined text-[14px]",
																	children: "arrow_forward"
																})]
															})]
														}),
														notif.highlightNote && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "mt-2.5 flex items-center gap-3 text-[11px] text-on-surface-variant flex-wrap",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md",
																children: notif.highlightNote
															})
														}),
														!notif.driverName && (notif.ctaText || notif.actionUrl) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "mt-3 flex items-center gap-3 flex-wrap",
															children: [notif.ctaText && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																type: "button",
																onClick: (e) => handleActionClick(e, notif, notif.actionUrl),
																className: `inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs ${isOrder ? "bg-[#005f3f] text-white hover:bg-[#004d32]" : isHarvest ? "bg-[#8b4513] text-white hover:bg-[#6d340c]" : "bg-white border border-amber-300 text-amber-900 hover:bg-amber-50"}`,
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: notif.ctaText }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "material-symbols-outlined text-[14px]",
																	children: isOrder ? "receipt" : "arrow_forward"
																})]
															}), notif.secondaryCtaText && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
																type: "button",
																onClick: (e) => handleActionClick(e, notif, notif.secondaryActionUrl || notif.actionUrl),
																className: "inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-outline-variant/30 text-xs font-bold text-on-surface hover:bg-surface-container-low transition-colors cursor-pointer",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: notif.secondaryCtaText })
															})]
														})
													]
												})]
											})]
										}, notif.id);
									}),
									filteredNotifications.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pt-4 pb-2 text-center",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-on-surface-variant mb-2 font-medium",
											children: [
												"Showing ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-bold text-on-surface",
													children: visibleNotifications.length
												}),
												" of",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-bold text-on-surface",
													children: filteredNotifications.length
												}),
												" notifications"
											]
										}), displayLimit < filteredNotifications.length && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => setDisplayLimit((prev) => prev + 5),
											className: "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-white border border-outline-variant/25 text-xs font-black text-[#005f3f] hover:bg-emerald-50 transition-colors shadow-xs cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Load More Notifications" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "expand_more"
											})]
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-4 space-y-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-white rounded-3xl p-6 border border-outline-variant/20 shadow-xs space-y-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[#005f3f] text-[20px]",
													children: "podcasts"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "font-headline-sm text-sm font-black text-on-surface",
													children: "Alert Channels"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3.5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/15 flex items-start justify-between gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-xs font-bold text-on-surface",
														children: "Instant WhatsApp & SMS"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-[11px] text-on-surface-variant mt-0.5 leading-snug",
														children: ["Live driver GPS links & OTP pings to ", user?.phone || "+91 98400 12345"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "mt-1.5 inline-block text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/50",
														children: "Simulated Channel"
													})
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: preferences.whatsappSmsMock,
													onChange: (e) => {
														updatePreferences({ whatsappSmsMock: e.target.checked });
														toast.info(`WhatsApp & SMS alerts ${e.target.checked ? "enabled" : "muted"}`);
													},
													className: "mt-1 rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3.5 rounded-2xl bg-surface-container-low/70 border border-outline-variant/15 flex items-start justify-between gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-xs font-bold text-on-surface",
													children: "Fresh Harvest Influx"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-[11px] text-on-surface-variant mt-0.5 leading-snug",
													children: "Alerts when wood-pressed oil & organic farm veggies arrive"
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: preferences.harvestAlerts,
													onChange: (e) => {
														updatePreferences({ harvestAlerts: e.target.checked });
														toast.info(`Harvest batch notifications ${e.target.checked ? "enabled" : "muted"}`);
													},
													className: "mt-1 rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/50",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-1.5 text-xs font-bold text-emerald-950 mb-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[16px] text-emerald-800",
															children: "bedtime"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delivery Quiet Hours" })]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11px] text-emerald-900 leading-relaxed mb-2",
														children: "Strictly no promo sounds or ring calls during 10:00 PM - 6:30 AM."
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-block text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded",
														children: "ENFORCED STORE POLICY"
													})
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-gradient-to-br from-[#fffdf8] to-[#fff8ea] rounded-3xl p-6 border border-amber-200/60 shadow-xs relative overflow-hidden",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[11px] font-black tracking-wider text-amber-900 uppercase",
													children: "MY COIN STASH"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-xs font-black text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-lg",
													children: [
														"= ₹",
														convertCoinsToRupees((user?.smartCoins ?? user?.coins) || 0).toFixed(2),
														" Value"
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3 my-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-3xl",
													children: "🪙"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "font-headline-lg text-2xl font-black text-on-surface",
													children: [(user?.smartCoins ?? user?.coins) || 0, " Smart Coins"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-[11px] text-on-surface-variant font-medium",
													children: "1 Coin = ₹0.05 cash discount"
												})] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-on-surface-variant mt-3 leading-relaxed",
												children: "Earn 1 Coin for every ₹10 spent on Organic Vegetables, Mara Chekku Oils & Spices."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "mt-4 pt-3 border-t border-amber-200/50",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
													to: "/rewards",
													className: "inline-flex items-center gap-1 text-xs font-black text-[#005f3f] hover:underline",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Redeem at Checkout" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[14px]",
														children: "chevron_right"
													})]
												})
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-white rounded-3xl p-6 border border-outline-variant/20 shadow-xs space-y-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-10 h-10 rounded-2xl bg-emerald-50 text-[#005f3f] flex items-center justify-center shrink-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[20px]",
														children: "storefront"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "font-headline-sm text-xs font-black text-on-surface",
													children: "Need Help with an Alert?"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[11px] text-on-surface-variant",
													children: "Gobichettipalayam Flagship Store Desk"
												})] })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-on-surface-variant leading-relaxed",
												children: "Connect directly with Store Supervisor Saravanan regarding fresh batch delivery times or PIN verifications."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2 pt-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
													href: "tel:+919840012345",
													className: "w-full py-2.5 rounded-xl bg-[#005f3f] hover:bg-[#004d32] text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[16px]",
														children: "call"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Call +91 98400 12345" })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: () => {
														toast.info("WhatsApp support desk connected (+91 98400 12345)");
													},
													className: "w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#005f3f] font-black text-xs flex items-center justify-center gap-2 border border-emerald-200/60 transition-colors cursor-pointer",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[16px]",
														children: "chat"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Chat on WhatsApp" })]
												})]
											})
										]
									})
								]
							})]
						})
					]
				})
			}),
			showAlertSettingsModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-150",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[#005f3f] text-[22px]",
									children: "tune"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-headline-lg text-lg font-black text-on-surface",
									children: "Notification Alert Settings"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setShowAlertSettingsModal(false),
								className: "w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface cursor-pointer",
								children: "✕"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-on-surface-variant mb-4 leading-relaxed",
							children: "Configure which store alerts and delivery notifications appear in your personal vault."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleSaveAlertSettings,
							className: "space-y-3.5 text-xs",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-bold text-on-surface",
										children: "In-App Vault Notifications"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-on-surface-variant",
										children: "Live dispatches, pins, and credits"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: inAppAlerts,
										onChange: (e) => setInAppAlerts(e.target.checked),
										className: "rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-bold text-on-surface",
										children: "Order & Dispatch Updates"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-on-surface-variant",
										children: "Real-time milestones from farm hub"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: orderUpdates,
										onChange: (e) => setOrderUpdates(e.target.checked),
										className: "rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-bold text-on-surface",
										children: "Fresh Wood-Pressed Harvest Alerts"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-on-surface-variant",
										children: "Early batch notices before stock clears"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: harvestAlerts,
										onChange: (e) => setHarvestAlerts(e.target.checked),
										className: "rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-bold text-on-surface",
										children: "Smart Coins & VIP Perks"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-on-surface-variant",
										children: "Passbook credits and reward multipliers"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: coinRewards,
										onChange: (e) => setCoinRewards(e.target.checked),
										className: "rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between p-3 rounded-2xl bg-surface-container-low border border-outline-variant/15",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-bold text-on-surface",
										children: "WhatsApp & SMS Gateway"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-on-surface-variant",
										children: "Simulated demonstration mode"
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: whatsappSmsMock,
										onChange: (e) => setWhatsappSmsMock(e.target.checked),
										className: "rounded text-[#005f3f] focus:ring-[#005f3f] cursor-pointer"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-2 flex gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setShowAlertSettingsModal(false),
										className: "flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface cursor-pointer",
										children: "Cancel"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										className: "flex-1 py-2.5 rounded-xl font-bold bg-[#005f3f] text-white shadow-md hover:bg-[#004d32] transition-colors cursor-pointer",
										children: "Save Settings"
									})]
								})
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
var ORDER_STAGES = [
	{
		key: "placed",
		label: "Order Placed",
		fields: [
			"createdAt",
			"timestamp",
			"orderDate"
		]
	},
	{
		key: "confirmed",
		label: "Order Confirmed",
		fields: ["confirmedAt", "orderConfirmedAt"]
	},
	{
		key: "processing",
		label: "Processing / Packed",
		fields: [
			"processingAt",
			"packedAt",
			"preparedAt"
		]
	},
	{
		key: "dispatched",
		label: "Dispatched",
		fields: [
			"dispatchedAt",
			"dispatchAt",
			"shippedAt"
		]
	},
	{
		key: "out_for_delivery",
		label: "Out for Delivery",
		fields: ["outForDeliveryAt", "out_for_delivery_at"]
	},
	{
		key: "delivered",
		label: "Delivered",
		fields: ["deliveredAt", "deliveryTime"]
	}
];
var ACTIVE_STATUSES = [
	"pending",
	"processing",
	"packed",
	"in transit"
];
var Route$8 = createFileRoute("/orders")({
	validateSearch: (search) => ({
		placed: typeof search["placed"] === "string" ? search["placed"] : void 0,
		id: typeof search["id"] === "string" ? search["id"] : void 0
	}),
	head: () => ({ meta: [{ title: "My Orders — Sri Amman Smart Store" }, {
		name: "description",
		content: "View your orders, order details, and delivery progress."
	}] }),
	component: OrdersPage
});
function formatDate(value, withTime = false) {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	if (date.toISOString() === "1970-01-01T00:00:00.000Z") return null;
	return date.toLocaleString("en-IN", {
		day: "numeric",
		month: "short",
		year: "numeric",
		...withTime ? {
			hour: "2-digit",
			minute: "2-digit"
		} : {}
	});
}
function rawOrder(order) {
	return order.rawOrder && typeof order.rawOrder === "object" ? order.rawOrder : {};
}
function timestampValue(value) {
	let date;
	if (typeof value === "object" && value !== null) {
		const timestamp = value;
		if (typeof timestamp.toDate === "function") date = timestamp.toDate();
		else {
			const seconds = typeof timestamp.seconds === "number" ? timestamp.seconds : timestamp._seconds;
			if (typeof seconds !== "number") return void 0;
			date = /* @__PURE__ */ new Date(seconds * 1e3);
		}
	} else if (typeof value === "string" || typeof value === "number") date = new Date(value);
	else return;
	if (Number.isNaN(date.getTime())) return void 0;
	const isoDate = date.toISOString();
	return isoDate === "1970-01-01T00:00:00.000Z" ? void 0 : isoDate;
}
function readStageTimestamp(order, stageIndex) {
	const raw = rawOrder(order);
	if (stageIndex === 0) {
		const placedAt = timestampValue(order.createdAt) || timestampValue(raw["timestamp"] || raw["orderDate"] || raw["date"]);
		if (placedAt) return placedAt;
	}
	if (stageIndex === 5) {
		const deliveredAt = timestampValue(order.deliveredAt) || timestampValue(raw["deliveredAt"] || raw["deliveryTime"]);
		if (deliveredAt) return deliveredAt;
	}
	for (const field of ORDER_STAGES[stageIndex]?.fields || []) {
		const timestamp = timestampValue(raw[field]);
		if (timestamp) return timestamp;
	}
	const history = raw["statusHistory"] || raw["timeline"];
	if (Array.isArray(history)) for (const entry of history) {
		if (!entry || typeof entry !== "object") continue;
		const item = entry;
		const status = String(item["status"] || item["stage"] || "").toLowerCase().replace(/[_-]+/g, " ");
		if ((status.includes("confirm") ? 1 : status.includes("process") || status.includes("pack") || status.includes("prepar") ? 2 : status.includes("dispatch") || status.includes("ship") ? 3 : status.includes("out for delivery") ? 4 : status.includes("deliver") || status === "completed" ? 5 : -1) === stageIndex) {
			const found = timestampValue(item["timestamp"] || item["createdAt"] || item["date"] || item["at"]);
			if (found) return found;
		}
	}
}
function isFailedOrder(order) {
	const status = `${order.rawStatus || ""} ${String(rawOrder(order)["status"] || "")}`.toLowerCase();
	return status.includes("fail") || status.includes("reject");
}
function isRefundedOrder(order) {
	return `${order.rawStatus || ""} ${String(rawOrder(order)["status"] || "")}`.toLowerCase().includes("refund");
}
function getDisplayStatus(order) {
	if (isFailedOrder(order)) return "Failed";
	if (isRefundedOrder(order)) return "Refunded";
	if (order.status === "in transit" && order.rawStatus?.toLowerCase().includes("out for delivery")) return "Out for Delivery";
	return order.status.replace(/\b\w/g, (character) => character.toUpperCase());
}
function buildOrderTimeline(order) {
	const rawStatus = String(order.rawStatus || rawOrder(order)["status"] || "").toLowerCase().replace(/[_-]+/g, " ");
	const failed = isFailedOrder(order);
	const refunded = isRefundedOrder(order);
	const exceptional = failed || order.status === "cancelled" || order.status === "returned";
	let currentIndex = 0;
	if (order.status === "pending") currentIndex = rawStatus.includes("confirm") ? 1 : 0;
	if (order.status === "processing") currentIndex = 2;
	if (order.status === "packed") currentIndex = 2;
	if (order.status === "in transit") currentIndex = rawStatus.includes("out for delivery") ? 4 : 3;
	if (order.status === "delivered") currentIndex = 5;
	if (order.status === "returned" && !refunded) currentIndex = 5;
	const history = rawOrder(order)["statusHistory"] || rawOrder(order)["timeline"];
	if (exceptional && Array.isArray(history)) for (const entry of history) {
		if (!entry || typeof entry !== "object") continue;
		const status = String(entry["status"] || entry["stage"] || "").toLowerCase().replace(/[_-]+/g, " ");
		const reached = status.includes("confirm") ? 1 : status.includes("process") || status.includes("pack") ? 2 : status.includes("dispatch") || status.includes("ship") ? 3 : status.includes("out for delivery") ? 4 : status.includes("deliver") ? 5 : -1;
		currentIndex = Math.max(currentIndex, reached);
	}
	const entries = ORDER_STAGES.map((stage, index) => {
		let state;
		if (exceptional) state = index === 0 || index <= currentIndex ? "completed" : "pending";
		else if (order.status === "delivered") state = "completed";
		else if (index < currentIndex) state = "completed";
		else if (index === currentIndex) state = "current";
		else state = "pending";
		return {
			key: stage.key,
			label: stage.label,
			state,
			...readStageTimestamp(order, index) ? { timestamp: readStageTimestamp(order, index) } : {}
		};
	});
	if (exceptional) {
		const terminalLabel = failed ? "Failed" : refunded ? "Refunded" : order.status === "returned" ? "Returned" : "Cancelled";
		const terminalTimestamp = timestampValue(rawOrder(order)[failed ? "failedAt" : refunded ? "refundedAt" : order.status === "returned" ? "returnedAt" : "cancelledAt"]) || timestampValue(order.cancelledAt);
		entries.push({
			key: "terminal",
			label: terminalLabel,
			state: "current",
			...terminalTimestamp ? { timestamp: terminalTimestamp } : {}
		});
	}
	return entries;
}
function statusClasses(order) {
	if (order.status === "delivered") return "bg-emerald-100 text-emerald-800";
	if (order.status === "cancelled" || order.status === "returned") return "bg-rose-100 text-rose-800";
	if (order.status === "in transit") return "bg-blue-100 text-blue-800";
	return "bg-amber-100 text-amber-900";
}
function canRequestReturn(order) {
	if (order.status !== "delivered" || !order.deliveredAt) return false;
	const deliveredAt = new Date(order.deliveredAt).getTime();
	const elapsed = Date.now() - deliveredAt;
	return !Number.isNaN(deliveredAt) && elapsed >= 0 && elapsed <= 864e5;
}
function money(value) {
	return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
function OrdersPage() {
	const search = useSearch({ from: "/orders" });
	const navigate = useNavigate();
	const { user, isLoading: authLoading, isResolvingIdentity, refreshUser } = useAuth();
	const { refreshCart } = useCart();
	const { refreshNotifications } = useNotifications();
	const [orders, setOrders] = (0, import_react.useState)([]);
	const [ordersError, setOrdersError] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [activeFilter, setActiveFilter] = (0, import_react.useState)("all");
	const [showHelpModal, setShowHelpModal] = (0, import_react.useState)(false);
	const [helpCategory, setHelpCategory] = (0, import_react.useState)("Delivery Query");
	const [helpMessage, setHelpMessage] = (0, import_react.useState)("");
	const [isSubmittingHelp, setIsSubmittingHelp] = (0, import_react.useState)(false);
	const [reviewOrder, setReviewOrder] = (0, import_react.useState)(null);
	const [reviewRating, setReviewRating] = (0, import_react.useState)(5);
	const [reviewComment, setReviewComment] = (0, import_react.useState)("");
	const [isSubmittingReview, setIsSubmittingReview] = (0, import_react.useState)(false);
	const [isReordering, setIsReordering] = (0, import_react.useState)(false);
	const loadOrders = (0, import_react.useCallback)(async () => {
		if (!user) {
			setOrders([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		setOrdersError(null);
		try {
			const loadedOrders = await orderService.getOrders(user.id, user.legacySassId);
			setOrders(loadedOrders || []);
		} catch (error) {
			console.error("Failed to load orders:", error);
			setOrdersError(error instanceof Error ? error.message : "Failed to load orders. Please retry.");
			setOrders([]);
		} finally {
			setLoading(false);
		}
	}, [user]);
	(0, import_react.useEffect)(() => {
		if (user) loadOrders();
		else if (!authLoading && !isResolvingIdentity) setLoading(false);
	}, [
		user,
		authLoading,
		isResolvingIdentity,
		loadOrders
	]);
	const activeOrdersCount = (0, import_react.useMemo)(() => orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length, [orders]);
	const deliveredOrdersCount = (0, import_react.useMemo)(() => orders.filter((order) => order.status === "delivered").length, [orders]);
	const cancelledOrdersCount = (0, import_react.useMemo)(() => orders.filter((order) => order.status === "cancelled" || order.status === "returned").length, [orders]);
	const selectedOrderId = search.id || "";
	const selectedOrder = (0, import_react.useMemo)(() => selectedOrderId ? orders.find((order) => order.orderId === selectedOrderId) || null : null, [orders, selectedOrderId]);
	const filteredOrders = (0, import_react.useMemo)(() => orders.filter((order) => {
		if (activeFilter === "active") return ACTIVE_STATUSES.includes(order.status);
		if (activeFilter === "delivered") return order.status === "delivered";
		if (activeFilter === "cancelled") return order.status === "cancelled" || order.status === "returned";
		return true;
	}), [orders, activeFilter]);
	const openOrder = (orderId) => {
		navigate({
			to: "/orders",
			search: { id: orderId }
		});
	};
	const backToOrders = () => {
		navigate({
			to: "/orders",
			search: {}
		});
	};
	const handleCancelOrder = async (order) => {
		if (!window.confirm(`Cancel order #${order.orderId}?`)) return;
		try {
			await orderService.cancelOrder(order.orderId, user?.id);
			await refreshUser();
			await refreshNotifications();
			toast.success(`Order #${order.orderId} cancelled`);
			await loadOrders();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not cancel this order");
		}
	};
	const handleReturnRequest = async (order) => {
		try {
			await orderService.requestReturn(order.orderId, user?.id);
			toast.success(`Return request for order #${order.orderId} submitted`);
			await loadOrders();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not request a return");
		}
	};
	const handleReorder = async (order) => {
		if (!user) return;
		setIsReordering(true);
		try {
			const result = await orderService.reorder(order, user.id);
			await refreshCart();
			if (result.addedCount > 0) {
				toast.success(`Added ${result.addedCount} item${result.addedCount === 1 ? "" : "s"} to your cart${result.unavailableCount ? `; ${result.unavailableCount} unavailable` : ""}.`);
				navigate({ to: "/cart" });
			} else toast.error("None of the products in this order are currently available.");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not reorder this order");
		} finally {
			setIsReordering(false);
		}
	};
	const handleDownloadInvoice = (order) => {
		const printWindow = window.open("", "_blank");
		if (!printWindow) {
			toast.error("Allow pop-ups to print or save this invoice.");
			return;
		}
		const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
			"&": "&amp;",
			"<": "&lt;",
			">": "&gt;",
			"\"": "&quot;",
			"'": "&#39;"
		})[character] || character);
		printWindow.document.write(`<!doctype html><html><head><title>Order ${escapeHtml(order.orderId)} invoice</title><style>body{font:14px Arial,sans-serif;max-width:800px;margin:32px auto;color:#17211c}h1{color:#005f3f}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{padding:10px;border-bottom:1px solid #ddd;text-align:left}.right{text-align:right}.muted{color:#68736d}.total{font-size:18px;font-weight:bold;color:#005f3f}</style></head><body><h1>Sri Amman Smart Store</h1><h2>Order invoice — ${escapeHtml(order.orderId)}</h2><p class="muted">${escapeHtml(formatDate(order.createdAt, true) || "")}</p><p>${escapeHtml(order.customerName)} · ${escapeHtml(order.phone)}</p><p>${escapeHtml(order.deliveryAddress.houseNo)} ${escapeHtml(order.deliveryAddress.street)}, ${escapeHtml(order.deliveryAddress.city)} ${escapeHtml(order.deliveryAddress.pincode)}</p><p>Payment: ${escapeHtml(order.payment.method)} (${escapeHtml(order.payment.status)})</p><table><thead><tr><th>Item</th><th>Variant</th><th>Qty</th><th class="right">Unit</th><th class="right">Subtotal</th></tr></thead><tbody>${order.items.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(`${item.unitSize} ${item.unit}`.trim())}</td><td>${item.quantity}</td><td class="right">${money(item.price)}</td><td class="right">${money(item.price * item.quantity)}</td></tr>`).join("")}</tbody></table><p>Item subtotal: ${money(order.pricingSummary.subtotal)}</p>${order.pricingSummary.productSavings ? `<p>Product savings: −${money(order.pricingSummary.productSavings)}</p>` : ""}${order.pricingSummary.couponDiscount ? `<p>Coupon discount: −${money(order.pricingSummary.couponDiscount)}</p>` : ""}${order.pricingSummary.coinDiscount ? `<p>Coin discount: −${money(order.pricingSummary.coinDiscount)}</p>` : ""}<p>Delivery fee: ${money(order.pricingSummary.deliveryFee)}</p><p class="total">Order total: ${money(order.pricingSummary.totalAmount)}</p><script>window.onload=()=>window.print()<\/script></body></html>`);
		printWindow.document.close();
	};
	const handleSubmitHelp = async (event) => {
		event.preventDefault();
		if (!user || !selectedOrder || !helpMessage.trim()) return;
		setIsSubmittingHelp(true);
		try {
			await supportService.submitReportedProblem({
				userId: user.id,
				category: helpCategory,
				orderId: selectedOrder.orderId,
				message: helpMessage.trim()
			});
			toast.success(`Support request for order #${selectedOrder.orderId} submitted`);
			setHelpMessage("");
			setShowHelpModal(false);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not submit your request");
		} finally {
			setIsSubmittingHelp(false);
		}
	};
	const handleSubmitReview = async (event) => {
		event.preventDefault();
		if (!user || !reviewOrder) return;
		setIsSubmittingReview(true);
		try {
			await supportService.submitReportedProblem({
				userId: user.id,
				category: "Order Review",
				orderId: reviewOrder.orderId,
				message: `Customer Rating: ${reviewRating} Stars. Feedback: ${reviewComment.trim() || "No written feedback."}`
			});
			toast.success("Thank you for your order feedback.");
			setReviewComment("");
			setReviewOrder(null);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not submit your review");
		} finally {
			setIsSubmittingReview(false);
		}
	};
	if ((authLoading || isResolvingIdentity) && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingState, { label: "Restoring your session…" }) });
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageShell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-3xl px-4 py-20 pt-[172px] text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-black text-on-surface",
				children: "Please sign in to view your orders"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-3 max-w-lg text-sm text-on-surface-variant",
				children: "Sign in to view order details and delivery progress."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/login",
				search: { redirect: "/orders" },
				className: "mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white",
				children: "Sign In"
			})
		]
	}) });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PageShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "min-h-[calc(100vh-172px)] bg-surface pb-24 pt-[172px]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					"aria-label": "Breadcrumb",
					className: "mb-5 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/",
							className: "hover:text-primary",
							children: "Home"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/account",
							className: "hover:text-primary",
							children: "My Account"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "/" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-bold text-on-surface",
							children: "My Orders"
						})
					]
				}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingState, { label: "Loading your orders…" }) : ordersError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					"data-testid": "orders-error-banner",
					role: "alert",
					className: "mx-auto max-w-xl rounded-3xl border border-red-200 bg-white p-8 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-xl font-black text-on-surface",
							children: "Unable to load your orders"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-on-surface-variant",
							children: ordersError
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => void loadOrders(),
							className: "mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white",
							children: "Retry"
						})
					]
				}) : selectedOrderId && !selectedOrder ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					"data-testid": "order-not-found",
					className: "mx-auto max-w-xl rounded-3xl border border-outline-variant/20 bg-white p-8 text-center shadow-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-2xl font-black text-on-surface",
							children: "Order not found"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-on-surface-variant",
							children: "This order may not exist or may not belong to your account."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: backToOrders,
							className: "mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white",
							children: "Back to Orders"
						})
					]
				}) : selectedOrder ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderDetails, {
					order: selectedOrder,
					onBack: backToOrders,
					onInvoice: () => handleDownloadInvoice(selectedOrder),
					onHelp: () => setShowHelpModal(true),
					onCancel: () => void handleCancelOrder(selectedOrder),
					onReturn: () => void handleReturnRequest(selectedOrder),
					onReorder: () => void handleReorder(selectedOrder),
					onReview: () => setReviewOrder(selectedOrder),
					isReordering
				}) : orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					"data-testid": "empty-orders-view",
					className: "mx-auto max-w-xl rounded-3xl border border-outline-variant/20 bg-white p-10 text-center shadow-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "material-symbols-outlined text-3xl",
								children: "shopping_bag"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "mt-4 text-2xl font-black text-on-surface",
							children: "My Orders"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-on-surface-variant",
							children: "You have not placed an order yet."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/shop",
							className: "mt-6 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white",
							children: "Browse Products"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					"data-testid": "orders-list-view",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-3xl font-black text-on-surface",
								children: "My Orders"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-on-surface-variant",
								children: "Review your purchases and open an order for its details."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm font-semibold text-on-surface-variant",
								children: [
									orders.length,
									" order",
									orders.length === 1 ? "" : "s"
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-6 flex gap-2 overflow-x-auto pb-1",
							role: "tablist",
							"aria-label": "Filter orders",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FilterButton, {
									active: activeFilter === "all",
									onClick: () => setActiveFilter("all"),
									children: [
										"All Orders (",
										orders.length,
										")"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FilterButton, {
									active: activeFilter === "active",
									onClick: () => setActiveFilter("active"),
									children: [
										"Active / In Transit (",
										activeOrdersCount,
										")"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FilterButton, {
									active: activeFilter === "delivered",
									onClick: () => setActiveFilter("delivered"),
									children: [
										"Delivered (",
										deliveredOrdersCount,
										")"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FilterButton, {
									active: activeFilter === "cancelled",
									onClick: () => setActiveFilter("cancelled"),
									children: [
										"Cancelled (",
										cancelledOrdersCount,
										")"
									]
								})
							]
						}),
						filteredOrders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "rounded-2xl border border-outline-variant/20 bg-white p-8 text-center text-sm text-on-surface-variant",
							children: "No orders match this filter."
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-3",
							"data-testid": "orders-list",
							children: filteredOrders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OrderCard, {
								order,
								onOpen: () => openOrder(order.orderId)
							}, order.orderId))
						})
					]
				})]
			})
		}),
		showHelpModal && selectedOrder && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			title: `Need help with #${selectedOrder.orderId}`,
			onClose: () => setShowHelpModal(false),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleSubmitHelp,
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm font-semibold",
						children: ["Issue type", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: helpCategory,
							onChange: (event) => setHelpCategory(event.target.value),
							className: "mt-1 w-full rounded-xl border border-outline-variant/30 bg-white px-3 py-2.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Delivery Query" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Damaged / Missing Item" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Address Change" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Payment Query" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "Quality Concern" })
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm font-semibold",
						children: ["How can we help?", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							required: true,
							rows: 4,
							value: helpMessage,
							onChange: (event) => setHelpMessage(event.target.value),
							className: "mt-1 w-full rounded-xl border border-outline-variant/30 bg-white px-3 py-2.5"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogActions, {
						onClose: () => setShowHelpModal(false),
						busy: isSubmittingHelp,
						submitLabel: "Submit Request"
					})
				]
			})
		}),
		reviewOrder && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			title: `Review order #${reviewOrder.orderId}`,
			onClose: () => setReviewOrder(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleSubmitReview,
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-2 text-sm font-semibold",
						children: "Your rating"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2",
						children: [
							1,
							2,
							3,
							4,
							5
						].map((star) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": `${star} stars`,
							onClick: () => setReviewRating(star),
							className: `text-3xl ${reviewRating >= star ? "text-amber-500" : "text-slate-300"}`,
							children: "★"
						}, star))
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-sm font-semibold",
						children: ["Feedback", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							rows: 3,
							value: reviewComment,
							onChange: (event) => setReviewComment(event.target.value),
							className: "mt-1 w-full rounded-xl border border-outline-variant/30 bg-white px-3 py-2.5"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogActions, {
						onClose: () => setReviewOrder(null),
						busy: isSubmittingReview,
						submitLabel: "Submit Review"
					})
				]
			})
		})
	] });
}
function PageShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-surface font-body-md text-on-surface antialiased",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			children,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
function LoadingState({ label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-4 py-20 pt-[172px] text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-primary border-t-transparent" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-on-surface-variant",
			children: label
		})]
	});
}
function FilterButton({ active, children, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		role: "tab",
		"aria-selected": active,
		onClick,
		className: `shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition-colors ${active ? "bg-primary text-white" : "border border-outline-variant/20 bg-white text-on-surface-variant hover:text-primary"}`,
		children
	});
}
function OrderCard({ order, onOpen }) {
	const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);
	const placedAt = formatDate(order.createdAt, true);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		"data-testid": `order-history-card-${order.orderId}`,
		tabIndex: 0,
		onClick: onOpen,
		onKeyDown: (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				onOpen();
			}
		},
		className: "cursor-pointer rounded-2xl border border-outline-variant/20 bg-white p-4 shadow-sm transition-colors hover:border-primary/40 sm:p-5",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "text-base font-extrabold text-on-surface",
							children: ["Order #", order.orderId]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${statusClasses(order)}`,
							children: getDisplayStatus(order)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs text-on-surface-variant",
						children: [
							placedAt || "Date unavailable",
							" · ",
							itemCount,
							" item",
							itemCount === 1 ? "" : "s"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-sm font-semibold text-on-surface",
						children: ["Total ", money(order.pricingSummary.totalAmount)]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: (event) => {
					event.stopPropagation();
					onOpen();
				},
				className: "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-container",
				"aria-label": `View details for order ${order.orderId}`,
				children: ["View Details", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "material-symbols-outlined text-base",
					children: "arrow_forward"
				})]
			})]
		})
	});
}
function OrderDetails({ order, onBack, onInvoice, onHelp, onCancel, onReturn, onReorder, onReview, isReordering }) {
	const itemCount = order.items.reduce((count, item) => count + item.quantity, 0);
	const address = [
		order.deliveryAddress.houseNo,
		order.deliveryAddress.street,
		order.deliveryAddress.landmark,
		order.deliveryAddress.city,
		order.deliveryAddress.pincode
	].filter(Boolean).join(", ");
	const canCancel = order.status === "pending" || order.status === "processing";
	const canReturn = canRequestReturn(order);
	const timeline = buildOrderTimeline(order);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"data-testid": "order-details-view",
		className: "space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: onBack,
				className: "inline-flex items-center gap-2 rounded-xl border border-outline-variant/25 bg-white px-4 py-2.5 text-sm font-bold text-on-surface hover:border-primary/50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "material-symbols-outlined text-base",
					children: "arrow_back"
				}), "Back to Orders"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col gap-4 rounded-3xl border border-outline-variant/20 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between sm:p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs font-bold uppercase tracking-wider text-on-surface-variant",
						children: "Order Details"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "mt-1 break-all text-2xl font-black text-on-surface",
						children: ["#", order.orderId]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `rounded-full px-3 py-1 text-xs font-black uppercase ${statusClasses(order)}`,
							children: getDisplayStatus(order)
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-on-surface-variant",
							children: ["Placed ", formatDate(order.createdAt, true) || "date unavailable"]
						})]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: onInvoice,
						className: "rounded-xl border border-outline-variant/25 px-3.5 py-2.5 text-xs font-bold hover:border-primary/50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined mr-1 align-middle text-base",
							children: "print"
						}), "Print Invoice"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onHelp,
						className: "rounded-xl bg-primary px-3.5 py-2.5 text-xs font-bold text-white hover:bg-primary-container",
						children: "Need Help?"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-5 lg:grid-cols-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-5 lg:col-span-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						"data-testid": "order-progress-timeline",
						className: "rounded-3xl border border-outline-variant/20 bg-white p-5 sm:p-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-lg font-extrabold text-on-surface",
								children: "Order Progress"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-on-surface-variant",
								children: "Status milestones and dates available for this order."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
								className: "mt-5 space-y-0",
								children: timeline.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
									className: "relative flex gap-4 pb-6 last:pb-0",
									children: [
										index < timeline.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute bottom-0 left-[11px] top-6 w-0.5 ${entry.state === "completed" ? "bg-emerald-300" : "bg-outline-variant/30"}` }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-black ${entry.state === "completed" ? "bg-emerald-600 text-white" : entry.state === "current" ? "bg-primary text-white ring-4 ring-primary/10" : "border border-outline-variant/50 bg-white text-outline"}`,
											children: entry.state === "completed" ? "✓" : index + 1
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center justify-between gap-x-3 gap-y-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: `text-sm font-bold ${entry.state === "pending" ? "text-on-surface-variant" : "text-on-surface"}`,
													children: entry.label
												}), entry.timestamp && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("time", {
													dateTime: entry.timestamp,
													className: "text-xs text-on-surface-variant",
													children: formatDate(entry.timestamp, true)
												})]
											}), entry.state === "current" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-xs font-semibold text-primary",
												children: "Current status"
											})]
										})
									]
								}, entry.key))
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "rounded-3xl border border-outline-variant/20 bg-white p-5 sm:p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-baseline justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "text-lg font-extrabold text-on-surface",
								children: [
									"Items (",
									itemCount,
									")"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-sm font-bold text-on-surface",
								children: [money(order.pricingSummary.totalAmount), " total"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-4 divide-y divide-outline-variant/15",
							children: order.items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-3 py-4 first:pt-0 last:pb-0",
								children: [
									item.image && !item.image.endsWith("/assets/images/placeholder.jpg") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: item.image,
										alt: "",
										className: "h-16 w-16 shrink-0 rounded-xl bg-surface-container object-cover"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-surface-container text-primary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined",
											children: "inventory_2"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-bold text-on-surface",
												children: item.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-0.5 text-xs text-on-surface-variant",
												children: [
													[item.unitSize, item.unit].filter(Boolean).join(" "),
													" · Qty ",
													item.quantity
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "mt-1 text-xs text-on-surface-variant",
												children: [money(item.price), " each"]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "shrink-0 text-sm font-bold text-on-surface",
										children: money(item.price * item.quantity)
									})
								]
							}, `${item.productId}-${item.unitSize}-${index}`))
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "space-y-5 lg:col-span-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-3xl border border-outline-variant/20 bg-white p-5 sm:p-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-base font-extrabold text-on-surface",
									children: "Order Information"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
									className: "mt-4 space-y-3 text-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
											label: "Payment method",
											value: order.payment.method.toUpperCase()
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
											label: "Payment status",
											value: order.payment.status
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
											label: "Delivery",
											value: order.delivery.slot || order.delivery.type
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
											label: "Customer",
											value: order.customerName
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
											label: "Contact",
											value: order.phone || "Not provided"
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-4 border-t border-outline-variant/15 pt-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-bold uppercase tracking-wide text-on-surface-variant",
										children: "Delivery Address"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm leading-relaxed text-on-surface",
										children: address || "Address unavailable"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-3xl border border-outline-variant/20 bg-white p-5 sm:p-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-base font-extrabold text-on-surface",
								children: "Payment Summary"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 space-y-2.5 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
										label: "Items subtotal",
										value: money(order.pricingSummary.subtotal)
									}),
									order.pricingSummary.productSavings > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
										label: "Product savings",
										value: `−${money(order.pricingSummary.productSavings)}`
									}),
									order.pricingSummary.couponDiscount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
										label: "Coupon discount",
										value: `−${money(order.pricingSummary.couponDiscount)}`
									}),
									order.pricingSummary.coinDiscount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
										label: "Coin discount",
										value: `−${money(order.pricingSummary.coinDiscount)}`
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
										label: "Delivery charge",
										value: order.pricingSummary.deliveryFee === 0 ? "Free" : money(order.pricingSummary.deliveryFee)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "border-t border-outline-variant/20 pt-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
											label: "Order total",
											value: money(order.pricingSummary.totalAmount),
											strong: true
										})
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "rounded-3xl border border-outline-variant/20 bg-white p-5 sm:p-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-base font-extrabold text-on-surface",
								children: "Order Actions"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-4 flex flex-col gap-2",
								children: [
									canCancel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										"data-testid": "cancel-order-button",
										type: "button",
										onClick: onCancel,
										className: "rounded-xl border border-rose-200 px-4 py-2.5 text-left text-sm font-bold text-rose-700 hover:bg-rose-50",
										children: "Cancel Order"
									}),
									canReturn && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: onReturn,
										className: "rounded-xl border border-amber-200 px-4 py-2.5 text-left text-sm font-bold text-amber-800 hover:bg-amber-50",
										children: "Request Return"
									}),
									order.status === "delivered" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: onReview,
										className: "rounded-xl border border-outline-variant/25 px-4 py-2.5 text-left text-sm font-bold text-on-surface hover:border-primary/50",
										children: "Rate & Review"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										"data-testid": "reorder-button",
										type: "button",
										disabled: isReordering,
										onClick: onReorder,
										className: "rounded-xl bg-primary px-4 py-2.5 text-left text-sm font-bold text-white hover:bg-primary-container disabled:opacity-60",
										children: isReordering ? "Adding items…" : "Reorder"
									})
								]
							})]
						})
					]
				})]
			})
		]
	});
}
function InfoRow({ label, value, strong = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-on-surface-variant",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: `text-right ${strong ? "font-black text-on-surface" : "font-semibold text-on-surface"}`,
			children: value
		})]
	});
}
function Dialog({ title, onClose, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			role: "dialog",
			"aria-modal": "true",
			"aria-label": title,
			className: "w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl sm:p-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "mb-5 flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-extrabold text-on-surface",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onClose,
					"aria-label": "Close",
					className: "rounded-lg px-2 py-1 text-xl text-on-surface-variant hover:bg-surface-container",
					children: "×"
				})]
			}), children]
		})
	});
}
function DialogActions({ onClose, busy, submitLabel }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-end gap-2 pt-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: onClose,
			className: "rounded-xl border border-outline-variant/30 px-4 py-2.5 text-sm font-bold",
			children: "Close"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "submit",
			disabled: busy,
			className: "rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60",
			children: busy ? "Submitting…" : submitLabel
		})]
	});
}
var $$splitComponentImporter$3 = () => import("./policies-CW4LFcAd.mjs");
var Route$7 = createFileRoute("/policies")({
	head: () => ({ meta: [{ title: "Legal Policies & Terms — Sri Amman Smart Store" }, {
		name: "description",
		content: "Review our privacy, shipping, return, and service terms."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./prod-preview-Cmw7fqph.mjs");
var Route$6 = createFileRoute("/prod-preview")({
	head: () => ({ meta: [{ title: "Production Product Visual Preview — Sri Amman Smart Store" }, {
		name: "description",
		content: "Isolated read-only visual preview of approved production Firestore products."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./product-CM2Rdymj.mjs");
var Route$5 = createFileRoute("/product")({
	validateSearch: (search) => ({ id: search["id"] || void 0 }),
	head: () => ({ meta: [{ title: "Product Details — Sri Amman Smart Store" }, {
		name: "description",
		content: "Farm-fresh groceries and wood-pressed oils."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
/**
* Timeout bounding utility for production Firestore referral reads.
*/
function withTimeout(promise, timeoutMs, operation) {
	if (timeoutMs <= 0) return promise;
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new StorageAdapterError(`Production Firestore operation timed out after ${timeoutMs}ms during ${operation}`, {
				status: 503,
				code: "unavailable",
				category: "connectivity"
			}));
		}, timeoutMs);
		promise.then((res) => {
			clearTimeout(timer);
			resolve(res);
		}).catch((err) => {
			clearTimeout(timer);
			reject(err);
		});
	});
}
/**
* Normalizes an arbitrary legacy referral document from production Firestore
* (`users/{SASS_ID}/refferals/{docId}` or `refer and earn/{docId}`)
* into the standard frontend `ReferralFriend` domain model.
*/
function normalizeLegacyReferralDocument(docId, docData, userId) {
	const id = String(docData["id"] || docId || "").trim();
	let friendName = "";
	if (typeof docData["friendName"] === "string" && docData["friendName"].trim()) friendName = docData["friendName"].trim();
	else if (typeof docData["name"] === "string" && docData["name"].trim()) friendName = docData["name"].trim();
	else if (typeof docData["buyerName"] === "string" && docData["buyerName"].trim()) friendName = docData["buyerName"].trim();
	else if (typeof docData["userId"] === "string" && docData["userId"].trim() && docData["userId"].trim() !== userId) friendName = `Customer (${docData["userId"].trim()})`;
	else if (docId && docId !== userId && (docId.startsWith("SASS") || docId.startsWith("ONCUS"))) friendName = `Customer (${docId})`;
	else friendName = "Referred Friend";
	let phoneMasked = "—";
	const rawPhone = String(docData["phoneMasked"] || docData["phone"] || docData["number"] || "").trim();
	if (rawPhone) if (rawPhone.includes("*")) phoneMasked = rawPhone;
	else {
		const cleanDigits = rawPhone.replace(/\D/g, "");
		if (cleanDigits.length >= 10) phoneMasked = `+91 ${cleanDigits.slice(0, 2)}*****`;
		else phoneMasked = rawPhone;
	}
	const rawCoins = Number(docData["rewardCoins"] ?? docData["amount"] ?? docData["coins"] ?? 0);
	const rewardCoins = Math.max(0, Number.isFinite(rawCoins) ? rawCoins : 0);
	let status = "Signed Up (Order Pending)";
	if (typeof docData["status"] === "string" && docData["status"].trim()) status = docData["status"].trim();
	else if (rewardCoins > 0) status = "Completed First Order";
	let date = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
	const rawDate = docData["date"] ?? docData["referredAt"] ?? docData["createdAt"] ?? docData["timestamp"];
	if (rawDate && typeof rawDate.toDate === "function") date = rawDate.toDate().toISOString().split("T")[0];
	else if (rawDate && typeof rawDate.seconds === "number") date = (/* @__PURE__ */ new Date(rawDate.seconds * 1e3)).toISOString().split("T")[0];
	else if (typeof rawDate === "string" && rawDate.trim()) {
		const parsed = new Date(rawDate.trim());
		if (!Number.isNaN(parsed.getTime())) date = parsed.toISOString().split("T")[0];
		else date = rawDate.trim();
	}
	return {
		id,
		userId,
		friendName,
		phoneMasked,
		status,
		rewardCoins,
		date
	};
}
var readerOverride = null;
var productionReferralReader = {
	/**
	* Asserts that the provided identifier is a valid canonical customer ID (SASS or ONCUS).
	*/
	assertValidCustomer(customerId) {
		const clean = typeof customerId === "string" ? customerId.trim() : "";
		if (!clean || !CANONICAL_CUSTOMER_ID_RE$1.test(clean)) throw new StorageAdapterError(`Invalid customer identifier "${customerId}": Production customer operations require a canonical SASS customer ID (or ONCUS customer ID, e.g. 'ONCUS000010' or 'SASS0000001').`, {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		return clean;
	},
	/**
	* Reads all referrals for an authenticated customer directly from production Firestore
	* (`onlineCustomers/{ID}/refferals` or `users/{ID}/refferals`).
	* Deduplicates by referral ID and sorts descending by date.
	* If customer has an ONCUS ID and legacy SASS ID, falls back to legacy referrals if online subcollection is empty.
	*/
	async getCustomerReferrals(customerId, timeoutMs = 8e3, legacySassId) {
		if (readerOverride?.getCustomerReferrals) {
			if (legacySassId) return readerOverride.getCustomerReferrals(customerId || "", legacySassId);
			return readerOverride.getCustomerReferrals(customerId || "");
		}
		const cleanCustomerId = (customerId || "").trim();
		if (!cleanCustomerId) return [];
		const validCustomerId = this.assertValidCustomer(cleanCustomerId);
		const cleanLegacySassId = typeof legacySassId === "string" && legacySassId.trim() ? legacySassId.trim() : void 0;
		const db = getProductionFirestoreInstance();
		const primaryCol = validCustomerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
		try {
			let snap = await withTimeout(getDocs(query(collection(db, primaryCol, validCustomerId, "refferals"))), timeoutMs, `getDocs(${primaryCol}/${validCustomerId}/refferals)`);
			if (snap.empty) try {
				const altSnap = await withTimeout(getDocs(query(collection(db, primaryCol, validCustomerId, "referrals"))), timeoutMs, `getDocs(${primaryCol}/${validCustomerId}/referrals)`);
				if (!altSnap.empty) snap = altSnap;
			} catch {}
			if (snap.empty && primaryCol === "onlineCustomers" && cleanLegacySassId) try {
				const fallbackSnap = await withTimeout(getDocs(query(collection(db, "users", cleanLegacySassId, "refferals"))), timeoutMs, `getDocs(users/${cleanLegacySassId}/refferals)`);
				if (!fallbackSnap.empty) snap = fallbackSnap;
				else {
					const fallbackAlt = await withTimeout(getDocs(query(collection(db, "users", cleanLegacySassId, "referrals"))), timeoutMs, `getDocs(users/${cleanLegacySassId}/referrals)`);
					if (!fallbackAlt.empty) snap = fallbackAlt;
				}
			} catch (err) {
				console.warn(`[ProductionReferralReader] Warning querying fallback referrals for ${cleanLegacySassId}:`, err);
			}
			const list = [];
			const seenIds = /* @__PURE__ */ new Set();
			for (const docSnap of snap.docs) {
				const item = normalizeLegacyReferralDocument(docSnap.id, docSnap.data(), validCustomerId);
				if (seenIds.has(item.id)) continue;
				seenIds.add(item.id);
				list.push(item);
			}
			list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
			return list;
		} catch (err) {
			console.error(`[ProductionReferralReader] Error querying referrals for ${validCustomerId}:`, err);
			const category = classifyStorageError(err);
			const msg = err instanceof Error ? err.message : String(err);
			throw new StorageAdapterError(`Failed to retrieve referrals for customer ${validCustomerId}: ${msg}`, {
				status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
				code: category === "permission" ? "permission-denied" : "unavailable",
				category,
				causeError: err
			});
		}
	}
};
var referralService = {
	async getReferrals(userId, legacySassId) {
		const isProd = authManager.getMode() === "production";
		const currentUser = authService.getCurrentUser();
		const rawId = (userId || currentUser?.id || currentUser?.userId || "").trim();
		if (isProd) {
			if (!rawId) return [];
			let resolvedId = rawId;
			let resolvedLegacySassId = legacySassId || currentUser?.legacySassId;
			try {
				const ds = resolveCustomerDataSource(rawId);
				resolvedId = ds.canonicalCustomerId;
				resolvedLegacySassId = resolvedLegacySassId || ds.legacySassId;
			} catch {}
			if (resolvedLegacySassId) return productionReferralReader.getCustomerReferrals(resolvedId, void 0, resolvedLegacySassId);
			return productionReferralReader.getCustomerReferrals(resolvedId);
		}
		const effectiveUserId = rawId || "SASS0000104";
		return (await apiClient.get("/referrals", { userId: effectiveUserId }) || []).filter((r) => !r.userId || r.userId === effectiveUserId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
	},
	isCompletedReferral(referral) {
		return referral.status.toLowerCase().includes("completed") || (referral.rewardCoins || 0) > 0;
	},
	filterReferrals(referrals, filter) {
		if (filter === "completed") return referrals.filter((r) => this.isCompletedReferral(r));
		if (filter === "pending") return referrals.filter((r) => !this.isCompletedReferral(r));
		return referrals;
	},
	calculateReferralStats(referrals, coinValueInRupees = OFFICIAL_COIN_CONVERSION_RATE) {
		const totalNeighbors = referrals.length;
		const completedCount = referrals.filter((r) => this.isCompletedReferral(r)).length;
		const pendingCount = totalNeighbors - completedCount;
		const totalCoinsEarned = referrals.reduce((sum, r) => sum + (r.rewardCoins || 0), 0);
		return {
			totalNeighbors,
			completedCount,
			pendingCount,
			totalCoinsEarned,
			totalCashCredit: totalCoinsEarned * (typeof coinValueInRupees === "number" && coinValueInRupees > 0 ? coinValueInRupees : 0),
			conversionRatePercent: totalNeighbors > 0 ? Math.round(completedCount / totalNeighbors * 100) : 0,
			potentialPendingCoins: pendingCount * 50
		};
	},
	buildReferralLink(referralCode, origin) {
		const cleanOrigin = (origin || (typeof window !== "undefined" && window.location?.origin ? window.location.origin : "http://localhost:8080")).replace(/\/+$/, "");
		const cleanCode = (referralCode || "").trim();
		return `${cleanOrigin}/login?ref=${encodeURIComponent(cleanCode)}`;
	},
	buildShareMessage(referralCode, origin) {
		const link = this.buildReferralLink(referralCode, origin);
		return `Shop wood-pressed Mara Chekku oils, organic staples, and farm-fresh groceries at Sri Amman Smart Store! Register with my referral code ${(referralCode || "").trim()} to claim your welcome bonus Smart Coins: ${link}`;
	},
	buildWhatsAppShareUrl(referralCode, origin) {
		const message = this.buildShareMessage(referralCode, origin);
		return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
	},
	formatReferralDate(dateStr) {
		if (!dateStr) return "—";
		const parsed = new Date(dateStr);
		if (Number.isNaN(parsed.getTime())) return dateStr;
		return parsed.toLocaleDateString("en-IN", {
			day: "2-digit",
			month: "short",
			year: "numeric"
		});
	},
	getInitials(name) {
		if (!name || !name.trim()) return "FR";
		const parts = name.trim().split(/\s+/);
		const first = parts[0];
		if (!first) return "FR";
		if (parts.length === 1) return first.slice(0, 2).toUpperCase();
		const last = parts[parts.length - 1] || first;
		return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
	}
};
var Route$4 = createFileRoute("/refer")({
	head: () => ({ meta: [{ title: "Refer & Earn — Sri Amman Smart Store" }, {
		name: "description",
		content: "Invite friends to Sri Amman Smart Store with your personal referral code and earn Smart Coins on their first completed order."
	}] }),
	component: ReferPage
});
var INITIAL_VISIBLE_COUNT = 6;
function ReferPage() {
	const { user, isLoading: authLoading, isResolvingIdentity } = useAuth();
	const [referrals, setReferrals] = (0, import_react.useState)([]);
	const [coinHistory, setCoinHistory] = (0, import_react.useState)([]);
	const [storeInfo, setStoreInfo] = (0, import_react.useState)(null);
	const [deliverySettings, setDeliverySettings] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const [activityFilter, setActivityFilter] = (0, import_react.useState)("all");
	const [visibleCount, setVisibleCount] = (0, import_react.useState)(INITIAL_VISIBLE_COUNT);
	const [copiedCode, setCopiedCode] = (0, import_react.useState)(false);
	const [copiedLink, setCopiedLink] = (0, import_react.useState)(false);
	const loadReferralDashboard = (0, import_react.useCallback)(async () => {
		if (!user) {
			if (!authLoading && !isResolvingIdentity) setLoading(false);
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const [userReferrals, userCoinHistory, store, delivery] = await Promise.all([
				referralService.getReferrals(user.id, user.legacySassId),
				coinService.getCoinHistory(user.id, user.legacySassId),
				settingsService.getStoreInfo(),
				settingsService.getDeliverySettings()
			]);
			setReferrals(userReferrals || []);
			setCoinHistory(userCoinHistory || []);
			setStoreInfo(store || null);
			setDeliverySettings(delivery || null);
		} catch (err) {
			console.error("Failed to load referral dashboard data:", err);
			setError(err?.message || "Unable to load your referral dashboard from the server. Please verify the API connection and try again.");
		} finally {
			setLoading(false);
		}
	}, [
		user,
		authLoading,
		isResolvingIdentity
	]);
	(0, import_react.useEffect)(() => {
		loadReferralDashboard();
	}, [loadReferralDashboard]);
	const conversionRate = (0, import_react.useMemo)(() => {
		const rate = storeInfo?.coinValueInRupees;
		if (typeof rate === "number" && rate > 0 && rate !== .5) return rate;
		return OFFICIAL_COIN_CONVERSION_RATE;
	}, [storeInfo]);
	const hasValidConversionRate = conversionRate > 0;
	const ledgerStats = (0, import_react.useMemo)(() => {
		return coinService.calculateLedgerStats(coinHistory);
	}, [coinHistory]);
	const availableCoins = (0, import_react.useMemo)(() => {
		if (coinHistory.length > 0) return ledgerStats.netBalance;
		return user?.smartCoins ?? user?.coins ?? 0;
	}, [
		coinHistory.length,
		ledgerStats.netBalance,
		user?.smartCoins,
		user?.coins
	]);
	const referralStats = (0, import_react.useMemo)(() => {
		return referralService.calculateReferralStats(referrals, conversionRate);
	}, [referrals, conversionRate]);
	const filteredReferrals = (0, import_react.useMemo)(() => {
		return referralService.filterReferrals(referrals, activityFilter);
	}, [referrals, activityFilter]);
	const visibleReferrals = (0, import_react.useMemo)(() => {
		return filteredReferrals.slice(0, visibleCount);
	}, [filteredReferrals, visibleCount]);
	const handleFilterChange = (nextFilter) => {
		setActivityFilter(nextFilter);
		setVisibleCount(INITIAL_VISIBLE_COUNT);
	};
	const referralCode = user?.referralCode || user?.id || "";
	const hasActiveCode = Boolean(referralCode.trim());
	const storeLocation = storeInfo?.locationName || "Gobichettipalayam, Erode";
	const rewardRupeeValue = hasValidConversionRate ? Math.round(50 * conversionRate) : null;
	const handleCopyCode = async () => {
		if (!hasActiveCode) {
			toast.error("No referral code is currently assigned to your account.");
			return;
		}
		try {
			await navigator.clipboard.writeText(referralCode);
			setCopiedCode(true);
			toast.success(`Referral code "${referralCode}" copied to clipboard!`);
			setTimeout(() => setCopiedCode(false), 2500);
		} catch {
			toast.error("Could not access clipboard. Please copy the code manually.");
		}
	};
	const handleShareWhatsApp = () => {
		if (!hasActiveCode) {
			toast.error("Referral code unavailable for sharing.");
			return;
		}
		const whatsappUrl = referralService.buildWhatsAppShareUrl(referralCode);
		window.open(whatsappUrl, "_blank", "noopener,noreferrer");
	};
	const handleShareLinkOrMore = async () => {
		if (!hasActiveCode) {
			toast.error("Referral link unavailable.");
			return;
		}
		const inviteLink = referralService.buildReferralLink(referralCode);
		const shareText = referralService.buildShareMessage(referralCode);
		if (typeof navigator !== "undefined" && typeof navigator.share === "function") try {
			await navigator.share({
				title: "Sri Amman Smart Store — Community Referral Invite",
				text: shareText,
				url: inviteLink
			});
			return;
		} catch (err) {
			if (err?.name === "AbortError") return;
		}
		try {
			await navigator.clipboard.writeText(inviteLink);
			setCopiedLink(true);
			toast.success("Referral invite link copied to clipboard!");
			setTimeout(() => setCopiedLink(false), 2500);
		} catch {
			toast.error("Unable to copy referral link. Please try again.");
		}
	};
	if ((authLoading || isResolvingIdentity) && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-[#f8f9fc] font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1000px] mx-auto px-margin-desktop py-20 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-9 h-9 border-3 border-[#005F3F] border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-on-surface-variant font-medium",
					children: "Loading referral dashboard..."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-[#f8f9fc] font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] max-w-[1000px] mx-auto px-margin-desktop py-16 text-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-white rounded-3xl border border-outline-variant/20 p-8 md:p-12 shadow-xs max-w-lg mx-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-16 h-16 rounded-2xl bg-[#e3f5ec] text-[#005F3F] flex items-center justify-center mx-auto mb-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "material-symbols-outlined text-3xl",
								children: "redeem"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-headline-lg text-xl md:text-2xl font-extrabold text-on-surface mb-2",
							children: "Sign In to Access Refer & Earn"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs md:text-sm text-on-surface-variant mb-6 leading-relaxed",
							children: "Sign in with your mobile number to view your personal referral passcode, share invite links with neighbors, and track your credited Smart Coins."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/login",
							search: { redirect: "/refer" },
							className: "inline-flex items-center gap-2 bg-[#005F3F] text-white px-6 py-3 rounded-xl font-headline-sm text-xs font-bold shadow-sm hover:bg-[#004c32] transition-all",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "material-symbols-outlined text-[16px]",
								children: "login"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sign In with Mobile OTP" })]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-[#f8f9fc] font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] min-h-[calc(100vh-172px)] pb-16",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							"aria-label": "Breadcrumb",
							className: "flex items-center gap-2 text-xs text-on-surface-variant mb-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/",
									className: "hover:text-[#005F3F] transition-colors inline-flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[15px]",
										children: "home"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Home" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-outline-variant",
									children: "›"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/account",
									className: "hover:text-[#005F3F] transition-colors",
									children: "My Account"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-outline-variant",
									children: "›"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[#005F3F] font-bold",
									children: "Refer & Earn"
								})
							]
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							role: "alert",
							"data-testid": "referrals-error-banner",
							className: "mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-900",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-red-600",
									children: "error"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-bold",
									children: "Could not load referral data"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-red-700",
									children: error
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: loadReferralDashboard,
								className: "bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors self-start sm:self-auto cursor-pointer",
								children: "Retry"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "max-w-2xl",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "inline-flex items-center gap-1.5 bg-[#fbf3dc] border border-[#f0deaa] text-[#7a4f00] text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider mb-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[14px]",
											children: "workspace_premium"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Amman Community Rewards" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
										className: "font-headline-lg text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight leading-tight",
										children: [
											"Refer & Earn",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[#005F3F] relative inline-block",
												children: ["Pure Savings", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "block h-1.5 w-full bg-[#005F3F]/25 rounded-full mt-0.5" })]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs sm:text-sm text-on-surface-variant mt-3 leading-relaxed",
										children: [
											"Invite your friends and neighbors to",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
												className: "text-on-surface font-semibold",
												children: storeInfo?.storeName || "Sri Amman Smart Store"
											}),
											". Friends who register with your referral code receive",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
												className: "text-on-surface font-semibold",
												children: "welcome bonus Smart Coins"
											}),
											", and you receive",
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
												className: "text-[#005F3F] font-bold",
												children: [
													50,
													" Smart Coins",
													rewardRupeeValue !== null ? ` (₹${rewardRupeeValue} value)` : ""
												]
											}),
											" ",
											"credited to your rewards vault upon their first completed order."
										]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-white border border-outline-variant/20 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-5 shrink-0 sm:min-w-[330px]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-12 h-12 rounded-2xl bg-[#fff3d6] border border-[#f5dfa6] text-[#9e6700] flex items-center justify-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[24px]",
											children: "monetization_on"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant block",
										children: "Your Amman Vault"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline gap-1.5 mt-0.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												"data-testid": "vault-coin-balance",
												className: "font-headline-lg text-2xl font-black text-on-surface tracking-tight",
												children: loading ? "—" : availableCoins.toLocaleString("en-IN")
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] font-bold text-on-surface-variant uppercase",
												children: "Coins"
											}),
											!loading && hasValidConversionRate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[11px] font-bold text-[#9e6700]",
												children: [
													"(₹",
													(availableCoins * conversionRate).toFixed(0),
													")"
												]
											})
										]
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/cart",
									className: "bg-[#f1f3f9] hover:bg-[#e4e8f2] text-on-surface font-headline-sm text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0",
									children: "Redeem"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-7 bg-white rounded-3xl border border-outline-variant/20 p-6 sm:p-8 shadow-xs relative overflow-hidden flex flex-col justify-between",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										"aria-hidden": "true",
										className: "w-48 h-48 rounded-full bg-[#e8f5ef]/80 absolute -top-12 -right-12 pointer-events-none"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative z-10",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap items-center justify-between gap-2 mb-5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "bg-[#dff5ea] text-[#005F3F] text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full",
													children: "Your Exclusive Referral Pass"
												}), hasActiveCode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "inline-flex items-center gap-1.5 text-xs font-bold text-[#005F3F]",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-[#005F3F] animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Active & Ready" })]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
												className: "font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight mb-2",
												children: [
													"Give Your Friends a Reason to Shop — Earn",
													" ",
													50,
													" Coins"
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs sm:text-sm text-on-surface-variant leading-relaxed mb-6 max-w-xl",
												children: [
													"Valid across farm-fresh produce, wood-pressed Mara Chekku oils, native heirloom staples, and artisanal spice blends in",
													" ",
													storeLocation,
													"."
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-[#f4f5fa] border border-outline-variant/20 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-3 min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-10 h-10 rounded-xl bg-white border border-outline-variant/15 flex items-center justify-center text-[#005F3F] shrink-0 shadow-2xs",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[20px]",
															children: "confirmation_number"
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "min-w-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] text-on-surface-variant font-medium block",
															children: "Your Personal Code"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															"data-testid": "personal-referral-code",
															className: "font-headline-lg text-base sm:text-lg font-black text-on-surface tracking-wider break-all",
															children: referralCode || "UNASSIGNED"
														})]
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: handleCopyCode,
													disabled: !hasActiveCode,
													"data-testid": "copy-code-btn",
													className: "bg-[#005F3F] hover:bg-[#004c32] disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-headline-sm text-xs font-bold inline-flex items-center justify-center gap-2 shadow-xs transition-all shrink-0 cursor-pointer",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[16px]",
														children: copiedCode ? "check" : "content_copy"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: copiedCode ? "Copied!" : "Copy Code" })]
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative z-10 pt-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-semibold text-on-surface-variant block mb-3",
											children: "Share directly via favorite channels:"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: handleShareWhatsApp,
												disabled: !hasActiveCode,
												"data-testid": "share-whatsapp-btn",
												className: "bg-[#005F3F] hover:bg-[#004c32] disabled:opacity-50 text-white py-3.5 px-5 rounded-xl font-headline-sm text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px]",
													children: "chat"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Share via WhatsApp" })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: handleShareLinkOrMore,
												disabled: !hasActiveCode,
												"data-testid": "share-link-btn",
												className: "bg-[#eef0f8] hover:bg-[#e2e5f2] disabled:opacity-50 text-on-surface py-3.5 px-5 rounded-xl font-headline-sm text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[18px]",
													children: copiedLink ? "check" : "share"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: copiedLink ? "Invite Link Copied!" : "Share Link / More" })]
											})]
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "lg:col-span-5 flex flex-col justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-white rounded-3xl border border-outline-variant/20 p-6 sm:p-7 shadow-xs flex-1 flex flex-col justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mb-5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-headline-lg text-base sm:text-lg font-extrabold text-on-surface",
												children: "Your Impact Metrics"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-on-surface-variant text-[20px]",
												children: "trending_up"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-2 gap-3.5 mb-3.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-[#f6f7fb] rounded-2xl p-4 border border-outline-variant/10",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between text-on-surface-variant mb-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] font-semibold",
															children: "Total Invites"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[16px] text-[#005F3F]",
															children: "group"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														"data-testid": "metric-total-invites",
														className: "font-headline-lg text-2xl sm:text-3xl font-black text-on-surface my-0.5",
														children: loading ? "—" : referralStats.totalNeighbors
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] text-on-surface-variant block",
														children: "Community invites sent"
													})
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-[#eefaf3] rounded-2xl p-4 border border-[#cdebd9]/60",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between text-on-surface-variant mb-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[11px] font-semibold",
															children: "Orders Placed"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[16px] text-[#005F3F]",
															children: "check_circle"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														"data-testid": "metric-completed-orders",
														className: "font-headline-lg text-2xl sm:text-3xl font-black text-[#005F3F] my-0.5",
														children: loading ? "—" : referralStats.completedCount
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] text-on-surface-variant block",
														children: referralStats.totalNeighbors > 0 ? `${referralStats.conversionRatePercent}% conversion rate` : "No invites yet"
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-[#fff9ed] border border-[#f5e1b5] rounded-2xl p-4 mb-3.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between mb-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[11px] font-bold text-on-surface",
														children: "Total Smart Coins Credited"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "w-5 h-5 rounded-full bg-[#f5b82e] text-white flex items-center justify-center text-[11px] font-black",
														children: "₹"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-wrap items-baseline gap-1.5 my-0.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														"data-testid": "metric-coins-credited",
														className: "font-headline-lg text-2xl sm:text-3xl font-black text-on-surface",
														children: loading ? "—" : referralStats.totalCoinsEarned.toLocaleString("en-IN")
													}), !loading && hasValidConversionRate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-xs font-extrabold text-[#9e6700]",
														children: [
															"(₹",
															referralStats.totalCashCredit.toFixed(0),
															" Instant Savings)"
														]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-[11px] text-on-surface-variant mt-0.5",
													children: "Applied seamlessly toward cold-pressed oils, produce & grocery carts."
												})
											]
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-[#f4f5fa] rounded-2xl p-3.5 flex items-center justify-between gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-8 h-8 rounded-full bg-[#ffefd4] text-[#9e6700] flex items-center justify-center shrink-0",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[16px]",
													children: "pending"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												"data-testid": "metric-pending-friends",
												className: "text-xs font-extrabold text-on-surface block",
												children: loading ? "Loading pending status..." : `${referralStats.pendingCount} ${referralStats.pendingCount === 1 ? "Friend" : "Friends"} Pending`
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-on-surface-variant block",
												children: referralStats.pendingCount > 0 ? `${referralStats.potentialPendingCoins} potential coins waiting upon their first order` : "All invited friends have completed their first order"
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-on-surface-variant text-[18px]",
											children: "notifications_none"
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "bg-[#eaf6f2] border border-[#cbeadd] rounded-2xl p-3.5 flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-8 h-8 rounded-xl bg-[#005F3F]/10 text-[#005F3F] flex items-center justify-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[18px]",
											children: "volunteer_activism"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-[11px] font-semibold text-[#004c32] leading-snug",
										children: [
											"Every referral strengthens farm-to-doorstep harvest sourcing across ",
											storeLocation,
											" neighborhoods!"
										]
									})]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mb-14",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-center max-w-xl mx-auto mb-8",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#005F3F] block mb-1.5",
										children: "Simplicity by Design"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight",
										children: "How The Reward Cycle Works"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs sm:text-sm text-on-surface-variant mt-1.5",
										children: "Three straightforward steps to organic freshness and effortless grocery savings."
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 md:grid-cols-3 gap-6",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-white rounded-3xl border border-outline-variant/20 p-6 sm:p-7 shadow-xs flex flex-col justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-12 h-12 rounded-2xl bg-[#e3f5ec] text-[#005F3F] flex items-center justify-center",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[24px]",
														children: "extension"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-lg text-3xl font-black text-[#e1e5f0]",
													children: "01"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-headline-lg text-base font-extrabold text-on-surface mb-2",
												children: "Share Your Code"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-on-surface-variant leading-relaxed",
												children: [
													"Send your unique referral link or passcode",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-on-surface font-bold",
														children: referralCode
													}),
													" ",
													"to family, neighbors, or colleagues in ",
													storeLocation,
													"."
												]
											})
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-[#f4f5fa] rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant mt-6",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[15px] text-[#005F3F]",
												children: "qr_code_2"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Shareable via WhatsApp or direct invite link" })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-white rounded-3xl border border-outline-variant/20 p-6 sm:p-7 shadow-xs flex flex-col justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-12 h-12 rounded-2xl bg-[#fff0d6] text-[#9e6700] flex items-center justify-center",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[24px]",
														children: "shopping_cart_checkout"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-lg text-3xl font-black text-[#e1e5f0]",
													children: "02"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-headline-lg text-base font-extrabold text-on-surface mb-2",
												children: "They Register & Shop Fresh"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-on-surface-variant leading-relaxed",
												children: [
													"Your friend registers with your referral code during Mobile OTP sign-in to receive",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
														className: "text-[#9e6700] font-bold",
														children: "welcome bonus Smart Coins"
													}),
													" ",
													"and places their first farm-fresh order."
												]
											})
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-[#f4f5fa] rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant mt-6",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[15px] text-[#9e6700]",
												children: "bolt"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"Serviceable within ",
												storeInfo?.maxRadiusKm ?? 6,
												" km of",
												" ",
												storeLocation
											] })]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-white rounded-3xl border border-outline-variant/20 p-6 sm:p-7 shadow-xs flex flex-col justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-12 h-12 rounded-2xl bg-[#d6f7e5] text-[#005F3F] flex items-center justify-center",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[24px]",
														children: "savings"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-lg text-3xl font-black text-[#e1e5f0]",
													children: "03"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-headline-lg text-base font-extrabold text-on-surface mb-2",
												children: "Both Get Rewarded"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-on-surface-variant leading-relaxed",
												children: [
													"Once their first order is completed, you earn",
													" ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
														className: "text-[#005F3F] font-bold",
														children: [
															50,
															" Smart Coins",
															rewardRupeeValue !== null ? ` (₹${rewardRupeeValue} value)` : ""
														]
													}),
													" ",
													"credited to your referral rewards balance."
												]
											})
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-[#f4f5fa] rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-[11px] font-semibold text-on-surface-variant mt-6",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[15px] text-[#005F3F]",
												children: "auto_awesome"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "100% transparent tracking in your Activity Log" })]
										})]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
							className: "mb-16",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-gradient-to-r from-white via-white to-[#fffaf0] rounded-3xl border border-outline-variant/20 p-6 sm:p-8 shadow-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "inline-flex items-center gap-2 mb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "bg-[#ffecd1] text-[#855300] text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full",
												children: "Referral Conversion Overview"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[11px] font-semibold text-on-surface-variant",
												children: [50, " Coins per Completed First Order"]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-headline-lg text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight",
											children: referralStats.totalNeighbors === 0 ? "Invite Your First Neighbor to Start Earning Referral Rewards" : referralStats.pendingCount > 0 ? `${referralStats.completedCount} of ${referralStats.totalNeighbors} Invited Friends Have Completed Their First Order` : `All ${referralStats.completedCount} Invited Friends Have Completed Their First Order!`
										})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "sm:text-right shrink-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												"data-testid": "progress-fraction",
												className: "font-headline-lg text-2xl sm:text-3xl font-black text-[#005F3F]",
												children: referralStats.completedCount
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-sm font-bold text-on-surface-variant",
												children: [
													" ",
													"/ ",
													referralStats.totalNeighbors,
													" Completed"
												]
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										role: "progressbar",
										"aria-label": "Completed referrals progress",
										"aria-valuenow": referralStats.conversionRatePercent,
										"aria-valuemin": 0,
										"aria-valuemax": 100,
										className: "w-full h-3.5 bg-[#eaedf5] rounded-full overflow-hidden mb-5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-full bg-gradient-to-r from-[#005F3F] to-[#26a66c] rounded-full transition-all duration-500",
											style: { width: `${Math.max(referralStats.totalNeighbors > 0 ? 6 : 0, referralStats.conversionRatePercent)}%` }
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 md:grid-cols-3 gap-3.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-[#f4f5fa] rounded-2xl p-3.5 flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[#005F3F] text-[20px] shrink-0",
													children: "check_circle"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-[11px] leading-snug",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "font-bold text-on-surface block",
														children: ["Completed Referrals: ", referralStats.completedCount]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-on-surface-variant",
														children: [
															referralStats.totalCoinsEarned,
															" Smart Coins",
															hasValidConversionRate ? ` (₹${referralStats.totalCashCredit.toFixed(0)})` : "",
															" ",
															"credited"
														]
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-[#eafaf1] border border-[#c5ebd6] rounded-2xl p-3.5 flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[#005F3F] text-[20px] shrink-0",
													children: "flag"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-[11px] leading-snug",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "font-bold text-[#004c32] block",
														children: ["Pending First Orders: ", referralStats.pendingCount]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-[#005F3F]",
														children: [referralStats.potentialPendingCoins, " potential coins on first order completion"]
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-[#f4f5fa] rounded-2xl p-3.5 flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-on-surface-variant text-[20px] shrink-0",
													children: "verified_user"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-[11px] leading-snug",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-bold text-on-surface block",
														children: "Standard Per-Referral Reward"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-on-surface-variant",
														children: [
															"No multi-tier lock-ins; VIP status is based separately on ₹",
															storeInfo?.vipSpendingThreshold ?? 5e3,
															" 30-day spend"
														]
													})]
												})]
											})
										]
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mb-16",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#005F3F] block mb-1",
										children: "Audit Log"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-headline-lg text-2xl font-extrabold text-on-surface tracking-tight",
										children: "Referral Activity Log"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-on-surface-variant mt-0.5",
										children: "Track referral registrations, first-order statuses, and coin credits in real-time."
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									role: "tablist",
									"aria-label": "Filter referral activity",
									className: "bg-white border border-outline-variant/20 p-1 rounded-full inline-flex flex-wrap items-center gap-1 shadow-2xs self-start md:self-auto",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											role: "tab",
											"aria-selected": activityFilter === "all",
											"data-testid": "filter-tab-all",
											onClick: () => handleFilterChange("all"),
											className: `px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${activityFilter === "all" ? "bg-[#005F3F] text-white shadow-2xs" : "text-on-surface-variant hover:text-on-surface"}`,
											children: [
												"All Referrals (",
												referrals.length,
												")"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											role: "tab",
											"aria-selected": activityFilter === "completed",
											"data-testid": "filter-tab-completed",
											onClick: () => handleFilterChange("completed"),
											className: `px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${activityFilter === "completed" ? "bg-[#005F3F] text-white shadow-2xs" : "text-on-surface-variant hover:text-on-surface"}`,
											children: [
												"Completed & Credited (",
												referralStats.completedCount,
												")"
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											role: "tab",
											"aria-selected": activityFilter === "pending",
											"data-testid": "filter-tab-pending",
											onClick: () => handleFilterChange("pending"),
											className: `px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${activityFilter === "pending" ? "bg-[#005F3F] text-white shadow-2xs" : "text-on-surface-variant hover:text-on-surface"}`,
											children: [
												"Pending First Order (",
												referralStats.pendingCount,
												")"
											]
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "bg-white rounded-3xl border border-outline-variant/20 shadow-xs overflow-hidden",
								children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "py-14 px-6 text-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10 h-10 rounded-full border-2 border-[#005F3F] border-t-transparent animate-spin mx-auto mb-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs font-semibold text-on-surface-variant",
										children: "Loading referral activity from server..."
									})]
								}) : filteredReferrals.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									"data-testid": "empty-referrals-view",
									className: "py-14 px-6 text-center max-w-md mx-auto",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											"data-testid": "referral-empty-state",
											className: "w-12 h-12 rounded-2xl bg-[#f4f5fa] text-on-surface-variant flex items-center justify-center mx-auto mb-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[24px]",
												children: "group_add"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-headline-sm text-sm font-bold text-on-surface mb-1",
											children: referrals.length === 0 ? "No Referrals Recorded Yet" : "No Referrals Match This Filter"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-on-surface-variant mb-4",
											children: referrals.length === 0 ? "Share your personal referral code with friends and neighbors to earn 50 Smart Coins when they complete their first order." : "Try switching to 'All Referrals' to view your complete invitation history."
										}),
										referrals.length > 0 && activityFilter !== "all" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => handleFilterChange("all"),
											className: "bg-[#005F3F] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#004c32] transition-colors cursor-pointer",
											children: "Show All Referrals"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: handleCopyCode,
											className: "bg-[#005F3F] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#004c32] transition-colors cursor-pointer",
											children: "Copy Personal Code"
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "hidden md:block overflow-x-auto",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
											className: "w-full text-left border-collapse",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
												className: "bg-[#f6f7fb] border-b border-outline-variant/15 text-[10px] font-extrabold uppercase tracking-wider text-on-surface-variant",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "py-3.5 px-6",
														children: "Friend / Contact"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "py-3.5 px-6",
														children: "Activity Description"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "py-3.5 px-6",
														children: "Date"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
														className: "py-3.5 px-6 text-right",
														children: "Reward Status"
													})
												]
											}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
												className: "divide-y divide-outline-variant/15 text-xs",
												children: visibleReferrals.map((friend) => {
													const isCompleted = referralService.isCompletedReferral(friend);
													const initials = referralService.getInitials(friend.friendName);
													return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
														"data-testid": `referral-row-${friend.id}`,
														className: "hover:bg-[#f9fafc] transition-colors",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "py-4 px-6",
																children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																	className: "flex items-center gap-3",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																		className: `w-10 h-10 rounded-full flex items-center justify-center font-headline-sm text-xs font-extrabold shrink-0 ${isCompleted ? "bg-[#e3f5ec] text-[#005F3F]" : "bg-[#fff3dc] text-[#855300]"}`,
																		children: initials
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "font-headline-sm text-xs font-bold text-on-surface block",
																		children: friend.friendName
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "text-[11px] text-on-surface-variant",
																		children: friend.phoneMasked
																	})] })]
																})
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
																className: "py-4 px-6",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "font-semibold text-on-surface block",
																	children: friend.status
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: `text-[11px] ${isCompleted ? "text-on-surface-variant" : "text-[#9e6700] font-medium"}`,
																	children: isCompleted ? `First order completed • +${friend.rewardCoins} Smart Coins${hasValidConversionRate ? ` (₹${(friend.rewardCoins * conversionRate).toFixed(0)} value)` : ""}` : "Registered via referral code • Waiting for first order completion"
																})]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "py-4 px-6 text-on-surface-variant font-medium whitespace-nowrap",
																children: referralService.formatReferralDate(friend.date)
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
																className: "py-4 px-6 text-right whitespace-nowrap",
																children: isCompleted ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "inline-flex items-center gap-1.5 bg-[#bdf2d5] text-[#004d31] px-3 py-1 rounded-full text-[11px] font-extrabold",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "material-symbols-outlined text-[14px]",
																		children: "check_circle"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
																		"Rewarded +",
																		friend.rewardCoins,
																		" Coins"
																	] })]
																}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																	className: "inline-flex items-center gap-1.5 bg-[#fde6c4] text-[#7a4900] px-3 py-1 rounded-full text-[11px] font-extrabold",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																		className: "material-symbols-outlined text-[14px]",
																		children: "schedule"
																	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Pending First Order" })]
																})
															})
														]
													}, friend.id);
												})
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "md:hidden divide-y divide-outline-variant/15",
										children: visibleReferrals.map((friend) => {
											const isCompleted = referralService.isCompletedReferral(friend);
											const initials = referralService.getInitials(friend.friendName);
											return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "p-4 flex flex-col gap-2.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between gap-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2.5 min-w-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `w-9 h-9 rounded-full flex items-center justify-center font-headline-sm text-xs font-extrabold shrink-0 ${isCompleted ? "bg-[#e3f5ec] text-[#005F3F]" : "bg-[#fff3dc] text-[#855300]"}`,
															children: initials
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "min-w-0",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-headline-sm text-xs font-bold text-on-surface block truncate",
																children: friend.friendName
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-[11px] text-on-surface-variant block",
																children: friend.phoneMasked
															})]
														})]
													}), isCompleted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-flex items-center gap-1 bg-[#bdf2d5] text-[#004d31] px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
															"+",
															friend.rewardCoins,
															" Coins"
														] })
													}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "inline-flex items-center gap-1 bg-[#fde6c4] text-[#7a4900] px-2.5 py-1 rounded-full text-[10px] font-extrabold shrink-0",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Pending" })
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between text-[11px] text-on-surface-variant pl-11",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: friend.status }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: referralService.formatReferralDate(friend.date) })]
												})]
											}, friend.id);
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-[#f6f7fb] border-t border-outline-variant/15 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-on-surface-variant",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
												"Showing ",
												visibleReferrals.length,
												" of",
												" ",
												filteredReferrals.length,
												" records (",
												referrals.length,
												" total referrals)"
											] }), filteredReferrals.length > visibleCount && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => setVisibleCount((prev) => prev + INITIAL_VISIBLE_COUNT),
												className: "text-[#005F3F] font-bold hover:underline cursor-pointer",
												children: "Load More"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "inline-flex items-center gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-[#005F3F]" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Referral rewards credit upon verified first-order completion." })]
										})]
									})
								] })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-white rounded-3xl border border-outline-variant/20 p-6 sm:p-8 shadow-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5 mb-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[#005F3F] text-[22px]",
									children: "gavel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-headline-lg text-lg sm:text-xl font-extrabold text-on-surface",
									children: "Referral Terms & Fair Use Guidelines"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 md:grid-cols-3 gap-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-[#f6f7fb] rounded-2xl p-5 border border-outline-variant/10",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-[#005F3F] font-headline-sm text-xs font-extrabold mb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[18px]",
												children: "person_check"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "New Customer Eligibility" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-on-surface-variant leading-relaxed",
											children: [
												"Referral codes (",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono font-semibold text-on-surface",
													children: referralCode
												}),
												") apply when a new customer registers via Mobile OTP. Self-referrals or duplicate accounts using the same mobile number are prevented."
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-[#f6f7fb] rounded-2xl p-5 border border-outline-variant/10",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-[#005F3F] font-headline-sm text-xs font-extrabold mb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[18px]",
												children: "location_on"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [storeLocation, " Service Zone"] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-on-surface-variant leading-relaxed",
											children: [
												"Orders placed by referred friends must be within our configured",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
													className: "text-on-surface font-semibold",
													children: [storeInfo?.maxRadiusKm ?? 6, " km delivery radius"]
												}),
												" ",
												"around ",
												storeLocation,
												deliverySettings?.minOrderForFreeDelivery ? ` (free standard delivery on orders ₹${deliverySettings.minOrderForFreeDelivery}+)` : "",
												"."
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-[#f6f7fb] rounded-2xl p-5 border border-outline-variant/10",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-[#005F3F] font-headline-sm text-xs font-extrabold mb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[18px]",
												children: "redeem"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Reward Credit & Redemption" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-on-surface-variant leading-relaxed",
											children: [
												"You earn",
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("strong", {
													className: "text-on-surface font-semibold",
													children: [50, " Smart Coins"]
												}),
												" ",
												"per friend who completes their first order",
												hasValidConversionRate ? ` (1 Coin = ₹${conversionRate.toFixed(2)} at checkout)` : "",
												". Referral counts do not alter VIP status, which requires ₹",
												storeInfo?.vipSpendingThreshold ?? 5e3,
												" in delivered orders over a rolling 30-day window."
											]
										})]
									})
								]
							})]
						}) })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
var Route$3 = createFileRoute("/rewards")({
	head: () => ({ meta: [{ title: "Smart Coins & VIP Privilege Hub — Sri Amman Smart Store" }, {
		name: "description",
		content: "Check your loyalty coin balance, view transaction ledger, share referral codes, and track 30-day VIP Privilege progress."
	}] }),
	component: RewardsPage
});
function RewardsPage() {
	const { user, isLoading: authLoading, isResolvingIdentity, refreshUser } = useAuth();
	const [coinHistory, setCoinHistory] = (0, import_react.useState)([]);
	const [orders, setOrders] = (0, import_react.useState)([]);
	const [referrals, setReferrals] = (0, import_react.useState)([]);
	const [storeInfo, setStoreInfo] = (0, import_react.useState)(null);
	const [conversionRate, setConversionRate] = (0, import_react.useState)(OFFICIAL_COIN_CONVERSION_RATE);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [rewardsError, setRewardsError] = (0, import_react.useState)(null);
	const [verifiedBalance, setVerifiedBalance] = (0, import_react.useState)(null);
	const [activityFilter, setActivityFilter] = (0, import_react.useState)("all");
	const [displayCount, setDisplayCount] = (0, import_react.useState)(5);
	const activeRequestRef = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		if (!user && !authLoading && !isResolvingIdentity) setLoading(false);
	}, [
		user,
		authLoading,
		isResolvingIdentity
	]);
	const loadRewardsData = (0, import_react.useCallback)(async () => {
		if (!user) return;
		const requestId = ++activeRequestRef.current;
		setLoading(true);
		setRewardsError(null);
		try {
			const [historyResult, ordersResult, referralsResult, storeResult, balanceResult] = await Promise.allSettled([
				coinService.getCoinHistory(user.id, user.legacySassId),
				orderService.getOrders(user.id, user.legacySassId),
				referralService.getReferrals(user.id, user.legacySassId),
				settingsService.getStoreInfo(),
				coinService.getUserCoins(user.id, user.legacySassId)
			]);
			if (requestId !== activeRequestRef.current) return;
			if (historyResult.status === "fulfilled") setCoinHistory(historyResult.value || []);
			else {
				console.error("Failed to load coin history:", historyResult.reason);
				setCoinHistory([]);
			}
			if (ordersResult.status === "fulfilled") setOrders(ordersResult.value || []);
			else {
				console.error("Failed to load user orders for VIP calculation:", ordersResult.reason);
				setOrders([]);
			}
			if (referralsResult.status === "fulfilled") setReferrals(referralsResult.value || []);
			else {
				console.error("Failed to load referrals:", referralsResult.reason);
				setReferrals([]);
			}
			let storeCandidateRate;
			if (storeResult.status === "fulfilled" && storeResult.value) {
				setStoreInfo(storeResult.value);
				storeCandidateRate = storeResult.value.coinValueInRupees;
			} else setStoreInfo(null);
			if (balanceResult.status === "fulfilled" && typeof balanceResult.value === "number") setVerifiedBalance(balanceResult.value);
			if (historyResult.status === "rejected" && balanceResult.status === "rejected") {
				const errorReason = historyResult.reason ?? balanceResult.reason;
				const msg = errorReason instanceof Error ? errorReason.message : "Failed to load rewards data from store.";
				setRewardsError(msg);
			}
			if (typeof storeCandidateRate === "number" && storeCandidateRate > 0 && storeCandidateRate !== .5) setConversionRate(storeCandidateRate);
			else setConversionRate(OFFICIAL_COIN_CONVERSION_RATE);
		} catch (err) {
			if (requestId !== activeRequestRef.current) return;
			console.error("Failed to load rewards data:", err);
			const msg = err instanceof Error ? err.message : "Failed to load rewards data from store.";
			setRewardsError(msg);
			setCoinHistory([]);
			setConversionRate(OFFICIAL_COIN_CONVERSION_RATE);
		} finally {
			if (requestId === activeRequestRef.current) setLoading(false);
		}
	}, [user?.id, user?.legacySassId]);
	(0, import_react.useEffect)(() => {
		loadRewardsData();
	}, [loadRewardsData]);
	const ledgerStats = (0, import_react.useMemo)(() => {
		return coinService.calculateLedgerStats(coinHistory);
	}, [coinHistory]);
	const effectiveConversionRate = (0, import_react.useMemo)(() => {
		const rawRate = storeInfo?.coinValueInRupees ?? conversionRate;
		if (typeof rawRate === "number" && rawRate > 0 && rawRate !== .5) return rawRate;
		return OFFICIAL_COIN_CONVERSION_RATE;
	}, [storeInfo, conversionRate]);
	const vipStats = (0, import_react.useMemo)(() => {
		const threshold = storeInfo?.vipSpendingThreshold || 5e3;
		return coinService.calculateVIPStatus(orders, threshold);
	}, [orders, storeInfo]);
	const referralStats = (0, import_react.useMemo)(() => {
		return referralService.calculateReferralStats(referrals, effectiveConversionRate);
	}, [referrals, effectiveConversionRate]);
	const filteredActivities = (0, import_react.useMemo)(() => {
		const now = Date.now();
		const nineMonthsMs = 23328e6;
		return coinHistory.filter((tx) => {
			if (activityFilter === "earned") return tx.type === "earned";
			if (activityFilter === "redeemed") return tx.type === "redeemed";
			if (activityFilter === "expiring") {
				const txAge = now - new Date(tx.timestamp).getTime();
				return tx.type === "earned" && txAge > nineMonthsMs;
			}
			return true;
		});
	}, [coinHistory, activityFilter]);
	const visibleActivities = (0, import_react.useMemo)(() => {
		return filteredActivities.slice(0, displayCount);
	}, [filteredActivities, displayCount]);
	const coinBalance = verifiedBalance ?? user?.smartCoins ?? user?.coins ?? ledgerStats.netBalance;
	const cashEquivalent = convertCoinsToRupees(coinBalance, effectiveConversionRate).toFixed(2);
	const handleCopyReferral = () => {
		const code = user?.referralCode || user?.id || "";
		if (!code) {
			toast.error("Referral code not available");
			return;
		}
		navigator.clipboard.writeText(code);
		toast.success(`Referral code "${code}" copied to clipboard!`);
	};
	const handleShareWhatsApp = () => {
		const code = user?.referralCode || user?.id || "";
		if (!code) {
			toast.error("Referral code not available");
			return;
		}
		const text = encodeURIComponent(`Hey! Order authentic cold-pressed oils, organic grains & heirloom spices from Sri Amman Smart Store. Use my code ${code} to get ₹100 off your first cart! https://sriammanstore.com/shop?ref=${code}`);
		window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
	};
	if ((authLoading || isResolvingIdentity) && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1000px] mx-auto px-margin-desktop py-20 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-9 h-9 border-3 border-[#005f3f] border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-on-surface-variant font-medium",
					children: "Loading Amman rewards & coins..."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1000px] mx-auto px-margin-desktop py-16 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-4xl mx-auto mb-4",
						children: "🪙"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-headline-lg text-xl font-bold text-on-surface mb-2",
						children: "Please Sign In to Access Amman Rewards & VIP Hub"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-on-surface-variant mb-6 max-w-md mx-auto",
						children: "Sign in with your mobile number to view your Smart Coins balance, transaction ledger, and VIP tier benefits."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						search: { redirect: "/rewards" },
						className: "inline-flex items-center gap-2 bg-[#005f3f] text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-[#004e33] transition-all",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sign In with Mobile OTP" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-[1320px] mx-auto px-margin-desktop py-space-xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "flex items-center gap-2 text-xs text-on-surface-variant mb-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/",
									className: "hover:text-primary transition-colors flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[14px]",
										children: "home"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Home" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-outline-variant",
									children: "›"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/account",
									className: "hover:text-primary transition-colors",
									children: "My Account"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-outline-variant",
									children: "›"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-on-surface font-semibold",
									children: "Smart Coins & VIP Hub"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-2 mb-2 flex-wrap",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-800 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "⭐" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Loyalty & VIP Privilege Suite" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight",
									children: "Smart Coins & VIP Privilege Hub"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs md:text-sm text-on-surface-variant mt-1 max-w-2xl",
									children: "Earn farm-direct rewards on every grocery order, redeem instant cash discounts, and unlock VIP free express slots."
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "shrink-0 flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 rounded-full px-4 py-2 shadow-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-emerald-600 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs font-extrabold text-emerald-900",
									children: [
										"Live Conversion: 1 Coin = ₹",
										effectiveConversionRate.toFixed(2),
										" Instant Cash"
									]
								})]
							})]
						}),
						loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-24 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-on-surface-variant font-medium",
								children: "Loading your rewards and coin balance..."
							})]
						}) : rewardsError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-surface-container-lowest rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto border border-red-200 my-12 shadow-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-3xl mx-auto mb-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[32px]",
										children: "cloud_off"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-headline-lg text-lg font-bold text-on-surface mb-2",
									children: "Unable to Load Rewards Data"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-on-surface-variant mb-6 leading-relaxed",
									children: rewardsError
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => loadRewardsData(),
									className: "bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer inline-flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[16px]",
										children: "refresh"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Retry" })]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "lg:col-span-7 bg-gradient-to-br from-[#fffdf5] via-[#fffbf0] to-[#fbf7eb] border border-amber-200/70 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mb-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center text-xl shadow-xs",
													children: "🪙"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-[10px] uppercase font-bold text-amber-800 tracking-wider block",
													children: "AVAILABLE BALANCE"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "font-headline-lg text-lg font-bold text-on-surface",
													children: "Smart Coins Vault"
												})] })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "bg-emerald-100/80 text-emerald-900 border border-emerald-200 text-[11px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1 shadow-xs",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "✔" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Verified & Ready" })]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap items-baseline gap-3 mb-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-lg text-4xl md:text-5xl font-black text-on-surface tracking-tight",
													children: coinBalance
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-headline-sm text-lg font-bold text-on-surface-variant",
													children: "Smart Coins"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "bg-cyan-50 text-cyan-800 border border-cyan-200 font-extrabold text-xs px-3 py-1 rounded-xl flex items-center gap-1 shadow-xs",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[15px]",
														children: "sell"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
														"Valued at ₹",
														cashEquivalent,
														" Cart Discount"
													] })]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-on-surface-variant leading-relaxed mb-6",
											children: "Apply seamlessly on your cart summary during checkout with no minimum order constraints. Valid across Mara Chekku Oils, Heirloom Rice, & Farm Fresh Greens."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-white/80 rounded-2xl p-3.5 border border-amber-200/40 flex items-center gap-3 shadow-xs",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[18px]",
														children: "trending_up"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] uppercase font-bold text-on-surface-variant block",
													children: "Earned this month"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-headline-sm text-sm font-extrabold text-emerald-800",
													children: [
														"+",
														ledgerStats.earnedThisMonth,
														" Coins"
													]
												})] })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-white/80 rounded-2xl p-3.5 border border-amber-200/40 flex items-center gap-3 shadow-xs",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-8 h-8 rounded-full bg-rose-100 text-rose-800 flex items-center justify-center shrink-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[18px]",
														children: "shopping_bag"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] uppercase font-bold text-on-surface-variant block",
													children: "Redeemed this month"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-headline-sm text-sm font-extrabold text-rose-700",
													children: [
														"-",
														ledgerStats.redeemedThisMonth,
														" Coins"
													]
												})] })]
											})]
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-3 pt-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/cart",
											className: "bg-[#005f3f] hover:bg-[#004e33] text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[18px]",
												children: "shopping_cart"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Redeem on Next Order" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: "#how-coins-work",
											className: "bg-surface-container hover:bg-surface-container-high text-on-surface px-5 py-3 rounded-2xl font-headline-sm text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "help"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "How to Earn More" })]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "lg:col-span-5 bg-[#102217] text-white rounded-3xl p-6 md:p-8 shadow-lg border border-[#1b3826] flex flex-col justify-between relative overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative z-10",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between mb-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xl shadow-xs",
														children: "👑"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-headline-sm text-[10px] uppercase font-bold text-amber-400 tracking-wider block",
														children: "PRIVILEGE STATUS"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
														className: "font-headline-lg text-lg font-bold text-white flex items-center gap-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: vipStats.isVIP ? "VIP Privilege Member" : "Standard Customer" }), vipStats.isVIP && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-amber-400",
															children: "★"
														})]
													})] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-right",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] uppercase font-extrabold text-white/60 block",
														children: "MEMBERSHIP"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-xs font-bold text-amber-300",
														children: vipStats.isVIP ? "Active (30-Day Window)" : "Rolling Evaluation"
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-white/5 rounded-2xl p-4 border border-white/10 mb-5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex justify-between text-xs font-bold mb-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "text-white/90",
															children: [
																"Spent ₹",
																vipStats.rollingSpend.toLocaleString("en-IN"),
																" of ₹5,000 threshold"
															]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "text-amber-400 font-extrabold",
															children: [vipStats.percentage, "% to VIP"]
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-full h-2.5 rounded-full bg-white/10 overflow-hidden mb-2",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-700",
															style: { width: `${vipStats.percentage}%` }
														})
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-[11px] text-white/70 leading-relaxed",
														children: vipStats.isVIP ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-emerald-400 font-semibold",
															children: "✔ ₹5,000 threshold achieved! You enjoy VIP wholesale prices and free express delivery."
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
															"Current 30-day delivered spend: ₹",
															vipStats.rollingSpend,
															". Spend ₹",
															Math.max(0, 5e3 - vipStats.rollingSpend).toLocaleString("en-IN"),
															" more within 30 days to qualify."
														] })
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2.5 mb-5 text-xs",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2.5 text-white/90",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-amber-400 text-[18px]",
															children: "bolt"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-medium",
															children: "Unlimited Free 60-Min Express Deliveries"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2.5 text-white/90",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-amber-400 text-[18px]",
															children: "percent"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-medium",
															children: "Guaranteed VIP Special Price Discounts"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-2.5 text-white/90",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-amber-400 text-[18px]",
															children: "toll"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-medium",
															children: "2X Smart Coin Accrual on Delivered Orders"
														})]
													})
												]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/80",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1 text-emerald-400 font-semibold",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "✔" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Evaluated in Real-Time" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
											to: "/help",
											className: "text-amber-300 hover:text-amber-200 font-bold transition-colors flex items-center gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "VIP Guidelines & Support" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[14px]",
												children: "arrow_forward"
											})]
										})]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "lg:col-span-7 bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between mb-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "font-headline-lg text-lg font-bold text-on-surface",
												children: "Coins Ledger & Activity"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-on-surface-variant mt-0.5",
												children: "Real-time trace of order rewards, campaign bonuses, and cart redemptions."
											})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => toast.success("Ledger statement downloaded."),
												className: "text-xs font-bold text-primary hover:text-primary-container flex items-center gap-1 transition-colors cursor-pointer",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[16px]",
													children: "download"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Statement" })]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 overflow-x-auto pb-3 mb-5 border-b border-outline-variant/15 scrollbar-none",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => setActivityFilter("all"),
													className: `px-3.5 py-1.5 rounded-full font-headline-sm text-xs font-bold transition-all cursor-pointer ${activityFilter === "all" ? "bg-[#005f3f] text-white shadow-xs" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`,
													children: "All Activities"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => setActivityFilter("earned"),
													className: `px-3.5 py-1.5 rounded-full font-headline-sm text-xs font-bold transition-all cursor-pointer ${activityFilter === "earned" ? "bg-[#005f3f] text-white shadow-xs" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`,
													children: "Coins Earned"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => setActivityFilter("redeemed"),
													className: `px-3.5 py-1.5 rounded-full font-headline-sm text-xs font-bold transition-all cursor-pointer ${activityFilter === "redeemed" ? "bg-[#005f3f] text-white shadow-xs" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`,
													children: "Coins Redeemed"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => setActivityFilter("expiring"),
													className: `px-3.5 py-1.5 rounded-full font-headline-sm text-xs font-bold transition-all cursor-pointer ${activityFilter === "expiring" ? "bg-[#005f3f] text-white shadow-xs" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"}`,
													children: "Expiring Soon"
												})
											]
										}),
										visibleActivities.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "py-12 text-center text-xs text-on-surface-variant",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-2xl mx-auto mb-2",
													children: "📋"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-bold text-on-surface",
													children: "No coin activities found"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "mt-1",
													children: "Transactions will appear as you place orders and redeem coins."
												})
											]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "space-y-3 mb-5",
											children: visibleActivities.map((tx) => {
												const isEarned = tx.type === "earned";
												const isOrder = tx.description.toLowerCase().includes("order");
												const isReferral = tx.description.toLowerCase().includes("referral");
												const isReview = tx.description.toLowerCase().includes("review");
												const cashVal = convertCoinsToRupees(tx.amount, effectiveConversionRate).toFixed(2);
												return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "bg-surface-container-low/60 hover:bg-surface-container-low rounded-2xl p-4 border border-outline-variant/15 flex items-center justify-between gap-3 transition-colors",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-3",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: `w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isEarned ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`,
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "material-symbols-outlined text-[20px]",
																children: isOrder ? isEarned ? "local_shipping" : "shopping_cart" : isReferral ? "group_add" : isReview ? "rate_review" : "toll"
															})
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex flex-wrap items-center gap-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-headline-sm text-xs font-bold text-on-surface",
																children: tx.description
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: `text-[9px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide ${isEarned ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`,
																children: isOrder ? isEarned ? "ORDER REWARD" : "CART DEDUCTION" : "COMMUNITY CREDIT"
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "text-[11px] text-on-surface-variant block mt-0.5",
															children: [new Date(tx.timestamp).toLocaleString("en-IN", {
																day: "numeric",
																month: "short",
																year: "numeric",
																hour: "2-digit",
																minute: "2-digit"
															}), " • Valid for 12 months"]
														})] })]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-right shrink-0",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: `font-headline-sm text-sm font-extrabold block ${isEarned ? "text-emerald-700" : "text-rose-600"}`,
															children: [isEarned ? `+${tx.amount}` : `-${tx.amount}`, " Coins"]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-[10px] text-on-surface-variant font-medium",
															children: isEarned ? `(+₹${cashVal} value)` : `(-₹${cashVal} applied)`
														})]
													})]
												}, tx.id);
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-outline-variant/15 text-xs text-on-surface-variant",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[15px]",
													children: "info"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Coins remain valid for a rolling 365 days from issue date." })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-[11px] font-bold",
													children: [
														"SHOWING ",
														visibleActivities.length,
														" OF ",
														filteredActivities.length,
														" RECORDS"
													]
												}), filteredActivities.length > displayCount && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => setDisplayCount((prev) => prev + 5),
													className: "bg-primary/10 hover:bg-primary/20 text-primary font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer",
													children: "Load More"
												})]
											})]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "lg:col-span-5 bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm flex flex-col justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "🤝" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "SHARE THE PURITY" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "font-headline-lg text-xl font-extrabold text-on-surface mb-2",
											children: "Give ₹100, Earn 100 Coins"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-on-surface-variant leading-relaxed mb-6",
											children: "Introduce your neighborhood to farm-pure Tamil Nadu groceries. Friends get ₹100 off their first cart, and you receive 100 Smart Coins instantly upon delivery."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-low/70 border border-outline-variant/25 rounded-2xl p-4 mb-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] uppercase font-bold text-on-surface-variant block mb-1 tracking-wider",
												children: "YOUR PERSONAL INVITATION CODE"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-mono text-lg font-black text-[#005f3f] tracking-wider",
													children: user.referralCode || user.id
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: handleCopyReferral,
													className: "bg-[#005f3f] hover:bg-[#004e33] text-white px-3.5 py-1.5 rounded-xl font-headline-sm text-xs font-bold flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[15px]",
														children: "content_copy"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Copy" })]
												})]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: handleShareWhatsApp,
											className: "w-full bg-[#25d366] hover:bg-[#20ba59] text-white py-3 rounded-2xl font-headline-sm text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 mb-6 cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-base",
												children: "💬"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Share via WhatsApp" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-low/40 rounded-2xl p-4 border border-outline-variant/15 mb-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between text-xs mb-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-semibold text-on-surface",
														children: "Community Impact:"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "font-bold text-on-surface",
														children: [referralStats.totalNeighbors, " Neighbors Joined"]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center justify-between text-xs mb-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-semibold text-on-surface",
														children: "Total Harvest Credit Earned:"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "font-extrabold text-emerald-800",
														children: ["₹", referralStats.totalCashCredit.toFixed(2)]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-wrap items-center gap-1.5 pt-2 border-t border-outline-variant/10 text-[10px]",
													children: [referrals.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "bg-surface-container px-2 py-0.5 rounded-md font-bold text-on-surface",
														children: [
															r.friendName.split(" ")[0],
															" (",
															r.status.includes("Completed") ? "✔ Done" : "⏳ Pending",
															")"
														]
													}, r.id)), referrals.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-on-surface-variant italic",
														children: "Share your link to invite your first neighbor!"
													})]
												})
											]
										})
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: "/policies",
										className: "text-center text-[11px] text-primary hover:underline font-bold block pt-2",
										children: "View Referral Rules & Fair Use Terms"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
								id: "how-coins-work",
								className: "mb-14 scroll-mt-32",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-center max-w-2xl mx-auto mb-8",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-headline-sm text-[11px] uppercase font-extrabold text-[#005f3f] tracking-wider block mb-1",
												children: "TRANSPARENT PURITY REWARDS"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
												className: "font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface",
												children: "How Smart Coins Work"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-on-surface-variant mt-1.5",
												children: "Every staple, vegetable, and cold-pressed oil bottle ordered brings tangible savings back to your kitchen table."
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/15 shadow-sm flex flex-col justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between mb-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "material-symbols-outlined text-[20px]",
																children: "shopping_bag"
															})
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-headline-sm text-xs font-black text-outline",
															children: "01"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
														className: "font-headline-sm text-base font-bold text-on-surface mb-2",
														children: "1. Shop Farm Fresh & Staples"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-on-surface-variant leading-relaxed mb-4",
														children: "Browse our seasonal harvest from Adyar, Thanjavur organic paddies, and local cold-press mills. Every ₹100 spent accrues loyalty coins instantly."
													})
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "bg-emerald-50 text-emerald-800 font-bold text-[10px] px-3 py-1 rounded-full border border-emerald-200/60 inline-block w-fit",
													children: "Base rate: ~10% loyalty coins on orders"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/15 shadow-sm flex flex-col justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between mb-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "material-symbols-outlined text-[20px]",
																children: "savings"
															})
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-headline-sm text-xs font-black text-outline",
															children: "02"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
														className: "font-headline-sm text-base font-bold text-on-surface mb-2",
														children: "2. Collect Automatically"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-on-surface-variant leading-relaxed mb-4",
														children: "No physical punch-cards or coupon clips needed. Smart Coins credit straight to your Vault the minute our delivery runner verifies doorstep handover."
													})
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "bg-amber-50 text-amber-800 font-bold text-[10px] px-3 py-1 rounded-full border border-amber-200/60 inline-block w-fit",
													children: "Instant credit on delivery verification"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "bg-surface-container-lowest rounded-3xl p-6 border border-outline-variant/15 shadow-sm flex flex-col justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center justify-between mb-4",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "material-symbols-outlined text-[20px]",
																children: "point_of_sale"
															})
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "font-headline-sm text-xs font-black text-outline",
															children: "03"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
														className: "font-headline-sm text-base font-bold text-on-surface mb-2",
														children: "3. Apply at Checkout"
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-on-surface-variant leading-relaxed mb-4",
														children: "Slide the Coins Reducer toggle on your checkout screen. Watch your bill instantly slash down at 1 Coin = ₹0.05 cash value. Combine freely with bank offers!"
													})
												] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "bg-cyan-50 text-cyan-800 font-bold text-[10px] px-3 py-1 rounded-full border border-cyan-200/60 inline-block w-fit",
													children: "No restrictive minimum cart limits"
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-primary/5 rounded-3xl p-6 border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[20px]",
													children: "support_agent"
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "font-headline-sm text-sm font-bold text-on-surface",
												children: "Have questions about Smart Coins or VIP Perks?"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-on-surface-variant",
												children: "Our neighborhood Adyar concierge team is available daily from 6:30 AM to 10:00 PM."
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3 shrink-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												href: "tel:+919840012345",
												className: "bg-surface-container-lowest border border-outline-variant/30 text-on-surface px-4 py-2 rounded-xl font-headline-sm text-xs font-bold hover:bg-surface-container transition-colors",
												children: "Call Support"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
												href: "https://api.whatsapp.com/send?phone=919840012345",
												target: "_blank",
												rel: "noreferrer",
												className: "bg-[#005f3f] hover:bg-[#004e33] text-white px-5 py-2 rounded-xl font-headline-sm text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "WhatsApp Us" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[14px]",
													children: "arrow_forward"
												})]
											})]
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-surface-container-lowest rounded-3xl p-6 md:p-8 border border-outline-variant/20 shadow-sm mb-12",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "font-headline-lg text-lg font-bold text-on-surface",
										children: "Sri Amman VIP Privilege Framework"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-on-surface-variant mt-0.5",
										children: "Transparent qualification standards based strictly on verified delivered grocery orders."
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "bg-amber-100/70 text-amber-900 border border-amber-300 font-extrabold text-[11px] px-3 py-1 rounded-full",
										children: vipStats.isVIP ? "You are currently VIP Privilege Qualified" : "Standard Customer Tier"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 md:grid-cols-2 gap-6 pt-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-surface-container-low/60 rounded-2xl p-5 border border-outline-variant/15",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 mb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-primary text-[20px]",
												children: "calendar_month"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "font-headline-sm text-sm font-bold text-on-surface",
												children: "Rolling 30-Day Evaluation"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-on-surface-variant leading-relaxed",
											children: "Qualification is recalculated dynamically every morning based on delivered orders placed within the last 30 calendar days. Achieving the ₹5,000 delivered spend threshold activates VIP status immediately."
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-surface-container-low/60 rounded-2xl p-5 border border-outline-variant/15",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 mb-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-primary text-[20px]",
												children: "verified"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "font-headline-sm text-sm font-bold text-on-surface",
												children: "Guaranteed VIP Benefits"
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
											className: "text-xs text-on-surface-variant space-y-1 list-disc pl-4 leading-relaxed",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Zero express surge fees and free doorstep delivery on all orders." }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Exclusive wholesale special prices on cold-pressed oils, ghee, and staples." }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "2X coin accrual multipliers on every delivered grocery basket." })
											]
										})]
									})]
								})]
							})
						] })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
var $$splitComponentImporter = () => import("./shop-CUkfvEVI.mjs");
var Route$2 = createFileRoute("/shop")({
	validateSearch: (search) => ({
		category: search["category"] || void 0,
		subCategory: search["subCategory"] || void 0,
		q: search["q"] || void 0,
		deals: Boolean(search["deals"]) || void 0,
		sort: search["sort"] || void 0
	}),
	head: () => ({ meta: [{ title: "Shop Groceries & Wood Pressed Oils — Sri Amman Smart Store" }, {
		name: "description",
		content: "Explore South Indian organic staples, grains, and oils."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
			destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
			outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
			secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
			ghost: "hover:bg-accent hover:text-accent-foreground",
			link: "text-primary underline-offset-4 hover:underline"
		},
		size: {
			default: "h-9 px-4 py-2",
			sm: "h-8 rounded-md px-3 text-xs",
			lg: "h-10 rounded-md px-8",
			icon: "h-9 w-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");
var Label = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label$1, {
	ref,
	className: cn(labelVariants(), className),
	...props
}));
Label.displayName = Label$1.displayName;
/**
* Validates the full customer registration form.
* Date of birth is saved strictly to the canonical `dob` field in YYYY-MM-DD format.
* Never collects or writes a duplicate `birthday` field.
*/
var customerRegistrationFormSchema = objectType({
	fullName: stringType().trim().min(2, "Full name must be at least 2 characters."),
	email: stringType().trim().email("Enter a valid email address.").toLowerCase(),
	password: stringType().min(6, "Password must be at least 6 characters."),
	confirmPassword: stringType().min(1, "Please confirm your password."),
	countryCode: stringType().regex(/^\+\d{1,4}$/, "Choose a valid country code."),
	phone: stringType().trim().regex(/^\d{10}$/, "Enter a valid 10-digit mobile number."),
	dob: stringType().optional().refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), "Date of birth must be in YYYY-MM-DD format."),
	gender: enumType([
		"male",
		"female",
		"other",
		"prefer_not_to_say",
		""
	]).optional(),
	referralCode: stringType().trim().optional(),
	termsAccepted: literalType(true, { errorMap: () => ({ message: "You must accept the terms and conditions." }) })
}).refine((data) => data.password === data.confirmPassword, {
	message: "Passwords do not match.",
	path: ["confirmPassword"]
});
objectType({
	countryCode: stringType().regex(/^\+\d{1,4}$/, "Choose a valid country code."),
	phone: stringType().trim().regex(/^\d{6,15}$/, "Enter a valid mobile number.")
});
/** Customer accounts support Email/Password and Google sign up without requiring Phone OTP. */
function getCustomerRegistrationMethods(mode) {
	return {
		phoneOtp: false,
		google: true,
		emailPassword: true
	};
}
var COUNTRY_CODES = [
	{
		code: "+91",
		label: "India (+91)"
	},
	{
		code: "+1",
		label: "USA/Canada (+1)"
	},
	{
		code: "+44",
		label: "UK (+44)"
	},
	{
		code: "+61",
		label: "Australia (+61)"
	},
	{
		code: "+971",
		label: "UAE (+971)"
	}
];
function CustomerRegistrationForm({ redirectTo }) {
	const { authMode, resolveFirebaseSession, logout } = useAuth();
	const navigate = useNavigate();
	const methods = getCustomerRegistrationMethods(authMode);
	const [fullName, setFullName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirmPassword, setConfirmPassword] = (0, import_react.useState)("");
	const [countryCode, setCountryCode] = (0, import_react.useState)("+91");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [dob, setDob] = (0, import_react.useState)("");
	const [gender, setGender] = (0, import_react.useState)("");
	const [referralCode, setReferralCode] = (0, import_react.useState)("");
	const [termsAccepted, setTermsAccepted] = (0, import_react.useState)(false);
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [showConfirmPassword, setShowConfirmPassword] = (0, import_react.useState)(false);
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [isGoogleSubmitting, setIsGoogleSubmitting] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	const [status, setStatus] = (0, import_react.useState)("");
	const [fieldErrors, setFieldErrors] = (0, import_react.useState)({});
	const [referralFeedback, setReferralFeedback] = (0, import_react.useState)(null);
	const [partialAuth, setPartialAuth] = (0, import_react.useState)(null);
	const navigateAfterRegistration = () => {
		navigate({ to: redirectTo || "/account" });
	};
	const clearFieldError = (field) => {
		if (fieldErrors[field]) setFieldErrors((prev) => {
			const next = { ...prev };
			delete next[field];
			return next;
		});
	};
	const handleReferralBlur = async () => {
		const clean = referralCode.trim().toUpperCase();
		if (!clean) {
			setReferralFeedback(null);
			return;
		}
		try {
			const res = await authService.validateReferralCode(clean);
			if (res.valid) setReferralFeedback(`Valid code: +${res.bonusCoins} bonus Smart Coins on first order!`);
			else setReferralFeedback(res.message);
		} catch {
			setReferralFeedback(null);
		}
	};
	/**
	* Completes customer profile creation and resolves the user's application session.
	*/
	const createCustomerProfileAndFinish = async (uid, targetEmail) => {
		const cleanName = fullName.trim();
		const cleanPhone = phone.replace(/\D/g, "");
		const cleanCountry = countryCode || "+91";
		const cleanDob = dob.trim() || null;
		const cleanGender = gender.trim() || null;
		const cleanReferral = referralCode.trim().toUpperCase() || null;
		setStatus("Setting up your customer profile…");
		const { profile } = await customerIdentityService.provisionCustomerAccount({
			uid,
			email: targetEmail,
			fullName: cleanName,
			number: cleanPhone,
			countryCode: cleanCountry,
			phoneVerified: false,
			dob: cleanDob,
			gender: cleanGender,
			referredBy: cleanReferral
		});
		setStatus("Finalizing your account session…");
		await resolveFirebaseSession({
			uid,
			email: targetEmail,
			emailVerified: false,
			phoneNumber: null,
			providerId: "firebase-email"
		}, { force: true });
		setStatus(`Welcome, ${profile.name || cleanName}! Your customer account is ready.`);
		setPartialAuth(null);
		setTimeout(() => {
			navigateAfterRegistration();
		}, 800);
	};
	/**
	* Main form submission handler.
	*/
	const handleSubmit = async (event) => {
		event.preventDefault();
		setError("");
		setStatus("");
		setFieldErrors({});
		const formData = {
			fullName,
			email,
			password,
			confirmPassword,
			countryCode,
			phone,
			dob: dob || void 0,
			gender: gender || void 0,
			referralCode: referralCode.trim() || void 0,
			termsAccepted
		};
		const parsed = customerRegistrationFormSchema.safeParse(formData);
		if (!parsed.success) {
			const errors = {};
			for (const issue of parsed.error.issues) {
				const fieldName = String(issue.path[0]);
				if (!errors[fieldName]) errors[fieldName] = issue.message;
			}
			setFieldErrors(errors);
			setError("Please correct the highlighted fields before submitting.");
			return;
		}
		if (!methods.emailPassword) {
			setError("Email and password registration is unavailable in this session.");
			return;
		}
		setIsSubmitting(true);
		let createdUid = partialAuth?.uid;
		try {
			if (!createdUid) {
				setStatus("Creating your login credentials…");
				createdUid = (await authManager.createUserWithEmailAndPassword(parsed.data.email, parsed.data.password)).uid;
				setPartialAuth({
					uid: createdUid,
					email: parsed.data.email
				});
			}
			await createCustomerProfileAndFinish(createdUid, parsed.data.email);
		} catch (cause) {
			const msg = cause instanceof Error ? cause.message : "Registration could not be completed.";
			setError(msg);
			if (createdUid) setPartialAuth({
				uid: createdUid,
				email: parsed.data.email
			});
		} finally {
			setIsSubmitting(false);
		}
	};
	/**
	* Retry handler for partial failure recovery.
	*/
	const handleRetryProfileSetup = async () => {
		if (!partialAuth) return;
		setError("");
		setStatus("");
		setIsSubmitting(true);
		try {
			await createCustomerProfileAndFinish(partialAuth.uid, partialAuth.email);
		} catch (cause) {
			const msg = cause instanceof Error ? cause.message : "Profile setup could not be completed.";
			setError(`Profile setup failed: ${msg}. You can try again or contact support.`);
		} finally {
			setIsSubmitting(false);
		}
	};
	const handleResetSession = async () => {
		await logout();
		setPartialAuth(null);
		setError("");
		setStatus("");
	};
	const handleGoogleSignUp = async () => {
		setError("");
		setStatus("");
		setFieldErrors({});
		if (!methods.google) {
			setError("Google sign-up is unavailable in this session.");
			return;
		}
		setIsGoogleSubmitting(true);
		try {
			setStatus("Signing in with Google…");
			const identity = await authManager.signInWithGoogle();
			if ((await resolveFirebaseSession({
				...identity,
				phoneNumber: identity.phoneNumber ?? null,
				providerId: "firebase-google"
			})).status === "resolved") {
				setStatus("Welcome back! Redirecting to your account…");
				navigateAfterRegistration();
				return;
			}
			setStatus("Setting up your customer profile…");
			const cleanEmail = identity.email || "";
			const cleanName = cleanEmail ? cleanEmail.split("@")[0] || "Customer" : "Customer";
			const cleanPhone = identity.phoneNumber ? identity.phoneNumber.replace(/\D/g, "").slice(-10) : "";
			await customerIdentityService.provisionCustomerAccount({
				uid: identity.uid,
				email: cleanEmail,
				fullName: cleanName,
				number: cleanPhone,
				countryCode: "+91",
				phoneVerified: Boolean(identity.phoneNumber)
			});
			await resolveFirebaseSession({
				...identity,
				phoneNumber: identity.phoneNumber ?? null,
				providerId: "firebase-google"
			}, { force: true });
			setStatus(`Welcome, ${cleanName}! Your customer account is ready.`);
			setTimeout(() => {
				navigateAfterRegistration();
			}, 800);
		} catch (cause) {
			setError(cause instanceof Error ? cause.message : "Google sign-up failed.");
		} finally {
			setIsGoogleSubmitting(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		"aria-label": "Customer sign up",
		children: [
			status && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "status",
				className: "flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3.5 text-sm text-primary",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "h-4 w-4 shrink-0 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: status
				})]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				role: "alert",
				className: "flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "mt-0.5 h-4 w-4 shrink-0 text-destructive" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-medium",
						children: error
					}), partialAuth && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs opacity-90",
						children: [
							"Your login credentials exist for ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: partialAuth.email }),
							". Use the button below to finish creating your customer profile without starting over."
						]
					})]
				})]
			}),
			partialAuth && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold text-amber-800 dark:text-amber-200",
						children: "Pending Profile Completion"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-amber-700 dark:text-amber-300",
						children: [
							"Your login account (",
							partialAuth.email,
							") is authenticated, but your profile needs to be completed in the database."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							disabled: isSubmitting,
							onClick: () => void handleRetryProfileSetup(),
							className: "bg-amber-600 hover:bg-amber-700 text-white",
							children: isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Retrying Profile Setup…"] }) : "Retry Profile Setup"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							disabled: isSubmitting,
							onClick: () => void handleResetSession(),
							children: "Start Over with Different Account"
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleSubmit,
				className: "space-y-4",
				noValidate: true,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								htmlFor: "reg-fullName",
								children: ["Full Name ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-destructive",
									children: "*"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "reg-fullName",
								name: "fullName",
								type: "text",
								autoComplete: "name",
								placeholder: "e.g. Arun Kumar",
								value: fullName,
								disabled: isSubmitting || isGoogleSubmitting,
								onChange: (e) => {
									setFullName(e.target.value);
									clearFieldError("fullName");
								},
								"aria-invalid": Boolean(fieldErrors.fullName),
								"aria-describedby": fieldErrors.fullName ? "reg-fullName-error" : void 0
							}),
							fieldErrors.fullName && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								id: "reg-fullName-error",
								className: "text-xs text-destructive",
								role: "alert",
								children: fieldErrors.fullName
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								htmlFor: "reg-email",
								children: ["Email Address ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-destructive",
									children: "*"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "reg-email",
								name: "email",
								type: "email",
								autoComplete: "email",
								placeholder: "e.g. arun@example.com",
								value: email,
								disabled: isSubmitting || isGoogleSubmitting || Boolean(partialAuth),
								onChange: (e) => {
									setEmail(e.target.value);
									clearFieldError("email");
								},
								"aria-invalid": Boolean(fieldErrors.email),
								"aria-describedby": fieldErrors.email ? "reg-email-error" : void 0
							}),
							fieldErrors.email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								id: "reg-email-error",
								className: "text-xs text-destructive",
								role: "alert",
								children: fieldErrors.email
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
									htmlFor: "reg-password",
									children: ["Password ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-destructive",
										children: "*"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "reg-password",
										name: "password",
										type: showPassword ? "text" : "password",
										autoComplete: "new-password",
										placeholder: "At least 6 characters",
										value: password,
										disabled: isSubmitting || isGoogleSubmitting || Boolean(partialAuth),
										onChange: (e) => {
											setPassword(e.target.value);
											clearFieldError("password");
											clearFieldError("confirmPassword");
										},
										className: "pr-10",
										"aria-invalid": Boolean(fieldErrors.password),
										"aria-describedby": fieldErrors.password ? "reg-password-error" : void 0
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setShowPassword((prev) => !prev),
										"aria-label": showPassword ? "Hide password visibility" : "Show password visibility",
										className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
										children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" })
									})]
								}),
								fieldErrors.password && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									id: "reg-password-error",
									className: "text-xs text-destructive",
									role: "alert",
									children: fieldErrors.password
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
									htmlFor: "reg-confirmPassword",
									children: ["Confirm Password ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-destructive",
										children: "*"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "reg-confirmPassword",
										name: "confirmPassword",
										type: showConfirmPassword ? "text" : "password",
										autoComplete: "new-password",
										placeholder: "Re-enter password",
										value: confirmPassword,
										disabled: isSubmitting || isGoogleSubmitting || Boolean(partialAuth),
										onChange: (e) => {
											setConfirmPassword(e.target.value);
											clearFieldError("confirmPassword");
										},
										className: "pr-10",
										"aria-invalid": Boolean(fieldErrors.confirmPassword),
										"aria-describedby": fieldErrors.confirmPassword ? "reg-confirmPassword-error" : void 0
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setShowConfirmPassword((prev) => !prev),
										"aria-label": showConfirmPassword ? "Hide confirm password visibility" : "Show confirm password visibility",
										className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
										children: showConfirmPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" })
									})]
								}),
								fieldErrors.confirmPassword && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									id: "reg-confirmPassword-error",
									className: "text-xs text-destructive",
									role: "alert",
									children: fieldErrors.confirmPassword
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								htmlFor: "reg-phone",
								children: ["Mobile Number ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-destructive",
									children: "*"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-[8.5rem_1fr] gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
									id: "reg-countryCode",
									"aria-label": "Country code",
									value: countryCode,
									disabled: isSubmitting || isGoogleSubmitting,
									onChange: (e) => setCountryCode(e.target.value),
									className: "h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
									children: COUNTRY_CODES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: item.code,
										children: item.label
									}, item.code))
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "reg-phone",
									name: "phone",
									type: "tel",
									inputMode: "numeric",
									autoComplete: "tel-national",
									maxLength: 10,
									placeholder: "10-digit mobile number",
									value: phone,
									disabled: isSubmitting || isGoogleSubmitting,
									onChange: (e) => {
										setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
										clearFieldError("phone");
									},
									"aria-invalid": Boolean(fieldErrors.phone),
									"aria-describedby": fieldErrors.phone ? "reg-phone-error" : void 0
								})]
							}),
							fieldErrors.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								id: "reg-phone-error",
								className: "text-xs text-destructive",
								role: "alert",
								children: fieldErrors.phone
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-on-surface-variant",
								children: "Used for delivery updates and contact. Phone OTP verification is optional now and will be verified at checkout."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-1 gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
									htmlFor: "reg-dob",
									children: ["Date of Birth ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-normal text-muted-foreground",
										children: "(Optional)"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
									id: "reg-dob",
									name: "dob",
									type: "date",
									value: dob,
									disabled: isSubmitting || isGoogleSubmitting,
									onChange: (e) => {
										setDob(e.target.value);
										clearFieldError("dob");
									},
									"aria-invalid": Boolean(fieldErrors.dob),
									"aria-describedby": fieldErrors.dob ? "reg-dob-error" : void 0
								}),
								fieldErrors.dob && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									id: "reg-dob-error",
									className: "text-xs text-destructive",
									role: "alert",
									children: fieldErrors.dob
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								htmlFor: "reg-gender",
								children: ["Gender ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-normal text-muted-foreground",
									children: "(Optional)"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: "reg-gender",
								name: "gender",
								value: gender,
								disabled: isSubmitting || isGoogleSubmitting,
								onChange: (e) => {
									setGender(e.target.value);
									clearFieldError("gender");
								},
								className: "h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "",
										children: "Select gender"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "male",
										children: "Male"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "female",
										children: "Female"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "other",
										children: "Other"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "prefer_not_to_say",
										children: "Prefer not to say"
									})
								]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Label, {
								htmlFor: "reg-referralCode",
								children: ["Referral Code ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-normal text-muted-foreground",
									children: "(Optional)"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								id: "reg-referralCode",
								name: "referralCode",
								type: "text",
								placeholder: "e.g. SASS0000104 or AMMAN50",
								value: referralCode,
								disabled: isSubmitting || isGoogleSubmitting,
								onChange: (e) => {
									setReferralCode(e.target.value.toUpperCase());
									setReferralFeedback(null);
								},
								onBlur: handleReferralBlur,
								className: "font-mono uppercase"
							}),
							referralFeedback && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-primary font-medium",
								children: referralFeedback
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1 pt-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-start gap-2.5 text-sm text-on-surface cursor-pointer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								id: "reg-terms",
								name: "termsAccepted",
								type: "checkbox",
								checked: termsAccepted,
								disabled: isSubmitting || isGoogleSubmitting,
								onChange: (e) => {
									setTermsAccepted(e.target.checked);
									clearFieldError("termsAccepted");
								},
								className: "mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "leading-tight text-xs sm:text-sm text-on-surface-variant",
								children: [
									"I agree to the",
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
										href: "/help",
										target: "_blank",
										rel: "noreferrer",
										className: "text-primary underline",
										children: "Terms and Conditions"
									}),
									" ",
									"and Privacy Policy."
								]
							})]
						}), fieldErrors.termsAccepted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							id: "reg-terms-error",
							className: "text-xs text-destructive",
							role: "alert",
							children: fieldErrors.termsAccepted
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full text-base font-semibold py-6 shadow-sm",
						disabled: isSubmitting || isGoogleSubmitting,
						children: isSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin" }), "Creating Account…"] }) : "Create Account"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex items-center justify-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 flex items-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-full border-t border-border" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "relative bg-surface-container-lowest px-3 text-xs uppercase tracking-wider text-muted-foreground",
					children: "Or continue with"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "button",
				variant: "outline",
				className: "w-full py-5 font-medium",
				disabled: isGoogleSubmitting || isSubmitting || !methods.google,
				onClick: () => void handleGoogleSignUp(),
				children: isGoogleSubmitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }), "Connecting to Google…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
						className: "h-4 w-4",
						viewBox: "0 0 24 24",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								fill: "#4285F4",
								d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								fill: "#34A853",
								d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								fill: "#FBBC05",
								d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								fill: "#EA4335",
								d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Continue with Google" })]
				})
			})
		]
	});
}
var Route$1 = createFileRoute("/sign-up")({
	validateSearch: (search) => {
		const redirect = typeof search["redirect"] === "string" ? search["redirect"] : void 0;
		return redirect?.startsWith("/") && !redirect.startsWith("//") ? { redirect } : {};
	},
	head: () => ({ meta: [{ title: "Create a Customer Account — Sri Amman Smart Store" }, {
		name: "description",
		content: "Create a Sri Amman Smart Store customer account."
	}] }),
	component: SignUpPage
});
function SignUpPage() {
	const { redirect } = useSearch({ from: "/sign-up" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "min-h-screen bg-surface px-4 py-12 text-on-surface sm:px-6 lg:px-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-2xl",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-[28px] border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-[0_24px_60px_rgba(17,24,39,0.08)] sm:p-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] font-bold uppercase tracking-[0.22em] text-primary",
								children: "Customer account"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-2xl font-bold tracking-tight text-on-surface sm:text-3xl",
								children: "Create your account"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-relaxed text-on-surface-variant",
								children: redirect?.startsWith("/checkout") ? "Create your account to continue checkout. Your selected cart items are saved and will be ready when you return." : "Create your customer account with email and password to start shopping at Sri Amman Smart Store."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerRegistrationForm, { redirectTo: redirect }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-6 text-center text-sm text-on-surface-variant",
						children: [
							"Already have an account?",
							" ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/login",
								search: redirect ? { redirect } : void 0,
								className: "font-bold text-primary underline-offset-4 hover:underline",
								children: "Login"
							})
						]
					})
				]
			})
		})
	});
}
var Route = createFileRoute("/wishlist")({
	head: () => ({ meta: [{ title: "Wishlist & Curated Collections — Sri Amman Smart Store" }, {
		name: "description",
		content: "Save your favorite farm-pressed staples and seasonal produce for frictionless replenishment and rapid 60-min delivery."
	}] }),
	component: WishlistPage
});
function WishlistPage() {
	const { user, isLoading: authLoading, isResolvingIdentity } = useAuth();
	const { addToCart } = useCart();
	const { wishlistItems, wishlists, activeWishlistId, setActiveWishlistId, isLoading, error: wishlistError, isWishlisted, toggleWishlist, removeWishlistItem, createCollection, renameCollection, deleteCollection, moveItemToCollection, refreshWishlist } = useWishlist();
	const [allProducts, setAllProducts] = (0, import_react.useState)([]);
	const [loadingCatalog, setLoadingCatalog] = (0, import_react.useState)(true);
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [sortBy, setSortBy] = (0, import_react.useState)("recent");
	const [showCreateModal, setShowCreateModal] = (0, import_react.useState)(false);
	const [createTitle, setCreateTitle] = (0, import_react.useState)("");
	const [createDesc, setCreateDesc] = (0, import_react.useState)("");
	const [showRenameModal, setShowRenameModal] = (0, import_react.useState)(false);
	const [renameTargetId, setRenameTargetId] = (0, import_react.useState)(null);
	const [renameTitle, setRenameTitle] = (0, import_react.useState)("");
	const [renameDesc, setRenameDesc] = (0, import_react.useState)("");
	const [showDeleteModal, setShowDeleteModal] = (0, import_react.useState)(false);
	const [deleteTargetId, setDeleteTargetId] = (0, import_react.useState)(null);
	const [movingItemId, setMovingItemId] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		let isMounted = true;
		async function loadCatalog() {
			try {
				const prods = await productService.getProducts();
				if (isMounted) setAllProducts(prods || []);
			} catch (err) {
				console.error("Failed to load catalog products:", err);
			} finally {
				if (isMounted) setLoadingCatalog(false);
			}
		}
		loadCatalog();
		return () => {
			isMounted = false;
		};
	}, []);
	const currentFolderItems = (0, import_react.useMemo)(() => {
		if (activeWishlistId === "all") return wishlistItems;
		return wishlistItems.filter((i) => i.wishlistId === activeWishlistId);
	}, [wishlistItems, activeWishlistId]);
	const collectionCounts = (0, import_react.useMemo)(() => {
		const map = { all: wishlistItems.length };
		for (const wl of wishlists) map[wl.id] = wishlistItems.filter((i) => i.wishlistId === wl.id).length;
		return map;
	}, [wishlists, wishlistItems]);
	const enrichedItems = (0, import_react.useMemo)(() => {
		return currentFolderItems.map((item) => {
			const catalogProd = allProducts.find((p) => p.id === item.productId);
			const opt = catalogProd?.options?.[item.optionIndex] || catalogProd?.options?.[0];
			const stock = opt?.stock ?? 0;
			const inStock = stock > 0 && catalogProd?.isActive !== false;
			const mrp = opt?.mrp ?? item.mrp;
			const price = user?.isVIP && opt?.specialPrice && opt.specialPrice > 0 ? opt.specialPrice : opt?.offerPrice ?? item.price;
			const savings = Math.max(0, mrp - price);
			const discountPercent = mrp > 0 && savings > 0 ? Math.round(savings / mrp * 100) : 0;
			const tag = catalogProd?.tags?.[0] || catalogProd?.category || "STAPLE";
			return {
				...item,
				catalogProd,
				stock,
				inStock,
				mrp,
				price,
				savings,
				discountPercent,
				tag
			};
		});
	}, [
		currentFolderItems,
		allProducts,
		user?.isVIP
	]);
	const filteredItems = (0, import_react.useMemo)(() => {
		if (!searchQuery.trim()) return enrichedItems;
		const q = searchQuery.toLowerCase().trim();
		return enrichedItems.filter((item) => item.name.toLowerCase().includes(q) || item.unit.toLowerCase().includes(q) || item.tag.toLowerCase().includes(q));
	}, [enrichedItems, searchQuery]);
	const sortedItems = (0, import_react.useMemo)(() => {
		const list = [...filteredItems];
		switch (sortBy) {
			case "price_asc": return list.sort((a, b) => a.price - b.price);
			case "price_desc": return list.sort((a, b) => b.price - a.price);
			case "savings": return list.sort((a, b) => b.savings - a.savings);
			case "name": return list.sort((a, b) => a.name.localeCompare(b.name));
			default: return list;
		}
	}, [filteredItems, sortBy]);
	const inStockCount = (0, import_react.useMemo)(() => {
		return enrichedItems.filter((i) => i.inStock).length;
	}, [enrichedItems]);
	const totalVipSavings = (0, import_react.useMemo)(() => {
		let total = 0;
		for (const item of enrichedItems) if (item.inStock && item.catalogProd) {
			const opt = item.catalogProd.options?.[item.optionIndex] || item.catalogProd.options?.[0];
			if (opt?.specialPrice && opt.offerPrice && opt.specialPrice < opt.offerPrice) total += opt.offerPrice - opt.specialPrice;
		}
		return total;
	}, [enrichedItems]);
	const recommendations = (0, import_react.useMemo)(() => {
		if (allProducts.length === 0 || wishlistItems.length === 0) return [];
		const savedProductIds = new Set(wishlistItems.map((i) => i.productId));
		const scoredMap = /* @__PURE__ */ new Map();
		for (const savedItem of wishlistItems) {
			const targetProd = allProducts.find((p) => p.id === savedItem.productId);
			if (!targetProd) continue;
			for (const candidate of allProducts) {
				if (savedProductIds.has(candidate.id) || candidate.isActive === false) continue;
				const score = calculateComplementaryScore(targetProd, candidate, savedProductIds);
				if (score > 0) {
					const current = scoredMap.get(candidate.id);
					if (!current || score > current.score) scoredMap.set(candidate.id, {
						product: candidate,
						score
					});
				}
			}
		}
		return Array.from(scoredMap.values()).filter((entry) => hasAvailableStock(entry.product)).sort((a, b) => b.score - a.score).slice(0, 4).map((entry) => entry.product);
	}, [allProducts, wishlistItems]);
	const handleAddToCart = async (item) => {
		const prod = item.catalogProd || allProducts.find((p) => p.id === item.productId);
		if (!prod) {
			toast.error("Product details currently unavailable");
			return;
		}
		try {
			await addToCart(prod, item.optionIndex, 1);
			toast.success(`Added ${item.name} to cart`);
		} catch (err) {
			toast.error(err.message || "Could not add to cart");
		}
	};
	const handleMoveAllInStockToCart = async () => {
		if (inStockCount === 0) {
			toast.error("No in-stock items available to move");
			return;
		}
		try {
			const isVIP = !!user?.isVIP;
			const result = await wishlistService.moveAllInStockToCart(activeWishlistId, allProducts, user?.id, isVIP);
			if (result.addedCount > 0) if (result.skippedCount > 0) toast.success(`Added ${result.addedCount} items to cart. Skipped ${result.skippedCount} out-of-stock items.`);
			else toast.success(`Added all ${result.addedCount} in-stock items to your cart!`);
			else toast.error("Could not add items. Products may be currently out of stock.");
		} catch (err) {
			toast.error(err.message || "Failed to batch move items to cart");
		}
	};
	const handleCreateCollection = async (e) => {
		e.preventDefault();
		if (!createTitle.trim()) return;
		try {
			const created = await createCollection(createTitle.trim(), createDesc.trim());
			setActiveWishlistId(created.id);
			setShowCreateModal(false);
			setCreateTitle("");
			setCreateDesc("");
			toast.success(`Created collection "${created.title}"!`);
		} catch (err) {
			toast.error(err.message || "Failed to create collection");
		}
	};
	const handleRenameCollection = async (e) => {
		e.preventDefault();
		if (!renameTargetId || !renameTitle.trim()) return;
		try {
			const updated = await renameCollection(renameTargetId, renameTitle.trim(), renameDesc.trim());
			setShowRenameModal(false);
			setRenameTargetId(null);
			setRenameTitle("");
			setRenameDesc("");
			toast.success(`Collection renamed to "${updated.title}"!`);
		} catch (err) {
			toast.error(err.message || "Failed to rename collection");
		}
	};
	const handleDeleteCollection = async () => {
		if (!deleteTargetId) return;
		try {
			await deleteCollection(deleteTargetId);
			setShowDeleteModal(false);
			setDeleteTargetId(null);
			toast.success("Collection deleted. Saved items moved to All Saved Items.");
		} catch (err) {
			toast.error(err.message || "Failed to delete collection");
		}
	};
	const handleMoveProduct = async (itemId, targetId) => {
		try {
			await moveItemToCollection(itemId, targetId);
			setMovingItemId(null);
			const targetName = targetId === "wl_default" ? "All Saved Staples" : wishlists.find((w) => w.id === targetId)?.title || "Collection";
			toast.success(`Moved item to ${targetName}`);
		} catch (err) {
			toast.error(err.message || "Failed to move item");
		}
	};
	const handleRemoveItem = async (id, name) => {
		try {
			await removeWishlistItem(id);
			toast.info(`Removed ${name} from saved staples`);
		} catch (err) {
			toast.error(err.message || "Failed to remove item");
		}
	};
	if ((authLoading || isResolvingIdentity) && !user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1000px] mx-auto px-margin-desktop py-20 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-on-surface-variant font-medium",
					children: "Loading your wishlist..."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "w-full pt-[172px] max-w-[1000px] mx-auto px-margin-desktop py-16 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-4xl mx-auto mb-4",
						children: "❤️"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-headline-lg text-xl font-bold text-on-surface mb-2",
						children: "Please Sign In to Access Your Wishlist"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-on-surface-variant mb-6 max-w-md mx-auto",
						children: "Sign in with your mobile number to view and manage your saved items, curated monthly staples, and synchronized pantry lists."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/login",
						search: { redirect: "/wishlist" },
						className: "inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sign In with Mobile OTP" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreFooter, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
	const activeCollectionObj = wishlists.find((w) => w.id === activeWishlistId);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-surface font-body-md text-on-surface antialiased min-h-screen",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreHeader, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
				className: "w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-[1320px] mx-auto px-margin-desktop py-space-xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
							className: "flex items-center gap-2 text-xs text-on-surface-variant mb-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/",
									className: "hover:text-primary transition-colors flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[14px]",
										children: "home"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Home" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-outline-variant",
									children: "›"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/account",
									className: "hover:text-primary transition-colors",
									children: "My Account"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-outline-variant",
									children: "›"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-on-surface font-semibold",
									children: "My Wishlist"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-2 mb-2 flex-wrap",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "inline-flex items-center gap-1.5 bg-primary/10 text-primary text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "💚" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Personal Sourcing Vault" })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface tracking-tight",
									children: "Wishlist & Curated Collections"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs md:text-sm text-on-surface-variant mt-1 max-w-2xl",
									children: "Save your favorite farm-pressed staples and seasonal produce for frictionless replenishment and rapid 60-min delivery."
								})
							] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "shrink-0 flex items-center gap-3 bg-amber-500/10 border border-amber-500/25 rounded-2xl px-4 py-2.5 shadow-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-700 text-lg font-bold",
									children: "🪙"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-headline-sm text-[10px] uppercase font-bold text-amber-800 tracking-wider block",
									children: user.isVIP ? "VIP Member Price" : "VIP Club Member"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-headline-sm text-xs font-extrabold text-emerald-800",
									children: user.isVIP ? `Extra ₹${totalVipSavings > 0 ? totalVipSavings : 85} Savings Active` : "Exclusive Club Savings Available"
								})] })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-3 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-outline-variant/15",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setActiveWishlistId("all"),
									className: `px-4 py-2 rounded-full font-headline-sm text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeWishlistId === "all" ? "bg-[#005f3f] text-white shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[16px]",
											children: "bookmark"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "All Saved Staples" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeWishlistId === "all" ? "bg-white/20 text-white" : "bg-surface-container text-on-surface"}`,
											children: collectionCounts["all"] ?? 0
										})
									]
								}), wishlists.map((wl) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setActiveWishlistId(wl.id),
									className: `px-4 py-2 rounded-full font-headline-sm text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${activeWishlistId === wl.id ? "bg-[#005f3f] text-white shadow-sm" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"}`,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[16px]",
											children: wl.title.toLowerCase().includes("pantry") || wl.title.toLowerCase().includes("monthly") ? "event_note" : "inventory_2"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: wl.title }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `text-[10px] px-2 py-0.5 rounded-full font-extrabold ${activeWishlistId === wl.id ? "bg-white/20 text-white" : "bg-surface-container text-on-surface"}`,
											children: collectionCounts[wl.id] ?? 0
										})
									]
								}, wl.id))]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => setShowCreateModal(true),
								className: "px-4 py-2 rounded-full font-headline-sm text-xs font-bold shrink-0 bg-surface-container-lowest border border-dashed border-primary/40 text-primary hover:bg-primary/5 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[16px]",
									children: "add"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Create New Collection" })]
							})]
						}),
						activeCollectionObj && activeWishlistId !== "all" && activeWishlistId !== "wl_default" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between bg-surface-container-low/60 rounded-2xl px-4 py-2.5 mb-5 text-xs text-on-surface-variant",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[18px] text-primary",
										children: "folder_open"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-bold text-on-surface",
										children: activeCollectionObj.title
									}),
									activeCollectionObj.description && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-outline hidden sm:inline",
										children: ["• ", activeCollectionObj.description]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => {
											setRenameTargetId(activeCollectionObj.id);
											setRenameTitle(activeCollectionObj.title);
											setRenameDesc(activeCollectionObj.description || "");
											setShowRenameModal(true);
										},
										className: "hover:text-primary transition-colors flex items-center gap-1 font-semibold cursor-pointer",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[15px]",
											children: "edit"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Rename" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-outline-variant",
										children: "|"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => {
											setDeleteTargetId(activeCollectionObj.id);
											setShowDeleteModal(true);
										},
										className: "text-rose-600 hover:text-rose-700 transition-colors flex items-center gap-1 font-semibold cursor-pointer",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[15px]",
											children: "delete"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delete" })]
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative flex-1 max-w-md",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]",
										children: "search"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: searchQuery,
										onChange: (e) => setSearchQuery(e.target.value),
										placeholder: "Filter saved staples by name or brand...",
										className: "w-full bg-surface-container-lowest border border-outline-variant/30 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
									}),
									searchQuery && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setSearchQuery(""),
										className: "absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[16px]",
											children: "close"
										})
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between sm:justify-end gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5 text-xs text-on-surface-variant",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "shrink-0 font-medium",
										children: "Sort by:"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: sortBy,
										onChange: (e) => setSortBy(e.target.value),
										className: "bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 py-2 text-xs font-bold text-on-surface focus:outline-none cursor-pointer shadow-xs",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "recent",
												children: "Recently Added"
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
												value: "savings",
												children: "Biggest Savings"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "name",
												children: "Name (A-Z)"
											})
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: handleMoveAllInStockToCart,
									disabled: inStockCount === 0,
									className: `px-5 py-2.5 rounded-full font-headline-sm text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${inStockCount > 0 ? "bg-[#005f3f] hover:bg-[#004e33] text-white shadow-sm" : "bg-surface-container text-outline cursor-not-allowed"}`,
									title: inStockCount > 0 ? "Move all in-stock items to cart" : "No in-stock items to add",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[17px]",
										children: "shopping_cart"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"Move All In-Stock to Cart (",
										inStockCount,
										" items)"
									] })]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-xs text-amber-900 font-medium",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-amber-700 text-[18px]",
									children: "info"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Prices and inventory refresh automatically in real-time. Staples remain available until completed checkout." })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-extrabold text-amber-800 tracking-wider uppercase bg-amber-500/20 px-2.5 py-1 rounded-lg shrink-0",
								children: "ADYAR HUB: FAST STOCK"
							})]
						}),
						isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-16 text-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-on-surface-variant",
								children: "Loading your saved items..."
							})]
						}) : wishlistError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-surface-container-lowest rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto border border-red-200 my-12 shadow-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-3xl mx-auto mb-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[32px]",
										children: "cloud_off"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-headline-lg text-lg font-bold text-on-surface mb-2",
									children: "Unable to Load Wishlist"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-on-surface-variant mb-6 leading-relaxed",
									children: wishlistError
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => refreshWishlist(),
									className: "bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer inline-flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[16px]",
										children: "refresh"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Retry" })]
								})
							]
						}) : sortedItems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-surface-container-lowest rounded-3xl p-12 text-center max-w-md mx-auto border border-outline-variant/20 shadow-sm my-12",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-3xl mx-auto mb-4",
									children: "❤️"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "font-headline-lg text-lg font-bold text-on-surface mb-2",
									children: searchQuery ? "No Matching Saved Items" : "No Saved Items in this Collection"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-on-surface-variant mb-6 leading-relaxed",
									children: searchQuery ? "Try clearing your search query or switching collections." : "Tap the heart icon on any product in our farm-fresh catalog to save items for quick 60-min reordering."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/shop",
									className: "inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[16px]",
										children: "storefront"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Explore Catalog" })]
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-16",
							children: sortedItems.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative aspect-square rounded-2xl overflow-hidden bg-surface-container-low mb-3 flex items-center justify-center p-3.5 border border-outline-variant/10",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: item.image,
												alt: item.name,
												className: "max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300 drop-shadow-sm select-none",
												loading: "lazy"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "absolute top-2 left-2 flex flex-col gap-1 z-10",
												children: [
													item.discountPercent > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "bg-rose-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow-xs",
														children: [item.discountPercent, "% OFF"]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "bg-[#005f3f] text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-xs flex items-center gap-0.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "⚡" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "60M" })]
													}),
													item.tag && item.tag !== "STAPLE" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "bg-surface-container-lowest/90 text-on-surface font-extrabold text-[9px] uppercase px-2 py-0.5 rounded-md shadow-xs tracking-wider",
														children: item.tag
													})
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => handleRemoveItem(item.id, item.name),
												className: "absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-lowest/95 text-rose-600 flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer z-10",
												title: "Remove from saved staples",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[19px] fill-current",
													style: { fontVariationSettings: "'FILL' 1" },
													children: "favorite"
												})
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mb-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] uppercase font-bold text-primary tracking-wider block mb-1",
												children: item.tag
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "font-headline-sm text-sm font-bold text-on-surface line-clamp-2 leading-snug mb-1",
												children: item.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-on-surface-variant block",
												children: [
													"Pack: ",
													item.unitSize,
													" ",
													item.unit
												]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline gap-2 mb-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "font-headline-sm text-base font-extrabold text-primary",
												children: ["₹", item.price]
											}),
											item.mrp > item.price && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-xs text-outline line-through",
												children: ["₹", item.mrp]
											}),
											item.savings > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: "text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded",
												children: ["Save ₹", item.savings]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center gap-1.5 text-[11px] mb-3",
										children: item.inStock ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-emerald-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-emerald-800 font-semibold",
											children: "In Stock • Rapid Dispatch"
										})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-rose-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-rose-600 font-semibold",
											children: "Temporarily Out of Stock"
										})] })
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-2 pt-2 border-t border-outline-variant/10",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => handleAddToCart(item),
										disabled: !item.inStock,
										className: `w-full py-2.5 rounded-xl font-headline-sm text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${item.inStock ? "bg-primary-fixed hover:bg-primary-fixed-dim text-on-primary-fixed shadow-xs" : "bg-surface-container text-outline cursor-not-allowed"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[16px]",
											children: item.inStock ? "add_shopping_cart" : "block"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.inStock ? "+ Add to Cart" : "Out of Stock" })]
									}), wishlists.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "relative",
										children: movingItemId === item.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bg-surface-container-low rounded-xl p-2 border border-outline-variant/20 space-y-1",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] font-bold text-on-surface-variant block mb-1",
													children: "Move to Collection:"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-col gap-1 max-h-24 overflow-y-auto",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => handleMoveProduct(item.id, "wl_default"),
														className: "text-left text-[11px] px-2 py-1 rounded hover:bg-surface-container font-medium text-on-surface",
														children: "All Saved Items"
													}), wishlists.map((wl) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => handleMoveProduct(item.id, wl.id),
														className: "text-left text-[11px] px-2 py-1 rounded hover:bg-surface-container font-medium text-on-surface truncate",
														children: wl.title
													}, wl.id))]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => setMovingItemId(null),
													className: "text-[10px] text-outline hover:text-on-surface block w-full text-right pt-1",
													children: "Cancel"
												})
											]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setMovingItemId(item.id),
											className: "w-full text-center text-[10px] font-bold text-on-surface-variant hover:text-primary transition-colors py-1 cursor-pointer",
											children: "Move to Collection ▾"
										})
									})]
								})]
							}, item.id))
						}),
						recommendations.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "mb-14",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-headline-sm text-[11px] uppercase font-extrabold text-amber-700 tracking-wider block mb-1",
										children: "SUGGESTED FROM YOUR HABITS"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-headline-lg text-2xl font-extrabold text-on-surface",
										children: "Recommendations Based on Your Saved Items"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-on-surface-variant mt-1",
										children: "Complementary staples frequently bought together with cold-pressed oils and organic grains."
									})
								] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
									to: "/shop",
									className: "inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-container transition-colors shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Explore All Essentials" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[16px]",
										children: "arrow_forward"
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md",
								children: recommendations.map((prod) => {
									const opt = prod.options[0];
									const wish = isWishlisted(prod.id);
									const badgeText = prod.tags?.[0] || prod.category || "FRESH HARVEST";
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "bg-surface-container-lowest rounded-3xl p-4 border border-outline-variant/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative aspect-square rounded-2xl overflow-hidden bg-surface-container-low mb-3 flex items-center justify-center p-3.5 border border-outline-variant/10",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: prod.imageUrl,
													alt: prod.name,
													className: "max-w-full max-h-full object-contain hover:scale-105 transition-transform duration-300 drop-shadow-sm select-none",
													loading: "lazy"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: async () => {
														try {
															await toggleWishlist(prod, 0);
														} catch (err) {
															toast.error(err.message || "Could not update wishlist");
														}
													},
													className: "absolute top-2 right-2 w-8 h-8 rounded-full bg-surface-container-lowest/95 text-rose-600 flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer",
													title: wish ? "Remove from wishlist" : "Add to wishlist",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "material-symbols-outlined text-[18px]",
														style: { fontVariationSettings: wish ? "'FILL' 1" : "'FILL' 0" },
														children: "favorite"
													})
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] uppercase font-extrabold text-primary tracking-wider block mb-1",
												children: badgeText
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "font-headline-sm text-sm font-bold text-on-surface line-clamp-1 mb-1",
												children: prod.name
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-on-surface-variant block mb-2",
												children: opt ? `${opt.unitSize} ${opt.unit} Regular Pack` : "Standard Pack"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-baseline gap-2 mb-4",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "font-headline-sm text-base font-extrabold text-on-surface",
													children: ["₹", opt?.offerPrice || opt?.mrp]
												}), opt && opt.mrp > (opt.offerPrice || opt.mrp) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-xs text-outline line-through",
													children: ["₹", opt.mrp]
												})]
											})
										] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => {
												addToCart(prod, 0, 1);
												toast.success(`Added ${prod.name} to cart`);
											},
											className: "w-full bg-primary/10 hover:bg-primary/20 text-primary py-2.5 rounded-xl font-headline-sm text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[16px]",
												children: "add"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Add to Cart" })]
										})]
									}, prod.id);
								})
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "bg-primary/5 rounded-3xl p-6 md:p-8 border border-primary/10 grid grid-cols-1 md:grid-cols-3 gap-6 mb-12",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[22px]",
											children: "sync"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "font-headline-sm text-sm font-bold text-on-surface mb-1",
										children: "Live Stock Calibration"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-on-surface-variant leading-relaxed",
										children: "Wishlist prices reflect active morning market harvests directly from our Adyar processing facility."
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[22px]",
											children: "sell"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "font-headline-sm text-sm font-bold text-on-surface mb-1",
										children: "VIP Auto-Apply"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-on-surface-variant leading-relaxed",
										children: "Exclusive club savings and coin multipliers are dynamically locked in as you move items to the cart."
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-3.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[22px]",
											children: "local_shipping"
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "font-headline-sm text-sm font-bold text-on-surface mb-1",
										children: "Instant Adyar Dispatch"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-on-surface-variant leading-relaxed",
										children: "60-minute doorstep fulfillment for Adyar, Besant Nagar, Thiruvanmiyur, and surrounding corridors."
									})] })]
								})
							]
						})
					]
				})
			}),
			showCreateModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-surface-container-lowest rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-200",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "font-headline-lg text-base font-bold text-on-surface",
							children: "Create New Collection"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setShowCreateModal(false),
							className: "text-outline hover:text-on-surface",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "material-symbols-outlined text-[18px]",
								children: "close"
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleCreateCollection,
						className: "space-y-3 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-on-surface block mb-1",
								children: "Collection Title"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								required: true,
								value: createTitle,
								onChange: (e) => setCreateTitle(e.target.value),
								placeholder: "e.g. Monthly Pantry Must-Haves",
								className: "w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/25 focus:ring-2 focus:ring-primary focus:outline-none"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-on-surface block mb-1",
								children: "Description (Optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								rows: 2,
								value: createDesc,
								onChange: (e) => setCreateDesc(e.target.value),
								placeholder: "Notes about these recurring items...",
								className: "w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/25 focus:ring-2 focus:ring-primary focus:outline-none"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-2 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setShowCreateModal(false),
									className: "flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface",
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "flex-1 py-2.5 rounded-xl font-bold bg-[#005f3f] text-white shadow-md hover:bg-[#004e33]",
									children: "Create"
								})]
							})
						]
					})]
				})
			}),
			showRenameModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-surface-container-lowest rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-200",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between mb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "font-headline-lg text-base font-bold text-on-surface",
							children: "Rename Collection"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setShowRenameModal(false),
							className: "text-outline hover:text-on-surface",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "material-symbols-outlined text-[18px]",
								children: "close"
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleRenameCollection,
						className: "space-y-3 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-on-surface block mb-1",
								children: "Collection Title"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								required: true,
								value: renameTitle,
								onChange: (e) => setRenameTitle(e.target.value),
								className: "w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/25 focus:ring-2 focus:ring-primary focus:outline-none"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "font-bold text-on-surface block mb-1",
								children: "Description (Optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								rows: 2,
								value: renameDesc,
								onChange: (e) => setRenameDesc(e.target.value),
								className: "w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/25 focus:ring-2 focus:ring-primary focus:outline-none"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-2 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setShowRenameModal(false),
									className: "flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface",
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "flex-1 py-2.5 rounded-xl font-bold bg-[#005f3f] text-white shadow-md hover:bg-[#004e33]",
									children: "Save Changes"
								})]
							})
						]
					})]
				})
			}),
			showDeleteModal && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-surface-container-lowest rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-outline-variant/20 animate-in fade-in zoom-in-95 duration-200 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "material-symbols-outlined text-[24px]",
								children: "delete"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "font-headline-lg text-base font-bold text-on-surface mb-2",
							children: "Delete Collection?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-on-surface-variant mb-5 leading-relaxed",
							children: "Items in this collection will not be lost. They will be safely preserved in your “All Saved Staples” list."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2 text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setShowDeleteModal(false),
								className: "flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: handleDeleteCollection,
								className: "flex-1 py-2.5 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md",
								children: "Delete"
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
var rootRouteChildren = {
	IndexRoute: Route$16.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$17
	}),
	AccountRoute: Route$15.update({
		id: "/account",
		path: "/account",
		getParentRoute: () => Route$17
	}),
	AddressesRoute: Route$14.update({
		id: "/addresses",
		path: "/addresses",
		getParentRoute: () => Route$17
	}),
	CartRoute: Route$13.update({
		id: "/cart",
		path: "/cart",
		getParentRoute: () => Route$17
	}),
	CheckoutRoute: Route$12.update({
		id: "/checkout",
		path: "/checkout",
		getParentRoute: () => Route$17
	}),
	HelpRoute: Route$11.update({
		id: "/help",
		path: "/help",
		getParentRoute: () => Route$17
	}),
	LoginRoute: Route$10.update({
		id: "/login",
		path: "/login",
		getParentRoute: () => Route$17
	}),
	NotificationsRoute: Route$9.update({
		id: "/notifications",
		path: "/notifications",
		getParentRoute: () => Route$17
	}),
	OrdersRoute: Route$8.update({
		id: "/orders",
		path: "/orders",
		getParentRoute: () => Route$17
	}),
	PoliciesRoute: Route$7.update({
		id: "/policies",
		path: "/policies",
		getParentRoute: () => Route$17
	}),
	ProdPreviewRoute: Route$6.update({
		id: "/prod-preview",
		path: "/prod-preview",
		getParentRoute: () => Route$17
	}),
	ProductRoute: Route$5.update({
		id: "/product",
		path: "/product",
		getParentRoute: () => Route$17
	}),
	ReferRoute: Route$4.update({
		id: "/refer",
		path: "/refer",
		getParentRoute: () => Route$17
	}),
	RewardsRoute: Route$3.update({
		id: "/rewards",
		path: "/rewards",
		getParentRoute: () => Route$17
	}),
	ShopRoute: Route$2.update({
		id: "/shop",
		path: "/shop",
		getParentRoute: () => Route$17
	}),
	SignUpRoute: Route$1.update({
		id: "/sign-up",
		path: "/sign-up",
		getParentRoute: () => Route$17
	}),
	WishlistRoute: Route.update({
		id: "/wishlist",
		path: "/wishlist",
		getParentRoute: () => Route$17
	})
};
var routeTree = Route$17._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
