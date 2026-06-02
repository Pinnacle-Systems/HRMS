import React, { useState } from 'react';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    IconButton,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Card,
    CardContent,
    Menu,
    Tooltip,
    Pagination,
    LinearProgress,
    Avatar,
} from '@mui/material';
import {
    // Search as SearchIcon,
    MoreVert as MoreIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Visibility as ViewIcon,
    ContentCopy as CopyIcon,
    History as HistoryIcon,
    PlayArrow as TestIcon,
    CheckCircle as ActiveIcon,
    Pending as PendingIcon,
    Schedule as ScheduledIcon,
    Cancel as CancelIcon,
    FilterList as FilterIcon,
} from '@mui/icons-material';
import { type PolicyDefinition, PolicyDomain, PolicyStatus } from '../../types/policy';

interface PolicyListProps {
    policies: PolicyDefinition[];
    loading?: boolean;
    onView: (policy: PolicyDefinition) => void;
    onEdit: (policy: PolicyDefinition) => void;
    onDelete: (policy: PolicyDefinition) => void;
    onCopy: (policy: PolicyDefinition) => void;
    onTest: (policy: PolicyDefinition) => void;
    onViewHistory: (policy: PolicyDefinition) => void;
    onActivate?: (policy: PolicyDefinition) => void;
}

const statusConfig: Record<PolicyStatus, { color: any; icon: React.ReactNode; label: string }>
    = {
    [PolicyStatus.DRAFT]: { color: 'warning', icon: <PendingIcon />, label: 'Draft' },
    [PolicyStatus.PENDING_APPROVAL]: { color: 'info', icon: <PendingIcon />, label: 'Pending' },
    [PolicyStatus.ACTIVE]: { color: 'success', icon: <ActiveIcon />, label: 'Active' },
    [PolicyStatus.SCHEDULED]: { color: 'primary', icon: <ScheduledIcon />, label: 'Scheduled' },
    [PolicyStatus.EXPIRED]: { color: 'default', icon: <CancelIcon />, label: 'Expired' },
    [PolicyStatus.ARCHIVED]: { color: 'default', icon: <CancelIcon />, label: 'Archived' },
};

const domainColors: Record<PolicyDomain, string> = {

    [PolicyDomain.LEAVE]: '#4caf50',
    [PolicyDomain.ATTENDANCE]: '#2196f3',
    [PolicyDomain.SHIFT]: '#9c27b0',
    [PolicyDomain.HOLIDAY]: '#ff9800',
    [PolicyDomain.OVERTIME]: '#f44336',
    [PolicyDomain.PAYROLL]: '#00bcd4',
    [PolicyDomain.ALLOWANCE]: '#8bc34a',
    [PolicyDomain.DEDUCTION]: '#ff5722',
    [PolicyDomain.PROBATION]: '#3f51b5',
    [PolicyDomain.NOTICE_PERIOD]: '#e91e63',
    [PolicyDomain.EXPENSE]: '#009688',
    [PolicyDomain.APPROVAL_WORKFLOW]: '#673ab7',
    [PolicyDomain.ONBOARDING]: '#cddc39',
    [PolicyDomain.OFFBOARDING]: '#ffc107',
    [PolicyDomain.COMP_OFF]: '#55ff07',
    [PolicyDomain.WORK_FROM_HOME]: '#ea07ff',
};

