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
    <div className="glass-card shop-card-glow rounded-2xl overflow-hidden animate-in">
      <Link href={detailUrl} className="block">
        <div className="p-5 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 overflow-hidden flex-shrink-0">
                {mechanic.image_url ? (
                  <img src={mechanic.image_url} alt={mechanic.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <MaterialIcon name="person" className="text-3xl" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <h3 className="text-foreground font-extrabold text-lg tracking-tight truncate">{mechanic.name}</h3>
                  {mechanic.is_verified && (
                    <MaterialIcon name="verified" className="text-electric-blue text-sm" filled />
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MaterialIcon name="location_on" className="text-xs" />
                  <span className="text-[10px] font-bold uppercase tracking-tighter truncate">
                    {mechanic.city}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-midnight/80 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-foreground/10 shrink-0">
              <MaterialIcon name="star" className="text-turbo-orange text-xs" filled />
              <span className="text-foreground font-black text-xs">{Number(mechanic.rating).toFixed(1)}</span>
            </div>
          </div>

          <div className="mt-4 mb-4">
             <div className="flex flex-wrap gap-2">
              {mechanic.specializations.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-electric-blue/10 border border-electric-blue/20 text-[9px] font-black text-electric-blue uppercase tracking-widest rounded"
                >
                  {tag}
                </span>
              ))}
              {mechanic.specializations.length > 3 && (
                 <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest self-center">
                   +{mechanic.specializations.length - 3} More
                 </span>
              )}
            </div>
          </div>
          
          {mechanic.bio && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed italic">
              "{mechanic.bio}"
            </p>
          )}
        </div>
      </Link>

      <div className="p-5 pt-0">
        <div className="flex items-center gap-3">
          <Link
            href={detailUrl}
            className="flex-1 h-12 bg-turbo-orange orange-glow text-midnight font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            BOOK MECHANIC
          </Link>
          {mechanic.phone && (
            <a
              href={`tel:${mechanic.phone}`}
              className="w-12 h-12 flex items-center justify-center border border-foreground/10 rounded-xl text-foreground hover:bg-foreground/5 transition-colors"
              aria-label={`Call ${mechanic.name}`}
            >
              <MaterialIcon name="call" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
