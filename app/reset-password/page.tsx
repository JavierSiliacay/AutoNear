'use client';

import { useState, useEffect } from 'react';
import { MaterialIcon } from '@/components/material-icon';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const router = useRouter();
    const supabase = createClient();

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match.' });
            return;
        }

        setIsLoading(true);
        setMessage({ type: '', text: '' });

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({
                type: 'success',
                text: 'Password updated successfully! Redirecting to login...'
            });
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-midnight flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 hero-gradient opacity-50 pointer-events-none" />

            <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-white/10 relative z-10 animate-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-electric-blue rounded-2xl flex items-center justify-center text-midnight mx-auto mb-4 shadow-[0_0_30px_rgba(0,209,255,0.4)]">
                        <MaterialIcon name="lock_open" className="text-4xl" />
                    </div>
                    <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">Set New Password</h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Enter your new secure password</p>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl text-sm font-bold text-center mb-6 animate-in fade-in ${message.type === 'error'
                            ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                            : 'bg-green-500/10 border border-green-500/20 text-green-400'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">New Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-12 bg-background border border-white/10 rounded-xl pl-12 pr-4 text-sm focus:ring-2 focus:ring-electric-blue outline-none transition-all placeholder:text-muted-foreground/50"
                                required
                                minLength={6}
                            />
                            <MaterialIcon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full h-12 bg-background border border-white/10 rounded-xl pl-12 pr-4 text-sm focus:ring-2 focus:ring-electric-blue outline-none transition-all placeholder:text-muted-foreground/50"
                                required
                            />
                            <MaterialIcon name="lock_reset" className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        </div>
                    </div>

                    <button
                        disabled={isLoading}
                        className="h-12 bg-electric-blue text-midnight font-black uppercase tracking-wider text-xs rounded-xl hover:bg-white hover:text-electric-blue transition-all disabled:opacity-50 mt-2 shadow-lg shadow-electric-blue/20"
                    >
                        {isLoading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
