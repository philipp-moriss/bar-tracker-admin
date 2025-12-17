/**
 * Service for geocoding addresses to coordinates via Google Geocoding API
 */

export interface GeocodingResultOption {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  placeId?: string;
  name?: string;
  source: 'places' | 'geocoding';
}

export interface GeocodingResult {
  success: boolean;
  latitude: number;
  longitude: number;
  formattedAddress?: string;
  placeId?: string;
  multipleResults?: boolean;
  results?: GeocodingResultOption[];
}

export interface GeocodingError {
  error: string;
  message?: string;
}

class GeocodingService {
  private readonly functionUrl = 'https://us-central1-react-native-bartrekker.cloudfunctions.net/geocodeAddress';

  /**
   * Geocodes address to coordinates
   * @param address - street and house number
   * @param city - city
   * @param country - country
   * @param name - venue name (optional, for Places API search)
   * @returns Promise with coordinates or error
   */
  async geocodeAddress(
    address: string,
    city: string,
    country: string,
    name?: string
  ): Promise<GeocodingResult> {
    try {
      if (!address || !city || !country) {
        throw new Error('Address, city, and country are required');
      }

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            address: address.trim(),
            city: city.trim(),
            country: country.trim(),
            name: name?.trim(),
          },
        }),
      });

      if (!response.ok) {
        const errorData: GeocodingError = await response.json();
        throw new Error(errorData.message || errorData.error || 'Geocoding failed');
      }

      const result = await response.json();
      
      if (result.data && result.data.success) {
        return {
          success: true,
          latitude: result.data.latitude,
          longitude: result.data.longitude,
          formattedAddress: result.data.formattedAddress,
          placeId: result.data.placeId,
          multipleResults: result.data.multipleResults || false,
          results: result.data.results,
        };
      } else {
        throw new Error('Invalid response from geocoding service');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }
}

export const geocodingService = new GeocodingService();

