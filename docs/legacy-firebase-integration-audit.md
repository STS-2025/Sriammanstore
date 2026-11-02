# Legacy Customer-Panel Firebase Integration & Data Contract Audit

**Audit Date:** 2026-10-11  
**Legacy Codebase Examined:** `D:\SRIAMMANSTORE\sriammansmartstore-main1OLD\sriammansmartstore-main\sriammansmartstore-main`  
**New Frontend Workspace:** `D:\SRIAMMANSTORE\SRIAMMANSTORE_New_UI\design-showcase-main\design-showcase-main-2`  
**Audit Scope:** Read-only code inspection and schema comparison. No cloud writes, configuration mutations, or secret exposures were performed.

---

## 1. Confirmed Firebase Project Identity & Configuration Method

### 1.1 Confirmed Project Identifiers (Verified in Code)
Inspection of `.env`, `src/firebase.jsx`, `public/firebase-messaging-sw.js`, and `NOTIFICATION_SETUP.md` in the legacy customer-panel codebase confirms the team's target Firebase project:

| Property | Confirmed Value | Source Files |
| :--- | :--- | :--- |
| **Project Display Name** | `Sri Amman Smart Store` | `.env` (line 2 comment) |
| **Project ID (`projectId`)** | `sri-amman-smart-store` | `.env`, `src/firebase.jsx`, `public/firebase-messaging-sw.js`, `NOTIFICATION_SETUP.md` |
| **Project Number (`messagingSenderId`)** | `1018585256480` | `.env`, `src/firebase.jsx`, `public/firebase-messaging-sw.js` |
| **Auth Domain (`authDomain`)** | `sri-amman-smart-store.firebaseapp.com` | `.env`, `src/firebase.jsx`, `public/firebase-messaging-sw.js` |
| **Storage Bucket (`storageBucket`)** | `sri-amman-smart-store.firebasestorage.app` | `.env`, `src/firebase.jsx`, `public/firebase-messaging-sw.js` |
| **Web App ID (`appId`)** | `1:1018585256480:web:1312d2d636b0672098a245` | `.env`, `src/firebase.jsx`, `public/firebase-messaging-sw.js` |
| **Measurement ID (`measurementId`)** | `G-7D1TG59XVM` | `.env`, `src/firebase.jsx`, `public/firebase-messaging-sw.js` |
| **Web API Key (`apiKey`)** | `[REDACTED]` | `.env` (`VITE_FIREBASE_API_KEY`), `src/firebase.jsx`, `public/firebase-messaging-sw.js` |
| **FCM VAPID Key (`vapidKey`)** | `[REDACTED]` | `src/firebase.jsx`, `NOTIFICATION_SETUP.md` |
| **Razorpay Key ID** | `[REDACTED]` | `.env` (`VITE_RAZORPAY_KEY_ID`) |

> **Important Note on Project Mismatch:** The Firebase CLI account currently logged in on this development machine (`sriammanmart@gmail.com`) only lists `ecommerce-platform-6f074` (`ecommerce-platform`). It does **not** currently have access to `sri-amman-smart-store` (Project Number `1018585256480`).

