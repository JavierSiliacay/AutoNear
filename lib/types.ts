export interface Shop {
  id: string
  name: string
  description: string | null
  services: string
  address: string | null
  barangay: string | null
  city: string
  province: string
  latitude: number | null
  longitude: number | null
  phone: string | null
  opening_hours: string | null
  image_url: string | null
  rating: number
  review_count: number
  is_verified: boolean
  created_at: string
}

export interface ShopRequest {
  id: string
  shop_name: string
  owner_name: string
  contact_details: string
  address: string
  google_maps_link: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason: string | null
  created_at: string
}

export interface ServiceRequest {
  id: string
  shop_id: string
  customer_name: string
  customer_phone: string
  vehicle_info: string | null
  service_type: string | null
  message: string | null
  created_at: string
}

export const PH_CITIES = [
  { label: "Manila", value: "Manila", province: "Metro Manila" },
  { label: "Quezon City", value: "Quezon City", province: "Metro Manila" },
  { label: "Makati", value: "Makati", province: "Metro Manila" },
  { label: "Pasig", value: "Pasig", province: "Metro Manila" },
  { label: "Taguig", value: "Taguig", province: "Metro Manila" },
  { label: "Cebu City", value: "Cebu City", province: "Cebu" },
  { label: "Davao City", value: "Davao City", province: "Davao del Sur" },
  { label: "Angeles City", value: "Angeles City", province: "Pampanga" },
  { label: "Antipolo", value: "Antipolo", province: "Rizal" },
  { label: "Caloocan", value: "Caloocan", province: "Metro Manila" },
  { label: "Cagayan de Oro", value: "Cagayan de Oro", province: "Misamis Oriental" },
] as const

export const SERVICE_TYPES = [
  "General Repair",
  "Oil Change",
  "Vulcanizing",
  "Tire Services",
  "Car Wash",
  "Engine Tune-Up",
  "Brake Services",
  "Electrical",
  "Air Conditioning",
  "Body & Paint",
] as const

export function getDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
