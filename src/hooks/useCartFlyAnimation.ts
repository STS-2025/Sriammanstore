import { useEffect, useState, type RefObject } from "react";

export const CART_ADD_ANIMATION_EVENT = "store:add-to-cart-animation";

export interface CartAddAnimationDetail {
  imageUrl: string;
  origin: { x: number; y: number };
}

export function useCartFlyAnimation(
  targetRef: RefObject<HTMLElement | null>,
  viewport: "mobile" | "desktop",
) {
  const [showAddedLabel, setShowAddedLabel] = useState(false);

  useEffect(() => {
    let labelTimer: number | undefined;
    const mediaQuery = window.matchMedia(viewport === "mobile" ? "(max-width: 767px)" : "(min-width: 768px)");

    const handleCartAdd = (event: Event) => {
      if (!mediaQuery.matches) return;
      const detail = (event as CustomEvent<CartAddAnimationDetail>).detail;
      const target = targetRef.current;
      if (!detail || !target || !detail.imageUrl) return;

      const targetRect = target.getBoundingClientRect();
      if (!targetRect.width || !targetRect.height) return;

      const dx = targetRect.left + targetRect.width / 2 - detail.origin.x;
      const dy = targetRect.top + targetRect.height / 2 - detail.origin.y;
      const image = document.createElement("img");
      image.src = detail.imageUrl;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      Object.assign(image.style, {
        position: "fixed",
        left: `${detail.origin.x - 34}px`,
        top: `${detail.origin.y - 34}px`,
        width: "68px",
        height: "68px",
        objectFit: "contain",
        borderRadius: "14px",
        padding: "5px",
        background: "white",
        boxShadow: "0 8px 24px rgba(0,0,0,.24)",
        pointerEvents: "none",
        zIndex: "120",
      });
      document.body.appendChild(image);

      const middleX = dx * 0.55 + (viewport === "mobile" ? 8 : 0);
      const middleY = dy * 0.55 - (viewport === "mobile" ? 22 : 82);
      const flyAnimation = image.animate(
        [
          { transform: "translate3d(0, 0, 0) scale(.82) rotate(0deg)", opacity: 0.75, offset: 0, easing: "ease-out" },
          { transform: "translate3d(0, -38px, 0) scale(1.16) rotate(-5deg)", opacity: 1, offset: 0.17, easing: "cubic-bezier(.2,.9,.3,1)" },
          { transform: `translate3d(${dx * 0.12}px, ${dy * 0.12 - 54}px, 0) scale(1.04) rotate(2deg)`, opacity: 1, offset: 0.34, easing: "ease-in-out" },
          {
            transform: `translate3d(${middleX}px, ${middleY}px, 0) scale(.68) rotate(${viewport === "mobile" ? 12 : -10}deg)`,
            opacity: 0.9,
            offset: 0.76,
            easing: "cubic-bezier(.35,0,.65,1)",
          },
          { transform: `translate3d(${dx}px, ${dy}px, 0) scale(.12) rotate(22deg)`, opacity: 0, offset: 1 },
        ],
        { duration: 1450, easing: "cubic-bezier(.22,.8,.3,1)", fill: "forwards" },
      );
      void flyAnimation.finished.catch(() => undefined).finally(() => image.remove());

      target.animate(
        [
          { transform: "translateX(0) rotate(0deg)" },
          { transform: "translateX(-4px) rotate(-9deg)" },
          { transform: "translateX(4px) rotate(9deg)" },
          { transform: "translateX(-3px) rotate(-5deg)" },
          { transform: "translateX(0) rotate(0deg)" },
        ],
        { duration: 720, easing: "ease-in-out" },
      );

      setShowAddedLabel(true);
      window.clearTimeout(labelTimer);
      labelTimer = window.setTimeout(() => setShowAddedLabel(false), 1600);
    };

    window.addEventListener(CART_ADD_ANIMATION_EVENT, handleCartAdd);
    return () => {
      window.removeEventListener(CART_ADD_ANIMATION_EVENT, handleCartAdd);
      window.clearTimeout(labelTimer);
    };
  }, [targetRef, viewport]);

  return showAddedLabel;
}
