"use client"

import { useState, useEffect, useRef } from "react"
import { submitServiceRequest, getUserProfile } from "@/lib/actions"
import { createClient } from "@/lib/supabase/client"
import { MaterialIcon } from "./material-icon"
import { SERVICE_TYPES } from "@/lib/types"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { useSession } from "next-auth/react"

interface ServiceRequestFormProps {
  mechanicId: string
  mechanicServices: string
  mechanicPreferences?: ('Home Service' | 'On Shop')[]
  availableDays?: string[]
}

function formatPhoneNumber(rawInput: string) {
  let raw = rawInput.replace(/\D/g, "");
  if (raw.startsWith("0")) {
    if (raw.length > 11) raw = raw.slice(0, 11);
  } else if (raw.startsWith("63")) {
    if (raw.length > 12) raw = raw.slice(0, 12);
  }
  let formatted = raw;
  if (raw.startsWith("09")) {
    if (raw.length > 4) {
      formatted = raw.slice(0, 4) + "-" + raw.slice(4, 7);
      if (raw.length > 7) {
        formatted += "-" + raw.slice(7, 11);
      }
    }
  }
  return formatted;
}

export function ServiceRequestForm({ 
  mechanicId, 
  mechanicServices, 
  mechanicPreferences = ['Home Service', 'On Shop'],
  availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
}: ServiceRequestFormProps) {
  const { data: nextAuthSession } = useSession()
  const [customerName, setCustomerName] = useState("")
  const [vehicleInfo, setVehicleInfo] = useState("")
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [serviceError, setServiceError] = useState("")
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [dateError, setDateError] = useState("")
  const [activeBooking, setActiveBooking] = useState<{ id: string; status: string } | null>(null)
  const [checkingActive, setCheckingActive] = useState(true)
  const serviceSectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function initFormAndCheckBooking() {
      try {
        const supabase = createClient()
        let activeEmail = nextAuthSession?.user?.email;
        let initialName = nextAuthSession?.user?.name || "";
        let initialPhone = "";
        let initialVehicle = "";

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          if (!activeEmail) activeEmail = user.email;
          if (!initialName) initialName = user.user_metadata?.full_name || user.user_metadata?.name || "";
          if (!initialPhone && user.user_metadata?.phone) initialPhone = user.user_metadata.phone;
          if (!initialVehicle && user.user_metadata?.vehicle_info) initialVehicle = user.user_metadata.vehicle_info;
        }

        if (activeEmail) {
          // 1. Check local storage saved car owner profile
          try {
            const localSaved = localStorage.getItem(`tarafix_owner_profile_${activeEmail}`);
            if (localSaved) {
              const parsed = JSON.parse(localSaved);
              if (!initialName && parsed.full_name) initialName = parsed.full_name;
              if (!initialPhone && parsed.phone) initialPhone = parsed.phone;
              if (!initialVehicle && parsed.vehicle_info) initialVehicle = parsed.vehicle_info;
            }
          } catch {}

          // 2. Fetch server database profile
          try {
            const dbProfile = await getUserProfile(activeEmail);
            if (dbProfile) {
              if (!initialName && dbProfile.full_name) initialName = dbProfile.full_name;
              if (!initialPhone && dbProfile.phone) initialPhone = dbProfile.phone;
              if (!initialVehicle && dbProfile.vehicle_info) initialVehicle = dbProfile.vehicle_info;
            }
          } catch {}

          // Check active booking in progress
          const activeStatuses = ['pending', 'accepted', 'on_my_way', 'arrived', 'in_progress']
          const { data: bookings } = await supabase
            .from("service_requests")
            .select("id, status")
            .eq("mechanic_id", mechanicId)
            .ilike("customer_email", activeEmail.toLowerCase().trim())
            .in("status", activeStatuses)
            .order("created_at", { ascending: false })
            .limit(1)

          if (bookings && bookings.length > 0) {
            setActiveBooking(bookings[0])
          }
        }

        if (initialName) setCustomerName(initialName);
        if (initialPhone) setPhone(formatPhoneNumber(initialPhone));
        if (initialVehicle) setVehicleInfo(initialVehicle);
      } catch (err) {
        console.error("Error checking active booking:", err)
      } finally {
        setCheckingActive(false)
      }
    }

    initFormAndCheckBooking()
  }, [mechanicId, nextAuthSession])

  const toggleService = (svc: string) => {
    setSelectedServices(prev => {
      const next = prev.includes(svc) 
        ? prev.filter(s => s !== svc) 
        : [...prev, svc];
      if (next.length > 0) setServiceError("");
      return next;
    });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Get digits only
    let raw = e.target.value.replace(/\D/g, "");
    
    // Handle PH Mobile Format (09...)
    if (raw.startsWith("0")) {
      if (raw.length > 11) raw = raw.slice(0, 11);
    } else if (raw.startsWith("63")) {
      if (raw.length > 12) raw = raw.slice(0, 12);
    }
    
    // Auto-formatting Logic (09XX-XXX-XXXX)
    let formatted = raw;
    if (raw.startsWith("09")) {
      if (raw.length > 4) {
        formatted = raw.slice(0, 4) + "-" + raw.slice(4, 7);
        if (raw.length > 7) {
          formatted += "-" + raw.slice(7, 11);
        }
      }
    } else if (raw.startsWith("639")) {
      if (raw.length > 5) {
        formatted = raw.slice(0, 5) + "-" + raw.slice(5, 8);
        if (raw.length > 8) {
          formatted += "-" + raw.slice(8, 12);
        }
      }
    }

    setPhone(formatted);

    // Immediate Validation (Regex against raw digits)
    const phMobileRegexRaw = /^(09|639)\d{9}$/;
    if (raw.length > 0) {
      if (!phMobileRegexRaw.test(raw)) {
        if (!raw.startsWith("09") && !raw.startsWith("639")) {
          setPhoneError("Start with 09 or 639");
        } else if (raw.length < 11) {
          setPhoneError("Number incomplete");
        } else {
          setPhoneError("Invalid format");
        }
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
  }

  const handleSubmit = async (formData: FormData) => {
    // 1. Mandatory Service Needed Multi-Select Check & Auto-Scroll
    if (selectedServices.length === 0) {
      setServiceError("Please select at least 1 service needed to proceed");
      if (serviceSectionRef.current) {
        serviceSectionRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setServiceError("");

    // 2. Final check on raw phone digits
    const raw = phone.replace(/\D/g, "");
    const phMobileRegexRaw = /^(09|639)\d{9}$/;
    
    if (!phMobileRegexRaw.test(raw)) {
      setPhoneError("Please enter a valid PH mobile number");
      return;
    }

    // 3. Validate Date
    if (selectedDate && availableDays.length > 0) {
      const date = new Date(selectedDate);
      const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
      if (!availableDays.includes(dayName)) {
        setDateError(`Mechanic is not available on ${dayName}s`);
        return;
      }
    }
    setDateError("");

    // Set cleaned values in FormData
    formData.set("service_type", selectedServices.join(", "));
    formData.set("customer_phone", raw);
    if (selectedDate) {
      formData.set("scheduled_date", format(selectedDate, "yyyy-MM-dd"));
    }

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

  if (activeBooking) {
    return (
      <div className="glass-card rounded-3xl p-8 border-electric-blue/30 text-center bg-electric-blue/5 relative overflow-hidden">
        <div className="w-16 h-16 bg-electric-blue/10 rounded-2xl flex items-center justify-center text-electric-blue mx-auto mb-4 border border-electric-blue/20 shadow-[0_0_30px_rgba(0,233,163,0.2)]">
          <MaterialIcon name="pending_actions" className="text-3xl" />
        </div>
        <span className="text-[10px] font-black text-electric-blue uppercase tracking-[0.2em] bg-electric-blue/10 px-3 py-1 rounded-full border border-electric-blue/20">
          Active Booking in Progress
        </span>
        <h4 className="text-foreground font-black uppercase tracking-tight text-lg mt-3 mb-2">
          Request Already in Progress
        </h4>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto mb-6 font-medium">
          You already have an active request (<span className="text-electric-blue font-bold uppercase">{activeBooking.status.replace(/_/g, " ")}</span>) with this mechanic. You cannot book again until the current job is completed or cancelled.
        </p>
        <Link href={`/profile?request_id=${activeBooking.id}&chat=true`}>
          <button className="h-14 px-8 bg-electric-blue text-midnight font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-electric-blue/20 cursor-pointer">
            View Chat & Status
          </button>
        </Link>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="glass-card p-8 rounded-3xl border border-foreground/10 text-center">
        <div className="w-16 h-16 bg-turbo-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MaterialIcon name="check_circle" className="text-4xl text-turbo-orange" />
        </div>
        <h3 className="text-xl font-black text-foreground italic mb-2">REQUEST SENT</h3>
        <p className="text-muted-foreground text-sm">
          The mechanic will contact you soon. Salamat!
        </p>
      </div>
    )
  }

  const availableServices = mechanicServices
    ? mechanicServices.split(",").map((s) => s.trim()).filter(Boolean)
    : [...SERVICE_TYPES]

  return (
    <div className="glass-card p-8 rounded-3xl border border-foreground/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-turbo-orange/5 blur-3xl rounded-full" />
      <h3 className="text-xl font-black text-foreground italic mb-6 text-center">REQUEST SERVICE</h3>
      <form action={handleSubmit} className="flex flex-col gap-5">
        <input type="hidden" name="mechanic_id" value={mechanicId} />
        <input type="hidden" name="customer_phone" value={phone} />

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Your Name *
          </label>
          <input
            name="customer_name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
            placeholder="Juan Dela Cruz"
            className="w-full h-14 bg-background/80 border border-foreground/10 rounded-xl px-4 text-foreground text-sm focus:ring-2 focus:ring-turbo-orange focus:outline-none transition-all placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Phone Number *
            </label>
            {phoneError && <span className="text-[9px] font-bold text-red-500 animate-pulse">{phoneError}</span>}
          </div>
          <input
            value={phone}
            onChange={handlePhoneChange}
            required
            type="tel"
            placeholder="09XX XXX XXXX"
            className={`w-full h-14 bg-background/80 border rounded-xl px-4 text-foreground text-sm focus:ring-2 focus:outline-none transition-all placeholder:text-muted-foreground ${
              phoneError ? "border-red-500/50 focus:ring-red-500/30" : "border-foreground/10 focus:ring-turbo-orange"
            }`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Vehicle Info *
          </label>
          <input
            name="vehicle_info"
            value={vehicleInfo}
            onChange={(e) => setVehicleInfo(e.target.value)}
            required
            placeholder="e.g. Toyota Vios 2019"
            className="w-full h-14 bg-background/80 border border-foreground/10 rounded-xl px-4 text-foreground text-sm focus:ring-2 focus:ring-turbo-orange focus:outline-none transition-all placeholder:text-muted-foreground"
          />
        </div>

        {/* Multi-Select Service Needed */}
        <div 
          ref={serviceSectionRef}
          id="service-needed-section"
          className={cn(
            "flex flex-col gap-2.5 p-3.5 -mx-3.5 rounded-2xl transition-all duration-300 scroll-mt-20",
            serviceError 
              ? "bg-red-500/10 border-2 border-red-500/60 shadow-[0_0_30px_rgba(239,68,68,0.25)] ring-4 ring-red-500/20" 
              : "border border-transparent"
          )}
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Service Needed *
              </label>
              <span className="text-[9px] text-muted-foreground font-normal">(Select 1 or more)</span>
            </div>
            {serviceError ? (
              <span className="text-[9px] font-bold text-red-500 animate-pulse">{serviceError}</span>
            ) : selectedServices.length > 0 ? (
              <span className="text-[9px] font-black uppercase text-turbo-orange bg-turbo-orange/10 px-2 py-0.5 rounded-full border border-turbo-orange/20">
                {selectedServices.length} Selected
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {availableServices.map((svc) => {
              const isSelected = selectedServices.includes(svc);
              return (
                <button
                  key={svc}
                  type="button"
                  onClick={() => toggleService(svc)}
                  className={cn(
                    "p-3.5 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between gap-2 cursor-pointer",
                    isSelected
                      ? "bg-turbo-orange/15 border-turbo-orange text-white shadow-[0_0_15px_rgba(255,95,0,0.2)] scale-[1.01]"
                      : serviceError
                        ? "bg-background/80 border-red-500/30 text-muted-foreground hover:border-turbo-orange/50 hover:text-foreground"
                        : "bg-background/80 border-foreground/10 text-muted-foreground hover:border-turbo-orange/50 hover:text-foreground"
                  )}
                >
                  <span className="truncate">{svc}</span>
                  <div className={cn(
                    "w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all",
                    isSelected 
                      ? "bg-turbo-orange border-turbo-orange text-midnight" 
                      : "border-foreground/20 bg-background/50 text-transparent"
                  )}>
                    <MaterialIcon name="check" className="text-xs font-black" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Service Preference *
          </label>
          <select
            name="service_preference"
            required
            className="w-full h-14 bg-background/80 border border-foreground/10 rounded-xl px-4 text-foreground text-sm focus:ring-2 focus:ring-turbo-orange focus:outline-none transition-all appearance-none"
          >
            <option value="">Select preference</option>
            {mechanicPreferences.map(pref => (
              <option key={pref} value={pref}>{pref}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Preferred Date *
            </label>
            {dateError && <span className="text-[9px] font-bold text-red-500 animate-pulse">{dateError}</span>}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full h-14 justify-start text-left font-normal bg-background/80 border-foreground/10 rounded-xl px-4 hover:bg-background/90 transition-all",
                  !selectedDate && "text-muted-foreground",
                  dateError && "border-red-500/50"
                )}
              >
                <div className="flex items-center gap-2">
                  <MaterialIcon name="calendar_today" className="text-turbo-orange text-lg" />
                  <span className="text-sm">
                    {selectedDate ? format(selectedDate, "PPP") : "Select a booking date"}
                  </span>
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-white/10 bg-midnight/95 backdrop-blur-xl" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setDateError("");
                }}
                disabled={(date) => {
                  // Disable past dates
                  if (date < new Date(new Date().setHours(0,0,0,0))) return true;
                  
                  // Check mechanic's available days
                  if (availableDays.length > 0) {
                    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
                    return !availableDays.includes(dayName);
                  }
                  return false;
                }}
                initialFocus
                className="rounded-xl border-white/5"
              />
            </PopoverContent>
          </Popover>
          <p className="text-[9px] text-muted-foreground px-1 flex items-center gap-1">
            <MaterialIcon name="info" className="text-[10px] text-electric-blue" />
            Available on: {availableDays.join(", ")}
          </p>
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
          {loading && <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin" />}
          <span>{loading ? "Sending..." : "Send Request"}</span>
          {!loading && <MaterialIcon name="bolt" className="font-bold" />}
        </button>
      </form>
    </div>
  )
}
