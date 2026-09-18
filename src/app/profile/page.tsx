"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, Shield, Calendar, Hash, LogOut, ChevronRight, CheckCircle2, Sparkles } from 'lucide-react';
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
        <div className="h-10 w-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#64736C] text-sm font-mono tracking-wide">Loading Driver Identity...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto mt-24 text-center p-8 bg-white border border-[#DDE5DF] rounded-3xl shadow-elevation space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] border border-[#FECACA] flex items-center justify-center mx-auto text-[#E45757]">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#17201D]">Not Signed In</h2>
        <p className="text-[#64736C] text-xs leading-relaxed">Please log in to view your profile settings and ANPR passes.</p>
        <Link href="/auth" className="inline-block w-full bg-[#16A34A] hover:bg-[#15803D] text-white py-3 rounded-xl font-bold transition-all shadow-md text-xs uppercase tracking-wider">
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 min-h-screen bg-[#FAF9F6]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-[11px] font-bold text-[#16A34A] font-mono uppercase tracking-wider mb-1">Driver Credentials</div>
          <h1 className="text-3xl font-black text-[#17201D]">My Profile & Passes</h1>
        </div>
        <button 
          onClick={() => supabase.auth.signOut().then(() => window.location.href = '/')}
          className="flex items-center gap-2 text-xs font-bold text-[#E45757] hover:text-[#991B1B] bg-[#FEE2E2] hover:bg-[#FECACA] px-4 py-2.5 rounded-xl border border-[#FECACA] transition-all"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-[#DDE5DF] rounded-3xl p-8 text-center overflow-hidden relative shadow-soft">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#16A34A]" />
            
            <div className="relative group w-24 h-24 mx-auto mb-4">
              <div className="w-24 h-24 bg-[#ECF4EF] rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-[#64736C]" />
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

            <h2 className="text-xl font-black text-[#17201D] mb-1">{profile?.full_name || profile?.username || 'Driver'}</h2>
            <p className="text-[#64736C] text-xs mb-6 lowercase font-mono">{profile?.role || 'User'}</p>
            
            <div className="flex justify-center gap-2">
               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${profile?.role === 'admin' ? 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]' : 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'}`}>
                 {profile?.role || 'Driver'}
               </span>
               <span className="px-3 py-1 bg-[#DCFCE7] text-[#16A34A] rounded-full text-[10px] font-black border border-[#BBF7D0] flex items-center gap-1">
                 <CheckCircle2 className="w-3 h-3 text-[#16A34A]" /> Verified
               </span>
            </div>
          </div>

          <div className="bg-white border border-[#DDE5DF] rounded-3xl p-6 space-y-4 shadow-soft">
             <h3 className="font-bold text-xs text-[#64736C] uppercase tracking-widest pb-2 border-b border-[#DDE5DF] font-mono">Account Telemetry</h3>
             <div className="flex justify-between items-center text-xs">
                <span className="text-[#64736C] font-medium">Registration</span>
                <span className="text-[#17201D] font-mono font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Active'}</span>
             </div>
             <div className="flex justify-between items-center text-xs">
                <span className="text-[#64736C] font-medium">Access Status</span>
                <span className="text-[#16A34A] font-bold font-mono">ANPR Gate Active</span>
             </div>
          </div>
        </div>

        {/* Settings Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#DDE5DF] rounded-3xl overflow-hidden shadow-soft">
            <div className="p-6 sm:p-8 border-b border-[#DDE5DF] bg-[#FAF9F6]">
               <h3 className="text-lg font-black text-[#17201D]">Driver Identity & Credentials</h3>
            </div>
            
            <div className="p-6 sm:p-8 space-y-6">
              {/* Full Name Field */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#17201D] font-bold text-sm">
                    <User className="w-4 h-4 text-[#16A34A]" />
                    Full Driver Name
                  </div>
                  <p className="text-xs text-[#64736C]">{profile?.full_name || 'Set your name (e.g. Ujjwal Singh)'}</p>
                </div>
                {editing ? (
                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <input 
                      type="text" 
                      placeholder="Full Name"
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-[#FAF9F6] border border-[#DDE5DF] rounded-xl px-4 py-2 text-xs w-full focus:border-[#16A34A] outline-none text-[#17201D]"
                    />
                    <div className="flex gap-2">
                       <button onClick={handleUpdateProfile} className="flex-1 bg-[#16A34A] hover:bg-[#15803D] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm">
                         Save
                       </button>
                       <button onClick={() => setEditing(false)} className="flex-1 bg-[#ECF4EF] hover:bg-[#DDE5DF] text-[#17201D] px-4 py-2 rounded-xl text-xs font-bold transition-all">
                         Cancel
                       </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setEditing(true); setFullName(profile?.full_name || ''); }} className="text-xs font-bold text-[#16A34A] hover:text-[#15803D] transition-colors py-1 px-3 bg-[#DCFCE7] rounded-lg border border-[#BBF7D0]">
                    Edit Name
                  </button>
                )}
              </div>

              {/* Username Field */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#17201D] font-bold text-sm">
                    <User className="w-4 h-4 text-[#16A34A]" />
                    Driver Handle
                  </div>
                  <p className="text-xs text-[#64736C] font-mono">@{profile?.username || 'driver'}</p>
                </div>
                {editing ? (
                   <input 
                    type="text" 
                    placeholder="Username"
                    value={newUsername} 
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-[#FAF9F6] border border-[#DDE5DF] rounded-xl px-4 py-2 text-xs w-full sm:w-auto focus:border-[#16A34A] outline-none text-[#17201D] font-mono"
                  />
                ) : null}
              </div>

              {/* Email (Read Only) */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#17201D] font-bold text-sm">
                    <Mail className="w-4 h-4 text-[#64736C]" />
                    Verified Email
                  </div>
                  <p className="text-xs text-[#64736C] font-mono">{session.user.email}</p>
                </div>
                <span className="text-[10px] font-bold font-mono bg-[#ECF4EF] border border-[#DDE5DF] px-2.5 py-1 rounded-lg text-[#64736C] h-fit">Primary</span>
              </div>

              {/* Account ID */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[#17201D] font-bold text-sm">
                    <Hash className="w-4 h-4 text-[#64736C]" />
                    Identity UID
                  </div>
                  <p className="text-[11px] font-mono text-[#94A39B] select-all cursor-copy" title="Click to select">{session.user.id}</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 bg-[#FAF9F6] border-t border-[#DDE5DF] space-y-4">
               <h4 className="text-sm font-bold text-[#17201D] flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#16A34A]" /> Change Security Password
               </h4>
               <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 space-y-1.5 w-full">
                     <label className="text-[10px] font-bold text-[#64736C] uppercase tracking-widest pl-1 font-mono">New Password</label>
                     <input 
                       type="password" 
                       id="new-password"
                       placeholder="••••••••"
                       className="w-full bg-white border border-[#DDE5DF] rounded-xl px-4 py-2.5 text-xs text-[#17201D] focus:border-[#16A34A] outline-none"
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
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                  >
                    Update Key
                  </button>
               </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard" className="p-6 bg-white border border-[#DDE5DF] rounded-3xl hover:border-[#16A34A] transition-all group shadow-soft">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-[#ECF4EF] rounded-2xl text-[#16A34A]"><Calendar className="w-5 h-5" /></div>
                     <span className="font-bold text-[#17201D] text-sm">Passes & Bookings</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A39B] group-hover:text-[#16A34A] group-hover:translate-x-1 transition-transform" />
               </div>
            </Link>
            <Link href="/subscriptions" className="p-6 bg-white border border-[#DDE5DF] rounded-3xl hover:border-[#16A34A] transition-all group shadow-soft">
               <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-[#DCFCE7] rounded-2xl text-[#16A34A]"><Sparkles className="w-5 h-5" /></div>
                     <span className="font-bold text-[#17201D] text-sm">Mobility Pass</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#94A39B] group-hover:text-[#16A34A] group-hover:translate-x-1 transition-transform" />
               </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


