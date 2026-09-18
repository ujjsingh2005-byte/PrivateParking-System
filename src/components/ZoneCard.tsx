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
          classes: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
          dot: 'bg-indigo-400'
        };
      case 'hourly':
        return {
          label: 'Hourly On-Demand',
          classes: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          dot: 'bg-cyan-400'
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
          classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-400'
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
    <div className="group relative bg-[#0f172a]/70 hover:bg-[#0f172a] border border-white/[0.08] hover:border-cyan-500/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col justify-between overflow-hidden">
      
      {/* Subtle background ambient highlight */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-all" />

      <div>
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.classes} mb-2`}>
              <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
              {badge.label}
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
              {name}
            </h3>
          </div>

          {/* Live Availability Status */}
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              {availableSlots} Open
            </span>
          </div>
        </div>

        {/* Live Occupancy Gauge Bar */}
        <div className="space-y-1.5 mb-6">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Occupancy Level</span>
            <span className="font-mono text-slate-300">{occupancyPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                occupancyPercent > 85 ? 'bg-red-500' : occupancyPercent > 60 ? 'bg-amber-500' : 'bg-gradient-to-r from-cyan-500 to-emerald-400'
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </div>
        </div>

        {/* Pricing Specs */}
        <div className="p-3.5 bg-[#0b1220]/80 rounded-xl border border-white/[0.05] mb-5 space-y-1.5">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-400">Hourly Rate</span>
            <span className="text-base font-bold text-white font-mono">
              {priceHour > 0 ? `$${priceHour.toFixed(2)}` : 'Included in Sub'}
              {priceHour > 0 && <span className="text-[11px] font-normal text-slate-400">/hr</span>}
            </span>
          </div>
          {priceSub > 0 && (
            <div className="flex items-baseline justify-between pt-1 border-t border-white/[0.04]">
              <span className="text-xs text-slate-400">Monthly Pass</span>
              <span className="text-xs font-bold text-cyan-400 font-mono">
                ${priceSub.toFixed(2)}/mo
              </span>
            </div>
          )}
        </div>

        {/* Mobility Amenities */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-white/[0.04]">
            <Zap className="w-2.5 h-2.5 text-cyan-400" /> Fast Charging
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-white/[0.04]">
            <Video className="w-2.5 h-2.5 text-slate-400" /> 24/7 CCTV
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-white/[0.04]">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" /> Automated Barrier
          </span>
        </div>
      </div>

      {/* Action Button */}
      <Link 
        href={`/zone/${id}`}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-[#0b1220] font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-cyan-500/10 group-hover:shadow-cyan-500/25"
      >
        <span>Select Parking Bay</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>

    </div>
  );
}

