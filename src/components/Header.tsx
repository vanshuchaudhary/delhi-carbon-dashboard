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
    <div className="fixed top-0 left-0 w-full z-[100] pointer-events-none">
      <header className="w-full flex items-center justify-between px-6 py-4 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 shadow-2xl pointer-events-auto">
        {/* Left: Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-500 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <ShieldCheck className="w-5 h-5 text-slate-950" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-sm font-black text-white uppercase tracking-tighter leading-none">Monitoring Delhi</h1>
            <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-[0.2em] mt-0.5">Quantum Carbon Sentinel</p>
          </div>
        </div>

        {/* Right: Actions & Status */}
        <div className="flex items-center gap-4">
          {/* Session Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 border border-slate-700/50 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase text-slate-300 tracking-widest leading-none">
              {isGuest ? 'Guest Access' : user ? `Sentinel: ${user.email?.split('@')[0].toUpperCase()}` : 'Offline'}
            </span>
          </div>

          <nav className="flex items-center gap-3">
            {/* Community Link */}
            <Link
              href="/community"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/40 border border-emerald-500/30 rounded-full text-[9px] font-black uppercase text-emerald-400 tracking-widest hover:bg-emerald-500/10 transition-all group"
            >
              <Users className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              Community
            </Link>

            {/* Neon Demo Button */}
            <button 
              onClick={startCityTour}
              className="group relative px-5 py-2 bg-slate-950 text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-full border border-emerald-500/50 hover:border-emerald-400 transition-all shadow-lg active:scale-95 flex items-center gap-2"
            >
              <div className="absolute inset-0 rounded-full border border-emerald-500/20 group-hover:animate-ping opacity-0 group-hover:opacity-100" />
              <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              Demo
            </button>
          </nav>

          {/* Security Status */}
          <div className="w-8 h-8 bg-slate-900/80 border border-slate-800 rounded-full flex items-center justify-center shadow-xl group cursor-help relative">
            <ShieldCheck className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            <div className="absolute top-10 right-0 w-48 p-3 bg-slate-900 border border-slate-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-[9px] text-slate-400 leading-tight">
              <div className="text-emerald-400 font-bold mb-1 uppercase tracking-tighter">Sentinel Guard Active</div>
              Quantum encryption layer protecting regional telemetry.
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
