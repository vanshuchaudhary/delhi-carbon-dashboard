'use client';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { getAIForecasts } from '@/lib/api';
import { useSimulator } from '@/contexts/SimulatorContext';
import { Sparkles, TrendingDown, DollarSign, Wallet } from 'lucide-react';

export default function PolicySandboxPage() {
  const [policy, setPolicy] = useState('baseline');
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const { transportWeight, setTransportWeight, industrialWeight, setIndustrialWeight } = useSimulator();
  
  const policies = ['baseline', 'EV Transition', 'Industrial Filter', 'Net Zero'];

  useEffect(() => {
    getAIForecasts(policy).then(setData);
  }, [policy]);

  const handleSolveFor2030 = () => {
    // AI Solver: Move sliders to minimum req for Net Zero
    setTransportWeight(0.05); // 95% Green
    setIndustrialWeight(0.05); // 95% Filters
    setPolicy('Net Zero');
  };

  // Heuristic Cost Calculation
  const evStations = Math.round((1 - transportWeight) * 12500);
  const industrialRetrofits = Math.round((1 - industrialWeight) * 850);
  const totalCostCr = (evStations * 0.12 + industrialRetrofits * 4.5).toFixed(1);

  return (
    <div className="h-full w-full animate-fade-in flex flex-col gap-6 z-10 relative">
      <header className="mb-2">
        <h1 className="text-3xl font-bold text-slate-100">AI Policy Sandbox</h1>
        <p className="text-slate-400 mt-1">Simulate the impact of environmental policies on Delhi&apos;s forecasted emissions</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 max-h-[75vh]">
        {/* Controls */}
        <div className="glass-panel p-6 border border-slate-800/50 flex flex-col shadow-xl lg:col-span-1">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              Policy Parameters
            </h3>
            <button 
              onClick={handleSolveFor2030}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/50 text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-500 hover:text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] group"
            >
              <Sparkles className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              Solve for 2030
            </button>
          </div>
          
          <div className="flex flex-col gap-3 overflow-y-auto pr-1">
            {policies.map(p => (
              <button
                key={p}
                onClick={() => setPolicy(p)}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${policy === p ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[inset_0_0_15px_rgba(16,185,129,0.15)] scale-[1.02]' : 'bg-slate-800/30 border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 hover:border-slate-600'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-base">{p === 'baseline' ? 'Baseline' : p}</div>
                  {p === 'Net Zero' && <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/30">AI TARGET</span>}
                </div>
                <div className="text-xs mt-1 opacity-70 leading-relaxed">
                  {p === 'baseline' ? 'Default trajectory with no interventions.' : 
                   p === 'Net Zero' ? 'Aggressive path to full decarbonization.' :
                   `Apply the ${p} model.`}
                </div>
              </button>
            ))}
          </div>
          
          <div className="mt-auto pt-6 border-t border-slate-800/50">
             <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Wallet className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Financial Output</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                      <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">Est. Budget</div>
                      <div className="text-sm font-mono font-bold text-slate-200">₹{totalCostCr} Cr</div>
                   </div>
                   <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                      <div className="text-[9px] text-slate-500 font-bold uppercase mb-1">EV Hubs Req.</div>
                      <div className="text-sm font-mono font-bold text-slate-200">{evStations.toLocaleString()}</div>
                   </div>
                </div>
                <div className="text-[10px] text-slate-500 italic mt-1 leading-tight">
                  Projections based on {industrialRetrofits} active industrial retrofits.
                </div>
             </div>
          </div>
        </div>

        {/* Chart */}
        <div className="glass-panel p-6 border border-slate-800/50 flex flex-col shadow-xl lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              Emission Forecast (2026 - 2030)
            </h3>
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Model Confidence: 94%
            </div>
          </div>
          <div className="flex-1 min-h-[400px]" style={{ color: '#94a3b8' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="year" stroke="#64748b" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' }}
                />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ color: '#94a3b8' }} />
                <ReferenceLine y={0} stroke="#10b981" strokeWidth={2} strokeDasharray="3 3" label={{ value: 'NET ZERO', position: 'insideBottomRight', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="co2_level" name="Historical/Baseline" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, fill: '#f43f5e', strokeWidth: 2, stroke:'#0f172a'}} activeDot={{r: 6}} />
                {policy !== 'baseline' && (
                  <Line type="monotone" dataKey="forecast" name={`Forecast: ${policy}`} stroke={policy === 'Net Zero' ? '#8b5cf6' : '#10b981'} strokeWidth={4} strokeDasharray="5 5" dot={{r: 4, fill: policy === 'Net Zero' ? '#8b5cf6' : '#10b981', strokeWidth: 2, stroke:'#0f172a'}} activeDot={{r: 8, strokeWidth: 0}} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
