'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Activity, Leaf, Factory, Zap } from 'lucide-react';

const EVENTS = [
  { text: 'Sentinel Node 04: Emission drop in Saket due to EV adoption.', icon: Leaf, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { text: 'Alert: High industrial output detected in Okhla. Recalibrating forecast.', icon: Factory, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20' },
  { text: 'Traffic Advisory: Heavy congestion on Outer Ring Road detected.', icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  { text: 'System Update: Node 12 grid demand stabilized.', icon: Zap, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { text: 'AI Forecast: Favorable wind patterns expected to improve AQI by evening.', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
];

export default function LiveEventToast() {
  const [currentEvent, setCurrentEvent] = useState(EVENTS[0]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show an event every 45 seconds
    const interval = setInterval(() => {
      // Pick random event
      const event = EVENTS[Math.floor(Math.random() * EVENTS.length)];
      setCurrentEvent(event);
      setIsVisible(true);

      // Hide after 8 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 8000);

    }, 45000);

    // Initial show shortly after load for demo purposes
    const initialTimeout = setTimeout(() => {
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 8000);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="fixed bottom-6 max-w-sm w-[90%] left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-2xl p-4 flex gap-4 items-center overflow-hidden"
        >
          {/* Scanline background effect */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSJyZ2JhKDAsIDAsIDAsIDAuMDYpIiAvPgo8L3N2Zz4=')] opacity-30 pointer-events-none mix-blend-overlay"></div>
          
          <div className={`p-2.5 rounded-xl border shadow-inner ${currentEvent.bg} ${currentEvent.color}`}>
            <currentEvent.icon className="w-5 h-5" />
          </div>
          <div className="flex-1 relative z-10">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Live Data Stream</div>
            <p className="text-sm font-medium text-slate-200 leading-snug">{currentEvent.text}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
