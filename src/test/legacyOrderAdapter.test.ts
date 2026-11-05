import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  LegacyOrderAdapter,
  normalizeLegacyOrderStatus,
  parseLegacyDate,
  normalizeLegacyItems,
  normalizeLegacyAddress,
  normalizeLegacyDelivery,
  normalizeLegacyPayment,
  normalizeLegacyPricing,
  normalizeLegacyOrder,
  reconcileCustomerOrders,
  isPosOrNonRetailOrder,
} from "../services/legacyOrderAdapter";
import {
  FirestoreAdapter,
  InMemoryFirestoreDriver,
  StorageAdapterError,
} from "../services/firestoreAdapter";
import { apiClient } from "../services/apiClient";
import { orderService } from "../services/orderService";
import { emailLinkAuthService } from "../services/emailLinkAuthService";
import { getEmulatorFirestore } from "../lib/firebaseEmulator";
import { seedEmulatorLinkedCustomerFixture } from "./linkedCustomerFixture";
import type { Order } from "../types";

const AUTH_OOB_URL =
  "http://127.0.0.1:9099/emulator/v1/projects/demo-sri-amman-store/oobCodes";

interface EmulatorOobCodesPayload {
  oobCodes?: Array<{
    email?: string;
    oobCode?: string;
    oobLink?: string;
  }>;
}

async function areLiveEmulatorsReachable(): Promise<boolean> {
  try {
    const [authRes, firestoreRes] = await Promise.all([
      fetch(AUTH_OOB_URL, { method: "GET" }),
      fetch("http://127.0.0.1:8081/", { method: "GET" }),
    ]);
    return authRes.ok && (firestoreRes.ok || firestoreRes.status < 500);
  } catch {
    return false;
  }
}

async function signInLiveEmailLinkUser(email: string) {
  await emailLinkAuthService.sendSignInLink(email, {
    continueUrl: "http://localhost:5173/login",
  });

  const oobRes = await fetch(AUTH_OOB_URL);
  expect(oobRes.ok).toBe(true);
  const payload = (await oobRes.json()) as EmulatorOobCodesPayload;
  const matchingCodes = (payload.oobCodes ?? []).filter(
    (entry) => entry.email?.toLowerCase() === email.toLowerCase()
  );
  expect(matchingCodes.length).toBeGreaterThan(0);

  const latestOob = matchingCodes[matchingCodes.length - 1]!;
  expect(latestOob.oobLink).toBeTruthy();

  return emailLinkAuthService.completeSignInWithEmailLink(latestOob.oobLink!);
}

