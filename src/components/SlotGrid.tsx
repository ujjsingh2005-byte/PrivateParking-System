"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Car, Zap, CheckCircle2, Lock, Clock, Sparkles } from 'lucide-react';

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
    // Fetch active bookings for these slots
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
          // If booked in future but not currently
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
    <div className="parking-bay-grid p-6 sm:p-8 bg-[#070d18] rounded-3xl border border-white/[0.08] relative overflow-hidden">
      
      {/* Central Driveway / Lane Marking Indicator */}
      <div className="hidden md:flex items-center justify-between px-6 py-2 mb-8 bg-[#0b1220]/80 rounded-xl border border-dashed border-white/10 text-[11px] text-slate-500 font-mono">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
          BAY ROW A (NORTH BOUND)
        </span>
        <span className="tracking-widest uppercase text-slate-600">◄ INGRESS / EGRESS DRIVEWAY ►</span>
        <span className="flex items-center gap-2">
          BAY ROW B (SOUTH BOUND)
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
        </span>
      </div>

      {/* Grid of Parking Bays */}
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
                relative group flex flex-col justify-between p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300
                ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-400 shadow-xl shadow-cyan-500/20 scale-[1.03] z-10'
                    : isBooked
                    ? 'bg-red-500/[0.04] border-red-500/20 opacity-70 cursor-not-allowed'
                    : isPartial
                    ? 'bg-amber-500/[0.04] border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10'
                    : 'bg-[#0f172a]/80 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10 cursor-pointer hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10'
                }
              `}
            >
              {/* Top Curb Line & Slot Identifier */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/[0.06]">
                <span className="font-mono text-xs font-black tracking-wider text-slate-400 group-hover:text-white transition-colors">
                  BAY #{slot.slot_number < 10 ? `0${slot.slot_number}` : slot.slot_number}
                </span>

                {isBooked ? (
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                ) : isPartial ? (
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                )}
              </div>

              {/* Bay Silhouette / Car Visual */}
              <div className="my-3 flex flex-col items-center justify-center py-4 bg-[#0b1220]/60 rounded-xl border border-white/[0.04] group-hover:border-white/[0.08] transition-all">
                <Car 
                  className={`w-10 h-10 transition-transform duration-300 ${
                    isSelected
                      ? 'text-cyan-400 scale-110'
                      : isBooked
                      ? 'text-red-500/60'
                      : isPartial
                      ? 'text-amber-400/80 group-hover:scale-110'
                      : 'text-emerald-400 group-hover:scale-110'
                  }`}
                />
                
                {/* Visual Wheel Stops / Parking Bay Curb */}
                <div className="w-12 h-1 bg-white/10 rounded-full mt-2" />
              </div>

              {/* Slot Status Tag */}
              <div className="pt-2 text-center">
                {isBooked ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-400">
                    <Lock className="w-3 h-3" /> Occupied
                  </span>
                ) : isSelected ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300">
                    <CheckCircle2 className="w-3 h-3" /> Selected
                  </span>
                ) : isPartial ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400">
                    <Clock className="w-3 h-3" /> Open Now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <Sparkles className="w-3 h-3" /> Available
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

