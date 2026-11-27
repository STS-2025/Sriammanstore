import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAuth } from "../../context/AuthContext";
import { authManager } from "../../services/authAdapter";
import { authService } from "../../services/authService";
import { customerIdentityService } from "../../services/customerIdentityService";
import { referralAttribution } from "../../services/referralAttribution";
import {
  customerRegistrationFormSchema,
  getCustomerRegistrationMethods,
} from "../../services/customerRegistration";

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "USA/Canada (+1)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+61", label: "Australia (+61)" },
  { code: "+971", label: "UAE (+971)" },
];

interface PartialAuthSession {
  uid: string;
  email: string;
}

interface FormFieldErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  referralCode?: string;
  termsAccepted?: string;
}

export function CustomerRegistrationForm({
  redirectTo,
  initialEmail,
  initialPhone,
  initialCountryCode,
  initialReferralCode,
}: {
  redirectTo?: string | undefined;
  initialEmail?: string;
  initialPhone?: string;
  initialCountryCode?: string;
  initialReferralCode?: string;
}) {
  const { authMode, resolveFirebaseSession, logout } = useAuth();
  const navigate = useNavigate();
  const methods = getCustomerRegistrationMethods(authMode);

  // Form fields
  const googleName = typeof window !== "undefined" ? sessionStorage.getItem("signup-google-name") || "" : "";
  const googlePhone = typeof window !== "undefined" ? sessionStorage.getItem("signup-google-phone") || "" : "";
  const [fullName, setFullName] = useState(googleName);
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const phonePrefill = initialPhone || googlePhone;
  const inferredCountry = COUNTRY_CODES.find((item) => phonePrefill.startsWith(item.code));
  const [countryCode, setCountryCode] = useState(
    COUNTRY_CODES.some((item) => item.code === initialCountryCode) ? initialCountryCode! : inferredCountry?.code ?? "+91",
  );
  const [phone, setPhone] = useState(() => {
    const digits = (phonePrefill || "").replace(/\D/g, "");
    const prefixDigits = (COUNTRY_CODES.find((item) => phonePrefill.startsWith(item.code))?.code || "").replace(/\D/g, "");
    const national = prefixDigits && digits.startsWith(prefixDigits) ? digits.slice(prefixDigits.length) : digits;
    return national.length === 10 ? national : "";
  });
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [referralCode, setReferralCode] = useState(
    referralAttribution.get() || initialReferralCode || "",
  );
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [referralFeedback, setReferralFeedback] = useState<string | null>(null);

  // Partial failure recovery state
  const [partialAuth, setPartialAuth] = useState<PartialAuthSession | null>(null);

  // The Google profile handoff is one-time and stays out of the signup URL.
  useEffect(() => {
    sessionStorage.removeItem("signup-google-name");
    sessionStorage.removeItem("signup-google-phone");
  }, []);

  const navigateAfterRegistration = () => {
    if (redirectTo?.startsWith("/addresses?")) {
      navigate({ to: redirectTo as never });
      return;
    }

    navigate({
      to: "/addresses",
      search: {
        action: "add",
        ...(redirectTo ? { redirect: redirectTo } : {}),
      },
    });
  };

  const clearFieldError = (field: keyof FormFieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleReferralBlur = async () => {
    const clean = referralCode.trim().toUpperCase();
    if (!clean) {
      setReferralFeedback(null);
      return;
    }
    try {
      const res = await authService.validateReferralCode(clean);
      if (res.valid) {
        setReferralFeedback(`Valid code: +${res.bonusCoins} bonus Smart Coins on first order!`);
      } else {
        setReferralFeedback(res.message);
      }
    } catch {
      setReferralFeedback(null);
    }
  };

  /**
   * Completes customer profile creation and resolves the user's application session.
   */
  const createCustomerProfileAndFinish = async (uid: string, targetEmail: string) => {
    const cleanName = fullName.trim();
    const cleanPhone = phone.replace(/\D/g, "");
    const cleanCountry = countryCode || "+91";
    const cleanDob = dob.trim() || null;
    const cleanGender = gender.trim() || null;
    const cleanReferral = referralCode.trim().toUpperCase() || null;

    setStatus("Setting up your customer profile…");

    const { profile } = await customerIdentityService.provisionCustomerAccount({
      uid,
      email: targetEmail,
      fullName: cleanName,
      number: cleanPhone,
      countryCode: cleanCountry,
      phoneVerified: false,
      dob: cleanDob,
      gender: cleanGender,
      referredBy: cleanReferral,
    });

    setStatus("Finalizing your account session…");

    await resolveFirebaseSession(
      {
        uid,
        email: targetEmail,
        emailVerified: false,
        phoneNumber: null,
        providerId: "firebase-email",
      },
      { force: true },
    );

    referralAttribution.clear();

    setStatus(`Welcome, ${profile.name || cleanName}! Your customer account is ready.`);
    setPartialAuth(null);
    setTimeout(() => {
      navigateAfterRegistration();
    }, 800);
  };

  /**
   * Main form submission handler.
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setFieldErrors({});

    const formData = {
      fullName,
      email,
      password,
      confirmPassword,
      countryCode,
      phone,
      dob: dob || undefined,
      gender: gender || undefined,
      referralCode: referralCode.trim() || undefined,
      termsAccepted: termsAccepted as true,
    };

    const parsed = customerRegistrationFormSchema.safeParse(formData);
    if (!parsed.success) {
      const errors: FormFieldErrors = {};
      for (const issue of parsed.error.issues) {
        const fieldName = String(issue.path[0]) as keyof FormFieldErrors;
        if (!errors[fieldName]) {
          errors[fieldName] = issue.message;
        }
      }
      setFieldErrors(errors);
      setError("Please correct the highlighted fields before submitting.");
      return;
    }

    if (!methods.emailPassword) {
      setError("Email and password registration is unavailable in this session.");
      return;
    }

    setIsSubmitting(true);
    let createdUid = partialAuth?.uid;

    try {
      // Step 1: Create Firebase Auth Account (skip if already partially created)
      if (!createdUid) {
        setStatus("Creating your login credentials…");
        const authIdentity = await authManager.createUserWithEmailAndPassword(
          parsed.data.email,
          parsed.data.password,
        );
        createdUid = authIdentity.uid;
        setPartialAuth({ uid: createdUid, email: parsed.data.email });
      }

      // Step 2: Create Customer Profile and bind identity mapping
      await createCustomerProfileAndFinish(createdUid, parsed.data.email);
    } catch (cause: unknown) {
      const msg = cause instanceof Error ? cause.message : "Registration could not be completed.";
      setError(msg);

      if (createdUid) {
        // Auth succeeded, but profile creation failed: keep partialAuth for retry
        setPartialAuth({ uid: createdUid, email: parsed.data.email });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Retry handler for partial failure recovery.
   */
  const handleRetryProfileSetup = async () => {
    if (!partialAuth) return;
    setError("");
    setStatus("");
    setIsSubmitting(true);
    try {
      await createCustomerProfileAndFinish(partialAuth.uid, partialAuth.email);
    } catch (cause: unknown) {
      const msg = cause instanceof Error ? cause.message : "Profile setup could not be completed.";
      setError(`Profile setup failed: ${msg}. You can try again or contact support.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSession = async () => {
    await logout();
    setPartialAuth(null);
    setError("");
    setStatus("");
  };

  return (
    <div className="space-y-6" aria-label="Customer sign up">
      {/* Status banner */}
      {status && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 p-3.5 text-sm text-primary"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
          <p className="font-medium">{status}</p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p className="font-medium">{error}</p>
            {partialAuth && (
              <p className="text-xs opacity-90">
                Your login credentials exist for <strong>{partialAuth.email}</strong>. Use the button
                below to finish creating your customer profile without starting over.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Partial failure retry banner */}
      {partialAuth && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
            Pending Profile Completion
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Your login account ({partialAuth.email}) is authenticated, but your profile needs to be
            completed in the database.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleRetryProfileSetup()}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying Profile Setup…
                </>
              ) : (
                "Retry Profile Setup"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => void handleResetSession()}
            >
              Start Over with Different Account
            </Button>
          </div>
        </div>
      )}

      {/* Main Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-fullName">
            Full Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="reg-fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="e.g. Arun Kumar"
            value={fullName}
            disabled={isSubmitting}
            onChange={(e) => {
              setFullName(e.target.value);
              clearFieldError("fullName");
            }}
            aria-invalid={Boolean(fieldErrors.fullName)}
            aria-describedby={fieldErrors.fullName ? "reg-fullName-error" : undefined}
          />
          {fieldErrors.fullName && (
            <p id="reg-fullName-error" className="text-xs text-destructive" role="alert">
              {fieldErrors.fullName}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-email">
            Email Address <span className="text-destructive">*</span>
          </Label>
          <Input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="e.g. arun@example.com"
            value={email}
            disabled={isSubmitting || Boolean(partialAuth)}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "reg-email-error" : undefined}
          />
          {fieldErrors.email && (
            <p id="reg-email-error" className="text-xs text-destructive" role="alert">
              {fieldErrors.email}
            </p>
          )}
        </div>

        {/* Password & Confirm Password */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reg-password">
              Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="reg-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                value={password}
                disabled={isSubmitting || Boolean(partialAuth)}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                  clearFieldError("confirmPassword");
                }}
                className="pr-10"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? "reg-password-error" : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password visibility" : "Show password visibility"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="reg-password-error" className="text-xs text-destructive" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-confirmPassword">
              Confirm Password <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="reg-confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={confirmPassword}
                disabled={isSubmitting || Boolean(partialAuth)}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError("confirmPassword");
                }}
                className="pr-10"
                aria-invalid={Boolean(fieldErrors.confirmPassword)}
                aria-describedby={
                  fieldErrors.confirmPassword ? "reg-confirmPassword-error" : undefined
                }
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide confirm password visibility" : "Show confirm password visibility"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p id="reg-confirmPassword-error" className="text-xs text-destructive" role="alert">
                {fieldErrors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        {/* Mobile Number (with Country Code) */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-phone">
            Mobile Number <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-[8.5rem_1fr] gap-2">
            <select
              id="reg-countryCode"
              aria-label="Country code"
              value={countryCode}
              disabled={isSubmitting}
              onChange={(e) => setCountryCode(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {COUNTRY_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
            <Input
              id="reg-phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              placeholder="10-digit mobile number"
              value={phone}
              disabled={isSubmitting}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                clearFieldError("phone");
              }}
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? "reg-phone-error" : undefined}
            />
          </div>
          {fieldErrors.phone && (
            <p id="reg-phone-error" className="text-xs text-destructive" role="alert">
              {fieldErrors.phone}
            </p>
          )}
          <p className="text-xs text-on-surface-variant">
            Used for delivery updates and contact. Phone OTP verification is optional now and will be verified at checkout.
          </p>
        </div>

        {/* Date of Birth & Gender (Optional) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="reg-dob">
              Date of Birth <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <Input
              id="reg-dob"
              name="dob"
              type="date"
              value={dob}
              disabled={isSubmitting}
              onChange={(e) => {
                setDob(e.target.value);
                clearFieldError("dob");
              }}
              aria-invalid={Boolean(fieldErrors.dob)}
              aria-describedby={fieldErrors.dob ? "reg-dob-error" : undefined}
            />
            {fieldErrors.dob && (
              <p id="reg-dob-error" className="text-xs text-destructive" role="alert">
                {fieldErrors.dob}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-gender">
              Gender <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <select
              id="reg-gender"
              name="gender"
              value={gender}
              disabled={isSubmitting}
              onChange={(e) => {
                setGender(e.target.value);
                clearFieldError("gender");
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
        </div>

        {/* Referral Code (Optional) */}
        <div className="space-y-1.5">
          <Label htmlFor="reg-referralCode">
            Referral Code <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
          </Label>
          <Input
            id="reg-referralCode"
            name="referralCode"
            type="text"
            placeholder="e.g. SASS0000104 or AMMAN50"
            value={referralCode}
            disabled={isSubmitting}
            onChange={(e) => {
              setReferralCode(e.target.value.toUpperCase());
              setReferralFeedback(null);
            }}
            onBlur={handleReferralBlur}
            className="font-mono uppercase"
          />
          {referralFeedback && (
            <p className="text-xs text-primary font-medium">{referralFeedback}</p>
          )}
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="space-y-1 pt-1">
          <label className="flex items-start gap-2.5 text-sm text-on-surface cursor-pointer">
            <input
              id="reg-terms"
              name="termsAccepted"
              type="checkbox"
              checked={termsAccepted}
              disabled={isSubmitting}
              onChange={(e) => {
                setTermsAccepted(e.target.checked);
                clearFieldError("termsAccepted");
              }}
              className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
            />
            <span className="leading-tight text-xs sm:text-sm text-on-surface-variant">
              I agree to the{" "}
              <a href="/help" target="_blank" rel="noreferrer" className="text-primary underline">
                Terms and Conditions
              </a>{" "}
              and Privacy Policy.
            </span>
          </label>
          {fieldErrors.termsAccepted && (
            <p id="reg-terms-error" className="text-xs text-destructive" role="alert">
              {fieldErrors.termsAccepted}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full text-base font-semibold py-6 shadow-sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Creating Account…
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

    </div>
  );
}
