"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MaterialIcon } from "@/components/material-icon"
import type { Shop, Mechanic } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface MapViewProps {
  mechanics: Mechanic[]
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

function MapContent({ children }: { children: React.ReactNode }) {
  const map = useMap();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (map) {
      // Small timeout to ensure DOM container is fully sized and ready for Leaflet
      const timer = setTimeout(() => setIsReady(true), 100);
      return () => clearTimeout(timer);
    }
  }, [map]);

  return isReady ? <>{children}</> : null;
}

export function MapView({ mechanics }: MapViewProps) {
  // Define icons inside the component to avoid SSR errors
  const [selectedMechanic, setSelectedMechanic] = useState<Mechanic | null>(null)
  const [localMechanics, setLocalMechanics] = useState<Mechanic[]>(mechanics)
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number, address?: string } | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const mechanicIcon = useMemo(() => isMounted ? L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-8 h-8 bg-electric-blue rounded-full flex items-center justify-center text-midnight shadow-[0_0_15px_rgba(0,209,255,0.4)] border-2 border-white/20">
            <span class="material-symbols-outlined text-lg font-bold">build</span>
          </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  }) : null, [isMounted])

  const userIcon = useMemo(() => isMounted ? L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="w-8 h-8 bg-white rounded-full flex items-center justify-center text-turbo-orange shadow-[0_0_15px_rgba(255,255,255,0.5)] border-2 border-turbo-orange animate-bounce">
            <span class="material-symbols-outlined text-lg font-bold">person_pin_circle</span>
          </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  }) : null, [isMounted])

  useEffect(() => {
    setIsMounted(true)
    // Auto-locate on entry
    handleLocateMe(true)
  }, [])

  const defaultCenter: [number, number] = [14.5995, 120.9842]
  const defaultZoom = 12

  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      );
      const data = await response.json();
      const city = data.city || data.principalSubdivision || "";
      const locality = data.locality || "";
      return locality && city && locality !== city ? `${locality}, ${city}` : city || locality || "Unknown Location";
    } catch (err) {
      return "Selected Location";
    }
  }

  const handleMapClick = async (lat: number, lng: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login?message=salamat')
      return
    }

    setSelectedMechanic(null); // Deselect if map is clicked
    setIsLocating(true);
    const address = await fetchAddress(lat, lng);
    setUserLocation({ lat, lng, address });
    setIsLocating(false);
  }

  const handleLocateMe = async (isAuto = false) => {
    if (!navigator.geolocation) return;

    if (!isAuto) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login?message=salamat')
        return
      }
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const address = await fetchAddress(lat, lng);
        setUserLocation({ lat, lng, address });
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  useEffect(() => {
    setLocalMechanics(mechanics);
  }, [mechanics]);

  useEffect(() => {
    console.log("Setting up Realtime for Mechanics...");
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for ALL events for better debugging
          schema: 'public',
          table: 'mechanics'
        },
        (payload) => {
          console.log("Realtime Update Received:", payload);
          const updatedMechanic = payload.new as Mechanic;
          
          if (!updatedMechanic || !updatedMechanic.id) return;

          setLocalMechanics((prev) => 
            prev.map((m) => m.id === updatedMechanic.id ? { ...m, ...updatedMechanic } : m)
          );
          
          // Update selected mechanic if matches
          setSelectedMechanic(prev => {
            if (prev?.id === updatedMechanic.id) {
                return { ...prev, ...updatedMechanic };
            }
            return prev;
          });
        }
      )
      .subscribe((status) => {
        console.log("Realtime Subscription Status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const mechanicsWithCoords = localMechanics.filter((m) => m.latitude && m.longitude)

  if (!isMounted) return null

  return (
    <main className="flex-1 relative w-full h-full bg-slate-900">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%', background: '#0a0f18' }}
        zoomControl={false}
      >
        <MapContent>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <MapEvents onMapClick={handleMapClick} />

          {/* Mechanic Markers */}
          {mechanicsWithCoords.map((mechanic) => {
            const isSelected = selectedMechanic?.id === mechanic.id;
            return (
              <Marker
                key={`${mechanic.id}-${mechanic.is_available}`}
                position={[mechanic.latitude!, mechanic.longitude!]}
                icon={L.divIcon({
                  className: 'custom-div-icon',
                  html: `
                    <div class="relative ${isSelected ? 'w-10 h-10' : 'w-8 h-8'} ${isSelected ? 'bg-turbo-orange' : 'bg-white'} rounded-full flex items-center justify-center border-2 border-white/20 overflow-hidden transition-all ${isSelected ? 'scale-110 shadow-[0_0_20px_rgba(255,95,0,0.6)]' : 'shadow-[0_0_15px_rgba(255,255,255,0.3)]'}">
                      ${mechanic.image_url 
                        ? `<img src="${mechanic.image_url}" class="w-full h-full object-cover" referrerPolicy="no-referrer" />` 
                        : `<div class="w-full h-full flex items-center justify-center bg-gray-100">
                            <span class="material-symbols-outlined ${isSelected ? 'text-2xl' : 'text-xl'} text-gray-400 font-bold">person</span>
                           </div>`
                      }
                      <div class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${mechanic.is_available ? 'bg-green-500' : 'bg-red-500'}"></div>
                    </div>`,
                  iconSize: isSelected ? [40, 40] : [32, 32],
                  iconAnchor: isSelected ? [20, 40] : [16, 32]
                })}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    setSelectedMechanic(mechanic);
                    setUserLocation(null);
                  },
                }}
              />
            );
          })}

          {/* User Marker */}
          {userLocation && userIcon && (
            <Marker
              position={[userLocation.lat, userLocation.lng]}
              icon={userIcon}
            />
          )}

          {selectedMechanic && (
            <ChangeView
              center={[selectedMechanic.latitude! - 0.002, selectedMechanic.longitude!]} // Smaller offset
              zoom={15}
            />
          )}

          {userLocation && !selectedMechanic && (
            <ChangeView
              center={[userLocation.lat - 0.002, userLocation.lng]} // Smaller offset
              zoom={15}
            />
          )}
        </MapContent>
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
      {userLocation && !selectedMechanic && (
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
              href={`/mechanics?lat=${userLocation.lat}&lng=${userLocation.lng}`}
              className="w-full h-12 bg-electric-blue text-midnight font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span>Find Mechanics Nearby</span>
              <MaterialIcon name="arrow_forward" className="text-sm" />
            </Link>
          </div>
        </div>
      )}

      {/* Selected Mechanic Card Overlay */}
      {selectedMechanic && (
        <div className="absolute bottom-28 left-0 right-0 px-6 z-[1000]">
          <div 
            onClick={() => router.push(`/mechanics/${selectedMechanic.id}`)}
            className="cursor-pointer"
          >
            <div className="glass-card rounded-2xl p-5 border-turbo-orange/30 max-w-sm mx-auto shadow-2xl animate-in">
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  {selectedMechanic.image_url && (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-turbo-orange/30 shrink-0">
                      <img src={selectedMechanic.image_url} alt={selectedMechanic.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="bg-turbo-orange/20 text-turbo-orange text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                        PRO MECHANIC
                      </span>
                      <span className="text-muted-foreground text-[10px] font-bold truncate">
                        {selectedMechanic.city}
                      </span>
                    </div>
                    <h4 className="text-foreground font-bold text-xl leading-tight truncate">{selectedMechanic.name}</h4>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center text-turbo-orange shrink-0 bg-background/50 px-2 py-1 rounded-lg border border-white/5">
                      <MaterialIcon name="star" className="text-sm" filled />
                      <span className="text-sm font-bold ml-1 text-foreground">
                        {Number(selectedMechanic.rating).toFixed(1)}
                      </span>
                    </div>
                    <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                      selectedMechanic.is_available 
                        ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                        : 'bg-red-500/10 text-red-500 border-red-500/20'
                    }`}>
                      {selectedMechanic.is_available ? 'Available' : 'Unavailable'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-3 border-t border-white/5 mt-1">
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MaterialIcon name="verified" className="text-xs text-electric-blue" />
                    Verified Specialist
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (selectedMechanic.is_available) {
                          router.push(`/mechanics/${selectedMechanic.id}`);
                        }
                      }}
                      disabled={!selectedMechanic.is_available}
                      className={`flex-1 h-9 rounded-lg flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        selectedMechanic.is_available 
                          ? 'bg-turbo-orange text-midnight hover:scale-105' 
                          : 'bg-white/5 text-muted-foreground border border-white/10 cursor-not-allowed opacity-50'
                      }`}
                    >
                      {selectedMechanic.is_available ? (
                        <>Book Now <MaterialIcon name="chevron_right" className="text-[10px]" /></>
                      ) : (
                        <>Currently Offline</>
                      )}
                    </button>
                    <a 
                      href={`https://www.google.com/maps?q=${selectedMechanic.latitude},${selectedMechanic.longitude}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex-1 h-9 glass rounded-lg flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-widest text-foreground hover:bg-white/10 border border-white/5 transition-colors whitespace-nowrap"
                    >
                      <MaterialIcon name="map" className="text-[10px] text-electric-blue" />
                      Google Maps
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attribution & Location Button */}
      <div className="absolute top-20 right-4 z-[1000] flex flex-col gap-2 items-end">
        <button
          onClick={() => handleLocateMe(false)}
          disabled={isLocating}
          className="w-12 h-12 glass shadow-2xl rounded-xl flex items-center justify-center text-electric-blue border border-white/10 hover:bg-electric-blue/10 transition-all active:scale-95 disabled:opacity-50"
          title="Use My Current Location"
        >
          <MaterialIcon name={isLocating ? "autorenew" : "my_location"} className={isLocating ? "animate-spin" : ""} />
        </button>
        <div className="glass px-2 py-1 rounded text-[8px] text-muted-foreground pointer-events-none">
          OpenStreetMap &middot; CartoDB
        </div>
      </div>
    </main>
  )
}
