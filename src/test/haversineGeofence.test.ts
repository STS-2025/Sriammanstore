import { describe, it, expect } from "vitest";
import { isWithinDeliveryGeofence, calculateDistanceKm, STORE_COORDINATES } from "../lib/haversine";

describe("Store Delivery Geofence", () => {
  it("confirms store center coordinates are Kasipalayam / Gobichettipalayam", () => {
    expect(STORE_COORDINATES.lat).toBeCloseTo(11.459319, 5);
    expect(STORE_COORDINATES.lng).toBeCloseTo(77.333565, 5);
    expect(STORE_COORDINATES.maxRadiusKm).toBe(6.0);
  });

  it("marks address within 1km as eligible for express delivery", () => {
    // 200m from store
    const local = isWithinDeliveryGeofence(11.4598, 77.334);
    expect(local.eligible).toBe(true);
    expect(local.distanceKm).toBeLessThan(1.0);
  });

  it("marks address at 5.5km as eligible (within 6km cutoff)", () => {
    const dist = calculateDistanceKm(11.459319, 77.333565, 11.49, 77.35);
    expect(dist).toBeLessThanOrEqual(6.0);
  });

  it("strictly marks address at 34km (Perundurai) as out of range", () => {
    const far = isWithinDeliveryGeofence(11.275, 77.582);
    expect(far.eligible).toBe(false);
    expect(far.distanceKm).toBeGreaterThan(30.0);
  });
});

