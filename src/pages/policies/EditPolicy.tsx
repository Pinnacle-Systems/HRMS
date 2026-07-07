import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Tabs,
  Tab,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { PolicyWizard } from '../../components/PolicyManagement/policyWizard/policyWizard';
import { PolicyVersionHistory } from '../../components/PolicyManagement/PolicyVersionHistory';
import { PolicyAssignmentGrid } from '../../components/PolicyManagement/PolicyAssignmentGrid';
import { PolicyPreviewSimulator } from '../../components/PolicyManagement/PolicyPreviewSimulator';
import type { PolicyDefinition, PolicyVersion, PolicyAssignment } from '../../types/policy';
import { useUI } from '../../context/Snackbar';
import { getStatusColor, type TabPanelProps } from './const';
import { policyService } from '../../services';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
// import { useAuth } from '../../auth/authContext';

const TabPanel: React.FC<TabPanelProps> = ({ children, index, value }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

export default function EditPolicy() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [policy, setPolicy] = useState<PolicyDefinition | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [assignments, setAssignments] = useState<Record<string, PolicyAssignment[]>>({});
  const [editMode, setEditMode] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [createVersionDialogOpen, setCreateVersionDialogOpen] = useState(false);
  const [newVersionConfig, setNewVersionConfig] = useState<any>(null);
  const [changeLog, setChangeLog] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();

  useEffect(() => {
    if (id) {
      loadPolicyData();
    }
  }, [id]);

  const loadPolicyData = async () => {
    showSpinner();
    try {
      const [policyData, versionsData]: any[] = await Promise.all([
        policyService.getPolicyById(id!),
        policyService.getPolicyVersions(id!),
      ]);
      setPolicy(policyData.data || {});
      setVersions(versionsData.data || []);
      if (versionsData.data.length > 0) {
        const assignmentsResults = await Promise.all(
          versionsData.data.map(async (v: any) => {
            const assignmentsData: any = await policyService.getAssignmentsByVersion(v.id);
            return { versionId: v.versionNo, assignments: assignmentsData.data };
          })
        );

        // Process all assignments
        assignmentsResults.forEach(({ versionId, assignments }) => {
          setAssignments(prev => ({ ...prev, [versionId]: assignments }));
        });
      }
    } catch (error: any) {
      console.error('Failed to load policy:', error);
      showSnackbar(error?.message || 'Failed to load policy', 'error');
    } finally {
      hideSpinner();
    }
  };

  // PolicyVersionHistory already renders its own "Version Details" dialog
  // when a version is viewed — this callback is just an optional hook for
  // the parent page to react to that event. Nothing extra is needed here.
  const handleViewVersion = (_version: PolicyVersion) => { };

  // The policy's own status mirrors its latest/active version's status, so
  // every version-status transition (submit, approve, reject, activate,
  // archive, expire, restore) must push the same status onto the policy
  // record. PUT replaces the whole resource, so the rest of the policy's
  // fields are carried over from the currently loaded policy state.
  const syncPolicyStatus = async (status: string) => {
    await policyService.updatePolicy(id!, {
      companyId: policy?.companyId,
      templateId: policy?.templateId,
      domainId: policy?.domainId,
      policyCode: policy?.policyCode,
      policyName: policy?.policyName,
      description: policy?.description,
      effectiveFrom: policy?.effectiveFrom,
      effectiveTo: policy?.effectiveTo,
      status,
    });
  };

  const handleRestoreVersion = async (version: PolicyVersion) => {
    // Create a new version based on the restored version
    setNewVersionConfig(version.configJson);
    setCreateVersionDialogOpen(true);
  };

  const handleApproveVersion = async (version: PolicyVersion) => {
    try {
      const res: any = await policyService.approveVersion(version.id);
      await syncPolicyStatus(res?.data?.status ?? 'ACTIVE');
      showSnackbar('Version approved successfully', 'success');
      loadPolicyData();
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to approve version', 'error');
    }
  };

  const handleRejectVersion = async (version: PolicyVersion, remarks: string) => {
    try {
      const res: any = await policyService.rejectVersion(version.id, remarks);
      await syncPolicyStatus(res?.data?.status ?? 'DRAFT');
      showSnackbar('Version rejected', 'success');
      loadPolicyData();
    } catch (error: any) {
      showSnackbar(error?.message || 'Failed to reject version', 'error');
    }
  };

  const handleArchiveVersion = async (version: PolicyVersion) => {
    showConfirmDialog({
      title: 'Archive Version',
      message: `Are you sure you want to archive version ${version.versionNo}? This will also set the policy status to ARCHIVED, which is required before the policy can be deleted.`,
      confirmText: 'Archive',
      cancelText: 'Cancel',
      onConfirm: async () => {
        showSpinner();
        try {
          await policyService.archiveVersion(version.id);
          await syncPolicyStatus('ARCHIVED');
          showSnackbar('Version archived and policy status set to ARCHIVED', 'success');
          loadPolicyData();
        } catch (error: any) {
          showSnackbar(error?.message || 'Failed to archive version', 'error');
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const handleExpireVersion = async (version: PolicyVersion) => {
    showConfirmDialog({
      title: 'Expire Version',
      message: `Are you sure you want to expire version ${version.versionNo}?`,
      confirmText: 'Expire',
      cancelText: 'Cancel',
      onConfirm: async () => {
        showSpinner();
        try {
          await policyService.expireVersion(version.id);
          await syncPolicyStatus('EXPIRED');
          showSnackbar('Version expired', 'success');
          loadPolicyData();
        } catch (error: any) {
          showSnackbar(error?.message || 'Failed to expire version', 'error');
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // PolicyVersionHistory already renders its own compare dialog with the
  // full diff — same as handleViewVersion, this is just an optional hook.
  const handleCompareVersions = (_version1: PolicyVersion, _version2: PolicyVersion) => { };

  // const handleExportVersion = async (version: PolicyVersion) => {
  //   const dataStr = JSON.stringify(version.configJson, null, 2);
  //   const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
  //   const exportFileDefaultName = `policy_${policy?.policyName}_v${version.versionNo}.json`;
  //   const linkElement = document.createElement('a');
  //   linkElement.setAttribute('href', dataUri);
  //   linkElement.setAttribute('download', exportFileDefaultName);
  //   linkElement.click();
  //   // try {
  //   //   await policyVersionService.exportConfigurtion(session?.accessToken)
  //   // } catch (error) {
      
  //   // }
  // };

  const handleAddAssignment = async (assignment: Partial<PolicyAssignment>) => {
    try {
      await policyService.createAssignment(assignment);
      loadPolicyData();
    } catch (error) {
      console.error('Failed to add assignment:', error);
    }
  };

  const handleUpdateAssignment = async (id: string, assignment: Partial<PolicyAssignment>) => {
    try {
      await policyService.updateAssignment(id, assignment);
      loadPolicyData();
    } catch (error) {
      console.error('Failed to update assignment:', error);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    showConfirmDialog({
      title: "Delete Assignment",
      message: "Are you sure you want to delete this assignment?",
      confirmText: "Delete",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          await policyService.deleteAssignment(id);
          loadPolicyData();
          showSnackbar("Assignment Deleted Successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const handleCreateNewVersion = async () => {
    if (!newVersionConfig || !changeLog) return;

    try {
      const payload: any = {
        changeLog,
        configJson: newVersionConfig,
        effectiveFrom,
        effectiveTo
      }
      const newVersion: any = await policyService.createPolicyVersion(id!, payload);
      const newStatus = newVersion?.data?.status;
      if (newStatus) {
        await syncPolicyStatus(newStatus);
      }
      setCreateVersionDialogOpen(false);
      setNewVersionConfig(null);
      setChangeLog('');
      loadPolicyData();
    } catch (error) {
      console.error('Failed to create new version:', error);
    }
  };

  const handleWizardComplete = () => {
    setEditMode(false);
    loadPolicyData();
  };

  if (!policy) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">Policy not found</Alert>
      </Container>
    );
  }

  const activeVersion = versions.find(v => v.status === 'ACTIVE');
  const currentVersion = versions[0];

  return (
    <div>
      <div className='flex items-center justify-between mb-4'>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" className='text-primary' />} className='!text-gray-500'>
          <Link color="inherit" href="/policies" onClick={(e) => { e.preventDefault(); navigate('/policies'); }}>
            Policies
          </Link>
          <Link color="inherit" href={`/policies/${id}`} onClick={(e) => { e.preventDefault(); navigate(`/policies/${id}`); }}>
            {policy.policyName}
          </Link>
          <Typography color="text.primary">Edit</Typography>
        </Breadcrumbs>
        {
          editMode &&
          <div>
            <Chip
              label={policy.status}
              color={getStatusColor(policy.status) as any}
              size="small"
            />
          </div>
        }
      </div>

      {!editMode ? (
        <>
          <Box className="flex justify-between  items-center my-4">
            <Box>
              <Typography variant="h4" gutterBottom className='!text-gray-500'>
                {policy.policyName}
              </Typography>
              <Typography variant="body2" className='!text-gray-500'>
                {policy.description}
              </Typography>
            </Box>
            <Box>
              <Button
                variant="outlined" className='!border-primary !text-primary'
                onClick={() => setPreviewOpen(true)}
                sx={{ mr: 1 }}
              >
                Test Policy
              </Button>
              <Button
                variant="contained" className='!bg-primary'
                onClick={() => setEditMode(true)}
                disabled={policy.status === 'ACTIVE' && !activeVersion}
              >
                Edit Policy
              </Button>
            </Box>
          </Box>

          {policy.status === 'ACTIVE' && (
            <Alert severity="info" sx={{ mb: 1 }}>
              This policy is currently active. Editing will create a new draft version that needs to be approved
              and activated separately. Current active policy will remain in effect until the new version is activated.
            </Alert>
          )}

          <div className='mb-3 !bg-white'>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Overview" className='!text-gray-800' />
              <Tab label="Version History" className='!text-gray-800' />
              <Tab label="Assignments" className='!text-gray-800' />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Box className="!px-5">
                <Typography variant="subtitle1" gutterBottom>
                  Current Configuration
                </Typography>
                <div className='border border-gray-200 p-2 bg-head'>
                  <pre style={{ margin: 0, overflow: 'auto', fontSize: 12 }}>
                    {JSON.stringify(currentVersion?.configJson, null, 2)}
                  </pre>
                </div>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <PolicyVersionHistory
                versions={versions}
                policyName={policy.policyName}
                onViewVersion={handleViewVersion}
                onRestoreVersion={handleRestoreVersion}
                onApproveVersion={handleApproveVersion}
                onRejectVersion={handleRejectVersion}
                onArchiveVersion={handleArchiveVersion}
                onExpireVersion={handleExpireVersion}
                onCompareVersions={handleCompareVersions}
                // onExportVersion={handleExportVersion}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <PolicyAssignmentGrid
                assignments={assignments}
                companyId={policy.companyId}
                onAddAssignment={handleAddAssignment}
                onUpdateAssignment={handleUpdateAssignment}
                onDeleteAssignment={handleDeleteAssignment}
                policyVersionId={currentVersion?.id || ''}
              />
            </TabPanel>
          </div>
        </>
      ) : (
        <PolicyWizard
          companyId={policy.companyId}
          existingPolicyId={policy.id}
          onComplete={handleWizardComplete}
          onCancel={() => setEditMode(false)}
        />
      )}

      {/* Preview Simulator Dialog */}
      <PolicyPreviewSimulator
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        policyVersionId={currentVersion?.id || ''}
        policyName={policy.policyName}
      />

      {/* Create New Version Dialog */}
      <Dialog open={createVersionDialogOpen} onClose={() => setCreateVersionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box className="flex items-center gap-1">
            Create New Version from Restore
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will create a new draft version based on the restored configuration.
            You will need to review, approve, and activate it separately.
          </Alert>

          {/* Effective dates */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            {/* Effective dates */}
            <div className='grid grid-cols-2 gap-5 mb-4'>
              <DatePicker
                label="Effective From"
                value={effectiveFrom ? dayjs(effectiveFrom) : null}
                onChange={(newValue) => {
                  setEffectiveFrom(
                   newValue ? dayjs(newValue).format("YYYY-MM-DD") : ""
                  );
                }}
                maxDate={effectiveTo ? dayjs(effectiveTo) : undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                  },
                }}
              />
               <DatePicker
                label="Effective To"
                value={effectiveTo ? dayjs(effectiveTo) : null}
                onChange={(newValue) => {
                  setEffectiveTo(newValue ? dayjs(newValue).format("YYYY-MM-DD") : "")
                }}
                minDate={effectiveFrom ? dayjs(effectiveFrom) : undefined}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    margin: "normal",
                  },
                }}
              />
            </div>
          </LocalizationProvider>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Change Log / Reason"
            placeholder="Describe what changed in this version..."
            value={changeLog}
            onChange={(e) => setChangeLog(e.target.value)}
            required
          />
          <Box className="mt-4">
            <Typography variant="subtitle2" gutterBottom>
              Configuration Preview
            </Typography>
            <div className='border border-gray-200 bg-gray-100 p-1 max-h-[300px] overflow-auto'>
              <pre style={{ margin: 0, fontSize: 11 }}>
                {JSON.stringify(newVersionConfig, null, 2)}
              </pre>
            </div>
          </Box>
        </DialogContent>
        <DialogActions className='!p-4 border-t border-gray-200'>
          <Button onClick={() => setCreateVersionDialogOpen(false)} variant='outlined' className='!text-gray-800 !border-gray-200'>Cancel</Button>
          <Button onClick={handleCreateNewVersion} variant="contained" className='!bg-primary' disabled={!changeLog}>
            Create Version
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};