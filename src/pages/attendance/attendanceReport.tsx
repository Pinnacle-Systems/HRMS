import { useState } from "react";
import {
  CalendarMonthOutlined, AccessTimeOutlined, WatchLaterOutlined,
  EventBusyOutlined, TouchAppOutlined, CorporateFareOutlined,
  ManageAccountsOutlined, BeachAccessOutlined, ChevronRight,
} from "@mui/icons-material";
import { MonthlySummaryReport } from "./reports/MonthlySummaryReport";
import { LateArrivalReport } from "./reports/LateArrivalReport";
import { OvertimeReport } from "./reports/OvertimeReport";
import { AbsenteeismReport } from "./reports/AbsenteeismReport";
import { IrregularPunchReport } from "./reports/IrregularPunchReport";
import { DepartmentWiseReport } from "./reports/DepartmentWiseReport";
import { EmployeeHistoryReport } from "./reports/EmployeeHistoryReport";
import { LeaveUtilizationReport } from "./reports/LeaveUtilizationReport";
import { LopReport } from "./reports/LopReport";

type ReportId =
  | "monthly-summary"
  | "late-arrival"
  | "overtime"
  | "absenteeism"
  | "irregular-punch"
  | "department-wise"
  | "employee-history"
  | "lop"
  | "leave-utilization";

interface ReportMeta {
  id: ReportId;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  tag: string;
}

const REPORTS: ReportMeta[] = [
  {
    id: "monthly-summary",
    title: "Monthly Attendance Summary",
    description: "Employee-wise monthly roll-up: present, absent, late, OT hours, LOP days, and attendance %",
    icon: <CalendarMonthOutlined />,
    color: "text-blue-600",
    bg: "bg-blue-50",
    tag: "Monthly",
  },
  {
    id: "late-arrival",
    title: "Late Arrival Report",
    description: "Employees who arrived after shift start with date-wise late minutes and frequency",
    icon: <AccessTimeOutlined />,
    color: "text-amber-600",
    bg: "bg-amber-50",
    tag: "Daily",
  },
  {
    id: "overtime",
    title: "Overtime Report",
    description: "OT hours worked beyond shift end, per employee, per date — with shift-based calculation",
    icon: <WatchLaterOutlined />,
    color: "text-orange-600",
    bg: "bg-orange-50",
    tag: "Daily",
  },
  {
    id: "absenteeism",
    title: "Absenteeism Report",
    description: "Absence frequency, consecutive absent streak, LOP days, and absenteeism rate per employee",
    icon: <EventBusyOutlined />,
    color: "text-red-600",
    bg: "bg-red-50",
    tag: "Monthly",
  },
  {
    id: "irregular-punch",
    title: "Irregular Punch Report",
    description: "Employees with missing check-in or check-out — essential review before period finalisation",
    icon: <TouchAppOutlined />,
    color: "text-pink-600",
    bg: "bg-pink-50",
    tag: "Pre-finalisation",
  },
  {
    id: "department-wise",
    title: "Department-wise Report",
    description: "Attendance aggregated by department: present, absent, late, OT, and average attendance %",
    icon: <CorporateFareOutlined />,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    tag: "Management",
  },
  {
    id: "employee-history",
    title: "Employee Attendance History",
    description: "Complete date-wise attendance log for a single employee — check-in/out, status, OT, remarks",
    icon: <ManageAccountsOutlined />,
    color: "text-violet-600",
    bg: "bg-violet-50",
    tag: "Individual",
  },
  {
    id: "leave-utilization",
    title: "Leave Utilization Report",
    description: "Leave balance vs taken, accruals, encashment, and lapsed days by employee and leave type",
    icon: <BeachAccessOutlined />,
    color: "text-green-600",
    bg: "bg-green-50",
    tag: "Leave",
  },
  {
    id: "lop",
    title: "Loss of Pay (LOP) Report",
    description: "Employee-wise loss of pay days with absence details, LOP calculation, and reason tracking",
    icon: <EventBusyOutlined />,
    color: "text-red-600",
    bg: "bg-red-50",
    tag: "Monthly",
  },
];

function ReportRow({ report, onClick }: { report: ReportMeta; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 px-4 py-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors group"
    >
      <div className={`${report.bg} ${report.color} p-1 rounded-lg shrink-0`}>
        {report.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-[12px] text-gray-800">{report.title}</span>
          <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${report.bg} ${report.color}`}>
            {report.tag}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5 truncate">{report.description}</div>
      </div>
      <ChevronRight
        fontSize="small"
        className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0"
      />
    </button>
  );
}

function ReportSection({
  title,
  ids,
  onSelect,
}: {
  title: string;
  ids: ReportId[];
  onSelect: (id: ReportId) => void;
}) {
  const items = REPORTS.filter((r) => ids.includes(r.id));
  return (
    <div>
      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
        {title}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {items.map((r) => (
          <ReportRow key={r.id} report={r} onClick={() => onSelect(r.id)} />
        ))}
      </div>
    </div>
  );
}

function renderReport(id: ReportId, onBack: () => void) {
  switch (id) {
    case "monthly-summary": return <MonthlySummaryReport onBack={onBack} />;
    case "late-arrival": return <LateArrivalReport onBack={onBack} />;
    case "overtime": return <OvertimeReport onBack={onBack} />;
    case "absenteeism": return <AbsenteeismReport onBack={onBack} />;
    case "irregular-punch": return <IrregularPunchReport onBack={onBack} />;
    case "department-wise": return <DepartmentWiseReport onBack={onBack} />;
    case "employee-history": return <EmployeeHistoryReport onBack={onBack} />;
    case "leave-utilization": return <LeaveUtilizationReport onBack={onBack} />;
    case "lop": return <LopReport onBack={onBack} />;
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
        <div className="space-y-5 mb-5">
          <ReportSection
            title="Periodic Reports"
            ids={["monthly-summary", "absenteeism", "leave-utilization", "lop"]}
            onSelect={setActiveReport}
          />
          <ReportSection
            title="Daily & Operational Reports"
            ids={["late-arrival", "overtime", "irregular-punch"]}
            onSelect={setActiveReport}
          />
          <ReportSection
            title="Management & Individual Reports"
            ids={["department-wise", "employee-history"]}
            onSelect={setActiveReport}
          />
        </div>
      )}
    </div>
  );
}