import type { Product, ProductOption } from "../types";

/**
 * Optional metadata context when normalizing a product document retrieved from
 * a nested Firestore path (such as `products/{category}/items/{productId}`).
 */
export interface LegacyProductContext {
  /** Category derived from parent collection/document path if missing on the item itself */
  parentCategory?: string | undefined;
  /** Document ID derived from Firestore snapshot (`doc.id`) if missing in `doc.data()` */
  docId?: string | undefined;
  /** Full or relative Firestore document path (e.g. `products/Cold Pressed Oils/items/oil_01`) */
  documentPath?: string | undefined;
  /** Explicit resolved category from database-driven resolver */
  resolvedCategory?: string | undefined;
  /** Explicit resolved category slug from database-driven resolver */
  resolvedCategorySlug?: string | undefined;
  /** Explicit resolved subcategory from database-driven resolver */
  resolvedSubCategory?: string | undefined;
}

/**
 * Canonical mapping from legacy/display category names to the new frontend's
 * established `categorySlug` values (`db.json` / `categories` collection).
 */
const KNOWN_CATEGORY_SLUGS: Record<string, string> = {
  "cold pressed oils": "cold-pressed-oils",
  "cold pressed oils & ghee": "cold-pressed-oils",
  "oils & ghee": "cold-pressed-oils",
  "marachekku oils": "cold-pressed-oils",
  "oils": "cold-pressed-oils",
  "rice & staples": "staples-grains",
  "staples & grains": "staples-grains",
  "rice & grains": "staples-grains",
  "grains & staples": "staples-grains",
  "pulses & dals": "staples-grains",
  "staples": "staples-grains",
  "farm fresh veggies": "fruits-veggies",
  "fresh fruits": "fruits-veggies",
  "fruits & veggies": "fruits-veggies",
  "fruits & vegetables": "fruits-veggies",
  "fresh fruits & veggies": "fruits-veggies",
  "vegetables": "fruits-veggies",
  "fruits": "fruits-veggies",
  "fresh produce": "fruits-veggies",
  "organic spices": "organic-spices",
  "spices & masalas": "organic-spices",
  "spices & masala powders": "organic-spices",
  "masala & spice powders": "organic-spices",
  "spices": "organic-spices",
  "masalas": "organic-spices",
  "sambar": "organic-spices",
  "grocery": "staples-grains",
  "dairy & paneer": "dairy-breakfast",
  "dairy & breakfast": "dairy-breakfast",
  "dairy": "dairy-breakfast",
  "eggs & dairy": "dairy-breakfast",
  "snacks & sweets": "snacks-sweets",
  "traditional snacks": "snacks-sweets",
  "snacks": "snacks-sweets",
  "sweets": "snacks-sweets",
  "beverages": "beverages",
  "drinks & beverages": "beverages",
  "coffee & tea": "beverages",
};

const STRICT_NUMERIC_STRING_RE = /^[+-]?\d+(?:\.\d+)?$/;
const COMBINED_UNIT_SIZE_RE = /^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)(?:\s+(?:pack|packet|bottle|tin|can|jar|box|bag|pouch))?$/i;
const PACK_OF_RE = /^pack\s+of\s+(\d+)$/i;
const NESTED_PRODUCT_PATH_RE = /^\/?products\/([^/]+)\/items\/([^/]+)\/?$/;
const LEGACY_MRP_KEY_RE = /^mrp\d+$/i;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickFirstString(
  record: Record<string, unknown>,
  keys: readonly string[]
): string | null {
  for (const key of keys) {
    const str = getNonEmptyString(record[key]);
    if (str !== null) {
      return str;
    }
  }
  return null;
}

/**
 * Strictly parses a finite number from a `number` or an unambiguous numeric string.
 * Rejects booleans, arrays, objects, currency symbols, trailing text, `NaN`, and `Infinity`.
 */
