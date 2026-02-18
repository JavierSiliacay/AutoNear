'use client';

import { useState } from 'react';
import { MaterialIcon } from './material-icon';
import { submitShopRequest } from '@/lib/actions';

interface JoinNetworkFormProps {
    trigger?: React.ReactNode;
    className?: string;
    forceOpen?: boolean;
}

export function JoinNetworkForm({ trigger, className, forceOpen = false }: JoinNetworkFormProps) {
    const [isOpen, setIsOpen] = useState(forceOpen);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await submitShopRequest(formData);

        if (result.success) {
            setSubmitted(true);
            setTimeout(() => {
                setSubmitted(false);
                if (!forceOpen) {
                    setIsOpen(false);
                }
            }, 3000);
        } else {
            setError(result.error || 'Something went wrong');
        }
        setIsSubmitting(false);
    }

    if (!isOpen && !forceOpen) {
        if (trigger) {
            return (
                <div onClick={() => setIsOpen(true)} className={className}>
                    {trigger}
                </div>
            );
        }
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`w-full h-14 glass border-2 border-dashed border-turbo-orange/30 rounded-2xl flex items-center justify-center gap-3 text-turbo-orange font-black uppercase tracking-widest text-xs hover:border-turbo-orange/60 transition-all hover:bg-turbo-orange/5 ${className || ''}`}
            >
                <MaterialIcon name="add_business" />
                Join Network
            </button>
        );
    }

    const formContent = (
        <div className={`w-full ${!forceOpen ? 'glass-card rounded-3xl p-8 border-turbo-orange/20 overflow-y-auto max-h-[90vh]' : 'p-6'}`}>
            {!forceOpen && (
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-foreground italic uppercase tracking-tighter">Join Network</h2>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Register your shop</p>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
                        <MaterialIcon name="close" />
                    </button>
                </div>
            )}

            {submitted ? (
                <div className="py-12 text-center animate-in zoom-in">
                    <div className="w-20 h-20 bg-electric-blue/20 rounded-full flex items-center justify-center mx-auto mb-6 text-electric-blue">
                        <MaterialIcon name="check_circle" className="text-5xl" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Request Submitted!</h3>
                    <p className="text-sm text-muted-foreground">Our team will verify your shop on Google Maps and get back to you soon.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Shop Name</label>
                        <input
                            required
                            name="shop_name"
                            className="h-12 bg-background border border-foreground/10 rounded-xl px-4 text-sm focus:ring-2 focus:ring-turbo-orange outline-none transition-all"
                            placeholder="e.g. KarrJackson Automotive"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Owner Name</label>
                        <input
                            required
                            name="owner_name"
                            className="h-12 bg-background border border-foreground/10 rounded-xl px-4 text-sm focus:ring-2 focus:ring-turbo-orange outline-none transition-all"
                            placeholder="Your full name"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Contact Details</label>
                        <input
                            required
                            name="contact_details"
                            className="h-12 bg-background border border-foreground/10 rounded-xl px-4 text-sm focus:ring-2 focus:ring-turbo-orange outline-none transition-all"
                            placeholder="Phone or Email"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Shop Address</label>
                        <textarea
                            required
                            name="address"
                            rows={2}
                            className="bg-background border border-foreground/10 rounded-xl p-4 text-sm focus:ring-2 focus:ring-turbo-orange outline-none transition-all resize-none"
                            placeholder="Full address in CDO or nearby cities"
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Google Maps Link</label>
                        <input
                            required
                            name="google_maps_link"
                            className="h-12 bg-background border border-foreground/10 rounded-xl px-4 text-sm focus:ring-2 focus:ring-turbo-orange outline-none transition-all"
                            placeholder="Search link or shared link"
                        />
                        <p className="text-[9px] text-muted-foreground italic ml-1">* Used for verifying ratings and location</p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-bold text-center">
                            {error}
                        </div>
                    )}

                    <button
                        disabled={isSubmitting}
                        type="submit"
                        className="h-14 bg-turbo-orange orange-glow text-midnight font-black uppercase tracking-[0.2em] text-xs rounded-2xl flex items-center justify-center gap-3 mt-4 disabled:opacity-50 transition-all active:scale-[0.98]"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <MaterialIcon name="send" />
                                Submit for Approval
                            </>
                        )}
                    </button>
                </form>
            )}
        </div>
    );

    if (forceOpen) {
        return formContent;
    }

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-midnight/90 backdrop-blur-xl animate-in fade-in">
            {formContent}
        </div>
    );
}
