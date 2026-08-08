// import { useEffect, useState } from "react";
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   RadioGroup,
//   FormControlLabel,
//   Radio,
//   Switch,
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableRow,
//   TableContainer,
//   Chip,
//   IconButton,
//   Stack,
//   useTheme,
//   alpha,
//   Grid,
//   InputAdornment,
// } from "@mui/material";
// import {
//   Add as PlusIcon,
//   Edit as EditIcon,
//   Delete as DeleteIcon,
//   Calculate as CalculateIcon,
//   Search as SearchIcon,
//   TrendingUp as TrendingUpIcon,
//   RemoveCircle as MinusCircleIcon,
//   CardGiftcard as GiftIcon,
//   Close as CloseIcon,
// } from "@mui/icons-material";

// import { salaryComponentsService } from "../../../services/modules/payrollServices/components";

// const normalizeCollection = (response: any) => {
//   const payload = response?.data ?? response;
//   const candidates = [payload?.content, payload?.items, payload?.records, payload?.data?.content, payload?.data, payload];
//   const collection = candidates.find(Array.isArray);
//   return Array.isArray(collection) ? collection : [];
// };

// const typeConfig = {
//   earning: { label: "Earning", color: "#10b981", bgColor: "#d1fae5" },
//   deduction: { label: "Deduction", color: "#ef4444", bgColor: "#fee2e2" },
//   benefit: { label: "Benefit", color: "#3b82f6", bgColor: "#dbeafe" },
// };

// const calcLabel: Record<string, string> = {
//   fixed: "Fixed Amount",
//   percentage_ctc: "% of CTC",
//   percentage_basic: "% of Basic",
//   slab: "Slab Based",
//   formula: "Formula",
// };