### 1.2 Configuration Method in Legacy App
- **Environment Variables (`.env`):** Uses Vite `VITE_FIREBASE_*` variables (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`, plus `VITE_RAZORPAY_KEY_ID`).
- **Hardcoded Fallbacks (`src/firebase.jsx` & `public/firebase-messaging-sw.js`):** `src/firebase.jsx` reads `import.meta.env.VITE_FIREBASE_*` with hardcoded fallback literals for every field of `sri-amman-smart-store`. `public/firebase-messaging-sw.js` hardcodes the same config object for background service-worker push notifications.
- **CLI Config Files:** Neither `firebase.json` nor `.firebaserc` exists in the legacy customer-panel repository.
- **Emulator Usage:** None. The legacy app connects directly to production Google Cloud Firebase services (`sri-amman-smart-store`) from the browser without any emulator configuration.

---

## 2. Legacy Application's Firebase Initialization Approach

### 2.1 SDK Version & Modules (`package.json`, `src/firebase.jsx`)
- **Installed Package:** `"firebase": "^11.0.2"` (Modular Firebase Web SDK v9+ API).
- **Initialized Services in `src/firebase.jsx`:**
  1. `app = initializeApp(firebaseConfig)` (`firebase/app`)
  2. `auth = getAuth(app)` (`firebase/auth`)
  3. `db = getFirestore(app)` (`firebase/firestore`)
  4. `storage = getStorage(app)` (`firebase/storage`) — used for uploading product-request images (`requested-products/{timestamp}_{filename}`) and fallback banner slideshow images (`slideshow/`).
  5. `messaging = getMessaging(app)` (`firebase/messaging`) — initialized conditionally in browser (`typeof window !== 'undefined' && 'serviceWorker' in navigator`), with helper functions `requestNotificationPermission()` (`getToken`) and `onMessageListener()` (`onMessage`).
- **Service Worker (`public/firebase-messaging-sw.js`):**
  - Imports `firebase-app-compat.js` and `firebase-messaging-compat.js` (`10.7.1`) via `importScripts` and handles background push notifications via `messaging.onBackgroundMessage(...)`.
- **Architecture:**
  - **100% Direct Client-to-Firestore Access:** All React pages, components, contexts, and hooks import `db` and `auth` directly from `src/firebase.jsx` and execute `getDoc`, `getDocs`, `setDoc`, `addDoc`, `updateDoc`, `deleteDoc`, `onSnapshot`, `runTransaction`, `query`, `where`, `orderBy`, `limit`, `increment`, and `collectionGroup` directly from the browser. No intermediate REST backend or centralized adapter layer exists in the legacy app.

---

## 3. Authentication & Customer Identity Mapping

### 3.1 Authentication Providers (`src/pages/LoginPage.jsx`, `src/pages/SignupPage.jsx`, `src/pages/UserDataPage.jsx`)
1. **Phone Authentication (Primary):**
   - Uses `RecaptchaVerifier(auth, containerId, { size: 'invisible' })` and `signInWithPhoneNumber(auth, phone, verifier)`.
   - On profile completion (`UserDataPage.jsx`), if a user is already signed in with Google (`auth.currentUser`), it creates a `PhoneAuthProvider.credential(verificationId, otp)` and calls `linkWithCredential(auth.currentUser, credential)`.
   - **Legacy Bug / Dev Fallback Warning:** In `LoginPage.jsx`, `SignupPage.jsx`, and `UserDataPage.jsx`, if `signInWithPhoneNumber` fails on `localhost` (e.g., `auth/invalid-app-credential`) or if the user enters `123456` or `000000`, the catch block sets `confirmationResult = { isMock: true }` and navigates to `/userdata` even when `auth.currentUser` is `null`.
2. **Google Authentication (Secondary):**
   - Uses `GoogleAuthProvider()` + `signInWithPopup(auth, provider)`.
3. **Email/Password Authentication:**
   - **Not used** in the legacy customer panel (only Phone OTP and Google Sign-In exist).

### 3.2 UID-to-Customer Document ID Mapping (`usersByUid` & `meta/userSequence`)
Unlike standard Firebase apps that key `users/{uid}` directly by the Firebase Auth `uid`, the legacy app decouples Firebase Auth UIDs from customer document IDs:

1. **Lookup Mapping Collection (`usersByUid/{uid}`):**
   - Document ID: Firebase Auth `user.uid`.
   - Document Schema: `{ userDocId: "SASS0000001", uid: "<firebase-auth-uid>" }`.
2. **Sequential ID Allocation (`meta/userSequence`):**
   - When a newly authenticated `uid` does not have a `usersByUid/{uid}` document, `ensureUserDocId(uid, email)` runs a Firestore transaction on **`meta/userSequence`**:
     ```js
     const seqRef = doc(db, 'meta', 'userSequence');
     const nextId = await runTransaction(db, async (tx) => {
       const seqSnap = await tx.get(seqRef);
       const curr = seqSnap.exists() ? (seqSnap.data().current || 0) : 0;
       const updated = curr + 1;
       tx.set(seqRef, { current: updated }, { merge: true });
       return updated;
     });
     const userDocId = `SASS${String(nextId).padStart(7, '0')}`;
     ```
3. **Customer Profile Document (`users/{userDocId}`):**
   - Document ID is the sequential `SASS0000001` ID (7 zero-padded digits).
   - Both `users/{userDocId}` and `usersByUid/{uid}` are written with `{ merge: true }`.
4. **Account Linking / Merging (`UserDataPage.jsx`):**
   - When a Google-authenticated user verifies a phone number (`number` + `countryCode`), `checkPhoneNumberExists` queries `users` where `number == phoneNumber` and `countryCode == countryCodeVal`.
   - If a different `existingUserDocId` is found and the user confirms linking:
     - Data from the temporary Google user doc is merged into `users/{existingUserDocId}` with `linkedUids: [existingUid, currentUid]` and `linkedAt: serverTimestamp()`.
     - The temporary user doc `users/{currentUserDocId}` is marked `{ merged: true, mergedInto: existingUserDocId }`.
     - `usersByUid/{currentUid}` is updated to point to `{ userDocId: existingUserDocId, uid: currentUid }`.
5. **Session Context (`src/context/AuthContext.jsx`):**
   - Listens to `onAuthStateChanged(auth, ...)`.
   - Subscribes via `onSnapshot` to `usersByUid/{u.uid}`, resolves `userDocId`, and then subscribes via `onSnapshot` to `users/{userDocId}`.
   - Merges Firestore profile fields onto the `user` context object (`user.uid`, `user.userId`, `user.fullName`, `user.number`, `user.email`, `user.isVIP`, `user.availableCoins`, etc.).

---

## 4. Complete Inventory of Legacy Collections, Subcollections, & Data Models

### 4.1 Summary Table of All Firestore Paths in Legacy App

| Domain | Firestore Path in Legacy App | Path Type | Document ID Format | Operations Used |
| :--- | :--- | :--- | :--- | :--- |
| **User ID Counter** | `meta/userSequence` | Top-level singleton | `userSequence` | `runTransaction` (`tx.get`, `tx.set`) |
| **Order ID Counter** | `meta/orderSequence` | Top-level singleton | `orderSequence` | `runTransaction` (`tx.get`, `tx.set`) |
| **UID Mapping** | `usersByUid/{uid}` | Top-level collection | Firebase Auth `uid` | `getDoc`, `setDoc`, `onSnapshot` |
| **Customer Profile** | `users/{userDocId}` | Top-level collection | `SASS0000001` | `getDoc`, `getDocs`, `setDoc`, `updateDoc`, `onSnapshot`, `query` |
| **Customer Cart** | `users/{userDocId}/cart/{variantKey}` | **User Subcollection** | `${productId}__opt${idx}__${unit}__${unitSize}` (or auto-ID) | `getDocs`, `setDoc`, `addDoc`, `updateDoc`, `deleteDoc`, `onSnapshot` |
| **Customer Addresses** | `users/{userDocId}/addresses/{addressId}` | **User Subcollection** | Auto-generated ID | `getDoc`, `getDocs`, `addDoc`, `setDoc`, `deleteDoc` |
| **Customer Locations** | `users/{userDocId}/locations/{locationId}` | **User Subcollection** | Auto-generated ID | `getDocs`, `addDoc`, `orderBy`, `limit` |
| **Customer GST Info** | `users/{userDocId}/settings/gst` | **User Subcollection** | `gst` | `getDoc`, `setDoc` |
| **Customer Orders** | `users/{userDocId}/orders/{orderDocId}` | **User Subcollection** | Same auto-ID as top-level `orders` | `getDocs`, `setDoc`, `updateDoc`, `onSnapshot` |
| **Top-Level Orders** | `orders/{orderDocId}` | Top-level collection | Auto-ID (`orderId` field holds `ORD-0000001`) | `addDoc`, `getDoc`, `getDocs`, `updateDoc`, `onSnapshot`, `query` |
| **Coin Ledger** | `users/{userDocId}/coinsHistory/{txDocId}` | **User Subcollection** | `${orderId}` (self) or `${orderId}_ref` (referral) | `getDoc`, `getDocs`, `setDoc`, `onSnapshot`, `query`, `orderBy` |
| **Referrals** | `users/{userDocId}/refferals/{referredUserDocId}` | **User Subcollection** *(note spelling `refferals`)* | Referred customer's `SASS...` ID | `getDocs`, `setDoc` |
| **Wishlists** | `users/{userDocId}/wishlists/{wishlistId}` | **User Subcollection** | Auto-ID or `'general'` | `getDoc`, `getDocs`, `addDoc`, `setDoc`, `updateDoc`, `deleteDoc` |
| **Wishlist Items** | `users/{userDocId}/wishlists/{wishlistId}/products/{optionKey}` | **Nested Subcollection** | `${productId}_${unit}_${unitSize}` or `${productId}` | `getDocs`, `setDoc`, `deleteDoc` |
| **User Notifications** | `users/{userDocId}/notifications/{notifId}` | **User Subcollection** | Auto-ID or `${globalId}_${userDocId}` | `getDoc`, `getDocs`, `addDoc`, `setDoc`, `updateDoc`, `onSnapshot` |
| **Global Notifications** | `notifications/{notifId}` | Top-level collection | Auto-ID (created by Admin Panel) | `getDoc`, `getDocs`, `onSnapshot`, `query` (`audience == 'all'`) |
| **Products (Primary)** | `products/{productId}` | Top-level collection | Admin product doc ID | `getDoc`, `getDocs` |
| **Products (Legacy Fallback)** | `products/{category}/items/{productId}` & `collectionGroup(db, 'items')` | Nested / Collection Group | Product doc ID | `getDoc`, `getDocs`, `collectionGroup` |
| **Product Reviews** | `products/{category}/items/{productId}/reviews/{reviewId}` | Nested Subcollection | Auto-ID | `getDocs`, `addDoc` |
| **Categories** | `categories/{categoryId}` | Top-level collection | Category doc ID | `getDocs` |
| **Banners** | `banners/{bannerId}` | Top-level collection | Banner doc ID | `getDocs` |
| **Announcements** | `announcements/{docId}` & `offerMessages/{docId}` | Top-level collections | Auto-ID | `onSnapshot`, `getDocs` |
| **App Settings** | `Settings/{settingDocId}` | Top-level collection *(capitalized `Settings`)* | `DeliverySettings`, `ExpressTimeSlots`, `ExpressAutoThreshold`, `CoinValue` | `getDoc`, `onSnapshot` |
| **Promo Codes** | `promoCodes/{docId}` & `promos/{docId}` | Top-level collections | Auto-ID or code | `getDocs`, `updateDoc`, `deleteDoc`, `query` |
| **Product Requests** | `requested-products/{docId}` & `productRequests/{docId}` | Top-level collections (dual-written) | Auto-ID | `addDoc`, `getDocs`, `query`, `orderBy` |
| **Contact Submissions** | `contact-submissions/{docId}` | Top-level collection | Auto-ID | `addDoc` |

---

### 4.2 Detailed Schema Breakdown by Domain (Verified in Legacy Code)

#### 1. Customer Profile (`users/{userDocId}`)
- **Document ID:** `SASS0000001` (allocated via `meta/userSequence`).
- **Fields Read/Written:**
  - `userId`: string (`"SASS0000001"`)
  - `uid`: string (primary Firebase Auth UID)
  - `linkedUids`: string[] (optional, populated when Google & Phone accounts are merged)
  - `linkedAt`: Firestore Timestamp (optional)
  - `merged`: boolean (optional, set on deprecated duplicate user doc)
  - `mergedInto`: string (optional, target `SASS...` ID)
  - `fullName`: string
  - `email`: string | null
  - `countryCode`: string (e.g. `"+91"`)
  - `number`: string (10-digit digits-only phone number, e.g. `"9876543210"`)
  - `phoneVerified`: boolean
  - `gender`: `"Male" | "Female" | "Other"`
  - `dob`: string (`YYYY-MM-DD`)
  - `referredBy`: string (`SASS...` code of referrer, set once)
  - `referredAt`: Firestore Timestamp
  - `primaryAddressId`: string (doc ID in `users/{userDocId}/addresses`)
  - `availableCoins`: number (current spendable coin balance; legacy code also checks fallback field `availableCoins32`)
  - `earnedCoins`: number (lifetime/pending earned coins, incremented on checkout via `increment(coinsEarned)`)
  - `isVIP`: boolean (checked via `Boolean(userDetails?.isVIP)` and written by `VIPProgressBar.jsx` when rolling 30-day spend reaches `₹5000`)
  - `vipSince`: Firestore Timestamp
  - `permissions`: `{ notification: string, geolocation: string, camera: string, microphone: string, sound: boolean }`
  - `lastUpdated`: ISO string or Firestore Timestamp

#### 2. Products (`products/{productId}`) & Normalization (`src/utils/productUtils.jsx`)
- **Primary Source:** Top-level `products` collection (created/managed by the Admin Panel).
- **Fallback Source:** If top-level `products` returns 0 normalized products or lacks subcollection items, `fetchAllProducts` and `HomePage.jsx` also query `collectionGroup(db, 'items')` (`products/{category}/items/{productId}`).
- **Raw Admin Panel Fields Normalized by `normalizeProductDoc`:**
  - `name` / `productName`: string
  - `tamilName` / `nameTamil`: string
  - `brand` / `brandName`: string
  - `category` / `categoryName`: string
  - `description` / `desc` / `details`: string
  - `imageUrl` / `frontImageUrl` / `backImageUrl` / `imageUrls` (array) / `images` (array)
  - `variants` (Admin Panel array) or `options` (legacy array):
    - Each variant has: `name` (or `unitSize` + `unit`), `weight`, `unit`, `sellingPrice` (or `price`), `mrp` (or `originalPrice`), `specialPrice` / `vipPrice` / `memberPrice`, `offerPrice`, `stock` (or `quantity` / `availableStock`), `imageUrl`.
  - Offer metadata: `offerZone` (boolean), `showOfferBand` (boolean), `offerPrice` (number), `optionOfferPrices` (`[{ unit, unitSize, offerPrice }]`), `discountPercent`, `offerBadgeText`.
  - Metadata: `fssaiLicense` / `fssaiNumber` / `fssai`, `Origin` / `origin`, `shelfLife`, `storageInstructions`, `averageRating`, `ratingCount`.

#### 3. Categories (`categories/{categoryId}`)
- **Collection:** Top-level `categories` collection.
- **Fields:** `{ id, name, description, imageUrl }`.
- **Synthetic Category:** `CategoriesPage.jsx` prepends a client-side category `{ id: 'offer-zone', name: 'Offer Zone' }` populated with products where `offerZone === true || showOfferBand === true || typeof offerPrice === 'number'`.

#### 4. Banners (`banners/{bannerId}`) & Announcements (`announcements/{docId}`)
- **`banners` collection:**
  - Filtered client-side by `data.status === "active" || data.status === undefined`.
  - Image URL resolved in priority order: `desktopImageUrl || mobileImageUrl || imageUrl || frontImageUrl || image || url`.
  - Fallback: Lists files from Firebase Storage path `slideshow/` via `listAll(ref(storage, "slideshow"))`.
- **`announcements` collection:**
  - Subscribed via `onSnapshot(collection(db, "announcements"))`.
  - Uses documents where `isActive === true` and `text` is non-empty.
  - Fallback: Reads `offerMessages` collection (`doc.data().text`).

#### 5. Customer Cart (`users/{userDocId}/cart/{variantKey}`)
- **Path:** Subcollection `users/{userDocId}/cart` (falls back to `users/{user.uid}/cart` if `userDocId` is not yet resolved).
- **Document ID (`variantKey`):**
  - From `ProductCard.jsx`: `${product.id}__opt${actualOptionIndex}__${option.unit}__${option.unitSize}`
  - From `ProductDetailsPage.jsx`: `${product.id}__pdp__opt${optionIndex}__${selectedOption.unit}__${selectedOption.unitSize}`
  - From `WishlistDetailPage.jsx` ("Add All to Cart"): Uses `addDoc` (auto-generated ID).
- **Document Fields:**
  - Spreads `...product` and `...option` fields (`name`, `brand`, `imageUrls`, etc.) plus:
  - `productId`: string
  - `quantity`: number
  - `mrp`: number
  - `sellingPrice`: number
  - `price`: number
  - `offerPrice`: number | null
  - `specialPrice`: number | null
  - `unit`: string
  - `unitSize`: string | number
  - `optionIndex`: number
  - `optionLabel`: string
  - `variantKey`: string
  - `cartItemId`: string
  - `addedAt`: ISO string
  - `lastUpdated`: ISO string

#### 6. Customer Addresses (`users/{userDocId}/addresses/{addressId}`) & Locations
- **Addresses Path:** Subcollection `users/{userDocId}/addresses`.
- **Fields:**
  - `fullName`: string
  - `fatherOrSpouse`: string
  - `door`: string (house/flat/door number)
  - `street`: string
  - `pincode`: string
  - `town`: string
  - `city`: string
  - `district`: string
  - `state`: string
  - `contact`: string (primary phone)
  - `altContact`: string (optional alternate phone)
  - `landmark`: string
  - `latitude`: number | null
  - `longitude`: number | null
  - `isCurrentLocation`: boolean
  - `createdAt`: Firestore `serverTimestamp()`
  - `lastUsed`: Firestore `serverTimestamp()`
- **Default/Primary Address Tracking:** Stored on the parent user document `users/{userDocId}` as `primaryAddressId: addressId` (rather than an `isDefault` boolean on each address doc).
- **Locations Subcollection (`users/{userDocId}/locations/{locId}`):**
  - Stores recent map/GPS picks: `{ latitude, longitude, pickedAt: serverTimestamp(), source: 'geo' | 'manual' }`.
- **GST Settings (`users/{userDocId}/settings/gst`):**
  - Stores `{ gstNumber, businessName, businessAddress }`.
- **Delivery Geofence (`src/config/deliveryZone.jsx`):**
  - Store coordinates: `lat: 11.459319, lng: 77.333565`, `radiusMeters: 6000` (6 km).

#### 7. Store, Delivery, & Coin Settings (`Settings/{docId}`)
- **Collection Name:** `Settings` (capitalized `S`).
- **Documents Read by Legacy App:**
  1. `Settings/DeliverySettings`:
     - `{ standardFreeThreshold: 500, standardCharge: 49, expressFreeThreshold: 1000, expressCharge: 99 }`
  2. `Settings/ExpressTimeSlots`:
     - `{ startHour: 6, endHour: 21 }`
  3. `Settings/ExpressAutoThreshold`:
     - `{ threshold: 4000 }` (or `value: 4000`) — cart total above which delivery auto-switches to Express.
  4. `Settings/CoinValue`:
     - `{ value: number }` (or `coinValue` / `text`).
     - *Legacy Inconsistency Note:* `CartPage.jsx` defaults to `0.03` if missing, `PaymentOptionsPage.jsx` falls back to `0.5`, and `src/constants/coinConfig.jsx` defines `COIN_TO_RUPEE = 1`!

#### 8. Promo Codes (`promoCodes` & `promos`)
- **`src/utils/promoService.jsx`:**
  - First queries top-level `promoCodes` where `code == normalizedCode` (Admin Panel schema: `{ code, value, type: 'percentage' | 'fixed' | 'flat', status: 'active' | 'inactive' }`).
  - Falls back to top-level `promos` where `code == normalizedCode` (`{ code, amount, discountAmount, type, isExpired, expireOnUse }`).
  - `consumePromoCode` marks `promos/{id}` as `{ isExpired: true, usedAt: new Date().toISOString() }` if `expireOnUse` is true (and leaves Admin `promoCodes` untouched).

#### 9. Orders (Dual-Written to `orders/{docId}` AND `users/{userDocId}/orders/{docId}`)
- **Order Number Allocation (`meta/orderSequence`):**
  - Runs transaction on `meta/orderSequence`, increments `current`, and formats `ORD-${String(nextOrderNum).padStart(7, '0')}` (e.g. `ORD-0000001`).
- **Dual-Write Pattern (`PaymentOptionsPage.jsx`):**
  1. Calls `const ref = await addDoc(collection(db, 'orders'), orderData)` — creates top-level `orders/{autoDocId}` where `orderData.orderId` and `orderData.orderNumber` equal `ORD-0000001`.
  2. Calls `await setDoc(doc(db, 'users', userDocId, 'orders', ref.id), { id: ref.id, ...orderData }, { merge: true })` — writes an identical copy under the user's `orders` subcollection using the same Firestore document ID `ref.id`.
- **Order Document Schema (`orderData`):**
  ```json
  {
    "orderId": "ORD-0000001",
    "orderNumber": "ORD-0000001",
    "items": [
      {
        "productId": "...",
        "name": "...",
        "brand": "...",
        "quantity": 2,
        "price": 180,
        "mrp": 210,
        "unit": "L",
        "unitSize": "1",
        "imageUrls": ["..."]
      }
    ],
    "address": {
      "id": "...",
      "fullName": "...",
      "door": "...",
      "street": "...",
      "landmark": "...",
      "town": "...",
      "city": "...",
      "district": "...",
      "state": "...",
      "pincode": "...",
      "contact": "..."
    },
    "deliveryType": "Standard Delivery",
    "deliveryCost": 0,
    "gstDetails": null,
    "promoCode": null,
    "promoDiscount": 0,
    "coinsUsed": 10,
    "coinDiscount": 5,
    "coinValueRate": 0.5,
    "totalAmount": 355,
    "paymentMethod": "Cash on Delivery",
    "paymentDetails": { "method": "COD", "status": "Pending" },
    "status": "Pending",
    "createdAt": "<serverTimestamp>",
    "userId": "SASS0000001",
    "userProfile": {
      "uid": "<firebase-auth-uid>",
      "userId": "SASS0000001",
      "fullName": "...",
      "email": "...",
      "countryCode": "+91",
      "number": "9876543210",
      "gender": "...",
      "dob": "...",
      "isVIP": false
    }
  }
  ```
- **Order Status & Lifecycle Fields (`src/utils/orderUtils.jsx`, `MyOrdersPage.jsx`, `OrderDetailsPage.jsx`):**
  - Initial status written by customer checkout: `"Pending"` (capitalized).
  - Admin panel updates status fields on top-level `orders/{docId}`. Because `users/{userDocId}/orders/{docId}` is not always updated by the Admin Panel, `MyOrdersPage.jsx` and `OrderDetailsPage.jsx` inspect multiple status fields across both locations:
    - `operationalStatus`, `deliveryStatus`, `dispatchStatus`, `orderStatus`, `stage`, `currentStage`, `lifecycleStage`, `pickStatus`, `status`, plus nested `delivery.*`, `shipping.*`, `logistics.*`, and `statusHistory` / `timeline` arrays.
  - Normalized lifecycle stages in `orderUtils.jsx`:
    - `'Pending'` -> `'Order Confirmed'` -> `'Packing'` -> `'Shipped'` -> `'Out for Delivery'` -> `'Delivered'` (plus `'Cancelled'`, `'Returned'`, `'Refunded'`).
  - Customer cancellation/return writes lowercase `'cancelled'` (with `cancellationReason`, `cancelledAt`) or `'returned'` (with `returnReason`, `returnedAt`) to both `users/{mappedId}/orders/{orderId}` and top-level `orders/{orderId}`.
- **Legacy Checkout Bugs Found During Inspection:**
  1. `PaymentOptionsPage.jsx` **never clears** `users/{userDocId}/cart` after placing an order.
  2. `PaymentOptionsPage.jsx` records `coinsUsed` on the order document, but **never deducts** `coinsUsed` from `users/{userDocId}.availableCoins` nor writes a redemption entry to `coinsHistory`.

#### 10. Amman Coins (`users/{userDocId}/coinsHistory/{docId}`)
- **Subcollection Name:** `users/{userDocId}/coinsHistory` (note plural `coins` in `coinsHistory`).
- **Checkout Coin Award (`PaymentOptionsPage.jsx`):**
  - Calculates `coinsEarned = Math.floor(baseAmount / 100) * 5` (5 coins per ₹100 spent).
  - Writes buyer coin history doc at `users/{buyerId}/coinsHistory/${newOrderId}`:
    ```json
    {
      "amount": 15,
      "type": "self",
      "status": "pending",
      "orderAmount": 355,
      "orderId": "ORD-0000001",
      "buyerName": "...",
      "buyerUid": "...",
      "createdAt": "<serverTimestamp>",
      "releasedAt": null,
      "idempotencyKey": "ORD-0000001:self"
    }
    ```
  - Increments `users/{buyerId}.earnedCoins` via `increment(coinsEarned)`.
  - If the buyer has `referredBy` (`SASS...`), writes a referral coin history doc to the referrer at `users/{referrerId}/coinsHistory/${newOrderId}_ref` with `type: 'referral'`, `status: 'pending'`, `referralOf: buyerId`, `idempotencyKey: "${newOrderId}:ref"`, and increments `users/{referrerId}.earnedCoins`.
- **Coin Management Page (`CoinManagementPage.jsx`):**
  - Reads spendable balance from `users/{mappedId}.availableCoins` (fallback `availableCoins32`).
  - Subscribes to `users/{mappedId}/coinsHistory` ordered by `createdAt desc` and computes:
    - `selfEarned`: sum of `amount` where `type === 'self'` and `status === 'credited'`
    - `referralEarned`: sum of `amount` where `type === 'referral'` and `status === 'credited'`
    - `pendingCoins`: sum of `amount` where `status === 'pending'`

#### 11. Referrals (`users/{userDocId}/refferals/{referredUserDocId}`)
- **Subcollection Name:** `users/{userDocId}/refferals` (**important typo in legacy code:** spelled `refferals` with two `f`s and one `r` in both `UserDataPage.jsx` line 2525 and `ReferAndEarnPage.jsx` line 44!).
- **Document ID:** Referred customer's `SASS...` ID (`currentUserId`).
- **Document Fields:** `{ uid: user.uid, userId: currentUserId, referredAt: serverTimestamp() }`.
- **How `ReferAndEarnPage.jsx` Resolves Referral Progress:**
  - Reads `users/{mappedId}/refferals`.
  - Also queries `users` where `referredBy == mappedId`.
  - For each referred user, fetches `users/{refUserId}` and `users/{refUserId}/orders` to sum their non-cancelled order spend against `targetAmount = 5000` (`useReferralProgress.jsx`).

#### 12. Wishlists (`users/{userDocId}/wishlists/{wishlistId}/products/{optionKey}`)
- **Wishlist Collection Path:** `users/{userDocId}/wishlists/{wishlistId}`
  - Document ID: Auto-generated ID or `'general'` (default wishlist created by "Add to Wishlist" quick button in `WishlistWidget.jsx`).
  - Fields: `{ name: string, createdAt: string, avatar?: { type: 'emoji' | 'icon' | 'gradient', value: string } }`.
- **Wishlist Products Path:** `users/{userDocId}/wishlists/{wishlistId}/products/{optionKey}`
  - Document ID (`optionKey`): `${product.id}_${opt.unit}_${opt.unitSize}` (or `${product.id}`).
  - Fields: Spreads `...product`, `...optionToSave`, plus `{ quantity: number, productId: product.id, addedAt: ISOString }`.

#### 13. Notifications (`notifications` & `users/{userDocId}/notifications`)
- **Global Broadcast Notifications:**
  - Collection: Top-level `notifications` where `audience == 'all'` and `deleted == false`.
  - When a user marks a global notification as read or deleted, `NotificationsPage.jsx` writes a shadow document in `users/{userDocId}/notifications/${globalId}_${userDocId}` with `{ isGlobalRef: true, globalId, read: true }`.
- **User-Specific Notifications:**
  - Subcollection: `users/{userDocId}/notifications/{notifId}`.
  - Fields: `{ id, title, body, message, type, orderId, orderNumber, read: boolean, readAt, deleted: boolean, deletedAt, createdAt, metadata, priority }`.

#### 14. Support, Product Requests, & Contact Submissions
1. **Request a Product (`RequestProductPage.jsx`):**
   - Optional image uploaded to Firebase Storage: `requested-products/${Date.now()}_${imageFile.name}`.
   - Dual-writes to two top-level collections:
     - `requested-products/{autoId}`: `{ productName, brandName, category, description, quantity, expectedPrice, urgency, imageUrl, userId, userName, userEmail, userPhone, status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }`
     - `productRequests/{autoId}` (Admin Panel mirror): `{ name, productName, title, brandName, category, description, message, details, quantity, expectedPrice, urgency, imageUrl, userId, customerId, userName, customerName, userEmail, email, userPhone, phone, contactNumber, status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), legacyRequestId }`
   - Also creates a confirmation notification in `users/{userDocId}/notifications`.
2. **Contact Us (`ContactPage.jsx`):**
   - Writes to top-level `contact-submissions/{autoId}`:
     - `{ name, email, phone, subject, message, userId, userUid, createdAt: serverTimestamp(), status: 'new' }`.
3. **Report a Problem (`ReportProblemPage.jsx`):**
   - **Unimplemented stub in legacy app:** Contains `// TODO: Send problem report to backend` and only displays a browser `alert()`. No Firestore collection exists for it in the legacy app.

