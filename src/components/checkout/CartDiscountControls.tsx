import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useCart } from "../../context/CartContext";

interface CartDiscountControlsProps {
  className?: string;
  accordionOnMobile?: boolean;
}

export function CartDiscountControls({ className = "", accordionOnMobile = false }: CartDiscountControlsProps) {
  const {
    appliedCoupon,
    couponDiscount,
    applyCoupon,
    removeCoupon,
    redeemCoins,
    coinsToRedeem,
    coinsAvailable,
    checkoutSettings,
    coinValueInRupees,
    setRedeemCoins,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [isCouponChecking, setIsCouponChecking] = useState(false);
  const [couponOpen, setCouponOpen] = useState(false);
  const [coinsOpen, setCoinsOpen] = useState(false);
  const couponContentClass = accordionOnMobile && !couponOpen ? "hidden lg:block" : "block";
  const coinsContentClass = accordionOnMobile && !coinsOpen ? "hidden lg:block" : "block";

  const handleApplyCoupon = async (event: FormEvent) => {
    event.preventDefault();
    if (!couponCode.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    setIsCouponChecking(true);
    try {
      const result = await applyCoupon(couponCode);
      if (result.success) {
        toast.success(result.message);
        setCouponCode("");
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsCouponChecking(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode("");
    toast.info("Coupon removed");
  };

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-2 sm:mb-4">
          <button
            type="button"
            aria-expanded={accordionOnMobile ? couponOpen : true}
            onClick={() => setCouponOpen((open) => !open)}
            className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">sell</span>
              <span className="font-headline-sm text-sm font-extrabold text-on-surface">Apply Coupon</span>
            </span>
            <span className={`material-symbols-outlined text-outline transition-transform lg:hidden ${couponOpen ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>
          <span className="hidden sm:inline text-[11px] font-bold text-secondary">Store promotions</span>
        </div>

        <div className={couponContentClass}>
        <form onSubmit={handleApplyCoupon} className="flex gap-2 mb-3">
          <input
            type="text"
            value={couponCode}
            onChange={(event) => setCouponCode(event.target.value)}
            placeholder="Enter a promo code"
            className="flex-1 px-4 py-2.5 rounded-xl bg-surface-container-low text-xs font-bold text-on-surface uppercase placeholder:normal-case placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-primary/40 border border-outline-variant/15"
          />
          <button
            type="submit"
            disabled={isCouponChecking}
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-headline-sm text-xs font-bold hover:bg-primary-container transition-colors shadow-sm cursor-pointer disabled:opacity-60"
          >
            Apply
          </button>
        </form>

        {appliedCoupon && (
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">check_circle</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-headline-sm text-xs font-black text-primary">{appliedCoupon.code}</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-primary text-white">APPLIED</span>
                </div>
                <p className="text-[11px] text-primary/90 font-medium">Promo discount: ₹{couponDiscount}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveCoupon}
              className="text-xs font-bold text-error hover:underline shrink-0 cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant/15 rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-2">
          <button
            type="button"
            aria-expanded={accordionOnMobile ? coinsOpen : true}
            onClick={() => setCoinsOpen((open) => !open)}
            className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[20px]">monetization_on</span>
              <span className="font-headline-sm text-sm font-extrabold text-on-surface">Smart Coins</span>
            </span>
            <span className={`material-symbols-outlined text-outline transition-transform lg:hidden ${coinsOpen ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>
          <span className="text-xs font-black text-secondary">{coinsAvailable} Available</span>
        </div>
        <div className={coinsContentClass}>
        <p className="hidden sm:block text-[11px] text-on-surface-variant mb-4 leading-relaxed">
          Earn 1 Smart Coin for every ₹1 spent on items (delivery fee excluded). Redeem once your balance reaches {checkoutSettings.minCoinsToRedeem} coins, up to {checkoutSettings.maxCoinRedemptionPercent}% of your item subtotal. Coins expire after {checkoutSettings.coinValidityMonths} months.
        </p>

        <div
          onClick={() => {
            if (coinsToRedeem > 0) setRedeemCoins(!redeemCoins);
            else toast.info(`You need a balance of at least ${checkoutSettings.minCoinsToRedeem} Smart Coins to redeem.`);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
            redeemCoins
              ? "border-secondary bg-secondary/10 shadow-sm"
              : "border-outline-variant/20 hover:border-secondary/40 bg-surface-container-low/40"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={redeemCoins}
              onChange={(event) => setRedeemCoins(event.target.checked)}
              onClick={(event) => event.stopPropagation()}
              disabled={coinsToRedeem <= 0}
              className="accent-secondary cursor-pointer"
            />
            <div>
              <span className="font-headline-sm text-xs font-bold text-on-surface block">Redeem {coinsToRedeem} Coins</span>
              <span className="text-[10px] text-on-surface-variant font-medium">
                Instant ₹{(coinsToRedeem * coinValueInRupees).toFixed(2).replace(/\.00$/, "")} direct checkout discount
              </span>
            </div>
          </div>
          <span className="material-symbols-outlined text-secondary text-[20px]">military_tech</span>
        </div>
        </div>
      </div>
    </div>
  );
}
