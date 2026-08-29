import { notFound } from "next/navigation"
import Link from "next/link"
import { getMechanicById, getReviewsByMechanicId } from "@/lib/actions"
import { createClient } from "@/lib/supabase/server"
import { BottomNav } from "@/components/bottom-nav"
import { MaterialIcon } from "@/components/material-icon"
import { ServiceRequestForm } from "@/components/service-request-form"
import { AvailabilityStatus } from "@/components/availability-status"

export const dynamic = "force-dynamic"

export default async function MechanicDetailPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ originLat?: string; originLng?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const mechanic = await getMechanicById(params.id)
  const reviews = await getReviewsByMechanicId(params.id)

  if (!mechanic) {
    notFound()
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userEmail = user?.email?.toLowerCase().trim() || ""
  const mechanicEmail = mechanic.email?.toLowerCase().trim() || ""

  const isOwnProfile = Boolean(userEmail && mechanicEmail && userEmail === mechanicEmail)

  let activeBooking = null
  if (userEmail && !isOwnProfile) {
    const activeStatuses = ['pending', 'accepted', 'on_my_way', 'arrived', 'in_progress']
    const { data: bookings } = await supabase
      .from("service_requests")
      .select("id, status, service_type, created_at")
      .eq("mechanic_id", mechanic.id)
      .ilike("customer_email", userEmail)
      .in("status", activeStatuses)
      .order("created_at", { ascending: false })
      .limit(1)

    if (bookings && bookings.length > 0) {
      activeBooking = bookings[0]
    }
  }

  const services = mechanic.specializations || []

  const origin = searchParams.originLat && searchParams.originLng
    ? `${searchParams.originLat},${searchParams.originLng}`
    : "";

  const directionsUrl = mechanic.latitude && mechanic.longitude
    ? `https://www.google.com/maps?q=${mechanic.latitude},${mechanic.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${mechanic.name}, ${mechanic.city}, ${mechanic.province}`)}${origin ? `&origin=${origin}` : ""}`;

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="flex items-center justify-between px-5 h-16 max-w-lg mx-auto">
          <Link href="/mechanics" className="w-10 h-10 flex items-center justify-start text-foreground">
            <MaterialIcon name="arrow_back_ios" />
          </Link>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-turbo-orange uppercase tracking-[0.2em]">Mechanic Profile</span>
            <span className="text-sm font-bold text-foreground tracking-tight truncate max-w-[200px]">{mechanic.name}</span>
          </div>
          <div className="w-10 h-10" />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 animate-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Mechanic Details, Bio, Services & Reviews */}
          <div className="lg:col-span-7 space-y-8">
            {/* Header / Profile Hero Card */}
            <div className="glass-card rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-white/10 shadow-2xl">
              <div className="flex flex-col gap-6">
                {mechanic.is_verified && (
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-electric-blue/10 text-electric-blue text-[10px] font-black uppercase tracking-wider rounded-full border border-electric-blue/20">
                      Verified Mechanic
                    </span>
                    <div className="h-px flex-1 bg-foreground/10" />
                  </div>
                )}
                <div className="flex items-center gap-5">
                  {mechanic.image_url ? (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-2 border-turbo-orange/30 shadow-lg shrink-0">
                      <img src={mechanic.image_url} alt={mechanic.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800 flex items-center justify-center text-3xl overflow-hidden border border-white/10 shrink-0">
                      <MaterialIcon name="person" className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground italic tracking-tighter uppercase leading-tight truncate">
                      {mechanic.name}
                    </h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mt-1 mb-3">
                      <MaterialIcon name="location_on" className="text-sm text-turbo-orange" />
                      {mechanic.city}, {mechanic.province}
                    </p>
                    <div className="flex">
                      <AvailabilityStatus initialStatus={mechanic.is_available} mechanicId={mechanic.id} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats & Actions */}
              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex gap-8">
                  <div>
                    <div className="text-xl font-black text-foreground flex items-center gap-1">
                      <MaterialIcon name="star" className="text-sm text-turbo-orange" filled />
                      {Number(mechanic.rating).toFixed(1)}
                    </div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rating</div>
                  </div>
                  <div>
                    <div className="text-xl font-black text-foreground">{mechanic.review_count}</div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Reviews</div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {mechanic.phone && (
                    <a
                      href={`tel:${mechanic.phone}`}
                      className="h-12 px-4 glass-card rounded-xl flex items-center gap-2 text-foreground hover:border-turbo-orange/40 transition-all font-bold text-xs uppercase tracking-wider"
                      aria-label="Call mechanic"
                    >
                      <MaterialIcon name="call" className="text-turbo-orange" />
                      <span className="hidden sm:inline">Call</span>
                    </a>
                  )}
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-12 px-4 glass-card rounded-xl flex items-center gap-2 text-foreground hover:border-electric-blue/40 transition-all font-bold text-xs uppercase tracking-wider"
                    aria-label="View in Google Maps"
                    title="View in Google Maps"
                  >
                    <MaterialIcon name="directions" className="text-electric-blue" />
                    <span className="hidden sm:inline">Directions</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bio / Description */}
            {mechanic.bio && (
              <section className="glass-card rounded-3xl p-6 sm:p-8 border border-white/5">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">About Mechanic</h3>
                <p className="text-sm text-foreground/80 leading-relaxed font-medium">{mechanic.bio}</p>
              </section>
            )}

            {/* Services Offered */}
            {mechanic.specializations && mechanic.specializations.length > 0 && (
              <section className="glass-card rounded-3xl p-6 sm:p-8 border border-white/5">
                <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Specialized Services</h3>
                <div className="flex flex-wrap gap-2.5">
                  {mechanic.specializations.map((spec) => (
                    <span key={spec} className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold text-foreground uppercase tracking-wider">
                      {spec}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews Section */}
            <section className="glass-card rounded-3xl p-6 sm:p-8 border border-white/5">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                Customer Reviews
                <span className="text-[10px] bg-white/5 px-2.5 py-1 rounded-full border border-white/5">{reviews.length} Total</span>
              </h3>
              
              {reviews.length === 0 ? (
                <div className="p-8 text-center opacity-40">
                  <MaterialIcon name="rate_review" className="text-3xl mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest">No reviews yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {reviews.map((review) => (
                    <div key={review.id} className="group">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 shrink-0">
                          {review.customer_avatar_url ? (
                            <img src={review.customer_avatar_url} alt={review.customer_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center text-xs font-black">{review.customer_name[0]}</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-black text-foreground uppercase tracking-tight">{review.customer_name}</h4>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <MaterialIcon 
                                  key={i} 
                                  filled={i < review.rating}
                                  name="star" 
                                  className={`text-xs ${i < review.rating ? 'text-turbo-orange' : 'text-white/10'}`} 
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5 italic">
                            {new Date(review.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-xs text-foreground/80 leading-relaxed pl-12">{review.comment}</p>
                      )}
                      <div className="h-px w-full bg-white/5 mt-6" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Sticky Booking / Status Card on Desktop */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            {isOwnProfile ? (
              <div className="glass-card rounded-3xl p-8 border-turbo-orange/30 text-center bg-turbo-orange/5 relative overflow-hidden shadow-2xl">
                <div className="w-16 h-16 bg-turbo-orange/10 rounded-2xl flex items-center justify-center text-turbo-orange mx-auto mb-4 border border-turbo-orange/20 shadow-[0_0_30px_rgba(255,95,0,0.2)]">
                  <MaterialIcon name="person" className="text-3xl" />
                </div>
                <span className="text-[10px] font-black text-turbo-orange uppercase tracking-[0.2em] bg-turbo-orange/10 px-3 py-1 rounded-full border border-turbo-orange/20">
                  Your Public Profile
                </span>
                <h4 className="text-foreground font-black uppercase tracking-tight text-lg mt-3 mb-2">
                  Viewing Your Own Listing
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto mb-6">
                  This is how motorists see your profile. You cannot book service requests for yourself.
                </p>
                <Link href="/profile">
                  <button className="h-14 px-8 bg-turbo-orange text-midnight font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-turbo-orange/20 cursor-pointer w-full">
                    Go to Dashboard & Queue
                  </button>
                </Link>
              </div>
            ) : activeBooking ? (
              <div className="glass-card rounded-3xl p-8 border-electric-blue/30 text-center bg-electric-blue/5 relative overflow-hidden shadow-2xl">
                <div className="w-16 h-16 bg-electric-blue/10 rounded-2xl flex items-center justify-center text-electric-blue mx-auto mb-4 border border-electric-blue/20 shadow-[0_0_30px_rgba(0,233,163,0.2)]">
                  <MaterialIcon name="pending_actions" className="text-3xl" />
                </div>
                <span className="text-[10px] font-black text-electric-blue uppercase tracking-[0.2em] bg-electric-blue/10 px-3 py-1 rounded-full border border-electric-blue/20">
                  Active Booking in Progress
                </span>
                <h4 className="text-foreground font-black uppercase tracking-tight text-lg mt-3 mb-2">
                  Request Already in Progress
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto mb-6">
                  You already have an active request ({activeBooking.status.replace(/_/g, " ")}) with this mechanic. You cannot book again until the current job is completed or cancelled.
                </p>
                <Link href="/profile">
                  <button className="h-14 px-8 bg-electric-blue text-midnight font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-electric-blue/20 cursor-pointer w-full">
                    View Chat & Status
                  </button>
                </Link>
              </div>
            ) : mechanic.is_available ? (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
                <h3 className="text-lg font-black text-foreground italic uppercase tracking-tight mb-1">
                  Book Service with {mechanic.name.split(' ')[0]}
                </h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Submit your vehicle details to get transparent digital quotes.
                </p>
                <ServiceRequestForm 
                  mechanicId={mechanic.id} 
                  mechanicServices={services.join(", ")} 
                  mechanicPreferences={mechanic.service_preference}
                  availableDays={mechanic.available_days}
                />
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-8 border-red-500/20 text-center bg-red-500/5 shadow-2xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
                  <MaterialIcon name="do_not_disturb_on" className="text-3xl" />
                </div>
                <h4 className="text-foreground font-black uppercase tracking-tight mb-2">Mechanic is Offline</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                  This mechanic is currently not accepting new bookings. Please check back later or find another pro on the map.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
