"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Globe, Code } from 'lucide-react';

export default function AuthPage() {
  const [view, setView] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (view === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });
        if (error) throw error;
        alert('Verification email sent (check your inbox)!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) setError(error.message);
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {view === 'login' ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-slate-400">
            {view === 'login' ? 'Sign in to access your parking dashboard' : 'Join our smart parking community today'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all font-medium text-slate-300"
          >
            <Globe className="w-5 h-5 text-blue-500" />
            Google
          </button>
          <button
            className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all font-medium text-slate-300 opacity-50 cursor-not-allowed"
          >
            <Code className="w-5 h-5" />
            GitHub
          </button>
        </div>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-4 text-slate-500 font-bold tracking-tight">Or continue with</span>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {view === 'signup' && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pl-12 text-white placeholder-slate-600 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pl-12 text-white placeholder-slate-600 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 pl-12 text-white placeholder-slate-600 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            {loading ? 'Processing...' : (view === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="mt-8 text-center sm:text-sm text-slate-400">
          {view === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setView('signup')} className="text-blue-400 font-bold hover:underline">
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={() => setView('login')} className="text-blue-400 font-bold hover:underline">
                Sign In
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
