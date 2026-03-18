/**
 * Delhi Carbon Sentinel: OpenRouteService (ORS) Integration
 * Eliminates Mapbox Directions costs using free ORS APIs.
 */

const ORS_API_KEY = process.env.NEXT_PUBLIC_ORS_API_KEY || '';

export type ORSProfile = 'driving-car' | 'cycling-regular' | 'foot-walking';

export interface ORSResult {
  distance: number; // in meters
  duration: number; // in seconds
  geometry: any;    // GeoJSON LineString
}

/**
 * Fetches GeoJSON route from OpenRouteService
 */
export async function getORSRoute(
  start: [number, number], 
  end: [number, number], 
  profile: ORSProfile = 'driving-car'
): Promise<ORSResult | null> {
  if (!ORS_API_KEY) {
    console.error('ORS API Key is missing. Please set NEXT_PUBLIC_ORS_API_KEY.');
    return null;
  }

  const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ORS_API_KEY
      },
      body: JSON.stringify({
        coordinates: [start, end],
        preference: 'recommended', // eco-friendly default
        attributes: ['percentage'],
        instructions: false
      })
    });

    if (!response.ok) {
      throw new Error(`ORS API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.features && data.features[0]) {
      const feature = data.features[0];
      return {
        distance: feature.properties.summary.distance,
        duration: feature.properties.summary.duration,
        geometry: feature.geometry
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching ORS route:', error);
    return null;
  }
}

/**
 * Fetches location suggestions from ORS Geocoding (Pelias)
 */
export async function getORSGeocoding(query: string): Promise<any[]> {
  if (!ORS_API_KEY || query.length < 3) return [];

  const url = `https://api.openrouteservice.org/geocode/autocomplete?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&boundary.rect.min_lon=76.8&boundary.rect.min_lat=28.4&boundary.rect.max_lon=77.4&boundary.rect.max_lat=28.8&limit=5`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('ORS Geocoding error');
    const data = await response.json();
    return data.features || [];
  } catch (error) {
    console.error('ORS search error:', error);
    return [];
  }
}
