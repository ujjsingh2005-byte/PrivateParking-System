"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Plus, Trash2, Edit3, Layers, LayoutGrid, X, Save, AlertCircle, Sparkles } from 'lucide-react';

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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="h-10 w-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64736C] text-xs font-mono tracking-wide">Loading Management Console...</p>
      </div>
    );
  }
  if (!isAdmin) {
    if (typeof window !== 'undefined') window.location.href = '/';
    return <div className="p-12 text-center text-[#E45757] font-bold text-xs">Access Denied - Redirecting...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-[11px] font-bold text-[#16A34A] font-mono uppercase tracking-wider mb-1">Infrastructure Control</div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#17201D] tracking-tight">Zone & Slot Management</h1>
          <p className="text-[#64736C] text-xs sm:text-sm mt-1">Control zones, manage slot allocations, and configure pricing models.</p>
        </div>
        <button 
          onClick={() => setShowZoneModal(true)}
          className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-md active:scale-95 text-xs uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Add New Zone
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Zone List */}
        <div className="lg:col-span-4 space-y-4">
          <h2 className="text-xs font-bold text-[#64736C] uppercase tracking-wider mb-4 flex items-center gap-2 font-mono">
            <Layers className="w-4 h-4 text-[#16A34A]" /> Configured Hubs ({zones.length})
          </h2>
          <div className="space-y-3">
            {zones.map(zone => (
              <div 
                key={zone.id}
                onClick={() => { setSelectedZone(zone); fetchSlots(zone.id); }}
                className={`group p-5 rounded-3xl border-2 transition-all cursor-pointer relative overflow-hidden shadow-card ${
                  selectedZone?.id === zone.id 
                    ? 'bg-[#DCFCE7]/40 border-[#16A34A] shadow-md' 
                    : 'bg-white border-[#DDE5DF] hover:border-[#16A34A]/50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-[#17201D] text-base mb-1">{zone.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-[#16A34A] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#BBF7D0] font-mono">
                        {zone.zone_type}
                      </span>
                      <span className="text-xs text-[#64736C] font-mono font-semibold">
                        {zone.price_per_hour > 0 ? `₹${zone.price_per_hour}/hr` : 'Free Tier'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteZone(zone.id); }}
                    className="p-2 text-[#94A39B] hover:text-[#E45757] hover:bg-[#FEE2E2] rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete Zone"
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
          <h2 className="text-xs font-bold text-[#64736C] uppercase tracking-wider flex items-center gap-2 font-mono">
            <LayoutGrid className="w-4 h-4 text-[#16A34A]" /> Slot Bay Grid
          </h2>
          {selectedZone ? (
            <div className="bg-white border border-[#DDE5DF] rounded-3xl p-8 min-h-[500px] flex flex-col shadow-card">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#DDE5DF]">
                <div>
                  <h3 className="text-2xl font-black text-[#17201D] tracking-tight">{selectedZone.name}</h3>
                  <p className="text-[#64736C] text-xs font-mono mt-0.5">Managing {slots.length} parking bays</p>
                </div>
                <button 
                  onClick={handleAddSlot}
                  className="bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#15803D] border border-[#86EFAC] px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 font-mono uppercase tracking-wider shadow-sm"
                >
                  <Plus className="w-4 h-4 text-[#16A34A]" /> Add Slot Bay
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 flex-1 content-start">
                {slots.map(slot => (
                  <div 
                    key={slot.id} 
                    onClick={() => { setSelectedSlot(slot); setSlotForm({ slot_number: slot.slot_number, price_override: slot.price_per_hour_override || 0 }); setShowSlotModal(true); }}
                    className="bg-[#FAF9F6] border border-[#DDE5DF] p-4 rounded-2xl flex flex-col items-center justify-center relative group hover:border-[#16A34A] hover:bg-white hover:shadow-md transition-all cursor-pointer"
                  >
                    <span className="text-2xl font-black text-[#17201D] group-hover:text-[#16A34A] transition-colors mb-2 font-mono">#{slot.slot_number}</span>
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-[10px] font-bold uppercase tracking-wider font-mono ${slot.price_per_hour_override ? 'text-[#D97706]' : 'text-[#16A34A]'}`}>
                        {slot.price_per_hour_override ? `₹${slot.price_per_hour_override}/hr` : 'Standard'}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteSlot(slot.id); }}
                      className="absolute top-2 right-2 p-1.5 text-[#94A39B] hover:text-[#E45757] hover:bg-[#FEE2E2] rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {slots.length === 0 && (
                  <div className="col-span-full h-48 flex flex-col items-center justify-center text-[#94A39B] border-2 border-dashed border-[#DDE5DF] rounded-3xl">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-40 text-[#64736C]" />
                    <p className="font-semibold text-xs text-[#64736C]">No slot bays configured in this zone yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white border border-[#DDE5DF] border-dashed rounded-3xl flex flex-col items-center justify-center p-12 text-[#94A39B] shadow-card">
              <Settings className="w-12 h-12 mb-4 opacity-30 text-[#64736C]" />
              <h3 className="text-base font-bold text-[#17201D] mb-1">No Zone Selected</h3>
              <p className="text-[#64736C] text-center max-w-xs text-xs">Select a parking zone from the left to manage its slots and custom hourly overrides.</p>
            </div>
          )}
        </div>
      </div>

      {/* Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#DDE5DF] w-full max-w-sm rounded-3xl overflow-hidden shadow-elevation">
             <div className="p-6 border-b border-[#DDE5DF] flex justify-between items-center bg-[#FAF9F6]">
                <h3 className="text-lg font-black text-[#17201D] flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5 text-[#16A34A]" /> 
                  {selectedSlot ? 'Edit Bay Slot' : 'Create Bay Slot'}
                </h3>
                <button onClick={() => { setShowSlotModal(false); setSelectedSlot(null); }} className="text-[#64736C] hover:text-[#17201D] transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <form onSubmit={handleSaveSlot} className="p-6 space-y-5">
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[#64736C] uppercase tracking-wider font-mono">Slot Number</label>
                   <input 
                    type="number" 
                    required 
                    value={slotForm.slot_number} 
                    onChange={e => setSlotForm({...slotForm, slot_number: Number(e.target.value)})}
                    className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-xl p-3.5 text-[#17201D] text-xs font-mono focus:border-[#16A34A] outline-none"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[#64736C] uppercase tracking-wider font-mono">Price Override (₹/hr)</label>
                   <input 
                    type="number" 
                    step="1"
                    value={slotForm.price_override} 
                    onChange={e => setSlotForm({...slotForm, price_override: Number(e.target.value)})}
                    placeholder="0 (uses zone rate)"
                    className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-xl p-3.5 text-[#17201D] text-xs font-mono focus:border-[#16A34A] outline-none"
                   />
                   <p className="text-[10px] text-[#94A39B]">Leave at 0 to use standard zone rate (₹{selectedZone?.price_per_hour}/hr).</p>
                </div>
                
                <button type="submit" className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 text-xs uppercase tracking-wider shadow-md">
                   <Save className="w-4 h-4" /> {selectedSlot ? 'Update Bay' : 'Create Bay'}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Zone Modal */}
      {showZoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#DDE5DF] w-full max-w-md rounded-3xl overflow-hidden shadow-elevation">
             <div className="p-6 border-b border-[#DDE5DF] flex justify-between items-center bg-[#FAF9F6]">
                <h3 className="text-lg font-black text-[#17201D] flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-[#16A34A]" /> Create New Parking Zone
                </h3>
                <button onClick={() => setShowZoneModal(false)} className="text-[#64736C] hover:text-[#17201D] transition-colors"><X className="w-5 h-5" /></button>
             </div>
             <form onSubmit={handleCreateZone} className="p-6 space-y-4">
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[#64736C] uppercase tracking-wider font-mono">Zone Name</label>
                   <input 
                    type="text" 
                    required 
                    value={zoneForm.name} 
                    onChange={e => setZoneForm({...zoneForm, name: e.target.value})}
                    placeholder="e.g. VIP Underground Wing" 
                    className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-xl p-3.5 text-[#17201D] text-xs focus:border-[#16A34A] outline-none"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-xs font-bold text-[#64736C] uppercase tracking-wider font-mono">Type</label>
                   <select 
                    value={zoneForm.zone_type} 
                    onChange={e => setZoneForm({...zoneForm, zone_type: e.target.value})}
                    className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-xl p-3.5 text-[#17201D] text-xs focus:border-[#16A34A] outline-none"
                   >
                     <option value="fixed">Fixed Rate</option>
                     <option value="hourly">Hourly Auto</option>
                     <option value="subscription">Subscription Only</option>
                     <option value="hybrid">Hybrid Mode</option>
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#64736C] uppercase tracking-wider font-mono">Price (₹/hr)</label>
                      <input 
                        type="number" 
                        value={zoneForm.price_per_hour} 
                        onChange={e => setZoneForm({...zoneForm, price_per_hour: Number(e.target.value)})}
                        className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-xl p-3.5 text-[#17201D] text-xs font-mono focus:border-[#16A34A] outline-none"
                      />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#64736C] uppercase tracking-wider font-mono">Sub (₹/mo)</label>
                      <input 
                        type="number" 
                        value={zoneForm.subscription_price} 
                        onChange={e => setZoneForm({...zoneForm, subscription_price: Number(e.target.value)})}
                        className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-xl p-3.5 text-[#17201D] text-xs font-mono focus:border-[#16A34A] outline-none"
                      />
                  </div>
                </div>
                
                <button type="submit" className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-4 rounded-xl transition-all flex justify-center items-center gap-2 mt-4 text-xs uppercase tracking-wider shadow-md">
                   <Save className="w-4 h-4" /> Save Zone Telemetry
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
}

