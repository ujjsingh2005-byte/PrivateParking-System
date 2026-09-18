"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import SlotGrid from '@/components/SlotGrid';
import BookingModal from '@/components/BookingModal';
import { createBooking, checkAvailability } from '@/services/bookingService';
import { loadRazorpay } from '@/lib/razorpay';
import { ArrowLeft, Zap, ShieldCheck, Video, Clock, CreditCard, Sparkles, CheckCircle2, AlertCircle, Compass } from 'lucide-react';
import Link from 'next/link';

export default function ZonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [zone, setZone] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchZoneAndSlots = async () => {
      const { data: zoneData } = await supabase
        .from('zones')
        .select('*')
        .eq('id', id)
        .single();
      
      const { data: slotsData } = await supabase
        .from('parking_slots')
        .select('*')
        .eq('zone_id', id)
        .order('slot_number');

      setZone(zoneData);
      if (slotsData) setSlots(slotsData);
      setLoading(false);
    };

    fetchZoneAndSlots();
  }, [id]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 6000);
  };

  const handleBook = async (start: Date, end: Date) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      showNotification('error', 'Please sign in to reserve a parking bay.');
      return;
    }

    try {
      // 1. Check user subscription status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .maybeSingle();

      const hasActiveSub = !!subscription;

      // 2. Evaluate subscription requirements
      if (zone.zone_type === 'subscription' && !hasActiveSub) {
        showNotification('error', 'This zone is reserved exclusively for PARKORA Pro mobility pass holders.');
        return;
      }

      // Hybrid zone is free if subscribed, subscription zone is free. Hourly is post-paid.
      const isFreeBooking = 
        zone.zone_type === 'subscription' || 
        (zone.zone_type === 'hybrid' && hasActiveSub) ||
        zone.zone_type === 'hourly';

      if (isFreeBooking) {
        await createBooking({
          user_id: userId,
          slot_id: selectedSlot.id,
          start_time: start,
          end_time: end
        });
        showNotification('success', `Success! Bay #${selectedSlot.slot_number} reserved.`);
        setSelectedSlot(null);
        return;
      }

      // 3. Paid Booking (Upfront Payment via Razorpay)
      const durationHours = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
      const pricePerHour = selectedSlot.price_per_hour_override || zone.price_per_hour;
      const totalPrice = pricePerHour * durationHours;

      if (totalPrice <= 0) {
        await createBooking({
          user_id: userId,
          slot_id: selectedSlot.id,
          start_time: start,
          end_time: end
        });
        showNotification('success', `Success! Bay #${selectedSlot.slot_number} reserved.`);
        setSelectedSlot(null);
        return;
      }

      // Check slot availability
      const isAvailable = await checkAvailability(selectedSlot.id, start, end);
      if (!isAvailable) {
        showNotification('error', 'This bay was just reserved for the selected timeframe. Please pick another.');
        return;
      }

      // Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpay();
      if (!isLoaded || !(window as any).Razorpay) {
        showNotification('error', 'Unable to initialize Razorpay payment gateway. Please check your internet connection.');
        return;
      }

      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      if (!razorpayKeyId) {
        showNotification('error', 'Payment configuration missing: NEXT_PUBLIC_RAZORPAY_KEY_ID is not configured.');
        return;
      }

      // Generate UUID
      const bookingId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      // Create Razorpay Order
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalPrice,
          userId,
          bookingId: bookingId
        })
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        throw new Error(errData.error || 'Failed to initialize Razorpay checkout');
      }

      const orderData = await orderRes.json();

      const razorpayOptions = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'PARKORA Smart Mobility',
        description: `Bay #${selectedSlot.slot_number} Reservation (${durationHours}h)`,
        order_id: orderData.id,
        prefill: {
          email: session?.session?.user?.email || '',
        },
        theme: {
          color: '#16A34A'
        },
        handler: async function (paymentResponse: any) {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
                bookingId: bookingId,
                userId,
                amount: totalPrice
              })
            });

            if (!verifyRes.ok) {
              throw new Error('Payment verification failed');
            }

            // Create booking after payment verification
            await createBooking({
              id: bookingId,
              user_id: userId,
              slot_id: selectedSlot.id,
              start_time: start,
              end_time: end
            });

            showNotification('success', `Payment Confirmed! Bay #${selectedSlot.slot_number} reserved.`);
            setSelectedSlot(null);
          } catch (err: any) {
            showNotification('error', err.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: function () {
            showNotification('error', 'Payment was not completed. Bay reservation was cancelled.');
          }
        }
      };

      const razorpay = new (window as any).Razorpay(razorpayOptions);
      
      razorpay.on('payment.failed', function (response: any) {
        showNotification('error', response?.error?.description || 'Payment transaction failed.');
      });

      razorpay.open();

    } catch (err: any) {
      showNotification('error', err.message || 'Error occurred during reservation');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="h-10 w-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64736C] text-sm font-mono tracking-wide">Synchronizing 2D Parking Telemetry...</p>
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-[#E45757]" />
        </div>
        <h2 className="text-2xl font-black text-[#17201D] mb-2">Zone Not Found</h2>
        <p className="text-[#64736C] text-sm mb-6">The requested parking zone telemetry could not be resolved.</p>
        <Link href="/" className="px-6 py-3 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md">
          Return to All Zones
        </Link>
      </div>
    );
  }

  const occupiedCount = slots.filter(s => s.status === 'occupied').length;
  const availableCount = slots.filter(s => s.status === 'available').length;
  const occupancyPct = slots.length > 0 ? Math.round((occupiedCount / slots.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen bg-[#FAF9F6]">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 text-xs font-bold ${
          notification.type === 'success'
            ? 'bg-[#12372A] border-[#16A34A] text-[#4ADE80] shadow-xl'
            : 'bg-[#4C0519] border-[#FB7185] text-[#FECDD3] shadow-xl'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#4ADE80] flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-[#FB7185] flex-shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="p-2.5 bg-white hover:bg-[#ECF4EF] text-[#64736C] hover:text-[#17201D] rounded-xl transition-all border border-[#DDE5DF] shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#64736C]">
            <Link href="/" className="hover:text-[#16A34A] transition-colors">All Zones</Link>
            <span>/</span>
            <span className="text-[#17201D] font-bold">{zone.name}</span>
          </div>
        </div>

        {/* Live Pulse Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#DCFCE7] border border-[#BBF7D0]">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
          <span className="text-[11px] font-bold text-[#16A34A] tracking-wider font-mono uppercase">Telemetry Live</span>
        </div>
      </div>

      {/* Zone Overview Banner */}
      <div className="bg-[#17201D] text-white rounded-3xl p-6 sm:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-elevation border border-[#2C3933]">
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#16A34A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#12372A] text-[#4ADE80] border border-[#16A34A]/40 uppercase tracking-wider">
              {zone.zone_type} Zone
            </span>
            <span className="text-xs text-[#A7B5AD] font-mono">• {slots.length} Total Bays</span>
            <span className="text-xs text-[#6B7C73]">•</span>
            <span className="text-xs text-[#4ADE80] font-mono font-bold">{availableCount} Available</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            {zone.name}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#A7B5AD] pt-1">
            <span className="inline-flex items-center gap-1.5 text-white">
              <Zap className="w-3.5 h-3.5 text-[#22C55E]" /> Fast EV Charging
            </span>
            <span className="text-[#6B7C73]">•</span>
            <span className="inline-flex items-center gap-1.5 text-white">
              <Video className="w-3.5 h-3.5 text-[#14B8A6]" /> 24/7 ANPR Guard
            </span>
            <span className="text-[#6B7C73]">•</span>
            <span className="inline-flex items-center gap-1.5 text-white">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" /> Automated Gate
            </span>
          </div>
        </div>

        {/* Pricing Badge */}
        <div className="p-5 bg-[#12372A] rounded-2xl border border-[#16A34A]/30 min-w-[220px] text-right relative z-10 shadow-sm">
          <span className="text-[11px] font-bold text-[#A7B5AD] uppercase tracking-wider block mb-1">Standard Hourly Rate</span>
          <div className="text-2xl font-black text-white font-mono">
            {zone.price_per_hour > 0 ? `₹${zone.price_per_hour}` : 'Included'}
            {zone.price_per_hour > 0 && <span className="text-xs font-normal text-[#A7B5AD]">/hr</span>}
          </div>
          {zone.subscription_price > 0 && (
            <div className="text-xs text-[#4ADE80] font-bold font-mono mt-1">
              or ₹{zone.subscription_price}/mo with Pro Pass
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-[#A7B5AD]">
            <span>Occupancy Load</span>
            <span className="font-bold text-white font-mono">{occupancyPct}%</span>
          </div>
        </div>
      </div>

      {/* 2D Parking Bay Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#17201D] tracking-tight flex items-center gap-2">
              <span>Interactive 2D Parking Layout</span>
            </h2>
            <p className="text-xs text-[#64736C] mt-0.5">Click any available bay to select and proceed with reservation.</p>
          </div>

          {/* Visual Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold bg-white px-4 py-2.5 rounded-2xl border border-[#DDE5DF] shadow-sm">
            <span className="flex items-center gap-1.5 text-[#17201D]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A]"></span> Available
            </span>
            <span className="flex items-center gap-1.5 text-[#17201D]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E45757]"></span> Occupied
            </span>
            <span className="flex items-center gap-1.5 text-[#17201D]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D97706]"></span> Reserved
            </span>
            <span className="flex items-center gap-1.5 text-[#17201D]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A] ring-2 ring-[#16A34A]/40"></span> Selected
            </span>
          </div>
        </div>
        
        <SlotGrid 
          zoneId={zone.id} 
          slots={slots} 
          selectedSlotId={selectedSlot?.id}
          onSlotSelect={(slot) => setSelectedSlot(slot)} 
        />
      </div>

      {/* Checkout Drawer / Modal */}
      {selectedSlot && (
        <BookingModal 
          slotNumber={selectedSlot.slot_number}
          zoneType={zone.zone_type}
          pricePerHour={selectedSlot.price_per_hour_override || zone.price_per_hour}
          onClose={() => setSelectedSlot(null)}
          onBook={handleBook}
        />
      )}

    </div>
  );
}



