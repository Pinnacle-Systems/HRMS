import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Select,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FilterListOutlinedIcon from "@mui/icons-material/FilterListOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import { useAuth } from "../../../auth/authContext";
import DataState from "../../../components/DataState";
import { useUI } from "../../../context/Snackbar";
import { leaveService } from "../../../services/modules/leave";
import type {
  CompOffCredit,
  LeaveDayType,
  LeaveType,
} from "../../../services/modules/leaveTypes";
import CompOffStatusBadge from "../components/CompOffStatusBadge";
import LeavePageShell from "../components/LeavePageShell";
import { formatDate } from "../leaveFormatters";
import { leaveTableHeaderCellClassName } from "../components/leaveTableStyles";
import { calculateCompOffExpiryDate, formatDateForApi } from "../leaveRules";
import dayjs from "dayjs";
import { getRowColor } from "../../const";
import { selectSx } from "../../../const";

const sessionOptions: Array<{ value: LeaveDayType; label: string }> = [
  { value: "FULL_DAY", label: "Full Day" },
  { value: "FIRST_HALF", label: "First Half" },
  { value: "SECOND_HALF", label: "Second Half" },
];

const statusFilterOptions = [
  { value: "ALL", label: "All Status" },
  { value: "AVAILABLE", label: "Available" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "EXPIRED", label: "Expired" },
  // { value: "USED", label: "Used" },
];

