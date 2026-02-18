"use server"

import { createClient } from "@/lib/supabase/server"
import type { Shop } from "./types"

export async function getShops(options?: {
  city?: string
  service?: string
}): Promise<Shop[]> {
  const supabase = await createClient()

  let query = supabase.from("shops").select("*")

  if (options?.city) {
    query = query.eq("city", options.city)
  }

  const { data, error } = await query.order("rating", { ascending: false })

  if (error) {
    console.error("Error fetching shops:", JSON.stringify(error, null, 2))
    return []
  }

  let shops = (data || []) as Shop[]

  if (options?.service) {
    shops = shops.filter((s) =>
      s.services?.toLowerCase().includes(options.service!.toLowerCase())
    )
  }

  return shops
}

export async function getShopById(id: string): Promise<Shop | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching shop:", error)
    return null
  }

  return data as Shop
}

export async function submitServiceRequest(formData: FormData) {
  const supabase = await createClient()

  const shopId = formData.get("shop_id") as string
  const customerName = formData.get("customer_name") as string
  const customerPhone = formData.get("customer_phone") as string
  const vehicleInfo = formData.get("vehicle_info") as string
  const serviceType = formData.get("service_type") as string
  const message = formData.get("message") as string

  if (!shopId || !customerName || !customerPhone) {
    return { success: false, error: "Please fill in all required fields." }
  }

  const { error } = await supabase.from("service_requests").insert({
    shop_id: shopId,
    customer_name: customerName,
    customer_phone: customerPhone,
    vehicle_info: vehicleInfo || null,
    service_type: serviceType || null,
    message: message || null,
  })

  if (error) {
    console.error("Error submitting service request:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }

  return { success: true }
}

export async function submitShopRequest(formData: FormData) {
  const supabase = await createClient()

  const shopName = formData.get("shop_name") as string
  const ownerName = formData.get("owner_name") as string
  const contactDetails = formData.get("contact_details") as string
  const address = formData.get("address") as string
  const googleMapsLink = formData.get("google_maps_link") as string

  if (!shopName || !ownerName || !contactDetails || !address || !googleMapsLink) {
    return { success: false, error: "Please fill in all fields." }
  }

  const isGoogleMapsUrl = googleMapsLink.includes("google.com/maps") || googleMapsLink.includes("maps.app.goo.gl")
  if (!isGoogleMapsUrl) {
    return { success: false, error: "Please provide a valid Google Maps link." }
  }

  const { data: existingShop } = await supabase
    .from("shops")
    .select("id")
    .ilike("name", shopName)
    .ilike("address", `%${address.substring(0, 5)}%`)
    .maybeSingle()

  if (existingShop) {
    return { success: false, error: "This shop appears to be already listed." }
  }

  const { error } = await supabase.from("shop_requests").insert({
    shop_name: shopName,
    owner_name: ownerName,
    contact_details: contactDetails,
    address: address,
    google_maps_link: googleMapsLink,
    status: 'pending'
  })

  if (error) {
    console.error("Error submitting shop request:", error)
    return { success: false, error: "Something went wrong. Please try again." }
  }

  return { success: true }
}

export async function getShopRequests() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shop_requests")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching shop requests:", error)
    return []
  }

  return data
}

export async function updateShopRequestStatus(requestId: string, status: 'approved' | 'rejected', reason?: string) {
  const supabase = await createClient()

  const { data: request, error: fetchError } = await supabase
    .from("shop_requests")
    .select("*")
    .eq("id", requestId)
    .single()

  if (fetchError || !request) {
    return { success: false, error: "Request not found." }
  }

  if (status === 'approved') {
    const { error: insertError } = await supabase.from("shops").insert({
      name: request.shop_name,
      address: request.address,
      city: "Cagayan de Oro",
      province: "Misamis Oriental",
      is_verified: true,
      rating: 0,
      review_count: 0
    })

    if (insertError) {
      console.error("Error approving shop:", insertError)
      return { success: false, error: "Failed to add shop to database." }
    }
  }

  const { error: updateError } = await supabase
    .from("shop_requests")
    .update({ status, rejection_reason: reason })
    .eq("id", requestId)

  if (updateError) {
    return { success: false, error: "Failed to update request status." }
  }

  return { success: true }
}
