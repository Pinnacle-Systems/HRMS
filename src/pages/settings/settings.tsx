import { useMemo, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Button,
  Menu,
  MenuItem,
  ListItemText,
} from "@mui/material";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import ArrowDropUp from "@mui/icons-material/ArrowDropUp";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import { tabs } from "./const";


export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // const [snackbar, setSnackbar] = useState({
  //   open: false,
  //   message: "",
  //   severity: "success",
  // });

  const routeTabId = useMemo(() => {
    const currentPath = location.pathname;
    for (const tab of tabs) {
      for (const option of tab.options) {
        if (currentPath === option.path) {
          return tab.id;
        }
      }
    }
    return "general";
  }, [location.pathname]);

  const selectedTabId = openDropdown ? activeTab : routeTabId;
  const currentTab = tabs.find((tab) => tab.id === selectedTabId)!;

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

  // const handleSave = () => {
  //   if (childRef.current && childRef.current.handleSave) {
  //     const success = childRef.current.handleSave();
  //     if (success) {
  //       setSnackbar({
  //         open: true,
  //         message: "Settings saved successfully!",
  //         severity: "success",
  //       });
  //     } else {
  //       setSnackbar({
  //         open: true,
  //         message: "Please fix validation errors before saving",
  //         severity: "error",
  //       });
  //     }
  //   } else {
  //     setSnackbar({
  //       open: true,
  //       message: "No save function available",
  //       severity: "warning",
  //     });
  //   }
  // };

  // const handleCancel = () => {
  //   if (childRef.current && childRef.current.handleCancel) {
  //     childRef.current.handleCancel();
  //   }
  //   setSnackbar({ open: true, message: "Changes discarded", severity: "info" });
  // };

  const getCurrentRouteLabel = () => {
    const currentPath = location.pathname;
    for (const tab of tabs) {
      for (const option of tab.options) {
        if (currentPath === option.path) {
          return option.label;
        }
      }
    }
    return "Company Settings";
  };

  return (
    <div className="space-y-2">
      {/* Horizontal Tabs */}
      <div className="flex mb-3 gap-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            onClick={(e) => handleTabClick(e, tab.id)}
            className={`flex items-center rounded-lg !capitalize ${
              selectedTabId === tab.id
                ? "!bg-primary-50 !text-primary"
                : "hover:!bg-primary-50 !text-gray-600"
            }`}
            sx={{ px: 2 }}
          >
            {tab.label}
            {selectedTabId === tab.id && openDropdown ? (
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
        <div className="text-gray-500 mt-4 mb-4 text-sm flex items-center gap-1">
          Settings <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
          <span className="text-primary font-medium">
            {getCurrentRouteLabel()}
          </span>
        </div>

        {/* Outlet with ref */}
        <div className="py-4">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
