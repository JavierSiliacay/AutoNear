"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Download, 
  FileText,
  Loader2,
  Check,
  Maximize, 
  Minimize,
  Info,
  Shield,
  Settings,
  Users,
  Database
} from "lucide-react";
import FlowchartEditor from "@/components/flowchart/FlowchartEditor";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function FlowchartPage() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const legendItems = [
    { icon: Users, label: "User Journey", color: "#ce524a", desc: "User interactions and interface flow" },
    { icon: Settings, label: "Admin Governance", color: "#7c3aed", desc: "Administrative controls and system management" },
    { icon: Shield, label: "Security Gates", color: "#ea580c", desc: "Authentication and authorization checkpoints" },
    { icon: Database, label: "Infrastructure", color: "#475569", desc: "Cloud services and database interactions" },
  ];

  const handleExportPDF = async () => {
    const input = document.getElementById('flowchart-container');
    if (!input) return;

    try {
      setIsExporting(true);
      
      // Select the flowchart container, excluding current UI elements like the generate button or panels
      const canvas = await html2canvas(input, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#0f0f0f',
        logging: false,
        ignoreElements: (element) => {
          return element.classList.contains('react-flow__controls') || 
                 element.classList.contains('react-flow__panel');
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save('tarafix-system-architecture.pdf');
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#0f0f0f] text-white flex flex-col transition-all duration-300 ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Navigation Header */}
      <header className="border-b border-white/10 bg-[#171717]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-2 hover:bg-white/5 rounded-full transition-colors group"
              title="Back to Home"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                System Architecture Flow
              </h1>
              <p className="text-xs text-white/40">Technical Blueprint & Protocol Mapping</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={handleExportPDF}
              disabled={isExporting}
              className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                exportSuccess 
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" 
                  : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
              }`}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : exportSuccess ? (
                <Check className="w-4 h-4" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {isExporting ? "Generating..." : exportSuccess ? "PDF Saved!" : "Export PDF"}
              </span>
            </button>

            <button 
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-all"
            >
              {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              <span className="hidden sm:inline">{isFullScreen ? "Exit Fullscreen" : "Fullscreen"}</span>
            </button>
            
            <a 
              href="/flowchart/system-flow.svg" 
              download="tarafix-system-flow.svg"
              className="flex items-center gap-2 px-4 py-2 bg-white text-black hover:bg-white/90 rounded-lg text-sm font-bold transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Legacy SVG</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 relative group bg-[#0f0f0f]">
        <div className="absolute inset-0 p-4 md:p-8">
          <FlowchartEditor />
        </div>

        {/* Legend Overlay */}
        <div className={`absolute bottom-12 right-12 max-w-xs bg-[#171717]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transition-all duration-500 transform ${isFullScreen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'}`}>
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-white/60" />
            <h3 className="font-bold text-sm tracking-widest uppercase text-white/80">Blueprint Legend</h3>
          </div>
          <div className="space-y-4">
            {legendItems.map((item) => (
              <div key={item.label} className="flex gap-4 group/item">
                <div 
                  className="w-1 rounded-full shrink-0 transition-all group-hover/item:h-auto"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <item.icon className="w-3.5 h-3.5" style={{ color: item.color }} />
                    <span className="text-sm font-bold">{item.label}</span>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest text-white/60 border border-white/5">
            Use mouse wheel to zoom • Drag to pan • Hover nodes for details
          </div>
        </div>
      </main>

      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
        
        .react-flow__handle {
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border: 2px solid #0f172a;
        }
        .react-flow__node {
          cursor: grab;
        }
        .react-flow__node:active {
          cursor: grabbing;
        }
        .react-flow__edge-path {
          stroke: #475569;
          stroke-width: 2;
        }
        .react-flow__controls-button {
          background: #1e293b !important;
          border-bottom: 1px solid #334155 !important;
          fill: #f8fafc !important;
        }
        .react-flow__controls-button:hover {
          background: #334155 !important;
        }
      `}</style>
    </div>
  );
}
