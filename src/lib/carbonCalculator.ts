import { VEHICLE_FACTORS, METRO_EMISSION_FACTOR, TREE_DAILY_ABSORPTION_G } from './simulationConstants';

export { TREE_DAILY_ABSORPTION_G };

export const EMISSION_FACTORS = {
  PETROL_BS3: 210,
  PETROL_BS4: 180,
  PETROL_BS6: 145,
  DIESEL_SUV_BS4: 250,
  DIESEL_SUV_BS6: 210,
  EV: 50,
  DELHI_METRO: METRO_EMISSION_FACTOR,
  WALKING: 0,
} as const;

export const DETAILED_FACTORS = VEHICLE_FACTORS;

export type VehicleCategory = keyof typeof DETAILED_FACTORS;
export type FuelType = 'PETROL' | 'DIESEL' | 'EV';
export type BSNorm = 'BS3' | 'BS4' | 'BS6';

export const TREE_YEARLY_ABSORPTION_KG = 21.8; // 59.7 * 365 / 1000

export type TransportMode = keyof typeof EMISSION_FACTORS;

/**
 * Calculates total emissions using detailed nested factors
 */
export function calculateDetailedEmissions(
  distanceKm: number, 
  category: VehicleCategory, 
  fuel: FuelType, 
  norm: BSNorm = 'BS6',
  isHeavyTraffic: boolean = false
) {
  let factor = 0;
  const catData = DETAILED_FACTORS[category] as any;
  
  if (fuel === 'EV') {
    factor = catData.EV || 50;
  } else {
    const fuelData = catData[fuel];
    factor = fuelData ? (fuelData[norm] || fuelData.BS6) : 200;
  }

  const trafficMultiplier = isHeavyTraffic ? 1.5 : 1;
  const grams = distanceKm * factor * trafficMultiplier;
  
  return {
    grams,
    kg: grams / 1000,
    factor
  };
}

/**
 * Calculates carbon reduced vs Metro
 */
export function calculateSavings(distanceKm: number, currentGrams: number) {
  const metroGrams = EMISSION_FACTORS.DELHI_METRO * distanceKm;
  const savedGrams = Math.max(0, currentGrams - metroGrams);
  const treeDays = savedGrams / TREE_DAILY_ABSORPTION_G;
  
  return {
    savedGrams,
    savedKg: savedGrams / 1000,
    treeDays
  };
}
