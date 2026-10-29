import { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/stores';
import ProductModal from './ProductModal';
import RepeatCustomizationModal from './RepeatCustomizationModal';
import type { Product, CartItem } from '@/types';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  shopName?: string;
}

const ProductCard = ({ product, shopName }: ProductCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRepeatModalOpen, setIsRepeatModalOpen] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const decreaseProduct = useCartStore((state) => state.decreaseProduct);
  const quantity = useCartStore((state) => state.getProductQuantity(product.id));
  const getItemsByProduct = useCartStore((state) => state.getItemsByProduct);

  const hasVariantsOrAddons =
    (product.variants && product.variants.length > 0) ||
    (product.addons && product.addons.length > 0);

  const existingItems = getItemsByProduct(product.id);

  const handleCardClick = () => {
    if (quantity > 0 && hasVariantsOrAddons) {
      setIsRepeatModalOpen(true);
    } else if (hasVariantsOrAddons) {
      setIsOpen(true);
    } else {
      addItem(product, 1, [], [], '', shopName);
    }
  };

  const handlePlus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantity > 0 && hasVariantsOrAddons) {
      // Prompt user: repeat previous customization or create new one
      setIsRepeatModalOpen(true);
    } else if (hasVariantsOrAddons) {
      setIsOpen(true);
    } else {
      addItem(product, 1, [], [], '', shopName);
    }
  };

  const handleMinus = (e: React.MouseEvent) => {
    e.stopPropagation();
    decreaseProduct(product.id);
  };

  const handleRepeatItem = (item: CartItem) => {
    updateQuantity(item.id, item.quantity + 1);
    setIsRepeatModalOpen(false);
    toast.success(`1x ${product.name} ditambahkan dengan rincian yang sama`);
  };

  const handleAddNewCustomization = () => {
    setIsRepeatModalOpen(false);
    setIsOpen(true);
  };

  return (
    <>
      <Card
        onClick={handleCardClick}
        hoverable
        className="flex flex-col overflow-hidden bg-white border border-slate-200/80 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-md transition-all cursor-pointer p-2.5 sm:p-3 h-full group"
      >
        {/* Foto Menu (Kotak 1:1) */}
        <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-2.5">
          <img
            src={
              product.imageUrl ||
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60'
            }
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Info: Hanya Nama Menu, Harga & Tombol Tambah */}
        <div className="flex-1 flex flex-col justify-between">
          <h4 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 leading-snug min-h-[2rem]">
            {product.name}
          </h4>

          <div className="flex items-center justify-between gap-1.5 mt-2 pt-1">
            <span className="font-extrabold text-slate-900 text-xs sm:text-sm tracking-tight truncate">
              {formatCurrency(product.price)}
            </span>

            {/* Stepper / Tombol Tambah */}
            {quantity > 0 ? (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-1 bg-primary-50 rounded-full p-0.5 border border-primary-200 flex-shrink-0"
              >
                <button
                  type="button"
                  onClick={handleMinus}
                  className="w-6 h-6 rounded-full bg-white text-primary-700 shadow-2xs flex items-center justify-center hover:bg-primary-100 transition-colors active:scale-95"
                  aria-label="Kurang"
                >
                  <Minus size={12} strokeWidth={2.5} />
                </button>
                <span className="text-[11px] font-extrabold text-primary-700 min-w-[16px] text-center">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={handlePlus}
                  className="w-6 h-6 rounded-full bg-primary-500 text-white shadow-2xs flex items-center justify-center hover:bg-primary-600 transition-colors active:scale-95"
                  aria-label="Tambah"
                >
                  <Plus size={12} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePlus}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 active:scale-95 transition-all shadow-xs flex-shrink-0"
                aria-label="Tambah"
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Repeat Customization Choice Modal */}
      {isRepeatModalOpen && (
        <RepeatCustomizationModal
          isOpen={isRepeatModalOpen}
          onClose={() => setIsRepeatModalOpen(false)}
          product={product}
          existingItems={existingItems}
          onRepeatItem={handleRepeatItem}
          onAddNewCustomization={handleAddNewCustomization}
        />
      )}

      {/* Product Detail / Customization Modal */}
      {isOpen && (
        <ProductModal
          product={product}
          shopName={shopName}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default ProductCard;
