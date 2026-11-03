import { baseApi } from "@/app/api/baseApi";
export interface DashboardData {
  revenue: string;
  inventory_value: string;
  active_batches: number;
  rejection_rate: string;
  low_stock: number;
  sales: Array<{ label: string; value: number }>;
}
const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query<DashboardData, void>({
      query: () => "/dashboard",
      providesTags: ["Dashboard"],
    }),
  }),
});
export const { useGetDashboardQuery } = dashboardApi;
