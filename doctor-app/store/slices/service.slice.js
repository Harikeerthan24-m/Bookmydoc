import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../api/baseQuery';
import { AlertNotification } from './../../components/AlertNotification';

export const ServiceSlice = createApi({
  reducerPath: 'serviceSlice',
  baseQuery: axiosBaseQuery({
    baseUrl: '',
  }),
  tagTypes: ['Service', 'Facts'],
  endpoints(build) {
    return {
      // region GET SERVICES
      getAllServices: build.query({
        query: (query) => {
          delete query?.refresh;
          return {
            url: `/service`,
            method: 'get',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
            params: query,
          };
        },
        transformResponse: async (response) => {
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          AlertNotification({
            title: response.message,
            textBody: error?.message || error,
            variant: 'toast',
            type: 'danger',
          });
          return response;
        },
        forceRefetch({ currentArg, previousArg }) {
          const refresh = currentArg?.refresh;
          delete currentArg?.refresh;
          return (
            JSON.stringify(currentArg) !== JSON.stringify(previousArg) ||
            refresh === true
          );
        },
        providesTags: ['Service'],
      }),
      // region GET FACTS
      getFacts: build.query({
        query: (query) => {
          delete query?.refresh;
          return {
            url: `/facts`,
            method: 'get',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
            params: query,
          };
        },
        transformResponse: async (response) => {
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          AlertNotification({
            title: response.message,
            textBody: error?.message || error,
            variant: 'toast',
            type: 'danger',
          });
          return response;
        },
        forceRefetch({ currentArg, previousArg }) {
          const refresh = currentArg?.refresh;
          delete currentArg?.refresh;
          return (
            JSON.stringify(currentArg) !== JSON.stringify(previousArg) ||
            refresh === true
          );
        },
        providesTags: ['Facts'],
      }),
    };
  },
});

export const { useGetAllServicesQuery, useGetFactsQuery } = ServiceSlice;
