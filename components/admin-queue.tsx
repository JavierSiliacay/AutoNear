'use client';

import { useState, useEffect } from 'react';
import { MaterialIcon } from '@/components/material-icon';
import { getShopRequests, getServiceRequests, updateShopRequestStatus, updateServiceRequestStatus, deleteServiceRequest } from '@/lib/actions';
import type { ShopRequest, ServiceRequest } from '@/lib/types';
import { ServiceChat } from './service-chat';

type ExtendedServiceRequest = ServiceRequest & { shop_name: string };

export function AdminQueue({ adminEmail }: { adminEmail: string }) {
    const [shopRequests, setShopRequests] = useState<ShopRequest[]>([]);
    const [serviceRequests, setServiceRequests] = useState<ExtendedServiceRequest[]>([]);
    const [activeTab, setActiveTab] = useState<'shops' | 'services'>('services');
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [activeChat, setActiveChat] = useState<ExtendedServiceRequest | null>(null);

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

    async function handleShopAction(requestId: string, status: 'approved' | 'rejected') {
        setProcessingId(requestId);
        const result = await updateShopRequestStatus(requestId, status);
        if (result.success) {
            loadData();
        } else {
            alert(result.error);
        }
        setProcessingId(null);
    }

    async function handleStatusChange(requestId: string, status: 'pending' | 'on going' | 'completed') {
        const result = await updateServiceRequestStatus(requestId, status);
        if (result.success) {
            loadData();
        } else {
            alert(result.error);
        }
    }

    async function handleDeleteRequest(requestId: string) {
        if (!confirm('Are you sure you want to delete this service request? This action cannot be undone.')) return;

        const result = await deleteServiceRequest(requestId);
        if (result.success) {
            loadData();
        } else {
            alert(result.error);
        }
    }

    const pendingShopRequests = shopRequests.filter(r => r.status === 'pending');

    return (
        <div className="flex flex-col gap-8">
            {/* Tab Navigation */}
            <div className="flex flex-col items-center gap-6">
                <div className="flex bg-midnight/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl">
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'services'
                            ? 'bg-turbo-orange text-midnight shadow-lg shadow-turbo-orange/20'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Service Leads
                    </button>
                    <button
                        onClick={() => setActiveTab('shops')}
                        className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'shops'
                            ? 'bg-turbo-orange text-midnight shadow-lg shadow-turbo-orange/20'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Shop Registration
                    </button>
                </div>

                <div className="text-center">
                    <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">
                        {activeTab === 'services' ? 'Customer Requests' : 'Shop Approval Queue'}
                    </h2>
                    <p className="text-[10px] font-black text-turbo-orange uppercase tracking-[0.3em] mt-2">Administrative Dashboard</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-turbo-orange border-t-transparent rounded-full animate-spin" />
                </div>
            ) : activeTab === 'services' ? (
                // SERVICE REQUESTS VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {serviceRequests.length === 0 ? (
                        <div className="glass-card rounded-2xl p-10 text-center border-dashed border-foreground/10">
                            <MaterialIcon name="inbox" className="text-4xl text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">No service requests</p>
                        </div>
                    ) : (
                        serviceRequests.map((req) => (
                            <div key={req.id} className="glass-card rounded-3xl p-6 border-white/5 animate-in slide-in-from-bottom-4 flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-turbo-orange/10 rounded-2xl flex items-center justify-center text-turbo-orange border border-turbo-orange/20">
                                        <MaterialIcon name="build" />
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <div className="flex gap-2 mb-1">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${req.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                    req.status === 'on going' ? 'bg-electric-blue/10 text-electric-blue border-electric-blue/20' :
                                                        'bg-turbo-orange/10 text-turbo-orange border-turbo-orange/20'
                                                }`}>
                                                {req.status || 'pending'}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-black text-turbo-orange uppercase tracking-widest">{req.shop_name}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6 flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{req.customer_name}</h3>
                                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">{req.vehicle_info || 'Unknown Vehicle'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteRequest(req.id)}
                                            className="text-muted-foreground hover:text-red-500 transition-colors"
                                        >
                                            <MaterialIcon name="delete" className="text-base" />
                                        </button>
                                    </div>
                                    <div className="p-4 bg-midnight/40 rounded-2xl border border-white/5">
                                        <p className="text-xs text-foreground font-medium leading-relaxed italic">"{req.message}"</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="flex bg-midnight/50 p-1 rounded-xl border border-white/5">
                                        {(['pending', 'on going', 'completed'] as const).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => handleStatusChange(req.id, s)}
                                                className={`flex-1 py-2 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${(req.status || 'pending') === s
                                                        ? 'bg-turbo-orange text-midnight shadow-lg'
                                                        : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex gap-3">
                                        <a
                                            href={`tel:${req.customer_phone}`}
                                            className="flex-1 h-12 bg-white text-midnight text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                                        >
                                            <MaterialIcon name="call" className="text-sm" />
                                            Call
                                        </a>
                                        <button
                                            onClick={() => setActiveChat(req)}
                                            className="h-12 w-12 glass border border-white/10 text-foreground rounded-xl flex items-center justify-center hover:bg-white/5 transition-all"
                                        >
                                            <MaterialIcon name="chat_bubble" className="text-sm" />
                                        </button>
                                    </div>
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
                                            onClick={() => handleShopAction(req.id, 'approved')}
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
                                            onClick={() => handleShopAction(req.id, 'rejected')}
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

            {activeChat && (
                <ServiceChat
                    requestId={activeChat.id}
                    recipientName={activeChat.customer_name}
                    currentUserEmail={adminEmail}
                    currentUserRole="admin"
                    onClose={() => setActiveChat(null)}
                />
            )}
        </div>
    );
}
