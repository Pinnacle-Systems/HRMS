import { Box, Card, CardContent, CardHeader, Typography, Button, Grid, Divider, LinearProgress, Chip, Stack, useTheme, alpha } from "@mui/material";
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
  PlayArrow as PlayIcon,
  Refresh as RefreshIcon,
  ChevronRight as ChevronRightIcon,
  CalendarToday as CalendarIcon,
  Payments as BanknoteIcon,
} from "@mui/icons-material";
import { useUI } from "../../context/Snackbar";
import { payrollService } from "../../services/modules/payrollServices/payroll";
import { useEffect, useState } from "react";
import { formatCurrency, type DashboardData } from "./const";
import { useNavigate } from "react-router-dom";

const CHART_COLORS = ["#ea580c", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];

// Status color mapping as OBJECT (not array)
const processingStatusColor:any = {
  "Submitted": "#3b82f6",
  "Processing": "#f59e0b",
  "Approved": "#10b981",
  "Failed": "#ef4444"
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
  const navigate = useNavigate();
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const [data, setData] = useState<DashboardData>({
    totalEmployees: 0,
    netPayroll: 0,
    pendingApprovals: 0,
    totalCost: 0,
    processingStatus: [],
    upcomingPayrolls: [],
    recentActivities: [],
    departmentWiseData: [],
    deductionComposition: [],
    monthlyTrend: [],
  });

  const getDashboardView = async () => {
    showSpinner();
    try {
      const res: any = await payrollService.getDashboard();
      if (res.success) {
        setData(res.data);
      } else {
        showSnackbar(res.message || 'Failed to load dashboard', 'error');
      }
    } catch (error: any) {
      console.error('Dashboard error:', error);
      showSnackbar('Error loading dashboard data', 'error');
    } finally {
      hideSpinner();
    }
  }

  useEffect(() => {
    getDashboardView();
  }, [])

  const totalStatusCount = data.processingStatus?.reduce((sum, item) => sum + item.count, 0) || 1;

  const kpis = [
    {
      label: "Total Employees",
      value: data.totalEmployees || 0,
      positive: true,
      icon: UsersIcon,
      iconBg: alpha(theme.palette.primary.main, 0.1),
      iconColor: theme.palette.primary.main,
    },
    {
      label: "Net Payroll",
      value: formatCurrency(data.netPayroll || 0),
      positive: true,
      icon: BanknoteIcon,
      iconBg: alpha(theme.palette.success.main, 0.1),
      iconColor: theme.palette.success.main,
    },
    {
      label: "Pending Approvals",
      value: data.pendingApprovals || 0,
      positive: false,
      icon: ClockIcon,
      iconBg: alpha(theme.palette.warning.main, 0.1),
      iconColor: theme.palette.warning.main,
    },
    {
      label: "Total Cost",
      value: formatCurrency(data.totalCost || 0),
      positive: false,
      icon: TrendingUpIcon,
      iconBg: alpha(theme.palette.error.main, 0.1),
      iconColor: theme.palette.error.main,
    },
  ];

  return (
    <div className="">
      {/* Page Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <div className="text-gray-800 font-bold">
            Payroll Dashboard
          </div>
          <div className="text-[12px] text-gray-500 mt-0.5">
            Overview of your payroll operations
          </div>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon fontSize="small" />}
            sx={{ textTransform: "none" }}
            onClick={() => getDashboardView()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<PlayIcon fontSize="small" />}
            className="!bg-primary"
            onClick={() => navigate("/payroll/runs")}
          >
            Run Payroll
          </Button>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid size={{ xs: 6, md: 3 }} key={kpi.label}>
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ flex: 1 }}>
                    <div className="text-[12px] text-gray-800">
                      {kpi.label}
                    </div>
                    <div className="text-[12px] text-gray-500 mt-0.5">
                      {kpi.value}
                    </div>
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
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardHeader
              title={
                <div className="text-[12px] text-gray-800">
                  Monthly Payroll Trend
                </div>
              }
              subheader={
                <div className="text-[12px] text-gray-500">
                  (₹ in lakhs)
                </div>
              }
              sx={{ pb: 1 }}
            />
            <CardContent>
              {data.monthlyTrend?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220} className="bg-white-50">
                  <LineChart data={data.monthlyTrend} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} className="pt-3">
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
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
                  <Typography variant="body2" className="text-gray-500">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardHeader
              title={
                <div className="text-[12px] text-gray-800">
                  Department-wise Distribution
                </div>
              }
              subheader={
                <div className="text-[12px] text-gray-500 mt-0.5">
                  Gross salary by department
                </div>
              }
              sx={{ pb: 1 }}
            />
            <CardContent>
              {data.departmentWiseData?.length > 0 ? (
                <ResponsiveContainer width="100%" height={220} className="bg-white-50">
                  <BarChart data={data.departmentWiseData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} className="pt-3">
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
                      {data.departmentWiseData.map((_entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 220 }}>
                  <Typography variant="body2" className="text-gray-500">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Grid container spacing={3} className="mb-5">
        {/* Deduction Composition */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", height: "100%" }}>
            <CardHeader
              title={
                <div className="text-[12px] text-gray-800">
                  Deduction Composition
                </div>
              }
              subheader={
                <div className="text-[12px] text-gray-500 mt-0.5">
                  This month's breakdown
                </div>
              }
              sx={{ pb: 1 }}
            />
            <CardContent>
              {data.deductionComposition?.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={data.deductionComposition}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.deductionComposition.map((_entry, index) => (
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
                    {data.deductionComposition.map((item, index) => (
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
                          <div className="text-[12px] text-gray-800">
                            {item.name}
                          </div>
                        </Box>
                        <div className="text-[12px] text-gray-800">
                          {formatCurrency(item.value)}
                        </div>
                      </Box>
                    ))}
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                  <Typography variant="body2" className="text-gray-500">No data available</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Processing Status */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", height: "100%" }}>
            <CardHeader
              title={
                <div className="text-[12px] text-gray-800">
                  Processing Status
                </div>
              }
              subheader={
                <div className="text-[12px] text-gray-500 mt-0.5">
                  Current payroll run
                </div>
              }
              sx={{ pb: 1 }}
            />
            <CardContent>
              <Stack spacing={2.5}>
                {data.processingStatus?.map((item) => {
                  const percentage = totalStatusCount > 0 ? (item.count / totalStatusCount) * 100 : 0;
                  return (
                    <Box key={item.label}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <div className="text-[12px] text-gray-800">
                          {item.label}
                        </div>
                        <div className="text-[12px] text-gray-800 font-bold">
                          {item.count}
                        </div>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: theme.palette.grey[200],
                          "& .MuiLinearProgress-bar": {
                            bgcolor: processingStatusColor[item.label] || "#013277 !important",
                            borderRadius: 3,
                          },
                        }}
                      />
                    </Box>
                  );
                })}

                <Divider sx={{ my: 1 }} className="border border-gray-200"/>

                <Box>
                  <div className="text-[12px] text-gray-800">
                    Upcoming Payrolls
                  </div>
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    {data.upcomingPayrolls.length > 0 ? (
                      data.upcomingPayrolls.map((p) => (
                        <Box
                          key={p.period}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <CalendarIcon fontSize="small" className="!w-4 text-gray-800" />
                            <div className="text-[12px] text-gray-800">{p.period}</div>
                          </Box>
                          <Chip
                            label={p.status}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: "10px",
                              bgcolor: p.status === "pending"
                                ? theme.palette.primary.main
                                : theme.palette.grey[200],
                              color: p.status === "pending" ? "white" : "text.secondary",
                            }}
                          />
                        </Box>
                      ))
                    ) : (
                      <Typography variant="body2" className="text-gray-500" align="center">
                        No upcoming payrolls
                      </Typography>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activities */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", height: "100%" }}>
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
                  <div className="text-[12px] text-gray-800">
                    Recent Activities
                  </div>
                  <div className="text-[12px] text-gray-500 mt-0.5">
                    Latest actions
                  </div>
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
                {data.recentActivities.length > 0 ? (
                  data.recentActivities.map((activity, index) => (
                    <Box key={index} sx={{ display: "flex", gap: 2 }}>
                      <ActivityIcon type={activity.type || "default"} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography className="text-gray-800" sx={{ lineHeight: 1.4 }}>
                          {activity.text}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                          <div className="text-[12px] text-gray-500 mt-0.5">
                            {activity.time}
                          </div>
                          <div className="text-[12px] text-gray-500 mt-0.5">
                            ·
                          </div>
                          <div className="text-[12px] text-gray-500 mt-0.5">
                            {activity.user}
                          </div>
                        </Box>
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <Typography variant="body2" className="text-gray-500">
                      No recent activities
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}