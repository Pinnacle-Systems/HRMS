import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import { useAuth } from "../../auth/authContext";
import DataState from "../../components/DataState";
import { FileUpload } from "../../components/FileUpload";
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type {
  CompOffCredit,
  CompOffCreditRequest,
  LeaveDayType,
  LeaveType,
} from "../../services/modules/leaveTypes";
import CompOffStatusBadge from "./components/CompOffStatusBadge";
import LeavePageShell from "./components/LeavePageShell";
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
import { calculateCompOffExpiryDate, formatDateForApi } from "./leaveRules";

const sessionOptions: Array<{ value: LeaveDayType; label: string }> = [
  { value: "FULL_DAY", label: "Full Day" },
  { value: "FIRST_HALF", label: "First Half" },
  { value: "SECOND_HALF", label: "Second Half" },
];


export default function CompOffsPage() {
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
        expiryDate: formatDateForApi(
          calculateCompOffExpiryDate(workedDate!.toDate()),
        ),
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
    <LeavePageShell
      title="Comp-Offs"
      subtitle="Track available credits and request new comp-off credit"
      actions={
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          className="!bg-primary"
          onClick={() => setOpen(true)}
        >
          Request Comp-Off Credit
        </Button>
      }
    >

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
            sx={leaveTableContainerSx}
          >
            <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
              <TableHead>
                <TableRow sx={leaveTableHeaderRowSx}>
                  <TableCell className={leaveTableHeaderCellClassName}>Worked Date</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Session</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Credits</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Expiry Date</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Status</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {credits.map((credit) => (
                  <TableRow key={credit.id} hover sx={leaveTableRowSx}>
                    <TableCell sx={leaveTableBodyCellSx}>{formatDate(credit.workedDate)}</TableCell>
                    <TableCell sx={leaveTableBodyCellSx}>{credit.workedSession}</TableCell>
                    <TableCell sx={leaveTableBodyCellSx}>{credit.creditedDays}</TableCell>
                    <TableCell sx={leaveTableBodyCellSx}>{formatDate(credit.expiryDate)}</TableCell>
                    <TableCell sx={leaveTableBodyCellSx}>
                      <CompOffStatusBadge status={credit.status} />
                    </TableCell>
                    <TableCell sx={leaveTableBodyCellSx}>{credit.reason}</TableCell>
                  </TableRow>
                ))}
                {credits.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <DataState
                        compact
                        type="empty"
                        title="No comp-off credits found."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <div className="font-semibold text-primary">Credit Request History</div>
          <TableContainer
            component={Paper}
            elevation={0}
            className="overflow-auto"
            sx={leaveTableContainerSx}
          >
            <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
              <TableHead>
                <TableRow sx={leaveTableHeaderRowSx}>
                  <TableCell className={leaveTableHeaderCellClassName}>Request No</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Worked Date</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Session</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Days</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Submitted On</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Approver</TableCell>
                  <TableCell className={leaveTableHeaderCellClassName}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((request) => (
                  <TableRow key={request.id} hover sx={leaveTableRowSx}>
                    <TableCell sx={leaveTableBodyCellSx}>{request.id}</TableCell>
                    <TableCell sx={leaveTableBodyCellSx}>{formatDate(request.workedDate)}</TableCell>
                    <TableCell sx={leaveTableBodyCellSx}>{request.workedSession}</TableCell>
                    <TableCell sx={leaveTableBodyCellSx}>{request.requestedDays}</TableCell>
                    <TableCell sx={leaveTableBodyCellSx}>{formatDate(request.submittedOn)}</TableCell>
                    <TableCell sx={leaveTableBodyCellSx}>{request.approver}</TableCell>
                    <TableCell sx={leaveTableBodyCellSx}>
                      <CompOffStatusBadge status={request.status} />
                    </TableCell>
                  </TableRow>
                ))}
                {history.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <DataState
                        compact
                        type="empty"
                        title="No comp-off request history."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">Request Comp-Off Credit</div>
          <IconButton onClick={() => setOpen(false)}>
            <CloseOutlinedIcon className="!text-gray-800"/>
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
    </LeavePageShell>
  );
}
