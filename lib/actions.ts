"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
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

  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase.from("service_requests").insert({
    shop_id: shopId,
    customer_name: customerName,
    customer_phone: customerPhone,
    customer_email: user?.email || null,
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

export async function getServiceRequests() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("service_requests")
    .select("*, shops(name)")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching service requests:", error)
    return []
  }

  return data.map((req: any) => ({
    ...req,
    shop_name: req.shops?.name || "Unknown Shop"
  }))
}

export async function getUsersServiceRequests(email: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("service_requests")
    .select("*, shops(name)")
    .eq("customer_email", email)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching user's service requests:", error)
    return []
  }

  return data.map((req: any) => ({
    ...req,
    shop_name: req.shops?.name || "Unknown Shop"
  }))
}

export async function getMessages(requestId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("service_request_messages")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching messages:", error)
    return []
  }

  return data
}

export async function sendChatMessage(requestId: string, content: string, senderRole: 'admin' | 'customer', senderEmail: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("service_request_messages").insert({
    request_id: requestId,
    content,
    sender_role: senderRole,
    sender_email: senderEmail
  })

  if (error) {
    console.error("Error sending message:", error)
    return { success: false, error: "Failed to send message." }
  }

  return { success: true }
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
    // Basic attempt to extract city from address string
    const addr = request.address.toLowerCase();
    const city = addr.includes("manila") ? "Manila" :
      addr.includes("quezon city") ? "Quezon City" :
        addr.includes("makati") ? "Makati" :
          addr.includes("pasig") ? "Pasig" :
            addr.includes("taguig") ? "Taguig" :
              addr.includes("cebu") ? "Cebu City" :
                addr.includes("davao") ? "Davao City" :
                  addr.includes("cagayan de oro") || addr.includes("cdo") ? "Cagayan de Oro" : "Generic";

    const { error: insertError } = await supabase.from("shops").insert({
      name: request.shop_name,
      address: request.address,
      city: city,
      province: city === "Cagayan de Oro" ? "Misamis Oriental" : "Philippines",
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

export async function deleteServiceRequest(requestId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("service_requests").delete().eq("id", requestId)

  if (error) {
    console.error("Error deleting service request:", error)
    return { success: false, error: "Failed to delete request." }
  }

  revalidatePath('/admin')
  revalidatePath('/profile')
  return { success: true }
}

export async function updateServiceRequestStatus(requestId: string, status: 'pending' | 'on going' | 'completed') {
  const supabase = await createClient()
  const { error } = await supabase.from("service_requests").update({ status }).eq("id", requestId)

  if (error) {
    console.error("Error updating service request status:", error)
    return { success: false, error: "Failed to update status." }
  }

  revalidatePath('/admin')
  revalidatePath('/profile')
  return { success: true }
}
