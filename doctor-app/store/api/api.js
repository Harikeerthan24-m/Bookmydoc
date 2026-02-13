import { Platform } from 'react-native';
import axios from 'axios';
// import { APP_ENV, API_URL, API_BASE_URL } from '@env';
import Constants from 'expo-constants';
const { APP_ENV, API_URL, API_BASE_URL } = Constants.expoConfig.extra;

const AppEnv = process.env?.APP_ENV || APP_ENV;

// In development, use localhost/emulator addresses
// In production, use the environment variable from .env
export const APP_URL =
  AppEnv === 'development' ? `http://localhost:3000` : API_URL;

export const BASE_URL =
  AppEnv === 'production'
    ? process.env?.API_BASE_URL || API_BASE_URL
    : Platform.OS === 'ios'
      ? 'http://localhost:8080/api' // iOS Simulator can use localhost
      : 'http://192.168.1.6:8080/api'; // Your laptop's local IP for physical device and also always change the ip address in the .env file

const DEFAULT_TIMEOUT = 30_000;

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
  // console.log(config.baseURL, config.url);
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
    console.warn(
      `[API] Request timeout: ${config.method?.toUpperCase()} ${config.url}`,
    );
  }, DEFAULT_TIMEOUT);

  // Store timeout ID for cleanup
  config.timeoutId = timeoutId;
  config.signal = abortController.signal;
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Clear timeout on successful response
    if (response.config?.timeoutId) {
      clearTimeout(response.config.timeoutId);
    }
    return response;
  },
  (error) => {
    // Clear timeout on error
    if (error.config?.timeoutId) {
      clearTimeout(error.config.timeoutId);
    }

    // Handle network errors specifically
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      console.error('[API] Network error - backend may be unreachable');
      return Promise.reject({
        statusCode: 500,
        data: null,
        error: 'Network Error',
        message: 'Unable to connect to server. Please check your connection.',
      });
    }

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
