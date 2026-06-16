import { PolicyDomain } from "../../types/policy";

export const statsCard = [
  {
    label: "Total Policies",
    value: "total",
    color: "#64748b",
    bgColor: "#f8fafc",
    total: "total",
    icon: "total",
  },
  {
    label: "Active",
    value: "active",
    color: "#22c55e",
    bgColor: "#f0fdf4",
    total: "active",
    icon: "active",
  },
  {
    label: "Pending Approval",
    value: "pending",
    color: "#f59e0b",
    bgColor: "#fffbeb",
    total: "pending",
    icon: "pending",
  },
  {
    label: "Drafts",
    value: "draft",
    color: "#0288d1",
    bgColor: "#f0f9ff",
    total: "draft",
    icon: "draft",
  },
  {
    label: "Archived",
    value: "archived",
    color: "#9602d1",
    bgColor: "#fdf4ff",
    total: "archived",
    icon: "archived",
  },
  {
    label: "Expired",
    value: "expired",
    color: "#ef4444",
    bgColor: "#fef2f2",
    total: "expired",
    icon: "expired",
  },
];
export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

export const actionOptions: Record<PolicyDomain, string[]> = {
    [PolicyDomain.LEAVE]: ['APPLY_LEAVE', 'CANCEL_LEAVE', 'CHECK_BALANCE', 'GET_APPROVERS'],
    [PolicyDomain.ATTENDANCE]: ['MARK_ATTENDANCE', 'REGULARIZE_ATTENDANCE', 'CHECK_LATE_PENALTY'],
    [PolicyDomain.OVERTIME]: ['REQUEST_OVERTIME', 'APPROVE_OVERTIME', 'CALCULATE_OVERTIME'],
    [PolicyDomain.EXPENSE]: ['SUBMIT_EXPENSE', 'APPROVE_EXPENSE', 'CHECK_ELIGIBILITY'],
    [PolicyDomain.PAYROLL]: ['CALCULATE_SALARY', 'PROCESS_PAYROLL', 'CALCULATE_DEDUCTION'],
    // [PolicyDomain.SHIFT]: ['REQUEST_SHIFT_CHANGE', 'CHECK_SHIFT_ELIGIBILITY'],
    [PolicyDomain.HOLIDAY]: ['CHECK_HOLIDAY_ELIGIBILITY', 'REQUEST_HOLIDAY_WORK'],
    [PolicyDomain.ALLOWANCE]: ['CHECK_ALLOWANCE_ELIGIBILITY', 'CALCULATE_ALLOWANCE'],
    [PolicyDomain.DEDUCTION]: ['CALCULATE_DEDUCTION', 'CHECK_DEDUCTION_APPLICABILITY'],
    [PolicyDomain.PROBATION]: ['CHECK_PROBATION_STATUS', 'EXTEND_PROBATION'],
    [PolicyDomain.NOTICE_PERIOD]: ['SUBMIT_RESIGNATION', 'CALCULATE_NOTICE_PAY'],
    // [PolicyDomain.APPROVAL_WORKFLOW]: ['GET_APPROVAL_FLOW', 'CHECK_APPROVAL_STATUS'],
    [PolicyDomain.ONBOARDING]: ['CHECK_ONBOARDING_TASKS', 'VALIDATE_DOCUMENTS'],
    [PolicyDomain.OFFBOARDING]: ['INITIATE_OFFBOARDING', 'CHECK_EXIT_TASKS'],
    [PolicyDomain.COMP_OFF]: ['APPLY_COMP_OFF', 'CHECK_COMP_OFF_BALANCE', 'EARN_COMP_OFF'],
    [PolicyDomain.WORK_FROM_HOME]: ['REQUEST_WFH', 'CHECK_WFH_ELIGIBILITY', 'CHECK_WFH_BALANCE'],
    [PolicyDomain.BONUS]: ['CHECK_BONUS_ELIGIBILITY', 'CALCULATE_BONUS', 'PROCESS_BONUS_PAYOUT'],
    [PolicyDomain.LOAN_ADVANCE]: ['APPLY_LOAN', 'CHECK_LOAN_ELIGIBILITY', 'CALCULATE_EMI', 'CHECK_OUTSTANDING_BALANCE'],
  };