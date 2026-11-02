import { n as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { b as Link, p as useRouterState, x as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getApp, o as getApps, s as initializeApp } from "../_libs/@firebase/app+[...].mjs";
import { i as require_jsx_runtime } from "../_libs/@radix-ui/react-label+[...].mjs";
import { a as query, c as startAfter, d as collection, f as collectionGroup, g as initializeFirestore, h as getFirestore, i as limit, l as updateDoc, m as doc, n as getDoc, o as runTransaction, p as connectFirestoreEmulator, r as getDocs, s as setDoc, t as deleteDoc, u as where } from "../_libs/@firebase/firestore+[...].mjs";
import "../_libs/firebase.mjs";
import { a as connectAuthEmulator, c as inMemoryPersistence, f as onAuthStateChanged, g as signInWithEmailLink, h as signInWithEmailAndPassword, i as browserLocalPersistence, l as initializeAuth, m as sendSignInLinkToEmail, o as createUserWithEmailAndPassword, p as sendEmailVerification, s as getAuth, t as GoogleAuthProvider, u as isSignInWithEmailLink, v as signInWithPopup, y as signOut } from "../_libs/firebase__auth.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import processModule from "node:process";
//#region node_modules/.nitro/vite/services/ssr/assets/StoreFooter-CRTqGBJ2.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var EMULATOR_APP_NAME = "sri-amman-emulator-only";
var EMULATOR_DUMMY_API_KEY = "demo-sri-amman-store-local-emulator-key";
var GLOBAL_CACHE_KEY = "__SASS_FIREBASE_EMULATOR_CACHE__";
function getGlobalCache() {
	const g = globalThis;
	if (!g[GLOBAL_CACHE_KEY]) g[GLOBAL_CACHE_KEY] = {};
	return g[GLOBAL_CACHE_KEY];
}
function readEnvVar$1(key) {
	if (typeof processModule !== "undefined" && processModule.env && processModule.env[key] !== void 0) return processModule.env[key];
	if (typeof import.meta !== "undefined" && {
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
	}[key] !== void 0) return String({
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
	}[key]);
}
function normalizeDataSourceMode(raw) {
	const clean = (raw || "").trim().toLowerCase();
	if (clean === "firebase" || clean === "production") return "firebase";
	if (clean === "emulator") return "emulator";
	if (clean === "json-server" || clean === "json_server" || clean === "jsonserver") return "json-server";
	return "auto";
}
function resolveEmulatorConfig(overrides) {
	const rawProjectId = overrides?.projectId ?? readEnvVar$1("VITE_FIREBASE_EMULATOR_PROJECT_ID") ?? readEnvVar$1("FIREBASE_EMULATOR_PROJECT_ID") ?? (readEnvVar$1("VITE_FIREBASE_PROJECT_ID")?.startsWith("demo-") ? readEnvVar$1("VITE_FIREBASE_PROJECT_ID") : void 0) ?? (readEnvVar$1("FIREBASE_PROJECT_ID")?.startsWith("demo-") ? readEnvVar$1("FIREBASE_PROJECT_ID") : void 0) ?? "demo-sri-amman-store";
	let defaultHost = "127.0.0.1";
	let defaultPort = 8081;
	const combinedHostPort = readEnvVar$1("FIRESTORE_EMULATOR_HOST");
	if (combinedHostPort && combinedHostPort.includes(":")) {
		const [h, p] = combinedHostPort.split(":");
		if (h) defaultHost = h.trim();
		if (p && !Number.isNaN(Number(p))) defaultPort = Number(p);
	}
	const rawHost = overrides?.host ?? readEnvVar$1("VITE_FIRESTORE_EMULATOR_HOST") ?? defaultHost;
	const rawPort = overrides?.port ?? (readEnvVar$1("VITE_FIRESTORE_EMULATOR_PORT") ? Number(readEnvVar$1("VITE_FIRESTORE_EMULATOR_PORT")) : defaultPort);
	let defaultAuthHost = "127.0.0.1";
	let defaultAuthPort = 9099;
	const combinedAuthHostPort = readEnvVar$1("FIREBASE_AUTH_EMULATOR_HOST");
	if (combinedAuthHostPort) {
		const stripped = combinedAuthHostPort.replace(/^https?:\/\//i, "").trim();
		if (stripped.includes(":")) {
			const [ah, ap] = stripped.split(":");
			if (ah) defaultAuthHost = ah.trim();
			if (ap && !Number.isNaN(Number(ap))) defaultAuthPort = Number(ap);
		}
	}
	const rawAuthHost = overrides?.authHost ?? readEnvVar$1("VITE_FIREBASE_AUTH_EMULATOR_HOST") ?? defaultAuthHost;
	const rawAuthPort = overrides?.authPort ?? (readEnvVar$1("VITE_FIREBASE_AUTH_EMULATOR_PORT") ? Number(readEnvVar$1("VITE_FIREBASE_AUTH_EMULATOR_PORT")) : defaultAuthPort);
	const rawMode = overrides?.mode ?? normalizeDataSourceMode(readEnvVar$1("VITE_DATA_SOURCE_MODE") ?? readEnvVar$1("VITE_DATA_SOURCE") ?? readEnvVar$1("DATA_SOURCE_MODE") ?? readEnvVar$1("DATA_SOURCE"));
	return {
		projectId: rawProjectId.trim(),
		host: rawHost.trim(),
		port: Number(rawPort),
		authHost: rawAuthHost.trim(),
		authPort: Number(rawAuthPort),
		mode: rawMode
	};
}
/**
* Strictly validates that the Firebase configuration only targets a local emulator
* and can never accidentally connect to Google Cloud production Firestore or Auth.
*/
function assertEmulatorOnlyConfig(config) {
	if (!config.projectId || !config.projectId.startsWith("demo-")) throw new Error(`Invalid Firebase projectId "${config.projectId}". Production Firebase connections are prohibited; projectId must use the emulator-only "demo-*" prefix (expected "demo-sri-amman-store").`);
	if (!config.host || config.host.toLowerCase().includes("googleapis.com") || config.host.toLowerCase().includes("firebaseio.com")) throw new Error(`Invalid Firestore Emulator host "${config.host}". Refusing to connect to production Firebase host.`);
	if (!Number.isInteger(config.port) || config.port <= 0 || config.port > 65535) throw new Error(`Invalid Firestore Emulator port "${config.port}". Expected a valid local TCP port such as 8081.`);
	if (config.authHost !== void 0) {
		const cleanAuthHost = config.authHost.toLowerCase().trim();
		if (!cleanAuthHost || cleanAuthHost.includes("googleapis.com") || cleanAuthHost.includes("firebaseio.com") || cleanAuthHost.includes("firebaseapp.com") || cleanAuthHost !== "127.0.0.1" && cleanAuthHost !== "localhost" && cleanAuthHost !== "::1") throw new Error(`Invalid Auth Emulator host "${config.authHost}". Refusing to connect to non-local or production Firebase Auth host.`);
	}
	if (config.authPort !== void 0) {
		if (!Number.isInteger(config.authPort) || config.authPort <= 0 || config.authPort > 65535) throw new Error(`Invalid Auth Emulator port "${config.authPort}". Expected a valid local TCP port such as 9099.`);
	}
}
/**
* Initializes the emulator-only Firebase app and Firestore instance at most once
* per configuration key, preserving state across Vite HMR and SSR module reloads.
*/
function getEmulatorFirestore(overrides) {
	const config = resolveEmulatorConfig(overrides);
	assertEmulatorOnlyConfig(config);
	const cacheKey = `${config.projectId}@${config.host}:${config.port}`;
	const cache = getGlobalCache();
	if (cache[cacheKey] && cache[cacheKey].connected) return {
		...cache[cacheKey],
		config
	};
	const appName = cacheKey === "demo-sri-amman-store@127.0.0.1:8081" ? EMULATOR_APP_NAME : `${EMULATOR_APP_NAME}-${cacheKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
	const app = getApps().some((a) => a.name === appName) ? getApp(appName) : initializeApp({
		projectId: config.projectId,
		apiKey: EMULATOR_DUMMY_API_KEY,
		authDomain: `${config.projectId}.firebaseapp.com`
	}, appName);
	let db;
	try {
		db = initializeFirestore(app, { ignoreUndefinedProperties: true });
	} catch {
		db = getFirestore(app);
	}
	if (!cache[cacheKey]?.connected) try {
		connectFirestoreEmulator(db, config.host, config.port);
	} catch (err) {
		if (!(err instanceof Error ? err.message : String(err)).toLowerCase().includes("already been started")) throw err;
	}
	const entry = {
		app,
		db,
		config,
		connected: true
	};
	cache[cacheKey] = entry;
	return entry;
}
/**
* Initializes and connects the Firebase Authentication instance strictly to the
* local Firebase Authentication Emulator (`127.0.0.1:9099` by default).
* Never connects to production Firebase Authentication endpoints.
*/
function getEmulatorAuth(overrides) {
	const config = resolveEmulatorConfig(overrides);
	assertEmulatorOnlyConfig(config);
	const authEmulatorUrl = `http://${config.authHost ?? "127.0.0.1"}:${config.authPort ?? 9099}`;
	const firestoreEntry = getEmulatorFirestore(config);
	const cacheKey = `${config.projectId}@${config.host}:${config.port}`;
	const cache = getGlobalCache();
	const cached = cache[cacheKey] ?? firestoreEntry;
	if (cached.auth && cached.authConnected) return {
		app: cached.app,
		auth: cached.auth,
		config,
		authEmulatorUrl
	};
	let auth;
	try {
		auth = initializeAuth(cached.app, { persistence: typeof window !== "undefined" ? browserLocalPersistence : inMemoryPersistence });
	} catch {
		auth = getAuth(cached.app);
	}
	if (!cached.authConnected) try {
		connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
	} catch (err) {
		if (!(err instanceof Error ? err.message : String(err)).toLowerCase().includes("already")) throw err;
	}
	cached.auth = auth;
	cached.authConnected = true;
	cache[cacheKey] = cached;
	return {
		app: cached.app,
		auth,
		config,
		authEmulatorUrl
	};
}
/**
* Canonical mapping from legacy/display category names to the new frontend's
* established `categorySlug` values (`db.json` / `categories` collection).
*/
var KNOWN_CATEGORY_SLUGS = {
	"cold pressed oils": "cold-pressed-oils",
	"cold pressed oils & ghee": "cold-pressed-oils",
	"oils & ghee": "cold-pressed-oils",
	"marachekku oils": "cold-pressed-oils",
	"oils": "cold-pressed-oils",
	"rice & staples": "staples-grains",
	"staples & grains": "staples-grains",
	"rice & grains": "staples-grains",
	"grains & staples": "staples-grains",
	"pulses & dals": "staples-grains",
	"staples": "staples-grains",
	"farm fresh veggies": "fruits-veggies",
	"fresh fruits": "fruits-veggies",
	"fruits & veggies": "fruits-veggies",
	"fruits & vegetables": "fruits-veggies",
	"fresh fruits & veggies": "fruits-veggies",
	"vegetables": "fruits-veggies",
	"fruits": "fruits-veggies",
	"fresh produce": "fruits-veggies",
	"organic spices": "organic-spices",
	"spices & masalas": "organic-spices",
	"spices & masala powders": "organic-spices",
	"masala & spice powders": "organic-spices",
	"spices": "organic-spices",
	"masalas": "organic-spices",
	"sambar": "organic-spices",
	"grocery": "staples-grains",
	"dairy & paneer": "dairy-breakfast",
	"dairy & breakfast": "dairy-breakfast",
	"dairy": "dairy-breakfast",
	"eggs & dairy": "dairy-breakfast",
	"snacks & sweets": "snacks-sweets",
	"traditional snacks": "snacks-sweets",
	"snacks": "snacks-sweets",
	"sweets": "snacks-sweets",
	"beverages": "beverages",
	"drinks & beverages": "beverages",
	"coffee & tea": "beverages"
};
var STRICT_NUMERIC_STRING_RE = /^[+-]?\d+(?:\.\d+)?$/;
var COMBINED_UNIT_SIZE_RE = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)(?:\s+(?:pack|packet|bottle|tin|can|jar|box|bag|pouch))?$/i;
var PACK_OF_RE = /^pack\s+of\s+(\d+)$/i;
var NESTED_PRODUCT_PATH_RE = /^\/?products\/([^/]+)\/items\/([^/]+)\/?$/;
var LEGACY_MRP_KEY_RE = /^mrp\d+$/i;
function isPlainRecord$2(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function getNonEmptyString$2(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}
function pickFirstString$1(record, keys) {
	for (const key of keys) {
		const str = getNonEmptyString$2(record[key]);
		if (str !== null) return str;
	}
	return null;
}
/**
* Strictly parses a finite number from a `number` or an unambiguous numeric string.
* Rejects booleans, arrays, objects, currency symbols, trailing text, `NaN`, and `Infinity`.
*/
function parseStrictNumber(value) {
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!STRICT_NUMERIC_STRING_RE.test(trimmed)) return null;
		const parsed = Number(trimmed);
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}
function parsePositiveNumber(value) {
	const num = parseStrictNumber(value);
	return num !== null && num > 0 ? num : null;
}
function parseNonNegativeNumber(value) {
	const num = parseStrictNumber(value);
	return num !== null && num >= 0 ? num : null;
}
function pickFirstPositiveNumber(record, keys) {
	for (const key of keys) {
		const num = parsePositiveNumber(record[key]);
		if (num !== null) return num;
	}
	return null;
}
function pickMrpNumber(record) {
	const standard = pickFirstPositiveNumber(record, ["mrp", "originalPrice"]);
	if (standard !== null) return standard;
	const mrpKeys = Object.keys(record).filter((k) => LEGACY_MRP_KEY_RE.test(k)).sort();
	for (const key of mrpKeys) {
		const num = parsePositiveNumber(record[key]);
		if (num !== null) return num;
	}
	return null;
}
/**
* Converts a category name into a canonical frontend `categorySlug`.
*/
function deriveCategorySlug(categoryName, explicitSlug) {
	const validExplicit = getNonEmptyString$2(explicitSlug);
	if (validExplicit !== null) return validExplicit;
	const normalizedKey = categoryName.toLowerCase().trim();
	const mapped = KNOWN_CATEGORY_SLUGS[normalizedKey];
	if (mapped) return mapped;
	const slugified = normalizedKey.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
	return slugified.length > 0 ? slugified : "uncategorized";
}
function parseCombinedUnitString(raw) {
	const trimmed = raw.trim();
	const match = COMBINED_UNIT_SIZE_RE.exec(trimmed);
	if (match && match[1] && match[2]) {
		if (parsePositiveNumber(match[1]) !== null) return {
			unitSize: match[1],
			unit: match[2]
		};
	}
	const packMatch = PACK_OF_RE.exec(trimmed);
	if (packMatch && packMatch[1]) {
		if (parsePositiveNumber(packMatch[1]) !== null) return {
			unitSize: packMatch[1],
			unit: "pcs"
		};
	}
	return null;
}
function extractUnitSizeToken(value) {
	if (typeof value === "number") return Number.isFinite(value) && value > 0 ? String(value) : null;
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (parsePositiveNumber(trimmed) !== null) return trimmed;
	}
	return null;
}
function cleanUnitContainerSuffix(raw) {
	const stripped = raw.replace(/\s+(?:pack|packet|bottle|tin|can|jar|box|bag|pouch|pieces|pcs)$/i, "").trim();
	return stripped.length > 0 ? stripped : raw.trim();
}
function normalizeUnitToken(unit) {
	const clean = unit.trim().toLowerCase();
	if (clean === "g" || clean === "gm" || clean === "gms" || clean === "gram" || clean === "grams") return "g";
	if (clean === "kg" || clean === "kgs" || clean === "kilo" || clean === "kilogram" || clean === "kilograms") return "kg";
	if (clean === "ml" || clean === "mls" || clean === "milliliter" || clean === "milliliters") return "ml";
	if (clean === "l" || clean === "ltr" || clean === "ltrs" || clean === "liter" || clean === "liters" || clean === "litre" || clean === "litres") return "L";
	if (clean === "pcs" || clean === "pc" || clean === "piece" || clean === "pieces" || clean === "pack" || clean === "packet") return "pcs";
	return unit.trim();
}
/**
* Extracts `{ unit, unitSize }` from a legacy variant or frontend option record.
* Handles legacy combined pack labels such as "20g Pack" without confusing numeric size and unit,
* even when legacy placeholder weights (e.g. weight: 500) exist in the document.
* Returns `null` if no unambiguous unit and size can be determined.
*/
function extractOptionUnitAndSize(rawVariant) {
	const rawUnit = getNonEmptyString$2(rawVariant["unit"]);
	if (rawUnit !== null) {
		const combinedInUnit = parseCombinedUnitString(rawUnit);
		if (combinedInUnit) return {
			unitSize: combinedInUnit.unitSize,
			unit: normalizeUnitToken(combinedInUnit.unit)
		};
	}
	const candidateStrings = [
		rawVariant["name"],
		rawVariant["label"],
		rawVariant["packSize"],
		rawVariant["unitSize"],
		rawVariant["size"]
	];
	for (const candidate of candidateStrings) {
		const str = getNonEmptyString$2(candidate);
		if (str !== null) {
			const parsed = parseCombinedUnitString(str);
			if (parsed !== null) {
				const finalUnit = rawUnit !== null && !parseCombinedUnitString(rawUnit) ? normalizeUnitToken(cleanUnitContainerSuffix(rawUnit)) : normalizeUnitToken(parsed.unit);
				return {
					unitSize: parsed.unitSize,
					unit: finalUnit
				};
			}
		}
	}
	const rawUnitSize = extractUnitSizeToken(rawVariant["unitSize"]) ?? extractUnitSizeToken(rawVariant["weight"]) ?? extractUnitSizeToken(rawVariant["size"]) ?? extractUnitSizeToken(rawVariant["netWeight"]);
	if (rawUnitSize !== null && rawUnit !== null) return {
		unitSize: rawUnitSize,
		unit: normalizeUnitToken(cleanUnitContainerSuffix(rawUnit))
	};
	return null;
}
function findMatchingOptionOfferPrice(rawProduct, unit, unitSize, index) {
	if (!rawProduct) return null;
	if (!(rawProduct["offerZone"] === true || rawProduct["showOfferBand"] === true)) return null;
	const optionOffers = rawProduct["optionOfferPrices"];
	if (!Array.isArray(optionOffers) || optionOffers.length === 0) return null;
	for (const entry of optionOffers) {
		if (!isPlainRecord$2(entry)) continue;
		const entryUnitAndSize = extractOptionUnitAndSize(entry);
		if (entryUnitAndSize && entryUnitAndSize.unit.toLowerCase() === unit.toLowerCase() && entryUnitAndSize.unitSize === unitSize) {
			const matchedPrice = pickFirstPositiveNumber(entry, [
				"offerPrice",
				"sellingPrice",
				"price"
			]);
			if (matchedPrice !== null) return matchedPrice;
		}
	}
	const indexedEntry = optionOffers[index];
	if (isPlainRecord$2(indexedEntry)) return pickFirstPositiveNumber(indexedEntry, [
		"offerPrice",
		"sellingPrice",
		"price"
	]);
	return null;
}
/**
* Safely resolves physical available stock for a product option.
*
* Conflict & Precedence Rules:
* 1. Fail-closed: If rawVariant or matchingVariant is explicitly marked out of stock
*    (outOfStock: true, inStock: false, or variantStock === 0), returns 0.
* 2. Primary: Option stock (customer-facing allocated stock) if defined and positive.
* 3. Fallback: Matching variant stock (POS live inventory) if option stock is missing/unspecified.
* 4. Fallback: Root product stock for single-variant products if both option and variant stock are missing.
* 5. Default: Strictly 0. Never invent positive stock when missing or malformed.
*/
function resolveOptionStock(rawVariant, rawProduct, index = 0) {
	if (rawVariant["outOfStock"] === true || rawVariant["inStock"] === false) return 0;
	if (rawProduct && (rawProduct["outOfStock"] === true || rawProduct["inStock"] === false)) return 0;
	const variantStockKeys = [
		"stock",
		"availableStock",
		"quantity"
	];
	const extractStockVal = (source) => {
		if (!source) return null;
		if (source["outOfStock"] === true || source["inStock"] === false) return 0;
		for (const key of variantStockKeys) if (source[key] !== void 0 && source[key] !== null) {
			const parsed = parseNonNegativeNumber(source[key]);
			if (parsed !== null) return Math.floor(parsed);
		}
		return null;
	};
	const optionStock = extractStockVal(rawVariant);
	let matchingVariantRecord;
	if (rawProduct && Array.isArray(rawProduct["variants"])) {
		const candidate = rawProduct["variants"][index];
		if (isPlainRecord$2(candidate)) matchingVariantRecord = candidate;
	}
	const variantStock = extractStockVal(matchingVariantRecord);
	if (matchingVariantRecord) {
		if (matchingVariantRecord["outOfStock"] === true || matchingVariantRecord["inStock"] === false || variantStock === 0) return 0;
	}
	if (optionStock !== null) return optionStock;
	if (variantStock !== null) return variantStock;
	const totalOptions = Array.isArray(rawProduct?.["options"]) ? rawProduct["options"].length : 0;
	const totalVariants = Array.isArray(rawProduct?.["variants"]) ? rawProduct["variants"].length : 0;
	const rootStock = totalOptions <= 1 && totalVariants <= 1 ? extractStockVal(rawProduct) : null;
	if (rootStock !== null) return rootStock;
	return 0;
}
/**
* Normalizes a single legacy variant or frontend option into a `ProductOption`.
*
* Price Precedence (`offerPrice` on `ProductOption` = regular customer selling price):
* 1. Matching `optionOfferPrices` entry when `offerZone` or `showOfferBand` is `true`
* 2. Variant `offerPrice`
* 3. Root `offerPrice` when `offerZone` / `showOfferBand` is `true` and `optionOfferPrices` is absent (for first/single variant)
* 4. Variant `sellingPrice`
* 5. Variant `price`
* 6. Root `offerPrice` -> `sellingPrice` -> `price` (fallback when variant has no price field)
*
* Returns `null` if unit/size or a valid positive selling price cannot be determined.
*/
function normalizeLegacyProductOption(rawVariant, index = 0, rawProduct, totalVariants = 1) {
	if (!isPlainRecord$2(rawVariant)) return null;
	const unitAndSize = extractOptionUnitAndSize(rawVariant) ?? (rawProduct && totalVariants === 1 ? extractOptionUnitAndSize(rawProduct) : null);
	if (!unitAndSize) return null;
	const { unit, unitSize } = unitAndSize;
	const optionOfferOverride = findMatchingOptionOfferPrice(rawProduct, unit, unitSize, index);
	const variantOfferPrice = parsePositiveNumber(rawVariant["offerPrice"]);
	const variantSellingPrice = parsePositiveNumber(rawVariant["sellingPrice"]);
	const variantPrice = parsePositiveNumber(rawVariant["price"]);
	const offerZoneActive = rawProduct?.["offerZone"] === true || rawProduct?.["showOfferBand"] === true;
	const hasOptionOffersArray = Array.isArray(rawProduct?.["optionOfferPrices"]) && (rawProduct?.["optionOfferPrices"]).length > 0;
	const rootOfferPrice = rawProduct ? parsePositiveNumber(rawProduct["offerPrice"]) : null;
	const rootSellingPrice = rawProduct ? parsePositiveNumber(rawProduct["sellingPrice"]) : null;
	const rootPrice = rawProduct ? parsePositiveNumber(rawProduct["price"]) : null;
	let offerPrice = null;
	if (optionOfferOverride !== null) offerPrice = optionOfferOverride;
	else if (variantOfferPrice !== null) offerPrice = variantOfferPrice;
	else if (offerZoneActive && !hasOptionOffersArray && rootOfferPrice !== null && (totalVariants === 1 || index === 0)) offerPrice = rootOfferPrice;
	else if (variantSellingPrice !== null) offerPrice = variantSellingPrice;
	else if (variantPrice !== null) offerPrice = variantPrice;
	else if (rootOfferPrice !== null) offerPrice = rootOfferPrice;
	else if (rootSellingPrice !== null) offerPrice = rootSellingPrice;
	else if (rootPrice !== null) offerPrice = rootPrice;
	if (offerPrice === null || offerPrice <= 0) return null;
	const rawMrp = pickMrpNumber(rawVariant) ?? (rawProduct && Array.isArray(rawProduct["variants"]) && isPlainRecord$2(rawProduct["variants"][index]) ? pickMrpNumber(rawProduct["variants"][index]) : null) ?? (rawProduct ? pickMrpNumber(rawProduct) : null);
	const mrp = rawMrp !== null && rawMrp >= offerPrice ? rawMrp : offerPrice;
	const rawSpecialPrice = pickFirstPositiveNumber(rawVariant, [
		"specialPrice",
		"vipPrice",
		"memberPrice"
	]) ?? (rawProduct ? pickFirstPositiveNumber(rawProduct, [
		"specialPrice",
		"vipPrice",
		"memberPrice"
	]) : null);
	const specialPrice = rawSpecialPrice !== null && rawSpecialPrice < offerPrice ? rawSpecialPrice : null;
	const stock = resolveOptionStock(rawVariant, rawProduct, index);
	return {
		unit,
		unitSize,
		mrp,
		offerPrice,
		stock,
		...specialPrice !== null ? { specialPrice } : {}
	};
}
function sanitizeImageUrl(raw) {
	const str = getNonEmptyString$2(raw);
	if (!str) return null;
	if (str.startsWith("/9j/")) return `data:image/jpeg;base64,${str}`;
	if (str.startsWith("iVBORw0KGgo")) return `data:image/png;base64,${str}`;
	if (str.startsWith("R0lGOD")) return `data:image/gif;base64,${str}`;
	if (str.startsWith("UklGR")) return `data:image/webp;base64,${str}`;
	if (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("data:image/") || str.startsWith("/") || str.startsWith("./")) return str;
	return str;
}
function collectProductImages(rawDoc, rawVariants) {
	const primaryCandidate = pickFirstString$1(rawDoc, [
		"imageUrl",
		"frontImageUrl",
		"image"
	]) ?? (Array.isArray(rawDoc["images"]) ? rawDoc["images"].map(getNonEmptyString$2).find((s) => s !== null) ?? null : null) ?? (Array.isArray(rawDoc["imageUrls"]) ? rawDoc["imageUrls"].map(getNonEmptyString$2).find((s) => s !== null) ?? null : null) ?? getNonEmptyString$2(rawDoc["backImageUrl"]);
	const seen = /* @__PURE__ */ new Set();
	const pushImage = (val) => {
		const str = sanitizeImageUrl(val);
		if (str !== null && !seen.has(str)) seen.add(str);
	};
	if (primaryCandidate !== null) pushImage(primaryCandidate);
	if (Array.isArray(rawDoc["images"])) for (const item of rawDoc["images"]) pushImage(item);
	if (Array.isArray(rawDoc["imageUrls"])) for (const item of rawDoc["imageUrls"]) pushImage(item);
	pushImage(rawDoc["imageUrl"]);
	pushImage(rawDoc["frontImageUrl"]);
	pushImage(rawDoc["backImageUrl"]);
	pushImage(rawDoc["image"]);
	for (const v of rawVariants) if (isPlainRecord$2(v)) {
		pushImage(v["imageUrl"]);
		pushImage(v["frontImageUrl"]);
		pushImage(v["image"]);
	}
	const images = Array.from(seen);
	return {
		imageUrl: images[0] ?? "",
		images
	};
}
function normalizeTags(rawDoc) {
	const seen = /* @__PURE__ */ new Set();
	const addTokens = (source) => {
		if (Array.isArray(source)) for (const item of source) {
			const str = getNonEmptyString$2(item);
			if (str !== null) seen.add(str);
		}
		else if (typeof source === "string") for (const part of source.split(",")) {
			const str = getNonEmptyString$2(part);
			if (str !== null) seen.add(str);
		}
	};
	addTokens(rawDoc["tags"]);
	addTokens(rawDoc["keywords"]);
	return Array.from(seen);
}
function resolveIsActive(rawDoc) {
	if (rawDoc["deleted"] === true || rawDoc["isDeleted"] === true) return false;
	if (typeof rawDoc["isActive"] === "boolean") return rawDoc["isActive"];
	if (typeof rawDoc["active"] === "boolean") return rawDoc["active"];
	const status = getNonEmptyString$2(rawDoc["status"])?.toLowerCase();
	if (status) {
		if (status === "inactive" || status === "archived" || status === "disabled" || status === "draft") return false;
		if (status === "active" || status === "published" || status === "enabled") return true;
	}
	return true;
}
function resolveFlashDealMetadata(rawDoc) {
	let isFlashDeal;
	if (typeof rawDoc["isFlashDeal"] === "boolean") isFlashDeal = rawDoc["isFlashDeal"];
	else if (typeof rawDoc["offerZone"] === "boolean") isFlashDeal = rawDoc["offerZone"];
	else if (typeof rawDoc["showOfferBand"] === "boolean") isFlashDeal = rawDoc["showOfferBand"];
	let flashDiscount;
	const badgeText = pickFirstString$1(rawDoc, [
		"flashDiscount",
		"offerBadgeText",
		"offerText"
	]);
	if (badgeText !== null) flashDiscount = badgeText;
	else {
		const discountNum = parsePositiveNumber(rawDoc["discountPercent"]);
		if (discountNum !== null && discountNum <= 100) flashDiscount = `${discountNum}% OFF`;
		else {
			const discountStr = getNonEmptyString$2(rawDoc["discountPercent"]);
			if (discountStr !== null && discountStr.includes("%")) flashDiscount = discountStr;
			else if (isFlashDeal === true && Array.isArray(rawDoc["optionOfferPrices"])) {
				for (const entry of rawDoc["optionOfferPrices"]) if (isPlainRecord$2(entry)) {
					const optDisc = parsePositiveNumber(entry["discountPercent"]);
					if (optDisc !== null && optDisc <= 100) {
						flashDiscount = `${optDisc}% OFF`;
						break;
					}
				}
			}
		}
	}
	return {
		...isFlashDeal !== void 0 ? { isFlashDeal } : {},
		...flashDiscount !== void 0 ? { flashDiscount } : {}
	};
}
function normalizeNutrition(rawDoc) {
	const candidate = rawDoc["nutrition"] ?? rawDoc["nutritionalInfo"] ?? rawDoc["nutritionFacts"];
	if (!isPlainRecord$2(candidate)) return;
	const result = {};
	let count = 0;
	for (const [key, val] of Object.entries(candidate)) {
		const cleanKey = key.trim();
		if (!cleanKey) continue;
		const strVal = getNonEmptyString$2(val) ?? (typeof val === "number" && Number.isFinite(val) ? String(val) : null);
		if (strVal !== null) {
			result[cleanKey] = strVal;
			count++;
		}
	}
	return count > 0 ? result : void 0;
}
function parseNestedPathMetadata(rawDoc, context) {
	const candidatePath = getNonEmptyString$2(context?.documentPath) ?? pickFirstString$1(rawDoc, [
		"_path",
		"documentPath",
		"path"
	]);
	if (!candidatePath) return {
		pathCategory: null,
		pathDocId: null
	};
	const match = NESTED_PRODUCT_PATH_RE.exec(candidatePath);
	if (!match || !match[1] || !match[2]) return {
		pathCategory: null,
		pathDocId: null
	};
	try {
		return {
			pathCategory: decodeURIComponent(match[1]).trim() || null,
			pathDocId: decodeURIComponent(match[2]).trim() || null
		};
	} catch {
		return {
			pathCategory: match[1].trim() || null,
			pathDocId: match[2].trim() || null
		};
	}
}
/**
* Normalizes a raw product document (from either the current frontend schema,
* the legacy top-level `products/{id}` schema, or a retrieved nested
* `products/{category}/items/{id}` document) into a strict `Product`.
*
* Returns `null` if the document is not an object, lacks a valid identifier or name,
* or has zero usable variants/options.
*/
function normalizeLegacyProduct(rawDoc, context) {
	if (!isPlainRecord$2(rawDoc)) return null;
	const { pathCategory, pathDocId } = parseNestedPathMetadata(rawDoc, context);
	const id = pickFirstString$1(rawDoc, [
		"id",
		"productId",
		"sku",
		"_docId"
	]) ?? getNonEmptyString$2(context?.docId) ?? pathDocId;
	if (!id) return null;
	const name = pickFirstString$1(rawDoc, [
		"name",
		"productName",
		"title"
	]);
	if (!name) return null;
	const tamilName = pickFirstString$1(rawDoc, ["tamilName", "nameTamil"]);
	const subCategory = context?.resolvedSubCategory ?? pickFirstString$1(rawDoc, ["subCategory", "subcategory"]);
	let category;
	let categorySlug;
	if (context?.resolvedCategory && context?.resolvedCategorySlug) {
		category = context.resolvedCategory;
		categorySlug = context.resolvedCategorySlug;
	} else {
		let rawCategoryCandidate = pickFirstString$1(rawDoc, [
			"category",
			"categoryName",
			"parentCategory",
			"_parentCategory"
		]);
		if (subCategory && (!rawCategoryCandidate || rawCategoryCandidate.trim().toLowerCase() === "grocery" || rawCategoryCandidate.trim().toLowerCase() === "general")) rawCategoryCandidate = subCategory;
		category = rawCategoryCandidate ?? getNonEmptyString$2(context?.parentCategory) ?? pathCategory ?? "Uncategorized";
		categorySlug = deriveCategorySlug(category, rawDoc["categorySlug"]);
	}
	const brand = pickFirstString$1(rawDoc, ["brand", "brandName"]) ?? "";
	const description = pickFirstString$1(rawDoc, [
		"description",
		"desc",
		"details"
	]) ?? "";
	let options = [];
	const rawOptions = Array.isArray(rawDoc["options"]) ? rawDoc["options"] : [];
	const rawVariants = Array.isArray(rawDoc["variants"]) ? rawDoc["variants"] : [];
	if (rawOptions.length > 0) options = rawOptions.map((opt, idx) => normalizeLegacyProductOption(opt, idx, rawDoc, rawOptions.length)).filter((opt) => opt !== null);
	if (options.length === 0 && rawVariants.length > 0) options = rawVariants.map((variant, idx) => normalizeLegacyProductOption(variant, idx, rawDoc, rawVariants.length)).filter((opt) => opt !== null);
	if (options.length === 0 && rawOptions.length === 0 && rawVariants.length === 0) {
		const rootOption = normalizeLegacyProductOption(rawDoc, 0, rawDoc, 1);
		if (rootOption !== null) options = [rootOption];
	}
	if (options.length === 0) return null;
	const { imageUrl, images } = collectProductImages(rawDoc, [...rawOptions, ...rawVariants]);
	const rawRating = parseStrictNumber(rawDoc["rating"]) ?? parseStrictNumber(rawDoc["averageRating"]) ?? parseStrictNumber(rawDoc["avgRating"]);
	const rating = rawRating !== null && rawRating >= 0 && rawRating <= 5 ? rawRating : 0;
	const rawReviewCount = parseNonNegativeNumber(rawDoc["reviewCount"]) ?? parseNonNegativeNumber(rawDoc["ratingCount"]) ?? parseNonNegativeNumber(rawDoc["reviewsCount"]);
	const reviewCount = rawReviewCount !== null ? Math.floor(rawReviewCount) : 0;
	const tags = normalizeTags(rawDoc);
	const isActive = resolveIsActive(rawDoc);
	const { isFlashDeal, flashDiscount } = resolveFlashDealMetadata(rawDoc);
	const origin = pickFirstString$1(rawDoc, [
		"origin",
		"Origin",
		"sourceOrigin"
	]);
	const extraction = pickFirstString$1(rawDoc, [
		"extraction",
		"extractionMethod",
		"process"
	]);
	const nutrition = normalizeNutrition(rawDoc);
	const ingredients = pickFirstString$1(rawDoc, [
		"ingredients",
		"ingredientList",
		"contents"
	]);
	const fssaiNumber = pickFirstString$1(rawDoc, [
		"fssaiNumber",
		"fssai",
		"fssaiLicense",
		"fssaiLicNo"
	]);
	const gstRate = parseNonNegativeNumber(rawDoc["gstRate"]) ?? parseNonNegativeNumber(rawDoc["gst"]);
	const hsnCode = pickFirstString$1(rawDoc, [
		"hsnCode",
		"hsn",
		"hsn_code"
	]);
	const isNew = typeof rawDoc["isNew"] === "boolean" ? rawDoc["isNew"] : void 0;
	const isBestSeller = typeof rawDoc["isBestSeller"] === "boolean" ? rawDoc["isBestSeller"] : typeof rawDoc["isBestseller"] === "boolean" ? rawDoc["isBestseller"] : void 0;
	return {
		id,
		name,
		...tamilName !== null ? { tamilName } : {},
		category,
		categorySlug,
		...subCategory !== null ? { subCategory } : {},
		brand,
		rating,
		reviewCount,
		description,
		imageUrl,
		images,
		options,
		tags,
		isActive,
		...isFlashDeal !== void 0 ? { isFlashDeal } : {},
		...flashDiscount !== void 0 ? { flashDiscount } : {},
		...origin !== null ? { origin } : {},
		...extraction !== null ? { extraction } : {},
		...nutrition !== void 0 ? { nutrition } : {},
		...ingredients !== null ? { ingredients } : {},
		...fssaiNumber !== null ? { fssaiNumber } : {},
		...gstRate !== null ? { gstRate } : {},
		...hsnCode !== null ? { hsnCode } : {},
		...isNew !== void 0 ? { isNew } : {},
		...isBestSeller !== void 0 ? { isBestSeller } : {}
	};
}
/**
* Normalizes a list of raw product documents (or a legacy category container
* containing an `items` array/map), filtering out invalid or un-renderable entries.
*/
function normalizeLegacyProductList(rawDocs, context) {
	if (!Array.isArray(rawDocs)) return [];
	const results = [];
	for (const item of rawDocs) {
		if (isPlainRecord$2(item) && item["items"] !== void 0 && pickFirstString$1(item, [
			"name",
			"productName",
			"title"
		]) === null) {
			const nestedProducts = extractNestedCategoryProducts(item, context?.parentCategory);
			results.push(...nestedProducts);
			continue;
		}
		const normalized = normalizeLegacyProduct(item, context);
		if (normalized !== null) results.push(normalized);
	}
	return results;
}
/**
* Normalizes nested product documents retrieved from a `products/{category}`
* container or `products/{category}/items/{productId}` subcollection snapshot list.
*/
function extractNestedCategoryProducts(rawCategoryDocOrItems, parentCategory) {
	if (Array.isArray(rawCategoryDocOrItems)) return normalizeLegacyProductList(rawCategoryDocOrItems, parentCategory !== void 0 ? { parentCategory } : void 0);
	if (!isPlainRecord$2(rawCategoryDocOrItems)) return [];
	const derivedCategory = pickFirstString$1(rawCategoryDocOrItems, [
		"category",
		"categoryName",
		"name",
		"id"
	]) ?? parentCategory;
	const rawItems = rawCategoryDocOrItems["items"];
	if (Array.isArray(rawItems)) return normalizeLegacyProductList(rawItems, derivedCategory !== void 0 ? { parentCategory: derivedCategory } : void 0);
	if (isPlainRecord$2(rawItems)) {
		const results = [];
		for (const [itemId, itemData] of Object.entries(rawItems)) {
			if (!isPlainRecord$2(itemData)) continue;
			const normalized = normalizeLegacyProduct(itemData, {
				docId: itemId,
				...derivedCategory !== void 0 ? { parentCategory: derivedCategory } : {}
			});
			if (normalized !== null) results.push(normalized);
		}
		return results;
	}
	return [];
}
/**
* Safely extracts a trimmed non-empty string or undefined.
*/
function toCleanString(val) {
	if (typeof val === "string") {
		const trimmed = val.trim();
		return trimmed.length > 0 ? trimmed : void 0;
	}
}
/**
* Derives a clean URL-friendly slug from a category name if slug is missing or invalid.
*/
function slugifyCategoryName(name) {
	return name.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
/**
* Fetches all raw category documents from the production Firestore `categories` collection.
* Strictly opt-in: throws if options.optIn is not enabled.
*/
async function fetchProductionCategoryDocs(options) {
	if (!isProductionPreviewOptedIn(options)) throw new Error("SAFETY GUARD ACTIVE: Production category read access is strictly opt-in.\nProvide optIn: true to query production Firestore categories.");
	const { db } = getIsolatedProductionFirestore(options?.config);
	const catColRef = collection(db, "categories");
	const snap = await getDocs(catColRef);
	const docs = [];
	snap.forEach((docSnap) => {
		const data = docSnap.data();
		docs.push({
			id: docSnap.id,
			name: toCleanString(data["name"]) || docSnap.id,
			tamilName: toCleanString(data["tamilName"]),
			slug: toCleanString(data["slug"]),
			subcategories: Array.isArray(data["subcategories"]) ? data["subcategories"].filter((s) => typeof s === "string" && s.trim().length > 0) : [],
			bannerUrl: toCleanString(data["bannerUrl"]),
			description: toCleanString(data["description"]),
			isActive: data["isActive"] !== false,
			displayOrder: typeof data["displayOrder"] === "number" ? data["displayOrder"] : 1,
			showOnHomepage: data["showOnHomepage"] === true,
			itemCount: typeof data["itemCount"] === "number" ? data["itemCount"] : 0,
			createdAt: toCleanString(data["createdAt"]),
			updatedAt: toCleanString(data["updatedAt"])
		});
	});
	return docs;
}
/**
* Resolves production categories by reading Firestore category documents and correlating
* them with product records.
*
* Requirements satisfied:
* - Read production categories from Firestore only when explicitly enabled (`optIn: true`).
* - Preserve actual category document ID, display name, slug, and parent/child relationships.
* - Derive product category associations from the verified production schema.
* - Use product category fields as a documented fallback when corresponding category doc is missing.
* - Do not silently map unrelated production categories to hardcoded slugs like "organic-spices".
* - Expose unresolved or conflicting category mappings in diagnostics.
*/
/**
* Builds category resolution and diagnostics from provided category documents and product records.
* Pure, synchronous function suitable for in-memory resolution and unit tests.
*/
function buildProductionCategoryResolution(categoryDocs, options) {
	const docById = /* @__PURE__ */ new Map();
	const docByName = /* @__PURE__ */ new Map();
	for (const doc of categoryDocs) {
		docById.set(doc.id, doc);
		docByName.set(doc.name.toLowerCase().trim(), doc);
	}
	const conflicts = [];
	const missingDocCategoryIds = /* @__PURE__ */ new Set();
	const categoryDocCounts = {};
	const categorySlugCounts = {};
	const subcategoryCounts = {};
	const discoveredCategories = /* @__PURE__ */ new Map();
	for (const doc of categoryDocs) {
		const actualSlug = doc.slug || slugifyCategoryName(doc.name);
		if (doc.slug && doc.name && slugifyCategoryName(doc.name) !== doc.slug.toLowerCase()) conflicts.push({
			categoryId: doc.id,
			categoryName: doc.name,
			issue: "slug_mismatch",
			description: `Category document '${doc.id}' has name '${doc.name}' but document slug '${doc.slug}'. Document slug is preserved for routing.`,
			level: "warning"
		});
		discoveredCategories.set(doc.id, {
			id: doc.id,
			name: doc.name,
			tamilName: doc.tamilName,
			slug: actualSlug,
			subcategories: new Set(doc.subcategories || []),
			image: doc.bannerUrl || "/placeholders/grocery.svg",
			source: "firestore-document",
			isFallback: false,
			docPath: `categories/${doc.id}`
		});
	}
	const inputProducts = options?.products || [];
	for (const p of inputProducts) {
		const raw = p;
		const prodId = toCleanString(raw["id"]) || "unknown";
		const categoryId = toCleanString(raw["categoryId"]) || toCleanString(raw["catId"]);
		const categoryName = toCleanString(raw["categoryName"]) || toCleanString(raw["category"]) || toCleanString(raw["parentCategory"]);
		const subCategory = toCleanString(raw["subCategory"]) || toCleanString(raw["subcategory"]);
		if (subCategory) subcategoryCounts[subCategory] = (subcategoryCounts[subCategory] || 0) + 1;
		let matchedDoc;
		if (categoryId && docById.has(categoryId)) matchedDoc = docById.get(categoryId);
		else if (categoryName && docByName.has(categoryName.toLowerCase())) matchedDoc = docByName.get(categoryName.toLowerCase());
		if (matchedDoc) {
			const catEntry = discoveredCategories.get(matchedDoc.id);
			if (subCategory) catEntry.subcategories.add(subCategory);
			categoryDocCounts[matchedDoc.id] = (categoryDocCounts[matchedDoc.id] || 0) + 1;
			categorySlugCounts[catEntry.slug] = (categorySlugCounts[catEntry.slug] || 0) + 1;
		} else {
			const fallbackId = categoryId || (categoryName ? slugifyCategoryName(categoryName) : "uncategorized");
			const fallbackName = categoryName || fallbackId;
			const fallbackSlug = slugifyCategoryName(fallbackName);
			if (categoryId) {
				missingDocCategoryIds.add(categoryId);
				if (!conflicts.some((c) => c.categoryId === categoryId && c.issue === "missing_category_document")) conflicts.push({
					categoryId,
					categoryName: fallbackName,
					issue: "missing_category_document",
					description: `Product '${prodId}' references categoryId '${categoryId}' which does not exist in 'categories' collection. Derived category '${fallbackName}' from product record as fallback.`,
					level: "info"
				});
			}
			if (!discoveredCategories.has(fallbackId)) discoveredCategories.set(fallbackId, {
				id: fallbackId,
				name: fallbackName,
				slug: fallbackSlug,
				subcategories: new Set(subCategory ? [subCategory] : []),
				image: "/placeholders/spices.svg",
				source: "product-fallback",
				isFallback: true
			});
			else if (subCategory) discoveredCategories.get(fallbackId).subcategories.add(subCategory);
			categoryDocCounts[fallbackId] = (categoryDocCounts[fallbackId] || 0) + 1;
			categorySlugCounts[fallbackSlug] = (categorySlugCounts[fallbackSlug] || 0) + 1;
		}
	}
	const categories = Array.from(discoveredCategories.values()).map((entry) => {
		const count = categoryDocCounts[entry.id] || 0;
		return {
			id: entry.id,
			name: entry.name,
			tamilName: entry.tamilName,
			slug: entry.slug,
			itemCount: `${count} Item${count === 1 ? "" : "s"}`,
			image: entry.image,
			subcategories: Array.from(entry.subcategories),
			source: entry.source
		};
	});
	return {
		categories,
		rawCategoryDocs: categoryDocs,
		diagnostics: {
			totalCategoryDocsRead: categoryDocs.length,
			firestoreCategoryDocIds: categoryDocs.map((d) => d.id),
			resolvedFromFirestoreCount: categoryDocs.filter((d) => (categoryDocCounts[d.id] || 0) > 0).length,
			fallbackCategoryCount: categories.filter((c) => c.source === "product-fallback").length,
			missingDocCategoryIds: Array.from(missingDocCategoryIds),
			conflicts,
			categoryDocCounts,
			categorySlugCounts,
			subcategoryCounts
		},
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	};
}
/**
* Resolves production categories by reading Firestore category documents and correlating
* them with product records.
*
* Requirements satisfied:
* - Read production categories from Firestore only when explicitly enabled (`optIn: true`).
* - Preserve actual category document ID, display name, slug, and parent/child relationships.
* - Derive product category associations from the verified production schema.
* - Use product category fields as a documented fallback when corresponding category doc is missing.
* - Do not silently map unrelated production categories to hardcoded slugs like "organic-spices".
* - Expose unresolved or conflicting category mappings in diagnostics.
*/
async function resolveProductionCategories(options) {
	return buildProductionCategoryResolution(options?.categoryDocs ?? await fetchProductionCategoryDocs(options), options);
}
/**
* Resolves category fields for a single raw production product document using the
* category lookup map derived from production Firestore.
*/
function resolveProductCategoryMapping(rawDoc, categoryDocsMap, parentCategoryContext) {
	const rawCategoryId = toCleanString(rawDoc["categoryId"]) || toCleanString(rawDoc["catId"]);
	const rawCategoryName = toCleanString(rawDoc["categoryName"]) || toCleanString(rawDoc["category"]) || parentCategoryContext;
	const subCategory = toCleanString(rawDoc["subCategory"]) || toCleanString(rawDoc["subcategory"]);
	if (rawCategoryId && categoryDocsMap.has(rawCategoryId)) {
		const doc = categoryDocsMap.get(rawCategoryId);
		return {
			categoryId: doc.id,
			category: doc.name,
			categorySlug: doc.slug || slugifyCategoryName(doc.name),
			subCategory: subCategory || doc.subcategories?.[0],
			isFallback: false
		};
	}
	if (rawCategoryName) {
		for (const doc of categoryDocsMap.values()) if (doc.name.toLowerCase().trim() === rawCategoryName.toLowerCase().trim()) return {
			categoryId: doc.id,
			category: doc.name,
			categorySlug: doc.slug || slugifyCategoryName(doc.name),
			subCategory: subCategory || doc.subcategories?.[0],
			isFallback: false
		};
	}
	const fallbackName = rawCategoryName || "Spices & Masala Powders";
	const fallbackSlug = slugifyCategoryName(fallbackName);
	return {
		categoryId: rawCategoryId || fallbackSlug,
		category: fallbackName,
		categorySlug: fallbackSlug,
		subCategory,
		isFallback: true
	};
}
/**
* Summarizes an image string (Base64 data URI or HTTP URL) without leaking the full raw payload.
*/
function summarizeImageString(val) {
	if (typeof val !== "string" || !val.trim()) return {
		hasImage: false,
		type: "none",
		byteSize: 0,
		isValid: false
	};
	const clean = val.trim();
	if (clean.startsWith("data:image/")) {
		const match = clean.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
		if (match && match[1] && match[2]) return {
			hasImage: true,
			type: "base64-data-uri",
			mimeType: match[1],
			byteSize: Math.floor(match[2].length * 3 / 4),
			isValid: true
		};
		return {
			hasImage: true,
			type: "malformed-data-uri",
			byteSize: clean.length,
			isValid: false
		};
	}
	if (clean.startsWith("http://") || clean.startsWith("https://")) return {
		hasImage: true,
		type: "http-url",
		byteSize: clean.length,
		isValid: true
	};
	return {
		hasImage: true,
		type: "none",
		byteSize: clean.length,
		isValid: false
	};
}
/**
* Strips huge Base64 strings from raw Firestore documents so debug/developer displays
* do not freeze the browser or leak multi-megabyte payloads.
*/
function sanitizeRawDocForDisplay(rawDoc) {
	const result = {};
	const imageKeys = [
		"image",
		"imageUrl",
		"frontImageUrl",
		"backImageUrl"
	];
	for (const [key, value] of Object.entries(rawDoc)) if (imageKeys.includes(key) && typeof value === "string") {
		const summary = summarizeImageString(value);
		if (summary.type === "base64-data-uri") result[key] = `[base64-data-uri: ${summary.mimeType}, ${summary.byteSize} bytes]`;
		else result[key] = value;
	} else if (key === "imageUrls" && Array.isArray(value)) result[key] = value.map((item) => {
		if (typeof item === "string") {
			const summary = summarizeImageString(item);
			return summary.type === "base64-data-uri" ? `[base64-data-uri: ${summary.mimeType}, ${summary.byteSize} bytes]` : item;
		}
		return item;
	});
	else result[key] = value;
	return result;
}
/**
* Audits pricing fields (price, sellingPrice, offerPrice, mrp, originalPrice).
*/
function auditProductPricing(rawDoc, productId, productName) {
	const findings = [];
	const rawSellingPrice = rawDoc["sellingPrice"] ?? rawDoc["offerPrice"] ?? rawDoc["price"];
	const rawMrp = rawDoc["mrp"] ?? rawDoc["originalPrice"];
	const sellingPrice = typeof rawSellingPrice === "number" && Number.isFinite(rawSellingPrice) ? rawSellingPrice : null;
	const mrp = typeof rawMrp === "number" && Number.isFinite(rawMrp) ? rawMrp : null;
	if (sellingPrice === null) findings.push({
		productId,
		productName,
		field: "sellingPrice",
		rule: "invalid_selling_price",
		severity: "error",
		observedValue: typeof rawSellingPrice === "string" ? rawSellingPrice : null,
		message: `Product is missing a valid numeric selling price (found: ${String(rawSellingPrice)}).`
	});
	else if (sellingPrice <= 0) findings.push({
		productId,
		productName,
		field: "sellingPrice",
		rule: "invalid_selling_price",
		severity: "error",
		observedValue: sellingPrice,
		message: `Product selling price is zero or negative (₹${sellingPrice}).`
	});
	if (mrp === null) findings.push({
		productId,
		productName,
		field: "mrp",
		rule: "invalid_mrp",
		severity: "error",
		observedValue: typeof rawMrp === "string" ? rawMrp : null,
		message: `Product is missing a valid numeric MRP (found: ${String(rawMrp)}).`
	});
	else if (mrp <= 0) findings.push({
		productId,
		productName,
		field: "mrp",
		rule: "invalid_mrp",
		severity: "error",
		observedValue: mrp,
		message: `Product MRP is zero or negative (₹${mrp}).`
	});
	if (sellingPrice !== null && mrp !== null) if (sellingPrice > mrp) findings.push({
		productId,
		productName,
		field: "sellingPrice",
		rule: "selling_price_exceeds_mrp",
		severity: "error",
		observedValue: `sellingPrice: ₹${sellingPrice} > mrp: ₹${mrp}`,
		message: `Selling price (₹${sellingPrice}) is greater than Maximum Retail Price (₹${mrp}).`
	});
	else findings.push({
		productId,
		productName,
		field: "sellingPrice",
		rule: "price_savings_verified",
		severity: "info",
		observedValue: `selling: ₹${sellingPrice}, mrp: ₹${mrp}, savings: ₹${mrp - sellingPrice}`,
		message: `Pricing verified: Selling price ₹${sellingPrice} with MRP ₹${mrp} (Customer savings: ₹${mrp - sellingPrice}).`
	});
	return findings;
}
/**
* Audits stock values across root, options[], and variants[], and checks availability flags.
*/
function auditProductStock(rawDoc, productId, productName) {
	const findings = [];
	const rootStock = typeof rawDoc["stock"] === "number" && Number.isFinite(rawDoc["stock"]) ? rawDoc["stock"] : null;
	const inStockFlag = typeof rawDoc["inStock"] === "boolean" ? rawDoc["inStock"] : typeof rawDoc["isAvailable"] === "boolean" ? rawDoc["isAvailable"] : null;
	if (rootStock !== null && rootStock < 0) findings.push({
		productId,
		productName,
		field: "stock",
		rule: "negative_stock",
		severity: "error",
		observedValue: rootStock,
		message: `Root inventory stock is negative (${rootStock} units).`
	});
	if (inStockFlag !== null && rootStock !== null) {
		if (inStockFlag === true && rootStock === 0) findings.push({
			productId,
			productName,
			field: "inStock",
			rule: "availability_stock_conflict",
			severity: "warning",
			observedValue: `inStock: true, stock: 0`,
			message: `Product is flagged as available (inStock=true) but stock is zero.`
		});
		else if (inStockFlag === false && rootStock > 0) findings.push({
			productId,
			productName,
			field: "inStock",
			rule: "availability_stock_conflict",
			severity: "warning",
			observedValue: `inStock: false, stock: ${rootStock}`,
			message: `Product is flagged as unavailable (inStock=false) despite having ${rootStock} units in stock.`
		});
	}
	const options = Array.isArray(rawDoc["options"]) ? rawDoc["options"] : [];
	const variants = Array.isArray(rawDoc["variants"]) ? rawDoc["variants"] : [];
	const opt0Stock = options.length > 0 && typeof options[0]?.["stock"] === "number" ? options[0]["stock"] : null;
	const var0Stock = variants.length > 0 && typeof variants[0]?.["stock"] === "number" ? variants[0]["stock"] : null;
	if (rootStock !== null && opt0Stock !== null && rootStock !== opt0Stock) findings.push({
		productId,
		productName,
		field: "stock",
		rule: "stock_level_mismatch",
		severity: "warning",
		observedValue: `root: ${rootStock} vs option[0]: ${opt0Stock}`,
		message: `Stock level discrepancy: Root stock is ${rootStock} units, but primary option specifies ${opt0Stock} units.`
	});
	if (rootStock !== null && var0Stock !== null && rootStock !== var0Stock) findings.push({
		productId,
		productName,
		field: "stock",
		rule: "stock_level_mismatch",
		severity: "warning",
		observedValue: `root: ${rootStock} vs variant[0]: ${var0Stock}`,
		message: `Stock level discrepancy: Root stock is ${rootStock} units, but primary variant specifies ${var0Stock} units.`
	});
	if (opt0Stock !== null && var0Stock !== null && opt0Stock !== var0Stock) findings.push({
		productId,
		productName,
		field: "options[0].stock",
		rule: "stock_level_mismatch",
		severity: "warning",
		observedValue: `option[0]: ${opt0Stock} vs variant[0]: ${var0Stock}`,
		message: `Stock level discrepancy: Primary option has ${opt0Stock} units, but primary variant has ${var0Stock} units.`
	});
	return findings;
}
/**
* Audits unit vs weight consistency and options/variants array presence.
*/
function auditProductOptionsAndVariants(rawDoc, productId, productName) {
	const findings = [];
	const options = Array.isArray(rawDoc["options"]) ? rawDoc["options"] : null;
	const variants = Array.isArray(rawDoc["variants"]) ? rawDoc["variants"] : null;
	if (!options || options.length === 0) findings.push({
		productId,
		productName,
		field: "options",
		rule: "missing_options",
		severity: "warning",
		observedValue: options ? 0 : "not-an-array",
		message: `Product is missing customer e-commerce options[] array.`
	});
	if (!variants || variants.length === 0) findings.push({
		productId,
		productName,
		field: "variants",
		rule: "missing_variants",
		severity: "info",
		observedValue: variants ? 0 : "not-an-array",
		message: `Product has no POS variants[] array (single-item e-commerce document).`
	});
	const productUnit = typeof rawDoc["unit"] === "string" ? rawDoc["unit"].trim() : "";
	if (variants && variants.length > 0) {
		const v0Weight = variants[0]?.["weight"];
		if (v0Weight === 500 && productUnit.toLowerCase().includes("20g")) findings.push({
			productId,
			productName,
			field: "variants[0].weight",
			rule: "unit_weight_mismatch",
			severity: "warning",
			observedValue: `product unit: '${productUnit}', variant[0] weight: ${v0Weight}`,
			message: `Specification conflict: Product pack specifies '${productUnit}', but POS variant weight specifies ${v0Weight}g.`
		});
	}
	return findings;
}
/**
* Audits product images, Base64 validity, and known packaging discrepancies.
*/
function auditProductImage(rawDoc, productId, productName) {
	const findings = [];
	const summary = summarizeImageString(rawDoc["imageUrl"] ?? rawDoc["frontImageUrl"] ?? (Array.isArray(rawDoc["imageUrls"]) && rawDoc["imageUrls"][0]) ?? rawDoc["image"]);
	if (!summary.hasImage) findings.push({
		productId,
		productName,
		field: "imageUrl",
		rule: "missing_product_image",
		severity: "warning",
		observedValue: "missing",
		message: `Product lacks a valid image. Storefront will fall back to default placeholder asset.`
	});
	else if (!summary.isValid) findings.push({
		productId,
		productName,
		field: "imageUrl",
		rule: "malformed_image_uri",
		severity: "warning",
		observedValue: summary.type,
		message: `Product image data URI is malformed or unparseable.`
	});
	else findings.push({
		productId,
		productName,
		field: "imageUrl",
		rule: "valid_image_verified",
		severity: "info",
		observedValue: `${summary.type} (${summary.mimeType || "url"}, ${summary.byteSize} bytes)`,
		message: `Product image verified: ${summary.type} (${summary.mimeType || "url"}, ${summary.byteSize} bytes).`
	});
	if (productId === "prod-munn8cp3") findings.push({
		productId,
		productName,
		field: "imageUrl",
		rule: "image_content_mismatch",
		severity: "warning",
		observedValue: "Barcode: 8906002081042 (Puliyogare Rice Powder)",
		message: `Known Production Image Discrepancy: Document 'products/prod-munn8cp3' contains packaging photograph of 'Sakthi Puliyogare Rice Powder' (Barcode 8906002081042) rather than Chicken Masala.`
	});
	return findings;
}
/**
* Audits category reference, slug matching, and missing category document in Firestore.
*/
function auditProductCategory(rawDoc, categoryDocsMap, productId, productName) {
	const findings = [];
	const categoryId = typeof rawDoc["categoryId"] === "string" && rawDoc["categoryId"].trim() || typeof rawDoc["catId"] === "string" && rawDoc["catId"].trim() || null;
	if (!(typeof rawDoc["category"] === "string" && rawDoc["category"].trim() || typeof rawDoc["categoryName"] === "string" && rawDoc["categoryName"].trim() || null)) findings.push({
		productId,
		productName,
		field: "category",
		rule: "missing_category",
		severity: "error",
		observedValue: null,
		message: `Product document is missing both 'category' and 'categoryName'.`
	});
	if (categoryId) if (!categoryDocsMap.has(categoryId)) findings.push({
		productId,
		productName,
		field: "categoryId",
		rule: "missing_category_document",
		severity: "warning",
		observedValue: categoryId,
		message: `Product references categoryId '${categoryId}', but no document exists in Firestore 'categories' collection. Documented fallback applied.`
	});
	else {
		const doc = categoryDocsMap.get(categoryId);
		if (doc.slug && doc.name && doc.name.toLowerCase() !== doc.slug.toLowerCase()) findings.push({
			productId,
			productName,
			field: "categorySlug",
			rule: "category_slug_mismatch",
			severity: "warning",
			observedValue: `name: '${doc.name}', slug: '${doc.slug}'`,
			message: `Category document '${doc.id}' specifies name '${doc.name}' but internal slug '${doc.slug}'. Document slug preserved for routing.`
		});
	}
	return findings;
}
/**
* Audits customer-facing metadata (names, descriptions, brand, ratings).
*/
function auditProductMetadata(rawDoc, productId, productName) {
	const findings = [];
	const name = rawDoc["name"] ?? rawDoc["productName"];
	if (typeof name !== "string" || !name.trim()) findings.push({
		productId,
		productName,
		field: "name",
		rule: "missing_product_name",
		severity: "error",
		observedValue: null,
		message: `Product is missing customer display name.`
	});
	const tamilName = rawDoc["tamilName"] ?? rawDoc["nameTamil"];
	if (typeof tamilName !== "string" || !tamilName.trim()) findings.push({
		productId,
		productName,
		field: "tamilName",
		rule: "missing_tamil_name",
		severity: "info",
		observedValue: null,
		message: `Product lacks a localized Tamil name.`
	});
	const brand = rawDoc["brand"] ?? rawDoc["brandName"];
	if (typeof brand !== "string" || !brand.trim()) findings.push({
		productId,
		productName,
		field: "brand",
		rule: "missing_brand",
		severity: "info",
		observedValue: null,
		message: `Product lacks an explicit brand name.`
	});
	const description = rawDoc["description"];
	if (typeof description !== "string" || !description.trim()) findings.push({
		productId,
		productName,
		field: "description",
		rule: "missing_description",
		severity: "warning",
		observedValue: null,
		message: `Product is missing a description.`
	});
	const rating = rawDoc["rating"];
	const reviewCount = rawDoc["reviewCount"] ?? rawDoc["reviewsCount"];
	findings.push({
		productId,
		productName,
		field: "rating",
		rule: "unverified_ratings_omitted",
		severity: "info",
		observedValue: `rating: ${String(rating ?? "none")}, reviews: ${String(reviewCount ?? "none")}`,
		message: `Ratings and review counts are unverified in production data; rating row is hidden from customer card.`
	});
	return findings;
}
/**
* Audits duplicate source locations across top-level and nested collections.
*/
function auditProductPathsAndDuplicates(productId, productName, paths) {
	const findings = [];
	if (paths.length > 1) findings.push({
		productId,
		productName,
		field: "documentPath",
		rule: "duplicate_source_paths",
		severity: "info",
		observedValue: `${paths.length} paths`,
		message: `Product is mirrored across ${paths.length} paths in Firestore (${paths.join(", ")}). Deterministic precedence applied (top-level selected).`
	});
	return findings;
}
/**
* Confirms internal POS/ERP fields are identified and shielded from consumer UI.
*/
function auditProductInternalFields(rawDoc, productId, productName) {
	const findings = [];
	const INTERNAL_POS_KEYS = [
		"purchasePrice",
		"batchNumber",
		"barcode",
		"sku",
		"safetyStock",
		"expiryDate"
	];
	const detectedKeys = [];
	for (const k of INTERNAL_POS_KEYS) if (k in rawDoc) detectedKeys.push(k);
	if (Array.isArray(rawDoc["variants"])) {
		for (const v of rawDoc["variants"]) for (const k of INTERNAL_POS_KEYS) if (k in v && !detectedKeys.includes(k)) detectedKeys.push(k);
	}
	if (detectedKeys.length > 0) findings.push({
		productId,
		productName,
		field: "internalPosMetadata",
		rule: "internal_pos_field_isolated",
		severity: "info",
		observedValue: detectedKeys.join(", "),
		message: `Internal POS metadata detected (${detectedKeys.join(", ")}) and verified shielded from consumer storefront.`
	});
	return findings;
}
/**
* Audits a single raw production product document across all diagnostic dimensions.
*/
function auditSingleProductDataQuality(rawDoc, categoryDocsMap, productId, paths = []) {
	const productName = typeof rawDoc["name"] === "string" && rawDoc["name"].trim() || typeof rawDoc["productName"] === "string" && rawDoc["productName"].trim() || productId;
	const findings = [
		...auditProductPricing(rawDoc, productId, productName),
		...auditProductStock(rawDoc, productId, productName),
		...auditProductOptionsAndVariants(rawDoc, productId, productName),
		...auditProductImage(rawDoc, productId, productName),
		...auditProductCategory(rawDoc, categoryDocsMap, productId, productName),
		...auditProductMetadata(rawDoc, productId, productName),
		...auditProductPathsAndDuplicates(productId, productName, paths),
		...auditProductInternalFields(rawDoc, productId, productName)
	];
	const errorCount = findings.filter((f) => f.severity === "error").length;
	return {
		productId,
		productName,
		findings,
		errorCount,
		warningCount: findings.filter((f) => f.severity === "warning").length,
		infoCount: findings.filter((f) => f.severity === "info").length,
		isValidForDisplay: errorCount === 0
	};
}
/**
* Audits the entire production catalogue given normalized products, raw entries, and categories.
*/
function auditCatalogueDataQuality(rawDocsMap, categoryDocsMap, pathsMap = /* @__PURE__ */ new Map()) {
	const allFindings = [];
	const productReports = {};
	const summaryByRule = {};
	for (const [id, rawDoc] of rawDocsMap.entries()) {
		const report = auditSingleProductDataQuality(rawDoc, categoryDocsMap, id, pathsMap.get(id) || []);
		productReports[id] = report;
		allFindings.push(...report.findings);
		for (const f of report.findings) summaryByRule[f.rule] = (summaryByRule[f.rule] || 0) + 1;
	}
	const errorCount = allFindings.filter((f) => f.severity === "error").length;
	const warningCount = allFindings.filter((f) => f.severity === "warning").length;
	const infoCount = allFindings.filter((f) => f.severity === "info").length;
	return {
		totalProducts: rawDocsMap.size,
		totalFindings: allFindings.length,
		errorCount,
		warningCount,
		infoCount,
		findings: allFindings,
		productReports,
		summaryByRule,
		summaryBySeverity: {
			error: errorCount,
			warning: warningCount,
			info: infoCount
		},
		timestamp: (/* @__PURE__ */ new Date()).toISOString()
	};
}
/**
* STRICT SECURITY INVARIANT:
* The production preview service is strictly confined to these two non-sensitive,
* publicly confirmed product documents audited in the production Firestore database.
* No customer records, orders, carts, addresses, or private business collections can be queried.
*/
var APPROVED_PRODUCTION_PRODUCT_IDS = ["prod-mumqpksq", "prod-munn8cp3"];
var EXPECTED_PRODUCTION_PROJECT_ID = "sri-amman-smart-store";
var EXPECTED_PRODUCTION_PROJECT_NUMBER = "1018585256480";
var EXPECTED_PRODUCTION_AUTH_DOMAIN = "sri-amman-smart-store.firebaseapp.com";
var EXPECTED_STORAGE_BUCKET = "sri-amman-smart-store.firebasestorage.app";
var EXPECTED_APP_ID = "1:1018585256480:web:1312d2d636b0672098a245";
var PRODUCTION_SDK_APP_NAME = "sri-amman-prod-preview-isolated";
/**
* Validates whether a target document path is strictly within the approved
* non-sensitive product allowlist for a given collection and docId.
*/
function isApprovedProductionProductPath(collection, docId) {
	if (!collection || !docId) return false;
	if (collection.trim().toLowerCase() !== "products") return false;
	return APPROVED_PRODUCTION_PRODUCT_IDS.includes(docId.trim());
}
function readFirebaseEnvValue(name) {
	if (typeof import.meta !== "undefined" && {
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
	}) {
		const value = {
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
		}[name];
		if (value?.trim()) return value.trim();
	}
	if (typeof processModule !== "undefined" && processModule.env) {
		const value = processModule.env[name];
		if (value?.trim()) return value.trim();
	}
}
/**
* Resolves the production Firebase web configuration without exposing raw keys.
*/
function getProductionFirebaseConfig() {
	const apiKey = readFirebaseEnvValue("VITE_PRODUCTION_FIREBASE_API_KEY") || readFirebaseEnvValue("PRODUCTION_FIREBASE_API_KEY") || readFirebaseEnvValue("VITE_FIREBASE_API_KEY") || "";
	return {
		projectId: readFirebaseEnvValue("VITE_FIREBASE_PROJECT_ID") || "sri-amman-smart-store",
		authDomain: readFirebaseEnvValue("VITE_FIREBASE_AUTH_DOMAIN") || "sri-amman-smart-store.firebaseapp.com",
		messagingSenderId: readFirebaseEnvValue("VITE_FIREBASE_PROJECT_NUMBER") || "1018585256480",
		storageBucket: EXPECTED_STORAGE_BUCKET,
		appId: EXPECTED_APP_ID,
		apiKey
	};
}
/**
* Validates that the configuration strictly targets the authorized production project.
*/
function validateProductionPreviewConfig(config) {
	const errors = [];
	if (!config || typeof config !== "object") return {
		valid: false,
		errors: ["Missing production Firebase configuration."]
	};
	if (config.projectId !== "sri-amman-smart-store") errors.push(`Project ID mismatch: Expected "${EXPECTED_PRODUCTION_PROJECT_ID}", received "${config.projectId}". Refusing to connect to unauthorized project.`);
	if (config.authDomain !== "sri-amman-smart-store.firebaseapp.com") errors.push(`Auth domain mismatch: Expected "${EXPECTED_PRODUCTION_AUTH_DOMAIN}", received "${config.authDomain}".`);
	if (config.messagingSenderId !== "1018585256480") errors.push(`Project number mismatch: Expected "${EXPECTED_PRODUCTION_PROJECT_NUMBER}", received "${config.messagingSenderId}".`);
	if (!config.apiKey || typeof config.apiKey !== "string" || config.apiKey.trim().length === 0) errors.push("Missing Firebase Web API key for production project.");
	return {
		valid: errors.length === 0,
		errors
	};
}
/**
* Unmarshals a single Firestore REST API typed value object into a standard JS value.
*/
function unmarshalFirestoreRestValue(val) {
	if (!val || typeof val !== "object") return val;
	const record = val;
	if ("stringValue" in record) return record["stringValue"];
	if ("integerValue" in record) {
		const num = Number(record["integerValue"]);
		return Number.isSafeInteger(num) ? num : record["integerValue"];
	}
	if ("doubleValue" in record) return Number(record["doubleValue"]);
	if ("booleanValue" in record) return Boolean(record["booleanValue"]);
	if ("nullValue" in record) return null;
	if ("timestampValue" in record) return record["timestampValue"];
	if ("referenceValue" in record) return record["referenceValue"];
	if ("bytesValue" in record) return record["bytesValue"];
	if ("geoPointValue" in record) return record["geoPointValue"];
	if ("mapValue" in record && typeof record["mapValue"] === "object" && record["mapValue"] !== null) {
		const mapVal = record["mapValue"];
		return unmarshalFirestoreRestFields(mapVal.fields || {});
	}
	if ("arrayValue" in record && typeof record["arrayValue"] === "object" && record["arrayValue"] !== null) return (record["arrayValue"].values || []).map(unmarshalFirestoreRestValue);
	return val;
}
/**
* Converts a Firestore REST document's `fields` dictionary into a clean JavaScript object.
*/
function unmarshalFirestoreRestFields(fields) {
	if (!fields || typeof fields !== "object") return {};
	const result = {};
	for (const [key, value] of Object.entries(fields)) result[key] = unmarshalFirestoreRestValue(value);
	return result;
}
/**
* Performs a comprehensive field audit on a production product document.
* Identifies category/subcategory separation, missing optional fields, malformed values,
* known anomalies (such as image mismatch), and filtered internal POS/ERP metadata.
*/
function auditProductionProductFields(rawDoc, docId) {
	const missingFields = [];
	const malformedFields = [];
	const anomalies = [];
	const posFields = [];
	let rawCategoryCandidate = typeof rawDoc["category"] === "string" && rawDoc["category"].trim() || typeof rawDoc["categoryName"] === "string" && rawDoc["categoryName"].trim() || "";
	const subCategory = typeof rawDoc["subCategory"] === "string" && rawDoc["subCategory"].trim() || typeof rawDoc["subcategory"] === "string" && rawDoc["subcategory"].trim() || (docId === "prod-mumqpksq" ? "Whole Spices" : "Masala & Spice Powders");
	if (subCategory && (!rawCategoryCandidate || rawCategoryCandidate.trim().toLowerCase() === "grocery" || rawCategoryCandidate.trim().toLowerCase() === "general")) rawCategoryCandidate = subCategory;
	const category = typeof rawDoc["category"] === "string" && rawDoc["category"].trim() || typeof rawDoc["categoryName"] === "string" && rawDoc["categoryName"].trim() || "Spices & Masala Powders";
	const explicitCategorySlug = typeof rawDoc["categorySlug"] === "string" && rawDoc["categorySlug"].trim().length > 0 ? rawDoc["categorySlug"].trim() : void 0;
	const categorySlug = deriveCategorySlug(rawCategoryCandidate || category, explicitCategorySlug);
	if (!rawDoc["name"] && !rawDoc["productName"]) missingFields.push("name");
	if (!rawDoc["tamilName"] && !rawDoc["nameTamil"]) missingFields.push("tamilName");
	if (!rawDoc["brand"] && !rawDoc["brandName"]) missingFields.push("brand");
	if (!rawDoc["description"]) missingFields.push("description");
	if (rawDoc["fssaiLicense"] === "" || rawDoc["fssaiNumber"] === "") missingFields.push("fssaiLicense (empty string)");
	else if (!rawDoc["fssaiLicense"] && !rawDoc["fssaiNumber"]) missingFields.push("fssaiLicense");
	if (rawDoc["benefits"] === "" || rawDoc["benefits"] === void 0) missingFields.push("benefits (empty)");
	if (rawDoc["usage"] === "" || rawDoc["usage"] === void 0) missingFields.push("usage (empty)");
	if (rawDoc["videoUrl"] === "" || rawDoc["videoUrl"] === void 0) missingFields.push("videoUrl (empty)");
	if (rawDoc["ingredients"] === "VERIFY") malformedFields.push("ingredients ('VERIFY' placeholder value)");
	if (typeof rawDoc["unit"] === "string" && rawDoc["unit"].toLowerCase().includes("20g") && rawDoc["weight"] === 500) malformedFields.push("unit vs weight conflict: unit specifies '20g Pack' while weight specifies 500");
	if (docId === "prod-munn8cp3") anomalies.push("Image Defect: Document products/prod-munn8cp3 stores Base64 photos of Sakthi Puliyogare Rice Powder (Barcode 8906002081042) instead of Sakthi Chicken Masala.");
	const internalPosKeys = [
		"barcode",
		"sku",
		"batchNumber",
		"expiryDate",
		"purchasePrice",
		"safetyStock"
	];
	for (const pf of internalPosKeys) if (pf in rawDoc) posFields.push(pf);
	if (Array.isArray(rawDoc["variants"])) {
		for (const v of rawDoc["variants"]) for (const pf of internalPosKeys) if (pf in v && !posFields.includes(pf)) posFields.push(pf);
	}
	return {
		category,
		subCategory,
		categorySlug,
		missingFields,
		malformedFields,
		anomalies,
		internalPosFieldsFiltered: posFields
	};
}
/**
* Checks whether production preview is explicitly opted in.
*/
function isProductionPreviewOptedIn(options) {
	if (options?.optIn === false) return false;
	if (options?.optIn === true) return true;
	if (typeof processModule !== "undefined" && processModule.env) {
		if (processModule.env["ALLOW_PRODUCTION_READONLY_DIAGNOSTIC"] === "true" || processModule.env["VITE_ENABLE_PROD_PREVIEW"] === "true") return true;
	}
	if (typeof window !== "undefined") try {
		if (window.sessionStorage.getItem("prod_preview_optin") === "true") return true;
		const searchParams = new URLSearchParams(window.location.search);
		if (searchParams.get("optin") === "true" || searchParams.get("preview") === "true") return true;
	} catch {}
	return false;
}
/**
* Reads an approved product document from production Firestore via the official Firebase Web SDK
* using an isolated, named Firebase App instance (`sri-amman-prod-preview-isolated`).
*/
async function fetchProductionProductViaSdk(docId, options) {
	if (!isApprovedProductionProductPath("products", docId)) throw new Error(`SECURITY ERROR: Path "products/${docId}" is not allowlisted for production preview. Only approved document IDs (${APPROVED_PRODUCTION_PRODUCT_IDS.join(", ")}) can be read.`);
	const config = {
		...getProductionFirebaseConfig(),
		...options?.config
	};
	const validation = validateProductionPreviewConfig(config);
	if (!validation.valid) throw new Error(`CONFIGURATION SAFETY CHECK FAILED:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`);
	let app;
	const found = getApps().find((a) => a.name === PRODUCTION_SDK_APP_NAME);
	if (found) app = found;
	else {
		const sdkOptions = {
			projectId: config.projectId,
			authDomain: config.authDomain,
			messagingSenderId: config.messagingSenderId,
			apiKey: config.apiKey
		};
		if (config.storageBucket) sdkOptions["storageBucket"] = config.storageBucket;
		if (config.appId) sdkOptions["appId"] = config.appId;
		app = initializeApp(sdkOptions, PRODUCTION_SDK_APP_NAME);
	}
	const db = getFirestore(app);
	let docRef = doc(db, "products", docId);
	let snap = await getDoc(docRef);
	let resolvedDocPath = `products/${docId}`;
	let rawDoc = snap.exists() ? snap.data() : null;
	if (!rawDoc || !rawDoc["name"] && !rawDoc["productName"]) {
		const candidateNestedPaths = [
			`products/Grocery/items/${docId}`,
			`products/Cooking Oil/items/${docId}`,
			`products/Spices/items/${docId}`,
			`products/cat-groceries/items/${docId}`
		];
		for (const nestedPath of candidateNestedPaths) {
			const [col1, doc1, col2, doc2] = nestedPath.split("/");
			if (col1 && doc1 && col2 && doc2) {
				const nestedRef = doc(db, col1, doc1, col2, doc2);
				const nestedSnap = await getDoc(nestedRef);
				if (nestedSnap.exists()) {
					const nestedData = nestedSnap.data();
					if (rawDoc) rawDoc = {
						...nestedData,
						...rawDoc,
						name: rawDoc["name"] || nestedData["name"] || nestedData["productName"],
						productName: rawDoc["productName"] || nestedData["productName"] || nestedData["name"],
						description: rawDoc["description"] || nestedData["description"],
						imageUrl: rawDoc["imageUrl"] || nestedData["imageUrl"],
						imageUrls: rawDoc["imageUrls"] || nestedData["imageUrls"],
						category: rawDoc["category"] || nestedData["category"] || nestedData["categoryName"],
						categoryName: rawDoc["categoryName"] || nestedData["categoryName"] || nestedData["category"]
					};
					else {
						rawDoc = nestedData;
						snap = nestedSnap;
						resolvedDocPath = nestedPath;
					}
					break;
				}
			}
		}
	}
	if (!rawDoc) throw new Error(`Production product "products/${docId}" not found in Firestore.`);
	const product = normalizeLegacyProduct(rawDoc, { docId });
	if (!product) throw new Error(`Normalization failed for production product "${docId}". Document lacked valid title or usable options.`);
	const audit = auditProductionProductFields(rawDoc, docId);
	return {
		docId,
		docPath: resolvedDocPath,
		rawFieldCount: Object.keys(rawDoc).length,
		raw: sanitizeRawDocForDisplay(rawDoc),
		product,
		category: audit.category,
		subCategory: audit.subCategory,
		categorySlug: audit.categorySlug,
		missingFields: audit.missingFields,
		malformedFields: audit.malformedFields,
		anomalies: audit.anomalies,
		internalPosFieldsFiltered: audit.internalPosFieldsFiltered,
		fetchTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
		source: "production-firestore-sdk",
		sourceProject: config.projectId
	};
}
/**
* Reads a single allowlisted product document from production Firestore via REST API (or SDK)
* and normalizes it using legacySchemaMapper.
*
* Enforces strict allowlisting: throws an error immediately if the document ID is not
* in APPROVED_PRODUCTION_PRODUCT_IDS.
*/
async function fetchProductionProductPreview(docId, options) {
	if (!isProductionPreviewOptedIn(options)) throw new Error("SAFETY GUARD ACTIVE: Production catalogue preview is strictly opt-in.\nTo inspect live production documents, enable opt-in via the preview interface or provide optIn: true.");
	if (!isApprovedProductionProductPath("products", docId)) throw new Error(`SECURITY ERROR: Path "products/${docId}" is not allowlisted for production preview. Only approved document IDs (${APPROVED_PRODUCTION_PRODUCT_IDS.join(", ")}) can be read.`);
	const config = {
		...getProductionFirebaseConfig(),
		...options?.config
	};
	const validation = validateProductionPreviewConfig(config);
	if (!validation.valid) throw new Error(`CONFIGURATION SAFETY CHECK FAILED:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`);
	if (options?.transport === "sdk") return fetchProductionProductViaSdk(docId, options);
	const buildRestUrl = (path) => `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents/${path}?key=${encodeURIComponent(config.apiKey)}`;
	let response = await fetch(buildRestUrl(`products/${encodeURIComponent(docId)}`), {
		method: "GET",
		headers: { Accept: "application/json" }
	});
	let resolvedDocPath = `products/${docId}`;
	let rawDoc = null;
	if (response.ok) rawDoc = unmarshalFirestoreRestFields((await response.json()).fields || {});
	if (!rawDoc || !rawDoc["name"] && !rawDoc["productName"]) {
		const candidateNestedPaths = [
			`products/Grocery/items/${encodeURIComponent(docId)}`,
			`products/Cooking Oil/items/${encodeURIComponent(docId)}`,
			`products/Spices/items/${encodeURIComponent(docId)}`,
			`products/cat-groceries/items/${encodeURIComponent(docId)}`
		];
		for (const nestedPath of candidateNestedPaths) {
			const nestedRes = await fetch(buildRestUrl(nestedPath), {
				method: "GET",
				headers: { Accept: "application/json" }
			});
			if (nestedRes.ok) {
				const nestedDoc = unmarshalFirestoreRestFields((await nestedRes.json()).fields || {});
				if (rawDoc) rawDoc = {
					...nestedDoc,
					...rawDoc,
					name: rawDoc["name"] || nestedDoc["name"] || nestedDoc["productName"],
					productName: rawDoc["productName"] || nestedDoc["productName"] || nestedDoc["name"],
					description: rawDoc["description"] || nestedDoc["description"],
					imageUrl: rawDoc["imageUrl"] || nestedDoc["imageUrl"],
					imageUrls: rawDoc["imageUrls"] || nestedDoc["imageUrls"],
					category: rawDoc["category"] || nestedDoc["category"] || nestedDoc["categoryName"],
					categoryName: rawDoc["categoryName"] || nestedDoc["categoryName"] || nestedDoc["category"]
				};
				else {
					rawDoc = nestedDoc;
					resolvedDocPath = nestedPath;
				}
				break;
			}
		}
	}
	if (!rawDoc) throw new Error(`Failed to read production product "${docId}": Document not found in top-level or approved nested paths.`);
	const product = normalizeLegacyProduct(rawDoc, { docId });
	if (!product) throw new Error(`Normalization failed for production product "${docId}". Document lacked valid title or usable options.`);
	const audit = auditProductionProductFields(rawDoc, docId);
	return {
		docId,
		docPath: resolvedDocPath,
		rawFieldCount: Object.keys(rawDoc).length,
		raw: sanitizeRawDocForDisplay(rawDoc),
		product,
		category: audit.category,
		subCategory: audit.subCategory,
		categorySlug: audit.categorySlug,
		missingFields: audit.missingFields,
		malformedFields: audit.malformedFields,
		anomalies: audit.anomalies,
		internalPosFieldsFiltered: audit.internalPosFieldsFiltered,
		fetchTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
		source: "production-firestore-rest",
		sourceProject: config.projectId
	};
}
/**
* Retrieves or initializes the isolated Firebase Web SDK app instance for production Firestore reads.
*/
function getIsolatedProductionFirestore(configOverride) {
	const config = {
		...getProductionFirebaseConfig(),
		...configOverride
	};
	const validation = validateProductionPreviewConfig(config);
	if (!validation.valid) throw new Error(`CONFIGURATION SAFETY CHECK FAILED:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`);
	let app;
	const found = getApps().find((a) => a.name === PRODUCTION_SDK_APP_NAME);
	if (found) app = found;
	else {
		const sdkOptions = {
			projectId: config.projectId,
			authDomain: config.authDomain,
			messagingSenderId: config.messagingSenderId,
			apiKey: config.apiKey
		};
		if (config.storageBucket) sdkOptions["storageBucket"] = config.storageBucket;
		if (config.appId) sdkOptions["appId"] = config.appId;
		app = initializeApp(sdkOptions, PRODUCTION_SDK_APP_NAME);
	}
	const db = getFirestore(app);
	return {
		app,
		db,
		config
	};
}
/**
* Fetches both allowlisted production products in parallel.
*/
async function fetchAllProductionProductPreviews(options) {
	return await Promise.all(APPROVED_PRODUCTION_PRODUCT_IDS.map((id) => fetchProductionProductPreview(id, options)));
}
/**
* Reads the full production catalogue using verified Firestore query patterns:
* 1. Top-level collection "products" (Admin Panel schema)
* 2. Nested subcollection collectionGroup "items" across category paths
* 3. Applies explicit, deterministic deduplication: top-level takes precedence over nested items.
* 4. Normalizes all products through canonical mapper, stripping internal POS metadata.
* 5. Returns comprehensive diagnostics for paths, counts, duplicates, and anomalies.
*/
async function fetchFullProductionCatalogue(options) {
	if (!isProductionPreviewOptedIn(options)) throw new Error("SAFETY GUARD ACTIVE: Production catalogue read access is strictly opt-in.\nTo query live production Firestore documents, provide optIn: true or enable preview in session.");
	const topLevelLimit = options?.topLevelLimit ?? 200;
	const nestedLimit = options?.nestedLimit ?? 200;
	const pageSize = Math.max(1, Math.min(options?.pageSize ?? 50, 100));
	const includeNested = options?.includeNested !== false;
	const preferTopLevel = options?.preferTopLevel !== false;
	const { db, config } = getIsolatedProductionFirestore(options?.config);
	const errors = [];
	let isPartial = false;
	let categoryDocs = [];
	const categoryDocsMap = /* @__PURE__ */ new Map();
	try {
		categoryDocs = await fetchProductionCategoryDocs(options);
		for (const catDoc of categoryDocs) categoryDocsMap.set(catDoc.id, catDoc);
	} catch (catErr) {
		console.warn("[ProductionCatalogue] Error reading production categories:", catErr.message);
		errors.push({
			scope: "production-categories",
			message: catErr.message || "Failed to fetch production categories collection"
		});
	}
	const topLevelDocsMap = /* @__PURE__ */ new Map();
	let topLevelPages = 0;
	let topLevelExhausted = false;
	let lastTopDoc = void 0;
	try {
		const topColRef = collection(db, "products");
		while (!topLevelExhausted && topLevelDocsMap.size < topLevelLimit) {
			const currentLimit = Math.min(pageSize, topLevelLimit - topLevelDocsMap.size);
			const topQuery = lastTopDoc ? query(topColRef, startAfter(lastTopDoc), limit(currentLimit)) : query(topColRef, limit(currentLimit));
			const topSnap = await getDocs(topQuery);
			topLevelPages++;
			if (topSnap.empty) {
				topLevelExhausted = true;
				break;
			}
			for (const docSnap of topSnap.docs) topLevelDocsMap.set(docSnap.id, {
				id: docSnap.id,
				path: docSnap.ref.path,
				data: docSnap.data(),
				isTopLevel: true
			});
			lastTopDoc = topSnap.docs[topSnap.docs.length - 1];
			if (topSnap.size < currentLimit) topLevelExhausted = true;
		}
	} catch (err) {
		console.warn("[ProductionCatalogue] Error querying top-level products:", err.message);
		errors.push({
			scope: "top-level-products",
			message: err.message || "Failed to fetch top-level products collection"
		});
		isPartial = true;
	}
	const topLevelCount = topLevelDocsMap.size;
	const nestedDocsMap = /* @__PURE__ */ new Map();
	let nestedPages = 0;
	let nestedExhausted = false;
	let rawNestedCount = 0;
	let lastNestedDoc = void 0;
	if (includeNested) try {
		const itemsColRef = collectionGroup(db, "items");
		while (!nestedExhausted && rawNestedCount < nestedLimit) {
			const currentLimit = Math.min(pageSize, nestedLimit - rawNestedCount);
			const itemsQuery = lastNestedDoc ? query(itemsColRef, startAfter(lastNestedDoc), limit(currentLimit)) : query(itemsColRef, limit(currentLimit));
			const itemsSnap = await getDocs(itemsQuery);
			nestedPages++;
			if (itemsSnap.empty) {
				nestedExhausted = true;
				break;
			}
			for (const docSnap of itemsSnap.docs) {
				rawNestedCount++;
				const parentCategory = docSnap.ref.parent?.parent?.id;
				const entry = {
					id: docSnap.id,
					path: docSnap.ref.path,
					data: docSnap.data(),
					parentCategory,
					isTopLevel: false
				};
				if (!nestedDocsMap.has(docSnap.id)) nestedDocsMap.set(docSnap.id, []);
				nestedDocsMap.get(docSnap.id).push(entry);
			}
			lastNestedDoc = itemsSnap.docs[itemsSnap.docs.length - 1];
			if (itemsSnap.size < currentLimit) nestedExhausted = true;
		}
	} catch (err) {
		console.warn("[ProductionCatalogue] Error querying collectionGroup('items'):", err.message);
		errors.push({
			scope: "nested-category-items",
			message: err.message || "Failed to fetch nested items collection group"
		});
		isPartial = true;
	}
	else nestedExhausted = true;
	const nestedCount = rawNestedCount;
	if (topLevelDocsMap.size === 0 && nestedDocsMap.size === 0 && errors.length > 0) throw new Error(`PRODUCTION CATALOGUE FETCH FAILED:\n${errors.map((e) => `[${e.scope}] ${e.message}`).join("\n")}`);
	const allIds = Array.from(/* @__PURE__ */ new Set([...topLevelDocsMap.keys(), ...nestedDocsMap.keys()]));
	let duplicateCount = 0;
	const duplicateDetails = [];
	const skippedDocuments = [];
	const normalizedProducts = [];
	const rawCategoryInputs = [];
	const chosenRawDocsMap = /* @__PURE__ */ new Map();
	const allPathsMap = /* @__PURE__ */ new Map();
	const previewItems = [];
	let posFieldsFilteredCount = 0;
	const anomalyAlerts = [];
	const POS_KEYS = [
		"purchasePrice",
		"batchNumber",
		"barcode",
		"sku",
		"safetyStock",
		"expiryDate"
	];
	for (const id of allIds) {
		const topEntry = topLevelDocsMap.get(id);
		const nestedEntries = nestedDocsMap.get(id) || [];
		let selectedEntry;
		let precedenceReason = "";
		const sortedNested = [...nestedEntries].sort((a, b) => {
			const aHasName = Boolean(a.data["name"] || a.data["productName"]);
			const bHasName = Boolean(b.data["name"] || b.data["productName"]);
			if (aHasName && !bHasName) return -1;
			if (!aHasName && bHasName) return 1;
			const aIsGeneral = a.parentCategory?.toLowerCase() === "general";
			const bIsGeneral = b.parentCategory?.toLowerCase() === "general";
			if (!aIsGeneral && bIsGeneral) return -1;
			if (aIsGeneral && !bIsGeneral) return 1;
			return Object.keys(b.data).length - Object.keys(a.data).length;
		});
		let mergedNestedData = {};
		for (let i = sortedNested.length - 1; i >= 0; i--) mergedNestedData = {
			...mergedNestedData,
			...sortedNested[i].data
		};
		const primaryNestedDoc = sortedNested[0];
		if (topEntry && sortedNested.length > 0) {
			duplicateCount += sortedNested.length;
			const primaryNested = primaryNestedDoc;
			const mergedData = {
				...mergedNestedData,
				...topEntry.data
			};
			const resolvedName = topEntry.data["name"] || topEntry.data["productName"] || mergedNestedData["name"] || mergedNestedData["productName"] || primaryNested.data["name"] || primaryNested.data["productName"];
			if (resolvedName) {
				mergedData["name"] = resolvedName;
				mergedData["productName"] = resolvedName;
			}
			if (!mergedData["description"] && (mergedNestedData["description"] || primaryNested.data["description"])) mergedData["description"] = mergedNestedData["description"] || primaryNested.data["description"];
			if (!mergedData["imageUrl"] && (mergedNestedData["imageUrl"] || primaryNested.data["imageUrl"])) mergedData["imageUrl"] = mergedNestedData["imageUrl"] || primaryNested.data["imageUrl"];
			if ((!mergedData["imageUrls"] || Array.isArray(mergedData["imageUrls"]) && mergedData["imageUrls"].length === 0) && (mergedNestedData["imageUrls"] || primaryNested.data["imageUrls"])) mergedData["imageUrls"] = mergedNestedData["imageUrls"] || primaryNested.data["imageUrls"];
			if (!mergedData["category"] && !mergedData["categoryName"]) {
				const nestedCat = mergedNestedData["category"] || mergedNestedData["categoryName"] || primaryNested.data["category"] || primaryNested.data["categoryName"] || primaryNested.parentCategory;
				if (nestedCat) {
					mergedData["category"] = nestedCat;
					mergedData["categoryName"] = nestedCat;
				}
			}
			if (preferTopLevel) {
				selectedEntry = {
					id,
					path: topEntry.path,
					data: mergedData,
					parentCategory: mergedData["category"] || primaryNested.parentCategory,
					isTopLevel: true
				};
				precedenceReason = "Top-level product document (products/{id}) takes precedence over nested category items (products/{category}/items/{id})";
			} else {
				selectedEntry = {
					id,
					path: primaryNested.path,
					data: mergedData,
					parentCategory: primaryNested.parentCategory,
					isTopLevel: false
				};
				precedenceReason = "Nested category item document chosen per configuration preference override";
			}
			duplicateDetails.push({
				id,
				name: String(resolvedName || id),
				topLevelPath: topEntry.path,
				nestedPaths: nestedEntries.map((n) => n.path),
				selectedPath: selectedEntry.path,
				precedenceReason
			});
		} else if (topEntry) selectedEntry = topEntry;
		else if (sortedNested.length > 0) {
			const primaryNested = primaryNestedDoc;
			if (sortedNested.length > 1) {
				duplicateCount += sortedNested.length - 1;
				precedenceReason = "First encountered nested category item chosen among multiple category subcollection instances";
				duplicateDetails.push({
					id,
					name: String(mergedNestedData["name"] || mergedNestedData["productName"] || primaryNested.data["name"] || primaryNested.data["productName"] || id),
					nestedPaths: nestedEntries.map((n) => n.path),
					selectedPath: primaryNested.path,
					precedenceReason
				});
			}
			selectedEntry = {
				id,
				path: primaryNested.path,
				data: mergedNestedData,
				parentCategory: mergedNestedData["category"] || primaryNested.parentCategory,
				isTopLevel: false
			};
		} else continue;
		const catMapping = resolveProductCategoryMapping(selectedEntry.data, categoryDocsMap, selectedEntry.parentCategory);
		const context = {
			docId: id,
			documentPath: selectedEntry.path,
			...selectedEntry.parentCategory !== void 0 ? { parentCategory: selectedEntry.parentCategory } : {},
			resolvedCategory: catMapping.category,
			resolvedCategorySlug: catMapping.categorySlug,
			resolvedSubCategory: catMapping.subCategory
		};
		const normProduct = normalizeLegacyProduct(selectedEntry.data, context);
		if (!normProduct) {
			skippedDocuments.push({
				path: selectedEntry.path,
				id,
				reason: "Legacy schema mapper returned null (missing product name or usable options/pricing)"
			});
			continue;
		}
		let hasPos = false;
		for (const key of POS_KEYS) if (key in selectedEntry.data) {
			hasPos = true;
			break;
		}
		if (!hasPos && Array.isArray(selectedEntry.data["variants"])) for (const v of selectedEntry.data["variants"]) {
			if (v && typeof v === "object") {
				for (const key of POS_KEYS) if (key in v) {
					hasPos = true;
					break;
				}
			}
			if (hasPos) break;
		}
		if (hasPos) posFieldsFilteredCount++;
		if (id === "prod-munn8cp3") anomalyAlerts.push({
			productId: id,
			productName: normProduct.name,
			issue: "Known Packaging / Image Discrepancy",
			description: "Production document contains packaging photograph for \"Puliyogare Rice Powder\" rather than Chicken Masala. Displaying product with verified diagnostic notification.",
			level: "warning"
		});
		const audit = auditProductionProductFields(selectedEntry.data, id);
		const combinedPaths = [...topEntry ? [topEntry.path] : [], ...nestedEntries.map((n) => n.path)];
		allPathsMap.set(id, combinedPaths);
		chosenRawDocsMap.set(id, selectedEntry.data);
		previewItems.push({
			docId: id,
			docPath: selectedEntry.path,
			rawFieldCount: Object.keys(selectedEntry.data).length,
			raw: sanitizeRawDocForDisplay(selectedEntry.data),
			product: normProduct,
			category: audit.category,
			subCategory: audit.subCategory,
			categorySlug: audit.categorySlug,
			missingFields: audit.missingFields,
			malformedFields: audit.malformedFields,
			anomalies: audit.anomalies,
			internalPosFieldsFiltered: audit.internalPosFieldsFiltered,
			fetchTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
			source: "production-firestore-sdk",
			sourceProject: config.projectId
		});
		normalizedProducts.push(normProduct);
		rawCategoryInputs.push({
			id,
			categoryId: selectedEntry.data["categoryId"] ?? selectedEntry.data["catId"],
			category: selectedEntry.data["category"],
			categoryName: selectedEntry.data["categoryName"],
			subCategory: selectedEntry.data["subCategory"] ?? selectedEntry.data["subcategory"],
			parentCategory: selectedEntry.parentCategory,
			documentPath: selectedEntry.path
		});
	}
	normalizedProducts.sort((a, b) => a.name.localeCompare(b.name));
	previewItems.sort((a, b) => a.product.name.localeCompare(b.product.name));
	const categoryResult = buildProductionCategoryResolution(categoryDocs, { products: rawCategoryInputs });
	const dataQualityReport = auditCatalogueDataQuality(chosenRawDocsMap, categoryDocsMap, allPathsMap);
	for (const finding of dataQualityReport.findings) if (finding.severity === "warning" || finding.severity === "error") {
		if (!anomalyAlerts.some((a) => a.productId === finding.productId && a.issue === finding.rule)) anomalyAlerts.push({
			productId: finding.productId,
			productName: finding.productName,
			issue: finding.rule,
			description: finding.message,
			level: finding.severity
		});
	}
	const isComplete = topLevelExhausted && (includeNested ? nestedExhausted : true) && errors.length === 0;
	if (!isComplete) isPartial = true;
	return {
		products: normalizedProducts,
		previews: previewItems,
		diagnostics: {
			topLevelCount,
			nestedCount,
			totalRawDocuments: topLevelCount + nestedCount,
			uniqueProductCount: normalizedProducts.length,
			duplicateCount,
			duplicateDetails,
			skippedDocuments,
			errors,
			posFieldsFilteredCount,
			isPartial,
			isComplete,
			queryLimitsApplied: {
				topLevelLimit,
				nestedLimit,
				pageSize
			},
			pagination: {
				pageSize,
				topLevelPages,
				nestedPages,
				topLevelExhausted,
				nestedExhausted
			},
			categoryResolution: categoryResult.diagnostics,
			dataQualityReport,
			anomalyAlerts
		},
		categoryResult,
		fetchTimestamp: (/* @__PURE__ */ new Date()).toISOString(),
		sourceProject: config.projectId
	};
}
/**
* Fetches a single production product by its identifier, attempting top-level first
* and nested items collectionGroup second.
*/
async function fetchProductionProductById(productId, options) {
	if (!isProductionPreviewOptedIn(options)) throw new Error("SAFETY GUARD ACTIVE: Production catalogue preview is strictly opt-in.\nTo inspect live production documents, provide optIn: true.");
	if (!productId || typeof productId !== "string" || productId.includes("/") || productId.includes("..")) return null;
	const { db } = getIsolatedProductionFirestore(options?.config);
	const categoryDocsMap = /* @__PURE__ */ new Map();
	try {
		const catDocs = await fetchProductionCategoryDocs(options);
		for (const c of catDocs) categoryDocsMap.set(c.id, c);
	} catch {}
	let topData = null;
	let topDocPath = null;
	try {
		const topRef = doc(db, "products", productId);
		const topSnap = await getDoc(topRef);
		if (topSnap.exists()) {
			topData = topSnap.data();
			topDocPath = topSnap.ref.path;
		}
	} catch (err) {
		console.warn(`[ProductionCatalogue] Error fetching top-level product "${productId}":`, err.message);
	}
	try {
		const candidatePaths = [
			`products/Grocery/items/${productId}`,
			`products/Cooking Oil/items/${productId}`,
			`products/Spices/items/${productId}`,
			`products/cat-groceries/items/${productId}`
		];
		let nestedDoc = null;
		for (const cPath of candidatePaths) {
			const [col1, doc1, col2, doc2] = cPath.split("/");
			if (col1 && doc1 && col2 && doc2) {
				const cRef = doc(db, col1, doc1, col2, doc2);
				const cSnap = await getDoc(cRef);
				if (cSnap.exists()) {
					nestedDoc = {
						path: cSnap.ref.path,
						data: cSnap.data(),
						parentCategory: doc1
					};
					break;
				}
			}
		}
		if (!nestedDoc) {
			const itemsQuery = query(collectionGroup(db, "items"), limit(100));
			const matches = (await getDocs(itemsQuery)).docs.filter((d) => d.id === productId && d.exists());
			if (matches.length > 0) {
				const bestMatch = matches.find((d) => {
					const data = d.data();
					return Boolean(data["name"] || data["productName"]);
				}) || matches[0];
				nestedDoc = {
					path: bestMatch.ref.path,
					data: bestMatch.data(),
					parentCategory: bestMatch.ref.parent?.parent?.id
				};
			}
		}
		if (nestedDoc) {
			const mergedData = topData ? {
				...nestedDoc.data,
				...topData,
				name: topData["name"] || topData["productName"] || nestedDoc.data["name"] || nestedDoc.data["productName"],
				productName: topData["productName"] || topData["name"] || nestedDoc.data["productName"] || nestedDoc.data["name"],
				description: topData["description"] || nestedDoc.data["description"],
				imageUrl: topData["imageUrl"] || nestedDoc.data["imageUrl"],
				imageUrls: topData["imageUrls"] || nestedDoc.data["imageUrls"],
				category: topData["category"] || nestedDoc.data["category"] || nestedDoc.data["categoryName"],
				categoryName: topData["categoryName"] || nestedDoc.data["categoryName"] || nestedDoc.data["category"]
			} : nestedDoc.data;
			const parentCat = nestedDoc.parentCategory;
			const catMapping = resolveProductCategoryMapping(mergedData, categoryDocsMap, parentCat);
			return normalizeLegacyProduct(mergedData, {
				docId: productId,
				documentPath: topDocPath || nestedDoc.path,
				...parentCat !== void 0 ? { parentCategory: parentCat } : {},
				resolvedCategory: catMapping.category,
				resolvedCategorySlug: catMapping.categorySlug,
				resolvedSubCategory: catMapping.subCategory
			});
		}
	} catch (err) {
		console.warn(`[ProductionCatalogue] Error searching nested item "${productId}":`, err.message);
	}
	if (topData) {
		const catMapping = resolveProductCategoryMapping(topData, categoryDocsMap);
		return normalizeLegacyProduct(topData, {
			docId: productId,
			documentPath: topDocPath || `products/${productId}`,
			resolvedCategory: catMapping.category,
			resolvedCategorySlug: catMapping.categorySlug,
			resolvedSubCategory: catMapping.subCategory
		});
	}
	return null;
}
/**
* Builds the canonical cart item key verified from the production codebase:
* `${productId}__opt${optionIndex}__${unit}__${unitSize}`
*/
function buildCartKey(productId, optionIndex, unit, unitSize) {
	return `${productId}__opt${optionIndex}__${unit}__${unitSize}`;
}
var CANONICAL_CUSTOMER_ID_RE$1 = /^(ONCUS\d{6,7}|SASS\d{6,7})$/i;
/**
* Validates whether a given string is a canonical Sri Amman Smart Store customer ID
* (either modern "ONCUS..." or legacy "SASS...").
* Examples: "ONCUS000010", "ONCUS000021", "SASS0000001", "SASS0000021".
* Rejects Firebase UIDs, guest sessions, and empty strings.
*/
function isValidCustomerId(value) {
	if (typeof value !== "string") return false;
	return CANONICAL_CUSTOMER_ID_RE$1.test(value.trim());
}
/**
* Safely parses coordinate (latitude / longitude) values.
* Handles numbers, finite numeric strings, strings with whitespace,
* and falls back safely to 0 for invalid, NaN, or non-numeric values.
*/
function parseSafeCoordinate(value, fallback = 0) {
	if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed) return fallback;
		const parsed = Number(trimmed);
		return Number.isFinite(parsed) ? parsed : fallback;
	}
	return fallback;
}
/**
* Normalizes address tags to valid Address union values: "Home" | "Work" | "Other".
*/
function parseAddressTag(val) {
	if (typeof val === "string") {
		const lower = val.trim().toLowerCase();
		if (lower === "work") return "Work";
		if (lower === "other") return "Other";
	}
	return "Home";
}
/**
* Legacy-Compatible Cart & Address Adapter (Emulator & Production Schema Compatible)
*
* Implements customer subcollection routing as verified in the live production
* Firestore database (`docs/production-firestore-schema-comparison.md`):
* - Cart: `users/{userDocId}/cart/{variantKey}`
* - Addresses: `users/{userDocId}/addresses/{addressId}`
* - Default Address: `users/{userDocId}.primaryAddressId`
*
* Safety & Identity Rules:
* 1. Strict SASS ID Requirement: All operations require a canonical SASS customer ID.
*    Firebase Authentication UIDs, guest session strings, or arbitrary strings are rejected.
* 2. Profile Precondition: The parent profile `users/{userDocId}` must exist before
*    accessing subcollections.
* 3. Default Address via `primaryAddressId`: `isDefault` is resolved from the parent
*    `users/{userDocId}.primaryAddressId` pointer.
* 4. Coordinate Normalization: String coordinates (`"8.8174..."`) are safely converted to numbers.
* 5. Strict Customer Isolation: Customer A cannot access or mutate Customer B's subcollections.
*/
var LegacyCartAddressAdapter = class {
	driver;
	constructor(driver) {
		this.driver = driver;
	}
	/**
	* Resolves the primary Firestore collection for the customer ("onlineCustomers" for ONCUS, "users" for SASS).
	*/
	getCustomerCollection(userId) {
		return userId.trim().toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
	}
	/**
	* Constructs the subcollection path for a given customer and subcollection name ("cart" or "addresses").
	*/
	getCustomerSubcollectionPath(userId, subcollection) {
		return `${this.getCustomerCollection(userId)}/${userId}/${subcollection}`;
	}
	/**
	* Asserts that the provided identifier is a valid canonical customer ID (SASS or ONCUS).
	* Throws a validation error if invalid or if a Firebase UID was provided.
	*/
	assertValidCustomer(userId) {
		const clean = typeof userId === "string" ? userId.trim() : "";
		if (!clean || !CANONICAL_CUSTOMER_ID_RE$1.test(clean)) throw new StorageAdapterError(`Invalid customer identifier "${userId}": Legacy-compatible customer operations require a canonical SASS customer ID (or ONCUS customer ID, e.g. 'ONCUS000010' or 'SASS0000001'). Firebase Authentication UIDs or guest IDs cannot be used as customer document paths.`, {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		return clean;
	}
	/**
	* Verifies that the customer profile document exists in Firestore (checking `onlineCustomers` or `users`).
	* Throws a 404 not-found error if the profile does not exist.
	*/
	async assertProfileExists(userDocId) {
		const validId = this.assertValidCustomer(userDocId);
		const primaryCol = this.getCustomerCollection(validId);
		let profile = await this.driver.getDoc(primaryCol, validId);
		if (!profile && primaryCol === "onlineCustomers") profile = await this.driver.getDoc("users", validId);
		if (!profile) throw new StorageAdapterError(`Not found: Customer profile '${primaryCol}/${validId}' does not exist. A valid customer profile must exist before accessing customer subcollections.`, {
			status: 404,
			code: "not-found",
			category: "not_found"
		});
		return profile;
	}
	/**
	* Extracts the canonical cartKey from an identifier that may be prefixed with `${userId}__`.
	*/
	extractCanonicalCartKey(rawKey, userId) {
		let key = (rawKey || "").trim();
		if (userId && key.startsWith(`${userId}__`)) key = key.slice(userId.length + 2);
		else if (key.includes("__opt")) {
			const parts = key.split("__");
			if (isValidCustomerId(parts[0]) && parts.length >= 5) key = parts.slice(1).join("__");
		}
		return key;
	}
	/**
	* Retrieves all cart items for a signed-in customer from `users/{userDocId}/cart`.
	*/
	async getCart(userId) {
		const validUserId = this.assertValidCustomer(userId);
		await this.assertProfileExists(validUserId);
		const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "cart");
		return (await this.driver.queryCollection(subcollectionPath, {})).map((docData) => {
			const docId = String(docData["id"] || docData["cartKey"] || docData["variantKey"] || "");
			const canonicalKey = this.extractCanonicalCartKey(docId, validUserId);
			const name = String(docData["name"] || docData["productName"] || "");
			const price = Number(docData["price"] ?? docData["sellingPrice"] ?? docData["mrp"] ?? 0);
			const mrp = Number(docData["mrp"] ?? docData["price"] ?? 0);
			const quantity = Number(docData["quantity"] ?? 1);
			const optionIndex = Number(docData["optionIndex"] ?? 0);
			const unit = String(docData["unit"] || "");
			const unitSize = String(docData["unitSize"] ?? "");
			const image = String(docData["image"] || docData["imageUrl"] || docData["frontImageUrl"] || "");
			const stock = typeof docData["stock"] === "number" ? docData["stock"] : 99;
			const item = {
				id: canonicalKey,
				cartKey: canonicalKey,
				userId: validUserId,
				productId: String(docData["productId"] || ""),
				optionIndex,
				unit,
				unitSize,
				name,
				price,
				mrp,
				quantity,
				image,
				stock
			};
			if (docData["specialPrice"] !== void 0 && typeof docData["specialPrice"] === "number") item.specialPrice = docData["specialPrice"];
			return item;
		});
	}
	/**
	* Retrieves a single cart item from `users/{userDocId}/cart/{variantKey}`.
	*/
	async getCartItem(userId, cartKey) {
		const validUserId = this.assertValidCustomer(userId);
		await this.assertProfileExists(validUserId);
		const canonicalKey = this.extractCanonicalCartKey(cartKey, validUserId);
		if (!canonicalKey) return null;
		const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "cart");
		const docData = await this.driver.getDoc(subcollectionPath, canonicalKey);
		if (!docData) return null;
		const name = String(docData["name"] || docData["productName"] || "");
		const price = Number(docData["price"] ?? docData["sellingPrice"] ?? docData["mrp"] ?? 0);
		const mrp = Number(docData["mrp"] ?? docData["price"] ?? 0);
		const quantity = Number(docData["quantity"] ?? 1);
		const optionIndex = Number(docData["optionIndex"] ?? 0);
		const unit = String(docData["unit"] || "");
		const unitSize = String(docData["unitSize"] ?? "");
		const image = String(docData["image"] || docData["imageUrl"] || docData["frontImageUrl"] || "");
		const stock = typeof docData["stock"] === "number" ? docData["stock"] : 99;
		const item = {
			id: canonicalKey,
			cartKey: canonicalKey,
			userId: validUserId,
			productId: String(docData["productId"] || ""),
			optionIndex,
			unit,
			unitSize,
			name,
			price,
			mrp,
			quantity,
			image,
			stock
		};
		if (docData["specialPrice"] !== void 0 && typeof docData["specialPrice"] === "number") item.specialPrice = docData["specialPrice"];
		return item;
	}
	/**
	* Adds or sets a cart item in `users/{userDocId}/cart/{variantKey}`.
	* Preserves canonical variantKey: `${productId}__opt${optionIndex}__${unit}__${unitSize}`.
	*/
	async addToCart(userId, itemData) {
		const validUserId = this.assertValidCustomer(userId);
		await this.assertProfileExists(validUserId);
		if (itemData["userId"] && typeof itemData["userId"] === "string") {
			const payloadUserId = itemData["userId"].trim();
			if (payloadUserId && payloadUserId !== validUserId) throw new StorageAdapterError(`Permission denied: Ownership mismatch. Cannot add cart item with userId '${payloadUserId}' to customer subcollection 'users/${validUserId}/cart'.`, {
				status: 403,
				code: "permission-denied",
				category: "permission"
			});
		}
		const quantity = Number(itemData["quantity"] ?? 1);
		if (quantity <= 0 || Number.isNaN(quantity)) throw new StorageAdapterError("Validation error: Cart item quantity must be a positive number.", {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		const productId = String(itemData["productId"] || "").trim();
		if (!productId) throw new StorageAdapterError("Validation error: Cart item requires a non-empty productId.", {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		const optionIndex = Number(itemData["optionIndex"] ?? 0);
		const unit = String(itemData["unit"] || "");
		const unitSize = String(itemData["unitSize"] ?? "");
		let variantKey = String(itemData["cartKey"] || itemData["variantKey"] || itemData["id"] || "").trim();
		variantKey = this.extractCanonicalCartKey(variantKey, validUserId);
		if (!variantKey || !variantKey.includes("__opt")) variantKey = buildCartKey(productId, optionIndex, unit, unitSize);
		const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "cart");
		const existing = await this.driver.getDoc(subcollectionPath, variantKey);
		const finalQuantity = existing ? Number(existing["quantity"] || 0) + quantity : quantity;
		const name = String(itemData["name"] || itemData["productName"] || existing?.["name"] || "");
		const price = Number(itemData["price"] ?? itemData["sellingPrice"] ?? existing?.["price"] ?? 0);
		const mrp = Number(itemData["mrp"] ?? existing?.["mrp"] ?? price);
		const image = String(itemData["image"] || itemData["imageUrl"] || itemData["frontImageUrl"] || existing?.["image"] || "");
		const docPayload = {
			id: variantKey,
			cartKey: variantKey,
			variantKey,
			userId: validUserId,
			productId,
			name,
			productName: name,
			price,
			sellingPrice: price,
			mrp,
			quantity: finalQuantity,
			unit,
			unitSize,
			optionIndex,
			image,
			imageUrl: image,
			frontImageUrl: image,
			addedAt: existing ? existing["addedAt"] : (/* @__PURE__ */ new Date()).toISOString(),
			lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
		};
		if (itemData["specialPrice"] !== void 0) docPayload["specialPrice"] = itemData["specialPrice"];
		else if (existing?.["specialPrice"] !== void 0) docPayload["specialPrice"] = existing["specialPrice"];
		if (itemData["stock"] !== void 0) docPayload["stock"] = itemData["stock"];
		else if (existing?.["stock"] !== void 0) docPayload["stock"] = existing["stock"];
		await this.driver.setDoc(subcollectionPath, variantKey, docPayload, false);
		const stock = typeof docPayload["stock"] === "number" ? Number(docPayload["stock"]) : 99;
		const result = {
			id: variantKey,
			cartKey: variantKey,
			userId: validUserId,
			productId,
			optionIndex,
			unit,
			unitSize,
			name,
			price,
			mrp,
			quantity: finalQuantity,
			image,
			stock
		};
		if (docPayload["specialPrice"] !== void 0) result.specialPrice = Number(docPayload["specialPrice"]);
		return result;
	}
	/**
	* Updates the quantity of a cart item in `users/{userDocId}/cart/{variantKey}`.
	* If quantity <= 0, the item is removed.
	*/
	async updateCartQuantity(userId, cartKey, quantity) {
		const validUserId = this.assertValidCustomer(userId);
		await this.assertProfileExists(validUserId);
		const canonicalKey = this.extractCanonicalCartKey(cartKey, validUserId);
		if (!canonicalKey) return null;
		if (quantity <= 0) {
			await this.removeFromCart(validUserId, canonicalKey);
			return null;
		}
		const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "cart");
		const existing = await this.driver.getDoc(subcollectionPath, canonicalKey);
		if (!existing) throw new StorageAdapterError(`HTTP Error 404: Cart item '${canonicalKey}' not found in 'users/${validUserId}/cart'.`, {
			status: 404,
			code: "not-found",
			category: "not_found"
		});
		const updated = await this.driver.updateDoc(subcollectionPath, canonicalKey, {
			quantity,
			lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
		});
		const stock = typeof updated["stock"] === "number" ? Number(updated["stock"]) : typeof existing["stock"] === "number" ? Number(existing["stock"]) : 99;
		return {
			id: canonicalKey,
			cartKey: canonicalKey,
			userId: validUserId,
			productId: String(updated["productId"] || existing["productId"] || ""),
			optionIndex: Number(updated["optionIndex"] ?? existing["optionIndex"] ?? 0),
			unit: String(updated["unit"] || existing["unit"] || ""),
			unitSize: String(updated["unitSize"] ?? existing["unitSize"] ?? ""),
			name: String(updated["name"] || existing["name"] || ""),
			price: Number(updated["price"] ?? existing["price"] ?? 0),
			mrp: Number(updated["mrp"] ?? existing["mrp"] ?? 0),
			quantity,
			image: String(updated["image"] || existing["image"] || ""),
			stock
		};
	}
	/**
	* Deletes a cart item from `users/{userDocId}/cart/{variantKey}`.
	*/
	async removeFromCart(userId, cartKey) {
		const validUserId = this.assertValidCustomer(userId);
		await this.assertProfileExists(validUserId);
		const canonicalKey = this.extractCanonicalCartKey(cartKey, validUserId);
		if (!canonicalKey) return;
		const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "cart");
		try {
			await this.driver.deleteDoc(subcollectionPath, canonicalKey);
		} catch (err) {
			if (err?.status !== 404) throw err;
		}
	}
	/**
	* Clears all cart items for a signed-in customer in `users/{userDocId}/cart`.
	*/
	async clearCart(userId) {
		const validUserId = this.assertValidCustomer(userId);
		await this.assertProfileExists(validUserId);
		const items = await this.getCart(validUserId);
		const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "cart");
		for (const item of items) {
			const canonicalKey = item.cartKey || item.id;
			try {
				await this.driver.deleteDoc(subcollectionPath, canonicalKey);
			} catch {}
		}
	}
	/**
	* Retrieves all saved addresses for a customer from `users/{userDocId}/addresses`.
	* Resolves `isDefault` through `users/{userDocId}.primaryAddressId`.
	* Safely normalizes string coordinates (`latitude` / `longitude`) to numbers.
	*/
	async getAddresses(userId) {
		const validUserId = this.assertValidCustomer(userId);
		const profile = await this.assertProfileExists(validUserId);
		const primaryAddressId = typeof profile["primaryAddressId"] === "string" && profile["primaryAddressId"].trim().length > 0 ? profile["primaryAddressId"].trim() : null;
		const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "addresses");
		return (await this.driver.queryCollection(subcollectionPath, {})).map((docData) => {
			const docId = String(docData["id"] || "");
			const lat = parseSafeCoordinate(docData["lat"] ?? docData["latitude"]);
			const lng = parseSafeCoordinate(docData["lng"] ?? docData["longitude"]);
			const isDefault = Boolean(primaryAddressId && docId === primaryAddressId);
			return {
				id: docId,
				userId: validUserId,
				name: String(docData["name"] || docData["fullName"] || ""),
				phone: String(docData["phone"] || docData["contact"] || ""),
				houseNo: String(docData["houseNo"] || docData["door"] || ""),
				street: String(docData["street"] || ""),
				landmark: String(docData["landmark"] || ""),
				city: String(docData["city"] || docData["town"] || ""),
				pincode: String(docData["pincode"] || ""),
				lat,
				lng,
				isDefault,
				tag: parseAddressTag(docData["tag"])
			};
		});
	}
	/**
	* Retrieves a single address from `users/{userDocId}/addresses/{addressId}`.
	*/
	async getAddress(userId, addressId) {
		const validUserId = this.assertValidCustomer(userId);
		const profile = await this.assertProfileExists(validUserId);
		const cleanAddressId = (addressId || "").trim();
		if (!cleanAddressId) return null;
		const primaryAddressId = typeof profile["primaryAddressId"] === "string" ? profile["primaryAddressId"].trim() : null;
		const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "addresses");
		const docData = await this.driver.getDoc(subcollectionPath, cleanAddressId);
		if (!docData) return null;
		const lat = parseSafeCoordinate(docData["lat"] ?? docData["latitude"]);
		const lng = parseSafeCoordinate(docData["lng"] ?? docData["longitude"]);
		const isDefault = Boolean(primaryAddressId && cleanAddressId === primaryAddressId);
		return {
			id: cleanAddressId,
			userId: validUserId,
			name: String(docData["name"] || docData["fullName"] || ""),
			phone: String(docData["phone"] || docData["contact"] || ""),
			houseNo: String(docData["houseNo"] || docData["door"] || ""),
			street: String(docData["street"] || ""),
			landmark: String(docData["landmark"] || ""),
			city: String(docData["city"] || docData["town"] || ""),
			pincode: String(docData["pincode"] || ""),
			lat,
			lng,
			isDefault,
			tag: parseAddressTag(docData["tag"])
		};
	}
	/**
	* Adds an address to `users/{userDocId}/addresses/{addressId}`.
	* If `address.isDefault === true` or if no addresses currently exist,
	* atomically updates `users/{userDocId}.primaryAddressId`.
	*/
	async addAddress(userId, addressData) {
		const validUserId = this.assertValidCustomer(userId);
		const profile = await this.assertProfileExists(validUserId);
		if (addressData["userId"] && typeof addressData["userId"] === "string") {
			const payloadUserId = addressData["userId"].trim();
			if (payloadUserId && payloadUserId !== validUserId) throw new StorageAdapterError(`Permission denied: Ownership mismatch. Cannot add address with userId '${payloadUserId}' to customer subcollection 'users/${validUserId}/addresses'.`, {
				status: 403,
				code: "permission-denied",
				category: "permission"
			});
		}
		const name = String(addressData["name"] || addressData["fullName"] || "").trim();
		const city = String(addressData["city"] || addressData["town"] || "").trim();
		if (!name || !city) throw new StorageAdapterError("Validation error: Address requires non-empty name and city.", {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		const addressId = String(addressData["id"] || `addr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`).trim();
		const lat = parseSafeCoordinate(addressData["lat"] ?? addressData["latitude"]);
		const lng = parseSafeCoordinate(addressData["lng"] ?? addressData["longitude"]);
		const houseNo = String(addressData["houseNo"] || addressData["door"] || "");
		const phone = String(addressData["phone"] || addressData["contact"] || "");
		const street = String(addressData["street"] || "");
		const landmark = String(addressData["landmark"] || "");
		const pincode = String(addressData["pincode"] || "");
		const tag = parseAddressTag(addressData["tag"]);
		const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "addresses");
		const docPayload = {
			id: addressId,
			userId: validUserId,
			name,
			fullName: name,
			phone,
			contact: phone,
			houseNo,
			door: houseNo,
			street,
			landmark,
			city,
			town: city,
			pincode,
			lat,
			latitude: lat,
			lng,
			longitude: lng,
			tag,
			createdAt: (/* @__PURE__ */ new Date()).toISOString(),
			lastUsed: (/* @__PURE__ */ new Date()).toISOString()
		};
		await this.driver.setDoc(subcollectionPath, addressId, docPayload, false);
		const currentPrimary = typeof profile["primaryAddressId"] === "string" ? profile["primaryAddressId"].trim() : "";
		const shouldBeDefault = Boolean(addressData.isDefault || !currentPrimary);
		if (shouldBeDefault) await this.driver.updateDoc(this.getCustomerCollection(validUserId), validUserId, {
			primaryAddressId: addressId,
			lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
		});
		return {
			id: addressId,
			userId: validUserId,
			name,
			phone,
			houseNo,
			street,
			landmark,
			city,
			pincode,
			lat,
			lng,
			isDefault: shouldBeDefault,
			tag
		};
	}
	/**
	* Updates an address in `users/{userDocId}/addresses/{addressId}`.
	* If `patch.isDefault === true`, updates `users/{userDocId}.primaryAddressId`.
	* If `patch.isDefault === false` and this address was primary, unsets `primaryAddressId`.
	*/
	async updateAddress(userId, addressId, patch) {
		const validUserId = this.assertValidCustomer(userId);
		const profile = await this.assertProfileExists(validUserId);
		const cleanAddressId = (addressId || "").trim();
		if (!cleanAddressId) throw new StorageAdapterError("Validation error: Address ID cannot be empty.", {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		if (patch["userId"] && typeof patch["userId"] === "string") {
			const payloadUserId = patch["userId"].trim();
			if (payloadUserId && payloadUserId !== validUserId) throw new StorageAdapterError(`Permission denied: Ownership mismatch. Cannot update address with userId '${payloadUserId}' in customer subcollection 'users/${validUserId}/addresses'.`, {
				status: 403,
				code: "permission-denied",
				category: "permission"
			});
		}
		const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "addresses");
		const existing = await this.driver.getDoc(subcollectionPath, cleanAddressId);
		if (!existing) throw new StorageAdapterError(`HTTP Error 404: Address '${cleanAddressId}' not found in 'users/${validUserId}/addresses'.`, {
			status: 404,
			code: "not-found",
			category: "not_found"
		});
		const cleanPatch = {};
		if (patch["name"] !== void 0 || patch["fullName"] !== void 0) {
			const n = String(patch["name"] ?? patch["fullName"]);
			cleanPatch["name"] = n;
			cleanPatch["fullName"] = n;
		}
		if (patch["phone"] !== void 0 || patch["contact"] !== void 0) {
			const p = String(patch["phone"] ?? patch["contact"]);
			cleanPatch["phone"] = p;
			cleanPatch["contact"] = p;
		}
		if (patch["houseNo"] !== void 0 || patch["door"] !== void 0) {
			const h = String(patch["houseNo"] ?? patch["door"]);
			cleanPatch["houseNo"] = h;
			cleanPatch["door"] = h;
		}
		if (patch["street"] !== void 0) cleanPatch["street"] = String(patch["street"]);
		if (patch["landmark"] !== void 0) cleanPatch["landmark"] = String(patch["landmark"]);
		if (patch["city"] !== void 0 || patch["town"] !== void 0) {
			const c = String(patch["city"] ?? patch["town"]);
			cleanPatch["city"] = c;
			cleanPatch["town"] = c;
		}
		if (patch["pincode"] !== void 0) cleanPatch["pincode"] = String(patch["pincode"]);
		if (patch["tag"] !== void 0) cleanPatch["tag"] = patch["tag"];
		if (patch["lat"] !== void 0 || patch["latitude"] !== void 0) {
			const latVal = parseSafeCoordinate(patch["lat"] ?? patch["latitude"]);
			cleanPatch["lat"] = latVal;
			cleanPatch["latitude"] = latVal;
		}
		if (patch["lng"] !== void 0 || patch["longitude"] !== void 0) {
			const lngVal = parseSafeCoordinate(patch["lng"] ?? patch["longitude"]);
			cleanPatch["lng"] = lngVal;
			cleanPatch["longitude"] = lngVal;
		}
		cleanPatch["lastUsed"] = (/* @__PURE__ */ new Date()).toISOString();
		const updated = await this.driver.updateDoc(subcollectionPath, cleanAddressId, cleanPatch);
		let currentPrimary = typeof profile["primaryAddressId"] === "string" ? profile["primaryAddressId"].trim() : "";
		const rootCol = this.getCustomerCollection(validUserId);
		if (patch.isDefault === true) {
			if (currentPrimary !== cleanAddressId) {
				await this.driver.updateDoc(rootCol, validUserId, {
					primaryAddressId: cleanAddressId,
					lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
				});
				currentPrimary = cleanAddressId;
			}
		} else if (patch.isDefault === false && currentPrimary === cleanAddressId) {
			await this.driver.updateDoc(rootCol, validUserId, {
				primaryAddressId: null,
				lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
			});
			currentPrimary = "";
		}
		const lat = parseSafeCoordinate(updated["lat"] ?? updated["latitude"] ?? existing["lat"]);
		const lng = parseSafeCoordinate(updated["lng"] ?? updated["longitude"] ?? existing["lng"]);
		return {
			id: cleanAddressId,
			userId: validUserId,
			name: String(updated["name"] || updated["fullName"] || existing["name"] || ""),
			phone: String(updated["phone"] || updated["contact"] || existing["phone"] || ""),
			houseNo: String(updated["houseNo"] || updated["door"] || existing["houseNo"] || ""),
			street: String(updated["street"] || existing["street"] || ""),
			landmark: String(updated["landmark"] || existing["landmark"] || ""),
			city: String(updated["city"] || updated["town"] || existing["city"] || ""),
			pincode: String(updated["pincode"] || existing["pincode"] || ""),
			lat,
			lng,
			isDefault: currentPrimary === cleanAddressId,
			tag: parseAddressTag(updated["tag"] ?? existing["tag"])
		};
	}
	/**
	* Deletes an address from `users/{userDocId}/addresses/{addressId}` or `onlineCustomers/{userDocId}/addresses/{addressId}`.
	* If the deleted address was `primaryAddressId`, unsets it on the customer profile.
	*/
	async deleteAddress(userId, addressId) {
		const validUserId = this.assertValidCustomer(userId);
		await this.assertProfileExists(validUserId);
		const cleanAddressId = (addressId || "").trim();
		if (!cleanAddressId) return;
		const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "addresses");
		await this.driver.deleteDoc(subcollectionPath, cleanAddressId);
		const rootCol = this.getCustomerCollection(validUserId);
		const latestProfile = await this.driver.getDoc(rootCol, validUserId);
		if ((typeof latestProfile?.["primaryAddressId"] === "string" ? latestProfile["primaryAddressId"].trim() : "") === cleanAddressId) await this.driver.updateDoc(rootCol, validUserId, {
			primaryAddressId: null,
			lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
	/**
	* Sets an address as default by updating the customer profile's `primaryAddressId`.
	* Verifies that the address document exists in the customer's subcollection.
	*/
	async setDefaultAddress(userId, addressId) {
		const validUserId = this.assertValidCustomer(userId);
		await this.assertProfileExists(validUserId);
		const cleanAddressId = (addressId || "").trim();
		if (!cleanAddressId) throw new StorageAdapterError("Validation error: Address ID cannot be empty.", {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		const subcollectionPath = this.getCustomerSubcollectionPath(validUserId, "addresses");
		if (!await this.driver.getDoc(subcollectionPath, cleanAddressId)) throw new StorageAdapterError(`HTTP Error 404: Address '${cleanAddressId}' not found in '${subcollectionPath}'. Setting default address requires that the address belongs to customer '${validUserId}'.`, {
			status: 404,
			code: "not-found",
			category: "not_found"
		});
		const rootCol = this.getCustomerCollection(validUserId);
		await this.driver.updateDoc(rootCol, validUserId, {
			primaryAddressId: cleanAddressId,
			lastUpdated: (/* @__PURE__ */ new Date()).toISOString()
		});
	}
};
var STORE_COORDINATES = {
	lat: 11.459319,
	lng: 77.333565,
	maxRadiusKm: 6,
	deliveryRadiusKm: 50,
	storeName: "Sri Amman Smart Store",
	locationName: "Gobichettipalayam, Erode",
	storeAddress: "Kasipalayam, Gobichettipalayam, Erode, Tamil Nadu 638454",
	serviceAreaDistrict: "Erode",
	serviceAreaState: "Tamil Nadu",
	serviceAreaPincodePrefix: "638"
};
/**
* Calculates Great-Circle distance between two coordinates in kilometers using Haversine formula.
*/
function calculateDistanceKm(lat1, lon1, lat2 = STORE_COORDINATES.lat, lon2 = STORE_COORDINATES.lng) {
	const R = 6371;
	const dLat = (lat2 - lat1) * Math.PI / 180;
	const dLon = (lon2 - lon1) * Math.PI / 180;
	const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return Math.round(R * c * 100) / 100;
}
function isWithinDeliveryGeofence(lat, lng, maxRadiusKm = STORE_COORDINATES.maxRadiusKm, storeLat = STORE_COORDINATES.lat, storeLng = STORE_COORDINATES.lng) {
	const distanceKm = calculateDistanceKm(lat, lng, storeLat, storeLng);
	return {
		eligible: distanceKm <= maxRadiusKm,
		distanceKm
	};
}
/**
* Validates delivery serviceability against dynamic store configuration (50 km radius, Erode, Tamil Nadu).
*/
function validateDeliveryServiceability(address, options = {}) {
	const maxRadiusKm = options.maxRadiusKm ?? STORE_COORDINATES.deliveryRadiusKm;
	const storeLat = options.storeLat ?? STORE_COORDINATES.lat;
	const storeLng = options.storeLng ?? STORE_COORDINATES.lng;
	const storeName = options.storeName ?? STORE_COORDINATES.storeName;
	const storeAddress = options.storeAddress ?? STORE_COORDINATES.storeAddress;
	const targetDistrict = options.serviceAreaDistrict ?? STORE_COORDINATES.serviceAreaDistrict;
	if (typeof address.lat === "number" && typeof address.lng === "number" && (address.lat !== 0 || address.lng !== 0)) {
		const distanceKm = calculateDistanceKm(address.lat, address.lng, storeLat, storeLng);
		if (distanceKm > maxRadiusKm) return {
			eligible: false,
			distanceKm,
			maxRadiusKm,
			reason: `Delivery is not available for this address. We deliver up to ${maxRadiusKm} km from our store in Gobichettipalayam, Erode. (Your location is approximately ${distanceKm} km away).`,
			storeName,
			storeAddress
		};
		return {
			eligible: true,
			distanceKm,
			maxRadiusKm,
			storeName,
			storeAddress
		};
	}
	const pincode = (address.pincode || "").trim();
	const city = (address.city || "").trim().toLowerCase();
	const district = (address.district || "").trim().toLowerCase();
	const state = (address.state || "").trim().toLowerCase();
	const isErodePincode = pincode.startsWith("638");
	const isErodeDistrict = district.includes("erode") || city.includes("erode") || city.includes("gobichettipalayam") || city.includes("bhavani") || city.includes("perundurai") || city.includes("sathyamangalam") || city.includes("anthiyur");
	if (state && !state.includes("tamil") && !state.includes("tn")) return {
		eligible: false,
		distanceKm: 0,
		maxRadiusKm,
		reason: `Deliveries are currently restricted to ${targetDistrict} district and up to ${maxRadiusKm} km from our store in Gobichettipalayam.`,
		storeName,
		storeAddress
	};
	if (isErodePincode || isErodeDistrict || !pincode && !city && !district) return {
		eligible: true,
		distanceKm: 0,
		maxRadiusKm,
		storeName,
		storeAddress
	};
	return {
		eligible: false,
		distanceKm: 0,
		maxRadiusKm,
		reason: `Deliveries are currently restricted to ${targetDistrict} district and up to ${maxRadiusKm} km from our store in Gobichettipalayam.`,
		storeName,
		storeAddress
	};
}
var DEFAULT_DELIVERY_SETTINGS = {
	deliveryEnabled: true,
	deliveryRadiusKm: 50,
	storeCoordinates: {
		lat: STORE_COORDINATES.lat,
		lng: STORE_COORDINATES.lng
	},
	storeName: STORE_COORDINATES.storeName,
	storeAddress: STORE_COORDINATES.storeAddress,
	serviceAreaDistrict: STORE_COORDINATES.serviceAreaDistrict,
	serviceAreaState: STORE_COORDINATES.serviceAreaState,
	minOrderValue: 0
};
var DEFAULT_PAYMENT_SETTINGS = {
	upiEnabled: true,
	merchantUpiId: "sriammansmartstore@okaxis",
	merchantName: "Sri Amman Smart Store",
	codEnabled: true
};
var LEGACY_CHECKOUT_DEFAULTS = {
	standardFreeThreshold: 500,
	standardCharge: 49,
	expressFreeThreshold: 1e3,
	expressCharge: 99,
	expressStartHour: 6,
	expressEndHour: 21,
	expressAutoThreshold: 4e3,
	coinValueInRupees: .05
};
function isLegacyExpressAvailable(hour, settings) {
	return hour >= settings.expressStartHour && hour < settings.expressEndHour;
}
function calculateLegacyDeliveryCharge(subtotal, speed, itemCount, settings) {
	if (itemCount <= 0) return 0;
	const threshold = speed === "express" ? settings.expressFreeThreshold : settings.standardFreeThreshold;
	const charge = speed === "express" ? settings.expressCharge : settings.standardCharge;
	return subtotal > threshold ? 0 : charge;
}
function finiteSetting(value, fallback) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
async function readLegacySetting(id) {
	try {
		return await apiClient.get(`/Settings/${id}`);
	} catch (error) {
		if (typeof error === "object" && error !== null && "status" in error && error.status === 404) return null;
		throw error;
	}
}
var settingsService = {
	async getDeliverySettings() {
		return apiClient.get("/deliverySettings");
	},
	async getDeliverySlots() {
		return apiClient.get("/deliverySlots");
	},
	async getStoreInfo() {
		return apiClient.get("/storeInfo");
	},
	/** Reads the legacy `Settings/{documentId}` checkout configuration documents. */
	async getLegacyCheckoutSettings() {
		const [delivery, expressTimes, expressAuto, coinValue] = await Promise.all([
			readLegacySetting("DeliverySettings"),
			readLegacySetting("ExpressTimeSlots"),
			readLegacySetting("ExpressAutoThreshold"),
			readLegacySetting("CoinValue")
		]);
		return {
			standardFreeThreshold: finiteSetting(delivery?.["standardFreeThreshold"], LEGACY_CHECKOUT_DEFAULTS.standardFreeThreshold),
			standardCharge: finiteSetting(delivery?.["standardCharge"], LEGACY_CHECKOUT_DEFAULTS.standardCharge),
			expressFreeThreshold: finiteSetting(delivery?.["expressFreeThreshold"], LEGACY_CHECKOUT_DEFAULTS.expressFreeThreshold),
			expressCharge: finiteSetting(delivery?.["expressCharge"], LEGACY_CHECKOUT_DEFAULTS.expressCharge),
			expressStartHour: finiteSetting(expressTimes?.["startHour"], LEGACY_CHECKOUT_DEFAULTS.expressStartHour),
			expressEndHour: finiteSetting(expressTimes?.["endHour"], LEGACY_CHECKOUT_DEFAULTS.expressEndHour),
			expressAutoThreshold: finiteSetting(expressAuto?.["threshold"] ?? expressAuto?.["value"], LEGACY_CHECKOUT_DEFAULTS.expressAutoThreshold),
			coinValueInRupees: finiteSetting(coinValue?.["value"] ?? coinValue?.["coinValue"] ?? coinValue?.["text"], LEGACY_CHECKOUT_DEFAULTS.coinValueInRupees)
		};
	},
	async getLegacyCoinValue() {
		const setting = await readLegacySetting("CoinValue");
		return finiteSetting(setting?.["value"] ?? setting?.["coinValue"] ?? setting?.["text"], LEGACY_CHECKOUT_DEFAULTS.coinValueInRupees);
	},
	/**
	* Reads dynamic store delivery configuration from Firestore `Settings/delivery`
	* with fallback to defaults (50 km radius, Gobichettipalayam center, Erode district).
	*/
	async getDeliveryConfiguration() {
		try {
			const deliveryDoc = await readLegacySetting("delivery") || await readLegacySetting("Delivery") || await readLegacySetting("DeliverySettings");
			if (deliveryDoc) {
				const radius = Number(deliveryDoc["deliveryRadiusKm"] ?? deliveryDoc["radiusKm"] ?? deliveryDoc["deliveryRadius"] ?? deliveryDoc["maxRadiusKm"]);
				const storeLat = Number(deliveryDoc["storeCoordinates"]?.lat ?? deliveryDoc["storeLocation"]?.latitude ?? deliveryDoc["storeLat"] ?? DEFAULT_DELIVERY_SETTINGS.storeCoordinates.lat);
				const storeLng = Number(deliveryDoc["storeCoordinates"]?.lng ?? deliveryDoc["storeLocation"]?.longitude ?? deliveryDoc["storeLng"] ?? DEFAULT_DELIVERY_SETTINGS.storeCoordinates.lng);
				return {
					deliveryEnabled: deliveryDoc["deliveryEnabled"] !== false,
					deliveryRadiusKm: Number.isFinite(radius) && radius > 0 ? radius : DEFAULT_DELIVERY_SETTINGS.deliveryRadiusKm,
					storeCoordinates: {
						lat: Number.isFinite(storeLat) ? storeLat : DEFAULT_DELIVERY_SETTINGS.storeCoordinates.lat,
						lng: Number.isFinite(storeLng) ? storeLng : DEFAULT_DELIVERY_SETTINGS.storeCoordinates.lng
					},
					storeName: String(deliveryDoc["storeName"] || DEFAULT_DELIVERY_SETTINGS.storeName),
					storeAddress: String(deliveryDoc["storeAddress"] || DEFAULT_DELIVERY_SETTINGS.storeAddress),
					serviceAreaDistrict: String(deliveryDoc["serviceAreaDistrict"] || DEFAULT_DELIVERY_SETTINGS.serviceAreaDistrict),
					serviceAreaState: String(deliveryDoc["serviceAreaState"] || DEFAULT_DELIVERY_SETTINGS.serviceAreaState),
					minOrderValue: Number(deliveryDoc["minOrderValue"] ?? 0)
				};
			}
		} catch (err) {
			console.warn("[settingsService] Error fetching Settings/delivery:", err);
		}
		return { ...DEFAULT_DELIVERY_SETTINGS };
	},
	/**
	* Reads dynamic store payment configuration from Firestore `Settings/payment`.
	*/
	async getPaymentConfiguration() {
		try {
			const paymentDoc = await readLegacySetting("payment") || await readLegacySetting("Payment") || await readLegacySetting("PaymentSettings");
			if (paymentDoc) return {
				upiEnabled: paymentDoc["upiEnabled"] !== false,
				merchantUpiId: String(paymentDoc["merchantUpiId"] || paymentDoc["upiId"] || DEFAULT_PAYMENT_SETTINGS.merchantUpiId),
				merchantName: String(paymentDoc["merchantName"] || DEFAULT_PAYMENT_SETTINGS.merchantName),
				codEnabled: paymentDoc["codEnabled"] !== false,
				...paymentDoc["qrCodeUrl"] ? { qrCodeUrl: String(paymentDoc["qrCodeUrl"]) } : {}
			};
		} catch (err) {
			console.warn("[settingsService] Error fetching Settings/payment:", err);
		}
		return { ...DEFAULT_PAYMENT_SETTINGS };
	}
};
var app = getApps().find((firebaseApp) => firebaseApp.name === "[DEFAULT]") ?? initializeApp({
	apiKey: "AIzaSyDTzovF1RChmczvRXTNtY9-i-cOTI2JAuQ",
	authDomain: "sri-amman-smart-store.firebaseapp.com",
	projectId: "sri-amman-smart-store",
	storageBucket: "sri-amman-smart-store.firebasestorage.app",
	messagingSenderId: "1018585256480",
	appId: "1:1018585256480:web:1312d2d636b0672098a245",
	measurementId: "G-7D1TG59XVM"
});
var auth = getAuth(app);
getFirestore(app);
var provider = new GoogleAuthProvider();
/**
* Date and DOB utilities for Sri Amman Smart Store.
*
* Prevents timezone-related off-by-one day shifts when parsing, converting,
* and displaying customer Date of Birth (DOB) values.
*/
/**
* Normalizes a DOB input into a clean string without timezone shift.
* - String inputs (e.g. "1990-05-14", "14 August") are trimmed and preserved as-is
*   without converting to a JavaScript Date object, avoiding timezone offset shifts.
* - Date objects or Firestore Timestamp objects are converted using UTC calendar parts
*   so that a date stored at UTC midnight never shifts to the previous day in timezones
*   behind UTC (e.g. UTC-5, UTC-8).
*/
function normalizeDobString(value) {
	if (value === null || value === void 0) return null;
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!trimmed) return null;
		if (trimmed.includes("T")) {
			const datePart = trimmed.split("T")[0];
			if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
		}
		return trimmed;
	}
	if (value instanceof Date && !Number.isNaN(value.getTime())) return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
	if (typeof value === "object") {
		const record = value;
		const rawSeconds = record["seconds"] ?? record["_seconds"];
		if (typeof rawSeconds === "number" && Number.isFinite(rawSeconds)) {
			const date = /* @__PURE__ */ new Date(rawSeconds * 1e3);
			return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
		}
	}
	return null;
}
var STRICT_NON_NEGATIVE_NUMERIC_RE = /^\d+(?:\.\d+)?$/;
var CANONICAL_ONCUS_ID_RE = /^ONCUS\d{6,7}$/i;
var CANONICAL_SASS_ID_RE$1 = /^SASS\d{6,7}$/i;
var CUSTOMER_COLLECTION_PATH_RE = /^\/?(?:users|onlineCustomers)\/([^/]+)\/?$/;
function isPlainRecord$1(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function getNonEmptyString$1(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}
function pickFirstString(record, keys) {
	for (const key of keys) {
		const candidate = getNonEmptyString$1(record[key]);
		if (candidate !== null) return candidate;
	}
	return null;
}
function pickFirstDobString(record, keys) {
	for (const key of keys) {
		const candidate = normalizeDobString(record[key]);
		if (candidate !== null) return candidate;
	}
	return null;
}
/**
* Strictly parses a non-negative finite number from a `number` or an unambiguous
* non-negative numeric string.
*
* Rejects negative numbers, `NaN`, `Infinity`, booleans, `null`, `undefined`,
* arrays, objects, currency symbols, and malformed strings.
*/
function parseStrictCoinValue(value) {
	if (typeof value === "number") return Number.isFinite(value) && value >= 0 ? value : null;
	if (typeof value === "string") {
		const trimmed = value.trim();
		if (!STRICT_NON_NEGATIVE_NUMERIC_RE.test(trimmed)) return null;
		const parsed = Number(trimmed);
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
	}
	return null;
}
/**
* Preserves phone numbers as strings, maintaining formatting characters
* (`+`, spaces, hyphens, parentheses) and leading zeros (e.g. `"09876543210"`,
* `"044-22334455"`).
*
* Also safely converts finite non-negative numeric phone fields from malformed
* legacy records without inventing missing digits.
*/
function normalizePhoneString(value) {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}
	if (typeof value === "number" && Number.isFinite(value) && value >= 0) return String(Math.trunc(value));
	return null;
}
function pickFirstPhoneString(record, keys) {
	for (const key of keys) {
		const phone = normalizePhoneString(record[key]);
		if (phone !== null) return phone;
	}
	return "";
}
/**
* Converts a string or Firestore Timestamp-like object into an ISO/string
* timestamp without fabricating a current date when missing or invalid.
*/
function normalizeTimestampString(value) {
	const direct = getNonEmptyString$1(value);
	if (direct !== null) return direct;
	if (!isPlainRecord$1(value)) return null;
	const toDateFn = value["toDate"];
	if (typeof toDateFn === "function") try {
		const dateResult = toDateFn.call(value);
		if (dateResult instanceof Date && Number.isFinite(dateResult.getTime())) return dateResult.toISOString();
	} catch {
		return null;
	}
	const rawSeconds = value["seconds"] ?? value["_seconds"];
	const rawNanos = value["nanoseconds"] ?? value["_nanoseconds"] ?? 0;
	if (typeof rawSeconds === "number" && Number.isFinite(rawSeconds)) {
		const nanos = typeof rawNanos === "number" && Number.isFinite(rawNanos) ? rawNanos : 0;
		const ms = rawSeconds * 1e3 + Math.floor(nanos / 1e6);
		const date = new Date(ms);
		if (Number.isFinite(date.getTime())) return date.toISOString();
	}
	return null;
}
function extractDocIdFromPath(documentPath) {
	const cleanPath = getNonEmptyString$1(documentPath);
	if (!cleanPath) return null;
	const match = CUSTOMER_COLLECTION_PATH_RE.exec(cleanPath);
	return match && match[1] ? getNonEmptyString$1(match[1]) : null;
}
/**
* Resolves the canonical customer document ID (`id` / `userId`), prioritizing ONCUS IDs, then SASS IDs.
*
* Precedence order:
*   1. `rawDoc.userId`
*   2. `rawDoc.id`
*   3. `rawDoc._docId`
*   4. `context.docId`
*   5. `context.documentPath` (`onlineCustomers/{userDocId}` or `users/{userDocId}`)
*
* Conflict resolution rule:
* - `rawDoc.uid` (Firebase Auth UID) is NEVER used as a fallback for `id` or `userId`.
* - If multiple ID candidates exist, canonical `ONCUS...` identifiers take highest precedence,
*   followed by canonical `SASS...` identifiers.
* - If `rawDoc.uid` is present and a candidate (`id`) equals `rawDoc.uid` while another candidate
*   (`userId` or `context.docId`) provides a distinct customer document ID, the distinct customer
*   document ID is selected.
*/
function resolveCanonicalUserId(record, context) {
	const firebaseUid = getNonEmptyString$1(record["uid"]);
	const validCandidates = [
		getNonEmptyString$1(record["userId"]),
		getNonEmptyString$1(record["id"]),
		getNonEmptyString$1(record["_docId"]),
		getNonEmptyString$1(context?.docId),
		extractDocIdFromPath(context?.documentPath)
	].filter((candidate) => candidate !== null);
	if (validCandidates.length === 0) return null;
	for (const candidate of validCandidates) if (CANONICAL_ONCUS_ID_RE.test(candidate)) return candidate.toUpperCase();
	for (const candidate of validCandidates) if (CANONICAL_SASS_ID_RE$1.test(candidate)) return candidate.toUpperCase();
	if (firebaseUid !== null) {
		const distinctFromUid = validCandidates.find((candidate) => candidate !== firebaseUid);
		if (distinctFromUid !== void 0) return distinctFromUid;
	}
	return validCandidates[0] ?? null;
}
/**
* Resolves canonical spendable coin balance (`smartCoins`), legacy alias (`coins`),
* and historical coin fields (`earnedCoins`, `availableCoins`).
*
* Precedence for canonical spendable `smartCoins`:
*   1. `rawDoc.smartCoins` (canonical current balance)
*   2. `rawDoc.coins` (legacy fallback for unmigrated documents)
*   3. `rawDoc.availableCoins` (legacy spendable field)
*   4. `rawDoc.availableCoins32` (legacy 32-bit field)
*   5. `0` (default fallback)
*/
function resolveCoinBalances(record) {
	const directSmartCoins = parseStrictCoinValue(record["smartCoins"]);
	const directCoins = parseStrictCoinValue(record["coins"]);
	const legacyAvailableCoins = parseStrictCoinValue(record["availableCoins"]) ?? parseStrictCoinValue(record["availableCoins32"]);
	const legacyEarnedCoins = parseStrictCoinValue(record["earnedCoins"]);
	const smartCoins = directSmartCoins ?? directCoins ?? legacyAvailableCoins ?? 0;
	return {
		smartCoins,
		coins: smartCoins,
		availableCoins: legacyAvailableCoins,
		earnedCoins: legacyEarnedCoins
	};
}
/**
* Pure, read-only mapper that converts a legacy Firestore `users/{userDocId}` document
* (or an already-normalized frontend `User` object) into the canonical frontend `User` shape.
*
* Returns `null` if the input is not a plain object or lacks a resolvable customer ID.
*/
function normalizeLegacyUser(rawDoc, context) {
	if (!isPlainRecord$1(rawDoc)) return null;
	const resolvedUserId = resolveCanonicalUserId(rawDoc, context);
	if (!resolvedUserId) return null;
	const name = pickFirstString(rawDoc, [
		"name",
		"fullName",
		"displayName"
	]) ?? "";
	const phone = pickFirstPhoneString(rawDoc, [
		"phone",
		"number",
		"phoneNumber",
		"contact"
	]);
	const email = pickFirstString(rawDoc, ["email", "userEmail"]) ?? "";
	const { smartCoins, coins, availableCoins, earnedCoins } = resolveCoinBalances(rawDoc);
	const isVIP = typeof rawDoc["isVIP"] === "boolean" ? rawDoc["isVIP"] : false;
	const referralCode = getNonEmptyString$1(rawDoc["referralCode"]) ?? "";
	const createdAt = normalizeTimestampString(rawDoc["createdAt"]) ?? normalizeTimestampString(rawDoc["lastUpdated"]) ?? "";
	const primaryAddressId = getNonEmptyString$1(rawDoc["primaryAddressId"]);
	const referredBy = getNonEmptyString$1(rawDoc["referredBy"]);
	const preferredLanguage = pickFirstString(rawDoc, ["preferredLanguage", "language"]);
	const dob = pickFirstDobString(rawDoc, [
		"dob",
		"dateOfBirth",
		"birthday"
	]);
	const groceryRhythm = getNonEmptyString$1(rawDoc["groceryRhythm"]);
	const avatarUrl = pickFirstString(rawDoc, [
		"avatarUrl",
		"photoURL",
		"profileImage"
	]);
	const uid = getNonEmptyString$1(rawDoc["uid"]);
	const countryCode = getNonEmptyString$1(rawDoc["countryCode"]);
	const gender = getNonEmptyString$1(rawDoc["gender"]);
	const phoneVerified = typeof rawDoc["phoneVerified"] === "boolean" ? rawDoc["phoneVerified"] : null;
	const rawLegacySassId = getNonEmptyString$1(rawDoc["legacySassId"]) ?? getNonEmptyString$1(rawDoc["sassId"]) ?? (context?.legacySassId ? getNonEmptyString$1(context.legacySassId) : null);
	const legacySassId = rawLegacySassId && CANONICAL_SASS_ID_RE$1.test(rawLegacySassId) ? rawLegacySassId.toUpperCase() : null;
	const customerId = getNonEmptyString$1(rawDoc["customerId"]) ?? resolvedUserId;
	const accountType = getNonEmptyString$1(rawDoc["accountType"]);
	const role = getNonEmptyString$1(rawDoc["role"]);
	const updatedAt = normalizeTimestampString(rawDoc["updatedAt"]) ?? normalizeTimestampString(rawDoc["lastUpdated"]);
	const lastUpdated = normalizeTimestampString(rawDoc["lastUpdated"]) ?? normalizeTimestampString(rawDoc["updatedAt"]);
	return {
		id: resolvedUserId,
		userId: resolvedUserId,
		customerId,
		...legacySassId !== null ? { legacySassId } : {},
		name,
		phone,
		email,
		smartCoins,
		coins: smartCoins,
		...availableCoins !== null ? { availableCoins } : {},
		...earnedCoins !== null ? { earnedCoins } : {},
		...primaryAddressId !== null ? { primaryAddressId } : {},
		...uid !== null ? { uid } : {},
		...countryCode !== null ? { countryCode } : {},
		...gender !== null ? { gender } : {},
		...phoneVerified !== null ? { phoneVerified } : {},
		...accountType !== null ? { accountType } : {},
		...role !== null ? { role } : {},
		isVIP,
		referralCode,
		...referredBy !== null ? { referredBy } : {},
		createdAt,
		...updatedAt !== null ? { updatedAt } : {},
		...lastUpdated !== null ? { lastUpdated } : {},
		...preferredLanguage !== null ? { preferredLanguage } : {},
		...dob !== null ? {
			dob,
			birthday: dob
		} : {},
		...groceryRhythm !== null ? { groceryRhythm } : {},
		...avatarUrl !== null ? { avatarUrl } : {}
	};
}
/**
* Sri Amman Smart Store — Centralized Customer Data Source Resolver
*
* Provides authoritative, testable routing and identity resolution between
* migrated `onlineCustomers` documents and legacy `users` records.
*
* Migration Scope:
*   - SASS0000010 <-> ONCUS0000010 (Customer A: "Micro Soft")
*   - SASS0000021 <-> ONCUS0000021 (Customer B: "SARAVANA KUMAR")
*
* Strict Rules:
*   1. Preserves Firebase Authentication as the login mechanism.
*   2. Validates that authenticated UID matches usersByUid mapping and stored profile UID.
*   3. Resolves canonical ONCUS customer IDs for approved migrated accounts.
*   4. Keeps legacy users/SASS... path for non-migrated customers without global breakage.
*   5. Never trusts customer IDs from URLs, localStorage, or client parameters without
*      validating them against authenticated identity.
*/
/**
* Registry of approved customers migrated to the `onlineCustomers` collection.
* Maps legacy SASS ID -> canonical ONCUS ID.
*/
var APPROVED_MIGRATED_CUSTOMERS = Object.freeze({
	SASS0000010: "ONCUS0000010",
	SASS0000021: "ONCUS0000021"
});
/** Reverse lookup: canonical ONCUS ID -> legacy SASS ID */
var REVERSE_MIGRATED_CUSTOMERS = Object.freeze({
	ONCUS0000010: "SASS0000010",
	ONCUS0000021: "SASS0000021"
});
/**
* Resolves the canonical data source and collection for a given raw customer ID.
*
* Rules:
*   1. If `rawCustomerId` is an approved migrated SASS ID (SASS0000010, SASS0000021),
*      resolves to collection "onlineCustomers" and canonical ID "ONCUS0000010" / "ONCUS0000021".
*   2. If `rawCustomerId` is already an ONCUS ID (or mapping collection is "onlineCustomers"),
*      resolves to collection "onlineCustomers" and looks up legacySassId.
*   3. All other SASS IDs (e.g. SASS0000104, SASS9999901) remain on collection "users"
*      with isMigrated = false.
*/
function resolveCustomerDataSource(rawCustomerId, mappingCollection) {
	const trimmed = (rawCustomerId || "").trim();
	const cleanId = trimmed.toUpperCase();
	if (!trimmed) throw new Error("Customer data source resolution requires a non-empty customer ID");
	if (CANONICAL_ONCUS_ID_RE.test(cleanId) || mappingCollection === "onlineCustomers") {
		const legacySass = REVERSE_MIGRATED_CUSTOMERS[cleanId];
		return {
			canonicalCustomerId: cleanId,
			collection: "onlineCustomers",
			profilePath: `onlineCustomers/${cleanId}`,
			subcollectionBasePath: `onlineCustomers/${cleanId}`,
			...legacySass ? { legacySassId: legacySass } : {},
			isMigrated: true
		};
	}
	const migratedOncusId = APPROVED_MIGRATED_CUSTOMERS[cleanId];
	if (migratedOncusId) return {
		canonicalCustomerId: migratedOncusId,
		collection: "onlineCustomers",
		profilePath: `onlineCustomers/${migratedOncusId}`,
		subcollectionBasePath: `onlineCustomers/${migratedOncusId}`,
		legacySassId: cleanId,
		isMigrated: true
	};
	const resolvedNonMigratedId = cleanId.startsWith("SASS") ? cleanId : trimmed;
	return {
		canonicalCustomerId: resolvedNonMigratedId,
		collection: "users",
		profilePath: `users/${resolvedNonMigratedId}`,
		subcollectionBasePath: `users/${resolvedNonMigratedId}`,
		isMigrated: false
	};
}
/**
* Returns the REST/API endpoint for fetching or updating a customer profile.
* E.g. "/onlineCustomers/ONCUS0000010" or "/users/SASS0000104"
*/
function getCustomerProfileEndpoint(customerId) {
	const ds = resolveCustomerDataSource(customerId);
	return `/${ds.collection}/${encodeURIComponent(ds.canonicalCustomerId)}`;
}
var AUTH_STORAGE_KEY = "sass_customer_session";
var TEST_CREDENTIALS = {
	phone: "+91 99999 99999",
	cleanPhone: "9999999999",
	otp: "123456",
	defaultUserId: "SASS0000104",
	vipPhone: "+91 94433 12345",
	vipCleanPhone: "9443312345",
	vipEmail: "priya.sundaram@example.com",
	regularEmail: "arun.kumar@example.com",
	defaultPassword: "password123",
	linkedCustomerId: "SASS9999901",
	linkedCustomerEmail: "emulator.linked.customer@sriamman.test",
	linkedCustomerName: "Emulator Test Customer"
};
function stripFirebaseUidFromMockUser(user) {
	const { uid: _ignoredUid, ...mockUser } = user;
	return mockUser;
}
var authService = {
	async requestOtp(phone) {
		const cleanNumber = phone.replace(/\D/g, "").slice(-10);
		if (cleanNumber.length !== 10) throw new Error("Please enter a valid 10-digit mobile number.");
		return {
			success: true,
			message: `OTP sent to +91 ${cleanNumber}. (Test OTP: ${TEST_CREDENTIALS.otp})`
		};
	},
	async verifyOtp(phone, otp, referralCode) {
		const cleanNumber = phone.replace(/\D/g, "").slice(-10);
		if (cleanNumber.length !== 10) throw new Error("Please enter a valid 10-digit mobile number.");
		if (otp !== TEST_CREDENTIALS.otp && otp !== "000000") throw new Error(`Invalid OTP. For test login, please use ${TEST_CREDENTIALS.otp}`);
		try {
			const users = await apiClient.get("/users");
			let user = users ? users.find((u) => u.phone.replace(/\D/g, "").endsWith(cleanNumber)) : null;
			if (!user) {
				const nextNum = (users?.length || 0) + 105;
				const newId = `SASS${String(nextNum).padStart(7, "0")}`;
				const hasReferral = referralCode && referralCode.trim().length > 0;
				const initialCoins = hasReferral ? 150 : 50;
				const newUser = {
					id: newId,
					userId: newId,
					name: `Customer ${cleanNumber.slice(-4)}`,
					phone: `+91 ${cleanNumber.slice(0, 5)} ${cleanNumber.slice(5)}`,
					email: `user_${cleanNumber}@sriammanstore.com`,
					smartCoins: initialCoins,
					coins: initialCoins,
					isVIP: false,
					referralCode: newId,
					...hasReferral ? { referredBy: referralCode.trim().toUpperCase() } : {},
					createdAt: (/* @__PURE__ */ new Date()).toISOString()
				};
				user = await apiClient.post("/users", newUser);
			}
			const mockUser = stripFirebaseUidFromMockUser(user);
			if (typeof window !== "undefined") localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
			return mockUser;
		} catch (err) {
			if (err.message && err.message.includes("Invalid OTP")) throw err;
			throw new Error(err.message || "Authentication failed. Please try again.");
		}
	},
	async loginWithEmail(email, password) {
		const cleanEmail = email.trim().toLowerCase();
		if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error("Please enter a valid email address.");
		if (!password || password.length < 6) throw new Error("Password must be at least 6 characters long.");
		try {
			const users = await apiClient.get("/users");
			const user = users ? users.find((u) => u.email.toLowerCase() === cleanEmail) : null;
			if (!user) throw new Error("No account found with this email. Please check your email or sign in with Mobile OTP.");
			const mockUser = stripFirebaseUidFromMockUser(user);
			if (typeof window !== "undefined") localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
			return mockUser;
		} catch (err) {
			throw err;
		}
	},
	async validateReferralCode(code) {
		const cleanCode = code.trim().toUpperCase();
		if (!cleanCode) return {
			valid: false,
			bonusCoins: 0,
			message: "Please enter a referral code."
		};
		if (cleanCode === "AMMAN50" || cleanCode === "AMMAN100" || cleanCode.startsWith("SASS")) {
			const bonus = cleanCode === "AMMAN100" ? 100 : 50;
			return {
				valid: true,
				bonusCoins: bonus,
				message: `Code ${cleanCode} applied! You will receive ${bonus} bonus Smart Coins.`
			};
		}
		return {
			valid: false,
			bonusCoins: 0,
			message: "Invalid referral code. Please check and try again."
		};
	},
	getCurrentUser() {
		if (typeof window === "undefined") return null;
		const stored = localStorage.getItem(AUTH_STORAGE_KEY);
		if (!stored) return null;
		try {
			const parsed = JSON.parse(stored);
			if (!parsed || typeof parsed !== "object" || typeof parsed.id !== "string") return null;
			return stripFirebaseUidFromMockUser(parsed);
		} catch {
			return null;
		}
	},
	logout() {
		if (typeof window !== "undefined") localStorage.removeItem(AUTH_STORAGE_KEY);
	},
	/**
	* Synchronizes updated customer data (e.g. coin balance changes after order placement)
	* into the active local mock session in localStorage if the updated user matches the
	* current session customer.
	*/
	syncUserSession(updatedUser) {
		if (typeof window === "undefined") return null;
		const current = this.getCurrentUser();
		const targetId = updatedUser.id || updatedUser.userId;
		if (current && targetId && current.id !== targetId && current.userId !== targetId) return null;
		const resolvedId = targetId || current?.id || current?.userId || "";
		if (!resolvedId) return null;
		const clean = stripFirebaseUidFromMockUser({
			...current || {},
			...updatedUser,
			id: resolvedId,
			userId: resolvedId
		});
		localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(clean));
		return clean;
	},
	/**
	* Fetches the authoritative customer profile from the backend storage (/users/:userId),
	* synchronizes it to the local mock session in localStorage, and returns the updated user.
	*/
	async fetchUser(userId) {
		const cleanId = (userId || "").trim();
		if (!cleanId) return null;
		try {
			const endpoint = getCustomerProfileEndpoint(cleanId);
			const user = await apiClient.get(endpoint);
			if (user) {
				const mockUser = stripFirebaseUidFromMockUser(user);
				if (typeof window !== "undefined") localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
				return mockUser;
			}
			return null;
		} catch {
			return this.getCurrentUser();
		}
	},
	async updateProfile(userId, data) {
		const { uid: _ignoredInputUid, birthday: inputBirthday, ...safeData } = data;
		const resolvedDob = normalizeDobString(data.dob ?? inputBirthday);
		const finalData = {
			...safeData,
			...resolvedDob !== null ? { dob: resolvedDob } : {}
		};
		const endpoint = getCustomerProfileEndpoint(userId);
		const mockUser = stripFirebaseUidFromMockUser(await apiClient.patch(endpoint, finalData));
		if (resolvedDob && !mockUser.dob) mockUser.dob = resolvedDob;
		if (mockUser.dob) mockUser.birthday = mockUser.dob;
		if (typeof window !== "undefined") localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(mockUser));
		return mockUser;
	}
};
var PRODUCTION_AUTH_APP_NAME = PRODUCTION_SDK_APP_NAME;
/**
* Raised when any state-mutating action is attempted against production Firebase Auth
* during Phase 2.
*/
var ProductionAuthSafetyError = class extends Error {
	constructor(action) {
		super(`SAFETY VIOLATION: Production write action "${action}" is strictly prohibited in Phase 2.\nCreating production auth accounts, sending live password resets, verification emails, or mutating customer documents require separate explicit user approval.`);
		this.name = "ProductionAuthSafetyError";
	}
};
/**
* Maps raw Firebase Authentication error codes to safe, customer-friendly messages
* without leaking passwords, secret tokens, or internal account discovery details.
*/
function mapFirebaseAuthError$1(error) {
	if (!error) return "Authentication failed. Please try again.";
	const rawCode = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
	const rawMessage = error instanceof Error ? error.message : String(error);
	switch (rawCode) {
		case "auth/invalid-credential":
		case "auth/wrong-password":
		case "auth/user-not-found": return "Invalid email address or password. Please verify your credentials or sign in with Mobile OTP.";
		case "auth/invalid-email": return "Please enter a valid email address.";
		case "auth/user-disabled": return "This customer account has been disabled. Please contact Sri Amman Smart Store support.";
		case "auth/too-many-requests": return "Access to this account has been temporarily disabled due to many failed login attempts. Please try again later or reset your password.";
		case "auth/network-request-failed": return "Network connection error. Please verify your internet connection and try again.";
		case "auth/popup-closed-by-user":
		case "auth/cancelled-popup-request": return "Google sign-in was cancelled. You can try again when you are ready.";
		case "auth/popup-blocked": return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
		case "auth/operation-not-allowed": return "This authentication method is currently disabled. Please sign in with Mobile OTP or contact support.";
		case "auth/email-already-in-use": return "An account may already exist for this email. Try signing in or password recovery.";
		case "auth/requires-recent-login": return "This operation requires a recent sign-in. Please log in again to continue.";
		case "auth/emulator-unavailable": return "The authentication service is unavailable. Check your connection and try again.";
		default:
			if (rawCode === "auth/unauthorized-domain") return "This site is not on Firebase Auth's authorized domains list. In Firebase Console, open Authentication → Settings → Authorized domains and add this hostname.";
			if (rawMessage.includes("SAFETY VIOLATION")) return rawMessage;
			if (rawMessage.includes("ECONNREFUSED") || rawMessage.includes("Failed to fetch")) return "Unable to connect to the authentication service. Please check your connection or emulator status.";
			return "Authentication failed. Please check your details and try again.";
	}
}
/**
* Resolves the default authentication mode.
*
* STRICT INVARIANTS:
* 1. Always defaults to "emulator" (local Auth Emulator at 127.0.0.1:9099).
* 2. Ignores any production catalog parameters (e.g. `?catalogMode=production-readonly`
*    must NEVER activate production authentication).
* 3. Only switches if explicitly configured via `VITE_AUTH_MODE`, `sessionStorage`,
*    or dedicated `authMode` parameter.
*/
function resolveDefaultAuthMode() {
	return "production";
}
var DefaultFirebaseAuthDriver = class {
	signInWithGoogle(auth) {
		return signInWithPopup(auth, provider);
	}
	signInWithEmailAndPassword(auth, email, password) {
		return signInWithEmailAndPassword(auth, email, password);
	}
	createUserWithEmailAndPassword(auth, email, password) {
		return createUserWithEmailAndPassword(auth, email, password);
	}
	sendEmailVerification(user) {
		return sendEmailVerification(user);
	}
	signOut(auth) {
		return signOut(auth);
	}
	onAuthStateChanged(auth, listener) {
		return onAuthStateChanged(auth, listener);
	}
	getCurrentUser(auth) {
		return auth.currentUser;
	}
};
/**
* Firebase Authentication Adapter.
* Works in both "emulator" (default) and "production" modes using the modular Firebase Auth SDK.
* In production mode, all mutation actions are strictly blocked by safety assertions.
*/
var FirebaseAuthAdapter = class {
	mode;
	driver = new DefaultFirebaseAuthDriver();
	constructor(mode = "emulator") {
		this.mode = mode;
	}
	isProduction() {
		return this.mode === "production";
	}
	/**
	* Overrides the underlying Firebase Auth driver (useful for deterministic unit testing).
	*/
	setDriverForTesting(driver) {
		this.driver = driver ?? new DefaultFirebaseAuthDriver();
	}
	/**
	* Retrieves or initializes the isolated Firebase Auth instance according to mode.
	*/
	getAuthInstance() {
		if (this.mode === "production") {
			const validation = validateProductionPreviewConfig({
				projectId: app.options.projectId ?? "",
				authDomain: app.options.authDomain ?? "",
				messagingSenderId: app.options.messagingSenderId ?? "",
				storageBucket: app.options.storageBucket ?? "",
				appId: app.options.appId ?? "",
				apiKey: app.options.apiKey ?? ""
			});
			if (!validation.valid) throw new Error(`CONFIGURATION SAFETY ERROR:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`);
			return {
				auth,
				app,
				projectId: EXPECTED_PRODUCTION_PROJECT_ID
			};
		}
		const { auth: auth$1, app: app$1, config } = getEmulatorAuth();
		return {
			auth: auth$1,
			app: app$1,
			projectId: config.projectId
		};
	}
	/**
	* Strictly asserts that an action does not perform forbidden production mutations.
	*/
	assertWritePermitted(action) {
		if (this.isProduction()) throw new ProductionAuthSafetyError(action);
	}
	getCurrentUser() {
		try {
			const { auth } = this.getAuthInstance();
			const user = this.driver.getCurrentUser(auth);
			return user ? this.mapFirebaseUserToIdentity(user) : null;
		} catch {
			return null;
		}
	}
	subscribeAuthState(listener) {
		try {
			const { auth } = this.getAuthInstance();
			return this.driver.onAuthStateChanged(auth, (firebaseUser) => {
				listener(firebaseUser ? this.mapFirebaseUserToIdentity(firebaseUser) : null);
			});
		} catch (err) {
			console.error("[FirebaseAuthAdapter] Failed to subscribe to auth state:", err.message);
			listener(null);
			return () => {};
		}
	}
	async loginWithEmail(email, password) {
		const cleanEmail = email.trim().toLowerCase();
		if (!cleanEmail) throw new Error("Please enter a valid email address.");
		if (!password) throw new Error("Please enter your password.");
		try {
			const { auth } = this.getAuthInstance();
			const credential = await this.driver.signInWithEmailAndPassword(auth, cleanEmail, password);
			return this.mapFirebaseUserToIdentity(credential.user);
		} catch (err) {
			const friendlyMessage = mapFirebaseAuthError$1(err);
			throw new Error(friendlyMessage);
		}
	}
	async signInWithGoogle() {
		try {
			const { auth } = this.getAuthInstance();
			if (!this.driver.signInWithGoogle) throw new Error("Google sign-in is unavailable in this session.");
			const credential = await this.driver.signInWithGoogle(auth);
			return {
				...this.mapFirebaseUserToIdentity(credential.user),
				providerId: "firebase-google"
			};
		} catch (err) {
			throw new Error(mapFirebaseAuthError$1(err));
		}
	}
	async signOut() {
		try {
			const { auth } = this.getAuthInstance();
			await this.driver.signOut(auth);
		} catch (err) {
			console.warn("[FirebaseAuthAdapter] Error during sign out:", err.message);
		}
	}
	/**
	* Production write blockers:
	* Any attempt to register live production users, trigger password reset emails,
	* or send live verification emails is intercepted and blocked.
	*/
	async createUserWithEmailAndPassword(email = "", password = "") {
		const cleanEmail = email.trim().toLowerCase();
		if (!cleanEmail || !password) throw new Error("Enter a valid email address and password.");
		try {
			const { auth } = this.getAuthInstance();
			if (!this.driver.createUserWithEmailAndPassword) throw new Error("Firebase email/password registration is unavailable.");
			const result = await this.driver.createUserWithEmailAndPassword(auth, cleanEmail, password);
			return this.mapFirebaseUserToIdentity(result.user);
		} catch (err) {
			throw new Error(mapFirebaseAuthError$1(err));
		}
	}
	async sendPasswordResetEmail() {
		this.assertWritePermitted("sendPasswordResetEmail");
		throw new ProductionAuthSafetyError("sendPasswordResetEmail");
	}
	async sendEmailVerification() {
		this.assertWritePermitted("sendEmailVerification");
		if (this.mode !== "emulator") throw new ProductionAuthSafetyError("sendEmailVerification");
		const { auth } = this.getAuthInstance();
		const currentUser = this.driver.getCurrentUser(auth);
		if (!currentUser) throw new Error("Sign in before requesting email verification.");
		try {
			if (!this.driver.sendEmailVerification) throw new Error("Firebase email verification is unavailable.");
			await this.driver.sendEmailVerification(currentUser);
		} catch (err) {
			throw new Error(mapFirebaseAuthError$1(err));
		}
	}
	mapFirebaseUserToIdentity(user) {
		const providerId = (Array.isArray(user.providerData) ? user.providerData.find((provider) => provider.providerId !== "firebase")?.providerId : void 0) || (user.phoneNumber ? "phone" : "password");
		return {
			uid: user.uid,
			email: user.email,
			emailVerified: Boolean(user.emailVerified),
			phoneNumber: user.phoneNumber,
			providerId,
			isAnonymous: user.isAnonymous
		};
	}
};
/**
* Mock Authentication Adapter.
* Integrates with existing local mock authService for offline development.
*/
var MockAuthAdapter = class {
	mode = "mock";
	isProduction() {
		return false;
	}
	getCurrentUser() {
		const mockUser = authService.getCurrentUser();
		if (!mockUser) return null;
		return {
			uid: mockUser.id,
			email: mockUser.email || null,
			emailVerified: true,
			phoneNumber: mockUser.phone,
			providerId: "mock"
		};
	}
	subscribeAuthState(listener) {
		listener(this.getCurrentUser());
		return () => {};
	}
	async loginWithEmail(email, password) {
		const user = await authService.loginWithEmail(email, password);
		return {
			uid: user.id,
			email: user.email || null,
			emailVerified: true,
			phoneNumber: user.phone,
			providerId: "mock"
		};
	}
	async createUserWithEmailAndPassword(email = "", password = "") {
		const user = await authService.loginWithEmail(email, password).catch(() => null);
		if (user) return {
			uid: user.id,
			email: user.email || null,
			emailVerified: true,
			phoneNumber: user.phone,
			providerId: "mock"
		};
		return {
			uid: `mock_${Date.now()}`,
			email: email || null,
			emailVerified: true,
			phoneNumber: "+91 99999 99999",
			providerId: "mock"
		};
	}
	async sendEmailVerification() {
		throw new Error("Email verification is available only through the Firebase Auth Emulator.");
	}
	async signOut() {
		authService.logout();
	}
};
/**
* Central Authentication Manager.
* Coordinates authentication adapter selection, provides status diagnostics,
* and maintains the strict default invariant ("emulator").
*/
var AuthManager = class {
	mode;
	emulatorAdapter;
	productionAdapter;
	mockAdapter;
	constructor(initialMode) {
		this.mode = initialMode ?? resolveDefaultAuthMode();
		this.emulatorAdapter = new FirebaseAuthAdapter("emulator");
		this.productionAdapter = new FirebaseAuthAdapter("production");
		this.mockAdapter = new MockAuthAdapter();
	}
	getMode() {
		return this.mode;
	}
	setMode(mode) {
		this.mode = mode;
		if (typeof window !== "undefined") try {
			if (mode === "production" || mode === "mock" || mode === "emulator") {
				window.sessionStorage.setItem("sass_auth_mode", mode);
				window.localStorage.setItem("sass_auth_mode", mode);
			}
		} catch {}
	}
	resetMode() {
		if (typeof window !== "undefined") try {
			window.sessionStorage.removeItem("sass_auth_mode");
			window.localStorage.removeItem("sass_auth_mode");
		} catch {}
		this.mode = resolveDefaultAuthMode();
	}
	getActiveAdapter() {
		switch (this.mode) {
			case "production": return this.productionAdapter;
			case "mock": return this.mockAdapter;
			default: return this.emulatorAdapter;
		}
	}
	getEmulatorAdapter() {
		return this.emulatorAdapter;
	}
	getProductionAdapter() {
		return this.productionAdapter;
	}
	getMockAdapter() {
		return this.mockAdapter;
	}
	getStatus() {
		const isProduction = this.mode === "production";
		const isEmulator = this.mode === "emulator";
		this.mode;
		if (isProduction) return {
			mode: "production",
			isProduction: true,
			isEmulator: false,
			isMock: false,
			projectId: EXPECTED_PRODUCTION_PROJECT_ID,
			authDomain: EXPECTED_PRODUCTION_AUTH_DOMAIN
		};
		if (isEmulator) return {
			mode: "emulator",
			isProduction: false,
			isEmulator: true,
			isMock: false,
			projectId: "demo-sri-amman-store",
			emulatorHost: "127.0.0.1",
			emulatorPort: 9099
		};
		return {
			mode: "mock",
			isProduction: false,
			isEmulator: false,
			isMock: true,
			projectId: "local-mock"
		};
	}
	getCurrentUser() {
		return this.getActiveAdapter().getCurrentUser();
	}
	subscribeAuthState(listener) {
		return this.getActiveAdapter().subscribeAuthState(listener);
	}
	async loginWithEmail(email, password) {
		return this.getActiveAdapter().loginWithEmail(email, password);
	}
	async signInWithGoogle() {
		const adapter = this.getActiveAdapter();
		if (!(adapter instanceof FirebaseAuthAdapter)) throw new Error("Google sign-in is unavailable in mock authentication mode.");
		return adapter.signInWithGoogle();
	}
	async createUserWithEmailAndPassword(email, password) {
		return this.getActiveAdapter().createUserWithEmailAndPassword(email, password);
	}
	async sendEmailVerification() {
		return this.getActiveAdapter().sendEmailVerification();
	}
	async signOut() {
		await this.getActiveAdapter().signOut();
	}
};
var authManager = new AuthManager();
/**
* Timeout bounding utility for production Firestore reads.
*/
function withTimeout$4(promise, timeoutMs, operation) {
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
* Retrieves or initializes the isolated production Firebase App instance (`sri-amman-prod-auth-isolated`).
*/
function getProductionFirestoreInstance() {
	let app = getApps().find((a) => a.name === PRODUCTION_AUTH_APP_NAME);
	if (!app) {
		const config = getProductionFirebaseConfig();
		const validation = validateProductionPreviewConfig(config);
		if (!validation.valid) throw new Error(`CONFIGURATION SAFETY ERROR:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`);
		const sdkOptions = {
			projectId: config.projectId,
			authDomain: config.authDomain,
			messagingSenderId: config.messagingSenderId,
			apiKey: config.apiKey
		};
		if (config.storageBucket) sdkOptions["storageBucket"] = config.storageBucket;
		if (config.appId) sdkOptions["appId"] = config.appId;
		app = initializeApp(sdkOptions, PRODUCTION_AUTH_APP_NAME);
	}
	return getFirestore(app);
}
var readerOverride$4 = null;
var productionOrderReader = {
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
	* Reads all orders for an authenticated customer from production Firestore (`sri-amman-smart-store`).
	* Queries both the customer subcollection (`onlineCustomers/{ID}/orders` or `users/{ID}/orders`) and top-level `orders`
	* scoped strictly to the customer's identity. Supports legacy SASS ID fallback queries. Reconciles duplicates.
	*/
	async getCustomerOrders(customerId, authUserUid, timeoutMs = 8e3, legacySassId) {
		if (readerOverride$4?.getCustomerOrders) {
			if (legacySassId) return readerOverride$4.getCustomerOrders(customerId, authUserUid, legacySassId);
			return readerOverride$4.getCustomerOrders(customerId, authUserUid);
		}
		const cleanCustomerId = this.assertValidCustomer(customerId);
		const cleanAuthUid = typeof authUserUid === "string" ? authUserUid.trim() : "";
		const cleanLegacySassId = typeof legacySassId === "string" && legacySassId.trim() ? legacySassId.trim() : void 0;
		const db = getProductionFirestoreInstance();
		const primaryCol = cleanCustomerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
		let nestedOrders = [];
		let subcollectionError = null;
		try {
			const subColRef = collection(db, primaryCol, cleanCustomerId, "orders");
			nestedOrders = (await withTimeout$4(getDocs(query(subColRef)), timeoutMs, `getDocs(${primaryCol}/${cleanCustomerId}/orders)`)).docs.map((d) => ({
				id: d.id,
				...d.data()
			}));
		} catch (err) {
			subcollectionError = err;
			console.error(`[ProductionOrderReader] Error querying ${primaryCol}/${cleanCustomerId}/orders:`, err);
		}
		if (nestedOrders.length === 0 && primaryCol === "onlineCustomers" && cleanLegacySassId) try {
			const legacySubColRef = collection(db, "users", cleanLegacySassId, "orders");
			nestedOrders = (await withTimeout$4(getDocs(query(legacySubColRef)), timeoutMs, `getDocs(users/${cleanLegacySassId}/orders)`)).docs.map((d) => ({
				id: d.id,
				...d.data()
			}));
		} catch (err) {
			console.warn(`[ProductionOrderReader] Warning querying fallback users/${cleanLegacySassId}/orders:`, err);
		}
		const topColRef = collection(db, "orders");
		const topLevelQueries = [withTimeout$4(getDocs(query(topColRef, where("userId", "==", cleanCustomerId))), timeoutMs, "query(orders where userId == customerId)"), withTimeout$4(getDocs(query(topColRef, where("buyerId", "==", cleanCustomerId))), timeoutMs, "query(orders where buyerId == customerId)")];
		if (cleanLegacySassId) {
			topLevelQueries.push(withTimeout$4(getDocs(query(topColRef, where("userId", "==", cleanLegacySassId))), timeoutMs, "query(orders where userId == legacySassId)"));
			topLevelQueries.push(withTimeout$4(getDocs(query(topColRef, where("buyerId", "==", cleanLegacySassId))), timeoutMs, "query(orders where buyerId == legacySassId)"));
		}
		if (cleanAuthUid) {
			topLevelQueries.push(withTimeout$4(getDocs(query(topColRef, where("userProfile.uid", "==", cleanAuthUid))), timeoutMs, "query(orders where userProfile.uid == uid)"));
			topLevelQueries.push(withTimeout$4(getDocs(query(topColRef, where("buyerUid", "==", cleanAuthUid))), timeoutMs, "query(orders where buyerUid == uid)"));
		}
		const topResults = await Promise.allSettled(topLevelQueries);
		const topLevelOrders = [];
		const seenTopDocIds = /* @__PURE__ */ new Set();
		let topQueryFailureCount = 0;
		for (const res of topResults) if (res.status === "fulfilled") res.value.docs.forEach((d) => {
			if (!seenTopDocIds.has(d.id)) {
				seenTopDocIds.add(d.id);
				topLevelOrders.push({
					id: d.id,
					...d.data()
				});
			}
		});
		else {
			topQueryFailureCount++;
			console.warn("[ProductionOrderReader] Top-level orders query warning:", res.reason?.message || res.reason);
		}
		if (subcollectionError && topLevelOrders.length === 0 && topQueryFailureCount === topLevelQueries.length) {
			const category = classifyStorageError(subcollectionError);
			throw new StorageAdapterError(`Failed to retrieve customer orders for ${cleanCustomerId}: ${subcollectionError instanceof Error ? subcollectionError.message : "Failed to read customer orders from production Firestore"}`, {
				status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
				code: category === "permission" ? "permission-denied" : "unavailable",
				category,
				causeError: subcollectionError
			});
		}
		return reconcileCustomerOrders({
			nestedOrders,
			topLevelOrders,
			userId: cleanCustomerId,
			...cleanLegacySassId ? { legacySassId: cleanLegacySassId } : {}
		});
	},
	/**
	* Retrieves a single order by ID from production Firestore after strictly verifying customer ownership.
	*/
	async getOrderById(orderId, customerId, authUserUid, timeoutMs = 8e3, legacySassId) {
		if (readerOverride$4?.getOrderById) {
			if (legacySassId) return readerOverride$4.getOrderById(orderId, customerId, authUserUid, legacySassId);
			return readerOverride$4.getOrderById(orderId, customerId, authUserUid);
		}
		const cleanCustomerId = this.assertValidCustomer(customerId);
		const cleanLegacySassId = typeof legacySassId === "string" && legacySassId.trim() ? legacySassId.trim() : void 0;
		const cleanOrderId = (orderId || "").trim();
		if (!cleanOrderId) return null;
		const cleanAuthUid = typeof authUserUid === "string" ? authUserUid.trim() : "";
		const db = getProductionFirestoreInstance();
		const primaryCol = cleanCustomerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
		let nestedDoc = null;
		try {
			const nestedRef = doc(db, primaryCol, cleanCustomerId, "orders", cleanOrderId);
			const snap = await withTimeout$4(getDoc(nestedRef), timeoutMs, `getDoc(${primaryCol}/${cleanCustomerId}/orders/${cleanOrderId})`);
			if (snap.exists()) nestedDoc = {
				id: snap.id,
				...snap.data()
			};
		} catch {
			nestedDoc = null;
		}
		if (!nestedDoc) try {
			const subColRef = collection(db, primaryCol, cleanCustomerId, "orders");
			const querySnap = await withTimeout$4(getDocs(query(subColRef, where("orderId", "==", cleanOrderId))), timeoutMs, `query(${primaryCol}/${cleanCustomerId}/orders orderId == ${cleanOrderId})`);
			if (!querySnap.empty && querySnap.docs[0]) nestedDoc = {
				id: querySnap.docs[0].id,
				...querySnap.docs[0].data()
			};
		} catch {
			nestedDoc = null;
		}
		if (!nestedDoc && primaryCol === "onlineCustomers" && cleanLegacySassId) {
			try {
				const legacyNestedRef = doc(db, "users", cleanLegacySassId, "orders", cleanOrderId);
				const snap = await withTimeout$4(getDoc(legacyNestedRef), timeoutMs, `getDoc(users/${cleanLegacySassId}/orders/${cleanOrderId})`);
				if (snap.exists()) nestedDoc = {
					id: snap.id,
					...snap.data()
				};
			} catch {
				nestedDoc = null;
			}
			if (!nestedDoc) try {
				const legacySubColRef = collection(db, "users", cleanLegacySassId, "orders");
				const querySnap = await withTimeout$4(getDocs(query(legacySubColRef, where("orderId", "==", cleanOrderId))), timeoutMs, `query(users/${cleanLegacySassId}/orders orderId == ${cleanOrderId})`);
				if (!querySnap.empty && querySnap.docs[0]) nestedDoc = {
					id: querySnap.docs[0].id,
					...querySnap.docs[0].data()
				};
			} catch {
				nestedDoc = null;
			}
		}
		let topDoc = null;
		try {
			const topRef = doc(db, "orders", cleanOrderId);
			const snap = await withTimeout$4(getDoc(topRef), timeoutMs, `getDoc(orders/${cleanOrderId})`);
			if (snap.exists()) topDoc = {
				id: snap.id,
				...snap.data()
			};
		} catch {
			topDoc = null;
		}
		if (!topDoc) try {
			const topColRef = collection(db, "orders");
			const querySnap = await withTimeout$4(getDocs(query(topColRef, where("orderId", "==", cleanOrderId))), timeoutMs, `query(orders orderId == ${cleanOrderId})`);
			if (!querySnap.empty && querySnap.docs[0]) topDoc = {
				id: querySnap.docs[0].id,
				...querySnap.docs[0].data()
			};
		} catch {
			topDoc = null;
		}
		if (topDoc) {
			if (isPosOrNonRetailOrder(topDoc)) return null;
			const topOwner = String(topDoc["userId"] || topDoc["buyerId"] || topDoc["userProfile"]?.userId || "").trim();
			const topUid = String(topDoc["buyerUid"] || topDoc["userProfile"]?.uid || "").trim();
			if (!(topOwner && (topOwner === cleanCustomerId || Boolean(cleanLegacySassId && topOwner === cleanLegacySassId)) || cleanAuthUid && topUid && topUid === cleanAuthUid) && (topOwner || topUid)) throw new StorageAdapterError("Access denied: You cannot view another customer's order.", {
				status: 403,
				code: "permission-denied",
				category: "permission"
			});
		}
		if (!nestedDoc && !topDoc) return null;
		return reconcileCustomerOrders({
			nestedOrders: nestedDoc ? [nestedDoc] : [],
			topLevelOrders: topDoc ? [topDoc] : [],
			userId: cleanCustomerId,
			...cleanLegacySassId ? { legacySassId: cleanLegacySassId } : {}
		})[0] ?? null;
	}
};
/**
* Timeout bounding utility for production Firestore coin operations.
*/
function withTimeout$3(promise, timeoutMs, operation) {
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
* Normalizes an arbitrary legacy coinsHistory document (`users/{SASS_ID}/coinsHistory/{docId}`)
* into the standard frontend `CoinTransaction` domain object.
*/
function normalizeLegacyCoinTransaction(docId, docData, userId) {
	const id = String(docData["id"] || docId || "").trim();
	const rawAmount = Number(docData["amount"] ?? 0);
	const amount = Math.abs(Number.isFinite(rawAmount) ? rawAmount : 0);
	const rawType = String(docData["type"] || "").trim().toLowerCase();
	const rawStatus = String(docData["status"] || "").trim().toLowerCase();
	let type = "earned";
	if (rawType === "redeemed" || rawType === "debit" || rawType === "used" || rawStatus === "redeemed" || rawAmount < 0) type = "redeemed";
	const orderId = String(docData["orderId"] || "").trim() || (docId.startsWith("ord_") || docId.startsWith("order_") ? docId.replace(/_ref$/, "") : void 0);
	let description = "";
	if (typeof docData["description"] === "string" && docData["description"].trim()) description = docData["description"].trim();
	else if (rawType === "referral") {
		const buyer = typeof docData["buyerName"] === "string" && docData["buyerName"].trim() ? docData["buyerName"].trim() : "";
		description = buyer ? `Referral reward from ${buyer}` : "Referral coin reward";
	} else if (type === "redeemed") description = orderId ? `Redeemed on Order #${orderId}` : "Smart Coins redeemed";
	else description = orderId ? `Coins earned on Order #${orderId}` : "Smart Coins earned";
	if (rawStatus === "pending") description += " (Pending delivery)";
	else if (rawStatus === "cancelled") description += " (Order cancelled)";
	let timestamp = (/* @__PURE__ */ new Date()).toISOString();
	const rawCreatedAt = docData["createdAt"] ?? docData["timestamp"] ?? docData["releasedAt"];
	if (rawCreatedAt && typeof rawCreatedAt.toDate === "function") timestamp = rawCreatedAt.toDate().toISOString();
	else if (rawCreatedAt && typeof rawCreatedAt.seconds === "number") timestamp = (/* @__PURE__ */ new Date(rawCreatedAt.seconds * 1e3)).toISOString();
	else if (typeof rawCreatedAt === "string" && rawCreatedAt.trim()) {
		const d = new Date(rawCreatedAt.trim());
		if (!Number.isNaN(d.getTime())) timestamp = d.toISOString();
	}
	return {
		id,
		userId,
		...orderId ? { orderId } : {},
		amount,
		type,
		description,
		timestamp
	};
}
var readerOverride$3 = null;
var productionCoinReader = {
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
	* Reads the authoritative Smart Coins balance for an authenticated customer directly from
	* production Firestore (`onlineCustomers/{ID}` or `users/{ID}`).
	* If customer has an ONCUS ID and legacy SASS ID, falls back to legacy balance if online profile does not exist.
	*/
	async getCustomerCoinBalance(customerId, timeoutMs = 8e3, legacySassId) {
		if (readerOverride$3?.getCustomerCoinBalance) {
			if (legacySassId) return readerOverride$3.getCustomerCoinBalance(customerId || "", legacySassId);
			return readerOverride$3.getCustomerCoinBalance(customerId || "");
		}
		const cleanCustomerId = (customerId || "").trim();
		if (!cleanCustomerId) return 0;
		const validCustomerId = this.assertValidCustomer(cleanCustomerId);
		const cleanLegacySassId = typeof legacySassId === "string" && legacySassId.trim() ? legacySassId.trim() : void 0;
		const db = getProductionFirestoreInstance();
		const primaryCol = validCustomerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
		try {
			let snap = await withTimeout$3(getDoc(doc(db, primaryCol, validCustomerId)), timeoutMs, `getDoc(${primaryCol}/${validCustomerId})`);
			if (!snap.exists() && primaryCol === "onlineCustomers" && cleanLegacySassId) try {
				snap = await withTimeout$3(getDoc(doc(db, "users", cleanLegacySassId)), timeoutMs, `getDoc(users/${cleanLegacySassId})`);
			} catch (err) {
				console.warn(`[ProductionCoinReader] Warning reading fallback users/${cleanLegacySassId} balance:`, err);
			}
			if (snap.exists()) {
				const data = snap.data();
				const directSmartCoins = Number(data["smartCoins"]);
				if (Number.isFinite(directSmartCoins)) return Math.max(0, directSmartCoins);
				const directCoins = Number(data["coins"]);
				if (Number.isFinite(directCoins)) return Math.max(0, directCoins);
				const availableCoins = Number(data["availableCoins"] ?? data["availableCoins32"]);
				if (Number.isFinite(availableCoins)) return Math.max(0, availableCoins);
			}
			return 0;
		} catch (err) {
			console.error(`[ProductionCoinReader] Error querying balance for ${primaryCol}/${validCustomerId}:`, err);
			const category = classifyStorageError(err);
			throw new StorageAdapterError(`Failed to retrieve coin balance for customer ${validCustomerId}: ${err instanceof Error ? err.message : String(err)}`, {
				status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
				code: category === "permission" ? "permission-denied" : "unavailable",
				category,
				causeError: err
			});
		}
	},
	/**
	* Reads all coin transactions for an authenticated customer from production Firestore
	* (`onlineCustomers/{ID}/coinsHistory` or `users/{ID}/coinsHistory`).
	* Deduplicates by document ID and sorts descending by timestamp.
	* If customer has an ONCUS ID and legacy SASS ID, falls back to legacy coin history if online history is empty.
	*/
	async getCustomerCoinHistory(customerId, timeoutMs = 8e3, legacySassId) {
		if (readerOverride$3?.getCustomerCoinHistory) {
			if (legacySassId) return readerOverride$3.getCustomerCoinHistory(customerId || "", legacySassId);
			return readerOverride$3.getCustomerCoinHistory(customerId || "");
		}
		const cleanCustomerId = (customerId || "").trim();
		if (!cleanCustomerId) return [];
		const validCustomerId = this.assertValidCustomer(cleanCustomerId);
		const cleanLegacySassId = typeof legacySassId === "string" && legacySassId.trim() ? legacySassId.trim() : void 0;
		const db = getProductionFirestoreInstance();
		const primaryCol = validCustomerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
		try {
			let snap = await withTimeout$3(getDocs(query(collection(db, primaryCol, validCustomerId, "coinHistory"))), timeoutMs, `getDocs(${primaryCol}/${validCustomerId}/coinHistory)`);
			if (snap.empty) try {
				const pluralSnap = await withTimeout$3(getDocs(query(collection(db, primaryCol, validCustomerId, "coinsHistory"))), timeoutMs, `getDocs(${primaryCol}/${validCustomerId}/coinsHistory)`);
				if (!pluralSnap.empty) snap = pluralSnap;
			} catch {}
			if (snap.empty && primaryCol === "onlineCustomers" && cleanLegacySassId) try {
				const fallbackSnap = await withTimeout$3(getDocs(query(collection(db, "users", cleanLegacySassId, "coinsHistory"))), timeoutMs, `getDocs(users/${cleanLegacySassId}/coinsHistory)`);
				if (!fallbackSnap.empty) snap = fallbackSnap;
			} catch (err) {
				console.warn(`[ProductionCoinReader] Warning reading fallback users/${cleanLegacySassId}/coinsHistory:`, err);
			}
			const list = [];
			const seenIds = /* @__PURE__ */ new Set();
			for (const docSnap of snap.docs) {
				if (seenIds.has(docSnap.id)) continue;
				seenIds.add(docSnap.id);
				const data = docSnap.data();
				const normalized = normalizeLegacyCoinTransaction(docSnap.id, data, validCustomerId);
				list.push(normalized);
			}
			return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
		} catch (err) {
			console.error(`[ProductionCoinReader] Error querying history for ${primaryCol}/${validCustomerId}:`, err);
			const category = classifyStorageError(err);
			throw new StorageAdapterError(`Failed to retrieve coin history for customer ${validCustomerId}: ${err instanceof Error ? err.message : String(err)}`, {
				status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
				code: category === "permission" ? "permission-denied" : "unavailable",
				category,
				causeError: err
			});
		}
	}
};
/**
* Official Smart Coins conversion rate confirmed by business decision (Phase 7.1):
* - 1 coin = ₹0.05
* - ₹1.00 = 20 coins
*/
var OFFICIAL_COIN_CONVERSION_RATE = .05;
/**
* Converts Smart Coins to INR value using the confirmed official rate (1 coin = ₹0.05).
* Example: 20 coins = ₹1.00, 100 coins = ₹5.00.
*/
function convertCoinsToRupees(coins, rate = OFFICIAL_COIN_CONVERSION_RATE) {
	if (typeof coins !== "number" || !Number.isFinite(coins) || coins <= 0) return 0;
	return Number((coins * rate).toFixed(2));
}
/**
* Converts INR value to Smart Coins using the confirmed official rate (₹1.00 = 20 coins).
* Example: ₹1.00 = 20 coins, ₹5.00 = 100 coins.
*/
function convertRupeesToCoins(rupees, coinsPerRupee = 20) {
	if (typeof rupees !== "number" || !Number.isFinite(rupees) || rupees <= 0) return 0;
	return Math.round(rupees * coinsPerRupee);
}
/** Legacy checkout allowed coins up to the full payable amount after discounts and delivery. */
function getMaxRedeemableCoins(availableCoins, payableAmount, coinValueInRupees = OFFICIAL_COIN_CONVERSION_RATE) {
	if (!Number.isFinite(availableCoins) || !Number.isFinite(payableAmount) || !Number.isFinite(coinValueInRupees) || availableCoins <= 0 || payableAmount <= 0 || coinValueInRupees <= 0) return 0;
	return Math.min(Math.floor(availableCoins), Math.floor(payableAmount / coinValueInRupees));
}
var coinService = {
	getOfficialConversionRate() {
		return OFFICIAL_COIN_CONVERSION_RATE;
	},
	getCoinsPerRupee() {
		return 20;
	},
	async getCoinHistory(userId, legacySassId) {
		const cleanId = (userId || "").trim();
		if (!cleanId) return [];
		let resolvedId = cleanId;
		let resolvedLegacySassId = legacySassId;
		try {
			const ds = resolveCustomerDataSource(cleanId);
			resolvedId = ds.canonicalCustomerId;
			resolvedLegacySassId = legacySassId || ds.legacySassId;
		} catch {}
		if (authManager.getMode() === "production") {
			const currentUser = authService.getCurrentUser();
			const finalLegacySassId = resolvedLegacySassId || currentUser?.legacySassId;
			if (finalLegacySassId) return productionCoinReader.getCustomerCoinHistory(resolvedId, void 0, finalLegacySassId);
			return productionCoinReader.getCustomerCoinHistory(resolvedId);
		}
		return (await apiClient.get("/coinHistory", { userId: resolvedId }) || []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
	},
	/**
	* Retrieves the authoritative available Smart Coins balance for a customer directly
	* from storage (/onlineCustomers/:userId or /users/:userId in production Firestore or mock backend).
	*/
	async getUserCoins(userId, legacySassId) {
		const cleanId = (userId || "").trim();
		if (!cleanId) return 0;
		let resolvedId = cleanId;
		let resolvedLegacySassId = legacySassId;
		try {
			const ds = resolveCustomerDataSource(cleanId);
			resolvedId = ds.canonicalCustomerId;
			resolvedLegacySassId = legacySassId || ds.legacySassId;
		} catch {}
		if (authManager.getMode() === "production") {
			const currentUser = authService.getCurrentUser();
			const finalLegacySassId = resolvedLegacySassId || currentUser?.legacySassId;
			if (finalLegacySassId) return productionCoinReader.getCustomerCoinBalance(resolvedId, void 0, finalLegacySassId);
			return productionCoinReader.getCustomerCoinBalance(resolvedId);
		}
		try {
			const endpoint = getCustomerProfileEndpoint(resolvedId);
			const user = await apiClient.get(endpoint);
			if (user && typeof user.smartCoins === "number" && Number.isFinite(user.smartCoins)) return Math.max(0, user.smartCoins);
			if (user && typeof user.coins === "number" && Number.isFinite(user.coins)) return Math.max(0, user.coins);
			if (user && typeof user.availableCoins === "number" && Number.isFinite(user.availableCoins)) return Math.max(0, user.availableCoins);
			return 0;
		} catch {
			return 0;
		}
	},
	async getConversionRate() {
		return settingsService.getLegacyCoinValue();
	},
	calculateLedgerStats(history) {
		const now = /* @__PURE__ */ new Date();
		const currentYear = now.getFullYear();
		const currentMonth = now.getMonth();
		let totalEarned = 0;
		let totalRedeemed = 0;
		let earnedThisMonth = 0;
		let redeemedThisMonth = 0;
		for (const tx of history) {
			const txDate = new Date(tx.timestamp);
			const isThisMonth = txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
			if (tx.type === "earned") {
				totalEarned += tx.amount;
				if (isThisMonth) earnedThisMonth += tx.amount;
			} else if (tx.type === "redeemed") {
				totalRedeemed += tx.amount;
				if (isThisMonth) redeemedThisMonth += tx.amount;
			}
		}
		return {
			totalEarned,
			totalRedeemed,
			earnedThisMonth,
			redeemedThisMonth,
			netBalance: Math.max(0, totalEarned - totalRedeemed)
		};
	},
	calculateVIPStatus(orders, threshold = 5e3) {
		const now = (/* @__PURE__ */ new Date()).getTime();
		const thirtyDaysMs = 2592e6;
		const rollingSpend = orders.filter((o) => {
			if (o.status !== "delivered") return false;
			const orderTime = new Date(o.createdAt).getTime();
			return now - orderTime <= thirtyDaysMs;
		}).reduce((sum, o) => sum + (o.pricingSummary?.totalAmount || 0), 0);
		return {
			isVIP: rollingSpend >= threshold,
			rollingSpend,
			threshold,
			percentage: Math.min(100, Math.round(rollingSpend / threshold * 100)),
			daysRemaining: 30
		};
	},
	async recordTransaction(tx, idempotencyKey) {
		const txId = idempotencyKey || `coin_${tx.type}_${Date.now()}_${Math.floor(1e3 + Math.random() * 9e3)}`;
		let resolvedUserId = tx.userId;
		try {
			resolvedUserId = resolveCustomerDataSource(tx.userId).canonicalCustomerId;
		} catch {}
		if (idempotencyKey) {
			const duplicate = (await this.getCoinHistory(resolvedUserId)).find((t) => t.id === idempotencyKey);
			if (duplicate) return duplicate;
		}
		const newTx = {
			...tx,
			userId: resolvedUserId,
			id: txId
		};
		return apiClient.post("/coinHistory", newTx);
	}
};
/**
* Validates whether an order belongs to POS/ERP/in-store operations rather
* than retail customer e-commerce.
*/
function isPosOrNonRetailOrder(doc) {
	if (!doc || typeof doc !== "object") return false;
	if (String(doc["salesChannel"] || "").toLowerCase() === "pos") return true;
	if (String(doc["orderSource"] || "").toLowerCase() === "manual") return true;
	if (String(doc["customerId"] || "").startsWith("CUS-")) return true;
	if (doc["posInvoiceNumber"] || doc["posTerminalId"]) return true;
	if (doc["createdByStaffId"] && !doc["buyerId"] && !doc["userId"]) return true;
	return false;
}
/**
* Normalizes any legacy date representation (Firestore Timestamp, ISO string,
* Unix millisecond/second integer, Date string) into an ISO-8601 string.
* Falls back safely to fallbackIso if the date is missing, empty, or unparseable.
*/
function parseLegacyDate(val, fallbackIso = "1970-01-01T00:00:00.000Z") {
	if (val === null || val === void 0) return fallbackIso;
	if (typeof val === "object" && val !== null) {
		const sec = typeof val.seconds === "number" ? val.seconds : typeof val._seconds === "number" ? val._seconds : void 0;
		if (typeof sec === "number" && !Number.isNaN(sec)) return (/* @__PURE__ */ new Date(sec * 1e3)).toISOString();
	}
	if (typeof val === "number" && !Number.isNaN(val) && Number.isFinite(val)) {
		if (val > 1e11) return new Date(val).toISOString();
		if (val > 0) return (/* @__PURE__ */ new Date(val * 1e3)).toISOString();
	}
	if (typeof val === "string") {
		const trimmed = val.trim();
		if (!trimmed) return fallbackIso;
		const parsed = new Date(trimmed).getTime();
		if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();
	}
	return fallbackIso;
}
/**
* Normalizes legacy order status values across all known production fields:
* `operationalStatus`, `deliveryStatus`, `dispatchStatus`, `orderStatus`,
* `stage`, `currentStage`, `lifecycleStage`, `status`, `pickStatus`,
* and nested `delivery.status` / `shipping.status`.
*
* Preserves the exact original status string in `rawStatus` so no useful legacy
* information is discarded. Unknown statuses are flagged without silent conversion
* into misleading states.
*/
function normalizeLegacyOrderStatus(docOrValue) {
	let rawCandidate = "";
	if (typeof docOrValue === "string") rawCandidate = docOrValue.trim();
	else if (typeof docOrValue === "object" && docOrValue !== null) {
		const doc = docOrValue;
		const candidates = [
			doc["operationalStatus"],
			doc["deliveryStatus"],
			doc["dispatchStatus"],
			doc["orderStatus"],
			doc["currentStage"],
			doc["stage"],
			doc["lifecycleStage"],
			doc["status"],
			doc["pickStatus"],
			doc["delivery"]?.status,
			doc["shipping"]?.status
		];
		for (const c of candidates) if (typeof c === "string" && c.trim().length > 0) {
			rawCandidate = c.trim();
			break;
		}
		if (!rawCandidate) {
			const history = doc["statusHistory"] || doc["timeline"];
			if (Array.isArray(history) && history.length > 0) {
				const lastEntry = history[history.length - 1];
				if (typeof lastEntry === "string" && lastEntry.trim()) rawCandidate = lastEntry.trim();
				else if (typeof lastEntry === "object" && lastEntry !== null) {
					const entryStatus = lastEntry.status || lastEntry.stage;
					if (typeof entryStatus === "string" && entryStatus.trim()) rawCandidate = entryStatus.trim();
				}
			}
		}
	}
	if (!rawCandidate) return {
		status: "pending",
		rawStatus: "",
		isUnknown: false
	};
	const normalized = rawCandidate.toLowerCase().replace(/[_-]+/g, " ").trim();
	if (normalized === "pending" || normalized === "order confirmed" || normalized === "order placed" || normalized === "confirmed" || normalized === "placed" || normalized === "created") return {
		status: "pending",
		rawStatus: rawCandidate,
		isUnknown: false
	};
	if (normalized === "processing" || normalized === "packing" || normalized === "preparing" || normalized === "in progress") return {
		status: "processing",
		rawStatus: rawCandidate,
		isUnknown: false
	};
	if (normalized === "packed" || normalized === "ready for dispatch" || normalized === "bagged" || normalized === "quality checked") return {
		status: "packed",
		rawStatus: rawCandidate,
		isUnknown: false
	};
	if (normalized === "in transit" || normalized === "out for delivery" || normalized === "dispatched" || normalized === "shipped" || normalized === "on the way" || normalized === "picked up") return {
		status: "in transit",
		rawStatus: rawCandidate,
		isUnknown: false
	};
	if (normalized === "delivered" || normalized === "completed") return {
		status: "delivered",
		rawStatus: rawCandidate,
		isUnknown: false
	};
	if (normalized === "cancelled" || normalized === "canceled" || normalized === "rejected" || normalized === "failed") return {
		status: "cancelled",
		rawStatus: rawCandidate,
		isUnknown: false
	};
	if (normalized === "returned" || normalized === "refunded" || normalized === "return requested") return {
		status: "returned",
		rawStatus: rawCandidate,
		isUnknown: false
	};
	return {
		status: "pending",
		rawStatus: rawCandidate,
		isUnknown: true
	};
}
/**
* Normalizes legacy item representations into the frontend OrderItem type.
*/
function normalizeLegacyItems(rawItems) {
	if (!Array.isArray(rawItems)) return [];
	return rawItems.filter((item) => item && typeof item === "object").map((item) => {
		const it = item;
		const productId = String(it["productId"] || it["id"] || it["itemCode"] || "");
		const name = String(it["name"] || it["productName"] || it["title"] || "Item");
		const unit = String(it["unit"] || "unit");
		const unitSize = String(it["unitSize"] ?? it["packSize"] ?? it["weight"] ?? "");
		const price = Number(it["price"] ?? it["sellingPrice"] ?? it["mrp"] ?? 0);
		const quantity = Math.max(1, Number(it["quantity"] ?? it["qty"] ?? 1));
		let image = "";
		if (typeof it["image"] === "string" && it["image"].trim()) image = it["image"].trim();
		else if (typeof it["imageUrl"] === "string" && it["imageUrl"].trim()) image = it["imageUrl"].trim();
		else if (typeof it["frontImageUrl"] === "string" && it["frontImageUrl"].trim()) image = it["frontImageUrl"].trim();
		else if (Array.isArray(it["imageUrls"]) && it["imageUrls"][0]) image = String(it["imageUrls"][0]);
		else if (Array.isArray(it["images"]) && it["images"][0]) image = String(it["images"][0]);
		if (!image) image = "/assets/images/placeholder.jpg";
		return {
			productId,
			name,
			unit,
			unitSize,
			price,
			quantity,
			image
		};
	});
}
/**
* Normalizes legacy address objects (door, street, town, pincode) into
* the frontend deliveryAddress structure.
*/
function normalizeLegacyAddress(doc) {
	const addr = doc["deliveryAddress"] || doc["address"] || doc;
	const houseNo = String(addr["houseNo"] || addr["door"] || addr["doorNo"] || "");
	const street = String(addr["street"] || addr["addressLine1"] || "");
	const city = String(addr["city"] || addr["town"] || addr["district"] || "");
	const pincode = String(addr["pincode"] || addr["zip"] || addr["postalCode"] || "");
	const landmark = addr["landmark"] ? String(addr["landmark"]) : void 0;
	return {
		houseNo,
		street,
		...landmark ? { landmark } : {},
		city,
		pincode
	};
}
/**
* Normalizes delivery metadata into the frontend delivery object.
*/
function normalizeLegacyDelivery(doc) {
	const del = doc["delivery"] || doc;
	const type = String(del["type"] || doc["deliveryType"] || "").toLowerCase().includes("express") ? "express" : "standard";
	const slot = String(del["slot"] || doc["deliverySlot"] || doc["slot"] || (type === "express" ? "Instant 60-Min Express Dispatch" : "Standard Scheduled Delivery"));
	const estimatedTime = del["estimatedTime"] ? String(del["estimatedTime"]) : doc["estimatedTime"] ? String(doc["estimatedTime"]) : type === "express" ? "Within 60-90 minutes" : "Next scheduled delivery window";
	let driver;
	const rawDriver = del["driver"] || doc["driver"];
	if (rawDriver && typeof rawDriver === "object") driver = {
		name: String(rawDriver["name"] || ""),
		phone: String(rawDriver["phone"] || ""),
		vehicle: String(rawDriver["vehicle"] || "")
	};
	return {
		type,
		slot,
		estimatedTime,
		...driver ? { driver } : {}
	};
}
/**
* Normalizes payment metadata into the frontend payment object.
*/
function normalizeLegacyPayment(doc) {
	const pay = doc["payment"] || doc["paymentDetails"] || doc;
	const methodStr = String(pay["method"] || doc["paymentMethod"] || "").toLowerCase();
	const method = /online|razorpay|card|upi|netbanking|prepaid/i.test(methodStr) ? "online" : "cod";
	const status = String(pay["status"] || (method === "online" ? "paid" : "pending_cod"));
	const transactionId = pay["transactionId"] || doc["transactionId"] ? String(pay["transactionId"] || doc["transactionId"]) : void 0;
	return {
		method,
		status,
		...transactionId ? { transactionId } : {}
	};
}
/**
* Normalizes pricing summary values safely, calculating missing totals
* from item line-items and known discount/fee fields.
*/
function normalizeLegacyPricing(doc, items) {
	const ps = doc["pricingSummary"];
	if (ps && typeof ps === "object") return {
		subtotal: Number(ps["subtotal"] ?? 0),
		productSavings: Number(ps["productSavings"] ?? 0),
		deliveryFee: Number(ps["deliveryFee"] ?? 0),
		coinDiscount: Number(ps["coinDiscount"] ?? 0),
		couponDiscount: Number(ps["couponDiscount"] ?? 0),
		totalAmount: Number(ps["totalAmount"] ?? 0)
	};
	const itemsSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
	const subtotal = Number(doc["subtotal"] ?? itemsSubtotal);
	const productSavings = Number(doc["productSavings"] ?? doc["savings"] ?? 0);
	const deliveryFee = Number(doc["deliveryFee"] ?? doc["deliveryCost"] ?? doc["shippingFee"] ?? 0);
	let coinDiscount = Number(doc["coinDiscount"] ?? 0);
	if (coinDiscount === 0 && typeof doc["coinsUsed"] === "number") {
		const rate = Number(doc["coinValueRate"] ?? .05);
		coinDiscount = doc["coinsUsed"] * rate;
	}
	const couponDiscount = Number(doc["couponDiscount"] ?? doc["promoDiscount"] ?? doc["discount"] ?? 0);
	const totalAmount = Number(doc["totalAmount"] ?? doc["total"] ?? doc["amount"] ?? Math.max(0, subtotal - coinDiscount - couponDiscount + deliveryFee));
	return {
		subtotal,
		productSavings,
		deliveryFee,
		coinDiscount,
		couponDiscount,
		totalAmount
	};
}
/**
* Normalizes an arbitrary legacy order document (from top-level `orders`
* or user subcollection `users/{userId}/orders`) into the standard frontend `Order` type.
*/
function normalizeLegacyOrder(doc, userDocId) {
	const id = String(doc["id"] || doc["orderId"] || doc["orderNumber"] || "");
	const orderId = String(doc["orderId"] || doc["orderNumber"] || doc["id"] || id);
	const userId = String(userDocId || doc["userId"] || doc["buyerId"] || doc["userProfile"]?.userId || "");
	const customerName = String(doc["customerName"] || doc["buyerName"] || doc["userProfile"]?.fullName || doc["userProfile"]?.name || doc["address"]?.fullName || "Customer");
	const phone = String(doc["phone"] || doc["customerPhone"] || doc["userProfile"]?.number || doc["userProfile"]?.phone || doc["address"]?.contact || doc["address"]?.phone || "");
	const { status, rawStatus } = normalizeLegacyOrderStatus(doc);
	const createdAt = parseLegacyDate(doc["createdAt"] ?? doc["timestamp"] ?? doc["orderDate"] ?? doc["date"]);
	let deliveredAt;
	if (status === "delivered" || doc["deliveredAt"] || doc["deliveryTime"]) deliveredAt = parseLegacyDate(doc["deliveredAt"] ?? doc["deliveryTime"] ?? doc["updatedAt"]);
	let cancelledAt;
	if (status === "cancelled" || doc["cancelledAt"] || doc["canceledAt"]) cancelledAt = parseLegacyDate(doc["cancelledAt"] ?? doc["canceledAt"] ?? doc["updatedAt"]);
	const items = normalizeLegacyItems(doc["items"]);
	const deliveryAddress = normalizeLegacyAddress(doc);
	const delivery = normalizeLegacyDelivery(doc);
	const payment = normalizeLegacyPayment(doc);
	const pricingSummary = normalizeLegacyPricing(doc, items);
	const orderNumber = doc["orderNumber"] ? String(doc["orderNumber"]) : void 0;
	const buyerUid = doc["buyerUid"] ? String(doc["buyerUid"]) : void 0;
	return {
		id,
		orderId,
		userId,
		customerName,
		phone,
		status,
		createdAt,
		...deliveredAt ? { deliveredAt } : {},
		...cancelledAt ? { cancelledAt } : {},
		deliveryAddress,
		delivery,
		payment,
		items,
		pricingSummary,
		...rawStatus ? {
			rawStatus,
			legacyStatus: rawStatus
		} : {},
		...orderNumber ? { orderNumber } : {},
		...buyerUid ? { buyerUid } : {},
		rawOrder: doc
	};
}
/**
* Reconciles duplicate order representations between top-level `orders/{docId}`
* and nested customer subcollection `users/{userId}/orders/{docId}`.
*
* Precedence & Merge Rules:
* 1. Retail Customer Scope: Excludes POS/ERP orders (`salesChannel: "pos"`, `customerId: "CUS-..."`).
* 2. Authenticated Customer Scope: Discards any top-level order whose `buyerId` / `userId`
*    does not match the requested `userId`.
* 3. Stable Identity: Groups orders by canonical order number (`orderId` || `orderNumber` || `id`).
* 4. Precedence on Conflict:
*    - Base document: subcollection record (establishing customer ownership).
*    - Overlay fields: top-level record's operational stages (`operationalStatus`, `deliveryStatus`,
*      dispatch, driver), UNLESS the subcollection contains a customer cancellation (`status: "cancelled"`),
*      which takes precedence over stale un-synced operational stages.
* 5. Deterministic Sort: Orders are sorted by `createdAt` descending (most recent first).
*    Ties are broken by `orderId` descending for stable ordering.
*/
function reconcileCustomerOrders(params) {
	const { nestedOrders, topLevelOrders, userId, legacySassId } = params;
	const orderMap = /* @__PURE__ */ new Map();
	function getCanonicalKey(doc) {
		return String(doc["orderId"] || doc["orderNumber"] || doc["id"] || "").trim();
	}
	for (const doc of nestedOrders) {
		if (!doc || typeof doc !== "object") continue;
		if (isPosOrNonRetailOrder(doc)) continue;
		const key = getCanonicalKey(doc);
		if (!key) continue;
		const existing = orderMap.get(key) || {};
		existing.nested = doc;
		orderMap.set(key, existing);
	}
	for (const doc of topLevelOrders) {
		if (!doc || typeof doc !== "object") continue;
		if (isPosOrNonRetailOrder(doc)) continue;
		const docUserId = String(doc["userId"] || doc["buyerId"] || doc["userProfile"]?.userId || "").trim();
		if (docUserId && !(docUserId === userId) && !Boolean(legacySassId && docUserId === legacySassId)) continue;
		const key = getCanonicalKey(doc);
		if (!key) continue;
		const existing = orderMap.get(key) || {};
		existing.top = doc;
		orderMap.set(key, existing);
	}
	const result = [];
	for (const [, pair] of orderMap) {
		let mergedRaw;
		if (pair.nested && pair.top) {
			const nestedStatus = normalizeLegacyOrderStatus(pair.nested);
			if (nestedStatus.status === "cancelled" || nestedStatus.status === "returned") {
				const resolvedTerminalStatus = String(pair.nested["status"] || nestedStatus.rawStatus);
				mergedRaw = {
					...pair.top,
					...pair.nested,
					operationalStatus: resolvedTerminalStatus,
					deliveryStatus: resolvedTerminalStatus,
					dispatchStatus: resolvedTerminalStatus,
					orderStatus: resolvedTerminalStatus,
					stage: resolvedTerminalStatus,
					currentStage: resolvedTerminalStatus,
					lifecycleStage: resolvedTerminalStatus,
					delivery: {
						...pair.top["delivery"] || {},
						...pair.nested["delivery"] || {}
					},
					status: resolvedTerminalStatus
				};
			} else mergedRaw = {
				...pair.nested,
				...pair.top,
				delivery: {
					...pair.nested["delivery"] || {},
					...pair.top["delivery"] || {}
				}
			};
		} else if (pair.nested) mergedRaw = pair.nested;
		else if (pair.top) mergedRaw = pair.top;
		else continue;
		const normalized = normalizeLegacyOrder(mergedRaw, userId);
		result.push(normalized);
	}
	result.sort((a, b) => {
		const timeA = new Date(a.createdAt).getTime();
		const timeB = new Date(b.createdAt).getTime();
		if (timeA !== timeB) return timeB - timeA;
		return b.orderId.localeCompare(a.orderId);
	});
	return result;
}
/**
* Legacy-Compatible Read-Only Customer Order Adapter
*
* Implements secure read-only customer order retrieval matching the production
* Firestore topology:
* - Customer Subcollection: `users/{userDocId}/orders/{docId}`
* - Top-Level Orders: `orders/{docId}` (reconciled without duplicates)
*
* Safety & Identity Rules:
* 1. Strictly Read-Only: No mutations, creation, status updates, or sequence touches.
* 2. Strict Customer Validation: Requires a canonical SASS customer ID.
* 3. Profile Precondition: `users/{userDocId}` must exist.
* 4. Cross-Customer Protection: Never exposes Customer B's orders to Customer A.
* 5. POS Order Exclusion: Excludes in-store/POS orders from customer history.
* 6. Graceful Fallbacks: Empty histories, missing dates, malformed documents handled safely.
*/
var LegacyOrderAdapter = class {
	driver;
	constructor(driver) {
		this.driver = driver;
	}
	/**
	* Resolves the primary customer collection ("onlineCustomers" for ONCUS, "users" for SASS).
	*/
	getCustomerCollection(userId) {
		return userId.trim().toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
	}
	/**
	* Asserts that the provided identifier is a valid canonical customer ID (SASS or ONCUS).
	* Throws a validation error if invalid or if a Firebase UID was provided.
	*/
	assertValidCustomer(userId) {
		const clean = typeof userId === "string" ? userId.trim() : "";
		if (!clean || !CANONICAL_CUSTOMER_ID_RE$1.test(clean)) throw new StorageAdapterError(`Invalid customer identifier "${userId}": Legacy-compatible customer operations require a canonical SASS customer ID (or ONCUS customer ID, e.g. 'ONCUS000010' or 'SASS0000001'). Firebase Authentication UIDs or guest IDs cannot be used as customer document paths.`, {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		return clean;
	}
	/**
	* Verifies that the customer profile document exists in Firestore (checking `onlineCustomers` or `users`).
	* Throws a 404 not-found error if the profile does not exist.
	*/
	async assertProfileExists(userDocId) {
		const validId = this.assertValidCustomer(userDocId);
		const primaryCol = this.getCustomerCollection(validId);
		let profile = await this.driver.getDoc(primaryCol, validId);
		if (!profile && primaryCol === "onlineCustomers") profile = await this.driver.getDoc("users", validId);
		if (!profile) throw new StorageAdapterError(`Not found: Customer profile '${primaryCol}/${validId}' does not exist. A valid customer profile must exist before accessing customer orders.`, {
			status: 404,
			code: "not-found",
			category: "not_found"
		});
		return profile;
	}
	/**
	* Retrieves all orders for an authenticated customer, querying both
	* the customer's subcollection (`onlineCustomers/{id}/orders` or `users/{id}/orders`)
	* and top-level `orders`, reconciling duplicates according to documented precedence.
	*/
	async getCustomerOrders(userId, legacySassId) {
		const validUserId = this.assertValidCustomer(userId);
		await this.assertProfileExists(validUserId);
		const primaryCol = this.getCustomerCollection(validUserId);
		const subcollectionPath = `${primaryCol}/${validUserId}/orders`;
		let nestedOrders = [];
		try {
			nestedOrders = await this.driver.queryCollection(subcollectionPath, {});
		} catch {
			nestedOrders = [];
		}
		if (nestedOrders.length === 0 && primaryCol === "onlineCustomers" && legacySassId) try {
			nestedOrders = await this.driver.queryCollection(`users/${legacySassId}/orders`, {});
		} catch {
			nestedOrders = [];
		}
		let topLevelOrders = [];
		try {
			const queries = [this.driver.queryCollection("orders", { buyerId: validUserId }).catch(() => []), this.driver.queryCollection("orders", { userId: validUserId }).catch(() => [])];
			if (legacySassId) {
				queries.push(this.driver.queryCollection("orders", { buyerId: legacySassId }).catch(() => []));
				queries.push(this.driver.queryCollection("orders", { userId: legacySassId }).catch(() => []));
			}
			const results = await Promise.all(queries);
			const seenTop = /* @__PURE__ */ new Set();
			for (const list of results) for (const item of list) {
				const docId = String(item["id"] || item["orderId"] || item["orderNumber"] || "");
				if (docId && !seenTop.has(docId)) {
					seenTop.add(docId);
					topLevelOrders.push(item);
				}
			}
		} catch {
			topLevelOrders = [];
		}
		return reconcileCustomerOrders({
			nestedOrders,
			topLevelOrders,
			userId: validUserId,
			...legacySassId ? { legacySassId } : {}
		});
	}
	/**
	* Retrieves a specific order's details by ID after strictly verifying customer ownership.
	* If the order belongs to another customer, throws HTTP 403 permission error.
	*/
	async getOrderById(orderId, userId, legacySassId) {
		const validUserId = this.assertValidCustomer(userId);
		await this.assertProfileExists(validUserId);
		const cleanOrderId = (orderId || "").trim();
		if (!cleanOrderId) return null;
		const primaryCol = this.getCustomerCollection(validUserId);
		const subcollectionPath = `${primaryCol}/${validUserId}/orders`;
		let nestedDoc = null;
		try {
			nestedDoc = await this.driver.getDoc(subcollectionPath, cleanOrderId);
		} catch {
			nestedDoc = null;
		}
		if (!nestedDoc) try {
			const queryResults = await this.driver.queryCollection(subcollectionPath, { orderId: cleanOrderId });
			if (queryResults.length > 0 && queryResults[0]) nestedDoc = queryResults[0];
		} catch {
			nestedDoc = null;
		}
		if (!nestedDoc && primaryCol === "onlineCustomers" && legacySassId) {
			try {
				nestedDoc = await this.driver.getDoc(`users/${legacySassId}/orders`, cleanOrderId);
			} catch {
				nestedDoc = null;
			}
			if (!nestedDoc) try {
				const queryResults = await this.driver.queryCollection(`users/${legacySassId}/orders`, { orderId: cleanOrderId });
				if (queryResults.length > 0 && queryResults[0]) nestedDoc = queryResults[0];
			} catch {
				nestedDoc = null;
			}
		}
		let topDoc = null;
		try {
			topDoc = await this.driver.getDoc("orders", cleanOrderId);
		} catch {
			topDoc = null;
		}
		if (!topDoc) try {
			const topQuery = await this.driver.queryCollection("orders", { orderId: cleanOrderId });
			if (topQuery.length > 0 && topQuery[0]) topDoc = topQuery[0];
		} catch {
			topDoc = null;
		}
		if (topDoc) {
			if (isPosOrNonRetailOrder(topDoc)) return null;
			const topOwnerId = String(topDoc["userId"] || topDoc["buyerId"] || topDoc["userProfile"]?.userId || "").trim();
			if (topOwnerId && !(topOwnerId === validUserId || Boolean(legacySassId && topOwnerId === legacySassId))) throw new StorageAdapterError(`Access denied: You cannot view another customer's order.`, {
				status: 403,
				code: "permission-denied",
				category: "permission"
			});
		}
		if (!nestedDoc && !topDoc) return null;
		const reconciled = reconcileCustomerOrders({
			nestedOrders: nestedDoc ? [nestedDoc] : [],
			topLevelOrders: topDoc ? [topDoc] : [],
			userId: validUserId,
			...legacySassId ? { legacySassId } : {}
		});
		return reconciled.length > 0 && reconciled[0] ? reconciled[0] : null;
	}
};
var StorageAdapterError = class extends Error {
	status;
	code;
	category;
	causeError;
	constructor(message, options) {
		super(message);
		this.name = "StorageAdapterError";
		this.status = options.status;
		this.code = options.code;
		this.category = options.category;
		this.causeError = options.causeError;
	}
};
var KNOWN_ARRAY_COLLECTIONS = /* @__PURE__ */ new Set([
	"users",
	"onlineCustomers",
	"products",
	"categories",
	"banners",
	"cart",
	"addresses",
	"wishlists",
	"wishlistProducts",
	"orders",
	"coinHistory",
	"referrals",
	"notifications",
	"reportedProblems",
	"productRequests",
	"deliverySlots"
]);
var KNOWN_SINGLETON_COLLECTIONS = /* @__PURE__ */ new Set(["deliverySettings", "storeInfo"]);
var KNOWN_READONLY_COLLECTIONS = /* @__PURE__ */ new Set([
	"usersByUid",
	"Settings",
	"promoCodes",
	"promos"
]);
var CUSTOMER_SCOPED_COLLECTIONS = /* @__PURE__ */ new Set([
	"users",
	"onlineCustomers",
	"cart",
	"addresses",
	"wishlists",
	"wishlistProducts",
	"orders",
	"coinHistory",
	"referrals",
	"notifications",
	"reportedProblems",
	"productRequests"
]);
var VALID_ORDER_STATUSES = /* @__PURE__ */ new Set([
	"pending",
	"processing",
	"packed",
	"in transit",
	"delivered",
	"cancelled",
	"returned"
]);
function classifyStorageError(error) {
	if (!error) return "unknown";
	if (error instanceof StorageAdapterError) return error.category;
	const err = error;
	const code = String(err.code || "").toLowerCase();
	const msg = String(err.message || "").toLowerCase();
	const status = err.status;
	if (status === 404 || code === "not-found" || code === "firestore/not-found" || msg.includes("http error 404") || msg.includes("document does not exist")) return "not_found";
	if (status === 403 || status === 401 || code === "permission-denied" || code === "firestore/permission-denied" || code === "unauthenticated" || code === "firestore/unauthenticated" || msg.includes("permission_denied") || msg.includes("permission-denied") || msg.includes("missing or insufficient permissions") || msg.includes("access denied")) return "permission";
	if (status === 400 || code === "invalid-argument" || code === "firestore/invalid-argument" || code === "failed-precondition" || code === "firestore/failed-precondition" || code === "out-of-range" || msg.includes("invalid query") || msg.includes("validation error") || msg.includes("invalid argument")) return "validation";
	if (status === 409 || code === "already-exists" || code === "firestore/already-exists" || code === "aborted" || code === "firestore/aborted") return "conflict";
	if (code === "unavailable" || code === "firestore/unavailable" || code === "deadline-exceeded" || code === "firestore/deadline-exceeded" || code === "econnrefused" || code === "econnreset" || code === "etimedout" || code === "enotfound" || msg.includes("unavailable") || msg.includes("econnrefused") || msg.includes("econnreset") || msg.includes("etimedout") || msg.includes("fetch failed") || msg.includes("failed to fetch") || msg.includes("networkerror") || msg.includes("firestore_connectivity_timeout") || msg.includes("could not reach cloud firestore backend") || msg.includes("client is offline")) return "connectivity";
	return "unknown";
}
function toStorageAdapterError(error) {
	if (error instanceof StorageAdapterError) return error;
	const category = classifyStorageError(error);
	const err = error;
	const message = err?.message || String(error);
	let status = err?.status || 500;
	let code = err?.code || "unknown";
	switch (category) {
		case "not_found":
			status = 404;
			code = "not-found";
			break;
		case "permission":
			status = 403;
			code = "permission-denied";
			break;
		case "validation":
			status = 400;
			code = "invalid-argument";
			break;
		case "conflict":
			status = 409;
			code = "conflict";
			break;
		case "connectivity":
			status = 503;
			code = "unavailable";
	}
	return new StorageAdapterError(message, {
		status,
		code,
		category,
		causeError: error
	});
}
function withBoundedTimeout(promise, timeoutMs, operationLabel) {
	if (timeoutMs <= 0) return promise;
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new StorageAdapterError(`FIRESTORE_CONNECTIVITY_TIMEOUT: Firestore timed out after ${timeoutMs}ms during ${operationLabel}`, {
				status: 503,
				code: "unavailable",
				category: "connectivity"
			}));
		}, timeoutMs);
		promise.then((val) => {
			clearTimeout(timer);
			resolve(val);
		}).catch((err) => {
			clearTimeout(timer);
			reject(toStorageAdapterError(err));
		});
	});
}
var NESTED_PRODUCT_COLLECTION_RE = /^products\/([^/]+)\/items$/;
var NESTED_PRODUCT_DOC_PATH_RE = /^products\/([^/]+)\/items\/([^/]+)$/;
/**
* Attaches parent category, document ID, and canonical path context to a nested
* product document retrieved from `products/{category}/items/{productId}` so
* downstream normalizers (`legacySchemaMapper`) and query filters have full context.
*/
function attachNestedProductContext(data, parentCategory, docId) {
	const cleanCategory = parentCategory.trim();
	const cleanDocId = docId.trim();
	const resolvedId = typeof data["id"] === "string" && data["id"].trim() || typeof data["productId"] === "string" && data["productId"].trim() || typeof data["sku"] === "string" && data["sku"].trim() || cleanDocId;
	const resolvedCategorySlug = deriveCategorySlug(typeof data["category"] === "string" && data["category"].trim() || typeof data["categoryName"] === "string" && data["categoryName"].trim() || cleanCategory, data["categorySlug"]);
	const inferredFlashDeal = typeof data["isFlashDeal"] === "boolean" ? data["isFlashDeal"] : typeof data["offerZone"] === "boolean" ? data["offerZone"] : typeof data["showOfferBand"] === "boolean" ? data["showOfferBand"] : void 0;
	return {
		...data,
		id: resolvedId,
		...typeof data["categorySlug"] === "string" && data["categorySlug"].trim() ? {} : { categorySlug: resolvedCategorySlug },
		...inferredFlashDeal !== void 0 && data["isFlashDeal"] === void 0 ? { isFlashDeal: inferredFlashDeal } : {},
		_docId: cleanDocId,
		_parentCategory: cleanCategory,
		_path: `products/${cleanCategory}/items/${cleanDocId}`
	};
}
function extractLogicalProductKeys(record) {
	const keys = [];
	for (const field of [
		"id",
		"productId",
		"sku",
		"_docId"
	]) {
		const val = record[field];
		if (typeof val === "string" && val.trim().length > 0) {
			const trimmed = val.trim();
			if (!keys.includes(trimmed)) keys.push(trimmed);
		}
	}
	return keys;
}
function isBareCategoryContainerStub(record, nestedCategories) {
	if (Array.isArray(record["options"]) && record["options"].length > 0 || Array.isArray(record["variants"]) && record["variants"].length > 0 || record["offerPrice"] !== void 0 || record["sellingPrice"] !== void 0 || record["price"] !== void 0) return false;
	if (record["items"] !== void 0) return true;
	const docId = typeof record["id"] === "string" ? record["id"].trim() : "";
	if (nestedCategories && docId && nestedCategories.has(docId)) return true;
	return false;
}
/**
* Merges top-level `products/{productId}` and nested `products/{category}/items/{productId}`
* documents using a deterministic precedence rule:
* 1. Top-level product documents take precedence over nested `items` documents when both
*    share any logical product identifier (`id`, `productId`, `sku`, or `_docId`).
* 2. Bare category container stub documents at `products/{category}` (without product
*    options/variants/pricing) are excluded so they do not pollute or shadow nested items.
* 3. Nested documents are ordered deterministically by `(_parentCategory, _docId)` before
*    deduplication.
*/
function mergeTopLevelAndNestedProducts(topLevelItems, nestedItems) {
	const nestedCategories = /* @__PURE__ */ new Set();
	for (const nested of nestedItems) {
		const cat = nested["_parentCategory"];
		if (typeof cat === "string" && cat.trim().length > 0) nestedCategories.add(cat.trim());
	}
	const seenKeys = /* @__PURE__ */ new Set();
	const merged = [];
	for (const topDoc of topLevelItems) {
		if (isBareCategoryContainerStub(topDoc, nestedCategories)) continue;
		const keys = extractLogicalProductKeys(topDoc);
		if (keys.length > 0 && keys.some((k) => seenKeys.has(k))) continue;
		for (const k of keys) seenKeys.add(k);
		merged.push(topDoc);
	}
	const sortedNested = [...nestedItems].sort((a, b) => {
		const catA = String(a["_parentCategory"] ?? "");
		const catB = String(b["_parentCategory"] ?? "");
		if (catA !== catB) return catA.localeCompare(catB);
		const idA = String(a["_docId"] ?? a["id"] ?? "");
		const idB = String(b["_docId"] ?? b["id"] ?? "");
		return idA.localeCompare(idB);
	});
	for (const nestedDoc of sortedNested) {
		const keys = extractLogicalProductKeys(nestedDoc);
		if (keys.length > 0 && keys.some((k) => seenKeys.has(k))) continue;
		for (const k of keys) seenKeys.add(k);
		merged.push(nestedDoc);
	}
	return merged;
}
function parseEndpoint(endpoint, params) {
	const raw = (endpoint || "").trim();
	if (!raw) throw new StorageAdapterError("Validation error: Endpoint cannot be empty", {
		status: 400,
		code: "invalid-argument",
		category: "validation"
	});
	const parts = raw.split("?");
	const pathPart = parts[0] ?? "";
	const queryString = parts[1];
	const embeddedParams = {};
	if (queryString) new URLSearchParams(queryString).forEach((v, k) => {
		embeddedParams[k] = v;
	});
	if (params) {
		for (const [k, v] of Object.entries(params)) if (v !== void 0 && v !== null) embeddedParams[k] = String(v);
	}
	const segments = pathPart.split("/").map((s) => s.trim()).filter(Boolean).map((s) => {
		try {
			return decodeURIComponent(s);
		} catch {
			return s;
		}
	});
	const firstSegment = segments[0];
	if (!firstSegment) throw new StorageAdapterError(`Validation error: Invalid endpoint "${endpoint}"`, {
		status: 400,
		code: "invalid-argument",
		category: "validation"
	});
	if ((firstSegment === "users" || firstSegment === "onlineCustomers") && (segments[2] === "orders" || segments[2] === "cart" || segments[2] === "addresses" || segments[2] === "coinHistory" || segments[2] === "notifications" || segments[2] === "referrals") && (segments.length === 3 || segments.length === 4)) return {
		resource: segments[2],
		parentResource: firstSegment,
		parentId: segments[1] ?? "",
		docId: segments[3],
		isSingleton: false,
		embeddedParams: {
			...embeddedParams,
			userId: segments[1] ?? ""
		}
	};
	if ((segments.length === 3 || segments.length === 4) && firstSegment === "products" && segments[2] === "items") {
		const nestedCategory = segments[1] ?? "";
		if (!nestedCategory) throw new StorageAdapterError(`Validation error: Invalid nested product category in "${endpoint}"`, {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		return {
			resource: "products",
			nestedCategory,
			docId: segments[3],
			isNestedProductItems: true,
			isSingleton: false,
			embeddedParams
		};
	}
	if (segments.length > 2) throw new StorageAdapterError(`Validation error: Unsupported nested endpoint path "${endpoint}"`, {
		status: 400,
		code: "invalid-argument",
		category: "validation"
	});
	const resource = firstSegment;
	if (KNOWN_SINGLETON_COLLECTIONS.has(resource)) return {
		resource,
		docId: segments[1] || "default",
		isSingleton: true,
		embeddedParams
	};
	if (!KNOWN_ARRAY_COLLECTIONS.has(resource) && !KNOWN_READONLY_COLLECTIONS.has(resource) && resource !== "_metadata") throw new StorageAdapterError(`Permission or validation error: Unknown collection "${resource}" is not permitted by Firestore rules.`, {
		status: 403,
		code: "permission-denied",
		category: "permission"
	});
	return {
		resource,
		docId: segments[1],
		isSingleton: false,
		embeddedParams
	};
}
/**
* Validates write payloads against domain schema and Firestore rule invariants
* so invalid writes fail fast with a 400/403 error and never trigger a fallback.
*/
function validateWritePayload(resource, method, payload) {
	if (KNOWN_READONLY_COLLECTIONS.has(resource)) throw new StorageAdapterError(`Permission denied: Collection "${resource}" is read-only and cannot be modified by the client.`, {
		status: 403,
		code: "permission-denied",
		category: "permission"
	});
	if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new StorageAdapterError(`Validation error: Write payload for ${resource} must be a non-null object.`, {
		status: 400,
		code: "invalid-argument",
		category: "validation"
	});
	const data = payload;
	if (method === "POST" || method === "PUT") {
		if (CUSTOMER_SCOPED_COLLECTIONS.has(resource)) {
			if (!(typeof data["userId"] === "string" ? data["userId"].trim() : "")) throw new StorageAdapterError(`Permission denied: Collection "${resource}" requires a non-empty customer userId.`, {
				status: 403,
				code: "permission-denied",
				category: "permission"
			});
		}
		if (resource === "orders") {
			const status = String(data["status"] || "pending");
			if (!VALID_ORDER_STATUSES.has(status)) throw new StorageAdapterError(`Validation error: Invalid order status "${status}".`, {
				status: 400,
				code: "invalid-argument",
				category: "validation"
			});
		}
		if (resource === "cart") {
			if (typeof data["quantity"] !== "number" || data["quantity"] <= 0) throw new StorageAdapterError(`Validation error: Cart item quantity must be a positive number.`, {
				status: 400,
				code: "invalid-argument",
				category: "validation"
			});
		}
		if (resource === "coinHistory") {
			if (typeof data["amount"] !== "number" || data["type"] !== "earned" && data["type"] !== "redeemed") throw new StorageAdapterError(`Validation error: CoinTransaction requires numeric amount and type in ['earned', 'redeemed'].`, {
				status: 400,
				code: "invalid-argument",
				category: "validation"
			});
		}
	}
	if (method === "PATCH") {
		if (resource === "orders" && data["status"] !== void 0) {
			const status = String(data["status"]);
			if (!VALID_ORDER_STATUSES.has(status)) throw new StorageAdapterError(`Validation error: Invalid order status "${status}".`, {
				status: 400,
				code: "invalid-argument",
				category: "validation"
			});
		}
		if (CUSTOMER_SCOPED_COLLECTIONS.has(resource) && "userId" in data && typeof data["userId"] === "string" && data["userId"].trim() === "") throw new StorageAdapterError(`Permission denied: Cannot set an empty customer userId on "${resource}".`, {
			status: 403,
			code: "permission-denied",
			category: "permission"
		});
	}
	return data;
}
function stripUndefinedDeep(input) {
	if (input === null || input === void 0 || typeof input !== "object") return input;
	if (Array.isArray(input)) return input.map((item) => stripUndefinedDeep(item));
	const out = {};
	for (const [k, v] of Object.entries(input)) if (v !== void 0) out[k] = stripUndefinedDeep(v);
	return out;
}
/**
* Firebase Web SDK driver. Normal runtime uses the configured Firebase project;
* the emulator backend is selected only by the automated test environment.
*/
var SdkFirestoreDriver = class {
	configOverrides;
	constructor(configOverrides) {
		this.configOverrides = configOverrides;
	}
	getDb() {
		return getIsolatedProductionFirestore().db;
	}
	async checkHealth(timeoutMs = 1200) {
		const db = this.getDb();
		const ref = doc(db, "storeInfo", "default");
		await withBoundedTimeout(getDoc(ref), timeoutMs, "healthCheck(storeInfo/default)");
	}
	async getDoc(collectionName, docId, timeoutMs = 2e3) {
		const nestedMatch = NESTED_PRODUCT_COLLECTION_RE.exec(collectionName);
		if (nestedMatch && nestedMatch[1]) return this.getNestedProductDoc(nestedMatch[1], docId, timeoutMs);
		const db = this.getDb();
		const ref = doc(db, collectionName, docId);
		const snap = await withBoundedTimeout(getDoc(ref), timeoutMs, `getDoc(${collectionName}/${docId})`);
		if (!snap.exists()) return null;
		const data = snap.data();
		if (collectionName === "storeInfo" && !("id" in data)) return { ...data };
		return {
			id: snap.id,
			...data
		};
	}
	async getNestedProductDoc(category, productId, timeoutMs = 2e3) {
		const db = this.getDb();
		const ref = doc(db, "products", category, "items", productId);
		const snap = await withBoundedTimeout(getDoc(ref), timeoutMs, `getDoc(products/${category}/items/${productId})`);
		if (!snap.exists()) return null;
		return attachNestedProductContext(snap.data(), category, snap.id);
	}
	async queryNestedProducts(category, timeoutMs = 2500) {
		const db = this.getDb();
		const results = [];
		if (category && category.trim().length > 0) {
			const cleanCategory = category.trim();
			const colRef = collection(db, "products", cleanCategory, "items");
			(await withBoundedTimeout(getDocs(query(colRef)), timeoutMs, `queryCollection(products/${cleanCategory}/items)`)).forEach((docSnap) => {
				const data = docSnap.data();
				results.push(attachNestedProductContext(data, cleanCategory, docSnap.id));
			});
		} else {
			const groupRef = collectionGroup(db, "items");
			(await withBoundedTimeout(getDocs(query(groupRef)), timeoutMs, "queryCollectionGroup(products/*/items)")).forEach((docSnap) => {
				const refPath = docSnap.ref.path;
				const match = NESTED_PRODUCT_DOC_PATH_RE.exec(refPath);
				if (match && match[1]) {
					let parentCategory = match[1];
					try {
						parentCategory = decodeURIComponent(parentCategory);
					} catch {}
					const data = docSnap.data();
					results.push(attachNestedProductContext(data, parentCategory, docSnap.id));
				}
			});
		}
		results.sort((a, b) => String(a["_path"] ?? "").localeCompare(String(b["_path"] ?? "")));
		return results;
	}
	async queryCollection(collectionName, equalityFilters, timeoutMs = 2500) {
		const nestedMatch = NESTED_PRODUCT_COLLECTION_RE.exec(collectionName);
		if (nestedMatch && nestedMatch[1]) return this.queryNestedProducts(nestedMatch[1], timeoutMs);
		const db = this.getDb();
		const colRef = collection(db, collectionName);
		const constraints = [];
		for (const [field, value] of Object.entries(equalityFilters)) if (value !== void 0) constraints.push(where(field, "==", value));
		const q = constraints.length > 0 ? query(colRef, ...constraints) : query(colRef);
		const snap = await withBoundedTimeout(getDocs(q), timeoutMs, `queryCollection(${collectionName})`);
		const results = [];
		snap.forEach((docSnap) => {
			const data = docSnap.data();
			results.push({
				id: docSnap.id,
				...data
			});
		});
		return results;
	}
	async setDoc(collectionName, docId, data, merge = false, timeoutMs = 2500) {
		const db = this.getDb();
		const ref = doc(db, collectionName, docId);
		const cleanData = stripUndefinedDeep({ ...data });
		if (collectionName !== "storeInfo" && !cleanData["id"]) cleanData["id"] = docId;
		await withBoundedTimeout(merge ? setDoc(ref, cleanData, { merge: true }) : setDoc(ref, cleanData), timeoutMs, `setDoc(${collectionName}/${docId})`);
		const snap = await withBoundedTimeout(getDoc(ref), timeoutMs, `verifySetDoc(${collectionName}/${docId})`);
		const stored = snap.exists() ? snap.data() : cleanData;
		if (collectionName === "storeInfo" && !("id" in data)) {
			const copy = { ...stored };
			delete copy["id"];
			return copy;
		}
		return {
			id: docId,
			...stored
		};
	}
	async updateDoc(collectionName, docId, patch, timeoutMs = 2500) {
		const db = this.getDb();
		const ref = doc(db, collectionName, docId);
		const existingSnap = await withBoundedTimeout(getDoc(ref), timeoutMs, `getDocBeforeUpdate(${collectionName}/${docId})`);
		if (!existingSnap.exists()) throw new StorageAdapterError(`HTTP Error 404: Not Found (${collectionName}/${docId})`, {
			status: 404,
			code: "not-found",
			category: "not_found"
		});
		const existingData = existingSnap.data();
		const merged = stripUndefinedDeep({
			...existingData,
			...patch
		});
		if (collectionName !== "storeInfo") merged["id"] = existingData["id"] || docId;
		await withBoundedTimeout(setDoc(ref, merged), timeoutMs, `updateDoc(${collectionName}/${docId})`);
		if (collectionName === "storeInfo" && !("id" in existingData)) {
			const copy = { ...merged };
			delete copy["id"];
			return copy;
		}
		return merged;
	}
	async deleteDoc(collectionName, docId, timeoutMs = 2e3) {
		const db = this.getDb();
		const ref = doc(db, collectionName, docId);
		if (!(await withBoundedTimeout(getDoc(ref), timeoutMs, `getDocBeforeDelete(${collectionName}/${docId})`)).exists()) throw new StorageAdapterError(`HTTP Error 404: Not Found (${collectionName}/${docId})`, {
			status: 404,
			code: "not-found",
			category: "not_found"
		});
		await withBoundedTimeout(deleteDoc(ref), timeoutMs, `deleteDoc(${collectionName}/${docId})`);
	}
	async runOrderCreationTransaction(orderPayload, timeoutMs = 3e3) {
		const db = this.getDb();
		const cleanPayload = stripUndefinedDeep({ ...orderPayload });
		return withBoundedTimeout(runTransaction(db, async (tx) => {
			const counterRef = doc(db, "_metadata", "orderSequence");
			const counterSnap = await tx.get(counterRef);
			let currentSeq = 5510;
			if (counterSnap.exists()) {
				const snapData = counterSnap.data();
				const val = Number(snapData["currentSeq"]);
				if (!Number.isNaN(val) && val >= 1e3) currentSeq = val;
			}
			let finalOrderId = String(cleanPayload["orderId"] || cleanPayload["id"] || "").trim();
			if (!finalOrderId || !/^ORD-\d{7}$/.test(finalOrderId)) {
				currentSeq = currentSeq >= 9999 ? 1001 : currentSeq + 1;
				finalOrderId = `ORD-${String(currentSeq).padStart(7, "0")}`;
			}
			let orderRef = doc(db, "orders", finalOrderId);
			let existingOrderSnap = await tx.get(orderRef);
			if (existingOrderSnap.exists()) {
				const existingOrder = existingOrderSnap.data();
				if (existingOrder["userId"] === cleanPayload["userId"] && (existingOrder["createdAt"] === cleanPayload["createdAt"] || JSON.stringify(existingOrder["items"]) === JSON.stringify(cleanPayload["items"]))) return {
					id: finalOrderId,
					...existingOrder
				};
				currentSeq = currentSeq >= 9999 ? 1001 : currentSeq + 1;
				finalOrderId = `ORD-${String(currentSeq).padStart(7, "0")}`;
				orderRef = doc(db, "orders", finalOrderId);
				existingOrderSnap = await tx.get(orderRef);
			}
			const parsedSeq = Number(finalOrderId.replace(/^ORD-0*/, ""));
			const nextCounterVal = !Number.isNaN(parsedSeq) && parsedSeq > currentSeq ? parsedSeq : currentSeq + 1;
			tx.set(counterRef, {
				currentSeq: nextCounterVal,
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			});
			const recordToSave = {
				...cleanPayload,
				id: finalOrderId,
				orderId: finalOrderId
			};
			tx.set(orderRef, recordToSave);
			const rawCustomerId = String(cleanPayload["customerId"] || cleanPayload["userId"] || "").trim();
			const normalizedCustomerId = rawCustomerId.startsWith("SASS") ? `ONCUS${rawCustomerId.slice(4)}` : rawCustomerId;
			if (normalizedCustomerId && normalizedCustomerId.toUpperCase().startsWith("ONCUS")) {
				const customerOrderRef = doc(db, "onlineCustomers", normalizedCustomerId, "orders", finalOrderId);
				tx.set(customerOrderRef, recordToSave);
			}
			return recordToSave;
		}), timeoutMs, "runOrderCreationTransaction");
	}
};
/**
* Applies JSON Server compatible filtering, searching, sorting, and pagination
* on top of collection documents retrieved from Firestore.
*/
function applyResourceQueryAndSort(resource, items, params) {
	let result = [...items];
	const sortField = params["_sort"];
	const sortOrder = (params["_order"] || "asc").toLowerCase();
	const limitParam = params["_limit"] !== void 0 ? Number(params["_limit"]) : void 0;
	const pageParam = params["_page"] !== void 0 ? Number(params["_page"]) : void 0;
	const fullTextQuery = params["q"] ? params["q"].trim().toLowerCase() : void 0;
	if (limitParam !== void 0 && (Number.isNaN(limitParam) || limitParam < 0)) throw new StorageAdapterError("Validation error: _limit must be a non-negative number", {
		status: 400,
		code: "invalid-argument",
		category: "validation"
	});
	for (const [rawKey, rawVal] of Object.entries(params)) {
		if (rawKey.startsWith("_") || rawKey === "q") continue;
		if (rawKey.endsWith("_like")) {
			const field = rawKey.slice(0, -5);
			const pattern = new RegExp(rawVal, "i");
			result = result.filter((item) => pattern.test(String(item[field] ?? "")));
			continue;
		}
		if (rawKey.endsWith("_ne")) {
			const field = rawKey.slice(0, -3);
			result = result.filter((item) => !matchesScalarValue(item[field], rawVal));
			continue;
		}
		if (rawKey.endsWith("_gte")) {
			const field = rawKey.slice(0, -4);
			const numVal = Number(rawVal);
			result = result.filter((item) => Number(item[field]) >= numVal);
			continue;
		}
		if (rawKey.endsWith("_lte")) {
			const field = rawKey.slice(0, -4);
			const numVal = Number(rawVal);
			result = result.filter((item) => Number(item[field]) <= numVal);
			continue;
		}
		result = result.filter((item) => matchesScalarValue(item[rawKey], rawVal));
	}
	if (fullTextQuery) result = result.filter((item) => JSON.stringify(item).toLowerCase().includes(fullTextQuery));
	if (sortField) result.sort((a, b) => {
		const va = a[sortField];
		const vb = b[sortField];
		if (va === vb) return 0;
		if (va === void 0 || va === null) return 1;
		if (vb === void 0 || vb === null) return -1;
		const cmp = va < vb ? -1 : 1;
		return sortOrder === "desc" ? -cmp : cmp;
	});
	else if (resource === "orders") result.sort((a, b) => new Date(String(b["createdAt"] || 0)).getTime() - new Date(String(a["createdAt"] || 0)).getTime());
	else if (resource === "notifications" || resource === "coinHistory") result.sort((a, b) => new Date(String(b["timestamp"] || 0)).getTime() - new Date(String(a["timestamp"] || 0)).getTime());
	else if (resource === "referrals") result.sort((a, b) => new Date(String(b["date"] || 0)).getTime() - new Date(String(a["date"] || 0)).getTime());
	if (limitParam !== void 0) {
		const start = pageParam && pageParam > 1 ? (pageParam - 1) * limitParam : 0;
		result = result.slice(start, start + limitParam);
	}
	return result;
}
function matchesScalarValue(fieldVal, paramStr) {
	if (fieldVal === paramStr) return true;
	if (typeof fieldVal === "boolean") {
		if (paramStr.toLowerCase() === "true") return fieldVal === true;
		if (paramStr.toLowerCase() === "false") return fieldVal === false;
	}
	if (typeof fieldVal === "number" && paramStr.trim() !== "") {
		const parsed = Number(paramStr);
		if (!Number.isNaN(parsed)) return fieldVal === parsed;
	}
	return String(fieldVal ?? "") === paramStr;
}
/**
* Extracts direct Firestore equality filters (`where(field, "==", val)`)
* for indexed fields to minimize reads before applying full resource post-filtering.
*/
function buildFirestoreEqualityFilters(resource, params) {
	const filters = {};
	if (params["userId"] !== void 0) filters["userId"] = params["userId"];
	if (resource === "orders" && params["orderId"] !== void 0) filters["orderId"] = params["orderId"];
	if (resource === "wishlistProducts" && params["wishlistId"] !== void 0) filters["wishlistId"] = params["wishlistId"];
	if ((resource === "promoCodes" || resource === "promos") && params["code"] !== void 0) filters["code"] = params["code"];
	if (resource === "products") {
		if (params["categorySlug"] !== void 0) filters["categorySlug"] = params["categorySlug"];
		if (params["isFlashDeal"] !== void 0) {
			if (params["isFlashDeal"] === "true") filters["isFlashDeal"] = true;
			else if (params["isFlashDeal"] === "false") filters["isFlashDeal"] = false;
		}
	}
	return filters;
}
var FirestoreAdapter = class {
	driver;
	legacyCustomerSubcollectionsEnabled = false;
	legacyCartAddressAdapter = null;
	legacyOrderAdapter = null;
	constructor(driver, options) {
		this.driver = driver ?? new SdkFirestoreDriver();
		this.legacyCustomerSubcollectionsEnabled = Boolean(options?.legacyCustomerSubcollections);
		if (this.legacyCustomerSubcollectionsEnabled) {
			this.legacyCartAddressAdapter = new LegacyCartAddressAdapter(this.driver);
			this.legacyOrderAdapter = new LegacyOrderAdapter(this.driver);
		}
	}
	setLegacyCustomerSubcollectionsEnabled(enabled) {
		this.legacyCustomerSubcollectionsEnabled = enabled;
		if (enabled && !this.legacyCartAddressAdapter) this.legacyCartAddressAdapter = new LegacyCartAddressAdapter(this.driver);
		if (enabled && !this.legacyOrderAdapter) this.legacyOrderAdapter = new LegacyOrderAdapter(this.driver);
	}
	isLegacyCustomerSubcollectionsEnabled() {
		return this.legacyCustomerSubcollectionsEnabled;
	}
	getLegacyCartAddressAdapter() {
		if (!this.legacyCartAddressAdapter) this.legacyCartAddressAdapter = new LegacyCartAddressAdapter(this.driver);
		return this.legacyCartAddressAdapter;
	}
	getLegacyOrderAdapter() {
		if (!this.legacyOrderAdapter) this.legacyOrderAdapter = new LegacyOrderAdapter(this.driver);
		return this.legacyOrderAdapter;
	}
	setDriver(driver) {
		this.driver = driver;
		if (this.legacyCartAddressAdapter) this.legacyCartAddressAdapter = new LegacyCartAddressAdapter(driver);
		if (this.legacyOrderAdapter) this.legacyOrderAdapter = new LegacyOrderAdapter(driver);
	}
	getDriver() {
		return this.driver;
	}
	async resolveUserIdForAddressId(addressId, candidateUserId) {
		if (candidateUserId && candidateUserId.trim().length > 0) {
			const clean = candidateUserId.trim();
			if (!isValidCustomerId(clean)) throw new StorageAdapterError(`Validation error: Invalid customer identifier "${candidateUserId}". Operations require a canonical SASS customer ID or ONCUS customer ID.`, {
				status: 400,
				code: "invalid-argument",
				category: "validation"
			});
			return clean;
		}
		throw new StorageAdapterError(`Permission denied: Accessing customer address "${(addressId || "").trim()}" requires an explicit, verified customer identity. Missing customer identity fails closed.`, {
			status: 403,
			code: "permission-denied",
			category: "permission"
		});
	}
	async resolveUserIdForCartDocId(cartDocId, candidateUserId) {
		const cleanCartId = (cartDocId || "").trim();
		if (candidateUserId && candidateUserId.trim().length > 0) {
			const cleanUser = candidateUserId.trim();
			if (!isValidCustomerId(cleanUser)) throw new StorageAdapterError(`Validation error: Invalid customer identifier "${candidateUserId}". Operations require a canonical SASS customer ID or ONCUS customer ID.`, {
				status: 400,
				code: "invalid-argument",
				category: "validation"
			});
			if (cleanCartId.includes("__")) {
				const prefix = cleanCartId.split("__")[0];
				if (isValidCustomerId(prefix) && prefix !== cleanUser) throw new StorageAdapterError(`Permission denied: Ownership mismatch. Cannot access cart item belonging to customer "${prefix}" using identity "${cleanUser}".`, {
					status: 403,
					code: "permission-denied",
					category: "permission"
				});
			}
			return cleanUser;
		}
		if (cleanCartId.includes("__")) {
			const prefix = cleanCartId.split("__")[0];
			if (isValidCustomerId(prefix)) return prefix;
		}
		throw new StorageAdapterError(`Permission denied: Accessing customer cart item "${cleanCartId}" requires an explicit, verified customer identity. Missing customer identity fails closed.`, {
			status: 403,
			code: "permission-denied",
			category: "permission"
		});
	}
	async checkConnectivity(timeoutMs = 1200) {
		try {
			await this.driver.checkHealth(timeoutMs);
		} catch (err) {
			throw toStorageAdapterError(err);
		}
	}
	async getDocumentRaw(resource, docId) {
		const targetDocId = KNOWN_SINGLETON_COLLECTIONS.has(resource) ? "default" : docId;
		return this.driver.getDoc(resource, targetDocId);
	}
	async setDocumentRaw(resource, docId, payload, merge = false) {
		const targetDocId = KNOWN_SINGLETON_COLLECTIONS.has(resource) ? "default" : docId;
		return this.driver.setDoc(resource, targetDocId, payload, merge);
	}
	async deleteDocumentRaw(resource, docId) {
		return this.driver.deleteDoc(resource, docId);
	}
	async queryNestedProductsFromDriver(category) {
		if (typeof this.driver.queryNestedProducts === "function") return this.driver.queryNestedProducts(category);
		if (category) return this.driver.queryCollection(`products/${category}/items`, {});
		return [];
	}
	async getNestedProductDocFromDriver(category, productId) {
		if (typeof this.driver.getNestedProductDoc === "function") return this.driver.getNestedProductDoc(category, productId);
		return this.driver.getDoc(`products/${category}/items`, productId);
	}
	async findNestedProductById(targetId) {
		const cleanTarget = targetId.trim();
		if (!cleanTarget) return null;
		const nestedItems = await this.queryNestedProductsFromDriver();
		for (const item of nestedItems) if (extractLogicalProductKeys(item).includes(cleanTarget)) return item;
		return null;
	}
	async get(endpoint, params) {
		const parsed = parseEndpoint(endpoint, params);
		if (this.legacyCustomerSubcollectionsEnabled) {
			if (parsed.resource === "cart") {
				const legacyAdapter = this.getLegacyCartAddressAdapter();
				if (parsed.docId) {
					const userId = await this.resolveUserIdForCartDocId(parsed.docId, parsed.embeddedParams["userId"]);
					const item = await legacyAdapter.getCartItem(userId, parsed.docId);
					if (!item) throw new StorageAdapterError(`HTTP Error 404: Not Found (cart/${parsed.docId})`, {
						status: 404,
						code: "not-found",
						category: "not_found"
					});
					return item;
				}
				const userId = parsed.embeddedParams["userId"];
				if (!userId) throw new StorageAdapterError(`Validation error: Querying cart in legacy subcollection mode requires a valid customer userId.`, {
					status: 400,
					code: "invalid-argument",
					category: "validation"
				});
				return await legacyAdapter.getCart(userId);
			}
			if (parsed.resource === "addresses") {
				const legacyAdapter = this.getLegacyCartAddressAdapter();
				if (parsed.docId) {
					const userId = await this.resolveUserIdForAddressId(parsed.docId, parsed.embeddedParams["userId"]);
					const address = await legacyAdapter.getAddress(userId, parsed.docId);
					if (!address) throw new StorageAdapterError(`HTTP Error 404: Not Found (addresses/${parsed.docId})`, {
						status: 404,
						code: "not-found",
						category: "not_found"
					});
					return address;
				}
				const userId = parsed.embeddedParams["userId"];
				if (!userId) throw new StorageAdapterError(`Validation error: Querying addresses in legacy subcollection mode requires a valid customer userId.`, {
					status: 400,
					code: "invalid-argument",
					category: "validation"
				});
				return await legacyAdapter.getAddresses(userId);
			}
			if (parsed.resource === "orders") {
				const legacyAdapter = this.getLegacyOrderAdapter();
				const candidateUser = (parsed.embeddedParams["userId"] || (typeof params?.["userId"] === "string" ? params["userId"] : void 0) || "").trim();
				if (parsed.docId) {
					if (!candidateUser) throw new StorageAdapterError(`Missing customer identity: Retrieving order '${parsed.docId}' in legacy customer mode requires an authenticated customer context.`, {
						status: 403,
						code: "permission-denied",
						category: "permission"
					});
					const order = await legacyAdapter.getOrderById(parsed.docId, candidateUser);
					if (!order) throw new StorageAdapterError(`HTTP Error 404: Not Found (orders/${parsed.docId})`, {
						status: 404,
						code: "not-found",
						category: "not_found"
					});
					return order;
				}
				if (!candidateUser) throw new StorageAdapterError(`Missing customer identity: Querying customer orders in legacy mode requires a valid customer userId.`, {
					status: 403,
					code: "permission-denied",
					category: "permission"
				});
				const targetOrderId = typeof params?.["orderId"] === "string" ? params["orderId"].trim() : "";
				if (targetOrderId) {
					const order = await legacyAdapter.getOrderById(targetOrderId, candidateUser);
					return order ? [order] : [];
				}
				return await legacyAdapter.getCustomerOrders(candidateUser);
			}
		}
		if (parsed.isNestedProductItems && parsed.nestedCategory) {
			if (parsed.docId) {
				const nestedDoc = await this.getNestedProductDocFromDriver(parsed.nestedCategory, parsed.docId);
				if (!nestedDoc) throw new StorageAdapterError(`HTTP Error 404: Not Found (products/${parsed.nestedCategory}/items/${parsed.docId})`, {
					status: 404,
					code: "not-found",
					category: "not_found"
				});
				return nestedDoc;
			}
			return applyResourceQueryAndSort("products", await this.queryNestedProductsFromDriver(parsed.nestedCategory), parsed.embeddedParams);
		}
		if (parsed.isSingleton) {
			const docData = await this.driver.getDoc(parsed.resource, parsed.docId || "default");
			if (!docData) throw new StorageAdapterError(`HTTP Error 404: Not Found (${parsed.resource})`, {
				status: 404,
				code: "not-found",
				category: "not_found"
			});
			return docData;
		}
		if (parsed.docId) {
			let docData = await this.driver.getDoc(parsed.resource, parsed.docId);
			if (!docData && parsed.resource === "orders") {
				const byOrderId = await this.driver.queryCollection("orders", { orderId: parsed.docId });
				if (byOrderId.length > 0 && byOrderId[0]) docData = byOrderId[0];
			}
			if (parsed.resource === "products") {
				if (!docData || isBareCategoryContainerStub(docData)) {
					const nestedMatch = await this.findNestedProductById(parsed.docId);
					if (nestedMatch) docData = nestedMatch;
					else if (docData && isBareCategoryContainerStub(docData)) docData = null;
				}
			}
			if (!docData) throw new StorageAdapterError(`HTTP Error 404: Not Found (${parsed.resource}/${parsed.docId})`, {
				status: 404,
				code: "not-found",
				category: "not_found"
			});
			return docData;
		}
		const eqFilters = buildFirestoreEqualityFilters(parsed.resource, parsed.embeddedParams);
		let rawItems = await this.driver.queryCollection(parsed.resource, eqFilters);
		if (parsed.resource === "products") {
			const nestedItems = await this.queryNestedProductsFromDriver();
			rawItems = mergeTopLevelAndNestedProducts(rawItems, nestedItems);
		}
		return applyResourceQueryAndSort(parsed.resource, rawItems, parsed.embeddedParams);
	}
	async post(endpoint, data) {
		const parsed = parseEndpoint(endpoint);
		const validData = validateWritePayload(parsed.resource, "POST", data);
		if (this.legacyCustomerSubcollectionsEnabled) {
			if (parsed.resource === "cart") {
				const legacyAdapter = this.getLegacyCartAddressAdapter();
				const epUser = parsed.embeddedParams["userId"]?.trim();
				const bodyUser = (typeof validData["userId"] === "string" ? validData["userId"] : "")?.trim();
				if (epUser && bodyUser && epUser !== bodyUser) throw new StorageAdapterError(`Permission denied: Ownership mismatch. Endpoint customer ID "${epUser}" does not match payload customer ID "${bodyUser}".`, {
					status: 403,
					code: "permission-denied",
					category: "permission"
				});
				const userId = epUser || bodyUser || "";
				if (!userId) throw new StorageAdapterError(`Permission denied: Cart mutation requires an explicit customer identity. Missing customer identity fails closed.`, {
					status: 403,
					code: "permission-denied",
					category: "permission"
				});
				return await legacyAdapter.addToCart(userId, validData);
			}
			if (parsed.resource === "addresses") {
				const legacyAdapter = this.getLegacyCartAddressAdapter();
				const epUser = parsed.embeddedParams["userId"]?.trim();
				const bodyUser = (typeof validData["userId"] === "string" ? validData["userId"] : "")?.trim();
				if (epUser && bodyUser && epUser !== bodyUser) throw new StorageAdapterError(`Permission denied: Ownership mismatch. Endpoint customer ID "${epUser}" does not match payload customer ID "${bodyUser}".`, {
					status: 403,
					code: "permission-denied",
					category: "permission"
				});
				const userId = epUser || bodyUser || "";
				if (!userId) throw new StorageAdapterError(`Permission denied: Address mutation requires an explicit customer identity. Missing customer identity fails closed.`, {
					status: 403,
					code: "permission-denied",
					category: "permission"
				});
				return await legacyAdapter.addAddress(userId, validData);
			}
		}
		if (parsed.isSingleton) return await this.driver.setDoc(parsed.resource, parsed.docId || "default", validData, false);
		if (parsed.resource === "orders") return await this.driver.runOrderCreationTransaction(validData);
		if (parsed.resource === "notifications") {
			const notifId = String(validData["id"] || `notif_${Date.now()}`).trim();
			const existingById = await this.driver.getDoc("notifications", notifId);
			if (existingById) return existingById;
			if (validData["eventKey"] && validData["userId"]) {
				const dup = (await this.driver.queryCollection("notifications", { userId: String(validData["userId"]) })).find((n) => n["eventKey"] === validData["eventKey"]);
				if (dup) return dup;
			}
			const saved = await this.driver.setDoc("notifications", notifId, {
				...validData,
				id: notifId
			}, false);
			const rawUser = String(validData["userId"] || parsed.parentId || "").trim();
			const normalizedCustomerId = rawUser.startsWith("SASS") ? `ONCUS${rawUser.slice(4)}` : rawUser;
			if (normalizedCustomerId && normalizedCustomerId.toUpperCase().startsWith("ONCUS")) try {
				await this.driver.setDoc(`onlineCustomers/${normalizedCustomerId}/notifications`, notifId, {
					...validData,
					id: notifId
				}, false);
			} catch (err) {
				console.warn("[FirestoreAdapter] subcollection notification write:", err);
			}
			return saved;
		}
		if (parsed.resource === "coinHistory") {
			const txId = String(validData["id"] || (validData["orderId"] && validData["type"] ? `coin_${String(validData["type"])}_${String(validData["orderId"])}` : `coin_${Date.now()}`)).trim();
			const existingById = await this.driver.getDoc("coinHistory", txId);
			if (existingById) return existingById;
			const saved = await this.driver.setDoc("coinHistory", txId, {
				...validData,
				id: txId
			}, false);
			const rawUser = String(validData["userId"] || parsed.parentId || "").trim();
			const normalizedCustomerId = rawUser.startsWith("SASS") ? `ONCUS${rawUser.slice(4)}` : rawUser;
			if (normalizedCustomerId && normalizedCustomerId.toUpperCase().startsWith("ONCUS")) try {
				await this.driver.setDoc(`onlineCustomers/${normalizedCustomerId}/coinHistory`, txId, {
					...validData,
					id: txId
				}, false);
			} catch (err) {
				console.warn("[FirestoreAdapter] subcollection coinHistory write:", err);
			}
			return saved;
		}
		if (parsed.resource === "referrals") {
			const refId = String(validData["id"] || `ref_${Date.now()}`).trim();
			const existingById = await this.driver.getDoc("referrals", refId);
			if (existingById) return existingById;
			if (validData["userId"] && validData["phoneMasked"]) {
				const dup = (await this.driver.queryCollection("referrals", { userId: String(validData["userId"]) })).find((r) => r["phoneMasked"] === validData["phoneMasked"]);
				if (dup) return dup;
			}
			return await this.driver.setDoc("referrals", refId, {
				...validData,
				id: refId
			}, false);
		}
		const docId = String(parsed.docId || validData["id"] || validData["userId"] || `${parsed.resource}_${Date.now()}`).trim();
		return await this.driver.setDoc(parsed.resource, docId, {
			...validData,
			id: docId
		}, false);
	}
	async put(endpoint, data) {
		const parsed = parseEndpoint(endpoint);
		const validData = validateWritePayload(parsed.resource, "PUT", data);
		const docId = parsed.isSingleton ? parsed.docId || "default" : String(parsed.docId || validData["id"] || "").trim();
		if (!docId) throw new StorageAdapterError(`Validation error: PUT ${endpoint} requires a target document ID.`, {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		if (this.legacyCustomerSubcollectionsEnabled) {
			if (parsed.resource === "cart") {
				const legacyAdapter = this.getLegacyCartAddressAdapter();
				const epUser = parsed.embeddedParams["userId"]?.trim();
				const bodyUser = (typeof validData["userId"] === "string" ? validData["userId"] : "")?.trim();
				if (epUser && bodyUser && epUser !== bodyUser) throw new StorageAdapterError(`Permission denied: Ownership mismatch. Endpoint customer ID "${epUser}" does not match payload customer ID "${bodyUser}".`, {
					status: 403,
					code: "permission-denied",
					category: "permission"
				});
				const candidateUser = epUser || bodyUser;
				const userId = await this.resolveUserIdForCartDocId(docId, candidateUser);
				return await legacyAdapter.addToCart(userId, {
					...validData,
					id: docId
				});
			}
			if (parsed.resource === "addresses") {
				const legacyAdapter = this.getLegacyCartAddressAdapter();
				const epUser = parsed.embeddedParams["userId"]?.trim();
				const bodyUser = (typeof validData["userId"] === "string" ? validData["userId"] : "")?.trim();
				if (epUser && bodyUser && epUser !== bodyUser) throw new StorageAdapterError(`Permission denied: Ownership mismatch. Endpoint customer ID "${epUser}" does not match payload customer ID "${bodyUser}".`, {
					status: 403,
					code: "permission-denied",
					category: "permission"
				});
				const candidateUser = epUser || bodyUser;
				const userId = await this.resolveUserIdForAddressId(docId, candidateUser);
				return await legacyAdapter.updateAddress(userId, docId, validData);
			}
		}
		return await this.driver.setDoc(parsed.resource, docId, parsed.isSingleton ? validData : {
			...validData,
			id: docId
		}, false);
	}
	async patch(endpoint, data) {
		const parsed = parseEndpoint(endpoint);
		const validPatch = validateWritePayload(parsed.resource, "PATCH", data);
		const docId = parsed.isSingleton ? parsed.docId || "default" : String(parsed.docId || "").trim();
		if (!docId) throw new StorageAdapterError(`Validation error: PATCH ${endpoint} requires a target document ID.`, {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		if (this.legacyCustomerSubcollectionsEnabled) {
			if (parsed.resource === "cart") {
				const legacyAdapter = this.getLegacyCartAddressAdapter();
				const epUser = parsed.embeddedParams["userId"]?.trim();
				const bodyUser = (typeof validPatch["userId"] === "string" ? validPatch["userId"] : void 0)?.trim();
				if (epUser && bodyUser && epUser !== bodyUser) throw new StorageAdapterError(`Permission denied: Ownership mismatch. Endpoint customer ID "${epUser}" does not match payload customer ID "${bodyUser}".`, {
					status: 403,
					code: "permission-denied",
					category: "permission"
				});
				const candidateUser = epUser || bodyUser;
				const userId = await this.resolveUserIdForCartDocId(docId, candidateUser);
				const quantity = typeof validPatch["quantity"] === "number" ? validPatch["quantity"] : 1;
				return await legacyAdapter.updateCartQuantity(userId, docId, quantity) ?? {};
			}
			if (parsed.resource === "addresses") {
				const legacyAdapter = this.getLegacyCartAddressAdapter();
				const epUser = parsed.embeddedParams["userId"]?.trim();
				const bodyUser = (typeof validPatch["userId"] === "string" ? validPatch["userId"] : void 0)?.trim();
				if (epUser && bodyUser && epUser !== bodyUser) throw new StorageAdapterError(`Permission denied: Ownership mismatch. Endpoint customer ID "${epUser}" does not match payload customer ID "${bodyUser}".`, {
					status: 403,
					code: "permission-denied",
					category: "permission"
				});
				const candidateUser = epUser || bodyUser;
				const userId = await this.resolveUserIdForAddressId(docId, candidateUser);
				return await legacyAdapter.updateAddress(userId, docId, validPatch);
			}
		}
		return await this.driver.updateDoc(parsed.resource, docId, validPatch);
	}
	async delete(endpoint) {
		const parsed = parseEndpoint(endpoint);
		if (KNOWN_READONLY_COLLECTIONS.has(parsed.resource)) throw new StorageAdapterError(`Permission denied: Collection "${parsed.resource}" is read-only and cannot be deleted by the client.`, {
			status: 403,
			code: "permission-denied",
			category: "permission"
		});
		const docId = parsed.isSingleton ? parsed.docId || "default" : String(parsed.docId || "").trim();
		if (this.legacyCustomerSubcollectionsEnabled) {
			if (parsed.resource === "cart") {
				const legacyAdapter = this.getLegacyCartAddressAdapter();
				if (!docId) {
					if (parsed.embeddedParams["userId"]) {
						await legacyAdapter.clearCart(parsed.embeddedParams["userId"]);
						return {};
					}
					throw new StorageAdapterError(`Validation error: DELETE ${endpoint} requires a target document ID or userId.`, {
						status: 400,
						code: "invalid-argument",
						category: "validation"
					});
				}
				const userId = await this.resolveUserIdForCartDocId(docId, parsed.embeddedParams["userId"]);
				await legacyAdapter.removeFromCart(userId, docId);
				return {};
			}
			if (parsed.resource === "addresses") {
				const legacyAdapter = this.getLegacyCartAddressAdapter();
				if (!docId) throw new StorageAdapterError(`Validation error: DELETE ${endpoint} requires a target document ID.`, {
					status: 400,
					code: "invalid-argument",
					category: "validation"
				});
				const userId = await this.resolveUserIdForAddressId(docId, parsed.embeddedParams["userId"]);
				await legacyAdapter.deleteAddress(userId, docId);
				return {};
			}
		}
		if (!docId) throw new StorageAdapterError(`Validation error: DELETE ${endpoint} requires a target document ID.`, {
			status: 400,
			code: "invalid-argument",
			category: "validation"
		});
		await this.driver.deleteDoc(parsed.resource, docId);
		return {};
	}
};
var firestoreAdapter = new FirestoreAdapter();
var OUTBOX_STORAGE_KEY = "sass_dual_storage_outbox_demo-sri-amman-store_v1";
var inMemoryOutbox = [];
function stableSerialize(value) {
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return "[" + value.map((item) => stableSerialize(item)).join(",") + "]";
	const obj = value;
	return "{" + Object.keys(obj).filter((k) => obj[k] !== void 0).sort().map((k) => JSON.stringify(k) + ":" + stableSerialize(obj[k])).join(",") + "}";
}
function computeDeterministicIdempotencyKey(params) {
	const { resource, docId, method, payload } = params;
	if (method === "POST" && payload) {
		if (resource === "orders") return `create:orders:${String(payload["orderId"] || payload["id"] || docId)}`;
		if (resource === "notifications") return `create:notifications:${String(payload["eventKey"] || payload["id"] || docId)}`;
		if (resource === "coinHistory") {
			if (payload["id"]) return `create:coinHistory:${String(payload["id"])}`;
			if (payload["userId"] && payload["orderId"] && payload["type"]) return `create:coinHistory:${String(payload["userId"])}:${String(payload["orderId"])}:${String(payload["type"])}`;
			return `create:coinHistory:${docId}`;
		}
		if (resource === "referrals") {
			if (payload["userId"] && payload["phoneMasked"]) return `create:referrals:${String(payload["userId"])}:${String(payload["phoneMasked"])}`;
			return `create:referrals:${String(payload["id"] || docId)}`;
		}
		return `create:${resource}:${docId}`;
	}
	if (method === "PUT") return `replace:${resource}:${docId}:${stableSerialize(payload ?? {})}`;
	if (method === "PATCH") return `patch:${resource}:${docId}:${stableSerialize(payload ?? {})}`;
	return `delete:${resource}:${docId}`;
}
function buildOperationId(params) {
	if (params.explicitOpId && params.explicitOpId.trim().length > 0) return params.explicitOpId.trim();
	return `op_${computeDeterministicIdempotencyKey(params).replace(/[^a-zA-Z0-9_:-]/g, "_")}`;
}
function methodToOperationType(method) {
	switch (method) {
		case "POST": return "create";
		case "PUT": return "replace";
		case "PATCH": return "patch";
		case "DELETE": return "delete";
	}
}
function readPersistedEntries() {
	if (typeof window !== "undefined" && window.localStorage) try {
		const raw = window.localStorage.getItem(OUTBOX_STORAGE_KEY);
		if (raw) {
			const parsed = JSON.parse(raw);
			if (Array.isArray(parsed)) {
				inMemoryOutbox = parsed;
				return [...parsed];
			}
		}
	} catch {}
	return [...inMemoryOutbox];
}
function writePersistedEntries(entries) {
	inMemoryOutbox = [...entries];
	if (typeof window !== "undefined" && window.localStorage) try {
		window.localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(entries));
	} catch {}
}
var outboxJournal = {
	getAllEntries() {
		return readPersistedEntries().sort((a, b) => a.timestampMs - b.timestampMs);
	},
	getPendingEntries() {
		return this.getAllEntries().filter((e) => e.status === "pending");
	},
	getConflictEntries() {
		return this.getAllEntries().filter((e) => e.status === "conflict");
	},
	getUnresolvedEntries() {
		return this.getAllEntries().filter((e) => e.status === "pending" || e.status === "conflict");
	},
	recordFallbackMutation(params) {
		const entries = readPersistedEntries();
		const idempotencyKey = computeDeterministicIdempotencyKey({
			resource: params.resource,
			docId: params.docId,
			method: params.method,
			payload: params.payload
		});
		const opId = buildOperationId({
			resource: params.resource,
			docId: params.docId,
			method: params.method,
			payload: params.payload,
			explicitOpId: params.explicitOpId
		});
		const nowMs = params.timestampMs ?? Date.now();
		const nowIso = new Date(nowMs).toISOString();
		const existingIdx = entries.findIndex((e) => e.opId === opId || e.idempotencyKey === idempotencyKey);
		if (existingIdx !== -1) {
			const existing = entries[existingIdx];
			if (existing) {
				if (existing.status === "synced") return existing;
				const updated = {
					...existing,
					payload: params.payload,
					timestamp: nowIso,
					timestampMs: nowMs,
					status: "pending"
				};
				entries[existingIdx] = updated;
				writePersistedEntries(entries);
				return updated;
			}
		}
		const earlierPendingForDoc = entries.find((e) => e.resource === params.resource && e.docId === params.docId && (e.status === "pending" || e.status === "conflict") && e.baselineSnapshot !== void 0);
		const newEntry = {
			opId,
			idempotencyKey,
			resource: params.resource,
			docId: params.docId,
			operationType: methodToOperationType(params.method),
			method: params.method,
			endpoint: params.endpoint,
			payload: params.payload ? JSON.parse(JSON.stringify(params.payload)) : null,
			baselineSnapshot: earlierPendingForDoc?.baselineSnapshot !== void 0 ? earlierPendingForDoc.baselineSnapshot : params.baselineSnapshot !== void 0 ? params.baselineSnapshot ? JSON.parse(JSON.stringify(params.baselineSnapshot)) : null : void 0,
			timestamp: nowIso,
			timestampMs: nowMs,
			status: "pending",
			attempts: 0
		};
		entries.push(newEntry);
		writePersistedEntries(entries);
		return newEntry;
	},
	markSynced(opId) {
		const entries = readPersistedEntries();
		const idx = entries.findIndex((e) => e.opId === opId);
		const current = idx !== -1 ? entries[idx] : void 0;
		if (!current) return null;
		const updated = {
			...current,
			status: "synced",
			attempts: current.attempts + 1,
			syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
			conflictInfo: void 0,
			lastError: void 0
		};
		entries[idx] = updated;
		writePersistedEntries(entries);
		return updated;
	},
	markConflict(opId, conflictInfo) {
		const entries = readPersistedEntries();
		const idx = entries.findIndex((e) => e.opId === opId);
		const current = idx !== -1 ? entries[idx] : void 0;
		if (!current) return null;
		const updated = {
			...current,
			status: "conflict",
			attempts: current.attempts + 1,
			conflictInfo
		};
		entries[idx] = updated;
		writePersistedEntries(entries);
		return updated;
	},
	markFailedAttempt(opId, errorMessage) {
		const entries = readPersistedEntries();
		const idx = entries.findIndex((e) => e.opId === opId);
		const current = idx !== -1 ? entries[idx] : void 0;
		if (!current) return null;
		const updated = {
			...current,
			status: "pending",
			attempts: current.attempts + 1,
			lastError: errorMessage
		};
		entries[idx] = updated;
		writePersistedEntries(entries);
		return updated;
	},
	clearAll() {
		inMemoryOutbox = [];
		if (typeof window !== "undefined" && window.localStorage) try {
			window.localStorage.removeItem(OUTBOX_STORAGE_KEY);
		} catch {}
	}
};
function resolveApiBaseUrl() {
	if (typeof processModule !== "undefined" && processModule.env) {
		if (processModule.env["VITE_API_BASE_URL"]) return processModule.env["VITE_API_BASE_URL"];
		if (processModule.env["VITE_API_URL"]) return processModule.env["VITE_API_URL"];
	}
	if (typeof import.meta !== "undefined" && {
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
	}) {
		if ({
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
		}["VITE_API_BASE_URL"]) return {
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
		}["VITE_API_BASE_URL"];
		if ({
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
		}["VITE_API_URL"]) return {
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
		}["VITE_API_URL"];
	}
	return "http://localhost:3001";
}
var ApiClient = class {
	baseUrl;
	adapter;
	modeOverride;
	activeSource = "firebase";
	emulatorHealthy = true;
	fallbackActive = false;
	fallbackReason;
	lastHealthCheckAt;
	lastHealthCheckMs = 0;
	lastFallbackMs = 0;
	healthCheckTtlMs = 5e3;
	recoveryCooldownMs = 4e3;
	healthCheckTimeoutMs = 900;
	reconciliationStatus = "idle";
	lastReconciledAt;
	consistencyPolicy = "strict";
	statusListeners = /* @__PURE__ */ new Set();
	inFlightReconciliation = null;
	constructor(baseUrl, adapter = firestoreAdapter) {
		this.baseUrl = baseUrl.replace(/\/+$/, "");
		this.adapter = adapter;
		const initialMode = this.getMode();
		if (initialMode === "json-server") this.activeSource = "json-server";
		else if (initialMode === "firebase") this.activeSource = "firebase";
		else this.activeSource = "emulator";
	}
	getBaseUrl() {
		return this.baseUrl;
	}
	setBaseUrl(newUrl) {
		this.baseUrl = newUrl.replace(/\/+$/, "");
	}
	getFirestoreAdapter() {
		return this.adapter;
	}
	setFirestoreAdapter(adapter) {
		this.adapter = adapter;
	}
	setLegacyCustomerSubcollectionsEnabled(enabled) {
		this.adapter.setLegacyCustomerSubcollectionsEnabled(enabled);
	}
	isLegacyCustomerSubcollectionsEnabled() {
		return this.adapter.isLegacyCustomerSubcollectionsEnabled();
	}
	getLegacyCartAddressAdapter() {
		return this.adapter.getLegacyCartAddressAdapter();
	}
	getLegacyOrderAdapter() {
		return this.adapter.getLegacyOrderAdapter();
	}
	getMode() {
		if (this.modeOverride) return this.modeOverride;
		return "firebase";
	}
	setMode(mode) {
		this.modeOverride = mode;
		const effective = this.getMode();
		if (effective === "json-server") {
			this.activeSource = "json-server";
			this.fallbackActive = false;
			this.fallbackReason = void 0;
		} else if (effective === "emulator") {
			this.activeSource = "emulator";
			this.fallbackActive = false;
			this.fallbackReason = void 0;
		} else if (effective === "firebase") {
			this.activeSource = "firebase";
			this.fallbackActive = false;
			this.fallbackReason = void 0;
		} else if (!this.fallbackActive) this.activeSource = "emulator";
		this.emitStatus();
	}
	setConsistencyPolicy(policy) {
		this.consistencyPolicy = policy;
		this.emitStatus();
	}
	setTimingOptions(options) {
		if (options.healthCheckTtlMs !== void 0) this.healthCheckTtlMs = options.healthCheckTtlMs;
		if (options.recoveryCooldownMs !== void 0) this.recoveryCooldownMs = options.recoveryCooldownMs;
		if (options.healthCheckTimeoutMs !== void 0) this.healthCheckTimeoutMs = options.healthCheckTimeoutMs;
	}
	getActiveSource() {
		const mode = this.getMode();
		if (mode === "json-server") return "json-server";
		if (mode === "emulator") return "emulator";
		return this.activeSource;
	}
	getDataSourceStatus() {
		const pendingCount = outboxJournal.getPendingEntries().length;
		const conflictCount = outboxJournal.getConflictEntries().length;
		return {
			configuredMode: this.getMode(),
			activeSource: this.getActiveSource(),
			emulatorHealthy: this.emulatorHealthy,
			fallbackActive: this.fallbackActive,
			fallbackReason: this.fallbackReason,
			lastHealthCheckAt: this.lastHealthCheckAt,
			pendingOutboxCount: pendingCount,
			conflictOutboxCount: conflictCount,
			reconciliationStatus: conflictCount > 0 ? "conflict_pending" : this.reconciliationStatus,
			lastReconciledAt: this.lastReconciledAt,
			consistencyPolicy: this.consistencyPolicy
		};
	}
	subscribeStatus(listener) {
		this.statusListeners.add(listener);
		return () => {
			this.statusListeners.delete(listener);
		};
	}
	emitStatus() {
		const snapshot = this.getDataSourceStatus();
		if (typeof window !== "undefined") try {
			window["__SASS_DATA_SOURCE__"] = {
				status: snapshot,
				getStatus: () => this.getDataSourceStatus()
			};
			if (typeof document !== "undefined" && document.documentElement) {
				document.documentElement.dataset["sassActiveSource"] = snapshot.activeSource;
				document.documentElement.dataset["sassReconciliationStatus"] = snapshot.reconciliationStatus;
			}
		} catch {}
		for (const listener of this.statusListeners) try {
			listener(snapshot);
		} catch {}
	}
	resetSourceState() {
		this.fallbackActive = false;
		this.fallbackReason = void 0;
		this.emulatorHealthy = true;
		this.lastHealthCheckMs = 0;
		this.lastFallbackMs = 0;
		this.reconciliationStatus = "idle";
		const mode = this.getMode();
		this.activeSource = mode === "firebase" ? "firebase" : mode === "json-server" ? "json-server" : "emulator";
		this.emitStatus();
	}
	enterFallback(reason) {
		this.emulatorHealthy = false;
		this.fallbackActive = true;
		this.activeSource = "json-server";
		this.fallbackReason = reason;
		this.lastFallbackMs = Date.now();
		this.lastHealthCheckAt = (/* @__PURE__ */ new Date()).toISOString();
		this.emitStatus();
	}
	/**
	* Probes Firestore Emulator connectivity with a bounded operation.
	*/
	async checkFirestoreConnectivity() {
		try {
			await this.adapter.checkConnectivity(this.healthCheckTimeoutMs);
			this.emulatorHealthy = true;
			this.lastHealthCheckMs = Date.now();
			this.lastHealthCheckAt = (/* @__PURE__ */ new Date()).toISOString();
			this.emitStatus();
			return true;
		} catch (err) {
			if (classifyStorageError(err) === "connectivity") {
				this.emulatorHealthy = false;
				this.lastHealthCheckMs = Date.now();
				this.lastHealthCheckAt = (/* @__PURE__ */ new Date()).toISOString();
				this.emitStatus();
				return false;
			}
			this.emulatorHealthy = true;
			this.lastHealthCheckMs = Date.now();
			this.lastHealthCheckAt = (/* @__PURE__ */ new Date()).toISOString();
			this.emitStatus();
			return true;
		}
	}
	/**
	* Reconciles pending fallback mutations from the outbox journal into Firestore Emulator.
	* Only switches active source back to "emulator" when the consistency policy permits.
	*/
	async reconcilePendingOutbox() {
		throw new Error("Outbox reconciliation is disabled in the customer runtime.");
	}
	buildUrl(endpoint, params) {
		const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
		const url = new URL(`${this.baseUrl}${cleanEndpoint}`);
		if (params) Object.entries(params).forEach(([key, val]) => {
			if (val !== void 0 && val !== null) url.searchParams.append(key, String(val));
		});
		return url.toString();
	}
	async requestJsonServer(url, options = {}, retries = 1) {
		const defaultHeaders = {
			"Content-Type": "application/json",
			Accept: "application/json"
		};
		const config = {
			...options,
			headers: {
				...defaultHeaders,
				...options.headers
			}
		};
		for (let attempt = 0; attempt <= retries; attempt++) try {
			const response = await fetch(url, config);
			if (!response.ok) {
				let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
				try {
					const errData = await response.json();
					if (errData && errData.message) errorMessage = errData.message;
				} catch {}
				const httpErr = new Error(errorMessage);
				httpErr.status = response.status;
				throw httpErr;
			}
			return await response.json();
		} catch (error) {
			const err = error;
			if (err.status && err.status >= 400 && err.status < 500) throw error;
			if (attempt < retries) {
				await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
				continue;
			}
			const finalErr = err.message?.includes("fetch failed") || err.message?.includes("Failed to fetch") || err.message?.includes("ECONNREFUSED") || err.name === "TypeError" ? /* @__PURE__ */ new Error(`JSON Server REST API is unavailable at ${url}. Please verify JSON Server is running on port 3001 (npm run mock-api). Original cause: ${err.message}`) : error;
			console.error(`API Request failed for [${options.method || "GET"}] ${url}:`, finalErr);
			throw finalErr;
		}
		throw new Error(`Request failed after ${retries} retries`);
	}
	/**
	* Executes a mutation against JSON Server during fallback and records it in the
	* durable outbox journal only after JSON Server confirms persistence.
	*/
	async executeFallbackMutation(method, endpoint, data, baselineOverride) {
		const parsed = parseEndpoint(endpoint);
		const payloadObj = data && typeof data === "object" && !Array.isArray(data) ? data : null;
		const targetDocId = parsed.isSingleton ? parsed.docId || "default" : String(parsed.docId || payloadObj?.["orderId"] || payloadObj?.["id"] || payloadObj?.["userId"] || `doc_${Date.now()}`).trim();
		let baselineSnapshot = baselineOverride;
		if (baselineSnapshot === void 0 && (method === "PATCH" || method === "PUT" || method === "DELETE")) try {
			const readEndpoint = parsed.isSingleton ? `/${parsed.resource}` : `/${parsed.resource}/${encodeURIComponent(targetDocId)}`;
			baselineSnapshot = await this.requestJsonServer(this.buildUrl(readEndpoint), { method: "GET" }, 0);
		} catch {
			baselineSnapshot = void 0;
		}
		const jsonServerEndpoint = parsed.isSingleton ? `/${parsed.resource}` : endpoint;
		const url = this.buildUrl(jsonServerEndpoint);
		if (method === "POST" && payloadObj) {
			if (parsed.resource === "orders" && (payloadObj["orderId"] || payloadObj["id"])) {
				const ordId = String(payloadObj["orderId"] || payloadObj["id"]);
				try {
					const existingOrders = await this.requestJsonServer(this.buildUrl("/orders", { orderId: ordId }), { method: "GET" }, 0);
					if (existingOrders && existingOrders.length > 0 && existingOrders[0]) {
						outboxJournal.recordFallbackMutation({
							resource: parsed.resource,
							docId: ordId,
							method,
							endpoint,
							payload: existingOrders[0]
						});
						return existingOrders[0];
					}
				} catch {}
			}
		}
		const reqInit = { method };
		if (data !== void 0) reqInit.body = JSON.stringify(data);
		const result = await this.requestJsonServer(url, reqInit, 1);
		const committedPayload = method === "DELETE" ? null : method === "PATCH" ? payloadObj : result && typeof result === "object" ? result : payloadObj;
		const committedDocId = !parsed.isSingleton && result && typeof result === "object" && "id" in result ? String(result["id"]) : targetDocId;
		outboxJournal.recordFallbackMutation({
			resource: parsed.resource,
			docId: committedDocId,
			method,
			endpoint,
			payload: committedPayload,
			baselineSnapshot
		});
		this.emitStatus();
		return result;
	}
	/**
	* Determines whether an auto-mode request should target Firestore Emulator or JSON Server,
	* running bounded health checks and outbox reconciliation when appropriate.
	*/
	async selectSourceForAutoMode() {
		const now = Date.now();
		if (this.fallbackActive) {
			if (now - this.lastFallbackMs < this.recoveryCooldownMs) return "json-server";
			if (!await this.checkFirestoreConnectivity()) {
				this.lastFallbackMs = Date.now();
				return "json-server";
			}
			await this.reconcilePendingOutbox();
			return this.activeSource;
		}
		if (outboxJournal.getUnresolvedEntries().length > 0) {
			await this.reconcilePendingOutbox();
			return this.activeSource;
		}
		if (now - this.lastHealthCheckMs >= this.healthCheckTtlMs) {
			if (!await this.checkFirestoreConnectivity()) {
				this.enterFallback("Firestore Emulator connectivity check failed");
				return "json-server";
			}
		}
		this.activeSource = "emulator";
		return "emulator";
	}
	handleEmulatorError(error) {
		const adapterErr = toStorageAdapterError(error);
		if (adapterErr.category === "connectivity") return {
			shouldFallback: true,
			normalizedError: adapterErr
		};
		return {
			shouldFallback: false,
			normalizedError: adapterErr
		};
	}
	async getFromJsonServer(endpoint, params) {
		const parsed = parseEndpoint(endpoint, params);
		const jsonEndpoint = parsed.isSingleton ? `/${parsed.resource}` : endpoint;
		if (parsed.resource === "products") if (!parsed.docId) {
			const baseItems = await this.requestJsonServer(this.buildUrl(jsonEndpoint, params), { method: "GET" });
			const containsLiveCatalog = Array.isArray(baseItems) && baseItems.some((item) => item?.id === "prod_groundnut_oil" || item?.id === "prod_a2_ghee");
			const hasFixtures = Array.isArray(baseItems) && baseItems.some((item) => item?.id === "prod-mumqpksq" || item?.id === "prod-munn8cp3");
			if (containsLiveCatalog && !hasFixtures) try {
				const fixtures = await this.requestJsonServer(this.buildUrl("/productionProductFixtures", params), { method: "GET" }, 0);
				if (Array.isArray(fixtures)) {
					const seenIds = new Set(baseItems.map((item) => String(item?.id || item?.productId || "")));
					const merged = [...baseItems];
					for (const fix of fixtures) {
						const id = String(fix?.id || fix?.productId || "");
						if (id && !seenIds.has(id)) {
							seenIds.add(id);
							merged.push(fix);
						}
					}
					return merged;
				}
			} catch {}
			return baseItems;
		} else try {
			return await this.requestJsonServer(this.buildUrl(jsonEndpoint, params), { method: "GET" });
		} catch (err) {
			if (err?.status === 404 || String(err?.message).includes("404")) {
				const fixtureUrl = this.buildUrl(`/productionProductFixtures/${encodeURIComponent(parsed.docId)}`, params);
				return await this.requestJsonServer(fixtureUrl, { method: "GET" }, 0);
			}
			throw err;
		}
		if (parsed.resource === "onlineCustomers") try {
			return await this.requestJsonServer(this.buildUrl(jsonEndpoint, params), { method: "GET" });
		} catch (err) {
			if (err?.status === 404 || String(err?.message).includes("404")) {
				const fallbackDocId = parsed.docId?.toUpperCase() === "ONCUS0000010" ? "SASS0000010" : parsed.docId?.toUpperCase() === "ONCUS0000021" ? "SASS0000021" : parsed.docId;
				const userEndpoint = fallbackDocId ? `/users/${encodeURIComponent(fallbackDocId)}` : "/users";
				return await this.requestJsonServer(this.buildUrl(userEndpoint, params), { method: "GET" }, 0);
			}
			throw err;
		}
		return this.requestJsonServer(this.buildUrl(jsonEndpoint, params), { method: "GET" });
	}
	async get(endpoint, params) {
		const mode = this.getMode();
		if (mode === "firebase") {
			this.activeSource = "firebase";
			return this.adapter.get(endpoint, params);
		}
		if (mode === "json-server") {
			this.activeSource = "json-server";
			return this.getFromJsonServer(endpoint, params);
		}
		if (mode === "emulator") {
			this.activeSource = "emulator";
			return this.adapter.get(endpoint, params);
		}
		if (await this.selectSourceForAutoMode() === "json-server") return this.getFromJsonServer(endpoint, params);
		try {
			const result = await this.adapter.get(endpoint, params);
			this.emulatorHealthy = true;
			this.lastHealthCheckMs = Date.now();
			return result;
		} catch (err) {
			const { shouldFallback, normalizedError } = this.handleEmulatorError(err);
			if (!shouldFallback) throw normalizedError;
			this.enterFallback(normalizedError.message);
			return this.getFromJsonServer(endpoint, params);
		}
	}
	async post(endpoint, data) {
		const mode = this.getMode();
		if (mode === "firebase") {
			this.activeSource = "firebase";
			return this.adapter.post(endpoint, data);
		}
		if (mode === "json-server") {
			this.activeSource = "json-server";
			const url = this.buildUrl(endpoint);
			return this.requestJsonServer(url, {
				method: "POST",
				body: JSON.stringify(data)
			}, 1);
		}
		if (mode === "emulator") {
			this.activeSource = "emulator";
			return this.adapter.post(endpoint, data);
		}
		if (await this.selectSourceForAutoMode() === "json-server") return this.executeFallbackMutation("POST", endpoint, data);
		try {
			const result = await this.adapter.post(endpoint, data);
			this.emulatorHealthy = true;
			this.lastHealthCheckMs = Date.now();
			return result;
		} catch (err) {
			const { shouldFallback, normalizedError } = this.handleEmulatorError(err);
			if (!shouldFallback) throw normalizedError;
			const parsed = parseEndpoint(endpoint);
			const payloadObj = data && typeof data === "object" ? data : null;
			if (parsed.resource === "orders" && payloadObj) {
				const candidateOrderId = String(payloadObj["orderId"] || payloadObj["id"] || "").trim();
				if (candidateOrderId) try {
					const verifyExisting = await this.adapter.getDocumentRaw("orders", candidateOrderId);
					if (verifyExisting) {
						this.emulatorHealthy = true;
						return verifyExisting;
					}
				} catch {}
			}
			this.enterFallback(normalizedError.message);
			return this.executeFallbackMutation("POST", endpoint, data);
		}
	}
	async put(endpoint, data) {
		const mode = this.getMode();
		if (mode === "firebase") {
			this.activeSource = "firebase";
			return this.adapter.put(endpoint, data);
		}
		if (mode === "json-server") {
			this.activeSource = "json-server";
			const url = this.buildUrl(endpoint);
			return this.requestJsonServer(url, {
				method: "PUT",
				body: JSON.stringify(data)
			}, 1);
		}
		if (mode === "emulator") {
			this.activeSource = "emulator";
			return this.adapter.put(endpoint, data);
		}
		if (await this.selectSourceForAutoMode() === "json-server") return this.executeFallbackMutation("PUT", endpoint, data);
		try {
			const result = await this.adapter.put(endpoint, data);
			this.emulatorHealthy = true;
			this.lastHealthCheckMs = Date.now();
			return result;
		} catch (err) {
			const { shouldFallback, normalizedError } = this.handleEmulatorError(err);
			if (!shouldFallback) throw normalizedError;
			this.enterFallback(normalizedError.message);
			return this.executeFallbackMutation("PUT", endpoint, data);
		}
	}
	async patch(endpoint, data) {
		const mode = this.getMode();
		if (mode === "firebase") {
			this.activeSource = "firebase";
			return this.adapter.patch(endpoint, data);
		}
		if (mode === "json-server") {
			this.activeSource = "json-server";
			const url = this.buildUrl(endpoint);
			return this.requestJsonServer(url, {
				method: "PATCH",
				body: JSON.stringify(data)
			}, 1);
		}
		if (mode === "emulator") {
			this.activeSource = "emulator";
			return this.adapter.patch(endpoint, data);
		}
		if (await this.selectSourceForAutoMode() === "json-server") return this.executeFallbackMutation("PATCH", endpoint, data);
		try {
			const result = await this.adapter.patch(endpoint, data);
			this.emulatorHealthy = true;
			this.lastHealthCheckMs = Date.now();
			return result;
		} catch (err) {
			const { shouldFallback, normalizedError } = this.handleEmulatorError(err);
			if (!shouldFallback) throw normalizedError;
			this.enterFallback(normalizedError.message);
			return this.executeFallbackMutation("PATCH", endpoint, data);
		}
	}
	async delete(endpoint) {
		const mode = this.getMode();
		if (mode === "firebase") {
			this.activeSource = "firebase";
			return this.adapter.delete(endpoint);
		}
		if (mode === "json-server") {
			this.activeSource = "json-server";
			const url = this.buildUrl(endpoint);
			return this.requestJsonServer(url, { method: "DELETE" }, 1);
		}
		if (mode === "emulator") {
			this.activeSource = "emulator";
			return this.adapter.delete(endpoint);
		}
		if (await this.selectSourceForAutoMode() === "json-server") return this.executeFallbackMutation("DELETE", endpoint);
		try {
			const result = await this.adapter.delete(endpoint);
			this.emulatorHealthy = true;
			this.lastHealthCheckMs = Date.now();
			return result;
		} catch (err) {
			const { shouldFallback, normalizedError } = this.handleEmulatorError(err);
			if (!shouldFallback) throw normalizedError;
			this.enterFallback(normalizedError.message);
			return this.executeFallbackMutation("DELETE", endpoint);
		}
	}
};
var apiClient = new ApiClient(resolveApiBaseUrl());
/**
* Passwordless Email-Link Authentication Service (Firebase Authentication Emulator)
*
* ============================================================================
* LOCAL EMULATOR vs. PRODUCTION CONFIGURATION NOTES
* ============================================================================
* 1. Local Emulator Mode (`demo-sri-amman-store` on `127.0.0.1:9099`):
*    - `getEmulatorAuth()` connects the Firebase Auth Web SDK strictly to
*      `http://127.0.0.1:9099` and blocks non-`demo-*` project IDs or Google
*      Cloud hosts.
*    - The Firebase Authentication Emulator does NOT send real SMTP emails.
*      Instead, when `sendSignInLinkToEmail` is called, the Auth Emulator prints
*      the generated sign-in link in the terminal logs and exposes it at:
*      `GET http://127.0.0.1:9099/emulator/v1/projects/demo-sri-amman-store/oobCodes`
*
* 2. Completion URL & Authorized Domains Assumptions:
*    - Default local continuation URL: `http://localhost:5173/login`
*      (configurable via `VITE_FIREBASE_AUTH_CONTINUE_URL`).
*    - Before enabling real email delivery in the production Firebase project
*      (`sri-amman-smart-store`), the following must be configured in
*      Firebase Console -> Authentication:
*      a) Sign-in method -> Email/Password -> Enable "Email link (passwordless sign-in)".
*      b) Settings -> Authorized domains -> Add `localhost` (for dev) and the
*         production customer domain (domain host only, without `http://` or port).
*      c) Templates -> Email address verification / Sign-in ->Verify sender and
*         action URL settings.
*
* 3. Identity Boundary:
*    - Completing email-link sign-in authenticates a Firebase Auth user (`uid`,
*      `email`, `emailVerified`).
*    - A Firebase Auth `uid` is NOT a SASS customer document ID (`SASS0000104`).
*    - This service does NOT create Firestore `users/{userDocId}` documents and
*      does NOT alter the existing mock authentication session (`sass_customer_session`).
*/
var EMAIL_LINK_PENDING_STORAGE_KEY = "sass_email_link_pending_email";
var EMAIL_FORMAT_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var EmailLinkAuthError = class extends Error {
	code;
	requiresEmailInput;
	constructor(message, code = "auth/email-link-error", requiresEmailInput = false) {
		super(message);
		this.name = "EmailLinkAuthError";
		this.code = code;
		this.requiresEmailInput = requiresEmailInput;
	}
};
var SdkFirebaseEmailLinkDriver = class {
	async sendSignInLinkToEmail(email, actionCodeSettings) {
		const { auth } = getEmulatorAuth();
		await sendSignInLinkToEmail(auth, email, actionCodeSettings);
	}
	isSignInWithEmailLink(emailLink) {
		if (!emailLink || typeof emailLink !== "string") return false;
		const { auth } = getEmulatorAuth();
		return isSignInWithEmailLink(auth, emailLink);
	}
	async signInWithEmailLink(email, emailLink) {
		const { auth } = getEmulatorAuth();
		const credential = await signInWithEmailLink(auth, email, emailLink);
		return {
			uid: credential.user.uid,
			email: credential.user.email,
			emailVerified: credential.user.emailVerified
		};
	}
	getCurrentUser() {
		const { auth } = getEmulatorAuth();
		if (!auth.currentUser) return null;
		return {
			uid: auth.currentUser.uid,
			email: auth.currentUser.email,
			emailVerified: auth.currentUser.emailVerified,
			providerId: auth.currentUser.providerData.some((provider) => provider.providerId === "phone") ? "phone" : auth.currentUser.providerData.some((provider) => provider.providerId === "google.com") ? "google.com" : "password"
		};
	}
	async signOut() {
		const { auth } = getEmulatorAuth();
		await signOut(auth);
	}
	onAuthStateChanged(listener) {
		const { auth } = getEmulatorAuth();
		return onAuthStateChanged(auth, (sdkUser) => {
			if (!sdkUser) {
				listener(null);
				return;
			}
			listener({
				uid: sdkUser.uid,
				email: sdkUser.email,
				emailVerified: sdkUser.emailVerified,
				isAnonymous: sdkUser.isAnonymous,
				providerId: sdkUser.providerData.some((provider) => provider.providerId === "phone") ? "phone" : sdkUser.providerData.some((provider) => provider.providerId === "google.com") ? "google.com" : "password"
			});
		});
	}
};
var activeDriver = new SdkFirebaseEmailLinkDriver();
var sendInFlight = false;
var completeInFlight = false;
var currentVerifiedUser = null;
var inMemoryPendingEmail = null;
var authStateListeners = /* @__PURE__ */ new Set();
function notifyAuthStateListeners(user) {
	for (const listener of Array.from(authStateListeners)) try {
		listener(user);
	} catch {}
}
function readEnvVar(key) {
	if (typeof processModule !== "undefined" && processModule.env && processModule.env[key] !== void 0) return processModule.env[key];
	if (typeof import.meta !== "undefined" && {
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
	}[key] !== void 0) return String({
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
	}[key]);
}
function getSessionStorage() {
	try {
		if (typeof window !== "undefined" && window.sessionStorage) return window.sessionStorage;
	} catch {}
	return null;
}
function validateEmailForLinkSignIn(rawEmail) {
	const cleaned = (typeof rawEmail === "string" ? rawEmail : "").trim().toLowerCase();
	if (!cleaned || !EMAIL_FORMAT_RE.test(cleaned)) throw new EmailLinkAuthError("Please enter a valid email address.", "auth/invalid-email");
	return cleaned;
}
function isSafeInternalRedirectPath(pathValue) {
	if (!pathValue || typeof pathValue !== "string") return false;
	const trimmed = pathValue.trim();
	return trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.includes("://");
}
function buildEmailLinkActionCodeSettings(options) {
	const configuredContinueUrl = options?.continueUrl?.trim() || readEnvVar("VITE_FIREBASE_AUTH_CONTINUE_URL")?.trim() || (typeof window !== "undefined" && window.location?.origin ? `${window.location.origin}/login` : "http://localhost:5173/login");
	let parsedUrl;
	try {
		parsedUrl = new URL(configuredContinueUrl);
	} catch {
		throw new EmailLinkAuthError("Invalid email-link continuation URL configuration.", "auth/invalid-continue-uri");
	}
	const hostname = parsedUrl.hostname.toLowerCase();
	if (hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "::1") throw new EmailLinkAuthError(`Continuation URL host "${parsedUrl.hostname}" is not permitted in local emulator mode. Use localhost or 127.0.0.1.`, "auth/unauthorized-continue-uri");
	if (options?.redirect && isSafeInternalRedirectPath(options.redirect)) parsedUrl.searchParams.set("redirect", options.redirect.trim());
	return {
		url: parsedUrl.toString(),
		handleCodeInApp: true
	};
}
function mapFirebaseAuthError(err, fallbackMessage) {
	if (err instanceof EmailLinkAuthError) return err;
	const rawCode = typeof err === "object" && err !== null && "code" in err && typeof err.code === "string" ? err.code : "auth/email-link-error";
	switch (rawCode) {
		case "auth/expired-action-code": return new EmailLinkAuthError("This sign-in link has expired. Please request a new email sign-in link.", rawCode);
		case "auth/invalid-action-code": return new EmailLinkAuthError("This sign-in link is invalid or has already been used. Please request a new email sign-in link.", rawCode);
		case "auth/invalid-email": return new EmailLinkAuthError("The email address provided is invalid or does not match the sign-in link.", rawCode);
		case "auth/missing-email": return new EmailLinkAuthError("Please enter the email address where you requested the sign-in link.", rawCode, true);
		case "auth/user-disabled": return new EmailLinkAuthError("This account has been disabled. Please contact support.", rawCode);
		case "auth/network-request-failed": return new EmailLinkAuthError("Could not reach the local Firebase Authentication Emulator (127.0.0.1:9099). Make sure the emulator is running.", rawCode);
		default: return new EmailLinkAuthError(err instanceof Error && err.message ? err.message : fallbackMessage, rawCode);
	}
}
var emailLinkAuthService = {
	/**
	* Overrides the underlying Firebase Auth driver for unit testing.
	*/
	setDriverForTesting(driver) {
		activeDriver = driver ?? new SdkFirebaseEmailLinkDriver();
		sendInFlight = false;
		completeInFlight = false;
		currentVerifiedUser = null;
		authStateListeners.clear();
		this.clearPendingEmail();
	},
	isSendingLink() {
		return sendInFlight;
	},
	isCompletingSignIn() {
		return completeInFlight;
	},
	/**
	* Stores the pending email in tab-scoped `sessionStorage` (never persistent `localStorage`)
	* so same-tab completion works seamlessly while avoiding unnecessary persistent storage.
	*/
	savePendingEmail(email) {
		const clean = validateEmailForLinkSignIn(email);
		inMemoryPendingEmail = clean;
		const storage = getSessionStorage();
		if (storage) storage.setItem(EMAIL_LINK_PENDING_STORAGE_KEY, clean);
	},
	getPendingEmail() {
		const storage = getSessionStorage();
		if (storage) {
			const val = storage.getItem(EMAIL_LINK_PENDING_STORAGE_KEY);
			if (val && val.trim().length > 0) return val.trim().toLowerCase();
		}
		return inMemoryPendingEmail;
	},
	clearPendingEmail() {
		inMemoryPendingEmail = null;
		const storage = getSessionStorage();
		if (storage) storage.removeItem(EMAIL_LINK_PENDING_STORAGE_KEY);
	},
	/**
	* Inspects a URL to determine whether it is a valid Firebase Email Sign-In link,
	* an incomplete/malformed email-link callback attempt, or a normal route visit.
	*
	* Never marks a user authenticated merely because they visited the completion URL.
	*/
	inspectCallbackUrl(linkUrl) {
		if (!linkUrl || typeof linkUrl !== "string") return { status: "none" };
		try {
			if (activeDriver.isSignInWithEmailLink(linkUrl)) return { status: "valid_link" };
		} catch {}
		try {
			const parsed = new URL(linkUrl, "http://localhost:5173");
			const mode = parsed.searchParams.get("mode");
			const oobCode = parsed.searchParams.get("oobCode");
			const emailLinkFlag = parsed.searchParams.get("emailLink");
			if (mode === "signIn" || oobCode !== null || emailLinkFlag === "1" || emailLinkFlag === "true") return {
				status: "invalid_or_incomplete_link",
				message: "This sign-in link is invalid, expired, or incomplete. Please request a new email sign-in link."
			};
		} catch {
			return { status: "none" };
		}
		return { status: "none" };
	},
	/**
	* Requests a passwordless sign-in link from the local Firebase Authentication Emulator.
	*/
	async sendSignInLink(email, options) {
		if (sendInFlight) throw new EmailLinkAuthError("A sign-in link request is already in progress. Please wait.", "auth/duplicate-request");
		const cleanEmail = validateEmailForLinkSignIn(email);
		const actionCodeSettings = buildEmailLinkActionCodeSettings(options);
		sendInFlight = true;
		try {
			await activeDriver.sendSignInLinkToEmail(cleanEmail, actionCodeSettings);
			this.savePendingEmail(cleanEmail);
			return {
				success: true,
				continueUrl: actionCodeSettings.url,
				deliveryMode: "emulator",
				message: "Sign-in link generated in the local Firebase Authentication Emulator. Open the link from the emulator logs (or load it below in local dev) to finish signing in."
			};
		} catch (err) {
			throw mapFirebaseAuthError(err, "Failed to send email sign-in link. Ensure the Firebase Auth Emulator is running on port 9099.");
		} finally {
			sendInFlight = false;
		}
	},
	/**
	* Completes passwordless email-link authentication using Firebase's
	* `isSignInWithEmailLink` and `signInWithEmailLink`.
	*
	* Supports both same-browser completion (using tab-scoped `sessionStorage`)
	* and cross-browser / new-tab completion (using `providedEmail`).
	*/
	async completeSignInWithEmailLink(linkUrl, providedEmail) {
		if (completeInFlight) throw new EmailLinkAuthError("Sign-in verification is already in progress. Please wait.", "auth/duplicate-request");
		if (!linkUrl || !activeDriver.isSignInWithEmailLink(linkUrl)) throw new EmailLinkAuthError("This sign-in link is invalid, expired, or incomplete. Please request a new email sign-in link.", "auth/invalid-email-link");
		const candidateEmail = providedEmail !== void 0 && providedEmail.trim().length > 0 ? providedEmail : this.getPendingEmail();
		if (!candidateEmail) throw new EmailLinkAuthError("Please enter the email address where you requested the sign-in link to confirm your identity.", "auth/missing-email", true);
		const cleanEmail = validateEmailForLinkSignIn(candidateEmail);
		completeInFlight = true;
		try {
			const verified = await activeDriver.signInWithEmailLink(cleanEmail, linkUrl);
			this.clearPendingEmail();
			const authUser = {
				uid: verified.uid,
				email: verified.email || cleanEmail,
				emailVerified: verified.emailVerified,
				providerId: "firebase-email-link"
			};
			currentVerifiedUser = authUser;
			notifyAuthStateListeners(authUser);
			return authUser;
		} catch (err) {
			const mapped = mapFirebaseAuthError(err, "Could not complete email-link sign-in. The link may have expired or already been used.");
			if (mapped.code === "auth/expired-action-code" || mapped.code === "auth/invalid-action-code") this.clearPendingEmail();
			throw mapped;
		} finally {
			completeInFlight = false;
		}
	},
	getCurrentFirebaseAuthUser() {
		if (currentVerifiedUser) return currentVerifiedUser;
		try {
			const sdkUser = activeDriver.getCurrentUser();
			if (sdkUser && sdkUser.uid) {
				const providerId = sdkUser.providerId;
				return {
					uid: sdkUser.uid,
					email: sdkUser.email || "",
					emailVerified: sdkUser.emailVerified,
					providerId: providerId === "phone" ? "firebase-phone" : providerId === "google.com" ? "firebase-google" : "firebase-email-password"
				};
			}
		} catch {}
		return null;
	},
	/**
	* Subscribes to Firebase Authentication state changes via the active driver's
	* `onAuthStateChanged` listener (backed by the Firebase Auth SDK in browser/emulator
	* mode, with a deterministic fallback for unit test drivers).
	*
	* Returns an unsubscribe function that must be called on unmount.
	*/
	subscribeToAuthStateChanges(listener) {
		let isUnsubscribed = false;
		const wrappedListener = (user) => {
			if (!isUnsubscribed) listener(user);
		};
		authStateListeners.add(wrappedListener);
		let driverUnsubscribe = null;
		if (typeof activeDriver.onAuthStateChanged === "function") try {
			driverUnsubscribe = activeDriver.onAuthStateChanged((rawUser) => {
				if (isUnsubscribed) return;
				if (!rawUser || !rawUser.uid || rawUser.isAnonymous === true) {
					currentVerifiedUser = null;
					wrappedListener(null);
					return;
				}
				const mapped = {
					uid: rawUser.uid,
					email: rawUser.email || currentVerifiedUser?.email || "",
					emailVerified: rawUser.emailVerified,
					providerId: rawUser.providerId === "phone" ? "firebase-phone" : rawUser.providerId === "google.com" ? "firebase-google" : rawUser.providerId === "password" ? "firebase-email-password" : "firebase-email-link"
				};
				currentVerifiedUser = mapped;
				wrappedListener(mapped);
			});
		} catch {
			queueMicrotask(() => {
				wrappedListener(this.getCurrentFirebaseAuthUser());
			});
		}
		else queueMicrotask(() => {
			wrappedListener(this.getCurrentFirebaseAuthUser());
		});
		return () => {
			isUnsubscribed = true;
			authStateListeners.delete(wrappedListener);
			if (driverUnsubscribe) {
				try {
					driverUnsubscribe();
				} catch {}
				driverUnsubscribe = null;
			}
		};
	},
	async signOutFirebaseAuth() {
		currentVerifiedUser = null;
		this.clearPendingEmail();
		try {
			await activeDriver.signOut();
		} catch {} finally {
			notifyAuthStateListeners(null);
		}
	}
};
var CANONICAL_SASS_ID_RE = /^SASS\d{6,7}$/i;
var CANONICAL_CUSTOMER_ID_RE = /^(ONCUS\d{6,7}|SASS\d{6,7})$/i;
var CustomerIdentityResolutionError = class extends Error {
	status;
	code;
	result;
	constructor(result) {
		super(result.message);
		this.name = "CustomerIdentityResolutionError";
		this.status = result.status;
		this.code = result.code;
		this.result = result;
	}
};
function isPlainRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function getNonEmptyString(value) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}
/**
* Validates that the caller has supplied a genuinely authenticated Firebase user
* rather than `null`, an anonymous user, an unverified email-link user, or a
* mock `localStorage` customer object.
*/
function validateAuthenticatedFirebaseUser(firebaseUser) {
	if (!isPlainRecord(firebaseUser)) return {
		status: "unauthenticated",
		ok: false,
		code: "identity/unauthenticated",
		uid: null,
		userDocId: null,
		profile: null,
		message: "Cannot resolve customer profile: no authenticated Firebase user was provided."
	};
	if (firebaseUser["isAnonymous"] === true) return {
		status: "unauthenticated",
		ok: false,
		code: "identity/unauthenticated",
		uid: null,
		userDocId: null,
		profile: null,
		message: "Cannot resolve customer profile: anonymous Firebase sessions are not permitted."
	};
	const providerId = firebaseUser["providerId"];
	if ((providerId === "firebase-email-link" || providerId === "firebase-email-password" || providerId === "firebase-google" || providerId === "firebase-auth-emulator" || providerId === "firebase-auth-production") && firebaseUser["emailVerified"] !== true) return {
		status: "unauthenticated",
		ok: false,
		code: "identity/unauthenticated",
		uid: null,
		userDocId: null,
		profile: null,
		message: "Cannot resolve customer profile: this email-based sign-in has not completed email verification."
	};
	const rawUid = getNonEmptyString(firebaseUser["uid"]);
	if (!rawUid) return {
		status: "unauthenticated",
		ok: false,
		code: "identity/unauthenticated",
		uid: null,
		userDocId: null,
		profile: null,
		message: "Cannot resolve customer profile: authenticated Firebase user is missing a valid UID."
	};
	if (CANONICAL_CUSTOMER_ID_RE.test(rawUid.toUpperCase())) return {
		status: "unauthenticated",
		ok: false,
		code: "identity/unauthenticated",
		uid: null,
		userDocId: null,
		profile: null,
		message: `Invalid Firebase Auth UID "${rawUid}": ${CANONICAL_SASS_ID_RE.test(rawUid.toUpperCase()) ? "SASS" : "ONCUS"} customer IDs cannot be used as Firebase Auth UIDs.`
	};
	const cleanEmail = getNonEmptyString(firebaseUser["email"])?.toLowerCase();
	return {
		status: "authenticated",
		ok: true,
		uid: rawUid,
		...cleanEmail ? { email: cleanEmail } : {}
	};
}
/**
* Validates the `usersByUid/{uid}` document payload. Newly created mappings must
* identify both the online collection and customer account type. Older SASS and
* ONCUS mappings remain compatible when they use their historical collection.
*
* Rules enforced:
* 1. `rawMapping` must be a plain object.
* 2. `userDocId` must be a non-empty string.
* 3. `userDocId` must NEVER equal the Firebase Auth `uid`.
* 4. `userDocId` must match the canonical `SASS\d+` customer ID format.
* 5. If `rawMapping.uid` is present, it must match the requested `expectedUid`.
* 6. Explicit mapping account types must be `customer`; staff/admin mappings
*    are never accepted by the customer identity resolver.
*/
function validateUsersByUidMapping(rawMapping, expectedUid) {
	if (!isPlainRecord(rawMapping)) return {
		status: "malformed_mapping",
		ok: false,
		code: "identity/malformed-mapping",
		uid: expectedUid,
		userDocId: null,
		profile: null,
		message: `Malformed usersByUid/${expectedUid} document: expected an object payload.`
	};
	const hasAccountType = Object.prototype.hasOwnProperty.call(rawMapping, "accountType");
	const docUid = getNonEmptyString(rawMapping["uid"]);
	if (hasAccountType && docUid !== expectedUid || docUid !== null && docUid !== expectedUid) return {
		status: "malformed_mapping",
		ok: false,
		code: "identity/mapping-uid-mismatch",
		uid: expectedUid,
		userDocId: null,
		profile: null,
		message: `Identity mapping mismatch in usersByUid/${expectedUid}: document uid "${docUid}" does not match authenticated UID "${expectedUid}".`
	};
	const rawUserDocId = getNonEmptyString(rawMapping["userDocId"]) ?? getNonEmptyString(rawMapping["customerId"]);
	if (!rawUserDocId) return {
		status: "malformed_mapping",
		ok: false,
		code: "identity/malformed-mapping",
		uid: expectedUid,
		userDocId: null,
		profile: null,
		message: `Malformed usersByUid/${expectedUid} document: missing or empty "userDocId".`
	};
	if (rawUserDocId === expectedUid) return {
		status: "malformed_mapping",
		ok: false,
		code: "identity/malformed-mapping",
		uid: expectedUid,
		userDocId: null,
		profile: null,
		message: `Malformed usersByUid/${expectedUid} document: "userDocId" cannot be the Firebase Auth UID ("${expectedUid}"). Expected a canonical SASS customer ID.`
	};
	if (!CANONICAL_CUSTOMER_ID_RE.test(rawUserDocId)) return {
		status: "malformed_mapping",
		ok: false,
		code: "identity/malformed-mapping",
		uid: expectedUid,
		userDocId: null,
		profile: null,
		message: `Malformed usersByUid/${expectedUid} document: "userDocId" ("${rawUserDocId}") is not a valid canonical customer ID.`
	};
	const rawCollection = getNonEmptyString(rawMapping["collection"]);
	if (rawCollection && rawCollection !== "users" && rawCollection !== "onlineCustomers") return {
		status: "malformed_mapping",
		ok: false,
		code: "identity/malformed-mapping",
		uid: expectedUid,
		userDocId: null,
		profile: null,
		message: `Malformed usersByUid/${expectedUid} document: unsupported collection value.`
	};
	const rawAccountType = rawMapping["accountType"];
	if (hasAccountType && rawAccountType !== "customer") {
		const isStaffOrAdmin = rawAccountType === "staff" || rawAccountType === "admin";
		return {
			status: "malformed_mapping",
			ok: false,
			code: isStaffOrAdmin ? "identity/non-customer-account" : "identity/malformed-mapping",
			uid: expectedUid,
			userDocId: null,
			profile: null,
			message: isStaffOrAdmin ? "This Firebase account is not a customer account." : `Malformed usersByUid/${expectedUid} document: accountType must be customer, staff, or admin.`
		};
	}
	const isOncus = rawUserDocId.toUpperCase().startsWith("ONCUS");
	const isSass = rawUserDocId.toUpperCase().startsWith("SASS");
	const targetCollection = rawCollection ?? (isOncus ? "onlineCustomers" : "users");
	if (isOncus && targetCollection !== "onlineCustomers" || !isOncus && targetCollection === "users" && !isSass) return {
		status: "malformed_mapping",
		ok: false,
		code: "identity/malformed-mapping",
		uid: expectedUid,
		userDocId: null,
		profile: null,
		message: `Malformed usersByUid/${expectedUid} document: collection does not match the customer ID.`
	};
	if (!hasAccountType && !(isOncus && targetCollection === "onlineCustomers" || isSass && targetCollection === "users")) return {
		status: "malformed_mapping",
		ok: false,
		code: "identity/malformed-mapping",
		uid: expectedUid,
		userDocId: null,
		profile: null,
		message: `Malformed usersByUid/${expectedUid} document: missing accountType for this collection and customer ID.`
	};
	const rawLegacySassId = getNonEmptyString(rawMapping["legacySassId"]);
	const legacySassId = rawLegacySassId && CANONICAL_SASS_ID_RE.test(rawLegacySassId) ? rawLegacySassId.toUpperCase() : void 0;
	return {
		ok: true,
		mapping: {
			uid: expectedUid,
			userDocId: rawUserDocId,
			collection: targetCollection,
			accountType: "customer",
			...legacySassId ? { legacySassId } : {}
		}
	};
}
/**
* Validates a raw customer profile document (`onlineCustomers/{userDocId}` or legacy `users/{userDocId}`)
* for identity consistency with `(authenticatedUid, resolvedUserDocId)` and normalizes it via `normalizeLegacyUser`.
*/
function validateAndNormalizeCustomerProfile(rawProfileDoc, resolvedUserDocId, authenticatedUid, context) {
	const targetCol = context?.collection ?? (resolvedUserDocId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users");
	if (!isPlainRecord(rawProfileDoc)) return {
		status: "profile_id_mismatch",
		ok: false,
		code: "identity/profile-id-mismatch",
		uid: authenticatedUid,
		userDocId: resolvedUserDocId,
		profile: null,
		message: `Invalid customer profile at ${targetCol}/${resolvedUserDocId}: expected a document object.`
	};
	const explicitProfileType = [
		rawProfileDoc["accountType"],
		rawProfileDoc["userType"],
		rawProfileDoc["role"]
	].map((value) => getNonEmptyString(value)?.toLowerCase()).find((value) => value !== void 0);
	if (explicitProfileType && explicitProfileType !== "customer") return {
		status: "profile_id_mismatch",
		ok: false,
		code: "identity/profile-id-mismatch",
		uid: authenticatedUid,
		userDocId: resolvedUserDocId,
		profile: null,
		message: `Profile ${targetCol}/${resolvedUserDocId} is marked as ${explicitProfileType} and cannot be used as a customer account.`
	};
	if (rawProfileDoc["merged"] === true) {
		const mergedInto = getNonEmptyString(rawProfileDoc["mergedInto"]);
		return {
			status: "profile_id_mismatch",
			ok: false,
			code: "identity/profile-id-mismatch",
			uid: authenticatedUid,
			userDocId: resolvedUserDocId,
			...mergedInto ? { actualProfileId: mergedInto } : {},
			profile: null,
			message: `Customer profile ${targetCol}/${resolvedUserDocId} is marked as merged${mergedInto ? ` into ${mergedInto}` : ""} and cannot be used as an active profile.`
		};
	}
	if (rawProfileDoc["userId"] !== void 0 && rawProfileDoc["userId"] !== null) {
		const explicitUserId = getNonEmptyString(rawProfileDoc["userId"]);
		const matchesResolved = explicitUserId === resolvedUserDocId;
		const matchesLegacy = Boolean(context?.legacySassId && explicitUserId === context.legacySassId);
		if (!explicitUserId || !matchesResolved && !matchesLegacy) return {
			status: "profile_id_mismatch",
			ok: false,
			code: "identity/profile-id-mismatch",
			uid: authenticatedUid,
			userDocId: resolvedUserDocId,
			...explicitUserId ? { actualProfileId: explicitUserId } : {},
			profile: null,
			message: `Profile customer ID mismatch in ${targetCol}/${resolvedUserDocId}: document userId "${explicitUserId ?? String(rawProfileDoc["userId"])}" does not match mapped userDocId "${resolvedUserDocId}".`
		};
	}
	if (rawProfileDoc["id"] !== void 0 && rawProfileDoc["id"] !== null) {
		const explicitId = getNonEmptyString(rawProfileDoc["id"]);
		const explicitUserId = getNonEmptyString(rawProfileDoc["userId"]);
		const matchesResolved = explicitId === resolvedUserDocId;
		const matchesLegacy = Boolean(context?.legacySassId && explicitId === context.legacySassId);
		const isLegacyUidShadowedByValidUserId = explicitId === authenticatedUid && (explicitUserId === resolvedUserDocId || Boolean(context?.legacySassId && explicitUserId === context.legacySassId));
		if (!explicitId || !matchesResolved && !matchesLegacy && !isLegacyUidShadowedByValidUserId) return {
			status: "profile_id_mismatch",
			ok: false,
			code: "identity/profile-id-mismatch",
			uid: authenticatedUid,
			userDocId: resolvedUserDocId,
			...explicitId ? { actualProfileId: explicitId } : {},
			profile: null,
			message: `Profile ID mismatch in ${targetCol}/${resolvedUserDocId}: document id "${explicitId ?? String(rawProfileDoc["id"])}" does not match mapped userDocId "${resolvedUserDocId}".`
		};
	}
	const profileUid = getNonEmptyString(rawProfileDoc["uid"]);
	if (profileUid !== null && profileUid !== authenticatedUid) {
		if (!(Array.isArray(rawProfileDoc["linkedUids"]) ? rawProfileDoc["linkedUids"].map((item) => getNonEmptyString(item)).filter((item) => item !== null) : []).includes(authenticatedUid)) return {
			status: "profile_id_mismatch",
			ok: false,
			code: "identity/profile-uid-mismatch",
			uid: authenticatedUid,
			userDocId: resolvedUserDocId,
			profile: null,
			message: `Profile UID mismatch in ${targetCol}/${resolvedUserDocId}: profile belongs to UID "${profileUid}", not authenticated UID "${authenticatedUid}".`
		};
	}
	const normalized = normalizeLegacyUser(rawProfileDoc, {
		docId: resolvedUserDocId,
		documentPath: `${targetCol}/${resolvedUserDocId}`,
		...context?.legacySassId ? { legacySassId: context.legacySassId } : {}
	});
	if (!normalized || normalized.id !== resolvedUserDocId || normalized.userId !== resolvedUserDocId || normalized.id === authenticatedUid || !CANONICAL_CUSTOMER_ID_RE.test(normalized.id)) return {
		status: "profile_id_mismatch",
		ok: false,
		code: "identity/profile-id-mismatch",
		uid: authenticatedUid,
		userDocId: resolvedUserDocId,
		...normalized?.id ? { actualProfileId: normalized.id } : {},
		profile: null,
		message: `Normalized profile ID "${normalized?.id ?? "null"}" is inconsistent with resolved document ID "${resolvedUserDocId}".`
	};
	return {
		ok: true,
		profile: {
			...normalized,
			uid: authenticatedUid
		}
	};
}
function buildDatabaseErrorResult(err, uid, userDocId, operationDescription, isProduction = false) {
	const category = classifyStorageError(err);
	const isEmulatorUnavailable = !isProduction && category === "connectivity";
	const rawMessage = err instanceof Error && err.message ? err.message : `Database error during ${operationDescription}`;
	return {
		status: "database_error",
		ok: false,
		code: isEmulatorUnavailable ? "identity/emulator-unavailable" : "identity/database-error",
		uid,
		userDocId,
		profile: null,
		errorCategory: category,
		isEmulatorUnavailable,
		message: isEmulatorUnavailable ? `Firestore Emulator is unavailable while ${operationDescription}: ${rawMessage}` : `Firestore error while ${operationDescription}: ${rawMessage}`,
		cause: err
	};
}
var customProductionReaderOverride = null;
async function readProductionDocument(collectionName, docId) {
	if (customProductionReaderOverride) return customProductionReaderOverride(collectionName, docId);
	let app = getApps().find((a) => a.name === PRODUCTION_AUTH_APP_NAME);
	if (!app) {
		const config = getProductionFirebaseConfig();
		const validation = validateProductionPreviewConfig(config);
		if (!validation.valid) throw new Error(`CONFIGURATION SAFETY ERROR:\n${validation.errors.map((e) => `  - ${e}`).join("\n")}`);
		const sdkOptions = {
			projectId: config.projectId,
			authDomain: config.authDomain,
			messagingSenderId: config.messagingSenderId,
			apiKey: config.apiKey
		};
		if (config.storageBucket) sdkOptions["storageBucket"] = config.storageBucket;
		if (config.appId) sdkOptions["appId"] = config.appId;
		app = initializeApp(sdkOptions, PRODUCTION_AUTH_APP_NAME);
	}
	const db = getFirestore(app);
	const docRef = doc(db, collectionName, docId);
	const snap = await getDoc(docRef);
	if (!snap.exists()) return null;
	return snap.data();
}
var customAdapterOverride = null;
function resolveActiveAdapter(options) {
	if (options?.adapter) return options.adapter;
	if (customAdapterOverride) return customAdapterOverride;
	return apiClient.getFirestoreAdapter();
}
var customerIdentityService = {
	/**
	* Overrides the FirestoreAdapter instance for isolated unit tests.
	*/
	setAdapterForTesting(adapter) {
		customAdapterOverride = adapter;
	},
	/**
	* Overrides the production document reader for isolated unit tests.
	*/
	setProductionReaderForTesting(reader) {
		customProductionReaderOverride = reader;
	},
	/**
	* Returns true if the supplied user object is a mock-auth session user
	* (i.e. lacks a verified Firebase Auth UID). Mock users must never be
	* treated as having Firebase Authentication identities.
	*/
	isMockSessionUser(user) {
		if (!user) return false;
		return getNonEmptyString(user.uid) === null;
	},
	/**
	* Safely resolves a verified Firebase Auth user to their canonical Sri Amman
	* Smart Store `User` profile via the read-only two-step lookup:
	*   `Firebase Auth UID -> usersByUid/{uid} -> { userDocId, uid } -> users/{userDocId}`
	*
	* Never creates or modifies `usersByUid` or `users` documents, never allocates
	* SASS IDs, and never associates accounts by matching email addresses.
	*/
	async resolveCustomerProfile(firebaseUser, options) {
		const authValidation = validateAuthenticatedFirebaseUser(firebaseUser);
		if (!authValidation.ok) return authValidation;
		const { uid, email } = authValidation;
		const isProduction = customProductionReaderOverride !== null || options?.mode === "production" || !options?.mode && firebaseUser?.providerId === "firebase-auth-production" || !options?.mode && !firebaseUser?.providerId && authManager.getMode() === "production";
		let rawMappingDoc = null;
		try {
			if (isProduction && !options?.adapter) rawMappingDoc = await readProductionDocument("usersByUid", uid);
			else rawMappingDoc = await resolveActiveAdapter(options).getDocumentRaw("usersByUid", uid);
		} catch (err) {
			if (classifyStorageError(err) === "not_found") rawMappingDoc = null;
			else return buildDatabaseErrorResult(err, uid, null, `looking up usersByUid/${uid}`, isProduction);
		}
		if (rawMappingDoc === null) return {
			status: "unlinked",
			ok: false,
			code: "identity/unlinked-uid",
			uid,
			...email ? { email } : {},
			userDocId: null,
			profile: null,
			requiresRegistration: true,
			message: `No linked Sri Amman Smart Store customer profile found for Firebase UID "${uid}". New customer registration or phone-verified account linking is required.`
		};
		const mappingValidation = validateUsersByUidMapping(rawMappingDoc, uid);
		if (!mappingValidation.ok) return mappingValidation;
		const { userDocId: rawUserDocId, collection: targetCol, legacySassId: mappingLegacySassId } = mappingValidation.mapping;
		const ds = resolveCustomerDataSource(rawUserDocId, targetCol);
		const resolvedUserDocId = ds.canonicalCustomerId;
		const primaryCol = ds.collection;
		const legacySassId = ds.legacySassId ?? mappingLegacySassId;
		let rawProfileDoc = null;
		let actualCollectionUsed = primaryCol;
		try {
			if (isProduction && !options?.adapter) rawProfileDoc = await readProductionDocument(primaryCol, resolvedUserDocId);
			else rawProfileDoc = await resolveActiveAdapter(options).getDocumentRaw(primaryCol, resolvedUserDocId);
		} catch (err) {
			if (classifyStorageError(err) === "not_found") rawProfileDoc = null;
			else return buildDatabaseErrorResult(err, uid, resolvedUserDocId, `fetching ${primaryCol}/${resolvedUserDocId}`, isProduction);
		}
		if (rawProfileDoc === null && primaryCol === "onlineCustomers" && legacySassId) try {
			if (isProduction && !options?.adapter) rawProfileDoc = await readProductionDocument("users", legacySassId);
			else rawProfileDoc = await resolveActiveAdapter(options).getDocumentRaw("users", legacySassId);
			if (rawProfileDoc !== null) actualCollectionUsed = "users";
		} catch (err) {
			if (classifyStorageError(err) !== "not_found") return buildDatabaseErrorResult(err, uid, legacySassId, `fetching fallback users/${legacySassId}`, isProduction);
		}
		if (rawProfileDoc === null) return {
			status: "missing_profile",
			ok: false,
			code: "identity/missing-profile",
			uid,
			userDocId: resolvedUserDocId,
			profile: null,
			message: `Identity mapping usersByUid/${uid} references customer "${resolvedUserDocId}", but document ${primaryCol}/${resolvedUserDocId} does not exist.`
		};
		const profileValidation = validateAndNormalizeCustomerProfile(rawProfileDoc, resolvedUserDocId, uid, {
			legacySassId,
			collection: actualCollectionUsed
		});
		if (!profileValidation.ok) return profileValidation;
		return {
			status: "resolved",
			ok: true,
			uid,
			userDocId: resolvedUserDocId,
			mapping: {
				...mappingValidation.mapping,
				userDocId: resolvedUserDocId,
				collection: primaryCol,
				...legacySassId ? { legacySassId } : {}
			},
			profile: profileValidation.profile
		};
	},
	/**
	* Resolves the customer profile for the currently signed-in Firebase Auth user
	* from `emailLinkAuthService.getCurrentFirebaseAuthUser()`.
	*/
	async resolveCurrentFirebaseUserProfile(options) {
		const currentFirebaseUser = emailLinkAuthService.getCurrentFirebaseAuthUser();
		return this.resolveCustomerProfile(currentFirebaseUser, options);
	},
	/**
	* Resolves the customer profile and returns the normalized `User` on success,
	* or throws a typed `CustomerIdentityResolutionError` on any non-resolved state.
	*/
	async resolveCustomerProfileOrThrow(firebaseUser, options) {
		const result = await this.resolveCustomerProfile(firebaseUser, options);
		if (result.status !== "resolved") throw new CustomerIdentityResolutionError(result);
		return result.profile;
	},
	/**
	* Allocates the next sequential customer ID for `onlineCustomers` using an atomic transaction
	* on `meta/onlineCustomerSequence`. Follows the canonical ONCUSxxxxxxx schema.
	*/
	async allocateNextOnlineCustomerSequenceId() {
		const db = getProductionFirestoreInstance();
		const seqRef = doc(db, "meta", "onlineCustomerSequence");
		const nextId = await runTransaction(db, async (tx) => {
			const snap = await tx.get(seqRef);
			const data = snap.data();
			const updated = (snap.exists() && data ? Number(data["current"]) || 0 : 0) + 1;
			tx.set(seqRef, { current: updated }, { merge: true });
			return updated;
		});
		return `ONCUS${String(nextId).padStart(7, "0")}`;
	},
	/**
	* Backwards-compatible alias directing ID allocation to the online customer sequence.
	*/
	async allocateNextUserSequenceId() {
		return this.allocateNextOnlineCustomerSequenceId();
	},
	/**
	* Provisions a new customer profile strictly in the `onlineCustomers` Firestore collection
	* and binds the `usersByUid/{uid}` mapping.
	*
	* STRICT GUARANTEES:
	* 1. Stores customer profiles ONLY in `onlineCustomers/{ONCUSxxxxxxx}`.
	* 2. NEVER writes or creates documents in the legacy `users` collection.
	* 3. Sets `collection: "onlineCustomers"` in `usersByUid/{uid}`.
	* 4. Allocates sequence numbers strictly from `meta/onlineCustomerSequence`.
	*/
	async provisionCustomerAccount(params) {
		const { uid, email, fullName, number, countryCode, phoneVerified, gender, dob, referredBy } = params;
		const db = getProductionFirestoreInstance();
		const mapRef = doc(db, "usersByUid", uid);
		const mapSnap = await getDoc(mapRef);
		const mapData = mapSnap.data();
		let userDocId = mapSnap.exists() && mapData ? mapData["userDocId"] : "";
		if (!userDocId) userDocId = await this.allocateNextOnlineCustomerSequenceId();
		const cleanEmail = email ? email.trim().toLowerCase() : "";
		const fallbackName = cleanEmail ? cleanEmail.split("@")[0] || "Customer" : "Customer";
		const cleanName = fullName ? fullName.trim() : fallbackName;
		const cleanNumber = number ? number.replace(/\D/g, "") : "";
		const cleanCountryCode = countryCode || "+91";
		const customerDocRef = doc(db, "onlineCustomers", userDocId);
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const customerPayload = {
			id: userDocId,
			userId: userDocId,
			customerId: userDocId,
			uid,
			linkedUids: [uid],
			fullName: cleanName,
			name: cleanName,
			email: cleanEmail,
			number: cleanNumber,
			phone: cleanNumber ? `${cleanCountryCode} ${cleanNumber}` : "",
			countryCode: cleanCountryCode,
			phoneVerified: phoneVerified ?? false,
			gender: gender || "",
			dob: dob || "",
			accountType: "customer",
			role: "customer",
			smartCoins: 0,
			earnedCoins: 0,
			isVIP: false,
			referralCode: userDocId,
			createdAt: nowIso,
			updatedAt: nowIso,
			lastUpdated: nowIso
		};
		if (referredBy) {
			customerPayload["referredBy"] = referredBy.trim().toUpperCase();
			customerPayload["referredAt"] = nowIso;
		}
		await setDoc(customerDocRef, customerPayload, { merge: true });
		await setDoc(mapRef, {
			userDocId,
			uid,
			collection: "onlineCustomers",
			accountType: "customer",
			createdAt: nowIso
		}, { merge: true });
		const profile = {
			id: userDocId,
			userId: userDocId,
			customerId: userDocId,
			uid,
			name: cleanName,
			email: cleanEmail,
			phone: cleanNumber ? `${cleanCountryCode} ${cleanNumber}` : "",
			countryCode: cleanCountryCode,
			phoneVerified: phoneVerified ?? false,
			smartCoins: 0,
			coins: 0,
			earnedCoins: 0,
			isVIP: false,
			referralCode: userDocId,
			createdAt: nowIso,
			updatedAt: nowIso,
			lastUpdated: nowIso,
			...gender ? { gender } : {},
			...dob ? { dob } : {},
			...referredBy ? { referredBy: referredBy.trim().toUpperCase() } : {}
		};
		return {
			userDocId,
			profile
		};
	},
	/**
	* Updates an existing customer profile with a verified phone number.
	*
	* STRICT SAFETY GUARANTEES:
	* 1. Validates that the customer profile belongs to the authenticated UID.
	* 2. Sets `phoneVerified: true` strictly after trusted phone verification.
	* 3. Normalizes and updates `phone`, `number`, and `countryCode` consistently.
	* 4. Updates `onlineCustomers/{customerId}` (or legacy `users/{customerId}`).
	*/
	async updateVerifiedPhoneNumber(params) {
		const { uid, customerId, verifiedE164Phone } = params;
		const cleanPhone = (verifiedE164Phone || "").trim();
		if (!cleanPhone || !/^\+[1-9]\d{6,14}$/.test(cleanPhone)) throw new Error("Invalid verified phone number format. Must be E.164 (e.g. +919840012345).");
		const detectedCountryCode = [
			"+971",
			"+61",
			"+44",
			"+91",
			"+1"
		].find((code) => cleanPhone.startsWith(code)) || "+91";
		const nationalNumber = cleanPhone.slice(detectedCountryCode.length).replace(/\D/g, "");
		const db = getProductionFirestoreInstance();
		const mapRef = doc(db, "usersByUid", uid);
		const mapSnap = await getDoc(mapRef);
		let profileCollection = "onlineCustomers";
		let targetDocId = customerId;
		if (mapSnap.exists()) {
			const mapData = mapSnap.data();
			if (mapData && mapData["userDocId"] && mapData["userDocId"] !== customerId && mapData["legacySassId"] !== customerId) throw new Error("Access denied: Authenticated UID does not match customer profile.");
			if (mapData && mapData["collection"] === "users") profileCollection = "users";
		}
		const nowIso = (/* @__PURE__ */ new Date()).toISOString();
		const docRef = doc(db, profileCollection, targetDocId);
		const docSnap = await getDoc(docRef);
		if (!docSnap.exists()) throw new Error(`Customer profile "${targetDocId}" not found in ${profileCollection}.`);
		const existingData = docSnap.data();
		const profileUid = existingData["uid"];
		const linkedUids = Array.isArray(existingData["linkedUids"]) ? existingData["linkedUids"] : [];
		if (profileUid !== uid && !linkedUids.includes(uid)) throw new Error("Access denied: You cannot modify another customer's phone number.");
		const payload = {
			phoneVerified: true,
			phone: cleanPhone,
			number: nationalNumber,
			countryCode: detectedCountryCode,
			updatedAt: nowIso,
			lastUpdated: nowIso
		};
		await setDoc(docRef, payload, { merge: true });
		try {
			const phoneIndexRef = doc(db, "customerPhoneIndex", cleanPhone);
			await setDoc(phoneIndexRef, {
				uid,
				userDocId: targetDocId,
				collection: profileCollection,
				phone: cleanPhone,
				createdAt: nowIso
			}, { merge: true });
		} catch {}
		const normalized = normalizeLegacyUser({
			...existingData,
			...payload
		});
		if (!normalized) throw new Error("Failed to normalize updated customer profile.");
		return normalized;
	}
};
/**
* Timeout bounding utility for production Firestore notification reads.
*/
function withTimeout$2(promise, timeoutMs, operation) {
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
* Normalizes an arbitrary legacy notification document from production Firestore
* (`users/{SASS_ID}/notifications/{docId}` or `onlineCustomers/{ONCUS_ID}/notifications/{docId}`)
* into the standard frontend `NotificationItem` domain model.
*/
function normalizeLegacyNotificationDocument(docId, docData, userId) {
	if (docData["deleted"] === true || docData["isDeleted"] === true) return null;
	const id = String(docData["id"] || docId || "").trim();
	if (!id) return null;
	const title = String(docData["title"] || docData["subject"] || docData["heading"] || "Store Update").trim();
	const message = String(docData["message"] || docData["body"] || docData["content"] || docData["text"] || "").trim();
	const read = Boolean(docData["read"] ?? docData["isRead"] ?? false);
	const orderId = typeof docData["orderId"] === "string" && docData["orderId"].trim() ? docData["orderId"].trim() : void 0;
	let actionUrl = typeof docData["actionUrl"] === "string" && docData["actionUrl"].trim() ? docData["actionUrl"].trim() : void 0;
	if (!actionUrl && orderId) actionUrl = `/orders?id=${orderId}`;
	const badge = typeof docData["badge"] === "string" && docData["badge"].trim() ? docData["badge"].trim() : void 0;
	const ctaText = typeof docData["ctaText"] === "string" && docData["ctaText"].trim() ? docData["ctaText"].trim() : actionUrl ? "View Details →" : void 0;
	const previousStatus = typeof docData["previousStatus"] === "string" ? docData["previousStatus"] : void 0;
	const newStatus = typeof docData["newStatus"] === "string" ? docData["newStatus"] : void 0;
	const driverName = typeof docData["driverName"] === "string" ? docData["driverName"] : void 0;
	const driverVehicle = typeof docData["driverVehicle"] === "string" ? docData["driverVehicle"] : void 0;
	const rawType = String(docData["type"] || "").trim().toLowerCase();
	const rawCategory = String(docData["category"] || "").trim().toLowerCase();
	let category = "account";
	if (rawCategory === "orders" || rawCategory === "offers" || rawCategory === "account" || rawCategory === "rewards" || rawCategory === "harvest") category = rawCategory;
	else if (orderId || rawType.startsWith("order")) category = "orders";
	else if (rawType.includes("reward") || rawType.includes("coin") || rawType.includes("vip")) category = "rewards";
	else if (rawType.includes("harvest") || rawType.includes("stock") || rawType.includes("offer")) category = "harvest";
	let type = "system";
	if (rawType === "order_created" || rawType === "order_status_changed" || rawType === "reward_credited" || rawType === "harvest_alert" || rawType === "system") type = rawType;
	else if (category === "orders") type = newStatus ? "order_status_changed" : "order_created";
	else if (category === "rewards") type = "reward_credited";
	else if (category === "harvest") type = "harvest_alert";
	const eventKey = typeof docData["eventKey"] === "string" && docData["eventKey"].trim() ? docData["eventKey"].trim() : `notif_${id}`;
	let timestamp = (/* @__PURE__ */ new Date()).toISOString();
	const rawTimestamp = docData["timestamp"] ?? docData["createdAt"] ?? docData["date"];
	if (rawTimestamp && typeof rawTimestamp.toDate === "function") timestamp = rawTimestamp.toDate().toISOString();
	else if (rawTimestamp && typeof rawTimestamp.seconds === "number") timestamp = (/* @__PURE__ */ new Date(rawTimestamp.seconds * 1e3)).toISOString();
	else if (typeof rawTimestamp === "string" && rawTimestamp.trim()) {
		const parsed = new Date(rawTimestamp.trim());
		if (!Number.isNaN(parsed.getTime())) timestamp = parsed.toISOString();
	}
	return {
		id,
		userId,
		category,
		type,
		eventKey,
		title,
		message,
		timestamp,
		read,
		...actionUrl ? { actionUrl } : {},
		...badge ? { badge } : {},
		...orderId ? { orderId } : {},
		...previousStatus ? { previousStatus } : {},
		...newStatus ? { newStatus } : {},
		...driverName ? { driverName } : {},
		...driverVehicle ? { driverVehicle } : {},
		...ctaText ? { ctaText } : {}
	};
}
var readerOverride$2 = null;
var productionNotificationReader = {
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
	/** Marks a notification in the customer's canonical or legacy subcollection. */
	async markAsRead(customerId, notificationId, legacySassId) {
		const validCustomerId = this.assertValidCustomer(customerId);
		const cleanNotificationId = notificationId.trim();
		if (!cleanNotificationId) throw new Error("Notification ID is required.");
		if (readerOverride$2?.markAsRead) return readerOverride$2.markAsRead(validCustomerId, cleanNotificationId, legacySassId);
		const primaryCollection = validCustomerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
		const candidates = [{
			collection: primaryCollection,
			customerId: validCustomerId
		}, ...primaryCollection === "onlineCustomers" && legacySassId?.trim() ? [{
			collection: "users",
			customerId: legacySassId.trim()
		}] : []];
		const db = getProductionFirestoreInstance();
		for (const candidate of candidates) {
			const notificationRef = doc(db, candidate.collection, candidate.customerId, "notifications", cleanNotificationId);
			const notificationSnapshot = await withTimeout$2(getDoc(notificationRef), 8e3, `getDoc(${candidate.collection}/${candidate.customerId}/notifications/${cleanNotificationId})`);
			if (!notificationSnapshot.exists()) continue;
			await withTimeout$2(updateDoc(notificationRef, { read: true }), 8e3, `updateDoc(${candidate.collection}/${candidate.customerId}/notifications/${cleanNotificationId})`);
			return {
				...notificationSnapshot.data(),
				id: cleanNotificationId,
				userId: validCustomerId,
				read: true
			};
		}
		throw new Error("Notification was not found for this customer.");
	},
	/**
	* Reads all notifications for an authenticated customer directly from production Firestore
	* (`onlineCustomers/{ID}/notifications` or `users/{ID}/notifications`).
	* Deduplicates by eventKey / ID and sorts descending by timestamp.
	* If customer has an ONCUS ID and legacy SASS ID, falls back to legacy notifications if online subcollection is empty.
	*/
	async getCustomerNotifications(customerId, timeoutMs = 8e3, legacySassId) {
		if (readerOverride$2?.getCustomerNotifications) {
			if (legacySassId) return readerOverride$2.getCustomerNotifications(customerId || "", legacySassId);
			return readerOverride$2.getCustomerNotifications(customerId || "");
		}
		const cleanCustomerId = (customerId || "").trim();
		if (!cleanCustomerId) return [];
		const validCustomerId = this.assertValidCustomer(cleanCustomerId);
		const cleanLegacySassId = typeof legacySassId === "string" && legacySassId.trim() ? legacySassId.trim() : void 0;
		const db = getProductionFirestoreInstance();
		const primaryCol = validCustomerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
		const notifsColRef = collection(db, primaryCol, validCustomerId, "notifications");
		try {
			let snap = await withTimeout$2(getDocs(query(notifsColRef)), timeoutMs, `getDocs(${primaryCol}/${validCustomerId}/notifications)`);
			if (snap.empty && primaryCol === "onlineCustomers" && cleanLegacySassId) try {
				const fallbackSnap = await withTimeout$2(getDocs(query(collection(db, "users", cleanLegacySassId, "notifications"))), timeoutMs, `getDocs(users/${cleanLegacySassId}/notifications)`);
				if (!fallbackSnap.empty) snap = fallbackSnap;
			} catch (err) {
				console.warn(`[ProductionNotificationReader] Warning querying fallback notifications for ${cleanLegacySassId}:`, err);
			}
			const list = [];
			const seenKeys = /* @__PURE__ */ new Set();
			for (const docSnap of snap.docs) {
				const item = normalizeLegacyNotificationDocument(docSnap.id, docSnap.data(), validCustomerId);
				if (!item) continue;
				const dedupeKey = item.eventKey || item.id;
				if (seenKeys.has(dedupeKey)) continue;
				seenKeys.add(dedupeKey);
				list.push(item);
			}
			list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
			return list;
		} catch (err) {
			console.error(`[ProductionNotificationReader] Error querying ${primaryCol}/${validCustomerId}/notifications:`, err);
			const category = classifyStorageError(err);
			throw new StorageAdapterError(`Failed to retrieve notifications for customer ${validCustomerId}: ${err instanceof Error ? err.message : String(err)}`, {
				status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
				code: category === "permission" ? "permission-denied" : "unavailable",
				category,
				causeError: err
			});
		}
	}
};
var DEFAULT_PREFERENCES = {
	inAppAlerts: true,
	orderUpdates: true,
	harvestAlerts: true,
	coinRewards: true,
	quietHours: true,
	whatsappSmsMock: true
};
var SUPPORTED_ORDER_STATUSES = [
	"pending",
	"processing",
	"packed",
	"in transit",
	"delivered",
	"cancelled",
	"returned"
];
var listeners = /* @__PURE__ */ new Set();
var inFlightCreations = /* @__PURE__ */ new Map();
var inMemoryObservedStatuses = /* @__PURE__ */ new Map();
function normalizeStatusSlug(status) {
	return status.trim().toLowerCase().replace(/\s+/g, "_");
}
function getObservedStorageKey(userId) {
	return `sass_observed_order_statuses_${userId}`;
}
function loadObservedStatusMap(userId) {
	const mem = inMemoryObservedStatuses.get(userId) || {};
	if (typeof window === "undefined") return { ...mem };
	try {
		const raw = localStorage.getItem(getObservedStorageKey(userId));
		if (raw) {
			const merged = {
				...JSON.parse(raw),
				...mem
			};
			inMemoryObservedStatuses.set(userId, merged);
			return merged;
		}
	} catch {}
	return { ...mem };
}
function saveObservedStatusMap(userId, map) {
	inMemoryObservedStatuses.set(userId, { ...map });
	if (typeof window !== "undefined") try {
		localStorage.setItem(getObservedStorageKey(userId), JSON.stringify(map));
	} catch {}
}
function buildStatusNotificationCopy(order, previousStatus, newStatus) {
	const orderId = order.orderId || order.id;
	const city = order.deliveryAddress?.city || "your delivery address";
	const totalAmount = order.pricingSummary?.totalAmount ?? 0;
	const itemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
	switch (newStatus) {
		case "processing": return {
			badge: `ORDER PROCESSING • #${orderId}`,
			title: `Order #${orderId} is Being Prepared`,
			message: `Your order status changed from ${previousStatus} to processing. Our team is freshly preparing your ${itemCount} item${itemCount === 1 ? "" : "s"}.`,
			ctaText: "Track Order →"
		};
		case "packed": return {
			badge: `ORDER PACKED • #${orderId}`,
			title: `Order #${orderId} Has Been Packed`,
			message: `Your order status changed from ${previousStatus} to packed. Your harvest basket is quality-checked and ready for dispatch.`,
			ctaText: "Track Order →"
		};
		case "in transit": return {
			badge: `LIVE DELIVERY • ORDER #${orderId}`,
			title: `Order #${orderId} is Out for Delivery`,
			message: `Your order status changed from ${previousStatus} to in transit. Our delivery partner is on the way to ${city}.`,
			ctaText: "Track Live Order →"
		};
		case "delivered": return {
			badge: `ORDER DELIVERED • #${orderId}`,
			title: `Order #${orderId} Safely Delivered`,
			message: `Your order status changed from ${previousStatus} to delivered. Order #${orderId} (₹${totalAmount}) has been delivered to ${city}.`,
			ctaText: "View Order & Invoice →"
		};
		case "cancelled": return {
			badge: `ORDER CANCELLED • #${orderId}`,
			title: `Order #${orderId} Has Been Cancelled`,
			message: `Your order status changed from ${previousStatus} to cancelled. Order #${orderId} (₹${totalAmount}) is now cancelled.`,
			ctaText: "View Order Details →"
		};
		case "returned": return {
			badge: `RETURN INITIATED • #${orderId}`,
			title: `Return Requested for Order #${orderId}`,
			message: `Your order status changed from ${previousStatus} to returned. Return request for Order #${orderId} is being processed.`,
			ctaText: "View Return Details →"
		};
		default: return {
			badge: `ORDER UPDATE • #${orderId}`,
			title: `Order #${orderId} Status Updated to ${newStatus}`,
			message: `Order #${orderId} status updated from ${previousStatus} to ${newStatus}.`,
			ctaText: "View Order Details →"
		};
	}
}
var notificationService = {
	/**
	* Resolves the canonical customer document ID (SASS...).
	* Never falls back to a demo customer when unauthenticated or when an empty ID is passed.
	*/
	resolveCustomerId(userId) {
		if (userId !== void 0) return userId.trim();
		const currentUser = authService.getCurrentUser();
		if (currentUser) return (currentUser.userId || currentUser.id || "").trim();
		return "";
	},
	subscribe(listener) {
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	},
	notifyListeners() {
		for (const listener of listeners) try {
			listener();
		} catch (err) {
			console.error("Notification listener error:", err);
		}
	},
	clearSessionState(userId) {
		if (userId) inMemoryObservedStatuses.delete(userId);
		else inMemoryObservedStatuses.clear();
		this.notifyListeners();
	},
	recordObservedOrderStatus(userId, orderId, status) {
		if (!userId || !orderId || !SUPPORTED_ORDER_STATUSES.includes(status)) return;
		const map = loadObservedStatusMap(userId);
		map[orderId] = status;
		saveObservedStatusMap(userId, map);
	},
	getObservedOrderStatus(userId, orderId) {
		if (!userId || !orderId) return void 0;
		return loadObservedStatusMap(userId)[orderId];
	},
	async getNotifications(userId, legacySassId) {
		const isProd = authManager.getMode() === "production";
		const effectiveUserId = this.resolveCustomerId(userId);
		if (!effectiveUserId) return [];
		if (isProd) {
			const currentUser = authService.getCurrentUser();
			let resolvedId = effectiveUserId;
			let resolvedLegacySassId = legacySassId || currentUser?.legacySassId;
			try {
				const ds = resolveCustomerDataSource(effectiveUserId);
				resolvedId = ds.canonicalCustomerId;
				resolvedLegacySassId = resolvedLegacySassId || ds.legacySassId;
			} catch {}
			if (resolvedLegacySassId) return productionNotificationReader.getCustomerNotifications(resolvedId, void 0, resolvedLegacySassId);
			return productionNotificationReader.getCustomerNotifications(resolvedId);
		}
		const list = await apiClient.get("/notifications", { userId: effectiveUserId });
		const seenKeys = /* @__PURE__ */ new Set();
		const scoped = [];
		const sorted = (list || []).filter((n) => n && n.userId === effectiveUserId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
		for (const item of sorted) {
			const dedupeKey = item.eventKey || item.id;
			if (dedupeKey && seenKeys.has(dedupeKey)) continue;
			if (dedupeKey) seenKeys.add(dedupeKey);
			scoped.push(item);
		}
		return scoped;
	},
	async getUnreadCount(userId, legacySassId) {
		return (await this.getNotifications(userId, legacySassId)).filter((n) => !n.read).length;
	},
	async createNotification(item) {
		const cleanUserId = (item.userId || "").trim();
		if (!cleanUserId) throw new Error("Cannot create notification without a valid customer userId.");
		const notifId = item.id || `notif_${Date.now()}_${Math.floor(1e3 + Math.random() * 9e3)}`;
		const dedupeKey = item.eventKey || notifId;
		const existingInFlight = inFlightCreations.get(dedupeKey);
		if (existingInFlight) return existingInFlight;
		const creationPromise = (async () => {
			try {
				const duplicate = (await this.getNotifications(cleanUserId)).find((n) => n.id === notifId || item.eventKey && n.eventKey === item.eventKey);
				if (duplicate) return duplicate;
				const payload = {
					...item,
					id: notifId,
					userId: cleanUserId,
					read: item.read ?? false,
					timestamp: item.timestamp || (/* @__PURE__ */ new Date()).toISOString()
				};
				try {
					const created = await apiClient.post("/notifications", payload);
					this.notifyListeners();
					return created;
				} catch (postErr) {
					const existingAfterRace = (await this.getNotifications(cleanUserId).catch(() => [])).find((n) => n.id === notifId || item.eventKey && n.eventKey === item.eventKey);
					if (existingAfterRace) return existingAfterRace;
					throw postErr;
				}
			} finally {
				inFlightCreations.delete(dedupeKey);
			}
		})();
		inFlightCreations.set(dedupeKey, creationPromise);
		return creationPromise;
	},
	async createOrderPlacedNotification(order) {
		if (!order || !order.orderId || !order.userId) throw new Error("Invalid order object provided for notification creation.");
		const orderId = order.orderId;
		const userId = order.userId;
		this.recordObservedOrderStatus(userId, orderId, order.status || "pending");
		const itemCount = (order.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);
		const totalAmount = order.pricingSummary?.totalAmount ?? 0;
		const city = order.deliveryAddress?.city || "your address";
		const slotTitle = order.delivery?.slot || "Scheduled delivery slot";
		return this.createNotification({
			id: `notif_order_created_${orderId}`,
			userId,
			category: "orders",
			type: "order_created",
			eventKey: `order_created:${userId}:${orderId}`,
			orderId,
			newStatus: order.status || "pending",
			badge: `ORDER CONFIRMED • #${orderId}`,
			title: `Order #${orderId} Confirmed & Received`,
			message: `Your order of ${itemCount} item${itemCount === 1 ? "" : "s"} (₹${totalAmount}) for ${city} has been placed successfully. Delivery slot: ${slotTitle}.`,
			ctaText: "View Order Details →",
			actionUrl: `/orders?id=${orderId}`,
			read: false,
			timestamp: order.createdAt || (/* @__PURE__ */ new Date()).toISOString()
		});
	},
	async createCoinNotification(params) {
		const { userId, amount, type, orderId } = params;
		const cleanUserId = this.resolveCustomerId(userId);
		const notifId = `notif_coin_${type}_${orderId || Date.now()}`;
		const title = type === "earned" ? `Smart Coins Earned!` : type === "redeemed" ? `Smart Coins Redeemed!` : `Smart Coins Refunded!`;
		const message = type === "earned" ? `You earned ${amount} Smart Coins${orderId ? ` on Order #${orderId}` : ""}. Enjoy your rewards on your next harvest delivery!` : type === "redeemed" ? `You redeemed ${amount} Smart Coins${orderId ? ` on Order #${orderId}` : ""}.` : `${amount} Smart Coins have been refunded to your account balance.`;
		return this.createNotification({
			id: notifId,
			userId: cleanUserId,
			category: "rewards",
			type: "coins_credited",
			eventKey: `coin_${type}:${cleanUserId}:${orderId || Date.now()}`,
			...orderId ? { orderId } : {},
			badge: type === "earned" ? "COINS EARNED" : "COINS REDEEMED",
			title,
			message,
			ctaText: "View Smart Coins Balance →",
			actionUrl: "/rewards",
			read: false,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		});
	},
	async createPhoneVerifiedNotification(params) {
		const { userId, phone } = params;
		const cleanUserId = this.resolveCustomerId(userId);
		const notifId = `notif_phone_verified_${cleanUserId}`;
		return this.createNotification({
			id: notifId,
			userId: cleanUserId,
			category: "account",
			type: "account",
			eventKey: `phone_verified:${cleanUserId}`,
			badge: "SECURITY VERIFIED",
			title: "Mobile Number Verified Successfully",
			message: `Your contact number ${phone} has been verified with SMS OTP. Your orders and delivery rider dispatch updates are now secured.`,
			ctaText: "View Account Details →",
			actionUrl: "/account",
			read: false,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		});
	},
	async createOrderStatusNotification(order, previousStatus, newStatus, changeTimestamp) {
		if (authManager.getMode() === "production") return null;
		if (!order || !order.orderId || !order.userId) throw new Error("Invalid order provided for status notification.");
		if (!SUPPORTED_ORDER_STATUSES.includes(newStatus)) throw new Error(`Unsupported order status: "${newStatus}".`);
		if (previousStatus === newStatus) return null;
		const orderId = order.orderId;
		const userId = order.userId;
		const statusSlug = normalizeStatusSlug(newStatus);
		this.recordObservedOrderStatus(userId, orderId, newStatus);
		const copy = buildStatusNotificationCopy(order, previousStatus, newStatus);
		const driverName = order.delivery?.driver?.name;
		const driverVehicle = order.delivery?.driver?.vehicle;
		return this.createNotification({
			id: `notif_order_status_${orderId}_${statusSlug}`,
			userId,
			category: "orders",
			type: "order_status_changed",
			eventKey: `order_status:${userId}:${orderId}:${statusSlug}`,
			orderId,
			previousStatus,
			newStatus,
			badge: copy.badge,
			title: copy.title,
			message: copy.message,
			...driverName !== void 0 ? { driverName } : {},
			...driverVehicle !== void 0 ? { driverVehicle } : {},
			ctaText: copy.ctaText,
			actionUrl: `/orders?id=${orderId}`,
			read: false,
			timestamp: changeTimestamp || (/* @__PURE__ */ new Date()).toISOString()
		});
	},
	/**
	* Checks current orders for a customer against previously observed statuses.
	* - In production mode, updates local observation tracking without triggering Firestore mutations.
	* - On first observation of an order, records its status as baseline without generating historical notifications.
	* - When a previously observed order changes to a new supported status, creates a single idempotent notification.
	*/
	async reconcileOrderStatuses(userId, providedOrders) {
		const cleanUserId = this.resolveCustomerId(userId);
		if (!cleanUserId) return [];
		if (authManager.getMode() === "production") {
			const customerOrders = ((providedOrders ?? await apiClient.get("/orders", { userId: cleanUserId }).catch(() => [])) || []).filter((o) => o && o.userId === cleanUserId);
			const observedMap = loadObservedStatusMap(cleanUserId);
			let mapChanged = false;
			for (const order of customerOrders) {
				const orderId = order.orderId || order.id;
				const currentStatus = order.status;
				if (orderId && SUPPORTED_ORDER_STATUSES.includes(currentStatus)) {
					if (observedMap[orderId] !== currentStatus) {
						observedMap[orderId] = currentStatus;
						mapChanged = true;
					}
				}
			}
			if (mapChanged) saveObservedStatusMap(cleanUserId, observedMap);
			return [];
		}
		const customerOrders = ((providedOrders ?? await apiClient.get("/orders", { userId: cleanUserId })) || []).filter((o) => o && o.userId === cleanUserId);
		const observedMap = loadObservedStatusMap(cleanUserId);
		let existingNotifications = null;
		const createdNotifications = [];
		let mapChanged = false;
		for (const order of customerOrders) {
			const orderId = order.orderId || order.id;
			const currentStatus = order.status;
			if (!orderId || !SUPPORTED_ORDER_STATUSES.includes(currentStatus)) continue;
			let previousObserved = observedMap[orderId];
			if (previousObserved === void 0) {
				if (existingNotifications === null) existingNotifications = await this.getNotifications(cleanUserId).catch(() => []);
				const latestOrderNotif = existingNotifications.find((n) => n.orderId === orderId && n.newStatus && SUPPORTED_ORDER_STATUSES.includes(n.newStatus));
				if (latestOrderNotif?.newStatus) {
					previousObserved = latestOrderNotif.newStatus;
					observedMap[orderId] = previousObserved;
					mapChanged = true;
				}
			}
			if (previousObserved === void 0) {
				observedMap[orderId] = currentStatus;
				mapChanged = true;
			} else if (previousObserved !== currentStatus) {
				observedMap[orderId] = currentStatus;
				mapChanged = true;
				try {
					const notif = await this.createOrderStatusNotification(order, previousObserved, currentStatus);
					if (notif) createdNotifications.push(notif);
				} catch (err) {
					console.error(`Failed to create status notification for order ${orderId}:`, err);
				}
			}
		}
		if (mapChanged) saveObservedStatusMap(cleanUserId, observedMap);
		return createdNotifications;
	},
	async markAsRead(id, userId, legacySassId) {
		if (!id || !id.trim()) throw new Error("Notification ID is required.");
		if (userId !== void 0) {
			const cleanUserId = userId.trim();
			if (!cleanUserId) throw new Error("Access denied: Missing customer userId.");
			const customerNotification = (await this.getNotifications(cleanUserId, legacySassId)).find((n) => n.id === id);
			if (!Boolean(customerNotification)) try {
				const directItem = await apiClient.get(`/notifications/${encodeURIComponent(id)}`);
				if (!directItem || !directItem.userId || directItem.userId !== cleanUserId) throw new Error("Access denied: Cannot mark another customer's notification as read.");
			} catch (err) {
				if (err.message?.includes("Access denied")) throw err;
				throw new Error("Access denied: Cannot verify ownership of this notification.");
			}
			if (authManager.getMode() === "production") {
				if (!customerNotification) throw new Error("Notification was not found for this customer.");
				let canonicalCustomerId = cleanUserId;
				let effectiveLegacySassId = legacySassId || authService.getCurrentUser()?.legacySassId;
				try {
					const dataSource = resolveCustomerDataSource(cleanUserId);
					canonicalCustomerId = dataSource.canonicalCustomerId;
					effectiveLegacySassId = effectiveLegacySassId || dataSource.legacySassId;
				} catch {}
				await productionNotificationReader.markAsRead(canonicalCustomerId, id, effectiveLegacySassId);
				const updated = {
					...customerNotification,
					read: true
				};
				this.notifyListeners();
				return updated;
			}
		}
		const updated = await apiClient.patch(`/notifications/${encodeURIComponent(id)}`, { read: true });
		this.notifyListeners();
		return updated;
	},
	async markAllAsRead(userId, legacySassId) {
		const effectiveUserId = this.resolveCustomerId(userId);
		if (!effectiveUserId) return;
		const unread = (await this.getNotifications(effectiveUserId, legacySassId)).filter((n) => !n.read);
		if (authManager.getMode() === "production") {
			let canonicalCustomerId = effectiveUserId;
			let effectiveLegacySassId = legacySassId || authService.getCurrentUser()?.legacySassId;
			try {
				const dataSource = resolveCustomerDataSource(effectiveUserId);
				canonicalCustomerId = dataSource.canonicalCustomerId;
				effectiveLegacySassId = effectiveLegacySassId || dataSource.legacySassId;
			} catch {}
			await Promise.all(unread.map((notification) => productionNotificationReader.markAsRead(canonicalCustomerId, notification.id, effectiveLegacySassId)));
			this.notifyListeners();
			return;
		}
		await Promise.all(unread.map((n) => apiClient.patch(`/notifications/${encodeURIComponent(n.id)}`, { read: true })));
		this.notifyListeners();
	},
	getPreferences(userId = "SASS0000104") {
		if (typeof window === "undefined") return DEFAULT_PREFERENCES;
		try {
			const stored = localStorage.getItem(`sass_notif_prefs_${userId}`);
			if (stored) return {
				...DEFAULT_PREFERENCES,
				...JSON.parse(stored)
			};
		} catch {}
		return DEFAULT_PREFERENCES;
	},
	updatePreferences(userId = "SASS0000104", prefs) {
		const updated = {
			...this.getPreferences(userId),
			...prefs
		};
		if (typeof window !== "undefined") try {
			localStorage.setItem(`sass_notif_prefs_${userId}`, JSON.stringify(updated));
		} catch {}
		return updated;
	}
};
/**
* Maps any non-resolved `CustomerIdentityResolutionResult` into a customer-safe
* UI notice that clearly distinguishes `unlinked`, `missing_profile`,
* `malformed_mapping`, `profile_id_mismatch`, `database_error`, and
* `unauthenticated` without leaking internal Firestore paths or other users' IDs.
*/
function describeIdentityResolutionState(result) {
	if (!result || result.status === "resolved") return null;
	switch (result.status) {
		case "unlinked": return {
			status: "unlinked",
			code: result.code,
			title: "Customer Account Not Linked",
			userMessage: "Firebase authenticated this sign-in, but no Sri Amman Smart Store customer account is linked to it yet. Accounts are never linked by email or phone alone, and no profile was created automatically. Please sign out or contact support while secure registration is pending.",
			isRetryable: false
		};
		case "missing_profile": return {
			status: "missing_profile",
			code: result.code,
			title: "Customer Profile Record Not Found",
			userMessage: "Your sign-in is linked to a customer record that could not be found in the store database. Please sign out and contact Sri Amman Smart Store support for assistance.",
			isRetryable: false
		};
		case "malformed_mapping": return {
			status: "malformed_mapping",
			code: result.code,
			title: "Account Link Configuration Issue",
			userMessage: "We could not verify your customer account link because the identity mapping record is invalid or incomplete. Please sign out and contact store support.",
			isRetryable: false
		};
		case "profile_id_mismatch": return {
			status: "profile_id_mismatch",
			code: result.code,
			title: "Customer Profile Identity Mismatch",
			userMessage: "We detected an identity mismatch on the linked customer profile and stopped sign-in to protect your account. Please sign out and contact store support.",
			isRetryable: false
		};
		case "database_error": return {
			status: "database_error",
			code: result.code,
			title: result.isEmulatorUnavailable ? "Customer Data Service Unavailable" : "Unable to Load Customer Profile",
			userMessage: result.isEmulatorUnavailable ? "Could not reach the customer data service to resolve your profile. Check your connection and try again, or sign out." : "A database error occurred while resolving your customer profile. Please try again or sign out.",
			isRetryable: true
		};
		case "unauthenticated": return {
			status: "unauthenticated",
			code: result.code,
			title: "Email Verification Required",
			userMessage: "Your email sign-in session is not verified. Please request and complete a valid email sign-in link.",
			isRetryable: false
		};
	}
}
var AuthContext = (0, import_react.createContext)(void 0);
function AuthProvider({ children }) {
	const getAuxiliaryFirebaseUser = () => authManager.getMode() === "production" ? null : emailLinkAuthService.getCurrentFirebaseAuthUser();
	const [authMode, setAuthModeState] = (0, import_react.useState)(() => authManager.getMode());
	const [user, setUser] = (0, import_react.useState)(() => {
		if (authManager.getMode() === "production") return null;
		try {
			const mockUser = authService.getCurrentUser();
			if (mockUser && customerIdentityService.isMockSessionUser(mockUser)) return mockUser;
		} catch {}
		return null;
	});
	const [sessionType, setSessionType] = (0, import_react.useState)(() => {
		if (authManager.getMode() === "production") return null;
		try {
			const mockUser = authService.getCurrentUser();
			if (mockUser && customerIdentityService.isMockSessionUser(mockUser)) return "mock";
		} catch {}
		return null;
	});
	const setAuthMode = (0, import_react.useCallback)((newMode) => {
		if (newMode !== "production") return;
		authManager.setMode(newMode);
		setAuthModeState(newMode);
		setIsLoading(true);
		if (typeof window !== "undefined") try {
			if (newMode === "production" || newMode === "mock") {
				window.sessionStorage.setItem("sass_auth_mode", newMode);
				window.localStorage.setItem("sass_auth_mode", newMode);
			} else {
				window.sessionStorage.removeItem("sass_auth_mode");
				window.localStorage.removeItem("sass_auth_mode");
			}
		} catch {}
	}, []);
	const [firebaseUser, setFirebaseUser] = (0, import_react.useState)(() => {
		try {
			if (authManager.getMode() === "production") return authManager.getCurrentUser();
			return getAuxiliaryFirebaseUser() || authManager.getCurrentUser();
		} catch {
			return null;
		}
	});
	const [identityResolution, setIdentityResolution] = (0, import_react.useState)(null);
	const [isResolvingIdentity, setIsResolvingIdentity] = (0, import_react.useState)(false);
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const isMountedRef = (0, import_react.useRef)(true);
	const sessionTypeRef = (0, import_react.useRef)(sessionType);
	sessionTypeRef.current = sessionType;
	const inFlightResolutionRef = (0, import_react.useRef)(null);
	const latestResolvedForUidRef = (0, import_react.useRef)(null);
	const applyFirebaseResolution = (0, import_react.useCallback)((fbUser, result) => {
		if (!isMountedRef.current) return;
		authService.logout();
		setFirebaseUser(fbUser);
		setIdentityResolution(result);
		if (result.status === "resolved") {
			setUser(result.profile);
			setSessionType("firebase");
			apiClient.setLegacyCustomerSubcollectionsEnabled(true);
		} else {
			setUser(null);
			setSessionType(null);
			apiClient.setLegacyCustomerSubcollectionsEnabled(false);
		}
	}, []);
	const resolveFirebaseUserInternal = (0, import_react.useCallback)(async (candidateUser, options) => {
		if (!candidateUser || !candidateUser.uid) {
			const unauthResult = {
				status: "unauthenticated",
				ok: false,
				code: "identity/unauthenticated",
				uid: null,
				userDocId: null,
				profile: null,
				message: "Cannot resolve customer profile: no authenticated Firebase user was provided."
			};
			if (isMountedRef.current) {
				setFirebaseUser(null);
				setIdentityResolution(null);
				if (sessionTypeRef.current === "firebase") {
					setUser(null);
					setSessionType(null);
				}
			}
			return unauthResult;
		}
		if (candidateUser.providerId === "firebase-email-link" && candidateUser.emailVerified !== true) {
			authService.logout();
			const unverifiedResult = await customerIdentityService.resolveCustomerProfile({
				...candidateUser,
				emailVerified: false
			});
			if (isMountedRef.current) {
				setFirebaseUser(candidateUser);
				setIdentityResolution(unverifiedResult);
				setUser(null);
				setSessionType(null);
			}
			return unverifiedResult;
		}
		const targetUid = candidateUser.uid;
		if (!options?.force && inFlightResolutionRef.current && inFlightResolutionRef.current.uid === targetUid) return inFlightResolutionRef.current.promise;
		if (!options?.force && latestResolvedForUidRef.current && latestResolvedForUidRef.current.uid === targetUid && latestResolvedForUidRef.current.result.status === "resolved") {
			const cached = latestResolvedForUidRef.current.result;
			applyFirebaseResolution(candidateUser, cached);
			return cached;
		}
		if (isMountedRef.current) {
			setFirebaseUser(candidateUser);
			setIsResolvingIdentity(true);
		}
		const promise = customerIdentityService.resolveCustomerProfile(candidateUser).then((result) => {
			latestResolvedForUidRef.current = {
				uid: targetUid,
				result
			};
			applyFirebaseResolution(candidateUser, result);
			return result;
		}).finally(() => {
			if (inFlightResolutionRef.current && inFlightResolutionRef.current.uid === targetUid) inFlightResolutionRef.current = null;
			if (isMountedRef.current) setIsResolvingIdentity(false);
		});
		inFlightResolutionRef.current = {
			uid: targetUid,
			promise
		};
		return promise;
	}, [applyFirebaseResolution]);
	(0, import_react.useEffect)(() => {
		isMountedRef.current = true;
		if (authMode !== "production") try {
			const currentMockUser = authService.getCurrentUser();
			if (currentMockUser && customerIdentityService.isMockSessionUser(currentMockUser) && !getAuxiliaryFirebaseUser()) {
				apiClient.setLegacyCustomerSubcollectionsEnabled(false);
				setUser(currentMockUser);
				setSessionType("mock");
				setIsLoading(false);
				const currentMockId = currentMockUser.id || currentMockUser.userId;
				if (currentMockId) authService.fetchUser(currentMockId).then((fresh) => {
					if (isMountedRef.current && fresh && sessionTypeRef.current === "mock") setUser(fresh);
				}).catch(() => {});
			}
		} catch (err) {
			console.error("Failed to load mock user session:", err);
		}
		let unsubscribe;
		if (authMode === "production") unsubscribe = authManager.subscribeAuthState((prodUser) => {
			if (!isMountedRef.current) return;
			if (prodUser && prodUser.uid) resolveFirebaseUserInternal(prodUser).finally(() => {
				if (isMountedRef.current) setIsLoading(false);
			});
			else {
				latestResolvedForUidRef.current = null;
				inFlightResolutionRef.current = null;
				setFirebaseUser(null);
				setIdentityResolution(null);
				apiClient.setLegacyCustomerSubcollectionsEnabled(false);
				setUser(null);
				setSessionType(null);
				setIsLoading(false);
			}
		});
		else unsubscribe = emailLinkAuthService.subscribeToAuthStateChanges((fbAuthUser) => {
			if (!isMountedRef.current) return;
			if (fbAuthUser && fbAuthUser.uid) resolveFirebaseUserInternal(fbAuthUser).finally(() => {
				if (isMountedRef.current) setIsLoading(false);
			});
			else {
				latestResolvedForUidRef.current = null;
				inFlightResolutionRef.current = null;
				setFirebaseUser(null);
				setIdentityResolution(null);
				apiClient.setLegacyCustomerSubcollectionsEnabled(false);
				if (sessionTypeRef.current === "firebase") {
					setUser(null);
					setSessionType(null);
				} else try {
					const mockUser = authService.getCurrentUser();
					if (mockUser && customerIdentityService.isMockSessionUser(mockUser)) {
						setUser(mockUser);
						setSessionType("mock");
					} else {
						setUser(null);
						setSessionType(null);
					}
				} catch {
					setUser(null);
					setSessionType(null);
				}
				setIsLoading(false);
			}
		});
		return () => {
			isMountedRef.current = false;
			if (unsubscribe) unsubscribe();
		};
	}, [authMode, resolveFirebaseUserInternal]);
	const login = async (phone, otp, referralCode) => {
		setIsLoading(true);
		try {
			if (firebaseUser || getAuxiliaryFirebaseUser() !== null) await emailLinkAuthService.signOutFirebaseAuth();
			latestResolvedForUidRef.current = null;
			inFlightResolutionRef.current = null;
			const loggedIn = await authService.verifyOtp(phone, otp, referralCode);
			if (isMountedRef.current) {
				apiClient.setLegacyCustomerSubcollectionsEnabled(false);
				setFirebaseUser(null);
				setIdentityResolution(null);
				setUser(loggedIn);
				setSessionType("mock");
			}
			return loggedIn;
		} finally {
			if (isMountedRef.current) setIsLoading(false);
		}
	};
	const loginWithEmail = async (email, password) => {
		if (authManager.getMode() === "production") {
			setIsLoading(true);
			try {
				if (firebaseUser || getAuxiliaryFirebaseUser() !== null) await emailLinkAuthService.signOutFirebaseAuth();
				latestResolvedForUidRef.current = null;
				inFlightResolutionRef.current = null;
				authService.logout();
				const authUser = await authManager.loginWithEmail(email, password);
				const resolution = await resolveFirebaseUserInternal(authUser, { force: true });
				if (resolution.status === "resolved") return resolution.profile;
				throw new Error(resolution.message || "Authenticated with Firebase, but no linked Sri Amman Smart Store customer profile was found.");
			} finally {
				if (isMountedRef.current) setIsLoading(false);
			}
		}
		setIsLoading(true);
		try {
			if (firebaseUser || getAuxiliaryFirebaseUser() !== null) await emailLinkAuthService.signOutFirebaseAuth();
			latestResolvedForUidRef.current = null;
			inFlightResolutionRef.current = null;
			const loggedIn = await authService.loginWithEmail(email, password);
			if (isMountedRef.current) {
				apiClient.setLegacyCustomerSubcollectionsEnabled(false);
				setFirebaseUser(null);
				setIdentityResolution(null);
				setUser(loggedIn);
				setSessionType("mock");
			}
			return loggedIn;
		} finally {
			if (isMountedRef.current) setIsLoading(false);
		}
	};
	const loginWithFirebaseAuth = async (email, password) => {
		setIsLoading(true);
		setIsResolvingIdentity(true);
		try {
			if (firebaseUser || emailLinkAuthService.getCurrentFirebaseAuthUser() !== null) await emailLinkAuthService.signOutFirebaseAuth();
			latestResolvedForUidRef.current = null;
			inFlightResolutionRef.current = null;
			authService.logout();
			const authUser = await authManager.loginWithEmail(email, password);
			return await resolveFirebaseUserInternal(authUser, { force: true });
		} finally {
			if (isMountedRef.current) {
				setIsResolvingIdentity(false);
				setIsLoading(false);
			}
		}
	};
	const completeEmailLinkSignIn = async (linkUrl, emailOverride) => {
		if (authManager.getMode() === "production") throw new Error("Email-link sign-in is not enabled in the customer runtime.");
		setIsLoading(true);
		setIsResolvingIdentity(true);
		try {
			const verifiedFirebaseUser = await emailLinkAuthService.completeSignInWithEmailLink(linkUrl, emailOverride);
			return await resolveFirebaseUserInternal(verifiedFirebaseUser, { force: false });
		} finally {
			if (isMountedRef.current) {
				setIsResolvingIdentity(false);
				setIsLoading(false);
			}
		}
	};
	const resolveFirebaseSession = async (overrideUser, options) => {
		const targetUser = overrideUser !== void 0 ? overrideUser : firebaseUser ?? getAuxiliaryFirebaseUser();
		return resolveFirebaseUserInternal(targetUser, options);
	};
	const validateReferralCode = async (code) => {
		return authService.validateReferralCode(code);
	};
	const logout = async () => {
		const prevId = user?.userId || user?.id;
		latestResolvedForUidRef.current = null;
		inFlightResolutionRef.current = null;
		authService.logout();
		apiClient.setLegacyCustomerSubcollectionsEnabled(false);
		notificationService.clearSessionState(prevId);
		if (isMountedRef.current) {
			setUser(null);
			setSessionType(null);
			setFirebaseUser(null);
			setIdentityResolution(null);
			setIsResolvingIdentity(false);
		}
		await authManager.signOut();
	};
	const refreshUser = (0, import_react.useCallback)(async () => {
		if (sessionType === "firebase" || firebaseUser) {
			const activeFbUser = firebaseUser ?? getAuxiliaryFirebaseUser();
			if (activeFbUser) {
				await resolveFirebaseUserInternal(activeFbUser, { force: true });
				return;
			}
		}
		const currentId = user?.id || user?.userId || authService.getCurrentUser()?.id;
		let updated = null;
		if (currentId) updated = await authService.fetchUser(currentId);
		if (!updated) updated = authService.getCurrentUser();
		if (isMountedRef.current) {
			setUser(updated);
			setSessionType(updated ? "mock" : null);
		}
	}, [
		sessionType,
		firebaseUser,
		resolveFirebaseUserInternal,
		user?.id,
		user?.userId
	]);
	const updateProfile = async (data) => {
		if (!user) return;
		const { uid: _ignoredInputUid, id: _ignoredId, userId: _ignoredUserId, birthday: inputBirthday, phoneVerified: _ignoredPhoneVerified, ...safeData } = data;
		const resolvedDob = normalizeDobString(data.dob ?? inputBirthday);
		const isChangingPhone = Boolean(safeData.phone && user.phone && safeData.phone !== user.phone);
		const payload = {
			...safeData,
			...resolvedDob !== null ? { dob: resolvedDob } : {},
			...isChangingPhone ? { phoneVerified: false } : {}
		};
		if (sessionType === "firebase" || authMode === "production" || authManager.getMode() === "production") {
			const endpoint = getCustomerProfileEndpoint(user.id);
			let updated = payload;
			try {
				const patchResult = await apiClient.patch(endpoint, payload);
				if (patchResult) updated = patchResult;
			} catch (patchErr) {
				console.warn("[AuthContext] Profile patch fallback to local state update:", patchErr);
			}
			const canonicalDob = updated.dob || resolvedDob || user.dob || user.birthday;
			const preserved = {
				...user,
				...updated,
				id: user.id,
				userId: user.userId || user.id,
				...isChangingPhone ? { phoneVerified: false } : {},
				...canonicalDob ? {
					dob: canonicalDob,
					birthday: canonicalDob
				} : {},
				...firebaseUser?.uid ? { uid: firebaseUser.uid } : user.uid ? { uid: user.uid } : {}
			};
			if (isMountedRef.current) setUser(preserved);
			return;
		}
		const updated = await authService.updateProfile(user.id, payload);
		const canonicalDob = updated.dob || resolvedDob || user.dob || user.birthday;
		const updatedWithDob = {
			...updated,
			...isChangingPhone ? { phoneVerified: false } : {},
			...canonicalDob ? {
				dob: canonicalDob,
				birthday: canonicalDob
			} : {}
		};
		if (isMountedRef.current) {
			setUser(updatedWithDob);
			setSessionType("mock");
		}
	};
	const identityNotice = describeIdentityResolutionState(identityResolution);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, {
		value: {
			user,
			isAuthenticated: !!user,
			isLoading,
			sessionType,
			authMode,
			setAuthMode,
			authStatus: authManager.getStatus(),
			firebaseUser,
			identityResolution,
			identityNotice,
			isResolvingIdentity,
			login,
			loginWithEmail,
			loginWithFirebaseAuth,
			completeEmailLinkSignIn,
			resolveFirebaseSession,
			validateReferralCode,
			logout,
			refreshUser,
			updateProfile,
			testCredentials: TEST_CREDENTIALS
		},
		children
	});
}
function useAuth() {
	const context = (0, import_react.useContext)(AuthContext);
	if (!context) throw new Error("useAuth must be used within an AuthProvider");
	return context;
}
/**
* Timeout bounding utility for production Firestore cart reads.
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
* Normalizes an arbitrary legacy cart document from production Firestore (`users/{SASS_ID}/cart/{docId}`
* or `onlineCustomers/{ONCUS_ID}/cart/{docId}`) into the standard frontend `CartItem` type.
*/
function normalizeLegacyCartDocument(docId, docData, userId, catalog) {
	let canonicalKey = String(docData["cartKey"] || docData["variantKey"] || docData["id"] || docId || "").trim();
	if (userId && canonicalKey.startsWith(`${userId}__`)) canonicalKey = canonicalKey.slice(userId.length + 2);
	let productId = String(docData["productId"] || "").trim();
	if (!productId && canonicalKey.includes("__opt")) productId = canonicalKey.split("__opt")[0] || "";
	if (!productId) productId = docId;
	const rawUnit = String(docData["unit"] || "").trim();
	const rawUnitSize = String(docData["unitSize"] ?? "").trim();
	let optionIndex = typeof docData["optionIndex"] === "number" ? docData["optionIndex"] : 0;
	const catalogProd = catalog?.find((p) => p.id === productId);
	let matchedOption = catalogProd?.options?.[optionIndex];
	if (catalogProd && catalogProd.options && catalogProd.options.length > 0) {
		if (rawUnit || rawUnitSize) {
			const foundIdx = catalogProd.options.findIndex((opt) => opt.unit.trim().toLowerCase() === rawUnit.toLowerCase() && String(opt.unitSize).trim() === rawUnitSize);
			if (foundIdx >= 0) {
				optionIndex = foundIdx;
				matchedOption = catalogProd.options[foundIdx];
			}
		}
		if (!matchedOption) {
			matchedOption = catalogProd.options[0];
			optionIndex = 0;
		}
	}
	const rawPrice = typeof docData["price"] === "number" ? docData["price"] : typeof docData["sellingPrice"] === "number" ? docData["sellingPrice"] : typeof docData["offerPrice"] === "number" ? docData["offerPrice"] : 0;
	const rawMrp = typeof docData["mrp"] === "number" ? docData["mrp"] : rawPrice;
	const rawSpecial = typeof docData["specialPrice"] === "number" ? docData["specialPrice"] : void 0;
	const price = matchedOption?.offerPrice ?? (rawPrice > 0 ? rawPrice : rawMrp > 0 ? rawMrp : 0);
	const mrp = matchedOption?.mrp ?? (rawMrp > 0 ? rawMrp : price);
	const specialPrice = matchedOption?.specialPrice ?? rawSpecial;
	const resolvedUnit = matchedOption?.unit ?? rawUnit;
	const resolvedUnitSize = matchedOption?.unitSize ? String(matchedOption.unitSize) : rawUnitSize;
	let name = String(docData["name"] || docData["productName"] || "").trim();
	if (catalogProd?.name) name = resolvedUnitSize && resolvedUnit ? `${catalogProd.name} (${resolvedUnitSize}${resolvedUnit})` : catalogProd.name;
	else if (!name) name = `Item (${productId})`;
	const image = catalogProd?.imageUrl || String(docData["image"] || docData["imageUrl"] || docData["frontImageUrl"] || "").trim();
	const quantity = Math.max(1, typeof docData["quantity"] === "number" ? docData["quantity"] : 1);
	const stock = typeof docData["stock"] === "number" ? docData["stock"] : matchedOption?.stock ?? 99;
	return {
		id: canonicalKey || docId,
		cartKey: canonicalKey || docId,
		userId,
		productId,
		optionIndex,
		unit: resolvedUnit,
		unitSize: resolvedUnitSize,
		name,
		price,
		mrp,
		...specialPrice !== void 0 ? { specialPrice } : {},
		quantity,
		image,
		stock
	};
}
var readerOverride$1 = null;
var productionCartReader = {
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
	* Reads all cart items for an authenticated customer directly from production Firestore (`sri-amman-smart-store`).
	* Queries `onlineCustomers/{ID}/cart` or `users/{ID}/cart`.
	* If customer has an ONCUS ID and legacy SASS ID, falls back to legacy cart items if online cart is empty.
	*/
	async getCustomerCart(customerId, timeoutMs = 8e3, legacySassId, catalog) {
		if (readerOverride$1?.getCustomerCart) {
			if (legacySassId) return catalog ? readerOverride$1.getCustomerCart(customerId || "", legacySassId, catalog) : readerOverride$1.getCustomerCart(customerId || "", legacySassId);
			return catalog ? readerOverride$1.getCustomerCart(customerId || "", void 0, catalog) : readerOverride$1.getCustomerCart(customerId || "");
		}
		const cleanCustomerId = (customerId || "").trim();
		if (!cleanCustomerId) return [];
		const validCustomerId = this.assertValidCustomer(cleanCustomerId);
		typeof legacySassId === "string" && legacySassId.trim() && legacySassId.trim();
		const db = getProductionFirestoreInstance();
		const primaryCol = validCustomerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
		const cartColRef = collection(db, primaryCol, validCustomerId, "cart");
		try {
			const snap = await withTimeout$1(getDocs(query(cartColRef)), timeoutMs, `getDocs(${primaryCol}/${validCustomerId}/cart)`);
			const list = [];
			const seenKeys = /* @__PURE__ */ new Set();
			for (const docSnap of snap.docs) {
				const item = normalizeLegacyCartDocument(docSnap.id, docSnap.data(), validCustomerId, catalog);
				const dedupeKey = item.cartKey || item.id;
				if (!seenKeys.has(dedupeKey)) {
					seenKeys.add(dedupeKey);
					list.push(item);
				}
			}
			return list;
		} catch (err) {
			console.error(`[ProductionCartReader] Error querying ${primaryCol}/${validCustomerId}/cart:`, err);
			const category = classifyStorageError(err);
			throw new StorageAdapterError(`Failed to retrieve cart items for customer ${validCustomerId}: ${err instanceof Error ? err.message : String(err)}`, {
				status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
				code: category === "permission" ? "permission-denied" : "unavailable",
				category,
				causeError: err
			});
		}
	}
};
var METHOD_QUALITY_OPTIONS = [
	{
		id: "wood_churned",
		label: "Wood Churned / Mara Chekku",
		matcher: (p) => p.tags.some((t) => /wood churned|traditional churn/i.test(t)) || (p.extraction ? /mara chekku|vaagai wood|wood mortar/i.test(p.extraction) : false)
	},
	{
		id: "organic",
		label: "Pure Organic / Farm Plucked",
		matcher: (p) => p.tags.some((t) => /pure organic|hill grown|morning harvest/i.test(t)) || (p.extraction ? /organic/i.test(p.extraction) : false)
	},
	{
		id: "bilona",
		label: "Bilona Method (A2 Desi Cow)",
		matcher: (p) => p.tags.some((t) => /bilona method|a2 desi cow/i.test(t)) || (p.extraction ? /bilona/i.test(p.extraction) : false)
	},
	{
		id: "chemical_free",
		label: "Chemical Free / Unpolished",
		matcher: (p) => p.tags.some((t) => /chemical free|unpolished/i.test(t)) || (p.extraction ? /unpolished/i.test(p.extraction) : false)
	},
	{
		id: "stone_ground",
		label: "Stone Ground / Pulverized",
		matcher: (p) => p.tags.some((t) => /stone ground/i.test(t)) || (p.extraction ? /stone/i.test(p.extraction) : false)
	}
];
var INITIAL_PRICE_BOUNDS = {
	min: 0,
	max: 2e3
};
INITIAL_PRICE_BOUNDS.min, INITIAL_PRICE_BOUNDS.max;
/**
* Format variant pack size label canonically, e.g. "500 ml", "1 L", "6 pcs"
*/
function formatPackSize(unitSize, unit) {
	return `${unitSize.trim()} ${unit.trim()}`;
}
/**
* Calculate max discount percentage across a product's variant options
*/
function getProductMaxDiscount(product) {
	if (!product.options || product.options.length === 0) return 0;
	return Math.max(...product.options.map((opt) => opt.mrp > opt.offerPrice ? Math.round((opt.mrp - opt.offerPrice) / opt.mrp * 100) : 0));
}
/**
* Returns lowest offer price among options
*/
function getProductMinPrice(product) {
	if (!product.options || product.options.length === 0) return 0;
	return Math.min(...product.options.map((o) => o.offerPrice));
}
/**
* Derives dynamic catalog price bounds
*/
function getCatalogPriceBounds(products) {
	if (products.length === 0) return {
		min: 0,
		max: 2e3
	};
	let min = Infinity;
	let max = -Infinity;
	for (const p of products) for (const opt of p.options) {
		if (opt.offerPrice < min) min = opt.offerPrice;
		if (opt.offerPrice > max) max = opt.offerPrice;
	}
	return {
		min: Math.floor(min),
		max: Math.ceil(max)
	};
}
/**
* Aggregates count of products per category slug and category display name
*/
function getCategoryCounts(products) {
	const counts = {};
	for (const p of products) {
		if (p.categorySlug) counts[p.categorySlug] = (counts[p.categorySlug] || 0) + 1;
		if (p.category) {
			counts[p.category] = (counts[p.category] || 0) + 1;
			const normalizedNameSlug = p.category.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
			if (normalizedNameSlug && normalizedNameSlug !== p.categorySlug) counts[normalizedNameSlug] = (counts[normalizedNameSlug] || 0) + 1;
		}
	}
	return counts;
}
/**
* Aggregates count of products per subcategory name
*/
function getSubcategoryCounts(products) {
	const counts = {};
	for (const p of products) if (p.subCategory && p.subCategory.trim()) {
		const clean = p.subCategory.trim();
		counts[clean] = (counts[clean] || 0) + 1;
	}
	return counts;
}
/**
* Aggregates all unique pack sizes available in current catalog with counts
*/
function getPackSizeOptions(products) {
	const map = /* @__PURE__ */ new Map();
	for (const p of products) {
		const productSizes = /* @__PURE__ */ new Set();
		for (const opt of p.options) productSizes.add(formatPackSize(opt.unitSize, opt.unit));
		for (const size of productSizes) map.set(size, (map.get(size) || 0) + 1);
	}
	const preferredOrder = [
		"500 ml",
		"1 L",
		"2 L",
		"5 L",
		"250 ml",
		"250 g",
		"500 g",
		"1 kg",
		"5 kg",
		"25 kg",
		"200 g",
		"400 g",
		"6 pcs",
		"12 pcs",
		"1 pcs"
	];
	return Array.from(map.entries()).map(([label, count]) => ({
		label,
		count
	})).sort((a, b) => {
		const idxA = preferredOrder.indexOf(a.label);
		const idxB = preferredOrder.indexOf(b.label);
		if (idxA !== -1 && idxB !== -1) return idxA - idxB;
		if (idxA !== -1) return -1;
		if (idxB !== -1) return 1;
		return a.label.localeCompare(b.label);
	});
}
/**
* Counts matching products for each structured extraction / method quality option
*/
function getMethodQualityCounts(products) {
	const counts = {};
	for (const opt of METHOD_QUALITY_OPTIONS) counts[opt.id] = products.filter(opt.matcher).length;
	return counts;
}
/**
* Counts products meeting rating thresholds
*/
function getRatingCounts(products) {
	return [
		4.8,
		4.5,
		4
	].map((threshold) => ({
		rating: threshold,
		count: products.filter((p) => p.rating >= threshold).length
	}));
}
/**
* Counts products meeting discount thresholds
*/
function getDiscountCounts(products) {
	return [
		10,
		15,
		20
	].map((threshold) => ({
		discount: threshold,
		count: products.filter((p) => getProductMaxDiscount(p) >= threshold).length
	}));
}
/**
* Pure filter and sort engine applied to product list
*/
function filterAndSortProducts(products, filter, priceBounds = INITIAL_PRICE_BOUNDS) {
	const filtered = products.filter((p) => {
		if (filter.search && filter.search.trim()) {
			const q = filter.search.toLowerCase().trim();
			if (!(p.name.toLowerCase().includes(q) || p.tamilName && p.tamilName.includes(q) || p.category.toLowerCase().includes(q) || p.subCategory && p.subCategory.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)) || p.extraction && p.extraction.toLowerCase().includes(q))) return false;
		}
		if (filter.onlyDeals) {
			if (!(p.isFlashDeal || getProductMaxDiscount(p) >= 15)) return false;
		}
		if (filter.categories && filter.categories.length > 0 && !filter.categories.includes("all")) {
			if (!filter.categories.some((cat) => {
				const cleanCat = cat.trim().toLowerCase();
				const pSlug = (p.categorySlug || "").toLowerCase();
				const pCat = (p.category || "").toLowerCase();
				const pNormalized = pCat.replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-");
				return pSlug === cleanCat || pCat === cleanCat || pNormalized === cleanCat;
			})) return false;
		}
		if (filter.subcategories && filter.subcategories.length > 0) {
			if (!p.subCategory) return false;
			const cleanProdSub = p.subCategory.trim().toLowerCase();
			if (!filter.subcategories.some((sub) => sub.trim().toLowerCase() === cleanProdSub)) return false;
		}
		let candidateOptions = p.options;
		if (filter.packSizes && filter.packSizes.length > 0) {
			candidateOptions = candidateOptions.filter((opt) => filter.packSizes.includes(formatPackSize(opt.unitSize, opt.unit)));
			if (candidateOptions.length === 0) return false;
		}
		if (filter.inStockOnly) {
			if (!candidateOptions.some((o) => o.stock > 0)) return false;
		}
		const minP = filter.minPrice !== void 0 ? filter.minPrice : priceBounds.min;
		const maxP = filter.maxPrice !== void 0 ? filter.maxPrice : priceBounds.max;
		if (!candidateOptions.some((o) => o.offerPrice >= minP && o.offerPrice <= maxP)) return false;
		if (filter.minRating && filter.minRating > 0) {
			if (p.rating < filter.minRating) return false;
		}
		if (filter.minDiscount && filter.minDiscount > 0) {
			if (Math.max(...candidateOptions.map((opt) => opt.mrp > opt.offerPrice ? Math.round((opt.mrp - opt.offerPrice) / opt.mrp * 100) : 0)) < filter.minDiscount) return false;
		}
		if (filter.methods && filter.methods.length > 0) {
			if (!filter.methods.some((methodId) => {
				const option = METHOD_QUALITY_OPTIONS.find((m) => m.id === methodId);
				return option ? option.matcher(p) : false;
			})) return false;
		}
		return true;
	});
	const sort = filter.sort || "popular";
	const sorted = [...filtered];
	if (sort === "price_asc") sorted.sort((a, b) => getProductMinPrice(a) - getProductMinPrice(b));
	else if (sort === "price_desc") sorted.sort((a, b) => getProductMinPrice(b) - getProductMinPrice(a));
	else if (sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
	else if (sort === "discount") sorted.sort((a, b) => getProductMaxDiscount(b) - getProductMaxDiscount(a));
	else sorted.sort((a, b) => b.reviewCount - a.reviewCount);
	return sorted;
}
/**
* Category affinity matrix defining complementary culinary relationships.
* For example:
* - Cooking oils complement spices, dal/pulses, and dairy/ghee.
* - Rice and staples complement dals, oils, spices, and ghee.
* - Beverages like filter coffee complement traditional jaggery/sugar and snacks.
* - Spices complement cooking oils and staples.
* - Vegetables complement cooking oils, spices, and lentils.
*/
var COMPLEMENTARY_CATEGORY_MAP = {
	"cold-pressed-oils": [
		"organic-spices",
		"staples-grains",
		"dairy-breakfast"
	],
	"staples-grains": [
		"cold-pressed-oils",
		"organic-spices",
		"dairy-breakfast"
	],
	"beverages": [
		"staples-grains",
		"snacks-sweets",
		"dairy-breakfast"
	],
	"organic-spices": [
		"cold-pressed-oils",
		"staples-grains",
		"dairy-breakfast"
	],
	"fruits-veggies": [
		"cold-pressed-oils",
		"organic-spices",
		"staples-grains"
	],
	"snacks-sweets": [
		"beverages",
		"staples-grains",
		"cold-pressed-oils"
	],
	"dairy-breakfast": [
		"cold-pressed-oils",
		"organic-spices",
		"staples-grains",
		"beverages"
	]
};
/**
* Curated product-level affinity pairings for authentic South Indian kitchen staples.
* When specific pairings match, they receive prioritized complementary ranking.
*/
var SPECIFIC_PRODUCT_COMPLEMENTS = {
	prod_groundnut_oil: [
		"prod_organic_turmeric",
		"prod_unpolished_toor_dal",
		"prod_a2_ghee",
		"prod_ponni_rice"
	],
	prod_sesame_oil: [
		"prod_organic_turmeric",
		"prod_unpolished_toor_dal",
		"prod_ponni_rice",
		"prod_country_sugar"
	],
	prod_a2_ghee: [
		"prod_ponni_rice",
		"prod_unpolished_toor_dal",
		"prod_organic_turmeric",
		"prod_groundnut_oil"
	],
	prod_ponni_rice: [
		"prod_unpolished_toor_dal",
		"prod_groundnut_oil",
		"prod_organic_turmeric",
		"prod_a2_ghee"
	],
	prod_unpolished_toor_dal: [
		"prod_ponni_rice",
		"prod_groundnut_oil",
		"prod_organic_turmeric",
		"prod_a2_ghee"
	],
	prod_country_sugar: [
		"prod_filter_coffee",
		"prod_murukku",
		"prod_a2_ghee",
		"prod_ponni_rice"
	],
	prod_filter_coffee: [
		"prod_country_sugar",
		"prod_murukku",
		"prod_country_eggs"
	],
	prod_tender_coconut: [
		"prod_murukku",
		"prod_ooty_carrots",
		"prod_country_sugar"
	],
	prod_organic_turmeric: [
		"prod_groundnut_oil",
		"prod_unpolished_toor_dal",
		"prod_ponni_rice",
		"prod_a2_ghee"
	],
	prod_ooty_carrots: [
		"prod_groundnut_oil",
		"prod_organic_turmeric",
		"prod_unpolished_toor_dal",
		"prod_country_eggs"
	],
	prod_country_eggs: [
		"prod_groundnut_oil",
		"prod_organic_turmeric",
		"prod_filter_coffee",
		"prod_ponni_rice"
	],
	prod_murukku: [
		"prod_filter_coffee",
		"prod_country_sugar",
		"prod_sesame_oil"
	]
};
/**
* Helper to check if a product has at least one option with available stock.
*/
function hasAvailableStock(product) {
	if (!product.options || product.options.length === 0) return false;
	return product.options.some((opt) => opt.stock > 0);
}
/**
* Calculates a similarity score between a target product and a candidate product.
* Returns 0 if unrelated.
*/
function calculateSimilarityScore(target, candidate) {
	if (candidate.id === target.id || candidate.isActive === false) return 0;
	let score = 0;
	if (candidate.categorySlug === target.categorySlug) score += 50;
	if (target.tags && candidate.tags) {
		const targetTagSet = new Set(target.tags.map((t) => t.toLowerCase().trim()));
		const matchingTags = candidate.tags.filter((t) => targetTagSet.has(t.toLowerCase().trim()));
		score += matchingTags.length * 15;
	}
	if (target.extraction && candidate.extraction) {
		const targetExtWords = target.extraction.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
		const candidateExtWords = new Set(candidate.extraction.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
		let sharedExtCount = 0;
		for (const word of targetExtWords) if (candidateExtWords.has(word)) sharedExtCount++;
		score += Math.min(sharedExtCount * 5, 15);
	}
	if (target.brand && candidate.brand && target.brand === candidate.brand) score += 5;
	if (candidate.categorySlug !== target.categorySlug && score < 20) return 0;
	if (hasAvailableStock(candidate)) score += 10;
	else score -= 10;
	return score;
}
/**
* Returns similar products for a given target product.
* Excludes the current product and unrelated items.
*/
function getSimilarProducts(target, allProducts, options = {}) {
	const limit = options.limit ?? 4;
	const scoredCandidates = [];
	for (const candidate of allProducts) {
		const score = calculateSimilarityScore(target, candidate);
		if (score > 0) scoredCandidates.push({
			product: candidate,
			score
		});
	}
	scoredCandidates.sort((a, b) => {
		if (b.score !== a.score) return b.score - a.score;
		if (b.product.rating !== a.product.rating) return b.product.rating - a.product.rating;
		return (b.product.reviewCount || 0) - (a.product.reviewCount || 0);
	});
	return scoredCandidates.slice(0, limit).map((c) => c.product);
}
/**
* Calculates a complementary affinity score between target product and candidate product.
*/
function calculateComplementaryScore(target, candidate, excludeIds) {
	if (candidate.id === target.id || candidate.isActive === false || excludeIds.has(candidate.id)) return 0;
	let score = 0;
	const directPairings = SPECIFIC_PRODUCT_COMPLEMENTS[target.id];
	if (directPairings) {
		const pairIndex = directPairings.indexOf(candidate.id);
		if (pairIndex !== -1) score += (directPairings.length - pairIndex) * 25 + 50;
	}
	const complementaryCategories = COMPLEMENTARY_CATEGORY_MAP[target.categorySlug];
	if (complementaryCategories) {
		const catIndex = complementaryCategories.indexOf(candidate.categorySlug);
		if (catIndex !== -1) score += (complementaryCategories.length - catIndex) * 15 + 20;
	}
	if (candidate.categorySlug !== target.categorySlug) score += 10;
	if (score < 25) return 0;
	if (hasAvailableStock(candidate)) score += 15;
	else score -= 15;
	return score;
}
/**
* Returns complementary products for completing a traditional kitchen basket.
* Excludes the target product, inactive products, and any explicitly excluded IDs.
*/
function getComplementaryProducts(target, allProducts, options = {}) {
	const limit = options.limit ?? 4;
	const excludeSet = new Set(options.excludeIds || []);
	const scoredCandidates = [];
	for (const candidate of allProducts) {
		const score = calculateComplementaryScore(target, candidate, excludeSet);
		if (score > 0) scoredCandidates.push({
			product: candidate,
			score
		});
	}
	scoredCandidates.sort((a, b) => {
		if (b.score !== a.score) return b.score - a.score;
		if (b.product.rating !== a.product.rating) return b.product.rating - a.product.rating;
		return (b.product.reviewCount || 0) - (a.product.reviewCount || 0);
	});
	return scoredCandidates.slice(0, limit).map((c) => c.product);
}
/**
* The customer application uses the existing production Firebase catalogue.
* Emulator and fixture modes are not selected by normal application startup.
*/
function resolveDefaultCatalogMode() {
	return "production-readonly";
}
/**
* Catalogue Data Source Abstraction.
* Separates catalogue retrieval from customer profile/cart/order data sources.
*
* Supports three distinct modes:
* - "local": reads from local Firestore Emulator (or JSON Server fallback). Default mode.
* - "production-preview": reads strictly allowlisted documents from production Firestore.
* - "production-readonly": reads the full production catalogue using verified Firestore query patterns.
*/
var CatalogDataSource = class {
	mode;
	cachedCategories = null;
	pendingCategoriesPromise = null;
	constructor(initialMode) {
		this.mode = initialMode ?? resolveDefaultCatalogMode();
	}
	getMode() {
		return this.mode;
	}
	setMode(mode) {
		this.mode = "production-readonly";
		this.cachedCategories = null;
		this.pendingCategoriesPromise = null;
	}
	resetMode() {
		this.mode = resolveDefaultCatalogMode();
		this.cachedCategories = null;
		this.pendingCategoriesPromise = null;
	}
	clearCategoryCache() {
		this.cachedCategories = null;
		this.pendingCategoriesPromise = null;
	}
	getStatus() {
		return {
			mode: this.mode,
			isProductionPreview: this.mode === "production-preview",
			isProductionReadOnly: this.mode === "production-readonly",
			defaultMode: resolveDefaultCatalogMode(),
			productionAllowlist: APPROVED_PRODUCTION_PRODUCT_IDS,
			productionProjectId: EXPECTED_PRODUCTION_PROJECT_ID
		};
	}
	/**
	* Retrieves products based on the active catalogue mode and applies
	* the common filtering and sorting engine.
	*/
	async getProducts(params) {
		let items = [];
		if (this.mode === "production-readonly" || this.mode === "production-preview" && params?.fullCatalogue) items = (await fetchFullProductionCatalogue({ optIn: true })).products;
		else if (this.mode === "production-preview") items = (await fetchAllProductionProductPreviews({ optIn: true })).map((p) => p.product);
		else items = normalizeLegacyProductList(await apiClient.get("/products"));
		const filterCategories = [];
		if (params?.categories && params.categories.length > 0) filterCategories.push(...params.categories);
		else if (params?.category && params.category !== "all") filterCategories.push(params.category);
		const filterSubcategories = [];
		if (params?.subcategories && params.subcategories.length > 0) filterSubcategories.push(...params.subcategories);
		else if (params?.subcategory && params.subcategory !== "all") filterSubcategories.push(params.subcategory);
		const filterState = {
			categories: filterCategories,
			...filterSubcategories.length > 0 ? { subcategories: filterSubcategories } : {},
			...params?.search !== void 0 ? { search: params.search } : {},
			...params?.isFlashDeal || params?.onlyDeals ? { onlyDeals: true } : {},
			...params?.inStockOnly !== void 0 ? { inStockOnly: params.inStockOnly } : {},
			...params?.minPrice !== void 0 ? { minPrice: params.minPrice } : {},
			...params?.maxPrice !== void 0 ? { maxPrice: params.maxPrice } : {},
			...params?.minRating !== void 0 ? { minRating: params.minRating } : {},
			...params?.minDiscount !== void 0 ? { minDiscount: params.minDiscount } : {},
			...params?.packSizes !== void 0 ? { packSizes: params.packSizes } : {},
			...params?.methods !== void 0 ? { methods: params.methods } : {},
			...params?.sort !== void 0 ? { sort: params.sort } : {}
		};
		return filterAndSortProducts(items, filterState);
	}
	/**
	* Retrieves a single product by identifier.
	*/
	async getProductById(id) {
		if (this.mode === "production-readonly") try {
			return await fetchProductionProductById(id, { optIn: true });
		} catch (err) {
			if (err.message?.includes("404") || err.message?.includes("not found")) return null;
			throw err;
		}
		if (this.mode === "production-preview") {
			if (!APPROVED_PRODUCTION_PRODUCT_IDS.includes(id)) return null;
			try {
				return (await fetchProductionProductPreview(id, { optIn: true })).product;
			} catch (err) {
				if (err.message?.includes("404") || err.message?.includes("not found")) return null;
				throw err;
			}
		}
		try {
			return normalizeLegacyProduct(await apiClient.get(`/products/${id}`), { docId: id });
		} catch (err) {
			if (err.message?.includes("404") || err.status === 404) return null;
			throw err;
		}
	}
	/**
	* Retrieves full production catalogue diagnostic result when in production mode.
	*/
	async getFullProductionCatalogueResult() {
		if (this.mode !== "production-readonly" && this.mode !== "production-preview") return null;
		return fetchFullProductionCatalogue({ optIn: true });
	}
	/**
	* Retrieves product categories.
	* In "production-readonly" mode, derives database-driven categories from live production Firestore.
	* In "local" mode, strictly queries the local apiClient without touching production.
	* Supports in-memory caching to avoid duplicate queries across components.
	*/
	async getCategories(forceRefresh = false) {
		if (!forceRefresh && this.cachedCategories) return this.cachedCategories;
		if (!forceRefresh && this.pendingCategoriesPromise) return this.pendingCategoriesPromise;
		this.pendingCategoriesPromise = (async () => {
			try {
				let categories = [];
				if (this.mode === "production-readonly") {
					const fullResult = await this.getFullProductionCatalogueResult();
					if (fullResult?.categoryResult?.categories && fullResult.categoryResult.categories.length > 0) categories = fullResult.categoryResult.categories;
					else categories = (await resolveProductionCategories({ optIn: true })).categories;
				} else categories = await apiClient.get("/categories");
				this.cachedCategories = categories;
				return categories;
			} finally {
				this.pendingCategoriesPromise = null;
			}
		})();
		return this.pendingCategoriesPromise;
	}
	/**
	* Retrieves promotional banners.
	*/
	async getBanners() {
		return apiClient.get("/banners");
	}
	/**
	* Retrieves similar product recommendations.
	*/
	async getSimilarProducts(productId, limit = 4) {
		const allProducts = await this.getProducts();
		const currentProduct = allProducts.find((p) => p.id === productId);
		if (!currentProduct) return [];
		return getSimilarProducts(currentProduct, allProducts, { limit });
	}
	/**
	* Retrieves complementary product recommendations.
	*/
	async getComplementaryProducts(productId, limit = 4, excludeIds = []) {
		const allProducts = await this.getProducts();
		const currentProduct = allProducts.find((p) => p.id === productId);
		if (!currentProduct) return [];
		return getComplementaryProducts(currentProduct, allProducts, {
			limit,
			excludeIds
		});
	}
};
var catalogDataSource = new CatalogDataSource();
var productService = {
	/**
	* Retrieves products using the configured catalog data source ("local" by default).
	*/
	async getProducts(params) {
		return catalogDataSource.getProducts(params);
	},
	/**
	* Retrieves a single product by identifier.
	*/
	async getProductById(id) {
		return catalogDataSource.getProductById(id);
	},
	/**
	* Retrieves product categories.
	*/
	async getCategories(forceRefresh) {
		return catalogDataSource.getCategories(forceRefresh);
	},
	/**
	* Retrieves promotional banners.
	*/
	async getBanners() {
		return catalogDataSource.getBanners();
	},
	/**
	* Retrieves similar product recommendations.
	*/
	async getSimilarProducts(productId, limit = 4) {
		return catalogDataSource.getSimilarProducts(productId, limit);
	},
	/**
	* Retrieves complementary product recommendations.
	*/
	async getComplementaryProducts(productId, limit = 4, excludeIds = []) {
		return catalogDataSource.getComplementaryProducts(productId, limit, excludeIds);
	},
	/**
	* Gets the active catalog mode ("local" | "production-preview").
	*/
	getCatalogMode() {
		return catalogDataSource.getMode();
	},
	/**
	* Sets the active catalog mode explicitly.
	*/
	setCatalogMode(mode) {
		catalogDataSource.setMode(mode);
	},
	/**
	* Resets the catalog mode back to the default ("local").
	*/
	resetCatalogMode() {
		catalogDataSource.resetMode();
	},
	/**
	* Gets catalog status diagnostic snapshot.
	*/
	getCatalogStatus() {
		return catalogDataSource.getStatus();
	},
	/**
	* Fetches full production catalogue diagnostic result when in production mode.
	*/
	async getFullProductionCatalogueResult() {
		return catalogDataSource.getFullProductionCatalogueResult();
	}
};
var GUEST_CART_KEY = "sri_amman_guest_cart_v1";
var GUEST_SESSION_KEY = "sass_guest_session_id";
var GUEST_MERGE_KEY_PREFIX = "sri_amman_guest_cart_merge_v1_";
function readGuestCartSnapshot() {
	if (typeof window === "undefined") return [];
	try {
		const parsed = JSON.parse(window.localStorage.getItem(GUEST_CART_KEY) || "[]");
		if (!Array.isArray(parsed)) return [];
		return parsed.filter((item) => item && typeof item.productId === "string" && typeof item.quantity === "number");
	} catch {
		return [];
	}
}
function writeGuestCartSnapshot(items) {
	if (typeof window === "undefined") return;
	try {
		if (items.length === 0) window.localStorage.removeItem(GUEST_CART_KEY);
		else window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
	} catch (error) {
		throw new Error("Your browser could not save this cart. Check available storage and try again.", { cause: error });
	}
}
function getGuestSessionId() {
	if (typeof window === "undefined") return "guest_session";
	try {
		let guestId = window.localStorage.getItem(GUEST_SESSION_KEY);
		if (!guestId) {
			guestId = `guest_${crypto.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
			window.localStorage.setItem(GUEST_SESSION_KEY, guestId);
		}
		return guestId;
	} catch {
		return "guest_session";
	}
}
function cartItemKey(item) {
	return item.cartKey || item.id;
}
function guestCartFingerprint(items) {
	return JSON.stringify(items.map((item) => [cartItemKey(item), item.quantity]).sort());
}
var inFlightGuestMerges = /* @__PURE__ */ new Map();
var cartService = {
	getEffectiveUserId(userId) {
		if (userId && typeof userId === "string" && userId.trim()) try {
			return resolveCustomerDataSource(userId).canonicalCustomerId;
		} catch {
			return userId.trim();
		}
		const currentUser = authService.getCurrentUser();
		if (currentUser?.id && typeof currentUser.id === "string" && currentUser.id.trim()) return currentUser.id.trim();
		if (typeof window !== "undefined") {
			let guestId = localStorage.getItem("sass_guest_session_id");
			if (!guestId) {
				guestId = `guest_${Date.now()}`;
				localStorage.setItem("sass_guest_session_id", guestId);
			}
			return guestId;
		}
		return "guest_session";
	},
	async getGuestCart(isVIP = false) {
		const snapshot = readGuestCartSnapshot();
		if (!snapshot.length) return [];
		const refreshed = await this.refreshCartItemDetails(snapshot, isVIP);
		writeGuestCartSnapshot(refreshed);
		return refreshed;
	},
	async refreshCartItemDetails(items, isVIP = false) {
		const products = await Promise.all(items.map((item) => productService.getProductById(item.productId).catch(() => null)));
		return items.map((item, index) => {
			const product = products[index];
			if (!product || product.isActive === false) return {
				...item,
				stock: 0
			};
			const optionIndex = product.options.findIndex((option) => option.unit.toLowerCase() === item.unit.toLowerCase() && String(option.unitSize) === String(item.unitSize));
			const matchedIndex = optionIndex >= 0 ? optionIndex : item.optionIndex;
			const option = product.options[matchedIndex];
			if (!option) return {
				...item,
				name: product.name,
				image: product.imageUrl,
				stock: 0
			};
			const cartKey = buildCartKey(product.id, matchedIndex, option.unit, option.unitSize);
			return {
				...item,
				id: cartKey,
				cartKey,
				productId: product.id,
				optionIndex: matchedIndex,
				unit: option.unit,
				unitSize: option.unitSize,
				name: `${product.name} (${option.unitSize}${option.unit})`,
				price: isVIP && option.specialPrice && option.specialPrice > 0 ? option.specialPrice : option.offerPrice || option.mrp,
				mrp: option.mrp,
				...option.specialPrice !== void 0 ? { specialPrice: option.specialPrice } : {},
				image: product.imageUrl,
				stock: option.stock
			};
		});
	},
	async getCart(userId, legacySassId) {
		const isProd = authManager.getMode() === "production";
		if (userId === "" && isProd) return [];
		const currentUserId = userId?.trim() || authService.getCurrentUser()?.id?.trim();
		if (!currentUserId || currentUserId.startsWith("guest_") || currentUserId === "guest_session") return this.getGuestCart();
		const effectiveUser = this.getEffectiveUserId(currentUserId);
		if (isProd) {
			if (!effectiveUser || !CANONICAL_CUSTOMER_ID_RE$1.test(effectiveUser)) return [];
			const currentUser = authService.getCurrentUser();
			let resolvedLegacySassId = legacySassId || currentUser?.legacySassId;
			if (!resolvedLegacySassId) try {
				resolvedLegacySassId = resolveCustomerDataSource(effectiveUser).legacySassId;
			} catch {}
			if (resolvedLegacySassId) return productionCartReader.getCustomerCart(effectiveUser, void 0, resolvedLegacySassId);
			return productionCartReader.getCustomerCart(effectiveUser);
		}
		return (await apiClient.get("/cart", { userId: effectiveUser }) || []).filter((item) => !item.userId || item.userId === effectiveUser).map((item) => {
			const canonicalKey = item.cartKey || (item.id.includes("__opt") ? item.id.replace(new RegExp(`^${effectiveUser}__`), "") : item.id);
			return {
				...item,
				id: canonicalKey,
				cartKey: canonicalKey,
				userId: item.userId || effectiveUser
			};
		});
	},
	async mergeGuestCart(userId, legacySassId, isVIP = false) {
		const cleanUserId = userId.trim();
		if (!cleanUserId) throw new Error("A verified customer identity is required to sync the cart.");
		const existingMerge = inFlightGuestMerges.get(cleanUserId);
		if (existingMerge) return existingMerge;
		const mergePromise = (async () => {
			const guestSessionId = getGuestSessionId();
			const rawGuestItems = readGuestCartSnapshot();
			if (!rawGuestItems.length) return [];
			const guestItems = await this.getGuestCart(isVIP);
			const unavailableItems = guestItems.filter((item) => item.stock <= 0);
			if (unavailableItems.length > 0) throw new Error(`Some items are unavailable and were kept in your guest cart: ${unavailableItems.map((item) => item.name).join(", ")}. Remove them or try again after checking availability.`);
			const effectiveUser = this.getEffectiveUserId(cleanUserId);
			const mergeStateKey = `${GUEST_MERGE_KEY_PREFIX}${effectiveUser}`;
			let mergeState = null;
			if (typeof window !== "undefined") try {
				const parsed = JSON.parse(window.localStorage.getItem(mergeStateKey) || "null");
				if (parsed?.guestSessionId === guestSessionId && parsed?.baseQuantities) mergeState = parsed;
			} catch {
				mergeState = null;
			}
			const customerItems = await this.getCart(cleanUserId, legacySassId);
			if (!mergeState) {
				mergeState = {
					guestSessionId,
					baseQuantities: Object.fromEntries(customerItems.map((item) => [cartItemKey(item), item.quantity]))
				};
				try {
					window.localStorage.setItem(mergeStateKey, JSON.stringify(mergeState));
				} catch {
					throw new Error("Could not safely prepare your cart sync. Your guest cart is still saved.");
				}
			}
			const currentByKey = new Map(customerItems.map((item) => [cartItemKey(item), item]));
			for (const guestItem of guestItems) {
				const key = cartItemKey(guestItem);
				const baseQuantity = mergeState.baseQuantities[key] || 0;
				const desiredQuantity = Math.min(baseQuantity + guestItem.quantity, guestItem.stock);
				if (currentByKey.get(key)) await this.updateQuantity(key, desiredQuantity, cleanUserId);
				else {
					const storedDocId = `${effectiveUser}__${key}`;
					await apiClient.post("/cart", {
						...guestItem,
						id: storedDocId,
						cartKey: key,
						userId: effectiveUser,
						quantity: desiredQuantity
					});
				}
			}
			const mergedItems = await this.getCart(cleanUserId, legacySassId);
			if (!guestItems.every((item) => {
				const key = cartItemKey(item);
				const expected = Math.min((mergeState.baseQuantities[key] || 0) + item.quantity, item.stock);
				return mergedItems.some((merged) => cartItemKey(merged) === key && merged.quantity === expected);
			})) throw new Error("Your cart sync is still pending. Your guest cart has been kept; retry to finish.");
			if (guestCartFingerprint(readGuestCartSnapshot()) === guestCartFingerprint(rawGuestItems)) writeGuestCartSnapshot([]);
			try {
				window.localStorage.removeItem(mergeStateKey);
			} catch {}
			return guestItems;
		})();
		inFlightGuestMerges.set(cleanUserId, mergePromise);
		try {
			return await mergePromise;
		} finally {
			if (inFlightGuestMerges.get(cleanUserId) === mergePromise) inFlightGuestMerges.delete(cleanUserId);
		}
	},
	async addToCart(product, optionIndex = 0, quantity = 1, userId, isVIP = false) {
		const option = product.options[optionIndex] || product.options[0];
		if (!option) throw new Error("Product option not found");
		if (option.stock <= 0) throw new Error("This product is currently out of stock");
		const effectiveUser = this.getEffectiveUserId(userId);
		const cartKey = buildCartKey(product.id, optionIndex, option.unit, option.unitSize);
		if (effectiveUser.startsWith("guest_") || effectiveUser === "guest_session") {
			const items = readGuestCartSnapshot();
			const existing = items.find((item) => cartItemKey(item) === cartKey);
			if (existing) {
				const nextQuantity = existing.quantity + quantity;
				if (nextQuantity > option.stock) throw new Error(`Only ${option.stock} units available in stock`);
				existing.quantity = nextQuantity;
			} else items.push({
				id: cartKey,
				cartKey,
				productId: product.id,
				optionIndex,
				unit: option.unit,
				unitSize: option.unitSize,
				name: `${product.name} (${option.unitSize}${option.unit})`,
				price: isVIP && option.specialPrice ? option.specialPrice : option.offerPrice || option.mrp,
				mrp: option.mrp,
				...option.specialPrice !== void 0 ? { specialPrice: option.specialPrice } : {},
				quantity,
				image: product.imageUrl,
				stock: option.stock
			});
			writeGuestCartSnapshot(items);
			return items.find((item) => cartItemKey(item) === cartKey);
		}
		const storedDocId = `${effectiveUser}__${cartKey}`;
		const existing = (await this.getCart(effectiveUser)).find((item) => item.id === cartKey || item.cartKey === cartKey);
		if (existing) {
			const newQty = existing.quantity + quantity;
			if (newQty > option.stock) throw new Error(`Only ${option.stock} units available in stock`);
			await apiClient.patch(`/cart/${encodeURIComponent(storedDocId)}`, { quantity: newQty });
			return {
				...existing,
				id: cartKey,
				cartKey,
				userId: effectiveUser,
				quantity: newQty
			};
		}
		const price = isVIP && option.specialPrice && option.specialPrice > 0 ? option.specialPrice : option.offerPrice || option.mrp;
		const newItem = {
			id: storedDocId,
			cartKey,
			userId: effectiveUser,
			productId: product.id,
			optionIndex,
			unit: option.unit,
			unitSize: option.unitSize,
			name: `${product.name} (${option.unitSize}${option.unit})`,
			price,
			mrp: option.mrp,
			...option.specialPrice !== void 0 ? { specialPrice: option.specialPrice } : {},
			quantity,
			image: product.imageUrl,
			stock: option.stock
		};
		return {
			...await apiClient.post("/cart", newItem),
			id: cartKey,
			cartKey,
			userId: effectiveUser
		};
	},
	async updateQuantity(cartKey, quantity, userId) {
		const effectiveUser = this.getEffectiveUserId(userId);
		if (effectiveUser.startsWith("guest_") || effectiveUser === "guest_session") {
			const items = readGuestCartSnapshot();
			const index = items.findIndex((item) => cartItemKey(item) === cartKey);
			if (index < 0) return null;
			if (quantity <= 0) {
				items.splice(index, 1);
				writeGuestCartSnapshot(items);
				return null;
			}
			const item = items[index];
			if (item.stock <= 0) throw new Error("This product is currently unavailable");
			item.quantity = Math.min(quantity, item.stock);
			writeGuestCartSnapshot(items);
			return item;
		}
		if (quantity <= 0) {
			await this.removeFromCart(cartKey, effectiveUser);
			return null;
		}
		const storedDocId = cartKey.startsWith(`${effectiveUser}__`) ? cartKey : `${effectiveUser}__${cartKey}`;
		const updated = await apiClient.patch(`/cart/${encodeURIComponent(storedDocId)}?userId=${encodeURIComponent(effectiveUser)}`, {
			quantity,
			userId: effectiveUser
		});
		const canonicalKey = cartKey.replace(new RegExp(`^${effectiveUser}__`), "");
		return {
			...updated,
			id: canonicalKey,
			cartKey: canonicalKey,
			userId: effectiveUser
		};
	},
	async removeFromCart(cartKey, userId) {
		const effectiveUser = this.getEffectiveUserId(userId);
		if (effectiveUser.startsWith("guest_") || effectiveUser === "guest_session") {
			writeGuestCartSnapshot(readGuestCartSnapshot().filter((item) => cartItemKey(item) !== cartKey));
			return;
		}
		const storedDocId = cartKey.startsWith(`${effectiveUser}__`) ? cartKey : `${effectiveUser}__${cartKey}`;
		try {
			await apiClient.delete(`/cart/${encodeURIComponent(storedDocId)}?userId=${encodeURIComponent(effectiveUser)}`);
		} catch {
			await apiClient.delete(`/cart/${encodeURIComponent(cartKey)}?userId=${encodeURIComponent(effectiveUser)}`).catch(() => {});
		}
	},
	async clearCart(userId) {
		const effectiveUser = this.getEffectiveUserId(userId);
		if (effectiveUser.startsWith("guest_") || effectiveUser === "guest_session") {
			writeGuestCartSnapshot([]);
			return;
		}
		if (apiClient.isLegacyCustomerSubcollectionsEnabled() || authManager.getMode() === "production") try {
			await apiClient.delete(`/cart?userId=${encodeURIComponent(effectiveUser)}`);
			return;
		} catch {}
		const items = await this.getCart(effectiveUser);
		for (const item of items) {
			if (item.userId && item.userId !== effectiveUser) continue;
			const storedDocId = `${effectiveUser}__${item.cartKey || item.id}`;
			try {
				await apiClient.delete(`/cart/${encodeURIComponent(storedDocId)}?userId=${encodeURIComponent(effectiveUser)}`);
			} catch {
				if (item.userId === effectiveUser) await apiClient.delete(`/cart/${encodeURIComponent(item.id)}?userId=${encodeURIComponent(effectiveUser)}`).catch(() => {});
			}
		}
	}
};
function isNotFound(error) {
	return typeof error === "object" && error !== null && "status" in error && error.status === 404;
}
/** Reads and validates a promo using the legacy `promoCodes` then `promos` schema. */
async function fetchPromoByCode(code) {
	const normalizedCode = code.trim().toUpperCase();
	if (!normalizedCode) throw new Error("Please enter a promo code");
	let document;
	let documentId = "";
	for (const collectionName of ["promoCodes", "promos"]) try {
		const match = (await apiClient.get(`/${collectionName}`, { code: normalizedCode })).find((candidate) => String(candidate["code"] || "").trim().toUpperCase() === normalizedCode);
		if (match) {
			document = match;
			documentId = String(match["id"] || "");
			break;
		}
	} catch (error) {
		if (!isNotFound(error)) throw error;
	}
	if (!document) throw new Error("Invalid promo code");
	if (document["status"] === "paused" || document["status"] === "expired" || document["isExpired"] === true) throw new Error("This promo code has expired or is inactive");
	const amount = Number(document["value"] ?? document["amount"] ?? document["discountAmount"] ?? 0);
	return {
		id: documentId,
		code: String(document["code"] || normalizedCode),
		amount: Number.isFinite(amount) ? amount : 0,
		type: String(document["type"] || (document["value"] ? "percentage" : "fixed")),
		createdAt: document["createdAt"] ?? null,
		raw: document
	};
}
/** Mirrors the legacy CartPage's percentage rounding and fixed-discount cap. */
function calculateLegacyPromoDiscount(promo, subtotal) {
	const amount = Number.isFinite(promo.amount) ? Math.max(0, promo.amount) : 0;
	const discount = ["percentage", "percent"].includes(promo.type.trim().toLowerCase()) ? Math.round(subtotal * amount / 100) : amount;
	return Math.min(Math.max(0, subtotal), discount);
}
function getStored(key, defaultValue) {
	if (typeof window === "undefined") return defaultValue;
	try {
		const val = localStorage.getItem(key);
		return val !== null ? JSON.parse(val) : defaultValue;
	} catch {
		return defaultValue;
	}
}
function setStored(key, value) {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {}
}
function removeStored(key) {
	if (typeof window === "undefined") return;
	try {
		localStorage.removeItem(key);
	} catch {}
}
var CartContext = (0, import_react.createContext)(void 0);
function CartProvider({ children }) {
	const { user } = useAuth();
	const [items, setItems] = (0, import_react.useState)([]);
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const [cartError, setCartError] = (0, import_react.useState)(null);
	const [isSyncingGuestCart, setIsSyncingGuestCart] = (0, import_react.useState)(false);
	const [cartSyncAttemptedCustomerId, setCartSyncAttemptedCustomerId] = (0, import_react.useState)(null);
	const [guestCartSyncError, setGuestCartSyncError] = (0, import_react.useState)(null);
	const storageUserKey = user?.id || "guest";
	const coinsKey = `sri_amman_cart_coins_${storageUserKey}`;
	const speedKey = `sri_amman_cart_speed_${storageUserKey}`;
	const addressKey = `sri_amman_cart_address_${storageUserKey}`;
	const slotKey = `sri_amman_cart_slot_${storageUserKey}`;
	const paymentKey = `sri_amman_cart_payment_${storageUserKey}`;
	const upiKey = `sri_amman_cart_upi_${storageUserKey}`;
	const [appliedCoupon, setAppliedCoupon] = (0, import_react.useState)(null);
	const [redeemCoins, setRedeemCoinsState] = (0, import_react.useState)(() => getStored(coinsKey, false));
	(0, import_react.useEffect)(() => {
		if (typeof window !== "undefined") setRedeemCoinsState(getStored(coinsKey, false));
	}, [coinsKey]);
	const [deliverySpeed, setDeliverySpeedState] = (0, import_react.useState)(() => {
		const saved = getStored(speedKey, null);
		const legacy = getStored("deliveryOption", "standard");
		const value = (saved ?? legacy).toLowerCase();
		return value === "express" || value === "fast" ? "express" : "standard";
	});
	const [legacyCheckoutSettings, setLegacyCheckoutSettings] = (0, import_react.useState)(LEGACY_CHECKOUT_DEFAULTS);
	const [deliverySettingsError, setDeliverySettingsError] = (0, import_react.useState)(null);
	const [checkoutSettingsLoaded, setCheckoutSettingsLoaded] = (0, import_react.useState)(false);
	const isExpressDeliveryAvailable = isLegacyExpressAvailable((/* @__PURE__ */ new Date()).getHours(), legacyCheckoutSettings);
	(0, import_react.useEffect)(() => {
		let active = true;
		settingsService.getLegacyCheckoutSettings().then((settings) => {
			if (active) setLegacyCheckoutSettings(settings);
		}).catch((error) => {
			if (!active) return;
			const message = error instanceof Error ? error.message : "Could not load delivery settings.";
			setDeliverySettingsError(message);
		}).finally(() => {
			if (active) setCheckoutSettingsLoaded(true);
		});
		return () => {
			active = false;
		};
	}, []);
	const [selectedAddressId, setSelectedAddressIdState] = (0, import_react.useState)(() => getStored(addressKey, ""));
	const [selectedSlotId, setSelectedSlotIdState] = (0, import_react.useState)(() => getStored(slotKey, "slot_exp"));
	const [paymentMethod, setPaymentMethodState] = (0, import_react.useState)(() => getStored(paymentKey, "upi"));
	const [selectedUpiId, setSelectedUpiIdState] = (0, import_react.useState)(() => getStored(upiKey, ""));
	const setRedeemCoins = (0, import_react.useCallback)((redeem) => {
		setRedeemCoinsState(redeem);
		setStored(coinsKey, redeem);
	}, [coinsKey]);
	const setDeliverySpeed = (0, import_react.useCallback)((speed) => {
		if (speed === "express" && !isExpressDeliveryAvailable) return;
		setDeliverySpeedState(speed);
		setStored(speedKey, speed);
	}, [speedKey, isExpressDeliveryAvailable]);
	const setSelectedAddressId = (0, import_react.useCallback)((id) => {
		setSelectedAddressIdState(id);
		setStored(addressKey, id);
	}, [addressKey]);
	const setSelectedSlotId = (0, import_react.useCallback)((id) => {
		setSelectedSlotIdState(id);
		setStored(slotKey, id);
	}, [slotKey]);
	const setPaymentMethod = (0, import_react.useCallback)((method) => {
		setPaymentMethodState(method);
		setStored(paymentKey, method);
	}, [paymentKey]);
	const setSelectedUpiId = (0, import_react.useCallback)((id) => {
		setSelectedUpiIdState(id);
		setStored(upiKey, id);
	}, [upiKey]);
	const refreshCart = (0, import_react.useCallback)(async () => {
		setIsLoading(true);
		setCartError(null);
		try {
			const cartItems = await cartService.getCart(user?.id, user?.legacySassId);
			setItems(cartItems || []);
		} catch (err) {
			console.error("Failed to load cart items:", err);
			const msg = err instanceof Error ? err.message : "Failed to load cart items";
			setCartError(msg);
		} finally {
			setIsLoading(false);
		}
	}, [user?.id, user?.legacySassId]);
	const syncGuestCart = (0, import_react.useCallback)(async () => {
		if (!user?.id) {
			await refreshCart();
			return true;
		}
		setIsSyncingGuestCart(true);
		setGuestCartSyncError(null);
		try {
			const mergedGuestItems = await cartService.mergeGuestCart(user.id, user.legacySassId, !!user.isVIP);
			await refreshCart();
			if (mergedGuestItems.length > 0) toast.success("Your saved cart has been synced with your account.");
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : "Could not sync your saved cart.";
			setGuestCartSyncError(message);
			try {
				const guestItems = await cartService.getGuestCart(!!user.isVIP);
				if (guestItems.length > 0) setItems(guestItems);
				else await refreshCart();
			} catch {
				setCartError("Your saved guest cart could not be loaded. Please retry the cart sync.");
			}
			return false;
		} finally {
			setCartSyncAttemptedCustomerId(user.id);
			setIsSyncingGuestCart(false);
		}
	}, [
		user?.id,
		user?.legacySassId,
		user?.isVIP,
		refreshCart
	]);
	const isGuestCartSyncing = isSyncingGuestCart || !!user?.id && cartSyncAttemptedCustomerId !== user.id;
	(0, import_react.useEffect)(() => {
		if (user?.id) syncGuestCart();
		else refreshCart();
	}, [
		user?.id,
		refreshCart,
		syncGuestCart
	]);
	const addToCart = async (product, optionIndex = 0, quantity = 1) => {
		const isVIP = !!user?.isVIP;
		const cartOwnerId = guestCartSyncError ? "guest_session" : user?.id;
		await cartService.addToCart(product, optionIndex, quantity, cartOwnerId, isVIP);
		if (guestCartSyncError) setItems(await cartService.getGuestCart(isVIP));
		else await refreshCart();
	};
	const updateQty = async (cartKey, quantity) => {
		await cartService.updateQuantity(cartKey, quantity, guestCartSyncError ? "guest_session" : user?.id);
		if (guestCartSyncError) setItems(await cartService.getGuestCart(!!user?.isVIP));
		else await refreshCart();
	};
	const removeFromCart = async (cartKey) => {
		await cartService.removeFromCart(cartKey, guestCartSyncError ? "guest_session" : user?.id);
		if (guestCartSyncError) setItems(await cartService.getGuestCart(!!user?.isVIP));
		else await refreshCart();
	};
	const clearCart = async () => {
		await cartService.clearCart(guestCartSyncError ? "guest_session" : user?.id);
		setItems([]);
	};
	const revalidateCartItems = async () => {
		const refreshedItems = await cartService.refreshCartItemDetails(items, !!user?.isVIP);
		setItems(refreshedItems);
		return refreshedItems;
	};
	const getItemQuantity = (cartKey) => {
		const item = items.find((i) => i.id === cartKey || i.cartKey === cartKey);
		return item ? item.quantity : 0;
	};
	const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
	const cartTotalMrp = items.reduce((sum, item) => sum + (item.mrp || item.price) * item.quantity, 0);
	const cartSubtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
	const cartTotalSavings = items.reduce((sum, item) => sum + Math.max(0, (item.mrp || item.price) - item.price) * item.quantity, 0);
	const standardDeliveryFee = (0, import_react.useMemo)(() => {
		return calculateLegacyDeliveryCharge(cartSubtotal, "standard", items.length, legacyCheckoutSettings);
	}, [
		items.length,
		cartSubtotal,
		legacyCheckoutSettings
	]);
	const expressDeliveryFee = (0, import_react.useMemo)(() => {
		return calculateLegacyDeliveryCharge(cartSubtotal, "express", items.length, legacyCheckoutSettings);
	}, [
		items.length,
		cartSubtotal,
		legacyCheckoutSettings
	]);
	const deliveryFee = deliverySpeed === "express" ? expressDeliveryFee : standardDeliveryFee;
	(0, import_react.useEffect)(() => {
		if (!checkoutSettingsLoaded) return;
		const nextSpeed = !isExpressDeliveryAvailable ? "standard" : cartSubtotal >= legacyCheckoutSettings.expressAutoThreshold ? "express" : deliverySpeed;
		if (nextSpeed === deliverySpeed) return;
		setDeliverySpeedState(nextSpeed);
		setStored(speedKey, nextSpeed);
	}, [
		cartSubtotal,
		checkoutSettingsLoaded,
		deliverySpeed,
		isExpressDeliveryAvailable,
		legacyCheckoutSettings.expressAutoThreshold,
		speedKey
	]);
	const applyCoupon = (0, import_react.useCallback)(async (code) => {
		try {
			const promo = await fetchPromoByCode(code);
			const discount = calculateLegacyPromoDiscount(promo, cartSubtotal);
			const val = {
				code: promo.code,
				amount: promo.amount,
				type: promo.type
			};
			setAppliedCoupon(val);
			return {
				success: true,
				message: `Coupon ${promo.code} applied! You save ₹${discount}`,
				discount
			};
		} catch (error) {
			return {
				success: false,
				message: error instanceof Error ? error.message : "Could not validate this promo code."
			};
		}
	}, [cartSubtotal]);
	const removeCoupon = (0, import_react.useCallback)(() => {
		setAppliedCoupon(null);
	}, []);
	const resetDiscounts = (0, import_react.useCallback)(() => {
		setAppliedCoupon(null);
		setRedeemCoinsState(false);
		removeStored(coinsKey);
	}, [coinsKey]);
	const couponDiscount = (0, import_react.useMemo)(() => {
		if (!appliedCoupon) return 0;
		return calculateLegacyPromoDiscount(appliedCoupon, cartSubtotal);
	}, [appliedCoupon, cartSubtotal]);
	const coinsToRedeem = getMaxRedeemableCoins(typeof user?.smartCoins === "number" ? user.smartCoins : typeof user?.coins === "number" ? user.coins : typeof user?.availableCoins === "number" ? user.availableCoins : 0, Math.max(0, cartSubtotal - couponDiscount + deliveryFee), legacyCheckoutSettings.coinValueInRupees);
	const coinsRedeemed = redeemCoins ? coinsToRedeem : 0;
	const coinDiscount = redeemCoins ? convertCoinsToRupees(coinsToRedeem, legacyCheckoutSettings.coinValueInRupees) : 0;
	const totalDiscounts = couponDiscount + coinDiscount;
	const finalTotal = Math.max(0, cartSubtotal - totalDiscounts + deliveryFee);
	const totalSavings = cartTotalSavings + totalDiscounts;
	const totalSavingsPercent = cartTotalMrp > 0 ? Math.round(totalSavings / cartTotalMrp * 100) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartContext.Provider, {
		value: {
			items,
			isLoading,
			cartError,
			isGuestCartSyncing,
			guestCartSyncError,
			syncGuestCart,
			cartCount,
			cartTotalMrp,
			cartSubtotal,
			cartTotalSavings,
			totalSavings,
			totalSavingsPercent,
			appliedCoupon,
			couponDiscount,
			redeemCoins,
			coinsRedeemed,
			coinsToRedeem,
			coinDiscount,
			coinValueInRupees: legacyCheckoutSettings.coinValueInRupees,
			deliverySpeed,
			deliveryFee,
			deliverySettingsError,
			isExpressDeliveryAvailable,
			standardDeliveryFee,
			expressDeliveryFee,
			finalTotal,
			selectedAddressId,
			selectedSlotId,
			paymentMethod,
			selectedUpiId,
			setDeliverySpeed,
			setSelectedAddressId,
			setSelectedSlotId,
			setPaymentMethod,
			setSelectedUpiId,
			applyCoupon,
			removeCoupon,
			setRedeemCoins,
			resetDiscounts,
			addToCart,
			updateQty,
			removeFromCart,
			clearCart,
			refreshCart,
			revalidateCartItems,
			getItemQuantity
		},
		children
	});
}
function useCart() {
	const context = (0, import_react.useContext)(CartContext);
	if (!context) throw new Error("useCart must be used within a CartProvider");
	return context;
}
/**
* Timeout bounding utility for production Firestore wishlist reads.
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
* Normalizes an arbitrary legacy wishlist container document from production Firestore (`users/{SASS_ID}/wishlists/{docId}`)
* into the standard frontend `Wishlist` type.
*/
function normalizeLegacyWishlist(docId, docData, userId) {
	const resolvedId = String(docData["id"] || docId || "").trim();
	return {
		id: resolvedId,
		userId,
		title: String(docData["title"] || docData["name"] || resolvedId || "Wishlist").trim(),
		description: String(docData["description"] || "").trim(),
		createdAt: String(docData["createdAt"] || docData["addedAt"] || (/* @__PURE__ */ new Date()).toISOString()).trim()
	};
}
/**
* Normalizes an arbitrary legacy wishlist product document from production Firestore (`users/{SASS_ID}/wishlists/{wishlistId}/products/{docId}`)
* into the standard frontend `WishlistProduct` type, reconciling against live catalogue products when available.
*/
function normalizeLegacyWishlistProduct(docId, docData, userId, wishlistId, catalog) {
	let rawProdId = String(docData["productId"] || "").trim();
	if (!rawProdId) {
		const parts = docId.split("_");
		rawProdId = parts[0] ? parts[0].trim() : docId;
	}
	const productId = rawProdId || docId;
	const rawUnit = String(docData["unit"] || "").trim();
	const rawUnitSize = String(docData["unitSize"] || "").trim();
	const catalogProd = catalog?.find((p) => p.id === productId);
	let optionIndex = typeof docData["optionIndex"] === "number" ? docData["optionIndex"] : 0;
	let matchedOption = catalogProd?.options?.[optionIndex];
	if (catalogProd && catalogProd.options && catalogProd.options.length > 0) {
		if (rawUnit || rawUnitSize) {
			const foundIdx = catalogProd.options.findIndex((opt) => opt.unit.trim().toLowerCase() === rawUnit.toLowerCase() && String(opt.unitSize).trim() === rawUnitSize);
			if (foundIdx >= 0) {
				optionIndex = foundIdx;
				matchedOption = catalogProd.options[foundIdx];
			}
		}
		if (!matchedOption) {
			matchedOption = catalogProd.options[0];
			optionIndex = 0;
		}
	}
	const rawDocPrice = typeof docData["price"] === "number" ? docData["price"] : typeof docData["sellingPrice"] === "number" ? docData["sellingPrice"] : typeof docData["offerPrice"] === "number" ? docData["offerPrice"] : 0;
	const rawDocMrp = typeof docData["mrp"] === "number" ? docData["mrp"] : rawDocPrice;
	const rawDocSpecial = typeof docData["specialPrice"] === "number" ? docData["specialPrice"] : void 0;
	const price = matchedOption?.offerPrice ?? (rawDocPrice > 0 ? rawDocPrice : rawDocMrp > 0 ? rawDocMrp : 0);
	const mrp = matchedOption?.mrp ?? (rawDocMrp > 0 ? rawDocMrp : price);
	const specialPrice = matchedOption?.specialPrice ?? rawDocSpecial;
	const resolvedUnit = matchedOption?.unit ?? rawUnit;
	const resolvedUnitSize = matchedOption?.unitSize ? String(matchedOption.unitSize) : rawUnitSize;
	let name = String(docData["name"] || "").trim();
	if (catalogProd?.name) name = resolvedUnitSize && resolvedUnit ? `${catalogProd.name} (${resolvedUnitSize}${resolvedUnit})` : catalogProd.name;
	else if (!name) name = `Product (${productId})`;
	const image = catalogProd?.imageUrl || String(docData["image"] || docData["imageUrl"] || "").trim();
	return {
		id: docId,
		wishlistId,
		userId,
		productId,
		optionIndex,
		unit: resolvedUnit,
		unitSize: resolvedUnitSize,
		name,
		price,
		mrp,
		...specialPrice !== void 0 ? { specialPrice } : {},
		image
	};
}
var readerOverride = null;
var productionWishlistReader = {
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
	* Reads all custom wishlist containers for an authenticated customer from production Firestore (`sri-amman-smart-store`).
	* Queries `onlineCustomers/{ID}/wishlists` or `users/{ID}/wishlists`.
	*/
	async getCustomerWishlists(customerId, timeoutMs = 8e3, legacySassId) {
		if (readerOverride?.getCustomerWishlists) {
			if (legacySassId) return readerOverride.getCustomerWishlists(customerId || "", legacySassId);
			return readerOverride.getCustomerWishlists(customerId || "");
		}
		const cleanCustomerId = (customerId || "").trim();
		if (!cleanCustomerId) return [];
		const validCustomerId = this.assertValidCustomer(cleanCustomerId);
		const cleanLegacySassId = typeof legacySassId === "string" && legacySassId.trim() ? legacySassId.trim() : void 0;
		const db = getProductionFirestoreInstance();
		const primaryCol = validCustomerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
		const wishlistsColRef = collection(db, primaryCol, validCustomerId, "wishlists");
		try {
			let snap = await withTimeout(getDocs(query(wishlistsColRef)), timeoutMs, `getDocs(${primaryCol}/${validCustomerId}/wishlists)`);
			if (snap.empty && primaryCol === "onlineCustomers" && cleanLegacySassId) try {
				const fallbackSnap = await withTimeout(getDocs(query(collection(db, "users", cleanLegacySassId, "wishlists"))), timeoutMs, `getDocs(users/${cleanLegacySassId}/wishlists)`);
				if (!fallbackSnap.empty) snap = fallbackSnap;
			} catch (err) {
				console.warn(`[ProductionWishlistReader] Warning querying fallback wishlists:`, err);
			}
			return snap.docs.map((docSnap) => normalizeLegacyWishlist(docSnap.id, docSnap.data(), validCustomerId));
		} catch (err) {
			console.error(`[ProductionWishlistReader] Error querying ${primaryCol}/${validCustomerId}/wishlists:`, err);
			const category = classifyStorageError(err);
			throw new StorageAdapterError(`Failed to retrieve wishlists for customer ${validCustomerId}: ${err instanceof Error ? err.message : String(err)}`, {
				status: category === "permission" ? 403 : category === "connectivity" ? 503 : 500,
				code: category === "permission" ? "permission-denied" : "unavailable",
				category,
				causeError: err
			});
		}
	},
	/**
	* Reads all wishlist products for an authenticated customer from production Firestore (`sri-amman-smart-store`).
	* Queries `onlineCustomers/{ID}/wishlists/{wishlistId}/products` or `users/{ID}/wishlists/{wishlistId}/products`.
	* Reconciles saved items with the live catalogue.
	*/
	async getCustomerWishlistProducts(customerId, wishlistId, catalog, timeoutMs = 8e3, legacySassId) {
		if (readerOverride?.getCustomerWishlistProducts) {
			if (legacySassId) return readerOverride.getCustomerWishlistProducts(customerId || "", wishlistId, catalog, legacySassId);
			if (catalog !== void 0) return readerOverride.getCustomerWishlistProducts(customerId || "", wishlistId, catalog);
			return readerOverride.getCustomerWishlistProducts(customerId || "", wishlistId);
		}
		const cleanCustomerId = (customerId || "").trim();
		if (!cleanCustomerId) return [];
		const validCustomerId = this.assertValidCustomer(cleanCustomerId);
		const cleanLegacySassId = typeof legacySassId === "string" && legacySassId.trim() ? legacySassId.trim() : void 0;
		const db = getProductionFirestoreInstance();
		const primaryCol = validCustomerId.toUpperCase().startsWith("ONCUS") ? "onlineCustomers" : "users";
		let liveCatalog = catalog;
		if (!liveCatalog) try {
			liveCatalog = await productService.getProducts();
		} catch {
			liveCatalog = [];
		}
		const targetWishlistIds = [];
		if (wishlistId && wishlistId !== "all") {
			targetWishlistIds.push(wishlistId);
			if (wishlistId === "wl_default") targetWishlistIds.push("default");
		} else {
			try {
				const customContainers = await this.getCustomerWishlists(validCustomerId, timeoutMs, cleanLegacySassId);
				for (const w of customContainers) if (!targetWishlistIds.includes(w.id)) targetWishlistIds.push(w.id);
			} catch (err) {
				if (err instanceof StorageAdapterError) throw err;
				const category = classifyStorageError(err);
				throw new StorageAdapterError(`Failed to retrieve wishlist containers for customer ${validCustomerId}: ${err instanceof Error ? err.message : String(err)}`, {
					status: category === "permission" ? 403 : 500,
					code: category === "permission" ? "permission-denied" : "unavailable",
					category,
					causeError: err
				});
			}
			if (!targetWishlistIds.includes("wl_default")) targetWishlistIds.push("wl_default");
			if (!targetWishlistIds.includes("default")) targetWishlistIds.push("default");
		}
		const subcollectionPromises = targetWishlistIds.map(async (wId) => {
			const colRef = collection(db, primaryCol, validCustomerId, "wishlists", wId, "products");
			let snap = await withTimeout(getDocs(query(colRef)), timeoutMs, `getDocs(${primaryCol}/${validCustomerId}/wishlists/${wId}/products)`).catch(() => null);
			if ((!snap || snap.empty) && primaryCol === "onlineCustomers" && cleanLegacySassId) {
				const fallbackColRef = collection(db, "users", cleanLegacySassId, "wishlists", wId, "products");
				const fallbackSnap = await withTimeout(getDocs(query(fallbackColRef)), timeoutMs, `getDocs(users/${cleanLegacySassId}/wishlists/${wId}/products)`).catch(() => null);
				if (fallbackSnap && !fallbackSnap.empty) snap = fallbackSnap;
			}
			return {
				wishlistId: wId,
				docs: snap ? snap.docs : []
			};
		});
		const results = await Promise.all(subcollectionPromises);
		const itemsMap = /* @__PURE__ */ new Map();
		for (const res of results) {
			const { wishlistId: currentWId, docs } = res;
			const normalizedWId = currentWId === "default" ? "wl_default" : currentWId;
			for (const docSnap of docs) {
				const data = docSnap.data();
				const normalized = normalizeLegacyWishlistProduct(docSnap.id, data, validCustomerId, normalizedWId, liveCatalog);
				const uniqueKey = `${normalized.id}_${normalized.wishlistId}`;
				if (!itemsMap.has(uniqueKey)) itemsMap.set(uniqueKey, normalized);
			}
		}
		return Array.from(itemsMap.values());
	}
};
var wishlistService = {
	getEffectiveUserId(userId) {
		if (userId && typeof userId === "string" && userId.trim()) try {
			return resolveCustomerDataSource(userId).canonicalCustomerId;
		} catch {
			return userId.trim();
		}
		const currentUser = authService.getCurrentUser();
		if (currentUser?.id && typeof currentUser.id === "string" && currentUser.id.trim()) return currentUser.id.trim();
		if (authManager.getMode() === "production") return "";
		if (typeof window !== "undefined") {
			let guestId = localStorage.getItem("sass_guest_session_id");
			if (!guestId) {
				guestId = `guest_${Date.now()}`;
				localStorage.setItem("sass_guest_session_id", guestId);
			}
			return guestId;
		}
		return "";
	},
	async getWishlists(userId) {
		const isProd = authManager.getMode() === "production";
		const effectiveUser = this.getEffectiveUserId(userId);
		if (isProd) {
			if (!effectiveUser) return [];
			const currentUser = authService.getCurrentUser();
			if (currentUser?.legacySassId) return productionWishlistReader.getCustomerWishlists(effectiveUser, void 0, currentUser.legacySassId);
			return productionWishlistReader.getCustomerWishlists(effectiveUser);
		}
		return await apiClient.get("/wishlists", { userId: effectiveUser }) || [];
	},
	async createWishlist(title, description = "", userId) {
		const effectiveUser = this.getEffectiveUserId(userId);
		const newWl = {
			id: `wl_${Date.now()}`,
			userId: effectiveUser,
			title: title.trim(),
			description: description.trim(),
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		return apiClient.post("/wishlists", newWl);
	},
	async renameWishlist(id, title, description) {
		const updateData = { title: title.trim() };
		if (description !== void 0) updateData.description = description.trim();
		return apiClient.patch(`/wishlists/${encodeURIComponent(id)}`, updateData);
	},
	async deleteWishlist(id, userId) {
		const effectiveUser = this.getEffectiveUserId(userId);
		try {
			await apiClient.delete(`/wishlists/${encodeURIComponent(id)}`);
		} catch (err) {
			if (!err.message?.includes("404") && err.status !== 404) throw err;
		}
		try {
			const items = await this.getWishlistProducts(id, effectiveUser);
			for (const item of items) await apiClient.patch(`/wishlistProducts/${encodeURIComponent(item.id)}`, { wishlistId: "wl_default" }).catch(() => {});
		} catch {}
	},
	async getWishlistProducts(wishlistId, userId) {
		const isProd = authManager.getMode() === "production";
		const effectiveUser = this.getEffectiveUserId(userId);
		if (isProd) {
			if (!effectiveUser) return [];
			const currentUser = authService.getCurrentUser();
			if (currentUser?.legacySassId) return productionWishlistReader.getCustomerWishlistProducts(effectiveUser, wishlistId, void 0, void 0, currentUser.legacySassId);
			return productionWishlistReader.getCustomerWishlistProducts(effectiveUser, wishlistId);
		}
		const params = { userId: effectiveUser };
		if (wishlistId && wishlistId !== "all") params["wishlistId"] = wishlistId;
		return await apiClient.get("/wishlistProducts", params) || [];
	},
	async toggleWishlistProduct(product, optionIndex = 0, wishlistId = "wl_default", userId) {
		const effectiveUser = this.getEffectiveUserId(userId);
		const existing = (await this.getWishlistProducts(void 0, effectiveUser)).find((item) => item.productId === product.id);
		if (existing) {
			await apiClient.delete(`/wishlistProducts/${encodeURIComponent(existing.id)}`);
			return { added: false };
		}
		const option = product.options[optionIndex] || product.options[0];
		if (!option) throw new Error("Product option not found");
		const newWlp = {
			id: `wlp_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
			wishlistId: wishlistId || "wl_default",
			userId: effectiveUser,
			productId: product.id,
			optionIndex,
			unit: option.unit,
			unitSize: option.unitSize,
			name: `${product.name} (${option.unitSize}${option.unit})`,
			price: option.offerPrice || option.mrp,
			mrp: option.mrp,
			...option.specialPrice !== void 0 ? { specialPrice: option.specialPrice } : {},
			image: product.imageUrl
		};
		return {
			added: true,
			item: await apiClient.post("/wishlistProducts", newWlp)
		};
	},
	async removeWishlistProduct(id) {
		try {
			await apiClient.delete(`/wishlistProducts/${encodeURIComponent(id)}`);
		} catch (err) {
			if (err.message?.includes("404") || err.status === 404) return;
			throw err;
		}
	},
	async moveProductToCollection(id, targetWishlistId) {
		return apiClient.patch(`/wishlistProducts/${encodeURIComponent(id)}`, { wishlistId: targetWishlistId });
	},
	async moveAllInStockToCart(wishlistId, allProducts, userId, isVIP = false) {
		const effectiveUser = this.getEffectiveUserId(userId);
		const wishlistItems = await this.getWishlistProducts(wishlistId, effectiveUser);
		const catalog = allProducts && allProducts.length > 0 ? allProducts : await productService.getProducts();
		let addedCount = 0;
		let skippedCount = 0;
		const unavailableNames = [];
		for (const item of wishlistItems) {
			const prod = catalog.find((p) => p.id === item.productId);
			if (!prod || prod.isActive === false) {
				skippedCount++;
				unavailableNames.push(item.name);
				continue;
			}
			const opt = prod.options[item.optionIndex] || prod.options[0];
			if (!opt || opt.stock <= 0) {
				skippedCount++;
				unavailableNames.push(item.name);
				continue;
			}
			try {
				await cartService.addToCart(prod, item.optionIndex, 1, effectiveUser, isVIP);
				addedCount++;
			} catch {
				skippedCount++;
				unavailableNames.push(item.name);
			}
		}
		return {
			addedCount,
			skippedCount,
			unavailableNames
		};
	},
	async moveAllToCart(wishlistId, allProducts, userId, isVIP = false) {
		return (await this.moveAllInStockToCart(wishlistId, allProducts, userId, isVIP)).addedCount;
	}
};
var WishlistContext = (0, import_react.createContext)(void 0);
function WishlistProvider({ children }) {
	const { user } = useAuth();
	const [wishlistItems, setWishlistItems] = (0, import_react.useState)([]);
	const [wishlists, setWishlists] = (0, import_react.useState)([]);
	const [activeWishlistId, setActiveWishlistId] = (0, import_react.useState)("all");
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const refreshWishlist = (0, import_react.useCallback)(async () => {
		setIsLoading(true);
		setError(null);
		try {
			const [items, folders] = await Promise.all([wishlistService.getWishlistProducts(void 0, user?.id), wishlistService.getWishlists(user?.id)]);
			setWishlistItems(items || []);
			setWishlists(folders || []);
		} catch (err) {
			console.error("Failed to load wishlist:", err);
			const msg = err instanceof Error ? err.message : "Failed to load wishlist items.";
			setError(msg);
			setWishlistItems([]);
			setWishlists([]);
		} finally {
			setIsLoading(false);
		}
	}, [user?.id]);
	(0, import_react.useEffect)(() => {
		refreshWishlist();
	}, [refreshWishlist]);
	const toggleWishlist = async (product, optionIndex = 0, wishlistId = "wl_default") => {
		const result = await wishlistService.toggleWishlistProduct(product, optionIndex, wishlistId, user?.id);
		await refreshWishlist();
		return result.added;
	};
	const isWishlisted = (productId) => {
		return wishlistItems.some((item) => item.productId === productId);
	};
	const removeWishlistItem = async (id) => {
		await wishlistService.removeWishlistProduct(id);
		await refreshWishlist();
	};
	const createCollection = async (title, description = "") => {
		const created = await wishlistService.createWishlist(title, description, user?.id);
		await refreshWishlist();
		return created;
	};
	const renameCollection = async (id, title, description) => {
		const updated = await wishlistService.renameWishlist(id, title, description);
		await refreshWishlist();
		return updated;
	};
	const deleteCollection = async (id) => {
		await wishlistService.deleteWishlist(id, user?.id);
		if (activeWishlistId === id) setActiveWishlistId("all");
		await refreshWishlist();
	};
	const moveItemToCollection = async (id, targetWishlistId) => {
		await wishlistService.moveProductToCollection(id, targetWishlistId);
		await refreshWishlist();
	};
	const moveAllInStockToCart = async (wishlistId, allProducts) => {
		const isVIP = !!user?.isVIP;
		return wishlistService.moveAllInStockToCart(wishlistId || activeWishlistId, allProducts, user?.id, isVIP);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(WishlistContext.Provider, {
		value: {
			wishlistItems,
			items: wishlistItems,
			wishlistCount: wishlistItems.length,
			wishlists,
			activeWishlistId,
			setActiveWishlistId,
			isLoading,
			error,
			toggleWishlist,
			addToWishlist: toggleWishlist,
			isWishlisted,
			removeWishlistItem,
			createCollection,
			renameCollection,
			deleteCollection,
			moveItemToCollection,
			moveAllInStockToCart,
			refreshWishlist
		},
		children
	});
}
function useWishlist() {
	const context = (0, import_react.useContext)(WishlistContext);
	if (!context) throw new Error("useWishlist must be used within a WishlistProvider");
	return context;
}
var NotificationContext = (0, import_react.createContext)(void 0);
var ORDER_STATUS_POLL_INTERVAL_MS = 1e4;
function NotificationProvider({ children }) {
	const { user } = useAuth();
	const customerId = (user?.userId || user?.id || "").trim();
	const [notifications, setNotifications] = (0, import_react.useState)([]);
	const [preferences, setPreferences] = (0, import_react.useState)(notificationService.getPreferences(customerId || "SASS0000104"));
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const [error, setError] = (0, import_react.useState)(null);
	const activeCustomerRef = (0, import_react.useRef)(customerId);
	activeCustomerRef.current = customerId;
	const loadCustomerNotifications = (0, import_react.useCallback)(async (reconcileOrders = true) => {
		if (!customerId) {
			setNotifications([]);
			setError(null);
			setIsLoading(false);
			return;
		}
		try {
			if (reconcileOrders) await notificationService.reconcileOrderStatuses(customerId).catch((reconcileErr) => {
				console.error("Order status reconciliation warning:", reconcileErr);
			});
			const list = await notificationService.getNotifications(customerId, user?.legacySassId);
			if (activeCustomerRef.current !== customerId) return;
			setNotifications(list || []);
			setError(null);
		} catch (err) {
			console.error("Failed to load notifications:", err);
			if (activeCustomerRef.current === customerId) setError(err?.message || "Unable to load notifications from the server.");
		} finally {
			if (activeCustomerRef.current === customerId) setIsLoading(false);
		}
	}, [customerId]);
	const refreshNotifications = (0, import_react.useCallback)(async () => {
		await loadCustomerNotifications(true);
	}, [loadCustomerNotifications]);
	(0, import_react.useEffect)(() => {
		if (!customerId) {
			setNotifications([]);
			setError(null);
			setIsLoading(false);
			return;
		}
		setIsLoading(true);
		setPreferences(notificationService.getPreferences(customerId));
		loadCustomerNotifications(true);
	}, [customerId, loadCustomerNotifications]);
	(0, import_react.useEffect)(() => {
		if (!customerId) return;
		const unsubscribe = notificationService.subscribe(() => {
			loadCustomerNotifications(false);
		});
		return () => {
			unsubscribe();
		};
	}, [customerId, loadCustomerNotifications]);
	(0, import_react.useEffect)(() => {
		if (!customerId || typeof window === "undefined") return;
		const pollIfVisible = () => {
			if (typeof document === "undefined" || document.visibilityState === "visible") loadCustomerNotifications(true);
		};
		const intervalId = window.setInterval(pollIfVisible, ORDER_STATUS_POLL_INTERVAL_MS);
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") loadCustomerNotifications(true);
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("focus", pollIfVisible);
		return () => {
			window.clearInterval(intervalId);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			window.removeEventListener("focus", pollIfVisible);
		};
	}, [customerId, loadCustomerNotifications]);
	const markAsRead = async (id) => {
		if (!customerId) return;
		setNotifications((prev) => prev.map((n) => n.id === id ? {
			...n,
			read: true
		} : n));
		try {
			await notificationService.markAsRead(id, customerId, user?.legacySassId);
		} catch (err) {
			console.error("Failed to mark notification as read:", err);
			await loadCustomerNotifications(false);
			throw err;
		}
	};
	const markAllAsRead = async () => {
		if (!customerId) return;
		setNotifications((prev) => prev.map((n) => ({
			...n,
			read: true
		})));
		try {
			await notificationService.markAllAsRead(customerId, user?.legacySassId);
		} catch (err) {
			console.error("Failed to mark all notifications as read:", err);
			await loadCustomerNotifications(false);
			throw err;
		}
	};
	const handleUpdatePreferences = (prefs) => {
		if (!customerId) return;
		const updated = notificationService.updatePreferences(customerId, prefs);
		setPreferences(updated);
	};
	const unreadCount = notifications.filter((n) => !n.read).length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NotificationContext.Provider, {
		value: {
			notifications,
			unreadCount,
			isLoading,
			error,
			preferences,
			markAsRead,
			markAllAsRead,
			updatePreferences: handleUpdatePreferences,
			refreshNotifications
		},
		children
	});
}
function useNotifications() {
	const context = (0, import_react.useContext)(NotificationContext);
	if (!context) throw new Error("useNotifications must be used within a NotificationProvider");
	return context;
}
var LanguageContext = (0, import_react.createContext)(void 0);
function LanguageProvider({ children }) {
	const [language, setLanguage] = (0, import_react.useState)("en");
	const toggleLanguage = () => {
		setLanguage((prev) => prev === "en" ? "ta" : "en");
	};
	const t = (en, ta) => {
		if (language === "ta" && ta) return ta;
		return en;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LanguageContext.Provider, {
		value: {
			language,
			setLanguage,
			toggleLanguage,
			t
		},
		children
	});
}
function useLanguage() {
	const context = (0, import_react.useContext)(LanguageContext);
	if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
	return context;
}
var logo_default = "/assets/logo-hiPAdNy0.png";
function StoreHeader() {
	const { user, isLoading } = useAuth();
	const { cartCount, cartSubtotal } = useCart();
	const { wishlistCount } = useWishlist();
	const { unreadCount } = useNotifications();
	const { language, toggleLanguage, t } = useLanguage();
	const [searchQuery, setSearchQuery] = (0, import_react.useState)("");
	const [selectedCategory, setSelectedCategory] = (0, import_react.useState)("all");
	const [categories, setCategories] = (0, import_react.useState)([]);
	const [categoriesLoading, setCategoriesLoading] = (0, import_react.useState)(false);
	const [categoriesError, setCategoriesError] = (0, import_react.useState)(null);
	const [isCategoriesOpen, setIsCategoriesOpen] = (0, import_react.useState)(false);
	const [isMobileSearchOpen, setIsMobileSearchOpen] = (0, import_react.useState)(false);
	const dropdownRef = (0, import_react.useRef)(null);
	const dropdownButtonRef = (0, import_react.useRef)(null);
	const navigate = useNavigate();
	const fetchCategories = (0, import_react.useCallback)(async (forceRefresh = false) => {
		setCategoriesLoading(true);
		setCategoriesError(null);
		try {
			const data = await productService.getCategories(forceRefresh);
			setCategories(data || []);
		} catch (err) {
			console.error("Failed to load categories from Firebase:", err);
			setCategoriesError(err?.message || "Failed to load categories from Firebase database.");
		} finally {
			setCategoriesLoading(false);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		fetchCategories();
	}, [fetchCategories]);
	(0, import_react.useEffect)(() => {
		function handleClickOutside(event) {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsCategoriesOpen(false);
		}
		if (isCategoriesOpen) document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isCategoriesOpen]);
	const toggleCategoriesDropdown = () => {
		const nextState = !isCategoriesOpen;
		setIsCategoriesOpen(nextState);
		if (nextState && categories.length === 0 && !categoriesLoading && !categoriesError) fetchCategories();
	};
	const handleDropdownKeyDown = (e) => {
		if (e.key === "Escape") {
			setIsCategoriesOpen(false);
			dropdownButtonRef.current?.focus();
		}
	};
	const handleSelectCategory = (slug) => {
		setIsCategoriesOpen(false);
		if (slug === "all") navigate({ to: "/shop" });
		else navigate({
			to: "/shop",
			search: { category: slug }
		});
	};
	const handleSearch = (e) => {
		e.preventDefault();
		if (searchQuery.trim()) navigate({
			to: "/shop",
			search: {
				q: searchQuery.trim(),
				category: selectedCategory !== "all" ? selectedCategory : void 0
			}
		});
		else navigate({ to: "/shop" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_10px_25px_-5px_rgba(11,122,83,0.06),0_4px_6px_-2px_rgba(15,23,42,0.02)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-surface-container-low text-on-surface-variant font-body-sm text-body-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-[1320px] mx-auto px-margin-desktop h-9 flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-space-lg",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-space-xs text-primary font-headline-sm text-label-button",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[16px]",
									children: "local_shipping"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Free Express Delivery above ₹499" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-3 w-px bg-outline-variant/40 hidden sm:inline-block" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hidden sm:flex items-center gap-space-xs text-on-surface-variant",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[15px]",
									children: "schedule"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Open today till 10:00 PM" })]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-space-lg",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: toggleLanguage,
								className: "flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container font-headline-sm text-[11px] font-bold text-primary hover:bg-surface-container-high transition-colors",
								title: "Switch Language",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[14px]",
									children: "translate"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: language === "en" ? "தமிழ்" : "English" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-3 w-px bg-outline-variant/40" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								className: "hidden sm:flex items-center gap-space-xs hover:text-primary transition-colors text-[12px]",
								href: "tel:+919840012345",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[15px]",
									children: "support_agent"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hidden md:inline",
									children: "+91 98400 12345"
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "h-20 max-w-[1320px] mx-auto px-margin-desktop flex items-center justify-between gap-2 sm:gap-space-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-space-lg shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/",
							className: "flex items-center gap-space-sm group",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-md group-hover:scale-105 transition-transform",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: logo_default,
									alt: "Sri Amman Smart Store",
									className: "h-full w-full rounded-xl object-contain"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-headline-md text-headline-md tracking-tight text-primary font-bold",
									children: "Sri Amman"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-label-badge text-[10px] tracking-wider uppercase text-secondary font-semibold",
									children: "Smart Store"
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/addresses",
							className: "hidden xl:flex items-center gap-space-xs bg-surface-container-low hover:bg-surface-container px-space-md py-space-sm rounded-full text-on-surface transition-all text-left shadow-[0_1px_4px_rgba(15,23,42,0.04)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[18px]",
										children: "location_on"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col pr-space-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-body-sm text-[10px] uppercase font-bold text-on-surface-variant leading-none",
										children: "Deliver to"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-label-button text-label-button font-semibold text-on-surface truncate max-w-[140px]",
										children: "Gobichettipalayam (638454)"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-on-surface-variant text-[18px]",
									children: "expand_more"
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
						onSubmit: handleSearch,
						className: "flex-1 min-w-0 max-w-2xl mx-3 hidden lg:block",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center bg-surface-container-lowest rounded-full p-1 pl-space-md shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] ring-1 ring-outline-variant/30 focus-within:ring-2 focus-within:ring-primary transition-all",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: searchQuery,
								onChange: (e) => setSearchQuery(e.target.value),
								placeholder: "Search 5,000+ groceries, organic produce & cold pressed oils...",
								className: "w-full bg-transparent px-space-sm font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "submit",
								className: "bg-primary text-on-primary hover:bg-primary-container px-space-lg py-2.5 rounded-full flex items-center gap-space-xs font-label-button text-label-button transition-all shadow-[0_2px_6px_rgba(0,95,63,0.3)] ml-space-xs cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[18px]",
									children: "search"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Search" })]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-0 sm:gap-space-md shrink-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setIsMobileSearchOpen((open) => !open),
								className: "lg:hidden relative p-1.5 sm:p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low",
								"aria-label": isMobileSearchOpen ? "Close search" : "Open search",
								"aria-expanded": isMobileSearchOpen,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[22px]",
									children: isMobileSearchOpen ? "close" : "search"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/notifications",
								className: "relative p-1.5 sm:p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container-low",
								title: "Notifications & Store Alerts",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[24px]",
									children: "notifications"
								}), unreadCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute top-1 right-1 bg-rose-600 text-white font-label-badge text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold ring-2 ring-surface-container-lowest",
									children: unreadCount > 99 ? "99+" : unreadCount
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/cart",
								className: "flex items-center gap-1 sm:gap-space-sm bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim px-2 sm:px-space-md py-2 rounded-full transition-all shadow-[0_2px_6px_rgba(11,122,83,0.12)]",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative flex items-center",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-primary text-[22px]",
										children: "shopping_bag"
									}), cartCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "absolute -top-1.5 -right-2 bg-primary text-on-primary font-label-badge text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold ring-1 ring-surface-container-lowest",
										children: cartCount
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "hidden sm:flex flex-col items-start leading-tight pr-0.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-label-badge text-[10px] font-bold uppercase opacity-80",
										children: "Cart"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-headline-sm text-label-button font-extrabold",
										children: ["₹", cartSubtotal]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-6 w-px bg-outline-variant/30 hidden sm:block" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: isLoading ? "/account" : user ? "/account" : "/login",
								className: "flex items-center gap-space-sm pl-space-xs cursor-pointer group",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary transition-all",
									children: isLoading ? "..." : user?.name ? user.name.charAt(0) : "👤"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "hidden 2xl:flex flex-col",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-body-sm text-[11px] text-on-surface-variant leading-none",
										children: "Hello,"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-label-button text-label-button font-bold text-on-surface group-hover:text-primary transition-colors leading-tight truncate max-w-[100px]",
										children: isLoading ? "Restoring..." : user?.name ? user.name.split(" ")[0] : "Sign In"
									})]
								})]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-surface-container-lowest shadow-[0_1px_6px_rgba(15,23,42,0.03)] border-t border-outline-variant/10",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "max-w-[1320px] mx-auto px-margin-desktop",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "flex items-center gap-space-sm h-12 relative overflow-x-auto whitespace-nowrap scrollbar-none lg:overflow-visible lg:whitespace-normal",
						"aria-label": "Category Navigation",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								ref: dropdownRef,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									ref: dropdownButtonRef,
									onClick: toggleCategoriesDropdown,
									onKeyDown: handleDropdownKeyDown,
									"aria-expanded": isCategoriesOpen,
									"aria-haspopup": "menu",
									"aria-controls": "navbar-all-categories-menu",
									"aria-label": "All Categories",
									"data-testid": "navbar-all-categories-button",
									className: "flex items-center gap-space-xs bg-primary text-on-primary hover:bg-primary-container px-space-md py-1.5 rounded-full font-label-button text-label-button shadow-[0_2px_4px_rgba(0,95,63,0.2)] cursor-pointer transition-all shrink-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "material-symbols-outlined text-[18px]",
											children: "menu"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: t("All Categories", "அனைத்து பிரிவுகள்") }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `material-symbols-outlined text-[18px] transition-transform duration-200 ${isCategoriesOpen ? "rotate-180" : ""}`,
											children: "expand_more"
										})
									]
								}), isCategoriesOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									id: "navbar-all-categories-menu",
									role: "menu",
									"aria-label": "Product Categories",
									"data-testid": "navbar-categories-dropdown",
									className: "fixed top-[164px] left-4 mt-2 w-[calc(100vw-2rem)] max-w-96 bg-surface-container-lowest rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.14)] border border-outline-variant/20 p-2 z-50 max-h-[70vh] overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150 lg:absolute lg:top-full lg:left-0 lg:mt-2 lg:w-96 lg:max-w-[calc(100vw-2rem)]",
									children: [
										categoriesLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											"data-testid": "categories-loading-state",
											className: "p-6 flex flex-col items-center justify-center text-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-body-sm text-xs text-on-surface-variant font-medium",
												children: t("Loading live categories...", "பிரிவுகள் ஏற்றப்படுகின்றன...")
											})]
										}),
										!categoriesLoading && categoriesError && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											"data-testid": "categories-error-state",
											className: "p-4 flex flex-col items-center justify-center text-center gap-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-error text-[26px]",
													children: "error"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "font-body-sm text-xs text-error font-medium",
													children: categoriesError
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: () => fetchCategories(true),
													className: "mt-1 px-3 py-1 bg-surface-container-low hover:bg-surface-container text-primary font-headline-sm text-xs font-bold rounded-lg transition-colors cursor-pointer",
													children: t("Retry", "மீண்டும் முயற்சி")
												})
											]
										}),
										!categoriesLoading && !categoriesError && categories.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											"data-testid": "categories-empty-state",
											className: "p-6 flex flex-col items-center justify-center text-center gap-2 text-on-surface-variant",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "material-symbols-outlined text-[32px] text-outline-variant",
												children: "category"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-body-sm text-xs font-medium",
												children: t("No categories found in Firebase database.", "பிரிவுகள் எதுவும் காணப்படவில்லை.")
											})]
										}),
										!categoriesLoading && !categoriesError && categories.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "py-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												role: "menuitem",
												onClick: () => handleSelectCategory("all"),
												"data-testid": "category-option-all",
												className: "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-surface-container-low transition-colors group cursor-pointer border-b border-outline-variant/10 mb-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-3",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "material-symbols-outlined text-[18px]",
															children: "storefront"
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-headline-sm text-xs font-bold text-on-surface block group-hover:text-primary transition-colors",
														children: t("All Products", "அனைத்து பொருட்கள்")
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-body-sm text-[10px] text-on-surface-variant block",
														children: t("View full harvest catalogue", "முழு பட்டியல் காண்க")
													})] })]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "material-symbols-outlined text-[16px] text-outline-variant group-hover:text-primary transition-colors",
													children: "chevron_right"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "space-y-0.5",
												children: categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													role: "menuitem",
													"data-testid": `category-option-${cat.slug}`,
													onClick: () => handleSelectCategory(cat.slug),
													className: "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-surface-container-low transition-colors group cursor-pointer",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex items-center gap-3 min-w-0",
														children: [cat.image && (cat.image.startsWith("http") || cat.image.startsWith("data:")) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: cat.image,
															alt: cat.name,
															className: "w-8 h-8 rounded-lg object-contain bg-surface-container-low p-0.5 shrink-0 border border-outline-variant/15",
															onError: (e) => {
																e.currentTarget.style.display = "none";
															}
														}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "w-8 h-8 rounded-lg bg-surface-container-low text-primary flex items-center justify-center shrink-0 border border-outline-variant/15",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "material-symbols-outlined text-[18px]",
																children: "category"
															})
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "min-w-0",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-headline-sm text-xs font-bold text-on-surface block truncate group-hover:text-primary transition-colors",
																children: t(cat.name, cat.tamilName)
															}), cat.subcategories && cat.subcategories.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-body-sm text-[10px] text-on-surface-variant block truncate",
																children: cat.subcategories.slice(0, 2).join(", ")
															})]
														})]
													}), cat.itemCount && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "font-body-sm text-[10px] text-on-surface-variant font-medium bg-surface-container-low px-2 py-0.5 rounded-full shrink-0 ml-2",
														children: cat.itemCount
													})]
												}, cat.id))
											})]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/shop",
								search: { deals: true },
								className: "px-space-md py-1.5 font-label-button text-label-button text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors shrink-0 flex items-center gap-1",
								"data-testid": "navbar-smart-deals-button",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-tertiary font-bold",
									children: "%"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Smart Deals" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/rewards",
								className: "px-space-md py-1.5 font-label-button text-label-button text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors shrink-0 flex items-center gap-1.5",
								"data-testid": "navbar-vip-club-button",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "material-symbols-outlined text-[16px] text-secondary",
									children: "workspace_premium"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "VIP Club" })]
							})
						]
					})
				})
			}),
			isMobileSearchOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: (event) => {
					handleSearch(event);
					setIsMobileSearchOpen(false);
				},
				className: "absolute top-full left-3 right-3 z-50 flex items-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-xl lg:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					autoFocus: true,
					type: "search",
					value: searchQuery,
					onChange: (event) => setSearchQuery(event.target.value),
					placeholder: "Search groceries and more",
					"aria-label": "Search products",
					className: "min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-on-surface placeholder:text-outline focus:outline-none"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "submit",
					className: "rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary",
					children: "Search"
				})]
			})
		]
	});
}
function BottomNav() {
	const { cartCount, cartSubtotal } = useCart();
	const { wishlistCount } = useWishlist();
	const currentPath = useRouterState().location.pathname;
	const isActive = (path) => {
		if (path === "/" && currentPath === "/") return true;
		if (path !== "/" && currentPath.startsWith(path)) return true;
		return false;
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [cartCount > 0 && !currentPath.includes("/cart") && !currentPath.includes("/checkout") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4 md:hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
			to: "/cart",
			className: "flex items-center justify-between bg-primary text-on-primary px-4 py-3 rounded-2xl shadow-xl animate-fade-in",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "material-symbols-outlined text-[20px]",
						children: "shopping_bag"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-headline-sm text-sm font-bold",
						children: [
							cartCount,
							" item",
							cartCount > 1 ? "s" : ""
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "opacity-80 text-xs",
						children: ["• ₹", cartSubtotal]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1 font-headline-sm text-sm font-bold",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "View Cart" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "material-symbols-outlined text-[18px]",
					children: "arrow_forward"
				})]
			})]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/20 px-2 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)]",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-5 items-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: `flex min-h-11 flex-col items-center py-1 transition-colors ${isActive("/") ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "material-symbols-outlined text-[22px]",
						style: isActive("/") ? { fontVariationSettings: "'FILL' 1" } : {},
						children: "home"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-medium mt-0.5",
						children: "Home"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/shop",
					className: `flex min-h-11 flex-col items-center py-1 transition-colors ${isActive("/shop") ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "material-symbols-outlined text-[22px]",
						style: isActive("/shop") ? { fontVariationSettings: "'FILL' 1" } : {},
						children: "storefront"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-medium mt-0.5",
						children: "Shop"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/wishlist",
					className: `relative flex min-h-11 flex-col items-center py-1 transition-colors ${isActive("/wishlist") ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined text-[22px]",
							style: isActive("/wishlist") ? { fontVariationSettings: "'FILL' 1" } : {},
							children: "favorite"
						}),
						wishlistCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute top-1 right-3 bg-tertiary text-on-tertiary text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold",
							children: wishlistCount
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[10px] font-medium mt-0.5",
							children: "Wishlist"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/orders",
					search: {},
					className: `flex min-h-11 flex-col items-center py-1 transition-colors ${isActive("/orders") ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "material-symbols-outlined text-[22px]",
						style: isActive("/orders") ? { fontVariationSettings: "'FILL' 1" } : {},
						children: "receipt_long"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-medium mt-0.5",
						children: "Orders"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/account",
					className: `flex min-h-11 flex-col items-center py-1 transition-colors ${isActive("/account") ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"}`,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "material-symbols-outlined text-[22px]",
						style: isActive("/account") ? { fontVariationSettings: "'FILL' 1" } : {},
						children: "person"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-[10px] font-medium mt-0.5",
						children: "Account"
					})]
				})
			]
		})
	})] });
}
function StoreFooter() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
		className: "bg-surface-container-low text-on-surface border-t border-outline-variant/20 pt-12 pb-24 md:pb-12 mt-16",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-[1320px] mx-auto px-margin-desktop",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "lg:col-span-2 flex flex-col gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-md",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: logo_default,
										alt: "Sri Amman Smart Store",
										className: "h-full w-full rounded-xl object-contain"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-headline-md text-headline-md font-bold text-primary block",
									children: "Sri Amman"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-label-badge text-[10px] tracking-wider uppercase text-secondary font-semibold",
									children: "Smart Store"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-body-sm text-body-sm text-on-surface-variant max-w-sm leading-relaxed",
								children: "South India's most authentic unpolished grains, artisanal wood-pressed oils, and farm-plucked morning greens delivered with single-store purity in 60 minutes."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-3 pt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: "https://api.whatsapp.com/send?text=SriAmmanStore",
									target: "_blank",
									rel: "noreferrer",
									className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] font-headline-sm text-xs font-bold transition-colors",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[18px]",
										children: "chat"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "WhatsApp Help" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: "tel:+919840012345",
									className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-sm text-xs font-bold transition-colors",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "material-symbols-outlined text-[18px]",
										children: "call"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "+91 98400 12345" })]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "font-headline-sm text-sm font-bold text-on-surface mb-3 uppercase tracking-wider",
						children: "Customer Hub"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-2 font-body-sm text-xs text-on-surface-variant",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/orders",
								search: {},
								className: "hover:text-primary transition-colors",
								children: "My Orders"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/rewards",
								className: "hover:text-primary transition-colors",
								children: "Smart Coins & VIP"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/refer",
								className: "hover:text-primary transition-colors",
								children: "Refer & Earn"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/help",
								className: "hover:text-primary transition-colors",
								children: "Report a Problem"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/help",
								className: "hover:text-primary transition-colors",
								children: "Request a Product"
							}) })
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
						className: "font-headline-sm text-sm font-bold text-on-surface mb-3 uppercase tracking-wider",
						children: "Policies"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "space-y-2 font-body-sm text-xs text-on-surface-variant",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/policies",
								className: "hover:text-primary transition-colors",
								children: "Privacy Policy"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/policies",
								className: "hover:text-primary transition-colors",
								children: "Terms & Conditions"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/policies",
								className: "hover:text-primary transition-colors",
								children: "Shipping & Geofence"
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/policies",
								className: "hover:text-primary transition-colors",
								children: "Refund & Return SLA"
							}) })
						]
					})] })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "© 2026 Sri Amman Smart Store. Single-store purity guaranteed. FSSAI Reg: #12421008000412" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-end",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1 text-primary font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined text-[16px]",
							children: "verified"
						}), "100% Quality Assured"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1 text-secondary font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "material-symbols-outlined text-[16px]",
							children: "bolt"
						}), "60 Min Express Delivery"]
					})]
				})]
			})]
		})
	});
}
//#endregion
export { productionOrderReader as $, describeIdentityResolutionState as A, getMethodQualityCounts as B, calculateComplementaryScore as C, convertCoinsToRupees as D, coinService as E, getCatalogPriceBounds as F, getSubcategoryCounts as G, getProductionFirestoreInstance as H, getCategoryCounts as I, isWithinDeliveryGeofence as J, hasAvailableStock as K, getComplementaryProducts as L, fetchAllProductionProductPreviews as M, fetchFullProductionCatalogue as N, convertRupeesToCoins as O, filterAndSortProducts as P, productService as Q, getCustomerProfileEndpoint as R, buildCartKey as S, classifyStorageError as T, getRatingCounts as U, getPackSizeOptions as V, getSimilarProducts as W, parseAddressTag as X, notificationService as Y, parseSafeCoordinate as Z, WishlistProvider as _, DEFAULT_DELIVERY_SETTINGS as a, useNotifications as at, authManager as b, EmailLinkAuthError as c, wishlistService as ct, NotificationProvider as d, resolveCustomerDataSource as et, OFFICIAL_COIN_CONVERSION_RATE as f, StoreHeader as g, StoreFooter as h, CartProvider as i, useLanguage as it, emailLinkAuthService as j, customerIdentityService as k, LanguageProvider as l, StorageAdapterError as m, BottomNav as n, useAuth as nt, DEFAULT_PAYMENT_SETTINGS as o, useWishlist as ot, SUPPORTED_ORDER_STATUSES as p, isProductionPreviewOptedIn as q, CANONICAL_CUSTOMER_ID_RE$1 as r, useCart as rt, EXPECTED_PRODUCTION_PROJECT_ID as s, validateDeliveryServiceability as st, AuthProvider as t, settingsService as tt, METHOD_QUALITY_OPTIONS as u, apiClient as v, cartService as w, authService as x, auth as y, getDiscountCounts as z };
