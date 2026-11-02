import { apiClient } from "./apiClient";
import type { Address } from "../types";
import {
  isWithinDeliveryGeofence,
  validateDeliveryServiceability,
  type DeliveryServiceabilityResult,
} from "../lib/haversine";
import { authManager } from "./authAdapter";
import { productionAddressReader } from "./productionAddressReader";
import { resolveCustomerDataSource } from "./customerDataSourceResolver";
import type { StoreDeliverySettings } from "./settingsService";

export const addressService = {
  async getAddresses(userId?: string, legacySassId?: string): Promise<Address[]> {
    const cleanUserId = (userId || "").trim();
    if (!cleanUserId) return [];

    let resolvedUserId = cleanUserId;
    let resolvedLegacySassId = legacySassId;
    try {
      const ds = resolveCustomerDataSource(cleanUserId);
      resolvedUserId = ds.canonicalCustomerId;
      resolvedLegacySassId = legacySassId || ds.legacySassId;
    } catch {
      // fallback to cleanUserId
    }

    if (authManager.getMode() === "production") {
      if (resolvedLegacySassId) {
        return productionAddressReader.getCustomerAddresses(resolvedUserId, undefined, resolvedLegacySassId);
      }
      return productionAddressReader.getCustomerAddresses(resolvedUserId);
    }

    const list = await apiClient.get<Address[]>("/addresses", { userId: resolvedUserId });
    return list || [];
  },

  async addAddress(address: Omit<Address, "id">): Promise<Address> {
    const cleanUserId = (address.userId || "").trim();
    if (!cleanUserId) {
      throw new Error("Cannot save an address without a valid customer userId");
    }
    const newId = `addr_${Date.now()}`;
    const newAddress: Address = {
      ...address,
      userId: cleanUserId,
      id: newId,
    };
    if (newAddress.isDefault) {
      await this.clearOtherDefaults(cleanUserId);
    }
    return apiClient.post<Address>("/addresses", newAddress);
  },

  async updateAddress(id: string, data: Partial<Address>): Promise<Address> {
    if (data.isDefault && data.userId) {
      await this.clearOtherDefaults(data.userId, id);
    }
    const query = data.userId ? `?userId=${encodeURIComponent(data.userId)}` : "";
    return apiClient.patch<Address>(`/addresses/${encodeURIComponent(id)}${query}`, data);
  },

  async deleteAddress(id: string, userId?: string): Promise<void> {
    const cleanUserId = (userId || "").trim();
    const query = cleanUserId ? `?userId=${encodeURIComponent(cleanUserId)}` : "";
    await apiClient.delete(`/addresses/${encodeURIComponent(id)}${query}`);
  },

  async setDefaultAddress(id: string, userId: string): Promise<void> {
    const cleanUserId = (userId || "").trim();
    if (!cleanUserId) {
      throw new Error("Cannot set default address without a valid customer userId");
    }
    await this.clearOtherDefaults(cleanUserId, id);
    await apiClient.patch<Address>(`/addresses/${encodeURIComponent(id)}`, {
      isDefault: true,
      userId: cleanUserId,
    });
  },

  async clearOtherDefaults(userId: string, currentId?: string): Promise<void> {
    const addresses = await this.getAddresses(userId);
    const defaults = addresses.filter((a) => a.isDefault && a.id !== currentId);
    await Promise.all(
      defaults.map((a) =>
        apiClient.patch(`/addresses/${encodeURIComponent(a.id)}`, {
          isDefault: false,
          userId,
        })
      )
    );
  },

  validateGeofence(lat: number, lng: number, maxRadiusKm?: number) {
    return isWithinDeliveryGeofence(lat, lng, maxRadiusKm);
  },

  /**
   * Validates address deliverability against dynamic store configuration (50 km radius, Erode, Tamil Nadu).
   */
  validateDeliveryServiceability(
    address: Address | { lat?: number; lng?: number; city?: string; district?: string; state?: string; pincode?: string },
    config?: Partial<StoreDeliverySettings>
  ): DeliveryServiceabilityResult {
    const options: Parameters<typeof validateDeliveryServiceability>[1] = {};
    if (config?.deliveryRadiusKm !== undefined) options.maxRadiusKm = config.deliveryRadiusKm;
    if (config?.storeCoordinates?.lat !== undefined) options.storeLat = config.storeCoordinates.lat;
    if (config?.storeCoordinates?.lng !== undefined) options.storeLng = config.storeCoordinates.lng;
    if (config?.storeName !== undefined) options.storeName = config.storeName;
    if (config?.storeAddress !== undefined) options.storeAddress = config.storeAddress;
    if (config?.serviceAreaDistrict !== undefined) options.serviceAreaDistrict = config.serviceAreaDistrict;
    if (config?.serviceAreaState !== undefined) options.serviceAreaState = config.serviceAreaState;

    return validateDeliveryServiceability(address, options);
  },
};
