import { v as apiClient } from "./StoreFooter-CRTqGBJ2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/supportService-BKKKN-sO.js
var supportService = {
	async submitReportedProblem(data) {
		const report = {
			id: `rep_${Date.now()}`,
			userId: data.userId,
			category: data.category,
			...data.orderId !== void 0 ? { orderId: data.orderId } : {},
			message: data.message,
			status: "Submitted",
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		return apiClient.post("/reportedProblems", report);
	},
	async submitProductRequest(data) {
		const req = {
			id: `req_${Date.now()}`,
			userId: data.userId,
			productName: data.productName,
			...data.brand !== void 0 ? { brand: data.brand } : {},
			...data.notes !== void 0 ? { notes: data.notes } : {},
			status: "Under Review",
			createdAt: (/* @__PURE__ */ new Date()).toISOString()
		};
		return apiClient.post("/productRequests", req);
	},
	async getReportedProblems(userId = "SASS0000104") {
		return apiClient.get("/reportedProblems", { userId });
	},
	async getProductRequests(userId = "SASS0000104") {
		return apiClient.get("/productRequests", { userId });
	}
};
//#endregion
export { supportService as t };
