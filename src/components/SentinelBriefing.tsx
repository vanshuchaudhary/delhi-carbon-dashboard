'use client';
import { useSimulator } from '@/contexts/SimulatorContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Radio } from 'lucide-react';

export default function SentinelBriefing() {
  const { activeWard, activeScenario, transportWeight, industrialWeight } = useSimulator();

  const getBriefingText = () => {
    if (activeWard) return `Analyzing ${activeWard} Emissions`;
    if (transportWeight < 1 && industrialWeight < 1) return 'Simulating Multi-Sector Impact';
    if (transportWeight < 1) return 'Simulating Green Transport Impact';
    if (industrialWeight < 1) return 'Simulating Industrial Filter Impact';
    return 'Monitoring Delhi Air Quality';
  };

  const briefingText = getBriefingText();

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[45] flex flex-col items-center gap-1 w-full max-w-[400px]">
      <div className="px-6 py-2 bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-full shadow-2xl flex items-center gap-3 group overflow-hidden relative">
        <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
        <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse relative z-10" />
        
        <div className="relative h-4 flex items-center min-w-[220px] justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.span
              key={briefingText}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="text-[9px] font-black uppercase text-slate-100 tracking-[0.15em] relative z-10 whitespace-nowrap"
            >
              {briefingText}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="w-px h-4 bg-slate-700/50 mx-1 relative z-10" />
        <div className="flex items-center gap-1 text-[8px] font-bold text-emerald-400 uppercase tracking-widest relative z-10 opacity-80">
          <Shield className="w-2.5 h-2.5" /> S-1 v6.4
        </div>
      </div>
      
      {/* Decorative scanning line */}
      <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent animate-pulse" />
    </div>
  );
}
