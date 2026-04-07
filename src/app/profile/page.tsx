"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, Shield, Calendar, Hash, LogOut, ChevronRight } from 'lucide-react';
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

  if (loading) return <div className="p-12 text-center text-slate-400">Loading Profile...</div>;

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center p-12 bg-slate-900 border border-slate-800 rounded-3xl">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Not Signed In</h2>
        <p className="text-slate-400 mb-6">Please log in to view your profile settings.</p>
        <Link href="/auth" className="inline-block bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-colors">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-white">My Profile</h1>
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
          className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500" />
            
            <div className="relative group w-24 h-24 mx-auto mb-4">
              <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center border-4 border-slate-950 shadow-xl overflow-hidden">
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

            <h2 className="text-xl font-bold text-white mb-1">{profile?.full_name || profile?.username || 'Guest'}</h2>
            <p className="text-slate-500 text-sm mb-6 lowercase">{profile?.role || 'User'}</p>
            
            <div className="flex justify-center gap-2">
               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${profile?.role === 'admin' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                 {profile?.role}
               </span>
               <span className="px-3 py-1 bg-slate-950 text-slate-400 rounded-full text-[10px] font-black border border-slate-800">
                 Verified
               </span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
             <h3 className="font-bold text-sm text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-800">Account Stats</h3>
             <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Joined</span>
                <span className="text-slate-300">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Tier</span>
                <span className="text-amber-400 font-bold">Standard</span>
             </div>
          </div>
        </div>

        {/* Settings Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-8 border-b border-slate-800 bg-slate-900/50">
               <h3 className="text-lg font-bold">Account Settings</h3>
            </div>
            
            <div className="p-8 space-y-8">
              {/* Full Name Field */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <User className="w-4 h-4 text-slate-500" />
                    Full Identity
                  </div>
                  <p className="text-sm text-slate-500 capitalize">{profile?.full_name || 'Set your name (e.g. Ujjwal Singh)'}</p>
                </div>
                {editing ? (
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <input 
                      type="text" 
                      placeholder="Full Name"
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm w-full focus:border-blue-500 outline-none"
                    />
                    <div className="flex gap-2">
                       <button onClick={handleUpdateProfile} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                         Save
                       </button>
                       <button onClick={() => setEditing(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                         Cancel
                       </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setEditing(true); setFullName(profile?.full_name || ''); }} className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors py-2">
                    Edit
                  </button>
                )}
              </div>

              {/* Username Field */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <User className="w-4 h-4 text-slate-500" />
                    System Username
                  </div>
                  <p className="text-sm text-slate-500">@{profile?.username || 'user'}</p>
                </div>
                {editing ? (
                   <input 
                    type="text" 
                    placeholder="Username"
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm w-full sm:w-auto focus:border-blue-500 outline-none"
                  />
                ) : null}
              </div>

              {/* Email (Read Only) */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 opacity-75">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Mail className="w-4 h-4 text-slate-500" />
                    Email Address
                  </div>
                  <p className="text-sm text-slate-500">{session.user.email}</p>
                </div>
                <span className="text-xs bg-slate-800/50 border border-slate-700 px-2 py-1 rounded text-slate-500 h-fit">Primary</span>
              </div>

              {/* Account ID */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 opacity-75">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <Hash className="w-4 h-4 text-slate-500" />
                    Account UID
                  </div>
                  <p className="text-xs font-mono text-slate-500 select-all cursor-copy" title="Click to select">{session.user.id}</p>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-950 border-t border-slate-800 space-y-6">
               <h4 className="text-sm font-bold text-white flex items-center gap-2 hover:text-blue-400 cursor-pointer transition-colors transition-all">
                  <Shield className="w-4 h-4" /> Change Password
               </h4>
               <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">New Password</label>
                     <input 
                       type="password" 
                       id="new-password"
                       placeholder="••••••••"
                       className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:border-blue-500 outline-none"
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
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-all"
                  >
                    Update
                  </button>
               </div>
            </div>

            <div className="p-8 bg-slate-900/50 border-t border-slate-800">
               <button className="w-full sm:w-auto px-6 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl text-sm font-bold border border-red-500/20 transition-all">
                 Request Account Deletion
               </button>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard" className="p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-blue-500/30 transition-all group">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400"><Calendar className="w-5 h-5" /></div>
                     <span className="font-bold text-white">My Bookings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
               </div>
            </Link>
            <Link href="/subscriptions" className="p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-amber-500/30 transition-all group">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500"><Shield className="w-5 h-5" /></div>
                     <span className="font-bold text-white">Subscription</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:translate-x-1 transition-transform" />
               </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
