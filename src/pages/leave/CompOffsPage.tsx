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
import { useUI } from "../../context/Snackbar";
import { leaveService } from "../../services/modules/leave";
import type {
  CompOffCredit,
  // CompOffCreditRequest,
  LeaveDayType,
  LeaveType,
} from "../../services/modules/leaveTypes";
import CompOffStatusBadge from "./components/CompOffStatusBadge";
import LeavePageShell from "./components/LeavePageShell";
import { formatDate } from "./leaveFormatters";
import {
  leaveTableHeaderCellClassName,
} from "./components/leaveTableStyles";
import { calculateCompOffExpiryDate, formatDateForApi } from "./leaveRules";
import dayjs from "dayjs";
import { getRowColor } from "../const";
import { selectSx } from "../../const";

const sessionOptions: Array<{ value: LeaveDayType; label: string }> = [
  { value: "FULL_DAY", label: "Full Day" },
  { value: "FIRST_HALF", label: "First Half" },
  { value: "SECOND_HALF", label: "Second Half" },
];

export default function CompOffsPage() {
  const { session } = useAuth();
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [credits, setCredits] = useState<CompOffCredit[]>([]);
  const [history, setHistory] = useState<CompOffCredit[]>([]);
  const [open, setOpen] = useState(false);
  const [workedDate, setWorkedDate] = useState<Dayjs | null>(null);
  const [sessionType, setsessionType] = useState<LeaveDayType>("FULL_DAY");
  const [reason, setReason] = useState("");
  const [_attachment, setAttachment] = useState<File | string>("");
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const currentEmployeeId = session?.user.userId ?? "";

  const loadCompOffs = async () => {
    showSpinner();
    try {
      if (!currentEmployeeId) {
        throw new Error("Current employee id is unavailable");
      }

      const [creditResponse,historyResponse ]:any = await Promise.all([
        leaveService.getCompOffCredits({
          employeeId: currentEmployeeId,
          page: 0,
          size: 20,
        }),
        leaveService.getCompOffCredits({
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
        const response:any = await leaveService.getLeaveTypes({
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
 
  const availableCredits = credits.filter(
    (credit) => credit.currentStatus === "AVAILABLE",
  );
  const availableDays = availableCredits.reduce(
    (total, credit) => total + credit.creditDays,
    0,
  );
  const pendingDays = credits
    .filter((request) => request.currentStatus === "PENDING")
    .reduce((total, request) => total + request.creditDays, 0);

  const resetForm = () => {
    setWorkedDate(null);
    setsessionType("FULL_DAY");
    setReason("");
    setAttachment("");
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

      const response:any = await leaveService.requestCompOffCredit({
        // employeeId: currentEmployeeId,
        workedDate: workedDate!.format("YYYY-MM-DD"),
        sessionType:sessionType,
        creditDays: sessionType === "FULL_DAY" ? 1 : 0.5,
        expiryDate: formatDateForApi(
          calculateCompOffExpiryDate(workedDate!.toDate()),
        ),
        reason,
        leaveTypeId: compOffLeaveType?.id,
        // attachment,
      });
      if (response.success) {
        showSnackbar(
          "Comp-off credit request submitted for approval",
          "success",
        );
        setHistory((current) => [response.data!, ...current]);
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

  return (
    // <LeavePageShell
    //   group="employee"
    //   title="Comp-Offs"
    //   subtitle="Track available credits and request new comp-off credit"
    //   actions={
    //     <Button
    //       variant="contained"
    //       startIcon={<AddOutlinedIcon />}
    //       className="!bg-primary"
    //       onClick={() => setOpen(true)}
    //     >
    //       Request Comp-Off Credit
    //     </Button>
    //   }
    // >

    //       <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
    //         <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
    //           <div className="text-[12px] text-gray-500">Available Credits</div>
    //           <div className="text-2xl font-semibold text-gray-800">{availableDays}</div>
    //         </div>
    //         <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
    //           <div className="text-[12px] text-gray-500">Pending Approval</div>
    //           <div className="text-2xl font-semibold text-gray-800">{pendingDays}</div>
    //         </div>
    //         <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
    //           <div className="text-[12px] text-gray-500">Credits Available</div>
    //           <div className="text-2xl font-semibold text-gray-800">
    //             {availableCredits.length}
    //           </div>
    //         </div>
    //       </div>

    //       <div className="font-semibold text-primary">Available Credits</div>
    //       <TableContainer
    //         component={Paper}
    //         elevation={0}
    //         className="overflow-auto"
    //         sx={leaveTableContainerSx}
    //       >
    //         <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
    //           <TableHead>
    //             <TableRow sx={leaveTableHeaderRowSx}>
    //               <TableCell className={leaveTableHeaderCellClassName}>Worked Date</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Session</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Credits</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Expiry Date</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Status</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Reason</TableCell>
    //             </TableRow>
    //           </TableHead>
    //           <TableBody>
    //             {credits.map((credit) => (
    //               <TableRow key={credit.id} hover sx={leaveTableRowSx}>
    //                 <TableCell sx={leaveTableBodyCellSx}>{formatDate(credit.workedDate)}</TableCell>
    //                 <TableCell sx={leaveTableBodyCellSx}>{credit.sessionType}</TableCell>
    //                 <TableCell sx={leaveTableBodyCellSx}>{credit.creditDays}</TableCell>
    //                 <TableCell sx={leaveTableBodyCellSx}>{formatDate(credit.expiryDate)}</TableCell>
    //                 <TableCell sx={leaveTableBodyCellSx}>
    //                   <CompOffStatusBadge status={credit.status} />
    //                 </TableCell>
    //                 <TableCell sx={leaveTableBodyCellSx}>{credit.reason}</TableCell>
    //               </TableRow>
    //             ))}
    //             {credits.length === 0 && (
    //               <TableRow>
    //                 <TableCell colSpan={6}>
    //                   <DataState
    //                     compact
    //                     type="empty"
    //                     title="No comp-off credits found."
    //                   />
    //                 </TableCell>
    //               </TableRow>
    //             )}
    //           </TableBody>
    //         </Table>
    //       </TableContainer>

    //       <div className="font-semibold text-primary">Credit Request History</div>
    //       <TableContainer
    //         component={Paper}
    //         elevation={0}
    //         className="overflow-auto"
    //         sx={leaveTableContainerSx}
    //       >
    //         <Table className={leaveTableClassName} size="small" sx={leaveTableSx}>
    //           <TableHead>
    //             <TableRow sx={leaveTableHeaderRowSx}>
    //               <TableCell className={leaveTableHeaderCellClassName}>Request No</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Worked Date</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Session</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Days</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Submitted On</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Approver</TableCell>
    //               <TableCell className={leaveTableHeaderCellClassName}>Status</TableCell>
    //             </TableRow>
    //           </TableHead>
    //           <TableBody>
    //             {history.map((request) => (
    //               <TableRow key={request.id} hover sx={leaveTableRowSx}>
    //                 <TableCell sx={leaveTableBodyCellSx}>{request.id}</TableCell>
    //                 <TableCell sx={leaveTableBodyCellSx}>{formatDate(request.workedDate)}</TableCell>
    //                 <TableCell sx={leaveTableBodyCellSx}>{request.sessionType}</TableCell>
    //                 <TableCell sx={leaveTableBodyCellSx}>{request.requestedDays}</TableCell>
    //                 <TableCell sx={leaveTableBodyCellSx}>{formatDate(request.submittedOn)}</TableCell>
    //                 <TableCell sx={leaveTableBodyCellSx}>{request.approver}</TableCell>
    //                 <TableCell sx={leaveTableBodyCellSx}>
    //                   <CompOffStatusBadge status={request.status} />
    //                 </TableCell>
    //               </TableRow>
    //             ))}
    //             {history.length === 0 && (
    //               <TableRow>
    //                 <TableCell colSpan={7}>
    //                   <DataState
    //                     compact
    //                     type="empty"
    //                     title="No comp-off request history."
    //                   />
    //                 </TableCell>
    //               </TableRow>
    //             )}
    //           </TableBody>
    //         </Table>
    //       </TableContainer>
    //   <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
    //     <div className="flex items-center justify-between p-2 border-b border-gray-300">
    //       <div className="text-gray-800 ml-4">Request Comp-Off Credit</div>
    //       <IconButton onClick={() => setOpen(false)}>
    //         <CloseOutlinedIcon className="!text-gray-800"/>
    //       </IconButton>
    //     </div>
    //     <DialogContent className="!p-4">
    //       <LocalizationProvider dateAdapter={AdapterDayjs}>
    //         <div className="grid gap-4">
    //           <DatePicker
    //             label="Worked Date"
    //             value={workedDate}
    //             onChange={(value) => {
    //               setWorkedDate(dayjs(value));
    //               setErrors((current) => ({ ...current, workedDate: "" }));
    //             }}
    //             slots={{
    //               openPickerIcon: CalendarMonthOutlinedIcon,
    //             }}
    //             slotProps={{
    //               textField: {
    //                 fullWidth: true,
    //                 error: Boolean(errors.workedDate),
    //                 helperText: errors.workedDate,
    //               },
    //               openPickerButton: {
    //                 color: "primary",
    //                 edge: "end",
    //               },
    //             }}
    //           />
    //           <TextField
    //             select
    //             label="Worked Session"
    //             value={sessionType}
    //             onChange={(event) =>
    //               setsessionType(event.target.value as LeaveDayType)
    //             }
    //           >
    //             {sessionOptions.map((option) => (
    //               <MenuItem key={option.value} value={option.value}>
    //                 {option.label}
    //               </MenuItem>
    //             ))}
    //           </TextField>
    //           <TextField
    //             label="Reason"
    //             multiline
    //             rows={3}
    //             value={reason}
    //             error={Boolean(errors.reason)}
    //             helperText={errors.reason}
    //             onChange={(event) => {
    //               setReason(event.target.value);
    //               setErrors((current) => ({ ...current, reason: "" }));
    //             }}
    //           />
    //           <FileUpload
    //             label="Attachment"
    //             value={attachment}
    //             onChange={setAttachment}
    //             accept="image/*,application/pdf"
    //             maxSize={5}
    //             compact
    //             description="Optional proof for weekend or holiday work."
    //           />
    //         </div>
    //       </LocalizationProvider>
    //     </DialogContent>
    //     <DialogActions className="!p-4 !border-t !border-gray-300">
    //       <Button
    //         variant="outlined"
    //         className="!text-gray-800 !border-gray-300"
    //         onClick={() => setOpen(false)}
    //       >
    //         Cancel
    //       </Button>
    //       <Button variant="contained" className="!bg-primary" onClick={submitRequest}>
    //         Submit Request
    //       </Button>
    //     </DialogActions>
    //   </Dialog>
    // </LeavePageShell>

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
      {/* Stats Cards - Redesigned with better visual hierarchy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 !mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl py-2 px-4 border border-blue-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-blue-700">Available Credits</div>
            <div className="w-8 h-8 rounded-full bg-blue-200/50 flex items-center justify-center">
              <span className="text-blue-600 text-[12px] font-bold">✓</span>
            </div>
          </div>
          <div className="text-xl font-bold text-blue-800 mt-1">
            {availableDays}
          </div>
          <div className="text-[12px] text-blue-600/70 mt-1">Ready to use</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-xl py-2 px-4 border border-amber-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-amber-700">Pending Approval</div>
            <div className="w-8 h-8 rounded-full bg-amber-200/50 flex items-center justify-center">
              <span className="text-amber-600 text-[12px] font-bold">⏳</span>
            </div>
          </div>
          <div className="text-xl font-bold text-amber-800 mt-1">
            {pendingDays}
          </div>
          <div className="text-[12px] text-amber-600/70 mt-1">
            Awaiting review
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl py-2 px-4 border border-emerald-200/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div className="text-[12px] text-emerald-700">Credit Requests</div>
            <div className="w-8 h-8 rounded-full bg-emerald-200/50 flex items-center justify-center">
              <span className="text-emerald-600 text-[12px] font-bold">📋</span>
            </div>
          </div>
          <div className="text-xl font-bold text-emerald-800 mt-1">
            {availableCredits.length}
          </div>
          <div className="text-[12px] text-emerald-600/70 mt-1">
            Total requests
          </div>
        </div>
      </div>

      {/* Available Credits Section - Improved with header and count */}
      <div className="!mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <span className="text-[12px] font-semibold text-gray-800">
              Available Credits
            </span>
          </div>
          <span className="text-[12px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {credits.length} {credits.length === 1 ? "credit" : "credits"}
          </span>
        </div>

        <TableContainer className="overflow-auto rounded-sm border border-gray-200 bg-white-50">
          <Table>
            <TableHead>
              <TableRow>
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
              </TableRow>
            </TableHead>
            <TableBody>
              {credits.map((credit, i) => (
                <TableRow key={credit.id} sx={getRowColor(i)}>
                  <TableCell>{formatDate(credit.workedDate)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] ${
                        credit.sessionType === "FULL_DAY"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {credit.sessionType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-primary">
                      {credit.creditDays}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(credit.expiryDate)}</TableCell>
                  <TableCell>
                    <CompOffStatusBadge status={credit.currentStatus} />
                  </TableCell>
                  <TableCell>
                    <span className="line-clamp-1" title={credit.reason}>
                      {credit.reason}
                    </span>
                  </TableCell>
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
      </div>

      {/* Credit Request History Section - Improved with header and count */}
      <div className="!mb-5">
        <div className="flex items-center justify-between !mb-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <span className="text-[12px] font-semibold text-gray-800">
              Credit Request History
            </span>
          </div>
          <span className="text-[12px] text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {history.length} {history.length === 1 ? "request" : "requests"}
          </span>
        </div>

        <TableContainer className="overflow-auto rounded-sm border border-gray-200 bg-white-50">
          <Table>
            <TableHead>
              <TableRow>
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
                  Days
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Submitted On
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Approver
                </TableCell>
                <TableCell className={leaveTableHeaderCellClassName}>
                  Status
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((request, i) => (
                <TableRow key={request.id} sx={getRowColor(i)}>
                  <TableCell>
                    <span>#{request.requestNumber}</span>
                  </TableCell>
                  <TableCell>{formatDate(request.workedDate)}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[12px] ${
                        request.sessionType === "FULL_DAY"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                    >
                      {request.sessionType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold">
                      {request.creditDays}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(request.submittedAt)}</TableCell>
                  <TableCell>
                    <span className="text-gray-700">{request.approverName}</span>
                  </TableCell>
                  <TableCell>
                    <CompOffStatusBadge status={request.currentStatus} />
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
      </div>

      {/* Dialog - Redesigned with better spacing and visual hierarchy */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        // PaperProps={{
        //   className: "rounded-2xl shadow-2xl"
        // }}
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
                      setWorkedDate(dayjs(value));
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
                        className: "rounded-lg",
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
                      setsessionType(event.target.value as LeaveDayType)
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

              {/* <div className="space-y-1">
                <FileUpload
                  label="Attachment"
                  value={attachment}
                  onChange={setAttachment}
                  accept="image/*,application/pdf"
                  maxSize={5}
                  compact
                  description="Optional proof for weekend or holiday work."
                />
              </div> */}
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
