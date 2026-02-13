import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../api/baseQuery';
import { AlertNotification } from './../../components/AlertNotification';

export const AvailabilitySlice = createApi({
  reducerPath: 'availabilitySlice',
  baseQuery: axiosBaseQuery({
    baseUrl: '',
  }),
  tagTypes: ['Availability', 'AvailabilitySlots'],
  endpoints(build) {
    return {
      getAvailabilitySlots: build.query({
        query: (query) => {
          return {
            url: `/availability/slots`,
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
          return currentArg !== previousArg;
        },
        providesTags: ['AvailabilitySlots'],
      }),
      saveAvailabilitySlots: build.mutation({
        query: (payload) => {
          return {
            url: `/availability/slots`,
            method: 'post',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
            data: payload,
          };
        },
        transformResponse: async (response) => {
          AlertNotification({
            title: 'Save Success',
            textBody: 'Your availability slot successfully saved',
            variant: 'toast',
            type: 'success',
          });
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
          return currentArg !== previousArg;
        },
        invalidatesTags: ['AvailabilitySlots'],
      }),
    };
  },
});

export const {
  useGetAvailabilitySlotsQuery,
  useSaveAvailabilitySlotsMutation,
} = AvailabilitySlice;
