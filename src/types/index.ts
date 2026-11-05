/**
 * Canonical customer-facing pack size and pricing option.
 * Consumed by product cards, product details, cart, and checkout.
 * Internal POS metadata (e.g. purchasePrice, barcode, safetyStock) is strictly omitted.
 */
export interface ProductOption {
  /** Normalized measurement unit (e.g., "g", "kg", "ml", "L", "pcs") */
  unit: string;
  /** Normalized numeric pack size string (e.g., "20", "50", "100", "500", "1") */
  unitSize: string;
  /** Maximum Retail Price printed on packaging */
  mrp: number;
  /** Regular selling price to the customer */
  offerPrice: number;
  /** Optional Amman VIP / subscriber special price */
  specialPrice?: number;
  /** Verified available physical stock */
  stock: number;
}

export interface ProductNutrition {
  energy?: string;
  mufa?: string;
  pufa?: string;
  cholesterol?: string;
  vitaminE?: string;
  carbs?: string;
  protein?: string;
  fiber?: string;
  fat?: string;
  vitamins?: string;
  [key: string]: string | undefined;
}

/**
 * Canonical Product domain model for the new Sri Amman Smart Store customer frontend.
 * Normalized from either the production 41-field Firestore schema or local mock fixtures.
 * Sensitive merchant data (e.g. purchasePrice) and POS supply chain tracking are strictly omitted.
 */
export interface Product {
  /** Permanent document identifier preserved from Firestore (e.g. "prod-mumqpksq") */
  id: string;
  /** Product display name in English */
  name: string;
  /** Optional product display name in Tamil */
  tamilName?: string;
  /** Display category name */
  category: string;
  /** Canonical URL category slug for routing and filtering */
  categorySlug: string;
  /** Optional subcategory name (e.g. "Masala & Spice Powders") */
  subCategory?: string;
  /** Brand name (e.g. "Sakthi Masala") */
  brand: string;
  /** Average customer rating (0 to 5, strictly 0 when unrated) */
  rating: number;
  /** Verified review count (strictly 0 when unrated) */
  reviewCount: number;
  /** Product description copy */
  description: string;
  /** Primary display image URL or Base64 data URI */
  imageUrl: string;
  /** Deduplicated image gallery array */
  images: string[];
  /** Validated customer pack options (minimum 1 required) */
  options: ProductOption[];
  /** Search keywords and tag tokens */
  tags: string[];
  /** Storefront visibility status */
  isActive: boolean;
  /** Promotional offer flag */
  isFlashDeal?: boolean;
  /** Promotional badge text */
  flashDiscount?: string;
  /** Geographic origin of produce (e.g. "Kodumudi, Erode") */
  origin?: string;
  /** Traditional extraction method */
  extraction?: string;
  /** Nutritional breakdown facts */
  nutrition?: ProductNutrition;
  /** Verified ingredients list from packaging */
  ingredients?: string;
  /** FSSAI license / registration number */
  fssaiNumber?: string;
  /** GST rate percentage (e.g. 5 for 5%) */
  gstRate?: number;
  /** Harmonized System of Nomenclature code (e.g. "09103030") */
  hsnCode?: string;
  /** New arrival promotional indicator */
  isNew?: boolean;
  /** Bestseller promotional indicator */
  isBestSeller?: boolean;
}

export interface Category {
  id: string;
  name: string;
  tamilName?: string | undefined;
  slug: string;
  itemCount: string;
  image: string;
  description?: string | undefined;
  displayOrder?: number | undefined;
  isActive?: boolean | undefined;
  showOnHomepage?: boolean | undefined;
  subcategories?: string[] | undefined;
  source?: ("firestore-document" | "product-fallback" | "local") | undefined;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  promoCode: string;
  promoDiscount: string;
  buttonText: string;
  imageUrl: string;
  tamilTitle?: string;
  tamilSubheading?: string;
  tamilShortDescription?: string;
  shortDescription?: string;
  subheading?: string;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  videoUrl?: string;
  redirectUrl?: string;
  placement?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  priority?: number | undefined;
  contentMaxWidth?: number | undefined;
  textPosition?: string;
  textAlignment?: string;
  verticalAlignment?: string;
  headingFontSize?: number | undefined;
  subheadingFontSize?: number | undefined;
  headingColor?: string;
  subheadingColor?: string;
  buttonTextColor?: string;
  buttonBackgroundColor?: string;
  bannerBackgroundColor?: string;
  overlayColor?: string;
  customOverlayColor?: string;
  overlayOpacity?: number | undefined;
  imageOverlayEnabled?: boolean | undefined;
  showTitle?: boolean | undefined;
  showSubheading?: boolean | undefined;
  showDescription?: boolean | undefined;
  showButton?: boolean | undefined;
  showPromoCode?: boolean | undefined;
  showPromoDiscount?: boolean | undefined;
  categorySlug?: string;
}

