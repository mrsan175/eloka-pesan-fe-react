import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X, TrendingUp } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, Spinner, Input } from '@/components/ui';
import { ShopCard } from '@/components/shop';
import { shopsApi } from '@/lib/api';
import { useDebounce } from '@/lib/hooks';
import { toast } from 'sonner';
import type { Shop } from '@/types';

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  const debouncedQuery = useDebounce(query, 500);

  // Recent searches (stored in localStorage)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      setRecentSearches(JSON.parse(recent));
    }
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      searchShops(debouncedQuery);
      setSearchParams({ q: debouncedQuery }, { replace: true });
    } else {
      setShops([]);
      setHasSearched(false);
      setSearchParams({}, { replace: true });
    }
  }, [debouncedQuery]);

  const searchShops = async (searchQuery: string) => {
    try {
      setLoading(true);
      setHasSearched(true);
      const response = await shopsApi.getAll({ search: searchQuery, limit: 50 });
      const rawData = response.data?.data;
      if (Array.isArray(rawData)) {
        setShops(rawData);
      } else if (rawData && Array.isArray((rawData as any).shops)) {
        setShops((rawData as any).shops);
      } else {
        setShops([]);
      }
    } catch (error) {
      toast.error('Gagal mencari outlet');
      console.error(error);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setQuery(value);
  };

  const handleClear = () => {
    setQuery('');
    setShops([]);
    setHasSearched(false);
    setSearchParams({}, { replace: true });
  };

  const handleRecentSearch = (term: string) => {
    setQuery(term);
  };

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;

    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Save search when navigating away
  useEffect(() => {
    return () => {
      if (query.trim()) {
        saveRecentSearch(query.trim());
      }
    };
  }, [query]);

  return (
    <Layout showBottomNav showHeader={false}>
      <div className="min-h-screen bg-slate-50">
        {/* Search Header */}
        <div className="bg-white border-b border-secondary-200 px-4 pt-safe-top pb-3 sticky top-0 z-30">
          <div className="flex items-center gap-2 pt-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 text-secondary-600 hover:text-secondary-900"
            >
              <X size={24} />
            </button>
            <div className="flex-1">
              <Input
                placeholder="Cari nama outlet atau lokasi..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                leftIcon={<SearchIcon size={18} />}
                rightIcon={
                  query && (
                    <button onClick={handleClear} className="p-1 hover:text-secondary-700">
                      <X size={16} />
                    </button>
                  )
                }
                autoFocus
              />
            </div>
          </div>
        </div>

        <div className="p-4">
          {/* Recent Searches */}
          {!query && recentSearches.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-secondary-900 flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary-500" />
                  Pencarian Terakhir
                </h3>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-primary-600 font-medium"
                >
                  Hapus
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleRecentSearch(term)}
                    className="px-3 py-1.5 bg-white border border-secondary-200 rounded-full text-sm text-secondary-700 hover:border-primary-500 hover:text-primary-600"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="py-12">
              <Spinner size="lg" label="Mencari outlet..." />
            </div>
          )}

          {/* Search Results */}
          {!loading && hasSearched && (
            <>
              {shops.length > 0 ? (
                <div>
                  <h3 className="text-sm font-semibold text-secondary-900 mb-3">
                    Ditemukan {shops.length} outlet
                  </h3>
                  <div className="space-y-3">
                    {shops.map((shop) => (
                      <ShopCard key={shop.id} shop={shop} variant="horizontal" />
                    ))}
                  </div>
                </div>
              ) : (
                <Card className="py-12 text-center">
                  <SearchIcon size={48} className="mx-auto text-secondary-300 mb-3" />
                  <h3 className="font-semibold text-secondary-900 mb-1">
                    Outlet tidak ditemukan
                  </h3>
                  <p className="text-sm text-secondary-500">
                    Coba kata kunci lain atau periksa ejaan Anda
                  </p>
                </Card>
              )}
            </>
          )}

          {/* Empty State */}
          {!query && !loading && recentSearches.length === 0 && (
            <div className="py-12 text-center">
              <SearchIcon size={48} className="mx-auto text-secondary-300 mb-3" />
              <h3 className="font-semibold text-secondary-900 mb-1">
                Cari Outlet Favorit Anda
              </h3>
              <p className="text-sm text-secondary-500">
                Masukkan nama outlet atau lokasi di atas
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
