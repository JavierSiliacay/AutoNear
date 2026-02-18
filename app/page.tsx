"use client"
import Link from "next/link"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { LocationPicker } from "@/components/location-picker"
import { MaterialIcon } from "@/components/material-icon"
import dynamic from "next/dynamic"

const MapView = dynamic(() => import("./map/map-view").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-900 animate-pulse" />
})

const serviceCategories = [
  { icon: "oil_barrel", label: "Engine" },
  { icon: "speed", label: "Brakes" },
  { icon: "tire_repair", label: "Tires" },
  { icon: "electrical_services", label: "Electric" },
]

import { JoinNetworkForm } from "@/components/join-network-form"

export default function HomePage() {
  return (
    <div className="min-h-screen pb-32">
      <AppHeader
        rightAction={
          <Link href="/shopregistration">
            <span className="text-[10px] font-black uppercase tracking-widest text-turbo-orange border border-turbo-orange/30 px-3 py-1.5 rounded-full hover:bg-turbo-orange hover:text-midnight transition-all cursor-pointer">
              Join Network
            </span>
          </Link>
        }
      />

      <main className="max-w-lg mx-auto">
        {/* Interactive Map Hero */}
        <section className="relative w-full h-[60vh] overflow-hidden bg-slate-900 border-b border-foreground/5">
          <div className="absolute inset-0 z-0">
            <MapView shops={[]} />
          </div>
          <div className="absolute inset-0 hero-gradient pointer-events-none" />
          <div className="relative h-full flex flex-col justify-end p-6 pb-20 pointer-events-none z-10 animate-in">
            <span className="text-turbo-orange font-bold text-[10px] uppercase tracking-[0.4em] mb-3 bg-turbo-orange/10 w-fit px-3 py-1 rounded backdrop-blur-sm border border-turbo-orange/20">
              Interactive Selection
            </span>
            <h1 className="text-4xl font-extrabold text-foreground leading-[1.1] tracking-tight text-balance">
              Mark your spot. <span className="text-electric-blue">Find help.</span>
            </h1>
            <p className="mt-4 text-muted-foreground text-xs max-w-[80%] leading-relaxed font-medium">
              Tap anywhere on the map above to drop a pin and find auto shops exactly where you are.
            </p>
          </div>
        </section>

        {/* Location Picker */}
        <section className="px-5 -mt-10 relative z-10">
          <LocationPicker />
        </section>

        {/* Service Categories */}
        <section className="mt-12 px-5 animate-in stagger-1">
          <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-foreground font-bold text-lg tracking-tight">Service Categories</h3>
            <span className="text-turbo-orange text-xs font-bold uppercase tracking-tighter">View All</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
            {serviceCategories.map((item) => (
              <div key={item.label} className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 glass-card rounded-2xl flex items-center justify-center text-foreground group hover:border-turbo-orange/50 transition-all cursor-pointer">
                  <MaterialIcon name={item.icon} className="text-3xl group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter text-center">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Trust Section */}
        <section className="mt-16 px-6 py-12 bg-slate-deep/30 border-y border-foreground/5">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-foreground italic tracking-tighter">THE AUTONEAR STANDARD</h2>
            <div className="w-12 h-1 bg-turbo-orange mx-auto mt-2" />
          </div>
          <div className="flex flex-col gap-10">
            <div className="flex gap-5">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-electric-blue/10 border border-electric-blue/20 text-electric-blue flex items-center justify-center shadow-[0_0_15px_rgba(0,209,255,0.1)]">
                <MaterialIcon name="verified_user" className="font-bold" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-base">Verified Shops Only</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Every shop on AutoNear is checked for quality, safety, and reliability.
                </p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-turbo-orange/10 border border-turbo-orange/20 text-turbo-orange flex items-center justify-center shadow-[0_0_15px_rgba(255,95,0,0.1)]">
                <MaterialIcon name="receipt_long" className="font-bold" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-base">Transparent Pricing</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Know the rates before you visit. No surprise charges.
                </p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-turbo-orange/10 border border-turbo-orange/20 text-turbo-orange flex items-center justify-center shadow-[0_0_15px_rgba(255,95,0,0.1)]">
                <MaterialIcon name="location_on" className="font-bold" />
              </div>
              <div>
                <h4 className="font-bold text-foreground text-base">Hyperlocal Coverage</h4>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Find shops in your barangay, city, or municipality across the Philippines.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
