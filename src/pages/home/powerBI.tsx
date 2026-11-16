import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box, Paper, Typography, IconButton, Tooltip, Chip, Button,
  TextField, Select, MenuItem, FormControl, Divider,
  Collapse,
  Switch, FormControlLabel, Slider,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination,CircularProgress,
  useTheme
} from "@mui/material";
import {
  // Chart icons
  BarChart, ShowChart, PieChart, DonutLarge, ScatterPlot,
  TableChart, Speed, FilterAlt, Functions, Category, CalendarToday,
  // Action icons
  ExpandMore, ExpandLess, Add, Delete, Save, PlayArrow,
  Close, Settings, Undo, Redo, Dashboard, 
  // Search,
  // Misc icons
  Calculate, BubbleChart, Radar, GridOn,
  Refresh as RefreshIcon, // 
//   FileDownload as FileDownloadIcon,
//   Visibility as VisibilityIcon,
  DragIndicator as DragIndicatorIcon, 
//   Restore as RestoreIcon,
//   Cancel as CancelIcon, 
//   CheckCircle as CheckCircleIcon,
//   CloudDownload as CloudDownloadIcon,
//   Print as PrintIcon,
//   Share as ShareIcon,
//   PersonOutlined, CloseOutlined,
  Dashboard as DashboardIcon, 
//   Lock as LockIcon,
//   Widgets as WidgetsIcon, Edit, 
//   FilterList as FilterListIcon,
//   Schema as SchemaIcon, Info, QueryStats, Report,
//   Download, CheckCircle, Cancel, Add as AddIcon,
//   VisibilityOff as VisibilityOffIcon, ExpandMore as ExpandMoreIcon,
//   People as PeopleIcon, Assessment as AssessmentIcon,
//   Timeline as TimelineIcon, TrendingUp as TrendingUpIcon,
//   AttachMoney as AttachMoneyIcon, BusinessCenter as BusinessCenterIcon,
//   School as SchoolIcon, EmojiEvents as EmojiEventsIcon,
} from "@mui/icons-material";

// ============================================================================
// DnD Kit Imports
// ============================================================================
import {
  DndContext, useDraggable, useDroppable,
  PointerSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent,
  KeyboardSensor, // 
  DragOverlay, // 
} from "@dnd-kit/core";
import {
//   arrayMove, SortableContext,
   sortableKeyboardCoordinates, 
//   useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ============================================================================
// ECharts Imports
// ============================================================================
import * as echarts from "echarts";
import "echarts-gl";

// ============================================================================
// Mock Services (replace with actual imports)
// ============================================================================
const mockDashboardService = {
  listBIDatasets: async () => ({
    data: [
      { datasetId: "employees", title: "Employees", available: true },
      { datasetId: "leave", title: "Leave", available: true },
      { datasetId: "attendance", title: "Attendance", available: true },
      { datasetId: "payroll", title: "Payroll", available: true },
    ],
  }),
  getBIDatasetSchema: async (datasetId: string) => ({
    data: {
      datasetId,
      dimensions: [
        { id: "department", type: "string", label: "Department" },
        { id: "designation", type: "string", label: "Designation" },
        { id: "location", type: "string", label: "Location" },
        { id: "gender", type: "string", label: "Gender" },
        { id: "employmentType", type: "string", label: "Employment Type" },
      ],
      metrics: [
        { id: "headcount", type: "number", aggregation: "count" },
        { id: "avgSalary", type: "number", aggregation: "avg" },
        { id: "totalSalary", type: "number", aggregation: "sum" },
        { id: "leaveDays", type: "number", aggregation: "sum" },
        { id: "attendanceRate", type: "number", aggregation: "avg" },
      ],
      dateFields: [
        { id: "joiningDate", type: "date", label: "Joining Date" },
        { id: "resignationDate", type: "date", label: "Resignation Date" },
      ],
    },
  }),
  runBIQuery: async (_datasetId: string, query: any) => {
    const rows = [];
    const depts = ["Engineering", "Sales", "Marketing", "HR", "Finance", "Operations"];
    for (let i = 0; i < 8; i++) {
      const row: any = {};
      query.dimensions?.forEach((dim: string) => {
        row[dim] = depts[i % depts.length];
      });
      query.metrics?.forEach((met: string) => {
        row[met] = Math.floor(Math.random() * 100) + 10;
      });
      rows.push(row);
    }
    return {
      data: {
        data: rows,
        columns: [
          ...query.dimensions?.map((d: string) => ({ id: d, label: d, type: "string" })) || [],
          ...query.metrics?.map((m: string) => ({ id: m, label: m, type: "number" })) || [],
        ],
        meta: { rowCount: rows.length, queryTimeMs: 45 },
        totals: {},
      },
    };
  },
  getDashboardBuilderMeta: async () => ({
    data: {
      chartTypes: [
        { value: "bar" }, { value: "column" }, { value: "line" }, { value: "area" },
        { value: "pie" }, { value: "donut" }, { value: "scatter" }, { value: "radar" },
        { value: "heatmap" }, { value: "funnel" }, { value: "gauge" }, { value: "table" },
        { value: "kpi" }, { value: "treemap" }, { value: "sankey" }, { value: "sunburst" },
      ],
      widgetSizes: ["small", "medium", "large"],
      filterTypes: [
        { value: "month" }, { value: "date-range" }, { value: "dropdown" },
        { value: "multi-select" }, { value: "text" }, { value: "number" },
      ],
    },
  }),
};

const useMockUI = () => ({
  showSnackbar: (message: string, severity: string) => {
    console.log(`[${severity}] ${message}`);
  },
  showSpinner: () => {},
  hideSpinner: () => {},
  showConfirmDialog: (opts: any) => {
    if (window.confirm(opts.message)) opts.onConfirm?.();
  },
});

const dashboardService = mockDashboardService as any;
const useUI = useMockUI;

// ============================================================================
// Types
// ============================================================================

interface BIField {
  id: string;
  name: string;
  type: "dimension" | "metric" | "date";
  dataType: string;
  aggregation?: string;
  description?: string;
}

interface FieldMapping {
  fieldId: string;
  aggregation?: string;
  role: "axis" | "value" | "legend" | "tooltip" | "filter" | "size" | "color";
}

interface VisualConfig {
  id: string;
  type: string;
  title: string;
  fields: FieldMapping[];
  x: number;
  y: number;
  width: number;
  height: number;
  config: {
    showLegend?: boolean;
    showLabels?: boolean;
    colorScheme?: string;
    sortBy?: string;
    sortDirection?: "asc" | "desc";
    limit?: number;
    is3D?: boolean;
  };
  data?: any;
}

interface ChartType {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: "bar" | "line" | "pie" | "scatter" | "table" | "other";
  requiredFields: {
    axis?: number;
    value?: number;
    legend?: number;
  };
}

// ============================================================================
// Chart Types Definition
// ============================================================================

const CHART_TYPES: ChartType[] = [
  { id: "bar", name: "Bar Chart", icon: <BarChart />, category: "bar", requiredFields: { axis: 1, value: 1 } },
  { id: "column", name: "Column Chart", icon: <BarChart sx={{ transform: "rotate(90deg)" }} />, category: "bar", requiredFields: { axis: 1, value: 1 } },
  { id: "stacked-bar", name: "Stacked Bar", icon: <BarChart />, category: "bar", requiredFields: { axis: 1, value: 1, legend: 1 } },
  { id: "grouped-bar", name: "Grouped Bar", icon: <BarChart />, category: "bar", requiredFields: { axis: 1, value: 1, legend: 1 } },
  { id: "line", name: "Line Chart", icon: <ShowChart />, category: "line", requiredFields: { axis: 1, value: 1 } },
  { id: "area", name: "Area Chart", icon: <ShowChart />, category: "line", requiredFields: { axis: 1, value: 1 } },
  { id: "pie", name: "Pie Chart", icon: <PieChart />, category: "pie", requiredFields: { axis: 1, value: 1 } },
  { id: "donut", name: "Donut Chart", icon: <DonutLarge />, category: "pie", requiredFields: { axis: 1, value: 1 } },
  { id: "scatter", name: "Scatter Plot", icon: <ScatterPlot />, category: "scatter", requiredFields: { axis: 1, value: 1 } },
  { id: "bubble", name: "Bubble Chart", icon: <BubbleChart />, category: "scatter", requiredFields: { axis: 1, value: 1 } },
  { id: "radar", name: "Radar Chart", icon: <Radar />, category: "other", requiredFields: { axis: 1, value: 1 } },
  { id: "heatmap", name: "Heatmap", icon: <GridOn />, category: "other", requiredFields: { axis: 1, value: 1, legend: 1 } },
  { id: "funnel", name: "Funnel Chart", icon: <FilterAlt />, category: "other", requiredFields: { axis: 1, value: 1 } },
  { id: "gauge", name: "Gauge", icon: <Speed />, category: "other", requiredFields: { value: 1 } },
  { id: "table", name: "Table", icon: <TableChart />, category: "table", requiredFields: { axis: 1 } },
  { id: "kpi", name: "KPI Card", icon: <Calculate />, category: "other", requiredFields: { value: 1 } },
  { id: "treemap", name: "Treemap", icon: <GridOn />, category: "other", requiredFields: { axis: 1, value: 1 } },
  { id: "sankey", name: "Sankey", icon: <ShowChart />, category: "other", requiredFields: { axis: 2, value: 1 } },
  { id: "sunburst", name: "Sunburst", icon: <PieChart />, category: "other", requiredFields: { axis: 2, value: 1 } },
];

const CHART_COLORS = [
  "#2563eb", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6",
  "#f97316", "#6366f1", "#84cc16", "#22d3ee"
];

// ============================================================================
// Utility Functions
// ============================================================================

const safeDisplayValue = (value: any): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return "[Complex Object]";
    }
  }
  return String(value);
};

