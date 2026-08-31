"use client"
import Link from "next/link"
import Image from "next/image"
import { AppHeader } from "@/components/app-header"
import { BottomNav } from "@/components/bottom-nav"
import { LocationPicker } from "@/components/location-picker"
import { MaterialIcon } from "@/components/material-icon"
import dynamic from "next/dynamic"

const MapView = dynamic(() => import("./map/map-view").then((mod) => mod.MapView), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-900 animate-pulse" />
})

import { getMechanics } from "@/lib/actions"
import type { Mechanic } from "@/lib/types"
import { getPresenceStatus } from "@/lib/presence"
import { useEffect, useState } from "react"

const serviceCategories = [
  { icon: "car_repair", label: "PMS (Preventive)", query: "Preventive Maintenance Services (PMS)", sub: "Oil, Brakes, Tires" },
  { icon: "build", label: "Engine Tune-Up", query: "Engine Tune-Up" },
  { icon: "electrical_services", label: "Electrical", query: "Electrical" },
  { icon: "ac_unit", label: "Aircon (AC)", query: "Air Conditioning" },
  { icon: "format_paint", label: "Body & Paint", query: "Body & Paint" },
  { icon: "handyman", label: "General Fix", query: "General Repair" },
]

const howItWorks = [
  { icon: "location_on", title: "Pin It", desc: "Set your location on the map" },
  { icon: "chat_bubble", title: "Pick It", desc: "Connect with a pro nearby" },
  { icon: "verified", title: "Fix It", desc: "Get it serviced on-site" },
]

import { PWAInstallButton } from "@/components/pwa-install-button"
import { WelcomeModal } from "@/components/welcome-modal"
import { createClient } from "@/lib/supabase/client"
import { getMechanicByEmail, checkIfAlreadyMechanic, getMechanicUnreadNotices, acknowledgeMechanicNotice, checkUserBanStatus } from "@/lib/actions"
import type { AdminMechanicNotice } from "@/lib/types"
import { useSession } from "next-auth/react"

