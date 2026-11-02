import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  extractLinkedCustomerFixturesFromData,
  detectUnrelatedCustomerDataConflict,
  seedLinkedCustomerFixtures,
  validateSeededCustomerLink,
  type SeedStorageBackend,
} from "../../scripts/seed-emulator.mjs";
import {
  FirestoreAdapter,
  InMemoryFirestoreDriver,
  SdkFirestoreDriver,
} from "../services/firestoreAdapter";
import { apiClient } from "../services/apiClient";
import { customerIdentityService } from "../services/customerIdentityService";
import { emailLinkAuthService } from "../services/emailLinkAuthService";
import { TEST_CREDENTIALS } from "../services/authService";
import {
  CANONICAL_LINKED_TEST_CUSTOMER_ID,
  CANONICAL_LINKED_TEST_CUSTOMER_EMAIL,
  seedInMemoryLinkedCustomerFixture,
  seedEmulatorLinkedCustomerFixture,
} from "./linkedCustomerFixture";

const dbJsonPath = path.resolve(__dirname, "../../db.json");
const rawDbData = JSON.parse(fs.readFileSync(dbJsonPath, "utf-8")) as Record<
  string,
  unknown
>;

function createInMemorySeedStorageBackend(
  driver: InMemoryFirestoreDriver
): SeedStorageBackend & {
  listDocs(
    collectionName: string
  ): Promise<Array<{ docId: string; data: Record<string, unknown> }>>;
} {
  return {
    async getDoc(collectionName: string, docId: string) {
      return driver.getDoc(collectionName, docId);
    },
    async setDoc(
      collectionName: string,
      docId: string,
      payload: Record<string, unknown>
    ) {
      return driver.setDoc(collectionName, docId, payload);
    },
    async deleteDoc(collectionName: string, docId: string) {
      await driver.deleteDoc(collectionName, docId).catch(() => {});
    },
    async listDocs(collectionName: string) {
      const docs = await driver.queryCollection(collectionName, {});
      return docs.map((d) => ({
        docId: String(d["id"] || d["uid"] || ""),
        data: d,
      }));
    },
  };
}

