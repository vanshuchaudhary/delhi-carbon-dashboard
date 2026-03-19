'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

interface SentinelTooltipProps {
  isVisible: boolean;
  content: React.ReactNode;
  formula?: string;
  children: React.ReactNode;
}

export default function SentinelTooltip({ isVisible, content, formula, children }: SentinelTooltipProps) {
  return (
    <div className="relative inline-block">
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-none"
          >
            <div className="flex flex-col gap-3">
              <div className="text-xs text-white leading-relaxed font-medium">
                {content}
              </div>
              {formula && (
                <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-center">
                  <span className="text-sm font-serif italic text-blue-300">
                    <InlineMath math={formula} />
                  </span>
                </div>
              )}
            </div>
            {/* Tooltip Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/60" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