const getRowColor = (index: number) => ({
  backgroundColor: index % 2 === 0 ? "transparent" : "rgba(0,0,0,0.02)",
});

// ============================================================================
// ECharts Option Builders (unchanged - keeping all chart builders)
// ============================================================================

const getBarChartOption = (
  data: any[],
  xAxisCol: string,
  yAxisCols: string[],
  palette: string[],
  type: string,
  is3D: boolean
): echarts.EChartsOption => {
  const isStacked = type === 'stacked-bar';
  const isGrouped = type === 'grouped-bar';

  if (is3D) {
    const categories = data.map(item => item[xAxisCol]);
    const seriesData = yAxisCols.map((col, index) => ({
      name: col,
      type: 'bar3D' as any,
      data: data.map((item, i) => ({
        value: [i, item[col], 0],
      })),
      barWidth: 20,
      itemStyle: { color: palette[index % palette.length] },
      shading: 'realistic' as any,
      realisticMaterial: { roughness: 0.3, metalness: 0.1 } as any,
    }));

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: yAxisCols, bottom: 0 },
      grid3D: {
        viewControl: { projection: 'perspective', autoRotate: true, autoRotateSpeed: 10, distance: 200 },
        boxWidth: 100, boxHeight: 80, boxDepth: 80,
      },
      xAxis3D: { type: 'category', data: categories },
      yAxis3D: { type: 'value' },
      zAxis3D: { type: 'value' },
      series: seriesData,
    };
  }

  return {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e5e7eb', borderWidth: 1 },
    legend: { data: yAxisCols, bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(item => item[xAxisCol]),
      axisLabel: { fontSize: 11, color: '#6b7280', rotate: data.length > 6 ? 45 : 0 },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#6b7280' },
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
    },
    series: yAxisCols.map((col, index) => ({
      name: col,
      type: 'bar' as const,
      data: data.map(item => item[col]),
      itemStyle: { color: palette[index % palette.length], borderRadius: isStacked ? 0 : [4, 4, 0, 0] },
      stack: isStacked ? 'total' : undefined,
      barGap: isGrouped ? '20%' : '30%',
    })),
  };
};

const getLineChartOption = (
  data: any[],
  xAxisCol: string,
  yAxisCols: string[],
  palette: string[],
  is3D: boolean
): echarts.EChartsOption => {
  if (is3D) {
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: yAxisCols, bottom: 0 },
      grid3D: {
        viewControl: { projection: 'perspective', autoRotate: true, autoRotateSpeed: 10, distance: 200 },
        boxWidth: 100, boxHeight: 80, boxDepth: 80,
      },
      xAxis3D: { type: 'category', data: data.map(item => item[xAxisCol]) },
      yAxis3D: { type: 'value' },
      zAxis3D: { type: 'value' },
      series: yAxisCols.map((col, index) => ({
        name: col,
        type: 'line3D' as any,
        data: data.map((item, i) => [i, item[col], 0]),
        lineStyle: { width: 3, color: palette[index % palette.length] },
        itemStyle: { color: palette[index % palette.length] },
        shading: 'realistic' as any,
      })),
    };
  }

  return {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)' },
    legend: { data: yAxisCols, bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: data.map(item => item[xAxisCol]),
      axisLabel: { fontSize: 11, color: '#6b7280', rotate: data.length > 6 ? 45 : 0 },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#6b7280' },
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
    },
    series: yAxisCols.map((col, index) => ({
      name: col,
      type: 'line' as const,
      data: data.map(item => item[col]),
      smooth: true,
      symbolSize: 6,
      lineStyle: { width: 2, color: palette[index % palette.length] },
      itemStyle: { color: palette[index % palette.length] },
    })),
  };
};

const getAreaChartOption = (
  data: any[],
  xAxisCol: string,
  yAxisCols: string[],
  palette: string[]
): echarts.EChartsOption => ({
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)' },
  legend: { data: yAxisCols, bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
  grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
  xAxis: {
    type: 'category',
    data: data.map(item => item[xAxisCol]),
    axisLabel: { fontSize: 11, color: '#6b7280', rotate: data.length > 6 ? 45 : 0 },
    axisLine: { lineStyle: { color: '#e5e7eb' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { fontSize: 11, color: '#6b7280' },
    splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
  },
  series: yAxisCols.map((col, index) => ({
    name: col,
    type: 'line' as const,
    data: data.map(item => item[col]),
    smooth: true,
    symbolSize: 4,
    lineStyle: { width: 2, color: palette[index % palette.length] },
    itemStyle: { color: palette[index % palette.length] },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: palette[index % palette.length] + '80' },
        { offset: 1, color: palette[index % palette.length] + '10' },
      ]),
    },
  })),
});

const getPieChartOption = (
  data: any[],
  labelDim: string,
  valueMetric: string,
  palette: string[],
  type: string
): echarts.EChartsOption => {
  const isDonut = type === 'donut';
  const groupedData: Record<string, number> = {};

  data.forEach((row: any) => {
    const label = safeDisplayValue(row[labelDim]);
    const value = Number(row[valueMetric]) || 0;
    groupedData[label] = (groupedData[label] || 0) + value;
  });

  const pieData = Object.entries(groupedData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `${params.name}<br/>Value: ${params.value}<br/>Percentage: ${params.percent}%`,
    },
    legend: { data: pieData.map(item => item.name), bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
    series: [{
      type: 'pie' as const,
      radius: isDonut ? ['40%', '70%'] : ['0%', '70%'],
      center: ['50%', '45%'],
      data: pieData.map((item, index) => ({
        ...item,
        itemStyle: { color: palette[index % palette.length] },
      })),
      label: { show: true, formatter: '{b}\n({d}%)', fontSize: 11, color: '#6b7280' },
      labelLine: { length: 10, length2: 15 },
      emphasis: { scaleSize: 10, itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.2)' } },
    }],
  };
};

