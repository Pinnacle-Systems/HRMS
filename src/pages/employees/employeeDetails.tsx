import { useState, useEffect } from "react";
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Emergency as EmergencyIcon,
  School as SchoolIcon,
  WorkHistory as WorkHistoryIcon,
  FamilyRestroom as FamilyIcon,
  AccountBalance as AccountBalanceIcon,
  Favorite as NominationIcon,
  AttachFile as AttachmentIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Person2Outlined,
  Person2TwoTone,
  TrainTwoTone,
  CloseOutlined,
  LoginOutlined,
} from "@mui/icons-material";
import { employeeService } from "../../services/modules/employees";
import { useUI } from "../../context/Snackbar";
import type { EmployeeDetails, TabPanelProps } from "./type";
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
} from "./const";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { categoryService } from "../../services/modules/category";
import { DynamicSelectWithAdd } from "../../components/SelectField";
import { MasterSelect } from "../../components/MasterSelect";
import { getCategoryName } from "../const";

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Editable Group Component
const EditableGroup = ({ title, fields, data, onSave, icon, categoryOptions }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const { showSnackbar, showSpinner, hideSpinner } = useUI();


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
    const categoryName = getCategoryName(fieldKey, fieldLabel);
    const category = Object.keys(categoryOptions).find(catName =>
      catName.toLowerCase() === categoryName.toLowerCase() ||
      catName.toLowerCase() === fieldKey.toLowerCase() ||
      catName.toLowerCase() === fieldLabel.toLowerCase() ||
      catName.toLowerCase().replace(/\s/g, '') === fieldKey.toLowerCase()
    );
    const options = category ? categoryOptions[category] : [];
    return options.map((opt: any) => ({
      value: opt.id,
      label: opt.name,
    }));
  };

  const getSelectOptions = (fieldKey: string, fieldLabel: string) => {
    const categoryName = getCategoryName(fieldKey, fieldLabel);
    console.log(categoryName, categoryOptions);

    const category = Object.keys(categoryOptions).find(catName =>
      catName.toLowerCase() === categoryName.toLowerCase() ||
      catName.toLowerCase() === fieldKey.toLowerCase() ||
      catName.toLowerCase() === fieldLabel.toLowerCase()
    );
    console.log(category);

    const options = category ? categoryOptions[category] : [];
    console.log(options);

    return options.map((opt: any) => opt.name);
  };

  const getOptionIdFromName = (fieldKey: string, fieldLabel: string, name: string) => {
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

  const handleMasterDataChange = (fieldKey: string, value: string) => {
    setEditData({
      ...editData,
      [fieldKey]: value
    });

    // Reset dependent fields
    if (fieldKey === 'country') {
      setEditData((prev: any) => ({
        ...prev,
        state: '',
        city: ''
      }));
    } else if (fieldKey === 'state') {
      setEditData((prev: any) => ({
        ...prev,
        city: ''
      }));
    }
  };

  const handleAddOption = async (fieldKey: string, newOption: string) => {
    try {
      showSpinner();
      const categoryName = getCategoryName(fieldKey, "");
      const categoriesResponse: any = await categoryService.getCategories();
      const categories = categoriesResponse.data.content || [];
      const category = categories.find((cat: any) =>
        cat.categoryName.toLowerCase() === categoryName.toLowerCase()
      );
      if (!category) {
        showSnackbar(`Category "${categoryName}" not found`, "error");
        return;
      }
      const payload = {
        name: newOption,
        code: newOption.toUpperCase().replace(/\s/g, '_'),
        active: true
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

  useEffect(() => {
    console.log(categoryOptions);
    
  }, [categoryOptions]);

  return (
    <div className="mb-6 p-4 border rounded-lg mt-3 shadow-sm border-gray-300">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="font-semibold text-primary flex items-center gap-2">
            {icon} {title}
          </div>
          {!isEditing ? (
            <IconButton size="small" onClick={() => setIsEditing(true)}>
              <EditIcon fontSize="small" />
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
                    {
                      field.type === "date" ? (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                          <DatePicker
                            value={editData[field.key] ? dayjs(editData[field.key]) : null}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                [field.key]: e ? e.format("YYYY-MM-DD") : "",
                              })
                            }
                            slotProps={{
                              textField: {
                                fullWidth: true,
                              }
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
                        // <DynamicSelectWithAdd
                        //   label=""
                        //   value={editData[field.key] || ""}
                        //   onChange={(value) => setEditData({ ...editData, [field.key]: value })}
                        //   options={getSelectOptions(field.key, field.label)}
                        //   onAddOption={(newOption) => handleAddOption(field.key, newOption)}
                        //   showAddButton={true}
                        // />
                        <DynamicSelectWithAdd
                          label=""
                          value={getOptionNameFromId(field.key, editData[field.key]) || ""}
                          onChange={(value) => {
                            const id = getOptionIdFromName(field.key, field.label, value as string);
                            setEditData((prev: any) => ({ ...prev, [field.key]: id }));
                          }}
                          options={getSelectOptions(field.key, field.label)}
                          onAddOption={(newOption) => handleAddOption(field.key, newOption)}
                          showAddButton={true}
                        />
                      ) :
                        field.type === "master-select" ? (
                          // <MasterSelect
                            // type={
                            //   field.key === 'country' ? 'country' :
                            //     field.key === 'state' ? 'state' :
                            //       field.key === 'city' ? 'city' : 'country'
                            // }
                            // value={editData[field.key] || ""}
                            // onChange={(newValue) => handleMasterDataChange(field.key, newValue)}
                            // parentId={
                            //   field.key === 'state' ? editData.country :
                            //     field.key === 'city' ? editData.state :
                            //       undefined
                            // }
                            // label={field.label}
                          // />
                          <></>
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
                        )
                    }
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
                          ?
                          // (() => {
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
  categoryOptions
}: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(data);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItemData, setNewItemData] = useState<any>({});
  const { showSnackbar, showSpinner, hideSpinner } = useUI();

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

  const handleCellChange = (rowIndex: number, field: string, value: any) => {
    const newData = [...editData];
    newData[rowIndex] = { ...newData[rowIndex], [field]: value };
    setEditData(newData);
  };

  const handleDeleteRow = (index: number) => {
    const rowToDelete = editData[index];
    if (rowToDelete?.id) {
      onDelete(rowToDelete.id);
    }
    // const newData = editData.filter((_: any, i: number) => i !== index);
    // setEditData(newData);
  };

  useEffect(() => {
    console.log(`Data changed for ${title}:`, data);
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

  const handleAddConfirm = () => {
    onAdd(newItemData);
    setAddDialogOpen(false);
    setNewItemData({});
  };

  const getFieldOptions = (fieldKey: string, fieldLabel: string) => {
    const categoryName = getCategoryName(fieldKey, fieldLabel);
    const category = Object.keys(categoryOptions).find(catName =>
      catName.toLowerCase() === categoryName.toLowerCase() ||
      catName.toLowerCase() === fieldKey.toLowerCase() ||
      catName.toLowerCase() === fieldLabel.toLowerCase() ||
      catName.toLowerCase().replace(/\s/g, '') === fieldKey.toLowerCase()
    );
    const options = category ? categoryOptions[category] : [];
    return options.map((opt: any) => ({
      value: opt.id,
      label: opt.name,
    }));
  };

  const getSelectOptions = (fieldKey: string, fieldLabel: string) => {
    const categoryName = getCategoryName(fieldKey, fieldLabel);

    const category = Object.keys(categoryOptions).find(catName =>
      catName.toLowerCase() === categoryName.toLowerCase() ||
      catName.toLowerCase() === fieldKey.toLowerCase() ||
      catName.toLowerCase() === fieldLabel.toLowerCase()
    );
    const options = category ? categoryOptions[category] : [];
    return options.map((opt: any) => opt.name);
  };

  const getOptionIdFromName = (fieldKey: string, fieldLabel: string, name: string) => {
    if (!name) return "";
    const options = getFieldOptions(fieldKey, fieldLabel);
    const option = options.find((opt: any) => opt.label === name);
    return option?.value || name;
  };

  const getOptionNameFromId = (fieldKey: string, value: string) => {
    if (!value) return "";
    const options = getFieldOptions(fieldKey, "");
    const option = options.find((opt: any) => opt.value === value);
    return option?.label || value;
  };

  const handleMasterDataChange = (rowIndex: number, fieldKey: string, value: string) => {
    const newData = [...editData];
    newData[rowIndex] = {
      ...newData[rowIndex],
      [fieldKey]: value
    };

    // Reset dependent fields
    if (fieldKey === 'country') {
      newData[rowIndex].state = '';
      newData[rowIndex].city = '';
    } else if (fieldKey === 'state') {
      newData[rowIndex].city = '';
    }

    setEditData(newData);
  };

  const handleAddOption = async (fieldKey: string, newOption: string) => {
    try {
      showSpinner();
      const categoryName = getCategoryName(fieldKey, "");
      const categoriesResponse: any = await categoryService.getCategories();
      const categories = categoriesResponse.data.content || [];
      const category = categories.find((cat: any) =>
        cat.categoryName.toLowerCase() === categoryName.toLowerCase()
      );
      if (!category) {
        showSnackbar(`Category "${categoryName}" not found`, "error");
        return;
      }
      const payload = {
        name: newOption,
        code: newOption.toUpperCase().replace(/\s/g, '_'),
        active: true
      };
      await categoryService.createCategoryItem(category.id, payload);
      const itemsResponse = await categoryService.getCategoryItems(category.id);
      // setCategoryOptions((prev: any) => ({
      //   ...prev,
      //   [category.categoryName]: itemsResponse.data.content || []
      // }));
      showSnackbar(`"${newOption}" added successfully!`, "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to add option", "error");
    } finally {
      hideSpinner();
    }
  };

  const commonSx = {
    background: "var(--bg-primary)",
    "& .MuiFormHelperText-root": {
      fontSize: "10px",
      marginLeft: 0,
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="p-4 border rounded-lg mt-3 shadow-sm border-gray-300">
        <div>
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold text-primary flex items-center gap-2">
              {icon} {title}
            </div>
            <Button
              startIcon={<AddIcon sx={{ color: "var(--color-primary)" }} />}
              size="small"
              onClick={handleAddClick} variant="outlined"
              sx={{ color: "var(--color-primary)", borderColor: "var(--color-primary)" }}
            >
              Add {title}
            </Button>
          </div>
          <div className="text-center text-gray-500 py-4">
            No {title.toLowerCase()} found
          </div>
        </div>

        <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
          <div className="text-primary !border-b !p-2 flex items-center justify-between !border-gray-200">
            <span className="ml-4">Adda {title}</span>
            <IconButton onClick={() => setAddDialogOpen(false)}>
              <CloseOutlined />
            </IconButton>
          </div>
          <DialogContent>
            <div className="flex flex-wrap gap-4">
              {addDialogFields.map((field: any, index: any) => (
                <div key={field.key}>
                  {field.type === "date" ? (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        label={field.label}
                        value={newItemData[field.key] ? dayjs(newItemData[field.key]) : null}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            [field.key]: e ? e.format("YYYY-MM-DD") : "",
                          })
                        }
                        slotProps={{ textField: { fullWidth: true, size: "small" } }}
                      />
                    </LocalizationProvider>
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
                          className="text-gray-800"
                        />
                      }
                      label="Primary"
                    />
                  ) : field.type === "select" ? (
                    // <DynamicSelectWithAdd
                    //   label={field.label}
                    //   value={newItemData[field.key] || ""}
                    //   onChange={(value) => setNewItemData({ ...newItemData, [field.key]: value })}
                    //   options={getSelectOptions(field.key, field.label)}
                    //   onAddOption={(newOption) => handleAddOption(field.key, newOption)}
                    //   showAddButton={true}
                    //   sx={commonSx}
                    // />
                    <DynamicSelectWithAdd
                      label={field.label}
                      value={getOptionNameFromId(field.key, newItemData[field.key]) || ""} 
                      onChange={(value) => {
                        const id = getOptionIdFromName(field.key, field.label, value as string);
                        setNewItemData({ ...newItemData, [field.key]: id });
                      }}
                      options={getSelectOptions(field.key, field.label)}
                      onAddOption={(newOption) => handleAddOption(field.key, newOption)}
                      showAddButton={true}
                      sx={commonSx}
                    />

                  ) :
                    field.type === "master-select" ? (
                      // <MasterSelect
                      //   type={
                      //     field.key === 'country' ? 'country' :
                      //       field.key === 'state' ? 'state' :
                      //         field.key === 'city' ? 'city' : 'country'
                      //   }
                      //   value={editData[field.key] || ""}
                      //   onChange={(newValue) => handleMasterDataChange(index, field.key, newValue)}
                      //   parentId={
                      //     field.key === 'state' ? editData.country :
                      //       field.key === 'city' ? editData.state :
                      //         undefined
                      //   }
                      //   label={field.label}
                      // />
                      <></>
                    ) : (
                      <TextField
                        fullWidth
                        size="small"
                        label={field.label}
                        value={newItemData[field.key] || ""}
                        onChange={(e) =>
                          setNewItemData({ ...newItemData, [field.key]: e.target.value })
                        }
                      />
                    )}
                </div>
              ))}
            </div>
          </DialogContent>
          <DialogActions className="!p-3 !border-t !border-gray-200">
            <Button onClick={() => setAddDialogOpen(false)} variant="outlined" className="!border-gray-200 !text-gray-800">
              Cancel
            </Button>
            <Button onClick={handleAddConfirm} variant="contained" className="!bg-primary">
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg mt-3 shadow-sm border-gray-300">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="font-semibold text-primary flex items-center gap-2">
            {icon} {title}
          </div>
          <div className="flex gap-1">
            {!isEditing ? (
              <>
                <div className="flex items-center gap-1 border border-gray-300 rounded">
                  <Button size="small" onClick={handleAddClick} className="!min-w-0">
                    <AddIcon fontSize="small" className="text-gray-800" />
                  </Button>
                  <div className="border-l border-gray-300 h-5" />
                  <Button size="small" onClick={() => setIsEditing(true)} className="!min-w-0">
                    <EditIcon fontSize="small" className="text-gray-800 !w-3.5" />
                  </Button>
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
                {isEditing && <TableCell align="center">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody className="bg-white-50">
              {editData.map((row: any, rowIndex: number) => (
                <TableRow key={row.id || rowIndex}>
                  <TableCell>{rowIndex + 1}</TableCell>
                  {columns.map((col: any) => (
                    <TableCell key={col.key} className="!text-gray-800" sx={{ padding: !isEditing ? '8px 16px' : '2px 2px 2px 16px', }}>
                      {isEditing ? (
                        col.type === "select" ? (
                          // <FormControl fullWidth size="small">
                          //   <Select
                          //     value={row[col.key] || ""}
                          //     onChange={(e) => handleCellChange(rowIndex, col.key, e.target.value)}
                          //     displayEmpty
                          //   >
                          //     <MenuItem value="">Select {col.label}</MenuItem>
                          //     {getFieldOptions(col.key, col.label).map((opt: any) => (
                          //       <MenuItem key={opt.value} value={opt.value}>
                          //         {opt.label}
                          //       </MenuItem>
                          //     ))}
                          //   </Select>
                          // </FormControl>
                          <DynamicSelectWithAdd
                            label=""
                            value={getOptionNameFromId(col.key, row[col.key]) || ""}
                            onChange={(value) => {
                              const id = getOptionIdFromName(col.key, col.label, value as string);
                              handleCellChange(rowIndex, col.key, id);
                            }}
                            options={getSelectOptions(col.key, col.label)}
                            onAddOption={(newOption) => handleAddOption(col.key, newOption)}
                            showAddButton={true}
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
                          // <MasterSelect
                          //   type={
                          //     col.key === 'country' ? 'country' :
                          //       col.key === 'state' ? 'state' :
                          //         col.key === 'city' ? 'city' : 'country'
                          //   }
                          //   value={row[col.key] || ""}
                          //   onChange={(newValue) => handleMasterDataChange(rowIndex, col.key, newValue)}
                          //   parentId={
                          //     col.key === 'state' ? row.country :
                          //       col.key === 'city' ? row.state :
                          //         undefined
                          //   }
                          //   label={col.label}
                          // />
                          <></>
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
                          {col.type === "date" && row[col.key]
                            ? new Date(row[col.key]).toLocaleDateString()
                            : col.type === "boolean" ? row[col.key] ? <span className="text-green-500">Yes</span>
                              : <span className="text-red-500">No</span>
                              : col.type === "select"
                                ? getOptionNameFromId(col.key, row[col.key])
                                : row[col.key] || "-"}
                        </span>
                      )}
                    </TableCell>
                  ))}
                  {isEditing ? (
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRow(rowIndex)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog
          open={addDialogOpen}
          onClose={() => setAddDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <div className="text-primary !border-b !p-2 flex items-center justify-between !border-gray-200">
            <span className="ml-4">Adds {title}</span>
            <IconButton onClick={() => setAddDialogOpen(false)}>
              <CloseOutlined />
            </IconButton>
          </div>
          <DialogContent>
            <div className="flex flex-wrap gap-4">
              {addDialogFields.map((field: any) => (
                <div key={field.key}>
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
                      />
                    </LocalizationProvider>
                  ) : field.type === "select" ? (
                    // <DynamicSelectWithAdd
                    //   label={field.label}
                    //   value={newItemData[field.key] || ""}
                    //   onChange={(value) => setNewItemData({ ...newItemData, [field.key]: value })}
                    //   options={getSelectOptions(field.key, field.label)}
                    //   onAddOption={(newOption) => handleAddOption(field.key, newOption)}
                    //   showAddButton={true}
                    // />
                    <DynamicSelectWithAdd
                      label={field.label}
                      value={getOptionNameFromId(field.key, newItemData[field.key]) || ""}  // Show name
                      onChange={(value) => {
                        const id = getOptionIdFromName(field.key, field.label, value as string);  // Convert name to ID
                        setNewItemData({ ...newItemData, [field.key]: id });
                      }}
                      options={getSelectOptions(field.key, field.label)}
                      onAddOption={(newOption) => handleAddOption(field.key, newOption)}
                      showAddButton={true}
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
                          className="text-gray-800"
                        />
                      }
                      label="Primary"
                    />
                  ) : field.type === "master-select" ? (
                    <div style={{ minWidth: '200px' }}>
                      {/* <MasterSelect
                        type={
                          field.key === 'country' ? 'country' :
                            field.key === 'state' ? 'state' :
                              field.key === 'city' ? 'city' : 'country'
                        }
                        value={newItemData[field.key] || ""}
                        onChange={(value) => {
                          setNewItemData({ ...newItemData, [field.key]: value });
                          // Reset dependent fields
                          if (field.key === 'country') {
                            setNewItemData((prev: any) => ({ ...prev, state: '', city: '' }));
                          } else if (field.key === 'state') {
                            setNewItemData((prev: any) => ({ ...prev, city: '' }));
                          }
                        }}
                        parentId={
                          field.key === 'state' ? newItemData.country :
                            field.key === 'city' ? newItemData.state :
                              undefined
                        }
                        label={field.label}
                      /> */}
                    </div>)
                    : (
                      <TextField
                        fullWidth
                        size="small"
                        label={field.label}
                        value={newItemData[field.key] || ""}
                        onChange={(e) =>
                          setNewItemData({
                            ...newItemData,
                            [field.key]: e.target.value,
                          })
                        }
                      />
                    )}
                </div>
              ))}
            </div>
          </DialogContent>
          <DialogActions className="!p-3 !border-t !border-gray-200">
            <Button
              onClick={() => setAddDialogOpen(false)}
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
              Add
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
};

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSnackbar, showSpinner, hideSpinner, showConfirmDialog } = useUI();
  const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState<Record<string, any[]>>({});

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
      const categories = response.data.content || [];
      const optionsMap: Record<string, any[]> = {};
      for (const category of categories) {
        const itemsResponse: any = await categoryService.getCategoryItems(category.id);
        optionsMap[category.categoryName] = itemsResponse.data.content || [];
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

  useEffect(() => {
    console.log("Category options updated:", categoryOptions);
  }, [categoryOptions]);

  // ==================== PATCH UPDATES ====================

  const updatePersonalInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        dateOfBirth: updatedData.dateOfBirth,
        birthday: updatedData.birthday,
        marriageDate: updatedData.marriageDate,
        // mobileNumber: updatedData.mobileNumber,
        nickName: updatedData.nickName,
        genderId: updatedData.gender,
        bloodGroupId: updatedData.bloodGroup,
        nationalityId: updatedData.nationality,
        religionId: updatedData.religion,
        maritalStatusId: updatedData.maritalStatus,
        spouseName: updatedData.spouseName,
        fathersName: updatedData.fatherName,
        personalEmailAddress: updatedData.personalEmail,
        height: Number(updatedData.height),
        weight: Number(updatedData.weight),
        physicallyChallenged: updatedData.physicallyChallenged,
        internationalEmployee: updatedData.internationalEmployee,
        disabilityTypeId: updatedData.disabilityType,
        employeeReferenceNumber: updatedData.employeeReferenceNumber,
        // extensionNumber: updatedData.extensionNumber,
      };
      await employeeService.updatePersonalInfo(id!, payload);
      setEmployee((prev) => (prev ? { ...prev, ...updatedData } : null));
      showSnackbar("Personal information updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update", "error");
    } finally {
      hideSpinner();
    }
  };

  const updateAdminInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        // employeeId: updatedData.employeeId,
        joiningDate: updatedData.joiningDate,
        confirmationDate: updatedData.confirmationDate,
        probationPeriod: Number(updatedData.probationPeriod),
        noticePeriod: Number(updatedData.noticePeriod),
        departmentId: updatedData.departmentId,
        designationId: updatedData.designationId,
        gradeId: updatedData.grade,
        branchId: updatedData.branch,
        bandId: updatedData.band,
        managerId: updatedData.reportingManager,
        empTypeId: updatedData.employeeType,
        // salaryType: updatedData.salaryType,
        // salaryPaymentMode: updatedData.salaryPaymentMode,
        attendanceSchemaId: updatedData.attendanceSchema,
        // bonusPolicy: updatedData.bonusPolicy,
        // otPolicy: updatedData.otPolicy,
        // otAmount: updatedData.otAmount,
        hostel: updatedData.hostel,
        // vehicle: updatedData.vehicle,
        // vehicleTypeId:updatedData.vehicleType,
        // migrant: updatedData.migrant,
        // exService: updatedData.exService,
        // firstAidTrainee: updatedData.firstAidTrainee,
        // category: updatedData.category,
        // employeeIdentity: updatedData.employeeIdentity,
        // employeeReferenceNumber: updatedData.employeeReferenceNumber,
        referredBy: updatedData.referredBy,
        // monthlySalary: updatedData.monthlySalary,
        employeeStatusId: updatedData.employeeStatus,
        // remarks: updatedData.remarks,
        // idCardNo: updatedData.idCardNo,
        // midNo: updatedData.midNo,
        // oldIdNo: updatedData.oldIdNo,
      };
      await employeeService.updateAdminInfo(id!, payload);
      setEmployee((prev) => (prev ? { ...prev, ...updatedData } : null));
      showSnackbar("Employee details updated successfully!", "success");
    } catch (error: any) {
      showSnackbar(error.message || "Failed to update", "error");
    } finally {
      hideSpinner();
    }
  };

  const updateBankInfo = async (updatedData: any) => {
    showSpinner();
    try {
      const payload = {
        bankAccountNumber: updatedData.bankAccountNumber,
        bankName: updatedData.bankName,
        bankBranch: updatedData.bankBranch,
        ifscCode: updatedData.ifscCode,
        nameAsPerBankRecords: updatedData.nameAsPerBankRecords,
        bankAccountTypeId: updatedData.bankAccountType,
        ddPayableAt: updatedData.ddPayableAt,
        salaryPaymentModeId: updatedData.salaryPaymentMode,
        salaryTypeId: updatedData.salaryType,
        iban: updatedData.iban
      };
      await employeeService.updateBankDetails(id!, payload);
      setEmployee((prev) => (prev ? { ...prev, ...updatedData } : null));
      showSnackbar("Bank details updated successfully!", "success");
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
        pfNumber: updatedData.pfNumber,
        //   esiNumber: updatedData.esiNumber,
        //   esiJoiningDate: updatedData.esiJoiningDate,
        //   esiRelievingDate: updatedData.esiRelievingDate,
      };
      await employeeService.updateBankDetails(id!, payload);
      setEmployee((prev) => (prev ? { ...prev, ...updatedData } : null));
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
        "panNumber": updatedData.panNumber,
        "aadhaarEnrolmentNo": updatedData.aadhaarEnrolmentNo,
        "nameAsOnAadhaar": updatedData.nameAsOnAadhaar,
        "aadhaarNumber": updatedData.aadhaarNumber,
        "universalAccountNumber": updatedData.uan,
        "pranNumber": updatedData.pranNumber,
        "nameAsPerPran": updatedData.nameAsPerPran,
        "passportNumber": updatedData.passportNumber,
        "visaType": updatedData.visaType,
        "visaExpiry": updatedData.visaExpiry,
        "loginIpAddress": updatedData.loginIpAddress,
        "loginUserName": updatedData.loginUserName,
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
      setEmployee((prev) => (prev ? { ...prev, ...updatedData } : null));
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
        backgroundVerificationCompletedOn: updatedData.backgroundVerificationCompletedOn,
        backgroundVerificationIndicator: updatedData.backgroundVerificationIndicator,
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
        if (originalItem && JSON.stringify(originalItem) !== JSON.stringify(item)) {
          const updatedItem = {
            "addressType": item.addressType,
            "addressLine1": item.addressLine1,
            "addressLine2": item.addressLine2,
            "city": item.city,
            "state": item.state,
            "country": item.country,
            "pincode": item.pincode,
            "primary": item.primary,
          }
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
        if (originalItem && JSON.stringify(originalItem) !== JSON.stringify(item)) {
          const updatedItem = {
            "name": item.name,
            "relationshipId": item.relationship,
            "phone": item.phone,
            "alternatePhone": item.alternatePhone,
            "email": item.email,
            "address": item.address,
            "primary": item.primary,
          }
          await employeeService.updateEmergencyContact(id!, item.id, updatedItem);
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
      newItem['relationshipId'] = newItem.relationship,
        delete newItem.relationship
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
        if (originalItem && JSON.stringify(originalItem) !== JSON.stringify(item)) {
          const updatedItem = {
            "qualificationTypeId": item.qualificationType ? item.qualificationType : item.qualificationTypeId,
            "qualificationAreaId": item.qualificationArea ? item.qualificationArea : item.qualificationAreaId,
            "institution": item.institution,
            "boardUniversity": item.boardUniversity,
            "yearOfPassing": Number(item.yearOfPassing),
            "percentage": Number(item.percentage),
            "grade": item.grade,
          }
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
      newItem.percentage = Number(newItem.percentage)
      newItem.yearOfPassing = Number(newItem.yearOfPassing)
      newItem.qualificationTypeId = newItem.qualificationType
      newItem.qualificationAreaId = newItem.qualificationArea

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
        if (originalItem && JSON.stringify(originalItem) !== JSON.stringify(item)) {
          const updatedItem = {
            "companyName": item.companyName,
            "designation": item.designation,
            "fromDate": item.fromDate,
            "toDate": item.toDate,
            "ctc": Number(item.ctc),
            "reasonForLeaving": item.reasonForLeaving,
            // "referenceName": item.referenceName,
            // "referenceContact": item.referenceContact
          }
          await employeeService.updatePreviousEmployment(id!, item.id, updatedItem);
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
      const response: any = await employeeService.addPreviousEmployment(
        id!,
        newItem,
      );
      const updatedData = [
        ...(employee?.previousEmployments || []),
        response.data,
      ];
      setEmployee((prev) =>
        prev ? { ...prev, previousEmployments: updatedData } : null,
      );
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
          const updatedItem = {
            "name": item.name,
            "relationshipId": item.relationship,
            "dateOfBirth": item.dateOfBirth,
            "occupation": item.occupation,
            "dependent": item.dependent,
          }
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
          showSnackbar(
            error.message,
            "error",
          );
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
        if (originalItem && JSON.stringify(originalItem) !== JSON.stringify(item)) {
          const updatedItem = {
            "trainingName": item.trainingName,
            "institute": item.institute,
            "fromDate": item.fromDate,
            "toDate": item.toDate,
            "certificateNo": item.certificateNo,
            "remarks": item.remarks
          }
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
      await employeeService.addTrainingDetail(
        id!,
        newItem,
      );
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

  // Attachments
  const handleAddAttachment = async (newItem: any) => {
    showSpinner();
    try {
      const response: any = await employeeService.addAttachment(id!, newItem);
      const updatedData = [...(employee?.attachments || []), response.data];
      setEmployee((prev) =>
        prev ? { ...prev, attachments: updatedData } : null,
      );
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
  const handleUpdateNominations = async (updatedData: any[]) => {
    showSpinner();
    try {
      const originalData = employee?.nominations || [];
      for (const item of updatedData) {
        const originalItem = originalData.find((orig) => orig.id === item.id);
        if (
          originalItem &&
          JSON.stringify(originalItem) !== JSON.stringify(item)
        ) {
          await employeeService.updateNomination(id!, item.id, item);
        }
      }
      setEmployee((prev) =>
        prev ? { ...prev, nominations: updatedData } : null,
      );
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
      newItem.sharePercentage = Number(newItem.sharePercentage)
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
            <Avatar className="!w-16 !h-16 !bg-primary text-2xl">
              {employee.firstName?.charAt(0)}
              {employee.lastName?.charAt(0)}
            </Avatar>
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
              icon={<EmergencyIcon />}
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
              icon={<LocationIcon />}
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
              icon={<SchoolIcon />}
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
              icon={<AccountBalanceIcon />}
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
              icon={<TrainTwoTone />}
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
              icon={<WorkHistoryIcon />}
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
              icon={<Person2Outlined />}
              fields={bankColumns}
              data={employee}
              onSave={updateBankInfo}
              categoryOptions={categoryOptions}
            />
            <EditableGroup
              title="PF Details"
              icon={<Person2Outlined />}
              fields={pfColumns}
              data={employee}
              onSave={updatePFInfo}
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
              icon={<Person2Outlined />}
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
              icon={<FamilyIcon />}
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
            {/* <EditableTableGroup
              title="EPF Nominations"
              icon={<NominationIcon />}
              data={
                employee.nominations?.filter((n: any) => n.type === "EPF") || []
              }
              columns={epfNominationColumns}
              onSave={handleUpdateNominations}
              onAdd={handleAddNomination}
              onDelete={handleDeleteNomination}
              addDialogFields={epfNominationColumns}
              categoryOptions={categoryOptions}
            />
            <EditableTableGroup
              title="EPS Nominations"
              icon={<NominationIcon />}
              data={
                employee.nominations?.filter((n: any) => n.type === "EPS") || []
              }
              columns={epsNominationColumns}
              onSave={handleUpdateNominations}
              onAdd={handleAddNomination}
              onDelete={handleDeleteNomination}
              addDialogFields={epsNominationColumns}
              categoryOptions={categoryOptions}
            />
            <EditableTableGroup
              title="EPI Nominations"
              icon={<NominationIcon />}
              data={
                employee.nominations?.filter((n: any) => n.type === "EPI") || []
              }
              columns={epiNominationColumns}
              onSave={handleUpdateNominations}
              onAdd={handleAddNomination}
              onDelete={handleDeleteNomination}
              addDialogFields={epiNominationColumns}
              categoryOptions={categoryOptions}
            />
            <EditableTableGroup
              title="Gratuity Nominations"
              icon={<NominationIcon />}
              data={
                employee.nominations?.filter(
                  (n: any) => n.type === "GRATUITY",
                ) || []
              }
              columns={gratuityNominationColumns}
              onSave={handleUpdateNominations}
              onAdd={handleAddNomination}
              onDelete={handleDeleteNomination}
              addDialogFields={gratuityNominationColumns}
              categoryOptions={categoryOptions}
            /> */}
            {nominationTypes.map((type) => (
              <EditableTableGroup
                key={type}
                title={nominationConfigs[type].title}
                icon={<NominationIcon />}
                data={employee.nominations?.filter((n: any) => n.nominationType === type) || []}
                columns={nominationConfigs[type].columns}
                onSave={handleUpdateNominations}
                onAdd={(newItem: any) => handleAddNomination({ ...newItem, nominationType: type })}
                onDelete={handleDeleteNomination}
                addDialogFields={nominationConfigs[type].columns}
                categoryOptions={categoryOptions}
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
              // onSave={handleUpdateAttachments}
              onAdd={handleAddAttachment}
              onDelete={handleDeleteAttachment}
              addDialogFields={attachmentColumns}
              categoryOptions={categoryOptions}
            />
          </TabPanel>
        </div>
      </div>
    </div>
  );
}
