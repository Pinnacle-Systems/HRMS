import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Chip, MenuItem, TextField } from "@mui/material";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";
import { useAuth } from "../../../auth/authContext";
import DataState from "../../../components/DataState";
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
import {
  CalculateOutlined,
  CheckCircleOutlineOutlined,
} from "@mui/icons-material";
import { CalendarIcon } from "@mui/x-date-pickers";
import { selectSx } from "../../../const";
import { CalendarView } from "./CalendarView";
import { FileUpload } from "../../../components/FileUpload";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";

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

type LocalAttachment = {
  id: string; // Temporary client-side ID
  file: File;
  documentName: string;
  documentType: string;
  fileSize: number;
  uploadedAt: string;
  fileUrl?: string; // Optional preview URL
};

export default function ApplyLeavePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [form, setForm] = useState<ApplyLeaveForm>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [calculation, setCalculation] = useState<LeaveCalculationResult | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [submitMode, setSubmitMode] = useState<"submit" | "draft" | null>(null);
  const currentEmployeeId = session?.user.userId ?? "";
  const leaveTypeId = (location.state as string) || "";
  // const [approverId, setApproverId] = useState("");
  const [calculateError, setCalculateError] = useState("");
  const [localAttachments, setLocalAttachments] = useState<LocalAttachment[]>([]);


  const selectedLeaveType = useMemo(
    () => leaveTypes.find((leaveType) => leaveType.id === form.leaveTypeId),
    [form.leaveTypeId, leaveTypes],
  );

  const attachmentRequired = requiresLeaveAttachment({
    leaveTypeCode: selectedLeaveType?.code,
    leaveTypeName: selectedLeaveType?.name,
    totalDays: calculation?.days,
  });

  useEffect(() => {
    let isMounted = true;
    const loadLeaveTypes = async () => {
      setLoading(true);
      try {
        const response: any = await leaveService.getLeaveTypes({
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
      setForm((prev) => ({
        ...prev,
        leaveTypeId,
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
          leaveYear: form.fromDate.year(),
        };
        const response: any = await leaveService.calculateLeaveDays(payload);
        setCalculation(response.data ?? null);
        setCalculateError("");
      } catch (err: any) {
        setCalculation(null);
        setCalculateError(err?.message || "Failed to calculate leave days");
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
  }, [calculate]);

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
    if (
      form.fromDate &&
      form.toDate &&
      form.toDate.isBefore(form.fromDate, "day")
    ) {
      nextErrors.toDate = "To date cannot be before from date";
    }
    if (mode === "submit" && !form.appliedReason.trim()) {
      nextErrors.appliedReason = "Reason is required";
    }
    if (
      form.emergencyContact &&
      !/^[6-9]\d{9}$/.test(form.emergencyContact.trim())
    ) {
      nextErrors.emergencyContact =
        "Enter a valid 10 digit Indian mobile number";
    }
    if (mode === "submit" && attachmentRequired && localAttachments.length === 0) {
      nextErrors.attachment =
        "Attachment is required for this sick leave request";
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
        appliedReason: form.appliedReason,
        status,
        // approverId: approverId || undefined,
      };
      
      const createResponse = await leaveService.createLeaveRequest(payload);
      if (!createResponse.success || !createResponse.data?.id) {
        throw new Error("Failed to create leave request");
      }
      const leaveRequestId = createResponse.data.id;
      if (localAttachments.length > 0) {        
        const uploadedAttachmentIds: string[] = [];
        for (const localAttachment of localAttachments) {
          try {
            const attachmentData = {
              file: localAttachment.file,
              documentName: localAttachment.documentName,
              documentType: localAttachment.documentType || "LEAVE_ATTACHMENT"
            };
            
            const uploadResponse:any = await leaveService.uploadLeaveAttachment(
              leaveRequestId,
              attachmentData
            );
            
            if (uploadResponse.data?.id) {
              uploadedAttachmentIds.push(uploadResponse.data.id);
            } else {
              console.warn("Upload response missing ID:", uploadResponse);
            }
          } catch (uploadError) {
            console.error("Failed to upload attachment:", uploadError);
          }
        }

        // Optionally update the leave request with attachment IDs
        // if (uploadedAttachmentIds.length > 0) {
        //   try {
        //     const updateResponse:any = await leaveService.updateLeaveRequest(leaveRequestId, {
        //       attachmentIds: uploadedAttachmentIds
        //     });
        //   } catch (updateError) {
        //     console.error("Failed to update leave request with attachments:", updateError);
        //     // Non-critical error, continue
        //   }
        // }
      }

      showSnackbar(
        mode === "draft"
          ? "Leave request draft saved"
          : "Leave request submitted successfully",
        "success",
      );
      navigate("/leaves/my-requests");
      
    } catch (err: any) {
      showSnackbar(err?.message || "Failed to save leave request", "error");
    } finally {
      hideSpinner();
      setSubmitMode(null);
    }
  };

  // Handle adding attachment locally (stores file in state without uploading to server yet)
  const handleAddLocalAttachment = (newItem: any) => {
    if (!newItem?.file) {
      showSnackbar("No file selected", "error");
      return;
    }
    // Validate file size (5MB max)
    if (newItem.file.size > 5 * 1024 * 1024) {
      showSnackbar("File size exceeds 5MB limit", "error");
      return;
    }
    // Create local attachment with temporary ID
    const localAttachment: LocalAttachment = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file: newItem.file,
      documentName: newItem.documentName || newItem.file.name || "LEAVE_ATTACHMENT",
      documentType: newItem.documentType || "LEAVE_ATTACHMENT",
      fileSize: newItem.file.size,
      uploadedAt: new Date().toISOString(),
      fileUrl: URL.createObjectURL(newItem.file),
    };

    setLocalAttachments(prev => [...prev, localAttachment]);
    showSnackbar("File added successfully!", "success");
  };

  // Handle removing local attachment
  const handleRemoveLocalAttachment = (attachmentId: string) => {
    const attachment = localAttachments.find(att => att.id === attachmentId);
    if (attachment?.fileUrl) {
      URL.revokeObjectURL(attachment.fileUrl); // Clean up object URL
    }
    setLocalAttachments(prev => prev.filter(att => att.id !== attachmentId));
    showSnackbar("Attachment removed", "info");
  };

  // Render local attachments
  const renderLocalAttachments = () => {
    if (localAttachments.length === 0) return null;

    return (
      <div className="mt-2 space-y-1.5">
        {localAttachments.map((attachment) => (
          <div 
            key={attachment.id}
            className="flex items-center justify-between bg-gray-50 rounded-lg p-2 border border-gray-200"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 text-xs">📄</span>
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-700 truncate">
                  {attachment.documentName}
                </div>
                <div className="text-[10px] text-gray-500">
                  {(attachment.fileSize / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {attachment.fileUrl && (
                <Button
                  size="small"
                  variant="text"
                  className="!text-primary !min-w-0 !p-1"
                  href={attachment.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="text-xs">Preview</span>
                </Button>
              )}
              <Button
                size="small"
                variant="text"
                className="!text-red-500 !min-w-0 !p-1"
                onClick={() => handleRemoveLocalAttachment(attachment.id)}
              >
                <DeleteOutlineOutlined className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Handle file upload from FileUpload component
  const handleFileUpload = (file: File | string) => {
    if (file && typeof file !== "string") {
      const attachmentItem = {
        file: file,
        documentName: `Leave_Attachment_${form.leaveTypeId || 'draft'}_${Date.now()}`,
        documentType: "LEAVE_ATTACHMENT"
      };
      handleAddLocalAttachment(attachmentItem);
    }
  };

  return (
    <LeavePageShell
      group="employee"
      title="Apply Leave"
      subtitle="Weekends and public holidays are automatically excluded"
    >
      {loading ? (
        <DataState type="loading" title="Loading leave form..." />
      ) : (
        <div className="w-full min-w-0 max-w-full overflow-x-hidden">
          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Form Section */}
            <div className="min-w-0 overflow-x-hidden overflow-y-visible">
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2 pb-3 border-b border-gray-200">
                    <div>
                      <h3 className="text-[12px] font-semibold text-gray-800 uppercase tracking-wide">
                        Leave Details
                      </h3>
                      <p className="text-[12px] text-gray-500 mt-0.5">
                        Fill in your leave application
                      </p>
                    </div>
                    {selectedLeaveType && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${selectedLeaveType.paid
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-50 text-gray-600 border border-gray-200"
                          }`}
                      >
                        {selectedLeaveType.paid ? "Paid" : "Unpaid"}
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
                          <MenuItem key={leaveType.id} value={leaveType.id}>
                            <div className="flex items-center gap-2">
                              <span>{leaveType.name}</span>
                            </div>
                          </MenuItem>
                        ))}
                      </TextField>
                    </div>

                    {/* Calendar View */}
                    <div className="col-span-2">
                      <label className="text-[12px] font-medium text-gray-700 block mb-1">
                        Select Dates <span className="text-red-500">*</span>
                      </label>
                      <div className="bg-gray-50/40">
                        <CalendarView
                          selectedStartDate={form.fromDate}
                          selectedEndDate={form.toDate}
                          onDateRangeSelect={(start, end) => {
                            handleChange("fromDate", start);
                            handleChange("toDate", end);
                            if (start && end) {
                              setTimeout(() => calculate(), 100);
                            }
                          }}
                          fromSession={form.fromSession}
                          toSession={form.toSession}
                          onSessionChange={(from, to) => {
                            handleChange("fromSession", from);
                            handleChange("toSession", to);
                          }}
                          minDate={dayjs().startOf("day")}
                          maxDate={dayjs().add(365, "day")}
                          leaveTypeId={form.leaveTypeId}
                        />

                        {/* Show selected date summary */}
                        {form.fromDate && form.toDate && (
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-100">
                            <div className="flex items-center gap-3">
                              <span>
                                <span className="font-medium">From:</span>{" "}
                                {form.fromDate.format("DD MMM YYYY")}
                                <span className="ml-1 text-gray-400">
                                  (
                                  {form.fromSession === "FULL_DAY"
                                    ? "Full"
                                    : form.fromSession === "FIRST_HALF"
                                      ? "AM"
                                      : "PM"}
                                  )
                                </span>
                              </span>
                              <span>→</span>
                              <span>
                                <span className="font-medium">To:</span>{" "}
                                {form.toDate.format("DD MMM YYYY")}
                                <span className="ml-1 text-gray-400">
                                  (
                                  {form.toSession === "FULL_DAY"
                                    ? "Full"
                                    : form.toSession === "FIRST_HALF"
                                      ? "AM"
                                      : "PM"}
                                  )
                                </span>
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                handleChange("fromDate", null);
                                handleChange("toDate", null);
                                setCalculation(null);
                              }}
                              className="text-[10px] text-red-500 hover:text-red-700"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
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
                        Attachment{" "}
                        {!attachmentRequired && (
                          <span className="text-gray-400">(Optional)</span>
                        )}
                      </label>
                      <FileUpload
                        label=""
                        value={localAttachments.length > 0 ? "uploaded" : ""}
                        onChange={handleFileUpload}
                        accept="image/*,application/pdf"
                        maxSize={5}
                        compact
                        description={
                          attachmentRequired
                            ? "📋 Medical certificate required"
                            : "Upload PDF, JPG, PNG (Max 5MB)"
                        }
                      />
                      {renderLocalAttachments()}
                      {localAttachments.length > 0 && (
                        <div className="text-[10px] text-green-600 mt-1 flex items-center gap-1">
                          <CheckCircleOutlineOutlined className="w-3 h-3" />
                          {localAttachments.length} file(s) ready to upload
                        </div>
                      )}
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

            {/* Right Panel - Summary */}
            <div className="space-y-3">
              {/* Balance Summary Card */}
              <div className="bg-gradient-to-br from-primary-50 via-primary-50/30 to-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-primary-100 rounded-lg">
                    <CalculateOutlined className="w-3.5 h-3.5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 text-[12px]">
                      Leave Balance
                    </h3>
                    <p className="text-[10px] text-gray-500">Available days</p>
                  </div>
                  {calculation?.insufficientBalance && (
                    <span className="ml-auto text-[9px] font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full animate-pulse">
                      ⚠ LOP
                    </span>
                  )}
                  {calculateError && (
                    <span className="ml-auto text-[9px] font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                      ❌ Error
                    </span>
                  )}
                </div>

                {!form.leaveTypeId || !form.fromDate || !form.toDate ? (
                  <div className="text-center py-4">
                    <span className="text-2xl block mb-2">📅</span>
                    <p className="text-[12px] text-gray-500">
                      Select dates to preview
                    </p>
                  </div>
                ) : calculating ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2 text-[12px] text-gray-500">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Calculating...
                    </div>
                  </div>
                ) : calculateError ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="text-red-500 text-sm">⚠️</span>
                      <div>
                        <div className="text-[11px] font-medium text-red-700">
                          Calculation Error
                        </div>
                        <div className="text-[10px] text-red-600 mt-0.5">
                          {calculateError}
                        </div>
                        <button
                          onClick={() => {
                            setCalculateError("");
                            calculate();
                          }}
                          className="text-[10px] text-red-600 underline mt-1 hover:text-red-800"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  </div>
                ) : calculation ? (
                  <div className="space-y-3">
                    {/* Balance Stats - Compact */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100">
                        <div
                          className={`text-lg font-bold ${calculation.insufficientBalance
                            ? "text-orange-500"
                            : "text-blue-600"
                            }`}
                        >
                          {calculation.calculatedDays}
                        </div>
                        <div className="text-[9px] text-gray-500">
                          Requested
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100">
                        <div className="text-lg font-bold text-emerald-600">
                          {calculation.currentBalance || 0}
                        </div>
                        <div className="text-[9px] text-gray-500">
                          Available
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center shadow-sm border border-gray-100">
                        <div
                          className={`text-lg font-bold ${calculation.balanceAfter < 0
                            ? "text-red-500"
                            : "text-emerald-600"
                            }`}
                        >
                          {calculation.balanceAfter}
                        </div>
                        <div className="text-[9px] text-gray-500">
                          Remaining
                        </div>
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
                          {calculation.excludedWeekends?.length > 0
                            ? -calculation.excludedWeekends?.length
                            : 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] border-t border-gray-100 pt-1.5">
                        <span className="text-gray-500">Holidays</span>
                        <span className="font-medium text-gray-700">
                          {calculation.excludedHolidays?.length > 0
                            ? -calculation.excludedHolidays?.length
                            : 0}
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
                          <div className="text-[10px] text-red-700">
                            <span className="font-semibold">
                              Insufficient Balance
                            </span>
                            <span className="block mt-0.5">
                              {Math.abs(calculation.balanceAfter)} days will be{" "}
                              <span className="font-semibold">LOP</span>
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
                            label={`LOP: ${calculation.potentialLop || 0} days`}
                            className="!bg-red-100 !text-red-700 !text-[9px] !h-5 !border !border-red-200"
                          />
                        </div>
                      </div>
                    )}

                    {!calculation.insufficientBalance &&
                      calculation.potentialLop === 0 && (
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
                  <h3 className="font-semibold text-gray-800 text-[12px]">
                    Excluded
                  </h3>
                  {calculation?.excludedWeekends &&
                    calculation?.excludedWeekends?.length > 0 && (
                      <span className="ml-auto text-[12px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {calculation.excludedWeekends.length +
                          (calculation.excludedHolidays?.length || 0)}
                      </span>
                    )}
                </div>

                {calculation &&
                  (calculation.excludedWeekends?.length ||
                    calculation.excludedHolidays?.length) ? (
                  <div className="space-y-2">
                    {calculation.excludedWeekends?.length > 0 && (
                      <div>
                        <div className="text-[9px] font-medium text-gray-500 mb-1">
                          Weekends
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {calculation.excludedWeekends
                            .slice(0, 4)
                            .map((item) => (
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
                        <div className="text-[9px] font-medium text-gray-500 mb-1">
                          Holidays
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {calculation.excludedHolidays
                            .slice(0, 4)
                            .map((date) => (
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
                    <p className="text-[12px] text-gray-400">
                      No excluded days
                    </p>
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
              className={`${calculation?.insufficientBalance ? "!bg-red-500" : "!bg-primary"}`}
              disabled={submitMode !== null}
              onClick={() => handleSave("submit")}
            >
              {calculation?.insufficientBalance ? "Submit with LOP" : "Submit"}
            </Button>
          </div>
        </div>
      )}
    </LeavePageShell>
  );
}