import { afterEach, describe, expect, it, vi } from "vitest";
import { customerIdentityService } from "../services/customerIdentityService";
import { apiClient } from "../services/apiClient";
import { cartService } from "../services/cartService";
import { wishlistService } from "../services/wishlistService";
import type { Product } from "../types";

const product: Product = {
  id: "catalog-product-42", name: "Groundnut Oil", category: "Oils", categorySlug: "oils",
  brand: "Sri Amman", rating: 0, reviewCount: 0, description: "", imageUrl: "/oil.png",
  images: ["/oil.png"], tags: [], isActive: true,
  options: [{ unit: "ml", unitSize: "500", mrp: 250, offerPrice: 220, stock: 2 }],
};
const resolvedIdentity = {
  status: "resolved" as const, ok: true as const, uid: "verified-firebase-uid",
  userDocId: "ONCUS0000001",
  mapping: { uid: "verified-firebase-uid", userDocId: "ONCUS0000001", collection: "onlineCustomers" as const, accountType: "customer" as const },
  profile: { id: "ONCUS0000001" } as never,
};

describe("wishlist customer list and cart integration", () => {
  afterEach(() => vi.restoreAllMocks());

  it("does not create global wishlist collections", async () => {
    expect(await wishlistService.getWishlists("ONCUS0000001")).toEqual([]);
    await expect(wishlistService.createWishlist("Pantry", "Monthly staples", "ONCUS0000001"))
      .rejects.toThrow(/not available/i);
  });

  it("adds available saved products through the existing customer cart service", async () => {
    vi.spyOn(customerIdentityService, "resolveCurrentFirebaseUserProfile").mockResolvedValue(resolvedIdentity);
    const adapter = {
      getCustomerWishlistProducts: vi.fn(async () => [{
        id: product.id, productId: product.id, productName: product.name,
        sellingPrice: 220, mrp: 250, variantName: "500 ml", isActive: true,
      }]),
    };
    vi.spyOn(apiClient, "getFirestoreAdapter").mockReturnValue(adapter as never);
    const addToCart = vi.spyOn(cartService, "addToCart").mockResolvedValue({} as never);

    const result = await wishlistService.moveAllInStockToCart("all", [product], "ONCUS0000002");
    expect(result).toEqual({ addedCount: 1, skippedCount: 0, unavailableNames: [] });
    expect(addToCart).toHaveBeenCalledWith(product, 0, 1, "ONCUS0000001", false);
  });

  it("keeps unavailable or inactive saved entries visible as skipped cart items", async () => {
    vi.spyOn(customerIdentityService, "resolveCurrentFirebaseUserProfile").mockResolvedValue(resolvedIdentity);
    vi.spyOn(apiClient, "getFirestoreAdapter").mockReturnValue({
      getCustomerWishlistProducts: vi.fn(async () => [{
        id: "removed-product", productId: "removed-product", productName: "Seasonal Produce",
        sellingPrice: 35, isActive: true,
      }]),
    } as never);
    const addToCart = vi.spyOn(cartService, "addToCart");

    const result = await wishlistService.moveAllInStockToCart("all", [product]);
    expect(result).toEqual({ addedCount: 0, skippedCount: 1, unavailableNames: ["Seasonal Produce"] });
    expect(addToCart).not.toHaveBeenCalled();
  });
});
