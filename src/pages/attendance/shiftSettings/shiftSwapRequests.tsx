import { useState, useEffect, useCallback } from 'react';
import {
  Typography,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Tooltip,
  Avatar,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  CloseOutlined,
  CheckCircleOutlined,
  CancelOutlined,
  InfoOutlined,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useUI } from '../../../context/Snackbar';
import {
  shiftService,
  type SwapRequest,
  type SwapRequestStatus,
  type CreateSwapRequestDto,
} from '../../../services/modules/shifts';
import {
  type EmployeeSummaryResponse,
} from '../../../services/modules/employees';
import { getRowColor, getStickyLeftSx, getStickyRightSx, stickyHeaderLeftSx, stickyHeaderRightSx } from '../../const';
import { EmployeeSelector } from '../../../components/PolicyManagement/Common/EmployeeSelector';
import { GlobalPagination } from '../../../components/GlobalPagination';

const STATUS_COLORS: Record<SwapRequestStatus, { bg: string; text: string; chip: 'default' | 'warning' | 'success' | 'error' }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E', chip: 'warning' },
  APPROVED: { bg: '#D1FAE5', text: '#065F46', chip: 'success' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', chip: 'error' },
  CANCELLED: { bg: '#F3F4F6', text: '#6B7280', chip: 'default' },
};

const STATUS_TABS: Array<SwapRequestStatus | 'ALL'> = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

