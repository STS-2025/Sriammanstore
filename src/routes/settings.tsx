import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings & Privacy — Sri Amman Smart Store" },
      { name: "description", content: "Manage your account communication preferences." },
    ],
  }),
  component: AccountSettingsPage,
});

interface CommunicationPreferences {
  whatsappUpdates: boolean;
  smsAlerts: boolean;
  promoOffers: boolean;
}

const DEFAULT_PREFERENCES: CommunicationPreferences = {
  whatsappUpdates: true,
  smsAlerts: true,
  promoOffers: true,
};

function AccountSettingsPage() {
  const { user, isLoading, isResolvingIdentity } = useAuth();
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const raw = window.localStorage.getItem(`account-communication-preferences:${user.id}`);
      if (!raw) return;
      const stored = JSON.parse(raw) as Partial<CommunicationPreferences>;
      setPreferences({
        whatsappUpdates: typeof stored.whatsappUpdates === "boolean" ? stored.whatsappUpdates : true,
        smsAlerts: typeof stored.smsAlerts === "boolean" ? stored.smsAlerts : true,
        promoOffers: typeof stored.promoOffers === "boolean" ? stored.promoOffers : true,
      });
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    }
  }, [user?.id]);

  const updatePreference = (key: keyof CommunicationPreferences, value: boolean) => {
    setPreferences((current) => ({ ...current, [key]: value }));
    setIsSaved(false);
  };

  const savePreferences = () => {
    if (!user?.id) return;
    try {
      window.localStorage.setItem(
        `account-communication-preferences:${user.id}`,
        JSON.stringify(preferences),
      );
      setIsSaved(true);
      toast.success("Preferences saved on this device.");
    } catch {
      toast.error("Could not save your preferences in this browser.");
    }
  };

  if (isLoading || isResolvingIdentity) {
    return (
      <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
        <StoreHeader />
        <main className="mx-auto w-full max-w-3xl px-4 py-24 text-center">
          <p className="text-sm text-on-surface-variant">Loading your account settings…</p>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
        <StoreHeader />
        <main className="mx-auto w-full max-w-3xl px-4 py-24 text-center">
          <h1 className="mb-3 text-2xl font-extrabold">Sign in to manage your settings</h1>
          <Link
            to="/login"
            search={{ redirect: "/settings" } as any}
            className="inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white"
          >
            Sign In
          </Link>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  const settings = [
    {
      key: "whatsappUpdates" as const,
      title: "WhatsApp Delivery Updates",
      detail: "Receive live tracking links and driver arrival alerts.",
    },
    {
      key: "smsAlerts" as const,
      title: "SMS Order Status Alerts",
      detail: "Receive order status and dispatch messages by SMS.",
    },
    {
      key: "promoOffers" as const,
      title: "Fresh Harvest & Seasonal Offers",
      detail: "Receive member promotions and updates about seasonal products.",
    },
  ];

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
      <StoreHeader />
      <main className="min-h-[calc(100vh-80px)] px-4 py-8 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs text-on-surface-variant">
            <Link to="/account" className="hover:text-primary">Account</Link>
            <span aria-hidden="true">/</span>
            <span className="font-semibold text-on-surface">Settings & Privacy</span>
          </nav>

          <section className="rounded-3xl border border-outline-variant/20 bg-white p-4 shadow-sm sm:p-7">
            <div className="mb-6">
              <h1 className="text-xl font-extrabold text-on-surface sm:text-2xl">Account Settings & Privacy</h1>
              <p className="mt-1 text-sm text-on-surface-variant">
                Choose which delivery, order, and promotion updates you receive.
              </p>
            </div>

            <div className="space-y-3">
              {settings.map((setting) => (
                <label
                  key={setting.key}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-on-surface">{setting.title}</span>
                    <span className="mt-0.5 block text-xs text-on-surface-variant">{setting.detail}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences[setting.key]}
                    onChange={(event) => updatePreference(setting.key, event.target.checked)}
                    className="h-5 w-5 shrink-0 accent-[#005f3f]"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                to="/account"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-surface-container-low px-5 text-sm font-bold text-on-surface"
              >
                Back to Account
              </Link>
              <button
                type="button"
                onClick={savePreferences}
                className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white transition-colors hover:bg-primary-container"
              >
                {isSaved ? "Preferences Saved" : "Save Preferences"}
              </button>
            </div>
            <p className="mt-3 text-[11px] text-on-surface-variant">
              Preferences are saved in this browser on this device.
            </p>
          </section>
        </div>
      </main>
      <StoreFooter />
      <BottomNav />
    </div>
  );
}
