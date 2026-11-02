# Phase 7.1: Verify Business Updates & Catalogue Consistency Report

**Date of Audit:** October 20, 2026  
**Document ID:** `docs/phase-7-1-business-update-verification.md`  
**Target Environment:** Live Production Firebase Project `sri-amman-smart-store` (Project Number: `1018585256480`)  
**Audit Mode:** Strictly Read-Only Inspection  
**Local Test Suite:** `demo-sri-amman-store` (Firestore port 8081, Auth port 9099, JSON Server port 3001)

---

## 1. Executive Summary

This phase verified four confirmed business updates against the live production environment and reconciled the customer frontend with official decisions while strictly observing read-only constraints:

1. **Chicken Masala Image Verification:** Inspected `products/prod-munn8cp3`. Found that the Firestore document **still embeds the old Base64 data URI** matching Puliyogare Rice Powder (`prod-munnjfuy`). A manual file upload to Firebase Storage does not automatically update Firestore documents. Furthermore, Firebase Storage security rules expired on October 10, 2026, preventing public reads. The customer storefront continues to render the old Base64 photograph; the mismatch is **unresolved** on the storefront.
2. **Pack Weight Verification:** Inspected all 8 live products. Found that `prod-munn8cp3` (Chicken Masala) had `options[0].weight` updated to `20`, but its label remained `"500g Pack"` and its variant weight remained `500`. The remaining 7 sachet products were not updated and still hold `weight: 500`.
3. **Official Amman Coins Valuation (1 coin = ₹0.05, ₹1 = 20 coins):** Added confirmed conversion constants and utility functions (`OFFICIAL_COIN_CONVERSION_RATE = 0.05`, `COINS_PER_RUPEE = 20`, `convertCoinsToRupees`, `convertRupeesToCoins`) and verified them with 10 unit tests. Documented the exact contradictory hardcoded `0.50` rates across `CartContext.tsx`, `account.tsx`, `notifications.tsx`, `rewards.tsx`, `orderService.ts`, and test files, halting broader rewrites per instruction.
4. **Delivery Geofence Status:** Confirmed that the store is located in Erode, Tamil Nadu, but exact coordinates remain unknown. The existing Gobichettipalayam configuration was maintained strictly unchanged in code.
5. **Production & Local Isolation:** Zero production writes, zero schema mutations, zero rule deployments, and zero customer-data integrations occurred. The 14-product local development catalogue remains the default and fully operational.

---

## 2. Task 1: Chicken Masala Image Verification

### 2.1 Live Document Observations (`prod-munn8cp3`)
The live product document was inspected across both paths (`products/prod-munn8cp3` and `products/Grocery/items/prod-munn8cp3`):

| Document Field | Type Observed | Byte Size / Value | Content Summary |
| :--- | :---: | :---: | :--- |
| `frontImageUrl` | Base64 Data URI | 61,914 B (~60.5 KB) | Inline JPEG data URI (`data:image/jpeg;base64,...`) |
| `imageUrl` | Base64 Data URI | 61,914 B (~60.5 KB) | Identical to `frontImageUrl` |
| `backImageUrl` | Base64 Data URI | 70,083 B (~68.4 KB) | Inline JPEG data URI |
| `imageUrls` | Array of Base64 | 2 items | Indexes 0 & 1 match front and back |
| `videoUrl` | `null` | N/A | None |
| Storage URL/Path | **Absent** | None | No `https://firebasestorage...` or `gs://` URI exists |

### 2.2 Comparison with Sakthi Puliyogare Rice Powder (`prod-munnjfuy`)
* `prod-munn8cp3.frontImageUrl === prod-munnjfuy.frontImageUrl`: **`true` (Exact bit-for-bit match)**.
* The Firestore product document still embeds the packaging photograph of **Sakthi Puliyogare Rice Powder** displaying barcode `8906002081042`.

### 2.3 Firebase Storage Object & Security Status
* An inspection of Firebase Storage via the client SDK returned:  
  `Firebase Storage: User does not have permission to access ''. (storage/unauthorized)`.