const getScatterChartOption = (
  data: any[],
  xAxisCol: string,
  yAxisCols: string[],
  palette: string[],
  is3D: boolean
): echarts.EChartsOption => {
  if (is3D) {
    return {
      tooltip: { trigger: 'item' },
      grid3D: {
        viewControl: { projection: 'perspective', autoRotate: true, autoRotateSpeed: 10, distance: 200 },
        boxWidth: 100, boxHeight: 80, boxDepth: 80,
      },
      xAxis3D: { type: 'value', name: xAxisCol },
      yAxis3D: { type: 'value' },
      zAxis3D: { type: 'value' },
      series: [{
        type: 'scatter3D' as any,
        data: data.map(item => [item[xAxisCol], yAxisCols[0] ? item[yAxisCols[0]] : 0, 0]),
        itemStyle: { color: palette[0] },
        symbolSize: 12,
      }],
    };
  }

  return {
    tooltip: { trigger: 'item' },
    grid: { left: '3%', right: '4%', bottom: '8%', top: '8%', containLabel: true },
    xAxis: {
      type: 'value',
      name: xAxisCol,
      axisLabel: { fontSize: 11, color: '#6b7280' },
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#6b7280' },
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
    },
    series: yAxisCols.map((col, index) => ({
      name: col,
      type: 'scatter' as const,
      data: data.map(item => ({ value: [item[xAxisCol], item[col]], name: item[xAxisCol] })),
      itemStyle: { color: palette[index % palette.length] },
      symbolSize: 10,
    })),
  };
};

const getRadarChartOption = (
  data: any[],
  xAxisCol: string,
  yAxisCols: string[],
  palette: string[]
): echarts.EChartsOption => ({
  tooltip: { trigger: 'item' },
  legend: { data: yAxisCols, bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
  radar: {
    indicator: data.slice(0, 8).map(item => ({
      name: safeDisplayValue(item[xAxisCol]),
      max: Math.max(...data.map(d => Math.max(...yAxisCols.map(col => d[col] || 0)))),
    })),
    shape: 'circle',
    axisName: { color: '#6b7280', fontSize: 11 },
    splitArea: { areaStyle: { color: ['rgba(37,99,235,0.02)'] } },
    axisLine: { lineStyle: { color: '#e5e7eb' } },
  },
  series: yAxisCols.map((col, index) => ({
    name: col,
    type: 'radar' as const,
    data: [{ value: data.slice(0, 8).map(item => item[col] || 0), name: col }],
    itemStyle: { color: palette[index % palette.length] },
    areaStyle: { color: palette[index % palette.length] + '40' },
    lineStyle: { width: 2, color: palette[index % palette.length] },
  })),
});

const getFunnelChartOption = (
  data: any[],
  labelDim: string,
  valueMetric: string,
  palette: string[]
): echarts.EChartsOption => {
  const funnelData = data.map((item, index) => ({
    name: safeDisplayValue(item[labelDim]),
    value: Number(item[valueMetric]) || 0,
    itemStyle: { color: palette[index % palette.length] },
  }));

  return {
    tooltip: { trigger: 'item', formatter: (params: any) => `${params.name}<br/>Value: ${params.value}` },
    legend: { data: funnelData.map(item => item.name), bottom: 0, type: 'scroll', textStyle: { fontSize: 11 } },
    series: [{
      type: 'funnel' as const,
      left: '10%', right: '10%', top: 20, bottom: 20,
      min: 0,
      max: Math.max(...funnelData.map(d => d.value)),
      sort: 'descending',
      gap: 2,
      label: { show: true, position: 'inside', fontSize: 11, color: '#ffffff' },
      itemStyle: { borderColor: '#ffffff', borderWidth: 1 },
      data: funnelData,
    }],
  };
};

const getGaugeOption = (
  data: any[],
  valueCol: string,
  palette: string[]
): echarts.EChartsOption => {
  const value = Number(data[0]?.[valueCol]) || 0;
  const maxValue = Math.max(...data.map(d => Number(d[valueCol]) || 0)) || 100;

  return {
    series: [{
      type: 'gauge' as const,
      startAngle: 220,
      endAngle: -40,
      min: 0,
      max: maxValue,
      splitNumber: 5,
      progress: { show: true, width: 18, roundCap: true, itemStyle: { color: palette[0] } },
      pointer: { show: true, length: '60%', width: 6, itemStyle: { color: '#1f2937' } },
      axisLine: { lineStyle: { width: 18, color: [[0.3, '#ef4444'], [0.7, '#f59e0b'], [1, '#10b981']] as [number, string][] } },
      axisTick: { distance: -10, length: 8, lineStyle: { color: '#6b7280', width: 1 } },
      splitLine: { distance: -10, length: 12, lineStyle: { color: '#1f2937', width: 2 } },
      axisLabel: { color: '#6b7280', fontSize: 11, distance: 10 },
      detail: { valueAnimation: true, formatter: '{value}', color: '#1f2937', fontSize: 24, fontWeight: 700, offsetCenter: [0, '40%'] },
      data: [{ value }],
    }],
  };
};

const getTreemapOption = (
  data: any[],
  hierarchy: string[],
  valueKey: string,
  palette: string[]
): echarts.EChartsOption => {
  const buildTree = (items: any[], depth: number = 0): any[] => {
    if (depth >= hierarchy.length) return [];
    const grouped = items.reduce((acc: any, item: any) => {
      const key = safeDisplayValue(item[hierarchy[depth]]);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, children]: [string, any]) => ({
      name,
      value: children.reduce((sum: number, child: any) => sum + (Number(child[valueKey]) || 0), 0),
      children: buildTree(children, depth + 1),
    }));
  };

  return {
    tooltip: { trigger: 'item', formatter: (params: any) => `${params.name}<br/>Value: ${params.value}` },
    series: [{
      type: 'treemap' as const,
      data: buildTree(data),
      leafDepth: hierarchy.length,
      label: { show: true, fontSize: 11, color: '#1f2937' },
      itemStyle: { borderColor: '#ffffff', borderWidth: 2, gapWidth: 2 },
      color: palette,
      levels: hierarchy.map(() => ({ itemStyle: { borderColor: '#ffffff', borderWidth: 1, gapWidth: 1 } })),
    }],
  };
};

const getSankeyOption = (
  data: any[],
  sourceKey: string,
  targetKey: string,
  valueKey: string
): echarts.EChartsOption => {
  const nodes: any[] = [];
  const links: any[] = [];
  const nodeMap = new Map();

  data.forEach((row: any) => {
    const source = safeDisplayValue(row[sourceKey]);
    const target = safeDisplayValue(row[targetKey]);
    const value = Number(row[valueKey]) || 0;
    if (!nodeMap.has(source)) { nodeMap.set(source, true); nodes.push({ name: source }); }
    if (!nodeMap.has(target)) { nodeMap.set(target, true); nodes.push({ name: target }); }
    links.push({ source, target, value });
  });

  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'sankey' as const,
      emphasis: { focus: 'adjacency' },
      nodeAlign: 'justify',
      nodeWidth: 20,
      nodeGap: 8,
      draggable: true,
      data: nodes,
      links,
      label: { fontSize: 11, color: '#1f2937' },
      lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.4 },
    }],
  };
};

