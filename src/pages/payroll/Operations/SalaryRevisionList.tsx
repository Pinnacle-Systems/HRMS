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
import {
  salaryRevisionService,
} from "../../../services/modules/payrollServices/salaryRevision.ts";
import { formatDate } from "../../../utils/dateFormatter";
import type { SalaryRevision } from "../../../services/modules/payrollServices/salaryRevision.ts";
import {
  CheckCircleOutlineOutlined,
  Delete,
} from "@mui/icons-material";
import { getRowColor } from "../../const.ts";
import { statusColor } from "../const.ts";
import { useUI } from "../../../context/Snackbar.tsx";

export default function SalaryRevisionList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<SalaryRevision[]>([]);
  const [search, setSearch] = useState("");
  const {
    showSpinner,
    showSnackbar,
    hideSpinner,
    showConfirmDialog,
  } = useUI();

  // ────────────────────────────────────────────────────────
  // Load
  // ────────────────────────────────────────────────────────
  const load = async () => {
    showSpinner();
    try {
      const res: any = await salaryRevisionService.getRevisions();
      setRows(res.data.content || []);
    } catch (err) {
      showSnackbar("Failed to load revisions", "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ────────────────────────────────────────────────────────
  // Delete Draft (with confirm dialog)
  // ────────────────────────────────────────────────────────
  const handleDelete = (id: string, title: string) => {
    showConfirmDialog({
      title: "Delete Draft",
      message: `Delete draft "${title}"?\n\nThis action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "danger",
      onConfirm: async () => {
        showSpinner();
        try {
          await salaryRevisionService.deleteRevision(id);
          showSnackbar("Draft deleted", "success");
          load();
        } catch (err: any) {
          showSnackbar(
            err?.response?.data?.message || "Failed to delete draft",
            "error"
          );
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // ────────────────────────────────────────────────────────
  // Quick Approve (with confirm dialog)
  // ────────────────────────────────────────────────────────
  const handleQuickApprove = (id: string, title: string) => {
    showConfirmDialog({
      title: "Approve Revision",
      message: `Approve "${title}"?\n\nThis will move it to APPROVED status. You'll then be able to apply it to payroll from the details page.`,
      confirmText: "Approve",
      cancelText: "Cancel",
      variant: "success",
      onConfirm: async () => {
        showSpinner();
        try {
          await salaryRevisionService.approveRevision(id);
          showSnackbar("Revision approved", "success");
          load();
        } catch (err: any) {
          showSnackbar(
            err?.response?.data?.message || "Failed to approve",
            "error"
          );
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // ────────────────────────────────────────────────────────
  // Filter
  // ────────────────────────────────────────────────────────
  const filtered = rows.filter(
    (r) =>
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.revisionCode?.toLowerCase().includes(search.toLowerCase())
  );

  // ────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────
  return (
    <Box>
      <Box className="flex justify-between items-center mb-4">
        <div>
          <div className="text-xs font-bold text-gray-800">
            Salary Revisions
          </div>
          <div className="text-xs text-gray-500">
            Create and manage employee salary revisions, increments &
            promotions
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
              <TableCell className="!text-xs !font-semibold">
                Effective From
              </TableCell>
              <TableCell className="!text-xs !font-semibold">
                Employees
              </TableCell>
              <TableCell className="!text-xs !font-semibold">
                Total Cost
              </TableCell>
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
                <TableCell className="!text-xs">
                  {formatDate(r.effectiveFrom)}
                </TableCell>
                <TableCell className="!text-xs">{r.totalEmployees}</TableCell>
                <TableCell className="!text-xs">
                  ₹ {r.totalIncrementCost.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  <Chip
                    label={r.status.replace(/_/g, " ")}
                    color={statusColor[r.status]}
                    size="small"
                    className={`${
                      r.status === "DRAFT" ? "text-gray-800 bg-gray-200" : ""
                    }`}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="View / Approve">
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/payroll/revision/${r.id}`)}
                    >
                      <VisibilityOutlinedIcon
                        fontSize="small"
                        className="text-primary !w-4"
                      />
                    </IconButton>
                  </Tooltip>

                  {r.status === "PENDING_APPROVAL" && (
                    <Tooltip title="Quick Approve">
                      <IconButton
                        size="small"
                        className="!text-green-600"
                        onClick={() => handleQuickApprove(r.id, r.title)}
                      >
                        <CheckCircleOutlineOutlined
                          fontSize="small"
                          className="!w-4"
                        />
                      </IconButton>
                    </Tooltip>
                  )}

                  {r.status === "DRAFT" && (
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        className="!text-red-500"
                        onClick={() => handleDelete(r.id, r.title)}
                      >
                        <Delete fontSize="small" className="!w-4" />
                      </IconButton>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {!filtered.length && (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <div className="!py-6 !text-gray-500">
                    No revisions found.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}