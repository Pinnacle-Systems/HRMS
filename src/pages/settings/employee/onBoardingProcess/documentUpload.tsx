import { useState } from 'react';
import {
  Card, CardContent, Grid, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, IconButton, Button,
  Dialog, DialogContent, DialogActions, TextField, Select, MenuItem,
  FormControl, InputLabel, Chip, LinearProgress, Tooltip,
} from '@mui/material';
import UploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import ViewIcon from '@mui/icons-material/Visibility';
import AttachmentIcon from '@mui/icons-material/AttachFile';
import {
  normalizeAssignedTasksResponse,
  normalizeDocumentsResponse,
  normalizeOnboardingAssignmentsResponse,
  onBoardService,
} from '../../../../services/modules/onBoard';
import type { EmployeeSummaryResponse } from '../../../../services/modules/employees';
import { useUI } from '../../../../context/Snackbar';
import dayjs from 'dayjs';
import EmployeeAsyncCombobox from '../../../../components/employees/EmployeeAsyncCombobox';

export const DocumentsUpload = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummaryResponse | null>(null);
  const [onboardings, setOnboardings] = useState<any[]>([]);
  const [selectedOnboarding, setSelectedOnboarding] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    taskInstanceId: '',
    documentType: '',
    remarks: ''
  });
  const [tasks, setTasks] = useState<any[]>([]);

  const fetchEmployeeOnboardings = async (employeeId: string) => {
    try {
      showSpinner();
      const response:any = await onBoardService.getAssignments({ 
        employeeId,
        size: 100 
      });
      setOnboardings(normalizeOnboardingAssignmentsResponse(response));
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const fetchTasks = async (onboardingId: string, checklistId: string) => {
    try {
      showSpinner();
      const response:any = await onBoardService.getEmployeeTasks(onboardingId, checklistId);
      setTasks(normalizeAssignedTasksResponse(response));
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const fetchDocuments = async (onboardingId: string) => {
    try {
      const response:any = await onBoardService.getDocuments(onboardingId);
      setDocuments(normalizeDocumentsResponse(response));
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    }
  };

  const handleEmployeeSelect = async (employee: EmployeeSummaryResponse | null) => {
    setSelectedEmployee(employee);
    setSelectedOnboarding(null);
    setDocuments([]);
    setOnboardings([]);
    if (employee?.id) {
      await fetchEmployeeOnboardings(employee.id);
    }
  };

  const handleOnboardingSelect = async (onboarding: any) => {
    setSelectedOnboarding(onboarding);
    setDocuments([]);
    await fetchTasks(onboarding.id, onboarding.checklistId);
    await fetchDocuments(onboarding.id);
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadData.taskInstanceId || !uploadData.documentType) {
      showSnackbar('Please select a file, task, and document type', 'error');
      return;
    }
    if (!selectedEmployee?.id) {
      showSnackbar('Cannot upload document: employee id is missing.', 'error');
      return;
    }

    try {
      showSpinner();
      await onBoardService.createDocument({
        file: selectedFile,
        taskInstanceId: uploadData.taskInstanceId,
        employeeId: selectedEmployee.id,
        notes: uploadData.remarks,
      });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadData({ taskInstanceId: '', documentType: '', remarks: '' });
      await fetchDocuments(selectedOnboarding.id);
      showSnackbar('Document uploaded successfully!', 'success');
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteDocument = async (taskInstanceId?: string) => {
    if (!taskInstanceId) {
      showSnackbar('Cannot delete document: task instance id is missing.', 'error');
      return;
    }

    showConfirmDialog({
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document?',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          showSpinner();
          await onBoardService.deleteDocument(taskInstanceId);
          await fetchDocuments(selectedOnboarding.id);
          showSnackbar('Document deleted successfully!', 'success');
        } catch (error: any) {
          showSnackbar(error.message, 'error');
        } finally {
          hideSpinner();
        }
      }
    });
  };

  // const getDocumentTypeColor = (type: string) => {
  //   const colors: Record<string, string> = {
  //     'ID Proof': 'primary',
  //     'Address Proof': 'info',
  //     'Education': 'success',
  //     'Experience': 'warning',
  //     'Medical': 'error',
  //     'Other': 'default'
  //   };
  //   return colors[type] || 'default';
  // };

  const getTaskName = (taskId: string) => {
    const task = tasks.find(t => getTaskInstanceId(t) === taskId || t.taskId === taskId);
    return task?.taskName || task?.title || taskId;
  };

  const getTaskInstanceId = (task: any) => task.taskInstanceId || task.id || task.taskId || '';

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Onboarding Documents</h1>

      <Grid container spacing={3}>
        {/* Employee Selection */}
        <Grid>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" className="font-semibold mb-3">Employee</Typography>
              <EmployeeAsyncCombobox
                value={selectedEmployee?.id || null}
                selectedEmployee={selectedEmployee}
                label="Select Employee"
                placeholder="Search employee by name or ID..."
                onChange={(_employeeId, employee) => {
                  void handleEmployeeSelect(employee || null);
                }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Onboarding Selection */}
        <Grid>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" className="font-semibold mb-3">
                Onboardings {selectedEmployee ? `- ${selectedEmployee.name}` : ''}
              </Typography>
              {selectedEmployee ? (
                onboardings.length > 0 ? (
                  <div className="space-y-2">
                    {onboardings.map((onboarding) => (
                      <div
                        key={onboarding.id}
                        onClick={() => handleOnboardingSelect(onboarding)}
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          selectedOnboarding?.id === onboarding.id 
                            ? 'bg-primary text-white' 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium text-sm">{onboarding.checklistName}</div>
                        <div className="text-xs mt-1">
                          Status: {onboarding.status} | Progress: {onboarding.progress}%
                        </div>
                        <LinearProgress 
                          variant="determinate" 
                          value={onboarding.progress || 0} 
                          className="h-1 mt-1 rounded-full"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Typography color="textSecondary" className="text-center py-4">
                    No onboardings found
                  </Typography>
                )
              ) : (
                <Typography color="textSecondary" className="text-center py-4">
                  Select an employee first
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Documents List */}
        <Grid>
          <Card>
            <CardContent>
              <div className="flex justify-between items-center mb-3">
                <Typography variant="subtitle1" className="font-semibold">
                  Documents {selectedOnboarding ? `- ${selectedOnboarding.checklistName}` : ''}
                </Typography>
                {selectedOnboarding && (
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setIsUploadDialogOpen(true)}
                    className="!bg-primary"
                    size="small"
                  >
                    Upload Document
                  </Button>
                )}
              </div>

              {selectedOnboarding ? (
                documents.length > 0 ? (
                  <TableContainer component={Paper} elevation={0}>
                    <Table size="small">
                      <TableHead className="bg-gray-100">
                        <TableRow>
                          <TableCell>Document Type</TableCell>
                          <TableCell>Task</TableCell>
                          <TableCell>File Name</TableCell>
                          <TableCell>Uploaded Date</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <Chip 
                                label={doc.documentType} 
                                size="small" 
                                // color={getDocumentTypeColor(doc.documentType)}
                              />
                            </TableCell>
                            <TableCell className="text-sm">
                              {getTaskName(doc.taskInstanceId || doc.taskId)}
                            </TableCell>
                            <TableCell className="text-sm">{doc.documentName}</TableCell>
                            <TableCell className="text-sm">
                              {dayjs(doc.uploadedAt).format('DD MMM YYYY')}
                            </TableCell>
                            <TableCell align="center">
                              <div className="flex gap-1 justify-center">
                                <Tooltip title="View/Download">
                                  <IconButton 
                                    size="small" 
                                    color="primary"
                                    href={doc.fileUrl}
                                    target="_blank"
                                    component="a"
                                  >
                                    <ViewIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete">
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDeleteDocument(doc.taskInstanceId || doc.taskId)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <div className="text-center py-8">
                    <AttachmentIcon className="text-gray-400 text-5xl mb-2" />
                    <Typography color="textSecondary">
                      No documents uploaded yet
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<UploadIcon />}
                      onClick={() => setIsUploadDialogOpen(true)}
                      className="mt-2"
                      size="small"
                    >
                      Upload First Document
                    </Button>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <AttachmentIcon className="text-gray-400 text-5xl mb-2" />
                  <Typography color="textSecondary">
                    Select an employee and onboarding to view documents
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onClose={() => setIsUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          <div className="space-y-4 pt-4">
            <Typography variant="h6" className="mb-2">Upload Document</Typography>
            
            <FormControl fullWidth>
              <InputLabel>Select Task</InputLabel>
              <Select
                value={uploadData.taskInstanceId}
                label="Select Task"
                onChange={(e) => setUploadData({ ...uploadData, taskInstanceId: e.target.value })}
              >
                {tasks.filter(t => t.status !== 'Completed').map((task) => (
                  <MenuItem key={getTaskInstanceId(task)} value={getTaskInstanceId(task)}>
                    {task.taskName || task.title} ({task.status})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={uploadData.documentType}
                label="Document Type"
                onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
              >
                <MenuItem value="ID Proof">ID Proof (Aadhaar, PAN, Passport)</MenuItem>
                <MenuItem value="Address Proof">Address Proof</MenuItem>
                <MenuItem value="Education">Education Certificate</MenuItem>
                <MenuItem value="Experience">Experience Letter</MenuItem>
                <MenuItem value="Medical">Medical Certificate</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Remarks (Optional)"
              multiline
              rows={2}
              value={uploadData.remarks}
              onChange={(e) => setUploadData({ ...uploadData, remarks: e.target.value })}
            />

            <div>
              <input
                accept="image/*,.pdf,.doc,.docx,.xlsx,.xls"
                style={{ display: 'none' }}
                id="document-upload"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      showSnackbar('File size should be less than 5MB', 'error');
                      return;
                    }
                    setSelectedFile(file);
                  }
                }}
              />
              <label htmlFor="document-upload">
                <Button
                  variant="outlined"
                  component="span"
                  fullWidth
                  startIcon={<AttachmentIcon />}
                >
                  {selectedFile ? selectedFile.name : "Choose File (Max 5MB)"}
                </Button>
              </label>
              {selectedFile && (
                <div className="text-xs text-green-600 mt-1">
                  Size: {(selectedFile.size / 1024).toFixed(2)} KB
                </div>
              )}
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleUpload} 
            variant="contained" 
            className="!bg-primary"
            disabled={!selectedFile || !uploadData.taskInstanceId || !uploadData.documentType}
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
