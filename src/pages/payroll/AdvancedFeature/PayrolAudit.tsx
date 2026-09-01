import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from "@mui/material";
import {
  Download as DownloadIcon,
} from "@mui/icons-material";
import { auditLogService } from "../../../services/modules/payrollServices/auditLogs";
import { useUI } from "../../../context/Snackbar";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { apiService } from "../../../services";
import { getRowColor } from "../../const";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { selectSx } from "../../../const";
import { formatDateTime } from "../../../utils/dateFormatter";

export default function PayrollAudit() {
  const { showSpinner, hideSpinner, showSnackbar } = useUI();
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState({
    totalEvents: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0
  });
  const [filters, setFilters] = useState({
    search: "",
    actionType: "",
    fromDate: "",
    toDate: "",
  });
  const [availableActions, setAvailableActions] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [page, limit, filters]);

  const loadData = async () => {
    showSpinner();
    try {
      const params: any = {
        page: page + 1,
        limit: limit,
        search: filters.search || undefined,
        action: filters.actionType || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      };

      const response: any = await auditLogService.getPayrollAuditLogs(params);
      let content: any[] = [];
      let totalElementsFromApi = 0;
      if (response?.data) {
        const responseData = response.data;
        const data = responseData.data || responseData;
        content = Array.isArray(data.content) ? data.content :
          Array.isArray(data.items) ? data.items :
            Array.isArray(data.records) ? data.records :
              Array.isArray(data) ? data : [];

        totalElementsFromApi = data.totalElements || data.total || data.totalCount || content.length || 0;
      }

      setAuditLogs(content);
      setTotal(totalElementsFromApi);
      const summaryRes: any = await auditLogService.getAuditLogSummary();
      let summaryData = {};
      if (summaryRes?.data) {
        summaryData = summaryRes.data.data || summaryRes.data;
      } else if (summaryRes) {
        summaryData = summaryRes;
      }
      setSummary({
        totalEvents: Number((summaryData as any)?.totalEvents) || 0,
        today: Number((summaryData as any)?.today) || 0,
        thisWeek: Number((summaryData as any)?.thisWeek) || 0,
        thisMonth: Number((summaryData as any)?.thisMonth) || 0
      });

    } catch (error) {
      showSnackbar("Failed to load audit logs", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleExport = async () => {
    showSpinner();
    try {
      const params: any = {
        format: "pdf",
        search: filters.search || undefined,
        action: filters.actionType || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      };

      const res: any = await auditLogService.exportPayrollAuditLogs(params);
      const fileUrl = res?.data?.data?.fileUrl || res?.data?.fileUrl || res?.fileUrl;
      if (fileUrl) {
        await apiService.downloadFromPath(fileUrl, 'audit_logs.pdf');
        showSnackbar("Export initiated successfully!", "success");
      } else {
        showSnackbar("Export failed - no file URL returned", "error");
      }
    } catch (error) {
      showSnackbar("Failed to export logs", "error");
    } finally {
      hideSpinner();
    }
  };

  // const handleReset = () => {
  //   setFilters({
  //     search: "",
  //     actionType: "",
  //     fromDate: "",
  //     toDate: "",
  //   });
  //   setPage(0);
  // };

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  useEffect(() => {
    const loadActions = async () => {
      try {
        const res: any = await auditLogService.getAuditActions();
        const actions = res?.data?.actions || res?.data || res || {};
        setAvailableActions(actions);
      } catch (error) {
        showSnackbar("Failed to load audit actions:", 'error');
      }
    };
    loadActions();
  }, []);

  return (
    <div className="bg-white-50">
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Payroll Audit Logs
          </Typography>
          <Typography className="text-gray-500 !mt-1">
            Track all payroll activities and changes
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon fontSize="small" />}
          onClick={handleExport}
          size="small"
          sx={{ textTransform: "none" }}
        >
          Export Logs
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {[
          { label: "Total Events", value: summary.totalEvents, color: "#3b82f6" },
          { label: "Today", value: summary.today, color: "#10b981" },
          { label: "This Week", value: summary.thisWeek, color: "#f59e0b" },
          { label: "This Month", value: summary.thisMonth, color: "#8b5cf6" },
        ].map((item) => (
          <Grid size={{ xs: 6, sm: 3 }} key={item.label}>
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="caption" className="text-gray-500">
                  {item.label}
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: item.color }}>
                  {item.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-3">
        <TextField
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          sx={{ minWidth: 200 }}
        />
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>Action Type</InputLabel>
          <Select
            value={filters.actionType}
            onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
            label="Action Type"
            sx={selectSx}
          >
            <MenuItem value="">All Actions</MenuItem>
            {
              availableActions.map((log) => (
                <MenuItem key={log.value} value={log.value}>{log.label}</MenuItem>
              ))
            }
          </Select>
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="From Date"
            value={filters.fromDate ? dayjs(filters.fromDate) : null}
            onChange={(newValue) => setFilters({ ...filters, fromDate: newValue ? dayjs(newValue).format("YYYY-MM-DD") : "" })}
          />
          <DatePicker
            label="To Date"
            value={filters.toDate ? dayjs(filters.toDate) : null}
            onChange={(newValue) => setFilters({ ...filters, toDate: newValue ? dayjs(newValue).format("YYYY-MM-DD") : "" })}
          />
        </LocalizationProvider>

        {/* <Button 
          variant="outlined" 
          startIcon={<RefreshIcon fontSize="small" />}
          onClick={handleReset}
        >
          Reset
        </Button> */}
      </div>

      {/* Audit Logs Table */}
      <TableContainer className="border border-gray-200 rounded-sm max-h-[calc(100vh-325px)] overflow-auto">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>S No</TableCell>
              <TableCell>Timestamp</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>Entity</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {auditLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" className="text-gray-800">
                  <div className="py-6">No audit logs found</div>
                </TableCell>
              </TableRow>
            ) : (
              auditLogs.map((log, i) => (
                <TableRow key={log.id || i} sx={getRowColor(i)}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>
                    <div className="text-[12px]">
                      {formatDateTime(log.timestamp)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Typography>
                      {log.userName || log.user || "Unknown"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={availableActions[log.action] || log.action || "Unknown"}
                      size="small"
                      className="!bg-gray-200 !text-gray-600 "
                    />
                  </TableCell>
                  <TableCell>
                    <div className="text-[10px] text-gray-800">
                      {log.entityType || "N/A"}

                    </div>
                  </TableCell>
                  <TableCell>
                    <Typography>
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : (log.details || "-")}
                    </Typography>
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
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
          pageSizeOptions={[10, 20, 30, 50, 100]}
          showTotal={true}
        />
      )}
    </div>
  );
}