import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Box, Button, Chip } from "@mui/material";
import { formatDate } from "../../../utils/dateFormatter";
import { salaryRevisionService } from "../../../services/modules/payrollServices/salaryRevision";
import { useUI } from "../../../context/Snackbar";
import BackButton from "../../../components/BackButton";
import { apiService } from "../../../services";
import { useAuth } from "../../../auth/authContext";
import { loadCompanyDetails } from "../../../utils/companyDetails";

const joinParts = (
    parts: Array<string | number | null | undefined>,
    sep = ", "
): string =>
    parts
        .filter((p) => p != null && String(p).trim() !== "")
        .join(sep);

const humanizeComponentType = (t: string | undefined): string => {
    if (!t) return "—";
    const map: Record<string, string> = {
        EARNING: "Earning",
        DEDUCTION: "Deduction",
        EMPLOYER_CONTRIBUTION: "Employer Contribution",
    };
    return map[t] ?? t.charAt(0) + t.slice(1).toLowerCase();
};

const capitalizeFirst = (s: string): string =>
    s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

const formatINR = (n: number): string => n.toLocaleString("en-IN");

const formatSigned = (n: number): string =>
    `${n >= 0 ? "+" : "-"}${formatINR(Math.abs(n))}`;

const formatPct = (pct: number | null): string => {
    if (pct == null || !isFinite(pct)) return "—";
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
};

