"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Crown, ToggleLeft, ToggleRight, Search, ShieldCheck, User, Calendar, AlertCircle, Plus, Edit3, X, Save, Power, Sparkles, CheckCircle2 } from 'lucide-react';
import { format, addMonths } from 'date-fns';

const DEFAULT_PLANS = [
  { id: 'basic', name: 'Basic Mobility', price: 0, color: 'slate', recommended: false, is_active: true },
  { id: 'pro', name: 'SmartPark Pro', price: 499, color: 'emerald', recommended: true, is_active: true },
  { id: 'enterprise', name: 'Fleet & VIP Pass', price: 1499, color: 'amber', recommended: false, is_active: true }
];

export default function AdminSubscriptionsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Plans & User Subscriptions
  const [plans, setPlans] = useState<any[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // Edit/Add Plan Modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [planForm, setPlanForm] = useState({
    id: '',
    name: '',
    price: 0,
    features: '',
    color: 'emerald',
    recommended: false,
    is_active: true
  });

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
      await fetchPlans();
      await fetchUserSubscriptions();
    }
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('price', { ascending: true });

    if (!error && data && data.length > 0) {
      setPlans(data);
    } else {
      setPlans(DEFAULT_PLANS);
    }
  };

  const fetchUserSubscriptions = async () => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*, profiles:user_id(username, full_name)')
      .order('created_at', { ascending: false });

    if (data) setUserSubscriptions(data);
  };

  // Plan Activation / Deactivation Authority
  const handleTogglePlanActive = async (plan: any) => {
    const nextActiveState = !plan.is_active;

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .upsert({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          features: Array.isArray(plan.features) ? plan.features : (plan.features ? plan.features.split(',') : []),
          color: plan.color || 'emerald',
          recommended: !!plan.recommended,
          is_active: nextActiveState
        });

      if (error) {
        alert(`Failed to update plan status: ${error.message}`);
        return;
      }

      setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, is_active: nextActiveState } : p));
    } catch (err: any) {
      alert(err.message || 'Error updating plan');
    }
  };

  const handleOpenPlanModal = (plan?: any) => {
    if (plan) {
      setEditingPlan(plan);
      setPlanForm({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        features: Array.isArray(plan.features) ? plan.features.join(', ') : plan.features || '',
        color: plan.color || 'emerald',
        recommended: !!plan.recommended,
        is_active: plan.is_active ?? true
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        id: '',
        name: '',
        price: 0,
        features: 'Free booking in Zone 4, Priority EV support',
        color: 'emerald',
        recommended: false,
        is_active: true
      });
    }
    setShowPlanModal(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const planId = planForm.id.toLowerCase().replace(/\s+/g, '-');
    const featuresArray = planForm.features.split(',').map(f => f.trim()).filter(Boolean);

    try {
      const { error } = await supabase
        .from('subscription_plans')
        .upsert({
          id: planId,
          name: planForm.name,
          price: Number(planForm.price),
          features: featuresArray,
          color: planForm.color,
          recommended: planForm.recommended,
          is_active: planForm.is_active
        });

      if (error) throw error;

      setShowPlanModal(false);
      fetchPlans();
    } catch (err: any) {
      alert(err.message || 'Save failed');
    }
  };

  const handleToggleUserSubStatus = async (sub: any, newStatus: 'active' | 'cancelled') => {
    try {
      const updatePayload: any = { status: newStatus };
      if (newStatus === 'active') {
        updatePayload.start_date = new Date().toISOString();
        updatePayload.end_date = addMonths(new Date(), 1).toISOString();
      }

      const { error } = await supabase
        .from('subscriptions')
        .update(updatePayload)
        .eq('id', sub.id);

      if (error) throw error;

      fetchUserSubscriptions();
    } catch (err: any) {
      alert(err.message || 'Failed to update user subscription');
    }
  };

  const filteredSubscriptions = userSubscriptions.filter(s =>
    s.plan?.toLowerCase().includes(search.toLowerCase()) ||
    s.profiles?.username?.toLowerCase().includes(search.toLowerCase()) ||
    s.user_id?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="h-10 w-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64736C] text-xs font-mono tracking-wide">Loading Subscriptions Authority...</p>
      </div>
    );
  }
  if (!isAdmin) {
    if (typeof window !== 'undefined') window.location.href = '/';
    return <div className="p-12 text-center text-[#E45757] font-bold text-xs">Access Denied - Redirecting...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-[11px] font-bold text-[#D97706] font-mono uppercase tracking-wider mb-1">Membership Authority</div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#17201D] tracking-tight flex items-center gap-3">
            <Crown className="w-8 h-8 text-[#D97706]" /> Subscription Authority Console
          </h1>
          <p className="text-[#64736C] text-xs sm:text-sm mt-1">Control active plan availability, modify pricing tiers, and audit user authorizations.</p>
        </div>
        <button
          onClick={() => handleOpenPlanModal()}
          className="flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-md active:scale-95 text-xs uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Add Subscription Plan
        </button>
      </div>

      {/* SECTION 1: Plan Activation/Deactivation Controls */}
      <div className="space-y-6">
        <h2 className="text-xs font-bold text-[#64736C] uppercase tracking-wider flex items-center gap-2 font-mono">
          <ShieldCheck className="w-4 h-4 text-[#16A34A]" /> Plan Activation Matrix
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white border-2 rounded-3xl p-6 transition-all flex flex-col justify-between shadow-card ${
                plan.is_active ? 'border-[#DDE5DF] hover:border-[#16A34A]/50' : 'border-[#FECACA] bg-[#FEE2E2]/20'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-[#17201D]">{plan.name}</h3>
                    <p className="text-2xl font-black text-[#16A34A] font-mono mt-1">
                      {plan.price === 0 ? '₹0' : `₹${plan.price}`} <span className="text-xs text-[#64736C] font-normal">/mo</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenPlanModal(plan)}
                    className="p-2 text-[#64736C] hover:text-[#17201D] bg-[#FAF9F6] rounded-xl transition-colors border border-[#DDE5DF]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 font-mono ${
                      plan.is_active
                        ? 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
                        : 'bg-[#FEE2E2] text-[#E45757] border border-[#FECACA]'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${plan.is_active ? 'bg-[#16A34A] animate-pulse' : 'bg-[#E45757]'}`} />
                    {plan.is_active ? 'Active Tier' : 'Deactivated'}
                  </span>
                </div>
              </div>

              {/* Toggle Switch Button */}
              <button
                onClick={() => handleTogglePlanActive(plan)}
                className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                  plan.is_active
                    ? 'bg-[#FEE2E2]/60 hover:bg-[#FEE2E2] text-[#E45757] border-[#FECACA]'
                    : 'bg-[#16A34A] hover:bg-[#15803D] text-white border-[#16A34A] shadow-md'
                }`}
              >
                <Power className="w-4 h-4" />
                {plan.is_active ? 'Deactivate Tier' : 'Activate Tier'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: User Subscriptions Management Table */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xs font-bold text-[#64736C] uppercase tracking-wider flex items-center gap-2 font-mono">
            <User className="w-4 h-4 text-[#D97706]" /> User Subscriptions Directory
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A39B]" />
            <input
              type="text"
              placeholder="Search driver or tier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-[#DDE5DF] rounded-xl p-3 pl-10 text-xs text-[#17201D] placeholder-[#94A39B] focus:border-[#16A34A] outline-none"
            />
          </div>
        </div>

        <div className="bg-white border border-[#DDE5DF] rounded-3xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-[#DDE5DF] text-[10px] font-bold text-[#64736C] uppercase tracking-wider font-mono">
                  <th className="px-6 py-4">Subscriber</th>
                  <th className="px-6 py-4">Membership Tier</th>
                  <th className="px-6 py-4">Validity Period</th>
                  <th className="px-6 py-4">Access Status</th>
                  <th className="px-6 py-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE5DF]/60">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#FAF9F6] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-[#ECF4EF] rounded-xl flex items-center justify-center border border-[#DDE5DF] text-[#16A34A]">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-[#17201D] text-xs">
                            {sub.profiles?.full_name || sub.profiles?.username || 'Driver'}
                          </p>
                          <p className="text-[10px] text-[#94A39B] font-mono">{sub.user_id.slice(0, 10)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-[#16A34A] text-xs bg-[#DCFCE7] px-3 py-1 rounded-lg border border-[#BBF7D0] font-mono">
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-[#64736C] gap-0.5 font-mono">
                        <span className="flex items-center gap-1 text-[#17201D] font-semibold">
                          <Calendar className="w-3 h-3 text-[#94A39B]" />
                          {sub.start_date ? format(new Date(sub.start_date), 'dd MMM yyyy') : 'N/A'}
                        </span>
                        <span className="text-[#94A39B] text-[10px]">
                          to {sub.end_date ? format(new Date(sub.end_date), 'dd MMM yyyy') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 font-mono ${
                          sub.status === 'active'
                            ? 'bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]'
                            : 'bg-[#FEE2E2] text-[#E45757] border border-[#FECACA]'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sub.status === 'active' ? (
                        <button
                          onClick={() => handleToggleUserSubStatus(sub, 'cancelled')}
                          className="px-4 py-2 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#E45757] border border-[#FECACA] text-xs font-bold rounded-xl transition-all"
                        >
                          Revoke Pass
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleUserSubStatus(sub, 'active')}
                          className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                        >
                          Grant Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredSubscriptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-[#94A39B] text-xs">
                      No user subscriptions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Plan Edit Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#DDE5DF] w-full max-w-md rounded-3xl overflow-hidden shadow-elevation">
            <div className="p-6 border-b border-[#DDE5DF] flex justify-between items-center bg-[#FAF9F6]">
              <h3 className="text-lg font-black text-[#17201D] flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#16A34A]" />
                {editingPlan ? 'Edit Membership Tier' : 'Create Membership Tier'}
              </h3>
              <button onClick={() => setShowPlanModal(false)} className="text-[#64736C] hover:text-[#17201D]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePlan} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64736C] uppercase tracking-wider font-mono">Plan Key / ID</label>
                <input
                  type="text"
                  required
                  disabled={!!editingPlan}
                  value={planForm.id}
                  onChange={e => setPlanForm({ ...planForm, id: e.target.value })}
                  placeholder="e.g. pro-plus"
                  className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-xl p-3 text-[#17201D] text-xs font-mono outline-none focus:border-[#16A34A] disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64736C] uppercase tracking-wider font-mono">Display Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. SmartPark Elite Pro"
                  className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-xl p-3 text-[#17201D] text-xs outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64736C] uppercase tracking-wider font-mono">Monthly Price (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={planForm.price}
                  onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                  className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-xl p-3 text-[#17201D] text-xs font-mono outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#64736C] uppercase tracking-wider font-mono">Features (Comma Separated)</label>
                <textarea
                  value={planForm.features}
                  onChange={e => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder="Free booking in Zone 4, Priority EV support"
                  className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-xl p-3 text-[#17201D] text-xs outline-none focus:border-[#16A34A] h-20"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-[#17201D] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.is_active}
                    onChange={e => setPlanForm({ ...planForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-[#16A34A] bg-[#FAF9F6] border-[#DDE5DF] accent-[#16A34A]"
                  />
                  Active Status
                </label>

                <label className="flex items-center gap-2 text-xs text-[#17201D] font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.recommended}
                    onChange={e => setPlanForm({ ...planForm, recommended: e.target.checked })}
                    className="w-4 h-4 rounded text-[#16A34A] bg-[#FAF9F6] border-[#DDE5DF] accent-[#16A34A]"
                  />
                  Recommended Tag
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 text-xs uppercase tracking-wider shadow-md"
              >
                <Save className="w-4 h-4" /> Save Membership Plan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

