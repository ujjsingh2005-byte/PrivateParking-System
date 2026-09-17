"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, Calendar, User, MapPin, Hash, Trash2, CheckCircle, Clock } from 'lucide-react';
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

  if (loading) return <div className="p-12 text-center text-slate-400">Loading Bookings...</div>;
  if (!isAdmin) {
    if (typeof window !== 'undefined') window.location.href = '/';
    return <div className="p-12 text-center text-red-500 font-bold">Access Denied - Redirecting...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Global Oversight</h1>
          <p className="text-slate-400">Monitor all system bookings, resolve conflicts, and track user activity.</p>
        </div>
        <div className="relative w-full md:w-96">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
           <input 
            type="text" 
            placeholder="Search by user, zone, or ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 pl-12 text-white placeholder-slate-600 focus:border-blue-500 outline-none transition-all"
           />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <th className="px-8 py-6">ID & Status</th>
                <th className="px-8 py-6">User Details</th>
                <th className="px-8 py-6">Parking Slot</th>
                <th className="px-8 py-6">Timeline</th>
                <th className="px-8 py-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="space-y-1.5 flex flex-col items-start justify-center">
                      <span className="text-[10px] font-mono text-slate-600 flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {b.id.slice(0, 8)}...
                      </span>
                      <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5 ${b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                        {b.status === 'confirmed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {b.status}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                         <User className="w-5 h-5 text-slate-400" />
                       </div>
                       <div>
                         <p className="font-bold text-white text-sm">{b.profiles?.username || 'System User'}</p>
                         <p className="text-[10px] text-slate-500">{b.user_id.slice(0, 8)}...</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <MapPin className="w-4 h-4 text-blue-500" />
                       <div>
                         <p className="font-bold text-white text-sm">{b.parking_slots?.zones?.name}</p>
                         <p className="text-[10px] text-slate-500">Slot #{b.parking_slots?.slot_number}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1 text-[10px]">
                      <div className="flex items-center gap-2 text-slate-400">
                         <Calendar className="w-3 h-3 text-slate-600" />
                         <span>{format(new Date(b.start_time), 'MMM d, HH:mm')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400 font-bold text-white">
                         <Clock className="w-3 h-3 text-emerald-500" />
                         <span>{format(new Date(b.end_time), 'MMM d, HH:mm')}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleDeleteBooking(b.id)}
                      className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-24 text-center text-slate-600 font-medium">
                    No bookings found matching your request.
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
