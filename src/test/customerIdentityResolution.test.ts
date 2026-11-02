import { describe, expect, it } from "vitest";
import {
  validateAuthenticatedFirebaseUser,
  validateAndNormalizeCustomerProfile,
  validateUsersByUidMapping,
} from "../services/customerIdentityService";

const uid = "firebase-customer-uid";

describe("customer identity account and collection validation", () => {
  it("requires verified email for email and Google providers but accepts phone OTP identity", () => {
    expect(
      validateAuthenticatedFirebaseUser({
        uid,
        email: "customer@example.test",
        emailVerified: false,
        providerId: "firebase-google",
      }).status,
    ).toBe("unauthenticated");
    expect(
      validateAuthenticatedFirebaseUser({
        uid,
        email: "customer@example.test",
        emailVerified: false,
        providerId: "firebase-email-password",
      }).status,
    ).toBe("unauthenticated");
    expect(
      validateAuthenticatedFirebaseUser({
        uid,
        email: null,
        emailVerified: false,
        providerId: "firebase-phone",
      }).status,
    ).toBe("authenticated");
  });

  it("accepts explicit online customer mappings", () => {
    const result = validateUsersByUidMapping(
      {
        uid,
        userDocId: "ONCUS0000041",
        collection: "onlineCustomers",
        accountType: "customer",
      },
      uid,
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.mapping.collection).toBe("onlineCustomers");
  });

  it("rejects a mapping whose stored UID differs from its document/auth UID", () => {
    const result = validateUsersByUidMapping(
      {
        uid: "other-uid",
        userDocId: "ONCUS999001",
        collection: "onlineCustomers",
        accountType: "customer",
      },
      uid,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("identity/mapping-uid-mismatch");
  });

  it("rejects missing account type for a new collection/ID pairing and invalid account type", () => {
    expect(
      validateUsersByUidMapping(
        { uid, userDocId: "SASS0000001", collection: "onlineCustomers" },
        uid,
      ).ok,
    ).toBe(false);
    expect(
      validateUsersByUidMapping(
        {
          uid,
          userDocId: "ONCUS0000001",
          collection: "onlineCustomers",
          accountType: "customerish",
        },
        uid,
      ).ok,
    ).toBe(false);
  });

  it.each(["staff", "admin"])("rejects %s mappings in customer resolution", (accountType) => {
    const result = validateUsersByUidMapping(
      { uid, userDocId: "SASS0000001", collection: "users", accountType },
      uid,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("identity/non-customer-account");
  });

  it("keeps verified historical ONCUS mappings without accountType compatible", () => {
    const mapping = validateUsersByUidMapping(
      { uid, userDocId: "ONCUS999001", collection: "onlineCustomers" },
      uid,
    );
    expect(mapping.ok).toBe(true);
    const profile = validateAndNormalizeCustomerProfile(
      {
        id: "ONCUS999001",
        userId: "ONCUS999001",
        uid,
        fullName: "Migrated Customer",
        number: "9876543210",
        countryCode: "+91",
      },
      "ONCUS999001",
      uid,
      { collection: "onlineCustomers" },
    );
    expect(profile.ok).toBe(true);
  });

  it("rejects an explicitly staff/admin profile even if a mapping claims customer", () => {
    for (const marker of ["staff", "admin"]) {
      const result = validateAndNormalizeCustomerProfile(
        { id: "SASS0000001", userId: "SASS0000001", uid, role: marker },
        "SASS0000001",
        uid,
        { collection: "users" },
      );
      expect(result.ok).toBe(false);
    }
  });
});