// export default function SalaryComponentBuilder() {
//   const theme = useTheme();
//   const [components, setComponents] = useState<any[]>([]);
//   const [isDialogOpen, setIsDialogOpen] = useState(false);
//   const [editingComponent, setEditingComponent] = useState<any>(null);
//   const [search, setSearch] = useState("");
//   const [filterType, setFilterType] = useState("all");
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const loadComponents = async () => {
//       setLoading(true);
//       try {
//         const response = await salaryComponentsService.getComponents();
//         const list = normalizeCollection(response).map((component: any) => ({
//           id: component.id || component.componentId,
//           name: component.name || component.componentName,
//           code: component.code || component.componentCode,
//           type: (component.componentType || component.type || "earning").toLowerCase(),
//           calculationType: component.calculationType || "fixed",
//           calculationValue: component.calculationValue ?? component.defaultValue ?? 0,
//           taxable: Boolean(component.taxable),
//           displayOrder: component.displayOrder || 0,
//         }));
//         setComponents(list);
//         setError("");
//       } catch (err) {
//         console.error("Failed to load salary components", err);
//         setError("Unable to load salary components right now.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadComponents();
//   }, []);

//   const [formData, setFormData] = useState({
//     name: "",
//     code: "",
//     type: "earning",
//     calculationType: "fixed",
//     calculationValue: 0,
//     taxable: false,
//     displayOrder: components.length + 1,
//     formula: "",
//     minAmount: 0,
//     maxAmount: 0,
//   });

//   const filtered = components.filter((c) => {
//     const matchesSearch =
//       c.name.toLowerCase().includes(search.toLowerCase()) ||
//       c.code.toLowerCase().includes(search.toLowerCase());
//     const matchesType = filterType === "all" || c.type === filterType;
//     return matchesSearch && matchesType;
//   });

//   const stats = {
//     earnings: components.filter((c) => c.type === "earning").length,
//     deductions: components.filter((c) => c.type === "deduction").length,
//     benefits: components.filter((c) => c.type === "benefit").length,
//   };

//   const handleOpenDialog = (component?: any) => {
//     if (component) {
//       setEditingComponent(component);
//       setFormData(component);
//     } else {
//       setEditingComponent(null);
//       setFormData({
//         name: "",
//         code: "",
//         type: "earning",
//         calculationType: "fixed",
//         calculationValue: 0,
//         taxable: false,
//         displayOrder: components.length + 1,
//         formula: "",
//         minAmount: 0,
//         maxAmount: 0,
//       });
//     }
//     setIsDialogOpen(true);
//   };

//   const handleCloseDialog = () => {
//     setIsDialogOpen(false);
//     setEditingComponent(null);
//   };

//   const handleSave = () => {
//     if (!formData.name || !formData.code) {
//       return;
//     }
//     if (editingComponent) {
//       setComponents(
//         components.map((c) =>
//           c.id === editingComponent.id ? { ...c, ...formData } : c
//         )
//       );
//     } else {
//       setComponents([
//         ...components,
//         { ...formData, id: `${Date.now()}` },
//       ]);
//     }
//     handleCloseDialog();
//   };

//   const handleDelete = (id: string) => {
//     setComponents(components.filter((c) => c.id !== id));
//   };

//   return (
//     <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
//       {/* Header */}
//       <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
//         <Box>
//           <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
//             Salary Component Builder
//           </Typography>
//           <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
//             Define earnings, deductions, and benefits for your salary structures
//           </Typography>
//         </Box>
//         <Button
//           variant="contained"
//           startIcon={<PlusIcon fontSize="small" />}
//           onClick={() => handleOpenDialog()}
//           sx={{ textTransform: "none" }}
//         >
//           Add Component
//         </Button>
//       </Box>

//       {loading ? (
//         <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>Loading salary components…</Box>
//       ) : error ? (
//         <Box sx={{ py: 4, textAlign: "center", color: "error.main" }}>{error}</Box>
//       ) : (
//       <>
//       {/* Summary Stats */}
//       <Grid container spacing={3} sx={{ mb: 3 }}>
//         {[
//           { label: "Earning Components", value: stats.earnings, icon: <TrendingUpIcon />, color: "#10b981" },
//           { label: "Deduction Components", value: stats.deductions, icon: <MinusCircleIcon />, color: "#ef4444" },
//           { label: "Benefit Components", value: stats.benefits, icon: <GiftIcon />, color: "#3b82f6" },
//         ].map((stat) => (
//           <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
//             <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
//               <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
//                 <Box
//                   sx={{
//                     width: 40,
//                     height: 40,
//                     borderRadius: 2,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                     bgcolor: alpha(stat.color, 0.1),
//                     color: stat.color,
//                   }}
//                 >
//                   {stat.icon}
//                 </Box>
//                 <Box>
//                   <Typography variant="h5" sx={{ fontWeight: 700 }}>
//                     {stat.value}
//                   </Typography>
//                   <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                     {stat.label}
//                   </Typography>
//                 </Box>
//               </CardContent>
//             </Card>
//           </Grid>
//         ))}
//       </Grid>

//       {/* Filters */}
//       <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 3, flexWrap: "wrap" }}>
//         <TextField
//           placeholder="Search components..."
//           value={search}
//           onChange={(e) => setSearch(e.target.value)}
//           size="small"
//           sx={{ flex: 1, minWidth: 200, maxWidth: 350 }}
//           slotProps={{
//             input: {
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
//                 </InputAdornment>
//               ),
//             },
//           }}
//         />
//         <Box sx={{ display: "flex", gap: 0.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 0.5 }}>
//           {["all", "earning", "deduction", "benefit"].map((t) => (
//             <Button
//               key={t}
//               variant={filterType === t ? "contained" : "text"}
//               size="small"
//               onClick={() => setFilterType(t)}
//               sx={{
//                 textTransform: "capitalize",
//                 minWidth: 60,
//                 fontSize: "0.75rem",
//                 ...(filterType !== t && { color: "text.secondary" }),
//               }}
//             >
//               {t}
//             </Button>
//           ))}
//         </Box>
//       </Box>

//       {/* Table */}
//       <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}>
//         <TableContainer>
//           <Table>
//             <TableHead>
//               <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
//                   Component
//                 </TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
//                   Code
//                 </TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
//                   Type
//                 </TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
//                   Calculation
//                 </TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
//                   Value
//                 </TableCell>
//                 <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
//                   Taxable
//                 </TableCell>
//                 <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
//                   Actions
//                 </TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {filtered.length === 0 ? (
//                 <TableRow>
//                   <TableCell colSpan={7} align="center" sx={{ py: 6, color: "text.secondary" }}>
//                     No components match your search. Try adjusting the filters.
//                   </TableCell>
//                 </TableRow>
//               ) : (
//                 filtered.map((component) => {
//                   const config = typeConfig[component.type as keyof typeof typeConfig];
//                   return (
//                     <TableRow
//                       key={component.id}
//                       hover
//                       sx={{
//                         "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.04) },
//                       }}
//                     >
//                       <TableCell>
//                         <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                           {component.name}
//                         </Typography>
//                       </TableCell>
//                       <TableCell>
//                         <Chip
//                           label={component.code}
//                           size="small"
//                           sx={{ fontFamily: "monospace", fontSize: "0.7rem" }}
//                         />
//                       </TableCell>
//                       <TableCell>
//                         <Chip
//                           label={config.label}
//                           size="small"
//                           sx={{
//                             bgcolor: config.bgColor,
//                             color: config.color,
//                             fontSize: "0.7rem",
//                             fontWeight: 500,
//                           }}
//                         />
//                       </TableCell>
//                       <TableCell>
//                         <Typography variant="body2" sx={{ color: "text.secondary" }}>
//                           {calcLabel[component.calculationType] || component.calculationType}
//                         </Typography>
//                       </TableCell>
//                       <TableCell>
//                         <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                           {component.calculationType === "fixed"
//                             ? `₹${component.calculationValue?.toLocaleString()}`
//                             : `${component.calculationValue}%`}
//                         </Typography>
//                       </TableCell>
//                       <TableCell>
//                         {component.taxable ? (
//                           <Chip
//                             label="Taxable"
//                             size="small"
//                             sx={{
//                               bgcolor: alpha(theme.palette.warning.main, 0.1),
//                               color: theme.palette.warning.main,
//                               fontSize: "0.7rem",
//                             }}
//                           />
//                         ) : (
//                           <Chip
//                             label="Non-taxable"
//                             size="small"
//                             variant="outlined"
//                             sx={{ fontSize: "0.7rem" }}
//                           />
//                         )}
//                       </TableCell>
//                       <TableCell align="right">
//                         <Stack direction="row">
//                           <IconButton
//                             size="small"
//                             onClick={() => handleOpenDialog(component)}
//                             sx={{
//                               color: "text.secondary",
//                               "&:hover": {
//                                 color: "primary.main",
//                                 bgcolor: alpha(theme.palette.primary.main, 0.08),
//                               },
//                             }}
//                           >
//                             <EditIcon fontSize="small" />
//                           </IconButton>
//                           <IconButton
//                             size="small"
//                             onClick={() => handleDelete(component.id)}
//                             sx={{
//                               color: "text.secondary",
//                               "&:hover": {
//                                 color: "error.main",
//                                 bgcolor: alpha(theme.palette.error.main, 0.08),
//                               },
//                             }}
//                           >
//                             <DeleteIcon fontSize="small" />
//                           </IconButton>
//                         </Stack>
//                       </TableCell>
//                     </TableRow>
//                   );
//                 })
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Card>

//       {/* Tips */}
//       <Box
//         sx={{
//           mt: 3,
//           p: 2.5,
//           borderRadius: 2,
//           border: `1px solid ${theme.palette.divider}`,
//           bgcolor: alpha(theme.palette.primary.main, 0.04),
//           display: "flex",
//           gap: 2,
//         }}
//       >
//         <Box
//           sx={{
//             width: 32,
//             height: 32,
//             borderRadius: 1,
//             bgcolor: alpha(theme.palette.primary.main, 0.1),
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             flexShrink: 0,
//           }}
//         >
//           <CalculateIcon sx={{ fontSize: 16, color: "primary.main" }} />
//         </Box>
//         <Box>
//           <Typography variant="body2" sx={{ fontWeight: 600 }}>
//             Formula Builder Tips
//           </Typography>
//           <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
//             Use component codes as variables in formulas. Example:{" "}
//             <code style={{
//               background: theme.palette.background.paper,
//               padding: "2px 8px",
//               borderRadius: 4,
//               fontSize: "0.75rem",
//               fontFamily: "monospace",
//               border: `1px solid ${theme.palette.divider}`,
//             }}>
//               (BASIC * 0.5) + 1000
//             </code>
//             . Supported operators: +, −, *, /, ( )
//           </Typography>
//         </Box>
//       </Box>

//       {/* Add/Edit Dialog */}
//       <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
//         <DialogTitle>
//           <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
//             <Typography variant="h6">
//               {editingComponent ? "Edit Salary Component" : "Add Salary Component"}
//             </Typography>
//             <IconButton onClick={handleCloseDialog} size="small">
//               <CloseIcon />
//             </IconButton>
//           </Box>
//         </DialogTitle>
//         <DialogContent dividers>
//           <Stack spacing={2.5} sx={{ pt: 1 }}>
//             <Grid container spacing={2}>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField
//                   label="Component Name *"
//                   value={formData.name}
//                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                   placeholder="e.g., Basic Salary"
//                   fullWidth
//                   size="small"
//                 />
//               </Grid>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField
//                   label="Component Code *"
//                   value={formData.code}
//                   onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
//                   placeholder="e.g., BASIC"
//                   fullWidth
//                   size="small"
//                 />
//               </Grid>
//             </Grid>

//             <FormControl component="fieldset">
//               <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
//                 Component Type *
//               </Typography>
//               <RadioGroup
//                 row
//                 value={formData.type}
//                 onChange={(e) => setFormData({ ...formData, type: e.target.value })}
//               >
//                 <FormControlLabel value="earning" control={<Radio />} label="Earning" />
//                 <FormControlLabel value="deduction" control={<Radio />} label="Deduction" />
//                 <FormControlLabel value="benefit" control={<Radio />} label="Benefit" />
//               </RadioGroup>
//             </FormControl>

//             <Grid container spacing={2}>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <FormControl fullWidth size="small">
//                   <InputLabel>Calculation Type</InputLabel>
//                   <Select
//                     value={formData.calculationType}
//                     onChange={(e) => setFormData({ ...formData, calculationType: e.target.value })}
//                     label="Calculation Type"
//                   >
//                     {Object.entries(calcLabel).map(([k, v]) => (
//                       <MenuItem key={k} value={k}>{v}</MenuItem>
//                     ))}
//                   </Select>
//                 </FormControl>
//               </Grid>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField
//                   label="Calculation Value"
//                   type="number"
//                   value={formData.calculationValue}
//                   onChange={(e) => setFormData({ ...formData, calculationValue: Number(e.target.value) })}
//                   placeholder="0"
//                   fullWidth
//                   size="small"
//                 />
//               </Grid>
//             </Grid>

//             {formData.calculationType === "formula" && (
//               <TextField
//                 label="Formula"
//                 value={formData.formula || ""}
//                 onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
//                 placeholder="e.g., (BASIC * 0.4) + (HRA * 0.5)"
//                 multiline
//                 rows={3}
//                 fullWidth
//                 size="small"
//                 helperText="Available variables: CTC, BASIC, HRA, SPECIAL, TRANSPORT"
//               />
//             )}

//             <Grid container spacing={2}>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField
//                   label="Min Amount (Optional)"
//                   type="number"
//                   value={formData.minAmount || ""}
//                   onChange={(e) => setFormData({ ...formData, minAmount: Number(e.target.value) || 0 })}
//                   fullWidth
//                   size="small"
//                 />
//               </Grid>
//               <Grid size={{ xs: 12, sm: 6 }}>
//                 <TextField
//                   label="Max Amount (Optional)"
//                   type="number"
//                   value={formData.maxAmount || ""}
//                   onChange={(e) => setFormData({ ...formData, maxAmount: Number(e.target.value) || 0 })}
//                   fullWidth
//                   size="small"
//                 />
//               </Grid>
//             </Grid>

//             <Box
//               sx={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 alignItems: "center",
//                 p: 2,
//                 borderRadius: 1,
//                 border: `1px solid ${theme.palette.divider}`,
//               }}
//             >
//               <Box>
//                 <Typography variant="body2" sx={{ fontWeight: 500 }}>
//                   Taxable Component
//                 </Typography>
//                 <Typography variant="caption" sx={{ color: "text.secondary" }}>
//                   Include this component in tax calculations
//                 </Typography>
//               </Box>
//               <Switch
//                 checked={formData.taxable}
//                 onChange={(e) => setFormData({ ...formData, taxable: e.target.checked })}
//               />
//             </Box>

//             <TextField
//               label="Display Order"
//               type="number"
//               value={formData.displayOrder}
//               onChange={(e) => setFormData({ ...formData, displayOrder: Number(e.target.value) })}
//               fullWidth
//               size="small"
//             />
//           </Stack>
//         </DialogContent>
//         <DialogActions sx={{ p: 2.5 }}>
//           <Button onClick={handleCloseDialog} variant="outlined" sx={{ textTransform: "none" }}>
//             Cancel
//           </Button>
//           <Button onClick={handleSave} variant="contained" sx={{ textTransform: "none" }}>
//             {editingComponent ? "Update" : "Create"} Component
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }

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
} from "@mui/icons-material";
import { salaryComponentsService, type SalaryComponent } from "../../../services/modules/payrollServices/components";
import { useUI } from "../../../context/Snackbar";
import { getRowColor } from "../../const";
import { calcLabel, typeConfig } from "../const";

