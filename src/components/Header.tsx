'use client';

import { useSimulator } from '@/contexts/SimulatorContext';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Activity, ShieldCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function Header() {
  const { setDemoRouteTrigger } = useSimulator();
  const { isGuest, user } = useAuth();

  const startCityTour = () => {
    setDemoRouteTrigger(true);
    toast.success('City Tour Initialized', {
      description: 'Navigating from Connaught Place to Hauz Khas. Optimizing for carbon efficiency.',
      icon: <Activity className="w-4 h-4 text-emerald-400" />
    });
  };

  return (
    <header className="fixed top-6 right-6 flex items-center gap-4 z-[45]">
      {/* Session Badge */}
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-full shadow-2xl">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest leading-none">
          {isGuest ? 'Guest Access Active' : user ? `Sentinel: ${user.email?.split('@')[0].toUpperCase()}` : 'System Offline'}
        </span>
      </div>

      {/* Community Link */}
      <Link
        href="/community"
        className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-900/40 backdrop-blur-xl border border-emerald-500/30 rounded-full shadow-2xl text-[10px] font-black uppercase text-emerald-400 tracking-widest hover:bg-emerald-500/10 hover:border-emerald-400/60 transition-all duration-200 group"
      >
        <Users className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        Community
      </Link>

      {/* Neon Demo Button */}
      <button 
        onClick={startCityTour}
        className="group relative px-6 py-2.5 bg-slate-950 text-emerald-400 font-black text-xs uppercase tracking-[0.2em] rounded-full border border-emerald-500/50 hover:border-emerald-400 transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95 flex items-center gap-2"
      >
        <div className="absolute inset-0 rounded-full border border-emerald-500/20 group-hover:animate-ping opacity-0 group-hover:opacity-100" />
        <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
        🚀 Run Demo
      </button>

      {/* Security Status */}
      <div className="w-10 h-10 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-full flex items-center justify-center shadow-xl group cursor-help relative">
        <ShieldCheck className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
        <div className="absolute top-12 right-0 w-48 p-3 bg-slate-900 border border-slate-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[9px] text-slate-400 leading-tight">
          <div className="text-emerald-400 font-bold mb-1 uppercase tracking-tighter">Quantum Sentinel Guard</div>
          End-to-end encrypted environmental monitoring active for Delhi Region.
        </div>
      </div>
    </header>
  );
}
