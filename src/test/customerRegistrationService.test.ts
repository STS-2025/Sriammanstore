import { describe, expect, it } from "vitest";
import {
  classifyCustomerRegistrationOutcome,
  customerRegistrationFormSchema,
  customerRegistrationSchema,
  getCustomerRegistrationMethods,
} from "../services/customerRegistration";

describe("customer registration service and validation", () => {
  it("validates full customer registration form fields", () => {
    const validData = {
      fullName: "Arun Kumar",
      email: "arun@example.com",
      password: "password123",
      confirmPassword: "password123",
      countryCode: "+91",
      phone: "9876543210",
      dob: "1995-05-20",
      gender: "male" as const,
      referralCode: "SASS0000104",
      termsAccepted: true as const,
    };

    const result = customerRegistrationFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.dob).toBe("1995-05-20");
      expect(result.data.email).toBe("arun@example.com");
      expect(result.data.fullName).toBe("Arun Kumar");
      expect(result.data.phone).toBe("9876543210");
    }
  });

  it("enforces password confirmation matching", () => {
    const invalidData = {
      fullName: "Arun Kumar",
      email: "arun@example.com",
      password: "password123",
      confirmPassword: "differentPassword",
      countryCode: "+91",
      phone: "9876543210",
      termsAccepted: true,
    };

    const result = customerRegistrationFormSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.message === "Passwords do not match.")).toBe(true);
    }
  });

  it("enforces minimum password length of 6 characters", () => {
    const shortPasswordData = {
      fullName: "Arun Kumar",
      email: "arun@example.com",
      password: "123",
      confirmPassword: "123",
      countryCode: "+91",
      phone: "9876543210",
      termsAccepted: true,
    };

    const result = customerRegistrationFormSchema.safeParse(shortPasswordData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.message === "Password must be at least 6 characters."),
      ).toBe(true);
    }
  });

  it("requires terms and conditions acceptance", () => {
    const noTermsData = {
      fullName: "Arun Kumar",
      email: "arun@example.com",
      password: "password123",
      confirmPassword: "password123",
      countryCode: "+91",
      phone: "9876543210",
      termsAccepted: false,
    };

    const result = customerRegistrationFormSchema.safeParse(noTermsData);
    expect(result.success).toBe(false);
  });

  it("validates dob format is YYYY-MM-DD when provided, allowing empty string/undefined", () => {
    const validWithNoDob = {
      fullName: "Arun Kumar",
      email: "arun@example.com",
      password: "password123",
      confirmPassword: "password123",
      countryCode: "+91",
      phone: "9876543210",
      dob: "",
      termsAccepted: true,
    };
    expect(customerRegistrationFormSchema.safeParse(validWithNoDob).success).toBe(true);

    const invalidDob = {
      ...validWithNoDob,
      dob: "20-05-1995", // invalid format
    };
    expect(customerRegistrationFormSchema.safeParse(invalidDob).success).toBe(false);
  });

  it("maintains legacy phone schema backwards compatibility", () => {
    expect(
      customerRegistrationSchema.safeParse({ countryCode: "+91", phone: "9876543210" }).success,
    ).toBe(true);
    expect(
      customerRegistrationSchema.safeParse({ countryCode: "+91", phone: "12345" }).success,
    ).toBe(false);
  });

  it("enables emailPassword and google methods without requiring phone OTP", () => {
    const methods = getCustomerRegistrationMethods("production");
    expect(methods).toEqual({
      emailPassword: true,
      google: true,
      phoneOtp: false,
    });
  });

  it("classifies authenticated-but-unlinked identity as incomplete registration", () => {
    const result = {
      status: "unlinked",
      ok: false,
      code: "identity/unlinked-uid",
      uid: "test-auth-uid",
      userDocId: null,
      profile: null,
      requiresRegistration: true,
      message: "No mapping",
    } as const;
    expect(classifyCustomerRegistrationOutcome(result).kind).toBe("profile-pending");
  });
});
