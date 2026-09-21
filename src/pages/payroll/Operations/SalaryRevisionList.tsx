import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { salaryRevisionService } from "../../../services/modules/payrollServices/salaryRevision.ts";
import { formatDate } from "../../../utils/dateFormatter";
import type { SalaryRevision } from "../../../services/modules/payrollServices/salaryRevision.ts";
import { CheckCircleOutlineOutlined, DeleteOutlineOutlined } from "@mui/icons-material";
import { getRowColor } from "../../const.ts";
import { statusColor } from "../const.ts";
import { useUI } from "../../../context/Snackbar.tsx";

export default function SalaryRevisionList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SalaryRevision[]>([]);
  const [search, setSearch] = useState("");
  const { showSpinner, showSnackbar, hideSpinner } = useUI();

  const load = async () => {
    showSpinner();
    try {
      const res: any = await salaryRevisionService.getRevisions();
      setRows(res.data || []);
    } catch (err) {
      showSnackbar("Failed to load revisions", "error");
      setRows([{
        id: "rev-101",
        revisionCode: "REV-2026-001",
        title: "Annual Increment 2026",
        reason: "ANNUAL_INCREMENT",
        effectiveFrom: "2026-04-01",
        status: "PENDING_APPROVAL",
        templateId: "t1",
        totalEmployees: 3,
        totalIncrementCost: 210000,
        createdBy: "hr.admin@company.com",
        createdAt: "2026-03-01T10:15:00Z",
        employees: [],
      },
      {
        id: "rev-102",
        revisionCode: "REV-2026-002",
        title: "Promotion – Engineering Team",
        reason: "PROMOTION",
        effectiveFrom: "2026-05-01",
        status: "DRAFT",
        templateId: "t3",
        totalEmployees: 2,
        totalIncrementCost: 180000,
        createdBy: "hr.admin@company.com",
        createdAt: "2026-03-10T09:00:00Z",
        employees: [],
      },
      {
        id: "rev-103",
        revisionCode: "REV-2025-018",
        title: "Annual Increment 2025",
        reason: "ANNUAL_INCREMENT",
        effectiveFrom: "2025-04-01",
        status: "APPLIED",
        templateId: "t1",
        totalEmployees: 42,
        totalIncrementCost: 1250000,
        createdBy: "hr.admin@company.com",
        createdAt: "2025-03-01T10:00:00Z",
        approvedBy: "ceo@company.com",
        approvedAt: "2025-03-05T09:00:00Z",
        employees: [],
      },
      {
        id: "rev-104",
        revisionCode: "REV-2025-017",
        title: "Market Adjustment – Sales",
        reason: "MARKET_ADJUSTMENT",
        effectiveFrom: "2025-02-01",
        status: "REJECTED",
        templateId: "t2",
        totalEmployees: 8,
        totalIncrementCost: 40000,
        createdBy: "hr.admin@company.com",
        createdAt: "2025-01-20T11:30:00Z",
        employees: [],
      },])
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this revision?")) return;
    await salaryRevisionService.deleteRevision(id);
    load();
  };

  const handleQuickApprove = async (id: string) => {
    await salaryRevisionService.approveRevision(id);
    load();
  };

  const filtered = rows.filter(
    (r) =>
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.revisionCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box className="flex justify-between items-center mb-4">
        <div>
          <div className="text-xs font-bold text-gray-800">Salary Revisions</div>
          <div className="text-xs text-gray-500">
            Create and manage employee salary revisions, increments & promotions
          </div>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/payroll/revision/create")}
          className="!bg-primary !text-white !text-xs"
        >
          New Revision
        </Button>
      </Box>

      <TextField
        size="small"
        placeholder="Search by code or title…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="!mb-3 !w-72"
      />

      <TableContainer>
        <Table size="small" className="border border-gray-200 rounded-md">
          <TableHead className="!bg-gray-50">
            <TableRow>
              <TableCell className="!text-xs !font-semibold">S No</TableCell>
              <TableCell className="!text-xs !font-semibold">Code</TableCell>
              <TableCell className="!text-xs !font-semibold">Title</TableCell>
              <TableCell className="!text-xs !font-semibold">Reason</TableCell>
              <TableCell className="!text-xs !font-semibold">Effective From</TableCell>
              <TableCell className="!text-xs !font-semibold">Employees</TableCell>
              <TableCell className="!text-xs !font-semibold">Total Cost</TableCell>
              <TableCell className="!text-xs !font-semibold">Status</TableCell>
              <TableCell className="!text-xs !font-semibold">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((r, i) => (
              <TableRow key={r.id} sx={getRowColor(i)}>
                <TableCell className="!text-xs">{i + 1}</TableCell>
                <TableCell className="!text-xs">{r.revisionCode}</TableCell>
                <TableCell className="!text-xs">{r.title}</TableCell>
                <TableCell className="!text-xs">
                  <Chip
                    label={r.reason.replace(/_/g, " ")}
                    size="small"
                    variant="outlined"
                    className="text-gray-800"
                  />
                </TableCell>
                <TableCell className="!text-xs">{formatDate(r.effectiveFrom)}</TableCell>
                <TableCell className="!text-xs">{r.totalEmployees}</TableCell>
                <TableCell className="!text-xs">
                  ₹ {r.totalIncrementCost.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  <Chip
                    label={r.status.replace(/_/g, " ")}
                    color={statusColor[r.status]}
                    size="small"
                    className="text-gray-800"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="View / Approve">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/payroll/revision/${r.id}`)}
                    >
                      <VisibilityOutlinedIcon fontSize="small" className="text-primary !w-4" />
                    </IconButton>
                  </Tooltip>
                  {r.status === "PENDING_APPROVAL" && (
                    <Tooltip title="Quick Approve">
                      <IconButton
                        size="small"
                        className="!text-green-600"
                        onClick={() => handleQuickApprove(r.id)}
                      >
                        <CheckCircleOutlineOutlined fontSize="small" className="!w-4" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {r.status === "DRAFT" && (
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        className="!text-red-500"
                        onClick={() => handleDelete(r.id)}
                      >
                        <DeleteOutlineOutlined fontSize="small" className="!w-4" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!filtered.length && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  align="center"

                >
                  <div className="!py-6 !text-xs !text-gray-500">No revisions found. Create your first revision.</div>

                </TableCell>
              </TableRow>
            )}
      
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}