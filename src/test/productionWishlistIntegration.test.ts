import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { wishlistService } from "../services/wishlistService";
import { authManager } from "../services/authAdapter";
import {
  productionWishlistReader,
  setProductionWishlistReaderOverride,
  normalizeLegacyWishlist,
  normalizeLegacyWishlistProduct,
} from "../services/productionWishlistReader";
import { apiClient } from "../services/apiClient";
import { StorageAdapterError } from "../services/firestoreAdapter";
import type { Wishlist, WishlistProduct, Product } from "../types";

describe("Phase 4B-3A: Production Read-Only Wishlist Integration", () => {
  beforeEach(() => {
    authManager.resetMode();
    setProductionWishlistReaderOverride(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    authManager.resetMode();
    setProductionWishlistReaderOverride(null);
    vi.restoreAllMocks();
  });

  describe("1. Environment-Aware Service Routing", () => {
    it("routes getWishlists and getWishlistProducts to productionWishlistReader in production auth mode", async () => {
      authManager.setMode("production");
      expect(authManager.getMode()).toBe("production");

      const mockWishlists: Wishlist[] = [
        {
          id: "wl_staples",
          userId: "SASS0000104",
          title: "Monthly Staples",
          description: "Cold-pressed oils and grains",
          createdAt: "2026-03-01T10:00:00Z",
        },
      ];

      const mockProducts: WishlistProduct[] = [
        {
          id: "prod-oil_1L",
          wishlistId: "wl_staples",
          userId: "SASS0000104",
          productId: "prod-oil",
          optionIndex: 0,
          unit: "L",
          unitSize: "1",
          name: "Wood Pressed Sesame Oil (1L)",
          price: 360,
          mrp: 420,
          image: "https://example.com/oil.jpg",
        },
      ];

      const wishlistsSpy = vi.fn().mockResolvedValue(mockWishlists);
      const productsSpy = vi.fn().mockResolvedValue(mockProducts);

      setProductionWishlistReaderOverride({
        getCustomerWishlists: wishlistsSpy,
        getCustomerWishlistProducts: productsSpy,
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      const wishlistsResult = await wishlistService.getWishlists("SASS0000104");
      const productsResult = await wishlistService.getWishlistProducts("wl_staples", "SASS0000104");

      expect(wishlistsSpy).toHaveBeenCalledTimes(1);
      expect(wishlistsSpy).toHaveBeenCalledWith("SASS0000104");
      expect(productsSpy).toHaveBeenCalledTimes(1);
      expect(productsSpy).toHaveBeenCalledWith("SASS0000104", "wl_staples");
      expect(apiGetSpy).not.toHaveBeenCalled();

      expect(wishlistsResult).toEqual(mockWishlists);
      expect(productsResult).toEqual(mockProducts);
    });

    it("preserves local apiClient routing in emulator mode", async () => {
      authManager.setMode("emulator");
      expect(authManager.getMode()).toBe("emulator");

      const mockEmulatorWishlists: Wishlist[] = [
        {
          id: "wl_emu_1",
          userId: "SASS0000104",
          title: "Emulator Wishlist",
          description: "Local test collection",
          createdAt: "2026-03-01T10:00:00Z",
        },
      ];

      const apiGetSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockEmulatorWishlists);
      const prodSpy = vi.fn();
      setProductionWishlistReaderOverride({ getCustomerWishlists: prodSpy });

      const result = await wishlistService.getWishlists("SASS0000104");

      expect(apiGetSpy).toHaveBeenCalledWith("/wishlists", { userId: "SASS0000104" });
      expect(prodSpy).not.toHaveBeenCalled();
      expect(result).toEqual(mockEmulatorWishlists);
    });

    it("preserves local apiClient routing in mock mode", async () => {
      authManager.setMode("mock");
      expect(authManager.getMode()).toBe("mock");

      const mockProducts: WishlistProduct[] = [
        {
          id: "wlp_mock_1",
          wishlistId: "wl_default",
          userId: "guest_session",
          productId: "prod_mock",
          optionIndex: 0,
          unit: "kg",
          unitSize: "1",
          name: "Mock Ponni Rice (1kg)",
          price: 75,
          mrp: 85,
          image: "https://example.com/rice.jpg",
        },
      ];

      const apiGetSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockProducts);
      const prodSpy = vi.fn();
      setProductionWishlistReaderOverride({ getCustomerWishlistProducts: prodSpy });

      const result = await wishlistService.getWishlistProducts("wl_default", "guest_session");

      expect(apiGetSpy).toHaveBeenCalledWith("/wishlistProducts", {
        userId: "guest_session",
        wishlistId: "wl_default",
      });
      expect(prodSpy).not.toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });
  });

  describe("2. Customer ID Guard & Canonical SASS ID Validation", () => {
    it("returns empty arrays immediately for missing or blank customer ID without calling reader or API", async () => {
      authManager.setMode("production");

      const readerSpy = vi.fn();
      setProductionWishlistReaderOverride({
        getCustomerWishlists: readerSpy,
        getCustomerWishlistProducts: readerSpy,
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      // Undefined customer ID
      const res1 = await wishlistService.getWishlists(undefined);
      const res2 = await wishlistService.getWishlistProducts(undefined, undefined);

      // Blank string customer ID
      const res3 = await wishlistService.getWishlists("");
      const res4 = await wishlistService.getWishlistProducts(undefined, "   ");

      expect(res1).toEqual([]);
      expect(res2).toEqual([]);
      expect(res3).toEqual([]);
      expect(res4).toEqual([]);

      expect(readerSpy).not.toHaveBeenCalled();
      expect(apiGetSpy).not.toHaveBeenCalled();
    });

    it("rejects non-canonical customer identifiers in production reader with 400 StorageAdapterError", async () => {
      expect(() => productionWishlistReader.assertValidCustomer("invalid_guest_id")).toThrowError(
        StorageAdapterError
      );
      expect(() => productionWishlistReader.assertValidCustomer("uid-firebase-12345")).toThrowError(
        /Production customer operations require a canonical SASS customer ID/
      );
      expect(() => productionWishlistReader.assertValidCustomer("")).toThrowError(StorageAdapterError);

      // Valid SASS IDs succeed
      expect(productionWishlistReader.assertValidCustomer("SASS0000104")).toBe("SASS0000104");
      expect(productionWishlistReader.assertValidCustomer("SASS0000001")).toBe("SASS0000001");
    });
  });

  describe("3. Document Normalization & Schema Reconciliation", () => {
    it("correctly normalizes legacy wishlist container documents", () => {
      const docData = {
        name: "Festive Oil Pantry",
        description: "Cold pressed oils for Deepavali",
        createdAt: "2026-10-15T09:30:00Z",
      };

      const normalized = normalizeLegacyWishlist("wl_festive_01", docData, "SASS0000104");

      expect(normalized).toEqual({
        id: "wl_festive_01",
        userId: "SASS0000104",
        title: "Festive Oil Pantry",
        description: "Cold pressed oils for Deepavali",
        createdAt: "2026-10-15T09:30:00Z",
      });
    });

    it("normalizes legacy wishlist product with live catalogue match", () => {
      const mockCatalogue = [
        {
          id: "prod-gingelly-oil",
          name: "Wood Pressed Gingelly Oil",
          category: "Cold Pressed Oils",
          imageUrl: "https://example.com/gingelly.jpg",
          rating: 4.8,
          reviewCount: 32,
          options: [
            {
              unit: "ml",
              unitSize: "500",
              offerPrice: 195,
              mrp: 230,
              stock: 45,
            },
            {
              unit: "L",
              unitSize: "1",
              offerPrice: 380,
              mrp: 440,
              specialPrice: 360,
              stock: 30,
            },
          ],
        },
      ] as unknown as Product[];

      const docData = {
        productId: "prod-gingelly-oil",
        unit: "L",
        unitSize: "1",
        sellingPrice: 375, // Old saved snapshot
        mrp: 430,
      };

      const normalized = normalizeLegacyWishlistProduct(
        "prod-gingelly-oil_L_1",
        docData,
        "SASS0000104",
        "wl_default",
        mockCatalogue
      );

      expect(normalized.id).toBe("prod-gingelly-oil_L_1");
      expect(normalized.wishlistId).toBe("wl_default");
      expect(normalized.userId).toBe("SASS0000104");
      expect(normalized.productId).toBe("prod-gingelly-oil");
      expect(normalized.optionIndex).toBe(1); // Matched 1L option
      expect(normalized.unit).toBe("L");
      expect(normalized.unitSize).toBe("1");
      expect(normalized.name).toBe("Wood Pressed Gingelly Oil (1L)");
      expect(normalized.price).toBe(380); // Live catalogue offerPrice preferred
      expect(normalized.mrp).toBe(440); // Live catalogue mrp preferred
      expect(normalized.specialPrice).toBe(360);
      expect(normalized.image).toBe("https://example.com/gingelly.jpg");
    });

    it("gracefully falls back to stored document fields if product is absent from catalogue", () => {
      const emptyCatalogue: Product[] = [];

      const docData = {
        productId: "prod-archived-masala",
        name: "Vintage Sambar Powder",
        unit: "g",
        unitSize: "250",
        price: 90,
        mrp: 110,
        specialPrice: 85,
        imageUrl: "https://example.com/masala.jpg",
      };

      const normalized = normalizeLegacyWishlistProduct(
        "prod-archived-masala_g_250",
        docData,
        "SASS0000104",
        "wl_staples",
        emptyCatalogue
      );

      expect(normalized.productId).toBe("prod-archived-masala");
      expect(normalized.name).toBe("Vintage Sambar Powder");
      expect(normalized.unit).toBe("g");
      expect(normalized.unitSize).toBe("250");
      expect(normalized.price).toBe(90);
      expect(normalized.mrp).toBe(110);
      expect(normalized.specialPrice).toBe(85);
      expect(normalized.image).toBe("https://example.com/masala.jpg");
    });

    it("extracts productId from docId if productId field is missing in legacy doc", () => {
      const docData = {
        name: "Turmeric Powder",
        unit: "g",
        unitSize: "100",
        sellingPrice: 40,
        mrp: 50,
      };

      const normalized = normalizeLegacyWishlistProduct(
        "prod-turmeric-raw_g_100",
        docData,
        "SASS0000104",
        "wl_default",
        []
      );

      expect(normalized.productId).toBe("prod-turmeric-raw");
      expect(normalized.name).toBe("Turmeric Powder");
      expect(normalized.price).toBe(40);
    });
  });

  describe("4. Active Wishlist Mutations in Production Mode", () => {
    beforeEach(() => {
      authManager.setMode("production");
    });

    it("allows createWishlist in production mode", async () => {
      const res = await wishlistService.createWishlist("New Folder", "Description", "SASS0000104");
      expect(res).toBeDefined();
      expect(res.title).toBe("New Folder");
    });

    it("allows renameWishlist in production mode", async () => {
      const created = await wishlistService.createWishlist("To Rename", "Desc", "SASS0000104");
      const res = await wishlistService.renameWishlist(created.id, "Updated Name");
      expect(res).toBeDefined();
    });

    it("allows deleteWishlist in production mode", async () => {
      const created = await wishlistService.createWishlist("To Delete", "Desc", "SASS0000104");
      await expect(
        wishlistService.deleteWishlist(created.id, "SASS0000104")
      ).resolves.not.toThrow();
    });

    it("allows toggleWishlistProduct in production mode", async () => {
      const dummyProd = {
        id: "prod-test",
        name: "Test Item",
        category: "Test",
        imageUrl: "",
        rating: 5,
        reviewCount: 1,
        options: [{ unit: "kg", unitSize: "1", offerPrice: 100, mrp: 120, stock: 10 }],
      } as unknown as Product;

      const res = await wishlistService.toggleWishlistProduct(dummyProd, 0, "wl_default", "SASS0000104");
      expect(res).toBeDefined();
      expect(res.added).toBe(true);
    });

    it("allows removeWishlistProduct in production mode", async () => {
      await expect(
        wishlistService.removeWishlistProduct("item_123")
      ).resolves.not.toThrow();
    });

    it("allows moveProductToCollection in production mode", async () => {
      const dummyProd = {
        id: "prod-test-move",
        name: "Test Move Item",
        category: "Test",
        imageUrl: "",
        rating: 5,
        reviewCount: 1,
        options: [{ unit: "kg", unitSize: "1", offerPrice: 100, mrp: 120, stock: 10 }],
      } as unknown as Product;

      const res = await wishlistService.toggleWishlistProduct(dummyProd, 0, "wl_default", "SASS0000104");
      if (res.item) {
        await expect(
          wishlistService.moveProductToCollection(res.item.id, "wl_target")
        ).resolves.not.toThrow();
      }
    });
  });

  describe("5. Local Emulator & Mock Mutation Functionality", () => {
    it("allows creating and deleting collections in emulator mode", async () => {
      authManager.setMode("emulator");

      const mockCreated: Wishlist = {
        id: "wl_new_1",
        userId: "SASS0000104",
        title: "Test Collection",
        description: "Testing",
        createdAt: new Date().toISOString(),
      };

      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockCreated);
      const delSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({});
      vi.spyOn(apiClient, "get").mockResolvedValue([]);

      const created = await wishlistService.createWishlist("Test Collection", "Testing", "SASS0000104");
      expect(postSpy).toHaveBeenCalledWith("/wishlists", expect.objectContaining({ title: "Test Collection" }));
      expect(created.id).toBe("wl_new_1");

      await wishlistService.deleteWishlist("wl_new_1", "SASS0000104");
      expect(delSpy).toHaveBeenCalledWith("/wishlists/wl_new_1");
    });

    it("allows toggling wishlist products in mock mode", async () => {
      authManager.setMode("mock");

      const dummyProd = {
        id: "prod-mock-card",
        name: "Cold-Pressed Groundnut Oil",
        category: "Oils",
        imageUrl: "https://example.com/gnut.jpg",
        rating: 4.9,
        reviewCount: 40,
        options: [{ unit: "L", unitSize: "1", offerPrice: 280, mrp: 320, stock: 15 }],
      } as unknown as Product;

      vi.spyOn(apiClient, "get").mockResolvedValue([]);
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue({
        id: "wlp_new",
        wishlistId: "wl_default",
        userId: "guest_session",
        productId: dummyProd.id,
        optionIndex: 0,
        unit: "L",
        unitSize: "1",
        name: "Cold-Pressed Groundnut Oil (1L)",
        price: 280,
        mrp: 320,
        image: dummyProd.imageUrl,
      });

      const res = await wishlistService.toggleWishlistProduct(dummyProd, 0, "wl_default", "guest_session");
      expect(res.added).toBe(true);
      expect(postSpy).toHaveBeenCalledWith("/wishlistProducts", expect.objectContaining({ productId: dummyProd.id }));
    });
  });

  describe("6. Error Propagation (No Silent Fallback to Mock Data)", () => {
    it("propagates StorageAdapterError when production Firestore wishlist read fails", async () => {
      authManager.setMode("production");

      setProductionWishlistReaderOverride({
        getCustomerWishlists: vi.fn().mockRejectedValue(
          new StorageAdapterError("Permission denied: insufficient Firestore security rules", {
            status: 403,
            code: "permission-denied",
            category: "permission",
          })
        ),
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      await expect(wishlistService.getWishlists("SASS0000104")).rejects.toThrowError(
        /Permission denied/
      );

      // Verify that apiClient was NEVER called as a silent fallback
      expect(apiGetSpy).not.toHaveBeenCalled();
    });
  });
});

