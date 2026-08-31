'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getPresenceStatus } from '@/lib/presence';

export function AvailabilityStatus({ initialStatus, mechanicId, lastActiveAt }: { initialStatus: boolean, mechanicId: string, lastActiveAt?: string | null }) {
    const [isAvailable, setIsAvailable] = useState(initialStatus);
    const [currentLastActive, setCurrentLastActive] = useState<string | null>(lastActiveAt || null);
    const supabase = createClient();

    useEffect(() => {
        const channel = supabase
            .channel(`mechanic_status_${mechanicId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'mechanics',
                    filter: `id=eq.${mechanicId}`
                },
                (payload) => {
                    if (typeof payload.new.is_available === 'boolean') {
                        setIsAvailable(payload.new.is_available);
                    }
                    if (payload.new.last_active_at) {
                        setCurrentLastActive(payload.new.last_active_at);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [mechanicId, supabase]);

    const presence = getPresenceStatus(currentLastActive);

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500 ${
                isAvailable 
                    ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                    : 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
            }`}>
                <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                    {isAvailable ? 'Available for Jobs' : 'Off-Duty'}
                </span>
            </div>

            {/* Live Presence Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-white/5 border-white/10 text-[10px]">
                {presence.isOnline ? (
                    <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-400 font-black uppercase tracking-wider">Active Now</span>
                    </>
                ) : (
                    <>
                        <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                        <span className="text-muted-foreground/80 font-bold uppercase tracking-wider">{presence.label}</span>
                    </>
                )}
            </div>
        </div>
    );
}
