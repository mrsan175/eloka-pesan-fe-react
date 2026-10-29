import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard, Wallet, Building2, Clock } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, Button, Spinner } from '@/components/ui';
import { ordersApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import type { Order } from '@/types';

const PaymentPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<string>('E_WALLET');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      setLoading(true);
      const response = await ordersApi.getById(id);
      const rawOrder = response.data?.data as any;
      setOrder(rawOrder?.order || rawOrder);
    } catch (error) {
      toast.error('Gagal memuat data pesanan');
      console.error(error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    {
      id: 'E_WALLET',
      name: 'E-Wallet (GoPay, OVO, Dana)',
      icon: Wallet,
      description: 'Bayar instan dengan QRIS / E-Wallet',
    },
    {
      id: 'BANK_TRANSFER',
      name: 'Virtual Account / Transfer Bank',
      icon: Building2,
      description: 'BCA, Mandiri, BNI, BRI',
    },
    {
      id: 'CREDIT_CARD',
      name: 'Kartu Kredit / Debit',
      icon: CreditCard,
      description: 'Visa, Mastercard, JCB',
    },
  ];

  const handlePayment = async () => {
    if (!orderId || !order) return;

    try {
      setIsProcessing(true);

      // Dummy payment process (Ready to integrate Midtrans/Xendit)
      // When ready, simply call the actual API:
      // const res = await paymentsApi.create({
      //   orderId,
      //   paymentMethod: paymentMethod as any,
      //   amount: parseFloat(order.total),
      // });
      // window.location.href = res.data.paymentUrl;

      // Simulate payment delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('Pembayaran Berhasil! (Dummy Mode)');
      navigate(`/order-status/${orderId}`);
    } catch (error: any) {
      toast.error('Pembayaran gagal diproses');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout showBottomNav={false} showHeader>
        <div className="flex items-center justify-center min-h-screen">
          <Spinner size="lg" label="Memuat rincian pembayaran..." />
        </div>
      </Layout>
    );
  }

  if (!order) return null;

  return (
    <Layout
      showBottomNav={false}
      showHeader
      headerTitle="Pembayaran"
      headerShowBack
    >
      <div className="min-h-screen bg-slate-50 pb-32">
        <div className="p-4 space-y-4">
          {/* Amount Box */}
          <Card className="bg-primary-500 text-white p-6 text-center">
            <span className="text-primary-100 text-sm">Total Tagihan</span>
            <h1 className="text-3xl font-display font-bold mt-1">
              {formatCurrency(order.total)}
            </h1>
            <p className="text-xs text-primary-200 mt-2">
              Order #{order.orderNumber}
            </p>
          </Card>

          {/* Payment Method Selector */}
          <div>
            <h3 className="font-semibold text-secondary-900 mb-3">
              Pilih Metode Pembayaran
            </h3>
            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                const isSelected = paymentMethod === method.id;

                return (
                  <Card
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/50 ring-2 ring-primary-500/20'
                        : 'hover:border-secondary-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl ${
                          isSelected
                            ? 'bg-primary-500 text-white'
                            : 'bg-secondary-100 text-secondary-600'
                        }`}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-secondary-900 text-sm">
                          {method.name}
                        </h4>
                        <p className="text-xs text-secondary-500 mt-0.5">
                          {method.description}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-secondary-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Note Info */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex gap-2">
            <Clock size={16} className="flex-shrink-0 mt-0.5" />
            <p>
              Ini adalah mode simulasi dummy. Transaksi ini tidak akan memotong saldo asli Anda dan siap disambungkan ke Midtrans atau Xendit.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-secondary-200 pb-safe-bottom z-20">
          <div className="p-4">
            <Button
              onClick={handlePayment}
              isLoading={isProcessing}
              size="lg"
              className="w-full font-bold"
            >
              Bayar Sekarang
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPage;