'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  Map as MapIcon, 
  BarChart3, 
  SlidersHorizontal, 
  Leaf, 
  Activity, 
  Factory, 
  Car, 
  Menu, 
  X, 
  Shield, 
  Info, 
  Trophy, 
  Users,
  Settings as SettingsIcon,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useSimulator } from '@/contexts/SimulatorContext';
import { useAuth } from '@/contexts/AuthContext';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';
import NotificationSettingsModal from './NotificationSettingsModal';

const navItems = [
  { href: '/',                 label: 'Live Map',         icon: MapIcon },
  { href: '/sector-breakdown', label: 'Sector Breakdown',  icon: BarChart3 },
  { href: '/eco-calculator',   label: 'Eco-Calculator',    icon: Leaf },
  { href: '/leaderboard',      label: 'Leaderboard',       icon: Trophy },
  { href: '/community',        label: 'Community Hub',     icon: Users },
  { href: '/policy-sandbox',   label: 'Policy Sandbox',    icon: SlidersHorizontal },
  { href: '#settings',         label: 'Quantum Settings',  icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    transportWeight, setTransportWeight, 
    industrialWeight, setIndustrialWeight, 
    score, isDanger, currentZone, setDemoRouteTrigger 
  } = useSimulator();
  const { user, isGuest, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    toast.info('Session Terminated', { description: 'Environmental Sentinel offline.' });
    router.push('/login');
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-[60] p-2 bg-slate-900 border border-slate-800 rounded-lg md:hidden"
      >
        {isOpen ? <X className="w-5 h-5 text-slate-400" /> : <Menu className="w-5 h-5 text-slate-400" />}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <NotificationSettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <aside className={twMerge(
        "fixed left-0 top-0 h-screen w-80 z-[55] transition-transform duration-300 md:translate-x-0 bg-slate-900/40 backdrop-blur-2xl border-r border-slate-800/50 flex flex-col",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-emerald-500 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Shield className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-100 uppercase tracking-tighter leading-none">Delhi Carbon</h1>
              <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em] mt-1">Sentinel Dashboard</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2 mb-8">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              if (item.href === '#settings') {
                return (
                  <button 
                    key={item.href} 
                    onClick={() => setIsSettingsOpen(true)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group text-slate-400 hover:text-slate-100"
                  >
                    <Icon className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    <span>{item.label}</span>
                  </button>
                );
              }
              return (
                <Link key={item.href} href={item.href} className={twMerge(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden group",
                  isActive ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-slate-400 hover:text-slate-100"
                )}>
                  <Icon className={twMerge("w-5 h-5", isActive ? "text-emerald-400" : "text-slate-500")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-800/60 pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-blue-400" /> AI Policy Simulator
            </h3>

            <div className="flex flex-col gap-5">
               <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-200 flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-emerald-400"/> Green Transport</span>
                     <span className="text-emerald-400 font-mono font-bold">{Math.round((1 - transportWeight) * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={1 - transportWeight} 
                    onChange={(e) => setTransportWeight(1 - parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
               </div>

               <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-200 flex items-center gap-1.5"><Factory className="w-3.5 h-3.5 text-indigo-400"/> Ind. Filters</span>
                     <span className="text-indigo-400 font-mono font-bold">{Math.round((1 - industrialWeight) * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.05" value={1 - industrialWeight} 
                    onChange={(e) => setIndustrialWeight(1 - parseFloat(e.target.value))}
                    className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
               </div>

               <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Health Score</div>
                    <div className="text-xl font-black mt-1" style={{ color: `hsl(${score}, 70%, 50%)` }}>{score}</div>
                  </div>
                  <Leaf className="w-6 h-6" style={{ color: `hsl(${score}, 70%, 50%)` }}/>
               </div>

               <div className={twMerge("p-4 rounded-2xl border flex flex-col gap-2", isDanger ? "bg-rose-500/5 border-rose-500/30" : "bg-emerald-500/5 border-emerald-500/20")}>
                  <div className="flex items-center gap-2">
                    <Shield className={twMerge("w-4 h-4", isDanger ? "text-rose-500" : "text-emerald-400")} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">Carbon Guard</span>
                  </div>
                  <div className="text-xs font-bold text-slate-100 truncate">{currentZone || 'Scanning...'}</div>
               </div>

               <button onClick={() => setDemoRouteTrigger(true)} className="w-full py-3 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all">
                 Start City Tour
               </button>

               <button onClick={() => setIsSettingsOpen(true)} className="w-full py-3 bg-slate-950 border border-emerald-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 flex items-center justify-center gap-2 transition-all">
                 <SettingsIcon className="w-3.5 h-3.5" /> Sentinel Settings
               </button>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-slate-800/60 flex flex-col gap-4">
            {user && (
              <div className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800 rounded-2xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-200 truncate uppercase">{user.email?.split('@')[0]}</p>
                    <p className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">{isGuest ? 'Guest Envoy' : 'Senior Sentinel'}</p>
                  </div>
                </div>
                <button onClick={handleSignOut} className="p-2 hover:bg-rose-500/10 rounded-lg group transition-colors">
                  <LogOut className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

