import { collection, getDocs, type Firestore } from "firebase/firestore";
import type { Category, Product } from "../types";
import {
  getIsolatedProductionFirestore,
  isProductionPreviewOptedIn,
  type ProductionPreviewOptions,
} from "./productionPreviewService";

/**
 * Raw category document structure as audited in production Firestore (`categories` collection).
 * Audited example document: `categories/cat-mun1fjzh`
 */
export interface ProductionCategoryDoc {
  id: string;
  name: string;
  tamilName?: string | undefined;
  slug?: string | undefined;
  subcategories?: string[] | undefined;
  bannerUrl?: string | undefined;
  description?: string | undefined;
  isActive?: boolean | undefined;
  displayOrder?: number | undefined;
  showOnHomepage?: boolean | undefined;
  itemCount?: number | undefined;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
  [key: string]: unknown;
}

/**
 * Diagnostic conflict alert for discrepancies observed between category docs and products.
 */
export interface CategoryConflictAlert {
  categoryId: string;
  categoryName: string;
  issue: string;
  description: string;
  level: "warning" | "info" | "error";
}

/**
 * Comprehensive diagnostics for production category resolution.
 */
export interface ProductionCategoryDiagnostics {
  /** Total category documents read from production Firestore `categories` collection */
  totalCategoryDocsRead: number;
  /** Document IDs retrieved from `categories` collection */
  firestoreCategoryDocIds: string[];
  /** Categories successfully matched to a live Firestore category document */
  resolvedFromFirestoreCount: number;
  /** Categories created via product-record fallback due to missing category documents */
  fallbackCategoryCount: number;
  /** Category IDs referenced by products but missing from `categories` collection */
  missingDocCategoryIds: string[];
  /** Discrepancies between category names, slugs, and referenced product fields */
  conflicts: CategoryConflictAlert[];
  /** Product count aggregated per resolved category ID */
  categoryDocCounts: Record<string, number>;
  /** Product count aggregated per category slug */
  categorySlugCounts: Record<string, number>;
  /** Product count aggregated per subcategory name */
  subcategoryCounts: Record<string, number>;
}

/**
 * Return structure from the production category resolver.
 */
export interface ProductionCategoryResolverResult {
  /** Normalized Category array suitable for consumption by Shop filters and navigation */
  categories: Category[];
  /** Raw category documents retrieved from Firestore */
  rawCategoryDocs: ProductionCategoryDoc[];
  /** Detailed diagnostics exposing matches, fallbacks, conflicts, and missing docs */
  diagnostics: ProductionCategoryDiagnostics;
  /** Timestamp when resolution was executed */
  timestamp: string;
}

/**
 * Minimal interface for raw product records passed to the resolver.
 */
export interface RawProductCategoryInput {
  id: string;
  categoryId?: unknown;
  category?: unknown;
  categoryName?: unknown;
  subCategory?: unknown;
  subcategory?: unknown;
  parentCategory?: unknown;
  documentPath?: string;
}

/**
 * Safely extracts a trimmed non-empty string or undefined.
 */
