'use client';

import Link from "next/link"
import { MaterialIcon } from "./material-icon"
import type { Shop } from "@/lib/types"

interface ShopCardProps {
  shop: Shop
  distance?: number | null
}

export function ShopCard({ shop, distance }: ShopCardProps) {
  const services = shop.services
    ? shop.services.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  return (
    <div className="glass-card shop-card-glow rounded-2xl overflow-hidden">
      <Link href={`/shops/${shop.id}`} className="block">
        <div className="p-5 pb-0">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-foreground font-extrabold text-xl tracking-tight flex-1">{shop.name}</h3>
            <div className="bg-midnight/80 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-foreground/10 shrink-0">
              {shop.is_verified && (
                <MaterialIcon name="verified" className="text-electric-blue text-[10px] mr-0.5" filled />
              )}
              <MaterialIcon name="star" className="text-turbo-orange text-xs" filled />
              <span className="text-foreground font-black text-xs">{Number(shop.rating).toFixed(1)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground mt-1 mb-4">
            <MaterialIcon name="location_on" className="text-sm" />
            <span className="text-xs font-semibold">
              {distance != null ? `${distance.toFixed(1)} km away` : ""}{" "}
              {shop.barangay ? `${shop.barangay}, ` : ""}
              {shop.city}
            </span>
          </div>
          {services.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {services.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-background border border-foreground/5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>

      <div className="p-5 pt-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/shops/${shop.id}`}
            className="flex-1 h-12 bg-turbo-orange orange-glow text-midnight font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            View Shop
          </Link>
          {shop.phone && (
            <a
              href={`tel:${shop.phone}`}
              className="w-12 h-12 flex items-center justify-center border border-foreground/10 rounded-xl text-foreground hover:bg-foreground/5 transition-colors"
              aria-label={`Call ${shop.name}`}
            >
              <MaterialIcon name="call" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
