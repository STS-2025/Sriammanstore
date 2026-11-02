import type { Product } from "../types";

/**
 * Category affinity matrix defining complementary culinary relationships.
 * For example:
 * - Cooking oils complement spices, dal/pulses, and dairy/ghee.
 * - Rice and staples complement dals, oils, spices, and ghee.
 * - Beverages like filter coffee complement traditional jaggery/sugar and snacks.
 * - Spices complement cooking oils and staples.
 * - Vegetables complement cooking oils, spices, and lentils.
 */
export const COMPLEMENTARY_CATEGORY_MAP: Record<string, string[]> = {
  "cold-pressed-oils": ["organic-spices", "staples-grains", "dairy-breakfast"],
  "staples-grains": ["cold-pressed-oils", "organic-spices", "dairy-breakfast"],
  "beverages": ["staples-grains", "snacks-sweets", "dairy-breakfast"],
  "organic-spices": ["cold-pressed-oils", "staples-grains", "dairy-breakfast"],
  "fruits-veggies": ["cold-pressed-oils", "organic-spices", "staples-grains"],
  "snacks-sweets": ["beverages", "staples-grains", "cold-pressed-oils"],
  "dairy-breakfast": ["cold-pressed-oils", "organic-spices", "staples-grains", "beverages"],
};

/**
 * Curated product-level affinity pairings for authentic South Indian kitchen staples.
 * When specific pairings match, they receive prioritized complementary ranking.
 */
export const SPECIFIC_PRODUCT_COMPLEMENTS: Record<string, string[]> = {
  // Wood pressed groundnut oil pairs naturally with turmeric powder, toor dal, A2 ghee, and ponni rice
  prod_groundnut_oil: [
    "prod_organic_turmeric",
    "prod_unpolished_toor_dal",
    "prod_a2_ghee",
    "prod_ponni_rice",
  ],
  // Gingelly sesame oil pairs with idli/dosa staples, jaggery/sugar, and turmeric
  prod_sesame_oil: [
    "prod_organic_turmeric",
    "prod_unpolished_toor_dal",
    "prod_ponni_rice",
    "prod_country_sugar",
  ],
  // A2 Desi Cow Ghee pairs with rice, dal, spices, and groundnut oil
  prod_a2_ghee: [
    "prod_ponni_rice",
    "prod_unpolished_toor_dal",
    "prod_organic_turmeric",
    "prod_groundnut_oil",
  ],
  // Tanjore Ponni Rice pairs with toor dal, groundnut oil, turmeric, and ghee
  prod_ponni_rice: [
    "prod_unpolished_toor_dal",
    "prod_groundnut_oil",
    "prod_organic_turmeric",
    "prod_a2_ghee",
  ],
  // Unpolished Toor Dal pairs with ponni rice, groundnut oil, turmeric, and ghee
  prod_unpolished_toor_dal: [
    "prod_ponni_rice",
    "prod_groundnut_oil",
    "prod_organic_turmeric",
    "prod_a2_ghee",
  ],
  // Pure Country Sugar pairs naturally with degree filter coffee, kai murukku, and A2 ghee
  prod_country_sugar: [
    "prod_filter_coffee",
    "prod_murukku",
    "prod_a2_ghee",
    "prod_ponni_rice",
  ],
  // Kumbakonam Degree Filter Coffee pairs with country sugar, kai murukku, and country eggs
  prod_filter_coffee: [
    "prod_country_sugar",
    "prod_murukku",
    "prod_country_eggs",
  ],
  // Pollachi Tender Coconut pairs with traditional snacks and fresh produce
  prod_tender_coconut: [
    "prod_murukku",
    "prod_ooty_carrots",
    "prod_country_sugar",
  ],
  // Turmeric powder pairs with cooking oils, dal, rice, and ghee
  prod_organic_turmeric: [
    "prod_groundnut_oil",
    "prod_unpolished_toor_dal",
    "prod_ponni_rice",
    "prod_a2_ghee",
  ],
  // Ooty carrots pair with cooking oil, spices, and lentils
  prod_ooty_carrots: [
    "prod_groundnut_oil",
    "prod_organic_turmeric",
    "prod_unpolished_toor_dal",
    "prod_country_eggs",
  ],
  // Country chicken eggs pair with groundnut oil, turmeric, and breakfast coffee
  prod_country_eggs: [
    "prod_groundnut_oil",
    "prod_organic_turmeric",
    "prod_filter_coffee",
    "prod_ponni_rice",
  ],
  // Kai Murukku pairs with degree filter coffee and country sugar
  prod_murukku: [
    "prod_filter_coffee",
    "prod_country_sugar",
    "prod_sesame_oil",
  ],
};

/**
 * Helper to check if a product has at least one option with available stock.
 */
export function hasAvailableStock(product: Product): boolean {
  if (!product.options || product.options.length === 0) return false;
  return product.options.some((opt) => opt.stock > 0);
}

/**
 * Calculates a similarity score between a target product and a candidate product.
 * Returns 0 if unrelated.
 */
