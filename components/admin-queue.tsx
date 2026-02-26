'use client';

import { useState, useEffect } from 'react';
import { MaterialIcon } from '@/components/material-icon';
import { getShopRequests, getServiceRequests, updateShopRequestStatus } from '@/lib/actions';
import type { ShopRequest, ServiceRequest } from '@/lib/types';

type ExtendedServiceRequest = ServiceRequest & { shop_name: string };

export function AdminQueue() {
    const [shopRequests, setShopRequests] = useState<ShopRequest[]>([]);
    const [serviceRequests, setServiceRequests] = useState<ExtendedServiceRequest[]>([]);
    const [activeTab, setActiveTab] = useState<'shops' | 'services'>('services');
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        const [shops, services] = await Promise.all([
            getShopRequests(),
            getServiceRequests()
        ]);
        setShopRequests(shops as ShopRequest[]);
        setServiceRequests(services as ExtendedServiceRequest[]);
        setIsLoading(false);
    }

    async function handleAction(id: string, status: 'approved' | 'rejected') {
        let reason = '';
        if (status === 'rejected') {
            reason = prompt('Enter rejection reason:') || 'Information could not be verified.';
        }

        setProcessingId(id);
        const result = await updateShopRequestStatus(id, status, reason);
        if (result.success) {
            await loadData();
        } else {
            alert(result.error);
        }
        setProcessingId(null);
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-2 border-turbo-orange border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const pendingShopRequests = shopRequests.filter(r => r.status === 'pending');

    return (
        <div className="flex flex-col gap-6">
            <div className="flex bg-midnight/60 p-1.5 rounded-2xl border border-white/5 max-w-2xl mx-auto w-full">
                <button
                    onClick={() => setActiveTab('services')}
                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'services' ? 'bg-turbo-orange text-midnight shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <MaterialIcon name="engineering" className="text-sm" />
                    Service Leads ({serviceRequests.length})
                </button>
                <button
                    onClick={() => setActiveTab('shops')}
                    className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'shops' ? 'bg-turbo-orange text-midnight shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                >
                    <MaterialIcon name="store" className="text-sm" />
                    Shop Registration ({pendingShopRequests.length})
                </button>
            </div>

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black italic uppercase tracking-tighter">
                    {activeTab === 'services' ? 'Customer Requests' : 'Approval Queue'}
                </h2>
            </div>

            {activeTab === 'services' ? (
                // SERVICE REQUESTS VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {serviceRequests.length === 0 ? (
                        <div className="glass-card rounded-2xl p-10 text-center border-dashed border-foreground/10">
                            <MaterialIcon name="inbox" className="text-4xl text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">No customer requests</p>
                        </div>
                    ) : (
                        serviceRequests.map((req) => (
                            <div key={req.id} className="glass-card rounded-3xl p-6 border-white/5 animate-in slide-in-from-top-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black bg-electric-blue/20 text-electric-blue px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                {req.service_type || 'General Service'}
                                            </span>
                                            <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">
                                                ID: {req.id.slice(0, 8)}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{req.customer_name}</h3>
                                        <p className="text-xs font-bold text-turbo-orange uppercase tracking-widest">Requesting: {req.shop_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Date</p>
                                        <p className="text-[10px] text-foreground font-bold">{new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="grid gap-3 mb-4">
                                    <div className="flex items-start gap-3 p-3 bg-midnight/40 rounded-xl border border-white/5">
                                        <MaterialIcon name="directions_car" className="text-sm text-turbo-orange mt-0.5" />
                                        <p className="text-xs text-foreground font-bold">{req.vehicle_info || 'Not specified'}</p>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-midnight/40 rounded-xl border border-white/5">
                                        <MaterialIcon name="chat" className="text-sm text-turbo-orange mt-0.5" />
                                        <p className="text-xs text-muted-foreground italic">&quot;{req.message || 'No additional message'}&quot;</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <a
                                        href={`tel:${req.customer_phone}`}
                                        className="flex-1 h-12 bg-turbo-orange text-midnight text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                                    >
                                        <MaterialIcon name="call" className="text-sm" />
                                        Call Customer
                                    </a>
                                    <button
                                        onClick={() => window.open(`https://wa.me/${req.customer_phone.replace(/\D/g, '')}`, '_blank')}
                                        className="h-12 w-12 glass border border-white/10 text-foreground rounded-xl flex items-center justify-center hover:bg-white/5 transition-all"
                                    >
                                        <MaterialIcon name="chat_bubble" className="text-sm" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                // SHOP REGISTRATION VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingShopRequests.length === 0 ? (
                        <div className="glass-card rounded-2xl p-10 text-center border-dashed border-foreground/10">
                            <MaterialIcon name="verified" className="text-4xl text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Queue is clear</p>
                        </div>
                    ) : (
                        pendingShopRequests.map((req) => (
                            <div key={req.id} className="glass-card rounded-3xl p-6 border-white/5 animate-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{req.shop_name}</h3>
                                        <p className="text-xs font-bold text-turbo-orange uppercase tracking-widest mt-0.5">Owner: {req.owner_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Submitted</p>
                                        <p className="text-[10px] text-foreground font-bold">{new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="grid gap-3 mb-6">
                                    <div className="flex items-start gap-3 p-3 bg-midnight/40 rounded-xl border border-white/5">
                                        <MaterialIcon name="location_on" className="text-sm text-turbo-orange mt-0.5" />
                                        <p className="text-xs text-muted-foreground leading-relaxed">{req.address}</p>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-midnight/40 rounded-xl border border-white/5">
                                        <MaterialIcon name="contact_phone" className="text-sm text-turbo-orange" />
                                        <p className="text-xs text-muted-foreground">{req.contact_details}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <a
                                        href={req.google_maps_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-12 glass border border-electric-blue/30 text-electric-blue text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:bg-electric-blue/10 transition-all"
                                    >
                                        <MaterialIcon name="map" className="text-sm" />
                                        Preview on Google Maps
                                    </a>

                                    <div className="flex gap-3 mt-2">
                                        <button
                                            disabled={!!processingId}
                                            onClick={() => handleAction(req.id, 'approved')}
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
                                            onClick={() => handleAction(req.id, 'rejected')}
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