export default function IncrementLetter() {
    const { id, employeeId } = useParams<{
        id: string;
        employeeId: string;
    }>();
    const [data, setData] = useState<any>(null);
    const [letterUrl, setLetterUrl] = useState<string | null>(null);
    const { showSnackbar, showSpinner, hideSpinner } = useUI();
    const companyDetails = loadCompanyDetails();
    const { session } = useAuth();

    // ── Load revision + employee ──
    useEffect(() => {
        if (!id) return;
        let cancelled = false;

        salaryRevisionService
            .getRevisionById(id)
            .then((res: any) => {
                if (cancelled) return;
                const revision = res.data;
                const emp = (revision.employees || []).find(
                    (e: any) => e.employeeId === employeeId
                );
                setData({ revision, employee: emp });

                if (
                    emp?.letterUrl &&
                    typeof emp.letterUrl === "string" &&
                    emp.letterUrl.trim() !== ""
                ) {
                    setLetterUrl(emp.letterUrl);
                } else {
                    setLetterUrl(null);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    showSnackbar(
                        "Failed to load revision for letter",
                        "error"
                    );
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id, employeeId]);

    // ── Download PDF ──
    const handleDownload = useCallback(async () => {
        if (!id || !employeeId || !letterUrl) return;
        showSpinner();
        try {
            await apiService.downloadFromPath(
                letterUrl,
                `Increment_Letter_${employeeId}.pdf`
            );
            showSnackbar("Letter downloaded successfully", "success");
        } catch {
            showSnackbar("Failed to download letter", "error");
        } finally {
            hideSpinner();
        }
    }, [id, employeeId, letterUrl, showSpinner, hideSpinner, showSnackbar]);

    // ── Derived values (memoized so hooks order is stable) ──
    const derived = useMemo(() => {
        if (!data?.employee) return null;

        const { revision, employee } = data;
        const components = employee.components || [];

        const companyName = session?.company?.companyName || "—";

        const companyAddressLine =
            joinParts([
                companyDetails?.companyAddress,
                companyDetails?.cityName,
                companyDetails?.stateName,
                companyDetails?.pincode,
            ]) || "—";

        const companyGstin = companyDetails?.gstNo?.trim() || null;
        const companyPlace = companyDetails?.cityName?.trim() || "—";

        // Fixed HR contact grammar
        const hrPhone = companyDetails?.phone?.trim();
        const hrContactLine = hrPhone
            ? `please contact HR at ${hrPhone}.`
            : "please contact the HR department.";

        const companyLogoUrl: string | null =
            session?.company?.logoUrl?.trim() || null;

        const letterDate = formatDate(
            revision.issuedAt ||
            revision.createdAt ||
            new Date().toISOString()
        );

        const oldCtc = Number(employee.oldCtc ?? 0);
        const newCtc = Number(employee.newCtc ?? 0);
        const oldGross = Number(employee.oldGross ?? 0);
        const newGross = Number(employee.newGross ?? 0);
        const incrementGross = newGross - oldGross;
        const incrementGrossPercent =
            oldGross > 0 ? (incrementGross / oldGross) * 100 : 0;

        const incrementAmount = newCtc - oldCtc;
        const incrementPercent =
            oldCtc > 0
                ? (incrementAmount / oldCtc) * 100
                : Number(employee.incrementPercent ?? 0);

        // ── Compute totals from components ──
        // const isEarning = (c: any) =>
        //     String(c.componentType || "").toUpperCase() === "EARNING";
        const isDeduction = (c: any) =>
            String(c.componentType || "").toUpperCase() === "DEDUCTION";

        const oldDeductions = components
            .filter(isDeduction)
            .reduce(
                (s: number, c: any) => s + Number(c.oldValue ?? 0),
                0
            );
        const newDeductions = components
            .filter(isDeduction)
            .reduce(
                (s: number, c: any) => s + Number(c.newValue ?? 0),
                0
            );

        const oldNetPay = oldGross - oldDeductions;
        const newNetPay = newGross - newDeductions;
        const incrementNetPay = newNetPay - oldNetPay;
        const incrementNetPayPercent =
            oldNetPay > 0 ? (incrementNetPay / oldNetPay) * 100 : 0;

        const incrementDeductions = newDeductions - oldDeductions;
        const incrementDeductionsPercent =
            oldDeductions > 0
                ? (incrementDeductions / oldDeductions) * 100
                : 0;

        const reasonRaw = (revision.reason || "")
            .replace(/_/g, " ")
            .toLowerCase()
            .trim();
        const reasonText = reasonRaw ? capitalizeFirst(reasonRaw) : "";

        const effectiveFromText = employee.effectiveFrom
            ? formatDate(employee.effectiveFrom)
            : "—";

        return {
            revision,
            employee,
            components,
            companyName,
            companyAddressLine,
            companyGstin,
            companyPlace,
            hrContactLine,
            companyLogoUrl,
            letterDate,
            oldCtc,
            newCtc,
            incrementAmount,
            incrementPercent,
            oldGross,
            newGross,
            incrementGross,
            incrementGrossPercent,
            oldDeductions,
            newDeductions,
            incrementDeductions,
            incrementDeductionsPercent,
            oldNetPay,
            newNetPay,
            incrementNetPay,
            incrementNetPayPercent,
            reasonText,
            effectiveFromText,
        };
    }, [data, session, companyDetails]);

    if (!derived) return null;

    const {
        revision,
        employee,
        components,
        companyName,
        companyAddressLine,
        companyGstin,
        companyPlace,
        hrContactLine,
        companyLogoUrl,
        letterDate,
        newGross,
        newNetPay,
        newDeductions,
        reasonText,
        effectiveFromText,
    } = derived;

    return (
        <div className="mb-3">
            {/* ── Toolbar ── */}
            <Box className="flex justify-between mb-3 items-center no-print">
                <div className="flex items-center gap-2">
                    <BackButton to={`/payroll/revision/${id}`} />
                    <div className="font-bold text-gray-500">
                        Salary Revision Letter
                    </div>
                    {!letterUrl && (
                        <Chip
                            size="small"
                            label="PDF not generated yet"
                            className="!bg-yellow-100 !text-yellow-800"
                        />
                    )}
                </div>
                <Button
                    variant="contained"
                    className="!bg-primary"
                    onClick={handleDownload}
                    disabled={!letterUrl}
                >
                    {letterUrl ? "Download PDF" : "PDF Not Available"}
                </Button>
            </Box>

            {/* ── Letter body ── */}
            <div className="letter-body p-4 shadow-sm max-w-3xl mx-auto text-sm leading-relaxed bg-white">
                <div className="flex justify-between items-center gap-4 border-b border-gray-200 pb-3 mb-3">
                    {companyLogoUrl ? (
                        <div className="w-40">
                            <img
                                src={companyLogoUrl}
                                alt={`${companyName} logo`}
                                className="max-w-full max-h-full object-contain"
                                onError={(e) => {
                                    (
                                        e.currentTarget as HTMLImageElement
                                    ).style.display = "none";
                                }}
                            />
                        </div>
                    ) : null}

                    <div className="text-right">
                        <div className="text-[12px] font-bold tracking-wide">
                            {companyName}
                        </div>
                        <div className="text-[11px] text-gray-600 mt-1">
                            {companyAddressLine}
                        </div>
                        {companyGstin && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                                GSTIN: {companyGstin}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Letter title ── */}
                <div className="text-center mb-3">
                    <div className="text-base font-bold underline">
                        SALARY REVISION LETTER
                    </div>
                    {(revision.revisionCode || letterDate) && (
                        <div className="text-[11px] text-gray-500 mt-1">
                            {revision.revisionCode && (
                                <>Ref No: {revision.revisionCode}</>
                            )}
                            {revision.revisionCode && letterDate && (
                                <> &nbsp;|&nbsp; </>
                            )}
                            {letterDate && <>Date: {letterDate}</>}
                        </div>
                    )}
                </div>

                {/* ── Employee block ── */}
                <div>
                    <div className="font-semibold">
                        {employee.employeeName}
                    </div>
                    {employee.employeeCode && (
                        <div className="text-[12px] text-gray-700">
                            {employee.employeeCode}
                        </div>
                    )}
                    {(employee.designation || employee.department) && (
                        <div className="text-[12px] text-gray-700">
                            {joinParts(
                                [
                                    employee.designation,
                                    employee.department,
                                ],
                                " — "
                            )}
                        </div>
                    )}
                    <div className="text-[12px] text-gray-700">
                        {companyName}
                    </div>
                </div>

                <p className="mt-2">
                    <b>Subject:</b> Revision of Salary with effect from{" "}
                    <b>{effectiveFromText}</b>
                </p>

                <p className="mt-2">Dear {employee.employeeName},</p>

                <p className="mt-2 text-justify">
                    We are pleased to inform you that in recognition of your
                    contributions and performance, your salary has been
                    revised with effect from <b>{effectiveFromText}</b>
                    {reasonText ? (
                        <>
                            {" "}
                            on account of <b>{reasonText}</b>
                        </>
                    ) : null}
                    . The revised salary structure is detailed below.
                </p>

                {/* ── Salary components table ── */}
                <table className="w-full mt-4 border-collapse">
                    <caption className="sr-only">
                        Salary component comparison: previous vs revised
                    </caption>
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border p-2 text-left text-xs">
                                Component
                            </th>
                            <th className="border p-2 text-left text-xs">
                                Type
                            </th>
                            <th className="border p-2 text-right text-xs">
                                Previous (₹)
                            </th>
                            <th className="border p-2 text-right text-xs">
                                Revised (₹)
                            </th>
                            <th className="border p-2 text-right text-xs">
                                Increase (₹)
                            </th>
                            <th className="border p-2 text-right text-xs">
                                %
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {components.map((c: any, idx: number) => {
                            const oldVal = Number(c.oldValue ?? 0);
                            const newVal = Number(c.newValue ?? 0);
                            const delta =
                                c.delta != null
                                    ? Number(c.delta)
                                    : newVal - oldVal;
                            const pct =
                                oldVal > 0
                                    ? Number(c.deltaPercent ?? 0)
                                    : null;
                            const isNewComponent = oldVal === 0 && newVal > 0;

                            return (
                                <tr
                                    key={
                                        c.componentId ??
                                        `${c.componentName}-${idx}`
                                    }
                                >
                                    <td className="border p-2 text-xs">
                                        {c.componentName}
                                    </td>
                                    <td className="border p-2 text-xs">
                                        {humanizeComponentType(
                                            c.componentType
                                        )}
                                    </td>
                                    <td className="border p-2 text-right text-xs">
                                        {formatINR(oldVal)}
                                    </td>
                                    <td className="border p-2 text-right text-xs">
                                        {formatINR(newVal)}
                                    </td>
                                    <td className="border p-2 text-right text-xs">
                                        {formatSigned(delta)}
                                    </td>
                                    <td className="border p-2 text-right text-xs">
                                        {isNewComponent
                                            ? "New"
                                            : formatPct(pct)}
                                    </td>
                                </tr>
                            );
                        })}

                        {components.length === 0 && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="border p-2 text-center text-xs text-gray-500"
                                >
                                    No components available.
                                </td>
                            </tr>
                        )}

                        {/* ── Total Gross row ── */}
                        {/* <tr className="font-bold bg-gray-50">
                            <td
                                className="border p-2 text-xs"
                                colSpan={2}
                            >
                                Total Gross (Monthly)
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {formatINR(oldGross)}
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {formatINR(newGross)}
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {formatSigned(incrementGross)}
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {formatPct(incrementGrossPercent)}
                            </td>
                        </tr> */}

                        {/* ── Total Deductions row ── */}
                        {/* <tr className="font-bold bg-gray-50">
                            <td
                                className="border p-2 text-xs"
                                colSpan={2}
                            >
                                Total Deductions
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {formatINR(oldDeductions)}
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {formatINR(newDeductions)}
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {formatSigned(incrementDeductions)}
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {oldDeductions > 0
                                    ? formatPct(
                                          incrementDeductionsPercent
                                      )
                                    : "—"}
                            </td>
                        </tr> */}

                        {/* ── Net Pay row ── */}
                        {/* <tr className="font-bold bg-gray-100">
                            <td
                                className="border p-2 text-xs"
                                colSpan={2}
                            >
                                Net Pay (Monthly)
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {formatINR(oldNetPay)}
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {formatINR(newNetPay)}
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {formatSigned(incrementNetPay)}
                            </td>
                            <td className="border p-2 text-right text-xs">
                                {oldNetPay > 0
                                    ? formatPct(incrementNetPayPercent)
                                    : "—"}
                            </td>
                        </tr> */}
                    </tbody>
                </table>

                {/* ── Summary highlight strip ── */}
                <div className="mt-3 text-xs flex justify-between border border-gray-200 rounded">
                    <div className="flex-1 flex justify-between items-center py-3 px-3 border-r">
                        <span>Total Gross (Monthly) (₹)</span>
                        <span className="font-bold text-green-700">
                            {formatINR(newGross)}
                        </span>
                    </div>

                    <div className="flex-1 flex justify-between items-center py-3 px-3 border-r">
                        <span>Total Deductions (₹)</span>
                        <span className="font-bold text-red-600">
                            {formatINR(newDeductions)}
                        </span>
                    </div>

                    <div className="flex-1 flex justify-between items-center py-3 px-3 bg-gray-100 rounded">
                        <span>Net Pay (Monthly) (₹)</span>
                        <span className="font-bold text-blue-700">
                            {formatINR(newNetPay)}
                        </span>
                    </div>
                </div>

                {/* ── Increment summary ── */}
                {/* <div className="mt-3 text-xs flex justify-between border border-gray-200 rounded">
                    <div className="flex-1 flex justify-between items-center py-3 px-3 border-r">
                        <span>Gross Increase (Monthly) (₹)</span>
                        <span className="font-bold text-green-700">
                            {formatSigned(incrementGross)} (
                            {formatPct(incrementGrossPercent)})
                        </span>
                    </div>

                    <div className="flex-1 flex justify-between items-center py-3 px-3 border-r">
                        <span>Net Increase (Monthly) (₹)</span>
                        <span className="font-bold text-blue-700">
                            {formatSigned(incrementNetPay)} (
                            {formatPct(incrementNetPayPercent)})
                        </span>
                    </div>

                    <div className="flex-1 flex justify-between items-center py-3 px-3 bg-gray-100 rounded">
                        <span>Annual CTC Increase (₹)</span>
                        <span className="font-bold text-green-700">
                            {formatSigned(incrementAmount)} (
                            {formatPct(incrementPercent)})
                        </span>
                    </div>
                </div> */}

                {/* ── Terms & Conditions ── */}
                <div className="mt-4">
                    <p className="font-semibold text-[13px]">
                        Terms &amp; Conditions:
                    </p>
                    <ol className="list-decimal pl-6 mt-2 space-y-1 text-[12px] text-gray-700">
                        <li>
                            This revision is effective from{" "}
                            <b>{effectiveFromText}</b> and is subject to
                            company policy.
                        </li>
                        <li>
                            All other terms and conditions of your employment
                            remain unchanged.
                        </li>
                        <li>
                            This letter is confidential and should not be
                            shared with any third party.
                        </li>
                        <li>
                            The company reserves the right to revise or amend
                            the salary structure as per business needs.
                        </li>
                    </ol>
                </div>

                <p className="mt-2 text-justify">
                    We appreciate your continued contribution and wish you
                    greater success in the future.
                </p>

                {/* ── Signature block ── */}
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[12px] text-gray-700">
                            Place: {companyPlace}
                        </p>
                        <p className="text-[12px] text-gray-700 mt-1">
                            Date: {letterDate}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="h-12" />
                        <p className="font-bold text-[13px]">
                            For {companyName}
                        </p>
                        <p className="text-[12px] mt-1">
                            Authorised Signatory
                        </p>
                        <p className="text-[11px] text-gray-500">
                            HR Department
                        </p>
                    </div>
                </div>

                {/* ── Query contact ── */}
                <p className="mt-4 text-[11px] text-gray-500 text-center">
                    For any queries regarding this revision,{" "}
                    {hrContactLine}
                </p>

                {/* ── Acknowledgement ── */}
                <div className="mt-4 pt-6 border-t border-dashed border-gray-300">
                    <p className="font-semibold text-[13px] mb-2">
                        Employee Acknowledgement
                    </p>
                    <p className="text-[12px] text-gray-700 mb-4">
                        I, <b>{employee.employeeName}</b>
                        {employee.employeeCode
                            ? ` (${employee.employeeCode})`
                            : ""}
                        , acknowledge receipt of this salary revision letter
                        and accept the revised terms.
                    </p>
                    <div className="flex justify-between text-[12px]">
                        <div>
                            <div className="border-t border-gray-400 w-48 mt-8 pt-1">
                                Employee Signature
                            </div>
                        </div>
                        <div>
                            <div className="border-t border-gray-400 w-32 mt-8 pt-1">
                                Date
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}