export function parseStrictNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!STRICT_NUMERIC_STRING_RE.test(trimmed)) {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parsePositiveNumber(value: unknown): number | null {
  const num = parseStrictNumber(value);
  return num !== null && num > 0 ? num : null;
}

function parseNonNegativeNumber(value: unknown): number | null {
  const num = parseStrictNumber(value);
  return num !== null && num >= 0 ? num : null;
}

function pickFirstPositiveNumber(
  record: Record<string, unknown>,
  keys: readonly string[]
): number | null {
  for (const key of keys) {
    const num = parsePositiveNumber(record[key]);
    if (num !== null) {
      return num;
    }
  }
  return null;
}

function pickMrpNumber(record: Record<string, unknown>): number | null {
  const standard = pickFirstPositiveNumber(record, ["mrp", "originalPrice"]);
  if (standard !== null) {
    return standard;
  }
  // Support legacy malformed MRP keys observed in sri-amman-smart-store (e.g. `mrp12`)
  const mrpKeys = Object.keys(record)
    .filter((k) => LEGACY_MRP_KEY_RE.test(k))
    .sort();
  for (const key of mrpKeys) {
    const num = parsePositiveNumber(record[key]);
    if (num !== null) {
      return num;
    }
  }
  return null;
}

/**
 * Converts a category name into a canonical frontend `categorySlug`.
 */
export function deriveCategorySlug(
  categoryName: string,
  explicitSlug?: unknown
): string {
  const validExplicit = getNonEmptyString(explicitSlug);
  if (validExplicit !== null) {
    return validExplicit;
  }
  const normalizedKey = categoryName.toLowerCase().trim();
  const mapped = KNOWN_CATEGORY_SLUGS[normalizedKey];
  if (mapped) {
    return mapped;
  }
  const slugified = normalizedKey
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slugified.length > 0 ? slugified : "uncategorized";
}

function parseCombinedUnitString(
  raw: string
): { unitSize: string; unit: string } | null {
  const trimmed = raw.trim();
  const match = COMBINED_UNIT_SIZE_RE.exec(trimmed);
  if (match && match[1] && match[2]) {
    const num = parsePositiveNumber(match[1]);
    if (num !== null) {
      return { unitSize: match[1], unit: match[2] };
    }
  }
  const packMatch = PACK_OF_RE.exec(trimmed);
  if (packMatch && packMatch[1]) {
    const num = parsePositiveNumber(packMatch[1]);
    if (num !== null) {
      return { unitSize: packMatch[1], unit: "pcs" };
    }
  }
  return null;
}

function extractUnitSizeToken(value: unknown): string | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? String(value) : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    const num = parsePositiveNumber(trimmed);
    if (num !== null) {
      return trimmed;
    }
  }
  return null;
}

function cleanUnitContainerSuffix(raw: string): string {
  const stripped = raw
    .replace(/\s+(?:pack|packet|bottle|tin|can|jar|box|bag|pouch|pieces|pcs)$/i, "")
    .trim();
  return stripped.length > 0 ? stripped : raw.trim();
}

function normalizeUnitToken(unit: string): string {
  const clean = unit.trim().toLowerCase();
  if (clean === "g" || clean === "gm" || clean === "gms" || clean === "gram" || clean === "grams") return "g";
  if (clean === "kg" || clean === "kgs" || clean === "kilo" || clean === "kilogram" || clean === "kilograms") return "kg";
  if (clean === "ml" || clean === "mls" || clean === "milliliter" || clean === "milliliters") return "ml";
  if (clean === "l" || clean === "ltr" || clean === "ltrs" || clean === "liter" || clean === "liters" || clean === "litre" || clean === "litres") return "L";
  if (clean === "pcs" || clean === "pc" || clean === "piece" || clean === "pieces" || clean === "pack" || clean === "packet") return "pcs";
  return unit.trim();
}

/**
 * Extracts `{ unit, unitSize }` from a legacy variant or frontend option record.
 * Handles legacy combined pack labels such as "20g Pack" without confusing numeric size and unit,
 * even when legacy placeholder weights (e.g. weight: 500) exist in the document.
 * Returns `null` if no unambiguous unit and size can be determined.
 */
export function extractOptionUnitAndSize(
  rawVariant: Record<string, unknown>
): { unit: string; unitSize: string } | null {
  const rawUnit = getNonEmptyString(rawVariant["unit"]);

  // 1. First priority: Check if `unit` itself contains a combined size and unit (e.g. "20g Pack", "500g Pack", "Pack of 6")
  if (rawUnit !== null) {
    const combinedInUnit = parseCombinedUnitString(rawUnit);
    if (combinedInUnit) {
      return {
        unitSize: combinedInUnit.unitSize,
        unit: normalizeUnitToken(combinedInUnit.unit),
      };
    }
  }

  // 2. Second priority: Check if `name`, `label`, `packSize`, or `unitSize` contains a combined pack string
  // (e.g. name: "20g Pack" takes precedence over a legacy placeholder weight: 500)
  const candidateStrings = [
    rawVariant["name"],
    rawVariant["label"],
    rawVariant["packSize"],
    rawVariant["unitSize"],
    rawVariant["size"],
  ];

  for (const candidate of candidateStrings) {
    const str = getNonEmptyString(candidate);
    if (str !== null) {
      const parsed = parseCombinedUnitString(str);
      if (parsed !== null) {
        const finalUnit =
          rawUnit !== null && !parseCombinedUnitString(rawUnit)
            ? normalizeUnitToken(cleanUnitContainerSuffix(rawUnit))
            : normalizeUnitToken(parsed.unit);
        return {
          unitSize: parsed.unitSize,
          unit: finalUnit,
        };
      }
    }
  }

  // 3. Third priority: Explicit numeric unitSize/weight + clean unit string
  const rawUnitSize =
    extractUnitSizeToken(rawVariant["unitSize"]) ??
    extractUnitSizeToken(rawVariant["weight"]) ??
    extractUnitSizeToken(rawVariant["size"]) ??
    extractUnitSizeToken(rawVariant["netWeight"]);

  if (rawUnitSize !== null && rawUnit !== null) {
    const cleanUnit = normalizeUnitToken(cleanUnitContainerSuffix(rawUnit));
    return { unitSize: rawUnitSize, unit: cleanUnit };
  }

  return null;
}

