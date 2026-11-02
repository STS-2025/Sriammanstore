import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { CustomerRegistrationForm } from "../components/auth/CustomerRegistrationForm";

export const Route = createFileRoute("/sign-up")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirect = typeof search["redirect"] === "string" ? search["redirect"] : undefined;
    return redirect?.startsWith("/") && !redirect.startsWith("//") ? { redirect } : {};
  },
  head: () => ({
    meta: [
      { title: "Create a Customer Account — Sri Amman Smart Store" },
      { name: "description", content: "Create a Sri Amman Smart Store customer account." },
    ],
  }),
  component: SignUpPage,
});

export function SignUpPage() {
  const { redirect } = useSearch({ from: "/sign-up" });

  return (
    <main className="min-h-screen bg-surface px-4 py-12 text-on-surface sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-[28px] border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-[0_24px_60px_rgba(17,24,39,0.08)] sm:p-8">
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
                : "Create your customer account with email and password to start shopping at Sri Amman Smart Store."}
            </p>
          </div>

          <CustomerRegistrationForm redirectTo={redirect} />

          <p className="mt-6 text-center text-sm text-on-surface-variant">
            Already have an account?{" "}
            <Link to="/login" search={redirect ? { redirect } as any : undefined} className="font-bold text-primary underline-offset-4 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
