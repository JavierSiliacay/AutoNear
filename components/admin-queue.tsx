'use client';

import { useState, useEffect } from 'react';
import { MaterialIcon } from '@/components/material-icon';
import { getShopRequests, getMechanicRequests, getMechanics, updateShopRequestStatus, updateMechanicRequestStatus, getMechanicStats } from '@/lib/actions';
import type { ShopRequest, MechanicRequest, Mechanic } from '@/lib/types';

export function AdminQueue({ adminEmail }: { adminEmail: string }) {
    const [shopRequests, setShopRequests] = useState<ShopRequest[]>([]);
    const [mechanicRequests, setMechanicRequests] = useState<MechanicRequest[]>([]);
    const [allMechanics, setAllMechanics] = useState<Mechanic[]>([]);
    const [activeTab, setActiveTab] = useState<'mechanics' | 'stats'>('stats');
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        const [requests, mechanics] = await Promise.all([
            getMechanicRequests(),
            getMechanics()
        ]);
        setMechanicRequests(requests as MechanicRequest[]);
        setAllMechanics(mechanics);
        setIsLoading(false);
    }

    async function handleMechanicAction(requestId: string, status: 'approved' | 'rejected') {
        setProcessingId(requestId);
        const result = await updateMechanicRequestStatus(requestId, status);
        if (result.success) {
            loadData();
        } else {
            alert(result.error);
        }
        setProcessingId(null);
    }

    const pendingMechanicRequests = mechanicRequests.filter(r => r.status === 'pending');
    
    // Calculate Stats
    const totalEarningsEst = allMechanics.length * 12500; // Placeholder for simulated ecosystem value
    const avgRating = allMechanics.length > 0 ? (allMechanics.reduce((acc, m) => acc + m.rating, 0) / allMechanics.length).toFixed(1) : "0.0";
    const topMechanic = allMechanics.length > 0 ? allMechanics[0] : null;

    return (
        <div className="flex flex-col gap-8">
            {/* Tab Navigation */}
            <div className="flex flex-col items-center gap-6">
                <div className="flex bg-midnight/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'stats'
                            ? 'bg-turbo-orange text-midnight shadow-lg shadow-turbo-orange/20'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Platform Stats
                    </button>
                    <button
                        onClick={() => setActiveTab('mechanics')}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'mechanics'
                            ? 'bg-turbo-orange text-midnight shadow-lg shadow-turbo-orange/20'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Mechanic Approval
                    </button>
                </div>

                <div className="text-center">
                    <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">
                        {activeTab === 'stats' ? 'Mechanic Ecosystem' : 'Mechanic Approval Queue'}
                    </h2>
                    <p className="text-[10px] font-black text-turbo-orange uppercase tracking-[0.3em] mt-2">Administrative Dashboard</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-turbo-orange border-t-transparent rounded-full animate-spin" />
                </div>
            ) : activeTab === 'stats' ? (
                // STATISTICS VIEW
                <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="glass-card rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border-white/5 flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-16 h-16 bg-turbo-orange/10 rounded-2xl flex items-center justify-center text-turbo-orange mb-4">
                                <MaterialIcon name="engineering" className="text-2xl sm:text-3xl" />
                            </div>
                            <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter leading-none">{allMechanics.length}</h3>
                            <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Total Mechanics</p>
                        </div>

                        <div className="glass-card rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border-white/5 flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-16 h-16 bg-electric-blue/10 rounded-2xl flex items-center justify-center text-electric-blue mb-4">
                                <MaterialIcon name="pending_actions" className="text-2xl sm:text-3xl" />
                            </div>
                            <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter leading-none">{pendingMechanicRequests.length}</h3>
                            <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Pending Review</p>
                        </div>

                        <div className="glass-card rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border-white/5 flex flex-col items-center text-center sm:col-span-2 lg:col-span-1">
                            <div className="w-12 h-12 sm:w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mb-4">
                                <MaterialIcon name="star" className="text-2xl sm:text-3xl" filled />
                            </div>
                            <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter leading-none">{avgRating}</h3>
                            <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Avg Platform Rating</p>
                        </div>
                    </div>

                    {/* MECHANICS PERFORMANCE LIST */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* Mechanics List */}
                        <div className="lg:col-span-1 glass-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 border-white/5 h-[400px] lg:h-[600px] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-base sm:text-lg font-black text-foreground uppercase tracking-tight italic">Platform Mechanics</h4>
                                <MaterialIcon name="groups" className="text-turbo-orange text-xl sm:text-2xl" />
                            </div>
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                                {allMechanics.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedMechanicId(m.id)}
                                        className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left ${
                                            selectedMechanicId === m.id 
                                            ? 'bg-turbo-orange/10 border-turbo-orange/30 shadow-[0_0_20px_rgba(255,95,0,0.1)]' 
                                            : 'bg-midnight/30 border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-midnight border border-white/10 overflow-hidden shrink-0">
                                            {m.image_url ? (
                                                <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-turbo-orange text-sm font-black uppercase">{m.name.charAt(0)}</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-[13px] font-black text-foreground uppercase truncate tracking-tight">{m.name}</h5>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${m.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{m.city}</span>
                                            </div>
                                        </div>
                                        <MaterialIcon name="chevron_right" className={`text-xl ${selectedMechanicId === m.id ? 'text-turbo-orange' : 'text-white/10'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Performance Panel */}
                        <div className="lg:col-span-2">
                                {selectedMechanicId ? (
                                <PerformancePanel mechanicId={selectedMechanicId} mechanic={allMechanics.find(m => m.id === selectedMechanicId)!} />
                            ) : (
                                <div className="glass-card rounded-[2rem] sm:rounded-[3rem] p-8 border-white/5 border-dashed flex flex-col items-center justify-center h-[300px] lg:h-full text-center">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-4 animate-pulse">
                                        <MaterialIcon name="analytics" className="text-3xl sm:text-4xl" />
                                    </div>
                                    <h5 className="text-[11px] sm:text-sm font-black text-muted-foreground uppercase tracking-widest">Select a mechanic<br/>to view performance</h5>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // MECHANIC REGISTRATION VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingMechanicRequests.length === 0 ? (
                        <div className="glass-card rounded-2xl p-10 text-center border-dashed border-foreground/10">
                            <MaterialIcon name="verified" className="text-4xl text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Queue is clear</p>
                        </div>
                    ) : (
                        pendingMechanicRequests.map((req) => (
                            <div key={req.id} className="glass-card rounded-3xl p-6 border-white/5 animate-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{req.full_name}</h3>
                                        <p className="text-xs font-bold text-turbo-orange uppercase tracking-widest mt-0.5">{req.experience_years} Years Experience</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Submitted</p>
                                        <p className="text-[10px] text-foreground font-bold">{new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="grid gap-3 mb-6">
                                    <div className="flex items-start gap-3 p-3 bg-midnight/40 rounded-xl border border-white/5">
                                        <MaterialIcon name="email" className="text-sm text-turbo-orange mt-0.5" />
                                        <p className="text-xs text-muted-foreground leading-relaxed">{req.email}</p>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-midnight/40 rounded-xl border border-white/5">
                                        <MaterialIcon name="contact_phone" className="text-sm text-turbo-orange" />
                                        <p className="text-xs text-muted-foreground">{req.contact_number}</p>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-midnight/40 rounded-xl border border-white/5">
                                        <MaterialIcon name="build" className="text-sm text-turbo-orange" />
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">{req.specializations.join(', ')}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <a
                                        href={`https://www.google.com/maps?q=${req.google_maps_pin_lat},${req.google_maps_pin_lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-12 glass border border-electric-blue/30 text-electric-blue text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:bg-electric-blue/10 transition-all"
                                    >
                                        <MaterialIcon name="location_on" className="text-sm" />
                                        View Service Base
                                    </a>

                                    <div className="flex gap-3 mt-2">
                                        <button
                                            disabled={!!processingId}
                                            onClick={() => handleMechanicAction(req.id, 'approved')}
                                            className="flex-1 h-12 bg-green-500 text-midnight text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                                        >
                                            {processingId === req.id ? (
                                                <div className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <MaterialIcon name="check" className="text-sm" />
                                                    Approve
                                                </>
                                            )}
                                        </button>
                                        <button
                                            disabled={!!processingId}
                                            onClick={() => handleMechanicAction(req.id, 'rejected')}
                                            className="flex-1 h-12 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 disabled:opacity-50"
                                        >
                                            <MaterialIcon name="close" className="text-sm" />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

        </div>
    );
}

function PerformancePanel({ mechanicId, mechanic }: { mechanicId: string, mechanic: Mechanic }) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            setLoading(true);
            const data = await getMechanicStats(mechanicId);
            setStats(data);
            setLoading(false);
        }
        loadStats();
    }, [mechanicId]);

    if (loading) return (
        <div className="glass-card rounded-[3rem] p-8 border-white/5 h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-turbo-orange border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="glass-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border-white/5 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8 sm:mb-10">
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-midnight border-2 border-turbo-orange/40 overflow-hidden shrink-0">
                        {mechanic.image_url ? (
                            <img src={mechanic.image_url} alt={mechanic.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-turbo-orange text-2xl sm:text-3xl font-black">{mechanic.name.charAt(0)}</div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight italic leading-tight">{mechanic.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                            <span className="flex items-center gap-1 text-turbo-orange">
                                <MaterialIcon name="star" className="text-xs sm:text-sm" filled />
                                <span className="text-[11px] sm:text-xs font-black">{stats?.avgRating?.toFixed(1) || "5.0"}</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-0.5 sm:py-1 rounded shrink-0">
                                {mechanic.city}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="w-full sm:w-auto flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                    <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</p>
                    <span className={`px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${mechanic.is_available ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {mechanic.is_available ? 'Available' : 'Unavailable'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
                <StatBox label="Done" value={stats?.completed} color="text-green-500" icon="check_circle" />
                <StatBox label="Pending" value={stats?.pending} color="text-turbo-orange" icon="schedule" />
                <StatBox label="Failed" value={stats?.cancelled} color="text-red-500" icon="cancel" />
                <StatBox label="Active" value={stats?.active} color="text-electric-blue" icon="handyman" />
            </div>

            <div className="flex-1 space-y-4 sm:space-y-6">
                <div className="p-5 sm:p-6 bg-midnight/30 rounded-[1.5rem] sm:rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Efficiency</span>
                        <MaterialIcon name="speed" className="text-turbo-orange text-lg sm:text-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:gap-8">
                        <div>
                            <p className="text-lg sm:text-xl font-black text-foreground tracking-tight">~24 mins</p>
                            <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Response Time</p>
                        </div>
                        <div>
                            <p className="text-lg sm:text-xl font-black text-foreground tracking-tight">{stats?.reviewCount}</p>
                            <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Feedbacks</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 bg-midnight/30 rounded-[1.5rem] sm:rounded-3xl border border-white/5 flex items-center justify-between">
                    <div className="min-w-0">
                        <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Last Activity</span>
                        <p className="text-[11px] sm:text-xs font-black text-foreground uppercase tracking-tight italic truncate">
                            {stats?.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'No recent activity'}
                        </p>
                    </div>
                    <MaterialIcon name="history" className="text-muted-foreground shrink-0" />
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value, color, icon }: { label: string, value: any, color: string, icon: string }) {
    return (
        <div className="p-4 bg-midnight/30 rounded-2xl border border-white/5 flex flex-col items-center text-center">
            <MaterialIcon name={icon} className={`text-xl ${color} mb-2`} />
            <span className="text-xl font-black text-white leading-none">{value || 0}</span>
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-2">{label}</span>
        </div>
    );
}
