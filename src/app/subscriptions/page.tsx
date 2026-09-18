"use client";

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { supabase } from '@/lib/supabase';
import { Check, Crown, Zap, Mail, ArrowRight, Ban, Loader2, Sparkles, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { addMonths } from 'date-fns';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const DEFAULT_PLANS = [
  {
    id: 'basic',
    name: 'Basic Mobility',
    price: 0,
    features: ['Pay-per-use in Hourly & Fixed Zones', 'Live real-time parking telemetry', 'Standard automated ingress access', 'Digital parking pass generation', 'Email invoices & receipts'],
    color: 'slate',
    recommended: false,
    is_active: true,
    icon: Zap
  },
  {
    id: 'pro',
    name: 'PARKORA Pro',
    price: 499,
    features: ['Unlimited free parking in Zone 4 & 5', 'Exclusive priority access to VIP & EV Zones', 'Priority EV fast-charging stations', 'Instant ANPR automated barrier recognition', 'Zero payment gateway convenience fees'],
    color: 'emerald',
    recommended: true,
    is_active: true,
    icon: ShieldCheck
  },
  {
    id: 'enterprise',
    name: 'Fleet & VIP Pass',
    price: 1499,
    features: ['All PARKORA Pro benefits included', 'Guaranteed reserved covered parking bay', 'Dedicated EV charging bay pre-reservation', 'Multi-vehicle garage credentials', '24/7 Priority VIP Concierge support'],
    color: 'amber',
    recommended: false,
    is_active: true,
    icon: Crown
  }
];

const ICON_MAP: Record<string, any> = {
  basic: Zap,
  pro: ShieldCheck,
  enterprise: Crown
};

export default function SubscriptionsPage() {
  const [user, setUser] = useState<any>(null);
  const [activeSub, setActiveSub] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);
  const [purchasingPlanId, setPurchasingPlanId] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

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
          icon: ICON_MAP[p.id] || ShieldCheck
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
    if (!user) {
      showToast('error', 'Please sign in to purchase or activate a plan.');
      return;
    }

    if (plan.is_active === false) {
      showToast('error', 'This plan has been deactivated by the system administrator.');
      return;
    }

    if (activeSub?.plan === plan.name) {
      showToast('error', `You are already actively subscribed to ${plan.name}.`);
      return;
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

        showToast('success', `Success! You are now subscribed to ${plan.name}.`);
        fetchSubscription(user.id);
      } catch (err: any) {
        showToast('error', err.message || 'Activation failed');
      } finally {
        setPurchasingPlanId(null);
      }
      return;
    }

    // Paid plan -> Razorpay Payment Flow
    if (!scriptLoaded || !window.Razorpay) {
      showToast('error', 'Payment gateway is still initializing. Please try again.');
      return;
    }

    const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    if (!razorpayKeyId) {
      showToast('error', 'Payment Gateway Key is not configured.');
      return;
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
        name: 'PARKORA Mobility Pro',
        description: `Pass Activation for ${plan.name}`,
        order_id: orderData.id,
        prefill: {
          email: user.email || ''
        },
        theme: {
          color: '#16A34A'
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

            showToast('success', `Payment Confirmed! Your ${plan.name} mobility pass is now active.`);
            await fetchSubscription(user.id);
          } catch (verifyErr: any) {
            showToast('error', verifyErr.message || 'Failed to verify payment');
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
        showToast('error', resp?.error?.description || 'Payment failed. Please try again.');
        setPurchasingPlanId(null);
      });
      rzp.open();
    } catch (err: any) {
      showToast('error', err.message || 'Payment initialization failed');
      setPurchasingPlanId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="h-10 w-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64736C] text-sm font-mono tracking-wide">Loading Mobility Membership Tiers...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen bg-[#FAF9F6]">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 p-4 rounded-2xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 text-xs font-bold ${
          toast.type === 'success'
            ? 'bg-[#12372A] border-[#16A34A] text-[#4ADE80] shadow-xl'
            : 'bg-[#4C0519] border-[#FB7185] text-[#FECDD3] shadow-xl'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-[#4ADE80] flex-shrink-0" /> : <AlertCircle className="w-5 h-5 text-[#FB7185] flex-shrink-0" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-14 space-y-3 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
          PARKORA Mobility Passes
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-[#17201D] tracking-tight">
          Choose Your Mobility Pass Tier
        </h1>
        <p className="text-[#64736C] text-sm sm:text-base leading-relaxed">
          Unlock exclusive subscriber-only parking zones, automated ANPR barrier recognition, and priority EV charging.
        </p>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => {
          const Icon = plan.icon || ShieldCheck;
          const isActive = activeSub?.plan === plan.name;
          const isDeactivated = plan.is_active === false;
          const isProcessing = purchasingPlanId === plan.id;
          const isRecommended = plan.recommended && !isDeactivated;

          return (
            <div
              key={plan.id}
              className={`relative bg-white border-2 rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 shadow-soft ${
                isDeactivated
                  ? 'border-[#DDE5DF] opacity-60'
                  : isRecommended
                  ? 'border-[#16A34A] shadow-md md:-translate-y-2'
                  : 'border-[#DDE5DF] hover:border-[#CBD5CF]'
              }`}
            >
              {isRecommended && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#16A34A] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md">
                  Most Popular
                </span>
              )}

              {isDeactivated && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#E45757] text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
                  <Ban className="w-3 h-3" /> Deactivated
                </span>
              )}

              <div>
                {/* Plan Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                    isRecommended 
                      ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]' 
                      : 'bg-[#ECF4EF] text-[#64736C] border border-[#DDE5DF]'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  {isActive && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] text-xs font-bold font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> ACTIVE PASS
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black text-[#17201D] mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1.5 mb-6">
                  <span className="text-4xl font-black text-[#17201D] font-mono">
                    {plan.price === 0 ? '₹0' : `₹${plan.price}`}
                  </span>
                  <span className="text-[#64736C] text-xs font-medium">{plan.price === 0 ? 'Free tier' : '/ month'}</span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {(plan.features || []).map((feature: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5 text-[#17201D] text-xs leading-relaxed">
                      <Check className="w-4 h-4 text-[#16A34A] mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handlePurchase(plan)}
                disabled={isActive || isDeactivated || isProcessing}
                className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  isActive
                    ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0] cursor-default'
                    : isDeactivated
                    ? 'bg-[#ECF4EF] text-[#94A39B] border border-[#DDE5DF] cursor-not-allowed'
                    : isRecommended
                    ? 'bg-[#16A34A] hover:bg-[#15803D] text-white shadow-md active:scale-[0.98]'
                    : 'bg-[#17201D] hover:bg-[#12372A] text-white border border-[#17201D] active:scale-[0.98]'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Initializing Gateway...
                  </>
                ) : isActive ? (
                  'Active Membership Plan'
                ) : isDeactivated ? (
                  'Currently Unavailable'
                ) : (
                  <>
                    <span>Activate Mobility Pass</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Enterprise / Fleet Banner */}
      <div className="mt-14 p-8 sm:p-10 bg-[#17201D] text-white rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-elevation border border-[#2C3933]">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="text-lg font-bold text-white flex items-center justify-center md:justify-start gap-2">
            <Mail className="w-5 h-5 text-[#4ADE80]" />
            Commercial Fleet & Dedicated Garages
          </h3>
          <p className="text-[#A7B5AD] text-xs">
            Need customized billing, reserved zones for fleet vehicles, or bespoke API telemetry?
          </p>
        </div>
        <button className="px-6 py-3 bg-[#12372A] hover:bg-[#163D2E] text-white font-bold rounded-xl text-xs transition-all border border-[#16A34A]/30">
          Contact Fleet Sales
        </button>
      </div>

    </div>
  );
}



