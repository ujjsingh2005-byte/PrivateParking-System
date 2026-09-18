"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserBookings, cancelBooking, deleteBooking } from '@/services/bookingService';
import ExtensionModal from '@/components/ExtensionModal';
import { format, differenceInSeconds, differenceInMinutes } from 'date-fns';
import { 
  LogOut, MapPin, Clock, CalendarDays, User, Settings, ChevronRight, 
  Trash2, ShieldAlert, Sparkles, QrCode, Navigation, AlertTriangle, 
  CheckCircle2, XCircle, ArrowUpRight, Check, X, Car, Shield
} from 'lucide-react';
import Link from 'next/link';
import { extendBooking as extendBookingService } from '@/services/extensionService';

export default function Dashboard() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExtension, setSelectedExtension] = useState<any>(null);
  const [selectedPass, setSelectedPass] = useState<any>(null);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [nowTime, setNowTime] = useState<Date>(new Date());

  // Tick clock every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => setNowTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

      const data = await getUserBookings(userId);
      setBookings(data || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const attemptExtension = async (booking: any) => {
    setSelectedExtension({
      bookingId: booking.id,
      isPenalty: (booking.extension_count || 0) >= 1,
      surcharge: (booking.extension_count || 0) >= 1 ? 5.00 : 2.00
    });
  };

  const confirmExtension = async () => {
    try {
      await extendBookingService(selectedExtension.bookingId);
      alert('Extension successful! Added +30 minutes.');
      setSelectedExtension(null);
      if (session?.user) fetchProfileAndBookings(session.user.id);
    } catch (err: any) {
      alert(err.message || 'Extension failed');
      setSelectedExtension(null);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    try {
      await cancelBooking(bookingId);
      if (session?.user) {
        fetchProfileAndBookings(session.user.id);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation');
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm('Remove this cancelled reservation from view?')) {
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
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm font-mono tracking-wide">Loading SmartPark Terminal...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-24 bg-surface-1 p-8 rounded-3xl border border-white/[0.08] shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto text-violet-400">
          <Car className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Authentication Required</h2>
        <p className="text-slate-400 text-sm leading-relaxed">Please authenticate your identity to manage active parking sessions and digital passes.</p>
        <Link href="/auth" className="inline-block w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-violet-600/30 text-xs uppercase tracking-wider">
          Sign In / Register
        </Link>
      </div>
    );
  }

  const visibleBookings = bookings.filter(b => !hiddenIds.includes(b.id));
  
  // Find active booking (confirmed and not expired)
  const activeBooking = visibleBookings.find(b => {
    if (b.status !== 'confirmed') return false;
    const end = new Date(b.end_time);
    return end > nowTime;
  });

  // Calculate countdown for active session
  let countdownString = "00:00:00";
  let isExpiringSoon = false;
  let isExpired = false;
  if (activeBooking) {
    const end = new Date(activeBooking.end_time);
    const totalSecs = differenceInSeconds(end, nowTime);
    if (totalSecs <= 0) {
      isExpired = true;
      countdownString = "EXPIRED";
    } else {
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      countdownString = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      isExpiringSoon = totalSecs <= 15 * 60;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-surface-1 p-6 rounded-3xl border border-white/[0.08] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-violet-600/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400 font-mono">Operations Console</span>
            {profile?.role === 'admin' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                Admin Master
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Driver Dashboard</h1>
          <p className="text-slate-400 text-xs mt-1 font-mono">{session.user.email}</p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          {profile?.role === 'admin' && (
            <Link 
              href="/admin" 
              className="px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-violet-400" /> Admin Vault
            </Link>
          )}
          <button 
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/auth')} 
            className="flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-rose-500/15 text-slate-300 hover:text-rose-400 rounded-xl transition-all font-semibold text-xs border border-white/[0.08]"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* ACTIVE PARKING SESSION SPOTLIGHT */}
      {activeBooking ? (
        <div className="mb-10 bg-gradient-to-br from-surface-1 via-surface-1 to-[#151a2e] border-2 border-violet-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isExpired 
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                    : isExpiringSoon 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    : 'bg-lime-500/20 text-lime-300 border border-lime-500/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-rose-400' : isExpiringSoon ? 'bg-amber-400' : 'bg-lime-400 animate-ping'}`} />
                  {isExpired ? 'SESSION OVERDUE' : isExpiringSoon ? 'EXPIRING SOON' : 'ACTIVE SESSION'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Bay #{activeBooking.parking_slots?.slot_number} • {activeBooking.parking_slots?.zones?.name}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activeBooking.parking_slots?.zones?.name || 'SmartPark Zone'}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1 font-mono">
                <span>Start: <strong className="text-white">{format(new Date(activeBooking.start_time), 'HH:mm')}</strong></span>
                <span>•</span>
                <span>End: <strong className="text-white">{format(new Date(activeBooking.end_time), 'HH:mm')}</strong></span>
                {activeBooking.extension_count > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-bold">{activeBooking.extension_count}x Extended</span>
                  </>
                )}
              </div>
            </div>

            {/* Countdown Clock Display */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-midnight/80 p-5 rounded-2xl border border-white/[0.08] backdrop-blur-md">
              <div className="text-left sm:text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                  Remaining Time
                </span>
                <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                  isExpired ? 'text-rose-400' : isExpiringSoon ? 'text-amber-400' : 'text-lime-400'
                }`}>
                  {countdownString}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => attemptExtension(activeBooking)}
                  className="px-4 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-violet-600/30 flex-1 sm:flex-none"
                >
                  <Clock className="w-3.5 h-3.5" /> +30m Extend
                </button>
                <button 
                  onClick={() => setSelectedPass(activeBooking)}
                  className="px-4 py-3 bg-surface-2 hover:bg-white/[0.08] text-slate-200 border border-white/[0.1] font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                >
                  <QrCode className="w-3.5 h-3.5 text-violet-400" /> Digital Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10 bg-surface-1 border border-dashed border-white/[0.12] rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mx-auto mb-3 text-slate-500">
            <Car className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Active Parking Session</h3>
          <p className="text-xs text-slate-400 mb-5 max-w-sm mx-auto">You currently do not have a vehicle parked in any SmartPark zone.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-violet-600/30">
            Find Parking Bay <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Link href="/profile" className="flex items-center justify-between p-6 bg-surface-1 border border-white/[0.08] rounded-3xl hover:border-violet-500/50 transition-all group shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-violet-500/10 rounded-2xl text-violet-400 group-hover:scale-110 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Driver Profile & Passports</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage vehicles, ANPR tags & account security</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
        </Link>
        <Link href="/subscriptions" className="flex items-center justify-between p-6 bg-surface-1 border border-white/[0.08] rounded-3xl hover:border-lime-500/50 transition-all group shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-lime-500/10 rounded-2xl text-lime-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">SmartPark Pro Memberships</h3>
              <p className="text-xs text-slate-400 mt-0.5">Unlimited parking access & priority VIP reservation</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-lime-400 group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Booking History Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-violet-400" /> Reservation History
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Audit log of your historical parking sessions and receipts.</p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500 bg-surface-1 px-3 py-1.5 rounded-xl border border-white/[0.06]">
            {visibleBookings.length} Records
          </span>
        </div>

        {visibleBookings.length === 0 ? (
          <div className="text-slate-400 p-12 text-center border border-white/[0.08] border-dashed rounded-3xl bg-surface-1/40">
            No booking records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleBookings.map(b => {
              const endTime = new Date(b.end_time);
              const isPast = endTime < nowTime;
              const minsLeft = differenceInMinutes(endTime, nowTime);
              const canExtend = b.status === 'confirmed' && minsLeft <= 30 && minsLeft > 0;
            
              return (
                <div key={b.id} className="bg-surface-1 border border-white/[0.08] p-6 rounded-3xl flex flex-col hover:border-violet-500/30 transition-all shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`flex items-center gap-1.5 font-bold px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider ${
                      b.status === 'confirmed' 
                        ? (isPast ? 'text-slate-400 bg-surface-2' : 'text-lime-300 bg-lime-500/15 border border-lime-500/30')
                        : b.status === 'cancelled' 
                        ? 'text-rose-300 bg-rose-500/15 border border-rose-500/30' 
                        : 'text-slate-400 bg-surface-2'
                    }`}>
                      {b.status === 'confirmed' && isPast ? 'COMPLETED' : b.status.toUpperCase()}
                    </div>
                    {b.extension_count > 0 && (
                      <span className="text-[11px] font-bold text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-mono">
                        {b.extension_count}x Extended
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <span className="truncate">{b.parking_slots?.zones?.name || 'SmartPark Zone'}</span>
                  </h3>
                  <p className="text-slate-400 text-xs mb-5 font-mono">Bay #{b.parking_slots?.slot_number}</p>
                  
                  <div className="space-y-2 mb-6 flex-1 bg-surface-2/40 p-3.5 rounded-2xl border border-white/[0.04]">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Entry:</span>
                      <span className="text-white font-medium">{format(new Date(b.start_time), 'dd MMM • HH:mm')}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Exit:</span>
                      <span className="text-white font-medium">{format(new Date(b.end_time), 'dd MMM • HH:mm')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canExtend && (
                      <button 
                        onClick={() => attemptExtension(b)}
                        className="flex-1 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 font-bold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" /> Extend (+30m)
                      </button>
                    )}
                    {b.status === 'confirmed' && !isPast && (
                      <button 
                        onClick={() => setSelectedPass(b)}
                        className="p-2.5 bg-surface-2 hover:bg-surface-3 text-violet-400 rounded-xl transition-colors border border-white/[0.08]"
                        title="Digital Pass"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                    {b.status === 'confirmed' && !isPast && (
                      <button 
                        onClick={() => handleCancel(b.id)}
                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors border border-rose-500/20"
                        title="Cancel Reservation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {b.status === 'cancelled' && (
                      <button 
                        onClick={() => handleDelete(b.id)}
                        className="w-full bg-rose-950/40 hover:bg-rose-900/30 text-rose-300 border border-rose-500/20 font-bold py-2.5 rounded-xl transition-colors text-xs flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Record
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Extension Modal */}
      {selectedExtension && (
        <ExtensionModal 
          bookingId={selectedExtension.bookingId}
          isPenalty={selectedExtension.isPenalty}
          surcharge={selectedExtension.surcharge}
          onClose={() => setSelectedExtension(null)}
          onExtend={confirmExtension}
        />
      )}

      {/* Digital Parking Pass Modal (QR Code) */}
      {selectedPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-white/[0.1] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative">
            <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center text-white font-black text-xs">SP</div>
                <div>
                  <h3 className="font-bold text-white text-sm">SmartPark Pass</h3>
                  <p className="text-[10px] text-slate-400 font-mono">AUTOMATED GATE ACCESS</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPass(null)}
                className="p-1.5 hover:bg-surface-2 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-5">
              {/* QR Render Mock */}
              <div className="p-5 bg-white rounded-2xl mx-auto inline-block shadow-inner">
                <div className="w-44 h-44 bg-slate-900 rounded-xl p-2.5 flex flex-col items-center justify-center border-4 border-slate-900">
                  <div className="w-full h-full bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-900 font-mono text-[10px] font-bold p-2 text-center leading-tight">
                    <QrCode className="w-24 h-24 text-slate-900 mb-1" />
                    <span className="font-mono text-[9px]">ID: {selectedPass.id.slice(0, 16)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xl font-black text-white">
                  {selectedPass.parking_slots?.zones?.name}
                </div>
                <div className="text-xs text-lime-400 font-mono font-bold">
                  BAY #{selectedPass.parking_slots?.slot_number}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Valid Until: {format(new Date(selectedPass.end_time), 'dd MMM yyyy, HH:mm')}
                </p>
              </div>
            </div>

            <div className="p-4 bg-midnight border-t border-white/[0.06] text-center">
              <button 
                onClick={() => window.print()}
                className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all"
              >
                Print / Save Pass
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

