# Phase 7.2: Amman Coins Conversion Migration (Local Only) Report

**Date:** October 20, 2026  
**Document ID:** `docs/phase-7-2-amman-coins-migration-report.md`  
**Workspace:** `D:\SRIAMMANSTORE\SRIAMMANSTORE_New_UI\design-showcase-main\design-showcase-main-2`  
**Confirmed Official Conversion Rate:**  
- **1 Amman Coin = ₹0.05**  
- **20 Amman Coins = ₹1.00**  
- **100 Amman Coins = ₹5.00**  

---

## 1. Executive Summary

In Phase 7.1, the confirmed business valuation for Amman Coins (1 coin = ₹0.05, 20 coins = ₹1.00) was established in `src/services/coinService.ts` along with bidirectional conversion helpers (`convertCoinsToRupees`, `convertRupeesToCoins`). However, legacy hardcoded ₹0.50 conversion logic remained active across multiple local UI components, services, and tests.

In Phase 7.2, the customer frontend codebase was systematically migrated to use the official conversion helpers and the ₹0.05 rate exclusively:
- Replaced all legacy ₹0.50 multipliers and fallbacks across services, context providers, routes, mock configuration, and unit tests.
- Replaced ad-hoc inline math with centralized helper functions `convertCoinsToRupees(coins)` and `convertRupeesToCoins(rupees)`.
- Maintained strict isolation: zero writes or modifications to production Firestore or Firebase Storage, zero deployment actions, zero changes to product catalogue or packaging images, and complete preservation of local development mode (14 products) and customer workflows.
- All 40 test files (638 total tests) passed with zero errors, TypeScript compilation succeeded with zero issues, and the production build completed cleanly.

---

## 2. Complete Inventory of Migrations

The table below summarizes every file modified to achieve consistent Amman Coins calculations across the local customer frontend:

| Component / File | Previous Logic (₹0.50 Rate) | Migrated Logic (₹0.05 Rate) | Verification Status |
| :--- | :--- | :--- | :--- |
| `db.json` (Line 7967) | `"coinValueInRupees": 0.5` | `"coinValueInRupees": 0.05` | Verified via `settingsService.getStoreInfo()` |
| `src/services/coinService.ts` (L56, 58) | `storeInfo?.coinValueInRupees ?? 0.5`<br>`catch { return 0.5; }` | `storeInfo?.coinValueInRupees ?? OFFICIAL_COIN_CONVERSION_RATE`<br>`catch { return OFFICIAL_COIN_CONVERSION_RATE; }` | Verified via `coinService.getConversionRate()` |
| `src/services/referralService.ts` (L38) | Default parameter `coinValueInRupees = 0.5` | Default parameter `coinValueInRupees = OFFICIAL_COIN_CONVERSION_RATE` (`0.05`) | Verified via `calculateReferralStats` |
| `src/services/legacyOrderAdapter.ts` (L456) | `const rate = Number(doc["coinValueRate"] ?? 0.5);` | `const rate = Number(doc["coinValueRate"] ?? OFFICIAL_COIN_CONVERSION_RATE);` | Verified via legacy order adapter parser |
| `src/context/CartContext.tsx` (L341-352) | `Math.floor(maxDiscountAllowed / 0.5)`<br>`Math.floor(coinsToRedeem * 0.5)` (100 coins = ₹50) | `convertRupeesToCoins(maxDiscountAllowed)`<br>`convertCoinsToRupees(coinsToRedeem)` (100 coins = ₹5.00) | Verified in cart calculation and checkout flow |
| `src/services/orderService.ts` (L181, 211) | `amount: Math.round(coinDisc * 2)`<br>`coinsBurned = Math.round(coinDisc * 2)` | `amount: convertRupeesToCoins(coinDisc)`<br>`coinsBurned = convertRupeesToCoins(coinDisc)` (20 coins burned per ₹1) | Verified in order creation and coin ledger updates |
| `src/routes/account.tsx` (L491, 780, 784) | `₹{((user?.coins || 0) * 0.5).toFixed(2)}`<br>`1 Coin = ₹0.50 cash discount` | `₹{convertCoinsToRupees(user?.coins || 0).toFixed(2)}`<br>`1 Coin = ₹0.05 cash discount` | Verified in profile overview & metric cards |
| `src/routes/notifications.tsx` (L669, 680) | `= ₹{((user?.coins || 0) * 0.5).toFixed(0)} Value`<br>`1 Coin = ₹0.50 cash discount` | `= ₹{convertCoinsToRupees(user?.coins || 0).toFixed(2)} Value`<br>`1 Coin = ₹0.05 cash discount` | Verified in notification hub "My Coin Stash" card |
| `src/routes/rewards.tsx` (L37, 732) | `useState<number>(0.5)`<br>`1 Coin = ₹0.50 cash value` | `useState<number>(OFFICIAL_COIN_CONVERSION_RATE)`<br>`1 Coin = ₹0.05 cash value` | Verified in rewards hub header, vault, and steps |

---

## 3. Preservation of Business Rules & Scope Boundaries

During this migration, all pre-existing business parameters outside the conversion rate were strictly preserved:

1. **Cart Subtotal Cap:**  
   The existing rule capping total coin discounts at 50% of the cart subtotal (`Math.floor(cartSubtotal * 0.5)`) was preserved untouched. The conversion into coins now uses `convertRupeesToCoins(maxDiscountAllowed)`.
