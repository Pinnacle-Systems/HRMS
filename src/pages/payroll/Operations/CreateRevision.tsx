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
    TableContainer,
} from "@mui/material";
import {
    salaryRevisionService,
    type EmployeeRevision,
    type RevisionReason,
    type RevisionTemplate,
} from "../../../services/modules/payrollServices/salaryRevision";
import {
    calculateIncrement,
    distributeAcrossComponents,
} from "../../../utils/incrementCalculator";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { getRowColor } from "../../const";
import { useUI } from "../../../context/Snackbar";
import { employeeService } from "../../../services/modules/employees";

// Constants
const REASONS: RevisionReason[] = [
    "ANNUAL_INCREMENT",
    "PROMOTION",
    "RETENTION",
    "OTHER",
    "MARKET_CORRECTION",
    "PERFORMANCE",
];

// Props
interface CreateRevisionProps {
    mode?: "create" | "edit";
    revisionId?: string;
    initialData?: any;
}

export default function CreateRevision({
    mode = "create",
    revisionId,
    initialData,
}: CreateRevisionProps) {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const { showSnackbar } = useUI();

    // ── Step 1 ──
    const [title, setTitle] = useState("");
    const [reason, setReason] = useState<RevisionReason>("ANNUAL_INCREMENT");
    const [effectiveFrom, setEffectiveFrom] = useState("");

    // ── Step 2 ──
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [employeesLoading, setEmployeesLoading] = useState(true);

    // ── Step 3 ──
    const [templates, setTemplates] = useState<RevisionTemplate[]>([]);
    const [templateId, setTemplateId] = useState("");
    const [templatesLoading, setTemplatesLoading] = useState(true);

    // ────────────────────────────────────────────────────────
    // Load templates
    // ────────────────────────────────────────────────────────
    useEffect(() => {
        setTemplatesLoading(true);
        salaryRevisionService
            .getTemplateDropdown()
            .then((res: any) => {
                const list = res?.data || [];
                setTemplates(list);
                if (list.length && !templateId) {
                    setTemplateId(list[0].id);
                }
            })
            .catch((_err: any) => {
                showSnackbar("Failed to load revision templates", "error");
                setTemplates([]);
            })
            .finally(() => setTemplatesLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ────────────────────────────────────────────────────────
    // Load employees
    // ────────────────────────────────────────────────────────
    useEffect(() => {
        setEmployeesLoading(true);
        employeeService
            .getEmployees({ page: 0, size: 100, includeInactive: false })
            .then((res: any) => {
                const payload = res?.data;
                const rows = Array.isArray(payload)
                    ? payload
                    : payload?.content || [];

                const mapped = rows.map((e: any) => ({
                    id: e.id,
                    code: e.employeeId ?? e.employeeCode ?? e.code,
                    name: e.name ?? e.fullName ?? e.employeeName,
                    dept: e.department ?? e.departmentName,
                    desig: e.designation ?? e.jobTitle,
                    ctc: e.annualCtc ?? e.ctc ?? 0,
                    gross: e.monthlyGross ?? e.gross ?? 0,
                    components: e.salaryComponents ?? e.components ?? [],
                }));

                setEmployees(mapped);

                if (!mapped.length) {
                    showSnackbar(
                        "No active employees found for salary revision",
                        "warning"
                    );
                }
            })
            .catch(() => {
                showSnackbar(
                    "Failed to load employee list — using sample data",
                    "warning"
                );
                setEmployees([]);
            })
            .finally(() => setEmployeesLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ────────────────────────────────────────────────────────
    // Prefill when editing an existing draft
    // ────────────────────────────────────────────────────────
    useEffect(() => {
        if (mode !== "edit" || !initialData) return;

        setTitle(initialData.title || "");
        setReason(initialData.reason || "ANNUAL_INCREMENT");
        setEffectiveFrom(initialData.effectiveFrom || "");
        setTemplateId(initialData.templateId || "");

        const ids = (initialData.employees || []).map(
            (e: any) => e.employeeId || e.id
        );
        setSelectedIds(ids);
    }, [mode, initialData]);

    // ────────────────────────────────────────────────────────
    // Live preview
    // ────────────────────────────────────────────────────────
    const preview: EmployeeRevision[] = useMemo(() => {
        const template = templates.find((t) => t.id === templateId);
        if (!template) return [];

        return employees
            .filter((e) => selectedIds.includes(e.id))
            .map((e) => {
                const incrementAmount = calculateIncrement(e.ctc, template);
                const components = distributeAcrossComponents(
                    incrementAmount,
                    (e.components || []) as any
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
                    incrementPercent: e.ctc
                        ? (incrementAmount / e.ctc) * 100
                        : 0,
                    components,
                    effectiveFrom,
                };
            });
    }, [employees, selectedIds, templateId, templates, effectiveFrom]);

    const totalCost = preview.reduce((s, p) => s + p.incrementAmount, 0);

    // ────────────────────────────────────────────────────────
    // Submit handler (create OR update, then optional submit)
    // ────────────────────────────────────────────────────────
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
        if (!templateId) {
            showSnackbar("Please select a revision template", "warning");
            setActiveStep(2);
            return;
        }

        try {
            const payload = {
                title,
                reason,
                effectiveFrom,
                templateId,
                status: "DRAFT" as const,
                employees: preview,
                totalEmployees: preview.length,
                totalIncrementCost: totalCost,
            };

            let newId: string | undefined = revisionId;

            // ── Create OR Update ──
            if (mode === "edit" && revisionId) {
                await salaryRevisionService.updateRevision(revisionId, payload);
            } else {
                const res: any = await salaryRevisionService.createRevision(
                    payload
                );
                newId = res?.data?.id ?? res?.data?.data?.id;

                if (!newId) {
                    showSnackbar(
                        "Revision created, but ID missing in response",
                        "error"
                    );
                    navigate("/payroll/revision");
                    return;
                }
            }

            // ── Submit if requested ──
            if (!asDraft && newId) {
                try {
                    await salaryRevisionService.submitForApproval(newId);
                    showSnackbar("Revision submitted for approval", "success");
                } catch {
                    showSnackbar(
                        "Saved as draft, but submit failed. Open the revision to retry.",
                        "warning"
                    );
                }
            } else if (asDraft) {
                showSnackbar(
                    mode === "edit"
                        ? "Draft updated successfully"
                        : "Revision saved as draft",
                    "success"
                );
            }

            navigate("/payroll/revision");
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to save revision";
            showSnackbar(msg, "error");
        }
    };

    // ────────────────────────────────────────────────────────
    // Step navigation guard
    // ────────────────────────────────────────────────────────
    const canGoNext = (() => {
        if (activeStep === 0) {
            return Boolean(title.trim() && effectiveFrom);
        }
        if (activeStep === 1) {
            return selectedIds.length > 0 && templates.length > 0;
        }
        return true;
    })();

    return (
        <Box className="max-w-6xl">
            <div className="text-[12px] font-bold text-gray-800 mb-4">
                {mode === "edit" ? "Edit Salary Revision" : "New Salary Revision"}
            </div>

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

            {/* ══════════════════════════════════════════════ */}
            {/* STEP 1: Basic Info                             */}
            {/* ══════════════════════════════════════════════ */}
            {activeStep === 0 && (
                <Paper className="!p-4 !shadow-sm grid grid-cols-3 gap-4 !bg-white">
                    <TextField
                        label="Revision Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        fullWidth
                        required
                    />
                    <LocalizationProvider
                        dateAdapter={AdapterDayjs}
                        adapterLocale="en-gb"
                    >
                        <DatePicker
                            label="Effective From"
                            format="DD/MM/YYYY"
                            value={effectiveFrom ? dayjs(effectiveFrom) : null}
                            className="!bg-white-50"
                            onChange={(newValue) =>
                                setEffectiveFrom(
                                    newValue
                                        ? dayjs(newValue).format("YYYY-MM-DD")
                                        : ""
                                )
                            }
                            slotProps={{
                                textField: {
                                    fullWidth: true,
                                    required: true,
                                },
                            }}
                        />
                    </LocalizationProvider>
                    <TextField
                        label="Reason"
                        select
                        value={reason}
                        onChange={(e) =>
                            setReason(e.target.value as RevisionReason)
                        }
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

            {/* ══════════════════════════════════════════════ */}
            {/* STEP 2: Select Employees                       */}
            {/* ══════════════════════════════════════════════ */}
            {activeStep === 1 && (
                <TableContainer className="border border-gray-200 rounded-md max-h-[calc(100vh-220px)] overflow-auto">
                    <Table stickyHeader>
                        <TableHead className="!bg-gray-50">
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={
                                            employees.length > 0 &&
                                            selectedIds.length ===
                                                employees.length
                                        }
                                        className="text-gray-800"
                                        indeterminate={
                                            selectedIds.length > 0 &&
                                            selectedIds.length <
                                                employees.length
                                        }
                                        onChange={(e) =>
                                            setSelectedIds(
                                                e.target.checked
                                                    ? employees.map((x) => x.id)
                                                    : []
                                            )
                                        }
                                    />
                                </TableCell>
                                <TableCell className="!text-xs !font-semibold">
                                    Code
                                </TableCell>
                                <TableCell className="!text-xs !font-semibold">
                                    Name
                                </TableCell>
                                <TableCell className="!text-xs !font-semibold">
                                    Department
                                </TableCell>
                                <TableCell className="!text-xs !font-semibold">
                                    Designation
                                </TableCell>
                                <TableCell className="!text-xs !font-semibold">
                                    CTC
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {employeesLoading && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        align="center"
                                        className="!py-6 !text-xs !text-gray-500"
                                    >
                                        Loading employees…
                                    </TableCell>
                                </TableRow>
                            )}
                            {!employeesLoading &&
                                employees.map((e, i) => (
                                    <TableRow key={e.id} sx={getRowColor(i)}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedIds.includes(
                                                    e.id
                                                )}
                                                className="text-gray-800"
                                                onChange={(ev) =>
                                                    setSelectedIds((prev) =>
                                                        ev.target.checked
                                                            ? [...prev, e.id]
                                                            : prev.filter(
                                                                  (x) =>
                                                                      x !== e.id
                                                              )
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="!text-xs">
                                            <div className="py-2">{e.code}</div>
                                        </TableCell>
                                        <TableCell className="!text-xs">
                                            {e.name}
                                        </TableCell>
                                        <TableCell className="!text-xs">
                                            {e.dept}
                                        </TableCell>
                                        <TableCell className="!text-xs">
                                            {e.desig}
                                        </TableCell>
                                        <TableCell className="!text-xs">
                                            ₹ {e.ctc.toLocaleString("en-IN")}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            {!employeesLoading && employees.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        align="center"
                                        className="!py-6 !text-xs !text-gray-500"
                                    >
                                        No employees found. Please check with
                                        HR/admin.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* STEP 3: Revise & Preview                       */}
            {/* ══════════════════════════════════════════════ */}
            {activeStep === 2 && (
                <>
                    {templatesLoading ? (
                        <Paper className="!p-6 !my-3 !shadow-sm bg-white text-center text-xs text-gray-500">
                            Loading templates…
                        </Paper>
                    ) : templates.length === 0 ? (
                        <Paper className="!p-6 !my-3 !shadow-sm bg-white text-center">
                            <div className="text-xs text-gray-500 mb-2">
                                No revision templates available. Create one to
                                proceed.
                            </div>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() =>
                                    navigate("/payroll/revision/templates")
                                }
                            >
                                Create a Template
                            </Button>
                        </Paper>
                    ) : (
                        <>
                            <Paper className="!p-3 !pt-6 !my-3 !shadow-sm flex items-center gap-3 bg-white">
                                <TextField
                                    select
                                    label="Revision Template"
                                    value={templateId}
                                    onChange={(e) =>
                                        setTemplateId(e.target.value)
                                    }
                                    className="!w-72"
                                >
                                    {templates.map((t) => (
                                        <MenuItem key={t.id} value={t.id}>
                                            {t.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <Chip
                                    label={`Total Employees: ${preview.length}`}
                                    size="small"
                                    className="text-gray-800 bg-gray-200"
                                />
                                <Chip
                                    label={`Total Cost: ₹ ${totalCost.toLocaleString(
                                        "en-IN"
                                    )}`}
                                    color="primary"
                                    size="small"
                                />
                            </Paper>

                            <Table
                                size="small"
                                className="border border-gray-200 rounded-md"
                            >
                                <TableHead className="!bg-gray-50">
                                    <TableRow>
                                        <TableCell className="!text-xs !font-semibold">
                                            S No
                                        </TableCell>
                                        <TableCell className="!text-xs !font-semibold">
                                            Employee
                                        </TableCell>
                                        <TableCell className="!text-xs !font-semibold">
                                            Old CTC
                                        </TableCell>
                                        <TableCell className="!text-xs !font-semibold">
                                            New CTC
                                        </TableCell>
                                        <TableCell className="!text-xs !font-semibold">
                                            Increment
                                        </TableCell>
                                        <TableCell className="!text-xs !font-semibold">
                                            %
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {preview.map((p, i) => (
                                        <TableRow
                                            key={p.employeeId}
                                            sx={getRowColor(i)}
                                        >
                                            <TableCell>
                                                <div className="py-2">
                                                    {i + 1}
                                                </div>
                                            </TableCell>
                                            <TableCell className="!text-xs">
                                                {p.employeeName} (
                                                {p.employeeCode})
                                            </TableCell>
                                            <TableCell className="!text-xs">
                                                ₹{" "}
                                                {p.oldCtc.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </TableCell>
                                            <TableCell className="!text-xs !text-green-700">
                                                ₹{" "}
                                                {p.newCtc.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </TableCell>
                                            <TableCell className="!text-xs">
                                                ₹{" "}
                                                {p.incrementAmount.toLocaleString(
                                                    "en-IN"
                                                )}
                                            </TableCell>
                                            <TableCell className="!text-xs">
                                                {p.incrementPercent.toFixed(2)}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!preview.length && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                align="center"
                                            >
                                                <div className="!text-xs !py-6 !text-gray-500">
                                                    No employees selected.
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </>
            )}

            {/* ══════════════════════════════════════════════ */}
            {/* Footer Actions                                 */}
            {/* ══════════════════════════════════════════════ */}
            <Box className="flex justify-between mt-4">
                <Button
                    disabled={activeStep === 0}
                    className="!text-gray-800 !bg-gray-100"
                    onClick={() => setActiveStep((s) => s - 1)}
                >
                    Back
                </Button>
                <Box className="flex gap-2">
                    {activeStep === 2 && (
                        <>
                            <Button
                                variant="outlined"
                                className="!text-gray-800 !border-gray-200"
                                onClick={() => handleSubmit(true)}
                                disabled={!preview.length || !templateId}
                            >
                                {mode === "edit"
                                    ? "Update Draft"
                                    : "Save Draft"}
                            </Button>
                            <Button
                                variant="contained"
                                className="!bg-primary"
                                onClick={() => handleSubmit(false)}
                                disabled={!preview.length || !templateId}
                            >
                                Submit for Approval
                            </Button>
                        </>
                    )}
                    {activeStep < 2 && (
                        <Button
                            variant="contained"
                            className="!bg-primary"
                            disabled={!canGoNext}
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