import React from "react"
import Link from "next/link"
import { MaterialIcon } from "./material-icon"

interface AppHeaderProps {
  rightAction?: React.ReactNode
  title?: string
}

export function AppHeader({ rightAction, title }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 glass border-b border-foreground/5">
      <div className="flex items-center justify-between px-5 h-16 max-w-lg mx-auto">
        {title ? (
          <div className="flex items-center gap-4">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <MaterialIcon name="arrow_back" />
            </Link>
            <h1 className="text-lg font-black uppercase tracking-tight text-foreground">{title}</h1>
          </div>
        ) : (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-turbo-orange rounded-lg flex items-center justify-center text-midnight">
              <MaterialIcon name="minor_crash" className="font-bold text-2xl" />
            </div>
            <span className="text-foreground font-extrabold text-xl tracking-tight italic">AutoNear</span>
          </Link>
        )}
        {rightAction}
      </div>
    </header>
  )
}
