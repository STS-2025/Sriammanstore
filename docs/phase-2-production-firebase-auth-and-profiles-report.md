# Phase 2 Report: Production Firebase Authentication & Customer Profiles — Architecture & Implementation

**Sri Amman Smart Store — Customer Frontend**  
**Audit & Implementation Date:** October 20, 2026  
**Workspace:** `D:\SRIAMMANSTORE\SRIAMMANSTORE_New_UI\design-showcase-main\design-showcase-main-2`  
**Target Production Firebase Project:** `sri-amman-smart-store` (Strictly Read-Only / Write-Guarded)  
**Local Development Project:** `demo-sri-amman-store` (Firebase Emulator on ports 8081 / 9099)  

---

## Executive Summary

Phase 2 implementation integrates Firebase Authentication and prepares customer profile integration for the Sri Amman Smart Store customer frontend, building upon the Phase 1 catalogue integration. The work was completed following strict production boundaries:

- **Zero Production Writes:** No Firebase Auth users were created, no verification or password-reset emails were sent, no customer documents were written or modified, and no production Firestore rules or functions were deployed.
- **Local Emulator Remains Primary Default:** `resolveDefaultAuthMode()` strictly resolves to `"emulator"` (ports 8081 and 9099) unless explicitly overridden.
- **Decoupled Architecture:** Production catalogue preview mode (`?catalogMode=production-readonly`) is completely independent from authentication and can **never** trigger production authentication.
- **Safety Assertions & Error Mapping:** In production authentication mode, state-mutating actions (`createUser`, `sendPasswordResetEmail`, `sendEmailVerification`) are intercepted by `ProductionAuthSafetyError`. Authentication errors are mapped to sanitized, user-friendly messages without leaking passwords or sensitive account data.
- **All Verification Gates Passed:**
  - Full Vitest suite: **44 test files, 686 tests passing (100%)**.
  - TypeScript compilation check (`npx tsc --noEmit`): **Clean (0 errors)**.
  - Production build (`npm run build`): **Clean exit code 0**.

---

## 1. Existing Architecture & Authentication Flows

An inspection of the workspace and read-only comparison with the legacy codebase revealed the following architecture:

```mermaid
flowchart TD
    subgraph Client ["Frontend Runtime (TanStack Router)"]
        UI["Login / Register / Profile / Cart / Checkout"]
        AuthCtx["AuthContext (AuthProvider)"]
    end

    subgraph AuthLayer ["Authentication Layer"]
        AuthMgr["AuthManager (authAdapter.ts)"]
        EmuAdapter["FirebaseAuthAdapter ('emulator')"]
        ProdAdapter["FirebaseAuthAdapter ('production')"]
        MockAdapter["MockAuthAdapter ('mock')"]
    end

    subgraph Backends ["Identity & Storage Endpoints"]
        AuthEmu["Auth Emulator (127.0.0.1:9099)<br/>demo-sri-amman-store"]
        ProdAuth["Production Firebase Auth<br/>sri-amman-smart-store"]
        MockApi["Local Mock API / JSON Server (3001)"]
        FirestoreEmu["Firestore Emulator (8081)<br/>usersByUid / users"]
    end

    UI --> AuthCtx
    AuthCtx --> AuthMgr
    AuthMgr -->|Default| EmuAdapter
    AuthMgr -->|Explicit Opt-in| ProdAdapter
    AuthMgr -->|Offline Fixtures| MockAdapter

    EmuAdapter --> AuthEmu
    ProdAdapter -->|Read-only / Login only| ProdAuth
    MockAdapter --> MockApi

    AuthCtx -->|Resolve Profile| IdentityService["customerIdentityService.ts"]
    IdentityService -->|Read usersByUid/{uid} & users/{id}| FirestoreEmu
```

### The Two-Step Customer Identity Contract
In the Sri Amman Smart Store architecture, Firebase Auth UIDs are **not** customer document IDs:
1. **Firebase Authentication**: Authenticates credentials and produces a Firebase UID (`auth.currentUser.uid`), verified email, and optional phone.
2. **Identity Link Document (`usersByUid/{uid}`)**: Stores `{ uid: "<firebase-uid>", userDocId: "SASS0000104" }`.
3. **Customer Profile Document (`users/{userDocId}`)**: Stores the authoritative business record with sequential ID `SASS...`. All customer-scoped subcollections (`cart`, `addresses`, `orders`, `coinsHistory`, `refferals`, `wishlists`, `notifications`) are permanently anchored to this `SASS...` ID.

---

## 2. Defined Authentication Modes & Selection Safety

