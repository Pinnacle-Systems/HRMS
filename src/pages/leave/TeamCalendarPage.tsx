import { useEffect, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import DataState from "../../components/DataState";
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type { TeamCalendarEntry } from "../../services/modules/leaveTypes";
import LeavePageShell from "./components/LeavePageShell";
import LeaveStatusBadge from "./components/LeaveStatusBadge";
import { formatDate } from "./leaveFormatters";
import {
  leaveTableBodyCellSx,
  leaveTableClassName,
  leaveTableContainerSx,
  leaveTableHeaderCellClassName,
  leaveTableHeaderRowSx,
  leaveTableRowSx,
  leaveTableSx,
} from "./components/leaveTableStyles";

export default function TeamCalendarPage() {
  const { showSnackbar } = useUI();
  const [entries, setEntries] = useState<TeamCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const response:any = await leaveService.getTeamCalendar({ page: 0, size: 100 });
        if (isMounted) {
          setEntries(response.data ?? []);
        }
      } catch (err: any) {
        if (isMounted) {
          setUnavailable(true);
          showSnackbar(err?.message || "Team calendar is not available yet", "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <LeavePageShell
      group="manager"
      title="Team Calendar"
      subtitle="See who is on leave across your team"
    >
      <TableContainer component={Paper} elevation={0} className="overflow-auto" sx={leaveTableContainerSx}>
        <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
          <TableHead>
            <TableRow sx={leaveTableHeaderRowSx}>
              <TableCell className={leaveTableHeaderCellClassName}>Employee</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Department</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Leave Type</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>From</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>To</TableCell>
              <TableCell className={leaveTableHeaderCellClassName}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading &&
              !unavailable &&
              entries.map((entry) => (
                <TableRow key={entry.id} hover sx={leaveTableRowSx}>
                  <TableCell sx={leaveTableBodyCellSx}>{entry.employeeName}</TableCell>
                  <TableCell sx={leaveTableBodyCellSx}>{entry.department}</TableCell>
                  <TableCell sx={leaveTableBodyCellSx}>{entry.leaveTypeCode}</TableCell>
                  <TableCell sx={leaveTableBodyCellSx}>{formatDate(entry.fromDate)}</TableCell>
                  <TableCell sx={leaveTableBodyCellSx}>{formatDate(entry.toDate)}</TableCell>
                  <TableCell sx={leaveTableBodyCellSx}>
                    <LeaveStatusBadge status={entry.status} />
                  </TableCell>
                </TableRow>
              ))}
            {loading && (
              <TableRow>
                <TableCell colSpan={6}>
                  <DataState compact type="loading" title="Loading team calendar..." />
                </TableCell>
              </TableRow>
            )}
            {!loading && unavailable && (
              <TableRow>
                <TableCell colSpan={6}>
                  <DataState
                    compact
                    type="empty"
                    title="Team calendar is not available in live mode yet."
                  />
                </TableCell>
              </TableRow>
            )}
            {!loading && !unavailable && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={6}>
                  <DataState compact type="empty" title="No team leave found." />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </LeavePageShell>
  );
}
