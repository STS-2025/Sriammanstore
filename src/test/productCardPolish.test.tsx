import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProductCard } from "../components/product/ProductCard";
import {
  normalizedProductionProductFixtures,
  CHICKEN_MASALA_NEUTRAL_PLACEHOLDER,
  TURMERIC_POWDER_FIXTURE_IMAGE,
} from "../fixtures/productionProductFixtures";
import { normalizeLegacyProduct } from "../services/legacySchemaMapper";
import type { Product } from "../types";

// Mock router Link to simple anchor
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to, search, className, ...props }: any) => (
    <a href={to} className={className} data-testid="router-link" {...props}>
      {children}
    </a>
  ),
}));

// Mock Contexts
vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock("../context/CartContext", () => ({
  useCart: () => ({
    addToCart: vi.fn(),
    updateQty: vi.fn(),
    getItemQuantity: vi.fn(() => 0),
  }),
}));

vi.mock("../context/WishlistContext", () => ({
  useWishlist: () => ({
    isWishlisted: vi.fn(() => false),
    toggleWishlist: vi.fn(),
  }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    t: (en: string, _ta?: string) => en,
  }),
}));

// Verified mock product with genuine ratings
const verifiedMockProduct: Product = {
  id: "prod_groundnut_oil",
  name: "Heritage Wood Churned Mara Chekku Groundnut Oil",
  tamilName: "மரச்செக்கு கடலை எண்ணெய்",
  category: "Cold Pressed Oils",
  categorySlug: "cold-pressed-oils",
  brand: "Sri Amman Organics",
  rating: 4.9,
  reviewCount: 1842,
  description: "Wood churned groundnut oil extracted using traditional methods.",
  imageUrl: "https://lh3.googleusercontent.com/test-groundnut.jpg",
  images: ["https://lh3.googleusercontent.com/test-groundnut.jpg"],
  tags: ["Wood Churned", "Pure Organic", "Bestseller"],
  isActive: true,
  options: [
    { unit: "L", unitSize: "1", mrp: 299, offerPrice: 245, stock: 50 },
    { unit: "L", unitSize: "5", mrp: 1420, offerPrice: 1150, stock: 10 },
  ],
};

