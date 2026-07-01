import { useState } from "react";
import { Box } from "@mui/material";
import {
  DashboardOutlined, FormatListBulletedOutlined, TableChartOutlined,
  PlayCircleOutlined, LockOutlined, EditNoteOutlined,
  HowToRegOutlined, PersonSearchOutlined,
  SummarizeOutlined,
  LocationOnOutlined,
  AccessTimeOutlined,
  BeachAccessOutlined,
  EventNoteOutlined,
} from "@mui/icons-material";
import type { TabPanelProps } from "../shiftSettings/types";
import { AttendanceConsolidated } from "./Consolidated";
import { PeriodFinalisation } from "./PeriodFinalisation";
import { ProcessAttendance } from "./ProcessAttendance";

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 0 }}>{children}</Box>}
    </div>
  );
}

const TABS = [
   {
    label: "Consolidate",
    icon: <SummarizeOutlined className="!w-4" />,
    component: <AttendanceConsolidated />,
  }, 
  {
    label: "Process Attendance",
    icon: <PlayCircleOutlined className="!w-4" />,
    component: <ProcessAttendance />,
  },
  {
    label: "Period Finalisation",
    icon: <LockOutlined className="!w-4" />,
    component: <PeriodFinalisation />,
  }, 
];

export default function AttendanceProcessing() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-2">
        <div className="font-semibold text-gray-800">Attendance Processing</div>
        <div className="text-gray-500 text-[12px]">
          Track, process, and finalise employee attendance records
        </div>
      </div>

      <div className="border border-gray-300 bg-white">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-300 p-2 overflow-x-auto">
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
