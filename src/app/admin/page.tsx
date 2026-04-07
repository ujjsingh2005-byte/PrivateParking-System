"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalZones: 0, totalSlots: 0, totalBookings: 0 });

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

    setStats({
      totalZones: zoneCount || 0,
      totalSlots: slotCount || 0,
      totalBookings: bookingCount || 0
    });
    setLoading(false);
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Verifying Admin Access...</div>;
  
  if (!isAdmin) return (
    <div className="max-w-md mx-auto mt-24 bg-red-500/10 p-8 rounded-3xl border border-red-500/20 text-center">
      <h2 className="text-xl font-bold text-red-500 mb-2">Access Denied</h2>
      <p className="text-red-400/80 text-sm">You must be logged in as an administrator to view this page.</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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
      </div>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
         <h2 className="text-xl font-bold text-white mb-4">Quick Management</h2>
         <p className="text-slate-400 text-sm mb-6">In a full production application, data tables for Zones, Slots, Pricing Control, and comprehensive booking overviews would be rendered here utilizing standard Row Level Security enforced APIs.</p>
         <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-colors">
            Manage Zones
         </button>
      </div>

    </div>
  );
}
