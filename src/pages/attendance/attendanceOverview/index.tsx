import { useState } from "react";
import { Box, Button } from "@mui/material";
import {
    DashboardOutlined,
    BeachAccessOutlined,
    EventNoteOutlined,
} from "@mui/icons-material";
import type { TabPanelProps } from "../types";
import { HolidayCalendar } from "./HolidayCalendar";
import { LeaveToday } from "./LeaveToday";
import { AttendanceSummary } from "./AttendanceSummary";
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
        label: "Summary",
        icon: <DashboardOutlined className="!w-4" />,
        component: <AttendanceSummary />,
    },
    {
        label: "On Leave Today",
        icon: <BeachAccessOutlined className="!w-4" />,
        component: <LeaveToday />,
    },
    {
        label: "Holidays",
        icon: <EventNoteOutlined className="!w-4" />,
        component: <HolidayCalendar />,
    },
];

export default function AttendanceOverview() {
    const [activeTab, setActiveTab] = useState(0);
    const navigate = useNavigate();
    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-2">
                <div className="font-semibold text-gray-800">Attendance Overview</div>
                <div className="text-gray-500 text-[12px]">
                    View real-time attendance summary, today's leave status, and holiday calendar
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
