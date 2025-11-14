import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
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

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

// Products APIs
export const productsAPI = {
  getAll: (activeOnly = true) => api.get(`/products?activeOnly=${activeOnly}`),
  getById: (id) => api.get(`/products/${id}`),
  create: (productData) => api.post('/products', productData),
  update: (id, productData) => api.put(`/products/${id}`, productData),
  delete: (id) => api.delete(`/products/${id}`),
};

// Sales APIs
export const salesAPI = {
  getAll: (startDate, endDate) => {
    let url = '/sales';
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    const queryString = params.toString();
    return api.get(queryString ? `${url}?${queryString}` : url);
  },
  getById: (id) => api.get(`/sales/${id}`),
  create: (saleData) => api.post('/sales', saleData),
  getTodaySales: () => api.get('/sales/today'),
};

// Reports APIs
export const reportsAPI = {
  getDailySummary: (date) => {
    const url = date ? `/reports/daily-summary?date=${date}` : '/reports/daily-summary';
    return api.get(url);
  },
  getSummaryRange: (startDate, endDate) => 
    api.get(`/reports/summary-range?startDate=${startDate}&endDate=${endDate}`),
  getTopProducts: (startDate, endDate, limit = 10) => {
    let url = `/reports/top-products?limit=${limit}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    return api.get(url);
  },
};

export default api;