* This confirms our Phase 6 audit finding: the production Storage ruleset expired on **October 10, 2026** (`request.time < timestamp.date(2026, 10, 10)`).
* **Root Cause of Disconnect:** In this Firebase schema, product cards render images from Firestore document fields (`imageUrl`, `frontImageUrl`), **not** directly from Storage bucket directory listings. Manually placing an image in the Firebase Storage console does not automatically alter or rewrite existing Firestore documents. Furthermore, unauthenticated clients cannot read expired Storage objects.

### 2.4 Customer Storefront Impact & Next Steps
* **Storefront Rendering Result:** The customer frontend continues to read the Firestore document's Base64 string and renders the Puliyogare packaging. The mismatch is **NOT resolved** on the live customer storefront.
* **Resolution Requirement:** Once write access is authorized in a future phase and Storage security rules are renewed, the Firestore document `products/prod-munn8cp3` must be updated with either:
  1. A newly generated Base64 data URI of the authentic Chicken Masala packaging, OR
  2. A public Firebase Storage download URL pointing to the new Storage object.

---

## 3. Task 2: Pack Weight Verification

### 3.1 Observed Production Values vs Previous Audit

| Product ID | Product Name | Previous Audit (Phase 6) | Current Live Observation (Phase 7.1) | Change Detected? | Remaining Inconsistency |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `prod-munn8cp3` | Sakthi Chicken Masala | Option: `"500g Pack"`<br>Weight: `undefined` / `500`<br>Variant weight: `500` | Option: `"500g Pack"`<br>`options[0].weight`: **`20`**<br>Variant weight: `500` | **Partial Change** | Contradiction: option label claims `"500g Pack"` while storing `weight: 20`. POS `variants[0].weight` remains `500`. |
| `prod-mumqpksq` | Sakthi Turmeric Powder | Option: `"20g Pack"`<br>Variant weight: `500` | Option: `"20g Pack"`<br>`options[0].weight`: `500`<br>Variant weight: `500` | None | Option label is `"20g Pack"`, but both options and variants store `weight: 500`. |
| `prod-mumrbamt` | Sakthi Sambar Powder | Option: `"20g Pack"`<br>Variant weight: `500` | Option: `"20g Pack"`<br>`options[0].weight`: `500`<br>Variant weight: `500` | None | Option label is `"20g Pack"`, but both options and variants store `weight: 500`. |
| `prod-munnbzf7` | Sakthi Biryani Masala | Option: `"20g Pack"`<br>Variant weight: `500` | Option: `"20g Pack"`<br>`options[0].weight`: `500`<br>Variant weight: `500` | None | Stores `weight: 500` across options and variants. |
| `prod-munnezib` | Sakthi Fish Curry Masala | Option: `"20g Pack"`<br>Variant weight: `500` | Option: `"20g Pack"`<br>`options[0].weight`: `500`<br>Variant weight: `500` | None | Stores `weight: 500` across options and variants. |
| `prod-munnjfuy` | Sakthi Puliyogare Rice Powder | Option: `"20g Pack"`<br>Variant weight: `500` | Option: `"20g Pack"`<br>`options[0].weight`: `500`<br>Variant weight: `500` | None | Stores `weight: 500` across options and variants. |
| `prod-munnwgk0` | Sakthi Rasam Powder | Option: `"20g Pack"`<br>Variant weight: `500` | Option: `"20g Pack"`<br>`options[0].weight`: `500`<br>Variant weight: `500` | None | Stores `weight: 500` across options and variants. |
| `prod-mv0jd8dy` | Aachi Chicken 65 Masala | Option: `"500g Pack"` (in var)<br>Option label: `"50g Pack"` | Option: `"50g Pack"`<br>`options[0].weight`: `500`<br>Variant weight: `500` | None | Option label is `"50g Pack"`, but stores `weight: 500`. |