function findMatchingOptionOfferPrice(
  rawProduct: Record<string, unknown> | undefined,
  unit: string,
  unitSize: string,
  index: number
): number | null {
  if (!rawProduct) return null;
  const offerZoneActive =
    rawProduct["offerZone"] === true || rawProduct["showOfferBand"] === true;
  if (!offerZoneActive) return null;

  const optionOffers = rawProduct["optionOfferPrices"];
  if (!Array.isArray(optionOffers) || optionOffers.length === 0) {
    return null;
  }

  // First try matching by unit + unitSize (or combined name)
  for (const entry of optionOffers) {
    if (!isPlainRecord(entry)) continue;
    const entryUnitAndSize = extractOptionUnitAndSize(entry);
    if (
      entryUnitAndSize &&
      entryUnitAndSize.unit.toLowerCase() === unit.toLowerCase() &&
      entryUnitAndSize.unitSize === unitSize
    ) {
      const matchedPrice = pickFirstPositiveNumber(entry, [
        "offerPrice",
        "sellingPrice",
        "price",
      ]);
      if (matchedPrice !== null) {
        return matchedPrice;
      }
    }
  }

  // Fall back to positional index matching (as done in legacy productUtils.jsx)
  const indexedEntry = optionOffers[index];
  if (isPlainRecord(indexedEntry)) {
    return pickFirstPositiveNumber(indexedEntry, [
      "offerPrice",
      "sellingPrice",
      "price",
    ]);
  }

  return null;
}

/**
 * Safely resolves physical available stock for a product option.
 *
 * Conflict & Precedence Rules:
 * 1. Fail-closed: If rawVariant or matchingVariant is explicitly marked out of stock
 *    (outOfStock: true, inStock: false, or variantStock === 0), returns 0.
 * 2. Primary: Option stock (customer-facing allocated stock) if defined and positive.
 * 3. Fallback: Matching variant stock (POS live inventory) if option stock is missing/unspecified.
 * 4. Fallback: Root product stock for single-variant products if both option and variant stock are missing.
 * 5. Default: Strictly 0. Never invent positive stock when missing or malformed.
 */
function resolveOptionStock(
  rawVariant: Record<string, unknown>,
  rawProduct?: Record<string, unknown>,
  index = 0
): number {
  if (
    rawVariant["outOfStock"] === true ||
    rawVariant["inStock"] === false
  ) {
    return 0;
  }

  // Root-level outOfStock or inStock flags take precedence to prevent selling depleted products
  if (
    rawProduct &&
    (rawProduct["outOfStock"] === true || rawProduct["inStock"] === false)
  ) {
    return 0;
  }

  const variantStockKeys = ["stock", "availableStock", "quantity"] as const;

  const extractStockVal = (source: Record<string, unknown> | undefined): number | null => {
    if (!source) return null;
    if (source["outOfStock"] === true || source["inStock"] === false) {
      return 0;
    }
    for (const key of variantStockKeys) {
      if (source[key] !== undefined && source[key] !== null) {
        const parsed = parseNonNegativeNumber(source[key]);
        if (parsed !== null) return Math.floor(parsed);
      }
    }
    return null;
  };

  const optionStock = extractStockVal(rawVariant);

  let matchingVariantRecord: Record<string, unknown> | undefined;
  if (rawProduct && Array.isArray(rawProduct["variants"])) {
    const candidate = rawProduct["variants"][index];
    if (isPlainRecord(candidate)) {
      matchingVariantRecord = candidate;
    }
  }
  const variantStock = extractStockVal(matchingVariantRecord);

  // If physical store variant explicitly says out of stock (0 or flag), fail closed to 0
  if (matchingVariantRecord) {
    if (
      matchingVariantRecord["outOfStock"] === true ||
      matchingVariantRecord["inStock"] === false ||
      variantStock === 0
    ) {
      return 0;
    }
  }

  // 1. Primary: Option stock (allocated e-commerce stock)
  if (optionStock !== null) {
    return optionStock;
  }

  // 2. Secondary fallback: Matching variant stock
  if (variantStock !== null) {
    return variantStock;
  }

  // 3. Tertiary fallback: Root stock for single-option products
  const totalOptions = Array.isArray(rawProduct?.["options"]) ? rawProduct!["options"].length : 0;
  const totalVariants = Array.isArray(rawProduct?.["variants"]) ? rawProduct!["variants"].length : 0;
  const isSingleOption = totalOptions <= 1 && totalVariants <= 1;
  const rootStock = isSingleOption ? extractStockVal(rawProduct) : null;
  if (rootStock !== null) {
    return rootStock;
  }

  // Default: Never invent positive stock
  return 0;
}

