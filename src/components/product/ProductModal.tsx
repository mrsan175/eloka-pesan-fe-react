import { useState, useEffect } from "react";
import { Minus, Plus, Check } from "lucide-react";
import { BottomSheet, Button } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { useCartStore } from "@/stores";
import type {
  Product,
  CartItem,
  CartItemVariant,
  CartItemAddon,
} from "@/types";

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
    notes: string,
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
  const [selectedVariants, setSelectedVariants] = useState<CartItemVariant[]>(
    [],
  );
  const [selectedAddons, setSelectedAddons] = useState<CartItemAddon[]>([]);
  const [notes, setNotes] = useState("");

  const addItem = useCartStore((state) => state.addItem);

  // Synchronize state when modal opens or editItem changes
  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setQuantity(editItem.quantity);
        setSelectedVariants(editItem.variants || []);
        setSelectedAddons(editItem.addons || []);
        setNotes(editItem.notes || "");
      } else {
        setQuantity(1);
        setSelectedVariants([]);
        setSelectedAddons([]);
        setNotes("");
      }
    }
  }, [isOpen, editItem]);

  const addonGroups = product.addons?.reduce(
    (groups, addon) => {
      const category = addon.addonCategory?.name || addon.category || "Topping";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(addon);
      return groups;
    },
    {} as Record<string, typeof product.addons>,
  );

  // Calculate total price
  const calculateTotal = () => {
    let basePrice = parseFloat(product.price);

    let total = basePrice * quantity;

    selectedAddons.forEach((a) => {
      total += parseFloat(a.price) * a.quantity * quantity;
    });

    return total;
  };

  const handleAddonToggle = (addon: (typeof product.addons)[0]) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.addonId === addon.id);
      if (exists) {
        return prev.filter((a) => a.addonId !== addon.id);
      }

      const categoryAddons = product.addons.filter(
        (item) => item.addonCategoryId === addon.addonCategoryId
          || item.category === addon.category,
      );
      const isSingleChoice = addon.addonCategory?.selectionMode === "SINGLE"
        || (!addon.addonCategory && ((addon.category || "").toLowerCase().includes("ice")
          || (addon.category || "").toLowerCase().includes("sugar")));
      const filtered = isSingleChoice
        ? prev.filter(
            (item) =>
              !categoryAddons.some(
                (categoryAddon) => categoryAddon.id === item.addonId,
              ),
          )
        : prev;

      return [
        ...filtered,
        {
          addonId: addon.id,
          name: addon.name,
          price: addon.price,
          quantity: 1,
        },
      ];
    });
  };

  const handleSave = () => {
    if (editItem && onSaveEdit) {
      onSaveEdit(
        editItem.id,
        quantity,
        selectedVariants,
        selectedAddons,
        notes,
      );
      onClose();
    } else {
      addItem(
        product,
        quantity,
        selectedVariants,
        selectedAddons,
        notes,
        shopName,
      );
      onClose();
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editItem ? `Ubah: ${product.name}` : product.name}
      footer={
        <div className="space-y-3 pb-3">
          {/* Stepper Quantity */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-bold text-slate-900">
              Jumlah Pesanan
            </span>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-700 shadow-xs transition-all hover:bg-slate-200 active:scale-95"
                aria-label="Kurang"
              >
                <Minus size={15} strokeWidth={2.5} />
              </button>
              <span className="min-w-7 text-center text-sm font-extrabold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500 text-white shadow-xs transition-all hover:bg-primary-600 active:scale-95"
                aria-label="Tambah"
              >
                <Plus size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={handleSave}
            size="lg"
            className="flex h-12 w-full items-center justify-center rounded-2xl px-4 text-lg font-extrabold shadow-md shadow-primary-500/25 sm:px-5"
          >
            <span>{editItem ? "Simpan Perubahan" : "Tambah Pesanan"}</span>
            {"-"}
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
            "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60"
          }
          alt={product.name}
          className="w-24 h-24 rounded-2xl object-cover bg-slate-100 flex-shrink-0 shadow-xs"
        />
        <div className="flex-1 min-w-0">
          <span className="text-lg sm:text-xl font-extrabold text-slate-900 block">
            {formatCurrency(product.price)}
          </span>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 line-clamp-3 leading-relaxed">
            {product.description || "Pilihan menu lezat dan berkualitas"}
          </p>
        </div>
      </div>

      {/* Addons grouped by category */}
      {addonGroups && Object.entries(addonGroups).map(([category, addons]) => {
        const isSingleChoice = addons.some((addon) => addon.addonCategory?.selectionMode === "SINGLE")
          || addons.some((addon) => !addon.addonCategory
            && ((addon.category || "").toLowerCase().includes("ice")
              || (addon.category || "").toLowerCase().includes("sugar")));
        return (
          <section key={category} className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{category}</h3>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {isSingleChoice ? "Pilih satu" : "Boleh pilih lebih dari satu"}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                Opsional
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {addons.map((addon) => {
                const isSelected = selectedAddons.some((a) => a.addonId === addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    onClick={() => handleAddonToggle(addon)}
                    className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-all ${
                      isSelected
                        ? "border-primary-500 bg-primary-50/70 ring-2 ring-primary-500/15"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-slate-800 sm:text-sm">
                        {addon.name}
                      </span>
                      <span className="mt-0.5 block text-xs font-bold text-primary-600">
                        {Number(addon.price) > 0 ? `+${formatCurrency(addon.price)}` : "Gratis"}
                      </span>
                    </span>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                      isSelected
                        ? "border-primary-500 bg-primary-500 text-white"
                        : "border-slate-300 text-transparent"
                    }`}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

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
