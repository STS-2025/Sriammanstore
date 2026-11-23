export interface RouteCoordinates {
  lat: number;
  lng: number;
}

export interface DrivingRouteSummary {
  distanceKm: number;
  durationMinutes: number;
}

interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{ distance?: number; duration?: number }>;
}

/** Uses the configured, self-hosted OSRM instance; sends no customer coordinates to a public demo service. */
export async function getDrivingRoute(
  origin: RouteCoordinates,
  destination: RouteCoordinates,
): Promise<DrivingRouteSummary | null> {
  const baseUrl = import.meta.env.VITE_OSRM_BASE_URL?.trim().replace(/\/$/, "");
  if (!baseUrl) return null;

  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
  const response = await fetch(
    `${baseUrl}/route/v1/driving/${coordinates}?overview=false&alternatives=false&steps=false`,
  );
  if (!response.ok) return null;

  const result = (await response.json()) as OsrmRouteResponse;
  const route = result.routes?.[0];
  if (
    result.code !== "Ok" ||
    !route ||
    !Number.isFinite(route.distance) ||
    !Number.isFinite(route.duration)
  ) {
    return null;
  }
  return {
    distanceKm: Math.round((route.distance! / 1000) * 10) / 10,
    durationMinutes: Math.max(1, Math.ceil(route.duration! / 60)),
  };
}