### 3.2 Evaluation of Admin Panel Updates
* An admin panel update was executed for `prod-munn8cp3`, setting `options[0].weight = 20`. However, the unit label string (`"500g Pack"`) and the cashier variant (`variants[0].weight = 500`) were not updated, creating an inverted label-to-weight conflict.
* The remaining 7 sachet products have **not** been updated in production Firestore and still reflect the legacy `500g` placeholder.

---

## 4. Task 3: Local Amman Coins Valuation Alignment

### 4.1 Confirmed Business Rule
* **Official Rate:** **1 coin = ₹0.05** (₹1.00 = 20 coins).
* **Confirmed Milestones:**
  * 20 coins = ₹1.00
  * 100 coins = ₹5.00
  * 500 coins = ₹25.00
  * 1000 coins = ₹50.00

### 4.2 Implementation Changes in `src/services/coinService.ts`
Added official conversion constants and utility functions:
```typescript
export const OFFICIAL_COIN_CONVERSION_RATE = 0.05;
export const COINS_PER_RUPEE = 20;

export function convertCoinsToRupees(
  coins: number,
  rate: number = OFFICIAL_COIN_CONVERSION_RATE
): number {
  if (typeof coins !== "number" || !Number.isFinite(coins) || coins <= 0) return 0;
  return Number((coins * rate).toFixed(2));
}

export function convertRupeesToCoins(
  rupees: number,
  coinsPerRupee: number = COINS_PER_RUPEE
): number {
  if (typeof rupees !== "number" || !Number.isFinite(rupees) || rupees <= 0) return 0;
  return Math.round(rupees * coinsPerRupee);
}
```

### 4.3 Documentation of Contradictory Hardcoded Rates
Per the non-negotiable instruction:  
> *"If redemption logic contains contradictory hardcoded rates or cannot be safely corrected through a single isolated change, document the exact conflict and stop rather than rewriting the coin system."*

An exhaustive audit of the codebase identified contradictory hardcoded `0.5` rates in the following locations:

1. **`src/context/CartContext.tsx` (Lines 341–351):**
   * Hardcodes `coinsToRedeem * 0.5` and `maxDiscountAllowed / 0.5`.
   * Changing this locally causes coin discount calculations to diverge from existing checkout and bill summary tests.
2. **`src/services/orderService.ts` (Line 181):**
   * Hardcodes `amount: Math.round(coinDisc * 2)` (assuming 1 coin = ₹0.50).
3. **`src/routes/account.tsx` (Lines 491, 780, 784):**
   * Multiplies coins by `0.5` and displays hardcoded copy `"1 Coin = ₹0.50 cash discount"`.
4. **`src/routes/notifications.tsx` (Lines 669, 680):**
   * Multiplies coins by `0.5` and displays hardcoded copy `"1 Coin = ₹0.50 cash discount"`.
5. **`src/routes/rewards.tsx` (Line 732):**
   * Static marketing copy: `"Watch your bill instantly slash down at 1 Coin = ₹0.50 cash value"`.
6. **`db.json` (Line 7967):**
   * `"storeInfo": { "coinValueInRupees": 0.5 }`.
7. **Regression Test Assertions:**
   * `src/test/firestoreDualStorage.test.ts` (Lines 314 & 802): `expect(storeInfo.coinValueInRupees).toBe(0.5); expect(await coinService.getConversionRate()).toBe(0.5);`.
   * `src/test/referralEarnPage.test.ts` (Line 197): `expect(storeInfo.coinValueInRupees).toBe(0.5);`.
   * `src/test/checkoutWorkflow.test.ts` (Line 296): `discount = Math.floor(coinsToRedeem * 0.5); expect(discount).toBe(50);`.
   * `src/test/defectFixesRegression.test.ts` (Line 29): `const coinDiscount = 65; // 130 coins * 0.5`.

**Action Taken:** Rather than triggering widespread breaking changes across 7 files and multiple passing test suites, the official business conversion was formalized via `OFFICIAL_COIN_CONVERSION_RATE = 0.05` and tested in isolation. Full UI copy and cart alignment should be scheduled when a coordinated customer-workflow migration is authorized.

