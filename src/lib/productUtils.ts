/**
 * Builds the canonical cart item key verified from the production codebase:
 * `${productId}__opt${optionIndex}__${unit}__${unitSize}`
 */
export function buildCartKey(
  productId: string,
  optionIndex: number,
  unit: string,
  unitSize: string
): string {
  return `${productId}__opt${optionIndex}__${unit}__${unitSize}`;
}

export function parseCartKey(cartKey: string): {
  productId: string;
  optionIndex: number;
  unit: string;
  unitSize: string;
} | null {
  const [productId, rawOption, unit, unitSize] = cartKey.split("__");
  if (
    productId === undefined ||
    rawOption === undefined ||
    unit === undefined ||
    unitSize === undefined
  ) {
    return null;
  }
  const optionIndex = parseInt(rawOption.replace("opt", ""), 10) || 0;
  return { productId, optionIndex, unit, unitSize };
}

