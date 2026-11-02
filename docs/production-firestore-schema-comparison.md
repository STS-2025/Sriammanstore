# Read-Only Production Firebase Schema Audit & New UI Compatibility Comparison

**Audit Date:** 2026-10-13  
**Target Production Firebase Project:** `sri-amman-smart-store` (Project Number: `1018585256480`)  
**Firestore Database:** `(default)` | **Database Mode:** Firestore Native | **Edition:** STANDARD  
**Active CLI Account:** `sriammansmartstore@gmail.com`  
**Local Development Project:** `demo-sri-amman-store` (Firebase Emulators)  
**Workspace:** `D:\SRIAMMANSTORE\SRIAMMANSTORE_New_UI\design-showcase-main\design-showcase-main-2`  
**Safety Scope:** 100% read-only inspection. Zero cloud writes, resets, migrations, rule/index deploys, or credential exports. All customer PII has been redacted.

---

## 1. Executive Summary

This audit compares the live production Google Cloud Firestore database (`sri-amman-smart-store`) against:
1. The initial legacy codebase audit (`docs/legacy-firebase-integration-audit.md`),
2. The new customer frontend's mock database (`db.json`),
3. The local Firebase emulator seeding implementation (`scripts/seed-emulator.mjs`),
4. The existing compatibility mappers and services (`legacySchemaMapper.ts`, `legacyUserMapper.ts`, `customerIdentityService.ts`, `productService.ts`, `firestoreAdapter.ts`), and
5. The authentication and identity resolution pipeline (`AuthContext.tsx`, `emailLinkAuthService.ts`).

### Key Live Audit Findings

1. **Security Rules State:** Live production Firestore security rules are **completely open** (`match /{document=**} { allow read, write: if true; }`). This explains why the legacy customer panel functioned via direct, unauthenticated client-side SDK reads and writes without a custom backend. Storage security rules, however, were date-gated and **expired on October 10, 2026** (`request.time < timestamp.date(2026, 10, 10)`).
2. **Collection Topology (Dual-Model Discovery):** Production contains **20 top-level collections**. These span two distinct operating models:
   - **Customer E-Commerce Operations:** Keyed by sequential SASS IDs (`users/SASS...`), `usersByUid`, and subcollections (`addresses`, `cart`, `coinsHistory`, `locations`, `orders`).
   - **In-Store POS / ERP / Delivery Operations:** Collections created by staff and POS terminals: `customers` (POS counter accounts with IDs like `CUS-000001`), `customerLedger` (credit sales), `orders` with `salesChannel: "pos"`, `stockMovements`, `activityLogs`, `deliveryAgents`, `deliveryBatches`, `scannerSessions`, and `locations` (shelf coordinates like `R1-S1-B1`).
3. **Product Catalog Dual-Hierarchy Confirmed:** 
   - Products are dual-written or mirrored between top-level `products/{productId}` (currently containing only 4 items) and nested subcollections `products/{category}/items/{productId}` (containing 12 items across `Grocery`, `Masala`, `Sambar`, and `Spices & Masala Powders`).
   - Both locations contain identical 41-field document schemas containing both Admin Panel POS `variants[]` (with barcode, SKU, batch, safety stock) and customer e-commerce `options[]`.
   - Product and category images in production heavily utilize inline **Base64 data URIs** (`data:image/jpeg;base64,...`) rather than external CDN URLs.
4. **Sequence Counters Confirmed:**
   - User counter: `meta/userSequence` has `{ current: 21 }` (matches highest live customer `SASS0000021`).
   - Order counter: `meta/orderSequence` has `{ current: 28 }` (matches highest live order `ORD-0000028`).
5. **Amman Coins & Settings:**
   - Production `Settings` contains **only one document**: `Settings/CoinValue` (`{ text: "0.05" }`, representing ₹0.05 per Amman Coin). Settings documents for delivery thresholds (`DeliverySettings`, `ExpressTimeSlots`, `ExpressAutoThreshold`) referenced in the legacy codebase do not exist in live production Firestore.
   - User coin transactions are stored under `users/{userDocId}/coinsHistory/{orderId}` with fields `amount`, `orderAmount`, `type: "self"`, `status: "pending"`, and `idempotencyKey: "${orderId}:self"`.
