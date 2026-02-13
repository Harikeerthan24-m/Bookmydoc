import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../api/baseQuery';
import { toast } from 'react-toastify';
import {
  ToastSuccessMessage,
  ToastErrorMessage,
  ToastMessage,
} from '../../components/common/ToastMessageWrapper';

const BookingID = 'BookingID' + Date.now();

export const BookingsSlice = createApi({
  reducerPath: 'bookingsSlice',
  baseQuery: axiosBaseQuery({
    baseUrl: '',
  }),
  tagTypes: ['Bookings'],
  endpoints(build) {
    return {
      getBookings: build.query({
        query: (query) => {
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
          ToastErrorMessage({
            title: response?.message,
            message: error?.message || error,
          });
          return response;
        },
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
        providesTags: ['Bookings'],
      }),
      updateBooking: build.mutation({
        query: (payload) => {
          ToastMessage({
            title: 'Booking updating...',
            options: { type: 'info', isLoading: true, toastId: BookingID },
          });
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
          ToastSuccessMessage({
            title: 'Update Success',
            message: 'Your booking successfully updated',
          });
          toast.dismiss(BookingID);
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          ToastErrorMessage({
            title: response?.message,
            message: error?.message || error,
          });
          toast.dismiss(BookingID);
          return response;
        },
        forceRefetch({ currentArg, previousArg }) {
          return currentArg !== previousArg;
        },
        invalidatesTags: ['Bookings'],
      }),
    };
  },
});

export const { useGetBookingsQuery, useUpdateBookingMutation } = BookingsSlice;
