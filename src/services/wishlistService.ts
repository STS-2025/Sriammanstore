import { apiClient } from "./apiClient";
import type { Product, Wishlist, WishlistProduct } from "../types";
import { customerIdentityService } from "./customerIdentityService";
import { cartService } from "./cartService";
import { productService } from "./productService";
import { resolveCustomerDataSource } from "./customerDataSourceResolver";
import { measureLoad } from "../lib/performanceDiagnostics";

export interface CustomerWishlistEntry {
  productId: string;
  productName: string;
  brandName?: string;
  imageUrl?: string;
  sellingPrice: number;
  mrp?: number;
  variantName?: string;
  addedAt?: unknown;
  isActive: boolean;
  categoryId?: string;
  categoryName?: string;
  sku?: string;
}

function asEntry(raw: Record<string, unknown>): CustomerWishlistEntry {
  const productId = String(raw["productId"] ?? raw["id"] ?? "").trim();
  return {
    productId,
    productName: String(raw["productName"] ?? "Saved product"),
    ...(typeof raw["brandName"] === "string" ? { brandName: raw["brandName"] } : {}),
    ...(typeof raw["imageUrl"] === "string" ? { imageUrl: raw["imageUrl"] } : {}),
    sellingPrice: Number(raw["sellingPrice"] ?? 0),
    ...(typeof raw["mrp"] === "number" ? { mrp: raw["mrp"] } : {}),
    ...(typeof raw["variantName"] === "string" ? { variantName: raw["variantName"] } : {}),
    ...(raw["addedAt"] !== undefined ? { addedAt: raw["addedAt"] } : {}),
    isActive: raw["isActive"] === true,
    ...(typeof raw["categoryId"] === "string" ? { categoryId: raw["categoryId"] } : {}),
    ...(typeof raw["categoryName"] === "string" ? { categoryName: raw["categoryName"] } : {}),
    ...(typeof raw["sku"] === "string" ? { sku: raw["sku"] } : {}),
  };
}

function asUiItem(entry: CustomerWishlistEntry, wishlistId = "all", userId = ""): WishlistProduct {
  const variantName = entry.variantName ?? "";
  const match = variantName.match(/^(.+?)\s+(g|kg|ml|L|pcs)$/i);
  return {
    id: entry.productId,
    wishlistId,
    userId,
    productId: entry.productId,
    optionIndex: 0,
    unit: match?.[2] ?? "",
    unitSize: match?.[1] ?? variantName,
    name: entry.productName,
    price: entry.sellingPrice,
    mrp: entry.mrp ?? entry.sellingPrice,
    image: entry.imageUrl ?? "",
    isActive: entry.isActive,
    ...(entry.brandName ? { brandName: entry.brandName } : {}),
    ...(entry.variantName ? { variantName: entry.variantName } : {}),
    ...(entry.addedAt !== undefined ? { addedAt: entry.addedAt } : {}),
  };
}

function asFolderUiItem(
  raw: Record<string, unknown>,
  customerId: string,
  wishlistId: string,
): WishlistProduct {
  const productId = String(raw["productId"] ?? raw["id"] ?? "").trim();
  const optionIndex = typeof raw["optionIndex"] === "number" ? raw["optionIndex"] : 0;
  return {
    id: productId,
    wishlistId,
    userId: customerId,
    productId,
    optionIndex,
    unit: String(raw["unit"] ?? ""),
    unitSize: String(raw["unitSize"] ?? ""),
    name: String(raw["name"] ?? raw["productName"] ?? "Saved product"),
    price: Number(raw["price"] ?? raw["sellingPrice"] ?? 0),
    mrp: Number(raw["mrp"] ?? raw["price"] ?? raw["sellingPrice"] ?? 0),
    image: String(raw["image"] ?? raw["imageUrl"] ?? ""),
    isActive: raw["isActive"] !== false,
    ...(typeof raw["brandName"] === "string" ? { brandName: raw["brandName"] } : {}),
    ...(typeof raw["variantName"] === "string" ? { variantName: raw["variantName"] } : {}),
    ...(raw["addedAt"] !== undefined ? { addedAt: raw["addedAt"] } : {}),
  };
}

function customerFacingStorageError(error: unknown): Error {
  const candidate = error as { code?: string; message?: string };
  const message = (candidate?.message || "").toLowerCase();
  if (candidate?.code === "permission-denied" || message.includes("permission") || message.includes("insufficient permissions")) {
    return new Error("Wishlist access is not available yet. Please try again later.");
  }
  if (candidate?.code === "unavailable" || message.includes("offline") || message.includes("network")) {
    return new Error("We couldn't connect to your wishlist. Check your connection and try again.");
  }
  return error instanceof Error ? error : new Error("Could not update your wishlist.");
}

