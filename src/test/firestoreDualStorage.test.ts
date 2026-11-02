import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  assertEmulatorOnlyConfig,
  getEmulatorFirestore,
  resolveEmulatorConfig,
} from "../lib/firebaseEmulator";
import {
  FirestoreAdapter,
  InMemoryFirestoreDriver,
  StorageAdapterError,
  classifyStorageError,
} from "../services/firestoreAdapter";
import {
  ApiClient,
  apiClient,
} from "../services/apiClient";
import {
  outboxJournal,
} from "../services/outboxJournal";
import {
  ARRAY_RESOURCES,
  SINGLETON_RESOURCES,
  extractSeedOperationsFromData,
  chunkOperations,
  isDeepEqualRecord,
} from "../../scripts/seed-emulator.mjs";
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
import type { Address, DeliverySlot } from "../types";

const dbJsonPath = path.resolve(__dirname, "../../db.json");
const rawDbData = JSON.parse(fs.readFileSync(dbJsonPath, "utf-8"));

describe("Firestore Emulator + JSON Server Dual-Storage Architecture", () => {
  let memoryDriver: InMemoryFirestoreDriver;
  let testAdapter: FirestoreAdapter;
  let originalAdapter: FirestoreAdapter;
  let originalMode: ReturnType<typeof apiClient.getMode>;

  beforeEach(() => {
    outboxJournal.clearAll();
    notificationService.clearSessionState();
    memoryDriver = new InMemoryFirestoreDriver(rawDbData);
    testAdapter = new FirestoreAdapter(memoryDriver);
    originalAdapter = apiClient.getFirestoreAdapter();
    originalMode = apiClient.getMode();

    apiClient.setFirestoreAdapter(testAdapter);
    apiClient.setMode("auto");
    apiClient.setConsistencyPolicy("strict");
    apiClient.setTimingOptions({
      healthCheckTtlMs: 5000,
      recoveryCooldownMs: 2000,
      healthCheckTimeoutMs: 500,
    });
    apiClient.resetSourceState();
  });

  afterEach(() => {
    outboxJournal.clearAll();
    apiClient.setFirestoreAdapter(originalAdapter);
    apiClient.setMode(originalMode);
    apiClient.resetSourceState();
    vi.restoreAllMocks();
  });

  describe("1. Emulator-Only Firebase Configuration & Production Guard", () => {
    it("resolves default demo-sri-amman-store project and port 8081", () => {
      const cfg = resolveEmulatorConfig();
      expect(cfg.projectId).toBe("demo-sri-amman-store");
      expect(cfg.port).toBe(8081);
      expect(cfg.host).toBe("127.0.0.1");
    });

    it("refuses non-demo project IDs or production googleapis hosts", () => {
      expect(() =>
        assertEmulatorOnlyConfig({
          projectId: "sri-amman-prod-live",
          host: "127.0.0.1",
          port: 8081,
          mode: "auto",
        })
      ).toThrow(/demo-\*/i);

      expect(() =>
        assertEmulatorOnlyConfig({
          projectId: "demo-sri-amman-store",
          host: "firestore.googleapis.com",
          port: 443,
          mode: "auto",
        })
      ).toThrow(/production/i);
    });

    it("initializes Firebase app and Firestore instance only once across repeated calls (HMR-safe)", () => {
      const first = getEmulatorFirestore({
        projectId: "demo-sri-amman-store",
        host: "127.0.0.1",
        port: 8081,
      });
      const second = getEmulatorFirestore({
        projectId: "demo-sri-amman-store",
        host: "127.0.0.1",
        port: 8081,
      });
      expect(first.app).toBe(second.app);
      expect(first.db).toBe(second.db);
      expect(first.connected).toBe(true);
    });
  });

  describe("2. Idempotent Mock Data Seed & Batch Handling", () => {
    it("reconciles all 15 array collections and 2 singleton objects from db.json with deterministic IDs", () => {
      expect(ARRAY_RESOURCES.length).toBe(15);
      expect(Object.keys(SINGLETON_RESOURCES)).toEqual([
        "deliverySettings",
        "storeInfo",
      ]);

      const ops = extractSeedOperationsFromData(rawDbData);
      const expectedArrayCount = ARRAY_RESOURCES.reduce(
        (sum: number, col: string) => sum + (rawDbData[col]?.length || 0),
        0
      );
      expect(ops.length).toBe(expectedArrayCount + 2);

      // Verify singletons map to deliverySettings/default and storeInfo/default
      const deliverySingleton = ops.find(
        (o) => o.collectionName === "deliverySettings"
      );
      const storeSingleton = ops.find(
        (o) => o.collectionName === "storeInfo"
      );
      expect(deliverySingleton?.docId).toBe("default");
      expect(storeSingleton?.docId).toBe("default");
      expect(storeSingleton?.payload["storeName"]).toBe("Sri Amman Smart Store");
    });

    it("chunks batch writes safely within Firestore's 500-operation limit", () => {
      const ops = extractSeedOperationsFromData(rawDbData);
      const chunksOf100 = chunkOperations(ops, 100);
      expect(chunksOf100.length).toBe(Math.ceil(ops.length / 100));
      expect(chunksOf100.every((c: any[]) => c.length <= 100)).toBe(true);
    });

    it("performs idempotent import: first run imports all records, second run skips identical records without duplicates", async () => {
      const emptyDriver = new InMemoryFirestoreDriver();
      const ops = extractSeedOperationsFromData(rawDbData);

      // Simulate first seed pass
      let imported = 0;
      let skipped = 0;
      for (const op of ops) {
        const existing = await emptyDriver.getDoc(op.collectionName, op.docId);
        if (!existing) {
          await emptyDriver.setDoc(op.collectionName, op.docId, op.payload);
          imported++;
        } else if (isDeepEqualRecord(existing, op.payload)) {
          skipped++;
        }
      }
      expect(imported).toBe(ops.length);
      expect(skipped).toBe(0);

      // Second seed pass: all records should be skipped
      let secondImported = 0;
      let secondSkipped = 0;
      let secondUpdated = 0;
      for (const op of ops) {
        const existing = await emptyDriver.getDoc(op.collectionName, op.docId);
        if (!existing) {
          secondImported++;
        } else if (isDeepEqualRecord(existing, op.payload)) {
          secondSkipped++;
        } else {
          secondUpdated++;
        }
      }
      expect(secondImported).toBe(0);
      expect(secondSkipped).toBe(ops.length);
      expect(secondUpdated).toBe(0);
    });
  });

  describe("3. Controlled Source Selection Modes (emulator, json-server, auto)", () => {
    it("uses Firestore Emulator when available in 'emulator' mode and reports failures without fallback", async () => {
      apiClient.setMode("emulator");
      const products = await productService.getProducts();
      expect(products.length).toBe(rawDbData.products.length);
      expect(apiClient.getActiveSource()).toBe("emulator");

      // Simulate connectivity outage in strict 'emulator' mode -> must throw, never fallback
      memoryDriver.setFailureMode(
        new StorageAdapterError("Firestore Emulator unreachable", {
          status: 503,
          code: "unavailable",
          category: "connectivity",
        })
      );

      await expect(productService.getProducts()).rejects.toThrow(/unreachable/i);
      expect(apiClient.getActiveSource()).toBe("emulator");
    });

    it("uses JSON Server explicitly when 'json-server' mode is selected", async () => {
      apiClient.setMode("json-server");
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => rawDbData.categories,
      });
      vi.stubGlobal("fetch", mockFetch);

      const categories = await productService.getCategories();
      expect(categories.length).toBe(rawDbData.categories.length);
      expect(apiClient.getActiveSource()).toBe("json-server");
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("automatically falls back to JSON Server in 'auto' mode after a genuine connectivity failure", async () => {
      apiClient.setMode("auto");
      memoryDriver.setFailureMode(
        new StorageAdapterError("ECONNREFUSED 127.0.0.1:8081", {
          status: 503,
          code: "unavailable",
          category: "connectivity",
        })
      );

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => rawDbData.banners,
      });
      vi.stubGlobal("fetch", mockFetch);

      const banners = await productService.getBanners();
      expect(banners.length).toBe(rawDbData.banners.length);

      const status = apiClient.getDataSourceStatus();
      expect(status.activeSource).toBe("json-server");
      expect(status.fallbackActive).toBe(true);
      expect(status.emulatorHealthy).toBe(false);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it("does NOT switch sources for missing documents (404), validation errors (400), or permission errors (403)", async () => {
      apiClient.setMode("auto");
      const mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);

      // 1. Missing document (404) -> returns null in service, stays on emulator
      const missingProduct = await productService.getProductById("non_existent_prod_999");
      expect(missingProduct).toBeNull();
      expect(apiClient.getActiveSource()).toBe("emulator");
      expect(apiClient.getDataSourceStatus().fallbackActive).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();

      // 2. Validation error (400) -> throws 400, stays on emulator
      await expect(
        apiClient.post("/orders", {
          id: "ORD-BAD",
          orderId: "ORD-BAD",
          userId: "SASS0000104",
          status: "invalid_unsupported_status",
        })
      ).rejects.toThrow(/Invalid order status/i);
      expect(apiClient.getActiveSource()).toBe("emulator");
      expect(apiClient.getDataSourceStatus().fallbackActive).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();

      // 3. Permission error (403) -> throws 403, stays on emulator
      await expect(apiClient.get("/unauthorizedSecretCollection")).rejects.toThrow(
        /not permitted/i
      );
      expect(apiClient.getActiveSource()).toBe("emulator");
      expect(apiClient.getDataSourceStatus().fallbackActive).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();

      // 4. Simulated Firestore permission-denied error -> throws 403, does not fallback
      memoryDriver.setFailureMode(
        new StorageAdapterError("Missing or insufficient permissions.", {
          status: 403,
          code: "permission-denied",
          category: "permission",
        })
      );
      await expect(productService.getCategories()).rejects.toThrow(/permissions/i);
      expect(apiClient.getActiveSource()).toBe("emulator");
      expect(apiClient.getDataSourceStatus().fallbackActive).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("4. Query & Response Mapping Across All 17 Service Resources", () => {
    it("correctly handles singleton objects /storeInfo and /deliverySettings", async () => {
      const storeInfo = await settingsService.getStoreInfo();
      expect(storeInfo).toBeDefined();
      expect(Array.isArray(storeInfo)).toBe(false);
      expect(storeInfo.storeName).toBe("Sri Amman Smart Store");
      expect(storeInfo.centerLat).toBeCloseTo(11.459319, 5);
      expect(storeInfo.maxRadiusKm).toBe(6);
      expect(storeInfo.coinValueInRupees).toBe(0.05);
      expect(storeInfo.vipSpendingThreshold).toBe(5000);

      const deliverySettings = await settingsService.getDeliverySettings();
      expect(deliverySettings).toBeDefined();
      expect(Array.isArray(deliverySettings)).toBe(false);
      expect(deliverySettings.minOrderForFreeDelivery).toBe(499);
      expect(deliverySettings.standardDeliveryCharge).toBe(40);
      expect(deliverySettings.expressDeliveryCharge).toBe(60);
    });

    it("correctly maps queries, filters, and mutations for all 15 array collections", async () => {
      const userId = "SASS0000104";

      // 1. users
      const user = await authService.loginWithEmail(
        "arun.kumar@example.com",
        "password123"
      );
      expect(user.userId).toBe(userId);

      // 2. products (with category & search filter)
      const oilProducts = await productService.getProducts({
        category: "cold-pressed-oils",
      });
      expect(oilProducts.length).toBeGreaterThan(0);
      expect(oilProducts.every((p) => p.categorySlug === "cold-pressed-oils")).toBe(
        true
      );

      // 3. categories
      const categories = await productService.getCategories();
      expect(categories.length).toBe(rawDbData.categories.length);

      // 4. banners
      const banners = await productService.getBanners();
      expect(banners.length).toBe(rawDbData.banners.length);

      // 5. deliverySlots
      const slots = await settingsService.getDeliverySlots();
      expect(slots.length).toBe(rawDbData.deliverySlots.length);

      // 6. addresses
      const addresses = await addressService.getAddresses(userId);
      expect(addresses.length).toBeGreaterThan(0);
      expect(addresses.every((a) => a.userId === userId)).toBe(true);

      // 7. cart (with canonical cartKey)
      const cart = await cartService.getCart(userId);
      expect(cart.every((c) => c.userId === userId)).toBe(true);

      // 8. wishlists & 9. wishlistProducts
      const wishlists = await wishlistService.getWishlists(userId);
      expect(wishlists.every((w) => w.userId === userId)).toBe(true);
      const wlProducts = await wishlistService.getWishlistProducts(undefined, userId);
      expect(wlProducts.every((wp) => wp.userId === userId)).toBe(true);

      // 10. orders
      const orders = await orderService.getOrders(userId);
      expect(orders.length).toBeGreaterThan(0);
      expect(orders.every((o) => o.userId === userId)).toBe(true);

      // 11. coinHistory
      const coinHist = await coinService.getCoinHistory(userId);
      expect(coinHist.length).toBeGreaterThan(0);
      expect(coinHist.every((c) => c.userId === userId)).toBe(true);

      // 12. referrals
      const referrals = await referralService.getReferrals(userId);
      expect(referrals.every((r) => r.userId === userId)).toBe(true);

      // 13. notifications
      const notifs = await notificationService.getNotifications(userId);
      expect(notifs.length).toBeGreaterThan(0);
      expect(notifs.every((n) => n.userId === userId)).toBe(true);

      // 14. reportedProblems & 15. productRequests
      const problems = await supportService.getReportedProblems(userId);
      expect(problems.every((p) => p.userId === userId)).toBe(true);
      const requests = await supportService.getProductRequests(userId);
      expect(requests.every((r) => r.userId === userId)).toBe(true);
    });
  });

  describe("5. Fallback Write Persistence, Recovery Reconciliation & Conflict Detection", () => {
    it("persists fallback writes in outbox journal and safely reconciles them when Firestore recovers", async () => {
      const userId = "SASS0000104";

      // 1. Trigger connectivity outage on Firestore
      memoryDriver.setFailureMode(
        new StorageAdapterError("Firestore Emulator offline", {
          status: 503,
          code: "unavailable",
          category: "connectivity",
        })
      );

      // Mock JSON Server responses for fallback mutations
      const fallbackDbAddresses: Record<string, any> = {};
      const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        const method = init?.method || "GET";
        if (method === "GET" && url.includes("/addresses")) {
          return {
            ok: true,
            status: 200,
            json: async () => Object.values(fallbackDbAddresses),
          };
        }
        if (method === "POST" && url.includes("/addresses")) {
          const body = JSON.parse(String(init?.body));
          fallbackDbAddresses[body.id] = body;
          return {
            ok: true,
            status: 201,
            json: async () => body,
          };
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({}),
        };
      });
      vi.stubGlobal("fetch", mockFetch);

      // 2. Perform write during fallback
      const createdAddress = await addressService.addAddress({
        userId,
        tag: "Work",
        name: "Arun Kumar Office",
        phone: "+91 99999 99999",
        houseNo: "101",
        street: "Cutchery Street",
        city: "Gobichettipalayam",
        pincode: "638452",
        lat: 11.4595,
        lng: 77.334,
        isDefault: false,
      });

      expect(apiClient.getActiveSource()).toBe("json-server");
      const pendingBeforeRecovery = outboxJournal.getPendingEntries();
      expect(pendingBeforeRecovery.length).toBe(1);
      expect(pendingBeforeRecovery[0]?.resource).toBe("addresses");
      expect(pendingBeforeRecovery[0]?.docId).toBe(createdAddress.id);
      expect(pendingBeforeRecovery[0]?.status).toBe("pending");

      // Confirm it is not yet in Firestore
      memoryDriver.setFailureMode(null);
      const inFirestoreBeforeReconcile = await memoryDriver.getDoc(
        "addresses",
        createdAddress.id
      );
      expect(inFirestoreBeforeReconcile).toBeNull();

      // 3. Reconcile on recovery
      const summary = await apiClient.reconcilePendingOutbox();
      expect(summary.synced).toBe(1);
      expect(summary.conflicts).toBe(0);
      expect(summary.pending).toBe(0);

      // Verify the fallback address now exists in Firestore and active source resumed to emulator
      const inFirestoreAfterReconcile = await memoryDriver.getDoc(
        "addresses",
        createdAddress.id
      );
      expect(inFirestoreAfterReconcile).not.toBeNull();
      expect(inFirestoreAfterReconcile?.["name"]).toBe("Arun Kumar Office");
      expect(apiClient.getActiveSource()).toBe("emulator");
      expect(apiClient.getDataSourceStatus().fallbackActive).toBe(false);
    });

    it("detects conflicting newer data in Firestore during reconciliation and keeps conflict pending without overwriting", async () => {
      const targetOrder = rawDbData.orders[0];
      const orderId = targetOrder.id;

      // 1. Simulate Firestore outage
      memoryDriver.setFailureMode(
        new StorageAdapterError("Firestore Emulator offline", {
          status: 503,
          code: "unavailable",
          category: "connectivity",
        })
      );

      // Mock JSON Server returning original baseline (status: pending/delivered) and accepting PATCH
      const mockFetch = vi.fn().mockImplementation(async (_url: string, init?: RequestInit) => {
        const method = init?.method || "GET";
        if (method === "GET") {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              ...targetOrder,
              status: "pending",
              updatedAt: "2026-10-10T08:00:00.000Z",
            }),
          };
        }
        const patch = JSON.parse(String(init?.body || "{}"));
        return {
          ok: true,
          status: 200,
          json: async () => ({
            ...targetOrder,
            ...patch,
          }),
        };
      });
      vi.stubGlobal("fetch", mockFetch);

      // 2. Perform fallback PATCH (e.g., setting status to 'cancelled')
      await apiClient.patch(`/orders/${orderId}`, {
        status: "cancelled",
      });

      expect(outboxJournal.getPendingEntries().length).toBe(1);

      // 3. Meanwhile in Firestore, the order was updated more recently to 'delivered'
      memoryDriver.setFailureMode(null);
      const newerFutureIso = new Date(Date.now() + 60_000).toISOString();
      await memoryDriver.setDoc("orders", orderId, {
        ...targetOrder,
        status: "delivered",
        deliveredAt: newerFutureIso,
        updatedAt: newerFutureIso,
      });

      // 4. Attempt reconciliation
      const summary = await apiClient.reconcilePendingOutbox();
      expect(summary.conflicts).toBe(1);
      expect(summary.synced).toBe(0);

      // Verify Firestore's newer data ('delivered') was NOT overwritten by 'cancelled'
      const firestoreOrderAfter = await memoryDriver.getDoc("orders", orderId);
      expect(firestoreOrderAfter?.["status"]).toBe("delivered");

      // Verify conflict entry remains visibly flagged in the outbox and status API
      const conflicts = outboxJournal.getConflictEntries();
      expect(conflicts.length).toBe(1);
      expect(conflicts[0]?.docId).toBe(orderId);
      expect(conflicts[0]?.conflictInfo?.reason).toMatch(/newer timestamp|Conflicting/i);
      expect(apiClient.getDataSourceStatus().reconciliationStatus).toBe(
        "conflict_pending"
      );
    });
  });

  describe("6. Atomic Order IDs, Retry Idempotency & Customer Isolation", () => {
    const validAddress: Address = {
      id: "addr_test_atomic",
      userId: "SASS0000104",
      tag: "Home",
      name: "Arun Kumar",
      phone: "+91 99999 99999",
      houseNo: "12",
      street: "Main Road",
      city: "Gobichettipalayam",
      pincode: "638452",
      lat: 11.4595,
      lng: 77.3338,
      isDefault: true,
    };

    const expressSlot: DeliverySlot = {
      id: "slot_exp",
      type: "express",
      title: "Instant 60-90 Min Express Dispatch",
      subtitle: "Direct electric fleet",
      charge: 60,
    };

    it("allocates ORD-xxxxxxx order IDs via Firestore transaction and prevents duplicate orders, notifications, or coin entries on retry", async () => {
      const userId = "SASS0000104";
      const product = (await productService.getProductById("prod_groundnut_oil"))!;
      const cartItem = await cartService.addToCart(product, 0, 1, userId);

      const initialTxCount = memoryDriver.transactionCallCount;

      const createdOrder = await orderService.createOrder({
        userId,
        customerName: "Arun Kumar",
        phone: "+91 99999 99999",
        address: validAddress,
        deliverySlot: expressSlot,
        paymentMethod: "online",
        cartItems: [cartItem],
        subtotal: cartItem.price,
        productSavings: 30,
        deliveryFee: 60,
        coinDiscount: 25,
        couponDiscount: 0,
        totalAmount: cartItem.price - 25 + 60,
      });

      expect(createdOrder.orderId).toMatch(/^ORD-\d{7}$/);
      expect(memoryDriver.transactionCallCount).toBe(initialTxCount + 1);

      // Re-posting the exact same order, notification, and coin transactions must be idempotent
      const dupOrder = await apiClient.post("/orders", createdOrder);
      expect((dupOrder as any).orderId).toBe(createdOrder.orderId);

      const ordersForCustomer = await orderService.getOrders(userId);
      const matchingOrders = ordersForCustomer.filter(
        (o) => o.orderId === createdOrder.orderId
      );
      expect(matchingOrders.length).toBe(1);

      // Attempt duplicate notification for same order
      await notificationService.createOrderPlacedNotification(createdOrder);
      const notifs = await notificationService.getNotifications(userId);
      const orderCreatedNotifs = notifs.filter(
        (n) => n.eventKey === `order_created:${userId}:${createdOrder.orderId}`
      );
      expect(orderCreatedNotifs.length).toBe(1);

      // Attempt duplicate coin earn transaction for same order
      await apiClient.post("/coinHistory", {
        id: `coin_earn_${createdOrder.orderId}`,
        userId,
        orderId: createdOrder.orderId,
        amount: 15,
        type: "earned",
        description: `Amman Coins earned on Order #${createdOrder.orderId}`,
        timestamp: createdOrder.createdAt,
      });
      const coinHist = await coinService.getCoinHistory(userId);
      const matchingEarned = coinHist.filter(
        (c) => c.orderId === createdOrder.orderId && c.type === "earned"
      );
      expect(matchingEarned.length).toBe(1);
    });

    it("does not duplicate an order in JSON Server if a timed-out primary order creation already succeeded in Firestore", async () => {
      const userId = "SASS0000104";
      const orderPayload = {
        id: "ORD-0009876",
        orderId: "ORD-0009876",
        userId,
        customerName: "Arun Kumar",
        phone: "+91 99999 99999",
        status: "pending",
        createdAt: new Date().toISOString(),
        deliveryAddress: {
          houseNo: "12",
          street: "Main Road",
          city: "Gobichettipalayam",
          pincode: "638452",
        },
        delivery: {
          type: "express",
          slot: "Instant 60-90 Min",
        },
        payment: {
          method: "cod",
          status: "pending_cod",
        },
        items: [],
        pricingSummary: {
          subtotal: 200,
          productSavings: 20,
          deliveryFee: 40,
          coinDiscount: 0,
          couponDiscount: 0,
          totalAmount: 240,
        },
      };

      // Simulate transaction committing the order in Firestore but throwing a timeout on response
      const origTx = memoryDriver.runOrderCreationTransaction.bind(memoryDriver);
      vi.spyOn(memoryDriver, "runOrderCreationTransaction").mockImplementationOnce(
        async (payload) => {
          await origTx(payload);
          throw new StorageAdapterError(
            "FIRESTORE_CONNECTIVITY_TIMEOUT: timed out awaiting commit ack",
            {
              status: 503,
              code: "unavailable",
              category: "connectivity",
            }
          );
        }
      );

      const mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);

      const result = await apiClient.post<any>("/orders", orderPayload);
      expect(result.orderId).toBe("ORD-0009876");
      // Must NOT have called JSON Server fallback because verification found the committed order in Firestore!
      expect(mockFetch).not.toHaveBeenCalled();
      expect(outboxJournal.getPendingEntries().length).toBe(0);
    });

    it("enforces strict customer data isolation across orders, notifications, addresses, and coins", async () => {
      const customerA = "SASS0000104";
      const customerB = "SASS0000088";

      const ordersA = await orderService.getOrders(customerA);
      const ordersB = await orderService.getOrders(customerB);
      expect(ordersA.every((o) => o.userId === customerA)).toBe(true);
      expect(ordersB.every((o) => o.userId === customerB)).toBe(true);

      // Customer A cannot access Customer B's order by ID
      const sampleOrderB = ordersB[0];
      if (sampleOrderB) {
        await expect(
          orderService.getOrderById(sampleOrderB.orderId, customerA)
        ).rejects.toThrow(/Access denied/i);
      }

      const notifsA = await notificationService.getNotifications(customerA);
      const notifsB = await notificationService.getNotifications(customerB);
      expect(notifsA.every((n) => n.userId === customerA)).toBe(true);
      expect(notifsB.every((n) => n.userId === customerB)).toBe(true);
    });

    it("preserves compatibility with tests that spy on or mock apiClient methods", async () => {
      const getSpy = vi.spyOn(apiClient, "get");
      const storeInfo = await settingsService.getStoreInfo();
      expect(storeInfo.storeName).toBe("Sri Amman Smart Store");
      expect(getSpy).toHaveBeenCalledWith("/storeInfo");
    });
  });

  describe("6. Customer Workflow & Route Defect Regressions", () => {
    it("ensures addresses.tsx imports Link from @tanstack/react-router for unauthenticated sign-in prompt", () => {
      const addressesSource = fs.readFileSync(
        path.resolve(__dirname, "../routes/addresses.tsx"),
        "utf-8"
      );
      expect(addressesSource).toMatch(
        /import\s*\{[^}]*\bLink\b[^}]*\}\s*from\s*["']@tanstack\/react-router["']/
      );
    });

    it("enforces order cancellation eligibility (only pending/processing) and 24-hour return window", async () => {
      const addr = (await addressService.getAddresses("SASS0000104"))[0];
      const slots = await settingsService.getDeliverySlots();
      const prod = await productService.getProductById("prod_groundnut_oil");
      const cartItem = await cartService.addToCart(prod!, 1, 1, "SASS0000104", false);

      const order = await orderService.createOrder({
        userId: "SASS0000104",
        customerName: "Arun Kumar",
        phone: "+91 99999 99999",
        address: addr!,
        deliverySlot: slots[0]!,
        paymentMethod: "cod",
        cartItems: [cartItem],
        subtotal: 245,
        productSavings: 54,
        deliveryFee: 40,
        coinDiscount: 0,
        couponDiscount: 0,
        totalAmount: 285,
      });

      // Transition to packed -> cancellation must be rejected
      await orderService.updateOrderStatus(order.id, "processing", "SASS0000104");
      await orderService.updateOrderStatus(order.id, "packed", "SASS0000104");
      await expect(orderService.cancelOrder(order.id, "SASS0000104")).rejects.toThrow(
        /Cannot cancel order with status "packed"/i
      );

      // Transition to delivered, then simulate expired >24h deliveredAt -> return must be rejected
      await orderService.updateOrderStatus(order.id, "in transit", "SASS0000104");
      await orderService.updateOrderStatus(order.id, "delivered", "SASS0000104");
      const expiredIso = new Date(Date.now() - 25 * 3600 * 1000).toISOString();
      await testAdapter.patch(`/orders/${order.id}`, { deliveredAt: expiredIso });
      await expect(orderService.requestReturn(order.id, "SASS0000104")).rejects.toThrow(
        /within 24 hours of delivery/i
      );

      // Restore within-24h deliveredAt -> return must succeed
      await testAdapter.patch(`/orders/${order.id}`, { deliveredAt: new Date().toISOString() });
      const returned = await orderService.requestReturn(order.id, "SASS0000104");
      expect(returned.status).toBe("returned");
    });

    it("applies VIP specialPrice only for VIP customers and preserves 0.5 coin conversion rate", async () => {
      const prod = await productService.getProductById("prod_groundnut_oil");
      expect(prod).not.toBeNull();
      const regularItem = await cartService.addToCart(prod!, 1, 1, "SASS0000104", false);
      const vipItem = await cartService.addToCart(prod!, 1, 1, "SASS0000088", true);

      expect(regularItem.price).toBe(245);
      expect(vipItem.price).toBe(229);
      expect(await coinService.getConversionRate()).toBe(0.05);
    });
  });
});


