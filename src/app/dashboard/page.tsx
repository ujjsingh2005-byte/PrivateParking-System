"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getUserBookings, cancelBooking, deleteBooking } from '@/services/bookingService';
import ExtensionModal from '@/components/ExtensionModal';
import { format, differenceInSeconds, differenceInMinutes } from 'date-fns';
import { 
  LogOut, MapPin, Clock, CalendarDays, User, ChevronRight, 
  Trash2, Sparkles, QrCode, ArrowUpRight, X, Car, Shield
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
        <div className="h-10 w-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64736C] text-sm font-mono tracking-wide">Loading PARKORA Terminal...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-24 bg-white p-8 rounded-3xl border border-[#DDE5DF] shadow-elevation text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center mx-auto text-[#16A34A]">
          <Car className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#17201D]">Authentication Required</h2>
        <p className="text-[#64736C] text-sm leading-relaxed">Please authenticate your identity to manage active parking sessions and digital mobility passes.</p>
        <Link href="/auth" className="inline-block w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-xs uppercase tracking-wider">
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-[#FAF9F6]">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-[#17201D] text-white p-6 sm:p-8 rounded-3xl shadow-elevation relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-[#16A34A]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#4ADE80] font-mono">PARKORA Operations Console</span>
            {profile?.role === 'admin' && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#E45757]/20 text-[#FB7185] border border-[#E45757]/40 uppercase tracking-wider">
                Admin Master
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Driver Hub & Passes</h1>
          <p className="text-[#A7B5AD] text-xs mt-1 font-mono">{session.user.email}</p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          {profile?.role === 'admin' && (
            <Link 
              href="/admin" 
              className="px-4 py-2 bg-[#12372A] hover:bg-[#163D2E] text-[#4ADE80] border border-[#16A34A]/40 rounded-xl transition-all font-bold text-xs flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-[#22C55E]" /> Admin Vault
            </Link>
          )}
          <button 
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/auth')} 
            className="flex items-center gap-2 px-4 py-2 bg-[#12372A] hover:bg-[#E45757]/20 text-[#A7B5AD] hover:text-[#FB7185] rounded-xl transition-all font-semibold text-xs border border-white/[0.08]"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </div>

      {/* ACTIVE PARKING SESSION SPOTLIGHT */}
      {activeBooking ? (
        <div className="mb-10 bg-[#17201D] text-white border-2 border-[#16A34A]/40 rounded-3xl p-6 sm:p-8 shadow-elevation relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#16A34A]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${
                  isExpired 
                    ? 'bg-[#E45757]/20 text-[#FB7185] border border-[#E45757]/40' 
                    : isExpiringSoon 
                    ? 'bg-[#D97706]/20 text-[#FBBF24] border border-[#D97706]/40 animate-pulse'
                    : 'bg-[#12372A] text-[#4ADE80] border border-[#16A34A]/40'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isExpired ? 'bg-[#E45757]' : isExpiringSoon ? 'bg-[#D97706]' : 'bg-[#22C55E] animate-ping'}`} />
                  {isExpired ? 'SESSION OVERDUE' : isExpiringSoon ? 'EXPIRING SOON' : 'ACTIVE INGRESS SESSION'}
                </span>
                <span className="text-xs text-[#A7B5AD] font-mono">
                  Bay #{activeBooking.parking_slots?.slot_number} • {activeBooking.parking_slots?.zones?.name}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activeBooking.parking_slots?.zones?.name || 'PARKORA Zone'}
              </h2>

              <div className="flex flex-wrap items-center gap-4 text-xs text-[#A7B5AD] pt-1 font-mono">
                <span>Entry: <strong className="text-white">{format(new Date(activeBooking.start_time), 'HH:mm')}</strong></span>
                <span>•</span>
                <span>Exit Window: <strong className="text-white">{format(new Date(activeBooking.end_time), 'HH:mm')}</strong></span>
                {activeBooking.extension_count > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-[#FBBF24] font-bold">{activeBooking.extension_count}x Extended</span>
                  </>
                )}
              </div>
            </div>

            {/* Countdown Clock Display */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-[#12372A] p-5 rounded-2xl border border-[#16A34A]/30">
              <div className="text-left sm:text-right">
                <span className="text-[11px] font-bold text-[#A7B5AD] uppercase tracking-wider block font-mono">
                  Remaining Time
                </span>
                <div className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                  isExpired ? 'text-[#FB7185]' : isExpiringSoon ? 'text-[#FBBF24]' : 'text-[#4ADE80]'
                }`}>
                  {countdownString}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => attemptExtension(activeBooking)}
                  className="px-4 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md flex-1 sm:flex-none"
                >
                  <Clock className="w-3.5 h-3.5" /> +30m Extend
                </button>
                <button 
                  onClick={() => setSelectedPass(activeBooking)}
                  className="px-4 py-3 bg-[#1D2924] hover:bg-[#25362F] text-white border border-white/[0.1] font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-none"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#4ADE80]" /> Digital Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-10 bg-white border border-[#DDE5DF] rounded-3xl p-8 text-center relative overflow-hidden shadow-soft">
          <div className="w-14 h-14 rounded-2xl bg-[#ECF4EF] flex items-center justify-center mx-auto mb-3 text-[#64736C]">
            <Car className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#17201D] mb-1">No Active Parking Session</h3>
          <p className="text-xs text-[#64736C] mb-5 max-w-sm mx-auto">You currently do not have a vehicle parked in any PARKORA zone.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md">
            Find Parking Bay <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        <Link href="/profile" className="flex items-center justify-between p-6 bg-white border border-[#DDE5DF] rounded-3xl hover:border-[#16A34A] transition-all group shadow-soft">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-[#ECF4EF] rounded-2xl text-[#16A34A] group-hover:scale-110 transition-transform">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#17201D] text-base">Driver Profile & Vehicles</h3>
              <p className="text-xs text-[#64736C] mt-0.5">Manage vehicles, license plates & account security</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#94A39B] group-hover:text-[#16A34A] group-hover:translate-x-1 transition-all" />
        </Link>
        <Link href="/subscriptions" className="flex items-center justify-between p-6 bg-white border border-[#DDE5DF] rounded-3xl hover:border-[#16A34A] transition-all group shadow-soft">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-[#DCFCE7] rounded-2xl text-[#16A34A] group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-[#17201D] text-base">PARKORA Pro Mobility Passes</h3>
              <p className="text-xs text-[#64736C] mt-0.5">Unlimited parking access & priority VIP reservation</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-[#94A39B] group-hover:text-[#16A34A] group-hover:translate-x-1 transition-all" />
        </Link>
      </div>

      {/* Booking History Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#17201D] tracking-tight flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#16A34A]" /> Reservation History
            </h2>
            <p className="text-xs text-[#64736C] mt-0.5">Audit log of your historical parking sessions and receipts.</p>
          </div>
          <span className="text-xs font-mono font-bold text-[#64736C] bg-white px-3 py-1.5 rounded-xl border border-[#DDE5DF] shadow-sm">
            {visibleBookings.length} Records
          </span>
        </div>

        {visibleBookings.length === 0 ? (
          <div className="text-[#64736C] p-12 text-center border border-[#DDE5DF] border-dashed rounded-3xl bg-white shadow-soft">
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
                <div key={b.id} className="bg-white border border-[#DDE5DF] p-6 rounded-3xl flex flex-col hover:border-[#16A34A] transition-all shadow-soft">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`flex items-center gap-1.5 font-bold px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider ${
                      b.status === 'confirmed' 
                        ? (isPast ? 'text-[#64736C] bg-[#ECF4EF]' : 'text-[#16A34A] bg-[#DCFCE7] border border-[#BBF7D0]')
                        : b.status === 'cancelled' 
                        ? 'text-[#E45757] bg-[#FEE2E2] border border-[#FECACA]' 
                        : 'text-[#64736C] bg-[#ECF4EF]'
                    }`}>
                      {b.status === 'confirmed' && isPast ? 'COMPLETED' : b.status.toUpperCase()}
                    </div>
                    {b.extension_count > 0 && (
                      <span className="text-[11px] font-bold text-[#D97706] bg-[#FEF3C7] px-2.5 py-0.5 rounded-full border border-[#FDE68A] font-mono">
                        {b.extension_count}x Extended
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-lg font-bold text-[#17201D] mb-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                    <span className="truncate">{b.parking_slots?.zones?.name || 'PARKORA Zone'}</span>
                  </h3>
                  <p className="text-[#64736C] text-xs mb-5 font-mono">Bay #{b.parking_slots?.slot_number}</p>
                  
                  <div className="space-y-2 mb-6 flex-1 bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#DDE5DF]">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#64736C]">Entry:</span>
                      <span className="text-[#17201D] font-medium">{format(new Date(b.start_time), 'dd MMM • HH:mm')}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-[#64736C]">Exit:</span>
                      <span className="text-[#17201D] font-medium">{format(new Date(b.end_time), 'dd MMM • HH:mm')}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {canExtend && (
                      <button 
                        onClick={() => attemptExtension(b)}
                        className="flex-1 bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#16A34A] border border-[#BBF7D0] font-bold py-2.5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                      >
                        <Clock className="w-3.5 h-3.5" /> Extend (+30m)
                      </button>
                    )}
                    {b.status === 'confirmed' && !isPast && (
                      <button 
                        onClick={() => setSelectedPass(b)}
                        className="p-2.5 bg-[#ECF4EF] hover:bg-[#DDE5DF] text-[#17201D] rounded-xl transition-colors border border-[#DDE5DF]"
                        title="Digital Pass"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                    {b.status === 'confirmed' && !isPast && (
                      <button 
                        onClick={() => handleCancel(b.id)}
                        className="p-2.5 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#E45757] rounded-xl transition-colors border border-[#FECACA]"
                        title="Cancel Reservation"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    {b.status === 'cancelled' && (
                      <button 
                        onClick={() => handleDelete(b.id)}
                        className="w-full bg-[#FEE2E2] hover:bg-[#FECACA] text-[#E45757] border border-[#FECACA] font-bold py-2.5 rounded-xl transition-colors text-xs flex items-center justify-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#DDE5DF] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative">
            <div className="p-6 border-b border-[#DDE5DF] bg-[#FAF9F6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#16A34A] flex items-center justify-center text-white font-black text-xs">PK</div>
                <div>
                  <h3 className="font-bold text-[#17201D] text-sm">PARKORA Pass</h3>
                  <p className="text-[10px] text-[#64736C] font-mono">AUTOMATED GATE ACCESS</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPass(null)}
                className="p-1.5 hover:bg-[#ECF4EF] rounded-xl text-[#64736C] hover:text-[#17201D] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 text-center space-y-5">
              {/* QR Render Mock */}
              <div className="p-5 bg-[#FAF9F6] border border-[#DDE5DF] rounded-2xl mx-auto inline-block">
                <div className="w-44 h-44 bg-white rounded-xl p-2.5 flex flex-col items-center justify-center border border-[#DDE5DF]">
                  <div className="w-full h-full bg-white rounded-lg flex flex-col items-center justify-center text-[#17201D] font-mono text-[10px] font-bold p-2 text-center leading-tight">
                    <QrCode className="w-24 h-24 text-[#17201D] mb-1" />
                    <span className="font-mono text-[9px]">ID: {selectedPass.id.slice(0, 16)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xl font-black text-[#17201D]">
                  {selectedPass.parking_slots?.zones?.name}
                </div>
                <div className="text-xs text-[#16A34A] font-mono font-bold">
                  BAY #{selectedPass.parking_slots?.slot_number}
                </div>
                <p className="text-[11px] text-[#64736C] font-mono">
                  Valid Until: {format(new Date(selectedPass.end_time), 'dd MMM yyyy, HH:mm')}
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF9F6] border-t border-[#DDE5DF] text-center">
              <button 
                onClick={() => window.print()}
                className="w-full py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm"
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


