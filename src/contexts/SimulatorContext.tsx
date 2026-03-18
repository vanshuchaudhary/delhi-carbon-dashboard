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
  score: number;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [transportWeight, setTransportWeight] = useState(1); // 1 = 100% emission, 0 = 0%
  const [industrialWeight, setIndustrialWeight] = useState(1);
  const [penalty, setPenalty] = useState(0);
  const [isDanger, setIsDanger] = useState(false);
  const [currentZone, setCurrentZone] = useState<string | null>(null);
  const [avoidPolygons, setAvoidPolygons] = useState<any>(null);
  const [demoRouteTrigger, setDemoRouteTrigger] = useState(false);

  // Derive "City Health Score" based on interventions and penalties
  const baseScore = 45;
  const tImproves = (1 - transportWeight) * 25; // max +25
  const iImproves = (1 - industrialWeight) * 28; // max +28
  const score = Math.max(0, Math.min(Math.round(baseScore + tImproves + iImproves - penalty), 98));

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
      score
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
