'use client';

import { useState } from 'react';
import { MaterialIcon } from '@/components/material-icon';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const supabase = createClient();

    const handleResetRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: '', text: '' });

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({
                type: 'success',
                text: 'Password reset link sent! Please check your email inbox.'
            });
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-midnight flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 hero-gradient opacity-50 pointer-events-none" />

            <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-white/10 relative z-10 animate-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-turbo-orange rounded-2xl flex items-center justify-center text-midnight mx-auto mb-4 shadow-[0_0_30px_rgba(255,95,0,0.4)]">
                        <MaterialIcon name="lock_reset" className="text-4xl" />
                    </div>
                    <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Reset Password</h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Enter your email to get a reset link</p>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl text-sm font-bold text-center mb-6 animate-in fade-in ${message.type === 'error'
                            ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                            : 'bg-green-500/10 border border-green-500/20 text-green-400'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
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
                        className="h-12 bg-turbo-orange text-midnight font-black uppercase tracking-wider text-xs rounded-xl hover:bg-white hover:text-turbo-orange transition-all disabled:opacity-50 mt-2 shadow-lg shadow-turbo-orange/20"
                    >
                        {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                        Remember your password?{' '}
                        <Link href="/login" className="text-turbo-orange hover:text-white transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
