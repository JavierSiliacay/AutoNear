"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MaterialIcon } from "@/components/material-icon"
import type { Shop } from "@/lib/types"

interface MapViewProps {
  shops: Shop[]
}

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function MapView({ shops }: MapViewProps) {
  // Define icons inside the component to avoid SSR errors
  const shopIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-8 h-8 bg-electric-blue rounded-full flex items-center justify-center text-midnight shadow-[0_0_15px_rgba(0,209,255,0.4)] border-2 border-white/20">
            <span class="material-symbols-outlined text-lg font-bold">home_repair_service</span>
          </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  })

  const selectedShopIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-10 h-10 bg-turbo-orange rounded-full flex items-center justify-center text-midnight shadow-[0_0_20px_rgba(255,95,0,0.6)] border-2 border-white/30 scale-110">
            <span class="material-symbols-outlined text-xl font-bold">home_repair_service</span>
          </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  })

  const userIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-8 h-8 bg-white rounded-full flex items-center justify-center text-turbo-orange shadow-[0_0_15px_rgba(255,255,255,0.5)] border-2 border-turbo-orange animate-bounce">
            <span class="material-symbols-outlined text-lg font-bold">person_pin_circle</span>
          </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  })

  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number, address?: string } | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  const defaultCenter: [number, number] = [14.5995, 120.9842]
  const defaultZoom = 12

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      return data.locality || data.city || data.principalSubdivision || "Unknown Location";
    } catch (err) {
      return "Selected Location";
    }
  }

  const handleMapClick = async (lat: number, lng: number) => {
    setSelectedShop(null); // Deselect shop if map is clicked
    setIsLocating(true);
    const address = await fetchAddress(lat, lng);
    setUserLocation({ lat, lng, address });
    setIsLocating(false);
  }

  const shopsWithCoords = shops.filter((s) => s.latitude && s.longitude)

  return (
    <main className="flex-1 relative w-full h-full bg-slate-900">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', background: '#0a0f18' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapEvents onMapClick={handleMapClick} />

        {/* Shop Markers */}
        {shopsWithCoords.map((shop) => (
          <Marker
            key={shop.id}
            position={[shop.latitude!, shop.longitude!]}
            icon={selectedShop?.id === shop.id ? selectedShopIcon : shopIcon}
            eventHandlers={{
              click: (e) => {
                L.DomEvent.stopPropagation(e);
                setSelectedShop(shop);
                setUserLocation(null);
              },
            }}
          />
        ))}

        {/* User Marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          />
        )}

        {selectedShop && (
          <ChangeView
            center={[selectedShop.latitude! - 0.005, selectedShop.longitude!]}
            zoom={15}
          />
        )}

        {userLocation && !selectedShop && (
          <ChangeView
            center={[userLocation.lat - 0.005, userLocation.lng]}
            zoom={15}
          />
        )}
      </MapContainer>

      {/* Floating Instructions */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
        <div className="glass px-4 py-2 rounded-full border border-white/10 shadow-2xl">
          <p className="text-[10px] font-black text-foreground/70 uppercase tracking-widest whitespace-nowrap">
            Tap anywhere on the map to set your location
          </p>
        </div>
      </div>

      {/* User Location Info Card */}
      {userLocation && !selectedShop && (
        <div className="absolute bottom-28 left-0 right-0 px-6 z-[1000]">
          <div className="glass-card rounded-2xl p-5 border-electric-blue/30 max-w-sm mx-auto shadow-2xl animate-in">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-electric-blue/20 rounded-xl flex items-center justify-center text-electric-blue">
                <MaterialIcon name="person_pin_circle" className="text-2xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-electric-blue uppercase tracking-widest">Your Location</p>
                <h4 className="text-foreground font-bold text-base truncate">
                  {isLocating ? "Identifying..." : userLocation.address}
                </h4>
              </div>
            </div>
            <Link
              href={`/shops?lat=${userLocation.lat}&lng=${userLocation.lng}`}
              className="w-full h-12 bg-electric-blue text-midnight font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span>Find Shops Nearby</span>
              <MaterialIcon name="arrow_forward" className="text-sm" />
            </Link>
          </div>
        </div>
      )}

      {/* Selected Shop Card Overlay */}
      {selectedShop && (
        <div className="absolute bottom-28 left-0 right-0 px-6 z-[1000]">
          <Link href={`/shops/${selectedShop.id}`}>
            <div className="glass-card rounded-2xl p-5 border-turbo-orange/30 max-w-sm mx-auto shadow-2xl animate-in">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="bg-turbo-orange/20 text-turbo-orange text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                        Verified
                      </span>
                      <span className="text-muted-foreground text-[10px] font-bold truncate">
                        {selectedShop.city}
                      </span>
                    </div>
                    <h4 className="text-foreground font-bold text-xl leading-tight truncate">{selectedShop.name}</h4>
                  </div>
                  <div className="flex items-center text-turbo-orange shrink-0 bg-background/50 px-2 py-1 rounded-lg border border-white/5">
                    <MaterialIcon name="star" className="text-sm" filled />
                    <span className="text-sm font-bold ml-1 text-foreground">
                      {Number(selectedShop.rating).toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MaterialIcon name="location_on" className="text-xs" />
                    {selectedShop.barangay}, {selectedShop.city}
                  </p>
                  <span className="text-turbo-orange font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
                    Details <MaterialIcon name="chevron_right" className="text-xs" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Attribution */}
      <div className="absolute top-20 right-4 z-[1000] glass px-2 py-1 rounded text-[8px] text-muted-foreground pointer-events-none">
        OpenStreetMap &middot; CartoDB
      </div>
    </main>
  )
}
