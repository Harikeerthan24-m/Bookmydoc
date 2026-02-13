import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../api/baseQuery';

export const NotificationsSlice = createApi({
  reducerPath: 'notificationsSlice',
  baseQuery: axiosBaseQuery({
    baseUrl: '',
  }),
  tagTypes: ['Notifications'],
  endpoints(build) {
    return {
      getNotifications: build.query({
        query: () => ({
          url: '/notifications',
          method: 'get',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }),
        transformResponse: async (response) => {
          return response?.data;
        },
        providesTags: ['Notifications'],
      }),
      markAsRead: build.mutation({
        query: (notificationId) => ({
          url: `/notifications/${notificationId}/read`,
          method: 'post',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }),
        invalidatesTags: ['Notifications'],
      }),
      markAllAsRead: build.mutation({
        query: () => ({
          url: '/notifications/read-all',
          method: 'post',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }),
        invalidatesTags: ['Notifications'],
      }),
    };
  },
});