describe("ProductCard Polish & Production-Compatible Rendering", () => {
  const turmericFixture = normalizedProductionProductFixtures.find(
    (p) => p.id === "prod-mumqpksq"
  )!;
  const chickenMasalaFixture = normalizedProductionProductFixtures.find(
    (p) => p.id === "prod-munn8cp3"
  )!;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // SUITE 1: Rating Display Invariants (Hide Unverified / Show Verified)
  // ==========================================================================
  describe("1. Rating Display Invariants", () => {
    it("hides the rating row for Sakthi Turmeric Powder (prod-mumqpksq) since rating data is unverified (0)", () => {
      expect(turmericFixture.rating).toBe(0);
      expect(turmericFixture.reviewCount).toBe(0);

      const { queryByTestId } = render(
        <ProductCard product={turmericFixture} />
      );

      expect(queryByTestId("product-rating-row")).toBeNull();
      expect(screen.queryByText("0")).toBeNull();
    });

    it("hides the rating row for Sakthi Chicken Masala (prod-munn8cp3) since rating data is unverified (0)", () => {
      expect(chickenMasalaFixture.rating).toBe(0);
      expect(chickenMasalaFixture.reviewCount).toBe(0);

      const { queryByTestId } = render(
        <ProductCard product={chickenMasalaFixture} />
      );

      expect(queryByTestId("product-rating-row")).toBeNull();
      expect(screen.queryByText("0")).toBeNull();
    });

    it("hides rating row when rating is positive but reviewCount is 0", () => {
      const partialProduct: Product = {
        ...turmericFixture,
        rating: 4.5,
        reviewCount: 0,
      };

      const { queryByTestId } = render(
        <ProductCard product={partialProduct} />
      );

      expect(queryByTestId("product-rating-row")).toBeNull();
    });

    it("hides rating row when reviewCount is positive but rating is 0", () => {
      const partialProduct: Product = {
        ...turmericFixture,
        rating: 0,
        reviewCount: 15,
      };

      const { queryByTestId } = render(
        <ProductCard product={partialProduct} />
      );

      expect(queryByTestId("product-rating-row")).toBeNull();
    });

    it("hides rating row when rating or reviewCount is undefined, null, NaN, or negative", () => {
      const edgeCases: Partial<Product>[] = [
        { rating: undefined as any, reviewCount: undefined as any },
        { rating: null as any, reviewCount: null as any },
        { rating: Number.NaN, reviewCount: 10 },
        { rating: 4.5, reviewCount: Number.NaN },
        { rating: -1, reviewCount: 10 },
        { rating: 4.5, reviewCount: -5 },
        { rating: 0, reviewCount: 0 },
      ];

      for (const edge of edgeCases) {
        const edgeProduct: Product = {
          ...turmericFixture,
          ...edge,
        };
        const { queryByTestId, unmount } = render(
          <ProductCard product={edgeProduct} />
        );
        expect(queryByTestId("product-rating-row")).toBeNull();
        unmount();
      }
    });

    it("ensures Turmeric fixture (prod-mumqpksq) has rating: 0 and reviewCount: 0 without rating row", () => {
      expect(turmericFixture.rating).toBe(0);
      expect(turmericFixture.reviewCount).toBe(0);

      const { queryByTestId } = render(<ProductCard product={turmericFixture} />);
      expect(queryByTestId("product-rating-row")).toBeNull();
      expect(screen.queryByText("4.8")).toBeNull();
      expect(screen.queryByText("(142)")).toBeNull();
    });

    it("ensures Chicken Masala fixture (prod-munn8cp3) has rating: 0 and reviewCount: 0 without rating row", () => {
      expect(chickenMasalaFixture.rating).toBe(0);
      expect(chickenMasalaFixture.reviewCount).toBe(0);

      const { queryByTestId } = render(<ProductCard product={chickenMasalaFixture} />);
      expect(queryByTestId("product-rating-row")).toBeNull();
      expect(screen.queryByText("4.7")).toBeNull();
      expect(screen.queryByText("(98)")).toBeNull();
    });

    it("renders genuine star rating and review count when both rating > 0 and reviewCount > 0", () => {
      const { getByTestId, getByText } = render(
        <ProductCard product={verifiedMockProduct} />
      );

      const ratingRow = getByTestId("product-rating-row");
      expect(ratingRow).toBeInTheDocument();
      expect(getByText("4.9")).toBeInTheDocument();
      expect(getByText("(1842)")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SUITE 2: Product Image & Fallback Rendering
  // ==========================================================================
  describe("2. Product Image & Fallback Handling", () => {
    it("renders the Turmeric Powder placeholder illustration without Puliyogare photo", () => {
      render(<ProductCard product={turmericFixture} />);

      const img = screen.getByRole("img", { name: turmericFixture.name });
      expect(img).toBeInTheDocument();
      expect(img.getAttribute("src")).toBe(TURMERIC_POWDER_FIXTURE_IMAGE);
      expect(img.getAttribute("src")).not.toContain("puliyogare");
    });

    it("renders the Chicken Masala neutral placeholder image and strictly avoids Puliyogare photos", () => {
      render(<ProductCard product={chickenMasalaFixture} />);

      const img = screen.getByRole("img", { name: chickenMasalaFixture.name });
      expect(img).toBeInTheDocument();
      expect(img.getAttribute("src")).toBe(CHICKEN_MASALA_NEUTRAL_PLACEHOLDER);
      expect(img.getAttribute("src")).not.toContain("puliyogare");
    });

    it("switches to product-image-fallback container when image fails to load (onError)", () => {
      render(<ProductCard product={verifiedMockProduct} />);

      const img = screen.getByRole("img", { name: verifiedMockProduct.name });
      expect(img).toBeInTheDocument();
      expect(screen.queryByTestId("product-image-fallback")).toBeNull();

      // Trigger error event on image
      fireEvent.error(img);

      const fallback = screen.getByTestId("product-image-fallback");
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveTextContent(verifiedMockProduct.name);
      expect(screen.queryByRole("img")).toBeNull();
    });

    it("renders product-image-fallback directly when imageUrl is empty string", () => {
      const productNoImage: Product = {
        ...turmericFixture,
        imageUrl: "",
      };

      render(<ProductCard product={productNoImage} />);

      const fallback = screen.getByTestId("product-image-fallback");
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveTextContent(productNoImage.name);
      expect(screen.queryByRole("img")).toBeNull();
    });
  });

  // ==========================================================================
  // SUITE 3: Read-Only Preview Mode
  // ==========================================================================
  describe("3. Read-Only Preview Mode", () => {
    it("renders image without interactive Link navigation when readOnly is true", () => {
      render(<ProductCard product={turmericFixture} readOnly={true} />);

      const img = screen.getByRole("img", { name: turmericFixture.name });
      expect(img).toBeInTheDocument();

      // Parent should be a non-link div, not router-link
      const parent = img.closest("a");
      expect(parent).toBeNull();

      // Quick wishlist button should be omitted in readOnly mode
      expect(screen.queryByTitle("Save to wishlist")).toBeNull();
      expect(screen.queryByTitle("Remove from wishlist")).toBeNull();
    });

    it("renders interactive Link navigation and wishlist button in normal mode", () => {
      render(<ProductCard product={turmericFixture} readOnly={false} />);

      const links = screen.getAllByTestId("router-link");
      expect(links.length).toBeGreaterThan(0);

      // Wishlist button is present in normal mode
      expect(screen.getByTitle("Save to wishlist")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // SUITE 4: Pack Option Selection and Discount Badges
  // ==========================================================================
  describe("4. Pack Option Selection and Discount Badges", () => {
    it("displays discount badge when mrp > offerPrice", () => {
      // verifiedMockProduct: 500ml option has mrp: 299, offerPrice: 245 => 18% OFF
      render(<ProductCard product={verifiedMockProduct} />);

      // (299 - 245) / 299 = 18.06% -> 18% OFF
      expect(screen.getByText("18% OFF")).toBeInTheDocument();
    });

    it("switches options when option pill is clicked and preserves clean UI without ratings", () => {
      render(<ProductCard product={verifiedMockProduct} />);

      // Initially 1L option is selected
      expect(screen.getByText("₹245")).toBeInTheDocument();

      // Switch to 5L option
      const fiveLPill = screen.getByRole("button", { name: /5\s*L/i });
      fireEvent.click(fiveLPill);

      // Now 5L option price is shown: ₹1150
      expect(screen.getByText("₹1150")).toBeInTheDocument();
    });
  });
});
