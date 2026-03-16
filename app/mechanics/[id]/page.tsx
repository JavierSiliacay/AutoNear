import { notFound } from "next/navigation"
import Link from "next/link"
import { getMechanicById, getReviewsByMechanicId } from "@/lib/actions"
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

      <main className="max-w-lg mx-auto">
        <div className="px-5 pt-8 pb-4">
          <div className="flex flex-col gap-2">
            {mechanic.is_verified && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-electric-blue/10 text-electric-blue text-[9px] font-bold uppercase tracking-wider rounded border border-electric-blue/20">
                  Verified Mechanic
                </span>
                <div className="h-px flex-1 bg-foreground/10" />
              </div>
            )}
            <div className="flex items-center gap-4">
              {mechanic.image_url && (
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-turbo-orange/30 shadow-lg shrink-0">
                  <img src={mechanic.image_url} alt={mechanic.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
              )}
              <div className="flex flex-col">
                <h1 className="text-3xl font-black text-foreground italic tracking-tighter uppercase leading-tight">
                  {mechanic.name}
                </h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-3">
                  <MaterialIcon name="location_on" className="text-sm text-turbo-orange" />
                  {mechanic.city}, {mechanic.province}
                </p>
                <div className="flex">
                  <AvailabilityStatus initialStatus={mechanic.is_available} mechanicId={mechanic.id} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="px-5 mt-4 flex items-center justify-between">
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{Number(mechanic.rating).toFixed(1)}</div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{mechanic.review_count}</div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase">Reviews</div>
            </div>
          </div>
          <div className="flex gap-2">
            {mechanic.phone && (
              <a
                href={`tel:${mechanic.phone}`}
                className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors"
                aria-label="Call mechanic"
              >
                <MaterialIcon name="call" />
              </a>
            )}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors"
              aria-label="View in Google Maps"
              title="View in Google Maps"
            >
              <MaterialIcon name="directions" />
            </a>
          </div>
        </div>

        {/* Bio / Description */}
        {mechanic.bio && (
          <section className="mt-6 px-5">
            <p className="text-sm text-muted-foreground leading-relaxed">{mechanic.bio}</p>
          </section>
        )}

        {/* Info Cards */}
        <section className="mt-6 px-5 flex flex-col gap-3">
          <div className="flex items-center gap-4 p-4 glass-card rounded-xl border border-foreground/5">
            <MaterialIcon name="schedule" className="text-turbo-orange" />
            <div>
              <p className="text-sm font-bold text-foreground">Status</p>
              <p className="text-[11px] text-muted-foreground">{mechanic.is_available ? "Available Now" : "Currently Offline"}</p>
            </div>
          </div>
          {mechanic.phone && (
            <div className="flex items-center gap-4 p-4 glass-card rounded-xl border border-foreground/5">
              <MaterialIcon name="call" className="text-turbo-orange" />
              <div>
                <p className="text-sm font-bold text-foreground">Phone</p>
                <p className="text-[11px] text-muted-foreground">{mechanic.phone}</p>
              </div>
            </div>
          )}
        </section>

        {/* Services */}
        {services.length > 0 && (
          <section className="mt-8 px-5">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">
              Services Offered
            </h3>
            <div className="flex flex-col gap-3">
              {services.map((svc) => (
                <div
                  key={svc}
                  className="flex items-center gap-4 p-4 glass-card rounded-xl border border-foreground/5"
                >
                  <MaterialIcon name="settings_suggest" className="text-turbo-orange" />
                  <p className="text-sm font-bold text-foreground">{svc}</p>
                </div>
              ))}
            </div>
          </section>
        )}
        {/* Reviews Section */}
        <section className="mt-10 px-5">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                Customer Reviews
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded border border-white/5">{reviews.length} Total</span>
            </h3>
            
            {reviews.length === 0 ? (
                <div className="p-8 glass-card rounded-2xl border-white/5 text-center opacity-30">
                    <MaterialIcon name="rate_review" className="text-3xl mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">No reviews yet</p>
                </div>
            ) : (
                <div className="flex flex-col gap-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="group">
                             <div className="flex items-start gap-3 mb-2">
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                                    {review.customer_avatar_url ? (
                                        <img src={review.customer_avatar_url} alt={review.customer_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-[10px] font-black">{review.customer_name[0]}</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[11px] font-black text-foreground uppercase tracking-tight">{review.customer_name}</h4>
                                        <div className="flex">
                                            {[...Array(5)].map((_, i) => (
                                                <MaterialIcon 
                                                    key={i} 
                                                    filled={i < review.rating}
                                                    name="star" 
                                                    className={`text-[12px] ${i < review.rating ? 'text-turbo-orange' : 'text-white/10'}`} 
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
                                <p className="text-xs text-foreground/80 leading-relaxed pl-11">{review.comment}</p>
                             )}
                             <div className="h-px w-full bg-white/5 mt-6" />
                        </div>
                    ))}
                </div>
            )}
        </section>

        {/* Service Request Form */}
        <section className="mt-10 px-5">
          {mechanic.is_available ? (
            <ServiceRequestForm mechanicId={mechanic.id} mechanicServices={services.join(", ")} />
          ) : (
            <div className="glass-card rounded-2xl p-8 border-red-500/20 text-center bg-red-500/5">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4">
                    <MaterialIcon name="do_not_disturb_on" className="text-3xl" />
                </div>
                <h4 className="text-foreground font-black uppercase tracking-tight mb-2">Mechanic is Offline</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">
                    This mechanic is currently not accepting new bookings. Please check back later or find another pro on the map.
                </p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
