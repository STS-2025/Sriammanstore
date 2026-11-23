import { Link } from "@tanstack/react-router";
import logo from "../../assests/logo.png"

export function StoreFooter() {
  return (
    <footer className="bg-surface-container-low text-on-surface border-t border-outline-variant/20 pt-5 sm:pt-8 pb-24 md:pb-8">
      <div className="max-w-[1320px] mx-auto px-margin-desktop">
        <div className="grid grid-cols-1 justify-items-center gap-5 mb-6 text-center sm:gap-8 sm:mb-12 md:grid-cols-2 md:justify-items-stretch md:text-left lg:grid-cols-5">
          {/* Brand Info */}
          <div className="flex flex-col items-center gap-3 text-center sm:gap-4 md:items-start md:text-left lg:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-black text-xl shadow-md">
                <img src={logo} alt="Sriman Smart Store" className="h-full w-full rounded-xl object-contain" />
              </div>
              <div>
                <span className="font-headline-md text-headline-md font-bold text-primary block">
                  Sriman
                </span>
                <span className="font-label-badge text-[10px] tracking-wider uppercase text-secondary font-semibold">
                  Smart Store
                </span>
              </div>
            </div>
            <p className="hidden sm:block mx-auto max-w-sm font-body-sm text-body-sm leading-relaxed text-on-surface-variant md:mx-0">
              South India's most authentic grains, spices, masalas, refined oil delivered with single-store purity in 60 minutes.
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

          {/* Customer Care */}
          <div className="hidden sm:block text-center md:text-left">
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
          <div className="hidden sm:block text-center md:text-left">
            <h4 className="font-headline-sm text-sm font-bold text-on-surface mb-3 uppercase tracking-wider">
              Policies
            </h4>
            <ul className="space-y-2 font-body-sm text-xs text-on-surface-variant">
              <li>
                <Link
                  to="/policies"
                  search={{ tab: "privacy" }}
                  className="hover:text-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/policies"
                  search={{ tab: "terms" }}
                  className="hover:text-primary transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/policies"
                  search={{ tab: "shipping" }}
                  className="hover:text-primary transition-colors"
                >
                  Shipping & Geofence
                </Link>
              </li>
              <li>
                <Link
                  to="/policies"
                  search={{ tab: "refund" }}
                  className="hover:text-primary transition-colors"
                >
                  Refund & Return SLA
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="hidden sm:flex pt-4 sm:pt-8 border-t border-outline-variant/20 flex-col md:flex-row items-center justify-between gap-2 sm:gap-4 text-center text-[10px] sm:text-xs text-on-surface-variant md:text-left">
          <p className="hidden sm:block">© 2026 Sriman Smart Store. Single-store purity guaranteed. FSSAI Reg: #12421008000412</p>
          <div className="hidden sm:flex flex-wrap items-center justify-center gap-x-4 gap-y-2 md:justify-end">
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

