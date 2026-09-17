"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Crown, ToggleLeft, ToggleRight, Search, ShieldCheck, User, Calendar, AlertCircle, Plus, Edit3, X, Save, Power } from 'lucide-react';
import { format, addMonths } from 'date-fns';

const DEFAULT_PLANS = [
  { id: 'basic', name: 'Basic Access', price: 0, color: 'slate', recommended: false, is_active: true },
  { id: 'pro', name: 'SmartPark Pro', price: 29.99, color: 'blue', recommended: true, is_active: true },
  { id: 'enterprise', name: 'Elite / VIP', price: 99.99, color: 'amber', recommended: false, is_active: true }
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
    color: 'blue',
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
      // If table empty or error, use default plans
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

  // -------------------------------------------------------------
  // Plan Activation / Deactivation Authority
  // -------------------------------------------------------------
  const handleTogglePlanActive = async (plan: any) => {
    const nextActiveState = !plan.is_active;

    try {
      // Upsert into subscription_plans table
      const { error } = await supabase
        .from('subscription_plans')
        .upsert({
          id: plan.id,
          name: plan.name,
          price: plan.price,
          features: Array.isArray(plan.features) ? plan.features : (plan.features ? plan.features.split(',') : []),
          color: plan.color || 'blue',
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
        color: plan.color || 'blue',
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
        color: 'blue',
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

  // -------------------------------------------------------------
  // User Subscription Authority (Activate / Deactivate User Sub)
  // -------------------------------------------------------------
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

  if (loading) return <div className="p-12 text-center text-slate-400">Loading Subscriptions Authority...</div>;
  if (!isAdmin) {
    if (typeof window !== 'undefined') window.location.href = '/';
    return <div className="p-12 text-center text-red-500 font-bold">Access Denied - Redirecting...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Crown className="w-9 h-9 text-amber-500" /> Subscription Authority Console
          </h1>
          <p className="text-slate-400">Control active plans availability and manage user subscription statuses.</p>
        </div>
        <button
          onClick={() => handleOpenPlanModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20"
        >
          <Plus className="w-5 h-5" /> Add Subscription Plan
        </button>
      </div>

      {/* SECTION 1: Plan Activation/Deactivation Controls */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-500" /> Plan Activation Control
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-slate-900 border-2 rounded-3xl p-6 transition-all flex flex-col justify-between ${
                plan.is_active ? 'border-slate-800' : 'border-red-900/50 bg-red-950/10'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-2xl font-black text-blue-400 mt-1">${plan.price} <span className="text-xs text-slate-500">/mo</span></p>
                  </div>
                  <button
                    onClick={() => handleOpenPlanModal(plan)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase flex items-center gap-1.5 ${
                      plan.is_active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${plan.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                    {plan.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </div>
              </div>

              {/* Toggle Switch Button */}
              <button
                onClick={() => handleTogglePlanActive(plan)}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${
                  plan.is_active
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                }`}
              >
                <Power className="w-4 h-4" />
                {plan.is_active ? 'Deactivate Plan' : 'Activate Plan'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: User Subscriptions Management Table */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-6 h-6 text-amber-500" /> User Subscriptions Directory
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search user or plan..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 pl-10 text-sm text-white placeholder-slate-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                  <th className="px-6 py-5">User</th>
                  <th className="px-6 py-5">Plan</th>
                  <th className="px-6 py-5">Validity Period</th>
                  <th className="px-6 py-5">Status</th>
                  <th className="px-6 py-5 text-right">Admin Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                          <User className="w-4 h-4 text-slate-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">
                            {sub.profiles?.full_name || sub.profiles?.username || 'User'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{sub.user_id.slice(0, 10)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-white text-sm bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
                        {sub.plan}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col text-[11px] text-slate-400 gap-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {sub.start_date ? format(new Date(sub.start_date), 'MMM d, yyyy') : 'N/A'}
                        </span>
                        <span className="text-slate-500 text-[10px]">
                          to {sub.end_date ? format(new Date(sub.end_date), 'MMM d, yyyy') : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                          sub.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {sub.status === 'active' ? (
                        <button
                          onClick={() => handleToggleUserSubStatus(sub, 'cancelled')}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold rounded-xl transition-all"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleToggleUserSubStatus(sub, 'active')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredSubscriptions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-500 text-sm">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-3xl">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-500" />
                {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSavePlan} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Plan Key / ID</label>
                <input
                  type="text"
                  required
                  disabled={!!editingPlan}
                  value={planForm.id}
                  onChange={e => setPlanForm({ ...planForm, id: e.target.value })}
                  placeholder="e.g. pro-plus"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Plan Display Name</label>
                <input
                  type="text"
                  required
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="e.g. SmartPark Pro Plus"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Monthly Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={planForm.price}
                  onChange={e => setPlanForm({ ...planForm, price: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Features (Comma Separated)</label>
                <textarea
                  value={planForm.features}
                  onChange={e => setPlanForm({ ...planForm, features: e.target.value })}
                  placeholder="Free booking, Priority support"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 h-20"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.is_active}
                    onChange={e => setPlanForm({ ...planForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800"
                  />
                  Active Status
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.recommended}
                    onChange={e => setPlanForm({ ...planForm, recommended: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800"
                  />
                  Recommended Badge
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
              >
                <Save className="w-5 h-5" /> Save Plan Configuration
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
