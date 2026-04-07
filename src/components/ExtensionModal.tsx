"use client";

import { X, Clock, AlertTriangle } from 'lucide-react';

interface ExtensionModalProps {
  bookingId: string;
  isPenalty: boolean;
  surcharge: number;
  onClose: () => void;
  onExtend: () => void;
}

export default function ExtensionModal({ bookingId, isPenalty, surcharge, onClose, onExtend }: ExtensionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Extend Booking
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-slate-300">
            You can extend your booking by exactly <span className="font-bold text-white">30 minutes</span>.
          </p>

          <div className={`p-4 rounded-xl border ${isPenalty ? 'bg-red-500/10 border-red-500/50' : 'bg-slate-800 border-slate-700'}`}>
            {isPenalty && (
              <div className="flex items-center gap-2 text-red-400 mb-2 font-semibold text-sm">
                <AlertTriangle className="w-4 h-4" />
                Penalty Pricing Applied
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Extension Cost:</span>
              <span className={`text-xl font-bold ${isPenalty ? 'text-red-400' : 'text-emerald-400'}`}>
                ${surcharge.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-950 border-t border-slate-800 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onExtend}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors"
          >
            Pay & Extend
          </button>
        </div>

      </div>
    </div>
  );
}
