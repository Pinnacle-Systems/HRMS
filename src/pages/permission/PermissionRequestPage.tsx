import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
} from "@mui/material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import dayjs from "dayjs";
import type { } from "@mui/x-date-pickers/AdapterDayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  DatePicker,
  LocalizationProvider,
  TimePicker,
} from "@mui/x-date-pickers";
import { useAuth } from "../../auth/authContext";
import { EmployeeAsyncCombobox } from "../../components/employees/EmployeeAsyncCombobox";
import { GlobalPagination } from "../../components/GlobalPagination";
import type { EmployeeSummaryResponse } from "../../services/modules/employees";
import { useUI } from "../../context/Snackbar";
import { getRowColor } from "../const";
import {
  permissionRequestService,
  type PermissionRequestDto,
  type PermissionType,
} from "../../services/modules/permissionRequests";
import { formatDateTime } from "../../utils/dateFormatter";

type PermissionRequest = {
  id: string;
  requestNumber?: string;
  employeeId: string;
  employeeCode?: string;
  employeeName?: string;
  department?: string;
  type: PermissionType;
  requestDate: string;
  fromTime: string;
  toTime: string;
  destination: string;
  reason: string;
  requestedAt: string;
  gatePassEnabled: boolean;
  gatePassQr?: string;
  qrToken?: string;
  qrGeneratedAt?: string;
  hours?: string;
  exceededMonthlyCap?: boolean;
  autoPosted?: boolean;
};

type PermissionForm = Omit<
  PermissionRequest,
  | "id"
  | "requestNumber"
  | "requestedAt"
  | "gatePassQr"
  | "qrToken"
  | "qrGeneratedAt"
  | "employeeCode"
  | "department"
  | "exceededMonthlyCap"
  | "autoPosted"
>;

/** Mirrors the API's TimeOfDay shape. */
type ApiTime = { hour: number; minute: number; second: number; nano: number };

const emptyForm = (
  requestDate: string,
  employeeId: string,
  employeeName: string,
): PermissionForm => ({
  employeeId,
  employeeName,
  type: "PERSONAL",
  requestDate,
  fromTime: "",
  toTime: "",
  destination: "",
  hours: "",
  reason: "",
  gatePassEnabled: false,
});

const getToday = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/** Converts a "HH:mm" string into the API's TimeOfDay object. */
const toApiTime = (value: string): ApiTime | undefined => {
  if (!value) return undefined;
  const [rawHour, rawMinute] = value.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return undefined;
  return { hour, minute, second: 0, nano: 0 };
};

/**
 * Normalises whatever the API returns for a time field. The spec shows
 * objects ({hour, minute, second, nano}), but some endpoints return
 * strings — handle both.
 */
const normaliseApiTime = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") {
    const [h, m] = value.split(":");
    if (h === undefined || m === undefined) return value;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  if (typeof value === "object") {
    const obj = value as Partial<ApiTime>;
    if (typeof obj.hour === "number" && typeof obj.minute === "number") {
      return `${String(obj.hour).padStart(2, "0")}:${String(obj.minute).padStart(2, "0")}`;
    }
  }
  return "";
};

const mapPermissionRequest = (request: PermissionRequestDto): PermissionRequest => {
  const qrImage = request.qrCodeImageBase64;
  return {
    id: request.id,
    requestNumber: request.requestNumber,
    employeeId: request.employeeId,
    employeeCode: request.employeeCode,
    employeeName: request.employeeName,
    department: request.department,
    type: request.permissionType === "personal_work" ? "PERSONAL" : "OFFICIAL",
    requestDate: request.date,
    fromTime: normaliseApiTime(request.departureTime),
    toTime: normaliseApiTime(request.expectedReturnTime),
    destination: request.destination,
    reason: request.reason,
    requestedAt: request.createdAt,
    gatePassEnabled: request.gatePassSlipGenerated,
    gatePassQr: qrImage
      ? qrImage.startsWith("data:image/")
        ? qrImage
        : `data:image/png;base64,${qrImage}`
      : undefined,
    qrToken: request.qrToken,
    qrGeneratedAt: request.qrGeneratedAt,
    hours: request.hours != null ? String(request.hours) : undefined,
    exceededMonthlyCap: (request as any).exceededMonthlyCap,
    autoPosted: (request as any).autoPosted,
  };
};

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/**
 * Formats a 24-hour "HH:mm" string for display using the user's locale.
 * Falls back to the raw value if it cannot be parsed.
 */
