'use client';

import { useState, useEffect } from 'react';
import { X, Bell, Mail, MessageSquare, Shield, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    push_enabled: true,
    email_enabled: false,
    sms_enabled: false,
    phone_number: '',
    email: ''
  });

  useEffect(() => {
    if (isOpen && user) {
      fetchSettings();
    }
  }, [isOpen, user]);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('push_enabled, email_enabled, sms_enabled, phone_number, email')
      .eq('id', user?.id)
      .single();

    if (data) {
      setSettings({
        push_enabled: data.push_enabled ?? true,
        email_enabled: data.email_enabled ?? false,
        sms_enabled: data.sms_enabled ?? false,
        phone_number: data.phone_number ?? '',
        email: data.email || user?.email || ''
      });
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        push_enabled: settings.push_enabled,
        email_enabled: settings.email_enabled,
        sms_enabled: settings.sms_enabled,
        phone_number: settings.phone_number,
        email: settings.email
      })
      .eq('id', user?.id);

    if (!error) {
      toast.success("Settings Saved", { description: "Your Quantum Sentinel preferences have been updated." });
      onClose();
    } else {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Shield className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-100 uppercase tracking-tighter">Sentinel Alerts</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
              <p className="text-slate-500 text-sm font-medium">Syncing Sentinel Prefs...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-2xl group hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <Bell className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                    <div>
                      <p className="text-sm font-bold text-slate-200 uppercase tracking-wider">Push Notifications</p>
                      <p className="text-[10px] text-slate-500 font-medium font-mono">App level alerts</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={settings.push_enabled}
                    onChange={(e) => setSettings({...settings, push_enabled: e.target.checked})}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer" 
                  />
                </div>

                <div className="flex flex-col gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl group hover:border-emerald-500/30 transition-colors">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Mail className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                        <div>
                          <p className="text-sm font-bold text-slate-200 uppercase tracking-wider">Email Alerts</p>
                          <p className="text-[10px] text-slate-500 font-medium font-mono">Detailed reports via Gmail</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.email_enabled}
                        onChange={(e) => setSettings({...settings, email_enabled: e.target.checked})}
                        className="w-5 h-5 accent-emerald-500 cursor-pointer" 
                      />
                   </div>
                   {settings.email_enabled && (
                     <input 
                        type="email"
                        placeholder="sentinel@gmail.com"
                        value={settings.email}
                        onChange={(e) => setSettings({...settings, email: e.target.value})}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                     />
                   )}
                </div>

                <div className="flex flex-col gap-4 p-4 bg-slate-950/50 border border-slate-800 rounded-2xl group hover:border-emerald-500/30 transition-colors">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <MessageSquare className="w-5 h-5 text-slate-400 group-hover:text-emerald-500" />
                        <div>
                          <p className="text-sm font-bold text-slate-200 uppercase tracking-wider">SMS Alerts</p>
                          <p className="text-[10px] text-slate-500 font-medium font-mono">Critical zone warnings</p>
                        </div>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={settings.sms_enabled}
                        onChange={(e) => setSettings({...settings, sms_enabled: e.target.checked})}
                        className="w-5 h-5 accent-emerald-500 cursor-pointer" 
                      />
                   </div>
                   {settings.sms_enabled && (
                     <input 
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={settings.phone_number}
                        onChange={(e) => setSettings({...settings, phone_number: e.target.value})}
                        className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                     />
                   )}
                </div>
              </div>

              <button 
                onClick={async () => {
                  toast.promise(
                    supabase.functions.invoke('sentinel-alert', {
                      body: { userId: user?.id, type: 'TEST', aqi: 45, zone: 'Sentinel Hub' }
                    }),
                    {
                      loading: 'Triggering Test Alert...',
                      success: 'Test Dispatched',
                      error: 'Test Failed'
                    }
                  );
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all border border-slate-700 uppercase tracking-widest text-[10px]"
              >
                <Bell className="w-4 h-4 text-emerald-500" /> Test Sentinel Alert
              </button>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="mt-2 w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] uppercase tracking-widest text-xs"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Save Sentinel Prefs
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
