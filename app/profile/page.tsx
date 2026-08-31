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
    updateUserProfile,
    getUserProfile,
    deleteServiceRequest,
    declineServiceRequest,
    getMechanicUnreadNotices,
    acknowledgeMechanicNotice,
    checkIfAlreadyMechanic,
    uploadProfileAvatar
} from '@/lib/actions';
import { compressImageToWebP } from '@/lib/image-compression';
import Link from 'next/link';
import { ServiceChat } from '@/components/service-chat';
import { useNotifications } from '@/lib/notification-context';
import type { Mechanic, AdminMechanicNotice } from '@/lib/types';
import { SERVICE_TYPES } from '@/lib/types';
import { PWAInstallButton } from '@/components/pwa-install-button';
import { formatPHPhoneNumber } from '@/lib/utils';
import { getPresenceStatus } from '@/lib/presence';
import { PhotoLightboxModal } from '@/components/photo-lightbox-modal';


import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

export default function ProfilePage() {
    const { data: nextAuthSession, status: nextAuthStatus } = useSession();
    const queryClient = useQueryClient();
    const supabase = createClient();
    const router = useRouter();

    const [user, setUser] = useState<any>(null);
    const [mechanicProfile, setMechanicProfile] = useState<Mechanic | null>(null);
    const [mechanicRegStatus, setMechanicRegStatus] = useState<any>(null);
    const [userRole, setUserRole] = useState<'car_owner' | 'mechanic'>('car_owner');
    const [showRoleSwitchModal, setShowRoleSwitchModal] = useState(false);
    const [pendingRoleSwitch, setPendingRoleSwitch] = useState<'car_owner' | 'mechanic' | null>(null);
    const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false);
    const [showOwnerEditModal, setShowOwnerEditModal] = useState(false);
    const [showBecomeMechanicModal, setShowBecomeMechanicModal] = useState(false);
    const [ownerEditData, setOwnerEditData] = useState({
        full_name: '',
        phone: '',
        vehicle_info: '',
        city: '',
        barangay: '',
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined
    });
    const [isFetchingOwnerGPS, setIsFetchingOwnerGPS] = useState(false);
    const [savingOwner, setSavingOwner] = useState(false);
    const [ownerPhoneError, setOwnerPhoneError] = useState('');
    const [activeChat, setActiveChat] = useState<any | null>(null);
    const [activeTab, setActiveTab] = useState<'activity' | 'tools'>('activity');
    const [bookingFilter, setBookingFilter] = useState<'all' | 'active' | 'completed'>('all');
    const [expandedAvatarData, setExpandedAvatarData] = useState<{ url: string; title: string; subtitle?: string } | null>(null);
    const avatarFileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    
    // Mechanic Dashboard State
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<Mechanic>>({});
    const [isDeletingRequest, setIsDeletingRequest] = useState<string | null>(null);
    const [isDecliningRequest, setIsDecliningRequest] = useState<string | null>(null);
    const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
    const [declineReason, setDeclineReason] = useState<string>('');
    const [declineCustomReason, setDeclineCustomReason] = useState<string>('');
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [highlightedBookingId, setHighlightedBookingId] = useState<string | null>(null);
    const [roleSwitchSuccess, setRoleSwitchSuccess] = useState<'mechanic' | 'car_owner' | null>(null);
    const [activeAdminNotice, setActiveAdminNotice] = useState<AdminMechanicNotice | null>(null);
    const { unreadCounts, clearUnreadCount, unviewedAppointments, markAppointmentViewed, setActiveChatId, subscribeToPush, isPushSupported } = useNotifications();
    const [pushLoading, setPushLoading] = useState(false);
    const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied'>(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const activeChatRef = useRef<any>(null);

    // Resolve active email directly in memory
    const activeEmail = nextAuthSession?.user?.email;

    // TanStack Query: In-memory cache for 60 seconds, zero server refetch on tab switch or page re-entry
    const { data: profileData, isLoading: queryLoading } = useQuery({
        queryKey: ['profile-data', activeEmail],
        queryFn: async () => {
            let email = activeEmail;
            let activeUser: any = nextAuthSession?.user ? {
                id: nextAuthSession.user.email,
                email: nextAuthSession.user.email,
                user_metadata: {
                    full_name: nextAuthSession.user.name,
                    avatar_url: nextAuthSession.user.image
                }
            } : null;

            if (!email) {
                const { data: { user: sbUser } } = await supabase.auth.getUser();
                if (sbUser) {
                    email = sbUser.email;
                    activeUser = sbUser;
                }
            }

            if (!email) {
                return null;
            }

            const [userRequests, mechanic, notices, regStatus, dbUserProfile] = await Promise.all([
                getUsersServiceRequests(email),
                getMechanicByEmail(email),
                getMechanicUnreadNotices(email),
                checkIfAlreadyMechanic(email),
                getUserProfile(email)
            ]);

            if (dbUserProfile && activeUser) {
                activeUser.user_metadata = {
                    ...activeUser.user_metadata,
                    full_name: dbUserProfile.full_name || activeUser.user_metadata?.full_name,
                    name: dbUserProfile.full_name || activeUser.user_metadata?.name,
                    phone: dbUserProfile.phone || activeUser.user_metadata?.phone,
                    vehicle_info: dbUserProfile.vehicle_info || activeUser.user_metadata?.vehicle_info,
                    city: dbUserProfile.city || activeUser.user_metadata?.city,
                    barangay: dbUserProfile.barangay || activeUser.user_metadata?.barangay,
                    latitude: dbUserProfile.latitude ?? activeUser.user_metadata?.latitude,
                    longitude: dbUserProfile.longitude ?? activeUser.user_metadata?.longitude,
                };
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
            }

            return {
                user: activeUser,
                mechanic,
                notices,
                regStatus,
                dbUserProfile,
                requests: combinedRequests.sort((a, b) => 
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )
            };
        },
        enabled: nextAuthStatus !== "loading",
        staleTime: 60 * 1000, // 1 minute instant cache
        gcTime: 5 * 60 * 1000,
    });

    const loading = nextAuthStatus === "loading" || queryLoading;
    const [requests, setRequests] = useState<any[]>([]);

    useEffect(() => {
        if (profileData) {
            setUser(profileData.user);
            setRequests(profileData.requests || []);
            if (profileData.notices && profileData.notices.length > 0) {
                setActiveAdminNotice(profileData.notices[0]);
            }
            if (profileData.regStatus) {
                setMechanicRegStatus(profileData.regStatus);
            }
            if (profileData.mechanic) {
                setMechanicProfile(profileData.mechanic);
                setEditData({
                    name: profileData.mechanic.name,
                    bio: profileData.mechanic.bio || '',
                    specializations: profileData.mechanic.specializations || [],
                    phone: profileData.mechanic.phone || ''
                });
            }

            let initialName = profileData.user?.user_metadata?.full_name || profileData.user?.user_metadata?.name || '';
            let initialPhone = profileData.user?.user_metadata?.phone || profileData.dbUserProfile?.phone || '';
            let initialVehicle = profileData.user?.user_metadata?.vehicle_info || profileData.dbUserProfile?.vehicle_info || '';
            let initialCity = profileData.user?.user_metadata?.city || profileData.dbUserProfile?.city || '';
            let initialBarangay = profileData.user?.user_metadata?.barangay || profileData.dbUserProfile?.barangay || '';
            let initialLat = profileData.user?.user_metadata?.latitude ?? profileData.dbUserProfile?.latitude;
            let initialLng = profileData.user?.user_metadata?.longitude ?? profileData.dbUserProfile?.longitude;

            if (profileData.user?.email) {
                try {
                    const localSaved = localStorage.getItem(`tarafix_owner_profile_${profileData.user.email}`);
                    if (localSaved) {
                        const parsed = JSON.parse(localSaved);
                        if (!initialPhone && parsed.phone) initialPhone = parsed.phone;
                        if (!initialVehicle && parsed.vehicle_info) initialVehicle = parsed.vehicle_info;
                        if (!initialCity && parsed.city) initialCity = parsed.city;
                        if (!initialBarangay && parsed.barangay) initialBarangay = parsed.barangay;
                        if (initialLat === undefined && parsed.latitude !== undefined) initialLat = parsed.latitude;
                        if (initialLng === undefined && parsed.longitude !== undefined) initialLng = parsed.longitude;
                    }
                } catch {}
            }

            setOwnerEditData({
                full_name: initialName,
                phone: initialPhone,
                vehicle_info: initialVehicle,
                city: initialCity,
                barangay: initialBarangay,
                latitude: initialLat,
                longitude: initialLng
            });

            if (initialCity || initialBarangay || initialVehicle || initialPhone) {
                setUser((prev: any) => ({
                    ...prev,
                    user_metadata: {
                        ...prev?.user_metadata,
                        phone: initialPhone,
                        vehicle_info: initialVehicle,
                        city: initialCity,
                        barangay: initialBarangay,
                        latitude: initialLat,
                        longitude: initialLng
                    }
                }));
            }

            const savedRole = localStorage.getItem("tarafix_user_role");
            if (savedRole === "mechanic" || savedRole === "car_owner") {
                setUserRole(savedRole);
            } else if (profileData.mechanic) {
                setUserRole("mechanic");
            }
        }
    }, [profileData]);

    // Supabase Realtime Subscription for Live Booking Updates
    useEffect(() => {
        if (!user?.email && !mechanicProfile?.id) return;

        const email = user?.email?.toLowerCase().trim();
        const mechanicId = mechanicProfile?.id;

        const channel = supabase
            .channel(`profile_realtime_${email || mechanicId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'service_requests'
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newReq = payload.new as any;
                        const isForUser = email && newReq.customer_email?.toLowerCase().trim() === email;
                        const isForMechanic = mechanicId && newReq.mechanic_id === mechanicId;

                        if (isForUser || isForMechanic) {
                            queryClient.invalidateQueries({ queryKey: ['profile-data', activeEmail] });

                            if (isForMechanic && mechanicId) {
                                const latestMechReqs = await getMechanicServiceRequests(mechanicId);
                                setRequests(prev => {
                                    const map = new Map<string, any>();
                                    latestMechReqs.forEach(r => map.set(r.id, r));
                                    prev.forEach(r => { if (!map.has(r.id)) map.set(r.id, r); });
                                    return Array.from(map.values()).sort((a, b) => 
                                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                    );
                                });
                            } else if (isForUser && email) {
                                const latestUserReqs = await getUsersServiceRequests(email);
                                setRequests(prev => {
                                    const map = new Map<string, any>();
                                    latestUserReqs.forEach(r => map.set(r.id, r));
                                    prev.forEach(r => { if (!map.has(r.id)) map.set(r.id, r); });
                                    return Array.from(map.values()).sort((a, b) => 
                                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                    );
                                });
                            }
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updated = payload.new as any;
                        setRequests(prev => prev.map(r => r.id === updated.id ? { ...r, ...updated } : r));
                        queryClient.invalidateQueries({ queryKey: ['profile-data', activeEmail] });
                    } else if (payload.eventType === 'DELETE') {
                        const deletedId = (payload.old as any)?.id;
                        if (deletedId) {
                            setRequests(prev => prev.filter(r => r.id !== deletedId));
                            queryClient.invalidateQueries({ queryKey: ['profile-data', activeEmail] });
                        }
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'admin_mechanic_notices'
                },
                (payload) => {
                    const newNotice = payload.new as any;
                    if (newNotice && email && newNotice.mechanic_email?.toLowerCase().trim() === email) {
                        setActiveAdminNotice(newNotice);
                        queryClient.invalidateQueries({ queryKey: ['profile-data', activeEmail] });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.email, mechanicProfile?.id, activeEmail, queryClient, supabase]);

    // Handle Deep-Link Targeting (?request_id=...&chat=true)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const targetId = params.get('request_id') || params.get('highlight');
        const openChat = params.get('chat') === 'true';

        if (targetId) {
            setHighlightedBookingId(targetId);
            setExpandedId(targetId);

            const timer = setTimeout(() => {
                const el = document.getElementById(`booking-${targetId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 350);

            if (openChat && requests.length > 0) {
                const targetReq = requests.find(r => r.id === targetId);
                if (targetReq) {
                    clearUnreadCount(targetId);
                    setActiveChat(targetReq);
                    setActiveChatId(targetId);
                }
            }

            return () => clearTimeout(timer);
        }
    }, [requests]);

    const handleOwnerPhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let raw = e.target.value.replace(/\D/g, "");
        if (raw.startsWith("0")) {
            if (raw.length > 11) raw = raw.slice(0, 11);
        } else if (raw.startsWith("63")) {
            if (raw.length > 12) raw = raw.slice(0, 12);
        }
        
        let formatted = raw;
        if (raw.startsWith("09")) {
            if (raw.length > 4) {
                formatted = raw.slice(0, 4) + "-" + raw.slice(4, 7);
                if (raw.length > 7) formatted += "-" + raw.slice(7, 11);
            }
        } else if (raw.startsWith("639")) {
            if (raw.length > 5) {
                formatted = raw.slice(0, 5) + "-" + raw.slice(5, 8);
                if (raw.length > 8) formatted += "-" + raw.slice(8, 12);
            }
        }

        setOwnerEditData(prev => ({ ...prev, phone: formatted }));

        const phMobileRegexRaw = /^(09|639)\d{9}$/;
        if (raw.length > 0) {
            if (!phMobileRegexRaw.test(raw)) {
                if (!raw.startsWith("09") && !raw.startsWith("639")) {
                    setOwnerPhoneError("Start with 09 or 639");
                } else if (raw.length < 11) {
                    setOwnerPhoneError("Number incomplete");
                } else {
                    setOwnerPhoneError("Invalid format");
                }
            } else {
                setOwnerPhoneError("");
            }
        } else {
            setOwnerPhoneError("");
        }
    };

    const handleFetchOwnerGPS = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }
        setIsFetchingOwnerGPS(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                try {
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
                    const geo = await res.json();
                    const city = geo.city || geo.principalSubdivision || ownerEditData.city || "Cagayan de Oro";
                    const barangay = geo.locality || ownerEditData.barangay || "";
                    setOwnerEditData(prev => ({ ...prev, latitude: lat, longitude: lng, city, barangay }));
                } catch {
                    setOwnerEditData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                }
                setIsFetchingOwnerGPS(false);
            },
            () => {
                setIsFetchingOwnerGPS(false);
                alert("Could not fetch current GPS location. Please check browser permissions.");
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    const handleSaveOwnerProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.email || savingOwner) return;
        
        const rawPhone = ownerEditData.phone.replace(/\D/g, "");
        if (rawPhone.length > 0) {
            const phMobileRegexRaw = /^(09|639)\d{9}$/;
            if (!phMobileRegexRaw.test(rawPhone)) {
                setOwnerPhoneError("Please enter a valid PH mobile number");
                return;
            }
        }

        setSavingOwner(true);
        const result = await updateUserProfile(user.email, {
            full_name: ownerEditData.full_name,
            phone: rawPhone,
            vehicle_info: ownerEditData.vehicle_info,
            city: ownerEditData.city,
            barangay: ownerEditData.barangay,
            latitude: ownerEditData.latitude,
            longitude: ownerEditData.longitude
        });

        if (result.success) {
            try {
                localStorage.setItem(`tarafix_owner_profile_${user.email}`, JSON.stringify({
                    full_name: ownerEditData.full_name,
                    phone: rawPhone,
                    vehicle_info: ownerEditData.vehicle_info,
                    city: ownerEditData.city,
                    barangay: ownerEditData.barangay,
                    latitude: ownerEditData.latitude,
                    longitude: ownerEditData.longitude
                }));
            } catch {}

            setUser((prev: any) => ({
                ...prev,
                user_metadata: {
                    ...prev?.user_metadata,
                    full_name: ownerEditData.full_name,
                    name: ownerEditData.full_name,
                    phone: rawPhone,
                    vehicle_info: ownerEditData.vehicle_info,
                    city: ownerEditData.city,
                    barangay: ownerEditData.barangay,
                    latitude: ownerEditData.latitude,
                    longitude: ownerEditData.longitude
                }
            }));
            setShowOwnerEditModal(false);
        } else {
            alert(result.error || "Failed to update profile.");
        }
        setSavingOwner(false);
    };

    const handleSwitchRole = async (newRole: 'car_owner' | 'mechanic') => {
        setUserRole(newRole);
        localStorage.setItem("tarafix_user_role", newRole);
        window.dispatchEvent(new Event("tarafix_role_changed"));
        setShowRoleSwitchModal(false);
        setShowRoleConfirmModal(false);
        setPendingRoleSwitch(null);

        // Show Animated Checkmark Success Overlay
        setRoleSwitchSuccess(newRole);
        setTimeout(() => setRoleSwitchSuccess(null), 2600);

        // Instantly check for priority admin warnings/notices when switching to mechanic
        if (user?.email) {
            try {
                const notices = await getMechanicUnreadNotices(user.email);
                if (notices && notices.length > 0) {
                    setActiveAdminNotice(notices[0]);
                }
            } catch (err) {
                console.error("Error checking notices on role switch:", err);
            }
        }

        if (newRole === 'mechanic' && !mechanicProfile && (!mechanicRegStatus || !mechanicRegStatus.registered)) {
            router.push('/register-mechanic');
        }
    };

    const handleInitiateRoleSwitch = (targetRole: 'car_owner' | 'mechanic') => {
        if (targetRole === userRole) {
            setShowRoleSwitchModal(false);
            return;
        }
        setPendingRoleSwitch(targetRole);
        setShowRoleSwitchModal(false);
        setShowRoleConfirmModal(true);
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            const { signOut } = await import('next-auth/react');
            await signOut({ redirect: false });
        } catch (e) {}
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
        setIsLoggingOut(false);
    };

    const handleSaveProfile = async () => {
        if (!mechanicProfile) return;
        if (!editData.specializations || editData.specializations.length === 0) {
            alert("Please select at least 1 specialization before publishing your profile.");
            return;
        }
        setSaving(true);
        const result = await updateMechanicProfile(mechanicProfile.email, editData);
        if (result.success) {
            setMechanicProfile({ ...mechanicProfile, ...editData } as Mechanic);
            setIsEditing(false);
            queryClient.invalidateQueries({ queryKey: ['profile-data', activeEmail] });
        } else {
            alert(result.error || "Failed to update profile.");
        }
        setSaving(false);
    };

    const handleDeleteRequest = async (requestId: string) => {
        if (isDeletingRequest) return;
        if (confirm('Archive and remove this record from your history?')) {
            setIsDeletingRequest(requestId);
            const result = await deleteServiceRequest(requestId);
            if (result.success) {
                setRequests(prev => prev.filter(r => r.id !== requestId));
            } else {
                alert(result.error || "Failed to remove request.");
            }
            setIsDeletingRequest(null);
        }
    };

    const handleOpenDeclineModal = (requestId: string) => {
        setDeclineTargetId(requestId);
        setDeclineReason('');
        setDeclineCustomReason('');
    };

    const handleConfirmDecline = async () => {
        if (!declineTargetId || isDecliningRequest) return;
        const finalReason = declineReason === 'Other reason' 
            ? declineCustomReason.trim() 
            : (declineReason.trim() || declineCustomReason.trim());

        if (!finalReason) {
            alert("Please select or enter a reason for declining.");
            return;
        }

        setIsDecliningRequest(declineTargetId);
        const result = await declineServiceRequest(declineTargetId, finalReason);
        if (result.success) {
            setRequests(prev => prev.map(r => r.id === declineTargetId ? { ...r, status: 'cancelled', cancellation_reason: finalReason } : r));
            setDeclineTargetId(null);
        } else {
            alert(result.error || "Failed to decline booking.");
        }
        setIsDecliningRequest(null);
    };

    const handleAvatarFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.email) return;

        setIsUploadingAvatar(true);
        try {
            // 1. Compress and convert to high-performance WebP client-side
            const compressed = await compressImageToWebP(file, {
                maxWidth: 600,
                maxHeight: 600,
                quality: 0.85
            });

            // 2. Upload to Supabase Storage via Server Action
            const formData = new FormData();
            formData.append('email', user.email);
            formData.append('file', compressed.file);

            const result = await uploadProfileAvatar(formData);

            if (result.success && result.avatar_url) {
                // 3. Update local state immediately
                setUser((prev: any) => ({
                    ...prev,
                    user_metadata: {
                        ...prev?.user_metadata,
                        avatar_url: result.avatar_url,
                        picture: result.avatar_url
                    }
                }));

                if (mechanicProfile) {
                    setMechanicProfile((prev: any) => prev ? { ...prev, image_url: result.avatar_url } : null);
                }

                if (expandedAvatarData) {
                    setExpandedAvatarData((prev: any) => prev ? { ...prev, url: result.avatar_url! } : null);
                }

                // 4. Invalidate TanStack query cache
                queryClient.invalidateQueries({ queryKey: ['profile-data', user.email] });
                alert(`Profile photo updated! WebP compressed: ${compressed.compressionRatio}`);
            } else {
                alert(result.error || "Failed to update profile photo.");
            }
        } catch (err: any) {
            console.error("Error compressing or uploading avatar:", err);
            alert(err.message || "Failed to process photo.");
        } finally {
            setIsUploadingAvatar(false);
            if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
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
                                const currentAvatarUrl = (userRole === 'mechanic' && mechanicProfile?.image_url) 
                                    ? mechanicProfile.image_url 
                                    : user?.user_metadata?.avatar_url;
                                const currentName = (userRole === 'mechanic' && mechanicProfile?.name) 
                                    ? mechanicProfile.name 
                                    : (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User');
                                
                                if (currentAvatarUrl) {
                                    setExpandedAvatarData({
                                        url: currentAvatarUrl,
                                        title: currentName,
                                        subtitle: user?.email || undefined
                                    });
                                } else {
                                    setShowOwnerEditModal(true);
                                }
                            }}
                            className="relative group cursor-pointer shrink-0"
                            title="Click to view enlarged profile picture"
                        >
                            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white/5 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-turbo-orange transition-all relative">
                                {user?.user_metadata?.avatar_url ? (
                                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                                ) : (
                                    <MaterialIcon name="person" className="text-6xl text-white/10" />
                                )}
                                {/* Zoom In Overlay Hint on Hover */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <MaterialIcon name="zoom_in" className="text-white text-2xl" />
                                </div>
                            </div>
                        </div>

                        <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-white italic tracking-tight uppercase leading-tight mb-1">
                                        {(userRole === 'mechanic' && mechanicProfile?.name) ? mechanicProfile.name : (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User')}
                                    </h2>
                                    <div className="flex flex-col items-center sm:items-start gap-1">
                                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                            <span>{user?.email}</span>
                                            {userRole === 'car_owner' && user?.user_metadata?.vehicle_info && (
                                                <>
                                                    <span>•</span>
                                                    <span className="text-electric-blue font-black">{user.user_metadata.vehicle_info}</span>
                                                </>
                                            )}
                                            {userRole === 'mechanic' && (
                                                <>
                                                    <span>•</span>
                                                    {mechanicProfile?.is_verified ? (
                                                        <span className="text-emerald-400 font-black flex items-center gap-1">
                                                            <MaterialIcon name="verified" className="text-xs text-emerald-400" />
                                                            Verified Mechanic
                                                        </span>
                                                    ) : mechanicRegStatus?.status === 'pending' ? (
                                                        <span className="text-turbo-orange font-bold flex items-center gap-1">
                                                            <MaterialIcon name="schedule" className="text-xs text-turbo-orange" />
                                                            Pending Verification
                                                        </span>
                                                    ) : null}
                                                </>
                                            )}
                                        </div>

                                        {/* Location Below Email & Verified Badge */}
                                        {userRole === 'car_owner' && (user?.user_metadata?.barangay || user?.user_metadata?.city) && (
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-turbo-orange uppercase tracking-wider">
                                                <MaterialIcon name="location_on" className="text-xs text-turbo-orange" />
                                                <span>{[user.user_metadata.barangay, user.user_metadata.city].filter(Boolean).join(", ")}</span>
                                            </div>
                                        )}
                                        {userRole === 'mechanic' && (mechanicProfile?.barangay || mechanicProfile?.city) && (
                                            <div className="flex items-center gap-1 text-[11px] font-bold text-turbo-orange uppercase tracking-wider">
                                                <MaterialIcon name="location_on" className="text-xs text-turbo-orange" />
                                                <span>{[mechanicProfile.barangay, mechanicProfile.city].filter(Boolean).join(", ")}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 mx-auto sm:mx-0">
                                    <button
                                        onClick={() => setShowRoleSwitchModal(true)}
                                        className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 text-[10px] font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95"
                                        title="Switch between Car Owner and Mechanic mode"
                                    >
                                        <MaterialIcon name="swap_horiz" className="text-sm text-turbo-orange" />
                                        <span>Switch Role ({userRole === 'mechanic' ? 'Mechanic' : 'Car Owner'})</span>
                                    </button>

                                    {/* Car Owner Edit Profile Button */}
                                    {userRole === 'car_owner' && (
                                        <button
                                            onClick={() => setShowOwnerEditModal(true)}
                                            className="px-3.5 py-1.5 bg-electric-blue/15 hover:bg-electric-blue text-electric-blue hover:text-midnight border border-electric-blue/30 text-[10px] font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-electric-blue/10 active:scale-95"
                                        >
                                            <MaterialIcon name="edit" className="text-xs" />
                                            <span>Edit Profile</span>
                                        </button>
                                    )}

                                    {/* Mechanic Mode Edit Profile Button */}
                                    {userRole === 'mechanic' && mechanicProfile && (
                                        <button
                                            onClick={() => {
                                                setActiveTab('tools');
                                                setIsEditing(true);
                                                // Smooth scroll down to edit form
                                                setTimeout(() => {
                                                    document.getElementById('mechanic-tools-section')?.scrollIntoView({ behavior: 'smooth' });
                                                }, 100);
                                            }}
                                            className="px-3.5 py-1.5 bg-electric-blue/15 hover:bg-electric-blue text-electric-blue hover:text-midnight border border-electric-blue/30 text-[10px] font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-electric-blue/10 active:scale-95"
                                        >
                                            <MaterialIcon name="edit" className="text-xs" />
                                            <span>Edit Profile</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pending Mechanic Application Status Card */}
                {!mechanicProfile && mechanicRegStatus?.status === 'pending' && (
                    <div className="glass-card rounded-3xl p-6 border-turbo-orange/30 bg-turbo-orange/5 mb-8 relative overflow-hidden group shadow-2xl animate-in slide-in-from-top-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-turbo-orange/15 border border-turbo-orange/30 flex items-center justify-center text-turbo-orange shrink-0 shadow-lg shadow-turbo-orange/10">
                                <MaterialIcon name="hourglass_top" className="text-3xl animate-pulse" />
                            </div>
                            <div className="flex-1 text-center sm:text-left">
                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                                    <h4 className="text-foreground text-sm font-black uppercase tracking-tight">
                                        Mechanic Application Under Review
                                    </h4>
                                    <span className="bg-turbo-orange text-midnight text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-widest shadow-md">
                                        Pending Review
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                    We've received your credentials and truth-pinned service location. Our admin team is reviewing your application. You will be activated automatically once approved!
                                </p>
                            </div>
                            <Link href="/register-mechanic" className="px-4 py-2 bg-white/5 border border-white/10 text-[10px] font-black text-foreground uppercase tracking-widest rounded-xl hover:bg-white/10 transition-colors shrink-0">
                                View Details
                            </Link>
                        </div>
                    </div>
                )}

                {/* Become a Mechanic Banner if not mechanic and not pending */}
                {!mechanicProfile && (!mechanicRegStatus || !mechanicRegStatus.registered) && (
                    <div className="glass-card rounded-3xl p-6 border-white/10 bg-gradient-to-r from-turbo-orange/10 to-electric-blue/10 mb-8 relative overflow-hidden group shadow-2xl">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4 text-center sm:text-left">
                                <div className="w-12 h-12 rounded-2xl bg-turbo-orange/20 border border-turbo-orange/30 flex items-center justify-center text-turbo-orange shrink-0">
                                    <MaterialIcon name="engineering" className="text-2xl" />
                                </div>
                                <div>
                                    <h4 className="text-foreground text-xs font-black uppercase tracking-wider">
                                        Are You an Auto Mechanic?
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground font-medium">
                                        Join the TaraFix network to receive nearby repair requests and earn directly.
                                    </p>
                                </div>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setShowBecomeMechanicModal(true)}
                                className="h-11 px-5 bg-turbo-orange text-midnight font-black uppercase text-[10px] tracking-widest rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-turbo-orange/20 shrink-0 cursor-pointer"
                            >
                                <span>Become a Mechanic</span>
                                <MaterialIcon name="arrow_forward" className="text-sm" />
                            </button>
                        </div>
                    </div>
                )}

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

                {/* Tab Navigation if in Mechanic Mode and Approved */}
                {userRole === 'mechanic' && mechanicProfile && (
                    <div className="flex p-2 bg-white/5 rounded-[2rem] mb-10 border border-white/5 shadow-inner">
                        <button 
                            onClick={() => setActiveTab('activity')}
                            className={`flex-1 h-14 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer ${activeTab === 'activity' ? 'bg-white shadow-xl text-midnight scale-[1.02]' : 'text-white/40 hover:text-white'}`}
                        >
                            <MaterialIcon name="history" className="text-lg" />
                            <span>Client Jobs</span>
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

                {activeTab === 'activity' || userRole === 'car_owner' ? (
                    <div className="animate-in slide-in-from-left-4 fade-in duration-500">
                        {/* Section Header & Presence Filter Tabs */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 px-1">
                            <div>
                                <h3 className="text-foreground font-black text-lg tracking-tight uppercase italic">
                                    {userRole === 'mechanic' ? 'Client Requests & Service Jobs' : 'My Service Bookings'}
                                </h3>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                                    Track real-time repair progress and chat with technicians
                                </p>
                            </div>

                            {/* Booking Status Filter Pills */}
                            {(() => {
                                const relevant = requests.filter(req => {
                                    if (userRole === 'car_owner') {
                                        if (mechanicProfile && req.mechanic_id === mechanicProfile.id && req.customer_email?.toLowerCase() !== user?.email?.toLowerCase()) {
                                            return false;
                                        }
                                        return true;
                                    } else {
                                        if (mechanicProfile) return req.mechanic_id === mechanicProfile.id;
                                        return true;
                                    }
                                });
                                const activeCount = relevant.filter(r => ['pending', 'accepted', 'on_my_way', 'arrived', 'in_progress'].includes(r.status)).length;
                                const historyCount = relevant.filter(r => ['completed', 'cancelled'].includes(r.status)).length;

                                return (
                                    <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/10 shadow-lg self-start sm:self-auto">
                                        <button
                                            onClick={() => setBookingFilter('all')}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                bookingFilter === 'all'
                                                    ? 'bg-white/20 text-white shadow-md'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            All ({relevant.length})
                                        </button>
                                        <button
                                            onClick={() => setBookingFilter('active')}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                                                bookingFilter === 'active'
                                                    ? 'bg-turbo-orange text-midnight shadow-md shadow-turbo-orange/20 font-black'
                                                    : 'text-turbo-orange hover:text-turbo-orange/80'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${activeCount > 0 ? (bookingFilter === 'active' ? 'bg-midnight animate-pulse' : 'bg-turbo-orange animate-pulse') : 'bg-muted-foreground/40'}`} />
                                            <span>Active ({activeCount})</span>
                                        </button>
                                        <button
                                            onClick={() => setBookingFilter('completed')}
                                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                                bookingFilter === 'completed'
                                                    ? 'bg-white/20 text-white shadow-md'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            History ({historyCount})
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>

                        {requests.filter(req => {
                            if (userRole === 'car_owner') {
                                if (mechanicProfile && req.mechanic_id === mechanicProfile.id && req.customer_email?.toLowerCase() !== user?.email?.toLowerCase()) {
                                    return false;
                                }
                            } else {
                                if (mechanicProfile && req.mechanic_id !== mechanicProfile.id) {
                                    return false;
                                }
                            }
                            if (bookingFilter === 'active') {
                                return ['pending', 'accepted', 'on_my_way', 'arrived', 'in_progress'].includes(req.status);
                            }
                            if (bookingFilter === 'completed') {
                                return ['completed', 'cancelled'].includes(req.status);
                            }
                            return true;
                        }).length === 0 ? (
                            <div className="glass-card rounded-2xl p-10 text-center border-dashed border-foreground/10 opacity-50 mb-8">
                                <MaterialIcon name="history" className="text-4xl text-muted-foreground mb-4" />
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed"> 
                                    {bookingFilter === 'active' 
                                        ? (userRole === 'mechanic' ? 'No active client jobs in progress.' : 'No ongoing active bookings right now.')
                                        : (userRole === 'mechanic' ? 'No service request records yet.' : 'No service history yet.')}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 mb-10">
                                {requests.filter(req => {
                                    if (userRole === 'car_owner') {
                                        if (mechanicProfile && req.mechanic_id === mechanicProfile.id && req.customer_email?.toLowerCase() !== user?.email?.toLowerCase()) {
                                            return false;
                                        }
                                    } else {
                                        if (mechanicProfile && req.mechanic_id !== mechanicProfile.id) {
                                            return false;
                                        }
                                    }
                                    if (bookingFilter === 'active') {
                                        return ['pending', 'accepted', 'on_my_way', 'arrived', 'in_progress'].includes(req.status);
                                    }
                                    if (bookingFilter === 'completed') {
                                        return ['completed', 'cancelled'].includes(req.status);
                                    }
                                    return true;
                                }).map((req) => {
                                    const isUnviewedBooking = unviewedAppointments.includes(req.id);
                                    const hasUnreadChat = (unreadCounts[req.id] || 0) > 0;
                                    const isActiveJob = ['pending', 'accepted', 'on_my_way', 'arrived', 'in_progress'].includes(req.status);
                                    const participantLastActive = userRole === 'car_owner' ? req.mechanic_last_active_at : req.customer_last_active_at;
                                    const participantPresence = getPresenceStatus(participantLastActive);
                                    
                                    return (
                                    <div 
                                        key={req.id} 
                                        id={`booking-${req.id}`}
                                        className={`glass-card rounded-2xl overflow-hidden transition-all duration-300 scroll-mt-28 ${
                                            highlightedBookingId === req.id
                                                ? 'border-2 border-electric-blue bg-electric-blue/10 shadow-[0_0_35px_rgba(0,233,163,0.35)] ring-4 ring-electric-blue/20'
                                                : isUnviewedBooking 
                                                    ? 'border-red-500/50 bg-red-500/[0.04] shadow-[0_0_20px_rgba(239,68,68,0.18)] ring-1 ring-red-500/30' 
                                                    : expandedId === req.id 
                                                        ? 'border-turbo-orange/40 shadow-2xl shadow-turbo-orange/10' 
                                                        : isActiveJob
                                                            ? 'border-turbo-orange/20 bg-turbo-orange/[0.02] shadow-[0_0_20px_rgba(255,95,0,0.06)]'
                                                            : 'border-white/5 hover:border-white/10 opacity-90'
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
                                            <div className="relative shrink-0">
                                                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-turbo-orange overflow-hidden border border-white/5">
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
                                                {/* Live Presence Dot on Avatar */}
                                                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-midnight z-10 ${
                                                    participantPresence.isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-red-500'
                                                }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <h4 className="text-foreground font-bold text-sm truncate uppercase tracking-tight">
                                                        {mechanicProfile && req.mechanic_id === mechanicProfile.id 
                                                            ? `Request from ${req.customer_name}` 
                                                            : (req.mechanic_name || 'Mechanic Service')}
                                                    </h4>
                                                    {isUnviewedBooking && (
                                                        <span className="bg-red-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-red-400/40 animate-pulse">
                                                            NEW
                                                        </span>
                                                    )}
                                                    {/* Active / Inactive Status Indicator Badge */}
                                                    {(() => {
                                                        switch (req.status) {
                                                            case 'pending':
                                                                return (
                                                                    <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                                        <span>Pending Approval</span>
                                                                    </span>
                                                                );
                                                            case 'accepted':
                                                                return (
                                                                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                                        <span>Active • Accepted</span>
                                                                    </span>
                                                                );
                                                            case 'on_my_way':
                                                                return (
                                                                    <span className="bg-electric-blue/15 text-electric-blue border border-electric-blue/30 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-electric-blue animate-pulse" />
                                                                        <span>Active • En Route</span>
                                                                    </span>
                                                                );
                                                            case 'arrived':
                                                                return (
                                                                    <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                                        <span>Active • Arrived</span>
                                                                    </span>
                                                                );
                                                            case 'in_progress':
                                                                return (
                                                                    <span className="bg-turbo-orange/15 text-turbo-orange border border-turbo-orange/30 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-turbo-orange animate-pulse" />
                                                                        <span>Active • In Progress</span>
                                                                    </span>
                                                                );
                                                            case 'completed':
                                                                return (
                                                                    <span className="bg-white/5 text-muted-foreground border border-white/10 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
                                                                        <span>Completed</span>
                                                                    </span>
                                                                );
                                                            case 'cancelled':
                                                                return (
                                                                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                                        <span>Cancelled</span>
                                                                    </span>
                                                                );
                                                            default:
                                                                return (
                                                                    <span className="bg-white/10 text-white/50 border border-white/10 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider">
                                                                        {req.status}
                                                                    </span>
                                                                );
                                                        }
                                                    })()}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider flex-wrap">
                                                    <span className="text-muted-foreground truncate">{req.vehicle_info || 'Unknown Vehicle'}</span>
                                                    <span className="text-white/20">•</span>
                                                    <span className={`flex items-center gap-1 font-bold ${
                                                        participantPresence.isOnline ? 'text-emerald-400' : 'text-red-400/90'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${participantPresence.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                                                        <span>{participantPresence.isOnline ? 'Active Now' : participantPresence.label}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`transition-transform duration-300 ${expandedId === req.id ? 'rotate-180 text-turbo-orange' : 'text-muted-foreground'}`}>
                                                    <MaterialIcon name="expand_more" className="text-xl" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Details */}
                                        {expandedId === req.id && (() => {
                                            const participantLastActive = userRole === 'car_owner' ? req.mechanic_last_active_at : req.customer_last_active_at;
                                            const participantPresence = getPresenceStatus(participantLastActive);

                                            return (
                                            <div className="px-5 pb-6 animate-in slide-in-from-top-2 duration-300">
                                                <div className="pt-4 border-t border-white/5 space-y-4">
                                                    {/* Participant Live Presence Status Banner */}
                                                    <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-inner gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="relative shrink-0">
                                                                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-turbo-orange overflow-hidden border border-white/10">
                                                                    {userRole === 'car_owner' ? (
                                                                        req.mechanic_image_url ? (
                                                                            <img src={req.mechanic_image_url} alt="Mechanic" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                                        ) : (
                                                                            <MaterialIcon name="engineering" />
                                                                        )
                                                                    ) : (
                                                                        req.customer_avatar_url ? (
                                                                            <img src={req.customer_avatar_url} alt="Customer" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                                                        ) : (
                                                                            <MaterialIcon name="person" />
                                                                        )
                                                                    )}
                                                                </div>
                                                                {/* Live Status Dot on Avatar */}
                                                                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-midnight ${
                                                                    participantPresence.isOnline ? 'bg-emerald-500 ring-2 ring-emerald-500/30' : 'bg-red-500'
                                                                }`} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground block">
                                                                    {userRole === 'car_owner' ? 'Assigned Technician' : 'Car Owner'}
                                                                </span>
                                                                <p className="text-xs font-bold uppercase text-foreground truncate">
                                                                    {userRole === 'car_owner' ? (req.mechanic_name || 'Mechanic') : (req.customer_name || 'Customer')}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Live Active Status Badge */}
                                                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider shrink-0 ${
                                                            participantPresence.isOnline
                                                                ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                        }`}>
                                                            <span className={`w-2 h-2 rounded-full ${
                                                                participantPresence.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                                                            }`} />
                                                            <span>{participantPresence.isOnline ? 'Active Now' : participantPresence.label}</span>
                                                        </div>
                                                    </div>

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

                                                    {/* Declined / Cancelled Alert Banner for Car Owner */}
                                                    {req.status === 'cancelled' && (
                                                        <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0 mt-0.5">
                                                                    <MaterialIcon name="cancel" className="text-xl" />
                                                                </div>
                                                                <div>
                                                                    <h5 className="text-xs font-black uppercase text-white tracking-wider">
                                                                        Booking Declined by Mechanic
                                                                    </h5>
                                                                    {req.cancellation_reason ? (
                                                                        <p className="text-xs font-bold text-red-400 italic my-0.5">
                                                                            Reason: "{req.cancellation_reason}"
                                                                        </p>
                                                                    ) : (
                                                                        <p className="text-[10px] text-muted-foreground font-medium my-0.5">
                                                                            Mechanic is currently unavailable.
                                                                        </p>
                                                                    )}
                                                                    <p className="text-[10px] text-muted-foreground font-medium">
                                                                        {userRole === 'car_owner' 
                                                                            ? "Don't worry! Your details are saved — you can book another nearby mechanic right now."
                                                                            : "This service request was cancelled."}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {userRole === 'car_owner' && (
                                                                <Link href="/mechanics" className="shrink-0">
                                                                    <button className="h-10 px-4 bg-turbo-orange text-midnight font-black uppercase text-[10px] tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-turbo-orange/20 flex items-center gap-1.5 cursor-pointer">
                                                                        <MaterialIcon name="engineering" className="text-sm" />
                                                                        <span>Find Another Mechanic</span>
                                                                    </button>
                                                                </Link>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="flex flex-wrap gap-2 pt-2">
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
                                                        
                                                        {/* Mechanic: Decline active booking with reason */}
                                                        {mechanicProfile && req.mechanic_id === mechanicProfile.id && req.status !== 'completed' && req.status !== 'cancelled' && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenDeclineModal(req.id);
                                                                }}
                                                                title="Decline Booking with Reason"
                                                                className="px-4 h-12 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center gap-1.5 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                                            >
                                                                <MaterialIcon name="close" className="text-sm" />
                                                                <span>Decline Job</span>
                                                            </button>
                                                        )}

                                                        {/* Archive / Delete completed or cancelled records */}
                                                        {(req.status === 'completed' || req.status === 'cancelled') && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteRequest(req.id);
                                                                }}
                                                                disabled={isDeletingRequest === req.id}
                                                                title="Archive / Remove from list"
                                                                className="w-12 h-12 bg-white/5 text-muted-foreground hover:text-red-500 rounded-xl flex items-center justify-center border border-white/10 hover:border-red-500/30 hover:bg-red-500/10 transition-all disabled:opacity-50 cursor-pointer"
                                                            >
                                                                {isDeletingRequest === req.id ? (
                                                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <MaterialIcon name="delete_outline" className="text-base" />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            );
                                        })()}
                                    </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-in slide-in-from-right-4 fade-in duration-500 pb-10">
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

                                    {/* Specializations & Services Multi-Select */}
                                    <div className="flex flex-col gap-2.5 p-4 bg-midnight/40 rounded-2xl border border-white/5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-[9px] font-black text-electric-blue uppercase tracking-widest flex items-center gap-1.5">
                                                <MaterialIcon name="verified" className="text-xs text-electric-blue" />
                                                Specializations & Services Offered
                                            </label>
                                            <span className="text-[9px] font-black uppercase text-electric-blue bg-electric-blue/10 px-2 py-0.5 rounded-full border border-electric-blue/20">
                                                {(editData.specializations || []).length} Active
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                            Select all services you provide. These will update in the /mechanics directory, /map search, and your booking form.
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                            {SERVICE_TYPES.map((spec) => {
                                                const isSelected = (editData.specializations || []).includes(spec);
                                                return (
                                                    <button
                                                        key={spec}
                                                        type="button"
                                                        onClick={() => toggleSpec(spec)}
                                                        className={`p-3 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between gap-2 cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-electric-blue/15 border-electric-blue text-white shadow-[0_0_15px_rgba(0,233,163,0.2)] scale-[1.01]'
                                                                : 'bg-background/50 border-white/10 text-muted-foreground hover:border-electric-blue/40 hover:text-foreground'
                                                        }`}
                                                    >
                                                        <span className="truncate">{spec}</span>
                                                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                                                            isSelected 
                                                                ? 'bg-electric-blue border-electric-blue text-midnight' 
                                                                : 'border-foreground/20 bg-background/50 text-transparent'
                                                        }`}>
                                                            <MaterialIcon name="check" className="text-xs font-black" />
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
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
                        onClick={() => setShowRoleSwitchModal(true)}
                        className="w-full h-14 glass border border-electric-blue/20 rounded-2xl flex items-center justify-center gap-3 text-electric-blue font-black uppercase tracking-widest text-[10px] hover:bg-electric-blue/10 transition-all shadow-lg cursor-pointer"
                    >
                        <MaterialIcon name="swap_horiz" />
                        Switch User Role
                    </button>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full h-14 glass border border-destructive/20 rounded-2xl flex items-center justify-center gap-3 text-destructive font-black uppercase tracking-widest text-[10px] hover:bg-destructive/10 transition-all shadow-lg cursor-pointer"
                    >
                        <MaterialIcon name="logout" />
                        Sign Out
                    </button>
                </div>
            </main>

            {/* Switch Role Modal */}
            {showRoleSwitchModal && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div 
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        onClick={() => setShowRoleSwitchModal(false)}
                    />
                    <div className="relative w-full max-w-sm bg-[#0d1527] border-2 border-white/15 rounded-3xl p-6 text-center shadow-[0_25px_70px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-300 z-10">
                        <button
                            onClick={() => setShowRoleSwitchModal(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-white p-1"
                        >
                            <MaterialIcon name="close" className="text-xl" />
                        </button>
                        <div className="w-14 h-14 rounded-2xl bg-turbo-orange/15 border border-turbo-orange/30 flex items-center justify-center text-turbo-orange mx-auto mb-4 shadow-lg shadow-turbo-orange/10">
                            <MaterialIcon name="swap_horiz" className="text-3xl" />
                        </div>
                        <h3 className="text-lg font-black text-white uppercase italic tracking-tight mb-1">
                            Switch Active Role
                        </h3>
                        <p className="text-xs text-muted-foreground mb-6 font-medium">
                            Choose how you want to experience TaraFix right now.
                        </p>

                        <div className="space-y-3 mb-5 text-left">
                            {/* Car Owner Option */}
                            <button
                                onClick={() => handleInitiateRoleSwitch('car_owner')}
                                className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                                    userRole === 'car_owner'
                                        ? 'bg-turbo-orange/10 border-turbo-orange text-white shadow-[0_0_20px_rgba(255,95,0,0.15)]'
                                        : 'bg-white/[0.03] border-white/10 text-muted-foreground hover:border-white/20 hover:text-white'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-turbo-orange/20 flex items-center justify-center text-turbo-orange shrink-0">
                                    <MaterialIcon name="directions_car" className="text-xl" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-white">
                                            Car Owner Mode
                                        </h4>
                                        {userRole === 'car_owner' && (
                                            <span className="text-[9px] font-black uppercase text-turbo-orange tracking-widest">Active</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                                        Search, book, and chat with mechanics for vehicle repair.
                                    </p>
                                </div>
                            </button>

                            {/* Freelance Mechanic Option */}
                            <button
                                onClick={() => handleInitiateRoleSwitch('mechanic')}
                                className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-3.5 cursor-pointer ${
                                    userRole === 'mechanic'
                                        ? 'bg-electric-blue/10 border-electric-blue text-white shadow-[0_0_20px_rgba(0,209,255,0.15)]'
                                        : 'bg-white/[0.03] border-white/10 text-muted-foreground hover:border-white/20 hover:text-white'
                                }`}
                            >
                                <div className="w-10 h-10 rounded-xl bg-electric-blue/20 flex items-center justify-center text-electric-blue shrink-0">
                                    <MaterialIcon name="engineering" className="text-xl" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-white">
                                            Mechanic Mode
                                        </h4>
                                        {userRole === 'mechanic' && (
                                            <span className="text-[9px] font-black uppercase text-electric-blue tracking-widest">Active</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">
                                        {mechanicProfile 
                                            ? 'Manage requests, update status, and quote clients.' 
                                            : mechanicRegStatus?.status === 'pending'
                                            ? 'Application pending review.'
                                            : 'Apply to start offering repair services.'}
                                    </p>
                                </div>
                            </button>
                        </div>

                        <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest font-mono">
                            You can change roles anytime
                        </p>
                    </div>
                </div>
            )}

            {/* Role Switch Confirmation Modal to Prevent Misclick */}
            {showRoleConfirmModal && pendingRoleSwitch && (
                <div className="fixed inset-0 z-[3050] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div 
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        onClick={() => {
                            setShowRoleConfirmModal(false);
                            setPendingRoleSwitch(null);
                        }}
                    />
                    <div className="relative w-full max-w-sm bg-[#0d1527] border-2 border-white/15 rounded-[2.5rem] p-6 sm:p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-300 overflow-hidden z-10">
                        {/* Ambient Glow */}
                        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 blur-[60px] rounded-full pointer-events-none ${
                            pendingRoleSwitch === 'mechanic' ? 'bg-electric-blue/20' : 'bg-turbo-orange/20'
                        }`} />

                        <div className={`w-16 h-16 rounded-3xl mx-auto mb-4 border flex items-center justify-center relative z-10 shadow-2xl ${
                            pendingRoleSwitch === 'mechanic'
                                ? 'bg-electric-blue/15 border-electric-blue/30 text-electric-blue shadow-electric-blue/10'
                                : 'bg-turbo-orange/15 border-turbo-orange/30 text-turbo-orange shadow-turbo-orange/10'
                        }`}>
                            <MaterialIcon 
                                name={pendingRoleSwitch === 'mechanic' ? 'engineering' : 'directions_car'} 
                                className="text-3xl" 
                            />
                        </div>

                        <div className="mb-5 relative z-10">
                            <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full inline-block mb-2 border ${
                                pendingRoleSwitch === 'mechanic'
                                    ? 'bg-electric-blue/10 text-electric-blue border-electric-blue/20'
                                    : 'bg-turbo-orange/10 text-turbo-orange border-turbo-orange/20'
                            }`}>
                                Role Switch Confirmation
                            </span>
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-2">
                                {pendingRoleSwitch === 'mechanic' ? 'Switch to Mechanic Mode?' : 'Switch to Car Owner Mode?'}
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                                {pendingRoleSwitch === 'mechanic'
                                    ? 'You will switch to Freelance Mechanic mode. This will enable your mechanic dashboard tools, availability controls, and incoming client requests.'
                                    : 'You will switch to Car Owner mode. You can easily search nearby mechanics, book vehicle repairs, and chat with technicians.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-2.5 relative z-10">
                            <button
                                onClick={() => handleSwitchRole(pendingRoleSwitch)}
                                className={`w-full h-12 text-midnight font-black uppercase tracking-wider text-xs rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                                    pendingRoleSwitch === 'mechanic'
                                        ? 'bg-electric-blue hover:bg-electric-blue/90 shadow-electric-blue/25'
                                        : 'bg-turbo-orange hover:bg-turbo-orange/90 shadow-turbo-orange/25'
                                }`}
                            >
                                <MaterialIcon name="check_circle" className="text-base" />
                                <span>Confirm & Switch Role</span>
                            </button>

                            <button
                                onClick={() => {
                                    setShowRoleConfirmModal(false);
                                    setPendingRoleSwitch(null);
                                }}
                                className="w-full h-10 text-muted-foreground hover:text-white font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Car Owner Edit Profile Modal */}
            {showOwnerEditModal && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div 
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        onClick={() => setShowOwnerEditModal(false)}
                    />
                    <div className="relative w-full max-w-md bg-[#0d1527] border-2 border-white/15 rounded-3xl p-6 sm:p-8 text-left shadow-[0_25px_70px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-300 overflow-hidden z-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-electric-blue/10 blur-3xl rounded-full pointer-events-none" />
                        
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-electric-blue/20 flex items-center justify-center text-electric-blue">
                                    <MaterialIcon name="manage_accounts" className="text-2xl" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white uppercase italic tracking-tight">
                                        Edit Profile
                                    </h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                        Personal & Vehicle Details
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowOwnerEditModal(false)}
                                className="text-muted-foreground hover:text-white p-1 rounded-lg"
                            >
                                <MaterialIcon name="close" className="text-xl" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveOwnerProfile} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <input
                                        required
                                        type="text"
                                        value={ownerEditData.full_name}
                                        onChange={(e) => setOwnerEditData(prev => ({ ...prev, full_name: e.target.value }))}
                                        placeholder="e.g. Juan Dela Cruz"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-electric-blue transition-all"
                                    />
                                    <MaterialIcon name="person" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                        Contact Number
                                    </label>
                                    {ownerPhoneError && (
                                        <span className="text-[9px] font-bold text-red-500 animate-pulse">{ownerPhoneError}</span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={ownerEditData.phone}
                                        onChange={handleOwnerPhoneChange}
                                        placeholder="09XX-XXX-XXXX"
                                        className={`w-full h-12 bg-white/5 border rounded-xl pl-10 pr-4 text-xs font-bold text-white focus:outline-none focus:ring-2 transition-all ${
                                            ownerPhoneError ? "border-red-500/50 focus:ring-red-500/30" : "border-white/10 focus:ring-electric-blue"
                                        }`}
                                    />
                                    <MaterialIcon name="call" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                                    Primary Vehicle Model & Year
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={ownerEditData.vehicle_info}
                                        onChange={(e) => setOwnerEditData(prev => ({ ...prev, vehicle_info: e.target.value }))}
                                        placeholder="e.g. Mitsubishi Lancer / Toyota Vios 2021"
                                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-electric-blue transition-all"
                                    />
                                    <MaterialIcon name="directions_car" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground" />
                                </div>
                                <p className="text-[9px] text-muted-foreground/60 leading-tight ml-1">
                                    This will be automatically suggested when requesting mechanic service.
                                </p>
                            </div>

                            {/* Location & GPS Base Management for Car Owner */}
                            <div className="p-4 bg-midnight/40 rounded-2xl border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-[9px] font-black text-electric-blue uppercase tracking-widest flex items-center gap-1.5">
                                        <MaterialIcon name="my_location" className="text-xs" />
                                        Home / Preferred Location
                                    </label>
                                    {ownerEditData.latitude && ownerEditData.longitude && (
                                        <span className="text-[8px] font-mono text-muted-foreground">
                                            {Number(ownerEditData.latitude).toFixed(4)}, {Number(ownerEditData.longitude).toFixed(4)}
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">City / Town</label>
                                        <input 
                                            value={ownerEditData.city || ''} 
                                            onChange={(e) => setOwnerEditData({ ...ownerEditData, city: e.target.value })}
                                            placeholder="e.g. Cagayan de Oro"
                                            className="w-full h-11 bg-background/50 border border-foreground/10 rounded-xl px-3 text-xs focus:ring-2 focus:ring-electric-blue outline-none text-white" 
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[8px] font-black text-muted-foreground uppercase tracking-widest ml-1 mb-1 block">Barangay</label>
                                        <input 
                                            value={ownerEditData.barangay || ''} 
                                            onChange={(e) => setOwnerEditData({ ...ownerEditData, barangay: e.target.value })}
                                            placeholder="e.g. Carmen"
                                            className="w-full h-11 bg-background/50 border border-foreground/10 rounded-xl px-3 text-xs focus:ring-2 focus:ring-electric-blue outline-none text-white" 
                                        />
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleFetchOwnerGPS}
                                    disabled={isFetchingOwnerGPS}
                                    className="w-full h-11 glass border border-electric-blue/30 text-electric-blue hover:bg-electric-blue/10 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                                >
                                    {isFetchingOwnerGPS ? (
                                        <div className="w-3.5 h-3.5 border-2 border-electric-blue border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <MaterialIcon name="gps_fixed" className="text-xs" />
                                    )}
                                    {isFetchingOwnerGPS ? "Locating..." : "Update to Current GPS Location"}
                                </button>
                            </div>

                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowOwnerEditModal(false)}
                                    className="flex-1 h-12 glass border border-white/10 text-muted-foreground hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingOwner}
                                    className="flex-1 h-12 bg-electric-blue hover:bg-electric-blue/90 text-midnight text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-electric-blue/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {savingOwner ? (
                                        <div className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <MaterialIcon name="check" className="text-sm" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Become a Mechanic Benefits Modal */}
            {showBecomeMechanicModal && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div 
                        className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                        onClick={() => setShowBecomeMechanicModal(false)}
                    />
                    <div className="relative w-full max-w-md bg-[#0d1527] border-2 border-white/15 rounded-[2.5rem] p-6 sm:p-8 text-center shadow-[0_25px_70px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-300 overflow-hidden z-10">
                        {/* Ambient Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-turbo-orange/20 blur-[70px] rounded-full pointer-events-none" />

                        <button
                            onClick={() => setShowBecomeMechanicModal(false)}
                            className="absolute top-5 right-5 text-muted-foreground hover:text-white p-1 rounded-lg z-10"
                        >
                            <MaterialIcon name="close" className="text-xl" />
                        </button>

                        {/* Waving Mascot Animation */}
                        <div className="relative mx-auto w-24 h-24 mb-4">
                            <div className="w-full h-full rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl bg-midnight/80 flex items-center justify-center relative">
                                <img 
                                    src="/mascot-waving.gif" 
                                    alt="TaraFix Waving Mascot" 
                                    className="w-full h-full object-cover" 
                                />
                                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-turbo-orange text-midnight border-2 border-midnight flex items-center justify-center text-sm shadow-lg font-black">
                                    <MaterialIcon name="handshake" className="text-sm" />
                                </div>
                            </div>
                        </div>

                        {/* Header Title */}
                        <div className="mb-5 relative z-10">
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-turbo-orange/10 text-turbo-orange border border-turbo-orange/20 px-3 py-1 rounded-full inline-block mb-2">
                                Mechanic Network
                            </span>
                            <h3 className="text-xl font-black text-white italic uppercase tracking-tight mb-1.5">
                                Ready to Earn as a Mechanic?
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto">
                                Switch to Mechanic Mode to offer your services, receive nearby client requests, and grow your automotive business.
                            </p>
                        </div>

                        {/* Benefits List */}
                        <div className="space-y-2.5 mb-6 text-left relative z-10">
                            <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-turbo-orange/15 border border-turbo-orange/30 flex items-center justify-center text-turbo-orange shrink-0">
                                    <MaterialIcon name="near_me" className="text-lg" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-tight">Direct Local Requests</h4>
                                    <p className="text-[10px] text-muted-foreground leading-snug">Receive instant notifications from car owners near your service base.</p>
                                </div>
                            </div>

                            <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                    <MaterialIcon name="payments" className="text-lg" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-tight">Zero Platform Cut</h4>
                                    <p className="text-[10px] text-muted-foreground leading-snug">Keep 100% of the price negotiated with your customers.</p>
                                </div>
                            </div>

                            <div className="p-3 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-electric-blue/15 border border-electric-blue/30 flex items-center justify-center text-electric-blue shrink-0">
                                    <MaterialIcon name="toggle_on" className="text-lg" />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black text-white uppercase tracking-tight">Work on Your Own Time</h4>
                                    <p className="text-[10px] text-muted-foreground leading-snug">Toggle your availability online or offline in 1 tap anytime.</p>
                                </div>
                            </div>
                        </div>

                        {/* Action CTA */}
                        <div className="flex flex-col gap-2.5 relative z-10">
                            <button
                                onClick={() => {
                                    setShowBecomeMechanicModal(false);
                                    handleSwitchRole('mechanic');
                                }}
                                className="w-full h-12 bg-gradient-to-r from-turbo-orange to-amber-500 hover:from-amber-500 hover:to-turbo-orange active:scale-95 text-midnight font-black uppercase tracking-wider text-xs rounded-2xl transition-all shadow-[0_4px_20px_rgba(255,95,0,0.35)] flex items-center justify-center gap-2 cursor-pointer border border-amber-300/30 group"
                            >
                                <span>Switch Role & Apply Now</span>
                                <MaterialIcon name="arrow_forward" className="text-sm group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => setShowBecomeMechanicModal(false)}
                                className="w-full h-9 text-muted-foreground hover:text-white font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer"
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Emotional Sign Out Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div 
                        className="w-full max-w-sm bg-[#0d1527] border-2 border-white/15 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.95)] animate-in zoom-in-95 duration-300 z-10"
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

            {/* Decline Booking with Reason Modal */}
            {declineTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div 
                        className="w-full max-w-md bg-[#0d1527] border-2 border-white/15 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto mb-4">
                            <MaterialIcon name="cancel" className="text-3xl" />
                        </div>

                        <div className="text-center mb-5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 inline-block mb-2">
                                Decline Service Booking
                            </span>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-2">
                                State Decline Reason
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                The car owner will receive this explanation on their screen and via notification so they can book another mechanic.
                            </p>
                        </div>

                        {/* Preset chips */}
                        <div className="space-y-2 mb-4">
                            <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                Quick Select Reason
                            </label>
                            <div className="flex flex-col gap-2">
                                {[
                                    "Fully booked / No available slot today",
                                    "Location is outside my immediate service range",
                                    "Required parts or tools are unavailable",
                                    "Emergency / Off-duty at the moment",
                                    "Other reason"
                                ].map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() => {
                                            setDeclineReason(preset);
                                            if (preset !== "Other reason") setDeclineCustomReason('');
                                        }}
                                        className={`p-3 rounded-xl text-left text-xs font-bold transition-all border flex items-center justify-between cursor-pointer ${
                                            declineReason === preset 
                                                ? 'bg-red-500/20 border-red-500/60 text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                                                : 'bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10 hover:text-foreground'
                                        }`}
                                    >
                                        <span>{preset}</span>
                                        {declineReason === preset && (
                                            <MaterialIcon name="check_circle" className="text-sm text-red-400 shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom text input */}
                        {(declineReason === "Other reason" || declineReason === "") && (
                            <div className="space-y-1.5 mb-6">
                                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Custom Explanation (Optional if selected above)
                                </label>
                                <textarea
                                    rows={2}
                                    value={declineCustomReason}
                                    onChange={(e) => setDeclineCustomReason(e.target.value)}
                                    placeholder="Explain reason to the car owner..."
                                    className="w-full bg-midnight/80 border border-white/10 rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-red-500 focus:outline-none placeholder:text-muted-foreground resize-none"
                                />
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleConfirmDecline}
                                disabled={isDecliningRequest !== null || (!declineReason && !declineCustomReason.trim())}
                                className="w-full h-13 bg-gradient-to-r from-red-600 to-rose-600 hover:from-rose-600 hover:to-red-600 active:scale-95 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-red-500/25 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                            >
                                {isDecliningRequest ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <MaterialIcon name="close" className="text-sm" />
                                )}
                                <span>{isDecliningRequest ? "Declining..." : "Decline & Send Reason"}</span>
                            </button>

                            <button
                                onClick={() => setDeclineTargetId(null)}
                                disabled={isDecliningRequest !== null}
                                className="w-full h-10 text-muted-foreground hover:text-white font-bold uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer"
                            >
                                Cancel / Keep Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin Direct Notice / Warning Modal (Mechanic Role Only) */}
            {activeAdminNotice && userRole === 'mechanic' && (
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

            {/* Role Switch Success Animated Checkmark Modal */}
            {roleSwitchSuccess && (
                <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
                    <div 
                        className="w-full max-w-sm bg-[#0d1527] border border-white/15 rounded-[2.5rem] p-7 text-center shadow-2xl relative animate-in zoom-in-95 duration-200"
                        onClick={() => setRoleSwitchSuccess(null)}
                    >
                        {/* Animated Draw Checkmark Icon (Clean, No Glow) */}
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                            <svg className="w-9 h-9 text-emerald-400 stroke-current" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path 
                                    className="animate-draw-check"
                                    d="M20 6L9 17L4 12" 
                                />
                            </svg>
                        </div>

                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 bg-emerald-500/10 px-3.5 py-1 rounded-full border border-emerald-500/20 inline-block mb-2.5">
                            Role Updated
                        </span>

                        <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-1">
                            Role Switched!
                        </h3>

                        <p className="text-xs text-muted-foreground leading-relaxed font-medium mb-5">
                            You are now active as:
                        </p>

                        <div className={`p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${
                            roleSwitchSuccess === 'mechanic'
                                ? 'bg-turbo-orange/10 border-turbo-orange/40 text-white'
                                : 'bg-electric-blue/10 border-electric-blue/40 text-white'
                        }`}>
                            <MaterialIcon 
                                name={roleSwitchSuccess === 'mechanic' ? 'engineering' : 'directions_car'} 
                                className={`text-2xl ${roleSwitchSuccess === 'mechanic' ? 'text-turbo-orange' : 'text-electric-blue'}`} 
                            />
                            <span className="text-sm font-black uppercase tracking-wider">
                                {roleSwitchSuccess === 'mechanic' ? 'Mechanic Mode' : 'Car Owner Mode'}
                            </span>
                        </div>
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

            {/* Interactive Expandable Photo Lightbox with Zoom */}
            {expandedAvatarData && (
                <PhotoLightboxModal
                    isOpen={Boolean(expandedAvatarData)}
                    onClose={() => setExpandedAvatarData(null)}
                    imageUrl={expandedAvatarData.url}
                    title={expandedAvatarData.title}
                    subtitle={expandedAvatarData.subtitle}
                    actionLabel={isUploadingAvatar ? "Compressing..." : "Change Photo"}
                    actionIcon="photo_camera"
                    onAction={() => avatarFileInputRef.current?.click()}
                />
            )}

            {/* Hidden File Input for Avatar Upload */}
            <input 
                type="file" 
                ref={avatarFileInputRef} 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarFileSelect} 
            />

            <BottomNav />
        </div>
    );
}
