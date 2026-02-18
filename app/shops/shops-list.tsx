"use client"

import { useEffect, useState, useCallback } from "react"
import useSWR from "swr"
import Link from "next/link"
import { ShopCard } from "@/components/shop-card"
import { MaterialIcon } from "@/components/material-icon"
import { SERVICE_TYPES, getDistanceKm } from "@/lib/types"
import type { Shop } from "@/lib/types"

async function fetchShops(url: string): Promise<Shop[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch shops")
  return res.json()
}

interface ShopsListProps {
  city?: string
  lat?: number
  lng?: number
  service?: string
}

import { JoinNetworkForm } from "@/components/join-network-form"

export function ShopsList({ city, lat, lng, service: initialService }: ShopsListProps) {
  const [search, setSearch] = useState("")
  const [activeService, setActiveService] = useState(initialService || "")

  const queryParams = new URLSearchParams()
  if (city) queryParams.set("city", city)
  if (activeService) queryParams.set("service", activeService)

  const { data: shops = [], isLoading } = useSWR<Shop[]>(
    `/api/shops?${queryParams.toString()}`,
    fetchShops
  )

  const shopsWithDistance = shops.map((shop) => {
    let distance: number | null = null
    if (lat && lng && shop.latitude && shop.longitude) {
      distance = getDistanceKm(lat, lng, shop.latitude, shop.longitude)
    }
    return { ...shop, distance }
  })

  const filtered = shopsWithDistance
    .filter((shop) => {
      if (!search) return true
      return (
        shop.name.toLowerCase().includes(search.toLowerCase()) ||
        shop.services.toLowerCase().includes(search.toLowerCase()) ||
        (shop.city && shop.city.toLowerCase().includes(search.toLowerCase()))
      )
    })
    .sort((a, b) => {
      if (a.distance != null && b.distance != null) return a.distance - b.distance
      return (Number(b.rating) || 0) - (Number(a.rating) || 0)
    })

  const withinRadius = lat && lng
    ? filtered.filter((s) => s.distance != null && s.distance <= 10)
    : filtered

  const displayShops = withinRadius.length > 0 ? withinRadius : filtered

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <input
            className="w-full h-14 bg-card border border-foreground/10 rounded-xl pl-12 pr-4 text-foreground focus:ring-2 focus:ring-turbo-orange focus:outline-none transition-all placeholder:text-muted-foreground"
            placeholder="Search shops or services..."
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <MaterialIcon
            name="search"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveService("")}
            className={`shrink-0 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${!activeService
              ? "bg-turbo-orange text-midnight"
              : "glass border border-foreground/10 text-muted-foreground"
              }`}
          >
            All Shops
          </button>
          {SERVICE_TYPES.map((svc) => (
            <button
              key={svc}
              onClick={() => setActiveService(activeService === svc ? "" : svc)}
              className={`shrink-0 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${activeService === svc
                ? "bg-turbo-orange text-midnight"
                : "glass border border-foreground/10 text-muted-foreground"
                }`}
            >
              {svc}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground font-black text-xl tracking-tight">
          {city ? `Shops in ${city}` : lat ? "Nearby Shops" : "All Shops"}
        </h2>
        <span className="text-muted-foreground text-xs font-bold uppercase tracking-widest">
          {displayShops.length} {displayShops.length === 1 ? "Result" : "Results"}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-turbo-orange border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm mt-4">Finding nearby shops...</p>
        </div>
      ) : displayShops.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center mb-4">
            <MaterialIcon name="search_off" className="text-3xl text-muted-foreground" />
          </div>
          <h3 className="text-foreground font-bold text-lg mb-2">No shops found</h3>
          <p className="text-muted-foreground text-sm max-w-[260px] mb-8">
            {city
              ? `We don't have shops listed in ${city} yet. Try a different area.`
              : "Try adjusting your search or selecting a different city."}
          </p>
          <Link href="/shopregistration" className="w-full max-w-[280px]">
            <button className="w-full h-14 glass border-2 border-dashed border-turbo-orange/30 rounded-2xl flex items-center justify-center gap-3 text-turbo-orange font-black uppercase tracking-widest text-xs hover:border-turbo-orange/60 transition-all hover:bg-turbo-orange/5">
              <MaterialIcon name="add_business" />
              Join Network
            </button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {displayShops.map((shop, index) => (
            <div key={shop.id} className={`animate-in`} style={{ animationDelay: `${index * 0.1}s` }}>
              <ShopCard shop={shop} distance={shop.distance} />
            </div>
          ))}

          {/* Join Network end of list CTA */}
          <div className="mt-8 pt-8 border-t border-foreground/5">
            <div className="text-center mb-6">
              <h4 className="text-foreground font-bold text-sm">Don't see your shop here?</h4>
              <Link href="/shopregistration" className="block w-full">
                <button className="w-full h-14 glass border-2 border-dashed border-turbo-orange/30 rounded-2xl flex items-center justify-center gap-3 text-turbo-orange font-black uppercase tracking-widest text-xs hover:border-turbo-orange/60 transition-all hover:bg-turbo-orange/5">
                  <MaterialIcon name="add_business" />
                  Join Network
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
