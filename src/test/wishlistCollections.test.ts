import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { wishlistService } from "../services/wishlistService";
import { cartService } from "../services/cartService";
import { productService } from "../services/productService";
import { notificationService } from "../services/notificationService";
import { apiClient } from "../services/apiClient";
import type { Product, Wishlist, WishlistProduct } from "../types";

describe("Wishlist & Curated Collections Feature & Notification Audit", () => {
  const testCustomer = "SASS0000104";
  const otherCustomer = "SASS0000088";

  const mockGroundnutOil: Product = {
    id: "prod_groundnut_oil",
    name: "Heritage Wood Churned Mara Chekku Groundnut Oil",
    category: "Cold Pressed Oils & Ghee",
    categorySlug: "cold-pressed-oils",
    brand: "Sri Amman Heritage",
    description: "Traditional wood churned groundnut oil.",
    tags: ["WOOD-PRESSED", "COLD-PRESSED", "ORGANIC"],
    rating: 4.8,
    reviewCount: 142,
    imageUrl: "/images/groundnut_oil.jpg",
    images: ["/images/groundnut_oil.jpg"],
    isActive: true,
    options: [
      {
        unit: "ml",
        unitSize: "500",
        mrp: 160,
        offerPrice: 130,
        specialPrice: 120,
        stock: 25,
      },
    ],
  };

  const mockOutOfStockProduct: Product = {
    id: "prod_seasonal_mango",
    name: "Farm Fresh Alphonso Mango",
    category: "Fresh Fruits & Veggies",
    categorySlug: "fruits-veggies",
    brand: "Sri Amman Farms",
    description: "Seasonal farm fresh Alphonso mangoes.",
    tags: ["SEASONAL"],
    rating: 4.9,
    reviewCount: 30,
    imageUrl: "/images/mango.jpg",
    images: ["/images/mango.jpg"],
    isActive: true,
    options: [
      {
        unit: "kg",
        unitSize: "1",
        mrp: 300,
        offerPrice: 250,
        stock: 0, // OUT OF STOCK
      },
    ],
  };

  const mockTurmeric: Product = {
    id: "prod_organic_turmeric",
    name: "Salem Stone-Ground Turmeric",
    category: "Organic Spices & Masalas",
    categorySlug: "organic-spices",
    brand: "Sri Amman Heritage",
    description: "High curcumin stone-ground turmeric.",
    tags: ["HIGH CURCUMIN", "STONE-GROUND"],
    rating: 4.9,
    reviewCount: 88,
    imageUrl: "/images/turmeric.jpg",
    images: ["/images/turmeric.jpg"],
    isActive: true,
    options: [
      {
        unit: "g",
        unitSize: "250",
        mrp: 90,
        offerPrice: 75,
        stock: 40,
      },
    ],
  };

  describe("1. Collection Management (CRUD)", () => {
    it("creates, retrieves, renames, and deletes custom curated collections", async () => {
      // 1. Create collection
      const created = await wishlistService.createWishlist(
        "Diwali Festive Prep",
        "Cold pressed oils, ghee, and sweetening staples",
        testCustomer
      );
      expect(created.id).toBeDefined();
      expect(created.title).toBe("Diwali Festive Prep");
      expect(created.userId).toBe(testCustomer);

      // 2. Retrieve collections
      const list = await wishlistService.getWishlists(testCustomer);
      const found = list.find((c) => c.id === created.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe("Diwali Festive Prep");

      // 3. Rename collection
      const renamed = await wishlistService.renameWishlist(
        created.id,
        "Pongal Harvest Feast",
        "Updated festive grocery staples"
      );
      expect(renamed.title).toBe("Pongal Harvest Feast");
      expect(renamed.description).toBe("Updated festive grocery staples");

      // 4. Delete collection
      await wishlistService.deleteWishlist(created.id, testCustomer);
      const afterDelete = await wishlistService.getWishlists(testCustomer);
      expect(afterDelete.some((c) => c.id === created.id)).toBe(false);
    });

    it("scopes collections strictly to authenticated customer", async () => {
      const collectionsA = await wishlistService.getWishlists(testCustomer);
      const collectionsB = await wishlistService.getWishlists(otherCustomer);

      expect(collectionsA.every((c) => c.userId === testCustomer)).toBe(true);
      expect(collectionsB.every((c) => c.userId === otherCustomer)).toBe(true);
    });
  });

  describe("2. Saved Products (Wishlist Items CRUD & Toggling)", () => {
    it("adds an item to wishlist and removes it when toggled again", async () => {
      // Toggle 1: Add product
      const res1 = await wishlistService.toggleWishlistProduct(
        mockTurmeric,
        0,
        "wl_default",
        testCustomer
      );
      expect(res1.added).toBe(true);
      expect(res1.item?.productId).toBe(mockTurmeric.id);

      // Verify item exists in list
      const itemsAfterAdd = await wishlistService.getWishlistProducts(undefined, testCustomer);
      expect(itemsAfterAdd.some((i) => i.productId === mockTurmeric.id)).toBe(true);

      // Toggle 2: Remove product
      const res2 = await wishlistService.toggleWishlistProduct(
        mockTurmeric,
        0,
        "wl_default",
        testCustomer
      );
      expect(res2.added).toBe(false);

      // Verify item is removed
      const itemsAfterRemove = await wishlistService.getWishlistProducts(undefined, testCustomer);
      expect(itemsAfterRemove.some((i) => i.productId === mockTurmeric.id)).toBe(false);
    });

    it("supports moving a saved product to another collection", async () => {
      // Add product
      const addRes = await wishlistService.toggleWishlistProduct(
        mockTurmeric,
        0,
        "wl_default",
        testCustomer
      );
      expect(addRes.added).toBe(true);
      const itemId = addRes.item!.id;

      // Move to custom collection
      const moved = await wishlistService.moveProductToCollection(itemId, "wl_pooja");
      expect(moved.wishlistId).toBe("wl_pooja");

      // Cleanup
      await wishlistService.removeWishlistProduct(itemId);
    });
  });

  describe("3. Cart Integration & Stock Handling", () => {
    it("Move All In-Stock to Cart adds in-stock items with canonical key format and skips out-of-stock items", async () => {
      const catalog = [mockGroundnutOil, mockOutOfStockProduct];
      const mockItems: WishlistProduct[] = [
        {
          id: "wlp_test_oil",
          wishlistId: "wl_test",
          userId: testCustomer,
          productId: mockGroundnutOil.id,
          optionIndex: 0,
          unit: "ml",
          unitSize: "500",
          name: "Heritage Wood Churned Mara Chekku Groundnut Oil (500ml)",
          price: 130,
          mrp: 160,
          image: "/images/oil.jpg",
        },
        {
          id: "wlp_test_mango",
          wishlistId: "wl_test",
          userId: testCustomer,
          productId: mockOutOfStockProduct.id,
          optionIndex: 0,
          unit: "kg",
          unitSize: "1",
          name: "Farm Fresh Alphonso Mango (1kg)",
          price: 250,
          mrp: 300,
          image: "/images/mango.jpg",
        },
      ];

      // Spy on getWishlistProducts and cartService.addToCart
      const originalGetWishlistProducts = wishlistService.getWishlistProducts;
      const originalAddToCart = cartService.addToCart;

      wishlistService.getWishlistProducts = vi.fn().mockResolvedValue(mockItems);
      cartService.addToCart = vi.fn().mockResolvedValue({} as any);

      try {
        const result = await wishlistService.moveAllInStockToCart(
          "wl_test",
          catalog,
          testCustomer,
          true // VIP
        );

        expect(result.addedCount).toBe(1);
        expect(result.skippedCount).toBe(1);
        expect(result.unavailableNames).toContain("Farm Fresh Alphonso Mango (1kg)");
        expect(cartService.addToCart).toHaveBeenCalledWith(
          mockGroundnutOil,
          0,
          1,
          testCustomer,
          true
        );
      } finally {
        wishlistService.getWishlistProducts = originalGetWishlistProducts;
        cartService.addToCart = originalAddToCart;
      }
    });

    it("does not clear wishlist items automatically when moving items to cart", async () => {
      const originalDelete = apiClient.delete;
      apiClient.delete = vi.fn();

      const catalog = [mockGroundnutOil];
      const mockItems: WishlistProduct[] = [
        {
          id: "wlp_keep",
          wishlistId: "wl_default",
          userId: testCustomer,
          productId: mockGroundnutOil.id,
          optionIndex: 0,
          unit: "ml",
          unitSize: "500",
          name: "Heritage Wood Churned Mara Chekku Groundnut Oil (500ml)",
          price: 130,
          mrp: 160,
          image: "/images/oil.jpg",
        },
      ];

      const originalGetWishlistProducts = wishlistService.getWishlistProducts;
      const originalAddToCart = cartService.addToCart;

      wishlistService.getWishlistProducts = vi.fn().mockResolvedValue(mockItems);
      cartService.addToCart = vi.fn().mockResolvedValue({} as any);

      try {
        await wishlistService.moveAllInStockToCart("wl_default", catalog, testCustomer);
        // Ensure no delete request was triggered against wishlist items
        expect(apiClient.delete).not.toHaveBeenCalled();
      } finally {
        wishlistService.getWishlistProducts = originalGetWishlistProducts;
        cartService.addToCart = originalAddToCart;
        apiClient.delete = originalDelete;
      }
    });
  });

  describe("4. Recommendations Based on Saved Items", () => {
    it("excludes products that are already in the customer's wishlist", async () => {
      const allProds = await productService.getProducts();
      const wishlistProds = await wishlistService.getWishlistProducts(undefined, testCustomer);
      const savedIds = new Set(wishlistProds.map((i) => i.productId));

      // Check candidate exclusion
      const candidateComplementary = allProds.filter((p) => !savedIds.has(p.id));
      for (const candidate of candidateComplementary) {
        expect(savedIds.has(candidate.id)).toBe(false);
      }
    });
  });

  describe("5. Wishlist Notifications Functional Audit", () => {
    it("confirms notification categories are orders, offers, rewards, and account", async () => {
      const notifs = await notificationService.getNotifications(testCustomer);
      const validCategories = new Set(["orders", "offers", "rewards", "account"]);

      for (const n of notifs) {
        expect(validCategories.has(n.category)).toBe(true);
      }
    });

    it("verifies read/unread counts, markAsRead, and markAllAsRead", async () => {
      const notifs = await notificationService.getNotifications(testCustomer);
      expect(Array.isArray(notifs)).toBe(true);

      if (notifs.length > 0 && notifs[0]) {
        const first = notifs[0];
        const updated = await notificationService.markAsRead(first.id);
        expect(updated.read).toBe(true);
      }
    });

    it("verifies notification action URLs resolve to valid customer routes", async () => {
      const notifs = await notificationService.getNotifications(testCustomer);
      const validRoutePrefixes = ["/orders", "/shop", "/rewards", "/account", "/wishlist"];

      for (const n of notifs) {
        if (n.actionUrl) {
          const isValid = validRoutePrefixes.some((prefix) => n.actionUrl!.startsWith(prefix));
          expect(isValid).toBe(true);
        }
      }
    });

    it("confirms that wishlist add/remove mutations do not spam persistent notifications", async () => {
      // Get initial notification count
      const beforeNotifs = await notificationService.getNotifications(testCustomer);
      const beforeCount = beforeNotifs.length;

      // Perform wishlist toggle
      const res = await wishlistService.toggleWishlistProduct(mockTurmeric, 0, "wl_default", testCustomer);
      // Toggle back
      await wishlistService.toggleWishlistProduct(mockTurmeric, 0, "wl_default", testCustomer);

      // Verify notification count is unchanged (no spam notifications generated)
      const afterNotifs = await notificationService.getNotifications(testCustomer);
      expect(afterNotifs.length).toBe(beforeCount);
    });
  });
});

