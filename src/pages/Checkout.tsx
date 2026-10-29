import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Clock,
  CreditCard,
  Plus,
  Minus,
  ArrowLeft,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, Button, Input } from "@/components/ui";
import { useCartStore } from "@/stores";
import { formatCurrency } from "@/lib/utils";
import { ordersApi } from "@/lib/api";
import { toast } from "sonner";
import type { CreateOrderRequest } from "@/types";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, shopId, shopName, updateQuantity, clearCart, getSubtotal } =
    useCartStore();

  const [orderType, setOrderType] = useState<
    "DINE_IN" | "TAKEAWAY" | "DELIVERY"
  >("TAKEAWAY");
  const [tableNumber, setTableNumber] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      if (shopId) {
        navigate(`/shops/${shopId}`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [items.length, navigate, shopId]);

  const subtotal = getSubtotal();
  const tax = subtotal * 0.1;
  const deliveryFee = orderType === "DELIVERY" ? 15000 : 0;
  const total = subtotal + tax + deliveryFee;

  const handleSubmit = async () => {
    if (!shopId) {
      toast.error("Data outlet tidak ditemukan");
      return;
    }

    if (items.length === 0) {
      toast.error("Keranjang pesanan masih kosong");
      return;
    }

    if (orderType === "DINE_IN" && !tableNumber.trim()) {
      toast.error("Nomor meja harus diisi untuk makan di tempat");
      return;
    }

    if (orderType === "DELIVERY" && !deliveryAddress.trim()) {
      toast.error("Alamat pengiriman harus diisi");
      return;
    }

    try {
      setIsSubmitting(true);

      const orderData: CreateOrderRequest = {
        shopId,
        orderType,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantIds: item.variants.map((v) => v.variantId),
          addonIds: item.addons.map((a) => a.addonId),
          notes: item.notes,
        })),
        notes,
      };

      if (orderType === "DINE_IN" && tableNumber.trim()) {
        orderData.tableNumber = tableNumber.trim();
      }

      if (orderType === "TAKEAWAY" && pickupTime) {
        orderData.pickupTime = pickupTime;
      }

      const response = await ordersApi.create(orderData);
      const rawOrder = response.data?.data as any;
      const order = rawOrder?.order || rawOrder;

      clearCart();
      toast.success("Pesanan berhasil dibuat!");
      navigate(`/payment/${order.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal membuat pesanan");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout
        showBottomNav={false}
        showHeader
        headerTitle="Checkout"
        headerShowBack
      >
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center space-y-4">
          <p className="text-slate-500 text-sm">
            Belum ada menu yang dipilih untuk checkout.
          </p>
          <Button
            onClick={() =>
              shopId ? navigate(`/shops/${shopId}`) : navigate("/")
            }
          >
            Pilih Menu
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      showBottomNav={false}
      showHeader
      headerTitle="Konfirmasi Pesanan"
      headerShowBack
    >
      <div className="min-h-screen bg-slate-50/70 pb-32">
        <div className="max-w-xl mx-auto p-4 sm:p-5 space-y-4">
          {/* Outlet Banner */}
          {shopName && (
            <div className="flex items-center justify-between bg-white border border-slate-200/80 px-4 py-3 rounded-2xl shadow-xs">
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Outlet Pemesanan
                </span>
                <span className="text-sm font-bold text-slate-900 truncate block">
                  {shopName}
                </span>
              </div>
              {shopId && (
                <button
                  type="button"
                  onClick={() => navigate(`/shops/${shopId}`)}
                  className="text-xs text-primary-600 font-bold hover:text-primary-700 flex items-center gap-1 flex-shrink-0"
                >
                  <ArrowLeft size={13} />
                  <span>Tambah Menu</span>
                </button>
              )}
            </div>
          )}

          {/* Ordered Menu Items List */}
          <Card className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-3.5">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              Rincian Menu ({items.length} item)
            </h3>

            <div className="divide-y divide-slate-100 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="pt-3 first:pt-0 flex gap-3 items-start justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">
                      {item.product?.name}
                    </h4>

                    {/* Variants */}
                    {item.variants && item.variants.length > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.variants.map((v) => v.optionName).join(", ")}
                      </p>
                    )}

                    {/* Addons */}
                    {item.addons && item.addons.length > 0 && (
                      <p className="text-xs text-slate-500">
                        +{" "}
                        {item.addons
                          .map((a) => `${a.name} (x${a.quantity})`)
                          .join(", ")}
                      </p>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5">
                        Catatan: {item.notes}
                      </p>
                    )}

                    <span className="font-bold text-slate-900 text-xs sm:text-sm mt-1.5 block">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-1.5 bg-slate-100 rounded-full p-1 border border-slate-200 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded-full bg-white text-slate-700 shadow-xs flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-colors"
                      aria-label="Kurang"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-xs font-bold text-slate-800 min-w-[18px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded-full bg-primary-500 text-white shadow-xs flex items-center justify-center hover:bg-primary-600 active:scale-95 transition-colors"
                      aria-label="Tambah"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Order Type */}
          <Card className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3">
              Tipe Pesanan
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "DINE_IN", label: "Dine In" },
                { key: "TAKEAWAY", label: "Takeaway" },
                { key: "DELIVERY", label: "Delivery" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setOrderType(key as typeof orderType)}
                  className={`py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                    orderType === key
                      ? "border-primary-500 bg-primary-50 text-primary-700 shadow-xs"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {orderType === "DINE_IN" && (
              <div className="mt-4">
                <Input
                  label="Nomor Meja"
                  placeholder="Contoh: Meja 05, A1, B3"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  leftIcon={<MapPin size={18} />}
                  required
                />
              </div>
            )}

            {orderType === "TAKEAWAY" && (
              <div className="mt-4">
                <Input
                  label="Estimasi Jam Pengambilan (Opsional)"
                  type="datetime-local"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  leftIcon={<Clock size={18} />}
                />
              </div>
            )}

            {orderType === "DELIVERY" && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Alamat Pengiriman Lengkap{" "}
                  <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Tuliskan alamat lengkap untuk pengiriman (Jalan, nomor rumah, patokan, RT/RW, kelurahan, kecamatan, kota)"
                  rows={3}
                  required
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-slate-400"
                />
              </div>
            )}
          </Card>

          {/* Notes for Kitchen/Outlet */}
          <Card className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-2">
              Catatan untuk Outlet
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Sambal dipisah, alat makan disediakan..."
              rows={2}
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 placeholder:text-slate-400"
            />
          </Card>

          {/* Payment & Bill Summary */}
          <Card className="p-4 sm:p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-3">
              Rincian Pembayaran
            </h3>
            <div className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between text-slate-600">
                <span>
                  Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} item)
                </span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pajak Resto (10%)</span>
                <span className="font-semibold text-slate-900">
                  {formatCurrency(tax)}
                </span>
              </div>
              {orderType === "DELIVERY" && (
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Pengantaran</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(deliveryFee)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-900 pt-3 border-t border-slate-100">
                <span>Total Tagihan</span>
                <span className="text-primary-600">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Fixed Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 pb-safe-bottom z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="max-w-xl mx-auto p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 block font-medium">
                Total Pembayaran
              </span>
              <span className="text-base sm:text-lg font-extrabold text-slate-900 block truncate">
                {formatCurrency(total)}
              </span>
            </div>

            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              size="lg"
              className="rounded-2xl px-6 h-12 text-sm sm:text-base font-bold shadow-md shadow-primary-500/25 flex-shrink-0"
              leftIcon={<CreditCard size={18} />}
            >
              Lanjut ke Pembayaran
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CheckoutPage;
