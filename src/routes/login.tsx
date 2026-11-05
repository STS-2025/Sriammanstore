import { useState, useEffect, useRef } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";
import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { useAuth, describeIdentityResolutionState } from "../context/AuthContext";
import { authManager } from "../services/authAdapter";
import { authService, NO_PHONE_ACCOUNT_MESSAGE } from "../services/authService";
import { formatToE164, mapPhoneAuthError } from "../services/phoneVerificationService";
import { checkCustomerPhoneEligibility, mapPhoneEligibilityError } from "../services/phoneEligibilityService";
import { emailLinkAuthService, EmailLinkAuthError } from "../services/emailLinkAuthService";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (
    search: Record<string, unknown>,
  ): {
    redirect?: string | undefined;
    ref?: string | undefined;
    mode?: string | undefined;
    oobCode?: string | undefined;
    apiKey?: string | undefined;
    emailLink?: string | undefined;
    authMode?: "emulator" | "production" | "mock" | undefined;
  } => {
    const rawAuthMode = (search["authMode"] as string | undefined)?.toLowerCase();
    const validAuthMode =
      rawAuthMode === "production" || rawAuthMode === "emulator" || rawAuthMode === "mock"
        ? (rawAuthMode as "emulator" | "production" | "mock")
        : undefined;

    return {
      redirect: (search["redirect"] as string) || undefined,
      ref: (search["ref"] as string) || undefined,
      mode: (search["mode"] as string) || undefined,
      oobCode: (search["oobCode"] as string) || undefined,
      apiKey: (search["apiKey"] as string) || undefined,
      emailLink: (search["emailLink"] as string) || undefined,
      authMode: validAuthMode,
    };
  },
  head: () => ({
    meta: [
      { title: "Sign In & OTP Verification — Sri Amman Smart Store" },
      {
        name: "description",
        content: "Sign in with your mobile number or email to access your account and rewards.",
      },
    ],
  }),
  component: LoginPage,
});

