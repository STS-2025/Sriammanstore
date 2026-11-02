import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizeLegacyUser } from "../services/legacyUserMapper";
import { authService } from "../services/authService";
import { apiClient } from "../services/apiClient";
import { normalizeDobString, formatDobForDisplay } from "../lib/dateUtils";
import type { User } from "../types";

describe("Customer Profile Birthday to canonical DOB Field Mapping", () => {
  const testUserId = "SASS0000001";

  const baseUser: User = {
    id: testUserId,
    userId: testUserId,
    name: "Murugan Selvam",
    phone: "+91 98427 12345",
    email: "murugan@example.com",
    coins: 300,
    isVIP: false,
    referralCode: testUserId,
    createdAt: "2024-01-01T00:00:00.000Z",
    dob: "1990-05-14",
    birthday: "1990-05-14",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // SUITE 1: Canonical DOB Mapping & Stale Birthday Precedence
  // ==========================================================================
  describe("1. Canonical DOB Precedence and Deserialization", () => {
    it("prefers canonical dob when both dob and legacy birthday fields are present in raw Firestore doc", () => {
      const rawDocWithBoth = {
        userId: testUserId,
        name: "Murugan Selvam",
        phone: "+91 98427 12345",
        email: "murugan@example.com",
        coins: 100,
        dob: "1990-05-14",
        birthday: "1985-01-01", // Stale birthday that should NOT override dob
      };

      const normalized = normalizeLegacyUser(rawDocWithBoth);
      expect(normalized).not.toBeNull();
      // Canonical dob must be chosen
      expect(normalized?.dob).toBe("1990-05-14");
      // Backward-compatible birthday property mirrors canonical dob, NOT stale birthday
      expect(normalized?.birthday).toBe("1990-05-14");
    });

    it("falls back to legacy birthday only when dob is genuinely absent in raw Firestore doc", () => {
      const rawDocWithBirthdayOnly = {
        userId: testUserId,
        name: "Murugan Selvam",
        phone: "+91 98427 12345",
        email: "murugan@example.com",
        coins: 100,
        birthday: "14 August", // Legacy field
      };

      const normalized = normalizeLegacyUser(rawDocWithBirthdayOnly);
      expect(normalized).not.toBeNull();
      expect(normalized?.dob).toBe("14 August");
      expect(normalized?.birthday).toBe("14 August");
    });

    it("omits dob and birthday cleanly when neither is present in raw Firestore doc", () => {
      const rawDocWithNeither = {
        userId: testUserId,
        name: "Murugan Selvam",
        phone: "+91 98427 12345",
        email: "murugan@example.com",
        coins: 100,
      };

      const normalized = normalizeLegacyUser(rawDocWithNeither);
      expect(normalized).not.toBeNull();
      expect(normalized?.dob).toBeUndefined();
      expect(normalized?.birthday).toBeUndefined();
      expect("dob" in (normalized || {})).toBe(false);
      expect("birthday" in (normalized || {})).toBe(false);
    });
  });

  // ==========================================================================
  // SUITE 2: Profile Update Handler Writes Strictly to `dob`, Never `birthday`
  // ==========================================================================
  describe("2. Profile Updates via authService and apiClient", () => {
    it("writes updated date strictly to 'dob' and omits 'birthday' from the patch payload", async () => {
      let capturedPayload: any = null;
      const originalPatch = apiClient.patch;
      apiClient.patch = vi.fn().mockImplementation(async (_endpoint: string, data: any) => {
        capturedPayload = data;
        return {
          ...baseUser,
          ...data,
        };
      });

      try {
        const updated = await authService.updateProfile(testUserId, {
          name: "Murugan S.",
          email: "murugan.new@example.com",
          dob: "1995-10-25",
        });

        // 1. Verify patch payload sent to backend
        expect(capturedPayload).not.toBeNull();
        expect(capturedPayload.dob).toBe("1995-10-25");
        expect("birthday" in capturedPayload).toBe(false);
        expect(capturedPayload.birthday).toBeUndefined();

        // 2. Verify returned user contract
        expect(updated.dob).toBe("1995-10-25");
      } finally {
        apiClient.patch = originalPatch;
      }
    });

    it("canonicalizes legacy birthday argument to dob when caller passes birthday in update payload", async () => {
      let capturedPayload: any = null;
      const originalPatch = apiClient.patch;
      apiClient.patch = vi.fn().mockImplementation(async (_endpoint: string, data: any) => {
        capturedPayload = data;
        return {
          ...baseUser,
          ...data,
        };
      });

      try {
        // Caller accidentally passes { birthday: "20 October" } instead of dob
        const updated = await authService.updateProfile(testUserId, {
          name: "Murugan S.",
          birthday: "20 October",
        } as any);

        // Verify patch payload converted to dob and stripped birthday
        expect(capturedPayload).not.toBeNull();
        expect(capturedPayload.dob).toBe("20 October");
        expect("birthday" in capturedPayload).toBe(false);

        // Verify returned object
        expect(updated.dob).toBe("20 October");
      } finally {
        apiClient.patch = originalPatch;
      }
    });

    it("saving other profile fields does not alter, erase, or overwrite existing dob", async () => {
      let capturedPayload: any = null;
      const originalPatch = apiClient.patch;
      apiClient.patch = vi.fn().mockImplementation(async (_endpoint: string, data: any) => {
        capturedPayload = data;
        return {
          ...baseUser,
          ...data,
        };
      });

      try {
        // Customer edits only name and preferredLanguage
        const updated = await authService.updateProfile(testUserId, {
          name: "Murugan Senior",
          preferredLanguage: "Tamil",
        });

        expect(capturedPayload).not.toBeNull();
        expect(capturedPayload.name).toBe("Murugan Senior");
        expect(capturedPayload.preferredLanguage).toBe("Tamil");
        // dob and birthday must NOT be present in patch payload when not edited
        expect("dob" in capturedPayload).toBe(false);
        expect("birthday" in capturedPayload).toBe(false);

        // User retains existing dob
        expect(updated.dob).toBe(baseUser.dob);
      } finally {
        apiClient.patch = originalPatch;
      }
    });
  });

  // ==========================================================================
  // SUITE 3: Timezone Safety and Date Integrity
  // ==========================================================================
  describe("3. Timezone Shift Immunity & Display Formatting", () => {
    it("preserves YYYY-MM-DD dates identically without off-by-one day timezone shifts", () => {
      const isoDate = "1990-05-14";
      const normalized = normalizeDobString(isoDate);
      expect(normalized).toBe("1990-05-14");

      // Format for display - day 14 must remain 14
      const displayed = formatDobForDisplay(normalized);
      expect(displayed).toContain("14");
      expect(displayed).toContain("May");
      expect(displayed).toContain("1990");
      expect(displayed).not.toContain("13");
      expect(displayed).not.toContain("15");
    });

    it("safely handles ISO timestamp strings (YYYY-MM-DDTHH:mm:ss.sssZ) using UTC extraction", () => {
      // Midnight UTC date
      const utcMidnight = "1988-11-05T00:00:00.000Z";
      const normalized = normalizeDobString(utcMidnight);
      expect(normalized).toBe("1988-11-05");

      const displayed = formatDobForDisplay(normalized);
      expect(displayed).toContain("5");
      expect(displayed).toContain("November");
      expect(displayed).toContain("1988");
      expect(displayed).not.toContain("4");
      expect(displayed).not.toContain("6");
    });

    it("safely handles Date objects using UTC getters avoiding local timezone offsets", () => {
      // Create a Date at UTC midnight for 1992-08-21
      const date = new Date(Date.UTC(1992, 7, 21)); // Month index 7 is August
      const normalized = normalizeDobString(date);
      expect(normalized).toBe("1992-08-21");

      const displayed = formatDobForDisplay(normalized);
      expect(displayed).toContain("21");
      expect(displayed).toContain("August");
      expect(displayed).toContain("1992");
    });

    it("preserves descriptive text formats (e.g. '14 August') unchanged", () => {
      const textDate = "14 August";
      const normalized = normalizeDobString(textDate);
      expect(normalized).toBe("14 August");

      const displayed = formatDobForDisplay(normalized);
      expect(displayed).toBe("14 August");
    });
  });
});

