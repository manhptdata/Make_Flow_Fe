import { baseApi } from "@/app/api/baseApi";
import type { ResourceQuery, ResourceResponse } from "@/shared/api/resource";

const catalogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCatalogRecords: builder.query<ResourceResponse, ResourceQuery>({
      query: ({ resource }) => ({ url: `/${resource}` }),
      providesTags: (_result, _error, arg) => [{ type: "Resource", id: arg.resource }],
    }),
  }),
});

export const { useGetCatalogRecordsQuery } = catalogApi;