---

## 5. Task 4: Delivery Geofence Status

* **Confirmed Business Decision:** The Sri Amman Smart Store is located in **Erode, Tamil Nadu**, but its exact street address and GPS coordinates are currently unknown.
* **Current Code Configuration Points:**
  * `src/lib/haversine.ts`: Configures `STORE_COORDINATES` with center `lat: 11.459319, lng: 77.333565` and `maxRadiusKm: 6.0`.
  * `src/services/addressService.ts`: Exports `validateGeofence(lat, lng)`.
  * `src/services/orderService.ts`: Enforces geofence check during local order placement.
  * `src/routes/checkout.tsx`: Rejects addresses beyond the 6 km radius.
  * `db.json.storeInfo`: Stores `centerLat: 11.459319, centerLng: 77.333565, maxRadiusKm: 6`.
* **Action Taken:** The existing coordinates and 6 km radius remain **strictly unchanged in code**. Production checkout remains blocked.
* **Requirements Before Updating Geofence:**
  1. Exact street address and verified Google Maps pin / GPS coordinates of the Erode shop.
  2. Confirmed delivery model: radial Haversine distance (e.g. 6 km) vs a Pincode allowlist.
  3. Confirmation of delivery fees and speed tiers for the Erode locality.

---

## 6. Verification & Test Results

```powershell
# 1. Type Safety Verification
npx.cmd tsc --noEmit
# Result: Exit Code 0 (Zero errors)

# 2. Focused Official Coin Valuation Test Suite
npx.cmd vitest run src/test/officialAmmanCoinsConversion.test.ts
# Result: 10 passed (100%)

# 3. Comprehensive Project Test Suite
npm.cmd test -- --run
# Result: 40 test files passed (40/40), 634 tests passed (634/634)

# 4. Production Build Verification
npm.cmd run build
# Result: Client, SSR, and Nitro server bundles built with Exit Code 0.
```

---

## 7. Files Inspected and Modified

### Inspected Files
* `products/prod-munn8cp3` and all production product documents (Live Firestore via `scripts/inspect-phase7-1.mjs`)
* Production Firebase Storage bucket `sri-amman-smart-store.firebasestorage.app`
* `src/context/CartContext.tsx`
* `src/routes/account.tsx`
* `src/routes/checkout.tsx`
* `src/routes/notifications.tsx`
* `src/routes/rewards.tsx`
* `src/services/orderService.ts`
* `src/lib/haversine.ts`
* `db.json`

### Modified Files
* [`src/services/coinService.ts`](file:///d:/SRIAMMANSTORE/SRIAMMANSTORE_New_UI/design-showcase-main/design-showcase-main-2/src/services/coinService.ts): Added `OFFICIAL_COIN_CONVERSION_RATE = 0.05`, `COINS_PER_RUPEE = 20`, `convertCoinsToRupees`, `convertRupeesToCoins`, and getter methods.

### Created Files
* [`src/test/officialAmmanCoinsConversion.test.ts`](file:///d:/SRIAMMANSTORE/SRIAMMANSTORE_New_UI/design-showcase-main/design-showcase-main-2/src/test/officialAmmanCoinsConversion.test.ts): 10 unit tests verifying the confirmed business rate (20 coins = ₹1, 100 coins = ₹5).
* [`docs/phase-7-1-business-update-verification.md`](file:///d:/SRIAMMANSTORE/SRIAMMANSTORE_New_UI/design-showcase-main/design-showcase-main-2/docs/phase-7-1-business-update-verification.md): This verification report.

---

## 8. Confirmation of Safety Constraints

* [x] **Zero Production Firestore Writes:** No documents were created, updated, or deleted.
* [x] **Zero Production Storage Writes:** No objects were uploaded, modified, or deleted in Firebase Storage.
* [x] **Zero Cloud Deployments:** No rules, indexes, hosting, or functions were deployed.
* [x] **Customer Workflows Intact:** Local development mode with 14 products, local cart, local auth, and local checkout remains default and fully operational.

