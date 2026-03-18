/**
 * Delhi Carbon Sentinel: Carbon Calculation Service
 * 2026 Delhi-specific factors (g/km)
 */

export const EMISSION_FACTORS = {
  PETROL_CAR: 170,
  DIESEL_SUV: 210,
  EV: 50,
  DELHI_METRO: 15,
  WALKING: 0,
} as const;

/**
 * Tree Sequestration Constants
 * 1 mature tree absorbs ~22kg of CO2 per year (~60g per day per user request).
 */
export const TREE_DAILY_ABSORPTION_G = 60;
export const TREE_YEARLY_ABSORPTION_KG = 22;

export type TransportMode = keyof typeof EMISSION_FACTORS;

/**
 * Calculates total emissions in grams and kilograms
 * Includes a 1.5x 'Traffic Delay' factor for heavy traffic
 */
export function calculateEmissions(distanceKm: number, mode: TransportMode, isHeavyTraffic: boolean = false) {
  const factor = EMISSION_FACTORS[mode];
  const trafficMultiplier = isHeavyTraffic ? 1.5 : 1;
  const grams = distanceKm * factor * trafficMultiplier;
  return {
    grams,
    kg: grams / 1000
  };
}

/**
 * Calculates carbon reduced vs Metro
 */
export function calculateSavings(distanceKm: number, currentMode: TransportMode) {
  const current = EMISSION_FACTORS[currentMode];
  const metro = EMISSION_FACTORS.DELHI_METRO;
  
  if (currentMode === 'DELHI_METRO' || currentMode === 'WALKING') return { savedGrams: 0, savedKg: 0, treeDays: 0 };
  
  const savedGrams = (current - metro) * distanceKm;
  const treeDays = savedGrams / TREE_DAILY_ABSORPTION_G;
  
  return {
    savedGrams,
    savedKg: savedGrams / 1000,
    treeDays
  };
}
