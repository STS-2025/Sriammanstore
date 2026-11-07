import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";

const POLICY_TABS = ["privacy", "terms", "shipping", "refund"] as const;
type PolicyTab = (typeof POLICY_TABS)[number];

function isPolicyTab(value: unknown): value is PolicyTab {
  return typeof value === "string" && POLICY_TABS.includes(value as PolicyTab);
}

export const Route = createFileRoute("/policies")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: isPolicyTab(search["tab"]) ? search["tab"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Legal Policies & Terms — Sri Amman Smart Store" },
      { name: "description", content: "Review our privacy, shipping, return, and service terms." },
    ],
  }),
  component: PoliciesPage,
});

function PoliciesPage() {
  const { tab } = Route.useSearch();
  const activeTab = tab ?? "privacy";
  const navigate = useNavigate({ from: "/policies" });

  const selectTab = (nextTab: PolicyTab) => {
    void navigate({ search: { tab: nextTab } });
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-80px)] pb-24 md:pb-8">
        <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="font-headline-lg text-2xl sm:text-3xl font-extrabold text-on-surface leading-tight">
              Legal Disclosures & Policies
            </h1>
            <p className="text-sm text-on-surface-variant mt-2">
              Sri Amman Smart Store compliance, delivery terms, and customer rights
            </p>
          </div>

          {/* Tab Navigation */}
          <div
            role="tablist"
            aria-label="Policy sections"
            className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 sm:mb-8 bg-surface-container-low p-2 rounded-2xl border border-outline-variant/20"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "privacy"}
              onClick={() => selectTab("privacy")}
              className={`w-full min-w-0 px-2 sm:px-3 py-3 rounded-xl font-headline-sm text-xs font-bold leading-tight transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === "privacy"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Privacy Policy
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "terms"}
              onClick={() => selectTab("terms")}
              className={`w-full min-w-0 px-2 sm:px-3 py-3 rounded-xl font-headline-sm text-xs font-bold leading-tight transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === "terms"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Terms & Conditions
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "shipping"}
              onClick={() => selectTab("shipping")}
              className={`w-full min-w-0 px-2 sm:px-3 py-3 rounded-xl font-headline-sm text-xs font-bold leading-tight transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === "shipping"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Shipping & Geofence
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "refund"}
              onClick={() => selectTab("refund")}
              className={`w-full min-w-0 px-2 sm:px-3 py-3 rounded-xl font-headline-sm text-xs font-bold leading-tight transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                activeTab === "refund"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Cancellation & Refund SLA
            </button>
          </div>

          {/* Content Card */}
          <div
            role="tabpanel"
            className="bg-surface-container-lowest p-4 sm:p-6 md:p-8 lg:p-12 rounded-2xl sm:rounded-3xl border border-outline-variant/20 shadow-sm leading-relaxed text-sm sm:text-base text-on-surface-variant space-y-5 sm:space-y-6 break-words"
          >
            {activeTab === "privacy" && (
              <>
                <h2 className="font-headline-lg text-xl font-extrabold text-on-surface">
                  Customer Privacy Policy
                </h2>
                <p>
                  At Sri Amman Smart Store, we respect your personal privacy. We collect your mobile number, delivery address, and order transaction details solely to fulfill grocery orders, deliver 60-minute express groceries, and track your Amman loyalty coins.
                </p>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Data Security & Sharing
                </h3>
                <p>
                  Your payment data is securely tokenized through RBI-authorized payment gateways. We never store credit/debit card credentials or UPI PINs on our servers. Your address information is shared strictly with our dedicated local fleet delivery drivers for transit purposes.
                </p>
              </>
            )}

            {activeTab === "terms" && (
              <>
                <h2 className="font-headline-lg text-xl font-extrabold text-on-surface">
                  Terms of Service
                </h2>
                <p>
                  By accessing the Sri Amman Smart Store customer application, you agree to comply with our community terms. All items sold are subject to harvest availability. We reserve the right to refuse orders placed with fraudulent details or outside our permissible delivery boundaries.
                </p>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Pricing & FSSAI Compliance
                </h3>
                <p>
                  All retail prices (MRP) and offer prices are inclusive of applicable GST taxes. Wood-pressed oils, unpolished rice grains, and traditional spices are packed in accordance with FSSAI hygiene standards under license registration #12421008000412.
                </p>
              </>
            )}

            {activeTab === "shipping" && (
              <>
                <h2 className="font-headline-lg text-xl font-extrabold text-on-surface">
                  Shipping & Geofence Policy
                </h2>
                <p>
                  Sri Amman Store operates with a strict single-store basis. To ensure dairy, oil, soaps, packed masasla and spices arrive within 60 minutes, our deliveries are restricted to a maximum radius of <strong>50.0 kilometers</strong> from our store hub at Gobichettipalayam, Erode district (Coordinates: 11.459319, 77.333565).
                </p>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Delivery Slots & Free Shipping Threshold
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Free Delivery:</strong> All orders with a basket subtotal of <strong>₹499 or higher</strong> receive complimentary express delivery.
                  </li>
                  <li>
                    <strong>Express Dispatch:</strong> Orders below ₹499 incur a standard fee of ₹40 or an express fee of ₹60.
                  </li>
                  <li>
                    <strong>Delivery Windows:</strong> Morning delivery (7:00 AM – 10:00 AM), Evening delivery (4:00 PM – 7:00 PM), and 60-90 Minute Instant Dispatch.
                  </li>
                </ul>
              </>
            )}

            {activeTab === "refund" && (
              <>
                <h2 className="font-headline-lg text-xl font-extrabold text-on-surface">
                  Cancellation & Refund SLA
                </h2>
                <p>
                  We strive for 100% customer satisfaction with every doorstep delivery.
                </p>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Order Cancellation Rules
                </h3>
                <p>
                  You may self-cancel an order directly from your "My Orders" tab as long as the status remains in <strong>Pending</strong> or <strong>Processing</strong>. Once an order is marked as <strong>Packed</strong> or <strong>In Transit</strong> with our dispatch fleet, cancellations cannot be processed.
                </p>
                <h3 className="font-headline-sm text-base font-bold text-on-surface">
                  Return & Replacement Window
                </h3>
                <p>
                  Damaged packages, leakage in oil containers, or sub-standard fresh produce must be reported within <strong>24 hours of delivery</strong>. Once verified, replacements are dispatched immediately or a full refund is credited to your source payment method within 3-5 business days.
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
