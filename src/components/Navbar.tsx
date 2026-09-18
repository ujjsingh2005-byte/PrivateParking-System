"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Car, 
  Crown, 
  LogOut, 
  LogIn, 
  User, 
  CalendarDays, 
  LayoutDashboard, 
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
      <header className="border-b border-white/[0.08] bg-[#111827]/90 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            {/* Logo & Live Status Indicator */}
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-white shadow-lg shadow-purple-600/25 group-hover:scale-105 transition-transform">
                  <Car className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                    SMARTPARK
                  </span>
                </div>
              </Link>

              {/* Live Operational Status (Lime Green) */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#84cc16]/10 border border-[#84cc16]/20 text-[#84cc16] text-[11px] font-semibold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#84cc16] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#84cc16]"></span>
                </span>
                <span>● LIVE</span>
              </div>
            </div>
            
            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-2">
              <Link 
                href="/" 
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                  pathname === '/' 
                    ? 'text-white bg-[#7c3aed]/20 border border-[#7c3aed]/40' 
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                <span>Live Parking</span>
              </Link>

              <Link 
                href="/subscriptions" 
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                  pathname === '/subscriptions' 
                    ? 'text-white bg-[#7c3aed]/20 border border-[#7c3aed]/40' 
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                <span>Pro Pass</span>
              </Link>

              {user && (
                <Link 
                  href="/dashboard" 
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                    pathname === '/dashboard' 
                      ? 'text-white bg-[#7c3aed]/20 border border-[#7c3aed]/40' 
                      : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <CalendarDays className="w-3.5 h-3.5 text-purple-400" />
                  <span>Bookings & Pass</span>
                </Link>
              )}

              {isAdmin && (
                <Link 
                  href="/admin" 
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-purple-300 hover:text-white bg-purple-950/40 border border-purple-800/40 hover:bg-purple-900/40 transition-all"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin Console</span>
                </Link>
              )}
            </div>

            {/* User Profile / Auth Area */}
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2.5">
                  <Link
                    href="/profile"
                    className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#172033] border border-white/[0.08] hover:border-purple-500/40 transition-colors text-xs text-slate-200"
                  >
                    <User className="w-3.5 h-3.5 text-purple-400" />
                    <span className="max-w-[120px] truncate font-mono text-[11px]">{user.email}</span>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f43f5e]/10 text-[#f43f5e] hover:bg-[#f43f5e]/20 border border-[#f43f5e]/20 rounded-xl text-xs font-semibold transition-all"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link 
                  href="/auth" 
                  className="flex items-center gap-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-purple-600/25 active:scale-[0.98]"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#111827]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2 flex items-center justify-around">
        <Link 
          href="/" 
          className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors ${
            pathname === '/' ? 'text-purple-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Radio className="w-5 h-5" />
          <span>Live Parking</span>
        </Link>

        <Link 
          href="/subscriptions" 
          className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors ${
            pathname === '/subscriptions' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Crown className="w-5 h-5" />
          <span>Pro Pass</span>
        </Link>

        {/* Floating Book Action */}
        <Link 
          href="/" 
          className="h-11 w-11 -mt-5 rounded-full bg-gradient-to-tr from-[#7c3aed] to-[#a855f7] flex items-center justify-center text-white shadow-xl shadow-purple-600/40 active:scale-95 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </Link>

        <Link 
          href={user ? "/dashboard" : "/auth"} 
          className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors ${
            pathname === '/dashboard' ? 'text-purple-400 font-bold' : 'text-slate-400'
          }`}
        >
          <CalendarDays className="w-5 h-5" />
          <span>Bookings</span>
        </Link>

        <Link 
          href={user ? "/profile" : "/auth"} 
          className={`flex flex-col items-center gap-1 py-1 text-[10px] font-medium transition-colors ${
            pathname === '/profile' ? 'text-purple-400 font-bold' : 'text-slate-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </Link>
      </nav>
    </>
  );
}


