import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  Stack,
  useTheme,
  alpha,
  Grid,
  Checkbox,
  Stepper,
  Step,
  StepLabel,
  Divider,
  CircularProgress,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Pagination,
} from "@mui/material";
import {
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Add as PlusIcon,
  Description as BookTemplateIcon,
  Layers as LayersIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as DuplicateIcon,
  Publish as PublishIcon,
  UnpublishedOutlined,
  AddCircle,
  Info as InfoIcon,
} from "@mui/icons-material";
import { calcLabel, formatCurrency, STATUS_CHIP_OPTIONS, statusConfig, steps } from "../const";
import { salaryStructureService } from "../../../services/modules/payrollServices/salarystructure";
import { useUI } from "../../../context/Snackbar";
import { getRowColor } from "../../const";
import { formatDate } from "../../leave/leaveFormatters";
import type { StructureItem } from "../../../services/modules/payrollServices/masters";
import { useNavigate } from "react-router-dom";
import { categoryService } from "../../../services/modules/category";

// Helper function to get display value based on calculation type
const getValueDisplay = (calculationLogic: string, value: number, componentName?: string, previewData?: any) => {
  const isSpecialAllowance = componentName?.toLowerCase().includes('special') ||
    componentName?.toLowerCase().includes('spl');

  // For Special Allowance, show percentage if available from preview
  if (isSpecialAllowance && previewData) {
    const ctc = previewData.annualCtc / 12;
    const percentage = ctc > 0 ? (value / ctc) * 100 : 0;
    return `${formatCurrency(value)} (${percentage.toFixed(2)}% of CTC)`;
  }
  switch (calculationLogic) {
    case "FIXED_AMOUNT":
    case "FIXED":
      return formatCurrency(value);
    case "PERCENTAGE_OF_BASIC":
      return `${value}% of Basic`;
    case "PERCENTAGE_OF_CTC":
      return `${value}% of CTC`;
    case "SLAB_BASED":
      return value > 0 ? `₹${value}/month` : "Slab Based";
    case "FORMULA":
      return "Formula";
    default:
      return `${value}%`;
  }
};

// Helper to get calculation label
const getCalculationLabel = (type: string) => {
  return calcLabel[type] || type || "Fixed Amount";
};

// Helper to check if component is Special Allowance
const isSpecialAllowance = (componentName: string) => {
  return componentName?.toLowerCase().includes('special') || 
         componentName?.toLowerCase().includes('spl');
};

