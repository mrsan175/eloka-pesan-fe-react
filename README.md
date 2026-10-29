# 📖 Dokumentasi Lengkap Frontend Eloka Pesan

Aplikasi frontend berbasis **Mobile-First Ordering Web App** untuk sistem pemesanan makanan dan minuman **Eloka Pesan**. Dibangun menggunakan **Vite**, **React 18**, **TypeScript**, **TailwindCSS**, dan **Zustand**.

---

## 📑 Daftar Isi
1. [Gambaran Arsitektur & Tech Stack](#-gambaran-arsitektur--tech-stack)
2. [Fitur-Fitur Utama](#-fitur-fitur-utama)
3. [Struktur Direktori Proyek](#-struktur-direktori-proyek)
4. [Instalasi & Menjalankan Proyek](#-instalasi--menjalankan-proyek)
5. [Manajemen State (Zustand)](#-manajemen-state-zustand)
6. [Integrasi API & Interceptor](#-integrasi-api--interceptor)
7. [Daftar Halaman & Routing](#-daftar-halaman--routing)
8. [Komponen UI & Layout](#-komponen-ui--layout)
9. [Fitur QR Scanner](#-fitur-qr-scanner)
10. [Alur Pembayaran & Integrasi Payment Gateway](#-alur-pembayaran--integrasi-payment-gateway)
11. [Build & Deployment](#-build--deployment)

---

## 🚀 Gambaran Arsitektur & Tech Stack

Aplikasi ini dirancang dengan pendekatan **Mobile-First Responsive Design**, dioptimalkan untuk tampilan smartphone (iOS Safari & Android Chrome) lengkap dengan safe-area padding untuk perangkat berponi/notch.

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Framework** | React 18 + Vite 5 | Fast HMR & performa bundling optimal |
| **Bahasa** | TypeScript (Strict Mode) | Type-safety menyeluruh dari API ke UI |
| **Styling** | TailwindCSS + PostCSS | Custom theme (*primary orange*, *secondary slate*, *accent green*) |
| **State Management** | Zustand (dengan Persist) | State global untuk Autentikasi dan Keranjang Belanja |
| **Routing** | React Router v6 | Navigasi SPA dengan *Protected* & *Guest* Route Guards |
| **HTTP Client** | Axios | Auto token injection & refresh token retry flow |
| **QR Scanner** | `html5-qrcode` | Scan QR Code via kamera perangkat/webcam secara real-time |
| **Notifikasi** | Sonner | Toast feedback modern & responsif |
| **Ikon** | Lucide React | Ikon modern dan konsisten |

---

## ✨ Fitur-Fitur Utama

1. **Mobile-First UX / UI**:
   - Bottom navigation bar yang sticky dan responsif.
   - Safe-area inset support (`env(safe-area-inset-*)`).
   - Tampilan modal berbasis **Bottom Sheet** ala native app.
2. **Katalog Outlet & Menu**:
   - Menampilkan daftar outlet terdekat dan semua outlet.
   - Informasi detail outlet: jam buka/tutup, status buka real-time, alamat, telepon, rating.
   - Filter menu berdasarkan kategori.
   - Modal varian produk (ukuran, tingkat manis, varian lain) & addon opsional (topping, ekstra, dll).
3. **Pencarian Cepat & Riwayat Pencarian**:
   - Pencarian toko secara debounced (500ms).
   - Riwayat pencarian yang disimpan ke `localStorage`.
4. **QR Code Scanner**:
   - Pemindaian QR Code meja atau outlet langsung melalui kamera perangkat.
   - Fitur ganti kamera (depan/belakang).
   - Parsing otomatis QR code outlet (`/shops/:id`) atau menu (`/products/:id`).
5. **Keranjang & Checkout Fleksibel**:
   - Dukungan tipe pesanan: **Dine In** (dengan nomor meja), **Takeaway** (dengan estimasi jam ambil), atau **Delivery**.
   - Input catatan khusus per item maupun per order.
   - Perhitungan otomatis subtotal, pajak (10%), biaya delivery, dan diskon.
6. **Autentikasi & Profil**:
   - Register akun baru & login dengan JWT (Access Token & Refresh Token).
   - Auto-refresh token saat access token expired (interceptor 401).
   - Profil pengguna & riwayat semua pesanan terdahulu.
7. **Pelacakan Status Pesanan Real-Time**:
   - Stepper visual dinamis (`PENDING` ➔ `CONFIRMED` ➔ `PREPARING` ➔ `READY` ➔ `COMPLETED`).
   - Fitur polling otomatis berkala ke backend tiap 5 detik untuk memperbarui status pesanan.
8. **Simulasi Pembayaran (Ready for Midtrans / Xendit)**:
   - Dummy payment flow yang siap dialihkan ke payment gateway nyata cukup dengan mengganti endpoint.

---

## 📁 Struktur Direktori Proyek

```text
frontend/
├── dist/                          # Output hasil build produksi
├── node_modules/                  # Dependensi npm
├── src/
│   ├── components/                # Komponen modular
│   │   ├── common/                # Komponen umum (ProtectedRoute, GuestRoute)
│   │   │   └── ProtectedRoute.tsx
│   │   ├── layout/                # Komponen kerangka (Layout, Header, BottomNav)
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── index.ts
│   │   ├── product/               # Komponen produk & pesanan item
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductModal.tsx   # Modal varian & addon
│   │   │   └── index.ts
│   │   ├── shop/                  # Komponen toko & outlet
│   │   │   ├── ShopCard.tsx
│   │   │   └── index.ts
│   │   └── ui/                    # Komponen atomik UI (Custom UI Kit)
│   │       ├── Badge.tsx
│   │       ├── BottomSheet.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Spinner.tsx
│   │       └── index.ts
│   ├── lib/                       # Utility & Konfigurasi API
│   │   ├── api.ts                 # Axios instance & seluruh service endpoint
│   │   ├── hooks.ts               # Custom React hooks (useDebounce, dsb)
│   │   └── utils.ts               # Formatter mata uang, tanggal, parser QR, dsb
│   ├── pages/                     # Halaman Aplikasi
│   │   ├── Cart.tsx               # Keranjang Belanja
│   │   ├── Checkout.tsx           # Halaman Checkout & Opsi Pemesanan
│   │   ├── History.tsx            # Riwayat Pesanan Pengguna
│   │   ├── Home.tsx               # Beranda Aplikasi
│   │   ├── Login.tsx              # Halaman Masuk
│   │   ├── OrderStatus.tsx        # Status & Pelacakan Pesanan
│   │   ├── Payment.tsx            # Halaman Pembayaran (Dummy & Midtrans)
│   │   ├── Profile.tsx            # Profil Pengguna
│   │   ├── QRScanner.tsx          # Pemindai Kamera QR Code
│   │   ├── Register.tsx           # Registrasi Pengguna
│   │   ├── Search.tsx             # Halaman Pencarian Outlet
│   │   ├── ShopDetail.tsx         # Detail Outlet & Daftar Menu
│   │   └── index.ts
│   ├── stores/                    # Global State Management (Zustand)
│   │   ├── auth.ts                # Store Autentikasi Pengguna & Token
│   │   ├── cart.ts                # Store Keranjang Belanja (Auto-persist)
│   │   └── index.ts
│   ├── types/                     # TypeScript Interface & Type Definitions
│   │   └── index.ts
│   ├── App.tsx                    # Routing & Root Component
│   ├── index.css                  # Global Tailwind Directives & Custom Utilities
│   ├── main.tsx                   # React Entry Point
│   └── vite-env.d.ts              # Vite Types
├── .env                           # Environment variables lokal
├── .env.example                   # Contoh template variabel lingkungan
├── eslint.config.js               # Konfigurasi Linter
├── index.html                     # HTML Template & Font Definitions
├── package.json                   # Daftar dependensi & script proyek
├── postcss.config.js              # Konfigurasi PostCSS
├── tailwind.config.js             # Konfigurasi Tema & Warna Tailwind
├── tsconfig.json                  # Konfigurasi TypeScript aplikasi
└── vite.config.ts                 # Konfigurasi Vite & Path Aliases (@)
```

---

## 🛠 Instalasi & Menjalankan Proyek

### 1. Prasyarat
- **Node.js**: Versi 18+ atau 20+
- **Backend Eloka Pesan**: Berjalan di `http://localhost:3000` (atau sesuai konfigurasi)

### 2. Konfigurasi Environment
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi konfigurasi dalam `.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 3. Instalasi Dependensi
Jalankan perintah berikut di dalam folder `frontend`:
```bash
npm install
```

### 4. Menjalankan di Mode Development
```bash
npm run dev
```
Aplikasi akan tersedia di: `http://localhost:5173`

---

## 🧠 Manajemen State (Zustand)

Manajemen state menggunakan **Zustand** dengan middleware `persist` ke `localStorage`.

### 1. `useAuthStore` (`src/stores/auth.ts`)
Mengelola identitas user yang sedang login dan status autentikasi:
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}
```

### 2. `useCartStore` (`src/stores/cart.ts`)
Mengelola keranjang belanja:
- Menjaga integritas outlet: jika menambahkan item dari outlet berbeda, user diarahkan untuk mereset keranjang toko sebelumnya.
- Menghitung kalkulasi harga varian dan addon secara otomatis.
- Metode pembantu: `getTotalItems()`, `getSubtotal()`, `updateQuantity()`, `clearCart()`.

---

## 🌐 Integrasi API & Interceptor

Semua request HTTP dipusatkan pada `src/lib/api.ts` menggunakan instance Axios:

### 1. Auto Token Injection (Request Interceptor)
Setiap request secara otomatis menyertakan header:
```http
Authorization: Bearer <accessToken>
```

### 2. Silent Token Refresh (Response Interceptor)
Jika server membalas dengan status code `401 Unauthorized`:
1. Request di-pause.
2. Aplikasi memanggil endpoint `/auth/refresh` menggunakan `refreshToken`.
3. Jika berhasil, `accessToken` baru disimpan dan request asli diulang kembali tanpa membuat user logout.
4. Jika refresh token juga gagal, user diarahkan ke halaman login.

### 3. Modul API yang Tersedia
- `authApi`: `login`, `register`, `logout`, `refreshToken`, `getProfile`
- `shopsApi`: `getAll`, `getById`, `getNearBy`
- `productsApi`: `getByShop`, `getById`, `getCategories`
- `ordersApi`: `create`, `getById`, `getMyOrders`, `cancel`
- `paymentsApi`: `create`, `getStatus`, `webhook`
- `addressesApi`: `getAll`, `create`, `update`, `delete`, `setDefault`

---

## 🗺 Daftar Halaman & Routing

| Rute | Halaman | Guard | Deskripsi |
| :--- | :--- | :--- | :--- |
| `/` | `HomePage` | Publik | Beranda promo, pencarian cepat, scan QR, dan daftar outlet |
| `/search` | `SearchPage` | Publik | Pencarian outlet dengan riwayat pencarian & debounce |
| `/shops/:id` | `ShopDetailPage` | Publik | Profil outlet, jam operasional, kategori & daftar menu |
| `/scan` | `QRScannerPage` | Publik | Pemindai QR kamera untuk meja & outlet |
| `/cart` | `CartPage` | Publik | Daftar pesanan di keranjang, kuantitas & rincian biaya |
| `/login` | `LoginPage` | `GuestRoute` | Formulir login akun |
| `/register` | `RegisterPage` | `GuestRoute` | Pendaftaran akun baru |
| `/checkout` | `CheckoutPage` | `ProtectedRoute` | Pemilihan tipe pesanan (Dine-in / Takeaway / Delivery) |
| `/payment/:orderId`| `PaymentPage` | `ProtectedRoute` | Pemilihan metode bayar & proses pembayaran |
| `/order-status/:orderId` | `OrderStatusPage` | `ProtectedRoute` | Pelacakan status pemrosesan pesanan secara berkala |
| `/history` | `HistoryPage` | Publik / Auth | Riwayat transaksi dan pesanan sebelumnya |
| `/profile` | `ProfilePage` | Publik / Auth | Detail profil pengguna & logout |

---

## 🎨 Komponen UI & Layout

Aplikasi dilengkapi kit komponen UI kustom tanpa dependensi library eksternal yang berat:

1. **`Layout`**: Kerangka utama yang menyatukan Header dan Bottom Navigation bar secara fleksibel.
2. **`Header`**: Sticky header dengan tombol back, judul dinamis, dan action buttons.
3. **`BottomNav`**: Navigasi bawah gaya aplikasi mobile lengkap dengan badge jumlah item keranjang.
4. **`BottomSheet`**: Modal slide-up dari bawah layar dengan transisi mulus dan backdrop blur.
5. **`Button`**: Mendukung varian `primary`, `secondary`, `outline`, `ghost`, `danger`, state `isLoading`, serta icon pendukung.
6. **`Card`**: Kontainer kartu dengan efek hover dan elevation.
7. **`Input`**: Form input responsif dengan label, error message, ikon kiri, dan ikon kanan (seperti toggle show/hide password).
8. **`Badge`**: Tag status warna-warni (`primary`, `success`, `warning`, `danger`, dsb).
9. **`Spinner`**: Indikator loading animasi dengan label status.

---

## 📷 Fitur QR Scanner

QR Scanner menggunakan library modern `html5-qrcode` yang mengakses kamera web/mobile secara langsung:

- **Format QR Yang Didukung**:
  ```json
  {"type": "shop", "id": "uuid-shop-id"}
  ```
  atau
  ```json
  {"type": "product", "id": "uuid-product-id"}
  ```
- **Fitur Kamera**:
  - Auto-start pada kamera belakang (`facingMode: 'environment'`).
  - Tombol **Ganti Kamera** untuk berpindah ke kamera depan atau kamera lainnya.
  - Frame bidik dengan panduan visual sudut (*target corners*).

---

## 💳 Alur Pembayaran & Integrasi Payment Gateway

File: `src/pages/Payment.tsx`

Saat ini diimplementasikan dalam mode simulasi dummy yang **100% siap diintegrasikan** dengan Midtrans Snap atau Xendit:

### Cara Menghubungkan ke Midtrans Snap:
1. Panggil API pembayaran di frontend:
   ```typescript
   const response = await paymentsApi.create({
     orderId: order.id,
     paymentMethod: 'E_WALLET',
     amount: parseFloat(order.total),
   });
   
   // Buka Midtrans Snap Popup:
   window.snap.pay(response.data.data.transactionId, {
     onSuccess: (result) => navigate(`/order-status/${order.id}`),
     onPending: (result) => navigate(`/order-status/${order.id}`),
     onError: (err) => toast.error('Pembayaran gagal'),
   });
   ```

---

## 📦 Build & Deployment

Untuk memeriksa build dan tipe TypeScript sebelum rilis produksi:

```bash
# Typecheck & Build
npm run build

# Menjalankan preview build produksi
npm run preview
```

Output build akan tersimpan di direktori `frontend/dist/` dan siap di-deploy ke platform seperti **Vercel**, **Netlify**, **Cloudflare Pages**, atau server **Nginx/Docker**.

### Deploy ke Vercel

1. Pastikan project sudah tersimpan di repository Git dan `frontend` dipilih sebagai **Root Directory** di Vercel.
2. Gunakan pengaturan berikut:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`
3. Tambahkan environment variable `VITE_API_URL` di pengaturan project Vercel dengan URL API backend production, misalnya `https://eloka-pesan-api-v1.vercel.app/api/v1`. Jangan mengunggah file `.env`; file tersebut sengaja diabaikan oleh Git.
4. Jalankan deployment:

```bash
npx vercel --prod
```

File `vercel.json` menyediakan fallback SPA ke `index.html`, sehingga refresh pada route React seperti `/shops/:id` tidak menghasilkan 404.
