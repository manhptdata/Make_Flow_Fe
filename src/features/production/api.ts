import { baseApi } from "@/app/api/baseApi";
import type { ResourceQuery, ResourceResponse } from "@/shared/api/resource";
const productionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProductionRecords: builder.query<ResourceResponse, ResourceQuery>({
      query: ({ resource }) => `/${resource}`,
      providesTags: (_r, _e, arg) => [{ type: "Resource", id: arg.resource }],
    }),
    completeProduction: builder.mutation<
      { status: "completed"; usable_quantity: string; rejected_quantity: string },
      { id: string; idempotencyKey: string }
    >({
      query: ({ id, idempotencyKey }) => ({
        url: `/production/batches/${id}/complete`,
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey },
        body: { usable_quantity: "96", rejected_quantity: "4", rejection_reason: "over_baked" },
      }),
      invalidatesTags: [{ type: "Resource", id: "production/batches" }, "Dashboard"],
    }),
  }),
});
export const { useGetProductionRecordsQuery, useCompleteProductionMutation } = productionApi;