async function resolveWishlistOwner(): Promise<{ customerId: string; adapter: ReturnType<typeof apiClient.getFirestoreAdapter> }> {
  const result = await customerIdentityService.resolveCurrentFirebaseUserProfile();
  if (result.status !== "resolved") {
    if (result.status === "unauthenticated") {
      throw new Error("Sign in with your Firebase customer account to use your wishlist.");
    }
    if (result.status === "unlinked") {
      throw new Error("This Firebase account is not linked to a store customer profile yet.");
    }
    if (result.status === "database_error") {
      throw new Error("We couldn't verify your customer profile with the store. Please try again.");
    }
    throw new Error("Your customer profile could not be verified. Please sign in again or contact support.");
  }
  if (result.mapping.collection !== "onlineCustomers") {
    throw new Error("This account is linked to a legacy customer profile. Wishlist access requires an online customer profile.");
  }
  if (
    !/^ONCUS\d{6,7}$/i.test(result.userDocId) ||
    result.mapping.userDocId !== result.userDocId ||
    result.profile.id !== result.userDocId
  ) {
    throw new Error("Your customer profile could not be verified. Please sign in again or contact support.");
  }
  return { customerId: result.userDocId, adapter: apiClient.getFirestoreAdapter() };
}

async function readEntries(): Promise<CustomerWishlistEntry[]> {
  const { customerId, adapter } = await resolveWishlistOwner();
  let rows: Record<string, unknown>[];
  try { rows = await adapter.getCustomerWishlistProducts(customerId); }
  catch (error) { throw customerFacingStorageError(error); }
  return rows.map(asEntry).filter((entry) => entry.productId);
}

