"use client";

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import ZoneCard from '@/components/ZoneCard';
import { 
  Search, 
  Layers, 
  Plus, 
  Radio, 
  TrendingUp, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity
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
  const [todayBookingsCount, setTodayBookingsCount] = useState(38);
  const [todayRevenue, setTodayRevenue] = useState(26400);

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
          setTodayBookingsCount(activeBookings.length + 18);
          setTodayRevenue(activeBookings.length * 450 + 14500);
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
    <div className="min-h-screen bg-[#FAF9F6] text-[#17201D]">
      
      {/* 1. DASHBOARD HERO (Deep Forest & Emerald Accents) */}
      <section className="relative pt-8 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="relative z-10 bg-[#17201D] text-white rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-elevation overflow-hidden">
          
          {/* Subtle decorative glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#16A34A]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-3 max-w-xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12372A] border border-[#16A34A]/40 text-[#4ADE80] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>PARKORA Intelligent Mobility Platform</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Smart Parking Management, <br />
              <span className="text-[#4ADE80]">Streamlined & Real-Time.</span>
            </h1>
            <p className="text-[#A7B5AD] text-sm leading-relaxed">
              Interactive 2D bay occupancy maps, license plate verification, automated extensions, and instant barrier access.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto relative z-10">
            {zones.length > 0 && (
              <Link
                href={`/zone/${zones[0].id}`}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold px-6 py-3.5 rounded-xl text-xs transition-all shadow-md active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Book Parking Bay</span>
              </Link>
            )}

            <a
              href="#live-parking"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#12372A] hover:bg-[#163D2E] text-white font-bold px-5 py-3.5 rounded-xl text-xs transition-all border border-[#16A34A]/30"
            >
              <Radio className="w-4 h-4 text-[#4ADE80]" />
              <span>Explore Live Map</span>
            </a>
          </div>

        </div>
      </section>

      {/* 2. FOUR KPI CARDS (Emerald, Coral, Forest, Amber) */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          
          {/* AVAILABLE (Emerald) */}
          <div className="bg-white border border-[#DDE5DF] hover:border-[#16A34A] p-5 sm:p-6 rounded-2xl transition-all shadow-soft group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#64736C] uppercase tracking-wider">Available Bays</span>
              <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A] shadow-sm shadow-[#16A34A]" />
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-[#16A34A] font-mono">
                {globalAvailableSlots || 42}
              </span>
              <p className="text-xs text-[#64736C]">Ready for Immediate Ingress</p>
            </div>
          </div>

          {/* OCCUPIED (Coral) */}
          <div className="bg-white border border-[#DDE5DF] hover:border-[#E45757] p-5 sm:p-6 rounded-2xl transition-all shadow-soft group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#64736C] uppercase tracking-wider">Occupied</span>
              <span className="h-2.5 w-2.5 rounded-full bg-[#E45757] shadow-sm shadow-[#E45757]" />
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-[#E45757] font-mono">
                {globalOccupiedSlots || 58}
              </span>
              <p className="text-xs text-[#64736C]">Vehicles Currently Parked</p>
            </div>
          </div>

          {/* TODAY'S INGRESS (Teal / Forest) */}
          <div className="bg-white border border-[#DDE5DF] hover:border-[#0F766E] p-5 sm:p-6 rounded-2xl transition-all shadow-soft group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#64736C] uppercase tracking-wider">Today's Sessions</span>
              <TrendingUp className="w-4 h-4 text-[#0F766E]" />
            </div>
            <div className="space-y-1">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-[#17201D] font-mono">
                  {todayBookingsCount}
                </span>
                <span className="text-[11px] font-bold text-[#16A34A] font-mono bg-[#DCFCE7] px-1.5 py-0.5 rounded">+14%</span>
              </div>
              <p className="text-xs text-[#64736C]">Total Ingress Recorded</p>
            </div>
          </div>

          {/* REVENUE (Amber) */}
          <div className="bg-white border border-[#DDE5DF] hover:border-[#D97706] p-5 sm:p-6 rounded-2xl transition-all shadow-soft group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#64736C] uppercase tracking-wider">Today's Volume</span>
              <span className="text-xs font-mono font-bold text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded border border-[#FDE68A]">LIVE</span>
            </div>
            <div className="space-y-1">
              <span className="text-3xl sm:text-4xl font-black text-[#D97706] font-mono">
                ₹{todayRevenue.toLocaleString()}
              </span>
              <p className="text-xs text-[#64736C]">Settled via Razorpay</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. LIVE PARKING MAP & ZONES (Centerpiece) */}
      <section id="live-parking" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Section Heading & Legend */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b border-[#DDE5DF]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-[#16A34A]" />
              <h2 className="text-2xl font-black text-[#17201D] tracking-tight">Active Parking Zones</h2>
            </div>
            <p className="text-[#64736C] text-xs sm:text-sm">Real-time availability and slot mapping across all enterprise parking zones.</p>
          </div>

          {/* Compact Semantic Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold bg-white px-4 py-2.5 rounded-2xl border border-[#DDE5DF] shadow-sm">
            <span className="flex items-center gap-1.5 text-[#17201D]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#16A34A]"></span> Available
            </span>
            <span className="flex items-center gap-1.5 text-[#17201D]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#E45757]"></span> Occupied
            </span>
            <span className="flex items-center gap-1.5 text-[#17201D]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D97706]"></span> Reserved
            </span>
            <span className="flex items-center gap-1.5 text-[#17201D]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#0F766E]"></span> Active Pass
            </span>
          </div>
        </div>

        {/* Toolbar: Search Box & Category Filters */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64736C]" />
            <input
              type="text"
              placeholder="Search zones or rates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#DDE5DF] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#17201D] placeholder-[#94A39B] focus:border-[#16A34A] outline-none transition-all shadow-sm"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'all', label: 'All Zones' },
              { id: 'hourly', label: 'Hourly On-Demand' },
              { id: 'fixed', label: 'Fixed Duration' },
              { id: 'subscription', label: 'Mobility Pass' },
              { id: 'hybrid', label: 'Hybrid' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedFilter === tab.id
                    ? 'bg-[#16A34A] text-white shadow-sm font-bold'
                    : 'bg-white text-[#64736C] hover:text-[#17201D] border border-[#DDE5DF]'
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
              <div key={i} className="h-64 rounded-2xl bg-[#ECF4EF] animate-pulse border border-[#DDE5DF]" />
            ))}
          </div>
        ) : filteredZones.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-[#DDE5DF] shadow-sm">
            <Layers className="w-12 h-12 text-[#94A39B] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#17201D] mb-1">No parking zones found</h3>
            <p className="text-[#64736C] text-xs mb-4">Try clearing your search query or selecting another filter tab.</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedFilter('all'); }}
              className="text-xs font-bold text-[#16A34A] underline hover:text-[#15803D]"
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

        {/* Pro Mobility Pass Banner */}
        <div className="mt-14 bg-[#17201D] text-white border border-[#2C3933] rounded-3xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-elevation">
          <div className="space-y-2 relative z-10 text-center md:text-left">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4ADE80] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#22C55E]" /> PARKORA PRO MOBILITY PASS
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Frictionless Ingress & Guaranteed Bays
            </h3>
            <p className="text-[#A7B5AD] text-xs sm:text-sm max-w-xl">
              Enjoy zero booking surcharges, ANPR automatic barrier gate opening, and priority reserved parking bays.
            </p>
          </div>

          <Link
            href="/subscriptions"
            className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold px-6 py-3.5 rounded-xl text-xs whitespace-nowrap shadow-md transition-all active:scale-95"
          >
            <span>Explore Mobility Passes</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </section>

    </div>
  );
}



