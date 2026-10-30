import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { QrCode, ShieldCheck } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Layout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { CreateOrderRequest } from '@/types';

const decodeCheckout = (): CreateOrderRequest | null => {
  const value = sessionStorage.getItem('pendingCheckout');
  if (!value) return null;
  try {
    return JSON.parse(value) as CreateOrderRequest;
  } catch {
    sessionStorage.removeItem('pendingCheckout');
    return null;
  }
};

const PaymentPreparePage = () => {
  const navigate = useNavigate();
  const checkout = decodeCheckout();

  const scanUrl = useMemo(() => {
    if (!checkout) return '';
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(checkout))));
    return `${window.location.origin}/payment/scan?data=${encodeURIComponent(encoded)}`;
  }, [checkout]);

  if (!checkout) {
    return (
      <Layout showBottomNav={false} showHeader headerTitle="Pembayaran QRIS" headerShowBack>
        <div className="p-5">
          <Card className="p-6 text-center">
            <p className="text-sm text-slate-500">Data checkout tidak ditemukan.</p>
            <Button className="mt-4 w-full" onClick={() => navigate('/')}>Kembali ke beranda</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  const total = checkout.items.reduce((sum, item) => {
    const cartItem = item as CreateOrderRequest['items'][number] & { subtotal?: string };
    return sum + Number(cartItem.subtotal || 0);
  }, 0);

  return (
    <Layout showBottomNav={false} showHeader headerTitle="Pembayaran QRIS" headerShowBack>
      <div className="min-h-screen bg-slate-50 pb-10">
        <div className="mx-auto max-w-xl space-y-4 p-4 sm:p-5">
          <Card className="bg-slate-950 p-5 text-white">
            <div className="flex items-center gap-3">
              <QrCode className="text-orange-300" size={26} />
              <div>
                <p className="text-xs text-slate-400">Simulasi payment gateway</p>
                <h1 className="text-lg font-bold">Scan QRIS untuk melanjutkan</h1>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-300">
              Pesanan belum dibuat. Scan QR ini dari perangkat lain atau gunakan kamera QR untuk membuka halaman konfirmasi.
            </p>
          </Card>

          <Card className="p-5 text-center">
            <div className="mx-auto w-fit rounded-3xl border-8 border-white bg-white p-3 shadow-lg ring-1 ring-slate-200">
              <QRCodeSVG value={scanUrl} size={240} includeMargin />
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Setelah scan, pesanan dan pembayaran simulasi diproses otomatis.
            </p>
            <Button
              className="mt-5 w-full"
              onClick={() => navigate(`/payment/scan?data=${encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(checkout)))))}`)}
            >
              Buka Halaman Setelah Scan
            </Button>
          </Card>

          <Card className="p-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Item</span>
              <span>{checkout.items.length} menu</span>
            </div>
            {total > 0 && (
              <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 font-bold text-slate-900">
                <span>Estimasi subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
            )}
          </Card>

          <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
            <ShieldCheck className="shrink-0 text-emerald-600" size={18} />
            <p>Mode simulasi aktif. Nantinya proses ini dapat diganti dengan webhook Xendit atau Midtrans.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPreparePage;
