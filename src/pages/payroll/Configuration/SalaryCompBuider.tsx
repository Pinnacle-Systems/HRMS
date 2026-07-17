import { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
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
  Paper,
  Chip,
  IconButton,
  Stack,
  useTheme,
  alpha,
  Grid,
  InputAdornment,
} from "@mui/material";
import {
  Add as PlusIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  RemoveCircle as MinusCircleIcon,
  CardGiftcard as GiftIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

// Mock data - replace with your actual API data
const mockSalaryComponents = [
  {
    id: "1",
    name: "Basic Salary",
    code: "BASIC",
    type: "earning",
    calculationType: "fixed",
    calculationValue: 40000,
    taxable: true,
    displayOrder: 1,
  },
  {
    id: "2",
    name: "House Rent Allowance",
    code: "HRA",
    type: "earning",
    calculationType: "percentage_basic",
    calculationValue: 40,
    taxable: false,
    displayOrder: 2,
  },
  {
    id: "3",
    name: "Conveyance Allowance",
    code: "CONV",
    type: "earning",
    calculationType: "fixed",
    calculationValue: 1600,
    taxable: false,
    displayOrder: 3,
  },
  {
    id: "4",
    name: "Professional Tax",
    code: "PT",
    type: "deduction",
    calculationType: "fixed",
    calculationValue: 200,
    taxable: false,
    displayOrder: 4,
  },
  {
    id: "5",
    name: "Provident Fund",
    code: "PF",
    type: "deduction",
    calculationType: "percentage_basic",
    calculationValue: 12,
    taxable: false,
    displayOrder: 5,
  },
  {
    id: "6",
    name: "Health Insurance",
    code: "HI",
    type: "benefit",
    calculationType: "fixed",
    calculationValue: 5000,
    taxable: false,
    displayOrder: 6,
  },
];

const typeConfig = {
  earning: { label: "Earning", color: "#10b981", bgColor: "#d1fae5" },
  deduction: { label: "Deduction", color: "#ef4444", bgColor: "#fee2e2" },
  benefit: { label: "Benefit", color: "#3b82f6", bgColor: "#dbeafe" },
};

const calcLabel: Record<string, string> = {
  fixed: "Fixed Amount",
  percentage_ctc: "% of CTC",
  percentage_basic: "% of Basic",
  slab: "Slab Based",
  formula: "Formula",
};

export default function SalaryComponentBuilder() {
  const theme = useTheme();
  const [components, setComponents] = useState(mockSalaryComponents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "earning",
    calculationType: "fixed",
    calculationValue: 0,
    taxable: false,
    displayOrder: components.length + 1,
    formula: "",
    minAmount: 0,
    maxAmount: 0,
  });

  const filtered = components.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    earnings: components.filter((c) => c.type === "earning").length,
    deductions: components.filter((c) => c.type === "deduction").length,
    benefits: components.filter((c) => c.type === "benefit").length,
  };

  const handleOpenDialog = (component?: any) => {
    if (component) {
      setEditingComponent(component);
      setFormData(component);
    } else {
      setEditingComponent(null);
      setFormData({
        name: "",
        code: "",
        type: "earning",
        calculationType: "fixed",
        calculationValue: 0,
        taxable: false,
        displayOrder: components.length + 1,
        formula: "",
        minAmount: 0,
        maxAmount: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingComponent(null);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      return;
    }
    if (editingComponent) {
      setComponents(
        components.map((c) =>
          c.id === editingComponent.id ? { ...c, ...formData } : c
        )
      );
    } else {
      setComponents([
        ...components,
        { ...formData, id: `${Date.now()}` },
      ]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setComponents(components.filter((c) => c.id !== id));
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
            Salary Component Builder
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Define earnings, deductions, and benefits for your salary structures
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PlusIcon fontSize="small" />}
          onClick={() => handleOpenDialog()}
          sx={{ textTransform: "none" }}
        >
          Add Component
        </Button>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: "Earning Components", value: stats.earnings, icon: <TrendingUpIcon />, color: "#10b981" },
          { label: "Deduction Components", value: stats.deductions, icon: <MinusCircleIcon />, color: "#ef4444" },
          { label: "Benefit Components", value: stats.benefits, icon: <GiftIcon />, color: "#3b82f6" },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
            <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: alpha(stat.color, 0.1),
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {stat.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
        <TextField
          placeholder="Search components..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 200, maxWidth: 350 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ display: "flex", gap: 0.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 0.5 }}>
          {["all", "earning", "deduction", "benefit"].map((t) => (
            <Button
              key={t}
              variant={filterType === t ? "contained" : "text"}
              size="small"
              onClick={() => setFilterType(t)}
              sx={{
                textTransform: "capitalize",
                minWidth: 60,
                fontSize: "0.75rem",
                ...(filterType !== t && { color: "text.secondary" }),
              }}
            >
              {t}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Table */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Component
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Code
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Type
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Calculation
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Value
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Taxable
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    No components match your search. Try adjusting the filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((component) => {
                  const config = typeConfig[component.type as keyof typeof typeConfig];
                  return (
                    <TableRow
                      key={component.id}
                      hover
                      sx={{
                        "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {component.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={component.code}
                          size="small"
                          sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={config.label}
                          size="small"
                          sx={{
                            bgcolor: config.bgColor,
                            color: config.color,
                            fontSize: "0.7rem",
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {calcLabel[component.calculationType] || component.calculationType}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {component.calculationType === "fixed"
                            ? `₹${component.calculationValue?.toLocaleString()}`
                            : `${component.calculationValue}%`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {component.taxable ? (
                          <Chip
                            label="Taxable"
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.warning.main, 0.1),
                              color: theme.palette.warning.main,
                              fontSize: "0.7rem",
                            }}
                          />
                        ) : (
                          <Chip
                            label="Non-taxable"
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(component)}
                            sx={{
                              color: "text.secondary",
                              "&:hover": {
                                color: "primary.main",
                                bgcolor: alpha(theme.palette.primary.main, 0.08),
                              },
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(component.id)}
                            sx={{
                              color: "text.secondary",
                              "&:hover": {
                                color: "error.main",
                                bgcolor: alpha(theme.palette.error.main, 0.08),
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Tips */}
      <Box
        sx={{
          mt: 3,
          p: 2.5,
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          display: "flex",
          gap: 2,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <CalculateIcon sx={{ fontSize: 16, color: "primary.main" }} />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Formula Builder Tips
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Use component codes as variables in formulas. Example:{" "}
            <code style={{
              background: theme.palette.background.paper,
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: "0.75rem",
              fontFamily: "monospace",
              border: `1px solid ${theme.palette.divider}`,
            }}>
              (BASIC * 0.5) + 1000
            </code>
            . Supported operators: +, −, *, /, ( )
          </Typography>
        </Box>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h6">
              {editingComponent ? "Edit Salary Component" : "Add Salary Component"}
            </Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Component Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Basic Salary"
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Component Code *"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., BASIC"
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            <FormControl component="fieldset">
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Component Type *
              </Typography>
              <RadioGroup
                row
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <FormControlLabel value="earning" control={<Radio />} label="Earning" />
                <FormControlLabel value="deduction" control={<Radio />} label="Deduction" />
                <FormControlLabel value="benefit" control={<Radio />} label="Benefit" />
              </RadioGroup>
            </FormControl>

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Calculation Type</InputLabel>
                  <Select
                    value={formData.calculationType}
                    onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
                    label="Calculation Type"
                  >
                    {Object.entries(calcLabel).map(([k, v]) => (
                      <MenuItem key={k} value={k}>{v}</MenuItem>
                    ))}
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
                  size="small"
                />
              </Grid>
            </Grid>

            {formData.calculationType === "formula" && (
              <TextField
                label="Formula"
                value={formData.formula || ""}
                onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                placeholder="e.g., (BASIC * 0.4) + (HRA * 0.5)"
                multiline
                rows={3}
                fullWidth
                size="small"
                helperText="Available variables: CTC, BASIC, HRA, SPECIAL, TRANSPORT"
              />
            )}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Min Amount (Optional)"
                  type="number"
                  value={formData.minAmount || ""}
                  onChange={(e) => setFormData({ ...formData, minAmount: Number(e.target.value) || 0 })}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Max Amount (Optional)"
                  type="number"
                  value={formData.maxAmount || ""}
                  onChange={(e) => setFormData({ ...formData, maxAmount: Number(e.target.value) || 0 })}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 2,
                borderRadius: 1,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Taxable Component
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Include this component in tax calculations
                </Typography>
              </Box>
              <Switch
                checked={formData.taxable}
                onChange={(e) => setFormData({ ...formData, taxable: e.target.checked })}
              />
            </Box>

            <TextField
              label="Display Order"
              type="number"
              value={formData.displayOrder}
              onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseDialog} variant="outlined" sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" sx={{ textTransform: "none" }}>
            {editingComponent ? "Update" : "Create"} Component
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}