import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { toast } from "sonner";
import { STORE_COORDINATES } from "../../lib/haversine";
import { reverseGeocodeCoordinates, type ResolvedPostalAddress } from "../../services/reverseGeocodingService";
import {
  loadGoogleMapsApi,
  searchNearbyGooglePlaces,
  type GoogleMapInstance,
  type GoogleMapListener,
  type GoogleMarkerInstance,
  type GoogleNearbyPlace,
} from "../../services/googleMapsLoader";

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

interface LocationPinPickerProps {
  position: LocationCoordinates | null;
  onChange: (position: LocationCoordinates) => void;
  accuracyMeters?: number | null;
}

const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function LocationPinPicker({ position, onChange, accuracyMeters }: LocationPinPickerProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const googleMapRef = useRef<GoogleMapInstance | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const googleMarkerRef = useRef<GoogleMarkerInstance | null>(null);
  const placePinRef = useRef<((position: LocationCoordinates) => void) | null>(null);
  const onChangeRef = useRef(onChange);
  const positionRef = useRef(position);
  const [isLocating, setIsLocating] = useState(false);
  const [mapProvider, setMapProvider] = useState<"google" | "osm" | "osm-fallback" | null>(null);
  const [locationAccuracyMeters, setLocationAccuracyMeters] = useState<number | null>(accuracyMeters ?? null);
  const [addressPreview, setAddressPreview] = useState<ResolvedPostalAddress | null>(null);
  const [isResolvingPreview, setIsResolvingPreview] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState<GoogleNearbyPlace[]>([]);
  const [nearbyPlacesState, setNearbyPlacesState] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");

  positionRef.current = position;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setLocationAccuracyMeters(accuracyMeters ?? null);
  }, [accuracyMeters]);

  useEffect(() => {
    let cancelled = false;
    let resizeFrame: number | undefined;
    let createdMap: Leaflet.Map | null = null;
    let googleListeners: GoogleMapListener[] = [];
    let googleMapFailed = false;

    const initializeMap = async () => {
      const initialPosition = positionRef.current ?? {
        lat: STORE_COORDINATES.lat,
        lng: STORE_COORDINATES.lng,
      };

      if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()) {
        try {
          const google = await loadGoogleMapsApi();
          if (cancelled || !mapElementRef.current) return;

          const map = new google.maps.Map(mapElementRef.current, {
            center: initialPosition,
            zoom: 18,
            gestureHandling: "greedy",
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            clickableIcons: true,
          });
          googleMapRef.current = map;

          const placePin = (nextPosition: LocationCoordinates) => {
            if (googleMarkerRef.current) {
              googleMarkerRef.current.setPosition(nextPosition);
            } else {
              googleMarkerRef.current = new google.maps.Marker({
                map,
                position: nextPosition,
                draggable: true,
                title: "Delivery location",
              });
              googleListeners.push(
                googleMarkerRef.current.addListener("dragend", (event) => {
                  const point = event?.latLng;
                  if (point) onChangeRef.current({ lat: point.lat(), lng: point.lng() });
                }),
              );
            }
          };
          placePinRef.current = placePin;

          if (positionRef.current) placePin(positionRef.current);
          googleListeners.push(
            google.maps.event.addListener(map, "click", (event) => {
              const point = event?.latLng;
              if (!point) return;
              const coordinates = { lat: point.lat(), lng: point.lng() };
              placePin(coordinates);
              onChangeRef.current(coordinates);
            }),
          );
          setMapProvider("google");
          return;
        } catch (error) {
          console.error("Google Maps failed to load; using OpenStreetMap:", error);
          if (cancelled) return;
          googleMapFailed = true;
        }
      }

      const L = await import("leaflet");
      if (cancelled || !mapElementRef.current) return;

      const map = L.map(mapElementRef.current, { scrollWheelZoom: false }).setView(
        [initialPosition.lat, initialPosition.lng],
        18,
      );
      createdMap = map;
      mapRef.current = map;

      const tileUrl = import.meta.env.VITE_OSM_TILE_URL || DEFAULT_TILE_URL;
      L.tileLayer(tileUrl, {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      }).addTo(map);

      const markerIcon = L.divIcon({
        className: "location-pin-marker",
        html: '<span class="material-symbols-outlined" aria-hidden="true">location_on</span>',
        iconSize: [36, 42],
        iconAnchor: [18, 38],
      });
      const placePin = (position: LocationCoordinates) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([position.lat, position.lng]);
        } else {
          markerRef.current = L.marker([position.lat, position.lng], {
            icon: markerIcon,
            draggable: true,
          }).addTo(map);
          markerRef.current.on("dragend", () => {
            const coordinates = markerRef.current?.getLatLng();
            if (coordinates) {
              onChangeRef.current({ lat: coordinates.lat, lng: coordinates.lng });
            }
          });
        }
      };
      placePinRef.current = placePin;

      if (positionRef.current) placePin(positionRef.current);
      map.on("click", (event: Leaflet.LeafletMouseEvent) => {
        const coordinates = { lat: event.latlng.lat, lng: event.latlng.lng };
        placePin(coordinates);
        onChangeRef.current(coordinates);
      });

      resizeFrame = window.requestAnimationFrame(() => map.invalidateSize());
      setMapProvider(googleMapFailed ? "osm-fallback" : "osm");
    };

    void initializeMap().catch((error: unknown) => {
      if (!cancelled) {
        console.error("Failed to load the delivery location map:", error);
        toast.error("The map could not load. Please try again.");
      }
    });

    return () => {
      cancelled = true;
      if (resizeFrame !== undefined) window.cancelAnimationFrame(resizeFrame);
      googleListeners.forEach((listener) => listener.remove());
      googleMarkerRef.current?.setMap(null);
      googleMapRef.current = null;
      googleMarkerRef.current = null;
      createdMap?.remove();
      mapRef.current = null;
      markerRef.current = null;
      placePinRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!position || !mapProvider) {
      setAddressPreview(null);
      setNearbyPlaces([]);
      setNearbyPlacesState("idle");
      setIsResolvingPreview(false);
      return;
    }

    let cancelled = false;
    const pin = { ...position };
    setAddressPreview(null);
    setIsResolvingPreview(true);
    setNearbyPlaces([]);
    setNearbyPlacesState(mapProvider === "google" ? "loading" : "unavailable");

    const timer = window.setTimeout(() => {
      void reverseGeocodeCoordinates(pin)
        .then((address) => {
          if (!cancelled) setAddressPreview(address);
        })
        .catch(() => {
          if (!cancelled) setAddressPreview(null);
        })
        .finally(() => {
          if (!cancelled) setIsResolvingPreview(false);
        });

      if (mapProvider === "google") {
        void searchNearbyGooglePlaces(pin)
          .then((places) => {
            if (!cancelled) {
              setNearbyPlaces(places);
              setNearbyPlacesState("ready");
            }
          })
          .catch(() => {
            // Nearby Search can return a transient 503; keep the map and address picker usable.
            if (!cancelled) setNearbyPlacesState("unavailable");
          });
      }
    }, 650);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [position, mapProvider]);

  useEffect(() => {
    if (!position) return;
    if (googleMapRef.current) {
      googleMapRef.current.setCenter(position);
      googleMapRef.current.setZoom(18);
    } else if (mapRef.current) {
      mapRef.current.setView([position.lat, position.lng]);
    }
    placePinRef.current?.(position);
  }, [position]);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("This browser does not provide location access.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const coordinates = { lat: coords.latitude, lng: coords.longitude };
        googleMapRef.current?.setCenter(coordinates);
        googleMapRef.current?.setZoom(18);
        mapRef.current?.setView([coordinates.lat, coordinates.lng], 18);
        placePinRef.current?.(coordinates);
        onChange(coordinates);
        setLocationAccuracyMeters(coords.accuracy);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        toast.error(
          error.code === error.PERMISSION_DENIED
            ? "Allow location access to use your current location."
            : "Could not get your location. Move the map pin to set it manually.",
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-on-surface">Pin your delivery location</p>
          <p className="text-[10px] text-on-surface-variant">
            Tap the map or drag the pin. Google Maps shows nearby places and street names.
          </p>
        </div>
        <button
          type="button"
          onClick={useCurrentLocation}
          disabled={isLocating}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-2 text-[10px] font-bold text-white disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[15px]">my_location</span>
          {isLocating ? "Locating…" : "Use current location"}
        </button>
      </div>
      <div
        ref={mapElementRef}
        role="application"
        aria-label="Map for selecting a delivery location"
        className="h-56 w-full overflow-hidden rounded-xl border border-outline-variant/30"
      />
      <p className="text-[10px] text-on-surface-variant">
        {mapProvider === "google"
          ? "Google Maps · Click a place to see its name and details."
        : mapProvider === "osm"
            ? "OpenStreetMap · Add VITE_GOOGLE_MAPS_API_KEY to enable Google Maps."
            : mapProvider === "osm-fallback"
              ? "Google Maps could not load; showing OpenStreetMap instead."
            : "Loading map…"}
      </p>
      {position ? (
        <p className="text-[10px] text-on-surface-variant">
          Pin: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </p>
      ) : (
        <p className="text-[10px] text-on-surface-variant">
          Choose a point on the map to save exact coordinates.
        </p>
      )}
      {locationAccuracyMeters !== null && (
        <p className={`text-[10px] ${locationAccuracyMeters > 1000 ? "font-semibold text-error" : "text-on-surface-variant"}`}>
          Device reported accuracy: +/-{Math.round(locationAccuracyMeters)} m.
          {locationAccuracyMeters > 1000 && " This fix may be approximate; move the pin to your actual address."}
        </p>
      )}
      {position && (
        <div className="rounded-lg border border-outline-variant/30 bg-surface-container-low p-2.5 text-[10px]">
          <p className="mb-1 font-bold text-on-surface">Pinned address</p>
          {isResolvingPreview && !addressPreview ? (
            <p className="text-on-surface-variant">Finding street and area...</p>
          ) : addressPreview ? (
            <div className="space-y-0.5 text-on-surface-variant">
              {addressPreview.formattedAddress && <p className="font-medium text-on-surface">{addressPreview.formattedAddress}</p>}
              {(addressPreview.road || addressPreview.street) && <p><span className="font-semibold">Street:</span> {addressPreview.road || addressPreview.street}</p>}
              {addressPreview.area && <p><span className="font-semibold">Area:</span> {addressPreview.area}</p>}
              {addressPreview.city && <p><span className="font-semibold">City:</span> {addressPreview.city}</p>}
              {addressPreview.pincode && <p><span className="font-semibold">PIN:</span> {addressPreview.pincode}</p>}
            </div>
          ) : (
            <p className="text-on-surface-variant">Address details are unavailable for this pin.</p>
          )}
          <div className="mt-2 border-t border-outline-variant/30 pt-2">
            <p className="font-bold text-on-surface">Nearby places <span className="font-normal text-on-surface-variant">(within 500 m)</span></p>
            {nearbyPlacesState === "loading" ? (
              <p className="mt-1 text-on-surface-variant">Searching nearby shops, temples and landmarks...</p>
            ) : nearbyPlacesState === "unavailable" ? (
              <p className="mt-1 text-on-surface-variant">
                {mapProvider === "google"
                  ? "Nearby place search is temporarily unavailable. The map pin and address still work."
                  : "Enable Google Maps and Places API (New) to search nearby places."}
              </p>
            ) : nearbyPlaces.length ? (
              <ul className="mt-1 max-h-28 space-y-1 overflow-y-auto">
                {nearbyPlaces.map((place, index) => {
                  const placeType = place.types?.find((type) => type !== "point_of_interest" && type !== "establishment");
                  const category = placeType === "hindu_temple" || placeType === "church" || placeType === "mosque"
                    ? "Place of worship"
                    : placeType === "corporate_office"
                      ? "Company"
                      : placeType === "store" || placeType === "supermarket"
                        ? "Shop"
                        : placeType?.replaceAll("_", " ") || "Nearby place";
                  return (
                    <li key={`${place.displayName || "place"}-${index}`}>
                      {place.googleMapsURI ? (
                        <a href={place.googleMapsURI} target="_blank" rel="noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
                          {place.displayName || "Nearby place"}
                        </a>
                      ) : (
                        <span className="font-medium text-on-surface">{place.displayName || "Nearby place"}</span>
                      )}
                      <span className="text-on-surface-variant"> - {category}</span>
                      {place.formattedAddress && <p className="pl-2 text-on-surface-variant">{place.formattedAddress}</p>}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-1 text-on-surface-variant">No nearby places were found in Google Maps.</p>
            )}
            {mapProvider === "google" && <p className="mt-1 text-on-surface-variant">Nearby places provided by Google.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