export const PolicyList: React.FC<PolicyListProps> = ({
    policies,
    loading = false,
    onView,
    onEdit,
    onDelete,
    onCopy,
    onTest,
    onViewHistory,
    onActivate,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [domainFilter, setDomainFilter] = useState<PolicyDomain | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<PolicyStatus | 'all'>('all');
    const [page, setPage] = useState(1);
    const [rowsPerPage] = useState(10);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedPolicy, setSelectedPolicy] = useState<PolicyDefinition | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, policy: PolicyDefinition) => {
        setAnchorEl(event.currentTarget);
        setSelectedPolicy(policy);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedPolicy(null);
    };

    const handleAction = (action: () => void) => {
        if (selectedPolicy) {
            action();
        }
        handleMenuClose();
    };

    const filteredPolicies = policies.filter(policy => {
        const matchesSearch = policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (policy.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
        const matchesDomain = domainFilter === 'all' || policy.domain === domainFilter;
        const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
        return matchesSearch && matchesDomain && matchesStatus;
    });

    const paginatedPolicies = filteredPolicies.slice(
        (page - 1) * rowsPerPage,
        page * rowsPerPage
    );

    const getDomainIcon = (domain: PolicyDomain) => {
        const firstLetter = domain.charAt(0);
        return (
            <Avatar sx={{ width: 32, height: 32, bgcolor: domainColors[domain], fontSize: 14 }}>
                {firstLetter}
            </Avatar>
        );
    };

    if (loading) {
        return <LinearProgress />;
    }

    return (
        <Box>
            {/* Filters Bar */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Search policies by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        //   InputProps={{
                        //     startAdornment: (
                        //       <InputAdornment position="start">
                        //         <SearchIcon />
                        //       </InputAdornment>
                        //     ),
                        //   }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Domain</InputLabel>
                            <Select
                                value={domainFilter}
                                label="Domain"
                                onChange={(e) => setDomainFilter(e.target.value as PolicyDomain | 'all')}
                            >
                                <MenuItem value="all">All Domains</MenuItem>
                                {Object.values(PolicyDomain).map(domain => (
                                    <MenuItem key={domain} value={domain}>{domain}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={statusFilter}
                                label="Status"
                                onChange={(e) => setStatusFilter(e.target.value as PolicyStatus | 'all')}
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                {Object.values(PolicyStatus).map(status => (
                                    <MenuItem key={status} value={status}>{status}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                        <div className='flex flex-end'>
                            <Tooltip title="Toggle View">
                                <IconButton onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
                                    <FilterIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </Grid>
                </Grid>
            </Paper>

            {/* Table View */}
            {viewMode === 'table' && (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell>Policy Name</TableCell>
                                <TableCell>Domain</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Version</TableCell>
                                <TableCell>Last Updated</TableCell>
                                <TableCell>Created By</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedPolicies.map((policy) => (
                                <TableRow key={policy.id} hover>
                                    <TableCell>
                                        <Box>
                                            <Typography>
                                                {policy.name}
                                            </Typography>
                                            {policy.description && (
                                                <Typography variant="caption" color="text.secondary">
                                                    {policy.description.length > 60
                                                        ? `${policy.description.substring(0, 60)}...`
                                                        : policy.description}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={policy.domain}
                                            size="small"
                                            sx={{ bgcolor: domainColors[policy.domain], color: 'white' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={statusConfig[policy.status].label}
                                            color={statusConfig[policy.status].color}
                                            size="small"
                                            icon={statusConfig[policy.status].icon as any}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">
                                            v{policy.currentVersion?.versionNumber || '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography>
                                            {new Date(policy.updatedAt).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{policy.createdBy}</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="View Details">
                                            <IconButton size="small" onClick={() => onView(policy)}>
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Test Policy">
                                            <IconButton size="small" onClick={() => onTest(policy)}>
                                                <TestIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, policy)}>
                                            <MoreIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
                <Grid container spacing={2}>
                    {paginatedPolicies.map((policy) => (
                        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={policy.id}>
                            <Card
                                sx={{
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 4,
                                    },
                                }}
                                onClick={() => onView(policy)}
                            >
                                <CardContent>
                                    <Box className="flex items-between items-start">
                                        <Box className="flex items-center gap-1">
                                            {getDomainIcon(policy.domain)}
                                            <Box>
                                                <Typography>
                                                    {policy.name}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {policy.domain}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Chip
                                            label={statusConfig[policy.status].label}
                                            color={statusConfig[policy.status].color}
                                            size="small"
                                        />
                                    </Box>

                                    {policy.description && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
                                            {policy.description.length > 80
                                                ? `${policy.description.substring(0, 80)}...`
                                                : policy.description}
                                        </Typography>
                                    )}

                                    <Box className="flex items-between mt-2">
                                        <Typography variant="caption" color="text.secondary">
                                            Version: v{policy.currentVersion?.versionNumber || '-'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Updated: {new Date(policy.updatedAt).toLocaleDateString()}
                                        </Typography>
                                    </Box>

                                    <Box className="flex items-end gap-1 mt-1">
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onTest(policy); }}>
                                            <TestIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleMenuOpen(e, policy); }}>
                                            <MoreIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Pagination */}
            {filteredPolicies.length > rowsPerPage && (
                <Box className="flex items-center mt-3">
                    <Pagination
                        count={Math.ceil(filteredPolicies.length / rowsPerPage)}
                        page={page}
                        onChange={(_, value) => setPage(value)}
                        color="primary"
                    />
                </Box>
            )}

            {/* Empty State */}
            {filteredPolicies.length === 0 && !loading && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                        No policies found matching your criteria.
                    </Typography>
                </Paper>
            )}

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={() => handleAction(() => onView(selectedPolicy!))}>
                    <ViewIcon fontSize="small" sx={{ mr: 1 }} /> View Details
                </MenuItem>
                <MenuItem onClick={() => handleAction(() => onEdit(selectedPolicy!))}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} /> Edit Policy
                </MenuItem>
                <MenuItem onClick={() => handleAction(() => onCopy(selectedPolicy!))}>
                    <CopyIcon fontSize="small" sx={{ mr: 1 }} /> Duplicate
                </MenuItem>
                <MenuItem onClick={() => handleAction(() => onViewHistory(selectedPolicy!))}>
                    <HistoryIcon fontSize="small" sx={{ mr: 1 }} /> Version History
                </MenuItem>
                <MenuItem onClick={() => handleAction(() => onTest(selectedPolicy!))}>
                    <TestIcon fontSize="small" sx={{ mr: 1 }} /> Test Policy
                </MenuItem>
                {onActivate && selectedPolicy?.status === PolicyStatus.DRAFT && (
                    <MenuItem onClick={() => handleAction(() => onActivate(selectedPolicy!))}>
                        <ActiveIcon fontSize="small" sx={{ mr: 1 }} /> Activate
                    </MenuItem>
                )}
                <MenuItem onClick={() => handleAction(() => onDelete(selectedPolicy!))} sx={{ color: 'error.main' }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Delete
                </MenuItem>
            </Menu>
        </Box>
    );
};