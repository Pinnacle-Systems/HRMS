import { useState } from "react";
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
  Paper,
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
} from "@mui/material";
import {
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  DragIndicator as GripVerticalIcon,
  Add as PlusIcon,
  Description as BookTemplateIcon,
  Layers as LayersIcon,
} from "@mui/icons-material";

// Mock data - replace with your actual API data
const mockSalaryComponents = [
  { id: "1", name: "Basic Salary", code: "BASIC", type: "earning", calculationType: "fixed", calculationValue: 40000, taxable: true },
  { id: "2", name: "House Rent Allowance", code: "HRA", type: "earning", calculationType: "percentage_basic", calculationValue: 40, taxable: false },
  { id: "3", name: "Conveyance Allowance", code: "CONV", type: "earning", calculationType: "fixed", calculationValue: 1600, taxable: false },
  { id: "4", name: "Professional Tax", code: "PT", type: "deduction", calculationType: "fixed", calculationValue: 200, taxable: false },
  { id: "5", name: "Provident Fund", code: "PF", type: "deduction", calculationType: "percentage_basic", calculationValue: 12, taxable: false },
];

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

const steps = [
  { id: 1, name: "Basic Info", desc: "Name, code & applicability" },
  { id: 2, name: "Earnings", desc: "Configure earning components" },
  { id: 3, name: "Deductions", desc: "Configure deduction rules" },
  { id: 4, name: "Review & Save", desc: "Review and publish" },
];

const employmentTypes = ["Permanent", "Contract", "Intern", "Consultant"];
const grades = ["L1", "L2", "L3", "L4", "L5", "L6"];

const calcLabel: Record<string, string> = {
  fixed: "Fixed Amount",
  percentage_ctc: "% of CTC",
  percentage_basic: "% of Basic",
  slab: "Slab Based",
  formula: "Formula",
};