---

## 5. Detailed Comparison: Legacy Customer Panel vs. New Customer Frontend

### 5.1 Architectural & Data Access Comparison

| Aspect | Legacy Customer Panel (`sriammansmartstore-main1OLD`) | New Customer Frontend (`design-showcase-main-2`) | Compatibility Assessment |
| :--- | :--- | :--- | :--- |
| **Framework** | Vite + React 18 (JavaScript `.jsx`) + Material UI (MUI) | TanStack Start + React 19 (TypeScript `.tsx`) + Tailwind CSS / shadcn | New UI is much cleaner and strictly typed |
| **Data Access Layer** | Direct `firebase/firestore` calls scattered across 35+ `.jsx` files | Centralized `apiClient.ts` -> `firestoreAdapter.ts` (with JSON Server fallback & outbox) | New architecture is centralized; all cloud mapping can be done inside `firestoreAdapter.ts` and services |
| **Firebase Project** | Hardcoded to cloud `sri-amman-smart-store` | Locked to local emulator `demo-sri-amman-store` (`assertEmulatorOnlyConfig`) | Requires controlled environment mode switch when cloud access is ready |
| **Collection Topology** | **Hierarchical Subcollections** under `users/{userDocId}/...` (`cart`, `addresses`, `orders`, `coinsHistory`, `refferals`, `wishlists/{id}/products`, `notifications`) | **Flat Top-Level Collections** filtered by `where("userId", "==", userId)` (`cart`, `addresses`, `orders`, `coinHistory`, `referrals`, `wishlists`, `wishlistProducts`, `notifications`) | **Major Structural Mismatch** — adapter must route user-scoped resources to `users/{userId}/...` subcollections (or dual-read/write) |
| **Authentication** | Firebase Auth (`signInWithPhoneNumber`, `GoogleAuthProvider`) + `usersByUid/{uid}` -> `SASS...` | Mock Auth in `localStorage` (`sass_customer_session`) with test OTP `123456` | Needs Firebase Auth integration + `usersByUid/{uid}` lookup while keeping dev fallback |