6. **Identity Mapping Validated:**
   - `usersByUid/{uid}` documents directly map Firebase Auth UIDs to `userDocId: "SASS..."`. 12 mappings exist in production. Accounts with multiple auth providers (Google and Phone) link multiple UIDs to the same `SASS...` ID. Several mappings are dangling pointers where test `users/{id}` documents were removed.

---

## 2. Production Security Rules & Composite Indexes

### 2.1 Live Firestore Security Rules
Retrieved via Google Cloud Firebase Rules API (`projects/sri-amman-smart-store/rulesets/222ad3cf-c02d-475f-bf18-3325e523bed2`):

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

> [!WARNING]
> Production Firestore currently operates in test-mode style with completely open public access. Anyone with the Firebase configuration can read and overwrite any document in production without authentication. Prior to connecting the new UI to production or replacing the legacy app, strict, role-scoped security rules must be deployed.

### 2.2 Live Firebase Storage Rules
Retrieved via Rules API (`projects/sri-amman-smart-store/rulesets/9fe69b38-0a8c-471b-a18e-4a9966346b99`):

```javascript
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.time < timestamp.date(2026, 10, 10);
    }
  }
}
```

> [!CAUTION]
> Storage security rules expired on **October 10, 2026**. Client uploads to Firebase Storage (`slideshow/`, `requested-products/`) will currently fail with `storage/unauthorized` until an updated storage ruleset is published.

### 2.3 Live Composite Indexes
Retrieved via `firebase firestore:indexes --project sri-amman-smart-store`:

| Collection Group | Query Scope | Indexed Fields | Order | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `notifications` | COLLECTION | `read`<br>`timestamp`<br>`__name__` | ASC<br>DESC<br>DESC | Notification feed filtering unread notifications sorted by recency |
| `orders` | COLLECTION | `status`<br>`createdAt`<br>`__name__` | ASC<br>DESC<br>DESC | Admin & Delivery order dispatch by lifecycle status sorted by date |

---

## 3. Complete Inventory of Live Production Collections

The database contains 20 top-level collections:

| Collection Name | Document Count (Sample) | Primary Document ID Format | Core Domain |
| :--- | :--- | :--- | :--- |
| `usersByUid` | 12 | Firebase Auth `uid` (alphanumeric 28-char) | Auth UID to SASS customer document mapping |
| `users` | 5 | Sequential `SASS0000001` - `SASS0000021` or staff UID | Customer profile records & staff role definitions |
| `meta` | 2 | Singletons: `userSequence`, `orderSequence` | Atomic sequence counters for SASS IDs and ORD IDs |
| `products` | 4 (top-level) + 12 (nested) | `prod-mumqpksq` / `prod-...` | Product catalog documents |
| `categories` | 1 | `cat-mun1fjzh` / `cat-...` | E-commerce categories |
| `Settings` | 1 | Singleton: `CoinValue` | Global store settings (Amman Coin rate) |
| `orders` | 8 | Firestore Auto-ID (contains `orderId` or `orderNumber`) | Online orders and in-store POS receipts |
| `refer and earn` | 2 | `${orderId}` (e.g. `ORD-1790832838814-4169`) | Order-level referral reward tracking ledger |
| `pincodes` | 1 | Auto-ID (`WEKwArO1DAXzGCoz8U86`) | Serviceable delivery areas and speed tiers |
| `contact-submissions` | 2 | Auto-ID | Customer inquiries from website contact form |
| `customers` | 1 | `cust-muz4bmft` (`customerId: "CUS-000001"`) | POS in-store customer directory |
| `customerLedger` | 2 | `tx-mv2aiwid` | POS counter credit sales ledger |
| `deliveryAgents` | 2 | `M5xuMEIigFUdyk8gozlyv1p7Qmd2`, `agent-2981` | Dispatch delivery agent fleet |
| `deliveryBatches` | 1 | `batch-cbe-8827` | Multi-order delivery route bundles |
| `locations` | 2 | Shelf codes: `R1-S1-B1`, `R1-S1-B2` | Physical warehouse/store bin locations |
| `orderStatusHistory` | 2 | Auto-ID | Audit log of order stage transitions |
| `stockMovements` | 2 | Auto-ID | Inventory stock in/out movement log |
| `activityLogs` | 2 | Auto-ID | Admin and staff operational audit log |
| `adminusers` | >0 | Auto-ID / UID | Back-office admin permissions |
| `scannerSessions` | >0 | Auto-ID | Handheld barcode scanner sessions |