function toCleanString(val: unknown): string | undefined {
  if (typeof val === "string") {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

/**
 * Derives a clean URL-friendly slug from a category name if slug is missing or invalid.
 */
export function slugifyCategoryName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Fetches all raw category documents from the production Firestore `categories` collection.
 * Strictly opt-in: throws if options.optIn is not enabled.
 */
export async function fetchProductionCategoryDocs(
  options?: ProductionPreviewOptions
): Promise<ProductionCategoryDoc[]> {
  if (!isProductionPreviewOptedIn(options)) {
    throw new Error(
      "SAFETY GUARD ACTIVE: Production category read access is strictly opt-in.\n" +
        "Provide optIn: true to query production Firestore categories."
    );
  }

  const { db } = getIsolatedProductionFirestore(options?.config);
  const catColRef = collection(db, "categories");
  const snap = await getDocs(catColRef);

  const docs: ProductionCategoryDoc[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    docs.push({
      id: docSnap.id,
      name: toCleanString(data["name"]) || docSnap.id,
      tamilName: toCleanString(data["tamilName"]),
      slug: toCleanString(data["slug"]),
      subcategories: Array.isArray(data["subcategories"])
        ? data["subcategories"].filter((s): s is string => typeof s === "string" && s.trim().length > 0)
        : [],
      bannerUrl: toCleanString(data["bannerUrl"]),
      description: toCleanString(data["description"]),
      isActive: data["isActive"] !== false,
      displayOrder: typeof data["displayOrder"] === "number" ? data["displayOrder"] : 1,
      showOnHomepage: data["showOnHomepage"] === true,
      itemCount: typeof data["itemCount"] === "number" ? data["itemCount"] : 0,
      createdAt: toCleanString(data["createdAt"]),
      updatedAt: toCleanString(data["updatedAt"]),
    });
  });

  return docs;
}

/**
 * Resolves production categories by reading Firestore category documents and correlating
 * them with product records.
 *
 * Requirements satisfied:
 * - Read production categories from Firestore only when explicitly enabled (`optIn: true`).
 * - Preserve actual category document ID, display name, slug, and parent/child relationships.
 * - Derive product category associations from the verified production schema.
 * - Use product category fields as a documented fallback when corresponding category doc is missing.
 * - Do not silently map unrelated production categories to hardcoded slugs like "organic-spices".
 * - Expose unresolved or conflicting category mappings in diagnostics.
 */
/**
 * Builds category resolution and diagnostics from provided category documents and product records.
 * Pure, synchronous function suitable for in-memory resolution and unit tests.
 */
export function buildProductionCategoryResolution(
  categoryDocs: ProductionCategoryDoc[],
  options?: {
    products?: Array<Product | RawProductCategoryInput>;
  }
): ProductionCategoryResolverResult {
  // Index Firestore category documents by their document ID and by name
  const docById = new Map<string, ProductionCategoryDoc>();
  const docByName = new Map<string, ProductionCategoryDoc>();

  for (const doc of categoryDocs) {
    docById.set(doc.id, doc);
    docByName.set(doc.name.toLowerCase().trim(), doc);
  }

  const conflicts: CategoryConflictAlert[] = [];
  const missingDocCategoryIds = new Set<string>();
  const categoryDocCounts: Record<string, number> = {};
  const categorySlugCounts: Record<string, number> = {};
  const subcategoryCounts: Record<string, number> = {};

  // Track discovered categories (both from Firestore docs and product fallbacks)
  const discoveredCategories = new Map<
    string,
    {
      id: string;
      name: string;
      tamilName?: string | undefined;
      slug: string;
      subcategories: Set<string>;
      image: string;
      source: "firestore-document" | "product-fallback";
      isFallback: boolean;
      docPath?: string | undefined;
    }
  >();

  // 1. Initialize with verified Firestore category documents
  for (const doc of categoryDocs) {
    // Audit for slug discrepancy (e.g. cat-mun1fjzh has name "Grocery" but slug "sambar")
    const actualSlug = doc.slug || slugifyCategoryName(doc.name);
    if (doc.slug && doc.name && slugifyCategoryName(doc.name) !== doc.slug.toLowerCase()) {
      conflicts.push({
        categoryId: doc.id,
        categoryName: doc.name,
        issue: "slug_mismatch",
        description: `Category document '${doc.id}' has name '${doc.name}' but document slug '${doc.slug}'. Document slug is preserved for routing.`,
        level: "warning",
      });
    }

    discoveredCategories.set(doc.id, {
      id: doc.id,
      name: doc.name,
      tamilName: doc.tamilName,
      slug: actualSlug,
      subcategories: new Set(doc.subcategories || []),
      image: doc.bannerUrl || "/placeholders/grocery.svg",
      source: "firestore-document",
      isFallback: false,
      docPath: `categories/${doc.id}`,
    });
  }

  // 2. Correlate with products (if provided) to count items, discover subcategories, and handle fallbacks
  const inputProducts = options?.products || [];

  for (const p of inputProducts) {
    const raw = (p as unknown) as Record<string, unknown>;
    const prodId = toCleanString(raw["id"]) || "unknown";

    // Extract category indicators from product
    const categoryId =
      toCleanString(raw["categoryId"]) ||
      toCleanString(raw["catId"]);

    const categoryName =
      toCleanString(raw["categoryName"]) ||
      toCleanString(raw["category"]) ||
      toCleanString(raw["parentCategory"]);

    const subCategory =
      toCleanString(raw["subCategory"]) ||
      toCleanString(raw["subcategory"]);

    if (subCategory) {
      subcategoryCounts[subCategory] = (subcategoryCounts[subCategory] || 0) + 1;
    }

    // Match against Firestore category documents
    let matchedDoc: ProductionCategoryDoc | undefined;
    if (categoryId && docById.has(categoryId)) {
      matchedDoc = docById.get(categoryId);
    } else if (categoryName && docByName.has(categoryName.toLowerCase())) {
      matchedDoc = docByName.get(categoryName.toLowerCase());
    }

    if (matchedDoc) {
      // Product matched a verified Firestore category document
      const catEntry = discoveredCategories.get(matchedDoc.id)!;
      if (subCategory) {
        catEntry.subcategories.add(subCategory);
      }
      categoryDocCounts[matchedDoc.id] = (categoryDocCounts[matchedDoc.id] || 0) + 1;
      categorySlugCounts[catEntry.slug] = (categorySlugCounts[catEntry.slug] || 0) + 1;
    } else {
      // Product references a category document that does NOT exist in Firestore (e.g. cat-spices)
      const fallbackId = categoryId || (categoryName ? slugifyCategoryName(categoryName) : "uncategorized");
      const fallbackName = categoryName || fallbackId;
      const fallbackSlug = slugifyCategoryName(fallbackName);

      if (categoryId) {
        missingDocCategoryIds.add(categoryId);
        if (!conflicts.some((c) => c.categoryId === categoryId && c.issue === "missing_category_document")) {
          conflicts.push({
            categoryId,
            categoryName: fallbackName,
            issue: "missing_category_document",
            description: `Product '${prodId}' references categoryId '${categoryId}' which does not exist in 'categories' collection. Derived category '${fallbackName}' from product record as fallback.`,
            level: "info",
          });
        }
      }

      if (!discoveredCategories.has(fallbackId)) {
        discoveredCategories.set(fallbackId, {
          id: fallbackId,
          name: fallbackName,
          slug: fallbackSlug,
          subcategories: new Set(subCategory ? [subCategory] : []),
          image: "/placeholders/spices.svg",
          source: "product-fallback",
          isFallback: true,
        });
      } else {
        if (subCategory) {
          discoveredCategories.get(fallbackId)!.subcategories.add(subCategory);
        }
      }

      categoryDocCounts[fallbackId] = (categoryDocCounts[fallbackId] || 0) + 1;
      categorySlugCounts[fallbackSlug] = (categorySlugCounts[fallbackSlug] || 0) + 1;
    }
  }

  // 3. Transform into canonical Category array
  const categories: Category[] = Array.from(discoveredCategories.values()).map((entry) => {
    const count = categoryDocCounts[entry.id] || 0;
    return {
      id: entry.id,
      name: entry.name,
      tamilName: entry.tamilName,
      slug: entry.slug,
      itemCount: `${count} Item${count === 1 ? "" : "s"}`,
      image: entry.image,
      subcategories: Array.from(entry.subcategories),
      source: entry.source,
    };
  });

  const diagnostics: ProductionCategoryDiagnostics = {
    totalCategoryDocsRead: categoryDocs.length,
    firestoreCategoryDocIds: categoryDocs.map((d) => d.id),
    resolvedFromFirestoreCount: categoryDocs.filter((d) => (categoryDocCounts[d.id] || 0) > 0).length,
    fallbackCategoryCount: categories.filter((c) => c.source === "product-fallback").length,
    missingDocCategoryIds: Array.from(missingDocCategoryIds),
    conflicts,
    categoryDocCounts,
    categorySlugCounts,
    subcategoryCounts,
  };

  return {
    categories,
    rawCategoryDocs: categoryDocs,
    diagnostics,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Resolves production categories by reading Firestore category documents and correlating
 * them with product records.
 *
 * Requirements satisfied:
 * - Read production categories from Firestore only when explicitly enabled (`optIn: true`).
 * - Preserve actual category document ID, display name, slug, and parent/child relationships.
 * - Derive product category associations from the verified production schema.
 * - Use product category fields as a documented fallback when corresponding category doc is missing.
 * - Do not silently map unrelated production categories to hardcoded slugs like "organic-spices".
 * - Expose unresolved or conflicting category mappings in diagnostics.
 */
export async function resolveProductionCategories(
  options?: ProductionPreviewOptions & {
    products?: Array<Product | RawProductCategoryInput>;
    categoryDocs?: ProductionCategoryDoc[];
  }
): Promise<ProductionCategoryResolverResult> {
  const categoryDocs =
    options?.categoryDocs ?? (await fetchProductionCategoryDocs(options));
  return buildProductionCategoryResolution(categoryDocs, options);
}

/**
 * Resolves category fields for a single raw production product document using the
 * category lookup map derived from production Firestore.
 */
export function resolveProductCategoryMapping(
  rawDoc: Record<string, unknown>,
  categoryDocsMap: Map<string, ProductionCategoryDoc>,
  parentCategoryContext?: string
): {
  categoryId: string;
  category: string;
  categorySlug: string;
  subCategory?: string | undefined;
  isFallback: boolean;
} {
  const rawCategoryId = toCleanString(rawDoc["categoryId"]) || toCleanString(rawDoc["catId"]);
  const rawCategoryName =
    toCleanString(rawDoc["categoryName"]) ||
    toCleanString(rawDoc["category"]) ||
    parentCategoryContext;
  const subCategory =
    toCleanString(rawDoc["subCategory"]) ||
    toCleanString(rawDoc["subcategory"]);

  // 1. Try matching by categoryId
  if (rawCategoryId && categoryDocsMap.has(rawCategoryId)) {
    const doc = categoryDocsMap.get(rawCategoryId)!;
    return {
      categoryId: doc.id,
      category: doc.name,
      categorySlug: doc.slug || slugifyCategoryName(doc.name),
      subCategory: subCategory || doc.subcategories?.[0],
      isFallback: false,
    };
  }

  // 2. Try matching by categoryName
  if (rawCategoryName) {
    for (const doc of categoryDocsMap.values()) {
      if (doc.name.toLowerCase().trim() === rawCategoryName.toLowerCase().trim()) {
        return {
          categoryId: doc.id,
          category: doc.name,
          categorySlug: doc.slug || slugifyCategoryName(doc.name),
          subCategory: subCategory || doc.subcategories?.[0],
          isFallback: false,
        };
      }
    }
  }

  // 3. Fallback to raw product record values (documented fallback for missing category docs)
  const fallbackName = rawCategoryName || "Spices & Masala Powders";
  const fallbackSlug = slugifyCategoryName(fallbackName);
  const fallbackId = rawCategoryId || fallbackSlug;

  return {
    categoryId: fallbackId,
    category: fallbackName,
    categorySlug: fallbackSlug,
    subCategory,
    isFallback: true,
  };
}

