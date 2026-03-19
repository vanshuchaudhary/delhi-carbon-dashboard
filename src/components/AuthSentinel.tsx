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

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, isGuest } = useAuth();
  const { isSidebarMini } = useSimulator();
  const router = useRouter();
  const pathname = usePathname();

  const didRequestNotif = useRef(false);

  // Request notification permission exactly once after first authenticated login
  useEffect(() => {
    if (
      user &&
      !isGuest &&
      !didRequestNotif.current &&
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'default'
    ) {
      didRequestNotif.current = true;
      Notification.requestPermission();
    }
  }, [user, isGuest]);

  useEffect(() => {
    if (!loading && !user && !isGuest && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, loading, isGuest, pathname, router]);

  if (loading && pathname !== '/login') {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-[100]">
        <div className="relative">
          <div className="w-24 h-24 bg-emerald-500/10 rounded-3xl border border-emerald-500/30 flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <Shield className="w-12 h-12 text-emerald-400" />
          </div>
          <div className="absolute -inset-4 border border-emerald-500/20 rounded-[40px] animate-ping duration-[3000ms]" />
        </div>
        <div className="mt-8 flex flex-col items-center gap-2">
          <h2 className="text-emerald-500 font-black uppercase tracking-[0.4em] text-sm tracking-widest">Loading Sentinel</h2>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-slate-950">
      {/* Global Cyber-Grid */}
      <div className="fixed inset-0 cyber-grid z-0 opacity-40 pointer-events-none" />
      
      {pathname !== '/login' && <Sidebar />}
      {pathname !== '/login' && <Header />}
      {pathname !== '/login' && <SentinelBriefing />}
      {pathname !== '/login' && <WelcomeModal />}

      <main className={twMerge(
        "flex-1 min-h-screen relative z-10 transition-all duration-500 ease-in-out",
        pathname === '/login' ? "" : isSidebarMini ? "md:ml-20" : "md:ml-80"
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
