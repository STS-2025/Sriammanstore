import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  normalizeLegacyProduct,
  normalizeLegacyProductList,
  normalizeLegacyProductOption,
  extractNestedCategoryProducts,
  parseStrictNumber,
  deriveCategorySlug,
} from "../services/legacySchemaMapper";
import {
  FirestoreAdapter,
  InMemoryFirestoreDriver,
  StorageAdapterError,
} from "../services/firestoreAdapter";
import { productService } from "../services/productService";
import { apiClient } from "../services/apiClient";
import type { Product } from "../types";

describe("Legacy Product Schema Compatibility (legacySchemaMapper)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Legacy product with variants[]", () => {
    it("normalizes Admin Panel product documents using variants[] with sellingPrice, weight, and combined unit names", () => {
      const legacyAdminDoc = {
        id: "legacy_oil_01",
        productName: "Wood Pressed Coconut Oil",
        nameTamil: "மரச்செக்கு தேங்காய் எண்ணெய்",
        brandName: "Sri Amman Traditional",
        categoryName: "Cold Pressed Oils",
        desc: "Pure Pollachi copra wood-pressed oil.",
        frontImageUrl: "https://cdn.example.com/coconut-front.jpg",
        backImageUrl: "https://cdn.example.com/coconut-back.jpg",
        rating: 4.8,
        ratingCount: 312,
        variants: [
          {
            name: "500ml",
            sellingPrice: 145,
            mrp: 170,
            vipPrice: 135,
            stock: 28,
          },
          {
            weight: 1,
            unit: "L",
            price: 280,
            originalPrice: 330,
            memberPrice: 265,
            availableStock: 14,
          },
        ],
      };

      const result = normalizeLegacyProduct(legacyAdminDoc);
      expect(result).not.toBeNull();
      expect(result).toEqual({
        id: "legacy_oil_01",
        name: "Wood Pressed Coconut Oil",
        tamilName: "மரச்செக்கு தேங்காய் எண்ணெய்",
        category: "Cold Pressed Oils",
        categorySlug: "cold-pressed-oils",
        brand: "Sri Amman Traditional",
        rating: 4.8,
        reviewCount: 312,
        description: "Pure Pollachi copra wood-pressed oil.",
        imageUrl: "https://cdn.example.com/coconut-front.jpg",
        images: [
          "https://cdn.example.com/coconut-front.jpg",
          "https://cdn.example.com/coconut-back.jpg",
        ],
        options: [
          {
            unit: "ml",
            unitSize: "500",
            mrp: 170,
            offerPrice: 145,
            specialPrice: 135,
            stock: 28,
          },
          {
            unit: "L",
            unitSize: "1",
            mrp: 330,
            offerPrice: 280,
            specialPrice: 265,
            stock: 14,
          },
        ],
        tags: [],
        isActive: true,
      });
    });
  });

  describe("2. Product using options[]", () => {
    it("normalizes legacy and hybrid documents using options[] with legacy price/stock aliases", () => {
      const legacyOptionsDoc = {
        productId: "legacy_rice_02",
        name: "Seeraga Samba Rice",
        category: "Rice & Grains",
        brand: "Cauvery Delta",
        description: "Aromatic biriyani rice",
        imageUrl: "https://cdn.example.com/samba.jpg",
        options: [
          {
            unit: "kg",
            unitSize: 1,
            sellingPrice: 115,
            mrp12: 140,
            quantity: 60,
          },
          {
            unit: "5 kg",
            price: 550,
            originalPrice: 680,
            stock: 20,
          },
        ],
      };

      const result = normalizeLegacyProduct(legacyOptionsDoc);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("legacy_rice_02");
      expect(result?.categorySlug).toBe("staples-grains");
      expect(result?.options).toEqual([
        {
          unit: "kg",
          unitSize: "1",
          mrp: 140,
          offerPrice: 115,
          stock: 60,
        },
        {
          unit: "kg",
          unitSize: "5",
          mrp: 680,
          offerPrice: 550,
          stock: 20,
        },
      ]);
    });
  });

  describe("3. Alternative product field aliases", () => {
    it("maps sku, title, details, Origin, extractionMethod, nutritionalInfo, averageRating, and comma-separated keywords", () => {
      const aliasDoc = {
        sku: "SKU-TURMERIC-500",
        title: "Erode Finger Turmeric",
        nameTamil: "ஈரோடு விரலி மஞ்சள்",
        brandName: "Erode Spice Co",
        categoryName: "Spices & Masalas",
        details: "Sun-dried high curcumin turmeric fingers.",
        image: "https://cdn.example.com/turmeric.jpg",
        averageRating: "4.6",
        reviewsCount: "85",
        Origin: "Erode, Tamil Nadu",
        extractionMethod: "Sun Dried & Stone Ground",
        keywords: "Curcumin, Immunity, Traditional",
        status: "inactive",
        nutritionalInfo: {
          curcumin: "5.5%",
          energyKcal: 312,
        },
        variants: [
          {
            label: "Pack of 6",
            sellingPrice: 90,
            mrp: 110,
            stock: 15,
          },
        ],
      };

      const result = normalizeLegacyProduct(aliasDoc);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("SKU-TURMERIC-500");
      expect(result?.name).toBe("Erode Finger Turmeric");
      expect(result?.tamilName).toBe("ஈரோடு விரலி மஞ்சள்");
      expect(result?.brand).toBe("Erode Spice Co");
      expect(result?.category).toBe("Spices & Masalas");
      expect(result?.categorySlug).toBe("organic-spices");
      expect(result?.description).toBe(
        "Sun-dried high curcumin turmeric fingers."
      );
      expect(result?.rating).toBe(4.6);
      expect(result?.reviewCount).toBe(85);
      expect(result?.origin).toBe("Erode, Tamil Nadu");
      expect(result?.extraction).toBe("Sun Dried & Stone Ground");
      expect(result?.tags).toEqual(["Curcumin", "Immunity", "Traditional"]);
      expect(result?.isActive).toBe(false);
      expect(result?.nutrition).toEqual({
        curcumin: "5.5%",
        energyKcal: "312",
      });
      expect(result?.options[0]).toEqual({
        unit: "pcs",
        unitSize: "6",
        mrp: 110,
        offerPrice: 90,
        stock: 15,
      });
    });
  });

  describe("4. Missing and multiple image fields", () => {
    it("deduplicates and orders imageUrl, frontImageUrl, backImageUrl, images[], imageUrls[], and variant images", () => {
      const multiImageDoc = {
        id: "img_test_1",
        name: "Multi Image Product",
        frontImageUrl: "https://cdn.example.com/front.jpg",
        backImageUrl: "https://cdn.example.com/back.jpg",
        imageUrls: [
          "https://cdn.example.com/gallery1.jpg",
          "https://cdn.example.com/front.jpg", // duplicate
          "   ", // blank
        ],
        variants: [
          {
            name: "250g",
            sellingPrice: 60,
            stock: 5,
            imageUrl: "https://cdn.example.com/variant-250g.jpg",
          },
        ],
      };

      const result = normalizeLegacyProduct(multiImageDoc);
      expect(result?.imageUrl).toBe("https://cdn.example.com/front.jpg");
      expect(result?.images).toEqual([
        "https://cdn.example.com/front.jpg",
        "https://cdn.example.com/gallery1.jpg",
        "https://cdn.example.com/back.jpg",
        "https://cdn.example.com/variant-250g.jpg",
      ]);
    });

    it("never invents placeholder URLs when all image fields are missing or invalid", () => {
      const noImageDoc = {
        id: "img_test_none",
        name: "No Image Product",
        imageUrl: "   ",
        images: [null, 123, ""],
        variants: [{ name: "1kg", sellingPrice: 100, stock: 10 }],
      };

      const result = normalizeLegacyProduct(noImageDoc);
      expect(result).not.toBeNull();
      expect(result?.imageUrl).toBe("");
      expect(result?.images).toEqual([]);
    });
  });

  describe("5. Numeric strings and invalid price values", () => {
    it("accepts unambiguous numeric strings and rejects malformed, currency-prefixed, zero, or negative prices", () => {
      expect(parseStrictNumber("130")).toBe(130);
      expect(parseStrictNumber(" 160.50 ")).toBe(160.5);
      expect(parseStrictNumber("₹130")).toBeNull();
      expect(parseStrictNumber("130abc")).toBeNull();
      expect(parseStrictNumber("")).toBeNull();
      expect(parseStrictNumber(NaN)).toBeNull();
      expect(parseStrictNumber(Infinity)).toBeNull();
      expect(parseStrictNumber(true)).toBeNull();

      const mixedPricesDoc = {
        id: "price_validation_1",
        name: "Price Validation Item",
        variants: [
          {
            unit: "g",
            unitSize: "250",
            sellingPrice: "125.50",
            mrp: "150",
            specialPrice: "115",
            stock: "20",
          },
          {
            // Invalid currency string price -> rejected
            unit: "g",
            unitSize: "500",
            sellingPrice: "₹240",
            mrp: 280,
            stock: 10,
          },
          {
            // Zero selling price -> rejected
            unit: "kg",
            unitSize: "1",
            sellingPrice: 0,
            mrp: 500,
            stock: 10,
          },
          {
            // Negative selling price -> rejected
            unit: "kg",
            unitSize: "2",
            sellingPrice: -90,
            mrp: 200,
            stock: 10,
          },
        ],
      };

      const result = normalizeLegacyProduct(mixedPricesDoc);
      expect(result).not.toBeNull();
      expect(result?.options).toHaveLength(1);
      expect(result?.options[0]).toEqual({
        unit: "g",
        unitSize: "250",
        mrp: 150,
        offerPrice: 125.5,
        specialPrice: 115,
        stock: 20,
      });
    });

    it("clamps mrp to offerPrice when mrp is missing, malformed, or lower than offerPrice", () => {
      const optMissingMrp = normalizeLegacyProductOption({
        name: "500g",
        sellingPrice: 140,
        mrp: "invalid",
        stock: 5,
      });
      expect(optMissingMrp?.mrp).toBe(140);
      expect(optMissingMrp?.offerPrice).toBe(140);

      const optLowerMrp = normalizeLegacyProductOption({
        name: "500g",
        sellingPrice: 140,
        mrp: 100,
        stock: 5,
      });
      expect(optLowerMrp?.mrp).toBe(140);
    });
  });

  describe("6. Missing, zero, and invalid stock values", () => {
    it("preserves explicit 0 stock, respects outOfStock/inStock flags, and defaults missing or invalid stock to 0 without inventing positive stock", () => {
      const stockDoc = {
        id: "stock_test_1",
        name: "Stock Handling Item",
        variants: [
          { name: "100g", sellingPrice: 50, stock: 0 },
          { name: "200g", sellingPrice: 90, stock: "0" },
          { name: "300g", sellingPrice: 130 }, // missing stock -> 0 (never invent 10)
          { name: "400g", sellingPrice: 170, stock: -5 }, // negative -> 0
          { name: "500g", sellingPrice: 210, stock: "many" }, // malformed -> 0
          { name: "600g", sellingPrice: 250, stock: 25, outOfStock: true }, // outOfStock flag -> 0
          { name: "700g", sellingPrice: 290, stock: 30, inStock: false }, // inStock: false -> 0
          { name: "800g", sellingPrice: 320, availableStock: "12" }, // valid numeric string -> 12
        ],
      };

      const result = normalizeLegacyProduct(stockDoc);
      expect(result).not.toBeNull();
      expect(result?.options.map((o) => o.stock)).toEqual([
        0, 0, 0, 0, 0, 0, 0, 12,
      ]);
    });
  });

  describe("7. Special/VIP pricing and offer metadata", () => {
    it("normalizes offerZone, showOfferBand, optionOfferPrices, discountPercent, offerBadgeText, and VIP prices without inventing eligibility", () => {
      const offerZoneDoc = {
        id: "offer_zone_1",
        productName: "Festival Offer Gingelly Oil",
        categoryName: "Cold Pressed Oils",
        offerZone: true,
        discountPercent: 20,
        optionOfferPrices: [
          { unit: "ml", unitSize: "500", offerPrice: 160, discountPercent: 20 },
          { unit: "L", unitSize: "1", offerPrice: 310, discountPercent: 22 },
        ],
        variants: [
          {
            unit: "ml",
            weight: 500,
            sellingPrice: 185,
            mrp: 200,
            vipPrice: 150,
            stock: 30,
          },
          {
            unit: "L",
            weight: 1,
            sellingPrice: 360,
            mrp: 400,
            specialPrice: 0, // invalid 0 VIP price must be omitted
            stock: 15,
          },
        ],
      };

      const result = normalizeLegacyProduct(offerZoneDoc);
      expect(result).not.toBeNull();
      expect(result?.isFlashDeal).toBe(true);
      expect(result?.flashDiscount).toBe("20% OFF");
      expect(result?.options).toEqual([
        {
          unit: "ml",
          unitSize: "500",
          mrp: 200,
          offerPrice: 160, // overridden by optionOfferPrices because offerZone is true
          specialPrice: 150,
          stock: 30,
        },
        {
          unit: "L",
          unitSize: "1",
          mrp: 400,
          offerPrice: 310,
          // specialPrice omitted because 0 is not a valid positive VIP price
          stock: 15,
        },
      ]);
      expect("specialPrice" in (result?.options[1] ?? {})).toBe(false);
    });

    it("ignores optionOfferPrices when offerZone and showOfferBand are both false/absent", () => {
      const inactiveOfferDoc = {
        id: "offer_inactive_1",
        name: "Regular Groundnut Oil",
        offerZone: false,
        optionOfferPrices: [{ offerPrice: 99 }],
        variants: [
          {
            name: "500ml",
            sellingPrice: 150,
            mrp: 170,
            stock: 10,
          },
        ],
      };

      const result = normalizeLegacyProduct(inactiveOfferDoc);
      expect(result?.isFlashDeal).toBe(false);
      expect(result?.options[0]?.offerPrice).toBe(150);
    });
  });

  describe("8. Conflicting aliases and documented precedence", () => {
    it("enforces deterministic field precedence when both primary and legacy alias fields exist", () => {
      const conflictingDoc = {
        id: "primary_id",
        productId: "secondary_product_id",
        sku: "tertiary_sku",
        name: "Primary Name",
        productName: "Legacy Product Name",
        title: "Fallback Title",
        tamilName: "முதன்மை பெயர்",
        nameTamil: "பழைய பெயர்",
        brand: "Primary Brand",
        brandName: "Legacy Brand",
        category: "Organic Spices",
        categoryName: "Beverages",
        description: "Primary Description",
        desc: "Legacy Desc",
        details: "Legacy Details",
        imageUrl: "https://cdn.example.com/primary.jpg",
        frontImageUrl: "https://cdn.example.com/front.jpg",
        isFlashDeal: false,
        offerZone: true,
        flashDiscount: "15% OFF",
        offerBadgeText: "30% OFF",
        options: [
          {
            unit: "g",
            unitSize: "250",
            offerPrice: 80,
            sellingPrice: 95,
            price: 100,
            mrp: 120,
            originalPrice: 130,
            mrp12: 140,
            specialPrice: 72,
            vipPrice: 75,
            memberPrice: 78,
            stock: 12,
            availableStock: 50,
            quantity: 99,
          },
        ],
        variants: [
          {
            name: "1kg",
            sellingPrice: 300,
            mrp: 350,
            stock: 5,
          },
        ],
      };

      const result = normalizeLegacyProduct(conflictingDoc);
      expect(result).not.toBeNull();
      expect(result?.id).toBe("primary_id");
      expect(result?.name).toBe("Primary Name");
      expect(result?.tamilName).toBe("முதன்மை பெயர்");
      expect(result?.brand).toBe("Primary Brand");
      expect(result?.category).toBe("Organic Spices");
      expect(result?.categorySlug).toBe("organic-spices");
      expect(result?.description).toBe("Primary Description");
      expect(result?.imageUrl).toBe("https://cdn.example.com/primary.jpg");
      expect(result?.isFlashDeal).toBe(false);
      expect(result?.flashDiscount).toBe("15% OFF");
      // options[] takes precedence over variants[]
      expect(result?.options).toHaveLength(1);
      expect(result?.options[0]).toEqual({
        unit: "g",
        unitSize: "250",
        offerPrice: 80,
        mrp: 120,
        specialPrice: 72,
        stock: 12,
      });
    });
  });

  describe("9. Empty or malformed variants", () => {
    it("returns null when a product has no usable variants/options and filters it out of product lists", () => {
      const emptyVariantsDoc = {
        id: "broken_prod_1",
        name: "Broken Product With Empty Variants",
        variants: [],
      };
      const malformedVariantsDoc = {
        id: "broken_prod_2",
        name: "Broken Product With Price-less Variants",
        variants: [
          { name: "500g", sellingPrice: null },
          { unit: "kg", unitSize: "", sellingPrice: 100 },
          null,
          "invalid_variant",
        ],
      };
      const validDoc = {
        id: "valid_prod_3",
        name: "Valid Product",
        variants: [{ name: "500g", sellingPrice: 85, mrp: 100, stock: 8 }],
      };

      expect(normalizeLegacyProduct(emptyVariantsDoc)).toBeNull();
      expect(normalizeLegacyProduct(malformedVariantsDoc)).toBeNull();
      expect(normalizeLegacyProduct(null)).toBeNull();
      expect(normalizeLegacyProduct("not-an-object")).toBeNull();

      const list = normalizeLegacyProductList([
        emptyVariantsDoc,
        malformedVariantsDoc,
        validDoc,
        null,
      ]);
      expect(list).toHaveLength(1);
      expect(list[0]?.id).toBe("valid_prod_3");
    });

    it("supports flat single-option legacy documents only when both unit/size and positive price exist on root", () => {
      const flatLegacyDoc = {
        id: "flat_coconut_1",
        productName: "Pollachi Tender Coconut",
        categoryName: "Beverages",
        unit: "1 pcs",
        sellingPrice: 45,
        mrp: 55,
        stock: 30,
      };

      const normalized = normalizeLegacyProduct(flatLegacyDoc);
      expect(normalized).not.toBeNull();
      expect(normalized?.options).toEqual([
        {
          unit: "pcs",
          unitSize: "1",
          mrp: 55,
          offerPrice: 45,
          stock: 30,
        },
      ]);
    });
  });

  describe("10. Nested product documents after retrieval (products/{category}/items/{productId})", () => {
    it("normalizes nested product documents using documentPath or parentCategory context", () => {
      const nestedSubcollectionDoc = {
        productName: "Karupatti Palm Jaggery",
        nameTamil: "உடன்குடி கருப்பட்டி",
        sellingPrice: 190,
        mrp: 220,
        options: [
          {
            unit: "g",
            unitSize: "500",
            sellingPrice: 190,
            mrp: 220,
            stock: 25,
          },
        ],
      };

      const fromPath = normalizeLegacyProduct(nestedSubcollectionDoc, {
        documentPath: "products/Snacks & Sweets/items/nested_karupatti_01",
      });

      expect(fromPath).not.toBeNull();
      expect(fromPath?.id).toBe("nested_karupatti_01");
      expect(fromPath?.category).toBe("Snacks & Sweets");
      expect(fromPath?.categorySlug).toBe("snacks-sweets");
      expect(fromPath?.options[0]?.offerPrice).toBe(190);
    });

    it("extracts nested items from a category container document (items array or map)", () => {
      const categoryContainerWithMap = {
        id: "Cold Pressed Oils",
        items: {
          nested_sesame_1: {
            productName: "Chekku Nallennai",
            variants: [{ name: "1L", sellingPrice: 340, mrp: 400, stock: 18 }],
          },
          nested_castor_2: {
            productName: "Pure Castor Oil",
            variants: [
              { name: "250ml", sellingPrice: 95, mrp: 110, stock: 12 },
            ],
          },
        },
      };

      const extracted = extractNestedCategoryProducts(categoryContainerWithMap);
      expect(extracted).toHaveLength(2);
      expect(extracted[0]?.id).toBe("nested_sesame_1");
      expect(extracted[0]?.category).toBe("Cold Pressed Oils");
      expect(extracted[0]?.categorySlug).toBe("cold-pressed-oils");
      expect(extracted[1]?.id).toBe("nested_castor_2");
      expect(extracted[1]?.categorySlug).toBe("cold-pressed-oils");
    });
  });

  describe("11. Existing frontend-shaped product documents remain compatible", () => {
    it("preserves existing frontend Product documents without loss or distortion", () => {
      const frontendProduct: Product = {
        id: "prod_groundnut_oil",
        name: "Heritage Wood Churned Mara Chekku Groundnut Oil",
        tamilName: "மரச்செக்கு கடலை எண்ணெய்",
        category: "Cold Pressed Oils",
        categorySlug: "cold-pressed-oils",
        brand: "Sri Amman Organics Signature",
        rating: 4.9,
        reviewCount: 1842,
        description: "Unrefined native peanut cooking oil.",
        imageUrl: "https://cdn.example.com/groundnut1.jpg",
        images: [
          "https://cdn.example.com/groundnut1.jpg",
          "https://cdn.example.com/groundnut2.jpg",
        ],
        options: [
          {
            unit: "ml",
            unitSize: "500",
            mrp: 160,
            offerPrice: 130,
            specialPrice: 120,
            stock: 45,
          },
          {
            unit: "L",
            unitSize: "1",
            mrp: 299,
            offerPrice: 245,
            specialPrice: 229,
            stock: 50,
          },
        ],
        tags: ["Bestseller", "Wood Churned", "Pure Organic"],
        isActive: true,
        isFlashDeal: true,
        flashDiscount: "18% OFF",
        origin: "Polur & Tiruvannamalai Drylands",
        extraction: "Vaagai Wood Mortar (38°C Cold Max)",
        nutrition: {
          energy: "900 kcal",
          mufa: "48.2 g",
        },
      };

      const normalized = normalizeLegacyProduct(frontendProduct);
      expect(normalized).toEqual(frontendProduct);
    });

    it("integrates seamlessly with productService.getProducts and productService.getProductById for mixed legacy and current payloads", async () => {
      const mixedPayload = [
        {
          id: "legacy_admin_oil",
          productName: "Legacy Admin Sesame Oil",
          categoryName: "Cold Pressed Oils",
          offerZone: true,
          discountPercent: 25,
          variants: [
            { name: "1 L", sellingPrice: 300, mrp: 400, stock: 10 },
          ],
        },
        {
          id: "current_frontend_rice",
          name: "Current Frontend Ponni Rice",
          category: "Rice & Staples",
          categorySlug: "staples-grains",
          brand: "Sri Amman",
          rating: 4.8,
          reviewCount: 100,
          description: "Aged Ponni Rice",
          imageUrl: "/rice.jpg",
          images: ["/rice.jpg"],
          options: [
            { unit: "kg", unitSize: "5", mrp: 450, offerPrice: 385, stock: 20 },
          ],
          tags: ["Staple"],
          isActive: true,
          isFlashDeal: false,
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValue(mixedPayload);

      const all = await productService.getProducts();
      expect(all).toHaveLength(2);

      const oilsOnly = await productService.getProducts({
        category: "cold-pressed-oils",
      });
      expect(oilsOnly).toHaveLength(1);
      expect(oilsOnly[0]?.id).toBe("legacy_admin_oil");
      expect(oilsOnly[0]?.name).toBe("Legacy Admin Sesame Oil");

      const flashDealsOnly = await productService.getProducts({
        isFlashDeal: true,
      });
      expect(flashDealsOnly).toHaveLength(1);
      expect(flashDealsOnly[0]?.id).toBe("legacy_admin_oil");
      expect(flashDealsOnly[0]?.flashDiscount).toBe("25% OFF");

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mixedPayload[0]);
      const single = await productService.getProductById("legacy_admin_oil");
      expect(single).not.toBeNull();
      expect(single?.id).toBe("legacy_admin_oil");
      expect(single?.options[0]?.offerPrice).toBe(300);
    });

    it("derives expected categorySlug for known and custom category names", () => {
      expect(deriveCategorySlug("Cold Pressed Oils")).toBe("cold-pressed-oils");
      expect(deriveCategorySlug("Rice & Staples")).toBe("staples-grains");
      expect(deriveCategorySlug("Farm Fresh Veggies")).toBe("fruits-veggies");
      expect(deriveCategorySlug("Dairy & Paneer")).toBe("dairy-breakfast");
      expect(deriveCategorySlug("Custom Herbal Care")).toBe(
        "custom-herbal-care"
      );
      expect(deriveCategorySlug("Cold Pressed Oils", "explicit-slug")).toBe(
        "explicit-slug"
      );
    });
  });

  describe("12. FirestoreAdapter Nested Product Retrieval (products/{category}/items/{productId})", () => {
    let memoryDriver: InMemoryFirestoreDriver;
    let testAdapter: FirestoreAdapter;
    let originalAdapter: FirestoreAdapter;
    let originalMode: ReturnType<typeof apiClient.getMode>;

    beforeEach(() => {
      memoryDriver = new InMemoryFirestoreDriver();
      testAdapter = new FirestoreAdapter(memoryDriver);
      originalAdapter = apiClient.getFirestoreAdapter();
      originalMode = apiClient.getMode();

      apiClient.setFirestoreAdapter(testAdapter);
      apiClient.setMode("emulator");
      apiClient.resetSourceState();
    });

    afterEach(() => {
      apiClient.setFirestoreAdapter(originalAdapter);
      apiClient.setMode(originalMode);
      apiClient.resetSourceState();
      vi.restoreAllMocks();
    });

    it("retrieves nested-only products from products/{category}/items/{productId} when top-level products collection is empty or contains only category stubs", async () => {
      // Bare parent category container stub at top-level products/{category}
      await memoryDriver.setDoc("products", "Cold Pressed Oils", {
        id: "Cold Pressed Oils",
        name: "Cold Pressed Oils",
      });

      await memoryDriver.setNestedProductDoc(
        "Cold Pressed Oils",
        "nested_gingelly_01",
        {
          productName: "Wood Churned Gingelly Oil",
          nameTamil: "மரச்செக்கு நல்லெண்ணெய்",
          brandName: "Sri Amman Traditional",
          offerZone: true,
          discountPercent: 15,
          variants: [
            { name: "500ml", sellingPrice: 175, mrp: 210, stock: 30 },
            { name: "1L", sellingPrice: 340, mrp: 400, stock: 20 },
          ],
        }
      );

      await memoryDriver.setNestedProductDoc(
        "Snacks & Sweets",
        "nested_adhirasam_02",
        {
          productName: "Traditional Jaggery Adhirasam",
          variants: [
            { name: "250g", sellingPrice: 95, mrp: 110, stock: 18 },
          ],
        }
      );

      const allProducts = await productService.getProducts();
      expect(allProducts).toHaveLength(2);
      expect(allProducts.map((p) => p.id)).toEqual([
        "nested_gingelly_01",
        "nested_adhirasam_02",
      ]);

      // Verify category filtering works on nested-only products
      const oils = await productService.getProducts({
        category: "cold-pressed-oils",
      });
      expect(oils).toHaveLength(1);
      expect(oils[0]?.id).toBe("nested_gingelly_01");
      expect(oils[0]?.category).toBe("Cold Pressed Oils");
      expect(oils[0]?.categorySlug).toBe("cold-pressed-oils");

      // Verify single-product lookup by ID resolves nested product
      const byId = await productService.getProductById("nested_adhirasam_02");
      expect(byId).not.toBeNull();
      expect(byId?.id).toBe("nested_adhirasam_02");
      expect(byId?.category).toBe("Snacks & Sweets");
      expect(byId?.categorySlug).toBe("snacks-sweets");

      // Verify direct nested adapter paths `/products/:category/items` and `/products/:category/items/:productId`
      const directCategoryItems = await testAdapter.get<Record<string, unknown>[]>(
        "/products/Cold Pressed Oils/items"
      );
      expect(directCategoryItems).toHaveLength(1);
      expect(directCategoryItems[0]?.["id"]).toBe("nested_gingelly_01");

      const directSingleItem = await testAdapter.get<Record<string, unknown>>(
        "/products/Cold Pressed Oils/items/nested_gingelly_01"
      );
      expect(directSingleItem["_docId"]).toBe("nested_gingelly_01");
      expect(directSingleItem["_parentCategory"]).toBe("Cold Pressed Oils");
    });

    it("retrieves top-level-only products unchanged when nested collections are empty", async () => {
      await memoryDriver.setDoc("products", "top_ponni_rice", {
        id: "top_ponni_rice",
        name: "Tanjore Royal Ponni Rice",
        category: "Rice & Staples",
        categorySlug: "staples-grains",
        brand: "Sri Amman Heritage",
        rating: 4.8,
        reviewCount: 250,
        description: "12 month aged raw rice",
        imageUrl: "/ponni.jpg",
        images: ["/ponni.jpg"],
        options: [
          { unit: "kg", unitSize: "5", mrp: 450, offerPrice: 385, stock: 40 },
        ],
        tags: ["Staple"],
        isActive: true,
      });

      const all = await productService.getProducts();
      expect(all).toHaveLength(1);
      expect(all[0]?.id).toBe("top_ponni_rice");
      expect(all[0]?.options[0]?.offerPrice).toBe(385);

      const single = await productService.getProductById("top_ponni_rice");
      expect(single?.id).toBe("top_ponni_rice");
      expect(single?.name).toBe("Tanjore Royal Ponni Rice");
    });

    it("deduplicates products existing in both top-level and nested storage using deterministic top-level precedence", async () => {
      // 1. Same document ID in both top-level and nested storage
      await memoryDriver.setDoc("products", "shared_groundnut_oil", {
        id: "shared_groundnut_oil",
        name: "Top-Level Groundnut Oil (Canonical)",
        category: "Cold Pressed Oils",
        categorySlug: "cold-pressed-oils",
        brand: "Sri Amman Signature",
        rating: 4.9,
        reviewCount: 500,
        description: "Canonical top-level version",
        imageUrl: "/top-oil.jpg",
        images: ["/top-oil.jpg"],
        options: [
          { unit: "L", unitSize: "1", mrp: 299, offerPrice: 245, stock: 50 },
        ],
        tags: [],
        isActive: true,
      });

      await memoryDriver.setNestedProductDoc(
        "Cold Pressed Oils",
        "shared_groundnut_oil",
        {
          id: "shared_groundnut_oil",
          productName: "Nested Groundnut Oil (Shadowed Duplicate)",
          variants: [
            { name: "1L", sellingPrice: 999, mrp: 1099, stock: 5 },
          ],
        }
      );

      // 2. Cross-field logical ID collision (`productId` matching top-level `id`)
      await memoryDriver.setNestedProductDoc(
        "Cold Pressed Oils",
        "nested_alt_doc_id",
        {
          productId: "shared_groundnut_oil",
          productName: "Nested Alias Duplicate",
          variants: [
            { name: "500ml", sellingPrice: 888, mrp: 999, stock: 5 },
          ],
        }
      );

      // 3. Distinct nested-only product that should still be included
      await memoryDriver.setNestedProductDoc(
        "Cold Pressed Oils",
        "unique_nested_castor_oil",
        {
          productName: "Unique Nested Castor Oil",
          variants: [
            { name: "250ml", sellingPrice: 110, mrp: 130, stock: 15 },
          ],
        }
      );

      const allProducts = await productService.getProducts();
      expect(allProducts).toHaveLength(2);
      expect(allProducts.map((p) => p.id)).toEqual([
        "shared_groundnut_oil",
        "unique_nested_castor_oil",
      ]);

      const canonicalMatch = allProducts.find(
        (p) => p.id === "shared_groundnut_oil"
      );
      expect(canonicalMatch?.name).toBe("Top-Level Groundnut Oil (Canonical)");
      expect(canonicalMatch?.options[0]?.offerPrice).toBe(245);

      const byId = await productService.getProductById("shared_groundnut_oil");
      expect(byId?.name).toBe("Top-Level Groundnut Oil (Canonical)");
      expect(byId?.options[0]?.offerPrice).toBe(245);
    });

    it("propagates parent category and Firestore document ID from products/{category}/items/{productId} when omitted inside document data", async () => {
      // Document payload intentionally omits `id`, `productId`, `sku`, `category`, and `categoryName`
      await memoryDriver.setNestedProductDoc(
        "Organic Spices",
        "doc_id_black_pepper_101",
        {
          productName: "Wayanaad Tellicherry Black Pepper",
          nameTamil: "குருமிளகு",
          variants: [
            { name: "200g", sellingPrice: 165, mrp: 195, stock: 34 },
          ],
        }
      );

      const rawAdapterItems = await testAdapter.get<Record<string, unknown>[]>(
        "/products"
      );
      expect(rawAdapterItems).toHaveLength(1);
      expect(rawAdapterItems[0]?.["id"]).toBe("doc_id_black_pepper_101");
      expect(rawAdapterItems[0]?.["_docId"]).toBe("doc_id_black_pepper_101");
      expect(rawAdapterItems[0]?.["_parentCategory"]).toBe("Organic Spices");
      expect(rawAdapterItems[0]?.["_path"]).toBe(
        "products/Organic Spices/items/doc_id_black_pepper_101"
      );

      const products = await productService.getProducts();
      expect(products).toHaveLength(1);
      expect(products[0]?.id).toBe("doc_id_black_pepper_101");
      expect(products[0]?.category).toBe("Organic Spices");
      expect(products[0]?.categorySlug).toBe("organic-spices");

      const byDocId = await productService.getProductById(
        "doc_id_black_pepper_101"
      );
      expect(byDocId).not.toBeNull();
      expect(byDocId?.id).toBe("doc_id_black_pepper_101");
      expect(byDocId?.category).toBe("Organic Spices");
      expect(byDocId?.categorySlug).toBe("organic-spices");
    });

    it("handles empty top-level and nested collections cleanly without errors or false fallbacks", async () => {
      apiClient.setMode("auto");
      const mockFetch = vi.fn();
      vi.stubGlobal("fetch", mockFetch);

      const all = await productService.getProducts();
      expect(all).toEqual([]);

      const nestedCategoryList = await testAdapter.get<unknown[]>(
        "/products/Cold Pressed Oils/items"
      );
      expect(nestedCategoryList).toEqual([]);

      const missing = await productService.getProductById("does_not_exist");
      expect(missing).toBeNull();

      // Must remain on emulator without triggering JSON Server fallback on empty/404
      expect(apiClient.getActiveSource()).toBe("emulator");
      expect(apiClient.getDataSourceStatus().fallbackActive).toBe(false);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("propagates emulator connectivity errors in 'emulator' mode and triggers JSON Server fallback in 'auto' mode", async () => {
      memoryDriver.setFailureMode(
        new StorageAdapterError("ECONNREFUSED 127.0.0.1:8081", {
          status: 503,
          code: "unavailable",
          category: "connectivity",
        })
      );

      // 1. In strict 'emulator' mode, connectivity failure throws and never falls back
      apiClient.setMode("emulator");
      await expect(productService.getProducts()).rejects.toThrow(/ECONNREFUSED/i);
      await expect(
        testAdapter.get("/products/Cold Pressed Oils/items")
      ).rejects.toThrow(/ECONNREFUSED/i);
      expect(apiClient.getActiveSource()).toBe("emulator");

      // 2. In 'auto' mode, connectivity failure falls back to JSON Server
      apiClient.setMode("auto");
      const fallbackProducts = [
        {
          id: "fallback_json_prod_1",
          name: "Fallback JSON Server Product",
          category: "Cold Pressed Oils",
          categorySlug: "cold-pressed-oils",
          brand: "Sri Amman",
          rating: 4.7,
          reviewCount: 40,
          description: "Served from JSON Server fallback",
          imageUrl: "/fallback.jpg",
          images: ["/fallback.jpg"],
          options: [
            { unit: "ml", unitSize: "500", mrp: 150, offerPrice: 125, stock: 10 },
          ],
          tags: [],
          isActive: true,
        },
      ];
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => fallbackProducts,
      });
      vi.stubGlobal("fetch", mockFetch);

      const recovered = await productService.getProducts();
      expect(recovered).toHaveLength(1);
      expect(recovered[0]?.id).toBe("fallback_json_prod_1");
      expect(apiClient.getActiveSource()).toBe("json-server");
      expect(apiClient.getDataSourceStatus().fallbackActive).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("14. Phase A Canonical Normalization & Invariants Hardening", () => {
    it("handles legacy pack labels such as '20g Pack' without confusing numeric size with unit or placeholder weights", () => {
      // Production observed case: Sakthi Turmeric Powder (prod-mumqpksq)
      // Variant has name: "20g Pack", unit: "g", and legacy admin placeholder weight: 500
      const prodMumqpksqFixture = {
        id: "prod-mumqpksq",
        name: "Sakthi Turmeric Powder",
        tamilName: "மஞ்சள் தூள்",
        brandName: "Sakthi Masala",
        categoryName: "Grocery",
        subCategory: "Masala & Spice Powders",
        imageUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        mrp: 12,
        price: 10,
        stock: 57,
        status: "active",
        options: [
          {
            unit: "20g Pack",
            unitSize: "g",
            weight: 500, // Legacy admin form default
            mrp: 12,
            price: 10,
            sellingPrice: 10,
            stock: 60,
          },
        ],
        variants: [
          {
            id: "var-1790744613541",
            name: "20g Pack",
            unit: "g",
            weight: 500, // Legacy admin form default
            mrp: 12,
            sellingPrice: 10,
            purchasePrice: 8, // POS internal cost
            stock: 57,
            safetyStock: 20,
            barcode: "8906002081561",
            sku: "SKU-4659",
            batchNumber: "PROD004",
            expiryDate: "2027-03-27",
          },
        ],
      };

      const normalized = normalizeLegacyProduct(prodMumqpksqFixture);
      expect(normalized).not.toBeNull();
      expect(normalized?.options).toHaveLength(1);
      const opt = normalized!.options[0]!;

      // Must be 20g, NOT 500g
      expect(opt.unit).toBe("g");
      expect(opt.unitSize).toBe("20");
      expect(opt.offerPrice).toBe(10);
      expect(opt.mrp).toBe(12);
      expect(opt.stock).toBe(60);

      // Verify canonical cart variant key matches convention
      const canonicalKey = `${normalized!.id}__opt0__${opt.unit}__${opt.unitSize}`;
      expect(canonicalKey).toBe("prod-mumqpksq__opt0__g__20");
    });

    it("resolves conflicting stock fail-closed when physical POS variant stock is 0 or outOfStock", () => {
      const conflictingDoc = {
        id: "prod-stock-conflict",
        name: "Conflict Item",
        category: "Grocery",
        options: [
          {
            name: "100g",
            unit: "g",
            unitSize: "100",
            sellingPrice: 50,
            mrp: 60,
            stock: 25, // E-commerce options claim 25 available
          },
        ],
        variants: [
          {
            name: "100g",
            unit: "g",
            weight: 100,
            sellingPrice: 50,
            mrp: 60,
            stock: 0, // POS live shelf count is 0!
          },
        ],
      };

      const normalized = normalizeLegacyProduct(conflictingDoc);
      expect(normalized).not.toBeNull();
      // Physical inventory is 0, mapper must fail closed to 0 to prevent overselling
      expect(normalized?.options[0]?.stock).toBe(0);
    });

    it("resolves conflicting stock fail-closed when root product or variant has outOfStock/inStock flags", () => {
      // Case 1: Variant flagged outOfStock
      const variantOosDoc = {
        id: "prod-oos-1",
        name: "OOS Variant Item",
        category: "Grocery",
        options: [
          { unit: "g", unitSize: "50", sellingPrice: 20, mrp: 25, stock: 10 },
        ],
        variants: [
          { unit: "g", weight: 50, sellingPrice: 20, outOfStock: true, stock: 10 },
        ],
      };
      const norm1 = normalizeLegacyProduct(variantOosDoc);
      expect(norm1?.options[0]?.stock).toBe(0);

      // Case 2: Root product flagged inStock: false
      const rootOosDoc = {
        id: "prod-oos-2",
        name: "OOS Root Item",
        category: "Grocery",
        inStock: false,
        options: [
          { unit: "g", unitSize: "50", sellingPrice: 20, mrp: 25, stock: 10 },
        ],
      };
      const norm2 = normalizeLegacyProduct(rootOosDoc);
      expect(norm2?.options[0]?.stock).toBe(0);
    });

    it("falls back to variant stock when option stock is missing, and root stock for single-variant products", () => {
      // Case 1: Option stock missing -> falls back to variant stock
      const missingOptionStockDoc = {
        id: "prod-stock-fallback-1",
        name: "Fallback Stock Item",
        category: "Grocery",
        options: [
          { unit: "g", unitSize: "100", sellingPrice: 40, mrp: 50 }, // No stock field
        ],
        variants: [
          { unit: "g", weight: 100, sellingPrice: 40, stock: 18 },
        ],
      };
      const norm1 = normalizeLegacyProduct(missingOptionStockDoc);
      expect(norm1?.options[0]?.stock).toBe(18);

      // Case 2: Both option and variant stock missing -> falls back to root stock
      const singleItemRootStockDoc = {
        id: "prod-stock-fallback-2",
        name: "Single Item Root Stock",
        category: "Grocery",
        stock: 33,
        options: [
          { unit: "g", unitSize: "100", sellingPrice: 40, mrp: 50 },
        ],
      };
      const norm2 = normalizeLegacyProduct(singleItemRootStockDoc);
      expect(norm2?.options[0]?.stock).toBe(33);

      // Case 3: Completely missing -> strictly 0 (never invent positive stock)
      const zeroStockDoc = {
        id: "prod-stock-fallback-3",
        name: "Unknown Stock Item",
        category: "Grocery",
        options: [
          { unit: "g", unitSize: "100", sellingPrice: 40, mrp: 50 },
        ],
      };
      const norm3 = normalizeLegacyProduct(zeroStockDoc);
      expect(norm3?.options[0]?.stock).toBe(0);
    });

    it("strictly ensures MRP >= offerPrice and specialPrice < offerPrice", () => {
      const priceDoc = {
        id: "prod-price-rules",
        name: "Price Rules Product",
        category: "Grocery",
        variants: [
          {
            name: "50g",
            unit: "g",
            unitSize: "50",
            sellingPrice: 100,
            mrp: 80, // Faulty MRP lower than selling price
            vipPrice: 120, // Faulty VIP price higher than selling price!
            stock: 10,
          },
          {
            name: "100g",
            unit: "g",
            unitSize: "100",
            sellingPrice: 180,
            mrp: 200,
            vipPrice: 160, // Valid VIP price lower than selling price
            stock: 10,
          },
        ],
      };

      const normalized = normalizeLegacyProduct(priceDoc);
      expect(normalized).not.toBeNull();
      const opt1 = normalized!.options[0]!;
      const opt2 = normalized!.options[1]!;

      // Invariant 1: MRP must be >= offerPrice
      expect(opt1.offerPrice).toBe(100);
      expect(opt1.mrp).toBe(100); // Corrected to offerPrice

      // Invariant 2: VIP price must be strictly < offerPrice; ignored if higher
      expect(opt1.specialPrice).toBeUndefined();

      // Normal valid VIP price is preserved
      expect(opt2.offerPrice).toBe(180);
      expect(opt2.mrp).toBe(200);
      expect(opt2.specialPrice).toBe(160);
    });

    it("never exposes internal POS metadata (purchasePrice, barcode, sku, batchNumber, safetyStock, expiryDate)", () => {
      const posDoc = {
        id: "prod-munn8cp3",
        name: "Sakthi Chicken Masala",
        tamilName: "சிக்கன் மசாலா",
        brandName: "Sakthi Masala",
        categoryName: "Grocery",
        subCategory: "Masala & Spice Powders",
        imageUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
        mrp: 15,
        price: 12,
        stock: 37,
        unit: "500g Pack",
        gstRate: 5,
        hsnCode: "09109100",
        fssaiNumber: "12415003000524",
        ingredients: "Coriander, Chilli, Pepper, Cumin, Salt, Turmeric, Garlic",
        isNew: true,
        isBestSeller: true,
        options: [
          {
            unit: "500g Pack",
            unitSize: "g",
            weight: 500,
            mrp: 15,
            price: 12,
            sellingPrice: 12,
            stock: 40,
          },
        ],
        variants: [
          {
            id: "var-1790744613542",
            name: "500g Pack",
            unit: "g",
            weight: 500,
            mrp: 15,
            sellingPrice: 12,
            purchasePrice: 9.5, // Sensitive internal cost
            stock: 37,
            safetyStock: 15, // Internal threshold
            barcode: "8906002081578", // POS barcode
            sku: "SKU-4660", // POS internal SKU
            batchNumber: "PROD005", // Warehouse batch
            expiryDate: "2027-03-27", // Internal shelf expiry
          },
        ],
      };

      const normalized = normalizeLegacyProduct(posDoc);
      expect(normalized).not.toBeNull();

      // Verify customer-facing fields are present and typed
      expect(normalized?.gstRate).toBe(5);
      expect(normalized?.hsnCode).toBe("09109100");
      expect(normalized?.fssaiNumber).toBe("12415003000524");
      expect(normalized?.ingredients).toContain("Coriander");
      expect(normalized?.isNew).toBe(true);
      expect(normalized?.isBestSeller).toBe(true);

      // Verify POS metadata is NOT present on product
      const rawProductKeys = Object.keys(normalized as unknown as Record<string, unknown>);
      expect(rawProductKeys).not.toContain("purchasePrice");
      expect(rawProductKeys).not.toContain("barcode");
      expect(rawProductKeys).not.toContain("safetyStock");
      expect(rawProductKeys).not.toContain("batchNumber");
      expect(rawProductKeys).not.toContain("expiryDate");

      // Verify POS metadata is NOT present on product option
      const rawOptionKeys = Object.keys(normalized!.options[0] as unknown as Record<string, unknown>);
      expect(rawOptionKeys).not.toContain("purchasePrice");
      expect(rawOptionKeys).not.toContain("barcode");
      expect(rawOptionKeys).not.toContain("safetyStock");
      expect(rawOptionKeys).not.toContain("batchNumber");
      expect(rawOptionKeys).not.toContain("expiryDate");
      expect(rawOptionKeys).not.toContain("sku");
    });
  });
});


