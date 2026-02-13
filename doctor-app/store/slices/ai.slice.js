import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '../api/baseQuery';
import { AlertNotification } from '../../components/AlertNotification';

export const AISlice = createApi({
  reducerPath: 'aiSlice',
  baseQuery: axiosBaseQuery({
    baseUrl: '',
  }),
  tagTypes: ['AIClassification'],
  endpoints(build) {
    return {
      classifySymptoms: build.mutation({
        query: (data) => ({
          url: `/ai/classify-symptoms`,
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
    };
  },
});

export const { useClassifySymptomsMutation, useTranscribeAudioMutation } =
  AISlice;
