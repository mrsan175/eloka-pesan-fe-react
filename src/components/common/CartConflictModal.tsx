import { AlertTriangle } from 'lucide-react';
import { useCartStore } from '@/stores';
import { Card, Button } from '@/components/ui';

export const CartConflictModal = () => {
  const {
    conflictModalOpen,
    pendingConflict,
    shopName,
    confirmReplaceCart,
    cancelReplaceCart,
  } = useCartStore();

  if (!conflictModalOpen || !pendingConflict) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-sm p-5 shadow-2xl border-0 rounded-2xl bg-white space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-200">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="font-bold text-secondary-900 text-base">Ganti Outlet?</h3>
            <p className="text-xs text-secondary-500">Satu pesanan hanya untuk satu outlet</p>
          </div>
        </div>

        <p className="text-xs text-secondary-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-secondary-100">
          Keranjangmu saat ini berisi menu dari{' '}
          <strong className="text-secondary-900 font-semibold">{shopName || 'Outlet Sebelumnya'}</strong>.
          Jika kamu memilih menu dari{' '}
          <strong className="text-primary-600 font-semibold">{pendingConflict.newShopName || 'outlet baru'}</strong>,
          menu di keranjang sebelumnya akan dihapus.
        </p>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            onClick={cancelReplaceCart}
            className="flex-1 rounded-xl h-10 text-xs font-semibold"
          >
            Pertahankan Keranjang
          </Button>
          <Button
            variant="primary"
            onClick={confirmReplaceCart}
            className="flex-1 rounded-xl h-10 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white"
          >
            Ganti Outlet
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default CartConflictModal;
