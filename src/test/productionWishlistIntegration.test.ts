import { afterEach, describe, expect, it, vi } from "vitest";
import { customerIdentityService } from "../services/customerIdentityService";
import { apiClient } from "../services/apiClient";
import { wishlistService } from "../services/wishlistService";
import { authManager } from "../services/authAdapter";

const identity = (customerId: string, collection: "onlineCustomers" | "users" = "onlineCustomers") => ({
  status: "resolved" as const,
  ok: true as const,
  uid: "verified-firebase-uid",
  userDocId: customerId,
  mapping: { uid: "verified-firebase-uid", userDocId: customerId, collection, accountType: "customer" as const },
  profile: { id: customerId } as never,
});

describe("customer wishlist identity and production adapter routing", () => {
  afterEach(() => vi.restoreAllMocks());

  it("ignores frontend customer IDs and always uses the validated Firebase identity", async () => {
    vi.spyOn(customerIdentityService, "resolveCurrentFirebaseUserProfile").mockResolvedValue(identity("ONCUS0000001"));
    const adapter = { getCustomerWishlistProducts: vi.fn(async () => []) };
    vi.spyOn(apiClient, "getFirestoreAdapter").mockReturnValue(adapter as never);

    await wishlistService.getWishlistProducts(undefined, "ONCUS0000002");
    expect(adapter.getCustomerWishlistProducts).toHaveBeenCalledWith("ONCUS0000001");
    expect(adapter.getCustomerWishlistProducts).not.toHaveBeenCalledWith("ONCUS0000002");
  });

  it("rejects legacy users collection identities", async () => {
    vi.spyOn(customerIdentityService, "resolveCurrentFirebaseUserProfile").mockResolvedValue(identity("ONCUS0000001", "users"));
    const adapterLookup = vi.spyOn(apiClient, "getFirestoreAdapter");

    await expect(wishlistService.getWishlistProducts()).rejects.toThrow(/legacy customer profile/i);
    expect(adapterLookup).not.toHaveBeenCalled();
  });

  it("resolves the active production Firebase user from the production auth adapter", async () => {
    const activeFirebaseUser = {
      uid: "production-firebase-uid", email: "customer@example.com",
      emailVerified: true, providerId: "firebase-auth-production",
    };
    vi.spyOn(authManager, "getMode").mockReturnValue("production");
    vi.spyOn(authManager, "getCurrentUser").mockReturnValue(activeFirebaseUser);
    const resolveProfile = vi.spyOn(customerIdentityService, "resolveCustomerProfile").mockResolvedValue({
      status: "unlinked", ok: false, code: "identity/unlinked-uid",
      uid: activeFirebaseUser.uid, userDocId: null, profile: null,
      requiresRegistration: true, message: "No linked customer profile.",
    });

    await customerIdentityService.resolveCurrentFirebaseUserProfile();
    expect(resolveProfile).toHaveBeenCalledWith(activeFirebaseUser, undefined);
  });

  it("propagates Firestore authorization failures without falling back to legacy wishlist data", async () => {
    vi.spyOn(customerIdentityService, "resolveCurrentFirebaseUserProfile").mockResolvedValue(identity("ONCUS0000001"));
    vi.spyOn(apiClient, "getFirestoreAdapter").mockReturnValue({
      getCustomerWishlistProducts: vi.fn(async () => { throw new Error("Permission denied"); }),
    } as never);

    await expect(wishlistService.getWishlistProducts()).rejects.toThrow(/access is not available/i);
  });
});