/**
 * Normalizes a single legacy variant or frontend option into a `ProductOption`.
 *
 * Price Precedence (`offerPrice` on `ProductOption` = regular customer selling price):
 * 1. Matching `optionOfferPrices` entry when `offerZone` or `showOfferBand` is `true`
 * 2. Variant `offerPrice`
 * 3. Root `offerPrice` when `offerZone` / `showOfferBand` is `true` and `optionOfferPrices` is absent (for first/single variant)
 * 4. Variant `sellingPrice`
 * 5. Variant `price`
 * 6. Root `offerPrice` -> `sellingPrice` -> `price` (fallback when variant has no price field)
 *
 * Returns `null` if unit/size or a valid positive selling price cannot be determined.
 */
export function normalizeLegacyProductOption(
  rawVariant: unknown,
  index = 0,
  rawProduct?: Record<string, unknown>,
  totalVariants = 1
): ProductOption | null {
  if (!isPlainRecord(rawVariant)) {
    return null;
  }

  const unitAndSize =
    extractOptionUnitAndSize(rawVariant) ??
    (rawProduct && totalVariants === 1
      ? extractOptionUnitAndSize(rawProduct)
      : null);

  if (!unitAndSize) {
    return null;
  }

  const { unit, unitSize } = unitAndSize;

  const rawProductVariants = Array.isArray(rawProduct?.["variants"])
    ? (rawProduct["variants"] as unknown[])
    : [];
  const matchingRawVariant = rawProductVariants.find((candidate) => {
    if (!isPlainRecord(candidate)) return false;
    const candidateUnitAndSize = extractOptionUnitAndSize(candidate);
    return (
      candidateUnitAndSize !== null &&
      candidateUnitAndSize.unit.toLowerCase() === unit.toLowerCase() &&
      candidateUnitAndSize.unitSize === unitSize
    );
  });
  const correspondingRawVariant =
    (isPlainRecord(matchingRawVariant) ? matchingRawVariant : null) ??
    (isPlainRecord(rawProductVariants[index]) ? rawProductVariants[index] : null);

  const optionOfferOverride = findMatchingOptionOfferPrice(
    rawProduct,
    unit,
    unitSize,
    index
  );

  const variantOfferPrice = parsePositiveNumber(rawVariant["offerPrice"]);
  const variantSellingPrice = parsePositiveNumber(rawVariant["sellingPrice"]);
  const variantPrice = parsePositiveNumber(rawVariant["price"]);

  const offerZoneActive =
    rawProduct?.["offerZone"] === true ||
    rawProduct?.["showOfferBand"] === true;
  const hasOptionOffersArray =
    Array.isArray(rawProduct?.["optionOfferPrices"]) &&
    (rawProduct?.["optionOfferPrices"] as unknown[]).length > 0;
  const rootOfferPrice = rawProduct
    ? parsePositiveNumber(rawProduct["offerPrice"])
    : null;
  const rootSellingPrice = rawProduct
    ? parsePositiveNumber(rawProduct["sellingPrice"])
    : null;
  const rootPrice = rawProduct
    ? parsePositiveNumber(rawProduct["price"])
    : null;

  let offerPrice: number | null = null;
  if (optionOfferOverride !== null) {
    offerPrice = optionOfferOverride;
  } else if (variantOfferPrice !== null) {
    offerPrice = variantOfferPrice;
  } else if (
    offerZoneActive &&
    !hasOptionOffersArray &&
    rootOfferPrice !== null &&
    (totalVariants === 1 || index === 0)
  ) {
    offerPrice = rootOfferPrice;
  } else if (variantSellingPrice !== null) {
    offerPrice = variantSellingPrice;
  } else if (variantPrice !== null) {
    offerPrice = variantPrice;
  } else if (rootOfferPrice !== null) {
    offerPrice = rootOfferPrice;
  } else if (rootSellingPrice !== null) {
    offerPrice = rootSellingPrice;
  } else if (rootPrice !== null) {
    offerPrice = rootPrice;
  }

  if (offerPrice === null || offerPrice <= 0) {
    return null;
  }

  // Use the first available MRP that is valid for this option's offer price.
  const mrp =
    [
      pickMrpNumber(rawVariant),
      correspondingRawVariant ? pickMrpNumber(correspondingRawVariant) : null,
      rawProduct ? pickMrpNumber(rawProduct) : null,
    ].find((candidate): candidate is number => candidate !== null && candidate >= offerPrice) ??
    offerPrice;

  // Resolve optional VIP / special price: variant -> product (must be strictly lower than offerPrice)
  const rawSpecialPrice =
    pickFirstPositiveNumber(rawVariant, [
      "specialPrice",
      "vipPrice",
      "memberPrice",
    ]) ??
    (rawProduct
      ? pickFirstPositiveNumber(rawProduct, [
          "specialPrice",
          "vipPrice",
          "memberPrice",
        ])
      : null);
  const specialPrice =
    rawSpecialPrice !== null && rawSpecialPrice < offerPrice
      ? rawSpecialPrice
      : null;

  const stock = resolveOptionStock(rawVariant, rawProduct, index);

  const normalizedOption: ProductOption = {
    unit,
    unitSize,
    mrp,
    offerPrice,
    stock,
    ...(specialPrice !== null ? { specialPrice } : {}),
  };

  return normalizedOption;
}

