import { Platform } from 'react-native';
import axios from 'axios';
import { APP_ENV, LOCAL_IP, API_PORT } from '@env';

const AppEnv = APP_ENV || 'development';

// Dynamically construct API URLs using LOCAL_IP from .env
// This allows each team member to configure their own IP address
export const APP_URL =
  AppEnv === 'development'
    ? `http://localhost:${API_PORT}`
    : `http://${LOCAL_IP}:${API_PORT}`;

export const BASE_URL =
  AppEnv === 'production'
    ? `http://${LOCAL_IP}:${API_PORT}/api`
    : Platform.OS === 'ios'
      ? `http://localhost:${API_PORT}/api` // iOS Simulator can use localhost
      : `http://${LOCAL_IP}:${API_PORT}/api`; // Android emulator needs network IP

const DEFAULT_TIMEOUT = 30_000;

const ERROR_CODES = {
  TIMEOUT: 'ERR_TIMEOUT',
  CANCELED: 'ERR_CANCELED',
  NETWORK: 'ERR_NETWORK',
  CONNECTION_REFUSED: 'ECONNREFUSED',
  CONNECTION_RESET: 'ECONNRESET',
};

/**
 * Normalizes API errors into a consistent shape with user-friendly messages.
 * @param {object} error - Axios or API error
 * @returns {{ statusCode: number, message: string, error: object, data: null }}
 */
export function normalizeApiError(error) {
  const serverData = error?.response?.data;
  const statusCode =
    serverData?.statusCode ??
    error?.response?.status ??
    error?.statusCode ??
    500;
  const serverMessage =
    serverData?.message ?? error?.response?.statusText ?? null;
  const code = error?.code ?? error?.error;

  if (
    serverData &&
    typeof serverData === 'object' &&
    (serverData.message || serverData.error)
  ) {
    return {
      statusCode: serverData.statusCode ?? statusCode,
      message: serverData.message ?? 'Something went wrong.',
      error:
        typeof serverData.error === 'object'
          ? { ...serverData.error, code: serverData.error?.code ?? code }
          : { message: serverData.error ?? serverMessage, code },
      data: serverData.data ?? null,
    };
  }

  if (
    code === 'ECONNABORTED' ||
    code === 'ERR_TIMEOUT' ||
    error.message?.includes('timeout')
  ) {
    console.warn('[API] Request timeout - server did not respond in time');
    return {
      statusCode: 408,
      message: 'Request timed out.',
      error: {
        message:
          'The server took too long to respond. Check your connection and that the backend is running, then try again.',
        code: ERROR_CODES.TIMEOUT,
      },
      data: null,
    };
  }

  if (code === 'ERR_CANCELED' || code === 'AbortError') {
    console.warn('[API] Request was canceled (e.g. timeout or abort)');
    return {
      statusCode: 499,
      message: 'Request was canceled.',
      error: {
        message:
          'The request was canceled. If this happens during sign up or login, the server may be unreachable—check that the backend is running and the app is using the correct API URL and port.',
        code: ERROR_CODES.CANCELED,
      },
      data: null,
    };
  }

  if (
    code === 'ERR_NETWORK' ||
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    error.message === 'Network Error'
  ) {
    console.error(
      '[API] Network error - backend may be unreachable:',
      code || error.message,
    );
    return {
      statusCode: 500,
      message: 'Connection failed.',
      error: {
        message:
          'Unable to reach the server. Check your internet connection and ensure the backend server is running.',
        code: code ?? ERROR_CODES.NETWORK,
      },
      data: null,
    };
  }

  return {
    statusCode,
    message: serverMessage || error?.message || 'Something went wrong.',
    error: {
      message: serverMessage || error?.message || 'Please try again later.',
      code: code ?? 'UNKNOWN',
    },
    data: null,
  };
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  timeoutErrorMessage:
    'Server took too long to respond. Please try again later.',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
    console.warn(
      `[API] Request timeout: ${config.method?.toUpperCase()} ${config.url}`,
    );
  }, DEFAULT_TIMEOUT);

  config.timeoutId = timeoutId;
  config.signal = abortController.signal;
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response.config?.timeoutId) {
      clearTimeout(response.config.timeoutId);
    }
    return response;
  },
  (error) => {
    if (error.config?.timeoutId) {
      clearTimeout(error.config.timeoutId);
    }
    const normalized = normalizeApiError(error);
    return Promise.reject(normalized);
  },
);

export default apiClient;
