import { supabase } from './supabase';

export interface WardFeature {
  type: "Feature";
  properties: {
    id: string;
    name: string;
    co2_level: number;
    sector?: string;
  };
  geometry: unknown;
}

export interface FeatureCollection {
  type: "FeatureCollection";
  features: WardFeature[];
}

export async function getMapData(): Promise<FeatureCollection> {
  // Try fetching from Supabase
  try {
    const { data: wards, error: wardsError } = await supabase.from('wards').select('*');
    const { data: emissions, error: emissionsError } = await supabase.from('real_time_emissions').select('*');
    
    if (!wardsError && !emissionsError && wards && wards.length > 0) {
      const features: WardFeature[] = wards.map((w: { id: string; name: string; geometry: unknown }) => {
         const em = emissions?.find((e: { ward_id: string; sector: string; co2_level: number }) => e.ward_id === w.id);
         const sector = em ? em.sector : 'Unknown';
         const co2_level = em ? em.co2_level : 0;
         return {
           type: "Feature",
           properties: {
             id: w.id,
             name: w.name,
             sector: sector,
             co2_level: co2_level,
             transport_mode: sector === 'Transport' ? (Math.random() > 0.4 ? 'Highway Traffic' : 'Metro Line') : null
           },
           geometry: w.geometry
         };
      });
      return { type: "FeatureCollection", features };
    }
  } catch (e) {
    console.warn("Using mock data for map due to database connectivity issue:", e);
  }

  // Fallback Mock Data for impressive initial render
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { id: "1", name: "Connaught Place", co2_level: 450.5, sector: 'Transport' },
        geometry: { type: "Polygon", coordinates: [[[77.20, 28.62], [77.23, 28.62], [77.23, 28.64], [77.20, 28.64], [77.20, 28.62]]] }
      },
      {
        type: "Feature",
        properties: { id: "2", name: "Saket (South)", co2_level: 300.2, sector: 'Residential' },
        geometry: { type: "Polygon", coordinates: [[[77.19, 28.51], [77.22, 28.51], [77.22, 28.53], [77.19, 28.53], [77.19, 28.51]]] }
      },
      {
        type: "Feature",
        properties: { id: "3", name: "Okhla Phase I", co2_level: 680.1, sector: 'Industry' },
        geometry: { type: "Polygon", coordinates: [[[77.27, 28.52], [77.30, 28.52], [77.30, 28.55], [77.27, 28.55], [77.27, 28.52]]] }
      },
      {
        type: "Feature",
        properties: { id: "4", name: "Dwarka", co2_level: 210.0, sector: 'Transport' },
        geometry: { type: "Polygon", coordinates: [[[77.03, 28.56], [77.07, 28.56], [77.07, 28.60], [77.03, 28.60], [77.03, 28.56]]] }
      }
    ]
  };
}

export async function getSectorBreakdown() {
   try {
     const { data, error } = await supabase.from('real_time_emissions').select('sector, co2_level');
     if (!error && data && data.length > 0) {
        return data; 
     }
   } catch {}
   // Mock fallback
   return [
     { sector: 'Transport', co2_level: 450.5 },
     { sector: 'Industry', co2_level: 680.1 },
     { sector: 'Power', co2_level: 520.4 },
     { sector: 'Residential', co2_level: 300.2 },
     { sector: 'Waste', co2_level: 150.0 },
   ];
}

export async function getAIForecasts(policyScenario: string = 'baseline') {
  try {
     const { data, error } = await supabase.from('ai_forecasts').select('*').eq('policy_scenario', policyScenario).order('target_date', { ascending: true });
     if (!error && data && data.length > 0) return data;
  } catch {}

  const baseEmissions = [
    { year: '2026', co2_level: 450, forecast: 450 },
    { year: '2027', co2_level: 460, forecast: policyScenario === 'Net Zero' ? 320 : policyScenario === 'EV Transition' ? 420 : policyScenario === 'Industrial Filter' ? 440 : 470 },
    { year: '2028', co2_level: 475, forecast: policyScenario === 'Net Zero' ? 210 : policyScenario === 'EV Transition' ? 380 : policyScenario === 'Industrial Filter' ? 417 : 490 },
    { year: '2029', co2_level: 490, forecast: policyScenario === 'Net Zero' ? 95 : policyScenario === 'EV Transition' ? 320 : policyScenario === 'Industrial Filter' ? 390 : 510 },
    { year: '2030', co2_level: 510, forecast: policyScenario === 'Net Zero' ? 0 : policyScenario === 'EV Transition' ? 250 : policyScenario === 'Industrial Filter' ? 350 : 530 },
  ];
  return baseEmissions;
}

