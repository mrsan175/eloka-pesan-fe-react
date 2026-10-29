import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ShoppingBag } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, Button, Spinner } from '@/components/ui';
import { ordersApi } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order } from '@/types';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersApi.getMyOrders({ limit: 50 });
      const rawData = response.data?.data as any;
      if (Array.isArray(rawData)) {
        setOrders(rawData);
      } else if (rawData && Array.isArray(rawData.orders)) {
        setOrders(rawData.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      toast.error('Gagal memuat riwayat pesanan');
      console.error(error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Layout showBottomNav showHeader headerTitle="Riwayat Pesanan">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <ShoppingBag size={48} className="text-secondary-400 mb-4" />
          <h2 className="text-lg font-bold text-secondary-900 mb-2">
            Masuk untuk Melihat Riwayat
          </h2>
          <p className="text-secondary-600 text-sm mb-6">
            Silakan login untuk memantau status dan riwayat transaksi Anda.
          </p>
          <Button onClick={() => navigate('/login?redirect=/history')}>
            Masuk Sekarang
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav showHeader headerTitle="Riwayat Pesanan">
      <div className="min-h-screen bg-slate-50 p-4 pb-24">
        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <Spinner size="lg" label="Memuat riwayat..." />
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => (
              <Card
                key={order.id}
                onClick={() => navigate(`/order-status/${order.id}`)}
                hoverable
                className="p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-secondary-900">
                      {order.shop?.name || 'Outlet Pesanan'}
                    </h3>
                    <p className="text-xs text-secondary-500 mt-0.5">
                      {formatDate(order.createdAt, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getOrderStatusColor(
                      order.status
                    )}`}
                  >
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-secondary-100 text-sm">
                  <span className="text-secondary-600">
                    {order.items?.length || 0} item
                  </span>
                  <div className="flex items-center gap-1 font-bold text-primary-600">
                    <span>{formatCurrency(order.total)}</span>
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <ShoppingBag size={48} className="text-secondary-400 mb-4" />
            <p className="text-secondary-500">Belum ada riwayat pesanan</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HistoryPage;