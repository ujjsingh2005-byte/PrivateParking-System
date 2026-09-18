"use client";

import { useState } from 'react';
import { X, Clock, CalendarDays, ShieldCheck, Zap, CreditCard, ChevronRight } from 'lucide-react';
import { addHours, format } from 'date-fns';

interface BookingModalProps {
  slotNumber: number;
  zoneType: string;
  pricePerHour: number;
  onClose: () => void;
  onBook: (start: Date, end: Date) => void;
}

export default function BookingModal({ slotNumber, zoneType, pricePerHour, onClose, onBook }: BookingModalProps) {
  const [durationHours, setDurationHours] = useState(2);
  const [startTime] = useState(new Date());

  const endTime = addHours(startTime, durationHours);
  
  // Calculate price
  let totalPrice = 0;
  const isPaidZone = zoneType === 'fixed' || (zoneType === 'hybrid' && pricePerHour > 0);
  if (isPaidZone) {
    totalPrice = pricePerHour * durationHours;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-white/[0.1] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-[#0b1220]/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm">
              #{slotNumber < 10 ? `0${slotNumber}` : slotNumber}
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">Reserve Bay #{slotNumber}</h2>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                {zoneType} Parking Tier
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Time & Date Block */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#0b1220] p-3.5 rounded-2xl border border-white/[0.06]">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Start Time (Immediate)</span>
              <div className="flex items-center gap-2 text-white font-mono text-xs font-bold">
                <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                <span>{format(startTime, 'MMM dd, HH:mm')}</span>
              </div>
            </div>

            <div className="bg-[#0b1220] p-3.5 rounded-2xl border border-white/[0.06]">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Estimated Exit</span>
              <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>{format(endTime, 'MMM dd, HH:mm')}</span>
              </div>
            </div>
          </div>

          {/* Interactive Duration Slider */}
          <div className="space-y-3 bg-[#0b1220]/60 p-4 rounded-2xl border border-white/[0.06]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Parking Duration</label>
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-lg text-xs font-mono font-bold">
                {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
              </span>
            </div>

            <input 
              type="range" 
              min="1" 
              max="24" 
              value={durationHours} 
              onChange={(e) => setDurationHours(parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>1 hr</span>
              <span>6 hrs</span>
              <span>12 hrs</span>
              <span>24 hrs</span>
            </div>
          </div>

          {/* Itemized Price Summary */}
          <div className="bg-[#0b1220] p-4 rounded-2xl border border-white/[0.06] space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Base Hourly Rate</span>
              <span className="font-mono text-slate-200">
                {pricePerHour > 0 ? `$${pricePerHour.toFixed(2)}/hr` : 'Covered in Subscription'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Duration Multiplier</span>
              <span className="font-mono text-slate-200">× {durationHours} hrs</span>
            </div>

            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Total Booking Amount</span>
              <span className="text-xl font-black text-cyan-400 font-mono">
                {totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : zoneType === 'hourly' ? 'Billed on Exit' : 'Free / Included'}
              </span>
            </div>
          </div>

          {/* Guarantee Pill */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Instant bay reservation with guaranteed parking ingress.</span>
          </div>

        </div>

        {/* Modal Footer / CTA */}
        <div className="p-6 bg-[#0b1220]/90 border-t border-white/[0.08] flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>
          
          <button 
            onClick={() => onBook(startTime, endTime)}
            className="flex-1 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black py-3.5 px-5 rounded-xl text-xs transition-all shadow-xl shadow-cyan-500/20 active:scale-[0.98] flex justify-center items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>{totalPrice > 0 ? `Pay $${totalPrice.toFixed(2)} with Razorpay` : 'Confirm Instant Reservation'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

