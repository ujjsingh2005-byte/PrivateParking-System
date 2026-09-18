"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Shield } from 'lucide-react';

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
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 relative overflow-hidden bg-[#FAF9F6]">
      
      {/* Background subtle glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#16A34A]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-[#DDE5DF] rounded-3xl p-8 shadow-elevation space-y-6 relative z-10">
        
        {/* Brand Icon & Heading */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-[#12372A] border border-[#16A34A]/30 flex items-center justify-center text-[#4ADE80] shadow-md mx-auto mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-[#17201D] tracking-tight">
            {view === 'login' ? 'PARKORA Identity' : 'Create Mobility Pass'}
          </h1>
          <p className="text-[#64736C] text-xs">
            {view === 'login' ? 'Enter credentials to manage reservations and automated barrier access' : 'Instant automated barrier plate recognition & live bay reservation'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-[#ECF4EF] rounded-2xl border border-[#DDE5DF] text-xs font-bold">
          <button
            type="button"
            onClick={() => { setError(null); setInfoMessage(null); setView('login'); }}
            className={`py-2.5 rounded-xl transition-all ${
              view === 'login' ? 'bg-[#16A34A] text-white shadow-sm font-bold' : 'text-[#64736C] hover:text-[#17201D]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setError(null); setInfoMessage(null); setView('signup'); }}
            className={`py-2.5 rounded-xl transition-all ${
              view === 'signup' ? 'bg-[#16A34A] text-white shadow-sm font-bold' : 'text-[#64736C] hover:text-[#17201D]'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Info Message */}
        {infoMessage && (
          <div className="p-3.5 bg-[#DCFCE7] border border-[#BBF7D0] text-[#16A34A] rounded-2xl text-xs font-medium flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#16A34A]" />
            <div>{infoMessage}</div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-[#FEE2E2] border border-[#FECACA] text-[#E45757] rounded-2xl text-xs font-medium space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#E45757]" />
              <span>{error}</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-[#FECACA] text-[11px]">
              <button
                type="button"
                onClick={handleResetPassword}
                className="underline text-[#E45757] hover:text-[#991B1B] font-bold"
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
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A39B]" />
              <input
                type="text"
                name="username"
                placeholder="Driver Full Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-2xl p-3.5 pl-11 text-[#17201D] text-xs placeholder-[#94A39B] focus:border-[#16A34A] outline-none transition-all font-medium"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A39B]" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-2xl p-3.5 pl-11 text-[#17201D] text-xs placeholder-[#94A39B] focus:border-[#16A34A] outline-none transition-all font-medium"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A39B]" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-2xl p-3.5 pl-11 text-[#17201D] text-xs placeholder-[#94A39B] focus:border-[#16A34A] outline-none transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-black py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
          >
            {loading ? (
              'Authenticating...'
            ) : view === 'login' ? (
              <>
                <span>Sign In to PARKORA</span>
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
        <div className="p-4 bg-[#FAF9F6] border border-[#DDE5DF] rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#64736C] uppercase tracking-wider font-mono">
            <Sparkles className="w-3 h-3 text-[#16A34A]" /> Fast Access Portals
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoLogin('user@example.com', 'user123')}
              className="py-2.5 px-3 bg-white hover:bg-[#ECF4EF] text-[#17201D] font-bold rounded-xl transition-all border border-[#DDE5DF] text-[11px] shadow-sm"
            >
              Driver Demo
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('ujjsingh2005@gmail.com', 'Ujjwal@123')}
              className="py-2.5 px-3 bg-[#12372A] hover:bg-[#163D2E] text-[#4ADE80] font-bold rounded-xl transition-all border border-[#16A34A]/30 text-[11px]"
            >
              Admin Vault Login
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}



