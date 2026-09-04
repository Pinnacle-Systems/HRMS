import { useState, useEffect, useRef } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Fade,
  Zoom,
  alpha,
  useTheme,
  Skeleton,
  Stack,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DragIndicator as DragIndicatorIcon,
  Cancel as CancelIcon,
  Restore as RestoreIcon,
  ExpandMore as ExpandMoreIcon,
  People as PeopleIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  BusinessCenter as BusinessCenterIcon,
  School as SchoolIcon,
  EmojiEvents as EmojiEventsIcon,
  CloudDownload as CloudDownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  PersonOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useUI } from "../../context/Snackbar";
import { dashboardService } from "../../services/modules/dashboard";
import type {
  DashboardPage,
  DashboardData,
  DashboardWidget,
  CatalogWidget,
  DashboardPreferences,
  DrilldownResponse,
  UpdatePreferencesRequest,
  SupportedFilter,
  WidgetAction,
} from "../../services/modules/dashboard";

// ===== Apache ECharts Imports =====
import * as echarts from 'echarts';
import 'echarts-gl';
import { formatDate } from "../leave/leaveFormatters";

// ===== DRAG-DROP: Import dnd-kit =====
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getWidgetColor, isDateString, isIdColumn } from "./const";
import { getRowColor } from "../const";
import { getWorkspaceLabel } from "../../auth/authMapper";
import { useAuth } from "../../auth/authContext";
import PayrollAnalyticsDashboard from "../payroll/PayrollAnalyticsDashboard";

// ============ Utility Functions ============

const safeDisplayValue = (value: any): string => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string") {
    if (isDateString(value)) {
      return formatDate(value);
    }
    return value;
  }
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

// Widget Type Icons
const getWidgetIcon = (type: string) => {
  const typeLower = type?.toLowerCase() || "";
  if (["employee", "employees", "headcount", "summary-box"].includes(typeLower)) return <PeopleIcon />;
  if (["attendance", "absenteeism"].includes(typeLower)) return <TimelineIcon />;
  if (["performance", "rating"].includes(typeLower)) return <TrendingUpIcon />;
  if (["payroll", "salary", "cost"].includes(typeLower)) return <AttachMoneyIcon />;
  if (["recruitment", "hiring", "candidates"].includes(typeLower)) return <BusinessCenterIcon />;
  if (["training", "learning"].includes(typeLower)) return <SchoolIcon />;
  if (["rewards", "recognition"].includes(typeLower)) return <EmojiEventsIcon />;
  if (["analytics", "report", "kpi"].includes(typeLower)) return <AssessmentIcon />;
  return <DashboardIcon />;
};

// Chart Colors
const CHART_COLORS = [
  "#2563eb", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6",
  "#f97316", "#6366f1", "#84cc16", "#22d3ee"
];

// ============ Chart Option Builders ============

// 1. Bar Chart (with 3D support)
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

  const baseOption: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
    },
    legend: {
      data: yAxisCols,
      textStyle: { fontSize: 12 },
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item[xAxisCol]),
      axisLabel: { fontSize: 11, color: '#6b7280' },
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
      itemStyle: {
        color: palette[index % palette.length],
        borderRadius: isStacked ? [0, 0, 0, 0] : [4, 4, 0, 0],
      },
      stack: isStacked ? 'total' : undefined,
      barGap: isGrouped ? '20%' : '30%',
    })),
  };

  if (is3D) {
    const categories = data.map(item => item[xAxisCol]);
    const seriesData = yAxisCols.map((col, index) => ({
      name: col,
      type: 'bar3D' as any,
      data: data.map((item, i) => ({
        value: [i, item[col], 0],
      })),
      barWidth: 20,
      itemStyle: {
        color: palette[index % palette.length],
      },
      shading: 'realistic' as any,
      realisticMaterial: {
        roughness: 0.3,
        metalness: 0.1,
      } as any,
    }));

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#1f2937' },
      },
      legend: {
        data: yAxisCols,
        textStyle: { fontSize: 12 },
        bottom: 0,
      },
      grid3D: {
        viewControl: {
          projection: 'perspective',
          autoRotate: true,
          autoRotateSpeed: 10,
          distance: 200,
          minDistance: 50,
          maxDistance: 400,
        },
        boxWidth: 100,
        boxHeight: 80,
        boxDepth: 80,
      },
      xAxis3D: {
        type: 'category',
        data: categories,
        axisLabel: { fontSize: 11, color: '#6b7280' },
      },
      yAxis3D: {
        type: 'value',
        axisLabel: { fontSize: 11, color: '#6b7280' },
      },
      zAxis3D: {
        type: 'value',
        axisLabel: { fontSize: 11, color: '#6b7280' },
      },
      series: seriesData,
    };
  }

  return baseOption;
};

// 2. Line Chart (with 3D support)
const getLineChartOption = (
  data: any[],
  xAxisCol: string,
  yAxisCols: string[],
  palette: string[],
  is3D: boolean
): echarts.EChartsOption => {
  const baseOption: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
    },
    legend: {
      data: yAxisCols,
      textStyle: { fontSize: 12 },
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map(item => item[xAxisCol]),
      axisLabel: { fontSize: 11, color: '#6b7280' },
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
      lineStyle: {
        width: 2,
        color: palette[index % palette.length],
      },
      itemStyle: {
        color: palette[index % palette.length],
      },
    })),
  };

  if (is3D) {
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#1f2937' },
      },
      legend: {
        data: yAxisCols,
        textStyle: { fontSize: 12 },
        bottom: 0,
      },
      grid3D: {
        viewControl: {
          projection: 'perspective',
          autoRotate: true,
          autoRotateSpeed: 10,
          distance: 200,
        },
        boxWidth: 100,
        boxHeight: 80,
        boxDepth: 80,
      },
      xAxis3D: {
        type: 'category',
        data: data.map(item => item[xAxisCol]),
        axisLabel: { fontSize: 11, color: '#6b7280' },
      },
      yAxis3D: {
        type: 'value',
        axisLabel: { fontSize: 11, color: '#6b7280' },
      },
      zAxis3D: {
        type: 'value',
        axisLabel: { fontSize: 11, color: '#6b7280' },
      },
      series: yAxisCols.map((col, index) => ({
        name: col,
        type: 'line3D' as any,
        data: data.map((item, i) => [i, item[col], 0]),
        lineStyle: {
          width: 3,
          color: palette[index % palette.length],
        },
        itemStyle: {
          color: palette[index % palette.length],
        },
        shading: 'realistic' as any,
        realisticMaterial: {
          roughness: 0.3,
          metalness: 0.1,
        } as any,
      })),
    };
  }

  return baseOption;
};

// 3. Area Chart
const getAreaChartOption = (
  data: any[],
  xAxisCol: string,
  yAxisCols: string[],
  palette: string[]
): echarts.EChartsOption => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#1f2937' },
  },
  legend: {
    data: yAxisCols,
    textStyle: { fontSize: 12 },
    bottom: 0,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '8%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: data.map(item => item[xAxisCol]),
    axisLabel: { fontSize: 11, color: '#6b7280' },
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
    lineStyle: {
      width: 2,
      color: palette[index % palette.length],
    },
    itemStyle: {
      color: palette[index % palette.length],
    },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: palette[index % palette.length] + '80' },
        { offset: 1, color: palette[index % palette.length] + '10' },
      ]),
    },
  })),
});

