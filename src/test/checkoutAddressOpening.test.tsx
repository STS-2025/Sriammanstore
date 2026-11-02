import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CheckoutPage } from "../routes/checkout";
import { CartPage } from "../routes/cart";
import { AddressesPage } from "../routes/addresses";
import { addressService } from "../services/addressService";
import { settingsService } from "../services/settingsService";
import { productService } from "../services/productService";
import { toast } from "sonner";
import type { User, CartItem, Address, DeliverySlot } from "../types";

// Mock router
const mockNavigate = vi.fn();
let mockSearchParams: Record<string, any> = { step: 2 };

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (opts: any) => opts,
  useSearch: () => mockSearchParams,
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: any) => (
    <a href={typeof to === "string" ? to : "/mock-link"} {...props}>
      {children}
    </a>
  ),
}));

// Mock layout components
vi.mock("../components/layout/StoreHeader", () => ({
  StoreHeader: () => <div data-testid="store-header">StoreHeader</div>,
}));
vi.mock("../components/layout/BottomNav", () => ({
  BottomNav: () => <div data-testid="bottom-nav">BottomNav</div>,
}));
vi.mock("../components/layout/StoreFooter", () => ({
  StoreFooter: () => <div data-testid="store-footer">StoreFooter</div>,
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock NotificationContext
vi.mock("../context/NotificationContext", () => ({
  useNotifications: () => ({
    notifications: [],
    unreadCount: 0,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  }),
}));

// Mock WishlistContext
vi.mock("../context/WishlistContext", () => ({
  useWishlist: () => ({
    wishlistItems: [],
    isInWishlist: () => false,
    addToWishlist: vi.fn(),
    removeFromWishlist: vi.fn(),
  }),
}));

// Mock LanguageContext
vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    setLanguage: vi.fn(),
    t: (k: string) => k,
  }),
}));

// Mock AuthContext
const mockUser: User = {
  id: "ONCUS0000099",
  userId: "ONCUS0000099",
  name: "Karthik Subramanian",
  phone: "+91 98400 12345",
  email: "karthik@example.com",
  smartCoins: 100,
  coins: 100,
  isVIP: false,
  referralCode: "ONCUS0000099",
  createdAt: "2026-10-29T00:00:00Z",
};

let mockAuthContext = {
  user: mockUser as User | null,
  isLoading: false,
  isResolvingIdentity: false,
};

vi.mock("../context/AuthContext", () => ({
  useAuth: () => mockAuthContext,
}));

// Mock CartContext
const mockCartItem: CartItem = {
  id: "item_oil_1",
  cartKey: "item_oil_1",
  userId: "ONCUS0000099",
  productId: "prod_oil_1",
  name: "Mara Chekku Groundnut Oil",
  image: "/oil.jpg",
  unit: "ml",
  unitSize: "500",
  price: 220,
  mrp: 260,
  quantity: 1,
  optionIndex: 0,
  stock: 20,
};

let mockSelectedAddressId: string | null = null;
let mockSelectedSlotId: string | null = "slot_exp";

const mockCartContext = {
  items: [mockCartItem],
  cartCount: 1,
  cartTotalMrp: 260,
  cartSubtotal: 220,
  cartTotalSavings: 40,
  appliedCoupon: null,
  couponDiscount: 0,
  coinsRedeemed: 0,
  coinDiscount: 0,
  deliverySpeed: "express",
  deliveryFee: 29,
  finalTotal: 249,
  totalSavings: 40,
  totalSavingsPercent: 15,
  selectedAddressId: null as string | null,
  selectedSlotId: "slot_exp",
  paymentMethod: "cod" as const,
  setDeliverySpeed: vi.fn(),
  setSelectedAddressId: vi.fn((id: string | null) => {
    mockSelectedAddressId = id;
  }),
  setSelectedSlotId: vi.fn((id: string | null) => {
    mockSelectedSlotId = id;
  }),
  setPaymentMethod: vi.fn(),
  clearCart: vi.fn(),
};

vi.mock("../context/CartContext", () => ({
  useCart: () => ({
    ...mockCartContext,
    selectedAddressId: mockSelectedAddressId,
    selectedSlotId: mockSelectedSlotId,
  }),
}));

// Mock DeliverySlots
const mockSlots: DeliverySlot[] = [
  {
    id: "slot_exp",
    type: "express",
    title: "Express 60-Min Dispatch",
    subtitle: "Within 60-90 minutes",
    charge: 29,
  },
  {
    id: "slot_std",
    type: "standard",
    title: "Standard Morning Delivery",
    subtitle: "8:00 AM - 11:00 AM",
    charge: 0,
  },
];

