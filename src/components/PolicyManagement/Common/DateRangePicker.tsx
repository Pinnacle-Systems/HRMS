// // src/components/PolicyManagement/Common/DateRangePicker.tsx

// import React, { useState } from 'react';
// import {
//   TextField,
//   Popover,
//   Button,
//   Box,
//   Stack,
// } from '@mui/material';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// interface DateRangePickerProps {
//   startDate?: string;
//   endDate?: string;
//   onStartDateChange: (date: string) => void;
//   onEndDateChange: (date: string) => void;
//   label?: string;
// }

// export const DateRangePicker: React.FC<DateRangePickerProps> = ({
//   startDate,
//   endDate,
//   onStartDateChange,
//   onEndDateChange,
//   label = 'Effective Period',
// }) => {
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

//   const displayText = `${startDate || 'Start'} - ${endDate || 'End'}`;

//   return (
//     <>
//       <TextField
//         fullWidth
//         size="small"
//         label={label}
//         value={displayText}
//         onClick={(e) => setAnchorEl(e.currentTarget)}
//         placeholder="Select date range"
//       />
//       <Popover
//         open={Boolean(anchorEl)}
//         anchorEl={anchorEl}
//         onClose={() => setAnchorEl(null)}
//         anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
//       >
//         <Box sx={{ p: 2 }}>
//           <LocalizationProvider dateAdapter={AdapterDateFns}>
//             <Stack direction="row" spacing={2}>
//               <DatePicker
//                 label="Start Date"
//                 value={startDate ? new Date(startDate) : null}
//                 onChange={(date) => onStartDateChange(date?.toISOString().split('T')[0] || '')}
//               />
//               <DatePicker
//                 label="End Date (Optional)"
//                 value={endDate ? new Date(endDate) : null}
//                 onChange={(date) => onEndDateChange(date?.toISOString().split('T')[0] || '')}
//               />
//             </Stack>
//           </LocalizationProvider>
//           <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
//             <Button size="small" onClick={() => setAnchorEl(null)}>
//               Done
//             </Button>
//           </Box>
//         </Box>
//       </Popover>
//     </>
//   );
// };