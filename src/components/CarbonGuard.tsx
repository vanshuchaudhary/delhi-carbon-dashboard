'use client';

import { useEffect, useRef, useState } from 'react';
import * as turf from '@turf/turf';
import { useSimulator } from '@/contexts/SimulatorContext';
import { toast } from 'sonner';
import { AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CarbonGuardProps {
  wardsData: any;
  ecoRoute: any;
  map: React.RefObject<maplibregl.Map | null>;
}

export default function CarbonGuard({ wardsData, ecoRoute, map }: CarbonGuardProps) {
  const { penalty, setPenalty, setCurrentZone } = useSimulator();
  const criticalEntryTime = useRef<number | null>(null);
  const alertTriggered = useRef<boolean>(false);
  const currentWardRef = useRef<string | null>(null);

  useEffect(() => {
    const checkSafety = () => {
      if (!wardsData || !map.current) return;

      const center = map.current.getCenter();
      const point = turf.point([center.lng, center.lat]);

      // 1. Identify "Critical" Wards (co2_level > 800)
      const criticalWards = wardsData.features.filter(
        (f: any) => f.properties.co2_level > 800
      );

      // 2. Point-in-polygon check for center
      let currentWardName = null;
      let isCenterInCritical = false;
      
      for (const feature of wardsData.features) {
        if (turf.booleanPointInPolygon(point, feature)) {
          currentWardName = feature.properties.name;
          if (feature.properties.co2_level > 800) {
            isCenterInCritical = true;
          }
          break;
        }
      }

      setCurrentZone(currentWardName);
      currentWardRef.current = currentWardName;

      // Track time in critical zone
      if (isCenterInCritical) {
        if (!criticalEntryTime.current) {
          criticalEntryTime.current = Date.now();
          alertTriggered.current = false;
        }
      } else {
        criticalEntryTime.current = null;
        alertTriggered.current = false;
      }

      // 3. Perform Intersection Check for ecoRoute
      let intersectionFound = false;
      if (ecoRoute) {
        const routeLine = ecoRoute.type === 'FeatureCollection' ? ecoRoute.features[0] : ecoRoute;
        for (const ward of criticalWards) {
          if (!ward.geometry) continue;
          try {
            const intersection = turf.lineIntersect(routeLine, ward as any);
            if (intersection.features.length > 0) {
              intersectionFound = true;
              break;
            }
          } catch (e) {}
        }
      }

      // 4. Update Penalty and Toast
      if (intersectionFound) {
        if (penalty === 0) {
          setPenalty(10);
          toast.error("SafeZoneAlert: Critical Emission Intersection", {
            description: "Your planned route passes through a critical emission ward. Health score reduced by 10 points.",
            icon: <AlertTriangle className="w-5 h-5 text-rose-500" />
          });
        }
      } else {
        if (penalty > 0) {
          setPenalty(0);
          toast.success("Carbon Guard: Green Corridor Detected", {
            description: "Your route avoids all critical emission zones. Health score penalty removed.",
            icon: <ShieldCheck className="w-5 h-5 text-emerald-500" />
          });
        }
      }
    };

    // 5. Duration Tracker Interval
    const durationInterval = setInterval(async () => {
      if (criticalEntryTime.current && !alertTriggered.current) {
        const elapsedSeconds = (Date.now() - criticalEntryTime.current) / 1000;
        
        if (elapsedSeconds >= 120) { // 2 Minutes
          alertTriggered.current = true;
          
          toast.warning("Quantum Sentinel: Exposure Warning", {
             description: `You have been in ${currentWardRef.current || 'a critical zone'} for over 2 minutes. Triggering multi-channel alerts...`,
             icon: <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
          });

          // Trigger Supabase Edge Function
          try {
             const { data: { user } } = await supabase.auth.getUser();
             if (user) {
                await supabase.functions.invoke('sendSentinelAlert', {
                   body: { 
                      userId: user.id, 
                      zone: currentWardRef.current || "Unknown Zone", 
                      co2: 850 
                   }
                });
             }
          } catch (e) {
             console.error("Sentinel Alert Function failed:", e);
          }
        }
      }
    }, 5000);

    const currentMap = map.current;
    if (currentMap) {
      currentMap.on('moveend', checkSafety);
      checkSafety(); // Initial check
    }

    return () => {
      if (currentMap) {
        currentMap.off('moveend', checkSafety);
      }
      clearInterval(durationInterval);
    };
  }, [wardsData, ecoRoute, penalty, setPenalty, setCurrentZone, map]);

  return null;
}

