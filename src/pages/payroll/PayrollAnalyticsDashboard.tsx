import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  useTheme,
  ToggleButton,
  ToggleButtonGroup,
  TablePagination,
  TableContainer,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  BarChart as BarChartIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  FilterList as FilterListIcon,
  TableChart as TableChartIcon,
} from "@mui/icons-material";
import * as echarts from "echarts";
import { payrollService, type PayrollAnalyticsParams } from "../../services/modules/payrollServices/payroll";
import React from "react";
import { getRowColor } from "../const";

interface EmployeeRecord {
  id: string;
  employeeId: string;
  name: string;
  gender: string;
  department: string;
  age?: number;
  netPay?: number;
  esiAmount?: number;
  pfAmount?: number;
  employerContribution?: number;
}

// ============ Constants ============
const CHART_COLORS = [
  "#2563eb", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6",
  "#f97316", "#6366f1", "#84cc16", "#22d3ee"
];

// ============ Utility Functions ============

const formatNumber = (value: number): string => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)}Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(2)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(2)}K`;
  return `₹${value.toLocaleString("en-IN")}`;
};

const formatCompactNumber = (value: number): string => {
  if (value >= 10000000) return `${(value / 10000000).toFixed(1)}Cr`;
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
};

const analyticsLabel = (value: unknown): string =>
  value === null || value === undefined || value === "" ? "Unassigned" : String(value);

const analyticsNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const distributionRows = (rows: any[] = [], labelKey = "company", valueKey = "value") =>
  rows.map((row) => ({
    ...row,
    [labelKey]: analyticsLabel(row[labelKey]),
    [valueKey]: analyticsNumber(row[valueKey]),
  }));

// ============ Chart Components ============

interface ChartRendererProps {
  option: echarts.EChartsOption;
  height?: number;
}

const ChartRenderer = ({ option, height = 300 }: ChartRendererProps) => {
  const chartRef = React.useRef<HTMLDivElement>(null);
  const chartInstance = React.useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });
    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
      chartInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (chartInstance.current && option) {
      chartInstance.current.setOption(option, true);
    }
  }, [option]);

  return <div ref={chartRef} style={{ width: "100%", height, minHeight: height }} />;
};

// ============ Chart Option Builders ============

const buildLineChartOption = (
  data: Array<Record<string, any>>,
  xAxis: string,
  yAxis: string[],
  colorStart: string
): echarts.EChartsOption => ({
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    textStyle: { color: "#1f2937", fontSize: 12 },
    formatter: (params: any) => {
      let html = `<div style="font-weight:600;margin-bottom:4px">${params[0]?.axisValue || ""}</div>`;
      params.forEach((p: any) => {
        html += `<div style="display:flex;justify-content:space-between;gap:10px">
          <span>${p.marker} ${p.seriesName}</span>
          <span style="font-weight:600">${formatNumber(p.value)}</span>
        </div>`;
      });
      return html;
    },
  },
  legend: {
    data: yAxis,
    textStyle: { fontSize: 12, color: "#6b7280" },
    bottom: 0,
    icon: "circle",
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "12%",
    top: "10%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: data.map((item) => item[xAxis]),
    axisLabel: { fontSize: 11, color: "#6b7280", rotate: data.length > 8 ? 30 : 0 },
    axisLine: { lineStyle: { color: "#e5e7eb" } },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    axisLabel: { fontSize: 11, color: "#6b7280", formatter: (value: number) => formatCompactNumber(value) },
    splitLine: { lineStyle: { color: "#e5e7eb", type: "dashed" } },
  },
  series: yAxis.map((col) => ({
    name: col,
    type: "line",
    data: data.map((item) => item[col]),
    smooth: true,
    symbolSize: 8,
    lineStyle: { width: 3, color: colorStart },
    itemStyle: { color: colorStart },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: `${colorStart}40` },
        { offset: 1, color: `${colorStart}02` },
      ]),
    },
  })),
});

const buildBarChartOption = (
  data: Array<Record<string, any>>,
  xAxis: string,
  yAxis: string[],
  palette: string[],
  stacked: boolean = false
): echarts.EChartsOption => ({
  tooltip: {
    trigger: "axis",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    textStyle: { color: "#1f2937", fontSize: 12 },
    formatter: (params: any) => {
      let html = `<div style="font-weight:600;margin-bottom:4px">${params[0]?.axisValue || ""}</div>`;
      params.forEach((p: any) => {
        html += `<div style="display:flex;justify-content:space-between;gap:10px">
          <span>${p.marker} ${p.seriesName}</span>
          <span style="font-weight:600">${formatNumber(p.value)}</span>
        </div>`;
      });
      return html;
    },
  },
  legend: {
    data: yAxis,
    textStyle: { fontSize: 12, color: "#6b7280" },
    bottom: 0,
    icon: "roundRect",
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "12%",
    top: "10%",
    containLabel: true,
  },
  xAxis: {
    type: "category",
    data: data.map((item) => item[xAxis]),
    axisLabel: { fontSize: 11, color: "#6b7280", rotate: data.length > 8 ? 30 : 0 },
    axisLine: { lineStyle: { color: "#e5e7eb" } },
    axisTick: { show: false },
  },
  yAxis: {
    type: "value",
    axisLabel: { fontSize: 11, color: "#6b7280", formatter: (value: number) => formatCompactNumber(value) },
    splitLine: { lineStyle: { color: "#e5e7eb", type: "dashed" } },
  },
  series: yAxis.map((col, index) => ({
    name: col,
    type: "bar",
    data: data.map((item) => item[col]),
    itemStyle: {
      color: palette[index % palette.length],
      borderRadius: stacked ? [0, 0, 0, 0] : [6, 6, 0, 0],
    },
    stack: stacked ? "total" : undefined,
    barGap: stacked ? "0%" : "20%",
    barWidth: stacked ? "40%" : "35%",
  })),
});

const buildPieChartOption = (
  data: Array<Record<string, any>>,
  labelField: string,
  valueField: string,
  palette: string[],
  isDonut: boolean = false
): echarts.EChartsOption => {
  const groupedData = data.reduce((acc: Record<string, number>, item) => {
    const label = String(item[labelField] ?? "-");
    const value = Number(item[valueField]) || 0;
    acc[label] = (acc[label] || 0) + value;
    return acc;
  }, {});

  const pieData = Object.entries(groupedData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(255,255,255,0.95)",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      textStyle: { color: "#1f2937", fontSize: 12 },
      formatter: (params: any) => {
        return `<div style="font-weight:600">${params.name}</div>
          <div>Value: ${formatNumber(params.value)}</div>
          <div>Percentage: ${params.percent}%</div>`;
      },
    },
    legend: {
      data: pieData.map((item) => item.name),
      textStyle: { fontSize: 11, color: "#6b7280" },
      bottom: 0,
      type: "scroll",
      pageIconColor: "#6b7280",
    },
    series: [
      {
        type: "pie",
        radius: isDonut ? ["45%", "70%"] : ["0%", "70%"],
        center: ["50%", "45%"],
        data: pieData.map((item, index) => ({
          ...item,
          itemStyle: {
            color: palette[index % palette.length],
            borderRadius: 4,
          },
        })),
        label: {
          show: true,
          formatter: "{b}\n({d}%)",
          fontSize: 10,
          color: "#4b5563",
        },
        labelLine: {
          length: 8,
          length2: 8,
          lineStyle: { color: "#9ca3af" },
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: "rgba(0,0,0,0.2)",
          },
        },
      },
    ],
  };
};

// ============ Main Component ============

export default function PayrollAnalyticsDashboard() {
  const theme = useTheme();
  const [filters, setFilters] = useState<PayrollAnalyticsParams>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  });

  // Tier 1 - Overview Data
  const [overviewData, setOverviewData] = useState<any>(null);
  const [pfEsiData, setPfEsiData] = useState<any>(null);
  const [strengthData, setStrengthData] = useState<any>(null);

  // Tier 2 - Company Drilldown
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [companyData, setCompanyData] = useState<any>(null);

  // Tier 3 - Employee/Department Drilldown
  const [drilldownType, setDrilldownType] = useState<'department' | 'employee' | null>(null);
  const [, setEmployeeData] = useState<any>(null);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Employee List State
  const [employeeList, setEmployeeList] = useState<EmployeeRecord[]>([]);
  const [employeePage, setEmployeePage] = useState(0);
  const [employeeRowsPerPage, setEmployeeRowsPerPage] = useState(10);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('both');
  const [minNetPay, setMinNetPay] = useState("");
  const [maxNetPay, setMaxNetPay] = useState("");

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overview, pfEsi, strength] = await Promise.all([
        payrollService.getPayrollOverview(filters),
        payrollService.getPayrollPfEsi(filters),
        payrollService.getEmployeeStrength(filters),
      ]);
      setOverviewData(overview.data);
      setPfEsiData(pfEsi.data);
      setStrengthData(strength.data);
    } catch {
      setError("Unable to load payroll analytics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const openCompanyDrilldown = async (company: string) => {
    setSelectedCompany(company);
    setLoading(true);
    setError("");
    try {
      const response = await payrollService.getPayrollCompanyDrilldown({
        ...filters,
        company,
      });
      setCompanyData(response.data);
      setDrilldownType(null);
      setEmployeeData(null);
    } catch {
      setError("Unable to load company payroll details.");
    } finally {
      setLoading(false);
    }
  };

  const openEmployeeDrilldown = async (department?: string) => {
    if (!selectedCompany) return;
    setDrilldownType('employee');
    setLoading(true);
    setError("");
    try {
      const response = await payrollService.getPayrollEmployees({
        company: selectedCompany,
        department,
        year: filters.year,
        month: filters.month,
        page: 0,
        size: 100,
      });
      setEmployeeList(asEmployeeRows(response.data));
      setEmployeeDialogOpen(true);
    } catch {
      setError("Unable to load employee payroll details.");
    } finally {
      setLoading(false);
    }
  };

  const asEmployeeRows = (data: any): EmployeeRecord[] => {
    if (!data) return [];
    const rows = Array.isArray(data) ? data : data.records || data.data || [];
    return rows.map((row: any, index: number) => ({
      id: row.employeeId || row.id || String(index),
      employeeId: row.employeeId || row.empId || row.id || "",
      name: row.name || row.employeeName || "",
      gender: row.gender || "-",
      department: row.department || row.dept || "-",
      age: row.age || undefined,
      netPay: Number(row.netPay || row.netpay || row.salary || 0),
      esiAmount: Number(row.esiAmount || row.esi || 0),
      pfAmount: Number(row.pfAmount || row.pf || 0),
      employerContribution: Number(row.employerContribution || 0),
    }));
  };

  // Filtered Employee List
  const filteredEmployees = useMemo(() => {
    let result = employeeList;

    if (employeeTypeFilter === 'employees') {
      result = result.filter((emp: any) => emp.employeeId && emp.employeeId.startsWith('EMP'));
    } else if (employeeTypeFilter === 'staff') {
      result = result.filter((emp: any) => emp.employeeId && emp.employeeId.startsWith('STF'));
    }

    if (genderFilter === 'male') {
      result = result.filter((emp: any) => emp.gender?.toLowerCase() === 'male');
    } else if (genderFilter === 'female') {
      result = result.filter((emp: any) => emp.gender?.toLowerCase() === 'female');
    }

    if (minNetPay) {
      result = result.filter((emp: any) => emp.netPay >= Number(minNetPay));
    }
    if (maxNetPay) {
      result = result.filter((emp: any) => emp.netPay <= Number(maxNetPay));
    }

    if (employeeSearch) {
      const search = employeeSearch.toLowerCase();
      result = result.filter((emp) =>
        emp.name?.toLowerCase().includes(search) ||
        emp.employeeId?.toLowerCase().includes(search) ||
        emp.department?.toLowerCase().includes(search)
      );
    }

    return result;
  }, [employeeList, employeeTypeFilter, genderFilter, minNetPay, maxNetPay, employeeSearch]);

  // ============ Chart Options ============

  const overviewChartOptions = useMemo(() => {
    const salaryDistData = distributionRows(overviewData?.salary_distribution, "company", "value");
    const contributionRows = (pfEsiData?.by_company || []).map((row: any) => ({
      ...row,
      company: analyticsLabel(row.branch),
      pf: analyticsNumber(row.pfTotal),
      esi: analyticsNumber(row.esiTotal),
      headcount: analyticsNumber(row.employeeCount),
    }));
    const strengthField = strengthData?.department ? "department" : "employmentType";
    const headCountData = distributionRows(
      strengthData?.department || strengthData?.employmentType,
      strengthField,
      "headcountActive",
    );

    return {
      salaryDistribution: buildLineChartOption(
        salaryDistData,
        "company",
        ["value"],
        "#3b82f6"
      ),
      esiContribution: buildPieChartOption(
        contributionRows,
        "company",
        "esi",
        CHART_COLORS,
        true
      ),
      pfContribution: buildPieChartOption(
        contributionRows,
        "company",
        "pf",
        CHART_COLORS,
        true
      ),
      employeeStrength: buildBarChartOption(
        headCountData,
        strengthField,
        ["headcountActive"],
        ["#8b5cf6", "#ec4899"]
      ),
    };
  }, [overviewData, pfEsiData, strengthData]);

  const companyOverviewRows = useMemo(() => {
    const salaryRows = overviewData?.salary_distribution || [];
    const pfEsiRows = pfEsiData?.by_company || [];
    const strengthRows = overviewData?.employee_strength || [];
    const companies = new Set<string>([
      ...salaryRows.map((row: any) => analyticsLabel(row.company)),
      ...pfEsiRows.map((row: any) => analyticsLabel(row.branch)),
      ...strengthRows.map((row: any) => analyticsLabel(row.company)),
    ]);

    return Array.from(companies).map((company) => ({
      company,
      netPay: analyticsNumber(salaryRows.find((row: any) => analyticsLabel(row.company) === company)?.value),
      headcount: analyticsNumber(strengthRows.find((row: any) => analyticsLabel(row.company) === company)?.value)
        || analyticsNumber(pfEsiRows.find((row: any) => analyticsLabel(row.branch) === company)?.employeeCount),
      pf: analyticsNumber(pfEsiRows.find((row: any) => analyticsLabel(row.branch) === company)?.pfTotal),
      esi: analyticsNumber(pfEsiRows.find((row: any) => analyticsLabel(row.branch) === company)?.esiTotal),
    }));
  }, [overviewData, pfEsiData]);

  const companyChartOptions = useMemo(() => {
    if (!companyData) return {};

    const deptData = (companyData.department_wise || companyData.departmentWise || companyData.departments || []).map((row: any) => ({
      ...row,
      department: analyticsLabel(row.department),
      netPay: analyticsNumber(row.netTotal),
    }));
    const empTypeAgeData = companyData.emp_type_age || [];
    const ageData = empTypeAgeData.map((row: any) => ({
      ...row,
      ageBracket: analyticsLabel(row.ageBracket),
      count: analyticsNumber(row.employeeCount),
    }));
    const typeData = empTypeAgeData.map((row: any) => ({
      ...row,
      employeeType: analyticsLabel(row.employeeType),
      count: analyticsNumber(row.employeeCount),
    }));
    const monthData = (companyData.month_wise || companyData.monthWise || companyData.monthly || []).map((row: any) => ({
      ...row,
      month: analyticsLabel(row.month),
      netPay: analyticsNumber(row.value),
    }));
    const overtimeData = (companyData.overtime_wages || []).map((row: any) => ({
      ...row,
      department: analyticsLabel(row.department),
      overtime: analyticsNumber(row.otTotal),
    }));
    const designationData = (companyData.designation_wise || []).map((row: any) => ({
      ...row,
      designation: analyticsLabel(row.designation),
      netPay: analyticsNumber(row.netTotal),
    }));

    return {
      deptWise: buildBarChartOption(
        deptData,
        "department",
        ["netPay"],
        ["#10b981", "#f59e0b"]
      ),
      ageWise: buildPieChartOption(
        ageData,
        "ageBracket",
        "count",
        ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"],
        true
      ),
      typeWise: buildPieChartOption(
        typeData,
        "employeeType",
        "count",
        ["#06b6d4", "#ec4899", "#f97316", "#14b8a6"],
        true
      ),
      monthWise: buildLineChartOption(
        monthData,
        "month",
        ["netPay"],
        "#3b82f6"
      ),
      overtimeWise: buildBarChartOption(
        overtimeData,
        "department",
        ["overtime"],
        ["#f59e0b"],
      ),
      designationWise: buildBarChartOption(
        designationData,
        "designation",
        ["netPay"],
        ["#8b5cf6"],
      ),
    };
  }, [companyData]);

  const companyTotals = useMemo(() => {
    const departments = companyData?.department_wise || [];
    const overtime = companyData?.overtime_wages || [];
    const employeeCount = (companyData?.emp_type_age || []).reduce(
      (total: number, row: any) => total + analyticsNumber(row.employeeCount),
      0,
    );
    return {
      headcount: employeeCount,
      departmentCount: departments.length,
      netPay: departments.reduce((total: number, row: any) => total + analyticsNumber(row.netTotal), 0),
      overtime: overtime.reduce((total: number, row: any) => total + analyticsNumber(row.otTotal), 0),
    };
  }, [companyData]);

  // ============ Render ============

  const renderEmployeeDialog = () => (
    <Dialog
      open={employeeDialogOpen}
      onClose={() => setEmployeeDialogOpen(false)}
      maxWidth="lg"
      fullWidth

    >
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-2">
        {/* <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 40, height: 40 }}>
            <PeopleIcon />
          </Avatar> */}
        <Box>
          <Typography variant="h6">
            {drilldownType === 'employee' ? 'Employee List' : 'Salary Insights'} - {selectedCompany}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Total Records: {filteredEmployees.length} | Total NetPay: {formatNumber(filteredEmployees.reduce((sum, emp: any) => sum + emp.netPay, 0))}
          </Typography>
        </Box>
        <IconButton onClick={() => setEmployeeDialogOpen(false)} sx={{ ml: "auto" }}>
          <CloseIcon className="!text-gray-500" />
        </IconButton>
      </div>

      <DialogContent sx={{ p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mb: 3 }}>
          <TextField
            size="small"
            placeholder="Search Name..."
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            // InputProps={{
            //   startAdornment: (
            //     <InputAdornment position="start">
            //       <SearchIcon fontSize="small" />
            //     </InputAdornment>
            //   ),
            // }}
            sx={{ width: { xs: "100%", md: 250 } }}
          />
          <TextField
            size="small"
            placeholder="Search Employee ID..."
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            // InputProps={{
            //   startAdornment: (
            //     <InputAdornment position="start">
            //       <SearchIcon fontSize="small" />
            //     </InputAdornment>
            //   ),
            // }}
            sx={{ width: { xs: "100%", md: 250 } }}
          />
          <TextField
            size="small"
            placeholder="Search Department..."
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
            // InputProps={{
            //   startAdornment: (
            //     <InputAdornment position="start">
            //       <SearchIcon fontSize="small" />
            //     </InputAdornment>
            //   ),
            // }}
            sx={{ width: { xs: "100%", md: 250 } }}
          />
          <ToggleButtonGroup
            value={employeeTypeFilter}
            exclusive
            className="!border !border-gray-300 !rounded-md"
            onChange={(_, value) => value && setEmployeeTypeFilter(value)}
            size="small"
          >
            <ToggleButton value="employees" className="!text-gray-800">Employees</ToggleButton>
            <ToggleButton value="staff" className="!text-gray-800">Staff</ToggleButton>
            <ToggleButton value="all" className="!text-gray-800">All</ToggleButton>
          </ToggleButtonGroup>
          <ToggleButtonGroup
            value={genderFilter}
            exclusive
            className="!border !border-gray-300 !rounded-md"
            onChange={(_, value) => value && setGenderFilter(value)}
            size="small"
          >
            <ToggleButton value="male" className="!text-gray-800">Male</ToggleButton>
            <ToggleButton value="female" className="!text-gray-800">Female</ToggleButton>
            <ToggleButton value="both" className="!text-gray-800">Both</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
          <TextField
            label="Min NetPay"
            type="number"
            value={minNetPay}
            onChange={(e) => setMinNetPay(e.target.value)}
            // InputProps={{
            //   startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            // }}
            sx={{ width: { xs: "100%", md: 200 } }}
          />
          <TextField
            label="Max NetPay"
            type="number"
            value={maxNetPay}
            onChange={(e) => setMaxNetPay(e.target.value)}
            // InputProps={{
            //   startAdornment: <InputAdornment position="start">₹</InputAdornment>,
            // }}
            sx={{ width: { xs: "100%", md: 200 } }}
          />
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            color="success"
          >
            Export
          </Button>
        </Stack>

        <TableContainer className="!max-h-[400px] !border !border-gray-200 !rounded-md">
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell className="!font-bold">S.No</TableCell>
                <TableCell className="!font-bold">ID Card</TableCell>
                <TableCell className="!font-bold">Name</TableCell>
                <TableCell className="!font-bold">Gender</TableCell>
                <TableCell className="!font-bold">Department</TableCell>
                <TableCell className="!font-bold">NetPay</TableCell>
                <TableCell className="!font-bold">ESI</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees
                .slice(employeePage * employeeRowsPerPage, (employeePage + 1) * employeeRowsPerPage)
                .map((emp: any, index) => (
                  <TableRow
                    key={emp.id}
                    sx={getRowColor(index)}
                  >
                    <TableCell>{employeePage * employeeRowsPerPage + index + 1}</TableCell>
                    <TableCell>
                      <Chip
                        label={emp.employeeId}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{emp.name}</TableCell>
                    <TableCell>{emp.gender}</TableCell>
                    <TableCell>{emp.department}</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                      {formatNumber(emp.netPay)}
                    </TableCell>
                    <TableCell sx={{ color: "#8b5cf6" }}>{formatNumber(emp.esiAmount)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredEmployees.length}
          page={employeePage}
          onPageChange={(_, newPage) => setEmployeePage(newPage)}
          rowsPerPage={employeeRowsPerPage}
          onRowsPerPageChange={(e) => {
            setEmployeeRowsPerPage(parseInt(e.target.value, 10));
            setEmployeePage(0);
          }}
          rowsPerPageOptions={[10, 25, 50]}
        />
      </DialogContent>

      <DialogActions className="!p-4 !border-t !border-gray-200">
        <Button onClick={() => setEmployeeDialogOpen(false)} variant="outlined" className="!text-gray-800 !border-gray-200">
          Close
        </Button>
        <Button variant="contained" color="primary" className="!bg-primary">
          View Full Report
        </Button>
      </DialogActions>
    </Dialog>
  );

  // ============ Main Render ============

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="bg-white-50 space-y-4">
      {/* Header */}
      {/* <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: "1px solid #e5e7eb" }}> */}
      <div className="flex xs:grid items-center justify-between gap-4 border border-gray-200 rounded-lg p-3 bg-white">
        <div className="flex items-center gap-2">
          <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48, borderRadius: 2 }}>
            <BarChartIcon />
          </Avatar>
          <Box>
            <div className="text-gray-800 font-bold">
              Payroll Analytics Dashboard
            </div>
            <div className="text-[12px] text-gray-500">
              Three-tier drilldown: Overview → Company → Department/Employee
            </div>
          </Box>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outlined" size="small" startIcon={<RefreshIcon />} onClick={() => void loadOverview()}>
            Refresh
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FilterListIcon />}
            onClick={() => setShowFilters(!showFilters)}
            color='info'
          >
            Filters
          </Button>
          <Button variant="contained" size="small" startIcon={<DownloadIcon />}>
            Export
          </Button>
        </div>
      </div>
      {/* </Paper> */}

      {/* Filters */}
      {showFilters && (
        <div className="mb-3 border border-gray-200 rounded-lg p-3 pt-6">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Year"
                type="number"
                fullWidth
                value={filters.year ?? ""}
                onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={filters.month ?? ""}
                  label="Month"
                  onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <MenuItem key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleString("en", { month: "long" })}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                label="Financial Year"
                type="number"
                fullWidth
                value={filters.finYear ?? ""}
                onChange={(e) => setFilters({ ...filters, finYear: Number(e.target.value) || undefined })}
              />
            </Grid>
            <div className="flex items-center gap-2">
              <Button variant="contained" onClick={() => void loadOverview()}>
                Apply Filters
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setFilters({
                    year: new Date().getFullYear(),
                    month: new Date().getMonth() + 1,
                  });
                }}
              >
                Reset
              </Button>
            </div>
          </Grid>

        </div>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* ============ TIER 1: OVERVIEW ============ */}
      {!selectedCompany && (
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }} className="text-gray-800 !font-bold">
            Overview of Salary Distribution
          </Typography>
          <Grid container spacing={2}>
            {/* Salary Distribution */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="bg-white border border-gray-200" elevation={0} sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2 }} className="text-gray-800 !font-bold">
                    Salary Distribution
                  </Typography>
                  <ChartRenderer option={overviewChartOptions.salaryDistribution || {}} height={350} />
                </CardContent>
              </Card>
            </Grid>

            {/* ESI Contribution */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="bg-white border border-gray-200" elevation={0} sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2 }} className="text-gray-800 !font-bold">
                    ESI Contribution
                  </Typography>
                  <ChartRenderer option={overviewChartOptions.esiContribution || {}} height={350} />
                </CardContent>
              </Card>
            </Grid>

            {/* PF Contribution */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="bg-white border border-gray-200" elevation={0} sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2 }} className="text-gray-800 !font-bold">
                    PF Contribution
                  </Typography>
                  <ChartRenderer option={overviewChartOptions.pfContribution || {}} height={350} />
                </CardContent>
              </Card>
            </Grid>

            {/* Employee Strength */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="bg-white border border-gray-200" elevation={0} sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 2 }} className="text-gray-800 !font-bold">
                    Employee Strength as on date
                  </Typography>
                  <ChartRenderer option={overviewChartOptions.employeeStrength || {}} height={350} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Company Overview Table with Click */}
          <Card className="bg-white border border-gray-200" elevation={0} sx={{ mt: 3, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <CardContent>
              <div className="flex justify-content-between items-center">
                <Typography variant="subtitle1" sx={{ mb: 2 }} className="text-gray-800 !font-bold">
                  Company Overview
                  <Chip label="Click on a company to drilldown" size="small" color="info" variant="outlined" className="ml-2" />
                </Typography>
              </div>
              <TableContainer className="border border-gray-200 rounded-md">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Company</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Net Pay</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Headcount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>PF</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>ESI</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companyOverviewRows.map((row: any, index: number) => (
                      <TableRow
                        key={index}
                        onClick={() => openCompanyDrilldown(row.company || row.branch)}
                        sx={getRowColor(index)}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>
                          <div className="flex items-center gap-2">
                            <Avatar sx={{ width: 28, height: 28, bgcolor: CHART_COLORS[index % CHART_COLORS.length] }}>
                              <GroupIcon sx={{ fontSize: 16 }} />
                            </Avatar>
                            {row.company || row.branch}
                          </div>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                          {formatNumber(Number(row.netPay || row.amount || 0))}
                        </TableCell>
                        <TableCell align="right">{formatCompactNumber(Number(row.headcount || 0))}</TableCell>
                        <TableCell align="right">{formatNumber(Number(row.pf || 0))}</TableCell>
                        <TableCell align="right">{formatNumber(Number(row.esi || 0))}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Company Details">
                            <IconButton size="small" color="primary">
                              <ArrowBackIcon sx={{ transform: "rotate(180deg)" }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* ============ TIER 2: COMPANY DRILLDOWN ============ */}
      {selectedCompany && !drilldownType && (
        <Box>
          <div className="p-2 mb-3 border border-gray-200 rounded-lg bg-white">
            {/* <div className="flex md:grid justify-between items-center gap-4"> */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  startIcon={<ArrowBackIcon />}
                  onClick={() => {
                    setSelectedCompany(null);
                    setCompanyData(null);
                  }}
                  size="small"
                  className="!text-primary"
                >
                  Back to Overview
                </Button>
                <Divider orientation="vertical" flexItem sx={{ mx: 2 }} className="border border-gray-200" />
                <Typography variant="h5">
                  {selectedCompany}
                </Typography>
                <Chip label="Company Details" size="small" color="primary" variant="outlined" />
              </div>
              <div>
                <Button
                  variant="contained"
                  size="small"
                  className="!bg-primary"
                  startIcon={<TableChartIcon className="!w-4" />}
                  onClick={() => openEmployeeDrilldown()}
                >
                  View Employees
                </Button>
              </div>
            </div>

            {/* </div> */}
          </div>

          {/* KPI Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card className="bg-white border border-gray-200">
                <CardContent>
                  <Typography variant="caption" className="text-gray-500">Total Headcount</Typography>
                  <Typography variant="h4" className="!font-bold" color="primary">
                    {formatCompactNumber(companyTotals.headcount)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card className="bg-white border border-gray-200">
                <CardContent>
                  <Typography variant="caption" className="text-gray-500">Total NetPay</Typography>
                  <Typography variant="h4" className="!font-bold" color="info">
                    {formatNumber(companyTotals.netPay)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card className="bg-white border border-gray-200">
                <CardContent>
                  <Typography variant="caption" className="text-gray-500">Departments</Typography>
                  <Typography variant="h4" className="!font-bold" color="secondary">
                    {companyTotals.departmentCount}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Card className="bg-white border border-gray-200">
                <CardContent>
                  <Typography variant="caption" className="text-gray-500">Overtime Wages</Typography>
                  <Typography variant="h4" className="!font-bold" color="success">
                    {formatNumber(companyTotals.overtime)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Company Charts */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="bg-white border border-gray-200" elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" className="!font-bold !mb-2 !text-gray-800">
                    Department wise
                  </Typography>
                  <ChartRenderer option={companyChartOptions.deptWise || {}} height={350} />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="bg-white border border-gray-200" elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" className="!font-bold !mb-2 !text-gray-800">
                    Overtime wages by department
                  </Typography>
                  <ChartRenderer option={companyChartOptions.overtimeWise || {}} height={350} />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="bg-white border border-gray-200" elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" className="!font-bold !mb-2 !text-gray-800">
                    Designation-wise net pay
                  </Typography>
                  <ChartRenderer option={companyChartOptions.designationWise || {}} height={350} />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="bg-white border border-gray-200" elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" className="!font-bold !mb-2 !text-gray-800">
                    Age wise
                  </Typography>
                  <ChartRenderer option={companyChartOptions.ageWise || {}} height={350} />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="bg-white border border-gray-200" elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" className="!font-bold !mb-2 !text-gray-800">
                    Employee Type wise
                  </Typography>
                  <ChartRenderer option={companyChartOptions.typeWise || {}} height={350} />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Card className="bg-white border border-gray-200" elevation={0} sx={{ borderRadius: 3, border: "1px solid #e5e7eb", height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle1" className="!font-bold !mb-2 !text-gray-800">
                    Month wise
                  </Typography>
                  <ChartRenderer option={companyChartOptions.monthWise || {}} height={350} />
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Department Table with Click */}
          <Card className="bg-white border border-gray-200" elevation={0} sx={{ mt: 3, borderRadius: 3, border: "1px solid #e5e7eb" }}>
            <CardContent>
              <div className="flex justify-between items-center gap-4 mb-2">
                <Typography variant="subtitle1" className="!font-bold !text-gray-800">
                  Department-wise Breakdown
                </Typography>
                <Chip label="Click on department to view employees" size="small" color="info" variant="outlined" />
              </div>
              <TableContainer className="border border-gray-200 rounded-md">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Department</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Employees</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Total NetPay</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Overtime</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(companyData?.department_wise || companyData?.departments || companyData?.departmentWise || []).map((row: any, index: number) => (
                      <TableRow
                        key={index}
                        onClick={() => openEmployeeDrilldown(row.department)}
                        sx={getRowColor(index)}
                      >
                        <TableCell sx={{ fontWeight: 600 }}>{row.department}</TableCell>
                        <TableCell align="right">{formatCompactNumber(Number(row.employees || row.count || 0))}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                          {formatNumber(Number(row.netTotal || row.netPay || row.amount || 0))}
                        </TableCell>
                        <TableCell align="right">{formatNumber(Number((companyData?.overtime_wages || []).find((overtime: any) => overtime.department === row.department)?.otTotal || 0))}</TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Employees">
                            <IconButton size="small" color="primary">
                              <PeopleIcon className="!text-primary" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Employee Dialog */}
      {renderEmployeeDialog()}
    </div>
  );
}