export default function HomePage() {
  const { data: nextAuthSession } = useSession()
  const [topMechanics, setTopMechanics] = useState<Mechanic[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [mechanicProfile, setMechanicProfile] = useState<Mechanic | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [revocationNotice, setRevocationNotice] = useState<{ status: string; reason: string } | null>(null)
  const [activeAdminNotice, setActiveAdminNotice] = useState<AdminMechanicNotice | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function loadData() {
      try {
        const [{ data: { user: sbUser } }, data] = await Promise.all([
          supabase.auth.getUser(),
          getMechanics()
        ])

        const activeUser = sbUser || (nextAuthSession?.user ? {
          id: nextAuthSession.user.email,
          email: nextAuthSession.user.email,
          user_metadata: {
            full_name: nextAuthSession.user.name,
            name: nextAuthSession.user.name,
            avatar_url: nextAuthSession.user.image,
            picture: nextAuthSession.user.image,
          }
        } : null)

        const user = activeUser

        if (user) {
          setCurrentUser(user)
          // Fetch mechanic record if this user is a registered mechanic
          let dbMechanic: Mechanic | null = null
          if (user.email) {
            dbMechanic = await getMechanicByEmail(user.email)
            if (dbMechanic) {
              setMechanicProfile(dbMechanic)
              const savedRole = localStorage.getItem("tarafix_user_role")
              if (savedRole === "car_owner" || savedRole === "mechanic") {
                setUserRole(savedRole)
              } else {
                setUserRole("mechanic")
                localStorage.setItem("tarafix_user_role", "mechanic")
              }
            } else {
              // 1. Check if their mechanic access was recently revoked
              const check = await checkIfAlreadyMechanic(user.email)
              if (check.status === 'revoked' || check.status === 'rejected') {
                const noticeSeenKey = `tarafix_revoked_seen_${user.email}`
                if (!sessionStorage.getItem(noticeSeenKey)) {
                  setRevocationNotice({
                    status: check.status,
                    reason: check.reason || 'Your mechanic access has been revoked by platform administrators.'
                  })
                  sessionStorage.setItem(noticeSeenKey, "true")
                }
              }

              // 2. Check if this car owner account is banned
              const banCheck = await checkUserBanStatus(user.email)
              if (banCheck.isBanned) {
                const banSeenKey = `tarafix_banned_seen_${user.email}`
                if (!sessionStorage.getItem(banSeenKey)) {
                  setRevocationNotice({
                    status: 'banned',
                    reason: banCheck.reason || 'Your account access has been suspended due to violations of platform policies.'
                  })
                  sessionStorage.setItem(banSeenKey, "true")
                }
              }
            }

            // Check for unread admin warnings/notices for ANY logged in user (mechanic or car owner)
            const notices = await getMechanicUnreadNotices(user.email)
            if (notices.length > 0) {
              setActiveAdminNotice(notices[0])
            }
          }

          // If NOT in approved mechanic database, check pending status or localStorage
          if (!dbMechanic) {
            setMechanicProfile(null)
            const savedRole = localStorage.getItem("tarafix_user_role")
            let resolvedRole = savedRole || "car_owner"

            if (user.email) {
              const check = await checkIfAlreadyMechanic(user.email)
              if (check.registered && check.status === 'pending') {
                resolvedRole = "mechanic"
              } else if (savedRole === "mechanic" && !check.registered) {
                resolvedRole = "car_owner"
              }
            }

            setUserRole(resolvedRole)
            localStorage.setItem("tarafix_user_role", resolvedRole)
          }
        } else {
          const savedRole = localStorage.getItem("tarafix_user_role")
          if (savedRole) {
            setUserRole(savedRole)
          }
        }

        // Sort by rating and reviews to get the absolute best
        const sorted = [...data].sort((a, b) => {
          if (b.rating !== a.rating) return b.rating - a.rating
          return (b.review_count || 0) - (a.review_count || 0)
        })
        setTopMechanics(sorted.slice(0, 6)) // Top 6 pros
      } catch (err) {
        console.error("Failed to load featured mechanics", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()

    const handleRoleUpdate = async () => {
      const updatedRole = localStorage.getItem("tarafix_user_role")
      setUserRole(updatedRole)
      if (currentUser?.email) {
        try {
          const notices = await getMechanicUnreadNotices(currentUser.email)
          if (notices && notices.length > 0) {
            setActiveAdminNotice(notices[0])
          }
        } catch {}
      }
    }

    window.addEventListener("tarafix_role_changed", handleRoleUpdate)
    return () => window.removeEventListener("tarafix_role_changed", handleRoleUpdate)
  }, [nextAuthSession, currentUser?.email])

  const ADMIN_EMAILS = [
    "siliacay.javier@gmail.com",
    "kacaballes03539@liceo.edu.ph",
    "glloydn.22@gmail.com",
    "javiersiliacay12@gmail.com"
  ]

  const userEmail = currentUser?.email?.toLowerCase().trim() || ""
  const isAdmin = ADMIN_EMAILS.some(e => e.toLowerCase() === userEmail) || userRole === "admin"
  const isMechanic = userRole === "mechanic"
  const isCarOwner = userRole === "car_owner"

  const displayName = currentUser?.user_metadata?.full_name || 
                      currentUser?.user_metadata?.name || 
                      currentUser?.email?.split('@')[0] || 
                      "Car Owner"

  const avatarUrl = currentUser?.user_metadata?.avatar_url || 
                    currentUser?.user_metadata?.picture || 
                    null

  return (
    <div className="min-h-screen pb-32 overflow-x-hidden">
      <WelcomeModal />
      <AppHeader
        rightAction={
          <div className="flex items-center gap-2.5">
            <PWAInstallButton />
            {isAdmin ? (
              <Link href="/admin">
                <div className="flex items-center gap-2 bg-turbo-orange/10 border border-turbo-orange/30 hover:bg-turbo-orange/20 px-2.5 py-1 rounded-full transition-all cursor-pointer group">
                  <div className="w-2 h-2 rounded-full bg-turbo-orange animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-turbo-orange hidden sm:inline">
                    Admin Portal
                  </span>
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Admin Avatar" 
                      className="w-6 h-6 rounded-full object-cover border border-turbo-orange/40"
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-turbo-orange text-midnight flex items-center justify-center text-[10px] font-black">
                      {displayName[0]?.toUpperCase() || 'A'}
                    </div>
                  )}
                </div>
              </Link>
            ) : currentUser ? (
              <Link href="/profile">
                <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 hover:border-turbo-orange/40 pl-3 pr-1.5 py-1 rounded-full transition-all cursor-pointer group">
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black uppercase tracking-wider text-foreground group-hover:text-turbo-orange transition-colors line-clamp-1 max-w-[130px] leading-tight">
                      Good Day, {displayName.split(' ')[0]}!
                    </span>
                    <span className={`text-[8px] font-extrabold uppercase tracking-widest leading-tight ${isMechanic ? "text-turbo-orange" : "text-electric-blue"}`}>
                      {isMechanic ? "Mechanic" : "Car Owner"}
                    </span>
                  </div>
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="User Profile" 
                      className={`w-7 h-7 rounded-full object-cover border transition-all shrink-0 ${isMechanic ? "border-turbo-orange/40 group-hover:border-turbo-orange" : "border-white/20 group-hover:border-electric-blue"}`}
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${isMechanic ? "bg-turbo-orange/20 text-turbo-orange" : "bg-electric-blue/20 text-electric-blue"}`}>
                      {displayName[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </Link>
            ) : (
              <Link href="/register-mechanic">
                <span className="text-[10px] font-black uppercase tracking-widest text-turbo-orange border border-turbo-orange/30 px-3 py-1.5 rounded-full hover:bg-turbo-orange hover:text-midnight transition-all cursor-pointer">
                  Register as mechanic
                </span>
              </Link>
            )}
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop & Tablet Hero Grid */}
        <section className="relative w-full rounded-[2.5rem] overflow-hidden bg-slate-900 border border-foreground/5 shadow-2xl mt-4 lg:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px] lg:min-h-[520px]">
            {/* Left Content Area (Hero Copy & Actions) */}
            <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between relative z-10 hero-gradient lg:bg-none">
              <div>
                <span className="text-turbo-orange font-bold text-[10px] uppercase tracking-[0.4em] mb-4 bg-turbo-orange/10 w-fit px-3.5 py-1.5 rounded-full backdrop-blur-sm border border-turbo-orange/20 inline-block">
                  On-Demand Auto Repairs
                </span>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-foreground leading-[1.05] tracking-tight text-balance">
                  Need a Fix? <br />
                  <span className="text-electric-blue">We come to you.</span>
                </h1>
                <p className="mt-4 text-xs sm:text-sm text-muted-foreground font-medium max-w-md leading-relaxed">
                  Philippines' First Freelance Mechanics Network. Get trusted, expert mechanics for home service or on-site roadside repairs in minutes.
                </p>
              </div>

              <div id="tour-explore-btn" className="mt-8">
                <Link href="/mechanics">
                  <button className="w-full sm:w-auto px-8 bg-white text-midnight font-black py-4 rounded-2xl flex items-center justify-center gap-3 orange-glow hover:scale-[1.02] active:scale-95 transition-all shadow-2xl relative overflow-hidden group cursor-pointer">
                    <div className="absolute inset-0 bg-turbo-orange scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
                    <MaterialIcon name="explore" className="relative z-10 text-xl" />
                    <span className="relative z-10 text-sm tracking-[0.2em]">BOOK MECHANICS</span>
                  </button>
                </Link>
              </div>
            </div>

            {/* Right Map Area (Embedded Live Map) */}
            <div className="lg:col-span-6 h-[260px] sm:h-[320px] lg:h-full relative overflow-hidden bg-slate-950">
              <div className="absolute inset-0 z-0">
                <MapView mechanics={topMechanics} />
              </div>
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-900/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-slate-900 lg:via-transparent lg:to-transparent" />
            </div>
          </div>
        </section>

        {/* How It Works (Responsive Grid) */}
        <section className="mt-12 lg:mt-16">
          <div className="flex items-center gap-2 mb-6 animate-in">
            <div className="h-0.5 w-6 bg-turbo-orange/50" />
            <h3 className="text-foreground font-black text-sm uppercase tracking-widest">How it Works</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
            {howItWorks.map((step, i) => (
              <div key={step.title} className={`animate-in stagger-${i + 1}`}>
                <div className="flex flex-row sm:flex-col items-center sm:text-center p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:border-turbo-orange/20 transition-all gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center text-electric-blue shrink-0">
                    <MaterialIcon name={step.icon} className="text-2xl" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-foreground mb-1 uppercase tracking-wide">{step.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed font-normal">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Service Categories (Responsive Grid) */}
        <section id="tour-categories" className="mt-12 lg:mt-16">
          <div className="flex items-center justify-between mb-6 px-1 animate-in">
            <h3 className="text-foreground font-black text-lg sm:text-xl tracking-tight italic uppercase">Service Categories</h3>
            <Link href="/mechanics" className="text-turbo-orange text-xs font-bold uppercase tracking-wider hover:underline">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
            {serviceCategories.map((item, i) => (
              <Link 
                key={item.label} 
                href={`/mechanics?service=${encodeURIComponent(item.query || item.label)}`}
                className={`flex flex-col items-center gap-3 animate-in stagger-${(i % 3) + 1} group`}
              >
                <div className="w-full aspect-square max-w-[120px] glass-card rounded-3xl flex items-center justify-center text-foreground group-hover:border-turbo-orange/50 group-hover:bg-turbo-orange/5 transition-all shadow-lg">
                  <MaterialIcon name={item.icon} className="text-3xl sm:text-4xl group-hover:scale-110 group-hover:text-turbo-orange transition-all" />
                </div>
                <span className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground uppercase tracking-wider text-center">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Mechanics (Responsive Grid) */}
        <section className="mt-12 lg:mt-16">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-foreground font-black text-xl sm:text-2xl tracking-tighter italic uppercase">Top-Rated Pros</h3>
              <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Expert & Active Mechanics Near You</p>
            </div>
            <Link href="/mechanics" className="text-turbo-orange text-xs font-bold uppercase tracking-wider hover:underline">
              Browse All
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {loading ? (
              // Shared Loading State
              [1, 2, 3].map((n) => (
                <div key={n} className="glass-card p-5 rounded-3xl animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5" />
                    <div className="flex-1">
                      <div className="h-3 w-24 bg-white/5 rounded mb-2" />
                      <div className="h-2 w-12 bg-white/5 rounded" />
                    </div>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded mb-3" />
                  <div className="h-3 w-16 bg-white/5 rounded" />
                </div>
              ))
            ) : topMechanics.length > 0 ? (
              topMechanics.map((pro) => (
                <Link 
                  key={pro.id} 
                  href={`/mechanics/${pro.id}`}
                  prefetch={true}
                  className="glass-card p-5 rounded-3xl shop-card-glow cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group"
                >
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-xl overflow-hidden border border-white/10 shrink-0 relative">
                      {pro.image_url ? (
                        <Image 
                          src={pro.image_url} 
                          alt={pro.name} 
                          fill
                          sizes="(max-width: 768px) 48px, 48px"
                          className="object-cover group-hover:scale-105 transition-transform" 
                          loading="lazy"
                        />
                      ) : (
                        <MaterialIcon name="person" className="text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-black text-foreground group-hover:text-turbo-orange transition-colors truncate">{pro.name}</h4>
                      <div className="flex items-center text-turbo-orange text-xs font-bold mt-0.5">
                        <MaterialIcon name="star" className="text-xs mr-1" filled />
                        {Number(pro.rating).toFixed(1)}
                        <span className="text-muted-foreground text-[10px] ml-1.5 font-medium">({pro.review_count || 0} reviews)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground font-medium mb-4 truncate">
                    {pro.specializations?.join(" • ") || "General Automotive Repair"}
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider pt-3 border-t border-white/5">
                    <span className="text-muted-foreground text-[10px]">{pro.city || "Available Nearby"}</span>
                    {(() => {
                      const presence = getPresenceStatus(pro.last_active_at);
                      return (
                        <span className={`flex items-center gap-1.5 text-[10px] ${presence.isOnline ? 'text-emerald-400' : 'text-red-400/90'}`}>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${presence.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                          <span>{presence.label}</span>
                        </span>
                      );
                    })()}
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12 glass-card rounded-3xl">
                <p className="text-xs text-muted-foreground">No pros available yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* What is TaraFix & Full User Guide (2-Column Desktop Grid) */}
        <section className="mt-14 lg:mt-20 mb-8 animate-in">
          <div className="glass-card p-8 sm:p-12 rounded-[2.5rem] border border-white/10 relative overflow-hidden bg-gradient-to-b from-slate-900/90 to-midnight/95 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-turbo-orange/10 blur-[100px] pointer-events-none rounded-full" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-electric-blue/10 blur-[100px] pointer-events-none rounded-full" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
              {/* Left Column: Intro */}
              <div className="lg:col-span-5 text-center lg:text-left">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-electric-blue/10 text-electric-blue border border-electric-blue/20 px-3.5 py-1.5 rounded-full inline-block mb-3 shadow-lg shadow-electric-blue/10">
                  The Freelance Mechanics Network
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground italic tracking-tight uppercase leading-tight">
                  What is Tara<span className="text-electric-blue">Fix</span>?
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-4 leading-relaxed font-medium">
                  The Philippines' premier on-demand platform connecting vehicle owners with Expert, freelance automotive mechanics for home service and roadside assistance.
                </p>

                <div className="mt-8 hidden lg:grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-turbo-orange block">Zero Hidden Fees</span>
                    <span className="text-[11px] text-muted-foreground font-medium">Transparent quotes agreed before work begins</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block">Verified Pros</span>
                    <span className="text-[11px] text-muted-foreground font-medium">Background checked with real customer ratings</span>
                  </div>
                </div>
              </div>

              {/* Right Column: 4-Step Interactive Flow */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Step 1 */}
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-turbo-orange/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-turbo-orange/10 border border-turbo-orange/20 text-turbo-orange flex items-center justify-center font-black text-sm shrink-0">
                    01
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <span>Pin & Discover</span>
                      <MaterialIcon name="location_on" className="text-sm text-turbo-orange" />
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed font-normal">
                      Explore available mechanics near your location by service specialty.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-electric-blue/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-electric-blue/10 border border-electric-blue/20 text-electric-blue flex items-center justify-center font-black text-sm shrink-0">
                    02
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <span>Book in 30 Seconds</span>
                      <MaterialIcon name="touch_app" className="text-sm text-electric-blue" />
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed font-normal">
                      Choose Home Service or On-Shop, pick your date, and submit.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-turbo-orange/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-turbo-orange/10 border border-turbo-orange/20 text-turbo-orange flex items-center justify-center font-black text-sm shrink-0">
                    03
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <span>Chat & Quotes</span>
                      <MaterialIcon name="forum" className="text-sm text-turbo-orange" />
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed font-normal">
                      Discuss symptoms in private chat, send photos, and get estimates.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-electric-blue/30 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-electric-blue/10 border border-electric-blue/20 text-electric-blue flex items-center justify-center font-black text-sm shrink-0">
                    04
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <span>Track & Review</span>
                      <MaterialIcon name="verified" className="text-sm text-electric-blue" />
                    </h4>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed font-normal">
                      Track live status updates and leave verified reviews.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Developer Contact Section */}
        <section className="mt-16 lg:mt-24 mb-12 animate-in">
          <div className="glass-card p-8 lg:p-10 rounded-[2.5rem] flex flex-col items-center text-center border-white/5 relative group max-w-xl mx-auto">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-background border border-white/10 rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">
              Developer Contact
            </div>
            
            <p className="text-sm text-foreground/80 font-medium leading-relaxed mb-6 max-w-md">
              If you have any questions, feedback, or concerns regarding the platform, please reach out to the Developer.
            </p>

            <div className="flex items-center gap-6">
              {/* Facebook Icon */}
              <a 
                href="https://www.facebook.com/siliacayjavier" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-foreground hover:text-electric-blue hover:scale-110 hover:border-electric-blue/30 transition-all shadow-lg"
                title="Facebook"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>

              {/* Instagram Icon */}
              <a 
                href="https://www.instagram.com/siliacay_javier/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-foreground hover:text-turbo-orange hover:scale-110 hover:border-turbo-orange/30 transition-all shadow-lg"
                title="Instagram"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* GitHub Icon */}
              <a 
                href="https://github.com/javiersiliacay" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:scale-110 hover:border-white/30 transition-all shadow-lg"
                title="GitHub"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Admin Direct Notice / Reminder Modal for Active Mechanic Only */}
      {activeAdminNotice && userRole === "mechanic" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/85 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="w-full max-w-md glass-card border border-turbo-orange/40 rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-midnight shadow-[0_0_50px_rgba(255,95,0,0.25)] relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-turbo-orange/15 border border-turbo-orange/30 text-turbo-orange flex items-center justify-center mx-auto mb-4">
              <MaterialIcon name="campaign" className="text-3xl" />
            </div>

            <div className="text-center mb-5">
              <span className="text-[9px] font-black uppercase tracking-widest text-turbo-orange bg-turbo-orange/10 px-3 py-1 rounded-full border border-turbo-orange/20 inline-block mb-2">
                Priority Administrator Message
              </span>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">
                {activeAdminNotice.title || "Message from TaraFix Admin"}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                The platform administration team has left an important reminder for you:
              </p>
            </div>

            {/* Notice Message Content */}
            <div className="p-5 bg-midnight/70 rounded-2xl border border-turbo-orange/30 mb-6 text-left shadow-inner">
              <div className="flex items-center gap-1.5 mb-2 text-turbo-orange">
                <MaterialIcon name="priority_high" className="text-xs" />
                <span className="text-[9px] font-black uppercase tracking-widest">Notice Content</span>
              </div>
              <p className="text-xs text-foreground font-semibold leading-relaxed">
                "{activeAdminNotice.message}"
              </p>
              <div className="mt-3 pt-2 border-t border-white/5 flex justify-between text-[8px] text-muted-foreground font-mono">
                <span>Sent: {new Date(activeAdminNotice.created_at).toLocaleDateString()}</span>
                <span className="text-turbo-orange font-bold uppercase">Action Requested</span>
              </div>
            </div>

            <button
              onClick={async () => {
                const noticeId = activeAdminNotice.id;
                setActiveAdminNotice(null);
                await acknowledgeMechanicNotice(noticeId);
              }}
              className="w-full h-13 bg-turbo-orange hover:opacity-90 active:scale-95 text-midnight font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-turbo-orange/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <MaterialIcon name="check_circle" className="text-sm" />
              <span>Acknowledge & Continue</span>
            </button>
          </div>
        </div>
      )}

      {/* Revocation Notice Modal (Informs user why their mechanic status was revoked) */}
      {revocationNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/85 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="w-full max-w-sm glass-card border border-amber-500/30 rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-midnight shadow-2xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <MaterialIcon name="info" className="text-3xl" />
            </div>

            <div className="text-center mb-5">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block mb-2">
                Account Notice
              </span>
              <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">
                Mechanic Access Update
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Your mechanic access status has been modified by the platform administrators.
              </p>
            </div>

            {/* Admin Provided Reason Box */}
            <div className="p-4 bg-midnight/60 rounded-2xl border border-white/10 mb-6 text-left">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                Reason from Admin
              </span>
              <p className="text-xs text-foreground font-medium leading-relaxed italic">
                "{revocationNotice.reason}"
              </p>
            </div>

            <button
              onClick={() => setRevocationNotice(null)}
              className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-midnight font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