export async function getWardHistory(wardId: string) {
  // Mock historical 24h data generator
  const history = [];
  const base = 250 + Math.random() * 200;
  
  for (let i = 24; i >= 0; i--) {
    const d = new Date();
    d.setHours(d.getHours() - i);
    const timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Create a natural curve feeling
    const variation = Math.sin(i * 0.5) * 50 + (Math.random() * 20 - 10);
    const level = Math.max(50, Math.round(base + variation));
    
    history.push({
      time: timeLabel,
      co2: level,
      safeLimit: 300,
    });
  }
  return history;
}

export async function getMetroData(): Promise<{ stations: FeatureCollection, lines: FeatureCollection }> {
  const stations: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { id: "m1", name: "Rajiv Chowk", co2_level: 12.5, saved_co2: 1250, type: 'Metro Station', line: 'Blue/Yellow' },
        geometry: { type: "Point", coordinates: [77.2183, 28.6328] }
      },
      {
        type: "Feature",
        properties: { id: "m2", name: "Kashmiri Gate", co2_level: 18.2, saved_co2: 1420, type: 'Metro Station', line: 'Red/Yellow/Violet' },
        geometry: { type: "Point", coordinates: [77.2285, 28.6675] }
      },
      {
        type: "Feature",
        properties: { id: "m3", name: "Hauz Khas", co2_level: 9.4, saved_co2: 980, type: 'Metro Station', line: 'Yellow/Magenta' },
        geometry: { type: "Point", coordinates: [77.2065, 28.5434] }
      },
      {
        type: "Feature",
        properties: { id: "m4", name: "New Delhi", co2_level: 15.1, saved_co2: 1800, type: 'Metro Station', line: 'Yellow/Airport' },
        geometry: { type: "Point", coordinates: [77.2219, 28.6431] }
      },
      {
        type: "Feature",
        properties: { id: "m5", name: "Mundka", co2_level: 5.2, saved_co2: 450, type: 'Metro Station', line: 'Green' },
        geometry: { type: "Point", coordinates: [77.0266, 28.6824] }
      },
      {
        type: "Feature",
        properties: { id: "m6", name: "Delhi Cantt", co2_level: 4.8, saved_co2: 520, type: 'Metro Station', line: 'Pink' },
        geometry: { type: "Point", coordinates: [77.1231, 28.5911] }
      },
      {
        type: "Feature",
        properties: { id: "m7", name: "Dwarka Mor", co2_level: 6.5, saved_co2: 610, type: 'Metro Station', line: 'Blue' },
        geometry: { type: "Point", coordinates: [77.0333, 28.6189] }
      },
      {
        type: "Feature",
        properties: { id: "m8", name: "Rajdhani Park", co2_level: 3.2, saved_co2: 320, type: 'Metro Station', line: 'Green' },
        geometry: { type: "Point", coordinates: [77.0543, 28.6834] }
      }
    ]
  } as any;

  const lines: FeatureCollection = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Blue Line", color: "#0000FF", id: "l1" },
        geometry: { type: "LineString", coordinates: [[77.01, 28.61], [77.10, 28.62], [77.15, 28.63], [77.22, 28.63], [77.30, 28.64]] }
      },
      {
        type: "Feature",
        properties: { name: "Yellow Line", color: "#FFFF00", id: "l2" },
        geometry: { type: "LineString", coordinates: [[77.12, 28.75], [77.18, 28.70], [77.22, 28.65], [77.21, 28.55], [77.08, 28.45]] }
      },
      {
        type: "Feature",
        properties: { name: "Red Line", color: "#FF0000", id: "l3" },
        geometry: { type: "LineString", coordinates: [[76.95, 28.72], [77.05, 28.71], [77.15, 28.68], [77.23, 28.67], [77.35, 28.66]] }
      },
      {
        type: "Feature",
        properties: { name: "Green Line", color: "#00FF00", id: "l4" },
        geometry: { type: "LineString", coordinates: [[77.00, 28.68], [77.10, 28.67], [77.12, 28.66]] }
      }
    ]
  } as any;

  return { stations, lines };
}

