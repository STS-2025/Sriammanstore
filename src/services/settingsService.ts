import { apiClient } from "./apiClient";
import type { DeliverySettings, DeliverySlot, StoreInfo } from "../types";
import { STORE_COORDINATES } from "../lib/haversine";

export interface StoreDeliverySettings {
  deliveryEnabled: boolean;
  deliveryRadiusKm: number;
  deliveryZones: string[];
  storeCoordinates: {
    lat: number;
    lng: number;
  };
  storeName: string;
  storeAddress: string;
  serviceAreaDistrict: string;
  serviceAreaState: string;
  minOrderValue?: number;
}

export const DEFAULT_DELIVERY_SETTINGS: StoreDeliverySettings = {
  deliveryEnabled: true,
  deliveryRadiusKm: 50.0, // Default baseline when Settings/delivery is not yet provisioned in Firestore
  deliveryZones: [],
  storeCoordinates: {
    lat: STORE_COORDINATES.lat,
    lng: STORE_COORDINATES.lng,
  },
  storeName: STORE_COORDINATES.storeName,
  storeAddress: STORE_COORDINATES.storeAddress,
  serviceAreaDistrict: STORE_COORDINATES.serviceAreaDistrict,
  serviceAreaState: STORE_COORDINATES.serviceAreaState,
  minOrderValue: 0,
};

export interface StorePaymentSettings {
  upiEnabled: boolean;
  merchantUpiId: string;
  merchantName: string;
  codEnabled: boolean;
  maxCodAmount?: number;
  qrCodeUrl?: string;
}

export const DEFAULT_PAYMENT_SETTINGS: StorePaymentSettings = {
  upiEnabled: true,
  merchantUpiId: "sriammansmartstore@okaxis",
  merchantName: "Sri Amman Smart Store",
  codEnabled: true,
  maxCodAmount: 3000,
};

export interface LegacyCheckoutSettings {
  standardFreeThreshold: number;
  standardCharge: number;
  expressFreeThreshold: number;
  expressCharge: number;
  expressStartHour: number;
  expressEndHour: number;
  expressAutoThreshold: number;
  coinValueInRupees: number;
  smartCoinEarnRate: number;
  maxCoinRedemptionPercent: number;
  minCoinsToRedeem: number;
  coinValidityMonths: number;
  minimumOrderAmount: number;
  maxItemsPerOrder: number;
  codAllowed: boolean;
  maxCodAmount: number;
  orderCutoffTime: string;
}

export const LEGACY_CHECKOUT_DEFAULTS: LegacyCheckoutSettings = {
  standardFreeThreshold: 499,
  standardCharge: 40,
  expressFreeThreshold: 1000,
  expressCharge: 99,
  expressStartHour: 6,
  expressEndHour: 21,
  expressAutoThreshold: 4000,
  coinValueInRupees: 1,
  smartCoinEarnRate: 1,
  maxCoinRedemptionPercent: 20,
  minCoinsToRedeem: 50,
  coinValidityMonths: 12,
  minimumOrderAmount: 199,
  maxItemsPerOrder: 40,
  codAllowed: true,
  maxCodAmount: 3000,
  orderCutoffTime: "20:00",
};

const DEFAULT_STORE_INFO: StoreInfo = {
  storeName: STORE_COORDINATES.storeName,
  tagline: "Farm Fresh Groceries & Wood Churned Oils",
  phone: "",
  whatsapp: "",
  email: "",
  centerLat: STORE_COORDINATES.lat,
  centerLng: STORE_COORDINATES.lng,
  locationName: STORE_COORDINATES.locationName,
  maxRadiusKm: STORE_COORDINATES.maxRadiusKm,
  coinValueInRupees: LEGACY_CHECKOUT_DEFAULTS.coinValueInRupees,
  vipSpendingThreshold: 5000,
};

export function isLegacyExpressAvailable(
  hour: number,
  settings: LegacyCheckoutSettings,
): boolean {
  return hour >= settings.expressStartHour && hour < settings.expressEndHour;
}

export function calculateLegacyDeliveryCharge(
  subtotal: number,
  speed: "standard" | "express",
  itemCount: number,
  settings: LegacyCheckoutSettings,
): number {
  if (itemCount <= 0) return 0;
  const threshold = speed === "express"
    ? settings.expressFreeThreshold
    : settings.standardFreeThreshold;
  const charge = speed === "express" ? settings.expressCharge : settings.standardCharge;
  return subtotal >= threshold ? 0 : charge;
}

