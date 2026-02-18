'use client';

import { JoinNetworkForm } from "@/components/join-network-form";
import { BottomNav } from "@/components/bottom-nav";
import { MaterialIcon } from "@/components/material-icon";
import Link from "next/link";

export default function ShopRegistrationPage() {
    return (
        <div className="min-h-screen pb-32 bg-midnight">
            <header className="sticky top-0 z-50 glass border-b border-foreground/5">
                <div className="flex items-center justify-between px-5 h-16 max-w-lg mx-auto">
                    <Link href="/" className="w-10 h-10 flex items-center justify-start text-foreground">
                        <MaterialIcon name="arrow_back_ios" />
                    </Link>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-turbo-orange uppercase tracking-[0.3em]">Network expansion</span>
                        <span className="text-sm font-black text-foreground italic uppercase tracking-tight">Shop Registration</span>
                    </div>
                    <div className="w-10 h-10" />
                </div>
            </header>

            <main className="max-w-lg mx-auto p-6">
                <div className="mb-8 text-center">
                    <div className="w-20 h-20 bg-turbo-orange/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-turbo-orange border border-turbo-orange/20 shadow-[0_0_30px_rgba(255,95,0,0.1)]">
                        <MaterialIcon name="add_business" className="text-4xl" />
                    </div>
                    <h1 className="text-3xl font-black text-foreground italic uppercase tracking-tighter leading-none mb-3">
                        Register Your Shop
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed px-4">
                        Join the AutoNear network to reach more customers in CDO and surrounding cities. Submit your details for verification.
                    </p>
                </div>

                <div className="glass-card rounded-3xl p-1 border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                    <JoinNetworkForm forceOpen={true} />
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                    <div className="p-4 glass rounded-2xl border border-white/5">
                        <MaterialIcon name="verified" className="text-electric-blue mb-2" />
                        <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Verified Status</h4>
                        <p className="text-[9px] text-muted-foreground mt-1">Get the blue checkmark after Google Maps verification.</p>
                    </div>
                    <div className="p-4 glass rounded-2xl border border-white/5">
                        <MaterialIcon name="trending_up" className="text-turbo-orange mb-2" />
                        <h4 className="text-[10px] font-black text-foreground uppercase tracking-widest">Grow Faster</h4>
                        <p className="text-[9px] text-muted-foreground mt-1">Appear at the top of nearby searches for your area.</p>
                    </div>
                </div>
            </main>

            <BottomNav />
        </div>
    );
}
