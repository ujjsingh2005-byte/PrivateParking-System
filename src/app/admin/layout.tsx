"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Layers, Crown, Calendar, Home, Lock, KeyRound, Eye, EyeOff, ShieldAlert, Compass } from 'lucide-react';

const MASTER_PASSWORD = 'Ujjwal@123';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Check session storage for existing unlocked state
    const unlocked = sessionStorage.getItem('admin_vault_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
    setCheckingAuth(false);
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (passwordInput === MASTER_PASSWORD) {
      sessionStorage.setItem('admin_vault_unlocked', 'true');
      setIsUnlocked(true);
      setPasswordInput('');
      setAttempts(0);
    } else {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      setError(`Invalid Master Password. (Failed attempts: ${nextAttempts})`);
    }
  };

  const handleLock = () => {
    sessionStorage.removeItem('admin_vault_unlocked');
    setIsUnlocked(false);
    setPasswordInput('');
  };

  const navItems = [
    { name: 'Console Overview', href: '/admin', icon: ShieldCheck },
    { name: 'Zones & Bays', href: '/admin/manage', icon: Layers },
    { name: 'Subscription Authority', href: '/admin/subscriptions', icon: Crown },
    { name: 'Global Bookings', href: '/admin/bookings', icon: Calendar },
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center text-slate-400 font-mono text-xs">
        Verifying Security Vault Credentials...
      </div>
    );
  }

  // -------------------------------------------------------------
  // MASTER PASSWORD SECURITY CHALLENGE SCREEN
  // -------------------------------------------------------------
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#0b1220] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-[#0f172a] border border-white/[0.08] rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="h-16 w-16 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center mx-auto text-cyan-400 shadow-xl shadow-cyan-500/10">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Admin Vault Security</h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              This area is protected by a secondary master access key. Enter your admin security password to unlock full system controls.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-xs font-semibold flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter Master Password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-[#0b1220] border border-white/[0.08] rounded-2xl p-4 pl-11 pr-11 text-white placeholder-slate-600 focus:border-cyan-500 outline-none text-xs font-mono tracking-wider transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-cyan-500/20 active:scale-[0.98] text-xs flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> Unlock Admin Portal
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-cyan-400 transition-colors"
            >
              <Home className="w-3.5 h-3.5" /> Return to Public Parking Site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // UNLOCKED ADMIN PORTAL WITH LOCK CONTROL
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#0b1220] text-white flex flex-col">
      {/* Dedicated Admin Portal Header */}
      <header className="border-b border-white/[0.08] bg-[#0b1220]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-center text-cyan-400">
                <Compass className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                  Admin Control Portal
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Vault Unlocked
                  </span>
                </span>
              </div>
            </div>

            {/* Admin Nav Modules */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Actions: Lock Vault & Public Site Switch */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleLock}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all"
                title="Lock Admin Portal"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Vault</span>
              </button>

              <Link
                href="/"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-white/[0.08]"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Public Site</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}

