'use client';

import Leaderboard from '@/components/Leaderboard';

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-slate-950/50 backdrop-blur-sm p-4">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1 ml-4 mt-4">
           <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tighter">Emission Leaderboard</h1>
           <p className="text-sm text-slate-400 font-medium font-mono uppercase tracking-widest">Compete with Delhi to become a Forest Guardian</p>
        </div>
        <Leaderboard />
      </div>
    </div>
  );
}
