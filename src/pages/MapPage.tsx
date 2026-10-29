import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Spinner } from '@/components/ui';
import OutletMap from '@/components/map/OutletMap';
import { shopsApi } from '@/lib/api';
import { requestGeolocation, useGeolocationStore } from '@/stores/geolocation';
import { toast } from 'sonner';
import type { Shop } from '@/types';

const MapPage = () => {
  const [searchParams] = useSearchParams();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const editingLocation = searchParams.get('edit') === 'location';
  const { latitude, longitude, setManualLocation } = useGeolocationStore();
  const userLocation =
    latitude !== null && longitude !== null ? { latitude, longitude } : null;
  const focusShopId = searchParams.get('shopId');
  const focusShop = shops.find((shop) => shop.id === focusShopId);

  useEffect(() => {
    const loadShops = async () => {
      try {
        const response = focusShopId
          ? await shopsApi.getById(focusShopId)
          : await shopsApi.getAll({ limit: 100 });
        const rawData = response.data?.data as any;
        const loadedShops = focusShopId
          ? [rawData?.shop || rawData]
          : Array.isArray(rawData)
            ? rawData
            : rawData?.shops || [];
        setShops(loadedShops.filter(Boolean));
      } catch (error) {
        toast.error('Gagal memuat peta outlet');
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadShops();
  }, [focusShopId]);

  useEffect(() => {
    if (editingLocation && !userLocation) {
      requestGeolocation();
    }
  }, [editingLocation, userLocation]);

  return (
    <Layout
      showBottomNav={false}
      showHeader
      headerTitle="Peta Lokasi"
      headerShowBack
      className="h-screen overflow-hidden"
    >
      <div className="h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 p-4">
        <div className="mx-auto flex h-full max-w-xl flex-col gap-3">
          <div>
              <h2 className="text-sm font-bold text-slate-900">
                {focusShop ? focusShop.name : 'Semua Outlet'}
              </h2>
              <p className="text-xs text-slate-500">
                {editingLocation ? 'Geser pin untuk memperbarui lokasi Anda' : 'Lihat lokasi outlet di peta'}
              </p>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <Spinner size="lg" label="Memuat peta..." />
            </div>
          ) : (
            <OutletMap
              shops={shops}
              userLocation={userLocation}
              editableUserLocation={editingLocation}
              onUserLocationChange={({ latitude: nextLatitude, longitude: nextLongitude }) =>
                setManualLocation(nextLatitude, nextLongitude)
              }
              focusShop={focusShop}
              height={Math.max(260, window.innerHeight - 220)}
            />
          )}

          <div className="flex flex-shrink-0 items-start gap-2 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2.5 text-xs text-primary-700">
            <MapPin size={15} className="mt-0.5 flex-shrink-0" />
            <span>
              {editingLocation
                ? 'Ketuk peta atau geser pin untuk memilih lokasi baru.'
                : 'Peta menampilkan outlet dan lokasi Anda bila tersedia.'}
            </span>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MapPage;
