import { useState } from "react";
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
import { useNavigate } from "react-router-dom";



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
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();

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
          <Button variant="contained" className="!bg-primary" onClick={()=>navigate('/attendance/process')}>Process Attendance</Button>
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
