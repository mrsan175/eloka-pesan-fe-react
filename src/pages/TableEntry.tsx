import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Spinner } from '@/components/ui';
import { useCartStore } from '@/stores';
import { shopsApi } from '@/lib/api';
import { toast } from 'sonner';

const TableEntryPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cartShopId = useCartStore((state) => state.shopId);
  const cartItemCount = useCartStore((state) => state.items.length);

  useEffect(() => {
    const shopId = searchParams.get('shopId');
    const tableNumber = searchParams.get('tableNumber') || searchParams.get('table');

    if (!shopId || !tableNumber) {
      toast.error('QR meja tidak valid');
      navigate('/', { replace: true });
      return;
    }

    const enterTable = async () => {
      try {
        await shopsApi.getById(shopId);
        sessionStorage.setItem(
          'eloka-dine-in-table',
          JSON.stringify({ shopId, tableNumber })
        );

        if (cartItemCount > 0 && cartShopId === shopId) {
          navigate('/checkout', { replace: true });
        } else {
          navigate(`/shops/${shopId}`, { replace: true });
        }
      } catch {
        toast.error('Outlet pada QR meja tidak ditemukan');
        navigate('/', { replace: true });
      }
    };

    enterTable();
  }, [cartItemCount, cartShopId, navigate, searchParams]);

  return (
    <Layout showBottomNav={false} showHeader headerTitle="Memuat Meja">
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <QrCode size={36} className="text-primary-600" />
        <Spinner size="lg" label="Menyiapkan meja..." />
      </div>
    </Layout>
  );
};

export default TableEntryPage;
