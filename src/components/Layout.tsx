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
import logo from "../assets/logo.jpg";
import {
  CloseOutlined,
  DarkModeOutlined,
  HistoryOutlined as HistoryOutlinedIcon,
  InfoOutlined,
  LightModeOutlined,
  PolicyOutlined,
  PowerSettingsNewOutlined,
  SearchOutlined,
  TrackChangesOutlined,
  ReceiptOutlined,
  WorkOutlineOutlined,
  CategoryOutlined,
  AccountBalanceOutlined,
  AttachMoney,
  PercentOutlined,
  CalendarTodayOutlined,
  AssignmentIndOutlined,
  RequestPageOutlined,
  Verified,
  AssessmentOutlined,
  ViewQuiltOutlined,
  HubOutlined,
} from "@mui/icons-material";
import Collapse from "@mui/material/Collapse";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useTheme } from "../context/themeContext";
import { Chip, MenuList, Typography } from "@mui/material";
import { companyService } from "../services/modules/company";
import { policyService } from "../services";
import { hasPermission, PAYROLL_PERMISSIONS } from "../const";
import { PERMISSIONS } from "../auth/Permissions";
import { PasswordExpiryAlert } from "./PasswordExpiryAlert";

const drawerWidth = 220;

interface Notification {
  id: string;
  policyId: string;
  versionId: string;
  notifiedBy: string;
  notifiedAt: string;
  message: string;
}

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
  const userPermissions = user?.permissions || [];

  const [attendanceOpen, setAttendanceOpen] = useState(
    location.pathname.startsWith("/attendance")
  );
  const [policyOpen, setPolicyOpen] = useState(
    location.pathname.startsWith("/policies")
  );
  const [leaveOpen, setLeaveOpen] = useState(
    location.pathname.startsWith("/leaves")
  );
  const [payrollOpen, setPayrollOpen] = useState(
    location.pathname.startsWith("/payroll")
  );
  // New states for payroll sections
  const [payrollOperationsOpen, setPayrollOperationsOpen] = useState(false);
  const [payrollConfigOpen, setPayrollConfigOpen] = useState(false);
  const [payrollAdvancedOpen, setPayrollAdvancedOpen] = useState(false);

  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<Partial<any>>({});

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
      navigate("/login");
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

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const fetchNotifications = async () => {
    try {
      setIsLoadingNotifications(true);
      const response: any = await policyService.getPolicyNotifications();
      const notificationData = response.data || [];
      setNotifications(notificationData);
      setUnreadCount(notificationData.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const markNotificationAsRead = async (_notificationId: string) => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleNotificationItemClick = (notification: Notification) => {
    if (notification.policyId) {
      navigate(`/policies/${notification.policyId}`);
    }
    markNotificationAsRead(notification.id);
    handleNotificationClose();
  };

  const formatNotificationTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  // Payroll items reorganized with headings
  const payrollOperations = [
    {
      text: "Dashboard",
      path: "/payroll",
      icon: <DashboardOutlinedIcon sx={{ fontSize: 16 }} />,
      permissions: PAYROLL_PERMISSIONS.DASHBOARD,
    },
    {
      text: "Payroll Runs",
      path: "/payroll/runs",
      icon: <ReceiptOutlined sx={{ fontSize: 16 }} />,
      permissions: PAYROLL_PERMISSIONS.RUNS,
    },
    {
      text: "Generate Payroll",
      path: "/payroll/generate",
      icon: <WorkOutlineOutlined sx={{ fontSize: 16 }} />,
      permissions: PAYROLL_PERMISSIONS.GENERATE,
    },
    {
      text: "Employee Payslips",
      path: "/payroll/payslips",
      icon: <AssignmentIndOutlined sx={{ fontSize: 16 }} />,
      permissions: PAYROLL_PERMISSIONS.PAYSLIPS,
    },
    {
      text: "Employee View",
      path: "/payroll/employee-salary",
      icon: <Person4OutlinedIcon sx={{ fontSize: 16 }} />,
      permissions: PAYROLL_PERMISSIONS.EMPLOYEE_VIEW,
    },
  ];

  const payrollConfiguration = [
    {
      text: "Salary Components",
      path: "/payroll/components",
      icon: <CategoryOutlined sx={{ fontSize: 16 }} />,
      permissions: PAYROLL_PERMISSIONS.COMPONENTS,
    },
    {
      text: "Salary Structure",
      path: "/payroll/structures",
      icon: <AccountBalanceOutlined sx={{ fontSize: 16 }} />,
      permissions: PAYROLL_PERMISSIONS.STRUCTURES,
    },
    {
      text: "Assign Salary",
      path: "/payroll/assign",
      icon: <AttachMoney sx={{ fontSize: 16 }} />,
      permissions: PAYROLL_PERMISSIONS.ASSIGN,
    },
    {
      text: "Deductions",
      path: "/payroll/deductions",
      icon: <PercentOutlined sx={{ fontSize: 16 }} />,
      permissions: PAYROLL_PERMISSIONS.DEDUCTIONS,
    },
    {
      text: "Payroll Periods",
      path: "/payroll/periods",
      icon: <CalendarTodayOutlined sx={{ fontSize: 16 }} />,
      permissions: PAYROLL_PERMISSIONS.PERIODS,
    },
  ];

  const payrollAdvanced = [
    {
      text: "Loan/Advance Request",
      path: "/payroll/loan-advance-request",
      icon: <RequestPageOutlined />,
      permissions: PAYROLL_PERMISSIONS.LOAN_ADVANCE,
    },
    {
      text: "Statutory Compliance",
      path: "/payroll/compliance",
      icon: <Verified />,
      permissions: PAYROLL_PERMISSIONS.STATUTORY,
    },
    {
      text: "Bank Advice",
      path: "/payroll/bank-advice",
      icon: <AccountBalanceOutlined />,
      permissions: PAYROLL_PERMISSIONS.BANK_ADVICE,
    },
    {
    text: "Payroll Reports",
    path: "/payroll/reports",
    icon: <AssessmentOutlined />,
    permissions: PAYROLL_PERMISSIONS.REPORTS,
  },
  {
    text: "Audit Logs",
    path: "/payroll/audit",
    icon: <HistoryOutlinedIcon />,
    permissions: PAYROLL_PERMISSIONS.AUDIT,
  },
  {
    text: "Employee Portal",
    path: "/payroll/employee-portal",
    icon: <ViewQuiltOutlined />,
    permissions: PAYROLL_PERMISSIONS.PORTAL,
  },
  ];

  const filteredPayrollOperations = payrollOperations.filter(item =>
    hasPermission(userPermissions, item.permissions)
  );

  const filteredPayrollConfiguration = payrollConfiguration.filter(item =>
    hasPermission(userPermissions, item.permissions)
  );

  const filteredPayrollAdvanced = payrollAdvanced.filter(item =>
    hasPermission(userPermissions, item.permissions)
  );
  

  const menuItems: NavItem[] = [
    {
      text: "Home",
      icon: <DashboardOutlinedIcon />,
      path: user ? getDefaultRoute(user) : "/home",
      roles: ["EMPLOYEE", "MANAGER", "HR", "ADMIN"],
    },
    {
      text: "My Info",
      icon: <InfoOutlined />,
      path: "/my-info",
      roles: ["EMPLOYEE", "MANAGER", "HR"],
    },
    {
      text: "Employees",
      icon: <PeopleAltOutlinedIcon />,
      path: "/employees",
      roles: ["HR", "ADMIN"],
      permissions: [PERMISSIONS.EMPLOYEE_READ],
    },
    {
      text: "Leave",
      icon: <AssignmentOutlinedIcon />,
      path: user?.roles.includes('ADMIN') ? "/leaves/approvals" : "/leaves/my-dashboard",
      roles: ["EMPLOYEE", "MANAGER", "HR", "ADMIN"],
      children: [
        ...(user?.roles.some((role) => role !== "ADMIN")
          ? [{ text: "My Leave", path: "/leaves/my-dashboard" }]
          : []),
        ...(user?.roles.some((role) => role === "MANAGER" || role === "ADMIN")
          ? [{ text: "Manager Approvals", path: "/leaves/approvals" }]
          : []),
        ...(user?.roles.some((role) => role === "HR" || role === "ADMIN")
          ? [{ text: "HR Requests", path: "/leaves/hr/requests" }]
          : []),
        ...(user?.roles.includes("ADMIN")
          ? [{ text: "Leave Settings", path: "/leaves/admin/leave-types" }]
          : []),
      ],
    },
    {
      text: "Attendance",
      icon: <TrackChangesOutlined />,
      path: "/attendance",
      roles: ["HR", "ADMIN"],
      // permissions: [PERMISSIONS.ATTENDANCE_READ],
      children: [
        {
          text: "Shift Management",
          path: "/attendance/shifts",
        },
        {
          text: "Attendance Overview",
          path: "/attendance/overview",
        },
        {
          text: "Attendance Records",
          path: "/attendance/records",
        },
        {
          text: "Attendance Management",
          path: "/attendance/management",
        },
        {
          text: "Attendance Processing",
          path: "/attendance/process",
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
      // permissions: [PERMISSIONS.PAYROLL_READ],
      isPayroll: true,
    },
    {
      text: "Policy Engine",
      icon: <PolicyOutlined />,
      path: "/policies",
      roles: ["HR", "ADMIN"],
      // permissions: [PERMISSIONS.POLICY_READ],
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
      path: user?.roles.includes('ADMIN') ? "/settings/general/company-settings" : "/settings/general/audit-logs",
      roles: ["HR", "ADMIN"],
      // permissions: [PERMISSIONS.SETTINGS_READ],
    },
    {
      text: "Help",
      icon: <HelpOutlineTwoTone />,
      path: "/documentation",
      roles: ["EMPLOYEE", "MANAGER", "HR", "ADMIN"],
    },
  ];

  const visibleMenuItems = user
    ? menuItems.filter((item) => canShowNavItem(user, item))
    : [];
  const visibleBottomMenuItems = user
    ? menuBottomItems.filter((item) => canShowNavItem(user, item))
    : [];
  const avatarInitial = user?.email?.charAt(0).toUpperCase() || "U";

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
    if (user?.roles.includes('ADMIN')) {
      fetchCompanyData();
    } else {
      setCompanyInfo(session?.company || {});
    }
    fetchNotifications();
  }, []);

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
            </IconButton>
            <Box className="flex items-center gap-2">
              <img src={companyInfo.logoUrl} alt="company_logo" width="30px" />
              <div>
                <div className="font-bold text-gray-700">
                  Dot<span className="text-primary">HR</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="text-[12px] text-gray-800">{companyInfo.companyName}</div>
                  {user && (
                    <div className="text-[10px] text-gray-400 leading-3">
                      {getWorkspaceLabel(user)}
                    </div>
                  )}
                </div>
              </div>
            </Box>
          </Box>

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
                onClick={handleNotificationClick}
              >
                <Badge badgeContent={unreadCount} className="text-primary">
                  <NotificationsNoneOutlinedIcon className="text-gray-500 !w-5" />
                </Badge>
              </IconButton>
            </Tooltip>
              {/* <Tooltip title="Notifications"><IconButton><Badge badgeContent={3} color="error"><NotificationsIcon /></Badge></IconButton></Tooltip> */}

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
          <div className="text-gray-800">My Profile</div>
        </MenuItem>
        {user?.roles.includes("ADMIN") && (
          <MenuItem onClick={() => { navigate("/settings/general/company-settings");handleProfileMenuClose(); }} className="bg-white-50">
            <ListItemIcon>
              <SettingsOutlinedIcon className="!w-4 dark:text-primary" />
            </ListItemIcon>
            <div className="text-gray-800">Company Settings</div>
          </MenuItem>
        )}
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate("/branch-fiscal-year"); }} className="bg-white-50">
          <ListItemIcon>
            <HubOutlined className="!w-3 dark:text-primary" />
          </ListItemIcon>
          <div className="text-gray-800">Select Workspace</div>
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

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        keepMounted
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationClose}
        sx={{
          '& .MuiPaper-root': {
            maxHeight: "450px !important",
            width: "500px !important",
            p: 0,
            overflow: 'hidden',
            borderRadius: 2,
          }
        }}
      >
        <Box sx={{
          p: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }} className="border-b border-gray-200">
          <Typography variant="subtitle1" className="!ml-2" sx={{ fontWeight: 'bold' }}>
            Notifications
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {notifications.length > 0 && (
              <Typography
                variant="caption"
                sx={{
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
                className="text-primary"
                onClick={() => {
                  setUnreadCount(0);
                }}
              >
                Mark all as read
              </Typography>
            )}
            <IconButton size="small" onClick={handleNotificationClose}>
              <CloseOutlined fontSize="small" className="text-gray-800" />
            </IconButton>
          </Box>
        </Box>

        {isLoadingNotifications ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Loading notifications...
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsNoneOutlinedIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <MenuList sx={{ p: 0, overflow: 'auto', maxHeight: "calc(100vh - 525px) !important" }}>
            {notifications.map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationItemClick(notification)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  p: 2,
                  '&:hover': {
                    backgroundColor: 'var(--head) !important',
                  },
                  '&:last-child': {
                    borderBottom: 'none',
                  }
                }}
                className="!border-b !border-gray-200"
              >
                <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 0.5 }}>
                  <ListItemText
                    primary={
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {notification.message.toLowerCase().includes('policy') ? 'Policy' : 'New'} Update
                      </Typography>
                    }
                    secondary={
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {notification.message}
                      </Typography>
                    }
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mt: 0.5 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="caption" color="primary" sx={{ cursor: 'pointer' }}>
                      View Details
                    </Typography>
                    {notification.message.toLowerCase().includes('policy') && (
                      <Chip
                        label="Policy"
                        size="small"
                        color="primary"
                        variant="filled"
                        className="!bg-primary"
                        sx={{ fontSize: '10px', height: 20 }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {formatNotificationTime(notification.notifiedAt)}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </MenuList>
        )}

        {notifications.length > 0 && (
          <Box sx={{
            p: 1.5,
            textAlign: 'center',
          }} className="border-t border-gray-200">
            <Typography
              variant="caption"
              className="text-primary"
              sx={{
                cursor: 'pointer',
                fontWeight: 500,
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => {
                handleNotificationClose();
              }}
            >
              View all notifications
            </Typography>
          </Box>
        )}
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
            justifyContent: "space-between",
          },
        }}
        open={open}
      >
        <List className="!pb-0">
          {open && (
            <Box className="px-3 py-1">
              <Box className="flex items-center gap-1 shadow-sm">
                <img src={logo} className="!w-6 !h-6 mr-2" alt="logo" />
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
              {item.isPayroll ? (
                // Special rendering for Payroll with expandable sections
                <>
                  {/* Payroll Parent Item */}
                  <Tooltip title={!open ? "Payroll" : ""}>
                    <ListItem disablePadding className="block whitespace-nowrap">
                      <ListItemButton
                        className={`min-h-[30px] px-2.5 py-1 text-sm ${location.pathname.startsWith("/payroll")
                          ? "text-primary !bg-primary-50"
                          : "text-gray-400"
                          } ${open ? "justify-start" : "justify-center"} hover:!bg-primary-50`}
                        onClick={() => {
                          setOpen(true);
                          setPayrollOpen((prev) => !prev);
                          setAttendanceOpen(false);
                          setPolicyOpen(false);
                          setLeaveOpen(false);
                          setPayrollOperationsOpen(false);
                          setPayrollConfigOpen(false);
                        }}
                      >
                        <ListItemIcon
                          className={`!min-w-0 ml-2 dark:text-primary ${open ? "mr-5" : "mr-0"
                            } w-2 justify-center`}
                          sx={{ "& svg": { fontSize: 20 } }}
                        >
                          <AttachMoneyOutlinedIcon />
                        </ListItemIcon>
                        <ListItemText
                          primary="Payroll"
                          className={open ? "opacity-100 text-gray-800" : "opacity-0"}
                          sx={{
                            "& .MuiTypography-root": {
                              fontSize: "12px",
                            },
                          }}
                        />
                        {open && (payrollOpen ? (
                          <ExpandLess fontSize="small" className="text-gray-800" />
                        ) : (
                          <ExpandMore fontSize="small" className="text-gray-800" />
                        ))}
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>

                  {/* Payroll Sub Menu with Expandable Sections */}
                  {open && (
                    <Collapse in={payrollOpen} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {/* PAYROLL OPERATIONS Section */}
                        <ListItemButton
                          sx={{
                            pl: 1.5,
                            pr: 1,
                            minHeight: '28px',
                          }}
                          className="hover:!bg-transparent"
                          onClick={() => { setPayrollOperationsOpen((prev) => !prev); setPayrollConfigOpen(false); setPayrollAdvancedOpen(false) }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 24,
                              color: "#9ca3af",
                            }}
                          >
                            {payrollOperationsOpen ? (
                              <ExpandLess sx={{ fontSize: 16 }} />
                            ) : (
                              <ExpandMore sx={{ fontSize: 16 }} />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary="PAYROLL OPERATIONS"
                            className="!mt-0 !mb-0"
                            sx={{
                              "& .MuiTypography-root": {
                                fontSize: "10px",
                                fontWeight: 600,
                                color: "#9ca3af",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              },
                            }}
                          />
                        </ListItemButton>

                        <Collapse in={payrollOperationsOpen} timeout="auto" unmountOnExit>
                          {filteredPayrollOperations.map((child) => (
                            <ListItemButton
                              key={child.path}
                              sx={{ pl: 4 }}
                              className={`min-h-[32px] text-sm ${location.pathname === child.path ||
                                (child.path === "/payroll" && location.pathname === "/payroll")
                                ? "text-primary !bg-primary-50"
                                : "text-gray-400"
                                }`}
                              onClick={() => navigate(child.path)}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: 28,
                                  color:
                                    location.pathname === child.path ||
                                      (child.path === "/payroll" && location.pathname === "/payroll")
                                      ? "var(--color-primary)"
                                      : "#9ca3af",
                                }}
                              >
                                {child.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={child.text}
                                className="!mt-0 !mb-0 text-gray-800"
                                sx={{
                                  "& .MuiTypography-root": {
                                    fontSize: "12px",
                                  },
                                }}
                              />
                            </ListItemButton>
                          ))}
                        </Collapse>

                        {/* CONFIGURATION Section */}
                        <ListItemButton
                          sx={{
                            pl: 1.5,
                            pr: 1,
                            minHeight: '28px',
                            mt: 0.5,
                          }}
                          className="hover:!bg-transparent"
                          onClick={() => { setPayrollConfigOpen((prev) => !prev); setPayrollOperationsOpen(false); setPayrollAdvancedOpen(false) }}
                        >
                          <ListItemIcon
                            sx={{
                              minWidth: 24,
                              color: "#9ca3af",
                            }}
                          >
                            {payrollConfigOpen ? (
                              <ExpandLess sx={{ fontSize: 16 }} />
                            ) : (
                              <ExpandMore sx={{ fontSize: 16 }} />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary="CONFIGURATION"
                            className="!mt-0 !mb-0"
                            sx={{
                              "& .MuiTypography-root": {
                                fontSize: "10px",
                                fontWeight: 600,
                                color: "#9ca3af",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              },
                            }}
                          />
                        </ListItemButton>

                        <Collapse in={payrollConfigOpen} timeout="auto" unmountOnExit>
                          {filteredPayrollConfiguration.map((child) => (
                            <ListItemButton
                              key={child.path}
                              sx={{ pl: 4 }}
                              className={`min-h-[32px] text-sm ${location.pathname === child.path
                                ? "text-primary !bg-primary-50"
                                : "text-gray-400"
                                }`}
                              onClick={() => navigate(child.path)}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: 28,
                                  color:
                                    location.pathname === child.path
                                      ? "var(--color-primary)"
                                      : "#9ca3af",
                                }}
                              >
                                {child.icon}
                              </ListItemIcon>
                              <ListItemText
                                primary={child.text}
                                className="!mt-0 !mb-0 text-gray-800"
                                sx={{
                                  "& .MuiTypography-root": {
                                    fontSize: "12px",
                                  },
                                }}
                              />
                            </ListItemButton>
                          ))}
                        </Collapse>

                        {/* ADVANCED FEATURES Section */}
                        <ListItemButton
                          sx={{ pl: 1.5, pr: 1, minHeight: '28px', mt: 0.5 }}
                          className="hover:!bg-transparent"
                          onClick={() => { setPayrollAdvancedOpen((prev) => !prev); setPayrollOperationsOpen(false); setPayrollConfigOpen(false); }}
                        >
                          <ListItemIcon sx={{ minWidth: 24, color: "#9ca3af" }}>
                            {payrollAdvancedOpen ? (
                              <ExpandLess sx={{ fontSize: 16 }} />
                            ) : (
                              <ExpandMore sx={{ fontSize: 16 }} />
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary="ADVANCED FEATURES"
                            sx={{
                              "& .MuiTypography-root": {
                                fontSize: "10px",
                                fontWeight: 600,
                                color: "#9ca3af",
                                textTransform: "uppercase",
                                letterSpacing: "0.5px",
                              },
                            }}
                          />
                        </ListItemButton>

                        <Collapse in={payrollAdvancedOpen} timeout="auto" unmountOnExit>
                          {filteredPayrollAdvanced.map((child) => (
                            <ListItemButton
                              key={child.path}
                              sx={{ pl: 4 }}
                              className={`min-h-[32px] text-sm ${location.pathname === child.path
                                ? "text-primary !bg-primary-50"
                                : "text-gray-400"
                                }`}
                              onClick={() => navigate(child.path)}
                            >
                              <ListItemIcon
                                sx={{
                                  minWidth: 28,
                                  color:
                                    location.pathname === child.path
                                      ? "var(--color-primary)"
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
                        </Collapse>
                      </List>
                    </Collapse>
                  )}
                </>
              ) : (
                // Regular menu item rendering
                <>
                  <Tooltip title={!open ? item.text : ""}>
                    <ListItem disablePadding className="block whitespace-nowrap">
                      <ListItemButton
                        className={`min-h-[30px] px-2.5 py-1 text-sm ${location.pathname === item.path ||
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
                              setLeaveOpen(false);
                              setPayrollOpen(false);
                            }
                            if (item.text === "Policy Engine") {
                              setPolicyOpen((prev) => !prev);
                              setAttendanceOpen(false);
                              setLeaveOpen(false);
                              setPayrollOpen(false);
                            }
                            if (item.text === "Leave") {
                              setLeaveOpen((prev) => !prev);
                              setAttendanceOpen(false);
                              setPolicyOpen(false);
                              setPayrollOpen(false);
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
                        {item.children &&
                          open &&
                          ((item.text === 'Attendance' && (attendanceOpen ? <ExpandLess fontSize="small" className="text-gray-800" /> : <ExpandMore fontSize="small" className="text-gray-800" />)) ||
                            (item.text === 'Policy Engine' && (policyOpen ? <ExpandLess fontSize="small" className="text-gray-800" /> : <ExpandMore fontSize="small" className="text-gray-800" />)) ||
                            (item.text === 'Leave' && (leaveOpen ? <ExpandLess fontSize="small" className="text-gray-800" /> : <ExpandMore fontSize="small" className="text-gray-800" />)))}
                      </ListItemButton>
                    </ListItem>
                  </Tooltip>

                  {/* Sub Menus for other items */}
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
                              className="!mt-0 !mb-0 text-gray-800"
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
                              className="!mt-0 !mb-0 text-gray-800"
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

                  {item.text === 'Leave' && item.children && (
                    <Collapse in={leaveOpen && open} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {item.children.map((child: any) => (
                          <ListItemButton
                            key={child.path}
                            sx={{ pl: 2 }}
                            className={`min-h-[40px] text-sm ${location.pathname === child.path
                              ? "!bg-primary-50"
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
                              className="!mt-0 !mb-0 text-gray-800"
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
                </>
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
          {open ? (
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
          )}
        </div>
      </Drawer>

      {/* Main Content */}
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
          paddingLeft: open ? `${drawerWidth + 16}px` : "76px",
        }}
      >
        <PasswordExpiryAlert />
        <Outlet />
      </Box>
    </Box>
  );
}