"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import SlotGrid from '@/components/SlotGrid';
import BookingModal from '@/components/BookingModal';
import { createBooking, checkAvailability } from '@/services/bookingService';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ZonePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [zone, setZone] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);

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

  const handleBook = async (start: Date, end: Date) => {
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      alert("Please login first!");
      return;
    }

    try {
      // 1. Check if the user has an active subscription
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .maybeSingle();

      const hasActiveSub = !!subscription;

      // 2. Evaluate booking rules
      if (zone.zone_type === 'subscription' && !hasActiveSub) {
        alert("This zone is for subscribers only. Please buy a subscription first.");
        return;
      }

      // Hybrid zone is free if subscribed, subscription zone is free. Hourly is post-paid (billed on exit).
      const isFreeBooking = 
        zone.zone_type === 'subscription' || 
        (zone.zone_type === 'hybrid' && hasActiveSub) ||
        zone.zone_type === 'hourly';

      if (isFreeBooking) {
        // Create the booking directly
        await createBooking({
          user_id: userId,
          slot_id: selectedSlot.id,
          start_time: start,
          end_time: end
        });
        alert('Booking created successfully!');
        setSelectedSlot(null);
        return;
      }

      // 3. Paid Booking (Upfront Payment via Razorpay)
      const durationHours = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      const pricePerHour = selectedSlot.price_per_hour_override || zone.price_per_hour;
      const totalPrice = pricePerHour * durationHours;

      if (totalPrice <= 0) {
        await createBooking({
          user_id: userId,
          slot_id: selectedSlot.id,
          start_time: start,
          end_time: end
        });
        alert('Booking created successfully!');
        setSelectedSlot(null);
        return;
      }

      // Check availability first before charging
      const isAvailable = await checkAvailability(selectedSlot.id, start, end);
      if (!isAvailable) {
        alert('Slot is not available for the selected time');
        return;
      }

      // Generate client-side UUID for the booking
      const bookingId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });

      // Create Razorpay order
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
        throw new Error(errData.error || 'Failed to create Razorpay order');
      }

      const orderData = await orderRes.json();

      const razorpayOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'Smart Parking System',
        description: `Booking for Slot #${selectedSlot.slot_number}`,
        order_id: orderData.id,
        prefill: {
          email: session?.session?.user?.email || '',
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

            // Create the booking in the database now that payment is confirmed
            await createBooking({
              id: bookingId,
              user_id: userId,
              slot_id: selectedSlot.id,
              start_time: start,
              end_time: end
            });

            alert('Payment successful! Your booking is confirmed.');
            setSelectedSlot(null);
          } catch (err: any) {
            alert(err.message || 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: function () {
            alert('Payment cancelled. Booking was not created.');
          }
        }
      };

      const razorpay = new (window as any).Razorpay(razorpayOptions);
      
      razorpay.on('payment.failed', function (response: any) {
        alert(response.error.description || 'Payment failed. Booking was not created.');
      });

      razorpay.open();

    } catch (err: any) {
      alert(err.message || 'Error occurred during booking');
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Loading slots...</div>;
  if (!zone) return <div className="p-12 text-center text-red-400">Zone not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <div className="mb-8 flex items-center gap-4">
        <Link href="/" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{zone.name}</h1>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-wider font-semibold">
            {zone.zone_type} Zone
          </p>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
          Select a parsing slot
          <div className="flex gap-4 text-xs font-medium ml-4">
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Available</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div> Booked</span>
            <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Partial</span>
          </div>
        </h2>
        
        <SlotGrid 
          zoneId={zone.id} 
          slots={slots} 
          onSlotSelect={setSelectedSlot} 
        />
      </div>

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
