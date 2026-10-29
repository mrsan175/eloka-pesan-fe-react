/**
 * Geolocation utility untuk mendapatkan lokasi pengguna
 * dan menghitung jarak ke outlet
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationError {
  code: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED';
  message: string;
}

/**
 * Mendapatkan posisi geolokasi pengguna saat ini
 */
export const getCurrentPosition = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({
        code: 'NOT_SUPPORTED',
        message: 'Geolocation tidak didukung oleh browser Anda',
      } as GeolocationError);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorCode: GeolocationError['code'];
        let errorMessage: string;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorCode = 'PERMISSION_DENIED';
            errorMessage = 'Izin akses lokasi ditolak. Berikan izin lokasi untuk melihat outlet terdekat.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorCode = 'POSITION_UNAVAILABLE';
            errorMessage = 'Informasi lokasi tidak tersedia saat ini.';
            break;
          case error.TIMEOUT:
            errorCode = 'TIMEOUT';
            errorMessage = 'Waktu permintaan lokasi habis. Coba lagi.';
            break;
          default:
            errorCode = 'POSITION_UNAVAILABLE';
            errorMessage = 'Gagal mendapatkan lokasi Anda.';
        }

        reject({ code: errorCode, message: errorMessage } as GeolocationError);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 60000, // Cache selama 1 menit
      }
    );
  });
};

/**
 * Menghitung jarak antara dua koordinat menggunakan Haversine formula
 * @returns Jarak dalam kilometer
 */
export const calculateDistance = (
  coord1: Coordinates,
  coord2: Coordinates
): number => {
  const R = 6371; // Radius bumi dalam kilometer
  const dLat = toRad(coord2.latitude - coord1.latitude);
  const dLon = toRad(coord2.longitude - coord1.longitude);

  const lat1Rad = toRad(coord1.latitude);
  const lat2Rad = toRad(coord2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Bulatkan ke 1 desimal
};

/**
 * Parse string koordinat "lat,lng" menjadi objek Coordinates
 */
export const parseCoordinates = (coordString: string): Coordinates | null => {
  if (!coordString || typeof coordString !== 'string') return null;

  const parts = coordString.split(',').map((s) => parseFloat(s.trim()));
  if (parts.length !== 2 || parts.some(isNaN)) return null;

  return {
    latitude: parts[0],
    longitude: parts[1],
  };
};

/**
 * Format jarak untuk ditampilkan
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

/**
 * Helper: konversi derajat ke radian
 */
const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};
