import { useCallback, useEffect, useRef, useState } from "react";
import { productService } from "../../services/productService";
import type { OrderItem, Product } from "../../types";

export const ORDER_PRODUCT_FALLBACK = "/placeholders/spices.svg";
const productImageCache = new Map<string, Promise<string[]>>();
const failedProductImageSources = new Set<string>();

/** Convert stored public-file references to browser paths without changing valid URLs. */
export function normalizeProductImageSource(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const source = value.trim();
  if (!source || /^(?:\.\/|\/)?(?:public\/)?assets\/images\/placeholder\.jpg(?:[?#].*)?$/i.test(source)) return null;

  if (source.startsWith("/9j/")) return `data:image/jpeg;base64,${source}`;
  if (source.startsWith("iVBORw0KGgo")) return `data:image/png;base64,${source}`;
  if (source.startsWith("R0lGOD")) return `data:image/gif;base64,${source}`;
  if (source.startsWith("UklGR")) return `data:image/webp;base64,${source}`;
  if (/^(https?:\/\/|data:image\/)/i.test(source)) return source;
  if (source.startsWith("/")) {
    return source.startsWith("/public/") ? source.slice("/public".length) : source;
  }
  if (source.startsWith("./")) return `/${source.slice(2)}`;
  if (source.startsWith("public/")) return `/${source.slice("public/".length)}`;
  if (/^[a-z][a-z\d+.-]*:/i.test(source)) return null;
  return `/${source}`;
}

function uniqueImageSources(values: unknown[]): string[] {
  return [...new Set(values.map(normalizeProductImageSource)
    .filter((source): source is string => source !== null && !failedProductImageSources.has(source)))];
}

function snapshotSources(item: OrderItem): string[] {
  return uniqueImageSources([item.image, ...(item.imageCandidates || [])]);
}

function getCatalogueImages(product: Product): string[] {
  return uniqueImageSources([product.imageUrl, ...(product.images || [])]);
}

function loadCatalogueImages(productId: string): Promise<string[]> {
  if (!productId) return Promise.resolve([]);
  const cached = productImageCache.get(productId);
  if (cached) return cached;

  const request = productService.getProductById(productId)
    .then((product) => product ? getCatalogueImages(product) : [])
    .catch(() => []);
  productImageCache.set(productId, request);
  return request;
}

export function OrderProductImage({ item, className, alt = item.name }: {
  item: OrderItem;
  className: string;
  alt?: string;
}) {
  const [src, setSrc] = useState(() => snapshotSources(item)[0] || ORDER_PRODUCT_FALLBACK);
  const catalogueSources = useRef<string[]>([]);
  const alternateSnapshotSources = useRef<string[]>([]);
  const failedSources = useRef(new Set<string>());
  const catalogueAttempted = useRef(false);
  const requestGeneration = useRef(0);
  const snapshotKey = `${item.productId}|${item.image}|${(item.imageCandidates || []).join("|")}`;

  useEffect(() => {
    const generation = requestGeneration.current + 1;
    requestGeneration.current = generation;
    const candidates = snapshotSources(item);
    failedSources.current = new Set();
    catalogueSources.current = [];
    alternateSnapshotSources.current = candidates.slice(1);
    catalogueAttempted.current = false;
    setSrc(candidates[0] || ORDER_PRODUCT_FALLBACK);

    if (candidates.length === 0 && item.productId) {
      catalogueAttempted.current = true;
      void loadCatalogueImages(item.productId).then((catalogueImages) => {
        if (requestGeneration.current !== generation) return;
        catalogueSources.current = catalogueImages;
        const next = catalogueSources.current.find((candidate) => !failedSources.current.has(candidate))
          || alternateSnapshotSources.current.find((candidate) => !failedSources.current.has(candidate));
        setSrc(next || ORDER_PRODUCT_FALLBACK);
      });
    }

    return () => {
      requestGeneration.current += 1;
    };
  }, [snapshotKey]);

  const handleImageError = useCallback(async () => {
    if (src === ORDER_PRODUCT_FALLBACK || failedSources.current.has(src)) return;
    failedSources.current.add(src);
    failedProductImageSources.add(src);

    if (!catalogueAttempted.current && item.productId) {
      catalogueAttempted.current = true;
      const generation = requestGeneration.current;
      const catalogueImages = await loadCatalogueImages(item.productId);
      if (requestGeneration.current !== generation) return;
      catalogueSources.current = catalogueImages;
    }

    const next = catalogueSources.current.find((candidate) => !failedSources.current.has(candidate))
      || alternateSnapshotSources.current.find((candidate) => !failedSources.current.has(candidate));
    setSrc(next || ORDER_PRODUCT_FALLBACK);
  }, [item.productId, src]);

  const handleImageLoad = useCallback(() => {
    failedProductImageSources.delete(src);
  }, [src]);

  return <img
    src={src}
    alt={alt}
    className={className}
    loading="lazy"
    onLoad={handleImageLoad}
    onError={() => void handleImageError()}
  />;
}