function sanitizeImageUrl(raw: unknown): string | null {
  const str = getNonEmptyString(raw);
  if (!str) return null;

  // Raw Base64 string without data URI scheme (check before relative path checks since JPEG starts with /9j/)
  if (str.startsWith("/9j/")) {
    return `data:image/jpeg;base64,${str}`;
  }
  if (str.startsWith("iVBORw0KGgo")) {
    return `data:image/png;base64,${str}`;
  }
  if (str.startsWith("R0lGOD")) {
    return `data:image/gif;base64,${str}`;
  }
  if (str.startsWith("UklGR")) {
    return `data:image/webp;base64,${str}`;
  }

  if (
    str.startsWith("http://") ||
    str.startsWith("https://") ||
    str.startsWith("data:image/") ||
    str.startsWith("/") ||
    str.startsWith("./")
  ) {
    return str;
  }

  return str;
}

function collectProductImages(
  rawDoc: Record<string, unknown>,
  rawVariants: unknown[]
): { imageUrl: string; images: string[] } {
  const primaryCandidate =
    pickFirstString(rawDoc, ["imageUrl", "frontImageUrl", "image"]) ??
    (Array.isArray(rawDoc["images"])
      ? rawDoc["images"].map(getNonEmptyString).find((s) => s !== null) ?? null
      : null) ??
    (Array.isArray(rawDoc["imageUrls"])
      ? rawDoc["imageUrls"].map(getNonEmptyString).find((s) => s !== null) ??
        null
      : null) ??
    getNonEmptyString(rawDoc["backImageUrl"]);

  const seen = new Set<string>();
  const pushImage = (val: unknown) => {
    const str = sanitizeImageUrl(val);
    if (str !== null && !seen.has(str)) {
      seen.add(str);
    }
  };

  if (primaryCandidate !== null) {
    pushImage(primaryCandidate);
  }

  if (Array.isArray(rawDoc["images"])) {
    for (const item of rawDoc["images"]) pushImage(item);
  }
  if (Array.isArray(rawDoc["imageUrls"])) {
    for (const item of rawDoc["imageUrls"]) pushImage(item);
  }

  pushImage(rawDoc["imageUrl"]);
  pushImage(rawDoc["frontImageUrl"]);
  pushImage(rawDoc["backImageUrl"]);
  pushImage(rawDoc["image"]);

  for (const v of rawVariants) {
    if (isPlainRecord(v)) {
      pushImage(v["imageUrl"]);
      pushImage(v["frontImageUrl"]);
      pushImage(v["image"]);
    }
  }

  const images = Array.from(seen);
  const imageUrl = images[0] ?? "";
  return { imageUrl, images };
}

function normalizeTags(rawDoc: Record<string, unknown>): string[] {
  const seen = new Set<string>();
  const addTokens = (source: unknown) => {
    if (Array.isArray(source)) {
      for (const item of source) {
        const str = getNonEmptyString(item);
        if (str !== null) seen.add(str);
      }
    } else if (typeof source === "string") {
      for (const part of source.split(",")) {
        const str = getNonEmptyString(part);
        if (str !== null) seen.add(str);
      }
    }
  };

  addTokens(rawDoc["tags"]);
  addTokens(rawDoc["keywords"]);
  return Array.from(seen);
}

function resolveIsActive(rawDoc: Record<string, unknown>): boolean {
  if (rawDoc["deleted"] === true || rawDoc["isDeleted"] === true) {
    return false;
  }
  if (typeof rawDoc["isActive"] === "boolean") {
    return rawDoc["isActive"];
  }
  if (typeof rawDoc["active"] === "boolean") {
    return rawDoc["active"];
  }
  const status = getNonEmptyString(rawDoc["status"])?.toLowerCase();
  if (status) {
    if (
      status === "inactive" ||
      status === "archived" ||
      status === "disabled" ||
      status === "draft"
    ) {
      return false;
    }
    if (
      status === "active" ||
      status === "published" ||
      status === "enabled"
    ) {
      return true;
    }
  }
  return true;
}