export function calculateSimilarityScore(
  target: Product,
  candidate: Product
): number {
  if (candidate.id === target.id || candidate.isActive === false) {
    return 0;
  }

  let score = 0;

  // 1. Category match (strongest similarity indicator)
  if (candidate.categorySlug === target.categorySlug) {
    score += 50;
  }

  // 2. Shared tags match
  if (target.tags && candidate.tags) {
    const targetTagSet = new Set(target.tags.map((t) => t.toLowerCase().trim()));
    const matchingTags = candidate.tags.filter((t) =>
      targetTagSet.has(t.toLowerCase().trim())
    );
    score += matchingTags.length * 15;
  }

  // 3. Extraction method keyword similarity
  if (target.extraction && candidate.extraction) {
    const targetExtWords = target.extraction.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const candidateExtWords = new Set(candidate.extraction.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    let sharedExtCount = 0;
    for (const word of targetExtWords) {
      if (candidateExtWords.has(word)) {
        sharedExtCount++;
      }
    }
    score += Math.min(sharedExtCount * 5, 15);
  }

  // 4. Brand continuity
  if (target.brand && candidate.brand && target.brand === candidate.brand) {
    score += 5;
  }

  // If there's neither category match nor shared tags/extraction, consider unrelated
  // We do not recommend unrelated items merely to fill a row.
  if (candidate.categorySlug !== target.categorySlug && score < 20) {
    return 0;
  }

  // 5. In-stock boost (prefer in-stock products, but preserve valid catalog candidates)
  if (hasAvailableStock(candidate)) {
    score += 10;
  } else {
    score -= 10;
  }

  return score;
}

/**
 * Returns similar products for a given target product.
 * Excludes the current product and unrelated items.
 */
export function getSimilarProducts(
  target: Product,
  allProducts: Product[],
  options: { limit?: number } = {}
): Product[] {
  const limit = options.limit ?? 4;

  const scoredCandidates: { product: Product; score: number }[] = [];

  for (const candidate of allProducts) {
    const score = calculateSimilarityScore(target, candidate);
    if (score > 0) {
      scoredCandidates.push({ product: candidate, score });
    }
  }

  // Sort descending by score, tie-break by rating, then review count
  scoredCandidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.product.rating !== a.product.rating) {
      return b.product.rating - a.product.rating;
    }
    return (b.product.reviewCount || 0) - (a.product.reviewCount || 0);
  });

  return scoredCandidates.slice(0, limit).map((c) => c.product);
}

/**
 * Calculates a complementary affinity score between target product and candidate product.
 */
export function calculateComplementaryScore(
  target: Product,
  candidate: Product,
  excludeIds: Set<string>
): number {
  if (
    candidate.id === target.id ||
    candidate.isActive === false ||
    excludeIds.has(candidate.id)
  ) {
    return 0;
  }

  let score = 0;

  // 1. Direct product-level affinity pairing (highest priority)
  const directPairings = SPECIFIC_PRODUCT_COMPLEMENTS[target.id];
  if (directPairings) {
    const pairIndex = directPairings.indexOf(candidate.id);
    if (pairIndex !== -1) {
      // Top pairing gets highest weight
      score += (directPairings.length - pairIndex) * 25 + 50;
    }
  }

  // 2. Category-level affinity pairing
  const complementaryCategories = COMPLEMENTARY_CATEGORY_MAP[target.categorySlug];
  if (complementaryCategories) {
    const catIndex = complementaryCategories.indexOf(candidate.categorySlug);
    if (catIndex !== -1) {
      score += (complementaryCategories.length - catIndex) * 15 + 20;
    }
  }

  // 3. Different category bonus (completing the basket usually means diverse categories)
  if (candidate.categorySlug !== target.categorySlug) {
    score += 10;
  }

  // Minimum threshold: Must have an actual complementary relationship
  if (score < 25) {
    return 0;
  }

  // 4. In-stock preference
  if (hasAvailableStock(candidate)) {
    score += 15;
  } else {
    score -= 15;
  }

  return score;
}

/**
 * Returns complementary products for completing a traditional kitchen basket.
 * Excludes the target product, inactive products, and any explicitly excluded IDs.
 */
export function getComplementaryProducts(
  target: Product,
  allProducts: Product[],
  options: { limit?: number; excludeIds?: string[] } = {}
): Product[] {
  const limit = options.limit ?? 4;
  const excludeSet = new Set(options.excludeIds || []);

  const scoredCandidates: { product: Product; score: number }[] = [];

  for (const candidate of allProducts) {
    const score = calculateComplementaryScore(target, candidate, excludeSet);
    if (score > 0) {
      scoredCandidates.push({ product: candidate, score });
    }
  }

  // Sort descending by score, tie-break by rating, then review count
  scoredCandidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.product.rating !== a.product.rating) {
      return b.product.rating - a.product.rating;
    }
    return (b.product.reviewCount || 0) - (a.product.reviewCount || 0);
  });

  return scoredCandidates.slice(0, limit).map((c) => c.product);
}

