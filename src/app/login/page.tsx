'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Shield, Terminal, Cpu, Network, Database, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

/* ─── Google icon (multi-colour SVG) ─────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2045C17.64 8.5663 17.5827 7.9527 17.4764 7.3636H9V10.845H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4"/>
      <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65591 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
      <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.5931 3.68182 9C3.68182 8.4068 3.78409 7.83 3.96409 7.29V4.9581H0.957275C0.347727 6.1731 0 7.5477 0 9C0 10.4522 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
      <path d="M9 3.5795C10.3214 3.5795 11.5077 4.0336 12.4405 4.9254L15.0218 2.344C13.4632 0.8918 11.4259 0 9 0C5.48182 0 2.43818 2.0168 0.957275 4.9581L3.96409 7.29C4.67182 5.1627 6.65591 3.5795 9 3.5795Z" fill="#EA4335"/>
    </svg>
  );
}

/* ─── Boot sequence overlay ───────────────────────────────────────── */
function BootOverlay({ logs }: { logs: string[] }) {
  return (
    <div className="min-h-screen w-full bg-[#020617] flex flex-col items-center justify-center p-8 gap-8 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.05),transparent)] pointer-events-none" />
      <div className="relative">
        <div className="w-24 h-24 border-2 border-emerald-500/20 rounded-full animate-ping absolute inset-0" />
        <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/40 rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)] animate-pulse relative">
          <Shield className="w-12 h-12 text-emerald-400" />
        </div>
      </div>
      <div className="w-full max-w-sm flex flex-col gap-3">
        <div className="flex items-center gap-3 text-emerald-500 mb-2">
          <Terminal className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">System Initialization</span>
        </div>
        <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col gap-2 shadow-2xl backdrop-blur-md">
          {logs.map((log, i) => (
            <div key={i} className="flex gap-2 items-start text-[11px] animate-in slide-in-from-left-2 duration-300">
              <span className="text-emerald-500">{' >> '}</span>
              <span className="text-slate-300 font-medium">{log}</span>
            </div>
          ))}
          <div className="w-1 h-3 bg-emerald-500 animate-pulse mt-1" />
        </div>
        <div className="flex justify-between items-center px-2 mt-2">
          <div className="flex gap-4">
            <Cpu className="w-3 h-3 text-slate-700" />
            <Network className="w-3 h-3 text-slate-700" />
            <Database className="w-3 h-3 text-slate-700" />
          </div>
          <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Node DEL-28.6</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────── */
