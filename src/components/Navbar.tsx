"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CarFront, Crown, LogOut, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Navbar() {
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

  return (
    <nav className="border-b border-slate-800 bg-black/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <CarFront className="w-8 h-8 text-blue-500 transition-transform hover:scale-110" />
            <span className="font-bold text-xl tracking-tight text-white">SmartPark</span>
          </Link>
          
          {/* User Only Clean Navigation */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Zones
            </Link>

            <Link href="/subscriptions" className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium">
              <Crown className="w-4 h-4" />
              <span>Pro</span>
            </Link>

            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-xs font-bold transition-all"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            ) : (
              <Link href="/auth" className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md">
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
