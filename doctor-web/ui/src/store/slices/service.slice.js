import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../api/baseQuery';
import {
  ToastErrorMessage,
  ToastMessage,
  ToastSuccessMessage,
} from '../../components/common/ToastMessageWrapper';
import { toast } from 'react-toastify';

export const ServiceSlice = createApi({
  reducerPath: 'serviceSlice',
  baseQuery: axiosBaseQuery({
    baseUrl: '',
  }),
  tagTypes: ['Service'],
  endpoints(build) {
    return {
      createService: build.mutation({
        query: (payload) => {
          // Get the current user from auth state
          const accessToken = localStorage.getItem('accessToken');
          if (!accessToken) {
            throw new Error('You must be logged in to create a service');
          }

          ToastMessage({
            title: 'Creating service...',
            options: {
              type: 'info',
              isLoading: true,
              toastId: 'createService',
            },
          });

          return {
            url: `/service`,
            method: 'post',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            data: {
              name: payload.name,
              duration: payload.duration,
              price: payload.price,
              description: payload.description,
            },
          };
        },
        transformResponse: async (response) => {
          ToastSuccessMessage({
            title: 'Service Created',
            message: 'Service successfully created',
          });
          toast.dismiss('createService');
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          ToastErrorMessage({
            title: response?.message,
            message: error?.message || error,
          });
          toast.dismiss('createService');
          return response;
        },
        invalidatesTags: ['Service'],
      }),

      updateService: build.mutation({
        query: (payload) => {
          ToastMessage({
            title: 'Updating service...',
            options: {
              type: 'info',
              isLoading: true,
              toastId: 'updateService',
            },
          });
          return {
            url: `/service/${payload?.id}`,
            method: 'put',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
            data: {
              name: payload.data.name,
              duration: payload.data.duration,
              price: payload.data.price,
              description: payload.data.description,
              createdBy: payload.data.createdBy,
            },
          };
        },
        transformResponse: async (response) => {
          ToastSuccessMessage({
            title: 'Service Updated',
            message: 'Service successfully updated',
          });
          toast.dismiss('updateService');
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          ToastErrorMessage({
            title: response?.message,
            message: error?.message || error,
          });
          toast.dismiss('updateService');
          return response;
        },
        invalidatesTags: ['Service'],
      }),

      deleteService: build.mutation({
        query: (id) => {
          ToastMessage({
            title: 'Deleting service...',
            options: {
              type: 'info',
              isLoading: true,
              toastId: 'deleteService',
            },
          });
          return {
            url: `/service/${id}`,
            method: 'delete',
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
          };
        },
        transformResponse: async (response) => {
          ToastSuccessMessage({
            title: 'Service Deleted',
            message: 'Service successfully deleted',
          });
          toast.dismiss('deleteService');
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          ToastErrorMessage({
            title: response?.message,
            message: error?.message || error,
          });
          toast.dismiss('deleteService');
          return response;
        },
        invalidatesTags: ['Service'],
      }),

      // region GET ALL SERVICES
      getAllServices: build.query({
        query: (query) => {
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
          const services = response?.data?.map((service) => ({
            id: service.id,
            name: service.name,
            duration: service.duration,
            price: service.price,
            description: service.description,
            createdBy: service.createdBy,
          }));
          return services;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          ToastErrorMessage({
            title: response?.message,
            message: error?.message || error,
          });
          return response;
        },
        // forceRefetch({ currentArg, previousArg }) {
        //   return currentArg !== previousArg;
        // },
        providesTags: ['Service'],
      }),
    };
  },
});

export const {
  useGetAllServicesQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
} = ServiceSlice;
