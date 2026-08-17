import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as ActiveIcon,
  Pending as PendingIcon,
  Schedule as ScheduledIcon,
  Archive as ArchiveIcon,
  Policy as TotalIcon,
  Drafts as DraftIcon,
  ErrorOutlined as ExpiredIcon,
  VisibilityOutlined,
} from '@mui/icons-material';
import { policyService } from '../../services/modules/policy';
import { type PolicyDefinition, PolicyDomain, PolicyStatus } from '../../types/policy';
import { statsCard } from './const';
import dayjs from 'dayjs';
import { useNavigate } from "react-router-dom";
import { companyService } from '../../services/modules/company';
import { useUI } from '../../context/Snackbar';
import { getRowColor, getStickyLeftSx, getStickyRightSx, stickyHeaderLeftSx, stickyHeaderRightSx } from '../const';
import { GlobalPagination } from '../../components/GlobalPagination';
import { usePolicyDomains } from '../../hooks/usePolicyDomains';
import { selectSx } from '../../const';
import { formatDateTime } from '../../utils/dateFormatter';

export default function PolicyDashboard() {
  const [policies, setPolicies] = useState<PolicyDefinition[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [domainFilter, setDomainFilter] = useState<PolicyDomain | ''>('');
  const [statusFilter, setStatusFilter] = useState<PolicyStatus | ''>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDefinition | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [searchTerm, setSearchTerm] = useState("");
  const { domains } = usePolicyDomains();
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const navigate = useNavigate();

  const fetchCompanyData = async () => {
    try {
      const companyData: any = await companyService.getCompany();
      const companyId = companyData.data.length ? companyData.data?.[0].id : '';
      setCompanyId(companyId);
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  const loadPolicies = async () => {
    showSpinner();
    try {
      const response: any = await policyService.getPolicies({
        // companyId,
        page: page,
        size: limit,
        search: searchTerm || undefined,
        domainId: domainFilter || undefined,
        status: statusFilter || undefined,
        sort: [
          'updatedAt,desc',
          // 'createdAt,asc'
        ]
      });
      setPolicies(response.data.content || []);
      setTotal(response.data.totalElements);
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    if (companyId) {
      loadPolicies();
    }
  }, [companyId, page, limit, searchTerm, domainFilter, statusFilter]);

  useEffect(() => {
    fetchCompanyData();
  }, []);

  const getStatusChip = (status: PolicyStatus) => {
    const config: Record<
      PolicyStatus,
      {
        color:
        | "success"
        | "warning"
        | "info"
        | "primary"
        | "default"
        | "error"
        | "secondary";
        icon?: React.ReactElement;
      }
    > = {
      ACTIVE: {
        color: 'success',
        icon: <ActiveIcon className='!w-3' />,
      },
      DRAFT: {
        color: 'info',
        icon: <DraftIcon className='!w-3' />,
      },
      PENDING_APPROVAL: {
        color: 'warning',
        icon: <PendingIcon className='!w-3' />,
      },
      SCHEDULED: {
        color: 'primary',
        icon: <ScheduledIcon className='!w-3' />,
      },
      EXPIRED: {
        color: 'error',
        icon: <ExpiredIcon className='!w-3' />,
      },
      ARCHIVED: {
        color: 'secondary',
        icon: <ArchiveIcon className='!w-3' />,
      },
    };

    const { color, icon } = config[status] || { color: 'default', icon: undefined };

    return (
      <Chip
        size="small"
        label={status?.replace(/_/g, ' ') || 'UNKNOWN'}
        color={color}
        icon={icon}
        className='!text-[10px] !capitalize'
      />
    );
  };

  const stats: any = useMemo(
    () => ({
      total: policies.length,
      active: policies.filter(p => p.status === PolicyStatus.ACTIVE).length,
      pending: policies.filter(p => p.status === PolicyStatus.PENDING_APPROVAL).length,
      draft: policies.filter(p => p.status === PolicyStatus.DRAFT).length,
      expired: policies.filter(p => p.status === PolicyStatus.EXPIRED).length,
      archived: policies.filter(p => p.status === PolicyStatus.ARCHIVED).length,
    }),
    [policies]
  );

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, policy: PolicyDefinition) => {
    setAnchorEl(event.currentTarget);
    setSelectedPolicy(policy);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPolicy(null);
  };

  const handleEdit = () => {
    if (selectedPolicy) {
      navigate(`/policies/${selectedPolicy.id}/edit`);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedPolicy) return;

    if (selectedPolicy.status === PolicyStatus.ACTIVE) {
      showSnackbar(
        "Policy must be archived before it can be deleted. Go to the policy's Version History and archive the active version first.",
        "error"
      );
      handleMenuClose();
      return;
    }

    showConfirmDialog({
      title: "Delete Policy",
      message: "Are you sure you want to permanently delete this archived policy? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          await policyService.deletePolicy(selectedPolicy.id);
          showSnackbar("Policy Deleted Successfully!", "success");
          loadPolicies();
        } catch (error: any) {
          showSnackbar(error?.message || "Failed to delete policy", "error");
        } finally {
          hideSpinner();
          handleMenuClose();
        }
      },
    });
  };

  const handleView = (policy: PolicyDefinition) => {
    navigate(`/policies/${policy.id}`);
  };

  return (
    <div>
      <div className="mb-4">
        <div className='font-semibold text-gray-800'>Policy Management</div>
        <div className="text-gray-500 text-[12px]">Configure and manage all company management policies</div>
      </div>

      <Grid container spacing={2}>
        {statsCard.map((stat, i) => {
          const iconMap: Record<string, React.ReactElement> = {
            total: <TotalIcon className='!w-4' />,
            active: <ActiveIcon className='!w-4' />,
            pending: <PendingIcon className='!w-4' />,
            draft: <DraftIcon className='!w-4' />,
            archived: <ArchiveIcon className='!w-4' />,
            expired: <ExpiredIcon className='!w-4' />,
          };
          const count = stats[stat.value] ?? 0;
          const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          return (
            <Grid key={i} size={{ xs: 12, sm: 6, md: 2 }}>
              <Card className='!bg-white'
                sx={{
                  borderLeft: `4px solid ${stat.color}`,
                  // boxShadow: '0 4px 16px',
                  borderRadius: 2,
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: `0 4px 16px ${stat.color}15` },
                }}
              >
                <CardContent sx={{ p: '16px !important' }}>
                  <div className="flex items-center justify-between">
                    <div className="mb-1">
                      <div className="text-[11px] text-gray-500 mb-1 whitespace-nowrap">{stat.label}</div>
                      <div className="text-[12px] font-bold text-gray-800">
                        {count}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="relative flex items-center justify-center">
                        <CircularProgress
                          variant="determinate"
                          value={pct}
                          size={50}
                          thickness={2}
                          enableTrackSlot
                          sx={{
                            '& .MuiCircularProgress-circle': { stroke: stat.color },
                            '& .MuiCircularProgress-track': { stroke: `${stat.color}` },
                          }}
                        />
                        <span className="absolute" style={{ color: stat.color, display: 'flex' }}>
                          {iconMap[stat.icon]}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Grid>
          );
        })}

        {/* Policy List */}
        <Grid size={{ xs: 12 }}>
          <div>
            <Box className="flex items-center justify-center gap-3 mb-3">
              <TextField
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                size="small"
              />
              <FormControl>
                <InputLabel>Domain</InputLabel>
                <Select
                  value={domainFilter}
                  label="Domain"
                  sx={selectSx}
                  className='dark:bg-white-50 bg-white'
                  onChange={(e) => {
                    setDomainFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {domains.map((domain) => (
                    <MenuItem key={domain.id} value={domain.id}>
                      {domain.name} <span className='text-gray-500 font-bold text-[10px] ml-1'>({domain.code})</span>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  sx={selectSx}
                  className='dark:bg-white-50 bg-white'
                  onChange={(e) => {
                    setStatusFilter(e.target.value as PolicyStatus | '');
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {Object.values(PolicyStatus).map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <div>
                <Button
                  variant="contained"
                  className='!bg-primary whitespace-nowrap'
                  startIcon={<AddIcon />}
                  onClick={() => {
                    navigate('/policies/create', {
                      state: { companyId }
                    });
                  }}
                >
                  Create Policy
                </Button>
              </div>
            </Box>

            <TableContainer className='!h-[calc(100vh-340px)]'>
              <Table stickyHeader className="border border-gray-200">
                <TableHead>
                  <TableRow>
                    <TableCell className='!font-semibold' sx={{
                      ...stickyHeaderLeftSx,
                      minWidth: "70px",
                    }}>S No</TableCell>
                    <TableCell className='!font-semibold'>Domain</TableCell>
                    <TableCell className='!font-semibold'>Policy Name</TableCell>
                    <TableCell className='!font-semibold'>Status</TableCell>
                    <TableCell className='!font-semibold'>Created By</TableCell>
                    <TableCell className='!font-semibold'>Effective From</TableCell>
                    <TableCell className='!font-semibold'>Last Updated</TableCell>
                    <TableCell className='!font-semibold' sx={{
                      ...stickyHeaderRightSx,
                      minWidth: "100px",
                    }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {policies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <div className='!p-4'>No policies found</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    policies.map((policy, index) => (
                      <TableRow key={policy.id} hover sx={getRowColor(index)}>
                        <TableCell sx={{
                          ...getStickyLeftSx(index),
                          minWidth: "70px",
                        }}>{page * limit + index + 1}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            variant="outlined"
                            className='!text-gray-800 !font-mono'
                            label={policy.domainName || 'N/A'}
                          />
                        </TableCell>
                        <TableCell>
                          <div className='text-gray-900'>{policy.policyName}</div>
                          {policy.description && (
                            <div className='text-gray-500 text-[12px]'>{policy.description}</div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusChip(policy.status)}</TableCell>
                        <TableCell>{policy.createdByName || 'N/A'}</TableCell>
                        <TableCell>
                          {policy.effectiveFrom ? dayjs(policy.effectiveFrom).format("DD MMM YYYY") : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {policy.updatedAt ? formatDateTime(policy.updatedAt) : 'N/A'}
                        </TableCell>
                        <TableCell sx={{
                          ...getStickyRightSx(index),
                          minWidth: "50px",
                        }}>
                          <IconButton
                            size="small"
                            className='!text-primary'
                            onClick={() => handleView(policy)}
                          >
                            <VisibilityOutlined />
                          </IconButton>
                          <IconButton
                            size="small"
                            className='!text-blue-500'
                            onClick={(e) => handleMenuOpen(e, policy)}
                          >
                            <MoreIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            {total > 0 && (
              <GlobalPagination
                total={total}
                page={page + 1}
                limit={limit}
                onPageChange={(newPage) => setPage(newPage - 1)}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(0);
                }}
                pageSizeOptions={[10, 20, 50, 100]}
                showTotal={true}
              />
            )}
          </div>
        </Grid>
      </Grid>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} className='text-blue-500' /> Edit
        </MenuItem>
        <MenuItem
          onClick={handleDelete}
          // disabled={selectedPolicy?.status !== PolicyStatus.ARCHIVED}
          // title={selectedPolicy?.status !== PolicyStatus.ARCHIVED ? 'Archive the policy version first to enable deletion' : ''}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} className='text-red-500' /> Delete
        </MenuItem>
      </Menu>
    </div>
  );
}