describe("Milestone: Read-Only Legacy Order Integration", () => {
  let driver: InMemoryFirestoreDriver;
  let adapter: LegacyOrderAdapter;
  let firestoreAdapter: FirestoreAdapter;
  let originalAdapter: FirestoreAdapter;
  let originalMode: ReturnType<typeof apiClient.getMode>;

  const customerA = "SASS0000104";
  const customerB = "SASS0000088";

  beforeEach(async () => {
    driver = new InMemoryFirestoreDriver();
    adapter = new LegacyOrderAdapter(driver);
    firestoreAdapter = new FirestoreAdapter(driver, {
      legacyCustomerSubcollections: true,
    });

    originalAdapter = apiClient.getFirestoreAdapter();
    originalMode = apiClient.getMode();

    apiClient.setFirestoreAdapter(firestoreAdapter);
    apiClient.setMode("emulator");
    apiClient.resetSourceState();

    // Seed customer profiles
    await driver.setDoc("users", customerA, {
      id: customerA,
      userId: customerA,
      fullName: "Arun Kumar",
      phone: "+919999999999",
      number: "9999999999",
      coins: 100,
    });

    await driver.setDoc("users", customerB, {
      id: customerB,
      userId: customerB,
      fullName: "Priya Sundaram",
      phone: "+919443312345",
      number: "9443312345",
      coins: 50,
    });
  });

  afterEach(() => {
    apiClient.setFirestoreAdapter(originalAdapter);
    apiClient.setMode(originalMode);
    apiClient.resetSourceState();
  });

  // ==========================================================================
  // SUITE 1: Normalization Helpers
  // ==========================================================================
  describe("1. Legacy Order Normalization Helpers", () => {
    it("preserves all available item image fields and leaves missing images empty", () => {
      const [withImages, withoutImages] = normalizeLegacyItems([
        {
          image: "https://cdn.example/primary.jpg",
          imageUrl: "https://cdn.example/primary.jpg",
          frontImageUrl: "https://cdn.example/front.jpg",
          imageUrls: ["https://cdn.example/gallery.jpg"],
        },
        { productId: "product-without-image" },
      ]);

      expect(withImages?.image).toBe("https://cdn.example/primary.jpg");
      expect(withImages?.imageCandidates).toEqual([
        "https://cdn.example/primary.jpg",
        "https://cdn.example/front.jpg",
        "https://cdn.example/gallery.jpg",
      ]);
      expect(withoutImages?.image).toBe("");
      expect(withoutImages?.imageCandidates).toEqual([]);
    });

    it("normalizes diverse legacy status values correctly", () => {
      // Pending variants
      expect(normalizeLegacyOrderStatus("Pending").status).toBe("pending");
      expect(normalizeLegacyOrderStatus("order_confirmed").status).toBe("pending");
      expect(normalizeLegacyOrderStatus("Order Placed").status).toBe("pending");

      // Processing variants
      expect(normalizeLegacyOrderStatus("Processing").status).toBe("processing");
      expect(normalizeLegacyOrderStatus("packing").status).toBe("processing");
      expect(normalizeLegacyOrderStatus("in_progress").status).toBe("processing");

      // Packed variants
      expect(normalizeLegacyOrderStatus("Packed").status).toBe("packed");
      expect(normalizeLegacyOrderStatus("ready_for_dispatch").status).toBe("packed");

      // In transit variants
      expect(normalizeLegacyOrderStatus("out_for_delivery").status).toBe("in transit");
      expect(normalizeLegacyOrderStatus("Out for Delivery").status).toBe("in transit");
      expect(normalizeLegacyOrderStatus("dispatched").status).toBe("in transit");
      expect(normalizeLegacyOrderStatus("shipped").status).toBe("in transit");

      // Delivered variants
      expect(normalizeLegacyOrderStatus("Delivered").status).toBe("delivered");
      expect(normalizeLegacyOrderStatus("completed").status).toBe("delivered");

      // Cancelled variants
      expect(normalizeLegacyOrderStatus("cancelled").status).toBe("cancelled");
      expect(normalizeLegacyOrderStatus("Cancelled").status).toBe("cancelled");
      expect(normalizeLegacyOrderStatus("rejected").status).toBe("cancelled");

      // Returned variants
      expect(normalizeLegacyOrderStatus("returned").status).toBe("returned");
      expect(normalizeLegacyOrderStatus("Returned").status).toBe("returned");
      expect(normalizeLegacyOrderStatus("refunded").status).toBe("returned");
    });

    it("safely handles unknown legacy statuses without misleading conversion", () => {
      const res = normalizeLegacyOrderStatus("awaiting_manual_verification");
      expect(res.status).toBe("pending"); // safe active status
      expect(res.isUnknown).toBe(true);
      expect(res.rawStatus).toBe("awaiting_manual_verification");

      const normalizedOrder = normalizeLegacyOrder({
        orderId: "ORD-999",
        status: "custom_inspection_hold",
      });
      expect(normalizedOrder.rawStatus).toBe("custom_inspection_hold");
      expect(normalizedOrder.legacyStatus).toBe("custom_inspection_hold");
    });

    it("extracts status from nested fields in documented precedence", () => {
      // operationalStatus takes precedence over status
      const docWithMultiStatus = {
        operationalStatus: "out_for_delivery",
        orderStatus: "Processing",
        status: "Pending",
      };
      const res = normalizeLegacyOrderStatus(docWithMultiStatus);
      expect(res.status).toBe("in transit");
      expect(res.rawStatus).toBe("out_for_delivery");
    });

    it("parses diverse date formats safely with fallback", () => {
      // Firestore Timestamp
      expect(parseLegacyDate({ seconds: 1760000000 })).toBe(
        new Date(1760000000 * 1000).toISOString()
      );
      // Milliseconds
      expect(parseLegacyDate(1760000000000)).toBe(
        new Date(1760000000000).toISOString()
      );
      // ISO String
      expect(parseLegacyDate("2026-10-10T12:00:00.000Z")).toBe(
        "2026-10-10T12:00:00.000Z"
      );
      // Missing / null fallback
      expect(parseLegacyDate(null)).toBe("1970-01-01T00:00:00.000Z");
      expect(parseLegacyDate(undefined)).toBe("1970-01-01T00:00:00.000Z");
      expect(parseLegacyDate("invalid-date-string")).toBe("1970-01-01T00:00:00.000Z");
    });

    it("normalizes legacy address and contact fields", () => {
      const addr = normalizeLegacyAddress({
        address: {
          door: "42/B",
          street: "Amman Street",
          town: "Gobichettipalayam",
          landmark: "Near Temple",
          pincode: "638454",
        },
      });
      expect(addr.houseNo).toBe("42/B");
      expect(addr.street).toBe("Amman Street");
      expect(addr.city).toBe("Gobichettipalayam");
      expect(addr.landmark).toBe("Near Temple");
      expect(addr.pincode).toBe("638454");
    });

    it("identifies POS and ERP non-retail orders", () => {
      expect(isPosOrNonRetailOrder({ salesChannel: "pos" })).toBe(true);
      expect(isPosOrNonRetailOrder({ orderSource: "manual" })).toBe(true);
      expect(isPosOrNonRetailOrder({ customerId: "CUS-000001" })).toBe(true);
      expect(isPosOrNonRetailOrder({ posInvoiceNumber: "INV-123" })).toBe(true);
      expect(
        isPosOrNonRetailOrder({ createdByStaffId: "staff_123" })
      ).toBe(true);
      expect(
        isPosOrNonRetailOrder({
          orderId: "ORD-0000001",
          buyerId: "SASS0000104",
        })
      ).toBe(false);
    });
  });

  // ==========================================================================
  // SUITE 2: Customer Order List Retrieval & Owned Details
  // ==========================================================================
  describe("2. Customer Order List Retrieval & Owned Details", () => {
    it("retrieves customer orders from subcollection users/{userId}/orders", async () => {
      await driver.setDoc(`users/${customerA}/orders`, "ORD-001", {
        orderId: "ORD-001",
        orderNumber: "ORD-001",
        userId: customerA,
        status: "Pending",
        createdAt: "2026-10-10T10:00:00.000Z",
        items: [
          {
            productId: "prod_oil_1",
            name: "Cold-Pressed Groundnut Oil",
            price: 240,
            quantity: 2,
            unit: "L",
            unitSize: "1",
          },
        ],
        totalAmount: 480,
      });

      const orders = await adapter.getCustomerOrders(customerA);
      expect(orders).toHaveLength(1);
      expect(orders[0]?.orderId).toBe("ORD-001");
      expect(orders[0]?.userId).toBe(customerA);
      expect(orders[0]?.status).toBe("pending");
      expect(orders[0]?.items).toHaveLength(1);
      expect(orders[0]?.pricingSummary.totalAmount).toBe(480);
    });

    it("retrieves individual owned order details by ID", async () => {
      await driver.setDoc(`users/${customerA}/orders`, "ORD-002", {
        orderId: "ORD-002",
        userId: customerA,
        status: "Delivered",
        createdAt: "2026-10-09T10:00:00.000Z",
        deliveredAt: "2026-10-09T14:00:00.000Z",
        deliveryAddress: {
          houseNo: "Plot 10",
          street: "Main Road",
          city: "Erode",
          pincode: "638001",
        },
      });

      const order = await adapter.getOrderById("ORD-002", customerA);
      expect(order).not.toBeNull();
      expect(order?.orderId).toBe("ORD-002");
      expect(order?.status).toBe("delivered");
      expect(order?.deliveredAt).toBe("2026-10-09T14:00:00.000Z");
      expect(order?.deliveryAddress.city).toBe("Erode");
    });
  });

  // ==========================================================================
  // SUITE 3: Missing Order, Empty History & Graceful Error Handling
  // ==========================================================================
  describe("3. Missing Order, Empty History & Graceful Error Handling", () => {
    it("returns empty array when customer has zero orders", async () => {
      const orders = await adapter.getCustomerOrders(customerA);
      expect(orders).toEqual([]);
    });

    it("returns null when retrieving non-existent order ID", async () => {
      const order = await adapter.getOrderById("ORD-NON-EXISTENT", customerA);
      expect(order).toBeNull();
    });

    it("throws 404 if parent customer profile does not exist", async () => {
      await expect(
        adapter.getCustomerOrders("SASS9999999")
      ).rejects.toMatchObject({
        status: 404,
        code: "not-found",
      });

      await expect(
        adapter.getOrderById("ORD-001", "SASS9999999")
      ).rejects.toMatchObject({
        status: 404,
        code: "not-found",
      });
    });
  });

  // ==========================================================================
  // SUITE 4: Cross-Customer Authorization & Ownership Protection
  // ==========================================================================
  describe("4. Cross-Customer Authorization & Ownership Protection", () => {
    it("prevents Customer A from accessing Customer B's order", async () => {
      // Seed Customer B's order in top-level orders
      await driver.setDoc("orders", "ORD-CUST-B-99", {
        orderId: "ORD-CUST-B-99",
        userId: customerB,
        buyerId: customerB,
        status: "Delivered",
        customerName: "Priya Sundaram",
      });

      // Customer A tries to retrieve Customer B's order
      await expect(
        adapter.getOrderById("ORD-CUST-B-99", customerA)
      ).rejects.toMatchObject({
        status: 403,
        code: "permission-denied",
      });
    });

    it("rejects non-canonical SASS IDs or Firebase UIDs as invalid customer identifiers", async () => {
      await expect(
        adapter.getCustomerOrders("not_a_sass_id")
      ).rejects.toMatchObject({
        status: 400,
        code: "invalid-argument",
      });

      // Firebase UIDs cannot be used directly as customer subcollection paths
      await expect(
        adapter.getCustomerOrders("HBbNTuCtczLLbBCvsww58NEqXRz2")
      ).rejects.toMatchObject({
        status: 400,
        code: "invalid-argument",
      });
    });
  });

  // ==========================================================================
  // SUITE 5: Deduplication & Reconciling Duplicate Representations
  // ==========================================================================
  describe("5. Deduplication & Reconciling Duplicate Representations", () => {
    it("deduplicates orders existing in both top-level and subcollection", async () => {
      // Subcollection representation
      await driver.setDoc(`users/${customerA}/orders`, "ORD-DUAL-01", {
        orderId: "ORD-DUAL-01",
        userId: customerA,
        status: "Pending",
        createdAt: "2026-10-10T08:00:00.000Z",
        totalAmount: 300,
      });

      // Top-level representation with updated operational stage from Admin
      await driver.setDoc("orders", "ORD-DUAL-01", {
        orderId: "ORD-DUAL-01",
        userId: customerA,
        buyerId: customerA,
        operationalStatus: "out_for_delivery",
        createdAt: "2026-10-10T08:00:00.000Z",
        totalAmount: 300,
        delivery: {
          slot: "Express 60-Min",
          driver: { name: "Ramesh", phone: "9876543210", vehicle: "EV-01" },
        },
      });

      const orders = await adapter.getCustomerOrders(customerA);
      expect(orders).toHaveLength(1);
      const merged = orders[0]!;
      expect(merged.orderId).toBe("ORD-DUAL-01");
      // Top-level operational stage overlaid
      expect(merged.status).toBe("in transit");
      expect(merged.delivery.driver?.name).toBe("Ramesh");
    });

    it("prioritizes customer cancellation in subcollection over un-synced top-level status", async () => {
      // Subcollection has customer cancellation
      await driver.setDoc(`users/${customerA}/orders`, "ORD-CANCEL-01", {
        orderId: "ORD-CANCEL-01",
        userId: customerA,
        status: "cancelled",
        cancelledAt: "2026-10-10T09:30:00.000Z",
        cancellationReason: "Changed mind",
      });

      // Top-level is stale / not yet updated
      await driver.setDoc("orders", "ORD-CANCEL-01", {
        orderId: "ORD-CANCEL-01",
        userId: customerA,
        buyerId: customerA,
        status: "Pending",
      });

      const order = await adapter.getOrderById("ORD-CANCEL-01", customerA);
      expect(order).not.toBeNull();
      expect(order?.status).toBe("cancelled");
      expect(order?.cancelledAt).toBe("2026-10-10T09:30:00.000Z");
    });

    it("excludes POS and counter orders from customer order history", async () => {
      // Customer retail order
      await driver.setDoc(`users/${customerA}/orders`, "ORD-ONLINE-01", {
        orderId: "ORD-ONLINE-01",
        userId: customerA,
        status: "delivered",
        createdAt: "2026-10-10T10:00:00.000Z",
      });

      // Top-level POS counter order
      await driver.setDoc("orders", "POS-INV-001", {
        orderId: "POS-INV-001",
        orderNumber: "POS-INV-001",
        salesChannel: "pos",
        orderSource: "manual",
        customerId: "CUS-000001",
        status: "Delivered",
      });

      const orders = await adapter.getCustomerOrders(customerA);
      expect(orders).toHaveLength(1);
      expect(orders[0]?.orderId).toBe("ORD-ONLINE-01");

      // Attempting to fetch the POS order returns null
      const posLookup = await adapter.getOrderById("POS-INV-001", customerA);
      expect(posLookup).toBeNull();
    });

    it("sorts orders deterministically by date descending with ID tiebreaker", () => {
      const reconciled = reconcileCustomerOrders({
        nestedOrders: [
          { orderId: "ORD-A", createdAt: "2026-10-08T00:00:00.000Z" },
          { orderId: "ORD-B", createdAt: "2026-10-10T00:00:00.000Z" },
          { orderId: "ORD-C", createdAt: "2026-10-09T00:00:00.000Z" },
          { orderId: "ORD-D" }, // Missing date -> safe fallback to epoch
        ],
        topLevelOrders: [],
        userId: customerA,
      });

      expect(reconciled.map((o) => o.orderId)).toEqual([
        "ORD-B",
        "ORD-C",
        "ORD-A",
        "ORD-D",
      ]);
    });
  });

  // ==========================================================================
  // SUITE 6: FirestoreAdapter & ApiClient Integration
  // ==========================================================================
  describe("6. FirestoreAdapter & ApiClient Integration", () => {
    it("routes GET /orders to LegacyOrderAdapter when legacy mode enabled", async () => {
      await driver.setDoc(`users/${customerA}/orders`, "ORD-API-01", {
        orderId: "ORD-API-01",
        userId: customerA,
        status: "Pending",
        createdAt: "2026-10-10T12:00:00.000Z",
      });

      const orders = await apiClient.get<Order[]>("/orders", { userId: customerA });
      expect(orders).toHaveLength(1);
      expect(orders[0]?.orderId).toBe("ORD-API-01");
    });

    it("routes GET /orders/:orderId?userId=... to LegacyOrderAdapter", async () => {
      await driver.setDoc(`users/${customerA}/orders`, "ORD-API-02", {
        orderId: "ORD-API-02",
        userId: customerA,
        status: "Delivered",
        createdAt: "2026-10-10T12:00:00.000Z",
      });

      const order = await apiClient.get<Order>(`/orders/ORD-API-02?userId=${customerA}`);
      expect(order).not.toBeNull();
      expect(order.orderId).toBe("ORD-API-02");
      expect(order.status).toBe("delivered");
    });

    it("fails closed when querying orders without customer identity in legacy mode", async () => {
      await expect(apiClient.get("/orders")).rejects.toMatchObject({
        status: 403,
        code: "permission-denied",
      });

      await expect(apiClient.get("/orders/ORD-001")).rejects.toMatchObject({
        status: 403,
        code: "permission-denied",
      });
    });

    it("allows order writes when legacy customer subcollections is enabled", async () => {
      const created = await apiClient.post("/orders", {
        orderId: "ORD-CREATED",
        userId: customerA,
        status: "pending",
      });
      expect(created).toBeDefined();
    });

    it("preserves flat mock mode when legacyCustomerSubcollections is disabled", async () => {
      // Disable legacy subcollections mode
      firestoreAdapter.setLegacyCustomerSubcollectionsEnabled(false);

      await driver.setDoc("orders", "ORD-MOCK-01", {
        id: "ORD-MOCK-01",
        orderId: "ORD-MOCK-01",
        userId: customerA,
        status: "pending",
        createdAt: "2026-10-10T12:00:00.000Z",
        customerName: "Arun Kumar",
        phone: "+919999999999",
        deliveryAddress: { houseNo: "1", street: "Road", city: "City", pincode: "600001" },
        delivery: { type: "standard", slot: "Morning" },
        payment: { method: "cod", status: "pending" },
        items: [],
        pricingSummary: { subtotal: 100, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 100 },
      });

      const orders = await apiClient.get<Order[]>("/orders", { userId: customerA });
      expect(orders).toHaveLength(1);
      expect(orders[0]?.orderId).toBe("ORD-MOCK-01");
    });
  });

  // ==========================================================================
  // SUITE 7: OrderSequence Integrity Verification
  // ==========================================================================
  describe("7. OrderSequence Integrity Verification", () => {
    it("confirms that read operations never modify documents or increment sequence counters", async () => {
      // Seed initial sequence counter
      await driver.setDoc("meta", "orderSequence", { current: 28 });
      await driver.setDoc("_metadata", "orderSequence", { currentSeq: 5510 });

      await driver.setDoc(`users/${customerA}/orders`, "ORD-READ-CHECK", {
        orderId: "ORD-READ-CHECK",
        userId: customerA,
        status: "delivered",
        createdAt: "2026-10-10T12:00:00.000Z",
      });

      // Perform repeated reads
      await adapter.getCustomerOrders(customerA);
      await adapter.getOrderById("ORD-READ-CHECK", customerA);
      await apiClient.get(`/orders?userId=${customerA}`);
      await apiClient.get(`/orders/ORD-READ-CHECK?userId=${customerA}`);

      // Verify sequence counters are completely untouched
      const metaCounter = await driver.getDoc("meta", "orderSequence");
      expect(metaCounter?.["current"]).toBe(28);

      const metadataCounter = await driver.getDoc("_metadata", "orderSequence");
      expect(metadataCounter?.["currentSeq"]).toBe(5510);
    });
  });

  // ==========================================================================
  // SUITE 8: Live Firebase Auth and Firestore Emulator Integration
  // ==========================================================================
  describe("8. Live Auth & Firestore Emulator Security Rules Verification", () => {
    it(
      "enforces customer ownership, cross-customer denial, and read-only protection against live emulators (ports 9099 & 8081)",
      async () => {
        const liveReachable = await areLiveEmulatorsReachable();
        if (!liveReachable) {
          console.warn("Live emulators not reachable. Skipping live emulator test.");
          return;
        }

        const { db } = getEmulatorFirestore();
        const runSuffix = `${Date.now()}`;
        const ownerEmail = `order.owner.${runSuffix}@sriamman.test`;
        const otherEmail = `order.other.${runSuffix}@sriamman.test`;
        const ownerSassId = `SASS_ORD_OWN_${runSuffix.slice(-6)}`;
        const otherSassId = `SASS_ORD_OTH_${runSuffix.slice(-6)}`;

        let ownerFixture: { cleanup: () => Promise<void> } | null = null;
        let otherFixture: { cleanup: () => Promise<void> } | null = null;

        const testOrderDocId = "ORD-EMULATOR-TEST-001";
        const subcollectionOrderRef = doc(
          db,
          "users",
          ownerSassId,
          "orders",
          testOrderDocId
        );
        const topLevelOrderRef = doc(db, "orders", testOrderDocId);

        try {
          // 1. Sign in as Owner Customer
          const ownerAuthUser = await signInLiveEmailLinkUser(ownerEmail);
          expect(ownerAuthUser.uid).toBeTruthy();

          // Seed linked customer profile with real UID
          ownerFixture = await seedEmulatorLinkedCustomerFixture(
            ownerAuthUser.uid,
            ownerEmail,
            { userDocId: ownerSassId, fullName: "Order Owner Customer" }
          );

          // 2. Client-side write to subcollection users/{ownerSassId}/orders is DENIED (read-only rule)
          await expect(
            setDoc(subcollectionOrderRef, {
              orderId: testOrderDocId,
              userId: ownerSassId,
              status: "pending",
            })
          ).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 3. Admin / seed an order document via top-level orders
          await setDoc(topLevelOrderRef, {
            orderId: testOrderDocId,
            userId: ownerSassId,
            buyerId: ownerSassId,
            status: "pending",
            createdAt: "2026-10-10T12:00:00.000Z",
          });

          // 4. Owner Customer CAN read their own top-level order
          const ownerReadTop = await getDoc(topLevelOrderRef);
          expect(ownerReadTop.exists()).toBe(true);
          expect(ownerReadTop.data()?.["userId"]).toBe(ownerSassId);

          // 5. Sign in as Other Customer (Customer B)
          const otherAuthUser = await signInLiveEmailLinkUser(otherEmail);
          expect(otherAuthUser.uid).toBeTruthy();

          otherFixture = await seedEmulatorLinkedCustomerFixture(
            otherAuthUser.uid,
            otherEmail,
            { userDocId: otherSassId, fullName: "Other Customer" }
          );

          // 6. Customer B CANNOT read Customer A's subcollection orders
          await expect(getDoc(subcollectionOrderRef)).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 7. Customer B CANNOT read Customer A's top-level order
          await expect(getDoc(topLevelOrderRef)).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 8. Sign out (Unauthenticated)
          await emailLinkAuthService.signOutFirebaseAuth();

          // 9. Unauthenticated request CANNOT read Customer A's subcollection orders
          await expect(getDoc(subcollectionOrderRef)).rejects.toMatchObject({
            code: "permission-denied",
          });

          // 10. Unauthenticated request CANNOT write to Customer A's subcollection orders
          await expect(
            setDoc(subcollectionOrderRef, {
              orderId: "ORD-HACK",
              userId: ownerSassId,
              status: "pending",
            })
          ).rejects.toMatchObject({
            code: "permission-denied",
          });

          // Cleanup top-level test order
          await deleteDoc(topLevelOrderRef).catch(() => {});
        } finally {
          await ownerFixture?.cleanup().catch(() => {});
          await otherFixture?.cleanup().catch(() => {});
          await emailLinkAuthService.signOutFirebaseAuth().catch(() => {});
        }
      },
      35000
    );
  });
});

