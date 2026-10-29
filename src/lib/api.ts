import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import type {
  User,
  Shop,
  Product,
  Category,
  Order,
  CreateOrderRequest,
  PaymentRequest,
  Address,
  Pagination,
} from '@/types';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const resData = response.data.data || response.data;
          const { accessToken, refreshToken: newRefreshToken } = resData;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        } catch (refreshError) {
          // Clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

// API Methods
export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.post<T>(url, data, config),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.put<T>(url, data, config),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.patch<T>(url, data, config),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config),
};

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<{ data: { user: User; accessToken: string; refreshToken: string } }>(
      '/auth/login',
      { email, password }
    ),

  register: (data: { email: string; password: string; name: string; phone: string }) =>
    apiClient.post('/auth/register', data),

  logout: () => apiClient.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),

  getProfile: () => apiClient.get('/auth/me'),
};

// Shops API
export const shopsApi = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }) =>
    apiClient.get<{ data: Shop[] | { shops: Shop[]; pagination?: Pagination }; meta?: Pagination }>(
      '/shops',
      { params }
    ),

  getById: (id: string) =>
    apiClient.get<{ data: Shop & { categories?: (Category & { products?: Product[] })[] } }>(`/shops/${id}`),

  getNearBy: (lat: number, lng: number, radius?: number) =>
    apiClient.get<{ data: Shop[] }>('/shops/nearby', { params: { lat, lng, radius } }),
};

// Products API
export const productsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get<{ data: Product[] }>('/products', { params }),

  getByShop: (shopId: string, params?: { page?: number; limit?: number; categoryId?: string }) =>
    apiClient.get<{ data: Product[] }>(`/products/shop/${shopId}`, { params }),

  getById: (id: string) =>
    apiClient.get<{ data: Product }>(`/products/${id}`),

  getCategories: (shopId: string) =>
    apiClient.get<{ data: Category[] }>(`/shops/${shopId}`),
};

// Orders API
export const ordersApi = {
  create: (data: CreateOrderRequest) =>
    apiClient.post<{ data: Order | { order: Order } }>('/orders', data),

  getById: (id: string) =>
    apiClient.get<{ data: Order | { order: Order } }>(`/orders/${id}`),

  getMyOrders: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ data: Order[] | { orders: Order[]; pagination?: Pagination }; meta?: Pagination }>(
      '/orders/my-orders',
      { params }
    ),

  cancel: (id: string) => apiClient.post(`/orders/${id}/cancel`),
};

// Payments API
export const paymentsApi = {
  create: (data: PaymentRequest) =>
    apiClient.post<{ data: { transactionId: string; paymentUrl: string; status: string } }>(
      '/payments',
      data
    ),

  getStatus: (orderId: string) =>
    apiClient.get<{ data: { status: string; transactionId?: string } }>(`/payments/${orderId}/status`),

  webhook: (data: unknown) => apiClient.post('/payments/webhook', data),
};

// Addresses API
export const addressesApi = {
  getAll: () =>
    apiClient.get<{ data: Address[] }>('/users/addresses'),

  create: (data: Omit<Address, 'id' | 'userId' | 'createdAt'>) =>
    apiClient.post<{ data: Address }>('/users/addresses', data),

  update: (id: string, data: Partial<Address>) =>
    apiClient.put<{ data: Address }>(`/users/addresses/${id}`, data),

  delete: (id: string) => apiClient.delete(`/users/addresses/${id}`),

  setDefault: (id: string) => apiClient.post(`/users/addresses/${id}/set-default`),
};

export default api;
