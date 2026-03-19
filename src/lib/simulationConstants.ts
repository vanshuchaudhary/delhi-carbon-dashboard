/**
 * Quantum Sentinel - Digital Twin Simulation Constants
 * These constants drive the specialized sector-based weighting and 
 * high-fidelity carbon calculations.
 */

export type SectorType = 'Industry' | 'Transport' | 'Residential' | 'Power' | 'Waste' | 'Unknown';

export interface ImpactWeights {
  transport: number;
  industrial: number;
}

/**
 * IMPACT_MATRIX
 * Defines how much each policy slider affects a specific ward based on its primary sector.
 * Values represent the 'Weight' (W) in the formula: E_new = E_base * (1 - sum(S * W))
 */
export const IMPACT_MATRIX: Record<SectorType, ImpactWeights> = {
  Industry: {
    transport: 0.15,
    industrial: 0.85, 
  },
  Transport: {
    transport: 0.85,
    industrial: 0.15,
  },
  Power: {
    transport: 0.3,
    industrial: 0.7,
  },
  Residential: {
    transport: 0.5,
    industrial: 0.5,
  },
  Waste: {
    transport: 0.2,
    industrial: 0.8,
  },
  Unknown: {
    transport: 0.5,
    industrial: 0.5,
  },
};

/**
 * VEHICLE_EMISSION_FACTORS
 * CO2 grams per kilometer (g/km) based on BS-Norms and Fuel Types.
 */
export const VEHICLE_FACTORS = {
  CAR: {
    PETROL: {
      BS3: 210,
      BS4: 175,
      BS6: 145,
    },
    DIESEL: {
      BS3: 250,
      BS4: 200,
      BS6: 160,
    },
    EV: {
      BS3: 0,
      BS4: 0,
      BS6: 0,
    },
  },
  SUV: {
    PETROL: {
      BS3: 280,
      BS4: 240,
      BS6: 210,
    },
    DIESEL: {
      BS3: 320,
      BS4: 270,
      BS6: 230,
    },
    EV: {
      BS3: 0,
      BS4: 0,
      BS6: 0,
    },
  },
  TWO_WHEELER: {
    PETROL: {
      BS3: 80,
      BS4: 65,
      BS6: 45,
    },
    DIESEL: {
      BS3: 100, // Rare, but for completeness
      BS4: 85,
      BS6: 70,
    },
    EV: {
      BS3: 0,
      BS4: 0,
      BS6: 0,
    },
  },
};

export const METRO_EMISSION_FACTOR = 15; // g/km per passenger (approx)
export const TREE_DAILY_ABSORPTION_G = 59.7; // grams/day
