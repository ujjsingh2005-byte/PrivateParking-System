"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ZoneCard from '@/components/ZoneCard';

interface Zone {
  id: string;
  name: string;
  zone_type: string;
  price_per_hour: number;
  subscription_price: number;
}

export default function Home() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchZones = async () => {
      const { data, error } = await supabase
        .from('zones')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setZones(data);
      }
      setLoading(false);
    };

    fetchZones();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-4">
          Find Your Perfect Spot
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Choose from completely dynamic, subscription-only, or conventional hourly parking zones. 
          Real-time availability ensures you never waste time searching for a spot again.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-slate-800 animate-pulse border border-slate-700" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {zones.map((zone) => (
            <ZoneCard 
              key={zone.id}
              id={zone.id}
              name={zone.name}
              type={zone.zone_type}
              priceHour={zone.price_per_hour}
              priceSub={zone.subscription_price}
            />
          ))}
        </div>
      )}

    </div>
  );
}