2. **Standard Redemption Chunk:**  
   The standard 100-coin redemption block was retained: `Math.min(100, maxCoinsAllowed)`. Under the official rate, this 100-coin block delivers an instant ₹5.00 cash discount (previously ₹50.00).
3. **Coin Earning Mechanics:**  
   - Earning 1 coin per ₹10 spent on organic products was preserved.
   - Order purchase reward earning (~10% of subtotal as reward coins: `Math.max(5, Math.floor(subtotal * 0.1))`) was preserved.
   - Customer referral reward bonus (50 coins per completed invite) was preserved.
4. **VIP Privilege Progression:**  
   The binary VIP spend threshold (`vipSpendingThreshold: 5000` over rolling 30 days of delivered orders) remains completely unchanged.
5. **Geofence & Store Location:**  
   The 6km radius geofence centered on Gobichettipalayam, Erode (`11.459319, 77.333565`) was left strictly untouched.
6. **Production Catalogue Isolation:**  
   Zero production mutations were performed. The read-only production catalogue preview continues to retrieve all 8 live products safely when explicitly opted in, while the 14-product local catalogue remains the system default.

---

## 4. Test Suite Updates & Results

All unit and integration test assertions expecting the obsolete 0.50 rate were updated to the official 0.05 rate:

1. **`src/test/firestoreDualStorage.test.ts`:**  
   - Updated Line 314: asserts `storeInfo.coinValueInRupees` is `0.05`.  
   - Updated Line 802: asserts `coinService.getConversionRate()` resolves to `0.05`.
2. **`src/test/referralEarnPage.test.ts`:**  
   - Updated Line 50 & 57: verifies 100 referral reward coins yield ₹5.00 cash credit (`100 * 0.05 = 5.0`).  
   - Updated Line 78: verifies empty referral stats calculation at `0.05`.  
   - Updated Line 197: verifies `storeInfo.coinValueInRupees` is `0.05`.
3. **`src/test/checkoutWorkflow.test.ts`:**  
   - Updated Lines 296–304: verifies that redeeming 100 coins yields a ₹5.00 discount (`convertCoinsToRupees(100) === 5`) and leaves remaining coins intact.
4. **`src/test/profileAccount.test.ts`:**  
   - Updated Lines 178–182: verifies that 250 coins convert to ₹12.50 redeemable value (`convertCoinsToRupees(250) === 12.5`).
5. **`src/test/officialAmmanCoinsConversion.test.ts`:**  
   - Added comprehensive integration tests covering:
     - `coinService.getConversionRate()` defaulting to `0.05`.
     - Cart checkout coin discount computation (100 coins = ₹5.00).
     - Order service coin burn arithmetic (20 coins burned per ₹1 discount).
     - Fractional coin-to-rupee conversions (e.g. 15 coins = ₹0.75, 7 coins = ₹0.35).

### Test Suite Execution Summary
- **Command:** `npm test -- --run`
- **Test Files Passed:** 40 of 40 (100%)
- **Total Tests Passed:** 638 of 638 (100%)
- **Test Failures:** 0

### TypeScript Type Check
- **Command:** `npx tsc --noEmit`
- **Output:** Clean exit with code 0 (zero errors or type regressions).

### Production Bundle Build
- **Command:** `npm run build`
- **Output:** Succeeded in 4.87s (client) and 1.26s (server) with exit code 0.

---

## 5. Summary of Customer-Facing Impact

With Phase 7.2 complete, customers browsing the storefront in local development mode will observe consistent, uniform Amman Coins valuation throughout the application:

| Surface Area | Before Migration | After Migration |
| :--- | :--- | :--- |
| **Account Overview Sidebar** | `₹125.00 redeemable value` (250 coins) | `₹12.50 redeemable value` (250 coins) |
| **Account Metric Card** | `₹125 instant discount`<br>`1 Coin = ₹0.50 cash discount` | `₹12.50 instant discount`<br>`1 Coin = ₹0.05 cash discount` |
| **Notifications Stash Card** | `= ₹125 Value`<br>`1 Coin = ₹0.50 cash discount` | `= ₹12.50 Value`<br>`1 Coin = ₹0.05 cash discount` |
| **Rewards Hub Banner** | `Live Conversion: 1 Coin = ₹0.50 Instant Cash` | `Live Conversion: 1 Coin = ₹0.05 Instant Cash` |
| **Rewards Vault Card** | `Valued at ₹125.00 Cart Discount` | `Valued at ₹12.50 Cart Discount` |
| **Rewards Checkout Step** | `1 Coin = ₹0.50 cash value` | `1 Coin = ₹0.05 cash value` |
| **Cart Checkout Toggle** | Redeeming 100 coins applied **-₹50** discount | Redeeming 100 coins applies **-₹5** discount |
| **Order Placement Burn** | Burned 2 coins per ₹1 (`Math.round(disc * 2)`) | Burns 20 coins per ₹1 (`convertRupeesToCoins(disc)`) |

---

## 6. Conclusion & Readiness

The Amman Coins conversion migration is 100% complete across all local storefront services, context state, route components, mock databases, and automated test suites. The customer frontend now operates with full mathematical integrity under the confirmed business valuation of **1 Amman Coin = ₹0.05 (20 Coins = ₹1.00)**.

