import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "../services/apiClient";
import { authManager } from "../services/authAdapter";
import { authService } from "../services/authService";
import { cartService } from "../services/cartService";
import { productService } from "../services/productService";
import { orderService } from "../services/orderService";
import { buildCartKey } from "../lib/productUtils";
import type { CartItem } from "../types";

const GUEST_CART_KEY = "sri_amman_guest_cart_v1";

describe("guest cart persistence and account merge", () => {
  beforeEach(() => {
    localStorage.clear();
    authManager.setMode("emulator");
    vi.spyOn(authService, "getCurrentUser").mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    authManager.resetMode();
    localStorage.clear();
  });

  it("persists guest item quantities and supports removing items after a reload", async () => {
    const product = await productService.getProductById("prod_groundnut_oil");
    expect(product).not.toBeNull();

    const added = await cartService.addToCart(product!, 0, 1);
    await cartService.addToCart(product!, 0, 1);
    expect((await cartService.getGuestCart())[0]?.stock).toBeGreaterThan(0);

    const stored = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || "[]") as CartItem[];
    expect(stored).toHaveLength(1);
    expect(stored[0]?.quantity).toBe(2);

    const restored = await cartService.getCart();
    expect(restored[0]?.id).toBe(added.id);
    expect(restored[0]?.quantity).toBe(2);

    await cartService.updateQuantity(added.id, 3);
    expect((await cartService.getCart())[0]?.quantity).toBe(3);
    await cartService.removeFromCart(added.id);
    expect(await cartService.getCart()).toEqual([]);
    expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
  });

  it("combines quantities with an existing customer item and clears guest data only after persistence", async () => {
    const product = await productService.getProductById("prod_groundnut_oil");
    expect(product).not.toBeNull();
    const option = product!.options[0]!;
    const key = buildCartKey(product!.id, 0, option.unit, option.unitSize);
    await cartService.addToCart(product!, 0, 2);

    let remoteCart: CartItem[] = [
      {
        id: key,
        cartKey: key,
        userId: "SASS0000104",
        productId: product!.id,
        optionIndex: 0,
        unit: option.unit,
        unitSize: option.unitSize,
        name: product!.name,
        price: option.offerPrice,
        mrp: option.mrp,
        quantity: 3,
        image: product!.imageUrl,
        stock: option.stock,
      },
    ];

    const originalGet = apiClient.get.bind(apiClient);
    vi.spyOn(apiClient, "get").mockImplementation(async (endpoint, params) =>
      endpoint === "/cart" ? (remoteCart as never) : originalGet(endpoint, params)
    );
    vi.spyOn(apiClient, "patch").mockImplementation(async (_endpoint, payload) => {
      remoteCart = remoteCart.map((item) =>
        item.cartKey === key ? { ...item, quantity: Number((payload as { quantity: number }).quantity) } : item
      );
      return remoteCart[0] as never;
    });
    const guestItems = await cartService.mergeGuestCart("SASS0000104");

    expect(guestItems).toHaveLength(1);
    expect(remoteCart).toHaveLength(1);
    expect(remoteCart[0]?.quantity).toBe(5);
    expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
  });

  it("retains a guest cart and retries a partially committed merge without double-counting", async () => {
    const product = await productService.getProductById("prod_groundnut_oil");
    expect(product).not.toBeNull();
    await cartService.addToCart(product!, 0, 2);

    let remoteCart: CartItem[] = [];
    const originalGet = apiClient.get.bind(apiClient);
    vi.spyOn(apiClient, "get").mockImplementation(async (endpoint, params) =>
      endpoint === "/cart" ? (remoteCart as never) : originalGet(endpoint, params)
    );
    vi.spyOn(apiClient, "post").mockImplementation(async (_endpoint, payload) => {
      remoteCart = [...remoteCart, payload as CartItem];
      if (remoteCart.length === 1) throw new Error("Simulated connection loss after write");
      return payload as never;
    });
    vi.spyOn(apiClient, "patch").mockImplementation(async (_endpoint, payload) => {
      const updated = remoteCart.map((item) => ({
        ...item,
        quantity: Number((payload as { quantity: number }).quantity),
      }));
      remoteCart = updated;
      return updated[0] as never;
    });

    await expect(cartService.mergeGuestCart("SASS0000104")).rejects.toThrow("Simulated connection loss");
    expect(localStorage.getItem(GUEST_CART_KEY)).not.toBeNull();

    const merged = await cartService.mergeGuestCart("SASS0000104");
    expect(merged).toHaveLength(1);
    expect(remoteCart).toHaveLength(1);
    expect(remoteCart[0]?.quantity).toBe(2);
    expect(localStorage.getItem(GUEST_CART_KEY)).toBeNull();
  });

  it("keeps unavailable products saved and blocks their account merge", async () => {
    const product = await productService.getProductById("prod_groundnut_oil");
    expect(product).not.toBeNull();
    await cartService.addToCart(product!, 0, 1);
    vi.spyOn(productService, "getProductById").mockResolvedValue(null);

    await expect(cartService.mergeGuestCart("SASS0000104")).rejects.toThrow("unavailable");
    expect(localStorage.getItem(GUEST_CART_KEY)).not.toBeNull();
  });

  it("rejects direct order creation from a guest identity", async () => {
    await expect(
      orderService.createOrder({ userId: "guest_unverified", cartItems: [] } as never)
    ).rejects.toThrow(/guest carts cannot place orders/i);
  });
});