describe("Checkout Step 2 Address Opening Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthContext = { user: mockUser, isLoading: false, isResolvingIdentity: false };
    mockSearchParams = { step: 2 };
    mockSelectedAddressId = null;
    mockSelectedSlotId = "slot_exp";
    vi.spyOn(settingsService, "getDeliverySlots").mockResolvedValue(mockSlots);
  });

  it("opens the Add New Delivery Address modal when clicking 'Continue to Payment' if there is no address", async () => {
    // Return empty addresses list
    vi.spyOn(addressService, "getAddresses").mockResolvedValue([]);

    render(<CheckoutPage />);

    // Wait for empty state to render
    expect(await screen.findByTestId("no-address-empty-state")).toBeDefined();
    expect(screen.getByText(/No Delivery Address Found/i)).toBeDefined();

    // Verify modal is not open initially
    expect(screen.queryByText(/Add New Delivery Address/i)).toBeNull();

    // Click the main 'Continue to Payment' button
    const continueBtns = screen.getAllByRole("button", { name: /Continue to Payment/i });
    expect(continueBtns.length).toBeGreaterThan(0);

    // Verify it is NOT disabled
    expect(continueBtns[0]?.hasAttribute("disabled")).toBe(false);

    // Click Continue to Payment
    fireEvent.click(continueBtns[0]!);

    // Modal should now be opened!
    await waitFor(() => {
      expect(screen.getByText("Add New Delivery Address")).toBeDefined();
    });

    // Informational toast should be triggered
    expect(toast.info).toHaveBeenCalledWith(
      expect.stringMatching(/Please add a delivery address to proceed/i)
    );
  });

  it("allows adding a new address through the modal, updating selectedAddress, and proceeding to payment", async () => {
    vi.spyOn(addressService, "getAddresses").mockResolvedValue([]);
    const addSpy = vi.spyOn(addressService, "addAddress").mockResolvedValue({
      id: "addr_new_123",
      userId: "ONCUS0000099",
      tag: "Home",
      name: "Karthik Subramanian",
      phone: "+91 98400 12345",
      houseNo: "42/B",
      street: "Kasipalayam High Road",
      landmark: "Near Temple",
      city: "Gobichettipalayam",
      pincode: "638454",
      lat: 11.4595,
      lng: 77.3338,
      isDefault: true,
    });

    render(<CheckoutPage />);

    expect(await screen.findByTestId("no-address-empty-state")).toBeDefined();

    // Click 'Add New Address' button in empty state
    const addBtn = screen.getByRole("button", { name: /Add New Address/i });
    fireEvent.click(addBtn);

    // Modal is opened
    expect(await screen.findByText("Add New Delivery Address")).toBeDefined();

    // Fill in house number and street
    const houseInput = screen.getByPlaceholderText(/Plot 14, Door 2B/i);
    const streetInput = screen.getByPlaceholderText(/Kasipalayam Road/i);

    fireEvent.change(houseInput, { target: { value: "42/B" } });
    fireEvent.change(streetInput, { target: { value: "Kasipalayam High Road" } });

    // Submit form
    const saveBtn = screen.getByRole("button", { name: /Save Address/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(addSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          houseNo: "42/B",
          street: "Kasipalayam High Road",
        })
      );
    });

    expect(toast.success).toHaveBeenCalledWith("New delivery address saved!");
  });

  it("redirects back to checkout when saving an address on the AddressesPage with redirect param", async () => {
    mockSearchParams = { redirect: "/checkout?step=2", action: "new" };
    vi.spyOn(addressService, "getAddresses").mockResolvedValue([]);
    vi.spyOn(addressService, "addAddress").mockResolvedValue({
      id: "addr_999",
      userId: "ONCUS0000099",
      tag: "Home",
      name: "Karthik",
      phone: "+91 98400 12345",
      houseNo: "10",
      street: "Main St",
      city: "Gobichettipalayam",
      pincode: "638454",
      lat: 11.4598,
      lng: 77.334,
      isDefault: true,
    });

    render(<AddressesPage />);

    // Return to checkout link is visible
    expect(await screen.findByText(/Return to Checkout/i)).toBeDefined();

    // Modal auto-opened because action === "new"
    expect(screen.getByText(/Add New Delivery Location/i)).toBeDefined();

    const houseInput = screen.getByPlaceholderText(/Amman Kovil Street/i);
    const streetInput = screen.getByPlaceholderText(/Kasipalayam/i);

    fireEvent.change(houseInput, { target: { value: "10" } });
    fireEvent.change(streetInput, { target: { value: "Main St" } });

    const saveBtn = screen.getByRole("button", { name: /Save Location/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/checkout?step=2" });
    });
  });

  describe("Hardcoded Address Removal & Cart No-Address State", () => {
    beforeEach(() => {
      vi.spyOn(settingsService, "getDeliverySettings").mockResolvedValue({
        storeLocation: { lat: 11.4595, lng: 77.3338, name: "Gobichettipalayam Store" },
        standardFee: 49,
        expressFee: 99,
        freeDeliveryThreshold: 499,
        maxDeliveryRadiusKm: 6,
        estimatedDeliveryMinutes: 45,
      } as any);
      vi.spyOn(productService, "getProducts").mockResolvedValue([]);
    });

    it("displays 'No Delivery Address Found' with '+ Add Address' in Cart when account has 0 addresses", async () => {
      vi.spyOn(addressService, "getAddresses").mockResolvedValue([]);

      render(<CartPage />);

      // Must find the no-address banner
      expect(await screen.findByTestId("no-address-cart-banner")).toBeDefined();
      expect(screen.getByText("No Delivery Address Found")).toBeDefined();
      expect(
        screen.getByText(/No address saved for this account. Please add a delivery address./i)
      ).toBeDefined();

      // Ensure NO hardcoded mock address exists anywhere on the screen
      expect(screen.queryByText(/Priya S — 42\/1/i)).toBeNull();
      expect(screen.queryByText(/Gandhi Nagar, Adyar, Chennai/i)).toBeNull();

      // Click '+ Add Address' button
      const addAddressBtn = screen.getByRole("button", { name: /Add Address/i });
      fireEvent.click(addAddressBtn);

      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/checkout",
        search: { step: 2, newAddress: true },
      });
    });

    it("displays the real address and 'Change Address' in Cart when account has a saved address", async () => {
      const realAddress: Address = {
        id: "addr_real_1",
        userId: "ONCUS0000099",
        tag: "Home",
        name: "Karthik Subramanian",
        phone: "+91 98400 12345",
        houseNo: "55/A",
        street: "Sathy Road",
        city: "Gobichettipalayam",
        pincode: "638452",
        lat: 11.4595,
        lng: 77.3338,
        isDefault: true,
      };
      vi.spyOn(addressService, "getAddresses").mockResolvedValue([realAddress]);

      render(<CartPage />);

      expect(await screen.findByTestId("delivery-address-cart-banner")).toBeDefined();
      expect(screen.getByText("Delivering to Home")).toBeDefined();
      expect(
        screen.getByText(/Karthik Subramanian — 55\/A, Sathy Road, Gobichettipalayam 638452/i)
      ).toBeDefined();

      // Ensure no hardcoded mock fallback is rendered
      expect(screen.queryByText(/Priya S — 42\/1/i)).toBeNull();
      expect(screen.queryByTestId("no-address-cart-banner")).toBeNull();

      // Click 'Change Address'
      const changeBtn = screen.getByRole("button", { name: /Change Address/i });
      fireEvent.click(changeBtn);

      expect(mockNavigate).toHaveBeenCalledWith({
        to: "/checkout",
        search: { step: 2 },
      });
    });

    it("displays 'No address selected' in the CheckoutProgressBar when no address is chosen", async () => {
      vi.spyOn(addressService, "getAddresses").mockResolvedValue([]);

      render(<CheckoutPage />);

      expect(await screen.findByTestId("no-address-empty-state")).toBeDefined();
      // Verify "Adyar, Chennai" is NOT displayed
      expect(screen.queryByText(/Adyar, Chennai/i)).toBeNull();
      // Progress bar should have "No address selected"
      expect(screen.getByText("No address selected")).toBeDefined();
    });
  });

  it("shows login and account creation options before an unauthenticated visitor can check out", async () => {
    mockAuthContext = { user: null, isLoading: false, isResolvingIdentity: false };

    render(<CheckoutPage />);

    expect(await screen.findByText(/sign in or create an account to choose a delivery address/i)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Sign In" }).getAttribute("href")).toBe("/login");
    expect(screen.getByRole("link", { name: "Create Account" }).getAttribute("href")).toBe("/sign-up");
  });
});
