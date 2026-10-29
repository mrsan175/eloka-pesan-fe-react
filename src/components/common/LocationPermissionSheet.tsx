import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { BottomSheet, Button } from '@/components/ui';
import { requestGeolocation, useGeolocationStore } from '@/stores';

interface LocationPermissionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationGranted?: () => void;
}

export const LocationPermissionSheet = ({
  isOpen,
  onClose,
  onLocationGranted,
}: LocationPermissionSheetProps) => {
  const { isDenied } = useGeolocationStore();
  const [loading, setLoading] = useState(false);

  const handleRequest = async () => {
    setLoading(true);
    const granted = await requestGeolocation();
    setLoading(false);
    if (granted) {
      onLocationGranted?.();
      onClose();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      footer={
        <div className="space-y-2">
          <Button onClick={handleRequest} isLoading={loading} className="w-full">
            Izinkan Akses Lokasi
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="w-full text-sm font-medium text-slate-500 hover:text-slate-700 py-2 transition-colors"
          >
            Nanti saja
          </button>
        </div>
      }
    >
      <div className="pt-1">
        <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mb-5">
          <MapPin className="w-6 h-6 text-primary-600" />
        </div>

        <h2 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
          Temukan outlet terdekat
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          Aktifkan lokasi agar kami bisa menampilkan outlet yang paling dekat
          dengan posisi Anda. Lokasi hanya dipakai saat aplikasi dibuka.
        </p>

        {isDenied && (
          <p className="mt-4 text-xs text-amber-600 bg-amber-50 border border-amber-200/70 rounded-xl px-3.5 py-3 leading-relaxed">
            Akses lokasi sebelumnya ditolak. Anda bisa mengaktifkannya lewat
            pengaturan browser, atau tetap lanjut dengan daftar outlet umum.
          </p>
        )}
      </div>
    </BottomSheet>
  );
};

export default LocationPermissionSheet;
