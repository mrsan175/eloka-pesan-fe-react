import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Shop } from '@/types';

interface OutletMapProps {
  shops: Shop[];
  userLocation?: { latitude: number; longitude: number } | null;
  editableUserLocation?: boolean;
  onUserLocationChange?: (location: { latitude: number; longitude: number }) => void;
  className?: string;
  height?: number;
  focusShop?: Shop;
}

const OutletMap = ({
  shops,
  userLocation = null,
  editableUserLocation = false,
  onUserLocationChange,
  className,
  height = 280,
  focusShop,
}: OutletMapProps) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;
    setMapLoaded(false);
    setHasError(false);

    import('leaflet')
      .then((L) => {
        if (disposed || !containerRef.current || mapRef.current) return;

        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#7c3aed;border:3px solid white;box-shadow:0 2px 8px rgba(15,23,42,.35);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center"><span style="transform:rotate(45deg);font-size:14px">⌂</span></div>',
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        });

        const firstShop = focusShop || shops.find((shop) => shop.latitude != null && shop.longitude != null);
        const center: [number, number] = userLocation
          ? [userLocation.latitude, userLocation.longitude]
          : firstShop?.latitude != null && firstShop.longitude != null
            ? [firstShop.latitude, firstShop.longitude]
            : [-5.1511296, 119.4295296];
        const map = L.map(containerRef.current, { center, zoom: userLocation ? 17 : focusShop ? 16 : 13, attributionControl: false });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        const markers: [number, number][] = [];
        if (userLocation) {
          const userMarker = L.marker([userLocation.latitude, userLocation.longitude], {
            draggable: editableUserLocation,
            icon: userIcon,
          }).addTo(map);
          userMarker.bindPopup('<strong>Lokasi Anda</strong>');
          if (editableUserLocation) {
            userMarker.on('dragend', () => {
              const position = userMarker.getLatLng();
              onUserLocationChange?.({ latitude: position.lat, longitude: position.lng });
            });
          }
          markers.push([userLocation.latitude, userLocation.longitude]);
        }

        shops
          .filter((shop) => shop.latitude != null && shop.longitude != null)
          .forEach((shop) => {
            const marker = L.marker([shop.latitude as number, shop.longitude as number]).addTo(map);
            marker.bindPopup(`<strong>${shop.name}</strong><br />${shop.address}`);
            markers.push([shop.latitude as number, shop.longitude as number]);
          });

        if (editableUserLocation) {
          map.on('click', (event: any) => {
            onUserLocationChange?.({ latitude: event.latlng.lat, longitude: event.latlng.lng });
          });
        }

        if (editableUserLocation && userLocation) {
          map.setView([userLocation.latitude, userLocation.longitude], 17);
        } else if (focusShop && markers.length > 1) {
          map.fitBounds(L.latLngBounds(markers), { padding: [48, 48], maxZoom: 16 });
        } else if (!focusShop && markers.length > 1) {
          map.fitBounds(L.latLngBounds(markers), { padding: [32, 32], maxZoom: 12 });
        } else if (userLocation) {
          map.setView([userLocation.latitude, userLocation.longitude], 15);
        } else if (markers.length > 1) {
          map.fitBounds(L.latLngBounds(markers), { padding: [24, 24] });
        }

        mapRef.current = map;
        setMapLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load Leaflet:', error);
        setHasError(true);
      });

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [shops, userLocation, editableUserLocation, onUserLocationChange, focusShop]);

  if (hasError || (!focusShop && shops.every((shop) => shop.latitude == null || shop.longitude == null))) {
    return (
      <div className={cn('flex items-center justify-center rounded-2xl bg-slate-100 border border-slate-200', className)} style={{ height }}>
        <div className="text-center p-6">
          <MapPin size={32} className="mx-auto text-slate-400 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Lokasi outlet belum tersedia</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-slate-100', className)}>
      <div ref={containerRef} style={{ height }} className="w-full" />
      {!mapLoaded && <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 text-xs text-slate-500">Memuat peta...</div>}
    </div>
  );
};

export default OutletMap;
