import { baseApi } from "@/app/api/baseApi";
export interface PosProduct {
  id: string;
  code: string;
  name: string;
  price: string;
  stock: string;
  unit: string;
}
export interface CheckoutRequest {
  lines: Array<{ product_id: string; quantity: string }>;
  payment_method: "cash" | "transfer";
  received_amount: string;
  idempotency_key: string;
}
export interface CheckoutResponse {
  order_id: string;
  order_code: string;
  total: string;
  change: string;
}
const posApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosProducts: builder.query<{ data: PosProduct[] }, void>({
      query: () => "/pos/products",
      providesTags: ["Cart"],
    }),
    checkout: builder.mutation<CheckoutResponse, CheckoutRequest>({
      query: (body) => ({
        url: "/pos/checkout",
        method: "POST",
        body,
        headers: { "Idempotency-Key": body.idempotency_key },
      }),
      invalidatesTags: ["Cart", "Dashboard", { type: "Resource", id: "orders" }],
    }),
  }),
});
export const { useGetPosProductsQuery, useCheckoutMutation } = posApi;