// 4. Pie/Donut Chart
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
    if (groupedData[label]) {
      groupedData[label] += value;
    } else {
      groupedData[label] = value;
    }
  });

  const pieData = Object.entries(groupedData)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
      formatter: (params: any) => {
        return `${params.name}<br/>Value: ${params.value}<br/>Percentage: ${params.percent}%`;
      },
    },
    legend: {
      data: pieData.map(item => item.name),
      textStyle: { fontSize: 12 },
      bottom: 0,
      orient: 'horizontal',
    },
    series: [{
      name: 'Data',
      type: 'pie' as const,
      radius: isDonut ? ['40%', '70%'] : ['0%', '70%'],
      center: ['50%', '45%'],
      data: pieData.map((item, index) => ({
        ...item,
        itemStyle: {
          color: palette[index % palette.length],
        },
      })),
      label: {
        show: true,
        formatter: '{b}\n({d}%)',
        fontSize: 11,
        color: '#6b7280',
      },
      labelLine: {
        length: 10,
        length2: 15,
      },
      emphasis: {
        scaleSize: 10,
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.2)',
        },
      },
    }],
  };
};

// 5. Scatter Chart (with 3D support)
const getScatterChartOption = (
  data: any[],
  xAxisCol: string,
  yAxisCols: string[],
  palette: string[],
  is3D: boolean
): echarts.EChartsOption => {
  const baseOption: echarts.EChartsOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '8%',
      top: '8%',
      containLabel: true,
    },
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
      data: data.map(item => ({
        value: [item[xAxisCol], item[col]],
        name: item[xAxisCol],
      })),
      itemStyle: {
        color: palette[index % palette.length],
      },
      symbolSize: 10,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.2)',
        },
      },
    })),
  };

  if (is3D) {
    const scatterData = data.map(item => [
      item[xAxisCol],
      yAxisCols[0] ? item[yAxisCols[0]] : 0,
      0
    ]);

    return {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255,255,255,0.9)',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        textStyle: { color: '#1f2937' },
      },
      grid3D: {
        viewControl: {
          projection: 'perspective',
          autoRotate: true,
          autoRotateSpeed: 10,
          distance: 200,
        },
        boxWidth: 100,
        boxHeight: 80,
        boxDepth: 80,
      },
      xAxis3D: {
        type: 'value',
        name: xAxisCol,
        axisLabel: { fontSize: 11, color: '#6b7280' },
      },
      yAxis3D: {
        type: 'value',
        axisLabel: { fontSize: 11, color: '#6b7280' },
      },
      zAxis3D: {
        type: 'value',
        axisLabel: { fontSize: 11, color: '#6b7280' },
      },
      series: [{
        type: 'scatter3D' as any,
        data: scatterData,
        itemStyle: {
          color: palette[0],
        },
        symbolSize: 12,
      }],
    };
  }

  return baseOption;
};

// 6. Radar Chart
const getRadarChartOption = (
  data: any[],
  xAxisCol: string,
  yAxisCols: string[],
  palette: string[]
): echarts.EChartsOption => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#1f2937' },
  },
  legend: {
    data: yAxisCols,
    textStyle: { fontSize: 12 },
    bottom: 0,
  },
  radar: {
    indicator: data.map(item => ({
      name: item[xAxisCol],
      max: Math.max(...data.map(d => Math.max(...yAxisCols.map(col => d[col] || 0)))),
    })),
    shape: 'circle',
    axisName: {
      color: '#6b7280',
      fontSize: 11,
    },
    splitArea: {
      areaStyle: {
        color: ['rgba(37,99,235,0.02)'],
      },
    },
    axisLine: {
      lineStyle: {
        color: '#e5e7eb',
      },
    },
  },
  series: yAxisCols.map((col, index) => ({
    name: col,
    type: 'radar' as const,
    data: [{
      value: data.map(item => item[col] || 0),
      name: col,
    }],
    itemStyle: {
      color: palette[index % palette.length],
    },
    areaStyle: {
      color: palette[index % palette.length] + '40',
    },
    lineStyle: {
      width: 2,
      color: palette[index % palette.length],
    },
  })),
});

// 7. Treemap Chart
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

  const treeData = buildTree(data);

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
      formatter: (params: any) => {
        return `${params.name}<br/>Value: ${params.value}`;
      },
    },
    series: [{
      type: 'treemap' as const,
      data: treeData,
      leafDepth: hierarchy.length,
      label: {
        show: true,
        fontSize: 11,
        color: '#1f2937',
      },
      itemStyle: {
        borderColor: '#ffffff',
        borderWidth: 2,
        gapWidth: 2,
      },
      color: palette,
      levels: hierarchy.map(() => ({
        itemStyle: {
          borderColor: '#ffffff',
          borderWidth: 1,
          gapWidth: 1,
        },
      })),
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.2)',
        },
      },
    }],
  };
};

// 8. Gauge Chart
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
      progress: {
        show: true,
        width: 18,
        roundCap: true,
        itemStyle: {
          color: palette[0],
        },
      },
      pointer: {
        show: true,
        length: '60%',
        width: 6,
        itemStyle: {
          color: '#1f2937',
        },
      },
      axisLine: {
        lineStyle: {
          width: 18,
          color: [
            [0.3, '#ef4444'],
            [0.7, '#f59e0b'],
            [1, '#10b981'],
          ] as [number, string][],
        },
      },
      axisTick: {
        distance: -10,
        length: 8,
        lineStyle: {
          color: '#6b7280',
          width: 1,
        },
      },
      splitLine: {
        distance: -10,
        length: 12,
        lineStyle: {
          color: '#1f2937',
          width: 2,
        },
      },
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        distance: 10,
      },
      detail: {
        valueAnimation: true,
        formatter: '{value}',
        color: '#1f2937',
        fontSize: 24,
        fontWeight: 700,
        offsetCenter: [0, '40%'],
      },
      data: [{ value }],
    }],
  };
};

// 9. Funnel Chart
const getFunnelChartOption = (
  data: any[],
  labelDim: string,
  valueMetric: string,
  palette: string[]
): echarts.EChartsOption => {
  const funnelData = data.map((item, index) => ({
    name: safeDisplayValue(item[labelDim]),
    value: Number(item[valueMetric]) || 0,
    itemStyle: {
      color: palette[index % palette.length],
    },
  }));

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
      formatter: (params: any) => {
        return `${params.name}<br/>Value: ${params.value}`;
      },
    },
    legend: {
      data: funnelData.map(item => item.name),
      textStyle: { fontSize: 12 },
      bottom: 0,
    },
    series: [{
      type: 'funnel' as const,
      left: '10%',
      right: '10%',
      top: 20,
      bottom: 20,
      min: 0,
      max: Math.max(...funnelData.map(d => d.value)),
      sort: 'descending',
      gap: 2,
      label: {
        show: true,
        position: 'inside',
        fontSize: 11,
        color: '#ffffff',
      },
      itemStyle: {
        borderColor: '#ffffff',
        borderWidth: 1,
      },
      emphasis: {
        label: {
          fontSize: 13,
          fontWeight: 'bold',
        },
      },
      data: funnelData,
    }],
  };
};

