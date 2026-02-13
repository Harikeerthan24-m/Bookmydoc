import apiClient from './api';

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
      const accessToken = localStorage.getItem('accessToken');
      headers = {
        ...headers,
      };

      if (!headers?.['xi-api-key']) {
        url = baseUrl + url;
        headers.Authorization = `Bearer ${accessToken}`;
      }

      url = '/api' + url;

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
        error.message = 'Something was wrong. Try again.';
      }
      return {
        error,
      };
    }
  };
};
