import { lazy, Suspense } from "react";
import { LoadingState } from "@/shared/ui/PageState";
const Page = lazy(() => import("./SalesPage"));
export const salesRoutes = [
  {
    path: "/sales/orders",
    element: (
      <Suspense fallback={<LoadingState />}>
        <Page />
      </Suspense>
    ),
    permission: "sales:read",
  },
];
