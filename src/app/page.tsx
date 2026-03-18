'use client';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), { 
  ssr: false, 
  loading: () => (
    <div className="absolute inset-0 m-6 glass-panel border border-slate-800/50 overflow-hidden shadow-2xl z-0 flex justify-center items-center bg-slate-900/50">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <p className="text-xl font-medium tracking-widest text-emerald-500 uppercase">Loading Map Engine...</p>
      </div>
    </div>
  ) 
});

export default function Home() {
  return (
    <div className="absolute inset-0 m-6 z-0">
      <Map />
    </div>
  );
}
