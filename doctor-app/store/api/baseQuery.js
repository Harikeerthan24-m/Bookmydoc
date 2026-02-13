import apiClient from './api';
import { refreshAuth } from './../slices/auth.slice';

export const axiosBaseQuery = ({ baseUrl } = { baseUrl: '' }) => {
  return async (
    { url, method, data, params, headers, extraConfig, clientRequest },
    api,
  ) => {
    if (clientRequest) {
      const result = clientRequest(api);
      if (result?.error?.server !== true) {
        return result;
      }
    }

    try {
      const state = api.getState();
      const accessToken =
        state?.authSlice?.user?.accessToken ??
        state?.authSlice?.user?.stsTokenManager?.accessToken;
      headers = {
        ...headers,
      };

      if (!headers?.['xi-api-key']) {
        url = baseUrl + url;
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const result = await apiClient.request({
        url,
        method,
        data,
        params,
        headers,
        ...extraConfig,
      });

      return {
        data: result.data,
      };
    } catch (errors) {
      const error = errors;
      // console.log('axiosBaseQuery', error);
      if (error?.statusCode === 401) {
        error.error.message = 'Something was wrong.';
        error.message = 'Please try again.';
        if (method?.toLocaleLowerCase() === 'get') {
          error.error.message = '';
          error.message = 'Please reload.';
        }
        api.dispatch(
          refreshAuth({
            expirationTime: null,
            stsTokenManager: null,
          }),
        );
      }
      return {
        error,
      };
    }
  };
};
