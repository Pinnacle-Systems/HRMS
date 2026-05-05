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
  Chip,
  Paper,
  ListItemIcon,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  EmailOutlined as EmailOutlinedIcon,
  PhoneOutlined as PhoneOutlinedIcon,
  CakeOutlined as CakeOutlinedIcon,
  WorkOutlineOutlined as WorkOutlineOutlinedIcon,
  CalendarTodayOutlined as CalendarTodayOutlinedIcon,
  DevicesOutlined as DevicesOutlinedIcon,
  LocationCityOutlined as LocationCityOutlinedIcon,
  Business as BusinessIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  DescriptionOutlined as DescriptionOutlinedIcon,
  Person2Outlined,
  PhotoCameraOutlined,
  CloseOutlined,
} from "@mui/icons-material";
import { authService } from "../../services/modules/auth";
import React from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { useUI } from "../../context/Snackbar";

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
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
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

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

  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      try {
        const response = await authService.getProfile();
        setUserData(response.data);
      } catch (error: any) {
        console.error("Failed to load profile:", error.message);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {}, [userData]);

  const [editFormData, setEditFormData] = useState(userData);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditDialogOpen = () => {
    setEditFormData(userData);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
  };
  const [isSaving, setIsSaving] = useState(false);

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
      };

      const response = await authService.updateProfile(updatedData);
      setUserData(response.data);
      setEditDialogOpen(false);
      if (response.success) {
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

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showSnackbar("New passwords do not match!", "warning");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showSnackbar("Password must be at least 6 characters long!", "warning");
      return;
    }
    try {
      const updatedData = {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      };
      showSpinner();
      const response = await authService.changePassword(updatedData);
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
  const loginHistory = [
    {
      id: 1,
      date: "Apr 30, 2024",
      time: "09:15 AM",
      ipAddress: "192.168.1.101",
      device: "Chrome on Windows",
      location: "New York, USA",
      status: "success",
    },
    {
      id: 2,
      date: "Apr 29, 2024",
      time: "08:45 AM",
      ipAddress: "192.168.1.101",
      device: "Chrome on Windows",
      location: "New York, USA",
      status: "success",
    },
    {
      id: 3,
      date: "Apr 28, 2024",
      time: "09:30 AM",
      ipAddress: "192.168.1.105",
      device: "Safari on Mac",
      location: "New York, USA",
      status: "success",
    },
    {
      id: 4,
      date: "Apr 27, 2024",
      time: "10:00 AM",
      ipAddress: "10.0.0.25",
      device: "Firefox on Ubuntu",
      location: "Unknown",
      status: "failed",
    },
    {
      id: 5,
      date: "Apr 26, 2024",
      time: "08:30 AM",
      ipAddress: "192.168.1.101",
      device: "Chrome on Windows",
      location: "New York, USA",
      status: "success",
    },
  ];

  const getInitials = () => {
    return `${userData?.firstName?.[0] || ""}${userData?.lastName?.[0] || ""}`;
  };

  const renderDynamicField = (
    field: any,
    editFormData: any,
    setEditFormData: any,
    multiline: any,
  ) => {
    const { name, dname, type, disabled, required } = field;
    const value = editFormData?.[name] || "";
    if (type == "date") {
      return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label={dname}
            // value={value ? dayjs(value) : null}
            onChange={(newValue) =>
              setEditFormData({
                ...editFormData,
                [name]: newValue ? newValue.format("YYYY-MM-DD") : "",
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

  // const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showSnackbar("Please upload a valid image file", "warning");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showSnackbar("Image size should be less than 5MB", "warning");
      return;
    }
    showSpinner();
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      // API call here
    } catch (error) {
      showSnackbar("Error uploading image:", "error");
      alert("Failed to upload profile picture");
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
            <div className="border border-gray-300 rounded-lg p-6">
              <div className="font-semibold mb-3 text-primary">
                Personal Information
              </div>
              <div className="ml-6 flex items-center gap-5">
                <div className="flex flex-col items-center gap-2 mr-8">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/jpeg,image/png,image/jpg,image/gif"
                    className="hidden"
                  />
                  <Tooltip
                    title="Click to upload profile picture"
                    placement="bottom"
                  >
                    <div
                      className="relative cursor-pointer"
                      onClick={handleImageClick}
                    >
                      <Avatar
                        className="!w-24 !h-24 !bg-primary text-3xl transition-all duration-300"
                        // sx={{
                        //   filter: uploadingImage ? "blur(2px)" : "none",
                        // }}
                        src={
                          profileImage || userData?.profilePicture || undefined
                        }
                      >
                        {!profileImage &&
                          !userData?.profilePicture &&
                          (getInitials() || "U")}
                      </Avatar>

                      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-300 rounded-full flex items-center justify-center">
                        {/* {uploadingImage ? (
                          <CircularProgress size={30} className="text-white" />
                        ) : ( */}
                        <div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <PhotoCameraOutlined
                            className="!text-white text-3xl"
                            sx={{ "& svg": { color: "white" } }}
                          />
                        </div>
                        {/* )} */}
                      </div>
                    </div>
                  </Tooltip>

                  {/* {uploadingImage && (
                    <div className="text-xs text-gray-500 mt-1">
                      Uploading...
                    </div>
                  )} */}
                </div>
                <div className="grid grid-cols-3 gap-8">
                  {personalInfo.map((item) => (
                    <div className="flex items-start text-gray-600">
                      <ListItemIcon
                        className="!text-primary !w-3"
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
            <div className="border border-gray-300 rounded-lg p-4">
              <div className="font-semibold mb-3 text-primary">
                Employment Information
              </div>
              <div className="grid grid-cols-4 gap-8 ml-6">
                {employementInfo.map((item) => (
                  <div className="flex items-start text-gray-600">
                    <ListItemIcon
                      className="!text-primary !w-3"
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
          <div className="p-4 ">
            <TableContainer component={Paper} elevation={0}>
              <Table className="border">
                <TableHead>
                  <TableRow className="bg-gray-100 !text-primary">
                    <TableCell className="!font-semibold text-gray-800">
                      S No
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      Date
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      Time
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      IP Address
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      Device
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      Location
                    </TableCell>
                    <TableCell className="!font-semibold text-gray-800">
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody className="bg-white">
                  {loginHistory.map((history, index) => (
                    <TableRow key={history.id} hover>
                      <TableCell className="text-gray-800 text-sm">
                        {index + 1}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {history.date}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        {history.time}
                      </TableCell>
                      <TableCell className="text-gray-800">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {history.ipAddress}
                        </code>
                      </TableCell>
                      <TableCell className="text-gray-800">
                        <div className="flex items-center gap-1">
                          <DevicesOutlinedIcon className="!w-4 !h-4 text-gray-400" />
                          <span className="text-sm">{history.device}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-800">
                        <div className="flex items-center gap-1">
                          <LocationCityOutlinedIcon className="!w-4 !h-4 text-gray-400" />
                          <span className="text-sm">{history.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            history.status === "success" ? "Success" : "Failed"
                          }
                          color={
                            history.status === "success" ? "success" : "error"
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {loginHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No login history available
              </div>
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
            <CloseOutlined />
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
                    field.multiline,
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
            Save Changes
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
            <CloseOutlined />
          </IconButton>
        </div>
        <DialogContent className="mt-4 space-y-6">
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
              {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
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
              {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
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
              {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
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
    </div>
  );
}
