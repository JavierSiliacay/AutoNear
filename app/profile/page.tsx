'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { MaterialIcon } from '@/components/material-icon';
import { BottomNav } from '@/components/bottom-nav';
import { AppHeader } from '@/components/app-header';
import { 
    getUsersServiceRequests, 
    getMechanicByEmail, 
    getMechanicServiceRequests,
    updateMechanicStatus, 
    updateMechanicProfile,
    deleteServiceRequest,
    getMechanicUnreadNotices,
    acknowledgeMechanicNotice
} from '@/lib/actions';
import { ServiceChat } from '@/components/service-chat';
import { useNotifications } from '@/lib/notification-context';
import type { Mechanic, AdminMechanicNotice } from '@/lib/types';
import { SERVICE_TYPES } from '@/lib/types';
import { PWAInstallButton } from '@/components/pwa-install-button';
import { formatPHPhoneNumber } from '@/lib/utils';


export default function ProfilePage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<any[]>([]);
    const [mechanicProfile, setMechanicProfile] = useState<Mechanic | null>(null);
    const [activeChat, setActiveChat] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'activity' | 'tools'>('activity');
    
    // Mechanic Dashboard State
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Mechanic>>({});
    const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
    const [isDeletingRequest, setIsDeletingRequest] = useState<string | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [activeAdminNotice, setActiveAdminNotice] = useState<AdminMechanicNotice | null>(null);
    const { unreadCounts, clearUnreadCount, unviewedAppointments, markAppointmentViewed, setActiveChatId, subscribeToPush, isPushSupported } = useNotifications();
    const [notificationAudio, setNotificationAudio] = useState<HTMLAudioElement | null>(null);
    const [pushLoading, setPushLoading] = useState(false);
    const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const activeChatRef = useRef<any>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        setNotificationAudio(audio);

        const init = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push('/login');
                    return;
                }
                setUser(user);

                const [userRequests, mechanic, notices] = await Promise.all([
                    getUsersServiceRequests(user.email!),
                    getMechanicByEmail(user.email!),
                    getMechanicUnreadNotices(user.email!)
                ]);

                if (notices.length > 0) {
                    setActiveAdminNotice(notices[0]);
                }
                
                let combinedRequests = [...userRequests];
                if (mechanic) {
                    const mechanicRequests = await getMechanicServiceRequests(mechanic.id);
                    const existingIds = new Set(combinedRequests.map(r => r.id));
                    mechanicRequests.forEach(r => {
                        if (!existingIds.has(r.id)) {
                            combinedRequests.push(r);
                        }
                    });
                    
                    setMechanicProfile(mechanic);
                    setEditData({
                        name: mechanic.name,
                        bio: mechanic.bio || '',
                        specializations: mechanic.specializations || [],
                        phone: mechanic.phone || ''
                    });
                }
                
                setRequests(combinedRequests.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                ));

            } catch (error) {
                console.error("Profile load error:", error);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [router, supabase]);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
        setIsLoggingOut(false);
    };

    const toggleAvailability = async () => {
        if (!mechanicProfile || isTogglingAvailability) return;
        setIsTogglingAvailability(true);
        const newStatus = !mechanicProfile.is_available;
        const result = await updateMechanicStatus(mechanicProfile.id, newStatus);
        if (result.success) {
            setMechanicProfile({ ...mechanicProfile, is_available: newStatus });
            router.refresh(); 
        } else {
            alert(result.error);
        }
        setIsTogglingAvailability(false);
    };

    const handleSaveProfile = async () => {
        if (!mechanicProfile) return;
        setSaving(true);
        const result = await updateMechanicProfile(mechanicProfile.email, editData);
        if (result.success) {
            setMechanicProfile({ ...mechanicProfile, ...editData } as Mechanic);
            setIsEditing(false);
        }
        setSaving(false);
    };

    const handleDeleteRequest = async (requestId: string) => {
        if (isDeletingRequest) return;
        if (confirm('Are you sure to remove this?')) {
            setIsDeletingRequest(requestId);
            const result = await deleteServiceRequest(requestId);
            if (result.success) {
                setRequests(prev => prev.filter(r => r.id !== requestId));
            } else {
                alert(result.error);
            }
            setIsDeletingRequest(null);
        }
    };

    const toggleSpec = (spec: string) => {
        const current = editData.specializations || [];
        const next = current.includes(spec) 
            ? current.filter(s => s !== spec)
            : [...current, spec];
        setEditData({ ...editData, specializations: next });
    };

    const handleEnablePush = async () => {
        setPushLoading(true);
        const success = await subscribeToPush();
        if (success) {
            setPushStatus('granted');
        }
        setPushLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-midnight flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-turbo-orange border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32">
            <AppHeader
                title="Profile & Activity"
                rightAction={
                    <div className="flex items-center gap-3">
                        <PWAInstallButton />
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="text-red-500 hover:text-red-400 p-2 glass rounded-xl transition-all border border-red-500/20 cursor-pointer"
                            title="Sign Out"
                        >
                            <MaterialIcon name="logout" className="text-xl" />
                        </button>
                    </div>
                }
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 animate-in">
                {/* Profile Hero Header */}
                <div className="glass-card rounded-[2.5rem] p-6 sm:p-10 mb-8 border-white/10 relative overflow-hidden bg-gradient-to-b from-slate-900 to-midnight shadow-2xl">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
                        <div 
                            onClick={() => {
                                if (mechanicProfile) {
                                    setActiveTab('tools');
                                    setIsEditing(true);
                                }
                            }}
                            className="relative group cursor-pointer shrink-0"
                            title="Edit Profile"
                        >
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/5 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-turbo-orange transition-all">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <MaterialIcon name="person" className="text-6xl text-white/10" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-turbo-orange hover:scale-110 active:scale-95 transition-transform rounded-2xl flex items-center justify-center text-midnight shadow-lg border-4 border-midnight cursor-pointer">
                                <MaterialIcon name="edit" className="text-lg" />
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tight uppercase leading-tight mb-1">
                                        {mechanicProfile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                                    </h2>
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        {user?.email}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 mx-auto sm:mx-0">
                                    {mechanicProfile?.is_verified && (
                                        <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-emerald-500/20 flex items-center gap-1.5 w-fit shadow-lg shadow-emerald-500/10">
                                            <MaterialIcon name="verified" className="text-xs text-emerald-400" />
                                            Verified Mechanic
                                        </span>
                                    )}

                                    {mechanicProfile && (
                                        <button
                                            onClick={() => {
                                                setActiveTab('tools');
                                                setIsEditing(true);
                                                // Smooth scroll down to edit form
                                                setTimeout(() => {
                                                    document.getElementById('mechanic-tools-section')?.scrollIntoView({ behavior: 'smooth' });
                                                }, 100);
                                            }}
                                            className="px-3.5 py-1.5 bg-electric-blue/15 hover:bg-electric-blue text-electric-blue hover:text-midnight border border-electric-blue/30 text-[10px] font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-electric-blue/10"
                                        >
                                            <MaterialIcon name="tune" className="text-xs" />
                                            <span>Edit Profile & Base</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Direct Notification Alert Card */}
                {isPushSupported && pushStatus !== 'granted' && (
                    <div className="glass-card rounded-3xl p-6 border-electric-blue/30 bg-electric-blue/5 mb-8 relative overflow-hidden group shadow-2xl animate-in slide-in-from-bottom-4 duration-700">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <MaterialIcon name="notifications_active" className="text-5xl text-electric-blue" />
                        </div>
                        <div className="relative z-10">
                            <h4 className="text-electric-blue text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-electric-blue animate-pulse" />
                                Instant Fix Alerts
                            </h4>
                            <p className="text-[11px] text-white/60 mb-5 leading-relaxed font-bold">
                                Get notified immediately when mechanics message you or when an SOS is nearby. High-priority push notifications.
                            </p>
                            <button
                                onClick={handleEnablePush}
                                disabled={pushLoading}
                                className="h-12 bg-electric-blue text-midnight rounded-xl px-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-electric-blue/20 disabled:opacity-50"
                            >
                                {pushLoading ? (
                                    <div className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <MaterialIcon name="notifications" className="text-sm" />
                                        Enable Push Alerts
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Tab Navigation if Mechanic */}
                {mechanicProfile && (
                    <div className="flex p-2 bg-white/5 rounded-[2rem] mb-10 border border-white/5 shadow-inner">
                        <button 
                            onClick={() => setActiveTab('activity')}
                            className={`flex-1 h-14 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer ${activeTab === 'activity' ? 'bg-white shadow-xl text-midnight scale-[1.02]' : 'text-white/40 hover:text-white'}`}
                        >
                            <MaterialIcon name="history" className="text-lg" />
                            <span>My Activity</span>
                            {unviewedAppointments.length > 0 && (
                                <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full border border-midnight shadow-md animate-pulse">
                                    {unviewedAppointments.length} NEW
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setActiveTab('tools')}
                            className={`flex-1 h-14 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer ${activeTab === 'tools' ? 'bg-turbo-orange text-midnight shadow-lg shadow-turbo-orange/40 scale-[1.02]' : 'text-white/40 hover:text-white'}`}
                        >
                            <MaterialIcon name="engineering" className="text-lg" />
                            Mechanic Tools
                        </button>
                    </div>
                )}

                {activeTab === 'activity' ? (
                    <div className="animate-in slide-in-from-left-4 fade-in duration-500">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h3 className="text-foreground font-bold text-lg tracking-tight uppercase">Service History</h3>
                            <div className="h-px flex-1 bg-white/5 mx-4" />
                            <div className="flex items-center gap-2">
                                {unviewedAppointments.length > 0 && (
                                    <span className="bg-red-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-red-400/40 tracking-widest animate-pulse">
                                        {unviewedAppointments.length} Unread Bookings
                                    </span>
                                )}
                                <span className="bg-turbo-orange/10 text-turbo-orange text-[9px] font-black uppercase px-2 py-0.5 rounded border border-turbo-orange/20 tracking-widest">
                                    {requests.length} Total
                                </span>
                            </div>
                        </div>

                        {requests.length === 0 ? (
                            <div className="glass-card rounded-2xl p-10 text-center border-dashed border-foreground/10 opacity-50 mb-8">
                                <MaterialIcon name="history" className="text-4xl text-muted-foreground mb-4" />
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed"> 
                                    No active service requests.<br />Need help? Visit the map!
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 mb-10">
                                {requests.map((req) => {
                                    const isUnviewedBooking = unviewedAppointments.includes(req.id);
                                    const hasUnreadChat = (unreadCounts[req.id] || 0) > 0;
                                    
                                    return (
                                    <div 
                                        key={req.id} 
                                        className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 ${
                                            isUnviewedBooking 
                                                ? 'border-red-500/50 bg-red-500/[0.04] shadow-[0_0_20px_rgba(239,68,68,0.18)] ring-1 ring-red-500/30' 
                                                : expandedId === req.id 
                                                    ? 'border-turbo-orange/30 shadow-2xl shadow-turbo-orange/5' 
                                                    : 'border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div 
                                            className="p-5 flex items-center gap-4 cursor-pointer relative"
                                            onClick={() => {
                                                setExpandedId(expandedId === req.id ? null : req.id);
                                                // Clear unread message count and mark appointment as seen
                                                clearUnreadCount(req.id);
                                                markAppointmentViewed(req.id);
                                            }}
                                        >
                                            {/* Unread / New Appointment Indicator Badge */}
                                            {(hasUnreadChat || isUnviewedBooking) && (
                                                <div className="absolute top-4 left-4 min-w-[20px] h-5 bg-red-500 rounded-full border-2 border-midnight z-20 flex items-center justify-center px-1.5 shadow-md">
                                                    <span className="text-[9px] font-black text-white leading-none">
                                                        {hasUnreadChat ? (unreadCounts[req.id] > 99 ? '99+' : unreadCounts[req.id]) : 'NEW'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-turbo-orange shrink-0 overflow-hidden border border-white/5">
                                                {mechanicProfile && req.mechanic_id === mechanicProfile.id ? (
                                                    req.customer_avatar_url ? (
                                                        <img src={req.customer_avatar_url} alt="Customer" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                    ) : (
                                                        <MaterialIcon name="person" />
                                                    )
                                                ) : (
                                                    req.mechanic_image_url ? (
                                                        <img src={req.mechanic_image_url} alt="Mechanic" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                    ) : (
                                                        <MaterialIcon name="engineering" />
                                                    )
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="text-foreground font-bold text-sm truncate uppercase tracking-tight">
                                                        {mechanicProfile && req.mechanic_id === mechanicProfile.id 
                                                            ? `Request from ${req.customer_name}` 
                                                            : (req.mechanic_name || 'Mechanic Service')}
                                                    </h4>
                                                    {isUnviewedBooking && (
                                                        <span className="bg-red-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-red-400/40 animate-pulse">
                                                            NEW BOOKING
                                                        </span>
                                                    )}
                                                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded border leading-none ${
                                                        req.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        req.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                        req.status === 'pending' ? 'bg-white/10 text-white/40 border-white/10' :
                                                        'bg-turbo-orange/10 text-turbo-orange border-turbo-orange/20'
                                                    }`}>
                                                        {req.status?.replace(/_/g, ' ') || 'pending'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{req.vehicle_info || 'Unknown Vehicle'}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`transition-transform duration-300 ${expandedId === req.id ? 'rotate-180 text-turbo-orange' : 'text-muted-foreground'}`}>
                                                    <MaterialIcon name="expand_more" className="text-xl" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedId === req.id && (
                                            <div className="px-5 pb-6 animate-in slide-in-from-top-2 duration-300">
                                                <div className="pt-4 border-t border-white/5 space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Customer Phone</label>
                                                            <p className="text-xs font-bold text-foreground">{formatPHPhoneNumber(req.customer_phone)}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Service Preference</label>
                                                            <p className="text-xs font-black text-turbo-orange uppercase italic">{req.service_preference || 'Not Specified'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Service Needed</label>
                                                            <p className="text-xs font-bold text-foreground">{req.service_type || 'General Checkup'}</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Date Submitted</label>
                                                            <p className="text-[10px] font-bold text-foreground">
                                                                {new Date(req.created_at).toLocaleDateString()} at {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                        <div className="space-y-1 col-span-2">
                                                            <label className="text-[8px] font-black text-electric-blue uppercase tracking-widest">Scheduled Service Date</label>
                                                            <p className="text-[13px] font-black text-white italic tracking-tight">
                                                                {req.scheduled_date 
                                                                    ? new Date(req.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
                                                                    : 'AS SOON AS POSSIBLE'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {req.message && (
                                                        <div className="space-y-1 bg-white/5 p-3 rounded-xl">
                                                            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Message from Customer</label>
                                                            <p className="text-xs text-foreground/80 leading-relaxed italic">"{req.message}"</p>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2 pt-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                clearUnreadCount(req.id);
                                                                setActiveChat(req);
                                                                setActiveChatId(req.id);
                                                            }}
                                                            className="flex-1 h-12 bg-turbo-orange orange-glow text-midnight rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-widest transition-transform active:scale-95 shadow-lg shadow-turbo-orange/20 relative"
                                                        >
                                                            {unreadCounts[req.id] > 0 && (
                                                                <span className="absolute -top-2 -right-1 flex">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 min-w-[18px] h-[18px] items-center justify-center border border-midnight shadow-lg">
                                                                        {unreadCounts[req.id] > 99 ? '99+' : unreadCounts[req.id]}
                                                                    </span>
                                                                </span>
                                                            )}
                                                            <MaterialIcon name="chat" className="text-sm" />
                                                            Open Chat
                                                        </button>
                                                        
                                                        {mechanicProfile && req.mechanic_id === mechanicProfile.id && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteRequest(req.id);
                                                                }}
                                                                disabled={isDeletingRequest === req.id}
                                                                className="w-12 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center border border-red-500/20 hover:bg-red-500 hover:text-white transition-all disabled:opacity-50"
                                                            >
                                                                {isDeletingRequest === req.id ? (
                                                                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <MaterialIcon name="delete" className="text-base" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-right-4 fade-in duration-500 pb-10">
                        {/* Availability Toggle */}
                        <div className={`glass-card rounded-3xl p-6 border transition-all duration-500 mb-8 ${mechanicProfile?.is_available ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mechanicProfile?.is_available ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                        <MaterialIcon name={mechanicProfile?.is_available ? 'online_prediction' : 'do_not_disturb_on'} className="text-2xl" />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black text-foreground uppercase tracking-wider">System Status</h3>
                                        <p className={`text-[11px] font-black uppercase tracking-widest ${mechanicProfile?.is_available ? 'text-green-500' : 'text-red-500'}`}>
                                            {mechanicProfile?.is_available ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </div>
                                <button 
                                    onClick={toggleAvailability}
                                    disabled={isTogglingAvailability}
                                    className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex items-center gap-2 ${mechanicProfile?.is_available ? 'bg-green-500 text-midnight hover:bg-green-400' : 'bg-red-500 text-white hover:bg-red-400'}`}
                                >
                                    {isTogglingAvailability && <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />}
                                    {isTogglingAvailability ? 'Updating...' : (mechanicProfile?.is_available ? 'Go Offline' : 'Go Online')}
                                </button>
                            </div>
                        </div>

                        {/* Profile Editor */}
                        <div id="mechanic-tools-section" className="glass-card rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-electric-blue/10 blur-3xl -mr-16 -mt-16 rounded-full" />
                            
                            <div className="flex justify-between items-start mb-6 relative z-10">
                                <h3 className="text-foreground font-black text-lg tracking-tight uppercase italic underline decoration-electric-blue decoration-2 underline-offset-4">Public Profile & Service Base</h3>
                                <button 
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="w-10 h-10 glass rounded-xl flex items-center justify-center text-electric-blue border border-electric-blue/20 hover:bg-electric-blue hover:text-midnight transition-all shadow-lg cursor-pointer"
                                >
                                    <MaterialIcon name={isEditing ? 'close' : 'edit_square'} className="text-sm" />
                                </button>
                            </div>

                            {!isEditing ? (
                                <div className="space-y-6 relative z-10">
                                    <div>
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 block">Display Name</label>
                                        <p className="text-lg font-black text-foreground uppercase italic tracking-tight">{mechanicProfile?.name}</p>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-2 block">Mechanic Bio</label>
                                        <p className="text-xs text-muted-foreground leading-relaxed">{mechanicProfile?.bio || 'Tells customers why you are the best choice!'}</p>
                                    </div>

                                    <div>
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3 block text-electric-blue">Expertise Shields</label>
                                        <div className="flex flex-wrap gap-2">
                                            {mechanicProfile?.specializations?.map(spec => (
                                                <span key={spec} className="px-3 py-1.5 bg-midnight-60 border border-white/10 rounded-lg text-[8px] font-black text-foreground uppercase tracking-widest">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Live Rating</label>
                                            <div className="flex items-center gap-1.5 text-turbo-orange font-black text-sm">
                                                <MaterialIcon name="star" className="text-sm" />
                                                {mechanicProfile?.rating.toFixed(1)}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1 block">Trust Score</label>
                                            <div className="flex items-center gap-1.5 text-electric-blue font-black text-[10px] uppercase">
                                                <MaterialIcon name="verified_user" className="text-sm" />
                                                Excellent
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in slide-in-from-bottom-2">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Profile Name</label>
                                        <input 
                                            value={editData.name} 
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="h-12 bg-background/50 border border-foreground/10 rounded-xl px-4 text-sm focus:ring-2 focus:ring-electric-blue outline-none" 
                                        />
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest ml-1">Mechanic Bio</label>
                                        <textarea 
                                            value={editData.bio || ''} 
                                            onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                                            className="min-h-[80px] bg-background/50 border border-foreground/10 rounded-xl p-4 text-xs focus:ring-2 focus:ring-electric-blue outline-none resize-none" 
                                            placeholder="Example: 10 years experience in Toyota engines..."
                                        />
                                    </div>

                                    {/* Location & GPS Base Management */}
                                    <div className="p-4 bg-midnight/40 rounded-2xl border border-white/5 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-black text-electric-blue uppercase tracking-widest flex items-center gap-1.5">
                                                <MaterialIcon name="my_location" className="text-xs" />
                                                Service Base Location
                                            </label>
                                            {editData.latitude && editData.longitude && (
                                                <span className="text-[8px] font-mono text-muted-foreground">
                                                    {Number(editData.latitude).toFixed(4)}, {Number(editData.longitude).toFixed(4)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">City / Town</label>
                                                <input 
                                                    value={editData.city || ''} 
                                                    onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                                                    placeholder="e.g. Cagayan de Oro"
                                                    className="w-full h-11 bg-background/50 border border-foreground/10 rounded-xl px-3 text-xs focus:ring-2 focus:ring-electric-blue outline-none" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">Barangay</label>
                                                <input 
                                                    value={editData.barangay || ''} 
                                                    onChange={(e) => setEditData({ ...editData, barangay: e.target.value })}
                                                    placeholder="e.g. Carmen"
                                                    className="w-full h-11 bg-background/50 border border-foreground/10 rounded-xl px-3 text-xs focus:ring-2 focus:ring-electric-blue outline-none" 
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!navigator.geolocation) {
                                                    alert("Geolocation not supported by browser.");
                                                    return;
                                                }
                                                navigator.geolocation.getCurrentPosition(
                                                    async (pos) => {
                                                        const { latitude: lat, longitude: lng } = pos.coords;
                                                        try {
                                                            const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
                                                            const geo = await res.json();
                                                            const city = geo.city || geo.principalSubdivision || editData.city || "Cagayan de Oro";
                                                            const barangay = geo.locality || editData.barangay || "";
                                                            setEditData(prev => ({ ...prev, latitude: lat, longitude: lng, city, barangay }));
                                                        } catch {
                                                            setEditData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                                        }
                                                    },
                                                    () => alert("Could not fetch current GPS location. Please check browser permissions.")
                                                );
                                            }}
                                            className="w-full h-11 glass border border-electric-blue/30 text-electric-blue hover:bg-electric-blue/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all"
                                        >
                                            <MaterialIcon name="gps_fixed" className="text-xs" />
                                            Update to Current GPS Location
                                        </button>
                                    </div>

                                    <button
                                        onClick={handleSaveProfile}
                                        disabled={saving}
                                        className="w-full h-14 bg-electric-blue text-midnight font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-electric-blue/20 cursor-pointer"
                                    >
                                        {saving ? (
                                            <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <MaterialIcon name="save" />
                                                Publish Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                <div className="flex flex-col gap-4 mt-10">
                    <div className="flex justify-center">
                        <PWAInstallButton />
                    </div>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full h-14 glass border border-destructive/20 rounded-2xl flex items-center justify-center gap-3 text-destructive font-black uppercase tracking-widest text-[10px] hover:bg-destructive/10 transition-all shadow-lg cursor-pointer"
                    >
                        <MaterialIcon name="logout" />
                        Sign Out
                    </button>
                </div>
            </main>

            {/* Premium Emotional Sign Out Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/85 backdrop-blur-md animate-in fade-in duration-300">
                    <div 
                        className="w-full max-w-sm glass-card border border-white/10 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden shadow-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-midnight animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Ambient Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-turbo-orange/15 blur-[60px] rounded-full pointer-events-none" />

                        {/* Animated Crying Mascot Header */}
                        <div className="relative mx-auto w-28 h-28 mb-4">
                            <div className="w-full h-full rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl bg-midnight/80 flex items-center justify-center relative">
                                <img 
                                    src="/mascot-crying.gif" 
                                    alt="TaraFix Crying Mascot" 
                                    className="w-full h-full object-cover" 
                                />
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-midnight/90 border border-white/10 flex items-center justify-center text-sm shadow-lg">
                                    🥺
                                </div>
                            </div>
                        </div>

                        {/* Text */}
                        <div className="text-center mb-6">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-white/5 text-muted-foreground border border-white/10 px-3 py-1 rounded-full inline-block mb-2.5">
                                Account Session
                            </span>
                            <h3 className="text-2xl font-black text-white italic uppercase tracking-tight mb-2">
                                Leaving So Soon, {((mechanicProfile?.name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Friend') as string).split(' ')[0]}?
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                TaraFix will save your active service requests and chats. Are you sure you want to sign out right now?
                            </p>
                        </div>

                        {/* Action Buttons (Primary CTA to stay logged in) */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                disabled={isLoggingOut}
                                className="w-full h-14 bg-gradient-to-r from-turbo-orange to-amber-500 hover:from-amber-500 hover:to-turbo-orange active:scale-95 text-midnight font-black uppercase tracking-wider text-xs rounded-2xl transition-all shadow-[0_4px_20px_rgba(255,95,0,0.35)] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 border border-amber-300/30 group"
                            >
                                <MaterialIcon name="favorite" className="text-lg text-midnight group-hover:scale-125 transition-transform" />
                                <span>Stay Logged In</span>
                            </button>

                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="w-full h-11 text-red-400/80 hover:text-red-400 hover:bg-red-500/10 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                        Signing Out...
                                    </>
                                ) : (
                                    <>
                                        <MaterialIcon name="logout" className="text-xs" />
                                        Yes, Sign Out
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Direct Notice / Warning Modal */}
            {activeAdminNotice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/85 backdrop-blur-md animate-in fade-in duration-300">
                    <div 
                        className="w-full max-w-md glass-card border border-turbo-orange/40 rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-midnight shadow-[0_0_50px_rgba(255,95,0,0.25)] relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-turbo-orange/15 border border-turbo-orange/30 text-turbo-orange flex items-center justify-center mx-auto mb-4">
                            <MaterialIcon name="campaign" className="text-3xl" />
                        </div>

                        <div className="text-center mb-5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-turbo-orange bg-turbo-orange/10 px-3 py-1 rounded-full border border-turbo-orange/20 inline-block mb-2">
                                Priority Administrator Message
                            </span>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">
                                {activeAdminNotice.title || "Official Admin Notice"}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                The platform administration team has left an important message regarding your account:
                            </p>
                        </div>

                        {/* Notice Message Content */}
                        <div className="p-5 bg-midnight/70 rounded-2xl border border-turbo-orange/30 mb-6 text-left shadow-inner">
                            <div className="flex items-center gap-1.5 mb-2 text-turbo-orange">
                                <MaterialIcon name="priority_high" className="text-xs" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Notice Content</span>
                            </div>
                            <p className="text-xs text-foreground font-semibold leading-relaxed">
                                "{activeAdminNotice.message}"
                            </p>
                            <div className="mt-3 pt-2 border-t border-white/5 flex justify-between text-[8px] text-muted-foreground font-mono">
                                <span>Sent: {new Date(activeAdminNotice.created_at).toLocaleDateString()}</span>
                                <span className="text-turbo-orange font-bold uppercase">Action Required</span>
                            </div>
                        </div>

                        <button
                            onClick={async () => {
                                const noticeId = activeAdminNotice.id;
                                setActiveAdminNotice(null);
                                await acknowledgeMechanicNotice(noticeId);
                            }}
                            className="w-full h-13 bg-turbo-orange hover:opacity-90 active:scale-95 text-midnight font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-turbo-orange/20 cursor-pointer flex items-center justify-center gap-2"
                        >
                            <MaterialIcon name="check_circle" className="text-sm" />
                            <span>Acknowledge & Continue</span>
                        </button>
                    </div>
                </div>
            )}

            {activeChat && (
                <ServiceChat
                    requestId={activeChat.id}
                    recipientName={mechanicProfile && activeChat.mechanic_id === mechanicProfile.id ? activeChat.customer_name : (activeChat.mechanic_name || 'Mechanic')}
                    recipientAvatarUrl={mechanicProfile && activeChat.mechanic_id === mechanicProfile.id ? activeChat.customer_avatar_url : activeChat.mechanic_image_url}
                    currentUserEmail={user?.email!}
                    currentUserRole={mechanicProfile && activeChat.mechanic_id === mechanicProfile.id ? 'mechanic' : 'customer'}
                    onClose={() => {
                        setActiveChat(null);
                        setActiveChatId(null);
                    }}
                />
            )}

            <BottomNav />
        </div>
    );
}
