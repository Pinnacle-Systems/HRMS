import { useEffect, useState } from "react";
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Divider,
  Collapse,
  IconButton,
  Button,
  Tooltip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EventIcon from "@mui/icons-material/Event";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { Person2Outlined } from "@mui/icons-material";
import { formatDate } from "../../../utils/dateFormatter";
import {
  salaryRevisionService,
  type SalaryHistoryEntry,
} from "../../../services/modules/payrollServices/salaryRevision";
import { useUI } from "../../../context/Snackbar";
import { formatCurrency } from "../const";
import { getRowColor } from "../../const";
import { apiService } from "../../../services";

interface SalaryHistoryProps {
  selectedEmployee?: string;
  employeeId?: string;
}

// ---- component ----
export default function SalaryHistory({
  selectedEmployee,
  employeeId,
}: SalaryHistoryProps) {
  const [history, setHistory] = useState<SalaryHistoryEntry[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { showSpinner, hideSpinner, showSnackbar } = useUI();

  const empId = employeeId || selectedEmployee;

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ---- download handler ----
  const handleDownload = async (
    id: string,
    letterUrl: string | undefined,
    employeeName?: string
  ) => {
    if (!id || !letterUrl) return;

    setDownloadingId(id);
    showSpinner();
    try {
      const fileName = `Increment_Letter_${employeeName || empId || id}.pdf`;
      await apiService.downloadFromPath(letterUrl, fileName);
      showSnackbar("Letter downloaded successfully", "success");
    } catch {
      showSnackbar("Failed to download letter", "error");
    } finally {
      hideSpinner();
      setDownloadingId(null);
    }
  };

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
        if (rows.length > 0) {
          setExpandedRows({ [rows[0].id]: true });
        }
      })
      .catch((_err: any) => {
        if (cancelled) return;
        showSnackbar("Failed to load salary history", "error");
      })
      .finally(() => {
        if (!cancelled) hideSpinner();
      });

    return () => {
      cancelled = true;
    };
  }, [empId]);

  // ----- empty state -----
  if (!history.length) {
    return (
      <Box className="flex flex-col items-center justify-center py-10">
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
          <TrendingUpIcon className="text-indigo-400" fontSize="small" />
        </div>
        <Typography className="!text-xs !text-gray-500 !font-medium">
          No revision history yet
        </Typography>
        <Typography className="!text-[12px] !text-gray-500 mt-1">
          Salary revisions will appear here once processed
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="w-full">
      {/* header */}
      <div className="flex items-center gap-2 mb-5">
        <Typography className="!text-[12px] !font-bold !text-gray-800 !tracking-tight">
          Salary History
        </Typography>
        <Chip
          label={`${history.length} revision${history.length > 1 ? "s" : ""}`}
          size="small"
          className="!text-[10px] !h-5 !bg-gray-100 !text-gray-600 !font-medium"
        />
      </div>

      <Box className="flex flex-col gap-4">
        {history.map((h, i) => {
          const delta = h.newCtc - h.oldCtc;
          const isExpanded = !!expandedRows[h.id];
          const isLatest = i === 0;
          const isDownloading = downloadingId === h.id;
          const hasLetter = !!h.letterUrl;

          return (
            <Paper
              key={h.id}
              elevation={0}
              className="!rounded-2xl !border !border-gray-200 !bg-white-50 hover:!shadow-md !transition-shadow !duration-200 !overflow-hidden"
            >
              <Box className="p-4 sm:p-5">
                {/* ---- top row: date + reason + increment chip ---- */}
                <Box className="flex justify-between items-start gap-3 mb-4">
                  <Box className="flex flex-col gap-1.5">
                    <Box className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-gray-800">
                        <EventIcon sx={{ fontSize: 14 }} className="text-gray-400" />
                        Effective {formatDate(h.effectiveFrom)}
                      </span>
                      <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        {h.reason.replace(/_/g, " ")}
                      </span>
                      {isLatest && (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wide">
                          Latest
                        </span>
                      )}
                    </Box>
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Person2Outlined sx={{ fontSize: 13 }} className="text-gray-400" />
                      Approved by {h.approvedBy}
                    </span>
                  </Box>

                  <Box className="flex items-center gap-2">
                    {/* ---- Download letter button ---- */}
                    {hasLetter && (
                      <Tooltip title="Download increment letter" arrow>
                        <span>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={isDownloading}
                            onClick={() =>
                              handleDownload(h.id, h.letterUrl, h.employeeName)
                            }
                            startIcon={
                              isDownloading ? (
                                <DownloadIcon
                                  fontSize="small"
                                  className="animate-pulse"
                                />
                              ) : (
                                <DescriptionOutlinedIcon fontSize="small" />
                              )
                            }
                            className="!text-[10px] !font-semibold !normal-case !rounded-lg !px-2 !py-0.5 !min-w-0 !border-indigo-200 !text-indigo-700 hover:!bg-indigo-50"
                          >
                            {isDownloading ? "Downloading…" : "Letter"}
                          </Button>
                        </span>
                      </Tooltip>
                    )}

                    <Chip
                      icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                      label={`+${h.incrementPercent.toFixed(2)}%`}
                      size="small"
                      className={`!text-[12px] !font-semibold !h-6 ${isLatest
                          ? "!bg-indigo-50 !text-indigo-700"
                          : "!bg-emerald-50 !text-emerald-700"
                        }`}
                    />
                  </Box>
                </Box>

                {/* ---- CTC summary strip ---- */}
                <Box className="grid grid-cols-3 gap-3 mb-4 rounded-xl border border-gray-200 p-3">
                  <Box>
                    <Typography className="!text-[10px] !uppercase !tracking-wider !text-gray-500 !font-medium">
                      Old CTC
                    </Typography>
                    <Typography className="!text-[12px] !font-bold !text-red-600">
                      {formatCurrency(h.oldCtc)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography className="!text-[10px] !uppercase !tracking-wider !text-gray-500 !font-medium">
                      New CTC
                    </Typography>
                    <Typography className="!text-[12px] !font-bold !text-emerald-600">
                      {formatCurrency(h.newCtc)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography className="!text-[10px] !uppercase !tracking-wider !text-gray-500 !font-medium">
                      Increase
                    </Typography>
                    <Typography className="!text-[12px] !font-bold !text-blue-600">
                      +{formatCurrency(delta)}
                    </Typography>
                  </Box>
                </Box>

                {/* ---- expander trigger ---- */}
                <Box
                  onClick={() => toggleRow(h.id)}
                  className="flex items-center justify-between cursor-pointer select-none group"
                >
                  <Typography className="!text-[12px] !font-semibold !text-primary group-hover:!text-blue-500 !transition-colors">
                    {isExpanded ? "Hide" : "View"} component breakdown
                  </Typography>
                  <IconButton size="small" className="!p-0.5">
                    {isExpanded ? (
                      <ExpandLessIcon fontSize="small" className="text-primary" />
                    ) : (
                      <ExpandMoreIcon fontSize="small" className="text-primary" />
                    )}
                  </IconButton>
                </Box>
              </Box>

              {/* ---- collapsible component table ---- */}
              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <Divider className="!border-gray-100" />
                <Box className="overflow-x-auto p-3">
                  <Table size="small" className="!w-full border border-gray-200 !rounded-lg">
                    <TableHead>
                      <TableRow className="!bg-gray-50/60">
                        <TableCell className="!font-bold !text-[12px] !whitespace-nowrap">
                          Component
                        </TableCell>
                        <TableCell className="!font-bold !text-[12px] !whitespace-nowrap">
                          Type
                        </TableCell>
                        <TableCell align="right" className="!font-bold !text-[12px] !whitespace-nowrap">
                          Old Value
                        </TableCell>
                        <TableCell align="right" className="!font-bold !text-[12px] !whitespace-nowrap">
                          New Value
                        </TableCell>
                        <TableCell align="right" className="!font-bold !text-[12px] !whitespace-nowrap">
                          Amount
                        </TableCell>
                        <TableCell align="right" className="!font-bold !text-[12px] !whitespace-nowrap">
                          Amount %
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {h.components.map((c, i) => (
                        <TableRow key={c.componentId || i} sx={getRowColor(i)}>
                          <TableCell className="!text-[12px]">
                            <div className="py-1 font-medium">{c.componentName}</div>
                          </TableCell>
                          <TableCell className="!text-[12px]">
                            <Chip
                              label={c.componentType}
                              size="small"
                              className={`!text-[9px] !h-4 !font-medium ${c.componentType === "EARNING"
                                  ? "!bg-emerald-50 !text-emerald-700"
                                  : "!bg-red-50 !text-red-700"
                                }`}
                            />
                          </TableCell>
                          <TableCell align="right" className="!text-[12px]">
                            ₹ {c.oldValue.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell align="right" className="!text-[12px]">
                            ₹ {c.newValue.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell align="right" className="!text-[12px]">
                            ₹ {c.delta.toLocaleString("en-IN")}
                          </TableCell>
                          <TableCell align="right" className="!text-[12px] !font-bold">
                            {c.deltaPercent}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Collapse>
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}