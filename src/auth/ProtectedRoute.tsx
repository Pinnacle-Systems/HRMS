import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";
import type { ProtectedRouteProps } from "./authTypes";

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-500">
      Loading...
    </div>
  );
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermissions,
}: ProtectedRouteProps) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = session.user;
  const hasRole =
    !allowedRoles?.length ||
    allowedRoles.some((role) => user.roles.includes(role));
  const hasPermission =
    !requiredPermissions?.length ||
    requiredPermissions.every((permission) =>
      user.permissions.includes(permission),
    );

  if (!hasRole || !hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