### 5.2 Collection-by-Collection & Field-by-Field Comparison

| Resource / Feature | Legacy Firestore Path & Schema | New Frontend Path & Schema | Key Differences |
| :--- | :--- | :--- | :--- |
| **Sequence Counters** | `meta/userSequence` (`{ current: number }`)<br>`meta/orderSequence` (`{ current: number }`) | `_metadata/orderSequence` (`{ currentSeq: number }`)<br>User ID uses `users.length + 105` | Collection name (`meta` vs `_metadata`) and counter field (`current` vs `currentSeq`). |
| **UID Mapping** | `usersByUid/{uid}` -> `{ userDocId: "SASS0000001", uid }` | Not present (no Firebase Auth UID in mock auth) | Needed when Firebase Auth is enabled or when security rules check `usersByUid`. |
| **User Profile (`users`)** | `users/{SASS...}`:<br>`fullName`, `number`, `countryCode`, `availableCoins`, `earnedCoins`, `primaryAddressId`, `dob`, `gender`, `isVIP`, `referredBy` | `users/{SASS...}`:<br>`name`, `phone`, `coins`, `isVIP`, `referralCode`, `referredBy`, `birthday` | Field names differ: `fullName` vs `name`, `number`+`countryCode` vs `phone`, `availableCoins` vs `coins`, `dob` vs `birthday`. |
| **Products (`products`)** | Top-level `products/{id}` (variants in `variants[]` or `options[]`, `categoryName`/`category`, `frontImageUrl`/`imageUrl`/`imageUrls[]`, `sellingPrice`/`mrp`/`offerPrice`/`specialPrice`) + fallback `collectionGroup('items')` | Top-level `products/{id}` (`options[]`, `category`, `categorySlug`, `imageUrl`, `images[]`, `mrp`, `offerPrice`, `specialPrice`, `stock`, `isFlashDeal`) | Both use top-level `products/{id}`, but Admin Panel writes `variants[]`, `sellingPrice`, `categoryName`, `frontImageUrl`, `offerZone`. New frontend needs product normalization in adapter/service. |
| **Categories (`categories`)** | `categories/{id}`: `{ id, name, description, imageUrl }` + synthetic `'offer-zone'` | `categories/{id}`: `{ id, name, tamilName, slug, itemCount, image }` | Legacy lacks `slug` and uses `imageUrl` instead of `image`. Adapter should derive `slug` and map `imageUrl` <-> `image`. |
| **Banners (`banners`)** | `banners/{id}`: `{ status, desktopImageUrl, mobileImageUrl, imageUrl, title }` | `banners/{id}`: `{ id, title, subtitle, promoCode, promoDiscount, buttonText, imageUrl }` | Legacy banners may only have image URLs (`desktopImageUrl`/`mobileImageUrl`) and `status: "active"`. Adapter should provide sensible defaults for text fields if absent. |
| **Cart** | Subcollection: `users/{userId}/cart/{variantKey}`<br>Doc ID: `${productId}__opt${idx}__${unit}__${unitSize}` | Top-level: `cart/{userId}__{cartKey}`<br>Filtered by `where("userId", "==", userId)` | Path difference: subcollection `users/{userId}/cart/{cartKey}` vs top-level `cart`. Canonical `cartKey` format is identical! |
| **Addresses** | Subcollection: `users/{userId}/addresses/{id}`<br>Fields: `fullName`, `door`, `street`, `town`, `city`, `pincode`, `contact`, `latitude`, `longitude`; default stored in `users/{userId}.primaryAddressId` | Top-level: `addresses/{id}`<br>Fields: `name`, `houseNo`, `street`, `landmark`, `city`, `pincode`, `phone`, `lat`, `lng`, `isDefault`, `tag` | Path difference (subcollection vs top-level) AND field names (`door` vs `houseNo`, `fullName` vs `name`, `contact` vs `phone`, `latitude`/`longitude` vs `lat`/`lng`, `primaryAddressId` vs `isDefault`). |
| **Orders** | Dual-written:<br>1. Top-level `orders/{autoId}` (for Admin Panel)<br>2. Subcollection `users/{userId}/orders/{autoId}`<br>`orderId`: `ORD-0000001`, `status`: `'Pending'`, `address`, `deliveryType`, `deliveryCost`, `userProfile` | Top-level `orders/{ORD-000xxxx}`<br>`id` & `orderId`: `ORD-000xxxx`, `status`: `'pending'` (lowercase), `deliveryAddress`, `delivery`, `payment`, `pricingSummary` | Legacy uses auto-ID for Firestore doc ID (with `orderId: "ORD-..."` field), dual-writes to `users/{userId}/orders`, and uses Admin status fields (`operationalStatus`, etc.). |
| **Coins Ledger** | Subcollection: `users/{userId}/coinsHistory/{orderId}`<br>Fields: `amount`, `type: 'self' \| 'referral'`, `status: 'pending' \| 'credited'`, `orderId`, `createdAt` | Top-level: `coinHistory/{txId}`<br>Fields: `amount`, `type: 'earned' \| 'redeemed'`, `description`, `timestamp`, `userId`, `orderId` | Path (`users/{userId}/coinsHistory` vs `coinHistory`) and schema (`type: 'self'|'referral'` + `status` vs `type: 'earned'|'redeemed'`). |
| **Referrals** | Subcollection: `users/{userId}/refferals/{referredUserId}` *(typo `refferals`)* + `users` where `referredBy == userId` | Top-level: `referrals/{refId}`<br>Fields: `userId`, `friendName`, `phoneMasked`, `status`, `rewardCoins`, `date` | Legacy stores minimal pointer `{ uid, userId, referredAt }` under `users/{userId}/refferals` and enriches from `users/{referredUserId}`. |
| **Wishlists** | Nested Subcollections:<br>`users/{userId}/wishlists/{wishlistId}` (`{ name, avatar, createdAt }`)<br>`users/{userId}/wishlists/{wishlistId}/products/{optionKey}` | Two Top-Level Collections:<br>`wishlists/{id}` (`{ userId, title, description, createdAt }`)<br>`wishlistProducts/{id}` (`{ wishlistId, userId, productId, ... }`) | Path (nested subcollections vs flat top-level) and wishlist name field (`name` vs `title`). |
| **Notifications** | Global `notifications` (`audience == 'all'`) + Subcollection `users/{userId}/notifications/{id}` (`createdAt`, `body`/`message`, `read`) | Top-level `notifications/{id}` (`userId`, `title`, `message`, `timestamp`, `read`, `eventKey`) | Legacy splits global broadcast notifications (`notifications`) and user notifications (`users/{userId}/notifications`). |
| **Store & Delivery Settings** | `Settings/DeliverySettings`, `Settings/ExpressTimeSlots`, `Settings/CoinValue`, `Settings/ExpressAutoThreshold` | `deliverySettings/default`, `deliverySlots/{id}`, `storeInfo/default` | Legacy uses capitalized `Settings` collection with 4 docs crafted by Admin Panel. |
| **Product Requests & Support** | Dual-writes `requested-products` + `productRequests`; `contact-submissions`; `ReportProblemPage` is a stub | `productRequests/{id}` and `reportedProblems/{id}` | `productRequests` collection name matches! Fields need minor aliasing (`name`/`productName`, `brandName`/`brand`). |