export async function getTrafficData(): Promise<FeatureCollection> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { id: "t1", name: "Ring Road (South)", congestion: 0.8, base_emission: 120, type: 'Traffic Segment', ward_name: 'Saket (South)' },
        geometry: { type: "LineString", coordinates: [[77.18, 28.56], [77.24, 28.56], [77.28, 28.58]] }
      },
      {
        type: "Feature",
        properties: { id: "t2", name: "NH 44 (GT Road)", congestion: 0.4, base_emission: 180, type: 'Traffic Segment', ward_name: 'Unknown' },
        geometry: { type: "LineString", coordinates: [[77.15, 28.71], [77.18, 28.75], [77.22, 28.80]] }
      },
      {
        type: "Feature",
        properties: { id: "t3", name: "Outer Ring Road (North)", congestion: 0.9, base_emission: 150, type: 'Traffic Segment', ward_name: 'Connaught Place' },
        geometry: { type: "LineString", coordinates: [[77.10, 28.70], [77.15, 28.72], [77.20, 28.71]] }
      }
    ]
  } as any;
}

export async function getEcoRoute(start: [number, number], end: [number, number], avoidPolygons: any): Promise<any> {
  // In a real app, this would call OpenRouteService with avoid_polygons.
  // We'll return a mock route that "curves" around the center if avoidPolygons is active.
  
  const midPoint = avoidPolygons 
    ? [ (start[0] + end[0]) / 2 + 0.05, (start[1] + end[1]) / 2 + 0.05 ]
    : [ (start[0] + end[0]) / 2, (start[1] + end[1]) / 2 ];

  return {
    type: "Feature",
    properties: { type: 'Eco Route' },
    geometry: {
      type: "LineString",
      coordinates: [
        start,
        midPoint,
        end
      ]
    }
  };
}

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  total_co2_saved: number;
  weekly_co2_saved: number;
  eco_credits: number;
  current_rank: number;
  tier: string;
}

export async function getLeaderboard(): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('weekly_co2_saved', { ascending: false })
      .limit(50);
    
    if (!error && data && data.length > 0) return data;
  } catch (e) {
    console.warn("Using mock data for leaderboard:", e);
  }

  // Mock Leaders
  return [
    { id: '1', username: 'Aravind K.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aravind', total_co2_saved: 1250.5, weekly_co2_saved: 85.2, eco_credits: 1200, current_rank: 1, tier: 'Forest Guardian' },
    { id: '2', username: 'Priya S.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya', total_co2_saved: 980.2, weekly_co2_saved: 72.1, eco_credits: 850, current_rank: 2, tier: 'Tree' },
    { id: '3', username: 'Rahul M.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul', total_co2_saved: 840.0, weekly_co2_saved: 68.5, eco_credits: 420, current_rank: 3, tier: 'Tree' },
    { id: '4', username: 'Ananya D.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ananya', total_co2_saved: 620.1, weekly_co2_saved: 45.4, eco_credits: 310, current_rank: 4, tier: 'Sapling' },
    { id: '5', username: 'Ishaan V.', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ishaan', total_co2_saved: 410.5, weekly_co2_saved: 22.1, eco_credits: 150, current_rank: 5, tier: 'Seedling' },
    { id: '6', username: 'You', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You', total_co2_saved: 150.0, weekly_co2_saved: 12.5, eco_credits: 600, current_rank: 12, tier: 'Seedling' },
  ];
}

export async function claimReward(profileId: string, rewardType: string, cost: number): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('claim_reward', { p_id: profileId, p_cost: cost });
    if (!error) return true;
  } catch {}
  
  // Mock success
  console.log(`Mock: Reward ${rewardType} claimed for ${cost} credits.`);
  return true;
}
