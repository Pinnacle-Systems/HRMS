import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MaterialModule from "../../materialModule";
import { employeeService } from "../../services/modules/employees";
import { useUI } from "../../context/Snackbar";
import {
  toTitleCase,
  type Branches,
  type Department,
  type EmployeeDetails,
  type TabPanelProps,
} from "./type";
import {
  aadhaarColumns,
  addressColumns,
  attachmentColumns,
  bankColumns,
  basicInfoFields,
  eligibilityFields,
  emergencyColumns,
  employeeColumns,
  employmentColumns,
  esiColumns,
  familyColumns,
  insuranceColumns,
  VerificationColumns,
  loginColumns,
  panColumns,
  passportVisaColumns,
  pfColumns,
  qualificationColumns,
  trainingDetailsColumns,
  pranColumns,
  nominationTypes,
  nominationConfigs,
  attachmentAddFields,
  commonSx,
  commonsx,
  lockableFields,
  getPriorityColor,
  getDomainColor,
  masterSx,
  isEqual,
} from "./const";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { categoryService } from "../../services/modules/category";
import { DynamicSelectWithAdd } from "../../components/SelectField";
import {
  getCategoryName,
  getRowColor,
  getStickyLeftSx,
  getStickyRightSx,
  handleEnterAsTab,
  stickyHeaderLeftSx,
  stickyHeaderRightSx,
} from "../const";
import { useMasterData } from "../../hooks/useMasterData";
import { MasterSelect } from "../../components/MasterSelect";
import { departmentService } from "../../services/modules/department";
import { branchService } from "../../services/modules/branch";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";
import {
  AttachFileOutlined,
  CloseOutlined,
  ExpandMoreOutlined,
  KeyboardArrowDown,
  KeyboardArrowUp,
  PhotoCameraOutlined,
  AssignmentOutlined as PolicyIcon,
  SettingsOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import { shiftService, type Shift } from "../../services/modules/shifts";
import { auditLogService } from "../../services/modules/auditLogs";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Typography,
} from "@mui/material";
import { policyService } from "../../services";
import { PolicyDomain, type Employee } from "../../types/policy";
import { EmployeeSelector } from "../../components/PolicyManagement/Common/EmployeeSelector";
import { WebcamCapture } from "./webCam";
import { useAuth } from "../../auth/authContext";
import useUnsavedChanges from "../../hooks/useUnsavedChanges";
import { ProfileCompletionProgress } from "./useProfileCompletion";
import { attendanceService } from "../../services/modules/attendance";
import { evaluateGeofenceAccess } from "../../utils/geofence";

const withMidNoFallback = (data: any) => {
  const midNo = typeof data.midNo === "string" ? data.midNo.trim() : data.midNo;
  return midNo
    ? data
    : {
        ...data,
        midNo: data.employeeId || data.employeeCode || data.code || data.id || "",
      };
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`employee-tabpanel-${index}`}
      aria-labelledby={`employee-tab-${index}`}
      {...other}
    >
      {value === index && (
        <MaterialModule.Box sx={{ py: 0 }}>{children}</MaterialModule.Box>
      )}
    </div>
  );
}

