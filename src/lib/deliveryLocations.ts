export interface DeliveryLocationSuggestion {
  area: string;
  city: string;
  pincode: string;
}

// Default PINs for the store's admin-configured Coimbatore neighborhoods.
// Customers can edit the PIN because postal boundaries may vary by street.
const DEFAULT_LOCATIONS: DeliveryLocationSuggestion[] = [
  { area: "Gandhipuram", city: "Coimbatore", pincode: "641012" },
  { area: "RS Puram", city: "Coimbatore", pincode: "641002" },
  { area: "Tatabad", city: "Coimbatore", pincode: "641012" },
  { area: "Saibaba Colony", city: "Coimbatore", pincode: "641011" },
  { area: "Peelamedu", city: "Coimbatore", pincode: "641004" },
  { area: "Town Hall", city: "Coimbatore", pincode: "641001" },
  { area: "Ramanathapuram", city: "Coimbatore", pincode: "641045" },
  { area: "Singanallur", city: "Coimbatore", pincode: "641005" },
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

export function getDeliveryAreaSuggestions(zones: string[]): string[] {
  const normalizedZones = new Set(zones.map(normalize));
  const configured = DEFAULT_LOCATIONS
    .filter(({ area }) => normalizedZones.has(normalize(area)))
    .map(({ area }) => area);
  const unmappedAdminZones = zones.filter(
    (zone) => !DEFAULT_LOCATIONS.some(({ area }) => normalize(area) === normalize(zone)),
  );
  return [...configured, ...unmappedAdminZones];
}

export function findDeliveryLocation(area: string, zones: string[]): DeliveryLocationSuggestion | undefined {
  const normalizedArea = normalize(area.trim());
  if (!normalizedArea) return undefined;

  // Match exact selections and typed street/area values that include a zone name.
  const configuredZone = zones
    .filter((zone) => normalizedArea.includes(normalize(zone)))
    .sort((left, right) => normalize(right).length - normalize(left).length)[0];
  if (!configuredZone) return undefined;

  return DEFAULT_LOCATIONS.find(({ area: knownArea }) => normalize(knownArea) === normalizedArea);
}
