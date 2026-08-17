import { Navigate, Outlet, useLocation } from "react-router-dom";
import { logger } from "../utils/logger";
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
  permissionMode = 'any',
}: ProtectedRouteProps) {

  const { session, isLoading, hasAnyRole, hasAnyPermission, hasAllPermissions } = useAuth();
  const location = useLocation();  

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!session) {
    logger.info("Protected route blocked unauthenticated user", {
      path: location.pathname,
    });
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = session.user;
  // const hasRole = !allowedRoles?.length || allowedRoles.some((role) => user.roles.includes(role));
  
  const hasRole = !allowedRoles?.length || hasAnyRole(allowedRoles);

  // const hasPermission =
  //   !requiredPermissions?.length ||
  //   requiredPermissions.every((permission) =>
  //      user.permissions && user.permissions.includes(permission),
  //   );
  let hasPermission = true;
  if (requiredPermissions?.length) {
    if (permissionMode === 'any') {
      hasPermission = hasAnyPermission(requiredPermissions);
    } else {
      hasPermission = hasAllPermissions(requiredPermissions);
    }
  }

  if (!hasRole || !hasPermission) {
    logger.warn("Protected route denied access", {
      path: location.pathname,
      userId: user.userId,
      roles: user.roles,
      requiredRoles: allowedRoles,
      requiredPermissions,
      hasRole,
      hasPermission,
    });
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}