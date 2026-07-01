import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  MenuItem,
  TextField,
} from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import { useAuth } from "../../../auth/authContext";
import DataState from "../../../components/DataState";
import { FileUpload } from "../../../components/FileUpload";
import { useUI } from "../../../context/Snackbar";
import { leaveService } from "../../../services/modules/leave";
import type {
  LeaveCalculationResult,
  LeaveDayType,
  LeaveRequestStatus,
  LeaveType,
} from "../../../services/modules/leaveTypes";
import LeavePageShell from "../components/LeavePageShell";
import { formatDate } from "../leaveFormatters";
import { requiresLeaveAttachment } from "../leaveRules";
import dayjs from "dayjs";
import { CalculateOutlined, CheckCircleOutlineOutlined } from "@mui/icons-material";
import { CalendarIcon } from "@mui/x-date-pickers";
import { selectSx } from "../../../const";

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
  appliedReason: string;
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
  appliedReason: "",
  emergencyContact: "",
  attachment: "",
};

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
  const leaveTypeId = (location.state as string) || '';

  const selectedLeaveType = useMemo(
    () => leaveTypes.find((leaveType) => leaveType.id === form.leaveTypeId),
    [form.leaveTypeId, leaveTypes],
  );
  const attachmentRequired = requiresLeaveAttachment({
    leaveTypeCode: selectedLeaveType?.code,
    leaveTypeName: selectedLeaveType?.name,
    totalDays: calculation?.days,
    // requiresDocumentAfterDays: selectedLeaveType?.requiresDocumentAfterDays,
  });
  // const exceedsBalance =
  //   calculation !== null && calculation.days > calculation.availableBalance;

  useEffect(() => {
    let isMounted = true;
    const loadLeaveTypes = async () => {
      setLoading(true);
      try {
        const response:any = await leaveService.getLeaveTypes({
          page: 0,
          size: 50,
          sort: "name,ASC",
        });
        if (isMounted) {
          setLeaveTypes(response.data ?? []);
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
    if (leaveTypeId) {
      setForm(prev => ({
        ...prev,
        leaveTypeId
      }));
    }
  }, [leaveTypeId]);

  const calculate = useMemo(() => {
    return async () => {
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
        const payload = {
          employeeId: currentEmployeeId,
          leaveTypeId: form.leaveTypeId,
          fromDate: form.fromDate.format("YYYY-MM-DD"),
          toDate: form.toDate.format("YYYY-MM-DD"),
          fromSession: form.fromSession,
          toSession: form.toSession,
          leaveYear: 0,
        }
        const response: any = await leaveService.calculateLeaveDays(payload);
        setCalculation(response.data ?? null);
      } catch (err: any) {
        setCalculation(null);
        showSnackbar(err?.message || "Failed to calculate leave days", "error");
      } finally {
        setCalculating(false);
      }
    };
  }, [
    form.leaveTypeId,
    form.fromDate,
    form.fromSession,
    form.toDate,
    form.toSession,
    currentEmployeeId,
  ]);

  useEffect(() => {
    let isMounted = true;
    const runCalculation = async () => {
      if (isMounted) {
        await calculate();
      }
    };
    runCalculation();
    return () => {
      isMounted = false;
    };
  }, [
    calculate
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
    if (mode === "submit" && !form.appliedReason.trim()) {
      nextErrors.appliedReason = "Reason is required";
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
      const payload = {
        employeeId: currentEmployeeId,
        leaveTypeId: form.leaveTypeId || leaveTypeId,
        fromDate: form.fromDate?.format("YYYY-MM-DD"),
        toDate: form.toDate?.format("YYYY-MM-DD"),
        fromSession: form.fromSession,
        toSession: form.toSession,
        // dayType: form.fromSession,
        // days: calculation?.days ?? 0,
        appliedReason: form.appliedReason,
        // emergencyContactNumber: form.emergencyContact.trim() || undefined,
        status,
      }
      console.log(payload);
      const response = await leaveService.createLeaveRequest(payload);
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

  // return (
  //   <LeavePageShell
  //     group="employee"
  //     title="Apply Leave"
  //     subtitle="Weekends and holidays are excluded as per policy."
  //     actions={
  //       <Button
  //         variant="outlined"
  //         startIcon={<ArrowBackOutlinedIcon />}
  //         className="!text-gray-800 !border-gray-300"
  //         onClick={() => navigate(-1)}
  //       >
  //         Back
  //       </Button>
  //     }
  //     contentClassName="p-3 space-y-3 w-full min-w-0 max-w-full overflow-x-hidden"
  //     paperClassName="border border-gray-300 !bg-white w-full max-w-full overflow-x-hidden overflow-y-visible"
  //   >

  //     {loading ? (
  //       <DataState type="loading" title="Loading leave form..." />
  //     ) : (
  //       <div className="w-full min-w-0 max-w-full overflow-x-hidden grid grid-cols-2 gap-5">
  //         <div className="min-w-0 overflow-x-hidden overflow-y-visible border border-gray-200 rounded-md p-5 pt-6 bg-white-50">
  //           <LocalizationProvider dateAdapter={AdapterDayjs}>
  //             <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-6 gap-x-4 items-stretch [&>*]:min-w-0">
  //               <TextField
  //                 select
  //                 fullWidth
  //                 label="Leave Type"
  //                 value={form.leaveTypeId}
  //                 error={Boolean(errors.leaveTypeId)}
  //                 helperText={errors.leaveTypeId}
  //                 onChange={(event) =>
  //                   handleChange("leaveTypeId", event.target.value)
  //                 }
  //               >
  //                 {leaveTypes.map((leaveType) => (
  //                   <MenuItem
  //                     key={leaveType.id}
  //                     value={leaveType.id}
  //                     className="!text-gray-800"
  //                   >
  //                     {leaveType.name}
  //                   </MenuItem>
  //                 ))}
  //               </TextField>
  //               <TextField
  //                 fullWidth
  //                 label="Emergency Contact Number"
  //                 value={form.emergencyContact}
  //                 error={Boolean(errors.emergencyContact)}
  //                 // helperText={errors.emergencyContact || "Optional"}
  //                 onChange={(event) =>
  //                   handleChange("emergencyContact", event.target.value)
  //                 }
  //               />
  //               <DatePicker
  //                 label="From Date"
  //                 value={form.fromDate}
  //                 format="DD MMM YYYY"
  //                 onChange={(value) => handleChange("fromDate", dayjs(value))}
  //                 slots={{
  //                   openPickerIcon: CalendarMonthOutlinedIcon,
  //                 }}
  //                 slotProps={{
  //                   textField: {
  //                     fullWidth: true,
  //                     error: Boolean(errors.fromDate),
  //                     helperText: errors.fromDate,
  //                   },
  //                   openPickerButton: {
  //                     color: "primary",
  //                     edge: "end",
  //                   },
  //                   actionBar: {
  //                     actions: ["clear", "today", "accept"],
  //                   },
  //                 }}
  //               />
  //               <DatePicker
  //                 label="To Date"
  //                 value={form.toDate}
  //                 minDate={form.fromDate ?? undefined}
  //                 format="DD MMM YYYY"
  //                 onChange={(value) => handleChange("toDate", dayjs(value))}
  //                 slots={{
  //                   openPickerIcon: CalendarMonthOutlinedIcon,
  //                 }}
  //                 slotProps={{
  //                   textField: {
  //                     fullWidth: true,
  //                     error: Boolean(errors.toDate),
  //                     helperText: errors.toDate,
  //                   },
  //                   openPickerButton: {
  //                     color: "primary",
  //                     edge: "end",
  //                   },
  //                   actionBar: {
  //                     actions: ["clear", "today", "accept"],
  //                   },
  //                 }}
  //               />
  //               <TextField
  //                 select
  //                 fullWidth
  //                 label="From Session"
  //                 value={form.fromSession}
  //                 onChange={(event) =>
  //                   handleChange(
  //                     "fromSession",
  //                     event.target.value as LeaveDayType,
  //                   )
  //                 }
  //               >
  //                 {sessionOptions.map((option) => (
  //                   <MenuItem
  //                     key={option.value}
  //                     value={option.value}
  //                     className="!text-gray-800"
  //                   >
  //                     {option.label}
  //                   </MenuItem>
  //                 ))}
  //               </TextField>



  //               <TextField
  //                 select
  //                 fullWidth
  //                 label="To Session"
  //                 value={form.toSession}
  //                 onChange={(event) =>
  //                   handleChange(
  //                     "toSession",
  //                     event.target.value as LeaveDayType,
  //                   )
  //                 }
  //               >
  //                 {sessionOptions.map((option) => (
  //                   <MenuItem
  //                     key={option.value}
  //                     value={option.value}
  //                     className="!text-gray-800"
  //                   >
  //                     {option.label}
  //                   </MenuItem>
  //                 ))}
  //               </TextField>

  //               <div className="min-w-0 h-full">
  //                 <TextField
  //                   fullWidth
  //                   multiline
  //                   rows={2}
  //                   label="Reason"
  //                   value={form.reason}
  //                   error={Boolean(errors.reason)}
  //                   helperText={errors.reason}
  //                   onChange={(event) =>
  //                     handleChange("reason", event.target.value)
  //                   }
  //                   sx={{
  //                     height: "100%",
  //                     "& .MuiInputBase-root": {
  //                       minHeight: "96px",
  //                       alignItems: "flex-start",
  //                     },
  //                   }}
  //                 />
  //               </div>

  //               <div className="min-w-0 h-full">
  //                 <FileUpload
  //                   label="Attachment Upload"
  //                   value={form.attachment}
  //                   onChange={(file) => handleChange("attachment", file)}
  //                   accept="image/*,application/pdf"
  //                   maxSize={5}
  //                   compact
  //                   description={
  //                     attachmentRequired
  //                       ? "Required for this sick leave duration."
  //                       : "Optional placeholder for medical certificate or supporting document."
  //                   }
  //                 />
  //                 {errors.attachment && (
  //                   <div className="text-[12px] text-error mt-1">
  //                     {errors.attachment}
  //                   </div>
  //                 )}
  //               </div>
  //             </div>
  //           </LocalizationProvider>
  //         </div>

  //         <div className="grid grid-cols-1 xl:grid-cols-1 gap-3 min-w-0">
  //           <div className="border border-gray-300 rounded-lg p-3 bg-white min-w-0">
  //             <div className="font-semibold text-primary mb-3">
  //               Calculation Preview
  //             </div>
  //             {!form.leaveTypeId || !form.fromDate || !form.toDate ? (
  //               <div className="text-[12px] text-gray-500">
  //                 Select leave type and dates to calculate leave days.
  //               </div>
  //             ) : calculating ? (
  //               <div className="text-[12px] text-gray-500">Calculating...</div>
  //             ) : calculation ? (
  //               <div className="space-y-3 text-[12px]">
  //                 <div className="flex flex-wrap justify-between gap-2">
  //                   <span className="text-gray-500">Calculated Days</span>
  //                   <span className="font-semibold text-gray-800">
  //                     {calculation.days}
  //                   </span>
  //                 </div>
  //                 <div className="flex flex-wrap justify-between gap-2">
  //                   <span className="text-gray-500">Available Balance</span>
  //                   <span className="font-semibold text-gray-800">
  //                     {calculation.availableBalance}
  //                   </span>
  //                 </div>
  //                 <div className="flex flex-wrap justify-between gap-2">
  //                   <span className="text-gray-500">Potential LOP</span>
  //                   <span className={exceedsBalance ? "font-semibold text-error" : "text-gray-800"}>
  //                     {calculation.lopDays}
  //                   </span>
  //                 </div>
  //                 {exceedsBalance && (
  //                   <div className="border border-yellow-200 bg-yellow-50 text-yellow-700 rounded-lg p-2">
  //                     Insufficient balance may be converted to LOP.
  //                   </div>
  //                 )}
  //                 {attachmentRequired && (
  //                   <div className="border border-primary-100 bg-primary-50 text-primary rounded-lg p-2">
  //                     Attachment is required for Sick Leave over{" "}
  //                     {selectedLeaveType?.requiresDocumentAfterDays} days.
  //                   </div>
  //                 )}
  //               </div>
  //             ) : (
  //               <div className="text-[12px] text-gray-500">
  //                 Calculation is unavailable for the selected dates.
  //               </div>
  //             )}
  //           </div>

  //           <div className="border border-gray-300 rounded-lg p-3 bg-white min-w-0">
  //             <div className="font-semibold text-primary mb-3">
  //               Excluded Days
  //             </div>
  //             {calculation &&
  //               (calculation.holidays.length || calculation.weeklyOffs.length) ? (
  //               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  //                 <div className="min-w-0">
  //                   <div className="text-[12px] text-gray-500 mb-2">Holidays</div>
  //                   <div className="flex flex-wrap gap-2">
  //                     {calculation.holidays.length ? (
  //                       calculation.holidays.map((date) => (
  //                         <Chip key={date} size="small" label={formatDate(date)} />
  //                       ))
  //                     ) : (
  //                       <span className="text-[12px] text-gray-500">None</span>
  //                     )}
  //                   </div>
  //                 </div>
  //                 <div className="min-w-0">
  //                   <div className="text-[12px] text-gray-500 mb-2">Weekends</div>
  //                   <div className="flex flex-wrap gap-2">
  //                     {calculation.weeklyOffs.length ? (
  //                       calculation.weeklyOffs.map((date) => (
  //                         <Chip key={date} size="small" label={formatDate(date)} />
  //                       ))
  //                     ) : (
  //                       <span className="text-[12px] text-gray-500">None</span>
  //                     )}
  //                   </div>
  //                 </div>
  //               </div>
  //             ) : (
  //               <div className="text-[12px] text-gray-500">
  //                 No weekends or holidays excluded yet.
  //               </div>
  //             )}
  //           </div>
  //         </div>
  //       </div>
  //     )}

  //     <div className="flex flex-wrap justify-end gap-3 border-t border-gray-300 pt-3">
  //       <Button
  //         variant="outlined"
  //         className="!text-gray-800 !border-gray-300"
  //         onClick={() => navigate(-1)}
  //       >
  //         Back
  //       </Button>
  //       <Button
  //         variant="outlined"
  //         startIcon={<SaveOutlinedIcon />}
  //         className="!text-primary !border-primary"
  //         disabled={submitMode !== null}
  //         onClick={() => handleSave("draft")}
  //       >
  //         Save Draft
  //       </Button>
  //       <Button
  //         variant="contained"
  //         startIcon={<SendOutlinedIcon />}
  //         className="!bg-primary"
  //         disabled={submitMode !== null}
  //         onClick={() => handleSave("submit")}
  //       >
  //         Submit Leave Request
  //       </Button>
  //     </div>
  //   </LeavePageShell>
  // );

  return (
    // <LeavePageShell
    //   group="employee"
    //   title="Apply Leave"
    //   subtitle="Weekends and holidays are excluded as per policy."
    //   actions={
    //     <Button
    //       variant="outlined"
    //       startIcon={<ArrowBackOutlinedIcon />}
    //       className="!text-gray-600 !border-gray-300 hover:!bg-gray-50"
    //       onClick={() => navigate(-1)}
    //     >
    //       Back
    //     </Button>
    //   }
    //   contentClassName="p-6 space-y-6 w-full min-w-0 max-w-full overflow-x-hidden"
    //   paperClassName="border border-gray-200 !bg-white w-full max-w-full overflow-x-hidden overflow-y-visible shadow-sm"
    // >
    //   {loading ? (
    //     <DataState type="loading" title="Loading leave form..." />
    //   ) : (
    //     <div className="w-full min-w-0 max-w-full overflow-x-hidden">
    //       {/* Main Grid */}
    //       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    //         {/* Form Section - Takes 2/3 of space */}
    //         <div className="lg:col-span-2 min-w-0 overflow-x-hidden overflow-y-visible">
    //           <LocalizationProvider dateAdapter={AdapterDayjs}>
    //             <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-6">
    //               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    //                 {/* Leave Type */}
    //                 <TextField
    //                   select
    //                   fullWidth
    //                   label="Leave Type"
    //                   value={form.leaveTypeId}
    //                   error={Boolean(errors.leaveTypeId)}
    //                   helperText={errors.leaveTypeId}
    //                   onChange={(event) =>
    //                     handleChange("leaveTypeId", event.target.value)
    //                   }
    //                   size="medium"
    //                 >
    //                   {leaveTypes.map((leaveType) => (
    //                     <MenuItem
    //                       key={leaveType.id}
    //                       value={leaveType.id}
    //                       className="!text-gray-800"
    //                     >
    //                       {leaveType.name}
    //                     </MenuItem>
    //                   ))}
    //                 </TextField>

    //                 {/* Emergency Contact */}
    //                 <TextField
    //                   fullWidth
    //                   label="Emergency Contact Number"
    //                   value={form.emergencyContact}
    //                   error={Boolean(errors.emergencyContact)}
    //                   onChange={(event) =>
    //                     handleChange("emergencyContact", event.target.value)
    //                   }
    //                   size="medium"
    //                 />

    //                 {/* From Date */}
    //                 <DatePicker
    //                   label="From Date"
    //                   value={form.fromDate}
    //                   format="DD MMM YYYY"
    //                   onChange={(value) => handleChange("fromDate", dayjs(value))}
    //                   slots={{
    //                     openPickerIcon: CalendarMonthOutlinedIcon,
    //                   }}
    //                   slotProps={{
    //                     textField: {
    //                       fullWidth: true,
    //                       error: Boolean(errors.fromDate),
    //                       helperText: errors.fromDate,
    //                       size: "medium",
    //                     },
    //                     openPickerButton: {
    //                       color: "primary",
    //                       edge: "end",
    //                     },
    //                     actionBar: {
    //                       actions: ["clear", "today", "accept"],
    //                     },
    //                   }}
    //                 />

    //                 {/* To Date */}
    //                 <DatePicker
    //                   label="To Date"
    //                   value={form.toDate}
    //                   minDate={form.fromDate ?? undefined}
    //                   format="DD MMM YYYY"
    //                   onChange={(value) => handleChange("toDate", dayjs(value))}
    //                   slots={{
    //                     openPickerIcon: CalendarMonthOutlinedIcon,
    //                   }}
    //                   slotProps={{
    //                     textField: {
    //                       fullWidth: true,
    //                       error: Boolean(errors.toDate),
    //                       helperText: errors.toDate,
    //                       size: "medium",
    //                     },
    //                     openPickerButton: {
    //                       color: "primary",
    //                       edge: "end",
    //                     },
    //                     actionBar: {
    //                       actions: ["clear", "today", "accept"],
    //                     },
    //                   }}
    //                 />

    //                 {/* From Session */}
    //                 <TextField
    //                   select
    //                   fullWidth
    //                   label="From Session"
    //                   value={form.fromSession}
    //                   onChange={(event) =>
    //                     handleChange(
    //                       "fromSession",
    //                       event.target.value as LeaveDayType,
    //                     )
    //                   }
    //                   size="medium"
    //                 >
    //                   {sessionOptions.map((option) => (
    //                     <MenuItem
    //                       key={option.value}
    //                       value={option.value}
    //                       className="!text-gray-800"
    //                     >
    //                       {option.label}
    //                     </MenuItem>
    //                   ))}
    //                 </TextField>

    //                 {/* To Session */}
    //                 <TextField
    //                   select
    //                   fullWidth
    //                   label="To Session"
    //                   value={form.toSession}
    //                   onChange={(event) =>
    //                     handleChange(
    //                       "toSession",
    //                       event.target.value as LeaveDayType,
    //                     )
    //                   }
    //                   size="medium"
    //                 >
    //                   {sessionOptions.map((option) => (
    //                     <MenuItem
    //                       key={option.value}
    //                       value={option.value}
    //                       className="!text-gray-800"
    //                     >
    //                       {option.label}
    //                     </MenuItem>
    //                   ))}
    //                 </TextField>

    //                 {/* Reason - Full Width */}
    //                 <div className="md:col-span-2">
    //                   <TextField
    //                     fullWidth
    //                     multiline
    //                     rows={3}
    //                     label="Reason for Leave"
    //                     placeholder="Please provide a brief reason for your leave request..."
    //                     value={form.reason}
    //                     error={Boolean(errors.reason)}
    //                     helperText={errors.reason}
    //                     onChange={(event) =>
    //                       handleChange("reason", event.target.value)
    //                     }
    //                     size="medium"
    //                   />
    //                 </div>

    //                 {/* Attachment - Full Width */}
    //                 <div className="md:col-span-2">
    //                   <FileUpload
    //                     label="Attachment (Optional)"
    //                     value={form.attachment}
    //                     onChange={(file) => handleChange("attachment", file)}
    //                     accept="image/*,application/pdf"
    //                     maxSize={5}
    //                     compact
    //                     description={
    //                       attachmentRequired
    //                         ? "Medical certificate required for sick leave over 3 days"
    //                         : "Upload supporting documents (PDF, JPG, PNG)"
    //                     }
    //                   />
    //                   {errors.attachment && (
    //                     <div className="text-[12px] text-red-500 mt-1">
    //                       {errors.attachment}
    //                     </div>
    //                   )}
    //                 </div>
    //               </div>
    //             </div>
    //           </LocalizationProvider>
    //         </div>

    //         {/* Right Panel - Calculation Summary */}
    //         <div className="lg:col-span-1 space-y-4">
    //           {/* Calculation Preview Card */}
    //           <div className={`rounded-xl border p-5 shadow-sm ${
    //             calculation?.insufficientBalance
    //               ? 'bg-gradient-to-br from-red-50 to-orange-50/50 border-red-200'
    //               : 'bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100/50'
    //           }`}>
    //             <div className="flex items-center gap-2 mb-4">
    //               <div className={`p-1.5 rounded-lg ${
    //                 calculation?.insufficientBalance
    //                   ? 'bg-red-100'
    //                   : 'bg-blue-100'
    //               }`}>
    //                 <CalculateOutlined className={`w-4 h-4 ${
    //                   calculation?.insufficientBalance
    //                     ? 'text-red-600'
    //                     : 'text-blue-600'
    //                 }`} />
    //               </div>
    //               <h3 className="font-semibold text-gray-800">Leave Summary</h3>
    //               {calculation?.insufficientBalance && (
    //                 <span className="ml-auto text-[12px] font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
    //                   LOP Alert
    //                 </span>
    //               )}
    //             </div>

    //             {!form.leaveTypeId || !form.fromDate || !form.toDate ? (
    //               <div className="text-[12px] text-gray-500 text-center py-6">
    //                 <span className="block text-3xl mb-2">📅</span>
    //                 Select dates to preview
    //               </div>
    //             ) : calculating ? (
    //               <div className="flex items-center justify-center py-6">
    //                 <div className="animate-pulse text-[12px] text-gray-500">
    //                   Calculating...
    //                 </div>
    //               </div>
    //             ) : calculation ? (
    //               <div className="space-y-4">
    //                 {/* Days Summary - 2x2 Grid */}
    //                 <div className="grid grid-cols-2 gap-3">
    //                   <div className={`rounded-lg p-3 text-center backdrop-blur-sm ${
    //                     calculation.insufficientBalance
    //                       ? 'bg-white/70'
    //                       : 'bg-white/70'
    //                   }`}>
    //                     <div className={`text-2xl font-bold ${
    //                       calculation.insufficientBalance
    //                         ? 'text-orange-600'
    //                         : 'text-blue-600'
    //                     }`}>
    //                       {calculation.calculatedDays}
    //                     </div>
    //                     <div className="text-[12px] text-gray-500 mt-1">Requested</div>
    //                   </div>
    //                   <div className="bg-white/70 rounded-lg p-3 text-center backdrop-blur-sm">
    //                     <div className="text-2xl font-bold text-green-600">
    //                       {calculation.currentBalance || 0}
    //                     </div>
    //                     <div className="text-[12px] text-gray-500 mt-1">Available</div>
    //                   </div>
    //                   <div className="bg-white/70 rounded-lg p-3 text-center backdrop-blur-sm">
    //                     <div className={`text-2xl font-bold ${
    //                       calculation.balanceAfter < 0
    //                         ? 'text-red-600'
    //                         : 'text-green-600'
    //                     }`}>
    //                       {calculation.balanceAfter}
    //                     </div>
    //                     <div className="text-[12px] text-gray-500 mt-1">Balance After</div>
    //                   </div>
    //                   <div className="bg-white/70 rounded-lg p-3 text-center backdrop-blur-sm">
    //                     <div className="text-2xl font-bold text-red-600">
    //                       {calculation.potentialLop || 0}
    //                     </div>
    //                     <div className="text-[12px] text-gray-500 mt-1">LOP Days</div>
    //                   </div>
    //                 </div>

    //                 {/* Detailed Breakdown */}
    //                 <div className="bg-white/60 rounded-lg p-3 backdrop-blur-sm space-y-2">
    //                   <div className="flex justify-between text-[12px]">
    //                     <span className="text-gray-600">Calendar Days</span>
    //                     <span className="font-medium text-gray-800">
    //                       {calculation.calendarDays || 30}
    //                     </span>
    //                   </div>
    //                   <div className="flex justify-between text-[12px] border-t border-gray-200/50 pt-2">
    //                     <span className="text-gray-600">Excluded Weekends</span>
    //                     <span className="font-medium text-gray-800">
    //                       {calculation.excludedWeekends?.length || 8}
    //                     </span>
    //                   </div>
    //                   <div className="flex justify-between text-[12px] border-t border-gray-200/50 pt-2">
    //                     <span className="text-gray-600">Excluded Holidays</span>
    //                     <span className="font-medium text-gray-800">
    //                       {calculation.excludedHolidays?.length || 0}
    //                     </span>
    //                   </div>
    //                   <div className="flex justify-between text-[12px] border-t border-gray-200/50 pt-2">
    //                     <span className="text-gray-600">Working Days</span>
    //                     <span className="font-medium text-gray-800">
    //                       {calculation.days}
    //                     </span>
    //                   </div>
    //                 </div>

    //                 {/* Warning Banner */}
    //                 {calculation.insufficientBalance && (
    //                   <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1.5">
    //                     <div className="flex items-start gap-2">
    //                       <Alert className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
    //                       <div>
    //                         <div className="text-[12px] font-medium text-red-700">
    //                           Insufficient Balance
    //                         </div>
    //                         <div className="text-[12px] text-red-600 mt-0.5">
    //                           You have {calculation.currentBalance || 0} days available. 
    //                           <span className="font-semibold"> {Math.abs(calculation.balanceAfter)}</span> days will be 
    //                           converted to Loss of Pay (LOP).
    //                         </div>
    //                       </div>
    //                     </div>
    //                     <div className="mt-2 pt-2 border-t border-red-100">
    //                       <div className="flex justify-between text-[12px]">
    //                         <span className="text-red-600">Paid Leave</span>
    //                         <span className="font-medium text-red-700">
    //                           {calculation.currentBalance || 0} days
    //                         </span>
    //                       </div>
    //                       <div className="flex justify-between text-[12px] mt-1">
    //                         <span className="text-red-600">LOP</span>
    //                         <span className="font-medium text-red-700">
    //                           {calculation.potentialLop || 22} days
    //                         </span>
    //                       </div>
    //                     </div>
    //                   </div>
    //                 )}

    //                 {!calculation.insufficientBalance && calculation.potentialLop === 0 && (
    //                   <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
    //                     <CheckCircleOutlineOutlined className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
    //                     <div className="text-[12px] text-green-700">
    //                       Sufficient balance available for this leave request.
    //                     </div>
    //                   </div>
    //                 )}
    //               </div>
    //             ) : (
    //               <div className="text-[12px] text-gray-500 text-center py-6">
    //                 Unable to calculate
    //               </div>
    //             )}
    //           </div>

    //           {/* Excluded Days Card */}
    //           <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
    //             <div className="flex items-center gap-2 mb-3">
    //               <div className="p-1 bg-gray-100 rounded-lg">
    //                 <CalendarIcon className="w-4 h-4 text-gray-600" />
    //               </div>
    //               <h3 className="font-semibold text-gray-800 text-[12px]">Excluded Days</h3>
    //               {calculation?.excludedWeekends && calculation?.excludedWeekends?.length > 0 && (
    //                 <span className="ml-auto text-[12px] text-gray-500">
    //                   {calculation.excludedWeekends.length} weekends
    //                 </span>
    //               )}
    //             </div>

    //             {calculation && (calculation.excludedWeekends?.length || calculation.excludedHolidays?.length) ? (
    //               <div className="space-y-3">
    //                 {/* Weekends */}
    //                 {calculation.excludedWeekends?.length > 0 && (
    //                   <div>
    //                     <div className="text-[12px] text-gray-500 mb-1.5">Weekends</div>
    //                     <div className="flex flex-wrap gap-1.5">
    //                       {calculation.excludedWeekends.slice(0, 6).map((item) => (
    //                         <Chip
    //                           key={item.date}
    //                           size="small"
    //                           label={formatDate(item.date)}
    //                           className="!bg-gray-100 !text-gray-600 !text-[12px]"
    //                         />
    //                       ))}
    //                       {calculation.excludedWeekends.length > 6 && (
    //                         <Chip
    //                           size="small"
    //                           label={`+${calculation.excludedWeekends.length - 6} more`}
    //                           className="!bg-gray-100 !text-gray-600 !text-[12px]"
    //                         />
    //                       )}
    //                     </div>
    //                   </div>
    //                 )}

    //                 {/* Holidays */}
    //                 {calculation.excludedHolidays?.length > 0 && (
    //                   <div>
    //                     <div className="text-[12px] text-gray-500 mb-1.5">Holidays</div>
    //                     <div className="flex flex-wrap gap-1.5">
    //                       {calculation.excludedHolidays.slice(0, 6).map((date) => (
    //                         <Chip
    //                           key={date}
    //                           size="small"
    //                           label={formatDate(date)}
    //                           className="!bg-red-50 !text-red-600 !text-[12px]"
    //                         />
    //                       ))}
    //                       {calculation.excludedHolidays.length > 6 && (
    //                         <Chip
    //                           size="small"
    //                           label={`+${calculation.excludedHolidays.length - 6} more`}
    //                           className="!bg-red-50 !text-red-600 !text-[12px]"
    //                         />
    //                       )}
    //                     </div>
    //                   </div>
    //                 )}
    //               </div>
    //             ) : (
    //               <div className="text-[12px] text-gray-400 text-center py-4">
    //                 No excluded days
    //               </div>
    //             )}
    //           </div>

    //           {/* Leave Type Info Card */}
    //           {selectedLeaveType && (
    //             <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
    //               <div className="flex items-center justify-between text-[12px]">
    //                 <span className="text-gray-600">Leave Type</span>
    //                 <span className="font-medium text-gray-800">
    //                   {selectedLeaveType.name}
    //                 </span>
    //               </div>
    //               <div className="flex items-center justify-between text-[12px] mt-1">
    //                 <span className="text-gray-600">Status</span>
    //                 <span className={`text-[12px] px-2 py-0.5 rounded-full ${
    //                   selectedLeaveType.paid 
    //                     ? 'bg-green-100 text-green-700' 
    //                     : 'bg-gray-100 text-gray-600'
    //                 }`}>
    //                   {selectedLeaveType.paid ? 'Paid' : 'Unpaid'}
    //                 </span>
    //               </div>
    //               {calculation?.insufficientBalance && (
    //                 <div className="mt-2 pt-2 border-t border-gray-200">
    //                   <div className="text-[12px] text-red-600 flex items-center gap-1">
    //                     <span>⚠️</span>
    //                     <span>Will result in {Math.abs(calculation.balanceAfter)} days LOP</span>
    //                   </div>
    //                 </div>
    //               )}
    //             </div>
    //           )}
    //         </div>
    //       </div>

    //       {/* Action Buttons */}
    //       <div className="flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-4 mt-6">
    //         <Button
    //           variant="outlined"
    //           className="!text-gray-600 !border-gray-300 hover:!bg-gray-50"
    //           onClick={() => navigate(-1)}
    //         >
    //           Cancel
    //         </Button>
    //         <Button
    //           variant="outlined"
    //           startIcon={<SaveOutlinedIcon />}
    //           className="!text-gray-700 !border-gray-300 hover:!bg-gray-50"
    //           disabled={submitMode !== null}
    //           onClick={() => handleSave("draft")}
    //         >
    //           Save Draft
    //         </Button>
    //         <Button
    //           variant="contained"
    //           startIcon={<SendOutlinedIcon />}
    //           className={`!shadow-sm ${
    //             calculation?.insufficientBalance
    //               ? '!bg-orange-600 hover:!bg-orange-700'
    //               : '!bg-blue-600 hover:!bg-blue-700'
    //           }`}
    //           disabled={submitMode !== null}
    //           onClick={() => handleSave("submit")}
    //         >
    //           {calculation?.insufficientBalance ? 'Request with LOP' : 'Submit Request'}
    //         </Button>
    //       </div>
    //     </div>
    //   )}
    // </LeavePageShell>
    <LeavePageShell
      group="employee"
      title="Apply Leave"
      subtitle="Weekends and public holidays are automatically excluded"
      // actions={
      //   <Button
      //     // variant="outlined"
      //     startIcon={<ArrowBackOutlinedIcon />}
      //     className="!text-primary"
      //     onClick={() => navigate(-1)}
      //   >
      //     Back
      //   </Button>
      // }
      // contentClassName="p-3 space-y-4 w-full min-w-0 max-w-full overflow-x-hidden"
      // paperClassName="border border-gray-200 !bg-white w-full max-w-full overflow-x-hidden overflow-y-visible shadow-sm"
    >
      {loading ? (
        <DataState type="loading" title="Loading leave form..." />
      ) : (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden">
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Form Section - Takes 3/5 of space */}
            <div className="min-w-0 overflow-x-hidden overflow-y-visible">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2 pb-3 border-b border-gray-200">
                    <div>
                      <h3 className="text-[12px] font-semibold text-gray-800 uppercase tracking-wide">Leave Details</h3>
                      <p className="text-[12px] text-gray-500 mt-0.5">Fill in your leave application</p>
                    </div>
                    {selectedLeaveType && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedLeaveType.paid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-50 text-gray-600 border border-gray-200'
                        }`}>
                        {selectedLeaveType.paid ? 'Paid' : 'Unpaid'}
                      </span>
                    )}
                  </div>

                  <div className="grid gap-x-5 gap-y-2">
                    {/* Leave Type */}
                    <div className="col-span-2">
                      <label className="text-[12px] font-medium text-gray-700 mb-1">
                        Leave Type <span className="text-red-500">*</span>
                      </label>
                      <TextField
                        select
                        fullWidth
                        placeholder="Select type"
                        value={form.leaveTypeId}
                        error={Boolean(errors.leaveTypeId)}
                        helperText={errors.leaveTypeId}
                        onChange={(event) =>
                          handleChange("leaveTypeId", event.target.value)
                        }
                        sx={selectSx}
                      >
                        {leaveTypes.map((leaveType) => (
                          <MenuItem
                            key={leaveType.id}
                            value={leaveType.id}

                          >
                            <div className="flex items-center gap-2">
                              <span>{leaveType.name}</span>

                            </div>
                          </MenuItem>
                        ))}
                      </TextField>
                    </div>

                    {/* Emergency Contact */}
                    {/* <div>
                      <label className="text-[12px] font-medium text-gray-700 block mb-1">
                        Emergency Contact <span className="text-red-500">*</span>
                      </label>
                      <TextField
                        fullWidth
                        placeholder="Phone number"
                        value={form.emergencyContact}
                        error={Boolean(errors.emergencyContact)}
                        helperText={errors.emergencyContact}
                        onChange={(event) =>
                          handleChange("emergencyContact", event.target.value)
                        }
                        size="small"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            backgroundColor: '#f9fafb',
                            fontSize: '13px',
                            '&:hover': {
                              backgroundColor: '#ffffff',
                            },
                          },
                          '& .MuiFormHelperText-root': {
                            fontSize: '10px',
                            marginTop: '2px',
                          },
                        }}
                      />
                    </div> */}

                    {/* From Date */}
                    <div>
                      <label className="text-[12px] font-medium text-gray-700 block mb-1">
                        From Date <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        // label="Select date"
                        value={form.fromDate}
                        format="DD MMM YYYY"
                        onChange={(value) => handleChange("fromDate", dayjs(value))}
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
                        className="!bg-white-50"
                      />
                    </div>

                    {/* To Date */}
                    <div>
                      <label className="text-[12px] font-medium text-gray-700 block mb-1">
                        To Date <span className="text-red-500">*</span>
                      </label>
                      <DatePicker
                        // label="Select date"
                        value={form.toDate}
                        minDate={form.fromDate ?? undefined}
                        format="DD MMM YYYY"
                        onChange={(value) => handleChange("toDate", dayjs(value))}
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
                         className="!bg-white-50"
                      />
                    </div>

                    {/* From Session */}
                    <div>
                      <label className="text-[12px] font-medium text-gray-700 block mb-1">
                        From Session <span className="text-red-500">*</span>
                      </label>
                      <TextField
                        select
                        fullWidth
                        value={form.fromSession}
                        onChange={(event) =>
                          handleChange(
                            "fromSession",
                            event.target.value as LeaveDayType,
                          )
                        }
                        sx={selectSx}
                      >
                        {sessionOptions.map((option) => (
                          <MenuItem
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </div>

                    {/* To Session */}
                    <div>
                      <label className="text-[12px] font-medium text-gray-700 block mb-1">
                        To Session <span className="text-red-500">*</span>
                      </label>
                      <TextField
                        select
                        fullWidth
                        value={form.toSession}
                        onChange={(event) =>
                          handleChange(
                            "toSession",
                            event.target.value as LeaveDayType,
                          )
                        }
                        sx={selectSx}
                      >
                        {sessionOptions.map((option) => (
                          <MenuItem
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </div>

                    {/* Reason - Full Width */}
                    <div className="md:col-span-2">
                      <label className="text-[12px] font-medium text-gray-700 block mb-1">
                        Reason <span className="text-red-500">*</span>
                      </label>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Brief reason for leave..."
                        value={form.appliedReason}
                        error={Boolean(errors.appliedReason)}
                        helperText={errors.appliedReason}
                        onChange={(event) =>
                          handleChange("appliedReason", event.target.value)
                        }
                        size="small"
                      />
                    </div>

                    {/* Attachment - Full Width */}
                    <div className="md:col-span-2">
                      <label className="text-[12px] font-medium text-gray-700 block mb-1">
                        Attachment {!attachmentRequired && <span className="text-gray-400">(Optional)</span>}
                      </label>
                      <FileUpload
                        label=""
                        value={form.attachment}
                        onChange={(file) => handleChange("attachment", file)}
                        accept="image/*,application/pdf"
                        maxSize={5}
                        compact
                        description={
                          attachmentRequired
                            ? "📋 Medical certificate required"
                            : "📎 Upload PDF, JPG, PNG (Max 5MB)"
                        }
                      // className="bg-gray-50/50 rounded-lg border border-dashed border-gray-300 hover:border-gray-400 transition-colors text-[12px]"
                      />
                      {errors.attachment && (
                        <div className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
                          <span>⚠</span> {errors.attachment}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </LocalizationProvider>
            </div>

            {/* Right Panel - Compact Summary */}
            <div className="space-y-3">
              {/* Balance Summary Card */}
              <div className="bg-gradient-to-br from-primary-50 via-primary-50/30 to-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <CalculateOutlined className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-[12px]">Leave Balance</h3>
                    <p className="text-[10px] text-gray-500">Available days</p>
                  </div>
                  {calculation?.insufficientBalance && (
                    <span className="ml-auto text-[9px] font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
                      ⚠ LOP
                    </span>
                  )}
                </div>

                {!form.leaveTypeId || !form.fromDate || !form.toDate ? (
                  <div className="text-center py-4">
                    <span className="text-2xl block mb-2">📅</span>
                    <p className="text-[12px] text-gray-500">Select dates to preview</p>
                  </div>
                ) : calculating ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2 text-[12px] text-gray-500">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Calculating...
                    </div>
                  </div>
                ) : calculation ? (
                  <div className="space-y-3">
                    {/* Balance Stats - Compact */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100">
                        <div className={`text-lg font-bold ${calculation.insufficientBalance
                          ? 'text-orange-500'
                          : 'text-blue-600'
                          }`}>
                          {calculation.calculatedDays}
                        </div>
                        <div className="text-[9px] text-gray-500">Requested</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100">
                        <div className="text-lg font-bold text-emerald-600">
                          {calculation.currentBalance || 0}
                        </div>
                        <div className="text-[9px] text-gray-500">Available</div>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100">
                        <div className={`text-lg font-bold ${calculation.balanceAfter < 0
                          ? 'text-red-500'
                          : 'text-emerald-600'
                          }`}>
                          {calculation.balanceAfter}
                        </div>
                        <div className="text-[9px] text-gray-500">Remaining</div>
                      </div>
                    </div>

                    {/* Breakdown - Compact */}
                    <div className="bg-white rounded-lg p-2.5 space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-500">Calendar Days</span>
                        <span className="font-medium text-gray-700">
                          {calculation.calendarDays || 30}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] border-t border-gray-100 pt-1.5">
                        <span className="text-gray-500">Weekends</span>
                        <span className="font-medium text-gray-700">
                          {calculation.excludedWeekends?.length > 0 ? -(calculation.excludedWeekends?.length) : 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] border-t border-gray-100 pt-1.5">
                        <span className="text-gray-500">Holidays</span>
                        <span className="font-medium text-gray-700">
                          {calculation.excludedHolidays?.length > 0 ? -(calculation.excludedHolidays?.length) : 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] border-t border-gray-100 pt-1.5 font-medium">
                        <span className="text-gray-700">Working Days</span>
                        <span className="text-blue-600 font-bold">
                          {calculation.calculatedDays}
                        </span>
                      </div>
                    </div>

                    {/* LOP Warning - Compact */}
                    {calculation.insufficientBalance && (
                      <div className="bg-gradient-to-r from-red-50 to-orange-50/70 border border-red-200 rounded-lg p-2.5">
                        <div className="flex items-start gap-1.5">
                          {/* <Alert className="w-3.5 h-3.5 text-red-600 mt-0.5 flex-shrink-0" /> */}
                          <div className="text-[10px] text-red-700">
                            <span className="font-semibold">Insufficient Balance</span>
                            <span className="block mt-0.5">
                              {Math.abs(calculation.balanceAfter)} days will be <span className="font-semibold">LOP</span>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <Chip
                            size="small"
                            label={`Paid: ${calculation.currentBalance || 0} days`}
                            className="!bg-emerald-100 !text-emerald-700 !text-[9px] !h-5 !border !border-emerald-200"
                          />
                          <Chip
                            size="small"
                            label={`LOP: ${calculation.potentialLop || 22} days`}
                            className="!bg-red-100 !text-red-700 !text-[9px] !h-5 !border !border-red-200"
                          />
                        </div>
                      </div>
                    )}

                    {!calculation.insufficientBalance && calculation.potentialLop === 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-start gap-1.5">
                        <CheckCircleOutlineOutlined className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div className="text-[10px] text-emerald-700">
                          ✓ Sufficient balance available
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-[12px] text-gray-400">
                    Unable to calculate
                  </div>
                )}
              </div>

              {/* Excluded Days - Compact */}
              <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="p-1 bg-gray-100 rounded-lg">
                    <CalendarIcon className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 text-[12px]">Excluded</h3>
                  {calculation?.excludedWeekends && calculation?.excludedWeekends?.length > 0 && (
                    <span className="ml-auto text-[12px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                      {calculation.excludedWeekends.length + (calculation.excludedHolidays?.length || 0)}
                    </span>
                  )}
                </div>

                {calculation && (calculation.excludedWeekends?.length || calculation.excludedHolidays?.length) ? (
                  <div className="space-y-2">
                    {calculation.excludedWeekends?.length > 0 && (
                      <div>
                        <div className="text-[9px] font-medium text-gray-500 mb-1">Weekends</div>
                        <div className="flex flex-wrap gap-1">
                          {calculation.excludedWeekends.slice(0, 4).map((item) => (
                            <Chip
                              key={item.date}
                              size="small"
                              label={formatDate(item.date)}
                              className="!bg-blue-50 !text-blue-700 !text-[9px] !border !border-blue-100 !h-5"
                            />
                          ))}
                          {calculation.excludedWeekends.length > 4 && (
                            <Chip
                              size="small"
                              label={`+${calculation.excludedWeekends.length - 4}`}
                              className="!bg-gray-100 !text-gray-500 !text-[9px] !h-5"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {calculation.excludedHolidays?.length > 0 && (
                      <div>
                        <div className="text-[9px] font-medium text-gray-500 mb-1">Holidays</div>
                        <div className="flex flex-wrap gap-1">
                          {calculation.excludedHolidays.slice(0, 4).map((date) => (
                            <Chip
                              key={date}
                              size="small"
                              label={formatDate(date)}
                              className="!bg-red-50 !text-red-600 !text-[9px] !border !border-red-100 !h-5"
                            />
                          ))}
                          {calculation.excludedHolidays.length > 4 && (
                            <Chip
                              size="small"
                              label={`+${calculation.excludedHolidays.length - 4}`}
                              className="!bg-gray-100 !text-gray-500 !text-[9px] !h-5"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <p className="text-[12px] text-gray-400">No excluded days</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex flex-wrap justify-end items-center gap-2 border-t border-gray-200 pt-4 my-4">
            <Button
              variant="outlined"
              className="!text-gray-800 !border-gray-200"
              onClick={() => navigate(-1)}
            >
              Cancel
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
              className={`${calculation?.insufficientBalance
                ? '!bg-red-500'
                : '!bg-primary'
                }`}
              disabled={submitMode !== null}
              onClick={() => handleSave("submit")}
            >
              {calculation?.insufficientBalance ? 'Submit with LOP' : 'Submit'}
            </Button>
          </div>
        </div>
      )}
    </LeavePageShell>
  );
}
