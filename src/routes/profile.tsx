import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { PhoneVerificationModal } from "../components/auth/PhoneVerificationModal";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile Information | Sri Amman Smart Store" },
      { name: "description", content: "Review and update your customer profile information." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, isLoading, isResolvingIdentity, updateProfile } = useAuth();
  const { language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhoneVerification, setShowPhoneVerification] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("");
  const [birthday, setBirthday] = useState("");
  const [groceryRhythm, setGroceryRhythm] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPreferredLanguage(user?.preferredLanguage || "Tamil / English");
    setBirthday(user?.dob || user?.birthday || "");
    setGroceryRhythm(user?.groceryRhythm || "Every Saturday Morning (4 Members)");
  }, [user]);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Please enter a valid full name (minimum 2 characters)");
      return;
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        preferredLanguage,
        ...(birthday.trim() ? { dob: birthday.trim() } : {}),
        ...(groceryRhythm.trim() ? { groceryRhythm: groceryRhythm.trim() } : {}),
      });
      setIsEditing(false);
      toast.success("Profile information updated successfully.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save profile information.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || isResolvingIdentity) {
    return (
      <PageShell>
        <div className="py-24 text-center text-sm text-on-surface-variant">Loading profile...</div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <div className="py-24 text-center">
          <h1 className="mb-2 text-2xl font-extrabold">Sign in to view your profile</h1>
          <Link
            to="/login"
            search={{ redirect: "/profile" } as any}
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-sm font-bold text-white"
          >
            Sign In
          </Link>
        </div>
      </PageShell>
    );
  }

  const profileFields = [
    { label: "Customer ID", value: user.id || user.userId || "Not available", icon: "badge" },
    { label: "Full Name", value: user.name || "Customer", icon: "person" },
    { label: "Mobile Number", value: user.phone || "No phone linked", icon: "smartphone" },
    { label: "Email Address", value: user.email || "No email provided", icon: "mail" },
    {
      label: "Preferred Store Language",
      value: user.preferredLanguage || (language === "ta" ? "Tamil / English" : "Tamil / English"),
      icon: "translate",
    },
    { label: "Birthday", value: user.dob || user.birthday || "Not provided", icon: "cake" },
    { label: "Weekly Grocery Rhythm", value: user.groceryRhythm || "Every Saturday Morning (4 Members)", icon: "sync" },
  ];

  return (
    <PageShell>
      <nav aria-label="Breadcrumb" className="mb-5 hidden min-w-0 text-xs text-on-surface-variant md:block">
        <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <li className="shrink-0">
            <Link to="/account" className="inline-flex min-h-8 items-center gap-1 rounded-md hover:text-primary">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">home</span>
              <span>My Account</span>
            </Link>
          </li>
          <li aria-hidden="true" className="shrink-0 text-outline-variant">/</li>
          <li aria-current="page" className="min-w-0 font-semibold text-on-surface">
            <span className="block max-w-full truncate">Profile Information</span>
          </li>
        </ol>
      </nav>

      <section className="rounded-3xl border border-outline-variant/20 bg-white p-4 shadow-sm sm:p-7">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-emerald-50 text-lg font-black text-primary ring-1 ring-primary/10">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (user.name || "C").charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-extrabold text-on-surface sm:text-2xl">Profile Information</h1>
              <p className="mt-1 text-sm text-on-surface-variant">Review and manage your personal details.</p>
            </div>
          </div>
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-xl bg-surface-container-low px-4 text-sm font-bold text-on-surface hover:bg-surface-container"
            >
              <span className="material-symbols-outlined text-[17px]">edit</span>
              Edit Profile
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <ProfileInput label="Full Name" value={name} onChange={setName} />
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-on-surface-variant">Mobile Number</label>
                <div className="flex items-center gap-2">
                  {user.phoneVerified ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <span className="material-symbols-outlined text-[14px]">verified</span>Verified
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700">Not verified</span>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPhoneVerification(true)}
                    className="text-[11px] font-bold text-primary underline"
                  >
                    {user.phoneVerified ? "Change Number" : "Verify Number"}
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  value={user.phone || "No phone linked"}
                  readOnly
                  className="min-h-11 min-w-0 flex-1 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 text-sm text-on-surface-variant"
                />
              </div>
            </div>
            <ProfileInput label="Email Address" type="email" value={email} onChange={setEmail} />
            <ProfileInput label="Preferred Store Language" value={preferredLanguage} onChange={setPreferredLanguage} />
            <ProfileInput label="Birthday" type="date" value={birthday} onChange={setBirthday} />
            <ProfileInput label="Weekly Grocery Rhythm" value={groceryRhythm} onChange={setGroceryRhythm} />
            <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="min-h-11 rounded-xl bg-surface-container-low px-5 text-sm font-bold text-on-surface"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="min-h-11 rounded-xl bg-primary px-5 text-sm font-bold text-white disabled:opacity-60"
              >
                {isSaving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profileFields.map((field) => (
              <div key={field.label} className="min-w-0 rounded-2xl border border-outline-variant/15 bg-surface-container-low/50 p-3.5">
                <dt className="mb-2 flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-primary">{field.icon}</span>
                  {field.label}
                </dt>
                <dd className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-on-surface">
                  <span className="min-w-0 break-words">{field.value}</span>
                  {field.label === "Mobile Number" && (
                    <span className="flex shrink-0 items-center gap-2">
                      {user.phoneVerified ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200/70">
                          <span className="material-symbols-outlined text-[13px]">verified</span>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200/70">
                          <span className="material-symbols-outlined text-[13px]">error</span>
                          Not verified
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPhoneVerification(true)}
                        className="inline-flex min-h-8 items-center gap-1 rounded-lg px-1.5 text-[10px] font-bold text-primary hover:bg-primary/5"
                      >
                        <span className="material-symbols-outlined text-[14px]">edit</span>
                        {user.phoneVerified ? "Change" : "Verify"}
                      </button>
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <PhoneVerificationModal
        isOpen={showPhoneVerification}
        onClose={() => setShowPhoneVerification(false)}
        onSuccess={(verifiedPhone) => toast.success(`Mobile number ${verifiedPhone} verified.`)}
        initialPhone={user.phone || ""}
        title={user.phoneVerified ? "Change Mobile Number" : "Verify Mobile Number"}
        subtitle={
          user.phoneVerified
            ? "Enter your new mobile number and verify it with an SMS code. Your profile updates after verification."
            : "Verify your mobile number with an SMS code to add it to your profile."
        }
      />
    </PageShell>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-on-surface-variant">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8faf8] font-body-md text-on-surface antialiased">
      <StoreHeader />
      <main className="min-h-[calc(100vh-80px)] px-4 pb-24 pt-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
      <StoreFooter />
      <BottomNav />
    </div>
  );
}
