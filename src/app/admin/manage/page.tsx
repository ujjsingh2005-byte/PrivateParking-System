"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Plus, Trash2, Edit3, Layers, LayoutGrid, X, Save, AlertCircle } from 'lucide-react';

export default function AdminManagePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  
  // Modal states
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [zoneForm, setZoneForm] = useState({ name: '', zone_type: 'fixed', price_per_hour: 0, subscription_price: 0 });

  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [slotForm, setSlotForm] = useState({ slot_number: 1, price_override: 0 });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return setLoading(false);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role === 'admin') {
      setIsAdmin(true);
      fetchZones();
    }
    setLoading(false);
  };

  const fetchZones = async () => {
    const { data } = await supabase.from('zones').select('*').order('name');
    if (data) setZones(data);
  };

  const fetchSlots = async (zoneId: string) => {
    const { data } = await supabase
      .from('parking_slots')
      .select('*')
      .eq('zone_id', zoneId)
      .order('slot_number');
    if (data) setSlots(data);
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('zones').insert(zoneForm).select().single();
    if (error) alert(error.message);
    else {
      setShowZoneModal(false);
      fetchZones();
      setZoneForm({ name: '', zone_type: 'fixed', price_per_hour: 0, subscription_price: 0 });
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (confirm('Are you sure? This will delete all slots and bookings associated with this zone.')) {
      await supabase.from('zones').delete().eq('id', id);
      fetchZones();
      if (selectedZone?.id === id) {
        setSelectedZone(null);
        setSlots([]);
      }
    }
  };

  const handleAddSlot = async () => {
    if (!selectedZone) return;
    const nextNumber = slots.length > 0 ? Math.max(...slots.map(s => s.slot_number)) + 1 : 1;
    setSlotForm({ slot_number: nextNumber, price_override: 0 });
    setShowSlotModal(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedZone) return;

    const payload = {
      zone_id: selectedZone.id,
      slot_number: slotForm.slot_number,
      price_per_hour_override: slotForm.price_override > 0 ? slotForm.price_override : null
    };

    let error;
    if (selectedSlot) {
      const { error: err } = await supabase.from('parking_slots').update(payload).eq('id', selectedSlot.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('parking_slots').insert(payload);
      error = err;
    }

    if (error) alert(error.message);
    else {
      setShowSlotModal(false);
      setSelectedSlot(null);
      fetchSlots(selectedZone.id);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (confirm('Delete this slot?')) {
      await supabase.from('parking_slots').delete().eq('id', slotId);
      fetchSlots(selectedZone.id);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Loading Management...</div>;
  if (!isAdmin) return <div className="p-12 text-center text-red-500 font-bold">Access Denied</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2">Management Console</h1>
          <p className="text-slate-400">Control zones, manage slots, and configure your parking infrastructure.</p>
        </div>
        <button 
          onClick={() => setShowZoneModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20"
        >
          <Plus className="w-5 h-5" /> Add New Zone
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Zone List */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" /> Available Zones
          </h2>
          <div className="space-y-3">
            {zones.map(zone => (
              <div 
                key={zone.id}
                onClick={() => { setSelectedZone(zone); fetchSlots(zone.id); }}
                className={`group p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden ${selectedZone?.id === zone.id ? 'bg-slate-900 border-blue-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg mb-1">{zone.name}</h3>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {zone.zone_type}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteZone(zone.id); }}
                    className="p-2 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slot Manager */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> Slot Manager
          </h2>
          {selectedZone ? (
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 min-h-[500px] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedZone.name}</h3>
                  <p className="text-slate-500 text-sm">Managing {slots.length} parking slots</p>
                </div>
                <button 
                  onClick={handleAddSlot}
                  className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Slot
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 flex-1 content-start">
                {slots.map(slot => (
                  <div 
                    key={slot.id} 
                    onClick={() => { setSelectedSlot(slot); setSlotForm({ slot_number: slot.slot_number, price_override: slot.price_per_hour_override || 0 }); setShowSlotModal(true); }}
                    className="bg-slate-950 border border-slate-800 p-4 rounded-2xl flex flex-col items-center justify-center relative group hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <span className="text-2xl font-black text-slate-700 group-hover:text-white transition-colors mb-2">#{slot.slot_number}</span>
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[10px] font-bold uppercase tracking-tighter ${slot.price_per_hour_override ? 'text-amber-400' : 'text-emerald-500/50'}`}>
                        {slot.price_per_hour_override ? `$${slot.price_per_hour_override}/hr` : 'Default Zone Price'}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                      className="absolute top-2 right-2 p-1 text-slate-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {slots.length === 0 && (
                  <div className="col-span-full h-48 flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                    <p className="font-medium">No slots in this zone yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-slate-900 border border-slate-800 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-slate-600">
              <Settings className="w-16 h-16 mb-4 opacity-10 animate-spin-slow" />
              <h3 className="text-xl font-bold text-slate-500 mb-1">No Zone Selected</h3>
              <p className="text-slate-600 text-center max-w-xs text-sm">Select a zone from the sidebar to manage its slots and configuration.</p>
            </div>
          )}
        </div>
      </div>

      {/* Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-3xl animate-in fade-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-3">
                  <LayoutGrid className="w-5 h-5 text-blue-500" /> 
                  {selectedSlot ? 'Edit Slot' : 'Create Slot'}
                </h3>
                <button onClick={() => { setShowSlotModal(false); setSelectedSlot(null); }} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
             </div>
             <form onSubmit={handleSaveSlot} className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Slot Number</label>
                   <input 
                    type="number" 
                    required 
                    value={slotForm.slot_number} 
                    onChange={e => setSlotForm({...slotForm, slot_number: Number(e.target.value)})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Price Override ($/hr)</label>
                   <input 
                    type="number" 
                    step="0.01"
                    value={slotForm.price_override} 
                    onChange={e => setSlotForm({...slotForm, price_override: Number(e.target.value)})}
                    placeholder="0.00 (uses zone price)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none"
                   />
                   <p className="text-[10px] text-slate-500 italic">Leave at 0 to use the default zone price (${selectedZone.price_per_hour}/hr).</p>
                </div>
                
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all flex justify-center items-center gap-2 mt-2">
                   <Save className="w-5 h-5" /> {selectedSlot ? 'Update Slot' : 'Create Slot'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Zone Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-3xl animate-in fade-in zoom-in-95 duration-200">
             <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                <h3 className="text-2xl font-bold flex items-center gap-3"><Edit3 className="w-6 h-6 text-blue-500" /> Create New Zone</h3>
                <button onClick={() => setShowZoneModal(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
             </div>
             <form onSubmit={handleCreateZone} className="p-8 space-y-6">
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Name</label>
                   <input 
                    type="text" 
                    required 
                    value={zoneForm.name} 
                    onChange={e => setZoneForm({...zoneForm, name: e.target.value})}
                    placeholder="e.g. VIP Underground" 
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Type</label>
                   <select 
                    value={zoneForm.zone_type} 
                    onChange={e => setZoneForm({...zoneForm, zone_type: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none"
                   >
                     <option value="fixed">Fixed Rate</option>
                     <option value="hourly">Hourly Auto</option>
                     <option value="subscription">Subscription Only</option>
                     <option value="hybrid">Hybrid Mode</option>
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Price/hr</label>
                      <input 
                        type="number" 
                        value={zoneForm.price_per_hour} 
                        onChange={e => setZoneForm({...zoneForm, price_per_hour: Number(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none"
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Sub/mo</label>
                      <input 
                        type="number" 
                        value={zoneForm.subscription_price} 
                        onChange={e => setZoneForm({...zoneForm, subscription_price: Number(e.target.value)})}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:border-blue-500 outline-none"
                      />
                  </div>
                </div>
                
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl transition-all flex justify-center items-center gap-2 mt-4">
                   <Save className="w-5 h-5" /> Save Configuration
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}