export default function SalaryStructureTemplate() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [salaryComponents, setSalaryComponents] = useState({
    earnings: [] as any[],
    deductions: [] as any[]
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [structures, setStructures] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    name: "",
    code: "",
    description: "",
    applicableFor: [] as string[],
    gradeLevels: [] as string[],
    status: ""
  });
  const [earnings, setEarnings] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [employmentTypes, setEmploymentTypes] = useState<any[]>([]);

  useEffect(() => {
    loadStructures();
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    loadOptions();
  }, []);

  useEffect(() => {
    loadMasters();
  }, []);

  const loadStructures = async () => {
    setLoading(true);
    showSpinner();
    try {
      const params: any = {
        page: page,
        size: 10,
        sort: "updatedAt,desc",
      };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter && statusFilter !== "all") params.status = statusFilter.toUpperCase();

      const res: any = await salaryStructureService.getSalaryStructures(params);
      setStructures(res.data?.content || []);
      setTotalPages(res.data?.totalPages || 1);
    } catch (error) {
      showSnackbar("Failed to load structures", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    showSpinner();
    try {
      const res: any = await salaryStructureService.getComponentOptions();
      setSalaryComponents({
        earnings: res.data?.earnings || [],
        deductions: res.data?.deductions || []
      });
    } catch (error) {
      showSnackbar("Failed to load components", "error");
    } finally {
      hideSpinner();
    }
  };

  const loadMasters = async () => {
    showSpinner();
    try {
      const category: any = await categoryService.getActiveCategoryItem();
      const gradeRes = category.data.find(
        (element: any) => element.categoryName?.toLowerCase().includes('grade')
      );
      if (gradeRes) {
        setGrades(gradeRes.items || []);
      }
      const empTypeRes = category.data.find(
        (element: any) => {
          const categoryName = element.categoryName?.toLowerCase() || '';
          return categoryName.includes('employee type')
        }
      );
      if (empTypeRes) {
        setEmploymentTypes(empTypeRes.items || []);
      }
    } catch (error) {
      showSnackbar("Failed to load masters", "error");
    } finally {
      hideSpinner();
    }
  };

  const loadStructureForEdit = async (id: string) => {
    showSpinner();
    try {
      const res: any = await salaryStructureService.getSalaryStructureById(id);
      const data = res.data;

      setEditingId(id);
      setIsEditing(true);

      setBasicInfo({
        name: data.name || "",
        code: data.code || "",
        description: data.description || "",
        applicableFor: data.applicableFor || [],
        gradeLevels: data.gradeLevels || [],
        status: data.status || "DRAFT"
      });

      setEarnings(data.earnings?.map((e: any) => ({
        componentId: e.componentId,
        componentName: e.componentName || e.componentCode,
        calculationLogic: e.calculationType || "FIXED_AMOUNT",
        value: e.value || 0,
        sequence: e.sequence || 0,
      })) || []);

      setDeductions(data.deductions?.map((d: any) => ({
        componentId: d.componentId,
        componentName: d.componentName || d.componentCode,
        calculationLogic: d.calculationType || "FIXED_AMOUNT",
        value: d.value || 0,
        sequence: d.sequence || 0,
      })) || []);

      setCurrentStep(0);
      setTabValue(1);
      setPreviewData(null);
      setValidationErrors([]);

      showSnackbar("Structure loaded for editing", "success");
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to load structure", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDuplicate = async (id: string) => {
    showSpinner();
    try {
      await salaryStructureService.duplicateSalaryStructure(id);
      showSnackbar("Structure duplicated successfully!", "success");
      loadStructures();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to duplicate structure", "error");
    } finally {
      hideSpinner();
    }
  };

  const handlePublish = async (id: string) => {
    showSpinner();
    try {
      await salaryStructureService.publishSalaryStructure(id);
      showSnackbar("Structure published successfully!", "success");
      loadStructures();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to publish structure", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleUnpublish = async (id: string) => {
    showSpinner();
    try {
      await salaryStructureService.unpublishSalaryStructure(id);
      showSnackbar("Structure unpublished successfully!", "success");
      loadStructures();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to unpublish structure", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDelete = async (st: StructureItem) => {
    showConfirmDialog({
      title: 'Delete Structure',
      message: `Are you sure you want to delete "${st.name}"?`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          showSpinner();
          await salaryStructureService.deleteSalaryStructure(st.id);
          showSnackbar("Structure deleted successfully!", "success");
          loadStructures();
        } catch (error: any) {
          showSnackbar(error?.message || "Failed to delete structure", "error");
        } finally {
          hideSpinner();
        }
      }
    });
  };

  const fetchPreview = async () => {
    if (earnings.length === 0 && deductions.length === 0) {
      showSnackbar("Add at least one earning or deduction to preview", "warning");
      return;
    }

    setIsPreviewLoading(true);
    showSpinner();
    try {
      // Check if Special Allowance exists
      // const hasSpecialAllowance = earnings.some(
      //   e => isSpecialAllowance(e.componentName)
      // );

      // If Special Allowance exists, set its value to 0 (it will be auto-calculated)
      const earningsPayload = earnings.map(e => {
        const isSpecial = isSpecialAllowance(e.componentName);
        return {
          componentId: e.componentId,
          value: isSpecial ? 0 : e.value,
          sequence: e.sequence || 0,
        };
      });

      const payload = {
        earnings: earningsPayload,
        deductions: deductions.map((d) => ({
          componentId: d.componentId,
          value: d.value,
          sequence: d.sequence || 0,
        })),
      };
      
      const res: any = await salaryStructureService.previewSalaryStructure(payload);
      setPreviewData(res.data);

      // Update Special Allowance value in earnings with calculated value
      if (res.data?.earnings) {
        const specialEarning = res.data.earnings.find(
          (pe: any) => isSpecialAllowance(pe.componentName)
        );
        
        if (specialEarning) {
          const updatedEarnings = earnings.map(e => {
            if (isSpecialAllowance(e.componentName)) {
              return {
                ...e,
                value: specialEarning.monthlyValue || 0,
              };
            }
            return e;
          });
          setEarnings(updatedEarnings);
        }
      }

      if (res.data?.warnings?.length > 0) {
        setValidationErrors(res.data.warnings);
      } else {
        setValidationErrors([]);
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to preview structure", "error");
    } finally {
      hideSpinner();
      setIsPreviewLoading(false);
    }
  };

  const toggleEmploymentType = (type: string) => {
    setBasicInfo((prev) => ({
      ...prev,
      applicableFor: prev.applicableFor.includes(type)
        ? prev.applicableFor.filter((t) => t !== type)
        : [...prev.applicableFor, type],
    }));
  };

  const toggleGrade = (grade: string) => {
    setBasicInfo((prev) => ({
      ...prev,
      gradeLevels: prev.gradeLevels.includes(grade)
        ? prev.gradeLevels.filter((g) => g !== grade)
        : [...prev.gradeLevels, grade],
    }));
  };

  const addComponent = (type: "earning" | "deduction", componentId: string) => {
    if (!componentId) return;

    const sourceArray = type === "earning"
      ? salaryComponents.earnings
      : salaryComponents.deductions;

    const component = sourceArray.find((c: any) => c.id === componentId);
    if (!component) {
      showSnackbar("Component not found", "error");
      return;
    }

    const already = type === "earning" ? earnings : deductions;
    if (already.some((a: any) => a.componentId === component.id)) {
      showSnackbar("Component already added", "warning");
      return;
    }

    const newAlloc = {
      componentId: component.id,
      componentName: component.name,
      calculationLogic: component.calculationType || "FIXED_AMOUNT",
      value: component.defaultValue || 0,
      sequence: already.length + 1,
    };

    if (type === "earning") {
      setEarnings([...earnings, newAlloc]);
    } else {
      setDeductions([...deductions, newAlloc]);
    }
  };

  const removeComponent = (type: "earning" | "deduction", index: number) => {
    if (type === "earning") {
      const updated = earnings.filter((_, i) => i !== index);
      setEarnings(updated.map((e, i) => ({ ...e, sequence: i + 1 })));
    } else {
      const updated = deductions.filter((_, i) => i !== index);
      setDeductions(updated.map((d, i) => ({ ...d, sequence: i + 1 })));
    }
  };

  const updateValue = (type: "earning" | "deduction", index: number, value: number) => {
    if (type === "earning") {
      const u = [...earnings];
      u[index].value = value;
      setEarnings(u);
    } else {
      const u = [...deductions];
      u[index].value = value;
      setDeductions(u);
    }
  };

  const calculateTotalCTC = () => {
    if (previewData) {
      return previewData.annualCtc || 0;
    }
    return earnings.reduce((s, e) => s + (e.value || 0), 0) * 12;
  };

  const validateStep = () => {
    switch (currentStep) {
      case 0:
        if (!basicInfo.name) {
          showSnackbar("Please enter template name", "warning");
          return false;
        }
        if (!basicInfo.code) {
          showSnackbar("Please enter template code", "warning");
          return false;
        }
        if (basicInfo.applicableFor.length === 0) {
          showSnackbar("Please select at least one employment type", "warning");
          return false;
        }
        return true;
      case 1:
        if (earnings.length === 0) {
          showSnackbar("Please add at least one earning component", "warning");
          return false;
        }
        // Skip validation for Special Allowance (auto-calculated)
        const invalidEarnings = earnings.filter(e => 
          e.value <= 0 && !isSpecialAllowance(e.componentName)
        );
        if (invalidEarnings.length > 0) {
          showSnackbar("Please enter valid values for all earnings", "warning");
          return false;
        }
        return true;
      case 2:
        const invalidDeductions = deductions.filter(d => d.value < 0);
        if (invalidDeductions.length > 0) {
          showSnackbar("Please enter valid values for all deductions", "warning");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (currentStep === 2) {
      fetchPreview();
    }
    setCurrentStep((s) => Math.min(3, s + 1));
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const handleSave = async (draft = false) => {
    if (!validateStep()) return;

    setSaving(true);
    showSpinner();
    try {
      const payload = {
        name: basicInfo.name,
        code: basicInfo.code,
        description: basicInfo.description,
        applicableFor: basicInfo.applicableFor,
        gradeLevels: basicInfo.gradeLevels,
        earnings: earnings.map((e, index) => ({
          componentId: e.componentId,
          value: e.value,
          sequence: index + 1,
        })),
        deductions: deductions.map((d, index) => ({
          componentId: d.componentId,
          value: d.value,
          sequence: index + 1,
        })),
      };

      let res: any;
      if (isEditing && editingId) {
        res = await salaryStructureService.updateSalaryStructure(editingId, payload);
        if (!draft) {
          await salaryStructureService.publishSalaryStructure(editingId);
        }
        showSnackbar(draft ? "Draft updated successfully!" : "Structure published successfully!", "success");
      } else {
        res = await salaryStructureService.createSalaryStructure(payload);
        if (!draft) {
          await salaryStructureService.publishSalaryStructure(res.data.id);
        }
        showSnackbar(draft ? "Draft saved successfully!" : "Template published successfully!", "success");
      }

      resetForm();
      loadStructures();
      setTabValue(0);
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to save structure", "error");
    } finally {
      hideSpinner();
      setSaving(false);
    }
  };

  const resetForm = () => {
    setBasicInfo({
      name: "",
      code: "",
      description: "",
      applicableFor: [],
      gradeLevels: [],
      status: ""
    });
    setEarnings([]);
    setDeductions([]);
    setCurrentStep(0);
    setPreviewData(null);
    setValidationErrors([]);
    setIsEditing(false);
    setEditingId(null);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    if (newValue === 0) {
      if (!isEditing && (basicInfo.name || earnings.length > 0 || deductions.length > 0)) {
        if (window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
          resetForm();
          setTabValue(newValue);
        }
      } else {
        resetForm();
        setTabValue(newValue);
      }
    } else {
      setTabValue(newValue);
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value - 1);
  };

  // Calculate percentage of CTC for a component
  // const calculatePercentageOfCTC = (value: number, monthlyCtc: number) => {
  //   if (!monthlyCtc || monthlyCtc === 0) return 0;
  //   return (value / monthlyCtc) * 100;
  // };

  return (
    <div className="bg-white-50">
      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          className="!border-b border-gray-200"
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "var(--color-primary)",
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab label={`My Structures (${structures.length})`} className="!text-gray-800" />
          <Tab
            label={isEditing ? "Edit Structure" : "Create Structure"}
            className="!text-gray-800"
          />
        </Tabs>
      </Box>

      {/* Tab 0: My Structures */}
      {tabValue === 0 && (
        <Box>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <div className="flex items-center gap-4">
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LayersIcon sx={{ color: "primary.main" }} />
              </Box>
              <Box>
                <div className="text-gray-800 text-[12px] font-bold">
                  My Salary Structures
                </div>
                <div className="text-gray-500 text-[12px] mt-1">
                  Manage your salary structures - draft, published, and archived
                </div>
              </Box>
            </div>
            <Button
              variant="contained"
              className="!bg-primary"
              onClick={() => { resetForm(); setTabValue(1); }}
              startIcon={<PlusIcon />}
              sx={{ textTransform: "none" }}
            >
              Create New
            </Button>
          </Box>

          {/* Filters */}
          <div className="flex items-center gap-4 justify-between mb-4">
            <TextField
              placeholder="Search structures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ flex: 1, minWidth: 200, maxWidth: 350 }}
            />
            <div className="flex items-center gap-1">
              {STATUS_CHIP_OPTIONS.map((o) => (
                <Chip
                  key={o.value}
                  label={o.label}
                  size="small"
                  variant={statusFilter === o.value ? "filled" : "outlined"}
                  color={statusFilter === o.value ? "primary" : "default"}
                  onClick={() => {
                    setStatusFilter(o.value);
                    setPage(0);
                  }}
                  className="cursor-pointer text-gray-800"
                  sx={{
                    borderRadius: "8px",
                    fontWeight: statusFilter === o.value ? 600 : 400,
                    ...(statusFilter === o.value && {
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      color: "white",
                      "&:hover": {
                        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                      },
                    }),
                  }}
                />
              ))}
            </div>
          </div>

          {/* Structures Table */}
          <TableContainer className="border border-gray-200 rounded-sm max-h-[calc(100vh-280px)] overflow-auto">
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell className="!font-bold">S No</TableCell>
                  <TableCell className="!font-bold">Name</TableCell>
                  <TableCell className="!font-bold">Code</TableCell>
                  <TableCell className="!font-bold">Status</TableCell>
                  <TableCell className="!font-bold" align="right">Earnings</TableCell>
                  <TableCell className="!font-bold" align="right">Deductions</TableCell>
                  <TableCell className="!font-bold" align="right">Annual CTC</TableCell>
                  <TableCell className="!font-bold">Updated</TableCell>
                  <TableCell className="!font-bold" align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : structures.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <div className="py-6 text-gray-500">No structures found. Create your first salary structure!</div>
                    </TableCell>
                  </TableRow>
                ) : (
                  structures.map((structure, i) => {
                    const status = statusConfig[structure.status?.toLowerCase()] || statusConfig.draft;
                    return (
                      <TableRow key={structure.id} sx={getRowColor(i)}>
                        <TableCell>{i + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {structure.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={structure.code} size="small" className="text-gray-800 bg-gray-200" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={status.label}
                            size="small"
                            sx={{ bgcolor: status.bgColor, color: status.color, fontWeight: 500 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{structure.earningCount || 0}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">{structure.deductionCount || 0}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(structure.annualCtc || 0)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(structure.updatedAt)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => loadStructureForEdit(structure.id)}
                            >
                              <EditIcon fontSize="small" className="!w-3 text-blue-500" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Duplicate">
                            <IconButton
                              size="small"
                              onClick={() => handleDuplicate(structure.id)}
                            >
                              <DuplicateIcon fontSize="small" className="!w-3 text-primary" />
                            </IconButton>
                          </Tooltip>
                          {structure.status?.toLowerCase() === "draft" && (
                            <Tooltip title="Publish">
                              <IconButton
                                size="small"
                                onClick={() => handlePublish(structure.id)}
                              >
                                <PublishIcon fontSize="small" className="!w-3 text-green-600" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {structure.status?.toLowerCase() === "published" && (
                            <Tooltip title="Unpublish">
                              <IconButton
                                size="small"
                                onClick={() => handleUnpublish(structure.id)}
                              >
                                <UnpublishedOutlined fontSize="small" className="!w-3 text-amber-500" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(structure)}
                            >
                              <DeleteIcon fontSize="small" className="!w-4 text-error" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Tab 1: Create/Edit Structure */}
      {tabValue === 1 && (
        <>
          {/* Header */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center" }}>
                <LayersIcon sx={{ color: "primary.main" }} />
              </Box>
              <Box>
                <div className="text-gray-800 text-[12px] font-bold">
                  {isEditing ? "Edit Salary Structure" : "Salary Structure Wizard"}
                </div>
                <div className="text-gray-500 text-[12px] mt-1">
                  {isEditing ? `Editing: ${basicInfo.name}` : "Create a reusable salary structure template in 4 steps"}
                </div>
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              {isEditing && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    resetForm();
                    setTabValue(0);
                  }}
                  sx={{ textTransform: "none" }}
                >
                  Cancel Edit
                </Button>
              )}
              {(currentStep === 1 || currentStep === 2) && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<RefreshIcon fontSize="small" />}
                  onClick={loadOptions}
                  sx={{ textTransform: "none" }}
                >
                  Refresh Components
                </Button>
              )}
            </Box>
          </Box>

          {/* Stepper */}
          <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 2 }}>
            {steps.map((step) => (
              <Step key={step.id}>
                <StepLabel>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: currentStep === step.id - 1 ? 600 : 400 }}>
                      {step.name}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500" sx={{ display: "block", fontSize: "0.65rem" }}>
                      {step.desc}
                    </Typography>
                  </Box>
                </StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Step Content */}
          <Card className="bg-white h-[calc(100vh-355px)] !overflow-auto" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <CardContent sx={{ p: 2 }}>
              {/* Step 0: Basic Info */}
              {currentStep === 0 && (
                <Stack spacing={1} className="mt-3">
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Template Name"
                        value={basicInfo.name}
                        onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                        placeholder="e.g., Standard Structure L1"
                        fullWidth
                        required
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Template Code"
                        value={basicInfo.code}
                        onChange={(e) => setBasicInfo({ ...basicInfo, code: e.target.value.toUpperCase() })}
                        placeholder="e.g., STD_L1"
                        fullWidth
                        required
                        helperText="Unique code for this structure"
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="Description"
                    value={basicInfo.description}
                    onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                    placeholder="Describe this template..."
                    multiline
                    rows={3}
                    fullWidth
                  />

                  <Box>
                    <Typography variant="body2" className="text-gray-800 !my-3">
                      Applicable For <span className="text-red-500">*</span>
                    </Typography>
                    <Grid container spacing={1}>
                      {employmentTypes.map((type) => {
                        const typeName = type.name || type.value || type.label || String(type);
                        return (
                          <Grid size={{ xs: 6, sm: 4, md: 2 }} key={type.id || typeName}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                p: 1.5,
                                borderRadius: 1,
                                border: `1px solid ${basicInfo.applicableFor.includes(typeName) ? theme.palette.primary.main : 'var(--border-color)'}`,
                                bgcolor: basicInfo.applicableFor.includes(typeName) ? alpha(theme.palette.primary.main, 0.05) : "transparent",
                                cursor: "pointer",
                                "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.05) },
                              }}
                              onClick={() => toggleEmploymentType(typeName)}
                            >
                              <Checkbox checked={basicInfo.applicableFor.includes(typeName)} size="small" className="text-gray-500" />
                              <Typography variant="body2" className="text-gray-800">{typeName}</Typography>
                            </Box>
                          </Grid>
                        )
                      })}
                    </Grid>
                  </Box>

                  <Box>
                    <Typography variant="body2" className="text-gray-800 !my-3">
                      Grade Levels
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {grades.map((grade) => {
                        const gradeName = grade.name || grade.value || grade.label || String(grade);
                        return (
                          <Chip
                            key={grade.id || gradeName}
                            label={gradeName}
                            onClick={() => toggleGrade(gradeName)}
                            color={basicInfo.gradeLevels.includes(gradeName) ? "primary" : "default"}
                            variant={basicInfo.gradeLevels.includes(gradeName) ? "filled" : "outlined"}
                            sx={{ cursor: "pointer" }}
                            className="text-gray-500"
                          />
                        )
                      })}
                    </Box>
                  </Box>
                </Stack>
              )}

              {/* Step 1: Earnings */}
              {currentStep === 1 && (
                <Stack spacing={3}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography className="text-gray-800 !font-bold">
                        Configure Earnings
                      </Typography>
                      <Typography className="text-gray-500 mt-1">
                        Add earning components to this template
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography className="text-gray-500">
                        Estimated Monthly CTC
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>
                        {formatCurrency(earnings.reduce((s, e) => s + (e.value || 0), 0))}
                      </Typography>
                    </Box>
                  </Box>

                  <FormControl sx={{ maxWidth: 300 }}>
                    <InputLabel>Add earning component...</InputLabel>
                    <Select
                      value=""
                      onChange={(e) => addComponent("earning", e.target.value)}
                      label="Add earning component..."
                    >
                      {salaryComponents.earnings.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </MenuItem>
                      ))}
                      <MenuItem className="!text-primary" onClick={() => navigate("/payroll/components")}>
                        <AddCircle className="mr-2" /> Add New Earning
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {earnings.length > 0 ? (
                    <>
                      <TableContainer className="border border-gray-200 rounded-md overflow-auto">
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                              <TableCell sx={{ width: 40 }}>#</TableCell>
                              <TableCell>Component</TableCell>
                              <TableCell>Logic</TableCell>
                              <TableCell>Value</TableCell>
                              <TableCell>Preview</TableCell>
                              <TableCell>% of CTC</TableCell>
                              <TableCell sx={{ width: 80 }}>Action</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {earnings.map((e, i) => {
                              const isSpecial = isSpecialAllowance(e.componentName);
                              const monthlyCtc = previewData?.annualCtc ? previewData.annualCtc / 12 : 0;
                              let percentageOfCTC = 0;
                              
                              if (previewData && monthlyCtc > 0) {
                                if (isSpecial) {
                                  const specialEarning = previewData.earnings?.find(
                                    (pe: any) => isSpecialAllowance(pe.componentName)
                                  );
                                  if (specialEarning) {
                                    percentageOfCTC = (specialEarning.monthlyValue / monthlyCtc) * 100;
                                  }
                                } else {
                                  percentageOfCTC = (e.value / monthlyCtc) * 100;
                                }
                              }
                              
                              return (
                                <TableRow key={i} sx={getRowColor(i)}>
                                  <TableCell>{i + 1}</TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                        {e.componentName}
                                      </Typography>
                                      {isSpecial && (
                                        <Chip
                                          label="Balancing"
                                          size="small"
                                          color="primary"
                                          sx={{ height: 16, fontSize: '0.55rem' }}
                                        />
                                      )}
                                      {isSpecial && (
                                        <Tooltip title="Special Allowance is automatically calculated to balance the CTC. Value = CTC - Sum of all other earnings.">
                                          <IconButton size="small" sx={{ p: 0 }}>
                                            <InfoIcon fontSize="small" className="text-gray-400" style={{ fontSize: '14px' }} />
                                          </IconButton>
                                        </Tooltip>
                                      )}
                                    </Box>
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2">
                                      {getCalculationLabel(e.calculationLogic)}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <TextField
                                      type="number"
                                      value={e.value}
                                      onChange={(ev) => updateValue("earning", i, Number(ev.target.value))}
                                      sx={{ width: 100 }}
                                      size="small"
                                      disabled={isSpecial}
                                      placeholder={isSpecial ? "Auto" : ""}
                                     
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                      {isSpecial && previewData ? 
                                        formatCurrency(
                                          previewData.earnings?.find(
                                            (pe: any) => isSpecialAllowance(pe.componentName)
                                          )?.monthlyValue || e.value
                                        )
                                        : getValueDisplay(e.calculationLogic, e.value, e.componentName, previewData)
                                      }
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontWeight: 600, 
                                        color: isSpecial ? 'primary.main' : 'text.primary' 
                                      }}
                                    >
                                      {percentageOfCTC > 0 ? `${percentageOfCTC.toFixed(2)}%` : '-'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="text" 
                                      color="error" 
                                      size="small" 
                                      onClick={() => removeComponent("earning", i)}
                                      disabled={isSpecial && earnings.length <= 1}
                                    >
                                      Remove
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Summary Section */}
                      {previewData && (
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'flex-end', 
                          mt: 2, 
                          p: 1.5, 
                          bgcolor: alpha(theme.palette.primary.main, 0.04),
                          borderRadius: 1 
                        }}>
                          <Stack spacing={0.5} sx={{ minWidth: 250 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" className="text-gray-500">
                                Total CTC (Monthly)
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                {formatCurrency(previewData.annualCtc / 12)}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption" className="text-gray-500">
                                Total Earnings
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
                                {formatCurrency(previewData.grossEarningsMonthly)} ({((previewData.grossEarningsMonthly / (previewData.annualCtc / 12)) * 100).toFixed(2)}%)
                              </Typography>
                            </Box>
                            {earnings.some(e => isSpecialAllowance(e.componentName)) && (
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" className="text-gray-500">
                                  Special Allowance
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                  {formatCurrency(
                                    previewData.earnings?.find(
                                      (pe: any) => isSpecialAllowance(pe.componentName)
                                    )?.monthlyValue || 0
                                  )} (
                                  {(
                                    ((previewData.earnings?.find(
                                      (pe: any) => isSpecialAllowance(pe.componentName)
                                    )?.monthlyValue || 0) / (previewData.annualCtc / 12)) * 100
                                  ).toFixed(2)}%)
                                </Typography>
                              </Box>
                            )}
                            {isPreviewLoading && (
                              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                <CircularProgress size={20} />
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box className="border-gray-200" sx={{ border: `2px dashed ${theme.palette.divider}`, borderRadius: 2, p: 6, textAlign: "center" }}>
                      <PlusIcon sx={{ fontSize: 32, color: "text.secondary", mb: 1 }} className="text-gray-500" />
                      <Typography className="text-gray-500">
                        No earnings added yet. Select a component above.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}

              {/* Step 2: Deductions */}
              {currentStep === 2 && (
                <Stack spacing={3}>
                  <Box>
                    <div className="text-gray-800 font-bold text-[12px]">
                      Configure Deductions
                    </div>
                    <Typography className="text-gray-500">
                      Add statutory and voluntary deductions
                    </Typography>
                  </Box>

                  <FormControl sx={{ maxWidth: 300 }}>
                    <InputLabel>Add deduction component...</InputLabel>
                    <Select
                      value=""
                      onChange={(e) => addComponent("deduction", e.target.value)}
                      label="Add deduction component..."
                    >
                      {salaryComponents.deductions.map((c) => (
                        <MenuItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </MenuItem>
                      ))}
                      <MenuItem className="!text-primary" onClick={() => navigate("/payroll/components")}>
                        <AddCircle className="mr-2" /> Add New Deduction
                      </MenuItem>
                    </Select>
                  </FormControl>

                  {deductions.length > 0 ? (
                    <TableContainer className="border border-gray-200 rounded-md max-h-[calc(100vh-500px)] overflow-auto">
                      <Table>
                        <TableHead>
                          <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                            <TableCell sx={{ width: 40 }}>#</TableCell>
                            <TableCell>Component</TableCell>
                            <TableCell>Logic</TableCell>
                            <TableCell>Value</TableCell>
                            <TableCell>Preview</TableCell>
                            <TableCell sx={{ width: 80 }}>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {deductions.map((d, i) => (
                            <TableRow key={i} sx={getRowColor(i)}>
                              <TableCell>{i + 1}</TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {d.componentName}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2">
                                  {getCalculationLabel(d.calculationLogic)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  value={d.value}
                                  onChange={(ev) => updateValue("deduction", i, Number(ev.target.value))}
                                  size="small"
                                  sx={{ width: 100 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                  {getValueDisplay(d.calculationLogic, d.value, d.componentName, previewData)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Button variant="text" size="small" onClick={() => removeComponent("deduction", i)} sx={{ color: "error.main", textTransform: "none" }}>
                                  Remove
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box className="border-gray-200" sx={{ border: `2px dashed ${theme.palette.divider}`, borderRadius: 2, p: 6, textAlign: "center" }}>
                      <PlusIcon sx={{ fontSize: 32, mb: 1 }} className="text-gray-800" />
                      <Typography variant="body2" className="text-gray-800">
                        No deductions added yet. Select a component above.
                      </Typography>
                    </Box>
                  )}
                </Stack>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <Stack spacing={2}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }} className="text-gray-800">
                      Review & Publish
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={fetchPreview}
                      sx={{ textTransform: "none" }}
                    >
                      Refresh Preview
                    </Button>
                  </Box>

                  {validationErrors.length > 0 && (
                    <Alert severity="warning" icon={<ErrorIcon />}>
                      <AlertTitle>Warnings</AlertTitle>
                      <ul style={{ margin: 0, paddingLeft: 20 }}>
                        {validationErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </Alert>
                  )}

                  <div className="p-3 rounded-md border border-gray-200 bg-head">
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600 }} className="text-gray-800">
                          {basicInfo.name || "Untitled Template"}
                        </Typography>
                        <Typography variant="body2" className="text-gray-500 mt-1">
                          {basicInfo.description || "No description provided"}
                        </Typography>
                      </Box>
                      <Chip label={basicInfo.code} className="bg-gray-200 text-gray-800" />
                    </Box>
                    <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                      {basicInfo.applicableFor.map((t) => (
                        <Chip key={t} label={t} size="small" variant="filled" color="info" />
                      ))}
                      {basicInfo.gradeLevels.map((g) => (
                        <Chip key={g} label={g} size="small" color="primary" variant="outlined" />
                      ))}
                    </Box>
                  </div>

                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card className="!bg-white-50 !border-green-800 !border" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ color: "success.main", fontWeight: 600, mb: 1 }}>
                            Earnings ({earnings.length})
                          </Typography>
                          <Stack spacing={1}>
                            {earnings.length === 0 && (
                              <Typography variant="body2" className="text-gray-500">
                                No earnings configured
                              </Typography>
                            )}
                            {earnings.map((e, i) => {
                              const isSpecial = isSpecialAllowance(e.componentName);
                              const displayValue = isSpecial && previewData
                                ? formatCurrency(
                                    previewData.earnings?.find(
                                      (pe: any) => isSpecialAllowance(pe.componentName)
                                    )?.monthlyValue || e.value
                                  )
                                : getValueDisplay(e.calculationLogic, e.value, e.componentName, previewData);
                              
                              return (
                                <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <Typography variant="body2" className="text-gray-500">
                                    {e.componentName}
                                    {isSpecial && (
                                      <Chip
                                        label="Balancing"
                                        size="small"
                                        color="primary"
                                        sx={{ ml: 1, height: 16, fontSize: '0.55rem' }}
                                      />
                                    )}
                                    <span className="text-[10px]"> ({getCalculationLabel(e.calculationLogic)})</span>
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }} className="text-gray-800 !font-bold">
                                    {displayValue}
                                  </Typography>
                                </Box>
                              );
                            })}
                            {earnings.length > 0 && (
                              <>
                                <Divider className="border border-gray-200" />
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }} className="text-gray-800">
                                    Gross Earnings (Monthly)
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                                    {formatCurrency(previewData?.grossEarningsMonthly || earnings.reduce((s, e) => s + e.value, 0))}
                                  </Typography>
                                </Box>
                              </>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card className="!bg-white-50 !border-red-800 !border" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.error.main, 0.2)}` }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ color: "error.main", fontWeight: 600, mb: 1 }}>
                            Deductions ({deductions.length})
                          </Typography>
                          <Stack spacing={1}>
                            {deductions.length === 0 && (
                              <Typography variant="body2" className="text-gray-500">
                                No deductions configured
                              </Typography>
                            )}
                            {deductions.map((d, i) => (
                              <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="body2" className="text-gray-500">
                                  {d.componentName}
                                  <span className="text-[10px]"> ({getCalculationLabel(d.calculationLogic)})</span>
                                </Typography>
                                <Typography variant="body2" className="text-gray-800" sx={{ fontWeight: 500 }}>
                                  {getValueDisplay(d.calculationLogic, d.value, d.componentName, previewData)}
                                </Typography>
                              </Box>
                            ))}
                            {deductions.length > 0 && (
                              <>
                                <Divider className="border border-gray-200" />
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }} className="text-gray-800">
                                    Total Deductions (Monthly)
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: "error.main" }}>
                                    {formatCurrency(previewData?.totalDeductionsMonthly || deductions.reduce((s, d) => s + d.value, 0))}
                                  </Typography>
                                </Box>
                              </>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>

                  <Card sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`, bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    <CardContent className="!pb-3 !bg-white-50">
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography variant="caption" className="text-gray-500">Gross Monthly</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>
                              {formatCurrency(previewData?.grossEarningsMonthly || earnings.reduce((s, e) => s + e.value, 0))}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography variant="caption" className="text-gray-500">Total Deductions</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "error.main" }}>
                              {formatCurrency(previewData?.totalDeductionsMonthly || deductions.reduce((s, d) => s + d.value, 0))}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography variant="caption" className="text-gray-500">Net Monthly</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 700, color: "primary.main" }}>
                              {formatCurrency(
                                previewData?.netMonthly ||
                                (earnings.reduce((s, e) => s + e.value, 0) - deductions.reduce((s, d) => s + d.value, 0))
                              )}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 3 }}>
                          <Box sx={{ textAlign: "center" }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }} className="text-gray-800">
                              Annual CTC
                            </Typography>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: "primary.main" }}>
                              {formatCurrency(previewData?.annualCtc || calculateTotalCTC())}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Stack>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 2 }}>
            <Button
              variant="outlined"
              className={`!text-primary !border-primary ${currentStep === 0 ? 'invisible' : ''}`}
              onClick={handleBack}
              disabled={currentStep === 0 || saving}
              startIcon={<ChevronLeftIcon fontSize="small" />}
              sx={{ textTransform: "none" }}
            >
              Previous
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              {currentStep === 3 && (
                <>
                  {basicInfo.status !== 'PUBLISHED' && (
                    <Button
                      variant="outlined"
                      onClick={() => handleSave(true)}
                      disabled={saving}
                      sx={{ textTransform: "none" }}
                    >
                      {saving ? "Saving..." : "Save as Draft"}
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="success"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <BookTemplateIcon fontSize="small" />}
                    sx={{ textTransform: "none" }}
                  >
                    {saving ? "Publishing..." : isEditing ? (basicInfo.status === 'DRAFT' ? "Update & Publish" : "Update") : "Publish Template"}
                  </Button>
                </>
              )}
              {currentStep < 3 && (
                <Button
                  variant="contained"
                  className="!bg-primary"
                  onClick={handleNext}
                  disabled={saving || isPreviewLoading}
                  endIcon={<ChevronRightIcon fontSize="small" />}
                  sx={{ textTransform: "none" }}
                >
                  {isPreviewLoading ? <CircularProgress size={20} color="inherit" /> : "Next"}
                </Button>
              )}
            </Box>
          </Box>
        </>
      )}
    </div>
  );
}