To eliminate accidental production connections or silent mode switching, three distinct, explicit authentication modes are established:

| Mode | Target Service | Project ID | Host / Endpoint | Write Safety Policy |
| :--- | :--- | :--- | :--- | :--- |
| **`"emulator"` (Default)** | Local Firebase Auth Emulator | `demo-sri-amman-store` | `127.0.0.1:9099` | Local emulator only. |
| **`"production"`** | Isolated Firebase Web SDK | `sri-amman-smart-store` | Google Identity Toolkit | **Strictly read-only login.** User creation, password resets, and verification emails throw `ProductionAuthSafetyError`. |
| **`"mock"`** | Local Session / Mock API | `local-mock` | `http://localhost:3001` | In-memory & `localStorage` test sessions (`sass_customer_session`). |

### Resolution Rules in `resolveDefaultAuthMode()`
1. Checks `process.env.VITE_AUTH_MODE` or `import.meta.env.VITE_AUTH_MODE`.
2. Checks `window.sessionStorage.getItem("sass_auth_mode")`.
3. Checks URL parameter `authMode` (`?authMode=production`).
4. **Catalogue Independence Invariant:** `?catalogMode=production-readonly` is explicitly ignored and **never** activates production authentication.
5. **Strict Default:** If no explicit override is provided, the function unconditionally returns `"emulator"`.
6. **No Silent Fallback:** If production authentication fails (e.g. network timeout or invalid credentials), the system surfaces the error directly to the customer and never silently falls back to mock or emulator sessions.

---

## 3. Implementation of Safe Authentication Foundation

### Files Created & Modified

