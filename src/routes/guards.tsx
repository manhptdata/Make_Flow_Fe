import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useGetSessionQuery } from "@/features/auth/api";
import { LoadingState } from "@/shared/ui/PageState";

export function AuthGuard() {
  const location = useLocation();
  const session = useGetSessionQuery();
  if (session.isLoading || session.isFetching)
    return (
      <div className="p-6">
        <LoadingState />
      </div>
    );
  if (session.error) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function PermissionGuard({
  permission,
  children,
}: {
  permission?: string;
  children: React.ReactNode;
}) {
  const { data: session } = useGetSessionQuery();
  if (
    permission &&
    session &&
    !session.permissions.includes("*") &&
    !session.permissions.includes(permission)
  )
    return <Navigate to="/forbidden" replace />;
  return children;
}
