import { describe, it, expect, vi } from "vitest";
import {
  calculateDistanceKm,
  isWithinDeliveryGeofence,
  validateDeliveryServiceability,
  STORE_COORDINATES,
} from "../lib/haversine";
import {
  settingsService,
  DEFAULT_DELIVERY_SETTINGS,
  type StoreDeliverySettings,
} from "../services/settingsService";
import { addressService } from "../services/addressService";
import { orderService } from "../services/orderService";
import { apiClient } from "../services/apiClient";
import type { Address, CartItem, DeliverySlot, User } from "../types";

describe("Delivery Serviceability (50 km Radius) Integration Test Suite", () => {
  describe("1. Store Coordinates and Haversine Distance Calculations", () => {
    it("uses confirmed store coordinates in Kasipalayam, Gobichettipalayam, Erode", () => {
      expect(STORE_COORDINATES.lat).toBeCloseTo(11.459319, 5);
      expect(STORE_COORDINATES.lng).toBeCloseTo(77.333565, 5);
      expect(STORE_COORDINATES.storeName).toBe("Sri Amman Smart Store");
      expect(STORE_COORDINATES.serviceAreaDistrict).toBe("Erode");
      expect(STORE_COORDINATES.serviceAreaState).toBe("Tamil Nadu");
    });

    it("calculates exact distances from store using Haversine formula", () => {
      // Point at store location: distance should be 0 km
      const storeDistance = calculateDistanceKm(
        STORE_COORDINATES.lat,
        STORE_COORDINATES.lng
      );
      expect(storeDistance).toBe(0);

      // Gobichettipalayam Bus Stand (~1.2 km away)
      const busStandDistance = calculateDistanceKm(11.4534, 77.4365);
      expect(busStandDistance).toBeGreaterThan(1);
      expect(busStandDistance).toBeLessThan(15);

      // Erode Junction (~34 km away)
      const erodeDistance = calculateDistanceKm(11.341, 77.7172);
      expect(erodeDistance).toBeGreaterThan(30);
      expect(erodeDistance).toBeLessThan(45);

      // Coimbatore (~64 km away) - outside 50 km
      const coimbatoreDistance = calculateDistanceKm(11.0168, 76.9558);
      expect(coimbatoreDistance).toBeGreaterThan(60);
      expect(coimbatoreDistance).toBeLessThan(85);

      // Chennai (~400 km away) - far outside
      const chennaiDistance = calculateDistanceKm(13.0827, 80.2707);
      expect(chennaiDistance).toBeGreaterThan(350);
    });
  });

  describe("2. Dynamic Settings/delivery Configuration", () => {
    it("reads default delivery configuration with 50 km radius when Firestore doc is absent", async () => {
      const config = await settingsService.getDeliveryConfiguration();
      expect(config.deliveryEnabled).toBe(true);
      expect(config.deliveryRadiusKm).toBe(50.0);
      expect(config.storeCoordinates.lat).toBeCloseTo(11.459319, 5);
      expect(config.storeCoordinates.lng).toBeCloseTo(77.333565, 5);
      expect(config.serviceAreaDistrict).toBe("Erode");
    });

    it("dynamically merges Firestore Settings/delivery document when available", async () => {
      const mockCustomSettings: Record<string, unknown> = {
        deliveryEnabled: true,
        deliveryRadiusKm: 50,
        storeLocation: { latitude: 11.459319, longitude: 77.333565 },
        storeAddress: "Kasipalayam, Gobichettipalayam, Erode, Tamil Nadu 638454",
        serviceAreaDistrict: "Erode",
        serviceAreaState: "Tamil Nadu",
      };

      const spy = vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
        if (url === "/Settings/delivery") return mockCustomSettings as any;
        return null as any;
      });

      const config = await settingsService.getDeliveryConfiguration();
      expect(config.deliveryRadiusKm).toBe(50);
      expect(config.serviceAreaDistrict).toBe("Erode");
      expect(config.storeAddress).toContain("Kasipalayam");

      spy.mockRestore();
    });
  });

  describe("3. Serviceability Evaluation & Boundary Checks", () => {
    const config: StoreDeliverySettings = {
      ...DEFAULT_DELIVERY_SETTINGS,
      deliveryRadiusKm: 50.0,
    };

    it("approves delivery for addresses within the 50 km radius", () => {
      // Local Gobichettipalayam (~0.2 km)
      const local = validateDeliveryServiceability(
        { lat: 11.4595, lng: 77.3338, city: "Gobichettipalayam", pincode: "638454" },
        config
      );
      expect(local.eligible).toBe(true);
      expect(local.distanceKm).toBeLessThan(1);

      // Erode Town (~34 km) - within 50 km zone
      const erodeTown = validateDeliveryServiceability(
        { lat: 11.341, lng: 77.7172, city: "Erode", pincode: "638001" },
        config
      );
      expect(erodeTown.eligible).toBe(true);
      expect(erodeTown.distanceKm).toBeLessThanOrEqual(50);

      // Perundurai (~22 km) - within 50 km zone
      const perundurai = validateDeliveryServiceability(
        { lat: 11.275, lng: 77.582, city: "Perundurai", pincode: "638052" },
        config
      );
      expect(perundurai.eligible).toBe(true);
      expect(perundurai.distanceKm).toBeLessThanOrEqual(50);
    });

    it("rejects delivery for addresses exceeding 50 km radius with clear explanation", () => {
      // Coimbatore (~75 km)
      const coimbatore = validateDeliveryServiceability(
        { lat: 11.0168, lng: 76.9558, city: "Coimbatore", pincode: "641001" },
        config
      );
      expect(coimbatore.eligible).toBe(false);
      expect(coimbatore.distanceKm).toBeGreaterThan(50);
      expect(coimbatore.reason).toContain("We deliver up to 50 km");
      expect(coimbatore.reason).toContain("Gobichettipalayam, Erode");

      // Chennai (~400 km)
      const chennai = validateDeliveryServiceability(
        { lat: 13.0827, lng: 80.2707, city: "Chennai", pincode: "600001" },
        config
      );
      expect(chennai.eligible).toBe(false);
      expect(chennai.distanceKm).toBeGreaterThan(350);
    });

    it("validates service area district and Tamil Nadu state when coordinates are missing", () => {
      // Erode postal code without coordinates
      const erodeNoCoords = validateDeliveryServiceability(
        { city: "Gobichettipalayam", district: "Erode", state: "Tamil Nadu", pincode: "638454" },
        config
      );
      expect(erodeNoCoords.eligible).toBe(true);

      // Out of state address
      const outOfState = validateDeliveryServiceability(
        { city: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka", pincode: "560001" },
        config
      );
      expect(outOfState.eligible).toBe(false);
      expect(outOfState.reason).toContain("restricted to Erode district");
    });
  });

  describe("4. Authoritative Backend Boundary Revalidation in Order Creation", () => {
    it("rejects order creation when customer delivery address exceeds 50 km radius", async () => {
      const farAddress: Address = {
        id: "addr_far_1",
        userId: "CUS_TEST_50KM",
        tag: "Home",
        name: "Coimbatore Customer",
        phone: "+91 98400 12345",
        houseNo: "123",
        street: "Avinashi Road",
        city: "Coimbatore",
        pincode: "641001",
        lat: 11.0168, // ~75 km away
        lng: 76.9558,
        isDefault: true,
      };

      const slot: DeliverySlot = {
        id: "slot_std",
        type: "standard",
        title: "Standard Morning",
        subtitle: "09:00 - 12:00",
        charge: 0,
      };

      const mockCartItem: CartItem = {
        id: "cart_item_1",
        cartKey: "cart_item_1",
        userId: "CUS_TEST_50KM",
        productId: "prod_groundnut_oil",
        optionIndex: 0,
        name: "Cold Pressed Groundnut Oil",
        unit: "L",
        unitSize: "1",
        price: 250,
        mrp: 280,
        quantity: 2,
        image: "https://example.com/oil.jpg",
        stock: 10,
      };

      await expect(
        orderService.createOrder({
          userId: "CUS_TEST_50KM",
          customerName: "Coimbatore Customer",
          phone: "+91 98400 12345",
          address: farAddress,
          deliverySlot: slot,
          paymentMethod: "cod",
          cartItems: [mockCartItem],
          subtotal: 500,
          productSavings: 50,
          deliveryFee: 0,
          coinDiscount: 0,
          couponDiscount: 0,
          totalAmount: 500,
        })
      ).rejects.toThrow(/outside.*delivery boundary/i);
    });
  });
});