function finiteSetting(
  value: unknown,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function redemptionPercentSetting(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.min(100, parsed);
}

function textSetting(
  doc: Record<string, unknown>,
  keys: string[],
  fallback: string,
): string {
  for (const key of keys) {
    const value = doc[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return fallback;
}

function numberSetting(
  doc: Record<string, unknown>,
  keys: string[],
  fallback: number,
): number {
  for (const key of keys) {
    const value = Number(doc[key]);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return fallback;
}

function parseCommaSeparatedSetting(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function getDistrictFromStoreAddress(address: string): string {
  const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
  const cityAndPin = parts.find((part) => /-\s*\d{6}/.test(part));
  if (cityAndPin) return cityAndPin.replace(/-\s*\d{6}.*/, "").trim();
  return parts.at(-2) || parts.at(-1) || "";
}

export function isOrderCutoffPassed(
  cutoffTime: string,
  now = new Date(),
): boolean {
  const match = /^(\d{1,2}):(\d{2})$/.exec(cutoffTime.trim());
  if (!match) return false;
  const cutoffHour = Number(match[1]);
  const cutoffMinute = Number(match[2]);
  if (cutoffHour > 23 || cutoffMinute > 59) return false;
  const [hour, minute] = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(now)
    .split(":")
    .map(Number);
  return (hour ?? 0) * 60 + (minute ?? 0) >= cutoffHour * 60 + cutoffMinute;
}

async function readLegacySetting(
  id: string,
): Promise<Record<string, unknown> | null> {
  try {
    return await apiClient.get<Record<string, unknown>>(`/Settings/${id}`);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status?: number }).status === 404
    ) {
      return null;
    }
    throw error;
  }
}

export const settingsService = {
  async getBusinessSettings(): Promise<Record<string, unknown>> {
    return apiClient.get<Record<string, unknown>>(
      "/businessSettings/businessSettings"
    );
  },

  async getDeliverySettings(): Promise<DeliverySettings> {
    return apiClient.get<DeliverySettings>("/deliverySettings");
  },

  async getDeliverySlots(): Promise<DeliverySlot[]> {
    const settings = await this.getBusinessSettings();
    const slotNames = parseCommaSeparatedSetting(settings["deliverySlots"]);
    if (slotNames.length > 0) {
      return slotNames.map((title, index) => ({
        id: index === 0 ? "slot_std_morning" : `slot_std_${index + 1}`,
        type: "standard" as const,
        title,
        subtitle: "Admin configured delivery window",
        charge: numberSetting(
          settings,
          ["standardDeliveryFee"],
          LEGACY_CHECKOUT_DEFAULTS.standardCharge,
        ),
      }));
    }
    return apiClient.get<DeliverySlot[]>("/deliverySlots");
  },

  async getStoreInfo(): Promise<StoreInfo> {
    const settings = await this.getBusinessSettings();
    const coordinates = settings["storeCoordinates"] as
      | Record<string, unknown>
      | undefined;
    const numberSetting = (keys: string[], fallback: number): number => {
      for (const key of keys) {
        const value = Number(settings[key] ?? coordinates?.[key]);
        if (Number.isFinite(value) && value > 0) return value;
      }
      return fallback;
    };
    const stringSetting = (keys: string[], fallback: string): string => {
      for (const key of keys) {
        const value = settings[key];
        if (typeof value === "string" && value.trim()) return value.trim();
      }
      return fallback;
    };

    // Admin-managed businessSettings is the source of truth. Fill optional
    // fields the admin document does not define from established store defaults.
    return {
      ...DEFAULT_STORE_INFO,
      storeName: stringSetting(["storeName", "businessName"], DEFAULT_STORE_INFO.storeName),
      tagline: stringSetting(["tagline"], DEFAULT_STORE_INFO.tagline),
      phone: stringSetting(["storePhone", "phone", "contactPhone"], DEFAULT_STORE_INFO.phone),
      whatsapp: stringSetting(["whatsapp", "whatsappNumber"], DEFAULT_STORE_INFO.whatsapp),
      email: stringSetting(["storeEmail", "email", "contactEmail"], DEFAULT_STORE_INFO.email),
      centerLat: numberSetting(["centerLat", "lat"], DEFAULT_STORE_INFO.centerLat),
      centerLng: numberSetting(["centerLng", "lng"], DEFAULT_STORE_INFO.centerLng),
      locationName: stringSetting(
        ["locationName", "storeLocationName"],
        getDistrictFromStoreAddress(
          String(settings["storeAddress"] || "")
        ) || DEFAULT_STORE_INFO.locationName
      ),
      maxRadiusKm: numberSetting(
        ["maxRadiusKm", "deliveryRadiusKm", "deliveryRadius"],
        DEFAULT_STORE_INFO.maxRadiusKm
      ),
      coinValueInRupees: numberSetting(
        ["smartCoinRedemptionValue", "coinValueInRupees", "smartCoinValueInRupees"],
        DEFAULT_STORE_INFO.coinValueInRupees
      ),
      vipSpendingThreshold: numberSetting(
        ["vipSpendingThreshold", "vipThreshold"],
        DEFAULT_STORE_INFO.vipSpendingThreshold
      ),
      minOrderForFreeDelivery: numberSetting(
        [
          "minOrderForFreeDelivery",
          "freeDeliveryThreshold",
          "standardFreeThreshold",
        ],
        0
      ),
    };
  },

  /** Reads checkout policy from businessSettings and preserves legacy express-rate settings. */
  async getLegacyCheckoutSettings(): Promise<LegacyCheckoutSettings> {
    const [business, delivery, expressTimes, expressAuto] = await Promise.all([
      this.getBusinessSettings(),
      readLegacySetting("DeliverySettings").catch(() => null),
      readLegacySetting("ExpressTimeSlots").catch(() => null),
      readLegacySetting("ExpressAutoThreshold").catch(() => null),
    ]);

    return {
      standardFreeThreshold: finiteSetting(
        business["freeDeliveryThreshold"] ?? delivery?.["standardFreeThreshold"],
        LEGACY_CHECKOUT_DEFAULTS.standardFreeThreshold,
      ),
      standardCharge: finiteSetting(
        business["standardDeliveryFee"] ?? delivery?.["standardCharge"],
        LEGACY_CHECKOUT_DEFAULTS.standardCharge,
      ),
      expressFreeThreshold: finiteSetting(
        delivery?.["expressFreeThreshold"],
        LEGACY_CHECKOUT_DEFAULTS.expressFreeThreshold,
      ),
      expressCharge: finiteSetting(
        delivery?.["expressCharge"],
        LEGACY_CHECKOUT_DEFAULTS.expressCharge,
      ),
      expressStartHour: finiteSetting(
        expressTimes?.["startHour"],
        LEGACY_CHECKOUT_DEFAULTS.expressStartHour,
      ),
      expressEndHour: finiteSetting(
        expressTimes?.["endHour"],
        LEGACY_CHECKOUT_DEFAULTS.expressEndHour,
      ),
      expressAutoThreshold: finiteSetting(
        expressAuto?.["threshold"] ?? expressAuto?.["value"],
        LEGACY_CHECKOUT_DEFAULTS.expressAutoThreshold,
      ),
      coinValueInRupees: finiteSetting(
        business["smartCoinRedemptionValue"],
        LEGACY_CHECKOUT_DEFAULTS.coinValueInRupees,
      ),
      smartCoinEarnRate: finiteSetting(
        business["smartCoinEarnRate"],
        LEGACY_CHECKOUT_DEFAULTS.smartCoinEarnRate,
      ),
      maxCoinRedemptionPercent: redemptionPercentSetting(
        business["maxCoinRedemptionPercent"],
        LEGACY_CHECKOUT_DEFAULTS.maxCoinRedemptionPercent,
      ),
      minCoinsToRedeem: finiteSetting(
        business["minCoinsToRedeem"],
        LEGACY_CHECKOUT_DEFAULTS.minCoinsToRedeem,
      ),
      coinValidityMonths: finiteSetting(
        business["coinValidityMonths"],
        LEGACY_CHECKOUT_DEFAULTS.coinValidityMonths,
      ),
      minimumOrderAmount: finiteSetting(
        business["minimumOrderAmount"],
        LEGACY_CHECKOUT_DEFAULTS.minimumOrderAmount,
      ),
      maxItemsPerOrder: finiteSetting(
        business["maxItemsPerOrder"],
        LEGACY_CHECKOUT_DEFAULTS.maxItemsPerOrder,
      ),
      codAllowed: business["codAllowed"] !== false,
      maxCodAmount: finiteSetting(
        business["maxCodAmount"],
        LEGACY_CHECKOUT_DEFAULTS.maxCodAmount,
      ),
      orderCutoffTime: textSetting(
        business,
        ["orderCutoffTime"],
        LEGACY_CHECKOUT_DEFAULTS.orderCutoffTime,
      ),
    };
  },

  async getLegacyCoinValue(): Promise<number> {
    const business = await this.getBusinessSettings();
    return finiteSetting(
      business["smartCoinRedemptionValue"],
      LEGACY_CHECKOUT_DEFAULTS.coinValueInRupees,
    );
  },

  /**
   * Combines admin-managed store identity and neighborhood zones with optional
   * legacy coordinates used only when the admin document has no zone list.
   */
  async getDeliveryConfiguration(): Promise<StoreDeliverySettings> {
    try {
      const businessSettings = await this.getBusinessSettings();
      const deliveryDoc = await readLegacySetting("delivery").catch(() => null);

      if (businessSettings || deliveryDoc) {
        const storeAddress = textSetting(
          businessSettings,
          ["storeAddress"],
          String(deliveryDoc?.["storeAddress"] || DEFAULT_DELIVERY_SETTINGS.storeAddress),
        );
        const radius = Number(
          deliveryDoc?.["deliveryRadiusKm"] ??
          deliveryDoc?.["radiusKm"] ??
          deliveryDoc?.["deliveryRadius"] ??
          deliveryDoc?.["maxRadiusKm"]
        );

        const storeLat = Number(
          (deliveryDoc?.["storeCoordinates"] as any)?.lat ??
          (deliveryDoc?.["storeLocation"] as any)?.latitude ??
          deliveryDoc?.["storeLat"] ??
          DEFAULT_DELIVERY_SETTINGS.storeCoordinates.lat
        );

        const storeLng = Number(
          (deliveryDoc?.["storeCoordinates"] as any)?.lng ??
          (deliveryDoc?.["storeLocation"] as any)?.longitude ??
          deliveryDoc?.["storeLng"] ??
          DEFAULT_DELIVERY_SETTINGS.storeCoordinates.lng
        );

        return {
          deliveryEnabled: deliveryDoc?.["deliveryEnabled"] !== false,
          deliveryZones: parseCommaSeparatedSetting(businessSettings["deliveryZones"]),
          deliveryRadiusKm: Number.isFinite(radius) && radius > 0 ? radius : DEFAULT_DELIVERY_SETTINGS.deliveryRadiusKm,
          storeCoordinates: {
            lat: Number.isFinite(storeLat) ? storeLat : DEFAULT_DELIVERY_SETTINGS.storeCoordinates.lat,
            lng: Number.isFinite(storeLng) ? storeLng : DEFAULT_DELIVERY_SETTINGS.storeCoordinates.lng,
          },
          storeName: textSetting(businessSettings, ["storeName"], String(deliveryDoc?.["storeName"] || DEFAULT_DELIVERY_SETTINGS.storeName)),
          storeAddress,
          serviceAreaDistrict: getDistrictFromStoreAddress(storeAddress) || String(deliveryDoc?.["serviceAreaDistrict"] || DEFAULT_DELIVERY_SETTINGS.serviceAreaDistrict),
          serviceAreaState: textSetting(businessSettings, ["state"], String(deliveryDoc?.["serviceAreaState"] || DEFAULT_DELIVERY_SETTINGS.serviceAreaState)),
          minOrderValue: finiteSetting(businessSettings["minimumOrderAmount"], Number(deliveryDoc?.["minOrderValue"] ?? 0)),
        };
      }
    } catch (err) {
      console.warn("[settingsService] Error fetching Settings/delivery:", err);
    }

    return { ...DEFAULT_DELIVERY_SETTINGS };
  },

  /**
   * Reads dynamic store payment configuration from Firestore `Settings/payment`.
   */
  async getPaymentConfiguration(): Promise<StorePaymentSettings> {
    const businessSettings = await this.getBusinessSettings();
    try {
      const paymentDoc = await readLegacySetting("payment").catch(() => null);

      if (businessSettings || paymentDoc) {
        return {
          upiEnabled: paymentDoc?.["upiEnabled"] !== false,
          merchantUpiId: textSetting(businessSettings, ["upiId"], String(paymentDoc?.["merchantUpiId"] || paymentDoc?.["upiId"] || DEFAULT_PAYMENT_SETTINGS.merchantUpiId)),
          merchantName: textSetting(businessSettings, ["storeName"], String(paymentDoc?.["merchantName"] || DEFAULT_PAYMENT_SETTINGS.merchantName)),
          codEnabled: businessSettings["codAllowed"] !== false,
          maxCodAmount: finiteSetting(
            businessSettings["maxCodAmount"],
            DEFAULT_PAYMENT_SETTINGS.maxCodAmount
          ),
          ...(paymentDoc?.["qrCodeUrl"] ? { qrCodeUrl: String(paymentDoc["qrCodeUrl"]) } : {}),
        };
      }
    } catch (err) {
      console.warn("[settingsService] Error fetching Settings/payment:", err);
    }

    return { ...DEFAULT_PAYMENT_SETTINGS };
  },
};