---

## 6. Recommended Integration Plan for New Frontend (Prioritized by Risk)

To preserve the new frontend's clean UI, TypeScript contracts (`src/types/index.ts`), and business-logic fixes (such as cart clearing after order placement, coin balance deduction, 24-hour return window validation, and idempotent order status notifications) while achieving 100% compatibility with the existing `sri-amman-smart-store` Firestore database and Admin Panel, **all path routing and document normalization should be encapsulated inside `src/services/firestoreAdapter.ts` (and a dedicated schema mapper module `src/services/firestoreSchemaMapper.ts`)**.

### Priority 1: High Risk (Core Data Paths, Admin Panel Interoperability, & Order Integrity)

1. **Dual-Write & Subcollection Routing in `FirestoreAdapter`:**
   - Update `SdkFirestoreDriver` / `FirestoreAdapter` to map logical REST endpoints used by the new frontend services to the actual Firestore collection/subcollection paths used by `sri-amman-smart-store`:
     - `/cart` (`userId`) -> `users/{userId}/cart/{cartKey}`
     - `/addresses` (`userId`) -> `users/{userId}/addresses/{addressId}` (plus sync `primaryAddressId` on `users/{userId}`)
     - `/wishlists` (`userId`) -> `users/{userId}/wishlists/{wishlistId}` (mapping `title` <-> `name`)
     - `/wishlistProducts` (`userId`, `wishlistId`) -> `users/{userId}/wishlists/{wishlistId}/products/{optionKey}`
     - `/coinHistory` (`userId`) -> `users/{userId}/coinsHistory/{txId}`
     - `/referrals` (`userId`) -> `users/{userId}/refferals/{refId}` (preserving legacy `refferals` spelling for backward compatibility)
     - `/notifications` (`userId`) -> merge global `notifications` (`audience == 'all'`) + `users/{userId}/notifications/{notifId}`