export interface Announcement {
  id: string;
  text: string;
  bgColor?: string;
  textColor?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CartItem {
  id: string; // Canonical key: `${productId}__opt${optionIndex}__${unit}__${unitSize}`
  cartKey?: string;
  userId?: string;
  productId: string;
  optionIndex: number;
  unit: string;
  unitSize: string;
  name: string;
  price: number;
  mrp: number;
  specialPrice?: number;
  quantity: number;
  image: string;
  stock: number;
}

export interface Address {
  id: string;
  userId: string;
  tag: "Home" | "Work" | "Other";
  name: string;
  phone: string;
  houseNo: string;
  street: string;
  landmark?: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  unitSize: string;
  price: number;
  quantity: number;
  image: string;
  /** Additional image fields preserved from historical order snapshots for fallback resolution. */
  imageCandidates?: string[];
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "packed"
  | "in transit"
  | "delivered"
  | "cancelled"
  | "returned";

export interface OrderPricingSummary {
  subtotal: number;
  productSavings: number;
  deliveryFee: number;
  coinDiscount: number;
  coinsRedeemed?: number;
  couponDiscount: number;
  totalAmount: number;
}

export interface Order {
  id: string;
  orderId: string;
  userId: string;
  customerName: string;
  phone: string;
  status: OrderStatus;
  createdAt: string;
  deliveredAt?: string;
  cancelledAt?: string;
  deliveryAddress: {
    houseNo: string;
    street: string;
    landmark?: string;
    city: string;
    pincode: string;
  };
  delivery: {
    type: "standard" | "express";
    slot: string;
    estimatedTime?: string;
    driver?: {
      name: string;
      phone: string;
      vehicle: string;
    };
  };
  payment: {
    method: "online" | "cod" | "upi";
    status: string;
    transactionId?: string;
  };
  items: OrderItem[];
  pricingSummary: OrderPricingSummary;
  coinsRedeemed?: number;
  coinsUsed?: number;
  coinsRefunded?: boolean;
  rawStatus?: string;
  legacyStatus?: string;
  orderNumber?: string;
  buyerUid?: string;
  rawOrder?: Record<string, unknown>;
}

export interface User {
  id: string;
  userId: string;
  customerId?: string;
  legacySassId?: string;
  name: string;
  phone: string;
  email: string;
  /** Canonical spendable coin balance. Single source of truth. */
  smartCoins?: number;
  /** Deprecated legacy coin balance alias for backward compatibility. */
  coins?: number;
  /** Optional legacy balance field from earlier schema. */
  availableCoins?: number;
  /** Lifetime earned coin total. */
  earnedCoins?: number;
  primaryAddressId?: string;
  uid?: string;
  countryCode?: string;
  gender?: string;
  phoneVerified?: boolean;
  verifiedPhone?: string;
  accountType?: string;
  role?: string;
  isVIP: boolean;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
  updatedAt?: string;
  lastUpdated?: string;
  preferredLanguage?: string;
  dob?: string;
  birthday?: string;
  groceryRhythm?: string;
  avatarUrl?: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface WishlistProduct {
  id: string;
  wishlistId: string;
  userId: string;
  productId: string;
  optionIndex: number;
  unit: string;
  unitSize: string;
  name: string;
  price: number;
  mrp: number;
  specialPrice?: number;
  image: string;
  /** Current customer-specific subcollection entry status and saved snapshots. */
  isActive?: boolean;
  brandName?: string;
  variantName?: string;
  addedAt?: unknown;
}

export interface CoinTransaction {
  id: string;
  userId: string;
  orderId?: string;
  amount: number;
  type: "earned" | "redeemed";
  description: string;
  timestamp: string;
}

export interface ReferralFriend {
  id: string;
  userId: string;
  friendName: string;
  phoneMasked: string;
  status: string;
  rewardCoins: number;
  date: string;
}

export type NotificationCategory = "orders" | "offers" | "account" | "rewards" | "harvest";

export type NotificationEventType =
  | "order_created"
  | "order_status_changed"
  | "reward_credited"
  | "coins_credited"
  | "harvest_alert"
  | "account"
  | "system";

export interface NotificationItem {
  id: string;
  userId: string;
  category: NotificationCategory;
  type?: NotificationEventType;
  eventKey?: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  badge?: string;
  orderId?: string;
  previousStatus?: OrderStatus;
  newStatus?: OrderStatus;
  driverName?: string;
  driverVehicle?: string;
  pin?: string;
  coins?: number;
  productId?: string;
  ctaText?: string;
  secondaryCtaText?: string;
  secondaryActionUrl?: string;
  highlightNote?: string;
}

export interface DeliverySettings {
  id: string;
  minOrderForFreeDelivery: number;
  standardDeliveryCharge: number;
  expressDeliveryCharge: number;
  expressMinThreshold: number;
}

export interface DeliverySlot {
  id: string;
  type: "standard" | "express";
  title: string;
  badge?: string;
  subtitle: string;
  charge: number;
}

export interface StoreInfo {
  storeName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  email: string;
  centerLat: number;
  centerLng: number;
  locationName: string;
  maxRadiusKm: number;
  coinValueInRupees: number;
  vipSpendingThreshold: number;
}

