'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MaterialIcon } from './material-icon';

export function AvailabilityStatus({ initialStatus, mechanicId }: { initialStatus: boolean, mechanicId: string }) {
    const [isAvailable, setIsAvailable] = useState(initialStatus);
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
                    setIsAvailable(payload.new.is_available);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [mechanicId, supabase]);

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500 ${
            isAvailable 
                ? 'bg-green-500/10 text-green-500 border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]' 
                : 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
        }`}>
            <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                Status: {isAvailable ? 'Available' : 'Unavailable'}
            </span>
        </div>
    );
}
