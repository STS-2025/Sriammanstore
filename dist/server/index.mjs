globalThis.__nitro_main__ = import.meta.url;
import { i as HTTPError, n as defineLazyEventHandler, t as H3Core } from "./_libs/h3+rou3+srvx.mjs";
import { t as HookableCore } from "./_libs/hookable.mjs";
import { r as FastResponse } from "./_libs/h3-v2+rou3+srvx.mjs";
//#region #nitro-vite-setup
function lazyService(loader) {
	let promise, mod;
	return { fetch(req) {
		if (mod) return mod.fetch(req);
		if (!promise) promise = loader().then((_mod) => mod = _mod.default || _mod);
		return promise.then((mod) => mod.fetch(req));
	} };
}
var services = { ["ssr"]: lazyService(() => import("./_ssr/ssr.mjs")) };
globalThis.__nitro_vite_envs__ = services;
//#endregion
//#region #nitro/virtual/public-assets-data
var public_assets_data_default = {
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-10-08T10:54:29.000Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-10-08T10:54:29.000Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/assets/help-Cxe2ukhr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32b7-/o7xRflOOx0TNfYxM7qPSKg+Du4\"",
		"mtime": "2026-11-02T12:21:15.121Z",
		"size": 12983,
		"path": "../public/assets/help-Cxe2ukhr.js"
	},
	"/assets/prod-preview-s2EfdKH9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c7ff-SvwBg3qWeumkacEHvdFI1IEuZiY\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 51199,
		"path": "../public/assets/prod-preview-s2EfdKH9.js"
	},
	"/assets/policies-BmL4IOTe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5a-C7OX3y7rpuo96Lrh80o3WdQF+bQ\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 6746,
		"path": "../public/assets/policies-BmL4IOTe.js"
	},
	"/assets/product-DrI6R6Zb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6afd-I5T4igQ7tegEihPJK3HyUC1mbvU\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 27389,
		"path": "../public/assets/product-DrI6R6Zb.js"
	},
	"/assets/ProductCard-BJEbUfWP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f7a-2CupBO8MgethJtvMqjHEHfcYWz4\"",
		"mtime": "2026-11-02T12:21:15.121Z",
		"size": 8058,
		"path": "../public/assets/ProductCard-BJEbUfWP.js"
	},
	"/assets/rolldown-runtime-CbXtAM7H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24d-+aXgvbJ1Wwcp2A8AXKIBByksYC8\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 589,
		"path": "../public/assets/rolldown-runtime-CbXtAM7H.js"
	},
	"/assets/logo-hiPAdNy0.png": {
		"type": "image/png",
		"etag": "\"72228-UzkuzWxsdH0kyi4aPP9yzq/LwQQ\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 467496,
		"path": "../public/assets/logo-hiPAdNy0.png"
	},
	"/assets/routes-BFlPzEzp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3757-yculnXcN6sTEG3g8AMcm+MndDI8\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 14167,
		"path": "../public/assets/routes-BFlPzEzp.js"
	},
	"/assets/shop-DyYkEHuG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8954-LZf6aFrgdCcsc8WekZwD7zDZmhY\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 35156,
		"path": "../public/assets/shop-DyYkEHuG.js"
	},
	"/assets/supportService-IJ40CtVU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"300-kjPmOC0B0dtSUz4dBeEAd2iguz4\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 768,
		"path": "../public/assets/supportService-IJ40CtVU.js"
	},
	"/assets/useSearch-C-46Zquq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"de-anBMX3nfuobVn81Aq2o1g9CaEmU\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 222,
		"path": "../public/assets/useSearch-C-46Zquq.js"
	},
	"/placeholders/chicken-masala-placeholder.svg": {
		"type": "image/svg+xml",
		"etag": "\"865-6GUJosbi9KF1vMiggbkS0W5gTLo\"",
		"mtime": "2026-10-16T12:09:39.734Z",
		"size": 2149,
		"path": "../public/placeholders/chicken-masala-placeholder.svg"
	},
	"/placeholders/spices.svg": {
		"type": "image/svg+xml",
		"etag": "\"8b7-ZMRI9dPAfN2VpQXwvVaDbBJtTG0\"",
		"mtime": "2026-11-02T11:11:38.745Z",
		"size": 2231,
		"path": "../public/placeholders/spices.svg"
	},
	"/placeholders/turmeric-powder.svg": {
		"type": "image/svg+xml",
		"etag": "\"868-KFpVA12AoRLRrbu33OTyowSOtd0\"",
		"mtime": "2026-10-16T12:27:09.235Z",
		"size": 2152,
		"path": "../public/placeholders/turmeric-powder.svg"
	},
	"/public/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-10-08T10:54:29.000Z",
		"size": 20373,
		"path": "../public/public/favicon.ico"
	},
	"/public/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-10-08T10:54:29.000Z",
		"size": 160,
		"path": "../public/public/robots.txt"
	},
	"/public/placeholders/chicken-masala-placeholder.svg": {
		"type": "image/svg+xml",
		"etag": "\"865-6GUJosbi9KF1vMiggbkS0W5gTLo\"",
		"mtime": "2026-10-16T12:09:39.734Z",
		"size": 2149,
		"path": "../public/public/placeholders/chicken-masala-placeholder.svg"
	},
	"/public/placeholders/turmeric-powder.svg": {
		"type": "image/svg+xml",
		"etag": "\"868-KFpVA12AoRLRrbu33OTyowSOtd0\"",
		"mtime": "2026-10-16T12:27:09.235Z",
		"size": 2152,
		"path": "../public/public/placeholders/turmeric-powder.svg"
	},
	"/public/placeholders/spices.svg": {
		"type": "image/svg+xml",
		"etag": "\"8b7-ZMRI9dPAfN2VpQXwvVaDbBJtTG0\"",
		"mtime": "2026-11-02T11:11:38.745Z",
		"size": 2231,
		"path": "../public/public/placeholders/spices.svg"
	},
	"/public/assets/help-Cxe2ukhr.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32b7-/o7xRflOOx0TNfYxM7qPSKg+Du4\"",
		"mtime": "2026-11-02T12:21:15.121Z",
		"size": 12983,
		"path": "../public/public/assets/help-Cxe2ukhr.js"
	},
	"/assets/styles-D4rYtW6g.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"24bf0-HfmUQfqBl7FzDmOGZr6gBBy0pLE\"",
		"mtime": "2026-11-02T12:21:15.130Z",
		"size": 150512,
		"path": "../public/assets/styles-D4rYtW6g.css"
	},
	"/assets/index-DpOr4bXV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cc83e-1mRfesuyWWT8Hkdb6kfX14wQV1c\"",
		"mtime": "2026-11-02T12:21:15.119Z",
		"size": 837694,
		"path": "../public/assets/index-DpOr4bXV.js"
	},
	"/assets/StoreFooter-BOWdzGYQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"de9ae-i2I1Lt0g4mgwHLEm3prLbncyz4w\"",
		"mtime": "2026-11-02T12:21:15.121Z",
		"size": 911790,
		"path": "../public/assets/StoreFooter-BOWdzGYQ.js"
	},
	"/public/assets/policies-BmL4IOTe.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a5a-C7OX3y7rpuo96Lrh80o3WdQF+bQ\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 6746,
		"path": "../public/public/assets/policies-BmL4IOTe.js"
	},
	"/public/assets/product-DrI6R6Zb.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6afd-I5T4igQ7tegEihPJK3HyUC1mbvU\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 27389,
		"path": "../public/public/assets/product-DrI6R6Zb.js"
	},
	"/public/assets/ProductCard-BJEbUfWP.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f7a-2CupBO8MgethJtvMqjHEHfcYWz4\"",
		"mtime": "2026-11-02T12:21:15.121Z",
		"size": 8058,
		"path": "../public/public/assets/ProductCard-BJEbUfWP.js"
	},
	"/public/assets/prod-preview-s2EfdKH9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c7ff-SvwBg3qWeumkacEHvdFI1IEuZiY\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 51199,
		"path": "../public/public/assets/prod-preview-s2EfdKH9.js"
	},
	"/public/assets/rolldown-runtime-CbXtAM7H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24d-+aXgvbJ1Wwcp2A8AXKIBByksYC8\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 589,
		"path": "../public/public/assets/rolldown-runtime-CbXtAM7H.js"
	},
	"/public/assets/logo-hiPAdNy0.png": {
		"type": "image/png",
		"etag": "\"72228-UzkuzWxsdH0kyi4aPP9yzq/LwQQ\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 467496,
		"path": "../public/public/assets/logo-hiPAdNy0.png"
	},
	"/public/assets/routes-BFlPzEzp.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3757-yculnXcN6sTEG3g8AMcm+MndDI8\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 14167,
		"path": "../public/public/assets/routes-BFlPzEzp.js"
	},
	"/public/assets/shop-DyYkEHuG.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8954-LZf6aFrgdCcsc8WekZwD7zDZmhY\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 35156,
		"path": "../public/public/assets/shop-DyYkEHuG.js"
	},
	"/public/assets/supportService-IJ40CtVU.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"300-kjPmOC0B0dtSUz4dBeEAd2iguz4\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 768,
		"path": "../public/public/assets/supportService-IJ40CtVU.js"
	},
	"/public/assets/useSearch-C-46Zquq.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"de-anBMX3nfuobVn81Aq2o1g9CaEmU\"",
		"mtime": "2026-11-02T12:21:15.123Z",
		"size": 222,
		"path": "../public/public/assets/useSearch-C-46Zquq.js"
	},
	"/public/assets/styles-D4rYtW6g.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"24bf0-HfmUQfqBl7FzDmOGZr6gBBy0pLE\"",
		"mtime": "2026-11-02T12:21:15.130Z",
		"size": 150512,
		"path": "../public/public/assets/styles-D4rYtW6g.css"
	},
	"/public/assets/index-DpOr4bXV.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"cc83e-1mRfesuyWWT8Hkdb6kfX14wQV1c\"",
		"mtime": "2026-11-02T12:21:15.119Z",
		"size": 837694,
		"path": "../public/public/assets/index-DpOr4bXV.js"
	},
	"/public/assets/StoreFooter-BOWdzGYQ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"de9ae-i2I1Lt0g4mgwHLEm3prLbncyz4w\"",
		"mtime": "2026-11-02T12:21:15.121Z",
		"size": 911790,
		"path": "../public/public/assets/StoreFooter-BOWdzGYQ.js"
	}
};
//#endregion
//#region #nitro/virtual/public-assets
var publicAssetBases = {};
function isPublicAssetURL(id = "") {
	if (public_assets_data_default[id]) return true;
	for (const base in publicAssetBases) if (id.startsWith(base)) return true;
	return false;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/route-rules.mjs
var headers = ((m) => function headersRouteRule(event) {
	for (const [key, value] of Object.entries(m.options || {})) event.res.headers.set(key, value);
});
//#endregion
//#region #nitro/virtual/routing
var findRouteRules = /* @__PURE__ */ (() => {
	const $0 = [{
		name: "headers",
		route: "/assets/**",
		handler: headers,
		options: { "cache-control": "public, max-age=31536000, immutable" }
	}];
	return (m, p) => {
		let r = [];
		if (p.charCodeAt(p.length - 1) === 47) p = p.slice(0, -1) || "/";
		let s = p.split("/");
		if (s.length > 1) {
			if (s[1] === "assets") r.unshift({
				data: $0,
				params: { "_": s.slice(2).join("/") }
			});
		}
		return r;
	};
})();
var _lazy_mP3PP5 = defineLazyEventHandler(() => import("./_chunks/ssr-renderer.mjs"));
var findRoute = /* @__PURE__ */ (() => {
	const data = {
		route: "/**",
		handler: _lazy_mP3PP5
	};
	return ((_m, p) => {
		return {
			data,
			params: { "_": p.slice(1) }
		};
	});
})();
[].filter(Boolean);
//#endregion
//#region node_modules/nitro/dist/runtime/internal/error/prod.mjs
var errorHandler = (error, event) => {
	const res = defaultHandler(error, event);
	return new FastResponse(typeof res.body === "string" ? res.body : JSON.stringify(res.body, null, 2), res);
};
function defaultHandler(error, event) {
	const unhandled = error.unhandled ?? !HTTPError.isError(error);
	const { status = 500, statusText = "" } = unhandled ? {} : error;
	if (status === 404) {
		const url = event.url || new URL(event.req.url);
		const baseURL = "/";
		if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) return {
			status: 302,
			headers: new Headers({ location: `${baseURL}${url.pathname.slice(1)}${url.search}` })
		};
	}
	const headers = new Headers(unhandled ? {} : error.headers);
	headers.set("content-type", "application/json; charset=utf-8");
	return {
		status,
		statusText,
		headers,
		body: {
			error: true,
			...unhandled ? {
				status,
				unhandled: true
			} : typeof error.toJSON === "function" ? error.toJSON() : {
				status,
				statusText,
				message: error.message
			}
		}
	};
}
//#endregion
//#region #nitro/virtual/error-handler
var errorHandlers = [errorHandler];
async function error_handler_default(error, event) {
	for (const handler of errorHandlers) try {
		const response = await handler(error, event, { defaultHandler });
		if (response) return response;
	} catch (error) {
		console.error(error);
	}
}
//#endregion
//#region #nitro/virtual/app
function createNitroApp() {
	const captureError = (error, errorCtx) => {
		if (errorCtx?.event) {
			const errors = errorCtx.event.req.context?.nitro?.errors;
			if (errors) errors.push({
				error,
				context: errorCtx
			});
		}
	};
	const h3App = createH3App({ onError(error, event) {
		return error_handler_default(error, event);
	} });
	let appHandler = (req) => {
		req.context ||= {};
		req.context.nitro = req.context.nitro || { errors: [] };
		return h3App.fetch(req);
	};
	return {
		fetch: appHandler,
		h3: h3App,
		hooks: void 0,
		captureError
	};
}
function createH3App(config) {
	const h3App = new H3Core(config);
	h3App["~findRoute"] = (event) => findRoute(event.req.method, event.url.pathname);
	h3App["~getMiddleware"] = (event, route) => {
		const pathname = event.url.pathname;
		const method = event.req.method;
		const middleware = [];
		const routeRules = getRouteRules(method, pathname);
		event.context.routeRules = routeRules?.routeRules;
		if (routeRules?.routeRuleMiddleware.length) middleware.push(...routeRules.routeRuleMiddleware);
		if (route?.data?.middleware?.length) middleware.push(...route.data.middleware);
		return middleware;
	};
	return h3App;
}
//#endregion
//#region node_modules/nitro/dist/runtime/internal/app.mjs
var APP_ID = "default";
function useNitroApp() {
	let instance = useNitroApp._instance;
	if (instance) return instance;
	instance = useNitroApp._instance = createNitroApp();
	globalThis.__nitro__ = globalThis.__nitro__ || {};
	globalThis.__nitro__[APP_ID] = instance;
	return instance;
}
function useNitroHooks() {
	const nitroApp = useNitroApp();
	const hooks = nitroApp.hooks;
	if (hooks) return hooks;
	return nitroApp.hooks = new HookableCore();
}
function getRouteRules(method, pathname) {
	const m = findRouteRules(method, pathname);
	if (!m?.length) return { routeRuleMiddleware: [] };
	const routeRules = {};
	for (const layer of m) for (const rule of layer.data) {
		const currentRule = routeRules[rule.name];
		if (currentRule) {
			if (rule.options === false) {
				delete routeRules[rule.name];
				continue;
			}
			if (typeof currentRule.options === "object" && typeof rule.options === "object") currentRule.options = {
				...currentRule.options,
				...rule.options
			};
			else currentRule.options = rule.options;
			currentRule.route = rule.route;
			currentRule.params = {
				...currentRule.params,
				...layer.params
			};
		} else if (rule.options !== false) routeRules[rule.name] = {
			...rule,
			params: layer.params
		};
	}
	const middleware = [];
	const orderedRules = Object.values(routeRules).sort((a, b) => (a.handler?.order || 0) - (b.handler?.order || 0));
	for (const rule of orderedRules) {
		if (rule.options === false || !rule.handler) continue;
		middleware.push(rule.handler(rule));
	}
	return {
		routeRules,
		routeRuleMiddleware: middleware
	};
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/_module-handler.mjs
function createHandler(hooks) {
	const nitroApp = useNitroApp();
	const nitroHooks = useNitroHooks();
	return {
		async fetch(request, env, context) {
			globalThis.__env__ = env;
			augmentReq(request, {
				env,
				context
			});
			const ctxExt = {};
			const url = new URL(request.url);
			if (hooks.fetch) {
				const res = await hooks.fetch(request, env, context, url, ctxExt);
				if (res) return res;
			}
			return await nitroApp.fetch(request);
		},
		scheduled(controller, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:scheduled", {
				controller,
				env,
				context
			}) || Promise.resolve());
		},
		email(message, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:email", {
				message,
				event: message,
				env,
				context
			}) || Promise.resolve());
		},
		queue(batch, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:queue", {
				batch,
				event: batch,
				env,
				context
			}) || Promise.resolve());
		},
		tail(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:tail", {
				traces,
				env,
				context
			}) || Promise.resolve());
		},
		trace(traces, env, context) {
			globalThis.__env__ = env;
			context.waitUntil(nitroHooks.callHook("cloudflare:trace", {
				traces,
				env,
				context
			}) || Promise.resolve());
		}
	};
}
function augmentReq(cfReq, ctx) {
	const req = cfReq;
	req.ip = cfReq.headers.get("cf-connecting-ip") || void 0;
	req.runtime ??= { name: "cloudflare" };
	req.runtime.cloudflare = {
		...req.runtime.cloudflare,
		...ctx
	};
	req.waitUntil = ctx.context?.waitUntil.bind(ctx.context);
}
//#endregion
//#region node_modules/nitro/dist/presets/cloudflare/runtime/cloudflare-module.mjs
var cloudflare_module_default = createHandler({ fetch(cfRequest, env, context, url) {
	if (env.ASSETS && isPublicAssetURL(url.pathname)) return env.ASSETS.fetch(cfRequest);
} });
//#endregion
export { cloudflare_module_default as default };
