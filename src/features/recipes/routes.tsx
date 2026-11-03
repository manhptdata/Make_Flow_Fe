import { lazy, Suspense } from "react";
import type { AppRoute } from "@/routes/types";
import { LoadingState } from "@/shared/ui/PageState";
const Page = lazy(() => import("./RecipesPage"));
const element = (
  <Suspense fallback={<LoadingState />}>
    <Page />
  </Suspense>
);
export const recipeRoutes: AppRoute[] = ["/recipes", "/estimates"].map((path) => ({
  path,
  element,
  permission: "recipe:read",
}));
