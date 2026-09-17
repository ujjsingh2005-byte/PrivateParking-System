"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Layers, Calendar, Crown, ArrowRight, ShieldCheck } from 'lucide-react';

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

  if (loading) return <div className="p-12 text-center text-slate-400">Verifying Admin Access...</div>;
  
  if (!isAdmin) {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return <div className="p-12 text-center text-red-500 font-bold">Access Denied - Redirecting...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">System overview and administrative controls.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-slate-400 text-sm font-semibold mb-2">Total Zones</h3>
          <span className="text-4xl font-black text-white">{stats.totalZones}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-slate-400 text-sm font-semibold mb-2">Total Slots</h3>
          <span className="text-4xl font-black text-white">{stats.totalSlots}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-slate-400 text-sm font-semibold mb-2">Total Bookings</h3>
          <span className="text-4xl font-black text-white">{stats.totalBookings}</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
          <h3 className="text-slate-400 text-sm font-semibold mb-2">Active Subscriptions</h3>
          <span className="text-4xl font-black text-amber-400">{stats.totalActiveSubs}</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white mb-6">Management Modules</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/admin/manage" className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-8 rounded-3xl transition-all group">
           <Layers className="w-10 h-10 text-blue-500 mb-4 group-hover:scale-110 transition-transform" />
           <h3 className="text-xl font-bold text-white mb-2">Zone & Slot Management</h3>
           <p className="text-slate-400 text-sm mb-6">Create or delete zones, configure pricing, and manage individual parking slots.</p>
           <span className="text-blue-400 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
             Open Console <ArrowRight className="w-4 h-4" />
           </span>
        </Link>

        <Link href="/admin/subscriptions" className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-8 rounded-3xl transition-all group">
           <Crown className="w-10 h-10 text-amber-500 mb-4 group-hover:scale-110 transition-transform" />
           <h3 className="text-xl font-bold text-white mb-2">Subscription Authority</h3>
           <p className="text-slate-400 text-sm mb-6">Activate or deactivate subscription plans, and toggle active user subscriptions.</p>
           <span className="text-amber-400 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
             Manage Subscriptions <ArrowRight className="w-4 h-4" />
           </span>
        </Link>

        <Link href="/admin/bookings" className="bg-slate-900 hover:bg-slate-800/80 border border-slate-800 p-8 rounded-3xl transition-all group">
           <Calendar className="w-10 h-10 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
           <h3 className="text-xl font-bold text-white mb-2">Global Bookings</h3>
           <p className="text-slate-400 text-sm mb-6">Monitor all bookings across all users, inspect timelines, and resolve conflicts.</p>
           <span className="text-emerald-400 font-bold text-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
             View Bookings <ArrowRight className="w-4 h-4" />
           </span>
        </Link>
      </div>

    </div>
  );
}
