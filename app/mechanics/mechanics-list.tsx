"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { MechanicCard } from "@/components/mechanic-card"
import { MaterialIcon } from "@/components/material-icon"
import { SERVICE_TYPES } from "@/lib/types"
import type { Mechanic } from "@/lib/types"

async function fetchMechanics(url: string): Promise<Mechanic[]> {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch mechanics")
  return res.json()
}

interface MechanicsListProps {
  city?: string
  lat?: number
  lng?: number
  service?: string
}

export function MechanicsList({ city, lat, lng, service: initialService }: MechanicsListProps) {
  const [search, setSearch] = useState("")
  const [activeService, setActiveService] = useState(initialService || "")

  const queryParams = new URLSearchParams()
  if (city) queryParams.set("city", city)
  if (activeService) queryParams.set("service", activeService)

  const { data: mechanics = [], isLoading } = useSWR<Mechanic[]>(
    `/api/mechanics?${queryParams.toString()}`,
    fetchMechanics
  )

  const filtered = mechanics
    .filter((m) => {
      const matchesSearch = !search || 
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.city.toLowerCase().includes(search.toLowerCase()) ||
        m.specializations.some(s => s.toLowerCase().includes(search.toLowerCase()))
      
      const matchesService = !activeService || 
        m.specializations.includes(activeService)

      return matchesSearch && matchesService
    })
    .sort((a, b) => {
      // Sort by availability first, then rating
      if (a.is_available && !b.is_available) return -1
      if (!a.is_available && b.is_available) return 1
      return (Number(b.rating) || 0) - (Number(a.rating) || 0)
    })

  return (
    <>
      <div className="flex flex-col gap-4 mb-6">
        <div className="relative">
          <input
            className="w-full h-14 bg-card border border-foreground/10 rounded-xl pl-12 pr-4 text-foreground focus:ring-2 focus:ring-turbo-orange focus:outline-none transition-all placeholder:text-muted-foreground"
            placeholder="Find a specialist (e.g. Engine, Brakes)..."
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
              ? "bg-turbo-orange text-midnight scale-105"
              : "glass border border-foreground/10 text-muted-foreground"
              }`}
          >
            All Mechanics
          </button>
          {SERVICE_TYPES.map((svc) => (
            <button
              key={svc}
              onClick={() => setActiveService(activeService === svc ? "" : svc)}
              className={`shrink-0 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${activeService === svc
                ? "bg-turbo-orange text-midnight scale-105"
                : "glass border border-foreground/10 text-muted-foreground"
                }`}
            >
              {svc}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-foreground font-black text-xl tracking-tight italic">
          {activeService ? `${activeService} Specialists` : "Verified Mechanics"}
        </h2>
        <span className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] bg-foreground/5 px-3 py-1 rounded-full border border-foreground/5">
          {filtered.length} AVAILABLE
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-turbo-orange border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-xs mt-4 font-bold uppercase tracking-widest">Searching Network...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-20 h-20 glass-card rounded-3xl flex items-center justify-center mb-6 border-dashed border-2 border-white/10">
            <MaterialIcon name="person_search" className="text-4xl text-muted-foreground" />
          </div>
          <h3 className="text-foreground font-extrabold text-xl mb-2">No mechanics found</h3>
          <p className="text-muted-foreground text-sm max-w-[260px] mb-8 font-medium">
            We couldn't find any mechanics matching your current filters.
          </p>
          <button 
            onClick={() => { setSearch(""); setActiveService(""); }}
            className="text-turbo-orange font-black text-xs uppercase tracking-widest border-b-2 border-turbo-orange/30 pb-1"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filtered.map((mechanic, index) => (
            <MechanicCard key={mechanic.id} mechanic={mechanic} />
          ))}
          
          <div className="mt-12 p-8 glass-card rounded-3xl border-dashed border-2 border-white/5 text-center">
            <h4 className="text-foreground font-black text-lg mb-2">Are you a professional mechanic?</h4>
            <p className="text-muted-foreground text-xs mb-6 max-w-xs mx-auto font-medium">
              Join the TaraFix network and start receiving service requests in your area.
            </p>
            <Link href="/register-mechanic">
              <button className="h-14 px-8 bg-electric-blue text-midnight font-black uppercase tracking-widest text-xs rounded-2xl hover:scale-105 transition-transform">
                Register Now
              </button>
            </Link>
          </div>
        </div>
      )}
    </>
  )
}
