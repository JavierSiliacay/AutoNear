import { useQuery } from "@tanstack/react-query"
import type { Mechanic } from "@/lib/types"

interface MechanicsFilterOptions {
  city?: string
  service?: string
}

async function fetchMechanicsApi(options?: MechanicsFilterOptions): Promise<Mechanic[]> {
  const queryParams = new URLSearchParams()
  if (options?.city) queryParams.set("city", options.city)
  if (options?.service) queryParams.set("service", options.service)

  const queryString = queryParams.toString()
  const url = `/api/mechanics${queryString ? `?${queryString}` : ""}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("Failed to fetch mechanics")
  }
  return res.json()
}

/**
 * Custom TanStack Query hook for fetching mechanics with caching
 */
export function useMechanics(options?: MechanicsFilterOptions, initialData?: Mechanic[]) {
  return useQuery({
    queryKey: ["mechanics", options?.city || "all", options?.service || "all"],
    queryFn: () => fetchMechanicsApi(options),
    initialData: initialData,
    staleTime: 60 * 1000, // 1 minute
  })
}
