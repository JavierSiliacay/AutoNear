'use client';

import { useState, useEffect, useRef } from 'react';
import { MaterialIcon } from './material-icon';
import { getMessages, sendChatMessage } from '@/lib/actions';
import type { ChatMessage } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

interface ServiceChatProps {
    requestId: string;
    recipientName: string;
    currentUserEmail: string;
    currentUserRole: 'admin' | 'customer';
    onClose: () => void;
}

export function ServiceChat({ requestId, recipientName, currentUserEmail, currentUserRole, onClose }: ServiceChatProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        loadMessages();

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`chat:${requestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'service_request_messages',
                    filter: `request_id=eq.${requestId}`
                },
                (payload) => {
                    setMessages((prev) => [...prev, payload.new as ChatMessage]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [requestId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    async function loadMessages() {
        setIsLoading(true);
        const data = await getMessages(requestId);
        setMessages(data as ChatMessage[]);
        setIsLoading(false);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const content = newMessage;
        setNewMessage('');

        const result = await sendChatMessage(requestId, content, currentUserRole, currentUserEmail);
        if (!result.success) {
            alert(result.error);
        }
    }

    return (
        <div className="fixed inset-0 z-[3000] flex items-end sm:items-center justify-center p-4 sm:p-6 bg-midnight/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-slate-deep w-full max-w-lg h-[80vh] sm:h-[600px] flex flex-col rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500">
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-turbo-orange/20 rounded-full flex items-center justify-center text-turbo-orange border border-turbo-orange/30">
                            <MaterialIcon name={currentUserRole === 'admin' ? "person" : "headset_mic"} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">{recipientName}</h3>
                            <p className="text-[10px] font-black text-turbo-orange uppercase tracking-widest">
                                {currentUserRole === 'admin' ? 'Customer Message' : 'AutoNear Support'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-white/5 transition-all"
                    >
                        <MaterialIcon name="close" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 bg-midnight/30">
                    {isLoading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-turbo-orange border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                            <MaterialIcon name="chat" className="text-4xl mb-3" />
                            <p className="text-xs font-bold uppercase tracking-widest leading-relaxed"> No messages yet.<br />Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender_role === currentUserRole;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${isMe
                                            ? 'bg-turbo-orange text-midnight font-bold rounded-tr-none shadow-lg shadow-turbo-orange/10'
                                            : 'bg-white/10 text-foreground rounded-tl-none border border-white/5'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1.5 px-1">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSubmit} className="p-4 bg-white/5 border-t border-white/5">
                    <div className="relative flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 h-14 bg-midnight/50 border border-white/10 rounded-2xl px-6 py-2 text-sm focus:ring-2 focus:ring-turbo-orange outline-none transition-all placeholder:text-muted-foreground/30"
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim()}
                            className="w-14 h-14 bg-turbo-orange text-midnight rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            <MaterialIcon name="send" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
