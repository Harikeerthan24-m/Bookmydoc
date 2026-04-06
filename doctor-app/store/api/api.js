// import { Platform } from 'react-native';
import { APP_ENV, LOCAL_IP, API_PORT, API_BASE_URL } from '@env';

const AppEnv = APP_ENV || 'development';
const isProduction = AppEnv === 'production';

// In production, use API_BASE_URL from env
const resolvedAppUrl = (() => {
  if (isProduction && API_BASE_URL) {
    return API_BASE_URL.replace(/\/+$/, '');
  }
  return `http://${LOCAL_IP}:${API_PORT}`;
})();

export const APP_URL = resolvedAppUrl;
export const BASE_URL = `${APP_URL}/api`;

// eslint-disable-next-line no-console
console.log('[API] Environment:', {
  APP_ENV: AppEnv,
  isProduction,
  LOCAL_IP,
  API_PORT,
  API_BASE_URL,
  APP_URL,
  BASE_URL,
});

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
 * @param {object} error - Native or API error
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
    const resolvedStatus = serverData.statusCode ?? statusCode;

    if (
      resolvedStatus === 401 ||
      resolvedStatus === 403 ||
      /token|jwt|unauthorized|forbidden/i.test(serverData.message ?? '')
    ) {
      return {
        statusCode: resolvedStatus,
        message: 'Something went wrong.',
        error: {
          message: 'Please try again or log in again.',
          code: 'AUTH_ERROR',
        },
        data: null,
      };
    }

    return {
      statusCode: resolvedStatus,
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
    error.name === 'AbortError' ||
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

  if (code === 'ERR_CANCELED' || (error.name === 'AbortError' && !error.isTimeout)) {
    console.warn('[API] Request was canceled');
    return {
      statusCode: 499,
      message: 'Request was canceled.',
      error: {
        message:
          'The request was canceled. If this happens during sign up or login, the server may be unreachable.',
        code: ERROR_CODES.CANCELED,
      },
      data: null,
    };
  }

  if (
    code === 'ERR_NETWORK' ||
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    error.message === 'Network Error' ||
    error.message?.includes('Failed to fetch')
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

/**
 * apiClient - A fetch-based wrapper that mimics the Axios request interface.
 */
const apiClient = {
  request: async (config) => {
    const {
      url,
      method = 'GET',
      data,
      headers = {},
      params,
      timeout = DEFAULT_TIMEOUT,
      signal: externalSignal,
    } = config;

    const controller = new AbortController();
    const signal = externalSignal || controller.signal;

    const timeoutId = setTimeout(() => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'AbortError';
      timeoutError.isTimeout = true;
      controller.abort();
    }, timeout);

    try {
      // Build full URL with params if applicable
      let fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
      if (params && Object.keys(params).length > 0) {
        const queryStrings = Object.entries(params)
          .filter(([_, v]) => v != null)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&');
        if (queryStrings) {
          fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryStrings;
        }
      }

      const isFormData = data instanceof FormData;
      const requestHeaders = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      };

      if (isFormData) {
        // eslint-disable-next-line no-console
        console.log('📦 [API] Detected FormData, removing Content-Type to allow boundary auto-generation');
        delete requestHeaders['Content-Type'];
      }

      // eslint-disable-next-line no-console
      console.log(`🚀 [API] ${method.toUpperCase()} ${fullUrl}`, {
        hasData: !!data,
        isFormData,
        headerCount: Object.keys(requestHeaders).length,
      });

      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
        signal,
      }).catch(err => {
        // eslint-disable-next-line no-console
        console.error('🔥 [API] NATIVE FETCH CRASHED:', {
          message: err.message,
          name: err.name,
          url: fullUrl
        });
        throw err;
      });

      // eslint-disable-next-line no-console
      console.log(`📥 [API] ${method.toUpperCase()} ${fullUrl} -> ${response.status} ${response.statusText}`);

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      let responseData = null;
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json().catch(() => null);
      } else {
        responseData = await response.text().catch(() => null);
      }

      if (!response.ok) {
        const error = new Error(response.statusText || `HTTP ${response.status}`);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
        };
        throw error;
      }

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      const normalized = normalizeApiError(error);
      throw normalized;
    }
  },

  get: (url, config = {}) => apiClient.request({ ...config, url, method: 'GET' }),
  post: (url, data, config = {}) => apiClient.request({ ...config, url, data, method: 'POST' }),
  put: (url, data, config = {}) => apiClient.request({ ...config, url, data, method: 'PUT' }),
  patch: (url, data, config = {}) => apiClient.request({ ...config, url, data, method: 'PATCH' }),
  delete: (url, config = {}) => apiClient.request({ ...config, url, method: 'DELETE' }),
};

export default apiClient;

