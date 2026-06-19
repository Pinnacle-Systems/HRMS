import { useState } from "react";
import {
  CalendarMonthOutlined, AccessTimeOutlined, WatchLaterOutlined,
  EventBusyOutlined, TouchAppOutlined, CorporateFareOutlined,
  ManageAccountsOutlined, BeachAccessOutlined,
} from "@mui/icons-material";
import { MonthlySummaryReport }   from "./reports/MonthlySummaryReport";
import { LateArrivalReport }       from "./reports/LateArrivalReport";
import { OvertimeReport }          from "./reports/OvertimeReport";
import { AbsenteeismReport }       from "./reports/AbsenteeismReport";
import { IrregularPunchReport }    from "./reports/IrregularPunchReport";
import { DepartmentWiseReport }    from "./reports/DepartmentWiseReport";
import { EmployeeHistoryReport }   from "./reports/EmployeeHistoryReport";
import { LeaveUtilizationReport }  from "./reports/LeaveUtilizationReport";

type ReportId =
  | "monthly-summary"
  | "late-arrival"
  | "overtime"
  | "absenteeism"
  | "irregular-punch"
  | "department-wise"
  | "employee-history"
  | "leave-utilization";

interface ReportMeta {
  id: ReportId;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
  tag: string;
}

const REPORTS: ReportMeta[] = [
  {
    id: "monthly-summary",
    title: "Monthly Attendance Summary",
    description: "Employee-wise monthly roll-up: present, absent, late, OT hours, LOP days, and attendance %",
    icon: <CalendarMonthOutlined fontSize="large" />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200 hover:border-blue-400",
    tag: "Monthly",
  },
  {
    id: "late-arrival",
    title: "Late Arrival Report",
    description: "Employees who arrived after shift start with date-wise late minutes and frequency",
    icon: <AccessTimeOutlined fontSize="large" />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200 hover:border-amber-400",
    tag: "Daily",
  },
  {
    id: "overtime",
    title: "Overtime Report",
    description: "OT hours worked beyond shift end, per employee, per date — with shift-based calculation",
    icon: <WatchLaterOutlined fontSize="large" />,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200 hover:border-orange-400",
    tag: "Daily",
  },
  {
    id: "absenteeism",
    title: "Absenteeism Report",
    description: "Absence frequency, consecutive absent streak, LOP days, and absenteeism rate per employee",
    icon: <EventBusyOutlined fontSize="large" />,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200 hover:border-red-400",
    tag: "Monthly",
  },
  {
    id: "irregular-punch",
    title: "Irregular Punch Report",
    description: "Employees with missing check-in or check-out — essential review before period finalisation",
    icon: <TouchAppOutlined fontSize="large" />,
    color: "text-pink-600",
    bg: "bg-pink-50",
    border: "border-pink-200 hover:border-pink-400",
    tag: "Pre-finalisation",
  },
  {
    id: "department-wise",
    title: "Department-wise Report",
    description: "Attendance aggregated by department: present, absent, late, OT, and average attendance %",
    icon: <CorporateFareOutlined fontSize="large" />,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200 hover:border-cyan-400",
    tag: "Management",
  },
  {
    id: "employee-history",
    title: "Employee Attendance History",
    description: "Complete date-wise attendance log for a single employee — check-in/out, status, OT, remarks",
    icon: <ManageAccountsOutlined fontSize="large" />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-200 hover:border-violet-400",
    tag: "Individual",
  },
  {
    id: "leave-utilization",
    title: "Leave Utilization Report",
    description: "Leave balance vs taken, accruals, encashment, and lapsed days by employee and leave type",
    icon: <BeachAccessOutlined fontSize="large" />,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200 hover:border-green-400",
    tag: "Leave",
  },
];

function ReportCard({ report, onClick }: { report: ReportMeta; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left border-2 ${report.border} rounded-xl p-5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 bg-white group w-full`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`${report.bg} ${report.color} p-3 rounded-xl`}>
          {report.icon}
        </div>
        <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${report.bg} ${report.color}`}>
          {report.tag}
        </span>
      </div>
      <div className="font-semibold text-gray-800 text-sm mb-1 transition-colors">
        {report.title}
      </div>
      <div className="text-xs text-gray-500 leading-relaxed">{report.description}</div>
      <div className={`mt-3 text-xs font-medium ${report.color} opacity-0 group-hover:opacity-100 transition-opacity`}>
        Open report →
      </div>
    </button>
  );
}

function renderReport(id: ReportId, onBack: () => void) {
  switch (id) {
    case "monthly-summary":   return <MonthlySummaryReport onBack={onBack} />;
    case "late-arrival":      return <LateArrivalReport onBack={onBack} />;
    case "overtime":          return <OvertimeReport onBack={onBack} />;
    case "absenteeism":       return <AbsenteeismReport onBack={onBack} />;
    case "irregular-punch":   return <IrregularPunchReport onBack={onBack} />;
    case "department-wise":   return <DepartmentWiseReport onBack={onBack} />;
    case "employee-history":  return <EmployeeHistoryReport onBack={onBack} />;
    case "leave-utilization": return <LeaveUtilizationReport onBack={onBack} />;
  }
}

export default function AttendanceReports() {
  const [activeReport, setActiveReport] = useState<ReportId | null>(null);

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-4">
        <div className="font-semibold text-gray-800">Attendance Reports</div>
        <div className="text-gray-500 text-[12px]">
          Generate, preview, and export attendance analytics reports
        </div>
      </div>

      {activeReport ? (
        <div className="border border-gray-300 bg-white p-4">
          {renderReport(activeReport, () => setActiveReport(null))}
        </div>
      ) : (
        <div className="border border-gray-200 bg-white-50 p-4 rounded-sm space-y-4">
          {/* Category headers + cards */}
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Periodic Reports
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {REPORTS.filter(r => ["monthly-summary", "absenteeism", "leave-utilization"].includes(r.id)).map(r => (
                <ReportCard key={r.id} report={r} onClick={() => setActiveReport(r.id)} />
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Daily & Operational Reports
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {REPORTS.filter(r => ["late-arrival", "overtime", "irregular-punch"].includes(r.id)).map(r => (
                <ReportCard key={r.id} report={r} onClick={() => setActiveReport(r.id)} />
              ))}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Management & Individual Reports
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {REPORTS.filter(r => ["department-wise", "employee-history"].includes(r.id)).map(r => (
                <ReportCard key={r.id} report={r} onClick={() => setActiveReport(r.id)} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
