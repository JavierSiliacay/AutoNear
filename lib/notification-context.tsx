'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ChatMessage } from '@/lib/types';

interface NotificationContextType {
    unreadCounts: Record<string, number>;
    clearUnreadCount: (requestId: string) => void;
    setActiveChatId: (id: string | null) => void;
    subscribeToPush: () => Promise<boolean>;
    isPushSupported: boolean;
    totalUnread: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [isPushSupported, setIsPushSupported] = useState(false);
    const activeChatIdRef = useRef<string | null>(null);
    const userEmailRef = useRef<string | null>(null);
    const myRequestIdsRef = useRef<Set<string>>(new Set());
    const supabase = createClient();

    const VAPID_PUBLIC_KEY = "BO30rV39OUGCdyHYEqkQ7dlD4xvCj8TE8MYCOVyyTEohFCkq2JHlAfKsOn60ZXaA5n6oBTvbCsCtmCpqoNMIuF4";

    // Sum of all unread counts
    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

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

    useEffect(() => {
        setIsPushSupported('serviceWorker' in navigator && 'PushManager' in window);
        
        let globalChannel: any = null;

        const setupSubscription = (email: string) => {
            if (globalChannel) supabase.removeChannel(globalChannel);

            globalChannel = supabase
                .channel('global-notifications')
                // 1. Listen for MY NEW Service Requests (to update our watchlist)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'service_requests'
                    },
                    (payload) => {
                        const newReq = payload.new as any;
                        if (newReq.customer_email === userEmailRef.current || newReq.mechanic_email === userEmailRef.current) {
                            myRequestIdsRef.current.add(newReq.id);
                        }
                    }
                )
                // 2. Listen for messages
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'service_request_messages'
                    },
                    (payload) => {
                        const newMsg = payload.new as ChatMessage;
                        
                        // ONLY trigger if the message belongs to ONE OF MY REQUESTS
                        // and I am NOT the sender, and it's not the active chat
                        const isForMe = myRequestIdsRef.current.has(newMsg.request_id);
                        const isNotFromMe = newMsg.sender_email !== userEmailRef.current;
                        const isNotActive = activeChatIdRef.current !== newMsg.request_id;

                        if (isForMe && isNotFromMe && isNotActive) {
                            setUnreadCounts(prev => ({
                                ...prev,
                                [newMsg.request_id]: (prev[newMsg.request_id] || 0) + 1
                            }));
                            
                            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
                            audio.play().catch(() => {});
                        }
                    }
                )
                .subscribe();
        };

        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                userEmailRef.current = user.email;
                setUserEmail(user.email);
                
                // 1. Get Mechanic ID if it exists
                const { data: mechanic } = await supabase
                    .from('mechanics')
                    .select('id')
                    .eq('email', user.email)
                    .maybeSingle();

                // 2. Fetch our request IDs initially using Email OR Mechanic ID
                let query = supabase
                    .from('service_requests')
                    .select('id')
                    .eq('customer_email', user.email);
                
                if (mechanic) {
                    // If they are a mechanic, also fetch where they are the provider
                    const { data: custRequests } = await query;
                    const { data: mechRequests } = await supabase
                        .from('service_requests')
                        .select('id')
                        .eq('mechanic_id', mechanic.id);
                    
                    const allIds = [
                        ...(custRequests || []).map(r => r.id),
                        ...(mechRequests || []).map(r => r.id)
                    ];
                    myRequestIdsRef.current = new Set(allIds);
                } else {
                    const { data: custRequests } = await query;
                    myRequestIdsRef.current = new Set((custRequests || []).map(r => r.id));
                }

                setupSubscription(user.email);
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            const email = session?.user?.email || null;
            userEmailRef.current = email;
            setUserEmail(email);

            if (email) {
                setupSubscription(email);
            } else {
                if (globalChannel) {
                    supabase.removeChannel(globalChannel);
                    globalChannel = null;
                }
                setUnreadCounts({});
            }
        });

        init();
        
        return () => {
            subscription.unsubscribe();
            if (globalChannel) supabase.removeChannel(globalChannel);
        };
    }, [supabase]);

    const clearUnreadCount = (requestId: string) => {
        setUnreadCounts(prev => {
            if (!prev[requestId]) return prev;
            const next = { ...prev };
            delete next[requestId];
            return next;
        });
    };

    const setActiveChatId = (id: string | null) => {
        activeChatIdRef.current = id;
        if (id) clearUnreadCount(id);
    };

    const subscribeToPush = async () => {
        if (!isPushSupported || !userEmail) return false;

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            // Save to Supabase
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_email: userEmail,
                    subscription: subscription.toJSON()
                }, { onConflict: 'user_email,subscription' });

            if (error) throw error;
            return true;
        } catch (err) {
            console.error('Push registration failed:', err);
            return false;
        }
    };

    return (
        <NotificationContext.Provider value={{ unreadCounts, clearUnreadCount, setActiveChatId, subscribeToPush, isPushSupported, totalUnread }}>
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
