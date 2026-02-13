import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../api/baseQuery';
import { toast } from 'react-toastify';
import {
  ToastSuccessMessage,
  ToastErrorMessage,
  ToastMessage,
} from '../../components/common/ToastMessageWrapper';

const AvailabilityID = 'AvailabilityID' + Date.now();

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
          ToastErrorMessage({
            title: response?.message,
            message: error?.message || error,
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
          ToastMessage({
            title: 'Slots Saving....',
            options: { type: 'info', isLoading: true, toastId: AvailabilityID },
          });
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
          ToastSuccessMessage({
            title: 'Save Success',
            message: 'Your availability slot successfully saved',
          });
          toast.dismiss(AvailabilityID);
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          ToastErrorMessage({
            title: response?.message,
            message: error?.message || error,
          });
          toast.dismiss(AvailabilityID);
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
