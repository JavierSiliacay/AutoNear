'use client';

import { useState, useEffect } from 'react';
import { MaterialIcon } from '@/components/material-icon';
import { 
    getShopRequests, 
    getMechanicRequests, 
    getMechanics, 
    updateShopRequestStatus, 
    updateMechanicRequestStatus, 
    getMechanicStats, 
    revokeMechanicAccess, 
    revokeUserAccess,
    sendAdminMechanicNotice, 
    getCustomerReports, 
    updateCustomerReportStatus,
    getBannedUsers,
    unbanUser
} from '@/lib/actions';
import type { ShopRequest, MechanicRequest, Mechanic, CustomerReport, BannedUser } from '@/lib/types';

export function AdminQueue({ adminEmail }: { adminEmail: string }) {
    const [shopRequests, setShopRequests] = useState<ShopRequest[]>([]);
    const [mechanicRequests, setMechanicRequests] = useState<MechanicRequest[]>([]);
    const [allMechanics, setAllMechanics] = useState<Mechanic[]>([]);
    const [customerReports, setCustomerReports] = useState<CustomerReport[]>([]);
    const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
    const [activeTab, setActiveTab] = useState<'stats' | 'mechanics' | 'reports' | 'banned'>('stats');
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(null);

    // Complaint Moderation Quick-Action State
    const [selectedReport, setSelectedReport] = useState<CustomerReport | null>(null);
    const [showReportActionModal, setShowReportActionModal] = useState(false);
    const [warningNoticeText, setWarningNoticeText] = useState('');
    const [isProcessingReportAction, setIsProcessingReportAction] = useState(false);
    const [unbanningEmail, setUnbanningEmail] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        const [requests, mechanics, reports, banned] = await Promise.all([
            getMechanicRequests(),
            getMechanics(),
            getCustomerReports(),
            getBannedUsers()
        ]);
        setMechanicRequests(requests as MechanicRequest[]);
        setAllMechanics(mechanics);
        setCustomerReports(reports);
        setBannedUsers(banned);
        setIsLoading(false);
    }

    async function handleMechanicAction(requestId: string, status: 'approved' | 'rejected') {
        setProcessingId(requestId);
        const result = await updateMechanicRequestStatus(requestId, status);
        if (result.success) {
            loadData();
        } else {
            alert(result.error);
        }
        setProcessingId(null);
    }

    const pendingMechanicRequests = mechanicRequests.filter(r => r.status === 'pending');
    const pendingReports = customerReports.filter(r => r.status === 'pending');
    
    // Calculate Stats
    const totalEarningsEst = allMechanics.length * 12500; // Placeholder for simulated ecosystem value
    const avgRating = allMechanics.length > 0 ? (allMechanics.reduce((acc, m) => acc + m.rating, 0) / allMechanics.length).toFixed(1) : "0.0";
    const topMechanic = allMechanics.length > 0 ? allMechanics[0] : null;

    return (
        <div className="flex flex-col gap-8">
            {/* Tab Navigation */}
            <div className="flex flex-col items-center gap-6">
                <div className="flex flex-wrap justify-center bg-midnight/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-xl gap-1">
                    <button
                        onClick={() => setActiveTab('stats')}
                        className={`px-6 sm:px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${activeTab === 'stats'
                            ? 'bg-turbo-orange text-midnight shadow-lg shadow-turbo-orange/20'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Platform Stats
                    </button>
                    <button
                        onClick={() => setActiveTab('mechanics')}
                        className={`px-6 sm:px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'mechanics'
                            ? 'bg-turbo-orange text-midnight shadow-lg shadow-turbo-orange/20'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <span>Approvals</span>
                        {pendingMechanicRequests.length > 0 && (
                            <span className="w-5 h-5 rounded-full bg-electric-blue text-midnight text-[9px] font-black flex items-center justify-center">
                                {pendingMechanicRequests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-6 sm:px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'reports'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                            : 'text-muted-foreground hover:text-red-400'
                            }`}
                    >
                        <MaterialIcon name="flag" className="text-sm" />
                        <span>Complaints & Reports</span>
                        {pendingReports.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black animate-pulse">
                                {pendingReports.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('banned')}
                        className={`px-6 sm:px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'banned'
                            ? 'bg-red-700 text-white shadow-lg shadow-red-700/30'
                            : 'text-muted-foreground hover:text-red-400'
                            }`}
                    >
                        <MaterialIcon name="block" className="text-sm" />
                        <span>Banned Users</span>
                        {bannedUsers.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 text-[9px] font-black border border-red-500/30">
                                {bannedUsers.length}
                            </span>
                        )}
                    </button>
                </div>

                <div className="text-center">
                    <h2 className="text-3xl font-black text-foreground uppercase tracking-tight">
                        {activeTab === 'stats' ? 'Mechanic Ecosystem' : activeTab === 'mechanics' ? 'Mechanic Approval Queue' : activeTab === 'reports' ? 'Customer Complaints & Reports Hub' : 'Suspended & Banned Users Registry'}
                    </h2>
                    <p className="text-[10px] font-black text-turbo-orange uppercase tracking-[0.3em] mt-2">Administrative Dashboard</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <div className="w-10 h-10 border-4 border-turbo-orange border-t-transparent rounded-full animate-spin" />
                </div>
            ) : activeTab === 'stats' ? (
                // STATISTICS VIEW
                <div className="flex flex-col gap-8 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="glass-card rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border-white/5 flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-16 h-16 bg-turbo-orange/10 rounded-2xl flex items-center justify-center text-turbo-orange mb-4">
                                <MaterialIcon name="engineering" className="text-2xl sm:text-3xl" />
                            </div>
                            <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter leading-none">{allMechanics.length}</h3>
                            <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Total Mechanics</p>
                        </div>

                        <div className="glass-card rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border-white/5 flex flex-col items-center text-center">
                            <div className="w-12 h-12 sm:w-16 h-16 bg-electric-blue/10 rounded-2xl flex items-center justify-center text-electric-blue mb-4">
                                <MaterialIcon name="pending_actions" className="text-2xl sm:text-3xl" />
                            </div>
                            <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter leading-none">{pendingMechanicRequests.length}</h3>
                            <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Pending Review</p>
                        </div>

                        <div className="glass-card rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 border-white/5 flex flex-col items-center text-center sm:col-span-2 lg:col-span-1">
                            <div className="w-12 h-12 sm:w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mb-4">
                                <MaterialIcon name="star" className="text-2xl sm:text-3xl" filled />
                            </div>
                            <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tighter leading-none">{avgRating}</h3>
                            <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-2">Avg Platform Rating</p>
                        </div>
                    </div>

                    {/* MECHANICS PERFORMANCE LIST */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                        {/* Mechanics List */}
                        <div className="lg:col-span-1 glass-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 border-white/5 h-[400px] lg:h-[600px] flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-base sm:text-lg font-black text-foreground uppercase tracking-tight italic">Platform Mechanics</h4>
                                <MaterialIcon name="groups" className="text-turbo-orange text-xl sm:text-2xl" />
                            </div>
                            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                                {allMechanics.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setSelectedMechanicId(m.id)}
                                        className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left ${
                                            selectedMechanicId === m.id 
                                            ? 'bg-turbo-orange/10 border-turbo-orange/30 shadow-[0_0_20px_rgba(255,95,0,0.1)]' 
                                            : 'bg-midnight/30 border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-midnight border border-white/10 overflow-hidden shrink-0">
                                            {m.image_url ? (
                                                <img src={m.image_url} alt={m.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-turbo-orange text-sm font-black uppercase">{m.name.charAt(0)}</div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-[13px] font-black text-foreground uppercase truncate tracking-tight">{m.name}</h5>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${m.is_available ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{m.city}</span>
                                            </div>
                                        </div>
                                        <MaterialIcon name="chevron_right" className={`text-xl ${selectedMechanicId === m.id ? 'text-turbo-orange' : 'text-white/10'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Performance Panel */}
                        <div className="lg:col-span-2">
                                {selectedMechanicId ? (
                                <PerformancePanel 
                                    mechanicId={selectedMechanicId} 
                                    mechanic={allMechanics.find(m => m.id === selectedMechanicId)!} 
                                    onRevokeSuccess={() => {
                                        setSelectedMechanicId(null);
                                        loadData();
                                    }}
                                />
                            ) : (
                                <div className="glass-card rounded-[2rem] sm:rounded-[3rem] p-8 border-white/5 border-dashed flex flex-col items-center justify-center h-[300px] lg:h-full text-center">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 rounded-full flex items-center justify-center text-white/20 mb-4 animate-pulse">
                                        <MaterialIcon name="analytics" className="text-3xl sm:text-4xl" />
                                    </div>
                                    <h5 className="text-[11px] sm:text-sm font-black text-muted-foreground uppercase tracking-widest">Select a mechanic<br/>to view performance</h5>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : activeTab === 'mechanics' ? (
                // MECHANIC REGISTRATION VIEW
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingMechanicRequests.length === 0 ? (
                        <div className="glass-card rounded-2xl p-10 text-center border-dashed border-foreground/10 col-span-full">
                            <MaterialIcon name="verified" className="text-4xl text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">Queue is clear</p>
                        </div>
                    ) : (
                        pendingMechanicRequests.map((req) => (
                            <div key={req.id} className="glass-card rounded-3xl p-6 border-white/5 animate-in slide-in-from-bottom-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{req.full_name}</h3>
                                        <p className="text-xs font-bold text-turbo-orange uppercase tracking-widest mt-0.5">{req.experience_years} Years Experience</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Submitted</p>
                                        <p className="text-[10px] text-foreground font-bold">{new Date(req.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="grid gap-3 mb-6">
                                    <div className="flex items-start gap-3 p-3 bg-midnight/40 rounded-xl border border-white/5">
                                        <MaterialIcon name="email" className="text-sm text-turbo-orange mt-0.5" />
                                        <p className="text-xs text-muted-foreground leading-relaxed">{req.email}</p>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-midnight/40 rounded-xl border border-white/5">
                                        <MaterialIcon name="contact_phone" className="text-sm text-turbo-orange" />
                                        <p className="text-xs text-muted-foreground">{req.contact_number}</p>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 bg-midnight/40 rounded-xl border border-white/5">
                                        <MaterialIcon name="build" className="text-sm text-turbo-orange" />
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase">{req.specializations.join(', ')}</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <a
                                        href={`https://www.google.com/maps?q=${req.google_maps_pin_lat},${req.google_maps_pin_lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="h-12 glass border border-electric-blue/30 text-electric-blue text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:bg-electric-blue/10 transition-all"
                                    >
                                        <MaterialIcon name="location_on" className="text-sm" />
                                        View Service Base
                                    </a>

                                    <div className="flex gap-3 mt-2">
                                        <button
                                            disabled={!!processingId}
                                            onClick={() => handleMechanicAction(req.id, 'approved')}
                                            className="flex-1 h-12 bg-green-500 text-midnight text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50"
                                        >
                                            {processingId === req.id ? (
                                                <div className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <MaterialIcon name="check" className="text-sm" />
                                                    Approve
                                                </>
                                            )}
                                        </button>
                                        <button
                                            disabled={!!processingId}
                                            onClick={() => handleMechanicAction(req.id, 'rejected')}
                                            className="flex-1 h-12 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 hover:bg-red-500/20 disabled:opacity-50"
                                        >
                                            <MaterialIcon name="close" className="text-sm" />
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : activeTab === 'reports' ? (
                // CUSTOMER COMPLAINTS & REPORTS VIEW
                <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-foreground uppercase tracking-tight italic">
                                Active Customer Complaints
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium">
                                Review reported technicians, issue direct disciplinary warnings, or revoke marketplace access.
                            </p>
                        </div>
                        <button
                            onClick={loadData}
                            className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-white flex items-center gap-1.5 cursor-pointer"
                        >
                            <MaterialIcon name="refresh" className="text-sm" />
                            Refresh
                        </button>
                    </div>

                    {customerReports.length === 0 ? (
                        <div className="glass-card rounded-[2.5rem] p-12 text-center border-dashed border-foreground/10">
                            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mx-auto mb-4 border border-green-500/20">
                                <MaterialIcon name="verified_user" className="text-3xl" />
                            </div>
                            <h4 className="text-lg font-black text-foreground uppercase tracking-tight">No Complaints Filed</h4>
                            <p className="text-xs text-muted-foreground mt-1">Platform service quality is in optimal standing with 0 active customer reports.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {customerReports.map((report) => (
                                <div 
                                    key={report.id} 
                                    className={`glass-card rounded-[2rem] p-6 border transition-all ${
                                        report.status === 'pending'
                                            ? 'border-red-500/30 shadow-[0_0_25px_rgba(239,68,68,0.15)] bg-slate-900/90'
                                            : 'border-white/5 bg-midnight/40 opacity-70'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border inline-block ${
                                                    report.status === 'pending' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                                                    report.status === 'warned' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                                    report.status === 'revoked' ? 'bg-red-900/30 text-red-500 border-red-500/40' :
                                                    'bg-white/5 text-muted-foreground border-white/10'
                                                }`}>
                                                    Status: {report.status.toUpperCase()}
                                                </span>
                                                <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border inline-block ${
                                                    report.reporter_role === 'mechanic' ? 'bg-electric-blue/15 text-electric-blue border-electric-blue/30' : 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                                                }`}>
                                                    {report.reporter_role === 'mechanic' ? '🔧 FILED BY MECHANIC' : '🚗 FILED BY CUSTOMER'}
                                                </span>
                                            </div>
                                            <h4 className="text-base font-black text-white uppercase italic tracking-tight">
                                                {report.reason_category.replace(/_/g, ' ')}
                                            </h4>
                                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                                {report.reporter_role === 'mechanic' 
                                                    ? <>Reporter Mechanic: <strong className="text-foreground">{report.mechanic_name}</strong> ({report.mechanic_email})</>
                                                    : <>Reporter Customer: <strong className="text-foreground">{report.customer_name}</strong> ({report.customer_email})</>}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[8px] font-mono text-muted-foreground block">
                                                {new Date(report.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="text-[8px] font-mono text-muted-foreground block">
                                                {new Date(report.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Reported Entity Target Box */}
                                    <div className="p-3.5 bg-midnight/70 rounded-2xl border border-white/5 mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                                                report.reporter_role === 'mechanic' 
                                                    ? 'bg-purple-500/15 text-purple-400 border-purple-500/30' 
                                                    : 'bg-turbo-orange/15 text-turbo-orange border-turbo-orange/30'
                                            }`}>
                                                <MaterialIcon name={report.reporter_role === 'mechanic' ? "person" : "engineering"} className="text-xl" />
                                            </div>
                                            <div>
                                                <span className={`text-[8px] font-black uppercase tracking-widest block ${
                                                    report.reporter_role === 'mechanic' ? 'text-purple-400' : 'text-turbo-orange'
                                                }`}>
                                                    {report.reporter_role === 'mechanic' ? 'Reported Car Owner / Account' : 'Reported Technician'}
                                                </span>
                                                <h5 className="text-xs font-black text-foreground uppercase italic truncate">
                                                    {report.reporter_role === 'mechanic' ? (report.customer_name || 'Car Owner') : (report.mechanic_name || 'Technician')}
                                                </h5>
                                                <p className="text-[9px] font-mono text-muted-foreground truncate">
                                                    {report.reporter_role === 'mechanic' ? report.customer_email : report.mechanic_email}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Full Customer Booking Information Profile */}
                                    <div className="p-3.5 bg-midnight/40 rounded-2xl border border-white/5 mb-3 text-left space-y-2">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-electric-blue block">
                                            📋 Customer Booking & Vehicle Data
                                        </span>
                                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div className="bg-background/40 p-2 rounded-xl border border-white/5">
                                                <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block">Customer Phone:</span>
                                                <span className="font-mono text-foreground font-bold">{report.customer_phone || 'N/A'}</span>
                                            </div>
                                            <div className="bg-background/40 p-2 rounded-xl border border-white/5">
                                                <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block">Vehicle Info:</span>
                                                <span className="text-foreground font-bold">{report.vehicle_info || 'N/A'}</span>
                                            </div>
                                            <div className="bg-background/40 p-2 rounded-xl border border-white/5">
                                                <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block">Service Requested:</span>
                                                <span className="text-foreground font-bold">{report.service_type || 'General Service'}</span>
                                            </div>
                                            <div className="bg-background/40 p-2 rounded-xl border border-white/5">
                                                <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block">Preference / Mode:</span>
                                                <span className="text-turbo-orange font-bold uppercase">{report.service_preference || 'Standard'}</span>
                                            </div>
                                            {report.scheduled_date && (
                                                <div className="bg-background/40 p-2 rounded-xl border border-white/5 col-span-2">
                                                    <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block">Scheduled Date:</span>
                                                    <span className="text-white font-bold">{new Date(report.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                </div>
                                            )}
                                            {report.booking_message && (
                                                <div className="bg-background/40 p-2 rounded-xl border border-white/5 col-span-2">
                                                    <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block">Booking Notes:</span>
                                                    <span className="text-muted-foreground italic font-medium">"{report.booking_message}"</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Complaint Statement Details */}
                                    <div className="p-4 bg-background/50 rounded-2xl border border-red-500/20 mb-5 text-left">
                                        <span className="text-[8px] font-black uppercase tracking-widest text-red-400 block mb-1">
                                            {report.reporter_role === 'mechanic' ? 'Mechanic Incident Report Statement:' : 'Customer Complaint Statement:'}
                                        </span>
                                        <p className="text-xs text-foreground font-medium leading-relaxed italic">
                                            "{report.description}"
                                        </p>
                                    </div>

                                    {/* Admin Action Buttons */}
                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                                        <button
                                            onClick={() => {
                                                setSelectedReport(report);
                                                const targetName = report.reporter_role === 'mechanic' ? report.customer_name : report.mechanic_name;
                                                const defaultMsg = report.reporter_role === 'mechanic'
                                                    ? `OFFICIAL WARNING: An incident report (${report.reason_category.replace(/_/g, ' ')}) was filed regarding your recent booking with technician ${report.mechanic_name}: "${report.description}". Please refrain from fake bookings or payment violations.`
                                                    : `OFFICIAL WARNING: A customer complaint (${report.reason_category.replace(/_/g, ' ')}) was filed regarding service request #${report.request_id ? report.request_id.substring(0, 8) : 'N/A'}: "${report.description}". Please maintain professional standards.`;
                                                setWarningNoticeText(defaultMsg);
                                                setShowReportActionModal(true);
                                            }}
                                            className="flex-1 h-11 bg-turbo-orange hover:opacity-90 active:scale-95 text-midnight text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                                        >
                                            <MaterialIcon name="warning" className="text-sm" />
                                            <span>Issue Warning</span>
                                        </button>

                                        <button
                                            onClick={async () => {
                                                const isMechanicReport = report.reporter_role === 'mechanic';
                                                const targetName = isMechanicReport ? (report.customer_name || 'Car Owner') : (report.mechanic_name || 'Technician');
                                                const targetEmail = isMechanicReport ? report.customer_email : report.mechanic_email;

                                                if (!targetEmail) return;

                                                if (confirm(`Revoke platform access and ban ${targetName} (${targetEmail})?`)) {
                                                    setIsLoading(true);
                                                    await revokeUserAccess({
                                                        email: targetEmail,
                                                        role: isMechanicReport ? 'customer' : 'mechanic',
                                                        mechanicId: isMechanicReport ? null : report.mechanic_id,
                                                        reason: `Revoked by Admin due to verified incident report: ${report.description}`
                                                    });
                                                    await updateCustomerReportStatus(report.id, 'revoked', `Admin revoked access for ${targetName}.`);
                                                    alert(`Access successfully revoked and account suspended for ${targetName}!`);
                                                    loadData();
                                                }
                                            }}
                                            className="h-11 px-3 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                                            title="Revoke and ban user from platform"
                                        >
                                            <MaterialIcon name="no_accounts" className="text-sm" />
                                            <span>Revoke</span>
                                        </button>

                                        {report.status === 'pending' && (
                                            <button
                                                onClick={async () => {
                                                    await updateCustomerReportStatus(report.id, 'dismissed', 'Dismissed by admin after review.');
                                                    loadData();
                                                }}
                                                className="h-11 px-3 glass hover:bg-white/5 text-muted-foreground hover:text-foreground border border-white/10 text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                                            >
                                                <MaterialIcon name="check" className="text-sm" />
                                                Dismiss
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                // BANNED & SUSPENDED USERS REGISTRY VIEW
                <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight">Suspended Accounts</h3>
                            <p className="text-xs text-muted-foreground font-medium">Banned car owners & accounts restricted from creating bookings</p>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-red-500/15 text-red-400 rounded-full border border-red-500/30">
                            {bannedUsers.length} Total Banned
                        </span>
                    </div>

                    {bannedUsers.length === 0 ? (
                        <div className="glass-card rounded-3xl p-12 text-center border-dashed border-white/10">
                            <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-400 mx-auto mb-4 border border-green-500/20">
                                <MaterialIcon name="verified_user" className="text-3xl" />
                            </div>
                            <h4 className="text-lg font-black text-white uppercase italic tracking-tight mb-1">No Suspended Accounts</h4>
                            <p className="text-xs text-muted-foreground font-medium">All platform users and car owners are currently in good standing.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {bannedUsers.map((banned) => (
                                <div key={banned.id} className="glass-card rounded-3xl p-6 border border-red-500/30 bg-red-950/10 flex flex-col justify-between shadow-xl">
                                    <div>
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/40">
                                                    <MaterialIcon name="block" className="text-xl" />
                                                </div>
                                                <div>
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-red-400 block">
                                                        Banned Account
                                                    </span>
                                                    <h4 className="text-sm font-black text-white font-mono truncate">
                                                        {banned.email}
                                                    </h4>
                                                </div>
                                            </div>
                                            <span className="text-[8px] font-mono text-muted-foreground">
                                                {new Date(banned.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {/* Ban Reason Statement */}
                                        <div className="p-3 bg-midnight/80 rounded-2xl border border-white/5 mb-4 text-left">
                                            <span className="text-[8px] font-black uppercase tracking-wider text-muted-foreground block mb-1">
                                                Suspension Reason:
                                            </span>
                                            <p className="text-xs text-foreground italic font-medium leading-relaxed">
                                                "{banned.reason}"
                                            </p>
                                            <span className="text-[8px] text-muted-foreground block mt-2 font-mono">
                                                Banned by: {banned.banned_by}
                                            </span>
                                        </div>
                                    </div>

                                    {/* 1-Click Unban CTA */}
                                    <button
                                        onClick={async () => {
                                            if (confirm(`Unban and restore platform access for ${banned.email}?`)) {
                                                setUnbanningEmail(banned.email);
                                                const res = await unbanUser(banned.email);
                                                if (res.success) {
                                                    alert(`Account ${banned.email} has been restored!`);
                                                    loadData();
                                                } else {
                                                    alert(res.error || "Failed to unban user.");
                                                }
                                                setUnbanningEmail(null);
                                            }
                                        }}
                                        disabled={unbanningEmail === banned.email}
                                        className="w-full h-11 bg-green-500/15 hover:bg-green-500 text-green-400 hover:text-white border border-green-500/30 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                    >
                                        {unbanningEmail === banned.email ? (
                                            <>
                                                <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                Restoring Access...
                                            </>
                                        ) : (
                                            <>
                                                <MaterialIcon name="lock_open" className="text-sm" />
                                                <span>Unban & Restore Access</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Quick Warning Notice Sender Modal from Complaint Queue */}
            {showReportActionModal && selectedReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/85 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-lg glass-card border border-turbo-orange/30 rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-midnight shadow-2xl relative">
                        <div className="w-16 h-16 rounded-2xl bg-turbo-orange/15 border border-turbo-orange/30 text-turbo-orange flex items-center justify-center mx-auto mb-4">
                            <MaterialIcon name="campaign" className="text-3xl" />
                        </div>
                        <div className="text-center mb-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-turbo-orange bg-turbo-orange/10 px-3 py-1 rounded-full border border-turbo-orange/20 inline-block mb-2">
                                Direct Disciplinary Action
                            </span>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-1">
                                Send Warning to {selectedReport.reporter_role === 'mechanic' ? (selectedReport.customer_name || 'Car Owner') : selectedReport.mechanic_name}
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                This popup warning will appear on the user's screen the next time they launch TaraFix.
                            </p>
                        </div>

                        <div className="space-y-1.5 mb-6 text-left">
                            <label className="text-[9px] font-black uppercase tracking-widest text-turbo-orange block ml-1">
                                Disciplinary Warning Message *
                            </label>
                            <textarea
                                value={warningNoticeText}
                                onChange={(e) => setWarningNoticeText(e.target.value)}
                                className="w-full min-h-[110px] bg-background/60 border border-white/15 focus:border-turbo-orange focus:ring-1 focus:ring-turbo-orange rounded-xl p-3.5 text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none"
                            />
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={async () => {
                                    if (!warningNoticeText.trim()) return;
                                    setIsProcessingReportAction(true);
                                    const targetEmail = selectedReport.reporter_role === 'mechanic' ? selectedReport.customer_email : selectedReport.mechanic_email;
                                    const targetName = selectedReport.reporter_role === 'mechanic' ? selectedReport.customer_name : selectedReport.mechanic_name;

                                    if (targetEmail) {
                                        await sendAdminMechanicNotice({
                                            mechanicId: selectedReport.reporter_role === 'mechanic' ? '' : (selectedReport.mechanic_id || ''),
                                            mechanicEmail: targetEmail,
                                            title: 'Official Administrator Warning',
                                            message: warningNoticeText,
                                            noticeType: 'warning'
                                        });
                                        await updateCustomerReportStatus(selectedReport.id, 'warned', `Warning issued to ${selectedReport.reporter_role === 'mechanic' ? 'car owner' : 'technician'}.`);
                                        alert(`Warning notice successfully sent to ${targetName}!`);
                                        setShowReportActionModal(false);
                                        loadData();
                                    }
                                    setIsProcessingReportAction(false);
                                }}
                                disabled={isProcessingReportAction || !warningNoticeText.trim()}
                                className="w-full h-13 bg-turbo-orange hover:opacity-90 active:scale-95 text-midnight font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-turbo-orange/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isProcessingReportAction ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                                        Dispatching Warning...
                                    </>
                                ) : (
                                    <>
                                        <MaterialIcon name="send" className="text-sm" />
                                        Send Official Warning & Mark Warned
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowReportActionModal(false)}
                                disabled={isProcessingReportAction}
                                className="w-full h-11 glass border border-white/10 hover:bg-white/5 text-foreground font-black uppercase tracking-widest text-xs rounded-xl transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

function PerformancePanel({ 
    mechanicId, 
    mechanic, 
    onRevokeSuccess 
}: { 
    mechanicId: string
    mechanic: Mechanic
    onRevokeSuccess: () => void 
}) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isRevoking, setIsRevoking] = useState(false);
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [revokeReason, setRevokeReason] = useState("");

    // Admin Reminder / Notice State
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    const [noticeMessage, setNoticeMessage] = useState("");
    const [noticeType, setNoticeType] = useState<'reminder' | 'warning' | 'inactivity' | 'urgent'>('inactivity');
    const [isSendingNotice, setIsSendingNotice] = useState(false);

    const NOTICE_TEMPLATES = [
        {
            label: "Inactivity Notice",
            type: "inactivity" as const,
            text: "YOU'RE INACTIVE: Please update your availability and live GPS base on TaraFix to continue receiving repair service bookings."
        },
        {
            label: "License Renewal",
            type: "reminder" as const,
            text: "DOCUMENT REMINDER: Please ensure your TESDA/mechanic certification is up to date in your profile."
        },
        {
            label: "Quality Warning",
            type: "warning" as const,
            text: "QUALITY NOTICE: Please remember to maintain professional communication and adhere to agreed service arrival times."
        },
        {
            label: "Urgent Update",
            type: "urgent" as const,
            text: "URGENT CONTROL NOTICE: High demand detected in your area! Turn on your availability to accept new incoming bookings."
        }
    ];

    useEffect(() => {
        async function loadStats() {
            setLoading(true);
            const data = await getMechanicStats(mechanicId);
            setStats(data);
            setLoading(false);
        }
        loadStats();
    }, [mechanicId]);

    const handleConfirmRevoke = async () => {
        if (!revokeReason.trim()) {
            alert('Please provide a reason for revoking access so the mechanic understands.');
            return;
        }
        setIsRevoking(true);
        const res = await revokeMechanicAccess(mechanicId, revokeReason);
        if (res.success) {
            setShowRevokeModal(false);
            setRevokeReason("");
            onRevokeSuccess();
        } else {
            alert(res.error || 'Failed to revoke access.');
        }
        setIsRevoking(false);
    };

    const handleSendNotice = async () => {
        if (!noticeMessage.trim()) {
            alert("Please type a reminder message.");
            return;
        }
        setIsSendingNotice(true);
        const res = await sendAdminMechanicNotice({
            mechanicId,
            mechanicEmail: mechanic.email,
            title: noticeType === 'inactivity' ? 'Inactivity Notice' : noticeType === 'warning' ? 'Admin Warning' : 'Admin Reminder',
            message: noticeMessage,
            noticeType
        });
        if (res.success) {
            alert(`Notice successfully sent to ${mechanic.name}. They will see it the next time they open TaraFix!`);
            setShowNoticeModal(false);
            setNoticeMessage("");
        } else {
            alert(res.error || "Failed to send notice.");
        }
        setIsSendingNotice(false);
    };

    if (loading) return (
        <div className="glass-card rounded-[3rem] p-8 border-white/5 h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-turbo-orange border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="glass-card rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 border-white/5 h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 mb-8 sm:mb-10">
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-midnight border-2 border-turbo-orange/40 overflow-hidden shrink-0">
                        {mechanic.image_url ? (
                            <img src={mechanic.image_url} alt={mechanic.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-turbo-orange text-2xl sm:text-3xl font-black">{mechanic.name.charAt(0)}</div>
                        )}
                    </div>
                    <div>
                        <h4 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight italic leading-tight">{mechanic.name}</h4>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-1">
                            <span className="flex items-center gap-1 text-turbo-orange">
                                <MaterialIcon name="star" className="text-xs sm:text-sm" filled />
                                <span className="text-[11px] sm:text-xs font-black">{stats?.avgRating?.toFixed(1) || "5.0"}</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-white/5 px-2 py-0.5 sm:py-1 rounded shrink-0">
                                {mechanic.city}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground truncate max-w-[150px]">
                                {mechanic.email}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="w-full sm:w-auto flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2 border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
                    <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</p>
                    <span className={`px-4 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${mechanic.is_available ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {mechanic.is_available ? 'Available' : 'Unavailable'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
                <StatBox label="Done" value={stats?.completed} color="text-green-500" icon="check_circle" />
                <StatBox label="Pending" value={stats?.pending} color="text-turbo-orange" icon="schedule" />
                <StatBox label="Failed" value={stats?.cancelled} color="text-red-500" icon="cancel" />
                <StatBox label="Active" value={stats?.active} color="text-electric-blue" icon="handyman" />
            </div>

            <div className="flex-1 space-y-4 sm:space-y-6">
                <div className="p-5 sm:p-6 bg-midnight/30 rounded-[1.5rem] sm:rounded-3xl border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest">Efficiency</span>
                        <MaterialIcon name="speed" className="text-turbo-orange text-lg sm:text-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:gap-8">
                        <div>
                            <p className="text-lg sm:text-xl font-black text-foreground tracking-tight">~24 mins</p>
                            <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Response Time</p>
                        </div>
                        <div>
                            <p className="text-lg sm:text-xl font-black text-foreground tracking-tight">{stats?.reviewCount}</p>
                            <p className="text-[8px] sm:text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Feedbacks</p>
                        </div>
                    </div>
                </div>

                <div className="p-5 sm:p-6 bg-midnight/30 rounded-[1.5rem] sm:rounded-3xl border border-white/5 flex items-center justify-between">
                    <div className="min-w-0">
                        <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Last Activity</span>
                        <p className="text-[11px] sm:text-xs font-black text-foreground uppercase tracking-tight italic truncate">
                            {stats?.lastActivity ? new Date(stats.lastActivity).toLocaleString() : 'No recent activity'}
                        </p>
                    </div>
                    <MaterialIcon name="history" className="text-muted-foreground shrink-0" />
                </div>

                {/* Admin Actions: Send Reminder & Revoke Access */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                        onClick={() => {
                            setNoticeMessage("YOU'RE INACTIVE: Please update your availability and live GPS base on TaraFix to continue receiving repair service bookings.");
                            setShowNoticeModal(true);
                        }}
                        className="h-13 rounded-2xl bg-turbo-orange/15 hover:bg-turbo-orange text-turbo-orange hover:text-midnight border border-turbo-orange/30 transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-turbo-orange/10"
                    >
                        <MaterialIcon name="notifications_active" className="text-base" />
                        <span>Send Reminder</span>
                    </button>

                    <button
                        onClick={() => setShowRevokeModal(true)}
                        className="h-13 rounded-2xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 transition-all font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-500/10"
                    >
                        <MaterialIcon name="no_accounts" className="text-base" />
                        <span>Revoke Access</span>
                    </button>
                </div>
            </div>

            {/* Send Reminder / Notice Modal */}
            {showNoticeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/85 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-lg glass-card border border-turbo-orange/30 rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-midnight shadow-2xl relative">
                        <div className="w-16 h-16 rounded-2xl bg-turbo-orange/15 border border-turbo-orange/30 text-turbo-orange flex items-center justify-center mx-auto mb-4">
                            <MaterialIcon name="campaign" className="text-3xl" />
                        </div>
                        <div className="text-center mb-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-turbo-orange bg-turbo-orange/10 px-3 py-1 rounded-full border border-turbo-orange/20 inline-block mb-2">
                                Admin Direct Communication
                            </span>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-1">
                                Send Reminder to Mechanic
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                Recipient: <strong className="text-white">{mechanic.name}</strong> ({mechanic.email})
                            </p>
                        </div>

                        {/* Quick Preset Templates */}
                        <div className="mb-4">
                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                                Quick Preset Templates
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {NOTICE_TEMPLATES.map((tmpl) => (
                                    <button
                                        key={tmpl.label}
                                        type="button"
                                        onClick={() => {
                                            setNoticeMessage(tmpl.text);
                                            setNoticeType(tmpl.type);
                                        }}
                                        className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-turbo-orange/10 hover:border-turbo-orange/30 text-left transition-all text-[10px] font-bold text-foreground truncate cursor-pointer"
                                    >
                                        ⚡ {tmpl.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Notice Message Textarea */}
                        <div className="space-y-1.5 mb-6 text-left">
                            <label className="text-[9px] font-black uppercase tracking-widest text-turbo-orange block ml-1">
                                Notice Message (Appears as popup when mechanic opens TaraFix) *
                            </label>
                            <textarea
                                value={noticeMessage}
                                onChange={(e) => setNoticeMessage(e.target.value)}
                                placeholder="Write what you would like to remind the mechanic..."
                                className="w-full min-h-[110px] bg-background/60 border border-white/15 focus:border-turbo-orange focus:ring-1 focus:ring-turbo-orange rounded-xl p-3.5 text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none"
                            />
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={handleSendNotice}
                                disabled={isSendingNotice || !noticeMessage.trim()}
                                className="w-full h-13 bg-turbo-orange hover:opacity-90 active:scale-95 text-midnight font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-turbo-orange/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isSendingNotice ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
                                        Sending Notice...
                                    </>
                                ) : (
                                    <>
                                        <MaterialIcon name="send" className="text-sm" />
                                        Send Reminder to Mechanic
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setShowNoticeModal(false)}
                                disabled={isSendingNotice}
                                className="w-full h-11 glass border border-white/10 hover:bg-white/5 text-foreground font-black uppercase tracking-widest text-xs rounded-xl transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revoke Confirmation Modal with Reason Input */}
            {showRevokeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight/85 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="w-full max-w-md glass-card border border-red-500/30 rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-b from-slate-900 to-midnight shadow-2xl relative">
                        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto mb-4">
                            <MaterialIcon name="warning" className="text-3xl" />
                        </div>
                        <div className="text-center mb-4">
                            <span className="text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 inline-block mb-2">
                                Admin Action
                            </span>
                            <h3 className="text-xl font-black text-white uppercase italic tracking-tight mb-1">
                                Revoke Mechanic Access?
                            </h3>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                You are about to revoke access for <strong className="text-white">{mechanic.name}</strong> ({mechanic.email}).
                            </p>
                        </div>

                        {/* Reason Input Box */}
                        <div className="space-y-1.5 mb-6 text-left">
                            <label className="text-[9px] font-black uppercase tracking-widest text-red-400 block ml-1">
                                Reason for Revocation (Visible to Mechanic) *
                            </label>
                            <textarea
                                value={revokeReason}
                                onChange={(e) => setRevokeReason(e.target.value)}
                                placeholder="Explain why access is being revoked (e.g. Incomplete credentials, policy violation, customer complaints)..."
                                className="w-full min-h-[90px] bg-background/60 border border-red-500/30 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none resize-none"
                            />
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <button
                                onClick={handleConfirmRevoke}
                                disabled={isRevoking || !revokeReason.trim()}
                                className="w-full h-13 bg-red-500 hover:bg-red-600 active:scale-95 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isRevoking ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Revoking Access...
                                    </>
                                ) : (
                                    <>
                                        <MaterialIcon name="delete_forever" className="text-sm" />
                                        Yes, Revoke Access & Notify
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setShowRevokeModal(false);
                                    setRevokeReason("");
                                }}
                                disabled={isRevoking}
                                className="w-full h-11 glass border border-white/10 hover:bg-white/5 text-foreground font-black uppercase tracking-widest text-xs rounded-xl transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatBox({ label, value, color, icon }: { label: string, value: any, color: string, icon: string }) {
    return (
        <div className="p-4 bg-midnight/30 rounded-2xl border border-white/5 flex flex-col items-center text-center">
            <MaterialIcon name={icon} className={`text-xl ${color} mb-2`} />
            <span className="text-xl font-black text-white leading-none">{value || 0}</span>
            <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-2">{label}</span>
        </div>
    );
}
