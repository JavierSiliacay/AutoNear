import { MechanicRegistrationForm } from "@/components/mechanic-registration-form"
import { BottomNav } from "@/components/bottom-nav"
import { MaterialIcon } from "@/components/material-icon"
import Link from "next/link"

export default function RegisterMechanicPage() {
  return (
    <div className="min-h-screen pb-32 bg-midnight">
      <header className="sticky top-0 z-50 glass border-b border-foreground/5">
        <div className="flex items-center justify-between px-5 h-16 max-w-lg mx-auto">
          <Link href="/" className="w-10 h-10 flex items-center justify-start text-foreground">
            <MaterialIcon name="arrow_back_ios" />
          </Link>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-turbo-orange uppercase tracking-[0.3em]">Become a Mechanic</span>
            <span className="text-sm font-black text-foreground italic uppercase tracking-tight">TaraFix Network</span>
          </div>
          <div className="w-10 h-10" />
        </div>
      </header>

      <main className="max-w-lg mx-auto p-6">
        <div className="mb-10 text-center">
          <div className="w-24 h-24 bg-turbo-orange/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-turbo-orange border border-turbo-orange/20 shadow-[0_0_50px_rgba(255,95,0,0.15)] animate-in zoom-in">
            <MaterialIcon name="engineering" className="text-5xl" />
          </div>
          <h1 className="text-4xl font-black text-foreground italic uppercase tracking-tighter leading-none mb-3">
            DRIVE YOUR <span className="text-turbo-orange">FUTURE</span>
          </h1>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed px-6">
            Join the Philippines' premium mobility service for freelance mechanics. Set your location, prove your skills, and start earning.
          </p>
        </div>

        <div className="glass-card rounded-[2rem] p-1 border-white/5 bg-gradient-to-b from-white/10 to-transparent shadow-2xl overflow-hidden">
          <div className="bg-midnight/40 backdrop-blur-3xl p-6 rounded-[1.9rem]">
            <MechanicRegistrationForm />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4">
          <div className="p-6 glass rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-turbo-orange/10 rounded-bl-full translate-x-4 -translate-y-4" />
            <MaterialIcon name="verified" className="text-turbo-orange text-3xl mb-3" />
            <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest">Verified Badge</h4>
            <p className="text-[9px] text-muted-foreground mt-2 leading-relaxed font-bold uppercase tracking-tight">Get the TaraFix verified mark after base verification.</p>
          </div>
          <div className="p-6 glass rounded-2xl border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-16 h-16 bg-electric-blue/10 rounded-bl-full translate-x-4 -translate-y-4" />
            <MaterialIcon name="payments" className="text-electric-blue text-3xl mb-3" />
            <h4 className="text-[11px] font-black text-foreground uppercase tracking-widest">Direct Earnings</h4>
            <p className="text-[9px] text-muted-foreground mt-2 leading-relaxed font-bold uppercase tracking-tight">Keep 100% of your service fees. No platform cut for early mechanics.</p>
          </div>
        </div>
        
        <footer className="mt-12 pb-10 text-center">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Powered by TaraFix Mobility Ecosystem</p>
        </footer>
      </main>

      <BottomNav />
    </div>
  )
}
