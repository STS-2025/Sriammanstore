import React from "react";
import { useCart } from "../../context/CartContext";

export interface OrderBillSummaryProps {
  title?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  isSubmitting?: boolean;
  disabled?: boolean;
  mode?: "cart" | "checkout";
  className?: string;
}

export function OrderBillSummary({
  title,
  ctaText = "Proceed to Checkout",
  onCtaClick,
  isSubmitting = false,
  disabled = false,
  mode = "cart",
  className = "",
}: OrderBillSummaryProps) {
  const {
    items,
    cartCount,
    cartTotalMrp,
    cartTotalSavings,
    appliedCoupon,
    couponDiscount,
    coinsRedeemed,
    coinDiscount,
    deliverySpeed,
    deliveryFee,
    finalTotal,
    totalSavings,
    totalSavingsPercent,
  } = useCart();

  const isCheckout = mode === "checkout";
  const displayTitle =
    title || (isCheckout ? `Order Summary (${cartCount} ITEMS)` : "Bill Summary");

  return (
    <div
      data-testid="order-bill-summary"
      className={`bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-6 shadow-sm flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Title */}
        <h3 className="font-headline-sm text-lg font-extrabold text-on-surface mb-5">
          {displayTitle}
        </h3>

        {/* Pricing Rows */}
        <div className="space-y-3.5 text-xs">
          {/* Total Item MRP */}
          <div className="flex justify-between items-center text-on-surface-variant">
            <span>Total Item MRP</span>
            <span className="font-bold text-on-surface text-sm">
              ₹{cartTotalMrp.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Store Product Discount */}
          {cartTotalSavings > 0 && (
            <div className="flex justify-between items-center text-primary">
              <span className="flex items-center gap-1 font-medium">
                Store Product Discount
                <span
                  className="material-symbols-outlined text-[14px] text-outline cursor-help"
                  title="Savings calculated from item MRP difference"
                >
                  info
                </span>
              </span>
              <span className="font-extrabold text-sm">
                −₹{cartTotalSavings.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Coupon Discount */}
          {couponDiscount > 0 && appliedCoupon && (
            <div className="flex justify-between items-center text-primary">
              <span className="flex items-center gap-1.5 font-medium">
                Coupon ({appliedCoupon.code})
                <span className="bg-primary/10 text-primary text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                  PROMO
                </span>
              </span>
              <span className="font-extrabold text-sm">
                −₹{couponDiscount.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Coins Redeemed */}
          {coinDiscount > 0 && (
            <div className="flex justify-between items-center text-secondary">
              <span className="flex items-center gap-1.5 font-medium">
                Coins Redeemed ({coinsRedeemed} Smart Coins)
              </span>
              <span className="font-extrabold text-sm">
                −₹{coinDiscount.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Delivery Fee */}
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="flex items-center gap-1 font-medium">
              {deliverySpeed === "express" ? "Express Delivery Fee" : "Delivery Fee"}
              <span
                className="material-symbols-outlined text-[14px] text-outline cursor-help"
                title={
                  deliverySpeed === "express"
                    ? "Express 60-min delivery charge"
                    : "Standard consolidated delivery"
                }
              >
                info
              </span>
            </span>
            <span
              className={`font-bold text-sm ${
                deliveryFee === 0 ? "text-primary" : "text-on-surface"
              }`}
            >
              {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
            </span>
          </div>

          {/* Taxes & GST */}
          <div className="flex justify-between items-center text-on-surface-variant">
            <span className="font-medium">Taxes & GST</span>
            <span className="font-semibold text-on-surface text-xs">Included (₹0)</span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-outline-variant/20 my-4" />

        {/* Total Amount / Total Payable */}
        <div className="flex justify-between items-baseline mb-4">
          <div>
            <span className="font-headline-sm text-sm font-extrabold text-on-surface block">
              {isCheckout ? "Total Payable" : "Total Amount"}
            </span>
            <span className="text-[11px] text-on-surface-variant">
              {isCheckout
                ? "Includes all municipal surcharges"
                : "Inclusive of all local cess & packing"}
            </span>
          </div>
          <span
            data-testid="summary-final-total"
            className="font-price-card text-2xl font-black text-primary tracking-tight"
          >
            ₹{finalTotal.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Savings banner */}
        {totalSavings > 0 && (
          <div
            data-testid="summary-savings-banner"
            className="bg-primary/10 border border-primary/20 rounded-2xl p-3 mb-5"
          >
            <div className="flex items-center gap-2 text-primary font-bold text-xs">
              <span className="text-base">🎉</span>
              <span>
                You are saving ₹{totalSavings.toLocaleString("en-IN")} (
                {totalSavingsPercent}%) on this order!
              </span>
            </div>
            {isCheckout && (
              <p className="text-[11px] text-primary/80 mt-0.5 ml-6">
                Smart Store member guaranteed lowest price match
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action CTA & Trust lines */}
      <div>
        <button
          type="button"
          onClick={onCtaClick}
          disabled={disabled || isSubmitting || items.length === 0}
          className={`w-full py-3.5 px-6 rounded-2xl font-headline-sm text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] ${
            disabled || isSubmitting || items.length === 0
              ? "bg-surface-container-high text-outline cursor-not-allowed shadow-none"
              : "bg-primary text-white hover:bg-primary-container hover:shadow-lg cursor-pointer"
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Processing Order...</span>
            </div>
          ) : (
            <>
              <span>{ctaText}</span>
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </>
          )}
        </button>

        {/* Trust Badges below CTA */}
        {isCheckout ? (
          <div className="space-y-1.5 mt-4 pt-2 text-[11px] text-on-surface-variant font-medium">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px] text-primary">
                lock
              </span>
              <span>256-bit Bank Grade SSL Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px] text-primary">
                verified
              </span>
              <span>100% Secure UPI / Card Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px] text-primary">
                storefront
              </span>
              <span>Sri Amman Local Store Fulfillment Guarantee</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 mt-4 pt-1 text-[11px] text-on-surface-variant font-medium">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">
                lock
              </span>
              100% Safe Payments
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-primary">
                replay
              </span>
              Easy 24h Returns
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

