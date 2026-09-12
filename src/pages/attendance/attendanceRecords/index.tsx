import { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import {
  FormatListBulletedOutlined, TableChartOutlined,

  HowToRegOutlined, PersonSearchOutlined,

} from "@mui/icons-material";
import type { TabPanelProps } from "../types";
import { AttendanceDetailed } from "./AttendanceDetailed";
import { AttendanceMuster } from "./AttendanceMuster";
import { DailyRegister } from "./DailyRegister";
import { EmployeeView } from "./EmployeeView";
import { useNavigate, useSearchParams } from "react-router-dom";
import { attendanceService } from "../../../services/modules/attendance";
import type { ProcessStatusData } from "../../../services/modules/attendanceTypes";



function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 0 }}>{children}</Box>}
    </div>
  );
}

const TABS = [
  {
    label: "Daily Register",
    icon: <HowToRegOutlined className="!w-4" />,
    component: <DailyRegister />,
  },
  {
    label: "Detailed View",
    icon: <FormatListBulletedOutlined className="!w-4" />,
    component: <AttendanceDetailed />,
  },
  {
    label: "Muster Register",
    icon: <TableChartOutlined className="!w-4" />,
    component: <AttendanceMuster />,
  },
  {
    label: "Employee View",
    icon: <PersonSearchOutlined className="!w-4" />,
    component: <EmployeeView />,
  },
];

export default function AttendanceRecords() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") === "detailed" ? 1 : 0);
  const [, setDateVersion] = useState(0);
  const navigate = useNavigate();

  const [date] = useState(() => sessionStorage.getItem("dailyRegisterDate") ?? new Date().toISOString().slice(0, 10));
  const [processStatus, setProcessStatus] = useState<ProcessStatusData | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const processFromDate = activeTab === 1
    ? sessionStorage.getItem("attendanceDetailedFromDate") ?? date
    : sessionStorage.getItem("dailyRegisterDate") ?? date;
  const processToDate = activeTab === 1
    ? sessionStorage.getItem("attendanceDetailedToDate") ?? processFromDate
    : processFromDate;

  const navigateToProcess = () => {
    navigate(`/attendance/process?fromDate=${encodeURIComponent(processFromDate)}&toDate=${encodeURIComponent(processToDate)}`);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchStatus = async () => {
      setIsLoadingStatus(true);
      try {
        const res = await attendanceService.getProcessAttendanceStatus({ date: processFromDate });
        const data = res.data;
        if (!cancelled) setProcessStatus(data);
      } catch (err) {
        if (!cancelled) setProcessStatus(null);
      } finally {
        if (!cancelled) setIsLoadingStatus(false);
      }
    };

    fetchStatus();
  }, [processFromDate, activeTab]);

  useEffect(() => {
    const handleDateChange = () => setDateVersion((version) => version + 1);
    window.addEventListener("attendance-date-changed", handleDateChange);
    return () => window.removeEventListener("attendance-date-changed", handleDateChange);
  }, []);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-2">
        <div className="font-semibold text-gray-800">Attendance Records</div>
        <div className="text-gray-500 text-[12px]">
          Access and manage daily, detailed, muster, and employee-wise attendance records
        </div>
      </div>

      <div className="border border-gray-300 bg-white">
        {/* Tab Navigation */}
        <div className="flex items-center justify-between gap-2 border-b border-gray-300 p-2 overflow-x-auto">
          <div className="flex flex-nowrap gap-2">
            {TABS.map((tab, index) => {
              const active = activeTab === index;
              return (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all duration-200 whitespace-nowrap
                    ${active
                      ? "bg-primary-50 text-primary shadow-sm"
                      : "bg-white text-gray-600 hover:bg-primary-50 hover:text-primary"
                    }`}
                >
                  {tab.icon}
                  <span className="text-[12px]">{tab.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            {!isLoadingStatus && !processStatus?.processed && !processStatus?.locked && (
              <Button variant="contained" className="!bg-primary" onClick={navigateToProcess}>Process Attendance</Button>
            )}
            {!isLoadingStatus && processStatus?.processed && !processStatus.locked && (
              <Button variant="contained" className="!bg-primary" onClick={navigateToProcess}>Re-Process</Button>
            )}
            {!isLoadingStatus && processStatus?.processed && !processStatus.locked && (
              <Button variant="contained" className="!bg-amber-600 !text-white" onClick={navigateToProcess}>Close & Finalise</Button>
            )}
            {!isLoadingStatus && processStatus?.locked && (
              <Button variant="contained" disabled className="!bg-green-800 !text-white">Closed & Finalized</Button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {TABS.map((tab, index) => (
            <TabPanel key={index} value={activeTab} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </div>
      </div>
    </div>
  );
}
