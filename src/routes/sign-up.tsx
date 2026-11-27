import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CustomerRegistrationForm } from "../components/auth/CustomerRegistrationForm";

export const Route = createFileRoute("/sign-up")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; email?: string; phone?: string; countryCode?: string; ref?: string } => {
    const redirect = typeof search["redirect"] === "string" ? search["redirect"] : undefined;
    const email = typeof search["email"] === "string" ? search["email"] : undefined;
    const phone = typeof search["phone"] === "string" ? search["phone"] : undefined;
    const countryCode = typeof search["countryCode"] === "string" ? search["countryCode"] : undefined;
    const ref = typeof search["ref"] === "string" ? search["ref"] : undefined;
    return {
      ...(redirect?.startsWith("/") && !redirect.startsWith("//") ? { redirect } : {}),
      ...(email ? { email } : {}),
      ...(phone ? { phone } : {}),
      ...(countryCode ? { countryCode } : {}),
      ...(ref ? { ref } : {}),
    };
  },
  head: () => ({
    meta: [
      { title: "Create a Customer Account — Sriman Smart Store" },
      { name: "description", content: "Create a Sriman Smart Store customer account." },
    ],
  }),
  component: SignUpPage,
});

export function SignUpPage() {
  const { redirect, email, phone, countryCode, ref } = useSearch({ from: "/sign-up" });

  return (
    <main className="min-h-screen bg-surface px-4 py-12 text-on-surface sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[28px] border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-[0_24px_60px_rgba(17,24,39,0.08)] sm:p-8">
          <div className="mb-5 grid grid-cols-2 rounded-xl bg-surface-container-low p-1">
            <Link
              to="/login"
              search={{ ...(redirect ? { redirect } : {}), ...(ref ? { ref } : {}) } as any}
              className="rounded-lg px-4 py-2.5 text-center text-sm font-bold text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Login
            </Link>
            <Link
              to="/sign-up"
              search={{
                ...(redirect ? { redirect } : {}),
                ...(ref ? { ref } : {}),
                ...(email ? { email } : {}),
                ...(phone ? { phone } : {}),
                ...(countryCode ? { countryCode } : {}),
              } as any}
              aria-current="page"
              className="rounded-lg bg-surface-container-lowest px-4 py-2.5 text-center text-sm font-bold text-primary shadow-sm"
            >
              Sign up
            </Link>
          </div>
          <div className="mb-6 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
              Customer account
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
              Create your account
            </h1>
            <p className="text-sm leading-relaxed text-on-surface-variant">
              {redirect?.startsWith("/checkout")
                ? "Create your account to continue checkout. Your selected cart items are saved and will be ready when you return."
                : "Create your customer account with email and password to start shopping at Sriman Smart Store."}
            </p>
          </div>

          <CustomerRegistrationForm redirectTo={redirect} initialEmail={email} initialPhone={phone} initialCountryCode={countryCode} initialReferralCode={ref} />
        </div>
      </div>
    </main>
  );
}
