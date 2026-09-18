"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Shield, Bell, Moon, Globe, ChevronRight, LayoutGrid, Layers, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const languages = ['English (US)', 'Spanish', 'French', 'German', 'Hindi'];
  const [langIndex, setLangIndex] = useState(0);

  const handleLanguageChange = () => {
    setLangIndex((prev) => (prev + 1) % languages.length);
  };

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [pushNotifications, setPushNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      setProfile(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm font-mono tracking-wide">Loading System Settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10">
        <div className="text-[11px] font-bold text-violet-400 font-mono uppercase tracking-wider mb-1">Configuration Terminal</div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-violet-400" />
          System Preferences
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm">Manage notification telemetry, dark UI themes, and regional settings.</p>
      </div>

      <div className="space-y-8">
        {/* Admin Section (Only visible for admin) */}
        {profile?.role === 'admin' && (
          <section className="space-y-4">
            <h2 className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-2 px-1 font-mono">
              <Shield className="w-4 h-4 text-amber-400" /> Administrative Vault Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/admin/manage" className="group p-6 bg-surface-1 border border-white/[0.08] rounded-3xl hover:border-violet-500/50 transition-all flex items-center justify-between shadow-xl">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-500/15 rounded-2xl text-violet-400 group-hover:scale-110 transition-transform">
                       <LayoutGrid className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="font-bold text-white text-sm">Slot Configuration</h3>
                       <p className="text-xs text-slate-400">Add, delete, or modify parking bays.</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
              </Link>
              <Link href="/admin/manage" className="group p-6 bg-surface-1 border border-white/[0.08] rounded-3xl hover:border-lime-500/50 transition-all flex items-center justify-between shadow-xl">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-lime-500/15 rounded-2xl text-lime-400 group-hover:scale-110 transition-transform">
                       <Layers className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="font-bold text-white text-sm">Zone Telemetry</h3>
                       <p className="text-xs text-slate-400">Configure zone rates and types.</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-lime-400 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </section>
        )}

        {/* Preferences Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 font-mono">Telemetry & Personalization</h2>
          <div className="bg-surface-1 border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
            <div className="divide-y divide-white/[0.06]">
               <div className="p-6 flex items-center justify-between hover:bg-surface-2/40 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-surface-2 rounded-xl text-violet-400">
                       <Bell className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-bold text-white text-sm">Push Notifications</h4>
                        <p className="text-xs text-slate-400">Real-time alerts for booking expiration & extension warnings.</p>
                     </div>
                  </div>
                  <div 
                     onClick={() => setPushNotifications(!pushNotifications)}
                     className={`w-12 h-6 rounded-full relative shadow-inner cursor-pointer transition-colors duration-200 ${pushNotifications ? 'bg-violet-600' : 'bg-surface-3'}`}
                  >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${pushNotifications ? 'right-1' : 'left-1'}`} />
                  </div>
               </div>

               <div className="p-6 flex items-center justify-between hover:bg-surface-2/40 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-surface-2 rounded-xl text-violet-400">
                       <Moon className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-bold text-white text-sm">High-Contrast Midnight Mode</h4>
                        <p className="text-xs text-slate-400">Optimized OLED deep canvas color rendering.</p>
                     </div>
                  </div>
                  <div 
                     onClick={() => setDarkMode(!darkMode)}
                     className={`w-12 h-6 rounded-full relative shadow-inner cursor-pointer transition-colors duration-200 ${darkMode ? 'bg-violet-600' : 'bg-surface-3'}`}
                  >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${darkMode ? 'right-1' : 'left-1'}`} />
                  </div>
               </div>

                <div className="p-6 flex items-center justify-between hover:bg-surface-2/40 transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-surface-2 rounded-xl text-violet-400">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                         <h4 className="font-bold text-white text-sm">Regional Dialect</h4>
                         <p className="text-xs text-slate-400 font-mono">Current: {languages[langIndex]}</p>
                      </div>
                   </div>
                   <button 
                      onClick={handleLanguageChange}
                      className="text-xs font-bold text-violet-400 hover:text-violet-300 py-1.5 px-3 bg-violet-500/10 rounded-xl border border-violet-500/20 transition-all font-mono"
                   >
                      Switch Language
                   </button>
                </div>
            </div>
          </div>
        </section>

        {/* Security Quick Link */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 font-mono">Security Vault</h2>
          <Link href="/profile" className="group p-6 bg-surface-1 border border-white/[0.08] rounded-3xl hover:border-violet-500/40 transition-all flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500/10 rounded-2xl text-rose-400">
                    <Shield className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm">Security & Password Vault</h3>
                    <p className="text-xs text-slate-400">Update authentication keys and credentials.</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>
        </section>
      </div>
    </div>
  );
}

