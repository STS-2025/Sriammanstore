import { afterEach, describe, expect, it, vi } from "vitest";
import { customerIdentityService } from "../services/customerIdentityService";
import { apiClient } from "../services/apiClient";
import { FirestoreAdapter } from "../services/firestoreAdapter";
import { wishlistService } from "../services/wishlistService";
import type { Product } from "../types";

const product: Product = {
  id: "catalog-product-42", name: "Cold Pressed Groundnut Oil", category: "Oils",
  categorySlug: "oils", brand: "Sri Amman", rating: 0, reviewCount: 0,
  description: "", imageUrl: "/images/oil.png", images: ["/images/oil.png"],
  tags: [], isActive: true,
  options: [{ unit: "ml", unitSize: "500", mrp: 250, offerPrice: 220, stock: 8 }],
};

describe("customer wishlist subcollection", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uses the resolved online customer identity and writes the product snapshot under the product ID", async () => {
    vi.spyOn(customerIdentityService, "resolveCurrentFirebaseUserProfile").mockResolvedValue({
      status: "resolved", ok: true, uid: "firebase-user-a", userDocId: "ONCUS0000042",
      mapping: { uid: "firebase-user-a", userDocId: "ONCUS0000042", collection: "onlineCustomers", accountType: "customer" },
      profile: { id: "ONCUS0000042" } as never,
    });
    const rows: Record<string, unknown>[] = [];
    const adapter = {
      getCustomerWishlistProducts: vi.fn(async () => rows),
      saveCustomerWishlistProduct: vi.fn(async (_customerId: string, productId: string, payload: Record<string, unknown>) => {
        rows.push({ id: productId, ...payload });
        return payload;
      }),
      deleteCustomerWishlistProduct: vi.fn(async (_customerId: string, productId: string) => {
        const index = rows.findIndex((row) => row["productId"] === productId);
        if (index >= 0) rows.splice(index, 1);
      }),
    };
    vi.spyOn(apiClient, "getFirestoreAdapter").mockReturnValue(adapter as never);

    const added = await wishlistService.toggleWishlistProduct(product);
    expect(added.added).toBe(true);
    expect(adapter.saveCustomerWishlistProduct).toHaveBeenCalledWith("ONCUS0000042", product.id, {
      productId: product.id,
      productName: product.name,
      brandName: product.brand,
      imageUrl: product.imageUrl,
      sellingPrice: 220,
      mrp: 250,
      variantName: "500 ml",
      isActive: true,
      categoryName: "Oils",
    });
    expect(rows).toHaveLength(1);

    const removed = await wishlistService.toggleWishlistProduct(product);
    expect(removed.added).toBe(false);
    expect(adapter.deleteCustomerWishlistProduct).toHaveBeenCalledWith("ONCUS0000042", product.id);
    expect(rows).toHaveLength(0);
  });

  it("fails closed for legacy or unresolved customer identities", async () => {
    vi.spyOn(customerIdentityService, "resolveCurrentFirebaseUserProfile").mockResolvedValue({
      status: "resolved", ok: true, uid: "firebase-user-a", userDocId: "SASS0000042",
      mapping: { uid: "firebase-user-a", userDocId: "SASS0000042", collection: "users", accountType: "customer" },
      profile: { id: "SASS0000042" } as never,
    });
    const getAdapter = vi.spyOn(apiClient, "getFirestoreAdapter");
    await expect(wishlistService.toggleWishlistProduct(product)).rejects.toThrow(/legacy customer profile/i);
    expect(getAdapter).not.toHaveBeenCalled();
  });

  it("routes adapter reads and writes only through onlineCustomers/{id}/wishlistProducts/{productId}", async () => {
    const driver = {
      queryCollection: vi.fn(async () => []),
      setDoc: vi.fn(async (_collection: string, _id: string, payload: Record<string, unknown>) => payload),
      deleteDoc: vi.fn(async () => undefined),
    };
    const adapter = new FirestoreAdapter(driver as never);
    await adapter.getCustomerWishlistProducts("ONCUS0000042");
    await adapter.saveCustomerWishlistProduct("ONCUS0000042", product.id, {
      productId: product.id, productName: product.name, sellingPrice: 220, isActive: true,
    });
    await adapter.deleteCustomerWishlistProduct("ONCUS0000042", product.id);

    expect(driver.queryCollection).toHaveBeenCalledWith("onlineCustomers/ONCUS0000042/wishlistProducts", {});
    expect(driver.setDoc).toHaveBeenCalledWith(
      "onlineCustomers/ONCUS0000042/wishlistProducts", product.id,
      expect.objectContaining({ productId: product.id, addedAt: expect.anything() }), false,
    );
    expect(driver.deleteDoc).toHaveBeenCalledWith("onlineCustomers/ONCUS0000042/wishlistProducts", product.id);
    await expect(adapter.getCustomerWishlistProducts("SASS0000042")).rejects.toThrow(/resolved online customer identity/i);
  });
});
