import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Clock, ChefHat, PackageCheck, AlertCircle } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, Button, Spinner } from '@/components/ui';
import { ordersApi } from '@/lib/api';
import { formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order } from '@/types';

const OrderStatusPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
      // Polling order status every 5 seconds
      const interval = setInterval(() => {
        fetchOrder(orderId, true);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchOrder = async (id: string, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await ordersApi.getById(id);
      const rawOrder = response.data?.data as any;
      setOrder(rawOrder?.order || rawOrder);
    } catch (error) {
      if (!silent) {
        toast.error('Gagal memuat status pesanan');
        console.error(error);
        navigate('/');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const steps = [
    { key: 'PENDING', label: 'Menunggu Konfirmasi', icon: Clock },
    { key: 'CONFIRMED', label: 'Dikonfirmasi', icon: CheckCircle2 },
    { key: 'PREPARING', label: 'Sedang Disiapkan', icon: ChefHat },
    { key: 'READY', label: 'Siap Diambil', icon: PackageCheck },
    { key: 'COMPLETED', label: 'Selesai', icon: CheckCircle2 },
  ];

  const getStepIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PREPARING':
        return 2;
      case 'READY':
      case 'DELIVERING':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <Layout showBottomNav={false} showHeader>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" label="Memuat status pesanan..." />
        </div>
      </Layout>
    );
  }

  if (!order) return null;

  const currentStep = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';

  return (
    <Layout
      showBottomNav={false}
      showHeader
      headerTitle="Status Pesanan"
      headerShowBack
    >
      <div className="min-h-screen bg-slate-50 pb-20">
        <div className="p-4 space-y-4">
          {/* Header Card */}
          <Card className="p-5 text-center">
            <span className="text-xs text-secondary-500 font-semibold tracking-wide uppercase">
              Order ID #{order.orderNumber}
            </span>
            <h2 className="text-xl font-bold text-secondary-900 mt-1">
              {order.shop?.name || 'Outlet Pesanan'}
            </h2>
            <div className="flex items-center justify-center gap-2 mt-3">
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${getOrderStatusColor(
                  order.status
                )}`}
              >
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
          </Card>

          {/* Stepper Progress */}
          {!isCancelled ? (
            <Card className="p-5">
              <div className="relative">
                {/* Connecting Line */}
                <div className="absolute top-4 left-4 bottom-4 w-0.5 bg-secondary-200" />
                <div
                  className="absolute top-4 left-4 w-0.5 bg-primary-500 transition-all duration-500"
                  style={{
                    height: `${(currentStep / (steps.length - 1)) * 85}%`,
                  }}
                />

                <div className="space-y-6 relative">
                  {steps.map((step, idx) => {
                    const Icon = step.icon;
                    const isDone = idx <= currentStep;
                    const isCurrent = idx === currentStep;

                    return (
                      <div key={step.key} className="flex items-center gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors ${
                            isDone
                              ? 'bg-primary-500 text-white'
                              : 'bg-secondary-100 text-secondary-400 border border-secondary-300'
                          }`}
                        >
                          <Icon size={16} />
                        </div>
                        <div className="flex-1">
                          <h4
                            className={`text-sm font-semibold ${
                              isCurrent
                                ? 'text-primary-600'
                                : isDone
                                ? 'text-secondary-900'
                                : 'text-secondary-400'
                            }`}
                          >
                            {step.label}
                          </h4>
                          {isCurrent && (
                            <p className="text-xs text-secondary-500 mt-0.5">
                              {step.key === 'READY'
                                ? 'Pesanan sudah siap! Silakan ambil di kasir/outlet.'
                                : 'Harap menunggu pesanan sedang diproses.'}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-5 bg-red-50 border-red-200 flex items-center gap-3">
              <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900">Pesanan Dibatalkan</h4>
                <p className="text-xs text-red-600 mt-0.5">
                  Pesanan ini telah dibatalkan. Silakan buat pesanan baru.
                </p>
              </div>
            </Card>
          )}

          {/* Pickup / Dine In Details */}
          <Card className="p-4 space-y-2 text-sm">
            <h3 className="font-semibold text-secondary-900 mb-2">Detail Pengambilan</h3>
            <div className="flex justify-between text-secondary-600">
              <span>Metode</span>
              <span className="font-medium text-secondary-900">
                {order.orderType === 'DINE_IN'
                  ? 'Makan di Tempat'
                  : order.orderType === 'TAKEAWAY'
                  ? 'Bawa Pulang (Takeaway)'
                  : 'Pengiriman'}
              </span>
            </div>
            {order.tableNumber && (
              <div className="flex justify-between text-secondary-600">
                <span>Nomor Meja</span>
                <span className="font-bold text-primary-600">{order.tableNumber}</span>
              </div>
            )}
            {order.pickupTime && (
              <div className="flex justify-between text-secondary-600">
                <span>Jadwal Pengambilan</span>
                <span className="font-medium text-secondary-900">
                  {formatDate(order.pickupTime, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </Card>

          {/* Action Button */}
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="w-full mt-4"
          >
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default OrderStatusPage;