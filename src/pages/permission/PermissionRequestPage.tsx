import { useEffect, useMemo, useState, type FormEvent } from "react";
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
import { toDataURL } from "qrcode";
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

type PermissionType = "PERSONAL" | "OFFICIAL";

type PermissionRequest = {
  id: string;
  employeeId?: string;
  employeeName?: string;
  submittedById?: string;
  submittedByName?: string;
  type: PermissionType;
  requestDate: string;
  fromTime: string;
  toTime: string;
  destination: string;
  reason: string;
  requestedAt: string;
  gatePassEnabled: boolean;
  gatePassQr?: string;
};

type PermissionForm = Omit<
  PermissionRequest,
  "id" | "submittedById" | "submittedByName" | "requestedAt" | "gatePassQr"
>;

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

const isPermissionRequest = (value: unknown): value is PermissionRequest => {
  if (typeof value !== "object" || value === null) return false;
  const request = value as Partial<PermissionRequest>;
  return (
    typeof request.id === "string" &&
    (request.employeeId === undefined || typeof request.employeeId === "string") &&
    (request.employeeName === undefined || typeof request.employeeName === "string") &&
    (request.submittedById === undefined || typeof request.submittedById === "string") &&
    (request.submittedByName === undefined || typeof request.submittedByName === "string") &&
    (request.type === "PERSONAL" || request.type === "OFFICIAL") &&
    typeof request.requestDate === "string" &&
    typeof request.fromTime === "string" &&
    typeof request.toTime === "string" &&
    typeof request.destination === "string" &&
    typeof request.reason === "string" &&
    typeof request.requestedAt === "string" &&
    typeof request.gatePassEnabled === "boolean" &&
    (!request.gatePassEnabled ||
      (typeof request.gatePassQr === "string" &&
        request.gatePassQr.startsWith("data:image/png;base64,")))
  );
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
  const storageKey = `hrms-permission-requests:${user?.tenantId ?? "tenant"}:${user?.userId ?? "user"}`;

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
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selectedRequest, setSelectedRequest] =
    useState<PermissionRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [storageError, setStorageError] = useState("");

  useEffect(() => {
    setPage(0);
    try {
      const storedRequests = window.localStorage.getItem(storageKey);
      if (!storedRequests) {
        setRequests([]);
        setStorageError("");
        return;
      }

      const parsed: unknown = JSON.parse(storedRequests);
      if (!Array.isArray(parsed) || !parsed.every(isPermissionRequest)) {
        throw new Error("Saved permission requests are not in a valid format.");
      }
      setRequests(parsed);
      setStorageError("");
    } catch (error) {
      setStorageError(
        error instanceof Error
          ? `Could not load saved permission requests: ${error.message}`
          : "Could not load saved permission requests.",
      );
      setRequests([]);
    }
  }, [storageKey]);

  const updateForm = <K extends keyof PermissionForm>(
    field: K,
    value: PermissionForm[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const paginatedRequests = requests.slice(page * limit, (page + 1) * limit);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.employeeId || !form.employeeName) {
      showSnackbar(
        "Select the employee this permission request is for.",
        "error",
      );
      return;
    }
    if (form.toTime <= form.fromTime) {
      showSnackbar("Return time must be later than departure time.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const requestId = `PERM-${Date.now().toString(36).toUpperCase()}`;
      let gatePassQr: string | undefined;

      if (form.gatePassEnabled) {
        const qrPayload = JSON.stringify({
          type: "GATE_PASS_REQUEST",
          reference: requestId,
          employeeId: form.employeeId,
          date: form.requestDate,
        });
        gatePassQr = await toDataURL(qrPayload, {
          width: 240,
          margin: 2,
          errorCorrectionLevel: "M",
        });
      }

      const request: PermissionRequest = {
        ...form,
        id: requestId,
        submittedById: user?.userId,
        submittedByName: employeeName,
        requestedAt: new Date().toISOString(),
        gatePassQr,
      };
      const nextRequests = [request, ...requests];
      window.localStorage.setItem(storageKey, JSON.stringify(nextRequests));
      setRequests(nextRequests);
      setPage(0);
      setForm(
        emptyForm(
          today,
          canApplyForOthers ? "" : employeeId,
          canApplyForOthers ? "" : employeeName,
        ),
      );
      setSelectedEmployee(null);
      if (request.gatePassEnabled) {
        setSelectedRequest(request);
        showSnackbar(
          "Permission request saved and gate-pass slip generated.",
          "success",
        );
      } else {
        showSnackbar("Permission request saved.", "success");
      }
      // Jump to the list tab so the user sees the new entry.
      setTab(1);
    } catch (error) {
      showSnackbar(
        error instanceof Error
          ? `Could not save the permission request: ${error.message}`
          : "Could not save the permission request.",
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
          <title>Gate pass ${escapeHtml(request.id)}</title>
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
              <dt>Employee ID</dt><dd>${escapeHtml(request.employeeId || employeeId)}</dd>
              <dt>Date</dt><dd>${escapeHtml(formatDate(request.requestDate))}</dd>
              <dt>Departure</dt><dd>${escapeHtml(formatTime(request.fromTime))}</dd>
              <dt>Return</dt><dd>${escapeHtml(formatTime(request.toTime))}</dd>
              <dt>Destination</dt><dd>${escapeHtml(request.destination)}</dd>
              <dt>Reason</dt><dd>${escapeHtml(request.reason)}</dd>
            </dl>
            <img src="${escapeHtml(request.gatePassQr)}" alt="Gate pass request QR code">
            <div class="status">Request reference only</div>
            <div class="ref">${escapeHtml(request.id)}</div>
          </main>
          <script>window.onload = () => window.print();</script>
        </body>
      </html>`;

    printWindow.document.write(slipContent);
    printWindow.document.close();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <main className="mx-auto w-full space-y-5">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="font-semibold tracking-tight text-gray-800">
              Permission request
            </div>
            <p className="mt-1 max-w-2xl text-[12px] text-gray-500">
              Request time away from the workplace. Add a gate-pass slip if you
              need a QR code for the exit gate.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-[12px] text-gray-700 shadow-sm">
            <BadgeOutlinedIcon className="!text-indigo-600" fontSize="small" />
            <span>{employeeName}</span>
          </div>
        </header>

        {storageError && <Alert severity="error">{storageError}</Alert>}

        {/* ---- Inline tab header (same style as ApprovalWorkflowHome) ---- */}
        <Box>
          <div className="rounded-xl p-2">
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              indicatorColor="primary"
              textColor="primary"
              className="!border-b !border-gray-300"
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
                label={`Request list (${requests.length})`}
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
                  <h2 className="font-semibold text-gray-800">
                    New permission request
                  </h2>
                  <p className="mt-1 text-[12px] text-gray-500">
                    Required fields are marked with an asterisk.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 gap-y-6 mt-2 sm:grid-cols-3">
                {canApplyForOthers && (
                  <div className="">
                    <EmployeeAsyncCombobox
                      value={form.employeeId || null}
                      selectedEmployee={selectedEmployee}
                      onChange={(_selectedId, employee) => {
                        const targetId =
                          employee?.employeeId || employee?.id || "";
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
                      required: true,
                      fullWidth: true,
                    },
                  }}
                />

                <TimePicker
                  label="Departure time"
                  value={
                    form.fromTime
                      ? dayjs(`1970-01-01T${form.fromTime}`)
                      : null
                  }
                  onChange={(newValue: any) => {
                    updateForm(
                      "fromTime",
                      newValue ? newValue.format("HH:mm") : "",
                    );
                  }}
                  ampm
                  slotProps={{
                    textField: {
                      required: true,
                      fullWidth: true,
                    },
                  }}
                />

                <TimePicker
                  label="Expected return time"
                  value={
                    form.toTime ? dayjs(`1970-01-01T${form.toTime}`) : null
                  }
                  onChange={(newValue: any) => {
                    updateForm(
                      "toTime",
                      newValue ? newValue.format("HH:mm") : "",
                    );
                  }}
                  ampm
                  slotProps={{
                    textField: {
                      required: true,
                      fullWidth: true,
                    },
                  }}
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
                  slotProps={{ htmlInput: { maxLength: 500 } }}
                  required
                  multiline
                  minRows={3}
                  className="sm:col-span-3"
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
                    Enter your destination and the time you expect to return.
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
                Requests are currently stored in this browser only; they are not
                sent to an approval workflow or shared with the selected
                employee.
              </Alert>
            </Paper>
          </section>
        )}

        {/* ==================== TAB 1: Request list ==================== */}
        {tab === 1 && (
          <section aria-labelledby="request-history-title" className="!m-2">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <div
                  id="request-history-title"
                  className="font-semibold text-gray-800"
                >
                  Recent permission requests
                </div>
                <p className="text-[12px] text-gray-500">
                  Requests you created are listed here, including requests for
                  other employees.
                </p>
              </div>
              <span className="text-[12px] text-gray-500">
                {requests.length} total
              </span>
            </div>

            {requests.length === 0 ? (
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
                      <TableRow
                       
                      >
                        <TableCell className="!font-bold">S No</TableCell>
                        <TableCell className="!font-bold">Reference</TableCell>
                        <TableCell className="!font-bold">Employee</TableCell>
                        <TableCell className="!font-bold">Date</TableCell>
                        <TableCell className="!font-bold">Time</TableCell>
                        <TableCell className="!font-bold">Type</TableCell>
                        <TableCell className="!font-bold">Destination</TableCell>
                        <TableCell className="!font-bold">Reason</TableCell>
                        <TableCell className="!font-bold">Gate pass</TableCell>
                        <TableCell className="!font-bold" align="center">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRequests.map((request, i) => {
                        const isOtherEmployee =
                          request.submittedById &&
                          request.submittedById !==
                          (request.employeeId || employeeId);
                        return (
                          <TableRow
                            key={request.id}
                            sx={getRowColor(i)}
                          >
                            <TableCell>{page * limit + i + 1}</TableCell>
                            <TableCell
                             
                            >
                              {request.id}
                            </TableCell>

                            <TableCell>
                              <div className="font-medium text-gray-800">
                                {request.employeeName || employeeName}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                {request.employeeId || employeeId}
                                {isOtherEmployee && (
                                  <>
                                    {" · by "}
                                    {request.submittedByName || employeeName}
                                  </>
                                )}
                              </div>
                            </TableCell>

                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {formatDate(request.requestDate)}
                            </TableCell>

                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {formatTime(request.fromTime)} –{" "}
                              {formatTime(request.toTime)}
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

                            <TableCell align="center">
                              {request.gatePassEnabled ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => setSelectedRequest(request)}
                                  className="!text-primary !border-primary"
                                  sx={{ fontSize: 11, py: 0.25 }}
                                >
                                  View slip
                                </Button>
                              ) : (
                                <span className="text-gray-800">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                {requests.length > 0 && (
                  <GlobalPagination
                    total={requests.length}
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
          <DialogTitle className="!flex !items-center !justify-between !border-b !border-gray-100">
            Gate-pass slip
            <Button
              aria-label="Close gate-pass slip"
              onClick={() => setSelectedRequest(null)}
              color="inherit"
              className="!min-w-0"
            >
              <CloseOutlinedIcon />
            </Button>
          </DialogTitle>
          <DialogContent className="!pt-5">
            {selectedRequest?.gatePassQr && (
              <div className="mx-auto max-w-sm rounded-xl border border-gray-200 p-5 text-center">
                <p className="text-[12px] font-semibold uppercase tracking-widest text-indigo-600">
                  Gate pass request
                </p>
                <h3 className="mt-2 text-lg font-semibold text-gray-800">
                  {selectedRequest.employeeName || employeeName}
                </h3>
                <p className="mt-1 text-[12px] text-gray-500">
                  ID {selectedRequest.employeeId || employeeId} ·{" "}
                  {formatDate(selectedRequest.requestDate)}
                </p>
                <div className="my-4 flex justify-center">
                  <img
                    src={selectedRequest.gatePassQr}
                    alt="Gate pass request QR code"
                    width={180}
                    height={180}
                    aria-label="Gate pass request QR code"
                  />
                </div>
                <p className="text-[12px] font-medium text-amber-700">
                  Request reference only
                </p>
                <p className="mt-1 text-[12px] text-gray-500">
                  {formatTime(selectedRequest.fromTime)}–
                  {formatTime(selectedRequest.toTime)} ·{" "}
                  {selectedRequest.destination}
                </p>
                <p className="mt-2 text-[11px] text-gray-400">
                  Reference: {selectedRequest.id}
                </p>
              </div>
            )}
          </DialogContent>
          <DialogActions className="!border-t !border-gray-100 !px-6 !py-4">
            <Button
              onClick={() => setSelectedRequest(null)}
              className="!normal-case"
            >
              Close
            </Button>
            {selectedRequest && (
              <Button
                variant="contained"
                startIcon={<DownloadOutlinedIcon />}
                onClick={() => printSlip(selectedRequest)}
                className="!normal-case"
              >
                Print slip
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </main>
    </LocalizationProvider>
  );
}