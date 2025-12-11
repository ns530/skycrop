/**
 * Hook for managing map center and user location
 */

import { useState, useEffect } from 'react';

import type { MapCenter } from '../types/map.types';
import { SRI_LANKA_CENTER } from '../utils/tileProviders';

interface UseMapCenterReturn {
  center: MapCenter;
  setCenter: (center: MapCenter) => void;
  getUserLocation: () => void;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for managing map center position
 * Handles user geolocation and provides default center for Sri Lanka
 */
export const useMapCenter = (): UseMapCenterReturn => {
  const [center, setCenter] = useState<MapCenter>(SRI_LANKA_CENTER);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Request user's current location using Geolocation API
   * Falls back to default Sri Lanka center if unavailable
   */
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        let errorMessage = 'Unable to retrieve your location';
        
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case err.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setError(errorMessage);
        setLoading(false);
        
        // Keep default center on error
        console.warn('Geolocation error:', errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return {
    center,
    setCenter,
    getUserLocation,
    loading,
    error,
  };
};