function resolveFlashDealMetadata(rawDoc: Record<string, unknown>): {
  isFlashDeal?: boolean;
  flashDiscount?: string;
} {
  let isFlashDeal: boolean | undefined;
  if (typeof rawDoc["isFlashDeal"] === "boolean") {
    isFlashDeal = rawDoc["isFlashDeal"];
  } else if (typeof rawDoc["offerZone"] === "boolean") {
    isFlashDeal = rawDoc["offerZone"];
  } else if (typeof rawDoc["showOfferBand"] === "boolean") {
    isFlashDeal = rawDoc["showOfferBand"];
  }

  let flashDiscount: string | undefined;
  const badgeText = pickFirstString(rawDoc, [
    "flashDiscount",
    "offerBadgeText",
    "offerText",
  ]);
  if (badgeText !== null) {
    flashDiscount = badgeText;
  } else {
    const discountNum = parsePositiveNumber(rawDoc["discountPercent"]);
    if (discountNum !== null && discountNum <= 100) {
      flashDiscount = `${discountNum}% OFF`;
    } else {
      const discountStr = getNonEmptyString(rawDoc["discountPercent"]);
      if (discountStr !== null && discountStr.includes("%")) {
        flashDiscount = discountStr;
      } else if (
        isFlashDeal === true &&
        Array.isArray(rawDoc["optionOfferPrices"])
      ) {
        for (const entry of rawDoc["optionOfferPrices"]) {
          if (isPlainRecord(entry)) {
            const optDisc = parsePositiveNumber(entry["discountPercent"]);
            if (optDisc !== null && optDisc <= 100) {
              flashDiscount = `${optDisc}% OFF`;
              break;
            }
          }
        }
      }
    }
  }

  return {
    ...(isFlashDeal !== undefined ? { isFlashDeal } : {}),
    ...(flashDiscount !== undefined ? { flashDiscount } : {}),
  };
}

function normalizeNutrition(
  rawDoc: Record<string, unknown>
): Record<string, string> | undefined {
  const candidate =
    rawDoc["nutrition"] ??
    rawDoc["nutritionalInfo"] ??
    rawDoc["nutritionFacts"];
  if (!isPlainRecord(candidate)) {
    return undefined;
  }
  const result: Record<string, string> = {};
  let count = 0;
  for (const [key, val] of Object.entries(candidate)) {
    const cleanKey = key.trim();
    if (!cleanKey) continue;
    const strVal =
      getNonEmptyString(val) ??
      (typeof val === "number" && Number.isFinite(val) ? String(val) : null);
    if (strVal !== null) {
      result[cleanKey] = strVal;
      count++;
    }
  }
  return count > 0 ? result : undefined;
}

function parseNestedPathMetadata(
  rawDoc: Record<string, unknown>,
  context?: LegacyProductContext
): { pathCategory: string | null; pathDocId: string | null } {
  const candidatePath =
    getNonEmptyString(context?.documentPath) ??
    pickFirstString(rawDoc, ["_path", "documentPath", "path"]);
  if (!candidatePath) {
    return { pathCategory: null, pathDocId: null };
  }
  const match = NESTED_PRODUCT_PATH_RE.exec(candidatePath);
  if (!match || !match[1] || !match[2]) {
    return { pathCategory: null, pathDocId: null };
  }
  try {
    return {
      pathCategory: decodeURIComponent(match[1]).trim() || null,
      pathDocId: decodeURIComponent(match[2]).trim() || null,
    };
  } catch {
    return {
      pathCategory: match[1].trim() || null,
      pathDocId: match[2].trim() || null,
    };
  }
}

/**
 * Normalizes a raw product document (from either the current frontend schema,
 * the legacy top-level `products/{id}` schema, or a retrieved nested
 * `products/{category}/items/{id}` document) into a strict `Product`.
 *
 * Returns `null` if the document is not an object, lacks a valid identifier or name,
 * or has zero usable variants/options.
 */
