import { Tab, Tabs } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../auth/authContext";
import { getVisibleLeaveRoutes, type LeaveRouteGroup } from "../leaveRoutes";

type LeaveTabsProps = {
  group?: LeaveRouteGroup;
};

export default function LeaveTabs({ group }: LeaveTabsProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const visibleRoutes = getVisibleLeaveRoutes(session?.user, group);

  return (
    <Tabs
      value={location.pathname}
      variant="scrollable"
      scrollButtons="auto"
      className="!border-b !border-gray-300"
      sx={{
        "& .MuiTabs-indicator": {
          backgroundColor: "var(--color-primary)",
          height: 3,
        },
      }}
    >
      {visibleRoutes.map((route) => (
        <Tab
          key={route.path}
          value={route.path}
          label={route.label}
          onClick={() => navigate(route.path)}
          className="!text-gray-900"
        />
      ))}
    </Tabs>
  );
}
