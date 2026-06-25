import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MaterialModule from "../../materialModule";
import { employeeService } from "../../services/modules/employees";
import { useUI } from "../../context/Snackbar";
import { toTitleCase, type Branches, type Department, type EmployeeDetails, type TabPanelProps } from "./type";
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
} from "./const";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { categoryService } from "../../services/modules/category";
import { DynamicSelectWithAdd } from "../../components/SelectField";
import { getCategoryName, getRowColor, getStickyLeftSx, getStickyRightSx, stickyHeaderLeftSx, stickyHeaderRightSx } from "../const";
import { useMasterData } from "../../hooks/useMasterData";
import { MasterSelect } from "../../components/MasterSelect";
import { departmentService } from "../../services/modules/department";
import { branchService } from "../../services/modules/branch";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";
import { AttachFileOutlined, KeyboardArrowDown, KeyboardArrowUp, AssignmentOutlined as PolicyIcon } from "@mui/icons-material";
import { shiftService, type Shift } from "../../services/modules/shifts";
import { auditLogService } from "../../services/modules/auditLogs";
import { Button } from "@mui/material";
import { policyService } from "../../services";
import { PolicyDomain } from "../../types/policy";

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
      {value === index && <MaterialModule.Box sx={{ py: 0 }}>{children}</MaterialModule.Box>}
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
  document
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [department, setDepartments] = useState<Department[]>([]);
  const [branch, setBranches] = useState<Branches[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);
  const [attachmentData, setAttachmentData] = useState<any>({});
  const [attachments, setAttachments] = useState<any>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { id } = useParams();

  const handleSave = async () => {
    try {
      await onSave(editData);
      setIsEditing(false);
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  const getFieldOptions = (fieldKey: string, fieldLabel: string) => {
    if (fieldKey == 'department') {
      return department.map((opt: any) => ({
        value: opt.id,
        label: opt.departmentName,
      }))
    } else if (fieldKey == 'branch') {
      return branch.map((opt: any) => ({
        value: opt.id,
        label: opt.branchName,
      }))
    } else if (fieldKey == 'attendanceSchema') {
      return shifts.map((opt: any) => ({
        value: opt.id,
        label: opt.shiftName,
      }))
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
    if (fieldKey == 'department') {
      return department.map((opt: any) => opt.departmentName)
    }
    if (fieldKey == 'branch') {
      return branch.map((opt: any) => opt.branchName)
    }
    if (fieldKey == 'attendanceSchema') {
      return shifts.map((opt: any) => opt.shiftName)
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
          opt.name.toLowerCase().includes(document.toLowerCase())
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
      const categories = categoriesResponse.data.content || categoriesResponse.data || [];
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
      // await categoryService.getCategoryItems(category.id);
      await refreshCategoryOptions();
      showSnackbar(`"${newOption}" added successfully!`, "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => {
  }, [categoryOptions]);

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

  const getDocuments = async () => {
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
    if (title === 'Employee Details') {
      getMasterData();
    }
    getDocuments();
  }, []);

  const matchedDocs = attachments.filter((opt: any) => {
    const normalizedTitle = title.toLowerCase().replace("details", "").trim();
    const normalizedDocType = opt.documentType?.toLowerCase().trim();
    return normalizedDocType.includes(normalizedTitle);
  })

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
      await employeeService.addAttachment(id, newItem);
      if (newItem.documentType === "Aadhaar Card") {
        try {
          const formData = new FormData();
          formData.append("file", newItem.file);
          await employeeService.getAadhaarDetailsByDoc(formData);
        } catch (error: any) {
          // if (error?.success) {
          // getAadhaar()
          showSnackbar(
            error.message || "OCR unavailable. Please enter Aadhaar number manually.",
            "info"
          );
          // } else {
          //   showSnackbar(
          //     error?.response?.data?.message ||
          //     "Failed to extract Aadhaar details",
          //     "error"
          //   );
          // }
        }
      }
      await getDocuments();
      showSnackbar("Attachment added successfully!", "success"
      );
    } catch (error: any) {
      showSnackbar(error.message || "Failed to add attachment", "error");
    } finally {
      hideSpinner();
    }
  };

  const getAadhaar = async (value: string) => {
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
      showSnackbar(response.message, 'success');
    } catch (error: any) {
      showSnackbar(error.message || "Unable to fetch Aadhaar details", 'error');
    }
  };

  return (
    <div className="mb-6 p-4 dark:bg-white-50 bg-white border rounded-lg mt-3 shadow-sm border-gray-300">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="font-semibold flex items-center gap-2">
            <div className="bg-primary-50 p-1 rounded-lg !text-primary"> {icon} </div>
            <div className="text-primary-dark "> {title}</div>
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
          </div>
          {!isEditing ? (
            <div className="flex items-center gap-1">
              {document &&
                <MaterialModule.Tooltip title="Add Attachments">
                  <MaterialModule.IconButton size="small" onClick={() => handleUploadAttachment()}>
                    <AttachFileOutlined fontSize="small" className="text-gray-800 !w-4" />
                  </MaterialModule.IconButton>
                </MaterialModule.Tooltip>
              }
              <MaterialModule.Tooltip title="Edit">
                <MaterialModule.IconButton size="small" onClick={() => setIsEditing(true)}>
                  <MaterialModule.EditIcon fontSize="small" className="text-gray-800 !w-4" />
                </MaterialModule.IconButton>
              </MaterialModule.Tooltip>
            </div>
          ) : (
            <div className="flex gap-1">
              {document &&
                <MaterialModule.Tooltip title="Add Attachments">
                  <MaterialModule.IconButton size="small" onClick={() => handleUploadAttachment()}>
                    <AttachFileOutlined fontSize="small" className="text-gray-800 !w-4" />
                  </MaterialModule.IconButton>
                </MaterialModule.Tooltip>
              }
              <MaterialModule.Tooltip title="Save Changes">
                <MaterialModule.IconButton size="small" onClick={handleSave} color="success">
                  <MaterialModule.SaveIcon fontSize="small" />
                </MaterialModule.IconButton>
              </MaterialModule.Tooltip>
              <MaterialModule.Tooltip title="Cancel">
                <MaterialModule.IconButton size="small" onClick={handleCancel} color="error">
                  <MaterialModule.CancelIcon fontSize="small" />
                </MaterialModule.IconButton>
              </MaterialModule.Tooltip>

            </div>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4">
          {fields.map((field: any) => {
            return (
              <div key={field.key} className="">
                <div className="text-xs text-gray-500">{field.label}</div>
                {isEditing ? (
                  <div className="mt-2">
                    {field.type === "date" ? (
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                              [field.key]: e ? dayjs(e).format("YYYY-MM-DD") : "",
                            })
                          }
                          disabled={field.disabled || (
                            editData?.aadhaarNumber &&
                            lockableFields.includes(field.key)
                          )}
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
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                [field.key]: e.target.checked,
                              })
                            }
                            className="text-gray-800"
                          />
                        }
                        label=""
                      />
                    ) : field.type === "select" ? (
                      <DynamicSelectWithAdd
                        label=""
                        title={field.label}
                        value={
                          editData[field.key] || ""
                        }
                        disabled={field.disabled || (
                          editData?.aadhaarNumber &&
                          lockableFields.includes(field.key)
                        )}
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
                        showAddButton={(field.key == 'branch' || field.key == 'department' || field.key == 'attendanceSchema') ? false : true}
                      />
                    )
                      // : field.type === "master-select" ? (
                      //   <MasterSelect
                      //     label={field.label}
                      //     value={editData[field.key] || ""}
                      //     onChange={(newValue: any) =>
                      //       handleMasterDataChange(field.key, newValue)
                      //     }
                      //     countries={field.key === "country" ? countries : []}
                      //     states={field.key === "state" ? states : []}
                      //     cities={field.key === "city" ? cities : []}
                      //     disabled={loading}
                      //   // sx={commonSx}
                      //   />
                      // ) 
                      : (
                        <MaterialModule.TextField
                          size="small"
                          value={editData[field.key] || ""}
                          multiline={field.multiline || false}
                          rows={field.multiline ? 3 : 1}
                          disabled={field.disabled || (
                            editData?.aadhaarNumber &&
                            lockableFields.includes(field.key)
                          )}
                          slotProps={{
                            htmlInput: {
                              maxLength: field.key === "aadhaarNumber" ? 12 : undefined,
                            },
                          }}
                          onChange={(e) => {
                            field.key != 'aadhaarNumber' ? setEditData({
                              ...editData,
                              [field.key]: e.target.value,
                            }) : getAadhaar(e.target.value)
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
                          : editData[field.key] || "-"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
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
                        {selectedFile
                          ? selectedFile.name
                          : "Choose File"}
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
                    showAddButton={true}
                  />) : (
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
              handleAddAttachment(attachmentData)
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
  document
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItemData, setNewItemData] = useState<any>({});
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [isEdit, setIsEdit] = useState(false);
  // const [isDoc, setIsDoc] = useState(false);
  const isMasterTab = title === "Addresses";
  const [dialogFields, setDialogFields] = useState(addDialogFields);
  const { id } = useParams();
  const [dialogType, setDialogType] = useState<
    "add" | "edit" | "attachment"
  >("add");

  const handleSave = () => {
    onSave(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(data);
    setIsEditing(false);
  };

  const handleCellChange = (
    rowIndex: number,
    field: string,
    value: any
  ) => {
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

  useEffect(() => {
    setEditData(data);
  }, [data]);

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
          opt.name.toLowerCase().includes(document)
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
      const option = options.find(
        (opt: any) => opt.id === value
      );

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
      const categories = categoriesResponse.data.content || categoriesResponse.data || [];
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
  const {
    countries,
    loading,
    fetchStatesByCountry,
    fetchCitiesByState,
  } = useMasterData(isMasterTab);

  useEffect(() => {
    setEditData(data);
  }, [data]);

  // ====================== LOAD EXISTING DATA ======================
  const loadExistingMasterData = async () => {
    if (!editData?.length) return;
    const newStateMap: any = {};
    const newCityMap: any = {};
    for (let i = 0; i < editData.length; i++) {
      const row = editData[i];
      // LOAD STATES for this row
      if (row.country && !stateOptionsMap[i]) { // Only load if not already loaded
        const statesData = await fetchStatesByCountry(row.country);
        newStateMap[i] = statesData || [];
      }
      // LOAD CITIES for this row
      if (row.state && !cityOptionsMap[i]) { // Only load if not already loaded
        const citiesData = await fetchCitiesByState(row.state);
        newCityMap[i] = citiesData || [];
      }
    }
    // Only update if we have new data
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

  const handleMasterDataChange = async (rowIndex: any, key: string, value: string) => {
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
        // const citiesData = await fetchCitiesByCountry(value);
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
      // NORMAL FIELD
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
      // NORMAL FIELD
      setNewItemData((prev: any) => ({
        ...prev,
        [key]: value,
      }));
    }
  };

  const handleAddAttachment = async (newItem: any) => {
    setAddDialogOpen(false);
    setSelectedFile(null)
    showSpinner();
    try {
      if (!newItem.documentType) {
        showSnackbar('Document Type is Mandatory', 'warning')
        return
      };
      await employeeService.addAttachment(id, newItem);
      showSnackbar("Attachment added successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to add attachment", "error");
    } finally {
      hideSpinner();
    }
  };

  const tablesx = {
    padding: !isEditing ? "8px 16px !important" : "2px 2px 2px 16px !important",
  }

  return (
    <div className="p-4 border rounded-lg mt-3 shadow-sm border-gray-300">
      {
        !data || data.length === 0 &&
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold flex items-center gap-2">
              <div className="bg-primary-50 p-1 rounded-lg !text-primary"> {icon} </div>
              <div className="text-primary-dark "> {title} </div>
            </div>
            <MaterialModule.Button
              startIcon={<MaterialModule.AddIcon sx={{ color: "var(--color-primary)" }} />}
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
          </div>
          <div className="text-center text-gray-500 py-4">
            No {title.toLowerCase()} found
          </div>
        </div>
      }
      {
        (data && data.length > 0) &&
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold flex items-center gap-2">
              <div className="bg-primary-50 p-1 rounded-lg !text-primary"> {icon} </div>
              <div className="text-primary-dark "> {title} </div>
            </div>
            <div className="flex gap-1">
              {!isEditing ? (
                <>
                  <div className="flex items-center gap-1 border border-gray-300 rounded">
                    {document &&
                      <>
                        <MaterialModule.Tooltip title="Add Attachments">
                          <MaterialModule.IconButton size="small" onClick={() => handleUploadAttachment()}>
                            <AttachFileOutlined fontSize="small" className="text-gray-800 !w-4" />
                          </MaterialModule.IconButton>
                        </MaterialModule.Tooltip>
                        <div className="border-l border-gray-300 h-5" />
                      </>
                    }
                    <MaterialModule.Tooltip title="Add">
                      <MaterialModule.Button
                        size="small"
                        onClick={handleAddClick}
                        className="!min-w-0"
                      >
                        <MaterialModule.AddIcon fontSize="small" className="text-gray-800" />
                      </MaterialModule.Button>
                    </MaterialModule.Tooltip>

                    {
                      title != 'Attachments' &&
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
                    }
                  </div>
                </>
              ) : (
                <>
                  {document &&
                    <MaterialModule.Tooltip title="Add Attachments">
                      <MaterialModule.IconButton size="small" onClick={() => handleUploadAttachment()}>
                        <AttachFileOutlined fontSize="small" className="text-gray-800 !w-4" />
                      </MaterialModule.IconButton>
                    </MaterialModule.Tooltip>

                  }
                  <MaterialModule.Tooltip title="Save Changes">
                    <MaterialModule.IconButton size="small" onClick={handleSave} color="primary">
                      <MaterialModule.SaveIcon fontSize="small" />
                    </MaterialModule.IconButton>
                  </MaterialModule.Tooltip>

                  <MaterialModule.Tooltip title="Cancel">
                    <MaterialModule.IconButton size="small" onClick={handleCancel} color="error">
                      <MaterialModule.CancelIcon fontSize="small" />
                    </MaterialModule.IconButton>
                  </MaterialModule.Tooltip>

                </>
              )}
            </div>
          </div>

          <div>
            <MaterialModule.TableContainer component={MaterialModule.Paper} elevation={0} className="border border-gray-200">
              <MaterialModule.Table>
                <MaterialModule.TableHead className="bg-gray-100">
                  <MaterialModule.TableRow>
                    <MaterialModule.TableCell sx={{
                      ...stickyHeaderLeftSx,
                      minWidth: "70px",
                    }}>S No</MaterialModule.TableCell>
                    {columns.map((col: any) => (
                      <MaterialModule.TableCell key={col.key} sx={{
                        background: "#f3f4f6",
                        minWidth: "180px",
                      }}>{col.label}</MaterialModule.TableCell>
                    ))}
                    {(isEditing || title == 'Attachments') && <MaterialModule.TableCell sx={{
                      ...stickyHeaderRightSx,
                      minWidth: "100px",
                    }}>Actions</MaterialModule.TableCell>}
                  </MaterialModule.TableRow>
                </MaterialModule.TableHead>
                <MaterialModule.TableBody className="bg-white-50">
                  {editData.map((row: any, rowIndex: number) => (
                    <MaterialModule.TableRow key={row.id || rowIndex} sx={getRowColor(rowIndex)}>
                      <MaterialModule.TableCell sx={{
                        ...tablesx,
                        ...getStickyLeftSx(rowIndex),
                        minWidth: "70px",
                      }}>{rowIndex + 1}</MaterialModule.TableCell>
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
                            col.type === "select" ? (
                              <DynamicSelectWithAdd
                                label=""
                                title={col.label}
                                value={
                                  col.options ? col.options.find(
                                    (opt: string) =>
                                      opt.toLowerCase() === String(row[col.key]).toLowerCase()
                                  ) || "" : getOptionNameFromId(col.key, row[col.key]) || ""
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
                                options={col.options ? col.options : getSelectOptions(col.key, col.label)}
                                onAddOption={(newOption) =>
                                  handleAddOption(col.key, newOption)
                                }
                                showAddButton={(col.key == 'nomineeName' || col.options) ? false : true}
                                sx={{
                                  ...commonSx, "& .MuiSelect-select": {
                                    padding: "5px !important",
                                    width: "150px !important"
                                  },
                                }}
                              />
                            ) : col.type === "date" ? (
                              <MaterialModule.TextField
                                size="small"
                                type="date"
                                value={row[col.key] || ""}
                                onChange={(e) =>
                                  handleCellChange(
                                    rowIndex,
                                    col.key,
                                    e.target.value,
                                  )
                                }
                                fullWidth
                                sx={{
                                  "& .MuiInputBase-root": {
                                    fontSize: "12px",
                                    minHeight: "32px",
                                  },
                                  "& .MuiInputBase-input": {
                                    padding: "5px 10px",
                                  },
                                }}
                              />
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
                                type={
                                  col.key
                                }
                                countries={countries}
                                states={stateOptionsMap[rowIndex] || []}
                                cities={cityOptionsMap[rowIndex] || []}
                                value={row[col.key] || ""}
                                onChange={(newValue: any) =>
                                  handleMasterDataChange(
                                    rowIndex,
                                    col.key,
                                    newValue
                                  )
                                }
                                disabled={loading}
                                // label={col.label + "j"}
                                sx={{
                                  ...commonSx, "& .MuiSelect-select": {
                                    padding: "5px !important",
                                    width: "150px !important"
                                  },
                                }}
                              />
                            ) : (
                              <MaterialModule.TextField
                                size="small"
                                value={row[col.key] || ""}
                                onChange={(e) =>
                                  handleCellChange(
                                    rowIndex,
                                    col.key,
                                    e.target.value,
                                  )
                                }
                                fullWidth
                                variant="outlined"
                                sx={{
                                  "& .MuiInputBase-root": {
                                    fontSize: "12px",
                                    minHeight: "auto",
                                  },
                                  "& .MuiInputBase-input": {
                                    padding: "5px",
                                    width: "150px !important"
                                  },
                                }}
                              />
                            )
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
                              ) : (col.type === "select" || col.type === 'master-select') ? (
                                col.options ? toTitleCase(row[col.key]) : getOptionNameFromId(col.key, row[col.key])
                              ) : (
                                row[col.key] || "-"
                              )}
                            </span>
                          )}
                        </MaterialModule.TableCell>
                      ))}
                      {isEditing ? (
                        <MaterialModule.TableCell sx={{
                          ...tablesx,
                          ...getStickyRightSx(rowIndex),
                          minWidth: "50px",
                        }}>
                          <MaterialModule.IconButton
                            size="small"
                            onClick={() => handleDeleteRow(rowIndex)}
                            color="error"
                          >
                            <MaterialModule.DeleteIcon fontSize="small" />
                          </MaterialModule.IconButton>
                        </MaterialModule.TableCell>
                      ) : null}
                      {
                        title == 'Attachments' &&
                        <MaterialModule.TableCell sx={{
                          ...tablesx,
                          ...getStickyRightSx(rowIndex),
                          minWidth: "50px",
                        }}>
                          <MaterialModule.IconButton
                            size="small"
                            onClick={() => { handleEditClick(row); }}
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
                      }
                    </MaterialModule.TableRow>
                  ))}
                </MaterialModule.TableBody>
              </MaterialModule.Table>
            </MaterialModule.TableContainer>
          </div>
        </div>
      }

      <MaterialModule.Dialog
        open={addDialogOpen}
        onClose={() => { setAddDialogOpen(false); setSelectedFile(null); setNewItemData({}) }}
        maxWidth="sm"
        sx={commonsx}
      >
        <div className="text-gray-800 !border-b !p-2 flex items-center justify-between !border-gray-200">
          <span className="ml-4">
            {dialogType === "attachment"
              ? "Upload Document"
              : dialogType === "edit"
                ? `Edit ${title}`
                : `Add ${title}`}
          </span>
          <MaterialModule.IconButton onClick={() => {
            setAddDialogOpen(false);
            setSelectedFile(null);
            setNewItemData({})
          }}>
            <MaterialModule.CloseOutlined className="text-gray-800" />
          </MaterialModule.IconButton>
        </div>
        <MaterialModule.DialogContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {dialogFields.map((field: any) => (
              <div key={field.key} className="w-[220px]">
                {field.type === "date" ? (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                            String(newItemData[field.key] || "").toLowerCase()
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
                    options={field.options ? field.options : getSelectOptions(field.key, field.label)}
                    onAddOption={(newOption) =>
                      handleAddOption(field.key, newOption)
                    }
                    showAddButton={(field.key == 'nomineeName' || field.options) ? false : true}
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
                  <div style={{ minWidth: "200px" }}>
                    <MasterSelect
                      type={
                        field.key
                      }
                      countries={countries}
                      states={stateOptionsMap["new"] || []}
                      cities={cityOptionsMap["new"] || []}
                      value={newItemData[field.key] || ""}
                      onChange={(newValue: any) =>
                        handleMasterDataChange(
                          undefined,
                          field.key,
                          newValue
                        )
                      }
                      disabled={loading}
                      label={field.label}
                      sx={commonSx}
                    />
                  </div>
                ) : field.type === "file" ? (
                  <>
                    <input
                      accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
                      style={{ display: 'none' }}
                      id={`file-upload-${field.key}`}
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setNewItemData({
                            ...newItemData,
                            [field.key]: file,
                            documentName: file.name
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
                    disabled={field.disabled}
                    label={field.label}
                    value={newItemData[field.key] || ""}
                    onChange={(e) =>
                      setNewItemData({
                        ...newItemData,
                        [field.key]: e.target.value,
                      })
                    }
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
              setAddDialogOpen(false); setSelectedFile(null);
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
            {
              dialogType === "attachment"
                ? "Upload"
                : dialogType === "edit"
                  ? "Update"
                  : "Add"
            }
          </MaterialModule.Button>
        </MaterialModule.DialogActions>
      </MaterialModule.Dialog>
    </div>
  );
};

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [employee, setEmployee] = useState<any>();
  const [tabValue, setTabValue] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<Record<string, any[]>>(
    {},
  );
  const [categories, setCategories] = useState<Record<string, any[]>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Policy tab state
  const [empPolicies, setEmpPolicies] = useState<any[]>([]);
  const [empPolicyHistory, setEmpPolicyHistory] = useState<any[]>([]);
  const [effectivePolicies, setEffectivePolicies] = useState<Record<string, any>>({});
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policySection, setPolicySection] = useState<'effective' | 'assigned' | 'history'>('effective');

  const tabs = [
    { label: "Personal Info", icon: <MaterialModule.Person2Outlined /> },
    { label: "Addresses", icon: <MaterialModule.LocationIcon /> },
    { label: "Qualifications", icon: <MaterialModule.SchoolIcon /> },
    { label: "Employee Details", icon: <MaterialModule.Person2TwoTone /> },
    { label: "Training Details", icon: <MaterialModule.AccountBalanceIcon /> },
    { label: "Previous Employment", icon: <MaterialModule.WorkHistoryIcon /> },
    { label: "Identification Details", icon: <MaterialModule.WorkHistoryIcon /> },
    { label: "Family Details", icon: <MaterialModule.FamilyIcon /> },
    { label: "Nominations", icon: <MaterialModule.AccountBalanceIcon /> },
    { label: "Attachments", icon: <MaterialModule.AttachmentIcon /> },
    { label: "Policies", icon: <PolicyIcon /> },
  ];

  const fetchEmployeeDetails = async () => {
    showSpinner();
    try {
      const response: any = await employeeService.getEmployeeById(id);
      setEmployee(response.data);
    } catch (error: any) {
      showSnackbar(error.message || "Failed to load employee details", "error");
      navigate("/employees");
    } finally {
      hideSpinner();
    }
  };

  const fetchCategoryOptions = async () => {
    try {
      const response: any = await categoryService.getCategories();
      const categories = response.data.content || response.data || [];
      setCategories(categories);
      const optionsMap: Record<string, any[]> = {};
      for (const category of categories) {
        const itemsResponse: any = await categoryService.getCategoryItems(
          category.id,
        );
        optionsMap[category.categoryName] = itemsResponse.data.content || itemsResponse.data || [];
      }
      setCategoryOptions(optionsMap);
    } catch (error) {
      console.error("Failed to fetch category options:", error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployeeDetails();
      fetchCategoryOptions();
    }
  }, [id]);

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
      const payload = {
        firstName: updatedData.firstName,
        lastName: updatedData.lastName,
        nickName: updatedData.nickName,
        genderId: updatedData.genderId,
        dateOfBirth: updatedData.dateOfBirth,
        birthday: updatedData.birthday,
        mobileNumber: updatedData.mobileNumber,
        emailAddress: updatedData.emailAddress,
        personalEmailAddress: updatedData.personalEmailAddress,
        bloodGroupId: updatedData.bloodGroupId,
        nationalityId: updatedData.nationalityId,
        religionId: updatedData.religionId,
        maritalStatusId: updatedData.maritalStatusId,
        marriageDate: updatedData.marriageDate,
        fathersName: updatedData.fathersName,
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
        managerId: updatedData.reportingManager,
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
        midNo: updatedData.midNo,
        oldIdNo: updatedData.oldIdNo,
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
              updatedData.backgroundVerificationCompletedOn
            ).toISOString()
            : null,
        backgroundVerificationIndicator: updatedData.backgroundVerificationIndicator,
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
        template: updatedData.templateId
      };
      if (Object.keys(payload).length) {
        await employeeService.updateEmployee(id, payload);
        await fetchEmployeeDetails();
        showSnackbar("Personal information updated successfully!", "success");
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const originalItem = originalData.find((orig: any) => orig.id === item.id);
        if (
          originalItem &&
          JSON.stringify(originalItem) !== JSON.stringify(item)
        ) {
          const matchValue = (originalItem.relationship == item.relationship && originalItem.relationshipId == item.relationshipId) ?
            originalItem.relationshipId : item.relationship;
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
            id,
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
      await employeeService.addEmergencyContact(id, newItem);
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
          await employeeService.deleteEmergencyContact(id, itemId);
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
        const originalItem = originalData.find((orig: any) => orig.id === item.id);
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
          };
          await employeeService.updateAddress(id, item.id, updatedItem);
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
      await employeeService.addAddress(id, newItem);
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
          await employeeService.deleteAddress(id, itemId);
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
        const originalItem = originalData.find((orig: any) => orig.id === item.id);
        if (
          originalItem &&
          JSON.stringify(originalItem) !== JSON.stringify(item)
        ) {
          const matchValue = (originalItem.qualificationType == item.qualificationType && originalItem.qualificationTypeId == item.qualificationTypeId) ?
            originalItem.qualificationTypeId : item.qualificationType;
          const matchValue1 = (originalItem.qualificationArea == item.qualificationArea && originalItem.qualificationAreaId == item.qualificationAreaId) ?
            originalItem.qualificationAreaId : item.qualificationArea;
          const updatedItem = {
            qualificationTypeId: matchValue,
            qualificationAreaId: matchValue1,
            institution: item.institution,
            boardUniversity: item.boardUniversity,
            yearOfPassing: Number(item.yearOfPassing),
            percentage: Number(item.percentage),
            grade: item.grade,
          };
          await employeeService.updateQualification(id, item.id, updatedItem);
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

      await employeeService.addQualification(id, newItem);
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
          await employeeService.deleteQualification(id, itemId);
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
        managerId: updatedData.reportingManager,
        bandId: updatedData.bandId,
        joiningDate: updatedData.joiningDate,
        confirmationDate: updatedData.confirmationDate,
        probationPeriod: Number(updatedData.probationPeriod),
        noticePeriod: Number(updatedData.noticePeriod),
        attendanceSchemaId: updatedData.attendanceSchemaId,
        vehicleTypeId: updatedData.vehicleTypeId,
        hostel: updatedData.hostel,
        // currentCompanyExperience: updatedData.currentCompanyExperience,
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
        midNo: updatedData.midNo,
        oldIdNo: updatedData.oldIdNo,
        relievedDate: updatedData.relievedDate,
        template: updatedData.templateId
      }
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

  //ELIGIBILITY INFO
  const updateEligibilityInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        pfEligible: updatedData.pfEligible || employee.pfEligible,
        excessEpfEligible: updatedData.excessEpfEligible || employee.excessEpfEligible,
        excessEpsEligible: updatedData.excessEpsEligible || employee.excessEpsEligible,
        existingEpsMember: updatedData.existingEpsMember || employee.existingEpsMember,
        esiEligible: updatedData.esiEligible || employee.esiEligible,
        lwfCovered: updatedData.lwfCovered || employee.lwfCovered,
        esiNumber: updatedData.esiNumber || employee.esiNumber,
        esiJoiningDate: updatedData.esiJoiningDate || employee.esiJoiningDate,
        esiRelievingDate: updatedData.esiRelievingDate || employee.esiRelievingDate,
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
              updatedData.backgroundVerificationCompletedOn
            ).toISOString()
            : null,
        backgroundVerificationIndicator: updatedData.backgroundVerificationIndicator,
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
        const originalItem = originalData.find((orig: any) => orig.id === item.id);
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
            conductedBy: item.conductedBy
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
        const originalItem = originalData.find((orig: any) => orig.id === item.id);
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
            // "referenceName": item.referenceName,
            // "referenceContact": item.referenceContact
          };
          await employeeService.updatePreviousEmployment(
            id,
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
      await employeeService.addPreviousEmployment(
        id,
        newItem,
      );
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
          await employeeService.deletePreviousEmployment(id, itemId);
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
        const originalItem = originalData.find((orig: any) => orig.id === item.id);
        if (originalItem && JSON.stringify(originalItem) !== JSON.stringify(item)) {
          const matchValue = (originalItem.pfScheme == item.pfScheme && originalItem.pfSchemeId == item.pfSchemeId) ?
            originalItem.pfSchemeId : item.pfScheme;
          const updatedItem = {
            "pfNumber": item.pfNumber,
            "uan": item.uan,
            "pfSchemeId": matchValue,
            "fromDate": item.fromDate,
            "toDate": item.toDate,
            "remarks": item.remarks,
            "current": item.current
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
    // const aadhaarNumber = updatedData.aadhaarNumber.replace(/\D/g, "");
    // if (aadhaarNumber.length !== 12) {
    //   showSnackbar('Aadhaar Number should be in 12 digits','info');
    //   return;
    // };
    showSpinner();
    try {
      const payload = {
        panNumber: updatedData.panNumber || employee.panNumber,
        aadhaarEnrolmentNo: updatedData.aadhaarEnrolmentNo || employee.aadhaarEnrolmentNo,
        nameAsOnAadhaar: updatedData.nameAsOnAadhaar || employee.nameAsOnAadhaar,
        aadhaarNumber: updatedData.aadhaarNumber || employee.aadhaarNumber,
        universalAccountNumber: updatedData.universalAccountNumber || employee.universalAccountNumber,
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
        insuranceNumber: updatedData.insuranceNumber || employee.insuranceNumber,
        nameInInsurance: updatedData.nameInInsurance || employee.nameInInsurance,
        insuranceValidFrom: updatedData.insuranceValidFrom || employee.insuranceValidFrom,
        insuranceValidTo: updatedData.insuranceValidTo || employee.insuranceValidTo,
      };
      await employeeService.updateIdentityInfo(id, payload);
      await fetchEmployeeDetails();
      showSnackbar("Identification details updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  //ESI INFO
  // const updateESIInfo = async (updatedData: any) => {
  //   showSpinner();
  //   try {
  //     const payload = {
  //       esiNumber: updatedData.esiNumber,
  //       esiJoiningDate: updatedData.esiJoiningDate,
  //       esiRelievingDate: updatedData.esiRelievingDate,
  //     };
  //     await employeeService.updateEligibilityInfo(id, payload);
  //     await fetchEmployeeDetails()
  //     showSnackbar("Bank details updated successfully!", "success");
  //   } catch (error: any) {
  //     showSnackbar(error.message, "error");
  //   } finally {
  //     hideSpinner();
  //   }
  // };

  // Family Members
  const handleUpdateFamilyMembers = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.familyMembers || [];
      for (const item of updatedData) {
        const originalItem = originalData.find((orig: any) => orig.id === item.id);
        if (originalItem && JSON.stringify(originalItem) !== JSON.stringify(item)) {
          const matchValue = (originalItem.relationship == item.relationship && originalItem.relationshipId == item.relationshipId) ?
            originalItem.relationshipId : item.relationship;
          const matchGender = (originalItem.gender == item.gender && originalItem.genderId == item.genderId) ?
            originalItem.genderId : item.gender;
          const matchBg = (originalItem.bloodGroup == item.bloodGroup && originalItem.bloodGroupId == item.bloodGroupId) ?
            originalItem.bloodGroupId : item.bloodGroup;
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
          await employeeService.updateFamilyMember(id, item.id, updatedItem);
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

      await employeeService.addFamilyMember(id, newItem);
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
          await employeeService.deleteFamilyMember(id, itemId);
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
  const [expandedAuditFields, setExpandedAuditFields] = useState<Set<string>>(new Set());

  const [familyMembers, setFamilyMembers] = useState<any[]>([]);

  const getTotalSharePercentage = (
    nominations: any[],
    nominationType: string,
    excludeId?: string
  ) => {
    return nominations
      .filter(
        (item) =>
          item.nominationType === nominationType &&
          item.id !== excludeId
      )
      .reduce(
        (sum, item) => sum + Number(item.sharePercentage || 0),
        0
      );
  };

  const fetchFamilyMembers = async () => {
    try {
      const response: any = await employeeService.getFamilyMembers(id);
      setFamilyMembers(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (id) {
      fetchFamilyMembers();
    }
  }, [id]);

  useEffect(() => {
    if (tabValue === 8) {
      fetchFamilyMembers();
    }
  }, [tabValue])

  useEffect(() => {
    if (tabValue === 9) {
      fetchEmployeeDetails();
    }
  }, [tabValue])

  useEffect(() => {
    if (tabValue !== 10 || !id) return;
    setPolicyLoading(true);
    setPolicyError(null);
    const keyDomains = [PolicyDomain.LEAVE, PolicyDomain.EXPENSE, PolicyDomain.OVERTIME, PolicyDomain.ATTENDANCE, PolicyDomain.PAYROLL];
    Promise.all([
      policyService.getEmployeePolicies(id),
      policyService.getEmployeePolicyHistory(id),
      Promise.all(keyDomains.map(domain =>
        policyService.getEffectivePolicy(id, domain)
          .then((res: any) => ({ domain, data: res.data ?? null }))
          .catch(() => ({ domain, data: null }))
      )),
    ])
      .then(([policiesRes, historyRes, effectiveRes]: any) => {
        setEmpPolicies(policiesRes.data ?? []);
        setEmpPolicyHistory(historyRes.data ?? []);
        const effectiveMap: Record<string, any> = {};
        (effectiveRes as Array<{ domain: string; data: any }>).forEach(({ domain, data }) => {
          if (data) effectiveMap[domain] = data;
        });
        setEffectivePolicies(effectiveMap);
      })
      .catch(() => setPolicyError('Failed to load policy data'))
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
          (item) => item.nominationType === type
        );
        const total = typeItems.reduce(
          (sum, item) =>
            sum + Number(item.sharePercentage || 0),
          0
        );
        if (total > 100) {
          showSnackbar(
            `${type} nomination percentage cannot exceed 100%`,
            "error"
          );
          return;
        }
      }
      const originalData = employee?.nominations || [];
      for (const item of updatedData) {
        const originalItem = originalData.find((orig: any) => orig.id === item.id);
        if (originalItem && JSON.stringify(originalItem) !== JSON.stringify(item)) {
          const payload = {
            "nomineeName": item.nomineeName,
            "sharePercentage": Number(item.sharePercentage),
            "nominationType": item.nominationType
          }
          await employeeService.updateNomination(id, item.id, payload);
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
        newItem.nominationType
      );
      const remaining = 100 - existingTotal;
      if (newItem.sharePercentage > remaining) {
        showSnackbar(
          `Only ${remaining}% remaining for ${newItem.nominationType}`,
          "error"
        );
        return;
      }
      await employeeService.addNomination(id, newItem);
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
          await employeeService.deleteNomination(id, itemId);
          await fetchEmployeeDetails()
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
        showSnackbar('Document Type is Mandatory', 'warning')
        return
      };
      await employeeService.addAttachment(id, newItem);
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
          await employeeService.deleteAttachment(id, itemId);
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

  return (
    <div className="">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <MaterialModule.IconButton
          onClick={() => navigate("/employees")}
          className="!bg-gray-100 !text-gray-800"
        >
          <MaterialModule.ArrowBackIcon />
        </MaterialModule.IconButton>
        <div className="flex-1">
          <div className="font-semibold text-gray-800">Employee Details</div>
          <div className="text-gray-500 text-[12px]">
            Complete information about{" "}
            <span className="font-medium text-primary">{employee.name}</span>
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

              {/* Hover Overlay */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer">
                <MaterialModule.CameraAlt className="!text-white" sx={{ "& svg": { color: "white" } }} />
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
                  label={employee.emailAddress}
                  size="small"
                  variant="outlined"
                  className="text-gray-700"
                />
                <MaterialModule.Chip
                  label={employee.mobileNumber}
                  size="small"
                  variant="outlined"
                  className="text-gray-700"
                />
              </div>
            </div>
          </div>
          <div>
            <Button variant="outlined" className="!text-primary !border-primary" onClick={handleOpenAuditLog}>Audit Log</Button>
          </div>
        </MaterialModule.CardContent>
      </MaterialModule.Card>

      {/* Tabs Navigation */}
      <div className="">
        <MaterialModule.Tabs
          value={tabValue}
          onChange={(_, val) => setTabValue(val)}
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
            />
            <EditableGroup
              title="Eligibility Information"
              icon={<MaterialModule.AccountBalanceIcon />}
              fields={eligibilityFields}
              data={employee}
              onSave={updateEligibilityInfo}
              categoryOptions={categoryOptions}
              categories={categories}
            />
            <EditableGroup
              title="Verification"
              icon={<MaterialModule.VerifiedUserOutlined />}
              fields={VerificationColumns}
              data={employee}
              onSave={updateBackgroundInfo}
              categoryOptions={categoryOptions}
              categories={categories}
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
            />
            <EditableTableGroup
              title="PF Details"
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
            />
            <EditableGroup
              title="Login"
              icon={<MaterialModule.LoginOutlined />}
              fields={loginColumns}
              data={employee}
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
              categories={categories}
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
            />
          </TabPanel>

          {/* Tab 8: Nominations */}
          <TabPanel value={tabValue} index={8}>
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
              />
            ))}
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
            />
          </TabPanel>

          {/* Tab 10: Policies */}
          <TabPanel value={tabValue} index={10}>
            <div className="p-4">
              {/* Section toggle buttons */}
              <div className="flex gap-2 mb-4 border-b border-gray-200 pb-3">
                {([
                  { key: 'effective', label: 'Effective Policies' },
                  { key: 'assigned', label: 'All Assigned Policies' },
                  { key: 'history', label: 'Policy History' },
                ] as const).map(({ key, label }) => (
                  <Button
                    key={key}
                    size="small"
                    variant={policySection === key ? 'contained' : 'outlined'}
                    onClick={() => setPolicySection(key)}
                    className={policySection === key ? '!bg-primary !text-white' : '!text-gray-600 !border-gray-300'}
                    sx={{ textTransform: 'none', borderRadius: 2, px: 2 }}
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
                <MaterialModule.Alert severity="error">{policyError}</MaterialModule.Alert>
              )}

              {!policyLoading && !policyError && (
                <>
                  {/* Effective Policies */}
                  {policySection === 'effective' && (
                    Object.keys(effectivePolicies).length === 0 ? (
                      <MaterialModule.Alert severity="info">No effective policies found for this employee.</MaterialModule.Alert>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(effectivePolicies).map(([domain, policy]: [string, any]) => (
                          <MaterialModule.Card key={domain} variant="outlined" className="!rounded-lg !bg-white">
                            <MaterialModule.CardContent className="!py-3">
                              <div className="flex items-center justify-between mb-2">
                                <MaterialModule.Chip label={domain} size="small" className="!bg-primary !text-white !text-[11px]" />
                                {policy.status && (
                                  <MaterialModule.Chip label={policy.status} size="small" color="success" variant="outlined" />
                                )}
                              </div>
                              <div className="text-[13px] font-medium text-gray-800">
                                {policy.policyName || '—'}
                              </div>
                              {policy.policyCode && (
                                <div className="text-[11px] text-gray-400">{policy.policyCode}</div>
                              )}
                              {policy.effectiveFrom && (
                                <div className="text-[11px] text-gray-500 mt-1">
                                  From: {formatDate(policy.effectiveFrom)}
                                  {policy.effectiveTo ? ` → ${formatDate(policy.effectiveTo)}` : ' — Ongoing'}
                                </div>
                              )}
                            </MaterialModule.CardContent>
                          </MaterialModule.Card>
                        ))}
                      </div>
                    )
                  )}

                  {/* All Assigned Policies */}
                  {policySection === 'assigned' && (
                    empPolicies.length === 0 ? (
                      <MaterialModule.Alert severity="info">No policies assigned to this employee.</MaterialModule.Alert>
                    ) : (
                      <MaterialModule.TableContainer className="bg-white border border-gray-200 rounded-md !max-h-[335px]">
                        <MaterialModule.Table stickyHeader size="small">
                          <MaterialModule.TableHead sx={{ bgcolor: 'action.hover' }}>
                            <MaterialModule.TableRow>
                              <MaterialModule.TableCell>S No</MaterialModule.TableCell>
                              <MaterialModule.TableCell>Policy Name</MaterialModule.TableCell>
                              <MaterialModule.TableCell>Domain</MaterialModule.TableCell>
                              <MaterialModule.TableCell>Version</MaterialModule.TableCell>
                              <MaterialModule.TableCell>Effective From</MaterialModule.TableCell>
                              <MaterialModule.TableCell>Effective To</MaterialModule.TableCell>
                            </MaterialModule.TableRow>
                          </MaterialModule.TableHead>
                          <MaterialModule.TableBody>
                            {empPolicies.map((p: any, index: any) => (
                              <MaterialModule.TableRow key={p.id || index} sx={getRowColor(index)}>
                                <MaterialModule.TableCell>{index + 1}</MaterialModule.TableCell>
                                <MaterialModule.TableCell>{p.policyName || p.name || '—'}</MaterialModule.TableCell>
                                <MaterialModule.TableCell>
                                  <MaterialModule.Chip label={p.domainCode} size="small" variant="outlined" className="!text-gray-800" />
                                </MaterialModule.TableCell>
                                <MaterialModule.TableCell>
                                  <MaterialModule.Chip label={p.policyVersion ? `v${p.policyVersion}` : '—'} size="small" className="!text-gray-800" />
                                </MaterialModule.TableCell>
                                <MaterialModule.TableCell>{p.effectiveFrom ? formatDate(p.effectiveFrom) : '—'}</MaterialModule.TableCell>
                                <MaterialModule.TableCell>{p.effectiveTo ? formatDate(p.effectiveTo) : 'Ongoing'}</MaterialModule.TableCell>
                              </MaterialModule.TableRow>
                            ))}
                          </MaterialModule.TableBody>
                        </MaterialModule.Table>
                      </MaterialModule.TableContainer>
                    )
                  )}

                  {/* Policy History */}
                  {policySection === 'history' && (
                    empPolicyHistory.length === 0 ? (
                      <MaterialModule.Alert severity="info">No policy history found for this employee.</MaterialModule.Alert>
                    ) : (
                      <MaterialModule.TableContainer className="bg-white border border-gray-200 rounded-md !max-h-[335px]">
                        <MaterialModule.Table stickyHeader size="small">
                          <MaterialModule.TableHead sx={{ bgcolor: 'action.hover' }}>
                            <MaterialModule.TableRow>
                              <MaterialModule.TableCell>S No</MaterialModule.TableCell>
                              <MaterialModule.TableCell>Policy Name</MaterialModule.TableCell>
                              <MaterialModule.TableCell>Domain</MaterialModule.TableCell>
                              <MaterialModule.TableCell>Version</MaterialModule.TableCell>
                              <MaterialModule.TableCell>Assigned From</MaterialModule.TableCell>
                              <MaterialModule.TableCell>Assigned To</MaterialModule.TableCell>
                              <MaterialModule.TableCell>Status</MaterialModule.TableCell>
                            </MaterialModule.TableRow>
                          </MaterialModule.TableHead>
                          <MaterialModule.TableBody>
                            {empPolicyHistory.map((h: any, i: number) => (
                              <MaterialModule.TableRow key={h.id ?? i} sx={getRowColor(i)}>
                                <MaterialModule.TableCell>{i + 1}</MaterialModule.TableCell>
                                <MaterialModule.TableCell>{h.policyName || h.name || '—'}</MaterialModule.TableCell>
                                <MaterialModule.TableCell>
                                  <MaterialModule.Chip label={h.domainCode} size="small" variant="outlined" className="!text-gray-800" />
                                </MaterialModule.TableCell>
                                <MaterialModule.TableCell>{h.policyVersion ? `v${h.policyVersion}` : '—'}</MaterialModule.TableCell>
                                <MaterialModule.TableCell>{h.effectiveFrom ? formatDate(h.effectiveFrom) : '—'}</MaterialModule.TableCell>
                                <MaterialModule.TableCell>{h.effectiveTo ? formatDate(h.effectiveTo) : '—'}</MaterialModule.TableCell>
                                <MaterialModule.TableCell>
                                  <MaterialModule.Chip
                                    label={h.status || '—'}
                                    size="small" className="!text-gray-800"
                                    color={h.status === 'ACTIVE' ? 'success' : 'default'}
                                  />
                                </MaterialModule.TableCell>
                              </MaterialModule.TableRow>
                            ))}
                          </MaterialModule.TableBody>
                        </MaterialModule.Table>
                      </MaterialModule.TableContainer>
                    )
                  )}
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
          <div className="font-medium">Audit Log  <span className="text-primary font-bold">({employee.name})</span></div>
          <MaterialModule.IconButton onClick={() => setAuditLogOpen(false)}>
            <MaterialModule.CloseOutlined className="text-gray-800" />
          </MaterialModule.IconButton>
        </div>
        <MaterialModule.DialogContent className="!p-2 border border-gray-200 m-3 bg-gray-200 !overflow-hidden">
          {auditLogs.length === 0 ? (
            <div className="text-center text-gray-400 py-16 text-sm">No audit records found.</div>
          ) : (() => {
            const grouped = Object.entries(
              auditLogs.reduce((acc: Record<string, any[]>, log: any) => {
                const key = log.fieldName || "-";
                if (!acc[key]) acc[key] = [];
                acc[key].push(log);
                return acc;
              }, {})
            ).map(([field, logs]) => ({
              field,
              logs: [...logs].sort((a, b) =>
                new Date(b.changedOn || 0).getTime() - new Date(a.changedOn || 0).getTime()
              ),
            })).sort((a, b) =>
              new Date(b.logs[0]?.changedOn || 0).getTime() - new Date(a.logs[0]?.changedOn || 0).getTime()
            );

            return (
              <div style={{ height: "calc(100vh - 250px)", overflowY: "auto" }}>
                {grouped.map((group) => {
                  const latest = group.logs[0];
                  const isExpanded = expandedAuditFields.has(group.field);
                  const hasPrevious = group.logs.length > 1;

                  return (
                    <div key={group.field} className="border-b border-gray-200 bg-white">
                      {/* Main row */}
                      <div
                        onClick={() => {
                          if (!hasPrevious) return;
                          setExpandedAuditFields((prev) => {
                            const next = new Set(prev);
                            next.has(group.field) ? next.delete(group.field) : next.add(group.field);
                            return next;
                          });
                        }}
                        className={`flex items-center gap-4 py-2 px-4 cursor-pointer ${isExpanded ? "bg-sky-200/50 dark:bg-sky-900" : "var(--bg-white)"}`}>
                        {/* Expand icon */}
                        <div className="flex items-center text-gray-500">
                          {hasPrevious
                            ? isExpanded ? <KeyboardArrowUp style={{ fontSize: 16 }} /> : <KeyboardArrowDown style={{ fontSize: 16 }} />
                            : <div className="w-[20px]"></div>}
                        </div>

                        {/* Field name */}
                        <div className="w-[250px]">
                          <span className="text-[12px] text-gray-800">{group.field}</span>
                          {hasPrevious && (
                            <span className="ml-2 font-mono text-primary bg-primary-100 px-2 py-1 rounded-lg text-[10px]">
                              {group.logs.length - 1}x
                            </span>
                          )}
                        </div>

                        {/* Old → New */}
                        <div className="flex flex-1 items-center gap-4">
                          <div className="text-[12px]  w-[230px] ">
                            <div className="text-gray-500">Previous Value</div>
                            <span className="text-red-500 whitespace-nowrap overflow-hidden text-ellipsis ">{latest.oldValue || "—"}</span>
                          </div>
                          <span className="text-gray-500 w-[20px]">→</span>
                          <div className="text-[12px] w-[230px] ">
                            <div className="text-gray-500">Current Value</div>
                            <span className="text-green-600 whitespace-nowrap overflow-hidden text-ellipsis">
                              {latest.newValue || "—"}
                            </span>
                          </div>
                        </div>

                        {/* Changed by + date */}
                        <div className="text-right flex flex-col gap-1">
                          <span className="text-[11px] text-gray-500 font-bold">{latest.changedBy?.userName || "—"}</span>
                          <span className="text-[10px] text-gray-500 whitespace-nowrap">{latest.changedOn ? formatDateTime(latest.changedOn) : "—"}</span>
                        </div>
                      </div>

                      {/* History entries */}
                      <MaterialModule.Collapse in={isExpanded} unmountOnExit className="!bg-white">
                        <div className="bg-head px-8 pt-0 border-t border-gray-200">
                          {group.logs.slice(1).map((log: any, j: number) => (
                            <div key={log.id || `${group.field}-${j}`}
                              className={`flex items-center gap-4 p-2 relative ${j < group.logs.length - 2 ? "border-b border-gray-200" : "none"}`}
                            >
                              {/* timeline dot */}
                              <div className="text-[10px] text-gray-500"></div>

                              {/* Field (muted) */}
                              <div className="w-[250px]">
                                <span className="text-[11px] text-gray-500">{group.field}</span>
                              </div>

                              {/* Old → New */}
                              <div className="flex flex-1 items-center gap-4">
                                <span className="text-[10px] text-gray-500 whitespace-nowrap w-[225px] overflow-hidden text-ellipsis">{log.oldValue || "—"}</span>
                                <span className="text-gray-500 w-[20px]">→</span>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap w-[225px] overflow-hidden text-ellipsis">{log.newValue || "—"}</span>
                              </div>

                              {/* Changed by + date */}
                              <div className="text-right flex flex-col gap-1">
                                <span className="text-[11px] text-gray-500 font-bold">{log.changedBy?.userName || "—"}</span>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap">{log.changedOn ? formatDateTime(log.changedOn) : "—"}</span>
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
          })()}
        </MaterialModule.DialogContent>
        <MaterialModule.DialogActions className="!px-4 !py-2">
          <Button variant="outlined" className="!text-gray-800 !border-gray-200" onClick={() => setAuditLogOpen(false)}>Close</Button>
        </MaterialModule.DialogActions>
      </MaterialModule.Dialog>
    </div>
  );
}