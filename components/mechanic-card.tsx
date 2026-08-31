'use client'

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { MaterialIcon } from "./material-icon"
import type { Mechanic } from "@/lib/types"
import { getPresenceStatus } from "@/lib/presence"
import { PhotoLightboxModal } from "./photo-lightbox-modal"

interface MechanicCardProps {
  mechanic: Mechanic
  distance?: number | null
  onSelect?: () => void
  isSelected?: boolean
}

export function MechanicCard({ mechanic, distance, onSelect, isSelected }: MechanicCardProps) {
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false)
  const detailUrl = `/mechanics/${mechanic.id}`
  const presence = getPresenceStatus(mechanic.last_active_at)

  const handleCardClick = (e: React.MouseEvent) => {
    if (onSelect) {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <>
      <div className={`glass-card shop-card-glow rounded-[2rem] overflow-hidden animate-in group transition-all ${isSelected ? "ring-2 ring-turbo-orange shadow-[0_0_30px_rgba(255,95,0,0.35)] scale-[1.01]" : ""}`}>
        <div onClick={handleCardClick} className="block cursor-pointer">
          <div className="p-4 sm:p-6 pb-0">
            <div className="flex items-start justify-between gap-2.5 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div 
                  onClick={(e) => {
                    if (mechanic.image_url) {
                      e.stopPropagation()
                      e.preventDefault()
                      setIsPhotoLightboxOpen(true)
                    }
                  }}
                  className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-midnight/50 border border-white/5 overflow-hidden shrink-0 relative cursor-pointer hover:border-turbo-orange hover:scale-105 transition-all group/avatar"
                  title="Click to view & zoom photo"
                >
                  <div className="absolute inset-0 bg-gradient-to-tr from-turbo-orange/10 to-transparent pointer-events-none z-10" />
                  {mechanic.image_url ? (
                    <>
                      <Image 
                        src={mechanic.image_url} 
                        alt={mechanic.name}
                        fill
                        sizes="(max-width: 768px) 56px, 64px"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center z-20">
                        <MaterialIcon name="zoom_in" className="text-white text-base" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                      <MaterialIcon name="person" className="text-3xl sm:text-4xl" />
                    </div>
                  )}
                  <span className={`absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-midnight z-30 ${
                    presence.isOnline ? "bg-emerald-500" : "bg-red-500"
                  }`} title={presence.label} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1 min-w-0">
                    <h3 className="text-foreground font-black text-base sm:text-lg lg:text-xl italic tracking-tighter truncate uppercase leading-none min-w-0 flex-1">
                      {mechanic.name}
                    </h3>
                    {mechanic.is_verified && (
                      <div className="flex items-center text-electric-blue shrink-0" title="Verified Pro">
                        <MaterialIcon name="verified" className="text-sm sm:text-base" filled />
                      </div>
                    )}
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                  <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                    <MaterialIcon name="location_on" className="text-xs text-turbo-orange" />
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] truncate max-w-[100px] sm:max-w-[160px]">
                      {mechanic.city}
                    </span>
                  </div>
                  <span className="text-white/20 text-[8px]">•</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {presence.isOnline ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="text-[8px] font-black uppercase tracking-wider text-emerald-400">
                          Active Now
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        <span className="text-[8px] font-bold uppercase tracking-wider text-red-400/90">
                          {presence.label}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-turbo-orange/10 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl flex flex-col items-center border border-turbo-orange/20 shrink-0 shadow-lg shadow-turbo-orange/5 min-w-[42px] sm:min-w-[48px]">
              <div className="flex items-center gap-0.5">
                <span className="text-turbo-orange font-black text-xs sm:text-sm leading-none">{Number(mechanic.rating).toFixed(1)}</span>
                <MaterialIcon name="star" className="text-turbo-orange text-[9px] sm:text-[10px]" filled />
              </div>
              <span className="text-[7px] sm:text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5 whitespace-nowrap">
                {mechanic.review_count || 0} rev
              </span>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 mb-3 sm:mb-4">
             <div className="flex flex-wrap gap-1.5">
              {mechanic.specializations.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 sm:py-1 bg-white/5 border border-white/5 text-[8px] font-black text-foreground/60 uppercase tracking-widest rounded-lg truncate max-w-[130px] sm:max-w-none"
                >
                  {tag}
                </span>
              ))}
              {mechanic.specializations.length > 3 && (
                 <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest self-center ml-1 shrink-0">
                   +{mechanic.specializations.length - 3} Pro Skills
                 </span>
              )}
            </div>
          </div>
          
          {mechanic.bio && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mb-4 sm:mb-6 leading-relaxed font-medium">
              {mechanic.bio}
            </p>
          )}
        </div>
      </div>

      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="flex items-center gap-3">
          <Link
            href={detailUrl}
            prefetch={true}
            className="flex-1 h-12 sm:h-14 bg-turbo-orange text-midnight font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-turbo-orange/10 italic"
          >
            BOOK PROFESSIONAL
          </Link>
          {mechanic.phone && (
            <a
              href={`tel:${mechanic.phone}`}
              className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center border border-white/5 glass-dark rounded-2xl text-foreground hover:bg-white/5 transition-all active:scale-90"
              aria-label={`Call ${mechanic.name}`}
            >
              <MaterialIcon name="call" className="text-lg" />
            </a>
          )}
        </div>
      </div>
    </div>

    {/* Interactive Expandable Photo Lightbox with Zoom */}
    {mechanic.image_url && (
      <PhotoLightboxModal
        isOpen={isPhotoLightboxOpen}
        onClose={() => setIsPhotoLightboxOpen(false)}
        imageUrl={mechanic.image_url}
        title={mechanic.name}
        subtitle={[mechanic.city, mechanic.specializations?.[0]].filter(Boolean).join(" • ")}
        presence={presence}
      />
    )}
  </>
)
}
