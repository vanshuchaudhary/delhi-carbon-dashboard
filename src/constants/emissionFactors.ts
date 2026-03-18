/**
 * 2026 Delhi-specific emission factors in grams of CO2 per kilometer (g/km).
 */
export const EMISSION_FACTORS = {
  PETROL_CAR: 170,
  DIESEL_SUV: 210,
  EV_GRID: 50,
  DELHI_METRO: 15,
  ELECTRIC_BUS: 25,
  WALKING_CYCLING: 0,
} as const;

/**
 * Converts CO2 savings (in grams) into 'Tree-Growth Days'.
 * Assumes a mature tree absorbs ~21kg of CO2 per year.
 * 21kg/year = 21,000g / 365 days ≈ 57.53g per day.
 * 
 * @param gramsSaved - The amount of CO2 saved in grams.
 * @returns The equivalent number of days a single tree would take to absorb that amount.
 */
export function calculateTreeGrowthDays(gramsSaved: number): number {
  const gramsPerDayPerTree = 21000 / 365;
  return gramsSaved / gramsPerDayPerTree;
}

/**
 * Logic for converting CO2 savings (in kg) to tree count per year.
 * (Consistent with previous request: 1kg CO2 saved = 0.05 trees grown for a year)
 * 1 / 21 ≈ 0.0476
 */
export function calculateTreesPerYear(kgSaved: number): number {
  return kgSaved * 0.05;
}
