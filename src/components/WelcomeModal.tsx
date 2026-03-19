'use client';

import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { motion } from 'framer-motion';
import { Shield, Sparkles } from 'lucide-react';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem('hasSeenIntro');
    if (!hasSeenIntro) {
      setIsOpen(true);
    }
  }, []);

  const closeModal = () => {
    localStorage.setItem('hasSeenIntro', 'true');
    setIsOpen(false);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={closeModal}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center text-slate-100">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-3xl bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-10 text-left align-middle shadow-[0_0_50px_rgba(16,185,129,0.15)] transition-all">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
                    <div className="p-4 bg-emerald-500 rounded-2xl relative shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      <Shield className="w-10 h-10 text-slate-950 stroke-[2.5px]" />
                    </div>
                  </div>

                  <Dialog.Title as="h3" className="text-3xl font-black text-center uppercase tracking-tighter leading-tight">
                    Welcome to <span className="text-emerald-400">Delhi Carbon Sentinel</span>
                  </Dialog.Title>

                  <div className="mt-2 text-center">
                    <p className="text-lg text-slate-400 leading-relaxed font-medium">
                      This is a real-time <span className="text-slate-100">3D Digital Twin</span> of Delhi&apos;s carbon footprint. 
                      You can explore wards, simulate environmental policies, and calculate your own personal impact.
                    </p>
                  </div>

                  <div className="mt-8 w-full flex flex-col gap-4">
                    <button
                      type="button"
                      className="w-full inline-flex justify-center items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-5 text-sm font-black uppercase tracking-widest text-slate-950 transition-all hover:bg-emerald-400 hover:scale-[1.02] active:scale-[0.98] shadow-[0_10px_30px_rgba(16,185,129,0.3)] group"
                      onClick={closeModal}
                    >
                      <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                      Start Exploring
                    </button>
                    <p className="text-[10px] text-slate-500 text-center uppercase tracking-widest font-bold">
                      Version 1.2 • AI Optimized Logic
                    </p>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
