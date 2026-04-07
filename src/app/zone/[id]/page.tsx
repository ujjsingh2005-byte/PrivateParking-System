"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import SlotGrid from '@/components/SlotGrid';
import BookingModal from '@/components/BookingModal';
import { createBooking } from '@/services/bookingService';
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
    // Attempting to book without strict auth logic here just to demonstrate MVP. 
    // Usually we extract user.id from supabase.auth.getSession()
    const { data: session } = await supabase.auth.getSession();
    const userId = session?.session?.user?.id;

    if (!userId) {
      alert("Please login first! (For demo, add a default user logic if needed)");
      // For demo bypass we could insert without user if RLS allowed, but RLS strictly requires user.
      // So you must login.
      return;
    }

    try {
      await createBooking({
        user_id: userId,
        slot_id: selectedSlot.id,
        start_time: start,
        end_time: end
      });
      alert('Booking created successfully!');
      setSelectedSlot(null);
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
