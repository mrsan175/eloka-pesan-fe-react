import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, Search, Sparkles, Store, Utensils, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, Spinner } from '@/components/ui';
import { ShopCard } from '@/components/shop';
import { shopsApi } from '@/lib/api';
import type { Shop } from '@/types';
import { toast } from 'sonner';
import { useGeolocationStore } from '@/stores/geolocation';
import LocationPermissionSheet from '@/components/common/LocationPermissionSheet';
import OutletMap from '@/components/map/OutletMap';
import { requestGeolocation, useGeolocationStore as useLocationStore } from '@/stores/geolocation';

const HomePage = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);

  const { latitude, longitude, permissionRequestedOnce, isDenied } = useGeolocationStore();
  const userLocation = latitude !== null && longitude !== null ? { latitude, longitude } : null;
  const setManualLocation = useLocationStore((state) => state.setManualLocation);

  const handleLocationClick = async () => {
    const granted = await requestGeolocation();
    if (!granted) setShowLocationPrompt(true);
  };

  // Ask for geolocation only once per session if not yet granted/denied
  useEffect(() => {
    if (!permissionRequestedOnce && !isDenied) {
      const timer = setTimeout(() => setShowLocationPrompt(true), 800);
      return () => clearTimeout(timer);
    }
  }, [permissionRequestedOnce, isDenied]);

  useEffect(() => {
    fetchShops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      if (latitude !== null && longitude !== null) {
        const response = await shopsApi.getNearBy(latitude, longitude, 10);
        const rawData = response.data?.data;
        setShops(Array.isArray(rawData) ? rawData : []);
        return;
      }

      const response = await shopsApi.getAll({ limit: 20 });
      const rawData = response.data?.data;
      if (Array.isArray(rawData)) {
        setShops(rawData);
      } else if (rawData && Array.isArray((rawData as any).shops)) {
        setShops((rawData as any).shops);
      } else {
        setShops([]);
      }
    } catch (error) {
      toast.error('Gagal memuat daftar toko');
      console.error(error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showBottomNav>
      <div className="min-h-screen bg-slate-50/70 pb-12">
        {/* Clean Modern App Header */}
        <div className="bg-white border-b border-slate-100 px-4 sm:px-6 pt-safe-top pb-5">
          <div className="max-w-xl mx-auto space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
                    Eloka<span className="text-primary-600">Pesan</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 border border-primary-200/50">
                    Self-Order
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Pesan tanpa antre langsung dari smartphone Anda
                </p>
              </div>

              <button
                onClick={() => navigate('/scan')}
                className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs hover:bg-slate-800 active:scale-95 transition-all"
                aria-label="Scan QR Code"
              >
                <QrCode size={22} />
              </button>
            </div>

            {/* Quick Search Trigger */}
            <div
              onClick={() => navigate('/search')}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200/70 cursor-pointer transition-colors text-slate-400 text-sm"
            >
              <Search size={18} className="text-slate-400 flex-shrink-0" />
              <span className="flex-1 text-slate-500 text-xs sm:text-sm">Cari outlet atau menu favorit...</span>
            </div>

            <div className="space-y-2">
              <button onClick={async () => {
                if (editingLocation) {
                  setEditingLocation(false);
                  setShowMap(false);
                  return;
                }
                if (!userLocation) {
                  await handleLocationClick();
                }
                setEditingLocation(true);
                setShowMap(true);
              }} className="w-full flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-left">
                <MapPin size={17} className="text-primary-600" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Lokasi Anda</span>
                  <span className="block truncate text-xs font-medium text-slate-700">
                    {userLocation
                      ? `${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}`
                      : 'Aktifkan lokasi untuk melihat posisi Anda'}
                  </span>
                </span>
                <span className="text-[10px] font-semibold text-primary-600">{editingLocation ? 'Selesai' : 'Perbaiki'}</span>
              </button>
              {editingLocation && (
                <div className="rounded-xl border border-primary-100 bg-primary-50 px-3 py-2 text-xs text-primary-700">
                  Geser pin biru atau ketuk titik baru pada peta untuk memperbaiki lokasi Anda.
                  <button type="button" onClick={handleLocationClick} className="ml-1 font-bold underline">
                    Gunakan GPS
                  </button>
                </div>
              )}
              <button onClick={() => setShowMap((value) => !value)} className="w-full flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-left">
                <Store size={17} className="text-primary-600" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Lokasi Outlet</span>
                  <span className="block text-xs font-medium text-slate-700">{showMap ? 'Sembunyikan peta outlet' : 'Lihat semua outlet di peta'}</span>
                </span>
                {showMap ? <ChevronUp size={17} className="text-slate-400" /> : <ChevronDown size={17} className="text-slate-400" />}
              </button>
              {showMap && (
                <OutletMap
                  shops={shops}
                  userLocation={userLocation}
                  editableUserLocation={editingLocation}
                  onUserLocationChange={({ latitude: nextLatitude, longitude: nextLongitude }) =>
                    setManualLocation(nextLatitude, nextLongitude)
                  }
                  height={260}
                />
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 space-y-7">
          {/* Quick Action Tiles */}
          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => navigate('/scan')}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-primary-400 hover:shadow-xs transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <QrCode size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Scan QR Meja</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">Pesan langsung</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/search')}
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:border-slate-400 hover:shadow-xs transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <Store size={24} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">Jelajahi Outlet</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">Lihat daftar resto</p>
              </div>
            </button>
          </div>

          {/* Clean Editorial Promo Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-6 shadow-sm">
            <div className="relative z-10 max-w-[75%] space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-primary-300 text-[11px] font-semibold">
                <Sparkles size={12} />
                <span>Pengguna Baru</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                Diskon 30% Pesanan Pertama
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gunakan kode <span className="font-semibold text-white tracking-wider">ELOKAHEMAT</span> saat checkout
              </p>
            </div>

            {/* Graphic accent */}
            <div className="absolute right-3 -bottom-3 opacity-15 pointer-events-none text-white">
              <Utensils size={110} />
            </div>
          </div>

          {/* All Outlets Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Daftar Outlet
                </h2>
                <p className="text-xs text-slate-500">
                  Pilih outlet untuk melihat pilihan menu
                </p>
              </div>

              {shops && shops.length > 0 && (
                <button
                  onClick={() => navigate('/search')}
                  className="text-xs text-primary-600 font-semibold hover:text-primary-700"
                >
                  Lihat Semua
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-14">
                <Spinner size="lg" label="Memuat outlet..." />
              </div>
            ) : shops && shops.length > 0 ? (
              <div className="space-y-3.5">
                {shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} variant="horizontal" />
                ))}
              </div>
            ) : (
              <Card className="py-14 text-center border-dashed border-slate-200 rounded-2xl">
                <Store size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Belum ada outlet terdaftar</p>
                <p className="text-xs text-slate-400 mt-1">Silakan coba beberapa saat lagi</p>
              </Card>
            )}
          </section>
        </div>
      </div>

      <LocationPermissionSheet
        isOpen={showLocationPrompt}
        onClose={() => setShowLocationPrompt(false)}
      />
    </Layout>
  );
};

export default HomePage;
