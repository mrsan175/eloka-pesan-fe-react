import { Plus } from 'lucide-react';
import { BottomSheet, Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { Product, CartItem } from '@/types';

interface RepeatCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  existingItems: CartItem[];
  onRepeatItem: (item: CartItem) => void;
  onAddNewCustomization: () => void;
}

const RepeatCustomizationModal = ({
  isOpen,
  onClose,
  product,
  existingItems,
  onRepeatItem,
  onAddNewCustomization,
}: RepeatCustomizationModalProps) => {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Pilihan Tambah Menu"
      footer={
        <Button
          variant="outline"
          size="lg"
          onClick={onAddNewCustomization}
          className="w-full h-12 rounded-2xl text-xs sm:text-sm font-bold border-2 border-primary-500 text-primary-600 hover:bg-primary-50/70 shadow-xs flex items-center justify-center gap-2"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Buat Rincian / Varian Baru</span>
        </Button>
      }
    >
      <div className="space-y-4">
        <div>
          <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
            {product.name}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Menu ini sudah ada di pesanan Anda. Pilih untuk mengulang rincian sebelumnya atau buat kombinasi baru.
          </p>
        </div>

        {/* Existing Custom Items List */}
        <div className="space-y-2.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Rincian Yang Sudah Dipilih ({existingItems.length})
          </span>

          {existingItems.map((item, index) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-primary-400 shadow-xs transition-all flex items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                    Pilihan #{index + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    x{item.quantity} di keranjang
                  </span>
                </div>

                {/* Variants List */}
                {item.variants && item.variants.length > 0 && (
                  <p className="text-xs font-medium text-slate-700 mt-1">
                    {item.variants.map((v) => v.optionName).join(', ')}
                  </p>
                )}

                {/* Addons List */}
                {item.addons && item.addons.length > 0 && (
                  <p className="text-xs text-slate-500">
                    + {item.addons.map((a) => `${a.name} (x${a.quantity})`).join(', ')}
                  </p>
                )}

                {/* Notes */}
                {item.notes && (
                  <p className="text-[11px] text-slate-400 italic mt-0.5">
                    Catatan: {item.notes}
                  </p>
                )}

                <span className="text-xs font-extrabold text-slate-900 mt-1 block">
                  {formatCurrency(item.unitPrice)} / porsi
                </span>
              </div>

              {/* Repeat Button */}
              <Button
                size="sm"
                onClick={() => onRepeatItem(item)}
                className="rounded-xl px-3 h-9 text-xs font-bold shadow-xs flex-shrink-0 flex items-center gap-1.5"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Ulangi (+1)</span>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </BottomSheet>
  );
};

export default RepeatCustomizationModal;