// Editable Group Component
const EditableGroup = ({
  title,
  fields,
  data,
  onSave,
  icon,
  categoryOptions,
  categories,
  refreshCategoryOptions,
  document,
  isSaving,
  setIsSaving,
  onUnsavedChange,
  onDeactivate,
  onReactivate,
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  // const [editData, setEditData] = useState(data);
  const [editData, setEditData] = useState(() => withMidNoFallback(data));
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [department, setDepartments] = useState<Department[]>([]);
  const [branch, setBranches] = useState<Branches[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [attachmentData, setAttachmentData] = useState<any>({});
  const [attachments, setAttachments] = useState<any>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [relievingDialogOpen, setRelievingDialogOpen] = useState(false);
  const [relievingDate, setRelievingDate] = useState("");
  const [adminRemarks, setAdminRemarks] = useState("");
  const { id } = useParams();
  const { session } = useAuth();
  const isAdmin = session?.user.roles.includes('ADMIN');
  const userId = session?.user.employeeId ? session?.user.employeeId : session?.user.userId;
  const apiId = isAdmin ? id : userId;

  const hasUnsavedChanges = isEditing && !isEqual(editData, data);

  useEffect(() => {
    onUnsavedChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, isEditing, editData, data, title]);

  useEffect(() => {
    setEditData(withMidNoFallback(data));
  }, [data, isEditing]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editData);
      setIsEditing(false);
      onUnsavedChange?.(false);
      setIsSaving(false);
    } catch (error) {
      console.error("Save failed:", error);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const userChoice = window.confirm(
        'You have unsaved changes in "' + title + '". Are you sure you want to cancel?'
      );
      if (!userChoice) {
        return;
      }
    }
    setEditData(data);
    setIsEditing(false);
    onUnsavedChange?.(false);
  };


  const getFieldOptions = (fieldKey: string, fieldLabel: string) => {
    if (fieldKey == "department") {
      return department.map((opt: any) => ({
        value: opt.id,
        label: opt.departmentName,
      }));
    } else if (fieldKey == "branch") {
      return branch.map((opt: any) => ({
        value: opt.id,
        label: opt.branchName,
      }));
    } else if (fieldKey == "attendanceSchema") {
      return shifts.map((opt: any) => ({
        value: opt.id,
        label: opt.shiftName,
      }));
    } else {
      const categoryName = getCategoryName(fieldKey, fieldLabel, categories);
      const category = Object.keys(categoryOptions).find(
        (catName) =>
          catName.toLowerCase() === categoryName.toLowerCase() ||
          catName.toLowerCase() === fieldKey.toLowerCase() ||
          catName.toLowerCase() === fieldLabel.toLowerCase() ||
          catName.toLowerCase().replace(/\s/g, "") === fieldKey.toLowerCase(),
      );
      const options = category ? categoryOptions[category] : [];
      return options.map((opt: any) => ({
        value: opt.id,
        label: opt.name,
      }));
    }
  };

  const getSelectOptions = (fieldKey: string, fieldLabel: string) => {
    if (fieldKey == "department") {
      return department.map((opt: any) => opt.departmentName);
    }
    if (fieldKey == "branch") {
      return branch.map((opt: any) => opt.branchName);
    }
    if (fieldKey == "attendanceSchema") {
      return shifts.map((opt: any) => opt.shiftName);
    }
    const categoryName = getCategoryName(fieldKey, fieldLabel, categories);
    const category = Object.keys(categoryOptions).find(
      (catName) =>
        catName.toLowerCase() === categoryName.toLowerCase() ||
        catName.toLowerCase() === fieldKey.toLowerCase() ||
        catName.toLowerCase() === fieldLabel.toLowerCase(),
    );
    let options = category ? categoryOptions[category] : [];
    if (fieldKey === "documentType") {
      if (document) {
        options = options.filter((opt: any) =>
          opt.name.toLowerCase().includes(document.toLowerCase()),
        );
      }
    }
    return options.map((opt: any) => opt.name);
  };

  const getOptionIdFromName = (
    fieldKey: string,
    fieldLabel: string,
    name: string,
  ) => {
    if (!name) return " ";
    const options = getFieldOptions(fieldKey, fieldLabel);
    const option = options.find((opt: any) => opt.label === name);
    return option?.value || name;
  };

  const handleAddOption = async (fieldKey: string, newOption: string) => {
    try {
      showSpinner();
      const categoriesResponse: any = await categoryService.getCategories();
      const categories =
        categoriesResponse.data.content || categoriesResponse.data || [];
      const categoryName = getCategoryName(fieldKey, "", categories);
      const category = categories.find(
        (cat: any) =>
          cat.categoryName.toLowerCase() === categoryName.toLowerCase(),
      );
      if (!category) {
        showSnackbar(`Category "${categoryName}" not found`, "error");
        return;
      }
      const payload = {
        name: newOption,
        code: newOption.substring(0, 3).toUpperCase().replace(/\s/g, "_"),
        active: true,
      };
      await categoryService.createCategoryItem(category.id, payload);
      await refreshCategoryOptions();
      showSnackbar(`"${newOption}" added successfully!`, "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => { }, [categoryOptions]);

  const getMasterData = async () => {
    try {
      const deptRes: any = await departmentService.getDepartments();
      setDepartments(deptRes.data.content || deptRes.data || []);
      const branchRes: any = await branchService.getDropdownBranches();
      setBranches(branchRes.data.content || branchRes.data || []);
      const shiftRes: any = await shiftService.getShiftDropdown();
      setShifts(shiftRes.data.content || shiftRes.data || []);
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };

  const getDocuments = async (id: any) => {
    showSpinner();
    try {
      const response: any = await employeeService.getAttachments(id);
      setAttachments(response.data || []);
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    if (title === "Employee Details" && isAdmin) {
      getMasterData();
    }
    getDocuments(apiId);
  }, []);

  const matchedDocs = attachments.filter((opt: any) => {
    const normalizedTitle = title.toLowerCase().replace("details", "").trim();
    const normalizedDocType = opt.documentType?.toLowerCase().trim();
    return normalizedDocType.includes(normalizedTitle);
  });

  const handleUploadAttachment = () => {
    const initialData: any = {};
    attachmentAddFields.forEach((field: any) => {
      initialData[field.key] = "";
    });
    setAttachmentData(initialData);
    setSelectedFile(null);
    setAttachmentDialogOpen(true);
  };

  const handleAddAttachment = async (newItem: any) => {
    showSpinner();
    try {
      if (!newItem.documentType) {
        showSnackbar("Document Type is Mandatory", "warning");
        return;
      }
      await employeeService.addAttachment(apiId, newItem);
      if (newItem.documentType === "Aadhaar Card") {
        try {
          const formData = new FormData();
          formData.append("file", newItem.file);
          await employeeService.getAadhaarDetailsByDoc(formData);
        } catch (error: any) {
          showSnackbar(
            error.message ||
            "OCR unavailable. Please enter Aadhaar number manually.",
            "info",
          );
        }
      }
      await getDocuments(apiId);
      showSnackbar("Attachment added successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to add attachment", "error");
    } finally {
      hideSpinner();
    }
  };

  const getAadhaar = async (value: string) => {
    setIsEditing(true);
    const aadhaarNumber = value.replace(/\D/g, "");
    setEditData((prev: any) => ({ ...prev, aadhaarNumber }));
    if (aadhaarNumber.length !== 12) return;
    try {
      const payload = {
        aadhaarNumber,
        consent: true,
        // consentGiven: true,
        employeeId: editData?.id || null,
      };
      const response: any = await employeeService.getAadhaarDetails(payload);
      if (response.success && response.data) {
        setEditData((prev: any) => ({
          ...prev,
          name: response.data.name || prev.name,
          nameAsOnAadhaar: response.data.name || prev.nameAsOnAadhaar,
          dateOfBirth: response.data.dateOfBirth || prev.dateOfBirth,
          gender: response.data.gender || prev.gender,
          fathersName: response.data.fathersName || prev.fathersName,
          // address1: response.data.address1,
          // city: response.data.city,
          // state: response.data.state,
          // pincode: response.data.pincode,
        }));
        showSnackbar(response.message, "success");
      } else {
        showSnackbar(response.message || "Unable to fetch Aadhaar details", "error");
      }
    } catch (error: any) {
      showSnackbar(error.message || "Unable to fetch Aadhaar details", "error");
    }
  };

  return (
    <div className="mb-6 p-4 dark:bg-white-50 bg-white border rounded-lg mt-3 shadow-sm border-gray-300">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="font-semibold flex items-center gap-2">
            <div className="bg-primary-50 p-1 rounded-lg !text-primary">
              {" "}
              {icon}{" "}
            </div>
            <div className="text-primary-dark "> {title}</div>
            {isEditing && hasUnsavedChanges && (
              <Chip label="Unsaved" size="small" color="warning" className="ml-2" />
            )}
            <div>
              {matchedDocs.map((item: any) => (
                <a
                  key={item.id}
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 text-[12px] underline"
                >
                  {item.documentType}
                </a>
              ))}
            </div>
            {title == "Aadhaar Details" && isAdmin && 
              <div className="text-[10px] underline text-sky-500 cursor-pointer" onClick={() => getAadhaar(editData.aadhaarNumber)}>Fetch Aadhaar Details</div>
            }
          </div>
          {!isEditing ? (
            <div className="flex items-center gap-1">
              {document && (
                <MaterialModule.Tooltip title="Add Attachments">
                  <MaterialModule.IconButton
                    size="small"
                    onClick={() => handleUploadAttachment()}
                  >
                    <AttachFileOutlined
                      fontSize="small"
                      className="text-gray-800 !w-4"
                    />
                  </MaterialModule.IconButton>
                </MaterialModule.Tooltip>
              )}
              {
                (isAdmin || (!isAdmin && title === "Basic Information")) && (
                  <MaterialModule.Tooltip title="Edit">
                    <MaterialModule.IconButton
                      size="small"
                      onClick={() => setIsEditing(true)}
                    >
                      <MaterialModule.EditIcon
                        fontSize="small"
                        className="text-gray-800 !w-4"
                      />
                    </MaterialModule.IconButton>
                  </MaterialModule.Tooltip>
                )}
            </div>
          ) : (
            <div className="flex gap-1">
              {document && (
                <MaterialModule.Tooltip title="Add Attachments">
                  <MaterialModule.IconButton
                    size="small"
                    onClick={() => handleUploadAttachment()}
                  >
                    <AttachFileOutlined
                      fontSize="small"
                      className="text-gray-800 !w-4"
                    />
                  </MaterialModule.IconButton>
                </MaterialModule.Tooltip>
              )}
              <MaterialModule.Tooltip title="Save Changes">
                <MaterialModule.IconButton
                  size="small"
                  onClick={handleSave}
                  color="success"
                  disabled={isSaving}
                >
                  {isSaving ? <CircularProgress size={20} /> : <MaterialModule.SaveIcon fontSize="small" />}
                </MaterialModule.IconButton>
              </MaterialModule.Tooltip>
              <MaterialModule.Tooltip title="Cancel">
                <MaterialModule.IconButton
                  size="small"
                  onClick={handleCancel}
                  color="error"
                >
                  <MaterialModule.CancelIcon fontSize="small" />
                </MaterialModule.IconButton>
              </MaterialModule.Tooltip>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4" onKeyDown={handleEnterAsTab}>
          {fields.map((field: any) => {
            return (
              <div key={field.key} className="">
                <div className="text-xs text-gray-500">{field.label}</div>
                {isEditing ? (
                  <div className="mt-2">
                    {field.type === "date" ? (
                      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                        <DatePicker
                          className="!text-gray-800"
                          value={
                            editData[field.key]
                              ? dayjs(editData[field.key])
                              : null
                          }
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              [field.key]: e
                                ? dayjs(e).format("YYYY-MM-DD")
                                : "",
                            })
                          }
                          disabled={
                            field.disabled ||
                            (editData?.aadhaarNumber &&
                              lockableFields.includes(field.key))
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    ) : field.type === "boolean" ? (
                      <MaterialModule.FormControlLabel
                        control={
                          <MaterialModule.Switch
                            checked={editData[field.key] || false}
                            onChange={(e) => {
                              const isDeactivating =
                                field.key === "isActive" &&
                                !e.target.checked &&
                                editData[field.key] !== false;

                              if (isDeactivating) {
                                setRelievingDate("");
                                setAdminRemarks("");
                                setRelievingDialogOpen(true);
                                return;
                              }

                              if (field.key === "isActive" && e.target.checked) {
                                onReactivate?.();
                                return;
                              }

                              setEditData({
                                ...editData,
                                [field.key]: e.target.checked,
                              });
                            }}
                            className="text-gray-800"
                          />
                        }
                        label=""
                      />
                    ) : field.type === "select" ? (
                      <DynamicSelectWithAdd
                        label=""
                        title={field.label}
                        value={editData[field.key] || ""}
                        disabled={
                          field.disabled ||
                          (editData?.aadhaarNumber &&
                            lockableFields.includes(field.key))
                        }
                        onChange={(value) => {
                          const id = getOptionIdFromName(
                            field.key,
                            field.label,
                            value as string,
                          );
                          setEditData((prev: any) => ({
                            ...prev,
                            [field.key]: value,
                            [`${field.key}Id`]: id,
                          }));
                        }}
                        options={getSelectOptions(field.key, field.label)}
                        onAddOption={(newOption) =>
                          handleAddOption(field.key, newOption)
                        }
                        showAddButton={
                          (field.key == "branch" ||
                            field.key == "department" ||
                            field.key == "attendanceSchema" || !isAdmin)
                            ? false
                            : true
                        }
                      />
                    ) : field.type === "user" ? (
                      <EmployeeSelector
                        value={(() => {
                          if (editData[field.key1] && editData[field.key2]) {
                            return {
                              id: editData[field.key1],
                              name: editData[field.key2],
                              employeeId: editData[field.key1],
                              emailAddress: "",
                              mobileNumber: "",
                              designation: "",
                              department: "",
                              branch: "",
                              employeeStatus: "",
                              joiningDate: "",
                              createdAt: "",
                              isActive: true,
                              companyId: "",
                              employmentType: "",
                              employeeCategory: "",
                              isOnProbation: false,
                            } as unknown as Employee;
                          }
                          return null;
                        })()}
                        onChange={(newValue) => {
                          if (Array.isArray(newValue)) {
                            const ids = newValue.map((emp) => emp.id);
                            const names = newValue.map((emp) => emp.name);
                            setEditData((prev: any) => ({
                              ...prev,
                              [field.key]: names.join(", "),
                              [`${field.key}Ids`]: ids,
                              [field.key1]: null,
                              [field.key2]: "",
                            }));
                          } else if (newValue) {
                            setEditData((prev: any) => ({
                              ...prev,
                              [field.key]: newValue.name,
                              [field.key1]: newValue.id,
                              [field.key2]: newValue.name,
                              [`${field.key}Ids`]: [],
                            }));
                          } else {
                            setEditData((prev: any) => ({
                              ...prev,
                              [field.key]: "",
                              [field.key1]: null,
                              [field.key2]: "",
                              [`${field.key}Ids`]: []
                            }));
                          }
                        }}
                        noLabel={true}
                        isManager={field.key === "manager"}
                        isHR={field.key === "assignedHr"}
                      />
                    ) : (
                      <MaterialModule.TextField
                        size="small"
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={
                          field.key === "midNo" &&
                          typeof editData[field.key] === "string" &&
                          editData[field.key].trim() === ""
                            ? String(
                                editData.employeeId ||
                                  editData.employeeCode ||
                                  editData.code ||
                                  editData.id ||
                                  "",
                              )
                            : field.type === 'number'
                            ? editData[field.key] !== null && editData[field.key] !== undefined
                              ? String(editData[field.key])
                              : ''
                            : editData[field.key] || ''
                        }
                        multiline={field.multiline || false}
                        rows={field.multiline ? 3 : 1}
                        disabled={
                          field.disabled ||
                          (editData?.aadhaarNumber &&
                            lockableFields.includes(field.key)) || (field.key == "emailAddress" && editData[field.key])
                        }
                        slotProps={{
                          htmlInput: {
                            ...(field.key === "aadhaarNumber" && field.type !== 'number'
                              ? { maxLength: 12 }
                              : {}),
                            ...(field.type === 'number' && {
                              step: 'any',
                            }),
                          },
                        }}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (field.type === 'number') {
                            if (raw === '') {
                              setEditData({ ...editData, [field.key]: null });
                              return;
                            }
                            const num = Number(raw);
                            if (!isNaN(num)) {
                              setEditData({ ...editData, [field.key]: num });
                            }
                          } else {
                            setEditData({ ...editData, [field.key]: raw });
                          }
                        }}
                        fullWidth
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-[12px] text-ellipsis overflow-hidden text-gray-800 mt-1">
                    {field.type === "date" && editData[field.key]
                      ? formatDate(editData[field.key])
                      : field.type === "boolean"
                        ? editData[field.key]
                          ? "Yes"
                          : "No"
                        : field.type === "select"
                          ? editData[field.key] || (isEditing ? "" : "-")
                          : field.type === "user"
                            ? editData[field.key2]
                            : editData[field.key] || "-"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <MaterialModule.Dialog
        open={relievingDialogOpen}
        onClose={() => setRelievingDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <div className="flex items-center justify-between border-b border-gray-300 p-2">
          <div className="text-gray-800 text-[12px] ml-4 font-medium">
            Deactivate Employee
          </div>
          <MaterialModule.IconButton
            onClick={() => setRelievingDialogOpen(false)}
          >
            <MaterialModule.CloseOutlined className="!text-gray-800" />
          </MaterialModule.IconButton>
        </div>
        <MaterialModule.DialogContent>
          <div className="text-[12px] text-gray-600 mb-5">
            Deactivate &quot;{data.name}&quot;? The employee will be marked inactive.
            All history (leave, payroll, onboarding) is retained and the employee
            can be reactivated later.
          </div>
          <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
            <DatePicker
              label="Relieving Date"
              value={relievingDate ? dayjs(relievingDate) : null}
              onChange={(newValue) =>
                setRelievingDate(
                  newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                )
              }
            />
          </LocalizationProvider>
          <MaterialModule.TextField
            label="Reason for Deactivate"
            value={adminRemarks}
            required
            multiline
            rows={3}
            onChange={(e: any) => setAdminRemarks(e.target.value)}
            className="!mt-5 !text-[12px]"
          />
        </MaterialModule.DialogContent>
        <MaterialModule.DialogActions className="!p-4 border-t !border-gray-300">
          <MaterialModule.Button
            onClick={() => setRelievingDialogOpen(false)}
            variant="outlined"
            className="!border-gray-300 !text-gray-800"
          >
            Cancel
          </MaterialModule.Button>
          <MaterialModule.Button
            onClick={async () => {
              await onDeactivate?.({
                ...editData,
                isActive: false,
                relievedDate: relievingDate,
                adminRemarks,
              });
              setRelievingDialogOpen(false);
              setRelievingDate("");
              setAdminRemarks("");
            }}
            variant="contained"
            disabled={!relievingDate || !adminRemarks}
            sx={{ bgcolor: "#ef4444", "&:hover": { bgcolor: "#dc2626" } }}
          >
            Deactivate
          </MaterialModule.Button>
        </MaterialModule.DialogActions>
      </MaterialModule.Dialog>
      <MaterialModule.Dialog
        open={attachmentDialogOpen}
        onClose={() => {
          setAttachmentDialogOpen(false);
          setAttachmentData({});
          setSelectedFile(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <div className="flex items-center justify-between border-b p-1">
          <div className="text-gray-800 font-medium pl-5">
            Upload Attachment
          </div>
          <MaterialModule.IconButton
            onClick={() => {
              setAttachmentDialogOpen(false);
              setAttachmentData({});
              setSelectedFile(null);
            }}
          >
            <MaterialModule.CloseOutlined />
          </MaterialModule.IconButton>
        </div>

        <MaterialModule.DialogContent>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {attachmentAddFields.map((field: any) => (
              <div key={field.key}>
                {field.type === "file" ? (
                  <>
                    <input
                      hidden
                      id="attachment-upload"
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setAttachmentData((prev: any) => ({
                            ...prev,
                            [field.key]: file,
                            documentName: file.name,
                          }));
                        }
                      }}
                    />

                    <label htmlFor="attachment-upload">
                      <MaterialModule.Button
                        component="span"
                        variant="outlined"
                        startIcon={<MaterialModule.AttachmentIcon />}
                      >
                        {selectedFile ? selectedFile.name : "Choose File"}
                      </MaterialModule.Button>
                    </label>

                    {selectedFile && (
                      <div className="text-xs text-gray-500 mt-1">
                        {(selectedFile.size / 1024).toFixed(2)} KB
                      </div>
                    )}
                  </>
                ) : field.type === "select" ? (
                  <DynamicSelectWithAdd
                    label={field.label}
                    title={field.label}
                    value={attachmentData[field.key] || ""}
                    onChange={(value) => {
                      const id = getOptionIdFromName(
                        field.key,
                        field.label,
                        value as string,
                      );

                      setAttachmentData((prev: any) => ({
                        ...prev,
                        [field.key]: value,
                        [`${field.key}Id`]: id,
                      }));
                    }}
                    options={getSelectOptions(field.key, field.label)}
                    onAddOption={(newOption) =>
                      handleAddOption(field.key, newOption)
                    }
                    showAddButton={isAdmin ? true : false}
                  />
                ) : (
                  <MaterialModule.TextField
                    label={field.label}
                    value={attachmentData[field.key] || ""}
                    onChange={(e) =>
                      setAttachmentData((prev: any) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                  />
                )}
              </div>
            ))}
          </div>
        </MaterialModule.DialogContent>
        <MaterialModule.DialogActions className="border-t !p-4">
          <MaterialModule.Button
            variant="outlined"
            className="!border-gray-300 !text-gray-800"
            onClick={() => {
              setAttachmentDialogOpen(false);
              setAttachmentData({});
              setSelectedFile(null);
            }}
          >
            Cancel
          </MaterialModule.Button>

          <MaterialModule.Button
            variant="contained"
            className="!bg-primary"
            onClick={() => {
              handleAddAttachment(attachmentData);
              setAttachmentDialogOpen(false);
            }}
          >
            Upload
          </MaterialModule.Button>
        </MaterialModule.DialogActions>
      </MaterialModule.Dialog>
    </div>
  );
};

// Editable Table Group Component
const EditableTableGroup = ({
  title,
  data,
  columns,
  onSave,
  onAdd,
  onDelete,
  icon,
  addDialogFields,
  categoryOptions,
  categories,
  refreshCategoryOptions,
  document,
  error,
  setIsSaving,
  onUnsavedChange,
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItemData, setNewItemData] = useState<any>({});
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isMasterTab = title === "Addresses";
  const [dialogFields, setDialogFields] = useState(addDialogFields);
  const { id } = useParams();
  const { session } = useAuth();
  const isAdmin = session?.user.roles.includes('ADMIN');
  const userId = session?.user.employeeId ? session?.user.employeeId : session?.user.userId;
  const apiId = isAdmin ? id : userId;

  const [dialogType, setDialogType] = useState<"add" | "edit" | "attachment">(
    "add",
  );

  const hasUnsavedChanges = isEditing && !isEqual(editData, data);
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (!isEditing || !hasUnsavedChanges) {
      setEditData(data);
    }
  }, [data, isEditing]);
  // 7022763777
  // jaikar.ss@bluechipssolutions.in

  useEffect(() => {
    if (isEditing && !isEditingRef.current) {
      setEditData(data);
      isEditingRef.current = true;
    } else if (!isEditing) {
      setEditData(data);
      isEditingRef.current = false;
    }
  }, [isEditing]);

  useEffect(() => {
    onUnsavedChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editData);
      setIsEditing(false);
      onUnsavedChange?.(false);
      setIsSaving(false);
    } catch (error) {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const userChoice = window.confirm(
        'You have unsaved changes in "' + title + '". Are you sure you want to cancel?'
      );
      if (!userChoice) {
        return;
      }
    }
    setEditData(data);
    setIsEditing(false);
    onUnsavedChange?.(false);
  };

  const handleCellChange = (rowIndex: number, field: string, value: any) => {
    setEditData((prev: any[]) => {
      const updated = [...prev];

      updated[rowIndex] = {
        ...updated[rowIndex],
        [field]: value,
      };

      return updated;
    });
  };

  const handleDeleteRow = (index: number) => {
    const rowToDelete = editData[index];
    if (rowToDelete?.id) {
      onDelete(rowToDelete.id);
    }
  };

  const handleAddClick = () => {
    setDialogType("add");

    setDialogFields(addDialogFields);
    const initialData: any = {};
    addDialogFields.forEach((field: any) => {
      initialData[field.key] = "";
    });
    setNewItemData(initialData);
    setAddDialogOpen(true);
  };

  const handleUploadAttachment = () => {
    setDialogType("attachment");
    setDialogFields(attachmentAddFields);
    const initialData: any = {};
    attachmentAddFields.forEach((field: any) => {
      initialData[field.key] = "";
    });
    setDialogFields(attachmentAddFields);
    setNewItemData(initialData);
    setAddDialogOpen(true);
  };

  const handleEditClick = (row: any) => {
    setDialogType("edit");
    setDialogFields(addDialogFields);
    setNewItemData({
      documentType: row.documentType,
      documentName: row.documentName,
    });
    setSelectedFile(null);
    setAddDialogOpen(true);
  };

  const handleAddConfirm = () => {
    onAdd(newItemData);
    setAddDialogOpen(false);
    setNewItemData({});
  };

  const getFieldOptions = (fieldKey: string, fieldLabel: string) => {
    const categoryName = getCategoryName(fieldKey, fieldLabel, categories);
    const category = Object.keys(categoryOptions).find(
      (catName) =>
        catName.toLowerCase() === categoryName.toLowerCase() ||
        catName.toLowerCase() === fieldKey.toLowerCase() ||
        catName.toLowerCase() === fieldLabel.toLowerCase() ||
        catName.toLowerCase().replace(/\s/g, "") === fieldKey.toLowerCase(),
    );
    const options = category ? categoryOptions[category] : [];
    return options.map((opt: any) => ({
      value: opt.id,
      label: opt.name,
    }));
  };

  const getSelectOptions = (fieldKey: string, fieldLabel: string) => {
    const categoryName = getCategoryName(fieldKey, fieldLabel, categories);
    const category = Object.keys(categoryOptions).find(
      (catName) =>
        catName.toLowerCase() === categoryName.toLowerCase() ||
        catName.toLowerCase() === fieldKey.toLowerCase() ||
        catName.toLowerCase() === fieldLabel.toLowerCase(),
    );
    let options = category ? categoryOptions[category] : [];
    if (fieldKey === "documentType") {
      if (document) {
        options = options.filter((opt: any) =>
          opt.name.toLowerCase().includes(document),
        );
      }
    }
    return options.map((opt: any) => opt.name);
  };

  const getOptionIdFromName = (
    fieldKey: string,
    fieldLabel: string,
    name: string,
  ) => {
    if (!name) return "";
    const options = getFieldOptions(fieldKey, fieldLabel);
    const option = options.find((opt: any) => opt.label === name);
    return option?.value || name;
  };

  const getOptionNameFromId = (fieldKey: string, value: string) => {
    if (!value) return "";
    if (fieldKey === "country" || fieldKey === "state" || fieldKey === "city") {
      let options: any[] = [];
      if (fieldKey === "country") {
        options = countries;
      } else if (fieldKey === "state") {
        options = Object.values(stateOptionsMap).flat();
      } else {
        options = Object.values(cityOptionsMap).flat();
      }
      const option = options.find((opt: any) => opt.id === value);

      return option?.name || "";
    } else {
      const options = getFieldOptions(fieldKey, "");
      const option = options.find((opt: any) => opt.value === value);
      return option?.label || value;
    }
  };

  const handleAddOption = async (fieldKey: string, newOption: string) => {
    try {
      showSpinner();
      const categoriesResponse: any = await categoryService.getCategories();
      const categories =
        categoriesResponse.data.content || categoriesResponse.data || [];
      const categoryName = getCategoryName(fieldKey, "", categories);
      const category = categories.find(
        (cat: any) =>
          cat.categoryName.toLowerCase() === categoryName.toLowerCase(),
      );
      if (!category) {
        showSnackbar(`Category "${categoryName}" not found`, "error");
        return;
      }
      const payload = {
        name: newOption,
        code: newOption.substring(0, 3).toUpperCase().replace(/\s/g, "_"),
        active: true,
      };
      await categoryService.createCategoryItem(category.id, payload);
      await refreshCategoryOptions();
      showSnackbar(`"${newOption}" added successfully!`, "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  // ====================== STATES ======================
  const [stateOptionsMap, setStateOptionsMap] = useState<any>({});
  const [cityOptionsMap, setCityOptionsMap] = useState<any>({});
  const { countries, loading, fetchStatesByCountry, fetchCitiesByState } =
    useMasterData(isMasterTab);

  // ====================== LOAD EXISTING DATA ======================
  const loadExistingMasterData = async () => {
    if (!editData?.length) return;
    const newStateMap: any = {};
    const newCityMap: any = {};
    for (let i = 0; i < editData.length; i++) {
      const row = editData[i];
      if (row.country && !stateOptionsMap[i]) {
        const statesData = await fetchStatesByCountry(row.country);
        newStateMap[i] = statesData || [];
      }
      if (row.state && !cityOptionsMap[i]) {
        const citiesData = await fetchCitiesByState(row.state);
        newCityMap[i] = citiesData || [];
      }
    }
    if (Object.keys(newStateMap).length > 0) {
      setStateOptionsMap((prev: any) => ({ ...prev, ...newStateMap }));
    }
    if (Object.keys(newCityMap).length > 0) {
      setCityOptionsMap((prev: any) => ({ ...prev, ...newCityMap }));
    }
  };

  useEffect(() => {
    loadExistingMasterData();
  }, [isEditing]);

  const handleMasterDataChange = async (
    rowIndex: any,
    key: string,
    value: string,
  ) => {
    if (rowIndex !== undefined) {
      if (key === "country" && value) {
        setEditData((prev: any[]) => {
          const updated = [...prev];
          updated[rowIndex] = {
            ...updated[rowIndex],
            country: value,
            state: "",
            city: "",
          };
          return updated;
        });
        const statesData = await fetchStatesByCountry(value);
        setStateOptionsMap((prev: any) => ({
          ...prev,
          [rowIndex]: statesData || [],
        }));
        setCityOptionsMap((prev: any) => ({
          ...prev,
          [rowIndex]: [],
        }));
        return;
      }
      if (key === "state" && value) {
        setEditData((prev: any[]) => {
          const updated = [...prev];
          updated[rowIndex] = {
            ...updated[rowIndex],
            state: value,
            city: "",
          };
          return updated;
        });
        const citiesData = await fetchCitiesByState(value);
        setCityOptionsMap((prev: any) => ({
          ...prev,
          [rowIndex]: citiesData || [],
        }));
        return;
      }
      setEditData((prev: any[]) => {
        const updated = [...prev];
        updated[rowIndex] = {
          ...updated[rowIndex],
          [key]: value,
        };
        return updated;
      });
      return;
    } else {
      if (key === "country" && value) {
        setNewItemData((prev: any) => ({
          ...prev,
          country: value,
          state: "",
          city: "",
        }));
        const statesData = await fetchStatesByCountry(value);
        setStateOptionsMap((prev: any) => ({
          ...prev,
          new: statesData || [],
        }));
        setCityOptionsMap((prev: any) => ({
          ...prev,
          new: [],
        }));
        return;
      }
      if (key === "state" && value) {
        setNewItemData((prev: any) => ({
          ...prev,
          state: value,
          city: "",
        }));
        const citiesData = await fetchCitiesByState(value);
        setCityOptionsMap((prev: any) => ({
          ...prev,
          new: citiesData || [],
        }));
        return;
      }
      setNewItemData((prev: any) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  const handleAddAttachment = async (newItem: any) => {
    setAddDialogOpen(false);
    setSelectedFile(null);
    showSpinner();
    try {
      if (!newItem.documentType) {
        showSnackbar("Document Type is Mandatory", "warning");
        return;
      }
      await employeeService.addAttachment(apiId, newItem);
      showSnackbar("Attachment added successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to add attachment", "error");
    } finally {
      hideSpinner();
    }
  };

  const tablesx = {
    padding: !isEditing ? "8px 16px !important" : "2px 2px 2px 16px !important",
  };

  return (
    <div className="p-4 border rounded-lg mt-3 shadow-sm border-gray-300">
      {!data ||
        (data.length === 0 && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="font-semibold flex items-center gap-2">
                <div className="bg-primary-50 p-1 rounded-lg !text-primary">
                  {" "}
                  {icon}{" "}
                </div>
                <div className="text-primary-dark "> {title} </div>
                {isEditing && hasUnsavedChanges && (
                  <Chip label="Unsaved" size="small" color="warning" className="ml-2" />
                )}
                {error &&
                  <span className="text-[12px] bg-red-100 p-1 rounded-md text-red-500">{error}</span>
                }
              </div>
              {(isAdmin || (!isAdmin && title !== "Training Details" && title !== "PF Details")) && (
                <MaterialModule.Button
                  startIcon={
                    <MaterialModule.AddIcon
                      sx={{ color: "var(--color-primary)" }}
                    />
                  }
                  size="small"
                  onClick={handleAddClick}
                  variant="outlined"
                  sx={{
                    color: "var(--color-primary)",
                    borderColor: "var(--color-primary)",
                  }}
                >
                  Add {title}
                </MaterialModule.Button>
              )}
            </div>
            <div className="text-center text-gray-500 py-4">
              No {title.toLowerCase()} found
            </div>
          </div>
        ))}
      {data && data.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold flex items-center gap-2">
              <div className="bg-primary-50 p-1 rounded-lg !text-primary">
                {" "}
                {icon}{" "}
              </div>
              <div className="text-primary-dark "> {title} </div>
              {isEditing && hasUnsavedChanges && (
                <Chip label="Unsaved" size="small" color="warning" className="ml-2" />
              )}
              {error &&
                <span className="text-[12px] bg-red-100 p-1 rounded-md text-red-500">{error}</span>
              }
            </div>
            <div className="flex gap-1">
              {!isEditing ? (
                <>
                  <div className="flex items-center gap-1 border border-gray-300 rounded">
                    {document && (
                      <>
                        <MaterialModule.Tooltip title="Add Attachments">
                          <MaterialModule.IconButton
                            size="small"
                            onClick={() => handleUploadAttachment()}
                          >
                            <AttachFileOutlined
                              fontSize="small"
                              className="text-gray-800 !w-4"
                            />
                          </MaterialModule.IconButton>
                        </MaterialModule.Tooltip>
                        <div className="border-l border-gray-300 h-5" />
                      </>
                    )}
                    <MaterialModule.Tooltip title="Add">
                      <MaterialModule.Button
                        size="small"
                        onClick={handleAddClick}
                        className="!min-w-0"
                      >
                        <MaterialModule.AddIcon
                          fontSize="small"
                          className="text-gray-800"
                        />
                      </MaterialModule.Button>
                    </MaterialModule.Tooltip>

                    {title != "Attachments" && (
                      <>
                        <div className="border-l border-gray-300 h-5" />
                        <MaterialModule.Tooltip title="Edit">
                          <MaterialModule.Button
                            size="small"
                            onClick={() => setIsEditing(true)}
                            className="!min-w-0"
                          >
                            <MaterialModule.EditIcon
                              fontSize="small"
                              className="text-gray-800 !w-3.5"
                            />
                          </MaterialModule.Button>
                        </MaterialModule.Tooltip>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {document && (
                    <MaterialModule.Tooltip title="Add Attachments">
                      <MaterialModule.IconButton
                        size="small"
                        onClick={() => handleUploadAttachment()}
                      >
                        <AttachFileOutlined
                          fontSize="small"
                          className="text-gray-800 !w-4"
                        />
                      </MaterialModule.IconButton>
                    </MaterialModule.Tooltip>
                  )}
                  <MaterialModule.Tooltip title="Save Changes">
                    <MaterialModule.IconButton
                      size="small"
                      onClick={handleSave}
                      color="primary"
                    >
                      <MaterialModule.SaveIcon fontSize="small" />
                    </MaterialModule.IconButton>
                  </MaterialModule.Tooltip>

                  <MaterialModule.Tooltip title="Cancel">
                    <MaterialModule.IconButton
                      size="small"
                      onClick={handleCancel}
                      color="error"
                    >
                      <MaterialModule.CancelIcon fontSize="small" />
                    </MaterialModule.IconButton>
                  </MaterialModule.Tooltip>
                </>
              )}
            </div>
          </div>

          <div>
            <MaterialModule.TableContainer
              component={MaterialModule.Paper}
              elevation={0}
              className="border border-gray-200 w-max"
            >
              <MaterialModule.Table>
                <MaterialModule.TableHead className="bg-gray-100">
                  <MaterialModule.TableRow>
                    <MaterialModule.TableCell
                      sx={{
                        ...stickyHeaderLeftSx,
                        minWidth: "70px",
                      }}
                    >
                      S No
                    </MaterialModule.TableCell>
                    {columns.map((col: any) => (
                      <MaterialModule.TableCell
                        key={col.key}
                        sx={{
                          background: "#f3f4f6",
                          minWidth: "180px",
                        }}
                      >
                        {col.label}
                      </MaterialModule.TableCell>
                    ))}
                    {(isEditing || title == "Attachments") && (
                      <MaterialModule.TableCell
                        sx={{
                          ...stickyHeaderRightSx,
                          minWidth: "100px",
                        }}
                      >
                        Actions
                      </MaterialModule.TableCell>
                    )}
                  </MaterialModule.TableRow>
                </MaterialModule.TableHead>
                <MaterialModule.TableBody className="bg-white-50" >
                  {editData.map((row: any, rowIndex: number) => (
                    <MaterialModule.TableRow onKeyDown={handleEnterAsTab}
                      key={row.id || rowIndex}
                      sx={getRowColor(rowIndex)}
                    >
                      <MaterialModule.TableCell
                        sx={{
                          ...tablesx,
                          ...getStickyLeftSx(rowIndex),
                          minWidth: "70px",
                        }}
                      >
                        {rowIndex + 1}
                      </MaterialModule.TableCell>
                      {columns.map((col: any) => (
                        <MaterialModule.TableCell
                          key={col.key}
                          className="!text-gray-800"
                          sx={{
                            ...tablesx,
                            minWidth: "180px",
                          }}
                        >
                          {isEditing ? (
                            <div>
                              {
                                col.type === "select" ? (
                                  <DynamicSelectWithAdd
                                    label=""
                                    title={col.label}
                                    value={
                                      col.options
                                        ? col.options.find(
                                          (opt: string) =>
                                            opt.toLowerCase() ===
                                            String(row[col.key]).toLowerCase(),
                                        ) || ""
                                        : getOptionNameFromId(
                                          col.key,
                                          row[col.key],
                                        ) || ""
                                    }
                                    onChange={(value) => {
                                      if (col.options) {
                                        handleCellChange(rowIndex, col.key, value);
                                      } else {
                                        const id = getOptionIdFromName(
                                          col.key,
                                          col.label,
                                          value as string,
                                        );
                                        handleCellChange(rowIndex, col.key, id);
                                      }
                                    }}
                                    options={
                                      col.options
                                        ? col.options
                                        : getSelectOptions(col.key, col.label)
                                    }
                                    onAddOption={(newOption) =>
                                      handleAddOption(col.key, newOption)
                                    }
                                    showAddButton={
                                      (col.key == "nomineeName" || col.options || !isAdmin)
                                        ? false
                                        : true
                                    }
                                    sx={{
                                      ...commonSx,
                                      "& .MuiSelect-select": {
                                        padding: "5px !important",
                                        width: "150px !important",
                                      },
                                    }}
                                  />
                                ) : col.type === "date" ? (
                                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                                    <DatePicker
                                      value={
                                        row[col.key]
                                          ? dayjs(row[col.key])
                                          : null
                                      }

                                      onChange={(e) =>
                                        handleCellChange(
                                          rowIndex,
                                          col.key,
                                          e ? dayjs(e).format("YYYY-MM-DD") : "",
                                        )
                                      }
                                      className="bg-white-50"
                                      slotProps={{
                                        textField: {
                                          fullWidth: true, size: "small", sx: {
                                            "& .MuiPickersSectionList-root": {
                                              padding: "4px !important",

                                            },
                                          },
                                        },
                                      }}
                                      sx={{
                                        ...commonSx,
                                        "& .MuiInputLabel-root": {
                                          top: 0,
                                        },
                                      }}
                                    />
                                  </LocalizationProvider>
                                ) : col.type === "boolean" ? (
                                  <MaterialModule.FormControlLabel
                                    control={
                                      <MaterialModule.Switch
                                        checked={row[col.key] || false}
                                        onChange={(e) =>
                                          handleCellChange(
                                            rowIndex,
                                            col.key,
                                            e.target.checked,
                                          )
                                        }
                                        className="text-gray-800"
                                      />
                                    }
                                    label=""
                                  />
                                ) : col.type === "master-select" ? (
                                  <MasterSelect
                                    type={col.key}
                                    countries={countries}
                                    states={stateOptionsMap[rowIndex] || []}
                                    cities={cityOptionsMap[rowIndex] || []}
                                    value={row[col.key] || ""}
                                    onChange={(newValue: any) =>
                                      handleMasterDataChange(
                                        rowIndex,
                                        col.key,
                                        newValue,
                                      )
                                    }
                                    disabled={loading}
                                    sx={commonSx}
                                  />
                                ) : (
                                  <MaterialModule.TextField
                                    size="small"
                                    type={col.type === 'number' ? 'number' : 'text'}
                                    value={
                                      col.type === 'number'
                                        ? row[col.key] !== null && row[col.key] !== undefined
                                          ? String(row[col.key])
                                          : ''
                                        : row[col.key] || ''
                                    }
                                    onChange={(e) => {
                                      let raw = e.target.value;
                                      if (col.type === 'number') {
                                        if (raw === '') {
                                          handleCellChange(rowIndex, col.key, null);
                                          return;
                                        }
                                        const num = Number(raw);
                                        if (!isNaN(num)) {
                                          handleCellChange(rowIndex, col.key, num);
                                        }
                                      } else {
                                        handleCellChange(rowIndex, col.key, raw);
                                      }
                                    }}
                                    fullWidth
                                    variant="outlined"
                                    slotProps={{
                                      input: {
                                        ...(col.type === 'number' && {
                                          step: 'any',
                                        }),
                                      }
                                    }}

                                    sx={{
                                      "& .MuiInputBase-root": {
                                        fontSize: "12px",
                                        minHeight: "auto",
                                      },
                                      "& .MuiInputBase-input": {
                                        padding: "5px",
                                      },
                                    }}
                                  />
                                )
                              }
                            </div>
                          ) : (
                            <span className="text-[13px]">
                              {col.type === "link" && row[col.key] ? (
                                <a
                                  href={row[col.key]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  View File
                                </a>
                              ) : col.type === "date" && row[col.key] ? (
                                formatDate(row[col.key])
                              ) : col.type === "boolean" ? (
                                row[col.key] ? (
                                  <span className="text-green-500">Yes</span>
                                ) : (
                                  <span className="text-red-500">No</span>
                                )
                              ) : col.type === "select" ||
                                col.type === "master-select" ? (
                                col.options ? (
                                  toTitleCase(row[col.key])
                                ) : (
                                  getOptionNameFromId(col.key, row[col.key])
                                )
                              ) : (
                                row[col.key] || "-"
                              )}
                            </span>
                          )}
                        </MaterialModule.TableCell>
                      ))}
                      {isEditing ? (
                        <MaterialModule.TableCell
                          sx={{
                            ...tablesx,
                            ...getStickyRightSx(rowIndex),
                            minWidth: "50px",
                          }}
                        >
                          <MaterialModule.IconButton
                            size="small"
                            onClick={() => handleDeleteRow(rowIndex)}
                            color="error"
                          >
                            <MaterialModule.DeleteIcon fontSize="small" />
                          </MaterialModule.IconButton>
                        </MaterialModule.TableCell>
                      ) : null}
                      {title == "Attachments" && (
                        <MaterialModule.TableCell
                          sx={{
                            ...tablesx,
                            ...getStickyRightSx(rowIndex),
                            minWidth: "50px",
                          }}
                        >
                          <MaterialModule.IconButton
                            size="small"
                            onClick={() => {
                              handleEditClick(row);
                            }}
                            color="primary"
                          >
                            <MaterialModule.EditIcon fontSize="small" />
                          </MaterialModule.IconButton>
                          <MaterialModule.IconButton
                            size="small"
                            onClick={() => handleDeleteRow(rowIndex)}
                            color="error"
                          >
                            <MaterialModule.DeleteIcon fontSize="small" />
                          </MaterialModule.IconButton>
                        </MaterialModule.TableCell>
                      )}
                    </MaterialModule.TableRow>
                  ))}
                </MaterialModule.TableBody>
              </MaterialModule.Table>
            </MaterialModule.TableContainer>
          </div>
        </div>
      )}

      <MaterialModule.Dialog
        open={addDialogOpen}
        onClose={() => {
          setAddDialogOpen(false);
          setSelectedFile(null);
          setNewItemData({});
        }}
        maxWidth="sm"
        sx={commonsx}
      >
        <div className="text-gray-800 !border-b !p-2 flex items-center justify-between !border-gray-200">
          <span className="ml-4 text-[12px]">
            {dialogType === "attachment"
              ? "Upload Document"
              : dialogType === "edit"
                ? `Edit ${title}`
                : `Add ${title}`}
          </span>
          <MaterialModule.IconButton
            onClick={() => {
              setAddDialogOpen(false);
              setSelectedFile(null);
              setNewItemData({});
            }}
          >
            <MaterialModule.CloseOutlined className="text-gray-800" />
          </MaterialModule.IconButton>
        </div>
        <MaterialModule.DialogContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5" onKeyDown={handleEnterAsTab}>
            {dialogFields.map((field: any) => (
              <div key={field.key} className={field.multiline || field.full ? "md:col-span-2" : "w-[220px]"}>
                {field.type === "date" ? (
                  <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                    <DatePicker
                      label={field.label}
                      value={
                        newItemData[field.key]
                          ? dayjs(newItemData[field.key])
                          : null
                      }
                      onChange={(e) =>
                        setNewItemData({
                          ...newItemData,
                          [field.key]: e ? dayjs(e).format("YYYY-MM-DD") : "",
                        })
                      }
                      slotProps={{
                        textField: { fullWidth: true, size: "small" },
                      }}
                      sx={{
                        "& .MuiInputLabel-root": {
                          top: 0,
                        },
                      }}
                    />
                  </LocalizationProvider>
                ) : field.type === "select" ? (
                  <DynamicSelectWithAdd
                    label={field.label}
                    value={
                      field.options
                        ? field.options.find(
                          (opt: string) =>
                            opt.toLowerCase() ===
                            String(
                              newItemData[field.key] || "",
                            ).toLowerCase(),
                        ) || ""
                        : getOptionNameFromId(
                          field.key,
                          newItemData[field.key],
                        ) || ""
                    }
                    onChange={(value) => {
                      if (field.options) {
                        setNewItemData({
                          ...newItemData,
                          [field.key]: value,
                        });
                      } else {
                        const id = getOptionIdFromName(
                          field.key,
                          field.label,
                          value as string,
                        );
                        setNewItemData({
                          ...newItemData,
                          [field.key]: id,
                        });
                      }
                    }}
                    options={
                      field.options
                        ? field.options
                        : getSelectOptions(field.key, field.label)
                    }
                    onAddOption={(newOption) =>
                      handleAddOption(field.key, newOption)
                    }
                    showAddButton={
                      (field.key == "nomineeName" || field.options || !isAdmin) ? false : true
                    }
                    required={field.required}
                  />
                ) : field.type === "boolean" ? (
                  <MaterialModule.FormControlLabel
                    control={
                      <MaterialModule.Switch
                        checked={newItemData[field.key] || false}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            [field.key]: e.target.checked,
                          })
                        }
                      />
                    }
                    label="Primary"
                    className="!text-gray-800"
                  />
                ) : field.type === "master-select" ? (
                  <MasterSelect
                    type={field.key}
                    countries={countries}
                    states={stateOptionsMap["new"] || []}
                    cities={cityOptionsMap["new"] || []}
                    value={newItemData[field.key] || ""}
                    onChange={(newValue: any) =>
                      handleMasterDataChange(undefined, field.key, newValue)
                    }
                    disabled={loading}
                    label={field.label}
                    sx={masterSx}
                  />
                ) : field.type === "file" ? (
                  <>
                    <input
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                      style={{ display: "none" }}
                      id={`file-upload-${field.key}`}
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewItemData({
                            ...newItemData,
                            [field.key]: file,
                            documentName: file.name,
                          });
                          setSelectedFile(file);
                        }
                      }}
                    />
                    <label htmlFor={`file-upload-${field.key}`}>
                      <MaterialModule.Button
                        variant="outlined"
                        component="span"
                        fullWidth
                        startIcon={<MaterialModule.AttachmentIcon />}
                      >
                        {selectedFile ? selectedFile.name : "Choose File"}
                      </MaterialModule.Button>
                    </label>
                    {selectedFile && (
                      <div className="mt-2 text-[12px]">
                        Size: {(selectedFile.size / 1024).toFixed(2)} KB
                      </div>
                    )}
                  </>
                ) : (
                  <MaterialModule.TextField
                    fullWidth
                    size="small"
                    type={field.type === 'number' ? 'number' : 'text'}
                    multiline={field.multiline || false}
                    rows={field.multiline ? 3 : 0}
                    disabled={field.disabled}
                    label={field.label}
                    value={
                      field.type === 'number'
                        ? newItemData[field.key] !== null && newItemData[field.key] !== undefined
                          ? String(newItemData[field.key])
                          : ''
                        : newItemData[field.key] || ''
                    }
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (field.type === 'number') {
                        if (raw === '') {
                          setNewItemData({ ...newItemData, [field.key]: null });
                          return;
                        }
                        const num = Number(raw);
                        if (!isNaN(num)) {
                          setNewItemData({ ...newItemData, [field.key]: num });
                        }
                      } else {
                        setNewItemData({ ...newItemData, [field.key]: raw });
                      }
                    }}
                    slotProps={{
                      htmlInput: {
                        ...(field.type === 'number' && {
                          step: 'any',
                        }),
                      },
                    }}
                    sx={{
                      "& .MuiInputLabel-root": {
                        top: 0,
                      },
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </MaterialModule.DialogContent>
        <MaterialModule.DialogActions className="!p-3 !border-t !border-gray-200">
          <MaterialModule.Button
            onClick={() => {
              setAddDialogOpen(false);
              setSelectedFile(null);
              setNewItemData({});
            }}
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
          >
            Cancel
          </MaterialModule.Button>
          <MaterialModule.Button
            onClick={() => {
              if (dialogType === "attachment") {
                handleAddAttachment(newItemData);
              } else {
                handleAddConfirm();
              }
            }}
            variant="contained"
            className="!bg-primary"
          >
            {dialogType === "attachment"
              ? "Upload"
              : dialogType === "edit"
                ? "Update"
                : "Add"}
          </MaterialModule.Button>
        </MaterialModule.DialogActions>
      </MaterialModule.Dialog>
    </div>
  );
};

export default function EmployeeDetails() {
  const { session } = useAuth();
  const { id } = useParams();
  const isAdmin = session?.user.roles.includes('ADMIN');
  const isUser = session?.user.roles.includes('EMPLOYEE') || session?.user.roles.includes('MANAGER');
  const userId = session?.user.employeeId ? session?.user.employeeId : session?.user.userId;
  const apiId = isAdmin ? id : userId;

  const navigate = useNavigate();
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [employee, setEmployee] = useState<any>();
  const [tabValue, setTabValue] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<Record<string, any[]>>(
    {},
  );
  const [categories, setCategories] = useState<Record<string, any[]>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [initialEmployee, setInitialEmployee] = useState<any>(null);
  const [hasChildUnsavedChanges, setHasChildUnsavedChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const hasUnsavedChanges = !isEqual(employee, initialEmployee) || hasChildUnsavedChanges;

  const handleChildUnsavedChange = (hasUnsaved: boolean) => {
    setHasChildUnsavedChanges(hasUnsaved);
  };

  useEffect(() => {
    if (!hasUnsavedChanges) {
      setHasChildUnsavedChanges(false);
    }
  }, [employee]);

  const handleSaveForNavigation = async (callback?: () => void): Promise<void> => {
    if (hasUnsavedChanges) {
      const userChoice = window.confirm(
        'You have unsaved changes. Do you want to save before leaving?'
      );
      if (userChoice) {
        showSnackbar('Please save each section individually before leaving.', 'warning');
        if (callback) callback();
        return;
      }
    }
    if (callback) callback();
  };

  useUnsavedChanges({
    hasUnsavedChanges: hasUnsavedChanges && !isSaving,
    onSave: handleSaveForNavigation,
    message: 'You have unsaved employee data. Do you want to save before leaving?'
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !isSaving) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, isSaving]);

  // Policy tab state
  const [empPolicies, setEmpPolicies] = useState<any[]>([]);
  const [empPolicyHistory, setEmpPolicyHistory] = useState<any[]>([]);
  const [effectivePolicies, setEffectivePolicies] = useState<
    Record<string, any>
  >({});
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policySection, setPolicySection] = useState<
    "effective" | "assigned" | "history"
  >("effective");

  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);

  const [uanError, setUANError] = useState("");
  const [webcamOpen, setWebcamOpen] = useState(false);
  const [checkIn, setCheckIn] = useState(false);

  const tabs = [
    { label: "Personal Info", icon: <MaterialModule.Person2Outlined /> },
    { label: "Addresses", icon: <MaterialModule.LocationIcon /> },
    { label: "Qualifications", icon: <MaterialModule.SchoolIcon /> },
    { label: "Employee Details", icon: <MaterialModule.Person2TwoTone /> },
    { label: "Training Details", icon: <MaterialModule.AccountBalanceIcon /> },
    { label: "Previous Employment", icon: <MaterialModule.WorkHistoryIcon /> },
    {
      label: "Identification Details",
      icon: <MaterialModule.WorkHistoryIcon />,
    },
    { label: "Family Details", icon: <MaterialModule.FamilyIcon /> },
    { label: "Nominations", icon: <MaterialModule.AccountBalanceIcon /> },
    { label: "Attachments", icon: <MaterialModule.AttachmentIcon /> },
    { label: "Policies", icon: <PolicyIcon /> },
  ];

  const fetchEmployeeAttendance = async (uid: any) => {
    try {
      const res: any = await attendanceService.getEmployeeAttendance(uid, {
        fromDate: dayjs().format('YYYY-MM-DD'),
        toDate: dayjs().format('YYYY-MM-DD')
      });
      const data = res.data.length ? res.data[0] : "";
      if (data.status == 'checked_in') {
        setCheckIn(true);
      }
    } catch {
      showSnackbar("Failed to load attendance records", "error");
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      fetchEmployeeAttendance(apiId);
    }
  }, []);

  const handleWebcamCapture = async (file: File) => {
    try {
      showSpinner();
      await employeeService.uploadPhoto(employee.id, file);
      showSnackbar("Profile photo uploaded successfully", "success");
      await fetchEmployeeDetails();
    } catch (error: any) {
      showSnackbar(error.message || "Failed to upload photo", "error");
    } finally {
      hideSpinner();
    }
  };

  const viewPolicyConfig = (policy: any) => {
    setSelectedPolicy(policy);
    setConfigDialogOpen(true);
  };

  const fetchEmployeeDetails = async () => {
    showSpinner();
    try {
      const response: any = await employeeService.getEmployeeById(apiId);
      const employeeData = response.data;
      const normalizedEmployeeData = withMidNoFallback(employeeData);
      setEmployee(normalizedEmployeeData);
      setInitialEmployee(normalizedEmployeeData);
    } catch (error: any) {
      showSnackbar(error.message || "Failed to load employee details", "error");
      navigate("/employees");
    } finally {
      hideSpinner();
    }
  };

  const fetchCategoryOptions = async () => {
    try {
      const response: any = await categoryService.getActiveCategoryItem();
      const categories = response.data.content || response.data || [];
      setCategories(categories);
      const optionsMap: Record<string, any[]> = {};
      for (const category of categories) {
        optionsMap[category.categoryName] = category.items || [];
      }
      setCategoryOptions(optionsMap);
    } catch (error) {
      console.error("Failed to fetch category options:", error);
    }
  };

  useEffect(() => {
    if (apiId) {
      fetchEmployeeDetails();
      fetchCategoryOptions();
    }
  }, [apiId]);

  useEffect(() => { }, [categoryOptions]);

  const fetchLogs = async () => {
    showSpinner();
    try {
      const res: any = await auditLogService.getAuditHistory(String(id));
      setAuditLogs(res.data?.content || res.data || []);
      setAuditLogOpen(true);
    } catch (err: any) {
      showSnackbar(err.message || "Failed to load audit logs", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleOpenAuditLog = async () => {
    await fetchLogs();
  };

  // ==================== PATCH UPDATES ====================
  //BASIC INFO
  const updatePersonalInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload: any = {
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        nickName: updatedData.nickName,
        genderId: updatedData.genderId,
        birthday: updatedData.birthday,
        mobileNumber: updatedData.mobileNumber,
        emailAddress: updatedData.emailAddress,
        personalEmailAddress: updatedData.personalEmailAddress,
        bloodGroupId: updatedData.bloodGroupId,
        nationalityId: updatedData.nationalityId,
        religionId: updatedData.religionId,
        maritalStatusId: updatedData.maritalStatusId,
        marriageDate: updatedData.marriageDate,
        spouseName: updatedData.spouseName,
        height: Number(updatedData.height),
        weight: Number(updatedData.weight),
        identificationMark: updatedData.identificationMark,
        hobbies: updatedData.hobbies,
        languagesKnown: updatedData.languagesKnown,
        physicallyChallenged: updatedData.physicallyChallenged,
        internationalEmployee: updatedData.internationalEmployee,
        disabilityTypeId: updatedData.disabilityTypeId,
        employeeStatusId: updatedData.employeeStatusId,
        designationId: updatedData.designationId,
        gradeId: updatedData.gradeId,
        empTypeId: updatedData.empTypeId,
        departmentId: updatedData.departmentId,
        branchId: updatedData.branchId,
        managerId: updatedData.managerId,
        bandId: updatedData.bandId,
        joiningDate: updatedData.joiningDate,
        confirmationDate: updatedData.confirmationDate,
        probationPeriod: Number(updatedData.probationPeriod),
        noticePeriod: Number(updatedData.noticePeriod),
        attendanceSchemaId: updatedData.attendanceSchemaId,
        vehicleTypeId: updatedData.vehicleTypeId,
        hostel: updatedData.hostel,
        referredBy: updatedData.referredBy,
        bonusPolicyId: updatedData.bonusPolicyId,
        otPolicyId: updatedData.otPolicyId,
        otAmount: updatedData.otAmount,
        vehicleFacility: updatedData.vehicleFacility,
        migrant: updatedData.migrant,
        exService: updatedData.exService,
        monthly: updatedData.monthly,
        adminRemarks: updatedData.adminRemarks,
        idCardNo: updatedData.idCardNo,
        midNo: withMidNoFallback(updatedData).midNo,
        oldIdNo: updatedData.oldIdNo,
        isActive: updatedData.isActive,
        relievedDate: updatedData.relievedDate,
        pfEligible: updatedData.pfEligible,
        excessEpfEligible: updatedData.excessEpfEligible,
        excessEpsEligible: updatedData.excessEpsEligible,
        existingEpsMember: updatedData.existingEpsMember,
        esiEligible: updatedData.esiEligible,
        lwfCovered: updatedData.lwfCovered,
        backgroundCheckStatus: updatedData.backgroundCheckStatus,
        backgroundVerificationCompletedOn:
          updatedData.backgroundVerificationCompletedOn
            ? new Date(
              updatedData.backgroundVerificationCompletedOn,
            ).toISOString()
            : null,
        backgroundVerificationIndicator:
          updatedData.backgroundVerificationIndicator,
        agencyName: updatedData.agencyName,
        backgroundCheckRemarks: updatedData.backgroundCheckRemarks,
        bankAccountNumber: updatedData.bankAccountNumber,
        bankName: updatedData.bankName,
        bankBranch: updatedData.bankBranch,
        ifscCode: updatedData.ifscCode,
        nameAsPerBankRecords: updatedData.nameAsPerBankRecords,
        bankAccountTypeId: updatedData.bankAccountTypeId,
        ddPayableAt: updatedData.ddPayableAt,
        salaryPaymentModeId: updatedData.salaryPaymentModeId,
        salaryTypeId: updatedData.salaryTypeId,
        iban: updatedData.iban,
        panNumber: updatedData.panNumber,
        aadhaarEnrolmentNo: updatedData.aadhaarEnrolmentNo,
        nameAsOnAadhaar: updatedData.nameAsOnAadhaar,
        aadhaarNumber: updatedData.aadhaarNumber,
        universalAccountNumber: updatedData.universalAccountNumber,
        pranNumber: updatedData.pranNumber,
        nameAsPerPran: updatedData.nameAsPerPran,
        passportNumber: updatedData.passportNumber,
        visaType: updatedData.visaType,
        visaExpiry: updatedData.visaExpiry,
        loginIpAddress: updatedData.loginIpAddress,
        loginUserName: updatedData.loginUserName,
        nameInPan: updatedData.nameInPan,
        nameInPassport: updatedData.nameInPassport,
        placeOfIssue: updatedData.placeOfIssue,
        dateOfIssue: updatedData.dateOfIssue,
        expiryDate: updatedData.expiryDate,
        insuranceNumber: updatedData.insuranceNumber,
        nameInInsurance: updatedData.nameInInsurance,
        insuranceValidFrom: updatedData.insuranceValidFrom,
        insuranceValidTo: updatedData.insuranceValidTo,
        esiNumber: updatedData.esiNumber,
        esiJoiningDate: updatedData.esiJoiningDate,
        esiRelievingDate: updatedData.esiRelievingDate,
        template: updatedData.templateId,
      };
      if (!payload.aadhaarNumber) {
        payload['dateOfBirth'] = updatedData.dateOfBirth,
          payload['fathersName'] = updatedData.fathersName
      }
      if (Object.keys(payload).length) {
        await employeeService.updateEmployee(apiId, payload);
        await fetchEmployeeDetails();
        showSnackbar("Personal information updated successfully!", "success");
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleProfileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !employee?.id) return;
    try {
      showSpinner();
      await employeeService.uploadPhoto(employee.id, file);
      showSnackbar("Profile photo uploaded successfully", "success");
      fetchEmployeeDetails();
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  // Emergency Contacts
  const handleUpdateEmergencyContacts = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.emergencyContacts || [];
      for (const item of updatedData) {
        const originalItem = originalData.find(
          (orig: any) => orig.id === item.id,
        );
        if (
          originalItem &&
          JSON.stringify(originalItem) !== JSON.stringify(item)
        ) {
          const matchValue =
            originalItem.relationship == item.relationship &&
              originalItem.relationshipId == item.relationshipId
              ? originalItem.relationshipId
              : item.relationship;
          const updatedItem = {
            name: item.name,
            relationshipId: matchValue,
            phone: item.phone,
            alternatePhone: item.alternatePhone,
            email: item.email,
            address: item.address,
            primary: item.primary,
          };
          await employeeService.updateEmergencyContact(
            apiId,
            item.id,
            updatedItem,
          );
          await fetchEmployeeDetails();
        }
      }
      showSnackbar("Emergency contacts updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleAddEmergencyContact = async (newItem: any) => {
    showSpinner();
    try {
      newItem["relationshipId"] = newItem.relationship;
      delete newItem.relationship;
      await employeeService.addEmergencyContact(apiId, newItem);
      await fetchEmployeeDetails();
      showSnackbar("Emergency contact added successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteEmergencyContact = async (itemId: string) => {
    showConfirmDialog({
      title: "Delete Emergency Contact",
      message: "Are you sure you want to delete this emergency contact?",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeService.deleteEmergencyContact(apiId, itemId);
          await fetchEmployeeDetails();
          showSnackbar("Emergency contact deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // Addresses
  const handleUpdateAddresses = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.addresses || [];
      for (const item of updatedData) {
        const originalItem = originalData.find(
          (orig: any) => orig.id === item.id,
        );
        if (
          originalItem &&
          JSON.stringify(originalItem) !== JSON.stringify(item)
        ) {
          const updatedItem = {
            addressType: item.addressType,
            addressLine1: item.addressLine1,
            addressLine2: item.addressLine2,
            city: item.city,
            state: item.state,
            country: item.country,
            pincode: item.pincode,
            primary: item.primary,
            village: item.village,
            street: item.street,
            taluk: item.taluk,
            district: item.district,
          };
          await employeeService.updateAddress(apiId, item.id, updatedItem);
          await fetchEmployeeDetails();
        }
      }
      showSnackbar("Addresses updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update addresses", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleAddAddress = async (newItem: any) => {
    showSpinner();
    try {
      await employeeService.addAddress(apiId, newItem);
      await fetchEmployeeDetails();
      showSnackbar("Address added successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteAddress = async (itemId: string) => {
    showConfirmDialog({
      title: "Delete Address",
      message: "Are you sure you want to delete this address?",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeService.deleteAddress(apiId, itemId);
          await fetchEmployeeDetails();
          showSnackbar("Address deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // Qualifications
  const handleUpdateQualifications = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.qualifications || [];
      for (const item of updatedData) {
        const originalItem = originalData.find(
          (orig: any) => orig.id === item.id,
        );
        if (
          originalItem &&
          JSON.stringify(originalItem) !== JSON.stringify(item)
        ) {
          const matchValue =
            originalItem.qualificationType == item.qualificationType &&
              originalItem.qualificationTypeId == item.qualificationTypeId
              ? originalItem.qualificationTypeId
              : item.qualificationType;
          const matchValue1 =
            originalItem.qualificationArea == item.qualificationArea &&
              originalItem.qualificationAreaId == item.qualificationAreaId
              ? originalItem.qualificationAreaId
              : item.qualificationArea;
          const updatedItem = {
            qualificationTypeId: matchValue,
            qualificationAreaId: matchValue1,
            institution: item.institution,
            boardUniversity: item.boardUniversity,
            yearOfPassing: Number(item.yearOfPassing),
            percentage: Number(item.percentage),
            grade: item.grade,
          };
          await employeeService.updateQualification(apiId, item.id, updatedItem);
          await fetchEmployeeDetails();
        }
      }
      showSnackbar("Qualifications updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleAddQualification = async (newItem: any) => {
    showSpinner();
    try {
      newItem.percentage = Number(newItem.percentage);
      newItem.yearOfPassing = Number(newItem.yearOfPassing);
      newItem.qualificationTypeId = newItem.qualificationType;
      newItem.qualificationAreaId = newItem.qualificationArea;

      delete newItem.qualificationType;
      delete newItem.qualificationArea;

      await employeeService.addQualification(apiId, newItem);
      await fetchEmployeeDetails();
      showSnackbar("Qualification added successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteQualification = async (itemId: string) => {
    showConfirmDialog({
      title: "Delete Qualification",
      message: "Are you sure you want to delete this qualification?",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeService.deleteQualification(apiId, itemId);
          await fetchEmployeeDetails();
          showSnackbar("Qualification deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  //ADMIN INFO
  const updateAdminInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        employeeStatusId: updatedData.employeeStatusId,
        designationId: updatedData.designationId,
        gradeId: updatedData.gradeId,
        empTypeId: updatedData.empTypeId,
        departmentId: updatedData.departmentId,
        branchId: updatedData.branchId,
        managerId: updatedData.managerId,
        assignedHrId: updatedData.assignedHrId,
        bandId: updatedData.bandId,
        joiningDate: updatedData.joiningDate,
        confirmationDate: updatedData.confirmationDate,
        probationPeriod: Number(updatedData.probationPeriod),
        noticePeriod: Number(updatedData.noticePeriod),
        attendanceSchemaId: updatedData.attendanceSchemaId,
        vehicleTypeId: updatedData.vehicleTypeId,
        hostel: updatedData.hostel,
        referredBy: updatedData.referredBy,
        bonusPolicyId: updatedData.bonusPolicyId,
        otPolicyId: updatedData.otPolicyId,
        otAmount: updatedData.otAmount,
        vehicleFacility: updatedData.vehicleFacility,
        migrant: updatedData.migrant,
        exService: updatedData.exService,
        monthly: updatedData.monthly,
        adminRemarks: updatedData.adminRemarks,
        idCardNo: updatedData.idCardNo,
        midNo: withMidNoFallback(updatedData).midNo,
        oldIdNo: updatedData.oldIdNo,
        isActive: updatedData.isActive,
        relievedDate: updatedData.relievedDate,
        template: updatedData.templateId,
      };
      if (Object.keys(payload).length) {
        await employeeService.updateAdminInfo(id, payload);
        await fetchEmployeeDetails();
        showSnackbar("Employee details updated successfully!", "success");
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeactivateEmployee = async (updatedData: any) => {
    if (!apiId) return;
    try {
      await updateAdminInfo(updatedData);
      await employeeService.deactivateEmployee(apiId);
      showSnackbar(`"${employee.name}" has been deactivated.`, "success");
      await fetchEmployeeDetails();
    } catch (error: any) {
      showSnackbar(
        error.message || "Failed to deactivate employee.",
        "error",
      );
    }
  };

  const handleReactivateEmployee = () => {
    if (!apiId) return;
    showConfirmDialog({
      title: "Reactivate Employee",
      message: `Reactivate "${employee.name}"? The employee will be restored to active status.`,
      confirmText: "Reactivate",
      cancelText: "Cancel",
      onConfirm: async () => {
        showSpinner();
        try {
          const updated: any = await employeeService.reactivateEmployee(apiId);
          await employeeService.updateAdminInfo(apiId, { relievedDate: "" });
          showSnackbar(
            `"${updated?.name ?? employee.name}" has been reactivated.`,
            "success",
          );
          await fetchEmployeeDetails();
        } catch (error: any) {
          showSnackbar(
            error.message || "Failed to reactivate employee.",
            "error",
          );
        } finally {
          hideSpinner();
        }
      },
    });
  };

  //ELIGIBILITY INFO
  const updateEligibilityInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        pfEligible: updatedData.pfEligible || employee.pfEligible,
        excessEpfEligible:
          updatedData.excessEpfEligible || employee.excessEpfEligible,
        excessEpsEligible:
          updatedData.excessEpsEligible || employee.excessEpsEligible,
        existingEpsMember:
          updatedData.existingEpsMember || employee.existingEpsMember,
        esiEligible: updatedData.esiEligible || employee.esiEligible,
        lwfCovered: updatedData.lwfCovered || employee.lwfCovered,
        esiNumber: updatedData.esiNumber || employee.esiNumber,
        esiJoiningDate: updatedData.esiJoiningDate || employee.esiJoiningDate,
        esiRelievingDate:
          updatedData.esiRelievingDate || employee.esiRelievingDate,
      };
      await employeeService.updateEligibilityInfo(id, payload);
      await fetchEmployeeDetails();
      showSnackbar("Eligibility information updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update", "error");
    } finally {
      hideSpinner();
    }
  };

  //BG CHECK
  const updateBackgroundInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        backgroundCheckStatus: updatedData.backgroundCheckStatus,
        backgroundVerificationCompletedOn:
          updatedData.backgroundVerificationCompletedOn
            ? new Date(
              updatedData.backgroundVerificationCompletedOn,
            ).toISOString()
            : null,
        backgroundVerificationIndicator:
          updatedData.backgroundVerificationIndicator,
        agencyName: updatedData.agencyName,
        backgroundCheckRemarks: updatedData.backgroundCheckRemarks,
      };
      await employeeService.updateBackgroundInfo(id, payload);
      await fetchEmployeeDetails();
      showSnackbar("Background information updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update", "error");
    } finally {
      hideSpinner();
    }
  };

  // Training Details
  const handleUpdateTrainingDetails = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.trainingDetails || [];
      for (const item of updatedData) {
        const originalItem = originalData.find(
          (orig: any) => orig.id === item.id,
        );
        if (
          originalItem &&
          JSON.stringify(originalItem) !== JSON.stringify(item)
        ) {
          const updatedItem = {
            trainingName: item.trainingName,
            institute: item.institute,
            fromDate: item.fromDate,
            toDate: item.toDate,
            certificateNo: item.certificateNo,
            remarks: item.remarks,
            durationHours: Number(item.durationHours),
            conductedBy: item.conductedBy,
          };
          await employeeService.updateTrainingDetail(id, item.id, updatedItem);
          await fetchEmployeeDetails();
        }
      }
      showSnackbar("Training details updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(
        error.message || "Failed to update training details",
        "error",
      );
    } finally {
      hideSpinner();
    }
  };

  const handleAddTrainingDetail = async (newItem: any) => {
    showSpinner();
    try {
      await employeeService.addTrainingDetail(id, newItem);
      await fetchEmployeeDetails();
      showSnackbar("Training detail added successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteTrainingDetail = async (itemId: string) => {
    showConfirmDialog({
      title: "Delete Training Detail",
      message: "Are you sure you want to delete this training detail?",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeService.deleteTrainingDetail(id, itemId);
          await fetchEmployeeDetails();
          showSnackbar("Training detail deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(
            error.message || "Failed to delete training detail",
            "error",
          );
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // Previous Employments
  const handleUpdatePreviousEmployments = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.previousEmployments || [];
      for (const item of updatedData) {
        const originalItem = originalData.find(
          (orig: any) => orig.id === item.id,
        );
        if (
          originalItem &&
          JSON.stringify(originalItem) !== JSON.stringify(item)
        ) {
          const updatedItem = {
            companyName: item.companyName,
            designation: item.designation,
            fromDate: item.fromDate,
            toDate: item.toDate,
            ctc: Number(item.ctc),
            reasonForLeaving: item.reasonForLeaving,
            companyAddress: item.companyAddress,
            achievements: item.achievements,
            experience: Number(item.experience),
          };
          await employeeService.updatePreviousEmployment(
            apiId,
            item.id,
            updatedItem,
          );
          await fetchEmployeeDetails();
        }
      }
      showSnackbar("Previous employments updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(
        error.message || "Failed to update previous employments",
        "error",
      );
    } finally {
      hideSpinner();
    }
  };

  const handleAddPreviousEmployment = async (newItem: any) => {
    showSpinner();
    try {
      await employeeService.addPreviousEmployment(apiId, newItem);
      await fetchEmployeeDetails();
      showSnackbar("Previous employment added successfully!", "success");
    } catch (error: any) {
      showSnackbar(
        error.message || "Failed to add previous employment",
        "error",
      );
    } finally {
      hideSpinner();
    }
  };

  const handleDeletePreviousEmployment = async (itemId: string) => {
    showConfirmDialog({
      title: "Delete Previous Employment",
      message: "Are you sure you want to delete this previous employment?",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeService.deletePreviousEmployment(apiId, itemId);
          showSnackbar("Previous employment deleted successfully!", "success");
          await fetchEmployeeDetails();
        } catch (error: any) {
          showSnackbar(
            error.message || "Failed to delete previous employment",
            "error",
          );
        } finally {
          hideSpinner();
        }
      },
    });
  };

  //BANKINFO
  const updateBankInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        bankAccountNumber: updatedData.bankAccountNumber,
        bankName: updatedData.bankName,
        bankBranch: updatedData.bankBranch,
        ifscCode: updatedData.ifscCode,
        nameAsPerBankRecords: updatedData.nameAsPerBankRecords,
        bankAccountTypeId: updatedData.bankAccountTypeId,
        ddPayableAt: updatedData.ddPayableAt,
        salaryPaymentModeId: updatedData.salaryPaymentModeId,
        salaryTypeId: updatedData.salaryTypeId,
        iban: updatedData.iban,
      };
      if (Object.keys(payload).length) {
        await employeeService.updateBankDetails(id, payload);
        await fetchEmployeeDetails();
        showSnackbar("Bank details updated successfully!", "success");
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  // PF Accounts
  const handleUpdatePf = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.pfAccounts || [];
      for (const item of updatedData) {
        const originalItem = originalData.find(
          (orig: any) => orig.id === item.id,
        );
        if (
          originalItem &&
          JSON.stringify(originalItem) !== JSON.stringify(item)
        ) {
          const matchValue =
            originalItem.pfScheme == item.pfScheme &&
              originalItem.pfSchemeId == item.pfSchemeId
              ? originalItem.pfSchemeId
              : item.pfScheme;
          const updatedItem = {
            pfNumber: item.pfNumber,
            uan: item.uan,
            pfSchemeId: matchValue,
            fromDate: item.fromDate,
            toDate: item.toDate,
            remarks: item.remarks,
            current: item.current,
          };
          await employeeService.updatePfAccount(id, item.id, updatedItem);
          await fetchEmployeeDetails();
        }
      }
      showSnackbar("PF Account updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update addresses", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleAddPf = async (newItem: any) => {
    showSpinner();
    try {
      const existingPfAccounts = employee?.pfAccounts || [];
      const existingPfWithUan = existingPfAccounts.find(
        (pf: any) => pf.uan
      );
      if (existingPfWithUan && newItem.uan) {
        const existingUan = existingPfWithUan.uan;
        const newUan = newItem.uan;
        if (existingUan !== newUan) {
          setUANError(`UAN mismatch! Existing UAN is ${existingUan}. Please use the same UAN for all PF accounts.`)
          hideSpinner();
          return;
        }
      }
      newItem["pfSchemeId"] = newItem.pfScheme;
      delete newItem.pfScheme;
      await employeeService.addPfAccount(id, newItem);
      await fetchEmployeeDetails();
      showSnackbar("PF added successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
    if (uanError) {
      setTimeout(() => {
        setUANError("")
      }, 5000);
    }
  }, [uanError])

  const handleDeletePf = async (itemId: string) => {
    showConfirmDialog({
      title: "Delete PF Account",
      message: "Are you sure you want to delete this PF Account?",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeService.deletePfAccount(id, itemId);
          await fetchEmployeeDetails();
          showSnackbar("Pf Account deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  //IDENTITY INFO
  const updateIdentityInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        panNumber: updatedData.panNumber || employee.panNumber,
        aadhaarEnrolmentNo:
          updatedData.aadhaarEnrolmentNo || employee.aadhaarEnrolmentNo,
        nameAsOnAadhaar:
          updatedData.nameAsOnAadhaar || employee.nameAsOnAadhaar,
        aadhaarNumber: updatedData.aadhaarNumber || employee.aadhaarNumber,
        universalAccountNumber:
          updatedData.universalAccountNumber || employee.universalAccountNumber,
        pranNumber: updatedData.pranNumber || employee.pranNumber,
        nameAsPerPran: updatedData.nameAsPerPran || employee.nameAsPerPran,
        passportNumber: updatedData.passportNumber || employee.passportNumber,
        visaType: updatedData.visaType || employee.visaType,
        visaExpiry: updatedData.visaExpiry || employee.visaExpiry,
        loginIpAddress: updatedData.loginIpAddress || employee.loginIpAddress,
        loginUserName: updatedData.loginUserName || employee.loginUserName,
        nameInPan: updatedData.nameInPan || employee.nameInPan,
        nameInPassport: updatedData.nameInPassport || employee.nameInPassport,
        placeOfIssue: updatedData.placeOfIssue || employee.placeOfIssue,
        dateOfIssue: updatedData.dateOfIssue || employee.dateOfIssue,
        expiryDate: updatedData.expiryDate || employee.expiryDate,
        insuranceNumber:
          updatedData.insuranceNumber || employee.insuranceNumber,
        nameInInsurance:
          updatedData.nameInInsurance || employee.nameInInsurance,
        insuranceValidFrom:
          updatedData.insuranceValidFrom || employee.insuranceValidFrom,
        insuranceValidTo:
          updatedData.insuranceValidTo || employee.insuranceValidTo,
      };
      await employeeService.updateIdentityInfo(id, payload);
      await fetchEmployeeDetails();
      await updateAdminInfo(updatedData);
      showSnackbar("Identification details updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  // Family Members
  const handleUpdateFamilyMembers = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.familyMembers || [];
      for (const item of updatedData) {
        const originalItem = originalData.find(
          (orig: any) => orig.id === item.id,
        );
        if (
          originalItem &&
          JSON.stringify(originalItem) !== JSON.stringify(item)
        ) {
          const matchValue =
            originalItem.relationship == item.relationship &&
              originalItem.relationshipId == item.relationshipId
              ? originalItem.relationshipId
              : item.relationship;
          const matchGender =
            originalItem.gender == item.gender &&
              originalItem.genderId == item.genderId
              ? originalItem.genderId
              : item.gender;
          const matchBg =
            originalItem.bloodGroup == item.bloodGroup &&
              originalItem.bloodGroupId == item.bloodGroupId
              ? originalItem.bloodGroupId
              : item.bloodGroup;
          const updatedItem = {
            name: item.name,
            relationshipId: matchValue,
            dateOfBirth: item.dateOfBirth,
            occupation: item.occupation,
            dependent: item.dependent,
            genderId: matchGender,
            bloodGroupId: matchBg,
            age: item.age,
            mobileNumber: item.mobileNumber,
          };
          await employeeService.updateFamilyMember(apiId, item.id, updatedItem);
          await fetchEmployeeDetails();
        }
      }
      showSnackbar("Family members updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update family members", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleAddFamilyMember = async (newItem: any) => {
    showSpinner();
    try {
      newItem.relationshipId = newItem.relationship;
      newItem.genderId = newItem.gender;
      newItem.bloodGroupId = newItem.bloodGroup;

      delete newItem.bloodGroup;
      delete newItem.gender;
      delete newItem.relationship;

      await employeeService.addFamilyMember(apiId, newItem);
      await fetchEmployeeDetails();
      showSnackbar("Family member added successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteFamilyMember = async (itemId: string) => {
    showConfirmDialog({
      title: "Delete Family Member",
      message: "Are you sure you want to delete this family member?",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeService.deleteFamilyMember(apiId, itemId);
          await fetchEmployeeDetails();
          showSnackbar("Family member deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message, "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // Nominations
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [expandedAuditFields, setExpandedAuditFields] = useState<Set<string>>(
    new Set(),
  );

  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  const getTotalSharePercentage = (
    nominations: any[],
    nominationType: string,
    excludeId?: string,
  ) => {
    return nominations
      .filter(
        (item) =>
          item.nominationType === nominationType && item.id !== excludeId,
      )
      .reduce((sum, item) => sum + Number(item.sharePercentage || 0), 0);
  };

  const fetchFamilyMembers = async () => {
    try {
      const response: any = await employeeService.getFamilyMembers(apiId);
      setFamilyMembers(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (apiId) {
      fetchFamilyMembers();
    }
  }, [apiId]);

  useEffect(() => {
    if (tabValue === 8) {
      fetchFamilyMembers();
    }
  }, [tabValue]);

  useEffect(() => {
    if (tabValue === 9) {
      fetchEmployeeDetails();
    }
  }, [tabValue]);

  useEffect(() => {
    if (tabValue !== 10 || !apiId) return;
    setPolicyLoading(true);
    setPolicyError(null);
    const keyDomains = [
      PolicyDomain.LEAVE,
      PolicyDomain.EXPENSE,
      PolicyDomain.OVERTIME,
      PolicyDomain.ATTENDANCE,
      PolicyDomain.PAYROLL,
    ];
    Promise.all([
      policyService.getEmployeePolicies(apiId),
      policyService.getEmployeePolicyHistory(apiId),
      Promise.all(
        keyDomains.map((domain) =>
          policyService
            .getEffectivePolicy(apiId, domain)
            .then((res: any) => ({ domain, data: res.data ?? null }))
            .catch(() => ({ domain, data: null })),
        ),
      ),
    ])
      .then(([policiesRes, historyRes, effectiveRes]: any) => {
        setEmpPolicies(policiesRes.data ?? []);
        setEmpPolicyHistory(historyRes.data ?? []);
        const effectiveMap: Record<string, any> = {};
        (effectiveRes as Array<{ domain: string; data: any }>).forEach(
          ({ domain, data }) => {
            if (data) effectiveMap[domain] = data;
          },
        );
        setEffectivePolicies(effectiveMap);
      })
      .catch(() => setPolicyError("Failed to load policy data"))
      .finally(() => setPolicyLoading(false));
  }, [tabValue, id]);

  const familyMemberOptions = familyMembers.map((member: any) => ({
    id: member.id,
    name: `${member.name} (${member.relationship})`,
  }));


  const handleUpdateNominations = async (updatedData: any[]) => {
    showSpinner();
    try {
      for (const type of nominationTypes) {
        const typeItems = updatedData.filter(
          (item) => item.nominationType === type,
        );
        const total = typeItems.reduce(
          (sum, item) => sum + Number(item.sharePercentage || 0),
          0,
        );
        if (total > 100) {
          showSnackbar(
            `${type} nomination percentage cannot exceed 100%`,
            "error",
          );
          return;
        }
      }
      const originalData = employee?.nominations || [];
      for (const item of updatedData) {
        const originalItem = originalData.find(
          (orig: any) => orig.id === item.id,
        );
        if (
          originalItem &&
          JSON.stringify(originalItem) !== JSON.stringify(item)
        ) {
          const payload = {
            nomineeName: item.nomineeName,
            sharePercentage: Number(item.sharePercentage),
            nominationType: item.nominationType,
          };
          await employeeService.updateNomination(apiId, item.id, payload);
          await fetchEmployeeDetails();
        }
      }
      showSnackbar("Nominations updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update nominations", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleAddNomination = async (newItem: any) => {
    showSpinner();
    try {
      newItem.sharePercentage = Number(newItem.sharePercentage);
      const existingTotal = getTotalSharePercentage(
        employee?.nominations || [],
        newItem.nominationType,
      );
      const remaining = 100 - existingTotal;
      if (newItem.sharePercentage > remaining) {
        showSnackbar(
          `Only ${remaining}% remaining for ${newItem.nominationType}`,
          "error",
        );
        return;
      }
      await employeeService.addNomination(apiId, newItem);
      await fetchEmployeeDetails();
      showSnackbar("Nomination added successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteNomination = async (itemId: string) => {
    showConfirmDialog({
      title: "Delete Nomination",
      message: "Are you sure you want to delete this nomination?",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeService.deleteNomination(apiId, itemId);
          await fetchEmployeeDetails();
          showSnackbar("Nomination deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message || "Failed to delete nomination", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // Attachments
  const handleAddAttachment = async (newItem: any) => {
    showSpinner();
    try {
      if (!newItem.documentType) {
        showSnackbar("Document Type is Mandatory", "warning");
        return;
      }
      await employeeService.addAttachment(apiId, newItem);
      await fetchEmployeeDetails();
      showSnackbar("Attachment added successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to add attachment", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDeleteAttachment = async (itemId: string) => {
    showConfirmDialog({
      title: "Delete Attachment",
      message: "Are you sure you want to delete this attachment?",
      confirmText: "Delete",
      onConfirm: async () => {
        showSpinner();
        try {
          await employeeService.deleteAttachment(apiId, itemId);
          await fetchEmployeeDetails();
          showSnackbar("Attachment deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message || "Failed to delete attachment", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  if (!employee) {
    return null;
  }

  const handleCheckIn = async () => {
    try {
      const branch: any = employee?.branchId
        ? await branchService.getBranchById(employee.branchId)
        : null;

      const branchData = branch?.data || branch || null;
      const geofenceMode = branchData?.geofenceMode || "STRICT";
      const radius = Number(branchData?.radius ?? 0);
      const branchLatitude = Number(branchData?.latitude ?? null);
      const branchLongitude = Number(branchData?.longitude ?? null);

      if (!navigator.geolocation) {
        showSnackbar("This browser does not support location access for geofence validation.", "error");
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition((geoPosition) => resolve(geoPosition), reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const evaluation = evaluateGeofenceAccess({
        branchLatitude,
        branchLongitude,
        userLatitude: position.coords.latitude,
        userLongitude: position.coords.longitude,
        radiusKm: radius,
        mode: geofenceMode,
      });

      if (!evaluation.allowed) {
        showSnackbar(evaluation.message, "error");
        return;
      }

      const res: any = await attendanceService.checkIn({
        employeeId: apiId || "",
        checkInTime: new Date().toISOString(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        withinGeofence: evaluation.withinGeofence,
        geofenceMode,
        markedBy: session?.user.employeeId ? session?.user.employeeId : session?.user.userId,
      });

      showSnackbar(res.message || evaluation.message, evaluation.withinGeofence ? "success" : "warning");
      setCheckIn(true);
    } catch (error: any) {
      showSnackbar(error?.message || "Unable to check in.", "error");
    }
  }

  const handleCheckOut = async () => {
    try {
      const res: any = await attendanceService.checkOut({
        employeeId: apiId || "",
        checkOutTime: new Date().toISOString(),
        markedBy: session?.user.employeeId ? session?.user.employeeId : session?.user.userId,
      });
      showSnackbar(res.message, 'success');
    } catch (error: any) {
    }
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (hasUnsavedChanges && !isSaving) {
      const userChoice = window.confirm(
        'You have unsaved changes. Are you sure you want to switch tabs without saving?'
      );
      if (!userChoice) {
        return;
      }
    }
    setTabValue(newValue);
  };

  const filterAuditLogs = (logs: any[], searchTerm: string) => {
    if (!searchTerm.trim()) return logs;
    const term = searchTerm.toLowerCase().trim();
    return logs.filter(log => {
      const fieldMatch = log.fieldName?.toLowerCase().includes(term) || false;
      const oldValueMatch = log.oldValue?.toString().toLowerCase().includes(term) || false;
      const newValueMatch = log.newValue?.toString().toLowerCase().includes(term) || false;
      const userNameMatch = log.changedBy?.userName?.toLowerCase().includes(term) || false;
      return fieldMatch || oldValueMatch || newValueMatch || userNameMatch;
    });
  };

  return (
    <div className="">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        {!isUser &&
          <MaterialModule.IconButton
            onClick={() => navigate("/employees")}
            className="!bg-gray-100 !text-gray-800"
          >
            <MaterialModule.ArrowBackIcon />
          </MaterialModule.IconButton>
        }

        <div className="flex-1">
          <div className="font-semibold text-gray-800">Employee Details</div>
          <div className="text-gray-500 text-[12px]">
            Complete information about{" "}
            <span className="font-medium text-primary">{employee.name}</span>
            {hasUnsavedChanges && (
              <>
                <span className="text-[12px] absolute top-[75px] right-[18px] ml-3 px-5 py-2.5 rounded-xl backdrop-blur-md bg-amber-50/90 border border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.3)] flex items-center gap-3 animate-slide-in">
                  <div className="relative">
                    <WarningAmberOutlined className="!w-4 !h-4 text-amber-500 animate-bounce" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-700">Unsaved Changes</span>
                    <span className="text-amber-600 hidden sm:inline">• Save each section</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce [animation-delay:0ms]"></span>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:150ms]"></span>
                    <span className="w-1.5 h-1.5 bg-amber-600 rounded-full animate-bounce [animation-delay:300ms]"></span>
                  </div>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <MaterialModule.Card className="mb-2 bg-white">
        <MaterialModule.CardContent className="py-2 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <MaterialModule.Avatar
                src={employee.photoUrl}
                className="!w-16 !h-16 !bg-primary text-2xl cursor-pointer"
              >
                {employee.firstName?.charAt(0)}
                {employee.lastName?.charAt(0)}
              </MaterialModule.Avatar>

              {/* Hover Overlay with multiple options */}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 cursor-pointer">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  title="Upload from device"
                >
                  <MaterialModule.CameraAlt className="!text-white !w-4 !h-4" />
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setWebcamOpen(true);
                  }}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                  title="Capture with webcam"
                >
                  <PhotoCameraOutlined className="!text-white !w-4 !h-4" />
                </div>
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
            <div>
              <div className="font-bold text-gray-800">{employee.name}</div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <MaterialModule.Chip
                  label={`ID: ${employee.employeeId}`}
                  size="small"
                  color="primary"
                  className="!bg-primary"
                />
                <MaterialModule.Chip
                  label={employee.emailAddress || 'N/A'}
                  size="small"
                  variant="outlined"
                  className="text-gray-700"
                />
                <MaterialModule.Chip
                  label={employee.mobileNumber || 'N/A'}
                  size="small"
                  variant="outlined"
                  className="text-gray-700"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="mr-2">
              <ProfileCompletionProgress
                employee={employee}
                size={60}
                showLabel={true}
              />
              {/* <div className="mt-2">
                <ProfileCompletionBadge employee={employee} />
              </div> */}
            </div>
            {
              isAdmin ? (
                <div>
                  <Button
                    variant="outlined"
                    className="!text-primary !border-primary"
                    onClick={handleOpenAuditLog}
                  >
                    Audit Log
                  </Button>
                </div>
              ) : (
                <div>
                  <Button
                    variant="contained"
                    color={!checkIn ? 'success' : 'error'}
                    onClick={!checkIn ? handleCheckIn : handleCheckOut}
                  >
                    {!checkIn ? 'Check In' : 'Check Out'}
                  </Button>
                </div>
              )}
          </div>
        </MaterialModule.CardContent>
      </MaterialModule.Card>

      <WebcamCapture
        open={webcamOpen}
        onClose={() => setWebcamOpen(false)}
        onCapture={handleWebcamCapture}
        title="Capture Profile Photo"
      />

      {/* Tabs Navigation */}
      <div className="">
        <MaterialModule.Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
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
          {tabs.map((tab, index) => (
            <MaterialModule.Tab
              key={index}
              label={
                <div className="flex items-center gap-1 !text-gray-900">
                  <span>{tab.label}</span>
                </div>
              }
            />
          ))}
        </MaterialModule.Tabs>
        <div className="h-[calc(100vh-350px)] overflow-auto">
          {/* Tab 0: Personal Information */}
          <TabPanel value={tabValue} index={0}>
            <EditableGroup
              title="Basic Information"
              icon={<MaterialModule.Person2Outlined />}
              fields={basicInfoFields}
              data={employee}
              onSave={updatePersonalInfo}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
            <EditableTableGroup
              title="Emergency Contacts"
              icon={<MaterialModule.ContactEmergencyOutlined />}
              data={employee.emergencyContacts || []}
              columns={emergencyColumns}
              onSave={handleUpdateEmergencyContacts}
              onAdd={handleAddEmergencyContact}
              onDelete={handleDeleteEmergencyContact}
              addDialogFields={emergencyColumns}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
          </TabPanel>

          {/* Tab 1: Addresses */}
          <TabPanel value={tabValue} index={1}>
            <EditableTableGroup
              title="Addresses"
              icon={<MaterialModule.LocationOnOutlined />}
              data={employee.addresses || []}
              columns={addressColumns}
              onSave={handleUpdateAddresses}
              onAdd={handleAddAddress}
              onDelete={handleDeleteAddress}
              addDialogFields={addressColumns}
              categoryOptions={categoryOptions}
              categories={categories}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
          </TabPanel>

          {/* Tab 2: Qualifications */}
          <TabPanel value={tabValue} index={2}>
            <EditableTableGroup
              title="Qualifications"
              icon={<MaterialModule.SchoolOutlined />}
              data={employee.qualifications || []}
              columns={qualificationColumns}
              onSave={handleUpdateQualifications}
              onAdd={handleAddQualification}
              onDelete={handleDeleteQualification}
              addDialogFields={qualificationColumns}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
          </TabPanel>

          {/* Tab 3: Employee Details (Admin) */}
          <TabPanel value={tabValue} index={3}>
            <EditableGroup
              title="Employee Details"
              icon={<MaterialModule.Person2Outlined />}
              fields={employeeColumns}
              data={employee}
              onSave={updateAdminInfo}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
              onDeactivate={handleDeactivateEmployee}
              onReactivate={handleReactivateEmployee}
            />
            <EditableGroup
              title="Eligibility Information"
              icon={<MaterialModule.AccountBalanceIcon />}
              fields={eligibilityFields}
              data={employee}
              onSave={updateEligibilityInfo}
              categoryOptions={categoryOptions}
              categories={categories}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
            <EditableGroup
              title="Verification"
              icon={<MaterialModule.VerifiedUserOutlined />}
              fields={VerificationColumns}
              data={employee}
              onSave={updateBackgroundInfo}
              categoryOptions={categoryOptions}
              categories={categories}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
          </TabPanel>

          {/* Tab 4: Training Details */}
          <TabPanel value={tabValue} index={4}>
            <EditableTableGroup
              title="Training Details"
              icon={<MaterialModule.LocalLibraryOutlined />}
              data={employee.trainingDetails || []}
              columns={trainingDetailsColumns}
              onSave={handleUpdateTrainingDetails}
              onAdd={handleAddTrainingDetail}
              onDelete={handleDeleteTrainingDetail}
              addDialogFields={trainingDetailsColumns}
              categoryOptions={categoryOptions}
              categories={categories}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
          </TabPanel>

          {/* Tab 5: Previous Employments */}
          <TabPanel value={tabValue} index={5}>
            <EditableTableGroup
              title="Previous Employments"
              icon={<MaterialModule.WorkHistoryOutlined />}
              data={employee.previousEmployments || []}
              columns={employmentColumns}
              onSave={handleUpdatePreviousEmployments}
              onAdd={handleAddPreviousEmployment}
              onDelete={handleDeletePreviousEmployment}
              addDialogFields={employmentColumns}
              categoryOptions={categoryOptions}
              categories={categories}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
          </TabPanel>

          {/* Tab 6: Identification Details */}
          <TabPanel value={tabValue} index={6}>
            <EditableGroup
              title="Bank Details"
              icon={<MaterialModule.AccountBalanceIcon />}
              fields={bankColumns}
              document="bank"
              data={employee}
              onSave={updateBankInfo}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
            <EditableTableGroup
              title="PF Details"
              error={uanError}
              icon={<MaterialModule.Person2Outlined />}
              data={employee.pfAccounts || []}
              columns={pfColumns}
              document="pf"
              onSave={handleUpdatePf}
              onAdd={handleAddPf}
              onDelete={handleDeletePf}
              addDialogFields={pfColumns}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
            <EditableGroup
              title="PAN Details"
              icon={<MaterialModule.Person2Outlined />}
              fields={panColumns}
              document="pan"
              data={employee}
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
            <EditableGroup
              title="Aadhaar Details"
              icon={<MaterialModule.Person2Outlined />}
              fields={aadhaarColumns}
              document="aadhaar"
              data={employee}
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
            <EditableGroup
              title="Passport Details"
              icon={<MaterialModule.FlightLandOutlined />}
              fields={passportVisaColumns}
              document="passport"
              data={employee}
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
            <EditableGroup
              title="Insurance Details"
              icon={<MaterialModule.Person2Outlined />}
              fields={insuranceColumns}
              document="insurance"
              data={employee}
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
            <EditableGroup
              title="ESI Details"
              icon={<MaterialModule.Person2Outlined />}
              fields={esiColumns}
              document="esi"
              data={employee}
              onSave={updateEligibilityInfo}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
            <EditableGroup
              title="PRAN Details"
              icon={<MaterialModule.Person2Outlined />}
              fields={pranColumns}
              data={employee}
              document="pran"
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
            <EditableGroup
              title="Login"
              icon={<MaterialModule.LoginOutlined />}
              fields={loginColumns}
              data={employee}
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
              categories={categories}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
          </TabPanel>

          {/* Tab 7: Family Members */}
          <TabPanel value={tabValue} index={7}>
            <EditableTableGroup
              title="Family Members"
              icon={<MaterialModule.Diversity3Outlined />}
              data={employee.familyMembers || []}
              columns={familyColumns}
              onSave={handleUpdateFamilyMembers}
              onAdd={handleAddFamilyMember}
              onDelete={handleDeleteFamilyMember}
              addDialogFields={familyColumns}
              categoryOptions={categoryOptions}
              categories={categories}
              refreshCategoryOptions={fetchCategoryOptions}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
          </TabPanel>

          {/* Tab 8: Nominations */}
          <TabPanel value={tabValue} index={8}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-4 gap-x-8">
              {nominationTypes.map((type) => (
                <EditableTableGroup
                  key={type}
                  title={nominationConfigs[type].title}
                  icon={<MaterialModule.PeopleOutlineOutlined />}
                  data={
                    employee.nominations?.filter(
                      (n: any) => n.nominationType === type,
                    ) || []
                  }
                  columns={nominationConfigs[type].columns}
                  onSave={handleUpdateNominations}
                  onAdd={(newItem: any) =>
                    handleAddNomination({ ...newItem, nominationType: type })
                  }
                  onDelete={handleDeleteNomination}
                  addDialogFields={nominationConfigs[type].columns}
                  categories={categories}
                  categoryOptions={{
                    ...categoryOptions,
                    nomineeName: familyMemberOptions,
                  }}
                  isSaving={isSaving}
                  setIsSaving={setIsSaving}
                  onUnsavedChange={handleChildUnsavedChange}
                />
              ))}
            </div>

          </TabPanel>

          {/* Tab 9: Attachments */}
          <TabPanel value={tabValue} index={9}>
            <EditableTableGroup
              title="Attachments"
              icon={<MaterialModule.AttachmentIcon />}
              data={employee.attachments || []}
              columns={attachmentColumns}
              onAdd={handleAddAttachment}
              onDelete={handleDeleteAttachment}
              addDialogFields={attachmentAddFields}
              categoryOptions={categoryOptions}
              categories={categories}
              isSaving={isSaving}
              setIsSaving={setIsSaving}
              onUnsavedChange={handleChildUnsavedChange}
            />
          </TabPanel>

          {/* Tab 10: Policies */}
          <TabPanel value={tabValue} index={10}>
            {/* Policy tab content - unchanged */}
            <div className="p-4">
              {/* Section toggle buttons */}
              <div className="flex gap-2 mb-4 border-b border-gray-200 pb-3">
                {(
                  [
                    { key: "effective", label: "Effective Policies" },
                    { key: "assigned", label: "All Assigned Policies" },
                    { key: "history", label: "Policy History" },
                  ] as const
                ).map(({ key, label }) => (
                  <Button
                    key={key}
                    size="small"
                    variant={policySection === key ? "contained" : "outlined"}
                    onClick={() => setPolicySection(key)}
                    className={
                      policySection === key
                        ? "!bg-primary !text-white"
                        : "!text-gray-600 !border-gray-300"
                    }
                    sx={{ textTransform: "none", borderRadius: 2, px: 2 }}
                  >
                    {label}
                  </Button>
                ))}
              </div>

              {policyLoading && (
                <div className="flex justify-center py-10">
                  <MaterialModule.CircularProgress />
                </div>
              )}
              {policyError && (
                <MaterialModule.Alert severity="error">
                  {policyError}
                </MaterialModule.Alert>
              )}

              {!policyLoading && !policyError && (
                <>
                  {/* Effective Policies */}
                  {policySection === "effective" &&
                    (Object.keys(effectivePolicies).length === 0 ? (
                      <MaterialModule.Alert severity="info">
                        No effective policies found for this employee.
                      </MaterialModule.Alert>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(effectivePolicies).map(
                          ([domain, policy]: [string, any]) => (
                            <MaterialModule.Card
                              key={domain}
                              variant="outlined"
                              className="!rounded-lg !bg-white"
                            >
                              <MaterialModule.CardContent className="!py-3">
                                <div className="flex items-center justify-between mb-2">
                                  <MaterialModule.Chip
                                    label={domain}
                                    size="small"
                                    className="!bg-primary !text-white !text-[11px]"
                                  />
                                  {policy.status && (
                                    <MaterialModule.Chip
                                      label={policy.status}
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                    />
                                  )}
                                </div>
                                <div className="text-[13px] font-medium text-gray-800">
                                  {policy.policyName || "—"}
                                </div>
                                {policy.policyCode && (
                                  <div className="text-[11px] text-gray-400">
                                    {policy.policyCode}
                                  </div>
                                )}
                                {policy.effectiveFrom && (
                                  <div className="text-[11px] text-gray-500 mt-1">
                                    From: {formatDate(policy.effectiveFrom)}
                                    {policy.effectiveTo
                                      ? ` → ${formatDate(policy.effectiveTo)}`
                                      : " — Ongoing"}
                                  </div>
                                )}
                              </MaterialModule.CardContent>
                            </MaterialModule.Card>
                          ),
                        )}
                      </div>
                    ))}

                  {/* All Assigned Policies */}
                  {policySection === "assigned" &&
                    (empPolicies.length === 0 ? (
                      <MaterialModule.Alert severity="info">
                        No policies assigned to this employee.
                      </MaterialModule.Alert>
                    ) : (
                      <MaterialModule.TableContainer className="bg-white border border-gray-200 rounded-md !max-h-[calc(100vh-440px)]">
                        <MaterialModule.Table stickyHeader size="small">
                          <MaterialModule.TableHead
                            sx={{ bgcolor: "action.hover" }}
                          >
                            <MaterialModule.TableRow>
                              <MaterialModule.TableCell
                                sx={{ fontWeight: "bold" }}
                              >
                                S No
                              </MaterialModule.TableCell>
                              <MaterialModule.TableCell
                                sx={{ fontWeight: "bold" }}
                              >
                                Policy Name
                              </MaterialModule.TableCell>
                              <MaterialModule.TableCell
                                sx={{ fontWeight: "bold" }}
                              >
                                Domain
                              </MaterialModule.TableCell>
                              <MaterialModule.TableCell
                                sx={{ fontWeight: "bold" }}
                              >
                                Version
                              </MaterialModule.TableCell>
                              <MaterialModule.TableCell
                                sx={{ fontWeight: "bold" }}
                              >
                                Priority
                              </MaterialModule.TableCell>
                              <MaterialModule.TableCell
                                sx={{ fontWeight: "bold" }}
                              >
                                Applied Via
                              </MaterialModule.TableCell>
                              <MaterialModule.TableCell
                                sx={{ fontWeight: "bold" }}
                              >
                                Effective From
                              </MaterialModule.TableCell>
                              <MaterialModule.TableCell
                                sx={{ fontWeight: "bold" }}
                              ></MaterialModule.TableCell>
                            </MaterialModule.TableRow>
                          </MaterialModule.TableHead>
                          <MaterialModule.TableBody>
                            {empPolicies.map((p: any, index: any) => (
                              <MaterialModule.TableRow
                                key={p.policyId || p.id || index}
                                sx={getRowColor(index)}
                              >
                                <MaterialModule.TableCell>
                                  {index + 1}
                                </MaterialModule.TableCell>
                                <MaterialModule.TableCell>
                                  <div>{p.policyName || p.name || "—"}</div>
                                </MaterialModule.TableCell>
                                <MaterialModule.TableCell>
                                  <MaterialModule.Chip
                                    label={p.domainCode || "—"}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      backgroundColor: getDomainColor(
                                        p.domainCode,
                                      ),
                                      fontWeight: 500,
                                      fontSize: "11px",
                                    }}
                                  />
                                </MaterialModule.TableCell>
                                <MaterialModule.TableCell>
                                  <MaterialModule.Chip
                                    label={
                                      p.policyVersion
                                        ? `v${p.policyVersion}`
                                        : "—"
                                    }
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                    className="!text-gray-800"
                                    sx={{ fontWeight: 500 }}
                                  />
                                </MaterialModule.TableCell>
                                <MaterialModule.TableCell>
                                  <Chip
                                    label={
                                      p.priority !== undefined
                                        ? p.priority
                                        : "0"
                                    }
                                    size="small"
                                    sx={{
                                      backgroundColor: getPriorityColor(
                                        p.priority,
                                      ),
                                      color: "white",
                                      fontWeight: 500,
                                      fontSize: "11px",
                                    }}
                                  />
                                </MaterialModule.TableCell>
                                <MaterialModule.TableCell>
                                  <MaterialModule.Chip
                                    label={
                                      p.appliedViaScope || "SYSTEM_DEFAULT"
                                    }
                                    size="small"
                                    variant="outlined"
                                    className="!text-gray-800"
                                    sx={{
                                      fontSize: "11px",
                                      textTransform: "capitalize",
                                    }}
                                  />
                                </MaterialModule.TableCell>
                                <MaterialModule.TableCell>
                                  <div>
                                    {p.effectiveFrom
                                      ? formatDate(p.effectiveFrom)
                                      : "—"}
                                  </div>
                                </MaterialModule.TableCell>
                                <MaterialModule.TableCell>
                                  <IconButton
                                    size="small"
                                    onClick={() => viewPolicyConfig(p)}
                                    title="View Config"
                                  >
                                    <SettingsOutlined
                                      fontSize="small"
                                      className="text-primary"
                                    />
                                  </IconButton>
                                </MaterialModule.TableCell>
                              </MaterialModule.TableRow>
                            ))}
                          </MaterialModule.TableBody>
                        </MaterialModule.Table>
                      </MaterialModule.TableContainer>
                    ))}

                  {/* Policy History */}
                  {policySection === "history" &&
                    (empPolicyHistory.length === 0 ? (
                      <MaterialModule.Alert severity="info">
                        No policy history found for this employee.
                      </MaterialModule.Alert>
                    ) : (
                      <Box>
                        {Object.entries(
                          empPolicyHistory.reduce(
                            (groups: Record<string, any[]>, policy: any) => {
                              const key = policy.domainCode || "Other";
                              if (!groups[key]) {
                                groups[key] = [];
                              }
                              groups[key].push(policy);
                              return groups;
                            },
                            {} as Record<string, any[]>,
                          ),
                        ).map(([domainCode, policies]) => (
                          <Accordion
                            key={domainCode}
                            defaultExpanded={false}
                            className="border border-gray-200 mb-4"
                            sx={{
                              "&:before": { display: "none" },
                            }}
                          >
                            <AccordionSummary
                              expandIcon={<ExpandMoreOutlined />}
                              sx={{
                                bgcolor: getDomainColor(domainCode),
                                borderRadius: "4px 4px 0 0",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  width: "100%",
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {domainCode}
                                </Typography>
                                <Chip
                                  label={`${policies.length} policies`}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ ml: "auto" }}
                                >
                                  Latest: v
                                  {Math.max(
                                    ...policies.map(
                                      (p) => p.policyVersion || 0,
                                    ),
                                  )}
                                </Typography>
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: 0 }}>
                              <MaterialModule.TableContainer className="bg-white  !max-h-[335px]">
                                <MaterialModule.Table stickyHeader size="small">
                                  <MaterialModule.TableHead
                                    sx={{ bgcolor: "action.hover" }}
                                  >
                                    <MaterialModule.TableRow>
                                      <MaterialModule.TableCell
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        #
                                      </MaterialModule.TableCell>
                                      <MaterialModule.TableCell
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Policy Name
                                      </MaterialModule.TableCell>
                                      <MaterialModule.TableCell
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Version
                                      </MaterialModule.TableCell>
                                      <MaterialModule.TableCell
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Priority
                                      </MaterialModule.TableCell>
                                      <MaterialModule.TableCell
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Applied Via
                                      </MaterialModule.TableCell>
                                      <MaterialModule.TableCell
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Effective From
                                      </MaterialModule.TableCell>
                                      <MaterialModule.TableCell
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Effective To
                                      </MaterialModule.TableCell>
                                      <MaterialModule.TableCell
                                        sx={{ fontWeight: "bold" }}
                                      >
                                        Status
                                      </MaterialModule.TableCell>
                                    </MaterialModule.TableRow>
                                  </MaterialModule.TableHead>
                                  <MaterialModule.TableBody>
                                    {policies
                                      .sort(
                                        (a, b) =>
                                          (b.policyVersion || 0) -
                                          (a.policyVersion || 0),
                                      )
                                      .map((policy: any, index: number) => {
                                        const isActive =
                                          policy.effectiveFrom &&
                                          new Date(policy.effectiveFrom) <=
                                          new Date();
                                        const isExpired =
                                          policy.effectiveTo &&
                                          new Date(policy.effectiveTo) <
                                          new Date();
                                        const status = isExpired
                                          ? "EXPIRED"
                                          : isActive
                                            ? "ACTIVE"
                                            : "SCHEDULED";

                                        return (
                                          <MaterialModule.TableRow
                                            key={`${policy.versionId || policy.id || index}-${policy.assignmentId || index}-${index}`}
                                            sx={{
                                              ...getRowColor(index),
                                              opacity: isExpired ? 0.6 : 1,
                                              backgroundColor: isExpired
                                                ? "#f5f5f5"
                                                : undefined,
                                            }}
                                          >
                                            <MaterialModule.TableCell>
                                              {index + 1}
                                            </MaterialModule.TableCell>
                                            <MaterialModule.TableCell>
                                              <Typography
                                                variant="body2"
                                                sx={{ fontWeight: 500 }}
                                              >
                                                {policy.policyName ||
                                                  policy.name ||
                                                  "—"}
                                              </Typography>
                                            </MaterialModule.TableCell>
                                            <MaterialModule.TableCell>
                                              <Chip
                                                label={`v${policy.policyVersion || 1}`}
                                                size="small"
                                                color="primary"
                                                className="!bg-primary"
                                                variant={
                                                  isActive
                                                    ? "filled"
                                                    : "outlined"
                                                }
                                              />
                                            </MaterialModule.TableCell>
                                            <MaterialModule.TableCell>
                                              <Chip
                                                label={
                                                  policy.priority !== undefined
                                                    ? policy.priority
                                                    : "0"
                                                }
                                                size="small"
                                                sx={{
                                                  backgroundColor:
                                                    getPriorityColor(
                                                      policy.priority,
                                                    ),
                                                  color: "white",
                                                  fontWeight: 500,
                                                  fontSize: "11px",
                                                }}
                                              />
                                            </MaterialModule.TableCell>
                                            <MaterialModule.TableCell>
                                              <Chip
                                                label={
                                                  policy.appliedViaScope?.replace(
                                                    "_",
                                                    " ",
                                                  ) || "System Default"
                                                }
                                                size="small"
                                                variant="outlined"
                                                className="text-gray-800"
                                                sx={{
                                                  fontSize: "10px",
                                                  textTransform: "capitalize",
                                                }}
                                              />
                                            </MaterialModule.TableCell>
                                            <MaterialModule.TableCell>
                                              {policy.effectiveFrom
                                                ? formatDate(
                                                  policy.effectiveFrom,
                                                )
                                                : "—"}
                                            </MaterialModule.TableCell>
                                            <MaterialModule.TableCell>
                                              {policy.effectiveTo
                                                ? formatDate(policy.effectiveTo)
                                                : "Ongoing"}
                                            </MaterialModule.TableCell>
                                            <MaterialModule.TableCell>
                                              <Chip
                                                label={status}
                                                size="small"
                                                color={
                                                  status === "ACTIVE"
                                                    ? "success"
                                                    : status === "EXPIRED"
                                                      ? "error"
                                                      : "warning"
                                                }
                                                sx={{
                                                  fontWeight: 500,
                                                  fontSize: "11px",
                                                }}
                                              />
                                            </MaterialModule.TableCell>
                                          </MaterialModule.TableRow>
                                        );
                                      })}
                                  </MaterialModule.TableBody>
                                </MaterialModule.Table>
                              </MaterialModule.TableContainer>
                            </AccordionDetails>
                          </Accordion>
                        ))}
                      </Box>
                    ))}
                </>
              )}
            </div>
          </TabPanel>
        </div>
      </div>

      {/* Audit Log Dialog */}
      <MaterialModule.Dialog
        open={auditLogOpen}
        onClose={() => setAuditLogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-2 pl-5">
          <div className="font-medium">
            Audit Log{" "}
            <span className="text-primary font-bold">({employee.name})</span>
          </div>
          <MaterialModule.IconButton onClick={() => setAuditLogOpen(false)}>
            <MaterialModule.CloseOutlined className="text-gray-800" />
          </MaterialModule.IconButton>
        </div>
        <MaterialModule.DialogContent className="!p-0 border border-gray-200 m-3 !overflow-hidden">
          <div className="sticky top-0 z-10 bg-white p-3 !pb-2 border-b border-gray-200">
            <div className="relative">
              <input
                type="search"
                placeholder="Search by field, value, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 text-[12px] bg-white-50 border border-gray-200 rounded-lg"
              />
            </div>
            {/* Search results count */}
            {searchTerm && (
              <div className="mt-1 ml-2 text-[10px] text-gray-500">
                Found {filterAuditLogs(auditLogs, searchTerm).length} results
              </div>
            )}
          </div>
          {auditLogs.length === 0 ? (
            <div className="text-center text-gray-400 py-16 text-sm">
              No audit records found.
            </div>
          ) : (
            (() => {
              const filteredLogs = filterAuditLogs(auditLogs, searchTerm);

              if (filteredLogs.length === 0) {
                return (
                  <div className="text-center text-gray-400 py-16 text-sm">
                    No results found for "{searchTerm}"
                  </div>
                );
              }
              const grouped = Object.entries(
                filteredLogs.reduce((acc: Record<string, any[]>, log: any) => {
                  const key = log.fieldName || "-";
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(log);
                  return acc;
                }, {}),
              )
                .map(([field, logs]) => ({
                  field,
                  logs: [...logs].sort(
                    (a, b) =>
                      new Date(b.changedOn || 0).getTime() -
                      new Date(a.changedOn || 0).getTime(),
                  ),
                }))
                .sort(
                  (a, b) =>
                    new Date(b.logs[0]?.changedOn || 0).getTime() -
                    new Date(a.logs[0]?.changedOn || 0).getTime(),
                );

              return (
                <div
                  style={{ height: "calc(100vh - 280px)", overflowY: "auto" }}
                >
                  {grouped.map((group) => {
                    const latest = group.logs[0];
                    const isExpanded = expandedAuditFields.has(group.field);
                    const hasPrevious = group.logs.length > 1;

                    return (
                      <div
                        key={group.field}
                        className="border-b border-gray-200 bg-white"
                      >
                        {/* Main row */}
                        <div
                          onClick={() => {
                            if (!hasPrevious) return;
                            setExpandedAuditFields((prev) => {
                              const next = new Set(prev);
                              next.has(group.field)
                                ? next.delete(group.field)
                                : next.add(group.field);
                              return next;
                            });
                          }}
                          className={`flex items-center gap-4 py-2 px-4 cursor-pointer ${isExpanded ? "bg-sky-200/50 dark:bg-sky-900" : "var(--bg-white)"}`}
                        >
                          {/* Expand icon */}
                          <div className="flex items-center text-gray-500">
                            {hasPrevious ? (
                              isExpanded ? (
                                <KeyboardArrowUp style={{ fontSize: 16 }} />
                              ) : (
                                <KeyboardArrowDown style={{ fontSize: 16 }} />
                              )
                            ) : (
                              <div className="w-[20px]"></div>
                            )}
                          </div>

                          {/* Field name */}
                          <div className="w-[250px]">
                            <span className="text-[12px] text-gray-800">
                              {group.field}
                            </span>
                            {hasPrevious && (
                              <span className="ml-2 font-mono text-primary bg-primary-100 px-2 py-1 rounded-lg text-[10px]">
                                {group.logs.length - 1}x
                              </span>
                            )}
                          </div>

                          {/* Old → New */}
                          <div className="flex flex-1 items-center gap-4">
                            <div className="text-[12px]  w-[230px] ">
                              <div className="text-gray-500">
                                Previous Value
                              </div>
                              <span className="text-red-500 overflow-hidden text-ellipsis ">
                                {latest.oldValue || "—"}
                              </span>
                            </div>
                            <span className="text-gray-500 w-[20px]">→</span>
                            <div className="text-[12px] !w-[230px] ">
                              <div className="text-gray-500">Current Value</div>
                              <span className="text-green-600 overflow-hidden text-ellipsis">
                                {latest.newValue || "—"}
                              </span>
                            </div>
                          </div>

                          {/* Changed by + date */}
                          <div className="text-right flex flex-col gap-1">
                            <span className="text-[11px] text-gray-500 font-bold">
                              {latest.changedBy?.userName || "—"}
                            </span>
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                              {latest.changedOn
                                ? formatDateTime(latest.changedOn)
                                : "—"}
                            </span>
                          </div>
                        </div>

                        {/* History entries */}
                        <MaterialModule.Collapse
                          in={isExpanded}
                          unmountOnExit
                          className="!bg-white"
                        >
                          <div className="bg-head px-8 pt-0 border-t border-gray-200">
                            {group.logs.slice(1).map((log: any, j: number) => (
                              <div
                                key={log.id || `${group.field}-${j}`}
                                className={`flex items-center gap-4 p-2 relative ${j < group.logs.length - 2 ? "border-b border-gray-200" : "none"}`}
                              >
                                {/* timeline dot */}
                                <div className="text-[10px] text-gray-500"></div>

                                {/* Field (muted) */}
                                <div className="w-[250px]">
                                  <span className="text-[11px] text-gray-500">
                                    {group.field}
                                  </span>
                                </div>

                                {/* Old → New */}
                                <div className="flex flex-1 items-center gap-4">
                                  <span className="text-[10px] text-gray-500 whitespace-nowrap w-[225px] overflow-hidden text-ellipsis">
                                    {log.oldValue || "—"}
                                  </span>
                                  <span className="text-gray-500 w-[20px]">
                                    →
                                  </span>
                                  <span className="text-[10px] text-gray-500 whitespace-nowrap w-[225px] overflow-hidden text-ellipsis">
                                    {log.newValue || "—"}
                                  </span>
                                </div>

                                {/* Changed by + date */}
                                <div className="text-right flex flex-col gap-1">
                                  <span className="text-[11px] text-gray-500 font-bold">
                                    {log.changedBy?.userName || "—"}
                                  </span>
                                  <span className="text-[10px] text-gray-500 whitespace-nowrap">
                                    {log.changedOn
                                      ? formatDateTime(log.changedOn)
                                      : "—"}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </MaterialModule.Collapse>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </MaterialModule.DialogContent>
        <MaterialModule.DialogActions className="!px-4 !py-2">
          <Button
            variant="outlined"
            className="!text-gray-800 !border-gray-200"
            onClick={() => setAuditLogOpen(false)}
          >
            Close
          </Button>
        </MaterialModule.DialogActions>
      </MaterialModule.Dialog>

      {/* Policy Configuration Dialog */}
      <MaterialModule.Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <MaterialModule.DialogTitle className="border-b border-gray-200 !p-2">
          <Box className="flex items-center justify-between ml-6">
            <Box>
              <Typography variant="h6">
                {selectedPolicy?.policyName || "Policy Configuration"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedPolicy?.domainCode} • version
                {selectedPolicy?.policyVersion}
              </Typography>
            </Box>
            <IconButton onClick={() => setConfigDialogOpen(false)}>
              <CloseOutlined className="text-gray-800" />
            </IconButton>
          </Box>
        </MaterialModule.DialogTitle>

        <MaterialModule.DialogContent className="!p-4">
          {selectedPolicy?.config ? (
            <Box>
              {Object.entries(selectedPolicy.config).map(([key, value]) => (
                <div
                  key={key}
                  className="p-4 mb-2 bg-head border border-gray-200"
                >
                  <div className="capitalize text-primary font-bold mb-2 text-[12px]">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "monospace",
                      fontSize: "12px",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      lineHeight: 1.6,
                      padding: "12px",
                      borderRadius: "4px",
                    }}
                    className="bg-white border border-gray-200"
                  >
                    {typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </pre>
                </div>
              ))}
            </Box>
          ) : (
            <div>No configuration available</div>
          )}
        </MaterialModule.DialogContent>

        <MaterialModule.DialogActions className="border-t !border-gray-200 !p-4">
          <Button
            variant="contained"
            className="!bg-primary"
            onClick={() => setConfigDialogOpen(false)}
          >
            Close
          </Button>
        </MaterialModule.DialogActions>
      </MaterialModule.Dialog>
    </div>
  );
}