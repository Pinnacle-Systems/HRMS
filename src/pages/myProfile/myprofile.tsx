import { useEffect, useRef, useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  ListItemIcon,
  Tooltip,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import CakeOutlinedIcon from "@mui/icons-material/CakeOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import DevicesOutlinedIcon from "@mui/icons-material/DevicesOutlined";
import BusinessIcon from "@mui/icons-material/Business";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import Person2Outlined from "@mui/icons-material/Person2Outlined";
import PhotoCameraOutlined from "@mui/icons-material/PhotoCameraOutlined";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import CalendarMonthOutlined from "@mui/icons-material/CalendarMonthOutlined";
import { authService } from "../../services/modules/auth";
import {
  passwordPolicyService,
  type PasswordPolicyResponse,
} from "../../services/modules/passwordPolicy";
import { formatDateTime } from "../../utils/dateFormatter";
import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useUI } from "../../context/Snackbar";
import type { LoginHistory } from "./const";
import { GlobalPagination } from "../../components/GlobalPagination";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import dayjs from "dayjs";
import { getRowColor } from "../const";
import {
  FALLBACK_PASSWORD_POLICY,
  validatePasswordAgainstPolicy,
} from "../../utils/passwordPolicyValidation";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      // aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function Profile() {
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [isSaving, setIsSaving] = useState(false);
  const [clearDaysDialogOpen, setClearDaysDialogOpen] = useState(false);
  const [daysToKeep, setDaysToKeep] = useState(30);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicyResponse>(
    FALLBACK_PASSWORD_POLICY,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userData, setUserData] = useState<any>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    roles: [],
    department: "",
    position: "",
    location: "",
    hireDate: "",
    employeeId: "",
  });
  const [editFormData, setEditFormData] = useState(userData);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const personalInfo = [
    {
      name: "firstName",
      dname: "First Name",
      icon: <Person2Outlined />,
      type: "text",
      disabled: false,
      required: true,
    },
    {
      name: "lastName",
      dname: "Last Name",
      icon: <Person2Outlined />,
      type: "text",
      disabled: false,
      required: true,
    },
    {
      name: "dob",
      dname: "DOB",
      icon: <CakeOutlinedIcon />,
      type: "date",
      disabled: false,
      required: true,
    },
    {
      name: "email",
      dname: "Email",
      icon: <EmailOutlinedIcon />,
      type: "text",
      disabled: true,
      required: true,
    },
    {
      name: "phone",
      dname: "Phone Number",
      icon: <PhoneOutlinedIcon />,
      type: "text",
      disabled: false,
      required: true,
    },
    {
      name: "biography",
      dname: "Biography",
      multiline: true,
      icon: <DescriptionOutlinedIcon />,
    },
  ];

  const employementInfo = [
    {
      name: "designation",
      dname: "Designation",
      icon: <WorkOutlineOutlinedIcon />,
    },
    { name: "department", dname: "Department", icon: <BusinessIcon /> },
    {
      name: "hire_date",
      dname: "Hire Date",
      icon: <CalendarTodayOutlinedIcon />,
    },
    { name: "roles", dname: "Role", icon: <DevicesOutlinedIcon /> },
  ];

  const fetchProfile = async () => {
    showSpinner();
    try {
      const response: any = await authService.getProfile();
      if (response.success) {
        setUserData(response.data);
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditDialogOpen = () => {
    setEditFormData(userData);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
  };

  const handleEditSave = async () => {
    if (isSaving) return; // Prevent double submission
    setIsSaving(true);
    showSpinner();
    try {
      const updatedData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        // email: editFormData.email,
        phone: editFormData.phone,
        dob: editFormData.dob,
        biography: editFormData.biography,
        // designation: editFormData.designation,
        // department: editFormData.department,
      };

      const response: any = await authService.updateProfile(updatedData);
      if (response.success) {
        setUserData(response.data);
        setEditDialogOpen(false);
        await fetchProfile();
        showSnackbar(response.message, "success");
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      setIsSaving(false);
      hideSpinner();
    }
  };

  const handlePasswordDialogOpen = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordDialogOpen(true);
  };

  const handlePasswordDialogClose = () => {
    setPasswordDialogOpen(false);
  };

  useEffect(() => {
    if (!passwordDialogOpen) {
      return;
    }

    let isMounted = true;

    passwordPolicyService
      .getPasswordPolicy()
      .then((policy) => {
        if (isMounted) {
          setPasswordPolicy(policy);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPasswordPolicy(FALLBACK_PASSWORD_POLICY);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [passwordDialogOpen]);

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar("New passwords do not match!", "warning");
      return;
    }
    const passwordValidationMessages = validatePasswordAgainstPolicy(
      passwordData.newPassword,
      passwordPolicy,
    );
    if (passwordValidationMessages.length > 0) {
      showSnackbar(passwordValidationMessages[0], "warning");
      return;
    }
    try {
      const updatedData = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      };
      showSpinner();
      const response: any = await authService.changePassword(updatedData);
      if (response.success) {
        showSnackbar(response.message, "success");
        setPasswordDialogOpen(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      setPasswordDialogOpen(false);
      hideSpinner();
    }
  };

  // Login history data
  const getLoginHistory = async () => {
    showSpinner();
    try {
      const params: any = {
        page: page,
        size: limit,
      };
      const response: any = await authService.getLoginHistory(params);
      if (response.success) {
        setLoginHistory(response.data.content || response.data || []);
        setTotal(
          response.data.totalElements ||
          response.data.total ||
          response.data.length ||
          0,
        );
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    getLoginHistory();
  }, [page, limit]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage - 1); // Convert to 0-based for API
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(0);
  };

  const handleClearAllHistory = async () => {
    showConfirmDialog({
      title: "Clear All Login History",
      message: "Are you sure you want to clear all login history?",
      confirmText: "Clear All",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          await authService.clearLoginHistory();
          showSnackbar("All login history cleared successfully!", "success");
          getLoginHistory();
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const handleClearOlderThanDays = async () => {
    if (daysToKeep < 1) {
      showSnackbar("Please enter a valid number of days", "error");
      return;
    }
    showConfirmDialog({
      title: "Clear Login History",
      message: `Are you sure you want to clear all login history older than ${daysToKeep} days?`,
      confirmText: "Clear",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          await authService.clearLoginHistoryOlderThan(daysToKeep);
          showSnackbar(
            `Login history older than ${daysToKeep} days cleared successfully!`,
            "success",
          );
          setClearDaysDialogOpen(false);
          getLoginHistory();
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  const getInitials = () => {
    return `${userData?.firstName?.[0] || ""}${userData?.lastName?.[0] || ""}`;
  };

  const renderDynamicField = (
    field: any,
    editFormData: any,
    setEditFormData: any,
    multiline?: any,
  ) => {
    const { name, dname, type, disabled, required } = field;
    const value = editFormData?.[name] || "";
    if (type == "date") {
      return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={dname}
            value={value ? dayjs(value) : null}
            onChange={(newValue) =>
              setEditFormData({
                ...editFormData,
                [name]: newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
              })
            }
            slotProps={{
              textField: {
                fullWidth: true,
                required: required,
              },
            }}
          />
        </LocalizationProvider>
      );
    } else {
      return (
        <TextField
          fullWidth
          multiline={multiline}
          rows={multiline ? 3 : 0}
          type={type || "text"}
          label={dname}
          value={value}
          disabled={disabled || false}
          required={required || false}
          onChange={(e) =>
            setEditFormData({
              ...editFormData,
              [name]: e.target.value,
            })
          }
        />
      );
    }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showSpinner();
      await authService.uploadProfilePicture(file);
      showSnackbar("Profile photo uploaded successfully", "success");
      
      fetchProfile();
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const commonsx = {
    "& .MuiDialog-paper": {
      width: "400px",
      maxWidth: "400px",
    },
  };

  const passwordValidationMessages = passwordData.newPassword
    ? validatePasswordAgainstPolicy(passwordData.newPassword, passwordPolicy)
    : [];

  return (
    <div className="">
      {/* Tabs */}
      <div className="">
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          className="!bg-white !border-b !border-gray-300"
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--color-primary)",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label="Profile Info" className="!text-gray-900" />
          <Tab label="Login History" className="!text-gray-900" />
        </Tabs>

        {/* Profile Info Tab */}
        <TabPanel value={tabValue} index={0}>
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="border border-gray-300 bg-white rounded-lg p-6">
              <div className="font-semibold mb-3 text-primary">
                Personal Information
              </div>
              <div className="ml-6 flex items-center gap-5">
                <div className="relative group">
                  <Avatar
                    src={userData.profilePicUrl}
                    className="!w-24 !h-24 text-2xl cursor-pointer"
                  >
                    {getInitials() || 'U'}
                  </Avatar>

                  {/* Hover Overlay */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer">
                    <PhotoCameraOutlined className="!text-white" sx={{ "& svg": { color: "white" } }} />
                  </div>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleProfileUpload}
                  />
                </div>
                <div className="grid grid-cols-3 gap-8">
                  {personalInfo.map((item, index) => (
                    <div key={item.name || index} className="flex items-start text-gray-600">
                      <ListItemIcon
                        className="!w-3 !text-gray-500"
                        sx={{ "& svg": { fontSize: 18 } }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <div>
                        <div className="text-sm text-gray-500">
                          {item.dname}
                        </div>
                        <div className="font-medium text-gray-800">
                          {userData?.[item.name] || "N/A"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end p-5 pb-0 gap-3">
                <Button
                  className="!text-primary !border-primary"
                  variant="outlined"
                  onClick={handlePasswordDialogOpen}
                >
                  Change Password
                </Button>
                <Button
                  className="!bg-primary !text-white !pr-3 !pl-3"
                  variant="contained"
                  onClick={handleEditDialogOpen}
                >
                  Edit Info
                </Button>
              </div>
            </div>
            {/* Employment Information */}
            <div className="border border-gray-300 bg-white rounded-lg p-4">
              <div className="font-semibold mb-3 text-primary">
                Employment Information
              </div>
              <div className="grid grid-cols-4 gap-8 ml-6">
                {employementInfo.map((item, index) => (
                  <div key={item.name || index} className="flex items-start text-gray-600">
                    <ListItemIcon
                      className="!w-3 !text-gray-500"
                      sx={{ "& svg": { fontSize: 18 } }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <div>
                      <div className="text-sm text-gray-500">{item.dname}</div>
                      <div className="font-medium text-gray-800">
                        {userData?.[item.name] || "N/A"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabPanel>

        {/* Login History Tab */}
        <TabPanel value={tabValue} index={1}>
          <div className="">
            <div className="flex justify-between items-center mb-4 px-4">
              <div className="font-semibold text-gray-800">Login History</div>
              {loginHistory.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outlined"
                    className="!capitalize"
                    color="error"
                    onClick={handleClearAllHistory}
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="outlined"
                    className="!capitalize !border-primary !text-primary"
                    startIcon={
                      <CalendarMonthOutlined
                        sx={{ color: "!var(--color-primary)" }}
                      />
                    }
                    onClick={() => setClearDaysDialogOpen(true)}
                  >
                    Clear Older Than
                  </Button>
                </div>
              )}
            </div>
            <TableContainer
              component={Paper}
              elevation={0}
              className="h-[calc(100vh-245px)] overflow-auto bg-white-50"
            >
              <Table stickyHeader className="border">
                <TableHead>
                  <TableRow className="bg-gray-100 !text-primary">
                    <TableCell className="!font-semibold text-gray-800">
                      S No
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      Browser
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      OS
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      IP Address
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      Device Type
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      User Agent
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      Created At
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody className="bg-white">
                  {loginHistory.map((history, index) => (
                    <TableRow key={history.id} hover sx={getRowColor(index)}>
                      <TableCell className="text-gray-800">
                        {page * limit + index + 1}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {history.browser ?? "-"}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {history.os ?? "-"}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {history.ipAddress ?? "-"}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        <div className="flex items-center gap-1">
                          <DevicesOutlinedIcon className="!w-4 !h-4 text-gray-400" />
                          <span className="!capitalize">
                            {history.deviceType ?? "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-800 max-w-[180px]">
                        <Tooltip title={history.userAgent ?? ""}>
                          <span className="block truncate">
                            {history.userAgent ?? "-"}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {formatDateTime(history.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Tooltip
                          title={
                            history.status === "SUCCESS"
                              ? "Successful login"
                              : history.failureReason ?? "Login failed"
                          }
                        >
                          <IconButton size="small">
                            {history.status === "SUCCESS" ? (
                              <CheckCircleRoundedIcon
                                className="!w-4"
                                sx={{ color: "green" }}
                              />
                            ) : (
                              <ErrorRoundedIcon
                                className="!w-4"
                                sx={{ color: "red" }}
                              />
                            )}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {loginHistory.length === 0 && (
                <div className="text-center border !border-gray-200 py-8 text-gray-500">
                  No login history available
                </div>
              )}
            </TableContainer>
            {/* Global Pagination */}
            {total > 0 && (
              <GlobalPagination
                total={total}
                page={page + 1} // Convert to 1-based for component
                limit={limit}
                onPageChange={handlePageChange}
                onLimitChange={handleLimitChange}
                pageSizeOptions={[5, 10, 20, 50, 100]}
                showTotal={true}
              />
            )}
          </div>
        </TabPanel>
      </div>

      {/* Edit Info Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        maxWidth="sm"
        sx={commonsx}
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">Edit Profile Information</div>
          <IconButton onClick={handleEditDialogClose}>
            <CloseOutlined className="!text-gray-800"/>
          </IconButton>
        </div>
        <DialogContent className="mt-4">
          <div className="grid gap-4">
            {personalInfo.map((field, index) => (
              <div key={index}>
                <div className="mb-2">
                  {renderDynamicField(
                    field,
                    editFormData,
                    setEditFormData,
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
        <DialogActions className="!p-5 border-t border-gray-300">
          <Button
            variant="outlined"
            onClick={handleEditDialogClose}
            className="!text-gray-800 !border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            className="!bg-primary hover:bg-primary-dark"
          >
            Update Profile
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={passwordDialogOpen}
        onClose={handlePasswordDialogClose}
        maxWidth="sm"
        sx={commonsx}
      >
        <div className="flex items-center justify-between p-2 border-b border-gray-300">
          <div className="text-primary ml-4">Change Password</div>
          <IconButton onClick={handlePasswordDialogClose}>
            <CloseOutlined className="!text-gray-800"/>
          </IconButton>
        </div>
        <DialogContent className="space-y-6">
          <div>
            <TextField
              fullWidth
              required
              label="Current Password"
              type={showCurrentPassword ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  currentPassword: e.target.value,
                })
              }
              className="!relative"
            />
            <IconButton
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="!absolute !right-[25px]"
              sx={{
                "& svg": {
                  fontSize: "20px",
                  color: "var(--color-primary) !important",
                },
              }}
            >
              {!showCurrentPassword ? (
                <VisibilityOffIcon />
              ) : (
                <VisibilityIcon />
              )}
            </IconButton>
          </div>
          <div>
            <TextField
              fullWidth
              required
              label="New Password"
              type={showNewPassword ? "text" : "password"}
              value={passwordData.newPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  newPassword: e.target.value,
                })
              }
              className="!relative"
            />
            <IconButton
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="!absolute !right-[25px]"
              sx={{
                "& svg": {
                  fontSize: "20px",
                  color: "var(--color-primary) !important",
                },
              }}
            >
              {!showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
            {passwordValidationMessages.length > 0 && (
              <div className="mt-2 text-[11px] text-gray-500">
                {passwordValidationMessages.map((message) => (
                  <div key={message}>{message}</div>
                ))}
              </div>
            )}
          </div>
          <div>
            <TextField
              fullWidth
              required
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              value={passwordData.confirmPassword}
              onChange={(e) =>
                setPasswordData({
                  ...passwordData,
                  confirmPassword: e.target.value,
                })
              }
              className="!relative"
            />
            <IconButton
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="!absolute !right-[25px]"
              sx={{
                "& svg": {
                  fontSize: "20px",
                  color: "var(--color-primary) !important",
                },
              }}
            >
              {!showConfirmPassword ? (
                <VisibilityOffIcon />
              ) : (
                <VisibilityIcon />
              )}
            </IconButton>
          </div>
        </DialogContent>
        <DialogActions className="!p-5 border-t border-gray-300">
          <Button
            variant="outlined"
            onClick={handlePasswordDialogClose}
            className="!text-gray-800 !border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handlePasswordChange}
            variant="contained"
            className="!bg-primary !hover:bg-primary-dark"
          >
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Older Than N Days Dialog */}
      <Dialog
        open={clearDaysDialogOpen}
        onClose={() => setClearDaysDialogOpen(false)}
        maxWidth="sm"
        sx={commonsx}
      >
        <div className="text-primary p-2 border-b !border-gray-300">
          <div className="ml-4">Clear Login History</div>
        </div>
        <DialogContent className="mt-2">
          {/* <div className="mb-4">
            Clear all login history older than specified number of days.
          </div> */}
          <TextField
            fullWidth
            type="number"
            label="Number of Days"
            value={daysToKeep}
            onChange={(e) => setDaysToKeep(parseInt(e.target.value))}
            helperText="Enter number of days to keep (older than this will be deleted)"
          />
        </DialogContent>
        <DialogActions className="!p-4 border-t !border-gray-300">
          <Button
            onClick={() => setClearDaysDialogOpen(false)}
            variant="outlined"
            className="!border-gray-300 !text-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleClearOlderThanDays}
            variant="contained"
            color="error"
            className="!capitalize"
          >
            Clear History
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
