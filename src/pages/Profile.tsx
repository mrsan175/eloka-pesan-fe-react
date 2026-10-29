import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, Button } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await authApi.logout();
    } catch (e) {
      // Continue client-side logout
    } finally {
      logout();
      setLoggingOut(false);
      toast.success('Berhasil keluar');
      navigate('/login');
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <Layout showBottomNav showHeader headerTitle="Profil Saya">
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <User size={48} className="text-secondary-400 mb-4" />
          <h2 className="text-lg font-bold text-secondary-900 mb-2">
            Belum Masuk Akun
          </h2>
          <p className="text-secondary-600 text-sm mb-6">
            Masuk atau daftar untuk mengelola pesanan dan akun Anda.
          </p>
          <Button onClick={() => navigate('/login')}>Masuk / Daftar</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBottomNav showHeader headerTitle="Profil Saya">
      <div className="min-h-screen bg-slate-50 p-4 pb-24 space-y-4">
        {/* User Card */}
        <Card className="p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xl font-bold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-secondary-900 truncate">
              {user.name}
            </h2>
            <p className="text-xs text-secondary-500 truncate">{user.email}</p>
            {user.phone && (
              <p className="text-xs text-secondary-500 mt-0.5">{user.phone}</p>
            )}
          </div>
        </Card>

        {/* Menu list */}
        <Card className="p-2 space-y-1">
          <button
            onClick={() => navigate('/history')}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 text-secondary-700 text-sm"
          >
            <span>Riwayat Pesanan</span>
            <ChevronRight size={18} className="text-secondary-400" />
          </button>
          <button
            onClick={() => toast.info('Fitur alamat pengiriman segera hadir')}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary-50 text-secondary-700 text-sm"
          >
            <span>Alamat Tersimpan</span>
            <ChevronRight size={18} className="text-secondary-400" />
          </button>
        </Card>

        {/* Logout */}
        <Button
          onClick={handleLogout}
          isLoading={loggingOut}
          variant="outline"
          className="w-full text-red-600 border-red-300 hover:bg-red-50"
          leftIcon={<LogOut size={18} />}
        >
          Keluar
        </Button>
      </div>
    </Layout>
  );
};

export default ProfilePage;