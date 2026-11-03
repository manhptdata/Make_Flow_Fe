import { lazy, Suspense } from "react";
import { LoadingState } from "@/shared/ui/PageState";
const Page = lazy(() => import("./JobsPage"));
const element = (
  <Suspense fallback={<LoadingState />}>
    <Page />
  </Suspense>
);
export const jobRoutes = ["/jobs", "/imports"].map((path) => ({ path, element, permission: "jobs:read" }));
