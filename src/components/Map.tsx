'use client';

import { useEffect, useRef, useState } from 'react';
import { getMapData, getWardHistory, getMetroData, getTrafficData, getEcoRoute, type FeatureCollection } from '@/lib/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSimulator } from '@/contexts/SimulatorContext';
import { toast, Toaster } from 'sonner';
import * as turf from '@turf/turf';
import { usePathname, useRouter } from 'next/navigation';
import { SlidersHorizontal } from 'lucide-react';
import CarbonGuard from './CarbonGuard';
import WardReviewForm from './WardReviewForm';
import SentinelTooltip from './SentinelTooltip';
import { Info } from 'lucide-react';
import { IMPACT_MATRIX, SectorType } from '@/lib/simulationConstants';

export default function Map() {
  const router = useRouter(); 
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const popup = useRef<maplibregl.Popup | null>(null);

  const {
    transportWeight, industrialWeight, score,
    isDanger, setIsDanger, currentZone, setCurrentZone,
    avoidPolygons, setAvoidPolygons,
    demoRouteTrigger, setDemoRouteTrigger,
    activeSector, setActiveSector,
    activeWard, setActiveWard,
    getReport, triggerAutoSimulation
  } = useSimulator();

  const [userLocation, setUserLocation] = useState<[number, number]>([77.2090, 28.6139]);
  const [wardsData, setWardsData] = useState<FeatureCollection | null>(null);
  const [ecoRoute, setEcoRoute] = useState<any>(null);

  const [selectedWard, setSelectedWard] = useState<any>(null);
  const [wardHistory, setWardHistory] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [transportFilter, setTransportFilter] = useState<'All' | 'Metro Line' | 'Highway Traffic'>('All');
  const [showMetro, setShowMetro] = useState(true);
  const [showTraffic, setShowTraffic] = useState(true);
  const [filteredWard, setFilteredWard] = useState<string | null>(null);
  const [nudgeLine, setNudgeLine] = useState<string | null>(null);
  const [showAirIndexInfo, setShowAirIndexInfo] = useState(false);

  // Listen to activeSector for Click-to-Focus
  useEffect(() => {
    if (activeSector && map.current) {
      let target: [number, number] | null = null;
      let mockWardInfo: any = null;

      if (activeSector === 'Industry') {
        target = [77.08, 28.80]; // Bawana cluster
        mockWardInfo = {
          id: 'bawana_1',
          name: 'Bawana Manufacturing Cluster',
          sector: 'Industry',
          simulatedCO2: 850,
          subBreakdown: [
            { name: 'Bawana Industrial Area', value: '45%' },
            { name: 'Okhla Phase 1', value: '35%' },
            { name: 'Naraina Industrial', value: '20%' }
          ]
        };
      } else if (activeSector === 'Transport') {
        target = [77.22, 28.61]; // New Delhi / CP area
        mockWardInfo = {
          id: 'transport_1',
          name: 'Central Transport Hub',
          sector: 'Transport',
          simulatedCO2: 650,
          isHeavyTraffic: true,
          subBreakdown: [
            { name: 'Outer Ring Road', value: '40%' },
            { name: 'Kashmere Gate ISBT', value: '25%' },
            { name: 'NH-48 Traffic', value: '35%' }
          ]
        };
      } else if (activeSector === 'Power') {
        target = [77.30, 28.50]; // Badarpur
        mockWardInfo = {
          id: 'power_1',
          name: 'Badarpur Node',
          sector: 'Power',
          simulatedCO2: 720,
          subBreakdown: [
            { name: 'Badarpur Substation', value: '50%' },
            { name: 'Dadri Feeder', value: '30%' },
            { name: 'Local Diesel Gensets', value: '20%' }
          ]
        };
      }

      if (target && mockWardInfo) {
        map.current.flyTo({
          center: target,
          zoom: 13,
          pitch: 50,
          duration: 2000
        });
        setSelectedWard(mockWardInfo);
        setWardHistory([]); // clear history for mock
        setIsDrawerOpen(true);
      }
    }
  }, [activeSector]);

  const [lng] = useState(77.2090);
  const [lat] = useState(28.6139);
  const [zoom] = useState(10.5);
  const [pitch] = useState(65);
  const [bearing] = useState(-20);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://tiles.openfreemap.org/styles/dark',
        center: [lng, lat],
        zoom: zoom,
        pitch: pitch,
        bearing: bearing,
        preserveDrawingBuffer: false
      } as any);

      // Add 3D buildings and custom layers on load
      map.current.on('style.load', () => {
        if (!map.current) return;

        // OpenFreeMap / OpenMapTiles building layer
        map.current.addLayer(
          {
            id: 'add-3d-buildings',
            source: 'openmaptiles',
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 15,
            paint: {
              'fill-extrusion-color': '#1f2937',
              'fill-extrusion-height': ['get', 'render_height'],
              'fill-extrusion-base': ['get', 'render_min_height'],
              'fill-extrusion-opacity': 0.6
            }
          }
        );

        // Fetch Ward Data
        getMapData().then((data: FeatureCollection) => {
          if (!map.current || !map.current.getStyle()) return;

          map.current.addSource('wards', {
            type: 'geojson',
            data: applySimulationAndFilter(data, transportWeight, industrialWeight, transportFilter, activeSector) as any
          });

          // Add Ward Heatmap Polygon Layer - 3D EXTRUSION
          map.current.addLayer({
            id: 'wards-layer',
            type: 'fill-extrusion',
            source: 'wards',
            paint: {
              'fill-extrusion-color': [
                'interpolate',
                ['linear'],
                ['get', 'simulatedCO2'],
                150, '#10b981', // Emerald (Healthy)
                300, '#facc15', // Yellow (Moderate)
                450, '#f97316', // Orange (Poor)
                600, '#ef4444'  // Red (Severe)
              ],
              'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['get', 'simulatedCO2'],
            0, 0,
            1200, 300,
            2400, 800
          ],
    'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.85
            }
          });

          // Persistent Location Names Layer
          map.current.addLayer({
            id: 'ward-labels',
            type: 'symbol',
            source: 'wards',
            layout: {
              'text-field': ['get', 'name'],
              'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
              'text-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 10,
                15, 18
              ],
              'text-variable-anchor': ['top', 'bottom', 'left', 'right'],
              'text-padding': 5
            },
            paint: {
              'text-color': '#ffffff',
              'text-halo-color': '#000000',
              'text-halo-width': 2
            }
          });

          // Add Heatmap Layer
          map.current.addLayer({
            id: 'delhi-heatmap',
            type: 'heatmap',
            source: 'wards',
            maxzoom: 15,
            paint: {
              'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'simulatedCO2'],
                0, 0,
                600, 1
              ],
              'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1,
                15, 3
              ],
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(16, 185, 129, 0)',
                0.2, 'rgb(16, 185, 129)',
                0.4, 'rgb(250, 204, 21)',
                0.6, 'rgb(244, 63, 94)',
                1, 'rgb(159, 18, 57)'
              ],
              'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 2,
                15, 20
              ],
              'heatmap-opacity': 0.6
            }
          });

          // Fetch Metro Network
          getMetroData().then(({ stations, lines }) => {
            if (!map.current) return;

            // Metro Lines Source & Layer
            map.current.addSource('metro-lines', { type: 'geojson', data: lines as any });
            map.current.addLayer({
              id: 'metro-lines-layer',
              type: 'line',
              source: 'metro-lines',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
                'visibility': showMetro ? 'visible' : 'none'
              },
              paint: {
                'line-color': ['get', 'color'],
                'line-width': 4,
                'line-opacity': 0.7
              }
            });

            // Glow Effect for Lines
            map.current.addLayer({
              id: 'metro-lines-glow',
              type: 'line',
              source: 'metro-lines',
              layout: { 'line-join': 'round', 'line-cap': 'round', 'visibility': showMetro ? 'visible' : 'none' },
              paint: { 'line-color': ['get', 'color'], 'line-width': 10, 'line-opacity': 0.1, 'line-blur': 5 }
            }, 'metro-lines-layer');

            // Metro Stations Source & Layer
            map.current.addSource('metro-stations', { type: 'geojson', data: stations as any });
            map.current.addLayer({
              id: 'metro-stations-layer',
              type: 'circle',
              source: 'metro-stations',
              layout: { 'visibility': showMetro ? 'visible' : 'none' },
              paint: {
                'circle-radius': 6,
                'circle-color': '#ffffff',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#1e293b'
              }
            });
          });

          // Fetch Traffic Data
          getTrafficData().then((trafficData: any) => {
            if (!map.current) return;

            // Nudge Check: If high traffic, nudge the nearest line (for now we nudge Blue Line if any high traffic)
            const hasHighTraffic = trafficData.features.some((f: any) => f.properties.congestion > 0.8);
            if (hasHighTraffic) setNudgeLine('Blue Line');

            map.current.addSource('traffic', { type: 'geojson', data: trafficData as any });

            // Highway Traffic Layer (Neon Glow)
            map.current.addLayer({
              id: 'traffic-glow',
              type: 'line',
              source: 'traffic',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
                'visibility': showTraffic ? 'visible' : 'none'
              },
              paint: {
                'line-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'congestion'],
                  0.3, '#10b981',
                  0.6, '#facc15',
                  0.9, '#f43f5e'
                ],
                'line-width': 12,
                'line-opacity': 0.15,
                'line-blur': 8
              }
            });

            map.current.addLayer({
              id: 'traffic-layer',
              type: 'line',
              source: 'traffic',
              layout: {
                'line-join': 'round',
                'line-cap': 'round',
                'visibility': showTraffic ? 'visible' : 'none'
              },
              paint: {
                'line-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'congestion'],
                  0.3, '#10b981',
                  0.6, '#facc15',
                  0.9, '#f43f5e'
                ],
                'line-width': 4,
                'line-opacity': 0.8
              }
            });

            // Traffic Labels (Emissions)
            map.current.addLayer({
              id: 'traffic-labels',
              type: 'symbol',
              source: 'traffic',
              filter: ['>=', ['get', 'congestion'], 0.8], // Only show on red segments
              layout: {
                'text-field': ['concat', ['to-string', ['round', ['*', ['get', 'base_emission'], ['get', 'congestion']]]], 'kg/hr'],
                'text-font': ['Open Sans Bold'],
                'text-size': 10,
                'text-offset': [0, 1.5],
                'visibility': showTraffic ? 'visible' : 'none'
              },
              paint: {
                'text-color': '#f43f5e',
                'text-halo-color': '#000000',
                'text-halo-width': 1
              }
            });

            // Breath Animation for Critical Zones — GPU-hinted, cancelable
            let criticalStep = 0;
            let criticalRafId: number;
            const animateCritical = () => {
              if (!map.current || !map.current.getLayer('wards-layer')) return;
              const opacity = 0.3 + Math.sin(criticalStep) * 0.3;
              map.current.setPaintProperty('wards-layer', 'fill-extrusion-opacity', [
                'case',
                ['>=', ['get', 'simulatedCO2'], 600], opacity + 0.3,
                0.85
              ]);
              criticalStep += 0.05;
              criticalRafId = requestAnimationFrame(animateCritical);
            };
            criticalRafId = requestAnimationFrame(animateCritical);
            // Store cancel handle on map instance for cleanup
            (map.current as any).__criticalRafId = criticalRafId;
            (map.current as any).__cancelCritical = () => cancelAnimationFrame(criticalRafId);
          });

          // Add Click Handler for Wards
          map.current.on('click', 'wards-layer', (e) => {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const wardName = feature.properties?.name;
              // Filter logic
              setFilteredWard(wardName);
              setActiveWard(wardName || null);
              if (feature.properties?.sector) {
                 setActiveSector(feature.properties.sector);
              }

              if (map.current) {
                map.current.setFilter('delhi-heatmap', ['==', ['get', 'name'], wardName]);

                // Filter traffic to show only roads within this ward
                map.current.setFilter('traffic-layer', ['==', ['get', 'ward_name'], wardName]);
                map.current.setFilter('traffic-labels', ['==', ['get', 'ward_name'], wardName]);

                // Fly to ward with premium easing
                map.current.flyTo({
                  center: [e.lngLat.lng, e.lngLat.lat],
                  zoom: 14,
                  duration: 2500,
                  pitch: 45,
                  essential: true,
                  curve: 1.2,
                  speed: 0.8
                });
              }

               setSelectedWard(feature.properties);
               setActiveWard(feature.properties.name);
               setActiveSector(feature.properties.sector);
               getWardHistory(feature.properties?.id).then(hist => {
                setWardHistory(hist);
                setIsDrawerOpen(true);
              }).catch(err => console.warn('Ward history unavailable:', err));
            }
          });

          // Add Click Handler for Metro
          map.current.on('click', 'metro-stations-layer', (e) => {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              setSelectedWard({
                ...feature.properties,
                sector: 'Metro Station',
                co2_level: feature.properties.co2_level
              });
              getWardHistory(feature.properties.id).then(hist => {
                setWardHistory(hist);
                setIsDrawerOpen(true);
              }).catch(err => console.warn('Metro history unavailable:', err));
            }
          });

          // Hover Popup for Metro
          map.current.on('mouseenter', 'metro-stations-layer', (e) => {
            if (map.current && e.features && e.features.length > 0) {
              map.current.getCanvas().style.cursor = 'pointer';
              const feature = e.features[0];
              const coordinates = (feature.geometry as any).coordinates.slice();
              const content = `
                  <div class="glass-panel p-3 border border-slate-700/50 rounded-xl bg-slate-900/90 text-slate-100 min-w-[200px] shadow-2xl">
                    <div class="flex items-center gap-2 mb-2">
                      <div class="w-6 h-6 flex items-center justify-center bg-rose-500 rounded-full text-[10px] font-bold">M</div>
                      <div class="text-sm font-bold text-slate-100 uppercase tracking-tight">${feature.properties.name}</div>
                    </div>
                    <div class="space-y-2">
                       <div class="flex justify-between items-center text-[10px]">
                          <span class="text-slate-400 font-medium">Ops Emission</span>
                          <span class="text-rose-400 font-bold font-mono">${feature.properties.co2_level} kg/hr</span>
                       </div>
                       <div class="flex justify-between items-center text-[10px] border-t border-slate-800 pt-2">
                          <span class="text-emerald-400 font-medium">Net Carbon Saved</span>
                          <span class="text-emerald-400 font-bold font-mono">${feature.properties.saved_co2} kg/day</span>
                       </div>
                    </div>
                  </div>
                `;

              popup.current = new maplibregl.Popup({ closeButton: false, offset: 10 })
                .setLngLat(coordinates)
                .setHTML(content)
                .addTo(map.current);
            }
          });

          map.current.on('mouseleave', 'metro-stations-layer', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
            if (popup.current) {
              popup.current.remove();
              popup.current = null;
            }
          });

          // Add Click Handler for Traffic
          map.current.on('click', 'traffic-layer', (e) => {
            if (e.features && e.features.length > 0) {
              const feature = e.features[0];
              const props = feature.properties;
              const trafficDelayFactor = props.congestion > 0.8 ? 1.5 : 1;
              setSelectedWard({
                id: props.id,
                name: props.name,
                sector: 'Transport (Road)',
                co2_level: Math.round(props.base_emission * props.congestion * trafficDelayFactor),
                congestion: props.congestion,
                isHeavyTraffic: props.congestion > 0.8
              });
              getWardHistory(props.id).then(hist => {
                setWardHistory(hist);
                setIsDrawerOpen(true);
              }).catch(err => console.warn('Traffic history unavailable:', err));
            }
          });

          // Add Eco Route Source & Layer
          map.current.addSource('eco-route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.current.addLayer({
            id: 'eco-route-layer',
            type: 'line',
            source: 'eco-route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': '#00ff41', // Neon Green
              'line-width': 6,
              'line-opacity': 0.8
            }
          });

          // Add Background Reset Handler
          map.current.on('click', (e) => {
            // Check if we clicked interactive elements
            const features = map.current?.queryRenderedFeatures(e.point, { layers: ['wards-layer', 'metro-stations-layer', 'traffic-layer'] });
            if (!features || features.length === 0) {
              setFilteredWard(null);
              setSelectedWard(null);
              setIsDrawerOpen(false);
              setActiveWard(null);
              setActiveSector(null);
              if (map.current) {
                map.current.setFilter('delhi-heatmap', null);
                map.current.setFilter('traffic-layer', null);
                map.current.setFilter('traffic-labels', null);
                map.current.flyTo({
                  center: [lng, lat],
                  zoom: 10.5,
                  pitch: 65,
                  bearing: -20,
                  duration: 1500
                });
              }
            }
          });

          // Change cursor on hover
          map.current.on('mouseenter', 'wards-layer', () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer';
          });
          map.current.on('mouseleave', 'wards-layer', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
          });
        });
      });
    } catch (error) {
      console.error("MapLibre initialization error:", error);
    }

    return () => {
      // Cancel the critical-zones animation loop before unmounting
      if ((map.current as any)?.__cancelCritical) {
        (map.current as any).__cancelCritical();
      }
      map.current?.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lng, lat, zoom, pitch, bearing]);

  // Listen to Layer Visibility changes
  useEffect(() => {
    if (map.current && map.current.getStyle()) {
      const visibility = showMetro ? 'visible' : 'none';
      if (map.current.getLayer('metro-stations-layer')) map.current.setLayoutProperty('metro-stations-layer', 'visibility', visibility);
      if (map.current.getLayer('metro-lines-layer')) map.current.setLayoutProperty('metro-lines-layer', 'visibility', visibility);
      if (map.current.getLayer('metro-lines-glow')) map.current.setLayoutProperty('metro-lines-glow', 'visibility', visibility);

      const trafficVisibility = showTraffic ? 'visible' : 'none';
      if (map.current.getLayer('traffic-layer')) map.current.setLayoutProperty('traffic-layer', 'visibility', trafficVisibility);
      if (map.current.getLayer('traffic-labels')) map.current.setLayoutProperty('traffic-labels', 'visibility', trafficVisibility);
    }
  }, [showMetro, showTraffic]);

  // Nudge Pulsing Animation
  useEffect(() => {
    if (nudgeLine && map.current && map.current.getLayer('metro-lines-layer')) {
      let step = 0;
      const interval = setInterval(() => {
        if (!map.current || !map.current.getLayer('metro-lines-layer')) return;
        const opacity = 0.5 + Math.sin(step) * 0.4;
        map.current.setPaintProperty('metro-lines-layer', 'line-opacity',
          ['case', ['==', ['get', 'name'], nudgeLine], opacity, 0.7]
        );
        step += 0.2;
      }, 100);
      return () => clearInterval(interval);
    }
  }, [nudgeLine]);

  // Notification permission is requested in AuthSentinel after successful login

  // Geofencing Logic
  useEffect(() => {
    if (!wardsData || !userLocation) return;

    const point = turf.point(userLocation);
    let foundZone = null;

    for (const feature of wardsData.features) {
      if (feature.geometry && turf.booleanPointInPolygon(point, feature.geometry as any)) {
        foundZone = feature;
        break;
      }
    }

    if (foundZone) {
      setCurrentZone(foundZone.properties.name);
      if (foundZone.properties.co2_level > 600) {
        if (!isDanger) {
          setIsDanger(true);
          triggerAlert(foundZone.properties.name);
        }
      } else {
        setIsDanger(false);
      }
    } else {
      setCurrentZone(null);
      setIsDanger(false);
    }
  }, [userLocation, wardsData]);

  const triggerAlert = (zoneName: string) => {
    // Browser Notification
    if (Notification.permission === 'granted') {
      const notification = new Notification('⚠️ High Emission Alert: ' + zoneName, {
        body: 'You have entered a high pollution area. Click to see a safer, 15% cleaner route.',
        icon: '/logo.png'
      });
      notification.onclick = () => {
        handleSeeSaferRoute();
        window.focus();
      };
    }

    // In-App Toast
    toast.error(`⚠️ High Emission Alert: ${zoneName}`, {
      description: 'You have entered a high pollution area. Click to see a safer route.',
      action: {
        label: 'See safer route',
        onClick: () => handleSeeSaferRoute()
      },
      duration: 10000
    });
  };


  // Demo Mode Handler
  useEffect(() => {
    if (demoRouteTrigger) {
      const cp: [number, number] = [77.2197, 28.6327]; // Connaught Place
      const hk: [number, number] = [77.2062, 28.5492]; // Hauz Khas

      setUserLocation(cp);
      handleSeeSaferRoute(hk);
      setDemoRouteTrigger(false);
    }
  }, [demoRouteTrigger]);

  const handleSeeSaferRoute = async (targetOverride?: [number, number]) => {
    try {
      const target: [number, number] = targetOverride || [77.03, 28.56]; // Dwarka (Safe) default
      const route = await getEcoRoute(userLocation, target, true);
      setEcoRoute(route);
      setAvoidPolygons(true);

      if (map.current && map.current.getSource('eco-route')) {
        (map.current.getSource('eco-route') as maplibregl.GeoJSONSource).setData(route);

        // Fly to see the route with premium transition
        const center: [number, number] = [(userLocation[0] + target[0]) / 2, (userLocation[1] + target[1]) / 2];
        map.current.flyTo({
          center,
          zoom: 12.5,
          pitch: 45,
          duration: 3000,
          essential: true
        });
      }
    } catch (err) {
      console.error('Eco route error:', err);
      toast.error('Could not calculate eco route. Using fallback path.');
    }
  };

  // Eco Route Pulsing Animation
  useEffect(() => {
    if (ecoRoute && map.current && map.current.getLayer('eco-route-layer')) {
      let step = 0;
      const interval = setInterval(() => {
        if (!map.current || !map.current.getLayer('eco-route-layer')) return;
        const opacity = 0.4 + Math.sin(step) * 0.4;
        map.current.setPaintProperty('eco-route-layer', 'line-opacity', opacity);
        step += 0.15;
      }, 50);
      return () => clearInterval(interval);
    }
  }, [ecoRoute]);

  // User Simulation: Move from Connaught Place to Okhla (Danger Zone)
  useEffect(() => {
    let step = 0;
    const path = [
      [77.21, 28.63], // Near Connaught Place (Moderate)
      [77.22, 28.61],
      [77.24, 28.59],
      [77.26, 28.56],
      [77.28, 28.54]  // Okhla (High Emission)
    ];

    const interval = setInterval(() => {
      if (step < path.length) {
        setUserLocation(path[step] as [number, number]);
        step++;
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Listen to Simulator Context changes and re-apply data if Map and Data exist
  useEffect(() => {
    if (map.current && map.current.getSource('wards')) {
      getMapData().then((baseData) => {
        const simData = applySimulationAndFilter(baseData, transportWeight, industrialWeight, transportFilter, activeSector);
        setWardsData(simData);
        (map.current!.getSource('wards') as maplibregl.GeoJSONSource).setData(simData as any);
        
        if (selectedWard) {
          const updatedFeat = simData.features.find(f => f.properties.id === selectedWard.id);
          if (updatedFeat) {
            setSelectedWard(updatedFeat.properties);
          }
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transportWeight, industrialWeight, transportFilter, activeSector]);

  // Listen to Layer Visibility changes
  useEffect(() => {
    if (map.current && map.current.getStyle()) {
      if (map.current.getLayer('metro-layer')) {
        map.current.setLayoutProperty('metro-layer', 'visibility', showMetro ? 'visible' : 'none');
      }
      if (map.current.getLayer('traffic-layer')) {
        map.current.setLayoutProperty('traffic-layer', 'visibility', showTraffic ? 'visible' : 'none');
        if (map.current.getLayer('traffic-labels')) {
          map.current.setLayoutProperty('traffic-labels', 'visibility', showTraffic ? 'visible' : 'none');
        }
      }
    }
  }, [showMetro, showTraffic]);


  return (
    <div className="w-full h-full relative group rounded-2xl overflow-hidden glass-panel border border-slate-800/50 shadow-2xl">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full bg-slate-900" />

      {/* Digital Twin Overlays */}
      <div className="absolute inset-0 digital-grid opacity-30 pointer-events-none" />
      <div className="scanline-overlay pointer-events-none" />

      {/* Overlay Status Bar */}
      <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-md border border-slate-700 shadow-xl px-4 py-3 rounded-xl z-10 flex items-center gap-4">
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Location</span>
          <span className="text-sm text-slate-100 font-semibold">Delhi, India</span>
        </div>
        <div className="w-px h-8 bg-slate-700/50"></div>
        <div className="flex flex-col">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Coordinates</span>
          <span className="text-sm text-emerald-400 font-mono tracking-tighter">{lat.toFixed(4)}°, {lng.toFixed(4)}°</span>
        </div>
      </div>

      {/* Mode Toggle Overlay */}
      <div className="absolute top-6 right-6 flex flex-col items-end gap-2 z-20">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 shadow-xl p-1 rounded-xl flex gap-1">
          {(['All', 'Metro Line', 'Highway Traffic'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTransportFilter(mode)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all duration-300 ${transportFilter === mode
                  ? 'bg-emerald-500 text-slate-950 shadow-lg'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
            >
              {mode}
            </button>
          ))}
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 shadow-xl p-1 rounded-xl flex gap-1">
          <button
            onClick={() => setShowMetro(!showMetro)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${showMetro
                ? 'bg-rose-500 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
          >
            Metro Stations
          </button>
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${showTraffic
                ? 'bg-amber-500 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
              }`}
          >
            Live Traffic
          </button>
        </div>
      </div>

      {/* Global View Reset Button */}
      {filteredWard && (
        <button
          onClick={() => {
            setFilteredWard(null);
            if (map.current) {
              map.current.setFilter('delhi-heatmap', null);
              map.current.setFilter('traffic-layer', null);
              map.current.setFilter('traffic-labels', null);
              map.current.flyTo({
                center: [lng, lat],
                zoom: 10.5,
                pitch: 65,
                bearing: -20,
                duration: 1500
              });
            }
          }}
          className="absolute top-24 left-6 bg-slate-900/90 backdrop-blur-md border border-emerald-500/50 text-emerald-400 px-4 py-2 rounded-xl z-20 shadow-lg hover:bg-emerald-500 hover:text-slate-950 transition-all flex items-center gap-2 group"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider">Global View</span>
        </button>
      )}

      {/* Overlay legends */}
      <div className="absolute bottom-6 right-6 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-xl z-10 shadow-xl transition-opacity duration-300">
        <h4 className="text-slate-300 text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Emissions Heatmap
        </h4>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded shadow-sm bg-red-500"></div>
            <span className="text-xs text-white font-medium">Severe (&gt; 600)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded shadow-sm bg-orange-500"></div>
            <span className="text-xs text-white font-medium">Poor (450-600)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded shadow-sm bg-yellow-400"></div>
            <span className="text-xs text-white font-medium">Moderate (300-450)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded shadow-sm bg-emerald-500"></div>
            <span className="text-xs text-white font-medium">Healthy (&lt; 150)</span>
          </div>
        </div>
      </div>

      {/* Side Drawer for Details */}
      {isDrawerOpen && selectedWard && (
        <div className="absolute right-0 top-0 h-full w-[400px] bg-slate-950/95 backdrop-blur-xl border-l border-slate-800 z-30 animate-in slide-in-from-right duration-300 shadow-2xl p-8 overflow-y-auto custom-scrollbar">
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="mt-4">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2 block">Zone Insight</span>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">{selectedWard.name}</h2>
            <p className="text-slate-400 text-sm font-medium">{selectedWard.sector || 'Urban Connectivity Node'}</p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-inner">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Emission Level</span>
                <div className="text-2xl font-mono font-black text-white mt-1">{Math.round(selectedWard.simulatedCO2 || selectedWard.co2_level || 0)} <span className="text-xs">kg/hr</span></div>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-inner">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Air Index</span>
                  <SentinelTooltip 
                    isVisible={showAirIndexInfo} 
                    content={
                      <div className="space-y-2">
                        <p>Logic: We map <span className="text-emerald-400 font-bold">CO₂ emissions (kg/hr)</span> to a health-based index.</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] opacity-90">
                          <span className="text-emerald-400">0-150:</span> <span>Excellent</span>
                          <span className="text-yellow-400">151-300:</span> <span>Healthy</span>
                          <span className="text-orange-400">301-450:</span> <span>Moderate</span>
                          <span className="text-rose-400">451-600:</span> <span>Poor</span>
                          <span className="text-rose-600 font-bold">601+:</span> <span>Severe</span>
                        </div>
                      </div>
                    }
                  >
                    <button 
                      onMouseEnter={() => setShowAirIndexInfo(true)}
                      onMouseLeave={() => setShowAirIndexInfo(false)}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <Info className="w-3 h-3" />
                    </button>
                  </SentinelTooltip>
                </div>
                <div className="text-2xl font-mono font-black text-emerald-400 mt-1">
                  {(selectedWard.simulatedCO2 || selectedWard.co2_level || 0) >= 600 ? 'Severe' : 
                   (selectedWard.simulatedCO2 || selectedWard.co2_level || 0) >= 450 ? 'Poor' : 
                   (selectedWard.simulatedCO2 || selectedWard.co2_level || 0) >= 300 ? 'Moderate' : 'Healthy'}
                </div>
              </div>
            </div>

            {selectedWard.subBreakdown ? (
              <div className="mt-10">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Top Contributing Sources (<span className="text-emerald-400">{selectedWard.sector}</span>)</h4>
                <div className="space-y-3">
                  {selectedWard.subBreakdown.map((item: any, i: number) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center shadow-inner">
                       <span className="text-slate-200 text-sm font-bold flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                         {item.name}
                       </span>
                       <span className="text-emerald-400 font-bold font-mono text-lg">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-10 h-64">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest mb-4">Emissions Trend (24h)</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={wardHistory}>
                    <defs>
                      <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="time" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                    <ReferenceLine y={300} stroke="#475569" strokeDasharray="3 3" label={{ value: 'Safe Limit', position: 'right', fill: '#475569', fontSize: 10 }} />
                    <Area type="monotone" dataKey="co2" stroke="#f43f5e" fillOpacity={1} fill="url(#colorCo2)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="mt-12 pt-10 border-t border-slate-800/80">
              <WardReviewForm wardName={selectedWard.name} />
            </div>

            <div className="mt-12 bg-indigo-500/10 border border-indigo-500/20 p-5 rounded-2xl">
              <h4 className="text-indigo-400 text-sm font-bold uppercase mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                AI Safety Report
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {selectedWard.isHeavyTraffic
                  ? `⚠️ Traffic Delay Alert: Congestion is currently increasing emissions by 1.5x in ${selectedWard.name}. Rerouting suggested.`
                  : getReport(selectedWard.name, selectedWard.sector || 'Residential')}
              </p>
              <button 
                onClick={() => {
                  triggerAutoSimulation();
                  setIsDrawerOpen(false);
                  toast.success(`Simulation Initiated: Optimizing ${selectedWard.name}`);
                }}
                className="mt-4 w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Simulate Policy for this Ward
              </button>
            </div>
          </div>
        </div>
      )}

      <CarbonGuard wardsData={wardsData} ecoRoute={ecoRoute} map={map} />
      <Toaster position="top-right" richColors closeButton theme="dark" />
    </div>
  );
}

function applySimulationAndFilter(data: FeatureCollection, tWeight: number, iWeight: number, filter: string, sector?: string | null): FeatureCollection {
  const newData = JSON.parse(JSON.stringify(data));
  
  const getWeights = (s: string) => {
    return IMPACT_MATRIX[s as SectorType] || IMPACT_MATRIX['Unknown'];
  };

    newData.features.forEach((f: any) => {
       const sectorWeights = getWeights(f.properties.sector);
       const transportEffort = (1 - tWeight);
       const industrialEffort = (1 - iWeight);
       
       const totalReduction = (transportEffort * sectorWeights.transport) + (industrialEffort * sectorWeights.industrial);
       const simCO2 = (f.properties.co2_level || 0) * (1 - totalReduction);
       
       f.properties.simulatedCO2 = Math.round(simCO2);
       f.properties.reduction = totalReduction;
    });

  if (filter !== 'All') {
    newData.features = newData.features.filter((f: any) => {
      if (f.properties.sector !== 'Transport') return false;
      return f.properties.transport_mode === filter;
    });
  }

  return newData;
}
