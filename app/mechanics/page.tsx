import { Suspense } from "react"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { MechanicsList } from "./mechanics-list"
import { MaterialIcon } from "@/components/material-icon"

export const dynamic = "force-dynamic"

export default async function MechanicsPage(props: {
  searchParams: Promise<{ city?: string; lat?: string; lng?: string; service?: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="min-h-screen pb-32">
      <AppHeader
        rightAction={
          <button className="text-foreground h-10 w-10 flex items-center justify-center rounded-xl glass border border-white/10">
            <MaterialIcon name="tune" />
          </button>
        }
      />
      
      <main className="max-w-lg mx-auto px-5 pt-6 animate-in">
        <header className="mb-8">
          <span className="text-turbo-orange font-black text-[10px] uppercase tracking-[0.4em]">TaraFix Network</span>
          <h1 className="text-4xl font-black text-foreground tracking-tighter mt-1">
            EXPERT <span className="text-electric-blue">MECHANICS</span>
          </h1>
          <p className="text-muted-foreground text-xs font-medium mt-2">
            Professional mechanics available for on-site assistance.
          </p>
        </header>

        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-12 h-12 border-4 border-turbo-orange border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground font-black text-[10px] uppercase tracking-[0.2em] mt-6">Loading Marketplace...</p>
            </div>
          }
        >
          <MechanicsList
            city={searchParams.city}
            lat={searchParams.lat ? parseFloat(searchParams.lat) : undefined}
            lng={searchParams.lng ? parseFloat(searchParams.lng) : undefined}
            service={searchParams.service}
          />
        </Suspense>
      </main>
      
      <BottomNav />
    </div>
  )
}
