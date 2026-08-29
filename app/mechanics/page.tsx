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
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 animate-in">
        <header className="mb-8 lg:mb-10">
          <span className="text-turbo-orange font-black text-[10px] uppercase tracking-[0.4em] bg-turbo-orange/10 px-3 py-1 rounded-full border border-turbo-orange/20 inline-block mb-2">
            TaraFix Network
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tighter mt-1 uppercase italic">
            EXPERT <span className="text-electric-blue">MECHANICS</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm font-medium mt-2 max-w-xl">
            Expert, freelance mechanics available for home service and roadside assistance.
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
