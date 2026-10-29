import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui';
import { cn, calculateDistance, formatDistance } from '@/lib/utils';
import type { Shop } from '@/types';

interface ShopMapProps {
  shop: Shop;
  className?: string;
  height?: number;
  zoom?: number;
  showInfoCard?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
}

const ShopMap = ({
  shop,
  className,
  height = 280,
  zoom = 15,
  showInfoCard = true,
  userLocation = null,
}: ShopMapProps) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const latitude = shop.latitude;
  const longitude = shop.longitude;

  const distance =
    userLocation && latitude != null && longitude != null
      ? calculateDistance(userLocation.latitude, userLocation.longitude, latitude, longitude)
      : null;

  useEffect(() => {
    // Reset error on shop change
    setHasError(false);
    setMapLoaded(false);

    // Load Leaflet dynamically
    if (
      !mapInstanceRef.current &&
      typeof window !== 'undefined' &&
      latitude != null &&
      longitude != null
    ) {
      import('leaflet')
        .then((L) => {
          // Fix default marker icon issues with Webpack/Vite
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl:
              'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          });

          if (mapContainerRef.current && !mapInstanceRef.current) {
            // Initialize map
            const map = L.map(mapContainerRef.current, {
              center: [latitude, longitude],
              zoom: zoom,
              zoomControl: true,
              scrollWheelZoom: true,
              dragging: true,
              attributionControl: false,
            });

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
              maxZoom: 19,
            }).addTo(map);

            // Add marker
            const marker = L.marker([latitude, longitude]).addTo(map);
            marker.bindPopup(`
              <div style="padding: 8px; min-width: 150px;">
                <h4 style="font-weight: bold; font-size: 14px; margin: 0 0 4px 0; color: #1e293b;">${shop.name}</h4>
                <p style="font-size: 12px; margin: 0; color: #64748b;">${shop.address}</p>
                <div style="margin-top: 6px; font-size: 11px; color: #94a3b8;">
                  📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}
                </div>
              </div>
            `);

            mapInstanceRef.current = map;
            markerRef.current = marker;
            setMapLoaded(true);
          }
        })
        .catch((err) => {
          console.error('Failed to load Leaflet:', err);
          setHasError(true);
        });
    }

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [shop.id, latitude, longitude, zoom]);

  if (hasError || latitude == null || longitude == null) {
    return (
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-2xl bg-slate-100 border border-slate-200',
          className
        )}
        style={{ height }}
      >
        <div className="text-center space-y-2 p-6">
          <MapPin size={36} className="mx-auto text-slate-400" />
          <p className="text-sm font-semibold text-slate-700">Lokasi outlet belum tersedia</p>
          <p className="text-xs text-slate-500 max-w-xs">
            Silakan hubungi outlet untuk informasi alamat lengkap
          </p>
        </div>
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-slate-50', className)}>
      {/* Leaflet Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full"
        style={{ height: `${height}px` }}
      />

      {/* Loading Overlay */}
      {!mapLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Memuat peta...</p>
          </div>
        </div>
      )}

      {/* Info Card Overlay */}
      {showInfoCard && mapLoaded && (
        <div className="absolute bottom-3 left-3 right-3 z-20">
          <Card className="p-4 bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-lg rounded-2xl space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">
                  {shop.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                  {shop.address}
                </p>
              </div>
              {distance != null && (
                <div className="flex items-center gap-1.5 bg-primary-50 text-primary-700 px-2.5 py-1 rounded-xl border border-primary-200/60 shrink-0">
                  <Navigation size={12} className="text-primary-600" />
                  <span className="font-bold text-xs">{formatDistance(distance)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin size={13} className="text-slate-400" />
                <span className="truncate max-w-[140px]">
                  {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </span>
              </div>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={12} />
                <span>Buka di Maps</span>
              </a>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ShopMap;
