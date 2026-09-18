"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Car, Lock, Clock, CheckCircle2, Sparkles } from 'lucide-react';

interface Slot {
  id: string;
  slot_number: number;
  price_per_hour_override?: number;
}

interface SlotGridProps {
  zoneId: string;
  slots: Slot[];
  selectedSlotId?: string | null;
  onSlotSelect: (slot: Slot) => void;
}

export default function SlotGrid({ zoneId, slots, selectedSlotId, onSlotSelect }: SlotGridProps) {
  // Mapping of slot_id to status: 'available' | 'booked' | 'partial'
  const [slotStatuses, setSlotStatuses] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchStatuses = async () => {
      if (!slots || slots.length === 0) return;

      const { data } = await supabase
        .from('bookings')
        .select('slot_id, start_time, end_time')
        .in('slot_id', slots.map(s => s.id))
        .eq('status', 'confirmed');

      const statuses: Record<string, string> = {};
      const current = new Date();
      
      data?.forEach(booking => {
        const start = new Date(booking.start_time);
        const end = new Date(booking.end_time);

        if (current >= start && current <= end) {
          statuses[booking.slot_id] = 'booked';
        } else if (start > current) {
          if (statuses[booking.slot_id] !== 'booked') {
            statuses[booking.slot_id] = 'partial';
          }
        }
      });
      setSlotStatuses(statuses);
    };

    fetchStatuses();

    // Listen to realtime changes on bookings table
    const channel = supabase.channel(`bookings-${zoneId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        fetchStatuses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [slots, zoneId]);

  return (
    <div className="p-6 sm:p-8 bg-[#17201D] text-white rounded-3xl border border-[#2C3933] relative overflow-hidden shadow-elevation">
      
      {/* Central Driveway / Lane Marking Indicator */}
      <div className="hidden md:flex items-center justify-between px-6 py-2.5 mb-8 bg-[#12372A] rounded-xl border border-dashed border-[#16A34A]/30 text-[11px] text-[#A7B5AD] font-mono">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#16A34A]"></span>
          BAY SECTION NORTH (INGRESS)
        </span>
        <span className="tracking-widest uppercase text-[#4ADE80] font-bold">◄ CENTRAL VEHICLE DRIVING LANE ►</span>
        <span className="flex items-center gap-2">
          BAY SECTION SOUTH (EGRESS)
          <span className="h-2 w-2 rounded-full bg-[#16A34A]"></span>
        </span>
      </div>

      {/* Grid of Realistic Parking Bays */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
        {slots.map((slot) => {
          const status = slotStatuses[slot.id] || 'available';
          const isSelected = selectedSlotId === slot.id;
          const isBooked = status === 'booked';
          const isPartial = status === 'partial';

          return (
            <div
              key={slot.id}
              onClick={() => !isBooked && onSlotSelect(slot)}
              className={`
                relative group flex flex-col justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all duration-200
                ${
                  isSelected
                    ? 'bg-[#12372A] border-[#16A34A] glow-emerald scale-[1.03] z-10'
                    : isBooked
                    ? 'bg-[#E45757]/10 border-[#E45757]/30 opacity-75 cursor-not-allowed'
                    : isPartial
                    ? 'bg-[#D97706]/10 border-[#D97706]/40 hover:border-[#D97706] hover:bg-[#D97706]/20 glow-amber cursor-pointer hover:-translate-y-1'
                    : 'bg-[#1D2924] border-[#16A34A]/30 hover:border-[#16A34A] hover:bg-[#12372A] glow-emerald cursor-pointer hover:-translate-y-1'
                }
              `}
            >
              {/* Top Curb Line & Slot Identifier */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.08]">
                <span className="font-mono text-xs font-black tracking-wider text-white">
                  BAY #{slot.slot_number < 10 ? `0${slot.slot_number}` : slot.slot_number}
                </span>

                {isBooked ? (
                  <span className="h-2 w-2 rounded-full bg-[#E45757]" />
                ) : isPartial ? (
                  <span className="h-2 w-2 rounded-full bg-[#D97706] animate-pulse" />
                ) : isSelected ? (
                  <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-[#16A34A]" />
                )}
              </div>

              {/* Bay Silhouette / Vehicle Visual */}
              <div className="my-2 flex flex-col items-center justify-center py-4 bg-[#0F1512] rounded-xl border border-white/[0.06] group-hover:border-white/[0.12] transition-all">
                <Car 
                  className={`w-10 h-10 transition-transform duration-200 ${
                    isSelected
                      ? 'text-[#4ADE80] scale-110'
                      : isBooked
                      ? 'text-[#E45757]/70'
                      : isPartial
                      ? 'text-[#D97706]/90 group-hover:scale-105'
                      : 'text-[#16A34A] group-hover:scale-105'
                  }`}
                />
                
                {/* Visual Wheel Stops / Parking Bay Curb */}
                <div className="w-12 h-1 bg-white/20 rounded-full mt-2" />
              </div>

              {/* Slot Status Tag */}
              <div className="pt-2 text-center">
                {isBooked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#FB7185]">
                    <Lock className="w-3 h-3" /> OCCUPIED
                  </span>
                ) : isSelected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4ADE80]">
                    <CheckCircle2 className="w-3 h-3" /> SELECTED
                  </span>
                ) : isPartial ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#FBBF24]">
                    <Clock className="w-3 h-3" /> RESERVED SOON
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4ADE80]">
                    <Sparkles className="w-3 h-3" /> AVAILABLE
                  </span>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}