export default function SalaryComponentBuilder() {
  const theme = useTheme();
  const { showSpinner, hideSpinner, showSnackbar, showConfirmDialog } = useUI();
  const [components, setComponents] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    componentType: "earning",
    calculationType: "FIXED",
    calculationValue: 0,
    taxable: false,
    displayOrder: 0,
    formulaExpression: "",
    minAmount: 0,
    maxAmount: 0,
  });

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = async () => {
    setLoading(true);
    showSpinner();
    try {
      const response: any = await salaryComponentsService.getComponents();
      const list = (response.data?.content || []).map((component: any) => ({
        id: component.id,
        name: component.name,
        code: component.code,
        type: (component.componentType || "earning").toLowerCase(),
        calculationType: component.calculationType || "FIXED",
        calculationValue: component.calculationValue || 0,
        taxable: Boolean(component.taxable),
        displayOrder: component.displayOrder || 0,
      }));
      setComponents(list);
    } catch (error) {
      console.error("Failed to load salary components", error);
      showSnackbar("Failed to load salary components", "error");
    } finally {
      hideSpinner();
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      showSnackbar("Please fill all required fields", "warning");
      return;
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
      loadComponents();
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
              loadComponents();
            } catch (error: any) {
              showSnackbar("Failed to delete component", "error");
            } finally {
              hideSpinner();
            }
          }
        });
        // if (!confirm("Are you sure you want to delete this component?")) return;
            // showSpinner();
    // try {
    //   await salaryComponentsService.deleteComponent(id);
    //   showSnackbar("Component deleted successfully!", "success");
    //   loadComponents();
    // } catch (error) {
    //   showSnackbar("Failed to delete component", "error");
    // } finally {
    //   hideSpinner();
    // }
  };

  const handleOpenDialog = (component?: any) => {
    if (component) {
      setEditingComponent(component);
      setFormData({
        name: component.name,
        code: component.code,
        componentType: component.type,
        calculationType: component.calculationType,
        calculationValue: component.calculationValue,
        taxable: component.taxable,
        displayOrder: component.displayOrder || components.length + 1,
        formulaExpression: component.formulaExpression || "",
        minAmount: component.minAmount || 0,
        maxAmount: component.maxAmount || 0,
      });
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
    }
    setIsDialogOpen(true);
  };

  const filtered = components.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    earnings: components.filter((c) => c.type === "earning").length,
    deductions: components.filter((c) => c.type === "deduction").length,
    benefits: components.filter((c) => c.type === "benefit").length,
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="bg-white-50">
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography className="text-gray-800">
            Salary Component Builder
          </Typography>
          <Typography className="text-gray-500 mt-1">
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
          { label: "Earning Components", value: stats.earnings, icon: <TrendingUpIcon />, color: "#10b981" },
          { label: "Deduction Components", value: stats.deductions, icon: <MinusCircleIcon />, color: "#ef4444" },
          { label: "Benefit Components", value: stats.benefits, icon: <GiftIcon />, color: "#3b82f6" },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 4 }} key={stat.label}>
            <Card className="bg-white" sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
              <CardContent sx={{ p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", bgcolor: alpha(stat.color, 0.1), color: stat.color }}>
                  {stat.icon}
                </Box>
                <Box>
                  <Typography className="text-gray-800 !font-bold">
                    {stat.value}
                  </Typography>
                  <Typography className="text-gray-500">
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
          // slotProps={{
          //   input: {
          //     startAdornment: (
          //       <InputAdornment position="start">
          //         <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
          //       </InputAdornment>
          //     ),
          //   },
          // }}
        />
        <Box className="border-gray-200" sx={{ display: "flex", gap: 0.5, border: `1px solid ${theme.palette.divider}`, borderRadius: 1, p: 0.5 }}>
          {["all", "earning", "deduction", "benefit"].map((t) => (
            <Button
              key={t}
              variant={filterType === t ? "contained" : "text"}
              size="small"
              className={`${filterType === t ? "!white" : "!text-gray-800"}`}
              onClick={() => setFilterType(t)}
              // sx={{ textTransform: "capitalize", minWidth: 60, fontSize: "0.75rem", ...(filterType !== t && { color: "text.secondary" }) }}
            >
              {t}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Table */}
      {/* <Card  sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", overflow: "hidden" }}> */}
        <TableContainer className="border border-gray-200 rounded-md max-h-[calc(100vh-410px)] overflow-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell className="!font-bold">S No</TableCell>
                <TableCell className="!font-bold">Component</TableCell>
                <TableCell className="!font-bold">Code</TableCell>
                <TableCell className="!font-bold">Type</TableCell>
                <TableCell className="!font-bold">Calculation</TableCell>
                <TableCell className="!font-bold">Value</TableCell>
                <TableCell className="!font-bold">Taxable</TableCell>
                <TableCell className="!font-bold">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6, color: "text.secondary" }}>
                    <div className="py-6">No components match your search.</div>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((component,i) => {
                  const config = typeConfig[component.type as keyof typeof typeConfig];
                  return (
                    <TableRow key={component.id} sx={getRowColor(i)}>
                      <TableCell>{i+1}</TableCell>
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
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {component.calculationType === "FIXED"
                            ? `₹${component.calculationValue?.toLocaleString()}`
                            : `${component.calculationValue}%`}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {component.taxable ? (
                          <Chip label="Taxable" size="small" sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main, fontSize: "0.7rem" }} />
                        ) : (
                          <Chip label="Non-taxable" size="small" variant="outlined" sx={{ fontSize: "0.7rem" }} className="text-gray-800"/>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row">
                          <IconButton size="small" onClick={() => handleOpenDialog(component)} sx={{ "&:hover": { color: "primary.main" } }}>
                            <EditIcon fontSize="small" className="!w-4 text-blue-500"/>
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(component)} sx={{ "&:hover": { color: "error.main" } }}>
                            <DeleteIcon fontSize="small" className="!w-4 text-error"/>
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
      {/* </Card> */}

      {/* Tips */}
      <Box sx={{ mt: 3, p: 2.5, borderRadius: 2, border: `1px solid ${theme.palette.divider}`, bgcolor: alpha(theme.palette.primary.main, 0.04), display: "flex", gap: 2 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 1, bgcolor: alpha(theme.palette.primary.main, 0.1), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <CalculateIcon sx={{ fontSize: 16, color: "primary.main" }} />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Formula Builder Tips
          </Typography>
          <Typography variant="body2" className="text-gray-500 mt-1">
            Use component codes as variables in formulas. Example:{" "}
            <code className="border border-gray-200 p-1 bg-primary-100 font-bold text-primary">
              (BASIC * 0.5) + 1000
            </code>
            . Supported operators: +, −, *, /, ( )
          </Typography>
        </Box>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="md" fullWidth>
        {/* <DialogTitle> */}
          <div className="flex items-center justify-between !p-2 border-b border-gray-200">
            <Typography className="!mx-4">{editingComponent ? "Edit Salary Component" : "Add Salary Component"}</Typography>
            <IconButton onClick={() => setIsDialogOpen(false)} size="small">
              <CloseIcon className="!w-4 text-gray-800"/>
            </IconButton>
          </div>
        {/* </DialogTitle> */}
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
                <FormControlLabel value="earning" control={<Radio className="text-gray-800"/>} label="Earning" />
                <FormControlLabel value="deduction" control={<Radio className="text-gray-800"/>} label="Deduction" />
                <FormControlLabel value="benefit" control={<Radio className="text-gray-800"/>} label="Benefit" />
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
                value={formData.formulaExpression}
                onChange={(e) => setFormData({ ...formData, formulaExpression: e.target.value })}
                placeholder="e.g., (BASIC * 0.4) + (HRA * 0.5)"
                multiline
                rows={3}
                fullWidth
                size="small"
                helperText="Available variables: CTC, BASIC, HRA, SPECIAL, TRANSPORT"
              />
            )}

            <div className="flex items-center justify-between p-4 rounded-sm border border-gray-200"
            >
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
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions className="border-t border-gray-200 !p-4">
          <Button onClick={() => setIsDialogOpen(false)} variant="outlined" className="!text-gray-800 !border-gray-200">
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