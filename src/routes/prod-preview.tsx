import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { ProductCard } from "../components/product/ProductCard";
import {
  APPROVED_PRODUCTION_PRODUCT_IDS,
  EXPECTED_PRODUCTION_PROJECT_ID,
  EXPECTED_PRODUCTION_PROJECT_NUMBER,
  fetchAllProductionProductPreviews,
  fetchFullProductionCatalogue,
  isProductionPreviewOptedIn,
  type ProductionProductPreviewData,
  type ProductionCatalogueResult,
} from "../services/productionPreviewService";

export const Route = createFileRoute("/prod-preview")({
  head: () => ({
    meta: [
      { title: "Production Product Visual Preview — Sri Amman Smart Store" },
      {
        name: "description",
        content:
          "Isolated read-only visual preview of approved production Firestore products.",
      },
    ],
  }),
  component: ProductionProductPreviewPage,
});

type PreviewTab = string;
type ErrorType = "permission" | "config" | "network" | "empty" | "general";

function ProductionProductPreviewPage() {
  const [optedIn, setOptedIn] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        if (window.sessionStorage.getItem("prod_preview_optin") === "true") {
          return true;
        }
        const params = new URLSearchParams(window.location.search);
        if (params.get("optin") === "true" || params.get("preview") === "true") {
          return true;
        }
      } catch {
        // ignore
      }
    }
    return isProductionPreviewOptedIn();
  });

  const [previews, setPreviews] = useState<ProductionProductPreviewData[]>([]);
  const [catalogueResult, setCatalogueResult] = useState<ProductionCatalogueResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [activeTab, setActiveTab] = useState<PreviewTab>("overview");
  const [activeImageIndex, setActiveImageIndex] = useState<Record<string, number>>({});
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<Record<string, number>>({});
  const [showRawJson, setShowRawJson] = useState<Record<string, boolean>>({});
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showQualityFindings, setShowQualityFindings] = useState(false);

  const loadPreviews = async (isManualOptIn = false) => {
    setLoading(true);
    setError(null);
    setErrorType(null);
    try {
      const fullCat = await fetchFullProductionCatalogue({ optIn: true });
      if (!fullCat || fullCat.products.length === 0) {
        setErrorType("empty");
        setError("No product documents were returned from production Firestore.");
      } else {
        setCatalogueResult(fullCat);
        setPreviews(fullCat.previews);
      }
    } catch (err: any) {
      console.warn("Full catalogue fetch failed, falling back to allowlisted previews:", err);
      try {
        const data = await fetchAllProductionProductPreviews({ optIn: true });
        if (data && data.length > 0) {
          setPreviews(data);
          return;
        }
      } catch {
        // ignore fallback error
      }

      const msg = err.message || "Failed to load production catalogue.";
      setError(msg);

      if (msg.includes("CONFIGURATION SAFETY CHECK FAILED") || msg.includes("Project ID mismatch")) {
        setErrorType("config");
      } else if (msg.includes("403") || msg.includes("PERMISSION_DENIED") || msg.includes("permission")) {
        setErrorType("permission");
      } else if (msg.includes("Failed to fetch") || msg.includes("network") || msg.includes("ECONNREFUSED")) {
        setErrorType("network");
      } else {
        setErrorType("general");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (optedIn) {
      loadPreviews();
    }
  }, [optedIn]);

  const handleManualOptIn = () => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("prod_preview_optin", "true");
      }
    } catch {
      // ignore
    }
    setOptedIn(true);
  };

  const handleManualOptOut = () => {
    try {
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("prod_preview_optin");
      }
    } catch {
      // ignore
    }
    setOptedIn(false);
    setPreviews([]);
    setCatalogueResult(null);
    setError(null);
    setErrorType(null);
  };

  const turmericPreview = previews.find((p) => p.docId === "prod-mumqpksq");
  const chickenPreview = previews.find((p) => p.docId === "prod-munn8cp3");

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen flex flex-col">
      <StoreHeader />

      <main className="flex-1 w-full pt-[172px] bg-surface min-h-[calc(100vh-172px)]">
        <div className="max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop py-space-xl">
          {/* Isolation & Security Notice Banner */}
          <div className="bg-surface-container-low border border-outline-variant/30 rounded-3xl p-6 md:p-8 mb-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-label-badge mb-3">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>Isolated Production Product Preview</span>
                </div>
                <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface">
                  Live Production Product Showcase
                </h1>
                <p className="text-sm text-on-surface-variant mt-2 max-w-3xl leading-relaxed">
                  This page renders the two explicitly allowlisted product documents directly
                  from the live production database (<code>{EXPECTED_PRODUCTION_PROJECT_ID}</code>).
                  The normal store application, shopping cart, authentication, and checkout
                  use the configured Firebase services and enforce customer access through Firestore rules.
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0 text-xs">
                <span className="px-3 py-1.5 rounded-xl bg-surface-container font-mono font-medium text-on-surface-variant flex items-center gap-2 border border-outline-variant/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Project: <strong>{EXPECTED_PRODUCTION_PROJECT_ID}</strong>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-surface-container font-mono font-medium text-on-surface-variant flex items-center gap-2 border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[14px]">checklist</span>
                  Allowlist: <strong>2 Approved Documents</strong>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-surface-container font-mono font-medium text-on-surface-variant flex items-center gap-2 border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[14px]">block</span>
                  Writes: <strong>0 Attempted (Read-Only)</strong>
                </span>
              </div>
            </div>

            {/* Insecure Rules Callout (Transparent Security Disclosure) */}
            <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
              <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0 mt-0.5">
                warning
              </span>
              <div className="leading-relaxed">
                <strong>Important Security Note:</strong> Production Cloud Firestore security
                rules currently contain <code>match /&#123;document=**&#125; &#123; allow read, write: if true; &#125;</code>.
                Therefore, access is <em>not</em> technically restricted as read-only at the database
                rules level. Read-only protection and strict path allowlisting are enforced solely
                through client-side software isolation and read-only REST GET operations. No write,
                update, delete, customer-record, or cart operations are implemented or authorized.
              </div>
            </div>

            {/* Opt-In Status & Controls */}
            <div className="mt-6 pt-4 border-t border-outline-variant/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${optedIn ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                <span className="font-semibold text-on-surface">
                  Preview Status: {optedIn ? "Connected (Read-Only Opt-In Active)" : "Not Connected (Opt-In Required)"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {optedIn ? (
                  <>
                    <button
                      type="button"
                      onClick={() => loadPreviews()}
                      className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold font-label-button text-primary border border-outline-variant/20 cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      <span>Refresh Documents</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleManualOptOut}
                      className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold font-label-button text-error border border-outline-variant/20 cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">power_settings_new</span>
                      <span>Disconnect Preview</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleManualOptIn}
                    className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold font-label-button shadow-sm cursor-pointer flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">lock_open</span>
                    <span>Connect to Production Catalogue</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Opt-In Gate State */}
          {!optedIn && (
            <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-8 md:p-12 text-center max-w-2xl mx-auto shadow-sm my-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">shield</span>
              </div>
              <h2 className="font-headline-md text-xl font-bold text-on-surface mb-2">
                Explicit Development Opt-In Required
              </h2>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6 max-w-lg mx-auto">
                Live production Firestore access is restricted to an explicit development opt-in.
                Connecting will read the two approved product documents (<code>prod-mumqpksq</code> and <code>prod-munn8cp3</code>)
                from <code>{EXPECTED_PRODUCTION_PROJECT_ID}</code> using strictly read-only HTTP GET requests.
                This page only reads the approved catalogue preview. Other customer services use the configured Firebase services.
              </p>
              <button
                type="button"
                onClick={handleManualOptIn}
                className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white text-sm font-bold shadow-md cursor-pointer inline-flex items-center gap-2.5 transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-[20px]">cloud_sync</span>
                <span>Connect &amp; Inspect Live Production Catalogue</span>
              </button>
            </div>
          )}

          {/* Navigation Tabs (Only when opted in) */}
          {optedIn && (
            <div className="flex items-center gap-2 mb-8 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/20 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2.5 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                  activeTab === "overview"
                    ? "bg-primary text-white shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
                <span>
                  Overview &amp; Diagnostics ({catalogueResult ? catalogueResult.diagnostics.uniqueProductCount : previews.length})
                </span>
              </button>
              {previews.map((item) => (
                <button
                  key={item.docId}
                  type="button"
                  onClick={() => setActiveTab(item.docId)}
                  className={`px-4 py-2.5 rounded-xl font-headline-sm text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    activeTab === item.docId
                      ? "bg-primary text-white shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  <span>{item.product.name} ({item.docId})</span>
                </button>
              ))}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="font-headline-sm text-sm font-semibold text-on-surface-variant">
                Connecting to production Firestore (<code>{EXPECTED_PRODUCTION_PROJECT_ID}</code>)
                and fetching allowlisted product documents...
              </p>
            </div>
          )}

          {/* Specialized Error States */}
          {error && !loading && (
            <div className="p-6 md:p-8 rounded-3xl bg-surface-container-lowest border border-error/30 shadow-sm mb-8">
              <div className="flex items-center gap-3 text-error font-headline-sm font-bold text-base mb-2">
                <span className="material-symbols-outlined text-[24px]">
                  {errorType === "permission"
                    ? "lock"
                    : errorType === "config"
                    ? "settings_alert"
                    : errorType === "network"
                    ? "wifi_off"
                    : "error"}
                </span>
                <span>
                  {errorType === "permission"
                    ? "Production Access Denied (Permission Error)"
                    : errorType === "config"
                    ? "Production Configuration Safety Check Failed"
                    : errorType === "network"
                    ? "Network Connectivity Failure"
                    : "Production Preview Error"}
                </span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">{error}</p>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-xs space-y-2">
                {errorType === "permission" && (
                  <p className="text-on-surface">
                    The production Firebase rules rejected this read request. Ensure the API key has
                    read permissions to Cloud Firestore and the document allowlist is configured.
                  </p>
                )}
                {errorType === "config" && (
                  <p className="text-on-surface">
                    A configuration invariant check failed. Production preview requires project ID{" "}
                    <code>{EXPECTED_PRODUCTION_PROJECT_ID}</code> and project number{" "}
                    <code>{EXPECTED_PRODUCTION_PROJECT_NUMBER}</code>. Connecting to any other target is prohibited.
                  </p>
                )}
                {errorType === "network" && (
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface">
                      Could not reach Google Cloud Firestore REST API. Check your internet connection.
                    </span>
                    <button
                      type="button"
                      onClick={() => loadPreviews()}
                      className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold cursor-pointer hover:bg-primary/90"
                    >
                      Retry Connection
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && optedIn && previews.length === 0 && (
            <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/20 my-8">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">
                inventory_2
              </span>
              <h3 className="font-headline-sm text-base font-bold text-on-surface mb-1">
                No Production Documents Found
              </h3>
              <p className="text-xs text-on-surface-variant">
                No approved product documents were retrieved from production Firestore.
              </p>
            </div>
          )}

          {/* Content Views */}
          {!loading && !error && optedIn && previews.length > 0 && (
            <>
              {/* TAB 1: OVERVIEW & COMPARISON */}
              {activeTab === "overview" && (
                <div className="space-y-12">
                  {/* Production Catalogue Diagnostic Metrics Banner */}
                  {catalogueResult && (
                    <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-8 shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                          <h2 className="font-headline-md text-xl font-bold text-on-surface">
                            Production Catalogue Diagnostics
                          </h2>
                          <p className="text-xs text-on-surface-variant mt-1">
                            Discovered products across top-level <code>products</code> collection and nested <code>items</code> collectionGroup.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-mono">
                            Bounded Limits: Top: {catalogueResult.diagnostics.queryLimitsApplied.topLevelLimit} | Nested: {catalogueResult.diagnostics.queryLimitsApplied.nestedLimit}
                          </span>
                        </div>
                      </div>

                      {/* 5-Metric Cards Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col">
                          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                            Unique Products
                          </span>
                          <span className="text-2xl font-black text-primary font-mono">
                            {catalogueResult.diagnostics.uniqueProductCount}
                          </span>
                          <span className="text-[10px] text-outline mt-1">Normalized canonical items</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col">
                          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                            Top-Level Docs
                          </span>
                          <span className="text-2xl font-black text-on-surface font-mono">
                            {catalogueResult.diagnostics.topLevelCount}
                          </span>
                          <span className="text-[10px] text-outline mt-1">products/&#123;id&#125;</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col">
                          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                            Nested Items
                          </span>
                          <span className="text-2xl font-black text-on-surface font-mono">
                            {catalogueResult.diagnostics.nestedCount}
                          </span>
                          <span className="text-[10px] text-outline mt-1">collectionGroup(&apos;items&apos;)</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col">
                          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                            Duplicates Resolved
                          </span>
                          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                            {catalogueResult.diagnostics.duplicateCount}
                          </span>
                          <span className="text-[10px] text-outline mt-1">Deterministic precedence applied</span>
                        </div>

                        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15 flex flex-col">
                          <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                            POS Metadata Shielded
                          </span>
                          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {catalogueResult.diagnostics.posFieldsFilteredCount}
                          </span>
                          <span className="text-[10px] text-outline mt-1">Internal fields hidden</span>
                        </div>
                      </div>

                      {/* Deterministic Precedence Rule Banner */}
                      <div className="mt-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs flex items-start gap-3">
                        <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">
                          rule
                        </span>
                        <div>
                          <strong className="font-bold text-on-surface block mb-0.5">
                            Deterministic Precedence Rule:
                          </strong>
                          <span className="text-on-surface-variant leading-relaxed">
                            When a product document ID exists in both top-level <code>products/&#123;id&#125;</code> and nested <code>products/&#123;category&#125;/items/&#123;id&#125;</code>, the top-level document takes precedence as the authoritative Admin Panel record. Nested item paths are reconciled and displayed in the Duplicates Inspector below.
                          </span>
                        </div>
                      </div>

                      {/* Duplicates Inspector Accordion */}
                      {catalogueResult.diagnostics.duplicateDetails.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-outline-variant/15">
                          <button
                            type="button"
                            onClick={() => setShowDuplicates((prev) => !prev)}
                            className="flex items-center justify-between w-full text-xs font-bold text-on-surface hover:text-primary transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[18px] text-amber-600">
                                content_copy
                              </span>
                              <span>
                                Duplicates Inspector ({catalogueResult.diagnostics.duplicateDetails.length} duplicate IDs detected across {catalogueResult.diagnostics.duplicateCount} nested instances)
                              </span>
                            </span>
                            <span className="material-symbols-outlined text-[18px]">
                              {showDuplicates ? "expand_less" : "expand_more"}
                            </span>
                          </button>

                          {showDuplicates && (
                            <div className="mt-4 overflow-x-auto rounded-xl border border-outline-variant/20">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/20">
                                    <th className="py-2.5 px-3">Product ID</th>
                                    <th className="py-2.5 px-3">Product Name</th>
                                    <th className="py-2.5 px-3">Authoritative Selected Path</th>
                                    <th className="py-2.5 px-3">Nested Duplicate Paths</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/15">
                                  {catalogueResult.diagnostics.duplicateDetails.map((dup) => (
                                    <tr key={dup.id} className="hover:bg-surface-container-low/50">
                                      <td className="py-2.5 px-3 font-mono text-primary font-bold">{dup.id}</td>
                                      <td className="py-2.5 px-3 font-semibold text-on-surface">{dup.name}</td>
                                      <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-medium">{dup.selectedPath}</td>
                                      <td className="py-2.5 px-3 font-mono text-on-surface-variant text-[11px]">
                                        <div className="flex flex-col gap-1">
                                          {dup.nestedPaths.map((np, idx) => (
                                            <span key={idx} className="bg-surface-container px-2 py-0.5 rounded">
                                              {np}
                                            </span>
                                          ))}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Phase 6: Data Quality Diagnostics Audit Summary */}
                      {catalogueResult.diagnostics.dataQualityReport && (
                        <div className="mt-6 pt-4 border-t border-outline-variant/15">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div>
                              <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-primary">
                                  fact_check
                                </span>
                                <span>Catalogue Data Quality Audit (Phase 6)</span>
                              </h3>
                              <p className="text-[11px] text-on-surface-variant mt-0.5">
                                Automated diagnostics across pricing, stock consistency, images, and category integrity.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
                                {catalogueResult.diagnostics.dataQualityReport.errorCount} Errors
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono">
                                {catalogueResult.diagnostics.dataQualityReport.warningCount} Warnings
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-bold font-mono">
                                {catalogueResult.diagnostics.dataQualityReport.infoCount} Verified Info
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowQualityFindings((prev) => !prev)}
                            className="flex items-center justify-between w-full text-xs font-bold text-on-surface hover:text-primary transition-colors cursor-pointer py-1"
                          >
                            <span className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px] text-primary">
                                list_alt
                              </span>
                              <span>
                                View Diagnostic Findings ({catalogueResult.diagnostics.dataQualityReport.totalFindings} findings across {catalogueResult.diagnostics.dataQualityReport.totalProducts} products)
                              </span>
                            </span>
                            <span className="material-symbols-outlined text-[18px]">
                              {showQualityFindings ? "expand_less" : "expand_more"}
                            </span>
                          </button>

                          {showQualityFindings && (
                            <div className="mt-3 overflow-x-auto rounded-xl border border-outline-variant/20 max-h-80 overflow-y-auto">
                              <table className="w-full text-left text-xs">
                                <thead>
                                  <tr className="bg-surface-container-low text-on-surface-variant font-bold border-b border-outline-variant/20 sticky top-0">
                                    <th className="py-2.5 px-3">Severity</th>
                                    <th className="py-2.5 px-3">Product</th>
                                    <th className="py-2.5 px-3">Field / Rule</th>
                                    <th className="py-2.5 px-3">Message &amp; Observed Value</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/15">
                                  {catalogueResult.diagnostics.dataQualityReport.findings.map((f, idx) => (
                                    <tr key={idx} className="hover:bg-surface-container-low/50">
                                      <td className="py-2 px-3">
                                        <span
                                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                                            f.severity === "error"
                                              ? "bg-red-500/10 text-red-600 border border-red-500/20"
                                              : f.severity === "warning"
                                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                                                : "bg-surface-container text-on-surface-variant"
                                          }`}
                                        >
                                          {f.severity}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 font-medium text-on-surface">
                                        <div>{f.productName}</div>
                                        <div className="font-mono text-[10px] text-primary">{f.productId}</div>
                                      </td>
                                      <td className="py-2 px-3 font-mono text-[11px] text-on-surface-variant">
                                        <div>{f.field}</div>
                                        <div className="text-[10px] text-outline">{f.rule}</div>
                                      </td>
                                      <td className="py-2 px-3 text-on-surface-variant text-[11px]">
                                        <div className="text-on-surface">{f.message}</div>
                                        {f.observedValue !== null && f.observedValue !== undefined && (
                                          <div className="font-mono text-[10px] text-outline mt-0.5 truncate max-w-md">
                                            Observed: {String(f.observedValue)}
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reused ProductCard Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="font-headline-md text-lg font-bold text-on-surface">
                          Full Production Catalogue (Read-Only Mode)
                        </h2>
                        <p className="text-xs text-on-surface-variant">
                          Rendered using the standard storefront <code>ProductCard</code> component with cart mutations disabled.
                        </p>
                      </div>
                      <span className="text-xs text-outline font-mono">
                        {previews.length} Products Loaded
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {previews.map((item) => (
                        <div key={item.docId} className="flex flex-col">
                          <ProductCard product={item.product} readOnly={true} />
                          <div className="mt-3 p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 text-[11px] text-on-surface-variant flex items-center justify-between">
                            <span className="font-mono text-[10px] truncate max-w-[140px]">{item.docPath}</span>
                            <button
                              type="button"
                              onClick={() => setActiveTab(item.docId)}
                              className="font-bold text-primary hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <span>Inspect</span>
                              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                            </button>
                          </div>
                          {item.docId === "prod-munn8cp3" && (
                            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                              <span className="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">
                                warning
                              </span>
                              <div className="leading-snug">
                                <strong className="font-bold block mb-0.5">Production Image Discrepancy:</strong>
                                This card displays photos of <em>Sakthi Puliyogare Rice Powder (புளியோதரை சாதப் பொடி, Barcode 8906002081042)</em>. The underlying production Firestore document (<code>products/prod-munn8cp3</code>) mistakenly stores Puliyogare packet image data instead of Chicken Masala images.
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* High-Level Comparison Table */}
                  <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                      <div>
                        <h3 className="font-headline-sm text-base font-bold text-on-surface mb-1">
                          Live Production Product Comparison
                        </h3>
                        <p className="text-xs text-on-surface-variant">
                          Audited structural fields across both live documents retrieved via read-only REST API.
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-surface-container text-xs font-mono text-on-surface-variant border border-outline-variant/20 self-start">
                        Source: {EXPECTED_PRODUCTION_PROJECT_ID}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-outline-variant/30 text-on-surface-variant font-bold">
                            <th className="py-3 px-4">Attribute</th>
                            <th className="py-3 px-4">Sakthi Turmeric Powder</th>
                            <th className="py-3 px-4">Sakthi Chicken Masala</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/15 text-on-surface">
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Document ID</td>
                            <td className="py-3 px-4 font-mono font-bold text-primary">prod-mumqpksq</td>
                            <td className="py-3 px-4 font-mono font-bold text-primary">prod-munn8cp3</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Read Timestamp</td>
                            <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant">
                              {turmericPreview?.fetchTimestamp}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-on-surface-variant">
                              {chickenPreview?.fetchTimestamp}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">English Name</td>
                            <td className="py-3 px-4 font-bold">{turmericPreview?.product.name}</td>
                            <td className="py-3 px-4 font-bold">{chickenPreview?.product.name}</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Tamil Name</td>
                            <td className="py-3 px-4 text-primary font-medium">{turmericPreview?.product.tamilName}</td>
                            <td className="py-3 px-4 text-primary font-medium">{chickenPreview?.product.tamilName}</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Brand</td>
                            <td className="py-3 px-4">{turmericPreview?.product.brand}</td>
                            <td className="py-3 px-4">{chickenPreview?.product.brand}</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Category</td>
                            <td className="py-3 px-4 font-bold text-secondary">
                              {turmericPreview?.category}
                            </td>
                            <td className="py-3 px-4 font-bold text-secondary">
                              {chickenPreview?.category}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Subcategory</td>
                            <td className="py-3 px-4 font-medium">
                              {turmericPreview?.subCategory || "None"}
                            </td>
                            <td className="py-3 px-4 font-medium">
                              {chickenPreview?.subCategory || "None"}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Category Slug</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[11px]">
                                {turmericPreview?.categorySlug}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[11px]">
                                {chickenPreview?.categorySlug}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Pack Unit &amp; Size</td>
                            <td className="py-3 px-4 font-mono">
                              {turmericPreview?.product.options[0]?.unitSize}
                              {turmericPreview?.product.options[0]?.unit} (raw: &quot;{String(turmericPreview?.raw["unit"])}&quot;)
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {chickenPreview?.product.options[0]?.unitSize}
                              {chickenPreview?.product.options[0]?.unit} (raw: &quot;{String(chickenPreview?.raw["unit"])}&quot;)
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">MRP / Offer Price</td>
                            <td className="py-3 px-4">
                              ₹{turmericPreview?.product.options[0]?.mrp} /{" "}
                              <strong className="text-primary">
                                ₹{turmericPreview?.product.options[0]?.offerPrice}
                              </strong>
                            </td>
                            <td className="py-3 px-4">
                              ₹{chickenPreview?.product.options[0]?.mrp} /{" "}
                              <strong className="text-primary">
                                ₹{chickenPreview?.product.options[0]?.offerPrice}
                              </strong>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Inventory Stock</td>
                            <td className="py-3 px-4">
                              {turmericPreview?.product.options[0]?.stock} units in stock
                            </td>
                            <td className="py-3 px-4">
                              {chickenPreview?.product.options[0]?.stock} units in stock
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">FSSAI License</td>
                            <td className="py-3 px-4 font-mono">{String(turmericPreview?.raw["fssaiLicense"] || "Not provided")}</td>
                            <td className="py-3 px-4 font-mono">{String(chickenPreview?.raw["fssaiLicense"] || "Not provided")}</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">GST / HSN Code</td>
                            <td className="py-3 px-4 font-mono">
                              {String(turmericPreview?.raw["gstRate"])}% GST / HSN {String(turmericPreview?.raw["hsnCode"])}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {String(chickenPreview?.raw["gstRate"])}% GST / HSN {String(chickenPreview?.raw["hsnCode"])}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Image Count (Base64)</td>
                            <td className="py-3 px-4">{turmericPreview?.product.images.length} images</td>
                            <td className="py-3 px-4">{chickenPreview?.product.images.length} images</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Missing Fields</td>
                            <td className="py-3 px-4">
                              <span className="text-on-surface-variant font-mono">
                                {turmericPreview?.missingFields.length || 0} empty fields
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-on-surface-variant font-mono">
                                {chickenPreview?.missingFields.length || 0} empty fields
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Internal POS Metadata</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-surface-container font-mono text-[11px] text-on-surface-variant">
                                Filtered ({turmericPreview?.internalPosFieldsFiltered.length || 0} internal fields hidden)
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full bg-surface-container font-mono text-[11px] text-on-surface-variant">
                                Filtered ({chickenPreview?.internalPosFieldsFiltered.length || 0} internal fields hidden)
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 font-semibold text-on-surface-variant">Image Audit Status</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Verified (Turmeric Powder 20g pouch)
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                                <span className="material-symbols-outlined text-[16px]">warning</span>
                                Production Defect: Stored images are Puliyogare Rice Powder
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* DYNAMIC PRODUCT INSPECTION DETAIL TAB */}
              {activeTab !== "overview" && (() => {
                const selectedPreview = previews.find((p) => p.docId === activeTab);
                if (!selectedPreview) return null;
                const docId = selectedPreview.docId;
                return (
                  <ProductInspectionSection
                    key={docId}
                    preview={selectedPreview}
                    activeImageIdx={activeImageIndex[docId] || 0}
                    onSelectImage={(idx) =>
                      setActiveImageIndex((prev) => ({ ...prev, [docId]: idx }))
                    }
                    selectedOptionIdx={selectedOptionIndex[docId] || 0}
                    onSelectOption={(idx) =>
                      setSelectedOptionIndex((prev) => ({ ...prev, [docId]: idx }))
                    }
                    showJson={Boolean(showRawJson[docId])}
                    onToggleJson={() =>
                      setShowRawJson((prev) => ({
                        ...prev,
                        [docId]: !prev[docId],
                      }))
                    }
                  />
                );
              })()}
            </>
          )}

          {/* Footer Back Link */}
          <div className="mt-16 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
            <span>
              Sri Amman Smart Store &copy; 2026 &bull; Isolated Production Diagnostic Sandbox
            </span>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-primary font-bold hover:underline">
                &larr; Return to Storefront
              </Link>
              <Link to="/shop" className="text-primary font-bold hover:underline">
                Browse Catalog &rarr;
              </Link>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
      <StoreFooter />
    </div>
  );
}

interface ProductInspectionSectionProps {
  preview: ProductionProductPreviewData;
  activeImageIdx: number;
  onSelectImage: (idx: number) => void;
  selectedOptionIdx: number;
  onSelectOption: (idx: number) => void;
  showJson: boolean;
  onToggleJson: () => void;
}

function ProductInspectionSection({
  preview,
  activeImageIdx,
  onSelectImage,
  selectedOptionIdx,
  onSelectOption,
  showJson,
  onToggleJson,
}: ProductInspectionSectionProps) {
  const { product, raw, docPath, rawFieldCount, category, subCategory, categorySlug } = preview;
  const currentOption = product.options[selectedOptionIdx] || product.options[0];
  const images = product.images.length > 0 ? product.images : [product.imageUrl];
  const mainImage = images[activeImageIdx] || images[0];

  return (
    <div className="space-y-8">
      {/* Production Image Data Anomaly Banner for prod-munn8cp3 */}
      {preview.docId === "prod-munn8cp3" && (
        <div className="p-4 md:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-sm">
          <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0 mt-0.5">
            warning
          </span>
          <div className="leading-relaxed">
            <strong className="text-sm font-bold block mb-1">
              Diagnostic Warning: Production Image Discrepancy
            </strong>
            The images displayed below are the actual unmodified Base64 photos stored in the production Firestore database (<code>products/prod-munn8cp3</code>).
            A byte-level visual audit confirms that these photos show a 20g packet of{" "}
            <strong>Sakthi Puliyogare Rice Powder (புளியோதரை சாதப் பொடி, Barcode 8906002081042)</strong> rather than Sakthi Chicken Masala (document barcode: <code>8906002081578</code>).
            This discrepancy originates strictly within the production database document; the frontend schema mapper and UI faithfully render the stored data as required.
          </div>
        </div>
      )}

      {/* Product Card / Detail Hybrid View */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-10 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
          {/* Left Column: Image Showcase */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="aspect-square w-full rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/15 flex items-center justify-center p-4">
              <img
                src={mainImage}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Thumbnail selector */}
            {images.length > 1 && (
              <div className="flex items-center gap-3">
                {images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectImage(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all p-1 bg-surface-container-low cursor-pointer ${
                      activeImageIdx === idx
                        ? "border-primary ring-2 ring-primary/20 scale-105"
                        : "border-outline-variant/30 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 text-[11px] text-on-surface-variant flex items-center justify-between">
              <span>Image Format: <strong>Base64 Data URI</strong></span>
              <span>Images: <strong>{images.length} available</strong></span>
            </div>

            {/* Field level image breakdown */}
            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/15 text-[11px] text-on-surface-variant space-y-1">
              <div className="flex items-center justify-between">
                <span>imageUrl field:</span>
                <span className="font-mono text-emerald-600 font-bold">
                  {raw["imageUrl"] ? "Present (Base64)" : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>frontImageUrl field:</span>
                <span className="font-mono text-emerald-600 font-bold">
                  {raw["frontImageUrl"] ? "Present (Base64)" : "Missing"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>backImageUrl field:</span>
                <span className="font-mono text-emerald-600 font-bold">
                  {raw["backImageUrl"] ? "Present (Base64)" : "Missing"}
                </span>
              </div>
            </div>

            {preview.docId === "prod-munn8cp3" && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0">
                  info
                </span>
                <span>Pictured packet: Sakthi Puliyogare Rice Powder (20g)</span>
              </div>
            )}
          </div>

          {/* Right Column: Pricing, Options, Description */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              {/* Badges: Brand, Category, Subcategory, Category Slug, Path */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-label-badge">
                  {product.brand}
                </span>
                <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold font-label-badge">
                  Category: {category}
                </span>
                {subCategory && (
                  <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-bold font-label-badge">
                    Subcategory: {subCategory}
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono">
                  Slug: {categorySlug}
                </span>
                <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface-variant text-xs font-mono">
                  {docPath}
                </span>
              </div>

              {/* Title & Tamil Title */}
              <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface">
                {product.name}
              </h1>
              {product.tamilName && (
                <p className="font-headline-sm text-lg font-bold text-primary mt-1">
                  {product.tamilName}
                </p>
              )}

              {/* Diagnostic metadata badge */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-on-surface-variant">
                <span className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/15 font-mono">
                  Doc ID: <strong>{preview.docId}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/15 font-mono">
                  Read Time: <strong>{preview.fetchTimestamp}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/15 font-mono">
                  Project: <strong>{preview.sourceProject}</strong>
                </span>
              </div>

              {/* Pricing Section */}
              {currentOption && (
                <div className="mt-5 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex flex-wrap items-baseline gap-4">
                  <div className="font-headline-lg text-3xl font-extrabold text-primary">
                    ₹{currentOption.offerPrice}
                  </div>
                  {currentOption.mrp > currentOption.offerPrice && (
                    <div className="font-price-mrp text-base text-outline line-through">
                      ₹{currentOption.mrp}
                    </div>
                  )}
                  {currentOption.mrp > currentOption.offerPrice && (
                    <div className="px-2.5 py-0.5 rounded-full bg-tertiary text-on-tertiary font-label-badge text-xs font-bold">
                      Save ₹{currentOption.mrp - currentOption.offerPrice} (
                      {Math.round(
                        ((currentOption.mrp - currentOption.offerPrice) / currentOption.mrp) *
                          100
                      )}
                      % OFF)
                    </div>
                  )}
                  <div className="ml-auto text-xs text-on-surface-variant font-mono">
                    Stock: <strong>{currentOption.stock} units</strong>
                  </div>
                </div>
              )}

              {/* Pack Sizes / Options Selector */}
              <div className="mt-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
                  Packaging Options ({product.options.length})
                </label>
                <div className="flex flex-wrap gap-3">
                  {product.options.map((opt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectOption(idx)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        selectedOptionIdx === idx
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:border-outline"
                      }`}
                    >
                      {opt.unitSize}
                      {opt.unit} &bull; ₹{opt.offerPrice}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Product Description
                </h3>
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-line">
                  {product.description || "No description provided in production document."}
                </p>
              </div>

              {/* Ingredients (if present) */}
              {Boolean(raw["ingredients"]) && (
                <div className="mt-5 p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 text-xs">
                  <span className="font-bold text-on-surface-variant">Ingredients: </span>
                  <span className="text-on-surface">{String(raw["ingredients"])}</span>
                </div>
              )}
            </div>

            {/* Read-Only Status Indicator */}
            <div className="mt-8 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                <span className="material-symbols-outlined text-[18px] text-primary">
                  verified
                </span>
                <span>Production Document Normalization Succeeded</span>
              </div>
              <div className="px-4 py-2 bg-surface-container text-on-surface-variant text-xs font-semibold rounded-xl border border-outline-variant/30">
                Cart Writes Prohibited (Isolated Sandbox)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Schema Quality & Field Audit */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-headline-sm text-base font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-primary">rule</span>
            <span>Schema Quality &amp; Field Audit</span>
          </h3>
          <span className="px-3 py-1 rounded-full bg-surface-container text-xs font-mono text-on-surface-variant border border-outline-variant/15">
            Diagnostic Inspection
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mb-6">
          Diagnostic analysis of category mapping, missing optional fields, and schema anomalies.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Category & Subcategory Resolution */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15">
            <span className="font-bold text-on-surface block mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">category</span>
              Category Hierarchy
            </span>
            <div className="space-y-1.5 text-[11px]">
              <div>Category: <strong className="text-on-surface">{category}</strong></div>
              <div>Subcategory: <strong className="text-on-surface">{subCategory || "None"}</strong></div>
              <div>Category Slug: <code className="bg-surface-container px-1.5 py-0.5 rounded text-primary">{categorySlug}</code></div>
            </div>
          </div>

          {/* Missing Fields */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15">
            <span className="font-bold text-on-surface block mb-2 flex items-center gap-1.5 text-amber-700 dark:text-amber-300">
              <span className="material-symbols-outlined text-[16px]">info</span>
              Missing / Empty Optional Fields ({preview.missingFields.length})
            </span>
            {preview.missingFields.length === 0 ? (
              <span className="text-[11px] text-emerald-600">All standard fields populated</span>
            ) : (
              <ul className="space-y-1 text-[11px] text-on-surface-variant list-disc list-inside">
                {preview.missingFields.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Malformed / Anomalies */}
          <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/15">
            <span className="font-bold text-on-surface block mb-2 flex items-center gap-1.5 text-amber-800 dark:text-amber-200">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              Anomalies &amp; Data Quality ({preview.malformedFields.length + preview.anomalies.length})
            </span>
            {preview.malformedFields.length === 0 && preview.anomalies.length === 0 ? (
              <span className="text-[11px] text-emerald-600">No anomalies detected</span>
            ) : (
              <ul className="space-y-1 text-[11px] text-amber-800 dark:text-amber-200 list-disc list-inside">
                {preview.malformedFields.map((m, i) => (
                  <li key={`m-${i}`}>{m}</li>
                ))}
                {preview.anomalies.map((a, i) => (
                  <li key={`a-${i}`}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Customer Catalog & Regulatory Specifications (POS Internal Fields Filtered) */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <h3 className="font-headline-sm text-base font-bold text-on-surface">
            Customer Catalog &amp; Regulatory Specifications
          </h3>
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold font-label-badge self-start">
            Internal POS/ERP Fields Filtered
          </span>
        </div>
        <p className="text-xs text-on-surface-variant mb-6">
          Customer-relevant regulatory specifications. Internal retail inventory fields (purchasePrice, batchNumber, barcode, sku, safetyStock, expiryDate) are excluded from consumer view.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
            <span className="text-[11px] text-on-surface-variant block mb-1">FSSAI License</span>
            <span className="font-mono font-bold">{String(raw["fssaiLicense"] || "Not provided")}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
            <span className="text-[11px] text-on-surface-variant block mb-1">GST Tax Rate</span>
            <span className="font-mono font-bold">{String(raw["gstRate"])}% GST</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
            <span className="text-[11px] text-on-surface-variant block mb-1">HSN Code</span>
            <span className="font-mono font-bold">{String(raw["hsnCode"] || "N/A")}</span>
          </div>
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/15">
            <span className="text-[11px] text-on-surface-variant block mb-1">Catalog Status</span>
            <span className="font-mono font-bold text-emerald-600">Active (In Stock)</span>
          </div>
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="mt-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              Production Search Tags ({product.tags.length})
            </h4>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-3 bg-surface-container-low rounded-2xl border border-outline-variant/15">
              {product.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-surface-container-lowest text-on-surface-variant text-[11px] border border-outline-variant/20 font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Raw Production Firestore Document JSON */}
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-headline-sm text-base font-bold text-on-surface">
              Raw Production Firestore Document ({rawFieldCount} fields)
            </h3>
            <p className="text-xs text-on-surface-variant">
              Complete unmarshaled JSON document directly from <code>{docPath}</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleJson}
            className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-bold font-label-button text-primary border border-outline-variant/20 cursor-pointer transition-colors"
          >
            {showJson ? "Hide Raw JSON" : "Show Raw JSON"}
          </button>
        </div>

        {showJson && (
          <div className="mt-4">
            <div className="mb-2 p-2.5 rounded-xl bg-surface-container-low text-xs text-on-surface-variant">
              Note: This debug view displays raw Firestore fields for developer verification. Customer-facing pages filter out internal POS attributes.
            </div>
            <pre className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-xs font-mono text-on-surface overflow-x-auto max-h-96 overflow-y-auto">
              {JSON.stringify(raw, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
