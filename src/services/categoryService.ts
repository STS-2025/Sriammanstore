import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase-config.jsx";
import type { Category } from "../types";

const CATEGORY_PLACEHOLDER = "/placeholders/grocery.svg";

function getStringField(data: Record<string, unknown>, fieldName: string): string | undefined {
  const value = data[fieldName];
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeCategoryImage(value?: string): string {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }
  }

  return CATEGORY_PLACEHOLDER;
}

function normalizeCategorySlug(value: unknown, fallbackName: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  return fallbackName
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategoryDoc(doc: Record<string, unknown>): Category {
  const id =
    getStringField(doc, "id") ||
    getStringField(doc, "slug") ||
    "category";

  const name = getStringField(doc, "name") || "Category";
  const slug = normalizeCategorySlug(doc["slug"], name);
  const image = normalizeCategoryImage(
    getStringField(doc, "image") || getStringField(doc, "bannerUrl") || undefined,
  );

  return {
    id,
    name,
    tamilName: getStringField(doc, "tamilName"),
    slug,
    itemCount:
      typeof doc["itemCount"] === "number"
        ? `${doc["itemCount"]} Items`
        : getStringField(doc, "itemCount") || "",
    image,
    description: getStringField(doc, "description"),
    displayOrder:
      typeof doc["displayOrder"] === "number" ? doc["displayOrder"] : undefined,
    isActive: doc["isActive"] !== false,
    showOnHomepage: doc["showOnHomepage"] !== false,
    subcategories:
      Array.isArray(doc["subcategories"])
        ? (doc["subcategories"] as unknown[])
            .filter((subcategory): subcategory is string => typeof subcategory === "string")
            .map((subcategory) => subcategory.trim())
            .filter((subcategory) => subcategory.length > 0)
        : undefined,
    source: "firestore-document",
  };
}

function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((left, right) => {
    const leftOrder =
      typeof left.displayOrder === "number" ? left.displayOrder : Number.MAX_SAFE_INTEGER;
    const rightOrder =
      typeof right.displayOrder === "number" ? right.displayOrder : Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
  });
}

export async function getHomepageCategories(): Promise<Category[]> {
  try {
    const categoriesRef = collection(db, "categories");
    const categoriesQuery = query(categoriesRef, orderBy("displayOrder", "asc"));
    const snapshot = await getDocs(categoriesQuery);

    const categories = snapshot.docs
      .map((documentSnapshot) => {
        const data = documentSnapshot.data() as Record<string, unknown>;
        return normalizeCategoryDoc({
          id: documentSnapshot.id,
          ...data,
        });
      })
      .filter((category) => category.isActive !== false)
      .filter((category) => category.showOnHomepage !== false)
      .filter((category) => Boolean(category.name));

    return sortCategories(categories);
  } catch {
    return [];
  }
}