export function normalizeLegacyProduct(
  rawDoc: unknown,
  context?: LegacyProductContext
): Product | null {
  if (!isPlainRecord(rawDoc)) {
    return null;
  }

  const { pathCategory, pathDocId } = parseNestedPathMetadata(rawDoc, context);

  // 1. Identifier precedence: id -> productId -> sku -> _docId -> context.docId -> pathDocId
  const id =
    pickFirstString(rawDoc, ["id", "productId", "sku", "_docId"]) ??
    getNonEmptyString(context?.docId) ??
    pathDocId;
  if (!id) {
    return null;
  }

  // 2. Product Name precedence: name -> productName -> title
  const name = pickFirstString(rawDoc, ["name", "productName", "title"]);
  if (!name) {
    return null;
  }

  // 3. Tamil Name precedence: tamilName -> nameTamil
  const tamilName = pickFirstString(rawDoc, ["tamilName", "nameTamil"]);

  // 4. Category precedence:
  // If context provides database-driven category resolution from production resolver, prioritize it
  const subCategory =
    context?.resolvedSubCategory ??
    pickFirstString(rawDoc, ["subCategory", "subcategory"]);

  let category: string;
  let categorySlug: string;

  if (context?.resolvedCategory && context?.resolvedCategorySlug) {
    category = context.resolvedCategory;
    categorySlug = context.resolvedCategorySlug;
  } else {
    let rawCategoryCandidate = pickFirstString(rawDoc, [
      "category",
      "categoryName",
      "parentCategory",
      "_parentCategory",
    ]);

    if (
      subCategory &&
      (!rawCategoryCandidate ||
        rawCategoryCandidate.trim().toLowerCase() === "grocery" ||
        rawCategoryCandidate.trim().toLowerCase() === "general")
    ) {
      rawCategoryCandidate = subCategory;
    }

    category =
      rawCategoryCandidate ??
      getNonEmptyString(context?.parentCategory) ??
      pathCategory ??
      "Uncategorized";

    categorySlug = deriveCategorySlug(category, rawDoc["categorySlug"]);
  }

  // 5. Brand precedence: brand -> brandName -> ""
  const brand = pickFirstString(rawDoc, ["brand", "brandName"]) ?? "";

  // 6. Description precedence: description -> desc -> details -> ""
  const description =
    pickFirstString(rawDoc, ["description", "desc", "details"]) ?? "";

  // 7. Options / Variants normalization
  // Precedence: valid `options[]` -> valid `variants[]` -> single root-level option (only if root has valid unit/size + price)
  let options: ProductOption[] = [];
  const rawOptions = Array.isArray(rawDoc["options"]) ? rawDoc["options"] : [];
  const rawVariants = Array.isArray(rawDoc["variants"])
    ? rawDoc["variants"]
    : [];

  if (rawOptions.length > 0) {
    options = rawOptions
      .map((opt, idx) =>
        normalizeLegacyProductOption(opt, idx, rawDoc, rawOptions.length)
      )
      .filter((opt): opt is ProductOption => opt !== null);
  }

  if (options.length === 0 && rawVariants.length > 0) {
    options = rawVariants
      .map((variant, idx) =>
        normalizeLegacyProductOption(variant, idx, rawDoc, rawVariants.length)
      )
      .filter((opt): opt is ProductOption => opt !== null);
  }

  if (options.length === 0 && rawOptions.length === 0 && rawVariants.length === 0) {
    const rootOption = normalizeLegacyProductOption(rawDoc, 0, rawDoc, 1);
    if (rootOption !== null) {
      options = [rootOption];
    }
  }

  // A product with no usable variants/options cannot be safely priced or added to cart
  if (options.length === 0) {
    return null;
  }

  // 8. Images
  const { imageUrl, images } = collectProductImages(rawDoc, [
    ...rawOptions,
    ...rawVariants,
  ]);

  // 9. Rating & Review Count (preserve valid 0, never invent ratings)
  const rawRating =
    parseStrictNumber(rawDoc["rating"]) ??
    parseStrictNumber(rawDoc["averageRating"]) ??
    parseStrictNumber(rawDoc["avgRating"]);
  const rating =
    rawRating !== null && rawRating >= 0 && rawRating <= 5 ? rawRating : 0;

  const rawReviewCount =
    parseNonNegativeNumber(rawDoc["reviewCount"]) ??
    parseNonNegativeNumber(rawDoc["ratingCount"]) ??
    parseNonNegativeNumber(rawDoc["reviewsCount"]);
  const reviewCount =
    rawReviewCount !== null ? Math.floor(rawReviewCount) : 0;

  // 10. Tags, Active Flag, Offer Metadata, Origin, Extraction, Nutrition, Customer-Facing Details
  const tags = normalizeTags(rawDoc);
  const isActive = resolveIsActive(rawDoc);
  const { isFlashDeal, flashDiscount } = resolveFlashDealMetadata(rawDoc);
  const origin = pickFirstString(rawDoc, ["origin", "Origin", "sourceOrigin"]);
  const extraction = pickFirstString(rawDoc, [
    "extraction",
    "extractionMethod",
    "process",
  ]);
  const nutrition = normalizeNutrition(rawDoc);
  const ingredients = pickFirstString(rawDoc, [
    "ingredients",
    "ingredientList",
    "contents",
  ]);
  const fssaiNumber = pickFirstString(rawDoc, [
    "fssaiNumber",
    "fssai",
    "fssaiLicense",
    "fssaiLicNo",
  ]);
  const gstRate =
    parseNonNegativeNumber(rawDoc["gstRate"]) ??
    parseNonNegativeNumber(rawDoc["gst"]);
  const hsnCode = pickFirstString(rawDoc, ["hsnCode", "hsn", "hsn_code"]);
  const isNew =
    typeof rawDoc["isNew"] === "boolean" ? rawDoc["isNew"] : undefined;
  const isBestSeller =
    typeof rawDoc["isBestSeller"] === "boolean"
      ? rawDoc["isBestSeller"]
      : typeof rawDoc["isBestseller"] === "boolean"
      ? rawDoc["isBestseller"]
      : undefined;
  const isFeatured =
    typeof rawDoc["isFeatured"] === "boolean" ? rawDoc["isFeatured"] : undefined;
  const isOffer =
    typeof rawDoc["isOffer"] === "boolean" ? rawDoc["isOffer"] : undefined;

  const product: Product = {
    id,
    name,
    ...(tamilName !== null ? { tamilName } : {}),
    category,
    categorySlug,
    ...(subCategory !== null ? { subCategory } : {}),
    brand,
    rating,
    reviewCount,
    description,
    imageUrl,
    images,
    options,
    tags,
    isActive,
    ...(isFlashDeal !== undefined ? { isFlashDeal } : {}),
    ...(flashDiscount !== undefined ? { flashDiscount } : {}),
    ...(origin !== null ? { origin } : {}),
    ...(extraction !== null ? { extraction } : {}),
    ...(nutrition !== undefined ? { nutrition } : {}),
    ...(ingredients !== null ? { ingredients } : {}),
    ...(fssaiNumber !== null ? { fssaiNumber } : {}),
    ...(gstRate !== null ? { gstRate } : {}),
    ...(hsnCode !== null ? { hsnCode } : {}),
    ...(isNew !== undefined ? { isNew } : {}),
    ...(isBestSeller !== undefined ? { isBestSeller } : {}),
    ...(isFeatured !== undefined ? { isFeatured } : {}),
    ...(isOffer !== undefined ? { isOffer } : {}),
  };

  return product;
}

