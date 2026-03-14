import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../api/baseQuery';

export const VoiceAssistantSlice = createApi({
  reducerPath: 'VoiceAssistantSlice',
  baseQuery: axiosBaseQuery({
    baseUrl: '',
  }),
  tagTypes: ['VoiceAssistant'],
  endpoints: (build) => {
    return {
      getRealtimeToken: build.mutation({
        query: () => ({
          url: `/voice/realtime-token`,
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }),
        transformResponse: async (response) => response?.data, // => { token, session }
      }),
    };
  },
});

export const { useGetRealtimeTokenMutation } = VoiceAssistantSlice;
