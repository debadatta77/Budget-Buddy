import axios from 'axios';

/**
 * ============================================================================
 * Centralized API Client (Axios)
 * ============================================================================
 * Handles HTTP communication with the Budget Buddy Express/MongoDB backend.
 * Automatically injects JWT Bearer tokens and handles response lifecycles.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const TOKEN_STORAGE_KEY = 'budget_buddy_jwt_token';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Request Interceptor: Attach JWT Bearer Token if present
apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // LocalStorage access fallback (e.g. incognito/ssr)
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Parse payload & handle auth expirations
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid: clear session
      try {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch {
        // Ignored
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Auth Endpoints
export const authAPI = {
  register: (payload) => apiClient.post('/auth/register', payload),
  login: (payload) => apiClient.post('/auth/login', payload),
  logout: () => apiClient.post('/auth/logout')
};

// User Profile Endpoints
export const userAPI = {
  getProfile: () => apiClient.get('/user/profile'),
  updateProfile: (payload) => apiClient.put('/user/profile', payload),
  linkBankAccount: (payload) => apiClient.post('/user/bank-accounts', payload)
};

// Transaction Endpoints
export const transactionAPI = {
  getAll: (params) => apiClient.get('/transactions', { params }),
  create: (payload) => apiClient.post('/transactions', payload),
  update: (id, payload) => apiClient.put(`/transactions/${id}`, payload),
  delete: (id) => apiClient.delete(`/transactions/${id}`),
  clearAll: () => apiClient.delete('/transactions/clear/all')
};

// Telemetry Endpoint (Single Source of Truth)
export const telemetryAPI = {
  getLive: () => apiClient.get('/telemetry/live')
};

// Budget Endpoints
export const budgetAPI = {
  get: () => apiClient.get('/budget'),
  update: (payload) => apiClient.put('/budget', payload)
};

// Vault Endpoints
export const vaultAPI = {
  get: () => apiClient.get('/vault'),
  deposit: (amount, recordTransaction = true) => apiClient.post('/vault/deposit', { amount, recordTransaction }),
  withdraw: (amount, recordTransaction = true) => apiClient.post('/vault/withdraw', { amount, recordTransaction }),
  updateSettings: (payload) => apiClient.put('/vault/settings', payload)
};

// EMI Card Endpoints
export const emiCardAPI = {
  getAll: () => apiClient.get('/emi-cards'),
  create: (payload) => apiClient.post('/emi-cards', payload),
  update: (id, payload) => apiClient.put(`/emi-cards/${id}`, payload),
  delete: (id) => apiClient.delete(`/emi-cards/${id}`),
  calculate: (payload) => apiClient.post('/emi-cards/calculate', payload)
};

// AI Financial Advisor Endpoint
export const aiAdvisorAPI = {
  chat: (message, strategyMode = 'balanced', currency = '₹', clientTelemetry = null) => 
    apiClient.post('/ai/chat', { message, strategyMode, currency, clientTelemetry })
};

// Report Endpoints
export const reportAPI = {
  getSettings: () => apiClient.get('/reports/settings'),
  updateSettings: (payload) => apiClient.put('/reports/settings', payload),
  preview: () => apiClient.get('/reports/preview'),
  sendNow: (payload = {}) => apiClient.post('/reports/send-now', payload)
};

// Testimonial & Praise Endpoints
export const testimonialAPI = {
  getTop: () => apiClient.get('/testimonials'),
  create: (payload) => apiClient.post('/testimonials', payload)
};

export default apiClient;
