'use client';

import dynamic from 'next/dynamic';
import { Users, Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';

/* ── Skeleton Loaders ─────────────────────────────────────────────── */
function StoriesSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-32 rounded bg-slate-800 animate-pulse" />
          <div className="h-2 w-48 rounded bg-slate-800 animate-pulse" />
        </div>
      </div>
      <div className="glass-panel p-5 border border-slate-800/60">
        <div className="flex items-start gap-4 overflow-x-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-20 h-20 rounded-full bg-slate-800 animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
              <div className="w-12 h-2 rounded bg-slate-800 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VoiceSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
        <div className="flex flex-col gap-1.5">
          <div className="h-4 w-36 rounded bg-slate-800 animate-pulse" />
          <div className="h-2 w-44 rounded bg-slate-800 animate-pulse" />
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 glass-panel p-6 border border-slate-800/60 h-72 rounded-2xl bg-slate-900/40 animate-pulse" />
        <div className="xl:col-span-3 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Lazy Components ──────────────────────────────────────────────── */
const VideoStories = dynamic(
  () => import('@/components/VideoStories'),
  { ssr: false, loading: () => <StoriesSkeleton /> }
);

const CommunityVoice = dynamic(
  () => import('@/components/CommunityVoice'),
  { ssr: false, loading: () => <VoiceSkeleton /> }
);

const SentinelActivityFeed = dynamic(
  () => import('@/components/SentinelActivityFeed'),
  { ssr: false, loading: () => <div className="h-64 glass-panel animate-pulse rounded-2xl" /> }
);

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-[#020617] relative overflow-x-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top-left,rgba(16,185,129,0.04),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom-right,rgba(16,185,129,0.03),transparent_50%)] pointer-events-none" />
      <div className="fixed inset-0 digital-grid opacity-[0.04] pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-12">

        {/* Page Header */}
        <div className="flex flex-col gap-2 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tighter">
                Community Hub
              </h1>
              <p className="text-sm text-slate-500 font-mono uppercase tracking-widest">
                Delhi's collective voice for a sustainable future
              </p>
            </div>

            {/* Live badge */}
            <div className="ml-auto hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 backdrop-blur-sm rounded-full border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold uppercase font-mono">Sentinel Network Active</span>
            </div>
          </div>

          {/* Divider */}
          <div className="mt-4 h-px bg-gradient-to-r from-emerald-500/30 via-slate-700 to-transparent" />
        </div>

        {/* Section 1: Video Stories */}
        <section>
          <VideoStories />
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

        {/* Section 2: Community Voice */}
        <section>
          <CommunityVoice />
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

        {/* Section 3: Sentinel Activity Feed */}
        <section>
          <SentinelActivityFeed />
        </section>

        {/* Footer note */}
        <p className="text-center text-[10px] text-slate-700 font-mono uppercase tracking-widest pb-8">
          Quantum Sentinel · Delhi Community Hub · All data encrypted end-to-end
        </p>
      </div>

      <Toaster position="bottom-right" richColors closeButton theme="dark" />
    </div>
  );
}
