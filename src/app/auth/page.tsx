"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Compass, Sparkles, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    const form = e.currentTarget as HTMLFormElement;
    const emailVal = (form.elements.namedItem('email') as HTMLInputElement)?.value || email;
    const passwordVal = (form.elements.namedItem('password') as HTMLInputElement)?.value || password;
    const usernameVal = (form.elements.namedItem('username') as HTMLInputElement)?.value || username;

    try {
      if (view === 'signup') {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: emailVal,
          password: passwordVal,
          options: {
            data: { username: usernameVal || emailVal.split('@')[0] },
          },
        });

        if (signUpErr) throw signUpErr;

        if (data?.session) {
          window.location.href = '/';
        } else {
          setInfoMessage('Account created! Please check your email inbox to confirm your registration.');
        }
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: emailVal,
          password: passwordVal,
        });

        if (signInErr) {
          // If login failed due to invalid credentials, attempt automatic sign-up fallback if the user is new
          if (signInErr.message.includes('Invalid login credentials')) {
            const { data: signUpData, error: autoSignUpErr } = await supabase.auth.signUp({
              email: emailVal,
              password: passwordVal,
              options: {
                data: { username: emailVal.split('@')[0] },
              },
            });

            if (!autoSignUpErr && signUpData?.session) {
              window.location.href = '/';
              return;
            }
          }
          throw signInErr;
        }

        if (data?.session) {
          window.location.href = '/';
        }
      }
    } catch (err: any) {
      console.error('Error during auth:', err);
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      return setError('Please enter your email address above to receive a password reset link.');
    }
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
      setInfoMessage(`Password reset email sent to ${email}! Please check your inbox.`);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail: string, demoPass: string) => {
    setLoading(true);
    setError(null);
    setInfoMessage(null);
    setEmail(demoEmail);
    setPassword(demoPass);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPass,
      });

      if (!error && data?.session) {
        window.location.href = '/';
        return;
      }

      // Try creating demo user if not existing
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: demoEmail,
        password: demoPass,
        options: {
          data: { username: demoEmail.split('@')[0] },
        },
      });

      if (signUpErr) throw signUpErr;

      if (signUpData?.session) {
        window.location.href = '/';
      } else {
        setInfoMessage('Demo account activated! You may now sign in.');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0f172a] border border-white/[0.08] rounded-3xl p-8 shadow-2xl space-y-6 relative z-10">
        
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 mx-auto mb-3">
            <Compass className="w-6 h-6 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {view === 'login' ? 'SmartPark Access' : 'Create Mobility ID'}
          </h1>
          <p className="text-slate-400 text-xs">
            {view === 'login' ? 'Enter your credentials to manage parking reservations' : 'Get instant access to real-time smart parking bays'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#0b1220] rounded-xl border border-white/[0.06] text-xs font-bold">
          <button
            type="button"
            onClick={() => { setError(null); setInfoMessage(null); setView('login'); }}
            className={`py-2 rounded-lg transition-all ${
              view === 'login' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setError(null); setInfoMessage(null); setView('signup'); }}
            className={`py-2 rounded-lg transition-all ${
              view === 'signup' ? 'bg-cyan-500 text-black shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Info Message */}
        {infoMessage && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-xs font-medium flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>{infoMessage}</div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-medium space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-red-500/20 text-[11px]">
              <button
                type="button"
                onClick={handleResetPassword}
                className="underline text-red-300 hover:text-white font-bold"
              >
                Send Reset Password Link
              </button>
            </div>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {view === 'signup' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                name="username"
                placeholder="Driver Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#0b1220] border border-white/[0.08] rounded-2xl p-3.5 pl-11 text-white text-xs placeholder-slate-500 focus:border-cyan-500 outline-none transition-all"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#0b1220] border border-white/[0.08] rounded-2xl p-3.5 pl-11 text-white text-xs placeholder-slate-500 focus:border-cyan-500 outline-none transition-all"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#0b1220] border border-white/[0.08] rounded-2xl p-3.5 pl-11 text-white text-xs placeholder-slate-500 focus:border-cyan-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black py-3.5 rounded-2xl transition-all shadow-xl shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-2 text-xs"
          >
            {loading ? (
              'Authenticating...'
            ) : view === 'login' ? (
              <>
                <span>Sign In to SmartPark</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Create Driver Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Access Bar */}
        <div className="p-4 bg-[#0b1220] border border-white/[0.06] rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Fast Demo Logins
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoLogin('user@example.com', 'user123')}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all border border-white/[0.06] text-[11px]"
            >
              Driver User
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('ujjsingh2005@gmail.com', 'Ujjwal@123')}
              className="py-2 px-3 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 font-bold rounded-xl transition-all border border-cyan-500/30 text-[11px]"
            >
              Admin (ujjsingh2005)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

