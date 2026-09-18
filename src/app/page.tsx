"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import ZoneCard from '@/components/ZoneCard';
import { Search, Compass, Activity, ShieldCheck, Zap, Layers, ChevronRight, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

interface Zone {
  id: string;
  name: string;
  zone_type: string;
  price_per_hour: number;
  subscription_price: number;
  total_slots?: number;
  available_slots?: number;
}

export default function Home() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'hourly' | 'fixed' | 'subscription' | 'hybrid'>('all');

  useEffect(() => {
    const fetchZonesAndStats = async () => {
      try {
        // Fetch all zones
        const { data: zonesData, error: zonesErr } = await supabase
          .from('zones')
          .select('*')
          .order('name');
        
        if (zonesErr || !zonesData) {
          setLoading(false);
          return;
        }

        // Fetch all parking slots
        const { data: slotsData } = await supabase
          .from('parking_slots')
          .select('id, zone_id');

        // Fetch currently active bookings
        const now = new Date().toISOString();
        const { data: activeBookings } = await supabase
          .from('bookings')
          .select('slot_id, start_time, end_time')
          .eq('status', 'confirmed');

        const activeSlotIds = new Set<string>();
        activeBookings?.forEach(b => {
          const s = new Date(b.start_time);
          const e = new Date(b.end_time);
          const cur = new Date();
          if (cur >= s && cur <= e) {
            activeSlotIds.add(b.slot_id);
          }
        });

        // Compute slots count per zone
        const zoneSlotStats: Record<string, { total: number; available: number }> = {};
        slotsData?.forEach(slot => {
          if (!zoneSlotStats[slot.zone_id]) {
            zoneSlotStats[slot.zone_id] = { total: 0, available: 0 };
          }
          zoneSlotStats[slot.zone_id].total += 1;
          if (!activeSlotIds.has(slot.id)) {
            zoneSlotStats[slot.zone_id].available += 1;
          }
        });

        const enrichedZones: Zone[] = zonesData.map(z => ({
          ...z,
          total_slots: zoneSlotStats[z.id]?.total || 10,
          available_slots: zoneSlotStats[z.id]?.available ?? 7
        }));

        setZones(enrichedZones);
      } catch (err) {
        console.error('Error fetching zone data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchZonesAndStats();
  }, []);

  // Filtered Zones based on search and category
  const filteredZones = useMemo(() => {
    return zones.filter(zone => {
      const matchesSearch = zone.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            zone.zone_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedFilter === 'all' || zone.zone_type.toLowerCase() === selectedFilter;
      return matchesSearch && matchesCategory;
    });
  }, [zones, searchQuery, selectedFilter]);

  // Overall Global System Metrics
  const globalTotalSlots = zones.reduce((acc, z) => acc + (z.total_slots || 10), 0);
  const globalAvailableSlots = zones.reduce((acc, z) => acc + (z.available_slots || 0), 0);
  const globalOccupancyRate = globalTotalSlots > 0 ? Math.round(((globalTotalSlots - globalAvailableSlots) / globalTotalSlots) * 100) : 25;

  return (
    <div className="min-h-screen">
      
      {/* Hero Mobility Control Center Header */}
      <section className="relative pt-12 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/[0.06]">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-gradient-to-tr from-cyan-500/10 via-indigo-500/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-5">
            <Compass className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            Smart City Parking & Fleet Hub
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            Intelligent Parking <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
              Control & Reservation
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
            Real-time interactive parking bays, frictionless reservations, automated rate calculation, and instant payment checkout.
          </p>
        </div>

        {/* Global Live Mobility Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/[0.08] p-4 rounded-2xl flex flex-col items-center text-center">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Capacity</span>
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{globalTotalSlots}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Automated Bays</span>
          </div>

          <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/[0.08] p-4 rounded-2xl flex flex-col items-center text-center">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">Available Now</span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{globalAvailableSlots}</span>
            <span className="text-[10px] text-emerald-500/80 mt-0.5">Ready For Entry</span>
          </div>

          <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/[0.08] p-4 rounded-2xl flex flex-col items-center text-center">
            <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider mb-1">System Occupancy</span>
            <span className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">{globalOccupancyRate}%</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Real-time Load</span>
          </div>

          <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/[0.08] p-4 rounded-2xl flex flex-col items-center text-center">
            <span className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider mb-1">Active Zones</span>
            <span className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono">{zones.length}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">Multi-tier Hubs</span>
          </div>
        </div>
      </section>

      {/* Main Zones Navigation & Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Search and Category Filter Toolbar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search zones or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f172a] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-cyan-500 outline-none transition-all"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Zones' },
              { id: 'hourly', label: 'Hourly' },
              { id: 'fixed', label: 'Fixed Duration' },
              { id: 'subscription', label: 'Pro Pass' },
              { id: 'hybrid', label: 'Hybrid' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === tab.id
                    ? 'bg-cyan-500 text-[#0b1220] shadow-md shadow-cyan-500/20 font-bold'
                    : 'bg-[#0f172a] text-slate-400 hover:text-white border border-white/[0.05]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Zones Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-[#0f172a]/60 animate-pulse border border-white/[0.05]" />
            ))}
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="text-center py-20 bg-[#0f172a]/40 rounded-3xl border border-white/[0.06]">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No parking zones match your search</h3>
            <p className="text-slate-400 text-xs mb-4">Try clearing filters or checking another zone category.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}
              className="text-xs font-bold text-cyan-400 underline hover:text-cyan-300"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredZones.map((zone) => (
              <ZoneCard 
                key={zone.id}
                id={zone.id}
                name={zone.name}
                type={zone.zone_type}
                priceHour={zone.price_per_hour}
                priceSub={zone.subscription_price}
                totalSlots={zone.total_slots}
                availableSlots={zone.available_slots}
              />
            ))}
          </div>
        )}

        {/* Mobility Pro Banner CTA */}
        <div className="mt-16 bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900/80 border border-cyan-500/20 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> SmartPark Pro Membership
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Unlimited Access to Premium & VIP Zones
            </h3>
            <p className="text-slate-400 text-sm max-w-xl">
              Unlock reserved covered bays, fast EV charging priorities, automated license plate recognition, and discounted parking rates.
            </p>
          </div>

          <Link
            href="/subscriptions"
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold px-6 py-3.5 rounded-xl text-xs whitespace-nowrap shadow-xl shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <span>Explore Pro Passes</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </section>

    </div>
  );
}

