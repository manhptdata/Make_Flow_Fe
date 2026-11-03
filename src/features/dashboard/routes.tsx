import { lazy, Suspense } from "react";
import { LoadingState } from "@/shared/ui/PageState";
const Page = lazy(() => import("./DashboardPage"));
export const dashboardRoutes = [
  {
    path: "/dashboard",
    element: (
      <Suspense fallback={<LoadingState />}>
        <Page />
      </Suspense>
    ),
    permission: "dashboard:read",
  },
];
