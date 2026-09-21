import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Chip,
    MenuItem,
    Paper,
    Step,
    StepLabel,
    Stepper,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TextField,
    Checkbox,
} from "@mui/material";
import { salaryRevisionService, type EmployeeRevision, type RevisionReason, type RevisionTemplate } from "../../../services/modules/payrollServices/salaryRevision";
import {
    calculateIncrement,
    distributeAcrossComponents,
} from "../../../utils/incrementCalculator";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { getRowColor } from "../../const";
import { useUI } from "../../../context/Snackbar";


const REASONS: RevisionReason[] = [
    "ANNUAL_INCREMENT",
    "PROMOTION",
    "CORRECTION",
    "MARKET_ADJUSTMENT",
    "PROBATION_CONFIRMATION",
];

export default function CreateRevision() {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const { showSnackbar } = useUI();

    // Step 1
    const [title, setTitle] = useState("");
    const [reason, setReason] = useState<RevisionReason>("ANNUAL_INCREMENT");
    const [effectiveFrom, setEffectiveFrom] = useState("");

    // Step 2
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Step 3
    const [templates, setTemplates] = useState<RevisionTemplate[]>([]);
    const [templateId, setTemplateId] = useState("");

    useEffect(() => {
        salaryRevisionService
            .getTemplateDropdown()
            .then((res: any) => {
                const list = res.data || [];
                setTemplates(list);
                if (list.length) setTemplateId(list[0].id);
            })
            .catch((_err: any) => {
                showSnackbar("Failed to load templates", "error");
                const local: RevisionTemplate[] = [
                    { id: "t1", name: "Standard 10%", type: "PERCENT", config: { percent: 10, roundingRule: "NEAREST_100" } },
                    { id: "t2", name: "Flat ₹5000", type: "FLAT", config: { flatAmount: 5000, roundingRule: "NEAREST_100" } },
                    {
                        id: "t3",
                        name: "Slab Based",
                        type: "SLAB",
                        config: {
                            slabs: [
                                { from: 0, to: 500000, percent: 12 },
                                { from: 500001, to: 1000000, percent: 10 },
                                { from: 1000001, to: Number.MAX_SAFE_INTEGER, percent: 8 },
                            ],
                            roundingRule: "NEAREST_100",
                        },
                    },
                ];
                setTemplates(local);
                setTemplateId(local[0].id);
            });
    }, []);

    useEffect(() => {
        Promise.resolve({ data: [] })
            .then((res: any) => {
                if (res.data && res.data.length) {
                    setEmployees(res.data);
                } else {
                    setEmployees([
                        {
                            id: "501",
                            code: "EMP001",
                            name: "Ravi Kumar",
                            dept: "Engineering",
                            desig: "Software Engineer",
                            ctc: 800000,
                            gross: 60000,
                            components: [
                                { componentId: "c1", componentName: "Basic", componentType: "EARNING", oldValue: 24000, newValue: 24000, delta: 0, deltaPercent: 0 },
                                { componentId: "c2", componentName: "HRA", componentType: "EARNING", oldValue: 12000, newValue: 12000, delta: 0, deltaPercent: 0 },
                                { componentId: "c3", componentName: "Special Allowance", componentType: "EARNING", oldValue: 24000, newValue: 24000, delta: 0, deltaPercent: 0 },
                            ],
                        },
                        {
                            id: "502",
                            code: "EMP002",
                            name: "Priya Sharma",
                            dept: "HR",
                            desig: "HR Executive",
                            ctc: 600000,
                            gross: 45000,
                            components: [
                                { componentId: "c1", componentName: "Basic", componentType: "EARNING", oldValue: 18000, newValue: 18000, delta: 0, deltaPercent: 0 },
                                { componentId: "c2", componentName: "HRA", componentType: "EARNING", oldValue: 9000, newValue: 9000, delta: 0, deltaPercent: 0 },
                                { componentId: "c3", componentName: "Special Allowance", componentType: "EARNING", oldValue: 18000, newValue: 18000, delta: 0, deltaPercent: 0 },
                            ],
                        },
                        {
                            id: "503",
                            code: "EMP003",
                            name: "Arjun Nair",
                            dept: "Finance",
                            desig: "Accountant",
                            ctc: 700000,
                            gross: 52500,
                            components: [
                                { componentId: "c1", componentName: "Basic", componentType: "EARNING", oldValue: 21000, newValue: 21000, delta: 0, deltaPercent: 0 },
                                { componentId: "c2", componentName: "HRA", componentType: "EARNING", oldValue: 10500, newValue: 10500, delta: 0, deltaPercent: 0 },
                                { componentId: "c3", componentName: "Special Allowance", componentType: "EARNING", oldValue: 21000, newValue: 21000, delta: 0, deltaPercent: 0 },
                            ],
                        },
                    ]);
                }
            });
    }, []);

    const preview: EmployeeRevision[] = useMemo(() => {
        const template = templates.find((t) => t.id === templateId);
        if (!template) return [];
        return employees
            .filter((e) => selectedIds.includes(e.id))
            .map((e) => {
                const incrementAmount = calculateIncrement(e.ctc, template);
                const components = distributeAcrossComponents(
                    incrementAmount,
                    e.components as any
                );
                const newCtc = e.ctc + incrementAmount;
                return {
                    employeeId: e.id,
                    employeeCode: e.code,
                    employeeName: e.name,
                    department: e.dept,
                    designation: e.desig,
                    oldCtc: e.ctc,
                    newCtc,
                    oldGross: e.gross,
                    newGross: e.gross + incrementAmount / 12,
                    incrementAmount,
                    incrementPercent: (incrementAmount / e.ctc) * 100,
                    components,
                    effectiveFrom,
                };
            });
    }, [employees, selectedIds, templateId, templates, effectiveFrom]);

    const totalCost = preview.reduce((s, p) => s + p.incrementAmount, 0);

    const handleSubmit = async (asDraft: boolean) => {
        if (!title || !effectiveFrom) {
            showSnackbar("Please fill title and effective date", "warning");
            setActiveStep(0);
            return;
        }
        if (!preview.length) {
            showSnackbar("Select at least one employee", "warning");
            return;
        }

        try {
            const payload = {
                title,
                reason,
                effectiveFrom,
                templateId,
                status: (asDraft ? "DRAFT" : "PENDING_APPROVAL") as any,
                employees: preview,
                totalEmployees: preview.length,
                totalIncrementCost: totalCost,
            };
            const res: any = await salaryRevisionService.createRevision(payload);
            const newId = res?.data?.id;
            if (!asDraft && newId) {
                await salaryRevisionService.submitForApproval(newId);
            }
            navigate("/payroll/revision");
        } catch (err) {
            showSnackbar(" Your revision has been captured on the screen but not saved.", "error");
            navigate("/payroll/revision");
        }
    };

    return (
        <Box className="max-w-6xl">
            <div className="text-[12px] font-bold text-gray-800 mb-4">New Salary Revision</div>

            <Stepper activeStep={activeStep} className="!mb-6">
                <Step>
                    <StepLabel>Basic Info</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Select Employees</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Revise & Preview</StepLabel>
                </Step>
            </Stepper>

            {activeStep === 0 && (
                <Paper className="!p-4 !shadow-sm grid grid-cols-3 gap-4 !bg-white">
                    <TextField
                        label="Revision Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                    />
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en-gb">
                        <DatePicker
                            label="From Date"
                            format="DD/MM/YYYY"
                            value={effectiveFrom ? dayjs(effectiveFrom) : null}
                            className="!bg-white-50"
                            onChange={(newValue) =>
                                setEffectiveFrom(
                                    newValue ? dayjs(newValue).format("YYYY-MM-DD") : "",
                                )
                            }
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                },

                            }}
                        />
                    </LocalizationProvider>
                    <TextField
                        label="Reason"
                        select
                        value={reason}
                        onChange={(e) => setReason(e.target.value as RevisionReason)}
                        fullWidth
                    >
                        {REASONS.map((r) => (
                            <MenuItem key={r} value={r}>
                                {r.replace(/_/g, " ")}
                            </MenuItem>
                        ))}
                    </TextField>

                </Paper>
            )}

            {activeStep === 1 && (
                <Table size="small" className="border border-gray-200 rounded-md">
                    <TableHead className="!bg-gray-50">
                        <TableRow>
                            <TableCell padding="checkbox">
                                <Checkbox
                                    checked={
                                        employees.length > 0 && selectedIds.length === employees.length
                                    }
                                    className="text-gray-800"
                                    indeterminate={
                                        selectedIds.length > 0 && selectedIds.length < employees.length
                                    }
                                    onChange={(e) =>
                                        setSelectedIds(
                                            e.target.checked ? employees.map((x) => x.id) : []
                                        )
                                    }
                                />
                            </TableCell>
                            <TableCell className="!text-xs !font-semibold">Code</TableCell>
                            <TableCell className="!text-xs !font-semibold">Name</TableCell>
                            <TableCell className="!text-xs !font-semibold">Department</TableCell>
                            <TableCell className="!text-xs !font-semibold">Designation</TableCell>
                            <TableCell className="!text-xs !font-semibold">CTC</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {employees.map((e, i) => (
                            <TableRow key={e.id} sx={getRowColor(i)}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={selectedIds.includes(e.id)}
                                        className="text-gray-800"
                                        onChange={(ev) =>
                                            setSelectedIds((prev) =>
                                                ev.target.checked
                                                    ? [...prev, e.id]
                                                    : prev.filter((x) => x !== e.id)
                                            )
                                        }
                                    />
                                </TableCell>
                                <TableCell className="!text-xs"><div className="py-2">{e.code}</div></TableCell>
                                <TableCell className="!text-xs">{e.name}</TableCell>
                                <TableCell className="!text-xs">{e.dept}</TableCell>
                                <TableCell className="!text-xs">{e.desig}</TableCell>
                                <TableCell className="!text-xs">
                                    ₹ {e.ctc.toLocaleString("en-IN")}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}

            {activeStep === 2 && (
                <>
                    <Paper className="!p-3 !pt-6 !my-3 !shadow-sm flex items-center gap-3 bg-white">
                        <TextField
                            select
                            size="small"
                            label="Revision Template"
                            value={templateId}
                            onChange={(e) => setTemplateId(e.target.value)}
                            className="!w-72"
                        >
                            {templates.map((t) => (
                                <MenuItem key={t.id} value={t.id}>
                                    {t.name}
                                </MenuItem>
                            ))}
                        </TextField>
                        <Chip label={`Total Employees: ${preview.length}`} size="small" className="text-gray-800 bg-gray-200" />
                        <Chip
                            label={`Total Cost: ₹ ${totalCost.toLocaleString("en-IN")}`}
                            color="primary"
                            size="small"
                        />
                    </Paper>

                    <Table size="small" className="border border-gray-200 rounded-md">
                        <TableHead className="!bg-gray-50">
                            <TableRow>
                                <TableCell className="!text-xs !font-semibold">S No</TableCell>
                                <TableCell className="!text-xs !font-semibold">Employee</TableCell>
                                <TableCell className="!text-xs !font-semibold">Old CTC</TableCell>
                                <TableCell className="!text-xs !font-semibold">New CTC</TableCell>
                                <TableCell className="!text-xs !font-semibold">Increment</TableCell>
                                <TableCell className="!text-xs !font-semibold">%</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {preview.map((p, i) => (
                                <TableRow key={p.employeeId} sx={getRowColor(i)}>
                                    <TableCell><div className="py-2">{i + 1}</div></TableCell>
                                    <TableCell className="!text-xs">
                                        {p.employeeName} ({p.employeeCode})
                                    </TableCell>
                                    <TableCell className="!text-xs">
                                        ₹ {p.oldCtc.toLocaleString("en-IN")}
                                    </TableCell>
                                    <TableCell className="!text-xs !text-green-700">
                                        ₹ {p.newCtc.toLocaleString("en-IN")}
                                    </TableCell>
                                    <TableCell className="!text-xs">
                                        ₹ {p.incrementAmount.toLocaleString("en-IN")}
                                    </TableCell>
                                    <TableCell className="!text-xs">
                                        {p.incrementPercent.toFixed(2)}%
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!preview.length && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" className="!text-xs !py-6 !text-gray-500">
                                        No employees selected.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </>
            )}

            <Box className="flex justify-between mt-4">
                <Button disabled={activeStep === 0} className="text-gray-800 bg-gray-100" onClick={() => setActiveStep((s) => s - 1)}>
                    Back
                </Button>
                <Box className="flex gap-2">
                    {activeStep === 2 && (
                        <>
                            <Button variant="outlined" onClick={() => handleSubmit(true)}>
                                Save Draft
                            </Button>
                            <Button
                                variant="contained"
                                className="!bg-primary"
                                onClick={() => handleSubmit(false)}
                            >
                                Submit for Approval
                            </Button>
                        </>
                    )}
                    {activeStep < 2 && (
                        <Button
                            variant="contained"
                            className="!bg-primary"
                            onClick={() => setActiveStep((s) => s + 1)}
                        >
                            Next
                        </Button>
                    )}
                </Box>
            </Box>
        </Box>
    );
}