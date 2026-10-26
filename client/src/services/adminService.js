import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
export const ADMIN_TOKEN_KEY = 'budget_buddy_admin_token';
export const ADMIN_PROFILE_KEY = 'budget_buddy_admin_profile';

const adminHttp = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 15000
});

// Interceptor to inject admin token
adminHttp.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // LocalStorage fallback
  }
  return config;
});

// Interceptor for response handling
adminHttp.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      // Clear token if invalid or unauthorized
      if (err.response?.status === 401) {
        try {
          localStorage.removeItem(ADMIN_TOKEN_KEY);
          localStorage.removeItem(ADMIN_PROFILE_KEY);
        } catch {
          // Ignored
        }
      }
    }
    return Promise.reject(err.response?.data || err);
  }
);

export const adminService = {
  getToken: () => {
    try {
      return localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getProfile: () => {
    try {
      const data = localStorage.getItem(ADMIN_PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated: () => {
    try {
      return !!localStorage.getItem(ADMIN_TOKEN_KEY);
    } catch {
      return false;
    }
  },

  login: async (email, password) => {
    const res = await adminHttp.post('/login', { email, password });
    if (res.token) {
      localStorage.setItem(ADMIN_TOKEN_KEY, res.token);
      if (res.admin) {
        localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify(res.admin));
      }
    }
    return res;
  },

  logout: () => {
    try {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_PROFILE_KEY);
    } catch {
      // Ignored
    }
  },

  getOverview: async () => {
    return adminHttp.get('/overview');
  },

  getSpendingBreakdown: async () => {
    return adminHttp.get('/spending-breakdown');
  },

  getUsers: async () => {
    return adminHttp.get('/users');
  },

  getTopCustomers: async () => {
    return adminHttp.get('/top-customers');
  },

  getLiveFeed: async () => {
    return adminHttp.get('/live-feed');
  },

  getFeedbackSheet: async () => {
    return adminHttp.get('/feedback-sheet');
  },

  updateFeedbackStatus: async (id, status) => {
    return adminHttp.put(`/feedback-sheet/${id}`, { status });
  },

  deleteFeedback: async (id) => {
    return adminHttp.delete(`/feedback-sheet/${id}`);
  },

  purgeSampleFeedback: async () => {
    return adminHttp.delete('/feedback-sheet/purge/samples');
  }
};

export default adminService;
