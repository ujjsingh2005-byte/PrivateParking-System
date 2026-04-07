"use client";

import { useState } from 'react';
import { X, Clock, CalendarDays } from 'lucide-react';
import { addHours, format } from 'date-fns';

interface BookingModalProps {
  slotNumber: number;
  zoneType: string;
  pricePerHour: number;
  onClose: () => void;
  onBook: (start: Date, end: Date) => void;
}

export default function BookingModal({ slotNumber, zoneType, pricePerHour, onClose, onBook }: BookingModalProps) {
  const [durationHours, setDurationHours] = useState(1);
  const [startTime, setStartTime] = useState(new Date());

  const endTime = addHours(startTime, durationHours);
  
  // Calculate price
  let totalPrice = 0;
  if (zoneType === 'fixed' || zoneType === 'hybrid') {
    totalPrice = pricePerHour * durationHours;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold">Book Slot #{slotNumber}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400 block">Start Time</label>
            <div className="flex items-center gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <CalendarDays className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-white">{format(startTime, 'MMM dd, yyyy - HH:mm')}</span>
            </div>
            <p className="text-xs text-slate-500">* Starting immediately for this demo.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-400 block">Duration (Hours)</label>
            <div className="flex items-center gap-4">
              <input 
                type="range" 
                min="1" max="24" 
                value={durationHours} 
                onChange={(e) => setDurationHours(parseInt(e.target.value))}
                className="flex-1 accent-blue-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="bg-slate-800 px-4 py-2 rounded-lg font-bold min-w-[80px] text-center border border-slate-700">
                {durationHours} h
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">End Time</span>
              <span className="font-medium">{format(endTime, 'HH:mm (MMM d)')}</span>
            </div>
            {pricePerHour > 0 && (
              <div className="flex items-center justify-between text-lg">
                <span className="text-slate-400">Total Price</span>
                <span className="font-bold text-emerald-400">${totalPrice.toFixed(2)}</span>
              </div>
            )}
            {zoneType === 'subscription' && (
              <div className="flex items-center justify-between text-lg">
                <span className="text-slate-400">Pricing</span>
                <span className="font-bold text-amber-400">Subscription Only</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 bg-slate-950 border-t border-slate-800">
          <button 
            onClick={() => onBook(startTime, endTime)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-colors flex justify-center items-center gap-2"
          >
            Confirm & Pay
            <Clock className="w-5 h-5" />
          </button>
        </div>

      </div>
    </div>
  );
}
