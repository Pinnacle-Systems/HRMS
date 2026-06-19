import { useState } from "react";
import { Box } from "@mui/material";

import {
  GroupOutlined,
  SettingsOutlined,
  ScheduleOutlined,
  Rotate90DegreesCwOutlined,
  SwapHorizOutlined,
} from "@mui/icons-material";

import { ShiftList } from "./shiftList";
import { ShiftRoster } from "./shiftRoster";
import { ShiftScheduleView } from "./shiftScheduleView";
import { ShiftRotation } from "./shiftRotation";
import { ShiftSwapRequests } from "./shiftSwapRequests";
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
      icon: <SettingsOutlined className="!w-4" />,
      component: <ShiftList />,
    },
    {
      label: "Shift Rotation",
      icon: <Rotate90DegreesCwOutlined className="!w-4" />,
      component: <ShiftRotation />,
    },
    {
      label: "Shift Roster",
      icon: <GroupOutlined className="!w-4" />,
      component: <ShiftRoster />,
    },
    {
      label: "Shift Schedule",
      icon: <ScheduleOutlined className="!w-4" />,
      component: <ShiftScheduleView />,
    },
    {
      label: "Swap Requests",
      icon: <SwapHorizOutlined className="!w-4" />,
      component: <ShiftSwapRequests />,
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-2">
        <div className="font-semibold text-gray-800">
          Shift Management
        </div>
        <div className="text-gray-500 text-[12px]">
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

                  <span className="text-[12px]">{tab.label}</span>
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