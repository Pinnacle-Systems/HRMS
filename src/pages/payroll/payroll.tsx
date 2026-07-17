import { Box, Card, CardContent, CardHeader, Typography, Badge, Button, Grid, Paper, Divider, LinearProgress, Avatar, IconButton, Chip, Stack, useTheme, alpha } from "@mui/material";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  People as UsersIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as ClockIcon,
  Warning as AlertTriangleIcon,
  CheckCircle as CheckCircleIcon,
  Description as FileTextIcon,
  ArrowUpward as ArrowUpRightIcon,
  ArrowDownward as ArrowDownRightIcon,
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  ChevronRight as ChevronRightIcon,
  CalendarToday as CalendarIcon,
  Payments as BanknoteIcon,
} from "@mui/icons-material";

const CHART_COLORS = ["#ea580c", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

// Mock data - replace with your actual API data
const mockDashboardMetrics = {
  totalMonthlyPayroll: 2850000,
  pendingApprovals: 8,
  totalDeductionsThisMonth: 450000,
  monthlyTrend: [
    { month: "Jan", amount: 2200000 },
    { month: "Feb", amount: 2350000 },
    { month: "Mar", amount: 2500000 },
    { month: "Apr", amount: 2600000 },
    { month: "May", amount: 2750000 },
    { month: "Jun", amount: 2850000 },
  ],
  departmentWiseData: [
    { department: "Engineering", total: 950000 },
    { department: "Sales", total: 720000 },
    { department: "HR", total: 380000 },
    { department: "Finance", total: 450000 },
    { department: "Operations", total: 350000 },
  ],
  deductionComposition: [
    { name: "PF", value: 180000 },
    { name: "Tax", value: 150000 },
    { name: "Insurance", value: 75000 },
    { name: "Other", value: 45000 },
  ],
};

const upcomingPayrolls = [
  { period: "June 2026", dueDate: "25 Jun 2026", employees: 248, status: "pending" },
  { period: "July 2026", dueDate: "25 Jul 2026", employees: 248, status: "scheduled" },
];

const recentActivities = [
  { id: 1, type: "processed", text: "May 2026 payroll processed successfully", time: "2 hours ago", user: "System" },
  { id: 2, type: "assignment", text: "Salary structure assigned to Rajesh Kumar", time: "5 hours ago", user: "HR Admin" },
  { id: 3, type: "approval", text: "Loan approval pending — Priya Sharma", time: "Yesterday", user: "Finance" },
  { id: 4, type: "alert", text: "PF contribution mismatch for 3 employees", time: "Yesterday", user: "System" },
  { id: 5, type: "component", text: "New salary component 'Night Shift' added", time: "2 days ago", user: "HR Admin" },
];

const processingStatus = [
  { label: "Submitted", count: 248, color: "#3b82f6" },
  { label: "Processing", count: 12, color: "#f59e0b" },
  { label: "Approved", count: 198, color: "#10b981" },
  { label: "Failed", count: 3, color: "#ef4444" },
];

// Helper function for currency formatting
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const currencyFormatter = (value: any): [string, string] => {
  if (typeof value === 'number') {
    return [formatCurrency(value), "Amount"];
  }
  return [String(value || 0), "Amount"];
};

const ActivityIcon = ({ type }: { type: string }) => {
  const base = {
    height: 32,
    width: 32,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  if (type === "processed") {
    return (
      <Box sx={{ ...base, bgcolor: "success.light", color: "success.main" }}>
        <CheckCircleIcon fontSize="small" />
      </Box>
    );
  }
  if (type === "assignment") {
    return (
      <Box sx={{ ...base, bgcolor: "primary.light", color: "primary.main" }}>
        <FileTextIcon fontSize="small" />
      </Box>
    );
  }
  if (type === "approval") {
    return (
      <Box sx={{ ...base, bgcolor: "warning.light", color: "warning.main" }}>
        <ClockIcon fontSize="small" />
      </Box>
    );
  }
  if (type === "alert") {
    return (
      <Box sx={{ ...base, bgcolor: "error.light", color: "error.main" }}>
        <AlertTriangleIcon fontSize="small" />
      </Box>
    );
  }
  return (
    <Box sx={{ ...base, bgcolor: "secondary.light", color: "secondary.main" }}>
      <TrendingUpIcon fontSize="small" />
    </Box>
  );
};

export default function Dashboard() {
  const theme = useTheme();
  const metrics = mockDashboardMetrics;

  const kpis = [
    {
      label: "Total Employees",
      value: "248",
      change: "+12 this month",
      positive: true,
      icon: UsersIcon,
      iconBg: alpha(theme.palette.primary.main, 0.1),
      iconColor: theme.palette.primary.main,
    },
    {
      label: "Net Payroll",
      value: formatCurrency(metrics.totalMonthlyPayroll),
      change: "+4.2% vs last month",
      positive: true,
      icon: BanknoteIcon,
      iconBg: alpha(theme.palette.success.main, 0.1),
      iconColor: theme.palette.success.main,
    },
    {
      label: "Pending Approvals",
      value: String(metrics.pendingApprovals),
      change: "Requires attention",
      positive: false,
      icon: ClockIcon,
      iconBg: alpha(theme.palette.warning.main, 0.1),
      iconColor: theme.palette.warning.main,
    },
    {
      label: "Total Cost",
      value: formatCurrency(metrics.totalDeductionsThisMonth + metrics.totalMonthlyPayroll),
      change: "+2.8% vs last month",
      positive: false,
      icon: TrendingUpIcon,
      iconBg: alpha(theme.palette.error.main, 0.1),
      iconColor: theme.palette.error.main,
    },
  ];

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Page Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
            Payroll Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Overview of your payroll operations for June 2026
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<PlayIcon fontSize="small" />}
            sx={{ textTransform: "none", bgcolor: "primary.main" }}
          >
            Run Payroll
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid size={{xs:12,sm:6,lg:3}} key={kpi.label}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                      {kpi.label}
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, mt: 1, color: "text.primary" }}>
                      {kpi.value}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
                      {kpi.positive ? (
                        <ArrowUpRightIcon fontSize="small" sx={{ color: "success.main" }} />
                      ) : (
                        <ArrowDownRightIcon fontSize="small" sx={{ color: "warning.main" }} />
                      )}
                      <Typography
                        variant="caption"
                        sx={{
                          color: kpi.positive ? "success.main" : "warning.main",
                          fontWeight: 500,
                        }}
                      >
                        {kpi.change}
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: kpi.iconBg,
                      flexShrink: 0,
                    }}
                  >
                    <kpi.icon sx={{ fontSize: 20, color: kpi.iconColor }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{xs:12,lg:6}}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardHeader
              title={
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Monthly Payroll Trend
                </Typography>
              }
              subheader={
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Jan – Jun 2026 (₹ in lakhs)
                </Typography>
              }
              sx={{ pb: 1 }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={metrics.monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    formatter={currencyFormatter}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke={theme.palette.primary.main}
                    strokeWidth={2.5}
                    dot={{ fill: theme.palette.primary.main, r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{xs:12,lg:6}}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardHeader
              title={
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Department-wise Distribution
                </Typography>
              }
              subheader={
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Gross salary by department
                </Typography>
              }
              sx={{ pb: 1 }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={metrics.departmentWiseData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                  <XAxis dataKey="department" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    formatter={currencyFormatter}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {metrics.departmentWiseData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3}>
        {/* Deduction Composition */}
        <Grid size={{xs:12,lg:4}}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", height: "100%" }}>
            <CardHeader
              title={
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Deduction Composition
                </Typography>
              }
              subheader={
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  This month's breakdown
                </Typography>
              }
              sx={{ pb: 1 }}
            />
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={metrics.deductionComposition}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {metrics.deductionComposition.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={currencyFormatter}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2 }}>
                {metrics.deductionComposition.map((item, index) => (
                  <Box
                    key={item.name}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 0.75,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: CHART_COLORS[index % CHART_COLORS.length],
                          flexShrink: 0,
                        }}
                      />
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {item.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(item.value)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Processing Status */}
        <Grid size={{xs:12,lg:4}}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", height: "100%" }}>
            <CardHeader
              title={
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Processing Status
                </Typography>
              }
              subheader={
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  June 2026 payroll run
                </Typography>
              }
              sx={{ pb: 1 }}
            />
            <CardContent>
              <Stack spacing={2.5}>
                {processingStatus.map((item) => (
                  <Box key={item.label}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: "text.secondary" }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.count}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(item.count / 248) * 100}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: theme.palette.grey[200],
                        "& .MuiLinearProgress-bar": {
                          bgcolor: item.color,
                          borderRadius: 3,
                        },
                      }}
                    />
                  </Box>
                ))}

                <Divider sx={{ my: 1 }} />

                <Box>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                    Upcoming Payrolls
                  </Typography>
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    {upcomingPayrolls.map((p) => (
                      <Box
                        key={p.period}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <CalendarIcon fontSize="small" sx={{ color: "text.secondary" }} />
                          <Typography variant="body2">{p.period}</Typography>
                        </Box>
                        <Chip
                          label={p.status}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "10px",
                            bgcolor:
                              p.status === "pending"
                                ? theme.palette.primary.main
                                : theme.palette.grey[200],
                            color: p.status === "pending" ? "white" : "text.secondary",
                          }}
                        />
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid size={{xs:12,lg:4}}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", height: "100%" }}>
            <CardHeader
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                pb: 1,
              }}
              title={
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Recent Activities
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Last 5 actions
                  </Typography>
                </Box>
              }
              action={
                <Button
                  variant="text"
                  size="small"
                  endIcon={<ChevronRightIcon fontSize="small" />}
                  sx={{ textTransform: "none", color: "primary.main" }}
                >
                  View all
                </Button>
              }
            />
            <CardContent>
              <Stack spacing={2.5}>
                {recentActivities.map((activity) => (
                  <Box key={activity.id} sx={{ display: "flex", gap: 2 }}>
                    <ActivityIcon type={activity.type} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ lineHeight: 1.4 }}>
                        {activity.text}
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {activity.time}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          ·
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                          {activity.user}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}