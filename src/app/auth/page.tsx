"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Globe, Code, KeyRound, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

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
          window.location.href = '/dashboard';
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
              window.location.href = '/dashboard';
              return;
            }
          }
          throw signInErr;
        }

        if (data?.session) {
          window.location.href = '/dashboard';
        }
      }
    } catch (err: any) {
      console.error('Error during auth:', err);
      setError(err.message || 'Authentication failed. Please check your details.');
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
        redirectTo: `${window.location.origin}/settings`,
      });
      if (error) throw error;
      setInfoMessage(`Password reset link sent to ${email}! Check your inbox.`);
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
        window.location.href = '/dashboard';
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
        window.location.href = '/dashboard';
      } else {
        setInfoMessage('Demo account created! Please sign in or check your email.');
      }
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            {view === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-slate-400 text-sm">
            {view === 'login' ? 'Sign in to access your parking dashboard' : 'Join our smart parking community today'}
          </p>
        </div>

        {/* Info Message */}
        {infoMessage && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl text-sm font-medium flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{infoMessage}</div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-medium space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1 border-t border-red-500/20 text-xs">
              <button
                type="button"
                onClick={handleResetPassword}
                className="underline text-red-300 hover:text-white font-bold"
              >
                Send Password Reset Email
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => { setError(null); setView('signup'); }}
                className="underline text-red-300 hover:text-white font-bold"
              >
                Switch to Sign Up
              </button>
            </div>
          </div>
        )}

        {/* Social Logins */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-2xl transition-all font-medium text-slate-300 text-sm"
          >
            <Globe className="w-4 h-4 text-blue-500" />
            Google
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 border border-slate-700 rounded-2xl font-medium text-slate-500 opacity-50 cursor-not-allowed text-sm"
          >
            <Code className="w-4 h-4" />
            GitHub
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-4 text-slate-500 font-bold tracking-tight">Or continue with</span>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          {view === 'signup' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-white placeholder-slate-600 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-white placeholder-slate-600 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 text-white placeholder-slate-600 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              'Processing...'
            ) : view === 'login' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Demo Fast Access Buttons */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Demo Access
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoLogin('user@example.com', 'user123')}
              className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all border border-slate-700"
            >
              Demo User
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('ujjsingh2005@gmail.com', 'Ujjwal@123')}
              className="py-2.5 px-3 bg-blue-950/50 hover:bg-blue-900/50 text-blue-400 font-bold rounded-xl transition-all border border-blue-800/40"
            >
              Admin (ujjsingh2005)
            </button>
          </div>
        </div>

        {/* Footer Toggle */}
        <div className="text-center text-sm text-slate-400">
          {view === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setError(null); setView('signup'); }}
                className="text-blue-400 font-bold hover:underline"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setError(null); setView('login'); }}
                className="text-blue-400 font-bold hover:underline"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
