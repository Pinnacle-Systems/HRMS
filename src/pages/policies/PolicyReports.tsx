import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip as MuiTooltip,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Treemap,
} from "recharts";
import {
  Assignment as AssignmentIcon,
  Policy as PolicyIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  BarChart as BarChartIcon,
  BubbleChart as BubbleIcon,
  SwapHoriz as ConflictIcon,
  PlayCircle as SimIcon,
} from "@mui/icons-material";
import { policyService } from "../../services/modules/policy";
import dayjs from "dayjs";
import { getRowColor } from "../const";

// ── Types from API ────────────────────────────────────────────────────────────
interface SummaryItem {
  domainCode: string;
  total: number;
  active: number;
  draft: number;
  expired: number;
  archived: number;
}

interface AssignmentItem {
  id: string;
  policyVersionId: string;
  employeeId: string | null;
  employeeGroupId: string | null;
  departmentId: string | null;
  designationId: string | null;
  branchId: string | null;
  priority: number;
  effectiveFrom: string;
  effectiveTo: string | null;
}

interface SimulationItem {
  id: string;
  versionId: string;
  simulationName: string;
  simulationType: string;
  status: string;
  createdAt: string;
}

interface ConflictItem {
  id: string;
  assignmentId: string;
  conflictingAssignmentId: string;
  conflictType: string;
  conflictMessage: string;
  createdAt: string;
}

interface AuditItem {
  id: string;
  policyId: string;
  versionId: string;
  actionType: string;
  actionBy: string;
  actionDate: string;
  remarks: string | null;
  versionNo: number;
  policyName: string;
  actionByName: string;
}

interface DashboardData {
  activePolicies: number;
  draftPolicies: number;
  expiredPolicies: number;
  archivedPolicies: number;
  totalAssignments: number;
  conflicts: number;
  pendingApprovals: number;
}

// ── Colors ────────────────────────────────────────────────────────────────────
const CHART_COLORS = ["#008cff","#06b6d4","#10b981","#f59e0b","#f43f5e","#8b5cf6","#3b82f6","#84cc16"];

const ACTION_COLORS: Record<string, string> = {
  VERSION_CREATED: "#008cff",
  ACTIVATED: "#10b981",
  SUBMITTED: "#06b6d4",
  EXPIRED: "#f43f5e",
  ARCHIVED: "#94a3b8",
  REJECTED: "#f59e0b",
};

const SCOPE_COLORS = ["#008cff","#06b6d4","#10b981","#f59e0b","#8b5cf6"];

function ScopeTreemapCell(props: any) {
  const { x, y, width, height, name, size, fill } = props;
  const showLabel = width > 50 && height > 30;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={6} ry={6} stroke="#fff" strokeWidth={2} />
      {showLabel && (
        <>
          <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={11} fontWeight={700}>
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#fff" fontSize={10} opacity={0.85}>
            {size}
          </text>
        </>
      )}
    </g>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon, color, sub }: {
  label: string; value: number | string; icon: React.ReactNode; color: string; sub?: string;
}) {
  return (
    <Card className="!bg-white h-full">
      <CardContent sx={{ borderLeft: `4px solid ${color}`, py: "14px !important", borderRadius: 1.5 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{label}</div>
            <div className="text-2xl font-bold mt-0.5" style={{ color }}>{value}</div>
            {sub && <div className="text-[10px] text-gray-400 mt-0.5">{sub}</div>}
          </div>
          <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: `${color}1a` }}>
            <span style={{ color }}>{icon}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ children, title, subtitle, icon, height = 280 }: {
  children: React.ReactNode; title: string; subtitle?: string; icon?: React.ReactNode; height?: number;
}) {
  return (
    <Card className="!bg-white h-full">
      <CardContent>
        <div className="flex items-center gap-2 mb-3">
          {icon && <span className="text-primary">{icon}</span>}
          <div>
            <div className="font-semibold text-gray-800 text-sm">{title}</div>
            {subtitle && <div className="text-[11px] text-gray-400">{subtitle}</div>}
          </div>
        </div>
        <div style={{ height, width: "100%" }}>{children}</div>
      </CardContent>
    </Card>
  );
}

