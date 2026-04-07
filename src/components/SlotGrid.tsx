"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Car } from 'lucide-react';

interface Slot {
  id: string;
  slot_number: number;
}

interface SlotGridProps {
  zoneId: string;
  slots: Slot[];
  onSlotSelect: (slot: Slot) => void;
}

export default function SlotGrid({ zoneId, slots, onSlotSelect }: SlotGridProps) {
  // Mapping of slot_id to status: 'available' | 'booked' | 'partial'
  const [slotStatuses, setSlotStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    // Basic fetch for current slot statuses based on bookings
    const fetchStatuses = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('bookings')
        .select('slot_id, start_time, end_time')
        .in('slot_id', slots.map(s => s.id))
        .eq('status', 'confirmed');

      const statuses: Record<string, string> = {};
      
      data?.forEach(booking => {
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);
        const current = new Date();

        if (current >= start && current <= end) {
          statuses[booking.slot_id] = 'booked';
        } else if (start > current) {
           // If it's booked in the future but not now, it's partial
           if (statuses[booking.slot_id] !== 'booked') {
             statuses[booking.slot_id] = 'partial';
           }
        }
      });
      setSlotStatuses(statuses);
    };

    fetchStatuses();

    // Listen to realtime changes on bookings table
    const channel = supabase.channel('bookings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, payload => {
        // Re-fetch or locally mutate statuses
        fetchStatuses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slots]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {slots.map((slot) => {
        const status = slotStatuses[slot.id] || 'available';
        
        // Colors mapping: Green -> Available, Red -> Booked, Yellow -> Partial
        let colorClasses = '';
        let statusText = '';
        
        switch (status) {
          case 'available':
            colorClasses = 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20';
            statusText = 'Available';
            break;
          case 'booked':
            colorClasses = 'bg-red-500/10 border-red-500/50 text-red-500 cursor-not-allowed opacity-75';
            statusText = 'Booked';
            break;
          case 'partial':
            colorClasses = 'bg-amber-500/10 border-amber-500/50 text-amber-500 hover:bg-amber-500/20';
            statusText = 'Available Now (Booked Later)';
            break;
        }

        return (
          <div 
            key={slot.id}
            onClick={() => status !== 'booked' && onSlotSelect(slot)}
            className={`
              relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all 
              ${colorClasses}
              ${status !== 'booked' ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : ''}
              ${status === 'available' ? 'hover:shadow-emerald-500/20' : ''}
              ${status === 'partial' ? 'hover:shadow-amber-500/20' : ''}
            `}
          >
            <span className="absolute top-3 left-3 text-sm font-bold opacity-50">
              #{slot.slot_number}
            </span>
            <Car className={`w-12 h-12 mb-3 ${status === 'booked' ? 'opacity-50' : 'opacity-100'}`} />
            <span className="text-xs font-semibold text-center leading-tight">
              {statusText}
            </span>
          </div>
        )
      })}
    </div>
  );
}
