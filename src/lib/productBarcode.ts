/** Reads a product barcode for an order snapshot without adding it to storefront Product data. */
export function getProductBarcodeFromRawRecord(
  product: Record<string, unknown>,
  optionIndex = 0,
): string | null {
  const readBarcode = (record: unknown): string | null => {
    if (!record || typeof record !== "object" || Array.isArray(record)) return null;
    const value = (record as Record<string, unknown>)["barcode"];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return null;
  };

  // Match normalizeLegacyProduct's preference: options first, then variants.
  for (const field of ["options", "variants"] as const) {
    const optionRecords = product[field];
    if (Array.isArray(optionRecords)) {
      const barcode = readBarcode(optionRecords[optionIndex]);
      if (barcode) return barcode;
    }
  }

  return readBarcode(product);
}
