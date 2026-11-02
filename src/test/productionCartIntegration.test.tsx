import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { cartService } from "../services/cartService";
import { authManager } from "../services/authAdapter";
import {
  productionCartReader,
  setProductionCartReaderOverride,
  normalizeLegacyCartDocument,
} from "../services/productionCartReader";
import { apiClient } from "../services/apiClient";
import { StorageAdapterError } from "../services/firestoreAdapter";
import { CartPage } from "../routes/cart";
import type { CartItem, Product, Address } from "../types";

// Router mock
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, search, className, ...props }: any) => (
    <a
      href={`${to}?${new URLSearchParams(search || {}).toString()}`}
      className={className}
      data-testid="router-link"
      {...props}
    >
      {children}
    </a>
  ),
  useSearch: () => ({}),
  useNavigate: () => vi.fn(),
  useRouterState: () => ({ location: { pathname: "/cart" } }),
  createFileRoute: () => () => ({}),
}));

// Context mock states
let mockAuthUser: any = {
  id: "SASS0000104",
  name: "Priya S",
  phone: "+91 98400 12345",
  coins: 500,
  isVIP: true,
};

let mockCartState = {
  items: [] as CartItem[],
  isLoading: false,
  cartError: null as string | null,
  cartCount: 0,
  cartTotalMrp: 0,
  cartSubtotal: 0,
  cartTotalSavings: 0,
  couponDiscount: 0,
  coinsRedeemed: 0,
  coinDiscount: 0,
  deliveryFee: 0,
  finalTotal: 0,
  totalSavings: 0,
  totalSavingsPercent: 0,
  appliedCoupon: null as any,
  redeemCoins: false,
  coinsToRedeem: 100,
  deliverySpeed: "express" as const,
  applyCoupon: vi.fn(),
  removeCoupon: vi.fn(),
  setRedeemCoins: vi.fn(),
  setDeliverySpeed: vi.fn(),
  updateQty: vi.fn(),
  removeFromCart: vi.fn(),
  clearCart: vi.fn(),
  addToCart: vi.fn(),
};

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isLoading: false,
    isResolvingIdentity: false,
  }),
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => mockCartState,
}));

vi.mock("../context/WishlistContext", () => ({
  useWishlist: () => ({
    items: [],
    wishlistCount: 0,
    addToWishlist: vi.fn(),
  }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    t: (en: string) => en,
  }),
}));

vi.mock("../context/NotificationContext", () => ({
  useNotifications: () => ({
    unreadCount: 0,
    notifications: [],
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    fetchNotifications: vi.fn(),
  }),
}));

vi.mock("../services/addressService", () => ({
  addressService: {
    getAddresses: vi.fn().mockResolvedValue([
      {
        id: "addr_01",
        userId: "SASS0000104",
        tag: "Home",
        name: "Priya S",
        phone: "+91 98400 12345",
        houseNo: "42/1",
        street: "2nd Main Road",
        city: "Chennai",
        pincode: "600020",
        isDefault: true,
      },
    ]),
  },
}));

