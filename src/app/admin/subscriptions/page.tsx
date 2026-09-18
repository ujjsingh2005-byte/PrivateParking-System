"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Crown, ToggleLeft, ToggleRight, Search, ShieldCheck, User, Calendar, AlertCircle, Plus, Edit3, X, Save, Power, Sparkles, CheckCircle2 } from 'lucide-react';
import { format, addMonths } from 'date-fns';

const DEFAULT_PLANS = [
  { id: 'basic', name: 'Basic Mobility', price: 0, color: 'slate', recommended: false, is_active: true },
  { id: 'pro', name: 'SmartPark Pro', price: 499, color: 'violet', recommended: true, is_active: true },
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
    color: 'violet',
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
          color: plan.color || 'violet',
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
        color: plan.color || 'violet',
        recommended: !!plan.recommended,
        is_active: plan.is_active ?? true
      });
    } else {
      setEditingPlan(null);
      setPlanForm({
        id: '',
        name: '',
        price: 0,
        features: 'Feature 1, Feature 2',
        color: 'violet',
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
        <div className="h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-xs font-mono tracking-wide">Loading Subscriptions Authority...</p>
      </div>
    );
  }
  if (!isAdmin) {
    if (typeof window !== 'undefined') window.location.href = '/';
    return <div className="p-12 text-center text-rose-400 font-bold">Access Denied - Redirecting...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="text-[11px] font-bold text-amber-400 font-mono uppercase tracking-wider mb-1">Membership Authority</div>
          <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
            <Crown className="w-8 h-8 text-amber-400" /> Subscription Authority Console
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Control active plan availability, modify pricing tiers, and audit user authorizations.</p>
        </div>
        <button
          onClick={() => handleOpenPlanModal()}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-violet-600/30 text-xs uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Add Subscription Plan
        </button>
      </div>

      {/* SECTION 1: Plan Activation/Deactivation Controls */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
          <ShieldCheck className="w-4 h-4 text-violet-400" /> Plan Activation Matrix
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-surface-1 border-2 rounded-3xl p-6 transition-all flex flex-col justify-between shadow-xl ${
                plan.is_active ? 'border-white/[0.08]' : 'border-rose-900/50 bg-rose-950/10'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-white">{plan.name}</h3>
                    <p className="text-2xl font-black text-violet-400 font-mono mt-1">
                      {plan.price === 0 ? '₹0' : `₹${plan.price}`} <span className="text-xs text-slate-400 font-normal">/mo</span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenPlanModal(plan)}
                    className="p-2 text-slate-400 hover:text-white bg-surface-2 rounded-xl transition-colors border border-white/[0.06]"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1.5 font-mono ${
                      plan.is_active
                        ? 'bg-lime-500/15 text-lime-300 border border-lime-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${plan.is_active ? 'bg-lime-400 animate-pulse' : 'bg-rose-400'}`} />
                    {plan.is_active ? 'Active Tier' : 'Deactivated'}
                  </span>
                </div>
              </div>

              {/* Toggle Switch Button */}
              <button
                onClick={() => handleTogglePlanActive(plan)}
                className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border ${
                  plan.is_active
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-lime-600 hover:bg-lime-500 text-white border-lime-500 shadow-lg shadow-lime-600/30'
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
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 font-mono">
            <User className="w-4 h-4 text-amber-400" /> User Subscriptions Directory
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search driver or tier..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface-1 border border-white/[0.08] rounded-xl p-3 pl-10 text-xs text-white placeholder-slate-500 focus:border-violet-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-surface-1 border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-2/60 border-b border-white/[0.06] text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="px-6 py-4">Subscriber</th>
                  <th className="px-6 py-4">Membership Tier</th>
                  <th className="px-6 py-4">Validity Period</th>
                  <th className="px-6 py-4">Access Status</th>
                  <th className="px-6 py-4 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-surface-2/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-surface-2 rounded-xl flex items-center justify-center border border-white/[0.06]">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs">
                            {sub.profiles?.full_name || sub.profiles?.username || 'Driver'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{sub.user_id.slice(0, 10)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-violet-300 text-xs bg-surface-2 px-3 py-1 rounded-lg border border-white/[0.06] font-mono">
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col text-xs text-slate-400 gap-0.5 font-mono">
                        <span className="flex items-center gap-1 text-slate-300">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {sub.start_date ? format(new Date(sub.start_date), 'dd MMM yyyy') : 'N/A'}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          to {sub.end_date ? format(new Date(sub.end_date), 'dd MMM yyyy') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 font-mono ${
                          sub.status === 'active'
                            ? 'bg-lime-500/15 text-lime-300 border border-lime-500/30'
                            : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {sub.status === 'active' ? (
                        <button
                          onClick={() => handleToggleUserSubStatus(sub, 'cancelled')}
                          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold rounded-xl transition-all"
                        >
                          Revoke Pass
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleUserSubStatus(sub, 'active')}
                          className="px-4 py-2 bg-lime-600 hover:bg-lime-500 text-white text-xs font-bold rounded-xl transition-all shadow-md"
                        >
                          Grant Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredSubscriptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500 text-xs">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-surface-1 border border-white/[0.08] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/[0.08] flex justify-between items-center">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-violet-400" />
                {editingPlan ? 'Edit Membership Tier' : 'Create Membership Tier'}
              </h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePlan} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Plan Key / ID</label>
                <input
                  type="text"
                  required
                  disabled={!!editingPlan}
                  value={planForm.id}
                  onChange={e => setPlanForm({ ...planForm, id: e.target.value })}
                  placeholder="e.g. pro-plus"
                  className="w-full bg-surface-2 border border-white/[0.08] rounded-xl p-3 text-white text-xs font-mono outline-none focus:border-violet-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Display Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. SmartPark Elite Pro"
                  className="w-full bg-surface-2 border border-white/[0.08] rounded-xl p-3 text-white text-xs outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Monthly Price (₹)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={planForm.price}
                  onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                  className="w-full bg-surface-2 border border-white/[0.08] rounded-xl p-3 text-white text-xs font-mono outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Features (Comma Separated)</label>
                <textarea
                  value={planForm.features}
                  onChange={e => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder="Free booking in Zone 4, Priority EV support"
                  className="w-full bg-surface-2 border border-white/[0.08] rounded-xl p-3 text-white text-xs outline-none focus:border-violet-500 h-20"
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.is_active}
                    onChange={e => setPlanForm({ ...planForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-violet-600 bg-surface-2 border-white/[0.1]"
                  />
                  Active Status
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.recommended}
                    onChange={e => setPlanForm({ ...planForm, recommended: e.target.checked })}
                    className="w-4 h-4 rounded text-violet-600 bg-surface-2 border-white/[0.1]"
                  />
                  Recommended Tag
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4 text-xs uppercase tracking-wider shadow-lg shadow-violet-600/30"
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

