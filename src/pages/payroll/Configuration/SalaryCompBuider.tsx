import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Chip,
  IconButton,
  Stack,
  useTheme,
  alpha,
  Grid,
  CircularProgress,
  Tooltip,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  Add as PlusIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  TrendingUp as TrendingUpIcon,
  RemoveCircle as MinusCircleIcon,
  CardGiftcard as GiftIcon,
  Close as CloseIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { salaryComponentsService, type SalaryComponent } from "../../../services/modules/payrollServices/components";
import { useUI } from "../../../context/Snackbar";
import { getRowColor } from "../../const";
import { calcLabel, typeConfig } from "../const";

export default function SalaryComponentBuilder() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();
  const [components, setComponents] = useState<SalaryComponent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<SalaryComponent | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  // const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    earningComponents: 0,
    deductionComponents: 0,
    benefitComponents: 0,
    totalComponents: 0,
  });

  // Formula validation states
  const [formulaValidation, setFormulaValidation] = useState<{
    valid: boolean;
    message: string;
    referencedCodes: string[];
    unknownCodes: string[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    componentType: "earning",
    calculationType: "FIXED_AMOUNT",
    calculationValue: 0,
    taxable: false,
    displayOrder: 0,
    formulaExpression: "",
    minAmount: 0,
    maxAmount: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // setLoading(true);
    showSpinner();
    try {
      const [componentsResponse, summaryResponse]: any = await Promise.all([
        salaryComponentsService.getComponents(),
        salaryComponentsService.getComponentSummary(),
      ]);

      const list = (componentsResponse.data?.content || []).map((component: any) => ({
        id: component.id,
        name: component.name,
        code: component.code,
        type: (component.componentType || "earning").toLowerCase(),
        componentType: component.componentType,
        calculationType: component.calculationType || "FIXED",
        calculationValue: component.calculationValue || 0,
        taxable: Boolean(component.taxable),
        displayOrder: component.displayOrder || 0,
        formulaExpression: component.formulaExpression || "",
        minAmount: component.minAmount || 0,
        maxAmount: component.maxAmount || 0,
        active: component.active,
        createdAt: component.createdAt,
        updatedAt: component.updatedAt,
      }));

      setComponents(list);
      setSummary(summaryResponse.data || {
        earningComponents: 0,
        deductionComponents: 0,
        benefitComponents: 0,
        totalComponents: 0,
      });
    } catch (error) {
      showSnackbar("Failed to load salary components", "error");
    } finally {
      hideSpinner();
      // setLoading(false);
    }
  };

  const handleValidateFormula = async () => {
    if (!formData.formulaExpression) {
      showSnackbar("Please enter a formula to validate", "warning");
      return;
    }

    setIsValidating(true);
    try {
      const response: any = await salaryComponentsService.validateFormula({
        expression: formData.formulaExpression,
      });
      setFormulaValidation(response.data);

      if (response.data.valid) {
        showSnackbar("Formula is valid!", "success");
      } else {
        showSnackbar("Formula validation failed", "error");
      }
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to validate formula", "error");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      showSnackbar("Please fill all required fields", "warning");
      return;
    }

    // Validate based on calculation type
    if (formData.calculationType === "FIXED_AMOUNT" && formData.calculationValue <= 0) {
      showSnackbar("Please enter a valid amount for Fixed Amount", "warning");
      return;
    }

    if ((formData.calculationType === "PERCENT_OF_BASIC" || formData.calculationType === "PERCENT_OF_CTC") &&
      (formData.calculationValue < 0 || formData.calculationValue > 100)) {
      showSnackbar("Percentage must be between 0 and 100", "warning");
      return;
    }

    if (formData.calculationType === "FORMULA" && !formData.formulaExpression) {
      showSnackbar("Please enter a formula expression", "warning");
      return;
    }

    // If formula type, validate before saving
    if (formData.calculationType === "FORMULA" && formData.formulaExpression) {
      try {
        const validationResponse: any = await salaryComponentsService.validateFormula({
          expression: formData.formulaExpression,
        });
        if (!validationResponse.data.valid) {
          showSnackbar(`Formula is invalid: ${validationResponse.data.message}`, "error");
          return;
        }
      } catch (error) {
        showSnackbar("Please validate your formula before saving", "warning");
        return;
      }
    }

    showSpinner();
    try {
      if (editingComponent) {
        await salaryComponentsService.updateComponent(editingComponent.id, formData);
        showSnackbar("Component updated successfully!", "success");
      } else {
        await salaryComponentsService.createComponent(formData);
        showSnackbar("Component created successfully!", "success");
      }
      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error: any) {
      showSnackbar(error?.message || "Failed to save component", "error");
    } finally {
      hideSpinner();
    }
  };

  const handleDelete = async (cmp: SalaryComponent) => {
    showConfirmDialog({
      title: 'Delete Component',
      message: `Are you sure you want to delete "${cmp.name}"?`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          showSpinner();
          await salaryComponentsService.deleteComponent(cmp.id);
          showSnackbar("Component deleted successfully!", "success");
          loadData();
        } catch (error: any) {
          showSnackbar(error?.message || "Failed to delete component", "error");
        } finally {
          hideSpinner();
        }
      }
    });
  };

  const handleOpenDialog = (component?: SalaryComponent) => {
    if (component) {
      setEditingComponent(component);
      setFormData({
        name: component.name,
        code: component.code,
        componentType: component.componentType,
        calculationType: component.calculationType || "FIXED",
        calculationValue: component.calculationValue || 0,
        taxable: component.taxable || false,
        displayOrder: component.displayOrder || components.length + 1,
        formulaExpression: component.formulaExpression || "",
        minAmount: component.minAmount || 0,
        maxAmount: component.maxAmount || 0,
      });
      setFormulaValidation(null);
    } else {
      setEditingComponent(null);
      setFormData({
        name: "",
        code: "",
        componentType: "earning",
        calculationType: "FIXED",
        calculationValue: 0,
        taxable: false,
        displayOrder: components.length + 1,
        formulaExpression: "",
        minAmount: 0,
        maxAmount: 0,
      });
      setFormulaValidation(null);
    }
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      componentType: "earning",
      calculationType: "FIXED",
      calculationValue: 0,
      taxable: false,
      displayOrder: components.length + 1,
      formulaExpression: "",
      minAmount: 0,
      maxAmount: 0,
    });
    setFormulaValidation(null);
    setEditingComponent(null);
  };

  const filtered = components.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || c.componentType === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <Box className="bg-white-50">
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" className="text-gray-800 !font-bold">
            Salary Component Builder
          </Typography>
          <Typography variant="body2" className="text-gray-500 mt-1">
            Define earnings, deductions, and benefits for your salary structures
          </Typography>
        </Box>
        <Button variant="contained" className="!bg-primary" startIcon={<PlusIcon fontSize="small" />} onClick={() => handleOpenDialog()} sx={{ textTransform: "none" }}>
          Add Component
        </Button>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        {[
          { label: "Earning Components", value: summary.earningComponents, icon: <TrendingUpIcon />, color: "#10b981" },
          { label: "Deduction Components", value: summary.deductionComponents, icon: <MinusCircleIcon />, color: "#ef4444" },
          { label: "Benefit Components", value: summary.benefitComponents, icon: <GiftIcon />, color: "#3b82f6" },
          { label: "Total Components", value: summary.totalComponents, icon: <CalculateIcon />, color: "#8b5cf6" },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha(stat.color, 0.1), color: stat.color }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h5" className="text-gray-800 !font-bold">
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" className="text-gray-500">
                    {stat.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 200, maxWidth: 350 }}
        />
        <Box className="border-gray-200" sx={{ display: "flex", gap: 0.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 0.5 }}>
          {["all", "EARNING", "DEDUCTION", "BENEFIT"].map((t) => (
            <Button
              key={t}
              variant={filterType === t ? "contained" : "text"}
              size="small"
              className={filterType === t ? "!bg-primary !text-white" : "!text-gray-800"}
              onClick={() => setFilterType(t)}
              sx={{ textTransform: "capitalize", minWidth: 60, fontSize: "0.75rem" }}
            >
              {t}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Table */}
      <TableContainer className="border border-gray-200 rounded-md max-h-[calc(100vh-370px)] overflow-auto">
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell className="!font-bold">S No</TableCell>
              <TableCell className="!font-bold">Component</TableCell>
              <TableCell className="!font-bold">Code</TableCell>
              <TableCell className="!font-bold">Type</TableCell>
              <TableCell className="!font-bold">Calculation Type</TableCell>
              <TableCell className="!font-bold">Value</TableCell>
              <TableCell className="!font-bold">Taxable</TableCell>
              <TableCell className="!font-bold" align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <div className="py-6 text-gray-500">No components match your search.</div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((component, i) => {
                const config = typeConfig[component.componentType as keyof typeof typeConfig];
                return (
                  <TableRow key={component.id} sx={getRowColor(i)}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {component.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={component.code} size="small" className="text-gray-800 bg-gray-200" />
                    </TableCell>
                    <TableCell>
                      <Chip label={config.label} size="small" sx={{ bgcolor: config.bgColor, color: config.color, fontSize: "0.7rem", fontWeight: 500 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" className="text-gray-800">
                        {calcLabel[component.calculationType] || component.calculationType}
                      </Typography>
                    </TableCell>
                    {/* <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {component.calculationType === "FIXED"
                          ? `₹${component.calculationValue?.toLocaleString()}`
                          : `${component.calculationValue}%`}
                      </Typography>
                    </TableCell> */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {component.calculationType === "FIXED_AMOUNT" && (
                          `₹${component.calculationValue?.toLocaleString()}`
                        )}
                        {component.calculationType === "PERCENT_OF_BASIC" && (
                          `${component.calculationValue}% of Basic`
                        )}
                        {component.calculationType === "PERCENT_OF_CTC" && (
                          `${component.calculationValue}% of CTC`
                        )}
                        {component.calculationType === "FORMULA" && (
                          `Formula: ${component.formulaExpression || 'N/A'}`
                        )}
                        {component.calculationType === "SLAB_BASED" && (
                          `₹${component.calculationValue}/month`
                        )}
                        {!component.calculationType && (
                          `${component.calculationValue}%`
                        )}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {component.taxable ? (
                        <Chip label="Taxable" size="small" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main, fontSize: "0.7rem" }} />
                      ) : (
                        <Chip label="Non-taxable" size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} className="text-gray-800" />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => handleOpenDialog(component)} sx={{ "&:hover": { color: "primary.main" } }}>
                            <EditIcon fontSize="small" className="!w-4 text-blue-500" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => handleDelete(component)} sx={{ "&:hover": { color: "error.main" } }}>
                            <DeleteIcon fontSize="small" className="!w-4 text-error" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Tips */}
      <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.04), display: "flex", gap: 2 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CalculateIcon sx={{ fontSize: 16, color: "primary.main" }} />
        </Box>
        <Box>
          <Typography sx={{ fontWeight: 600 }}>
            Formula Builder Tips
          </Typography>
          <Typography className="text-gray-500 mt-1">
            Use component codes as variables in formulas. Example:{" "}
            <code className="border border-gray-200 p-1 bg-primary-100 font-bold text-primary">
              (BASIC * 0.5) + 1000
            </code>
            . Supported operators: +, −, *, /, ( )
          </Typography>
        </Box>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={() => { setIsDialogOpen(false); resetForm(); }} maxWidth="md" fullWidth>
        <div className="flex items-center justify-between !p-2 border-b border-gray-200">
          <Typography variant="h6" className="!ml-4">
            {editingComponent ? "Edit Salary Component" : "Add Salary Component"}
          </Typography>
          <IconButton onClick={() => { setIsDialogOpen(false); resetForm(); }} size="small">
            <CloseIcon className="!w-4 text-gray-800" />
          </IconButton>
        </div>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Component Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Basic Salary"
                  fullWidth
                  required
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Component Code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., BASIC"
                  fullWidth
                  required
                />
              </Grid>
            </Grid>

            <FormControl component="fieldset">
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Component Type <span className="text-red-500">*</span>
              </Typography>
              <RadioGroup
                row
                value={formData.componentType}
                onChange={(e) => setFormData({ ...formData, componentType: e.target.value })}
              >
                <FormControlLabel value="earning" checked={formData.componentType == 'EARNING' ? true : false} control={<Radio className="text-gray-800" />} label="Earning" />
                <FormControlLabel value="deduction" checked={formData.componentType == 'DEDUCTION' ? true : false} control={<Radio className="text-gray-800" />} label="Deduction" />
                <FormControlLabel value="benefit" checked={formData.componentType == 'BENEFIT' ? true : false} control={<Radio className="text-gray-800" />} label="Benefit" />
              </RadioGroup>
            </FormControl>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Calculation Type</InputLabel>
                  <Select
                    value={formData.calculationType || 'FIXED_AMOUNT'}
                    onChange={(e) => {
                      setFormData({ ...formData, calculationType: e.target.value });
                      setFormulaValidation(null);
                    }}
                    label="Calculation Type"
                  >
                    {/* {Object.entries(calcLabel).map(([k, v]) => (
                      <MenuItem key={k} value={k}>{v}</MenuItem>
                    ))} */}
                    <MenuItem value="FIXED_AMOUNT">Fixed Amount</MenuItem>
                    <MenuItem value="PERCENT_OF_BASIC">% of Basic</MenuItem>
                    <MenuItem value="PERCENT_OF_CTC">% of CTC</MenuItem>
                    <MenuItem value="FORMULA">Formula</MenuItem>
                    <MenuItem value="SLAB_BASED">Slab Based</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Calculation Value"
                  type="number"
                  value={formData.calculationValue}
                  onChange={(e) => setFormData({ ...formData, calculationValue: Number(e.target.value) })}
                  placeholder="0"
                  fullWidth
                />
              </Grid>
            </Grid>

            {formData.calculationType === "FORMULA" && (
              <Box>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Formula Expression *"
                      value={formData.formulaExpression}
                      onChange={(e) => {
                        setFormData({ ...formData, formulaExpression: e.target.value });
                        setFormulaValidation(null);
                      }}
                      placeholder="e.g., (BASIC * 0.4) + (HRA * 0.5)"
                      multiline
                      rows={3}
                      fullWidth
                      helperText="Available variables: Use component codes as variables"
                    />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    variant="outlined"
                    onClick={handleValidateFormula}
                    disabled={isValidating || !formData.formulaExpression}
                    startIcon={isValidating ? <CircularProgress size={16} /> : <CalculateIcon />}
                  >
                    {isValidating ? "Validating..." : "Validate Formula"}
                  </Button>
                </Box>

                {formulaValidation && (
                  <Alert
                    severity={formulaValidation.valid ? "success" : "error"}
                    sx={{ mt: 2 }}
                    icon={formulaValidation.valid ? <CheckCircleIcon /> : <ErrorIcon />}
                  >
                    <AlertTitle>{formulaValidation.valid ? "Valid Formula" : "Invalid Formula"}</AlertTitle>
                    {formulaValidation.message}
                    {formulaValidation.referencedCodes.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography>
                          <strong>Referenced Components:</strong> {formulaValidation.referencedCodes.join(", ")}
                        </Typography>
                      </Box>
                    )}
                    {formulaValidation.unknownCodes.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography color="error">
                          <strong>Unknown Components:</strong> {formulaValidation.unknownCodes.join(", ")}
                        </Typography>
                      </Box>
                    )}
                  </Alert>
                )}
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Min Amount (Optional)"
                  type="number"
                  value={formData.minAmount || ""}
                  onChange={(e) => setFormData({ ...formData, minAmount: Number(e.target.value) || 0 })}
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Max Amount (Optional)"
                  type="number"
                  value={formData.maxAmount || ""}
                  onChange={(e) => setFormData({ ...formData, maxAmount: Number(e.target.value) || 0 })}
                  fullWidth
                />
              </Grid>
            </Grid>

            <div className="flex items-center justify-between p-4 rounded-sm border border-gray-200">
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Taxable Component
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  Include this component in tax calculations
                </Typography>
              </Box>
              <Switch checked={formData.taxable} onChange={(e) => setFormData({ ...formData, taxable: e.target.checked })} />
            </div>

            <TextField
              label="Display Order"
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button onClick={() => { setIsDialogOpen(false); resetForm(); }} variant="outlined" className="!text-gray-800 !border-gray-200">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" className="!bg-primary">
            {editingComponent ? "Update" : "Create"} Component
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}