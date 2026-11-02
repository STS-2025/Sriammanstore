import { z } from "zod";
import type { AuthMode } from "./authAdapter";
import type { CustomerIdentityResolutionResult } from "./customerIdentityService";

/**
 * Validates the full customer registration form.
 * Date of birth is saved strictly to the canonical `dob` field in YYYY-MM-DD format.
 * Never collects or writes a duplicate `birthday` field.
 */
export const customerRegistrationFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must be at least 2 characters."),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address.")
      .toLowerCase(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters."),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password."),
    countryCode: z
      .string()
      .regex(/^\+\d{1,4}$/, "Choose a valid country code."),
    phone: z
      .string()
      .trim()
      .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number."),
    dob: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val),
        "Date of birth must be in YYYY-MM-DD format.",
      ),
    gender: z
      .enum(["male", "female", "other", "prefer_not_to_say", ""])
      .optional(),
    referralCode: z
      .string()
      .trim()
      .optional(),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions." }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type CustomerRegistrationFormInput = z.infer<typeof customerRegistrationFormSchema>;

/**
 * Retained for backwards compatibility with any remaining legacy callers.
 */
export const customerRegistrationSchema = z.object({
  countryCode: z.string().regex(/^\+\d{1,4}$/, "Choose a valid country code."),
  phone: z
    .string()
    .trim()
    .regex(/^\d{6,15}$/, "Enter a valid mobile number."),
});

export type CustomerRegistrationInput = z.infer<typeof customerRegistrationSchema>;

export interface CustomerRegistrationMethods {
  phoneOtp: boolean;
  google: boolean;
  emailPassword: boolean;
}

/** Customer accounts support Email/Password and Google sign up without requiring Phone OTP. */
export function getCustomerRegistrationMethods(mode: AuthMode): CustomerRegistrationMethods {
  return {
    phoneOtp: false,
    google: true,
    emailPassword: true,
  };
}

export type CustomerRegistrationOutcome =
  | {
      kind: "profile-ready";
      result: Extract<CustomerIdentityResolutionResult, { status: "resolved" }>;
    }
  | {
      kind: "profile-pending";
      result: Exclude<CustomerIdentityResolutionResult, { status: "resolved" }>;
    };

/** Auth alone is never reported as complete customer registration. */
export function classifyCustomerRegistrationOutcome(
  result: CustomerIdentityResolutionResult,
): CustomerRegistrationOutcome {
  return result.status === "resolved"
    ? { kind: "profile-ready", result }
    : { kind: "profile-pending", result };
}
