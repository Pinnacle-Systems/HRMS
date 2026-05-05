import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Button, Menu, MenuItem, ListItemText } from "@mui/material";
import { ArrowDropDown, ArrowDropUp } from "@mui/icons-material";
import { tabs } from "./const";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const currentPath = location.pathname;
    for (const tab of tabs) {
      for (const option of tab.options) {
        if (currentPath === option.path) {
          setActiveTab(tab.id);
          break;
        }
      }
    }
  }, [location.pathname]);

  const currentTab = tabs.find((tab) => tab.id === activeTab)!;

  const handleTabClick = (
    event: React.MouseEvent<HTMLElement>,
    tabId: string,
  ) => {
    if (activeTab === tabId && openDropdown) {
      setOpenDropdown(false);
      setAnchorEl(null);
    } else {
      setActiveTab(tabId);
      setOpenDropdown(true);
      setAnchorEl(event.currentTarget);
    }
  };

  const handleCloseDropdown = () => {
    setOpenDropdown(false);
    setAnchorEl(null);
  };

  const handleOptionSelect = (path: string) => {
    navigate(path);
    setOpenDropdown(false);
    setAnchorEl(null);
  };

  return (
    <div className="space-y-2">
      {/* Horizontal Tabs */}
      <div className="flex mb-3 gap-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={(e) => handleTabClick(e, tab.id)}
            className={`flex items-center rounded-lg${
              activeTab === tab.id
                ? "!bg-primary-50 !text-primary"
                : "hover:!bg-primary-50 !text-gray-600"
            }`}
            sx={{ px: 2 }}
          >
            {tab.label}
            {activeTab === tab.id && openDropdown ? (
              <ArrowDropUp className="!w-4 !h-4 ml-1" />
            ) : (
              <ArrowDropDown className="!w-4 !h-4 ml-1" />
            )}
          </Button>
        ))}
      </div>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={openDropdown}
        onClose={handleCloseDropdown}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        classes={{ paper: "bg-white" }}
      >
        {currentTab?.options?.map((option) => (
          <MenuItem
            key={option.id}
            selected={location.pathname === option.path}
            onClick={() => handleOptionSelect(option.path)}
            className={`py-2 px-4 hover:!bg-gray-50 ${
              location.pathname === option.path
                ? "!bg-primary-50 !text-primary"
                : "!text-gray-800"
            }`}
          >
            <ListItemText primary={option.label} />
          </MenuItem>
        ))}
      </Menu>

      {/* Content Area */}
      <div className="border-t border-gray-300 mt-4">
        {/* Outlet with ref */}
        <div className="">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
