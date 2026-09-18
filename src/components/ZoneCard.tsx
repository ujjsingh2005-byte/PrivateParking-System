import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Video } from 'lucide-react';

interface ZoneCardProps {
  id: string;
  name: string;
  type: string;
  priceHour: number;
  priceSub: number;
  totalSlots?: number;
  availableSlots?: number;
}

export default function ZoneCard({ 
  id, 
  name, 
  type, 
  priceHour, 
  priceSub, 
  totalSlots = 10, 
  availableSlots = 7 
}: ZoneCardProps) {
  
  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fixed':
        return {
          label: 'Fixed Duration',
          classes: 'bg-[#ECF4EF] text-[#0F766E] border-[#DDE5DF]',
          dot: 'bg-[#0F766E]'
        };
      case 'hourly':
        return {
          label: 'Hourly On-Demand',
          classes: 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]',
          dot: 'bg-[#16A34A]'
        };
      case 'subscription':
        return {
          label: 'Pro Subscribers',
          classes: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
          dot: 'bg-[#D97706]'
        };
      case 'hybrid':
        return {
          label: 'Hybrid Access',
          classes: 'bg-[#ECF4EF] text-[#17201D] border-[#DDE5DF]',
          dot: 'bg-[#16A34A]'
        };
      default:
        return {
          label: type,
          classes: 'bg-[#ECF4EF] text-[#64736C] border-[#DDE5DF]',
          dot: 'bg-[#64736C]'
        };
    }
  };

  const badge = getTypeBadge(type);
  const occupancyPercent = totalSlots > 0 ? Math.round(((totalSlots - availableSlots) / totalSlots) * 100) : 30;

  return (
    <div className="group relative bg-white hover:border-[#16A34A] border border-[#DDE5DF] rounded-2xl p-6 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden">
      
      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.classes} mb-2`}>
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
            <h3 className="text-xl font-bold text-[#17201D] tracking-tight group-hover:text-[#16A34A] transition-colors">
              {name}
            </h3>
          </div>

          {/* Live Availability Status (Emerald / Amber / Coral) */}
          <div className="text-right">
            <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
              availableSlots > 2 
                ? 'text-[#16A34A] bg-[#DCFCE7] border-[#BBF7D0]' 
                : availableSlots > 0 
                ? 'text-[#D97706] bg-[#FEF3C7] border-[#FDE68A]' 
                : 'text-[#E45757] bg-[#FEE2E2] border-[#FECACA]'
            }`}>
              {availableSlots} Available
            </span>
          </div>
        </div>

        {/* Live Occupancy Gauge Bar */}
        <div className="space-y-1.5 mb-6">
          <div className="flex justify-between text-[11px] text-[#64736C]">
            <span>Occupancy Load</span>
            <span className="font-mono font-semibold text-[#17201D]">{occupancyPercent}%</span>
          </div>
          <div className="w-full h-2 bg-[#ECF4EF] rounded-full overflow-hidden border border-[#DDE5DF]">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPercent > 85 ? 'bg-[#E45757]' : occupancyPercent > 60 ? 'bg-[#D97706]' : 'bg-[#16A34A]'
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>

        {/* Pricing Specs */}
        <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#DDE5DF] mb-5 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-[#64736C]">Standard Rate</span>
            <span className="text-base font-bold text-[#17201D] font-mono">
              {priceHour > 0 ? `₹${priceHour * 50 || priceHour}` : 'Included in Pass'}
              {priceHour > 0 && <span className="text-[11px] font-normal text-[#64736C]">/hr</span>}
            </span>
          </div>
          {priceSub > 0 && (
            <div className="flex items-baseline justify-between pt-1 border-t border-[#DDE5DF]">
              <span className="text-xs text-[#64736C]">Monthly Mobility Pass</span>
              <span className="text-xs font-bold text-[#0F766E] font-mono">
                ₹{priceSub * 50 || priceSub}/mo
              </span>
            </div>
          )}
        </div>

        {/* Mobility Amenities */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#17201D] bg-[#ECF4EF] px-2 py-0.5 rounded border border-[#DDE5DF]">
            <Zap className="w-2.5 h-2.5 text-[#16A34A]" /> Fast EV Charging
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#17201D] bg-[#ECF4EF] px-2 py-0.5 rounded border border-[#DDE5DF]">
            <Video className="w-2.5 h-2.5 text-[#0F766E]" /> 24/7 ANPR Guard
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#17201D] bg-[#ECF4EF] px-2 py-0.5 rounded border border-[#DDE5DF]">
            <ShieldCheck className="w-2.5 h-2.5 text-[#16A34A]" /> Smart Gate
          </span>
        </div>
      </div>

      {/* Action Button (Emerald) */}
      <Link 
        href={`/zone/${id}`}
        className="w-full flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-sm active:scale-[0.98]"
      >
        <span>View & Book Bay</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>

    </div>
  );
}



