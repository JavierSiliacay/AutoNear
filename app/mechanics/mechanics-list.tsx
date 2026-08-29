"use client"

import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { MechanicCard } from "@/components/mechanic-card"
import { MaterialIcon } from "@/components/material-icon"
import { SERVICE_TYPES } from "@/lib/types"
import type { Mechanic } from "@/lib/types"
import { useMechanics } from "@/hooks/use-mechanics"
import { calculateHaversineDistance, fetchRoadRoute, type RouteResult } from "@/lib/routing"
import { toast } from "sonner"

// Dynamically import Leaflet Map to avoid SSR issues
const MechanicsMap = dynamic(
  () => import("@/components/mechanics-map").then((mod) => mod.MechanicsMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[420px] bg-slate-900 flex flex-col items-center justify-center rounded-3xl border border-white/10">
        <div className="w-10 h-10 border-4 border-turbo-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4">
          Loading Live Radar...
        </p>
      </div>
    ),
  }
)

interface MechanicsListProps {
  city?: string
  lat?: number
  lng?: number
  service?: string
}

const RADIUS_OPTIONS = [
  { label: "3 km", value: 3 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "25 km", value: 25 },
  { label: "All", value: null },
]

export function MechanicsList({ city, lat: initialLat, lng: initialLng, service: initialService }: MechanicsListProps) {
  const [search, setSearch] = useState("")
  const [activeService, setActiveService] = useState(initialService || "")
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [searchRadius, setSearchRadius] = useState<number | null>(10) // default 10km
  const [showCustomRadius, setShowCustomRadius] = useState(false)
  const [customRadiusValue, setCustomRadiusValue] = useState<number>(15)
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)

  // User location state - defaults to Manila or CDO if not set yet so polyline can ALWAYS draw
  const [userLocation, setUserLocation] = useState<{
    lat: number
    lng: number
    address?: string
  }>(
    initialLat && initialLng
      ? { lat: initialLat, lng: initialLng, address: city || "Current Location" }
      : { lat: 14.5995, lng: 120.9842, address: "Metro Manila (Default)" }
  )

  const { data: mechanics = [], isLoading } = useMechanics({
    city,
    service: activeService,
  })

  // "Nearby Mechanics" One-Tap Geolocation Handler
  const handleLocateNearby = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.")
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          )
          const data = await res.json()
          const locality = data.locality || data.city || data.principalSubdivision || "Your Location"
          setUserLocation({ lat, lng, address: locality })
        } catch {
          setUserLocation({ lat, lng, address: "Your Location" })
        }
        setIsLocating(false)
        toast.success("Nearby Radar activated! Found mechanics in your area.")
      },
      (err) => {
        setIsLocating(false)
        toast.error("Could not access your location. Please check browser permissions.")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // Auto-locate on mount if geolocation permission is already available
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords
          setUserLocation({ lat, lng, address: "Your Location" })
        },
        () => {
          // Keep default center
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [])

  // Calculate driving polyline route whenever a mechanic is selected
  useEffect(() => {
    let isCancelled = false

    async function updateRoute() {
      if (selectedMechanic) {
        // Find or assign coordinates if null
        const mechLat = Number(selectedMechanic.latitude) || (userLocation.lat + 0.02)
        const mechLng = Number(selectedMechanic.longitude) || (userLocation.lng + 0.02)

        setIsCalculatingRoute(true)
        const result = await fetchRoadRoute(
          userLocation.lat,
          userLocation.lng,
          mechLat,
          mechLng
        )

        if (!isCancelled) {
          setActiveRoute(result)
          setIsCalculatingRoute(false)
        }
      } else {
        if (!isCancelled) {
          setActiveRoute(null)
        }
      }
    }

    updateRoute()

    return () => {
      isCancelled = true
    }
  }, [userLocation, selectedMechanic])

  // Filter mechanics by search, specialty, and radius distance
  const filtered = useMemo(() => {
    return mechanics
      .filter((m) => {
        const matchesSearch =
          !search ||
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.city.toLowerCase().includes(search.toLowerCase()) ||
          m.specializations.some((s) => s.toLowerCase().includes(search.toLowerCase()))

        const matchesService = !activeService || m.specializations.some(s => {
          if (activeService.toLowerCase().includes("pms") || activeService.toLowerCase().includes("preventive")) {
            const spec = s.toLowerCase();
            return spec.includes("preventive") || spec.includes("pms") || spec.includes("oil") || spec.includes("tire") || spec.includes("brake");
          }
          return s.toLowerCase() === activeService.toLowerCase() || s.toLowerCase().includes(activeService.toLowerCase());
        })

        // Radius check if user location is set
        let matchesRadius = true
        if (userLocation && searchRadius !== null && m.latitude && m.longitude) {
          const dist = calculateHaversineDistance(
            userLocation.lat,
            userLocation.lng,
            m.latitude,
            m.longitude
          )
          matchesRadius = dist <= searchRadius
        }

        return matchesSearch && matchesService && matchesRadius
      })
      .map((m) => {
        // Attach calculated distance for easy display
        if (userLocation && m.latitude && m.longitude) {
          const distance = calculateHaversineDistance(
            userLocation.lat,
            userLocation.lng,
            m.latitude,
            m.longitude
          )
          return { ...m, distance }
        }
        return m
      })
      .sort((a, b) => {
        // If distance is present, sort by closest first, otherwise availability + rating
        if (userLocation && a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance
        }
        if (a.is_available && !b.is_available) return -1
        if (!a.is_available && b.is_available) return 1
        return (Number(b.rating) || 0) - (Number(a.rating) || 0)
      })
  }, [mechanics, search, activeService, userLocation, searchRadius])

  return (
    <div className="space-y-6">
      {/* Top Search & Radar Controls */}
      <div className="flex flex-col gap-4">
        {/* Search Bar & Nearby Button */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              className="w-full h-14 bg-card border border-foreground/10 rounded-2xl pl-12 pr-4 text-foreground focus:ring-2 focus:ring-turbo-orange focus:outline-none transition-all placeholder:text-muted-foreground text-sm font-medium"
              placeholder="Search by name, city, or service (e.g. Engine, Brakes)..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <MaterialIcon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>

          <button
            onClick={handleLocateNearby}
            disabled={isLocating}
            className={`h-14 px-6 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer ${
              userLocation
                ? "bg-electric-blue/15 border border-electric-blue/40 text-electric-blue shadow-[0_0_20px_rgba(0,233,163,0.15)]"
                : "bg-turbo-orange hover:bg-turbo-orange/90 active:scale-95 text-midnight shadow-turbo-orange/20"
            }`}
            title="Find mechanics nearest to your current GPS position"
          >
            {isLocating ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Locating...</span>
              </>
            ) : (
              <>
                <MaterialIcon name="my_location" className="text-lg" />
                <span>{userLocation?.address ? `Near ${userLocation.address.split(',')[0]}` : "Locate Near Me"}</span>
              </>
            )}
          </button>
        </div>

        {/* Filters & Mode Toggles Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-1">
          {/* Radius Selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1 shrink-0">
              <MaterialIcon name="tune" className="text-sm text-turbo-orange" />
              Distance:
            </span>
            {RADIUS_OPTIONS.map((opt) => (
              <button
                key={opt.label}
                onClick={() => {
                  setSearchRadius(opt.value)
                  setShowCustomRadius(false)
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  searchRadius === opt.value && !showCustomRadius
                    ? "bg-turbo-orange text-midnight font-black shadow-md shadow-turbo-orange/20"
                    : "glass border border-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}

            {/* Custom Radius Button */}
            <button
              onClick={() => setShowCustomRadius(!showCustomRadius)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                showCustomRadius || (searchRadius !== null && !RADIUS_OPTIONS.some(o => o.value === searchRadius))
                  ? "bg-electric-blue text-midnight font-black shadow-md shadow-electric-blue/20"
                  : "glass border border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              <MaterialIcon name="edit" className="text-xs" />
              <span>{searchRadius && !RADIUS_OPTIONS.some(o => o.value === searchRadius) ? `${searchRadius} km (Custom)` : "Custom"}</span>
            </button>
          </div>

          {/* Mobile View Switcher (Map vs Grid) */}
          <div className="flex lg:hidden items-center bg-white/5 border border-white/10 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === "map"
                  ? "bg-turbo-orange text-midnight shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MaterialIcon name="map" className="text-sm" />
              <span>Map</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === "list"
                  ? "bg-turbo-orange text-midnight shadow-md"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MaterialIcon name="grid_view" className="text-sm" />
              <span>List ({filtered.length})</span>
            </button>
          </div>
        </div>

        {/* Custom Radius Slider Expansion Panel */}
        {showCustomRadius && (
          <div className="glass-card rounded-2xl p-4 border border-electric-blue/30 bg-slate-900/95 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between gap-4 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-electric-blue flex items-center gap-1.5">
                <MaterialIcon name="radar" className="text-sm" />
                Custom Search Distance
              </span>
              <span className="text-xs font-black text-white bg-electric-blue/20 px-2.5 py-0.5 rounded-full border border-electric-blue/30">
                {customRadiusValue} km
              </span>
            </div>

            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="1" 
                max="100" 
                step="1"
                value={customRadiusValue} 
                onChange={(e) => {
                  const val = Number(e.target.value)
                  setCustomRadiusValue(val)
                  setSearchRadius(val)
                }}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-electric-blue"
              />
              <button
                onClick={() => {
                  setSearchRadius(customRadiusValue)
                  setShowCustomRadius(false)
                  toast.success(`Distance set to ${customRadiusValue} km`)
                }}
                className="px-4 py-2 bg-electric-blue text-midnight font-black uppercase text-[10px] tracking-wider rounded-xl shrink-0 cursor-pointer hover:scale-105 transition-transform"
              >
                Apply
              </button>
            </div>
            <div className="flex justify-between text-[9px] font-bold text-muted-foreground mt-1.5 px-0.5">
              <span>1 km</span>
              <span>25 km</span>
              <span>50 km</span>
              <span>75 km</span>
              <span>100 km</span>
            </div>
          </div>
        )}

        {/* Service Category Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setActiveService("")}
            className={`shrink-0 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
              !activeService
                ? "bg-electric-blue text-midnight font-black shadow-md shadow-electric-blue/20"
                : "glass border border-foreground/10 text-muted-foreground hover:text-foreground"
            }`}
          >
            All Services
          </button>
          {SERVICE_TYPES.map((svc) => (
            <button
              key={svc}
              onClick={() => setActiveService(activeService === svc ? "" : svc)}
              className={`shrink-0 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                activeService === svc
                  ? "bg-electric-blue text-midnight font-black shadow-md shadow-electric-blue/20"
                  : "glass border border-foreground/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              {svc}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Responsive Split Screen on Desktop (Left List, Right Sticky Map) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Mechanic Cards List (Always on desktop; Toggled on mobile) */}
        <div className={`lg:col-span-6 space-y-6 ${viewMode === "map" ? "hidden lg:block" : "block"}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-foreground font-black text-xl tracking-tight italic uppercase">
              {activeService ? `${activeService} Pros` : "Nearby Pros"}
            </h2>
            <span className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] bg-foreground/5 px-3 py-1 rounded-full border border-foreground/5">
              {filtered.length} AVAILABLE
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-turbo-orange border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground text-xs mt-4 font-bold uppercase tracking-widest">
                Searching Radar...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center glass-card rounded-3xl p-8 border border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <MaterialIcon name="person_search" className="text-3xl text-muted-foreground" />
              </div>
              <h3 className="text-foreground font-bold text-lg mb-1">No mechanics found</h3>
              <p className="text-muted-foreground text-xs max-w-xs mb-6">
                Try expanding your search radius or clearing active specialty filters.
              </p>
              <button
                onClick={() => {
                  setSearch("")
                  setActiveService("")
                  setSearchRadius(null)
                }}
                className="text-turbo-orange font-black text-xs uppercase tracking-widest border-b border-turbo-orange/40 pb-0.5 cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
              {filtered.map((mechanic) => {
                const isSelected = selectedMechanic?.id === mechanic.id
                return (
                  <div key={mechanic.id}>
                    <MechanicCard 
                      mechanic={mechanic} 
                      isSelected={isSelected}
                      onSelect={() => {
                        setSelectedMechanic(isSelected ? null : mechanic)
                        // On mobile switch to map when tapped so user can see route
                        if (window.innerWidth < 1024) {
                          setViewMode("map")
                        }
                      }}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Interactive Map (Always visible on desktop; Toggled on mobile) */}
        <div
          className={`lg:col-span-6 lg:sticky lg:top-24 space-y-4 ${
            viewMode === "list" ? "hidden lg:block" : "block"
          }`}
        >
          {/* Map Container - Compact mobile height so users can easily scroll down */}
          <div className="h-[320px] sm:h-[400px] lg:h-[580px] w-full max-w-full relative mx-auto">
            <MechanicsMap
              mechanics={filtered}
              userLocation={userLocation}
              selectedMechanic={selectedMechanic}
              onSelectMechanic={(m) => setSelectedMechanic(m)}
              searchRadiusKm={searchRadius}
              activeRoute={activeRoute}
            />
          </div>

          {/* Selected Mechanic Floating Card / Bottom Sheet */}
          {selectedMechanic && (
            <div className="glass-card rounded-3xl p-5 border border-turbo-orange/30 shadow-2xl bg-gradient-to-b from-slate-900 to-midnight animate-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {selectedMechanic.image_url ? (
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-turbo-orange/30 shadow-lg shrink-0">
                      <img
                        src={selectedMechanic.image_url}
                        alt={selectedMechanic.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-xl font-black text-foreground border border-white/10 shrink-0">
                      {selectedMechanic.name[0]}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-turbo-orange/15 text-turbo-orange text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-turbo-orange/20">
                        {selectedMechanic.is_available ? "Available Now" : "Offline"}
                      </span>
                      <span className="text-muted-foreground text-[10px] font-bold flex items-center gap-0.5">
                        <MaterialIcon name="star" className="text-xs text-turbo-orange" filled />
                        {Number(selectedMechanic.rating).toFixed(1)}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-foreground uppercase tracking-tight truncate">
                      {selectedMechanic.name}
                    </h4>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {selectedMechanic.city}, {selectedMechanic.province}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMechanic(null)}
                  className="text-muted-foreground hover:text-foreground p-1 glass rounded-xl"
                >
                  <MaterialIcon name="close" className="text-sm" />
                </button>
              </div>

              {/* Real Distance & Driving ETA */}
              {activeRoute && (
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-electric-blue font-black">
                    <MaterialIcon name="directions_car" className="text-base" />
                    <span>{activeRoute.distanceKm} km away</span>
                  </div>
                  <span className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                    ~{activeRoute.durationMins} mins driving time
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <Link href={`/mechanics/${selectedMechanic.id}`}>
                  <button className="w-full h-12 bg-turbo-orange text-midnight font-black uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-turbo-orange/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>Book Service</span>
                    <MaterialIcon name="arrow_forward" className="text-sm" />
                  </button>
                </Link>

                <Link href={`/mechanics/${selectedMechanic.id}`}>
                  <button className="w-full h-12 glass border border-white/10 hover:bg-white/5 text-foreground font-black uppercase tracking-widest text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                    <span>View Profile</span>
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