const formatTime = (value: string) => {
  if (!value) return "";
  const parsed = dayjs(`1970-01-01T${value}`);
  return parsed.isValid() ? parsed.format("hh:mm A") : value;
};

/**
 * Computes the duration between two "HH:mm" strings.
 * Returns an empty string if either value is missing/invalid or the
 * return time is not after the departure time.
 * Format: "X.XX" hours (2 decimals) — e.g. "1.50" for 1h 30m.
 */
const computeHrs = (from: string, to: string) => {
  if (!from || !to) return "";
  const start = dayjs(`1970-01-01T${from}`);
  const end = dayjs(`1970-01-01T${to}`);
  if (!start.isValid() || !end.isValid()) return "";
  const minutes = end.diff(start, "minute");
  if (minutes <= 0) return "";
  return (minutes / 60).toFixed(2);
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

/** Extracts a user-facing error message from an unknown thrown value. */
const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "object" && error !== null) {
    const anyErr = error as any;
    const apiMessage =
      anyErr?.response?.data?.message ||
      anyErr?.response?.data?.error ||
      anyErr?.data?.message;
    if (typeof apiMessage === "string" && apiMessage.trim()) return apiMessage;
    if (typeof anyErr?.message === "string" && anyErr.message.trim()) {
      return anyErr.message;
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export default function PermissionRequestPage() {
  const { session } = useAuth();
  const { showSnackbar } = useUI();
  const today = useMemo(() => getToday(), []);
  const user = session?.user;
  const employeeId = user?.employeeId || user?.userId || "";
  const employeeName = user?.email?.split("@")[0] || "Employee";
  const canApplyForOthers =
    user?.roles.some((role) => ["MANAGER", "HR", "ADMIN"].includes(role)) ??
    false;
  const managerOnly =
    user?.roles.includes("MANAGER") &&
    !user.roles.some((role) => role === "HR" || role === "ADMIN");
  const canViewAllRequests =
    user?.roles.some((role) => ["HR", "ADMIN"].includes(role)) ?? false;

  // ---- Inline tab state (same pattern as ApprovalWorkflowHome) ----
  const [tab, setTab] = useState(0);

  const [form, setForm] = useState<PermissionForm>(() =>
    emptyForm(
      today,
      canApplyForOthers ? "" : employeeId,
      canApplyForOthers ? "" : employeeName,
    ),
  );
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeSummaryResponse | null>(null);
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedRequest, setSelectedRequest] =
    useState<PermissionRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestError, setRequestError] = useState("");
  const [downloadingSlip, setDownloadingSlip] = useState(false);

  const loadRequests = useCallback(async (requestPage = page, requestSize = limit) => {
    setLoadingRequests(true);
    setRequestError("");
    try {
      const query = {
        page: requestPage,
        size: requestSize,
        sort: ["createdAt,desc"],
      };
      const response = canViewAllRequests
        ? await permissionRequestService.permissionReqList(query)
        : await permissionRequestService.permissionListMine(query);
      setRequests(response.content.map(mapPermissionRequest));
      setTotalRequests(response.totalElements);
    } catch (error) {
      setRequestError(
        `Could not load permission requests: ${extractErrorMessage(
          error,
          "Unknown error",
        )}`,
      );
      setRequests([]);
      setTotalRequests(0);
    } finally {
      setLoadingRequests(false);
    }
  }, [canViewAllRequests, limit, page]);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const updateForm = <K extends keyof PermissionForm>(
    field: K,
    value: PermissionForm[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const paginatedRequests = requests;

  const openRequestSlip = async (request: PermissionRequest) => {
    try {
      let details = await permissionRequestService.getPerRequestById(request.id);
      if (details.gatePassSlipGenerated && !details.qrCodeImageBase64) {
        details = await permissionRequestService.getQr(request.id);
      }
      setSelectedRequest(mapPermissionRequest(details));
    } catch (error) {
      showSnackbar(
        `Could not load permission request: ${extractErrorMessage(
          error,
          "Unknown error",
        )}`,
        "error",
      );
    }
  };

  const downloadSlip = async (request: PermissionRequest) => {
    setDownloadingSlip(true);
    try {
      const reference = request.requestNumber || request.id;
      await permissionRequestService.downloadSlip(
        request.id,
        `GatePass_${reference}.pdf`,
      );
      showSnackbar("Gate-pass slip downloaded.", "success");
    } catch (error) {
      showSnackbar(
        `Could not download the gate-pass slip: ${extractErrorMessage(
          error,
          "Unknown error",
        )}`,
        "error",
      );
    } finally {
      setDownloadingSlip(false);
    }
  };

  /** Client-side overlap check against already-loaded requests. */
  const findOverlap = (candidate: PermissionForm): PermissionRequest | undefined => {
    if (!candidate.employeeId || !candidate.requestDate) return undefined;
    if (!candidate.fromTime || !candidate.toTime) return undefined;
    return requests.find(
      (r) =>
        r.employeeId === candidate.employeeId &&
        r.requestDate === candidate.requestDate &&
        r.fromTime &&
        r.toTime &&
        r.fromTime < candidate.toTime &&
        r.toTime > candidate.fromTime,
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.employeeId || !form.employeeName) {
      showSnackbar(
        "Select the employee this permission request is for.",
        "error",
      );
      return;
    }
    if (!form.requestDate) {
      showSnackbar("Select the date of the permission request.", "error");
      return;
    }

    // Times are optional. If both are provided, the return must be after departure.
    if (form.fromTime && form.toTime && form.toTime <= form.fromTime) {
      showSnackbar("Return time must be later than departure time.", "error");
      return;
    }

    // Client-side early warning; the server enforces this authoritatively.
    const overlap = findOverlap(form);
    if (overlap) {
      showSnackbar(
        `This time window overlaps an existing request (${overlap.requestNumber || overlap.id}) for that employee on that date.`,
        "error",
      );
      return;
    }

    const hoursNumber = form.hours ? Number(form.hours) : undefined;
    if (hoursNumber !== undefined && (!Number.isFinite(hoursNumber) || hoursNumber <= 0)) {
      showSnackbar("Hrs must be a positive number.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const created = await permissionRequestService.createPermission({
        employeeId: form.employeeId,
        permissionType:
          form.type === "PERSONAL" ? "personal_work" : "official_work",
        date: form.requestDate,
        departureTime: form.fromTime ? toApiTime(form.fromTime) : undefined,
        expectedReturnTime: form.toTime ? toApiTime(form.toTime) : undefined,
        destination: form.destination.trim(),
        reason: form.reason.trim(),
        generateGatePassSlip: form.gatePassEnabled,
        hours: hoursNumber,
      });
      const request = mapPermissionRequest(created);
      setForm(
        emptyForm(
          today,
          canApplyForOthers ? "" : employeeId,
          canApplyForOthers ? "" : employeeName,
        ),
      );
      setSelectedEmployee(null);
      // Reset to first page; the loadRequests effect fires on page/limit change.
      // Only call explicitly if we're already on page 0 (no state change).
      if (page === 0) {
        await loadRequests(0, limit);
      } else {
        setPage(0);
      }

      if (request.exceededMonthlyCap) {
        showSnackbar(
          "Request submitted, but it exceeds the monthly permission allowance. HR will review it.",
          "warning",
        );
      } else if (request.gatePassEnabled) {
        showSnackbar(
          "Permission request submitted and gate-pass slip generated.",
          "success",
        );
      } else {
        showSnackbar("Permission request submitted.", "success");
      }

      if (request.gatePassEnabled) {
        setSelectedRequest(request);
      }
      setTab(1);
    } catch (error) {
      // The API returns 400 with a specific message for overlap / cap failures.
      showSnackbar(
        extractErrorMessage(error, "Could not save the permission request."),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const printSlip = (request: PermissionRequest) => {
    if (!request.gatePassQr) return;
    const printWindow = window.open("", "_blank", "width=720,height=800");
    if (!printWindow) {
      showSnackbar("Allow pop-ups to print the gate-pass slip.", "error");
      return;
    }

    const slipContent = `
      <!doctype html>
      <html>
        <head>
          <title>Gate pass ${escapeHtml(request.requestNumber || request.id)}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { margin: 0; padding: 32px; color: #172033; font-family: Arial, sans-serif; }
            main { max-width: 520px; margin: 0 auto; border: 1px solid #dbe2ea; border-radius: 16px; padding: 28px; }
            h1 { margin: 0 0 6px; font-size: 22px; }
            p { color: #5c6677; margin: 0 0 20px; font-size: 13px; }
            dl { display: grid; grid-template-columns: 130px 1fr; gap: 12px; margin: 0 0 22px; font-size: 14px; }
            dt { color: #667085; } dd { margin: 0; font-weight: 600; }
            img { display: block; width: 190px; height: 190px; margin: 0 auto 12px; }
            .status { text-align: center; color: #a15c00; font-weight: 700; }
            .ref { text-align: center; color: #667085; font-size: 12px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <main>
            <h1>Gate pass request</h1>
            <p>This slip is a request reference, not an approved gate pass.</p>
            <dl>
              <dt>Employee</dt><dd>${escapeHtml(request.employeeName || employeeName)}</dd>
              <dt>Employee ID</dt><dd>${escapeHtml(request.employeeCode || request.employeeId || employeeId)}</dd>
              <dt>Date</dt><dd>${escapeHtml(formatDate(request.requestDate))}</dd>
              <dt>Departure</dt><dd>${escapeHtml(formatTime(request.fromTime) || "—")}</dd>
              <dt>Return</dt><dd>${escapeHtml(formatTime(request.toTime) || "—")}</dd>
              <dt>Duration</dt><dd>${escapeHtml(request.hours || computeHrs(request.fromTime, request.toTime) || "—")} hrs</dd>
              <dt>Destination</dt><dd>${escapeHtml(request.destination)}</dd>
              <dt>Reason</dt><dd>${escapeHtml(request.reason)}</dd>
            </dl>
            <img src="${escapeHtml(request.gatePassQr)}" alt="Gate pass request QR code">
            <div class="status">Request reference only</div>
            <div className="ref">${escapeHtml(request.requestNumber || request.id)}</div>
          </main>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>`;

    printWindow.document.write(slipContent);
    printWindow.document.close();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <main className="mx-auto w-full">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-semibold text-gray-800">
              Permission request
            </div>
            <div className="mt-1 text-[12px] text-gray-500">
              Request time away from the workplace. A generated QR code is a
              request reference for staff to review, not a gate authorization.
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-700 shadow-sm">
            <BadgeOutlinedIcon className="!text-indigo-600" fontSize="small" />
            <span>{employeeName}</span>
          </div>
        </header>

        {requestError && tab === 0 && <Alert severity="error">{requestError}</Alert>}

        {/* ---- Inline tab header (same style as ApprovalWorkflowHome) ---- */}
        <Box>
          <div className="rounded-xl p-">
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              indicatorColor="primary"
              textColor="primary"
              className="!border-b !border-gray-200"
              sx={{
                "& .MuiTabs-indicator": {
                  backgroundColor: "var(--color-primary)",
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                },
              }}
            >
              <Tab label="New request" className="!text-gray-800" />
              <Tab
                label={`Request list (${totalRequests})`}
                className="!text-gray-800"
              />
            </Tabs>
          </div>
        </Box>

        {/* ==================== TAB 0: New request ==================== */}
        {tab === 0 && (
          <section className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] !my-2">
            <Paper
              component="form"
              onSubmit={handleSubmit}
              elevation={0}
              className="rounded-xl !border !border-gray-200 !bg-white-50 !p-4"
            >
              <div className="mb-5 flex items-start gap-3 border-b border-gray-200 pb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <AddCircleOutlineOutlinedIcon />
                </span>
                <div>
                  <div className="font-semibold text-gray-800">
                    New permission request
                  </div>
                  <div className="mt-1 text-[12px] text-gray-500">
                    Required fields are marked with an asterisk.
                  </div>
                </div>
              </div>

              <div className="grid gap-4 gap-y-6 mt-2 sm:grid-cols-3">
                {canApplyForOthers && (
                  <div className="">
                    <EmployeeAsyncCombobox
                      value={form.employeeId || null}
                      selectedEmployee={selectedEmployee}
                      onChange={(_selectedId, employee) => {
                        const targetId = employee?.id || "";
                        const targetName = employee
                          ? employee.name ||
                          employee.fullName ||
                          employee.employeeName ||
                          "Employee"
                          : "";
                        setSelectedEmployee(employee ?? null);
                        setForm((current) => ({
                          ...current,
                          employeeId: targetId,
                          employeeName: targetName,
                        }));
                      }}
                      label="Request for employee"
                      placeholder="Search employee by name or ID"
                      required
                      pageSize={20}
                      filters={
                        managerOnly ? { managerId: user?.userId } : undefined
                      }
                      helperText={
                        managerOnly
                          ? "Only employees reporting to you are listed."
                          : "Select the employee this permission request is for."
                      }
                    />
                  </div>
                )}

                <TextField
                  select
                  label="Permission type"
                  value={form.type}
                  onChange={(event) =>
                    updateForm("type", event.target.value as PermissionType)
                  }
                  required
                  size="small"
                >
                  <MenuItem value="PERSONAL">Personal</MenuItem>
                  <MenuItem value="OFFICIAL">Official work</MenuItem>
                </TextField>

                <DatePicker
                  label="Date"
                  value={form.requestDate ? dayjs(form.requestDate) : null}
                  onChange={(newValue: any) => {
                    updateForm(
                      "requestDate",
                      newValue ? newValue.format("YYYY-MM-DD") : "",
                    );
                  }}
                  minDate={dayjs(today)}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />

                <TimePicker
                  label="Departure time (optional)"
                  value={
                    form.fromTime
                      ? dayjs(`1970-01-01T${form.fromTime}`)
                      : null
                  }
                  onChange={(newValue: any) => {
                    const nextFrom = newValue ? newValue.format("HH:mm") : "";
                    setForm((current) => ({
                      ...current,
                      fromTime: nextFrom,
                      hours: computeHrs(nextFrom, current.toTime),
                    }));
                  }}
                  ampm={false}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />

                <TimePicker
                  label="Expected return time (optional)"
                  value={
                    form.toTime ? dayjs(`1970-01-01T${form.toTime}`) : null
                  }
                  onChange={(newValue: any) => {
                    const nextTo = newValue ? newValue.format("HH:mm") : "";
                    setForm((current) => ({
                      ...current,
                      toTime: nextTo,
                      hours: computeHrs(current.fromTime, nextTo),
                    }));
                  }}
                  ampm={false}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                />

                <TextField
                  label="Hrs"
                  value={form.hours}
                  placeholder="Auto-calculated"
                  onChange={(event) =>
                    updateForm("hours", event.target.value)
                  }
                  helperText="Calculated from departure and return time when both are set."
                />

                <TextField
                  label="Destination"
                  value={form.destination}
                  onChange={(event) =>
                    updateForm("destination", event.target.value)
                  }
                  placeholder="Where will you be going?"
                  slotProps={{ htmlInput: { maxLength: 120 } }}
                  required
                  className=""
                />

                <TextField
                  label="Reason"
                  value={form.reason}
                  onChange={(event) =>
                    updateForm("reason", event.target.value)
                  }
                  placeholder="Briefly explain why you need permission"
                  required
                  className="sm:col-span-2"
                />
              </div>

              <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <BadgeOutlinedIcon className="mt-0.5 !text-indigo-600" />
                    <div>
                      <p className="text-[12px] font-medium text-gray-800">
                        Generate gate-pass slip
                      </p>
                      <p className="mt-1 max-w-lg text-[12px] leading-5 text-gray-500">
                        Turn on to create a printable slip with a unique QR
                        code. The QR is a request reference only and is not a
                        gate authorization.
                      </p>
                    </div>
                  </div>
                  <FormControlLabel
                    className="!mr-0"
                    control={
                      <Switch
                        checked={form.gatePassEnabled}
                        onChange={(event) =>
                          updateForm("gatePassEnabled", event.target.checked)
                        }
                        color="primary"
                        slotProps={{
                          input: { "aria-label": "Generate gate-pass slip" },
                        }}
                      />
                    }
                    label={form.gatePassEnabled ? "On" : "Off"}
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setForm(
                      emptyForm(
                        today,
                        canApplyForOthers ? "" : employeeId,
                        canApplyForOthers ? "" : employeeName,
                      ),
                    );
                    setSelectedEmployee(null);
                  }}
                  disabled={submitting}
                  className="!border-gray-200 !text-gray-800"
                >
                  Clear form
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={submitting}
                  startIcon={<CheckCircleOutlineOutlinedIcon />}
                  className="!bg-primary"
                >
                  {submitting ? "Submitting..." : "Submit request"}
                </Button>
              </div>
            </Paper>

            <Paper
              elevation={0}
              className="rounded-xl !border !border-gray-200 !bg-white !p-5 md:!p-6"
            >
              <h2 className="font-semibold text-gray-800">
                Before you submit
              </h2>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[12px] font-semibold text-indigo-700">
                    1
                  </span>
                  <p className="pt-1 text-[12px] leading-5 text-gray-600">
                    Enter your destination and, if known, the time you expect to return.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[12px] font-semibold text-indigo-700">
                    2
                  </span>
                  <p className="pt-1 text-[12px] leading-5 text-gray-600">
                    Save your request here. Gate-pass slip generation is
                    optional.
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[12px] font-semibold text-indigo-700">
                    3
                  </span>
                  <p className="pt-1 text-[12px] leading-5 text-gray-600">
                    If enabled, print the request reference. It is not an
                    approved gate pass.
                  </p>
                </div>
              </div>
              <Alert severity="info" className="!mt-5 !text-[12px]">
                Requests are submitted to HRMS. A generated QR code is only a
                request reference and does not authorize gate entry.
              </Alert>
            </Paper>
          </section>
        )}

        {/* ==================== TAB 1: Request list ==================== */}
        {tab === 1 && (
          <section aria-labelledby="request-history-title" className="!m-2">
            {requestError && <Alert severity="error" className="!mb-4">{requestError}</Alert>}
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <div
                  id="request-history-title"
                  className="font-semibold text-gray-800"
                >
                  Recent permission requests
                </div>
                <p className="text-[12px] text-gray-500">
                  {canViewAllRequests
                    ? "Permission requests across employees."
                    : "Your permission requests."}
                </p>
              </div>
              <span className="text-[12px] text-gray-500">
                {totalRequests} total
              </span>
            </div>

            {loadingRequests ? (
              <Paper
                elevation={0}
                className="rounded-xl !border !border-gray-200 !bg-white !p-8 text-center text-[12px] text-gray-500"
              >
                Loading permission requests...
              </Paper>
            ) : requests.length === 0 ? (
              <Paper
                elevation={0}
                className="flex flex-col items-center rounded-xl !border !border-dashed !border-gray-200 !bg-white !px-5 !py-10 text-center"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                  <ScheduleOutlinedIcon />
                </span>
                <p className="mt-3 text-[12px] font-medium text-gray-800">
                  No permission requests yet
                </p>
                <p className="mt-1 text-[12px] text-gray-500">
                  Submitted requests will appear here.
                </p>
                <Button
                  size="small"
                  variant="outlined"
                  className="!mt-4 !normal-case"
                  startIcon={<AddCircleOutlineOutlinedIcon />}
                  onClick={() => setTab(0)}
                >
                  Create a request
                </Button>
              </Paper>
            ) : (
              <Paper
                elevation={0}
                className="overflow-hidden rounded-xl !border !border-gray-200 !bg-white"
              >
                <TableContainer sx={{ maxHeight: 560 }}>
                  <Table stickyHeader size="small" aria-label="Permission requests">
                    <TableHead>
                      <TableRow>
                        <TableCell className="!font-bold">S No</TableCell>
                        <TableCell className="!font-bold">Reference</TableCell>
                        <TableCell className="!font-bold">Employee</TableCell>
                        <TableCell className="!font-bold">Time</TableCell>
                        <TableCell className="!font-bold">Hrs</TableCell>
                        <TableCell className="!font-bold">Type</TableCell>
                        <TableCell className="!font-bold">Destination</TableCell>
                        <TableCell className="!font-bold">Reason</TableCell>
                        <TableCell className="!font-bold">Gate pass</TableCell>
                        <TableCell className="!font-bold">Requested Date</TableCell>
                        <TableCell className="!font-bold" align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRequests.map((request, i) => (
                        <TableRow
                          key={request.id}
                          sx={getRowColor(i)}
                        >
                          <TableCell>{page * limit + i + 1}</TableCell>
                          <TableCell>
                            {request.requestNumber || request.id}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-gray-800">
                              {request.employeeName || "-"}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              {request.employeeCode || request.employeeId || "—"}
                            </div>
                          </TableCell>

                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {request.fromTime || request.toTime
                              ? `${formatTime(request.fromTime) || "-"} – ${formatTime(request.toTime) || "-"}`
                              : "-"}
                          </TableCell>

                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {request.hours ||
                              computeHrs(request.fromTime, request.toTime) ||
                              "-"}
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={
                                request.type === "PERSONAL" ? "Personal" : "Official"
                              }
                              color={
                                request.type === "PERSONAL" ? "warning" : "info"
                              }
                              sx={{ fontSize: 11, height: 22 }}
                            />
                          </TableCell>

                          <TableCell sx={{ maxWidth: 180 }}>
                            <span className="line-clamp-2">{request.destination}</span>
                          </TableCell>

                          <TableCell sx={{ maxWidth: 240 }}>
                            <span className="line-clamp-2">{request.reason}</span>
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              color={request.gatePassEnabled ? "success" : "error"}
                              variant="outlined"
                              label={request.gatePassEnabled ? "Yes" : "No"}
                              sx={{ fontSize: 11, height: 22 }}
                            />
                          </TableCell>

                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {formatDateTime(request.requestDate)}
                          </TableCell>

                          <TableCell align="center">
                            <div className="flex justify-center gap-1">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => void openRequestSlip(request)}
                                className="!text-primary !border-primary"
                                sx={{ fontSize: 11, py: 0.25 }}
                              >
                                {request.gatePassEnabled ? "View slip" : "Details"}
                              </Button>
                              {request.gatePassEnabled && (
                                <Button
                                  size="small"
                                  aria-label={`Download gate-pass slip ${request.requestNumber || request.id}`}
                                  onClick={() => void downloadSlip(request)}
                                  disabled={downloadingSlip}
                                  sx={{ minWidth: 32, px: 0.5 }}
                                >
                                  <DownloadOutlinedIcon fontSize="small" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {totalRequests > 0 && (
                  <GlobalPagination
                    total={totalRequests}
                    page={page + 1}
                    limit={limit}
                    onPageChange={(newPage) => setPage(newPage - 1)}
                    onLimitChange={(newLimit) => {
                      setLimit(newLimit);
                      setPage(0);
                    }}
                  />
                )}
              </Paper>
            )}
          </section>
        )}

        {/* ==================== Gate-pass dialog ==================== */}
        <Dialog
          open={Boolean(selectedRequest)}
          onClose={() => setSelectedRequest(null)}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle className="!flex !items-center !justify-between !border-b !border-gray-200 !p-2">
            <div className="!ml-4">
              {selectedRequest?.gatePassEnabled ? "Gate-pass slip" : "Permission request"}
            </div>
            <Button
              aria-label="Close gate-pass slip"
              onClick={() => setSelectedRequest(null)}
              color="inherit"
              className="!min-w-0"
            >
              <CloseOutlinedIcon className="text-gray-800"/>
            </Button>
          </DialogTitle>
          <DialogContent className="!pt-5">
            {selectedRequest && (
              <div className="mx-auto max-w-sm rounded-xl border border-gray-200 p-5 text-center">
                {selectedRequest.gatePassEnabled && (
                  <p className="text-[12px] font-semibold uppercase tracking-widest text-indigo-600">
                    Gate pass request
                  </p>
                )}
                <h3 className="mt-2 text-lg font-semibold text-gray-800">
                  {selectedRequest.employeeName || "—"}
                </h3>
                <p className="mt-1 text-[12px] text-gray-500">
                  ID {selectedRequest.employeeCode || selectedRequest.employeeId || "—"}
                  {selectedRequest.department && ` · ${selectedRequest.department}`}
                  {" · "}
                  {formatDate(selectedRequest.requestDate)}
                </p>
                {selectedRequest.gatePassQr ? (
                  <div className="my-4 flex justify-center">
                    <img
                      src={selectedRequest.gatePassQr}
                      alt="Gate pass request QR code"
                      width={180}
                      height={180}
                      aria-label="Gate pass request QR code"
                    />
                  </div>
                ) : selectedRequest.qrToken ? (
                  <div className="my-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500">
                      QR reference token
                    </p>
                    <p className="mt-1 break-all font-mono text-[12px] font-semibold text-gray-800">
                      {selectedRequest.qrToken}
                    </p>
                  </div>
                ) : null}
                {selectedRequest.gatePassEnabled && (
                  <p className="text-[12px] font-medium text-amber-700">
                    Request reference only
                  </p>
                )}
                <p className="mt-1 text-[12px] text-gray-500">
                  {selectedRequest.fromTime || selectedRequest.toTime
                    ? `${formatTime(selectedRequest.fromTime) || "—"} – ${formatTime(selectedRequest.toTime) || "—"}`
                    : "Time not specified"}{" "}
                  · {selectedRequest.destination}
                </p>
                <p className="mt-1 text-[12px] text-gray-500">
                  Duration:{" "}
                  {selectedRequest.hours ||
                    computeHrs(selectedRequest.fromTime, selectedRequest.toTime) ||
                    "—"}{" "}
                  hrs
                </p>
                <p className="mt-2 text-[11px] text-gray-400">
                  Reference: {selectedRequest.requestNumber || selectedRequest.id}
                </p>
                <p className="mt-3 border-t border-gray-100 pt-3 text-left text-[12px] text-gray-600">
                  {selectedRequest.reason}
                </p>
              </div>
            )}
          </DialogContent>
          <DialogActions className="!border-t !border-gray-200 !px-6 !py-4">
            <Button
              onClick={() => setSelectedRequest(null)}
              className="!text-gray-800 !border-gray-200"
              variant="outlined"
            >
              Close
            </Button>
            {selectedRequest?.gatePassEnabled && (
              <Button
                variant="contained"
                startIcon={<DownloadOutlinedIcon />}
                onClick={() => void downloadSlip(selectedRequest)}
                disabled={downloadingSlip}
                className="!bg-primary"
              >
                Download slip
              </Button>
            )}
            {selectedRequest?.gatePassQr && (
              <Button
                variant="outlined"
                onClick={() => printSlip(selectedRequest)}
                className="!text-gray-800"
              >
                Print
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </main>
    </LocalizationProvider>
  );
}