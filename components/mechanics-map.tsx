"use client"

import { useEffect, useState, useMemo } from "react"
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { Mechanic } from "@/lib/types"
import type { RouteResult } from "@/lib/routing"
import { MaterialIcon } from "@/components/material-icon"

interface MechanicsMapProps {
  mechanics: Mechanic[]
  userLocation: { lat: number; lng: number; address?: string } | null
  selectedMechanic: Mechanic | null
  onSelectMechanic: (mechanic: Mechanic | null) => void
  searchRadiusKm: number | null // null means unlimited/all
  activeRoute: RouteResult | null
}

function AutoBoundsHandler({
  userLocation,
  selectedMechanic,
  searchRadiusKm,
}: {
  userLocation: { lat: number; lng: number } | null
  selectedMechanic: Mechanic | null
  searchRadiusKm: number | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    if (userLocation && selectedMechanic && selectedMechanic.latitude && selectedMechanic.longitude) {
      // Fit both user and selected mechanic
      const bounds = L.latLngBounds([
        [userLocation.lat, userLocation.lng],
        [selectedMechanic.latitude, selectedMechanic.longitude],
      ])
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true })
    } else if (selectedMechanic && selectedMechanic.latitude && selectedMechanic.longitude) {
      // Focus on selected mechanic
      map.flyTo([selectedMechanic.latitude - 0.002, selectedMechanic.longitude], 15, { animate: true })
    } else if (userLocation) {
      // Focus on user location
      const zoomLevel = searchRadiusKm ? (searchRadiusKm <= 5 ? 14 : searchRadiusKm <= 15 ? 12 : 11) : 13
      map.flyTo([userLocation.lat, userLocation.lng], zoomLevel, { animate: true })
    }
  }, [userLocation, selectedMechanic, searchRadiusKm, map])

  return null
}

export function MechanicsMap({
  mechanics,
  userLocation,
  selectedMechanic,
  onSelectMechanic,
  searchRadiusKm,
  activeRoute,
}: MechanicsMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const defaultCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [14.5995, 120.9842] // Manila default

  const userIcon = useMemo(() => {
    if (!isMounted) return null
    return L.divIcon({
      className: "custom-user-pin",
      html: `
        <div class="relative w-9 h-9 bg-midnight rounded-full flex items-center justify-center border-2 border-turbo-orange shadow-[0_0_20px_rgba(255,95,0,0.7)] animate-bounce">
          <span class="material-symbols-outlined text-turbo-orange text-xl font-bold">person_pin_circle</span>
          <div class="absolute -bottom-1 w-2 h-2 bg-turbo-orange rounded-full"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
    })
  }, [isMounted])

  if (!isMounted) {
    return (
      <div className="w-full h-full min-h-[400px] bg-slate-900 flex flex-col items-center justify-center rounded-3xl border border-white/10">
        <div className="w-10 h-10 border-4 border-turbo-orange border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4">
          Loading Live Radar...
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full min-h-[300px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-slate-950">
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%", background: "#0a0f18" }}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <AutoBoundsHandler
          userLocation={userLocation}
          selectedMechanic={selectedMechanic}
          searchRadiusKm={searchRadiusKm}
        />

        {/* User Location Marker & Search Radius Radar */}
        {userLocation && (
          <>
            {userIcon && (
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
            )}

            {/* Glowing Search Radius Circle */}
            {searchRadiusKm && (
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={searchRadiusKm * 1000}
                pathOptions={{
                  color: "#FF5F00",
                  fillColor: "#FF5F00",
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: "6, 6",
                }}
              />
            )}
          </>
        )}

        {/* Active Route Polyline connecting User and Selected Mechanic */}
        {activeRoute && activeRoute.coordinates.length > 0 && (
          <>
            {/* Outer Glow Polyline */}
            <Polyline
              positions={activeRoute.coordinates}
              pathOptions={{
                color: "#00E9A3",
                weight: 6,
                opacity: 0.4,
              }}
            />
            {/* Core Animated Driving Polyline */}
            <Polyline
              positions={activeRoute.coordinates}
              pathOptions={{
                color: "#00E9A3",
                weight: 3.5,
                opacity: 0.95,
                dashArray: "8, 8",
              }}
            />
          </>
        )}

        {/* Mechanic Markers */}
        {mechanics
          .filter((m) => m.latitude && m.longitude)
          .map((mechanic) => {
            const isSelected = selectedMechanic?.id === mechanic.id
            const pinIcon = L.divIcon({
              className: "custom-mechanic-pin",
              html: `
                <div class="relative ${isSelected ? "w-11 h-11 scale-110 ring-4 ring-turbo-orange shadow-[0_0_25px_rgba(255,95,0,0.8)]" : "w-9 h-9 shadow-lg hover:scale-105"} bg-slate-900 rounded-2xl flex items-center justify-center border-2 ${isSelected ? "border-turbo-orange" : "border-white/20"} overflow-hidden transition-all cursor-pointer">
                  ${
                    mechanic.image_url
                      ? `<img src="${mechanic.image_url}" class="w-full h-full object-cover" referrerpolicy="no-referrer" />`
                      : `<div class="w-full h-full flex items-center justify-center bg-slate-800 text-foreground font-black text-xs">${mechanic.name[0]}</div>`
                  }
                  <div class="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-midnight ${
                    mechanic.is_available ? "bg-emerald-400" : "bg-red-500"
                  }"></div>
                </div>
              `,
              iconSize: isSelected ? [44, 44] : [36, 36],
              iconAnchor: isSelected ? [22, 44] : [18, 36],
            })

            return (
              <Marker
                key={`${mechanic.id}-${isSelected}`}
                position={[mechanic.latitude!, mechanic.longitude!]}
                icon={pinIcon}
                eventHandlers={{
                  click: () => {
                    onSelectMechanic(isSelected ? null : mechanic)
                  },
                }}
              />
            )
          })}
      </MapContainer>

      {/* Floating Distance & ETA Badge on Top Right */}
      {activeRoute && selectedMechanic && (
        <div className="absolute top-4 right-4 z-[1000] animate-in fade-in slide-in-from-top-3">
          <div className="glass px-4 py-2 rounded-2xl border border-electric-blue/30 shadow-2xl bg-midnight/90 backdrop-blur-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-electric-blue/20 text-electric-blue flex items-center justify-center shrink-0">
              <MaterialIcon name="navigation" className="text-base" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-electric-blue">
                Driving Route
              </p>
              <p className="text-xs font-black text-white">
                {activeRoute.distanceKm} km <span className="text-muted-foreground font-medium">· ~{activeRoute.durationMins} mins</span>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
