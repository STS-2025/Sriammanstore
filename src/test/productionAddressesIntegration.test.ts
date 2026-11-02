import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { addressService } from "../services/addressService";
import { authManager } from "../services/authAdapter";
import {
  productionAddressReader,
  setProductionAddressReaderOverride,
  normalizeLegacyAddressDocument,
} from "../services/productionAddressReader";
import { apiClient } from "../services/apiClient";
import { StorageAdapterError } from "../services/firestoreAdapter";
import type { Address } from "../types";

describe("Phase 4B-2B: Production Read-Only Saved Addresses Integration", () => {
  beforeEach(() => {
    authManager.resetMode();
    setProductionAddressReaderOverride(null);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    authManager.resetMode();
    setProductionAddressReaderOverride(null);
    vi.restoreAllMocks();
  });

  describe("1. Environment-Aware Service Routing", () => {
    it("routes getAddresses to productionAddressReader in production auth mode", async () => {
      authManager.setMode("production");
      expect(authManager.getMode()).toBe("production");

      const mockProdAddresses: Address[] = [
        {
          id: "addr_prod_01",
          userId: "SASS0000104",
          tag: "Home",
          name: "Senthil Kumar",
          phone: "9876543210",
          houseNo: "45-A",
          street: "Kutchery Street",
          landmark: "Near Taluk Office",
          city: "Gobichettipalayam",
          pincode: "638452",
          lat: 11.4598,
          lng: 77.334,
          isDefault: true,
        },
      ];

      const readerSpy = vi.fn().mockResolvedValue(mockProdAddresses);
      setProductionAddressReaderOverride({
        getCustomerAddresses: readerSpy,
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      const result = await addressService.getAddresses("SASS0000104");

      expect(readerSpy).toHaveBeenCalledTimes(1);
      expect(readerSpy).toHaveBeenCalledWith("SASS0000104");
      expect(apiGetSpy).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("addr_prod_01");
      expect(result[0]?.isDefault).toBe(true);
      expect(result[0]?.tag).toBe("Home");
    });

    it("preserves local apiClient routing in emulator mode", async () => {
      authManager.setMode("emulator");
      expect(authManager.getMode()).toBe("emulator");

      const mockEmulatorAddresses: Address[] = [
        {
          id: "addr_emu_101",
          userId: "SASS0000104",
          tag: "Work",
          name: "Emulator Customer",
          phone: "9999999999",
          houseNo: "10",
          street: "Market Road",
          city: "Gobichettipalayam",
          pincode: "638452",
          lat: 11.4598,
          lng: 77.334,
          isDefault: false,
        },
      ];

      const apiGetSpy = vi.spyOn(apiClient, "get").mockResolvedValue(mockEmulatorAddresses);
      const prodSpy = vi.fn();
      setProductionAddressReaderOverride({ getCustomerAddresses: prodSpy });

      const result = await addressService.getAddresses("SASS0000104");

      expect(apiGetSpy).toHaveBeenCalledWith("/addresses", { userId: "SASS0000104" });
      expect(prodSpy).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("addr_emu_101");
    });

    it("preserves local apiClient routing in mock mode", async () => {
      authManager.setMode("mock");
      expect(authManager.getMode()).toBe("mock");

      const apiGetSpy = vi.spyOn(apiClient, "get").mockResolvedValue([]);
      const prodSpy = vi.fn();
      setProductionAddressReaderOverride({ getCustomerAddresses: prodSpy });

      const result = await addressService.getAddresses("SASS0000104");

      expect(apiGetSpy).toHaveBeenCalledWith("/addresses", { userId: "SASS0000104" });
      expect(prodSpy).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe("2. Safety & Zero-Read Guarantees on Missing Identity", () => {
    it("returns empty array immediately without issuing any query when userId is undefined", async () => {
      authManager.setMode("production");
      const prodSpy = vi.fn();
      setProductionAddressReaderOverride({ getCustomerAddresses: prodSpy });
      const apiSpy = vi.spyOn(apiClient, "get");

      const result = await addressService.getAddresses(undefined);

      expect(result).toEqual([]);
      expect(prodSpy).not.toHaveBeenCalled();
      expect(apiSpy).not.toHaveBeenCalled();
    });

    it("returns empty array immediately when userId is empty string or whitespace", async () => {
      authManager.setMode("production");
      const prodSpy = vi.fn();
      setProductionAddressReaderOverride({ getCustomerAddresses: prodSpy });
      const apiSpy = vi.spyOn(apiClient, "get");

      const result1 = await addressService.getAddresses("");
      const result2 = await addressService.getAddresses("   ");

      expect(result1).toEqual([]);
      expect(result2).toEqual([]);
      expect(prodSpy).not.toHaveBeenCalled();
      expect(apiSpy).not.toHaveBeenCalled();
    });

    it("assertValidCustomer in productionAddressReader rejects non-SASS identifiers", () => {
      expect(() => {
        productionAddressReader.assertValidCustomer("some-firebase-uid-123");
      }).toThrow(/Invalid customer identifier/);

      expect(() => {
        productionAddressReader.assertValidCustomer("");
      }).toThrow(/Invalid customer identifier/);
    });
  });

  describe("3. Address Normalization & Document ID Preservation", () => {
    it("correctly normalizes legacy address document schema with aliases, string coordinates, and primaryAddressId pointer", () => {
      const rawLegacyDoc = {
        fullName: "Senthil Kumar",
        contact: "9876543210",
        door: "12/4",
        street: "Kasipalayam Road",
        landmark: "Opp. Amman Temple",
        town: "Gobichettipalayam",
        pincode: "638454",
        latitude: "11.4598",
        longitude: "77.334",
        tag: "Home",
      };

      const normalized = normalizeLegacyAddressDocument(
        "doc_legacy_addr_01",
        rawLegacyDoc,
        "SASS0000104",
        "doc_legacy_addr_01" // Profile's primaryAddressId matches doc_legacy_addr_01
      );

      expect(normalized.id).toBe("doc_legacy_addr_01");
      expect(normalized.userId).toBe("SASS0000104");
      expect(normalized.name).toBe("Senthil Kumar");
      expect(normalized.phone).toBe("9876543210");
      expect(normalized.houseNo).toBe("12/4");
      expect(normalized.street).toBe("Kasipalayam Road");
      expect(normalized.landmark).toBe("Opp. Amman Temple");
      expect(normalized.city).toBe("Gobichettipalayam");
      expect(normalized.pincode).toBe("638454");
      expect(normalized.lat).toBe(11.4598);
      expect(normalized.lng).toBe(77.334);
      expect(normalized.isDefault).toBe(true);
      expect(normalized.tag).toBe("Home");
    });

    it("preserves explicit docData.id if present and non-empty", () => {
      const rawDoc = {
        id: "explicit-id-999",
        name: "Arun",
        phone: "9123456789",
        houseNo: "5",
        street: "Bazaar St",
        city: "Gobi",
        pincode: "638452",
        isDefault: false,
      };

      const normalized = normalizeLegacyAddressDocument(
        "snapshot_doc_id",
        rawDoc,
        "SASS0000104",
        "some-other-id"
      );

      expect(normalized.id).toBe("explicit-id-999");
      expect(normalized.isDefault).toBe(false);
    });

    it("falls back to snapId when docData.id is absent", () => {
      const rawDoc = {
        name: "Arun",
        phone: "9123456789",
        houseNo: "5",
        street: "Bazaar St",
        city: "Gobi",
        pincode: "638452",
      };

      const normalized = normalizeLegacyAddressDocument(
        "snapshot_doc_id",
        rawDoc,
        "SASS0000104"
      );

      expect(normalized.id).toBe("snapshot_doc_id");
    });

    it("normalizes address tags safely ('work' -> 'Work', unknown -> 'Home')", () => {
      const workDoc = normalizeLegacyAddressDocument("1", { tag: "work", name: "A", city: "C" }, "SASS0000104");
      const otherDoc = normalizeLegacyAddressDocument("2", { tag: "other", name: "B", city: "C" }, "SASS0000104");
      const unknownDoc = normalizeLegacyAddressDocument("3", { tag: "friend", name: "C", city: "C" }, "SASS0000104");

      expect(workDoc.tag).toBe("Work");
      expect(otherDoc.tag).toBe("Other");
      expect(unknownDoc.tag).toBe("Home");
    });
  });

  describe("4. Production Read Error Propagation (Never Falls Back to Mock)", () => {
    it("rethrows production Firestore errors and never falls back to mock address data", async () => {
      authManager.setMode("production");

      const prodError = new StorageAdapterError(
        "Firestore permission denied reading users/SASS0000104/addresses",
        {
          status: 403,
          code: "permission-denied",
          category: "permission",
        }
      );

      setProductionAddressReaderOverride({
        getCustomerAddresses: vi.fn().mockRejectedValue(prodError),
      });

      const apiGetSpy = vi.spyOn(apiClient, "get");

      await expect(addressService.getAddresses("SASS0000104")).rejects.toThrow(
        /permission denied/
      );

      // Verify that mock/apiClient fallback NEVER occurred
      expect(apiGetSpy).not.toHaveBeenCalled();
    });
  });

  describe("5. Active Production Address Operations", () => {
    it("allows addAddress in production mode", async () => {
      authManager.setMode("production");

      const created = await addressService.addAddress({
        userId: "SASS0000104",
        tag: "Home",
        name: "Senthil",
        phone: "9876543210",
        houseNo: "1",
        street: "Main St",
        city: "Gobichettipalayam",
        pincode: "638452",
        lat: 11.4598,
        lng: 77.334,
        isDefault: true,
      });
      expect(created).toBeDefined();
      expect(created.name).toBe("Senthil");
    });

    it("allows updateAddress in production mode", async () => {
      authManager.setMode("production");
      const created = await addressService.addAddress({
        userId: "SASS0000104",
        tag: "Home",
        name: "Senthil",
        phone: "9876543210",
        houseNo: "1",
        street: "Main St",
        city: "Gobichettipalayam",
        pincode: "638452",
        lat: 11.4598,
        lng: 77.334,
        isDefault: false,
      });

      const updated = await addressService.updateAddress(created.id, {
        userId: "SASS0000104",
        street: "Updated Street",
      });
      expect(updated.street).toBe("Updated Street");
    });

    it("allows deleteAddress in production mode", async () => {
      authManager.setMode("production");
      const created = await addressService.addAddress({
        userId: "SASS0000104",
        tag: "Home",
        name: "Senthil",
        phone: "9876543210",
        houseNo: "1",
        street: "Main St",
        city: "Gobichettipalayam",
        pincode: "638452",
        lat: 11.4598,
        lng: 77.334,
        isDefault: false,
      });

      await expect(
        addressService.deleteAddress(created.id, "SASS0000104")
      ).resolves.not.toThrow();
    });

    it("allows setDefaultAddress in production mode", async () => {
      authManager.setMode("production");
      const created = await addressService.addAddress({
        userId: "SASS0000104",
        tag: "Home",
        name: "Senthil",
        phone: "9876543210",
        houseNo: "1",
        street: "Main St",
        city: "Gobichettipalayam",
        pincode: "638452",
        lat: 11.4598,
        lng: 77.334,
        isDefault: false,
      });

      await expect(
        addressService.setDefaultAddress(created.id, "SASS0000104")
      ).resolves.not.toThrow();
    });

    it("allows clearOtherDefaults in production mode", async () => {
      authManager.setMode("production");

      await expect(
        addressService.clearOtherDefaults("SASS0000104", "addr_01")
      ).resolves.not.toThrow();
    });
  });

  describe("6. Local Emulator/Mock Mutations Remain Fully Functional", () => {
    it("allows addAddress and invokes apiClient.post in emulator mode", async () => {
      authManager.setMode("emulator");

      const mockCreatedAddress: Address = {
        id: "addr_new_123",
        userId: "SASS0000104",
        tag: "Home",
        name: "Senthil",
        phone: "9876543210",
        houseNo: "1",
        street: "Main St",
        city: "Gobichettipalayam",
        pincode: "638452",
        lat: 11.4598,
        lng: 77.334,
        isDefault: false,
      };

      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValue(mockCreatedAddress);

      const result = await addressService.addAddress({
        userId: "SASS0000104",
        tag: "Home",
        name: "Senthil",
        phone: "9876543210",
        houseNo: "1",
        street: "Main St",
        city: "Gobichettipalayam",
        pincode: "638452",
        lat: 11.4598,
        lng: 77.334,
        isDefault: false,
      });

      expect(postSpy).toHaveBeenCalledTimes(1);
      expect(result.id).toBe("addr_new_123");
    });

    it("allows deleteAddress in emulator mode", async () => {
      authManager.setMode("emulator");

      const deleteSpy = vi.spyOn(apiClient, "delete").mockResolvedValue({ success: true });

      await addressService.deleteAddress("addr_123", "SASS0000104");

      expect(deleteSpy).toHaveBeenCalledWith("/addresses/addr_123?userId=SASS0000104");
    });
  });
});