---

## 4. Deep-Dive Schema Analysis & Comparison by Domain

### 4.1 Authentication & Customer Identity Resolution

#### Live Production Reality
- **Identity Pointer:** Document `usersByUid/{uid}` has fields:
  ```json
  {
    "uid": "HBbNTuCtczLLbBCvsww58NEqXRz2",
    "userDocId": "SASS0000021",
    "email": "user@domain.com",
    "createdAt": "2026-09-23T07:30:15.996Z"
  }
  ```
- **Profile Record:** Document `users/SASS0000021` has fields:
  ```json
  {
    "userId": "SASS0000021",
    "uid": "HBbNTuCtczLLbBCvsww58NEqXRz2",
    "fullName": "Customer Name",
    "email": "user@domain.com",
    "number": "9876543210",
    "countryCode": "+91",
    "phoneVerified": true,
    "dob": "2004-08-03",
    "gender": "Male",
    "earnedCoins": 382,
    "primaryAddressId": "DWbqUMxBccv6w2dq9ODK",
    "permissions": { "geolocation": "granted", "sound": false, "camera": "denied" },
    "lastUpdated": "2026-10-10T10:42:31.875Z"
  }
  ```
- **Sequence Generator:** `meta/userSequence` holds `{ current: 21 }`.
- **Dangling Pointer Phenomenon:** 7 of the 12 `usersByUid` documents point to SASS userDocIds that return HTTP 404 (`users/SASS0000004`, `SASS0000005`, `SASS0000006`, `SASS0000007`, `SASS0000013`, `SASS0000016`, `SASS0000020`). These represent abandoned registrations or admin test deletions where the mapping pointer was not pruned.

#### Comparison Across Artifacts & Services
- **vs. `legacy-firebase-integration-audit.md`:** Exactly matches. The audit correctly predicted the two-step resolution, sequence counter, and subcollection structure.
- **vs. `db.json` & Emulator Seeding:** In `db.json`, users were represented as flat mock objects (`id: "SASS9999901"`, `name`, `phone`, `coins`). In Task 9, we added `linkedCustomerFixtures` to `db.json` and updated `scripts/seed-emulator.mjs` to dynamically create `usersByUid/{uid}` pointing to `users/{userDocId}`. This aligns the emulator environment with production.
- **vs. `customerIdentityService.ts`:** 100% compliant. The service resolves `usersByUid/{uid}` -> `users/{userDocId}`, validates SASS ID formats, normalizes the profile using `legacyUserMapper.ts`, and correctly returns `status: "profile_missing"` for the 7 dangling production pointers without crashing or inventing surrogate accounts.

---

### 4.2 Product Catalog & Hierarchy

#### Live Production Reality
- **Dual Placement:**
  1. Top-Level: `products/{productId}` (4 products)
  2. Nested Category Subcollection: `products/{category}/items/{productId}` (12 products across 4 categories: `Grocery`, `Masala`, `Sambar`, `Spices & Masala Powders`)
  - A deep field comparison between `products/prod-mumqpksq` and `products/Grocery/items/prod-mumqpksq` revealed **all 41 fields are identical**.
