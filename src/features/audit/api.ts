import { baseApi } from "@/app/api/baseApi";
import type { ResourceQuery, ResourceResponse } from "@/shared/api/resource";
const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuditEvents: builder.query<ResourceResponse, ResourceQuery>({
      query: ({ resource }) => `/${resource}`,
      providesTags: (_r, _e, arg) => [{ type: "Resource", id: arg.resource }],
    }),
  }),
});
export const { useGetAuditEventsQuery } = auditApi;