// 10. Boxplot Chart - FIXED
const getBoxplotChartOption = (
  data: any[],
  yAxisCols: string[],
  palette: string[]
): echarts.EChartsOption => {
  const prepareBoxData = (values: number[]) => {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const median = sorted[Math.floor(sorted.length * 0.5)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    return {
      min: sorted[0],
      q1,
      median,
      q3,
      max: sorted[sorted.length - 1],
    };
  };

  // Build box data - ensure we have valid arrays
  const boxData: number[][] = [];
  yAxisCols.forEach((col) => {
    const values = data
      .map(item => Number(item[col]) || 0)
      .filter(v => v > 0);
    if (values.length > 0) {
      const box = prepareBoxData(values);
      boxData.push([box.min, box.q1, box.median, box.q3, box.max]);
    }
  });

  // If no valid data, return empty chart
  if (boxData.length === 0) {
    return {
      title: {
        text: 'No boxplot data available',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#6b7280',
          fontSize: 14,
        },
      },
    };
  }

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
      formatter: (params: any) => {
        if (params.seriesName === 'Boxplot') {
          const d = params.data;
          if (Array.isArray(d) && d.length >= 5) {
            return `Min: ${d[0]}<br/>Q1: ${d[1]}<br/>Median: ${d[2]}<br/>Q3: ${d[3]}<br/>Max: ${d[4]}`;
          }
        }
        return `${params.name}<br/>Value: ${params.value}`;
      },
    },
    legend: {
      data: ['Boxplot'],
      textStyle: { fontSize: 12 },
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: yAxisCols.slice(0, boxData.length),
      axisLabel: { fontSize: 11, color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#6b7280' },
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
    },
    series: [{
      name: 'Boxplot',
      type: 'boxplot' as const,
      data: boxData,
      itemStyle: {
        color: palette[0],
      },
      boxWidth: ['30%', '50%'],
    }],
  };
};

// 11. Composed Chart
const getComposedChartOption = (
  data: any[],
  xAxisCol: string,
  yAxisCols: string[],
  palette: string[]
): echarts.EChartsOption => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#1f2937' },
  },
  legend: {
    data: yAxisCols,
    textStyle: { fontSize: 12 },
    bottom: 0,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    top: '8%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: data.map(item => item[xAxisCol]),
    axisLabel: { fontSize: 11, color: '#6b7280' },
    axisLine: { lineStyle: { color: '#e5e7eb' } },
  },
  yAxis: {
    type: 'value',
    axisLabel: { fontSize: 11, color: '#6b7280' },
    splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
  },
  series: yAxisCols.map((col, index) => ({
    name: col,
    type: index === 0 ? 'bar' as const : 'line' as const,
    data: data.map(item => item[col]),
    itemStyle: {
      color: palette[index % palette.length],
      borderRadius: [4, 4, 0, 0],
    },
    lineStyle: {
      width: 2,
      color: palette[index % palette.length],
    },
    smooth: true,
    symbolSize: 6,
  })),
});

// 12. Radial Bar Chart
const getRadialBarChartOption = (
  data: any[],
  labelDim: string,
  valueMetric: string,
  palette: string[]
): echarts.EChartsOption => {
  const radialData = data.map((item, index) => ({
    name: safeDisplayValue(item[labelDim]),
    value: Number(item[valueMetric]) || 0,
    itemStyle: {
      color: palette[index % palette.length],
    },
  }));

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
      formatter: (params: any) => {
        return `${params.name}<br/>Value: ${params.value}`;
      },
    },
    legend: {
      data: radialData.map(item => item.name),
      textStyle: { fontSize: 12 },
      bottom: 0,
    },
    angleAxis: {
      type: 'category',
      data: radialData.map(item => item.name),
      axisLabel: { fontSize: 11, color: '#6b7280' },
    },
    radiusAxis: {
      type: 'value',
      axisLabel: { fontSize: 11, color: '#6b7280' },
    },
    polar: {
      center: ['50%', '45%'],
      radius: ['20%', '70%'],
    },
    series: [{
      type: 'bar' as const,
      data: radialData,
      coordinateSystem: 'polar',
      barGap: 2,
      barWidth: 20,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
      },
      label: {
        show: true,
        position: 'outside',
        fontSize: 11,
        color: '#6b7280',
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.2)',
        },
      },
    }],
  };
};

// 13. Heatmap Chart
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
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
      formatter: (params: any) => {
        return `${xLabels[params.data[0]]} → ${yLabels[params.data[1]]}<br/>Value: ${params.data[2]}`;
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: xLabels,
      axisLabel: { fontSize: 11, color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      splitArea: { show: true },
    },
    yAxis: {
      type: 'category',
      data: yLabels,
      axisLabel: { fontSize: 11, color: '#6b7280' },
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      splitArea: { show: true },
    },
    visualMap: {
      min: Math.min(...heatmapData.map(d => d[2])),
      max: Math.max(...heatmapData.map(d => d[2])),
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: {
        color: ['#f3f4f6', ...palette],
      },
    },
    series: [{
      type: 'heatmap' as const,
      data: heatmapData,
      label: {
        show: true,
        fontSize: 10,
        color: '#1f2937',
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.2)',
        },
      },
    }],
  };
};

// 14. Sankey Chart
const getSankeyOption = (
  data: any[],
  sourceKey: string,
  targetKey: string,
  valueKey: string,
  // palette: string[]
): echarts.EChartsOption => {
  const nodes: any[] = [];
  const links: any[] = [];
  const nodeMap = new Map();

  data.forEach((row: any) => {
    const source = safeDisplayValue(row[sourceKey]);
    const target = safeDisplayValue(row[targetKey]);
    const value = Number(row[valueKey]) || 0;

    if (!nodeMap.has(source)) {
      nodeMap.set(source, { name: source });
      nodes.push({ name: source });
    }
    if (!nodeMap.has(target)) {
      nodeMap.set(target, { name: target });
      nodes.push({ name: target });
    }

    links.push({
      source,
      target,
      value,
    });
  });

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
      formatter: (params: any) => {
        if (params.dataType === 'edge') {
          return `${params.data.source} → ${params.data.target}<br/>Value: ${params.data.value}`;
        }
        return `${params.name}<br/>Value: ${params.value}`;
      },
    },
    series: [{
      type: 'sankey' as const,
      emphasis: {
        focus: 'adjacency',
      },
      nodeAlign: 'justify',
      nodeWidth: 20,
      nodeGap: 8,
      draggable: true,
      data: nodes,
      links: links,
      label: {
        fontSize: 11,
        color: '#1f2937',
      },
      lineStyle: {
        color: 'gradient',
        curveness: 0.5,
        opacity: 0.4,
      },
    }],
  };
};

// 15. Sunburst Chart
const getSunburstChartOption = (
  data: any[],
  hierarchy: string[],
  valueKey: string,
  palette: string[]
): echarts.EChartsOption => {
  const buildSunburstTree = (items: any[], depth: number = 0): any[] => {
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
      children: buildSunburstTree(children, depth + 1),
    }));
  };

  const treeData = buildSunburstTree(data);

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255,255,255,0.9)',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#1f2937' },
      formatter: (params: any) => {
        return `${params.name}<br/>Value: ${params.value}`;
      },
    },
    series: [{
      type: 'sunburst' as const,
      data: treeData,
      radius: [0, '95%'],
      center: ['50%', '50%'],
      label: {
        rotate: 'radial',
        fontSize: 11,
        color: '#1f2937',
      },
      itemStyle: {
        borderRadius: 4,
        borderColor: '#ffffff',
        borderWidth: 2,
      },
      levels: hierarchy.map((_, index) => ({
        r0: `${index * 20}%`,
        r: `${(index + 1) * 20}%`,
        itemStyle: {
          borderWidth: index === 0 ? 2 : 1,
        },
        label: {
          fontSize: index === 0 ? 12 : 10,
        },
      })),
      color: palette,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.2)',
        },
      },
    }],
  };
};

// ============ ECharts Renderer Component ============

interface EChartsRendererProps {
  data: any;
  type: string;
  config?: any;
  is3D?: boolean;
}