2. **Order Creation & Status Synchronization (`orders` + `users/{userId}/orders` + `meta/orderSequence`):**
   - Align the order sequence transaction with `meta/orderSequence` (`{ current: number }`) so order numbers (`ORD-0000001`) never collide with existing production orders.
   - When creating an order, write both the new frontend's structured fields (`deliveryAddress`, `delivery`, `payment`, `pricingSummary`) **and** the legacy/Admin Panel fields (`address`, `deliveryType`, `deliveryCost`, `userProfile`, `orderNumber`, `status: 'Pending'`) to top-level `orders/{orderId}` AND mirror to `users/{userId}/orders/{orderId}`.
   - When reading orders, normalize Admin Panel status fields (`operationalStatus`, `deliveryStatus`, `dispatchStatus`, `orderStatus`, `status`) into the new frontend's canonical lowercase `OrderStatus` (`'pending' | 'processing' | 'packed' | 'in transit' | 'delivered' | 'cancelled' | 'returned'`).
3. **Product & Category Schema Normalization (Admin Panel Compatibility):**
   - Add a bidirectional mapper for `products/{id}` that normalizes Admin Panel documents (`variants[]`, `sellingPrice`, `categoryName`, `frontImageUrl`, `offerZone`, `optionOfferPrices`) into the new frontend's `Product` type (`options[]`, `offerPrice`, `mrp`, `specialPrice`, `categorySlug`, `imageUrl`, `images[]`, `isFlashDeal`), so products added via the Admin Panel render seamlessly in the new UI.
