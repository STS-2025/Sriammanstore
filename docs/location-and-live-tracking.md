# Location and delivery tracking

## Customer address capture

The signup and first-login flows open the address form when the customer has no saved address. The address book and checkout forms use a Leaflet pin picker with OpenStreetMap tiles. Customers can request their current browser location or tap/drag the pin, then save its coordinates with the typed address. Browser location access is only requested after the customer taps **Use current location**.

## Distance and ETA

The home header shows the selected default address and its distance from the configured store. When `VITE_OSRM_BASE_URL` points to the store's self-hosted OSRM service, the header uses its driving route distance and duration, adding the existing 12-minute packing allowance. Without OSRM, distance is straight-line and the existing 60-minute estimate is shown only within both the configured delivery radius and the store's 6 km express area.

Set `VITE_OSM_TILE_URL` and `VITE_OSRM_BASE_URL` in the deployment environment. The sample OSM tile endpoint is replaceable. OpenStreetMap's standard tile service is community-funded, has no service-level guarantee, and has usage requirements; production traffic should use tiles the store hosts or a provider whose terms fit the store's usage.

## Traccar driver tracking prerequisite

Live driver tracking is not active in this repository yet. There is no Traccar server, driver-device assignment, or order-to-device association. Once these are provisioned:

1. Run a secured Traccar server and configure each delivery driver's Traccar Client app or GPS device against it.
2. Store the assigned Traccar device ID against the active order in the trusted order-management backend.
3. Add an authenticated server-side customer endpoint that checks order ownership and returns only that order's latest driver position. Keep Traccar credentials on the server; do not put them in `VITE_` variables or connect customer browsers using a shared Traccar session.
4. Have the customer order view subscribe through that endpoint and render the driver position on the Leaflet map.

The Traccar WebSocket API currently authenticates with a session cookie. A server-side proxy is required to keep customer access scoped to their own order and to avoid sharing a Traccar login.
