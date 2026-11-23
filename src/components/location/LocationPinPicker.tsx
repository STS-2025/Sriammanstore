import { useEffect, useRef, useState } from "react";
import type * as Leaflet from "leaflet";
import { toast } from "sonner";
import { STORE_COORDINATES } from "../../lib/haversine";

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

interface LocationPinPickerProps {
  position: LocationCoordinates | null;
  onChange: (position: LocationCoordinates) => void;
}

const DEFAULT_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export function LocationPinPicker({ position, onChange }: LocationPinPickerProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const placePinRef = useRef<((position: LocationCoordinates) => void) | null>(null);
  const onChangeRef = useRef(onChange);
  const positionRef = useRef(position);
  const [isLocating, setIsLocating] = useState(false);

  positionRef.current = position;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    let resizeFrame: number | undefined;
    let createdMap: Leaflet.Map | null = null;

    const initializeMap = async () => {
      const L = await import("leaflet");
      if (cancelled || !mapElementRef.current) return;

      const initialPosition = positionRef.current ?? {
        lat: STORE_COORDINATES.lat,
        lng: STORE_COORDINATES.lng,
      };
      const map = L.map(mapElementRef.current, { scrollWheelZoom: false }).setView(
        [initialPosition.lat, initialPosition.lng],
        16,
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
      createdMap?.remove();
      mapRef.current = null;
      markerRef.current = null;
      placePinRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!position || !mapRef.current) return;
    mapRef.current.setView([position.lat, position.lng]);
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
        onChange({ lat: coords.latitude, lng: coords.longitude });
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
            Tap the map or drag the pin to adjust it.
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
      {position ? (
        <p className="text-[10px] text-on-surface-variant">
          Pin: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
        </p>
      ) : (
        <p className="text-[10px] text-on-surface-variant">
          Choose a point on the map to save exact coordinates.
        </p>
      )}
    </div>
  );
}
