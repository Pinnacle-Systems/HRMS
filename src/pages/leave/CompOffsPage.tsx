import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import { useAuth } from "../../auth/authContext";
import { FileUpload } from "../../components/FileUpload";
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type {
  CompOffCredit,
  CompOffCreditRequest,
  LeaveDayType,
  LeaveType,
} from "../../services/modules/leaveTypes";
import { leaveGroupLabels, leaveRoutes } from "./leaveRoutes";

const sessionOptions: Array<{ value: LeaveDayType; label: string }> = [
  { value: "FULL_DAY", label: "Full Day" },
  { value: "FIRST_HALF", label: "First Half" },
  { value: "SECOND_HALF", label: "Second Half" },
];

const creditStatusClasses: Record<CompOffCredit["status"], string> = {
  AVAILABLE: "!bg-green-50 !text-green-700",
  PENDING: "!bg-primary-50 !text-primary",
  AVAILED: "!bg-blue-50 !text-blue-700",
  EXPIRED: "!bg-gray-100 !text-gray-700",
  REJECTED: "!bg-red-50 !text-red-700",
};

const requestStatusClasses: Record<CompOffCreditRequest["status"], string> = {
  PENDING: "!bg-primary-50 !text-primary",
  APPROVED: "!bg-green-50 !text-green-700",
  REJECTED: "!bg-red-50 !text-red-700",
};

const tableTextCellSx = {
  color: "var(--text-primary)",
  fontSize: "0.875rem",
};

const tableContainerSx = {
  backgroundColor: "var(--bg-primary)",
  borderColor: "var(--border-color)",
};

const tableSx = {
  backgroundColor: "var(--bg-primary)",
  borderColor: "var(--border-color)",
};

const tableHeaderRowSx = {
  backgroundColor: "var(--bg-secondary)",
  "& .MuiTableCell-root": {
    borderColor: "var(--border-color)",
    color: "var(--text-primary)",
  },
};

