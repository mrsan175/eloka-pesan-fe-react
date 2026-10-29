import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Star,
  MapPin,
  Clock,
  Phone,
  ShoppingBag,
  ArrowRight,
  Search,
  X,
  Navigation,
  RefreshCcw,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { Card, Spinner, Badge, Button } from "@/components/ui";
import { ProductCard } from "@/components/product";
import { shopsApi, productsApi } from "@/lib/api";
import {
  formatCurrency,
  isShopOpen,
  calculateDistance,
  formatDistance,
} from "@/lib/utils";
import { useCartStore } from "@/stores";
import { requestGeolocation, useGeolocationStore } from "@/stores/geolocation";
import { toast } from "sonner";
import { reverseGeocode } from "@/lib/reverseGeocode";
import type { Shop, Product, Category } from "@/types";

const ShopDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<number | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const { latitude: userLatitude, longitude: userLongitude } =
    useGeolocationStore();
  const userLocation =
    userLatitude !== null && userLongitude !== null
      ? { latitude: userLatitude, longitude: userLongitude }
      : null;

  useEffect(() => {
    if (!userLocation) {
      setLocationLabel(null);
      return;
    }
    const controller = new AbortController();
    reverseGeocode(
      userLocation.latitude,
      userLocation.longitude,
      controller.signal,
    )
      .then(setLocationLabel)
      .catch((error) => {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        console.warn("Reverse geocoding unavailable:", error);
        setLocationLabel(null);
      });
    return () => controller.abort();
  }, [userLatitude, userLongitude]);

  // Refs for scroll and sticky behavior
  const stickyBarRef = useRef<HTMLDivElement | null>(null);
  const categoriesBarRef = useRef<HTMLDivElement | null>(null);
  const isManualScrolling = useRef(false);

  // Cart store
  const cartShopId = useCartStore((state) => state.shopId);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const cartSubtotal = useCartStore((state) => state.getSubtotal());

  useEffect(() => {
    if (id) {
      fetchShopData(id);
    }
  }, [id]);

  const fetchShopData = async (shopId: string) => {
    try {
      setLoading(true);
      const shopRes = await shopsApi.getById(shopId);
      const rawShop = shopRes.data?.data as any;
      const shopData = rawShop?.shop || rawShop;

      setShop(shopData);

      if (shopData?.categories && Array.isArray(shopData.categories)) {
        setCategories(shopData.categories);
      }

      // Always fetch products via productsApi to guarantee full variants and addons
      await fetchProducts(shopId);
    } catch (error) {
      toast.error("Gagal memuat data outlet");
      console.error(error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async (shopId: string) => {
    try {
      const response = await productsApi.getByShop(shopId, {
        limit: 100,
      });
      const rawData = response.data?.data as any;
      let fetchedProducts: Product[] = [];

      if (Array.isArray(rawData)) {
        fetchedProducts = rawData.map((p: any) => ({
          ...p,
          shopId: p.shopId || shopId,
        }));
      } else if (rawData && Array.isArray(rawData.products)) {
        fetchedProducts = rawData.products.map((p: any) => ({
          ...p,
          shopId: p.shopId || shopId,
        }));
      }

      setProducts(fetchedProducts);

      // If categories not loaded yet, extract unique ones from products
      if (categories.length === 0) {
        const uniqueCatMap = new Map<string, Category>();
        fetchedProducts.forEach((p) => {
          if (p.category && p.category.id) {
            uniqueCatMap.set(p.category.id, p.category);
          }
        });
        if (uniqueCatMap.size > 0) {
          setCategories(Array.from(uniqueCatMap.values()));
        }
      }
    } catch (error) {
      toast.error("Gagal memuat produk");
      console.error(error);
      setProducts([]);
    }
  };

  // Request user's location & compute distance to this outlet
  const requestLocation = async () => {
    if (isLoadingLocation) return;
    setIsLoadingLocation(true);
    try {
      const granted = await requestGeolocation();
      if (!granted) {
        toast.error(
          "Lokasi belum tersedia. Izinkan akses lokasi dari browser Anda.",
        );
      }
    } catch (error) {
      console.warn("Location unavailable:", error);
      toast.error(
        error instanceof Error ? error.message : "Gagal mendapatkan lokasi",
      );
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    if (!shop || shop.latitude == null || shop.longitude == null) return;
    if (!userLocation) {
      setDistance(null);
      return;
    }
    setDistance(
      calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        shop.latitude,
        shop.longitude,
      ),
    );
  }, [shop?.id, userLocation]);

  // Group products by category and handle search query
  const groupedCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)),
        )
      : products;

    if (categories.length === 0) {
      return [
        {
          id: "all",
          name: "Semua Menu",
          products: filtered,
        },
      ];
    }

    const list = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      products: filtered.filter(
        (p) => p.categoryId === cat.id || p.category?.id === cat.id,
      ),
    }));

    // Find any products without category or matching any listed category
    const categorizedProductIds = new Set(
      list.flatMap((c) => c.products.map((p) => p.id)),
    );
    const uncategorized = filtered.filter(
      (p) => !categorizedProductIds.has(p.id),
    );

    const result = list.filter((c) => c.products.length > 0);
    if (uncategorized.length > 0) {
      result.push({
        id: "other",
        name: "Menu Lainnya",
        products: uncategorized,
      });
    }

    return result;
  }, [categories, products, searchQuery]);

  // Set default active category on load
  useEffect(() => {
    if (groupedCategories.length === 0) {
      setActiveCategoryId(null);
      return;
    }

    const activeCategoryStillExists = groupedCategories.some(
      (category) => category.id === activeCategoryId,
    );
    if (!activeCategoryStillExists) {
      setActiveCategoryId(groupedCategories[0].id);
    }
  }, [groupedCategories, activeCategoryId]);

  // Center active category pill horizontally in the categories bar
  const scrollCategoryPillIntoView = (catId: string) => {
    if (!categoriesBarRef.current) return;
    const pill = categoriesBarRef.current.querySelector(
      `[data-category-id="${catId}"]`,
    ) as HTMLElement | null;

    if (pill) {
      const container = categoriesBarRef.current;
      const pillLeft = pill.offsetLeft;
      const pillWidth = pill.offsetWidth;
      const containerWidth = container.offsetWidth;

      container.scrollTo({
        left: pillLeft - containerWidth / 2 + pillWidth / 2,
        behavior: "smooth",
      });
    }
  };

  // Window scrollspy: update active category on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (isManualScrolling.current || searchQuery) return;

      const headerHeight = 56;
      const stickyHeight = stickyBarRef.current?.offsetHeight || 90;
      const threshold = headerHeight + stickyHeight + 30;

      // Check if scrolled near the bottom of document
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;

      if (scrollY + windowHeight >= docHeight - 80) {
        const lastCat = groupedCategories[groupedCategories.length - 1];
        if (lastCat && lastCat.id !== activeCategoryId) {
          setActiveCategoryId(lastCat.id);
          scrollCategoryPillIntoView(lastCat.id);
        }
        return;
      }

      // Check which category section is currently passing the threshold
      let currentActiveId: string | null = null;

      for (const cat of groupedCategories) {
        const el = document.getElementById(`cat-section-${cat.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= threshold && rect.bottom > threshold) {
            currentActiveId = cat.id;
            break;
          } else if (rect.top <= threshold) {
            currentActiveId = cat.id;
          }
        }
      }

      if (!currentActiveId && groupedCategories.length > 0) {
        currentActiveId = groupedCategories[0].id;
      }

      if (currentActiveId && currentActiveId !== activeCategoryId) {
        setActiveCategoryId(currentActiveId);
        scrollCategoryPillIntoView(currentActiveId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [groupedCategories, activeCategoryId, searchQuery]);

  // Smooth scroll to category when user clicks on a category pill
  const scrollToCategory = (catId: string) => {
    setActiveCategoryId(catId);
    scrollCategoryPillIntoView(catId);
    isManualScrolling.current = true;

    const target = document.getElementById(`cat-section-${catId}`);
    if (target) {
      const headerHeight = 56;
      const stickyHeight = stickyBarRef.current?.offsetHeight || 90;
      const targetRect = target.getBoundingClientRect();
      const currentScrollY =
        window.scrollY || document.documentElement.scrollTop;
      const targetScrollY =
        currentScrollY + targetRect.top - headerHeight - stickyHeight + 4;

      window.scrollTo({
        top: Math.max(0, targetScrollY),
        behavior: "smooth",
      });

      setTimeout(() => {
        isManualScrolling.current = false;
      }, 700);
    }
  };

  if (loading) {
    return (
      <Layout showBottomNav={false} showHeader>
        <div className="flex items-center justify-center min-h-[70vh]">
          <Spinner size="lg" label="Memuat outlet..." />
        </div>
      </Layout>
    );
  }

  if (!shop) {
    return (
      <Layout showBottomNav={false} showHeader>
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
          <p className="text-secondary-500 mb-4">Outlet tidak ditemukan</p>
          <Button onClick={() => navigate("/")}>Kembali ke Beranda</Button>
        </div>
      </Layout>
    );
  }

  const open = isShopOpen(shop);
  const isCurrentShopCart =
    totalItems > 0 &&
    (!cartShopId || cartShopId === shop.id || cartShopId === id);

  return (
    <Layout
      showBottomNav={true}
      showHeader
      headerShowBack
      headerTitle={shop.name}
    >
      <div className="min-h-screen bg-slate-50/70">
        {/* Banner Outlet Image */}
        <div className="relative aspect-[21/9] sm:aspect-[16/7] w-full bg-slate-200 overflow-hidden">
          <img
            src={
              shop.logoUrl ||
              "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=70"
            }
            alt={shop.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {!open && (
            <div className="absolute top-4 right-4">
              <Badge variant="danger" size="md" className="font-bold shadow-md">
                Outlet Tutup
              </Badge>
            </div>
          )}
        </div>

        {/* Outlet Info Box (Overlap Card) */}
        <div className="max-w-xl mx-auto px-4 -mt-8 relative z-10">
          <Card className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug">
                  {shop.name}
                </h1>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {shop.description ||
                    "Pilihan hidangan terbaik untuk hari Anda"}
                </p>
              </div>

              {shop.rating && (
                <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl border border-amber-200/60 font-semibold text-xs flex-shrink-0">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  <span>{shop.rating.toFixed(1)}</span>
                </div>
              )}
            </div>

            {/* Metadata Pills */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-primary-600 flex-shrink-0" />
                <span>
                  {shop.openTime} - {shop.closeTime}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary-600 flex-shrink-0" />
                <span className="truncate max-w-[200px]">{shop.address}</span>
              </div>

              {shop.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={14} className="text-primary-600 flex-shrink-0" />
                  <span>{shop.phone}</span>
                </div>
              )}
            </div>

            {/* Location & Distance Section */}
            {shop.latitude != null && shop.longitude != null && (
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(`/map?shopId=${shop.id}&edit=location`)
                  }
                  disabled={isLoadingLocation}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 text-left disabled:opacity-60"
                >
                  <Navigation size={17} className="text-primary-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Lokasi Anda
                    </span>
                    <span className="block truncate text-xs font-medium text-slate-700">
                      {userLocation
                        ? locationLabel || "Mencari alamat..."
                        : "Aktifkan lokasi untuk melihat posisi Anda"}
                    </span>
                  </span>
                  <ArrowRight
                    size={17}
                    className="text-primary-600 flex-shrink-0"
                  />
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/map?shopId=${shop.id}`)}
                  className="w-full flex items-center gap-3 rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-left"
                >
                  <MapPin size={17} className="text-primary-600" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Lokasi Outlet
                    </span>
                    <span className="block truncate text-xs font-medium text-slate-700">
                      {shop.address}
                    </span>
                  </span>
                  <ArrowRight
                    size={17}
                    className="text-primary-600 flex-shrink-0"
                  />
                </button>

                {/* Compact distance info */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Navigation size={13} className="text-primary-600" />
                    {distance != null ? (
                      <span>
                        <span className="font-medium">Jarak</span>{" "}
                        {formatDistance(distance)}
                      </span>
                    ) : (
                      <span>Jarak belum tersedia</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={requestLocation}
                    disabled={isLoadingLocation}
                    className="text-[11px] font-bold text-primary-600 hover:text-primary-700 whitespace-nowrap disabled:opacity-50"
                  >
                    {isLoadingLocation ? (
                      <span className="flex items-center gap-1.5">
                        <Spinner size="sm" />
                        <span>Mendapatkan...</span>
                      </span>
                    ) : userLocation ? (
                      <span className="flex items-center gap-1">
                        <RefreshCcw size={12} />
                        <span>Perbarui Lokasi</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Navigation size={12} />
                        <span>Aktifkan Lokasi</span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Floating/Sticky Search & Categories Bar */}
        <div
          ref={stickyBarRef}
          className="sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.06)] px-4 py-3 mt-4 space-y-2.5 transition-all"
        >
          <div className="max-w-xl mx-auto space-y-2.5">
            {/* Search Input Above Categories */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu di outlet ini..."
                className="w-full pl-9 pr-9 py-2 bg-slate-100 hover:bg-slate-200/60 focus:bg-white text-xs sm:text-sm rounded-xl border border-transparent focus:border-primary-500 focus:outline-none transition-all placeholder:text-slate-400 font-medium text-slate-800"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center text-slate-500 transition-colors"
                  aria-label="Hapus pencarian"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {/* Categories Horizontal Pills */}
            {groupedCategories.length > 0 && !searchQuery && (
              <div
                ref={categoriesBarRef}
                className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-0.5"
              >
                {groupedCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    data-category-id={category.id}
                    onClick={() => scrollToCategory(category.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                      activeCategoryId === category.id
                        ? "bg-slate-900 text-white shadow-xs scale-105"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Menu Items Content */}
        <div
          className={`max-w-xl mx-auto px-4 mt-4 space-y-6 ${
            isCurrentShopCart ? "pb-28" : "pb-10"
          }`}
        >
          {/* Active Search Result Notification */}
          {searchQuery && (
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-slate-500">
                Menampilkan hasil untuk{" "}
                <span className="font-bold text-slate-900">
                  "{searchQuery}"
                </span>
              </span>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs text-primary-600 font-semibold hover:underline"
              >
                Reset
              </button>
            </div>
          )}

          {groupedCategories.length > 0 ? (
            groupedCategories.map((cat) => (
              <div
                key={cat.id}
                id={`cat-section-${cat.id}`}
                className="space-y-3 scroll-mt-36"
              >
                <div className="flex items-center justify-between px-1 pt-1 border-b border-slate-100 pb-2">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{cat.name}</span>
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {cat.products.length}
                    </span>
                  </h2>
                </div>

                {/* 2-Column Grid of Product Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {cat.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      shopName={shop.name}
                    />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <Card className="py-14 text-center border-dashed border-slate-200 rounded-2xl">
              <p className="text-sm font-semibold text-slate-700">
                {searchQuery
                  ? `Tidak ada menu yang cocok dengan "${searchQuery}"`
                  : "Belum ada menu tersedia di outlet ini"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery
                  ? "Coba gunakan kata kunci lainnya"
                  : "Silakan cek kembali beberapa saat lagi"}
              </p>
            </Card>
          )}
        </div>

        {/* Floating Cart / Checkout Bar hovering right above BottomNav */}
        {isCurrentShopCart && (
          <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-0 right-0 px-4 z-40 pointer-events-none animate-slide-up">
            <div className="max-w-xl mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 p-3 sm:p-3.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] flex items-center justify-between gap-3 pointer-events-auto">
              <button
                type="button"
                onClick={() => navigate("/checkout")}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <div className="w-11 h-11 rounded-2xl bg-primary-50 text-primary-600 border border-primary-200/60 flex items-center justify-center relative flex-shrink-0">
                  <ShoppingBag size={20} />
                  <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] bg-primary-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm">
                    {totalItems}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] text-slate-500 font-medium block">
                    {totalItems} item dipilih
                  </span>
                  <span className="text-sm sm:text-base font-bold text-slate-900 truncate block">
                    {formatCurrency(cartSubtotal)}
                  </span>
                </div>
              </button>

              <Button
                onClick={() => navigate("/checkout")}
                size="md"
                className="rounded-xl px-5 sm:px-6 h-11 text-xs sm:text-sm font-bold shadow-md shadow-primary-500/25 flex-shrink-0"
                rightIcon={<ArrowRight size={16} />}
              >
                Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ShopDetailPage;