- **Live Document Schema (Sample: `prod-munn8cp3`):**
  - Identifiers: `id: "prod-munn8cp3"`, `sku: "SKU-4660"`
  - Names: `name: "Sakthi Chicken Masala"`, `tamilName: "சிக்கன் மசாலா"`, `nameTamil: "சிக்கன் மசாலா"`
  - Brand: `brandName: "Sakthi Masala"`, `brandId: "brand-sakthi"`
  - Category: `categoryName: "Grocery"`, `categoryId: "cat-mun1fjzh"`, `subCategory: "Masala & Spice Powders"`
  - Pricing: `mrp: 15`, `price: 12`, `gstRate: 5`
  - Stock: `stock: 37`, `unit: "500g Pack"`
  - Status flags: `status: "active"`, `isNew: true`, `isBestSeller: true`, `isOffer: false`, `isFeatured: false`
  - Images: `imageUrl`, `frontImageUrl`, `backImageUrl` containing base64 data URIs (`data:image/jpeg;base64,...`) exceeding 80 KB each.
  - POS Variants (`variants[]`):
    ```json
    [
      {
        "id": "var-1790744613542",
        "name": "500g Pack",
        "unit": "g",
        "weight": 500,
        "mrp": 15,
        "sellingPrice": 12,
        "purchasePrice": 15,
        "stock": 37,
        "safetyStock": 15,
        "barcode": "8906002081578",
        "sku": "SKU-4660",
        "batchNumber": "PROD005",
        "expiryDate": "2027-03-27"
      }
    ]
    ```
  - E-Commerce Options (`options[]`):
    ```json
    [
      {
        "unit": "500g Pack",
        "unitSize": "g",
        "weight": 500,
        "mrp": 15,
        "price": 12,
        "sellingPrice": 12,
        "stock": 40
      }
    ]
    ```

#### Comparison Across Artifacts & Services
- **vs. `legacy-firebase-integration-audit.md`:** The audit noted that products might reside in either top-level or nested collections. Production confirms **both** exist concurrently.
- **vs. `db.json` & Emulator:** `db.json` stores 12 products in a flat top-level `products` array with clean relative image URLs.
- **vs. `legacySchemaMapper.ts` & `firestoreAdapter.ts`:**
  - `firestoreAdapter.ts` already implements `mergeTopLevelAndNestedProducts()`, querying both top-level `products` and `collectionGroup("items")`, prioritizing top-level documents, and filtering bare category stubs.
  - `legacySchemaMapper.ts` normalizes both `options[]` and `variants[]`, handles Tamil name aliases (`nameTamil` vs `tamilName`), and extracts base64 or HTTP image URLs seamlessly.

---

### 4.3 Categories & Banners

#### Live Production Reality
- **Categories:**
  - Only **1 document** exists in top-level `categories`: `cat-mun1fjzh`.
  - Fields: `id: "cat-mun1fjzh"`, `name: "Grocery"`, `slug: "sambar"`, `itemCount: 0`, `isActive: true`, `showOnHomepage: true`, `subcategories: ["Masala & Spice Powders"]`, `imageUrl: "data:image/jpeg;base64,..."`, `bannerUrl: "data:image/jpeg;base64,..."`.
- **Banners:**
  - The top-level `banners` collection is **empty** (`count = 0`).
  - In the legacy application, hero banners were loaded from the Firebase Storage bucket path `slideshow/` via `listAll(ref(storage, "slideshow"))` as a fallback when Firestore banners were absent.

#### Comparison Across Artifacts & Services
- **vs. `db.json`:** `db.json` defines 8 rich categories (`cold-pressed-oils`, `staples-grains`, `fruits-veggies`, `organic-spices`, `dairy-breakfast`, `snacks-sweets`, `beverages`, `household`) and 1 promo banner.
- **Compatibility Gap:** If the new frontend connects directly to production, only the "Grocery" category will be returned from `/categories`, and `/banners` will return an empty array. The frontend should retain static category fallbacks or seed categories in production before going live.

---

### 4.4 Customer Cart, Addresses, & User Subcollections

