import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error('Semua field harus diisi');
      return;
    }

    try {
      setIsLoading(true);
      const response = await authApi.login(formData.email, formData.password);
      const { user, accessToken, refreshToken } = response.data.data;

      login(user, accessToken, refreshToken);
      toast.success('Login berhasil!');
      navigate(redirect);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login gagal');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout showBottomNav={false} showHeader={false}>
      <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
        {/* Header */}
        <div className="bg-primary-500 text-white px-6 pt-safe-top pb-12 rounded-b-3xl">
          <div className="pt-8">
            <h1 className="text-3xl font-display font-bold mb-2">Selamat Datang</h1>
            <p className="text-primary-100">Masuk untuk melanjutkan pesanan Anda</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 px-6 -mt-8">
          <Card className="p-6 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                leftIcon={<Mail size={18} />}
                autoComplete="email"
                required
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                leftIcon={<Lock size={18} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 hover:text-secondary-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                autoComplete="current-password"
                required
              />

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Lupa Password?
                </Link>
              </div>

              <Button
                type="submit"
                isLoading={isLoading}
                size="lg"
                className="w-full font-semibold"
              >
                Masuk
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-secondary-600">
                Belum punya akun?{' '}
                <Link
                  to={`/register${redirect !== '/' ? `?redirect=${redirect}` : ''}`}
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Daftar Sekarang
                </Link>
              </p>
            </div>
          </Card>

          {/* Or Continue */}
          <div className="mt-8 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-secondary-500">
                  Atau lanjutkan sebagai
                </span>
              </div>
            </div>

            <Button
              onClick={() => navigate(redirect)}
              variant="outline"
              size="lg"
              className="w-full mt-4"
            >
              Lanjut Tanpa Login
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default LoginPage;