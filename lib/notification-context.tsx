'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage } from '@/lib/types';
import { useSession } from 'next-auth/react';
import { savePushSubscription } from '@/lib/actions';

interface NotificationContextType {
    unreadCounts: Record<string, number>;
    clearUnreadCount: (requestId: string) => void;
    unviewedAppointments: string[];
    markAppointmentViewed: (requestId: string) => void;
    setActiveChatId: (id: string | null) => void;
    subscribeToPush: () => Promise<boolean>;
    isPushSupported: boolean;
    totalUnread: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const { data: nextAuthSession } = useSession();
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [unviewedAppointments, setUnviewedAppointments] = useState<string[]>([]);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isPushSupported, setIsPushSupported] = useState(false);
    const activeChatIdRef = useRef<string | null>(null);
    const userEmailRef = useRef<string | null>(null);
    const myRequestIdsRef = useRef<Set<string>>(new Set());
    const mechanicProfileRef = useRef<any>(null);
    const lastAudioPlayRef = useRef<number>(0);
    const processedMessageIdsRef = useRef<Set<string>>(new Set());
    const processedRequestIdsRef = useRef<Set<string>>(new Set());
    const supabase = createClient();

    const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BEx6mp-8rKcS0L08Ca7epwKz3TTPGFvqbelrnYLdM-HhjoPUM-7Z-0Gi9Pcg8Zig5f_Prj5q3DKGYS4Fnxqfu3g";

    // Sum of all unread chat messages + unviewed new appointment requests
    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) + unviewedAppointments.length;

    const setAndPersistUnreadCounts = (updater: (prev: Record<string, number>) => Record<string, number>) => {
        setUnreadCounts(prev => {
            const next = updater(prev);
            if (userEmailRef.current) {
                try {
                    localStorage.setItem(`unread_counts_${userEmailRef.current}`, JSON.stringify(next));
                } catch { }
            }
            return next;
        });
    };

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const triggerSystemNotification = (title: string, body: string, url: string = '/profile') => {
        // 1. Play chime
        const now = Date.now();
        if (now - lastAudioPlayRef.current > 1500) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
            audio.play().catch(() => { });
            lastAudioPlayRef.current = now;
        }

        // 2. Trigger Phone / OS Lockscreen & Shade Notification Card
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then((reg) => {
                    reg.showNotification(title, {
                        body: body,
                        icon: '/icon.png',
                        badge: '/icon.png',
                        vibrate: [200, 100, 200, 100, 200],
                        data: { url: url },
                        tag: 'tarafix-' + Date.now(),
                        renotify: true,
                        requireInteraction: true
                    }).catch((err) => {
                        console.log("Service Worker showNotification fallback:", err);
                        try {
                            new Notification(title, { body, icon: '/icon.png' });
                        } catch {}
                    });
                }).catch(() => {
                    try {
                        new Notification(title, { body, icon: '/icon.png' });
                    } catch {}
                });
            } else {
                try {
                    new Notification(title, { body, icon: '/icon.png' });
                } catch {}
            }
        }
    };

    useEffect(() => {
        setIsPushSupported('serviceWorker' in navigator && 'PushManager' in window);

        let globalChannel: any = null;

        const setupSubscription = (email: string) => {
            if (globalChannel) {
                supabase.removeChannel(globalChannel);
            }

            // Use a UNIQUE channel name per user to prevent crosstalk
            globalChannel = supabase
                .channel(`notifications:${email.replace(/[^a-zA-Z0-9]/g, '_')}`)
                // 1. Listen for MY NEW Service Requests (Appointment Bookings)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'service_requests'
                    },
                    (payload) => {
                        const newReq = payload.new as any;

                        // If a customer just booked with THIS mechanic
                        if (mechanicProfileRef?.current?.id && newReq.mechanic_id === mechanicProfileRef.current.id) {
                            myRequestIdsRef.current.add(newReq.id);

                            setUnviewedAppointments(prev => {
                                if (prev.includes(newReq.id)) return prev;
                                const updated = [...prev, newReq.id];
                                try {
                                    localStorage.setItem(`unviewed_appointments_${email}`, JSON.stringify(updated));
                                } catch { }
                                return updated;
                            });

                            // Trigger Phone Notification Card & Audio Chime
                            triggerSystemNotification(
                                '🚗 New Service Request!',
                                `${newReq.customer_name || 'A customer'} booked an appointment.`,
                                '/profile'
                            );
                        } else if (newReq.customer_email === userEmailRef.current) {
                            myRequestIdsRef.current.add(newReq.id);
                        }
                    }
                )
                // 2. Listen for status changes (e.g. Mechanic accepted, arrived, on my way, completed)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'service_requests'
                    },
                    (payload) => {
                        const updatedReq = payload.new as any;
                        const oldReq = payload.old as any;

                        if (myRequestIdsRef.current.has(updatedReq.id)) {
                            // If status changed and I'm customer, trigger alert
                            if (updatedReq.status !== oldReq?.status && updatedReq.customer_email === userEmailRef.current) {
                                setAndPersistUnreadCounts(prev => ({
                                    ...prev,
                                    [updatedReq.id]: (prev[updatedReq.id] || 0) + 1
                                }));

                                const readableStatus = (updatedReq.status || '').replace(/_/g, ' ').toUpperCase();
                                triggerSystemNotification(
                                    `🔧 Status Update: ${readableStatus}`,
                                    `Your mechanic updated the service request to ${readableStatus}.`,
                                    '/profile'
                                );
                            }
                        }
                    }
                )
                // 3. Listen for messages
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'service_request_messages'
                    },
                    (payload) => {
                        const newMsg = payload.new as ChatMessage;

                        // Prevention: don't process same message twice if realtime double-fires
                        if (processedMessageIdsRef.current.has(newMsg.id)) return;
                        processedMessageIdsRef.current.add(newMsg.id);

                        // ONLY trigger if the message belongs to ONE OF MY REQUESTS
                        // and I am NOT the sender, and it's not the active chat
                        const isForMe = myRequestIdsRef.current.has(newMsg.request_id);
                        const isNotFromMe = newMsg.sender_email !== userEmailRef.current;
                        const isNotActive = activeChatIdRef.current !== newMsg.request_id;

                        if (isForMe && isNotFromMe && isNotActive) {
                            setAndPersistUnreadCounts(prev => ({
                                ...prev,
                                [newMsg.request_id]: (prev[newMsg.request_id] || 0) + 1
                            }));

                            const senderName = newMsg.sender_role === 'mechanic' ? 'Mechanic' : 'Customer';
                            triggerSystemNotification(
                                `💬 New Message from ${senderName}`,
                                newMsg.content && newMsg.content.length > 50 ? newMsg.content.substring(0, 50) + '...' : newMsg.content || 'New attachment sent',
                                '/profile'
                            );
                        }
                    }
                )
                .subscribe();
        };

        const init = async () => {
            let activeEmail = nextAuthSession?.user?.email;
            if (!activeEmail) {
                const { data: { user } } = await supabase.auth.getUser();
                activeEmail = user?.email || null;
            }

            if (activeEmail) {
                userEmailRef.current = activeEmail;
                setUserEmail(activeEmail);

                // Restore persistent unread counts for active user
                try {
                    const savedCounts = localStorage.getItem(`unread_counts_${activeEmail}`);
                    if (savedCounts) {
                        setUnreadCounts(JSON.parse(savedCounts));
                    }
                } catch { }

                // 1. Get Mechanic ID if it exists
                const { data: mechanic } = await supabase
                    .from('mechanics')
                    .select('id')
                    .eq('email', activeEmail)
                    .maybeSingle();

                if (mechanic) mechanicProfileRef.current = mechanic;

                // 2. Fetch our request IDs initially
                const { data: custRequests } = await supabase
                    .from('service_requests')
                    .select('id')
                    .eq('customer_email', activeEmail);

                let allIds = (custRequests || []).map(r => r.id);

                if (mechanic) {
                    const { data: mechRequests } = await supabase
                        .from('service_requests')
                        .select('id, status, created_at')
                        .eq('mechanic_id', mechanic.id);

                    if (mechRequests) {
                        allIds = [...allIds, ...mechRequests.map(r => r.id)];

                        // Retrieve persistent unviewed appointment list
                        try {
                            const saved = localStorage.getItem(`unviewed_appointments_${activeEmail}`);
                            if (saved) {
                                const parsed = JSON.parse(saved) as string[];
                                // Filter only existing ones
                                const validIds = parsed.filter(id => mechRequests.some(r => r.id === id));
                                setUnviewedAppointments(validIds);
                            } else {
                                // If first time, mark pending appointments from last 24 hours as unviewed
                                const recentPending = mechRequests
                                    .filter(r => r.status === 'pending' && (Date.now() - new Date(r.created_at).getTime() < 86400000))
                                    .map(r => r.id);
                                if (recentPending.length > 0) {
                                    setUnviewedAppointments(recentPending);
                                    localStorage.setItem(`unviewed_appointments_${activeEmail}`, JSON.stringify(recentPending));
                                }
                            }
                        } catch { }
                    }
                }

                myRequestIdsRef.current = new Set(allIds);
                setupSubscription(activeEmail);

                // Auto-subscribe to Push if permission is granted, or auto-prompt on interaction
                if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
                    try {
                        const registerPushToken = async () => {
                            try {
                                const reg = await navigator.serviceWorker.ready;
                                let sub = await reg.pushManager.getSubscription();
                                if (!sub) {
                                    sub = await reg.pushManager.subscribe({
                                        userVisibleOnly: true,
                                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                                    });
                                }
                                if (sub) {
                                    await savePushSubscription(sub.toJSON());
                                }
                            } catch (e) {
                                console.log("Push registration background sync:", e);
                            }
                        };

                        if (Notification.permission === 'granted') {
                            registerPushToken();
                        } else if (Notification.permission === 'default') {
                            // Prompt user automatically
                            Notification.requestPermission().then((perm) => {
                                if (perm === 'granted') {
                                    registerPushToken();
                                }
                            }).catch(() => {});
                        }
                    } catch {}
                }
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const email = session?.user?.email || nextAuthSession?.user?.email || null;
            if (email) {
                userEmailRef.current = email;
                setUserEmail(email);
                setupSubscription(email);
            }
        });

        init();

        return () => {
            subscription.unsubscribe();
            if (globalChannel) supabase.removeChannel(globalChannel);
        };
    }, [supabase, nextAuthSession?.user?.email]);

    const markAppointmentViewed = (requestId: string) => {
        setUnviewedAppointments(prev => {
            if (!prev.includes(requestId)) return prev;
            const next = prev.filter(id => id !== requestId);
            if (userEmail) {
                try {
                    localStorage.setItem(`unviewed_appointments_${userEmail}`, JSON.stringify(next));
                } catch { }
            }
            return next;
        });
    };

    const clearUnreadCount = (requestId: string) => {
        setAndPersistUnreadCounts(prev => {
            if (!prev[requestId]) return prev;
            const next = { ...prev };
            delete next[requestId];
            return next;
        });
        markAppointmentViewed(requestId);
    };

    const setActiveChatId = (id: string | null) => {
        activeChatIdRef.current = id;
        if (id) {
            clearUnreadCount(id);
            markAppointmentViewed(id);
        }
    };

    const subscribeToPush = async () => {
        if (!isPushSupported || !userEmail) return false;

        try {
            // Wait for the PWA service worker to be ready
            const registration = await navigator.serviceWorker.ready;

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Save to database via dedicated server action
            const subJson = subscription.toJSON();
            const result = await savePushSubscription(subJson);
            if (!result.success) {
                console.error("Save push subscription error:", result.error);
                return false;
            }
            return true;
        } catch (err) {
            console.error('Push registration failed:', err);
            return false;
        }
    };

    return (
        <NotificationContext.Provider value={{ unreadCounts, clearUnreadCount, unviewedAppointments, markAppointmentViewed, setActiveChatId, subscribeToPush, isPushSupported, totalUnread }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
