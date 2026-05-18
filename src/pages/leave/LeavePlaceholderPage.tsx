import { Button, Chip } from "@mui/material";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import { type LeaveRouteConfig } from "./leaveRoutes";
import LeavePageShell from "./components/LeavePageShell";

type LeavePlaceholderPageProps = {
  route: LeaveRouteConfig;
};

export default function LeavePlaceholderPage({ route }: LeavePlaceholderPageProps) {
  return (
    <LeavePageShell
      group={route.group}
      title={route.label}
      subtitle={route.description}
      actions={
        <Button
          variant="outlined"
          startIcon={<EventNoteOutlinedIcon />}
          className="!text-gray-800 !border-gray-300"
          disabled
        >
          Coming Soon
        </Button>
      }
      contentClassName="p-5 space-y-5"
    >

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
                {route.allowedRoles.map((role) => (
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
    </LeavePageShell>
  );
}
