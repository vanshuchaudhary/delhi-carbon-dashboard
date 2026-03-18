'use client';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Shield } from 'lucide-react';
import { Toaster } from 'sonner';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, isGuest } = useAuth();
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
    <div className="flex min-h-screen">
      {pathname !== '/login' && <Sidebar />}
      {pathname !== '/login' && <Header />}
      <main className={`flex-1 ${pathname !== '/login' ? 'md:ml-80' : ''} min-h-screen relative overflow-hidden transition-all duration-300`}>
        {children}
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
