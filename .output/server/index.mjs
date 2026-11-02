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
	"/robots.txt": {
		"type": "text/plain; charset=utf-8",
		"etag": "\"a0-CKGXSIe7TSsqDTmGm/nY1t/o5d0\"",
		"mtime": "2026-10-08T10:54:29.000Z",
		"size": 160,
		"path": "../public/robots.txt"
	},
	"/favicon.ico": {
		"type": "image/vnd.microsoft.icon",
		"etag": "\"4f95-3RXc3p2mhEAs1WBwaIvE0Y0uu0Y\"",
		"mtime": "2026-10-08T10:54:29.000Z",
		"size": 20373,
		"path": "../public/favicon.ico"
	},
	"/assets/help-SCUXK1fB.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"32d7-Ew3InoSYlgJZPwMulx7JMwdXr6A\"",
		"mtime": "2026-11-02T05:27:35.238Z",
		"size": 13015,
		"path": "../public/assets/help-SCUXK1fB.js"
	},
	"/assets/dist-U9vh6tO9.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"91e9-NRu8JmiXI8rHZ7U7YiqzzAZ/xUw\"",
		"mtime": "2026-11-02T05:27:35.237Z",
		"size": 37353,
		"path": "../public/assets/dist-U9vh6tO9.js"
	},
	"/assets/policies-D0RBzswW.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1a50-SnHkp4SQIbYevpARzjQfdj2eE7s\"",
		"mtime": "2026-11-02T05:27:35.238Z",
		"size": 6736,
		"path": "../public/assets/policies-D0RBzswW.js"
	},
	"/assets/product-LycCuxft.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"6b1d-RQLD14IKsuktejS2Fwri2lx7dqk\"",
		"mtime": "2026-11-02T05:27:35.238Z",
		"size": 27421,
		"path": "../public/assets/product-LycCuxft.js"
	},
	"/assets/ProductCard-Z8zXEWED.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"1f9a-0Czl0Fsg1ahXa7FtnQBKns18XgE\"",
		"mtime": "2026-11-02T05:27:35.235Z",
		"size": 8090,
		"path": "../public/assets/ProductCard-Z8zXEWED.js"
	},
	"/assets/rolldown-runtime-CbXtAM7H.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"24d-+aXgvbJ1Wwcp2A8AXKIBByksYC8\"",
		"mtime": "2026-11-02T05:27:35.238Z",
		"size": 589,
		"path": "../public/assets/rolldown-runtime-CbXtAM7H.js"
	},
	"/assets/prod-preview-Bfz7mBws.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"c7ff-XMEEOeGmLJauwdrWsnQDSkM/T7g\"",
		"mtime": "2026-11-02T05:27:35.238Z",
		"size": 51199,
		"path": "../public/assets/prod-preview-Bfz7mBws.js"
	},
	"/assets/routes-C8I9l7P5.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"3757-/A6jXjyUmbM3WdTR0B4EpLsc2Xw\"",
		"mtime": "2026-11-02T05:27:35.238Z",
		"size": 14167,
		"path": "../public/assets/routes-C8I9l7P5.js"
	},
	"/assets/shop-B3wkBx2F.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"8954-/buxXHiJ7WsQxXDrBBO5dI24C9U\"",
		"mtime": "2026-11-02T05:27:35.238Z",
		"size": 35156,
		"path": "../public/assets/shop-B3wkBx2F.js"
	},
	"/assets/supportService-mveyxND4.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"300-DPSVN3AXpeOlPIAlz1U1PyeKESk\"",
		"mtime": "2026-11-02T05:27:35.238Z",
		"size": 768,
		"path": "../public/assets/supportService-mveyxND4.js"
	},
	"/assets/styles-ZUnP8PKL.css": {
		"type": "text/css; charset=utf-8",
		"etag": "\"2491b-YYxOuKH2OzjIq3eDUmPknkQqhOA\"",
		"mtime": "2026-11-02T05:27:35.238Z",
		"size": 149787,
		"path": "../public/assets/styles-ZUnP8PKL.css"
	},
	"/assets/useSearch-DgFOJnIs.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"de-l8JmWeqDCZo/B9NN6yMGbB2oG24\"",
		"mtime": "2026-11-02T05:27:35.238Z",
		"size": 222,
		"path": "../public/assets/useSearch-DgFOJnIs.js"
	},
	"/placeholders/chicken-masala-placeholder.svg": {
		"type": "image/svg+xml",
		"etag": "\"865-6GUJosbi9KF1vMiggbkS0W5gTLo\"",
		"mtime": "2026-10-16T12:09:39.734Z",
		"size": 2149,
		"path": "../public/placeholders/chicken-masala-placeholder.svg"
	},
	"/placeholders/turmeric-powder.svg": {
		"type": "image/svg+xml",
		"etag": "\"868-KFpVA12AoRLRrbu33OTyowSOtd0\"",
		"mtime": "2026-10-16T12:27:09.235Z",
		"size": 2152,
		"path": "../public/placeholders/turmeric-powder.svg"
	},
	"/assets/logo-hiPAdNy0.png": {
		"type": "image/png",
		"etag": "\"72228-UzkuzWxsdH0kyi4aPP9yzq/LwQQ\"",
		"mtime": "2026-11-02T05:27:35.238Z",
		"size": 467496,
		"path": "../public/assets/logo-hiPAdNy0.png"
	},
	"/assets/StoreFooter-BRBppNrm.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"d3682-M6X78CKoiBDr4bD1GWD2jE9xKBA\"",
		"mtime": "2026-11-02T05:27:35.235Z",
		"size": 865922,
		"path": "../public/assets/StoreFooter-BRBppNrm.js"
	},
	"/assets/index-BGdEZ0eZ.js": {
		"type": "text/javascript; charset=utf-8",
		"etag": "\"ce464-hiiCTtpLp7QxIbV/QXU5M4zTQAA\"",
		"mtime": "2026-11-02T05:27:35.235Z",
		"size": 844900,
		"path": "../public/assets/index-BGdEZ0eZ.js"
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
