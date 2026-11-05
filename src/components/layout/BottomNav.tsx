import { Link, useRouterState } from "@tanstack/react-router";
import { useRef } from "react";
import { useCart } from "../../context/CartContext";
import { useCartFlyAnimation } from "../../hooks/useCartFlyAnimation";

export function BottomNav() {
  const { cartCount, cartSubtotal } = useCart();
  const mobileCartTargetRef = useRef<HTMLSpanElement>(null);
  const showMobileCartAdded = useCartFlyAnimation(mobileCartTargetRef, "mobile");
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isActive = (path: string) => {
    if (path === "/" && currentPath === "/") return true;
    if (path !== "/" && currentPath.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Floating cart teaser pill if cart has items and not currently on cart/checkout */}
      {cartCount > 0 && !currentPath.includes("/cart") && !currentPath.includes("/checkout") && (
        <div className="fixed bottom-[calc(4.25rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 px-4 md:hidden">
          <Link
            to="/cart"
            className="flex items-center justify-between bg-primary text-on-primary px-4 py-3 rounded-2xl shadow-xl animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
              <span className="font-headline-sm text-sm font-bold">
                {cartCount} item{cartCount > 1 ? "s" : ""}
              </span>
              <span className="opacity-80 text-xs">• ₹{cartSubtotal}</span>
            </div>
            <div className="flex items-center gap-1 font-headline-sm text-sm font-bold">
              <span>View Cart</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </div>
          </Link>
        </div>
      )}

      {/* 5-Tab Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest border-t border-outline-variant/20 px-2 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] md:hidden shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-5 items-center">
          <Link
            to="/"
            className={`flex min-h-11 flex-col items-center py-1 transition-colors ${
              isActive("/") ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={isActive("/") ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              home
            </span>
            <span className="text-[10px] font-medium mt-0.5">Home</span>
          </Link>

          <Link
            to="/shop"
            className={`flex min-h-11 flex-col items-center py-1 transition-colors ${
              isActive("/shop") ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={isActive("/shop") ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              storefront
            </span>
            <span className="text-[10px] font-medium mt-0.5">Shop</span>
          </Link>

          <Link
            to="/cart"
            className={`relative flex min-h-11 flex-col items-center py-1 transition-colors ${
              isActive("/cart") ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span ref={mobileCartTargetRef} className="relative inline-flex">
              <span
                className="material-symbols-outlined text-[22px]"
                style={isActive("/cart") ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                shopping_bag
              </span>
              {showMobileCartAdded && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 animate-fade-in text-[10px] font-black text-primary">
                  +1
                </span>
              )}
            </span>
            {cartCount > 0 && (
              <span className="absolute top-1 right-3 bg-primary text-on-primary text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
            <span className="text-[10px] font-medium mt-0.5">Cart</span>
          </Link>

          <Link
            to="/orders"
            search={{} as any}
            className={`flex min-h-11 flex-col items-center py-1 transition-colors ${
              isActive("/orders") ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={isActive("/orders") ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              receipt_long
            </span>
            <span className="text-[10px] font-medium mt-0.5">Orders</span>
          </Link>

          <Link
            to="/account"
            className={`flex min-h-11 flex-col items-center py-1 transition-colors ${
              isActive("/account") ? "text-primary font-bold" : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={isActive("/account") ? { fontVariationSettings: "'FILL' 1" } : {}}
            >
              person
            </span>
            <span className="text-[10px] font-medium mt-0.5">Account</span>
          </Link>
        </div>
      </nav>
    </>
  );
}

