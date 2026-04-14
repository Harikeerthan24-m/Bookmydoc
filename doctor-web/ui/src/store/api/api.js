const { NODE_ENV } = process.env;

// More robust API URL configuration
export const API_BASE_URL = (() => {
  if (NODE_ENV === 'development') {
    return 'http://localhost:8080/';
  }

  // For production, try environment variable first, then fallback to relative URL for same-origin deployment
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
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

const DEFAULT_TIMEOUT = 30_000;

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
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const accessToken = localStorage.getItem('accessToken');

    try {
      // Build full URL
      let fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.replace(/^\//, '')}`;
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
        Authorization: accessToken ? `Bearer ${accessToken}` : undefined,
        ...headers,
      };

      if (isFormData) {
        delete requestHeaders['Content-Type'];
      }

      const response = await fetch(fullUrl, {
        method,
        headers: requestHeaders,
        body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
        signal,
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      let responseData = null;
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json().catch(() => null);
      } else {
        responseData = await response.text().catch(() => null);
      }

      if (!response.ok) {
        if (responseData) {
          throw responseData;
        }
        const statusCode = response.status || 500;
        throw {
          statusCode,
          data: null,
          error: response.statusText,
          message: response.statusText || `HTTP ${response.status}`,
        };
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
      // If it's already an error object we threw, just pass it along
      if (error.statusCode) {
        throw error;
      }
      
      // Handle network errors or other fetch exceptions
      throw {
        statusCode: 500,
        data: null,
        error: error.name || 'Error',
        message: error.message || 'Something went wrong',
      };
    }
  },

  get: (url, config = {}) => apiClient.request({ ...config, url, method: 'GET' }),
  post: (url, data, config = {}) => apiClient.request({ ...config, url, data, method: 'POST' }),
  put: (url, data, config = {}) => apiClient.request({ ...config, url, data, method: 'PUT' }),
  patch: (url, data, config = {}) => apiClient.request({ ...config, url, data, method: 'PATCH' }),
  delete: (url, config = {}) => apiClient.request({ ...config, url, method: 'DELETE' }),
};

export default apiClient;

