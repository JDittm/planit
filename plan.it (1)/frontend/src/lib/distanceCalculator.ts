// Distance calculation utility using Google Maps Distance Matrix API only
// No fallback logic - Google Maps API key is required for distance calculations

interface DistanceResult {
  distance: number; // in miles (round-trip)
  roundTripCost: number;
}

interface GoogleMapsDistanceMatrixResponse {
  rows?: Array<{
    elements?: Array<{
      status: string;
      distance?: {
        value: number; // in meters
        text: string;
      };
      duration?: {
        value: number; // in seconds
        text: string;
      };
    }>;
  }>;
  status: string;
  error_message?: string;
}

// Get Google Maps API key from localStorage
function getGoogleMapsApiKey(): string | null {
  try {
    const stored = localStorage.getItem('google-maps-api-key');
    if (stored && stored.trim() !== '') return stored.trim();
  } catch (error) {
    console.error('Error reading Google Maps API key from localStorage:', error);
  }
  return null;
}

// Calculate distance using Google Maps Distance Matrix API
async function calculateDistanceWithGoogleMaps(
  origin: string,
  destination: string
): Promise<number | null> {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    throw new Error('Google Maps API key is required. Please configure it in Travel Settings.');
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&units=imperial&mode=driving&key=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Maps API request failed with status: ${response.status}`);
    }

    const data: GoogleMapsDistanceMatrixResponse = await response.json();
    
    if (data.status !== 'OK') {
      const errorMessage = data.error_message || `API returned status: ${data.status}`;
      throw new Error(`Google Maps API error: ${errorMessage}`);
    }

    if (!data.rows || data.rows.length === 0 || !data.rows[0].elements || data.rows[0].elements.length === 0) {
      throw new Error('No distance data in Google Maps response');
    }

    const element = data.rows[0].elements[0];
    
    if (element.status !== 'OK') {
      throw new Error(`Route calculation failed: ${element.status}`);
    }

    if (!element.distance) {
      throw new Error('No distance data available for this route');
    }

    // Google Maps returns distance in meters, convert to miles
    const distanceInMeters = element.distance.value;
    const distanceInMiles = distanceInMeters / 1609.34;
    
    console.log(`Google Maps driving distance: ${distanceInMiles.toFixed(2)} miles (one-way)`);
    
    return distanceInMiles;
  } catch (error) {
    console.error('Error calculating distance with Google Maps:', error);
    throw error;
  }
}

// Main function to calculate distance and cost
// Uses ONLY Google Maps Distance Matrix API for accurate driving routes
// Returns round-trip distance (one-way * 2) and cost (round-trip * cost per mile)
export async function calculateDistanceAndCost(
  userAddress: string,
  venueAddress: string,
  costPerMile: number
): Promise<DistanceResult | null> {
  try {
    // Validate inputs
    if (!userAddress || !venueAddress) {
      throw new Error('Both user address and venue address are required');
    }

    if (costPerMile < 0) {
      throw new Error('Invalid cost per mile value');
    }

    // Calculate one-way distance using Google Maps Distance Matrix API
    const oneWayDistance = await calculateDistanceWithGoogleMaps(userAddress, venueAddress);
    
    if (oneWayDistance === null || isNaN(oneWayDistance) || oneWayDistance < 0) {
      throw new Error('Invalid distance calculation result');
    }
    
    // Double the one-way distance for round-trip
    const roundTripDistance = oneWayDistance * 2;
    // Multiply by cost per mile
    const roundTripCost = roundTripDistance * costPerMile;
    
    console.log(`Round-trip distance: ${roundTripDistance.toFixed(2)} miles, Cost: $${roundTripCost.toFixed(2)}`);
    
    return {
      distance: Math.round(roundTripDistance * 10) / 10, // Round to 1 decimal
      roundTripCost: Math.round(roundTripCost * 100) / 100 // Round to 2 decimals
    };
  } catch (error) {
    console.error('Distance calculation error:', error);
    throw error;
  }
}

// Function to save Google Maps API key to localStorage
export function saveGoogleMapsApiKey(apiKey: string): void {
  try {
    localStorage.setItem('google-maps-api-key', apiKey.trim());
  } catch (error) {
    console.error('Error saving Google Maps API key:', error);
    throw error;
  }
}

// Function to get stored Google Maps API key
export function getStoredGoogleMapsApiKey(): string | null {
  return getGoogleMapsApiKey();
}

// Function to remove Google Maps API key from localStorage
export function removeGoogleMapsApiKey(): void {
  try {
    localStorage.removeItem('google-maps-api-key');
  } catch (error) {
    console.error('Error removing Google Maps API key:', error);
  }
}
