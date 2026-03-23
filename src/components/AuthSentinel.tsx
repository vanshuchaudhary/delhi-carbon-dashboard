'use client';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import { Toaster } from 'sonner';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import SentinelBriefing from '@/components/SentinelBriefing';
import { useSimulator } from '@/contexts/SimulatorContext';
import { motion, AnimatePresence } from 'framer-motion';
import { twMerge } from 'tailwind-merge';
import WelcomeModal from '@/components/WelcomeModal';

import { useAuth as useClerkAuth, RedirectToSignIn } from '@clerk/nextjs';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth(); // legacy/shim loading
  const { isLoaded, isSignedIn } = useClerkAuth();
  const { isSidebarMini } = useSimulator();
  const pathname = usePathname();

  // Handle loading state: either shim loading or clerk loading
  if ((loading || !isLoaded) && pathname !== '/login') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100]">
        <div className="relative">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl border border-emerald-500/30 flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <Shield className="w-12 h-12 text-emerald-400" />
          </div>
          <div className="absolute -inset-4 border border-emerald-500/20 rounded-[40px] animate-ping duration-[3000ms]" />
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <h2 className="text-emerald-500 font-black uppercase tracking-[0.4em] text-sm tracking-widest">Identifying Sentinel</h2>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  // Handle unauthenticated state
  if (!isSignedIn && pathname !== '/login') {
    return <RedirectToSignIn />;
  }

  // Authenticated Dashboard Layout
  if (isSignedIn && pathname !== '/login') {
    return (
      <div className="flex min-h-screen relative overflow-hidden bg-slate-950">
        <div className="fixed inset-0 cyber-grid z-0 opacity-40 pointer-events-none" />
        
        <Sidebar />
        <Header />
        <SentinelBriefing />
        <WelcomeModal />

        <main className={twMerge(
          "flex-1 min-h-screen relative z-10 transition-all duration-500 ease-in-out pt-[80px]",
          isSidebarMini ? "md:ml-20" : "md:ml-80"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    );
  }

  // Fallback for public routes
  return <>{children}</>;
}

export default function AuthSentinel({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthWrapper>
        {children}
        <Toaster position="top-right" theme="dark" richColors closeButton />
      </AuthWrapper>
    </AuthProvider>
  );
}
