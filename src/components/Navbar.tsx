"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Crown, LogOut, LogIn, Activity, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  // If inside admin suite, let AdminLayout render its specialized admin console header
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="border-b border-white/[0.08] bg-[#0b1220]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Live Status Pill */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                  SmartPark <span className="text-cyan-400 text-xs font-mono font-normal">OS</span>
                </span>
              </div>
            </Link>

            {/* Live Operational Status Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>LIVE SYSTEM</span>
            </div>
          </div>
          
          {/* User-Facing Navigation */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link 
              href="/" 
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                pathname === '/' 
                  ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/20' 
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span>Parking Zones</span>
            </Link>

            <Link 
              href="/subscriptions" 
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                pathname === '/subscriptions' 
                  ? 'text-cyan-300 bg-cyan-500/10 border border-cyan-500/20' 
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Pro Passes</span>
            </Link>

            <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="max-w-[120px] truncate font-mono text-[11px]">{user.email}</span>
                </div>

                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-semibold transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <Link 
                href="/auth" 
                className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-[#0b1220] text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

