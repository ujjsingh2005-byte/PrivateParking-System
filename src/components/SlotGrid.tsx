"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Car, Lock, Clock, Sparkles, CheckCircle2 } from 'lucide-react';

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
    <div className="parking-bay-grid p-6 sm:p-8 bg-[#080b12] rounded-3xl border border-white/[0.08] relative overflow-hidden">
      
      {/* Central Driveway / Lane Marking Indicator */}
      <div className="hidden md:flex items-center justify-between px-6 py-2.5 mb-8 bg-[#111827] rounded-xl border border-dashed border-white/10 text-[11px] text-slate-400 font-mono">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
          BAY ROW A (NORTH INGRESS)
        </span>
        <span className="tracking-widest uppercase text-slate-500 font-bold">◄ INGRESS / EGRESS DRIVING LANE ►</span>
        <span className="flex items-center gap-2">
          BAY ROW B (SOUTH EGRESS)
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400"></span>
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
                    ? 'bg-[#7c3aed]/15 border-[#7c3aed] glow-violet scale-[1.03] z-10'
                    : isBooked
                    ? 'bg-[#f43f5e]/[0.06] border-[#f43f5e]/30 opacity-75 cursor-not-allowed'
                    : isPartial
                    ? 'bg-[#f59e0b]/[0.06] border-[#f59e0b]/40 hover:border-[#f59e0b] hover:bg-[#f59e0b]/15 glow-amber cursor-pointer hover:-translate-y-1'
                    : 'bg-[#111827] border-[#84cc16]/40 hover:border-[#84cc16] hover:bg-[#84cc16]/10 glow-lime cursor-pointer hover:-translate-y-1'
                }
              `}
            >
              {/* Top Curb Line & Slot Identifier */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.06]">
                <span className="font-mono text-xs font-black tracking-wider text-slate-300 group-hover:text-white transition-colors">
                  BAY A-{slot.slot_number < 10 ? `0${slot.slot_number}` : slot.slot_number}
                </span>

                {isBooked ? (
                  <span className="h-2 w-2 rounded-full bg-[#f43f5e]" />
                ) : isPartial ? (
                  <span className="h-2 w-2 rounded-full bg-[#f59e0b] animate-pulse" />
                ) : isSelected ? (
                  <span className="h-2 w-2 rounded-full bg-[#7c3aed]" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-[#84cc16]" />
                )}
              </div>

              {/* Bay Silhouette / Vehicle Visual */}
              <div className="my-2 flex flex-col items-center justify-center py-4 bg-[#080b12]/80 rounded-xl border border-white/[0.04] group-hover:border-white/[0.08] transition-all">
                <Car 
                  className={`w-10 h-10 transition-transform duration-200 ${
                    isSelected
                      ? 'text-purple-400 scale-110'
                      : isBooked
                      ? 'text-[#f43f5e]/70'
                      : isPartial
                      ? 'text-[#f59e0b]/90 group-hover:scale-105'
                      : 'text-[#84cc16] group-hover:scale-105'
                  }`}
                />
                
                {/* Visual Wheel Stops / Parking Bay Curb */}
                <div className="w-12 h-1 bg-white/10 rounded-full mt-2" />
              </div>

              {/* Slot Status Tag */}
              <div className="pt-2 text-center">
                {isBooked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#f43f5e]">
                    <Lock className="w-3 h-3" /> OCCUPIED
                  </span>
                ) : isSelected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-300">
                    <CheckCircle2 className="w-3 h-3" /> SELECTED
                  </span>
                ) : isPartial ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#f59e0b]">
                    <Clock className="w-3 h-3" /> RESERVED SOON
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#84cc16]">
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


