import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Video, CheckCircle2, AlertCircle } from 'lucide-react';

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
          classes: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400'
        };
      case 'hourly':
        return {
          label: 'Hourly On-Demand',
          classes: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
          dot: 'bg-sky-400'
        };
      case 'subscription':
        return {
          label: 'Pro Subscribers Only',
          classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          dot: 'bg-amber-400'
        };
      case 'hybrid':
        return {
          label: 'Hybrid (Pay or Sub)',
          classes: 'bg-lime-500/10 text-lime-400 border-lime-500/30',
          dot: 'bg-lime-400'
        };
      default:
        return {
          label: type,
          classes: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
          dot: 'bg-slate-400'
        };
    }
  };

  const badge = getTypeBadge(type);
  const occupancyPercent = totalSlots > 0 ? Math.round(((totalSlots - availableSlots) / totalSlots) * 100) : 30;

  return (
    <div className="group relative bg-[#111827] hover:bg-[#172033] border border-white/[0.08] hover:border-purple-500/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-purple-600/10 flex flex-col justify-between overflow-hidden">
      
      {/* Subtle top ambient glow on hover */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-2xl pointer-events-none group-hover:bg-purple-600/10 transition-all" />

      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.classes} mb-2`}>
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-purple-300 transition-colors">
              {name}
            </h3>
          </div>

          {/* Live Availability Status (Lime Green) */}
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[#84cc16] bg-[#84cc16]/10 px-2.5 py-1 rounded-md border border-[#84cc16]/20">
              {availableSlots} Available
            </span>
          </div>
        </div>

        {/* Live Occupancy Gauge Bar */}
        <div className="space-y-1.5 mb-6">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Occupancy Load</span>
            <span className="font-mono text-slate-300">{occupancyPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-[#080b12] rounded-full overflow-hidden border border-white/[0.04]">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPercent > 85 ? 'bg-[#f43f5e]' : occupancyPercent > 60 ? 'bg-[#f59e0b]' : 'bg-gradient-to-r from-[#84cc16] to-[#7c3aed]'
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>

        {/* Pricing Specs */}
        <div className="p-3.5 bg-[#080b12] rounded-xl border border-white/[0.05] mb-5 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Standard Rate</span>
            <span className="text-base font-bold text-white font-mono">
              {priceHour > 0 ? `₹${priceHour * 50 || priceHour}` : 'Included in Sub'}
              {priceHour > 0 && <span className="text-[11px] font-normal text-slate-400">/hr</span>}
            </span>
          </div>
          {priceSub > 0 && (
            <div className="flex items-baseline justify-between pt-1 border-t border-white/[0.04]">
              <span className="text-xs text-slate-400">Monthly Pass</span>
              <span className="text-xs font-bold text-amber-400 font-mono">
                ₹{priceSub * 50 || priceSub}/mo
              </span>
            </div>
          )}
        </div>

        {/* Mobility Amenities */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 bg-[#080b12] px-2 py-0.5 rounded border border-white/[0.04]">
            <Zap className="w-2.5 h-2.5 text-purple-400" /> Fast EV Charging
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 bg-[#080b12] px-2 py-0.5 rounded border border-white/[0.04]">
            <Video className="w-2.5 h-2.5 text-slate-400" /> 24/7 Monitored
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-300 bg-[#080b12] px-2 py-0.5 rounded border border-white/[0.04]">
            <ShieldCheck className="w-2.5 h-2.5 text-lime-400" /> Auto Barrier
          </span>
        </div>
      </div>

      {/* Action Button (Royal Violet) */}
      <Link 
        href={`/zone/${id}`}
        className="w-full flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-purple-600/20 group-hover:shadow-purple-600/35 active:scale-[0.98]"
      >
        <span>View & Book Bay</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>

    </div>
  );
}


