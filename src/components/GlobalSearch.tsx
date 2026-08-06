import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";

import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import TrackChangesOutlined from "@mui/icons-material/TrackChanges";
import PolicyOutlined from "@mui/icons-material/PolicyOutlined";
import KeyboardReturnOutlined from "@mui/icons-material/KeyboardReturnOutlined";
import { AdjustOutlined, BalanceOutlined, BarChartOutlined, CalendarMonthOutlined, CalendarTodayOutlined, CalendarViewDayOutlined, CategoryOutlined, EditDocument, EventOutlined, FingerprintOutlined, MonetizationOnOutlined, PasswordOutlined, ReceiptLong, RemoveCircleOutlined, ReportOutlined, RequestQuoteOutlined, ReviewsOutlined, SummarizeOutlined } from "@mui/icons-material";
import { useAuth } from "../auth/authContext";

interface SearchItem {
  label: string;
  description?: string;
  path: string;
  category: string;
  icon: React.ReactNode;
  keywords?: string[];
  roles: string[];
}

const ALL_ITEMS: SearchItem[] = [
  {
    label: "Home",
    description: "Main dashboard overview",
    path: "/home",
    category: "Navigation",
    icon: <DashboardOutlinedIcon fontSize="small" />,
    keywords: ["dashboard", "overview", "home"],
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Employees",
    description: "Manage employee records",
    path: "/employees",
    category: "Navigation",
    icon: <PeopleAltOutlinedIcon fontSize="small" />,
    keywords: ["staff", "people", "team", "hr"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Leave Dashboard",
    description: "My leave overview and balances",
    path: "/leaves/my-dashboard",
    category: "Leave",
    icon: <AssignmentOutlinedIcon fontSize="small" />,
    keywords: ["time off", "vacation", "absence", "leave"],
    roles: ["HR", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Apply Leave",
    description: "Submit a new leave request",
    path: "/leaves/apply",
    category: "Leave",
    icon: <AssignmentOutlinedIcon fontSize="small" />,
    keywords: ["request", "apply", "leave", "absence"],
    roles: ["HR", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "My Leave Requests",
    description: "View and track your leave requests",
    path: "/leaves/my-requests",
    category: "Leave",
    icon: <AssignmentOutlinedIcon fontSize="small" />,
    keywords: ["leave", "requests", "history"],
    roles: ["HR", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Leave Approvals",
    description: "Manager leave approval queue",
    path: "/leaves/approvals",
    category: "Leave",
    icon: <AssignmentOutlinedIcon fontSize="small" />,
    keywords: ["approve", "manager", "leave", "requests"],
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Holiday Calendar",
    description: "View public holidays and company events",
    path: "/leaves/holiday-calendar",
    category: "Leave",
    icon: <AssignmentOutlinedIcon fontSize="small" />,
    keywords: ["calendar", "holidays", "public"],
    roles: ["HR", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Comp Offs",
    description: "Compensatory off management",
    path: "/leaves/comp-offs",
    category: "Leave",
    icon: <AssignmentOutlinedIcon fontSize="small" />,
    keywords: ["compensatory", "comp off", "overtime"],
    roles: ["HR", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Team Calendar",
    description: "See who is on leave across your team",
    path: "/leaves/team-calendar",
    category: "Leave",
    icon: <CalendarMonthOutlined fontSize="small" />,
    keywords: ["calendar", "team", "leave"],
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "Team Summary",
    description: "Leave counts and day totals across your team",
    path: "/leaves/team-summary",
    category: "Leave",
    icon: <SummarizeOutlined fontSize="small" />,
    keywords: ["summary", "team", "leave"],
    roles: ["ADMIN", "MANAGER"],
  },
  {
    label: "HR Requests",
    description: "HR-wide leave request administration and comp-off approvals",
    path: "/leaves/hr/requests",
    category: "Leave",
    icon: <RequestQuoteOutlined fontSize="small" />,
    keywords: ["request", "hr", "leave"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Leave Balances",
    description: "Review balances and ledger history for any employee",
    path: "/leaves/hr/balances",
    category: "Leave",
    icon: <BalanceOutlined fontSize="small" />,
    keywords: ["balance", "hr", "leave"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Leave Adjustments",
    description: "Manually credit or debit an employee's leave balance",
    path: "/leaves/hr/adjustments",
    category: "Leave",
    icon: <AdjustOutlined fontSize="small" />,
    keywords: ["adjustments", "hr", "leave"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "LOP Review",
    description: "Review pending requests and convert insufficient-balance leave to loss of pay",
    path: "/leaves/hr/lop-review",
    category: "Leave",
    icon: <ReviewsOutlined fontSize="small" />,
    keywords: ["lop", "review", "hr", "leave"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Payroll Inputs",
    description: "Leave-related payroll inputs and monthly rollups",
    path: "/leaves/hr/payroll-inputs",
    category: "Leave",
    icon: <ReviewsOutlined fontSize="small" />,
    keywords: ["payroll", "inputs", "hr", "leave", "encashments", "settlements"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Upcoming Events",
    description: "View your upcoming approved leaves and company holidays",
    path: "/leaves/hr/upcoming-events",
    category: "Leave",
    icon: <EventOutlined fontSize="small" />,
    keywords: ["event", "upcoming", "hr", "leave"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Leave Reports",
    path: "/leaves/hr/reports",
    category: "Leave",
    icon: <ReportOutlined fontSize="small" />,
    keywords: ["reports", "dashboard", "hr", "leave", "analytics", "anniversary", "birthday", "joiners", "resignation", "events"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Leave Types",
    path: "/leaves/admin/leave-types",
    category: "Leave",
    icon: <CategoryOutlined fontSize="small" />,
    keywords: ["types", "list", "admin", "leave"],
    roles: ["ADMIN"],
  },
  {
    label: "Holiday Calendars",
    path: "/leaves/admin/holiday-calendars",
    category: "Leave",
    icon: <CalendarTodayOutlined fontSize="small" />,
    keywords: ["holiday", "calendar", "admin", "leave"],
    roles: ["ADMIN"],
  },
  {
    label: "Work Calendars",
    path: "/leaves/admin/work-calendars",
    category: "Leave",
    icon: <CalendarViewDayOutlined fontSize="small" />,
    keywords: ["work", "calendar", "admin", "leave"],
    roles: ["ADMIN"],
  },
  {
    label: "Run Accrual",
    path: "/leaves/admin/workflows",
    category: "Leave",
    icon: <CategoryOutlined fontSize="small" />,
    keywords: ["run", "accrual", "workflow", "admin", "leave"],
    roles: ["ADMIN"],
  },
  {
    label: "Shift Management",
    description: "View and manage work shifts",
    path: "/attendance/shifts",
    category: "Attendance",
    icon: <TrackChangesOutlined fontSize="small" />,
    keywords: ["shift", "schedule", "roster"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Attendance Overview",
    description: "View real-time attendance summary, today's leave status, and holiday calendar",
    path: "/attendance/overview",
    category: "Attendance",
    icon: <DashboardOutlinedIcon fontSize="small" />,
    keywords: ["attendance", "summary", "leave today", "today", "holiday"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Attendance Records",
    description: "Access and manage daily, detailed, muster, and employee-wise attendance records",
    path: "/attendance/records",
    category: "Attendance",
    icon: <BarChartOutlined fontSize="small" />,
    keywords: ["attendance", "records", "muster", "register", "view"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Attendance Process",
    description: "Employee attendance records",
    path: "/attendance/process",
    category: "Attendance",
    icon: <TrackChangesOutlined fontSize="small" />,
    keywords: ["attendance", "check-in", "check-out", "consolidate", "process", "finalisation", "lock"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Attendance Management",
    description: "Handle corrections, remote check-ins, Device, OT & LOP",
    path: "/attendance/management",
    category: "Attendance",
    icon: <FingerprintOutlined fontSize="small" />,
    keywords: ["attendance", "device", "corrections", "lop", "overtime", "ot", "lop", "biometric", "sync"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Attendance Reports",
    description: "Generate attendance reports",
    path: "/attendance/reports",
    category: "Attendance",
    icon: <TrackChangesOutlined fontSize="small" />,
    keywords: ["attendance", "report", "analytics"],
    roles: ["ADMIN", "HR"],
  },
  // {
  //   label: "Shift Roster",
  //   description: "View shift roster",
  //   path: "/attendance/shift-roster",
  //   category: "Attendance",
  //   icon: <TrackChangesOutlined fontSize="small" />,
  //   keywords: ["roster", "shift", "schedule"],
  // },
  // {
  //   label: "Shift Rotation",
  //   description: "Configure shift rotations",
  //   path: "/attendance/shift-rotation",
  //   category: "Attendance",
  //   icon: <TrackChangesOutlined fontSize="small" />,
  //   keywords: ["rotation", "shift", "cycle"],
  // },
  // {
  //   label: "Shift Schedule View",
  //   description: "Calendar view of shift schedules",
  //   path: "/attendance/shift-schedule",
  //   category: "Attendance",
  //   icon: <TrackChangesOutlined fontSize="small" />,
  //   keywords: ["schedule", "calendar", "shift"],
  // },
  // {
  //   label: "Shift Swap Requests",
  //   description: "Manage shift swap requests",
  //   path: "/attendance/shift-swap-requests",
  //   category: "Attendance",
  //   icon: <TrackChangesOutlined fontSize="small" />,
  //   keywords: ["swap", "exchange", "shift"],
  // },
  {
    label: "Payroll",
    description: "Payroll processing and reports",
    path: "/payroll",
    category: "Payroll",
    icon: <AttachMoneyOutlinedIcon fontSize="small" />,
    keywords: ["salary", "pay", "compensation", "payslip"],
    roles: ["ADMIN"],
  },
  {
    label: "Policy Dashboard",
    description: "View and manage all policies",
    path: "/policies",
    category: "Policy Engine",
    icon: <PolicyOutlined fontSize="small" />,
    keywords: ["policy", "rules", "engine"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Policy Simulator",
    description: "Simulate and test policy rules",
    path: "/policies/simulator",
    category: "Policy Engine",
    icon: <PolicyOutlined fontSize="small" />,
    keywords: ["simulate", "test", "policy", "preview"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Policy Reports",
    description: "nsights across policy assignments, simulations, conflicts and audit activity",
    path: "/policies/reports",
    category: "Policy Engine",
    icon: <ReportOutlined fontSize="small" />,
    keywords: ["reports", "analytics", "policy", "preview"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Company Settings",
    description: "Manage company-wide configuration",
    path: "/settings/general/company-settings",
    category: "Settings",
    icon: <SettingsOutlinedIcon fontSize="small" />,
    keywords: ["company", "settings", "configuration", "fiscal", "years"],
    roles: ["ADMIN"],
  },
  {
    label: "Branch Settings",
    description: "Configure branch offices",
    path: "/settings/general/branch-settings",
    category: "Settings",
    icon: <SettingsOutlinedIcon fontSize="small" />,
    keywords: ["branch", "office", "location"],
    roles: ["ADMIN"],
  },
  {
    label: "Password Config",
    description: "Configure authentication and password security settings",
    path: "/settings/general/password-config",
    category: "Settings",
    icon: <PasswordOutlined fontSize="small" />,
    keywords: ["password", "config", "rules"],
    roles: ["ADMIN"],
  },
  {
    label: "Audit Logs",
    description: "View system audit trail",
    path: "/settings/general/audit-logs",
    category: "Settings",
    icon: <SettingsOutlinedIcon fontSize="small" />,
    keywords: ["audit", "logs", "history", "activity"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Department Settings",
    description: "Manage departments and teams",
    path: "/settings/employee/department-settings",
    category: "Settings",
    icon: <SettingsOutlinedIcon fontSize="small" />,
    keywords: ["department", "team", "org"],
    roles: ["ADMIN"],
  },
  {
    label: "Categories",
    description: "Manage categories with items",
    path: "/settings/employee/category-settings",
    category: "Settings",
    icon: <CategoryOutlined fontSize="small" />,
    keywords: ["category", "items", "org"],
    roles: ["ADMIN"],
  },
  {
    label: "Onboarding Settings",
    description: "Configure employee onboarding process",
    path: "/settings/employee/onboarding-process",
    category: "Settings",
    icon: <SettingsOutlinedIcon fontSize="small" />,
    keywords: ["onboarding", "new hire", "joining"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Payroll Settings",
    description: "Configure payroll rules and deductions",
    path: "/settings/payroll-settings",
    category: "Settings",
    icon: <SettingsOutlinedIcon fontSize="small" />,
    keywords: ["payroll", "salary", "deduction", "settings"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "My Profile",
    description: "View and update your profile",
    path: "/profile",
    category: "Account",
    icon: <PeopleAltOutlinedIcon fontSize="small" />,
    keywords: ["profile", "account", "personal", "me"],
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
  },
  {
    label: "Allowance Master",
    description: "Manage your allowances and benefits",
    path: "/settings/policy/allowance-components",
    category: "Master",
    icon: <MonetizationOnOutlined fontSize="small" />,
    keywords: ["allowance", "benefits", "perks", "compensation", "payroll"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Deduction Master",
    description: "View your salary deductions and contributions",
    path: "/settings/policy/deduction-components",
    category: "Master",
    icon: <RemoveCircleOutlined fontSize="small" />,
    keywords: ["deduction", "tax", "contributions", "salary", "payroll"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Expense Category Master",
    description: "Manage expense categories for claims",
    path: "/settings/policy/expense-category",
    category: "Master",
    icon: <ReceiptLong fontSize="small" />,
    keywords: ["expense", "category", "claims", "reimbursement", "settings"],
    roles: ["ADMIN", "HR"],
  },
  {
    label: "Documentation",
    description: "Guide to use the app",
    path: "/documentation",
    category: "Documentation",
    icon: <EditDocument fontSize="small" />,
    keywords: ["doc", "help", "documentation"],
    roles: ["ADMIN", "HR", "EMPLOYEE", "MANAGER"],
  },
   {
    label: "User Management",
    description: "Manage user accounts and permissions",
    path: "/user-management",
    category: "Account",
    icon: <PeopleAltOutlinedIcon fontSize="small" />,
    keywords: ["user", "account", "permission", "management"],
    roles: ["ADMIN", "HR"],
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  Navigation: "#0288d1",
  Leave: "#2e7d32",
  Attendance: "#ed6c02",
  Payroll: "#af1d03",
  "Policy Engine": "#9c27b0",
  Settings: "#03af98",
  Account: "#1976d2",
  Master: "#df9a07",
  Documentation: "#df075a"
};

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { session } = useAuth();
  const userRole = session?.user.roles || [];

  const search = useCallback((q: string) => {
    if (!q.trim()) {
      setResults([]);
      setActiveIndex(0);
      return;
    }
    const lower = q.toLowerCase();
    const filtered = ALL_ITEMS.filter(
      (item) => {
        const hasAccess = userRole.some((role: string) =>
          item.roles.includes(role)
        );
        const matchesSearch =
          item.label.toLowerCase().includes(lower) ||
          item.description?.toLowerCase().includes(lower) ||
          item.category.toLowerCase().includes(lower) ||
          item.keywords?.some((k) => k.includes(lower));

        return hasAccess && matchesSearch;
      }
    );
    setResults(filtered);
    setActiveIndex(0);
  }, [userRole]);

  useEffect(() => {
    search(query);
  }, [query, search]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleSelect = (item: SearchItem) => {
    navigate(item.path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  const grouped = results.reduce<Record<string, SearchItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const flatIndexMap: number[] = [];
  Object.values(grouped).forEach((items) =>
    items.forEach(() => flatIndexMap.push(flatIndexMap.length))
  );

  let flatCounter = 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    // PaperProps={{
    //   sx: {
    //     borderRadius: 2,
    //     mt: "80px",
    //     verticalAlign: "top",
    //     maxHeight: "70vh",
    //   },
    // }}
    // TransitionProps={{ timeout: 150 }}
    >
      <DialogContent sx={{ p: 2 }}>
        <div className="text-gray-500 mb-2 text-[12px]">Global Search</div>
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Search pages, features, settings..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          variant="outlined"
        // InputProps={{
        //   startAdornment: (
        //     <InputAdornment position="start">
        //       <SearchOutlined className="text-gray-400" />
        //     </InputAdornment>
        //   ),
        //   sx: {
        //     borderRadius: "8px 8px 0 0",
        //     "& fieldset": { border: "none" },
        //     borderBottom: "1px solid",
        //     borderColor: "divider",
        //     px: 2,
        //     py: 0.5,
        //     fontSize: 14,
        //   },
        // }}
        />

        {!query && (
          <Box className="py-8 text-center">
            <Typography variant="body2" className="text-gray-400">
              Start typing to search pages and features
            </Typography>
            <Box className="flex items-center justify-center gap-4 mt-4">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-mono">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-mono">Esc</kbd>
                close
              </span>
            </Box>
          </Box>
        )}

        {query && results.length === 0 && (
          <Box className="py-8 text-center">
            <Typography variant="body2" className="text-gray-400">
              No results for &ldquo;<strong>{query}</strong>&rdquo;
            </Typography>
          </Box>
        )}

        {results.length > 0 && (
          <Box sx={{ maxHeight: "calc(70vh - 70px)", overflowY: "auto" }}>
            {Object.entries(grouped).map(([category, items], catIdx) => (
              <Box key={category}>
                {catIdx > 0 && <Divider />}
                <Typography
                  variant="caption"
                  className="text-gray-400 font-semibold uppercase tracking-wider"
                  sx={{ px: 2, pt: 1.5, pb: 0.5, display: "block" }}
                >
                  {category}
                </Typography>
                <List dense disablePadding>
                  {items.map((item) => {
                    const itemIndex = flatCounter++;
                    const isActive = itemIndex === activeIndex;
                    return (
                      <ListItem key={item.path} disablePadding>
                        <ListItemButton
                          selected={isActive}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          sx={{
                            px: 2,
                            py: 1,
                            "&.Mui-selected": {
                              backgroundColor: "primary.50",
                            },
                            "&.Mui-selected:hover": {
                              backgroundColor: "primary.100",
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Box
                              className="flex items-center justify-center w-7 h-7 rounded-md"
                              sx={{
                                color: CATEGORY_COLORS[category],
                                bgcolor: `${CATEGORY_COLORS[category]}20`,
                              }}
                            >
                              {item.icon}
                            </Box>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography className="text-gray-800">
                                {item.label}
                              </Typography>
                            }
                            secondary={
                              item.description ? (
                                <Typography variant="caption" className="text-gray-400">
                                  {item.description}
                                </Typography>
                              ) : undefined
                            }
                          />
                          <Chip
                            label={category}
                            size="small"
                            // color={(CATEGORY_COLORS[category] as any) || "default"}
                            variant="outlined"
                            sx={{
                              fontSize: 10,
                              height: 20,
                              ml: 1,
                              color: CATEGORY_COLORS[category],
                              borderColor: `${CATEGORY_COLORS[category]}44`, // Semi-transparent border
                              '& .MuiChip-label': {
                                px: 1,
                              }
                            }}
                          />
                          {isActive && (
                            <KeyboardReturnOutlined
                              fontSize="small"
                              className="text-gray-400 ml-1"
                              sx={{ fontSize: 16 }}
                            />
                          )}
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
