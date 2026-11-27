import { loadGoogleMapsApi } from "./googleMapsLoader";

export interface ReverseGeocodeCoordinates {
  lat: number;
  lng: number;
}

export interface ResolvedPostalAddress {
  houseNo: string;
  street: string;
  city: string;
  pincode: string;
  road?: string;
  area?: string;
  formattedAddress?: string;
}

interface NominatimReverseResponse {
  display_name?: string;
  address?: Record<string, string | undefined>;
}

let nextRequestAt = 0;
const forwardGeocodeCache = new Map<string, Promise<ReverseGeocodeCoordinates | null>>();

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

async function waitForRequestSlot(): Promise<void> {
  const now = Date.now();
  const scheduledAt = Math.max(now, nextRequestAt);
  nextRequestAt = scheduledAt + 1100;
  const wait = scheduledAt - now;
  if (wait > 0) await delay(wait);
}

function getNominatimBaseUrl(): string {
  return (
    import.meta.env.VITE_NOMINATIM_BASE_URL?.trim().replace(/\/$/, "") ||
    "https://nominatim.openstreetmap.org"
  );
}

/** Reverse-geocodes a user-selected pin; calls are spaced to respect Nominatim's public rate limit. */
export async function reverseGeocodeCoordinates(
  coordinates: ReverseGeocodeCoordinates,
): Promise<ResolvedPostalAddress> {
  if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()) {
    try {
      const google = await loadGoogleMapsApi();
      const result = await new Promise<ResolvedPostalAddress>((resolve, reject) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: coordinates }, (results, status) => {
          const bestResult = results?.[0];
          if (status !== "OK" || !bestResult) {
            reject(new Error(`Google address lookup failed (${status}).`));
            return;
          }

          const component = (type: string) =>
            bestResult.address_components.find((item) => item.types.includes(type))?.long_name || "";
          const road = component("route");
          const neighborhood =
            component("neighborhood") ||
            component("sublocality_level_1") ||
            component("sublocality");
          const city =
            component("locality") ||
            component("postal_town") ||
            component("administrative_area_level_2") ||
            component("administrative_area_level_1");

          resolve({
            houseNo: component("street_number") || component("premise"),
            street: [road, neighborhood].filter(Boolean).join(", ") || bestResult.formatted_address,
            city,
            pincode: component("postal_code"),
            road,
            area: neighborhood,
            formattedAddress: bestResult.formatted_address,
          });
        });
      });
      return result;
    } catch (error) {
      console.warn("Google reverse geocoding failed; falling back to OpenStreetMap:", error);
    }
  }

  await waitForRequestSlot();

  const url = new URL(`${getNominatimBaseUrl()}/reverse`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("zoom", "18");
  url.searchParams.set("lat", String(coordinates.lat));
  url.searchParams.set("lon", String(coordinates.lng));

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("Address lookup failed. Please enter the address manually.");

  const result = (await response.json()) as NominatimReverseResponse;
  const address = result.address;
  if (!address)
    throw new Error("No street address was found at this pin. Please enter it manually.");

  const road =
    address["road"] ||
    address["residential"] ||
    address["pedestrian"] ||
    address["footway"] ||
    address["path"] ||
    "";
  const neighborhood =
    address["neighbourhood"] ||
    address["suburb"] ||
    address["quarter"] ||
    address["city_district"] ||
    "";
  const city =
    address["city"] ||
    address["town"] ||
    address["village"] ||
    address["municipality"] ||
    address["county"] ||
    "";

  return {
    houseNo: address["house_number"] || "",
    street: [road, neighborhood].filter(Boolean).join(", "),
    city,
    pincode: address["postcode"] || "",
    road,
    area: neighborhood,
    formattedAddress: result.display_name || "",
  };
}

/** Geocodes a configured store address once and reuses the result for distance checks. */
export async function geocodeStoreAddress(
  address: string,
): Promise<ReverseGeocodeCoordinates | null> {
  const query = address.trim();
  if (!query) return null;

  const cacheKey = query.toLowerCase();
  const cached = forwardGeocodeCache.get(cacheKey);
  if (cached) return cached;

  const request = (async (): Promise<ReverseGeocodeCoordinates | null> => {
    await waitForRequestSlot();
    const url = new URL(`${getNominatimBaseUrl()}/search`);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", query);

    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return null;

    const results = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const lat = Number(results[0]?.lat);
    const lng = Number(results[0]?.lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  })();

  forwardGeocodeCache.set(cacheKey, request);
  try {
    const result = await request;
    if (!result) forwardGeocodeCache.delete(cacheKey);
    return result;
  } catch {
    forwardGeocodeCache.delete(cacheKey);
    return null;
  }
}

