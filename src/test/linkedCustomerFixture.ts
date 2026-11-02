import type { InMemoryFirestoreDriver } from "../services/firestoreAdapter";

export const CANONICAL_LINKED_TEST_CUSTOMER_ID = "SASS9999901";
export const CANONICAL_LINKED_TEST_CUSTOMER_EMAIL =
  "emulator.linked.customer@sriamman.test";

export interface CanonicalLinkedCustomerFixture {
  firebaseUid: string;
  userDocId: string;
  mappingDoc: {
    uid: string;
    userDocId: string;
  };
  profileDoc: {
    id: string;
    userId: string;
    name: string;
    fullName: string;
    phone: "9999999999";
    number: "9999999999";
    email: string;
    coins: 0;
    availableCoins: 0;
    earnedCoins: 0;
    isVIP: false;
    referralCode: string;
    createdAt: string;
  };
}

export interface LinkedCustomerFixtureOptions {
  userDocId?: string;
  fullName?: string;
}

/**
 * Builds a deterministic linked-customer fixture (defaults to `SASS9999901`):
 *   - `usersByUid/{firebaseUid}` -> `{ uid: "<firebaseUid>", userDocId: "SASS9999901" }`
 *   - `users/SASS9999901` -> `{ id: "SASS9999901", userId: "SASS9999901", fullName: "Emulator Test Customer", number: "9999999999", email: "<test-email>", availableCoins: 0, earnedCoins: 0, ... }`
 */
export function buildCanonicalLinkedCustomerFixture(
  firebaseUid: string,
  email: string = CANONICAL_LINKED_TEST_CUSTOMER_EMAIL,
  options?: LinkedCustomerFixtureOptions
): CanonicalLinkedCustomerFixture {
  const userDocId = options?.userDocId ?? CANONICAL_LINKED_TEST_CUSTOMER_ID;
  const fullName = options?.fullName ?? "Emulator Test Customer";

  return {
    firebaseUid,
    userDocId,
    mappingDoc: {
      uid: firebaseUid,
      userDocId,
    },
    profileDoc: {
      id: userDocId,
      userId: userDocId,
      name: fullName,
      fullName,
      phone: "9999999999",
      number: "9999999999",
      email,
      coins: 0,
      availableCoins: 0,
      earnedCoins: 0,
      isVIP: false,
      referralCode: userDocId,
      createdAt: "2026-01-01T00:00:00.000Z",
    },
  };
}

/**
 * Seeds a linked-customer fixture into an `InMemoryFirestoreDriver`
 * and returns a cleanup function that restores any pre-existing documents or
 * removes only the temporary fixture documents owned by the test.
 */
export async function seedInMemoryLinkedCustomerFixture(
  driver: InMemoryFirestoreDriver,
  firebaseUid: string,
  email: string = CANONICAL_LINKED_TEST_CUSTOMER_EMAIL,
  options?: LinkedCustomerFixtureOptions
): Promise<{
  fixture: CanonicalLinkedCustomerFixture;
  cleanup: () => Promise<void>;
}> {
  const fixture = buildCanonicalLinkedCustomerFixture(
    firebaseUid,
    email,
    options
  );
  const existingMapping = await driver
    .getDoc("usersByUid", firebaseUid)
    .catch(() => null);
  const existingProfile = await driver
    .getDoc("users", fixture.userDocId)
    .catch(() => null);

  await driver.setDoc(
    "usersByUid",
    firebaseUid,
    fixture.mappingDoc as unknown as Record<string, unknown>
  );
  await driver.setDoc(
    "users",
    fixture.userDocId,
    fixture.profileDoc as unknown as Record<string, unknown>
  );

  return {
    fixture,
    cleanup: async () => {
      if (existingMapping) {
        await driver.setDoc("usersByUid", firebaseUid, existingMapping);
      } else {
        await driver.deleteDoc("usersByUid", firebaseUid).catch(() => {});
      }

      if (existingProfile) {
        await driver.setDoc("users", fixture.userDocId, existingProfile);
      } else {
        await driver.deleteDoc("users", fixture.userDocId).catch(() => {});
      }
    },
  };
}

const EMULATOR_FIRESTORE_REST_BASE =
  "http://127.0.0.1:8081/v1/projects/demo-sri-amman-store/databases/(default)/documents";

