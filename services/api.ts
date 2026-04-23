import axios from 'axios';

const API_URL = '/api';

export const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/#/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const sendOTP = (phone: string) => api.post('/auth/send-otp', { phone });
export const verifyOTP = (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp });
export const getCurrentUser = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');

// Account APIs
export const registerAccount = (data: any) => api.post('/accounts/register', data);

export const getProducts = (page = 1, size = 10, search = '', categoryId = '', brandId = '') => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (search) params.append('search', search);
  if (categoryId) params.append('categoryId', categoryId);
  if (brandId) params.append('brandId', brandId);
  return api.get(`/products?${params.toString()}`);
};
export const getProduct = (id: number) => api.get(`/products/${id}`);
export const searchProducts = (q: string, limit = 10) => api.get(`/products/search?q=${q}&limit=${limit}`);
export const createProduct = (data: any) => api.post('/products', data);
export const updateProduct = (id: number, data: any) => api.put(`/products/${id}`, data);
export const deleteProduct = (id: number) => api.delete(`/products/${id}`);
export const getProductBatches = (productId: number, q = '', limit = 10) => api.get(`/products/${productId}/batches?q=${q}&limit=${limit}`);
export const getProductWarehouses = (productId: number, q = '', limit = 10) => api.get(`/products/${productId}/warehouses?q=${q}&limit=${limit}`);
export const createProductBatch = (productId: number, data: any) => api.post(`/products/${productId}/batches`, data);

export const getBrands = (page = 1, size = 10, search = '') => api.get(`/brands?page=${page}&size=${size}&search=${search}`);
export const getBrand = (id: number) => api.get(`/brands/${id}`);
export const createBrand = (data: any) => api.post('/brands', data);
export const updateBrand = (id: number, data: any) => api.put(`/brands/${id}`, data);
export const deleteBrand = (id: number) => api.delete(`/brands/${id}`);

export const getCategories = (page = 1, size = 10, search = '') => api.get(`/categories?page=${page}&size=${size}&search=${search}`);
export const getCategory = (id: number) => api.get(`/categories/${id}`);
export const createCategory = (data: any) => api.post('/categories', data);
export const updateCategory = (id: number, data: any) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id: number) => api.delete(`/categories/${id}`);

export const getWarehouses = (page = 1, size = 10, search = '') => api.get(`/warehouses?page=${page}&size=${size}&search=${search}`);
export const getWarehouse = (id: number) => api.get(`/warehouses/${id}`);
export const createWarehouse = (data: any) => api.post('/warehouses', data);
export const updateWarehouse = (id: number, data: any) => api.put(`/warehouses/${id}`, data);
export const deleteWarehouse = (id: number) => api.delete(`/warehouses/${id}`);

export const getCustomers = (page = 1, size = 10, search = '') => api.get(`/customers?page=${page}&size=${size}&search=${search}`);
export const getCustomer = (id: number) => api.get(`/customers/${id}`);
export const createCustomer = (data: any) => api.post('/customers', data);
export const updateCustomer = (id: number, data: any) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id: number) => api.delete(`/customers/${id}`);

export const getInvoices = (page = 1, size = 10) => api.get(`/invoices?page=${page}&size=${size}`);
export const getInvoice = (id: number) => api.get(`/invoices/${id}`);
export const createInvoice = (data: any) => api.post('/invoices', data);
export const updateInvoice = (id: number, data: any) => api.put(`/invoices/${id}`, data);
export const deleteInvoice = (id: number) => api.delete(`/invoices/${id}`);

export const getPurchaseOrders = (page = 1, size = 10, search = '') => api.get(`/purchase-orders?page=${page}&size=${size}&search=${search}`);
export const getPurchaseOrder = (id: number) => api.get(`/purchase-orders/${id}`);
export const createPurchaseOrder = (data: any) => api.post('/purchase-orders', data);
export const updatePurchaseOrder = (id: number, data: any) => api.put(`/purchase-orders/${id}`, data);
export const deletePurchaseOrder = (id: number) => api.delete(`/purchase-orders/${id}`);
export const receivePurchaseOrder = (id: number, data: any) => api.post(`/purchase-orders/${id}/receive`, data);

export const getUnits = (page = 1, size = 1000) => api.get(`/units?page=${page}&size=${size}`);
export const getGSTRates = (page = 1, size = 1000) => api.get(`/gst-rates?page=${page}&size=${size}`);
export const getCESSRates = (page = 1, size = 1000) => api.get(`/cess-rates?page=${page}&size=${size}`);

export const getProductStockPosition = (id: number) => api.get(`/products/${id}/stock-position`);

// Stock Adjustments
export const createStockAdjustment = (data: any) => api.post('/stock-adjustments', data);

// Settings
export const getSetting = (key: string) => api.get(`/settings/${key}`);
export const saveSetting = (key: string, value: string) => api.post('/settings', { key, value });

// Invoice
export const getNextInvoiceNumber = () => api.get('/invoices/next-number');
export const searchCustomers = (query: string, limit = 10) => api.get(`/customers/search?q=${query}&limit=${limit}`);

// Purchase Invoices
export const getPurchaseInvoices = (page = 1, size = 10, search = '') => api.get(`/purchase-invoices?page=${page}&size=${size}&search=${search}`);
export const getPurchaseInvoice = (id: number) => api.get(`/purchase-invoices/${id}`);
export const createPurchaseInvoice = (data: any) => api.post('/purchase-invoices', data);
export const updatePurchaseInvoice = (id: number, data: any) => api.put(`/purchase-invoices/${id}`, data);
export const deletePurchaseInvoice = (id: number) => api.delete(`/purchase-invoices/${id}`);
export const getNextPurchaseInvoiceNumber = () => api.get('/purchase-invoices/next-number');
export const searchParties = (query: string, type?: string, limit = 10) => api.get(`/customers/search?q=${query}${type ? `&type=${type}` : ''}&limit=${limit}`);

// Party Addresses
export const getPartyAddresses = (partyId: number) => api.get(`/parties/${partyId}/addresses`);
export const createPartyAddress = (partyId: number, data: any) => api.post(`/parties/${partyId}/addresses`, data);
export const updatePartyAddress = (partyId: number, addressId: number, data: any) => api.put(`/parties/${partyId}/addresses/${addressId}`, data);
export const deletePartyAddress = (partyId: number, addressId: number) => api.delete(`/parties/${partyId}/addresses/${addressId}`);
