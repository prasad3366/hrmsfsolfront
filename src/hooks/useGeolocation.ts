import { useState, useCallback } from 'react';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface GeolocationError {
  message: string;
  code?: number;
}

export interface UseGeolocationReturn {
  coordinates: GeolocationCoordinates | null;
  isLoading: boolean;
  error: GeolocationError | null;
  requestLocation: () => Promise<GeolocationCoordinates | null>;
}

/**
 * Hook to request user's current geolocation with error handling
 */
export const useGeolocation = (): UseGeolocationReturn => {
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<GeolocationError | null>(null);

  const requestLocation = useCallback(async (): Promise<GeolocationCoordinates | null> => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve) => {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        const err = {
          message: 'Geolocation is not supported by your browser',
          code: 0,
        };
        setError(err);
        setIsLoading(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GeolocationCoordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };
          setCoordinates(coords);
          setIsLoading(false);
          resolve(coords);
        },
        (geoError) => {
          let message = 'Failed to get location';
          let code = geoError.code;

          switch (geoError.code) {
            case 1:
              message = 'Permission denied. Please enable location access.';
              break;
            case 2:
              message = 'Position unavailable. Please try again.';
              break;
            case 3:
              message = 'Request timeout. Please try again.';
              break;
          }

          const err = { message, code };
          setError(err);
          setIsLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, []);

  return {
    coordinates,
    isLoading,
    error,
    requestLocation,
  };
};
