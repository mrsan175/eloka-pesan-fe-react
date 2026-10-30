import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Clock3, Copy, QrCode, ShieldCheck, Wifi } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Layout } from '@/components/layout';
import { Card, Button, Spinner } from '@/components/ui';
import { ordersApi, paymentsApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order, PaymentResponse } from '@/types';

type PaymentData = PaymentResponse['data'];

const PaymentPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const paymentCreationStarted = useRef(false);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [orderResponse, statusResponse] = await Promise.all([
          ordersApi.getById(orderId),
          paymentsApi.getStatus(orderId),
        ]);
        if (cancelled) return;
        const rawOrder = orderResponse.data?.data as Order | { order: Order };
        setOrder('order' in rawOrder ? rawOrder.order : rawOrder);
        if (statusResponse.data.data) setPayment(statusResponse.data.data);
      } catch (error) {
        toast.error('Gagal memuat data pembayaran');
        console.error(error);
        navigate('/');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [orderId, navigate]);

  useEffect(() => {
    if (
      !orderId ||
      !order ||
      payment?.transactionId ||
      payment?.status === 'PAID' ||
      paymentCreationStarted.current
    ) {
      return;
    }

    paymentCreationStarted.current = true;
    setCreating(true);
    paymentsApi
      .create({ orderId, paymentMethod: 'QRIS' })
      .then((response) => {
        if (response.data.data) setPayment(response.data.data);
      })
      .catch((error: any) => {
        paymentCreationStarted.current = false;
        toast.error(error.response?.data?.message || 'Gagal membuat QRIS');
        console.error(error);
      })
      .finally(() => setCreating(false));
  }, [orderId, order, payment]);

  useEffect(() => {
    if (!orderId || !payment?.transactionId || payment.status === 'PAID') return;
    const controller = new AbortController();
    const token = localStorage.getItem('accessToken');
    const stream = async () => {
      try {
        const response = await fetch(paymentsApi.eventsUrl(orderId), {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(sessionStorage.getItem('orderAccessToken')
              ? { 'X-Order-Access-Token': sessionStorage.getItem('orderAccessToken') as string }
              : {}),
          },
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error('Payment event stream unavailable');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (!controller.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';
          events.forEach((event) => {
            const line = event.split('\n').find((item) => item.startsWith('data: '));
            if (!line) return;
            const nextPayment = JSON.parse(line.slice(6)) as PaymentData;
            setPayment((current) => (current ? { ...current, ...nextPayment } : nextPayment));
            if (nextPayment.status === 'PAID') {
              toast.success('Pembayaran QRIS berhasil diterima');
              setTimeout(() => navigate(`/order-status/${orderId}`), 700);
            }
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) console.error(error);
      }
    };
    void stream();
    return () => controller.abort();
  }, [orderId, payment?.transactionId, payment?.status, navigate]);

  const createPayment = async () => {
    if (!orderId) return;
    try {
      setCreating(true);
      const response = await paymentsApi.create({ orderId, paymentMethod: 'QRIS' });
      if (response.data.data) setPayment(response.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat QRIS');
      console.error(error);
    } finally {
      setCreating(false);
    }
  };

  const simulateScan = async () => {
    if (!payment?.transactionId) return;
    try {
      const response = await paymentsApi.simulateScan(payment.transactionId);
      const simulatedPayment = response.data.data;
      if (simulatedPayment) {
        setPayment((current) =>
          current
            ? { ...current, ...simulatedPayment, status: simulatedPayment.status }
            : simulatedPayment,
        );
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Simulasi pembayaran gagal');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <Layout showBottomNav={false} showHeader>
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size="lg" label="Menyiapkan pembayaran QRIS..." />
        </div>
      </Layout>
    );
  }
  if (!order) return null;

  const isPaid = payment?.status === 'PAID';
  const isExpired = payment?.status === 'EXPIRED' || (payment?.expiresAt && new Date(payment.expiresAt) < new Date());
  const qrPayload = payment?.qrPayload;

  return (
    <Layout showBottomNav={false} showHeader headerTitle="Pembayaran QRIS" headerShowBack>
      <div className="min-h-screen bg-slate-50 pb-10">
        <div className="mx-auto max-w-xl space-y-4 p-4 sm:p-5">
          <Card className="overflow-hidden border-0 bg-slate-950 p-0 text-white shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-xs font-medium text-slate-400">Tagihan pesanan</p>
                <p className="mt-1 text-sm font-bold">{order.orderNumber}</p>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-orange-300">
                QRIS only
              </div>
            </div>
            <div className="px-5 py-6">
              <p className="text-sm text-slate-400">Total pembayaran</p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">{formatCurrency(order.total)}</h1>
              <div className="mt-5 flex items-center gap-2 text-xs text-emerald-300">
                <Wifi size={14} />
                <span>Menunggu konfirmasi gateway secara realtime</span>
              </div>
            </div>
          </Card>

          {isPaid ? (
            <Card className="border-emerald-200 bg-emerald-50 p-6 text-center">
              <CheckCircle2 className="mx-auto text-emerald-600" size={48} />
              <h2 className="mt-3 text-xl font-bold text-emerald-900">Pembayaran diterima</h2>
              <p className="mt-1 text-sm text-emerald-700">Anda akan diarahkan ke status pesanan.</p>
            </Card>
          ) : !payment?.transactionId || isExpired ? (
            <Card className="p-6 text-center">
              <Clock3 className="mx-auto text-orange-500" size={40} />
              <h2 className="mt-3 text-lg font-bold text-slate-900">
                {isExpired ? 'QRIS sudah kedaluwarsa' : 'QRIS siap dibuat'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">Buat kode baru untuk melanjutkan pembayaran.</p>
              <Button className="mt-5 w-full" onClick={createPayment} isLoading={creating}>
                Buat QRIS
              </Button>
            </Card>
          ) : (
            <Card className="p-5">
              <div className="flex items-center gap-2">
                <QrCode className="text-primary-500" size={21} />
                <h2 className="font-bold text-slate-900">Scan QRIS untuk membayar</h2>
              </div>
              <div className="mx-auto mt-5 w-fit rounded-3xl border-8 border-white bg-white p-3 shadow-lg ring-1 ring-slate-200">
                <QRCodeSVG value={qrPayload || payment.transactionId || order.id} size={220} includeMargin />
              </div>
              <p className="mt-4 text-center text-sm text-slate-500">
                Buka aplikasi e-wallet atau mobile banking, pilih Scan, lalu arahkan ke QR di atas.
              </p>
              {payment.demo === 'true' && (
                <div className="mt-3 space-y-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                  <p>
                    Mode development: QR ini belum terhubung ke gateway QRIS. Gunakan tombol di bawah untuk mensimulasikan user selesai scan dan membayar.
                  </p>
                  <Button variant="secondary" className="w-full text-sm" onClick={simulateScan}>
                    Simulasikan Scan & Pembayaran
                  </Button>
                </div>
              )}
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm">
                <span className="text-slate-500">Status</span>
                <span className="flex items-center gap-1.5 font-semibold text-orange-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                  Menunggu pembayaran
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(payment.transactionId || '');
                  toast.success('ID transaksi disalin');
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 text-xs font-semibold text-slate-500 hover:text-primary-600"
              >
                <Copy size={14} />
                Salin ID transaksi
              </button>
            </Card>
          )}

          <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
            <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={18} />
            <p>Pembayaran hanya diproses setelah webhook gateway tervalidasi. Jangan menutup halaman sebelum status berubah.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPage;
