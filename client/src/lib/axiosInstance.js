import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';

/** Access token lives in memory only — never localStorage (XSS exfiltration). */
let accessToken = null;
let onUnauthorized = () => {};

export const setAccessToken = (token) => {
  accessToken = token;
};
export const getAccessToken = () => accessToken;
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export const api = axios.create({ baseURL, withCredentials: true });

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  refreshPromise ??= api
    .post('/auth/refresh')
    .then((response) => {
      accessToken = response.data.accessToken;
      return response.data;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;
    const isRefreshCall = config?.url?.includes('/auth/refresh');

    if (response?.status === 401 && !config?._retried && !isRefreshCall) {
      config._retried = true;
      try {
        await refreshAccessToken();
        return api(config);
      } catch (refreshError) {
        accessToken = null;
        onUnauthorized();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export { refreshAccessToken };
