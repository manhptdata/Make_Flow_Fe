import { baseApi } from "@/app/api/baseApi";
import type { ResourceQuery, ResourceResponse } from "@/shared/api/resource";
const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdminRecords: builder.query<ResourceResponse, ResourceQuery>({
      query: ({ resource }) => `/${resource}`,
      providesTags: (_r, _e, arg) => [{ type: "Resource", id: arg.resource }],
    }),
  }),
});
export const { useGetAdminRecordsQuery } = adminApi;
