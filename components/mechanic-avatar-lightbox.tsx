'use client';

import { useState } from 'react';
import { MaterialIcon } from './material-icon';
import { PhotoLightboxModal } from './photo-lightbox-modal';

interface MechanicAvatarLightboxProps {
  imageUrl?: string | null;
  name: string;
  subtitle?: string;
  presence?: {
    isOnline: boolean;
    label: string;
  };
}

export function MechanicAvatarLightbox({
  imageUrl,
  name,
  subtitle,
  presence,
}: MechanicAvatarLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!imageUrl) {
    return (
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800 flex items-center justify-center text-3xl overflow-hidden border border-white/10 shrink-0">
        <MaterialIcon name="person" className="text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => setIsOpen(true)}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden border-2 border-turbo-orange/30 shadow-lg shrink-0 cursor-pointer hover:scale-105 hover:border-turbo-orange transition-all relative group"
        title="Click to view & zoom profile picture"
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        {/* Zoom Micro Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <MaterialIcon name="zoom_in" className="text-white text-2xl" />
        </div>
      </div>

      <PhotoLightboxModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        imageUrl={imageUrl}
        title={name}
        subtitle={subtitle}
        presence={presence}
      />
    </>
  );
}