export const wishlistService = {
  async getWishlists(_userId?: string): Promise<Wishlist[]> {
    const { customerId, adapter } = await resolveWishlistOwner();
    try {
      const rows = await adapter.getCustomerWishlists(customerId);
      return rows.map((row) => {
        const createdAt = row["createdAt"];
        const createdAtText = typeof createdAt === "string"
          ? createdAt
          : createdAt && typeof createdAt === "object" && "toDate" in createdAt && typeof createdAt.toDate === "function"
            ? (createdAt.toDate() as Date).toISOString()
            : new Date().toISOString();
        return {
          id: String(row["id"] ?? "").trim(),
          userId: customerId,
          title: String(row["title"] ?? row["name"] ?? "Wishlist").trim(),
          description: String(row["description"] ?? "").trim(),
          createdAt: createdAtText,
        };
      }).filter((wishlist) => wishlist.id);
    } catch (error) {
      throw customerFacingStorageError(error);
    }
  },
  async createWishlist(title: string, description = "", _userId?: string): Promise<Wishlist> {
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    if (!cleanTitle || cleanTitle.length > 256) throw new Error("Enter a folder name up to 256 characters.");

    const { customerId, adapter } = await resolveWishlistOwner();
    const rootEntries = (await adapter.getCustomerWishlistProducts(customerId))
      .map(asEntry)
      .filter((entry) => entry.productId && entry.isActive);
    const catalog = await productService.getProducts();
    const availableProducts = rootEntries.flatMap((entry) => {
      const product = catalog.find((candidate) => candidate.id === entry.productId);
      if (!product || product.isActive === false) return [];
      const savedVariant = entry.variantName?.trim().toLowerCase();
      const matchedIndex = product.options.findIndex((option) =>
        `${option.unitSize} ${option.unit}`.trim().toLowerCase() === savedVariant
      );
      const optionIndex = matchedIndex >= 0 ? matchedIndex : 0;
      const option = product.options[optionIndex];
      if (!option || option.stock <= 0) return [];
      const item: Record<string, unknown> = {
        productId: product.id,
        optionIndex,
        unit: option.unit,
        unitSize: String(option.unitSize),
        name: product.name,
        price: option.offerPrice,
        mrp: option.mrp,
        image: product.imageUrl || product.images?.[0] || entry.imageUrl || "",
        isActive: true,
        variantName: `${option.unitSize} ${option.unit}`.trim(),
        ...(product.brand ? { brandName: product.brand } : {}),
      };
      return [{ productId: product.id, payload: item }];
    });

    const randomId = globalThis.crypto?.randomUUID?.().replace(/-/g, "") || `${Date.now()}${Math.random().toString(36).slice(2)}`;
    const id = `wl_${randomId.slice(0, 24)}`;
    const wishlist: Wishlist = {
      id,
      userId: customerId,
      title: cleanTitle,
      description: cleanDescription,
      createdAt: new Date().toISOString(),
    };
    const createdProductIds: string[] = [];
    try {
      await adapter.createCustomerWishlist(customerId, id, wishlist as unknown as Record<string, unknown>);
      for (const product of availableProducts) {
        await adapter.saveCustomerWishlistFolderProduct(customerId, id, product.productId, product.payload);
        createdProductIds.push(product.productId);
      }
      return wishlist;
    } catch (error) {
      await Promise.allSettled(createdProductIds.map((productId) =>
        adapter.deleteCustomerWishlistFolderProduct(customerId, id, productId)
      ));
      await Promise.allSettled([adapter.deleteCustomerWishlist(customerId, id)]);
      throw customerFacingStorageError(error);
    }
  },
  async renameWishlist(id: string, title: string, description = ""): Promise<Wishlist> {
    const cleanTitle = title.trim();
    if (!cleanTitle || cleanTitle.length > 256) throw new Error("Enter a folder name up to 256 characters.");
    const { customerId, adapter } = await resolveWishlistOwner();
    const updated = { title: cleanTitle, description: description.trim() };
    try {
      await adapter.updateCustomerWishlist(customerId, id, updated);
      return { id, userId: customerId, ...updated, createdAt: new Date().toISOString() };
    } catch (error) { throw customerFacingStorageError(error); }
  },
  async deleteWishlist(id: string, _userId?: string): Promise<void> {
    const { customerId, adapter } = await resolveWishlistOwner();
    try {
      const products = await adapter.getCustomerWishlistFolderProducts(customerId, id);
      for (const product of products) {
        const productId = String(product["productId"] ?? product["id"] ?? "");
        if (!productId) continue;
        const price = Number(product["price"] ?? product["sellingPrice"] ?? 0);
        const rootPayload: Record<string, unknown> = {
          productId,
          productName: String(product["name"] ?? product["productName"] ?? "Saved product"),
          sellingPrice: price,
          mrp: Number(product["mrp"] ?? price),
          variantName: String(product["variantName"] ?? ""),
          imageUrl: String(product["image"] ?? product["imageUrl"] ?? ""),
          isActive: product["isActive"] !== false,
        };
        if (typeof product["brandName"] === "string") rootPayload["brandName"] = product["brandName"];
        await adapter.saveCustomerWishlistProduct(customerId, productId, rootPayload);
        await adapter.deleteCustomerWishlistFolderProduct(customerId, id, productId);
      }
      await adapter.deleteCustomerWishlist(customerId, id);
    } catch (error) { throw customerFacingStorageError(error); }
  },
  async moveProductToCollection(productId: string, targetWishlistId: string, sourceWishlistId = "all"): Promise<WishlistProduct> {
    const { customerId, adapter } = await resolveWishlistOwner();
    const sourceId = sourceWishlistId === "wl_default" ? "all" : sourceWishlistId;
    if (sourceId === targetWishlistId || (sourceId === "all" && targetWishlistId === "all")) {
      const current = (await this.getWishlistProducts(sourceId)).find((item) => item.productId === productId);
      if (current) return current;
      throw new Error("This saved product is no longer available.");
    }

    let source: Record<string, unknown> | undefined;
    if (sourceId === "all") {
      source = (await adapter.getCustomerWishlistProducts(customerId))
        .map((row) => ({ ...row, ...asEntry(row) }))
        .find((row) => String(row["productId"] ?? "") === productId);
    } else {
      source = (await adapter.getCustomerWishlistFolderProducts(customerId, sourceId))
        .find((row) => String(row["productId"] ?? row["id"] ?? "") === productId);
    }
    if (!source) throw new Error("This saved product is no longer available.");

    const variantName = String(source["variantName"] ?? "").trim();
    const productName = String(source["productName"] ?? source["name"] ?? "Saved product");
    const price = Number(source["sellingPrice"] ?? source["price"] ?? 0);
    const mrp = Number(source["mrp"] ?? price);
    if (targetWishlistId === "all" || targetWishlistId === "wl_default") {
      const rootPayload: Record<string, unknown> = {
        productId,
        productName,
        sellingPrice: price,
        mrp,
        variantName,
        imageUrl: String(source["imageUrl"] ?? source["image"] ?? ""),
        isActive: source["isActive"] !== false,
      };
      if (typeof source["brandName"] === "string") rootPayload["brandName"] = source["brandName"];
      await adapter.saveCustomerWishlistProduct(customerId, productId, rootPayload);
    } else {
      const folderPayload: Record<string, unknown> = {
        productId,
        optionIndex: typeof source["optionIndex"] === "number" ? source["optionIndex"] : 0,
        unit: String(source["unit"] ?? ""),
        unitSize: String(source["unitSize"] ?? ""),
        name: productName,
        price,
        mrp,
        image: String(source["image"] ?? source["imageUrl"] ?? ""),
        isActive: source["isActive"] !== false,
        variantName,
      };
      if (typeof source["brandName"] === "string") folderPayload["brandName"] = source["brandName"];
      await adapter.saveCustomerWishlistFolderProduct(customerId, targetWishlistId, productId, folderPayload);
    }

    if (sourceId === "all") await adapter.deleteCustomerWishlistProduct(customerId, productId);
    else await adapter.deleteCustomerWishlistFolderProduct(customerId, sourceId, productId);
    const saved = targetWishlistId === "all" || targetWishlistId === "wl_default"
      ? asUiItem(asEntry({ ...source, productId, productName, sellingPrice: price, mrp, variantName, isActive: true }), "all", customerId)
      : asFolderUiItem({ ...source, productId, name: productName, price, mrp, variantName }, customerId, targetWishlistId);
    return saved;
  },
  getEffectiveUserId(userId?: string): string {
    if (!userId?.trim()) return "";
    try { return resolveCustomerDataSource(userId).canonicalCustomerId; }
    catch { return userId.trim(); }
  },
  async getWishlistProducts(wishlistId?: string, _userId?: string): Promise<WishlistProduct[]> {
    return measureLoad("data wishlist", async () => {
      const { customerId, adapter } = await resolveWishlistOwner();
      try {
        if (wishlistId && wishlistId !== "all") {
          const rows = await adapter.getCustomerWishlistFolderProducts(customerId, wishlistId);
          return rows.map((row) => asFolderUiItem(row, customerId, wishlistId)).filter((item) => item.productId);
        }
        const roots = (await adapter.getCustomerWishlistProducts(customerId))
          .map(asEntry)
          .filter((entry) => entry.productId)
          .map((entry) => asUiItem(entry, "all", customerId));
        if (wishlistId === "all" || typeof adapter.getCustomerWishlists !== "function") return roots;
        const folders = await adapter.getCustomerWishlists(customerId);
        const folderItems = await Promise.all(folders.map(async (folder) => {
          const id = String(folder["id"] ?? "").trim();
          if (!id || typeof adapter.getCustomerWishlistFolderProducts !== "function") return [];
          const rows = await adapter.getCustomerWishlistFolderProducts(customerId, id);
          return rows.map((row) => asFolderUiItem(row, customerId, id)).filter((item) => item.productId);
        }));
        return [...roots, ...folderItems.flat()];
      } catch (error) {
        throw customerFacingStorageError(error);
      }
    });
  },

  async getCustomerWishlistEntries(): Promise<CustomerWishlistEntry[]> {
    return readEntries();
  },

  async toggleWishlistProduct(product: Product, optionIndex = 0, _wishlistId?: string, _userId?: string): Promise<{ added: boolean; item?: WishlistProduct }> {
    if (!product?.id || !product.name || product.isActive === false) throw new Error("This product is unavailable.");
    const { customerId, adapter } = await resolveWishlistOwner();
    const existing = (await adapter.getCustomerWishlistProducts(customerId))
      .map(asEntry)
      .find((entry) => entry.productId === product.id && entry.isActive);
    if (existing) {
      try { await adapter.deleteCustomerWishlistProduct(customerId, product.id); }
      catch (error) { throw customerFacingStorageError(error); }
      return { added: false };
    }
    const option = product.options?.[optionIndex] ?? product.options?.[0];
    if (!option) throw new Error("Product pricing is unavailable.");
    const entry: Record<string, unknown> = {
      productId: product.id,
      productName: product.name,
      ...(product.brand ? { brandName: product.brand } : {}),
      imageUrl: product.imageUrl || product.images?.[0] || "/placeholders/spices.svg",
      sellingPrice: option.offerPrice,
      ...(Number.isFinite(option.mrp) ? { mrp: option.mrp } : {}),
      variantName: `${option.unitSize} ${option.unit}`.trim(),
      isActive: true,
      ...(product.category ? { categoryName: product.category } : {}),
    };
    try { await adapter.saveCustomerWishlistProduct(customerId, product.id, entry); }
    catch (error) { throw customerFacingStorageError(error); }
    return { added: true, item: asUiItem(asEntry(entry), "all", customerId) };
  },

  async saveProductToWishlistFolder(product: Product, optionIndex: number, wishlistId: string): Promise<void> {
    if (!product?.id || !product.name || product.isActive === false) throw new Error("This product is unavailable.");
    const cleanWishlistId = wishlistId.trim();
    if (!cleanWishlistId || cleanWishlistId === "all" || cleanWishlistId === "wl_default") {
      throw new Error("Choose a wishlist folder.");
    }
    const option = product.options?.[optionIndex] ?? product.options?.[0];
    if (!option) throw new Error("Product pricing is unavailable.");
    const { customerId, adapter } = await resolveWishlistOwner();
    const payload: Record<string, unknown> = {
      productId: product.id,
      optionIndex,
      unit: option.unit,
      unitSize: String(option.unitSize),
      name: product.name,
      price: option.offerPrice,
      mrp: option.mrp,
      image: product.imageUrl || product.images?.[0] || "/placeholders/spices.svg",
      isActive: true,
      variantName: `${option.unitSize} ${option.unit}`.trim(),
      ...(product.brand ? { brandName: product.brand } : {}),
    };
    try {
      await adapter.saveCustomerWishlistFolderProduct(customerId, cleanWishlistId, product.id, payload);
    } catch (error) { throw customerFacingStorageError(error); }
  },

  async removeWishlistProduct(productId: string, wishlistId = "all"): Promise<void> {
    const { customerId, adapter } = await resolveWishlistOwner();
    try {
      if (wishlistId === "all" || wishlistId === "wl_default") {
        await adapter.deleteCustomerWishlistProduct(customerId, productId);
      } else {
        await adapter.deleteCustomerWishlistFolderProduct(customerId, wishlistId, productId);
      }
    }
    catch (error) { throw customerFacingStorageError(error); }
  },

  async moveAllToCart(wishlistId?: string, allProducts?: Product[], userId?: string, isVIP = false): Promise<number> {
    return (await this.moveAllInStockToCart(wishlistId, allProducts, userId, isVIP)).addedCount;
  },

  async moveAllInStockToCart(
    wishlistId?: string,
    allProducts?: Product[],
    _userId?: string,
    isVIP = false,
  ): Promise<{ addedCount: number; skippedCount: number; unavailableNames: string[] }> {
    let entries: CustomerWishlistEntry[];
    if (wishlistId && wishlistId !== "all" && wishlistId !== "wl_default") {
      const { customerId, adapter } = await resolveWishlistOwner();
      const rows = await adapter.getCustomerWishlistFolderProducts(customerId, wishlistId);
      entries = rows.map((row) => ({
        productId: String(row["productId"] ?? row["id"] ?? ""),
        productName: String(row["name"] ?? row["productName"] ?? "Saved product"),
        ...(typeof row["brandName"] === "string" ? { brandName: row["brandName"] } : {}),
        ...(typeof row["image"] === "string" ? { imageUrl: row["image"] } : {}),
        sellingPrice: Number(row["price"] ?? row["sellingPrice"] ?? 0),
        ...(typeof row["mrp"] === "number" ? { mrp: row["mrp"] } : {}),
        ...(typeof row["variantName"] === "string" ? { variantName: row["variantName"] } : {}),
        isActive: row["isActive"] !== false,
      })).filter((entry) => entry.productId);
    } else {
      entries = await readEntries();
    }
    const catalog = allProducts?.length ? allProducts : await productService.getProducts();
    const { customerId } = await resolveWishlistOwner();
    let addedCount = 0;
    let skippedCount = 0;
    const unavailableNames: string[] = [];
    for (const entry of entries) {
      const product = catalog.find((candidate) => candidate.id === entry.productId);
      const savedVariant = entry.variantName?.trim().toLowerCase();
      const matchedOptionIndex = product?.options?.findIndex((candidate) =>
        `${candidate.unitSize} ${candidate.unit}`.trim().toLowerCase() === savedVariant
      ) ?? -1;
      const optionIndex = matchedOptionIndex >= 0 ? matchedOptionIndex : 0;
      const option = product?.options?.[optionIndex];
      if (!product || product.isActive === false || !option || option.stock <= 0) {
        skippedCount++;
        unavailableNames.push(entry.productName);
        continue;
      }
      try {
        await cartService.addToCart(product, optionIndex, 1, customerId, isVIP);
        addedCount++;
      } catch {
        skippedCount++;
        unavailableNames.push(entry.productName);
      }
    }
    return { addedCount, skippedCount, unavailableNames };
  },
};
