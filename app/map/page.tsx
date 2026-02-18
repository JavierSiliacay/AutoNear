import Link from "next/link"
import { getShops } from "@/lib/actions"
import { BottomNav } from "@/components/bottom-nav"
import { MaterialIcon } from "@/components/material-icon"
import MapViewClient from "./map-view-client"

export default async function MapPage() {
  const shops = await getShops()

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-[2000] px-4 pt-12 pb-4">
        <div className="max-w-lg mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-turbo-orange rounded flex items-center justify-center text-midnight">
                <MaterialIcon name="minor_crash" className="font-bold text-xl" />
              </div>
              <span className="text-foreground font-extrabold text-lg tracking-tight italic">AutoNear</span>
            </Link>

            <Link
              href="/shops"
              className="w-10 h-10 glass rounded-full flex items-center justify-center text-foreground hover:bg-white/10 transition-colors shadow-2xl"
            >
              <MaterialIcon name="close" />
            </Link>
          </div>
        </div>
      </header>

      <MapViewClient shops={shops} />

      <BottomNav />
    </div>
  )
}
