import { baseApi } from "@/app/api/baseApi";
import type { CreateResourceRequest } from "@/shared/api/resource";
import type { ListItem } from "@/shared/types/api";

const resourceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createResource: builder.mutation<ListItem, CreateResourceRequest>({
      query: ({ resource, body, idempotencyKey }) => ({
        url: `/${resource}`,
        method: "POST",
        body,
        headers: { "Idempotency-Key": idempotencyKey },
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: "Resource", id: arg.resource }],
    }),
  }),
});

export const { useCreateResourceMutation } = resourceApi;
