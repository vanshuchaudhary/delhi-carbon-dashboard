'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SimulatorContextType {
  transportWeight: number;
  setTransportWeight: (val: number) => void;
  industrialWeight: number;
  setIndustrialWeight: (val: number) => void;
  penalty: number;
  setPenalty: (val: number) => void;
  isDanger: boolean;
  setIsDanger: (val: boolean) => void;
  currentZone: string | null;
  setCurrentZone: (val: string | null) => void;
  avoidPolygons: any;
  setAvoidPolygons: (val: any) => void;
  demoRouteTrigger: boolean;
  setDemoRouteTrigger: (val: boolean) => void;
  activeSector: string | null;
  setActiveSector: (val: string | null) => void;
  activeWard: string | null;
  setActiveWard: (val: string | null) => void;
  isSidebarMini: boolean;
  setIsSidebarMini: (val: boolean) => void;
  activeScenario: 'DEFAULT' | 'WARD_SELECT' | 'POLICY_CHANGE';
  setActiveScenario: (val: 'DEFAULT' | 'WARD_SELECT' | 'POLICY_CHANGE') => void;
  score: number;
  simulatedReduction: number;
  co2Removed: number;
  getImpactWeights: () => { transport: number; industrial: number };
  getReport: (wardName: string, sector: string) => string;
  triggerAutoSimulation: () => void;
  isSimulating: boolean;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

import { IMPACT_MATRIX, SectorType } from '@/lib/simulationConstants';

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [transportWeight, setTransportWeight] = useState(1);
  const [industrialWeight, setIndustrialWeight] = useState(1);
  const [penalty, setPenalty] = useState(0);
  const [isDanger, setIsDanger] = useState(false);
  const [currentZone, setCurrentZone] = useState<string | null>(null);
  const [avoidPolygons, setAvoidPolygons] = useState<any>(null);
  const [demoRouteTrigger, setDemoRouteTrigger] = useState(false);
  const [activeSector, setActiveSector] = useState<string | null>(null);
  const [activeWard, setActiveWard] = useState<string | null>(null);
  const [isSidebarMini, setIsSidebarMini] = useState(false);
  const [activeScenario, setActiveScenario] = useState<'DEFAULT' | 'WARD_SELECT' | 'POLICY_CHANGE'>('DEFAULT');
  const [isSimulating, setIsSimulating] = useState(false);

  const getReport = (wardName: string, sector: string) => {
    if (sector === 'Industry') {
      return `AI analysis for ${wardName} indicates critical emissions from manufacturing clusters. Implementing advanced ⚛️ Industrial Scrubber technology and regional carbon sequestration mandates could stabilize local air quality by 24% within the next fiscal cycle.`;
    }
    if (sector === 'Transport') {
      return `For the ${wardName} connectivity hub, our models prioritize high-density EV charging infrastructure combined with AI-driven traffic flow optimization. This integrated approach targets a 18.5% reduction in particulate matter during peak commute hours.`;
    }
    return `Environmental Sentinel data for ${wardName} suggests a balanced cross-sector mitigation strategy. Focusing on grid efficiency and waste-to-energy conversion is recommended to offset the current carbon growth trend.`;
  };

  const triggerAutoSimulation = () => {
    setIsSimulating(true);
    const weights = getImpactWeights();
    
    // Animate sliders to target positions
    // In a real app we might use a library, here we'll mock the jump for now or use a simple interval
    let step = 0;
    const interval = setInterval(() => {
       step += 0.05;
       if (step >= 1) {
         setTransportWeight(weights.transport > weights.industrial ? 0.2 : 0.6);
         setIndustrialWeight(weights.industrial > weights.transport ? 0.1 : 0.5);
         setIsSimulating(false);
         clearInterval(interval);
       } else {
         // Smoothly move towards target
         setTransportWeight(prev => prev - (prev - (weights.transport > weights.industrial ? 0.2 : 0.6)) * 0.1);
         setIndustrialWeight(prev => prev - (prev - (weights.industrial > weights.transport ? 0.1 : 0.5)) * 0.1);
       }
    }, 50);
  };

  const getImpactWeights = () => {
    const sector = (activeSector as SectorType) || 'Unknown';
    return IMPACT_MATRIX[sector] || IMPACT_MATRIX['Unknown'];
  };

  const weights = getImpactWeights();
  
  // Weighted Total Reduction: sum(SliderValue * (InfluenceScore / 100))
  // We use (1 - weight) as the slider value (0 = no intervention, 1 = full intervention)
  const transportEffort = (1 - transportWeight); 
  const industrialEffort = (1 - industrialWeight);
  
  const simulatedReduction = (transportEffort * weights.transport) + (industrialEffort * weights.industrial);
  
  // Health Score (0-100): Starts from base (45) and moves to 100 based on reduction
  const baseScore = 45;
  const score = Math.max(0, Math.min(Math.round(baseScore + (simulatedReduction * (100 - baseScore)) - penalty), 98));
  
  // CO2 Removed (kg/hr): Assuming a baseline city-wide or ward-specific average 
  // For Okhla/Industrial we assume a baseline of ~1200kg/hr avg
  const baselineCO2 = activeSector === 'Industry' ? 1200 : 800;
  const co2Removed = Math.round(baselineCO2 * simulatedReduction);

  return (
    <SimulatorContext.Provider value={{
      transportWeight,
      setTransportWeight,
      industrialWeight,
      setIndustrialWeight,
      penalty,
      setPenalty,
      isDanger,
      setIsDanger,
      currentZone,
      setCurrentZone,
      avoidPolygons,
      setAvoidPolygons,
      demoRouteTrigger,
      setDemoRouteTrigger,
      activeSector,
      setActiveSector,
      activeWard,
      setActiveWard,
      isSidebarMini,
      setIsSidebarMini,
      activeScenario,
      setActiveScenario,
      score,
      simulatedReduction,
      co2Removed,
      getImpactWeights,
      getReport,
      triggerAutoSimulation,
      isSimulating
    }}>
      {children}
    </SimulatorContext.Provider>
  );
}

export function useSimulator() {
  const context = useContext(SimulatorContext);
  if (context === undefined) {
    throw new Error('useSimulator must be used within a SimulatorProvider');
  }
  return context;
}
