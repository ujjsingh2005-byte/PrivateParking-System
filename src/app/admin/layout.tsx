"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Layers, Crown, Calendar, ArrowLeft, Home } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Overview', href: '/admin', icon: ShieldCheck },
    { name: 'Zones & Slots', href: '/admin/manage', icon: Layers },
    { name: 'Subscription Authority', href: '/admin/subscriptions', icon: Crown },
    { name: 'Bookings & Payments', href: '/admin/bookings', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Dedicated Admin Portal Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-lg tracking-tight text-white flex items-center gap-2">
                  Admin Control Portal
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Link back to public site */}
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Public Site</span>
            </Link>
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