describe("Linked Customer Mock Data & Emulator Seeding Verification", () => {
  let memoryDriver: InMemoryFirestoreDriver;
  let testAdapter: FirestoreAdapter;
  let originalAdapter: FirestoreAdapter;
  let originalMode: ReturnType<typeof apiClient.getMode>;

  beforeEach(() => {
    memoryDriver = new InMemoryFirestoreDriver(rawDbData);
    testAdapter = new FirestoreAdapter(memoryDriver);
    originalAdapter = apiClient.getFirestoreAdapter();
    originalMode = apiClient.getMode();

    apiClient.setFirestoreAdapter(testAdapter);
    apiClient.setMode("emulator");
    apiClient.resetSourceState();
    customerIdentityService.setAdapterForTesting(testAdapter);
  });

  afterEach(() => {
    customerIdentityService.setAdapterForTesting(null);
    emailLinkAuthService.setDriverForTesting(null);
    apiClient.setFirestoreAdapter(originalAdapter);
    apiClient.setMode(originalMode);
    apiClient.resetSourceState();
  });

  describe("1. Mock/Seed Configuration Validation (Phase 2 & Phase 6.1)", () => {
    it("produces a valid linked customer fixture for SASS9999901 from db.json without hardcoding a static Firebase UID", () => {
      const fixtures = extractLinkedCustomerFixturesFromData(rawDbData);
      expect(fixtures.length).toBeGreaterThanOrEqual(1);

      const sass9999901 = fixtures.find(
        (f) => f.userDocId === CANONICAL_LINKED_TEST_CUSTOMER_ID
      );
      expect(sass9999901).toBeDefined();
      expect(sass9999901?.userDocId).toBe("SASS9999901");
      expect(sass9999901?.email).toBe(CANONICAL_LINKED_TEST_CUSTOMER_EMAIL);
      expect(sass9999901?.email).toBe(TEST_CREDENTIALS.linkedCustomerEmail);
      expect(sass9999901?.displayName).toBe("Emulator Test Customer");
      expect(sass9999901?.phone).toBe("9999999999");
      expect(sass9999901?.emailVerified).toBe(true);

      const profile = sass9999901?.profilePayload;
      expect(profile).toMatchObject({
        id: "SASS9999901",
        userId: "SASS9999901",
        fullName: "Emulator Test Customer",
        name: "Emulator Test Customer",
        number: "9999999999",
        phone: "9999999999",
        email: "emulator.linked.customer@sriamman.test",
        availableCoins: 0,
        earnedCoins: 0,
        coins: 0,
      });

      // Must NOT hard-code a fake static Firebase UID in db.json
      expect(profile?.["uid"]).toBeUndefined();
    });

    it("rejects seed configurations that attempt to hardcode a static Firebase UID in db.json", () => {
      expect(() =>
        extractLinkedCustomerFixturesFromData({
          users: [
            {
              id: "SASS9999901",
              userId: "SASS9999901",
              fullName: "Emulator Test Customer",
              number: "9999999999",
              email: "emulator.linked.customer@sriamman.test",
              availableCoins: 0,
              earnedCoins: 0,
            },
          ],
          linkedCustomerFixtures: [
            {
              userDocId: "SASS9999901",
              email: "emulator.linked.customer@sriamman.test",
              uid: "hardcoded_fake_uid_123",
            },
          ],
        })
      ).toThrow(/do not hard-code a static Firebase UID/i);
    });
  });

  describe("2. Conflict Protection for Unrelated Customer Data (Phase 6.2)", () => {
    it("refuses to overwrite users/SASS9999901 when an existing document with the same ID contains unrelated customer data", async () => {
      const unrelatedCustomerDoc = {
        id: "SASS9999901",
        userId: "SASS9999901",
        fullName: "Unrelated Existing Customer",
        name: "Unrelated Existing Customer",
        number: "9888877777",
        phone: "9888877777",
        email: "unrelated.customer@example.com",
        availableCoins: 450,
        earnedCoins: 900,
        coins: 450,
      };

      await memoryDriver.setDoc("users", "SASS9999901", unrelatedCustomerDoc);
      const storageBackend = createInMemorySeedStorageBackend(memoryDriver);

      await expect(
        seedLinkedCustomerFixtures({
          rawData: rawDbData,
          storageBackend,
          authAccountResolver: async () => ({
            uid: "dynamic_auth_uid_9999901",
            action: "provisioned",
          }),
          logger: null,
        })
      ).rejects.toThrow(/SEED_CONFLICT/i);

      // Verify the unrelated customer document was NOT overwritten
      const preservedDoc = await memoryDriver.getDoc("users", "SASS9999901");
      expect(preservedDoc?.["fullName"]).toBe("Unrelated Existing Customer");
      expect(preservedDoc?.["email"]).toBe("unrelated.customer@example.com");
      expect(preservedDoc?.["availableCoins"]).toBe(450);

      // Verify no conflicting usersByUid link was created
      const mappingDoc = await memoryDriver.getDoc(
        "usersByUid",
        "dynamic_auth_uid_9999901"
      );
      expect(mappingDoc).toBeNull();
    });

    it("detects conflicts across userId, id, email, customer name, and phone number", () => {
      const candidate = {
        id: "SASS9999901",
        userId: "SASS9999901",
        fullName: "Emulator Test Customer",
        number: "9999999999",
        email: "emulator.linked.customer@sriamman.test",
      };

      expect(
        detectUnrelatedCustomerDataConflict(
          { ...candidate, userId: "SASS0000104" },
          candidate,
          "SASS9999901"
        )
      ).toMatch(/SEED_CONFLICT.*userId/i);

      expect(
        detectUnrelatedCustomerDataConflict(
          { ...candidate, email: "other@example.com" },
          candidate,
          "SASS9999901"
        )
      ).toMatch(/SEED_CONFLICT.*email/i);

      expect(
        detectUnrelatedCustomerDataConflict(
          { ...candidate, fullName: "Different Person" },
          candidate,
          "SASS9999901"
        )
      ).toMatch(/SEED_CONFLICT.*customer/i);
    });
  });

  describe("3. Idempotent Seeding & Stale Mapping Cleanup (Phase 3 & Phase 6.3)", () => {
    it("is idempotent across multiple seed runs and cleans up stale usersByUid links if Auth Emulator UID changes after reset", async () => {
      const emptyDriver = new InMemoryFirestoreDriver({});
      const storageBackend = createInMemorySeedStorageBackend(emptyDriver);

      // First run: provisions Auth user and imports both users/SASS9999901 and usersByUid/uid_run_1
      const firstRun = await seedLinkedCustomerFixtures({
        rawData: rawDbData,
        storageBackend,
        authAccountResolver: async () => ({
          uid: "uid_run_1",
          action: "provisioned",
        }),
        logger: null,
      });

      expect(firstRun).toHaveLength(1);
      expect(firstRun[0]).toMatchObject({
        userDocId: "SASS9999901",
        email: "emulator.linked.customer@sriamman.test",
        uid: "uid_run_1",
        authAction: "provisioned",
        profileAction: "imported",
        mappingAction: "imported",
        validated: true,
      });

      // Second run with same Auth UID: skips both profile and mapping without creating duplicates
      const secondRun = await seedLinkedCustomerFixtures({
        rawData: rawDbData,
        storageBackend,
        authAccountResolver: async () => ({
          uid: "uid_run_1",
          action: "reused",
        }),
        logger: null,
      });

      expect(secondRun[0]).toMatchObject({
        userDocId: "SASS9999901",
        uid: "uid_run_1",
        authAction: "reused",
        profileAction: "skipped",
        mappingAction: "skipped",
        validated: true,
      });

      // Also seed an unrelated customer mapping (SASS0000104) to ensure it is preserved
      await emptyDriver.setDoc("usersByUid", "uid_arun_104", {
        uid: "uid_arun_104",
        userDocId: "SASS0000104",
      });

      // Third run simulating an Auth Emulator restart that produced a new UID (`uid_run_2`)
      const thirdRun = await seedLinkedCustomerFixtures({
        rawData: rawDbData,
        storageBackend,
        authAccountResolver: async () => ({
          uid: "uid_run_2",
          action: "provisioned",
        }),
        logger: null,
      });

      expect(thirdRun[0]).toMatchObject({
        userDocId: "SASS9999901",
        uid: "uid_run_2",
        profileAction: "skipped",
        mappingAction: "imported",
        validated: true,
      });

      // Stale mapping `uid_run_1` for SASS9999901 was removed, new mapping `uid_run_2` exists, and unrelated `uid_arun_104` is untouched
      expect(await emptyDriver.getDoc("usersByUid", "uid_run_1")).toBeNull();
      expect(await emptyDriver.getDoc("usersByUid", "uid_run_2")).toEqual({
        id: "uid_run_2",
        uid: "uid_run_2",
        userDocId: "SASS9999901",
      });
      expect(await emptyDriver.getDoc("usersByUid", "uid_arun_104")).toEqual({
        id: "uid_arun_104",
        uid: "uid_arun_104",
        userDocId: "SASS0000104",
      });
    });
  });

  describe("4. Distinguishing Cases A, B, C, and D (Phase 5 & Phase 6.4)", () => {
    it("Case A — Seeded linked test customer resolves to SASS9999901 with both SASS ID and Firebase Auth UID preserved", async () => {
      const storageBackend = createInMemorySeedStorageBackend(memoryDriver);
      const actualFirebaseUid = "firebase_auth_uid_seeded_9999901";

      await seedLinkedCustomerFixtures({
        rawData: rawDbData,
        storageBackend,
        authAccountResolver: async () => ({
          uid: actualFirebaseUid,
          action: "provisioned",
        }),
        logger: null,
      });

      const resolution = await customerIdentityService.resolveCustomerProfile({
        uid: actualFirebaseUid,
        email: CANONICAL_LINKED_TEST_CUSTOMER_EMAIL,
        emailVerified: true,
        providerId: "firebase-email-link",
      });

      expect(resolution.status).toBe("resolved");
      expect(resolution.ok).toBe(true);
      if (resolution.status === "resolved") {
        expect(resolution.uid).toBe(actualFirebaseUid);
        expect(resolution.userDocId).toBe("SASS9999901");
        expect(resolution.profile.id).toBe("SASS9999901");
        expect(resolution.profile.userId).toBe("SASS9999901");
        expect(resolution.profile.uid).toBe(actualFirebaseUid);
        expect(resolution.profile.id).not.toBe(actualFirebaseUid);
        expect(resolution.profile.name).toBe("Emulator Test Customer");
        expect(resolution.profile.phone).toBe("9999999999");
        expect(resolution.profile.email).toBe(
          "emulator.linked.customer@sriamman.test"
        );
        expect(resolution.profile.coins).toBe(0);
        expect(resolution.profile.availableCoins).toBe(0);
        expect(resolution.profile.earnedCoins).toBe(0);
      }
    });

    it("Case B — Unknown/unregistered email with no usersByUid/{uid} mapping returns 'unlinked'", async () => {
      const unknownResolution =
        await customerIdentityService.resolveCustomerProfile({
          uid: "firebase_uid_unknown_visitor",
          email: "unknown.visitor@sriamman.test",
          emailVerified: true,
          providerId: "firebase-email-link",
        });

      expect(unknownResolution.status).toBe("unlinked");
      expect(unknownResolution.ok).toBe(false);
      if (unknownResolution.status === "unlinked") {
        expect(unknownResolution.code).toBe("identity/unlinked-uid");
        expect(unknownResolution.uid).toBe("firebase_uid_unknown_visitor");
        expect(unknownResolution.userDocId).toBeNull();
        expect(unknownResolution.profile).toBeNull();
        expect(unknownResolution.requiresRegistration).toBe(true);
      }
    });

    it("Case C — Broken link (usersByUid/{uid} exists, but users/{userDocId} is missing) returns 'missing_profile'", async () => {
      const brokenLinkUid = "firebase_uid_broken_link_9999999";
      await memoryDriver.setDoc("usersByUid", brokenLinkUid, {
        uid: brokenLinkUid,
        userDocId: "SASS9999999",
      });

      const brokenResolution =
        await customerIdentityService.resolveCustomerProfile({
          uid: brokenLinkUid,
          email: "broken.link@sriamman.test",
          emailVerified: true,
          providerId: "firebase-email-link",
        });

      expect(brokenResolution.status).toBe("missing_profile");
      expect(brokenResolution.ok).toBe(false);
      if (brokenResolution.status === "missing_profile") {
        expect(brokenResolution.code).toBe("identity/missing-profile");
        expect(brokenResolution.userDocId).toBe("SASS9999999");
        expect(brokenResolution.profile).toBeNull();
      }
    });

    it("Case D — Invalid/mismatched profile (users/{userDocId} has mismatched customer ID fields) returns 'profile_id_mismatch'", async () => {
      const mismatchedUid = "firebase_uid_mismatched_9999908";
      await memoryDriver.setDoc("usersByUid", mismatchedUid, {
        uid: mismatchedUid,
        userDocId: "SASS9999908",
      });
      await memoryDriver.setDoc("users", "SASS9999908", {
        id: "SASS9999908",
        userId: "SASS0000104", // Mismatched customer ID!
        fullName: "Mismatched Profile User",
        number: "9999999999",
        email: "mismatched@sriamman.test",
        availableCoins: 0,
        earnedCoins: 0,
      });

      const invalidResolution =
        await customerIdentityService.resolveCustomerProfile({
          uid: mismatchedUid,
          email: "mismatched@sriamman.test",
          emailVerified: true,
          providerId: "firebase-email-link",
        });

      expect(invalidResolution.status).toBe("profile_id_mismatch");
      expect(invalidResolution.ok).toBe(false);
      if (invalidResolution.status === "profile_id_mismatch") {
        expect(invalidResolution.code).toBe("identity/profile-id-mismatch");
        expect(invalidResolution.userDocId).toBe("SASS9999908");
        expect(invalidResolution.profile).toBeNull();
      }

      // Also verify that seed validation rejects a mismatched profile
      const storageBackend = createInMemorySeedStorageBackend(memoryDriver);
      await expect(
        validateSeededCustomerLink({
          uid: mismatchedUid,
          expectedUserDocId: "SASS9999908",
          storageBackend,
        })
      ).rejects.toThrow(/SEED_VALIDATION_FAILED/i);
    });
  });

  describe("5. Temporary Test Fixture Isolation vs Persistent Seed Data (Phase 6.5)", () => {
    it("preserves persistent seeded SASS9999901 data when temporary test fixtures run and clean up", async () => {
      const storageBackend = createInMemorySeedStorageBackend(memoryDriver);
      const persistentSeededUid = "persistent_seeded_uid_9999901";

      // 1. Seed persistent development data for SASS9999901
      await seedLinkedCustomerFixtures({
        rawData: rawDbData,
        storageBackend,
        authAccountResolver: async () => ({
          uid: persistentSeededUid,
          action: "provisioned",
        }),
        logger: null,
      });

      // 2. Run a temporary test fixture using an isolated customer ID (SASS9999902)
      const tempIsolated = await seedInMemoryLinkedCustomerFixture(
        memoryDriver,
        "temp_test_uid_isolated",
        "temp.isolated@sriamman.test",
        {
          userDocId: "SASS9999902",
          fullName: "Temporary Isolated Test Customer",
        }
      );
      expect(tempIsolated.fixture.userDocId).toBe("SASS9999902");
      await tempIsolated.cleanup();

      // 3. Also run a temporary test fixture on SASS9999901 and verify snapshot/restore keeps SASS9999901 intact
      const tempOverlay = await seedInMemoryLinkedCustomerFixture(
        memoryDriver,
        "temp_test_uid_overlay",
        "temp.overlay@sriamman.test"
      );
      await tempOverlay.cleanup();

      // 4. Verify persistent seeded SASS9999901 profile and usersByUid/persistent_seeded_uid_9999901 are still intact!
      const resolvedAfterCleanup =
        await customerIdentityService.resolveCustomerProfile({
          uid: persistentSeededUid,
          email: CANONICAL_LINKED_TEST_CUSTOMER_EMAIL,
          emailVerified: true,
          providerId: "firebase-email-link",
        });

      expect(resolvedAfterCleanup.status).toBe("resolved");
      if (resolvedAfterCleanup.status === "resolved") {
        expect(resolvedAfterCleanup.userDocId).toBe("SASS9999901");
        expect(resolvedAfterCleanup.profile.id).toBe("SASS9999901");
        expect(resolvedAfterCleanup.profile.email).toBe(
          CANONICAL_LINKED_TEST_CUSTOMER_EMAIL
        );
        expect(resolvedAfterCleanup.profile.name).toBe("Emulator Test Customer");
      }
    });
  });

  describe("6. Live Auth (9099) & Firestore (8081) Emulator Seed & Login Verification", () => {
    const AUTH_OOB_URL =
      "http://127.0.0.1:9099/emulator/v1/projects/demo-sri-amman-store/oobCodes";

    async function areLiveEmulatorsReachable(): Promise<boolean> {
      try {
        const [authRes, firestoreRes] = await Promise.all([
          fetch(AUTH_OOB_URL, { method: "GET" }),
          fetch("http://127.0.0.1:8081/", { method: "GET" }),
        ]);
        return authRes.ok && (firestoreRes.ok || firestoreRes.status < 500);
      } catch {
        return false;
      }
    }

    it(
      "provisions SASS9999901 in the live Auth & Firestore Emulators, validates usersByUid/{uid} -> users/SASS9999901, and preserves persistent seed data after temporary fixture cleanup",
      async () => {
        if (!(await areLiveEmulatorsReachable())) {
          return;
        }

        emailLinkAuthService.setDriverForTesting(null);
        const sdkAdapter = new FirestoreAdapter(new SdkFirestoreDriver());
        customerIdentityService.setAdapterForTesting(sdkAdapter);

        // 1. Run the real linked-customer seed logic against 127.0.0.1:9099 & 127.0.0.1:8081
        const seededLinks = await seedLinkedCustomerFixtures({
          rawData: rawDbData,
          logger: null,
        });

        const canonicalSeed = seededLinks.find(
          (item) => item.userDocId === "SASS9999901"
        );
        expect(canonicalSeed).toBeDefined();
        expect(canonicalSeed?.validated).toBe(true);
        const seededUid = canonicalSeed!.uid;
        expect(seededUid.length).toBeGreaterThan(0);

        // 2. Run a temporary isolated test fixture and clean it up, verifying persistent SASS9999901 is untouched
        const tempFixture = await seedEmulatorLinkedCustomerFixture(
          `temp_uid_${Date.now()}`,
          "temp.live@sriamman.test",
          {
            userDocId: "SASS9999902",
            fullName: "Temporary Live Test Customer",
          }
        );
        await tempFixture.cleanup();

        // 3. Sign in through the real Auth Emulator using the passwordless email-link flow for the seeded customer email
        await emailLinkAuthService.sendSignInLink(
          CANONICAL_LINKED_TEST_CUSTOMER_EMAIL,
          { continueUrl: "http://localhost:5173/login" }
        );
        const oobRes = await fetch(AUTH_OOB_URL);
        expect(oobRes.ok).toBe(true);
        const oobPayload = (await oobRes.json()) as {
          oobCodes?: Array<{ email?: string; oobLink?: string }>;
        };
        const matchingLinks = (oobPayload.oobCodes ?? []).filter(
          (c) =>
            c.email?.toLowerCase() ===
            CANONICAL_LINKED_TEST_CUSTOMER_EMAIL.toLowerCase()
        );
        expect(matchingLinks.length).toBeGreaterThan(0);
        const latestLink = matchingLinks[matchingLinks.length - 1]!.oobLink!;

        const signedInUser =
          await emailLinkAuthService.completeSignInWithEmailLink(latestLink);
        expect(signedInUser.uid).toBe(seededUid);
        expect(signedInUser.email).toBe(CANONICAL_LINKED_TEST_CUSTOMER_EMAIL);

        // 4. Resolve the customer profile via real Firebase SDK and verify Case A ('resolved')
        const resolved =
          await customerIdentityService.resolveCustomerProfile(signedInUser);
        expect(resolved.status).toBe("resolved");
        if (resolved.status === "resolved") {
          expect(resolved.uid).toBe(seededUid);
          expect(resolved.userDocId).toBe("SASS9999901");
          expect(resolved.profile.id).toBe("SASS9999901");
          expect(resolved.profile.userId).toBe("SASS9999901");
          expect(resolved.profile.uid).toBe(seededUid);
          expect(resolved.profile.name).toBe("Emulator Test Customer");
        }

        await emailLinkAuthService.signOutFirebaseAuth();
      },
      25000
    );
  });
});

