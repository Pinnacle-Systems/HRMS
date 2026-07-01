import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import {
  Button,
  Menu,
  MenuItem,
  ListItemText,
} from "@mui/material";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import ArrowDropUp from "@mui/icons-material/ArrowDropUp";
import { getFilteredTabs, tabs } from "./const";
import { useAuth } from "../../auth/authContext";

export default function Settings() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const [openDropdown, setOpenDropdown] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { session } = useAuth();
  const user = session?.user;
   const userRoles = user?.roles || [];

    const filteredTabs = useMemo(() => {
    return getFilteredTabs(userRoles);
  }, [userRoles]);
  

  useEffect(() => {
    if (filteredTabs.length > 0 && !activeTab) {
      setActiveTab(filteredTabs[0].id);
    }
  }, [filteredTabs, activeTab]);

  const isCategoryItemsPath = (path: string) =>
    path.startsWith("/settings/employee/category-items");

  const routeTabId = useMemo(() => {
    const currentPath = location.pathname;
    if (isCategoryItemsPath(currentPath)) {
      return "employee";
    }
    for (const tab of tabs) {
      for (const option of tab.options) {
        if (currentPath === option.path) {
          return tab.id;
        }
      }
    }
    return filteredTabs.length > 0 ? filteredTabs[0].id : "general";
  }, [location.pathname, filteredTabs]);

  const selectedTabId = openDropdown ? activeTab : routeTabId;
   const currentTab = filteredTabs.find((tab) => tab.id === selectedTabId);

   useEffect(() => {
    if (filteredTabs.length > 0) {
      const currentPath = location.pathname;
      let hasAccess = false;
      
      if (isCategoryItemsPath(currentPath)) {
        hasAccess = true;
      } else {
        for (const tab of filteredTabs) {
          for (const option of tab.options) {
            if (currentPath === option.path) {
              hasAccess = true;
              break;
            }
          }
          if (hasAccess) break;
        }
      }

      if (!hasAccess) {
        const firstTab = filteredTabs[0];
        if (firstTab && firstTab.options.length > 0) {
          navigate(firstTab.options[0].path);
        }
      }
    }
  }, [location.pathname, filteredTabs, navigate]);

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

  if (filteredTabs.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="text-red-500 text-md">
          Access Denied
        </div>
        <div className="text-gray-500 mt-1">
          You don't have permission to view any settings.
        </div>
        <div className="block text-gray-700 mt-2 text-sm">
          Roles: {userRoles.join(', ') || 'None'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* <div className="flex items-center flex-wrap gap-1 mb-1">
        <Chip 
          label={`Role: ${userRoles.join(', ')}`} 
          size="small" 
          color="primary" 
          variant="outlined"
        />
      </div> */}
      {/* Horizontal Tabs */}
      <div className="flex gap-1">
        {filteredTabs.map((tab) => (
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
      <div className="border-t border-gray-300">
        {/* Outlet with ref */}
        <div className="">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