export default function SalaryStructureTemplate() {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(0);

  const [basicInfo, setBasicInfo] = useState({
    name: "",
    code: "",
    description: "",
    applicableFor: [] as string[],
    gradeLevels: [] as string[],
  });
  const [earnings, setEarnings] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);

  const earningComponents = mockSalaryComponents.filter((c) => c.type === "earning");
  const deductionComponents = mockSalaryComponents.filter((c) => c.type === "deduction");

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
    const component = mockSalaryComponents.find((c) => c.id === componentId);
    if (!component) return;
    const already = type === "earning" ? earnings : deductions;
    if (already.some((a) => a.componentId === component.id)) return;
    const newAlloc = {
      componentId: component.id,
      componentName: component.name,
      calculationLogic: component.calculationType,
      value: component.calculationValue || 0,
    };
    if (type === "earning") setEarnings([...earnings, newAlloc]);
    else setDeductions([...deductions, newAlloc]);
  };

  const removeComponent = (type: "earning" | "deduction", index: number) => {
    if (type === "earning") setEarnings(earnings.filter((_, i) => i !== index));
    else setDeductions(deductions.filter((_, i) => i !== index));
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

  const calculateTotalCTC = () => earnings.reduce((s, e) => s + (e.value || 0), 0);

  const handleNext = () => {
    if (currentStep === 0 && (!basicInfo.name || !basicInfo.code || basicInfo.applicableFor.length === 0)) {
      return;
    }
    setCurrentStep((s) => Math.min(3, s + 1));
  };

  const handleBack = () => {
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  const handleSave = (draft = false) => {
    // Toast notification would go here
    console.log(draft ? "Draft Saved" : "Template Published");
  };

  return (
    <Box sx={{ p: 3, bgcolor: "background.default", minHeight: "100vh" }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <LayersIcon sx={{ color: "primary.main" }} />
        </Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
            Salary Structure Wizard
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
            Create a reusable salary structure template in 4 steps
          </Typography>
        </Box>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={currentStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((step) => (
          <Step key={step.id}>
            <StepLabel>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: currentStep === step.id - 1 ? 600 : 400 }}>
                  {step.name}
                </Typography>
                <Typography variant="caption" sx={{ display: "block", color: "text.secondary", fontSize: "0.65rem" }}>
                  {step.desc}
                </Typography>
              </Box>
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step Content */}
      <Card sx={{ borderRadius: 2, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
        <CardContent sx={{ p: 3 }}>
          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Template Name *"
                    value={basicInfo.name}
                    onChange={(e) => setBasicInfo({ ...basicInfo, name: e.target.value })}
                    placeholder="e.g., Standard Structure L1"
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    label="Template Code *"
                    value={basicInfo.code}
                    onChange={(e) => setBasicInfo({ ...basicInfo, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., STD_L1"
                    fullWidth
                    size="small"
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
                size="small"
              />

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Applicable For *
                </Typography>
                <Grid container spacing={1}>
                  {employmentTypes.map((type) => (
                    <Grid size={{ xs: 6, sm: 3 }} key={type}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          p: 1.5,
                          borderRadius: 1,
                          border: `1px solid ${
                            basicInfo.applicableFor.includes(type)
                              ? theme.palette.primary.main
                              : theme.palette.divider
                          }`,
                          bgcolor: basicInfo.applicableFor.includes(type)
                            ? alpha(theme.palette.primary.main, 0.05)
                            : "transparent",
                          cursor: "pointer",
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                          },
                        }}
                        onClick={() => toggleEmploymentType(type)}
                      >
                        <Checkbox checked={basicInfo.applicableFor.includes(type)} size="small" />
                        <Typography variant="body2">{type}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Grade Levels
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {grades.map((grade) => (
                    <Chip
                      key={grade}
                      label={grade}
                      onClick={() => toggleGrade(grade)}
                      color={basicInfo.gradeLevels.includes(grade) ? "primary" : "default"}
                      variant={basicInfo.gradeLevels.includes(grade) ? "filled" : "outlined"}
                      sx={{ cursor: "pointer" }}
                    />
                  ))}
                </Box>
              </Box>
            </Stack>
          )}

          {/* Step 2: Earnings */}
          {currentStep === 1 && (
            <Stack spacing={3}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Configure Earnings
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Add earning components to this template
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    Estimated Annual CTC
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: "success.main" }}>
                    {formatCurrency(calculateTotalCTC())}
                  </Typography>
                </Box>
              </Box>

              <FormControl size="small" sx={{ maxWidth: 300 }}>
                <InputLabel>Add earning component...</InputLabel>
                <Select
                  value=""
                  onChange={(e) => addComponent("earning", e.target.value)}
                  label="Add earning component..."
                >
                  {earningComponents.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {earnings.length > 0 ? (
                <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableCell sx={{ width: 40 }} />
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Component
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Logic
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Value
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Preview
                        </TableCell>
                        <TableCell sx={{ width: 80 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {earnings.map((e, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <GripVerticalIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {e.componentName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                              {calcLabel[e.calculationLogic] || e.calculationLogic}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <TextField
                              type="number"
                              value={e.value}
                              onChange={(ev) => updateValue("earning", i, Number(ev.target.value))}
                              size="small"
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {e.calculationLogic === "fixed"
                                ? formatCurrency(e.value)
                                : `${e.value}%`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => removeComponent("earning", i)}
                              sx={{ color: "error.main", textTransform: "none" }}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  sx={{
                    border: `2px dashed ${theme.palette.divider}`,
                    borderRadius: 2,
                    p: 6,
                    textAlign: "center",
                  }}
                >
                  <PlusIcon sx={{ fontSize: 32, color: "text.secondary", mb: 1 }} />
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    No earnings added yet. Select a component above.
                  </Typography>
                </Box>
              )}
            </Stack>
          )}

          {/* Step 3: Deductions */}
          {currentStep === 2 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Configure Deductions
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Add statutory and voluntary deductions
                </Typography>
              </Box>

              <FormControl size="small" sx={{ maxWidth: 300 }}>
                <InputLabel>Add deduction component...</InputLabel>
                <Select
                  value=""
                  onChange={(e) => addComponent("deduction", e.target.value)}
                  label="Add deduction component..."
                >
                  {deductionComponents.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {deductions.length > 0 ? (
                <TableContainer component={Paper} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                        <TableCell sx={{ width: 40 }} />
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Component
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Logic
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Value
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, fontSize: "0.65rem", textTransform: "uppercase" }}>
                          Limit
                        </TableCell>
                        <TableCell sx={{ width: 80 }} />
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {deductions.map((d, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <GripVerticalIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {d.componentName}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                              {calcLabel[d.calculationLogic] || d.calculationLogic}
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
                            <Typography variant="body2" sx={{ color: "text.secondary" }}>
                              {d.calculationLogic === "slab" ? "As per slab" : `${d.value}%`}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="text"
                              size="small"
                              onClick={() => removeComponent("deduction", i)}
                              sx={{ color: "error.main", textTransform: "none" }}
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  sx={{
                    border: `2px dashed ${theme.palette.divider}`,
                    borderRadius: 2,
                    p: 6,
                    textAlign: "center",
                  }}
                >
                  <PlusIcon sx={{ fontSize: 32, color: "text.secondary", mb: 1 }} />
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    No deductions added yet. Select a component above.
                  </Typography>
                </Box>
              )}
            </Stack>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <Stack spacing={3}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Review & Publish
              </Typography>

              <Box
                sx={{
                  p: 2.5,
                  borderRadius: 1,
                  border: `1px solid ${theme.palette.divider}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {basicInfo.name || "Untitled Template"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
                      {basicInfo.description}
                    </Typography>
                  </Box>
                  <Chip label={basicInfo.code} sx={{ fontFamily: "monospace" }} />
                </Box>
                <Box sx={{ display: "flex", gap: 1, mt: 1.5, flexWrap: "wrap" }}>
                  {basicInfo.applicableFor.map((t) => (
                    <Chip key={t} label={t} size="small" variant="outlined" />
                  ))}
                  {basicInfo.gradeLevels.map((g) => (
                    <Chip key={g} label={g} size="small" color="primary" variant="outlined" />
                  ))}
                </Box>
              </Box>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: "success.main", fontWeight: 600, mb: 1 }}
                      >
                        Earnings ({earnings.length})
                      </Typography>
                      <Stack spacing={1}>
                        {earnings.length === 0 && (
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            No earnings configured
                          </Typography>
                        )}
                        {earnings.map((e, i) => (
                          <Box
                            key={i}
                            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                          >
                            <Typography variant="body2">{e.componentName}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {e.calculationLogic === "fixed"
                                ? formatCurrency(e.value)
                                : `${e.value}%`}
                            </Typography>
                          </Box>
                        ))}
                        {earnings.length > 0 && (
                          <>
                            <Divider />
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Total CTC
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                                {formatCurrency(calculateTotalCTC())}
                              </Typography>
                            </Box>
                          </>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Card
                    sx={{
                      borderRadius: 2,
                      border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="subtitle2"
                        sx={{ color: "error.main", fontWeight: 600, mb: 1 }}
                      >
                        Deductions ({deductions.length})
                      </Typography>
                      <Stack spacing={1}>
                        {deductions.length === 0 && (
                          <Typography variant="body2" sx={{ color: "text.secondary" }}>
                            No deductions configured
                          </Typography>
                        )}
                        {deductions.map((d, i) => (
                          <Box
                            key={i}
                            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                          >
                            <Typography variant="body2">{d.componentName}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {d.calculationLogic === "fixed"
                                ? formatCurrency(d.value)
                                : `${d.value}%`}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handleBack}
          disabled={currentStep === 0}
          startIcon={<ChevronLeftIcon fontSize="small" />}
          sx={{ textTransform: "none" }}
        >
          Previous
        </Button>
        <Box sx={{ display: "flex", gap: 1 }}>
          {currentStep === 3 && (
            <Button
              variant="outlined"
              onClick={() => handleSave(true)}
              sx={{ textTransform: "none" }}
            >
              Save as Draft
            </Button>
          )}
          {currentStep < 3 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ChevronRightIcon fontSize="small" />}
              sx={{ textTransform: "none" }}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={() => handleSave(false)}
              startIcon={<BookTemplateIcon fontSize="small" />}
              sx={{ textTransform: "none" }}
            >
              Publish Template
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}