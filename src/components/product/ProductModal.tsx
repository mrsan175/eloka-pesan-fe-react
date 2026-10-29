import { useState, useEffect } from 'react';
import { Minus, Plus, Check } from 'lucide-react';
import { BottomSheet, Button } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/stores';
import type { Product, CartItem, CartItemVariant, CartItemAddon } from '@/types';

interface ProductModalProps {
  product: Product;
  shopName?: string;
  isOpen: boolean;
  onClose: () => void;
  editItem?: CartItem | null;
  onSaveEdit?: (
    itemId: string,
    quantity: number,
    variants: CartItemVariant[],
    addons: CartItemAddon[],
    notes: string
  ) => void;
}

const ProductModal = ({
  product,
  shopName,
  isOpen,
  onClose,
  editItem,
  onSaveEdit,
}: ProductModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<CartItemVariant[]>([]);
  const [selectedAddons, setSelectedAddons] = useState<CartItemAddon[]>([]);
  const [notes, setNotes] = useState('');

  const addItem = useCartStore((state) => state.addItem);

  // Synchronize state when modal opens or editItem changes
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setQuantity(editItem.quantity);
        setSelectedVariants(editItem.variants || []);
        setSelectedAddons(editItem.addons || []);
        setNotes(editItem.notes || '');
      } else {
        setQuantity(1);
        setSelectedVariants([]);
        setSelectedAddons([]);
        setNotes('');
      }
    }
  }, [isOpen, editItem]);

  // Group variants by name (e.g. Size: Small, Medium, Large)
  const variantGroups = product.variants?.reduce((groups, variant) => {
    if (!groups[variant.name]) {
      groups[variant.name] = [];
    }
    groups[variant.name].push(variant);
    return groups;
  }, {} as Record<string, typeof product.variants>);

  // Calculate total price
  const calculateTotal = () => {
    let basePrice = parseFloat(product.price);

    selectedVariants.forEach((v) => {
      basePrice += parseFloat(v.priceAdjust);
    });

    let total = basePrice * quantity;

    selectedAddons.forEach((a) => {
      total += parseFloat(a.price) * a.quantity * quantity;
    });

    return total;
  };

  const handleVariantChange = (groupName: string, variant: typeof product.variants[0]) => {
    setSelectedVariants((prev) => {
      const filtered = prev.filter((v) => v.optionName !== groupName);
      return [
        ...filtered,
        {
          variantId: variant.id,
          optionName: groupName,
          priceAdjust: variant.priceAdjust,
        },
      ];
    });
  };

  const handleAddonToggle = (addon: typeof product.addons[0]) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.addonId === addon.id);
      if (exists) {
        return prev.filter((a) => a.addonId !== addon.id);
      }
      return [
        ...prev,
        {
          addonId: addon.id,
          name: addon.name,
          price: addon.price,
          quantity: 1,
        },
      ];
    });
  };

  const handleAddonQty = (e: React.MouseEvent, addonId: string, delta: number) => {
    e.stopPropagation();
    setSelectedAddons((prev) =>
      prev
        .map((a) => {
          if (a.addonId === addonId) {
            const nextQty = a.quantity + delta;
            return nextQty > 0 ? { ...a, quantity: nextQty } : null;
          }
          return a;
        })
        .filter(Boolean) as CartItemAddon[]
    );
  };

  const handleSave = () => {
    if (editItem && onSaveEdit) {
      onSaveEdit(editItem.id, quantity, selectedVariants, selectedAddons, notes);
      onClose();
    } else {
      addItem(product, quantity, selectedVariants, selectedAddons, notes, shopName);
      onClose();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? `Ubah: ${product.name}` : product.name}
      footer={
        <div className="flex items-center gap-3">
          {/* Stepper Quantity */}
          <div className="flex items-center gap-2 bg-slate-100 rounded-2xl p-1.5 border border-slate-200 flex-shrink-0">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-xl bg-white text-slate-700 shadow-xs flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
              aria-label="Kurang"
            >
              <Minus size={15} strokeWidth={2.5} />
            </button>
            <span className="w-6 text-center font-extrabold text-slate-900 text-sm">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 rounded-xl bg-primary-500 text-white shadow-xs flex items-center justify-center hover:bg-primary-600 active:scale-95 transition-all"
              aria-label="Tambah"
            >
              <Plus size={15} strokeWidth={2.5} />
            </button>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleSave}
            size="lg"
            className="flex-1 h-12 rounded-2xl text-xs sm:text-sm font-extrabold shadow-md shadow-primary-500/25 flex items-center justify-between px-4 sm:px-5"
          >
            <span>{editItem ? 'Simpan Perubahan' : 'Tambah Pesanan'}</span>
            <span>{formatCurrency(calculateTotal())}</span>
          </Button>
        </div>
      }
    >
      {/* Product Image & Info */}
      <div className="flex gap-4">
        <img
          src={
            product.imageUrl ||
            'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'
          }
          alt={product.name}
          className="w-24 h-24 rounded-2xl object-cover bg-slate-100 flex-shrink-0 shadow-xs"
        />
        <div className="flex-1 min-w-0">
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 block">
            {formatCurrency(product.price)}
          </span>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-3 leading-relaxed">
            {product.description || 'Pilihan menu lezat dan berkualitas'}
          </p>
        </div>
      </div>

      {/* Variants Section */}
      {variantGroups &&
        Object.entries(variantGroups).map(([groupName, variants]) => (
          <div key={groupName} className="space-y-2.5">
            <label className="text-xs sm:text-sm font-bold text-slate-900 block">
              {groupName} <span className="text-primary-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {variants.map((v) => {
                const isSelected = selectedVariants.some(
                  (item) => item.variantId === v.id
                );
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleVariantChange(groupName, v)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/70 ring-2 ring-primary-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs sm:text-sm text-slate-800">
                        {v.optionName}
                      </span>
                      {isSelected && (
                        <Check size={14} className="text-primary-600 flex-shrink-0" />
                      )}
                    </div>
                    {parseFloat(v.priceAdjust) > 0 && (
                      <span className="text-xs text-primary-600 font-bold mt-1">
                        +{formatCurrency(v.priceAdjust)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

      {/* Addons Section (Extra Sugar, Extra Salad, etc.) */}
      {product.addons && product.addons.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs sm:text-sm font-bold text-slate-900">
              Tambahan / Topping (Opsional)
            </label>
            <span className="text-[11px] text-slate-400">Bisa pilih lebih dari satu</span>
          </div>

          <div className="space-y-2">
            {product.addons.map((addon) => {
              const selectedAddon = selectedAddons.find(
                (a) => a.addonId === addon.id
              );
              const isSelected = !!selectedAddon;

              return (
                <div
                  key={addon.id}
                  onClick={() => handleAddonToggle(addon)}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50/70'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-xs sm:text-sm text-slate-800 block">
                      {addon.name}
                    </span>
                    <span className="text-xs text-primary-600 font-bold">
                      +{formatCurrency(addon.price)}
                    </span>
                  </div>

                  {/* Quantity Stepper for Addon if selected */}
                  {isSelected ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 bg-white rounded-full p-1 border border-primary-200 shadow-2xs flex-shrink-0"
                    >
                      <button
                        type="button"
                        onClick={(e) => handleAddonQty(e, addon.id, -1)}
                        className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 active:scale-95"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold text-primary-700 min-w-[16px] text-center">
                        {selectedAddon.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleAddonQty(e, addon.id, 1)}
                        className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 active:scale-95"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                      <Plus size={14} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-xs sm:text-sm font-bold text-slate-900 block">
          Catatan Khusus
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Contoh: Kurangi manis, es sedikit..."
          rows={2}
          className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-slate-400"
        />
      </div>
    </BottomSheet>
  );
};

export default ProductModal;
