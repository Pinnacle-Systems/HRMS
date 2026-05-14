import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  Popover,
} from "@mui/material";
import {
  Menu as MenuIcon,
  DashboardOutlined as DashboardOutlinedIcon,
  PeopleAltOutlined as PeopleAltOutlinedIcon,
  AssignmentOutlined as AssignmentOutlinedIcon,
  AttachMoneyOutlined as AttachMoneyOutlinedIcon,
  SettingsOutlined as SettingsOutlinedIcon,
  NotificationsNoneOutlined as NotificationsNoneOutlinedIcon,
  Person4Outlined as Person4OutlinedIcon,
  LogoutOutlined as LogoutOutlinedIcon,
  ContrastOutlined as ContrastOutlinedIcon,
} from "@mui/icons-material";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { useAuth } from "../auth/authContext";
import {
  canShowNavItem,
  getDefaultRoute,
  getWorkspaceLabel,
} from "../auth/authMapper";
import type { NavItem } from "../auth/authTypes";

const drawerWidth = 180;

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const navigate = useNavigate();
  const location = useLocation();
  const { session, logout } = useAuth();
  const user = session?.user;

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
    } catch (err: any) { }
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
      text: "Leave / Attendance",
      icon: <AssignmentOutlinedIcon />,
      path: "/leave",
      roles: ["EMPLOYEE", "MANAGER", "HR", "ADMIN"],
    },
    {
      text: "Payroll",
      icon: <AttachMoneyOutlinedIcon />,
      path: "/payroll",
      roles: ["HR", "ADMIN"],
    },
    {
      text: "Settings",
      icon: <SettingsOutlinedIcon />,
      path: "/settings/general/company-settings",
      // path: `/settings/general/company-settings/${user?.tenantId}`,
      roles: ["HR", "ADMIN"],
    },
  ];

  const visibleMenuItems = user
    ? menuItems.filter((item) => canShowNavItem(user, item))
    : [];
  const avatarInitial = user?.email?.charAt(0).toUpperCase() || "U";

  const notifications = [
    { id: 1, message: "New employee joined", time: "5 min ago", read: false },
    { id: 2, message: "Task assigned to you", time: "1 hour ago", read: false },
    { id: 3, message: "Meeting at 3 PM", time: "2 hours ago", read: true },
    { id: 4, message: "Salary processed", time: "1 day ago", read: true },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

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
              <div className="w-4 h-4 bg-primary rounded-sm rotate-45"></div>
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
                <Avatar className="!w-5 !h-5 !bg-primary !text-sm">
                  {avatarInitial}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
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
            <Person4OutlinedIcon className="text-primary !w-4" />
          </ListItemIcon>
          <div className="text-sm text-gray-800 ">My Profile</div>
        </MenuItem>
        <Divider className="border border-gray-200" />
        <MenuItem onClick={handleLogout} className="bg-white">
          <ListItemIcon>
            <LogoutOutlinedIcon className="!w-4" />
          </ListItemIcon>
          <div className="text-sm text-error">Logout</div>
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
            borderRight: "1px solid #bebebe",
            marginTop: "64px",
            height: "calc(100% - 64px)",
            position: "fixed",
          },
        }}
        open={open}
      >
        <List>
          {visibleMenuItems.map((item, index) => (
            <Tooltip
              key={`item-${index}-${item.text}`}
              title={item.text}
            >
              <ListItem disablePadding className="block whitespace-nowrap">
                <ListItemButton
                  className={`min-h-[48px] px-2.5 text-sm ${location.pathname === item.path ||
                      location.pathname.startsWith(`${item.path}/`)
                      ? "text-primary !bg-primary-50"
                      : "text-gray-400"
                    } ${open ? "justify-start" : "justify-center"} hover:!bg-primary-50`}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon
                    className={`!min-w-0 ml-2 ${open ? "mr-5" : "mr-0"} w-2 dark:text-primary justify-center`}
                    sx={{ "& svg": { fontSize: 20 } }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    className={
                      open ? "opacity-100 dark:text-white" : "opacity-0"
                    }
                    sx={{
                      "& .MuiTypography-root": { fontSize: "12px" },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>
      </Drawer>

      {/* Main Content - Only this adjusts when drawer opens/closes */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: "15px",
          pb:0,
          mt: "64px",
          backgroundColor: "var(--bg-primary)",
          minHeight: "calc(100vh - 64px)",
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
