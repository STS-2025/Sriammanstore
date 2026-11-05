import React, { useState, useEffect, useRef } from "react";
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck, RefreshCw, X, ArrowLeft } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  phoneVerificationService,
  formatToE164,
  validatePhoneNumber,
  mapPhoneAuthError,
  type PhoneVerificationSession,
} from "../../services/phoneVerificationService";
import { notificationService } from "../../services/notificationService";
import { toast } from "sonner";

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)", digits: 10 },
  { code: "+1", label: "USA/Canada (+1)", digits: 10 },
  { code: "+44", label: "UK (+44)", digits: 10 },
  { code: "+61", label: "Australia (+61)", digits: 9 },
  { code: "+971", label: "UAE (+971)", digits: 9 },
];

export interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (verifiedPhone: string) => void;
  initialPhone?: string;
  initialCountryCode?: string;
  title?: string;
  subtitle?: string;
}

type VerificationStep = "phone_input" | "otp_input" | "sync_error" | "success";

export function PhoneVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  initialPhone = "",
  initialCountryCode = "+91",
  title = "Verify Mobile Number",
  subtitle = "Verify your mobile number with OTP to continue with checkout and receive delivery rider updates.",
}: PhoneVerificationModalProps) {
  const { user, refreshUser } = useAuth();

  // Extract initial national digits if initialPhone was already formatted (e.g. "+91 98400 12345")
  const defaultDigits = (initialPhone || user?.phone || "")
    .replace(/^\+\d{1,4}\s*/, "")
    .replace(/\D/g, "")
    .slice(-10);

  const [countryCode, setCountryCode] = useState<string>(initialCountryCode);
  const [nationalNumber, setNationalNumber] = useState<string>(defaultDigits);
  const [otpCode, setOtpCode] = useState<string>("");
  const [step, setStep] = useState<VerificationStep>("phone_input");

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  // Active Firebase confirmation state
  const [confirmationResult, setConfirmationResult] = useState<PhoneVerificationSession | null>(null);
  const [verifiedE164Phone, setVerifiedE164Phone] = useState<string>("");
  const [isRecaptchaSolved, setIsRecaptchaSolved] = useState<boolean>(false);

  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const otpRequestInFlightRef = useRef(false);

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resendCooldown]);

  // Clean up reCAPTCHA when modal unmounts
  useEffect(() => {
    return () => {
      phoneVerificationService.clearRecaptcha();
    };
  }, []);

  // Initialize visible reCAPTCHA on the stable container when modal is open on phone_input step
  useEffect(() => {
    let isMounted = true;

    if (isOpen && step === "phone_input") {
      setIsRecaptchaSolved(false);

      // Brief delay to ensure ref element is rendered in DOM
      const initTimer = setTimeout(() => {
        const container = recaptchaContainerRef.current;
        if (!container || !isMounted) return;

        phoneVerificationService
          .initVisibleRecaptcha(container, {
            onSolved: () => {
              if (isMounted) {
                setIsRecaptchaSolved(true);
                setErrorMessage("");
              }
            },
            onExpired: () => {
              if (isMounted) {
                setIsRecaptchaSolved(false);
                setErrorMessage("Security verification expired. Please check the box again.");
              }
            },
            onError: (err) => {
              if (isMounted) {
                console.warn("[PhoneVerificationModal] reCAPTCHA widget error:", err);
              }
            },
          })
          .catch((err) => {
            if (isMounted) {
              console.warn("[PhoneVerificationModal] initVisibleRecaptcha error:", err);
            }
          });
      }, 50);

      return () => {
        clearTimeout(initTimer);
        isMounted = false;
        phoneVerificationService.clearRecaptcha();
      };
    }

    return () => {
      isMounted = false;
      phoneVerificationService.clearRecaptcha();
    };
  }, [isOpen, step]);

  // Reset modal state when closed
  useEffect(() => {
    if (!isOpen) {
      setErrorMessage("");
      setOtpCode("");
      setStep("phone_input");
      setIsRecaptchaSolved(false);
      phoneVerificationService.clearRecaptcha();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (otpRequestInFlightRef.current) return;
    setErrorMessage("");

    const validation = validatePhoneNumber(nationalNumber, countryCode);
    if (!validation.valid) {
      setErrorMessage(validation.error || "Please enter a valid mobile number.");
      return;
    }

    const verifier = phoneVerificationService.getActiveVerifier();
    if (!verifier) {
      setErrorMessage("Security verification is loading. Please wait a moment and try again.");
      return;
    }

    if (!isRecaptchaSolved) {
      setErrorMessage("Please check the 'I'm not a robot' box below before requesting an OTP.");
      return;
    }

    const e164 = formatToE164(countryCode, nationalNumber);
    otpRequestInFlightRef.current = true;
    setIsLoading(true);

    try {
      // Dispatch OTP via Firebase Phone Auth using the active verified reCAPTCHA
      const confirmation = await phoneVerificationService.sendVerificationOtp(e164, verifier);
      setConfirmationResult(confirmation);
      setVerifiedE164Phone(e164);
      setStep("otp_input");
      setResendCooldown(30);
      toast.success(`Verification OTP sent to ${countryCode} ${nationalNumber}`);
    } catch (err: unknown) {
      const friendlyError = mapPhoneAuthError(err);
      setErrorMessage(friendlyError);
      setIsRecaptchaSolved(false);

      // Re-initialize fresh visible verifier for the customer to retry
      const container = recaptchaContainerRef.current;
      if (container) {
        phoneVerificationService
          .initVisibleRecaptcha(container, {
            onSolved: () => {
              setIsRecaptchaSolved(true);
              setErrorMessage("");
            },
            onExpired: () => {
              setIsRecaptchaSolved(false);
            },
          })
          .catch(() => {});
      }
    } finally {
      otpRequestInFlightRef.current = false;
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isLoading) return;
    if (!confirmationResult) {
      setErrorMessage("Missing verification session. Please request a new OTP.");
      setStep("phone_input");
      return;
    }

    const cleanCode = otpCode.trim().replace(/\D/g, "");
    if (cleanCode.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit OTP code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    let confirmedPhone = verifiedE164Phone;

    try {
      // 1. Verify OTP with Firebase Authentication
      const result = await phoneVerificationService.confirmVerificationOtp(
        confirmationResult,
        cleanCode
      );
      if (result.phoneNumber) {
        confirmedPhone = result.phoneNumber;
        setVerifiedE164Phone(result.phoneNumber);
      }
    } catch (err: unknown) {
      console.warn("[PhoneVerificationModal] Firebase phone verification failed.");
      setIsLoading(false);
      setErrorMessage(mapPhoneAuthError(err));
      return;
    }

    // 2. Persist verified state to onlineCustomers profile
    try {
      const activeCustomerId = user?.id || user?.userId || "";
      if (!activeCustomerId) {
        throw new Error("Your customer profile is unavailable. Sign in again, then retry synchronization without requesting another OTP.");
      }
      await phoneVerificationService.persistVerifiedPhone({
        userId: activeCustomerId,
        verifiedPhone: confirmedPhone,
        ...(user?.uid ? { uid: user.uid } : {}),
      });

      // 3. Refresh user in AuthContext so whole app reflects phoneVerified: true immediately
      await refreshUser();

      // 4. Create security notification for mobile number verification
      try {
        if (activeCustomerId) {
          await notificationService.createPhoneVerifiedNotification({
            userId: activeCustomerId,
            phone: confirmedPhone,
          });
        }
      } catch {
        console.warn("[PhoneVerificationModal] Phone verification notification failed.");
      }

      setStep("success");
      toast.success("Mobile number verified successfully!");

      setTimeout(() => {
        onSuccess(confirmedPhone);
        onClose();
      }, 1000);
    } catch (syncErr: unknown) {
      console.warn("[PhoneVerificationModal] Trusted profile synchronization failed.");
      // Phone is verified in Firebase Auth, but Firestore sync had an issue: offer safe retry
      setStep("sync_error");
      setErrorMessage(
        syncErr instanceof Error
          ? syncErr.message
          : "Your phone was verified with Firebase, but we could not update your store profile. Please click Retry to sync."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetrySync = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      const activeCustomerId = user?.id || user?.userId || "";
      if (!activeCustomerId) {
        throw new Error("Your customer profile is unavailable. Sign in again, then retry synchronization without requesting another OTP.");
      }
      await phoneVerificationService.persistVerifiedPhone({
        userId: activeCustomerId,
        verifiedPhone: verifiedE164Phone,
        ...(user?.uid ? { uid: user.uid } : {}),
      });

      await refreshUser();
      setStep("success");
      toast.success("Profile synchronized and mobile number verified!");

      setTimeout(() => {
        onSuccess(verifiedE164Phone);
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to synchronize profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="phone-verification-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-surface-container-lowest rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-outline-variant/15 animate-in zoom-in-95 duration-200 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close phone verification"
          className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 id="phone-verification-title" className="font-headline-sm text-base font-extrabold text-on-surface">
              {title}
            </h3>
            <p className="text-[11px] text-on-surface-variant mt-0.5 leading-snug">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2 animate-in fade-in duration-150"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed flex-1">{errorMessage}</span>
          </div>
        )}

        {/* ================= STEP 1: ENTER PHONE NUMBER ================= */}
        {step === "phone_input" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="pv-phone-input" className="block text-xs font-bold text-on-surface mb-1.5">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  disabled={isLoading}
                  className="bg-surface-container-low px-3 py-2.5 rounded-xl border border-outline-variant/25 text-xs font-bold text-on-surface focus:border-primary focus:outline-none"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <div className="relative flex-1">
                  <input
                    id="pv-phone-input"
                    type="tel"
                    inputMode="numeric"
                    required
                    disabled={isLoading}
                    value={nationalNumber}
                    onChange={(e) => setNationalNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98400 12345"
                    className="w-full bg-surface-container-low px-3.5 py-2.5 rounded-xl border border-outline-variant/25 text-xs font-bold text-on-surface tracking-wide focus:border-primary focus:outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px] text-primary">verified_user</span>
                A 6-digit SMS verification code will be sent to this number.
              </p>
            </div>

            {/* Stable visible reCAPTCHA container */}
            <div className="flex justify-center my-2 min-h-[78px]">
              <div
                id="recaptcha-phone-verification"
                ref={recaptchaContainerRef}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface font-headline-sm text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading || !nationalNumber.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <span>Send OTP</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 2: ENTER OTP CODE ================= */}
        {step === "otp_input" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-on-surface-variant uppercase font-bold block">
                  Verifying Number
                </span>
                <span className="text-xs font-extrabold text-primary">
                  {countryCode} {nationalNumber}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep("phone_input");
                  setOtpCode("");
                  setErrorMessage("");
                }}
                disabled={isLoading}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Change</span>
              </button>
            </div>

            <div>
              <label htmlFor="pv-otp-input" className="block text-xs font-bold text-on-surface mb-1.5">
                Enter 6-Digit OTP Code
              </label>
              <input
                id="pv-otp-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                autoFocus
                disabled={isLoading}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="• • • • • •"
                className="w-full text-center tracking-[0.5em] text-lg font-black bg-surface-container-low px-4 py-2.5 rounded-xl border border-outline-variant/25 text-on-surface focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[11px] text-on-surface-variant">
                Didn't receive code?
              </span>
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={isLoading || resendCooldown > 0}
                className="font-bold text-primary hover:underline disabled:text-outline disabled:no-underline cursor-pointer flex items-center gap-1"
              >
                {resendCooldown > 0 ? (
                  <span>Resend in {resendCooldown}s</span>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    <span>Resend OTP</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep("phone_input")}
                disabled={isLoading}
                className="flex-1 py-2.5 rounded-xl bg-surface-container text-on-surface font-headline-sm text-xs font-bold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={isLoading || otpCode.trim().length !== 6}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify OTP</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================= STEP 3: SYNC ERROR RECOVERY ================= */}
        {step === "sync_error" && (
          <div className="space-y-4 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h4 className="font-headline-sm text-sm font-extrabold text-on-surface">
                Phone Verified in Firebase
              </h4>
              <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                Your phone was verified via SMS, but our store profile update was interrupted. Click below to retry saving your verified number without requesting another OTP.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRetrySync}
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synchronizing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Profile Synchronization</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ================= STEP 4: SUCCESS ================= */}
        {step === "success" && (
          <div className="text-center py-4 space-y-2 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-headline-sm text-sm font-extrabold text-emerald-900">
              Mobile Number Verified!
            </h4>
            <p className="text-xs text-on-surface-variant">
              Your canonical phone number has been updated. Resuming checkout...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

