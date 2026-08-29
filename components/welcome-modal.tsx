"use client";

import { useEffect, useState, useRef } from "react";
import { X, ArrowRight, ArrowLeft, Check, Compass, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/material-icon";

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: "top" | "bottom";
  badge: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-explore-btn",
    title: "Explore Available Mechanics",
    description: "Tap here to search and view all Expert mechanics ready for home service or on-shop repairs in your area.",
    position: "bottom",
    badge: "STEP 1 OF 3"
  },
  {
    targetId: "tour-categories",
    title: "Filter by Service Specialty",
    description: "Easily find experts for your specific needs: Engine, Brakes, Tires, Electrical, or Battery.",
    position: "top",
    badge: "STEP 2 OF 3"
  },
  {
    targetId: "tour-nav-profile",
    title: "Profile & Active Request Queue",
    description: "Track your active jobs, message your mechanics in real-time chat, and manage your account right here.",
    position: "top",
    badge: "STEP 3 OF 3"
  }
];

export function WelcomeModal() {
  const [phase, setPhase] = useState<"hidden" | "intro" | "spotlight" | "completed" | "role_selection">("hidden");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Check if user has completed the tour v2
    const hasSeenTour = localStorage.getItem("tarafix_tour_v2_seen");
    if (!hasSeenTour) {
      const timer = setTimeout(() => {
        setPhase("intro");
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const updateSpotlightPosition = (index: number) => {
    const step = TOUR_STEPS[index];
    if (!step) return;

    // Resolve target element (prioritize mobile profile tab, fallback to desktop profile or bottom nav)
    let el = document.getElementById(step.targetId);
    if (!el || el.offsetParent === null) {
      if (step.targetId === "tour-nav-profile" || step.targetId === "tour-bottom-nav") {
        el = document.getElementById("tour-desktop-profile") || document.getElementById("tour-bottom-nav");
      }
    }

    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      }, 350);
    } else {
      // Fallback center position if target is not mounted
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (phase === "spotlight") {
      updateSpotlightPosition(currentStepIndex);

      const handleResize = () => updateSpotlightPosition(currentStepIndex);
      window.addEventListener("resize", handleResize);
      window.addEventListener("scroll", handleResize, true);
      return () => {
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("scroll", handleResize, true);
      };
    }
  }, [phase, currentStepIndex]);

  const handleStartTour = () => {
    setPhase("spotlight");
    setCurrentStepIndex(0);
  };

  const handleFinishTour = () => {
    setPhase("hidden");
    localStorage.setItem("tarafix_tour_v2_seen", "true");
  };

  const handleNextStep = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setPhase("completed");
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  if (phase === "hidden") return null;

  // 1. Initial Prompt Card ("Let's take a quick tour")
  if (phase === "intro") {
    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-5 animate-in fade-in duration-300">
        <div 
          className="absolute inset-0 bg-midnight/80 backdrop-blur-sm"
          onClick={handleFinishTour}
        />
        
        <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-turbo-orange/10 border border-turbo-orange/20 rounded-2xl flex items-center justify-center text-turbo-orange mx-auto mb-5 shadow-lg shadow-turbo-orange/10">
            <MaterialIcon name="explore" className="text-3xl" />
          </div>

          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-turbo-orange bg-turbo-orange/10 px-3 py-1 rounded-full border border-turbo-orange/20 inline-block mb-3">
            Welcome to TaraFix
          </span>

          <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tight mb-2">
            Let's take a quick tour
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-8 max-w-[240px] mx-auto">
            Discover how to find, book, and chat with trusted freelance mechanics in seconds.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleStartTour}
              className="w-full h-14 bg-turbo-orange hover:bg-turbo-orange/90 text-midnight font-black uppercase tracking-[0.15em] text-xs rounded-2xl shadow-xl shadow-turbo-orange/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Take a tour
            </Button>

            <button
              onClick={handleFinishTour}
              className="w-full text-[11px] font-bold text-muted-foreground hover:text-foreground py-2 transition-colors uppercase tracking-wider"
            >
              Skip this short tour
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Completion Card ("You're all set!")
  if (phase === "completed") {
    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-5 animate-in fade-in duration-300">
        <div 
          className="absolute inset-0 bg-midnight/85 backdrop-blur-sm"
          onClick={() => setPhase("role_selection")}
        />
        
        <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-turbo-orange/10 blur-3xl rounded-full pointer-events-none" />

          <div className="relative w-24 h-24 mx-auto mb-5 z-10 group">
            <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-2xl shadow-turbo-orange/20 border border-white/10 group-hover:scale-105 transition-transform">
              <img 
                src="/mascot-animated.gif" 
                alt="TaraFix Mascot" 
                className="w-full h-full object-cover" 
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-midnight shadow-lg">
              <MaterialIcon name="check" className="text-sm font-black" />
            </div>
          </div>

          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 inline-block mb-3 relative z-10">
            Tour Complete
          </span>

          <h3 className="text-2xl font-black text-foreground uppercase italic tracking-tight mb-2 relative z-10">
            You're all set!
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-8 max-w-[250px] mx-auto relative z-10">
            You're ready to find, book, and chat with trusted freelance mechanics across the Philippines.
          </p>

          <div className="space-y-3 relative z-10">
            <Button
              onClick={() => setPhase("role_selection")}
              className="w-full h-14 bg-turbo-orange hover:bg-turbo-orange/90 text-midnight font-black uppercase tracking-[0.15em] text-xs rounded-2xl shadow-xl shadow-turbo-orange/20 hover:scale-[1.02] active:scale-95 transition-all gap-2"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Role Selection Modal ("Who Are You?")
  if (phase === "role_selection") {
    const handleSelectRole = (role: "car_owner" | "mechanic") => {
      localStorage.setItem("tarafix_user_role", role);
      handleFinishTour();
      window.dispatchEvent(new Event("tarafix_role_changed"));
    };

    return (
      <div className="fixed inset-0 z-[3000] flex items-center justify-center p-5 animate-in fade-in duration-300">
        <div 
          className="absolute inset-0 bg-midnight/85 backdrop-blur-sm"
          onClick={handleFinishTour}
        />

        <div className="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2.5rem] p-7 text-center shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-turbo-orange/10 blur-3xl rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-electric-blue/10 blur-3xl rounded-full pointer-events-none" />

          <span className="text-[9px] font-black uppercase tracking-[0.3em] bg-white/5 text-white/50 px-3 py-1 rounded-full border border-white/5 inline-block mb-3">
            Personalize Experience
          </span>

          <h3 className="text-xl font-black text-foreground uppercase italic tracking-tight mb-2">
            How will you use Tara<span className="text-electric-blue">Fix</span>?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-6 max-w-[240px] mx-auto">
            Choose your role to tailor your dashboard and features.
          </p>

          <div className="space-y-3.5 mb-5">
            {/* Car Owner Option */}
            <button
              onClick={() => handleSelectRole("car_owner")}
              className="w-full text-left p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-turbo-orange/50 hover:bg-turbo-orange/5 transition-all group cursor-pointer flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-turbo-orange/10 border border-turbo-orange/20 flex items-center justify-center text-turbo-orange text-2xl shrink-0 group-hover:scale-110 transition-transform">
                <MaterialIcon name="directions_car" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wide group-hover:text-turbo-orange transition-colors">
                  I'm a Car Owner
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                  I need on-demand repairs, checkups, and roadside assistance.
                </p>
              </div>
            </button>

            {/* Freelance Mechanic Option */}
            <button
              onClick={() => handleSelectRole("mechanic")}
              className="w-full text-left p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-electric-blue/50 hover:bg-electric-blue/5 transition-all group cursor-pointer flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-electric-blue/10 border border-electric-blue/20 flex items-center justify-center text-electric-blue text-2xl shrink-0 group-hover:scale-110 transition-transform">
                <MaterialIcon name="handyman" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-foreground uppercase tracking-wide group-hover:text-electric-blue transition-colors">
                  I'm a Freelance Mechanic
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">
                  I want to offer automotive services and accept client requests.
                </p>
              </div>
            </button>
          </div>

          <p className="text-[9px] text-white/30 uppercase tracking-widest font-black">
            You can change your role anytime in Profile
          </p>
        </div>
      </div>
    );
  }

  // 2. Interactive Spotlight Step
  const step = TOUR_STEPS[currentStepIndex];
  const isLast = currentStepIndex === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[3000] pointer-events-none">
      {/* SVG Cutout Mask for exact target spotlight */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="24"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(2, 6, 23, 0.85)"
          mask="url(#spotlight-mask)"
          onClick={handleFinishTour}
        />
      </svg>

      {/* Target Pulsing Highlight Border */}
      {targetRect && (
        <div
          className="absolute rounded-[1.8rem] border-2 border-turbo-orange shadow-[0_0_30px_rgba(255,95,0,0.5)] pointer-events-none transition-all duration-300 animate-pulse"
          style={{
            top: `${targetRect.top - 8}px`,
            left: `${targetRect.left - 8}px`,
            width: `${targetRect.width + 16}px`,
            height: `${targetRect.height + 16}px`,
          }}
        />
      )}

      {/* Floating Tooltip Card */}
      <div
        className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-2.5rem)] max-w-sm pointer-events-auto transition-all duration-300 z-[3010]"
        style={{
          top: targetRect
            ? (targetRect.top > window.innerHeight - 150
                // Target is at bottom of screen (e.g. mobile bottom nav) -> position card cleanly above it
                ? `${Math.max(16, targetRect.top - 250)}px`
                : targetRect.top < 120 
                // Target is at top of screen -> position card below it
                ? `${targetRect.bottom + 16}px` 
                : step.position === "bottom"
                ? `${Math.min(window.innerHeight - 260, targetRect.bottom + 16)}px`
                : `${Math.max(16, targetRect.top - 240)}px`)
            : "50%",
          transform: targetRect ? "translateX(-50%)" : "translate(-50%, -50%)",
        }}
      >
        <div className="bg-slate-900/95 border border-white/15 rounded-3xl p-6 shadow-2xl backdrop-blur-xl relative">
          <button
            onClick={handleFinishTour}
            className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <span className="text-[8px] font-black uppercase tracking-[0.25em] bg-turbo-orange/10 text-turbo-orange border border-turbo-orange/20 px-2.5 py-0.5 rounded-full inline-block mb-2">
            {step.badge}
          </span>

          <h4 className="text-base font-black text-foreground uppercase italic tracking-tight mb-1.5">
            {step.title}
          </h4>

          <p className="text-xs text-muted-foreground leading-relaxed mb-6">
            {step.description}
          </p>

          {/* Bottom Controls */}
          <div className="flex items-center gap-3">
            {currentStepIndex > 0 && (
              <Button
                variant="ghost"
                onClick={handlePrevStep}
                className="h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-foreground text-xs font-bold uppercase tracking-wider hover:bg-white/10"
              >
                Back
              </Button>
            )}

            <Button
              onClick={handleNextStep}
              className="flex-1 h-12 bg-turbo-orange hover:bg-turbo-orange/90 text-midnight text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-turbo-orange/20 gap-2"
            >
              <span>{isLast ? "Done" : "Next"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}


