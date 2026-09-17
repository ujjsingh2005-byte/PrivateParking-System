"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserBookings, cancelBooking, deleteBooking } from '@/services/bookingService';
import ExtensionModal from '@/components/ExtensionModal';
import { format, differenceInMinutes } from 'date-fns';
import { LogOut, MapPin, Clock, CalendarDays, User, Settings, ChevronRight, Trash2, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { extendBooking as extendBookingService } from '@/services/extensionService';

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExtension, setSelectedExtension] = useState<any>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('hidden_bookings');
    if (saved) {
      try {
        setHiddenIds(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfileAndBookings(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfileAndBookings(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfileAndBookings = async (userId: string) => {
    setLoading(true);
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      setProfile(prof);

      if (prof?.role === 'admin') {
        const data = await getUserBookings(userId);
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const attemptExtension = async (booking: any) => {
    setSelectedExtension({
      bookingId: booking.id,
      isPenalty: booking.extension_count >= 1,
      surcharge: booking.extension_count >= 1 ? 5.00 : 2.00
    });
  };

  const confirmExtension = async () => {
    try {
       await extendBookingService(selectedExtension.bookingId);
       alert('Extension successful!');
       setSelectedExtension(null);
       if (session?.user) fetchProfileAndBookings(session.user.id);
    } catch (err: any) {
       alert(err.message || 'Extension failed');
       setSelectedExtension(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    try {
      await cancelBooking(bookingId);
      alert('Booking cancelled successfully.');
      if (session?.user) {
        fetchProfileAndBookings(session.user.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Are you sure you want to remove this cancelled booking from your history?')) {
      return;
    }
    const updated = [...hiddenIds, bookingId];
    setHiddenIds(updated);
    localStorage.setItem('hidden_bookings', JSON.stringify(updated));

    try {
      await deleteBooking(bookingId);
    } catch (err) {
      console.warn('Database delete skipped/failed:', err);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading Dashboard...</div>;
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-24 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Authentication Required</h2>
        <p className="text-slate-400 text-sm">Please sign in to access system features.</p>
        <Link href="/auth" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-2xl transition-all">
          Go to Sign In
        </Link>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto mt-24 bg-red-500/10 p-8 rounded-3xl border border-red-500/20 text-center space-y-4 shadow-2xl">
        <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-bold text-red-500">Access Restricted</h2>
        <p className="text-red-300 text-sm leading-relaxed">
          Dashboard access is reserved for Administrator Authority. Standard users can browse parking zones, select slots, and execute payments on the Public Zones page.
        </p>
        <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-600/20">
          Go to Parking Zones
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8 bg-slate-900 p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm">Welcome back, {session.user.email}</p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href = '/auth')} 
          className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-xl transition-colors font-medium text-sm"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Link href="/profile" className="flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-500 transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white">My Profile</h3>
              <p className="text-xs text-slate-500">Identity & Security</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </Link>
        <Link href="/settings" className="flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-slate-500 transition-all group">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-500/10 rounded-2xl text-slate-400 group-hover:scale-110 transition-transform">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white">System Settings</h3>
              <p className="text-xs text-slate-500">Preferences & Admin Tools</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-500" /> Admin Booking Log
        </h2>
        {(() => {
          const visibleBookings = bookings.filter(b => !hiddenIds.includes(b.id));
          if (visibleBookings.length === 0) {
            return (
              <div className="text-slate-400 p-12 text-center border border-slate-800 border-dashed rounded-3xl">
                No active bookings recorded.
              </div>
            );
          }
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleBookings.map(b => {
                const endTime = new Date(b.end_time);
                const now = new Date();
                const minsLeft = differenceInMinutes(endTime, now);
                const canExtend = b.status === 'confirmed' && minsLeft <= 30 && minsLeft > 0;
              
                return (
                  <div key={b.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col hover:border-slate-700 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`flex items-center gap-2 font-bold px-3 py-1 rounded-full text-xs ${
                        b.status === 'confirmed' ? 'text-emerald-400 bg-emerald-500/10' :
                        b.status === 'cancelled' ? 'text-red-400 bg-red-500/10' : 'text-slate-400 bg-slate-500/10'
                      }`}>
                        {b.status.toUpperCase()}
                      </div>
                      {b.extension_count > 0 && (
                        <span className="text-xs font-semibold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/20">
                          {b.extension_count}x Extended
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {b.parking_slots?.zones?.name || 'Parking Zone'}
                    </h3>
                    <p className="text-slate-400 text-sm mb-6">Slot #{b.parking_slots?.slot_number}</p>
                    
                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Starts:</span>
                        <span className="text-white font-medium">{format(new Date(b.start_time), 'PP - HH:mm')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Ends:</span>
                        <span className="text-white font-medium">{format(new Date(b.end_time), 'PP - HH:mm')}</span>
                      </div>
                    </div>

                    {canExtend && (
                      <button 
                        onClick={() => attemptExtension(b)}
                        className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                      >
                        <Clock className="w-4 h-4" /> Extend Booking (+30m)
                      </button>
                    )}
                    {b.status === 'confirmed' && (
                      <button 
                        onClick={() => handleCancel(b.id)}
                        className="mt-3 w-full bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 font-bold py-3 rounded-xl transition-colors text-xs flex items-center justify-center gap-1.5"
                      >
                        Cancel Booking
                      </button>
                    )}
                    {b.status === 'cancelled' && (
                      <button 
                        onClick={() => handleDelete(b.id)}
                        className="mt-3 w-full bg-red-950/40 hover:bg-red-900/30 text-red-400 border border-red-500/20 font-bold py-3 rounded-xl transition-colors text-xs flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" /> Remove Card
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {selectedExtension && (
        <ExtensionModal 
          bookingId={selectedExtension.bookingId}
          isPenalty={selectedExtension.isPenalty}
          surcharge={selectedExtension.surcharge}
          onClose={() => setSelectedExtension(null)}
          onExtend={confirmExtension}
        />
      )}
    </div>
  );
}
