"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Shield, Bell, Moon, Globe, ChevronRight, LayoutGrid, Layers } from 'lucide-react';
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
  const [darkMode, setDarkMode] = useState(false);

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
        <div className="h-10 w-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64736C] text-sm font-mono tracking-wide">Loading System Settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 min-h-screen bg-[#FAF9F6]">
      <div className="mb-8">
        <div className="text-[11px] font-bold text-[#16A34A] font-mono uppercase tracking-wider mb-1">Configuration Terminal</div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#17201D] mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-[#16A34A]" />
          System Preferences
        </h1>
        <p className="text-[#64736C] text-xs sm:text-sm">Manage notification telemetry, dark UI themes, and regional settings.</p>
      </div>

      <div className="space-y-8">
        {/* Admin Section (Only visible for admin) */}
        {profile?.role === 'admin' && (
          <section className="space-y-4">
            <h2 className="text-xs font-black text-[#D97706] uppercase tracking-widest flex items-center gap-2 px-1 font-mono">
              <Shield className="w-4 h-4 text-[#D97706]" /> Administrative Vault Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/admin/manage" className="group p-6 bg-white border border-[#DDE5DF] rounded-3xl hover:border-[#16A34A] transition-all flex items-center justify-between shadow-soft">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#DCFCE7] rounded-2xl text-[#16A34A] group-hover:scale-110 transition-transform">
                       <LayoutGrid className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="font-bold text-[#17201D] text-sm">Slot Configuration</h3>
                       <p className="text-xs text-[#64736C]">Add, delete, or modify parking bays.</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-[#94A39B] group-hover:text-[#16A34A] group-hover:translate-x-1 transition-all" />
              </Link>
              <Link href="/admin/manage" className="group p-6 bg-white border border-[#DDE5DF] rounded-3xl hover:border-[#16A34A] transition-all flex items-center justify-between shadow-soft">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-[#ECF4EF] rounded-2xl text-[#0F766E] group-hover:scale-110 transition-transform">
                       <Layers className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="font-bold text-[#17201D] text-sm">Zone Telemetry</h3>
                       <p className="text-xs text-[#64736C]">Configure zone rates and types.</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-[#94A39B] group-hover:text-[#16A34A] group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </section>
        )}

        {/* Preferences Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-[#64736C] uppercase tracking-widest px-1 font-mono">Telemetry & Personalization</h2>
          <div className="bg-white border border-[#DDE5DF] rounded-3xl overflow-hidden shadow-soft">
            <div className="divide-y divide-[#DDE5DF]">
               <div className="p-6 flex items-center justify-between hover:bg-[#FAF9F6] transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-[#ECF4EF] rounded-xl text-[#16A34A]">
                       <Bell className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-bold text-[#17201D] text-sm">Push Notifications</h4>
                        <p className="text-xs text-[#64736C]">Real-time alerts for booking expiration & extension warnings.</p>
                     </div>
                  </div>
                  <div 
                     onClick={() => setPushNotifications(!pushNotifications)}
                     className={`w-12 h-6 rounded-full relative shadow-inner cursor-pointer transition-colors duration-200 ${pushNotifications ? 'bg-[#16A34A]' : 'bg-[#CBD5CF]'}`}
                  >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${pushNotifications ? 'right-1' : 'left-1'}`} />
                  </div>
               </div>

               <div className="p-6 flex items-center justify-between hover:bg-[#FAF9F6] transition-colors">
                  <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-[#ECF4EF] rounded-xl text-[#0F766E]">
                       <Moon className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="font-bold text-[#17201D] text-sm">Graphite Dark Theme</h4>
                        <p className="text-xs text-[#64736C]">Optimized low-light mobility cockpit color rendering.</p>
                     </div>
                  </div>
                  <div 
                     onClick={() => setDarkMode(!darkMode)}
                     className={`w-12 h-6 rounded-full relative shadow-inner cursor-pointer transition-colors duration-200 ${darkMode ? 'bg-[#16A34A]' : 'bg-[#CBD5CF]'}`}
                  >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${darkMode ? 'right-1' : 'left-1'}`} />
                  </div>
               </div>

                <div className="p-6 flex items-center justify-between hover:bg-[#FAF9F6] transition-colors">
                   <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-[#ECF4EF] rounded-xl text-[#16A34A]">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div>
                         <h4 className="font-bold text-[#17201D] text-sm">Regional Dialect</h4>
                         <p className="text-xs text-[#64736C] font-mono">Current: {languages[langIndex]}</p>
                      </div>
                   </div>
                   <button 
                      onClick={handleLanguageChange}
                      className="text-xs font-bold text-[#16A34A] hover:text-[#15803D] py-1.5 px-3 bg-[#DCFCE7] rounded-xl border border-[#BBF7D0] transition-all font-mono"
                   >
                      Switch Language
                   </button>
                </div>
            </div>
          </div>
        </section>

        {/* Security Quick Link */}
        <section className="space-y-4">
          <h2 className="text-xs font-black text-[#64736C] uppercase tracking-widest px-1 font-mono">Security Vault</h2>
          <Link href="/profile" className="group p-6 bg-white border border-[#DDE5DF] rounded-3xl hover:border-[#16A34A] transition-all flex items-center justify-between shadow-soft">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#FEE2E2] rounded-2xl text-[#E45757]">
                    <Shield className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-[#17201D] text-sm">Security & Password Vault</h3>
                    <p className="text-xs text-[#64736C]">Update authentication keys and credentials.</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#94A39B] group-hover:text-[#17201D] group-hover:translate-x-1 transition-all" />
          </Link>
        </section>
      </div>
    </div>
  );
}


