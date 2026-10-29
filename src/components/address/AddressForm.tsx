import { useState } from 'react';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import type { Address } from '@/types';

interface AddressFormProps {
  address?: Address;
  onSubmit: (data: Omit<Address, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const AddressForm = ({ address, onSubmit, onCancel, isLoading }: AddressFormProps) => {
  const [formData, setFormData] = useState({
    label: address?.label || '',
    street: address?.street || '',
    city: address?.city || '',
    province: address?.province || '',
    postalCode: address?.postalCode || '',
    coordinates: address?.coordinates || '',
    isDefault: address?.isDefault || false,
  });

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Peramban Anda tidak mendukung geolokasi');
      return;
    }

    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coordStr = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
        setFormData((prev) => ({ ...prev, coordinates: coordStr }));
        setGeoLoading(false);
      },
      (error) => {
        let message = 'Gagal mendapatkan lokasi';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Izin lokasi ditolak. Berikan izin lokasi di pengaturan browser.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Informasi lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            message = 'Waktu permintaan lokasi habis';
            break;
        }
        setGeoError(message);
        setGeoLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Label Alamat <span className="text-red-500">*</span>
          </label>
          <Input
            name="label"
            placeholder="Contoh: Rumah, Kantor, Kos"
            value={formData.label}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Alamat Lengkap <span className="text-red-500">*</span>
          </label>
          <textarea
            name="street"
            placeholder="Jalan, nomor rumah, RT/RW, kelurahan, kecamatan"
            value={formData.street}
            onChange={handleChange}
            rows={3}
            required
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kota <span className="text-red-500">*</span>
            </label>
            <Input
              name="city"
              placeholder="Contoh: Jakarta"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Provinsi <span className="text-red-500">*</span>
            </label>
            <Input
              name="province"
              placeholder="Contoh: DKI Jakarta"
              value={formData.province}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Kode Pos <span className="text-red-500">*</span>
          </label>
          <Input
            name="postalCode"
            placeholder="Contoh: 12345"
            value={formData.postalCode}
            onChange={handleChange}
            maxLength={5}
            required
          />
        </div>

        {/* Geolocation Section */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Koordinat Lokasi (Opsional)
          </label>
          <div className="flex items-start gap-2">
            <Input
              name="coordinates"
              placeholder="lat,lng (otomatis terisi)"
              value={formData.coordinates}
              onChange={handleChange}
              readOnly
              leftIcon={<MapPin size={16} className="text-slate-400" />}
            />
            <Button
              type="button"
              onClick={handleGetLocation}
              isLoading={geoLoading}
              variant="outline"
              size="md"
              className="rounded-xl px-3 h-10 flex-shrink-0"
            >
              {geoLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Navigation size={16} />
              )}
            </Button>
          </div>
          {geoError && (
            <p className="text-xs text-red-500 mt-1.5">{geoError}</p>
          )}
          <p className="text-[11px] text-slate-400 mt-1.5">
            Klik tombol navigasi untuk mendeteksi lokasi Anda secara otomatis
          </p>
        </div>

        {/* Default Address Toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            name="isDefault"
            checked={formData.isDefault}
            onChange={handleChange}
            className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
          />
          <span className="text-sm text-slate-700 font-medium">
            Jadikan alamat utama
          </span>
        </label>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          size="lg"
          className="flex-1 rounded-xl"
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          type="submit"
          size="lg"
          className="flex-1 rounded-xl font-bold"
          isLoading={isLoading}
        >
          {address ? 'Perbarui Alamat' : 'Simpan Alamat'}
        </Button>
      </div>
    </form>
  );
};

export default AddressForm;