#### 1. [`src/services/authAdapter.ts`](file:///d:/SRIAMMANSTORE/SRIAMMANSTORE_New_UI/design-showcase-main/design-showcase-main-2/src/services/authAdapter.ts) (New)
- **`AuthMode` & `resolveDefaultAuthMode()`**: Implements the strict local-default invariant.
- **`AuthUserIdentity`**: Normalized interface representing an authenticated user (`uid`, `email`, `emailVerified`, `phoneNumber`, `providerId`, `isAnonymous`).
- **`IAuthAdapter`**: Provider-independent authentication interface.
- **`FirebaseAuthAdapter`**: Modular Firebase Auth adapter supporting `"emulator"` (connecting to `127.0.0.1:9099` via [`firebaseEmulator.ts`](file:///d:/SRIAMMANSTORE/SRIAMMANSTORE_New_UI/design-showcase-main/design-showcase-main-2/src/lib/firebaseEmulator.ts)) and `"production"` (connecting via isolated named app `sri-amman-prod-auth-isolated`).
- **`ProductionAuthSafetyError`**: Thrown immediately if `createUserWithEmailAndPassword`, `sendPasswordResetEmail`, or `sendEmailVerification` is invoked in production mode.
- **`mapFirebaseAuthError()`**: Maps codes like `auth/invalid-credential`, `auth/user-not-found`, `auth/too-many-requests`, `auth/network-request-failed` into customer-safe messages without leaking internal passwords or discoverable account details.
- **`MockAuthAdapter`**: Wraps the legacy mock [`authService.ts`](file:///d:/SRIAMMANSTORE/SRIAMMANSTORE_New_UI/design-showcase-main/design-showcase-main-2/src/services/authService.ts) for offline test credentials (`arun.kumar@example.com`, `priya.sundaram@example.com`).
- **`authManager`**: Central singleton coordinating active adapters, status queries, and mode switching.

#### 2. [`src/context/AuthContext.tsx`](file:///d:/SRIAMMANSTORE/SRIAMMANSTORE_New_UI/design-showcase-main/design-showcase-main-2/src/context/AuthContext.tsx) (Updated)
- Exposes `authMode: AuthMode`, `setAuthMode: (mode: AuthMode) => void`, and `authStatus: AuthStatus`.
- Exposes `loginWithFirebaseAuth(email, password)`.
- Updates `loginWithEmail(email, password)`: When `authMode === "production"`, delegates to `authManager.loginWithEmail` and resolves the customer profile via `customerIdentityService`. In default mode, preserves existing mock login behavior to maintain backwards compatibility with test harnesses and local development.
- Updates `logout()`: Cleans up both `emailLinkAuthService`, `authManager`, and `authService`.
- Supports `AuthUserIdentity` in `resolveFirebaseUserInternal` and `applyFirebaseResolution`.

#### 3. [`src/test/authAdapterArchitecture.test.ts`](file:///d:/SRIAMMANSTORE/SRIAMMANSTORE_New_UI/design-showcase-main/design-showcase-main-2/src/test/authAdapterArchitecture.test.ts) (New)
- 17 unit tests validating provider selection, local default invariant, production mutation blocks, error mapping, listener cleanup, unlinked profile handling, and session synchronization.

---

## 4. Customer Profile Schema Mapping & Read-Only Preparation

### Field Mapping Analysis
Based on [`legacyUserMapper.ts`](file:///d:/SRIAMMANSTORE/SRIAMMANSTORE_New_UI/design-showcase-main/design-showcase-main-2/src/services/legacyUserMapper.ts), [`customerIdentityService.ts`](file:///d:/SRIAMMANSTORE/SRIAMMANSTORE_New_UI/design-showcase-main/design-showcase-main-2/src/services/customerIdentityService.ts), and read-only inspection of the legacy codebase:

| Field Name | Storage Location | Source of Truth | Purpose & Schema Rules |
| :--- | :--- | :--- | :--- |
| **`uid`** | Firebase Auth | Google Identity Toolkit | Primary Authentication identifier. |
| **`email`** | Firebase Auth / Firestore | Firebase Auth | Verified email for notifications/login. |
| **`emailVerified`**| Firebase Auth | Firebase Auth | Security gate for passwordless/email logins. |
| **`userDocId`** | `usersByUid/{uid}` | Firestore Mapping | Pointer connecting Firebase Auth `uid` to SASS customer record. |
| **`userId` / `id`** | `users/{userDocId}` | Firestore Profile | Canonical sequential ID (e.g. `SASS0000104`). Primary foreign key for cart, orders, and coins. |
| **`fullName` / `name`**| `users/{userDocId}` | Firestore Profile | Customer display name. |
| **`number` / `phone`** | `users/{userDocId}` | Firestore Profile | Mobile phone number. |
| **`countryCode`** | `users/{userDocId}` | Firestore Profile | Country dial code (`+91`). |
| **`phoneVerified`**| `users/{userDocId}` | Firestore Profile | Whether phone was verified by Mobile OTP. |
| **`availableCoins`**| `users/{userDocId}` | Firestore Profile | Current spendable Amman Coins ledger balance. |
| **`earnedCoins`** | `users/{userDocId}` | Firestore Profile | Lifetime Amman Coins earned. |
| **`isVIP`** | `users/{userDocId}` | Firestore Profile | Customer loyalty VIP status. |
| **`createdAt`** | `users/{userDocId}` | Firestore Profile | Account creation ISO timestamp. |

### Handling Missing or Unlinked Profiles
When an authenticated Firebase Auth user is detected:
1. **Unlinked Profile (`status: "unlinked"`):**  
   If `usersByUid/{uid}` does not exist, `customerIdentityService` returns `status: "unlinked"`, `profile: null`, `requiresRegistration: true`.  
   *UI Behavior:* `describeIdentityResolutionState` displays an alert notice explaining that the email is verified, but no Sri Amman Smart Store account is linked. **Zero documents are created.**
2. **Missing Customer Document (`status: "missing_profile"`):**  
   If `usersByUid/{uid}` exists but `users/{userDocId}` is absent from Firestore, it returns `status: "missing_profile"`, `profile: null`.  
   *UI Behavior:* Alerts the customer to contact support.
3. **Database Error (`status: "database_error"`):**  
   If the local emulator or network is unreachable, it marks the notice with `isRetryable: true` and provides a retry button.

### Association with Existing Cart, Orders, and Rewards
- **Cart:** Cart items are stored under `/cart` with keys `${effectiveUserId}__${cartKey}`. When a customer logs in, their cart automatically binds to their canonical SASS ID (`user.id`).
- **Orders:** Orders are queried by `{ userId: user.id }`.
- **Amman Coins:** Coins are loaded from `user.coins` / `user.availableCoins`. Deductions and refunds update `users/${userId}` and call `authService.syncUserSession`.

---

## 5. Workflow Preservation Verification

All customer workflows remain intact:

| Workflow | Status | Verification Detail |
| :--- | :--- | :--- |
| **Local Mock OTP Login** | Preserved | Tested via `loginAuth.test.ts`. Test OTP `123456` verifies successfully for test users. |
| **Local Mock Email Login** | Preserved | Tested via `loginAuth.test.ts` and `authContextIntegration.test.tsx` (`arun.kumar@example.com`, `priya.sundaram@example.com`). |
| **Firebase Passwordless Email Link** | Preserved | Tested via `emailLinkAuth.test.ts` against local Auth Emulator. |
| **Cart Operations** | Preserved | Adding items, updating quantity, removing items, and calculating MRP/savings verified. |
| **Checkout & Order Creation** | Preserved | Tested via `checkoutWorkflow.test.ts` and `ordersTracking.test.ts`. |
| **Amman Coin Deductions & Cancellation Refunds** | Preserved | Tested via `coinCancellationRefund.test.ts` and `orderCoinsBalanceUpdate.test.ts` using the official rate (1 coin = ₹0.05). |
| **Phase 1 Production Catalogue Preview** | Preserved | Tested via `shopProductionCatalogueIntegration.test.tsx` and `fullProductionCatalogue.test.ts`. |

---

## 6. Verification & Automated Test Results

### 1. Targeted Architecture & Authentication Suite
Command: `npx vitest run src/test/authAdapterArchitecture.test.ts src/test/authContextIntegration.test.tsx src/test/loginAuth.test.ts src/test/customerIdentityResolution.test.ts src/test/emailLinkAuth.test.ts`
- **Result:** **5 test files passed, 86 tests passed (100%)** in 3.35s.

### 2. Workflow Regression Suite
Command: `npx vitest run src/test/checkoutWorkflow.test.ts src/test/coinCancellationRefund.test.ts src/test/orderCoinsBalanceUpdate.test.ts src/test/officialAmmanCoinsConversion.test.ts src/test/rewardsPageConversionRate.test.ts src/test/ordersTracking.test.ts src/test/shopProductionCatalogueIntegration.test.tsx src/test/fullProductionCatalogue.test.ts`
- **Result:** **8 test files passed, 111 tests passed (100%)** in 27.64s.

### 3. Full Test Suite Run
Command: `npm run test` (`vitest run --fileParallelism=false`)
- **Result:** **44 test files passed, 686 tests passed (100%)** in 132.65s.

### 4. TypeScript Compile Check
Command: `npx tsc --noEmit`
- **Result:** **Clean exit code 0 (0 compilation errors).**

### 5. Production Build
Command: `npm run build` (`vite build`)
- **Result:** **Clean exit code 0.** Generated client bundle, SSR server bundle, and Nitro server workers successfully.

---

## 7. Confirmation of Production Boundaries

1. **No Production Auth Users Created:** Zero calls made to `createUserWithEmailAndPassword` or admin auth user creation APIs against `sri-amman-smart-store`.
2. **No Production Emails Dispatched:** No verification emails, sign-in links, or password reset emails were sent via Google Cloud SMTP.
3. **No Customer Document Mutations:** Zero `setDoc`, `updateDoc`, `addDoc`, or `deleteDoc` operations were executed against production Firestore.
4. **No Rules or Configuration Deployed:** No Firebase CLI deployments were initiated. Production rules, indexes, and hosting remain completely untouched.
5. **No Exposure of Credentials:** All secrets and API keys are masked in diagnostics and excluded from logs.

---

## 8. Steps Requiring Future Explicit Approval

Before live production authentication or customer profile registration can be enabled, the following steps will require separate, explicit approval:
1. **Production Phone Verification (OTP Provider):** Confirming Firebase Phone Auth SMS-provider status and authorized domains in the Firebase Console. Web phone verification uses Firebase's SDK-managed reCAPTCHA verifier; no custom site key is required.
2. **Atomic SASS ID Sequence Allocation:** Deploying a Cloud Function or transactional rule to allocate sequential `meta/userSequence` IDs for newly registered customers.
3. **Account Linking Deduplication Policy:** Finalizing the policy for handling customers who sign in with an email that matches an existing phone-registered customer record.
4. **Customer Profile Creation in Production Firestore:** Granting explicit authorization to write `usersByUid/{uid}` and `users/{userDocId}` documents in live production.

---

## 9. Manual Verification Steps for User

To verify the Phase 2 implementation locally:

1. **Run Targeted Tests:**
   ```powershell
   npx vitest run src/test/authAdapterArchitecture.test.ts
   ```
   *Expected:* All 17 tests pass.

2. **Run TypeScript Check:**
   ```powershell
   npx tsc --noEmit
   ```
   *Expected:* Exits with code 0.

3. **Verify Local Development Startup:**
   ```powershell
   npm run dev
   ```
   Open `http://localhost:5173/login`:
   - Verify Mobile OTP tab works with test credentials (`+91 99999 99999`, OTP `123456`).
   - Verify Email tab works with test credentials (`arun.kumar@example.com`, `password123`).
   - Open `/shop` and confirm catalogue browsing and data source badges function normally.

