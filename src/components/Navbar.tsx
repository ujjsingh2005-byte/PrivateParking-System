"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Car, 
  Sparkles, 
  LogOut, 
  LogIn, 
  User, 
  CalendarDays, 
  Plus, 
  ShieldAlert,
  Radio
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (session?.user) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();
        setIsAdmin(prof?.role === 'admin');
      } else {
        setIsAdmin(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: prof }) => setIsAdmin(prof?.role === 'admin'));
      } else {
        setIsAdmin(false);
      }
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
    <>
      {/* Top Desktop & Tablet Header */}
      <header className="border-b border-[#DDE5DF] bg-[#17201D] text-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo & Live Status Indicator */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#0F766E] flex items-center justify-center text-white shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform">
                  <Car className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-lg tracking-tight text-white font-mono">
                      PARKORA
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#12372A] text-[#22C55E] border border-[#16A34A]/40 tracking-wider">
                      PRO
                    </span>
                  </div>
                  <span className="text-[10px] text-[#A7B5AD] tracking-wide -mt-1 font-medium">SMART MOBILITY</span>
                </div>
              </Link>

              {/* Live Operational Status (Emerald) */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#12372A] border border-[#16A34A]/30 text-[#4ADE80] text-[11px] font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
                </span>
                <span>TELEMETRY LIVE</span>
              </div>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <Link 
                href="/" 
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                  pathname === '/' 
                    ? 'text-white bg-[#12372A] border border-[#16A34A]/40' 
                    : 'text-[#A7B5AD] hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>Live Zones</span>
              </Link>

              <Link 
                href="/subscriptions" 
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                  pathname === '/subscriptions' 
                    ? 'text-white bg-[#12372A] border border-[#16A34A]/40' 
                    : 'text-[#A7B5AD] hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Mobility Pass</span>
              </Link>

              {user && (
                <Link 
                  href="/dashboard" 
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                    pathname === '/dashboard' 
                      ? 'text-white bg-[#12372A] border border-[#16A34A]/40' 
                      : 'text-[#A7B5AD] hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 text-[#14B8A6]" />
                  <span>My Passes & Bookings</span>
                </Link>
              )}

              {isAdmin && (
                <Link 
                  href="/admin" 
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-[#86EFAC] bg-[#12372A] border border-[#22C55E]/40 hover:bg-[#163D2E] transition-all"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Admin Vault</span>
                </Link>
              )}
            </div>

            {/* User Profile / Auth Area */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2.5">
                  <Link
                    href="/profile"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#12372A] border border-white/[0.08] hover:border-[#16A34A]/40 transition-colors text-xs text-white"
                  >
                    <User className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span className="max-w-[120px] truncate font-mono text-[11px]">{user.email}</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E45757]/15 text-[#FB7185] hover:bg-[#E45757]/25 border border-[#E45757]/30 rounded-xl text-xs font-semibold transition-all"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link 
                  href="/auth" 
                  className="flex items-center gap-1.5 bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/20 active:scale-[0.98]"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#17201D] text-white border-t border-white/[0.1] px-4 py-2 flex items-center justify-around shadow-lg">
        <Link 
          href="/" 
          className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors ${
            pathname === '/' ? 'text-[#22C55E] font-bold' : 'text-[#A7B5AD]'
          }`}
        >
          <Radio className="w-5 h-5" />
          <span>Live Zones</span>
        </Link>

        <Link 
          href="/subscriptions" 
          className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors ${
            pathname === '/subscriptions' ? 'text-[#F59E0B] font-bold' : 'text-[#A7B5AD]'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>Passes</span>
        </Link>

        {/* Floating Book Action */}
        <Link 
          href="/" 
          className="h-11 w-11 -mt-5 rounded-full bg-gradient-to-tr from-[#16A34A] to-[#0F766E] flex items-center justify-center text-white shadow-xl shadow-emerald-950/40 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </Link>

        <Link 
          href={user ? "/dashboard" : "/auth"} 
          className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors ${
            pathname === '/dashboard' ? 'text-[#22C55E] font-bold' : 'text-[#A7B5AD]'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span>Passes</span>
        </Link>

        <Link 
          href={user ? "/profile" : "/auth"} 
          className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors ${
            pathname === '/profile' ? 'text-[#22C55E] font-bold' : 'text-[#A7B5AD]'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </nav>
    </>
  );
}



