// User Types
export interface User {
  id: string;
  email: string;
  phone: string | null;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'CUSTOMER';
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string | null;
}

// Auth Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export interface TokenResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

// Shop Types
export interface Shop {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  logoUrl?: string;
  rating?: number;
  distance?: number;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
}

export interface ShopResponse {
  success: boolean;
  message: string;
  data: {
    shops: Shop[];
    pagination: Pagination;
  };
}

// Category Types
export interface Category {
  id: string;
  shopId: string;
  name: string;
  description: string;
  order: number;
  createdAt: string;
}

// Product Types
export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  optionName: string;
  priceAdjust: string;
  isAvailable: boolean;
}

export interface ProductAddon {
  id: string;
  productId: string;
  name: string;
  price: string;
  isAvailable: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  shopId: string;
  name: string;
  description: string;
  price: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  isPopular: boolean;
  stock?: number;
  order: number;
  variants: ProductVariant[];
  addons: ProductAddon[];
  category?: Category;
  createdAt: string;
}

export interface ProductResponse {
  success: boolean;
  message: string;
  data: {
    products: Product[];
    pagination: Pagination;
  };
}

// Cart Types
export interface CartItemVariant {
  variantId: string;
  optionName: string;
  priceAdjust: string;
}

export interface CartItemAddon {
  addonId: string;
  name: string;
  price: string;
  quantity: number;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  variants: CartItemVariant[];
  addons: CartItemAddon[];
  notes?: string;
  product?: Product;
  subtotal: string;
}

// Order Types
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  notes?: string;
  variants: {
    id: string;
    variant: ProductVariant;
  }[];
  addons: {
    id: string;
    quantity: number;
    addon: ProductAddon;
  }[];
  product?: Product;
}

export interface OrderAddress {
  id: string;
  label: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  coordinates?: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  shopId: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableNumber?: string | null;
  addressId?: string | null;
  address?: OrderAddress;
  subtotal: string;
  tax: string;
  deliveryFee: string;
  discount: string;
  total: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';
  paymentMethod?: string | null;
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  pickupTime?: string | null;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
  user?: User;
  shop?: Shop;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    orders: Order[];
    pagination: Pagination;
  };
}

export interface CreateOrderRequest {
  shopId: string;
  orderType: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  tableNumber?: string;
  addressId?: string;
  items: {
    productId: string;
    quantity: number;
    variantIds?: string[];
    addonIds?: string[];
    notes?: string;
  }[];
  pickupTime?: string;
  notes?: string;
}

export interface PaymentRequest {
  orderId: string;
  paymentMethod: 'QRIS';
  amount?: number;
  extraData?: Record<string, unknown>;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    transactionId?: string;
    paymentUrl?: string;
    status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
    orderId?: string;
    amount?: string;
    method?: 'QRIS';
    qrPayload?: string;
    expiresAt?: string;
    demo?: string;
  };
}

// Address Types
export interface Address {
  id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  coordinates?: string;
  isDefault: boolean;
  createdAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// QR Code Types
export interface QRCodeData {
  type: 'product' | 'shop' | 'table';
  id: string;
  shopId?: string;
  tableNumber?: string;
}
