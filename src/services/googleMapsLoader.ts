export interface GoogleLatLng {
  lat(): number;
  lng(): number;
}

export interface GoogleMapMouseEvent {
  latLng?: GoogleLatLng | null;
}

export interface GoogleMapListener {
  remove(): void;
}

export interface GoogleMapInstance {
  setCenter(center: { lat: number; lng: number }): void;
  setZoom(zoom: number): void;
}

export interface GoogleMarkerInstance {
  setMap(map: GoogleMapInstance | null): void;
  setPosition(position: { lat: number; lng: number }): void;
  addListener(eventName: string, handler: (event?: GoogleMapMouseEvent) => void): GoogleMapListener;
}

export interface GoogleGeocoderAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface GoogleGeocoderResult {
  formatted_address: string;
  address_components: GoogleGeocoderAddressComponent[];
}

export interface GoogleNearbyPlace {
  displayName?: string;
  formattedAddress?: string;
  googleMapsURI?: string;
  types?: string[];
}

export interface GooglePlacesLibrary {
  Place: {
    searchNearby: (request: {
      fields: string[];
      locationRestriction: { center: { lat: number; lng: number }; radius: number };
      includedTypes: string[];
      maxResultCount: number;
      rankPreference: "DISTANCE";
    }) => Promise<{ places: GoogleNearbyPlace[] }>;
  };
}

export interface GoogleMapsApi {
  maps: {
    importLibrary: (libraryName: string) => Promise<unknown>;
    Map: new (
      element: HTMLElement,
      options: {
        center: { lat: number; lng: number };
        zoom: number;
        gestureHandling: string;
        mapTypeControl: boolean;
        streetViewControl: boolean;
        fullscreenControl: boolean;
        clickableIcons: boolean;
      },
    ) => GoogleMapInstance;
    Marker: new (options: {
      map: GoogleMapInstance;
      position: { lat: number; lng: number };
      draggable: boolean;
      title: string;
    }) => GoogleMarkerInstance;
    Geocoder: new () => {
      geocode: (
        request: { location: { lat: number; lng: number } },
        callback: (results: GoogleGeocoderResult[] | null, status: string) => void,
      ) => void;
    };
    event: {
      addListener: (
        instance: GoogleMapInstance,
        eventName: string,
        handler: (event?: GoogleMapMouseEvent) => void,
      ) => GoogleMapListener;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleMapsApi;
  }
}

let googleMapsPromise: Promise<GoogleMapsApi> | null = null;

/** Loads the Google Maps JavaScript API once per page when a browser key is configured. */
export function loadGoogleMapsApi(): Promise<GoogleMapsApi> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey) return Promise.reject(new Error("Google Maps API key is not configured."));
  if (window.google?.maps) return Promise.resolve(window.google);
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise<GoogleMapsApi>((resolve, reject) => {
    const existingScript = document.getElementById("google-maps-javascript-api") as HTMLScriptElement | null;
    const script = existingScript ?? document.createElement("script");

    const onLoad = () => {
      if (window.google?.maps) resolve(window.google);
      else reject(new Error("Google Maps loaded without its API."));
    };
    const onError = () => reject(new Error("Google Maps could not be loaded."));

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });

    if (!existingScript) {
      script.id = "google-maps-javascript-api";
      script.async = true;
      script.defer = true;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&language=en&region=IN`;
      document.head.appendChild(script);
    } else if (window.google?.maps) {
      onLoad();
    }
  }).catch((error: unknown) => {
    googleMapsPromise = null;
    throw error;
  });

  return googleMapsPromise;
}

/** Retrieves a short, distance-ranked list of mapped places around the selected pin. */
export async function searchNearbyGooglePlaces(
  coordinates: { lat: number; lng: number },
): Promise<GoogleNearbyPlace[]> {
  const google = await loadGoogleMapsApi();
  const placesLibrary = (await google.maps.importLibrary("places")) as GooglePlacesLibrary;
  const request = {
    fields: ["displayName", "formattedAddress", "googleMapsURI", "types"],
    locationRestriction: { center: coordinates, radius: 500 },
    includedTypes: [
      "store",
      "supermarket",
      "pharmacy",
      "hospital",
      "school",
      "restaurant",
      "bank",
      "shopping_mall",
      "hindu_temple",
      "church",
      "mosque",
      "corporate_office",
      "bus_station",
      "train_station",
    ],
    maxResultCount: 8,
    rankPreference: "DISTANCE" as const,
  };

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await placesLibrary.Place.searchNearby(request);
      return result.places;
    } catch (error) {
      const isTemporaryUnavailable = String(error).includes("UNAVAILABLE");
      if (!isTemporaryUnavailable || attempt === 1) throw error;
      await new Promise((resolve) => window.setTimeout(resolve, 800));
    }
  }

  return [];
}
