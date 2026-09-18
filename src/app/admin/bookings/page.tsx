"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Calendar, User, MapPin, Hash, Trash2, CheckCircle, Clock, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminBookingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setLoading(false);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'admin') {
      setIsAdmin(true);
      fetchAllBookings();
    }
    setLoading(false);
  };

  const fetchAllBookings = async () => {
    const { data } = await supabase
      .from('bookings')
      .select('*, parking_slots(slot_number, zones(name)), profiles:user_id(username, id)')
      .order('created_at', { ascending: false });
    
    if (data) setBookings(data);
  };

  const handleDeleteBooking = async (id: string) => {
    if (confirm('Cancel this booking permanently?')) {
      await supabase.from('bookings').delete().eq('id', id);
      fetchAllBookings();
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.profiles?.username?.toLowerCase().includes(search.toLowerCase()) ||
    b.parking_slots?.zones?.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-xs font-mono tracking-wide">Loading Booking Ledger...</p>
      </div>
    );
  }
  if (!isAdmin) {
    if (typeof window !== 'undefined') window.location.href = '/';
    return <div className="p-12 text-center text-rose-400 font-bold">Access Denied - Redirecting...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-[11px] font-bold text-lime-400 font-mono uppercase tracking-wider mb-1">Global Audit Ledger</div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Global Bookings Ledger</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Monitor all system reservations, inspect entry/exit timestamps, and resolve conflicts.</p>
        </div>
        <div className="relative w-full md:w-96">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
           <input 
            type="text" 
            placeholder="Search driver, zone, or ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface-1 border border-white/[0.08] rounded-2xl p-3.5 pl-11 text-white text-xs placeholder-slate-500 focus:border-violet-500 outline-none transition-all font-mono"
           />
        </div>
      </div>

      <div className="bg-surface-1 border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-2/60 border-b border-white/[0.06] text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="px-6 py-4">ID & Status</th>
                <th className="px-6 py-4">Driver Profile</th>
                <th className="px-6 py-4">Parking Slot</th>
                <th className="px-6 py-4">Timeline</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-surface-2/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="space-y-1 flex flex-col items-start justify-center">
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {b.id.slice(0, 8)}...
                      </span>
                      <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase flex items-center gap-1 ${
                        b.status === 'confirmed' 
                          ? 'bg-lime-500/15 text-lime-300 border border-lime-500/30' 
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}>
                        {b.status === 'confirmed' ? <CheckCircle className="w-3 h-3 text-lime-400" /> : <Clock className="w-3 h-3 text-rose-400" />}
                        {b.status}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="h-9 w-9 bg-surface-2 rounded-xl flex items-center justify-center border border-white/[0.06]">
                         <User className="w-4 h-4 text-slate-400" />
                       </div>
                       <div>
                         <p className="font-bold text-white text-xs">{b.profiles?.username || 'Driver User'}</p>
                         <p className="text-[10px] text-slate-500 font-mono">{b.user_id.slice(0, 8)}...</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                       <MapPin className="w-4 h-4 text-violet-400 flex-shrink-0" />
                       <div>
                         <p className="font-bold text-white text-xs">{b.parking_slots?.zones?.name}</p>
                         <p className="text-[10px] text-lime-400 font-mono font-bold">Bay #{b.parking_slots?.slot_number}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5 text-[11px] font-mono">
                      <div className="flex items-center gap-1.5 text-slate-400">
                         <Calendar className="w-3 h-3 text-slate-500" />
                         <span>{format(new Date(b.start_time), 'dd MMM, HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300 font-bold">
                         <Clock className="w-3 h-3 text-lime-400" />
                         <span>{format(new Date(b.end_time), 'dd MMM, HH:mm')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDeleteBooking(b.id)}
                      className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-all border border-rose-500/20 opacity-0 group-hover:opacity-100"
                      title="Cancel Booking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-500 font-medium text-xs">
                    No reservations found in global ledger.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

