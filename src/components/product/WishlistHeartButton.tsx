import { useEffect, useState } from "react";

interface WishlistHeartButtonProps {
  active: boolean;
  onToggle: () => Promise<boolean> | boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  activeLabel?: string;
  labelClassName?: string;
  ariaLabel?: string;
  activeAriaLabel?: string;
  disabled?: boolean;
}

const particleIds = [0, 1, 2, 3, 4, 5];

export function WishlistHeartButton({
  active,
  onToggle,
  className = "",
  size = "md",
  label,
  activeLabel,
  labelClassName = "",
  ariaLabel,
  activeAriaLabel,
  disabled = false,
}: WishlistHeartButtonProps) {
  const [burstId, setBurstId] = useState(0);

  useEffect(() => {
    if (!burstId) return;
    const timer = window.setTimeout(() => setBurstId(0), 700);
    return () => window.clearTimeout(timer);
  }, [burstId]);

  const title = active
    ? (activeAriaLabel || activeLabel || "Remove from wishlist")
    : (ariaLabel || label || "Add to wishlist");
  const iconSize = size === "sm" ? 19 : size === "lg" ? 27 : 23;

  return (
    <button
      type="button"
      aria-label={title}
      aria-pressed={active}
      title={title}
      disabled={disabled}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        void Promise.resolve(onToggle()).then((added) => {
          if (added) setBurstId((current) => current + 1);
        }).catch(() => undefined);
      }}
      className={`wishlist-heart-button ${active ? "is-active" : ""} ${className}`}
    >
      <span className="wishlist-heart-icon-wrap" aria-hidden="true">
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 28 28"
          fill="none"
          className="wishlist-heart-icon"
        >
          <path
            d="M14 23.2 4.75 14.3C-.3 8.95 7.4 1.65 14 7.15c6.6-5.5 14.3 1.8 9.25 7.15L14 23.2Z"
            className="wishlist-heart-shape"
          />
        </svg>
        {!active && (
          <span className="wishlist-heart-plus">
            <svg viewBox="0 0 12 12" width="12" height="12">
              <path d="M6 2.2v7.6M2.2 6h7.6" />
            </svg>
          </span>
        )}
        {burstId > 0 && (
          <span className="wishlist-heart-particles" key={burstId}>
            {particleIds.map((id) => <span key={id}>♥</span>)}
          </span>
        )}
      </span>
      {label && <span className={labelClassName}>{active ? (activeLabel || label) : label}</span>}
    </button>
  );
}
