'use client';

import { useState, useEffect } from 'react';
import { MaterialIcon } from '@/components/material-icon';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const router = useRouter();
    const supabase = createClient();
    const [searchParamsReady, setSearchParamsReady] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const msg = params.get('message');
        if (msg === 'salamat') {
            setMessage({
                type: 'info',
                text: 'To experience the full access please sign-in, Salamat po!'
            });
        } else if (msg === 'admin_only') {
            setMessage({
                type: 'error',
                text: 'Only Admins are authorized to access this control panel'
            });
        }
    }, []);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-midnight flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 hero-gradient opacity-50 pointer-events-none" />

            <div className="glass-card w-full max-w-md p-8 rounded-3xl border border-white/10 relative z-10 animate-in zoom-in-95 duration-500">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-turbo-orange rounded-2xl flex items-center justify-center text-midnight mx-auto mb-4 shadow-[0_0_30px_rgba(255,95,0,0.4)]">
                        <MaterialIcon name="security" className="text-4xl" />
                    </div>
                    <h1 className="text-2xl font-black text-foreground uppercase tracking-tight">AutoNear Secure Access</h1>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-2">Sign in to continue</p>
                </div>

                {message.text && (
                    <div className={`p-4 rounded-xl text-sm font-bold text-center mb-10 animate-in fade-in ${message.type === 'error' ? 'bg-destructive/10 border border-destructive/20 text-destructive' :
                        message.type === 'info' ? 'bg-turbo-orange/10 border border-turbo-orange/20 text-turbo-orange' :
                            'bg-green-500/10 border border-green-500/20 text-green-400'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="flex flex-col gap-6">
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full h-16 bg-white text-midnight font-bold rounded-2xl flex items-center justify-center gap-4 hover:bg-gray-100 transition-all border border-gray-200 shadow-xl disabled:opacity-50"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        <span className="text-sm uppercase tracking-wider font-black">Continue with Google</span>
                    </button>

                    <p className="text-[10px] text-muted-foreground text-center font-bold uppercase tracking-[0.2em] px-8 leading-relaxed">
                        By signing in, you agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>

                <div className="mt-12 pt-6 border-t border-white/5 text-center">
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                        Need help? <Link href="/" className="text-turbo-orange hover:text-white transition-colors">Go Back Home</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
