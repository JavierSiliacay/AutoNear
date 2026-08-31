'use client';

import { useState, useEffect, useRef } from 'react';
import { MaterialIcon } from './material-icon';

export interface PhotoLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
  subtitle?: string;
  presence?: {
    isOnline: boolean;
    label: string;
  };
  actionLabel?: string;
  actionIcon?: string;
  onAction?: () => void;
}

export function PhotoLightboxModal({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
  presence,
  actionLabel,
  actionIcon,
  onAction,
}: PhotoLightboxModalProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  // Reset zoom & pan when image changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.5, 3.5));
  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleDoubleTapOrClick = () => {
    if (zoom > 1) {
      handleResetZoom();
    } else {
      setZoom(2);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#0d1527] border border-white/20 rounded-[2.5rem] p-5 sm:p-6 text-center shadow-[0_25px_80px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-200 overflow-hidden z-10">
        {/* Top Header / Close Button */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-wider text-muted-foreground">
            <MaterialIcon name="zoom_in" className="text-xs text-turbo-orange" />
            <span>Interactive Viewer</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-20 cursor-pointer"
            title="Close"
          >
            <MaterialIcon name="close" className="text-xl" />
          </button>
        </div>

        {/* Zoomable Image Container */}
        <div
          className="w-full aspect-square rounded-3xl overflow-hidden border-2 border-white/15 bg-black/80 shadow-2xl relative mb-4 cursor-grab active:cursor-grabbing flex items-center justify-center touch-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleTapOrClick}
        >
          <img
            src={imageUrl}
            alt={title}
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            }}
            className="w-full h-full object-cover pointer-events-none"
            referrerPolicy="no-referrer"
          />

          {/* Floating Zoom Controls Bar */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-full border border-white/20 shadow-xl z-30">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
              title="Zoom Out"
            >
              <MaterialIcon name="remove" className="text-sm" />
            </button>
            <span className="text-[10px] font-black text-white px-1.5 min-w-[36px]">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3.5}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
              title="Zoom In"
            >
              <MaterialIcon name="add" className="text-sm" />
            </button>
            {zoom > 1 && (
              <button
                onClick={handleResetZoom}
                className="px-2 h-7 rounded-full bg-turbo-orange text-midnight text-[9px] font-black uppercase tracking-wider flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ml-1"
                title="Reset Zoom"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Caption & Live Status */}
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <h3 className="text-lg font-black text-white uppercase italic tracking-tight truncate">
              {title}
            </h3>
            {presence && (
              <div
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${
                  presence.isOnline
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    presence.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <span>{presence.isOnline ? 'Active Now' : presence.label}</span>
              </div>
            )}
          </div>
          {subtitle && (
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 mt-4 pt-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 h-11 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
          {onAction && actionLabel && (
            <button
              onClick={() => {
                onClose();
                onAction();
              }}
              className="flex-1 h-11 bg-turbo-orange text-midnight text-[10px] font-black uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-turbo-orange/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {actionIcon && <MaterialIcon name={actionIcon} className="text-sm" />}
              <span>{actionLabel}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
