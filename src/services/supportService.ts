import { apiClient } from "./apiClient";
import { authManager } from "./authAdapter";

export interface ReportedProblem {
  id: string;
  userId: string;
  category: string;
  orderId?: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface ProductRequest {
  id: string;
  userId: string;
  productName: string;
  brand?: string;
  notes?: string;
  status: string;
  createdAt: string;
}

export const supportService = {
  async submitReportedProblem(data: {
    userId: string;
    category: string;
    orderId?: string;
    message: string;
  }): Promise<ReportedProblem> {
    const report: ReportedProblem = {
      id: `rep_${Date.now()}`,
      userId: data.userId,
      category: data.category,
      ...(data.orderId !== undefined ? { orderId: data.orderId } : {}),
      message: data.message,
      status: "Submitted",
      createdAt: new Date().toISOString(),
    };
    return apiClient.post<ReportedProblem>("/reportedProblems", report);
  },

  async submitProductRequest(data: {
    userId: string;
    productName: string;
    brand?: string;
    notes?: string;
  }): Promise<ProductRequest> {
    const req: ProductRequest = {
      id: `req_${Date.now()}`,
      userId: data.userId,
      productName: data.productName,
      ...(data.brand !== undefined ? { brand: data.brand } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      status: "Under Review",
      createdAt: new Date().toISOString(),
    };
    return apiClient.post<ProductRequest>("/productRequests", req);
  },

  async getReportedProblems(userId: string = "SASS0000104"): Promise<ReportedProblem[]> {
    return apiClient.get<ReportedProblem[]>("/reportedProblems", { userId });
  },

  async getProductRequests(userId: string = "SASS0000104"): Promise<ProductRequest[]> {
    return apiClient.get<ProductRequest[]>("/productRequests", { userId });
  },
};