4. **Customer Profile Field Normalization (`users/{userId}`):**
   - Normalize `users/{SASS...}` documents bidirectionally so both legacy fields (`fullName`, `number`, `countryCode`, `availableCoins`, `earnedCoins`, `dob`, `primaryAddressId`) and new frontend fields (`name`, `phone`, `coins`, `birthday`) stay synchronized on every read and write.

### Priority 2: Medium Risk (Authentication & Store Settings)

5. **Firebase Authentication + `usersByUid` Identity Resolution (`authService.ts` & `firebaseClient.ts`):**
   - Introduce a configurable auth mode (`VITE_AUTH_MODE=firebase | mock`) alongside `VITE_DATA_SOURCE_MODE`.
   - In `firebase` mode, support Firebase Phone Auth (`RecaptchaVerifier` + `signInWithPhoneNumber`) and Google Sign-In (`GoogleAuthProvider`), resolve `usersByUid/{uid}` -> `SASS...` via `meta/userSequence`, and populate `sass_customer_session` so all downstream services receive the canonical `SASS...` `userId`.
   - Retain controlled mock OTP (`123456`) support strictly for local emulator / development testing without allowing unauthenticated writes when security rules require `request.auth != null`.
6. **Settings Mapping (`Settings/*` <-> `/deliverySettings`, `/storeInfo`, `/deliverySlots`):**
   - Map `Settings/DeliverySettings`, `Settings/ExpressTimeSlots`, `Settings/ExpressAutoThreshold`, and `Settings/CoinValue` to the new frontend's `/deliverySettings`, `/deliverySlots`, and `/storeInfo` contracts (with safe fallback defaults if a setting doc is missing).

