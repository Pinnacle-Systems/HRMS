import { useEffect, useState } from "react";
import { Box, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import { formatDate } from "../../../utils/dateFormatter";
import {
  salaryRevisionService,
  type SalaryHistoryEntry,
} from "../../../services/modules/payrollServices/salaryRevision";
import { useUI } from "../../../context/Snackbar";
import { getRowColor } from "../../const";

const getDummyHistory = (employeeId: string): SalaryHistoryEntry[] => [
  {
    id: "h-1",
    employeeId,
    effectiveFrom: "2026-04-01",
    revisionId: "rev-101",
    reason: "ANNUAL_INCREMENT",
    oldCtc: 800000,
    newCtc: 880000,
    incrementPercent: 10,
    approvedBy: "ceo@company.com",
    createdAt: "2026-04-01T00:05:00Z",
    components: [
      { componentId: "c1", componentName: "Basic",             componentType: "EARNING", oldValue: 24000, newValue: 27200, delta: 3200, deltaPercent: 13.33 },
      { componentId: "c2", componentName: "HRA",               componentType: "EARNING", oldValue: 12000, newValue: 13600, delta: 1600, deltaPercent: 13.33 },
      { componentId: "c3", componentName: "Special Allowance", componentType: "EARNING", oldValue: 24000, newValue: 27200, delta: 3200, deltaPercent: 13.33 },
    ],
  },
  {
    id: "h-2",
    employeeId,
    effectiveFrom: "2025-04-01",
    revisionId: "rev-103",
    reason: "ANNUAL_INCREMENT",
    oldCtc: 720000,
    newCtc: 800000,
    incrementPercent: 11.11,
    approvedBy: "ceo@company.com",
    createdAt: "2025-04-01T00:05:00Z",
    components: [
      { componentId: "c1", componentName: "Basic",             componentType: "EARNING", oldValue: 21600, newValue: 24000, delta: 2400, deltaPercent: 11.11 },
      { componentId: "c2", componentName: "HRA",               componentType: "EARNING", oldValue: 10800, newValue: 12000, delta: 1200, deltaPercent: 11.11 },
      { componentId: "c3", componentName: "Special Allowance", componentType: "EARNING", oldValue: 21600, newValue: 24000, delta: 2400, deltaPercent: 11.11 },
    ],
  },
];

interface SalaryHistoryProps {
  selectedEmployee?: string;
  employeeId?: string;
}

export default function SalaryHistory({
  selectedEmployee,
  employeeId,
}: SalaryHistoryProps) {
  const [history, setHistory] = useState<SalaryHistoryEntry[]>([]);
  const { showSpinner, hideSpinner, showSnackbar } = useUI();

  const empId = employeeId || selectedEmployee;

  useEffect(() => {
    if (!empId) return;

    let cancelled = false;
    showSpinner();

    salaryRevisionService
      .getEmployeeHistory(empId)
      .then((res: any) => {
        if (cancelled) return;
        const payload = res?.data;
        const rows: SalaryHistoryEntry[] = Array.isArray(payload)
          ? payload
          : payload?.content || [];
        setHistory(rows);
      })
      .catch((_err: any) => {
        if (cancelled) return;
        showSnackbar("Failed to load salary history", "error");
        setHistory(getDummyHistory(empId));
      })
      .finally(() => {
        if (!cancelled) hideSpinner();
      });

    return () => {
      cancelled = true;
    };
  }, [empId]);

  return (
    <Box>
      <div className="text-[12px] font-bold text-gray-800 mb-4">
        Salary History
      </div>

      {!history.length && (
        <div className="text-xs text-gray-500">No revision history yet.</div>
      )}

      <Box className="flex flex-col gap-3">
        {history.map((h, i) => (
          <Paper key={h.id} className="!p-3 !shadow-sm !bg-white-50 border border-gray-200">
            <Box className="flex justify-between items-center mb-2">
              <div>
                <div className="text-xs font-semibold text-gray-800">
                  Effective {formatDate(h.effectiveFrom)}
                </div>
                <div className="text-[10px] text-gray-500">
                  {h.reason.replace(/_/g, " ")} • Approved by {h.approvedBy}
                </div>
              </div>
              <Chip
                label={`+${h.incrementPercent.toFixed(2)}%`}
                size="small"
                color={i === 0 ? "primary" : "success"}
              />
            </Box>

            <Box className="grid grid-cols-3 gap-2 text-xs mb-2 text-gray-800">
              <div>Old CTC: <span className="text-error font-bold">₹ {h.oldCtc.toLocaleString("en-IN")}</span></div>
              <div>New CTC: <span className="text-green-600 font-bold">₹ {h.newCtc.toLocaleString("en-IN")}</span> </div>
              <div>Δ: <span className="text-blue-500 font-bold">₹ {(h.newCtc - h.oldCtc).toLocaleString("en-IN")}</span></div>
            </Box>

            <details className="text-xs">
              <summary className="cursor-pointer text-primary">
                Component Breakdown
              </summary>
              <Table className="w-full mt-2 border border-gray-200 bg-white">
                <TableHead>
                  <TableRow className="text-gray-500">
                    <TableCell className="text-left !font-bold">Component</TableCell>
                    <TableCell className="text-right !font-bold">Old</TableCell>
                    <TableCell className="text-right !font-bold">New</TableCell>
                    <TableCell className="text-right !font-bold">Δ</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {h.components.map((c,i) => (
                    <TableRow key={c.componentId} sx={getRowColor(i)}>
                      <TableCell><div className="py-1">{c.componentName}</div></TableCell>
                      <TableCell className="text-right">
                        ₹ {c.oldValue.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹ {c.newValue.toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right text-green-700">
                        +₹ {c.delta.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </details>
          </Paper>
        ))}
      </Box>
    </Box>
  );
}