#### Live Production Reality
- In production, customer cart items and addresses are **strictly subcollections under `users/{userDocId}`**:
  - **Cart:** `users/{userDocId}/cart/{variantKey}`. For example, under `users/SASS0000021/cart/`:
    - Document ID: `prod-mv0jd8dy__opt0__50g Pack__g`
    - Fields: `productId: "prod-mv0jd8dy"`, `productName: "Aachi Chicken 65 Masala"`, `quantity: 5`, `sellingPrice: 30`, `mrp: 34`, `price: 30`, `variantKey: "prod-mv0jd8dy__opt0__50g Pack__g"`, `variants: [...]`.
  - **Addresses:** `users/{userDocId}/addresses/{addressId}`. For example, under `users/SASS0000021/addresses/DWbqUMxBccv6w2dq9ODK`:
    - Fields: `door`, `street`, `town`, `city: "Tuticorin"`, `district: "Tuticorin"`, `state: "Tamil Nadu"`, `pincode: "628002"`, `contact`, `fullName`, `latitude: "8.817410846248439"`, `longitude: "78.13148436425644"`.
    - Coordinates are stored as **strings** rather than numbers.
    - Default address indicator is tracked by `primaryAddressId` on `users/{userDocId}`.

#### Comparison Across Artifacts & Services
- **vs. `db.json`:** In `db.json` and the local emulator, `cart` and `addresses` are **flat top-level collections** (`addresses/{id}` with `userId: "SASS9999901"` and `lat: number`, `lng: number`).
- **Compatibility Requirement:** The new UI's `firestoreAdapter.ts` currently treats `cart` and `addresses` as top-level collections filtered by `where("userId", "==", userId)`. To connect to live production without breaking customer carts and saved addresses, `firestoreAdapter.ts` must route `/cart` and `/addresses` requests to subcollections `users/{userId}/cart` and `users/{userId}/addresses`.

---

### 4.5 Orders & Order Lifecycle

#### Live Production Reality
- **Two Concurrent Order Streams in Top-Level `orders`:**
  Out of 8 total orders in top-level `orders`:
  1. **POS Counter Orders (4 orders):**
     - Schema: `orderNumber: "POS-INV-MV2AIV2S"`, `customerId: "CUS-000001"`, `salesChannel: "pos"`, `orderSource: "manual"`, `paymentMethod: "CREDIT"` / `"CARD"`, `status: "Delivered"`, `createdByStaffId: "As1iJAmqJ4VXD1BdwpdAfcgZPP53"`.
     - Items have POS fields: `pickStatus`, `sku`, `barcode`, `variantId`.
  2. **Online Customer Orders (4 orders):**
     - Schema: `orderId: "ORD-0000027"`, `orderNumber: "ORD-0000027"`, `buyerId: "SASS0000021"`, `buyerUid: "HBbNTuCtczLLbBCvsww58NEqXRz2"`, `paymentMethod: "COD"`, `total: 69`.
     - Status values observed: `"Pending"` (capitalized), `"out_for_delivery"` (snake_case), `"returned"` (lowercase).
- **Dual-Write / User Mirroring:**
  - Customer orders are mirrored in `users/{buyerId}/orders/{docId}`.
  - Customer cancellations (`status: "cancelled"`, `cancelReason: "testing"`) are recorded on user orders (`users/SASS0000010/orders/avuREf1Y0QLNFuuERQ73`).
- **Order Sequence:**
  - `meta/orderSequence` holds `{ current: 28 }`.
  - Next allocated order must be `ORD-0000029`.

#### Comparison Across Artifacts & Services
- **vs. `db.json`:** In `db.json`, orders have IDs like `ORD-0001001` with nested `pricingSummary`, `deliveryAddress`, `payment`.
- **vs. `firestoreAdapter.ts`:**
  - `firestoreAdapter.ts` runs an order creation transaction against `_metadata/orderSequence` (with default baseline `5510`). In production, the counter is at `meta/orderSequence` (`current: 28`).
  - Connecting to production without aligning the counter location would read from `_metadata` instead of `meta`, resulting in sequence collisions.

---

### 4.6 Amman Coins, Referrals, & Settings

#### Live Production Reality
- **Coin Conversion Setting:**
  - `Settings/CoinValue` contains `{ text: "0.05" }`. (1 Amman Coin = ₹0.05).
  - Documents `DeliverySettings`, `ExpressTimeSlots`, `ExpressAutoThreshold` **do not exist** in production `Settings`.
- **User Coin Ledger (`coinsHistory`):**
  - Stored under `users/{userDocId}/coinsHistory/{orderId}`.
  - Fields: `amount: 150`, `orderAmount: 199`, `orderId: "ORD-0000028"`, `type: "self"`, `status: "pending"`, `idempotencyKey: "ORD-0000028:self"`, `buyerUid: "HBbNTuCtczLLbBCvsww58NEqXRz2"`.
