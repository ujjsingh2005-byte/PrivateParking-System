"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, Shield, Crown, Zap, Mail, ArrowRight } from 'lucide-react';
import { addMonths } from 'date-fns';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic Access',
    price: 0,
    features: ['Pay-per-use in Zone 1, 2, 4, 5', 'Standard support', 'Real-time availability'],
    color: 'slate',
    icon: Zap
  },
  {
    id: 'pro',
    name: 'SmartPark Pro',
    price: 29.99,
    features: ['Free booking in Zone 4 & 5', 'Access to Zone 3 (Sub Only)', 'Priority support', 'Advanced statistics'],
    color: 'blue',
    icon: Shield,
    recommended: true
  },
  {
    id: 'enterprise',
    name: 'Elite / VIP',
    price: 99.99,
    features: ['All Pro features', 'Guaranteed slot reservation', 'Concierge service', 'Custom billing'],
    color: 'amber',
    icon: Crown
  }
];

export default function SubscriptionsPage() {
  const [user, setUser] = useState<any>(null);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) fetchSubscription(session.user.id);
      else setLoading(false);
    });
  }, []);

  const fetchSubscription = async (userId: string) => {
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    setActiveSub(data);
    setLoading(false);
  };

  const handlePurchase = async (plan: any) => {
    if (!user) return alert('Please sign in to purchase a plan.');
    if (plan.price === 0) return alert('You are already on the basic plan.');

    try {
      const { error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan: plan.name,
        start_date: new Date().toISOString(),
        end_date: addMonths(new Date(), 1).toISOString(),
        status: 'active'
      });

      if (error) throw error;
      
      alert(`Success! You are now subscribed to ${plan.name}.`);
      fetchSubscription(user.id);
    } catch (err: any) {
      alert(err.message || 'Purchase failed');
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Loading Plans...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl font-black text-white tracking-tighter">Choose Your Tier</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Unlock exclusive zones and enjoy frictionless parking with our premium subscription models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isActive = activeSub?.plan === plan.name;

          return (
            <div 
              key={plan.id}
              className={`relative bg-slate-900 border-2 rounded-[2.5rem] p-10 flex flex-col hover:-translate-y-2 transition-all duration-300 ${plan.recommended ? 'border-blue-600 shadow-2xl shadow-blue-600/10 scale-105 z-10' : 'border-slate-800'}`}
            >
              {plan.recommended && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-lg">
                  Recommended
                </span>
              )}

              <div className="mb-8">
                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 bg-${plan.color}-500/10 border border-${plan.color}-500/20`}>
                  <Icon className={`w-8 h-8 text-${plan.color}-500`} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-slate-500 text-sm">/ month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-400 text-sm font-medium">
                    <Check className={`w-5 h-5 text-${plan.color}-500 mt-0.5 flex-shrink-0`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePurchase(plan)}
                disabled={isActive}
                className={`w-full py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${isActive ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default' : plan.recommended ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}
              >
                {isActive ? 'Active Plan' : 'Go Pro Now'}
                {!isActive && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-24 p-12 bg-slate-900/50 border border-slate-800 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
              <Mail className="w-6 h-6 text-blue-500" />
              Custom Enterprise Solutions?
            </h3>
            <p className="text-slate-500">Need specific features for your fleet or garage? Contact our sales team.</p>
         </div>
         <button className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all border border-slate-700">
            Contact Support
         </button>
      </div>

    </div>
  );
}