### Priority 3: Low Risk (Support, Promo Codes, & Enhancements)

7. **Product Requests, Reported Problems, & Promo Codes:**
   - Dual-write `/productRequests` to `productRequests` (with Admin Panel field aliases) and `requested-products`.
   - Keep `/reportedProblems` writing to `reportedProblems` (fixing the unimplemented stub in the legacy app).
   - Connect coupon validation in checkout to query `promoCodes` (Admin Panel) and `promos` in Firestore in addition to the existing built-in promo codes.

---

## 7. Items to Inspect in Live `sri-amman-smart-store` Once Access is Confirmed

Once the team grants `Viewer` / `Firebase Develop Admin` access on `sri-amman-smart-store` (Project Number `1018585256480`) to the CLI account or confirms the active project credentials, perform a **read-only live audit** of the following items before enabling cloud connections:

1. **Live Firestore Security Rules (`firestore.rules` in Cloud):**
   - Verify whether live rules require `request.auth != null` and `exists(/databases/$(database)/documents/usersByUid/$(request.auth.uid))`, or if certain collections (`products`, `categories`, `banners`, `Settings`) allow public unauthenticated reads.
2. **Live Composite Indexes (`firestore.indexes.json`):**
   - Check which composite indexes currently exist in `sri-amman-smart-store` (e.g., `orders` indexed by `userProfile.uid + createdAt`, `notifications` indexed by `audience + deleted`).
3. **Actual Document Shapes & Counts in Production Collections:**
   - Verify `meta/userSequence` and `meta/orderSequence` current counter values.
   - Check whether live products are stored in top-level `products/{id}` (Admin Panel schema with `variants[]`) or legacy subcollections `products/{category}/items/{id}`, or both.
   - Inspect sample documents in `Settings/DeliverySettings`, `Settings/CoinValue`, `Settings/ExpressTimeSlots`, `categories`, `banners`, and `orders` to confirm exact field types Written by the Admin Panel.
4. **Firebase Authentication Settings in Console:**
   - Confirm enabled Sign-In providers (Phone, Google, Email/Password), authorized domains (`localhost`, production domain), and whether test phone numbers are configured in Firebase Console -> Authentication -> Sign-in method -> Phone.

---

## 8. Appendix: Legacy Files Examined

All files below were inspected in `D:\SRIAMMANSTORE\sriammansmartstore-main1OLD\sriammansmartstore-main\sriammansmartstore-main`:

- **Configuration & Setup:**
  - `.env` (secrets redacted)
  - `package.json`
  - `src/firebase.jsx` (secrets redacted)
  - `public/firebase-messaging-sw.js` (secrets redacted)
  - `NOTIFICATION_SETUP.md` (secrets redacted)
  - `src/config/deliveryZone.jsx`
  - `src/constants/coinConfig.jsx`
  - `src/constants/contactInfo.jsx`
- **Authentication & Context:**
  - `src/context/AuthContext.jsx`
  - `src/pages/LoginPage.jsx`
  - `src/pages/SignupPage.jsx`
  - `src/pages/UserDataPage.jsx`
  - `src/pages/UserSettingsPage.jsx`
- **Utilities & Hooks:**
  - `src/App.jsx`
  - `src/utils/productUtils.jsx`
  - `src/utils/orderUtils.jsx`
  - `src/utils/promoService.jsx`
  - `src/utils/wishlistUtils.jsx`
  - `src/utils/currency.jsx`
  - `src/utils/geo.jsx`
  - `src/hooks/useSearch.jsx`
  - `src/hooks/useCheckoutData.jsx`
  - `src/hooks/useGSTDetails.jsx`
  - `src/hooks/useReferralProgress.jsx`
- **Catalog, Cart, & Checkout:**
  - `src/pages/HomePage.jsx`
  - `src/pages/CategoriesPage.jsx`
  - `src/pages/ProductDetailsPage.jsx`
  - `src/components/ProductCard.jsx`
  - `src/components/BannerSlideshow.jsx`
  - `src/components/OfferScroller.jsx`
  - `src/pages/CartPage.jsx`
  - `src/checkout/components/OrderSummaryCard.jsx`
  - `src/checkout/components/DeliveryAddressCard.jsx`
  - `src/checkout/components/DeliveryOptionsCard.jsx`
  - `src/checkout/components/PaymentSummaryCard.jsx`
  - `src/checkout/components/PromoCodeCard.jsx`
  - `src/pages/PaymentOptionsPage.jsx`
- **Orders, Addresses, Coins, Referrals, Wishlists, Notifications, & Support:**
  - `src/pages/MyOrdersPage.jsx`
  - `src/pages/OrderDetailsPage.jsx`
  - `src/pages/AddressesPage.jsx`
  - `src/pages/CoinManagementPage.jsx`
  - `src/pages/ReferAndEarnPage.jsx`
  - `src/components/VIPProgressBar.jsx`
  - `src/pages/WishlistPage.jsx`
  - `src/pages/WishlistDetailPage.jsx`
  - `src/components/WishlistWidget.jsx`
  - `src/pages/NotificationsPage.jsx`
  - `src/pages/NotificationDetailPage.jsx`
  - `src/pages/RequestProductPage.jsx`
  - `src/pages/ReportProblemPage.jsx`
  - `src/pages/ContactPage.jsx`

