// import { useState } from "react";
// import {
//   Dialog, DialogTitle, DialogContent, DialogActions,
//   Button, TextField, Alert, IconButton,
//   Chip, LinearProgress,
// } from "@mui/material";
// import { CloseOutlined, QrCodeScannerOutlined } from "@mui/icons-material";
// import { useUI } from "../../context/Snackbar";
// import { attendanceService } from "../../services/modules/attendance";
// import { EmployeeSelector } from "../../components/PolicyManagement/Common/EmployeeSelector";
// import dayjs from "dayjs";
// import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
// import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
// import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

// interface BulkCheckinProps {
//   open: boolean;
//   onClose: () => void;
//   onSuccess?: () => void;
// }

// export function BulkCheckinDialog({ open, onClose, onSuccess }: BulkCheckinProps) {
//   const { showSnackbar, showSpinner, hideSpinner } = useUI();

//   const [employees, setEmployees] = useState<any[]>([]);
//   const [checkinTime, setCheckinTime] = useState(dayjs().toISOString());
//   const [remarks, setRemarks] = useState("");
//   const [submitting, setSubmitting] = useState(false);

//   const handleAddEmployee = (employee: any) => {
//     if (!employee) return;
//     if (employees.find(e => e.id === employee.id)) {
//       showSnackbar("Employee already added", "warning");
//       return;
//     }
//     setEmployees([...employees, employee]);
//   };

//   const handleRemoveEmployee = (id: string) => {
//     setEmployees(employees.filter(e => e.id !== id));
//   };

//   const handleSubmit = async () => {
//     if (employees.length === 0) {
//       showSnackbar("Select at least one employee", "warning");
//       return;
//     }

//     setSubmitting(true);
//     showSpinner();
//     try {
//       await attendanceService.bulkCheckin({
//         employeeIds: employees.map(e => e.id),
//         checkinTime: checkinTime,
//         reason: remarks,
//         markedBy: "current-user",
//       });
//       showSnackbar(`Bulk check-in successful for ${employees.length} employees`, "success");
//       setEmployees([]);
//       setRemarks("");
//       onSuccess?.();
//       onClose();
//     } catch (err: any) {
//       showSnackbar(err?.response?.data?.message ?? "Bulk check-in failed", "error");
//     } finally {
//       setSubmitting(false);
//       hideSpinner();
//     }
//   };

//   return (
//     <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
//       <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
//         <span className="!pl-4 flex items-center gap-2">
//           <QrCodeScannerOutlined className="text-primary" />
//           Bulk Check-in
//         </span>
//         <IconButton size="small" onClick={onClose}>
//           <CloseOutlined fontSize="small" className="text-gray-800" />
//         </IconButton>
//       </DialogTitle>
//       <DialogContent className="!p-4">
//         <div className="space-y-4">
//           <EmployeeSelector
//             value={null}
//             onChange={handleAddEmployee}
//             label="Search & Add Employee"
//           />

//           {employees.length > 0 && (
//             <div className="flex flex-wrap gap-1.5 border border-gray-200 rounded-lg p-2 min-h-[40px]">
//               {employees.map(emp => (
//                 <Chip
//                   key={emp.id}
//                   label={`${emp.employeeName} (${emp.employeeCode})`}
//                   size="small"
//                   onDelete={() => handleRemoveEmployee(emp.id)}
//                 />
//               ))}
//               {employees.length === 0 && (
//                 <span className="text-xs text-gray-400">No employees added</span>
//               )}
//             </div>
//           )}

//           <Alert severity="info" sx={{ py: 0.5 }}>
//             <span className="text-xs">
//               {employees.length} employee{employees.length !== 1 ? "s" : ""} selected
//             </span>
//           </Alert>

//           <LocalizationProvider dateAdapter={AdapterDayjs}>
//             <DateTimePicker
//               label="Check-in Time"
//               value={checkinTime ? dayjs(checkinTime) : null}
//               onChange={(newValue) => setCheckinTime(newValue ? dayjs(newValue).toISOString() : '')}
//               slotProps={{ textField: { fullWidth: true, size: "small" } }}
//             />
//           </LocalizationProvider>

//           <TextField
//             label="Remarks (optional)"
//             fullWidth
//             multiline
//             rows={2}
//             size="small"
//             value={remarks}
//             onChange={(e) => setRemarks(e.target.value)}
//           />
//         </div>
//       </DialogContent>
//       <DialogActions className="!p-4 !border-t !border-gray-200">
//         <Button
//           variant="outlined"
//           className="!border-gray-200 !text-gray-800"
//           onClick={onClose}
//           disabled={submitting}
//         >
//           Cancel
//         </Button>
//         <Button
//           variant="contained"
//           className="!bg-primary"
//           onClick={handleSubmit}
//           disabled={submitting || employees.length === 0}
//         >
//           {submitting ? "Processing..." : `Check-in ${employees.length} Employee${employees.length !== 1 ? "s" : ""}`}
//         </Button>
//       </DialogActions>
//       {submitting && <LinearProgress />}
//     </Dialog>
//   );
// }