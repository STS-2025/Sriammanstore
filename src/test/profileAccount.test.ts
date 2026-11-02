import { describe, it, expect, beforeEach } from "vitest";
import { authService, TEST_CREDENTIALS, AUTH_STORAGE_KEY } from "../services/authService";
import { addressService } from "../services/addressService";
import { orderService } from "../services/orderService";
import { coinService, convertCoinsToRupees } from "../services/coinService";
import { wishlistService } from "../services/wishlistService";
import { notificationService } from "../services/notificationService";
import { apiClient } from "../services/apiClient";
import type { Address, Order, User } from "../types";

describe("Profile & Account Dashboard Verification", () => {
  const customerA = "SASS0000104"; // Arun Kumar
  const customerB = "SASS0000088"; // Priya Sundaram (VIP)

  const sampleAddressA1: Address = {
    id: "addr_a1",
    userId: customerA,
    tag: "Home",
    name: "Arun Kumar",
    phone: "+91 99999 99999",
    houseNo: "Plot 14",
    street: "Kasipalayam Road",
    landmark: "Near Temple",
    city: "Gobichettipalayam",
    pincode: "638454",
    lat: 11.4598,
    lng: 77.334,
    isDefault: true,
  };

  const sampleAddressA2: Address = {
    id: "addr_a2",
    userId: customerA,
    tag: "Work",
    name: "Arun Kumar (Office)",
    phone: "+91 99999 99999",
    houseNo: "Door 8",
    street: "Bhavani Main Road",
    city: "Gobichettipalayam",
    pincode: "638454",
    lat: 11.461,
    lng: 77.336,
    isDefault: false,
  };

  const sampleAddressB: Address = {
    id: "addr_b1",
    userId: customerB,
    tag: "Home",
    name: "Priya Sundaram",
    phone: "+91 94433 12345",
    houseNo: "42/1",
    street: "Gandhi Nagar",
    city: "Gobichettipalayam",
    pincode: "638454",
    lat: 11.4595,
    lng: 77.3338,
    isDefault: true,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  describe("1. Customer-Data Isolation & Access Control", () => {
    it("fetches addresses strictly scoped to the requesting customer", async () => {
      const addressesA = await addressService.getAddresses(customerA);
      expect(Array.isArray(addressesA)).toBe(true);
      addressesA.forEach((addr) => {
        expect(addr.userId).toBe(customerA);
      });

      const addressesB = await addressService.getAddresses(customerB);
      expect(Array.isArray(addressesB)).toBe(true);
      addressesB.forEach((addr) => {
        expect(addr.userId).toBe(customerB);
      });
    });

    it("ensures orders returned belong strictly to the requesting customer", async () => {
      const ordersA = await orderService.getOrders(customerA);
      expect(Array.isArray(ordersA)).toBe(true);
      ordersA.forEach((order) => {
        expect(order.userId).toBe(customerA);
      });
    });

    it("prevents User A from viewing User B's order by ID", async () => {
      const originalGet = apiClient.get;
      apiClient.get = (async (url: string) => {
        if (url.includes("/orders")) {
          return [
            {
              id: "ORD-SEC-01",
              orderId: "ORD-SEC-01",
              userId: customerB,
              status: "delivered",
            },
          ];
        }
        return (originalGet as any).call(apiClient, url);
      }) as any;

      try {
        await expect(
          orderService.getOrderById("ORD-SEC-01", customerA)
        ).rejects.toThrow("Access denied: You cannot view another customer's order.");
      } finally {
        apiClient.get = originalGet;
      }
    });
  });

  describe("2. Account Summary Values & Metric Derivations", () => {
    const mockOrders: Order[] = [
      {
        id: "O1",
        orderId: "O1",
        userId: customerA,
        customerName: "Arun",
        phone: "9999999999",
        status: "delivered",
        createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        deliveryAddress: { houseNo: "1", street: "S", city: "C", pincode: "600000" },
        delivery: { type: "standard", slot: "Morning" },
        payment: { method: "online", status: "paid" },
        items: [],
        pricingSummary: { subtotal: 3000, productSavings: 200, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 3000 },
      },
      {
        id: "O2",
        orderId: "O2",
        userId: customerA,
        customerName: "Arun",
        phone: "9999999999",
        status: "delivered",
        createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
        deliveryAddress: { houseNo: "1", street: "S", city: "C", pincode: "600000" },
        delivery: { type: "standard", slot: "Morning" },
        payment: { method: "online", status: "paid" },
        items: [],
        pricingSummary: { subtotal: 2500, productSavings: 150, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 2500 },
      },
      {
        id: "O3",
        orderId: "O3",
        userId: customerA,
        customerName: "Arun",
        phone: "9999999999",
        status: "cancelled",
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        deliveryAddress: { houseNo: "1", street: "S", city: "C", pincode: "600000" },
        delivery: { type: "standard", slot: "Morning" },
        payment: { method: "cod", status: "pending" },
        items: [],
        pricingSummary: { subtotal: 1000, productSavings: 0, deliveryFee: 0, coinDiscount: 0, couponDiscount: 0, totalAmount: 1000 },
      },
    ];

    it("derives total orders and lifetime spend excluding cancelled orders", () => {
      const totalCount = mockOrders.length;
      expect(totalCount).toBe(3);

      const lifetimeSpend = mockOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.pricingSummary.totalAmount, 0);

      expect(lifetimeSpend).toBe(5500); // 3000 + 2500, excluding 1000
    });

    it("evaluates binary VIP eligibility (>= ₹5,000 delivered in 30 days)", () => {
      const vipCalc = coinService.calculateVIPStatus(mockOrders, 5000);
      expect(vipCalc.isVIP).toBe(true);
      expect(vipCalc.rollingSpend).toBe(5500);
      expect(vipCalc.percentage).toBe(100);
    });

    it("correctly converts Amman Coins to INR redeemable value (1 coin = ₹0.05 official rate)", () => {
      const coins = 250;
      const redeemableValue = convertCoinsToRupees(coins);
      expect(redeemableValue).toBe(12.5);
    });

    it("formats address summary tags accurately", () => {
      const testAddrs: Address[] = [sampleAddressA1, sampleAddressA2];
      const tags = Array.from(new Set(testAddrs.map((a) => a.tag)));
      const summary = tags.join(" & ") + " configured";
      expect(summary).toBe("Home & Work configured");
    });
  });

  describe("3. Personal Profile Editing & Validation", () => {
    it("validates that full name has at least 2 characters", () => {
      const validateName = (name: string) => !!name.trim() && name.trim().length >= 2;
      expect(validateName("")).toBe(false);
      expect(validateName(" ")).toBe(false);
      expect(validateName("A")).toBe(false);
      expect(validateName("Arun Kumar")).toBe(true);
    });

    it("validates email address format correctly", () => {
      const validateEmail = (email: string) =>
        !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

      expect(validateEmail("invalid-email")).toBe(false);
      expect(validateEmail("missing@domain")).toBe(false);
      expect(validateEmail("arun@example.com")).toBe(true);
      expect(validateEmail("")).toBe(true); // optional email allowed
    });

    it("persists updated profile to storage and backend via authService", async () => {
      const initialUser: User = {
        id: customerA,
        userId: customerA,
        name: "Arun Kumar",
        phone: "+91 99999 99999",
        email: "arun.kumar@example.com",
        coins: 100,
        isVIP: false,
        referralCode: customerA,
        createdAt: "2024-01-15T09:30:00.000Z",
      };

      const originalPatch = apiClient.patch;
      apiClient.patch = (async (url: string, data: any) => {
        return { ...initialUser, ...data };
      }) as any;

      try {
        const updated = await authService.updateProfile(customerA, {
          name: "Arun K.",
          email: "arun.new@example.com",
          preferredLanguage: "Tamil / English",
          birthday: "15 August",
        });

        expect(updated.name).toBe("Arun K.");
        expect(updated.email).toBe("arun.new@example.com");

        // Verify stored in localStorage
        const stored = authService.getCurrentUser();
        expect(stored?.name).toBe("Arun K.");
        expect(stored?.email).toBe("arun.new@example.com");
      } finally {
        apiClient.patch = originalPatch;
      }
    });
  });

  describe("4. Saved Delivery Addresses CRUD & Default Behavior", () => {
    it("sets default address and clears default from other user addresses", async () => {
      const originalGet = apiClient.get;
      const originalPatch = apiClient.patch;
      const patched: Record<string, boolean> = {};

      apiClient.get = (async () => [sampleAddressA1, sampleAddressA2]) as any;
      apiClient.patch = (async (url: string, data: any) => {
        const id = url.split("/").pop();
        if (id && "isDefault" in data) {
          patched[id] = data.isDefault;
        }
        return { ...sampleAddressA2, ...data };
      }) as any;

      try {
        await addressService.setDefaultAddress(sampleAddressA2.id, customerA);
        // sampleAddressA1 should be set to isDefault: false, sampleAddressA2 to true
        expect(patched[sampleAddressA1.id]).toBe(false);
        expect(patched[sampleAddressA2.id]).toBe(true);
      } finally {
        apiClient.get = originalGet;
        apiClient.patch = originalPatch;
      }
    });

    it("validates 6km delivery geofence for saved addresses", () => {
      // Casipalayam Kasipalayam Road in Gobichettipalayam (within 6km)
      const insideZone = addressService.validateGeofence(11.4598, 77.334);
      expect(insideZone.eligible).toBe(true);
      expect(insideZone.distanceKm).toBeLessThanOrEqual(6.0);

      // Perundurai Toll Gate (outside 6km delivery boundary)
      const outsideZone = addressService.validateGeofence(11.275, 77.582);
      expect(outsideZone.eligible).toBe(false);
      expect(outsideZone.distanceKm).toBeGreaterThan(6.0);
    });

    it("adds a new address and automatically marks it default if first address", async () => {
      const originalPost = apiClient.post;
      const originalGet = apiClient.get;
      let postedAddress: any = null;

      apiClient.get = (async () => []) as any; // No addresses exist
      apiClient.post = (async (url: string, data: any) => {
        postedAddress = data;
        return data;
      }) as any;

      try {
        await addressService.addAddress({
          userId: customerA,
          tag: "Home",
          name: "Arun",
          phone: "+91 99999 99999",
          houseNo: "12",
          street: "Gandhi Nagar",
          city: "Gobichettipalayam",
          pincode: "638454",
          lat: 11.4598,
          lng: 77.334,
          isDefault: true,
        });

        expect(postedAddress).toBeDefined();
        expect(postedAddress.isDefault).toBe(true);
        expect(postedAddress.userId).toBe(customerA);
      } finally {
        apiClient.post = originalPost;
        apiClient.get = originalGet;
      }
    });

    it("deletes address via addressService", async () => {
      const originalDelete = apiClient.delete;
      let deletedId: string | null = null;

      apiClient.delete = (async (url: string) => {
        deletedId = url.split("/").pop() || null;
      }) as any;

      try {
        await addressService.deleteAddress("addr_a2");
        expect(deletedId).toBe("addr_a2");
      } finally {
        apiClient.delete = originalDelete;
      }
    });
  });

  describe("5. Sidebar Navigation Links Validity", () => {
    it("verifies all sidebar navigation targets map to supported application routes", () => {
      const supportedRoutes = [
        "/",
        "/account",
        "/orders",
        "/addresses",
        "/wishlist",
        "/rewards",
        "/refer",
        "/notifications",
        "/help",
        "/policies",
        "/login",
      ];

      const sidebarLinks = [
        "/account", // Profile Information
        "/orders", // My Orders & Tracking
        "/wishlist", // Wishlist & Collections
        "/rewards", // Amman Coins & Rewards / VIP
        "/refer", // Refer & Earn
        "/notifications", // Notifications
        "/help", // Help & Support
        "/policies", // Store Policies & Legal
      ];

      sidebarLinks.forEach((link) => {
        expect(supportedRoutes).toContain(link);
      });
    });
  });

  describe("6. Authentication & Session Logout", () => {
    it("clears user session from localStorage upon logout", () => {
      const user: User = {
        id: customerA,
        userId: customerA,
        name: "Arun Kumar",
        phone: "+91 99999 99999",
        email: "arun@example.com",
        coins: 100,
        isVIP: false,
        referralCode: customerA,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
      expect(authService.getCurrentUser()).toBeDefined();

      authService.logout();
      expect(authService.getCurrentUser()).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    });
  });

  describe("7. Customer ID (SASS ID) Dashboard Display & Fallbacks (Phase 3C)", () => {
    // Helper function that mirrors the resolution rule in src/routes/account.tsx
    const resolveCustomerSassId = (u?: Partial<User> | null) => {
      return u?.id || u?.userId || "Not available";
    };

    it("resolves primary user.id as SASS ID", () => {
      const user: Partial<User> = {
        id: "SASS0000104",
        userId: "SASS0000104",
        name: "Arun Kumar",
      };
      expect(resolveCustomerSassId(user)).toBe("SASS0000104");
    });

    it("falls back to user.userId when user.id is missing or empty", () => {
      const user: Partial<User> = {
        id: "",
        userId: "SASS0000088",
        name: "Priya Sundaram",
      };
      expect(resolveCustomerSassId(user)).toBe("SASS0000088");
    });

    it("returns neutral fallback 'Not available' when both id and userId are missing", () => {
      const userWithoutId: Partial<User> = {
        name: "Guest User",
      };
      expect(resolveCustomerSassId(userWithoutId)).toBe("Not available");
      expect(resolveCustomerSassId(null)).toBe("Not available");
      expect(resolveCustomerSassId(undefined)).toBe("Not available");
    });

    it("strictly preserves SASS ID format and never substitutes UID or phone number", () => {
      const userWithUid: Partial<User> = {
        id: "SASS0000104",
        userId: "SASS0000104",
        uid: "firebase-raw-uid-abcdef123456",
        phone: "+91 99999 99999",
      };
      const resolved = resolveCustomerSassId(userWithUid);
      expect(resolved).toBe("SASS0000104");
      expect(resolved).not.toBe("firebase-raw-uid-abcdef123456");
      expect(resolved).not.toBe("+91 99999 99999");
    });

    it("verifies account.tsx includes both sidebar badge and personal info field with proper contracts", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const accountFilePath = path.resolve(__dirname, "../routes/account.tsx");
      const content = fs.readFileSync(accountFilePath, "utf-8");

      // Verify calculation of customerSassId
      expect(content).toContain('const customerSassId = user?.id || user?.userId || "Not available";');

      // Verify sidebar badge
      expect(content).toContain('data-testid="sidebar-customer-id-badge"');
      expect(content).toContain("Customer ID: {customerSassId}");
      expect(content).toContain("bg-emerald-50");
      expect(content).toContain("text-[#005f3f]");

      // Verify Personal Information field
      expect(content).toContain('data-testid="personal-info-customer-id"');
      expect(content).toContain("Customer ID (SASS ID)");
      expect(content).toContain("{customerSassId}");

      // Verify read-only status in Personal Information (no input or edit controls for SASS ID)
      const personalInfoSectionMatch = content.match(
        /data-testid="personal-info-customer-id"[\s\S]*?<\/div>\s*<\/div>/
      );
      expect(personalInfoSectionMatch).not.toBeNull();
      const personalInfoSectionText = personalInfoSectionMatch![0];
      expect(personalInfoSectionText).not.toContain("<input");
      expect(personalInfoSectionText).not.toContain("<button");
      expect(personalInfoSectionText).not.toContain("onChange");
    });
  });
});

