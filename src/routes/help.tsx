import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { supportService, type ReportedProblem, type ProductRequest } from "../services/supportService";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Customer Support — Sri Amman Smart Store" },
      { name: "description", content: "Report issues, request products, or reach our customer care." },
    ],
  }),
  component: HelpPage,
});

const FAQS = [
  {
    q: "How does the 60-minute express delivery work?",
    a: "Orders placed within our 6km store geofence in Gobichettipalayam and Kasipalayam are packed within 12 minutes and dispatched via our dedicated electric delivery fleet.",
  },
  {
    q: "What is your return & replacement policy?",
    a: "If produce or cold pressed oils do not match our farm-purity standards, you can request a replacement or full refund within 24 hours of doorstep delivery.",
  },
  {
    q: "How do I become an Amman VIP Prestige Member?",
    a: "VIP standing is automatically activated once your cumulative spend on delivered orders reaches ₹5,000 within any rolling 30-calendar-day window.",
  },
  {
    q: "Are the wood-pressed oils really 100% pure?",
    a: "Yes. All our groundnut, sesame, and coconut oils are cold-churned in traditional heirloom Vaagai timber mortars below 38°C with zero chemical solvents.",
  },
];

function HelpPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"faqs" | "report" | "request">("faqs");

  // Report Problem form
  const [repCategory, setRepCategory] = useState("Damaged Item");
  const [repOrderId, setRepOrderId] = useState("");
  const [repMessage, setRepMessage] = useState("");
  const [myTickets, setMyTickets] = useState<ReportedProblem[]>([]);

  // Request Product form
  const [reqName, setReqName] = useState("");
  const [reqBrand, setReqBrand] = useState("");
  const [reqNotes, setReqNotes] = useState("");
  const [myRequests, setMyRequests] = useState<ProductRequest[]>([]);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setMyTickets([]);
        setMyRequests([]);
        return;
      }
      try {
        const [tickets, requests] = await Promise.all([
          supportService.getReportedProblems(user.id),
          supportService.getProductRequests(user.id),
        ]);
        setMyTickets(tickets || []);
        setMyRequests(requests || []);
      } catch (err) {
        console.error("Failed to load support records:", err);
      }
    }
    loadData();
  }, [user]);

  const handleSubmitProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to submit a support ticket");
      return;
    }
    if (!repMessage.trim()) return;
    try {
      const trimmedOrderId = repOrderId.trim();
      const ticket = await supportService.submitReportedProblem({
        userId: user.id,
        category: repCategory,
        ...(trimmedOrderId ? { orderId: trimmedOrderId } : {}),
        message: repMessage.trim(),
      });
      setMyTickets((prev) => [ticket, ...prev]);
      setRepMessage("");
      setRepOrderId("");
      toast.success("Support ticket logged! Our team will contact you shortly.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit ticket");
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to request a product");
      return;
    }
    if (!reqName.trim()) return;
    try {
      const req = await supportService.submitProductRequest({
        userId: user.id,
        productName: reqName.trim(),
        brand: reqBrand.trim(),
        notes: reqNotes.trim(),
      });
      setMyRequests((prev) => [req, ...prev]);
      setReqName("");
      setReqBrand("");
      setReqNotes("");
      toast.success("Product request recorded! Our sourcing team has been notified.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit product request");
    }
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]">
        <div className="max-w-[1000px] mx-auto px-margin-desktop py-space-xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface">
              Customer Support & Care Center
            </h1>
            <p className="text-xs text-on-surface-variant mt-1">
              Have questions, need an order issue resolved, or want us to source a native grocery item?
            </p>
          </div>

          {/* Quick Contact Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <a
              href="https://api.whatsapp.com/send?text=Hi%20Sri%20Amman%20Support"
              target="_blank"
              rel="noreferrer"
              className="p-4 rounded-3xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center gap-3 transition-colors text-on-surface"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </div>
              <div>
                <span className="font-headline-sm text-xs font-bold block">WhatsApp Chat</span>
                <span className="text-[11px] text-on-surface-variant">Instant response</span>
              </div>
            </a>

            <a
              href="tel:+919840012345"
              className="p-4 rounded-3xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 flex items-center gap-3 transition-colors text-on-surface"
            >
              <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">call</span>
              </div>
              <div>
                <span className="font-headline-sm text-xs font-bold block">+91 98400 12345</span>
                <span className="text-[11px] text-on-surface-variant">Daily 7:00 AM - 10:00 PM</span>
              </div>
            </a>

            <a
              href="mailto:support@sriammanstore.com"
              className="p-4 rounded-3xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 flex items-center gap-3 transition-colors text-on-surface"
            >
              <div className="w-10 h-10 rounded-2xl bg-secondary text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">email</span>
              </div>
              <div>
                <span className="font-headline-sm text-xs font-bold block">Email Care</span>
                <span className="text-[11px] text-on-surface-variant">support@sriammanstore.com</span>
              </div>
            </a>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 mb-8 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/20 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("faqs")}
              className={`px-4 py-2 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer ${
                activeTab === "faqs"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Frequently Asked Questions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("report")}
              className={`px-4 py-2 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer ${
                activeTab === "report"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Report a Problem ({myTickets.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("request")}
              className={`px-4 py-2 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer ${
                activeTab === "request"
                  ? "bg-primary text-white shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface"
              }`}
            >
              Request a Product ({myRequests.length})
            </button>
          </div>

          {/* TAB 1: FAQs */}
          {activeTab === "faqs" && (
            <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm space-y-4">
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-4">
                Frequently Asked Questions
              </h3>
              <div className="space-y-4">
                {FAQS.map((faq, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15"
                  >
                    <h4 className="font-headline-sm text-sm font-bold text-on-surface mb-2">
                      {faq.q}
                    </h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Report a Problem Form */}
          {activeTab === "report" && (
            <div className="space-y-8">
              <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-4">
                  Log a Customer Grievance Ticket
                </h3>
                <form onSubmit={handleSubmitProblem} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-on-surface block mb-1">Issue Category</label>
                    <select
                      value={repCategory}
                      onChange={(e) => setRepCategory(e.target.value)}
                      className="w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/20 font-bold"
                    >
                      <option>Damaged Item</option>
                      <option>Delivery Delay</option>
                      <option>Payment / Refund Issue</option>
                      <option>Quality Not As Expected</option>
                      <option>Other Grievance</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-on-surface block mb-1">
                      Related Order ID (Optional)
                    </label>
                    <input
                      type="text"
                      value={repOrderId}
                      onChange={(e) => setRepOrderId(e.target.value)}
                      placeholder="e.g. ORD-0004512"
                      className="w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-on-surface block mb-1">
                      Explain the Issue
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={repMessage}
                      onChange={(e) => setRepMessage(e.target.value)}
                      placeholder="Describe the issue with your grocery delivery..."
                      className="w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md cursor-pointer"
                  >
                    Submit Support Ticket
                  </button>
                </form>
              </div>

              {/* Submitted Tickets */}
              {myTickets.length > 0 && (
                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
                  <h4 className="font-headline-lg text-sm font-bold text-on-surface mb-3">
                    Your Previous Tickets
                  </h4>
                  <div className="space-y-3">
                    {myTickets.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15 text-xs flex justify-between items-start"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-on-surface">{t.category}</span>
                            {t.orderId && (
                              <span className="text-[11px] font-mono text-primary font-bold">
                                #{t.orderId}
                              </span>
                            )}
                          </div>
                          <p className="text-on-surface-variant">{t.message}</p>
                          <span className="text-[10px] text-outline mt-1 block">
                            Logged on {new Date(t.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-label-badge text-[10px] px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-bold">
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Request a Product Form */}
          {activeTab === "request" && (
            <div className="space-y-8">
              <div className="bg-surface-container-lowest p-6 md:p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-4">
                  Request a Native or Organic Item
                </h3>
                <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">
                  Looking for a rare heritage grain (e.g. Karuppu Kavuni, Mapillai Samba), authentic spice, or traditional snack not currently listed in our store? Tell us and our farm procurement team will source it.
                </p>
                <form onSubmit={handleSubmitRequest} className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-on-surface block mb-1">Product Name</label>
                    <input
                      type="text"
                      required
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      placeholder="e.g. Pure Karuppu Kavuni Black Rice"
                      className="w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-on-surface block mb-1">
                      Preferred Brand / Origin (Optional)
                    </label>
                    <input
                      type="text"
                      value={reqBrand}
                      onChange={(e) => setReqBrand(e.target.value)}
                      placeholder="e.g. Thanjavur Single Farm"
                      className="w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-on-surface block mb-1">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      rows={3}
                      value={reqNotes}
                      onChange={(e) => setReqNotes(e.target.value)}
                      placeholder="Specify preferred pack size or requirements..."
                      className="w-full bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/20"
                    />
                  </div>

                  <button
                    type="submit"
                    className="bg-primary hover:bg-primary-container text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md cursor-pointer"
                  >
                    Submit Sourcing Request
                  </button>
                </form>
              </div>

              {/* Submitted Requests */}
              {myRequests.length > 0 && (
                <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
                  <h4 className="font-headline-lg text-sm font-bold text-on-surface mb-3">
                    Your Sourcing Requests
                  </h4>
                  <div className="space-y-3">
                    {myRequests.map((r) => (
                      <div
                        key={r.id}
                        className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15 text-xs flex justify-between items-start"
                      >
                        <div>
                          <span className="font-bold text-on-surface block">{r.productName}</span>
                          {r.notes && <p className="text-on-surface-variant mt-0.5">{r.notes}</p>}
                          <span className="text-[10px] text-outline mt-1 block">
                            Requested on {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="font-label-badge text-[10px] px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold">
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