export default function CompOffsPage() {
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [allCredits, setAllCredits] = useState<CompOffCredit[]>([]);
  const [filteredCredits, setFilteredCredits] = useState<CompOffCredit[]>([]);
  const [open, setOpen] = useState(false);
  const [workedDate, setWorkedDate] = useState<Dayjs | null>(null);
  const [sessionType, setSessionType] = useState<LeaveDayType>("FULL_DAY");
  const [reason, setReason] = useState("");
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const currentEmployeeId = session?.user.userId ?? "";

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sessionFilter, setSessionFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const loadCompOffs = async () => {
    showSpinner();
    try {
      if (!currentEmployeeId) {
        throw new Error("Current employee id is unavailable");
      }

      const response: any = await leaveService.getCompOffCredits({
        employeeId: currentEmployeeId,
        page: 0,
        size: 100,
        sort: "createdAt,DESC",
      });

      const data = response.data?.content ?? response.data ?? [];
      setAllCredits(data);
      setFilteredCredits(data);
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to load comp-offs", "error");
    } finally {
      hideSpinner();
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...allCredits];

    if (statusFilter !== "ALL") {
      filtered = filtered.filter(
        (credit) => credit.currentStatus === statusFilter,
      );
    }

    if (sessionFilter !== "ALL") {
      filtered = filtered.filter(
        (credit) => credit.sessionType === sessionFilter,
      );
    }
    if (fromDate) {
      filtered = filtered.filter((credit) => {
        const diff = dayjs(credit.workedDate).diff(dayjs(fromDate), "day");
        return diff >= 0;
      });
    }

    if (toDate) {
      filtered = filtered.filter((credit) => {
        const diff = dayjs(toDate).diff(dayjs(credit.workedDate), "day");
        return diff >= 0;
      });
    }

    setFilteredCredits(filtered);
  }, [allCredits, statusFilter, sessionFilter, fromDate, toDate]);

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setSessionFilter("ALL");
    setFromDate("");
    setToDate("");
  };

  useEffect(() => {
    loadCompOffs();
  }, [currentEmployeeId]);

  useEffect(() => {
    let isMounted = true;
    const loadLeaveTypes = async () => {
      try {
        const response: any = await leaveService.getLeaveTypes({
          page: 0,
          size: 50,
          sort: "name,ASC",
        });
        if (isMounted) {
          setLeaveTypes(response.data ?? response.data?.content ?? []);
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
      leaveTypes.find(
        (leaveType) =>
          ["CO", "COMP_OFF", "COMP-OFF"].includes(
            leaveType.code.toUpperCase(),
          ) || leaveType.name.toLowerCase().includes("comp"),
      ),
    [leaveTypes],
  );

  // Statistics
  const statistics = useMemo(() => {
    const available = allCredits.filter((c) => c.currentStatus === "AVAILABLE");
    const pending = allCredits.filter((c) => c.currentStatus === "PENDING");
    const approved = allCredits.filter((c) => c.currentStatus === "APPROVED");
    const rejected = allCredits.filter((c) => c.currentStatus === "REJECTED");
    const expired = allCredits.filter((c) => c.currentStatus === "EXPIRED");
    // const used = allCredits.filter(c => c.currentStatus === "USED");

    return {
      total: allCredits.length,
      available: available.reduce((sum, c) => sum + c.creditDays, 0),
      availableCount: available.length,
      pending: pending.reduce((sum, c) => sum + c.creditDays, 0),
      pendingCount: pending.length,
      approved: approved.reduce((sum, c) => sum + c.creditDays, 0),
      rejectedCount: rejected.length,
      expiredCount: expired.length,
      // usedCount: used.length,
    };
  }, [allCredits]);

  const resetForm = () => {
    setWorkedDate(null);
    setSessionType("FULL_DAY");
    setReason("");
    setErrors({});
  };

  const submitRequest = async () => {
    const nextErrors: Record<string, string> = {};
    if (!workedDate) nextErrors.workedDate = "Worked date is required";
    if (!reason.trim()) nextErrors.reason = "Reason is required";
    if (!compOffLeaveType?.id)
      nextErrors.leaveTypeId = "Comp-off leave type is unavailable";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    showSpinner();
    try {
      if (!currentEmployeeId) {
        throw new Error("Current employee id is unavailable");
      }

      const response: any = await leaveService.requestCompOffCredit({
        workedDate: workedDate!.format("YYYY-MM-DD"),
        sessionType: sessionType,
        creditDays: sessionType === "FULL_DAY" ? 1 : 0.5,
        expiryDate: formatDateForApi(
          calculateCompOffExpiryDate(workedDate!.toDate()),
        ),
        reason,
        leaveTypeId: compOffLeaveType?.id,
      });

      if (response.success) {
        showSnackbar(
          "Comp-off credit request submitted for approval",
          "success",
        );
        await loadCompOffs(); // Reload the list
        setOpen(false);
        resetForm();
      }
    } catch (err: any) {
      showSnackbar(
        err?.message || "Failed to request comp-off credit",
        "error",
      );
    } finally {
      hideSpinner();
    }
  };

  // Get status color for chips
  // const getStatusColor = (status: string) => {
  //   const colors: Record<string, any> = {
  //     AVAILABLE: "success",
  //     PENDING: "warning",
  //     APPROVED: "info",
  //     REJECTED: "error",
  //     EXPIRED: "default",
  //     USED: "secondary",
  //   };
  //   return colors[status] || "default";
  // };

  return (
    <LeavePageShell
      group="employee"
      title="Comp-Offs"
      subtitle="Track available credits and request new comp-off credit"
      actions={
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          className="!bg-primary"
          size="small"
          onClick={() => setOpen(true)}
        >
          Request Comp-Off Credit
        </Button>
      }
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 !mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl py-2 px-4 border border-emerald-200/50">
          <div className="text-[12px] text-emerald-700">Total Credits</div>
          <div className="text-xl font-bold text-emerald-800">
            {statistics.total}
          </div>
          <div className="text-[12px] text-emerald-600/70">All time</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl py-2 px-4 border border-blue-200/50">
          <div className="text-[12px] text-blue-700">Available Credits</div>
          <div className="text-xl font-bold text-blue-800">
            {statistics.available}
          </div>
          <div className="text-[12px] text-blue-600/70">
            {statistics.availableCount} credits
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl py-2 px-4 border border-amber-200/50">
          <div className="text-[12px] text-amber-700">Pending Approval</div>
          <div className="text-xl font-bold text-amber-800">
            {statistics.pending}
          </div>
          <div className="text-[12px] text-amber-600/70">
            {statistics.pendingCount} requests
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl py-2 px-4 border border-purple-200/50">
          <div className="text-[12px] text-purple-700">Approved</div>
          <div className="text-xl font-bold text-purple-800">
            {statistics.approved}
          </div>
          <div className="text-[12px] text-purple-600/70">Credits approved</div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl py-2 px-4 border border-red-200/50">
          <div className="text-[12px] text-red-700">Rejected</div>
          <div className="text-xl font-bold text-red-800">
            {statistics.rejectedCount}
          </div>
          <div className="text-[12px] text-red-600/70">Requests rejected</div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl py-2 px-4 border border-gray-200/50">
          <div className="text-[12px] text-gray-700">Expired</div>
          <div className="text-xl font-bold text-gray-800">
            {statistics.expiredCount}
          </div>
          <div className="text-[12px] text-gray-600/70">Credits expired</div>
        </div>
      </div>

      {/* Filters */}
      {/* <div className="bg-white border border-gray-200 rounded-lg overflow-hidden !mb-4">
        <div className="px-3 py-1 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterListOutlinedIcon className="text-gray-500" />
            <span className="font-medium text-gray-700">Filters</span>
            {(statusFilter !== "ALL" || sessionFilter !== "ALL" || searchTerm) && (
              <Chip
                label="Active Filters"
                size="small"
                color="primary"
                onDelete={handleResetFilters}
              />
            )}
          </div>
          <div className="flex items-center gap-1">
            <Tooltip title="Reset Filters">
              <Button
                size="small"
                variant="outlined"
                className="!text-gray-600 !border-gray-300"
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            </Tooltip>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-4 gap-3">
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={selectSx}
              >
                {statusFilterOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>Session</InputLabel>
              <Select
                value={sessionFilter}
                label="Session"
                onChange={(e) => setSessionFilter(e.target.value)}
                sx={selectSx}
              >
                <MenuItem value="ALL">All Sessions</MenuItem>
                {sessionOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <div className="col-span-2">
              <TextField
                size="small"
                fullWidth
                label="Search"
                placeholder="Search by reason, request number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div> */}
      <div className="bg-white border border-gray-200 rounded-lg !mb-4 px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <FilterListOutlinedIcon className="text-gray-400 !w-4 !h-4" />

        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          displayEmpty
          sx={{ minWidth: 120, ...selectSx }}
        >
          <MenuItem value="ALL">Status: All</MenuItem>
          {statusFilterOptions
            .filter((opt) => opt.value !== "ALL")
            .map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
        </Select>

        <Select
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
          displayEmpty
          sx={{ minWidth: 120, ...selectSx }}
        >
          <MenuItem value="ALL">Session: All</MenuItem>
          {sessionOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={fromDate ? dayjs(fromDate) : null}
            onChange={(newValue) =>
              setFromDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")
            }
            slotProps={{ textField: { size: "small", sx: { width: 150 } } }}
          />
          <DatePicker
            value={toDate ? dayjs(toDate) : null}
            minDate={dayjs(fromDate) ?? undefined}
            onChange={(newValue) =>
              setToDate(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")
            }
            slotProps={{ textField: { size: "small", sx: { width: 150 } } }}
          />
        </LocalizationProvider>

        {(statusFilter !== "ALL" ||
          sessionFilter !== "ALL" ||
          fromDate ||
          toDate) && (
          <Button
            size="small"
            onClick={handleResetFilters}
            className="!text-gray-500 !min-w-0"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Unified Table */}
      <div>
        <div className="flex items-center justify-between !mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <span className="text-[12px] font-semibold text-gray-800">
              All Comp-Off Requests
            </span>
          </div>
          <span className="text-[12px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {filteredCredits.length}{" "}
            {filteredCredits.length === 1 ? "request" : "requests"}
            {filteredCredits.length !== allCredits.length &&
              ` (${allCredits.length} total)`}
          </span>
        </div>

        <TableContainer className="overflow-auto rounded-sm border border-gray-200 bg-white-50">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className={leaveTableHeaderCellClassName}>
                  S No
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Request No
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Worked Date
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Session
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Credits
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Expiry Date
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Status
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Reason
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Submitted On
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCredits.map((credit, i) => (
                <TableRow key={credit.id} sx={getRowColor(i)}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <span className="font-mono text-[12px]">
                      #{credit.requestNumber || credit.id?.slice(0, 8)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(credit.workedDate)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] ${
                        credit.sessionType === "FULL_DAY"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {credit.sessionType === "FULL_DAY"
                        ? "Full Day"
                        : credit.sessionType === "FIRST_HALF"
                          ? "First Half"
                          : "Second Half"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">
                      {credit.creditDays}
                    </span>
                  </TableCell>
                  <TableCell>
                    {credit.expiryDate ? formatDate(credit.expiryDate) : "—"}
                  </TableCell>
                  <TableCell>
                    <CompOffStatusBadge status={credit.currentStatus} />
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-1" title={credit.reason}>
                      {credit.reason || "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {credit.submittedAt ? formatDate(credit.submittedAt) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {filteredCredits.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8}>
                    <DataState
                      compact
                      type="empty"
                      title={
                        allCredits.length === 0
                          ? "No comp-off credits found."
                          : "No results match your filters."
                      }
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      {/* Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <div className="flex items-center justify-between !p-2 border-b border-gray-200 bg-gradient-to-r from-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[12px] ml-4 text-gray-800">
                Request Comp-Off Credit
              </div>
            </div>
          </div>
          <IconButton
            onClick={() => setOpen(false)}
            className="hover:bg-gray-100 rounded-full"
          >
            <CloseOutlinedIcon className="!text-gray-500" />
          </IconButton>
        </div>

        <DialogContent className="!p-4">
          <div className="text-[12px] text-gray-500 mb-4">
            Submit a new comp-off credit request
          </div>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="grid gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <DatePicker
                    label="Worked Date"
                    value={workedDate}
                    onChange={(value) => {
                      setWorkedDate(value ? dayjs(value) : null);
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
                </div>

                <div className="space-y-1">
                  <TextField
                    select
                    label="Worked Session"
                    value={sessionType}
                    onChange={(event) =>
                      setSessionType(event.target.value as LeaveDayType)
                    }
                    sx={selectSx}
                  >
                    {sessionOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </div>
              </div>

              <div className="space-y-1">
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
                  placeholder="Provide a brief reason for the comp-off request..."
                />
              </div>
            </div>
          </LocalizationProvider>
        </DialogContent>

        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={submitRequest}
          >
            Submit Request
          </Button>
        </DialogActions>
      </Dialog>
    </LeavePageShell>
  );
}
