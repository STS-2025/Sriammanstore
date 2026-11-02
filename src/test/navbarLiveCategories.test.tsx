import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { StoreHeader } from "../components/layout/StoreHeader";
import { productService } from "../services/productService";
import type { Category } from "../types";

// Mock router
const mockNavigate = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, search, ...props }: any) => (
    <a href={to} data-search={JSON.stringify(search)} {...props}>
      {children}
    </a>
  ),
  useNavigate: () => mockNavigate,
}));

// Mock Contexts
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => ({ cartCount: 0, cartSubtotal: 0 }),
}));

vi.mock("../context/WishlistContext", () => ({
  useWishlist: () => ({ wishlistCount: 0 }),
}));

vi.mock("../context/NotificationContext", () => ({
  useNotifications: () => ({ unreadCount: 0 }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    language: "en",
    toggleLanguage: vi.fn(),
    t: (en: string, _ta?: string) => en,
  }),
}));

const mockCategories: Category[] = [
  {
    id: "cat-mun1fjzh",
    name: "Grocery",
    tamilName: "மளிகை",
    slug: "sambar",
    itemCount: "6+ Items",
    image: "https://example.com/grocery.jpg",
    subcategories: ["Masala & Spice Powders", "Whole Spices"],
  },
  {
    id: "cat-spices",
    name: "Spices & Masala Powders",
    tamilName: "மசாலா மற்றும் மசாலா பொடிகள்",
    slug: "spices-and-masala-powders",
    itemCount: "3+ Items",
    image: "",
    subcategories: ["Whole Spices"],
  },
  {
    id: "cat-oils",
    name: "Cold Pressed Oils",
    tamilName: "மரச்செக்கு எண்ணெய்கள்",
    slug: "cold-pressed-oils",
    itemCount: "4+ Items",
    image: "https://example.com/oils.jpg",
    subcategories: ["Groundnut Oil", "Sesame Oil"],
  },
];

