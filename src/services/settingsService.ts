import { apiClient } from "./apiClient";
import type { DeliverySettings, DeliverySlot, StoreInfo } from "../types";
import { STORE_COORDINATES } from "../lib/haversine";

export interface StoreDeliverySettings {
  deliveryEnabled: boolean;
  deliveryRadiusKm: number;
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
  qrCodeUrl?: string;
}

export const DEFAULT_PAYMENT_SETTINGS: StorePaymentSettings = {
  upiEnabled: true,
  merchantUpiId: "sriammansmartstore@okaxis",
  merchantName: "Sri Amman Smart Store",
  codEnabled: true,
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
}

export const LEGACY_CHECKOUT_DEFAULTS: LegacyCheckoutSettings = {
  standardFreeThreshold: 500,
  standardCharge: 49,
  expressFreeThreshold: 1000,
  expressCharge: 99,
  expressStartHour: 6,
  expressEndHour: 21,
  expressAutoThreshold: 4000,
  // Keep the currently approved conversion rate when the legacy setting is absent.
  coinValueInRupees: 0.05,
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
  // Legacy behavior makes delivery free only when subtotal is strictly greater than threshold.
  return subtotal > threshold ? 0 : charge;
}

function finiteSetting(
  value: unknown,
  fallback: number,
): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
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
  async getDeliverySettings(): Promise<DeliverySettings> {
    return apiClient.get<DeliverySettings>("/deliverySettings");
  },

  async getDeliverySlots(): Promise<DeliverySlot[]> {
    return apiClient.get<DeliverySlot[]>("/deliverySlots");
  },

  async getStoreInfo(): Promise<StoreInfo> {
    return apiClient.get<StoreInfo>("/storeInfo");
  },

  /** Reads the legacy `Settings/{documentId}` checkout configuration documents. */
  async getLegacyCheckoutSettings(): Promise<LegacyCheckoutSettings> {
    const [delivery, expressTimes, expressAuto, coinValue] = await Promise.all([
      readLegacySetting("DeliverySettings"),
      readLegacySetting("ExpressTimeSlots"),
      readLegacySetting("ExpressAutoThreshold"),
      readLegacySetting("CoinValue"),
    ]);

    return {
      standardFreeThreshold: finiteSetting(
        delivery?.["standardFreeThreshold"],
        LEGACY_CHECKOUT_DEFAULTS.standardFreeThreshold,
      ),
      standardCharge: finiteSetting(
        delivery?.["standardCharge"],
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
        coinValue?.["value"] ?? coinValue?.["coinValue"] ?? coinValue?.["text"],
        LEGACY_CHECKOUT_DEFAULTS.coinValueInRupees,
      ),
    };
  },

  async getLegacyCoinValue(): Promise<number> {
    const setting = await readLegacySetting("CoinValue");
    return finiteSetting(
      setting?.["value"] ?? setting?.["coinValue"] ?? setting?.["text"],
      LEGACY_CHECKOUT_DEFAULTS.coinValueInRupees,
    );
  },

  /**
   * Reads dynamic store delivery configuration from Firestore `Settings/delivery`
   * with fallback to defaults (50 km radius, Gobichettipalayam center, Erode district).
   */
  async getDeliveryConfiguration(): Promise<StoreDeliverySettings> {
    try {
      const deliveryDoc =
        (await readLegacySetting("delivery")) ||
        (await readLegacySetting("Delivery")) ||
        (await readLegacySetting("DeliverySettings"));

      if (deliveryDoc) {
        const radius = Number(
          deliveryDoc["deliveryRadiusKm"] ??
          deliveryDoc["radiusKm"] ??
          deliveryDoc["deliveryRadius"] ??
          deliveryDoc["maxRadiusKm"]
        );

        const storeLat = Number(
          (deliveryDoc["storeCoordinates"] as any)?.lat ??
          (deliveryDoc["storeLocation"] as any)?.latitude ??
          deliveryDoc["storeLat"] ??
          DEFAULT_DELIVERY_SETTINGS.storeCoordinates.lat
        );

        const storeLng = Number(
          (deliveryDoc["storeCoordinates"] as any)?.lng ??
          (deliveryDoc["storeLocation"] as any)?.longitude ??
          deliveryDoc["storeLng"] ??
          DEFAULT_DELIVERY_SETTINGS.storeCoordinates.lng
        );

        return {
          deliveryEnabled: deliveryDoc["deliveryEnabled"] !== false,
          deliveryRadiusKm: Number.isFinite(radius) && radius > 0 ? radius : DEFAULT_DELIVERY_SETTINGS.deliveryRadiusKm,
          storeCoordinates: {
            lat: Number.isFinite(storeLat) ? storeLat : DEFAULT_DELIVERY_SETTINGS.storeCoordinates.lat,
            lng: Number.isFinite(storeLng) ? storeLng : DEFAULT_DELIVERY_SETTINGS.storeCoordinates.lng,
          },
          storeName: String(deliveryDoc["storeName"] || DEFAULT_DELIVERY_SETTINGS.storeName),
          storeAddress: String(deliveryDoc["storeAddress"] || DEFAULT_DELIVERY_SETTINGS.storeAddress),
          serviceAreaDistrict: String(deliveryDoc["serviceAreaDistrict"] || DEFAULT_DELIVERY_SETTINGS.serviceAreaDistrict),
          serviceAreaState: String(deliveryDoc["serviceAreaState"] || DEFAULT_DELIVERY_SETTINGS.serviceAreaState),
          minOrderValue: Number(deliveryDoc["minOrderValue"] ?? 0),
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
    try {
      const paymentDoc =
        (await readLegacySetting("payment")) ||
        (await readLegacySetting("Payment")) ||
        (await readLegacySetting("PaymentSettings"));

      if (paymentDoc) {
        return {
          upiEnabled: paymentDoc["upiEnabled"] !== false,
          merchantUpiId: String(paymentDoc["merchantUpiId"] || paymentDoc["upiId"] || DEFAULT_PAYMENT_SETTINGS.merchantUpiId),
          merchantName: String(paymentDoc["merchantName"] || DEFAULT_PAYMENT_SETTINGS.merchantName),
          codEnabled: paymentDoc["codEnabled"] !== false,
          ...(paymentDoc["qrCodeUrl"] ? { qrCodeUrl: String(paymentDoc["qrCodeUrl"]) } : {}),
        };
      }
    } catch (err) {
      console.warn("[settingsService] Error fetching Settings/payment:", err);
    }

    return { ...DEFAULT_PAYMENT_SETTINGS };
  },
};


