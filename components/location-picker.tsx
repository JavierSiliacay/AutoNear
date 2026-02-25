"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MaterialIcon } from "./material-icon"
import { PH_CITIES } from "@/lib/types"

export function LocationPicker() {
  const router = useRouter()
  const [city, setCity] = useState("")
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState("")

  const handleGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.")
      return
    }

    // Geolocation requires HTTPS or localhost
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    if (!isSecure) {
      setLocationError("Geolocation requires a secure connection (HTTPS). Please select a city manually or use localhost.");
      return;
    }

    setLocating(true)
    setLocationError("")

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords

        try {
          // Reverse geocoding using BigDataCloud's free client-side API
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await response.json();
          const cityName = data.city || data.principalSubdivision || "Nearby";
          const barangayName = data.locality || "";
          const locationDisplay = barangayName ? `${barangayName}, ${cityName}` : cityName;

          setCity(cityName); // Use the larger city for the filter
          setLocating(false)

          // Small delay so user sees the text change before redirect
          setTimeout(() => {
            router.push(`/shops?lat=${latitude}&lng=${longitude}&city=${encodeURIComponent(cityName)}`)
          }, 800);
        } catch (err) {
          console.error("Reverse geocoding error:", err);
          setLocating(false)
          router.push(`/shops?lat=${latitude}&lng=${longitude}`)
        }
      },
      (error) => {
        setLocating(false)
        console.error("Geolocation error:", error)
        if (error.code === 1) {
          setLocationError("Location access denied. Please enable it in browser settings.")
        } else if (error.code === 3) {
          setLocationError("Location request timed out. Please try again or select a city.")
        } else {
          setLocationError("Could not determine location. Please select a city instead.")
        }
      },
      {
        enableHighAccuracy: true, // Use GPS if available for better accuracy
        timeout: 15000,
        maximumAge: 60000
      }
    )
  }, [router])

  const handleExplore = () => {
    if (city) {
      const selectedCity = PH_CITIES.find(c => c.value === city);
      if (selectedCity) {
        router.push(`/shops?city=${encodeURIComponent(city)}&lat=${selectedCity.lat}&lng=${selectedCity.lng}`)
      } else {
        router.push(`/shops?city=${encodeURIComponent(city)}`)
      }
    } else {
      handleGeolocation()
    }
  }

  return (
    <div className="glass-card p-6 rounded-2xl shadow-2xl">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">
            Location
          </label>
          <div className="relative">
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full h-14 bg-background/50 border border-foreground/10 rounded-xl pl-12 pr-4 text-foreground focus:ring-2 focus:ring-turbo-orange focus:border-transparent transition-all appearance-none"
            >
              <option value="">Select city / municipality</option>
              {/* If city is detected by GPS and not in the list, add it as a temporary option */}
              {city && !PH_CITIES.some(c => c.value === city) && (
                <option value={city}>{city} (Detected)</option>
              )}
              {PH_CITIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}, {c.province}
                </option>
              ))}
            </select>
            <MaterialIcon
              name="location_on"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-turbo-orange"
            />
          </div>
        </div>

        <button
          onClick={handleExplore}
          disabled={locating}
          className="w-full h-16 bg-turbo-orange orange-glow text-midnight font-black uppercase tracking-widest rounded-xl transition-transform active:scale-95 flex items-center justify-center gap-3 disabled:opacity-60"
        >
          <MaterialIcon name="search" className="font-bold" />
          <span>{locating ? "Locating..." : "Explore Shops"}</span>
        </button>

        <button
          onClick={handleGeolocation}
          disabled={locating}
          className="w-full h-12 border border-turbo-orange/30 text-turbo-orange font-bold text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 hover:bg-turbo-orange/10 transition-all disabled:opacity-60"
        >
          <MaterialIcon name="my_location" className="text-sm" />
          <span>Use My Current Location</span>
        </button>

        {locating && (
          <div className="flex items-center justify-center gap-3 py-2 animate-pulse">
            <div className="w-2 h-2 bg-turbo-orange rounded-full" />
            <span className="text-[10px] font-bold text-turbo-orange uppercase tracking-[0.2em]">Detecting your coordinates...</span>
          </div>
        )}

        {!locating && city && (
          <div className="flex flex-col gap-2 animate-in">
            <div className="bg-electric-blue/10 border border-electric-blue/20 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-electric-blue/20 rounded-lg flex items-center justify-center text-electric-blue">
                <MaterialIcon name="location_searching" className="text-xl" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-electric-blue uppercase tracking-widest">Location Detected</p>
                <p className="text-sm font-black text-foreground truncate">You are in {city}</p>
              </div>
              <button
                onClick={() => {
                  setCity("");
                  setLocationError("");
                }}
                className="text-[10px] font-black text-muted-foreground hover:text-turbo-orange uppercase tracking-wider"
              >
                Wrong?
              </button>
            </div>
            <p className="text-[9px] text-muted-foreground/60 px-2 italic">
              Note: ISP routing can sometimes cause inaccurate detection.
            </p>
          </div>
        )}

        {locationError && (
          <p className="text-destructive text-[10px] font-bold uppercase tracking-tight text-center bg-destructive/10 py-3 rounded-xl border border-destructive/20">{locationError}</p>
        )}
      </div>
    </div>
  )
}
