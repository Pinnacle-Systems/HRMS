import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  Avatar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Box,
  TextField,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  School as SchoolIcon,
  WorkHistory as WorkHistoryIcon,
  FamilyRestroom as FamilyIcon,
  AccountBalance as AccountBalanceIcon,
  AttachFile as AttachmentIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Person2Outlined,
  Person2TwoTone,
  CloseOutlined,
  LoginOutlined,
  ContactEmergencyOutlined,
  LocationOnOutlined,
  SchoolOutlined,
  VerifiedUserOutlined,
  LocalLibraryOutlined,
  WorkHistoryOutlined,
  FlightLandOutlined,
  Diversity3Outlined,
  PeopleOutlineOutlined,
  CameraAlt
} from "@mui/icons-material";
import { employeeService } from "../../services/modules/employees";
import { useUI } from "../../context/Snackbar";
import type { Branches, Department, EmployeeDetails, TabPanelProps } from "./type";
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
  // epfNominationColumns,
  // epiNominationColumns,
  // epsNominationColumns,
  esiColumns,
  familyColumns,
  // gratuityNominationColumns,
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
} from "./const";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { categoryService } from "../../services/modules/category";
import { DynamicSelectWithAdd } from "../../components/SelectField";
import { getCategoryName } from "../const";
import { useMasterData } from "../../hooks/useMasterData";
import { MasterSelect } from "../../components/MasterSelect";
import { departmentService } from "../../services/modules/department";
import { branchService } from "../../services/modules/branch";

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
      {value === index && <Box sx={{ py: 0 }}>{children}</Box>}
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
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [department, setDepartments] = useState<Department[]>([]);
  // const [designation, setDesignations] = useState<Designation[]>([]);
  const [branch, setBranches] = useState<Branches[]>([]);

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
    } else {
      const categoryName = getCategoryName(fieldKey, fieldLabel);
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
    } else if (fieldKey == 'branch') {
      return branch.map((opt: any) => opt.branchName)
    } else {
      const categoryName = getCategoryName(fieldKey, fieldLabel);
      const category = Object.keys(categoryOptions).find(
        (catName) =>
          catName.toLowerCase() === categoryName.toLowerCase() ||
          catName.toLowerCase() === fieldKey.toLowerCase() ||
          catName.toLowerCase() === fieldLabel.toLowerCase(),
      );
      const options = category ? categoryOptions[category] : [];
      return options.map((opt: any) => opt.name);
    }
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

  const getOptionNameFromId = (fieldKey: string, value: string) => {
    if (!value) return " -";
    const options = getFieldOptions(fieldKey, "");
    const option = options.find((opt: any) => opt.value === value);
    return option?.label || value;
  };

  const handleAddOption = async (fieldKey: string, newOption: string) => {
    try {
      showSpinner();
      const categoryName = getCategoryName(fieldKey, "");
      const categoriesResponse: any = await categoryService.getCategories();
      const categories = categoriesResponse.data || [];
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
        code: newOption.toUpperCase().replace(/\s/g, "_"),
        active: true,
      };
      await categoryService.createCategoryItem(category.id, payload);
      await categoryService.getCategoryItems(category.id);
      showSnackbar(`"${newOption}" added successfully!`, "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  useEffect(() => { }, [categoryOptions]);

  const {
    countries,
    states,
    cities,
    loading,
    fetchStatesByCountry,
    fetchCitiesByCountry,
    fetchCitiesByState,
  } = useMasterData();

  const getMasterData = async () => {
    try {
      const deptRes: any = await departmentService.getDepartments();
      setDepartments(deptRes.data.content || deptRes.data || []);
      const branchRes: any = await branchService.getBranches();
      setBranches(branchRes.data.content || branchRes.data || []);
      // const desigRes: any = await categoryService.getCategoryItems("00c4fd3c-4fb6-4d33-932e-80a615a90825");
      // setDesignations(desigRes.data.content || desigRes.data || []);
    } catch (error: any) {
      showSnackbar(error.message, "error");
    }
  };
  useEffect(() => {
    getMasterData();
  }, []);

  const handleMasterDataChange = async (key: string, value: string) => {
    setEditData((prev: any) => ({
      ...prev,
      [key]: value,
    }));

    // Country selected
    if (key === "country") {
      setEditData((prev: any) => ({
        ...prev,
        country: value,
        state: "",
        city: "",
      }));

      await fetchStatesByCountry(value);

      // OPTIONAL
      await fetchCitiesByCountry(value);
    }

    // State selected
    if (key === "state") {
      setEditData((prev: any) => ({
        ...prev,
        state: value,
        city: "",
      }));

      await fetchCitiesByState(value);
    }
  };

  return (
    <div className="mb-6 p-4 border rounded-lg mt-3 shadow-sm border-gray-300">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="font-semibold flex items-center gap-2">
            <div className="bg-primary-50 p-1 rounded-lg !text-primary"> {icon} </div>
            <div className="text-primary-dark "> {title} </div>
          </div>
          {!isEditing ? (
            <IconButton size="small" onClick={() => setIsEditing(true)}>
              <EditIcon fontSize="small" className="text-gray-800" />
            </IconButton>
          ) : (
            <div className="flex gap-1">
              <Tooltip title="Save Changes">
                <IconButton size="small" onClick={handleSave} color="success">
                  <SaveIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Cancel">
                <IconButton size="small" onClick={handleCancel} color="error">
                  <CancelIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                              [field.key]: e ? e.format("YYYY-MM-DD") : "",
                            })
                          }
                          slotProps={{
                            textField: {
                              fullWidth: true,
                            },
                          }}
                        />
                      </LocalizationProvider>
                    ) : field.type === "boolean" ? (
                      <FormControlLabel
                        control={
                          <Switch
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
                        value={
                          getOptionNameFromId(field.key, editData[field.key]) ||
                          ""
                        }
                        onChange={(value) => {
                          const id = getOptionIdFromName(
                            field.key,
                            field.label,
                            value as string,
                          );
                          setEditData((prev: any) => ({
                            ...prev,
                            [field.key]: id,
                          }));
                        }}
                        options={getSelectOptions(field.key, field.label)}
                        onAddOption={(newOption) =>
                          handleAddOption(field.key, newOption)
                        }
                        showAddButton={true}
                      />
                    ) : field.type === "master-select" ? (
                      <MasterSelect
                        label={field.label}
                        value={editData[field.key] || ""}
                        onChange={(newValue: any) =>
                          handleMasterDataChange(field.key, newValue)
                        }
                        countries={field.key === "country" ? countries : []}
                        states={field.key === "state" ? states : []}
                        cities={field.key === "city" ? cities : []}
                        disabled={loading}
                      // sx={commonSx}
                      />
                    ) : (
                      <TextField
                        size="small"
                        value={editData[field.key] || ""}
                        multiline={field.multiline || false}
                        rows={field.multiline ? 3 : 1}
                        disabled={field.disabled}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            [field.key]: e.target.value,
                          })
                        }
                        fullWidth
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-[12px] text-ellipsis overflow-hidden text-gray-800 mt-1">
                    {field.type === "date" && editData[field.key]
                      ? new Date(editData[field.key]).toLocaleDateString()
                      : field.type === "boolean"
                        ? editData[field.key]
                          ? "Yes"
                          : "No"
                        : field.type === "select"
                          ? // (() => {
                          //   const optionsList = getFieldOptions(field.key, field.label);
                          //   const selected = optionsList.find((opt: any) => opt.value === editData[field.key]);
                          //   return selected?.label || editData[field.key] || "-";
                          // })()
                          getOptionNameFromId(field.key, editData[field.key])
                          : editData[field.key] || "-"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
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
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItemData, setNewItemData] = useState<any>({});
  const { showSnackbar, showSpinner, hideSpinner } = useUI();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEdit, setIsEdit] = useState(false);

  const {
    countries,
    // states,
    // cities,
    loading,
    fetchStatesByCountry,
    // fetchCitiesByCountry,
    fetchCitiesByState,
  } = useMasterData();

  useEffect(() => {
    setEditData(data);
  }, [data]);

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
    const initialData: any = {};
    addDialogFields.forEach((field: any) => {
      initialData[field.key] = "";
    });
    setNewItemData(initialData);
    setAddDialogOpen(true);
  };

  const handleEditClick = (row: any) => {
    console.log(row);
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
    const categoryName = getCategoryName(fieldKey, fieldLabel);
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
    const categoryName = getCategoryName(fieldKey, fieldLabel);

    const category = Object.keys(categoryOptions).find(
      (catName) =>
        catName.toLowerCase() === categoryName.toLowerCase() ||
        catName.toLowerCase() === fieldKey.toLowerCase() ||
        catName.toLowerCase() === fieldLabel.toLowerCase(),
    );
    const options = category ? categoryOptions[category] : [];
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

      return option?.name || '-';
    } else {
      const options = getFieldOptions(fieldKey, "");
      const option = options.find((opt: any) => opt.value === value);
      return option?.label || value;
    }
  };

  const handleAddOption = async (fieldKey: string, newOption: string) => {
    try {
      showSpinner();
      const categoryName = getCategoryName(fieldKey, "");
      const categoriesResponse: any = await categoryService.getCategories();
      const categories = categoriesResponse.data.content || categoriesResponse.data || [];
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
        code: newOption.toUpperCase().replace(/\s/g, "_"),
        active: true,
      };
      await categoryService.createCategoryItem(category.id, payload);
      await categoryService.getCategoryItems(category.id);
      showSnackbar(`"${newOption}" added successfully!`, "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to add option", "error");
    } finally {
      hideSpinner();
    }
  };

  // ====================== STATES ======================
  const [stateOptionsMap, setStateOptionsMap] = useState<any>({});
  const [cityOptionsMap, setCityOptionsMap] = useState<any>({});

  // ====================== LOAD EXISTING DATA ======================

  useEffect(() => {
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

    loadExistingMasterData();
  }, [editData]);

  const handleMasterDataChange = async (
    rowIndex: number | undefined,
    key: string,
    value: string
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

  const commonSx = {
    background: "var(--bg-primary)",
    "& .MuiFormHelperText-root": {
      fontSize: "10px",
      marginLeft: 0,
    },
  };

  const commonsx = {
    "& .MuiDialog-paper": {
      width: "500px",
      maxWidth: "500px",
    },
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
            <Button
              startIcon={<AddIcon sx={{ color: "var(--color-primary)" }} />}
              size="small"
              onClick={handleAddClick}
              variant="outlined"
              sx={{
                color: "var(--color-primary)",
                borderColor: "var(--color-primary)",
              }}
            >
              Add {title}
            </Button>
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
                    <Button
                      size="small"
                      onClick={handleAddClick}
                      className="!min-w-0"
                    >
                      <AddIcon fontSize="small" className="text-gray-800" />
                    </Button>
                    {
                      title != 'Attachments' &&
                      <>
                        <div className="border-l border-gray-300 h-5" />
                        <Button
                          size="small"
                          onClick={() => setIsEditing(true)}
                          className="!min-w-0"
                        >
                          <EditIcon
                            fontSize="small"
                            className="text-gray-800 !w-3.5"
                          />
                        </Button>
                      </>
                    }
                  </div>
                </>
              ) : (
                <>
                  <IconButton size="small" onClick={handleSave} color="primary">
                    <SaveIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={handleCancel} color="error">
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            </div>
          </div>

          <TableContainer component={Paper} elevation={0} className="border">
            <Table>
              <TableHead className="bg-gray-100">
                <TableRow>
                  <TableCell>S No</TableCell>
                  {columns.map((col: any) => (
                    <TableCell key={col.key}>{col.label}</TableCell>
                  ))}
                  {(isEditing || title == 'Attachments') && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody className="bg-white-50">
                {editData.map((row: any, rowIndex: number) => (
                  <TableRow key={row.id || rowIndex}>
                    <TableCell sx={tablesx}>{rowIndex + 1}</TableCell>
                    {columns.map((col: any) => (
                      <TableCell
                        key={col.key}
                        className="!text-gray-800"
                        sx={tablesx}
                      >
                        {isEditing ? (
                          col.type === "select" ? (
                            <DynamicSelectWithAdd
                              label=""
                              value={
                                getOptionNameFromId(col.key, row[col.key]) || ""
                              }
                              onChange={(value) => {
                                const id = getOptionIdFromName(
                                  col.key,
                                  col.label,
                                  value as string,
                                );
                                handleCellChange(rowIndex, col.key, id);
                              }}
                              options={getSelectOptions(col.key, col.label)}
                              onAddOption={(newOption) =>
                                handleAddOption(col.key, newOption)
                              }
                              showAddButton={col.key == 'nomineeName' ? false : true}
                              sx={{
                                ...commonSx, "& .MuiSelect-select": {
                                  padding: "5px !important",
                                },
                              }}
                            />
                          ) : col.type === "date" ? (
                            <TextField
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
                            <FormControlLabel
                              control={
                                <Switch
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
                                },
                              }}
                            />
                          ) : (
                            <TextField
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
                              new Date(row[col.key]).toLocaleDateString()
                            ) : col.type === "boolean" ? (
                              row[col.key] ? (
                                <span className="text-green-500">Yes</span>
                              ) : (
                                <span className="text-red-500">No</span>
                              )
                            ) : (col.type === "select" || col.type === 'master-select') ? (
                              getOptionNameFromId(col.key, row[col.key])
                            ) : (
                              row[col.key] || "-"
                            )}
                          </span>
                        )}
                      </TableCell>
                    ))}
                    {isEditing ? (
                      <TableCell >
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRow(rowIndex)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    ) : null}
                    {
                      title == 'Attachments' &&
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => { handleEditClick(row); setIsEdit(true) }}
                          color="primary"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRow(rowIndex)}
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>

                      </TableCell>
                    }
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
      }

      <Dialog
        open={addDialogOpen}
        onClose={() => { setAddDialogOpen(false); setSelectedFile(null); setNewItemData({}) }}
        maxWidth="sm"
        sx={commonsx}
      >
        <div className="text-primary !border-b !p-2 flex items-center justify-between !border-gray-200">
          <span className="ml-4">{isEdit ? 'Edit' : 'Add'} {title}</span>
          <IconButton onClick={() => {
            setAddDialogOpen(false);
            setSelectedFile(null);
            setNewItemData({})
          }}>
            <CloseOutlined />
          </IconButton>
        </div>
        <DialogContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {addDialogFields.map((field: any) => (
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
                          [field.key]: e ? e.format("YYYY-MM-DD") : "",
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
                      getOptionNameFromId(
                        field.key,
                        newItemData[field.key],
                      ) || ""
                    } // Show name
                    onChange={(value) => {
                      const id = getOptionIdFromName(
                        field.key,
                        field.label,
                        value as string,
                      ); // Convert name to ID
                      setNewItemData({ ...newItemData, [field.key]: id });
                    }}
                    options={getSelectOptions(field.key, field.label)}
                    onAddOption={(newOption) =>
                      handleAddOption(field.key, newOption)
                    }
                    showAddButton={field.key == 'nomineeName' ? false : true}
                    required={field.required}
                  />
                ) : field.type === "boolean" ? (
                  <FormControlLabel
                    control={
                      <Switch
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
                      id="file-upload"
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
                    <label htmlFor="file-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        fullWidth
                        startIcon={<AttachmentIcon />}
                      >
                        {selectedFile ? selectedFile.name : "Choose File"}
                      </Button>
                    </label>
                    {selectedFile && (
                      <div className="mt-2 text-[12px]">
                        Size: {(selectedFile.size / 1024).toFixed(2)} KB
                      </div>
                    )}
                  </>
                ) : (
                  <TextField
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
        </DialogContent>
        <DialogActions className="!p-3 !border-t !border-gray-200">
          <Button
            onClick={() => {
              setAddDialogOpen(false); setSelectedFile(null);
              setNewItemData({})
            }}
            variant="outlined"
            className="!text-gray-800 !border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddConfirm}
            variant="contained"
            className="!bg-primary"
          >
            {isEdit ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<Record<string, any[]>>(
    {},
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
      const response: any = await categoryService.getCategories({ size: 100 });
      const categories = response.data.content || response.data || [];
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

  // ==================== PATCH UPDATES ====================
  const getChanges = (
    original: any,
    updated: any,
    fieldMap: Record<string, string>,
  ) => {
    const changes: any = {};
    Object.entries(fieldMap).forEach(([apiKey, formKey]) => {
      if (updated[formKey] !== original[formKey]) {
        changes[apiKey] = updated[formKey];
      }
    });
    return changes;
  };

  const updatePersonalInfo = async (updatedData: any) => {
    showSpinner();
    try {
      // const payload = {
      //   dateOfBirth: updatedData.dateOfBirth,
      //   birthday: updatedData.birthday,
      //   marriageDate: updatedData.marriageDate,
      //   // mobileNumber: updatedData.mobileNumber,
      //   nickName: updatedData.nickName,
      //   genderId: updatedData.gender,
      //   bloodGroupId: updatedData.bloodGroup,
      //   nationalityId: updatedData.nationality,
      //   religionId: updatedData.religion,
      //   maritalStatusId: updatedData.maritalStatus,
      //   spouseName: updatedData.spouseName,
      //   fathersName: updatedData.fatherName,
      //   personalEmailAddress: updatedData.personalEmail,
      //   height: Number(updatedData.height),
      //   weight: Number(updatedData.weight),
      //   physicallyChallenged: updatedData.physicallyChallenged,
      //   internationalEmployee: updatedData.internationalEmployee,
      //   disabilityTypeId: updatedData.disabilityType,
      //   employeeReferenceNumber: updatedData.employeeReferenceNumber,
      //   // extensionNumber: updatedData.extensionNumber,
      // };
      const fieldMap = {
        dateOfBirth: "dateOfBirth",
        birthday: "birthday",
        marriageDate: "marriageDate",
        nickName: "nickName",
        genderId: "gender",
        bloodGroupId: "bloodGroup",
        nationalityId: "nationality",
        religionId: "religion",
        maritalStatusId: "maritalStatus",
        spouseName: "spouseName",
        fathersName: "fatherName",
        personalEmailAddress: "personalEmail",
        height: "height",
        weight: "weight",
        physicallyChallenged: "physicallyChallenged",
        internationalEmployee: "internationalEmployee",
        disabilityTypeId: "disabilityType",
        employeeReferenceNumber: "employeeReferenceNumber",
      };
      const payload = getChanges(employee, updatedData, fieldMap);
      if (payload.height) payload.height = Number(payload.height);
      if (payload.weight) payload.weight = Number(payload.weight);
      if (Object.keys(payload).length) {
        await employeeService.updatePersonalInfo(id!, payload);
        // setEmployee((prev) => (prev ? { ...prev, ...updatedData } : null));
        showSnackbar("Personal information updated successfully!", "success");
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update", "error");
    } finally {
      hideSpinner();
    }
  };

  const updateAdminInfo = async (updatedData: any) => {
    showSpinner();
    try {
      // const payload = {
      // employeeId: updatedData.employeeId,
      // joiningDate: updatedData.joiningDate,
      // confirmationDate: updatedData.confirmationDate,
      // probationPeriod: Number(updatedData.probationPeriod),
      // noticePeriod: Number(updatedData.noticePeriod),
      // departmentId: updatedData.department,
      // designationId: updatedData.designation,
      // gradeId: updatedData.grade,
      // branchId: updatedData.branch,
      // bandId: updatedData.band,
      // managerId: updatedData.reportingManager,
      // empTypeId: updatedData.employeeType,
      // // salaryType: updatedData.salaryType,
      // // salaryPaymentMode: updatedData.salaryPaymentMode,
      // attendanceSchemaId: updatedData.attendanceSchema,
      // // bonusPolicy: updatedData.bonusPolicy,
      // // otPolicy: updatedData.otPolicy,
      // // otAmount: updatedData.otAmount,
      // hostel: updatedData.hostel,
      // // vehicle: updatedData.vehicle,
      // // vehicleTypeId:updatedData.vehicleType,
      // // migrant: updatedData.migrant,
      // // exService: updatedData.exService,
      // // firstAidTrainee: updatedData.firstAidTrainee,
      // // category: updatedData.category,
      // // employeeIdentity: updatedData.employeeIdentity,
      // // employeeReferenceNumber: updatedData.employeeReferenceNumber,
      // referredBy: updatedData.referredBy,
      // // monthlySalary: updatedData.monthlySalary,
      // employeeStatusId: updatedData.employeeStatus,
      // remarks: updatedData.remarks,
      // idCardNo: updatedData.idCardNo,
      // midNo: updatedData.midNo,
      // oldIdNo: updatedData.oldIdNo,
      // };
      const fieldMap = {
        departmentId: "department",
        employeeStatusId: "employeeStatus",
        attendanceSchemaId: "attendanceSchema",
        empTypeId: "employeeType",
        managerId: "reportingManager",
        bandId: "band",
        branchId: "branch",
        gradeId: "grade",
        designationId: "designation",
        joiningDate: "joiningDate",
        confirmationDate: "confirmationDate",
        hostel: 'hostel',
        referredBy: "referredBy",
        noticePeriod: "noticePeriod",
        probationPeriod: "probationPeriod"
      };
      const payload = getChanges(employee, updatedData, fieldMap);
      if (payload.probationPeriod) payload.probationPeriod = Number(payload.probationPeriod);
      if (payload.noticePeriod) payload.noticePeriod = Number(payload.noticePeriod);
      console.log(payload);
      if (Object.keys(payload).length) {
        await employeeService.updateAdminInfo(id!, payload);
        // setEmployee((prev) => (prev ? { ...prev, ...updatedData } : null));
        showSnackbar("Employee details updated successfully!", "success");
      }
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update", "error");
    } finally {
      hideSpinner();
    }
  };

  const updateBankInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const fieldMap = {
        bankAccountNumber: "bankAccountNumber",
        bankName: "bankName",
        bankBranch: "bankBranch",
        ifscCode: "ifscCode",
        nameAsPerBankRecords: "nameAsPerBankRecords",
        bankAccountTypeId: "bankAccountType",
        ddPayableAt: "ddPayableAt",
        salaryPaymentModeId: "salaryPaymentMode",
        salaryTypeId: "salaryType",
        iban: "iban",
      };
      const payload = getChanges(employee, updatedData, fieldMap);
      if (Object.keys(payload).length) {
        await employeeService.updateBankDetails(id!, payload);
        // setEmployee((prev) => (prev ? { ...prev, ...updatedData } : null));
        showSnackbar("Bank details updated successfully!", "success");
      }
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const updatePFInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        esiNumber: updatedData.esiNumber,
        //   esiJoiningDate: updatedData.esiJoiningDate,
        //   esiRelievingDate: updatedData.esiRelievingDate,
      };
      await employeeService.updateEligibilityInfo(id!, payload);
      await fetchEmployeeDetails()
      showSnackbar("Bank details updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const updateIdentityInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        panNumber: updatedData.panNumber,
        aadhaarEnrolmentNo: updatedData.aadhaarEnrolmentNo,
        nameAsOnAadhaar: updatedData.nameAsOnAadhaar,
        aadhaarNumber: updatedData.aadhaarNumber,
        universalAccountNumber: updatedData.uan,
        pranNumber: updatedData.pranNumber,
        nameAsPerPran: updatedData.nameAsPerPran,
        passportNumber: updatedData.passportNumber,
        visaType: updatedData.visaType,
        visaExpiry: updatedData.visaExpiry,
        loginIpAddress: updatedData.loginIpAddress,
        loginUserName: updatedData.loginUserName,
        //   nameInPan: updatedData.nameInPan,
        //   nameInPassport: updatedData.nameInPassport,
        //   placeOfIssue: updatedData.placeOfIssue,
        //   dateOfIssue: updatedData.dateOfIssue,
        //   expiryDate: updatedData.dateOfExpiry,
        //   insuranceNumber: updatedData.insuranceNumber,
        //   nameInInsurance: updatedData.nameInInsurance,
        //   insuranceValidFrom: updatedData.insuranceValidFrom,
        //   insuranceValidTo: updatedData.insuranceValidTo,
      };
      await employeeService.updateIdentityInfo(id!, payload);
      await fetchEmployeeDetails();
      // setEmployee((prev) => (prev ? { ...prev, ...updatedData } : null));
      showSnackbar("Identification details updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message, "error");
    } finally {
      hideSpinner();
    }
  };

  const updateEligibilityInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        pfEligible: updatedData.pfEligible,
        excessEpfEligible: updatedData.excessEpfEligible,
        excessEpsEligible: updatedData.excessEpsEligible,
        existingEpsMember: updatedData.existingEpsMember,
        esiEligible: updatedData.esiEligible,
        lwfCovered: updatedData.lwfCovered,
      };
      await employeeService.updateEligibilityInfo(id!, payload);
      // setEmployee((prev) => (prev ? { ...prev, ...updatedData } : null));
      showSnackbar("Eligibility information updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update", "error");
    } finally {
      hideSpinner();
    }
  };

  const updateBackgroundInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        // loginUsername: updatedData.loginUsername,
        // loginIpAddress: updatedData.loginIpAddress,
        backgroundCheckStatus: updatedData.backgroundCheckStatus,
        backgroundVerificationCompletedOn:
          updatedData.backgroundVerificationCompletedOn,
        backgroundVerificationIndicator:
          updatedData.backgroundVerificationIndicator,
        agencyName: updatedData.agencyName,
        backgroundCheckRemarks: updatedData.backgroundCheckRemarks,
      };
      await employeeService.updateBackgroundInfo(id!, payload);
      setEmployee((prev) => (prev ? { ...prev, ...updatedData } : null));
      showSnackbar("Background information updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update", "error");
    } finally {
      hideSpinner();
    }
  };

  // ==================== ARRAY ITEM OPERATIONS ====================

  // Addresses
  const handleUpdateAddresses = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.addresses || [];
      for (const item of updatedData) {
        const originalItem = originalData.find((orig) => orig.id === item.id);
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
          await employeeService.updateAddress(id!, item.id, updatedItem);
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
      await employeeService.addAddress(id!, newItem);
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
          await employeeService.deleteAddress(id!, itemId);
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

  // Emergency Contacts
  const handleUpdateEmergencyContacts = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.emergencyContacts || [];
      for (const item of updatedData) {
        const originalItem = originalData.find((orig) => orig.id === item.id);
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
            id!,
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
      ((newItem["relationshipId"] = newItem.relationship),
        delete newItem.relationship);
      await employeeService.addEmergencyContact(id!, newItem);
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
          await employeeService.deleteEmergencyContact(id!, itemId);
          // const updatedData = (employee?.emergencyContacts || []).filter(
          //   (item) => item.id !== itemId,
          // );
          // setEmployee((prev) =>
          //   prev ? { ...prev, emergencyContacts: updatedData } : null,
          // );
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

  // Qualifications
  const handleUpdateQualifications = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.qualifications || [];
      for (const item of updatedData) {
        const originalItem = originalData.find((orig) => orig.id === item.id);
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
          await employeeService.updateQualification(id!, item.id, updatedItem);
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

      await employeeService.addQualification(id!, newItem);
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
          await employeeService.deleteQualification(id!, itemId);
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

  // Previous Employments
  const handleUpdatePreviousEmployments = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.previousEmployments || [];
      for (const item of updatedData) {
        const originalItem = originalData.find((orig) => orig.id === item.id);
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
            // "referenceName": item.referenceName,
            // "referenceContact": item.referenceContact
          };
          await employeeService.updatePreviousEmployment(
            id!,
            item.id,
            updatedItem,
          );
        }
      }
      setEmployee((prev) =>
        prev ? { ...prev, previousEmployments: updatedData } : null,
      );
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
        id!,
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
          await employeeService.deletePreviousEmployment(id!, itemId);
          const updatedData = (employee?.previousEmployments || []).filter(
            (item) => item.id !== itemId,
          );
          setEmployee((prev) =>
            prev ? { ...prev, previousEmployments: updatedData } : null,
          );
          showSnackbar("Previous employment deleted successfully!", "success");
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

  // Family Members
  const handleUpdateFamilyMembers = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.familyMembers || [];
      for (const item of updatedData) {
        const originalItem = originalData.find((orig) => orig.id === item.id);
        if (originalItem && JSON.stringify(originalItem) !== JSON.stringify(item)) {
          const matchValue = (originalItem.relationship == item.relationship && originalItem.relationshipId == item.relationshipId) ?
            originalItem.relationshipId : item.relationship;
          const updatedItem = {
            name: item.name,
            relationshipId: matchValue,
            dateOfBirth: item.dateOfBirth,
            occupation: item.occupation,
            dependent: item.dependent,
          };
          await employeeService.updateFamilyMember(id!, item.id, updatedItem);
        }
      }
      await fetchEmployeeDetails();
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
      delete newItem.relationship;
      await employeeService.addFamilyMember(id!, newItem);
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
          await employeeService.deleteFamilyMember(id!, itemId);
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

  // Training Details
  const handleUpdateTrainingDetails = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.trainingDetails || [];
      for (const item of updatedData) {
        const originalItem = originalData.find((orig) => orig.id === item.id);
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
          };
          await employeeService.updateTrainingDetail(id!, item.id, updatedItem);
        }
      }
      setEmployee((prev) =>
        prev ? { ...prev, trainingDetails: updatedData } : null,
      );
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
      await employeeService.addTrainingDetail(id!, newItem);
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
          await employeeService.deleteTrainingDetail(id!, itemId);
          const updatedData = (employee?.trainingDetails || []).filter(
            (item) => item.id !== itemId,
          );
          setEmployee((prev) =>
            prev ? { ...prev, trainingDetails: updatedData } : null,
          );
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

  // PF Accounts
  const handleUpdatePf = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.pfAccounts || [];
      for (const item of updatedData) {
        const originalItem = originalData.find((orig) => orig.id === item.id);
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
          await employeeService.updatePfAccount(id!, item.id, updatedItem);
        }
      }
      await fetchEmployeeDetails();
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
      ((newItem["pfSchemeId"] = newItem.pfScheme),
        delete newItem.pfScheme);
      await employeeService.addPfAccount(id!, newItem);
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
          await employeeService.deletePfAccount(id!, itemId);
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

  // Attachments
  const handleAddAttachment = async (newItem: any) => {
    showSpinner();
    try {
      if (!newItem.documentType) {
        showSnackbar('Document Type is Mandatory', 'warning')
        return
      };
      await employeeService.addAttachment(id!, newItem);
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
          await employeeService.deleteAttachment(id!, itemId);
          const updatedData = (employee?.attachments || []).filter(
            (item) => item.id !== itemId,
          );
          setEmployee((prev) =>
            prev ? { ...prev, attachments: updatedData } : null,
          );
          showSnackbar("Attachment deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message || "Failed to delete attachment", "error");
        } finally {
          hideSpinner();
        }
      },
    });
  };

  // Nominations
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
      const response: any = await employeeService.getFamilyMembers(id!);

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
        const originalItem = originalData.find((orig) => orig.id === item.id);
        if (originalItem && JSON.stringify(originalItem) !== JSON.stringify(item)) {
          const payload = {
            "nomineeName": item.nomineeName,
            "sharePercentage": Number(item.sharePercentage),
            "nominationType": item.nominationType
          }
          await employeeService.updateNomination(id!, item.id, payload);
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
      await employeeService.addNomination(id!, newItem);
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
          await employeeService.deleteNomination(id!, itemId);
          const updatedData = (employee?.nominations || []).filter(
            (item) => item.id !== itemId,
          );
          setEmployee((prev) =>
            prev ? { ...prev, nominations: updatedData } : null,
          );
          showSnackbar("Nomination deleted successfully!", "success");
        } catch (error: any) {
          showSnackbar(error.message || "Failed to delete nomination", "error");
        } finally {
          hideSpinner();
        }
      },
    });
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

  if (!employee) {
    return null;
  }

  const tabs = [
    { label: "Personal Info", icon: <Person2Outlined /> },
    { label: "Addresses", icon: <LocationIcon /> },
    { label: "Qualifications", icon: <SchoolIcon /> },
    { label: "Employee Details", icon: <Person2TwoTone /> },
    { label: "Training Details", icon: <AccountBalanceIcon /> },
    { label: "Previous Employment", icon: <WorkHistoryIcon /> },
    { label: "Identification Details", icon: <WorkHistoryIcon /> },
    { label: "Family Details", icon: <FamilyIcon /> },
    { label: "Nominations", icon: <AccountBalanceIcon /> },
    { label: "Attachments", icon: <AttachmentIcon /> },
  ];

  return (
    <div className="">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <IconButton
          onClick={() => navigate("/employees")}
          className="!bg-gray-100"
        >
          <ArrowBackIcon />
        </IconButton>
        <div className="flex-1">
          <div className="font-semibold text-gray-800">Employee Details</div>
          <div className="text-gray-500 text-[12px]">
            Complete information about{" "}
            <span className="font-medium text-primary">{employee.name}</span>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <Card className="mb-2 bg-white">
        <CardContent className="py-2 px-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar
                src={employee.photoUrl}
                className="!w-16 !h-16 !bg-primary text-2xl cursor-pointer"
              >
                {employee.firstName?.charAt(0)}
                {employee.lastName?.charAt(0)}
              </Avatar>

              {/* Hover Overlay */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer">
                <CameraAlt className="!text-white" sx={{ "& svg": { color: "white" } }} />
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
                <Chip
                  label={`ID: ${employee.employeeId}`}
                  size="small"
                  color="primary"
                  className="!bg-primary"
                />
                <Chip
                  label={employee.emailAddress}
                  size="small"
                  variant="outlined"
                  className="text-gray-700"
                />
                <Chip
                  label={employee.mobileNumber}
                  size="small"
                  variant="outlined"
                  className="text-gray-700"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs Navigation */}
      <div className="">
        <Tabs
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
            <Tab
              key={index}
              label={
                <div className="flex items-center gap-1 !text-gray-900">
                  <span>{tab.label}</span>
                </div>
              }
            />
          ))}
        </Tabs>
        <div className="h-[calc(100vh-350px)] overflow-auto">
          {/* Tab 0: Personal Information */}
          <TabPanel value={tabValue} index={0}>
            <EditableGroup
              title="Basic Information"
              icon={<Person2Outlined />}
              fields={basicInfoFields}
              data={employee}
              onSave={updatePersonalInfo}
              categoryOptions={categoryOptions}
            />
            <EditableTableGroup
              title="Emergency Contacts"
              icon={<ContactEmergencyOutlined />}
              data={employee.emergencyContacts || []}
              columns={emergencyColumns}
              onSave={handleUpdateEmergencyContacts}
              onAdd={handleAddEmergencyContact}
              onDelete={handleDeleteEmergencyContact}
              addDialogFields={emergencyColumns}
              categoryOptions={categoryOptions}
            />
          </TabPanel>

          {/* Tab 1: Addresses */}
          <TabPanel value={tabValue} index={1}>
            <EditableTableGroup
              title="Addresses"
              icon={<LocationOnOutlined />}
              data={employee.addresses || []}
              columns={addressColumns}
              onSave={handleUpdateAddresses}
              onAdd={handleAddAddress}
              onDelete={handleDeleteAddress}
              addDialogFields={addressColumns}
              categoryOptions={categoryOptions}
            />
          </TabPanel>

          {/* Tab 2: Qualifications */}
          <TabPanel value={tabValue} index={2}>
            <EditableTableGroup
              title="Qualifications"
              icon={<SchoolOutlined />}
              data={employee.qualifications || []}
              columns={qualificationColumns}
              onSave={handleUpdateQualifications}
              onAdd={handleAddQualification}
              onDelete={handleDeleteQualification}
              addDialogFields={qualificationColumns}
              categoryOptions={categoryOptions}
            />
          </TabPanel>

          {/* Tab 3: Employee Details (Admin) */}
          <TabPanel value={tabValue} index={3}>
            <EditableGroup
              title="Employee Details"
              icon={<Person2Outlined />}
              fields={employeeColumns}
              data={employee}
              onSave={updateAdminInfo}
              categoryOptions={categoryOptions}
            />
            <EditableGroup
              title="Eligibility Information"
              icon={<AccountBalanceIcon />}
              fields={eligibilityFields}
              data={employee}
              onSave={updateEligibilityInfo}
              categoryOptions={categoryOptions}
            />
            <EditableGroup
              title="Verification"
              icon={<VerifiedUserOutlined />}
              fields={VerificationColumns}
              data={employee}
              onSave={updateBackgroundInfo}
              categoryOptions={categoryOptions}
            />
          </TabPanel>

          {/* Tab 4: Training Details */}
          <TabPanel value={tabValue} index={4}>
            <EditableTableGroup
              title="Training Details"
              icon={<LocalLibraryOutlined />}
              data={employee.trainingDetails || []}
              columns={trainingDetailsColumns}
              onSave={handleUpdateTrainingDetails}
              onAdd={handleAddTrainingDetail}
              onDelete={handleDeleteTrainingDetail}
              addDialogFields={trainingDetailsColumns}
              categoryOptions={categoryOptions}
            />
          </TabPanel>

          {/* Tab 5: Previous Employments */}
          <TabPanel value={tabValue} index={5}>
            <EditableTableGroup
              title="Previous Employments"
              icon={<WorkHistoryOutlined />}
              data={employee.previousEmployments || []}
              columns={employmentColumns}
              onSave={handleUpdatePreviousEmployments}
              onAdd={handleAddPreviousEmployment}
              onDelete={handleDeletePreviousEmployment}
              addDialogFields={employmentColumns}
              categoryOptions={categoryOptions}
            />
          </TabPanel>

          {/* Tab 6: Identification Details */}
          <TabPanel value={tabValue} index={6}>
            <EditableGroup
              title="Bank Details"
              icon={<AccountBalanceIcon />}
              fields={bankColumns}
              data={employee}
              onSave={updateBankInfo}
              categoryOptions={categoryOptions}
            />
            <EditableTableGroup
              title="PF Details"
              icon={<Person2Outlined />}
              data={employee.pfAccounts || []}
              columns={pfColumns}
              onSave={handleUpdatePf}
              onAdd={handleAddPf}
              onDelete={handleDeletePf}
              addDialogFields={pfColumns}
              categoryOptions={categoryOptions}
            />
            <EditableGroup
              title="PAN Details"
              icon={<Person2Outlined />}
              fields={panColumns}
              data={employee}
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
            />
            <EditableGroup
              title="Aadhaar Details"
              icon={<Person2Outlined />}
              fields={aadhaarColumns}
              data={employee}
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
            />
            <EditableGroup
              title="Passport Details"
              icon={<FlightLandOutlined />}
              fields={passportVisaColumns}
              data={employee}
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
            />
            <EditableGroup
              title="Insurance Details"
              icon={<Person2Outlined />}
              fields={insuranceColumns}
              data={employee}
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
            />
            <EditableGroup
              title="ESI Details"
              icon={<Person2Outlined />}
              fields={esiColumns}
              data={employee}
              onSave={updatePFInfo}
              categoryOptions={categoryOptions}
            />
            <EditableGroup
              title="PRAN Details"
              icon={<Person2Outlined />}
              fields={pranColumns}
              data={employee}
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
            />
            <EditableGroup
              title="Login"
              icon={<LoginOutlined />}
              fields={loginColumns}
              data={employee}
              onSave={updateIdentityInfo}
              categoryOptions={categoryOptions}
            />
          </TabPanel>

          {/* Tab 7: Family Members */}
          <TabPanel value={tabValue} index={7}>
            <EditableTableGroup
              title="Family Members"
              icon={<Diversity3Outlined />}
              data={employee.familyMembers || []}
              columns={familyColumns}
              onSave={handleUpdateFamilyMembers}
              onAdd={handleAddFamilyMember}
              onDelete={handleDeleteFamilyMember}
              addDialogFields={familyColumns}
              categoryOptions={categoryOptions}
            />
          </TabPanel>

          {/* Tab 8: Nominations */}
          <TabPanel value={tabValue} index={8}>
            {nominationTypes.map((type) => (
              <EditableTableGroup
                key={type}
                title={nominationConfigs[type].title}
                icon={<PeopleOutlineOutlined />}
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
              icon={<AttachmentIcon />}
              data={employee.attachments || []}
              columns={attachmentColumns}
              onAdd={handleAddAttachment}
              onDelete={handleDeleteAttachment}
              addDialogFields={attachmentAddFields}
              categoryOptions={categoryOptions}
            />
          </TabPanel>
        </div>
      </div>
    </div>
  );
}