/**
 * Normalizes a list of raw product documents (or a legacy category container
 * containing an `items` array/map), filtering out invalid or un-renderable entries.
 */
export function normalizeLegacyProductList(
  rawDocs: unknown,
  context?: LegacyProductContext
): Product[] {
  if (!Array.isArray(rawDocs)) {
    return [];
  }

  const results: Product[] = [];
  for (const item of rawDocs) {
    // Support category container documents that embed an `items` array or map
    if (
      isPlainRecord(item) &&
      item["items"] !== undefined &&
      pickFirstString(item, ["name", "productName", "title"]) === null
    ) {
      const nestedProducts = extractNestedCategoryProducts(
        item,
        context?.parentCategory
      );
      results.push(...nestedProducts);
      continue;
    }

    const normalized = normalizeLegacyProduct(item, context);
    if (normalized !== null) {
      results.push(normalized);
    }
  }
  return results;
}

/**
 * Normalizes nested product documents retrieved from a `products/{category}`
 * container or `products/{category}/items/{productId}` subcollection snapshot list.
 */
export function extractNestedCategoryProducts(
  rawCategoryDocOrItems: unknown,
  parentCategory?: string
): Product[] {
  if (Array.isArray(rawCategoryDocOrItems)) {
    return normalizeLegacyProductList(
      rawCategoryDocOrItems,
      parentCategory !== undefined ? { parentCategory } : undefined
    );
  }

  if (!isPlainRecord(rawCategoryDocOrItems)) {
    return [];
  }

  const derivedCategory =
    pickFirstString(rawCategoryDocOrItems, [
      "category",
      "categoryName",
      "name",
      "id",
    ]) ?? parentCategory;

  const rawItems = rawCategoryDocOrItems["items"];
  if (Array.isArray(rawItems)) {
    return normalizeLegacyProductList(
      rawItems,
      derivedCategory !== undefined ? { parentCategory: derivedCategory } : undefined
    );
  }

  if (isPlainRecord(rawItems)) {
    const results: Product[] = [];
    for (const [itemId, itemData] of Object.entries(rawItems)) {
      if (!isPlainRecord(itemData)) continue;
      const normalized = normalizeLegacyProduct(itemData, {
        docId: itemId,
        ...(derivedCategory !== undefined
          ? { parentCategory: derivedCategory }
          : {}),
      });
      if (normalized !== null) {
        results.push(normalized);
      }
    }
    return results;
  }

  return [];
}

