import axios from 'axios';

const { NODE_ENV } = process.env;

// More robust API URL configuration
export const API_BASE_URL = (() => {
  if (NODE_ENV === 'development') {
    return 'http://localhost:8080/';
  }

  // For production, try environment variable first, then fallback to relative URL for same-origin deployment
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // For same-origin deployment (like Vercel or Docker), use relative URL
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/`;
  }

  // Final fallback
  return 'http://localhost:8080/';
})();

// export const API_BASE_PREFIX = '/elevenlabs/v1';
const DEFAULT_TIMEOUT = 30_000;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  timeoutErrorMessage:
    'Server took too long to respond. Please try again later.',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  const abortController = new AbortController();
  setTimeout(() => abortController.abort(), DEFAULT_TIMEOUT + 5000);
  config.signal = abortController.signal;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.data) {
      return Promise.reject(error?.response?.data);
    }
    const statusCode =
      error?.response?.statusCode || error.response?.status || 500;
    const errorData = {
      ...error?.response,
      statusCode,
      data: null,
      error: error.message,
      message: error?.response?.statusText ?? error.code,
    };
    // console.log('error response', errorData);
    return Promise.reject(errorData);
  },
);

export default apiClient;
