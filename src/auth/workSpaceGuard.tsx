import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./authContext";
import { hasWorkspaceContext } from "./authMapper";

const SETUP_FLOW_PATHS = [
  "/branch-fiscal-year",
  "/login",
  "/settings/general/company-settings",
  "/settings/general/branch-settings",
];

export default function WorkspaceGuard() {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <div>Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;

  const isSetupFlowPath = SETUP_FLOW_PATHS.some((path) => {
    if (location.pathname === path) return true;
    return location.pathname.startsWith(`${path}/`);
  });

  if (!hasWorkspaceContext(session) && !isSetupFlowPath) {
    return <Navigate to="/branch-fiscal-year" replace />;
  }

  return <Outlet />;
}