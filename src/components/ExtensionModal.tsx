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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-[#DDE5DF] w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative">
        
        <div className="flex items-center justify-between p-6 border-b border-[#DDE5DF] bg-[#FAF9F6]">
          <h2 className="text-lg font-black text-[#17201D] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#16A34A]" />
            Extend Parking Bay
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-[#ECF4EF] rounded-xl transition-colors text-[#64736C] hover:text-[#17201D]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <p className="text-[#64736C] text-xs leading-relaxed">
            Add <span className="font-bold text-[#17201D] font-mono">+30 minutes</span> to your current reservation before expiration.
          </p>

          <div className={`p-4 rounded-2xl border ${
            isPenalty 
              ? 'bg-[#FEE2E2] border-[#FECACA]' 
              : 'bg-[#FAF9F6] border-[#DDE5DF]'
          }`}>
            {isPenalty && (
              <div className="flex items-center gap-1.5 text-[#E45757] mb-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                Consecutive Extension Surcharge
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-[#64736C] text-xs font-medium">Extension Amount:</span>
              <span className={`text-xl font-black font-mono ${isPenalty ? 'text-[#E45757]' : 'text-[#16A34A]'}`}>
                ₹{Math.round(surcharge * 80)}
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-[#FAF9F6] border-t border-[#DDE5DF] flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-[#DDE5DF] bg-white text-[#64736C] hover:bg-[#ECF4EF] text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onExtend}
            className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
          >
            Confirm (+30m)
          </button>
        </div>

      </div>
    </div>
  );
}


