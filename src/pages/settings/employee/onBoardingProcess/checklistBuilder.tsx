import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackOutlined from "@mui/icons-material/ArrowBackOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import {
  CHECKLIST_TASK_TYPES,
  onBoardService,
} from "../../../../services/modules/onBoard";
import { useUI } from "../../../../context/Snackbar";
import {
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  DescriptionOutlined,
} from "@mui/icons-material";

export const ChecklistBuilder = () => {
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<any>(null);
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [newChecklist, setNewChecklist] = useState({
    name: "",
    description: "",
    active: true,
  });
  const [tasks, setTasks] = useState<any[]>([]);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTask, setEditTask] = useState<any>({
    taskName: "",
    description: "",
    taskType: "CUSTOM",
    documentName: "",
    required: true,
  });
  const [activeTab, setActiveTab] = useState(0);

  const fetchChecklists = async () => {
    try {
      showSpinner();
      const response: any = await onBoardService.getChecklists();
      setChecklists(response.data.content || response.data || []);
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    fetchChecklists();
  }, []);

  const handleAddChecklist = async () => {
    if (!newChecklist.name) {
      showSnackbar("Checklist name is required", "error");
      return;
    }
    try {
      showSpinner();
      const response: any = await onBoardService.createChecklist(newChecklist);
      setChecklists([...checklists, response.data]);
      setIsAddingChecklist(false);
      setNewChecklist({ name: "", description: "", active: true });
      showSnackbar("Checklist created successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
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
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleUpdateChecklistStatus = async (active: boolean) => {
    try {
      showSpinner();
      await onBoardService.updateChecklist(selectedChecklist.id, {
        ...selectedChecklist,
        active,
      });
      setSelectedChecklist({ ...selectedChecklist, active });
      showSnackbar("Checklist updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleAddTask = async () => {
    if (!editTask.taskName) {
      showSnackbar("Task name is required", "error");
      return;
    }
    try {
      showSpinner();
      const response: any = await onBoardService.createTask(
        selectedChecklist.id,
        editTask,
        tasks.length + 1,
      );
      setTasks([...tasks, response.data]);
      setIsEditingTask(false);
      setEditTask({
        taskName: "",
        description: "",
        taskType: "CUSTOM",
        documentName: "",
        required: true,
      });
      showSnackbar("Task added successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleUpdateTask = async () => {
    try {
      showSpinner();
      await onBoardService.updateTask(
        selectedChecklist.id,
        editTask.id,
        editTask,
        editTask.sortOrder,
      );
      setTasks(tasks.map((t) => (t.id === editTask.id ? editTask : t)));
      setIsEditingTask(false);
      setEditTask({
        taskName: "",
        description: "",
        taskType: "CUSTOM",
        documentName: "",
        required: true,
      });
      showSnackbar("Task updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    showConfirmDialog({
      title: "Delete Task",
      message: "Are you sure you want to delete this task?",
      confirmText: "Delete",
      onConfirm: async () => {
        try {
          showSpinner();
          await onBoardService.deleteTask(selectedChecklist.id, taskId);
          setTasks(tasks.filter((t) => t.id !== taskId));
          showSnackbar("Task deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const handleReorderTasks = async (
    taskId: string,
    direction: "up" | "down",
  ) => {
    const currentIndex = tasks.findIndex((t) => t.id === taskId);
    if (direction === "up" && currentIndex === 0) return;
    if (direction === "down" && currentIndex === tasks.length - 1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const newTasks = [...tasks];
    [newTasks[currentIndex], newTasks[newIndex]] = [
      newTasks[newIndex],
      newTasks[currentIndex],
    ];

    // Update sort orders
    const reorderData:any = newTasks.map((task, index) => ({
      taskId: task.id,
      sortOrder: index,
    }));

    try {
      showSpinner();
      await onBoardService.reorderTasks(selectedChecklist.id, reorderData);
      setTasks(newTasks);
      showSnackbar("Tasks reordered successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
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
    <div className="py-4">
      <div className="mb-4 flex justify-between items-center">
        <div>
          <div className="text-[12px] text-gray-800">
            Onboarding Checklist Builder
          </div>
          <div className="text-[12px] text-gray-500">
            Create and manage onboarding checklists.
          </div>
        </div>
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
              <Card
                key={checklist.id}
                className="cursor-pointer bg-white hover:shadow-lg transition-shadow"
              >
                <CardContent onClick={() => handleSelectChecklist(checklist)}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-medium text-gray-800">
                      {checklist.name}
                    </h3>
                    <Chip
                      label={checklist.active ? "Active" : "Inactive"}
                      size="small"
                      color={checklist.active ? "success" : "default"}
                    />
                  </div>
                  <p className="text-gray-600 text-[12px] mb-2">
                    {checklist.description || "No description"}
                  </p>
                  <p className="text-xs text-primary">
                    Task Count: {checklist.taskCount}
                  </p>
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
                <ArrowBackOutlined className="text-gray-800" />
              </IconButton>
              <div>
                <h2 className="text-medium font-semibold text-gray-800">
                  {selectedChecklist.name}
                </h2>
                <p className="text-[12px] text-gray-600">
                  {selectedChecklist.description}
                </p>
              </div>
            </div>
            <div className="mb-4 flex justify-end">
              <Button
                variant="contained"
                onClick={() => {
                  setIsEditingTask(true);
                  setEditTask({
                    taskName: "",
                    description: "",
                    taskType: "CUSTOM",
                    documentName: "",
                    required: true,
                  });
                }}
                className="!bg-primary"
              >
                Add Task
              </Button>
            </div>
          </div>

          <div className="h-[calc(100vh-360px)] overflow-auto">
            {/* <TableContainer
              component={Paper}
              elevation={0}
              className="border border-gray-200"
            >
              <Table stickyHeader>
                <TableHead className="bg-gray-100">
                  <TableRow>
                    <TableCell className="text-gray-800 !font-semibold">
                      S No
                    </TableCell>
                    <TableCell className="text-gray-800 !font-semibold">
                      Task Name
                    </TableCell>
                    <TableCell className="text-gray-800 !font-semibold">
                      Description
                    </TableCell>
                    <TableCell className="text-gray-800 !font-semibold">
                      Document Name
                    </TableCell>
                    <TableCell className="text-gray-800 !font-semibold">
                      Task Type
                    </TableCell>
                    <TableCell className="text-gray-800 !font-semibold">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody className="bg-white-50">
                  {tasks.map((task, index) => (
                    <TableRow key={task.id} sx={getRowColor(index)}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {task.title}
                      </TableCell>
                      <TableCell>{task.description}</TableCell>
                      <TableCell>{task.documentName}</TableCell>
                      <TableCell>{task.taskType}</TableCell>
                      <TableCell className="!flex gap-1">
                        <IconButton
                          size="small"
                          onClick={() => handleReorderTasks(task.id, "up")}
                          disabled={index === 0}
                        >
                          <ArrowUpwardOutlined fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleReorderTasks(task.id, "down")}
                          disabled={index === tasks.length - 1}
                        >
                          <ArrowDownwardOutlined fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setEditTask({
                              ...task,
                              taskName: task.taskName || task.title || "",
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
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer> */}
            <div className="grid grid-cols-2 gap-4">
              {tasks.map((task, index) => (
                <Card
                  key={task.id}
                  className="border border-gray-200 rounded-xl hover:shadow-md transition-shadow duration-200"
                // sx={{
                //   backgroundColor: index % 2 === 0 ? "#ffffff" : "#fafafa",
                // }}
                >
                  <CardContent className="p-4 bg-white-50 dark:bg-head">
                    <div className="flex items-start justify-between gap-4">
                      {/* Left Section - Task Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-medium text-gray-400 min-w-[30px]">
                            #{index + 1}
                          </span>
                          <Typography
                            variant="body1"
                            className="font-semibold text-gray-800"
                          >
                            {task.title}
                          </Typography>
                          {task.required && (
                            <Chip
                              label="Required"
                              size="small"
                              color="warning"
                              className="!h-5 !text-[10px]"
                            />
                          )}
                        </div>

                        <div className="ml-[42px] space-y-1">
                          {task.description && (
                            <Typography
                              variant="body2"
                              className="text-gray-600 text-sm"
                            >
                              {task.description}
                            </Typography>
                          )}

                          <div className="flex flex-wrap items-center gap-2 !mt-2">
                            {task.taskType && (
                              <Chip
                                label={`${task.taskType}`}
                                size="small"
                                variant="outlined"
                                color="primary"
                                className="!h-5 !text-[10px] text-gray-600"
                              />
                            )}
                            {task.documentName && (
                              <Chip
                                label={`${task.documentName}`}
                                size="small"
                                variant="outlined"
                                color="success"
                                className="!h-5 !text-[10px] text-blue-600 border-blue-200 bg-blue-50"
                              />
                            )}
                            {/* {task.sortOrder !== undefined && (
                              <Chip
                                label={`Order: ${task.sortOrder + 1}`}
                                size="small"
                                variant="outlined"
                                className="!h-5 !text-[10px] text-gray-500"
                              />
                            )} */}
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Actions */}
                      <div className="grid gap-y-3">
                        <div className="flex items-center gap-1">
                        <Tooltip title="Move Up">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handleReorderTasks(task.id, "up")}
                              disabled={index === 0}
                              className="hover:bg-gray-100"
                            >
                              <ArrowUpwardOutlined
                                fontSize="small"
                                className={
                                  index === 0
                                    ? "text-gray-300"
                                    : "text-gray-600"
                                }
                              />
                            </IconButton>
                          </span>
                        </Tooltip>

                        <Tooltip title="Move Down">
                          <span>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleReorderTasks(task.id, "down")
                              }
                              disabled={index === tasks.length - 1}
                              className="hover:bg-gray-100"
                            >
                              <ArrowDownwardOutlined
                                fontSize="small"
                                className={
                                  index === tasks.length - 1
                                    ? "text-gray-300"
                                    : "text-gray-600"
                                }
                              />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </div>
                      <div className="flex items-center gap-1">
                        <Tooltip title="Edit Task">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditTask({
                                ...task,
                                taskName: task.taskName || task.title || "",
                              });
                              setIsEditingTask(true);
                            }}
                            className="hover:bg-blue-50 text-blue-600"
                          >
                            <EditIcon fontSize="small" color="primary"/>
                          </IconButton>
                        </Tooltip>

                        <Tooltip title="Delete Task">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteTask(task.id)}
                            className="hover:bg-red-50 text-red-500"
                          >
                            <DeleteIcon fontSize="small" color="error"/>
                          </IconButton>
                        </Tooltip>
                      </div>
                      </div>
                    </div>

                    {/* Progress indicator for tasks with status (optional) */}
                    {task.status && (
                      <div className="mt-2 ml-[42px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{
                                width:
                                  task.status === "COMPLETED"
                                    ? "100%"
                                    : task.status === "IN_PROGRESS"
                                      ? "50%"
                                      : "0%",
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-500 min-w-[60px]">
                            {task.status === "COMPLETED"
                              ? "✅ Done"
                              : task.status === "IN_PROGRESS"
                                ? "⏳ In Progress"
                                : task.status === "OVERDUE"
                                  ? "⚠️ Overdue"
                                  : "⏸️ Pending"}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {tasks.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                  <DescriptionOutlined className="text-gray-300 text-5xl mb-3" />
                  <Typography variant="body1" color="textSecondary">
                    No tasks added yet
                  </Typography>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    className="text-sm"
                  >
                    Click the "Add Task" button to create your first task
                  </Typography>
                </div>
              )}
            </div>
          </div>

          {activeTab === 1 && (
            <Card>
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedChecklist.active}
                      onChange={(e) =>
                        handleUpdateChecklistStatus(e.target.checked)
                      }
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
      <Dialog
        open={isEditingTask}
        onClose={() => setIsEditingTask(false)}
        maxWidth="sm"
        fullWidth
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-200">
          <div className="text-gray-800 ml-4"> {editTask.id ? "Update Task" : "Add New Task"}</div>
          <IconButton>
            <CloseOutlined
              className="text-gray-800"
              onClick={() => setIsEditingTask(false)}
            />
          </IconButton>
        </div>
        <DialogContent>
          <div className="space-y-6">
            <TextField
              fullWidth
              label="Task Name"
              value={editTask.taskName}
              onChange={(e) =>
                setEditTask({ ...editTask, taskName: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={editTask.description}
              onChange={(e) =>
                setEditTask({ ...editTask, description: e.target.value })
              }
            />
            <FormControl fullWidth>
              <InputLabel>Task Type</InputLabel>
              <Select
                value={editTask.taskType || "CUSTOM"}
                label="Task Type"
                onChange={(e) =>
                  setEditTask({ ...editTask, taskType: e.target.value })
                }
              >
                {CHECKLIST_TASK_TYPES.map((taskType) => (
                  <MenuItem key={taskType} value={taskType}>
                    {taskType}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Document Name"
              value={editTask.documentName || ""}
              onChange={(e) =>
                setEditTask({ ...editTask, documentName: e.target.value })
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={editTask.required ?? true}
                  onChange={(e) =>
                    setEditTask({ ...editTask, required: e.target.checked })
                  }
                />
              }
              label="Required"
            />
          </div>
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button
            onClick={() => setIsEditingTask(false)}
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
          >
            Cancel
          </Button>
          <Button
            onClick={editTask.id ? handleUpdateTask : handleAddTask}
            variant="contained"
            className="!bg-primary"
          >
            {editTask.id ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Checklist Dialog */}
      <Dialog
        open={isAddingChecklist}
        onClose={() => setIsAddingChecklist(false)}
        maxWidth="sm"
        fullWidth
      >
        <div className="text-primary !border-b !p-2 flex items-center justify-between !border-gray-200">
          <span className="ml-4 text-gray-800"> Add Checklist</span>
          <IconButton
            onClick={() => {
              setIsAddingChecklist(false);
            }}
          >
            <CloseOutlined className="!text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          <div className="grid gap-4 pt-2">
            <TextField
              fullWidth
              label="Checklist Name"
              value={newChecklist.name}
              onChange={(e) =>
                setNewChecklist({ ...newChecklist, name: e.target.value })
              }
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={newChecklist.description}
              onChange={(e) =>
                setNewChecklist({
                  ...newChecklist,
                  description: e.target.value,
                })
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newChecklist.active}
                  onChange={(e) =>
                    setNewChecklist({
                      ...newChecklist,
                      active: e.target.checked,
                    })
                  }
                />
              }
              label="Active"
            />
          </div>
        </DialogContent>
        <DialogActions className="!p-4 !border-t !border-gray-200">
          <Button
            onClick={() => setIsAddingChecklist(false)}
            variant="outlined"
            className="!border-gray-200 !text-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddChecklist}
            variant="contained"
            className="!bg-primary"
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
