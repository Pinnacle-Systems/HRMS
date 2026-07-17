import type { ReactNode } from 'react';
import { useAuth } from '../auth/authContext';
import type { Permission } from './authTypes';

interface PermissionGuardProps {
  children: ReactNode;
  permissions?: Permission | Permission[];
  mode?: 'any' | 'all';
  fallback?: ReactNode;
}

export const PermissionGuard = ({
  children,
  permissions,
  mode = 'any',
  fallback = null,
}: PermissionGuardProps) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  if (!permissions) {
    return <>{children}</>;
  }

  const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
  
  let hasAccess = false;
  if (mode === 'any') {
    hasAccess = hasAnyPermission(permissionArray);
  } else {
    hasAccess = hasAllPermissions(permissionArray);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};