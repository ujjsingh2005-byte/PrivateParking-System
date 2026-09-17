"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CarFront, User, LayoutDashboard, Crown, Bell, Check, Settings, ShieldAlert, LogIn, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUnreadNotificationsCount, getRecentNotifications, markAsRead } from '@/services/notificationService';

export default function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        checkRole(session.user.id);
        loadNotifications(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        checkRole(session.user.id);
        loadNotifications(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRole = async (userId: string) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    setIsAdmin(profile?.role === 'admin');
  };

  const loadNotifications = async (userId: string) => {
    const count = await getUnreadNotificationsCount(userId);
    setUnreadCount(count);
    const recent = await getRecentNotifications(userId);
    setNotifications(recent);
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('realtime:notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        loadNotifications(user.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleMarkRead = async (id: string) => {
    await markAsRead(id);
    loadNotifications(user.id);
  };

  return (
    <nav className="border-b bg-black/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <CarFront className="w-8 h-8 text-blue-500 transition-transform hover:scale-110" />
            <span className="font-bold text-xl tracking-tight text-white">SmartPark</span>
          </Link>
          
          <div className="flex items-center gap-6">
            {/* Public Links for all users */}
            <Link href="/" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
              Zones
            </Link>

            <Link href="/subscriptions" className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors text-sm font-medium">
              <Crown className="w-4 h-4" />
              <span>Pro</span>
            </Link>

            {/* Admin Only Private Links */}
            {isAdmin && (
              <>
                <Link href="/admin" className="flex items-center gap-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Authority</span>
                </Link>

                <Link href="/dashboard" className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors text-sm font-medium">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <Link href="/settings" className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-slate-800 transition-all">
                  <Settings className="w-5 h-5" />
                </Link>
              </>
            )}

            {/* Notifications (if signed in) */}
            {user && (
              <div className="relative">
                <button 
                  onClick={() => setShowPanel(!showPanel)}
                  className="p-2 text-gray-400 hover:text-white relative rounded-full hover:bg-slate-800 transition-all"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-slate-900">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showPanel && (
                  <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-slate-800 font-bold bg-slate-900 text-white text-sm">
                      Notifications
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">No notifications yet.</div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={`p-4 border-b border-slate-800 hover:bg-slate-800/50 transition-colors flex justify-between gap-3 ${!n.is_read ? 'bg-blue-500/5' : ''}`}
                          >
                            <div className="space-y-1">
                              <p className="text-sm text-slate-200 leading-snug">{n.message}</p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {!n.is_read && (
                              <button 
                                onClick={() => handleMarkRead(n.id)}
                                className="flex-shrink-0 p-1 bg-slate-800 rounded-lg hover:bg-slate-700 h-8 w-8 flex items-center justify-center border border-slate-700"
                              >
                                <Check className="w-4 h-4 text-emerald-400" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <Link href={isAdmin ? "/profile" : "/"} className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 cursor-pointer hover:border-slate-500 transition-all">
                <User className="w-5 h-5 text-gray-400" />
              </Link>
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
