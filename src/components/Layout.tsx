import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Badge from "@mui/material/Badge";
import Tooltip from "@mui/material/Tooltip";
import Popover from "@mui/material/Popover";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import Person4OutlinedIcon from "@mui/icons-material/Person4Outlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import ContrastOutlinedIcon from "@mui/icons-material/ContrastOutlined";
import HelpOutlineTwoTone from "@mui/icons-material/HelpOutlineTwoTone";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { useAuth } from "../auth/authContext";
import GlobalSearch from "./GlobalSearch";
import {
  canShowNavItem,
  getDefaultRoute,
  getWorkspaceLabel,
} from "../auth/authMapper";
import type { NavItem } from "../auth/authTypes";
import logo from "../assets/logo.jpg"
import { DarkModeOutlined, HistoryOutlined as HistoryOutlinedIcon, LightModeOutlined, PolicyOutlined, PowerSettingsNewOutlined, SearchOutlined, TrackChangesOutlined } from "@mui/icons-material";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useTheme } from "../context/themeContext";
import { Chip } from "@mui/material";
import { companyService } from "../services/modules/company";
const drawerWidth = 220;

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, logout } = useAuth();
  const user = session?.user;
  const [attendanceOpen, setAttendanceOpen] = useState(
    location.pathname.startsWith("/attendance")
  );
  const [policyOpen, setPolicyOpen] = useState(
    location.pathname.startsWith("/policies")
  );
  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleProfileMenuClose();
    try {
      await logout();
      // if (response.success) {
      navigate("/login");
      // }
    } catch {
      // intentional
    }
  };

  const handleConMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsMenuClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleMyProfile = async () => {
    handleProfileMenuClose();
    navigate("/profile");
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && (e.key === "d" || e.key === "D")) {
        e.preventDefault();
        toggleMode();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  const menuItems: NavItem[] = [
    {
      text: "Home",
      icon: <DashboardOutlinedIcon />,
      path: user ? getDefaultRoute(user) : "/home",
      roles: ["EMPLOYEE", "MANAGER", "HR", "ADMIN"],
    },
    {
      text: "Employees",
      icon: <PeopleAltOutlinedIcon />,
      path: "/employees",
      roles: ["HR", "ADMIN"],
      permissions: ["EMPLOYEE_READ"],
    },
    {
      text: "Leave",
      icon: <AssignmentOutlinedIcon />,
      path: "/leaves/my-dashboard",
      roles: ["EMPLOYEE", "MANAGER", "HR", "ADMIN"],
    },
    {
      text: "Attendance",
      icon: <TrackChangesOutlined />,
      path: "/attendance",
      roles: ["HR", "ADMIN"],
      children: [
        {
          text: "Shift Management",
          path: "/attendance/shifts",
        },
        {
          text: "Attendance Management",
          path: "/attendance/list",
        },
        {
          text: "Reports",
          path: "/attendance/reports",
        },
      ],
    },
    {
      text: "Payroll",
      icon: <AttachMoneyOutlinedIcon />,
      path: "/payroll",
      roles: ["HR", "ADMIN"],
    },
    {
      text: "Policy Engine",
      icon: <PolicyOutlined />,
      path: "/policies",
      roles: ["HR", "ADMIN"],
      children: [
        {
          text: "Policy Dashboard",
          path: "/policies",
        },
        {
          text: "Policy Simulator",
          path: "/policies/simulator",
        },
        {
          text: "Reports",
          path: "/policies/reports",
        },
      ],
    },
  ];

  const menuBottomItems: NavItem[] = [
    {
      text: "Settings",
      icon: <SettingsOutlinedIcon />,
      path: "/settings/general/company-settings",
      roles: ["HR", "ADMIN"],
    },
    {
      text: "Help",
      icon: <HelpOutlineTwoTone />,
      path: "/documentation",
      roles: ["EMPLOYEE", "MANAGER", "HR", "ADMIN"],
    },
  ]

  const visibleMenuItems = user
    ? menuItems.filter((item) => canShowNavItem(user, item))
    : [];
  const visibleBottomMenuItems = user
    ? menuBottomItems.filter((item) => canShowNavItem(user, item))
    : [];
  const avatarInitial = user?.email?.charAt(0).toUpperCase() || "U";

  const notifications = [
    { id: 1, message: "New employee joined", time: "5 min ago", read: false },
    { id: 2, message: "Task assigned to you", time: "1 hour ago", read: false },
    { id: 3, message: "Meeting at 3 PM", time: "2 hours ago", read: true },
    { id: 4, message: "Salary processed", time: "1 day ago", read: true },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;
  const [searchOpen, setSearchOpen] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<Partial<any>>({

  });

  const fetchCompanyData = async () => {
    try {
      const companyData: any = await companyService.getCompany();
      const companyId = companyData.data.length ? companyData.data?.[0].id : '';
      if (companyId) {
        const response: any = await companyService.getCompanyById(companyId);
        setCompanyInfo(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [])

  return (
    <Box className="flex">
      <CssBaseline />
      <AppBar
        position="fixed"
        className="text-gray-800 shadow-sm z-[1200]"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: "white",
        }}
      >
        <Toolbar className="bg-white flex justify-between items-center">
          <Box className="flex text-primary items-center gap-2">
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerToggle}
              edge="start"
              className="text-primary"
            >
              <MenuIcon />
              {/* <img src={logo} alt=""  width="20px"/> */}
            </IconButton>
            <Box className="flex items-center gap-2">
              {/* <div className="w-4 h-4 bg-primary rounded-sm rotate-45"></div> */}
              <img src={companyInfo.logoUrl} alt="logo" width="20px" />
              <div className="font-bold text-gray-700">
                Vibe<span className="text-primary">HR</span>
              </div>
              {user && (
                <div className="text-[10px] text-gray-400 leading-3">
                  {getWorkspaceLabel(user)}
                </div>
              )}
            </Box>
          </Box>

          {/* Right Side Icons */}
          <Box className="flex items-center gap-2">
            <Tooltip title="Search">
              <IconButton
                size="small"
                aria-label="search"
                color="inherit"
                onClick={() => setSearchOpen(true)}
              >
                <Chip
                  label="CTRL + P"
                  icon={<SearchOutlined className="text-gray-500 !w-5" />}
                  size="small"
                  variant="outlined"
                  className="!text-gray-500"
                />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton
                size="small"
                aria-label="show notifications"
                color="inherit"
              >
                <Badge badgeContent={unreadCount} className="text-primary">
                  <NotificationsNoneOutlinedIcon className="text-gray-500 !w-5" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Theme Settings">
              <IconButton
                size="small"
                onClick={handleConMenuOpen}
                className="text-gray-500"
              >
                <ContrastOutlinedIcon className="!w-5" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Account">
              <IconButton
                size="small"
                edge="end"
                onClick={handleProfileMenuOpen}
                color="inherit"
              >
                <div className="flex items-center gap-5">
                  <div className="relative group">
                    <Avatar
                      src={user?.profilePic}
                      className="!w-8 !h-8 text-2xl cursor-pointer"
                    >
                      {avatarInitial}
                    </Avatar>
                  </div>
                </div>
              </IconButton>
            </Tooltip>
          </Box>

          <GlobalSearch
            open={searchOpen}
            onClose={() => setSearchOpen(false)}
          />
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        keepMounted
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        classes={{ paper: "bg-white" }}
      >
        <MenuItem onClick={handleMyProfile} className="bg-white-50">
          <ListItemIcon>
            <Person4OutlinedIcon className="!w-4 dark:text-primary" />
          </ListItemIcon>
          <div className="text-gray-800 ">My Profile</div>
        </MenuItem>
        <MenuItem onClick={() => navigate("/settings/general/company-settings")} className="bg-white-50">
          <ListItemIcon>
            <SettingsOutlinedIcon className="!w-4 dark:text-primary" />
          </ListItemIcon>
          <div className="text-gray-800 ">Company Settings</div>
        </MenuItem>
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate("/settings/general/audit-logs"); }} className="bg-white-50">
          <ListItemIcon>
            <HistoryOutlinedIcon className="!w-4 dark:text-primary" />
          </ListItemIcon>
          <div className="text-gray-800">Audit Logs</div>
        </MenuItem>
        <Divider className="border border-gray-200" />
        <MenuItem onClick={handleLogout} className="bg-white text-error">
          <ListItemIcon>
            <LogoutOutlinedIcon className="!w-4 dark:text-error" />
          </ListItemIcon>
          <div>Logout</div>
        </MenuItem>
      </Menu>

      {/* Theme Settings Popover */}
      <Popover
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={handleSettingsMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          "& .MuiPopover-paper": {
            backgroundColor: "transparent",
            boxShadow: "none",
          },
        }}
      >
        <ThemeSwitcher />
      </Popover>

      {/* Mini Variant Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: open ? drawerWidth : 60,
            boxSizing: "border-box",
            backgroundColor: "var(--bg-primary)",
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            overflowX: "hidden",
            borderRight: "1px solid #afb0b1",
            marginTop: "64px",
            height: "calc(100% - 64px)",
            position: "fixed",
            justifyContent: "space-between"
          },
        }}
        open={open}
      >
        <List>
          {open && (
            <Box className="p-3">
              <Box className="flex items-center gap-1 shadow-sm">
                <img src={logo} className="!w-6 !h-6 mr-2"></img>
                <Box>
                  <div className="text-gray-500 text-[10px]">Organization</div>
                  <div className="text-gray-800 font-bold text-[12px]">
                    Pinnacle Systems
                  </div>
                </Box>
              </Box>
            </Box>
          )}
          {visibleMenuItems.map((item: any, index) => (
            <Box key={`item-${index}-${item.text}`}>
              <Tooltip title={!open ? item.text : ""}>
                <ListItem disablePadding className="block whitespace-nowrap">
                  <ListItemButton
                    className={`min-h-[48px] px-2.5 text-sm ${location.pathname === item.path ||
                      location.pathname.startsWith(`${item.path}/`)
                      ? "text-primary !bg-primary-50"
                      : "text-gray-400"
                      } ${open ? "justify-start" : "justify-center"} hover:!bg-primary-50`}
                    onClick={() => {
                      if (item.children) {
                        setOpen(true);
                        if (item.text === "Attendance") {
                          setAttendanceOpen((prev) => !prev);
                          setPolicyOpen(false);
                        }
                        if (item.text === "Policy Engine") {
                          setPolicyOpen((prev) => !prev);
                          setAttendanceOpen(false);
                        }
                        return;
                      }
                      navigate(item.path);
                    }}
                  >
                    <ListItemIcon
                      className={`!min-w-0 ml-2 dark:text-primary ${open ? "mr-5" : "mr-0"
                        } w-2 justify-center`}
                      sx={{ "& svg": { fontSize: 20 } }}
                    >
                      {item.icon}
                    </ListItemIcon>

                    <ListItemText
                      primary={item.text}
                      className={open ? "opacity-100 text-gray-800" : "opacity-0"}
                      sx={{
                        "& .MuiTypography-root": {
                          fontSize: "12px",
                        },
                      }}
                    />

                    {/* {item.children &&
                      open &&
                      (attendanceOpen ? (
                        <ExpandLess fontSize="small" className="text-gray-800" />
                      ) : (
                        <ExpandMore fontSize="small" className="text-gray-800" />
                      ))} */}
                    {item.children &&
                      open &&
                      ((item.text === 'Attendance' && (attendanceOpen ? <ExpandLess fontSize="small" className="text-gray-800" /> : <ExpandMore fontSize="small" className="text-gray-800" />)) ||
                        (item.text === 'Policy Engine' && (policyOpen ? <ExpandLess fontSize="small" className="text-gray-800" /> : <ExpandMore fontSize="small" className="text-gray-800" />)))}
                  </ListItemButton>
                </ListItem>
              </Tooltip>

              {/* Sub Menu */}
              {/* Attendance Sub Menu */}
              {item.text === 'Attendance' && item.children && (
                <Collapse in={attendanceOpen && open} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child: any) => (
                      <ListItemButton
                        key={child.path}
                        sx={{ pl: 2 }}
                        className={`min-h-[40px] text-sm ${location.pathname === child.path
                          ? "text-primary !bg-primary-50"
                          : "text-gray-400"
                          }`}
                        onClick={() => navigate(child.path)}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 30,
                            color:
                              location.pathname === child.path
                                ? "#2563eb"
                                : "#9ca3af",
                          }}
                        >
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={child.text}
                          className="text-gray-800"
                          sx={{
                            "& .MuiTypography-root": {
                              fontSize: "12px",
                            },
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}

              {/* Policies Sub Menu */}
              {item.text === 'Policy Engine' && item.children && (
                <Collapse in={policyOpen && open} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((child: any) => (
                      <ListItemButton
                        key={child.path}
                        sx={{ pl: 2 }}
                        className={`min-h-[40px] text-sm ${location.pathname === child.path
                          ? "text-primary !bg-primary-50"
                          : "text-gray-400"
                          }`}
                        onClick={() => navigate(child.path)}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: 30,
                            color:
                              location.pathname === child.path
                                ? "#2563eb"
                                : "#9ca3af",
                          }}
                        >
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={child.text}
                          className="text-gray-800"
                          sx={{
                            "& .MuiTypography-root": {
                              fontSize: "12px",
                            },
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          ))}
        </List>

        <div>
          <List className="!p-0">
            {visibleBottomMenuItems.map((item: any, index) => (
              <Box key={`item-${index}-${item.text}`}>
                <Tooltip title={!open ? item.text : ""}>
                  <ListItem disablePadding className="block whitespace-nowrap">
                    <ListItemButton
                      className={`min-h-[48px] px-2.5 text-sm ${location.pathname === item.path ||
                        location.pathname.startsWith(`${item.path}/`)
                        ? "text-primary !bg-primary-50"
                        : "text-gray-400"
                        } ${open ? "justify-start" : "justify-center"} hover:!bg-primary-50`}
                      onClick={() => {
                        navigate(item.path);
                      }}
                    >
                      <ListItemIcon
                        className={`!min-w-0 ml-2 dark:text-primary ${open ? "mr-5" : "mr-0"
                          } w-2 justify-center`}
                        sx={{ "& svg": { fontSize: 20 } }}
                      >
                        {item.icon}
                      </ListItemIcon>

                      <ListItemText
                        primary={item.text}
                        className={open ? "opacity-100 text-gray-800" : "opacity-0"}
                        sx={{
                          "& .MuiTypography-root": {
                            fontSize: "12px",
                          },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              </Box>
            ))}
          </List>
          {
            open ? (
              <div className="flex items-center justify-between cursor-pointer py-3 pl-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="relative group">
                    <Avatar
                      src={user?.profilePic}
                      className="!w-8 !h-8 text-2xl cursor-pointer"
                    >
                      {avatarInitial}
                    </Avatar>
                  </div>
                  <div className="text-[12px] text-gray-800">
                    <div>{user?.roles}</div>
                    <div className="text-gray-500 text-[5px]">{user?.email}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Tooltip title="Logout" onClick={() => handleLogout()}>
                    <IconButton className={`dark:!text-primary ${open ? '!mr-1' : '!mr-4'}`}>
                      <PowerSettingsNewOutlined />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Theme" onClick={() => toggleMode()}>
                    <IconButton className={`dark:!text-primary ${open ? '!mr-1' : '!mr-4'}`}>
                      {mode === "dark" ? (
                        <LightModeOutlined className="h-5 w-5" />
                      ) : (
                        <DarkModeOutlined className="h-5 w-5" />
                      )}
                    </IconButton>
                  </Tooltip>
                </div>
                {/* <span className="text-gray-800 text-[12px]">Theme</span> */}
              </div>
            ) : (
              <div>
                <Tooltip title="Theme CTRL + D" onClick={() => toggleMode()}>
                  <IconButton className="dark:!text-primary !ml-3 !mb-4">
                    {mode === "dark" ? (
                      <LightModeOutlined className="h-5 w-5" />
                    ) : (
                      <DarkModeOutlined className="h-5 w-5" />
                    )}
                  </IconButton>
                </Tooltip>
              </div>
            )

          }
        </div>
      </Drawer>
      {/* Main Content - Only this adjusts when drawer opens/closes */}
      <Box
        component="main"
        className="min-w-0 overflow-x-hidden"
        sx={{
          flexGrow: 1,
          p: "15px",
          pb: 0,
          mt: "64px",
          backgroundColor: "var(--bg-gray-50)",
          minHeight: "calc(100vh - 64px)",
          overflowY: "auto",
          transition: (theme) =>
            theme.transitions.create("padding", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          // Add padding-left based on drawer state
          paddingLeft: open ? `${drawerWidth + 16}px` : "76px", // 65px (drawer) + 24px (padding)
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
