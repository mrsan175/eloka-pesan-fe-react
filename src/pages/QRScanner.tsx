import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { X, RefreshCw, AlertCircle, Camera } from 'lucide-react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui';
import { parseQRCode } from '@/lib/utils';
import { toast } from 'sonner';

const QRScannerPage = () => {
  const navigate = useNavigate();
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isStoppingRef = useRef(false);

  // Safely stop and clear scanner
  const stopScanner = async () => {
    if (!scannerRef.current || isStoppingRef.current) return;

    try {
      isStoppingRef.current = true;
      const state = scannerRef.current.getState();
      if (
        state === Html5QrcodeScannerState.SCANNING ||
        state === Html5QrcodeScannerState.PAUSED
      ) {
        await scannerRef.current.stop();
      }
      scannerRef.current.clear();
    } catch (e) {
      // Ignore cannot stop errors
      console.warn('Scanner stop warn:', e);
    } finally {
      scannerRef.current = null;
      isStoppingRef.current = false;
    }
  };

  const handleQRResult = async (data: string) => {
    await stopScanner();

    const parsed = parseQRCode(data);

    if (!parsed) {
      toast.error('QR Code tidak dikenali');
      setTimeout(() => {
        initScanner(facingMode);
      }, 1500);
      return;
    }

    if (parsed.type === 'shop') {
      toast.success('Outlet ditemukan!');
      navigate(`/shops/${parsed.id}`, { replace: true });
    } else if (parsed.type === 'product') {
      toast.success('Produk ditemukan!');
      navigate(`/products/${parsed.id}`, { replace: true });
    } else {
      toast.error('Format QR Code tidak didukung');
      setTimeout(() => {
        initScanner(facingMode);
      }, 1500);
    }
  };

  const initScanner = async (mode: 'environment' | 'user') => {
    try {
      setIsInitializing(true);
      setCameraError(null);

      // Stop previous instance if exists
      await stopScanner();

      const element = document.getElementById('qr-reader-container');
      if (!element) return;

      const html5QrCode = new Html5Qrcode('qr-reader-container');
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: mode },
        {
          fps: 10,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edgeSize = Math.floor(minEdge * 0.7);
            return { width: edgeSize, height: edgeSize };
          },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleQRResult(decodedText);
        },
        () => {
          // ignore scan failures per frame
        }
      );
    } catch (err: any) {
      console.error('Html5Qrcode start error:', err);
      const msg =
        err?.message?.includes('NotAllowedError') || err?.name === 'NotAllowedError'
          ? 'Izin kamera ditolak. Berikan izin kamera di browser untuk memindai QR Code.'
          : err?.message?.includes('NotFoundError') || err?.name === 'NotFoundError'
          ? 'Kamera tidak ditemukan pada perangkat Anda.'
          : 'Tidak dapat memulai kamera. Pastikan browser mendukung akses kamera.';
      setCameraError(msg);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    initScanner(facingMode);

    return () => {
      stopScanner();
    };
  }, [facingMode]);

  const handleClose = async () => {
    await stopScanner();
    navigate(-1);
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <Layout showBottomNav={false} showHeader={false}>
      <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between overflow-hidden">
        {/* Top Controls Header */}
        <div className="absolute top-0 left-0 right-0 pt-safe-top p-4 z-30 flex items-center justify-between">
          <Button
            onClick={handleClose}
            variant="ghost"
            size="sm"
            className="bg-black/60 backdrop-blur-md text-white hover:bg-black/80 border border-white/20 rounded-xl"
            leftIcon={<X size={18} />}
          >
            Tutup
          </Button>

          <Button
            onClick={handleFlipCamera}
            variant="ghost"
            size="sm"
            className="bg-black/60 backdrop-blur-md text-white hover:bg-black/80 border border-white/20 rounded-xl"
            leftIcon={<RefreshCw size={16} />}
          >
            Ganti Kamera
          </Button>
        </div>

        {/* Viewfinder & Video Container */}
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          {/* HTML5 QR Container */}
          <div
            id="qr-reader-container"
            className="w-full h-full overflow-hidden [&>video]:h-full [&>video]:w-full [&>video]:object-cover"
          />

          {/* Camera Error State */}
          {cameraError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-slate-900 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center">
                <AlertCircle size={28} />
              </div>
              <div className="space-y-1.5 max-w-xs">
                <h3 className="text-white font-bold text-base">Gagal Mengakses Kamera</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{cameraError}</p>
              </div>
              <Button
                onClick={() => initScanner(facingMode)}
                size="md"
                className="rounded-xl px-5"
                leftIcon={<Camera size={16} />}
              >
                Coba Lagi
              </Button>
            </div>
          )}

          {/* Scanning Box Graphic Overlay */}
          {!cameraError && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="relative w-64 h-64 rounded-3xl border border-white/30">
                {/* Corners */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-2xl" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-2xl" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-2xl" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-2xl" />

                {/* Animated Scan Line */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl">
                  <div className="w-full h-1 bg-gradient-to-r from-transparent via-primary-500 to-transparent shadow-[0_0_12px_rgba(237,117,26,0.8)] animate-slide-down" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Instruction Footer */}
        <div className="absolute bottom-0 left-0 right-0 pb-safe-bottom p-6 z-30 text-center bg-gradient-to-t from-black/90 via-black/60 to-transparent">
          <h2 className="text-white text-base font-bold mb-1">
            {isInitializing ? 'Menyiapkan Kamera...' : 'Arahkan ke QR Code'}
          </h2>
          <p className="text-white/70 text-xs max-w-xs mx-auto">
            Arahkan kamera tepat ke QR Code outlet atau nomor meja Anda
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default QRScannerPage;