const getSunburstChartOption = (
  data: any[],
  hierarchy: string[],
  valueKey: string,
  palette: string[]
): echarts.EChartsOption => {
  const buildTree = (items: any[], depth: number = 0): any[] => {
    if (depth >= hierarchy.length) return [];
    const grouped = items.reduce((acc: any, item: any) => {
      const key = safeDisplayValue(item[hierarchy[depth]]);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
    return Object.entries(grouped).map(([name, children]: [string, any]) => ({
      name,
      value: children.reduce((sum: number, child: any) => sum + (Number(child[valueKey]) || 0), 0),
      children: buildTree(children, depth + 1),
    }));
  };

  return {
    tooltip: { trigger: 'item', formatter: (params: any) => `${params.name}<br/>Value: ${params.value}` },
    series: [{
      type: 'sunburst' as const,
      data: buildTree(data),
      radius: [0, '95%'],
      center: ['50%', '50%'],
      label: { rotate: 'radial', fontSize: 11, color: '#1f2937' },
      itemStyle: { borderRadius: 4, borderColor: '#ffffff', borderWidth: 2 },
      levels: hierarchy.map((_, index) => ({
        r0: `${index * 20}%`,
        r: `${(index + 1) * 20}%`,
        itemStyle: { borderWidth: index === 0 ? 2 : 1 },
        label: { fontSize: index === 0 ? 12 : 10 },
      })),
      color: palette,
    }],
  };
};

const getHeatmapChartOption = (
  data: any[],
  xAxisCol: string,
  yAxisCol: string,
  valueCol: string,
  palette: string[]
): echarts.EChartsOption => {
  const xLabels = [...new Set(data.map(item => safeDisplayValue(item[xAxisCol])))];
  const yLabels = [...new Set(data.map(item => safeDisplayValue(item[yAxisCol])))];
  const heatmapData = data.map(item => [
    xLabels.indexOf(safeDisplayValue(item[xAxisCol])),
    yLabels.indexOf(safeDisplayValue(item[yAxisCol])),
    Number(item[valueCol]) || 0,
  ]);

  return {
    tooltip: { trigger: 'item', formatter: (params: any) => `${xLabels[params.data[0]]} → ${yLabels[params.data[1]]}<br/>Value: ${params.data[2]}` },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: { type: 'category', data: xLabels, axisLabel: { fontSize: 11, color: '#6b7280' }, splitArea: { show: true } },
    yAxis: { type: 'category', data: yLabels, axisLabel: { fontSize: 11, color: '#6b7280' }, splitArea: { show: true } },
    visualMap: {
      min: Math.min(...heatmapData.map(d => d[2])),
      max: Math.max(...heatmapData.map(d => d[2])),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#f3f4f6', ...palette] },
    },
    series: [{ type: 'heatmap' as const, data: heatmapData, label: { show: true, fontSize: 10, color: '#1f2937' } }],
  };
};

// ============================================================================
// ECharts Renderer Component
// ============================================================================

interface EChartsRendererProps {
  data: any;
  type: string;
  config?: any;
  is3D?: boolean;
}

const EChartsRenderer: React.FC<EChartsRendererProps> = ({ data, type, config, is3D = false }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const theme = useTheme();

  const rows = data?.data || [];
  const columns = data?.columns || [];
  const palette = data?.meta?.palette || CHART_COLORS;

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current, null, {
      renderer: 'canvas',
      width: chartRef.current.clientWidth,
      height: chartRef.current.clientHeight,
    });

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
    if (!chartInstance.current || rows.length === 0) return;

    const typeLower = type?.toLowerCase() || "";
    const numericColumns = columns.filter((col: any) =>
      ['int', 'float', 'double', 'decimal', 'number'].includes(col.type)
    );
    const stringColumns = columns.filter((col: any) =>
      ['string', 'text', 'varchar'].includes(col.type)
    );

    const xAxisCol = config?.xAxis || stringColumns[0]?.id || columns[0]?.id;
    // ✅ FIXED: Handle empty numeric columns gracefully
    const yAxisCols = config?.yAxis && Array.isArray(config.yAxis) && config.yAxis.length > 0
      ? config.yAxis
      : numericColumns.slice(0, 2).map((c: any) => c.id);
    const labelDim = config?.labelDim || stringColumns[0]?.id || columns[0]?.id;
    const valueMetric = config?.valueMetric || numericColumns[0]?.id || columns[1]?.id;
    const hierarchy = config?.hierarchy || [stringColumns[0]?.id, stringColumns[1]?.id].filter(Boolean);
    const sourceKey = config?.source || stringColumns[0]?.id;
    const targetKey = config?.target || stringColumns[1]?.id;
    const yAxisCol = config?.yAxis?.[0] || yAxisCols[0] || stringColumns[1]?.id || columns[1]?.id;

    const chartData = rows.map((row: any) => {
      const obj: any = { ...row };
      yAxisCols.forEach((col: string) => {
        if (obj[col] !== undefined && obj[col] !== null) obj[col] = Number(obj[col]);
      });
      return obj;
    });

    let option: echarts.EChartsOption = {};
    const supports3D = ['bar', 'column', 'line', 'scatter'].includes(typeLower);
    const use3D = is3D && supports3D;

    switch (typeLower) {
      case 'bar': case 'column': case 'stacked-bar': case 'grouped-bar':
        option = getBarChartOption(chartData, xAxisCol, yAxisCols, palette, typeLower, use3D);
        break;
      case 'line':
        option = getLineChartOption(chartData, xAxisCol, yAxisCols, palette, use3D);
        break;
      case 'area':
        option = getAreaChartOption(chartData, xAxisCol, yAxisCols, palette);
        break;
      case 'pie': case 'donut':
        option = getPieChartOption(chartData, labelDim, valueMetric, palette, typeLower);
        break;
      case 'scatter': case 'bubble':
        option = getScatterChartOption(chartData, xAxisCol, yAxisCols, palette, use3D);
        break;
      case 'radar':
        option = getRadarChartOption(chartData, xAxisCol, yAxisCols, palette);
        break;
      case 'treemap':
        option = getTreemapOption(chartData, hierarchy, valueMetric, palette);
        break;
      case 'gauge': case 'kpi':
        option = getGaugeOption(chartData, valueMetric, palette);
        break;
      case 'funnel':
        option = getFunnelChartOption(chartData, labelDim, valueMetric, palette);
        break;
      case 'heatmap':
        option = getHeatmapChartOption(chartData, xAxisCol, yAxisCol, valueMetric, palette);
        break;
      case 'sankey':
        option = getSankeyOption(chartData, sourceKey, targetKey, valueMetric);
        break;
      case 'sunburst':
        option = getSunburstChartOption(chartData, hierarchy, valueMetric, palette);
        break;
      default:
        option = {
          title: { text: 'Unsupported chart type', left: 'center', top: 'center', textStyle: { color: '#6b7280', fontSize: 14 } },
        };
        break;
    }

    option = {
      ...option,
      backgroundColor: 'transparent',
      textStyle: { color: theme.palette.text.primary },
    };

    chartInstance.current.clear();
    chartInstance.current.setOption(option, true);
    chartInstance.current.resize();
  }, [data, type, config, is3D, theme, rows, columns]);

  if (rows.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
        <Typography color="textSecondary" variant="body2">No data available</Typography>
      </Box>
    );
  }

  return <div ref={chartRef} style={{ width: '100%', height: '100%', minHeight: 200 }} />;
};

// ============================================================================
// Table Widget Component
// ============================================================================

