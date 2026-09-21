import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Chip,
    Divider,
    IconButton,
    Paper,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Tabs,
    TextField,
} from "@mui/material";
import { formatDate } from "../../../utils/dateFormatter";
import { salaryRevisionService, type SalaryRevision } from "../../../services/modules/payrollServices/salaryRevision";
import { statusColor } from "../const";
import { getRowColor } from "../../const";
import { ArrowLeftIcon } from "@mui/x-date-pickers";
import { useUI } from "../../../context/Snackbar";

export default function RevisionDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [tab, setTab] = useState(0);
    const [data, setData] = useState<SalaryRevision | null>(null);
    const [remarks, setRemarks] = useState("");
    const { showSpinner,showSnackbar,hideSpinner } = useUI();

    const load = async () => {
        if (!id) return;
        showSpinner();
        try {
            const res: any = await salaryRevisionService.getRevisionById(id);
            setData(res.data);
        } catch (err) {
            showSnackbar("Failed to load revision details", "error");
            setData({
                id: id || "rev-101",
                revisionCode: "REV-2026-001",
                title: "Annual Increment 2026",
                reason: "ANNUAL_INCREMENT",
                effectiveFrom: "2026-04-01",
                status: "PENDING_APPROVAL",
                templateId: "t1",
                totalEmployees: 3,
                totalIncrementCost: 210000,
                createdBy: "hr.admin@company.com",
                createdAt: "2026-03-01T10:15:00Z",
                approvedBy: undefined,
                approvedAt: undefined,
                employees: [
                    {
                        employeeId: "501",
                        employeeCode: "EMP001",
                        employeeName: "Ravi Kumar",
                        department: "Engineering",
                        designation: "Software Engineer",
                        oldCtc: 800000,
                        newCtc: 880000,
                        oldGross: 60000,
                        newGross: 66666.67,
                        incrementAmount: 80000,
                        incrementPercent: 10,
                        effectiveFrom: "2026-04-01",
                        components: [
                            { componentId: "c1", componentName: "Basic", componentType: "EARNING", oldValue: 24000, newValue: 27200, delta: 3200, deltaPercent: 13.33 },
                            { componentId: "c2", componentName: "HRA", componentType: "EARNING", oldValue: 12000, newValue: 13600, delta: 1600, deltaPercent: 13.33 },
                            { componentId: "c3", componentName: "Special Allowance", componentType: "EARNING", oldValue: 24000, newValue: 27200, delta: 3200, deltaPercent: 13.33 },
                        ],
                    },
                    {
                        employeeId: "502",
                        employeeCode: "EMP002",
                        employeeName: "Priya Sharma",
                        department: "HR",
                        designation: "HR Executive",
                        oldCtc: 600000,
                        newCtc: 660000,
                        oldGross: 45000,
                        newGross: 50000,
                        incrementAmount: 60000,
                        incrementPercent: 10,
                        effectiveFrom: "2026-04-01",
                        components: [
                            { componentId: "c1", componentName: "Basic", componentType: "EARNING", oldValue: 18000, newValue: 20400, delta: 2400, deltaPercent: 13.33 },
                            { componentId: "c2", componentName: "HRA", componentType: "EARNING", oldValue: 9000, newValue: 10200, delta: 1200, deltaPercent: 13.33 },
                            { componentId: "c3", componentName: "Special Allowance", componentType: "EARNING", oldValue: 18000, newValue: 20400, delta: 2400, deltaPercent: 13.33 },
                        ],
                    },
                    {
                        employeeId: "503",
                        employeeCode: "EMP003",
                        employeeName: "Arjun Nair",
                        department: "Finance",
                        designation: "Accountant",
                        oldCtc: 700000,
                        newCtc: 770000,
                        oldGross: 52500,
                        newGross: 58333.33,
                        incrementAmount: 70000,
                        incrementPercent: 10,
                        effectiveFrom: "2026-04-01",
                        components: [
                            { componentId: "c1", componentName: "Basic", componentType: "EARNING", oldValue: 21000, newValue: 23800, delta: 2800, deltaPercent: 13.33 },
                            { componentId: "c2", componentName: "HRA", componentType: "EARNING", oldValue: 10500, newValue: 11900, delta: 1400, deltaPercent: 13.33 },
                            { componentId: "c3", componentName: "Special Allowance", componentType: "EARNING", oldValue: 21000, newValue: 23800, delta: 2800, deltaPercent: 13.33 },
                        ],
                    },
                ],
            } as any);
        } finally {
            hideSpinner();
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    if (!data) return <div className="text-xs text-gray-500">Not found.</div>;

    const handleApprove = async () => {
        await salaryRevisionService.approveRevision(data.id, remarks);
        load();
    };
    const handleReject = async () => {
        await salaryRevisionService.rejectRevision(data.id, remarks || "Rejected");
        load();
    };
    const handleApply = async () => {
        await salaryRevisionService.applyRevision(data.id);
        load();
    };

    return (
        <Box>
            <Box className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <IconButton
                        onClick={() => navigate("/payroll/revision")}
                        sx={{
                            border: `1px solid var(--border-color)`,
                            borderRadius: 1,
                        }}
                    >
                        <ArrowLeftIcon fontSize="small" className="text-gray-500" />
                    </IconButton>
                    <div>
                        <div className="font-bold text-[12px] text-gray-800">{data.title}</div>
                        <div className="text-[12px] text-gray-500">
                            {data.revisionCode} • Effective {formatDate(data.effectiveFrom)}
                        </div>
                    </div>
                </div>

                <Box className="flex gap-2 items-center">
                    <Chip label={data.status.replace(/_/g, " ")} color={statusColor[data.status]} />
                    {data.status === "PENDING_APPROVAL" && (
                        <>
                            <Button size="small" variant="contained" color="success" onClick={handleApprove}>
                                Approve
                            </Button>
                            <Button size="small" variant="outlined" color="error" onClick={handleReject}>
                                Reject
                            </Button>
                        </>
                    )}
                    {data.status === "APPROVED" && (
                        <Button
                            size="small"
                            variant="contained"
                            className="!bg-primary"
                            onClick={handleApply}
                        >
                            Apply to Payroll
                        </Button>
                    )}
                </Box>
            </Box>

            <Paper className="!shadow-sm !bg-white">
                <Tabs value={tab} onChange={(_, v) => setTab(v)} className="border-b border-gray-200" sx={{
                    "& .MuiTabs-indicator": {
                        backgroundColor: "var(--color-primary)",
                        height: 3,
                        borderRadius: "3px 3px 0 0",
                    },
                }}>
                    <Tab label="Summary" className="!text-gray-800" />
                    <Tab label="Employee Revisions" className="!text-gray-800" />
                    <Tab label="Component Breakdown" className="!text-gray-800" />
                </Tabs>

                {tab === 0 && (
                    <Box className="!p-4 grid grid-cols-3 gap-4 text-xs">
                        <div className="text-gray-800">
                            <b>Reason:</b> {data.reason.replace(/_/g, " ")}
                        </div>
                        <div className="text-gray-800">
                            <b>Employees:</b> {data.totalEmployees}
                        </div>
                        <div className="text-gray-800">
                            <b>Total Cost:</b> ₹ {data.totalIncrementCost.toLocaleString("en-IN")}
                        </div>
                        <div className="text-gray-800">
                            <b>Created By:</b> {data.createdBy}
                        </div>
                        <div className="text-gray-800">
                            <b>Created At:</b> {formatDate(data.createdAt)}
                        </div>
                        {data.approvedBy && (
                            <div className="text-gray-800">
                                <b>Approved By:</b> {data.approvedBy}
                            </div>
                        )}
                    </Box>
                )}

                {tab === 1 && (
                    <div className="p-4">
                        <Table size="small" className="border border-gray-200 rounded-md">
                            <TableHead className="!bg-gray-50">
                                <TableRow>
                                    <TableCell className="!text-xs !font-semibold">Employee</TableCell>
                                    <TableCell className="!text-xs !font-semibold">Old CTC</TableCell>
                                    <TableCell className="!text-xs !font-semibold">New CTC</TableCell>
                                    <TableCell className="!text-xs !font-semibold">Δ Amount</TableCell>
                                    <TableCell className="!text-xs !font-semibold">Δ %</TableCell>
                                    <TableCell className="!text-xs !font-semibold">Letter</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.employees.map((e, i) => (
                                    <TableRow key={e.employeeId} sx={getRowColor(i)}>
                                        <TableCell className="!text-xs">
                                            {e.employeeName} ({e.employeeCode})
                                        </TableCell>
                                        <TableCell className="!text-xs">
                                            ₹ {e.oldCtc.toLocaleString("en-IN")}
                                        </TableCell>
                                        <TableCell className="!text-xs !text-green-700">
                                            ₹ {e.newCtc.toLocaleString("en-IN")}
                                        </TableCell>
                                        <TableCell className="!text-xs">
                                            ₹ {e.incrementAmount.toLocaleString("en-IN")}
                                        </TableCell>
                                        <TableCell className="!text-xs">
                                            {e.incrementPercent.toFixed(2)}%
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                className="!text-xs"
                                                onClick={() =>
                                                    navigate(`/payroll/revision/${data.id}/letter/${e.employeeId}`)
                                                }
                                            >
                                                View / Download
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {tab === 2 && (
                    <Box className="!p-4 grid grid-cols-2 gap-4">
                        {data.employees.map((e) => (
                            <Box key={e.employeeId}>
                                <div className="text-xs font-semibold text-primary mb-2 ml-2">
                                    {e.employeeName} - components
                                </div>
                                <Table size="small" className="border border-gray-200 rounded-md">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell className="!text-xs">Component</TableCell>
                                            <TableCell className="!text-xs">Old</TableCell>
                                            <TableCell className="!text-xs">New</TableCell>
                                            <TableCell className="!text-xs">Δ</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {e.components.map((c, i) => (
                                            <TableRow key={c.componentId} sx={getRowColor(i)}>
                                                <TableCell className="!text-xs"><div className="p-2">{c.componentName}</div></TableCell>
                                                <TableCell className="!text-xs">
                                                    ₹ {c.oldValue.toLocaleString("en-IN")}
                                                </TableCell>
                                                <TableCell className="!text-xs">
                                                    ₹ {c.newValue.toLocaleString("en-IN")}
                                                </TableCell>
                                                <TableCell className="!text-xs !text-green-700">
                                                    +₹ {c.delta.toLocaleString("en-IN")}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>

            {data.status === "PENDING_APPROVAL" && (
                <Paper className="!p-3 !mt-3 !shadow-sm !bg-white">
                    <TextField
                        label="Remarks"
                        fullWidth
                        multiline
                        rows={2}
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                    />
                </Paper>
            )}
        </Box>
    );
}