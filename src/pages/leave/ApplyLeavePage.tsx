import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  MenuItem,
  Paper,
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
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
  LeaveCalculationResult,
  LeaveDayType,
  LeaveRequestStatus,
  LeaveType,
} from "../../services/modules/leaveTypes";
import { leaveGroupLabels, leaveRoutes } from "./leaveRoutes";

const sessionOptions: Array<{ value: LeaveDayType; label: string }> = [
  { value: "FULL_DAY", label: "Full Day" },
  { value: "FIRST_HALF", label: "First Half" },
  { value: "SECOND_HALF", label: "Second Half" },
];

type ApplyLeaveForm = {
  leaveTypeId: string;
  fromDate: Dayjs | null;
  fromSession: LeaveDayType;
  toDate: Dayjs | null;
  toSession: LeaveDayType;
  reason: string;
  emergencyContact: string;
  attachment: File | string;
};

type FormErrors = Partial<Record<keyof ApplyLeaveForm, string>>;

const initialForm: ApplyLeaveForm = {
  leaveTypeId: "",
  fromDate: null,
  fromSession: "FULL_DAY",
  toDate: null,
  toSession: "FULL_DAY",
  reason: "",
  emergencyContact: "",
  attachment: "",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default function ApplyLeavePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [form, setForm] = useState<ApplyLeaveForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [calculation, setCalculation] = useState<LeaveCalculationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [submitMode, setSubmitMode] = useState<"submit" | "draft" | null>(null);
  const currentEmployeeId = session?.user.userId ?? "";

  const visibleRoutes = useMemo(() => {
    const roles = session?.user.roles ?? [];
    return leaveRoutes.filter((route) =>
      route.roles.some((role) => roles.includes(role)),
    );
  }, [session?.user.roles]);

  const selectedLeaveType = useMemo(
    () => leaveTypes.find((leaveType) => leaveType.id === form.leaveTypeId),
    [form.leaveTypeId, leaveTypes],
  );
  const attachmentRequired =
    selectedLeaveType?.code === "SL" &&
    calculation?.days !== undefined &&
    selectedLeaveType.requiresDocumentAfterDays !== undefined &&
    calculation.days > selectedLeaveType.requiresDocumentAfterDays;
  const exceedsBalance =
    calculation !== null && calculation.days > calculation.availableBalance;

  useEffect(() => {
    let isMounted = true;

    const loadLeaveTypes = async () => {
      setLoading(true);
      try {
        const response = await leaveService.getLeaveTypes({
          page: 0,
          size: 50,
          sort: "name,ASC",
        });
        if (isMounted) {
          setLeaveTypes(response.data?.content ?? []);
        }
      } catch (err: any) {
        if (isMounted) {
          showSnackbar(err?.message || "Failed to load leave types", "error");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadLeaveTypes();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const calculate = async () => {
      if (!form.leaveTypeId || !form.fromDate || !form.toDate) {
        setCalculation(null);
        return;
      }

      if (form.toDate.isBefore(form.fromDate, "day")) {
        setCalculation(null);
        return;
      }

      setCalculating(true);
      try {
        if (!currentEmployeeId) {
          throw new Error("Current employee id is unavailable");
        }

        const response = await leaveService.calculateLeaveDays({
          employeeId: currentEmployeeId,
          leaveTypeId: form.leaveTypeId,
          fromDate: form.fromDate.format("YYYY-MM-DD"),
          toDate: form.toDate.format("YYYY-MM-DD"),
          fromSession: form.fromSession,
          toSession: form.toSession,
        });
        if (isMounted) {
          setCalculation(response.data ?? null);
        }
      } catch (err: any) {
        if (isMounted) {
          setCalculation(null);
          showSnackbar(err?.message || "Failed to calculate leave days", "error");
        }
      } finally {
        if (isMounted) {
          setCalculating(false);
        }
      }
    };

    calculate();

    return () => {
      isMounted = false;
    };
  }, [
    form.leaveTypeId,
    form.fromDate,
    form.fromSession,
    form.toDate,
    form.toSession,
    currentEmployeeId,
  ]);

  const handleChange = <TKey extends keyof ApplyLeaveForm>(
    key: TKey,
    value: ApplyLeaveForm[TKey],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const validate = (mode: "submit" | "draft") => {
    const nextErrors: FormErrors = {};

    if (!form.leaveTypeId) nextErrors.leaveTypeId = "Leave type is required";
    if (!form.fromDate) nextErrors.fromDate = "From date is required";
    if (!form.toDate) nextErrors.toDate = "To date is required";
    if (form.fromDate && form.toDate && form.toDate.isBefore(form.fromDate, "day")) {
      nextErrors.toDate = "To date cannot be before from date";
    }
    if (mode === "submit" && !form.reason.trim()) {
      nextErrors.reason = "Reason is required";
    }
    if (
      form.emergencyContact &&
      !/^[6-9]\d{9}$/.test(form.emergencyContact.trim())
    ) {
      nextErrors.emergencyContact = "Enter a valid 10 digit Indian mobile number";
    }
    if (mode === "submit" && attachmentRequired && !form.attachment) {
      nextErrors.attachment = "Attachment is required for this sick leave request";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async (mode: "submit" | "draft") => {
    if (!validate(mode)) {
      showSnackbar("Please fix validation errors before saving", "error");
      return;
    }

    setSubmitMode(mode);
    showSpinner();
    try {
      if (!currentEmployeeId) {
        throw new Error("Current employee id is unavailable");
      }

      const status: LeaveRequestStatus = mode === "draft" ? "DRAFT" : "PENDING";
      const response = await leaveService.createLeaveRequest({
        employeeId: currentEmployeeId,
        leaveTypeId: form.leaveTypeId,
        fromDate: form.fromDate?.format("YYYY-MM-DD"),
        toDate: form.toDate?.format("YYYY-MM-DD"),
        fromSession: form.fromSession,
        toSession: form.toSession,
        dayType: form.fromSession,
        days: calculation?.days ?? 0,
        reason: form.reason,
        emergencyContactNumber: form.emergencyContact.trim() || undefined,
        status,
      });

      if (response.success) {
        showSnackbar(
          mode === "draft"
            ? "Leave request draft saved"
            : "Leave request submitted successfully",
          "success",
        );
        navigate("/leaves/my-requests");
      }
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to save leave request", "error");
    } finally {
      hideSpinner();
      setSubmitMode(null);
    }
  };

  return (
    <div className="space-y-4 w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 min-w-0">
        <div className="text-gray-500 text-sm flex flex-wrap items-center gap-1 min-w-0">
          Leave
          <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-primary font-medium">
            {leaveGroupLabels.employee}
          </span>
          <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-gray-800 font-medium">Apply Leave</span>
        </div>
      </div>

      <Paper
        elevation={0}
        className="border border-gray-300 !bg-white w-full max-w-full overflow-x-hidden overflow-y-visible"
        sx={{ maxWidth: "100%", overflowX: "hidden", overflowY: "visible" }}
      >
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

        <div className="p-3 space-y-3 w-full min-w-0 max-w-full overflow-x-hidden">
          <div className="flex flex-wrap items-start justify-between gap-3 min-w-0">
            <div className="min-w-0">
              <div className="text-xl font-semibold text-gray-800">
                Apply Leave
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Weekends and holidays are excluded as per policy.
              </div>
            </div>
            <Button
              variant="outlined"
              startIcon={<ArrowBackOutlinedIcon />}
              className="!text-gray-800 !border-gray-300"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </div>

          {loading ? (
            <div className="border border-gray-300 rounded-lg p-5 text-sm text-gray-500 bg-gray-50">
              Loading leave form...
            </div>
          ) : (
            <div className="space-y-3 w-full min-w-0 max-w-full overflow-x-hidden">
              <div className="min-w-0 overflow-x-hidden overflow-y-visible border border-gray-300 rounded-lg p-3 bg-gray-50">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch [&>*]:min-w-0">
                    <TextField
                      select
                      fullWidth
                      label="Leave Type"
                      value={form.leaveTypeId}
                      error={Boolean(errors.leaveTypeId)}
                      helperText={errors.leaveTypeId}
                      onChange={(event) =>
                        handleChange("leaveTypeId", event.target.value)
                      }
                    >
                      {leaveTypes.map((leaveType) => (
                        <MenuItem
                          key={leaveType.id}
                          value={leaveType.id}
                          className="!text-gray-800"
                        >
                          {leaveType.name}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      fullWidth
                      label="Emergency Contact Number"
                      value={form.emergencyContact}
                      error={Boolean(errors.emergencyContact)}
                      helperText={errors.emergencyContact || "Optional"}
                      onChange={(event) =>
                        handleChange("emergencyContact", event.target.value)
                      }
                    />

                    <DatePicker
                      label="From Date"
                      value={form.fromDate}
                      format="DD MMM YYYY"
                      onChange={(value) => handleChange("fromDate", value)}
                      slots={{
                        openPickerIcon: CalendarMonthOutlinedIcon,
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: Boolean(errors.fromDate),
                          helperText: errors.fromDate,
                        },
                        openPickerButton: {
                          color: "primary",
                          edge: "end",
                        },
                        actionBar: {
                          actions: ["clear", "today", "accept"],
                        },
                      }}
                    />

                    <TextField
                      select
                      fullWidth
                      label="From Session"
                      value={form.fromSession}
                      onChange={(event) =>
                        handleChange(
                          "fromSession",
                          event.target.value as LeaveDayType,
                        )
                      }
                    >
                      {sessionOptions.map((option) => (
                        <MenuItem
                          key={option.value}
                          value={option.value}
                          className="!text-gray-800"
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    <DatePicker
                      label="To Date"
                      value={form.toDate}
                      minDate={form.fromDate ?? undefined}
                      format="DD MMM YYYY"
                      onChange={(value) => handleChange("toDate", value)}
                      slots={{
                        openPickerIcon: CalendarMonthOutlinedIcon,
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: Boolean(errors.toDate),
                          helperText: errors.toDate,
                        },
                        openPickerButton: {
                          color: "primary",
                          edge: "end",
                        },
                        actionBar: {
                          actions: ["clear", "today", "accept"],
                        },
                      }}
                    />

                    <TextField
                      select
                      fullWidth
                      label="To Session"
                      value={form.toSession}
                      onChange={(event) =>
                        handleChange(
                          "toSession",
                          event.target.value as LeaveDayType,
                        )
                      }
                    >
                      {sessionOptions.map((option) => (
                        <MenuItem
                          key={option.value}
                          value={option.value}
                          className="!text-gray-800"
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>

                    <div className="min-w-0 h-full">
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        label="Reason"
                        value={form.reason}
                        error={Boolean(errors.reason)}
                        helperText={errors.reason}
                        onChange={(event) =>
                          handleChange("reason", event.target.value)
                        }
                        sx={{
                          height: "100%",
                          "& .MuiInputBase-root": {
                            minHeight: "96px",
                            alignItems: "flex-start",
                          },
                        }}
                      />
                    </div>

                    <div className="min-w-0 h-full">
                      <FileUpload
                        label="Attachment Upload"
                        value={form.attachment}
                        onChange={(file) => handleChange("attachment", file)}
                        accept="image/*,application/pdf"
                        maxSize={5}
                        compact
                        description={
                          attachmentRequired
                            ? "Required for this sick leave duration."
                            : "Optional placeholder for medical certificate or supporting document."
                        }
                      />
                      {errors.attachment && (
                        <div className="text-xs text-error mt-1">
                          {errors.attachment}
                        </div>
                      )}
                    </div>
                  </div>
                </LocalizationProvider>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 min-w-0">
                <div className="border border-gray-300 rounded-lg p-3 bg-white min-w-0">
                  <div className="font-semibold text-primary mb-3">
                    Calculation Preview
                  </div>
                  {!form.leaveTypeId || !form.fromDate || !form.toDate ? (
                    <div className="text-sm text-gray-500">
                      Select leave type and dates to calculate leave days.
                    </div>
                  ) : calculating ? (
                    <div className="text-sm text-gray-500">Calculating...</div>
                  ) : calculation ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="text-gray-500">Calculated Days</span>
                        <span className="font-semibold text-gray-800">
                          {calculation.days}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="text-gray-500">Available Balance</span>
                        <span className="font-semibold text-gray-800">
                          {calculation.availableBalance}
                        </span>
                      </div>
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className="text-gray-500">Potential LOP</span>
                        <span className={exceedsBalance ? "font-semibold text-error" : "text-gray-800"}>
                          {calculation.lopDays}
                        </span>
                      </div>
                      {exceedsBalance && (
                        <div className="border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-lg p-2">
                          Insufficient balance may be converted to LOP.
                        </div>
                      )}
                      {attachmentRequired && (
                        <div className="border border-primary-100 bg-primary-50 text-primary rounded-lg p-2">
                          Attachment is required for Sick Leave over{" "}
                          {selectedLeaveType?.requiresDocumentAfterDays} days.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      Calculation is unavailable for the selected dates.
                    </div>
                  )}
                </div>

                <div className="border border-gray-300 rounded-lg p-3 bg-white min-w-0">
                  <div className="font-semibold text-primary mb-3">
                    Excluded Days
                  </div>
                  {calculation &&
                  (calculation.holidays.length || calculation.weeklyOffs.length) ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-500 mb-2">Holidays</div>
                        <div className="flex flex-wrap gap-2">
                          {calculation.holidays.length ? (
                            calculation.holidays.map((date) => (
                              <Chip key={date} size="small" label={formatDate(date)} />
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm text-gray-500 mb-2">Weekends</div>
                        <div className="flex flex-wrap gap-2">
                          {calculation.weeklyOffs.length ? (
                            calculation.weeklyOffs.map((date) => (
                              <Chip key={date} size="small" label={formatDate(date)} />
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No weekends or holidays excluded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-gray-300 pt-3">
            <Button
              variant="outlined"
              className="!text-gray-800 !border-gray-300"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
            <Button
              variant="outlined"
              startIcon={<SaveOutlinedIcon />}
              className="!text-primary !border-primary"
              disabled={submitMode !== null}
              onClick={() => handleSave("draft")}
            >
              Save Draft
            </Button>
            <Button
              variant="contained"
              startIcon={<SendOutlinedIcon />}
              className="!bg-primary"
              disabled={submitMode !== null}
              onClick={() => handleSave("submit")}
            >
              Submit Leave Request
            </Button>
          </div>
        </div>
      </Paper>
    </div>
  );
}
