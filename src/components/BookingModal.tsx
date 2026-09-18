"use client";

import { useState } from 'react';
import { X, Clock, CalendarDays, ShieldCheck, CreditCard, ChevronRight } from 'lucide-react';
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
  
  // Calculate price directly in ₹ INR matching database configuration
  const displayRate = pricePerHour > 0 ? pricePerHour : 0;
  let totalPrice = 0;
  const isPaidZone = zoneType === 'fixed' || (zoneType === 'hybrid' && pricePerHour > 0);
  if (isPaidZone) {
    totalPrice = displayRate * durationHours;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#DDE5DF] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#DDE5DF] bg-[#FAF9F6]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center text-[#16A34A] font-mono font-bold text-sm">
              #{slotNumber < 10 ? `0${slotNumber}` : slotNumber}
            </div>
            <div>
              <h2 className="text-lg font-black text-[#17201D] tracking-tight">Reserve Bay #{slotNumber}</h2>
              <p className="text-xs text-[#64736C] uppercase tracking-wider font-semibold">
                {zoneType} Tier
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-[#ECF4EF] rounded-full transition-colors text-[#64736C] hover:text-[#17201D]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Time & Date Block */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#DDE5DF]">
              <span className="text-[11px] font-semibold text-[#64736C] block mb-1">Entry Time (Now)</span>
              <div className="flex items-center gap-2 text-[#17201D] font-mono text-xs font-bold">
                <CalendarDays className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>{format(startTime, 'MMM dd, HH:mm')}</span>
              </div>
            </div>

            <div className="bg-[#FAF9F6] p-3.5 rounded-2xl border border-[#DDE5DF]">
              <span className="text-[11px] font-semibold text-[#64736C] block mb-1">Estimated Exit</span>
              <div className="flex items-center gap-2 text-[#0F766E] font-mono text-xs font-bold">
                <Clock className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>{format(endTime, 'MMM dd, HH:mm')}</span>
              </div>
            </div>
          </div>

          {/* Interactive Duration Slider */}
          <div className="space-y-3 bg-[#FAF9F6] p-4 rounded-2xl border border-[#DDE5DF]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#17201D]">Parking Duration</label>
              <span className="px-3 py-1 bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] rounded-lg text-xs font-mono font-bold">
                {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
              </span>
            </div>

            <input 
              type="range" 
              min="1" 
              max="24" 
              value={durationHours} 
              onChange={(e) => setDurationHours(parseInt(e.target.value))}
              className="w-full accent-[#16A34A] h-2 bg-[#ECF4EF] rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#64736C] font-mono">
              <span>1 hr</span>
              <span>6 hrs</span>
              <span>12 hrs</span>
              <span>24 hrs</span>
            </div>
          </div>

          {/* Itemized Price Summary */}
          <div className="bg-[#FAF9F6] p-4 rounded-2xl border border-[#DDE5DF] space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#64736C]">
              <span>Base Rate</span>
              <span className="font-mono text-[#17201D]">
                {displayRate > 0 ? `₹${displayRate}/hr` : 'Covered in Pass'}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-[#64736C]">
              <span>Duration Period</span>
              <span className="font-mono text-[#17201D]">× {durationHours} hrs</span>
            </div>

            <div className="pt-2 border-t border-[#DDE5DF] flex items-center justify-between">
              <span className="text-xs font-bold text-[#17201D]">Total Parking Fee</span>
              <span className="text-xl font-black text-[#16A34A] font-mono">
                {totalPrice > 0 ? `₹${totalPrice.toLocaleString()}` : zoneType === 'hourly' ? 'Billed upon Exit' : 'Included in Pass'}
              </span>
            </div>
          </div>

          {/* Guarantee Pill (Emerald) */}
          <div className="flex items-center gap-2 text-[11px] text-[#16A34A] bg-[#DCFCE7] border border-[#BBF7D0] px-3.5 py-2.5 rounded-xl font-medium">
            <ShieldCheck className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
            <span>Instant bay reservation with ANPR automated gate access.</span>
          </div>

        </div>

        {/* Modal Footer / CTA */}
        <div className="p-6 bg-[#FAF9F6] border-t border-[#DDE5DF] flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-5 py-3.5 bg-white border border-[#DDE5DF] hover:bg-[#ECF4EF] text-[#64736C] font-bold rounded-xl text-xs transition-colors"
          >
            Cancel
          </button>
          
          <button 
            onClick={() => onBook(startTime, endTime)}
            className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-black py-3.5 px-5 rounded-xl text-xs transition-all shadow-md active:scale-[0.98] flex justify-center items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>{totalPrice > 0 ? `Pay ₹${totalPrice.toLocaleString()} via Razorpay` : 'Confirm Instant Reservation'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}



