import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../api/baseQuery';
import {
  AlertNotification,
  ALERT_DIALOG,
  ALERT_WARNING,
  ALERT_DANGER,
  ALERT_TOAST,
  ALERT_SUCCESS,
} from './../../components/AlertNotification';

export const BookingsSlice = createApi({
  reducerPath: 'bookingsSlice',
  baseQuery: axiosBaseQuery({
    baseUrl: '',
  }),
  tagTypes: ['Bookings', 'Booking'],
  endpoints(build) {
    return {
      getBookings: build.query({
        query: (query) => {
          delete query?.refresh;
          return {
            url: `/bookings`,
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
            variant: ALERT_TOAST,
            type: response?.statusCode == 400 ? ALERT_WARNING : ALERT_DANGER,
          });
          return response;
        },
        // keepUnusedDataFor: 60,
        forceRefetch({ currentArg, previousArg }) {
          const refresh = currentArg?.refresh;
          delete currentArg?.refresh;
          return (
            JSON.stringify(currentArg) !== JSON.stringify(previousArg) ||
            refresh === true
          );
        },
        providesTags: ['Bookings'],
      }),
      getBooking: build.query({
        query: (bookingId) => {
          return {
            url: `/bookings/${bookingId}`,
            method: 'get',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
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
            variant: ALERT_TOAST,
            type: response?.statusCode == 400 ? ALERT_WARNING : ALERT_DANGER,
          });
          return response;
        },
        // keepUnusedDataFor: 60,
        forceRefetch({ currentArg, previousArg }) {
          // return currentArg !== previousArg;
          return true;
        },
        providesTags: ['Booking'],
      }),
      generatePaymentSecret: build.mutation({
        query: (payload) => {
          return {
            url: `/bookings/payment`,
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
            title: 'Booking is ready to payment',
            textBody: 'Please complete payment process.',
            variant: ALERT_TOAST,
            type: ALERT_SUCCESS,
          });
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          AlertNotification({
            title: response.message,
            textBody: error?.message || 'Please try again.',
            variant: ALERT_TOAST,
            type: ALERT_DANGER,
          });
          return response;
        },
      }),
      createBooking: build.mutation({
        query: (payload) => {
          return {
            url: `/bookings`,
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
            title: 'Booking Success',
            textBody: 'Your booking successfully placed',
            variant: ALERT_DIALOG,
            type: ALERT_SUCCESS,
          });
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          AlertNotification({
            title: response.message,
            textBody: error?.message || error,
            variant: ALERT_DIALOG,
            type: response?.statusCode == 400 ? ALERT_WARNING : ALERT_DANGER,
          });
          return response;
        },
        invalidatesTags: ['Bookings', 'Booking'],
      }),
      updateBooking: build.mutation({
        query: (payload) => {
          return {
            url: `/bookings/${payload?.id}`,
            method: 'put',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
            data: payload?.data,
          };
        },
        transformResponse: async (response) => {
          return response;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          AlertNotification({
            title: response.message,
            textBody: error?.message || error,
            variant: ALERT_DIALOG,
            type: response?.statusCode == 400 ? ALERT_WARNING : ALERT_DANGER,
          });
          return response;
        },
        invalidatesTags: ['Bookings', 'Booking'],
      }),
      reviewBooking: build.mutation({
        query: (payload) => {
          return {
            url: `/bookings/${payload?.id}/review`,
            method: 'post',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
            data: payload?.data,
          };
        },
        transformResponse: async (response) => {
          return response;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          AlertNotification({
            title: response.message,
            textBody: error?.message
              ? Array.isArray(error?.message)
                ? error?.message?.join(', ')
                : error?.message
              : error,
            variant: ALERT_DIALOG,
            type:
              response?.statusCode >= 400 && response?.statusCode < 500
                ? ALERT_WARNING
                : ALERT_DANGER,
          });
          return response;
        },
        invalidatesTags: ['Bookings', 'Booking'],
      }),
    };
  },
});

export const {
  useGetBookingsQuery,
  useGetBookingQuery,
  useCreateBookingMutation,
  useUpdateBookingMutation,
  useReviewBookingMutation,
  useGeneratePaymentSecretMutation,
} = BookingsSlice;