describe("StoreHeader Live Firebase Categories Dropdown & Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the three primary navbar buttons and strictly removes static category links", async () => {
    vi.spyOn(productService, "getCategories").mockResolvedValueOnce(mockCategories);

    render(<StoreHeader />);

    // 1. All Categories button exists
    const allCategoriesBtn = screen.getByTestId("navbar-all-categories-button");
    expect(allCategoriesBtn).toBeInTheDocument();
    expect(allCategoriesBtn).toHaveAttribute("aria-expanded", "false");

    // 2. Smart Deals button exists and links to deals
    const smartDealsBtn = screen.getByTestId("navbar-smart-deals-button");
    expect(smartDealsBtn).toBeInTheDocument();
    expect(smartDealsBtn.getAttribute("href")).toBe("/shop");
    expect(smartDealsBtn.getAttribute("data-search")).toContain('"deals":true');

    // 3. VIP Club button exists and links to rewards
    const vipClubBtn = screen.getByTestId("navbar-vip-club-button");
    expect(vipClubBtn).toBeInTheDocument();
    expect(vipClubBtn.getAttribute("href")).toBe("/rewards");

    // 4. Confirm hardcoded static category links are completely gone from the navbar
    expect(screen.queryByText("Farm Fresh Fruits & Veggies")).toBeNull();
    expect(screen.queryByText("Staples & Grains")).toBeNull();
    expect(screen.queryByText("Cold Pressed Oils & Ghee")).toBeNull();
    expect(screen.queryByText("Organic Spices & Masalas")).toBeNull();
    expect(screen.queryByText("Dairy & Breakfast")).toBeNull();
    expect(screen.queryByText("Snacks & Sweets")).toBeNull();
  });

  it("opens the dropdown when All Categories is clicked and renders live categories", async () => {
    vi.spyOn(productService, "getCategories").mockResolvedValueOnce(mockCategories);

    render(<StoreHeader />);

    const allCategoriesBtn = screen.getByTestId("navbar-all-categories-button");

    // Dropdown initially closed
    expect(screen.queryByTestId("navbar-categories-dropdown")).toBeNull();

    // Click to open
    fireEvent.click(allCategoriesBtn);
    expect(allCategoriesBtn).toHaveAttribute("aria-expanded", "true");

    const dropdown = await screen.findByTestId("navbar-categories-dropdown");
    expect(dropdown).toBeInTheDocument();

    // Verify "All Products" option
    expect(screen.getByTestId("category-option-all")).toBeInTheDocument();

    // Verify categories from Firebase
    expect(screen.getByTestId("category-option-sambar")).toBeInTheDocument();
    expect(within(dropdown).getByText("Grocery")).toBeInTheDocument();
    expect(within(dropdown).getByText("Spices & Masala Powders")).toBeInTheDocument();
    expect(within(dropdown).getByText("Cold Pressed Oils")).toBeInTheDocument();
  });

  it("navigates to the selected category and closes the dropdown", async () => {
    vi.spyOn(productService, "getCategories").mockResolvedValueOnce(mockCategories);

    render(<StoreHeader />);

    const allCategoriesBtn = screen.getByTestId("navbar-all-categories-button");
    fireEvent.click(allCategoriesBtn);

    const categoryOption = await screen.findByTestId("category-option-sambar");
    fireEvent.click(categoryOption);

    // Should navigate with category slug
    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/shop",
      search: { category: "sambar" },
    });

    // Dropdown should be closed after selection
    expect(screen.queryByTestId("navbar-categories-dropdown")).toBeNull();
    expect(allCategoriesBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("navigates to /shop without category when All Products is selected", async () => {
    vi.spyOn(productService, "getCategories").mockResolvedValueOnce(mockCategories);

    render(<StoreHeader />);

    const allCategoriesBtn = screen.getByTestId("navbar-all-categories-button");
    fireEvent.click(allCategoriesBtn);

    const allOption = await screen.findByTestId("category-option-all");
    fireEvent.click(allOption);

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/shop" });
    expect(screen.queryByTestId("navbar-categories-dropdown")).toBeNull();
  });

  it("displays loading state while categories are being retrieved", async () => {
    let resolvePromise: (val: Category[]) => void = () => {};
    const deferredPromise = new Promise<Category[]>((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(productService, "getCategories").mockReturnValueOnce(deferredPromise);

    render(<StoreHeader />);

    const allCategoriesBtn = screen.getByTestId("navbar-all-categories-button");
    fireEvent.click(allCategoriesBtn);

    // Should show loading state
    expect(screen.getByTestId("categories-loading-state")).toBeInTheDocument();

    // Resolve promise
    resolvePromise(mockCategories);

    await waitFor(() => {
      expect(screen.queryByTestId("categories-loading-state")).toBeNull();
    });
    const dropdown = screen.getByTestId("navbar-categories-dropdown");
    expect(within(dropdown).getByText("Grocery")).toBeInTheDocument();
  });

  it("displays empty state when Firebase returns 0 categories", async () => {
    vi.spyOn(productService, "getCategories").mockResolvedValueOnce([]);

    render(<StoreHeader />);

    const allCategoriesBtn = screen.getByTestId("navbar-all-categories-button");
    fireEvent.click(allCategoriesBtn);

    const emptyState = await screen.findByTestId("categories-empty-state");
    expect(emptyState).toBeInTheDocument();
    expect(emptyState).toHaveTextContent("No categories found");
  });

  it("handles fetch errors gracefully with retry button without mock fallback", async () => {
    vi.spyOn(productService, "getCategories")
      .mockRejectedValueOnce(new Error("Firestore network disconnect"))
      .mockResolvedValueOnce(mockCategories);

    render(<StoreHeader />);

    const allCategoriesBtn = screen.getByTestId("navbar-all-categories-button");
    fireEvent.click(allCategoriesBtn);

    const errorState = await screen.findByTestId("categories-error-state");
    expect(errorState).toBeInTheDocument();
    expect(errorState).toHaveTextContent("Firestore network disconnect");

    // Click retry
    const retryBtn = screen.getByText("Retry");
    fireEvent.click(retryBtn);

    const dropdown = screen.getByTestId("navbar-categories-dropdown");
    await waitFor(() => {
      expect(within(dropdown).getByText("Grocery")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("categories-error-state")).toBeNull();
  });

  it("closes the dropdown when Escape key is pressed", async () => {
    vi.spyOn(productService, "getCategories").mockResolvedValueOnce(mockCategories);

    render(<StoreHeader />);

    const allCategoriesBtn = screen.getByTestId("navbar-all-categories-button");
    fireEvent.click(allCategoriesBtn);

    expect(await screen.findByTestId("navbar-categories-dropdown")).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(allCategoriesBtn, { key: "Escape" });

    expect(screen.queryByTestId("navbar-categories-dropdown")).toBeNull();
    expect(allCategoriesBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the dropdown when clicking outside", async () => {
    vi.spyOn(productService, "getCategories").mockResolvedValueOnce(mockCategories);

    render(
      <div>
        <div data-testid="outside-element">Outside</div>
        <StoreHeader />
      </div>
    );

    const allCategoriesBtn = screen.getByTestId("navbar-all-categories-button");
    fireEvent.click(allCategoriesBtn);

    expect(await screen.findByTestId("navbar-categories-dropdown")).toBeInTheDocument();

    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside-element"));

    expect(screen.queryByTestId("navbar-categories-dropdown")).toBeNull();
  });
});
