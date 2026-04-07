'use client';

import Link from "next/link"
import { MaterialIcon } from "./material-icon"
import type { Mechanic } from "@/lib/types"

interface MechanicCardProps {
  mechanic: Mechanic
  distance?: number | null
}

export function MechanicCard({ mechanic, distance }: MechanicCardProps) {
  const detailUrl = `/mechanics/${mechanic.id}`

  return (
    <div className="glass-card shop-card-glow rounded-[2rem] overflow-hidden animate-in group">
      <Link href={detailUrl} className="block">
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-5 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-midnight/50 border border-white/5 overflow-hidden flex-shrink-0 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-turbo-orange/10 to-transparent pointer-events-none" />
                {mechanic.image_url ? (
                  <img src={mechanic.image_url} alt={mechanic.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                    <MaterialIcon name="person" className="text-4xl" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-foreground font-black text-xl italic tracking-tighter truncate uppercase leading-none">{mechanic.name}</h3>
                  {mechanic.is_verified && (
                    <div className="flex items-center text-electric-blue" title="Verified Pro">
                      <MaterialIcon name="verified" className="text-base" filled />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MaterialIcon name="location_on" className="text-xs text-turbo-orange" />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] truncate">
                    {mechanic.city}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-turbo-orange/10 backdrop-blur-md px-3 py-1.5 rounded-xl flex flex-col items-center border border-turbo-orange/20 shrink-0 shadow-lg shadow-turbo-orange/5">
              <span className="text-turbo-orange font-black text-sm leading-none">{Number(mechanic.rating).toFixed(1)}</span>
              <div className="flex gap-0.5 mt-0.5">
                <MaterialIcon name="star" className="text-turbo-orange text-[8px]" filled />
              </div>
            </div>
          </div>

          <div className="mt-6 mb-4">
             <div className="flex flex-wrap gap-1.5">
              {mechanic.specializations.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-white/5 border border-white/5 text-[8px] font-black text-foreground/60 uppercase tracking-widest rounded-lg"
                >
                  {tag}
                </span>
              ))}
              {mechanic.specializations.length > 3 && (
                 <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest self-center ml-1">
                   +{mechanic.specializations.length - 3} Pro Skills
                 </span>
              )}
            </div>
          </div>
          
          {mechanic.bio && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mb-6 leading-relaxed font-medium">
              {mechanic.bio}
            </p>
          )}
        </div>
      </Link>

      <div className="px-6 pb-6">
        <div className="flex items-center gap-3">
          <Link
            href={detailUrl}
            className="flex-1 h-14 bg-turbo-orange text-midnight font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-turbo-orange/10 italic"
          >
            BOOK PROFESSIONAL
          </Link>
          {mechanic.phone && (
            <a
              href={`tel:${mechanic.phone}`}
              className="w-14 h-14 flex items-center justify-center border border-white/5 glass-dark rounded-2xl text-foreground hover:bg-white/5 transition-all active:scale-90"
              aria-label={`Call ${mechanic.name}`}
            >
              <MaterialIcon name="call" className="text-lg" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
