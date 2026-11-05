import axios from 'axios';

// Dev: Vite proxies /api to Django. Production: set VITE_API_URL=https://your-api.example.com/api
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('tb_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // An expired token would make even public endpoints return 401, so drop it and let the app re-render logged out.
    if (err.response?.status === 401 && localStorage.getItem('tb_token')) {
      localStorage.removeItem('tb_token');
      localStorage.removeItem('tb_user');
      window.dispatchEvent(new Event('tb-logout'));
    }
    return Promise.reject(err);
  }
);

export default api;
