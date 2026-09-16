"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';
import { Check, Shield, Crown, Zap, Mail, ArrowRight, Ban, Loader2 } from 'lucide-react';
import { addMonths } from 'date-fns';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const DEFAULT_PLANS = [
  {
    id: 'basic',
    name: 'Basic Access',
    price: 0,
    features: ['Pay-per-use in Zone 1, 2, 4, 5', 'Standard support', 'Real-time availability'],
    color: 'slate',
    recommended: false,
    is_active: true,
    icon: Zap
  },
  {
    id: 'pro',
    name: 'SmartPark Pro',
    price: 29.99,
    features: ['Free booking in Zone 4 & 5', 'Access to Zone 3 (Sub Only)', 'Priority support', 'Advanced statistics'],
    color: 'blue',
    recommended: true,
    is_active: true,
    icon: Shield
  },
  {
    id: 'enterprise',
    name: 'Elite / VIP',
    price: 99.99,
    features: ['All Pro features', 'Guaranteed slot reservation', 'Concierge service', 'Custom billing'],
    color: 'amber',
    recommended: false,
    is_active: true,
    icon: Crown
  }
];

const ICON_MAP: Record<string, any> = {
  basic: Zap,
  pro: Shield,
  enterprise: Crown
};

export default function SubscriptionsPage() {
  const [user, setUser] = useState<any>(null);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) fetchSubscription(session.user.id);
      else setLoading(false);
    });
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('price', { ascending: true });

      if (!error && data && data.length > 0) {
        const formatted = data.map((p) => ({
          ...p,
          icon: ICON_MAP[p.id] || Shield
        }));
        setPlans(formatted);
      }
    } catch (err) {
      console.log('Using default plans fallback', err);
    }
  };

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

    if (plan.is_active === false) {
      return alert('This plan has been deactivated by the administrator.');
    }

    if (activeSub?.plan === plan.name) {
      return alert(`You are already subscribed to ${plan.name}.`);
    }

    // Free plan activation directly
    if (plan.price === 0) {
      try {
        setPurchasingPlanId(plan.id);

        // Cancel previous active subscription if any
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('user_id', user.id)
          .eq('status', 'active');

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
        alert(err.message || 'Activation failed');
      } finally {
        setPurchasingPlanId(null);
      }
      return;
    }

    // Paid plan -> Razorpay Payment Flow
    if (!scriptLoaded || !window.Razorpay) {
      return alert('Payment gateway is still loading. Please try again in a moment.');
    }

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      return alert('Razorpay Key ID is not configured.');
    }

    setPurchasingPlanId(plan.id);

    try {
      // 1. Create order on server
      const orderRes = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: plan.price,
          userId: user.id,
          paymentType: 'subscription',
          planId: plan.id
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // 2. Configure Razorpay options
      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'SmartPark Subscriptions',
        description: `Activation for ${plan.name}`,
        order_id: orderData.id,
        prefill: {
          email: user.email || ''
        },
        theme: {
          color: '#2563eb'
        },
        handler: async function (response: any) {
          try {
            // 3. Verify payment signature on server & activate subscription
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                userId: user.id,
                amount: plan.price,
                paymentType: 'subscription',
                planName: plan.name
              })
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment verification failed');
            }

            alert(`Payment successful! Your ${plan.name} subscription is now active.`);
            await fetchSubscription(user.id);
          } catch (verifyErr: any) {
            alert(verifyErr.message || 'Failed to verify payment');
          } finally {
            setPurchasingPlanId(null);
          }
        },
        modal: {
          ondismiss: function () {
            setPurchasingPlanId(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        alert(resp?.error?.description || 'Payment failed. Please try again.');
        setPurchasingPlanId(null);
      });
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Payment initialization failed');
      setPurchasingPlanId(null);
    }
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Loading Plans...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-20">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="text-center mb-16 space-y-4">
        <h1 className="text-5xl font-black text-white tracking-tighter">Choose Your Tier</h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Unlock exclusive zones and enjoy frictionless parking with our premium subscription models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const Icon = plan.icon || Shield;
          const isActive = activeSub?.plan === plan.name;
          const isDeactivated = plan.is_active === false;
          const isProcessing = purchasingPlanId === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative bg-slate-900 border-2 rounded-[2.5rem] p-10 flex flex-col transition-all duration-300 ${
                isDeactivated
                  ? 'border-slate-800 opacity-60'
                  : plan.recommended
                  ? 'border-blue-600 shadow-2xl shadow-blue-600/10 scale-105 z-10 hover:-translate-y-2'
                  : 'border-slate-800 hover:-translate-y-2'
              }`}
            >
              {plan.recommended && !isDeactivated && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-lg">
                  Recommended
                </span>
              )}

              {isDeactivated && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.15em] shadow-lg flex items-center gap-1">
                  <Ban className="w-3 h-3" /> Deactivated by Admin
                </span>
              )}

              <div className="mb-8">
                <div
                  className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-6 ${
                    isDeactivated
                      ? 'bg-slate-800 text-slate-500'
                      : `bg-${plan.color}-500/10 border border-${plan.color}-500/20`
                  }`}
                >
                  <Icon className={`w-8 h-8 ${isDeactivated ? 'text-slate-500' : `text-${plan.color}-500`}`} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">${plan.price}</span>
                  <span className="text-slate-500 text-sm">/ month</span>
                </div>
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {(plan.features || []).map((feature: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-slate-400 text-sm font-medium">
                    <Check className={`w-5 h-5 ${isDeactivated ? 'text-slate-600' : `text-${plan.color}-500`} mt-0.5 flex-shrink-0`} />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchase(plan)}
                disabled={isActive || isDeactivated || isProcessing}
                className={`w-full py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-default'
                    : isDeactivated
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : plan.recommended
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-600/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                  </>
                ) : isActive ? (
                  'Active Plan'
                ) : isDeactivated ? (
                  'Deactivated by Admin'
                ) : (
                  <>
                    Activate Plan <ArrowRight className="w-5 h-5" />
                  </>
                )}
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
