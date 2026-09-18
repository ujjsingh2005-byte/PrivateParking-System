"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Layers, Calendar, Crown, ArrowRight, ShieldCheck, Activity, Users, Zap, CheckCircle2, Sparkles } from 'lucide-react';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalZones: 0, totalSlots: 0, totalBookings: 0, totalActiveSubs: 0 });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      return;
    }

    // Role check
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile && profile.role === 'admin') {
      setIsAdmin(true);
      loadStats();
    } else {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    const { count: zoneCount } = await supabase.from('zones').select('*', { count: 'exact', head: true });
    const { count: slotCount } = await supabase.from('parking_slots').select('*', { count: 'exact', head: true });
    const { count: bookingCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });
    const { count: subCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active');

    setStats({
      totalZones: zoneCount || 0,
      totalSlots: slotCount || 0,
      totalBookings: bookingCount || 0,
      totalActiveSubs: subCount || 0
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-xs font-mono tracking-wide">Verifying Master Administrator Privileges...</p>
      </div>
    );
  }
  
  if (!isAdmin) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return <div className="p-12 text-center text-rose-400 font-bold text-xs">Access Denied - Redirecting to public site...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Top Header */}
      <div className="mb-10 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[11px] font-bold uppercase tracking-wider mb-2 font-mono">
          <Activity className="w-3 h-3 text-violet-400" />
          Master Command Center
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">System Telemetry & Controls</h1>
        <p className="text-slate-400 text-xs sm:text-sm">Manage multi-zone capacities, configure subscription tiers, and audit real-time parking reservations.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
        <div className="bg-surface-1 border border-white/[0.08] p-6 rounded-3xl flex flex-col justify-between shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Total Zones</span>
          <span className="text-3xl sm:text-4xl font-black text-white font-mono">{stats.totalZones}</span>
          <span className="text-[10px] text-slate-500 mt-2 font-mono">Active Parking Hubs</span>
        </div>

        <div className="bg-surface-1 border border-white/[0.08] p-6 rounded-3xl flex flex-col justify-between shadow-xl">
          <span className="text-[11px] font-bold text-violet-400 uppercase tracking-wider mb-2 font-mono">Configured Bays</span>
          <span className="text-3xl sm:text-4xl font-black text-violet-300 font-mono">{stats.totalSlots}</span>
          <span className="text-[10px] text-slate-500 mt-2 font-mono">Total Parking Slots</span>
        </div>

        <div className="bg-surface-1 border border-white/[0.08] p-6 rounded-3xl flex flex-col justify-between shadow-xl">
          <span className="text-[11px] font-bold text-lime-400 uppercase tracking-wider mb-2 font-mono">Total Bookings</span>
          <span className="text-3xl sm:text-4xl font-black text-lime-400 font-mono">{stats.totalBookings}</span>
          <span className="text-[10px] text-slate-500 mt-2 font-mono">Confirmed Reservations</span>
        </div>

        <div className="bg-surface-1 border border-white/[0.08] p-6 rounded-3xl flex flex-col justify-between shadow-xl">
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 font-mono">Pro Memberships</span>
          <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">{stats.totalActiveSubs}</span>
          <span className="text-[10px] text-slate-500 mt-2 font-mono">Active Subscribers</span>
        </div>
      </div>

      {/* Management Console Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight">Administrative Modules</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/manage" className="bg-surface-1 hover:bg-surface-2 border border-white/[0.08] hover:border-violet-500/40 p-8 rounded-3xl transition-all duration-300 group flex flex-col justify-between shadow-xl">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-5 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
                Zone & Slot Management
              </h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Create or delete parking zones, adjust hourly or sub pricing rates, and configure individual bay slots.
              </p>
            </div>
            <span className="text-violet-400 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform font-mono uppercase tracking-wider">
              Open Module <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link href="/admin/subscriptions" className="bg-surface-1 hover:bg-surface-2 border border-white/[0.08] hover:border-amber-500/40 p-8 rounded-3xl transition-all duration-300 group flex flex-col justify-between shadow-xl">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-105 transition-transform">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                Subscription Authority
              </h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Activate or deactivate public subscription plans, and toggle active user subscription authorizations.
              </p>
            </div>
            <span className="text-amber-400 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform font-mono uppercase tracking-wider">
              Manage Authority <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link href="/admin/bookings" className="bg-surface-1 hover:bg-surface-2 border border-white/[0.08] hover:border-lime-500/40 p-8 rounded-3xl transition-all duration-300 group flex flex-col justify-between shadow-xl">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-lime-500/15 border border-lime-500/30 flex items-center justify-center text-lime-400 mb-5 group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-lime-300 transition-colors">
                Global Bookings Ledger
              </h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Monitor all user bookings in real-time, inspect entry/exit timestamps, and audit revenue logs.
              </p>
            </div>
            <span className="text-lime-400 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform font-mono uppercase tracking-wider">
              View Ledger <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>

    </div>
  );
}


