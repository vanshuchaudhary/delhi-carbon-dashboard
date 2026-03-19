'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, ShieldCheck, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getTier, getNextTierThreshold } from '@/lib/GamificationLogic';

export default function SentinelRankModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [tier, setTier] = useState('Seedling');

  useEffect(() => {
    if (isOpen && user) {
      supabase.from('profiles').select('co2_credits, tier').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setCredits(data.co2_credits || 0);
            setTier(data.tier || getTier(data.co2_credits || 0));
          }
        });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const nextThreshold = getNextTierThreshold(credits);
  const currentLevelBase = credits <= 500 ? 0 : credits <= 1500 ? 501 : 1501;
  
  let progressPercentage = 100;
  if (nextThreshold) {
    progressPercentage = ((credits - currentLevelBase) / (nextThreshold - currentLevelBase)) * 100;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-slate-900 border border-slate-700/50 shadow-2xl rounded-3xl overflow-hidden"
        >
          <div className="p-6 flex flex-col items-center">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
              <Trophy className="w-8 h-8 text-slate-950" />
            </div>

            <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">
              Sentinel Rank
            </h2>
            <div className="text-xs text-slate-400 font-mono mb-8">
              {user?.email || 'Guest Envoy'}
            </div>

            <div className="w-full bg-slate-950/50 border border-slate-800/80 rounded-2xl p-5 flex flex-col items-center relative overflow-hidden">
              {/* Scanline */}
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJyZ2JhKDAsIDAsIDAsIDAuMDYpIiAvPgo8L3N2Zz4=')] opacity-50 pointer-events-none mix-blend-overlay"></div>

              <div className="text-[10px] uppercase font-black tracking-[0.2em] text-emerald-500 mb-2">
                Current Tier
              </div>
              <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-tighter shadow-sm mb-6">
                {tier}
              </div>

              <div className="w-full flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                <span>{credits} XP</span>
                <span>{nextThreshold ? `${nextThreshold} XP` : 'MAX LEVEL'}</span>
              </div>
              
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 relative"
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-pulse"></div>
                </motion.div>
              </div>

              {nextThreshold && (
                <div className="mt-4 text-xs font-medium text-slate-500 text-center">
                  Earn <span className="text-emerald-400 font-bold">{nextThreshold - credits}</span> more credits to rank up!
                </div>
              )}
            </div>

            {/* Actions List Info */}
            <div className="w-full mt-6 flex flex-col gap-3 border-t border-slate-800 pt-6">
              <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500">How to earn credits</h4>
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500"/> Policy Simulation</span>
                <span className="font-mono text-emerald-400">+50 XP</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-2"><Star className="w-4 h-4 text-amber-500"/> Ward Review</span>
                <span className="font-mono text-emerald-400">+100 XP</span>
              </div>
              <div className="flex items-center justify-between text-xs font-medium text-slate-300">
                <span className="flex items-center gap-2"><Trophy className="w-4 h-4 text-blue-500"/> Data Verification</span>
                <span className="font-mono text-emerald-400">+200 XP</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
