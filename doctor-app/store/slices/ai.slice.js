import { createApi } from '@reduxjs/toolkit/query/react';
import { apiFetchBaseQuery } from '../api/baseQuery';
import { AlertNotification } from '../../components/AlertNotification';

export const AISlice = createApi({
  reducerPath: 'aiSlice',
  baseQuery: apiFetchBaseQuery({
    baseUrl: '',
  }),
  tagTypes: ['AIClassification', 'ChatHistory'],
  endpoints(build) {
    return {
      classifySymptoms: build.mutation({
        query: (data) => ({
          url: `/ai/search-ai`,
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          data,
        }),
        transformResponse: async (response) => {
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          AlertNotification({
            title: response.message || 'AI Classification Failed',
            textBody: error?.message || error || 'Unable to classify symptoms',
            variant: 'toast',
            type: 'danger',
          });
          return response;
        },
        invalidatesTags: ['AIClassification'],
      }),

      transcribeAudio: build.mutation({
        query: (formData) => ({
          url: `/ai/transcribe`,
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'multipart/form-data',
          },
          data: formData,
        }),
        transformResponse: async (response) => {
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          AlertNotification({
            title: response.message || 'Voice Transcription Failed',
            textBody: error?.message || error || 'Unable to transcribe audio',
            variant: 'toast',
            type: 'danger',
          });
          return response;
        },
      }),

      getChatHistory: build.query({
        query: ({ limit = 25, before } = {}) => ({
          url: '/ai/chat/history',
          method: 'GET',
          params: { limit, ...(before && { before }) },
        }),
        transformResponse: (response) => response?.data,
        providesTags: ['ChatHistory'],
      }),

      chat: build.mutation({
        query: (data) => ({
          url: `/ai/chat`,
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          data,
        }),
        transformResponse: async (response) => {
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          // Don't show toast for chat errors, handle in component
          return response;
        },
        invalidatesTags: ['ChatHistory'],
      }),

      tts: build.mutation({
        query: (data) => ({
          url: `/ai/tts`,
          method: 'POST',
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
          data,
        }),
        transformResponse: async (response) => {
          return response?.data;
        },
        transformErrorResponse: (response) => {
          const error = response?.error;
          AlertNotification({
            title: response.message || 'Voice Playback Failed',
            textBody:
              error?.message || error || 'Unable to generate assistant audio',
            variant: 'toast',
            type: 'danger',
          });
          return response;
        },
      }),
    };
  },
});

export const {
  useClassifySymptomsMutation,
  useTranscribeAudioMutation,
  useGetChatHistoryQuery,
  useLazyGetChatHistoryQuery,
  useChatMutation,
  useTtsMutation,
} = AISlice;
