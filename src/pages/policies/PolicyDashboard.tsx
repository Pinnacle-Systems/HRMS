import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
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
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Dialog,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as ActiveIcon,
  Pending as PendingIcon,
  Schedule as ScheduledIcon,
} from '@mui/icons-material';
import { PolicyWizard } from '../../components/PolicyManagement/policyWizard/policyWizard';
import { policyApi } from '../../services/modules/policy';
import { type PolicyDefinition, PolicyDomain, PolicyStatus } from '../../types/policy';
import { mockPolicies } from './const';
import dayjs from 'dayjs';
import { useNavigate } from "react-router-dom";

export default function PolicyDashboard() {
  // const [activeTab, setActiveTab] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | undefined>();
  const [policies, setPolicies] = useState<PolicyDefinition[]>([]);
  // const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [domainFilter, setDomainFilter] = useState<PolicyDomain | ''>('');
  const [statusFilter, setStatusFilter] = useState<PolicyStatus | ''>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDefinition | null>(null);
  const navigate = useNavigate();

  const companyId = 'company_123'; // Should come from auth context


  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    // setLoading(true);
    try {
      const response: any = await policyApi.getPolicies(companyId);
      const data = Array.isArray(response)
        ? response
        : response?.data?.content || response?.data || [];
      setPolicies(data.length > 0 ? data : mockPolicies);
    } catch (error) {
      console.error('Failed to load policies:', error);
      setPolicies(mockPolicies);
    } finally {
      // setLoading(false);
    }
  };

  const getStatusChip = (status: PolicyStatus) => {
    const config: Record<
      PolicyStatus,
      {
        color:
        | "success"
        | "warning"
        | "info"
        | "primary"
        | "default";
        icon?: React.ReactElement;
      }
    > = {
      ACTIVE: {
        color: 'success',
        icon: <ActiveIcon fontSize="small" />,
      },
      DRAFT: {
        color: 'warning',
        icon: <PendingIcon fontSize="small" />,
      },
      PENDING_APPROVAL: {
        color: 'info',
        icon: <PendingIcon fontSize="small" />,
      },
      SCHEDULED: {
        color: 'primary',
        icon: <ScheduledIcon fontSize="small" />,
      },
      EXPIRED: {
        color: 'default',
        icon: undefined,
      },
      ARCHIVED: {
        color: 'default',
        icon: undefined,
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

  console.log(filteredPolicies);

  const stats = useMemo(
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
      setWizardOpen(true);
    }
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedPolicy) return;

    try {
      // await policyApi.deletePolicy(selectedPolicy.id);

      setPolicies((prev) =>
        prev.filter((p) => p.id !== selectedPolicy.id)
      );
    } catch (error) {
      console.error(error);
    }

    handleMenuClose();
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box className="flex justify-between items-center mb-4">
        <Typography variant="h4" component="h1">
          Policy Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            // setEditingPolicyId(undefined);
            // setWizardOpen(true);
            navigate('/policies/create')
          }}
        >
          Create Policy
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Policies
              </Typography>
              <Typography variant="h4">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Policies
              </Typography>
              <Typography variant="h4" color="success.main">
                {stats.active}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Pending Approval
              </Typography>
              <Typography variant="h4" color="warning.main">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Drafts
              </Typography>
              <Typography variant="h4" color="info.main">
                {stats.draft}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Policy List */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              {/* <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
                <Tab label="All Policies" />
                <Tab label="Leave Policies" />
                <Tab label="Attendance Policies" />
                <Tab label="Payroll Policies" />
              </Tabs> */}

              <Box className="flex gap-3 mb-3">
                <TextField
                  size="small"
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Domain</InputLabel>
                  <Select
                    value={domainFilter}
                    label="Domain"
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
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
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
              </Box>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Policy Name</TableCell>
                      <TableCell>Domain</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created By</TableCell>
                      <TableCell>Effective From</TableCell>
                      <TableCell>Last Updated</TableCell>

                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPolicies.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No policies found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPolicies.map((policy) => (
                        <TableRow key={policy.id} hover >
                          <TableCell>
                            <Typography>
                              {policy.name}
                            </Typography>

                            {policy.description && (
                              <Typography

                              >
                                {policy.description}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={policy.domain.replace(/_/g, ' ')}
                            />
                          </TableCell>

                          <TableCell>
                            {getStatusChip(policy.status)}
                          </TableCell>

                          <TableCell>{policy.createdBy}</TableCell>

                          
                          <TableCell>
                            {dayjs(policy.effectiveFrom).format(
                              "DD MMM YYYY"
                            )}
                          </TableCell>
                          <TableCell>
                            {/* {new Date(policy.updatedAt).toLocaleDateString()} */}
                            {dayjs(policy.updatedAt).format("DD MMM YYYY")}
                          </TableCell>

                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/policies/${policy.id}`)}
                            >
                              <ViewIcon />
                            </IconButton>

                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, policy)}
                            >
                              <MoreIcon />
                            </IconButton>
                          </TableCell>
                          {/* <TableCell>
                            {policy.currentVersion}
                          </TableCell> */}

                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* {filteredPolicies.length === 0 && !loading && (
                <Box>
                  <Typography color="text.secondary">
                    No policies found. Click "Create Policy" to get started.
                  </Typography>
                </Box>
              )} */}
            </CardContent>
          </Card>
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
          <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        <MenuItem onClick={() => {/* View versions */ }}>
          <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View Versions
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Container>
  );
};