import { useState, useEffect } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem,
  Chip, IconButton, Tooltip,
} from "@mui/material";
import { RefreshOutlined, EventNoteOutlined } from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import dayjs from "dayjs";
import { getRowColor } from "../../const";

interface Holiday {
  id: string;
  date: string;
  name: string;
  type: string;
  state?: string;
  optional?: boolean;
}

export function HolidayCalendar() {
  const { showSnackbar } = useUI();

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [year, setYear] = useState(dayjs().year());
  // const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);

  const loadHolidays = async () => {
    setLoading(true);
    try {
      const res: any = await attendanceService.getCalendarHolidays({
        year,
        // state: state || undefined,
      });
      const data = res?.data?.holidays ?? res?.data;
      setHolidays(Array.isArray(data) ? data : []);
    } catch {
      showSnackbar("Failed to load holidays", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
  }, [year]);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <EventNoteOutlined className="text-primary" />
          <span className="text-[12px] text-gray-800">Holiday Calendar</span>
          <Chip label={holidays.length} size="small" color="primary" />
        </div>
        <div className="flex items-center gap-2">
          <FormControl className="!w-[120px]">
            <InputLabel>Year</InputLabel>
            <Select value={year} label="Year" onChange={(e) => setYear(Number(e.target.value))}>
              {[dayjs().year() - 1, dayjs().year(), dayjs().year() + 1].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Refresh">
            <IconButton size="small" onClick={loadHolidays}>
              <RefreshOutlined fontSize="small" className="text-gray-800"/>
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
      ) : holidays.length === 0 ? (
        <div className="text-center py-4 text-gray-400 text-[12px]">No holidays for selected year</div>
      ) : (
        <TableContainer className="max-h-[400px] border border-gray-200">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {["S No", "Date", "Day", "Name","Optional", "Type"].map((h) => (
                  <TableCell key={h} className="!font-bold">{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {holidays.map((h, i) => (
                <TableRow key={h.id} hover sx={getRowColor(i)}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {dayjs(h.date).format("DD MMM YYYY")}
                  </TableCell>
                  <TableCell>{dayjs(h.date).format("ddd")}</TableCell>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell>
                    <Chip label={h.optional === true ? "Yes" : "No"} size="small" variant="outlined" color={h.optional === true ? "success" : "error"} />
                  </TableCell>
                  <TableCell>
                    <Chip label={h.type} size="small" variant="outlined" className="text-gray-800"/>
                  </TableCell>
                  {/* <TableCell>{h.state || "—"}</TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
}