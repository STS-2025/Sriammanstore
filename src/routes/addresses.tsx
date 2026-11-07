import { useState, useEffect } from "react";
import { createFileRoute, Link, useSearch, useNavigate } from "@tanstack/react-router";
import { StoreHeader } from "../components/layout/StoreHeader";
import { BottomNav } from "../components/layout/BottomNav";
import { StoreFooter } from "../components/layout/StoreFooter";
import { addressService } from "../services/addressService";
import { authManager } from "../services/authAdapter";
import type { Address } from "../types";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

export const Route = createFileRoute("/addresses")({
  validateSearch: (
    search: Record<string, unknown>
  ): {
    redirect?: string | undefined;
    action?: string | undefined;
  } => ({
    redirect: typeof search["redirect"] === "string" ? search["redirect"] : undefined,
    action: typeof search["action"] === "string" ? search["action"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Saved Addresses — Sri Amman Smart Store" },
      { name: "description", content: "Manage delivery addresses and check geofence coverage." },
    ],
  }),
  component: AddressesPage,
});

export function AddressesPage() {
  const searchParams = useSearch({ from: "/addresses" });
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isResolvingIdentity } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [tag, setTag] = useState<"Home" | "Work" | "Other">("Home");
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Gobichettipalayam");
  const [pincode, setPincode] = useState("638454");
  const [lat, setLat] = useState(11.4595);
  const [lng, setLng] = useState(77.3338);

  const handleOpenAddModal = () => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
    setHouseNo("");
    setStreet("");
    setLandmark("");
    setTag("Home");
    setShowModal(true);
  };

  useEffect(() => {
    if (searchParams.action === "add" || searchParams.action === "new") {
      handleOpenAddModal();
    }
  }, [searchParams.action]);

  const loadAddresses = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setAddressesError(null);
      const list = await addressService.getAddresses(user.id);
      setAddresses(list || []);
    } catch (err: any) {
      console.error("Failed to load addresses:", err);
      const msg =
        err?.message ||
        "Failed to load saved addresses from store database. Please check your connection.";
      setAddressesError(msg);
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAddresses();
    } else if (!authLoading && !isResolvingIdentity) {
      setLoading(false);
    }
  }, [user, authLoading, isResolvingIdentity]);

  const handleSetDefault = async (id: string) => {
    if (!user) return;
    try {
      await addressService.setDefaultAddress(id, user.id);
      toast.success("Default delivery address updated");
      await loadAddresses();
    } catch (err: any) {
      toast.error(err.message || "Failed to set default address");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await addressService.deleteAddress(id, user?.id);
      toast.info("Address deleted");
      await loadAddresses();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete address");
    }
  };

  const handleSimulateGPS = () => {
    // Center of Gobichettipalayam delivery zone
    setLat(11.4598);
    setLng(77.334);
    setCity("Gobichettipalayam");
    setPincode("638454");
    setStreet("Kasipalayam High Road");
    toast.info("GPS coordinates mapped to Gobichettipalayam Hub (Distance ~150m)");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!houseNo.trim() || !street.trim()) {
      toast.error("Please enter house number and street");
      return;
    }
    try {
      await addressService.addAddress({
        userId: user.id,
        tag,
        name,
        phone,
        houseNo,
        street,
        landmark,
        city,
        pincode,
        lat,
        lng,
        isDefault: addresses.length === 0,
      });
      setShowModal(false);
      setHouseNo("");
      setStreet("");
      setLandmark("");
      toast.success("Address added successfully!");
      if (searchParams.redirect) {
        navigate({ to: searchParams.redirect as any });
        return;
      }
      await loadAddresses();
    } catch (err: any) {
      toast.error(err.message || "Failed to add address");
    }
  };

  // Loading & Session Restoration View
  if ((authLoading || isResolvingIdentity) && !user) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1000px] mx-auto px-margin-desktop py-20 text-center">
          <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-on-surface-variant font-medium">
            Loading saved addresses...
          </p>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  if (!user && !loading && !authLoading && !isResolvingIdentity) {
    return (
      <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
        <StoreHeader />
        <main className="w-full pt-20 max-w-[1000px] mx-auto px-margin-desktop py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-4xl mx-auto mb-4">
            📍
          </div>
          <h2 className="font-headline-lg text-xl font-bold text-on-surface mb-2">
            Please Sign In to Manage Saved Addresses
          </h2>
          <p className="text-xs text-on-surface-variant mb-6">
            Sign in with your mobile number to view and save home and work delivery locations.
          </p>
          <Link
            to="/login"
            search={{ redirect: "/addresses" } as any}
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-2xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all"
          >
            <span>Sign In with Phone OTP</span>
          </Link>
        </main>
        <StoreFooter />
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      <StoreHeader />

      <main className="w-full pt-20 bg-surface min-h-[calc(100vh-80px)]">
        <div className="max-w-[1000px] mx-auto px-margin-desktop py-space-xl">
          {searchParams.redirect && (
            <div className="mb-4">
              <Link
                to={searchParams.redirect as any}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-xl border border-primary/20 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Return to Checkout</span>
              </Link>
            </div>
          )}
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-on-surface">
                Saved Delivery Addresses
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <p className="text-xs text-on-surface-variant">
                  Store Hub: Gobichettipalayam • Service Radius: 50.0 KM
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="bg-primary hover:bg-primary-container text-white px-5 py-2.5 rounded-2xl font-headline-sm text-xs font-bold flex items-center gap-2 shadow-md transition-all self-start sm:self-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">add_location_alt</span>
              <span>Add New Address</span>
            </button>
          </div>

          {/* Addresses Grid */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-xs text-on-surface-variant">Loading saved addresses...</p>
            </div>
          ) : addressesError ? (
            <div className="bg-surface-container-lowest rounded-3xl p-8 sm:p-12 text-center max-w-md mx-auto border border-red-200 my-12 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-3xl mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">cloud_off</span>
              </div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-2">
                Unable to Load Saved Addresses
              </h3>
              <p className="text-xs text-on-surface-variant mb-6 leading-relaxed">
                {addressesError}
              </p>
              <button
                type="button"
                onClick={() => loadAddresses()}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md hover:bg-primary-container transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Retry</span>
              </button>
            </div>
          ) : addresses.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-3xl p-12 text-center max-w-md mx-auto border border-outline-variant/20 shadow-sm my-12">
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-3xl mx-auto mb-4">
                📍
              </div>
              <h3 className="font-headline-lg text-lg font-bold text-on-surface mb-2">
                No Addresses Saved
              </h3>
              <p className="text-xs text-on-surface-variant mb-6">
                Add your home or work address to unlock 60-minute express doorstep delivery.
              </p>
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="bg-primary text-white px-6 py-2.5 rounded-xl font-headline-sm text-xs font-bold shadow-md cursor-pointer hover:bg-primary-container transition-all"
              >
                Add First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((addr) => {
                const geo = addressService.validateGeofence(addr.lat, addr.lng);
                return (
                  <div
                    key={addr.id}
                    className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/20 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-headline-sm text-xs font-bold bg-surface-container px-2.5 py-1 rounded-lg text-on-surface">
                          {addr.tag}
                        </span>
                        {addr.isDefault ? (
                          <span className="font-label-badge text-[10px] uppercase font-bold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded">
                            Primary Address
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(addr.id)}
                            className="text-xs text-primary font-bold hover:underline cursor-pointer"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>

                      <h4 className="font-headline-sm text-base font-bold text-on-surface">
                        {addr.name}
                      </h4>
                      <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                        {addr.phone}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
                        {addr.houseNo}, {addr.street}, {addr.landmark && `${addr.landmark}, `}
                        {addr.city} - {addr.pincode}
                      </p>

                      {/* Geofence Eligibility Pill */}
                      <div className="mt-4 pt-3 border-t border-outline-variant/15 flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold flex items-center gap-1 text-[11px] ${
                            geo.eligible ? "text-primary" : "text-tertiary"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {geo.eligible ? "verified" : "error"}
                          </span>
                          {geo.eligible ? "Eligible (Within 50km)" : "Ineligible (Exceeds 50km)"}
                        </span>
                        <span className="text-on-surface-variant font-mono text-[11px]">
                          {geo.distanceKm} km
                        </span>
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-outline-variant/15 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleDelete(addr.id)}
                        className="text-xs text-tertiary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add New Address Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl p-6 max-w-md w-full shadow-2xl border border-outline-variant/20">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-headline-lg text-base font-bold text-on-surface">
                Add New Delivery Location
              </h4>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* GPS Auto Detect simulation */}
            <div className="mb-4 p-3 rounded-2xl bg-primary-fixed/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-on-primary-fixed">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  my_location
                </span>
                <span>Use Current GPS Location</span>
              </div>
              <button
                type="button"
                onClick={handleSimulateGPS}
                className="px-3 py-1 bg-primary text-white font-bold rounded-lg text-xs"
              >
                Auto Detect
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-on-surface block mb-1">Tag</label>
                <div className="flex gap-2">
                  {(["Home", "Work", "Other"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTag(t)}
                      className={`flex-1 py-1.5 rounded-xl font-bold cursor-pointer ${
                        tag === t
                          ? "bg-primary text-white"
                          : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">Recipient Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Recipient full name"
                  className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98400 12345"
                  className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">House / Flat / Door No</label>
                <input
                  type="text"
                  required
                  value={houseNo}
                  onChange={(e) => setHouseNo(e.target.value)}
                  placeholder="e.g. 14/2, Amman Kovil Street"
                  className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">Street / Area</label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="e.g. Kasipalayam"
                  className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
                />
              </div>

              <div>
                <label className="font-bold text-on-surface block mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Water Tank"
                  className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-on-surface block mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
                  />
                </div>
                <div>
                  <label className="font-bold text-on-surface block mb-1">Pincode</label>
                  <input
                    type="text"
                    required
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    className="w-full bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/20"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl font-bold bg-surface-container text-on-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl font-bold bg-primary text-white shadow-md hover:bg-primary-container cursor-pointer"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <StoreFooter />
      <BottomNav />
    </div>
  );
}
