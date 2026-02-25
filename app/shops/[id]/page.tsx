import { notFound } from "next/navigation"
import Link from "next/link"
import { getShopById } from "@/lib/actions"
import { BottomNav } from "@/components/bottom-nav"
import { MaterialIcon } from "@/components/material-icon"
import { ServiceRequestForm } from "@/components/service-request-form"

export default async function ShopDetailPage(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ originLat?: string; originLng?: string }>
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const shop = await getShopById(params.id)

  if (!shop) {
    notFound()
  }

  const services = shop.services
    ? shop.services.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  const fullAddress = [shop.address, shop.barangay, shop.city, shop.province]
    .filter(Boolean)
    .join(", ")

  const origin = searchParams.originLat && searchParams.originLng
    ? `${searchParams.originLat},${searchParams.originLng}`
    : "";

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${shop.name}, ${fullAddress}`)}${origin ? `&origin=${origin}` : ""}`

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <header className="sticky top-0 z-50 glass">
        <div className="flex items-center justify-between px-5 h-16 max-w-lg mx-auto">
          <Link href="/shops" className="w-10 h-10 flex items-center justify-start text-foreground">
            <MaterialIcon name="arrow_back_ios" />
          </Link>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-turbo-orange uppercase tracking-[0.2em]">Shop Profile</span>
            <span className="text-sm font-bold text-foreground tracking-tight truncate max-w-[200px]">{shop.name}</span>
          </div>
          <div className="w-10 h-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto">
        <div className="px-5 pt-8 pb-4">
          <div className="flex flex-col gap-2">
            {shop.is_verified && (
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-electric-blue/10 text-electric-blue text-[9px] font-bold uppercase tracking-wider rounded border border-electric-blue/20">
                  Verified Partner
                </span>
                <div className="h-px flex-1 bg-foreground/10" />
              </div>
            )}
            <h1 className="text-3xl font-black text-foreground italic tracking-tighter uppercase leading-tight">
              {shop.name}
            </h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <MaterialIcon name="location_on" className="text-sm text-turbo-orange" />
              {shop.city}, {shop.province}
            </p>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="px-5 mt-4 flex items-center justify-between">
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{Number(shop.rating).toFixed(1)}</div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase">Rating</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{shop.review_count}</div>
              <div className="text-[9px] font-bold text-muted-foreground uppercase">Reviews</div>
            </div>
          </div>
          <div className="flex gap-2">
            {shop.phone && (
              <a
                href={`tel:${shop.phone}`}
                className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors"
                aria-label="Call shop"
              >
                <MaterialIcon name="call" />
              </a>
            )}
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-foreground hover:bg-foreground/5 transition-colors"
              aria-label="Get directions"
            >
              <MaterialIcon name="directions" />
            </a>
          </div>
        </div>

        {/* Description */}
        {shop.description && (
          <section className="mt-6 px-5">
            <p className="text-sm text-muted-foreground leading-relaxed">{shop.description}</p>
          </section>
        )}

        {/* Info Cards */}
        <section className="mt-6 px-5 flex flex-col gap-3">
          <div className="flex items-center gap-4 p-4 glass-card rounded-xl border border-foreground/5">
            <MaterialIcon name="location_on" className="text-turbo-orange" />
            <div>
              <p className="text-sm font-bold text-foreground">Address</p>
              <p className="text-[11px] text-muted-foreground">{fullAddress}</p>
            </div>
          </div>
          {shop.opening_hours && (
            <div className="flex items-center gap-4 p-4 glass-card rounded-xl border border-foreground/5">
              <MaterialIcon name="schedule" className="text-turbo-orange" />
              <div>
                <p className="text-sm font-bold text-foreground">Hours</p>
                <p className="text-[11px] text-muted-foreground">{shop.opening_hours}</p>
              </div>
            </div>
          )}
          {shop.phone && (
            <div className="flex items-center gap-4 p-4 glass-card rounded-xl border border-foreground/5">
              <MaterialIcon name="call" className="text-turbo-orange" />
              <div>
                <p className="text-sm font-bold text-foreground">Phone</p>
                <p className="text-[11px] text-muted-foreground">{shop.phone}</p>
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

        {/* Service Request Form */}
        <section className="mt-10 px-5">
          <ServiceRequestForm shopId={shop.id} shopServices={shop.services} />
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
