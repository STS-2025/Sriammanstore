import type { Product } from "../types";
import { normalizeLegacyProduct } from "../services/legacySchemaMapper";
import type { InMemoryFirestoreDriver } from "../services/firestoreAdapter";

/**
 * Approved production product document IDs audited from the production Firestore database.
 */
export const APPROVED_PRODUCTION_FIXTURE_IDS = [
  "prod-mumqpksq",
  "prod-munn8cp3",
] as const;

export type ApprovedProductionFixtureId =
  typeof APPROVED_PRODUCTION_FIXTURE_IDS[number];

/**
 * Neutral development placeholder image URL for Chicken Masala.
 * Used because live production document prod-munn8cp3 contains photos of Puliyogare Rice Powder
 * rather than Chicken Masala.
 */
export const CHICKEN_MASALA_NEUTRAL_PLACEHOLDER =
  "/placeholders/chicken-masala-placeholder.svg";

/**
 * Verified production fixture placeholder for Turmeric Powder.
 */
export const TURMERIC_POWDER_FIXTURE_IMAGE =
  "/placeholders/turmeric-powder.svg";

/**
 * Raw production-shaped document fixture for Sakthi Turmeric Powder (products/prod-mumqpksq).
 * Sanitized to exclude sensitive operational cost data (purchasePrice) and credentials.
 */
export const productionTurmericRawFixture: Record<string, unknown> = {
  id: "prod-mumqpksq",
  productId: "prod-mumqpksq",
  name: "Sakthi Turmeric Powder",
  productName: "Sakthi Turmeric Powder",
  tamilName: "மஞ்சள் தூள்",
  nameTamil: "மஞ்சள் தூள்",
  brand: "Sakthi Masala",
  brandName: "Sakthi Masala",
  brandId: "brand-sakthi",
  category: "Spices & Masala Powders",
  categoryName: "Spices & Masala Powders",
  subCategory: "Whole Spices",
  categorySlug: "organic-spices",
  description:
    "Pure and natural turmeric powder hygienically processed from selected Erode turmeric rhizomes. Rich in natural curcumin.",
  desc: "Pure and natural turmeric powder hygienically processed from selected Erode turmeric rhizomes.",
  imageUrl: TURMERIC_POWDER_FIXTURE_IMAGE,
  frontImageUrl: TURMERIC_POWDER_FIXTURE_IMAGE,
  backImageUrl: TURMERIC_POWDER_FIXTURE_IMAGE,
  imageUrls: [TURMERIC_POWDER_FIXTURE_IMAGE],
  mrp: 12,
  price: 10,
  sellingPrice: 10,
  stock: 57,
  unit: "20g Pack",
  status: "active",
  isActive: true,
  gstRate: 5,
  hsnCode: "09103030",
  fssaiNumber: "12415003000524",
  ingredients: "Turmeric",
  isNew: false,
  isBestSeller: true,
  isOffer: false,
  isFeatured: false,
  rating: 0,
  reviewCount: 0,
  tags: ["Sakthi", "Turmeric", "Haldi", "Organic Spices", "Curcumin"],
  options: [
    {
      unit: "20g Pack",
      unitSize: "g",
      weight: 500, // Legacy admin form default preserved for schema fidelity
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
      weight: 500,
      mrp: 12,
      sellingPrice: 10,
      // purchasePrice excluded for privacy / non-leakage
      stock: 57,
      barcode: "8906002080106",
      sku: "SKU-4659",
      batchNumber: "PROD004",
      expiryDate: "2027-03-27",
    },
  ],
};

/**
 * Raw production-shaped document fixture for Sakthi Chicken Masala (products/prod-munn8cp3).
 * Sanitized to exclude sensitive operational cost data (purchasePrice) and credentials.
 * Uses a clearly identified neutral placeholder for local development because the production
 * document erroneously contains photos of Puliyogare Rice Powder.
 */
