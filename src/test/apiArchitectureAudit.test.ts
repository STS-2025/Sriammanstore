import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { apiClient, resolveApiBaseUrl, ApiClient } from "../services/apiClient";
import { productService } from "../services/productService";
import { cartService } from "../services/cartService";
import { addressService } from "../services/addressService";
import { orderService } from "../services/orderService";
import { authService } from "../services/authService";
import { coinService } from "../services/coinService";
import { wishlistService } from "../services/wishlistService";
import { notificationService } from "../services/notificationService";
import { referralService } from "../services/referralService";
import { settingsService } from "../services/settingsService";
import { supportService } from "../services/supportService";

describe("API-Only Data Access Architecture Audit", () => {
  const srcDir = path.resolve(__dirname, "..");

  function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        getAllFiles(fullPath, fileList);
      } else if (/\.(ts|tsx|js|jsx)$/.test(file)) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  const allSourceFiles = getAllFiles(srcDir);
  const runtimeFiles = allSourceFiles.filter(
    (f) => !f.includes(path.sep + "test" + path.sep) && !f.endsWith(".test.ts") && !f.endsWith(".test.tsx")
  );

  describe("1. Static Architectural Integrity & db.json Isolation", () => {
    it("ensures zero runtime application files import or read db.json directly", () => {
      const violations: string[] = [];
      const dbJsonPattern = /import.*['"].*db\.json['"]|require\(['"].*db\.json['"]\)/i;

      for (const file of runtimeFiles) {
        const content = fs.readFileSync(file, "utf-8");
        if (dbJsonPattern.test(content)) {
          violations.push(path.relative(srcDir, file));
        }
      }

      expect(violations).toEqual([]);
    });

    it("ensures zero runtime files use Node filesystem (fs / node:fs) access for data", () => {
      const violations: string[] = [];
      const fsPattern = /from\s+['"](node:)?fs['"]|require\(['"](node:)?fs['"]\)/;

      for (const file of runtimeFiles) {
        const content = fs.readFileSync(file, "utf-8");
        if (fsPattern.test(content)) {
          violations.push(path.relative(srcDir, file));
        }
      }

      expect(violations).toEqual([]);
    });

    it("ensures no components, contexts, or routes perform rogue direct fetch calls outside apiClient.ts", () => {
      // productionPreviewService.ts is an isolated, read-only production diagnostic preview service
      // that directly queries Google Cloud Firestore REST API and must NOT route through the local emulator apiClient.
      const nonApiClientRuntimeFiles = runtimeFiles.filter(
        (f) =>
          !f.endsWith("apiClient.ts") &&
          !f.endsWith("server.ts") &&
          !f.endsWith("productionPreviewService.ts")
      );
      const violations: string[] = [];
      // Look for fetch( calls
      const fetchPattern = /(?<!apiClient\.)\bfetch\s*\(/;

      for (const file of nonApiClientRuntimeFiles) {
        const content = fs.readFileSync(file, "utf-8");
        if (fetchPattern.test(content)) {
          violations.push(path.relative(srcDir, file));
        }
      }

      expect(violations).toEqual([]);
    });

    it("ensures all domain services route network calls through the shared apiClient", () => {
      const serviceFiles = [
        "productService.ts",
        "cartService.ts",
        "addressService.ts",
        "orderService.ts",
        "authService.ts",
        "coinService.ts",
        "wishlistService.ts",
        "notificationService.ts",
        "referralService.ts",
        "settingsService.ts",
        "supportService.ts",
      ];

      for (const sFile of serviceFiles) {
        const fullPath = path.join(srcDir, "services", sFile);
        expect(fs.existsSync(fullPath)).toBe(true);
        const content = fs.readFileSync(fullPath, "utf-8");
        expect(content).toContain("apiClient");
      }
    });

    it("verifies localStorage is strictly limited to client session preferences and not database substitutes", () => {
      const violations: string[] = [];
      // Check that localStorage is not used to persist catalog products, orders, or addresses collections
      const disallowedStorageKeys = [
        "products",
        "catalog",
        "orders_db",
        "addresses_db",
        "categories",
      ];

      for (const file of runtimeFiles) {
        const content = fs.readFileSync(file, "utf-8");
        for (const disallowed of disallowedStorageKeys) {
          const regex = new RegExp(`localStorage\\.(set|get)Item\\(['"]${disallowed}['"]`, "i");
          if (regex.test(content)) {
            violations.push(`${path.relative(srcDir, file)} accesses disallowed key '${disallowed}'`);
          }
        }
      }

      expect(violations).toEqual([]);
    });

    it("routes verified customer phone synchronization through the trusted callable", () => {
      const identityServicePath = path.join(srcDir, "services", "customerIdentityService.ts");
      const content = fs.readFileSync(identityServicePath, "utf-8");
      const methodStart = content.indexOf("async updateVerifiedPhoneNumber(");
      expect(methodStart).toBeGreaterThanOrEqual(0);
      const methodEnd = content.indexOf("\n  },", methodStart);
      expect(methodEnd).toBeGreaterThan(methodStart);
      const method = content.slice(methodStart, methodEnd);

      expect(method).toContain('"updateCustomerVerifiedPhone"');
      expect(method).not.toMatch(/\b(?:setDoc|updateDoc|deleteDoc|runTransaction)\s*\(/);
      expect(method).not.toContain('"customerPhoneIndex"');
    });
  });

  describe("2. Configurable API Client & Base URL Resolution", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
      apiClient.setBaseUrl("http://localhost:3001");
    });

    it("resolves default port 3001 when environment variables are unset", () => {
      delete process.env["VITE_API_BASE_URL"];
      delete process.env["VITE_API_URL"];
      const url = resolveApiBaseUrl();
      expect(url).toBe("http://localhost:3001");
    });

    it("respects VITE_API_BASE_URL and VITE_API_URL override", () => {
      process.env["VITE_API_BASE_URL"] = "http://api.production.example.com";
      expect(resolveApiBaseUrl()).toBe("http://api.production.example.com");

      delete process.env["VITE_API_BASE_URL"];
      process.env["VITE_API_URL"] = "http://api.staging.example.com";
      expect(resolveApiBaseUrl()).toBe("http://api.staging.example.com");
    });

    it("allows dynamic base URL configuration and normalization via setBaseUrl", () => {
      const client = new ApiClient("http://localhost:3001/");
      expect(client.getBaseUrl()).toBe("http://localhost:3001");

      client.setBaseUrl("https://my-custom-json-server.internal:4000///");
      expect(client.getBaseUrl()).toBe("https://my-custom-json-server.internal:4000");
    });
  });

  describe("3. Transparent Failure Propagation (No Silent Fallback Mocks)", () => {
    let originalGet: typeof apiClient.get;
    let originalPost: typeof apiClient.post;

    beforeEach(() => {
      originalGet = apiClient.get;
      originalPost = apiClient.post;
    });

    afterEach(() => {
      apiClient.get = originalGet;
      apiClient.post = originalPost;
    });

    it("settingsService.getDeliverySettings throws clear error on API failure and does not return fallback mocks", async () => {
      apiClient.get = vi.fn().mockRejectedValue(new Error("HTTP Error 503: Service Unavailable"));

      await expect(settingsService.getDeliverySettings()).rejects.toThrow("503");
      expect(apiClient.get).toHaveBeenCalledWith("/deliverySettings");
    });

    it("settingsService.getDeliverySlots throws clear error on API failure and does not return fallback mocks", async () => {
      apiClient.get = vi.fn().mockRejectedValue(new Error("HTTP Error 500: Internal Server Error"));

      await expect(settingsService.getDeliverySlots()).rejects.toThrow("500");
      expect(apiClient.get).toHaveBeenCalledWith("/deliverySlots");
    });

    it("settingsService.getStoreInfo throws clear error on API failure and does not return fallback mocks", async () => {
      apiClient.get = vi.fn().mockRejectedValue(
        new Error("JSON Server REST API is unavailable at http://localhost:3001/storeInfo")
      );

      await expect(settingsService.getStoreInfo()).rejects.toThrow("unavailable");
      expect(apiClient.get).toHaveBeenCalledWith("/storeInfo");
    });

    it("cartService.getCart propagates API failure so callers detect server outage", async () => {
      apiClient.get = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));

      await expect(cartService.getCart("TEST_USER")).rejects.toThrow("ECONNREFUSED");
    });

    it("authService.verifyOtp refuses unknown numbers without trying to create a user", async () => {
      // Mock /users lookup returning empty array (unregistered user)
      apiClient.get = vi.fn().mockResolvedValue([]);
      const postSpy = vi.fn();
      apiClient.post = postSpy;

      await expect(
        authService.verifyOtp("9888877777", "123456")
      ).rejects.toThrow("No account registered with this mobile number");
      expect(postSpy).not.toHaveBeenCalled();
    });

    it("productService.getProductById distinguishes between catalog 404 (null) and 500 server crash (throw)", async () => {
      // 404 Not Found returns null
      apiClient.get = vi.fn().mockRejectedValue(new Error("HTTP Error 404: Not Found"));
      const notFoundResult = await productService.getProductById("nonexistent_id");
      expect(notFoundResult).toBeNull();

      // 500 Server Error propagates error
      apiClient.get = vi.fn().mockRejectedValue(new Error("HTTP Error 500: Internal Server Error"));
      await expect(productService.getProductById("any_id")).rejects.toThrow("500");
    });

    it("orderService.getOrderById distinguishes between missing 404 order (null) and 500 server error (throw)", async () => {
      // 404 returns null
      apiClient.get = vi.fn().mockRejectedValue(new Error("HTTP Error 404: Not Found"));
      const notFoundOrder = await orderService.getOrderById("ORD_NONE");
      expect(notFoundOrder).toBeNull();

      // 500 throws
      apiClient.get = vi.fn().mockRejectedValue(new Error("HTTP Error 500: Server Down"));
      await expect(orderService.getOrderById("ORD_NONE")).rejects.toThrow("500");
    });
  });

  describe("4. End-to-End Live REST API Integration Verification", () => {
    it("successfully retrieves delivery settings directly from running JSON Server REST API", async () => {
      const settings = await settingsService.getDeliverySettings();
      expect(settings).toBeDefined();
      expect(settings.minOrderForFreeDelivery).toBe(499);
      expect(settings.standardDeliveryCharge).toBe(40);
      expect(settings.expressDeliveryCharge).toBe(60);
    });

    it("successfully retrieves delivery slots directly from running JSON Server REST API", async () => {
      const slots = await settingsService.getDeliverySlots();
      expect(Array.isArray(slots)).toBe(true);
      expect(slots.length).toBeGreaterThanOrEqual(2);
      expect(slots.some((s) => s.id === "slot_exp")).toBe(true);
      expect(slots.some((s) => s.id === "slot_std_morning")).toBe(true);
    });

    it("successfully retrieves store info directly from running JSON Server REST API", async () => {
      const store = await settingsService.getStoreInfo();
      expect(store).toBeDefined();
      expect(store.storeName).toBe("Sri Amman Smart Store");
      expect(store.centerLat).toBeCloseTo(11.459319, 5);
      expect(store.centerLng).toBeCloseTo(77.333565, 5);
      expect(store.maxRadiusKm).toBe(6.0);
    });
  });
});