const TableWidget: React.FC<{ data: any }> = ({ data }) => {
  const theme = useTheme();
  const rows = data?.data || [];
  const [localPage, setLocalPage] = useState(0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(5);

  if (rows.length === 0) {
    return <Typography color="textSecondary" variant="body2">No data available</Typography>;
  }

  const columns = Object.keys(rows[0]).filter((key) => !key.startsWith("_") && key !== "meta");
  const paginatedRows = rows.slice(localPage * localRowsPerPage, localPage * localRowsPerPage + localRowsPerPage);

  return (
    <Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
              {columns.map((col) => (
                <TableCell key={col} sx={{ fontWeight: 600, fontSize: 11 }}>
                  {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row: any, idx: number) => (
              <TableRow key={idx} hover sx={getRowColor(idx)}>
                {columns.map((col) => (
                  <TableCell key={col} sx={{ fontSize: 11, py: 0.5 }}>
                    {safeDisplayValue(row[col])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {rows.length > localRowsPerPage && (
        <TablePagination
          component="div"
          count={rows.length}
          page={localPage}
          onPageChange={(_, newPage) => setLocalPage(newPage)}
          rowsPerPage={localRowsPerPage}
          onRowsPerPageChange={(e) => {
            setLocalRowsPerPage(parseInt(e.target.value, 10));
            setLocalPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{ fontSize: 11 }}
        />
      )}
    </Box>
  );
};

// ============================================================================
// KPI Widget Component
// ============================================================================

const KPIWidget: React.FC<{ data: any; title: string }> = ({ data, title }) => {
  const theme = useTheme();
  const rows = data?.data || [];
  if (rows.length === 0) {
    return <Typography color="textSecondary" variant="body2">No KPI data</Typography>;
  }

  const firstRow = rows[0] || {};
  const numericKeys = Object.keys(firstRow).filter(key =>
    !isNaN(parseFloat(firstRow[key])) && typeof firstRow[key] === 'number'
  );

  if (numericKeys.length === 0) {
    return <Typography color="textSecondary" variant="body2">No numeric data</Typography>;
  }

  const value = firstRow[numericKeys[0]];
  const label = numericKeys[0].replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
      <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>
        {safeDisplayValue(value)}
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
        {title}
      </Typography>
    </Box>
  );
};

// ============================================================================
// Draggable Field Item
// ============================================================================

interface DraggableFieldProps {
  field: BIField;
  onAdd: (field: BIField) => void;
}

function DraggableField({ field, onAdd }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `field-${field.id}`,
    data: { field },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  };

  const getIcon = () => {
    if (field.type === "metric") return <Functions fontSize="small" className="!text-blue-500 !w-4 !h-4" />;
    if (field.type === "date") return <CalendarToday fontSize="small" className="!text-orange-500 !w-4 !h-4" />;
    return <Category fontSize="small" className="!text-green-500 !w-4 !h-4" />;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-100/20 cursor-grab active:cursor-grabbing group transition-colors"
      onDoubleClick={() => onAdd(field)}
    >
      {getIcon()}
      <span className="text-xs text-gray-700 flex-1 truncate">{field.name}</span>
      {field.aggregation && (
        <Chip label={field.aggregation.toUpperCase()} size="small" className="bg-gray-200 text-gray-500" sx={{ height: 16, fontSize: "9px" }} />
      )}
      <IconButton
        size="small"
        className="opacity-0 group-hover:opacity-100 !p-0.5"
        onClick={(e) => { e.stopPropagation(); onAdd(field); }}
      >
        <Add fontSize="small" className="!w-3 !h-3 text-blue-500" />
      </IconButton>
    </div>
  );
}

// ============================================================================
// Drop Zone (Field Well)
// ============================================================================

interface FieldWellProps {
  id: string;
  label: string;
  fields: FieldMapping[];
  onRemove: (fieldId: string) => void;
  onDrop: (wellId: string, field: BIField) => void;
  acceptedTypes?: ("dimension" | "metric" | "date")[];
}

function FieldWell({ id, label, fields, onRemove }: FieldWellProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`border border-dashed rounded p-2 min-h-[60px] transition-colors ${
        isOver ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50"
      }`}
    >
      <Typography variant="caption" className="text-gray-500 text-[10px] uppercase tracking-wide">
        {label}
      </Typography>
      <div className="mt-1 space-y-1">
        {fields.map((f) => (
          <div
            key={f.fieldId}
            className="flex items-center gap-1 bg-white rounded px-2 py-1 border border-gray-200 text-xs"
          >
            <span className="flex-1 truncate text-gray-800">{f.fieldId}</span>
            {f.aggregation && (
              <Chip label={f.aggregation.toUpperCase()} size="small" sx={{ height: 16, fontSize: "9px" }} />
            )}
            <IconButton size="small" onClick={() => onRemove(f.fieldId)} className="!p-0.5">
              <Close fontSize="small" className="!w-3 !h-3 text-gray-800" />
            </IconButton>
          </div>
        ))}
        {fields.length === 0 && (
          <Typography variant="caption" className="text-gray-400 text-[10px]">
            Drag fields here
          </Typography>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Canvas Visual Item (Draggable & Resizable)
// ============================================================================

interface CanvasVisualProps {
  visual: VisualConfig;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onResize: (width: number, height: number) => void;
  onMove: (x: number, y: number) => void;
  onEdit: () => void;
}

function CanvasVisual({ visual, isSelected, onSelect, onDelete, onEdit }: CanvasVisualProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `visual-${visual.id}`,
    data: { visual, isVisual: true }, // ✅ Mark as visual for drag end handling
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.7 : 1,
    left: visual.x,
    top: visual.y,
    width: visual.width,
    height: visual.height,
    zIndex: isSelected ? 10 : 1,
  };

  const renderContent = () => {
    if (!visual.data) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <DashboardIcon sx={{ fontSize: 32, color: '#d1d5db', mb: 1 }} />
          <Typography variant="caption" className="text-gray-400">
            Drop fields to configure
          </Typography>
        </div>
      );
    }

    if (visual.type === "table") {
      return <TableWidget data={visual.data} />;
    }

    if (visual.type === "kpi") {
      return <KPIWidget data={visual.data} title={visual.title} />;
    }

    return (
      <EChartsRenderer
        data={visual.data}
        type={visual.type}
        config={{
          xAxis: visual.fields.find(f => f.role === "axis")?.fieldId,
          yAxis: visual.fields.filter(f => f.role === "value").map(f => f.fieldId),
          labelDim: visual.fields.find(f => f.role === "axis")?.fieldId,
          valueMetric: visual.fields.find(f => f.role === "value")?.fieldId,
        }}
        is3D={visual.config.is3D}
      />
    );
  };

  return (
    <div
      ref={setNodeRef}
      className={`absolute bg-white rounded-lg border-2 transition-all group shadow-sm ${
        isSelected ? "border-blue-500 shadow-lg" : "border-gray-200 hover:border-gray-300"
      }`}
      style={style}
      onClick={onSelect}
    >
      <div
        className="flex items-center justify-between px-2 py-1 border-b border-gray-200 cursor-move bg-gray-50 rounded-t-lg"
        {...listeners}
        {...attributes}
      >
        <div className="flex items-center gap-1">
          <DragIndicatorIcon className="!w-3 !h-3 text-gray-400" />
          <Typography variant="caption" className="font-medium text-gray-700 truncate">
            {visual.title}
          </Typography>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <IconButton size="small" className="!p-0.5" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Settings fontSize="small" className="!w-3 !h-3 text-gray-800" />
          </IconButton>
          <IconButton size="small" className="!p-0.5" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
            <Delete fontSize="small" className="!w-3 !h-3 !text-red-500" />
          </IconButton>
        </div>
      </div>
      <div className="w-full" style={{ height: visual.height - 32 }}>
        {renderContent()}
      </div>
    </div>
  );
}

// ============================================================================
// Field Panel Component
// ============================================================================

interface FieldPanelProps {
  datasets: any[];
  selectedDataset: string;
  onDatasetChange: (id: string) => void;
  schema: any;
  onAddField: (field: BIField) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

function FieldPanel({ datasets, selectedDataset, onDatasetChange, schema, onAddField, searchQuery, onSearchChange }: FieldPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    dimensions: true,
    metrics: true,
    dates: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const dimensions: BIField[] = (schema?.dimensions || [])
    .filter((d: any) => d.id.toLowerCase().includes(searchQuery.toLowerCase()))
    .map((d: any) => ({ id: d.id, name: d.id, type: "dimension", dataType: d.type, description: d.label }));

  const metrics: BIField[] = (schema?.metrics || [])
    .filter((m: any) => m.id.toLowerCase().includes(searchQuery.toLowerCase()))
    .map((m: any) => ({ id: m.id, name: m.id, type: "metric", dataType: m.type, aggregation: m.aggregation }));

  const dateFields: BIField[] = (schema?.dateFields || [])
    .filter((d: any) => d.id.toLowerCase().includes(searchQuery.toLowerCase()))
    .map((d: any) => ({ id: d.id, name: d.id, type: "date", dataType: d.type }));

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-gray-200">
        <FormControl fullWidth size="small">
          {/* <InputLabel className="!text-xs">Dataset</InputLabel> */}
          <Select
            value={selectedDataset}
            onChange={(e) => onDatasetChange(e.target.value)}
            label="Dataset"
            className="!text-xs"
          >
            {datasets.map((ds) => (
              <MenuItem key={ds.datasetId} value={ds.datasetId}>
                <div>
                  <div className="text-xs">{ds.title || ds.datasetId}</div>
                  {!ds.available && <div className="text-[10px] text-orange-500">Coming Soon</div>}
                </div>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <div className="p-2 border-b border-gray-200">
        <TextField
          fullWidth
          size="small"
          placeholder="Search fields..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="!text-xs"
          
        />
      </div>

      <div className="flex-1 overflow-auto">
        {/* Dimensions */}
        <div className="border-b border-gray-200">
          <div
            className="flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection("dimensions")}
          >
            {expandedSections.dimensions ? <ExpandLess fontSize="small" className="!w-4 !h-4 text-gray-800" /> : <ExpandMore fontSize="small" className="!w-4 !h-4 text-gray-800" />}
            <Typography variant="caption" className="font-semibold text-gray-600">
              Dimensions ({dimensions.length})
            </Typography>
          </div>
          <Collapse in={expandedSections.dimensions}>
            {dimensions.map((field) => (
              <DraggableField key={field.id} field={field} onAdd={onAddField} />
            ))}
            {dimensions.length === 0 && (
              <div className="px-4 py-2 text-[10px] text-gray-400">No dimensions found</div>
            )}
          </Collapse>
        </div>

        {/* Metrics */}
        <div className="border-b border-gray-200">
          <div
            className="flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection("metrics")}
          >
            {expandedSections.metrics ? <ExpandLess fontSize="small" className="!w-4 !h-4 text-gray-800" /> : <ExpandMore fontSize="small" className="!w-4 !h-4 text-gray-800" />}
            <Typography variant="caption" className="font-semibold text-gray-600">
              Metrics ({metrics.length})
            </Typography>
          </div>
          <Collapse in={expandedSections.metrics}>
            {metrics.map((field) => (
              <DraggableField key={field.id} field={field} onAdd={onAddField} />
            ))}
            {metrics.length === 0 && (
              <div className="px-4 py-2 text-[10px] text-gray-400">No metrics found</div>
            )}
          </Collapse>
        </div>

        {/* Date Fields */}
        <div className="border-b border-gray-200">
          <div
            className="flex items-center gap-1 px-2 py-1.5 cursor-pointer hover:bg-gray-50"
            onClick={() => toggleSection("dates")}
          >
            {expandedSections.dates ? <ExpandLess fontSize="small" className="!w-4 !h-4 text-gray-800" /> : <ExpandMore fontSize="small" className="!w-4 !h-4 text-gray-800" />}
            <Typography variant="caption" className="font-semibold text-gray-600">
              Date Fields ({dateFields.length})
            </Typography>
          </div>
          <Collapse in={expandedSections.dates}>
            {dateFields.map((field) => (
              <DraggableField key={field.id} field={field} onAdd={onAddField} />
            ))}
            {dateFields.length === 0 && (
              <div className="px-4 py-2 text-[10px] text-gray-400">No date fields found</div>
            )}
          </Collapse>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Visualization Panel Component
// ============================================================================

interface VisualizationPanelProps {
  selectedVisual: VisualConfig | null;
  onUpdateVisual: (updates: Partial<VisualConfig>) => void;
  onFieldDrop: (wellId: string, field: BIField) => void;
  onRemoveField: (wellId: string) => void;
}

function VisualizationPanel({ selectedVisual, onUpdateVisual, onFieldDrop, onRemoveField }: VisualizationPanelProps) {
  if (!selectedVisual) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 text-center">
        <Dashboard sx={{ fontSize: 48, color: "#d1d5db", mb: 2 }} />
        <Typography variant="body2" className="text-gray-400">
          Select a visual to configure
        </Typography>
        <Typography variant="caption" className="text-gray-300 mt-1">
          Or drag fields from the left panel onto the canvas
        </Typography>
      </div>
    );
  }

  const axisFields = selectedVisual.fields.filter((f) => f.role === "axis");
  const valueFields = selectedVisual.fields.filter((f) => f.role === "value");
  const legendFields = selectedVisual.fields.filter((f) => f.role === "legend");

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Chart Type Selector */}
      <div className="p-2 border-b border-gray-200">
        <Typography variant="caption" className="font-semibold text-gray-600 mb-1 block">
          Visual Type
        </Typography>
        <div className="grid grid-cols-6 gap-1">
          {CHART_TYPES.slice(0, 12).map((ct) => (
            <Tooltip key={ct.id} title={ct.name}>
              <IconButton
                size="small"
                className={`!rounded ${selectedVisual.type === ct.id ? "!bg-blue-100 !text-blue-600" : "!text-gray-500"}`}
                onClick={() => onUpdateVisual({ type: ct.id })}
              >
                <span className="!w-4 !h-4 flex items-center justify-center">{ct.icon}</span>
              </IconButton>
            </Tooltip>
          ))}
        </div>
      </div>

      {/* Field Wells */}
      <div className="p-2 space-y-2 border-b border-gray-200">
        <Typography variant="caption" className="font-semibold text-gray-600 block">
          Fields
        </Typography>

        {selectedVisual.type !== "kpi" && selectedVisual.type !== "gauge" && (
          <FieldWell
            id="well-axis"
            label={selectedVisual.type === "pie" || selectedVisual.type === "donut" ? "Category" : "Axis"}
            fields={axisFields}
            onRemove={() => onRemoveField("axis")}
            onDrop={onFieldDrop}
          />
        )}

        <FieldWell
          id="well-value"
          label="Values"
          fields={valueFields}
          onRemove={() => onRemoveField("value")}
          onDrop={onFieldDrop}
        />

        {["bar", "column", "line", "area", "stacked-bar", "grouped-bar", "scatter"].includes(selectedVisual.type) && (
          <FieldWell
            id="well-legend"
            label="Legend / Series"
            fields={legendFields}
            onRemove={() => onRemoveField("legend")}
            onDrop={onFieldDrop}
          />
        )}
      </div>

      {/* Properties */}
      <div className="p-2 space-y-6">
        <Typography variant="caption" className="font-semibold text-gray-600 block">
          Properties
        </Typography>

        <TextField
          fullWidth
          size="small"
          label="Title"
          value={selectedVisual.title}
          onChange={(e) => onUpdateVisual({ title: e.target.value })}
          className="!text-xs"
        />

        <FormControlLabel
          control={
            <Switch
              checked={selectedVisual.config.is3D || false}
              onChange={(e) => onUpdateVisual({ config: { ...selectedVisual.config, is3D: e.target.checked } })}
              size="small"
            />
          }
          label={<Typography variant="caption" className="text-gray-800">3D View</Typography>}
        />

        {["bar", "column", "line", "area", "pie", "donut", "scatter"].includes(selectedVisual.type) && (
          <FormControlLabel
            control={
              <Switch
                checked={selectedVisual.config.showLegend !== false}
                onChange={(e) => onUpdateVisual({ config: { ...selectedVisual.config, showLegend: e.target.checked } })}
                size="small"
              />
            }
            label={<Typography variant="caption" className="text-gray-800">Show Legend</Typography>}
          />
        )}

        {["bar", "column", "pie", "donut"].includes(selectedVisual.type) && (
          <FormControlLabel
            control={
              <Switch
                checked={selectedVisual.config.showLabels !== false}
                onChange={(e) => onUpdateVisual({ config: { ...selectedVisual.config, showLabels: e.target.checked } })}
                size="small"
              />
            }
            label={<Typography variant="caption" className="text-gray-800">Show Labels</Typography>}
          />
        )}

        <div>
          <Typography variant="caption" className="text-gray-600">Data Limit</Typography>
          <Slider
            value={selectedVisual.config.limit || 100}
            onChange={(_, value) => onUpdateVisual({ config: { ...selectedVisual.config, limit: value as number } })}
            min={10}
            max={1000}
            step={10}
            size="small"
            valueLabelDisplay="auto"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Canvas Drop Zone Component
// ============================================================================

interface CanvasDropZoneProps {
  visuals: VisualConfig[];
  selectedVisualId: string | null;
  onSelectVisual: (id: string | null) => void;
  onDeleteVisual: (id: string) => void;
  onUpdateVisual: (id: string, updates: Partial<VisualConfig>) => void;
  onAddVisual: (type: string) => void;
  isDragOver: boolean;
}

function CanvasDropZone({ visuals, selectedVisualId, onSelectVisual, onDeleteVisual, onUpdateVisual, isDragOver }: CanvasDropZoneProps) {
  const { setNodeRef } = useDroppable({ id: "canvas" });

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-[600px] w-full transition-colors ${
        isDragOver ? "bg-blue-50/50 ring-2 ring-blue-300 ring-inset" : ""
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelectVisual(null);
      }}
    >
      {visuals.map((visual) => (
        <CanvasVisual
          key={visual.id}
          visual={visual}
          isSelected={selectedVisualId === visual.id}
          onSelect={() => onSelectVisual(visual.id)}
          onDelete={() => onDeleteVisual(visual.id)}
          onResize={(w, h) => onUpdateVisual(visual.id, { width: w, height: h })}
          onMove={(x, y) => onUpdateVisual(visual.id, { x, y })}
          onEdit={() => onSelectVisual(visual.id)}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Main Power BI Workspace Component
// ============================================================================

export default function PowerBIWorkspace() {
  const { showSnackbar } = useUI();
//   const theme = useTheme();

  // State
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [schema, setSchema] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visuals, setVisuals] = useState<VisualConfig[]>([]);
  const [selectedVisualId, setSelectedVisualId] = useState<string | null>(null);
  const [dragOverCanvas, setDragOverCanvas] = useState(false);
  const [loading, setLoading] = useState(false);
  const [undoStack, setUndoStack] = useState<VisualConfig[][]>([]);
  const [redoStack, setRedoStack] = useState<VisualConfig[][]>([]);
  const [activeDragField, setActiveDragField] = useState<BIField | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const selectedVisual = visuals.find((v) => v.id === selectedVisualId) || null;

  // Load datasets on mount
  useEffect(() => {
    loadDatasets();
  }, []);

  // Load schema when dataset changes
  useEffect(() => {
    if (selectedDataset) {
      loadSchema(selectedDataset);
    } else {
      // ✅ FIXED: Reset schema when no dataset selected
      setSchema(null);
    }
  }, [selectedDataset]);

  const loadDatasets = async () => {
    try {
      const response: any = await dashboardService.listBIDatasets();
      const data = response?.data || [];
      setDatasets(data);
      if (data.length > 0) setSelectedDataset(data[0].datasetId);
    } catch (error) {
      showSnackbar("Failed to load datasets", "error");
    }
  };

  const loadSchema = async (datasetId: string) => {
    try {
      const response: any = await dashboardService.getBIDatasetSchema(datasetId);
      setSchema(response?.data || null);
    } catch (error) {
      showSnackbar("Failed to load schema", "error");
    }
  };

  // Undo/Redo
  const saveState = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-20), visuals]);
    setRedoStack([]);
  }, [visuals]);

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, visuals]);
    setVisuals(previous);
    setUndoStack((prev) => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, visuals]);
    setVisuals(next);
    setRedoStack((prev) => prev.slice(0, -1));
  };

  // Add visual to canvas
  const addVisual = (type: string, field?: BIField) => {
    saveState();
    const id = `visual-${Date.now()}`;
    const newVisual: VisualConfig = {
      id,
      type,
      title: `New ${CHART_TYPES.find((c) => c.id === type)?.name || "Visual"}`,
      fields: field ? [{ fieldId: field.id, role: field.type === "metric" ? "value" : "axis" }] : [],
      x: 20 + (visuals.length % 3) * 30,
      y: 20 + Math.floor(visuals.length / 3) * 30,
      width: 400,
      height: 280,
      config: { showLegend: true, showLabels: true, limit: 100, is3D: false },
    };
    setVisuals((prev) => [...prev, newVisual]);
    setSelectedVisualId(id);
    return id;
  };

  const deleteVisual = (id: string) => {
    saveState();
    setVisuals((prev) => prev.filter((v) => v.id !== id));
    if (selectedVisualId === id) setSelectedVisualId(null);
  };

  const updateVisual = (id: string, updates: Partial<VisualConfig>) => {
    setVisuals((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v))
    );
  };

  // Handle field drop on canvas
  const handleFieldDropOnCanvas = (field: BIField) => {
    if (visuals.length === 0) {
      const type = field.type === "metric" ? "kpi" : "bar";
      addVisual(type, field);
    } else if (selectedVisual) {
      const role = field.type === "metric" ? "value" : "axis";
      const existingField = selectedVisual.fields.find((f) => f.fieldId === field.id);
      if (!existingField) {
        updateVisual(selectedVisual.id, {
          fields: [...selectedVisual.fields, { fieldId: field.id, role }],
        });
      }
    } else {
      showSnackbar("Select a visual first or drop on empty canvas to create one", "info");
    }
  };

  // Handle field drop on well
  const handleFieldDropOnWell = (wellId: string, field: BIField) => {
    if (!selectedVisual) return;
    saveState();

    const role = wellId === "well-axis" ? "axis" : wellId === "well-value" ? "value" : "legend";
    const existingFields = selectedVisual.fields.filter((f) => f.role !== role);

    updateVisual(selectedVisual.id, {
      fields: [...existingFields, { fieldId: field.id, role, aggregation: field.aggregation }],
    });
  };

  // Remove field from well
  const handleRemoveFieldFromWell = (wellId: string) => {
    if (!selectedVisual) return;
    saveState();

    const role = wellId === "well-axis" ? "axis" : wellId === "well-value" ? "value" : "legend";
    updateVisual(selectedVisual.id, {
      fields: selectedVisual.fields.filter((f) => f.role !== role),
    });
  };

  // Run query for selected visual
  const handleRunQuery = async () => {
    if (!selectedDataset || !selectedVisual) return;

    setLoading(true);
    try {
      const dimensions = selectedVisual.fields
        .filter((f) => f.role === "axis")
        .map((f) => f.fieldId);
      const metrics = selectedVisual.fields
        .filter((f) => f.role === "value")
        .map((f) => f.fieldId);

      if (dimensions.length === 0 && metrics.length === 0) {
        showSnackbar("Please add fields to the visual", "warning");
        return;
      }

      const query = {
        dimensions,
        metrics,
        limit: selectedVisual.config.limit || 100,
        includeTotals: true,
      };

      const response: any = await dashboardService.runBIQuery(selectedDataset, query);
      updateVisual(selectedVisual.id, { data: response?.data });
      showSnackbar("Query executed successfully", "success");
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to run query", "error");
    } finally {
      setLoading(false);
    }
  };

  // Run all queries
  const handleRunAllQueries = async () => {
    if (!selectedDataset) return;
    setLoading(true);
    try {
      for (const visual of visuals) {
        const dimensions = visual.fields.filter((f) => f.role === "axis").map((f) => f.fieldId);
        const metrics = visual.fields.filter((f) => f.role === "value").map((f) => f.fieldId);

        if (dimensions.length === 0 && metrics.length === 0) continue;

        const query = {
          dimensions,
          metrics,
          limit: visual.config.limit || 100,
          includeTotals: true,
        };

        const response: any = await dashboardService.runBIQuery(selectedDataset, query);
        updateVisual(visual.id, { data: response?.data });
      }
      showSnackbar("All queries executed successfully", "success");
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to run queries", "error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Handle drag end - now properly handles both field drops and visual repositioning
  const handleDragEnd = (event: DragEndEvent) => {
    const { over, active, delta } = event;
    setActiveDragField(null);
    setDragOverCanvas(false);

    // Check if dragging a visual (repositioning)
    const visual = active.data.current?.visual as VisualConfig;
    if (visual && active.data.current?.isVisual) {
      // Update visual position based on drag delta
      updateVisual(visual.id, {
        x: Math.max(0, visual.x + delta.x),
        y: Math.max(0, visual.y + delta.y),
      });
      return;
    }

    // Handle field drop
    const field = active.data.current?.field as BIField;
    if (!field) return;

    if (over?.id?.toString().startsWith("well-")) {
      handleFieldDropOnWell(over.id.toString(), field);
    } else if (over?.id === "canvas") {
      handleFieldDropOnCanvas(field);
    }
  };

  return (
    <Box className="h-[calc(100vh-120px)] flex flex-col overflow-hidden bg-white">
      {/* Toolbar */}
      <Paper elevation={1} className="flex items-center justify-between px-3 py-1.5 bg-white rounded-none border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Typography variant="subtitle2" className="font-semibold text-gray-800">
            <DashboardIcon className="!w-3 !inline mr-1" />
            Power BI Workspace
          </Typography>
          <Divider orientation="vertical" flexItem className="mx-2" />
          <Tooltip title="Undo">
            <span>
              <IconButton size="small" onClick={handleUndo} disabled={undoStack.length === 0}>
                <Undo fontSize="small" className="text-gray-800"/>
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Redo">
            <span>
              <IconButton size="small" onClick={handleRedo} disabled={redoStack.length === 0}>
                <Redo fontSize="small" className="text-gray-800"/>
              </IconButton>
            </span>
          </Tooltip>
          <Divider orientation="vertical" flexItem className="mx-2" />
          <Button
            size="small"
            variant="outlined"
            startIcon={<PlayArrow />}
            onClick={handleRunQuery}
            disabled={!selectedVisual || loading}
          >
            Run Query
          </Button>
          <Button
            size="small"
            variant="contained"
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
            onClick={handleRunAllQueries}
            disabled={visuals.length === 0 || loading}
            className="!bg-primary"
          >
            Run All
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Chip
            label={`${visuals.length} Visual${visuals.length !== 1 ? "s" : ""}`}
            size="small"
            variant="outlined"
            className="text-gray-800"
          />
          <Button
            size="small"
            variant="contained"
            startIcon={<Save />}
            className="!bg-primary"
            onClick={() => showSnackbar("Report saved successfully", "success")}
            disabled={visuals.length === 0}
          >
            Save Report
          </Button>
        </div>
      </Paper>

      {/* Main Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        onDragStart={(event) => {
          const field = event.active.data.current?.field as BIField;
          if (field) setActiveDragField(field);
        }}
        onDragOver={(event) => {
          // ✅ FIXED: Only set drag over when over canvas and dragging a field
          const isDraggingField = !!event.active.data.current?.field;
          setDragOverCanvas(isDraggingField && event.over?.id === "canvas");
        }}
      >
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Field List */}
          <Paper
            elevation={0}
            className="w-[240px] flex-shrink-0 bg-white border-r border-gray-200 rounded-none overflow-hidden flex flex-col"
          >
            <FieldPanel
              datasets={datasets}
              selectedDataset={selectedDataset}
              onDatasetChange={setSelectedDataset}
              schema={schema}
              onAddField={(field) => handleFieldDropOnCanvas(field)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </Paper>

          {/* Center - Canvas */}
          <div className="flex-1 overflow-auto relative bg-[#f0f0f0]">
            {/* Grid pattern */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />

            <CanvasDropZone
              visuals={visuals}
              selectedVisualId={selectedVisualId}
              onSelectVisual={setSelectedVisualId}
              onDeleteVisual={deleteVisual}
              onUpdateVisual={updateVisual}
              onAddVisual={addVisual}
              isDragOver={dragOverCanvas}
            />

            {/* Empty state */}
            {visuals.length === 0 && (
              <div className="absolute inset-0 bg-white flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <DashboardIcon sx={{ fontSize: 64, color: "#d1d5db", mb: 2 }} />
                  <Typography variant="h6" className="text-gray-400">
                    Drag fields here to create a visual
                  </Typography>
                  <Typography variant="body2" className="text-gray-300 mt-1">
                    Or double-click a field in the left panel
                  </Typography>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Visualization Config */}
          <Paper
            elevation={0}
            className="w-[280px] flex-shrink-0 border-l bg-white border-gray-200 rounded-none overflow-hidden flex flex-col"
          >
            <VisualizationPanel
              selectedVisual={selectedVisual}
              onUpdateVisual={(updates) => selectedVisual && updateVisual(selectedVisual.id, updates)}
              onFieldDrop={handleFieldDropOnWell}
              onRemoveField={handleRemoveFieldFromWell}
            />
          </Paper>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragField && (
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded shadow-lg border border-blue-300 text-xs">
              {activeDragField.type === "metric" ? (
                <Functions className="text-blue-500 !w-4 !h-4" />
              ) : activeDragField.type === "date" ? (
                <CalendarToday className="text-orange-500 !w-4 !h-4" />
              ) : (
                <Category className="text-green-500 !w-4 !h-4" />
              )}
              <span className="font-medium">{activeDragField.name}</span>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Loading overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            inset: 0,
            bgcolor: 'rgba(255,255,255,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ mt: 2 }} color="textSecondary">
              Running query...
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
}