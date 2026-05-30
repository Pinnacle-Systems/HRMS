import { useState } from "react";
import { Box } from "@mui/material";

import {
  GroupOutlined,
  SettingsOutlined,
  ScheduleOutlined,
  Rotate90DegreesCwOutlined,
} from "@mui/icons-material";

import { ShiftList } from "./shiftList";
import { ShiftRoster } from "./shiftRoster";
import { ShiftScheduleView } from "./shiftScheduleView";
import { ShiftRotation } from "./shiftRotation";
import type { TabPanelProps } from "./types";

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;

  return (
    <div hidden={value !== index}>
      {value === index && (
        <Box sx={{ py: 0 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function ShiftSettings() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    {
      label: "Shift List",
      icon: <SettingsOutlined fontSize="small" />,
      component: <ShiftList />,
    },
    {
      label: "Shift Rotation",
      icon: <Rotate90DegreesCwOutlined fontSize="small" />,
      component: <ShiftRotation />,
    },
    {
      label: "Shift Roster",
      icon: <GroupOutlined fontSize="small" />,
      component: <ShiftRoster />,
    },
    {
      label: "Shift Schedule",
      icon: <ScheduleOutlined fontSize="small" />,
      component: <ShiftScheduleView />,
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-2">
        <div className="font-semibold text-gray-800">
          Shift Management
        </div>
        <div className="text-gray-500 text-[13px] mt-1">
          Configure and manage all company shift policies
        </div>
      </div>

      <div className="border border-gray-300 bg-white">
        {/* Button Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-300 p-2">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab, index) => {
              const active = activeTab === index;
              return (
                <button
                  key={index}
                  onClick={() => setActiveTab(index)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all duration-200
              
              ${active
                      ? "bg-primary-50 text-primary shadow-sm"
                      : "bg-white text-gray-600 hover:bg-primary-50 hover:text-primary"
                    }`}
                >
                  {tab.icon}

                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="">
          {tabs.map((tab, index) => (
            <TabPanel
              key={index}
              value={activeTab}
              index={index}
            >
              {tab.component}
            </TabPanel>
          ))}
        </div>
      </div>
    </div>
  );
};