- **Referrals:**
  - Top-level collection is named `refer and earn` (with spaces).
  - Documents are keyed by `${orderId}`: `{ amount: 510, buyerId: "SASS0000010", buyerUid: "...", orderId: "ORD-1790832838814-4169", createdAt: "..." }`.

#### Comparison Across Artifacts & Services
- **vs. `db.json`:**
  - `db.json` represents `coinHistory` as flat records with `type: "earned" | "redeemed"`.
  - `db.json` represents `referrals` as flat records with `friendName`, `phoneMasked`, `rewardCoins`.
- **vs. `firestoreAdapter.ts`:**
  - The adapter expects `Settings` or `deliverySettings/default`. Since production lacks `DeliverySettings`, the new UI will use its built-in fallback defaults (`standardCharge: 40, freeThreshold: 500`).

---

## 5. Comprehensive Cross-Dimensional Compatibility Matrix

| Feature / Resource | Production Firestore (`sri-amman-smart-store`) | Legacy Audit (`legacy-firebase-integration-audit.md`) | New UI Mock (`db.json`) | Emulator Seed Script (`seed-emulator.mjs`) | Current UI Mappers & Adapter | Status & Compatibility |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Firestore Rules** | Open: `allow read, write: if true;` | Inferred direct client SDK usage | N/A (local rules file) | Restricted to `demo-*` emulator | Denies unknown; allows scoped rules | **Critical:** Production needs hardened rules before going live |
| **Storage Rules** | **Expired** (2026-10-10) | Notes `slideshow/` and `requested-products/` | N/A | N/A | N/A | **Action Required:** Update storage rules in Firebase Console |
| **Auth-to-Customer Mapping** | `usersByUid/{uid}` -> `users/{SASS...}` | Documents `ensureUserDocId` & `meta/userSequence` | Flat `users` + `linkedCustomerFixtures` | Seeds Auth Emulator user + `usersByUid` + `users` | `customerIdentityService.ts` handles 2-step lookup + missing profile | **Compatible:** Tested and validated against emulator |
| **User Sequence** | `meta/userSequence` (`current: 21`) | `meta/userSequence` | Mock length | `users.length` fallback | Uses `_metadata/orderSequence` for orders; user onboarding not yet active | **Alignment Needed:** Onboarding must target `meta/userSequence` |
| **Customer Profile** | `users/{SASS...}` (`fullName`, `number`, `earnedCoins`, `dob`, `gender`) | Documents 19 profile fields | `name`, `phone`, `coins`, `birthday` | Declarative fixture (`SASS9999901`) | `legacyUserMapper.ts` maps fields bidirectionally | **Compatible:** Mapper fully covers live production fields |
| **Catalog Hierarchy** | Dual: `products/{id}` (4 docs) + `products/{category}/items/{id}` (12 docs) | Documents `collectionGroup('items')` | Flat `products` (12 docs) | Flat `products` array | `firestoreAdapter.ts` queries both and merges; `legacySchemaMapper.ts` normalizes | **Compatible:** Adapter and mapper already implement dual resolution |
| **Product Variants & Pricing** | Both `variants[]` (POS) and `options[]` (e-commerce); base64 images | Documents `variants` & `options` | Clean `options[]`, URL images | Preserves `db.json` products | `legacySchemaMapper.ts` handles both arrays, overrides, and base64 strings | **Compatible:** Validated against live product JSON |
| **Categories** | `categories` (1 doc: `Grocery`, slug: `sambar`) | Documents top-level `categories` | 8 categories with standard slugs | 8 categories | `productService.ts` / `legacySchemaMapper.ts` | **Gap:** Only 1 category in production; needs static fallback or cloud seeding |
| **Banners** | `banners` (0 docs, empty) | Fallback to Storage `slideshow/` | 1 banner | 1 banner | `productService.getBanners()` | **Gap:** Returns empty list in production; frontend needs graceful empty-state |
| **Customer Cart** | Subcollection: `users/{userId}/cart/{variantKey}` | Documents variantKey format | Flat: `cart/{id}` | Flat: `cart` | `firestoreAdapter.ts` queries top-level `cart` | **Mismatch:** Requires subcollection routing in adapter for production |
| **Customer Addresses** | Subcollection: `users/{userId}/addresses/{id}` (coords: strings) | Documents `primaryAddressId` | Flat: `addresses/{id}` (coords: numbers) | Flat: `addresses` | `firestoreAdapter.ts` queries top-level `addresses` | **Mismatch:** Requires subcollection routing and string coordinate coercion |
| **Orders** | Dual-write: `orders/{autoId}` + `users/{userId}/orders/{autoId}` (`current: 28`) | Documents dual-write and Admin status | Flat: `orders/{id}` | Flat: `orders` | `firestoreAdapter.ts` writes top-level `orders` using `_metadata` | **Mismatch:** Needs sequence pointer `meta/orderSequence` and dual-write mirror |
| **Coins History** | Subcollection: `users/{userId}/coinsHistory/{orderId}` | Documents `type: "self"` | Flat: `coinHistory/{id}` | Flat: `coinHistory` | Flat `coinHistory` | **Mismatch:** Requires subcollection routing in adapter for production |
| **Store Settings** | `Settings/CoinValue` (`text: "0.05"`) | Documents 4 settings docs | `deliverySettings/default`, `storeInfo/default` | Singleton collections | Fallback defaults in services | **Compatible:** Production only defines CoinValue; defaults handle delivery |

