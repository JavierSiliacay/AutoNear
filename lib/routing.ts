/**
 * Distance and Road Routing Utilities for TaraFix Map
 */

export interface RouteResult {
  coordinates: [number, number][]; // [lat, lng] array
  distanceKm: number;
  durationMins: number;
}

/**
 * Calculates straight-line distance in kilometers using the Haversine formula
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(1));
}

/**
 * Fetches turn-by-turn driving route coordinates and estimated time using free OSRM
 * Fallbacks to direct geodesic curve if OSRM is offline
 */
export async function fetchRoadRoute(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number
): Promise<RouteResult> {
  const directDistance = calculateHaversineDistance(startLat, startLng, endLat, endLng);
  // Default speed ~30 km/h in city traffic
  const estimatedMins = Math.max(3, Math.round((directDistance / 30) * 60));

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OSRM HTTP ${response.status}`);
    }

    const data = await response.json();
    if (data.code === "Ok" && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // OSRM returns GeoJSON coordinates as [lng, lat], convert to Leaflet [lat, lng]
      const coords: [number, number][] = route.geometry.coordinates.map(
        (pt: [number, number]) => [pt[1], pt[0]]
      );
      const distanceKm = Number((route.distance / 1000).toFixed(1));
      const durationMins = Math.max(2, Math.round(route.duration / 60));

      return {
        coordinates: coords,
        distanceKm,
        durationMins,
      };
    }
  } catch (err) {
    console.warn("OSRM routing fallback to direct polyline:", err);
  }

  // Fallback: Direct 2-point line
  return {
    coordinates: [
      [startLat, startLng],
      [endLat, endLng],
    ],
    distanceKm: directDistance,
    durationMins: estimatedMins,
  };
}
