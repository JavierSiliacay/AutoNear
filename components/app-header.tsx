"use client"

import React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MaterialIcon } from "./material-icon"
import { useNotifications } from "@/lib/notification-context"

interface AppHeaderProps {
  rightAction?: React.ReactNode
  title?: string
}

export function AppHeader({ rightAction, title }: AppHeaderProps) {
  const pathname = usePathname()
  const { totalUnread } = useNotifications()

  const navLinks = [
    { href: "/", label: "Home", icon: "home_app_logo" },
    { href: "/mechanics", label: "Mechanics", icon: "search" },
    { href: "/map", label: "Live Map", icon: "explore" },
    { href: "/profile", label: "Profile", icon: "account_circle" },
  ]

  return (
    <header className="sticky top-0 z-50 glass border-b border-foreground/5 backdrop-blur-xl">
      <div className="flex items-center justify-between px-5 md:px-8 h-16 max-w-7xl mx-auto">
        {title ? (
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <MaterialIcon name="arrow_back" />
            </Link>
            <h1 className="text-lg font-black uppercase tracking-tight text-foreground">{title}</h1>
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-turbo-orange rounded-xl overflow-hidden shadow-lg shadow-turbo-orange/20 group-hover:scale-105 transition-transform">
              <img src="/logo.png" alt="TaraFix Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-foreground font-extrabold text-xl tracking-tight italic">
              Tara<span className="text-electric-blue">Fix</span>
            </span>
          </Link>
        )}

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-full">
          {navLinks.map((link) => {
            const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
            const tourId = link.label === "Profile" ? "tour-desktop-profile" : undefined
            return (
              <Link
                key={link.href}
                id={tourId}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all relative ${
                  isActive
                    ? "bg-turbo-orange text-midnight shadow-md shadow-turbo-orange/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <MaterialIcon name={link.icon} className="text-base" />
                <span>{link.label}</span>
                {link.label === "Profile" && totalUnread > 0 && (
                  <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-midnight">
                    {totalUnread > 99 ? "99+" : totalUnread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right Action / Profile Greeting */}
        <div className="flex items-center gap-3">
          {rightAction}
        </div>
      </div>
    </header>
  )
}

