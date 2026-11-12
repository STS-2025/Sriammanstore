import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { authManager } from "../services/authAdapter";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password | Sri Amman Smart Store" },
      { name: "description", content: "Request a password reset link for your Sri Amman Smart Store account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await authManager.sendPasswordResetEmail(email);
      setSent(true);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "We couldn't send a reset link. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased">
      <StoreHeader />
      <main className="mx-auto flex min-h-[70vh] max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <section className="w-full max-w-md rounded-[28px] border border-outline-variant/20 bg-surface-container-lowest p-6 shadow-[0_24px_60px_rgba(17,24,39,0.08)] sm:p-8">
          <Link to="/login" className="text-sm font-semibold text-primary hover:underline">
            ← Back to sign in
          </Link>
          <div className="mt-6">
            <h1 className="text-2xl font-extrabold">Reset your password</h1>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Enter the email address linked to your account and we’ll send you a password reset link.
            </p>
          </div>

          {sent ? (
            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-4" role="status">
              <p className="text-sm font-bold text-primary">Check your email</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                If an account is registered with that address, a password reset link will arrive shortly.
              </p>
              <Link to="/login" className="mt-4 inline-flex text-sm font-bold text-primary hover:underline">
                Return to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="text-xs font-bold">
                  Email address
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your account email"
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3.5 py-3 text-sm font-semibold placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {error && (
                <p className="rounded-xl border border-error/20 bg-error/10 p-3 text-xs font-semibold text-error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:bg-primary-container disabled:opacity-50"
              >
                {isSubmitting ? "Sending reset link…" : "Send reset link"}
              </button>
            </form>
          )}
        </section>
      </main>
      <StoreFooter />
      <BottomNav />
    </div>
  );
}
