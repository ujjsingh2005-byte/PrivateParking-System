"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, Shield, Calendar, Hash, LogOut, ChevronRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    setProfile(data);
    setNewUsername(data?.username || '');
    setFullName(data?.full_name || '');
    setLoading(false);
  };

  const handleUpdateProfile = async () => {
    if (!session?.user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        username: newUsername,
        full_name: fullName
      })
      .eq('id', session.user.id);

    if (error) {
       alert(error.message);
    } else {
       setProfile({ ...profile, username: newUsername, full_name: fullName });
       setEditing(false);
    }
  };

  const uploadAvatar = async (event: any) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile({ ...profile, avatar_url: publicUrl });
      alert('Avatar updated successfully!');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-24 text-center">
        <div className="h-10 w-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm font-mono tracking-wide">Loading Driver Identity...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center p-8 bg-surface-1 border border-white/[0.08] rounded-3xl shadow-2xl space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white">Not Signed In</h2>
        <p className="text-slate-400 text-xs leading-relaxed">Please log in to view your profile settings and ANPR passes.</p>
        <Link href="/auth" className="inline-block w-full bg-violet-600 hover:bg-violet-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-violet-600/30 text-xs uppercase tracking-wider">
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-violet-400 font-mono uppercase tracking-wider mb-1">Driver Credentials</div>
          <h1 className="text-3xl font-black text-white">My Profile & Passes</h1>
        </div>
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
          className="flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 px-4 py-2.5 rounded-xl border border-rose-500/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-1 border border-white/[0.08] rounded-3xl p-8 text-center overflow-hidden relative shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-600 to-purple-500" />
            
            <div className="relative group w-24 h-24 mx-auto mb-4">
              <div className="w-24 h-24 bg-surface-2 rounded-full flex items-center justify-center border-4 border-surface-1 shadow-xl overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <label 
                className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer text-[10px] font-bold text-white uppercase"
              >
                {uploading ? '...' : 'Upload'}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={uploadAvatar} 
                  disabled={uploading} 
                  className="hidden" 
                />
              </label>
            </div>

            <h2 className="text-xl font-black text-white mb-1">{profile?.full_name || profile?.username || 'Driver'}</h2>
            <p className="text-slate-500 text-xs mb-6 lowercase font-mono">{profile?.role || 'User'}</p>
            
            <div className="flex justify-center gap-2">
               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${profile?.role === 'admin' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-violet-500/15 text-violet-300 border-violet-500/30'}`}>
                 {profile?.role || 'Driver'}
               </span>
               <span className="px-3 py-1 bg-lime-500/15 text-lime-300 rounded-full text-[10px] font-black border border-lime-500/30 flex items-center gap-1">
                 <CheckCircle2 className="w-3 h-3 text-lime-400" /> Verified
               </span>
            </div>
          </div>

          <div className="bg-surface-1 border border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-xl">
             <h3 className="font-bold text-xs text-slate-400 uppercase tracking-widest pb-2 border-b border-white/[0.06] font-mono">Account Telemetry</h3>
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Registration</span>
                <span className="text-slate-300 font-mono">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Active'}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Access Status</span>
                <span className="text-lime-400 font-bold font-mono">ANPR Active</span>
             </div>
          </div>
        </div>

        {/* Settings Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-1 border border-white/[0.08] rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/[0.06] bg-surface-2/40">
               <h3 className="text-lg font-black text-white">Driver Identity & Credentials</h3>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Full Name Field */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <User className="w-4 h-4 text-violet-400" />
                    Full Driver Name
                  </div>
                  <p className="text-xs text-slate-400">{profile?.full_name || 'Set your name (e.g. Ujjwal Singh)'}</p>
                </div>
                {editing ? (
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <input 
                      type="text" 
                      placeholder="Full Name"
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-2 text-xs w-full focus:border-violet-500 outline-none text-white"
                    />
                    <div className="flex gap-2">
                       <button onClick={handleUpdateProfile} className="flex-1 bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md">
                         Save
                       </button>
                       <button onClick={() => setEditing(false)} className="flex-1 bg-surface-2 hover:bg-surface-3 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
                         Cancel
                       </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setEditing(true); setFullName(profile?.full_name || ''); }} className="text-xs font-bold text-violet-400 hover:text-violet-300 transition-colors py-1 px-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                    Edit Name
                  </button>
                )}
              </div>

              {/* Username Field */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <User className="w-4 h-4 text-violet-400" />
                    Driver Handle
                  </div>
                  <p className="text-xs text-slate-400 font-mono">@{profile?.username || 'driver'}</p>
                </div>
                {editing ? (
                   <input 
                    type="text" 
                    placeholder="Username"
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-surface-2 border border-white/[0.08] rounded-xl px-4 py-2 text-xs w-full sm:w-auto focus:border-violet-500 outline-none text-white font-mono"
                  />
                ) : null}
              </div>

              {/* Email (Read Only) */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Mail className="w-4 h-4 text-slate-500" />
                    Verified Email
                  </div>
                  <p className="text-xs text-slate-400 font-mono">{session.user.email}</p>
                </div>
                <span className="text-[10px] font-bold font-mono bg-surface-2 border border-white/[0.06] px-2.5 py-1 rounded-lg text-slate-400 h-fit">Primary</span>
              </div>

              {/* Account ID */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Hash className="w-4 h-4 text-slate-500" />
                    Identity UID
                  </div>
                  <p className="text-[11px] font-mono text-slate-500 select-all cursor-copy" title="Click to select">{session.user.id}</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-surface-2/40 border-t border-white/[0.06] space-y-5">
               <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-violet-400" /> Change Security Password
               </h4>
               <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 space-y-1.5 w-full">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-mono">New Password</label>
                     <input 
                       type="password" 
                       id="new-password"
                       placeholder="••••••••"
                       className="w-full bg-surface-1 border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-white focus:border-violet-500 outline-none"
                     />
                  </div>
                  <button 
                    onClick={async () => {
                      const password = (document.getElementById('new-password') as HTMLInputElement).value;
                      if (!password || password.length < 6) return alert('Password must be at least 6 characters');
                      const { error } = await supabase.auth.updateUser({ password });
                      if (error) alert(error.message);
                      else {
                        alert('Password updated successfully!');
                        (document.getElementById('new-password') as HTMLInputElement).value = '';
                      }
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-violet-600/30"
                  >
                    Update Key
                  </button>
               </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard" className="p-6 bg-surface-1 border border-white/[0.08] rounded-3xl hover:border-violet-500/40 transition-all group shadow-xl">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-violet-500/10 rounded-2xl text-violet-400"><Calendar className="w-5 h-5" /></div>
                     <span className="font-bold text-white text-sm">Dashboard & History</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-transform" />
               </div>
            </Link>
            <Link href="/subscriptions" className="p-6 bg-surface-1 border border-white/[0.08] rounded-3xl hover:border-lime-500/40 transition-all group shadow-xl">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-lime-500/10 rounded-2xl text-lime-400"><Shield className="w-5 h-5" /></div>
                     <span className="font-bold text-white text-sm">Membership Pass</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-lime-400 group-hover:translate-x-1 transition-transform" />
               </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

