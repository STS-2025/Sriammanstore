import { describe, it, expect } from "vitest";
import dbData from "../../db.json";
import {
  normalizeLegacyUser,
  normalizeLegacyUserProfile,
  normalizeLegacyUserList,
  parseStrictCoinValue,
} from "../services/legacyUserMapper";
import type { User } from "../types";

describe("Legacy Customer Profile Schema Compatibility Mapper (legacyUserMapper)", () => {
  describe("1. Complete legacy profile using fullName and number", () => {
    it("normalizes a complete legacy users/{userDocId} document into the frontend User contract", () => {
      const rawLegacyUser = {
        userId: "SASS0000001",
        uid: "firebase_auth_uid_991122",
        fullName: "Lakshmi Narayanan",
        countryCode: "+91",
        number: "9876543210",
        phoneVerified: true,
        email: "lakshmi.n@example.com",
        gender: "Female",
        dob: "1990-05-14",
        availableCoins: 320,
        earnedCoins: 450,
        primaryAddressId: "addr_gobi_home_01",
        isVIP: true,
        referralCode: "SASS0000001",
        referredBy: "SASS0000005",
        lastUpdated: "2026-03-10T08:30:00.000Z",
      };

      const normalized = normalizeLegacyUser(rawLegacyUser);
      expect(normalized).not.toBeNull();
      expect(normalized).toEqual({
        id: "SASS0000001",
        userId: "SASS0000001",
        uid: "firebase_auth_uid_991122",
        name: "Lakshmi Narayanan",
        phone: "9876543210",
        countryCode: "+91",
        phoneVerified: true,
        email: "lakshmi.n@example.com",
        gender: "Female",
        birthday: "1990-05-14",
        coins: 320,
        availableCoins: 320,
        earnedCoins: 450,
        primaryAddressId: "addr_gobi_home_01",
        isVIP: true,
        referralCode: "SASS0000001",
        referredBy: "SASS0000005",
        createdAt: "2026-03-10T08:30:00.000Z",
      });
    });

    it("exports normalizeLegacyUserProfile as an alias for normalizeLegacyUser", () => {
      expect(normalizeLegacyUserProfile).toBe(normalizeLegacyUser);
    });
  });

  describe("2. Existing normalized frontend profile input", () => {
    it("is idempotent and preserves an already-normalized frontend User object", () => {
      const existingUser: User = {
        id: "SASS0000104",
        userId: "SASS0000104",
        name: "Arun Kumar",
        phone: "+91 99999 99999",
        email: "arun.kumar@example.com",
        coins: 215,
        isVIP: false,
        referralCode: "SASS0000104",
        referredBy: "SASS0000088",
        createdAt: "2024-01-15T09:30:00.000Z",
        preferredLanguage: "Tamil / English (தமிழ் / English)",
        birthday: "1992-08-21",
        groceryRhythm: "Every Saturday Morning (4 Members)",
        avatarUrl: "https://example.com/avatar.jpg",
      };

      const once = normalizeLegacyUser(existingUser);
      const twice = normalizeLegacyUser(once);

      expect(once).toEqual(existingUser);
      expect(twice).toEqual(existingUser);
    });
  });

  describe("3. Documented aliases and deterministic field precedence", () => {
    it("resolves name precedence: name > fullName > displayName", () => {
      expect(
        normalizeLegacyUser({
          userId: "SASS0000010",
          name: "Primary Name",
          fullName: "Legacy Full Name",
          displayName: "Display Name",
        })?.name
      ).toBe("Primary Name");

      expect(
        normalizeLegacyUser({
          userId: "SASS0000010",
          name: "   ",
          fullName: "Legacy Full Name",
          displayName: "Display Name",
        })?.name
      ).toBe("Legacy Full Name");

      expect(
        normalizeLegacyUser({
          userId: "SASS0000010",
          displayName: "Display Name",
        })?.name
      ).toBe("Display Name");
    });

    it("resolves phone precedence: phone > number > phoneNumber > contact", () => {
      expect(
        normalizeLegacyUser({
          userId: "SASS0000011",
          phone: "+91 94433 12345",
          number: "9876543210",
          phoneNumber: "9111122222",
          contact: "9333344444",
        })?.phone
      ).toBe("+91 94433 12345");

      expect(
        normalizeLegacyUser({
          userId: "SASS0000011",
          number: "9876543210",
          phoneNumber: "9111122222",
          contact: "9333344444",
        })?.phone
      ).toBe("9876543210");

      expect(
        normalizeLegacyUser({
          userId: "SASS0000011",
          phoneNumber: "9111122222",
          contact: "9333344444",
        })?.phone
      ).toBe("9111122222");

      expect(
        normalizeLegacyUser({
          userId: "SASS0000011",
          contact: "9333344444",
        })?.phone
      ).toBe("9333344444");
    });

    it("resolves spendable coin precedence: coins > availableCoins > availableCoins32", () => {
      expect(
        normalizeLegacyUser({
          userId: "SASS0000012",
          coins: 120,
          availableCoins: 240,
          availableCoins32: 360,
        })?.coins
      ).toBe(120);

      expect(
        normalizeLegacyUser({
          userId: "SASS0000012",
          availableCoins: 240,
          availableCoins32: 360,
        })?.coins
      ).toBe(240);

      const fallback32 = normalizeLegacyUser({
        userId: "SASS0000012",
        availableCoins32: 360,
      });
      expect(fallback32?.coins).toBe(360);
      expect(fallback32?.availableCoins).toBe(360);
    });

    it("resolves birthday, avatarUrl, preferredLanguage, and timestamp aliases including Firestore Timestamps", () => {
      const fromAliases = normalizeLegacyUser({
        userId: "SASS0000013",
        dob: "1988-11-05",
        dateOfBirth: "1980-01-01",
        photoURL: "https://example.com/photo.png",
        profileImage: "https://example.com/profile.png",
        language: "Tamil",
        lastUpdated: { seconds: 1700000000, nanoseconds: 0 },
      });

      expect(fromAliases?.birthday).toBe("1988-11-05");
      expect(fromAliases?.avatarUrl).toBe("https://example.com/photo.png");
      expect(fromAliases?.preferredLanguage).toBe("Tamil");
      expect(fromAliases?.createdAt).toBe(new Date(1700000000 * 1000).toISOString());

      const withToDate = normalizeLegacyUser({
        userId: "SASS0000014",
        lastUpdated: {
          toDate: () => new Date("2025-06-15T12:00:00.000Z"),
        },
      });
      expect(withToDate?.createdAt).toBe("2025-06-15T12:00:00.000Z");
    });
  });

  describe("4. Phone numbers with leading zeros and formatting characters", () => {
    it("preserves leading zeros in legacy number strings without numeric truncation", () => {
      const withLeadingZero = normalizeLegacyUser({
        userId: "SASS0000020",
        fullName: "Senthil",
        number: "09876543210",
      });
      expect(withLeadingZero?.phone).toBe("09876543210");
      expect(typeof withLeadingZero?.phone).toBe("string");

      const landlineWithLeadingZero = normalizeLegacyUser({
        userId: "SASS0000021",
        fullName: "Kavitha",
        number: "04285-223344",
      });
      expect(landlineWithLeadingZero?.phone).toBe("04285-223344");
    });

    it("preserves international prefixes, spaces, hyphens, and parentheses in phone strings", () => {
      const formatted = normalizeLegacyUser({
        userId: "SASS0000022",
        fullName: "Meena",
        number: "+91 (944) 331-2345",
      });
      expect(formatted?.phone).toBe("+91 (944) 331-2345");
    });
  });

  describe("5. Profile with primaryAddressId", () => {
    it("preserves primaryAddressId on the normalized User without inventing an address object", () => {
      const profile = normalizeLegacyUser({
        userId: "SASS0000030",
        fullName: "Karthik Raja",
        number: "9442211334",
        primaryAddressId: "addr_legacy_primary_99",
      });

      expect(profile).not.toBeNull();
      expect(profile?.primaryAddressId).toBe("addr_legacy_primary_99");
      expect(Object.prototype.hasOwnProperty.call(profile, "addresses")).toBe(false);
      expect(Object.prototype.hasOwnProperty.call(profile, "defaultAddress")).toBe(false);
    });

    it("omits primaryAddressId when null, empty, or whitespace", () => {
      const profile = normalizeLegacyUser({
        userId: "SASS0000031",
        fullName: "Karthik Raja",
        number: "9442211334",
        primaryAddressId: "   ",
      });

      expect(profile).not.toBeNull();
      expect(profile?.primaryAddressId).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(profile, "primaryAddressId")).toBe(false);
    });
  });

  describe("6. Missing optional fields", () => {
    it("omits missing optional properties cleanly without undefined keys", () => {
      const minimal = normalizeLegacyUser({
        userId: "SASS0000040",
        fullName: "Minimal User",
        number: "9876500000",
      });

      expect(minimal).not.toBeNull();
      const record = minimal as unknown as Record<string, unknown>;
      for (const [key, value] of Object.entries(record)) {
        expect(value, `Expected key "${key}" not to be undefined`).not.toBeUndefined();
      }

      expect("referredBy" in record).toBe(false);
      expect("preferredLanguage" in record).toBe(false);
      expect("birthday" in record).toBe(false);
      expect("groceryRhythm" in record).toBe(false);
      expect("avatarUrl" in record).toBe(false);
      expect("primaryAddressId" in record).toBe(false);
      expect("availableCoins" in record).toBe(false);
      expect("earnedCoins" in record).toBe(false);
    });
  });

  describe("7. Missing, malformed, negative, or invalid coin values", () => {
    it("strictly validates coin values via parseStrictCoinValue", () => {
      expect(parseStrictCoinValue(0)).toBe(0);
      expect(parseStrictCoinValue(250)).toBe(250);
      expect(parseStrictCoinValue("150")).toBe(150);
      expect(parseStrictCoinValue(-1)).toBeNull();
      expect(parseStrictCoinValue(-500)).toBeNull();
      expect(parseStrictCoinValue(NaN)).toBeNull();
      expect(parseStrictCoinValue(Infinity)).toBeNull();
      expect(parseStrictCoinValue("₹100")).toBeNull();
      expect(parseStrictCoinValue("100 coins")).toBeNull();
      expect(parseStrictCoinValue(null)).toBeNull();
      expect(parseStrictCoinValue(undefined)).toBeNull();
      expect(parseStrictCoinValue(true)).toBeNull();
    });

    it("falls back to valid alias or 0 for coins while rejecting negative/malformed coin values", () => {
      const negativeCoinsWithValidLegacy = normalizeLegacyUser({
        userId: "SASS0000050",
        coins: -25,
        availableCoins: 180,
        earnedCoins: -10,
      });
      expect(negativeCoinsWithValidLegacy?.coins).toBe(180);
      expect(negativeCoinsWithValidLegacy?.availableCoins).toBe(180);
      expect(negativeCoinsWithValidLegacy?.earnedCoins).toBeUndefined();

      const allInvalidCoins = normalizeLegacyUser({
        userId: "SASS0000051",
        coins: "invalid" as unknown as number,
        availableCoins: -99,
        earnedCoins: "NaN" as unknown as number,
      });
      expect(allInvalidCoins?.coins).toBe(0);
      expect(allInvalidCoins?.availableCoins).toBeUndefined();
      expect(allInvalidCoins?.earnedCoins).toBeUndefined();
    });

    it("does not conflate earnedCoins with spendable coins when availableCoins is missing", () => {
      const onlyEarnedCoins = normalizeLegacyUser({
        userId: "SASS0000052",
        fullName: "Pending Reward Customer",
        number: "9000011111",
        earnedCoins: 75,
      });

      expect(onlyEarnedCoins?.coins).toBe(0);
      expect(onlyEarnedCoins?.availableCoins).toBeUndefined();
      expect(onlyEarnedCoins?.earnedCoins).toBe(75);
    });
  });

  describe("8. Missing user ID and conflicting ID fields", () => {
    it("returns null when no customer document ID is present, even if Firebase Auth uid exists", () => {
      expect(
        normalizeLegacyUser({
          fullName: "No ID User",
          number: "9876543210",
        })
      ).toBeNull();

      // Critical boundary: Firebase Auth UID is NOT a SASS customer document ID
      expect(
        normalizeLegacyUser({
          uid: "firebase_auth_uid_only_12345",
          fullName: "Auth UID Only User",
          number: "9876543210",
        })
      ).toBeNull();
    });

    it("resolves customer ID from context.docId or context.documentPath when omitted from doc body", () => {
      const fromContextDocId = normalizeLegacyUser(
        {
          uid: "firebase_uid_abc",
          fullName: "Snapshot User",
          number: "9876543210",
        },
        { docId: "SASS0000060" }
      );
      expect(fromContextDocId?.id).toBe("SASS0000060");
      expect(fromContextDocId?.userId).toBe("SASS0000060");
      expect(fromContextDocId?.uid).toBe("firebase_uid_abc");

      const fromPath = normalizeLegacyUser(
        {
          fullName: "Path User",
          number: "9876543210",
        },
        { documentPath: "users/SASS0000061" }
      );
      expect(fromPath?.id).toBe("SASS0000061");
      expect(fromPath?.userId).toBe("SASS0000061");
    });

    it("resolves conflicting ID fields deterministically by preferring canonical SASS IDs over non-SASS IDs", () => {
      // Case A: `id` accidentally holds Firebase UID while `userId` holds canonical SASS ID
      const userIdHasSass = normalizeLegacyUser({
        id: "firebase_uid_xyz",
        userId: "SASS0000070",
        uid: "firebase_uid_xyz",
        fullName: "Conflict A",
      });
      expect(userIdHasSass?.id).toBe("SASS0000070");
      expect(userIdHasSass?.userId).toBe("SASS0000070");

      // Case B: `id` holds canonical SASS ID while `userId` holds a non-SASS string
      const idHasSass = normalizeLegacyUser({
        id: "SASS0000071",
        userId: "legacy_temp_doc",
        fullName: "Conflict B",
      });
      expect(idHasSass?.id).toBe("SASS0000071");
      expect(idHasSass?.userId).toBe("SASS0000071");

      // Case C: both `userId` and `id` have SASS IDs -> `userId` takes precedence
      const bothSass = normalizeLegacyUser({
        userId: "SASS0000072",
        id: "SASS0000073",
        fullName: "Conflict C",
      });
      expect(bothSass?.id).toBe("SASS0000072");
      expect(bothSass?.userId).toBe("SASS0000072");
    });
  });

  describe("9. Null or malformed input", () => {
    it("returns null for null, undefined, primitive values, and arrays", () => {
      expect(normalizeLegacyUser(null)).toBeNull();
      expect(normalizeLegacyUser(undefined)).toBeNull();
      expect(normalizeLegacyUser("SASS0000001")).toBeNull();
      expect(normalizeLegacyUser(12345)).toBeNull();
      expect(normalizeLegacyUser(true)).toBeNull();
      expect(normalizeLegacyUser([{ userId: "SASS0000001" }])).toBeNull();
    });

    it("filters out invalid items and deduplicates by canonical ID in normalizeLegacyUserList", () => {
      const list = normalizeLegacyUserList([
        null,
        { uid: "only_firebase_uid" },
        { userId: "SASS0000080", fullName: "First Entry", number: "9876543210" },
        { id: "SASS0000080", fullName: "Duplicate Entry", number: "9111111111" },
        { userId: "SASS0000081", fullName: "Second Entry", number: "9222222222" },
      ]);

      expect(list).toHaveLength(2);
      expect(list[0]?.id).toBe("SASS0000080");
      expect(list[0]?.name).toBe("First Entry");
      expect(list[1]?.id).toBe("SASS0000081");
    });
  });

  describe("10. Confirmation that no missing values are fabricated", () => {
    it("does not fabricate names, phone numbers, emails, addresses, referral codes, or timestamps when missing", () => {
      const bareUser = normalizeLegacyUser({
        userId: "SASS0000099",
        email: null,
      });

      expect(bareUser).toEqual({
        id: "SASS0000099",
        userId: "SASS0000099",
        name: "",
        phone: "",
        email: "",
        coins: 0,
        isVIP: false,
        referralCode: "",
        createdAt: "",
      });
    });
  });

  describe("11. Regression cases for current mock user fixtures in db.json", () => {
    it("normalizes all db.json mock user fixtures with 100% fidelity", () => {
      const rawUsers = dbData.users;
      expect(rawUsers.length).toBeGreaterThanOrEqual(5);

      for (const fixture of rawUsers) {
        const normalized = normalizeLegacyUser(fixture);
        expect(normalized).not.toBeNull();
        const {
          fullName: _legacyFullName,
          number: _legacyNumber,
          ...expectedNormalized
        } = fixture as Record<string, unknown>;
        expect(normalized).toEqual(expectedNormalized);
      }
    });
  });
});
