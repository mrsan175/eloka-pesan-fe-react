import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, QrCode } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, Button, Spinner } from '@/components/ui';
import { ordersApi, paymentsApi } from '@/lib/api';
import { toast } from 'sonner';
import type { CreateOrderRequest } from '@/types';

const decodeCheckout = (data: string | null): CreateOrderRequest | null => {
  if (!data) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(data))))) as CreateOrderRequest;
  } catch {
    return null;
  }
};

const PaymentScanPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const checkout = decodeCheckout(params.get('data'));
  const [processing, setProcessing] = useState(false);
  const hasProcessed = useRef(false);

  const confirmPayment = async () => {
    if (!checkout || hasProcessed.current) return;
    hasProcessed.current = true;
    try {
      setProcessing(true);
      const response = await ordersApi.create(checkout);
      const rawOrder = response.data?.data as any;
      const order = rawOrder?.order || rawOrder;
      if (rawOrder?.guestAccessToken) {
        sessionStorage.setItem('orderAccessToken', rawOrder.guestAccessToken);
      }

      const paymentResponse = await paymentsApi.create({
        orderId: order.id,
        paymentMethod: 'QRIS',
      });
      const transactionId = paymentResponse.data.data?.transactionId;
      if (transactionId) {
        await paymentsApi.simulateScan(transactionId);
      }

      sessionStorage.removeItem('pendingCheckout');
      toast.success('Pembayaran simulasi berhasil');
      navigate(`/order-status/${order.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Pembayaran simulasi gagal');
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (checkout) void confirmPayment();
  }, [checkout]);

  if (!checkout) {
    return (
      <Layout showBottomNav={false} showHeader headerTitle="QRIS" headerShowBack>
        <div className="p-5">
          <Card className="p-6 text-center">
            <p className="text-sm text-slate-500">QR pembayaran tidak valid atau sudah kedaluwarsa.</p>
            <Button className="mt-4 w-full" onClick={() => navigate('/')}>Kembali ke beranda</Button>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav={false} showHeader headerTitle="Konfirmasi QRIS" headerShowBack>
      <div className="min-h-screen bg-slate-50 p-4">
        <Card className="mx-auto max-w-xl p-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={36} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">QR berhasil discan</h1>
          <p className="mt-2 text-sm text-slate-500">
            Pembayaran sedang diproses otomatis dan pesanan akan dibuat.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
            <QrCode size={16} />
            QRIS • Mode development
          </div>
          {processing && <Spinner size="sm" label="Membuat pesanan..." />}
        </Card>
      </div>
    </Layout>
  );
};

export default PaymentScanPage;
