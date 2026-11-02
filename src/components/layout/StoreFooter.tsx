import { Link } from "@tanstack/react-router";
import logo from "../../assests/logo.png"

export function StoreFooter() {
  return (
    <footer className="bg-surface-container-low text-on-surface border-t border-outline-variant/20 pt-12 pb-24 md:pb-12 mt-16">
      <div className="max-w-[1320px] mx-auto px-margin-desktop">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-md">
                <img src={logo} alt="Sri Amman Smart Store" className="h-full w-full rounded-xl object-contain" />
              </div>
              <div>
                <span className="font-headline-md text-headline-md font-bold text-primary block">
                  Sri Amman
                </span>
                <span className="font-label-badge text-[10px] tracking-wider uppercase text-secondary font-semibold">
                  Smart Store
                </span>
              </div>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm leading-relaxed">
              South India's most authentic unpolished grains, artisanal wood-pressed oils, and farm-plucked morning greens delivered with single-store purity in 60 minutes.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://api.whatsapp.com/send?text=SriAmmanStore"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#128C7E] font-headline-sm text-xs font-bold transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>WhatsApp Help</span>
              </a>
              <a
                href="tel:+919840012345"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-sm text-xs font-bold transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">call</span>
                <span>+91 98400 12345</span>
              </a>
            </div>
          </div>

          {/* Quick Categories
          <div>
            <h4 className="font-headline-sm text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
              Aisles
            </h4>
            <ul className="space-y-2 font-body-sm text-xs text-on-surface-variant">
              <li>
                <Link to="/shop" search={{ category: "cold-pressed-oils" } as any} className="hover:text-primary transition-colors">
                  Cold Pressed Oils
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "staples-grains" } as any} className="hover:text-primary transition-colors">
                  Heritage Rice & Staples
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "organic-spices" } as any} className="hover:text-primary transition-colors">
                  Organic Spices
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "dairy-breakfast" } as any} className="hover:text-primary transition-colors">
                  A2 Desi Cow Ghee
                </Link>
              </li>
              <li>
                <Link to="/shop" search={{ category: "fruits-veggies" } as any} className="hover:text-primary transition-colors">
                  Farm Vegetables
                </Link>
              </li>
            </ul>
          </div> */}

          {/* Customer Care */}
          <div>
            <h4 className="font-headline-sm text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
              Customer Hub
            </h4>
            <ul className="space-y-2 font-body-sm text-xs text-on-surface-variant">
              <li>
                <Link to="/orders" search={{} as any} className="hover:text-primary transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link to="/rewards" className="hover:text-primary transition-colors">
                  Smart Coins & VIP
                </Link>
              </li>
              <li>
                <Link to="/refer" className="hover:text-primary transition-colors">
                  Refer & Earn
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-primary transition-colors">
                  Report a Problem
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-primary transition-colors">
                  Request a Product
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div>
            <h4 className="font-headline-sm text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
              Policies
            </h4>
            <ul className="space-y-2 font-body-sm text-xs text-on-surface-variant">
              <li>
                <Link to="/policies" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/policies" className="hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/policies" className="hover:text-primary transition-colors">
                  Shipping & Geofence
                </Link>
              </li>
              <li>
                <Link to="/policies" className="hover:text-primary transition-colors">
                  Refund & Return SLA
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-outline-variant/20 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
          <p>© 2026 Sri Amman Smart Store. Single-store purity guaranteed. FSSAI Reg: #12421008000412</p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-end">
            <span className="flex items-center gap-1 text-primary font-semibold">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              100% Quality Assured
            </span>
            <span className="flex items-center gap-1 text-secondary font-semibold">
              <span className="material-symbols-outlined text-[16px]">bolt</span>
              60 Min Express Delivery
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