const EChartsRenderer = ({ data, type, config, is3D = false }: EChartsRendererProps) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const theme = useTheme();
  // const [chartKey, setChartKey] = useState(0);


  const rows = data?.data || [];
  const columns = data?.columns || [];
  const meta = data?.meta || {};
  const palette = meta?.palette || CHART_COLORS;

  const improveChartReadability = (option: echarts.EChartsOption): echarts.EChartsOption => {
    const readableOption = { ...option } as echarts.EChartsOption & {
      grid?: any;
      legend?: any;
      series?: any[];
    };

    if (readableOption.grid && !Array.isArray(readableOption.grid)) {
      readableOption.grid = {
        ...readableOption.grid,
        bottom: readableOption.grid.bottom || '22%',
        containLabel: true,
      };
    }

    if (readableOption.legend && !Array.isArray(readableOption.legend)) {
      readableOption.legend = {
        ...readableOption.legend,
        type: 'scroll',
        bottom: 4,
        width: '92%',
        pageButtonItemGap: 4,
        textStyle: {
          ...readableOption.legend.textStyle,
          fontSize: 12,
        },
      };
    }

    if (Array.isArray(readableOption.series)) {
      readableOption.series = readableOption.series.map((series) => ({
        ...series,
        label: series.label
          ? { ...series.label, hideOverlap: true }
          : series.label,
        labelLayout: { hideOverlap: true },
      }));
    }

    return readableOption;
  };


  useEffect(() => {
    if (!chartRef.current) return;

    // Get the device pixel ratio for sharper rendering
    const dpr = window.devicePixelRatio || 1;

    chartInstance.current = echarts.init(chartRef.current, null, {
      renderer: 'canvas' as const,
      width: chartRef.current.clientWidth,
      height: chartRef.current.clientHeight,
      devicePixelRatio: dpr,
    });

    const resizeObserver = new ResizeObserver(() => {
      if (chartInstance.current) {
        // Proper resize with debounce
        chartInstance.current.resize({
          width: 'auto',
          height: 'auto',
        });
        // setChartKey(prev => prev + 1); // Force re-render on resize
      }
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
    const yAxisCols = config?.yAxis || numericColumns.slice(0, 2).map((c: any) => c.id);
    const labelDim = config?.labelDim || config?.dimension || stringColumns[0]?.id || columns[0]?.id;
    const valueMetric = config?.valueMetric || config?.metric || config?.value || numericColumns[0]?.id || columns[1]?.id;
    const hierarchy = config?.hierarchy || [stringColumns[0]?.id, stringColumns[1]?.id].filter(Boolean);
    const sourceKey = config?.source || stringColumns[0]?.id;
    const targetKey = config?.target || stringColumns[1]?.id;
    const yAxisCol = config?.yAxis || yAxisCols[0] || stringColumns[1]?.id || columns[1]?.id;

    const chartData = rows.map((row: any) => {
      const obj: any = { ...row };
      yAxisCols.forEach((col: string) => {
        if (obj[col] !== undefined && obj[col] !== null) {
          obj[col] = Number(obj[col]);
        }
      });
      return obj;
    });

    let option: echarts.EChartsOption = {};

    const supports3D = ['bar', 'column', 'line', 'scatter'].includes(typeLower);
    const use3D = is3D && supports3D;

    switch (typeLower) {
      case 'bar':
      case 'column':
      case 'stacked-bar':
      case 'grouped-bar':
        option = getBarChartOption(chartData, xAxisCol, yAxisCols, palette, typeLower, use3D);
        break;

      case 'line':
        option = getLineChartOption(chartData, xAxisCol, yAxisCols, palette, use3D);
        break;

      case 'area':
        option = getAreaChartOption(chartData, xAxisCol, yAxisCols, palette);
        break;

      case 'pie':
      case 'donut':
        option = getPieChartOption(chartData, labelDim, valueMetric, palette, typeLower);
        break;

      case 'scatter':
        option = getScatterChartOption(chartData, xAxisCol, yAxisCols, palette, use3D);
        break;

      case 'radar':
        option = getRadarChartOption(chartData, xAxisCol, yAxisCols, palette);
        break;

      case 'treemap':
        option = getTreemapOption(chartData, hierarchy, valueMetric, palette);
        break;

      case 'gauge':
        option = getGaugeOption(chartData, valueMetric, palette);
        break;

      case 'funnel':
        option = getFunnelChartOption(chartData, labelDim, valueMetric, palette);
        break;

      case 'boxplot':
        option = getBoxplotChartOption(chartData, yAxisCols, palette);
        break;

      case 'composed':
        option = getComposedChartOption(chartData, xAxisCol, yAxisCols, palette);
        break;

      case 'radial-bar':
        option = getRadialBarChartOption(chartData, labelDim, valueMetric, palette);
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
          title: {
            text: 'Unsupported chart type',
            left: 'center',
            top: 'center',
            textStyle: {
              color: '#6b7280',
              fontSize: 14,
            },
          },
        };
        break;
    }

    option = improveChartReadability({
      ...option,
      backgroundColor: 'transparent',
      textStyle: {
        color: theme.palette.text.primary,
      },
    });

    chartInstance.current.clear();
    chartInstance.current.setOption(option, true);
    chartInstance.current.resize();

  }, [data, type, config, is3D, theme, rows, columns]);

  useEffect(() => {
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (rows.length === 0) {
    return (
      <Typography color="textSecondary" sx={{ py: 4, textAlign: 'center' }}>
        No data available
      </Typography>
    );
  }

  return <div ref={chartRef} style={{ width: '100%', height: 380, minHeight: 380 }} />;
};

// ============ Table Widget ============
const TableWidget = ({ data }: { data: any }) => {
  const theme = useTheme();
  const rows = data?.data || [];
  const [localPage, setLocalPage] = useState(0);
  const [localRowsPerPage, setLocalRowsPerPage] = useState(5);

  if (rows.length === 0) {
    return <Typography color="textSecondary">No data available</Typography>;
  }

  const columns = Object.keys(rows[0]).filter((key) => !key.startsWith("_") && key !== "meta" && !isIdColumn(key));
  if (columns.length === 0) {
    return <Typography color="textSecondary">No columns found</Typography>;
  }

  const paginatedRows = rows.slice(localPage * localRowsPerPage, localPage * localRowsPerPage + localRowsPerPage);

  return (
    <Box>
      <TableContainer>
        <Table size="small" className="border border-gray-200">
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.grey[50] }}>
              {columns.map((col) => (
                <TableCell key={col} sx={{ fontWeight: 600 }}>
                  {col.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map((row: any, idx: number) => (
              <TableRow key={idx} hover sx={getRowColor(idx)}>
                {columns.map((col) => (
                  <TableCell key={col}>
                    <div className={`!p-1.5 !text-[11px] ${typeof row[col] == 'number' ? 'text-sky-500' : ''}`}>
                      {safeDisplayValue(row[col])}
                    </div>
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
        />
      )}
    </Box>
  );
};

// ============ Summary Box Widget ============
const SummaryBoxWidget = ({ data }: { data: any }) => {
  const theme = useTheme();
  const rows = data?.data || [];
  if (rows.length === 0) {
    return <Typography color="textSecondary">No summary data available</Typography>;
  }
  const summaryRow = rows[0];
  const entries = Object.entries(summaryRow).filter(
    ([key]) => !key.startsWith("_") && key !== "id" && key !== "meta"
  );
  if (entries.length === 0) {
    return <Typography color="textSecondary">No metrics available</Typography>;
  }
  return (
    <Grid container spacing={2}>
      {entries.map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        return (
          <Grid key={key} size={{ xs: 6, sm: 4 }}>
            <Box
              sx={{
                p: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                borderRadius: 2,
                textAlign: "center",
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                {safeDisplayValue(value)}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: "block" }}>
                {label}
              </Typography>
            </Box>
          </Grid>
        );
      })}
    </Grid>
  );
};

// ============ Employee Card List ============
interface EmployeeCardListProps {
  data: any;
  widgetId: string;
  onDrilldown?: (actionId: string, context?: any) => void;
  actions?: WidgetAction[];
}

function EmployeeCardList({ data, widgetId, onDrilldown, actions }: EmployeeCardListProps) {
  const theme = useTheme();
  const rows = data?.data || [];
  if (rows.length === 0) {
    return <Typography color="textSecondary" sx={{ py: 2, textAlign: 'center' }}>No records found</Typography>;
  }

  let isAnniversary = false;
  if (widgetId.includes('workAnniversaries')) {
    isAnniversary = true;
  }

  const firstRow = rows[0] || {};
  const nameField = firstRow.name ? 'name' : (firstRow.employeeName ? 'employeeName' : null);
  const dateField = firstRow.joiningDate ? 'joiningDate' :
    firstRow.occursOn ? 'occursOn' :
      firstRow.resignationDate ? 'resignationDate' : null;
  const daysField = firstRow.daysFromToday !== undefined ? 'daysFromToday' : '';
  const idField = firstRow.employeeId ? 'employeeId' : (firstRow.id ? 'id' : '');
  const yearsField = firstRow.anniversaryYears !== undefined ? 'anniversaryYears' : '';

  if (!nameField || !dateField) {
    return <TableWidget data={data} />;
  }

  const handleCardClick = (record: any) => {
    if (onDrilldown && actions && actions.length > 0) {
      onDrilldown(actions[0].id, { record });
    }
  };

  return (
    <div className="grid items-center gap-2">
      {rows.map((record: any, index: number) => {
        const name = record[nameField] || 'Unknown';
        const date = record[dateField] || '';
        const days = record[daysField] !== undefined ? record[daysField] : null;
        const employeeId = record[idField] || '';
        const anniversaryYears = isAnniversary ? record[yearsField] : null;

        let daysText = '';
        let chipColor: 'default' | 'success' | 'warning' | 'error' = 'default';
        if (days !== null) {
          const absDays = Math.abs(days);
          if (days === 0) {
            daysText = 'Today';
            chipColor = 'success';
          } else if (days < 0) {
            daysText = `${absDays} days ago`;
            chipColor = 'error';
          } else {
            daysText = `In ${absDays} days`;
            chipColor = 'warning';
          }
        }

        return (
          <div key={index}>
            <Paper
              elevation={0}
              className="!bg-gray-100/50 dark:!bg-head"
              sx={{
                p: 1,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                transition: 'all 0.2s',
                cursor: onDrilldown ? 'pointer' : 'default',
                '&:hover': {
                  boxShadow: theme.shadows[2],
                  borderColor: theme.palette.primary.main,
                },
              }}
              onClick={() => handleCardClick(record)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center justify-center gap-2">
                  <Avatar sx={{ bgcolor: theme.palette.grey[400], color: theme.palette.primary.contrastText }} className="!w-6 !h-6">
                    <PersonOutlined />
                  </Avatar>
                  <div>
                    <div className="text-gray-800 font-bold text-[12px]">
                      {name}
                      {anniversaryYears && (
                        <Chip
                          label={`${anniversaryYears} years`}
                          size="small"
                          color="info"
                          variant="outlined"
                          sx={{ height: 20, fontSize: '0.625rem', marginLeft: 1 }}
                        />
                      )}
                    </div>
                    {employeeId && (
                      <div className="text-[10px] text-gray-500">
                        {employeeId}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="text-gray-500 text-[10px]">
                    {date ? formatDate(date) : ''}
                  </div>
                  <div className="flex gap-2">
                    {daysText && (
                      <Chip
                        label={daysText}
                        size="small"
                        color={chipColor}
                        sx={{ height: 20, fontSize: '0.625rem' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </Paper>
          </div>
        );
      })}
    </div>
  );
}

// ============ Main Component ============

export default function Home() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { session } = useAuth();
  const user = session?.user;
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const [pages, setPages] = useState<DashboardPage[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [catalogWidgets, setCatalogWidgets] = useState<CatalogWidget[]>([]);
  const [preferences, setPreferences] = useState<DashboardPreferences | null>(null);
  const [_supportedFilters, setSupportedFilters] = useState<SupportedFilter[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [editingMode, setEditingMode] = useState(false);
  const [is3DEnabled, setIs3DEnabled] = useState(false);

  const [addWidgetDialogOpen, setAddWidgetDialogOpen] = useState(false);
  const [drilldownDialogOpen, setDrilldownDialogOpen] = useState(false);
  const [drilldownData, setDrilldownData] = useState<DrilldownResponse | null>(null);
  const [drilldownLoading, setDrilldownLoading] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [widgetToRemove, setWidgetToRemove] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    if (selectedPage) {
      if (selectedPage !== "payroll-analytics") {
        loadDashboard(selectedPage);
        loadPreferences(selectedPage);
        loadCatalogWidgets(selectedPage);
        loadPageContext(selectedPage);
      }
    }
  }, [selectedPage]);

  const loadPages = async () => {
    showSpinner();
    try {
      const response = await dashboardService.getPages();
      const data = response?.data || [];
      const availablePages = Array.isArray(data) ? data : [];
      const payrollPage: DashboardPage = {
        pageKey: "payroll-analytics",
        title: "Payroll Analytics",
        description: "Three-tier payroll analytics",
        displayOrder: -1,
      };
      const dashboardPages = [payrollPage, ...availablePages.filter((page) => page.pageKey !== payrollPage.pageKey)];
      setPages(dashboardPages);
      if (dashboardPages.length > 0) {
        setSelectedPage(dashboardPages[0].pageKey);
      }
    } catch (error) {
      showSnackbar("Failed to load dashboard pages", "error");
    } finally {
      hideSpinner();
    }
  };

  const loadPageContext = async (page: string) => {
    try {
      const response = await dashboardService.getPageContext(page);
      const data = response?.data;
      if (data) {
        setSupportedFilters(data.supportedFilters || []);
        const defaults: Record<string, any> = {};
        data.supportedFilters?.forEach((filter: SupportedFilter) => {
          if (filter.defaultValue !== undefined && filter.defaultValue !== null) {
            defaults[filter.id] = filter.defaultValue;
          }
        });
        setFilterValues(defaults);
      }
    } catch (error) {
      console.error("Failed to load page context:", error);
    }
  };

  const loadDashboard = async (page: string) => {
    showSpinner();
    setLoading(true);
    try {
      const params = { ...filterValues };
      const response = await dashboardService.getDashboard(page, params);
      const data = response?.data;
      if (data) {
        const safeData = {
          ...data,
          widgets: data.widgets?.map((widget: any) => ({
            ...widget,
            data: widget.data || {},
            actions: widget.actions || [],
            visible: widget.visible !== false,
          })) || [],
        };
        setDashboardData(safeData);
      }
    } catch (error) {
      showSnackbar("Failed to load dashboard", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const loadPreferences = async (page: string) => {
    try {
      const response = await dashboardService.getPreferences(page);
      const data = response?.data;
      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      setPreferences(null);
    }
  };

  const loadCatalogWidgets = async (page: string) => {
    try {
      const response = await dashboardService.getAvailableWidgets(page);
      const data = response?.data || [];
      setCatalogWidgets(Array.isArray(data) ? data : []);
    } catch (error) {
      showSnackbar("Failed to load available widgets", "error");
    }
  };

  const handleAddWidget = async (widgetId: string) => {
    setLoading(true);
    try {
      const currentWidgets = dashboardData?.widgets || [];
      const catalogWidget = catalogWidgets.find((w) => w.widgetId === widgetId);
      if (!catalogWidget) {
        showSnackbar("Widget not found in catalog", "error");
        return;
      }
      const newWidget: DashboardWidget = {
        id: widgetId,
        title: catalogWidget.title || "Untitled",
        type: catalogWidget.type || "unknown",
        size: catalogWidget.size || "medium",
        position: currentWidgets.length,
        locked: catalogWidget.locked || false,
        data: {},
        actions: catalogWidget.actions || [],
        visible: true,
      };
      const updatedWidgets = [...currentWidgets, newWidget];
      const preferencesPayload: UpdatePreferencesRequest = {
        widgets: updatedWidgets.map((w) => ({
          widgetId: w.id,
          visible: w.visible !== false,
          position: w.position,
          size: w.size || "medium",
        })),
      };
      await dashboardService.updatePreferences(selectedPage, preferencesPayload);
      await loadDashboard(selectedPage);
      showSnackbar("Widget added successfully", "success");
      setAddWidgetDialogOpen(false);
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to add widget", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    if (!dashboardData) return;
    const updatedWidgets = dashboardData.widgets.filter((w) => w.id !== widgetId);
    try {
      const preferencesPayload: UpdatePreferencesRequest = {
        widgets: updatedWidgets.map((w, index) => ({
          widgetId: w.id,
          visible: w.visible !== false,
          position: index,
          size: w.size || "medium",
        })),
      };
      await dashboardService.updatePreferences(selectedPage, preferencesPayload);
      await loadDashboard(selectedPage);
      showSnackbar("Widget removed successfully", "success");
      setConfirmDialogOpen(false);
      setWidgetToRemove(null);
    } catch (error) {
      showSnackbar("Failed to remove widget", "error");
    }
  };

  const handleToggleVisibility = async (widgetId: string) => {
    if (!dashboardData) return;
    const widget = dashboardData.widgets.find((w) => w.id === widgetId);
    if (!widget) return;
    const newVisibility = widget.visible !== false ? false : true;
    const updatedWidgets = dashboardData.widgets.map((w) => ({
      ...w,
      visible: w.id === widgetId ? newVisibility : w.visible,
    }));
    try {
      const preferencesPayload: UpdatePreferencesRequest = {
        widgets: updatedWidgets.map((w) => ({
          widgetId: w.id,
          visible: w.visible !== false,
          position: w.position,
          size: w.size || "medium",
        })),
      };
      await dashboardService.updatePreferences(selectedPage, preferencesPayload);
      await loadDashboard(selectedPage);
      showSnackbar(`Widget ${newVisibility ? "shown" : "hidden"}`, "success");
    } catch (error) {
      showSnackbar("Failed to update widget visibility", "error");
    }
  };

  const handleResetPreferences = async () => {
    try {
      await dashboardService.resetPreferences(selectedPage);
      await loadDashboard(selectedPage);
      await loadPreferences(selectedPage);
      showSnackbar("Dashboard reset to default", "success");
    } catch (error) {
      showSnackbar("Failed to reset preferences", "error");
    }
  };

  const handleDrilldown = async (widgetId: string, actionId: string, context?: any) => {
    setDrilldownLoading(true);
    try {
      const response: any = await dashboardService.executeDrilldown(selectedPage, widgetId, {
        actionId,
        context: { ...filterValues, ...(dashboardData?.context || {}), ...context },
      });
      const data = response?.data;
      if (data) {
        setDrilldownData(data);
        setDrilldownDialogOpen(true);
        setPage(0);
      }
    } catch (error) {
      showSnackbar("Failed to execute drilldown", "error");
    } finally {
      setDrilldownLoading(false);
    }
  };

  const handleSaveLayout = async () => {
    if (!dashboardData) return;
    try {
      const preferencesPayload: UpdatePreferencesRequest = {
        widgets: dashboardData.widgets.map((w) => ({
          widgetId: w.id,
          visible: w.visible !== false,
          position: w.position,
          size: w.size || "medium",
        })),
      };
      await dashboardService.updatePreferences(selectedPage, preferencesPayload);
      await loadPreferences(selectedPage);
      setEditingMode(false);
      showSnackbar("Layout saved successfully", "success");
    } catch (error) {
      showSnackbar("Failed to save layout", "error");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      if (dashboardData) {
        const oldIndex = dashboardData.widgets.findIndex((w) => w.id === active.id);
        const newIndex = dashboardData.widgets.findIndex((w) => w.id === over.id);
        const newWidgets = arrayMove(dashboardData.widgets, oldIndex, newIndex);
        const reordered = newWidgets.map((w, idx) => ({ ...w, position: idx }));
        setDashboardData((prev) => prev ? { ...prev, widgets: reordered } : null);
        const preferencesPayload: UpdatePreferencesRequest = {
          widgets: reordered.map((w) => ({
            widgetId: w.id,
            visible: w.visible !== false,
            position: w.position,
            size: w.size || "medium",
          })),
        };
        dashboardService.updatePreferences(selectedPage, preferencesPayload)
          .then(() => showSnackbar("Widget order updated", "success"))
          .catch(() => showSnackbar("Failed to save new order", "error"));
      }
    }
  };

  const isPayrollAnalytics = selectedPage === "payroll-analytics";

  const renderWidgetContent = (widget: DashboardWidget) => {
    const widgetData = widget.data || {};
    const type = widget.type?.toLowerCase() || "";
    const id = widget.id || '';

    if (widget.error) {
      return (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 100,
          p: 2,
          bgcolor: alpha(theme.palette.error.main, 0.04),
          borderRadius: 1,
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
        }}>
          <Typography variant="body2" color="error" sx={{ textAlign: 'center' }}>
            ⚠️ {widget.error}
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', mt: 1 }}>
            Configure the widget with proper dimensions and metrics
          </Typography>
        </Box>
      );
    }

    const hasData = widgetData?.data && widgetData.data.length > 0;

    // KPI
    if (type === "kpi") {
      if (!hasData) {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100, p: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
              No KPI data available
            </Typography>
          </Box>
        );
      }
      const firstRow = widgetData.data?.[0] || {};
      const numericKeys = Object.keys(firstRow).filter(key =>
        !isNaN(parseFloat(firstRow[key])) && typeof firstRow[key] === 'number'
      );
      if (numericKeys.length > 0) {
        const value = firstRow[numericKeys[0]];
        const label = numericKeys[0].replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 100, p: 2 }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              {safeDisplayValue(value)}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {label}
            </Typography>
          </Box>
        );
      }
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100, p: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
            No KPI data available
          </Typography>
        </Box>
      );
    }

    // Summary Box
    if (type === "summary-box") {
      if (!hasData) {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100, p: 2 }}>
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center' }}>
              No summary data available
            </Typography>
          </Box>
        );
      }
      return <SummaryBoxWidget data={widgetData} />;
    }

    // Table
    if (type === "table") {
      if (!hasData) {
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100, p: 2 }}>
            <Typography variant="body2" sx={{ textAlign: 'center' }}>
              No table data available
            </Typography>
          </Box>
        );
      }
      const isEmployeeList = ['recentJoiners', 'upcomingBirthdays', 'workAnniversaries', 'recentResignations', 'upcomingHolidays'].some(
        (keyword) => id.includes(keyword)
      );
      if (isEmployeeList) {
        return (
          <EmployeeCardList
            data={widgetData}
            widgetId={id}
            onDrilldown={(actionId, context) => handleDrilldown(widget.id, actionId, context)}
            actions={widget.actions}
          />
        );
      }
      return <TableWidget data={widgetData} />;
    }

    // All chart types
    const chartTypes = ['line', 'area', 'bar', 'column', 'stacked-bar', 'grouped-bar',
      'donut', 'pie', 'heatmap', 'gauge', 'funnel', 'boxplot', 'composed',
      'radar', 'radial-bar', 'scatter', 'treemap', 'sankey', 'sunburst'];

    if (chartTypes.includes(type)) {
      if (!hasData) {
        return (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 200,
            p: 2,
            bgcolor: alpha(theme.palette.info.main, 0.04),
            borderRadius: 1,
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          }}>
            <AssessmentIcon sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
            <Typography variant="body2" color="info.main" sx={{ textAlign: 'center' }}>
              No data available for this chart
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', mt: 1 }}>
              Configure the widget with proper dimensions and metrics
            </Typography>
          </Box>
        );
      }

      const supports3D = ['bar', 'column', 'line', 'scatter'].includes(type);
      const use3D = is3DEnabled && supports3D;

      return (
        <EChartsRenderer
          data={widgetData}
          type={type}
          config={widget.dataConfig?.visualization || widget.dataConfig}
          is3D={use3D}
        />
      );
    }

    // Default fallback
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, minHeight: 100 }}>
        <Avatar sx={{ bgcolor: getWidgetColor(type).bg, color: getWidgetColor(type).color, width: 48, height: 48, borderRadius: 2 }}>
          {getWidgetIcon(type)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="textSecondary">{type || "Widget"}</Typography>
          {Object.keys(widgetData).length > 0 && (
            <Typography variant="caption" color="textSecondary" component="div" noWrap>
              {safeDisplayValue(widgetData).substring(0, 80)}
            </Typography>
          )}
          {!Object.keys(widgetData).length && (
            <Typography variant="caption" color="textSecondary" component="div">
              No data configured
            </Typography>
          )}
        </Box>
      </Box>
    );
  };

  interface WidgetCardProps {
    widget: DashboardWidget;
    editingMode: boolean;
    onToggleVisibility: (id: string) => void;
    onRemove: (id: string) => void;
    onDrilldown: (widgetId: string, actionId: string, context?: any) => void;
  }

  function WidgetCard({
    widget,
    editingMode,
    onToggleVisibility,
    onRemove,
    onDrilldown,
  }: WidgetCardProps) {
    const isVisible = widget.visible !== false;
    const hasError = !!widget.error;

    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: widget.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 'auto',
    };

    return (
      <Grid
        ref={setNodeRef}
        style={style}
        size={{
          xs: 12,
          sm: widget.size === 'small' ? 4 : widget.size === 'large' ? 12 : 6,
          md: widget.size === 'small' ? 3 : widget.size === 'large' ? 12 : 6,
          lg: widget.size === 'small' ? 3 : widget.size === 'large' ? 12 : 6,
        }}
      >
        <Zoom in={true} style={{ transitionDelay: '50ms' }}>
          <Card
            className="!bg-white-50 border border-gray-200"
            elevation={0}
            sx={{
              position: 'relative',
              overflow: 'visible',
              borderRadius: 2,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              touchAction: 'none',
              visibility: isVisible ? 'visible' : 'hidden',
              borderColor: hasError ? alpha(theme.palette.error.main, 0.3) : undefined,
            }}
          >
            {editingMode && (
              <Box sx={{ position: 'absolute', top: -12, right: -12, display: 'flex', gap: 0.5, zIndex: 10 }}>
                <Tooltip title={isVisible ? "Hide" : "Show"}>
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => onToggleVisibility(widget.id)}
                    sx={{ bgcolor: 'white', boxShadow: 1, width: 28, height: 28 }}
                  >
                    {isVisible ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                  </IconButton>
                </Tooltip>
                {!widget.locked && (
                  <Tooltip title="Remove">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => onRemove(widget.id)}
                      sx={{ bgcolor: 'white', boxShadow: 1, width: 28, height: 28 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Drag to reorder">
                  <IconButton
                    size="small"
                    color="primary"
                    sx={{ bgcolor: 'white', boxShadow: 1, cursor: 'grab', width: 28, height: 28 }}
                    {...attributes}
                    {...listeners}
                  >
                    <DragIndicatorIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}

            <CardHeader
              className="border-b border-gray-200"
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ fontWeight: 600 }} className="text-gray-800">
                    {widget.title}
                  </Typography>
                  {hasError && (
                    <Chip
                      label="Error"
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ fontSize: '0.625rem', height: 20 }}
                    />
                  )}
                </Box>
              }
              action={
                <Box>
                  {widget.actions?.length > 0 && !editingMode && !hasError && (
                    <Tooltip title="Drilldown">
                      <IconButton size="small" onClick={() => onDrilldown(widget.id, widget.actions[0].id)}>
                        <ExpandMoreIcon className="text-gray-800" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {widget.locked && <Chip label="Locked" size="small" color="info" sx={{ fontSize: '0.625rem', height: 20 }} />}
                </Box>
              }
            />
            <CardContent sx={{ flex: 1, pt: 2 }}>
              {renderWidgetContent(widget)}
            </CardContent>
            {widget.actions?.length > 0 && !editingMode && !hasError && (
              <CardActions sx={{ pt: 0, px: 2, pb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                {widget.actions.map((action, idx) => (
                  <Chip
                    key={idx}
                    label={action.label}
                    size="small"
                    variant="outlined"
                    onClick={() => onDrilldown(widget.id, action.id)}
                    clickable
                    className="text-gray-800"
                  />
                ))}
              </CardActions>
            )}
          </Card>
        </Zoom>
      </Grid>
    );
  }

  // ============ Main Render ============

  return (
    <Box sx={{ pb: 3 }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2 }} className="!bg-white-50 border border-gray-200">
        <Stack direction="row" className="items-center flex-wrap gap-2 justify-between">
          <Stack direction="row" spacing={2} className="items-center">
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 48, height: 48 }} className="!bg-primary">
              <DashboardIcon />
            </Avatar>
            <Box>
              <div className="text-gray-800 font-bold text-[18px]">Dashboard</div>
              <Typography variant="body2" color="textSecondary" className="text-gray-800">Welcome back, {user ? getWorkspaceLabel(user).split(' ')[0] : ''}!</Typography>
            </Box>
          </Stack>
          <div className="flex items-center gap-2 flex-wrap">
            {/* 3D Toggle Button */}
            <Tooltip title="Toggle 3D visualization">
              <Button
                variant={is3DEnabled ? "contained" : "outlined"}
                color="primary"
                onClick={() => setIs3DEnabled(!is3DEnabled)}
                sx={{
                  minWidth: 'auto',
                  bgcolor: is3DEnabled ? 'primary.main' : 'transparent',
                  '&:hover': {
                    bgcolor: is3DEnabled ? 'primary.dark' : 'primary.light',
                  }
                }}
              >
                {is3DEnabled ? '3D ON' : '3D OFF'}
              </Button>
            </Tooltip>

            <FormControl size="small" className="!w-[200px]">
              <Select
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                displayEmpty
              >
                {pages.map((page) => (
                  <MenuItem key={page.pageKey} value={page.pageKey}>{page.title}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" className="w-[200px] !text-primary !border-primary" onClick={() => navigate("/bi-workspace")}>BI Workspace</Button>
            <Button
              variant="contained"
              className="w-[200px]"
              onClick={editingMode ? handleSaveLayout : () => setEditingMode(true)}
              sx={{ bgcolor: editingMode ? theme.palette.success.main : "var(--color-primary)" }}
            >
              {editingMode ? "Save Layout" : "Edit Layout"}
            </Button>
          </div>
        </Stack>
      </Paper>

      {/* Context */}
      {!isPayrollAnalytics && dashboardData?.context && Object.keys(dashboardData.context).length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.04), border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`, borderRadius: 2 }}>
          <Stack direction="row" spacing={1} className="items-center flex-wrap">
            <AssessmentIcon color="info" fontSize="small" />
            <Typography variant="subtitle2" color="info.main" className="text-gray-800">Dashboard Context</Typography>
            {preferences?.usingRoleDefault && <Chip label="Default Layout" size="small" color="info" variant="outlined" />}
            {!preferences?.usingRoleDefault && preferences && <Chip label="Customized" size="small" color="warning" variant="outlined" />}
            {Object.entries(dashboardData.context).map(([key, value]) => (
              <Chip key={key} label={`${key}: ${safeDisplayValue(value)}`} size="small" color="info" variant="outlined" />
            ))}
          </Stack>
        </Paper>
      )}

      {/* Selected dashboard */}
      {isPayrollAnalytics ? (
        <PayrollAnalyticsDashboard />
      ) : loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
              <Skeleton variant="rounded" height={250} />
            </Grid>
          ))}
        </Grid>
      ) : dashboardData ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={dashboardData.widgets.map(w => w.id)}
            strategy={verticalListSortingStrategy}
          >
            <Grid container spacing={2}>
              {dashboardData.widgets.map((widget) => (
                <WidgetCard
                  key={widget.id}
                  widget={widget}
                  editingMode={editingMode}
                  onToggleVisibility={handleToggleVisibility}
                  onRemove={(id) => {
                    setWidgetToRemove(id);
                    setConfirmDialogOpen(true);
                  }}
                  onDrilldown={handleDrilldown}
                />
              ))}
            </Grid>
          </SortableContext>
        </DndContext>
      ) : null}

      {/* Edit Mode Actions */}
      {editingMode && !isPayrollAnalytics && (
        <Fade in={editingMode}>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddWidgetDialogOpen(true)}>Add Widget</Button>
            <Button variant="outlined" color="info" startIcon={<RestoreIcon />} onClick={handleResetPreferences}>Reset to Default</Button>
            <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => setEditingMode(false)}>Cancel Editing</Button>
          </Box>
        </Fade>
      )}

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetDialogOpen} onClose={() => setAddWidgetDialogOpen(false)} maxWidth="md" fullWidth>
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <div className="text-gray-800 text-[12px] ml-2">Add Widget</div>
          <IconButton onClick={() => setAddWidgetDialogOpen(false)}>
            <CloseOutlined className="text-gray-800" />
          </IconButton>
        </div>
        <DialogContent dividers>
          {catalogWidgets.filter(w => !dashboardData?.widgets?.some(dw => dw.id === w.widgetId)).length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="textSecondary" className="text-gray-500">🎉 All available widgets have been added</Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {catalogWidgets
                .filter(w => !dashboardData?.widgets?.some(dw => dw.id === w.widgetId))
                .map((widget) => {
                  const colors = getWidgetColor(widget.type);
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={widget.widgetId}>
                      <Card
                        variant="outlined"
                        className="bg-white border border-gray-200"
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'all 0.2s',
                          '&:hover': {
                            boxShadow: theme.shadows[4],
                            transform: 'translateY(-4px)',
                          },
                        }}
                      >
                        <CardContent sx={{ flex: 1 }}>
                          <div className="flex gap-2 items-center mb-1">
                            <Avatar sx={{ bgcolor: colors.bg, color: colors.color, width: 40, height: 40 }}>
                              {getWidgetIcon(widget.type)}
                            </Avatar>
                            <div className="text-[12px] text-gray-800">
                              {widget.title}
                            </div>
                          </div>
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip label={widget.type} size="small" color="success" />
                            <Chip label={widget.size} size="small" variant="outlined" color="warning" />
                            {widget.locked && <Chip label="Locked" size="small" color="warning" />}
                          </Stack>
                        </CardContent>
                        <CardActions sx={{ p: 2, pt: 0 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            className="!bg-primary"
                            onClick={() => handleAddWidget(widget.widgetId)}
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
                          >
                            {loading ? 'Adding...' : 'Add Widget'}
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  );
                })}
            </Grid>
          )}
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-2">
          <Button onClick={() => setAddWidgetDialogOpen(false)} variant="outlined" className="!text-gray-800 !border-gray-200">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <div className="border-b border-gray-200 text-[12px] p-2">Remove Widget</div>
        <DialogContent className="!p-4"><Typography>Are you sure you want to remove this widget?</Typography></DialogContent>
        <DialogActions className="border-t border-gray-200">
          <Button className="!text-gray-800 !border-gray-200" variant="outlined" onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => widgetToRemove && handleRemoveWidget(widgetToRemove)}>Remove</Button>
        </DialogActions>
      </Dialog>

      {/* Drilldown Dialog */}
      <Dialog open={drilldownDialogOpen} onClose={() => setDrilldownDialogOpen(false)} fullWidth>
        <div className="p-2 flex items-center justify-between border-b border-gray-200">
          <Typography variant="h6" className="!ml-4">{drilldownData?.title || "Drilldown"}</Typography>
          <Box>
            <IconButton><CloudDownloadIcon color="info" /></IconButton>
            <IconButton><PrintIcon color="warning" /></IconButton>
            <IconButton><ShareIcon color="success" /></IconButton>
          </Box>
        </div>
        <DialogContent sx={{ p: 2 }}>
          {drilldownLoading ? <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box> : drilldownData ? (
            <>
              <TableContainer sx={{ maxHeight: 450 }} className="border border-gray-200">
                <Table stickyHeader>
                  <TableHead><TableRow>{drilldownData.columns?.map((col) => <TableCell key={col.id} sx={{ bgcolor: theme.palette.grey[50], fontWeight: 600 }}>{col.label}</TableCell>)}</TableRow></TableHead>
                  <TableBody>
                    {drilldownData.data?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                      <TableRow key={idx} sx={getRowColor(idx)}>{drilldownData.columns?.map((col) => <TableCell key={col.id}><div className="py-2">{safeDisplayValue(row[col.id])}</div></TableCell>)}</TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {drilldownData.totals && Object.keys(drilldownData.totals).length > 0 && (
                <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderTop: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle2">Totals</Typography>
                  <Stack direction="row" spacing={1} className="flex-wrap">
                    {Object.entries(drilldownData.totals).map(([key, value]) => <Chip key={key} label={`${key}: ${safeDisplayValue(value)}`} size="small" variant="outlined" />)}
                  </Stack>
                </Box>
              )}
              {drilldownData.data && drilldownData.data.length > rowsPerPage && (
                <TablePagination
                  component="div"
                  count={drilldownData.data.length}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                />
              )}
            </>
          ) : <Box sx={{ p: 4, textAlign: 'center' }}><Typography color="textSecondary">No data</Typography></Box>}
        </DialogContent>
        <DialogActions className="border-t border-gray-200"><Button variant="outlined" className="!text-gray-800 !border-gray-200" onClick={() => setDrilldownDialogOpen(false)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
}