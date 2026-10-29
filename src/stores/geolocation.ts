import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  timestamp: number | null;
  lastUpdated: number | null;
  isDenied: boolean;
  permissionRequestedOnce: boolean;
  permissionRequestedAt: number | null;
  setLocation: (lat: number, lng: number, accuracy: number, timestamp: number) => void;
  clearLocation: () => void;
  setPermissionDenied: (denied: boolean) => void;
  markPermissionAsked: () => void;
  setManualLocation: (lat: number, lng: number) => void;
}

const ONE_HOUR = 60 * 60 * 1000;
const CACHE_TTL = 5 * 60 * 1000;

export const useGeolocationStore = create<GeolocationState>()(
  persist(
    (set) => ({
      latitude: null,
      longitude: null,
      accuracy: null,
      timestamp: null,
      lastUpdated: null,
      isDenied: false,
      permissionRequestedOnce: false,
      permissionRequestedAt: null,
      setLocation: (latitude, longitude, accuracy, timestamp) =>
        set({ latitude, longitude, accuracy, timestamp, lastUpdated: Date.now(), isDenied: false }),
      clearLocation: () =>
        set({ latitude: null, longitude: null, accuracy: null, timestamp: null, lastUpdated: null }),
      setPermissionDenied: (denied) =>
        set({ isDenied: denied, permissionRequestedAt: denied ? Date.now() : null }),
      markPermissionAsked: () => set({ permissionRequestedOnce: true }),
      setManualLocation: (latitude, longitude) =>
        set({
          latitude,
          longitude,
          accuracy: null,
          timestamp: Date.now(),
          lastUpdated: Date.now(),
          isDenied: false,
        }),
    }),
    {
      name: 'eloka-geolocation',
      partialize: (state) => ({
        latitude: state.latitude,
        longitude: state.longitude,
        lastUpdated: state.lastUpdated,
        isDenied: state.isDenied,
        permissionRequestedOnce: state.permissionRequestedOnce,
        permissionRequestedAt: state.permissionRequestedAt,
      }),
      version: 1,
    }
  )
);

const isSupported = () => typeof navigator !== 'undefined' && 'geolocation' in navigator;

/** Respect a recent denial so we do not nag the user on every visit. */
export const canPromptForLocation = (): boolean => {
  const { isDenied, permissionRequestedAt } = useGeolocationStore.getState();
  if (!isDenied) return true;
  if (!permissionRequestedAt) return true;
  return Date.now() - permissionRequestedAt > ONE_HOUR;
};

/** Ask the browser for permission and store the result. */
export const requestGeolocation = async (): Promise<boolean> => {
  if (!isSupported() || !canPromptForLocation()) return false;

  useGeolocationStore.getState().markPermissionAsked();

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        useGeolocationStore.getState().setLocation(latitude, longitude, accuracy, position.timestamp);
        resolve(true);
      },
      () => {
        useGeolocationStore.getState().setPermissionDenied(true);
        resolve(false);
      },
      { enableHighAccuracy: true, maximumAge: CACHE_TTL, timeout: 10000 }
    );
  });
};

export interface Coords {
  latitude: number;
  longitude: number;
}

/** Cached coords if still fresh, otherwise one silent-ish lookup. */
export const getCurrentPosition = async (): Promise<Coords | null> => {
  if (!isSupported()) return null;

  const { latitude, longitude, lastUpdated } = useGeolocationStore.getState();
  if (latitude !== null && longitude !== null && lastUpdated && Date.now() - lastUpdated < CACHE_TTL) {
    return { latitude, longitude };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng, accuracy } = position.coords;
        useGeolocationStore.getState().setLocation(lat, lng, accuracy, position.timestamp);
        resolve({ latitude: lat, longitude: lng });
      },
      () => resolve(null),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
    );
  });
};

/** Fallback coordinates (Yotta, Jakarta) used when location is unavailable. */
export const DEFAULT_LATITUDE = -6.302103;
export const DEFAULT_LONGITUDE = 106.652534;
