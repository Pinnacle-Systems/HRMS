import { Navigate, Outlet } from "react-router-dom";

const Route = () => {
  const token = localStorage.getItem("accessToken");
  return token ? <Outlet /> : <Navigate to="/login" />;
};

export default Route;