"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Layers, Crown, Calendar, Home, Lock, KeyRound, Eye, EyeOff, ShieldAlert, Sparkles, Shield } from 'lucide-react';

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
      setError(`Invalid Master Security Password. (Failed attempts: ${nextAttempts})`);
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
    { name: 'Pass Authority', href: '/admin/subscriptions', icon: Crown },
    { name: 'Global Bookings', href: '/admin/bookings', icon: Calendar },
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-[#64736C] font-mono text-xs">
        Verifying Security Vault Telemetry...
      </div>
    );
  }

  // -------------------------------------------------------------
  // MASTER PASSWORD SECURITY CHALLENGE SCREEN
  // -------------------------------------------------------------
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Ambient Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#16A34A]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-white border border-[#DDE5DF] rounded-3xl p-8 shadow-elevation relative z-10 space-y-6">
          <div className="text-center space-y-3">
            <div className="h-16 w-16 bg-[#DCFCE7] border border-[#BBF7D0] rounded-2xl flex items-center justify-center mx-auto text-[#16A34A] shadow-md">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-[#17201D] tracking-tight">PARKORA Admin Vault</h1>
            <p className="text-[#64736C] text-xs leading-relaxed">
              This area is protected by secondary master authority encryption. Enter your master security password to unlock full operational controls.
            </p>
          </div>

          {error && (
            <div className="p-3.5 bg-[#FEE2E2] border border-[#FECACA] text-[#E45757] rounded-2xl text-xs font-semibold flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 text-[#E45757]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A39B]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter Master Password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-[#DDE5DF] rounded-2xl p-4 pl-11 pr-11 text-[#17201D] placeholder-[#94A39B] focus:border-[#16A34A] outline-none text-xs font-mono tracking-wider transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64736C] hover:text-[#17201D]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#16A34A] hover:bg-[#15803D] text-white font-black py-4 rounded-xl transition-all shadow-md active:scale-[0.98] text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> Unlock Admin Vault
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#64736C] hover:text-[#16A34A] transition-colors"
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
    <div className="min-h-screen bg-[#FAF9F6] text-[#17201D] flex flex-col">
      {/* Dedicated Admin Portal Header */}
      <header className="border-b border-[#DDE5DF] bg-[#17201D] text-white sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-[#12372A] border border-[#16A34A]/40 rounded-xl flex items-center justify-center text-[#4ADE80]">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
                  PARKORA Admin Vault
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-[#12372A] text-[#4ADE80] border border-[#16A34A]/40">
                    Vault Unlocked
                  </span>
                </span>
              </div>
            </div>

            {/* Admin Nav Modules */}
            <div className="hidden md:flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#16A34A] text-white shadow-sm'
                        : 'text-[#A7B5AD] hover:text-white hover:bg-white/[0.06]'
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
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E45757]/15 hover:bg-[#E45757]/25 text-[#FB7185] border border-[#E45757]/30 rounded-xl text-xs font-bold transition-all"
                title="Lock Admin Portal"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Vault</span>
              </button>

              <Link
                href="/"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#12372A] hover:bg-[#163D2E] text-white rounded-xl text-xs font-bold transition-all border border-[#16A34A]/30"
              >
                <Home className="w-3.5 h-3.5 text-[#4ADE80]" />
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



