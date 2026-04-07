import Link from 'next/link';
import { ArrowRight, Info } from 'lucide-react';

interface ZoneCardProps {
  id: string;
  name: string;
  type: string;
  priceHour: number;
  priceSub: number;
}

export default function ZoneCard({ id, name, type, priceHour, priceSub }: ZoneCardProps) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fixed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'hourly': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'subscription': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'hybrid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all hover:bg-slate-800/50 hover:shadow-xl hover:shadow-black/50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">{name}</h3>
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider ${getTypeColor(type)}`}>
            {type}
          </span>
        </div>
        <div className="h-10 w-10 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
          <Info className="w-5 h-5 text-slate-400" />
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {priceHour > 0 && (
          <div className="flex items-end gap-1">
            <span className="text-2xl font-bold text-white">${priceHour}</span>
            <span className="text-slate-400 text-sm mb-1">/hour</span>
          </div>
        )}
        {priceSub > 0 && (
          <div className="flex items-end gap-1">
            <span className="text-xl font-bold text-amber-400">${priceSub}</span>
            <span className="text-slate-400 text-sm mb-0.5">/mo sub</span>
          </div>
        )}
        {priceHour === 0 && priceSub === 0 && (
          <div className="text-slate-400 text-sm italic">Dynamic Pricing</div>
        )}
      </div>

      <Link 
        href={`/zone/${id}`}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl font-semibold transition-colors relative z-10"
      >
        View Slots
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}
