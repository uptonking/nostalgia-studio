import { type IAttachmentItem } from '@datalking/pivot-core';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { type RootState } from '../store/reducer';

export const attachment = createApi({
  reducerPath: 'attachment',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
    },
  }),
  endpoints: (builder) => ({
    upload: builder.mutation<IAttachmentItem, FormData>({
      query: (data) => ({
        url: 'attachment/upload',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useUploadMutation } = attachment;
