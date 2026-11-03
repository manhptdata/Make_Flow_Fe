import { lazy, Suspense } from "react";
import { LoadingState } from "@/shared/ui/PageState";
const Page = lazy(() => import("./PosPage"));
export const posRoutes = [
  {
    path: "/pos",
    element: (
      <Suspense fallback={<LoadingState />}>
        <Page />
      </Suspense>
    ),
    permission: "pos:sell",
  },
];
