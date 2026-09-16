"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Shield, Bell, Moon, Globe, ChevronRight, LayoutGrid, Layers, CreditCard } from 'lucide-react';
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
        .single();
      setProfile(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return <div className="p-12 text-center text-slate-400">Loading Settings...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
          <Settings className="w-10 h-10 text-blue-500" />
          General Settings
        </h1>
        <p className="text-slate-400">Manage your account preferences and system configurations.</p>
      </div>

      <div className="space-y-8">
        {/* Admin Section */}
        {profile?.role === 'admin' && (
          <section className="space-y-4">
            <h2 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <Shield className="w-4 h-4" /> Administrative Control
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/admin/manage" className="group p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-500 transition-all flex items-center justify-between shadow-xl">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
                       <LayoutGrid className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="font-bold text-white">Slot Management</h3>
                       <p className="text-xs text-slate-500">Create, delete, and price any slot.</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </Link>
              <Link href="/admin/manage" className="group p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-emerald-500 transition-all flex items-center justify-between shadow-xl">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                       <Layers className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="font-bold text-white">Zone Configuration</h3>
                       <p className="text-xs text-slate-500">Add or modify parking zones.</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>
          </section>
        )}

        {/* Preferences Section */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] px-1">Personalization</h2>
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="divide-y divide-slate-800">
               {/* Setting Component */}
               <div className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                     <Bell className="w-5 h-5 text-slate-400" />
                     <div>
                        <h4 className="font-bold text-white">Push Notifications</h4>
                        <p className="text-xs text-slate-500">Get alerts for booking expiry.</p>
                     </div>
                  </div>
                  <div 
                     onClick={() => setPushNotifications(!pushNotifications)}
                     className={`w-12 h-6 rounded-full relative shadow-inner cursor-pointer transition-colors duration-200 ${pushNotifications ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${pushNotifications ? 'right-1' : 'left-1'}`} />
                  </div>
               </div>

               <div className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-4">
                     <Moon className="w-5 h-5 text-slate-400" />
                     <div>
                        <h4 className="font-bold text-white">Dark Mode</h4>
                        <p className="text-xs text-slate-500">Adjust the visual appearance.</p>
                     </div>
                  </div>
                  <div 
                     onClick={() => setDarkMode(!darkMode)}
                     className={`w-12 h-6 rounded-full relative shadow-inner cursor-pointer transition-colors duration-200 ${darkMode ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-200 ${darkMode ? 'right-1' : 'left-1'}`} />
                  </div>
               </div>

                <div className="p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                   <div className="flex items-center gap-4">
                      <Globe className="w-5 h-5 text-slate-400" />
                      <div>
                         <h4 className="font-bold text-white">Language</h4>
                         <p className="text-xs text-slate-500">Current: {languages[langIndex]}</p>
                      </div>
                   </div>
                   <button 
                      onClick={handleLanguageChange}
                      className="text-xs font-bold text-blue-400 hover:text-white transition-colors"
                   >
                      Change
                   </button>
                </div>
            </div>
          </div>
        </section>

        {/* Security Quick Link */}
        <section className="space-y-4">
          <h2 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] px-1">Account Security</h2>
          <Link href="/profile" className="group p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-slate-600 transition-all flex items-center justify-between shadow-xl">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-500/10 rounded-2xl text-red-400">
                    <Shield className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-bold text-white">Profile & Password</h3>
                    <p className="text-xs text-slate-500">Update your credentials and identity.</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-700 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </Link>
        </section>
      </div>
    </div>
  );
}