/**
 * Administrative emulator-only fixture manager that seeds and cleans up ONLY
 * the dedicated test documents (`usersByUid/{firebaseUid}` and `users/{userDocId}`).
 * Snapshots any pre-existing documents so cleanup never deletes or corrupts
 * persistent development seed data.
 */
export async function seedEmulatorLinkedCustomerFixture(
  firebaseUid: string,
  email: string = CANONICAL_LINKED_TEST_CUSTOMER_EMAIL,
  options?: LinkedCustomerFixtureOptions
): Promise<{
  fixture: CanonicalLinkedCustomerFixture;
  cleanup: () => Promise<void>;
}> {
  const fixture = buildCanonicalLinkedCustomerFixture(
    firebaseUid,
    email,
    options
  );
  const mappingUrl = `${EMULATOR_FIRESTORE_REST_BASE}/usersByUid/${encodeURIComponent(
    firebaseUid
  )}`;
  const profileUrl = `${EMULATOR_FIRESTORE_REST_BASE}/users/${encodeURIComponent(
    fixture.userDocId
  )}`;

  // Snapshot any pre-existing mapping and profile documents so cleanup never destroys persistent seed data
  const [existingMappingRes, existingProfileRes] = await Promise.all([
    fetch(mappingUrl, {
      method: "GET",
      headers: { Authorization: "Bearer owner" },
    }),
    fetch(profileUrl, {
      method: "GET",
      headers: { Authorization: "Bearer owner" },
    }),
  ]);

  const hadPreExistingMapping = existingMappingRes.ok;
  const preExistingMappingBody = hadPreExistingMapping
    ? ((await existingMappingRes.json()) as { fields?: Record<string, unknown> })
    : null;

  const hadPreExistingProfile = existingProfileRes.ok;
  const preExistingProfileBody = hadPreExistingProfile
    ? ((await existingProfileRes.json()) as { fields?: Record<string, unknown> })
    : null;

  const cleanup = async (): Promise<void> => {
    if (hadPreExistingMapping && preExistingMappingBody?.fields) {
      await fetch(mappingUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer owner",
        },
        body: JSON.stringify({ fields: preExistingMappingBody.fields }),
      }).catch(() => {});
    } else {
      await fetch(mappingUrl, {
        method: "DELETE",
        headers: { Authorization: "Bearer owner" },
      }).catch(() => {});
    }

    if (hadPreExistingProfile && preExistingProfileBody?.fields) {
      await fetch(profileUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer owner",
        },
        body: JSON.stringify({ fields: preExistingProfileBody.fields }),
      }).catch(() => {});
    } else if (fixture.userDocId !== CANONICAL_LINKED_TEST_CUSTOMER_ID) {
      await fetch(profileUrl, {
        method: "DELETE",
        headers: { Authorization: "Bearer owner" },
      }).catch(() => {});
    }
  };

  try {
    const mappingRes = await fetch(mappingUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer owner",
      },
      body: JSON.stringify({
        fields: {
          uid: { stringValue: fixture.mappingDoc.uid },
          userDocId: { stringValue: fixture.mappingDoc.userDocId },
        },
      }),
    });
    if (!mappingRes.ok) {
      throw new Error(
        `Failed to seed usersByUid/${firebaseUid} (${mappingRes.status})`
      );
    }

    const profileRes = await fetch(profileUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer owner",
      },
      body: JSON.stringify({
        fields: {
          id: { stringValue: fixture.profileDoc.id },
          userId: { stringValue: fixture.profileDoc.userId },
          name: { stringValue: fixture.profileDoc.name },
          fullName: { stringValue: fixture.profileDoc.fullName },
          phone: { stringValue: fixture.profileDoc.phone },
          number: { stringValue: fixture.profileDoc.number },
          email: { stringValue: fixture.profileDoc.email },
          coins: { integerValue: String(fixture.profileDoc.coins) },
          availableCoins: {
            integerValue: String(fixture.profileDoc.availableCoins),
          },
          earnedCoins: {
            integerValue: String(fixture.profileDoc.earnedCoins),
          },
          isVIP: { booleanValue: fixture.profileDoc.isVIP },
          referralCode: { stringValue: fixture.profileDoc.referralCode },
          createdAt: { stringValue: fixture.profileDoc.createdAt },
        },
      }),
    });
    if (!profileRes.ok) {
      throw new Error(
        `Failed to seed users/${fixture.userDocId} (${profileRes.status})`
      );
    }

    return { fixture, cleanup };
  } catch (err) {
    await cleanup();
    throw err;
  }
}

