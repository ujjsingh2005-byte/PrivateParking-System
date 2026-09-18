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
        <div className="h-10 w-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64736C] text-xs font-mono tracking-wide">Verifying Master Administrator Privileges...</p>
      </div>
    );
  }
  
  if (!isAdmin) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return <div className="p-12 text-center text-[#E45757] font-bold text-xs">Access Denied - Redirecting to public site...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Top Header */}
      <div className="mb-10 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ECF4EF] border border-[#DDE5DF] text-[#16A34A] text-[11px] font-bold uppercase tracking-wider mb-2 font-mono">
          <Activity className="w-3.5 h-3.5 text-[#16A34A]" />
          Master Command Center
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#17201D] tracking-tight">System Telemetry & Controls</h1>
        <p className="text-[#64736C] text-xs sm:text-sm">Manage multi-zone capacities, configure subscription tiers, and audit real-time parking reservations.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
        <div className="bg-white border border-[#DDE5DF] p-6 rounded-3xl flex flex-col justify-between shadow-card hover:border-[#16A34A]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#64736C] uppercase tracking-wider font-mono">Total Zones</span>
            <div className="w-8 h-8 rounded-xl bg-[#ECF4EF] text-[#0F766E] flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-[#17201D] font-mono">{stats.totalZones}</span>
          <span className="text-[10px] text-[#94A39B] mt-2 font-mono">Active Parking Hubs</span>
        </div>

        <div className="bg-white border border-[#DDE5DF] p-6 rounded-3xl flex flex-col justify-between shadow-card hover:border-[#16A34A]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider font-mono">Configured Bays</span>
            <div className="w-8 h-8 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-[#16A34A] font-mono">{stats.totalSlots}</span>
          <span className="text-[10px] text-[#94A39B] mt-2 font-mono">Total Parking Slots</span>
        </div>

        <div className="bg-white border border-[#DDE5DF] p-6 rounded-3xl flex flex-col justify-between shadow-card hover:border-[#16A34A]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#0F766E] uppercase tracking-wider font-mono">Total Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-[#E6F4F1] text-[#0F766E] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-[#17201D] font-mono">{stats.totalBookings}</span>
          <span className="text-[10px] text-[#94A39B] mt-2 font-mono">Confirmed Reservations</span>
        </div>

        <div className="bg-white border border-[#DDE5DF] p-6 rounded-3xl flex flex-col justify-between shadow-card hover:border-[#16A34A]/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#D97706] uppercase tracking-wider font-mono">Pro Passes</span>
            <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <span className="text-3xl sm:text-4xl font-black text-[#D97706] font-mono">{stats.totalActiveSubs}</span>
          <span className="text-[10px] text-[#94A39B] mt-2 font-mono">Active Subscribers</span>
        </div>
      </div>

      {/* Management Console Modules */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-[#17201D] tracking-tight">Administrative Modules</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/manage" className="bg-white hover:bg-[#FAF9F6] border border-[#DDE5DF] hover:border-[#16A34A]/50 p-8 rounded-3xl transition-all duration-300 group flex flex-col justify-between shadow-card">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] mb-5 group-hover:scale-105 transition-transform">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#17201D] mb-2 group-hover:text-[#16A34A] transition-colors">
                Zone & Slot Management
              </h3>
              <p className="text-[#64736C] text-xs mb-6 leading-relaxed">
                Create or delete parking zones, adjust hourly or sub pricing rates, and configure individual bay slots.
              </p>
            </div>
            <span className="text-[#16A34A] font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform font-mono uppercase tracking-wider">
              Open Module <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link href="/admin/subscriptions" className="bg-white hover:bg-[#FAF9F6] border border-[#DDE5DF] hover:border-[#D97706]/50 p-8 rounded-3xl transition-all duration-300 group flex flex-col justify-between shadow-card">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] mb-5 group-hover:scale-105 transition-transform">
                <Crown className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#17201D] mb-2 group-hover:text-[#D97706] transition-colors">
                Subscription Authority
              </h3>
              <p className="text-[#64736C] text-xs mb-6 leading-relaxed">
                Activate or deactivate public subscription plans, and toggle active user subscription authorizations.
              </p>
            </div>
            <span className="text-[#D97706] font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform font-mono uppercase tracking-wider">
              Manage Authority <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          <Link href="/admin/bookings" className="bg-white hover:bg-[#FAF9F6] border border-[#DDE5DF] hover:border-[#0F766E]/50 p-8 rounded-3xl transition-all duration-300 group flex flex-col justify-between shadow-card">
            <div>
              <div className="h-12 w-12 rounded-2xl bg-[#E6F4F1] border border-[#CCECE7] flex items-center justify-center text-[#0F766E] mb-5 group-hover:scale-105 transition-transform">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#17201D] mb-2 group-hover:text-[#0F766E] transition-colors">
                Global Bookings Ledger
              </h3>
              <p className="text-[#64736C] text-xs mb-6 leading-relaxed">
                Monitor all user bookings in real-time, inspect entry/exit timestamps, and audit revenue logs.
              </p>
            </div>
            <span className="text-[#0F766E] font-bold text-xs flex items-center gap-1 group-hover:translate-x-1 transition-transform font-mono uppercase tracking-wider">
              View Ledger <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>

    </div>
  );
}


