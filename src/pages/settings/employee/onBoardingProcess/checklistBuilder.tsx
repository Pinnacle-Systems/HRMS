import { useState, useEffect } from 'react';
import {
  Button, Card, CardContent, TextField, Dialog, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Chip, Select, MenuItem, FormControl, InputLabel, Switch,
  FormControlLabel
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import { onBoardService } from '../../../../services/modules/onBoard';
import { useUI } from '../../../../context/Snackbar';

export const ChecklistBuilder = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [newChecklist, setNewChecklist] = useState({ name: '', description: '', active: true });
  const [tasks, setTasks] = useState<any[]>([]);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTask, setEditTask] = useState<any>({ taskName: '', description: '', taskType: 'GENERAL', documentName: '', required: true });
  const [activeTab, setActiveTab] = useState(0);

  const fetchChecklists = async () => {
    try {
      showSpinner();
      const response: any = await onBoardService.getChecklists({ size: 100 });
      setChecklists(response.data.content || response.data || []);
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const handleAddChecklist = async () => {
    if (!newChecklist.name) {
      showSnackbar('Checklist name is required', 'error');
      return;
    }
    try {
      showSpinner();
      const response: any = await onBoardService.createChecklist(newChecklist);
      setChecklists([...checklists, response.data]);
      setIsAddingChecklist(false);
      setNewChecklist({ name: '', description: '', active: true });
      showSnackbar('Checklist created successfully!', 'success');
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleSelectChecklist = async (checklist: any) => {
    setSelectedChecklist(checklist);
    setActiveTab(0);
    try {
      showSpinner();
      const response: any = await onBoardService.getChecklistById(checklist.id);
      setTasks(response.data.tasks || []);
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleUpdateChecklistStatus = async (active: boolean) => {
    try {
      showSpinner();
      await onBoardService.updateChecklist(selectedChecklist.id, { ...selectedChecklist, active });
      setSelectedChecklist({ ...selectedChecklist, active });
      showSnackbar('Checklist updated successfully!', 'success');
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleAddTask = async () => {
    if (!editTask.taskName) {
      showSnackbar('Task name is required', 'error');
      return;
    }
    try {
      showSpinner();
      const response: any = await onBoardService.createTask(selectedChecklist.id, editTask, tasks.length + 1);
      setTasks([...tasks, response.data]);
      setIsEditingTask(false);
      setEditTask({ taskName: '', description: '', taskType: 'GENERAL', documentName: '', required: true });
      showSnackbar('Task added successfully!', 'success');
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleUpdateTask = async () => {
    try {
      showSpinner();
      await onBoardService.updateTask(selectedChecklist.id, editTask.id, editTask, editTask.sortOrder);
      setTasks(tasks.map(t => t.id === editTask.id ? editTask : t));
      setIsEditingTask(false);
      setEditTask({ taskName: '', description: '', taskType: 'GENERAL', documentName: '', required: true });
      showSnackbar('Task updated successfully!', 'success');
    } catch (error: any) {
      showSnackbar(error.message, 'error');
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    showConfirmDialog({
      title: 'Delete Task',
      message: 'Are you sure you want to delete this task?',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          showSpinner();
          await onBoardService.deleteTask(selectedChecklist.id, taskId);
          setTasks(tasks.filter(t => t.id !== taskId));
          showSnackbar('Task deleted successfully!', 'success');
        } catch (error: any) {
          showSnackbar(error.message, 'error');
        } finally {
          hideSpinner();
        }
      }
    });
  };

  // const handleDeleteChecklist = async () => {
  //   showConfirmDialog({
  //     title: 'Delete Checklist',
  //     message: `Are you sure you want to delete "${selectedChecklist.name}"? This will delete all tasks associated with it.`,
  //     confirmText: 'Delete',
  //     onConfirm: async () => {
  //       try {
  //         showSpinner();
  //         await onBoardService.deleteChecklist(selectedChecklist.id);
  //         setSelectedChecklist(null);
  //         fetchChecklists();
  //         showSnackbar('Checklist deleted successfully!', 'success');
  //       } catch (error: any) {
  //         showSnackbar(error.message, 'error');
  //       } finally {
  //         hideSpinner();
  //       }
  //     }
  //   });
  // };

  // const getPriorityColor = (priority: string) => {
  //   switch (priority) {
  //     case 'High': return 'error';
  //     case 'Medium': return 'warning';
  //     case 'Low': return 'success';
  //     default: return 'default';
  //   }
  // };

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-medium font-semibold text-primary">Onboarding Checklist Builder</h1>
        {!selectedChecklist && (
          <Button
            variant="contained"
            onClick={() => setIsAddingChecklist(true)}
            className="!bg-primary"
          >
            Create New Checklist
          </Button>
        )}
      </div>

      {!selectedChecklist ? (
        <div className="h-[calc(100vh-300px)] overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {checklists.map((checklist) => (
            <Card key={checklist.id} className="cursor-pointer bg-white hover:shadow-lg transition-shadow">
              <CardContent onClick={() => handleSelectChecklist(checklist)}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-medium text-gray-800">{checklist.name}</h3>
                  <Chip
                    label={checklist.active ? 'Active' : 'Inactive'}
                    size="small"
                    color={checklist.active ? 'success' : 'default'}
                  />
                </div>
                <p className="text-gray-600 text-[12px] mb-2">{checklist.description || 'No description'}</p>
                <p className="text-xs text-primary">Task Count: {checklist.taskCount}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <IconButton
                onClick={() => setSelectedChecklist(null)}
                className="!bg-gray-100"
              >
                <ArrowBackOutlined />
              </IconButton>
              <div>
                <h2 className="text-medium font-semibold text-gray-800">{selectedChecklist.name}</h2>
                <p className="text-[12px] text-gray-600">{selectedChecklist.description}</p>
              </div>
            </div>
            <div className="mb-4 flex justify-end">
              <Button
                variant="contained"
                onClick={() => {
                  setIsEditingTask(true);
                  setEditTask({ taskName: '', description: '', taskType: 'GENERAL', documentName: '', required: true });
                }}
                className="!bg-primary"
              >
                Add Task
              </Button>
            </div>
            {/* <Button 
              variant="contained" 
              color="error" 
              onClick={handleDeleteChecklist}
              className="!border-red-300 !capitalize"
            >
              Delete Checklist
            </Button> */}
          </div>

          {/* <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)}>
              <Tab label="Tasks" />
              <Tab label="Settings" />
            </Tabs>
          </Box> */}

          {/* {activeTab === 0 && ( */}
          <div className="h-[calc(100vh-350px)] overflow-auto">
            <TableContainer component={Paper} elevation={0}  className="border">
              <Table stickyHeader>
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableCell className="text-gray-800 !font-semibold" >S No</TableCell>
                    <TableCell className="text-gray-800 !font-semibold">Task Name</TableCell>
                    <TableCell className="text-gray-800 !font-semibold">Description</TableCell>
                    <TableCell className="text-gray-800 !font-semibold">Document Name</TableCell>
                    <TableCell className="text-gray-800 !font-semibold">Task Type</TableCell>
                    <TableCell className="text-gray-800 !font-semibold">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody className="bg-white-50">
                  {tasks.map((task, index) => (
                    <TableRow key={task.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>{task.description}</TableCell>
                      <TableCell>{task.documentName}</TableCell>
                      <TableCell>{task.taskType}</TableCell>
                      {/* <TableCell>
                          <Chip label={task.priority} size="small" color={getPriorityColor(task.priority)} />
                        </TableCell> */}
                      {/* <TableCell>{task.dueDays} days</TableCell> */}
                      <TableCell className='!flex'>
                        <IconButton
                          onClick={() => {
                            setEditTask({
                              ...task,
                              taskName: task.taskName || task.title || '',
                            });
                            setIsEditingTask(true);
                          }}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDeleteTask(task.id)}
                          color="error"
                        >
                          <DeleteIcon/>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
          {/* )} */}

          {activeTab === 1 && (
            <Card>
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedChecklist.active}
                      onChange={(e) => handleUpdateChecklistStatus(e.target.checked)}
                    />
                  }
                  label="Active"
                />
                <div className="mt-4">
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      // Navigate to assign onboarding or show dialog
                    }}
                  >
                    Assign to Employees
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Add/Edit Task Dialog */}
      <Dialog open={isEditingTask} onClose={() => setIsEditingTask(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          <div className="space-y-4 pt-4">
            <TextField
              fullWidth
              label="Task Name"
              value={editTask.taskName}
              onChange={(e) => setEditTask({ ...editTask, taskName: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={editTask.description}
              onChange={(e) => setEditTask({ ...editTask, description: e.target.value })}
            />
            <FormControl fullWidth>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={editTask.taskType || 'GENERAL'}
                label="Task Type"
                onChange={(e) => setEditTask({ ...editTask, taskType: e.target.value })}
              >
                <MenuItem value="GENERAL">General</MenuItem>
                <MenuItem value="DOCUMENT">Document</MenuItem>
                <MenuItem value="ACTION">Action</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Document Name"
              value={editTask.documentName || ''}
              onChange={(e) => setEditTask({ ...editTask, documentName: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editTask.required ?? true}
                  onChange={(e) => setEditTask({ ...editTask, required: e.target.checked })}
                />
              }
              label="Required"
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditingTask(false)}>Cancel</Button>
          <Button
            onClick={editTask.id ? handleUpdateTask : handleAddTask}
            variant="contained"
            className="!bg-primary"
          >
            {editTask.id ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Checklist Dialog */}
      <Dialog open={isAddingChecklist} onClose={() => setIsAddingChecklist(false)} maxWidth="sm" fullWidth>
        <div className="text-primary !border-b !p-2 flex items-center justify-between !border-gray-200">
          <span className="ml-4"> Add Checklist</span>
          <IconButton onClick={() => { setIsAddingChecklist(false) }}>
            <CloseOutlined />
          </IconButton>
        </div>
        <DialogContent>
          <div className="grid gap-4 pt-2">
            <TextField
              fullWidth
              label="Checklist Name"
              value={newChecklist.name}
              onChange={(e) => setNewChecklist({ ...newChecklist, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newChecklist.description}
              onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newChecklist.active}
                  onChange={(e) => setNewChecklist({ ...newChecklist, active: e.target.checked })}
                />
              }
              label="Active"
            />
          </div>
        </DialogContent>
        <DialogActions className='!p-4 !border-t !border-gray-200'>
          <Button onClick={() => setIsAddingChecklist(false)} variant='outlined' className='!border-gray-200 !text-gray-800'>Cancel</Button>
          <Button onClick={handleAddChecklist} variant="contained" className="!bg-primary">Create</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
