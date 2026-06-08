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
  Dialog,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ActiveIcon,
  Pending as PendingIcon,
  Schedule as ScheduledIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import { PolicyWizard } from '../../components/PolicyManagement/policyWizard/policyWizard';
import { policyApi } from '../../services/modules/policy';
import { type PolicyDefinition, PolicyDomain, PolicyStatus } from '../../types/policy';
import { mockPolicies, statsCard } from './const';
import dayjs from 'dayjs';
import { useNavigate } from "react-router-dom";
import { companyService } from '../../services/modules/company';
import { useUI } from '../../context/Snackbar';
import { getRowColor, getStickyLeftSx, getStickyRightSx, stickyHeaderLeftSx, stickyHeaderRightSx } from '../const';
import { GlobalPagination } from '../../components/GlobalPagination';

export default function PolicyDashboard() {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | undefined>();
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
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const navigate = useNavigate();

  const fetchCompanyData = async () => {
    try {
      const companyData: any = await companyService.getCompany();
      setCompanyId(companyData.data.length ? companyData.data?.[0].id : '');
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  const loadPolicies = async () => {
    showSpinner();
    try {
      const response: any = await policyApi.getPolicies(companyId);
      const data = Array.isArray(response)
        ? response
        : response?.data?.content || response?.data || [];
      setPolicies(data.length > 0 ? data : mockPolicies);
      setTotal(data.totalElements || mockPolicies.length);
    } catch (error) {
      showSnackbar('Failed to load policies:', 'error');
      setPolicies(mockPolicies);
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

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
        icon: <ActiveIcon fontSize="small" />,
      },
      DRAFT: {
        color: 'info',
        icon: <PendingIcon fontSize="small" />,
      },
      PENDING_APPROVAL: {
        color: 'warning',
        icon: <PendingIcon fontSize="small" />,
      },
      SCHEDULED: {
        color: 'primary',
        icon: <ScheduledIcon fontSize="small" />,
      },
      EXPIRED: {
        color: 'error',
        icon: undefined,
      },
      ARCHIVED: {
        color: 'secondary',
        icon: <ArchiveIcon fontSize="small" />,
      },
    };

    const { color, icon } = config[status];

    return (
      <Chip
        size="small"
        label={status.replace(/_/g, ' ')}
        color={color}
        icon={icon}
      />
    );
  };

  const filteredPolicies = useMemo(() => {
    return policies.filter((policy) => {
      const matchesSearch =
        !searchTerm ||
        policy.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesDomain =
        !domainFilter ||
        policy.domain === domainFilter;

      const matchesStatus =
        !statusFilter ||
        policy.status === statusFilter;

      return (
        matchesSearch &&
        matchesDomain &&
        matchesStatus
      );
    });
  }, [
    policies,
    searchTerm,
    domainFilter,
    statusFilter,
  ]);

  const stats: any = useMemo(
    () => ({
      total: policies.length,
      active: policies.filter(
        p => p.status === PolicyStatus.ACTIVE
      ).length,
      pending: policies.filter(
        p => p.status === PolicyStatus.PENDING_APPROVAL
      ).length,
      draft: policies.filter(
        p => p.status === PolicyStatus.DRAFT
      ).length,
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
      setEditingPolicyId(selectedPolicy.id);
      // setWizardOpen(true);
      navigate(`/policies/${selectedPolicy.id}/edit`)
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedPolicy) return;
    showConfirmDialog({
      title: "Delete Policy",
      message: "Are you sure you want to delete this Policy?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          // await policyApi.deletePolicy(selectedPolicy.id);
          setPolicies((prev) =>
            prev.filter((p) => p.id !== selectedPolicy.id)
          );
          showSnackbar("Policy Deleted Successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
          handleMenuClose();
        }
      },
    });
  };

  return (
    <div>
      <div className="mb-4">
        <div className='font-semibold text-gray-800'>Policy Management</div>
        <div className="text-gray-500 text-[12px]">Configure and manage all company management policies</div>
      </div>

      <Grid container spacing={3}>
        {
          statsCard.map((stat, i) => (
            <Grid key={i} size={{ xs: 12, md: 3 }}>
              <Card className='!bg-white'>
                <CardContent sx={{ borderLeft: `4px solid ${stat.color}`, padding: 2, borderRadius: 2 }}>
                  <div className='flex items-center justify-between'>
                    <div className='text-[12px] text-gray-800'>
                      <div className='font-bold'>{stat.label}</div>
                      <div className='mt-1'>{stats[stat.total]}</div>
                    </div>
                    <CircularProgress
                      enableTrackSlot
                      variant="determinate"
                      value={(stats[stat.value] / stats.total) * 100}
                      size={50}
                      thickness={4}
                      sx={{ color: stat.color }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Grid>
          ))
        }
        {/* Policy List */}
        <Grid size={{ xs: 12 }}>
          <div>
            <Box className="flex items-center justify-center gap-3 mb-3">
              <TextField
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <FormControl>
                <InputLabel>Domain</InputLabel>
                <Select
                  value={domainFilter}
                  label="Domain"
                  className='dark:bg-white-50 bg-white'
                  onChange={(e) => setDomainFilter(e.target.value as PolicyDomain)}
                >
                  <MenuItem value="">All</MenuItem>
                  {Object.values(PolicyDomain).map((domain) => (
                    <MenuItem key={domain} value={domain}>
                      {domain.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  className='dark:bg-white-50 bg-white'
                  onChange={(e) =>
                    setStatusFilter(e.target.value as PolicyStatus | '')
                  }
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
                <Button variant="contained" className='!bg-primary whitespace-nowrap' startIcon={<AddIcon />}
                  onClick={() => {
                    navigate('/policies/create', {
                      state: companyId
                    })
                  }}>
                  Create Policy
                </Button>
              </div>
            </Box>

            <TableContainer className='!h-[calc(100vh-355px)]'>
              <Table stickyHeader className="border border-gray-200" >
                <TableHead>
                  <TableRow>
                    <TableCell className='!font-semibold' sx={{
                      ...stickyHeaderLeftSx,
                      minWidth: "70px",
                    }}>S No</TableCell>
                    <TableCell className='!font-semibold nth-c' >Domain</TableCell>
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
                  {filteredPolicies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" >
                        <div className='!p-4'> No policies found</div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPolicies.map((policy, index) => (
                      <TableRow key={policy.id} hover sx={getRowColor(index)}>
                        <TableCell sx={{
                          ...getStickyLeftSx(index),
                          minWidth: "70px",
                        }}>{page * limit + index + 1}</TableCell>
                        <TableCell sx={{
                          ...getStickyLeftSx(index),
                          left: "70px",
                          minWidth: "100px",
                        }}>
                          <Chip
                            size="small"
                            variant="outlined"
                            className='!text-gray-800 !font-mono'
                            label={policy.domain.replace(/_/g, ' ')}
                          />
                        </TableCell>
                        <TableCell>
                          <div className='text-gray-900'>{policy.name}</div>
                          {policy.description && (
                            <div className='text-gray-500 text-[12px]'>{policy.description}</div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusChip(policy.status)}</TableCell>
                        <TableCell>{policy.createdBy}</TableCell>
                        <TableCell>
                          {dayjs(policy.effectiveFrom).format("DD MMM YYYY")}
                        </TableCell>
                        <TableCell>{dayjs(policy.updatedAt).format("DD MMM YYYY")}</TableCell>
                        <TableCell sx={{
                          ...getStickyRightSx(index),
                          minWidth: "50px",
                        }}>
                          <IconButton size="small" className='!text-primary'
                            onClick={() => navigate(`/policies/${policy.id}`)}
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            size="small" className='!text-blue-500'
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

      {/* Policy Wizard Dialog */}
      <Dialog open={wizardOpen} onClose={() => setWizardOpen(false)} maxWidth="lg" fullWidth>
        <PolicyWizard
          companyId={companyId}
          existingPolicyId={editingPolicyId}
          onComplete={(_policyId) => {
            setWizardOpen(false);
            loadPolicies();
          }}
          onCancel={() => setWizardOpen(false)}
        />
      </Dialog>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} className='text-blue-500' /> Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} className='text-red-500' /> Delete
        </MenuItem>
      </Menu>
    </div>
  );
};