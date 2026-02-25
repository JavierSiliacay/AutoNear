"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MaterialIcon } from "./material-icon"

const navItems = [
  { href: "/", icon: "home_app_logo", label: "Home" },
  { href: "/shops", icon: "search", label: "Explore" },
  { href: "/map", icon: "explore", label: "Map" },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-foreground/10 px-8 py-4 pb-8 max-w-lg mx-auto flex justify-between items-center z-[2000]">
      {navItems.map((item) => {
        const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1.5 transition-colors ${isActive ? "text-turbo-orange" : "text-muted-foreground"}`}
          >
            <MaterialIcon name={item.icon} className="font-bold" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{item.label}</span>
          </Link>
        )
      })}
      <Link
        href="/profile"
        className={`flex flex-col items-center gap-1.5 transition-colors ${pathname.startsWith("/profile") ? "text-turbo-orange" : "text-muted-foreground"}`}
      >
        <MaterialIcon name="account_circle" className="font-bold" />
        <span className="text-[10px] font-bold uppercase tracking-tighter">Profile</span>
      </Link>
    </nav>
  )
}