---

## 6. Actionable Implementation Roadmap for Production Connectivity

The new customer frontend is already resilient thanks to the compatibility layers (`legacySchemaMapper.ts`, `legacyUserMapper.ts`, `customerIdentityService.ts`, `firestoreAdapter.ts`). To transition from local emulators (`demo-sri-amman-store`) to live production Firebase (`sri-amman-smart-store`) safely, execute the following steps in sequence:

### Phase 1: Security & Storage Hardening (Cloud Pre-requisites)
1. **Deploy Production Firestore Rules:** Replace the open `allow read, write: if true;` ruleset with authenticated rules that permit public read for catalog resources (`products`, `categories`, `Settings`), restrict `usersByUid/{uid}` to `request.auth.uid == uid`, and restrict customer subcollections to the authorized owner.
2. **Update Storage Security Rules:** Publish a non-expired rule for the Storage bucket (`sri-amman-smart-store.firebasestorage.app`).

### Phase 2: Firestore Adapter Path Routing
3. **Route User-Scoped Collections to Subcollections:**
   Update `firestoreAdapter.ts` so that when operating in cloud mode, endpoints for user-scoped resources map to subcollections:
   - `/cart` -> `users/{userId}/cart`
   - `/addresses` -> `users/{userId}/addresses`
   - `/coinsHistory` -> `users/{userId}/coinsHistory`
   - `/orders` -> read/write `orders` with mirror write to `users/{userId}/orders`
4. **Align Sequence Counter Path:**
   Change the order sequence reference in `runOrderCreationTransaction()` from `_metadata/orderSequence` to `meta/orderSequence` (`{ current: number }`).

### Phase 3: Catalog & Settings Fallback Handling
5. **Preserve Missing Category Fallbacks:** Ensure the frontend displays the full catalog even when `categories` contains only 1 entry by deriving category pills from distinct `products.category` values.
6. **Graceful Banner Handling:** Retain default hero banner slides in UI components when `/banners` returns an empty array.

---

## 7. Conclusion

The read-only audit of `sri-amman-smart-store` demonstrates that the architectural decisions made in previous phases—specifically:
- The pure legacy product mapper (`legacySchemaMapper.ts`),
- The nested product retrieval engine (`firestoreAdapter.ts`),
- The read-only customer identity resolution service (`customerIdentityService.ts`), and
- The linked customer emulator fixture system (`linkedCustomerFixture.ts`),
—are **accurate representations of the live production database**.

No unexpected schema breaking changes were found. The live database simply reinforces the necessity of subcollection routing for customer data and atomic synchronization with `meta/orderSequence` before connecting the new UI to production.

