// src/pages/EditPolicy.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
  Tabs,
  Tab,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import { NavigateNext as NavigateNextIcon, Warning as WarningIcon } from '@mui/icons-material';
import { PolicyWizard } from '../../components/PolicyManagement/policyWizard/policyWizard';
import { PolicyVersionHistory } from '../../components/PolicyManagement/PolicyVersionHistory';
import { PolicyAssignmentGrid } from '../../components/PolicyManagement/PolicyAssignmentGrid';
import { PolicyPreviewSimulator } from '../../components/PolicyManagement/PolicyPreviewSimulator';
import { policyApi } from '../../services/modules/policy';
import type { PolicyDefinition, PolicyVersion, PolicyAssignment } from '../../types/policy';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, index, value }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export  default function EditPolicy() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [policy, setPolicy] = useState<PolicyDefinition | null>(null);
  const [versions, setVersions] = useState<PolicyVersion[]>([]);
  const [assignments, setAssignments] = useState<PolicyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [createVersionDialogOpen, setCreateVersionDialogOpen] = useState(false);
  const [newVersionConfig, setNewVersionConfig] = useState<any>(null);
  const [changeLog, setChangeLog] = useState('');

  useEffect(() => {
    if (id) {
      loadPolicyData();
    }
  }, [id]);

  const loadPolicyData = async () => {
    setLoading(true);
    try {
      const policyData = await policyApi.getPolicyById(id!);
      const versionsData = await policyApi.getPolicyVersions(id!);
      setPolicy(policyData);
      setVersions(versionsData);
      
      if (versionsData[0]) {
        const assignmentsData = await policyApi.getAssignments(versionsData[0].id);
        setAssignments(assignmentsData);
      }
    } catch (error) {
      console.error('Failed to load policy:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = (version: PolicyVersion) => {
    // Open version details dialog or navigate
    console.log('View version:', version);
  };

  const handleRestoreVersion = async (version: PolicyVersion) => {
    // Create a new version based on the restored version
    setNewVersionConfig(version.config);
    setCreateVersionDialogOpen(true);
  };

  const handleApproveVersion = async (version: PolicyVersion) => {
    try {
      await policyApi.approveVersion(version.id);
      loadPolicyData();
    } catch (error) {
      console.error('Failed to approve version:', error);
    }
  };

  const handleCompareVersions = (version1: PolicyVersion, version2: PolicyVersion) => {
    // Open compare dialog or navigate to compare page
    console.log('Compare:', version1, version2);
  };

  const handleExportVersion = (version: PolicyVersion) => {
    const dataStr = JSON.stringify(version.config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `policy_${policy?.name}_v${version.versionNumber}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleAddAssignment = async (assignment: Partial<PolicyAssignment>) => {
    try {
      await policyApi.createAssignment(assignment);
      loadPolicyData();
    } catch (error) {
      console.error('Failed to add assignment:', error);
    }
  };

  const handleUpdateAssignment = async (id: string, assignment: Partial<PolicyAssignment>) => {
    try {
      await policyApi.updateAssignment(id, assignment);
      loadPolicyData();
    } catch (error) {
      console.error('Failed to update assignment:', error);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    try {
      await policyApi.deleteAssignment(id);
      loadPolicyData();
    } catch (error) {
      console.error('Failed to delete assignment:', error);
    }
  };

  const handleCheckConflicts = async (assignment: Partial<PolicyAssignment>) => {
    return await policyApi.checkConflicts(assignment);
  };

  const handleCreateNewVersion = async () => {
    if (!newVersionConfig || !changeLog) return;
    
    try {
      await policyApi.createPolicyVersion(id!, newVersionConfig, changeLog);
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

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          <Link color="inherit" href="/policies" onClick={(e) => { e.preventDefault(); navigate('/policies'); }}>
            Policies
          </Link>
          <Link color="inherit" href={`/policies/${id}`} onClick={(e) => { e.preventDefault(); navigate(`/policies/${id}`); }}>
            {policy.name}
          </Link>
          <Typography color="text.primary">Edit</Typography>
        </Breadcrumbs>
      </Box>

      {!editMode ? (
        <>
          <Box className="flex justify-between  items-center mb-3">
            <Box>
              <Typography variant="h4" gutterBottom>
                {policy.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {policy.description}
              </Typography>
            </Box>
            <Box>
              <Button
                variant="outlined"
                onClick={() => setPreviewOpen(true)}
                sx={{ mr: 1 }}
              >
                Test Policy
              </Button>
              <Button
                variant="contained"
                onClick={() => setEditMode(true)}
                disabled={policy.status === 'ACTIVE' && !activeVersion}
              >
                Edit Policy
              </Button>
            </Box>
          </Box>

          {policy.status === 'ACTIVE' && (
            <Alert severity="info" sx={{ mb: 3 }}>
              This policy is currently active. Editing will create a new draft version that needs to be approved
              and activated separately. Current active policy will remain in effect until the new version is activated.
            </Alert>
          )}

          <Paper sx={{ mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Overview" />
              <Tab label="Version History" />
              <Tab label="Assignments" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Current Configuration
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
                  <pre style={{ margin: 0, overflow: 'auto', fontSize: 12 }}>
                    {JSON.stringify(currentVersion?.config, null, 2)}
                  </pre>
                </Paper>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <PolicyVersionHistory
                versions={versions}
                policyName={policy.name}
                onViewVersion={handleViewVersion}
                onRestoreVersion={handleRestoreVersion}
                onApproveVersion={handleApproveVersion}
                onCompareVersions={handleCompareVersions}
                onExportVersion={handleExportVersion}
              />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <PolicyAssignmentGrid
                assignments={assignments}
                companyId={policy.companyId}
                onAddAssignment={handleAddAssignment}
                onUpdateAssignment={handleUpdateAssignment}
                onDeleteAssignment={handleDeleteAssignment}
                onCheckConflicts={handleCheckConflicts}
                policyVersionId={currentVersion?.id || ''}
              />
            </TabPanel>
          </Paper>
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
        policyName={policy.name}
      />

      {/* Create New Version Dialog */}
      <Dialog open={createVersionDialogOpen} onClose={() => setCreateVersionDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box className="flex items-center gap-1">
            <WarningIcon color="warning" />
            Create New Version from Restore
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will create a new draft version based on the restored configuration.
            You will need to review, approve, and activate it separately.
          </Alert>
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
          <Box >
            <Typography variant="subtitle2" gutterBottom>
              Configuration Preview
            </Typography>
            <Paper variant="outlined" sx={{ p: 1, maxHeight: 300, overflow: 'auto' }}>
              <pre style={{ margin: 0, fontSize: 11 }}>
                {JSON.stringify(newVersionConfig, null, 2)}
              </pre>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateVersionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateNewVersion} variant="contained" disabled={!changeLog}>
            Create Version
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};