export const ShiftSwapRequests = () => {
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

  const [activeStatus, setActiveStatus] = useState<SwapRequestStatus | 'ALL'>('ALL');
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<{
    requesterEmployee: EmployeeSummaryResponse | null;
    requesterDate: dayjs.Dayjs | null;
    targetEmployee: EmployeeSummaryResponse | null;
    targetDate: dayjs.Dayjs | null;
    reason: string;
  }>({
    requesterEmployee: null,
    requesterDate: null,
    targetEmployee: null,
    targetDate: null,
    reason: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Detail dialog
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SwapRequest | null>(null);
  const [requesterEmployee, setRequesterEmployee] = useState<any>(null);
  const [targetEmployee, setTargetEmployee] = useState<any>(null);
  useEffect(() => {
    setCreateForm((prev) => ({
      ...prev,
      targetEmployee: targetEmployee,
    }));
    setCreateForm((prev) => ({
      ...prev,
      requesterEmployee: requesterEmployee,
    }));
  }, [targetEmployee, requesterEmployee]);

  // Action dialog (approve/reject/cancel)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: 'APPROVED' | 'REJECTED' | 'CANCELLED' | null;
    requestId: string;
    reason: string;
  }>({ open: false, type: null, requestId: '', reason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    showSpinner();
    try {
      const params: any = { page, size: rowsPerPage };
      if (activeStatus !== 'ALL') params.status = activeStatus;
      const res = await shiftService.getSwapRequests(params);
      setRequests(res.content || []);
      setTotalElements(res.totalElements || 0);
    } catch {
      showSnackbar('Failed to fetch swap requests', 'error');
    } finally {
      hideSpinner();
    }
  }, [activeStatus, page, rowsPerPage]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleStatusChange = (status: SwapRequestStatus | 'ALL') => {
    setActiveStatus(status);
    setPage(0);
  };

  const resetCreateForm = () =>
    setCreateForm({ requesterEmployee: null, requesterDate: null, targetEmployee: null, targetDate: null, reason: '' });

  const handleOpenCreate = () => {
    resetCreateForm();
    setCreateOpen(true);
    setRequesterEmployee(null);
    setTargetEmployee(null)
  };

  const handleCreate = async () => {
    const { requesterEmployee, requesterDate, targetEmployee, targetDate, reason } = createForm;
    if (!requesterEmployee || !requesterDate || !targetEmployee || !targetDate || !reason.trim()) {
      showSnackbar('All fields are required', 'warning');
      return;
    }
    const reqId = requesterEmployee.id || requesterEmployee.employeeId || '';
    const tgtId = targetEmployee.id || targetEmployee.employeeId || '';
    if (reqId === tgtId) {
      showSnackbar('Requester and target employee cannot be the same', 'warning');
      return;
    }
    setCreateLoading(true);
    try {
      const payload: CreateSwapRequestDto = {
        requesterEmployeeId: reqId,
        requesterDate: requesterDate.format('YYYY-MM-DD'),
        targetEmployeeId: tgtId,
        targetDate: targetDate.format('YYYY-MM-DD'),
        reason: reason.trim(),
      };
      await shiftService.createSwapRequest(payload);
      showSnackbar('Swap request created successfully', 'success');
      setCreateOpen(false);
      fetchRequests();
    } catch (err: any) {
      showSnackbar(err?.message || 'Failed to create swap request', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const openActionDialog = (type: 'APPROVED' | 'REJECTED' | 'CANCELLED', requestId: string) => {
    setActionDialog({ open: true, type, requestId, reason: '' });
  };

  const handleAction = async () => {
    if (!actionDialog.type) return;
    setActionLoading(true);
    try {
      await shiftService.updateSwapRequestStatus(actionDialog.requestId, {
        status: actionDialog.type,
        reason: actionDialog.reason.trim() || undefined,
      });
      showSnackbar(`Request ${actionDialog.type.toLowerCase()} successfully`, 'success');
      setActionDialog({ open: false, type: null, requestId: '', reason: '' });
      setDetailOpen(false);
      fetchRequests();
    } catch (err: any) {
      showSnackbar(err?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = async (id: any) => {
    try {
      const response: any = await shiftService.getSwapRequestById(id);
      setSelectedRequest(response);
      setDetailOpen(true);
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1);
  };

  const handleLimitChange = (newLimit: number) => {
    setRowsPerPage(newLimit);
    setPage(0);
  };


  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="p-4 pb-0 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-semibold text-gray-800">Shift Swap Requests</div>
          <div className="text-gray-500 text-[12px]">Manage employee shift swap requests</div>
        </div>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          className="!bg-primary !normal-case"
          size="small"
        >
          New Swap Request
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        {STATUS_TABS.map((s) => {
          const active = activeStatus === s;
          return (
            <Chip
              key={s}
              label={s === 'ALL' ? `All${totalElements > 0 && activeStatus === 'ALL' ? ` (${totalElements})` : ''}` : s}
              clickable
              onClick={() => handleStatusChange(s)}
              className={`!rounded-xl !font-medium !h-[26px] ${active ? '!bg-primary !text-white !shadow-sm' : 'bg-gray-100 text-gray-700'}`}
              color={active ? 'primary' : 'default'}
            />
          );
        })}
        {pendingCount > 0 && activeStatus !== 'PENDING' && (
          <Chip
            size="small"
            label={`${pendingCount} pending action`}
            color="warning"
            className="!h-[26px] !text-[12px]"
          />
        )}
      </div>

      {/* Table */}
      <div className="bg-white-50 ">
        <TableContainer className="!h-[calc(100vh-355px)] overflow-auto">
          <Table stickyHeader size="small" className='border border-gray-200'>
            <TableHead>
              <TableRow>
                <TableCell className='!font-semibold' sx={{
                  ...stickyHeaderLeftSx,
                  minWidth: "70px",
                }}>S No</TableCell>
                <TableCell className="!font-semibold nth-c">Requester</TableCell>
                <TableCell className="!font-semibold">Requester Date</TableCell>
                <TableCell className="!font-semibold">Requester Shift</TableCell>
                <TableCell className="!font-semibold">Target Employee</TableCell>
                <TableCell className="!font-semibold">Target Date</TableCell>
                <TableCell className="!font-semibold">Target Shift</TableCell>
                <TableCell className="!font-semibold">Status</TableCell>
                <TableCell className="!font-semibold">Created</TableCell>
                <TableCell className="!font-semibold" sx={{
                  ...stickyHeaderRightSx,
                  minWidth: "100px",
                }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <div className="text-gray-400 text-center py-10">No swap requests found</div>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((req, index) => {
                  const colors = STATUS_COLORS[req.status] || STATUS_COLORS.PENDING;
                  return (
                    <TableRow key={req.id} sx={getRowColor(index)} className="hover:bg-gray-50">
                      <TableCell sx={{
                        ...getStickyLeftSx(index),
                        minWidth: "70px",
                      }}>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell sx={{
                        ...getStickyLeftSx(index),
                        left: "70px",
                        minWidth: "100px",
                      }}>
                        <div className="flex items-center gap-2">
                          <Avatar className="!w-7 !h-7 !text-[12px] !bg-primary">
                            {req.requesterEmployeeName?.charAt(0) || '?'}
                          </Avatar>
                          <span className="text-[12px]">{req.requesterEmployeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px]">
                        {req.requesterDate ? dayjs(req.requesterDate).format('DD MMM YYYY') : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip label={req.requesterShiftCode || '-'} size="small" className="!font-mono !text-[12px] !text-gray-800 !bg-gray-100" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="!w-7 !h-7 !text-[12px] !bg-secondary">
                            {req.targetEmployeeName?.charAt(0) || '?'}
                          </Avatar>
                          <span className="text-[12px]">{req.targetEmployeeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px]">
                        {req.targetDate ? dayjs(req.targetDate).format('DD MMM YYYY') : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip label={req.targetShiftCode || '-'} size="small" className="!font-mono !text-[12px] !text-gray-800 !bg-gray-100" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={req.status}
                          size="small"
                          sx={{ backgroundColor: colors.bg, color: colors.text, fontWeight: 600, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell className="text-[12px] text-gray-500">
                        {req.createdAt ? dayjs(req.createdAt).format('DD MMM YYYY') : '-'}
                      </TableCell>
                      <TableCell align="center" sx={{
                        ...getStickyRightSx(index),
                        minWidth: "50px",
                      }}>
                        <div className="flex items-center justify-center gap-1">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleViewDetail(req.id)}>
                              <InfoOutlined className="!w-4 !h-4 text-gray-500" />
                            </IconButton>
                          </Tooltip>
                          {req.status === 'PENDING' && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton size="small" onClick={() => openActionDialog('APPROVED', req.id)}>
                                  <CheckCircleOutlined className="!w-4 !h-4 !text-green-600" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton size="small" onClick={() => openActionDialog('REJECTED', req.id)}>
                                  <CancelOutlined className="!w-4 !h-4 !text-red-500" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {/* <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[2, 4, 5]}
        /> */}
        {/* Global Pagination */}
        {totalElements > 0 && (
          <GlobalPagination
            total={totalElements}
            page={page + 1}
            limit={rowsPerPage}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            pageSizeOptions={[10, 20, 50, 100]}
            showTotal={true}
          />
        )}
      </div>

      {/* Create Swap Request Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <div className="flex items-center p-3 justify-between border-b border-gray-200">
          <div className="text-gray-800 font-medium">New Swap Request</div>
          <IconButton size="small" onClick={() => setCreateOpen(false)}>
            <CloseOutlined className="!text-gray-600" />
          </IconButton>
        </div>
        <DialogContent className="!pt-4">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* <Autocomplete
                  options={employees}
                  loading={empLoading}
                  getOptionLabel={(o) => getEmployeeName(o)}
                  value={createForm.requesterEmployee}
                  onChange={(_, v) => setCreateForm(f => ({ ...f, requesterEmployee: v }))}
                  renderInput={(params) => (
                    <TextField {...params} label="Requester Employee" size="small" required />
                  )}
                  isOptionEqualToValue={(o, v) => (o.id || o.employeeId) === (v.id || v.employeeId)}
                /> */}
                <Box>
                  <EmployeeSelector
                    value={requesterEmployee}
                    onChange={setRequesterEmployee}
                    label="Requester Employee"
                  />
                </Box>
                <DatePicker
                  label="Requester Date"
                  value={createForm.requesterDate}
                  onChange={(v) => setCreateForm(f => ({ ...f, requesterDate: dayjs(v) }))}
                  slotProps={{ textField: { required: true } }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* <FormControl size="small" >
                  <Autocomplete
                    options={employees}
                    loading={empLoading}
                    getOptionLabel={(o) => getEmployeeName(o)}
                    value={createForm.targetEmployee}
                    onChange={(_, v) => setCreateForm(f => ({ ...f, targetEmployee: v }))}
                    renderInput={(params) => (
                      <TextField {...params} label="Target Employee" size="small" required />
                    )}
                    isOptionEqualToValue={(o, v) => (o.id || o.employeeId) === (v.id || v.employeeId)}
                  />
                </FormControl> */}
                <Box>
                  <EmployeeSelector
                    value={targetEmployee}
                    onChange={setTargetEmployee}
                    label="Select Employee"
                  />
                </Box>
                <DatePicker
                  label="Target Date"
                  value={createForm.targetDate}
                  onChange={(v) => setCreateForm(f => ({ ...f, targetDate: dayjs(v) }))}
                  slotProps={{ textField: { required: true } }}
                />
              </div>
              <TextField
                label="Reason"
                multiline
                rows={3}
                fullWidth
                required
                value={createForm.reason}
                onChange={(e) => setCreateForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Describe the reason for the swap request..."
              />
            </div>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions className="!p-3 border-t border-gray-200 gap-2">
          <Button variant="outlined" onClick={() => setCreateOpen(false)} className="!border-gray-300 !text-gray-700 !normal-case">
            Cancel
          </Button>
          <Button
            variant="contained"
            className="!bg-primary !normal-case"
            onClick={handleCreate}
            disabled={createLoading}
          >
            {createLoading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <div className="flex items-center p-3 justify-between border-b border-gray-200">
          <div className="text-gray-800 font-medium">Swap Request Details</div>
          <IconButton size="small" onClick={() => setDetailOpen(false)}>
            <CloseOutlined className="!text-gray-600" />
          </IconButton>
        </div>
        {selectedRequest && (
          <DialogContent className="!pt-4">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:border dark:border-blue-500 dark:bg-white-50 rounded p-3">
                  <div className="text-[12px] font-semibold text-blue-500 mb-2 uppercase tracking-wide">Requester</div>
                  <div className="font-medium text-gray-600">{selectedRequest.requesterEmployeeName}</div>
                  <div className="text-[12px] text-gray-600 mt-1">
                    Date: {selectedRequest.requesterDate ? dayjs(selectedRequest.requesterDate).format('DD MMM YYYY') : '-'}
                  </div>
                  <div className="text-[12px] text-gray-600">
                    Shift: <span className="font-mono font-medium">{selectedRequest.requesterShiftCode || '-'}</span>
                  </div>
                </div>
                <div className="bg-primary-50 dark:border dark:border-primary dark:bg-white-50 rounded p-3">
                  <div className="text-[12px] font-semibold text-primary mb-2 uppercase tracking-wide">Target</div>
                  <div className="font-medium text-gray-800">{selectedRequest.targetEmployeeName}</div>
                  <div className="text-[12px] text-gray-500 mt-1">
                    Date: {selectedRequest.targetDate ? dayjs(selectedRequest.targetDate).format('DD MMM YYYY') : '-'}
                  </div>
                  <div className="text-[12px] text-gray-500">
                    Shift: <span className="font-mono font-medium">{selectedRequest.targetShiftCode || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-head rounded p-3">
                <div className="text-[12px] font-semibold text-gray-600 mb-1">Reason</div>
                <div className="text-[12px] text-gray-700">{selectedRequest.reason || '-'}</div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[12px] text-gray-500">Status: </span>
                  <Chip
                    label={selectedRequest.status}
                    size="small"
                    sx={{
                      backgroundColor: STATUS_COLORS[selectedRequest.status]?.bg,
                      color: STATUS_COLORS[selectedRequest.status]?.text,
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  />
                </div>
                <Typography variant="caption" className="text-gray-400">
                  Created: {selectedRequest.createdAt ? dayjs(selectedRequest.createdAt).format('DD MMM YYYY, HH:mm') : '-'}
                </Typography>
              </div>

              {selectedRequest.decidedAt && (
                <div className="bg-head rounded p-3 text-[12px] space-y-1">
                  <div className="text-[12px] font-semibold text-gray-600">Decision</div>
                  {selectedRequest.decidedBy && <div className="text-gray-600">By: {selectedRequest.decidedByName}</div>}
                  <div className="text-gray-500 text-[12px]">{dayjs(selectedRequest.decidedAt).format('DD MMM YYYY, HH:mm')}</div>
                  {selectedRequest.decisionReason && (
                    <div className="text-gray-600">Reason: {selectedRequest.decisionReason}</div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        )}
        <DialogActions className="!p-3 border-t border-gray-200 gap-2">
          {selectedRequest?.status === 'PENDING' && (
            <>
              <Button
                variant="contained"
                color="success"
                size="small"
                className="!normal-case"
                onClick={() => openActionDialog('APPROVED', selectedRequest.id)}
              >
                Approve
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                className="!normal-case"
                onClick={() => openActionDialog('REJECTED', selectedRequest.id)}
              >
                Reject
              </Button>
              <Button
                variant="outlined"
                size="small"
                className="!border-gray-300 !text-gray-600 !normal-case"
                onClick={() => openActionDialog('CANCELLED', selectedRequest.id)}
              >
                Cancel Request
              </Button>
            </>
          )}
          <Button variant="outlined" onClick={() => setDetailOpen(false)} className="!border-gray-300 !text-gray-700 !normal-case" size="small">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={actionDialog.open} onClose={() => setActionDialog(d => ({ ...d, open: false }))} maxWidth="xs" fullWidth>
        <div className="flex items-center p-3 justify-between border-b border-gray-200">
          <div className="text-gray-800 font-medium">
            {actionDialog.type === 'APPROVED' ? 'Approve Request' : actionDialog.type === 'REJECTED' ? 'Reject Request' : 'Cancel Request'}
          </div>
          <IconButton size="small" onClick={() => setActionDialog(d => ({ ...d, open: false }))}>
            <CloseOutlined className="!text-gray-600" />
          </IconButton>
        </div>
        <DialogContent className="!pt-4">
          <Typography variant="body2" className="text-gray-600 !mb-5">
            {actionDialog.type === 'APPROVED'
              ? 'Are you sure you want to approve this swap request?'
              : actionDialog.type === 'REJECTED'
                ? 'Are you sure you want to reject this swap request?'
                : 'Are you sure you want to cancel this swap request?'}
          </Typography>
          <TextField
            label="Reason (optional)"
            fullWidth
            multiline
            rows={2}
            value={actionDialog.reason}
            onChange={(e) => setActionDialog(d => ({ ...d, reason: e.target.value }))}
            placeholder="Add a reason..."
          />
        </DialogContent>
        <DialogActions className="!p-3 border-t border-gray-200 gap-2">
          <Button variant="outlined" size="small" onClick={() => setActionDialog(d => ({ ...d, open: false }))} className="!border-gray-300 !text-gray-700 !normal-case">
            No
          </Button>
          <Button
            variant="contained"
            size="small"
            color={actionDialog.type === 'APPROVED' ? 'success' : 'error'}
            className="!normal-case"
            onClick={handleAction}
            disabled={actionLoading}
          >
            {actionLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
