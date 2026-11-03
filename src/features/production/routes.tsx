import { lazy, Suspense } from "react";
import { LoadingState } from "@/shared/ui/PageState";
const List = lazy(() => import("./ProductionPage"));
const Detail = lazy(() => import("./ProductionDetailPage"));
export const productionRoutes = [
  {
    path: "/production",
    element: (
      <Suspense fallback={<LoadingState />}>
        <List />
      </Suspense>
    ),
    permission: "production:read",
  },
  {
    path: "/production/:id",
    element: (
      <Suspense fallback={<LoadingState />}>
        <Detail />
      </Suspense>
    ),
    permission: "production:write",
  },
];
