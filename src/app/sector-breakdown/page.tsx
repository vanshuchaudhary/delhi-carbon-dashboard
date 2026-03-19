'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { getSectorBreakdown } from '@/lib/api';
import Map from '@/components/Map';
import { useSimulator } from '@/contexts/SimulatorContext';

const COLORS = ['#10b981', '#f59e0b', '#f43f5e', '#3b82f6', '#8b5cf6'];

export default function SectorBreakdownPage() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const { activeSector, setActiveSector, activeWard } = useSimulator();

  useEffect(() => {
    getSectorBreakdown(activeWard).then(setData);
  }, [activeWard]);

  if (!data.length) return (
    <div className="h-full flex items-center justify-center">
      <div className="p-8 text-emerald-500 animate-pulse text-lg tracking-widest font-semibold">Loading Analytics Engine...</div>
    </div>
  );

  return (
    <>
      {/* Map Background for Two-Way Binding Visibility */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        <Map />
      </div>

      <div className="h-full w-full flex flex-col gap-6 z-10 relative pointer-events-none p-4 pb-20 sm:p-6 lg:p-8 overflow-y-auto">
        <header className="mb-2 pointer-events-none">
          <h1 className="text-3xl font-bold text-white drop-shadow-md">
            {activeWard ? `Sector Breakdown: ${activeWard}` : 'City-Wide Sector Breakdown'}
          </h1>
          <p className="text-white mt-1 opacity-90 drop-shadow-md">
            {activeWard ? `Localized emissions profile for ${activeWard} zone` : 'Analytics and historical carbon emissions by industry in Delhi'}
          </p>
        </header>

        {/* Sentinel Insight Box */}
        <div className="glass-panel text-left p-5 border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-md rounded-2xl flex items-start gap-4 shadow-2xl pointer-events-auto w-full md:w-3/4 lg:w-1/2 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div>
          <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-xs mb-1">Sentinel Insight</h3>
          <p className="text-white text-sm leading-relaxed">
            {(() => {
              const highest = [...data].sort((a: any, b: any) => b.co2_level - a.co2_level)[0];
              if (!highest) return "Analyzing data...";
              if (highest.sector === 'Transport') return "Transport emissions are peaking, driven by a 1.5x traffic delay factor in heavy clusters. Recommendation: Accelerate 'Last Mile' EV subsidies for South Delhi clusters to offset 12% of peak load.";
              if (highest.sector === 'Industry') return "Industrial output is the primary carbon driver. Recommendation: Implement 'Carbon Scrubbing' mandates for Okhla and Bawana manufacturing zones.";
              if (highest.sector === 'Power') return "Grid demand is high. Recommendation: Incentivize rooftop solar integration for Dwarka residential blocks to reduce substation strain.";
              if (highest.sector === 'Waste') return "Methane levels from landfills are rising. Recommendation: Deploy 'Waste-to-Energy' biometric sensors in East Delhi to streamline collection.";
              if (highest.sector === 'Residential') return "Household energy use is inefficient. Recommendation: Launch 'Eco-Retrofit' grants for cooling system upgrades in high-density blocks.";
              return `${highest.sector} is currently the leading emitter. Implementing localized mitigation strategies is highly recommended.`;
            })()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 max-h-[70vh] pointer-events-none">
        <div className="glass-panel p-6 border border-slate-800/80 bg-slate-900/80 backdrop-blur-xl flex flex-col shadow-2xl pointer-events-auto transition-all">
          <h3 className="text-lg font-semibold text-white mb-6 flex justify-between items-center gap-2">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
              Emissions by Sector (CO2 eq)
            </span>
            {activeSector && (
              <button 
                onClick={() => setActiveSector(null)}
                className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded hover:bg-slate-700"
              >
                Clear Focus
              </button>
            )}
          </h3>
          <div className="flex-1 min-h-[300px]" style={{ color: '#ffffff' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} onClick={(e: any) => setActiveSector(e?.activePayload?.[0]?.payload?.sector || null)}>
                <XAxis dataKey="sector" stroke="#ffffff" tick={{fill: '#ffffff'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#ffffff" tick={{fill: '#ffffff'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #1e293b', borderRadius: '12px', color: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                />
                <Bar dataKey="co2_level" radius={[6, 6, 0, 0]} className="cursor-pointer">
                  {data.map((entry: any, index: number) => {
                    const isSelected = activeSector === entry.sector;
                    const isWardMatched = activeWard !== null && isSelected; // In a real app we might match ward->sector. For UI we just highlight if selected.
                    const opacity = !activeSector ? 1 : (isSelected || isWardMatched ? 1 : 0.3);
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={opacity}
                        stroke={isSelected ? '#fff' : 'none'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6 border border-slate-800/80 bg-slate-900/80 backdrop-blur-xl flex flex-col shadow-2xl pointer-events-auto transition-all">
          <h3 className="text-lg font-semibold text-white mb-6 flex justify-between items-center gap-2">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-6 bg-rose-500 rounded-full"></span>
              Proportion of Total Emissions
            </span>
          </h3>
          <div className="flex-1 min-h-[300px]" style={{ color: '#ffffff' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart onClick={(e: any) => setActiveSector(e?.name || null)}>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="co2_level"
                  nameKey="sector"
                  stroke="none"
                  className="cursor-pointer font-bold focus:outline-none focus:ring-none"
                >
                  {data.map((entry: any, index: number) => {
                     const isSelected = activeSector === entry.sector;
                     const opacity = !activeSector ? 1 : isSelected ? 1 : 0.3;
                     return (
                       <Cell 
                         key={`cell-${index}`} 
                         fill={COLORS[index % COLORS.length]} 
                         opacity={opacity}
                         stroke={isSelected ? '#fff' : 'none'}
                         strokeWidth={isSelected ? 3 : 0}
                       />
                     );
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #1e293b', borderRadius: '12px', color: '#ffffff', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#ffffff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