const tableRowSx = {
  backgroundColor: "var(--bg-primary)",
  "& .MuiTableCell-root": {
    borderColor: "var(--border-color)",
  },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function CompOffsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [credits, setCredits] = useState<CompOffCredit[]>([]);
  const [history, setHistory] = useState<CompOffCreditRequest[]>([]);
  const [open, setOpen] = useState(false);
  const [workedDate, setWorkedDate] = useState<Dayjs | null>(null);
  const [workedSession, setWorkedSession] = useState<LeaveDayType>("FULL_DAY");
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | string>("");
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const currentEmployeeId = session?.user.userId ?? "";

  const visibleRoutes = useMemo(() => {
    const roles = session?.user.roles ?? [];
    return leaveRoutes.filter((route) =>
      route.roles.some((role) => roles.includes(role)),
    );
  }, [session?.user.roles]);

  const loadCompOffs = async () => {
    showSpinner();
    try {
      if (!currentEmployeeId) {
        throw new Error("Current employee id is unavailable");
      }

      const [creditResponse, historyResponse] = await Promise.all([
        leaveService.getCompOffCredits({ employeeId: currentEmployeeId, page: 0, size: 20 }),
        leaveService.getCompOffCreditRequests({
          employeeId: currentEmployeeId,
          page: 0,
          size: 20,
          sort: "createdAt,DESC",
        }),
      ]);
      setCredits(creditResponse.data?.content ?? []);
      setHistory(historyResponse.data?.content ?? []);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load comp-offs", "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    loadCompOffs();
  }, [currentEmployeeId]);

  useEffect(() => {
    let isMounted = true;
    const loadLeaveTypes = async () => {
      try {
        const response = await leaveService.getLeaveTypes({
          page: 0,
          size: 50,
          sort: "name,ASC",
        });
        if (isMounted) {
          setLeaveTypes(response.data?.content ?? []);
        }
      } catch {
        if (isMounted) {
          setLeaveTypes([]);
        }
      }
    };

    loadLeaveTypes();
    return () => {
      isMounted = false;
    };
  }, []);

  const compOffLeaveType = useMemo(
    () =>
      leaveTypes.find((leaveType) =>
        ["CO", "COMP_OFF", "COMP-OFF"].includes(leaveType.code.toUpperCase()) ||
        leaveType.name.toLowerCase().includes("comp"),
      ),
    [leaveTypes],
  );

  const availableCredits = credits.filter((credit) => credit.status === "AVAILABLE");
  const availableDays = availableCredits.reduce(
    (total, credit) => total + credit.creditedDays,
    0,
  );
  const pendingDays = history
    .filter((request) => request.status === "PENDING")
    .reduce((total, request) => total + request.requestedDays, 0);

  const resetForm = () => {
    setWorkedDate(null);
    setWorkedSession("FULL_DAY");
    setReason("");
    setAttachment("");
    setErrors({});
  };

  const submitRequest = async () => {
    const nextErrors: Record<string, string> = {};
    if (!workedDate) nextErrors.workedDate = "Worked date is required";
    if (!reason.trim()) nextErrors.reason = "Reason is required";
    if (!compOffLeaveType?.id) nextErrors.leaveTypeId = "Comp-off leave type is unavailable";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    showSpinner();
    try {
      if (!currentEmployeeId) {
        throw new Error("Current employee id is unavailable");
      }

      const response = await leaveService.requestCompOffCredit({
        employeeId: currentEmployeeId,
        workedDate: workedDate!.format("YYYY-MM-DD"),
        workedSession,
        creditDays: workedSession === "FULL_DAY" ? 1 : 0.5,
        expiryDate: workedDate!.add(90, "day").format("YYYY-MM-DD"),
        reason,
        leaveTypeId: compOffLeaveType?.id,
        attachment,
      });
      if (response.success) {
        showSnackbar("Comp-off credit request submitted for approval", "success");
        setHistory((current) => [response.data!, ...current]);
        setOpen(false);
        resetForm();
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to request comp-off credit", "error");
    } finally {
      hideSpinner();
    }
  };

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="text-gray-500 text-sm flex flex-wrap items-center gap-1">
        Leave
        <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
        <span className="text-primary font-medium">{leaveGroupLabels.employee}</span>
        <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
        <span className="text-gray-800 font-medium">Comp-Offs</span>
      </div>

      <Paper elevation={0} className="border border-gray-300 !bg-white overflow-hidden">
        <Tabs
          value={location.pathname}
          variant="scrollable"
          scrollButtons="auto"
          className="!border-b !border-gray-300"
          sx={{ "& .MuiTabs-indicator": { backgroundColor: "var(--color-primary)", height: 3 } }}
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

        <div className="p-3 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xl font-semibold text-gray-800">Comp-Offs</div>
              <div className="text-sm text-gray-500 mt-1">
                Track available credits and request new comp-off credit
              </div>
            </div>
            <Button
              variant="contained"
              startIcon={<AddOutlinedIcon />}
              className="!bg-primary"
              onClick={() => setOpen(true)}
            >
              Request Comp-Off Credit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
              <div className="text-sm text-gray-500">Available Credits</div>
              <div className="text-2xl font-semibold text-gray-800">{availableDays}</div>
            </div>
            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
              <div className="text-sm text-gray-500">Pending Approval</div>
              <div className="text-2xl font-semibold text-gray-800">{pendingDays}</div>
            </div>
            <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
              <div className="text-sm text-gray-500">Credits Available</div>
              <div className="text-2xl font-semibold text-gray-800">
                {availableCredits.length}
              </div>
            </div>
          </div>

          <div className="font-semibold text-primary">Available Credits</div>
          <TableContainer
            component={Paper}
            elevation={0}
            className="overflow-auto"
            sx={tableContainerSx}
          >
            <Table className="border" size="small" sx={tableSx}>
              <TableHead>
                <TableRow sx={tableHeaderRowSx}>
                  <TableCell className="!font-semibold">Worked Date</TableCell>
                  <TableCell className="!font-semibold">Session</TableCell>
                  <TableCell className="!font-semibold">Credits</TableCell>
                  <TableCell className="!font-semibold">Expiry Date</TableCell>
                  <TableCell className="!font-semibold">Status</TableCell>
                  <TableCell className="!font-semibold">Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {credits.map((credit) => (
                  <TableRow key={credit.id} hover sx={tableRowSx}>
                    <TableCell sx={tableTextCellSx}>{formatDate(credit.workedDate)}</TableCell>
                    <TableCell sx={tableTextCellSx}>{credit.workedSession}</TableCell>
                    <TableCell sx={tableTextCellSx}>{credit.creditedDays}</TableCell>
                    <TableCell sx={tableTextCellSx}>{formatDate(credit.expiryDate)}</TableCell>
                    <TableCell sx={tableTextCellSx}>
                      <Chip
                        size="small"
                        label={credit.status}
                        className={creditStatusClasses[credit.status]}
                      />
                    </TableCell>
                    <TableCell sx={tableTextCellSx}>{credit.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {credits.length === 0 && (
              <Typography color="text.secondary" className="text-center py-8">
                No comp-off credits found.
              </Typography>
            )}
          </TableContainer>

          <div className="font-semibold text-primary">Credit Request History</div>
          <TableContainer
            component={Paper}
            elevation={0}
            className="overflow-auto"
            sx={tableContainerSx}
          >
            <Table className="border" size="small" sx={tableSx}>
              <TableHead>
                <TableRow sx={tableHeaderRowSx}>
                  <TableCell className="!font-semibold">Request No</TableCell>
                  <TableCell className="!font-semibold">Worked Date</TableCell>
                  <TableCell className="!font-semibold">Session</TableCell>
                  <TableCell className="!font-semibold">Days</TableCell>
                  <TableCell className="!font-semibold">Submitted On</TableCell>
                  <TableCell className="!font-semibold">Approver</TableCell>
                  <TableCell className="!font-semibold">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((request) => (
                  <TableRow key={request.id} hover sx={tableRowSx}>
                    <TableCell sx={tableTextCellSx}>{request.id}</TableCell>
                    <TableCell sx={tableTextCellSx}>{formatDate(request.workedDate)}</TableCell>
                    <TableCell sx={tableTextCellSx}>{request.workedSession}</TableCell>
                    <TableCell sx={tableTextCellSx}>{request.requestedDays}</TableCell>
                    <TableCell sx={tableTextCellSx}>{formatDate(request.submittedOn)}</TableCell>
                    <TableCell sx={tableTextCellSx}>{request.approver}</TableCell>
                    <TableCell sx={tableTextCellSx}>
                      <Chip
                        size="small"
                        label={request.status}
                        className={requestStatusClasses[request.status]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {history.length === 0 && (
              <Typography color="text.secondary" className="text-center py-8">
                No comp-off request history.
              </Typography>
            )}
          </TableContainer>
        </div>
      </Paper>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">Request Comp-Off Credit</div>
          <IconButton onClick={() => setOpen(false)}>
            <CloseOutlinedIcon />
          </IconButton>
        </div>
        <DialogContent className="!p-4">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid gap-4">
              <DatePicker
                label="Worked Date"
                value={workedDate}
                onChange={(value) => {
                  setWorkedDate(value);
                  setErrors((current) => ({ ...current, workedDate: "" }));
                }}
                slots={{
                  openPickerIcon: CalendarMonthOutlinedIcon,
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: Boolean(errors.workedDate),
                    helperText: errors.workedDate,
                  },
                  openPickerButton: {
                    color: "primary",
                    edge: "end",
                  },
                }}
              />
              <TextField
                select
                label="Worked Session"
                value={workedSession}
                onChange={(event) =>
                  setWorkedSession(event.target.value as LeaveDayType)
                }
              >
                {sessionOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Reason"
                multiline
                rows={3}
                value={reason}
                error={Boolean(errors.reason)}
                helperText={errors.reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  setErrors((current) => ({ ...current, reason: "" }));
                }}
              />
              <FileUpload
                label="Attachment"
                value={attachment}
                onChange={setAttachment}
                accept="image/*,application/pdf"
                maxSize={5}
                compact
                description="Optional proof for weekend or holiday work."
              />
            </div>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-300">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button variant="contained" className="!bg-primary" onClick={submitRequest}>
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
