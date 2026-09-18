"use client";

import { X, Clock, AlertTriangle, Sparkles } from 'lucide-react';

interface ExtensionModalProps {
  bookingId: string;
  isPenalty: boolean;
  surcharge: number;
  onClose: () => void;
  onExtend: () => void;
}

export default function ExtensionModal({ bookingId, isPenalty, surcharge, onClose, onExtend }: ExtensionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-surface-1 border border-white/[0.08] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative">
        
        <div className="flex items-center justify-between p-6 border-b border-white/[0.08]">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-violet-400" />
            Extend Parking Bay
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-surface-2 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-slate-300 text-xs leading-relaxed">
            Add <span className="font-bold text-white font-mono">+30 minutes</span> to your current reservation before expiration.
          </p>

          <div className={`p-4 rounded-2xl border ${
            isPenalty 
              ? 'bg-rose-500/10 border-rose-500/30' 
              : 'bg-surface-2/60 border-white/[0.06]'
          }`}>
            {isPenalty && (
              <div className="flex items-center gap-1.5 text-rose-400 mb-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                Consecutive Extension Surcharge
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-xs font-medium">Extension Amount:</span>
              <span className={`text-xl font-black font-mono ${isPenalty ? 'text-rose-400' : 'text-lime-400'}`}>
                ₹{Math.round(surcharge * 80)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-midnight border-t border-white/[0.06] flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-white/[0.1] text-slate-300 hover:bg-surface-2 text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onExtend}
            className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-violet-600/30"
          >
            Confirm (+30m)
          </button>
        </div>

      </div>
    </div>
  );
}

