import { supabase } from '@/lib/supabase';

// 1. Define Actions and Credits
export const ACTION_CREDITS = {
  'Policy Simulation': 50,
  'Ward Review': 100,
  'Data Verification': 200,
} as const;

export type GamificationAction = keyof typeof ACTION_CREDITS;

// 2. Tier Logic Thresholds
export function getTier(credits: number): string {
  if (credits <= 500) return 'Seedling';
  if (credits <= 1500) return 'Tree';
  return 'Forest Guardian';
}

export function getNextTierThreshold(credits: number): number | null {
  if (credits <= 500) return 501;
  if (credits <= 1500) return 1501;
  return null; // Max tier reached
}

// 3. Optional utility to log actions
export async function awardActionCredits(userId: string, actionType: GamificationAction) {
  const creditsToAward = ACTION_CREDITS[actionType];
  
  // Try to fetch current profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('co2_credits')
    .eq('id', userId)
    .single();

  const currentCredits = profile?.co2_credits || 0;
  const newCredits = currentCredits + creditsToAward;
  const newTier = getTier(newCredits);

  // Update profile with new credits and tier
  await supabase
    .from('profiles')
    .update({ 
      co2_credits: newCredits,
      tier: newTier
    })
    .eq('id', userId);
}
