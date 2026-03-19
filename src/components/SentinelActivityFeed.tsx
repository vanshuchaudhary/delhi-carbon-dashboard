'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Star, Trophy, Activity } from 'lucide-react';

const ACTIONS = [
  { user: 'Vanshu C.', action: 'just reached Forest Guardian status!', icon: Trophy, color: 'text-emerald-400', time: 'Just now' },
  { user: 'Rohit K.', action: 'completed a Policy Simulation (+50 XP)', icon: ShieldCheck, color: 'text-cyan-400', time: '2m ago' },
  { user: 'Aisha S.', action: 'submitted a detailed Ward Review (+100 XP)', icon: Star, color: 'text-amber-400', time: '5m ago' },
  { user: 'Karan D.', action: 'verified emissions data for Okhla (+200 XP)', icon: Trophy, color: 'text-blue-400', time: '12m ago' },
  { user: 'Priya M.', action: 'just reached Tree status!', icon: Trophy, color: 'text-emerald-500', time: '15m ago' },
  { user: 'Rahul V.', action: 'completed a Policy Simulation (+50 XP)', icon: ShieldCheck, color: 'text-cyan-400', time: '28m ago' },
];

export default function SentinelActivityFeed() {
  const [feed, setFeed] = useState(ACTIONS.slice(0, 4));

  useEffect(() => {
    // Simulate incoming global actions
    const interval = setInterval(() => {
      setFeed((prev) => {
        const nextAction = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
        // Add new action at top, keeping max 6 items
        return [{...nextAction, time: 'Just now'}, ...prev.slice(0, 5)];
      });
    }, 15000); // New action every 15s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel p-6 border border-slate-800/60 rounded-2xl flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <Activity className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-widest">Global Sentinel Feed</h3>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-wider mt-1">Live Action Stream</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Active</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 relative overflow-hidden" style={{ minHeight: '300px' }}>
        <AnimatePresence>
          {feed.map((item, index) => (
            <motion.div
              key={index + item.time + item.user}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-4 hover:border-slate-700 transition-colors"
            >
              <div className={`p-2 rounded-xl bg-slate-950 border border-slate-800 shadow-inner ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-300">
                  <span className="font-bold text-white mr-1">{item.user}</span>
                  {item.action}
                </p>
              </div>
              <div className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-widest whitespace-nowrap">
                {item.time}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
