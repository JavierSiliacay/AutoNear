'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { MaterialIcon } from '@/components/material-icon';
import { BottomNav } from '@/components/bottom-nav';
import { AppHeader } from '@/components/app-header';
import { getUsersServiceRequests } from '@/lib/actions';
import { ServiceChat } from '@/components/service-chat';

export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [activeChat, setActiveChat] = useState<any | null>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const getUserAndRequests = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
            } else {
                setUser(user);
                const userRequests = await getUsersServiceRequests(user.email!);
                setRequests(userRequests);
            }
            setLoading(false);
        };
        getUserAndRequests();
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
                <div className="glass-card rounded-3xl p-8 border border-white/5 relative overflow-hidden mb-8">
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
                </div>

                {/* Active Support Requests */}
                <div className="mb-10">
                    <div className="flex items-center justify-between mb-6 px-1">
                        <h3 className="text-foreground font-bold text-lg tracking-tight uppercase">Active Requests</h3>
                        <div className="h-px flex-1 bg-white/5 mx-4" />
                        <span className="bg-turbo-orange/10 text-turbo-orange text-[9px] font-black uppercase px-2 py-0.5 rounded border border-turbo-orange/20 tracking-widest">
                            Live
                        </span>
                    </div>

                    {requests.length === 0 ? (
                        <div className="glass-card rounded-2xl p-10 text-center border-dashed border-foreground/10 opacity-50">
                            <MaterialIcon name="history" className="text-4xl text-muted-foreground mb-4" />
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest leading-relaxed"> No active service requests.<br />Need help? Visit the map!</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {requests.map((req) => (
                                <div key={req.id} className="glass-card rounded-2xl p-5 border-white/5 flex items-center gap-4 hover:border-white/10 transition-all group">
                                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-turbo-orange group-hover:scale-110 transition-transform">
                                        <MaterialIcon name="build" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="text-foreground font-bold text-sm truncate uppercase tracking-tight">{req.shop_name}</h4>
                                            <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border ${req.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    req.status === 'on going' ? 'bg-electric-blue/10 text-electric-blue border-electric-blue/20' :
                                                        'bg-turbo-orange/10 text-turbo-orange border-turbo-orange/20'
                                                }`}>
                                                {req.status || 'pending'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{req.vehicle_info || 'Unknown Vehicle'}</p>
                                    </div>
                                    <button
                                        onClick={() => setActiveChat(req)}
                                        className="w-12 h-12 bg-turbo-orange/20 text-turbo-orange rounded-xl flex items-center justify-center border border-turbo-orange/30 hover:bg-turbo-orange hover:text-midnight transition-all"
                                    >
                                        <MaterialIcon name="chat" className="text-base" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-10">
                    <button
                        onClick={handleLogout}
                        className="w-full h-14 glass border border-destructive/20 rounded-2xl flex items-center justify-center gap-3 text-destructive font-black uppercase tracking-widest text-xs hover:bg-destructive/10 transition-all shadow-lg"
                    >
                        <MaterialIcon name="logout" />
                        Sign Out
                    </button>
                </div>
            </main>

            {activeChat && (
                <ServiceChat
                    requestId={activeChat.id}
                    recipientName="AutoNear Support"
                    currentUserEmail={user?.email!}
                    currentUserRole="customer"
                    onClose={() => setActiveChat(null)}
                />
            )}

            <BottomNav />
        </div>
    );
}
