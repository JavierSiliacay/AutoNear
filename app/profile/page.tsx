'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { MaterialIcon } from '@/components/material-icon';
import { BottomNav } from '@/components/bottom-nav';
import { AppHeader } from '@/components/app-header';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
            } else {
                setUser(user);
            }
            setLoading(false);
        };
        getUser();
    }, [router, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-midnight flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-turbo-orange border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-midnight pb-24">
            <AppHeader title="My Profile" />

            <main className="max-w-lg mx-auto px-6 pt-8">
                <div className="glass-card rounded-3xl p-8 border border-white/5 relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-turbo-orange/10 blur-3xl -mr-16 -mt-16 rounded-full" />

                    <div className="flex flex-col items-center text-center relative z-10">
                        <div className="w-24 h-24 bg-turbo-orange/20 rounded-full flex items-center justify-center border-2 border-turbo-orange/30 mb-4 shadow-[0_0_40px_rgba(255,95,0,0.15)]">
                            <MaterialIcon name="person" className="text-5xl text-turbo-orange" />
                        </div>
                        <h2 className="text-xl font-black text-foreground uppercase tracking-tight mb-1">
                            {user?.email?.split('@')[0] || 'Car Enthusiast'}
                        </h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
                            {user?.email}
                        </p>
                    </div>

                    <div className="h-px bg-white/5 my-8" />

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4 p-4 glass rounded-2xl border border-white/5">
                            <div className="w-10 h-10 bg-electric-blue/10 rounded-xl flex items-center justify-center text-electric-blue">
                                <MaterialIcon name="directions_car" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">My Garage</p>
                                <p className="text-sm font-bold text-foreground">0 Vehicles Saved</p>
                            </div>
                            <MaterialIcon name="chevron_right" className="ml-auto text-muted-foreground/30" />
                        </div>

                        <div className="flex items-center gap-4 p-4 glass rounded-2xl border border-white/5">
                            <div className="w-10 h-10 bg-turbo-orange/10 rounded-xl flex items-center justify-center text-turbo-orange">
                                <MaterialIcon name="history" />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Service History</p>
                                <p className="text-sm font-bold text-foreground">View past requests</p>
                            </div>
                            <MaterialIcon name="chevron_right" className="ml-auto text-muted-foreground/30" />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full h-14 glass border border-destructive/20 rounded-2xl flex items-center justify-center gap-3 text-destructive font-black uppercase tracking-widest text-xs hover:bg-destructive/10 transition-all"
                >
                    <MaterialIcon name="logout" />
                    Sign Out
                </button>
            </main>

            <BottomNav />
        </div>
    );
}