export const productionChickenMasalaRawFixture: Record<string, unknown> = {
  id: "prod-munn8cp3",
  productId: "prod-munn8cp3",
  name: "Sakthi Chicken Masala",
  productName: "Sakthi Chicken Masala",
  tamilName: "சிக்கன் மசாலா",
  nameTamil: "சிக்கன் மசாலா",
  brand: "Sakthi Masala",
  brandName: "Sakthi Masala",
  brandId: "brand-sakthi",
  category: "Grocery",
  categoryName: "Grocery",
  categoryId: "cat-mun1fjzh",
  subCategory: "Masala & Spice Powders",
  description:
    "An exquisite authentic South Indian blend of whole spices crafted specifically for flavorful, rich chicken curry and roast.",
  desc: "An exquisite authentic South Indian blend of whole spices crafted specifically for chicken gravy.",
  // Neutral placeholder per requirement 4: Puliyogare image excluded
  imageUrl: CHICKEN_MASALA_NEUTRAL_PLACEHOLDER,
  frontImageUrl: CHICKEN_MASALA_NEUTRAL_PLACEHOLDER,
  backImageUrl: CHICKEN_MASALA_NEUTRAL_PLACEHOLDER,
  imageUrls: [CHICKEN_MASALA_NEUTRAL_PLACEHOLDER],
  mrp: 15,
  price: 12,
  sellingPrice: 12,
  stock: 37,
  unit: "500g Pack",
  status: "active",
  isActive: true,
  gstRate: 5,
  hsnCode: "09109100",
  fssaiNumber: "12415003000524",
  ingredients:
    "Coriander, Chilli, Pepper, Cumin, Salt, Turmeric, Garlic, Star Anise, Onion, Cloves",
  isNew: true,
  isBestSeller: true,
  isOffer: false,
  isFeatured: false,
  rating: 0,
  reviewCount: 0,
  tags: ["Sakthi", "Chicken Masala", "Non-Veg Masalas", "Spices", "Curry"],
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
      // purchasePrice excluded for privacy / non-leakage
      stock: 37,
      barcode: "8906002081578",
      sku: "SKU-4660",
      batchNumber: "PROD005",
      expiryDate: "2027-03-27",
    },
  ],
};

/**
 * The array of sanitized raw production-compatible fixtures for local development.
 */
export const SANITIZED_PRODUCTION_PRODUCT_RAW_FIXTURES: Record<
  string,
  unknown
>[] = [productionTurmericRawFixture, productionChickenMasalaRawFixture];

/**
 * Normalized customer-facing UI products derived from the production-shaped fixtures
 * using the canonical legacySchemaMapper.
 */
export const normalizedProductionProductFixtures: Product[] =
  SANITIZED_PRODUCTION_PRODUCT_RAW_FIXTURES.map((raw) => {
    const product = normalizeLegacyProduct(raw);
    if (!product) {
      throw new Error(`Failed to normalize fixture for ${raw["id"]}`);
    }
    return product;
  });

/**
 * Retrieves a sanitized production fixture by document ID.
 */
export function getSanitizedProductionFixture(
  docId: string
): Record<string, unknown> | null {
  return (
    SANITIZED_PRODUCTION_PRODUCT_RAW_FIXTURES.find(
      (f) => f["id"] === docId || f["productId"] === docId
    ) ?? null
  );
}

/**
 * Seeds both sanitized production product fixtures into an InMemoryFirestoreDriver
 * for isolated unit and integration testing.
 */
export async function seedInMemoryProductionProductFixtures(
  driver: InMemoryFirestoreDriver
): Promise<{
  turmeric: Product;
  chickenMasala: Product;
  cleanup: () => Promise<void>;
}> {
  const turmeric = normalizeLegacyProduct(productionTurmericRawFixture)!;
  const chickenMasala = normalizeLegacyProduct(productionChickenMasalaRawFixture)!;

  await driver.setDoc(
    "products",
    turmeric.id,
    productionTurmericRawFixture
  );
  await driver.setDoc(
    "products",
    chickenMasala.id,
    productionChickenMasalaRawFixture
  );

  return {
    turmeric,
    chickenMasala,
    cleanup: async () => {
      await driver.deleteDoc("products", turmeric.id).catch(() => {});
      await driver.deleteDoc("products", chickenMasala.id).catch(() => {});
    },
  };
}

