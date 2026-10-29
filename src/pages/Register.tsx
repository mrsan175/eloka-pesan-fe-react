import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Card, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { authApi } from '@/lib/api';
import { isValidEmail, isValidPhone } from '@/lib/utils';
import { toast } from 'sonner';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { login } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Nama harus diisi');
      return false;
    }

    if (!isValidEmail(formData.email)) {
      toast.error('Format email tidak valid');
      return false;
    }

    if (!isValidPhone(formData.phone)) {
      toast.error('Format nomor telepon tidak valid');
      return false;
    }

    if (formData.password.length < 6) {
      toast.error('Password minimal 6 karakter');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await authApi.register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });

      // Auto login after successful registration
      const loginResponse = await authApi.login(formData.email, formData.password);
      const { user, accessToken, refreshToken } = loginResponse.data.data;

      login(user, accessToken, refreshToken);
      toast.success('Registrasi berhasil!');
      navigate(redirect);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registrasi gagal');
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
            <h1 className="text-3xl font-display font-bold mb-2">Daftar Akun</h1>
            <p className="text-primary-100">Buat akun baru untuk mulai memesan</p>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 px-6 -mt-8 pb-8">
          <Card className="p-6 shadow-xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nama Lengkap"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                leftIcon={<User size={18} />}
                autoComplete="name"
                required
              />

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
                label="Nomor Telepon"
                type="tel"
                placeholder="08123456789"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                leftIcon={<Phone size={18} />}
                autoComplete="tel"
                required
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 6 karakter"
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
                autoComplete="new-password"
                required
              />

              <Input
                label="Konfirmasi Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password lagi"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                leftIcon={<Lock size={18} />}
                autoComplete="new-password"
                required
              />

              <Button
                type="submit"
                isLoading={isLoading}
                size="lg"
                className="w-full font-semibold"
              >
                Daftar
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-secondary-600">
                Sudah punya akun?{' '}
                <Link
                  to={`/login${redirect !== '/' ? `?redirect=${redirect}` : ''}`}
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Masuk Sekarang
                </Link>
              </p>
            </div>

            <p className="text-xs text-secondary-500 text-center mt-4">
              Dengan mendaftar, Anda menyetujui{' '}
              <Link to="/terms" className="text-primary-600 underline">
                Syarat & Ketentuan
              </Link>{' '}
              dan{' '}
              <Link to="/privacy" className="text-primary-600 underline">
                Kebijakan Privasi
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RegisterPage;