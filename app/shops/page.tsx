import { Suspense } from "react"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { ShopsList } from "./shops-list"
import { MaterialIcon } from "@/components/material-icon"

export default async function ShopsPage(props: {
  searchParams: Promise<{ city?: string; lat?: string; lng?: string; service?: string }>
}) {
  const searchParams = await props.searchParams

  return (
    <div className="min-h-screen pb-32">
      <AppHeader
        rightAction={
          <button className="text-foreground">
            <MaterialIcon name="tune" />
          </button>
        }
      />
      <main className="max-w-lg mx-auto px-5 pt-6">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-turbo-orange border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm mt-4">Loading shops...</p>
            </div>
          }
        >
          <ShopsList
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