function ActionChip({ type }: { type: string }) {
  const color = ACTION_COLORS[type];
  const chipColor =
    type === "ACTIVATED" ? "success" :
    type === "EXPIRED" ? "error" :
    type === "SUBMITTED" ? "info" :
    type === "REJECTED" ? "warning" :
    type === "ARCHIVED" ? "default" : "secondary";
  return (
    <Chip
      size="small"
      label={type.replace(/_/g, " ")}
      color={chipColor as any}
      variant="outlined"
      sx={{ fontSize: 9, height: 20, borderColor: color, color }}
    />
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupByMonth<T>(items: T[], dateKey: keyof T): Record<string, T[]> {
  const map: Record<string, T[]> = {};
  for (const item of items) {
    const d = item[dateKey] as string;
    const key = dayjs(d).format("MMM YY");
    if (!map[key]) map[key] = [];
    map[key].push(item);
  }
  return map;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PolicyReports() {
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [simulations, setSimulations] = useState<SimulationItem[]>([]);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [audit, setAudit] = useState<AuditItem[]>([]);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          policyService.getDashboardPolicies(),
          policyService.getReportSummary(),
          policyService.getReportAssignments(),
          policyService.getReportSimulations(),
          policyService.getReportConflicts(),
          policyService.getReportAudit(),
        ]);
        const [dashRes, sumRes, assignRes, simRes, conflictRes, auditRes] = results;
        if (dashRes.status === "fulfilled") setDashboard((dashRes.value as any)?.data);
        if (sumRes.status === "fulfilled") setSummary((sumRes.value as any)?.data ?? []);
        if (assignRes.status === "fulfilled") setAssignments((assignRes.value as any)?.data ?? []);
        if (simRes.status === "fulfilled") setSimulations((simRes.value as any)?.data ?? []);
        if (conflictRes.status === "fulfilled") setConflicts((conflictRes.value as any)?.data ?? []);
        if (auditRes.status === "fulfilled") setAudit((auditRes.value as any)?.data ?? []);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Derived data ──────────────────────────────────────────────────────────
  const totalPolicies = useMemo(() =>
    summary.reduce((s, d) => s + d.total, 0), [summary]);

  // Status donut from dashboard
  const statusPie = useMemo(() => {
    if (!dashboard) return [];
    return [
      { name: "Active", value: dashboard.activePolicies },
      { name: "Draft", value: dashboard.draftPolicies },
      { name: "Expired", value: dashboard.expiredPolicies },
      { name: "Archived", value: dashboard.archivedPolicies },
    ].filter((d) => d.value > 0);
  }, [dashboard]);

  // Domain stacked bar from summary
  const domainBar = useMemo(() =>
    summary.map((d) => ({
      domain: d.domainCode.length > 8 ? d.domainCode.slice(0, 8) : d.domainCode,
      fullDomain: d.domainCode,
      active: d.active,
      draft: d.draft,
      expired: d.expired,
      archived: d.archived,
    })), [summary]);

  // Assignment scope pie
  const scopePie = useMemo(() => {
    const counts = { Employee: 0, Department: 0, Designation: 0, Branch: 0, Global: 0 };
    for (const a of assignments) {
      if (a.employeeId) counts.Employee++;
      else if (a.departmentId) counts.Department++;
      else if (a.designationId) counts.Designation++;
      else if (a.branchId) counts.Branch++;
      else counts.Global++;
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));
  }, [assignments]);

  // Simulation status pie
  const simPie = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of simulations) {
      map[s.status] = (map[s.status] || 0) + 1;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [simulations]);

  // Audit actions grouped by month
  const auditTrend = useMemo(() => {
    const byMonth = groupByMonth(audit, "actionDate");
    const actionTypes = ["VERSION_CREATED", "SUBMITTED", "ACTIVATED", "EXPIRED"];
    return Object.entries(byMonth)
      .sort(([a], [b]) => dayjs(a, "MMM YY").valueOf() - dayjs(b, "MMM YY").valueOf())
      .map(([month, items]) => {
        const entry: Record<string, any> = { month };
        for (const t of actionTypes) {
          entry[t] = items.filter((i) => i.actionType === t).length;
        }
        return entry;
      });
  }, [audit]);

  // Radar data from summary — active count per domain
  const radarData = useMemo(() =>
    summary.map((d) => ({
      subject: d.domainCode.length > 7 ? d.domainCode.slice(0, 7) : d.domainCode,
      value: d.active,
    }))
  , [summary]);

  const priorityBar = useMemo(() => {
    const map: Record<number, number> = {};
    for (const a of assignments) { map[a.priority] = (map[a.priority] || 0) + 1; }
    return Object.entries(map)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([priority, count]) => ({ priority: `P${priority}`, count: Number(count) }));
  }, [assignments]);

  if (loading) {
    return (
      <Box className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <CircularProgress />
          <div className="text-gray-500 text-sm mt-3">Loading reports…</div>
        </div>
      </Box>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <div className="font-semibold text-gray-800">Policy Reports & Analytics</div>
        <div className="text-gray-500 text-[12px]">Insights across policy assignments, simulations, conflicts and audit activity</div>
      </div>

      {/* ── KPI Strip ── */}
      <Grid container spacing={2} className="mb-4">
        {[
          { label: "Total Policies", value: totalPolicies, icon: <PolicyIcon fontSize="small" />, color: "#008cff", sub: "All domains" },
          { label: "Active Policies", value: dashboard?.activePolicies ?? 0, icon: <CheckIcon fontSize="small" />, color: "#22c55e", sub: "Currently in effect" },
          { label: "Total Assignments", value: dashboard?.totalAssignments ?? assignments.length, icon: <AssignmentIcon fontSize="small" />, color: "#fac000", sub: "Across all versions" },
          { label: "Conflicts", value: dashboard?.conflicts ?? conflicts.length, icon: <WarningIcon fontSize="small" />, color: "#ef4444", sub: "Scope overlaps" },
        ].map((s) => (
          <Grid key={s.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* ── Row 1: Status Donut + Domain Stacked Bar ── */}
      <Grid container spacing={2} className="mb-4">
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Policy Status" subtitle="By lifecycle stage" icon={<BubbleIcon fontSize="small" />} height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusPie.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} policies`, ""]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <ChartCard title="Policies by Domain" subtitle="Total policies per domain" icon={<BarChartIcon fontSize="small" />} height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={domainBar}
                margin={{ top: 4, right: 16, left: -20, bottom: 24 }}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="domain"
                  tick={{ fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                <Bar dataKey="active" name="Active" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={28} />
                <Bar dataKey="draft" name="Draft" stackId="a" fill="#008cff" maxBarSize={28} />
                <Bar dataKey="expired" name="Expired" stackId="a" fill="#f43f5e" maxBarSize={28} />
                <Bar dataKey="archived" name="Archived" stackId="a" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* ── Row 2: Assignment Scope Pie + Simulation Status + Sim List ── */}
      <Grid container spacing={2} className="mb-4">
        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Assignment Scope" subtitle="How policies are assigned" icon={<AssignmentIcon fontSize="small" />} height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <Treemap
                data={scopePie.map((d, i) => ({
                  name: d.name,
                  size: d.value,
                  fill: SCOPE_COLORS[i % SCOPE_COLORS.length],
                }))}
                dataKey="size"
                content={<ScopeTreemapCell />}
              >
                <Tooltip
                  formatter={(v: any, _: any, props: any) => [`${v} assignments`, props.payload?.name]}
                  contentStyle={{ fontSize: 11 }}
                />
              </Treemap>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <ChartCard title="Simulation Status" subtitle="Run outcomes" icon={<SimIcon fontSize="small" />} height={240}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={simPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {simPie.map((_, i) => (
                    <Cell key={i} fill={_ .name === "COMPLETED" ? "#00d6a8" : _ .name === "FAILED" ? "#ef4444" : CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} runs`, ""]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card className="!bg-white h-full">
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-primary"><SimIcon fontSize="small" /></span>
                <div>
                  <div className="font-semibold text-gray-800 text-sm">Recent Simulations</div>
                  <div className="text-[11px] text-gray-400">Latest runs</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {simulations.length === 0 ? (
                  <div className="text-gray-400 text-[12px] text-center py-8">No simulations run yet</div>
                ) : (
                  simulations.slice(0, 5).map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                      <div>
                        <div className="text-[12px] font-medium text-gray-700">{s.simulationName}</div>
                        <div className="text-[10px] text-gray-400">{dayjs(s.createdAt).format("DD MMM YYYY HH:mm")}</div>
                      </div>
                      <Chip
                        size="small"
                        label={s.status}
                        color={s.status === "COMPLETED" ? "success" : s.status === "FAILED" ? "error" : "warning"}
                        sx={{ fontSize: 9, height: 20 }}
                      />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Row 3: Activity Line Chart + Radar ── */}
      <Grid container spacing={2} className="mb-4">
        <Grid size={{ xs: 12, md: 7 }}>
          <ChartCard
            title="Policy Activity Trend"
            subtitle="Version Created / Submitted / Activated / Expired by month"
            icon={<TimelineIcon fontSize="small" />}
            height={250}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={auditTrend} margin={{ top: 5, right: 15, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                {(["VERSION_CREATED", "SUBMITTED", "ACTIVATED", "EXPIRED"] as const).map((t) => (
                  <Line
                    key={t}
                    type="monotone"
                    dataKey={t}
                    name={t.replace(/_/g, " ")}
                    stroke={ACTION_COLORS[t]}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: ACTION_COLORS[t] }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard
            title="Domain Coverage Radar"
            subtitle="Active policies per domain"
            icon={<BubbleIcon fontSize="small" />}
            height={250}
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9 }} />
                <Radar
                  name="Active Policies"
                  dataKey="value"
                  stroke="#008cff"
                  fill="#008cff"
                  fillOpacity={0.25}
                  strokeWidth={2}
                />
                <Tooltip formatter={(v: any) => [`${v} active`, "Domain"]} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>
      </Grid>

      {/* ── Row 4: Assignment Priority Bar + Conflicts Table ── */}
      <Grid container spacing={2} className="mb-4">
        <Grid size={{ xs: 12, md: 5 }}>
          <ChartCard
            title="Assignment Priority Distribution"
            subtitle="Count by priority level"
            icon={<BarChartIcon fontSize="small" />}
            height={230}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={priorityBar}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="priority" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v} assignments`, "Count"]} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {assignments.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card className="!bg-white h-full">
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-primary"><ConflictIcon fontSize="small" /></span>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">Policy Conflicts</div>
                    <div className="text-[11px] text-gray-400">Scope overlap details</div>
                  </div>
                </div>
                <Chip size="small" label={`${conflicts.length} total`} color="error" variant="outlined" />
              </div>
              <TableContainer sx={{ maxHeight: 240 }} className="border border-gray-200 rounded-sm">
                <Table size="small" stickyHeader >
                  <TableHead>
                    <TableRow>
                      <TableCell className="!font-semibold !text-[11px]">#</TableCell>
                      <TableCell className="!font-semibold !text-[11px]">Type</TableCell>
                      <TableCell className="!font-semibold !text-[11px]">Message</TableCell>
                      <TableCell className="!font-semibold !text-[11px]">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {conflicts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <div className="py-6 text-center">
                            <CheckIcon className="text-green-400" />
                            <div className="text-gray-400 text-[12px] mt-1">No conflicts detected</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      conflicts.map((c, i) => (
                        <TableRow key={c.id} hover sx={getRowColor(i)}>
                          <TableCell className="!text-[11px]">{i + 1}</TableCell>
                          <TableCell>
                            <Chip size="small" label={c.conflictType.replace(/_/g, " ")} color="warning" sx={{ fontSize: 9, height: 18 }} />
                          </TableCell>
                          <TableCell className="!text-[11px] max-w-[280px]">
                            <MuiTooltip title={c.conflictMessage} arrow>
                              <span className="truncate block" style={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {c.conflictMessage}
                              </span>
                            </MuiTooltip>
                          </TableCell>
                          <TableCell className="!text-[11px] text-gray-400 whitespace-nowrap">
                            {dayjs(c.createdAt).format("DD MMM YYYY")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Row 5: Audit Log Table ── */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card className="!bg-white">
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-primary"><TimelineIcon fontSize="small" /></span>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">Audit Log</div>
                    <div className="text-[11px] text-gray-400">All policy version actions</div>
                  </div>
                </div>
                <Chip size="small" label={`${audit.length} entries`} variant="outlined" className="text-gray-800"/>
              </div>
              <TableContainer sx={{ maxHeight: 280 }} className="border border-gray-200 rounded-sm">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell className="!font-semibold !text-[11px]">#</TableCell>
                      <TableCell className="!font-semibold !text-[11px]">Action</TableCell>
                      <TableCell className="!font-semibold !text-[11px]">Policy Name</TableCell>
                      <TableCell className="!font-semibold !text-[11px]">Version No</TableCell>
                      <TableCell className="!font-semibold !text-[11px]">Remarks</TableCell>
                      <TableCell className="!font-semibold !text-[11px]">Action By</TableCell>
                      <TableCell className="!font-semibold !text-[11px]">Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {audit.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <div className="py-8 text-gray-400 text-[12px]">No audit records</div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      audit.map((a, i) => (
                        <TableRow key={a.id} hover sx={getRowColor(i)}>
                          <TableCell className="!text-[11px]">{i + 1}</TableCell>
                          <TableCell><ActionChip type={a.actionType} /></TableCell>
                          <TableCell className="!text-[10px] text-gray-400 font-mono">
                            {a.policyName}
                          </TableCell>
                          <TableCell className="!text-[10px] text-gray-400 font-mono">
                            {a.versionNo}
                          </TableCell>
                          <TableCell className="!text-[11px] text-gray-600">{a.remarks ?? "—"}</TableCell>
                           <TableCell className="!text-[10px] text-gray-400 font-mono">
                            {/* {a.actionByName.slice(0, 8)}… */}
                            {a.actionByName}
                          </TableCell>
                          <TableCell className="!text-[11px] text-gray-400 whitespace-nowrap">
                            {dayjs(a.actionDate).format("DD MMM YYYY HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}
