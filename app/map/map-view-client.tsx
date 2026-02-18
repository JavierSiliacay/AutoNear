"use client"

import dynamic from "next/dynamic"
import type { Shop } from "@/lib/types"

const MapView = dynamic(() => import("./map-view").then((mod) => mod.MapView), {
    ssr: false,
    loading: () => (
        <div className="flex-1 bg-slate-900 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-turbo-orange"></div>
        </div>
    ),
})

export default function MapViewClient({ shops }: { shops: Shop[] }) {
    return <MapView shops={shops} />
}
