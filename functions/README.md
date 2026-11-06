# Isolated Customer Registration Function

This separate Firebase Functions codebase exports customer registration and
verified-phone synchronization callables. It does not replace or edit any other
Functions source.

## Current registration flow

The registration UI is in `src/routes/login.tsx`. In Local Emulator mode, it sends
and confirms an OTP through Firebase Phone Authentication, then calls
`registerCustomer` through the Functions Emulator. The callable accepts the name
from the UI and obtains the phone number from the authenticated Firebase token.
Production registration remains blocked by the UI and production authentication
safeguards.

## Emulator project and endpoints

The local project is `demo-sri-amman-store` by default (`.firebaserc`). The configured
loopback endpoints are:

| Emulator | Endpoint |
| --- | --- |
| Auth | `127.0.0.1:9099` |
| Firestore | `127.0.0.1:8081` |
| Functions | `127.0.0.1:5001` |
| Emulator UI | `127.0.0.1:4000` |

From a state where no Firebase emulator is running, `npm.cmd run emulator` starts
Auth, Firestore, and Functions together and imports `.firebase-emulator-data` when
an export snapshot is present. The launcher does not start a second emulator set
when it detects any of those services already listening. In that case, use the
existing session or coordinate an intentional full-suite restart before testing.

## Production function deployment

The default Firebase project in `.firebaserc` is `demo-sri-amman-store` for local
emulator work. The `production` alias points to `sri-amman-smart-store`; passing
`--project production` selects production explicitly and does not fall back to the
default. To deploy only the phone eligibility callable, include the configured
Functions codebase name in the filter:

```powershell
firebase deploy --only functions:customer-registration:checkCustomerPhoneEligibility --project production
```

The `customer-registration` segment is required because `firebase.json` assigns
the Functions source to that codebase.

## Existing customer phone synchronization

`updateCustomerVerifiedPhone` accepts only `{ verifiedE164Phone }`. It derives
the UID from callable authentication, verifies the phone against Firebase Auth
with the Admin SDK, validates the canonical `usersByUid/{uid}` mapping and
`onlineCustomers/{customerId}` ownership, and checks phone indexes plus legacy
and canonical phone fields. If the mapped profile and phone index already both
confirm the signed-in UID as owner, a duplicate `onlineCustomers` record marked
`phoneVerified: false` does not block synchronization; the duplicate profile is
left untouched. Verified or ambiguous conflicts still fail closed. The callable
updates the profile and phone index in one Admin Firestore transaction. Client
writes to those protected documents remain denied.

## OTP login eligibility lookup

`checkCustomerPhoneEligibility` accepts `{ phoneNumber }` and returns only
`{ eligible: boolean }`. It requires one verified canonical customer profile,
a matching UID mapping, and Firebase Auth ownership of the submitted E.164 number.
Explicitly unverified duplicate canonical profiles are ignored once the verified
profile and phone index agree on the same owner; verified duplicates remain ineligible.
The callable rate-limits by SHA-256 hashes of the caller IP and normalized phone
number and stores only short-lived counters in `phoneLookupRateLimits`; configure Firestore TTL on its
`expiresAt` field so expired counters are removed. Unknown and ineligible numbers receive
the same response shape. The client requests no OTP unless `eligible` is true.

## Customer ID sequence prerequisite

The function creates `onlineCustomers/{ONCUSxxxxxxx}`, `usersByUid/{uid}` with
`collection: "onlineCustomers"` and `accountType: "customer"`,
`customerPhoneIndex/{E.164 phone}`, and updates `meta/onlineCustomerSequence` in one
Firestore transaction. This sequence is independent of the legacy SASS sequence.
Existing migrated ONCUS IDs and approved aliases remain stable; registration does
not rewrite legacy customer records or routes.

Do not initialize or advance this sequence until the active emulator project and
all existing `onlineCustomers` IDs have been inventoried and checked for a
consistent highest ID. Do not infer the sequence from `db.json` or a partial
export. The function intentionally fails closed when the sequence document is
absent or invalid, and checks the candidate profile ID transactionally before
creating it.

## Safe local test outline

1. Confirm the complete emulator suite is running for `demo-sri-amman-store` at the
   endpoints above. Do not connect this flow to a production project.
2. Verify all existing emulator `onlineCustomers` records and the sequence value;
   only then initialize the sequence to the verified highest ONCUS suffix if
   needed. Keep `meta/userSequence` reserved for legacy SASS allocation.
3. In the app, select Emulator mode, open registration, enter the proposed test
   name and phone number, and complete the OTP supplied by the Auth Emulator.
4. Confirm that the callable creates `onlineCustomers/ONCUSxxxxxxx`, a customer
   UID mapping with matching `uid`, `collection`, and `accountType`, the phone
   index, and the incremented online-customer sequence in the emulator.

Do not perform an OTP registration or create test customer records until the test
name and phone number have been reported and approved. No production deployment,
production database write, or Firestore rules deployment is part of this flow.
