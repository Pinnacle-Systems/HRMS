import React, { useState, useEffect, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Collapse, Box,
  Select, MenuItem, FormControl, Button,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import ComputerOutlinedIcon from "@mui/icons-material/ComputerOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import KeyboardDoubleArrowRightIcon from "@mui/icons-material/KeyboardDoubleArrowRight";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {
  auditLogService,
  type AuditLogRecord,
  type AuditLogQuery,
  type AuditActionType,
} from "../../../services/modules/auditLogs";
import { useUI } from "../../../context/Snackbar";
import { GlobalPagination } from "../../../components/GlobalPagination";
import { getCurrentRouteLabel } from "../const";
import { getRowColor, stickyHeaderLeftSx } from "../../const";

const ACTION_COLORS: Record<AuditActionType, { color: "success" | "primary" | "error" | "warning"; label: string }> = {
  CREATE: { color: "success", label: "Create" },
  UPDATE: { color: "primary", label: "Update" },
  DELETE: { color: "error", label: "Delete" },
  STATUS_CHANGE: { color: "warning", label: "Status Change" },
};

const ACTION_TYPES: AuditActionType[] = ["CREATE", "UPDATE", "DELETE", "STATUS_CHANGE"];

export default function AuditLogs() {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filters
  const [filterModule, setFilterModule] = useState("");
  const [filterScreen, setFilterScreen] = useState("");
  const [filterActionType, setFilterActionType] = useState<AuditActionType | "">("");
  const [filterChangedBy, setFilterChangedBy] = useState("");
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");

  // Filter dropdown options
  const [moduleOptions, setModuleOptions] = useState<string[]>([]);
  const [userOptions, setUserOptions] = useState<{ id: string; name: string }[]>([]);

  // Applied filters (trigger fetch on change)
  const [appliedFilters, setAppliedFilters] = useState<AuditLogQuery>({});

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const fetchLogs = useCallback(async () => {
    showSpinner();
    try {
      const params: AuditLogQuery = {
        page,
        size: limit,
        sort: "changedOn,DESC",
        ...appliedFilters,
      };
      const res: any = await auditLogService.getAuditLogs(params);
      setLogs(res.data?.content || res.data || []);
      setTotal(res.data?.totalElements || res.data?.total || 0);
    } catch (err: any) {
      showSnackbar(err.message || "Failed to load audit logs", "error");
    } finally {
      hideSpinner();
    }
  }, [page, limit, appliedFilters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const logsRes: any = await auditLogService.getAuditLogs({ size: 20, sort: "changedOn,DESC" });
        const allLogs: AuditLogRecord[] = logsRes.data?.content || logsRes.data || [];
        setModuleOptions([...new Set(allLogs.map((l) => l.module).filter(Boolean))].sort());
        const seenIds = new Set<string>();
        const users: { id: string; name: string }[] = [];
        for (const l of allLogs) {
          const { userId, userName } = l.changedBy ?? {};
          if (userId && !seenIds.has(userId)) {
            seenIds.add(userId);
            users.push({ id: userId, name: userName || userId });
          }
        }
        setUserOptions(users.sort((a, b) => a.name.localeCompare(b.name)));
      } catch {
        // options unavailable — filters still work
      }
    };
    loadFilterOptions();
  }, []);

  const applyFilters = () => {
    const f: AuditLogQuery = {};
    if (filterModule) f.module = filterModule;
    if (filterScreen) f.screen = filterScreen;
    if (filterActionType) f.actionType = filterActionType;
    if (filterChangedBy) f.changedBy = filterChangedBy;
    if (filterFromDate) f.fromDate = filterFromDate;
    if (filterToDate) f.toDate = filterToDate;
    setAppliedFilters(f);
    setPage(0);
  };

  const clearFilters = () => {
    setFilterModule("");
    setFilterScreen("");
    setFilterActionType("");
    setFilterChangedBy("");
    setFilterFromDate("");
    setFilterToDate("");
    setAppliedFilters({});
    setPage(0);
  };

  const formatDateTime = (iso: string) => {
    if (!iso) return "-";
    return dayjs(iso).format("DD MMM YYYY, hh:mm A");
  };

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const parseAndFormatValue = (value?: string) => {
    if (!value) return 'empty';
    try {

      let jsonStr = value
        .replace(/(\w+)=/g, '"$1":') // Convert fieldName= to "fieldName":
        .replace(/'/g, '"') // Replace single quotes with double quotes
        .replace(/(\w+)=/g, '"$1":'); // Handle nested fields

      const parsed = JSON.parse(jsonStr);
      return parsed;
    } catch (e) {
      try {
        const pairs = value.split(',').reduce((acc: any, pair) => {
          const [key, ...val] = pair.split('=');
          if (key && val.length) {
            acc[key.trim()] = val.join('=').trim();
          }
          return acc;
        }, {});
        return pairs;
      } catch (err) {
        return value;
      }
    }
  };

  // Helper to format nested objects as readable strings
  const formatValueDisplay = (value: any, indent = 0): string => {
    if (value === null || value === undefined) return 'empty';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
      return value.map(item => formatValueDisplay(item, indent + 2)).join(', ');
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value);
      return entries.map(([key, val]) =>
        `${' '.repeat(indent)}${key}: ${formatValueDisplay(val, indent + 2)}`
      ).join('\n');
    }
    return String(value);
  };

  // Function to compare two objects and show only changed fields
  const getChangedFields = (oldObj: any, newObj: any) => {
    const changes: { field: string; oldValue: any; newValue: any }[] = [];

    const compare = (oldVal: any, newVal: any, path: string) => {
      if (oldVal === newVal) return;

      if (typeof oldVal === 'object' && typeof newVal === 'object' && oldVal !== null && newVal !== null) {
        const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
        for (const key of allKeys) {
          compare(oldVal[key], newVal[key], path ? `${path}.${key}` : key);
        }
      } else {
        changes.push({
          field: path || 'root',
          oldValue: oldVal,
          newValue: newVal
        });
      }
    };

    compare(oldObj, newObj, '');
    return changes;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mt-3 mb-3">
        <div>
          <div className="text-gray-500 text-sm flex items-center gap-1">
            Settings <KeyboardDoubleArrowRightIcon className="!w-4 !h-4" />
            <span className="text-primary font-medium">{getCurrentRouteLabel()}</span>
          </div>
          <div className="text-gray-400 text-[12px] mt-0.5">
            Track all create, update, delete and status changes across modules
          </div>
        </div>
      </div>

      {/* Compact Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap bg-white border border-gray-200 rounded-lg px-3 py-2 pt-5 mb-3">
        <div className="flex items-center gap-1 text-gray-400 shrink-0">
          <FilterAltOutlinedIcon sx={{ fontSize: 15 }} />
          <span className="text-[11px] font-medium uppercase tracking-wide">Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 h-[16px] min-w-[16px] px-1 text-[10px] bg-blue-600 text-white font-bold rounded-full flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="w-px h-5 bg-gray-300 shrink-0" />
        <FormControl size="small" sx={{ width: 130 }}>
          <Select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            displayEmpty
            sx={{ fontSize: 12, borderRadius: "6px", "& .MuiSelect-select": { py: "5.5px" } }}
          >
            <MenuItem value=""><span className="text-gray-400 text-[12px]">Module</span></MenuItem>
            {moduleOptions.map((m) => (
              <MenuItem key={m} value={m} sx={{ fontSize: 12 }}>{m}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 130 }}>
          <Select
            value={filterActionType}
            onChange={(e) => setFilterActionType(e.target.value as AuditActionType | "")}
            displayEmpty
            sx={{ fontSize: 12, borderRadius: "6px", "& .MuiSelect-select": { py: "5.5px" } }}
          >
            <MenuItem value=""><span className="text-gray-400 text-[12px]">Action Type</span></MenuItem>
            {ACTION_TYPES.map((a) => (
              <MenuItem key={a} value={a} sx={{ fontSize: 12 }}>{ACTION_COLORS[a].label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ width: 150 }}>
          <Select
            value={filterChangedBy}
            onChange={(e) => setFilterChangedBy(e.target.value)}
            displayEmpty
            sx={{ fontSize: 12, borderRadius: "6px", "& .MuiSelect-select": { py: "5.5px" } }}
          >
            <MenuItem value=""><span className="text-gray-400 text-[12px]">Changed By</span></MenuItem>
            {userOptions.map((u) => (
              <MenuItem key={u.id} value={u.id} sx={{ fontSize: 12 }}>{u.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={filterFromDate ? dayjs(filterFromDate) : null}
            onChange={(d) => setFilterFromDate(d ? dayjs(d).format("YYYY-MM-DD") : "")}
            slotProps={{ textField: { label: "From", sx: { width: 135, "& .MuiPickersOutlinedInput-root": { borderRadius: "6px !important" } } } }}
          />
        </LocalizationProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={filterToDate ? dayjs(filterToDate) : null}
            onChange={(d) => setFilterToDate(d ? dayjs(d).format("YYYY-MM-DD") : "")}
            slotProps={{ textField: { label: "To", sx: { width: 135, "& .MuiOutlinedInput-root": { borderRadius: "6px !important" } } } }}
          />
        </LocalizationProvider>
        <Button
          variant="contained"
          size="small"
          onClick={applyFilters}
          className="!bg-primary"
          sx={{ fontSize: 12, px: 2, py: "5px", minWidth: "auto", borderRadius: "6px", textTransform: "none", boxShadow: "none" }}
        >
          Apply
        </Button>
        {activeFilterCount > 0 && (
          <Button
            size="small"
            onClick={clearFilters}
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
            startIcon={<ClearIcon sx={{ fontSize: "14px !important" }} />}
            sx={{ fontSize: 12, px: 1.5, py: "5px", minWidth: "auto", borderRadius: "6px", textTransform: "none" }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <TableContainer className="h-[calc(100vh-330px)] overflow-auto">
        <Table stickyHeader className="border border-gray-200">
          <TableHead sx={{ "& .MuiTableCell-root": { backgroundColor: "#f3f4f6" } }}>
            <TableRow>
              <TableCell sx={{ ...stickyHeaderLeftSx, minWidth: "40px", width: "40px" }} />
              <TableCell className="!font-semibold text-gray-800 !text-[12px]" sx={{ minWidth: "50px" }}>S No</TableCell>
              <TableCell className="!font-semibold text-gray-800 !text-[12px]">Module</TableCell>
              <TableCell className="!font-semibold text-gray-800 !text-[12px]">Screen</TableCell>
              <TableCell className="!font-semibold text-gray-800 !text-[12px]">Action</TableCell>
              <TableCell className="!font-semibold text-gray-800 !text-[12px]">Field Changed</TableCell>
              <TableCell className="!font-semibold text-gray-800 !text-[12px]">Changed By</TableCell>
              <TableCell className="!font-semibold text-gray-800 !text-[12px]">IP Address</TableCell>
              <TableCell className="!font-semibold text-gray-800 !text-[12px]" sx={{ minWidth: "160px" }}>Changed On</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-gray-400 py-10 !text-[12px]">
                  <HistoryOutlinedIcon className="!w-8 !h-8 text-gray-300 mb-1" />
                  <div>No audit logs found</div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log, index) => (
                <React.Fragment key={log.id}>
                  <TableRow hover sx={getRowColor(index)} className="cursor-pointer" onClick={() => toggleExpand(log.id)}>
                    <TableCell sx={{ padding: "4px", width: "40px" }}>
                      <IconButton size="small">
                        {expandedId === log.id
                          ? <ExpandLessIcon className="!w-4 text-gray-800" />
                          : <ExpandMoreIcon className="!w-4 text-gray-800" />}
                      </IconButton>
                    </TableCell>
                    <TableCell className="!text-[12px]">{page * limit + index + 1}</TableCell>
                    <TableCell className="!text-[12px] font-medium text-gray-800">{log.module}</TableCell>
                    <TableCell className="!text-[12px] text-gray-600">{log.screen}</TableCell>
                    <TableCell>
                      <Chip
                        label={ACTION_COLORS[log.actionType]?.label ?? log.actionType}
                        color={ACTION_COLORS[log.actionType]?.color ?? "default"}
                        size="small"
                        className="!text-[11px]"
                      />
                    </TableCell>
                    <TableCell className="!text-[12px]">
                      <span className="font-medium text-gray-700">{log.fieldName}</span>

                      {/* {log.fieldName ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="font-medium text-gray-700">{log.fieldName}</span>
                          {log.oldValue !== undefined && (
                            <>
                              <span className="text-gray-400">·</span>
                              <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[11px] font-mono line-through">{log.oldValue || "—"}</span>
                              <span className="text-gray-400">→</span>
                              <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[11px] font-mono">{log.newValue || "—"}</span>
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">—</span>
                      )} */}
                    </TableCell>
                    <TableCell className="!text-[12px]">
                      <div className="flex items-center gap-1">
                        <PersonOutlinedIcon className="!w-3.5 text-gray-400" />
                        <span>{log.changedBy?.userName ?? "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="!text-[12px] font-mono text-gray-600">{log.ipAddress ?? "—"}</TableCell>
                    <TableCell className="!text-[12px] text-gray-600">{formatDateTime(log.changedOn)}</TableCell>
                  </TableRow>

                  {/* Expand Detail Row */}
                  <TableRow>
                    <TableCell colSpan={9} sx={{ p: "0 !important", border: 0 }} className="!bg-blue-50/40">
                      <Collapse in={expandedId === log.id}>
                        <Box sx={{ px: 6, py: 3 }}>
                          <div className="flex flex-wrap gap-x-6 gap-y-4">
                            {/* Record ID */}
                            <div className="min-w-[150px]">
                              <div className="text-[10px] text-gray-400 uppercase mb-1">Record ID</div>
                              <div className="text-[12px] font-mono text-gray-700 break-all">{log.recordId}</div>
                            </div>

                            {/* Changed By */}
                            <div className="min-w-[150px]">
                              <div className="text-[10px] text-gray-400 uppercase mb-1">Changed By</div>
                              <div className="text-[12px] text-gray-700">{log.changedBy?.userName ?? "—"}</div>
                            </div>

                            {/* Timestamp */}
                            <div className="min-w-[150px]">
                              <div className="text-[10px] text-gray-400 uppercase mb-1">Timestamp</div>
                              <div className="text-[12px] text-gray-700">{formatDateTime(log.changedOn)}</div>
                            </div>

                            {/* Field Change Details */}
                            {log.fieldName  && (
                              <>
                                <div className="w-full border-t border-gray-200 my-2" />

                                {/* Try to parse and show structured changes */}
                                {(() => {
                                  const oldParsed = parseAndFormatValue(log.oldValue);
                                  const newParsed = parseAndFormatValue(log.newValue);

                                  // If both are objects, show field-by-field comparison
                                  if (typeof oldParsed === 'object' && typeof newParsed === 'object' &&
                                    oldParsed !== null && newParsed !== null) {
                                    const changes = getChangedFields(oldParsed, newParsed);

                                    return (
                                      <div className="w-full">
                                        <div className="text-[10px] text-gray-400 uppercase mb-2">Field Changes</div>
                                        <div className="space-y-3">
                                          {changes.map((change, idx) => (
                                            <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                              <div className="text-[13px] font-semibold text-gray-800 mb-2">
                                                {change.field}
                                              </div>
                                              <div className="flex items-start gap-4">
                                                <div className="flex-1">
                                                  <div className="text-[10px] text-gray-400 uppercase mb-1">Old Value</div>
                                                  <pre className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-[12px] font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-auto">
                                                    {formatValueDisplay(change.oldValue) || 'empty'}
                                                  </pre>
                                                </div>
                                                <div className="flex items-center pt-4">
                                                  <span className="text-gray-400 text-[20px]">→</span>
                                                </div>
                                                <div className="flex-1">
                                                  <div className="text-[10px] text-gray-400 uppercase mb-1">New Value</div>
                                                  <pre className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-[12px] font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-auto">
                                                    {formatValueDisplay(change.newValue) || 'empty'}
                                                  </pre>
                                                </div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }

                                  // Fallback: Show full values if parsing fails
                                  return (
                                    <div className="w-full">
                                      <div className="text-[10px] text-gray-400 uppercase mb-2">Field Changes</div>
                                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="text-[13px] font-semibold text-gray-800 mb-2">
                                          {log.fieldName}
                                        </div>
                                        <div className="flex items-start gap-4">
                                          <div className="flex-1">
                                            <div className="text-[10px] text-gray-400 uppercase mb-1">Old Value</div>
                                            <pre className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-[12px] font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-auto">
                                              {log.oldValue ? log.oldValue : 'empty'}
                                            </pre>
                                          </div>
                                          <div className="flex items-center pt-4">
                                            <span className="text-gray-400 text-[20px]">→</span>
                                          </div>
                                          <div className="flex-1">
                                            <div className="text-[10px] text-gray-400 uppercase mb-1">New Value</div>
                                            <pre className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-[12px] font-mono whitespace-pre-wrap break-all max-h-[200px] overflow-auto">
                                              {log.newValue ? log.newValue : 'empty'}
                                            </pre>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </>
                            )}

                            {/* User Agent */}
                            {log.userAgent && (
                              <>
                                <div className="w-full border-t border-gray-200 my-2" />
                                <div className="w-full">
                                  <div className="text-[10px] text-gray-400 uppercase mb-1 flex items-center gap-1">
                                    <ComputerOutlinedIcon className="!w-3" /> User Agent
                                  </div>
                                  <div
                                    className="text-[11px] text-gray-800 font-mono rounded truncate cursor-pointer"
                                    title={log.userAgent}
                                  >
                                    {log.userAgent}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
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
          onLimitChange={(l) => { setLimit(l); setPage(0); }}
          pageSizeOptions={[10, 20, 50, 100]}
          showTotal
        />
      )}
    </div>
  );
}
