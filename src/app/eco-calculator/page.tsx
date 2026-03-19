'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
   Train, Footprints, Zap, TreePine, ArrowRight,
   MapPin, Search, Car, Truck, Navigation,
   ChevronDown, CheckCircle2, Info, Bus,
    Sparkles, ShieldCheck, Zap as ZapIcon, AlertCircle, Users
} from 'lucide-react';
import SentinelTooltip from '@/components/SentinelTooltip';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  EMISSION_FACTORS, 
  calculateSavings,
  TREE_DAILY_ABSORPTION_G,
  calculateDetailedEmissions,
  type VehicleCategory,
  type FuelType,
  type BSNorm
} from '@/lib/carbonCalculator';
import { getORSRoute, getORSGeocoding } from '@/lib/ors';
import { useAuth } from '@/contexts/AuthContext';
import { useSimulator } from '@/contexts/SimulatorContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// No token needed for MapLibre/OpenFreeMap

type Place = {
   name: string;
   coords: [number, number] | null;
};

export default function AdvancedEcoCalculator() {
   const router = useRouter();
   const { activeWard } = useSimulator();
   const [origin, setOrigin] = useState<Place>({ name: '', coords: null });
   const [destination, setDestination] = useState<Place>({ name: '', coords: null });
   const [distanceKm, setDistanceKm] = useState<number | null>(null);
   
   // Detailed Vehicle States
   const [category, setCategory] = useState<VehicleCategory>('CAR');
   const [fuel, setFuel] = useState<FuelType>('PETROL');
   const [norm, setNorm] = useState<BSNorm>('BS6');

   const [originSuggestions, setOriginSuggestions] = useState<any[]>([]);
   const [destSuggestions, setDestSuggestions] = useState<any[]>([]);
   const mapContainer = useRef<HTMLDivElement>(null);
   const map = useRef<maplibregl.Map | null>(null);
   const markers = useRef<maplibregl.Marker[]>([]);
   const [loading, setLoading] = useState(false);
   const [showTreeInfo, setShowTreeInfo] = useState(false);

   useEffect(() => {
      if (map.current || !mapContainer.current) return;

      map.current = new maplibregl.Map({
         container: mapContainer.current,
         style: 'https://tiles.openfreemap.org/styles/dark',
         center: [77.2090, 28.6139],
         zoom: 11,
         attributionControl: false
      });

      return () => {
         map.current?.remove();
         map.current = null;
      };
   }, []);

   // Fetch Suggestions
   const debounceSuggestions = useCallback((q: string, setter: any) => {
      const timer = setTimeout(async () => {
         const suggestions = await getORSGeocoding(q);
         setter(suggestions);
      }, 300);
      return () => clearTimeout(timer);
   }, []);

   const { user, isGuest } = useAuth();

   const saveSavings = async (savedKg: number) => {
      if (!user || isGuest || savedKg <= 0) return;

      try {
         // Upsert profile with savings
         const { data: profile } = await supabase
            .from('profiles')
            .select('total_co2_saved, weekly_co2_saved')
            .eq('id', user.id)
            .single();

         const newTotal = (profile?.total_co2_saved || 0) + savedKg;
         const newWeekly = (profile?.weekly_co2_saved || 0) + savedKg;

         const { error } = await supabase
            .from('profiles')
            .upsert({ 
               id: user.id, 
               username: user.email?.split('@')[0] || 'Sentinel',
               total_co2_saved: newTotal,
               weekly_co2_saved: newWeekly,
               updated_at: new Date().toISOString()
            });

         if (error) throw error;
         toast.success('Sentinel Progress Saved', { 
            description: `Total: ${newTotal.toFixed(2)}kg | Week: ${newWeekly.toFixed(2)}kg` 
         });
      } catch (e) {
         console.error('Error saving savings:', e);
      }
   };

   // Calculate Route and Update Map
   const calculateRoute = async () => {
      if (!origin.coords || !destination.coords || !map.current) return;
      setLoading(true);

      try {
         // Clear existing markers
         markers.current.forEach(m => m.remove());
         markers.current = [];

         const result = await getORSRoute(origin.coords, destination.coords);

         if (result) {
            setDistanceKm(result.distance / 1000);

            const geojson: any = {
               type: 'Feature',
               geometry: result.geometry
            };

            // Start Marker
            const startEl = document.createElement('div');
            startEl.className = 'bg-white p-2 rounded-full border-2 border-emerald-500 shadow-lg';
            startEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
            const startMarker = new maplibregl.Marker({ element: startEl })
               .setLngLat(origin.coords)
               .addTo(map.current);
            markers.current.push(startMarker);

            // Tree (End) Marker
            const treeEl = document.createElement('div');
            treeEl.className = 'relative';
            treeEl.innerHTML = `
               <div class="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>
               <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="relative z-10"><path d="m12 19 3-7-3-7-3 7z"/><path d="M9 19h6"/><path d="M12 3v16"/></svg>
            `;
            const treeMarker = new maplibregl.Marker({ element: treeEl })
               .setLngLat(destination.coords)
               .addTo(map.current);
            markers.current.push(treeMarker);

            if (map.current.getSource('route')) {
               (map.current.getSource('route') as maplibregl.GeoJSONSource).setData(geojson);
            } else {
               map.current.addSource('route', { type: 'geojson', data: geojson });
               
               // Glowing Green Route
               map.current.addLayer({
                  id: 'route-glow',
                  type: 'line',
                  source: 'route',
                  layout: { 'line-join': 'round', 'line-cap': 'round' },
                  paint: { 
                     'line-color': '#00ff88', 
                     'line-width': 8, 
                     'line-opacity': 0.3,
                     'line-blur': 4
                  }
               });

               map.current.addLayer({
                  id: 'route-line',
                  type: 'line',
                  source: 'route',
                  layout: { 'line-join': 'round', 'line-cap': 'round' },
                  paint: { 
                     'line-color': '#00ff88', 
                     'line-width': 4
                  }
               });

               // Pulse Animation Effect (simplified via data/paint updates)
               let opacity = 0.4;
               let increasing = true;
               setInterval(() => {
                  if (!map.current) return;
                  if (increasing) {
                     opacity += 0.05;
                     if (opacity >= 0.8) increasing = false;
                  } else {
                     opacity -= 0.05;
                     if (opacity <= 0.4) increasing = true;
                  }
                  if (map.current.getLayer('route-line')) {
                     map.current.setPaintProperty('route-line', 'line-opacity', opacity);
                  }
               }, 100);
            }

            const bounds = new maplibregl.LngLatBounds();
            result.geometry.coordinates.forEach((c: any) => bounds.extend(c));
            map.current.fitBounds(bounds, { padding: 80, duration: 2000 });

            // Trigger saving if route found
            const currentEmissions = calculateDetailedEmissions(result.distance / 1000, category, fuel, norm);
            const currentSavings = calculateSavings(result.distance / 1000, currentEmissions.grams);
            if (currentSavings.savedKg > 0) {
               saveSavings(currentSavings.savedKg);
            }
         }
      } catch (e) {
         console.error(e);
      } finally {
         setLoading(false);
      }
   };

   const [aqi, setAqi] = useState(156); // Mock initial AQI
   const alertTriggered = useRef(false);

   // Monitor AQI and Trigger Alert
   useEffect(() => {
     if (aqi > 300 && !alertTriggered.current && user) {
       triggerSentinelAlert(aqi);
       alertTriggered.current = true;
     } else if (aqi <= 300) {
       alertTriggered.current = false;
     }
   }, [aqi, user]);

   const triggerSentinelAlert = async (currentAqi: number) => {
     try {
       const { data, error } = await supabase.functions.invoke('sentinel-alert', {
         body: { 
           userId: user?.id, 
           type: 'CRITICAL_AQI', 
           aqi: currentAqi,
           zone: origin.name || 'Current Sector'
         }
       });
       if (error) throw error;
       toast.error('CRITICAL AIR QUALITY', {
         description: `AQI is ${currentAqi}. Sentinel Alert dispatched to all channels.`
       });
     } catch (err) {
       console.error('Sentinel Alert Exception:', err);
     }
   };

   useEffect(() => {
      if (origin.coords && destination.coords) {
         calculateRoute();
      }
   }, [origin.coords, destination.coords]);

   const emissions = distanceKm ? calculateDetailedEmissions(distanceKm, category, fuel, norm) : { grams: 0, kg: 0, factor: 0 };
   const savings = distanceKm ? calculateSavings(distanceKm, emissions.grams) : { savedGrams: 0, savedKg: 0, treeDays: 0 };

   const chartData = [
      { name: 'Selected', co2: emissions.kg || 0.1, color: '#10b981' },
      { name: 'Petrol BS3', co2: distanceKm ? calculateDetailedEmissions(distanceKm, 'CAR', 'PETROL', 'BS3').kg : 2.1, color: '#f43f5e' },
      { name: 'Diesel SUV', co2: distanceKm ? calculateDetailedEmissions(distanceKm, 'SUV', 'DIESEL', 'BS4').kg : 2.5, color: '#ef4444' },
      { name: 'Metro', co2: distanceKm ? (15 * distanceKm / 1000) : 0.15, color: '#3b82f6' },
   ];

   // Sentinel AI Insights Logic
   const getSentinelInsights = () => {
      if (!distanceKm) return null;
      
      const insights = [];
      
      if (fuel === 'DIESEL' && (norm === 'BS3' || norm === 'BS4')) {
         insights.push({
            title: 'Legacy Diesel Detected',
            text: 'Your pre-2015 Diesel vehicle is a high-particulate emitter. Switching to a BS6 Diesel or EV would reduce your trip emissions by ~40-80%.',
            type: 'warning'
         });
      }

      if (fuel === 'PETROL' && norm === 'BS3') {
         insights.push({
            title: 'Low Efficiency Alert',
            text: 'BS3 Petrol norms are significantly less efficient than modern standards. A hybrid or small EV transition is recommended for urban Delhi commutes.',
            type: 'info'
         });
      }

      if (emissions.kg > 5) {
         const metroSaved = calculateSavings(distanceKm, emissions.grams).savedKg;
         insights.push({
            title: 'High Carbon Trip',
            text: `This journey exceeds 5kg of CO2. Taking the Delhi Metro instead would save exactly ${metroSaved.toFixed(2)}kg of carbon!`,
            type: 'action'
         });
      }

      if (fuel === 'EV') {
         insights.push({
            title: 'Quantum Sentinel Verified',
            text: `Congratulations! By choosing an Electric Vehicle, you are already saving ${savings.treeDays.toFixed(1)} Tree Growth Days compared to a Petrol baseline.`,
            type: 'success'
         });
      }

      return insights;
   };

   const aiInsights = getSentinelInsights();

   return (
      <div className="h-[calc(100vh-120px)] w-full animate-fade-in flex overflow-hidden rounded-2xl border border-slate-800/50 glass-panel shadow-2xl">
         {/* Left: Input Panel (1/3) */}
         <div className="w-full lg:w-1/3 flex flex-col h-full border-r border-slate-800/50 overflow-y-auto custom-scrollbar">
            <div className="p-8 pb-4">
               <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
                  <Navigation className="w-7 h-7 text-emerald-500" /> Eco-Analyzer
               </h1>
               <div className="flex items-center gap-2 mt-2">
                 <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">Split-Screen Analytics</p>
                 <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border ${aqi > 300 ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'}`}>
                   AQI: {aqi} {aqi > 300 ? 'CRITICAL' : 'STABLE'}
                 </div>
               </div>
            </div>

            <div className="p-8 flex flex-col gap-6">
               {/* Demo Control */}
               <div className="flex justify-end p-2 border border-slate-800 rounded-xl bg-slate-900 shadow-inner">
                 <button 
                   onClick={() => setAqi(prev => prev === 412 ? 156 : 412)}
                   className="text-[10px] font-black text-slate-500 hover:text-rose-400 uppercase tracking-widest transition-colors"
                 >
                   [ {aqi > 300 ? 'RESET_SENTINEL' : 'SIMULATE_CRITICAL_AQI'} ]
                 </button>
               </div>
               <div className="flex flex-col gap-6">
                  <div className="relative">
                     <label className="text-xs font-bold text-white uppercase tracking-widest mb-3 block">Origin</label>
                     <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                           type="text"
                           placeholder="Search start point..."
                           value={origin.name}
                           onChange={(e) => {
                              setOrigin({ ...origin, name: e.target.value });
                              debounceSuggestions(e.target.value, setOriginSuggestions);
                           }}
                           className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 outline-none focus:border-emerald-500/50 transition-all text-sm"
                        />
                        {originSuggestions?.length > 0 && (
                           <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                              {originSuggestions.map((s: any, index: number) => (
                                 <div 
                                    key={`suggestion-${s.properties.id || index}`} 
                                    onClick={() => { setOrigin({ name: s.properties.label || s.properties.name, coords: s.geometry.coordinates }); setOriginSuggestions([]); }} 
                                    className="p-3 hover:bg-emerald-500/10 hover:text-emerald-400 cursor-pointer text-slate-400 text-xs border-b border-slate-800/50 last:border-0 transition-colors"
                                 >
                                    {s.properties.label || s.properties.name}
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>

                  <div className="relative">
                     <label className="text-xs font-bold text-white uppercase tracking-widest mb-3 block">Destination</label>
                     <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                           type="text"
                           placeholder="Search destination..."
                           value={destination.name}
                           onChange={(e) => {
                              setDestination({ ...destination, name: e.target.value });
                              debounceSuggestions(e.target.value, setDestSuggestions);
                           }}
                           className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-200 outline-none focus:border-emerald-500/50 transition-all text-sm"
                        />
                        {destSuggestions?.length > 0 && (
                           <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-300">
                              {destSuggestions.map((s: any, index: number) => (
                                 <div 
                                    key={`suggestion-${s.properties.id || index}`} 
                                    onClick={() => { setDestination({ name: s.properties.label || s.properties.name, coords: s.geometry.coordinates }); setDestSuggestions([]); }} 
                                    className="p-3 hover:bg-emerald-500/10 hover:text-emerald-400 cursor-pointer text-slate-400 text-xs border-b border-slate-800/50 last:border-0 transition-colors"
                                 >
                                    {s.properties.label || s.properties.name}
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                  </div>
               </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-white uppercase tracking-widest mb-3 block">Vehicle Category</label>
                    <div className="relative">
                       <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                          className="w-full appearance-none bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 outline-none focus:border-emerald-500/50 transition-all text-sm cursor-pointer"
                       >
                          <option value="CAR">Private Car</option>
                          <option value="SUV">Luxury SUV</option>
                          <option value="TWO_WHEELER">Two-Wheeler</option>
                       </select>
                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-white uppercase tracking-widest mb-3 block">Fuel Type</label>
                    <div className="relative">
                       <select
                          value={fuel}
                          onChange={(e) => { 
                             setFuel(e.target.value as FuelType);
                             if (e.target.value === 'EV') setNorm('BS6');
                          }}
                          className="w-full appearance-none bg-slate-900/50 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 outline-none focus:border-emerald-500/50 transition-all text-sm cursor-pointer"
                       >
                          <option value="PETROL">Petrol</option>
                          <option value="DIESEL">Diesel</option>
                          <option value="EV">Electric (Plugin)</option>
                       </select>
                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {fuel !== 'EV' && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-xs font-bold text-white uppercase tracking-widest mb-3 block">Model Year / BS Norm</label>
                    <div className="flex gap-2">
                       {['BS3', 'BS4', 'BS6'].map((n) => (
                          <button
                             key={n}
                             onClick={() => setNorm(n as BSNorm)}
                             className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border transition-all ${
                               norm === n 
                               ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-900/20' 
                               : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                             }`}
                          >
                             {n} {n === 'BS3' ? '(<2010)' : n === 'BS4' ? '(2010-2020)' : '(2020+)'}
                          </button>
                       ))}
                    </div>
                  </div>
                )}
               {/* Stats & Impact Card */}
               {distanceKm ? (
                  <div className="mt-4 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <div className="glass-panel p-6 border-2 border-emerald-500/20 bg-emerald-500/5 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                           <TreePine className="w-16 h-16 text-emerald-400" />
                        </div>
                        
                        <h3 className="text-emerald-400 font-bold text-sm uppercase tracking-widest flex items-center gap-2 mb-4">
                           <ZapIcon className="w-4 h-4" /> Transit Impact
                           <SentinelTooltip
                             isVisible={showTreeInfo}
                             formula="Tree\ Days = \frac{\text{Total Emissions (g)}}{59.7}"
                             content={
                               <div className="space-y-2">
                                 <p className="font-bold text-emerald-400 uppercase tracking-tighter text-[10px]">The Math</p>
                                 <p>A mature tree absorbs ~21.8kg CO₂/year, or <span className="text-emerald-400 font-bold">59.7g per day</span>.</p>
                                 <p className="text-[10px] opacity-70">This turns scientific data into a relatable biological timeline.</p>
                               </div>
                             }
                           >
                             <button 
                               onMouseEnter={() => setShowTreeInfo(true)}
                               onMouseLeave={() => setShowTreeInfo(false)}
                               className="text-emerald-500/50 hover:text-emerald-400 transition-colors"
                             >
                               <Info className="w-4 h-4" />
                             </button>
                           </SentinelTooltip>
                        </h3>
                        
                        <p className="text-slate-300 text-lg leading-relaxed font-medium">
                           Total Trip Cost: <span className="text-rose-400 font-mono">{emissions.kg.toFixed(2)} kg</span> of CO₂.
                        </p>
                        
                        <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between">
                           <div className="flex flex-col">
                              <span className="text-white text-[10px] font-bold uppercase tracking-widest">Tree Growth Days</span>
                              <span className="text-xs text-slate-400">Time to sequester this trip</span>
                           </div>
                           <span className="text-emerald-500 font-mono font-bold text-3xl">{savings.treeDays.toFixed(1)}</span>
                        </div>
                     </div>

                     {/* Sentinel Advice Box */}
                     <div className="p-5 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl relative overflow-hidden group">
                        <div className="flex items-center gap-3 mb-3 text-indigo-400">
                           <ShieldCheck className="w-5 h-5" />
                           <h4 className="text-xs font-black uppercase tracking-widest">Sentinel Advice</h4>
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed italic">
                           {fuel === 'EV' 
                             ? "Exceptional choice, Sentinel. Your transition to Electric Mobility is actively reducing Delhi's transport footprint." 
                             : distanceKm && distanceKm > 10 
                               ? `This ${distanceKm.toFixed(1)}km trip would be ${((emissions.grams - 15*distanceKm)/emissions.grams * 100).toFixed(0)}% cleaner via the Delhi Metro. Consider the Blue Line for this leg.` 
                               : "Even modern BS6 engines emit significant particulate matter. For short trips under 3km, walking saves 100% of emissions."}
                        </p>
                     </div>

                     {/* Sentinel Insights Box */}
                     <AnimatePresence>
                        {aiInsights && aiInsights.length > 0 && (
                           <div className="space-y-3">
                              {aiInsights.map((insight, idx) => (
                                 <motion.div 
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`p-4 rounded-2xl border flex gap-4 ${
                                       insight.type === 'warning' ? 'bg-rose-500/10 border-rose-500/20' :
                                       insight.type === 'action' ? 'bg-amber-500/10 border-amber-500/20' :
                                       insight.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' :
                                       'bg-indigo-500/10 border-indigo-500/20'
                                    }`}
                                 >
                                    <div className={`p-2 rounded-xl h-fit ${
                                       insight.type === 'warning' ? 'bg-rose-500/20 text-rose-400' :
                                       insight.type === 'action' ? 'bg-amber-500/20 text-amber-400' :
                                       insight.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                                       'bg-indigo-500/20 text-indigo-400'
                                    }`}>
                                       {insight.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : 
                                        insight.type === 'action' ? <Sparkles className="w-5 h-5" /> :
                                        <AlertCircle className="w-5 h-5" />}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                       <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                                          {insight.title}
                                          {insight.type === 'action' && <span className="text-[8px] bg-amber-500/30 px-1.5 py-0.5 rounded text-amber-300">AI RECOMMENDED</span>}
                                       </h4>
                                       <p className="text-xs text-slate-300 leading-relaxed">{insight.text}</p>
                                    </div>
                                 </motion.div>
                              ))}
                           </div>
                        )}
                     </AnimatePresence>

                     <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => router.push('/community')}
                        className="mt-4 w-full py-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center gap-3 text-emerald-400 font-black uppercase text-[10px] tracking-[0.2em] shadow-[0_0_20px_rgba(16,185,129,0.1)] hover:shadow-[0_0_30px_rgba(16,185,129,0.2)] transition-all group"
                      >
                        <Users className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        Contribute to Ward {activeWard ? `(${activeWard})` : 'Data'}
                      </motion.button>

                     <div className="h-[180px] w-full mt-2">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" stroke="#475569" fontSize={9} width={60} axisLine={false} tickLine={false} />
                              <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }} />
                              <Bar dataKey="co2" radius={[0, 4, 4, 0]}>
                                 {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                                 ))}
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               ) : (
                  <div className="mt-10 py-10 px-6 border border-slate-800/50 border-dashed rounded-2xl text-center flex flex-col items-center justify-center gap-4 text-slate-500">
                     <div className="p-4 bg-slate-900 rounded-full border border-slate-800">
                        <Navigation className="w-8 h-8 opacity-20" />
                     </div>
                     <p className="text-xs font-semibold uppercase tracking-widest leading-loose">Enter origin & destination<br/>to analyze route</p>
                  </div>
               )}
            </div>
         </div>

         {/* Right: Full Height Map (2/3) */}
         <div className="hidden lg:block lg:flex-1 relative bg-slate-900 border-l border-slate-800/30">
            <div ref={mapContainer} className="absolute inset-0 h-full w-full" />
            
            {/* Loading Indicator */}
            {loading && (
               <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm z-30 flex items-center justify-center transition-opacity">
                  <div className="relative">
                     <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full scale-150 animate-pulse"></div>
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 relative z-10"></div>
                  </div>
               </div>
            )}

            {/* Map Controls / Indicators */}
            <div className="absolute top-6 right-6 flex flex-col gap-2 z-20">
               <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ORS Live Data</span>
               </div>
            </div>

            {/* Bottom Map Info */}
            {distanceKm && (
               <div className="absolute bottom-8 left-8 right-8 z-20">
                  <div className="glass-panel py-3 px-6 bg-slate-950/60 backdrop-blur-xl border border-slate-800/50 rounded-2xl flex items-center justify-around shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
                     <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Route Distance</span>
                        <span className="text-slate-100 font-mono font-bold text-sm tracking-widest">{distanceKm.toFixed(2)} km</span>
                     </div>
                     <div className="w-px h-8 bg-slate-800"></div>
                      <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Carbon (Selected)</span>
                        <span className="text-rose-400 font-mono font-bold text-sm tracking-widest">{emissions.kg.toFixed(2)} kg</span>
                     </div>
                     <div className="w-px h-8 bg-slate-800"></div>
                     <div className="flex flex-col items-center">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Eco Preference</span>
                        <span className="text-emerald-400 font-mono font-bold text-sm tracking-widest">Recommended</span>
                     </div>
                  </div>
               </div>
            )}
         </div>

         <style jsx global>{`
            @keyframes pulse {
               0%, 100% { transform: scale(1) translateY(0); opacity: 0.6; }
               50% { transform: scale(1.1) translateY(-5px); opacity: 1; }
            }
            .custom-scrollbar::-webkit-scrollbar {
               width: 4px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
               background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
               background: rgba(16, 185, 129, 0.2);
               border-radius: 10px;
            }
         `}</style>
      </div>
   );
}
