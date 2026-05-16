import { Button, Chip, Paper, Tab, Tabs } from "@mui/material";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/authContext";
import { leaveGroupLabels, leaveRoutes, type LeaveRouteConfig } from "./leaveRoutes";

type LeavePlaceholderPageProps = {
  route: LeaveRouteConfig;
};

export default function LeavePlaceholderPage({ route }: LeavePlaceholderPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useAuth();
  const userRoles = session?.user.roles ?? [];
  const visibleRoutes = leaveRoutes.filter((item) =>
    item.roles.some((role) => userRoles.includes(role)),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="text-gray-500 text-sm flex items-center gap-1">
          Leave
          <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-primary font-medium">
            {leaveGroupLabels[route.group]}
          </span>
          <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-gray-800 font-medium">{route.label}</span>
        </div>
        <Chip
          size="small"
          label={`${leaveGroupLabels[route.group]} workspace`}
          className="!bg-primary-50 !text-primary"
        />
      </div>

      <Paper elevation={0} className="border border-gray-300 !bg-white">
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
          {visibleRoutes.map((item) => (
            <Tab
              key={item.path}
              value={item.path}
              label={item.label}
              onClick={() => navigate(item.path)}
              className="!text-gray-900"
            />
          ))}
        </Tabs>

        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="text-primary font-semibold mb-1">{route.label}</div>
              <div className="text-sm text-gray-500">{route.description}</div>
            </div>
            <Button
              variant="outlined"
              startIcon={<EventNoteOutlinedIcon />}
              className="!text-gray-800 !border-gray-300"
              disabled
            >
              Coming Soon
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="text-gray-500 text-sm mb-2">Route</div>
              <code className="text-gray-800 bg-white border border-gray-200 px-2 py-1 rounded">
                {route.path}
              </code>
            </div>
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="text-gray-500 text-sm mb-2">Allowed Roles</div>
              <div className="flex flex-wrap gap-2">
                {route.roles.map((role) => (
                  <Chip key={role} size="small" label={role} />
                ))}
              </div>
            </div>
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="text-gray-500 text-sm mb-2">Status</div>
              <div className="font-medium text-gray-800">Frontend shell only</div>
              <div className="text-xs text-gray-500 mt-1">No backend API calls yet.</div>
            </div>
          </div>
        </div>
      </Paper>
    </div>
  );
}