const COUNTRY_CODES = [
  { code: "+91", label: "India", flag: "🇮🇳" },
  { code: "+1", label: "USA", flag: "🇺🇸" },
  { code: "+44", label: "UK", flag: "🇬🇧" },
  { code: "+61", label: "Australia", flag: "🇦🇺" },
  { code: "+971", label: "UAE", flag: "🇦🇪" },
];

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function LoginPage() {
  const {
    user,
    sessionType,
    authMode,
    setAuthMode,
    authStatus,
    firebaseUser,
    identityResolution,
    identityNotice,
    isResolvingIdentity,
    login,
    loginWithEmail,
    completeEmailLinkSignIn,
    resolveFirebaseSession,
    validateReferralCode,
    logout,
  } = useAuth();
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/login" });

  // Mobile OTP Form State
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpError, setOtpError] = useState("");
  const phoneConfirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const otpRequestInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // Email & Password Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);

  // Firebase Passwordless Email-Link Form & Completion State (Local Auth Emulator)
  const [emailLinkAddress, setEmailLinkAddress] = useState("");
  const [emailLinkSentMessage, setEmailLinkSentMessage] = useState("");
  const [emailLinkContinueUrl, setEmailLinkContinueUrl] = useState("");
  const [emailLinkError, setEmailLinkError] = useState("");
  const [isSendingEmailLink, setIsSendingEmailLink] = useState(false);
  const [isCompletingEmailLink, setIsCompletingEmailLink] = useState(false);
  const [isEmailLinkCallback, setIsEmailLinkCallback] = useState(false);
  const [emailLinkCallbackUrl, setEmailLinkCallbackUrl] = useState("");
  const [emailLinkNeedsConfirmation, setEmailLinkNeedsConfirmation] = useState(false);
  const [confirmationEmailInput, setConfirmationEmailInput] = useState("");
  const [emulatorGeneratedLink, setEmulatorGeneratedLink] = useState("");
  const hasAttemptedAutoCallbackRef = useRef(false);

  // Referral Accordion State
  const [isReferralOpen, setIsReferralOpen] = useState(Boolean(searchParams.ref));
  const [referralCode, setReferralCode] = useState(searchParams.ref || "");
  const [referralMessage, setReferralMessage] = useState("");
  const [referralApplied, setReferralApplied] = useState(false);

  // Refs for 6-digit OTP inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Phone validation helper
  const cleanPhoneDigits = phone.replace(/\D/g, "");
  const isPhoneValid = cleanPhoneDigits.length === 10;

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (otpSent && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpSent, resendTimer]);

  // Handle redirect navigation
  const navigatePostLogin = () => {
    if (searchParams.redirect) {
      navigate({ to: searchParams.redirect as never });
    } else {
      navigate({ to: "/" });
    }
  };

  const requestEligibleFirebaseOtp = async (): Promise<boolean> => {
    const e164PhoneNumber = formatToE164(countryCode, cleanPhoneDigits);
    let eligible: boolean;
    try {
      eligible = await checkCustomerPhoneEligibility(e164PhoneNumber);
    } catch (error: unknown) {
      const message = mapPhoneEligibilityError(error);
      setOtpSent(false);
      setOtpDigits(["", "", "", "", "", ""]);
      phoneConfirmationRef.current = null;
      setOtpError(message);
      toast.error(message);
      return false;
    }
    if (!eligible) {
      setOtpSent(false);
      setOtpDigits(["", "", "", "", "", ""]);
      phoneConfirmationRef.current = null;
      setOtpError(NO_PHONE_ACCOUNT_MESSAGE);
      toast.error(NO_PHONE_ACCOUNT_MESSAGE);
      return false;
    }

    const { auth } = authManager.getProductionAdapter().getAuthInstance();
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, "login-recaptcha-container", {
        size: "invisible",
      });
    }
    phoneConfirmationRef.current = await signInWithPhoneNumber(
      auth,
      e164PhoneNumber,
      recaptchaVerifierRef.current,
    );
    return true;
  };

  useEffect(() => {
    const targetMode = searchParams.authMode;
    if (targetMode === "production" || targetMode === "emulator" || targetMode === "mock") {
      setAuthMode(targetMode);
    }
  }, [searchParams.authMode, setAuthMode]);

  // 1. Send OTP Action
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpRequestInFlightRef.current) return;
    if (!isPhoneValid) {
      setOtpError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setOtpError("");
    otpRequestInFlightRef.current = true;
    setIsSubmitting(true);

    if (authMode === "mock") {
      try {
        await authService.requestOtp(`${countryCode}${cleanPhoneDigits}`);
        toast.success("Verification code sent (Mock OTP: 123456).");
        setOtpSent(true);
        setResendTimer(30);
        setOtpDigits(["", "", "", "", "", ""]);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
        return;
      } catch (err: unknown) {
        const message = getErrorMessage(err, "Failed to send OTP");
        setOtpError(message);
        toast.error(message);
        return;
      } finally {
        otpRequestInFlightRef.current = false;
        setIsSubmitting(false);
      }
    }

    try {
      const sent = await requestEligibleFirebaseOtp();
      if (!sent) return;
      toast.success("Verification code requested from Firebase Auth.");
      setOtpSent(true);
      setResendTimer(30);
      setOtpDigits(["", "", "", "", "", ""]);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: unknown) {
      const message = mapPhoneAuthError(err);
      setOtpError(message);
      toast.error(message);
    } finally {
      otpRequestInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  // 2. Resend OTP Action
  const handleResendOtp = async () => {
    if (resendTimer > 0 || otpRequestInFlightRef.current) return;
    setOtpError("");
    otpRequestInFlightRef.current = true;
    setIsSubmitting(true);

    if (authMode === "mock") {
      try {
        await authService.requestOtp(`${countryCode}${cleanPhoneDigits}`);
        toast.success("A new verification code was sent (Mock OTP: 123456).");
        setResendTimer(30);
        setOtpDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } catch (err: unknown) {
        const message = getErrorMessage(err, "Failed to resend OTP");
        setOtpError(message);
        toast.error(message);
      } finally {
        otpRequestInFlightRef.current = false;
        setIsSubmitting(false);
      }
      return;
    }

    try {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
      const sent = await requestEligibleFirebaseOtp();
      if (!sent) return;
      toast.success("A new Firebase verification code was requested.");
      setResendTimer(30);
      setOtpDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      const message = mapPhoneAuthError(err);
      setOtpError(message);
      toast.error(message);
    } finally {
      otpRequestInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  // 3. Verify OTP & Sign In Action
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      setOtpError("Please enter the complete 6-digit OTP.");
      return;
    }
    setOtpError("");
    setIsSubmitting(true);

    if (authMode === "mock") {
      try {
        const loggedIn = await login(
          `${countryCode}${cleanPhoneDigits}`,
          fullOtp,
          referralApplied ? referralCode : undefined,
        );
        toast.success(`Welcome back, ${loggedIn.name}!`);
        navigatePostLogin();
        return;
      } catch (err: unknown) {
        const message = getErrorMessage(err, "Invalid OTP code");
        setOtpError(message);
        toast.error(message);
        return;
      } finally {
        setIsSubmitting(false);
      }
    }

    try {
      if (!phoneConfirmationRef.current)
        throw new Error("Request a fresh verification code first.");
      const credential = await phoneConfirmationRef.current.confirm(fullOtp);
      if (!credential.user.phoneNumber) {
        throw new Error("Firebase did not return a verified phone number. Sign-in was stopped.");
      }
      const result = await resolveFirebaseSession({
        uid: credential.user.uid,
        email: credential.user.email,
        emailVerified: credential.user.emailVerified,
        phoneNumber: credential.user.phoneNumber,
        providerId: "phone",
      });
      if (result.status === "resolved") {
        toast.success(`Welcome back, ${result.profile.name}!`);
        navigatePostLogin();
      } else {
        setOtpError(
          "Firebase verified your phone, but no linked customer profile was found. No SASS or ONCUS profile was created. Contact support or continue only after the approved registration flow is available.",
        );
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Invalid OTP code");
      setOtpError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setOtpError("");
    setEmailError("");
    setIsSubmitting(true);
    try {
      const identity = await authManager.signInWithGoogle();
      const result = await resolveFirebaseSession(identity);
      if (result.status === "resolved") {
        toast.success(`Welcome back, ${result.profile.name}!`);
        navigatePostLogin();
      } else {
        const userMsg =
          describeIdentityResolutionState(result)?.userMessage ??
          "Google sign-in succeeded, but customer registration could not be completed. No customer profile or identity mapping was created.";
        setOtpError(userMsg);
      }
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Google sign-in failed.");
      setOtpError(message);
      if (!message.toLowerCase().includes("was cancelled")) toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Email Sign In Action
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError("Please enter your email address.");
      return;
    }
    if (!password) {
      setEmailError("Please enter your password.");
      return;
    }
    setEmailError("");
    setIsEmailSubmitting(true);
    try {
      const loggedIn = await loginWithEmail(email, password);
      toast.success(`Welcome back, ${loggedIn.name}!`);
      navigatePostLogin();
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Invalid email or password");
      setEmailError(message);
      toast.error(message || "Authentication failed");
    } finally {
      setIsEmailSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    if (email.trim()) {
      toast.info(
        `Password reset instructions are managed via store support. Please reach out to store support at +91 98400 12345 or support@sriamman.store for account ${email.trim()}.`,
      );
    } else {
      toast.info(
        "Please enter your registered email address first, or contact Sri Amman Store support at +91 98400 12345.",
      );
    }
  };

  // Clean one-time Firebase oobCode parameters from browser URL after consumption
  const clearConsumedEmailLinkSearchParams = () => {
    if (typeof window === "undefined" || !window.history?.replaceState) return;
    try {
      const url = new URL(window.location.href);
      const authParams = ["mode", "oobCode", "apiKey", "continueUrl", "lang", "emailLink"];
      let modified = false;
      for (const param of authParams) {
        if (url.searchParams.has(param)) {
          url.searchParams.delete(param);
          modified = true;
        }
      }
      if (modified) {
        window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
      }
    } catch {
      // Ignore URL replacement errors
    }
  };

  // 5. Complete Firebase Email-Link Sign-In & Customer Profile Resolution Action
  const handleCompleteEmailLink = async (targetLinkUrl: string, emailOverride?: string) => {
    if (isCompletingEmailLink || isResolvingIdentity || emailLinkAuthService.isCompletingSignIn()) {
      return;
    }
    setEmailLinkError("");
    setIsCompletingEmailLink(true);
    try {
      const resolution = await completeEmailLinkSignIn(targetLinkUrl, emailOverride);
      setEmailLinkNeedsConfirmation(false);
      setIsEmailLinkCallback(false);
      clearConsumedEmailLinkSearchParams();

      if (resolution.status === "resolved") {
        toast.success(`Welcome back, ${resolution.profile.name}!`);
        navigatePostLogin();
      } else if (resolution.status === "unlinked") {
        toast.warning(
          "Email verified, but no linked Sri Amman Smart Store customer account was found.",
        );
      } else {
        const notice = describeIdentityResolutionState(resolution);
        toast.error(notice?.title || "Could not load your Sri Amman Smart Store customer profile.");
      }
    } catch (err: unknown) {
      if (err instanceof EmailLinkAuthError && err.requiresEmailInput) {
        setEmailLinkNeedsConfirmation(true);
        setEmailLinkError(err.message);
      } else {
        const msg = err instanceof Error ? err.message : "Could not complete email-link sign-in.";
        setEmailLinkError(msg);
        toast.error(msg);
      }
    } finally {
      setIsCompletingEmailLink(false);
    }
  };

  // Detect email-link sign-in callback on mount
  useEffect(() => {
    if (typeof window === "undefined" || authMode === "production") return;

    const existingAuthUser = emailLinkAuthService.getCurrentFirebaseAuthUser();
    const currentHref = window.location.href;
    const inspection = emailLinkAuthService.inspectCallbackUrl(currentHref);

    if (inspection.status === "valid_link") {
      if (existingAuthUser) {
        clearConsumedEmailLinkSearchParams();
        return;
      }

      setIsEmailLinkCallback(true);
      setEmailLinkCallbackUrl(currentHref);

      const storedPendingEmail = emailLinkAuthService.getPendingEmail();
      if (storedPendingEmail) {
        setConfirmationEmailInput(storedPendingEmail);
        if (!hasAttemptedAutoCallbackRef.current) {
          hasAttemptedAutoCallbackRef.current = true;
          void handleCompleteEmailLink(currentHref, storedPendingEmail);
        }
      } else {
        setEmailLinkNeedsConfirmation(true);
      }
    } else if (inspection.status === "invalid_or_incomplete_link") {
      setIsEmailLinkCallback(false);
      setEmailLinkError(
        inspection.message ||
          "This sign-in link is invalid, expired, or incomplete. Please request a new email sign-in link.",
      );
    }
  }, [authMode]);

  // Submit Email Confirmation for Cross-Browser / Manual Link Completion
  const handleConfirmEmailForLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl =
      emailLinkCallbackUrl ||
      emulatorGeneratedLink ||
      (typeof window !== "undefined" ? window.location.href : "");
    await handleCompleteEmailLink(targetUrl, confirmationEmailInput);
  };

  // Handle individual OTP digit change
  const handleDigitChange = (index: number, val: string) => {
    if (val.length > 1) {
      const numeric = val.replace(/\D/g, "").slice(0, 6);
      if (!numeric) return;
      const newArr = [...otpDigits];
      const startIdx = numeric.length === 6 ? 0 : index;
      for (let i = 0; i < numeric.length && startIdx + i < 6; i++) {
        newArr[startIdx + i] = numeric[i] ?? "";
      }
      setOtpDigits(newArr);
      const nextFocus = Math.min(startIdx + numeric.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const single = val.replace(/\D/g, "");
    const newArr = [...otpDigits];
    newArr[index] = single;
    setOtpDigits(newArr);

    if (single && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle clipboard paste across the 6 OTP boxes even when maxLength={1} is set
  const handleDigitPaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData?.getData("text") ?? "";
    const numeric = pasted.replace(/\D/g, "").slice(0, 6);
    if (!numeric) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    const newArr = [...otpDigits];
    const startIdx = numeric.length === 6 ? 0 : index;
    for (let i = 0; i < numeric.length && startIdx + i < 6; i++) {
      newArr[startIdx + i] = numeric[i] ?? "";
    }
    setOtpDigits(newArr);
    const nextFocus = Math.min(startIdx + numeric.length, 5);
    inputRefs.current[nextFocus]?.focus();
  };

  // Handle backspace / arrow key navigation
  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (otpDigits[index]) {
        e.preventDefault();
        const newArr = [...otpDigits];
        newArr[index] = "";
        setOtpDigits(newArr);
      } else if (index > 0) {
        e.preventDefault();
        const newArr = [...otpDigits];
        newArr[index - 1] = "";
        setOtpDigits(newArr);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    } else if (/^\d$/.test(e.key) && otpDigits[index]) {
      e.preventDefault();
      const newArr = [...otpDigits];
      newArr[index] = e.key;
      setOtpDigits(newArr);
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Apply Referral Code
  const handleApplyReferral = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!referralCode.trim()) return;
    const res = await validateReferralCode(referralCode);
    if (res.valid) {
      setReferralApplied(true);
      setReferralMessage(res.message);
      toast.success(res.message);
    } else {
      setReferralApplied(false);
      setReferralMessage(res.message);
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface antialiased">
      <main className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-xl rounded-[28px] border border-outline-variant/20 bg-surface-container-lowest p-5 shadow-[0_24px_60px_rgba(17,24,39,0.08)] sm:p-8">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                Welcome back
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">
                Sign in to Sri Amman
              </h1>
              <p className="mt-1 text-xs text-on-surface-variant">
                Choose your preferred sign-in method.
              </p>
            </div>
            <Link
              to="/sign-up"
              search={searchParams.redirect ? ({ redirect: searchParams.redirect } as any) : undefined}
              className="whitespace-nowrap rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/10"
            >
              Create account
            </Link>
          </div>

          {searchParams.redirect?.startsWith("/checkout") && (
            <p
              role="status"
              className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-on-surface-variant"
            >
              Sign in or create an account to continue checkout. The items in your cart are saved and will be ready when you return.
            </p>
          )}

          {/* Email-Link Callback / Cross-Browser Confirmation */}
          {(isEmailLinkCallback || emailLinkNeedsConfirmation) && !firebaseUser && (
            <form
              onSubmit={handleConfirmEmailForLink}
              className="mb-6 space-y-4 rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                  Complete email sign-in
                </p>
                <p className="mt-1 text-[11px] text-on-surface-variant">
                  Confirm the email used to request this sign-in link.
                </p>
              </div>
              <input
                type="email"
                required
                value={confirmationEmailInput}
                onChange={(e) => setConfirmationEmailInput(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-3 py-2.5 text-sm font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {emailLinkError && (
                <div className="rounded-xl border border-error/20 bg-error/10 p-3 text-xs font-semibold text-error">
                  {emailLinkError}
                </div>
              )}
              <button
                type="submit"
                disabled={isCompletingEmailLink || !confirmationEmailInput.trim()}
                className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-white transition-opacity hover:bg-primary-container disabled:opacity-50"
              >
                {isCompletingEmailLink ? "Verifying sign-in link..." : "Complete email-link sign-in"}
              </button>
            </form>
          )}

          {emailLinkSentMessage && !firebaseUser && (
            <div className="mb-6 rounded-2xl border border-secondary/30 bg-secondary-fixed/25 p-4 text-xs">
              <p className="font-bold text-secondary">Link ready</p>
              <p className="mt-1 text-on-surface">{emailLinkSentMessage}</p>
            </div>
          )}

          {/* Section A: Mobile OTP Authentication */}
          <div className="space-y-4">
            <div id="login-recaptcha-container" aria-hidden="true" />

            {!otpSent ? (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-on-surface" htmlFor="phone-input">
                    Mobile number <span className="text-primary">*</span>
                  </label>
                  <span className="text-[11px] font-bold text-primary">Instant OTP</span>
                </div>

                <div className="flex items-center rounded-xl border border-outline-variant/20 bg-surface-container-lowest px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="bg-transparent pr-2 text-xs font-bold text-on-surface focus:outline-none"
                    aria-label="Select country code"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <input
                    id="phone-input"
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit number"
                    className="w-full bg-transparent px-2 py-1 text-sm font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => void handleSendOtp()}
                  disabled={isSubmitting || isEmailSubmitting || !isPhoneValid}
                  className="mt-1 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-sm transition-opacity hover:bg-primary-container disabled:opacity-50"
                >
                  {isSubmitting ? "Sending OTP..." : "Get OTP Passcode"}
                </button>
              </div>
            ) : (
              <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Enter 6-digit OTP</span>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpDigits(["", "", "", "", "", ""]);
                    }}
                    className="font-bold text-primary hover:underline"
                  >
                    Change number
                  </button>
                </div>

                <div
                  id="otp-container"
                  className="w-full max-w-md mx-auto grid grid-cols-6 gap-2 box-border"
                >
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        inputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete={idx === 0 ? "one-time-code" : "off"}
                      size={1}
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      onPaste={(e) => handleDigitPaste(idx, e)}
                      aria-label={`OTP Digit ${idx + 1}`}
                      className="h-11 w-full min-w-0 max-w-full box-border px-0 py-0 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-center text-lg font-black text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                  <span>
                    Resend in <strong className="text-primary">00:{resendTimer < 10 ? `0${resendTimer}` : resendTimer}s</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleResendOtp()}
                    disabled={resendTimer > 0 || isSubmitting}
                    className={`font-bold ${resendTimer > 0 ? "cursor-not-allowed text-on-surface-variant/60" : "text-primary hover:underline"}`}
                  >
                    Resend code
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void handleVerifyOtp()}
                  disabled={isSubmitting || otpDigits.join("").length < 6}
                  className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:bg-primary-container disabled:opacity-50"
                >
                  {isSubmitting ? "Verifying..." : "Verify & Continue"}
                </button>
              </div>
            )}

            {otpError && (
              <div className="rounded-xl border border-error/20 bg-error/10 p-3 text-xs font-semibold text-error">
                {otpError}
              </div>
            )}
          </div>

          {/* Separator */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="w-full border-t border-outline-variant/20" />
            <span className="absolute bg-surface-container-lowest px-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              OR
            </span>
          </div>

          {/* Section B: Email & Password */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {firebaseUser && identityResolution?.status === "unlinked" && identityNotice && (
              <div className="rounded-2xl border border-secondary/30 bg-secondary-fixed/25 p-4 text-xs">
                <p className="font-bold text-secondary">{identityNotice.title}</p>
                <p className="mt-1 text-on-surface">{identityNotice.userMessage}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-on-surface" htmlFor="email-input">
                Email address <span className="text-primary">*</span>
              </label>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3.5 py-2.5 text-sm font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-on-surface" htmlFor="pwd-input">
                  Password <span className="text-primary">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-bold text-primary hover:underline focus:outline-none"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative flex items-center rounded-xl border border-outline-variant/20 bg-surface-container-low px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-primary">
                <input
                  id="pwd-input"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent pr-10 text-sm font-bold text-on-surface placeholder:text-on-surface-variant focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 text-on-surface-variant hover:text-on-surface focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {emailError && (
              <div className="rounded-xl border border-error/20 bg-error/10 p-3 text-xs font-semibold text-error">
                {emailError}
              </div>
            )}

            <button
              type="submit"
              disabled={isEmailSubmitting || isSubmitting || !email.trim() || password.length < 6}
              className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-md transition-opacity hover:bg-primary-container disabled:opacity-50"
            >
              {isEmailSubmitting ? "Signing in..." : "Sign in with Email"}
            </button>
          </form>

          {/* Section C: Google Auth */}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => void handleGoogleLogin()}
              disabled={isSubmitting || isEmailSubmitting}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest py-3 text-sm font-bold text-on-surface transition-all hover:bg-surface-container-low hover:border-outline-variant/50 disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSubmitting ? "Connecting to Google..." : "Continue with Google"}</span>
            </button>
          </div>

          {/* Section D: Referral & Legal */}
          <div className="mt-5 rounded-xl border border-outline-variant/15 bg-surface-container-low p-3">
            <button
              type="button"
              onClick={() => setIsReferralOpen((prev) => !prev)}
              className="flex w-full items-center justify-between text-left text-xs font-bold text-on-surface"
            >
              <span>Have a referral code?</span>
              <span className="text-primary">{isReferralOpen ? "Hide" : "Add"}</span>
            </button>
            {isReferralOpen && (
              <form onSubmit={handleApplyReferral} className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Enter referral code"
                  className="flex-1 rounded-lg border border-outline-variant/20 bg-surface-container-lowest px-3 py-2 text-xs font-bold uppercase text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-secondary px-3 py-2 text-xs font-bold text-on-secondary"
                >
                  Apply
                </button>
              </form>
            )}
            {referralMessage && (
              <p className={`mt-2 text-[11px] ${referralApplied ? "text-primary" : "text-error"}`}>
                {referralMessage}
              </p>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] text-on-surface-variant">
            By continuing, you agree to the Sri Amman Smart Store{" "}
            <Link to="/policies" className="font-bold text-primary underline-offset-4 hover:underline">
              Terms of Service
            </Link>{" "}
            &amp;{" "}
            <Link to="/policies" className="font-bold text-primary underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
