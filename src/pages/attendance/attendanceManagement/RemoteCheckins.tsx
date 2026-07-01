import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from "@mui/material";
import {
  CheckCircleOutlined,
  CloseOutlined,
  LocationOnOutlined,
  FilterListOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import { useUI } from "../../../context/Snackbar";
import { attendanceService } from "../../../services/modules/attendance";
import { GlobalPagination } from "../../../components/GlobalPagination";
import dayjs from "dayjs";
import { getRowColor } from "../../const";

// Define the status type
type StatusType = "" | "pending" | "approved" | "rejected";

interface RemoteCheckin {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  checkInTime: string;
  location: string;
  latitude: number;
  longitude: number;
  status: "pending" | "approved" | "rejected";
  remarks?: string;
  createdAt: string;
}

export function RemoteCheckins() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const [checkins, setCheckins] = useState<RemoteCheckin[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedCheckin, setSelectedCheckin] = useState<RemoteCheckin | null>(
    null,
  );
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadCheckins = useCallback(async () => {
    setLoading(true);
    showSpinner();
    try {
      const res: any = await attendanceService.getRemoteCheckins({
        status: statusFilter || undefined,
      });
      const data = res?.data?.data ?? res?.data;
      setCheckins(Array.isArray(data) ? data : (data?.content ?? []));
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      showSnackbar("Failed to load remote check-ins", "error");
    } finally {
      setLoading(false);
      hideSpinner();
    }
  }, [statusFilter]);

  useEffect(() => {
    loadCheckins();
  }, [loadCheckins]);

  const handleApprove = async (id: string) => {
    if (!selectedCheckin) return;
    setSubmitting(true);
    try {
      await attendanceService.approveRemoteCheckin(id, {
        comments: remarks,
        // approvedBy: "current-user",
      });
      showSnackbar("Remote check-in approved", "success");
      setDetailOpen(false);
      loadCheckins();
    } catch {
      showSnackbar("Failed to approve", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!selectedCheckin) return;
    setSubmitting(true);
    try {
      await attendanceService.rejectRemoteCheckin(id, {
        comments: remarks,
        // rejectedBy: "current-user",
      });
      showSnackbar("Remote check-in rejected", "info");
      setDetailOpen(false);
      loadCheckins();
    } catch {
      showSnackbar("Failed to reject", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openDetail = (checkin: RemoteCheckin) => {
    setSelectedCheckin(checkin);
    setRemarks("");
    setDetailOpen(true);
  };

  return (
    <div className="p-4 space-y-3">
      {/* Filters */}

      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
        <FilterListOutlined className="text-gray-400" fontSize="small" />
        <div className="flex items-center gap-1.5 flex-1">
          {[
            {
              label: "All",
              value: "" as StatusType,
              color: "default" as const,
            },
            {
              label: "Pending",
              value: "pending" as StatusType,
              color: "warning" as const,
            },
            {
              label: "Approved",
              value: "approved" as StatusType,
              color: "success" as const,
            },
            {
              label: "Rejected",
              value: "rejected" as StatusType,
              color: "error" as const,
            },
          ].map((option) => {
            const isActive = statusFilter === option.value;
            return (
              <Chip
                key={option.label}
                label={option.label}
                size="small"
                onClick={() => setStatusFilter(option.value)}
                color={isActive ? option.color : "default"}
                variant={isActive ? "filled" : "outlined"}
                className={`cursor-pointer transition-all text-gray-800 ${option.label == "All" ? "bg-gray-200" : ""}`}
              />
            );
          })}
        </div>
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <Tooltip title="Refresh">
          <IconButton
            size="small"
            onClick={loadCheckins}
            className="!text-gray-400"
          >
            <RefreshOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <TableContainer className="max-h-[calc(100vh-350px)]">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  "S No",
                  "Employee",
                  "Code",
                  "Check-in Time",
                  "Location",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <TableCell key={h} className="!font-bold">
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <div className="py-6 text-gray-500">Loading...</div>
                  </TableCell>
                </TableRow>
              ) : checkins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <div className="py-6 text-gray-500">
                      No remote check-ins found
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                checkins.map((c, i) => (
                  <TableRow key={c.id} hover sx={getRowColor(i)}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {c.employeeName}
                    </TableCell>
                    <TableCell>{c.employeeCode}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {dayjs(c.checkInTime).format("DD MMM YYYY, h:mm A")}
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title={`Lat: ${c.latitude}, Lng: ${c.longitude}`}
                      >
                        <span className="flex items-center gap-1">
                          <LocationOnOutlined
                            fontSize="small"
                            className="text-gray-400"
                          />
                          <span className="text-xs truncate max-w-[150px]">
                            {c.location}
                          </span>
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.status}
                        size="small"
                        color={
                          c.status === "approved"
                            ? "success"
                            : c.status === "rejected"
                              ? "error"
                              : "warning"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => openDetail(c)}>
                          <CheckCircleOutlined
                            fontSize="small"
                            className="text-primary"
                          />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 0 && (
          <GlobalPagination
            total={total}
            page={page + 1}
            limit={limit}
            onPageChange={(p) => setPage(p - 1)}
            onLimitChange={(l) => {
              setLimit(l);
              setPage(0);
            }}
          />
        )}
      </div>

      {/* Detail/Action Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle className="flex items-center justify-between border-b border-gray-200 !p-2">
          <span className="!pl-4">Remote Check-in Details</span>
          <IconButton size="small" onClick={() => setDetailOpen(false)}>
            <CloseOutlined fontSize="small" className="text-gray-800" />
          </IconButton>
        </DialogTitle>
        <DialogContent className="!p-4">
          {selectedCheckin && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Employee", selectedCheckin.employeeName],
                  ["Code", selectedCheckin.employeeCode],
                  [
                    "Time",
                    dayjs(selectedCheckin.checkInTime).format(
                      "DD MMM YYYY, h:mm A",
                    ),
                  ],
                  ["Location", selectedCheckin.location],
                  ["Latitude", selectedCheckin.latitude],
                  ["Longitude", selectedCheckin.longitude],
                  ["Status", selectedCheckin.status],
                ].map(([label, value]) => (
                  <div key={label} className="bg-head rounded p-2">
                    <div className="text-gray-500 text-[12px]">{label}</div>
                    <div className="text-gray-800 text-[12px] font-medium">
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {selectedCheckin.status === "pending" && (
                <TextField
                  label="Remarks"
                  fullWidth
                  multiline
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Add remarks (optional)"
                />
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
            onClick={() => setDetailOpen(false)}
            disabled={submitting}
          >
            Close
          </Button>
          {selectedCheckin?.status === "pending" && (
            <>
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleReject(selectedCheckin.id)}
                disabled={submitting}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                className="!bg-green-600"
                onClick={() => handleApprove(selectedCheckin.id)}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Approve"}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
}
