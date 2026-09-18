"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Layers, Calendar, Crown, ArrowRight, ShieldCheck, Activity, Users, Zap, CheckCircle2 } from 'lucide-react';

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
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-xs font-mono">Verifying Master Administrator Privileges...</p>
      </div>
    );
  }
  
  if (!isAdmin) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return <div className="p-12 text-center text-red-500 font-bold text-xs">Access Denied - Redirecting to public site...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Top Header */}
      <div className="mb-10 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
          <Activity className="w-3 h-3 text-cyan-400" />
          Master Command Center
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">System Telemetry & Controls</h1>
        <p className="text-slate-400 text-xs sm:text-sm">Manage multi-zone capacities, configure subscription tiers, and audit all reservations.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
        <div className="bg-[#0f172a]/70 border border-white/[0.08] p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Total Zones</span>
          <span className="text-3xl sm:text-4xl font-black text-white font-mono">{stats.totalZones}</span>
          <span className="text-[10px] text-slate-500 mt-2">Active Parking Hubs</span>
        </div>

        <div className="bg-[#0f172a]/70 border border-white/[0.08] p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-2">Configured Bays</span>
          <span className="text-3xl sm:text-4xl font-black text-cyan-300 font-mono">{stats.totalSlots}</span>
          <span className="text-[10px] text-slate-500 mt-2">Total Parking Slots</span>
        </div>

        <div className="bg-[#0f172a]/70 border border-white/[0.08] p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-2">Total Bookings</span>
          <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono">{stats.totalBookings}</span>
          <span className="text-[10px] text-slate-500 mt-2">Confirmed Reservations</span>
        </div>

        <div className="bg-[#0f172a]/70 border border-white/[0.08] p-6 rounded-2xl flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-2">Pro Memberships</span>
          <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">{stats.totalActiveSubs}</span>
          <span className="text-[10px] text-slate-500 mt-2">Active Subscribers</span>
        </div>
      </div>

      {/* Management Console Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight">Administrative Modules</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/manage" className="bg-[#0f172a]/70 hover:bg-[#0f172a] border border-white/[0.08] hover:border-cyan-500/40 p-8 rounded-3xl transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                Zone & Slot Management
              </h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Create or delete parking zones, adjust hourly or sub pricing rates, and configure individual bay slots.
              </p>
            </div>
            <span className="text-cyan-400 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Open Module <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link href="/admin/subscriptions" className="bg-[#0f172a]/70 hover:bg-[#0f172a] border border-white/[0.08] hover:border-amber-500/40 p-8 rounded-3xl transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-105 transition-transform">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-amber-300 transition-colors">
                Subscription Authority
              </h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Activate or deactivate public subscription plans, and toggle active user subscription authorizations.
              </p>
            </div>
            <span className="text-amber-400 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              Manage Authority <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link href="/admin/bookings" className="bg-[#0f172a]/70 hover:bg-[#0f172a] border border-white/[0.08] hover:border-emerald-500/40 p-8 rounded-3xl transition-all duration-300 group flex flex-col justify-between">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                Global Bookings Ledger
              </h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Monitor all user bookings in real-time, inspect entry/exit timestamps, and resolve conflicts.
              </p>
            </div>
            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              View Ledger <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>

    </div>
  );
}

