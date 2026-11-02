export const STORE_COORDINATES = {
  lat: 11.459319,
  lng: 77.333565,
  maxRadiusKm: 6.0,
  deliveryRadiusKm: 50.0,
  storeName: "Sri Amman Smart Store",
  locationName: "Gobichettipalayam, Erode",
  storeAddress: "Kasipalayam, Gobichettipalayam, Erode, Tamil Nadu 638454",
  serviceAreaDistrict: "Erode",
  serviceAreaState: "Tamil Nadu",
  serviceAreaPincodePrefix: "638",
};

/**
 * Calculates Great-Circle distance between two coordinates in kilometers using Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number = STORE_COORDINATES.lat,
  lon2: number = STORE_COORDINATES.lng
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export function isWithinDeliveryGeofence(
  lat: number,
  lng: number,
  maxRadiusKm: number = STORE_COORDINATES.maxRadiusKm,
  storeLat: number = STORE_COORDINATES.lat,
  storeLng: number = STORE_COORDINATES.lng
): { eligible: boolean; distanceKm: number } {
  const distanceKm = calculateDistanceKm(lat, lng, storeLat, storeLng);
  return {
    eligible: distanceKm <= maxRadiusKm,
    distanceKm,
  };
}

export interface DeliveryServiceabilityResult {
  eligible: boolean;
  distanceKm: number;
  maxRadiusKm: number;
  reason?: string;
  storeName: string;
  storeAddress: string;
}

/**
 * Validates delivery serviceability against dynamic store configuration (50 km radius, Erode, Tamil Nadu).
 */
export function validateDeliveryServiceability(
  address: {
    lat?: number;
    lng?: number;
    city?: string;
    district?: string;
    state?: string;
    pincode?: string;
  },
  options: {
    maxRadiusKm?: number;
    storeLat?: number;
    storeLng?: number;
    storeName?: string;
    storeAddress?: string;
    serviceAreaDistrict?: string;
    serviceAreaState?: string;
  } = {}
): DeliveryServiceabilityResult {
  const maxRadiusKm = options.maxRadiusKm ?? STORE_COORDINATES.deliveryRadiusKm;
  const storeLat = options.storeLat ?? STORE_COORDINATES.lat;
  const storeLng = options.storeLng ?? STORE_COORDINATES.lng;
  const storeName = options.storeName ?? STORE_COORDINATES.storeName;
  const storeAddress = options.storeAddress ?? STORE_COORDINATES.storeAddress;
  const targetDistrict = options.serviceAreaDistrict ?? STORE_COORDINATES.serviceAreaDistrict;

  // 1. If coordinates are provided, validate distance via Haversine formula
  if (typeof address.lat === "number" && typeof address.lng === "number" && (address.lat !== 0 || address.lng !== 0)) {
    const distanceKm = calculateDistanceKm(address.lat, address.lng, storeLat, storeLng);
    if (distanceKm > maxRadiusKm) {
      return {
        eligible: false,
        distanceKm,
        maxRadiusKm,
        reason: `Delivery is not available for this address. We deliver up to ${maxRadiusKm} km from our store in Gobichettipalayam, Erode. (Your location is approximately ${distanceKm} km away).`,
        storeName,
        storeAddress,
      };
    }
    return {
      eligible: true,
      distanceKm,
      maxRadiusKm,
      storeName,
      storeAddress,
    };
  }

  // 2. If coordinates are not provided, validate service area (district/state/pincode)
  const pincode = (address.pincode || "").trim();
  const city = (address.city || "").trim().toLowerCase();
  const district = (address.district || "").trim().toLowerCase();
  const state = (address.state || "").trim().toLowerCase();

  // Known Erode pincode prefix is 638
  const isErodePincode = pincode.startsWith("638");
  const isErodeDistrict =
    district.includes("erode") ||
    city.includes("erode") ||
    city.includes("gobichettipalayam") ||
    city.includes("bhavani") ||
    city.includes("perundurai") ||
    city.includes("sathyamangalam") ||
    city.includes("anthiyur");

  // Check state if provided
  if (state && !state.includes("tamil") && !state.includes("tn")) {
    return {
      eligible: false,
      distanceKm: 0,
      maxRadiusKm,
      reason: `Deliveries are currently restricted to ${targetDistrict} district and up to ${maxRadiusKm} km from our store in Gobichettipalayam.`,
      storeName,
      storeAddress,
    };
  }

  if (isErodePincode || isErodeDistrict || (!pincode && !city && !district)) {
    return {
      eligible: true,
      distanceKm: 0,
      maxRadiusKm,
      storeName,
      storeAddress,
    };
  }

  return {
    eligible: false,
    distanceKm: 0,
    maxRadiusKm,
    reason: `Deliveries are currently restricted to ${targetDistrict} district and up to ${maxRadiusKm} km from our store in Gobichettipalayam.`,
    storeName,
    storeAddress,
  };
}


