import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import {
  HomePage,
  QRScannerPage,
  ShopDetailPage,
  CheckoutPage,
  PaymentPage,
  OrderStatusPage,
  HistoryPage,
  ProfilePage,
  LoginPage,
  RegisterPage,
  SearchPage,
  TableEntryPage,
  MapPage,
} from '@/pages';
import { ProtectedRoute, GuestRoute } from '@/components/common/ProtectedRoute';
import CartConflictModal from '@/components/common/CartConflictModal';

function App() {
  return (
    <>
      <Toaster position="top-center" richColors closeButton />
      <CartConflictModal />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/shops/:id" element={<ShopDetailPage />} />
        <Route path="/scan" element={<QRScannerPage />} />
        <Route path="/table" element={<TableEntryPage />} />
        <Route path="/map" element={<MapPage />} />

        {/* Auth Routes (Guest Only) */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />

        {/* Checkout is also available for guests. Account-only order history/payment remain protected. */}
        <Route
          path="/checkout"
          element={<CheckoutPage />}
        />
        <Route
          path="/payment/:orderId"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-status/:orderId"
          element={
            <ProtectedRoute>
              <OrderStatusPage />
            </ProtectedRoute>
          }
        />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
