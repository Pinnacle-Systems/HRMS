import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./authContext";
import { hasWorkspaceContext } from "./authMapper";

export default function WorkspaceGuard() {
  const { session, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!session) return <Navigate to="/login" replace />;

  if (!hasWorkspaceContext(session)) {
    return <Navigate to="/branch-fiscal-year" replace />;
  }

  return <Outlet />;
}