"use client"

import { useState } from "react"
import { submitServiceRequest } from "@/lib/actions"
import { MaterialIcon } from "./material-icon"
import { SERVICE_TYPES } from "@/lib/types"

interface ServiceRequestFormProps {
  shopId: string
  shopServices: string
}

export function ServiceRequestForm({ shopId, shopServices }: ServiceRequestFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (formData: FormData) => {
    setLoading(true)
    setError("")
    const result = await submitServiceRequest(formData)
    setLoading(false)
    if (result.success) {
      setSubmitted(true)
    } else {
      setError(result.error || "Something went wrong.")
    }
  }

  if (submitted) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-foreground/10 text-center">
        <div className="w-16 h-16 bg-turbo-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MaterialIcon name="check_circle" className="text-4xl text-turbo-orange" />
        </div>
        <h3 className="text-xl font-black text-foreground italic mb-2">REQUEST SENT</h3>
        <p className="text-muted-foreground text-sm">
          The shop will contact you soon. Salamat!
        </p>
      </div>
    )
  }

  const availableServices = shopServices
    ? shopServices.split(",").map((s) => s.trim()).filter(Boolean)
    : [...SERVICE_TYPES]

  return (
    <div className="glass-card p-8 rounded-3xl border border-foreground/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-turbo-orange/5 blur-3xl rounded-full" />
      <h3 className="text-xl font-black text-foreground italic mb-6 text-center">REQUEST SERVICE</h3>
      <form action={handleSubmit} className="flex flex-col gap-5">
        <input type="hidden" name="shop_id" value={shopId} />

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Your Name *
          </label>
          <input
            name="customer_name"
            required
            placeholder="Juan Dela Cruz"
            className="w-full h-14 bg-background/80 border border-foreground/10 rounded-xl px-4 text-foreground text-sm focus:ring-2 focus:ring-turbo-orange focus:outline-none transition-all placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Phone Number *
          </label>
          <input
            name="customer_phone"
            required
            type="tel"
            placeholder="09XX XXX XXXX"
            className="w-full h-14 bg-background/80 border border-foreground/10 rounded-xl px-4 text-foreground text-sm focus:ring-2 focus:ring-turbo-orange focus:outline-none transition-all placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Vehicle Info
          </label>
          <input
            name="vehicle_info"
            placeholder="e.g. Toyota Vios 2019"
            className="w-full h-14 bg-background/80 border border-foreground/10 rounded-xl px-4 text-foreground text-sm focus:ring-2 focus:ring-turbo-orange focus:outline-none transition-all placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Service Needed
          </label>
          <select
            name="service_type"
            className="w-full h-14 bg-background/80 border border-foreground/10 rounded-xl px-4 text-foreground text-sm focus:ring-2 focus:ring-turbo-orange focus:outline-none transition-all appearance-none"
          >
            <option value="">Select a service</option>
            {availableServices.map((svc) => (
              <option key={svc} value={svc}>{svc}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Message (Optional)
          </label>
          <textarea
            name="message"
            rows={3}
            placeholder="Describe what you need..."
            className="w-full bg-background/80 border border-foreground/10 rounded-xl px-4 py-3 text-foreground text-sm focus:ring-2 focus:ring-turbo-orange focus:outline-none transition-all resize-none placeholder:text-muted-foreground"
          />
        </div>

        {error && <p className="text-destructive text-xs text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-16 bg-turbo-orange orange-glow text-midnight font-black uppercase tracking-[0.15em] rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-95 disabled:opacity-60"
        >
          <span>{loading ? "Sending..." : "Send Request"}</span>
          <MaterialIcon name="bolt" className="font-bold" />
        </button>
      </form>
    </div>
  )
}
