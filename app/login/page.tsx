'use client';

import { useState } from 'react';
import { MaterialIcon } from '@/components/material-icon';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (error) {
            setMessage(`Error: ${error.message}`);
        } else {
            setMessage('Check your email for the login link!');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-midnight flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 hero-gradient opacity-50 pointer-events-none" />

            <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-white/10 relative z-10 animate-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-turbo-orange rounded-2xl flex items-center justify-center text-midnight mx-auto mb-4 shadow-[0_0_30px_rgba(255,95,0,0.4)]">
                        <MaterialIcon name="admin_panel_settings" className="text-4xl" />
                    </div>
                    <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Admin Access</h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Authorized Personnel Only</p>
                </div>

                {message ? (
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm font-bold text-center mb-6 animate-in fade-in">
                        {message}
                    </div>
                ) : (
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full h-12 bg-background border border-white/10 rounded-xl pl-12 pr-4 text-sm focus:ring-2 focus:ring-turbo-orange outline-none transition-all placeholder:text-muted-foreground/50"
                                    required
                                />
                                <MaterialIcon name="email" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            </div>
                        </div>

                        <button
                            disabled={isLoading}
                            className="h-12 bg-turbo-orange text-midnight font-black uppercase tracking-wider text-xs rounded-xl hover:bg-white hover:text-turbo-orange transition-all disabled:opacity-50 mt-2"
                        >
                            {isLoading ? 'Sending Link...' : 'Sign in with Email Link'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