export default function LoginPage() {
  const [sentinelId, setSentinelId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);
  const { setGuest, user } = useAuth();
  const router = useRouter();
  const didInit = useRef(false);

  useEffect(() => {
    if (user && !initializing && !didInit.current) {
      didInit.current = true;
      startInitialization();
    }
  }, [user]);

  const startInitialization = async () => {
    setInitializing(true);
    const logs = [
      'Establishing Secure Link...',
      'Syncing Delhi Satellite Data...',
      'Encrypting Sentinel Node...',
      'Quantum Tunneling Protocol active.',
      'Sentinel Online.',
    ];
    for (let i = 0; i < logs.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setBootLogs(prev => [...prev, logs[i]]);
    }
    await new Promise(r => setTimeout(r, 500));
    router.push('/');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentinelId || !accessToken) {
      toast.error('Please enter your Sentinel ID and Access Token.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: sentinelId,
      password: accessToken,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
    // On success, the useEffect above triggers the boot sequence
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  const handleGuestMode = () => {
    setGuest(true);
    router.push('/');
  };

  if (initializing) {
    return <BootOverlay logs={bootLogs} />;
  }

  return (
    <div className="min-h-screen w-full flex overflow-hidden">

      {/* ── LEFT COLUMN: 60% ── */}
      <div
        className="hidden lg:flex relative flex-col items-center justify-center"
        style={{ width: '60%' }}
      >
        {/* Full-bleed background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/delhi-corridor.png')" }}
        />

        {/* Tint + blur overlay */}
        <div className="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/30" />

        {/* Decorative grid */}
        <div className="absolute inset-0 digital-grid opacity-20 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 gap-6">

          {/* Pulsing Shield Logo */}
          <div className="relative flex items-center justify-center mb-2">
            <div className="absolute w-28 h-28 rounded-full bg-emerald-400/20 animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="absolute w-20 h-20 rounded-full bg-emerald-400/15 animate-pulse" />
            <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-400/60 rounded-2xl flex items-center justify-center shadow-[0_0_60px_rgba(52,211,153,0.4)] backdrop-blur-sm">
              <Shield className="w-10 h-10 text-emerald-300 drop-shadow-[0_0_12px_rgba(52,211,153,0.9)]" />
            </div>
          </div>

          <h1 className="text-5xl font-extrabold text-white tracking-tight drop-shadow-lg">
            QUANTUM SENTINEL
          </h1>
          <h2 className="text-2xl text-emerald-300 font-semibold tracking-wide drop-shadow-md">
            Delhi Secure Corridor
          </h2>
          <p className="text-slate-300 text-lg max-w-xs leading-relaxed">
            Your Gateway to Sustainable Delhi.
          </p>

          {/* Bottom tag line */}
          <div className="mt-8 flex items-center gap-3">
            <div className="h-px w-16 bg-emerald-500/40" />
            <span className="text-[10px] text-emerald-400/70 font-mono uppercase tracking-widest">
              QS · NODE DEL-28.6139N
            </span>
            <div className="h-px w-16 bg-emerald-500/40" />
          </div>
        </div>

        {/* Corner accent */}
        <div className="absolute top-6 left-6 opacity-40 pointer-events-none">
          <div className="text-[9px] font-mono text-emerald-400 tracking-widest">SECURE_LINK_ACTIVE</div>
          <div className="text-[9px] font-mono text-slate-400 tracking-widest">ENC · AES-256-QKD</div>
        </div>
      </div>

      {/* ── RIGHT COLUMN: 40% ── */}
      <div
        className="flex flex-col items-center justify-center min-h-screen relative overflow-hidden"
        style={{ width: '40%', minWidth: '340px', background: '#0a0f1e', flex: '1 1 auto' }}
      >
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.06),transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom-right,rgba(16,185,129,0.04),transparent_60%)] pointer-events-none" />

        {/* Mobile shield logo (shown < lg) */}
        <div className="flex lg:hidden flex-col items-center mb-8">
          <div className="relative">
            <div className="absolute w-16 h-16 rounded-full bg-emerald-400/20 animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="w-14 h-14 bg-emerald-500/10 border-2 border-emerald-400/50 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-emerald-300" />
            </div>
          </div>
          <p className="text-white font-extrabold text-xl mt-3 tracking-tight">QUANTUM SENTINEL</p>
          <p className="text-emerald-400 text-sm">Delhi Secure Corridor</p>
        </div>

        {/* Form Card */}
        <div className="w-full max-w-sm px-8 py-10 relative z-10">

          {/* Title */}
          <h2 className="text-3xl font-black text-white uppercase tracking-[0.15em] mb-2">
            LOGIN
          </h2>
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-8">
            Secure Authentication Portal
          </p>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-transparent text-slate-300 text-sm font-semibold tracking-wide transition-all duration-200 hover:bg-slate-800 hover:border-slate-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed mb-6 group"
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-slate-500 border-t-emerald-400 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-600 text-[10px] font-mono uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-5">

            {/* SENTINEL ID */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="sentinelId"
                className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]"
              >
                Sentinel ID
              </label>
              <input
                id="sentinelId"
                type="email"
                value={sentinelId}
                onChange={e => setSentinelId(e.target.value)}
                placeholder="agent@delhi.sentinel"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 transition-all duration-200 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-700"
              />
            </div>

            {/* ACCESS TOKEN */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="accessToken"
                className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]"
              >
                Access Token
              </label>
              <input
                id="accessToken"
                type="password"
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                placeholder="••••••••••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-white text-sm placeholder:text-slate-600 transition-all duration-200 outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 hover:border-slate-700"
              />
            </div>

            {/* INITIATE LINK button */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-3.5 rounded-xl bg-emerald-600 text-white text-sm font-black uppercase tracking-[0.2em] transition-all duration-200 hover:bg-emerald-500 hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] focus:outline-none focus:ring-4 focus:ring-emerald-500/30 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group mt-1"
            >
              {/* Pulse ring */}
              {!loading && (
                <span className="absolute inset-0 rounded-xl bg-emerald-400/20 animate-ping opacity-0 group-hover:opacity-100 transition-opacity" style={{ animationDuration: '1.5s' }} />
              )}
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Linking…
                  </>
                ) : (
                  'INITIATE LINK'
                )}
              </span>
            </button>
          </form>

          {/* Guest Mode */}
          <div className="mt-8 pt-6 border-t border-slate-900 flex justify-center">
            <button
              onClick={handleGuestMode}
              className="text-[10px] font-black text-slate-600 hover:text-emerald-500 uppercase tracking-widest flex items-center gap-2 transition-all duration-200 group"
            >
              <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform duration-200" />
              Continue as Guest Envoy
            </button>
          </div>
        </div>

        {/* Bottom accent */}
        <div className="absolute bottom-6 right-6 flex flex-col items-end gap-1 opacity-20 pointer-events-none">
          <div className="text-[9px] font-mono text-slate-400 tracking-widest uppercase">Quantum Encryption v2.4</div>
          <div className="text-[8px] font-mono text-emerald-500/50 tracking-widest">STABLE_CONNECTION</div>
        </div>
      </div>
    </div>
  );
}
