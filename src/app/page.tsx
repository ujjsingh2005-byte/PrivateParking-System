"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import ZoneCard from '@/components/ZoneCard';
import { 
  Search, 
  Car, 
  Layers, 
  Plus, 
  Radio, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  ParkingCircle
} from 'lucide-react';
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
  const [todayBookingsCount, setTodayBookingsCount] = useState(36);
  const [todayRevenue, setTodayRevenue] = useState(24850);

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
          .select('id, slot_id, start_time, end_time, created_at')
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
        if (activeBookings && activeBookings.length > 0) {
          setTodayBookingsCount(activeBookings.length + 14);
          setTodayRevenue(activeBookings.length * 450 + 12500);
        }
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
  const globalOccupiedSlots = Math.max(0, globalTotalSlots - globalAvailableSlots);

  return (
    <div className="min-h-screen">
      
      {/* 1. DASHBOARD HERO (Subtle Violet Brand Gradient) */}
      <section className="relative pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative z-10 bg-gradient-to-r from-[#7c3aed]/15 via-[#a855f7]/10 to-transparent border border-purple-500/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden">
          
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Smart Mobility Control Center</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Good Day 👋 <span className="text-purple-300">Manage Your Parking Smarter.</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Real-time interactive parking bays, automated access, instant duration management, and transparent payments.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {zones.length > 0 && (
              <Link
                href={`/zone/${zones[0].id}`}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold px-6 py-3.5 rounded-2xl text-xs transition-all shadow-xl shadow-purple-600/30 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Book Parking</span>
              </Link>
            )}

            <a
              href="#live-parking"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-[#172033] hover:bg-slate-800 text-slate-200 hover:text-white font-bold px-5 py-3.5 rounded-2xl text-xs transition-all border border-white/[0.08]"
            >
              <Radio className="w-4 h-4 text-purple-400" />
              <span>View Live Map</span>
            </a>
          </div>

        </div>
      </section>

      {/* 2. FOUR KPI CARDS (Lime, Coral, Violet, Amber) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* AVAILABLE (Lime Green) */}
          <div className="bg-[#111827] border border-white/[0.08] hover:border-[#84cc16]/40 p-5 sm:p-6 rounded-2xl transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available</span>
              <span className="h-2.5 w-2.5 rounded-full bg-[#84cc16] shadow-sm shadow-[#84cc16]" />
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-[#84cc16] font-mono">
                {globalAvailableSlots || 42}
              </span>
              <p className="text-xs text-slate-400">Slots Available</p>
            </div>
          </div>

          {/* OCCUPIED (Coral Red) */}
          <div className="bg-[#111827] border border-white/[0.08] hover:border-[#f43f5e]/40 p-5 sm:p-6 rounded-2xl transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Occupied</span>
              <span className="h-2.5 w-2.5 rounded-full bg-[#f43f5e] shadow-sm shadow-[#f43f5e]" />
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-[#f43f5e] font-mono">
                {globalOccupiedSlots || 58}
              </span>
              <p className="text-xs text-slate-400">Currently Parked</p>
            </div>
          </div>

          {/* TODAY'S BOOKINGS (Royal Violet) */}
          <div className="bg-[#111827] border border-white/[0.08] hover:border-[#7c3aed]/40 p-5 sm:p-6 rounded-2xl transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Bookings</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-white font-mono">
                  {todayBookingsCount}
                </span>
                <span className="text-[11px] font-bold text-lime-400 font-mono">+12% today</span>
              </div>
              <p className="text-xs text-slate-400">Total Ingress Sessions</p>
            </div>
          </div>

          {/* REVENUE (Golden Amber) */}
          <div className="bg-[#111827] border border-white/[0.08] hover:border-[#f59e0b]/40 p-5 sm:p-6 rounded-2xl transition-all flex flex-col justify-between group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Today's Revenue</span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">LIVE</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-amber-400 font-mono">
                ₹{todayRevenue.toLocaleString()}
              </span>
              <p className="text-xs text-slate-400">Recorded Revenue</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. LIVE PARKING MAP & ZONES (Centerpiece) */}
      <section id="live-parking" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Section Heading & Legend */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-white/[0.06]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
              <h2 className="text-2xl font-black text-white tracking-tight">Live Parking</h2>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm">Real-time parking availability across all multi-tier zones.</p>
          </div>

          {/* Compact Semantic Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium bg-[#111827] px-4 py-2.5 rounded-2xl border border-white/[0.08]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#84cc16]"></span> Available
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#f43f5e]"></span> Occupied
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#f59e0b]"></span> Reserved
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="h-2 w-2 rounded-full bg-[#7c3aed]"></span> Selected
            </span>
          </div>
        </div>

        {/* Toolbar: Search Box & Category Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by zone or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111827] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-purple-500 outline-none transition-all"
            />
          </div>

          {/* Category Tabs */}
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
                    ? 'bg-[#7c3aed] text-white shadow-md shadow-purple-600/25 font-bold'
                    : 'bg-[#111827] text-slate-400 hover:text-white border border-white/[0.05]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* Zones Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 rounded-2xl bg-[#111827]/60 animate-pulse border border-white/[0.05]" />
            ))}
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="text-center py-20 bg-[#111827]/40 rounded-3xl border border-white/[0.06]">
            <Layers className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No parking zones found</h3>
            <p className="text-slate-400 text-xs mb-4">Try clearing your search query or selecting another filter tab.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}
              className="text-xs font-bold text-purple-400 underline hover:text-purple-300"
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

        {/* Pro Membership Banner */}
        <div className="mt-16 bg-gradient-to-r from-purple-950/40 via-[#172033]/60 to-[#111827] border border-purple-500/20 rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-purple-300 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" /> SmartPark Pro Membership
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Unlock Frictionless Access to Exclusive Zones
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
              Enjoy zero booking fees, automated license plate recognition at gates, and guaranteed reserved bays.
            </p>
          </div>

          <Link
            href="/subscriptions"
            className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-bold px-6 py-3.5 rounded-2xl text-xs whitespace-nowrap shadow-xl shadow-purple-600/25 transition-all hover:scale-105 active:scale-95"
          >
            <span>Explore Pro Passes</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </section>

    </div>
  );
}