vi.mock("../services/productService", () => ({
  productService: {
    getProducts: vi.fn().mockResolvedValue([]),
    getProductById: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Production Cart Integration & Read-Only Communication", () => {
  beforeEach(() => {
    authManager.resetMode();
    setProductionCartReaderOverride(null);
    vi.restoreAllMocks();

    mockAuthUser = {
      id: "SASS0000104",
      name: "Priya S",
      phone: "+91 98400 12345",
      coins: 500,
      isVIP: true,
    };

    mockCartState = {
      items: [],
      isLoading: false,
      cartError: null,
      cartCount: 0,
      cartTotalMrp: 0,
      cartSubtotal: 0,
      cartTotalSavings: 0,
      couponDiscount: 0,
      coinsRedeemed: 0,
      coinDiscount: 0,
      deliveryFee: 0,
      finalTotal: 0,
      totalSavings: 0,
      totalSavingsPercent: 0,
      appliedCoupon: null,
      redeemCoins: false,
      coinsToRedeem: 100,
      deliverySpeed: "express",
      applyCoupon: vi.fn(),
      removeCoupon: vi.fn(),
      setRedeemCoins: vi.fn(),
      setDeliverySpeed: vi.fn(),
      updateQty: vi.fn(),
      removeFromCart: vi.fn(),
      clearCart: vi.fn(),
      addToCart: vi.fn(),
    };
  });

  afterEach(() => {
    authManager.resetMode();
    setProductionCartReaderOverride(null);
    vi.restoreAllMocks();
  });

  describe("1. Environment-Aware Service Routing", () => {
    it("routes getCart to productionCartReader in production auth mode", async () => {
      authManager.setMode("production");
      expect(authManager.getMode()).toBe("production");

      const mockCartItems: CartItem[] = [
        {
          id: "prod-oil_0",
          cartKey: "prod-oil_0",
          userId: "SASS0000104",
          productId: "prod-oil",
          optionIndex: 0,
          unit: "L",
          unitSize: "1",
          name: "Wood Pressed Sesame Oil (1L)",
          price: 360,
          mrp: 420,
          quantity: 2,
          image: "https://example.com/oil.jpg",
          stock: 10,
        },
      ];

      const readerSpy = vi.fn().mockResolvedValue(mockCartItems);
      setProductionCartReaderOverride({
        getCustomerCart: readerSpy,
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      const result = await cartService.getCart("SASS0000104");

      expect(readerSpy).toHaveBeenCalledTimes(1);
      expect(readerSpy).toHaveBeenCalledWith("SASS0000104");
      expect(apiGetSpy).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("prod-oil_0");
      expect(result[0]?.quantity).toBe(2);
      expect(result[0]?.price).toBe(360);
    });

    it("preserves local apiClient routing in emulator mode", async () => {
      authManager.setMode("emulator");
      expect(authManager.getMode()).toBe("emulator");

      const mockEmulatorCart: CartItem[] = [
        {
          id: "prod-ghee_0",
          cartKey: "prod-ghee_0",
          userId: "SASS0000104",
          productId: "prod-ghee",
          optionIndex: 0,
          unit: "ml",
          unitSize: "500",
          name: "A2 Desi Cow Ghee (500ml)",
          price: 650,
          mrp: 750,
          quantity: 1,
          image: "https://example.com/ghee.jpg",
          stock: 5,
        },
      ];

      const apiGetSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockEmulatorCart);
      const prodSpy = vi.fn();
      setProductionCartReaderOverride({ getCustomerCart: prodSpy });

      const result = await cartService.getCart("SASS0000104");

      expect(apiGetSpy).toHaveBeenCalledWith("/cart", { userId: "SASS0000104" });
      expect(prodSpy).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("prod-ghee_0");
    });

    it("preserves local apiClient routing in mock mode", async () => {
      authManager.setMode("mock");
      expect(authManager.getMode()).toBe("mock");

      const apiGetSpy = vi.spyOn(apiClient, "get").mockResolvedValue([]);
      const prodSpy = vi.fn();
      setProductionCartReaderOverride({ getCustomerCart: prodSpy });

      const result = await cartService.getCart("SASS0000104");

      expect(apiGetSpy).toHaveBeenCalledWith("/cart", { userId: "SASS0000104" });
      expect(prodSpy).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it("returns empty array if effective user ID cannot be resolved in production mode", async () => {
      authManager.setMode("production");
      const readerSpy = vi.fn();
      setProductionCartReaderOverride({ getCustomerCart: readerSpy });

      const result = await cartService.getCart("");

      expect(result).toEqual([]);
      expect(readerSpy).not.toHaveBeenCalled();
    });
  });

  describe("2. Fallback Resolution & Stale Data Prevention", () => {
    it("returns genuinely empty array for ONCUS customer when online cart is empty, preventing resurrection of stale legacy cart data", async () => {
      authManager.setMode("production");

      // Mock reader returning empty list for ONCUS customer
      const readerSpy = vi.fn().mockImplementation((customerId: string) => {
        if (customerId === "ONCUS0000010") {
          return Promise.resolve([]); // Genuinely empty online cart
        }
        return Promise.resolve([]);
      });
      setProductionCartReaderOverride({ getCustomerCart: readerSpy });

      const result = await cartService.getCart("ONCUS0000010", "SASS0000010");

      expect(readerSpy).toHaveBeenCalledTimes(1);
      expect(readerSpy).toHaveBeenCalledWith("ONCUS0000010", "SASS0000010");
      expect(result).toEqual([]); // Must be empty, NOT resurrecting SASS0000010 legacy items
    });

    it("returns online cart items when online customer cart has items", async () => {
      authManager.setMode("production");

      const onlineCart: CartItem[] = [
        {
          id: "prod-honey_0",
          cartKey: "prod-honey_0",
          userId: "ONCUS0000021",
          productId: "prod-honey",
          optionIndex: 0,
          unit: "g",
          unitSize: "500",
          name: "Raw Wild Honey (500g)",
          price: 280,
          mrp: 320,
          quantity: 1,
          image: "https://example.com/honey.jpg",
          stock: 12,
        },
      ];

      const readerSpy = vi.fn().mockImplementation((customerId: string) => {
        if (customerId === "ONCUS0000021") return Promise.resolve(onlineCart);
        return Promise.resolve([]);
      });

      setProductionCartReaderOverride({ getCustomerCart: readerSpy });

      const result = await cartService.getCart("ONCUS0000021", "SASS0000021");
      expect(result).toEqual(onlineCart);
      expect(result).toHaveLength(1);
      expect(result[0]?.userId).toBe("ONCUS0000021");
    });

    it("ensures customer collection isolation: unmigrated SASS customers query users collection while ONCUS customers query onlineCustomers", async () => {
      authManager.setMode("production");

      const readerSpy = vi.fn().mockResolvedValue([]);
      setProductionCartReaderOverride({ getCustomerCart: readerSpy });

      // Unmigrated SASS customer
      await cartService.getCart("SASS0000104");
      expect(readerSpy).toHaveBeenLastCalledWith("SASS0000104");

      // Migrated customer passed as SASS ID is resolved to canonical ONCUS ID
      await cartService.getCart("SASS0000021");
      expect(readerSpy).toHaveBeenLastCalledWith("ONCUS0000021", "SASS0000021");
    });
  });

  describe("3. Active Mutations in Production Mode", () => {
    beforeEach(() => {
      authManager.setMode("production");
    });

    const mockProduct: Product = {
      id: "prod-turmeric",
      name: "Organic Turmeric Powder",
      tamilName: "மஞ்சள் தூள்",
      categorySlug: "organic-spices",
      category: "Organic Spices",
      description: "Sun-dried natural turmeric powder",
      imageUrl: "https://example.com/turmeric.jpg",
      images: ["https://example.com/turmeric.jpg"],
      tags: ["turmeric", "organic"],
      isActive: true,
      brand: "Sri Amman",
      rating: 4.8,
      reviewCount: 25,
      options: [
        {
          unit: "g",
          unitSize: "250",
          offerPrice: 85,
          mrp: 100,
          stock: 20,
        },
      ],
    };

    it("allows addToCart in production mode", async () => {
      const item = await cartService.addToCart(mockProduct, 0, 1, "SASS0000104");
      expect(item).toBeDefined();
      expect(item.productId).toBe("prod-turmeric");
      expect(item.quantity).toBe(1);
    });

    it("allows updateQuantity in production mode", async () => {
      const updated = await cartService.updateQuantity("prod-turmeric__opt0__g__250", 3, "SASS0000104");
      expect(updated).toBeDefined();
    });

    it("allows removeFromCart in production mode", async () => {
      await expect(
        cartService.removeFromCart("prod-turmeric__opt0__g__250", "SASS0000104")
      ).resolves.not.toThrow();
    });

    it("allows clearCart in production mode", async () => {
      await expect(
        cartService.clearCart("SASS0000104")
      ).resolves.not.toThrow();
    });
  });

  describe("4. Normalization of Production Cart Documents", () => {
    it("normalizes a raw legacy cart document without userId prefix", () => {
      const docData = {
        cartKey: "prod-rice__opt0",
        productId: "prod-rice",
        productName: "Traditional Ponni Boiled Rice",
        optionIndex: 0,
        unit: "kg",
        unitSize: 5,
        sellingPrice: 320,
        mrp: 380,
        quantity: 2,
        stock: 15,
        imageUrl: "https://example.com/rice.jpg",
      };

      const item = normalizeLegacyCartDocument("prod-rice__opt0", docData, "SASS0000104");

      expect(item.id).toBe("prod-rice__opt0");
      expect(item.cartKey).toBe("prod-rice__opt0");
      expect(item.userId).toBe("SASS0000104");
      expect(item.productId).toBe("prod-rice");
      expect(item.name).toBe("Traditional Ponni Boiled Rice");
      expect(item.unit).toBe("kg");
      expect(item.unitSize).toBe("5");
      expect(item.price).toBe(320);
      expect(item.mrp).toBe(380);
      expect(item.quantity).toBe(2);
      expect(item.stock).toBe(15);
      expect(item.image).toBe("https://example.com/rice.jpg");
    });

    it("strips customer userId prefix when raw document key includes userId__", () => {
      const docData = {
        cartKey: "SASS0000104__prod-oil__opt1",
        productId: "prod-oil",
        name: "Wood Pressed Sesame Oil (1L)",
        unit: "L",
        unitSize: "1",
        price: 360,
        mrp: 420,
        quantity: 1,
      };

      const item = normalizeLegacyCartDocument(
        "SASS0000104__prod-oil__opt1",
        docData,
        "SASS0000104"
      );

      expect(item.id).toBe("prod-oil__opt1");
      expect(item.cartKey).toBe("prod-oil__opt1");
      expect(item.userId).toBe("SASS0000104");
      expect(item.price).toBe(360);
      expect(item.mrp).toBe(420);
    });

    it("reconciles cart item with product catalog to retrieve latest prices and options", () => {
      const catalog: Product[] = [
        {
          id: "prod-oil",
          name: "Cold Pressed Gingelly Oil",
          tamilName: "நல்லெண்ணெய்",
          categorySlug: "cold-pressed-oils",
          category: "Cold Pressed Oils",
          description: "Fresh wood churned",
          imageUrl: "https://example.com/catalog-oil.jpg",
          images: ["https://example.com/catalog-oil.jpg"],
          tags: ["oil", "sesame"],
          isActive: true,
          brand: "Sri Amman",
          rating: 4.9,
          reviewCount: 42,
          options: [
            {
              unit: "ml",
              unitSize: "500",
              offerPrice: 190,
              mrp: 220,
              stock: 30,
            },
            {
              unit: "L",
              unitSize: "1",
              offerPrice: 370,
              mrp: 430,
              specialPrice: 350,
              stock: 25,
            },
          ],
        },
      ];

      const docData = {
        cartKey: "prod-oil__opt1",
        productId: "prod-oil",
        unit: "L",
        unitSize: "1",
        quantity: 3,
      };

      const item = normalizeLegacyCartDocument(
        "prod-oil__opt1",
        docData,
        "SASS0000104",
        catalog
      );

      expect(item.productId).toBe("prod-oil");
      expect(item.name).toBe("Cold Pressed Gingelly Oil (1L)");
      expect(item.optionIndex).toBe(1);
      expect(item.price).toBe(370);
      expect(item.mrp).toBe(430);
      expect(item.specialPrice).toBe(350);
      expect(item.stock).toBe(25);
      expect(item.image).toBe("https://example.com/catalog-oil.jpg");
    });
  });

  describe("5. Validation and StorageAdapterError Classification", () => {
    it("assertValidCustomer accepts canonical SASS and ONCUS customer IDs", () => {
      expect(productionCartReader.assertValidCustomer("SASS0000001")).toBe("SASS0000001");
      expect(productionCartReader.assertValidCustomer("SASS0000104")).toBe("SASS0000104");
      expect(productionCartReader.assertValidCustomer("ONCUS000010")).toBe("ONCUS000010");
      expect(productionCartReader.assertValidCustomer("ONCUS0000001")).toBe("ONCUS0000001");
    });

    it("assertValidCustomer rejects malformed or invalid customer IDs", () => {
      expect(() => productionCartReader.assertValidCustomer("")).toThrow(
        StorageAdapterError
      );
      expect(() => productionCartReader.assertValidCustomer("INVALID_ID")).toThrow(
        StorageAdapterError
      );
      expect(() => productionCartReader.assertValidCustomer("guest_12345")).toThrow(
        StorageAdapterError
      );
      expect(() => productionCartReader.assertValidCustomer("../etc/passwd")).toThrow(
        StorageAdapterError
      );

      try {
        productionCartReader.assertValidCustomer("bad-id");
      } catch (err) {
        expect(err).toBeInstanceOf(StorageAdapterError);
        expect((err as StorageAdapterError).status).toBe(400);
        expect((err as StorageAdapterError).code).toBe("invalid-argument");
      }
    });

    it("propagates StorageAdapterError on Firestore failure and never silently falls back to apiClient or mock data", async () => {
      authManager.setMode("production");
      const apiGetSpy = vi.spyOn(apiClient, "get");

      setProductionCartReaderOverride({
        getCustomerCart: vi.fn().mockRejectedValue(
          new StorageAdapterError("Connection reset by peer", {
            status: 503,
            code: "unavailable",
            category: "connectivity",
          })
        ),
      });

      await expect(cartService.getCart("SASS0000104")).rejects.toThrow(
        StorageAdapterError
      );
      expect(apiGetSpy).not.toHaveBeenCalled();
    });
  });

  describe("6. Cart Page Read-Only UI and Notice Communication", () => {
    const sampleItems: CartItem[] = [
      {
        id: "prod-sesame_1L",
        cartKey: "prod-sesame_1L",
        userId: "SASS0000104",
        productId: "prod-sesame",
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
        name: "Cold Pressed Sesame Oil (1L)",
        price: 360,
        mrp: 420,
        quantity: 2,
        image: "https://example.com/sesame.jpg",
        stock: 15,
      },
    ];

    it("enables live interactive controls and checkout CTA in production mode", async () => {
      authManager.setMode("production");
      mockCartState.items = sampleItems;
      mockCartState.cartCount = 2;
      mockCartState.cartSubtotal = 720;

      await act(async () => {
        render(<CartPage />);
      });

      // 1. Notice banner must NOT be present
      expect(screen.queryByTestId("production-cart-notice")).not.toBeInTheDocument();

      // 2. Clear Cart button must be enabled
      const clearBtn = screen.getByRole("button", { name: /clear cart/i });
      expect(clearBtn).not.toBeDisabled();

      // 3. Stepper buttons must be enabled
      const decreaseBtn = screen.getByTitle("Decrease quantity");
      expect(decreaseBtn).not.toBeDisabled();
      const increaseBtn = screen.getByTitle("Increase quantity");
      expect(increaseBtn).not.toBeDisabled();

      // 4. Save and Remove buttons must be enabled
      const saveBtns = screen.getAllByRole("button", { name: /save/i });
      expect(saveBtns[0]).not.toBeDisabled();
      const removeBtns = screen.getAllByRole("button", { name: /remove/i });
      expect(removeBtns[0]).not.toBeDisabled();

      // 5. Checkout CTA must be enabled
      const checkoutBtn = screen.getByRole("button", { name: /Proceed to Checkout/i });
      expect(checkoutBtn).not.toBeDisabled();
    });

    it("renders empty-cart-view when cart is genuinely empty with no error", async () => {
      authManager.setMode("production");
      mockCartState.items = [];
      mockCartState.cartError = null;

      await act(async () => {
        render(<CartPage />);
      });

      expect(screen.getByTestId("empty-cart-view")).toBeInTheDocument();
      expect(screen.getByText(/Your Shopping Cart is Empty/i)).toBeInTheDocument();
      expect(screen.queryByTestId("cart-error-banner")).not.toBeInTheDocument();
    });

    it("displays cart-error-banner when cart loading encounters an error and never displays empty-cart-view", async () => {
      authManager.setMode("production");
      mockCartState.items = [];
      mockCartState.cartError = "Failed to connect to production Firestore: network timeout";

      await act(async () => {
        render(<CartPage />);
      });

      const errorBanner = screen.getByTestId("cart-error-banner");
      expect(errorBanner).toBeInTheDocument();
      expect(errorBanner).toHaveTextContent("Unable to Load Your Cart");
      expect(errorBanner).toHaveTextContent("Failed to connect to production Firestore: network timeout");

      // Crucial: Must NOT render "Your Shopping Cart is Empty" when there's an error
      expect(screen.queryByTestId("empty-cart-view")).not.toBeInTheDocument();
      expect(screen.queryByText(/Your Shopping Cart is Empty/i)).not.toBeInTheDocument();

      // Retry button must be present
      const retryBtn = screen.getByRole("button", { name: /try again/i });
      expect(retryBtn).toBeInTheDocument();
    });

    it("does not display production-cart-notice in emulator mode and enables interactive controls", async () => {
      authManager.setMode("emulator");
      mockCartState.items = sampleItems;
      mockCartState.cartCount = 2;
      mockCartState.cartSubtotal = 720;

      await act(async () => {
        render(<CartPage />);
      });

      // Notice banner must NOT be present
      expect(screen.queryByTestId("production-cart-notice")).not.toBeInTheDocument();

      // Clear Cart button must be enabled
      const clearBtn = screen.getByRole("button", { name: /clear cart/i });
      expect(clearBtn).not.toBeDisabled();

      // Stepper buttons must be enabled
      const decreaseBtn = screen.getByTitle("Decrease quantity");
      expect(decreaseBtn).not.toBeDisabled();
      const increaseBtn = screen.getByTitle("Increase quantity");
      expect(increaseBtn).not.toBeDisabled();

      // Save and Remove buttons must be enabled
      const saveBtn = screen.getByRole("button", { name: /save/i });
      expect(saveBtn).not.toBeDisabled();
      const removeBtn = screen.getByRole("button", { name: /remove/i });
      expect(removeBtn).not.toBeDisabled();

      // Checkout CTA must be enabled
      const checkoutBtn = screen.getByRole("button", { name: /Proceed to Checkout/i });
      expect(checkoutBtn).not.toBeDisabled();
    });
  });
});
